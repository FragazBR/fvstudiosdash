-- ==================================================
-- FVStudios Dashboard - Social Media API Integration Schema
-- Schema completo para integrações com APIs de redes sociais
-- ==================================================

-- Tabela para armazenar chaves de API das redes sociais
CREATE TABLE IF NOT EXISTS social_media_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'instagram', 'facebook', 'linkedin', 'tiktok', 'google_ads', 'meta_ads', etc.
    api_key TEXT, -- Chave da API (criptografada)
    access_token TEXT, -- Token de acesso (criptografado)
    refresh_token TEXT, -- Token de refresh (criptografado)
    app_id VARCHAR(255), -- ID da aplicação
    app_secret TEXT, -- Secret da aplicação (criptografada)
    additional_config JSONB DEFAULT '{}', -- Configurações extras específicas da plataforma
    expires_at TIMESTAMPTZ, -- Quando o token expira
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMPTZ,
    sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'error', 'expired'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform)
);

-- Tabela para armazenar dados sincronizados das campanhas
CREATE TABLE IF NOT EXISTS synced_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    social_key_id UUID REFERENCES social_media_keys(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL, -- ID da campanha na plataforma externa
    platform VARCHAR(50) NOT NULL,
    name VARCHAR(500),
    status VARCHAR(100),
    objective VARCHAR(200),
    budget DECIMAL(12,2),
    daily_budget DECIMAL(12,2),
    total_spend DECIMAL(12,2),
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0, -- Click-through rate
    cpm DECIMAL(8,2) DEFAULT 0, -- Cost per mille
    cpc DECIMAL(8,2) DEFAULT 0, -- Cost per click
    roas DECIMAL(8,2) DEFAULT 0, -- Return on ad spend
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB DEFAULT '{}', -- Dados brutos da API
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform, external_id)
);

-- Tabela para armazenar conjuntos de anúncios
CREATE TABLE IF NOT EXISTS synced_adsets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES synced_campaigns(id) ON DELETE CASCADE,
    social_key_id UUID REFERENCES social_media_keys(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    name VARCHAR(500),
    status VARCHAR(100),
    budget DECIMAL(12,2),
    daily_budget DECIMAL(12,2),
    total_spend DECIMAL(12,2),
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    cpm DECIMAL(8,2) DEFAULT 0,
    cpc DECIMAL(8,2) DEFAULT 0,
    targeting JSONB DEFAULT '{}', -- Dados de segmentação
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform, external_id)
);

-- Tabela para armazenar anúncios individuais
CREATE TABLE IF NOT EXISTS synced_ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    adset_id UUID REFERENCES synced_adsets(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES synced_campaigns(id) ON DELETE CASCADE,
    social_key_id UUID REFERENCES social_media_keys(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    name VARCHAR(500),
    status VARCHAR(100),
    creative_data JSONB DEFAULT '{}', -- Dados do criativo (imagem, vídeo, texto)
    total_spend DECIMAL(12,2),
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    cpm DECIMAL(8,2) DEFAULT 0,
    cpc DECIMAL(8,2) DEFAULT 0,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform, external_id)
);

-- Tabela para armazenar métricas históricas (dados de performance por dia)
CREATE TABLE IF NOT EXISTS campaign_daily_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES synced_campaigns(id) ON DELETE CASCADE,
    adset_id UUID REFERENCES synced_adsets(id) ON DELETE SET NULL,
    ad_id UUID REFERENCES synced_ads(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL,
    metric_date DATE NOT NULL,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_value DECIMAL(12,2) DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,
    cpm DECIMAL(8,2) DEFAULT 0,
    cpc DECIMAL(8,2) DEFAULT 0,
    roas DECIMAL(8,2) DEFAULT 0,
    frequency DECIMAL(5,2) DEFAULT 0, -- Frequência média
    reach BIGINT DEFAULT 0, -- Alcance
    video_views BIGINT DEFAULT 0, -- Views de vídeo (quando aplicável)
    engagement_rate DECIMAL(5,4) DEFAULT 0, -- Taxa de engajamento
    raw_metrics JSONB DEFAULT '{}', -- Métricas específicas da plataforma
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform, campaign_id, adset_id, ad_id, metric_date)
);

-- Tabela para logs de sincronização
CREATE TABLE IF NOT EXISTS api_sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    social_key_id UUID REFERENCES social_media_keys(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    sync_type VARCHAR(100) NOT NULL, -- 'campaigns', 'adsets', 'ads', 'metrics'
    status VARCHAR(50) NOT NULL, -- 'started', 'success', 'error', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    sync_duration_ms INTEGER,
    api_calls_made INTEGER DEFAULT 0,
    rate_limit_hit BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para monitoramento de APIs (rate limits, quotas, etc.)
CREATE TABLE IF NOT EXISTS api_integration_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    api_calls_made INTEGER DEFAULT 0,
    api_calls_limit INTEGER DEFAULT 0,
    rate_limit_hits INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    data_points_synced INTEGER DEFAULT 0,
    last_successful_sync TIMESTAMPTZ,
    quota_usage_percent DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'rate_limited', 'quota_exceeded', 'error'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform, metric_date)
);

-- Tabela para configurações de sincronização
CREATE TABLE IF NOT EXISTS sync_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    sync_frequency INTERVAL DEFAULT '1 hour', -- Frequência de sincronização
    sync_campaigns BOOLEAN DEFAULT true,
    sync_adsets BOOLEAN DEFAULT true,
    sync_ads BOOLEAN DEFAULT true,
    sync_metrics BOOLEAN DEFAULT true,
    historical_days INTEGER DEFAULT 30, -- Quantos dias de histórico buscar
    auto_sync BOOLEAN DEFAULT true,
    webhook_enabled BOOLEAN DEFAULT false,
    webhook_url TEXT,
    notification_preferences JSONB DEFAULT '{}',
    last_modified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, platform)
);

-- ==================================================
-- ÍNDICES para Performance
-- ==================================================

-- Social Media Keys
CREATE INDEX IF NOT EXISTS idx_social_keys_user_platform ON social_media_keys(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_keys_active ON social_media_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_social_keys_expires ON social_media_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Campanhas Sincronizadas
CREATE INDEX IF NOT EXISTS idx_synced_campaigns_user ON synced_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_campaigns_platform ON synced_campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_synced_campaigns_external ON synced_campaigns(platform, external_id);
CREATE INDEX IF NOT EXISTS idx_synced_campaigns_sync ON synced_campaigns(last_sync);

-- AdSets
CREATE INDEX IF NOT EXISTS idx_synced_adsets_user ON synced_adsets(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_adsets_campaign ON synced_adsets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_synced_adsets_external ON synced_adsets(platform, external_id);

-- Anúncios
CREATE INDEX IF NOT EXISTS idx_synced_ads_user ON synced_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_ads_campaign ON synced_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_synced_ads_adset ON synced_ads(adset_id);
CREATE INDEX IF NOT EXISTS idx_synced_ads_external ON synced_ads(platform, external_id);

-- Métricas Diárias
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON campaign_daily_metrics(user_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_campaign_date ON campaign_daily_metrics(campaign_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_platform_date ON campaign_daily_metrics(platform, metric_date);

-- Logs de Sincronização
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_platform ON api_sync_logs(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON api_sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON api_sync_logs(status);

-- Métricas de Integração
CREATE INDEX IF NOT EXISTS idx_integration_metrics_user_date ON api_integration_metrics(user_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_integration_metrics_platform ON api_integration_metrics(platform);

-- Configurações
CREATE INDEX IF NOT EXISTS idx_sync_configs_user ON sync_configurations(user_id);

-- ==================================================
-- RLS (Row Level Security) Policies
-- ==================================================

-- Social Media Keys - apenas o próprio usuário
ALTER TABLE social_media_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_keys_own_access" ON social_media_keys
    FOR ALL USING (user_id = auth.uid());

-- Campanhas Sincronizadas
ALTER TABLE synced_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "synced_campaigns_own_access" ON synced_campaigns
    FOR ALL USING (user_id = auth.uid());

-- AdSets
ALTER TABLE synced_adsets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "synced_adsets_own_access" ON synced_adsets
    FOR ALL USING (user_id = auth.uid());

-- Anúncios
ALTER TABLE synced_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "synced_ads_own_access" ON synced_ads
    FOR ALL USING (user_id = auth.uid());

-- Métricas Diárias
ALTER TABLE campaign_daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_metrics_own_access" ON campaign_daily_metrics
    FOR ALL USING (user_id = auth.uid());

-- Logs de Sincronização
ALTER TABLE api_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_logs_own_access" ON api_sync_logs
    FOR ALL USING (user_id = auth.uid());

-- Métricas de Integração
ALTER TABLE api_integration_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_metrics_own_access" ON api_integration_metrics
    FOR ALL USING (user_id = auth.uid());

-- Configurações de Sincronização
ALTER TABLE sync_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_configs_own_access" ON sync_configurations
    FOR ALL USING (user_id = auth.uid());

-- ==================================================
-- FUNÇÕES Utilitárias
-- ==================================================

-- Função para criptografar tokens sensíveis
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(plain_data TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Em produção, usar criptografia AES-256-GCM adequada
    RETURN encode(digest(plain_data, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular métricas agregadas de campanha
CREATE OR REPLACE FUNCTION calculate_campaign_totals(campaign_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_impressions', COALESCE(SUM(impressions), 0),
        'total_clicks', COALESCE(SUM(clicks), 0),
        'total_spend', COALESCE(SUM(spend), 0),
        'total_conversions', COALESCE(SUM(conversions), 0),
        'avg_ctr', CASE WHEN SUM(impressions) > 0 THEN (SUM(clicks)::DECIMAL / SUM(impressions) * 100) ELSE 0 END,
        'avg_cpm', CASE WHEN SUM(impressions) > 0 THEN (SUM(spend) / SUM(impressions) * 1000) ELSE 0 END,
        'avg_cpc', CASE WHEN SUM(clicks) > 0 THEN (SUM(spend) / SUM(clicks)) ELSE 0 END,
        'total_roas', CASE WHEN SUM(spend) > 0 THEN (SUM(conversion_value) / SUM(spend)) ELSE 0 END
    ) INTO result
    FROM campaign_daily_metrics
    WHERE campaign_id = campaign_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar status de sincronização
CREATE OR REPLACE FUNCTION get_sync_status(user_uuid UUID, platform_name VARCHAR)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'last_sync', COALESCE(MAX(completed_at), '1970-01-01'::timestamptz),
        'sync_frequency', (SELECT sync_frequency FROM sync_configurations 
                          WHERE user_id = user_uuid AND platform = platform_name),
        'next_sync_due', COALESCE(MAX(next_sync_at), NOW()),
        'recent_errors', COUNT(*) FILTER (WHERE status = 'error' AND started_at > NOW() - INTERVAL '24 hours'),
        'success_rate_24h', CASE 
            WHEN COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '24 hours') > 0 
            THEN COUNT(*) FILTER (WHERE status = 'success' AND started_at > NOW() - INTERVAL '24 hours')::DECIMAL / 
                 COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '24 hours') * 100 
            ELSE 0 
        END
    ) INTO result
    FROM api_sync_logs
    WHERE user_id = user_uuid AND platform = platform_name;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- TRIGGERS
-- ==================================================

-- Trigger para atualizar updated_at nas tabelas relevantes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas
CREATE TRIGGER update_social_keys_updated_at
    BEFORE UPDATE ON social_media_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON synced_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adsets_updated_at
    BEFORE UPDATE ON synced_adsets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
    BEFORE UPDATE ON synced_ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_metrics_updated_at
    BEFORE UPDATE ON api_integration_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_configs_updated_at
    BEFORE UPDATE ON sync_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar automaticamente totais de campanha quando métricas diárias mudam
CREATE OR REPLACE FUNCTION update_campaign_totals_on_metrics_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar totais na tabela de campanhas quando métricas diárias mudam
    UPDATE synced_campaigns 
    SET 
        impressions = (
            SELECT COALESCE(SUM(impressions), 0) 
            FROM campaign_daily_metrics 
            WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
        ),
        clicks = (
            SELECT COALESCE(SUM(clicks), 0) 
            FROM campaign_daily_metrics 
            WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
        ),
        total_spend = (
            SELECT COALESCE(SUM(spend), 0) 
            FROM campaign_daily_metrics 
            WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
        ),
        conversions = (
            SELECT COALESCE(SUM(conversions), 0) 
            FROM campaign_daily_metrics 
            WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campaign_daily_metrics
    FOR EACH ROW EXECUTE FUNCTION update_campaign_totals_on_metrics_change();

-- ==================================================
-- Comentários Finais
-- ==================================================

-- Este schema suporta:
-- ✅ Integração com múltiplas plataformas de social media
-- ✅ Armazenamento seguro de chaves de API com criptografia
-- ✅ Sincronização automática de campanhas, adsets e anúncios
-- ✅ Métricas históricas detalhadas por dia
-- ✅ Monitoramento de rate limits e quotas de API
-- ✅ Logs detalhados de sincronização
-- ✅ Configurações personalizáveis de sincronização
-- ✅ Cálculos automáticos de métricas agregadas
-- ✅ Row Level Security para isolamento de dados
-- ✅ Índices otimizados para performance
-- ✅ Triggers para manutenção automática de dados