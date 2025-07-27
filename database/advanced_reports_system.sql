-- ===============================================
-- 📊 SISTEMA DE RELATÓRIOS AVANÇADOS
-- ===============================================
-- Sistema completo para geração de relatórios customizáveis
-- com export em múltiplos formatos (PDF, Excel, CSV, JSON)
-- ===============================================

-- Tipos customizados
DO $$ BEGIN
    CREATE TYPE report_category AS ENUM (
        'financial',
        'performance',
        'projects', 
        'team',
        'clients',
        'marketing',
        'analytics',
        'compliance',
        'executive',
        'operational'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_format AS ENUM (
        'pdf',
        'excel',
        'csv',
        'json',
        'html'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_frequency AS ENUM (
        'once',
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
        'draft',
        'scheduled',
        'generating',
        'completed',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===============================================
-- 1. TABELA DE TEMPLATES DE RELATÓRIOS
-- ===============================================

CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category report_category NOT NULL,
    
    -- Configuração da consulta
    data_sources JSONB NOT NULL DEFAULT '[]', -- Tabelas e views utilizadas
    query_config JSONB NOT NULL DEFAULT '{}', -- Configuração da query SQL
    filters_config JSONB NOT NULL DEFAULT '{}', -- Filtros disponíveis
    
    -- Layout e formatação
    layout_config JSONB NOT NULL DEFAULT '{}', -- Configuração de layout
    chart_config JSONB NOT NULL DEFAULT '{}', -- Configuração de gráficos
    styling_config JSONB NOT NULL DEFAULT '{}', -- Cores, fontes, etc.
    
    -- Configurações de acesso
    is_public BOOLEAN DEFAULT FALSE,
    allowed_roles TEXT[] DEFAULT '{}',
    allowed_users UUID[] DEFAULT '{}',
    
    -- Metadados
    usage_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 2. TABELA DE RELATÓRIOS
-- ===============================================

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
    
    -- Informações básicas
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category report_category NOT NULL,
    
    -- Configuração de dados
    data_config JSONB NOT NULL DEFAULT '{}', -- Configuração específica dos dados
    filter_values JSONB NOT NULL DEFAULT '{}', -- Valores dos filtros aplicados
    date_range JSONB NOT NULL DEFAULT '{}', -- Período dos dados
    
    -- Configuração de formato
    output_formats report_format[] DEFAULT '{pdf}',
    layout_settings JSONB NOT NULL DEFAULT '{}',
    
    -- Agendamento
    frequency report_frequency DEFAULT 'once',
    schedule_config JSONB DEFAULT '{}', -- Configuração de agendamento
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    
    -- Status e resultados
    status report_status DEFAULT 'draft',
    generation_progress INTEGER DEFAULT 0, -- 0-100
    error_message TEXT,
    
    -- Configurações de acesso
    is_public BOOLEAN DEFAULT FALSE,
    shared_with UUID[] DEFAULT '{}',
    access_permissions JSONB DEFAULT '{}',
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 3. TABELA DE EXECUÇÕES DE RELATÓRIOS
-- ===============================================

CREATE TABLE IF NOT EXISTS report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Informações da execução
    execution_number INTEGER NOT NULL,
    status report_status DEFAULT 'generating',
    progress_percentage INTEGER DEFAULT 0,
    
    -- Configuração utilizada
    config_snapshot JSONB NOT NULL, -- Snapshot da config no momento da execução
    filter_values JSONB NOT NULL DEFAULT '{}',
    date_range JSONB NOT NULL DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Resultados
    output_files JSONB DEFAULT '[]', -- Lista de arquivos gerados
    data_summary JSONB DEFAULT '{}', -- Resumo dos dados processados
    performance_metrics JSONB DEFAULT '{}', -- Métricas de performance
    
    -- Erro (se houver)
    error_message TEXT,
    error_details JSONB,
    
    -- Metadados
    executed_by UUID REFERENCES auth.users(id),
    execution_source VARCHAR(50) DEFAULT 'manual' -- manual, scheduled, api
);

-- ===============================================
-- 4. TABELA DE ARQUIVOS DE RELATÓRIOS
-- ===============================================

CREATE TABLE IF NOT EXISTS report_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES report_executions(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Informações do arquivo
    filename VARCHAR(255) NOT NULL,
    format report_format NOT NULL,
    file_size_bytes BIGINT,
    file_path TEXT, -- Caminho para storage
    download_url TEXT, -- URL temporária para download
    
    -- Configurações
    generation_config JSONB DEFAULT '{}',
    compression_used BOOLEAN DEFAULT FALSE,
    
    -- Acesso
    is_password_protected BOOLEAN DEFAULT FALSE,
    password_hash TEXT, -- Para proteção por senha
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 5. TABELA DE DATA SOURCES CONFIGURÁVEIS
-- ===============================================

CREATE TABLE IF NOT EXISTS report_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Informações da fonte
    name VARCHAR(150) NOT NULL,
    description TEXT,
    source_type VARCHAR(50) NOT NULL, -- table, view, function, external_api
    
    -- Configuração da fonte
    connection_config JSONB NOT NULL, -- Config de conexão/query
    schema_config JSONB NOT NULL DEFAULT '{}', -- Schema dos dados retornados
    refresh_config JSONB DEFAULT '{}', -- Configuração de refresh
    
    -- Cache e performance
    cache_ttl_minutes INTEGER DEFAULT 60,
    last_refreshed_at TIMESTAMP WITH TIME ZONE,
    
    -- Permissões
    allowed_roles TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 6. TABELA DE WIDGETS DE RELATÓRIOS
-- ===============================================

CREATE TABLE IF NOT EXISTS report_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração do widget
    name VARCHAR(150) NOT NULL,
    widget_type VARCHAR(50) NOT NULL, -- chart, table, metric, text, image
    position_config JSONB NOT NULL, -- x, y, width, height
    
    -- Dados e formatação
    data_config JSONB NOT NULL DEFAULT '{}',
    display_config JSONB NOT NULL DEFAULT '{}',
    style_config JSONB NOT NULL DEFAULT '{}',
    
    -- Condições e filtros
    visibility_conditions JSONB DEFAULT '{}',
    filter_dependencies JSONB DEFAULT '{}',
    
    -- Ordem de renderização
    render_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 7. TABELA DE CONFIGURAÇÕES DE EXPORT
-- ===============================================

CREATE TABLE IF NOT EXISTS report_export_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração por formato
    format report_format NOT NULL,
    config_name VARCHAR(100) NOT NULL,
    
    -- Configurações específicas do formato
    format_settings JSONB NOT NULL DEFAULT '{}',
    quality_settings JSONB DEFAULT '{}',
    security_settings JSONB DEFAULT '{}',
    
    -- Templates de formatação
    header_template TEXT,
    footer_template TEXT,
    styling_template JSONB DEFAULT '{}',
    
    -- Configurações padrão
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, format, config_name)
);

-- ===============================================
-- 8. TABELA DE AGENDAMENTOS
-- ===============================================

CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração do agendamento
    name VARCHAR(150) NOT NULL,
    frequency report_frequency NOT NULL,
    schedule_expression VARCHAR(100), -- Cron expression para agendamentos complexos
    
    -- Configuração de execução
    timezone VARCHAR(50) DEFAULT 'UTC',
    execution_config JSONB DEFAULT '{}',
    
    -- Distribuição
    recipients JSONB NOT NULL DEFAULT '[]', -- Lista de destinatários
    distribution_config JSONB DEFAULT '{}', -- Config de envio (email, webhook, etc.)
    
    -- Estado do agendamento
    is_active BOOLEAN DEFAULT TRUE,
    next_execution TIMESTAMP WITH TIME ZONE,
    last_execution TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    -- Configurações de retry
    max_retries INTEGER DEFAULT 3,
    retry_delay_minutes INTEGER DEFAULT 15,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 9. TABELA DE MÉTRICAS DE PERFORMANCE
-- ===============================================

CREATE TABLE IF NOT EXISTS report_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES report_executions(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Métricas de tempo
    query_duration_ms BIGINT,
    processing_duration_ms BIGINT,
    rendering_duration_ms BIGINT,
    export_duration_ms BIGINT,
    total_duration_ms BIGINT,
    
    -- Métricas de dados
    rows_processed INTEGER,
    data_size_bytes BIGINT,
    memory_usage_mb FLOAT,
    cpu_usage_percent FLOAT,
    
    -- Métricas de qualidade
    cache_hit_rate FLOAT,
    error_count INTEGER,
    warning_count INTEGER,
    
    -- Configuração de sistema no momento da execução
    system_config JSONB DEFAULT '{}',
    
    -- Timestamp
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- ===============================================

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_report_templates_agency_category ON report_templates(agency_id, category);
CREATE INDEX IF NOT EXISTS idx_report_templates_public_featured ON report_templates(is_public, is_featured) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_report_templates_usage ON report_templates(usage_count DESC);

-- Índices para relatórios
CREATE INDEX IF NOT EXISTS idx_reports_agency_status ON reports(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_next_run ON reports(next_run_at) WHERE next_run_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);

-- Índices para execuções
CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status_started ON report_executions(status, started_at);
CREATE INDEX IF NOT EXISTS idx_report_executions_agency_date ON report_executions(agency_id, started_at DESC);

-- Índices para arquivos
CREATE INDEX IF NOT EXISTS idx_report_files_execution ON report_files(execution_id);
CREATE INDEX IF NOT EXISTS idx_report_files_expires ON report_files(expires_at) WHERE expires_at IS NOT NULL;

-- Índices para agendamentos
CREATE INDEX IF NOT EXISTS idx_report_schedules_active_next ON report_schedules(is_active, next_execution) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_report_schedules_report ON report_schedules(report_id);

-- ===============================================
-- TRIGGERS PARA AUDITORIA E AUTOMAÇÃO
-- ===============================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW EXECUTE FUNCTION update_report_updated_at();

CREATE TRIGGER trigger_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_report_updated_at();

CREATE TRIGGER trigger_report_data_sources_updated_at
    BEFORE UPDATE ON report_data_sources
    FOR EACH ROW EXECUTE FUNCTION update_report_updated_at();

-- Trigger para calcular duração de execução
CREATE OR REPLACE FUNCTION calculate_execution_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_report_execution_duration
    BEFORE UPDATE ON report_executions
    FOR EACH ROW EXECUTE FUNCTION calculate_execution_duration();

-- Trigger para atualizar contador de uso de templates
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE report_templates 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_template_usage
    AFTER INSERT ON reports
    FOR EACH ROW EXECUTE FUNCTION increment_template_usage();

-- ===============================================
-- FUNÇÕES PARA ESTATÍSTICAS E RELATÓRIOS
-- ===============================================

-- Função para obter estatísticas de relatórios
CREATE OR REPLACE FUNCTION get_report_stats(
    p_agency_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_reports INTEGER,
    active_reports INTEGER,
    total_executions INTEGER,
    successful_executions INTEGER,
    failed_executions INTEGER,
    avg_execution_time_seconds FLOAT,
    reports_by_category JSONB,
    executions_by_day JSONB,
    top_templates JSONB
) AS $$
DECLARE
    start_date TIMESTAMP;
BEGIN
    start_date := NOW() - (p_days_back || ' days')::INTERVAL;
    
    SELECT 
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE status IN ('scheduled', 'generating'))::INTEGER,
        COALESCE(SUM(exec_stats.execution_count), 0)::INTEGER,
        COALESCE(SUM(exec_stats.successful_count), 0)::INTEGER,
        COALESCE(SUM(exec_stats.failed_count), 0)::INTEGER,
        COALESCE(AVG(exec_stats.avg_duration), 0)::FLOAT,
        json_agg(
            json_build_object(
                'category', r.category,
                'count', category_counts.count
            )
        ) FILTER (WHERE category_counts.count > 0),
        json_agg(
            json_build_object(
                'date', daily_stats.date,
                'executions', daily_stats.count
            )
        ) FILTER (WHERE daily_stats.count > 0),
        json_agg(
            json_build_object(
                'template_name', top_templates.name,
                'usage_count', top_templates.usage_count
            )
        ) FILTER (WHERE top_templates.usage_count > 0)
    INTO 
        total_reports,
        active_reports,
        total_executions,
        successful_executions,
        failed_executions,
        avg_execution_time_seconds,
        reports_by_category,
        executions_by_day,
        top_templates
    FROM reports r
    LEFT JOIN (
        SELECT 
            report_id,
            COUNT(*)::INTEGER as execution_count,
            COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as successful_count,
            COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_count,
            AVG(duration_seconds)::FLOAT as avg_duration
        FROM report_executions 
        WHERE started_at >= start_date
        GROUP BY report_id
    ) exec_stats ON r.id = exec_stats.report_id
    LEFT JOIN (
        SELECT category, COUNT(*)::INTEGER as count
        FROM reports
        WHERE agency_id = p_agency_id
        GROUP BY category
    ) category_counts ON r.category = category_counts.category
    LEFT JOIN (
        SELECT 
            DATE(started_at) as date,
            COUNT(*)::INTEGER as count
        FROM report_executions re
        JOIN reports r ON re.report_id = r.id
        WHERE r.agency_id = p_agency_id
        AND started_at >= start_date
        GROUP BY DATE(started_at)
        ORDER BY date
    ) daily_stats ON true
    LEFT JOIN (
        SELECT rt.name, rt.usage_count
        FROM report_templates rt
        WHERE rt.agency_id = p_agency_id
        OR rt.is_public = TRUE
        ORDER BY rt.usage_count DESC
        LIMIT 10
    ) top_templates ON true
    WHERE r.agency_id = p_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ===============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_export_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para report_templates
CREATE POLICY "report_templates_agency_isolation" ON report_templates
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
        OR is_public = TRUE
    );

-- Políticas para reports
CREATE POLICY "reports_agency_isolation" ON reports
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para report_executions  
CREATE POLICY "report_executions_agency_isolation" ON report_executions
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para report_files
CREATE POLICY "report_files_agency_isolation" ON report_files
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para report_data_sources
CREATE POLICY "report_data_sources_agency_isolation" ON report_data_sources
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para report_widgets
CREATE POLICY "report_widgets_agency_isolation" ON report_widgets
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para report_export_configs
CREATE POLICY "report_export_configs_agency_isolation" ON report_export_configs
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para report_schedules
CREATE POLICY "report_schedules_agency_isolation" ON report_schedules
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para report_performance_metrics
CREATE POLICY "report_performance_metrics_agency_isolation" ON report_performance_metrics
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- ===============================================
-- INSERÇÃO DE DADOS DEMO/SEED
-- ===============================================

-- Templates de relatório padrão (públicos)
INSERT INTO report_templates (
    agency_id, name, description, category, data_sources, query_config, layout_config, is_public, is_featured
) VALUES 
-- Relatório Financeiro
(
    NULL,
    'Relatório Financeiro Mensal',
    'Análise completa da performance financeira mensal',
    'financial',
    '["projects", "invoices", "payments"]',
    '{"base_query": "financial_summary", "grouping": "monthly", "metrics": ["revenue", "profit", "expenses"]}',
    '{"orientation": "portrait", "charts": ["line", "pie"], "sections": ["summary", "details", "trends"]}',
    TRUE,
    TRUE
),
-- Relatório de Performance de Projetos
(
    NULL,
    'Performance de Projetos',
    'Análise de produtividade e performance dos projetos',
    'projects',
    '["projects", "tasks", "time_tracking"]',
    '{"base_query": "project_performance", "grouping": "project", "metrics": ["completion_rate", "time_spent", "efficiency"]}',
    '{"orientation": "landscape", "charts": ["bar", "gauge"], "sections": ["overview", "by_project", "team_performance"]}',
    TRUE,
    TRUE
),
-- Relatório de Team Analytics
(
    NULL,
    'Analytics de Equipe',
    'Métricas de produtividade e engajamento da equipe',
    'team',
    '["user_profiles", "tasks", "time_tracking", "projects"]',
    '{"base_query": "team_analytics", "grouping": "user", "metrics": ["productivity", "workload", "satisfaction"]}',
    '{"orientation": "portrait", "charts": ["radar", "bar"], "sections": ["team_overview", "individual_performance", "recommendations"]}',
    TRUE,
    FALSE
);

-- Configurações de export padrão
INSERT INTO report_export_configs (
    agency_id, format, config_name, format_settings, is_default
) VALUES 
(NULL, 'pdf', 'Padrão PDF', '{"quality": "high", "compression": true, "password_protect": false}', TRUE),
(NULL, 'excel', 'Padrão Excel', '{"include_charts": true, "multiple_sheets": true, "auto_width": true}', TRUE),
(NULL, 'csv', 'Padrão CSV', '{"delimiter": ",", "encoding": "UTF-8", "include_headers": true}', TRUE);

-- ===============================================
-- COMENTÁRIOS FINAIS
-- ===============================================

COMMENT ON TABLE report_templates IS 'Templates reutilizáveis para criação de relatórios customizados';
COMMENT ON TABLE reports IS 'Relatórios configurados pelos usuários, baseados em templates ou criados do zero';
COMMENT ON TABLE report_executions IS 'Histórico de execuções de relatórios com resultados e métricas';
COMMENT ON TABLE report_files IS 'Arquivos gerados pelas execuções de relatórios em diferentes formatos';
COMMENT ON TABLE report_data_sources IS 'Fontes de dados configuráveis para uso em relatórios';
COMMENT ON TABLE report_widgets IS 'Widgets individuais que compõem os layouts dos relatórios';
COMMENT ON TABLE report_export_configs IS 'Configurações de formatação para diferentes tipos de export';
COMMENT ON TABLE report_schedules IS 'Agendamentos automáticos de execução de relatórios';
COMMENT ON TABLE report_performance_metrics IS 'Métricas detalhadas de performance das execuções';

-- ===============================================
-- ✅ SISTEMA DE RELATÓRIOS AVANÇADOS COMPLETO
-- ===============================================