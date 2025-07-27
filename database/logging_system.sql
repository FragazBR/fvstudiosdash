-- =================================================
-- FVStudios Dashboard - Advanced Logging System
-- Sistema avançado de logs e monitoramento
-- =================================================

-- Enum types para logs
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error', 'critical');
CREATE TYPE log_category AS ENUM ('system', 'user_action', 'api', 'auth', 'performance', 'security', 'integration', 'ai', 'backup');
CREATE TYPE metric_type AS ENUM ('counter', 'gauge', 'histogram', 'timing');

-- Tabela principal de logs do sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level log_level NOT NULL,
    category log_category NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    duration_ms INTEGER,
    stack_trace TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de métricas de performance
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_type metric_type NOT NULL,
    labels JSONB DEFAULT '{}'::JSONB,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de alertas do sistema
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    triggered_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de status de saúde do sistema
CREATE TABLE IF NOT EXISTS system_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'critical')),
    response_time_ms INTEGER,
    details JSONB DEFAULT '{}'::JSONB,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de audit trail para compliance
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES profiles(id),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_agency_id ON system_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_created_at ON system_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_category_created_at ON system_logs(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_session_id ON system_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_request_id ON system_logs(request_id);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_agency_id ON performance_metrics(agency_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_timestamp ON performance_metrics(metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_labels ON performance_metrics USING GIN(labels);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_system_alerts_active ON system_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_agency_id ON system_alerts(agency_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_triggered_at ON system_alerts(triggered_at DESC);

-- Índices para audit trail
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_record ON audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_agency_id ON audit_trail(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_system_logs_agency_level_created ON system_logs(agency_id, level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_agency_name_timestamp ON performance_metrics(agency_id, metric_name, timestamp DESC);

-- Particionamento por data para logs (opcional - para grandes volumes)
-- CREATE TABLE system_logs_y2024m01 PARTITION OF system_logs FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- RLS (Row Level Security)
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para system_logs
CREATE POLICY "Usuários podem ver logs da própria agência"
    ON system_logs FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        ) OR 
        user_id = auth.uid() OR
        agency_id IS NULL -- logs do sistema
    );

CREATE POLICY "Sistema pode inserir logs"
    ON system_logs FOR INSERT
    WITH CHECK (true); -- Sistema pode inserir qualquer log

CREATE POLICY "Admins podem ver todos os logs"
    ON system_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas RLS para performance_metrics
CREATE POLICY "Usuários podem ver métricas da própria agência"
    ON performance_metrics FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        ) OR 
        user_id = auth.uid() OR
        agency_id IS NULL -- métricas do sistema
    );

CREATE POLICY "Sistema pode inserir métricas"
    ON performance_metrics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins podem ver todas as métricas"
    ON performance_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Políticas RLS para system_alerts
CREATE POLICY "Usuários podem ver alertas da própria agência"
    ON system_alerts FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        ) OR
        agency_id IS NULL -- alertas do sistema
    );

CREATE POLICY "Admins e owners podem gerenciar alertas"
    ON system_alerts FOR ALL
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

-- Políticas RLS para audit_trail
CREATE POLICY "Usuários podem ver audit trail da própria agência"
    ON audit_trail FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        ) OR 
        user_id = auth.uid()
    );

CREATE POLICY "Sistema pode inserir audit trail"
    ON audit_trail FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins podem ver todo audit trail"
    ON audit_trail FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Funções para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Limpar logs mais antigos que 90 dias (exceto críticos)
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND level NOT IN ('critical', 'error');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Limpar logs críticos/erro mais antigos que 1 ano
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND level IN ('critical', 'error');
    
    -- Limpar métricas mais antigas que 30 dias
    DELETE FROM performance_metrics 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Limpar health checks mais antigos que 7 dias
    DELETE FROM system_health_checks 
    WHERE checked_at < NOW() - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Views para dashboards
CREATE OR REPLACE VIEW log_summary AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    level,
    category,
    agency_id,
    COUNT(*) as log_count,
    AVG(duration_ms) as avg_duration_ms
FROM system_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), level, category, agency_id
ORDER BY hour DESC;

CREATE OR REPLACE VIEW error_trends AS
SELECT 
    DATE_TRUNC('day', created_at) as day,
    agency_id,
    COUNT(*) FILTER (WHERE level = 'error') as error_count,
    COUNT(*) FILTER (WHERE level = 'critical') as critical_count,
    COUNT(*) as total_logs,
    ROUND(
        COUNT(*) FILTER (WHERE level IN ('error', 'critical'))::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as error_rate_percent
FROM system_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), agency_id
ORDER BY day DESC;

CREATE OR REPLACE VIEW performance_overview AS
SELECT 
    metric_name,
    metric_type,
    agency_id,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    COUNT(*) as measurement_count,
    DATE_TRUNC('hour', timestamp) as hour
FROM performance_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY metric_name, metric_type, agency_id, DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC, metric_name;

CREATE OR REPLACE VIEW active_alerts AS
SELECT 
    a.*,
    p.email as created_by_email,
    p.full_name as created_by_name
FROM system_alerts a
LEFT JOIN profiles p ON a.created_by = p.id
WHERE a.is_active = true
ORDER BY 
    CASE a.severity 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END,
    a.triggered_at DESC NULLS LAST,
    a.created_at DESC;

-- Trigger para atualizar updated_at em system_alerts
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_alerts_updated_at
    BEFORE UPDATE ON system_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_updated_at();

-- Função para detectar anomalias automáticas
CREATE OR REPLACE FUNCTION detect_performance_anomalies()
RETURNS VOID AS $$
DECLARE
    baseline_avg DECIMAL;
    current_avg DECIMAL;
    threshold_multiplier DECIMAL := 2.0;
BEGIN
    -- Detectar anomalias na resposta da API
    SELECT AVG(metric_value) INTO baseline_avg
    FROM performance_metrics 
    WHERE metric_name = 'api_response_time'
    AND timestamp > NOW() - INTERVAL '7 days'
    AND timestamp < NOW() - INTERVAL '1 hour';
    
    SELECT AVG(metric_value) INTO current_avg
    FROM performance_metrics 
    WHERE metric_name = 'api_response_time'
    AND timestamp > NOW() - INTERVAL '1 hour';
    
    IF current_avg > baseline_avg * threshold_multiplier THEN
        INSERT INTO system_alerts (
            alert_type, severity, title, description, conditions
        ) VALUES (
            'performance_anomaly',
            'high',
            'API Response Time Anomaly Detected',
            format('Current API response time (%.2fms) is %.1fx higher than baseline (%.2fms)', 
                   current_avg, current_avg/baseline_avg, baseline_avg),
            json_build_object(
                'metric', 'api_response_time',
                'current_value', current_avg,
                'baseline_value', baseline_avg,
                'threshold_multiplier', threshold_multiplier
            )::jsonb
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE system_logs IS 'Logs estruturados do sistema com diferentes níveis e categorias';
COMMENT ON TABLE performance_metrics IS 'Métricas de performance coletadas em tempo real';
COMMENT ON TABLE system_alerts IS 'Alertas e notificações automáticas do sistema';
COMMENT ON TABLE system_health_checks IS 'Verificações de saúde dos componentes do sistema';
COMMENT ON TABLE audit_trail IS 'Trilha de auditoria para compliance e segurança';

COMMENT ON VIEW log_summary IS 'Resumo de logs por hora para dashboards';
COMMENT ON VIEW error_trends IS 'Tendências de erro ao longo do tempo';
COMMENT ON VIEW performance_overview IS 'Visão geral das métricas de performance';
COMMENT ON VIEW active_alerts IS 'Alertas ativos do sistema ordenados por severidade';