-- Políticas RLS Otimizadas para Produção
-- Revisão e atualização de todas as políticas de segurança

-- ==========================================
-- REMOVER POLÍTICAS ANTIGAS
-- ==========================================

-- Remover todas as políticas existentes para recriá-las
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('agencies', 'user_agency_permissions', 'user_invitations', 
                         'admin_action_logs', 'user_subscriptions', 'plan_limits')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Política removida: % na tabela %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- ==========================================
-- POLÍTICAS PARA TABELA AGENCIES
-- ==========================================

-- Habilitar RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
CREATE POLICY "Admins can manage all agencies" ON agencies FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'admin'
    )
);

-- Agency owners podem ver/editar suas próprias agências
CREATE POLICY "Agency owners can manage own agency" ON agencies FOR ALL USING (
    id IN (
        SELECT uap.agency_id 
        FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'agency_owner'
    )
);

-- Staff e clientes podem apenas visualizar sua agência
CREATE POLICY "Users can view own agency" ON agencies FOR SELECT USING (
    id IN (
        SELECT uap.agency_id 
        FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid()
    )
);

-- ==========================================
-- POLÍTICAS PARA USER_AGENCY_PERMISSIONS
-- ==========================================

ALTER TABLE user_agency_permissions ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todas as permissões
CREATE POLICY "Admins can manage all permissions" ON user_agency_permissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'admin'
    )
);

-- Agency owners podem gerenciar permissões de sua agência
CREATE POLICY "Agency owners can manage agency permissions" ON user_agency_permissions FOR ALL USING (
    agency_id IN (
        SELECT uap.agency_id 
        FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'agency_owner'
    )
);

-- Usuários podem ver suas próprias permissões
CREATE POLICY "Users can view own permissions" ON user_agency_permissions FOR SELECT USING (
    user_id = auth.uid()
);

-- ==========================================
-- POLÍTICAS PARA USER_INVITATIONS
-- ==========================================

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todos os convites
CREATE POLICY "Admins can manage all invitations" ON user_invitations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'admin'
    )
);

-- Agency owners podem gerenciar convites de sua agência
CREATE POLICY "Agency owners can manage agency invitations" ON user_invitations FOR ALL USING (
    agency_id IN (
        SELECT uap.agency_id 
        FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'agency_owner'
    ) OR
    invited_by = auth.uid()
);

-- ==========================================
-- POLÍTICAS PARA USER_SUBSCRIPTIONS
-- ==========================================

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as assinaturas
CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'admin'
    )
);

-- Agency owners podem ver assinaturas de sua agência
CREATE POLICY "Agency owners can view agency subscriptions" ON user_subscriptions FOR SELECT USING (
    agency_id IN (
        SELECT uap.agency_id 
        FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'agency_owner'
    )
);

-- Usuários podem ver suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (
    user_id = auth.uid()
);

-- Admins podem gerenciar assinaturas
CREATE POLICY "Admins can manage subscriptions" ON user_subscriptions 
FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'admin'
    )
);

-- ==========================================
-- POLÍTICAS PARA ADMIN_ACTION_LOGS
-- ==========================================

ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs
CREATE POLICY "Only admins can view logs" ON admin_action_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'admin'
    )
);

-- Sistema pode inserir logs (para triggers e funções)
CREATE POLICY "System can insert logs" ON admin_action_logs FOR INSERT WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA PLAN_LIMITS
-- ==========================================

ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- Todos podem ver os planos disponíveis
CREATE POLICY "Everyone can view available plans" ON plan_limits FOR SELECT USING (true);

-- Apenas admins podem gerenciar planos
CREATE POLICY "Only admins can manage plans" ON plan_limits 
FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'admin'
    )
);

-- ==========================================
-- FUNÇÕES DE SEGURANÇA AUXILIARES
-- ==========================================

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = user_uuid 
        AND uap.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é owner de uma agência
CREATE OR REPLACE FUNCTION is_agency_owner(agency_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = user_uuid 
        AND uap.agency_id = agency_uuid
        AND uap.role = 'agency_owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter agências do usuário
CREATE OR REPLACE FUNCTION user_agencies(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(agency_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT uap.agency_id 
    FROM user_agency_permissions uap 
    WHERE uap.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGERS DE AUDITORIA
-- ==========================================

-- Função para log automático de mudanças
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log apenas para tabelas importantes
    IF TG_TABLE_NAME IN ('agencies', 'user_agency_permissions', 'user_subscriptions') THEN
        INSERT INTO admin_action_logs (
            admin_user_id,
            action,
            details,
            ip_address
        ) VALUES (
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
            TG_OP || '_' || TG_TABLE_NAME,
            json_build_object(
                'table', TG_TABLE_NAME,
                'old_data', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
                'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
                'changed_at', NOW()
            ),
            inet_client_addr()
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers de auditoria
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY['agencies', 'user_agency_permissions', 'user_subscriptions'])
    LOOP
        -- Remover trigger existente
        EXECUTE format('DROP TRIGGER IF EXISTS audit_%I_changes ON %I', table_name, table_name);
        
        -- Criar novo trigger
        EXECUTE format('
            CREATE TRIGGER audit_%I_changes
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW EXECUTE FUNCTION audit_changes()', 
            table_name, table_name);
            
        RAISE NOTICE 'Trigger de auditoria criado para: %', table_name;
    END LOOP;
END $$;

-- ==========================================
-- VERIFICAÇÕES DE INTEGRIDADE
-- ==========================================

-- Função para verificar integridade do sistema
CREATE OR REPLACE FUNCTION check_system_integrity()
RETURNS TABLE(
    check_type TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Verificar se existe pelo menos um admin
    RETURN QUERY
    SELECT 
        'admin_users'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END::TEXT,
        ('Total admins: ' || COUNT(*))::TEXT
    FROM user_agency_permissions 
    WHERE role = 'admin';
    
    -- Verificar RLS ativo
    RETURN QUERY
    SELECT 
        'rls_enabled'::TEXT,
        CASE WHEN COUNT(*) = 6 THEN 'OK' ELSE 'WARNING' END::TEXT,
        ('Tabelas com RLS: ' || COUNT(*) || '/6')::TEXT
    FROM pg_class 
    WHERE relname IN ('agencies', 'user_agency_permissions', 'user_invitations', 
                     'admin_action_logs', 'user_subscriptions', 'plan_limits')
    AND relrowsecurity = true;
    
    -- Verificar políticas ativas
    RETURN QUERY
    SELECT 
        'active_policies'::TEXT,
        'OK'::TEXT,
        ('Total políticas: ' || COUNT(*))::TEXT
    FROM pg_policies 
    WHERE schemaname = 'public';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================

COMMENT ON FUNCTION is_admin IS 'Verifica se um usuário tem role de admin';
COMMENT ON FUNCTION is_agency_owner IS 'Verifica se um usuário é owner de uma agência específica';
COMMENT ON FUNCTION user_agencies IS 'Retorna as agências associadas a um usuário';
COMMENT ON FUNCTION audit_changes IS 'Função de trigger para auditoria automática';
COMMENT ON FUNCTION check_system_integrity IS 'Verifica a integridade das configurações de segurança';

-- ==========================================
-- RELATÓRIO FINAL
-- ==========================================

SELECT 
    'Políticas RLS configuradas para produção!' as status,
    json_build_object(
        'total_policies_created', (
            SELECT COUNT(*) FROM pg_policies 
            WHERE schemaname = 'public'
        ),
        'tables_with_rls', (
            SELECT COUNT(*) FROM pg_class 
            WHERE relname IN ('agencies', 'user_agency_permissions', 'user_invitations', 
                             'admin_action_logs', 'user_subscriptions', 'plan_limits')
            AND relrowsecurity = true
        ),
        'security_functions_created', 4,
        'audit_triggers_created', 3
    ) as summary;

-- Executar verificação de integridade
SELECT * FROM check_system_integrity();