-- ==================================================
-- EXECUTAR ESTE SQL PARA ATIVAR O SISTEMA INTELIGENTE
-- Sistema completo de templates e automação de projetos
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
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ETAPAS DOS PROJETOS (Geradas automaticamente)
CREATE TABLE IF NOT EXISTS project_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    template_stage_id UUID REFERENCES project_template_stages(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked', 'cancelled'
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    order_index INTEGER NOT NULL,
    estimated_start_date DATE,
    estimated_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    assigned_user_id UUID REFERENCES user_profiles(id),
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. NOTIFICAÇÕES DE PROJETO
CREATE TABLE IF NOT EXISTS project_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'stage_started', 'stage_completed', 'deadline_approaching', 'overdue', 'assigned', 'comment', 'file_uploaded', 'status_changed'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 5. LOG DE ATIVIDADES
CREATE TABLE IF NOT EXISTS project_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', 'assigned', 'comment_added'
    entity_type VARCHAR(50) NOT NULL, -- 'project', 'stage', 'task', 'comment', 'file'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- ÍNDICES PARA PERFORMANCE
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_project_stages_project_id ON project_stages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stages_status ON project_stages(status);
CREATE INDEX IF NOT EXISTS idx_project_stages_assigned_user ON project_stages(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_project_notifications_user_id ON project_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_project_notifications_is_read ON project_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_project_id ON project_activity_log(project_id);

-- ==================================================
-- STORED PROCEDURES PARA AUTOMAÇÃO
-- ==================================================

-- Função para gerar etapas automaticamente baseado no template
CREATE OR REPLACE FUNCTION generate_project_stages(p_project_id UUID, p_template_id UUID, p_start_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
DECLARE
    stage_record RECORD;
    new_stage_id UUID;
    stage_date DATE := p_start_date;
BEGIN
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
        
        stage_date := stage_date + INTERVAL '1 day' * stage_record.estimated_days;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular progresso do projeto
CREATE OR REPLACE FUNCTION calculate_project_progress(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_stages INTEGER;
    completed_stages INTEGER;
    progress_percentage INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_stages 
    FROM project_stages 
    WHERE project_id = p_project_id;
    
    SELECT COUNT(*) INTO completed_stages 
    FROM project_stages 
    WHERE project_id = p_project_id AND status = 'completed';
    
    IF total_stages > 0 THEN
        progress_percentage := ROUND((completed_stages::DECIMAL / total_stages::DECIMAL) * 100);
    ELSE
        progress_percentage := 0;
    END IF;
    
    -- Atualizar progresso no projeto
    UPDATE projects 
    SET progress = progress_percentage, updated_at = NOW() 
    WHERE id = p_project_id;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- TEMPLATES PADRÃO (DADOS INICIAIS)
-- ==================================================

-- Template: Desenvolvimento Web
INSERT INTO project_templates (name, slug, description, category, color, icon) VALUES
('Desenvolvimento Web Completo', 'web-development', 'Template para projetos de desenvolvimento web com todas as etapas necessárias', 'web_development', '#3B82F6', 'globe')
ON CONFLICT (slug) DO NOTHING;

-- Template: Aplicativo Mobile
INSERT INTO project_templates (name, slug, description, category, color, icon) VALUES
('Aplicativo Mobile', 'mobile-app', 'Template para desenvolvimento de aplicativos móveis iOS e Android', 'mobile_app', '#10B981', 'smartphone')
ON CONFLICT (slug) DO NOTHING;

-- Template: Identidade Visual
INSERT INTO project_templates (name, slug, description, category, color, icon) VALUES
('Identidade Visual Completa', 'branding', 'Template para criação de identidade visual e branding', 'branding', '#F59E0B', 'palette')
ON CONFLICT (slug) DO NOTHING;

-- Template: Campanha de Marketing
INSERT INTO project_templates (name, slug, description, category, color, icon) VALUES
('Campanha de Marketing Digital', 'marketing-campaign', 'Template para campanhas de marketing digital integradas', 'marketing', '#EF4444', 'megaphone')
ON CONFLICT (slug) DO NOTHING;

-- ==================================================
-- ETAPAS DOS TEMPLATES
-- ==================================================

-- Etapas para Desenvolvimento Web
INSERT INTO project_template_stages (template_id, name, slug, description, order_index, estimated_days, default_assignee_role, color) VALUES
((SELECT id FROM project_templates WHERE slug = 'web-development'), 'Descoberta e Planejamento', 'discovery', 'Levantamento de requisitos e planejamento inicial', 1, 5, 'project_manager', '#6B7280'),
((SELECT id FROM project_templates WHERE slug = 'web-development'), 'Design e Prototipação', 'design', 'Criação de wireframes, mockups e protótipos', 2, 10, 'designer', '#8B5CF6'),
((SELECT id FROM project_templates WHERE slug = 'web-development'), 'Desenvolvimento Frontend', 'frontend', 'Implementação da interface do usuário', 3, 15, 'developer', '#3B82F6'),
((SELECT id FROM project_templates WHERE slug = 'web-development'), 'Desenvolvimento Backend', 'backend', 'Implementação da lógica de negócio e APIs', 4, 20, 'developer', '#06B6D4'),
((SELECT id FROM project_templates WHERE slug = 'web-development'), 'Testes e QA', 'testing', 'Testes funcionais, de performance e correções', 5, 7, 'qa', '#F59E0B'),
((SELECT id FROM project_templates WHERE slug = 'web-development'), 'Deploy e Entrega', 'deploy', 'Publicação e entrega do projeto final', 6, 3, 'developer', '#10B981');

-- Etapas para Mobile App
INSERT INTO project_template_stages (template_id, name, slug, description, order_index, estimated_days, default_assignee_role, color) VALUES
((SELECT id FROM project_templates WHERE slug = 'mobile-app'), 'Análise e Requisitos', 'analysis', 'Definição de funcionalidades e requisitos técnicos', 1, 7, 'project_manager', '#6B7280'),
((SELECT id FROM project_templates WHERE slug = 'mobile-app'), 'UX/UI Design', 'design', 'Design da experiência e interface do usuário', 2, 12, 'designer', '#8B5CF6'),
((SELECT id FROM project_templates WHERE slug = 'mobile-app'), 'Desenvolvimento iOS', 'ios-dev', 'Desenvolvimento nativo ou híbrido para iOS', 3, 25, 'developer', '#000000'),
((SELECT id FROM project_templates WHERE slug = 'mobile-app'), 'Desenvolvimento Android', 'android-dev', 'Desenvolvimento nativo ou híbrido para Android', 4, 25, 'developer', '#A4C639'),
((SELECT id FROM project_templates WHERE slug = 'mobile-app'), 'Testes e Otimização', 'testing', 'Testes em dispositivos e otimização de performance', 5, 10, 'qa', '#F59E0B'),
((SELECT id FROM project_templates WHERE slug = 'mobile-app'), 'Publicação nas Stores', 'publish', 'Submissão para App Store e Google Play', 6, 5, 'project_manager', '#10B981');

-- Etapas para Branding
INSERT INTO project_template_stages (template_id, name, slug, description, order_index, estimated_days, default_assignee_role, color) VALUES
((SELECT id FROM project_templates WHERE slug = 'branding'), 'Pesquisa e Briefing', 'research', 'Pesquisa de mercado e definição do briefing criativo', 1, 5, 'designer', '#6B7280'),
((SELECT id FROM project_templates WHERE slug = 'branding'), 'Conceituação', 'concept', 'Desenvolvimento de conceitos e direcionamento visual', 2, 7, 'designer', '#8B5CF6'),
((SELECT id FROM project_templates WHERE slug = 'branding'), 'Criação da Logo', 'logo', 'Design e refinamento da logomarca', 3, 10, 'designer', '#F59E0B'),
((SELECT id FROM project_templates WHERE slug = 'branding'), 'Identidade Visual', 'identity', 'Desenvolvimento do sistema de identidade visual', 4, 12, 'designer', '#EF4444'),
((SELECT id FROM project_templates WHERE slug = 'branding'), 'Manual da Marca', 'manual', 'Criação do guia de aplicação da marca', 5, 5, 'designer', '#3B82F6'),
((SELECT id FROM project_templates WHERE slug = 'branding'), 'Entrega Final', 'delivery', 'Preparação e entrega de todos os arquivos', 6, 3, 'project_manager', '#10B981');

-- Etapas para Marketing
INSERT INTO project_template_stages (template_id, name, slug, description, order_index, estimated_days, default_assignee_role, color) VALUES
((SELECT id FROM project_templates WHERE slug = 'marketing-campaign'), 'Estratégia e Planejamento', 'strategy', 'Definição de objetivos, público-alvo e estratégias', 1, 7, 'project_manager', '#6B7280'),
((SELECT id FROM project_templates WHERE slug = 'marketing-campaign'), 'Criação de Conteúdo', 'content', 'Produção de textos, imagens e vídeos', 2, 10, 'designer', '#8B5CF6'),
((SELECT id FROM project_templates WHERE slug = 'marketing-campaign'), 'Configuração de Campanhas', 'setup', 'Setup das campanhas nas plataformas digitais', 3, 5, 'developer', '#3B82F6'),
((SELECT id FROM project_templates WHERE slug = 'marketing-campaign'), 'Lançamento', 'launch', 'Ativação das campanhas e monitoramento inicial', 4, 3, 'project_manager', '#F59E0B'),
((SELECT id FROM project_templates WHERE slug = 'marketing-campaign'), 'Otimização', 'optimization', 'Análise de resultados e otimizações', 5, 15, 'project_manager', '#EF4444'),
((SELECT id FROM project_templates WHERE slug = 'marketing-campaign'), 'Relatório Final', 'report', 'Compilação de resultados e relatório de performance', 6, 5, 'project_manager', '#10B981');

-- ==================================================
-- MENSAGEM DE SUCESSO
-- ==================================================

DO $$
BEGIN
    RAISE NOTICE '🚀 SISTEMA INTELIGENTE DE PROJETOS ATIVADO COM SUCESSO!';
    RAISE NOTICE '✅ Templates criados: 4 (Web, Mobile, Branding, Marketing)';
    RAISE NOTICE '✅ Etapas automáticas: 24 etapas distribuídas nos templates';
    RAISE NOTICE '✅ Stored procedures: generate_project_stages() e calculate_project_progress()';
    RAISE NOTICE '✅ Tabelas criadas: project_templates, project_stages, project_notifications';
    RAISE NOTICE '📋 Próximo passo: Usar o wizard inteligente em /workstation';
END $$;