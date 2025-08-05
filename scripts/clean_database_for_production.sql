-- Script para limpeza completa do banco de dados
-- Mantém apenas o usuário admin franco@fvstudios.com.br
-- Remove todos os dados de teste e prepara para produção

-- ==========================================
-- LIMPEZA COMPLETA DO SISTEMA
-- ==========================================

-- 1. Encontrar o ID do usuário admin principal
DO $$
DECLARE
    admin_user_id UUID;
    franco_email TEXT := 'franco@fvstudios.com.br';
BEGIN
    -- Buscar ID do Franco
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = franco_email;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário admin franco@fvstudios.com.br não encontrado!';
    END IF;
    
    RAISE NOTICE 'Admin user ID encontrado: %', admin_user_id;
    
    -- ==========================================
    -- LIMPAR DADOS DE TESTE
    -- ==========================================
    
    -- 2. Cancelar todas as assinaturas
    UPDATE user_subscriptions 
    SET status = 'canceled', canceled_at = NOW()
    WHERE user_id != admin_user_id;
    
    -- 3. Cancelar todos os convites pendentes
    UPDATE user_invitations 
    SET status = 'cancelled', updated_at = NOW()
    WHERE invited_by != admin_user_id;
    
    -- 4. Remover todas as permissões de agência (exceto do admin)
    DELETE FROM user_agency_permissions 
    WHERE user_id != admin_user_id;
    
    -- 5. Excluir todas as agências que não foram criadas pelo admin
    DELETE FROM agencies 
    WHERE created_by != admin_user_id OR created_by IS NULL;
    
    -- 6. Limpar logs antigos (manter apenas últimos 30 dias)
    DELETE FROM admin_action_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- 7. Limpar dados de teste das tabelas auxiliares
    DELETE FROM admin_user_creation_queue;
    DELETE FROM plan_change_history;
    
    -- ==========================================
    -- EXCLUIR USUÁRIOS DO SUPABASE AUTH
    -- ==========================================
    
    -- Nota: Os usuários do Supabase Auth precisam ser excluídos via API
    -- Este script apenas limpa as referências no banco
    
    RAISE NOTICE 'Limpeza do banco de dados concluída!';
    RAISE NOTICE 'ATENÇÃO: Você precisa excluir os usuários do Supabase Auth manualmente via dashboard ou API';
    
END $$;

-- ==========================================
-- VERIFICAR E CRIAR PERMISSÃO ADMIN
-- ==========================================

-- Garantir que o Franco tenha permissão de admin
INSERT INTO user_agency_permissions (user_id, role, permissions, granted_by)
SELECT 
    u.id,
    'admin',
    json_build_object(
        'manage_users', 'true',
        'manage_agencies', 'true', 
        'manage_payments', 'true',
        'view_analytics', 'true',
        'manage_settings', 'true',
        'super_admin', 'true'
    ),
    u.id
FROM auth.users u
WHERE u.email = 'franco@fvstudios.com.br'
AND NOT EXISTS (
    SELECT 1 FROM user_agency_permissions uap 
    WHERE uap.user_id = u.id AND uap.role = 'admin'
)
ON CONFLICT (user_id, agency_id) DO UPDATE SET
    role = 'admin',
    permissions = json_build_object(
        'manage_users', 'true',
        'manage_agencies', 'true',
        'manage_payments', 'true', 
        'view_analytics', 'true',
        'manage_settings', 'true',
        'super_admin', 'true'
    ),
    updated_at = NOW();

-- ==========================================
-- VERIFICAR SCHEMAS E RLS
-- ==========================================

-- Verificar se todas as políticas RLS estão ativas
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'agencies', 'user_agency_permissions', 'user_invitations', 
            'admin_action_logs', 'user_subscriptions', 'plan_limits'
        )
    LOOP
        -- Verificar se RLS está habilitado
        IF NOT EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = table_record.tablename 
            AND relrowsecurity = true
        ) THEN
            EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 
                          table_record.schemaname, table_record.tablename);
            RAISE NOTICE 'RLS habilitado para tabela: %', table_record.tablename;
        END IF;
    END LOOP;
END $$;

-- ==========================================
-- ATUALIZAR POLÍTICAS RLS PARA PRODUÇÃO
-- ==========================================

-- Política mais restritiva para agencies
DROP POLICY IF EXISTS "Users can view own agencies" ON agencies;
CREATE POLICY "Users can view own agencies" ON agencies FOR SELECT USING (
    -- Admins podem ver todas
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() AND uap.role = 'admin'
    ) OR
    -- Usuários podem ver apenas suas agências
    id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
    )
);

-- Política para user_agency_permissions
DROP POLICY IF EXISTS "Users can view own permissions" ON user_agency_permissions;
CREATE POLICY "Users can view own permissions" ON user_agency_permissions FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() AND uap.role IN ('admin', 'agency_owner')
    )
);

-- Política para user_invitations (apenas admins)
DROP POLICY IF EXISTS "Admins can manage invitations" ON user_invitations;
CREATE POLICY "Admins can manage invitations" ON user_invitations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() AND uap.role IN ('admin', 'agency_owner')
    )
);

-- Política para user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (
    user_id = auth.uid() OR
    agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid() AND role IN ('admin', 'agency_owner')
    )
);

-- ==========================================
-- VERIFICAR FUNÇÕES E TRIGGERS
-- ==========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Verificar triggers de updated_at
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT unnest(ARRAY['agencies', 'user_agency_permissions', 'user_invitations', 'user_subscriptions'])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'update_' || table_name || '_updated_at'
        ) THEN
            EXECUTE format('
                CREATE TRIGGER update_%I_updated_at 
                BEFORE UPDATE ON %I 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', 
                table_name, table_name);
            RAISE NOTICE 'Trigger criado para tabela: %', table_name;
        END IF;
    END LOOP;
END $$;

-- ==========================================
-- VERIFICAR PLANOS PADRÃO
-- ==========================================

-- Inserir planos padrão se não existirem
INSERT INTO plan_limits (plan_name, max_clients, max_projects, max_campaigns, max_api_calls_month, max_team_members, features, api_integrations, monthly_price, annual_price)
VALUES 
    ('free', 2, 1, 3, 1000, 1, 
     '["basic_dashboard", "basic_reports"]',
     '["email"]', 0, 0),
    ('basic', 10, 5, 10, 5000, 3,
     '["dashboard", "reports", "automation", "email_alerts"]',
     '["email", "whatsapp", "google_analytics"]', 29.90, 299.90),
    ('professional', 50, 20, 50, 20000, 10,
     '["advanced_dashboard", "advanced_reports", "automation", "white_label", "api_access"]',
     '["email", "whatsapp", "social_media", "crm", "analytics"]', 79.90, 799.90),
    ('premium', 200, 100, 200, 100000, 25,
     '["all_features", "advanced_automation", "custom_integrations", "priority_support"]',
     '["all_integrations", "custom_webhooks", "zapier"]', 149.90, 1499.90),
    ('enterprise', NULL, NULL, NULL, NULL, NULL,
     '["unlimited_everything", "custom_development", "dedicated_support"]',
     '["custom_development", "dedicated_infrastructure"]', 299.90, 2999.90)
ON CONFLICT (plan_name) DO UPDATE SET
    max_clients = EXCLUDED.max_clients,
    max_projects = EXCLUDED.max_projects,
    max_campaigns = EXCLUDED.max_campaigns,
    max_api_calls_month = EXCLUDED.max_api_calls_month,
    max_team_members = EXCLUDED.max_team_members,
    features = EXCLUDED.features,
    api_integrations = EXCLUDED.api_integrations,
    monthly_price = EXCLUDED.monthly_price,
    annual_price = EXCLUDED.annual_price,
    updated_at = NOW();

-- ==========================================
-- RELATÓRIO FINAL
-- ==========================================

SELECT 
    'Sistema limpo e pronto para produção!' as status,
    json_build_object(
        'admin_user_email', 'franco@fvstudios.com.br',
        'total_agencies', (SELECT COUNT(*) FROM agencies),
        'total_users_permissions', (SELECT COUNT(*) FROM user_agency_permissions),
        'total_plans_available', (SELECT COUNT(*) FROM plan_limits),
        'pending_invitations', (SELECT COUNT(*) FROM user_invitations WHERE status = 'pending'),
        'active_subscriptions', (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active'),
        'rls_enabled_tables', (
            SELECT COUNT(*) FROM pg_class 
            WHERE relname IN ('agencies', 'user_agency_permissions', 'user_invitations', 'user_subscriptions', 'plan_limits')
            AND relrowsecurity = true
        )
    ) as summary;

-- Log da limpeza
INSERT INTO admin_action_logs (admin_user_id, action, details)
SELECT 
    u.id,
    'system_cleanup',
    json_build_object(
        'cleaned_at', NOW(),
        'description', 'Sistema limpo para produção - mantido apenas admin principal',
        'admin_email', 'franco@fvstudios.com.br'
    )
FROM auth.users u
WHERE u.email = 'franco@fvstudios.com.br';