-- ==================================================
-- FVStudios Dashboard - Sistema Inteligente de Projetos
-- Esquema de banco de dados otimizado para automação
-- ==================================================

-- 1. TEMPLATES DE PROJETO (Configurações automáticas)
CREATE TABLE IF NOT EXISTS project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'web_development', 'mobile_app', 'branding', 'marketing', 'consulting'
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'folder',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ETAPAS PADRÃO DOS TEMPLATES
CREATE TABLE IF NOT EXISTS project_template_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_days INTEGER DEFAULT 7,
    is_required BOOLEAN DEFAULT true,
    default_assignee_role VARCHAR(50), -- 'project_manager', 'developer', 'designer', 'qa'
    completion_criteria TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TAREFAS PADRÃO POR ETAPA
CREATE TABLE IF NOT EXISTS project_template_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES project_template_stages(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_hours INTEGER DEFAULT 8,
    is_required BOOLEAN DEFAULT true,
    default_assignee_role VARCHAR(50),
    tags TEXT[], -- ['frontend', 'backend', 'design', 'review']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. DEPENDÊNCIAS ENTRE ETAPAS
CREATE TABLE IF NOT EXISTS project_template_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
    prerequisite_stage_id UUID NOT NULL REFERENCES project_template_stages(id) ON DELETE CASCADE,
    dependent_stage_id UUID NOT NULL REFERENCES project_template_stages(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'finish_to_start', -- 'finish_to_start', 'start_to_start'
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ATUALIZAÇÃO DA TABELA PROJECTS (compatível com existente)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES project_templates(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS complexity VARCHAR(20) DEFAULT 'medium'; -- 'low', 'medium', 'high', 'enterprise'
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_completion_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_health VARCHAR(20) DEFAULT 'on_track'; -- 'on_track', 'at_risk', 'delayed'

-- 6. ETAPAS DO PROJETO (Instâncias das etapas template)
CREATE TABLE IF NOT EXISTS project_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_stage_id UUID REFERENCES project_template_stages(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked', 'cancelled'
    order_index INTEGER NOT NULL,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    estimated_start_date DATE,
    estimated_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    assigned_user_id UUID REFERENCES user_profiles(id),
    notes TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SISTEMA DE NOTIFICAÇÕES INTELIGENTES
CREATE TABLE IF NOT EXISTS project_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'stage_started', 'stage_completed', 'deadline_approaching', 'overdue'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    metadata JSONB, -- Additional data like stage_id, due_date, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 8. HISTÓRICO DE AÇÕES DO PROJETO
CREATE TABLE IF NOT EXISTS project_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'stage_changed', 'assigned', 'commented'
    entity_type VARCHAR(50) NOT NULL, -- 'project', 'stage', 'task'
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. CONFIGURAÇÕES DE INTEGRAÇÃO
CREATE TABLE IF NOT EXISTS project_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL, -- 'google_calendar', 'slack', 'github', 'figma'
    config JSONB NOT NULL, -- Integration-specific configuration
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. MÉTRICAS E ANALYTICS
CREATE TABLE IF NOT EXISTS project_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_stages INTEGER DEFAULT 0,
    completed_stages INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    total_hours_estimated INTEGER DEFAULT 0,
    total_hours_actual INTEGER DEFAULT 0,
    budget_used DECIMAL(15,2) DEFAULT 0,
    team_velocity DECIMAL(5,2) DEFAULT 0, -- Tasks completed per day
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, date)
);

-- ==================================================
-- ÍNDICES PARA PERFORMANCE OTIMIZADA
-- ==================================================

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_project_templates_active ON project_templates(is_active);

-- Índices para etapas template
CREATE INDEX IF NOT EXISTS idx_template_stages_template ON project_template_stages(template_id);
CREATE INDEX IF NOT EXISTS idx_template_stages_order ON project_template_stages(template_id, order_index);

-- Índices para etapas projeto
CREATE INDEX IF NOT EXISTS idx_project_stages_project ON project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_status ON project_stages(status);
CREATE INDEX IF NOT EXISTS idx_project_stages_assigned ON project_stages(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_dates ON project_stages(estimated_start_date, estimated_end_date);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user ON project_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON project_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON project_notifications(created_at DESC);

-- Índices para atividades
CREATE INDEX IF NOT EXISTS idx_activity_project ON project_activity_log(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON project_activity_log(user_id, created_at DESC);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_metrics_project_date ON project_metrics(project_id, date DESC);

-- ==================================================
-- FUNÇÕES STORED PROCEDURES PARA AUTOMAÇÃO
-- ==================================================

-- Função para calcular progresso automático do projeto
CREATE OR REPLACE FUNCTION calculate_project_progress(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_stages INTEGER;
    completed_stages INTEGER;
    progress_percentage INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed')
    INTO total_stages, completed_stages
    FROM project_stages 
    WHERE project_id = p_project_id;
    
    IF total_stages = 0 THEN
        RETURN 0;
    END IF;
    
    progress_percentage := ROUND((completed_stages::DECIMAL / total_stages) * 100);
    
    -- Atualizar o progresso do projeto
    UPDATE projects 
    SET progress = progress_percentage, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar etapas automáticas baseadas no template
CREATE OR REPLACE FUNCTION generate_project_stages(p_project_id UUID, p_template_id UUID, p_start_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
DECLARE
    stage_record RECORD;
    new_stage_id UUID;
    current_date DATE := p_start_date;
BEGIN
    -- Percorrer etapas do template em ordem
    FOR stage_record IN 
        SELECT * FROM project_template_stages 
        WHERE template_id = p_template_id 
        ORDER BY order_index
    LOOP
        -- Criar nova etapa do projeto
        INSERT INTO project_stages (
            project_id,
            template_stage_id,
            name,
            slug,
            description,
            order_index,
            estimated_start_date,
            estimated_end_date,
            color
        ) VALUES (
            p_project_id,
            stage_record.id,
            stage_record.name,
            stage_record.slug,
            stage_record.description,
            stage_record.order_index,
            current_date,
            current_date + INTERVAL '1 day' * stage_record.estimated_days,
            stage_record.color
        ) RETURNING id INTO new_stage_id;
        
        -- Atualizar data para próxima etapa
        current_date := current_date + INTERVAL '1 day' * stage_record.estimated_days;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar progresso quando etapa muda status
CREATE OR REPLACE FUNCTION trigger_update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_project_progress(NEW.project_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_progress_on_stage_change
    AFTER UPDATE OF status ON project_stages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_project_progress();

-- ==================================================
-- DADOS INICIAIS - TEMPLATES PADRÃO
-- ==================================================

-- Template: Desenvolvimento Web
INSERT INTO project_templates (name, slug, category, description, color, icon) VALUES
('Desenvolvimento Web Completo', 'web-development-full', 'web_development', 'Template completo para projetos de desenvolvimento web', '#3B82F6', 'globe');

INSERT INTO project_template_stages (template_id, name, slug, order_index, estimated_days, default_assignee_role, color) VALUES
((SELECT id FROM project_templates WHERE slug = 'web-development-full'), 'Discovery & Planejamento', 'discovery', 1, 5, 'project_manager', '#8B5CF6'),
((SELECT id FROM project_templates WHERE slug = 'web-development-full'), 'UI/UX Design', 'design', 2, 10, 'designer', '#EC4899'),
((SELECT id FROM project_templates WHERE slug = 'web-development-full'), 'Desenvolvimento Frontend', 'frontend-dev', 3, 15, 'developer', '#10B981'),
((SELECT id FROM project_templates WHERE slug = 'web-development-full'), 'Desenvolvimento Backend', 'backend-dev', 4, 12, 'developer', '#F59E0B'),
((SELECT id FROM project_templates WHERE slug = 'web-development-full'), 'Integração & Testes', 'integration-qa', 5, 8, 'qa', '#EF4444'),
((SELECT id FROM project_templates WHERE slug = 'web-development-full'), 'Deploy & Entrega', 'deploy', 6, 3, 'developer', '#6B7280');

-- Template: Branding
INSERT INTO project_templates (name, slug, category, description, color, icon) VALUES
('Projeto de Branding', 'branding-complete', 'branding', 'Template para projetos de identidade visual e branding', '#EC4899', 'palette');

INSERT INTO project_template_stages (template_id, name, slug, order_index, estimated_days, default_assignee_role, color) VALUES
((SELECT id FROM project_templates WHERE slug = 'branding-complete'), 'Briefing & Pesquisa', 'briefing', 1, 3, 'project_manager', '#8B5CF6'),
((SELECT id FROM project_templates WHERE slug = 'branding-complete'), 'Conceito & Estratégia', 'concept', 2, 5, 'designer', '#3B82F6'),
((SELECT id FROM project_templates WHERE slug = 'branding-complete'), 'Criação da Logo', 'logo-design', 3, 8, 'designer', '#EC4899'),
((SELECT id FROM project_templates WHERE slug = 'branding-complete'), 'Manual da Marca', 'brand-manual', 4, 7, 'designer', '#10B981'),
((SELECT id FROM project_templates WHERE slug = 'branding-complete'), 'Aplicações & Mockups', 'applications', 5, 5, 'designer', '#F59E0B'),
((SELECT id FROM project_templates WHERE slug = 'branding-complete'), 'Entrega Final', 'delivery', 6, 2, 'project_manager', '#6B7280');

-- Template: Marketing Digital
INSERT INTO project_templates (name, slug, category, description, color, icon) VALUES
('Campanha de Marketing Digital', 'digital-marketing', 'marketing', 'Template para campanhas de marketing digital', '#F59E0B', 'megaphone');

INSERT INTO project_template_stages (template_id, name, slug, order_index, estimated_days, default_assignee_role, color) VALUES
((SELECT id FROM project_templates WHERE slug = 'digital-marketing'), 'Planejamento Estratégico', 'strategy', 1, 4, 'project_manager', '#8B5CF6'),
((SELECT id FROM project_templates WHERE slug = 'digital-marketing'), 'Criação de Conteúdo', 'content-creation', 2, 10, 'designer', '#EC4899'),
((SELECT id FROM project_templates WHERE slug = 'digital-marketing'), 'Setup de Campanhas', 'campaign-setup', 3, 5, 'marketing_specialist', '#3B82F6'),
((SELECT id FROM project_templates WHERE slug = 'digital-marketing'), 'Lançamento & Monitoramento', 'launch', 4, 15, 'marketing_specialist', '#10B981'),
((SELECT id FROM project_templates WHERE slug = 'digital-marketing'), 'Otimização & Ajustes', 'optimization', 5, 10, 'marketing_specialist', '#F59E0B'),
((SELECT id FROM project_templates WHERE slug = 'digital-marketing'), 'Relatório & Análise', 'reporting', 6, 3, 'project_manager', '#6B7280');

COMMENT ON TABLE project_templates IS 'Templates configuráveis para automação de projetos';
COMMENT ON TABLE project_stages IS 'Instâncias de etapas geradas automaticamente baseadas nos templates';
COMMENT ON FUNCTION generate_project_stages IS 'Gera automaticamente todas as etapas de um projeto baseado no template escolhido';
COMMENT ON FUNCTION calculate_project_progress IS 'Calcula automaticamente o progresso do projeto baseado no status das etapas';