-- =================================================
-- FVStudios Dashboard - Compliance System
-- Sistema de auditoria e compliance
-- =================================================

-- Enum types para compliance
CREATE TYPE rule_type AS ENUM ('data_retention', 'access_control', 'data_protection', 'logging', 'backup');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE compliance_status AS ENUM ('compliant', 'non_compliant', 'partial_compliant');
CREATE TYPE finding_status AS ENUM ('pass', 'fail', 'warning');
CREATE TYPE report_type AS ENUM ('gdpr', 'lgpd', 'sox', 'iso27001', 'custom');

-- Tabela de regras de compliance
CREATE TABLE IF NOT EXISTS compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    rule_type rule_type NOT NULL,
    description TEXT NOT NULL,
    severity severity_level NOT NULL DEFAULT 'medium',
    conditions JSONB NOT NULL DEFAULT '{}'::JSONB,
    actions JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT true,
    last_check TIMESTAMPTZ,
    next_check TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relatórios de compliance
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type report_type NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    status compliance_status NOT NULL,
    findings JSONB NOT NULL DEFAULT '[]'::JSONB,
    remediation_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
    generated_by UUID NOT NULL REFERENCES profiles(id),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de execuções de regras
CREATE TABLE IF NOT EXISTS compliance_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES compliance_rules(id) ON DELETE CASCADE,
    status finding_status NOT NULL,
    execution_time_ms INTEGER,
    details JSONB DEFAULT '{}'::JSONB,
    errors JSONB DEFAULT '[]'::JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de dados sensíveis (para proteção de dados)
CREATE TABLE IF NOT EXISTS sensitive_data_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    classification TEXT NOT NULL CHECK (classification IN ('public', 'internal', 'confidential', 'restricted')),
    encryption_required BOOLEAN DEFAULT false,
    retention_days INTEGER,
    gdpr_category TEXT, -- 'personal', 'sensitive_personal', etc.
    lgpd_category TEXT, -- equivalent LGPD categories
    access_rules JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table_name, column_name)
);

-- Tabela de consentimentos (GDPR/LGPD)
CREATE TABLE IF NOT EXISTS data_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- 'marketing', 'analytics', 'necessary', etc.
    purpose TEXT NOT NULL,
    legal_basis TEXT NOT NULL, -- 'consent', 'legitimate_interest', 'contract', etc.
    granted_at TIMESTAMPTZ NOT NULL,
    withdrawn_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    consent_data JSONB DEFAULT '{}'::JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Tabela de solicitações de dados (direito do titular)
CREATE TABLE IF NOT EXISTS data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'objection')),
    user_id UUID NOT NULL REFERENCES profiles(id),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    requested_data JSONB DEFAULT '{}'::JSONB,
    justification TEXT,
    response_data JSONB DEFAULT '{}'::JSONB,
    processed_by UUID REFERENCES profiles(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ, -- Legal deadline (30 days for GDPR/LGPD)
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_compliance_rules_type ON compliance_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_active ON compliance_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_compliance_rules_next_check ON compliance_rules(next_check) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_compliance_rules_agency_id ON compliance_rules(agency_id);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_agency_id ON compliance_reports(agency_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_created_at ON compliance_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_period ON compliance_reports(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_compliance_executions_rule_id ON compliance_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_compliance_executions_status ON compliance_executions(status);
CREATE INDEX IF NOT EXISTS idx_compliance_executions_executed_at ON compliance_executions(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sensitive_data_table ON sensitive_data_registry(table_name);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_classification ON sensitive_data_registry(classification);
CREATE INDEX IF NOT EXISTS idx_sensitive_data_encryption ON sensitive_data_registry(encryption_required) WHERE encryption_required = true;

CREATE INDEX IF NOT EXISTS idx_data_consents_user_id ON data_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_data_consents_agency_id ON data_consents(agency_id);
CREATE INDEX IF NOT EXISTS idx_data_consents_active ON data_consents(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_data_consents_type ON data_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_data_consents_expires ON data_consents(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_data_requests_user_id ON data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_agency_id ON data_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_status ON data_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_requests_type ON data_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_data_requests_deadline ON data_requests(deadline);
CREATE INDEX IF NOT EXISTS idx_data_requests_requested_at ON data_requests(requested_at DESC);

-- RLS (Row Level Security)
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitive_data_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para compliance_rules
CREATE POLICY "Admins podem gerenciar todas as regras"
    ON compliance_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Owners podem gerenciar regras da agência"
    ON compliance_rules FOR ALL
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('agency_owner', 'agency_manager')
        )
    );

-- Políticas RLS para compliance_reports
CREATE POLICY "Usuários podem ver relatórios da própria agência"
    ON compliance_reports FOR SELECT
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

CREATE POLICY "Admins e owners podem criar relatórios"
    ON compliance_reports FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT agency_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

-- Políticas RLS para data_consents
CREATE POLICY "Usuários podem ver próprios consentimentos"
    ON data_consents FOR SELECT
    USING (
        user_id = auth.uid() OR
        agency_id IN (
            SELECT agency_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

CREATE POLICY "Sistema pode inserir consentimentos"
    ON data_consents FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar próprios consentimentos"
    ON data_consents FOR UPDATE
    USING (user_id = auth.uid());

-- Políticas RLS para data_requests
CREATE POLICY "Usuários podem ver próprias solicitações"
    ON data_requests FOR SELECT
    USING (
        user_id = auth.uid() OR
        agency_id IN (
            SELECT agency_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

CREATE POLICY "Usuários podem criar próprias solicitações"
    ON data_requests FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins podem processar solicitações"
    ON data_requests FOR UPDATE
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_compliance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_rules_updated_at
    BEFORE UPDATE ON compliance_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_updated_at();

CREATE TRIGGER sensitive_data_updated_at
    BEFORE UPDATE ON sensitive_data_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_updated_at();

-- Função para limpar dados expirados automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Limpar consentimentos expirados
    DELETE FROM data_consents 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Marcar consentimentos como inativos se retirados
    UPDATE data_consents 
    SET is_active = false 
    WHERE withdrawn_at IS NOT NULL 
    AND is_active = true;
    
    -- Limpar dados baseado nas regras de retenção do registro de dados sensíveis
    FOR rec IN (
        SELECT DISTINCT table_name, retention_days 
        FROM sensitive_data_registry 
        WHERE retention_days IS NOT NULL
    ) LOOP
        -- Esta seria a lógica para limpar dados expirados de cada tabela
        -- Em produção, implementar com mais cuidado baseado nos requisitos específicos
        RAISE NOTICE 'Would clean data from % older than % days', rec.table_name, rec.retention_days;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar deadlines de solicitações de dados
CREATE OR REPLACE FUNCTION check_data_request_deadlines()
RETURNS INTEGER AS $$
DECLARE
    overdue_count INTEGER;
BEGIN
    -- Contar solicitações em atraso
    SELECT COUNT(*) INTO overdue_count
    FROM data_requests 
    WHERE status IN ('pending', 'processing')
    AND deadline < NOW();
    
    -- Atualizar prioridade de solicitações próximas do deadline
    UPDATE data_requests 
    SET priority = 'urgent'
    WHERE status IN ('pending', 'processing')
    AND deadline < NOW() + INTERVAL '3 days'
    AND priority != 'urgent';
    
    RETURN overdue_count;
END;
$$ LANGUAGE plpgsql;

-- Views para dashboards de compliance
CREATE OR REPLACE VIEW compliance_dashboard AS
SELECT 
    cr.agency_id,
    COUNT(*) as total_rules,
    COUNT(*) FILTER (WHERE cr.is_active = true) as active_rules,
    COUNT(*) FILTER (WHERE cr.severity = 'critical') as critical_rules,
    COUNT(*) FILTER (WHERE cr.next_check < NOW()) as overdue_checks,
    AVG(EXTRACT(EPOCH FROM (NOW() - cr.last_check))/3600) as avg_hours_since_check
FROM compliance_rules cr
GROUP BY cr.agency_id;

CREATE OR REPLACE VIEW data_protection_summary AS
SELECT 
    sdr.table_name,
    COUNT(*) as sensitive_columns,
    COUNT(*) FILTER (WHERE sdr.encryption_required = true) as encrypted_columns,
    COUNT(*) FILTER (WHERE sdr.classification = 'restricted') as restricted_columns,
    MIN(sdr.retention_days) as min_retention_days,
    MAX(sdr.retention_days) as max_retention_days
FROM sensitive_data_registry sdr
GROUP BY sdr.table_name;

CREATE OR REPLACE VIEW consent_analytics AS
SELECT 
    dc.agency_id,
    dc.consent_type,
    COUNT(*) as total_consents,
    COUNT(*) FILTER (WHERE dc.is_active = true) as active_consents,
    COUNT(*) FILTER (WHERE dc.withdrawn_at IS NOT NULL) as withdrawn_consents,
    COUNT(*) FILTER (WHERE dc.expires_at < NOW()) as expired_consents,
    ROUND(
        COUNT(*) FILTER (WHERE dc.is_active = true)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as consent_rate_percent
FROM data_consents dc
GROUP BY dc.agency_id, dc.consent_type;

CREATE OR REPLACE VIEW data_requests_summary AS
SELECT 
    dr.agency_id,
    dr.request_type,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE dr.status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE dr.status = 'processing') as processing_requests,
    COUNT(*) FILTER (WHERE dr.status = 'completed') as completed_requests,
    COUNT(*) FILTER (WHERE dr.status = 'rejected') as rejected_requests,
    COUNT(*) FILTER (WHERE dr.deadline < NOW() AND dr.status IN ('pending', 'processing')) as overdue_requests,
    AVG(EXTRACT(EPOCH FROM (dr.processed_at - dr.requested_at))/3600) FILTER (WHERE dr.processed_at IS NOT NULL) as avg_processing_hours
FROM data_requests dr
GROUP BY dr.agency_id, dr.request_type;

-- Inserir dados iniciais de exemplo para dados sensíveis
INSERT INTO sensitive_data_registry (table_name, column_name, data_type, classification, encryption_required, retention_days, gdpr_category, lgpd_category) VALUES
('profiles', 'email', 'email', 'confidential', true, 2555, 'personal', 'dados_pessoais'),
('profiles', 'full_name', 'text', 'confidential', false, 2555, 'personal', 'dados_pessoais'),
('profiles', 'phone', 'text', 'confidential', true, 2555, 'personal', 'dados_pessoais'),
('profiles', 'cpf', 'text', 'restricted', true, 2555, 'personal', 'dados_pessoais'),
('clients', 'email', 'email', 'confidential', true, 2555, 'personal', 'dados_pessoais'),
('clients', 'name', 'text', 'confidential', false, 2555, 'personal', 'dados_pessoais'),
('clients', 'phone', 'text', 'confidential', true, 2555, 'personal', 'dados_pessoais'),
('system_logs', 'ip_address', 'inet', 'internal', false, 90, 'personal', 'dados_pessoais'),
('audit_trail', 'ip_address', 'inet', 'internal', false, 365, 'personal', 'dados_pessoais')
ON CONFLICT (table_name, column_name) DO NOTHING;

-- Regras de compliance padrão
INSERT INTO compliance_rules (rule_name, rule_type, description, severity, conditions, actions, is_active) VALUES
('Data Retention - System Logs', 'data_retention', 'Logs do sistema devem ser mantidos por no máximo 90 dias', 'medium', 
 '{"retention_days": 90, "tables": ["system_logs"]}', 
 '{"cleanup_action": "delete", "notify_admin": true}', true),

('Data Retention - Audit Trail', 'data_retention', 'Trilha de auditoria deve ser mantida por 365 dias', 'high', 
 '{"retention_days": 365, "tables": ["audit_trail"]}', 
 '{"cleanup_action": "archive", "notify_admin": true}', true),

('Access Control - Admin Tables', 'access_control', 'Apenas administradores podem acessar tabelas sensíveis', 'critical', 
 '{"required_roles": ["admin"], "protected_tables": ["compliance_rules", "sensitive_data_registry"]}', 
 '{"alert_security": true, "block_access": true}', true),

('Backup Compliance', 'backup', 'Backups devem ser executados nas últimas 24 horas', 'high', 
 '{"max_age_hours": 24, "required_tables": ["profiles", "projects", "clients"]}', 
 '{"alert_admin": true, "trigger_backup": true}', true),

('Logging Compliance', 'logging', 'Eventos de segurança devem ser logados', 'high', 
 '{"required_events": ["auth", "security"], "min_retention_days": 90}', 
 '{"alert_admin": true}', true)
ON CONFLICT DO NOTHING;

-- Comentários das tabelas
COMMENT ON TABLE compliance_rules IS 'Regras de compliance e governança configuráveis';
COMMENT ON TABLE compliance_reports IS 'Relatórios de compliance gerados periodicamente';
COMMENT ON TABLE compliance_executions IS 'Histórico de execuções das regras de compliance';
COMMENT ON TABLE sensitive_data_registry IS 'Registro de dados sensíveis e suas classificações';
COMMENT ON TABLE data_consents IS 'Consentimentos dos usuários para GDPR/LGPD';
COMMENT ON TABLE data_requests IS 'Solicitações de direitos dos titulares de dados';

COMMENT ON VIEW compliance_dashboard IS 'Dashboard executivo de compliance';
COMMENT ON VIEW data_protection_summary IS 'Resumo de proteção de dados por tabela';
COMMENT ON VIEW consent_analytics IS 'Análise de consentimentos por agência';
COMMENT ON VIEW data_requests_summary IS 'Resumo de solicitações de dados';