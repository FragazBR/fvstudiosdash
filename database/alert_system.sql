-- =================================================
-- FVStudios Dashboard - Alert System
-- Sistema de alertas inteligente
-- =================================================

-- Enum types para alertas
CREATE TYPE alert_type AS ENUM ('performance', 'security', 'system', 'business', 'compliance', 'custom');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'whatsapp', 'slack', 'webhook', 'dashboard');
CREATE TYPE condition_operator AS ENUM ('gt', 'lt', 'eq', 'gte', 'lte', 'contains', 'not_contains');
CREATE TYPE aggregation_type AS ENUM ('avg', 'sum', 'count', 'min', 'max');

-- Tabela de regras de alerta
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type alert_type NOT NULL,
    severity alert_severity NOT NULL DEFAULT 'warning',
    conditions JSONB NOT NULL DEFAULT '[]'::JSONB,
    notification_channels notification_channel[] NOT NULL DEFAULT ARRAY['dashboard']::notification_channel[],
    cooldown_minutes INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de alertas disparados
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    status alert_status NOT NULL DEFAULT 'active',
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates de notificação
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    channel notification_channel NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('alert', 'digest', 'report')),
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    variables TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de histórico de notificações
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    recipient TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending', 'delivered')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Tabela de escalações de alerta
CREATE TABLE IF NOT EXISTS alert_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    escalation_level INTEGER NOT NULL DEFAULT 1,
    escalated_to UUID NOT NULL REFERENCES profiles(id),
    escalated_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id)
);

-- Tabela de configurações de alerta por usuário
CREATE TABLE IF NOT EXISTS user_alert_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    min_severity alert_severity NOT NULL DEFAULT 'warning',
    enabled_channels notification_channel[] NOT NULL DEFAULT ARRAY['dashboard']::notification_channel[],
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, alert_type)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_severity ON alert_rules(severity);
CREATE INDEX IF NOT EXISTS idx_alert_rules_agency_id ON alert_rules(agency_id);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_agency_id ON alerts(agency_id);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(status, severity) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON notification_templates(channel);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_agency_id ON notification_templates(agency_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_alert_id ON notification_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_channel ON notification_history(channel);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_escalations_alert_id ON alert_escalations(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_escalations_escalated_to ON alert_escalations(escalated_to);
CREATE INDEX IF NOT EXISTS idx_alert_escalations_resolved ON alert_escalations(resolved_at) WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_alert_preferences_user_id ON user_alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alert_preferences_type ON user_alert_preferences(alert_type);

-- RLS (Row Level Security)
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alert_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para alert_rules
CREATE POLICY "Usuários podem ver regras da própria agência"
    ON alert_rules FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins e owners podem gerenciar regras de alerta"
    ON alert_rules FOR ALL
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

-- Políticas RLS para alerts
CREATE POLICY "Usuários podem ver alertas da própria agência"
    ON alerts FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Sistema pode inserir alertas"
    ON alerts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar alertas da própria agência"
    ON alerts FOR UPDATE
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Políticas RLS para user_alert_preferences
CREATE POLICY "Usuários podem gerenciar próprias preferências"
    ON user_alert_preferences FOR ALL
    USING (user_id = auth.uid());

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_rules_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_updated_at();

CREATE TRIGGER notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_updated_at();

CREATE TRIGGER user_alert_preferences_updated_at
    BEFORE UPDATE ON user_alert_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_updated_at();

-- Função para calcular próxima avaliação de alerta
CREATE OR REPLACE FUNCTION calculate_next_alert_evaluation(rule_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    cooldown_minutes INTEGER;
    last_trigger TIMESTAMPTZ;
BEGIN
    -- Buscar cooldown da regra
    SELECT ar.cooldown_minutes INTO cooldown_minutes
    FROM alert_rules ar
    WHERE ar.id = rule_id;
    
    -- Buscar último trigger
    SELECT MAX(a.triggered_at) INTO last_trigger
    FROM alerts a
    WHERE a.rule_id = rule_id;
    
    -- Se nunca foi disparado, pode avaliar agora
    IF last_trigger IS NULL THEN
        RETURN NOW();
    END IF;
    
    -- Retornar próximo momento de avaliação
    RETURN last_trigger + INTERVAL '1 minute' * cooldown_minutes;
END;
$$ LANGUAGE plpgsql;

-- Função para auto-resolver alertas antigos
CREATE OR REPLACE FUNCTION auto_resolve_old_alerts()
RETURNS INTEGER AS $$
DECLARE
    resolved_count INTEGER;
BEGIN
    -- Auto-resolver alertas ativos mais antigos que 24 horas para tipos específicos
    UPDATE alerts 
    SET status = 'resolved',
        resolved_at = NOW(),
        resolved_by = NULL
    WHERE status = 'active'
    AND type IN ('performance', 'system')
    AND triggered_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS resolved_count = ROW_COUNT;
    
    RETURN resolved_count;
END;
$$ LANGUAGE plpgsql;

-- Função para limpeza de alertas antigos
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Excluir alertas resolvidos mais antigos que 90 dias
    DELETE FROM alerts 
    WHERE status IN ('resolved', 'dismissed')
    AND (resolved_at < NOW() - INTERVAL '90 days' OR created_at < NOW() - INTERVAL '90 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Limpar histórico de notificações antigo
    DELETE FROM notification_history 
    WHERE sent_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Views para dashboards
CREATE OR REPLACE VIEW alert_summary AS
SELECT 
    a.agency_id,
    a.type,
    a.severity,
    a.status,
    COUNT(*) as alert_count,
    MAX(a.triggered_at) as last_triggered,
    COUNT(*) FILTER (WHERE a.triggered_at > NOW() - INTERVAL '24 hours') as alerts_24h,
    COUNT(*) FILTER (WHERE a.triggered_at > NOW() - INTERVAL '7 days') as alerts_7d,
    AVG(EXTRACT(EPOCH FROM (COALESCE(a.resolved_at, a.acknowledged_at) - a.triggered_at))/60) as avg_resolution_minutes
FROM alerts a
GROUP BY a.agency_id, a.type, a.severity, a.status;

CREATE OR REPLACE VIEW active_critical_alerts AS
SELECT 
    a.*,
    ar.name as rule_name,
    ar.description as rule_description,
    ar.cooldown_minutes,
    p_ack.email as acknowledged_by_email,
    p_res.email as resolved_by_email
FROM alerts a
JOIN alert_rules ar ON a.rule_id = ar.id
LEFT JOIN profiles p_ack ON a.acknowledged_by = p_ack.id
LEFT JOIN profiles p_res ON a.resolved_by = p_res.id
WHERE a.status = 'active' 
AND a.severity = 'critical'
ORDER BY a.triggered_at DESC;

CREATE OR REPLACE VIEW alert_trends AS
SELECT 
    DATE_TRUNC('hour', a.triggered_at) as hour,
    a.agency_id,
    a.type,
    a.severity,
    COUNT(*) as alert_count
FROM alerts a
WHERE a.triggered_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', a.triggered_at), a.agency_id, a.type, a.severity
ORDER BY hour DESC;

CREATE OR REPLACE VIEW notification_effectiveness AS
SELECT 
    nh.channel,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE nh.status = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE nh.status = 'failed') as failed,
    ROUND(
        COUNT(*) FILTER (WHERE nh.status = 'delivered')::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as delivery_rate_percent,
    AVG(EXTRACT(EPOCH FROM (nh.delivered_at - nh.sent_at))/60) FILTER (WHERE nh.delivered_at IS NOT NULL) as avg_delivery_minutes
FROM notification_history nh
WHERE nh.sent_at > NOW() - INTERVAL '30 days'
GROUP BY nh.channel;

-- Inserir regras de alerta padrão
INSERT INTO alert_rules (name, description, type, severity, conditions, notification_channels, cooldown_minutes, is_active) VALUES
('High Error Rate', 'Taxa de erro acima de 5% em 15 minutos', 'performance', 'error', 
 '[{"metric": "error_rate", "operator": "gt", "value": 5, "timeframe_minutes": 15}]', 
 ARRAY['dashboard', 'email']::notification_channel[], 30, true),

('Critical Error Rate', 'Taxa de erro acima de 10% em 10 minutos', 'performance', 'critical', 
 '[{"metric": "error_rate", "operator": "gt", "value": 10, "timeframe_minutes": 10}]', 
 ARRAY['dashboard', 'email', 'slack']::notification_channel[], 15, true),

('High Response Time', 'Tempo de resposta acima de 2 segundos', 'performance', 'warning', 
 '[{"metric": "response_time", "operator": "gt", "value": 2000, "timeframe_minutes": 10}]', 
 ARRAY['dashboard']::notification_channel[], 60, true),

('Critical Response Time', 'Tempo de resposta acima de 5 segundos', 'performance', 'critical', 
 '[{"metric": "response_time", "operator": "gt", "value": 5000, "timeframe_minutes": 5}]', 
 ARRAY['dashboard', 'email', 'slack']::notification_channel[], 15, true),

('High Memory Usage', 'Uso de memória acima de 85%', 'system', 'warning', 
 '[{"metric": "memory_usage", "operator": "gt", "value": 85, "timeframe_minutes": 5}]', 
 ARRAY['dashboard']::notification_channel[], 60, true),

('Critical Memory Usage', 'Uso de memória acima de 95%', 'system', 'critical', 
 '[{"metric": "memory_usage", "operator": "gt", "value": 95, "timeframe_minutes": 5}]', 
 ARRAY['dashboard', 'email']::notification_channel[], 15, true),

('High CPU Usage', 'Uso de CPU acima de 80%', 'system', 'warning', 
 '[{"metric": "cpu_usage", "operator": "gt", "value": 80, "timeframe_minutes": 10}]', 
 ARRAY['dashboard']::notification_channel[], 60, true),

('Low Cache Hit Rate', 'Taxa de cache abaixo de 70%', 'performance', 'warning', 
 '[{"metric": "cache_hit_rate", "operator": "lt", "value": 70, "timeframe_minutes": 30}]', 
 ARRAY['dashboard']::notification_channel[], 120, true),

('Failed Login Attempts', 'Mais de 10 tentativas de login falhadas em 10 minutos', 'security', 'warning', 
 '[{"metric": "failed_logins", "operator": "gt", "value": 10, "timeframe_minutes": 10}]', 
 ARRAY['dashboard', 'email']::notification_channel[], 30, true),

('Old Backup', 'Backup mais antigo que 48 horas', 'system', 'error', 
 '[{"metric": "backup_age", "operator": "gt", "value": 48}]', 
 ARRAY['dashboard', 'email']::notification_channel[], 360, true)
ON CONFLICT DO NOTHING;

-- Inserir templates de notificação padrão
INSERT INTO notification_templates (name, channel, template_type, subject_template, body_template, variables, is_active) VALUES
('Alert Email Template', 'email', 'alert', 
 '[ALERT] {{severity|upper}} - {{title}}',
 'Um alerta {{severity}} foi disparado:\n\n**{{title}}**\n\n{{message}}\n\nDisparado em: {{triggered_at}}\nRegra: {{rule_name}}\n\nDetalhes: {{details}}',
 ARRAY['severity', 'title', 'message', 'triggered_at', 'rule_name', 'details'], true),

('Alert Slack Template', 'slack', 'alert',
 'Alert: {{title}}',
 ':warning: **{{severity|upper}} ALERT**\n*{{title}}*\n\n{{message}}\n\n:clock1: {{triggered_at}}\n:gear: {{rule_name}}',
 ARRAY['severity', 'title', 'message', 'triggered_at', 'rule_name'], true),

('Alert Dashboard Template', 'dashboard', 'alert',
 '{{title}}',
 '{{message}}',
 ARRAY['title', 'message'], true)
ON CONFLICT DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE alert_rules IS 'Regras configuráveis para disparar alertas automaticamente';
COMMENT ON TABLE alerts IS 'Alertas disparados pelo sistema baseado nas regras';
COMMENT ON TABLE notification_templates IS 'Templates para formatação de notificações';
COMMENT ON TABLE notification_history IS 'Histórico de notificações enviadas';
COMMENT ON TABLE alert_escalations IS 'Escalações de alertas não resolvidos';
COMMENT ON TABLE user_alert_preferences IS 'Preferências de alerta por usuário';

COMMENT ON VIEW alert_summary IS 'Resumo de alertas por agência, tipo e severidade';
COMMENT ON VIEW active_critical_alerts IS 'Alertas críticos ativos que requerem atenção imediata';
COMMENT ON VIEW alert_trends IS 'Tendências de alertas ao longo do tempo';
COMMENT ON VIEW notification_effectiveness IS 'Efetividade dos canais de notificação';