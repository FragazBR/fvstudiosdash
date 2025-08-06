-- ==================================================
-- FVStudios Dashboard - Intelligent System Database Schema
-- Schema completo para sistema inteligente com IA
-- ==================================================

-- API Keys e Integrações
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL, -- 'openai', 'claude', 'meta_ads', 'google_ads', etc.
    api_key_encrypted TEXT NOT NULL, -- Chave criptografada
    api_secret_encrypted TEXT, -- Secret criptografado (quando necessário)
    additional_config JSONB DEFAULT '{}', -- Configurações extras
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, service_name)
);

-- Campanhas Inteligentes
CREATE TABLE IF NOT EXISTS intelligent_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'instagram', 'google', 'tiktok', 'linkedin'
    external_campaign_id VARCHAR(255), -- ID da campanha na plataforma
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'draft', 'completed'
    budget_current DECIMAL(10,2) DEFAULT 0,
    budget_recommended DECIMAL(10,2) DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}', -- métricas de performance
    ai_insights JSONB DEFAULT '[]', -- insights gerados pela IA
    last_optimization TIMESTAMPTZ,
    optimization_frequency INTERVAL DEFAULT '24 hours',
    auto_optimize BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conteúdo Gerado por IA
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    template_id UUID, -- referência a templates personalizados
    content_type VARCHAR(50) NOT NULL, -- 'post', 'ad', 'story', 'email', 'blog'
    platform VARCHAR(50) NOT NULL,
    target_audience TEXT,
    tone VARCHAR(50),
    keywords TEXT[], -- array de palavras-chave
    generated_text TEXT NOT NULL,
    performance_prediction INTEGER DEFAULT 0, -- 0-100
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'published', 'rejected'
    ai_model_used VARCHAR(100), -- 'gpt-4', 'claude-3', etc.
    generation_params JSONB DEFAULT '{}', -- parâmetros usados na geração
    engagement_data JSONB DEFAULT '{}', -- dados de engajamento se publicado
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates Inteligentes
CREATE TABLE IF NOT EXISTS intelligent_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    prompt_template TEXT NOT NULL,
    variables TEXT[], -- variáveis do template
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0, -- taxa de sucesso em %
    is_public BOOLEAN DEFAULT false, -- se pode ser usado por outras agências
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Otimizações de Orçamento IA
CREATE TABLE IF NOT EXISTS budget_optimizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES intelligent_campaigns(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50) NOT NULL, -- 'increase', 'decrease', 'redistribute', 'pause'
    current_budget DECIMAL(10,2) NOT NULL,
    recommended_budget DECIMAL(10,2) NOT NULL,
    expected_impact TEXT,
    confidence_score INTEGER DEFAULT 0, -- 0-100
    reasoning TEXT[],
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'applied', 'rejected', 'expired'
    applied_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights e Recomendações IA
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'campaign', 'budget', 'content', 'performance'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impact_level VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    category VARCHAR(100),
    data_source VARCHAR(100), -- fonte dos dados
    confidence_score INTEGER DEFAULT 0,
    suggested_actions TEXT[],
    related_entity_id UUID, -- ID da campanha/conteúdo relacionado
    related_entity_type VARCHAR(50), -- tipo da entidade relacionada
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'implemented', 'dismissed'
    priority_score INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predições e Forecasting
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL, -- 'revenue', 'conversions', 'traffic', 'cost'
    target_entity_id UUID, -- ID da campanha/projeto
    target_entity_type VARCHAR(50),
    prediction_horizon INTERVAL NOT NULL, -- período da predição
    predicted_values JSONB NOT NULL, -- valores preditos com intervalos de confiança
    actual_values JSONB DEFAULT '{}', -- valores reais para comparação
    model_used VARCHAR(100), -- modelo de ML usado
    accuracy_score DECIMAL(5,2), -- precisão quando comparado com valores reais
    confidence_level DECIMAL(5,2) DEFAULT 95.0,
    factors_considered TEXT[], -- fatores considerados na predição
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automações Configuradas
CREATE TABLE IF NOT EXISTS intelligent_automations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    automation_type VARCHAR(50) NOT NULL, -- 'budget_optimization', 'content_generation', 'reporting'
    trigger_conditions JSONB NOT NULL, -- condições para disparar
    actions JSONB NOT NULL, -- ações a serem executadas
    frequency INTERVAL, -- frequência de execução
    is_active BOOLEAN DEFAULT true,
    last_executed TIMESTAMPTZ,
    next_execution TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de Execuções da IA
CREATE TABLE IF NOT EXISTS ai_execution_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- tipo da ação executada
    entity_id UUID, -- ID da entidade relacionada
    entity_type VARCHAR(50), -- tipo da entidade
    ai_model VARCHAR(100), -- modelo de IA usado
    input_data JSONB, -- dados de entrada
    output_data JSONB, -- dados de saída
    execution_time_ms INTEGER, -- tempo de execução em ms
    tokens_used INTEGER, -- tokens consumidos (para APIs que cobram por token)
    cost_usd DECIMAL(10,4), -- custo em USD
    status VARCHAR(50) DEFAULT 'success', -- 'success', 'error', 'timeout'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Métricas de Performance do Sistema IA
CREATE TABLE IF NOT EXISTS ai_system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_ai_actions INTEGER DEFAULT 0,
    content_generated INTEGER DEFAULT 0,
    campaigns_optimized INTEGER DEFAULT 0,
    insights_provided INTEGER DEFAULT 0,
    automations_executed INTEGER DEFAULT 0,
    time_saved_hours DECIMAL(8,2) DEFAULT 0,
    cost_saved_usd DECIMAL(10,2) DEFAULT 0,
    ai_costs_usd DECIMAL(10,2) DEFAULT 0,
    accuracy_scores JSONB DEFAULT '{}', -- scores de precisão por tipo
    user_satisfaction_score DECIMAL(3,2), -- 1-5 score
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agency_id, metric_date)
);

-- ==================================================
-- INDEXES para Performance
-- ==================================================

-- API Keys
CREATE INDEX IF NOT EXISTS idx_api_keys_agency_service ON api_keys(agency_id, service_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- Campanhas
CREATE INDEX IF NOT EXISTS idx_intelligent_campaigns_agency ON intelligent_campaigns(agency_id);
CREATE INDEX IF NOT EXISTS idx_intelligent_campaigns_platform ON intelligent_campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_intelligent_campaigns_status ON intelligent_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_intelligent_campaigns_updated ON intelligent_campaigns(updated_at);

-- Conteúdo IA
CREATE INDEX IF NOT EXISTS idx_ai_content_agency_user ON ai_generated_content(agency_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_type_platform ON ai_generated_content(content_type, platform);
CREATE INDEX IF NOT EXISTS idx_ai_content_status ON ai_generated_content(status);
CREATE INDEX IF NOT EXISTS idx_ai_content_created ON ai_generated_content(created_at);

-- Templates
CREATE INDEX IF NOT EXISTS idx_templates_agency ON intelligent_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON intelligent_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_public ON intelligent_templates(is_public) WHERE is_public = true;

-- Otimizações
CREATE INDEX IF NOT EXISTS idx_budget_opt_agency ON budget_optimizations(agency_id);
CREATE INDEX IF NOT EXISTS idx_budget_opt_campaign ON budget_optimizations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_budget_opt_status ON budget_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_budget_opt_expires ON budget_optimizations(expires_at);

-- Insights
CREATE INDEX IF NOT EXISTS idx_insights_agency ON ai_insights(agency_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_status ON ai_insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON ai_insights(priority_score);

-- Predições
CREATE INDEX IF NOT EXISTS idx_predictions_agency ON ai_predictions(agency_id);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_entity ON ai_predictions(target_entity_id, target_entity_type);

-- Automações
CREATE INDEX IF NOT EXISTS idx_automations_agency ON intelligent_automations(agency_id);
CREATE INDEX IF NOT EXISTS idx_automations_active ON intelligent_automations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automations_next_exec ON intelligent_automations(next_execution);

-- Logs
CREATE INDEX IF NOT EXISTS idx_ai_logs_agency_date ON ai_execution_logs(agency_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_action_type ON ai_execution_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_status ON ai_execution_logs(status);

-- Métricas
CREATE INDEX IF NOT EXISTS idx_ai_metrics_agency_date ON ai_system_metrics(agency_id, metric_date);

-- ==================================================
-- RLS (Row Level Security) Policies
-- ==================================================

-- API Keys - apenas o próprio usuário ou usuários da mesma agência
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_user_access" ON api_keys
    FOR ALL USING (
        user_id = auth.uid() OR agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Campanhas Inteligentes
ALTER TABLE intelligent_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_agency_access" ON intelligent_campaigns
    FOR ALL USING (
        agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Conteúdo IA
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_content_agency_access" ON ai_generated_content
    FOR ALL USING (
        agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Templates
ALTER TABLE intelligent_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_access" ON intelligent_templates
    FOR ALL USING (
        agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        ) OR is_public = true
    );

-- Otimizações de Orçamento
ALTER TABLE budget_optimizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_opt_agency_access" ON budget_optimizations
    FOR ALL USING (
        agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Insights IA
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insights_agency_access" ON ai_insights
    FOR ALL USING (
        agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Predições
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions_agency_access" ON ai_predictions
    FOR ALL USING (
        agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Automações
ALTER TABLE intelligent_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations_agency_access" ON intelligent_automations
    FOR ALL USING (
        agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Logs de Execução
ALTER TABLE ai_execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_logs_agency_access" ON ai_execution_logs
    FOR ALL USING (
        agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Métricas do Sistema
ALTER TABLE ai_system_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_metrics_agency_access" ON ai_system_metrics
    FOR ALL USING (
        agency_id = (
            SELECT user_profiles.agency_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- ==================================================
-- FUNCTIONS para Automação
-- ==================================================

-- Função para criptografar API keys
CREATE OR REPLACE FUNCTION encrypt_api_key(plain_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Implementar criptografia AES-256-GCM
    -- Por segurança, usar uma chave de criptografia da aplicação
    RETURN encode(digest(plain_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar métricas diárias
CREATE OR REPLACE FUNCTION update_daily_ai_metrics()
RETURNS void AS $$
BEGIN
    INSERT INTO ai_system_metrics (
        agency_id,
        metric_date,
        total_ai_actions,
        content_generated,
        campaigns_optimized,
        insights_provided
    )
    SELECT 
        agency_id,
        CURRENT_DATE,
        COUNT(*) as total_actions,
        COUNT(*) FILTER (WHERE action_type LIKE '%content%') as content_gen,
        COUNT(*) FILTER (WHERE action_type LIKE '%campaign%') as campaigns_opt,
        COUNT(*) FILTER (WHERE action_type LIKE '%insight%') as insights_prov
    FROM ai_execution_logs
    WHERE DATE(created_at) = CURRENT_DATE
    GROUP BY agency_id
    ON CONFLICT (agency_id, metric_date) 
    DO UPDATE SET
        total_ai_actions = EXCLUDED.total_ai_actions,
        content_generated = EXCLUDED.content_generated,
        campaigns_optimized = EXCLUDED.campaigns_optimized,
        insights_provided = EXCLUDED.insights_provided,
        created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- TRIGGERS
-- ==================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_intelligent_campaigns_updated_at
    BEFORE UPDATE ON intelligent_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_content_updated_at
    BEFORE UPDATE ON ai_generated_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON intelligent_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
    BEFORE UPDATE ON ai_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at
    BEFORE UPDATE ON intelligent_automations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();