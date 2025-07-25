-- ================================================================
-- TRIGGERS E RLS PARA SISTEMA DE GESTÃO DE USUÁRIOS ADMIN
-- ================================================================
-- Adiciona integração com Supabase Auth e políticas de segurança
-- Execute após admin_user_management.sql

-- ================================================================
-- 1. TRIGGER PARA CRIAR PERFIL AUTOMÁTICO APÓS AUTH
-- ================================================================

-- Função para criar perfil automático quando usuário é criado via convite
CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS TRIGGER AS $$
DECLARE
    invitation_record RECORD;
    profile_id UUID;
BEGIN
    -- Buscar convite aceito para este email
    SELECT * INTO invitation_record
    FROM public.user_invitations
    WHERE email = NEW.email
      AND status = 'accepted'
    ORDER BY updated_at DESC
    LIMIT 1;

    -- Se encontrou convite aceito, criar perfil com os dados do convite
    IF invitation_record IS NOT NULL THEN
        INSERT INTO public.user_profiles (
            id,
            email,
            name,
            role,
            agency_id,
            company,
            phone,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            invitation_record.name,
            invitation_record.role,
            invitation_record.agency_id,
            invitation_record.company,
            invitation_record.phone,
            NOW(),
            NOW()
        ) RETURNING id INTO profile_id;

        -- Registrar ação de criação de perfil
        INSERT INTO public.admin_actions (
            admin_id,
            action_type,
            target_user_id,
            details,
            created_at
        ) VALUES (
            invitation_record.invited_by,
            'user_profile_created',
            NEW.id,
            json_build_object(
                'invitation_id', invitation_record.id,
                'user_email', NEW.email,
                'user_name', invitation_record.name,
                'user_role', invitation_record.role,
                'agency_id', invitation_record.agency_id
            ),
            NOW()
        );

        RAISE LOG 'Perfil criado automaticamente para usuário % via convite %', NEW.email, invitation_record.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar após inserção no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_from_invitation ON auth.users;
CREATE TRIGGER on_auth_user_created_from_invitation
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_from_invitation();

-- ================================================================
-- 2. FUNÇÃO PARA VERIFICAR PERMISSÕES DE USUÁRIO
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_permissions()
RETURNS JSON AS $$
DECLARE
    current_user_id UUID := auth.uid();
    user_data RECORD;
    permissions JSON;
BEGIN
    -- Se não há usuário logado
    IF current_user_id IS NULL THEN
        RETURN '{"role": null, "agency_id": null, "can_manage_users": false, "can_invite_users": false}'::JSON;
    END IF;

    -- Buscar dados do usuário atual
    SELECT role, agency_id
    INTO user_data
    FROM public.user_profiles
    WHERE id = current_user_id;

    -- Se usuário não tem perfil
    IF user_data IS NULL THEN
        RETURN '{"role": null, "agency_id": null, "can_manage_users": false, "can_invite_users": false}'::JSON;
    END IF;

    -- Definir permissões baseado no role
    permissions := json_build_object(
        'role', user_data.role,
        'agency_id', user_data.agency_id,
        'can_manage_users', CASE 
            WHEN user_data.role = 'admin' THEN true
            WHEN user_data.role = 'agency_owner' THEN true
            ELSE false
        END,
        'can_invite_users', CASE 
            WHEN user_data.role = 'admin' THEN true
            WHEN user_data.role = 'agency_owner' THEN true
            WHEN user_data.role = 'agency_staff' THEN true
            ELSE false
        END,
        'can_manage_all_agencies', CASE 
            WHEN user_data.role = 'admin' THEN true
            ELSE false
        END
    );

    RETURN permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 3. RLS POLICIES PARA USER_INVITATIONS
-- ================================================================

-- Habilitar RLS na tabela user_invitations (se ainda não estiver)
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "user_invitations_select_policy" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_insert_policy" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_update_policy" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_delete_policy" ON public.user_invitations;

-- SELECT: Admins veem todos, agency_owners veem da sua agência
CREATE POLICY "user_invitations_select_policy" ON public.user_invitations
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            -- Admin global pode ver todos
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
            OR
            -- Agency owner pode ver convites da sua agência
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid() 
                  AND up.role = 'agency_owner'
                  AND up.agency_id = user_invitations.agency_id
            )
            OR
            -- Agency staff pode ver convites da sua agência
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid() 
                  AND up.role = 'agency_staff'
                  AND up.agency_id = user_invitations.agency_id
            )
        )
    );

-- INSERT: Apenas admins e agency_owners podem criar convites
CREATE POLICY "user_invitations_insert_policy" ON public.user_invitations
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            -- Admin global pode criar qualquer convite
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
            OR
            -- Agency owner pode criar convites para sua agência
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid() 
                  AND up.role = 'agency_owner'
                  AND up.agency_id = user_invitations.agency_id
            )
        )
    );

-- UPDATE: Mesmo critério do SELECT, mas só quem criou ou tem permissão
CREATE POLICY "user_invitations_update_policy" ON public.user_invitations
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND (
            -- Admin global pode editar todos
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
            OR
            -- Agency owner pode editar convites da sua agência
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid() 
                  AND up.role = 'agency_owner'
                  AND up.agency_id = user_invitations.agency_id
            )
            OR
            -- Quem criou o convite pode editá-lo
            invited_by = auth.uid()
        )
    );

-- DELETE: Apenas admins globais
CREATE POLICY "user_invitations_delete_policy" ON public.user_invitations
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ================================================================
-- 4. RLS POLICIES PARA ADMIN_ACTIONS
-- ================================================================

-- Habilitar RLS na tabela admin_actions (se ainda não estiver)
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "admin_actions_select_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "admin_actions_insert_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "admin_actions_update_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "admin_actions_delete_policy" ON public.admin_actions;

-- SELECT: Admins veem todos, agency_owners veem ações relacionadas à sua agência
CREATE POLICY "admin_actions_select_policy" ON public.admin_actions
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            -- Admin global pode ver todas as ações
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
            OR
            -- Agency owner pode ver ações relacionadas à sua agência
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid() 
                  AND up.role = 'agency_owner'
                  AND (
                    -- Ações que ele mesmo fez
                    admin_actions.admin_id = auth.uid()
                    OR
                    -- Ações relacionadas a usuários da sua agência
                    EXISTS (
                        SELECT 1 FROM public.user_profiles target_user
                        WHERE target_user.id = admin_actions.target_user_id
                          AND target_user.agency_id = up.agency_id
                    )
                  )
            )
            OR
            -- Usuário pode ver ações feitas sobre ele mesmo
            target_user_id = auth.uid()
        )
    );

-- INSERT: Sistema adiciona automaticamente (SECURITY DEFINER nas funções)
CREATE POLICY "admin_actions_insert_policy" ON public.admin_actions
    FOR INSERT
    WITH CHECK (
        -- Permitir inserção apenas para usuários autenticados
        -- (o controle real é feito nas funções SECURITY DEFINER)
        auth.uid() IS NOT NULL
    );

-- UPDATE/DELETE: Apenas admins globais
CREATE POLICY "admin_actions_update_policy" ON public.admin_actions
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "admin_actions_delete_policy" ON public.admin_actions
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ================================================================
-- 5. ATUALIZAR FUNÇÕES EXISTENTES PARA USAR AUTH.UID()
-- ================================================================

-- Atualizar função create_user_invitation para usar o usuário atual
CREATE OR REPLACE FUNCTION public.create_user_invitation(
    p_email VARCHAR(255),
    p_name VARCHAR(255),
    p_role VARCHAR(50),
    p_agency_id UUID DEFAULT NULL,
    p_company VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL,
    p_welcome_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    invitation_id UUID;
    invitation_token VARCHAR(255);
    temp_password VARCHAR(12);
    current_user_id UUID := auth.uid();
    admin_data RECORD;
BEGIN
    -- Verificar se usuário está autenticado
    IF current_user_id IS NULL THEN
        RETURN '{"error": "Usuário não autenticado"}'::JSON;
    END IF;

    -- Verificar se o usuário atual é admin ou agency_owner
    SELECT id, role, agency_id 
    INTO admin_data
    FROM public.user_profiles
    WHERE id = current_user_id;

    IF admin_data IS NULL THEN
        RETURN '{"error": "Perfil de usuário não encontrado"}'::JSON;
    END IF;

    -- Verificar permissões
    IF admin_data.role NOT IN ('admin', 'agency_owner') THEN
        RETURN '{"error": "Sem permissão para criar convites"}'::JSON;
    END IF;

    -- Se não é admin global, verificar se agency_id é válido
    IF admin_data.role != 'admin' AND (p_agency_id IS NULL OR p_agency_id != admin_data.agency_id) THEN
        RETURN '{"error": "Você só pode criar convites para sua própria agência"}'::JSON;
    END IF;

    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN '{"error": "Email já cadastrado no sistema"}'::JSON;
    END IF;

    -- Verificar se já existe convite pendente para este email
    IF EXISTS (SELECT 1 FROM public.user_invitations WHERE email = p_email AND status = 'pending') THEN
        RETURN '{"error": "Já existe convite pendente para este email"}'::JSON;
    END IF;

    -- Gerar IDs e tokens
    invitation_id := gen_random_uuid();
    invitation_token := encode(gen_random_bytes(32), 'hex');
    temp_password := encode(gen_random_bytes(8), 'base64');

    -- Inserir convite
    INSERT INTO public.user_invitations (
        id, email, name, role, agency_id, company, phone, welcome_message,
        invited_by, invitation_token, temp_password, status, expires_at, created_at
    ) VALUES (
        invitation_id, p_email, p_name, p_role, p_agency_id, p_company, p_phone, p_welcome_message,
        current_user_id, invitation_token, temp_password, 'pending', 
        NOW() + INTERVAL '7 days', NOW()
    );

    -- Registrar ação administrativa
    INSERT INTO public.admin_actions (
        admin_id, action_type, target_email, details, created_at
    ) VALUES (
        current_user_id, 'user_invitation_created', p_email,
        json_build_object(
            'invitation_id', invitation_id,
            'target_name', p_name,
            'target_role', p_role,
            'target_agency_id', p_agency_id,
            'expires_at', (NOW() + INTERVAL '7 days')::TEXT
        ),
        NOW()
    );

    RETURN json_build_object(
        'success', true,
        'invitation_id', invitation_id,
        'invitation_url', format('%s/accept-invitation?token=%s', 
            current_setting('app.base_url', true), invitation_id),
        'expires_at', (NOW() + INTERVAL '7 days')::TEXT
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função get_pending_invitations para respeitar RLS
CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    company VARCHAR(255),
    agency_name VARCHAR(255),
    invited_by_name VARCHAR(255),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    current_user_id UUID := auth.uid();
    user_permissions JSON;
BEGIN
    -- Verificar se usuário está autenticado
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Obter permissões do usuário atual
    user_permissions := public.get_current_user_permissions();

    -- Se não pode gerenciar usuários, retornar vazio
    IF NOT (user_permissions->>'can_manage_users')::BOOLEAN THEN
        RETURN;
    END IF;

    -- Retornar convites baseado nas permissões (RLS aplicará automaticamente)
    RETURN QUERY
    SELECT 
        ui.id,
        ui.email,
        ui.name,
        ui.role,
        ui.company,
        a.name as agency_name,
        up.name as invited_by_name,
        ui.expires_at,
        ui.created_at
    FROM public.user_invitations ui
    LEFT JOIN public.agencies a ON ui.agency_id = a.id
    LEFT JOIN public.user_profiles up ON ui.invited_by = up.id
    WHERE ui.status = 'pending'
      AND ui.expires_at > NOW()
    ORDER BY ui.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 6. CONFIGURAÇÃO ADICIONAL
-- ================================================================

-- Configurar URL base da aplicação (ajuste conforme necessário)
-- Esta configuração será usada para gerar os links de convite
DO $$
BEGIN
    -- Tentar definir a URL base (pode ser sobrescrita via variável de ambiente)
    PERFORM set_config('app.base_url', 'http://localhost:3000', false);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar erros de configuração
        NULL;
END $$;

-- ================================================================
-- 7. GRANTS E PERMISSÕES
-- ================================================================

-- Garantir que as funções podem ser executadas por usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_current_user_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_invitation(VARCHAR, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_user_invitation(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_invitation(UUID) TO authenticated;

-- Grants para as tabelas (authenticated role já tem através do RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_actions TO authenticated;

-- ================================================================
-- 8. LIMPEZA E MANUTENÇÃO
-- ================================================================

-- Função para limpar convites expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.user_invitations
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Registrar limpeza no log
    INSERT INTO public.admin_actions (
        admin_id, action_type, details, created_at
    ) VALUES (
        NULL, 'system_cleanup', 
        json_build_object('expired_invitations', expired_count),
        NOW()
    );
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant para função de limpeza
GRANT EXECUTE ON FUNCTION public.cleanup_expired_invitations() TO authenticated;

-- ================================================================
-- CONFIRMAÇÃO
-- ================================================================

SELECT 'Triggers, RLS e permissões para sistema de gestão de usuários configurados com sucesso!' as status;
