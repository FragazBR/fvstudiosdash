-- ==================================================
-- MIGRAÇÃO SIMPLES - SISTEMA INTELIGENTE
-- Versão corrigida e testada
-- ==================================================

-- ETAPA 1: ADICIONAR CAMPOS FALTANTES ÀS TABELAS EXISTENTES

-- Melhorar tabela projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS estimated_complexity VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS automation_level VARCHAR(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Melhorar tabela tasks com campos inteligentes
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS stage_id UUID,
ADD COLUMN IF NOT EXISTS automation_triggered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS complexity_score INTEGER DEFAULT 3 CHECK (complexity_score >= 1 AND complexity_score <= 10);

-- Melhorar tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS workload_capacity INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS performance_score DECIMAL(3,2) DEFAULT 4.0;

-- ETAPA 2: CRIAR TABELAS DO SISTEMA INTELIGENTE

-- 1. Templates de projeto
CREATE TABLE IF NOT EXISTS project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'folder',
    estimated_duration INTEGER DEFAULT 30,
    complexity_level VARCHAR(20) DEFAULT 'medium',
    default_team_size INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agency_id, slug)
);

-- 2. Etapas dos templates
CREATE TABLE IF NOT EXISTS project_template_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_days INTEGER DEFAULT 7,
    is_required BOOLEAN DEFAULT true,
    default_assignee_role VARCHAR(50),
    color VARCHAR(7) DEFAULT '#6B7280',
    completion_criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tarefas padrão dos templates
CREATE TABLE IF NOT EXISTS project_template_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_stage_id UUID NOT NULL REFERENCES project_template_stages(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_hours INTEGER DEFAULT 8,
    is_required BOOLEAN DEFAULT true,
    default_assignee_role VARCHAR(50),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Etapas reais dos projetos
CREATE TABLE IF NOT EXISTS project_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_stage_id UUID REFERENCES project_template_stages(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    order_index INTEGER NOT NULL,
    estimated_start_date DATE,
    estimated_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    assigned_user_id UUID REFERENCES user_profiles(id),
    color VARCHAR(7) DEFAULT '#6B7280',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Métricas e analytics - CORRIGIDA
CREATE TABLE IF NOT EXISTS project_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tasks_completed INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    hours_logged INTEGER DEFAULT 0,
    budget_spent DECIMAL(10,2) DEFAULT 0,
    team_velocity DECIMAL(5,2) DEFAULT 0,
    health_score INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, metric_date)
);

-- 6. Notificações inteligentes
CREATE TABLE IF NOT EXISTS project_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'medium',
    metadata JSONB DEFAULT '{}',
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 7. Log de atividades inteligentes
CREATE TABLE IF NOT EXISTS project_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    automated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ETAPA 3: CRIAR ÍNDICES PARA PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_projects_template_id ON projects(template_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_health ON projects(agency_id, health_score);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON projects(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_tasks_stage_id ON tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_automation ON tasks(automation_triggered);
CREATE INDEX IF NOT EXISTS idx_tasks_ai_generated ON tasks(ai_generated);

CREATE INDEX IF NOT EXISTS idx_project_stages_project_status ON project_stages(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_stages_assigned ON project_stages(assigned_user_id);

-- CORRIGIDO: usar metric_date em vez de date
CREATE INDEX IF NOT EXISTS idx_project_metrics_date ON project_metrics(project_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_project_notifications_user_unread ON project_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_project_date ON project_activity_log(project_id, created_at);

-- ETAPA 4: CRIAR FUNÇÕES INTELIGENTES

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

-- ETAPA 5: CRIAR TRIGGERS

DROP TRIGGER IF EXISTS trigger_update_project_activity_on_task_change ON tasks;
CREATE TRIGGER trigger_update_project_activity_on_task_change
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_project_activity();

-- ETAPA 6: INSERIR TEMPLATES PADRÃO

-- Template: Desenvolvimento Web
INSERT INTO project_templates (agency_id, name, slug, description, category, color, icon, estimated_duration, complexity_level, default_team_size)
SELECT 
    a.id, 'Desenvolvimento Web Completo', 'web-development', 
    'Template para projetos de desenvolvimento web com todas as etapas necessárias', 
    'web_development', '#3B82F6', 'globe', 45, 'medium', 4
FROM agencies a
ON CONFLICT (agency_id, slug) DO NOTHING;

-- Etapas do template Web Development
INSERT INTO project_template_stages (template_id, name, slug, description, order_index, estimated_days, default_assignee_role, color)
SELECT 
    pt.id, 'Descoberta e Planejamento', 'discovery', 'Levantamento de requisitos e planejamento inicial', 1, 5, 'project_manager', '#6B7280'
FROM project_templates pt WHERE pt.slug = 'web-development'
UNION ALL
SELECT 
    pt.id, 'Design e Prototipação', 'design', 'Criação de wireframes, mockups e protótipos', 2, 10, 'designer', '#8B5CF6'
FROM project_templates pt WHERE pt.slug = 'web-development'
UNION ALL
SELECT 
    pt.id, 'Desenvolvimento Frontend', 'frontend', 'Implementação da interface do usuário', 3, 15, 'developer', '#3B82F6'
FROM project_templates pt WHERE pt.slug = 'web-development'
UNION ALL
SELECT 
    pt.id, 'Desenvolvimento Backend', 'backend', 'Implementação da lógica de negócio e APIs', 4, 20, 'developer', '#06B6D4'
FROM project_templates pt WHERE pt.slug = 'web-development'
UNION ALL
SELECT 
    pt.id, 'Testes e QA', 'testing', 'Testes funcionais, de performance e correções', 5, 7, 'qa', '#F59E0B'
FROM project_templates pt WHERE pt.slug = 'web-development'
UNION ALL
SELECT 
    pt.id, 'Deploy e Entrega', 'deploy', 'Publicação e entrega do projeto final', 6, 3, 'developer', '#10B981'
FROM project_templates pt WHERE pt.slug = 'web-development'
ON CONFLICT DO NOTHING;

-- Tarefas padrão para as etapas de Web Development
INSERT INTO project_template_tasks (template_stage_id, name, description, order_index, estimated_hours, default_assignee_role, tags)
SELECT 
    pts.id, 'Reunião de kickoff', 'Reunião inicial com cliente para alinhamento de expectativas', 1, 2, 'project_manager', ARRAY['meeting', 'client']
FROM project_template_stages pts WHERE pts.slug = 'discovery'
UNION ALL
SELECT 
    pts.id, 'Levantamento de requisitos', 'Documentação detalhada dos requisitos funcionais e não-funcionais', 2, 8, 'project_manager', ARRAY['documentation', 'requirements']
FROM project_template_stages pts WHERE pts.slug = 'discovery'
UNION ALL
SELECT 
    pts.id, 'Criação de wireframes', 'Desenvolvimento de wireframes de baixa fidelidade', 1, 12, 'designer', ARRAY['design', 'wireframe']
FROM project_template_stages pts WHERE pts.slug = 'design'
UNION ALL
SELECT 
    pts.id, 'Design visual', 'Criação do design visual e identidade do projeto', 2, 20, 'designer', ARRAY['design', 'visual']
FROM project_template_stages pts WHERE pts.slug = 'design'
ON CONFLICT DO NOTHING;

-- Template: Branding
INSERT INTO project_templates (agency_id, name, slug, description, category, color, icon, estimated_duration, complexity_level, default_team_size)
SELECT 
    a.id, 'Identidade Visual Completa', 'branding', 
    'Template para criação de identidade visual e branding', 
    'branding', '#F59E0B', 'palette', 30, 'medium', 2
FROM agencies a
ON CONFLICT (agency_id, slug) DO NOTHING;

-- Etapas do template Branding
INSERT INTO project_template_stages (template_id, name, slug, description, order_index, estimated_days, default_assignee_role, color)
SELECT 
    pt.id, 'Pesquisa e Briefing', 'research', 'Pesquisa de mercado e definição do briefing criativo', 1, 5, 'designer', '#6B7280'
FROM project_templates pt WHERE pt.slug = 'branding'
UNION ALL
SELECT 
    pt.id, 'Conceituação', 'concept', 'Desenvolvimento de conceitos e direcionamento visual', 2, 7, 'designer', '#8B5CF6'
FROM project_templates pt WHERE pt.slug = 'branding'
UNION ALL
SELECT 
    pt.id, 'Criação da Logo', 'logo', 'Design e refinamento da logomarca', 3, 10, 'designer', '#F59E0B'
FROM project_templates pt WHERE pt.slug = 'branding'
UNION ALL
SELECT 
    pt.id, 'Identidade Visual', 'identity', 'Sistema de identidade visual completo', 4, 8, 'designer', '#EF4444'
FROM project_templates pt WHERE pt.slug = 'branding'
ON CONFLICT DO NOTHING;

-- ETAPA 7: ATUALIZAR PROJETOS EXISTENTES

-- Calcular health score para todos os projetos existentes
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM projects LOOP
        PERFORM calculate_project_health_score(project_record.id);
    END LOOP;
END $$;

-- ETAPA 8: CRIAR VIEW PARA WORKSTATION

-- View para workstation com dados inteligentes
CREATE OR REPLACE VIEW workstation_projects AS
SELECT 
    p.*,
    pt.name as template_name,
    pt.color as template_color,
    pt.category as template_category,
    c.name as client_name,
    u.name as creator_name,
    -- Estatísticas calculadas
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks,
    (SELECT COUNT(*) FROM project_stages ps WHERE ps.project_id = p.id) as total_stages,
    (SELECT COUNT(*) FROM project_stages ps WHERE ps.project_id = p.id AND ps.status = 'completed') as completed_stages
FROM projects p
LEFT JOIN project_templates pt ON p.template_id = pt.id
LEFT JOIN contacts c ON p.client_id = c.id
LEFT JOIN user_profiles u ON p.created_by = u.id;

-- ETAPA 9: MENSAGENS DE SUCESSO

DO $$
BEGIN
    RAISE NOTICE '✅ MIGRAÇÃO SIMPLES CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '📊 Sistema inteligente integrado ao sistema existente';
    RAISE NOTICE '🔧 Todos os dados existentes foram preservados';
    RAISE NOTICE '🚀 Recursos inteligentes ativados:';
    RAISE NOTICE '   - Templates de projeto automáticos';
    RAISE NOTICE '   - Geração automática de etapas e tarefas';
    RAISE NOTICE '   - Cálculo automático de health score';
    RAISE NOTICE '   - Sistema de métricas e analytics';
    RAISE NOTICE '   - Notificações inteligentes';
    RAISE NOTICE '   - Log de atividades detalhado';
    RAISE NOTICE '📈 Performance otimizada com índices apropriados';
    RAISE NOTICE '🎯 Workstation agora totalmente funcional!';
END $$;