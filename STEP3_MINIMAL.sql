-- ==================================================
-- ETAPA 3 MÍNIMA: CRIAR ÍNDICES E FUNÇÕES (SEM METRICS)
-- Execute após ETAPA 2 ser concluída
-- ==================================================

-- CRIAR ÍNDICES PARA PERFORMANCE (SEM project_metrics por enquanto)
CREATE INDEX IF NOT EXISTS idx_projects_template_id ON projects(template_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_health ON projects(agency_id, health_score);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON projects(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_tasks_stage_id ON tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_automation ON tasks(automation_triggered);
CREATE INDEX IF NOT EXISTS idx_tasks_ai_generated ON tasks(ai_generated);

CREATE INDEX IF NOT EXISTS idx_project_stages_project_status ON project_stages(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_stages_assigned ON project_stages(assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_project_notifications_user_unread ON project_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_project_date ON project_activity_log(project_id, created_at);

-- CRIAR FUNÇÕES INTELIGENTES

-- Função para calcular health score do projeto
CREATE OR REPLACE FUNCTION calculate_project_health_score(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_tasks INTEGER := 0;
    completed_tasks INTEGER := 0;
    overdue_tasks INTEGER := 0;
    days_since_activity INTEGER := 0;
    health_score INTEGER := 100;
BEGIN
    -- Contar tarefas
    SELECT COUNT(*) INTO total_tasks FROM tasks WHERE project_id = p_project_id;
    SELECT COUNT(*) INTO completed_tasks FROM tasks WHERE project_id = p_project_id AND status = 'completed';
    SELECT COUNT(*) INTO overdue_tasks FROM tasks WHERE project_id = p_project_id AND due_date < CURRENT_DATE AND status != 'completed';
    
    -- Calcular dias desde última atividade
    SELECT COALESCE(EXTRACT(DAYS FROM NOW() - last_activity_at), 0) INTO days_since_activity 
    FROM projects WHERE id = p_project_id;
    
    -- Calcular score
    IF total_tasks > 0 THEN
        health_score := 60 + (completed_tasks * 40 / total_tasks);
    END IF;
    
    -- Penalizar por tarefas atrasadas
    IF overdue_tasks > 0 THEN
        health_score := health_score - (overdue_tasks * 10);
    END IF;
    
    -- Penalizar por inatividade
    IF days_since_activity > 7 THEN
        health_score := health_score - (days_since_activity - 7) * 2;
    END IF;
    
    -- Garantir limites
    health_score := GREATEST(0, LEAST(100, health_score));
    
    -- Atualizar projeto
    UPDATE projects SET health_score = health_score, updated_at = NOW() WHERE id = p_project_id;
    
    RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar etapas automaticamente baseado no template
CREATE OR REPLACE FUNCTION generate_project_stages_from_template(p_project_id UUID, p_template_id UUID, p_start_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    stage_record RECORD;
    new_stage_id UUID;
    stage_date DATE := p_start_date;
    stages_created INTEGER := 0;
BEGIN
    -- Verificar se já existem etapas para este projeto
    IF EXISTS (SELECT 1 FROM project_stages WHERE project_id = p_project_id) THEN
        RETURN 0;
    END IF;
    
    -- Gerar etapas baseadas no template
    FOR stage_record IN 
        SELECT * FROM project_template_stages 
        WHERE template_id = p_template_id 
        ORDER BY order_index
    LOOP
        INSERT INTO project_stages (
            project_id, template_stage_id, name, slug, description,
            order_index, estimated_start_date, estimated_end_date, color
        ) VALUES (
            p_project_id, stage_record.id, stage_record.name, stage_record.slug,
            stage_record.description, stage_record.order_index, stage_date,
            stage_date + INTERVAL '1 day' * stage_record.estimated_days, stage_record.color
        ) RETURNING id INTO new_stage_id;
        
        -- Gerar tarefas para esta etapa
        INSERT INTO tasks (
            title, description, project_id, stage_id, status, estimated_hours, 
            ai_generated, automation_triggered, agency_id, created_by
        )
        SELECT 
            tt.name, tt.description, p_project_id, new_stage_id, 'todo', tt.estimated_hours,
            true, true, p.agency_id, p.created_by
        FROM project_template_tasks tt
        JOIN projects p ON p.id = p_project_id
        WHERE tt.template_stage_id = stage_record.id
        ORDER BY tt.order_index;
        
        stage_date := stage_date + INTERVAL '1 day' * stage_record.estimated_days;
        stages_created := stages_created + 1;
    END LOOP;
    
    -- Atualizar projeto com template_id
    UPDATE projects SET template_id = p_template_id, updated_at = NOW() WHERE id = p_project_id;
    
    RETURN stages_created;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar atividade do projeto
CREATE OR REPLACE FUNCTION update_project_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar last_activity_at do projeto relacionado
    IF TG_TABLE_NAME = 'tasks' THEN
        UPDATE projects 
        SET last_activity_at = NOW(), updated_at = NOW() 
        WHERE id = COALESCE(NEW.project_id, OLD.project_id);
        
        -- Recalcular health score
        PERFORM calculate_project_health_score(COALESCE(NEW.project_id, OLD.project_id));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- CRIAR TRIGGERS
DROP TRIGGER IF EXISTS trigger_update_project_activity_on_task_change ON tasks;
CREATE TRIGGER trigger_update_project_activity_on_task_change
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_project_activity();

-- Verificar se project_metrics existe e criar índice se necessário
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_metrics') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_metrics' AND column_name = 'metric_date') THEN
            CREATE INDEX IF NOT EXISTS idx_project_metrics_project_date ON project_metrics(project_id, metric_date);
            RAISE NOTICE '✅ Índice project_metrics criado com sucesso';
        ELSE
            RAISE NOTICE '⚠️ Coluna metric_date não encontrada em project_metrics';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela project_metrics não encontrada';
    END IF;
END $$;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ ETAPA 3 MÍNIMA CONCLUÍDA: Índices, funções e triggers criados!';
    RAISE NOTICE '📊 Sistema de automação ativado com sucesso!';
END $$;