-- ==================================================
-- ETAPA 4: INSERIR TEMPLATES E DADOS INICIAIS
-- Execute após ETAPA 3 ser concluída
-- ==================================================

-- INSERIR TEMPLATES PADRÃO

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

-- ATUALIZAR PROJETOS EXISTENTES
-- Calcular health score para todos os projetos existentes
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM projects LOOP
        PERFORM calculate_project_health_score(project_record.id);
    END LOOP;
END $$;

-- CRIAR VIEW PARA WORKSTATION
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

-- Mensagens de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ ETAPA 4 CONCLUÍDA: Templates e dados iniciais inseridos';
    RAISE NOTICE '🚀 SISTEMA INTELIGENTE TOTALMENTE ATIVADO!';
    RAISE NOTICE '📊 Sistema inteligente integrado ao sistema existente';
    RAISE NOTICE '🔧 Todos os dados existentes foram preservados';
    RAISE NOTICE '🎯 Workstation agora totalmente funcional!';
    RAISE NOTICE '📈 Templates disponíveis: Web Development, Branding';
    RAISE NOTICE '⚡ Automação ativada: health score, etapas automáticas';
END $$;