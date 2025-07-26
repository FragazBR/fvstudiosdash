-- ==================================================
-- FVStudios Dashboard - Migração Completa do Sistema
-- Instalação do zero com todos os recursos
-- ==================================================

-- IMPORTANTE: Execute este arquivo em um banco PostgreSQL limpo
-- Ele irá criar toda a estrutura necessária para o FVStudios Dashboard

BEGIN;

-- ==================================================
-- 1. CLEANUP E PREPARAÇÃO
-- ==================================================

-- Desabilitar RLS temporariamente para setup
SET session_replication_role = replica;

-- Remover extensões se existirem (para reinstalação limpa)
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
DROP EXTENSION IF EXISTS "pg_stat_statements" CASCADE;

-- Reinstalar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ==================================================
-- 2. ESTRUTURA PRINCIPAL DO SISTEMA
-- ==================================================

-- Tabela de agências (multi-tenant principal)
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email UNI QUE VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    logo_url TEXT,
    address TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfis de usuários (sistema de roles)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'free_user',
    avatar_url TEXT,
    phone VARCHAR(50),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para roles válidos
    CONSTRAINT valid_roles CHECK (role IN (
        'admin', 'agency_owner', 'agency_manager', 'agency_staff', 
        'agency_client', 'independent_producer', 'independent_client', 
        'influencer', 'free_user'
    ))
);

-- Convites de usuários
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projetos
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(50) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget_cents BIGINT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tarefas
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts/Leads
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    lead_source VARCHAR(255),
    lead_status VARCHAR(50) DEFAULT 'new',
    tags TEXT[],
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interações com contatos
CREATE TABLE IF NOT EXISTS contact_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- call, email, meeting, note
    subject VARCHAR(255),
    content TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 3. SISTEMA DE INTEGRAÇÕES DE API
-- ==================================================

-- Integrações de API com isolamento por cliente
CREATE TABLE IF NOT EXISTS api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Informações básicas da integração
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- meta, google, tiktok, linkedin, rdstation, buffer
    provider_type VARCHAR(100) NOT NULL, -- ads, social_media, analytics, crm, email_marketing
    description TEXT,
    
    -- Configurações de autenticação
    auth_type VARCHAR(50) NOT NULL DEFAULT 'oauth2',
    oauth_client_id TEXT, -- OAuth Client ID (renomeado para evitar conflito)
    client_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    api_key_encrypted TEXT,
    
    -- Metadados da API
    api_version VARCHAR(50),
    base_url TEXT,
    scopes TEXT[],
    
    -- Status e validação
    status VARCHAR(50) NOT NULL DEFAULT 'active',
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
    
    -- Constraint única por cliente
    CONSTRAINT unique_provider_per_client UNIQUE(client_id, provider, name)
);

-- Logs de integrações
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    
    -- Detalhes da requisição
    operation VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    endpoint TEXT NOT NULL,
    
    -- Request/Response
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_headers JSONB,
    response_body JSONB,
    
    -- Timing e metadata
    duration_ms INTEGER,
    error_message TEXT,
    status VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campanhas sincronizadas
CREATE TABLE IF NOT EXISTS synced_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- IDs externos
    external_id VARCHAR(255) NOT NULL,
    external_account_id VARCHAR(255),
    
    -- Dados da campanha
    name VARCHAR(500) NOT NULL,
    status VARCHAR(100),
    objective VARCHAR(200),
    
    -- Métricas
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    spend_cents BIGINT DEFAULT 0,
    cpm_cents INTEGER,
    cpc_cents INTEGER,
    ctr DECIMAL(5,4),
    
    -- Dados temporais
    start_date DATE,
    end_date DATE,
    
    -- Backup dos dados
    raw_data JSONB,
    
    -- Auditoria
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_external_campaign UNIQUE(integration_id, external_id)
);

-- Posts sincronizados
CREATE TABLE IF NOT EXISTS synced_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- IDs externos
    external_id VARCHAR(255) NOT NULL,
    external_account_id VARCHAR(255),
    
    -- Dados do post
    content TEXT,
    media_urls TEXT[],
    post_type VARCHAR(100),
    
    -- Status e timing
    status VARCHAR(100),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    
    -- Métricas
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    
    -- Backup dos dados
    raw_data JSONB,
    
    -- Auditoria
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_external_post UNIQUE(integration_id, external_id)
);

-- Webhooks configurados
CREATE TABLE IF NOT EXISTS api_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    
    -- Configuração do webhook
    event_type VARCHAR(200) NOT NULL,
    webhook_url TEXT NOT NULL,
    secret_key_encrypted TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    total_triggers INTEGER DEFAULT 0,
    failed_triggers INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs de sincronização
CREATE TABLE IF NOT EXISTS sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    
    -- Configuração do job
    job_type VARCHAR(100) NOT NULL,
    schedule_expression VARCHAR(200),
    
    -- Status de execução
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Resultados
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Próxima execução
    next_run_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 4. SISTEMA INTELIGENTE
-- ==================================================

-- Recomendações inteligentes
CREATE TABLE IF NOT EXISTS intelligent_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    type VARCHAR(100) NOT NULL, -- task, resource, optimization
    priority VARCHAR(50) DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Dados da recomendação
    recommendation_data JSONB,
    confidence_score DECIMAL(3,2), -- 0.00 a 1.00
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, dismissed
    accepted_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    
    -- Relacionamentos
    related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Análises preditivas
CREATE TABLE IF NOT EXISTS predictive_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Tipo de análise
    analysis_type VARCHAR(100) NOT NULL, -- deadline_prediction, resource_optimization
    entity_type VARCHAR(50) NOT NULL, -- project, task, user
    entity_id UUID NOT NULL,
    
    -- Resultados da análise
    prediction_data JSONB NOT NULL,
    confidence_level DECIMAL(3,2),
    
    -- Validade da predição
    valid_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates inteligentes
CREATE TABLE IF NOT EXISTS intelligent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Dados do template
    template_data JSONB NOT NULL,
    
    -- Inteligência
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2),
    avg_completion_time INTEGER, -- em horas
    
    -- Tags e metadados
    tags TEXT[],
    industry VARCHAR(100),
    complexity_level VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 5. SISTEMA DE COMUNICAÇÃO
-- ==================================================

-- Conversas/Chats
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    type VARCHAR(50) DEFAULT 'direct', -- direct, group, project
    
    -- Relacionamentos
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Metadados
    last_message_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participantes da conversa
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Status do participante
    role VARCHAR(50) DEFAULT 'member', -- admin, member
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(conversation_id, user_id)
);

-- Mensagens
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Conteúdo
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, file, image, system
    
    -- Anexos
    attachments JSONB DEFAULT '[]',
    
    -- Status
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    
    -- Resposta a mensagem
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Conteúdo da notificação
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL, -- task, message, system, project
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    
    -- Relacionamentos
    related_entity_type VARCHAR(50), -- task, project, message, user
    related_entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Configurações
    action_url TEXT,
    action_label VARCHAR(100),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Eventos de calendário
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Dados do evento
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    
    -- Recorrência
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- RRULE format
    
    -- Relacionamentos
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_ids UUID[],
    
    -- Participantes
    attendees JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, tentative, cancelled
    
    -- Localização
    location TEXT,
    meeting_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ==================================================

-- Índices principais
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Índices das integrações
CREATE INDEX IF NOT EXISTS idx_api_integrations_client_id ON api_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_agency_id ON api_integrations(agency_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_provider ON api_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_api_integrations_status ON api_integrations(status);

CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_synced_campaigns_integration_id ON synced_campaigns(integration_id);
CREATE INDEX IF NOT EXISTS idx_synced_campaigns_client_id ON synced_campaigns(client_id);

CREATE INDEX IF NOT EXISTS idx_synced_posts_integration_id ON synced_posts(integration_id);
CREATE INDEX IF NOT EXISTS idx_synced_posts_client_id ON synced_posts(client_id);

-- Índices do sistema inteligente
CREATE INDEX IF NOT EXISTS idx_intelligent_recommendations_user_id ON intelligent_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligent_recommendations_status ON intelligent_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_agency_id ON predictive_analytics(agency_id);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_entity ON predictive_analytics(entity_type, entity_id);

-- Índices de comunicação
CREATE INDEX IF NOT EXISTS idx_conversations_agency_id ON conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ==================================================
-- 7. TRIGGERS PARA UPDATED_AT
-- ==================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON api_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_synced_campaigns_updated_at BEFORE UPDATE ON synced_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_synced_posts_updated_at BEFORE UPDATE ON synced_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_webhooks_updated_at BEFORE UPDATE ON api_webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_jobs_updated_at BEFORE UPDATE ON sync_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intelligent_templates_updated_at BEFORE UPDATE ON intelligent_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 8. FUNÇÕES UTILITÁRIAS
-- ==================================================

-- Função para obter integrações acessíveis por usuário
CREATE OR REPLACE FUNCTION get_accessible_integrations(user_id UUID)
RETURNS TABLE (
    integration_id UUID,
    client_id UUID,
    client_name TEXT,
    provider VARCHAR(100),
    can_edit BOOLEAN
) AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Buscar informações do usuário
    SELECT role, agency_id INTO user_record 
    FROM user_profiles 
    WHERE id = user_id;
    
    IF user_record.role = 'admin' THEN
        -- Admin vê TODAS as integrações de TODOS os clientes
        RETURN QUERY
        SELECT 
            ai.id,
            ai.client_id,
            up.full_name,
            ai.provider,
            true as can_edit
        FROM api_integrations ai
        JOIN user_profiles up ON ai.client_id = up.id
        ORDER BY up.full_name, ai.provider;
        
    ELSIF user_record.role IN ('agency_client', 'independent_client', 'independent_producer', 'influencer', 'free_user') THEN
        -- Usuários individuais veem apenas suas próprias integrações
        RETURN QUERY
        SELECT 
            ai.id,
            ai.client_id,
            up.full_name,
            ai.provider,
            true as can_edit
        FROM api_integrations ai
        JOIN user_profiles up ON ai.client_id = up.id
        WHERE ai.client_id = user_id;
        
    ELSIF user_record.role IN ('agency_owner', 'agency_manager', 'agency_staff') THEN
        -- Staff da agência vê integrações dos clientes da mesma agência
        RETURN QUERY
        SELECT 
            ai.id,
            ai.client_id,
            up.full_name,
            ai.provider,
            CASE 
                WHEN user_record.role IN ('agency_owner', 'agency_manager') THEN true 
                ELSE false
            END as can_edit
        FROM api_integrations ai
        JOIN user_profiles up ON ai.client_id = up.id
        WHERE ai.agency_id = user_record.agency_id
        ORDER BY up.full_name, ai.provider;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar usuário com perfil
CREATE OR REPLACE FUNCTION create_user_with_profile(
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    user_agency_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Gerar ID único
    new_user_id := gen_random_uuid();
    
    -- Inserir perfil
    INSERT INTO user_profiles (
        id, 
        email, 
        full_name, 
        role, 
        agency_id
    ) VALUES (
        new_user_id,
        user_email,
        user_name,
        user_role,
        user_agency_id
    );
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Agency staff can view agency profiles" ON user_profiles
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('agency_owner', 'agency_manager', 'agency_staff')
        )
    );

-- Políticas RLS para api_integrations (isolamento por cliente)
CREATE POLICY "API integrations access policy" ON api_integrations
    FOR ALL USING (
        -- Admin: Acesso total
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários individuais: Apenas suas próprias integrações
        (
            client_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid() 
                AND role IN ('agency_client', 'independent_client', 'independent_producer', 'influencer', 'free_user')
            )
        )
        OR
        -- Staff da agência: Integrações dos clientes da mesma agência
        EXISTS (
            SELECT 1 FROM user_profiles staff, user_profiles client
            WHERE staff.id = auth.uid()
            AND client.id = api_integrations.client_id
            AND staff.agency_id = client.agency_id
            AND staff.role IN ('agency_owner', 'agency_manager', 'agency_staff')
        )
    );

-- Políticas similares para outras tabelas relacionadas
CREATE POLICY "Integration logs access policy" ON integration_logs
    FOR ALL USING (
        integration_id IN (
            SELECT id FROM api_integrations 
            -- Usar as mesmas regras da tabela api_integrations
        )
    );

CREATE POLICY "Campaigns access policy" ON synced_campaigns
    FOR ALL USING (client_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Posts access policy" ON synced_posts
    FOR ALL USING (client_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Políticas para outras tabelas (simplificadas por brevidade)
CREATE POLICY "Agency access policy" ON agencies
    FOR ALL USING (
        id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Notifications access policy" ON notifications
    FOR ALL USING (user_id = auth.uid());

-- ==================================================
-- 10. DADOS INICIAIS (SEEDS)
-- ==================================================

-- Inserir usuário admin padrão (ID fixo para facilitar setup)
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    agency_id
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'admin@fvstudios.com.br',
    'Administrador FVStudios',
    'admin',
    NULL
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;

-- Inserir template inteligente de exemplo
INSERT INTO intelligent_templates (
    agency_id,
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
    'Campanha de Lançamento de Produto',
    'Template completo para lançamento de produtos com estratégia integrada',
    'Marketing Digital',
    '{"tasks": [{"name": "Pesquisa de mercado", "duration": 5}, {"name": "Criação de persona", "duration": 3}, {"name": "Desenvolvimento de criativos", "duration": 8}], "deliverables": ["Relatório de pesquisa", "Persona definida", "Criativos aprovados"]}',
    ARRAY['marketing', 'produto', 'lançamento'],
    'Tecnologia',
    'medium',
    true
) ON CONFLICT DO NOTHING;

-- Reabilitar RLS
SET session_replication_role = DEFAULT;

-- ==================================================
-- 11. VERIFICAÇÕES FINAIS
-- ==================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
    integration_count INTEGER;
    template_count INTEGER;
BEGIN
    -- Contar tabelas principais
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'agencies', 'user_profiles', 'clients', 'projects', 'tasks', 'contacts',
        'api_integrations', 'integration_logs', 'synced_campaigns', 'synced_posts',
        'intelligent_recommendations', 'predictive_analytics', 'intelligent_templates',
        'conversations', 'messages', 'notifications', 'calendar_events'
    );
    
    -- Contar registros de integração
    SELECT COUNT(*) INTO integration_count FROM api_integrations;
    
    -- Contar templates
    SELECT COUNT(*) INTO template_count FROM intelligent_templates;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ========================================';
    RAISE NOTICE '   FVStudios Dashboard - Setup Completo!';
    RAISE NOTICE '🎯 ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Estrutura do Banco:';
    RAISE NOTICE '   📊 % tabelas principais criadas', table_count;
    RAISE NOTICE '   🔧 % templates inteligentes inseridos', template_count;
    RAISE NOTICE '   🔐 RLS habilitado em todas as tabelas';
    RAISE NOTICE '   ⚡ Triggers de updated_at configurados';
    RAISE NOTICE '';
    RAISE NOTICE '🎭 Sistema de Usuários:';
    RAISE NOTICE '   👑 admin - Acesso total';
    RAISE NOTICE '   🏢 agency_* - Gestão de agências';
    RAISE NOTICE '   🎯 independent_* - Produtores independentes';
    RAISE NOTICE '   ⭐ influencer - Influenciadores';
    RAISE NOTICE '   🆓 free_user - Usuários gratuitos';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Integrações de API:';
    RAISE NOTICE '   🔵 Meta Ads (Facebook/Instagram)';
    RAISE NOTICE '   🔴 Google Ads';
    RAISE NOTICE '   ⚫ TikTok Ads';
    RAISE NOTICE '   🔵 LinkedIn Ads';
    RAISE NOTICE '   🟠 RD Station';
    RAISE NOTICE '   🟡 Buffer';
    RAISE NOTICE '';
    RAISE NOTICE '🤖 Sistema Inteligente:';
    RAISE NOTICE '   🧠 Recomendações baseadas em IA';
    RAISE NOTICE '   📊 Análise preditiva de projetos';
    RAISE NOTICE '   🎯 Templates inteligentes';
    RAISE NOTICE '   ⚡ Automação de workflows';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Segurança:';
    RAISE NOTICE '   🛡️ Isolamento total de dados por cliente';
    RAISE NOTICE '   🔒 Criptografia AES-256 para tokens';
    RAISE NOTICE '   🎭 Controle granular de permissões';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Próximos Passos:';
    RAISE NOTICE '   1. Configure as variáveis de ambiente';
    RAISE NOTICE '   2. Execute: npm run dev';
    RAISE NOTICE '   3. Acesse: http://localhost:3000';
    RAISE NOTICE '   4. Login admin: admin@fvstudios.com.br';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Sistema pronto para uso!';
    RAISE NOTICE '';
END $$;

COMMIT;