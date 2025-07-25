-- ==========================================
-- SISTEMA DE GESTAO DE USUARIOS PELO ADMIN
-- ==========================================
-- Adicionar tabelas e funcoes para admin gerenciar usuarios=========================================
-- SISTEMA DE GESTÃƒO DE USUÃRIOS PELO ADMIN
-- ==========================================
-- Adicionar tabelas e funÃ§Ãµes para admin gerenciar usuÃ¡rios

-- Tabela de convites pendentes
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados do usuario a ser criado
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'client',
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  company VARCHAR(255),
  phone VARCHAR(20),
  
  -- Configuracoes do convite
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days') NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados opcionais
  welcome_message TEXT,
  -- senha temporaria gerada
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de logs de acoes do admin
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- create_user, delete_user, update_user, create_agency, etc
  target_type VARCHAR(50), -- user, agency, project, etc
  target_id UUID,
  
  -- Detalhes da acao
  action_description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- dados adicionais da aÃ§Ã£o
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- CONSTRAINTS E VALIDACOES
-- ==========================================

DO $$
BEGIN
  -- User invitations
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'user_invitations_role_check') THEN
    ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_role_check 
    CHECK (role IN ('admin', 'agency_owner', 'agency_staff', 'client'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'user_invitations_status_check') THEN
    ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));
  END IF;
END $$;

-- ==========================================
-- ÃNDICES
-- ==========================================

DO $$
BEGIN
  -- User invitations indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_invitations_token') THEN
    CREATE UNIQUE INDEX idx_user_invitations_token ON public.user_invitations(invitation_token);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_invitations_status') THEN
    CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_invitations_expires_at') THEN
    CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations(expires_at);
  END IF;

  -- Admin actions indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_actions_admin_id') THEN
    CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_actions_created_at') THEN
    CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at);
  END IF;
END $$;

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- ===== USER INVITATIONS =====
  
  -- Admin pode gerenciar todos os convites
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'Admin can manage all invitations') THEN
    CREATE POLICY "Admin can manage all invitations" ON public.user_invitations FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- Agency owners podem gerenciar convites de sua agÃªncia
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'Agency owners can manage agency invitations') THEN
    CREATE POLICY "Agency owners can manage agency invitations" ON public.user_invitations FOR ALL 
    USING (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'agency_owner'
      )
    )
    WITH CHECK (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'agency_owner'
      )
    );
  END IF;

  -- ===== ADMIN ACTIONS =====
  
  -- Admin pode ver todos os logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'Admin can view all actions') THEN
    CREATE POLICY "Admin can view all actions" ON public.admin_actions FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- Sistema pode inserir logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'System can log actions') THEN
    CREATE POLICY "System can log actions" ON public.admin_actions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ==========================================
-- FUNÃ‡Ã•ES PRINCIPAIS
-- ==========================================

-- FunÃ§Ã£o para criar convite de usuÃ¡rio
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_email VARCHAR(255),
  p_name VARCHAR(255),
  p_role VARCHAR(50),
  p_agency_id UUID DEFAULT NULL,
  p_company VARCHAR(255) DEFAULT NULL,
  p_phone VARCHAR(20) DEFAULT NULL,
  p_welcome_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_data RECORD;
    invitation_id UUID;
    invitation_token VARCHAR(255);
    temp_password VARCHAR(12);
BEGIN
    -- Verificar se o usuÃ¡rio atual Ã© admin ou agency_owner
    SELECT id, role, agency_id INTO admin_data 
    FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'agency_owner');
    
    IF admin_data IS NULL THEN
        RETURN '{"error": "Unauthorized: Only admins and agency owners can create invitations"}';
    END IF;
    
    -- Se Ã© agency_owner, sÃ³ pode convidar para sua prÃ³pria agÃªncia
    IF admin_data.role = 'agency_owner' AND (p_agency_id IS NULL OR p_agency_id != admin_data.agency_id) THEN
        RETURN '{"error": "Agency owners can only invite users to their own agency"}';
    END IF;
    
    -- Verificar se email jÃ¡ existe
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = p_email) THEN
        RETURN '{"error": "User with this email already exists"}';
    END IF;
    
    -- Verificar se jÃ¡ existe convite pendente
    IF EXISTS (SELECT 1 FROM public.user_invitations WHERE email = p_email AND status = 'pending' AND expires_at > now()) THEN
        RETURN '{"error": "Pending invitation already exists for this email"}';
    END IF;
    
    -- Gerar token e senha temporÃ¡ria
    invitation_token := encode(gen_random_bytes(32), 'base64');
    temp_password := encode(gen_random_bytes(8), 'base64');
    
    -- Criar convite
    INSERT INTO public.user_invitations (
        email, invited_by, name, role, agency_id, company, phone, 
        invitation_token, temp_password, welcome_message
    ) VALUES (
        p_email, auth.uid(), p_name, p_role, p_agency_id, p_company, p_phone,
        invitation_token, temp_password, p_welcome_message
    ) RETURNING id INTO invitation_id;
    
    -- Log da aÃ§Ã£o
    INSERT INTO public.admin_actions (
        admin_id, action_type, target_type, target_id, action_description, metadata
    ) VALUES (
        auth.uid(), 'create_invitation', 'user_invitation', invitation_id,
        format('Created invitation for %s (%s) with role %s', p_name, p_email, p_role),
        json_build_object('email', p_email, 'role', p_role, 'agency_id', p_agency_id)
    );
    
    RETURN json_build_object(
        'success', true,
        'invitation_id', invitation_id,
        'invitation_token', invitation_token,
        'temp_password', temp_password,
        'invitation_url', format('https://dashboard.fvstudios.com/accept-invitation?token=%s', invitation_token)
    );
END;
$$;

-- FunÃ§Ã£o para aceitar convite e criar usuÃ¡rio
CREATE OR REPLACE FUNCTION public.accept_user_invitation(
  p_token VARCHAR(255),
  p_password VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_data RECORD;
    new_user_id UUID;
BEGIN
    -- Buscar convite vÃ¡lido
    SELECT * INTO invitation_data 
    FROM public.user_invitations 
    WHERE invitation_token = p_token 
      AND status = 'pending' 
      AND expires_at > now();
    
    IF invitation_data IS NULL THEN
        RETURN '{"error": "Invalid or expired invitation token"}';
    END IF;
    
    -- Verificar se email jÃ¡ existe (double check)
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = invitation_data.email) THEN
        RETURN '{"error": "User with this email already exists"}';
    END IF;
    
    -- Gerar UUID para o novo usuÃ¡rio
    new_user_id := gen_random_uuid();
    
    -- Criar perfil do usuÃ¡rio
    INSERT INTO public.user_profiles (
        id, email, name, role, agency_id, company, phone, subscription_status
    ) VALUES (
        new_user_id, invitation_data.email, invitation_data.name, invitation_data.role, 
        invitation_data.agency_id, invitation_data.company, invitation_data.phone, 'active'
    );
    
    -- Se Ã© cliente, criar configuraÃ§Ã£o de API
    IF invitation_data.role = 'client' THEN
        INSERT INTO public.client_api_configs (client_id) 
        VALUES (new_user_id) 
        ON CONFLICT (client_id) DO NOTHING;
    END IF;
    
    -- Marcar convite como aceito
    UPDATE public.user_invitations 
    SET status = 'accepted', accepted_at = now(), updated_at = now()
    WHERE id = invitation_data.id;
    
    -- Log da aÃ§Ã£o
    INSERT INTO public.admin_actions (
        admin_id, action_type, target_type, target_id, action_description, metadata
    ) VALUES (
        invitation_data.invited_by, 'accept_invitation', 'user', new_user_id,
        format('User %s (%s) accepted invitation and was created', invitation_data.name, invitation_data.email),
        json_build_object('invitation_id', invitation_data.id, 'user_id', new_user_id)
    );
    
    -- Criar notificaÃ§Ã£o para quem convidou
    INSERT INTO public.notifications (
        title, message, type, priority, user_id, related_entity_type, related_entity_id
    ) VALUES (
        'Convite Aceito',
        format('O usuÃ¡rio %s (%s) aceitou seu convite e jÃ¡ pode acessar o sistema.', invitation_data.name, invitation_data.email),
        'success',
        'medium',
        invitation_data.invited_by,
        'user',
        new_user_id
    );
    
    RETURN json_build_object(
        'success', true,
        'user_id', new_user_id,
        'message', 'Invitation accepted successfully. Account created.',
        'redirect_to', '/login'
    );
END;
$$;

-- FunÃ§Ã£o para listar convites pendentes
CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    company VARCHAR(255),
    agency_name VARCHAR(255),
    invited_by_name VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role VARCHAR(50);
    user_agency_id UUID;
BEGIN
    -- Verificar role do usuÃ¡rio atual
    SELECT up.role, up.agency_id INTO user_role, user_agency_id
    FROM public.user_profiles up 
    WHERE up.id = auth.uid();
    
    IF user_role IS NULL THEN
        RETURN;
    END IF;
    
    -- Admin vÃª todos os convites
    IF user_role = 'admin' THEN
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
        WHERE ui.status = 'pending' AND ui.expires_at > now()
        ORDER BY ui.created_at DESC;
    
    -- Agency owner vÃª apenas convites de sua agÃªncia
    ELSIF user_role = 'agency_owner' THEN
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
          AND ui.expires_at > now()
          AND ui.agency_id = user_agency_id
        ORDER BY ui.created_at DESC;
    END IF;
END;
$$;

-- FunÃ§Ã£o para cancelar convite
CREATE OR REPLACE FUNCTION public.cancel_invitation(p_invitation_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_data RECORD;
    user_role VARCHAR(50);
    user_agency_id UUID;
BEGIN
    -- Verificar dados do usuÃ¡rio atual
    SELECT role, agency_id INTO user_role, user_agency_id
    FROM public.user_profiles WHERE id = auth.uid();
    
    -- Buscar convite
    SELECT * INTO invitation_data 
    FROM public.user_invitations 
    WHERE id = p_invitation_id AND status = 'pending';
    
    IF invitation_data IS NULL THEN
        RETURN '{"error": "Invitation not found or already processed"}';
    END IF;
    
    -- Verificar permissÃµes
    IF user_role = 'agency_owner' AND invitation_data.agency_id != user_agency_id THEN
        RETURN '{"error": "You can only cancel invitations for your own agency"}';
    END IF;
    
    IF user_role NOT IN ('admin', 'agency_owner') THEN
        RETURN '{"error": "Unauthorized"}';
    END IF;
    
    -- Cancelar convite
    UPDATE public.user_invitations 
    SET status = 'cancelled', updated_at = now()
    WHERE id = p_invitation_id;
    
    -- Log da aÃ§Ã£o
    INSERT INTO public.admin_actions (
        admin_id, action_type, target_type, target_id, action_description
    ) VALUES (
        auth.uid(), 'cancel_invitation', 'user_invitation', p_invitation_id,
        format('Cancelled invitation for %s (%s)', invitation_data.name, invitation_data.email)
    );
    
    RETURN json_build_object('success', true, 'message', 'Invitation cancelled successfully');
END;
$$;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger para updated_at
CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON public.user_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DADOS INICIAIS
-- ==========================================

-- Marcar convites expirados automaticamente (funÃ§Ã£o para ser executada periodicamente)
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.user_invitations 
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending' AND expires_at <= now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$;

SELECT 'Sistema de gestÃ£o de usuÃ¡rios pelo admin criado!' AS status,
       'FunÃ§Ãµes: 4, Tabelas: 2, Admin pode criar usuÃ¡rios pelo dashboard' AS summary;
-- ================================================================
-- TRIGGERS E RLS PARA SISTEMA DE GESTÃƒO DE USUÃRIOS ADMIN
-- ================================================================
-- Adiciona integraÃ§Ã£o com Supabase Auth e polÃ­ticas de seguranÃ§a
-- Execute apÃ³s admin_user_management.sql

-- ================================================================
-- 1. TRIGGER PARA CRIAR PERFIL AUTOMÃTICO APÃ“S AUTH
-- ================================================================

-- FunÃ§Ã£o para criar perfil automÃ¡tico quando usuÃ¡rio Ã© criado via convite
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

        -- Registrar aÃ§Ã£o de criaÃ§Ã£o de perfil
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

        RAISE LOG 'Perfil criado automaticamente para usuÃ¡rio % via convite %', NEW.email, invitation_record.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar apÃ³s inserÃ§Ã£o no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_from_invitation ON auth.users;
CREATE TRIGGER on_auth_user_created_from_invitation
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_from_invitation();

-- ================================================================
-- 2. FUNÃ‡ÃƒO PARA VERIFICAR PERMISSÃ•ES DE USUÃRIO
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_permissions()
RETURNS JSON AS $$
DECLARE
    current_user_id UUID := auth.uid();
    user_data RECORD;
    permissions JSON;
BEGIN
    -- Se nÃ£o hÃ¡ usuÃ¡rio logado
    IF current_user_id IS NULL THEN
        RETURN '{"role": null, "agency_id": null, "can_manage_users": false, "can_invite_users": false}'::JSON;
    END IF;

    -- Buscar dados do usuÃ¡rio atual
    SELECT role, agency_id
    INTO user_data
    FROM public.user_profiles
    WHERE id = current_user_id;

    -- Se usuÃ¡rio nÃ£o tem perfil
    IF user_data IS NULL THEN
        RETURN '{"role": null, "agency_id": null, "can_manage_users": false, "can_invite_users": false}'::JSON;
    END IF;

    -- Definir permissÃµes baseado no role
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

-- Habilitar RLS na tabela user_invitations (se ainda nÃ£o estiver)
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Remover polÃ­ticas existentes (se houver)
DROP POLICY IF EXISTS "user_invitations_select_policy" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_insert_policy" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_update_policy" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_delete_policy" ON public.user_invitations;

-- SELECT: Admins veem todos, agency_owners veem da sua agÃªncia
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
            -- Agency owner pode ver convites da sua agÃªncia
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid() 
                  AND up.role = 'agency_owner'
                  AND up.agency_id = user_invitations.agency_id
            )
            OR
            -- Agency staff pode ver convites da sua agÃªncia
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
            -- Agency owner pode criar convites para sua agÃªncia
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid() 
                  AND up.role = 'agency_owner'
                  AND up.agency_id = user_invitations.agency_id
            )
        )
    );

-- UPDATE: Mesmo critÃ©rio do SELECT, mas sÃ³ quem criou ou tem permissÃ£o
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
            -- Agency owner pode editar convites da sua agÃªncia
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid() 
                  AND up.role = 'agency_owner'
                  AND up.agency_id = user_invitations.agency_id
            )
            OR
            -- Quem criou o convite pode editÃ¡-lo
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

-- Habilitar RLS na tabela admin_actions (se ainda nÃ£o estiver)
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Remover polÃ­ticas existentes (se houver)
DROP POLICY IF EXISTS "admin_actions_select_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "admin_actions_insert_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "admin_actions_update_policy" ON public.admin_actions;
DROP POLICY IF EXISTS "admin_actions_delete_policy" ON public.admin_actions;

-- SELECT: Admins veem todos, agency_owners veem aÃ§Ãµes relacionadas Ã  sua agÃªncia
CREATE POLICY "admin_actions_select_policy" ON public.admin_actions
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            -- Admin global pode ver todas as aÃ§Ãµes
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
            OR
            -- Agency owner pode ver aÃ§Ãµes relacionadas Ã  sua agÃªncia
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid() 
                  AND up.role = 'agency_owner'
                  AND (
                    -- AÃ§Ãµes que ele mesmo fez
                    admin_actions.admin_id = auth.uid()
                    OR
                    -- AÃ§Ãµes relacionadas a usuÃ¡rios da sua agÃªncia
                    EXISTS (
                        SELECT 1 FROM public.user_profiles target_user
                        WHERE target_user.id = admin_actions.target_user_id
                          AND target_user.agency_id = up.agency_id
                    )
                  )
            )
            OR
            -- UsuÃ¡rio pode ver aÃ§Ãµes feitas sobre ele mesmo
            target_user_id = auth.uid()
        )
    );

-- INSERT: Sistema adiciona automaticamente (SECURITY DEFINER nas funÃ§Ãµes)
CREATE POLICY "admin_actions_insert_policy" ON public.admin_actions
    FOR INSERT
    WITH CHECK (
        -- Permitir inserÃ§Ã£o apenas para usuÃ¡rios autenticados
        -- (o controle real Ã© feito nas funÃ§Ãµes SECURITY DEFINER)
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
-- 5. ATUALIZAR FUNÃ‡Ã•ES EXISTENTES PARA USAR AUTH.UID()
-- ================================================================

-- Atualizar funÃ§Ã£o create_user_invitation para usar o usuÃ¡rio atual
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
    -- Verificar se usuÃ¡rio estÃ¡ autenticado
    IF current_user_id IS NULL THEN
        RETURN '{"error": "UsuÃ¡rio nÃ£o autenticado"}'::JSON;
    END IF;

    -- Verificar se o usuÃ¡rio atual Ã© admin ou agency_owner
    SELECT id, role, agency_id 
    INTO admin_data
    FROM public.user_profiles
    WHERE id = current_user_id;

    IF admin_data IS NULL THEN
        RETURN '{"error": "Perfil de usuÃ¡rio nÃ£o encontrado"}'::JSON;
    END IF;

    -- Verificar permissÃµes
    IF admin_data.role NOT IN ('admin', 'agency_owner') THEN
        RETURN '{"error": "Sem permissÃ£o para criar convites"}'::JSON;
    END IF;

    -- Se nÃ£o Ã© admin global, verificar se agency_id Ã© vÃ¡lido
    IF admin_data.role != 'admin' AND (p_agency_id IS NULL OR p_agency_id != admin_data.agency_id) THEN
        RETURN '{"error": "VocÃª sÃ³ pode criar convites para sua prÃ³pria agÃªncia"}'::JSON;
    END IF;

    -- Verificar se email jÃ¡ existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN '{"error": "Email jÃ¡ cadastrado no sistema"}'::JSON;
    END IF;

    -- Verificar se jÃ¡ existe convite pendente para este email
    IF EXISTS (SELECT 1 FROM public.user_invitations WHERE email = p_email AND status = 'pending') THEN
        RETURN '{"error": "JÃ¡ existe convite pendente para este email"}'::JSON;
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

    -- Registrar aÃ§Ã£o administrativa
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

-- Atualizar funÃ§Ã£o get_pending_invitations para respeitar RLS
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
    -- Verificar se usuÃ¡rio estÃ¡ autenticado
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Obter permissÃµes do usuÃ¡rio atual
    user_permissions := public.get_current_user_permissions();

    -- Se nÃ£o pode gerenciar usuÃ¡rios, retornar vazio
    IF NOT (user_permissions->>'can_manage_users')::BOOLEAN THEN
        RETURN;
    END IF;

    -- Retornar convites baseado nas permissÃµes (RLS aplicarÃ¡ automaticamente)
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
-- 6. CONFIGURAÃ‡ÃƒO ADICIONAL
-- ================================================================

-- Configurar URL base da aplicaÃ§Ã£o (ajuste conforme necessÃ¡rio)
-- Esta configuraÃ§Ã£o serÃ¡ usada para gerar os links de convite
DO $$
BEGIN
    -- Tentar definir a URL base (pode ser sobrescrita via variÃ¡vel de ambiente)
    PERFORM set_config('app.base_url', 'http://localhost:3000', false);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar erros de configuraÃ§Ã£o
        NULL;
END $$;

-- ================================================================
-- 7. GRANTS E PERMISSÃ•ES
-- ================================================================

-- Garantir que as funÃ§Ãµes podem ser executadas por usuÃ¡rios autenticados
GRANT EXECUTE ON FUNCTION public.get_current_user_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_invitation(VARCHAR, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_user_invitation(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_invitation(UUID) TO authenticated;

-- Grants para as tabelas (authenticated role jÃ¡ tem atravÃ©s do RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_actions TO authenticated;

-- ================================================================
-- 8. LIMPEZA E MANUTENÃ‡ÃƒO
-- ================================================================

-- FunÃ§Ã£o para limpar convites expirados (executar periodicamente)
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

-- Grant para funÃ§Ã£o de limpeza
GRANT EXECUTE ON FUNCTION public.cleanup_expired_invitations() TO authenticated;

-- ================================================================
-- CONFIRMAÃ‡ÃƒO
-- ================================================================

SELECT 'Triggers, RLS e permissÃµes para sistema de gestÃ£o de usuÃ¡rios configurados com sucesso!' as status;
