-- ===================================================
-- FVStudios Dashboard - Sistema de Configuração Global
-- Tabelas para gerenciar configurações centralizadas
-- ===================================================

BEGIN;

-- Tabela de configurações globais do sistema
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    data_type VARCHAR(50) NOT NULL DEFAULT 'string',
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    validation_rules JSONB,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para categorias válidas
    CONSTRAINT valid_categories CHECK (category IN (
        'system', 'email', 'notifications', 'integrations', 'security',
        'billing', 'features', 'limits', 'ui', 'analytics'
    )),
    
    -- Constraint para tipos de dados válidos
    CONSTRAINT valid_data_types CHECK (data_type IN (
        'string', 'number', 'boolean', 'json', 'array', 'url', 'email'
    ))
);

-- Tabela de configurações por agência (override das globais)
CREATE TABLE IF NOT EXISTS agency_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    data_type VARCHAR(50) NOT NULL DEFAULT 'string',
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    validation_rules JSONB,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para categorias válidas
    CONSTRAINT valid_agency_categories CHECK (category IN (
        'branding', 'notifications', 'integrations', 'billing', 
        'features', 'limits', 'ui', 'workflows'
    )),
    
    -- Constraint para tipos de dados válidos
    CONSTRAINT valid_agency_data_types CHECK (data_type IN (
        'string', 'number', 'boolean', 'json', 'array', 'url', 'email'
    )),
    
    -- Unique constraint por agência e key
    CONSTRAINT unique_agency_key UNIQUE (agency_id, key)
);

-- Tabela de histórico de mudanças de configurações
CREATE TABLE IF NOT EXISTS settings_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_type VARCHAR(50) NOT NULL, -- 'global' ou 'agency'
    setting_id UUID NOT NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB NOT NULL,
    change_reason TEXT,
    changed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para tipos válidos
    CONSTRAINT valid_setting_types CHECK (setting_type IN ('global', 'agency'))
);

-- Tabela de templates de configuração
CREATE TABLE IF NOT EXISTS settings_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    template_data JSONB NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_global_settings_category ON global_settings(category);
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(key);
CREATE INDEX IF NOT EXISTS idx_agency_settings_agency_id ON agency_settings(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_settings_category ON agency_settings(category);
CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON agency_settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_history_setting_id ON settings_history(setting_id);
CREATE INDEX IF NOT EXISTS idx_settings_history_changed_at ON settings_history(changed_at);

-- RLS Policies
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_templates ENABLE ROW LEVEL SECURITY;

-- Policy para global_settings (apenas admins)
DROP POLICY IF EXISTS "Admins can manage global settings" ON global_settings;
CREATE POLICY "Admins can manage global settings" ON global_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy para global_settings (usuários podem ver configurações públicas)
DROP POLICY IF EXISTS "Users can view public global settings" ON global_settings;
CREATE POLICY "Users can view public global settings" ON global_settings
    FOR SELECT USING (
        is_public = true AND auth.uid() IS NOT NULL
    );

-- Policy para agency_settings (owners e managers da agência)
DROP POLICY IF EXISTS "Agency owners and managers can manage agency settings" ON agency_settings;
CREATE POLICY "Agency owners and managers can manage agency settings" ON agency_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND agency_id = agency_settings.agency_id
            AND role IN ('agency_owner', 'agency_manager')
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy para agency_settings (staff pode ver)
DROP POLICY IF EXISTS "Agency staff can view agency settings" ON agency_settings;
CREATE POLICY "Agency staff can view agency settings" ON agency_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND agency_id = agency_settings.agency_id
            AND role IN ('agency_owner', 'agency_manager', 'agency_staff')
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy para settings_history (mesmas regras de agency_settings)
DROP POLICY IF EXISTS "Settings history access control" ON settings_history;
CREATE POLICY "Settings history access control" ON settings_history
    FOR SELECT USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Agency owners/managers podem ver histórico da sua agência
        (
            agency_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE id = auth.uid() 
                AND agency_id = settings_history.agency_id
                AND role IN ('agency_owner', 'agency_manager')
            )
        )
    );

-- Policy para settings_templates (admins e agency owners)
DROP POLICY IF EXISTS "Templates access control" ON settings_templates;
CREATE POLICY "Templates access control" ON settings_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

-- Inserir configurações globais padrão
INSERT INTO global_settings (key, value, category, description, data_type, is_public) VALUES
-- Configurações do sistema
('system.name', '"FVStudios Dashboard"', 'system', 'Nome da aplicação', 'string', true),
('system.version', '"1.0.0"', 'system', 'Versão atual do sistema', 'string', true),
('system.maintenance_mode', 'false', 'system', 'Modo de manutenção ativo', 'boolean', false),
('system.max_upload_size', '52428800', 'system', 'Tamanho máximo de upload em bytes (50MB)', 'number', false),
('system.timezone', '"America/Sao_Paulo"', 'system', 'Timezone padrão do sistema', 'string', true),

-- Configurações de email
('email.from_name', '"FVStudios"', 'email', 'Nome do remetente dos emails', 'string', false),
('email.from_email', '"noreply@fvstudios.com"', 'email', 'Email do remetente', 'email', false),
('email.smtp_enabled', 'true', 'email', 'SMTP habilitado', 'boolean', false),

-- Configurações de notificações
('notifications.email_enabled', 'true', 'notifications', 'Notificações por email habilitadas', 'boolean', true),
('notifications.whatsapp_enabled', 'true', 'notifications', 'Notificações por WhatsApp habilitadas', 'boolean', true),
('notifications.push_enabled', 'false', 'notifications', 'Notificações push habilitadas', 'boolean', true),

-- Configurações de integrações
('integrations.meta_ads_enabled', 'true', 'integrations', 'Integração Meta Ads habilitada', 'boolean', true),
('integrations.google_ads_enabled', 'true', 'integrations', 'Integração Google Ads habilitada', 'boolean', true),
('integrations.whatsapp_business_enabled', 'true', 'integrations', 'WhatsApp Business habilitado', 'boolean', true),

-- Configurações de segurança
('security.session_timeout', '28800', 'security', 'Timeout da sessão em segundos (8 horas)', 'number', false),
('security.password_min_length', '8', 'security', 'Tamanho mínimo da senha', 'number', true),
('security.require_2fa', 'false', 'security', 'Requerer autenticação de dois fatores', 'boolean', false),
('security.max_login_attempts', '5', 'security', 'Máximo de tentativas de login', 'number', false),

-- Configurações de billing
('billing.currency', '"BRL"', 'billing', 'Moeda padrão', 'string', true),
('billing.tax_rate', '0', 'billing', 'Taxa de imposto padrão', 'number', false),

-- Configurações de features
('features.ai_enabled', 'true', 'features', 'Funcionalidades de IA habilitadas', 'boolean', true),
('features.analytics_enabled', 'true', 'features', 'Analytics habilitado', 'boolean', true),
('features.backup_enabled', 'true', 'features', 'Sistema de backup habilitado', 'boolean', true),

-- Configurações de limites
('limits.max_projects_per_agency', '100', 'limits', 'Máximo de projetos por agência', 'number', false),
('limits.max_users_per_agency', '50', 'limits', 'Máximo de usuários por agência', 'number', false),
('limits.max_clients_per_agency', '200', 'limits', 'Máximo de clientes por agência', 'number', false),

-- Configurações de UI
('ui.theme', '"light"', 'ui', 'Tema padrão da interface', 'string', true),
('ui.language', '"pt-BR"', 'ui', 'Idioma padrão', 'string', true),
('ui.sidebar_collapsed', 'false', 'ui', 'Sidebar colapsado por padrão', 'boolean', true),

-- Configurações de analytics
('analytics.retention_days', '365', 'analytics', 'Dias de retenção de dados analíticos', 'number', false),
('analytics.google_analytics_id', '""', 'analytics', 'ID do Google Analytics', 'string', false)

ON CONFLICT (key) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_global_settings_updated_at ON global_settings;
CREATE TRIGGER update_global_settings_updated_at
    BEFORE UPDATE ON global_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();

DROP TRIGGER IF EXISTS update_agency_settings_updated_at ON agency_settings;
CREATE TRIGGER update_agency_settings_updated_at
    BEFORE UPDATE ON agency_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();

-- Trigger para criar histórico de mudanças
CREATE OR REPLACE FUNCTION create_settings_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Para global_settings
    IF TG_TABLE_NAME = 'global_settings' THEN
        INSERT INTO settings_history (
            setting_type, setting_id, key, old_value, new_value, 
            change_reason, changed_by, changed_at
        ) VALUES (
            'global', 
            COALESCE(NEW.id, OLD.id),
            COALESCE(NEW.key, OLD.key),
            CASE WHEN TG_OP = 'DELETE' THEN OLD.value ELSE OLD.value END,
            CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.value END,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'Created'
                WHEN TG_OP = 'UPDATE' THEN 'Updated'
                WHEN TG_OP = 'DELETE' THEN 'Deleted'
            END,
            auth.uid(),
            NOW()
        );
    END IF;
    
    -- Para agency_settings
    IF TG_TABLE_NAME = 'agency_settings' THEN
        INSERT INTO settings_history (
            setting_type, setting_id, agency_id, key, old_value, new_value,
            change_reason, changed_by, changed_at
        ) VALUES (
            'agency',
            COALESCE(NEW.id, OLD.id),
            COALESCE(NEW.agency_id, OLD.agency_id),
            COALESCE(NEW.key, OLD.key),
            CASE WHEN TG_OP = 'DELETE' THEN OLD.value ELSE OLD.value END,
            CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.value END,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'Created'
                WHEN TG_OP = 'UPDATE' THEN 'Updated'
                WHEN TG_OP = 'DELETE' THEN 'Deleted'
            END,
            auth.uid(),
            NOW()
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS global_settings_history_trigger ON global_settings;
CREATE TRIGGER global_settings_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON global_settings
    FOR EACH ROW
    EXECUTE FUNCTION create_settings_history();

DROP TRIGGER IF EXISTS agency_settings_history_trigger ON agency_settings;
CREATE TRIGGER agency_settings_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON agency_settings
    FOR EACH ROW
    EXECUTE FUNCTION create_settings_history();

COMMIT;