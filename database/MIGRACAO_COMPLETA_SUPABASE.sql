-- ==================================================
-- MIGRAÇÃO COMPLETA SUPABASE - Ordem Correta
-- Executa todas as tabelas na sequência certa
-- ==================================================

BEGIN;

-- ==================================================
-- 1. EXTENSÕES E TIPOS BÁSICOS
-- ==================================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos padronizados
DROP TYPE IF EXISTS user_status CASCADE;
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending', 'invited');

DROP TYPE IF EXISTS project_status CASCADE;
CREATE TYPE project_status AS ENUM ('draft', 'planning', 'active', 'on_hold', 'completed', 'canceled', 'archived');

DROP TYPE IF EXISTS task_status CASCADE;
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed', 'canceled');

DROP TYPE IF EXISTS priority_level CASCADE;
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
    'admin', 'agency_owner', 'agency_manager', 'agency_staff', 
    'agency_client', 'independent_producer', 'independent_client', 
    'influencer', 'free_user'
);

DROP TYPE IF EXISTS social_platform CASCADE;
CREATE TYPE social_platform AS ENUM (
    'facebook', 'instagram', 'google_ads', 'linkedin', 'tiktok', 
    'youtube', 'twitter', 'pinterest', 'snapchat'
);

DROP TYPE IF EXISTS integration_type CASCADE;
CREATE TYPE integration_type AS ENUM (
    'ads', 'social_media', 'analytics', 'crm', 'email_marketing', 
    'automation', 'design', 'communication'
);

-- ==================================================
-- 2. TABELAS PRINCIPAIS (SEM DEPENDÊNCIAS)
-- ==================================================

-- Agências (base do sistema)
DROP TABLE IF EXISTS agencies CASCADE;
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    address JSONB DEFAULT '{}',
    logo_url TEXT,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
    subscription_status user_status NOT NULL DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usuários (depende de agencies)
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'free_user',
    status user_status NOT NULL DEFAULT 'active',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clientes (depende de agencies e user_profiles)
DROP TABLE IF EXISTS clients CASCADE;
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    company VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status user_status DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projetos (depende de agencies, clients, user_profiles)
DROP TABLE IF EXISTS projects CASCADE;
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'draft',
    priority priority_level DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget_cents BIGINT DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks (depende de projects)
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority priority_level DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    estimated_hours DECIMAL(8,2) DEFAULT 0,
    actual_hours DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Integrations (depende de user_profiles, agencies)
DROP TABLE IF EXISTS api_integrations CASCADE;
CREATE TABLE api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider social_platform NOT NULL,
    provider_type integration_type NOT NULL,
    status user_status NOT NULL DEFAULT 'active',
    is_valid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_provider_per_client UNIQUE(client_id, provider, name)
);

-- ==================================================
-- 3. SISTEMA INTELIGENTE (DEPENDE DAS TABELAS PRINCIPAIS)
-- ==================================================

-- Recomendações inteligentes
DROP TABLE IF EXISTS intelligent_recommendations CASCADE;
CREATE TABLE intelligent_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority priority_level DEFAULT 'medium',
    confidence_score DECIMAL(3,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics preditivos
DROP TABLE IF EXISTS predictive_analytics CASCADE;
CREATE TABLE predictive_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    prediction_type VARCHAR(100) NOT NULL,
    predicted_value JSONB NOT NULL,
    confidence_level DECIMAL(3,2) DEFAULT 0,
    ai_model VARCHAR(100) NOT NULL,
    valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates inteligentes
DROP TABLE IF EXISTS intelligent_templates CASCADE;
CREATE TABLE intelligent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    template_data JSONB NOT NULL,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notificações
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL,
    priority priority_level DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 4. WORKSTATION (DEPENDE DE TODAS AS TABELAS ACIMA)
-- ==================================================

-- Workstations (centro de comando)
DROP TABLE IF EXISTS workstations CASCADE;
CREATE TABLE workstations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workstation_code VARCHAR(50) NOT NULL,
    settings JSONB DEFAULT '{"auto_assign_tasks": true, "ai_recommendations": true}',
    dashboard_layout JSONB DEFAULT '{"widgets": []}',
    total_projects INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    automation_score DECIMAL(3,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_workstation_code UNIQUE (agency_id, workstation_code)
);

-- Membros da workstation
DROP TABLE IF EXISTS workstation_members CASCADE;
CREATE TABLE workstation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '["view_dashboard"]',
    status VARCHAR(50) DEFAULT 'active',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workstation_id, user_id)
);

-- Hub de integrações da workstation
DROP TABLE IF EXISTS workstation_integration_hub CASCADE;
CREATE TABLE workstation_integration_hub (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    monitoring_config JSONB DEFAULT '{"sync_frequency": "hourly"}',
    hub_status VARCHAR(50) DEFAULT 'active',
    total_syncs INTEGER DEFAULT 0,
    successful_syncs INTEGER DEFAULT 0,
    failed_syncs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workstation_id, integration_id)
);

-- Automações da workstation
DROP TABLE IF EXISTS workstation_automations CASCADE;
CREATE TABLE workstation_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    automation_type VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_config JSONB NOT NULL,
    actions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Métricas da workstation
DROP TABLE IF EXISTS workstation_metrics CASCADE;
CREATE TABLE workstation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    projects_created INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    automations_executed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workstation_id, metric_date)
);

-- ==================================================
-- 5. ADICIONAR COLUNAS DE REFERÊNCIA À WORKSTATION
-- ==================================================

-- Adicionar workstation_id às tabelas existentes
ALTER TABLE projects ADD COLUMN workstation_id UUID REFERENCES workstations(id) ON DELETE SET NULL;
ALTER TABLE api_integrations ADD COLUMN workstation_id UUID REFERENCES workstations(id) ON DELETE SET NULL;
ALTER TABLE intelligent_recommendations ADD COLUMN workstation_id UUID REFERENCES workstations(id) ON DELETE CASCADE;
ALTER TABLE predictive_analytics ADD COLUMN workstation_id UUID REFERENCES workstations(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN workstation_id UUID REFERENCES workstations(id) ON DELETE SET NULL;

-- ==================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_agencies_email ON agencies(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_workstation_id ON projects(workstation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_api_integrations_client_id ON api_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_workstation_id ON api_integrations(workstation_id);
CREATE INDEX IF NOT EXISTS idx_workstations_agency_id ON workstations(agency_id);
CREATE INDEX IF NOT EXISTS idx_workstation_members_workstation_id ON workstation_members(workstation_id);
CREATE INDEX IF NOT EXISTS idx_intelligent_recommendations_workstation_id ON intelligent_recommendations(workstation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ==================================================
-- 7. FUNÇÃO DE UPDATED_AT
-- ==================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_integrations_updated_at ON api_integrations;
CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON api_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workstations_updated_at ON workstations;
CREATE TRIGGER update_workstations_updated_at BEFORE UPDATE ON workstations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 8. DADOS INICIAIS
-- ==================================================

-- Inserir agência exemplo
INSERT INTO agencies (
    id, name, email, subscription_plan, subscription_status
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'FVStudios Marketing',
    'contato@fvstudios.com.br',
    'enterprise',
    'active'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    subscription_plan = EXCLUDED.subscription_plan;

-- NOTA: Usuário admin deve ser criado manualmente com UUID do auth.users
-- Use o script CORRIGIR_PERFIL_FRANCO.sql após executar esta migração

-- Inserir workstation padrão (owner será definido depois)
INSERT INTO workstations (
    id, agency_id, name, description, workstation_code
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Centro de Comando Principal',
    'Workstation principal da FVStudios para controle centralizado',
    'COMMAND_CENTER'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- NOTA: Membros da workstation devem ser adicionados após criar perfil do admin
-- Use o script CORRIGIR_PERFIL_FRANCO.sql

-- ==================================================
-- 9. VERIFICAÇÃO FINAL
-- ==================================================

DO $$
DECLARE
    table_count INTEGER;
    workstation_tables INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT COUNT(*) INTO workstation_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%workstation%';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '   MIGRAÇÃO COMPLETA SUPABASE FINALIZADA';
    RAISE NOTICE '🎉 ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Sistema instalado:';
    RAISE NOTICE '   • Total de tabelas: %', table_count;
    RAISE NOTICE '   • Tabelas workstation: %', workstation_tables;
    RAISE NOTICE '';
    RAISE NOTICE '🎛️ WORKSTATION COMO CENTRO DE COMANDO:';
    RAISE NOTICE '   • ✅ Controle total de projetos';
    RAISE NOTICE '   • ✅ Hub de integrações APIs';
    RAISE NOTICE '   • ✅ Sistema IA integrado';
    RAISE NOTICE '   • ✅ Automações centralizadas';
    RAISE NOTICE '   • ✅ Métricas em tempo real';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRONTO PARA USO!';
    RAISE NOTICE '';
END $$;

COMMIT;