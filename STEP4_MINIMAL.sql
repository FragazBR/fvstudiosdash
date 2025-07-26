-- ==================================================
-- ETAPA 4 MÍNIMA: INSERIR TEMPLATES BÁSICOS
-- Usando apenas colunas que existem na tabela
-- ==================================================

-- INSERIR TEMPLATES BÁSICOS (apenas colunas essenciais)

-- Template: Desenvolvimento Web
INSERT INTO project_templates (name, slug, description, category, color, icon, is_active)
VALUES (
    'Desenvolvimento Web Completo', 'web-development', 
    'Template para projetos de desenvolvimento web com todas as etapas necessárias', 
    'web_development', '#3B82F6', 'globe', true
)
ON CONFLICT (slug) DO NOTHING;

-- Template: Branding
INSERT INTO project_templates (name, slug, description, category, color, icon, is_active)
VALUES (
    'Identidade Visual Completa', 'branding', 
    'Template para criação de identidade visual e branding', 
    'branding', '#F59E0B', 'palette', true
)
ON CONFLICT (slug) DO NOTHING;

-- Template: Marketing Digital
INSERT INTO project_templates (name, slug, description, category, color, icon, is_active)
VALUES (
    'Campanha de Marketing Digital', 'marketing-digital', 
    'Template para campanhas de marketing digital completas', 
    'marketing', '#EC4899', 'megaphone', true
)
ON CONFLICT (slug) DO NOTHING;

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
FROM project_templates pt WHERE pt.slug = 'web-development';

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
FROM project_templates pt WHERE pt.slug = 'branding';

-- Etapas do template Marketing Digital
INSERT INTO project_template_stages (template_id, name, slug, description, order_index, estimated_days, default_assignee_role, color)
SELECT 
    pt.id, 'Estratégia e Planejamento', 'strategy', 'Definição de objetivos, público-alvo e estratégias', 1, 7, 'project_manager', '#6B7280'
FROM project_templates pt WHERE pt.slug = 'marketing-digital'
UNION ALL
SELECT 
    pt.id, 'Criação de Conteúdo', 'content', 'Produção de textos, imagens e vídeos', 2, 10, 'designer', '#8B5CF6'
FROM project_templates pt WHERE pt.slug = 'marketing-digital'
UNION ALL
SELECT 
    pt.id, 'Configuração de Campanhas', 'setup', 'Setup das campanhas nas plataformas digitais', 3, 5, 'marketing_specialist', '#3B82F6'
FROM project_templates pt WHERE pt.slug = 'marketing-digital'
UNION ALL
SELECT 
    pt.id, 'Lançamento', 'launch', 'Ativação das campanhas e acompanhamento', 4, 13, 'marketing_specialist', '#10B981'
FROM project_templates pt WHERE pt.slug = 'marketing-digital';

-- Algumas tarefas básicas para os templates
INSERT INTO project_template_tasks (template_stage_id, name, description, order_index, estimated_hours, default_assignee_role, tags)
SELECT 
    pts.id, 'Reunião de kickoff', 'Reunião inicial com cliente para alinhamento', 1, 2, 'project_manager', ARRAY['meeting', 'client']
FROM project_template_stages pts WHERE pts.slug = 'discovery'
UNION ALL
SELECT 
    pts.id, 'Levantamento de requisitos', 'Documentação dos requisitos do projeto', 2, 8, 'project_manager', ARRAY['documentation']
FROM project_template_stages pts WHERE pts.slug = 'discovery'
UNION ALL
SELECT 
    pts.id, 'Briefing com cliente', 'Reunião para entender objetivos da marca', 1, 3, 'designer', ARRAY['meeting', 'briefing']
FROM project_template_stages pts WHERE pts.slug = 'research'
UNION ALL
SELECT 
    pts.id, 'Definição de estratégia', 'Planejamento estratégico da campanha', 1, 6, 'project_manager', ARRAY['strategy', 'planning']
FROM project_template_stages pts WHERE pts.slug = 'strategy';

-- ATUALIZAR PROJETOS EXISTENTES
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM projects LOOP
        PERFORM calculate_project_health_score(project_record.id);
    END LOOP;
    RAISE NOTICE '✅ Health score calculado para todos os projetos existentes';
END $$;

-- CRIAR VIEW SIMPLIFICADA PARA WORKSTATION
CREATE OR REPLACE VIEW workstation_projects AS
SELECT 
    p.*,
    pt.name as template_name,
    pt.color as template_color,
    pt.category as template_category,
    c.name as client_name,
    u.name as creator_name,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
FROM projects p
LEFT JOIN project_templates pt ON p.template_id = pt.id
LEFT JOIN contacts c ON p.client_id = c.id
LEFT JOIN user_profiles u ON p.created_by = u.id;

-- Mensagens de sucesso
DO $$
BEGIN
    RAISE NOTICE '🎉 SISTEMA INTELIGENTE ATIVADO COM SUCESSO!';
    RAISE NOTICE '📊 Templates criados:';
    RAISE NOTICE '   ✅ Desenvolvimento Web (6 etapas)';
    RAISE NOTICE '   ✅ Branding (4 etapas)';  
    RAISE NOTICE '   ✅ Marketing Digital (4 etapas)';
    RAISE NOTICE '🚀 Automação ativada: health score automático';
    RAISE NOTICE '🎯 View workstation_projects criada';
    RAISE NOTICE '💡 Pronto para usar! Acesse /workstation para testar';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Para usar templates em novos projetos:';
    RAISE NOTICE '   SELECT * FROM generate_project_stages_from_template(projeto_id, template_id);';
END $$;