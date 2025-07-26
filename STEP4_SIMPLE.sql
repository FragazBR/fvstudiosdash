-- ==================================================
-- ETAPA 4 SIMPLES: APENAS TEMPLATES E VIEW
-- Sem executar funções problemáticas
-- ==================================================

-- INSERIR TEMPLATES BÁSICOS

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

-- CRIAR VIEW PARA WORKSTATION (APENAS COLUNAS QUE EXISTEM)
CREATE OR REPLACE VIEW workstation_projects AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    p.health_score,
    p.created_at,
    p.updated_at,
    p.due_date,
    p.client_id,
    p.agency_id,
    p.created_by,
    p.template_id,
    pt.name as template_name,
    pt.color as template_color,
    pt.category as template_category,
    c.name as client_name,
    u.name as creator_name,
    -- Estatísticas calculadas
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks,
    (SELECT COUNT(*) FROM project_stages ps WHERE ps.project_id = p.id) as total_stages,
    (SELECT COUNT(*) FROM project_stages ps WHERE ps.project_id = p.id AND ps.status = 'completed') as completed_stages,
    -- Progresso calculado baseado em etapas
    CASE 
        WHEN (SELECT COUNT(*) FROM project_stages ps WHERE ps.project_id = p.id) = 0 THEN 0
        ELSE ROUND(
            (SELECT COUNT(*) FROM project_stages ps WHERE ps.project_id = p.id AND ps.status = 'completed') * 100.0 / 
            (SELECT COUNT(*) FROM project_stages ps WHERE ps.project_id = p.id)
        )
    END as calculated_progress
FROM projects p
LEFT JOIN project_templates pt ON p.template_id = pt.id
LEFT JOIN contacts c ON p.client_id = c.id
LEFT JOIN user_profiles u ON p.created_by = u.id;

-- Verificar o que foi criado
DO $$
DECLARE
    template_count INTEGER;
    stage_count INTEGER;
    task_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM project_templates;
    SELECT COUNT(*) INTO stage_count FROM project_template_stages;
    SELECT COUNT(*) INTO task_count FROM project_template_tasks;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TEMPLATES CRIADOS COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMO DA CRIAÇÃO:';
    RAISE NOTICE '   ✅ Templates: % (Web, Branding, Marketing)', template_count;
    RAISE NOTICE '   ✅ Etapas: % (distribuídas nos templates)', stage_count;
    RAISE NOTICE '   ✅ Tarefas: % (exemplos básicos)', task_count;
    RAISE NOTICE '   ✅ View workstation_projects criada e otimizada';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 SISTEMA INTELIGENTE ATIVO!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Acesse /workstation para testar a interface';
    RAISE NOTICE '   2. Use: SELECT * FROM project_templates; para ver templates';
    RAISE NOTICE '   3. Use: SELECT * FROM workstation_projects; para ver projetos';
    RAISE NOTICE '   4. Função disponível: generate_project_stages_from_template()';
    RAISE NOTICE '';
    RAISE NOTICE '🎊 PRONTO PARA USAR! 🎊';
END $$;