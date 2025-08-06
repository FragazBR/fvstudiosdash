-- ==================================================
-- FVStudios Dashboard - Migração Completa CORRIGIDA
-- Versão sem erros de integration_id
-- ==================================================

-- IMPORTANTE: Execute este arquivo em um banco PostgreSQL limpo

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
    email VARCHAR(255) UNIQUE NOT NULL,
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
    email VARCHAR(255) NOT NULL,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clientes da agência
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    company VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    contract_value DECIMAL(12,2),
    contract_duration INTEGER, -- em meses
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projetos
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning',
    budget DECIMAL(12,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contatos
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interações com contatos
CREATE TABLE IF NOT EXISTS contact_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 3. SISTEMA DE INTEGRAÇÕES DE API (VERSÃO SIMPLIFICADA)
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
    oauth_client_id TEXT,
    client_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    api_key_encrypted TEXT,
    
    -- Status e validação
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_valid BOOLEAN DEFAULT false,
    last_validated_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint única por cliente
    CONSTRAINT unique_provider_per_client UNIQUE(client_id, provider, name),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'pending')),
    CONSTRAINT valid_auth_type CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth', 'bearer_token'))
);

-- ==================================================
-- 4. SISTEMA DE CONVERSAS E MENSAGENS
-- ==================================================

-- Conversas (WhatsApp, etc.)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL, -- whatsapp, instagram, facebook, email
    external_id VARCHAR(255), -- ID da conversa na plataforma
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, closed, archived
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participantes da conversa
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'participant', -- participant, moderator, observer
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ
);

-- Mensagens
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL, -- user, contact, system, bot
    sender_id UUID, -- pode referenciar user_profiles ou contacts
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, video, audio, file, template
    media_url TEXT,
    external_id VARCHAR(255), -- ID da mensagem na plataforma
    delivered BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 5. SISTEMA DE AUTOMAÇÃO E WORKFLOWS
-- ==================================================

-- Recomendações inteligentes
CREATE TABLE IF NOT EXISTS intelligent_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    type VARCHAR(100) NOT NULL, -- task_optimization, budget_reallocation, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    confidence_score INTEGER DEFAULT 0, -- 0-100
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, dismissed, expired
    reasoning JSONB DEFAULT '{}',
    suggested_actions JSONB DEFAULT '[]',
    
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics preditivos
CREATE TABLE IF NOT EXISTS predictive_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- project, campaign, client
    entity_id UUID NOT NULL,
    
    prediction_type VARCHAR(100) NOT NULL, -- completion_date, budget_overrun, success_probability
    predicted_value JSONB NOT NULL,
    confidence_level INTEGER DEFAULT 0, -- 0-100
    
    factors_considered JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Templates inteligentes
CREATE TABLE IF NOT EXISTS intelligent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- project, task, workflow, communication
    template_data JSONB NOT NULL,
    
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ==================================================

-- Índices principais
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_client_id ON api_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_agency_id ON api_integrations(agency_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agency_id ON conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- ==================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (usuários podem ver dados da própria agência)
CREATE POLICY "agency_isolation" ON user_profiles
    FOR ALL USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "clients_agency_access" ON clients
    FOR ALL USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "projects_agency_access" ON projects
    FOR ALL USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "tasks_agency_access" ON tasks
    FOR ALL USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "contacts_agency_access" ON contacts
    FOR ALL USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "api_integrations_access" ON api_integrations
    FOR ALL USING (
        client_id = auth.uid() OR 
        agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "conversations_agency_access" ON conversations
    FOR ALL USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "messages_conversation_access" ON messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE agency_id = (
                SELECT agency_id FROM user_profiles WHERE id = auth.uid()
            )
        )
    );

-- ==================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ==================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER update_agencies_updated_at 
    BEFORE UPDATE ON agencies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_integrations_updated_at 
    BEFORE UPDATE ON api_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 9. REABILITAR RLS
-- ==================================================

-- Reabilitar RLS normal
SET session_replication_role = DEFAULT;

-- Commit das mudanças
COMMIT;

-- ==================================================
-- 10. VERIFICAÇÃO FINAL
-- ==================================================

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Contar tabelas criadas
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'agencies', 'user_profiles', 'user_invitations', 'clients', 'projects', 
        'tasks', 'contacts', 'contact_interactions', 'api_integrations',
        'conversations', 'conversation_participants', 'messages',
        'intelligent_recommendations', 'predictive_analytics', 'intelligent_templates'
    );
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '   FVSTUDIOS DASHBOARD - INSTALAÇÃO COMPLETA';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Estatísticas:';
    RAISE NOTICE '   • Tabelas: % / 15', table_count;
    RAISE NOTICE '   • Índices: %', index_count;
    RAISE NOTICE '   • Políticas RLS: %', policy_count;
    RAISE NOTICE '';
    
    IF table_count = 15 THEN
        RAISE NOTICE '✅ INSTALAÇÃO 100%% COMPLETA!';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Próximos passos:';
        RAISE NOTICE '   1. Execute os schemas adicionais (INTELLIGENT_SYSTEM, etc.)';
        RAISE NOTICE '   2. Configure as variáveis de ambiente';
        RAISE NOTICE '   3. Teste a aplicação';
    ELSE
        RAISE NOTICE '❌ Algumas tabelas não foram criadas!';
        RAISE NOTICE '   Verifique os logs de erro acima.';
    END IF;
    RAISE NOTICE '';
END $$;