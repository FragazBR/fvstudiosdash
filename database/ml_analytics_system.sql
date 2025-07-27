-- ===================================================
-- FVStudios Dashboard - Sistema de Analytics Preditivo com ML
-- Machine Learning para insights inteligentes e predições
-- ===================================================

BEGIN;

-- Enum para tipos de modelo ML
CREATE TYPE ml_model_type AS ENUM (
  'regression',
  'classification',
  'clustering',
  'time_series',
  'anomaly_detection',
  'recommendation',
  'forecasting',
  'sentiment_analysis',
  'churn_prediction',
  'conversion_prediction'
);

-- Enum para status do modelo
CREATE TYPE ml_model_status AS ENUM (
  'training',
  'active',
  'inactive',
  'failed',
  'deprecated',
  'testing'
);

-- Enum para tipos de dados de entrada
CREATE TYPE ml_data_type AS ENUM (
  'numerical',
  'categorical',
  'text',
  'date',
  'boolean',
  'json',
  'image',
  'time_series'
);

-- Enum para tipos de predição
CREATE TYPE prediction_type AS ENUM (
  'project_completion',
  'client_churn',
  'revenue_forecast',
  'resource_demand',
  'campaign_performance',
  'user_behavior',
  'market_trends',
  'risk_assessment',
  'quality_score',
  'engagement_prediction'
);

-- Tabela principal de modelos ML
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do modelo
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type ml_model_type NOT NULL,
    prediction_type prediction_type NOT NULL,
    version VARCHAR(50) DEFAULT '1.0.0',
    
    -- Status e configurações
    status ml_model_status DEFAULT 'training',
    is_auto_retrain BOOLEAN DEFAULT true,
    retrain_frequency INTEGER DEFAULT 7, -- dias
    
    -- Configurações do modelo
    algorithm VARCHAR(100), -- 'linear_regression', 'random_forest', 'neural_network', etc
    hyperparameters JSONB DEFAULT '{}',
    feature_columns TEXT[], -- Colunas usadas como features
    target_column VARCHAR(255), -- Coluna alvo para predição
    
    -- Configurações de dados
    data_source_query TEXT, -- Query SQL para buscar dados de treino
    data_preprocessing JSONB DEFAULT '{}', -- Configurações de pré-processamento
    feature_engineering JSONB DEFAULT '{}', -- Transformações de features
    
    -- Métricas de performance
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    mse DECIMAL(10,4), -- Mean Squared Error
    mae DECIMAL(10,4), -- Mean Absolute Error
    r2_score DECIMAL(5,4), -- R-squared
    
    -- Configurações de validação
    validation_method VARCHAR(50) DEFAULT 'train_test_split', -- cross_validation, time_series_split
    test_size DECIMAL(3,2) DEFAULT 0.2,
    cross_validation_folds INTEGER DEFAULT 5,
    
    -- Metadados do modelo
    model_artifact_path TEXT, -- Caminho para o modelo serializado
    model_size_mb DECIMAL(10,2),
    training_duration_seconds INTEGER,
    training_samples_count INTEGER,
    
    -- Configurações de drift detection
    drift_detection_enabled BOOLEAN DEFAULT true,
    drift_threshold DECIMAL(5,4) DEFAULT 0.1,
    last_drift_check TIMESTAMPTZ,
    
    -- Configurações de explicabilidade
    explainability_enabled BOOLEAN DEFAULT true,
    feature_importance JSONB, -- Importância das features
    
    -- Controle de acesso
    is_public BOOLEAN DEFAULT false,
    allowed_agencies UUID[], -- IDs das agências que podem usar
    allowed_roles TEXT[],
    
    -- Metadados
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_trained_at TIMESTAMPTZ,
    last_prediction_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_accuracy CHECK (accuracy >= 0 AND accuracy <= 1),
    CONSTRAINT valid_test_size CHECK (test_size > 0 AND test_size < 1)
);

-- Tabela de features/variáveis dos modelos
CREATE TABLE IF NOT EXISTS ml_model_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    
    -- Definição da feature
    feature_name VARCHAR(255) NOT NULL,
    feature_type ml_data_type NOT NULL,
    description TEXT,
    
    -- Configurações da feature
    is_required BOOLEAN DEFAULT true,
    is_categorical BOOLEAN DEFAULT false,
    category_mapping JSONB, -- Para features categóricas
    
    -- Transformações
    transformation_type VARCHAR(100), -- 'normalize', 'standardize', 'log', 'polynomial'
    transformation_params JSONB DEFAULT '{}',
    
    -- Estatísticas da feature
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    mean_value DECIMAL(15,4),
    std_deviation DECIMAL(15,4),
    null_percentage DECIMAL(5,2),
    unique_values_count INTEGER,
    
    -- Importância no modelo
    feature_importance DECIMAL(8,6),
    correlation_with_target DECIMAL(8,6),
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_model_feature UNIQUE (model_id, feature_name)
);

-- Tabela de predições geradas
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    
    -- Contexto da predição
    prediction_key VARCHAR(255), -- Chave única para a predição (ex: project_id, client_id)
    prediction_type prediction_type NOT NULL,
    
    -- Dados de entrada
    input_features JSONB NOT NULL,
    
    -- Resultado da predição
    predicted_value JSONB NOT NULL, -- Valor predito (pode ser numérico, categoria, etc)
    prediction_probability DECIMAL(5,4), -- Probabilidade/confiança da predição
    prediction_confidence VARCHAR(20), -- 'high', 'medium', 'low'
    
    -- Classificação de risco/oportunidade
    risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    opportunity_score DECIMAL(5,2), -- Score de oportunidade (0-100)
    
    -- Explicabilidade
    feature_contributions JSONB, -- Contribuição de cada feature para a predição
    explanation_text TEXT, -- Explicação em linguagem natural
    
    -- Validação e feedback
    actual_value JSONB, -- Valor real (quando disponível)
    prediction_accuracy DECIMAL(5,4), -- Acurácia da predição individual
    feedback_score INTEGER, -- Feedback do usuário (1-5)
    feedback_comments TEXT,
    
    -- Contexto temporal
    prediction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    prediction_horizon_days INTEGER, -- Para quantos dias à frente é a predição
    expiry_date TIMESTAMPTZ, -- Quando a predição expira
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_validated BOOLEAN DEFAULT false,
    validation_date TIMESTAMPTZ,
    
    -- Metadados
    requested_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de training jobs para modelos ML
CREATE TABLE IF NOT EXISTS ml_training_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    
    -- Configurações do job
    job_type VARCHAR(100) NOT NULL, -- 'initial_training', 'retraining', 'hyperparameter_tuning'
    trigger_type VARCHAR(100), -- 'manual', 'scheduled', 'drift_detected', 'performance_degradation'
    
    -- Configurações de treino
    training_config JSONB NOT NULL DEFAULT '{}',
    dataset_size INTEGER,
    training_start_date TIMESTAMPTZ,
    training_end_date TIMESTAMPTZ,
    
    -- Status do job
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    progress_percentage INTEGER DEFAULT 0,
    current_step VARCHAR(255),
    
    -- Resultados
    training_metrics JSONB, -- Métricas de treino
    validation_metrics JSONB, -- Métricas de validação
    model_comparison JSONB, -- Comparação com modelo anterior
    
    -- Logs e erros
    training_logs TEXT,
    error_message TEXT,
    error_details JSONB,
    
    -- Recursos utilizados
    cpu_usage_avg DECIMAL(5,2),
    memory_usage_avg_mb INTEGER,
    gpu_usage_avg DECIMAL(5,2),
    training_cost_usd DECIMAL(10,4),
    
    -- Metadados
    started_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de insights gerados pelos modelos
CREATE TABLE IF NOT EXISTS ml_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tipo e categoria do insight
    insight_type VARCHAR(100) NOT NULL, -- 'trend', 'anomaly', 'opportunity', 'risk', 'pattern'
    category VARCHAR(100), -- 'revenue', 'clients', 'projects', 'performance', 'market'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Conteúdo do insight
    insight_data JSONB NOT NULL, -- Dados estruturados do insight
    visualization_config JSONB, -- Configuração para gráficos
    
    -- Importância e prioridade
    importance_score DECIMAL(5,2) NOT NULL, -- Score de importância (0-100)
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    confidence_level DECIMAL(5,4), -- Nível de confiança no insight
    
    -- Ações recomendadas
    recommended_actions JSONB, -- Lista de ações sugeridas
    potential_impact JSONB, -- Impacto potencial (financeiro, operacional)
    
    -- Contexto temporal
    insight_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ, -- Até quando o insight é válido
    
    -- Relacionamentos
    related_model_id UUID REFERENCES ml_models(id) ON DELETE SET NULL,
    related_prediction_ids UUID[], -- IDs de predições relacionadas
    related_entity_type VARCHAR(100), -- 'project', 'client', 'campaign', 'user'
    related_entity_id UUID,
    
    -- Interação do usuário
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    dismissed_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false, -- Para destacar insights importantes
    
    -- Metadados
    generated_by_model UUID REFERENCES ml_models(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de configurações de dashboards de ML
CREATE TABLE IF NOT EXISTS ml_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dashboard_type VARCHAR(100), -- 'predictive', 'performance', 'insights', 'monitoring'
    
    -- Configuração visual
    layout_config JSONB NOT NULL DEFAULT '{}', -- Configuração do layout
    widget_configs JSONB DEFAULT '[]', -- Configurações dos widgets
    theme_config JSONB DEFAULT '{}',
    
    -- Filtros e configurações
    default_filters JSONB DEFAULT '{}',
    refresh_interval_minutes INTEGER DEFAULT 30,
    
    -- Dados e métricas
    connected_models UUID[], -- Modelos conectados ao dashboard
    metrics_config JSONB DEFAULT '{}',
    
    -- Controle de acesso
    is_public BOOLEAN DEFAULT false,
    allowed_roles TEXT[],
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Sharing
    shared_with_users UUID[],
    shared_with_agencies UUID[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    
    -- Metadados
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de alertas baseados em ML
CREATE TABLE IF NOT EXISTS ml_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuração do alerta
    alert_name VARCHAR(255) NOT NULL,
    description TEXT,
    alert_type VARCHAR(100), -- 'prediction_threshold', 'anomaly_detected', 'model_drift', 'performance_degradation'
    
    -- Condições do alerta
    model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
    trigger_conditions JSONB NOT NULL, -- Condições que disparam o alerta
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    
    -- Configurações de envio
    notification_channels TEXT[], -- email, slack, whatsapp, webhook
    recipient_users UUID[],
    recipient_roles TEXT[],
    
    -- Throttling
    cooldown_minutes INTEGER DEFAULT 60, -- Tempo mínimo entre alertas similares
    max_alerts_per_day INTEGER DEFAULT 10,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    
    -- Metadados
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de alertas disparados
CREATE TABLE IF NOT EXISTS ml_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES ml_alerts(id) ON DELETE CASCADE,
    
    -- Detalhes do disparo
    trigger_data JSONB NOT NULL, -- Dados que causaram o disparo
    alert_message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    
    -- Notificações enviadas
    notifications_sent JSONB, -- Detalhes das notificações enviadas
    
    -- Resolução
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Metadados
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ml_models_type_status ON ml_models(model_type, status);
CREATE INDEX IF NOT EXISTS idx_ml_models_agency_active ON ml_models(agency_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ml_models_prediction_type ON ml_models(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ml_models_last_trained ON ml_models(last_trained_at DESC);

CREATE INDEX IF NOT EXISTS idx_ml_model_features_model_type ON ml_model_features(model_id, feature_type);
CREATE INDEX IF NOT EXISTS idx_ml_model_features_importance ON ml_model_features(feature_importance DESC);

CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_date ON ml_predictions(model_id, prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_key_type ON ml_predictions(prediction_key, prediction_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_agency_active ON ml_predictions(agency_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_risk_level ON ml_predictions(risk_level);

CREATE INDEX IF NOT EXISTS idx_ml_training_jobs_model_status ON ml_training_jobs(model_id, status);
CREATE INDEX IF NOT EXISTS idx_ml_training_jobs_created_at ON ml_training_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ml_insights_category_importance ON ml_insights(category, importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_ml_insights_agency_active ON ml_insights(agency_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ml_insights_date_priority ON ml_insights(insight_date DESC, priority);

CREATE INDEX IF NOT EXISTS idx_ml_dashboards_owner_active ON ml_dashboards(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ml_dashboards_agency ON ml_dashboards(agency_id);

CREATE INDEX IF NOT EXISTS idx_ml_alerts_model_active ON ml_alerts(model_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ml_alert_history_alert_triggered ON ml_alert_history(alert_id, triggered_at DESC);

-- RLS Policies
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_alert_history ENABLE ROW LEVEL SECURITY;

-- Policy para ml_models
DROP POLICY IF EXISTS "Users can manage ML models of their agency" ON ml_models;
CREATE POLICY "Users can manage ML models of their agency" ON ml_models
    FOR ALL USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Modelos públicos
        (is_public = true)
        OR
        -- Usuários podem ver modelos da sua agência
        (
            agency_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE id = auth.uid() 
                AND agency_id = ml_models.agency_id
                AND role IN ('agency_owner', 'agency_manager', 'agency_staff')
            )
        )
        OR
        -- Usuários podem ver modelos que criaram
        (created_by = auth.uid())
        OR
        -- Modelos compartilhados com a agência do usuário
        (
            allowed_agencies IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE id = auth.uid() 
                AND agency_id = ANY(ml_models.allowed_agencies)
            )
        )
    );

-- Policies similares para outras tabelas (herdam permissões do modelo/agência)
DROP POLICY IF EXISTS "ML features inherit model permissions" ON ml_model_features;
CREATE POLICY "ML features inherit model permissions" ON ml_model_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ml_models m
            WHERE m.id = ml_model_features.model_id
            AND (
                EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
                OR m.agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
                OR m.created_by = auth.uid()
                OR m.is_public = true
            )
        )
    );

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ml_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ml_models_updated_at ON ml_models;
CREATE TRIGGER update_ml_models_updated_at
    BEFORE UPDATE ON ml_models
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_updated_at();

-- Função para calcular métricas de modelo
CREATE OR REPLACE FUNCTION calculate_model_metrics(
    p_model_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS JSONB AS $$
DECLARE
    total_predictions INTEGER;
    avg_accuracy DECIMAL(5,4);
    predictions_today INTEGER;
    accuracy_trend DECIMAL(5,4);
    result JSONB;
BEGIN
    -- Contar predições totais
    SELECT COUNT(*) INTO total_predictions
    FROM ml_predictions
    WHERE model_id = p_model_id
    AND prediction_date >= p_start_date;
    
    -- Calcular acurácia média
    SELECT AVG(prediction_accuracy) INTO avg_accuracy
    FROM ml_predictions
    WHERE model_id = p_model_id
    AND prediction_accuracy IS NOT NULL
    AND prediction_date >= p_start_date;
    
    -- Contar predições hoje
    SELECT COUNT(*) INTO predictions_today
    FROM ml_predictions
    WHERE model_id = p_model_id
    AND prediction_date >= CURRENT_DATE;
    
    -- Calcular tendência de acurácia (últimos 7 dias vs anteriores)
    WITH recent_accuracy AS (
        SELECT AVG(prediction_accuracy) as recent_avg
        FROM ml_predictions
        WHERE model_id = p_model_id
        AND prediction_accuracy IS NOT NULL
        AND prediction_date >= NOW() - INTERVAL '7 days'
    ),
    previous_accuracy AS (
        SELECT AVG(prediction_accuracy) as previous_avg
        FROM ml_predictions
        WHERE model_id = p_model_id
        AND prediction_accuracy IS NOT NULL
        AND prediction_date >= NOW() - INTERVAL '14 days'
        AND prediction_date < NOW() - INTERVAL '7 days'
    )
    SELECT COALESCE(r.recent_avg - p.previous_avg, 0) INTO accuracy_trend
    FROM recent_accuracy r, previous_accuracy p;
    
    -- Construir resultado
    result := jsonb_build_object(
        'total_predictions', COALESCE(total_predictions, 0),
        'avg_accuracy', COALESCE(avg_accuracy, 0),
        'predictions_today', COALESCE(predictions_today, 0),
        'accuracy_trend', COALESCE(accuracy_trend, 0),
        'calculated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar insights automáticos
CREATE OR REPLACE FUNCTION generate_automated_insights()
RETURNS INTEGER AS $$
DECLARE
    insight_count INTEGER := 0;
    model_record RECORD;
    agency_record RECORD;
BEGIN
    -- Insights de performance de modelos
    FOR model_record IN 
        SELECT id, name, agency_id, accuracy, last_prediction_at
        FROM ml_models 
        WHERE status = 'active'
        AND last_prediction_at >= NOW() - INTERVAL '24 hours'
    LOOP
        -- Insight de modelo com baixa acurácia
        IF model_record.accuracy < 0.7 THEN
            INSERT INTO ml_insights (
                insight_type,
                category,
                title,
                description,
                insight_data,
                importance_score,
                priority,
                confidence_level,
                related_model_id,
                agency_id
            ) VALUES (
                'risk',
                'performance',
                'Modelo com Baixa Performance Detectado',
                'O modelo ' || model_record.name || ' está apresentando acurácia abaixo do esperado (' || (model_record.accuracy * 100)::TEXT || '%). Considere retreinar o modelo.',
                jsonb_build_object(
                    'model_id', model_record.id,
                    'current_accuracy', model_record.accuracy,
                    'threshold', 0.7,
                    'recommendation', 'retrain_model'
                ),
                85.0,
                'high',
                0.9,
                model_record.id,
                model_record.agency_id
            );
            insight_count := insight_count + 1;
        END IF;
    END LOOP;
    
    RETURN insight_count;
END;
$$ LANGUAGE plpgsql;

-- Inserir modelos de exemplo
INSERT INTO ml_models (
    name, description, model_type, prediction_type, algorithm, status,
    feature_columns, target_column, accuracy, created_by, agency_id
) VALUES
(
    'Predição de Churn de Clientes',
    'Modelo para prever quais clientes têm maior probabilidade de cancelar os serviços',
    'classification',
    'client_churn',
    'random_forest',
    'active',
    ARRAY['days_since_last_contact', 'project_count', 'total_revenue', 'satisfaction_score', 'support_tickets'],
    'churned',
    0.85,
    NULL,
    NULL
),
(
    'Previsão de Receita Mensal',
    'Modelo de previsão de receita baseado em dados históricos e tendências de mercado',
    'time_series',
    'revenue_forecast',
    'lstm_neural_network',
    'active',
    ARRAY['month', 'active_projects', 'new_clients', 'market_indicators', 'seasonal_factors'],
    'monthly_revenue',
    0.78,
    NULL,
    NULL
),
(
    'Análise de Sentimento de Feedback',
    'Classificação automática do sentimento em feedbacks de clientes',
    'classification',
    'sentiment_analysis',
    'transformer_bert',
    'active',
    ARRAY['feedback_text', 'client_segment', 'project_phase'],
    'sentiment_score',
    0.92,
    NULL,
    NULL
);

COMMIT;