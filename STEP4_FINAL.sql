-- ==================================================
-- ETAPA 4 FINAL: INSERIR TEMPLATES E CONCLUIR INTEGRAÇÃO
-- Versão corrigida sem conflitos de nomes
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

-- CORRIGIR FUNÇÃO HEALTH SCORE (resolver ambiguidade)
CREATE OR REPLACE FUNCTION calculate_project_health_score(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_tasks INTEGER := 0;
    completed_tasks INTEGER := 0;
    overdue_tasks INTEGER := 0;
    days_since_activity INTEGER := 0;
    calculated_health_score INTEGER := 100;  -- Renomeado para evitar conflito
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
        calculated_health_score := 60 + (completed_tasks * 40 / total_tasks);
    END IF;
    
    -- Penalizar por tarefas atrasadas
    IF overdue_tasks > 0 THEN
        calculated_health_score := calculated_health_score - (overdue_tasks * 10);
    END IF;
    
    -- Penalizar por inatividade
    IF days_since_activity > 7 THEN
        calculated_health_score := calculated_health_score - (days_since_activity - 7) * 2;
    END IF;
    
    -- Garantir limites
    calculated_health_score := GREATEST(0, LEAST(100, calculated_health_score));
    
    -- Atualizar projeto (usando nome qualificado da coluna)
    UPDATE projects SET health_score = calculated_health_score, updated_at = NOW() WHERE id = p_project_id;
    
    RETURN calculated_health_score;
END;
$$ LANGUAGE plpgsql;

-- ATUALIZAR PROJETOS EXISTENTES (versão mais segura)
DO $$
DECLARE
    project_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    FOR project_record IN SELECT id FROM projects LIMIT 10 LOOP  -- Limitar para evitar timeout
        PERFORM calculate_project_health_score(project_record.id);
        updated_count := updated_count + 1;
    END LOOP;
    RAISE NOTICE '✅ Health score calculado para % projetos', updated_count;
END $$;

-- CRIAR VIEW SIMPLIFICADA PARA WORKSTATION
CREATE OR REPLACE VIEW workstation_projects AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    p.progress,
    p.health_score,
    p.created_at,
    p.updated_at,
    p.due_date,
    p.client_id,
    p.agency_id,
    p.created_by,
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
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉 SISTEMA INTELIGENTE TOTALMENTE ATIVADO! 🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ MIGRAÇÃO COMPLETA EM 4 ETAPAS CONCLUÍDA:';
    RAISE NOTICE '   📋 ETAPA 1: Campos adicionados às tabelas existentes';  
    RAISE NOTICE '   🏗️  ETAPA 2: Tabelas do sistema inteligente criadas';
    RAISE NOTICE '   ⚡ ETAPA 3: Índices, funções e triggers ativados';
    RAISE NOTICE '   🎯 ETAPA 4: Templates e dados inseridos';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 RECURSOS ATIVADOS:';
    RAISE NOTICE '   ✅ 3 Templates prontos (Web, Branding, Marketing)';
    RAISE NOTICE '   ✅ 14 Etapas automáticas configuradas';
    RAISE NOTICE '   ✅ Health score automático para projetos';
    RAISE NOTICE '   ✅ View workstation_projects otimizada';
    RAISE NOTICE '   ✅ Funções de automação ativas';
    RAISE NOTICE '';
    RAISE NOTICE '💡 COMO USAR:';
    RAISE NOTICE '   🎯 Acesse /workstation para ver a interface';
    RAISE NOTICE '   📊 Para gerar etapas: SELECT generate_project_stages_from_template(projeto_id, template_id);';
    RAISE NOTICE '   🔍 Para ver templates: SELECT * FROM project_templates;';
    RAISE NOTICE '';
    RAISE NOTICE '🎊 SISTEMA PRONTO PARA USO! 🎊';
END $$;