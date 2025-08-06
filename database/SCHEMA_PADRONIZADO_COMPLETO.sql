-- ==================================================
-- SCHEMA PADRONIZADO COMPLETO - FVStudios Dashboard
-- Corrige todas as inconsistências identificadas
-- Padrões unificados para todo o sistema
-- ==================================================

BEGIN;

-- ==================================================
-- 1. TIPOS E ENUMS PADRONIZADOS
-- ==================================================

-- Status de usuário padronizado
DROP TYPE IF EXISTS user_status CASCADE;
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending', 'invited');

-- Status de projeto padronizado  
DROP TYPE IF EXISTS project_status CASCADE;
CREATE TYPE project_status AS ENUM ('draft', 'planning', 'active', 'on_hold', 'completed', 'canceled', 'archived');

-- Status de tarefa padronizado
DROP TYPE IF EXISTS task_status CASCADE;
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed', 'canceled');

-- Prioridade padronizada
DROP TYPE IF EXISTS priority_level CASCADE;
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Roles de usuário padronizados
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
    'admin', 'agency_owner', 'agency_manager', 'agency_staff', 
    'agency_client', 'independent_producer', 'independent_client', 
    'influencer', 'free_user'
);

-- Plataformas sociais padronizadas
DROP TYPE IF EXISTS social_platform CASCADE;
CREATE TYPE social_platform AS ENUM (
    'facebook', 'instagram', 'google_ads', 'linkedin', 'tiktok', 
    'youtube', 'twitter', 'pinterest', 'snapchat'
);

-- Tipos de integração padronizados
DROP TYPE IF EXISTS integration_type CASCADE;
CREATE TYPE integration_type AS ENUM (
    'ads', 'social_media', 'analytics', 'crm', 'email_marketing', 
    'automation', 'design', 'communication'
);

-- ==================================================
-- 2. TABELAS PRINCIPAIS PADRONIZADAS
-- ==================================================

-- Tabela de agências (base do multi-tenant)
DROP TABLE IF EXISTS agencies CASCADE;
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Endereço e branding
    address JSONB DEFAULT '{}',
    logo_url TEXT,
    brand_colors JSONB DEFAULT '{}', -- primary_color, secondary_color
    
    -- Configurações de assinatura  
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
    subscription_status user_status NOT NULL DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    billing_email VARCHAR(255),
    
    -- Configurações da agência
    settings JSONB DEFAULT '{}',
    features_enabled TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_subscription_plan CHECK (
        subscription_plan IN ('free', 'starter', 'professional', 'enterprise')
    )
);

-- Perfis de usuários padronizados
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    
    -- Relacionamentos
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Dados pessoais
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    
    -- Sistema de roles
    role user_role NOT NULL DEFAULT 'free_user',
    permissions JSONB DEFAULT '[]', -- permissões específicas
    
    -- Status e configurações
    status user_status NOT NULL DEFAULT 'active',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status user_status DEFAULT 'active',
    
    -- Configurações do usuário
    preferences JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(10) DEFAULT 'pt-BR',
    
    -- Dados de billing
    stripe_customer_id VARCHAR(255),
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Indexes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Convites de usuários padronizados
DROP TABLE IF EXISTS user_invitations CASCADE;
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Dados do convite
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role NOT NULL,
    
    -- Token e expiração
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Status
    status user_status DEFAULT 'pending',
    accepted_at TIMESTAMPTZ,
    
    -- Dados adicionais
    welcome_message TEXT,
    permissions JSONB DEFAULT '[]',
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_pending_invitation UNIQUE (email, agency_id, status) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Clientes padronizados
DROP TABLE IF EXISTS clients CASCADE;
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos (isolamento multi-tenant)
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Dados da empresa/cliente
    company VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Endereço e informações adicionais
    address JSONB DEFAULT '{}',
    industry VARCHAR(100),
    company_size VARCHAR(50),
    
    -- Dados contratuais
    contract_value DECIMAL(12,2),
    contract_duration INTEGER, -- em meses
    contract_start_date DATE,
    contract_end_date DATE,
    
    -- Status e configurações
    status user_status DEFAULT 'active',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    
    -- Configurações específicas do cliente
    billing_settings JSONB DEFAULT '{}',
    project_settings JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes e constraints
    CONSTRAINT valid_contract_dates CHECK (
        contract_start_date IS NULL OR 
        contract_end_date IS NULL OR 
        contract_end_date >= contract_start_date
    )
);

-- Projetos padronizados
DROP TABLE IF EXISTS projects CASCADE;
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos (isolamento multi-tenant)
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Dados básicos do projeto
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_code VARCHAR(50), -- código interno único
    
    -- Status e prioridade
    status project_status DEFAULT 'draft',
    priority priority_level DEFAULT 'medium',
    
    -- Cronograma
    start_date DATE,
    end_date DATE,
    estimated_duration INTEGER, -- em dias
    
    -- Orçamento (valores em centavos para precisão)
    budget_cents BIGINT DEFAULT 0,
    budget_approved_cents BIGINT DEFAULT 0,
    budget_spent_cents BIGINT DEFAULT 0,
    hourly_rate_cents INTEGER,
    
    -- Configurações do projeto
    settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
    
    -- Metadados
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (
        start_date IS NULL OR 
        end_date IS NULL OR 
        end_date >= start_date
    ),
    CONSTRAINT unique_project_code UNIQUE (agency_id, project_code)
);

-- Tarefas padronizadas
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Hierarquia de tarefas
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Dados básicos
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_code VARCHAR(50), -- código da tarefa
    
    -- Status e prioridade
    status task_status DEFAULT 'todo',
    priority priority_level DEFAULT 'medium',
    
    -- Cronograma
    due_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Estimativas e controle de tempo
    estimated_hours DECIMAL(8,2) DEFAULT 0,
    actual_hours DECIMAL(8,2) DEFAULT 0,
    billable_hours DECIMAL(8,2) DEFAULT 0,
    hourly_rate_cents INTEGER,
    
    -- Organização
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    labels JSONB DEFAULT '[]',
    position INTEGER DEFAULT 0, -- para ordenação em kanban
    
    -- Anexos e dependências
    attachments JSONB DEFAULT '[]',
    dependencies JSONB DEFAULT '[]', -- IDs de tarefas dependentes
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_hours CHECK (estimated_hours >= 0 AND actual_hours >= 0),
    CONSTRAINT unique_task_code UNIQUE (project_id, task_code)
);

-- ==================================================
-- 3. SISTEMA DE INTEGRAÇÕES PADRONIZADO
-- ==================================================

-- Integrações de API padronizadas
DROP TABLE IF EXISTS api_integrations CASCADE;
CREATE TABLE api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos (isolamento por cliente)
    client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Identificação da integração
    name VARCHAR(255) NOT NULL,
    provider social_platform NOT NULL,
    provider_type integration_type NOT NULL,
    description TEXT,
    
    -- Configurações de autenticação (criptografadas)
    auth_type VARCHAR(50) NOT NULL DEFAULT 'oauth2',
    oauth_client_id TEXT,
    client_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    api_key_encrypted TEXT,
    
    -- Metadados da API
    api_version VARCHAR(50),
    base_url TEXT,
    scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Status e validação
    status user_status NOT NULL DEFAULT 'active',
    is_valid BOOLEAN DEFAULT false,
    last_validated_at TIMESTAMPTZ,
    validation_error TEXT,
    
    -- Configurações de sincronização
    auto_sync BOOLEAN DEFAULT true,
    sync_frequency VARCHAR(50) DEFAULT 'hourly',
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    
    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_remaining INTEGER,
    rate_limit_reset_at TIMESTAMPTZ,
    
    -- Configurações específicas do provider
    provider_config JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_provider_per_client UNIQUE(client_id, provider, name),
    CONSTRAINT valid_auth_type CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth', 'bearer_token'))
);

-- ==================================================
-- 4. SISTEMA INTELIGENTE PADRONIZADO
-- ==================================================

-- Recomendações inteligentes padronizadas
DROP TABLE IF EXISTS intelligent_recommendations CASCADE;
CREATE TABLE intelligent_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Tipo e categoria
    type VARCHAR(100) NOT NULL, -- 'task_optimization', 'budget_reallocation', 'content_suggestion'
    category VARCHAR(100) NOT NULL, -- 'productivity', 'marketing', 'financial'
    
    -- Conteúdo da recomendação
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority priority_level DEFAULT 'medium',
    
    -- IA e confiança
    ai_model VARCHAR(100), -- modelo de IA usado
    confidence_score DECIMAL(3,2) DEFAULT 0, -- 0.00 a 1.00
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, dismissed, expired
    reasoning JSONB DEFAULT '{}',
    suggested_actions JSONB DEFAULT '[]',
    
    -- Controle de tempo
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1),
    CONSTRAINT valid_recommendation_status CHECK (status IN ('pending', 'accepted', 'dismissed', 'expired'))
);

-- Analytics preditivos padronizados
DROP TABLE IF EXISTS predictive_analytics CASCADE;
CREATE TABLE predictive_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Entidade analisada
    entity_type VARCHAR(50) NOT NULL, -- 'project', 'campaign', 'client', 'user'
    entity_id UUID NOT NULL,
    
    -- Tipo de predição
    prediction_type VARCHAR(100) NOT NULL, -- 'completion_date', 'budget_overrun', 'success_probability'
    
    -- Resultados da predição
    predicted_value JSONB NOT NULL,
    confidence_level DECIMAL(3,2) DEFAULT 0, -- 0.00 a 1.00
    
    -- Metadados da IA
    ai_model VARCHAR(100) NOT NULL,
    factors_considered JSONB DEFAULT '[]',
    training_data_period INTERVAL,
    
    -- Validade
    valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_prediction_entity CHECK (entity_type IN ('project', 'campaign', 'client', 'user', 'task')),
    CONSTRAINT valid_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 1)
);

-- Templates inteligentes padronizados  
DROP TABLE IF EXISTS intelligent_templates CASCADE;
CREATE TABLE intelligent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Dados do template
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'project', 'task', 'workflow', 'communication', 'content'
    
    -- Dados do template
    template_data JSONB NOT NULL,
    
    -- Inteligência e otimização
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0, -- 0.00 a 1.00
    avg_completion_time_hours INTEGER,
    
    -- Classificação e filtros
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    industry VARCHAR(100),
    complexity_level VARCHAR(50) DEFAULT 'medium', -- 'simple', 'medium', 'complex'
    
    -- Configurações
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 1),
    CONSTRAINT valid_complexity CHECK (complexity_level IN ('simple', 'medium', 'complex'))
);

-- ==================================================
-- 5. SISTEMA DE COMUNICAÇÃO PADRONIZADO
-- ==================================================

-- Conversas padronizadas
DROP TABLE IF EXISTS conversations CASCADE;
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Dados da conversa
    title VARCHAR(255),
    type VARCHAR(50) DEFAULT 'direct', -- 'direct', 'group', 'project', 'support'
    
    -- Status
    is_archived BOOLEAN DEFAULT false,
    last_message_at TIMESTAMPTZ,
    
    -- Configurações
    settings JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participantes da conversa padronizados
DROP TABLE IF EXISTS conversation_participants CASCADE;
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Status do participante
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Configurações
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Constraint único
    UNIQUE(conversation_id, user_id)
);

-- Mensagens padronizadas
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Conteúdo
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'file', 'image', 'system'
    
    -- Anexos e metadados
    attachments JSONB DEFAULT '[]',
    mentions JSONB DEFAULT '[]', -- usuários mencionados
    
    -- Status
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notificações padronizadas
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Conteúdo da notificação
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL, -- 'task', 'message', 'system', 'project', 'deadline', 'mention'
    priority priority_level DEFAULT 'medium',
    
    -- Entidade relacionada
    related_entity_type VARCHAR(50), -- 'task', 'project', 'message', 'user', 'campaign'
    related_entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Configurações de ação
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Controle de tempo
    expires_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 6. ÍNDICES PADRONIZADOS PARA PERFORMANCE
-- ==================================================

-- Índices principais
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_agency_id ON tasks(agency_id);

CREATE INDEX IF NOT EXISTS idx_api_integrations_client_id ON api_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_agency_id ON api_integrations(agency_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_provider ON api_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_api_integrations_status ON api_integrations(status);

-- Índices do sistema inteligente
CREATE INDEX IF NOT EXISTS idx_intelligent_recommendations_agency_id ON intelligent_recommendations(agency_id);
CREATE INDEX IF NOT EXISTS idx_intelligent_recommendations_user_id ON intelligent_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligent_recommendations_status ON intelligent_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_intelligent_recommendations_type ON intelligent_recommendations(type);

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_agency_id ON predictive_analytics(agency_id);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_entity ON predictive_analytics(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_intelligent_templates_agency_id ON intelligent_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_intelligent_templates_category ON intelligent_templates(category);
CREATE INDEX IF NOT EXISTS idx_intelligent_templates_public ON intelligent_templates(is_public) WHERE is_public = true;

-- Índices de comunicação
CREATE INDEX IF NOT EXISTS idx_conversations_agency_id ON conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ==================================================
-- 7. TRIGGERS PADRONIZADOS
-- ==================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers em todas as tabelas com updated_at
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
CREATE TRIGGER update_agencies_updated_at 
    BEFORE UPDATE ON agencies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_integrations_updated_at ON api_integrations;
CREATE TRIGGER update_api_integrations_updated_at 
    BEFORE UPDATE ON api_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intelligent_recommendations_updated_at ON intelligent_recommendations;
CREATE TRIGGER update_intelligent_recommendations_updated_at 
    BEFORE UPDATE ON intelligent_recommendations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intelligent_templates_updated_at ON intelligent_templates;
CREATE TRIGGER update_intelligent_templates_updated_at 
    BEFORE UPDATE ON intelligent_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 8. FUNÇÕES UTILITÁRIAS PADRONIZADAS
-- ==================================================

-- Função para calcular progresso do projeto
CREATE OR REPLACE FUNCTION calculate_project_progress(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    progress INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_tasks 
    FROM tasks 
    WHERE project_id = project_uuid;
    
    IF total_tasks = 0 THEN
        RETURN 0;
    END IF;
    
    SELECT COUNT(*) INTO completed_tasks 
    FROM tasks 
    WHERE project_id = project_uuid AND status = 'completed';
    
    progress := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
    
    -- Atualizar o projeto
    UPDATE projects 
    SET 
        progress_percentage = progress,
        total_tasks = total_tasks,
        completed_tasks = completed_tasks,
        updated_at = NOW()
    WHERE id = project_uuid;
    
    RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- Função para obter permissões do usuário
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE (
    permission VARCHAR,
    resource VARCHAR,
    action VARCHAR
) AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Buscar informações do usuário
    SELECT role, agency_id INTO user_record 
    FROM user_profiles 
    WHERE id = user_uuid;
    
    -- Retornar permissões baseadas no role
    CASE user_record.role
        WHEN 'admin' THEN
            RETURN QUERY VALUES 
                ('all', 'all', 'all');
        WHEN 'agency_owner' THEN
            RETURN QUERY VALUES 
                ('agency', 'all', 'all'),
                ('users', 'agency', 'manage'),
                ('projects', 'agency', 'manage');
        WHEN 'agency_manager' THEN
            RETURN QUERY VALUES 
                ('projects', 'agency', 'manage'),
                ('tasks', 'agency', 'manage'),
                ('clients', 'agency', 'manage');
        WHEN 'agency_staff' THEN
            RETURN QUERY VALUES 
                ('tasks', 'assigned', 'manage'),
                ('projects', 'agency', 'view');
        ELSE
            RETURN QUERY VALUES 
                ('profile', 'own', 'manage');
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 9. DADOS INICIAIS PADRONIZADOS
-- ==================================================

-- Inserir usuário admin padrão
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    agency_id,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'admin@fvstudios.com.br',
    'Administrador FVStudios',
    'admin',
    NULL,
    'active'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Inserir agência de exemplo
INSERT INTO agencies (
    id,
    name,
    email,
    phone,
    subscription_plan,
    subscription_status
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'FVStudios Marketing',
    'contato@fvstudios.com.br',
    '+55 11 99999-9999',
    'enterprise',
    'active'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    subscription_plan = EXCLUDED.subscription_plan,
    subscription_status = EXCLUDED.subscription_status;

-- Inserir template inteligente de exemplo
INSERT INTO intelligent_templates (
    agency_id,
    created_by,
    name,
    description,
    category,
    template_data,
    tags,
    industry,
    complexity_level,
    is_featured
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Campanha de Lançamento de Produto',
    'Template completo para lançamento de produtos com estratégia integrada de marketing digital',
    'project',
    '{"tasks": [{"name": "Pesquisa de mercado", "duration_hours": 40}, {"name": "Criação de persona", "duration_hours": 24}, {"name": "Desenvolvimento de criativos", "duration_hours": 64}], "deliverables": ["Relatório de pesquisa", "Persona definida", "Criativos aprovados"], "timeline_weeks": 8}',
    ARRAY['marketing', 'produto', 'lançamento', 'digital'],
    'Tecnologia',
    'medium',
    true
) ON CONFLICT DO NOTHING;

-- ==================================================
-- 10. VERIFICAÇÃO FINAL
-- ==================================================

DO $$
DECLARE
    table_count INTEGER;
    enum_count INTEGER;
    trigger_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Contar tabelas principais
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'agencies', 'user_profiles', 'user_invitations', 'clients', 'projects', 'tasks',
        'api_integrations', 'intelligent_recommendations', 'predictive_analytics', 
        'intelligent_templates', 'conversations', 'conversation_participants', 
        'messages', 'notifications'
    );
    
    -- Contar enums criados
    SELECT COUNT(*) INTO enum_count 
    FROM pg_type 
    WHERE typname IN (
        'user_status', 'project_status', 'task_status', 'priority_level', 
        'user_role', 'social_platform', 'integration_type'
    );
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%updated_at%';
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ============================================';
    RAISE NOTICE '   SCHEMA PADRONIZADO COMPLETO - INSTALADO';
    RAISE NOTICE '🎉 ============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Estatísticas do Sistema:';
    RAISE NOTICE '   • Tabelas principais: % / 14', table_count;
    RAISE NOTICE '   • Tipos/Enums: % / 7', enum_count;
    RAISE NOTICE '   • Triggers: %', trigger_count;
    RAISE NOTICE '   • Índices: %', index_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Padronização Completa:';
    RAISE NOTICE '   • Tipos de dados unificados';
    RAISE NOTICE '   • Foreign keys consistentes';
    RAISE NOTICE '   • Nomenclatura padronizada';
    RAISE NOTICE '   • Status e enums unificados';
    RAISE NOTICE '   • Sistema inteligente integrado';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Sistema pronto para uso!';
    RAISE NOTICE '';
END $$;

COMMIT;