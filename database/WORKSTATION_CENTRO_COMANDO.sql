-- ==================================================
-- WORKSTATION COMO CENTRO DE COMANDO - FVStudios Dashboard
-- A workstation controla e orquestra todos os recursos
-- ==================================================

BEGIN;

-- ==================================================
-- 1. NÚCLEO DA WORKSTATION - CENTRO DE COMANDO
-- ==================================================

-- Estações de trabalho (cada agência pode ter múltiplas workstations)
DROP TABLE IF EXISTS workstations CASCADE;
CREATE TABLE workstations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workstation_code VARCHAR(50) NOT NULL, -- código único da workstation
    
    -- Configurações centrais
    settings JSONB DEFAULT '{
        "auto_assign_tasks": true,
        "ai_recommendations": true,
        "realtime_sync": true,
        "auto_reports": true,
        "smart_notifications": true
    }',
    
    -- Dashboard layout personalizado
    dashboard_layout JSONB DEFAULT '{
        "widgets": [
            {"type": "projects_overview", "position": {"x": 0, "y": 0, "w": 6, "h": 3}},
            {"type": "active_campaigns", "position": {"x": 6, "y": 0, "w": 6, "h": 3}},
            {"type": "team_performance", "position": {"x": 0, "y": 3, "w": 4, "h": 4}},
            {"type": "ai_insights", "position": {"x": 4, "y": 3, "w": 4, "h": 4}},
            {"type": "timeline", "position": {"x": 8, "y": 3, "w": 4, "h": 4}}
        ]
    }',
    
    -- Métricas de controle
    total_projects INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    total_integrations INTEGER DEFAULT 0,
    automation_score DECIMAL(3,2) DEFAULT 0, -- 0-1 score de automação
    
    -- Status da workstation
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, offline
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_workstation_code UNIQUE (agency_id, workstation_code)
);

-- Membros da workstation (controle de acesso)
DROP TABLE IF EXISTS workstation_members CASCADE;
CREATE TABLE workstation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Permissões na workstation
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, manager, member, viewer
    permissions JSONB DEFAULT '[
        "view_dashboard",
        "manage_tasks",
        "view_reports"
    ]',
    
    -- Configurações pessoais
    personal_settings JSONB DEFAULT '{}',
    favorite_widgets JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    last_access_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Auditoria
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint único
    UNIQUE(workstation_id, user_id)
);

-- ==================================================
-- 2. PROJETOS COMANDADOS PELA WORKSTATION
-- ==================================================

-- Adicionar referência da workstation aos projetos existentes
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workstation_id UUID REFERENCES workstations(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50) DEFAULT 'briefing';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS automation_level DECIMAL(3,2) DEFAULT 0;

-- Stages de workflow controlados pela workstation
DROP TABLE IF EXISTS project_workflow_stages CASCADE;
CREATE TABLE project_workflow_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    
    -- Configuração do stage
    name VARCHAR(255) NOT NULL,
    description TEXT,
    stage_order INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    
    -- Automações do stage
    auto_actions JSONB DEFAULT '[]', -- ações automáticas ao entrar no stage
    required_tasks JSONB DEFAULT '[]', -- tarefas obrigatórias
    approvals_required JSONB DEFAULT '[]', -- aprovações necessárias
    
    -- Configurações
    is_active BOOLEAN DEFAULT true,
    estimated_duration_days INTEGER DEFAULT 7,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint único
    UNIQUE(workstation_id, stage_order)
);

-- ==================================================
-- 3. CENTRO DE CONTROLE DE APIS E INTEGRAÇÕES
-- ==================================================

-- Adicionar referência da workstation às integrações
ALTER TABLE api_integrations ADD COLUMN IF NOT EXISTS workstation_id UUID REFERENCES workstations(id) ON DELETE SET NULL;
ALTER TABLE api_integrations ADD COLUMN IF NOT EXISTS monitoring_enabled BOOLEAN DEFAULT true;

-- Hub central de monitoramento de integrações
DROP TABLE IF EXISTS workstation_integration_hub CASCADE;
CREATE TABLE workstation_integration_hub (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    
    -- Configurações de monitoramento
    monitoring_config JSONB DEFAULT '{
        "sync_frequency": "hourly",
        "alert_on_errors": true,
        "auto_retry": true,
        "max_retries": 3
    }',
    
    -- Métricas de performance
    total_syncs INTEGER DEFAULT 0,
    successful_syncs INTEGER DEFAULT 0,
    failed_syncs INTEGER DEFAULT 0,
    last_successful_sync TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    last_error_message TEXT,
    
    -- Status da integração no hub
    hub_status VARCHAR(50) DEFAULT 'active', -- active, paused, error, maintenance
    priority_level INTEGER DEFAULT 5, -- 1-10 prioridade no hub
    
    -- Automações específicas
    auto_campaigns_sync BOOLEAN DEFAULT true,
    auto_metrics_collection BOOLEAN DEFAULT true,
    auto_report_generation BOOLEAN DEFAULT false,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint único
    UNIQUE(workstation_id, integration_id)
);

-- ==================================================
-- 4. SISTEMA INTELIGENTE COMANDADO PELA WORKSTATION
-- ==================================================

-- IA Sessions controladas pela workstation
DROP TABLE IF EXISTS workstation_ai_sessions CASCADE;
CREATE TABLE workstation_ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Configuração da sessão IA
    session_type VARCHAR(100) NOT NULL, -- 'project_analysis', 'optimization', 'recommendation', 'chat'
    ai_model VARCHAR(100) DEFAULT 'gpt-4',
    
    -- Contexto da sessão
    context_data JSONB DEFAULT '{}',
    conversation_history JSONB DEFAULT '[]',
    
    -- Resultados e insights
    insights_generated JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    actions_taken JSONB DEFAULT '[]',
    
    -- Métricas da sessão
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0,
    session_duration_seconds INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, completed, error, expired
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Recomendações da IA controladas pela workstation
ALTER TABLE intelligent_recommendations ADD COLUMN IF NOT EXISTS workstation_id UUID REFERENCES workstations(id) ON DELETE CASCADE;
ALTER TABLE intelligent_recommendations ADD COLUMN IF NOT EXISTS auto_applied BOOLEAN DEFAULT false;

-- Analytics preditivos da workstation
ALTER TABLE predictive_analytics ADD COLUMN IF NOT EXISTS workstation_id UUID REFERENCES workstations(id) ON DELETE CASCADE;
ALTER TABLE predictive_analytics ADD COLUMN IF NOT EXISTS workstation_context JSONB DEFAULT '{}';

-- ==================================================
-- 5. CENTRO DE AUTOMAÇÕES DA WORKSTATION
-- ==================================================

-- Automações gerenciadas pela workstation
DROP TABLE IF EXISTS workstation_automations CASCADE;
CREATE TABLE workstation_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Configuração da automação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    automation_type VARCHAR(100) NOT NULL, -- 'task_assignment', 'notification', 'report', 'sync', 'workflow'
    
    -- Trigger da automação
    trigger_type VARCHAR(100) NOT NULL, -- 'schedule', 'event', 'condition', 'manual'
    trigger_config JSONB NOT NULL, -- configuração específica do trigger
    
    -- Ações da automação
    actions JSONB NOT NULL, -- lista de ações a serem executadas
    
    -- Controle de execução
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    last_execution_at TIMESTAMPTZ,
    next_execution_at TIMESTAMPTZ,
    
    -- Métricas
    success_rate DECIMAL(3,2) DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log de execuções das automações
DROP TABLE IF EXISTS workstation_automation_executions CASCADE;
CREATE TABLE workstation_automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    automation_id UUID NOT NULL REFERENCES workstation_automations(id) ON DELETE CASCADE,
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    
    -- Dados da execução
    execution_trigger VARCHAR(100) NOT NULL,
    trigger_data JSONB DEFAULT '{}',
    
    -- Resultado
    status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial', 'skipped'
    actions_executed JSONB DEFAULT '[]',
    execution_time_ms INTEGER,
    
    -- Erros e logs
    error_message TEXT,
    execution_log JSONB DEFAULT '[]',
    
    -- Auditoria
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 6. COMUNICAÇÃO E NOTIFICAÇÕES CENTRALIZADAS
-- ==================================================

-- Adicionar workstation às notificações existentes
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS workstation_id UUID REFERENCES workstations(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notification_source VARCHAR(100) DEFAULT 'system'; -- workstation, ai, integration, automation

-- Centro de comunicação da workstation
DROP TABLE IF EXISTS workstation_communication_hub CASCADE;
CREATE TABLE workstation_communication_hub (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    
    -- Configurações de comunicação
    channels_config JSONB DEFAULT '{
        "email": {"enabled": true, "priority": "medium"},
        "slack": {"enabled": false, "webhook_url": null},
        "whatsapp": {"enabled": false, "api_key": null},
        "push": {"enabled": true, "priority": "high"},
        "sms": {"enabled": false, "provider": null}
    }',
    
    -- Filtros e regras
    notification_rules JSONB DEFAULT '[]',
    escalation_rules JSONB DEFAULT '[]',
    
    -- Métricas
    notifications_sent_today INTEGER DEFAULT 0,
    notifications_sent_week INTEGER DEFAULT 0,
    response_rate DECIMAL(3,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 7. RELATÓRIOS CENTRALIZADOS NA WORKSTATION
-- ==================================================

-- Relatórios gerados pela workstation
DROP TABLE IF EXISTS workstation_reports CASCADE;
CREATE TABLE workstation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Configuração do relatório
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'project_summary', 'team_performance', 'client_overview', 'integration_metrics'
    report_config JSONB NOT NULL,
    
    -- Dados do relatório
    report_data JSONB NOT NULL,
    filters_applied JSONB DEFAULT '{}',
    date_range JSONB NOT NULL, -- {start_date, end_date}
    
    -- Configurações de sharing
    is_scheduled BOOLEAN DEFAULT false,
    schedule_config JSONB DEFAULT '{}',
    recipients JSONB DEFAULT '[]',
    
    -- Métricas
    file_size_bytes BIGINT,
    generation_time_ms INTEGER,
    view_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'generated', -- generating, generated, sent, archived, error
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 8. MÉTRICAS DA WORKSTATION EM TEMPO REAL
-- ==================================================

-- Métricas consolidadas da workstation
DROP TABLE IF EXISTS workstation_metrics CASCADE;
CREATE TABLE workstation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
    
    -- Timestamp da métrica
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metric_hour INTEGER DEFAULT EXTRACT(hour FROM NOW()), -- 0-23
    
    -- Métricas de projetos
    projects_created INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    avg_project_duration_days DECIMAL(5,2) DEFAULT 0,
    
    -- Métricas de equipe
    active_users INTEGER DEFAULT 0,
    user_sessions INTEGER DEFAULT 0,
    avg_session_duration_minutes INTEGER DEFAULT 0,
    
    -- Métricas de integrações
    api_calls_made INTEGER DEFAULT 0,
    sync_operations INTEGER DEFAULT 0,
    integration_errors INTEGER DEFAULT 0,
    
    -- Métricas de IA
    ai_sessions INTEGER DEFAULT 0,
    recommendations_generated INTEGER DEFAULT 0,
    recommendations_accepted INTEGER DEFAULT 0,
    tokens_consumed INTEGER DEFAULT 0,
    
    -- Métricas de automação
    automations_executed INTEGER DEFAULT 0,
    automation_success_rate DECIMAL(3,2) DEFAULT 0,
    time_saved_minutes INTEGER DEFAULT 0,
    
    -- Métricas de comunicação
    notifications_sent INTEGER DEFAULT 0,
    messages_exchanged INTEGER DEFAULT 0,
    reports_generated INTEGER DEFAULT 0,
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint único por workstation/date/hour
    UNIQUE(workstation_id, metric_date, metric_hour)
);

-- ==================================================
-- 9. ÍNDICES PARA PERFORMANCE DA WORKSTATION
-- ==================================================

-- Índices das tabelas da workstation
CREATE INDEX IF NOT EXISTS idx_workstations_agency_id ON workstations(agency_id);
CREATE INDEX IF NOT EXISTS idx_workstations_owner_id ON workstations(owner_id);
CREATE INDEX IF NOT EXISTS idx_workstations_status ON workstations(status);

CREATE INDEX IF NOT EXISTS idx_workstation_members_workstation_id ON workstation_members(workstation_id);
CREATE INDEX IF NOT EXISTS idx_workstation_members_user_id ON workstation_members(user_id);

CREATE INDEX IF NOT EXISTS idx_project_workflow_stages_workstation_id ON project_workflow_stages(workstation_id);

CREATE INDEX IF NOT EXISTS idx_workstation_integration_hub_workstation_id ON workstation_integration_hub(workstation_id);
CREATE INDEX IF NOT EXISTS idx_workstation_integration_hub_integration_id ON workstation_integration_hub(integration_id);

CREATE INDEX IF NOT EXISTS idx_workstation_ai_sessions_workstation_id ON workstation_ai_sessions(workstation_id);
CREATE INDEX IF NOT EXISTS idx_workstation_ai_sessions_user_id ON workstation_ai_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_workstation_automations_workstation_id ON workstation_automations(workstation_id);
CREATE INDEX IF NOT EXISTS idx_workstation_automations_type ON workstation_automations(automation_type);

CREATE INDEX IF NOT EXISTS idx_workstation_metrics_workstation_id ON workstation_metrics(workstation_id);
CREATE INDEX IF NOT EXISTS idx_workstation_metrics_date ON workstation_metrics(metric_date);

-- ==================================================
-- 10. TRIGGERS DA WORKSTATION
-- ==================================================

-- Triggers para updated_at
CREATE TRIGGER update_workstations_updated_at 
    BEFORE UPDATE ON workstations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_workflow_stages_updated_at 
    BEFORE UPDATE ON project_workflow_stages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workstation_integration_hub_updated_at 
    BEFORE UPDATE ON workstation_integration_hub 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workstation_automations_updated_at 
    BEFORE UPDATE ON workstation_automations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workstation_communication_hub_updated_at 
    BEFORE UPDATE ON workstation_communication_hub 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workstation_reports_updated_at 
    BEFORE UPDATE ON workstation_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 11. FUNÇÕES DE CONTROLE DA WORKSTATION
-- ==================================================

-- Função para calcular score de automação da workstation
CREATE OR REPLACE FUNCTION calculate_workstation_automation_score(workstation_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_processes INTEGER;
    automated_processes INTEGER;
    automation_score DECIMAL(3,2);
BEGIN
    -- Contar processos automatizados vs manuais
    SELECT COUNT(*) INTO total_processes
    FROM (
        SELECT 1 FROM projects WHERE workstation_id = workstation_uuid
        UNION ALL
        SELECT 1 FROM workstation_automations WHERE workstation_id = workstation_uuid AND is_active = true
        UNION ALL  
        SELECT 1 FROM workstation_integration_hub WHERE workstation_id = workstation_uuid AND hub_status = 'active'
    ) as all_processes;
    
    SELECT COUNT(*) INTO automated_processes
    FROM workstation_automations 
    WHERE workstation_id = workstation_uuid AND is_active = true;
    
    IF total_processes = 0 THEN
        automation_score := 0;
    ELSE
        automation_score := (automated_processes::DECIMAL / total_processes::DECIMAL);
    END IF;
    
    -- Atualizar na tabela workstations
    UPDATE workstations 
    SET automation_score = automation_score,
        updated_at = NOW()
    WHERE id = workstation_uuid;
    
    RETURN automation_score;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar métricas da workstation em tempo real
CREATE OR REPLACE FUNCTION update_workstation_realtime_metrics(workstation_uuid UUID)
RETURNS VOID AS $$
DECLARE
    current_hour INTEGER := EXTRACT(hour FROM NOW());
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Inserir ou atualizar métricas da hora atual
    INSERT INTO workstation_metrics (
        workstation_id,
        metric_date,
        metric_hour,
        projects_created,
        projects_completed,
        tasks_completed,
        active_users,
        api_calls_made,
        automations_executed
    ) VALUES (
        workstation_uuid,
        current_date,
        current_hour,
        (SELECT COUNT(*) FROM projects WHERE workstation_id = workstation_uuid AND DATE(created_at) = current_date),
        (SELECT COUNT(*) FROM projects WHERE workstation_id = workstation_uuid AND status = 'completed' AND DATE(updated_at) = current_date),
        (SELECT COUNT(*) FROM tasks WHERE agency_id IN (SELECT agency_id FROM workstations WHERE id = workstation_uuid) AND status = 'completed' AND DATE(updated_at) = current_date),
        (SELECT COUNT(DISTINCT user_id) FROM workstation_members WHERE workstation_id = workstation_uuid AND status = 'active'),
        (SELECT COALESCE(SUM(total_syncs), 0) FROM workstation_integration_hub WHERE workstation_id = workstation_uuid),
        (SELECT COUNT(*) FROM workstation_automation_executions WHERE workstation_id = workstation_uuid AND DATE(executed_at) = current_date)
    ) ON CONFLICT (workstation_id, metric_date, metric_hour) 
    DO UPDATE SET
        projects_created = EXCLUDED.projects_created,
        projects_completed = EXCLUDED.projects_completed,
        tasks_completed = EXCLUDED.tasks_completed,
        active_users = EXCLUDED.active_users,
        api_calls_made = EXCLUDED.api_calls_made,
        automations_executed = EXCLUDED.automations_executed;
        
    -- Atualizar métricas consolidadas na workstation
    UPDATE workstations SET
        total_projects = (SELECT COUNT(*) FROM projects WHERE workstation_id = workstation_uuid),
        active_projects = (SELECT COUNT(*) FROM projects WHERE workstation_id = workstation_uuid AND status IN ('active', 'planning')),
        total_integrations = (SELECT COUNT(*) FROM workstation_integration_hub WHERE workstation_id = workstation_uuid),
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE id = workstation_uuid;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 12. DADOS INICIAIS DA WORKSTATION
-- ==================================================

-- Criar workstation padrão para agência exemplo
INSERT INTO workstations (
    id,
    agency_id,
    owner_id,
    name,
    description,
    workstation_code
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Centro de Comando Principal',
    'Workstation principal da FVStudios para controle centralizado de todos os projetos, integrações e automações',
    'COMMAND_CENTER'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Adicionar admin como membro da workstation
INSERT INTO workstation_members (
    workstation_id,
    user_id,
    role,
    permissions
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'owner',
    '["all"]'
) ON CONFLICT (workstation_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions;

-- Criar stages de workflow padrão
INSERT INTO project_workflow_stages (workstation_id, name, stage_order, color, description) VALUES
('00000000-0000-0000-0000-000000000001'::UUID, 'Briefing', 1, '#F59E0B', 'Coleta de informações e requisitos do cliente'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Planejamento', 2, '#3B82F6', 'Estratégia e cronograma detalhado'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Design', 3, '#8B5CF6', 'Criação visual e conceitual'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Desenvolvimento', 4, '#10B981', 'Implementação e criação de conteúdo'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Revisão', 5, '#F97316', 'Análise e ajustes necessários'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Aprovação', 6, '#6366F1', 'Validação final com o cliente'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Lançamento', 7, '#DC2626', 'Go-live e ativação'),
('00000000-0000-0000-0000-000000000001'::UUID, 'Monitoramento', 8, '#059669', 'Acompanhamento e otimização')
ON CONFLICT (workstation_id, stage_order) DO NOTHING;

-- Criar hub de comunicação padrão
INSERT INTO workstation_communication_hub (
    workstation_id
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID
) ON CONFLICT DO NOTHING;

-- ==================================================
-- 13. VERIFICAÇÃO FINAL
-- ==================================================

DO $$
DECLARE
    workstation_tables INTEGER;
    workstation_functions INTEGER;
    workstation_indexes INTEGER;
BEGIN
    -- Contar tabelas da workstation
    SELECT COUNT(*) INTO workstation_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%workstation%';
    
    -- Contar funções da workstation
    SELECT COUNT(*) INTO workstation_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE '%workstation%';
    
    -- Contar índices da workstation
    SELECT COUNT(*) INTO workstation_indexes
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE '%workstation%';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎛️ ================================================';
    RAISE NOTICE '   WORKSTATION - CENTRO DE COMANDO INSTALADO';
    RAISE NOTICE '🎛️ ================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Sistema da Workstation:';
    RAISE NOTICE '   • Tabelas da workstation: %', workstation_tables;
    RAISE NOTICE '   • Funções de controle: %', workstation_functions;
    RAISE NOTICE '   • Índices otimizados: %', workstation_indexes;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Recursos Centralizados:';
    RAISE NOTICE '   • ✅ Controle total de projetos';
    RAISE NOTICE '   • ✅ Hub de integrações APIs';  
    RAISE NOTICE '   • ✅ Sistema IA integrado';
    RAISE NOTICE '   • ✅ Centro de automações';
    RAISE NOTICE '   • ✅ Comunicação unificada';
    RAISE NOTICE '   • ✅ Relatórios centralizados';
    RAISE NOTICE '   • ✅ Métricas em tempo real';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 WORKSTATION PRONTA PARA COMANDO TOTAL!';
    RAISE NOTICE '';
END $$;

COMMIT;