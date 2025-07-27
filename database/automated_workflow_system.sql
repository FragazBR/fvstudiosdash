-- =============================================
-- Sistema de Workflow Automatizado para Aprovações
-- =============================================

-- Enum para tipos de workflow
DO $$ BEGIN
    CREATE TYPE workflow_type AS ENUM (
        'project_approval', 'content_approval', 'budget_approval', 
        'contract_approval', 'design_approval', 'payment_approval',
        'user_registration', 'task_completion', 'milestone_approval',
        'invoice_approval', 'expense_approval', 'time_off_request',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status do workflow
DO $$ BEGIN
    CREATE TYPE workflow_status AS ENUM (
        'draft', 'active', 'paused', 'completed', 'cancelled', 'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status das instâncias
DO $$ BEGIN
    CREATE TYPE workflow_instance_status AS ENUM (
        'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de ação
DO $$ BEGIN
    CREATE TYPE workflow_action_type AS ENUM (
        'approve', 'reject', 'request_changes', 'delegate', 'escalate', 
        'comment', 'notify', 'assign', 'complete', 'cancel'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de condição
DO $$ BEGIN
    CREATE TYPE workflow_condition_type AS ENUM (
        'approval_count', 'rejection_count', 'user_role', 'user_id',
        'field_value', 'time_limit', 'business_hours', 'custom_rule'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela principal de workflows
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração básica
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type workflow_type NOT NULL,
    
    -- Configurações de comportamento
    is_active BOOLEAN DEFAULT TRUE,
    is_parallel BOOLEAN DEFAULT FALSE, -- Aprovações em paralelo ou sequencial
    requires_all_approvers BOOLEAN DEFAULT TRUE,
    auto_approve_threshold INTEGER, -- Número mínimo de aprovações
    auto_reject_threshold INTEGER, -- Número mínimo de rejeições
    
    -- Configurações de tempo
    default_timeout_hours INTEGER DEFAULT 72,
    escalation_timeout_hours INTEGER DEFAULT 168, -- 7 dias
    business_hours_only BOOLEAN DEFAULT FALSE,
    
    -- Schema do workflow (etapas e regras)
    workflow_schema JSONB NOT NULL DEFAULT '[]',
    
    -- Configurações de notificação
    notification_settings JSONB DEFAULT '{}',
    
    -- Configurações de integração
    webhook_url TEXT,
    integration_settings JSONB DEFAULT '{}',
    
    -- Estatísticas
    total_instances INTEGER DEFAULT 0,
    completed_instances INTEGER DEFAULT 0,
    average_completion_time_hours DECIMAL(10,2),
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, name)
);

-- Tabela para instâncias de workflow
CREATE TABLE IF NOT EXISTS workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Identificação da instância
    title VARCHAR(500) NOT NULL,
    description TEXT,
    reference_id VARCHAR(100), -- ID do objeto relacionado (projeto, tarefa, etc.)
    reference_type VARCHAR(50), -- Tipo do objeto relacionado
    
    -- Status e progresso
    status workflow_instance_status DEFAULT 'pending',
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Dados do contexto
    context_data JSONB DEFAULT '{}',
    form_data JSONB DEFAULT '{}',
    
    -- Configurações de tempo
    started_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    
    -- Prioridade
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent, critical
    
    -- Aprovadores e responsáveis
    assigned_users UUID[] DEFAULT '{}',
    current_approvers UUID[] DEFAULT '{}',
    completed_by UUID REFERENCES auth.users(id),
    
    -- Resultados
    final_decision VARCHAR(20), -- approved, rejected, cancelled
    final_comments TEXT,
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para etapas do workflow
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    
    -- Configuração da etapa
    step_number INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Tipo e configurações
    step_type VARCHAR(50) NOT NULL, -- approval, notification, condition, action
    is_required BOOLEAN DEFAULT TRUE,
    is_parallel BOOLEAN DEFAULT FALSE,
    
    -- Aprovadores
    approver_users UUID[] DEFAULT '{}',
    approver_roles TEXT[] DEFAULT '{}',
    required_approvals INTEGER DEFAULT 1,
    
    -- Condições
    conditions JSONB DEFAULT '[]',
    
    -- Ações automáticas
    actions JSONB DEFAULT '[]',
    
    -- Configurações de tempo
    timeout_hours INTEGER,
    escalation_rules JSONB DEFAULT '{}',
    
    -- Configurações de notificação
    notification_template_id UUID,
    notification_settings JSONB DEFAULT '{}',
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workflow_id, step_number)
);

-- Tabela para aprovações/ações individuais
CREATE TABLE IF NOT EXISTS workflow_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
    
    -- Aprovador
    approver_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Decisão
    action workflow_action_type NOT NULL,
    decision VARCHAR(20), -- approved, rejected, delegated, etc.
    comments TEXT,
    
    -- Dados adicionais
    action_data JSONB DEFAULT '{}',
    
    -- Delegação
    delegated_to UUID REFERENCES auth.users(id),
    delegation_reason TEXT,
    
    -- Tempo
    action_taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_hours DECIMAL(10,2),
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para histórico de ações
CREATE TABLE IF NOT EXISTS workflow_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    
    -- Ação realizada
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    
    -- Contexto
    step_number INTEGER,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    
    -- Dados da ação
    action_data JSONB DEFAULT '{}',
    
    -- Usuário responsável
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadados
    ip_address INET,
    user_agent TEXT
);

-- Tabela para comentários e comunicação
CREATE TABLE IF NOT EXISTS workflow_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    
    -- Autor
    author_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Conteúdo
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Comentário interno ou visível ao solicitante
    
    -- Anexos
    attachments JSONB DEFAULT '[]',
    
    -- Thread de resposta
    parent_comment_id UUID REFERENCES workflow_comments(id) ON DELETE CASCADE,
    
    -- Menções
    mentioned_users UUID[] DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para templates de workflow
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração do template
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Template schema
    template_schema JSONB NOT NULL,
    
    -- Configurações padrão
    default_settings JSONB DEFAULT '{}',
    
    -- Estatísticas de uso
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, name)
);

-- Tabela para regras de escalação
CREATE TABLE IF NOT EXISTS workflow_escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
    
    -- Configuração da escalação
    trigger_condition workflow_condition_type NOT NULL,
    trigger_value JSONB NOT NULL,
    
    -- Ação de escalação
    escalation_action VARCHAR(50) NOT NULL, -- notify_manager, reassign, auto_approve, etc.
    escalation_targets UUID[] DEFAULT '{}', -- Usuários para escalar
    
    -- Configurações
    delay_hours INTEGER DEFAULT 24,
    max_escalations INTEGER DEFAULT 3,
    escalation_message TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para métricas e analytics
CREATE TABLE IF NOT EXISTS workflow_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
    
    -- Métricas de tempo
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_duration_hours DECIMAL(10,2),
    business_hours_duration DECIMAL(10,2),
    
    -- Métricas de aprovação
    total_approvers INTEGER,
    approvals_received INTEGER,
    rejections_received INTEGER,
    average_response_time_hours DECIMAL(10,2),
    
    -- Métricas de etapas
    steps_completed INTEGER,
    steps_skipped INTEGER,
    escalations_triggered INTEGER,
    
    -- Dados de performance
    sla_met BOOLEAN,
    sla_target_hours INTEGER,
    delay_hours DECIMAL(10,2),
    
    -- Período de análise
    period_start DATE,
    period_end DATE,
    
    -- Auditoria
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_workflows_agency_id ON workflows(agency_id);
CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(type);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow_id ON workflow_instances(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_agency_id ON workflow_instances(agency_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_assigned ON workflow_instances USING gin(assigned_users);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_current_approvers ON workflow_instances USING gin(current_approvers);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_reference ON workflow_instances(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_number ON workflow_steps(workflow_id, step_number);

CREATE INDEX IF NOT EXISTS idx_workflow_approvals_instance_id ON workflow_approvals(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_approver_id ON workflow_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_action ON workflow_approvals(action);

CREATE INDEX IF NOT EXISTS idx_workflow_history_instance_id ON workflow_history(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_performed_by ON workflow_history(performed_by);
CREATE INDEX IF NOT EXISTS idx_workflow_history_date ON workflow_history(performed_at);

CREATE INDEX IF NOT EXISTS idx_workflow_comments_instance_id ON workflow_comments(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_author_id ON workflow_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_workflow_metrics_workflow_id ON workflow_metrics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_period ON workflow_metrics(period_start, period_end);

-- RLS (Row Level Security)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para workflows
CREATE POLICY "Users can view agency workflows"
    ON workflows FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = workflows.agency_id
        )
    );

CREATE POLICY "Workflow managers can manage workflows"
    ON workflows FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = workflows.agency_id
            AND up.role IN ('agency_owner', 'agency_manager', 'admin')
        )
    );

-- Políticas RLS para workflow instances
CREATE POLICY "Users can view relevant workflow instances"
    ON workflow_instances FOR SELECT
    USING (
        auth.uid() = created_by OR
        auth.uid() = ANY(assigned_users) OR
        auth.uid() = ANY(current_approvers) OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = workflow_instances.agency_id
            AND up.role IN ('agency_owner', 'agency_manager', 'admin')
        )
    );

CREATE POLICY "Users can create workflow instances"
    ON workflow_instances FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = workflow_instances.agency_id
        )
    );

-- Políticas RLS para approvals
CREATE POLICY "Approvers can manage their approvals"
    ON workflow_approvals FOR ALL
    USING (
        auth.uid() = approver_id OR
        EXISTS (
            SELECT 1 FROM workflow_instances wi
            JOIN user_profiles up ON up.id = auth.uid()
            WHERE wi.id = workflow_approvals.workflow_instance_id
            AND up.agency_id = wi.agency_id
            AND up.role IN ('agency_owner', 'agency_manager', 'admin')
        )
    );

-- Função para iniciar uma instância de workflow
CREATE OR REPLACE FUNCTION start_workflow_instance(
    p_workflow_id UUID,
    p_title VARCHAR(500),
    p_description TEXT DEFAULT NULL,
    p_reference_id VARCHAR(100) DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_context_data JSONB DEFAULT '{}',
    p_form_data JSONB DEFAULT '{}',
    p_priority VARCHAR(20) DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_instance_id UUID;
    v_workflow_record RECORD;
    v_first_step RECORD;
    v_user_profile RECORD;
BEGIN
    -- Obter perfil do usuário
    SELECT * INTO v_user_profile 
    FROM user_profiles 
    WHERE id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Obter workflow
    SELECT * INTO v_workflow_record 
    FROM workflows 
    WHERE id = p_workflow_id 
    AND agency_id = v_user_profile.agency_id
    AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Workflow não encontrado ou inativo';
    END IF;
    
    -- Obter primeira etapa
    SELECT * INTO v_first_step 
    FROM workflow_steps 
    WHERE workflow_id = p_workflow_id 
    ORDER BY step_number 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Workflow não possui etapas configuradas';
    END IF;
    
    -- Criar instância
    INSERT INTO workflow_instances (
        workflow_id,
        agency_id,
        title,
        description,
        reference_id,
        reference_type,
        context_data,
        form_data,
        priority,
        status,
        current_step,
        total_steps,
        started_at,
        due_date,
        created_by
    ) VALUES (
        p_workflow_id,
        v_user_profile.agency_id,
        p_title,
        p_description,
        p_reference_id,
        p_reference_type,
        p_context_data,
        p_form_data,
        p_priority,
        'in_progress',
        1,
        (SELECT COUNT(*) FROM workflow_steps WHERE workflow_id = p_workflow_id),
        NOW(),
        NOW() + (v_workflow_record.default_timeout_hours || ' hours')::INTERVAL,
        auth.uid()
    ) RETURNING id INTO v_instance_id;
    
    -- Registrar histórico
    INSERT INTO workflow_history (
        workflow_instance_id,
        action_type,
        action_description,
        step_number,
        new_status,
        performed_by
    ) VALUES (
        v_instance_id,
        'workflow_started',
        'Workflow iniciado: ' || p_title,
        1,
        'in_progress',
        auth.uid()
    );
    
    -- Atualizar contador do workflow
    UPDATE workflows 
    SET total_instances = total_instances + 1
    WHERE id = p_workflow_id;
    
    RETURN v_instance_id;
END;
$$;

-- Função para processar aprovação
CREATE OR REPLACE FUNCTION process_workflow_approval(
    p_instance_id UUID,
    p_step_id UUID,
    p_action workflow_action_type,
    p_decision VARCHAR(20),
    p_comments TEXT DEFAULT NULL,
    p_action_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_instance RECORD;
    v_step RECORD;
    v_approval_id UUID;
    v_total_approvals INTEGER;
    v_required_approvals INTEGER;
BEGIN
    -- Obter instância
    SELECT * INTO v_instance 
    FROM workflow_instances 
    WHERE id = p_instance_id;
    
    IF NOT FOUND OR v_instance.status NOT IN ('pending', 'in_progress') THEN
        RAISE EXCEPTION 'Instância de workflow não encontrada ou não está ativa';
    END IF;
    
    -- Verificar se usuário pode aprovar
    IF NOT (auth.uid() = ANY(v_instance.current_approvers)) THEN
        RAISE EXCEPTION 'Usuário não está autorizado a aprovar esta etapa';
    END IF;
    
    -- Obter etapa
    SELECT * INTO v_step 
    FROM workflow_steps 
    WHERE id = p_step_id;
    
    -- Registrar aprovação
    INSERT INTO workflow_approvals (
        workflow_instance_id,
        workflow_step_id,
        approver_id,
        action,
        decision,
        comments,
        action_data,
        response_time_hours
    ) VALUES (
        p_instance_id,
        p_step_id,
        auth.uid(),
        p_action,
        p_decision,
        p_comments,
        p_action_data,
        EXTRACT(EPOCH FROM (NOW() - v_instance.started_at)) / 3600
    ) RETURNING id INTO v_approval_id;
    
    -- Contar aprovações da etapa atual
    SELECT COUNT(*) INTO v_total_approvals
    FROM workflow_approvals 
    WHERE workflow_instance_id = p_instance_id 
    AND workflow_step_id = p_step_id
    AND decision = 'approved';
    
    v_required_approvals := COALESCE(v_step.required_approvals, 1);
    
    -- Verificar se etapa foi completada
    IF v_total_approvals >= v_required_approvals THEN
        -- Avançar para próxima etapa ou finalizar
        PERFORM advance_workflow_step(p_instance_id);
    END IF;
    
    -- Registrar histórico
    INSERT INTO workflow_history (
        workflow_instance_id,
        action_type,
        action_description,
        step_number,
        performed_by,
        action_data
    ) VALUES (
        p_instance_id,
        p_action::TEXT,
        COALESCE(p_comments, 'Ação: ' || p_decision),
        v_instance.current_step,
        auth.uid(),
        p_action_data
    );
    
    RETURN TRUE;
END;
$$;

-- Função para avançar etapa do workflow
CREATE OR REPLACE FUNCTION advance_workflow_step(p_instance_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_instance RECORD;
    v_next_step RECORD;
BEGIN
    -- Obter instância atual
    SELECT * INTO v_instance 
    FROM workflow_instances 
    WHERE id = p_instance_id;
    
    -- Verificar se há próxima etapa
    SELECT * INTO v_next_step 
    FROM workflow_steps 
    WHERE workflow_id = v_instance.workflow_id 
    AND step_number = v_instance.current_step + 1;
    
    IF FOUND THEN
        -- Avançar para próxima etapa
        UPDATE workflow_instances 
        SET 
            current_step = current_step + 1,
            progress_percentage = (current_step + 1) * 100.0 / total_steps,
            current_approvers = v_next_step.approver_users,
            updated_at = NOW()
        WHERE id = p_instance_id;
        
        -- Registrar histórico
        INSERT INTO workflow_history (
            workflow_instance_id,
            action_type,
            action_description,
            step_number,
            new_status
        ) VALUES (
            p_instance_id,
            'step_advanced',
            'Avançado para etapa: ' || v_next_step.name,
            v_instance.current_step + 1,
            'in_progress'
        );
    ELSE
        -- Finalizar workflow
        UPDATE workflow_instances 
        SET 
            status = 'approved',
            progress_percentage = 100,
            completed_at = NOW(),
            completed_by = auth.uid()
        WHERE id = p_instance_id;
        
        -- Atualizar estatísticas do workflow
        UPDATE workflows 
        SET 
            completed_instances = completed_instances + 1,
            average_completion_time_hours = (
                SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600)
                FROM workflow_instances 
                WHERE workflow_id = v_instance.workflow_id 
                AND status = 'approved'
            )
        WHERE id = v_instance.workflow_id;
        
        -- Registrar histórico
        INSERT INTO workflow_history (
            workflow_instance_id,
            action_type,
            action_description,
            new_status,
            performed_by
        ) VALUES (
            p_instance_id,
            'workflow_completed',
            'Workflow finalizado com sucesso',
            'approved',
            auth.uid()
        );
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Função para obter estatísticas de workflow
CREATE OR REPLACE FUNCTION get_workflow_stats(
    p_agency_id UUID,
    p_workflow_id UUID DEFAULT NULL,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_workflows BIGINT,
    active_workflows BIGINT,
    total_instances BIGINT,
    pending_instances BIGINT,
    in_progress_instances BIGINT,
    completed_instances BIGINT,
    average_completion_hours DECIMAL(10,2),
    completion_rate DECIMAL(5,2),
    instances_by_status JSONB,
    instances_by_type JSONB,
    daily_activity JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    v_start_date := NOW() - (p_days_back || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT w.id) as total_workflows,
        COUNT(DISTINCT w.id) FILTER (WHERE w.is_active = TRUE) as active_workflows,
        COUNT(wi.id) as total_instances,
        COUNT(wi.id) FILTER (WHERE wi.status = 'pending') as pending_instances,
        COUNT(wi.id) FILTER (WHERE wi.status = 'in_progress') as in_progress_instances,
        COUNT(wi.id) FILTER (WHERE wi.status IN ('approved', 'completed')) as completed_instances,
        AVG(EXTRACT(EPOCH FROM (wi.completed_at - wi.started_at)) / 3600) FILTER (WHERE wi.completed_at IS NOT NULL) as average_completion_hours,
        (COUNT(wi.id) FILTER (WHERE wi.status IN ('approved', 'completed')) * 100.0 / NULLIF(COUNT(wi.id), 0)) as completion_rate,
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'status', wi.status,
                'count', (SELECT COUNT(*) FROM workflow_instances wi2 WHERE wi2.agency_id = p_agency_id AND wi2.status = wi.status AND (p_workflow_id IS NULL OR wi2.workflow_id = p_workflow_id))
            )
        ) FILTER (WHERE wi.status IS NOT NULL) as instances_by_status,
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'type', w.type,
                'count', (SELECT COUNT(*) FROM workflow_instances wi3 JOIN workflows w3 ON w3.id = wi3.workflow_id WHERE w3.agency_id = p_agency_id AND w3.type = w.type AND (p_workflow_id IS NULL OR wi3.workflow_id = p_workflow_id))
            )
        ) FILTER (WHERE w.type IS NOT NULL) as instances_by_type,
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'date', DATE(wi.created_at),
                'created', (SELECT COUNT(*) FROM workflow_instances wi4 WHERE wi4.agency_id = p_agency_id AND DATE(wi4.created_at) = DATE(wi.created_at) AND (p_workflow_id IS NULL OR wi4.workflow_id = p_workflow_id)),
                'completed', (SELECT COUNT(*) FROM workflow_instances wi5 WHERE wi5.agency_id = p_agency_id AND DATE(wi5.completed_at) = DATE(wi.created_at) AND (p_workflow_id IS NULL OR wi5.workflow_id = p_workflow_id))
            )
        ) FILTER (WHERE wi.created_at >= v_start_date) as daily_activity
    FROM workflows w
    LEFT JOIN workflow_instances wi ON wi.workflow_id = w.id AND wi.created_at >= v_start_date
    WHERE w.agency_id = p_agency_id
    AND (p_workflow_id IS NULL OR w.id = p_workflow_id);
END;
$$;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_instances_updated_at
    BEFORE UPDATE ON workflow_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at
    BEFORE UPDATE ON workflow_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at
    BEFORE UPDATE ON workflow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_escalation_rules_updated_at
    BEFORE UPDATE ON workflow_escalation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_comments_updated_at
    BEFORE UPDATE ON workflow_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir templates padrão
INSERT INTO workflow_templates (id, name, description, category, template_schema, default_settings, is_public, is_featured) VALUES 
(gen_random_uuid(), 'Aprovação de Projeto', 'Template para aprovação de novos projetos', 'Projetos', 
'[
  {
    "step": 1,
    "name": "Revisão Inicial",
    "type": "approval",
    "approvers": ["project_manager"],
    "required_approvals": 1,
    "timeout_hours": 24
  },
  {
    "step": 2,
    "name": "Aprovação Gerencial",
    "type": "approval", 
    "approvers": ["agency_manager"],
    "required_approvals": 1,
    "timeout_hours": 48
  },
  {
    "step": 3,
    "name": "Aprovação Final",
    "type": "approval",
    "approvers": ["agency_owner"],
    "required_approvals": 1,
    "timeout_hours": 72
  }
]'::jsonb,
'{"auto_approve_threshold": 2, "notification_settings": {"email": true, "push": true}}'::jsonb,
true, true),

(gen_random_uuid(), 'Aprovação de Orçamento', 'Template para aprovação de orçamentos e propostas', 'Financeiro',
'[
  {
    "step": 1,
    "name": "Revisão Técnica",
    "type": "approval",
    "approvers": ["technical_lead"],
    "required_approvals": 1,
    "timeout_hours": 24
  },
  {
    "step": 2,
    "name": "Análise Financeira",
    "type": "approval",
    "approvers": ["financial_manager"],
    "required_approvals": 1,
    "timeout_hours": 48
  },
  {
    "step": 3,
    "name": "Aprovação Executiva",
    "type": "approval",
    "approvers": ["agency_owner"],
    "required_approvals": 1,
    "timeout_hours": 72
  }
]'::jsonb,
'{"auto_approve_threshold": 2, "escalation_timeout_hours": 168}'::jsonb,
true, true),

(gen_random_uuid(), 'Aprovação de Conteúdo', 'Template para aprovação de conteúdos e materiais', 'Conteúdo',
'[
  {
    "step": 1,
    "name": "Revisão Editorial",
    "type": "approval",
    "approvers": ["content_editor"],
    "required_approvals": 1,
    "timeout_hours": 24
  },
  {
    "step": 2,
    "name": "Aprovação Cliente",
    "type": "approval",
    "approvers": ["client_contact"],
    "required_approvals": 1,
    "timeout_hours": 120
  }
]'::jsonb,
'{"requires_all_approvers": true, "business_hours_only": true}'::jsonb,
true, true);

console.log('🚀 Sistema de Workflow Automatizado criado com sucesso!');