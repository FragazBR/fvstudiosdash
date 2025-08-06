-- ==================================================
-- FVStudios Dashboard - Schema para Integração n8n e APIs Modernas
-- Sistema completo de automação e orquestração
-- ==================================================

BEGIN;

-- ==================================================
-- 1. TABELAS PARA N8N WORKFLOW SYSTEM
-- ==================================================

-- Workflows n8n registrados
CREATE TABLE IF NOT EXISTS n8n_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Informações do workflow
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(100) NOT NULL, -- briefing, analysis, planning, production, approval, campaign, reporting
    n8n_workflow_id VARCHAR(255) NOT NULL UNIQUE, -- ID no n8n
    
    -- Status e configuração
    is_active BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}', -- configurações específicas do workflow
    
    -- Triggers e condições
    triggers JSONB DEFAULT '[]', -- eventos que disparam o workflow
    conditions JSONB DEFAULT '{}', -- condições para execução
    
    -- Metadados
    version VARCHAR(20) DEFAULT '1.0',
    tags TEXT[] DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_workflow_type CHECK (workflow_type IN (
        'briefing', 'analysis', 'planning', 'production', 
        'approval', 'campaign', 'reporting', 'general'
    ))
);

-- Agentes de IA configurados
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL, -- openai, claude, cohere, custom
    model VARCHAR(100) NOT NULL, -- gpt-4-turbo, claude-3-opus, etc.
    
    -- Configuração da IA
    system_prompt TEXT NOT NULL,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    top_p DECIMAL(3,2) DEFAULT 1.0,
    frequency_penalty DECIMAL(3,2) DEFAULT 0.0,
    presence_penalty DECIMAL(3,2) DEFAULT 0.0,
    
    -- Configurações avançadas
    configuration JSONB DEFAULT '{}',
    tools JSONB DEFAULT '[]', -- ferramentas disponíveis para o agente
    knowledge_base_ids TEXT[] DEFAULT '{}', -- bases de conhecimento
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_ai_type CHECK (type IN ('openai', 'claude', 'cohere', 'custom')),
    CONSTRAINT valid_temperature CHECK (temperature >= 0.0 AND temperature <= 2.0),
    CONSTRAINT valid_top_p CHECK (top_p >= 0.0 AND top_p <= 1.0)
);

-- Execuções de workflows
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES n8n_workflows(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Identificação da execução
    execution_id VARCHAR(255) NOT NULL UNIQUE, -- ID no n8n
    parent_execution_id VARCHAR(255), -- para workflows encadeados
    
    -- Status da execução
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    progress INTEGER DEFAULT 0, -- 0-100
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Dados
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    execution_data JSONB DEFAULT '{}',
    
    -- Erro handling
    error_message TEXT,
    error_details JSONB DEFAULT '{}',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Métricas
    ai_tokens_used INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,4) DEFAULT 0.0000,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'success', 'error', 'cancelled', 'timeout')),
    CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- ==================================================
-- 2. WHATSAPP BUSINESS API
-- ==================================================

-- Conversas do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Informações do contato
    phone_number VARCHAR(20) NOT NULL,
    phone_number_id VARCHAR(50) NOT NULL, -- ID do número no WhatsApp Business
    contact_name VARCHAR(255),
    contact_profile_pic TEXT,
    
    -- Status da conversa
    status VARCHAR(50) DEFAULT 'active', -- active, paused, closed, archived
    current_step VARCHAR(100), -- para controle de fluxo
    context JSONB DEFAULT '{}', -- contexto da conversa para IA
    
    -- Classificação automática
    intent VARCHAR(100), -- briefing, support, complaint, information
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    sentiment VARCHAR(50), -- positive, neutral, negative
    
    -- Workflow relacionado
    active_workflow_id UUID REFERENCES n8n_workflows(id) ON DELETE SET NULL,
    workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
    
    -- Métricas
    message_count INTEGER DEFAULT 0,
    response_time_avg INTEGER, -- tempo médio de resposta em segundos
    satisfaction_score INTEGER, -- 1-5
    
    -- Timing
    first_message_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    last_response_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'closed', 'archived')),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT valid_sentiment CHECK (sentiment IN ('positive', 'neutral', 'negative', 'unknown'))
);

-- Mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    
    -- Identificação da mensagem
    message_id VARCHAR(255) NOT NULL UNIQUE, -- ID do WhatsApp
    wamid VARCHAR(255), -- WhatsApp Message ID
    
    -- Direção e tipo
    direction VARCHAR(20) NOT NULL, -- inbound, outbound
    message_type VARCHAR(50) NOT NULL, -- text, image, video, audio, document, template
    
    -- Conteúdo
    content TEXT,
    media_url TEXT,
    media_caption TEXT,
    media_mime_type VARCHAR(100),
    media_sha256 VARCHAR(64),
    
    -- Template (para mensagens de template)
    template_name VARCHAR(100),
    template_language VARCHAR(10),
    template_parameters JSONB DEFAULT '{}',
    
    -- Status de entrega (para outbound)
    delivery_status VARCHAR(50), -- sent, delivered, read, failed
    delivery_timestamp TIMESTAMPTZ,
    
    -- Processamento por IA
    processed_by_ai BOOLEAN DEFAULT false,
    ai_response_generated BOOLEAN DEFAULT false,
    ai_confidence DECIMAL(3,2), -- confiança da resposta da IA
    ai_intent VARCHAR(100), -- intenção detectada pela IA
    
    -- Metadados
    timestamp TIMESTAMPTZ NOT NULL,
    context JSONB DEFAULT '{}',
    raw_data JSONB DEFAULT '{}', -- dados brutos do webhook
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_direction CHECK (direction IN ('inbound', 'outbound')),
    CONSTRAINT valid_message_type CHECK (message_type IN (
        'text', 'image', 'video', 'audio', 'document', 'template', 
        'location', 'contact', 'interactive', 'reaction'
    )),
    CONSTRAINT valid_delivery_status CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed'))
);

-- ==================================================
-- 3. CANVA INTEGRATION
-- ==================================================

-- Designs do Canva
CREATE TABLE IF NOT EXISTS canva_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- IDs do Canva
    canva_design_id VARCHAR(255) NOT NULL UNIQUE,
    canva_template_id VARCHAR(255),
    canva_brand_id VARCHAR(255),
    
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- URLs do Canva
    preview_url TEXT,
    edit_url TEXT NOT NULL,
    download_url TEXT,
    thumbnail_url TEXT,
    
    -- Metadados do design
    width INTEGER,
    height INTEGER,
    format VARCHAR(50), -- post, story, banner, presentation, etc.
    platform VARCHAR(50), -- instagram, facebook, linkedin, tiktok, etc.
    
    -- Status do design
    status VARCHAR(50) DEFAULT 'draft', -- draft, in_review, approved, published, archived
    version_number INTEGER DEFAULT 1,
    
    -- IA e automação
    ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    ai_model VARCHAR(100),
    generation_parameters JSONB DEFAULT '{}',
    
    -- Brand compliance
    brand_compliant BOOLEAN DEFAULT true,
    brand_guidelines_applied JSONB DEFAULT '{}',
    
    -- Colaboração
    collaborators UUID[] DEFAULT '{}',
    last_edited_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    last_edited_at TIMESTAMPTZ,
    
    -- Export settings
    export_formats TEXT[] DEFAULT '{}', -- png, jpg, pdf, mp4, etc.
    export_quality VARCHAR(20) DEFAULT 'high', -- low, medium, high
    
    -- Métricas
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'archived')),
    CONSTRAINT valid_export_quality CHECK (export_quality IN ('low', 'medium', 'high'))
);

-- Versões de designs
CREATE TABLE IF NOT EXISTS canva_design_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID NOT NULL REFERENCES canva_designs(id) ON DELETE CASCADE,
    
    -- Versioning
    version_number INTEGER NOT NULL,
    version_name VARCHAR(255),
    changes_summary TEXT,
    
    -- Snapshot do design
    canva_design_id VARCHAR(255) NOT NULL, -- ID da versão no Canva
    preview_url TEXT,
    edit_url TEXT,
    
    -- Metadados
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_current BOOLEAN DEFAULT false,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(design_id, version_number)
);

-- Templates do Canva favoritos/customizados
CREATE TABLE IF NOT EXISTS canva_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Template info
    canva_template_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    -- Visualização
    preview_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- Metadados
    width INTEGER,
    height INTEGER,
    format VARCHAR(50),
    platform VARCHAR(50),
    is_premium BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    is_custom BOOLEAN DEFAULT false,
    
    -- Uso
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(agency_id, canva_template_id)
);

-- ==================================================
-- 4. API INTEGRATIONS TABLE (CREATE IF NOT EXISTS)
-- ==================================================

-- Criar tabela api_integrations se não existir
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
    oauth_client_id TEXT, -- OAuth Client ID
    client_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    api_key_encrypted TEXT,
    
    -- Metadados da API
    api_version VARCHAR(20),
    scopes TEXT[] DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    rate_limits JSONB DEFAULT '{}',
    
    -- Status da integração
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync TIMESTAMPTZ,
    sync_frequency INTERVAL DEFAULT '1 hour',
    auto_sync BOOLEAN DEFAULT true,
    
    -- Configurações de webhook
    webhook_url TEXT,
    webhook_secret TEXT,
    
    -- Configurações extras
    configuration JSONB DEFAULT '{}',
    provider_category VARCHAR(100) DEFAULT 'marketing',
    sync_enabled BOOLEAN DEFAULT true,
    last_health_check TIMESTAMPTZ,
    health_status VARCHAR(50) DEFAULT 'unknown',
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'pending')),
    CONSTRAINT valid_auth_type CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth', 'bearer_token')),
    CONSTRAINT valid_provider_type CHECK (provider_type IN ('ads', 'social_media', 'analytics', 'crm', 'email_marketing', 'automation'))
);

-- Índices para api_integrations
CREATE INDEX IF NOT EXISTS idx_api_integrations_client_id ON api_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_agency_id ON api_integrations(agency_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_provider ON api_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_api_integrations_status ON api_integrations(status);
CREATE INDEX IF NOT EXISTS idx_api_integrations_active ON api_integrations(is_active) WHERE is_active = true;

-- RLS para api_integrations
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_integrations_user_access" ON api_integrations
    FOR ALL USING (
        client_id = auth.uid() OR 
        agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Trigger para updated_at
CREATE TRIGGER update_api_integrations_updated_at 
    BEFORE UPDATE ON api_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Métricas de performance das integrações
CREATE TABLE IF NOT EXISTS api_integration_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    
    -- Período das métricas
    date DATE NOT NULL,
    
    -- Métricas de uso
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    
    -- Performance
    avg_response_time_ms INTEGER DEFAULT 0,
    min_response_time_ms INTEGER DEFAULT 0,
    max_response_time_ms INTEGER DEFAULT 0,
    
    -- Rate limiting
    rate_limit_hits INTEGER DEFAULT 0,
    quota_usage DECIMAL(5,2) DEFAULT 0.00, -- porcentagem da quota usada
    
    -- Dados sincronizados
    records_synced INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    
    -- Custos (se aplicável)
    estimated_cost DECIMAL(10,4) DEFAULT 0.0000,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(integration_id, date)
);

-- ==================================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ==================================================

-- Índices para workflows
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_agency_id ON n8n_workflows(agency_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_type ON n8n_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_active ON n8n_workflows(is_active) WHERE is_active = true;

-- Índices para execuções
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_project_id ON workflow_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);

-- Índices para WhatsApp
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_agency_id ON whatsapp_conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);

-- Índices para Canva
CREATE INDEX IF NOT EXISTS idx_canva_designs_project_id ON canva_designs(project_id);
CREATE INDEX IF NOT EXISTS idx_canva_designs_status ON canva_designs(status);
CREATE INDEX IF NOT EXISTS idx_canva_designs_created_by ON canva_designs(created_by);
CREATE INDEX IF NOT EXISTS idx_canva_designs_ai_generated ON canva_designs(ai_generated);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_api_integration_metrics_integration_date ON api_integration_metrics(integration_id, date);
CREATE INDEX IF NOT EXISTS idx_api_integration_metrics_date ON api_integration_metrics(date);

-- ==================================================
-- 6. TRIGGERS PARA UPDATED_AT
-- ==================================================

CREATE TRIGGER update_n8n_workflows_updated_at 
    BEFORE UPDATE ON n8n_workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at 
    BEFORE UPDATE ON ai_agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at 
    BEFORE UPDATE ON whatsapp_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canva_designs_updated_at 
    BEFORE UPDATE ON canva_designs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canva_templates_updated_at 
    BEFORE UPDATE ON canva_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE n8n_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE canva_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE canva_design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE canva_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integration_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para workflows (baseadas na agência)
CREATE POLICY "n8n_workflows_agency_access" ON n8n_workflows
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para execuções (através do workflow)
CREATE POLICY "workflow_executions_access" ON workflow_executions
    FOR ALL USING (
        workflow_id IN (
            SELECT id FROM n8n_workflows WHERE agency_id IN (
                SELECT agency_id FROM user_profiles WHERE id = auth.uid()
            )
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para WhatsApp (baseadas na agência)
CREATE POLICY "whatsapp_conversations_agency_access" ON whatsapp_conversations
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "whatsapp_messages_access" ON whatsapp_messages
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM whatsapp_conversations WHERE agency_id IN (
                SELECT agency_id FROM user_profiles WHERE id = auth.uid()
            )
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para Canva (através do projeto)
CREATE POLICY "canva_designs_project_access" ON canva_designs
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE agency_id IN (
                SELECT agency_id FROM user_profiles WHERE id = auth.uid()
            )
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==================================================
-- 8. FUNÇÕES UTILITÁRIAS
-- ==================================================

-- Função para obter estatísticas de workflow
CREATE OR REPLACE FUNCTION get_workflow_stats(agency_uuid UUID)
RETURNS TABLE (
    total_workflows INTEGER,
    active_workflows INTEGER,
    total_executions INTEGER,
    successful_executions INTEGER,
    failed_executions INTEGER,
    avg_execution_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_workflows,
        COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_workflows,
        COALESCE(SUM(exec_stats.total_executions), 0)::INTEGER as total_executions,
        COALESCE(SUM(exec_stats.successful_executions), 0)::INTEGER as successful_executions,
        COALESCE(SUM(exec_stats.failed_executions), 0)::INTEGER as failed_executions,
        COALESCE(AVG(exec_stats.avg_duration), INTERVAL '0')::INTERVAL as avg_execution_time
    FROM n8n_workflows w
    LEFT JOIN (
        SELECT 
            workflow_id,
            COUNT(*) as total_executions,
            COUNT(*) FILTER (WHERE status = 'success') as successful_executions,
            COUNT(*) FILTER (WHERE status = 'error') as failed_executions,
            AVG(duration_ms * INTERVAL '1 millisecond') as avg_duration
        FROM workflow_executions
        WHERE started_at >= NOW() - INTERVAL '30 days'
        GROUP BY workflow_id
    ) exec_stats ON w.id = exec_stats.workflow_id
    WHERE w.agency_id = agency_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar execuções antigas
CREATE OR REPLACE FUNCTION cleanup_old_executions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM workflow_executions 
    WHERE started_at < NOW() - INTERVAL '90 days'
    AND status IN ('success', 'error', 'cancelled');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 9. DADOS INICIAIS (WORKFLOWS PADRÃO)
-- ==================================================

-- Inserir workflows padrão para cada agência existente
INSERT INTO n8n_workflows (agency_id, created_by, name, workflow_type, n8n_workflow_id, configuration)
SELECT 
    a.id as agency_id,
    (SELECT id FROM user_profiles WHERE agency_id = a.id AND role IN ('agency_owner', 'admin') LIMIT 1) as created_by,
    'WhatsApp Briefing Collection' as name,
    'briefing' as workflow_type,
    'whatsapp_briefing_' || a.id as n8n_workflow_id,
    jsonb_build_object(
        'triggers', jsonb_build_array('whatsapp_message'),
        'ai_agents', jsonb_build_array(
            jsonb_build_object(
                'name', 'briefing_agent',
                'type', 'openai',
                'model', 'gpt-4-turbo',
                'temperature', 0.7
            )
        ),
        'integrations', jsonb_build_array('whatsapp', 'supabase'),
        'output_format', 'json'
    ) as configuration
FROM agencies a
WHERE NOT EXISTS (
    SELECT 1 FROM n8n_workflows w 
    WHERE w.agency_id = a.id AND w.workflow_type = 'briefing'
);

-- ==================================================
-- 10. COMENTÁRIOS FINAIS
-- ==================================================

COMMIT;

-- Verification queries
DO $$
DECLARE
    table_count INTEGER;
    workflow_count INTEGER;
BEGIN
    -- Contar novas tabelas criadas
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'n8n_workflows', 'ai_agents', 'workflow_executions',
        'whatsapp_conversations', 'whatsapp_messages',
        'canva_designs', 'canva_design_versions', 'canva_templates',
        'api_integration_metrics'
    );
    
    -- Contar workflows padrão criados
    SELECT COUNT(*) INTO workflow_count FROM n8n_workflows;
    
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ======================================';
    RAISE NOTICE '   N8N Integration Schema - Completed!';
    RAISE NOTICE '🚀 ======================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ New Tables Created: %', table_count;
    RAISE NOTICE '✅ Default Workflows: %', workflow_count;
    RAISE NOTICE '✅ RLS Policies Applied';
    RAISE NOTICE '✅ Indexes Created for Performance';
    RAISE NOTICE '✅ Triggers Configured';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ready for:';
    RAISE NOTICE '   - n8n Workflow Orchestration';  
    RAISE NOTICE '   - WhatsApp Business API';
    RAISE NOTICE '   - AI Agents Integration';
    RAISE NOTICE '   - Canva Design System';
    RAISE NOTICE '   - Extended API Metrics';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next Steps:';
    RAISE NOTICE '   1. Configure n8n instance';
    RAISE NOTICE '   2. Setup WhatsApp Business webhooks';
    RAISE NOTICE '   3. Configure AI agents';
    RAISE NOTICE '   4. Test Canva API integration';
    RAISE NOTICE '';
END $$;