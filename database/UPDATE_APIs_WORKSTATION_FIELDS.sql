-- ==================================================
-- ATUALIZAR QUERIES DAS APIS PARA USAR CAMPOS WORKSTATION
-- Incluir departamentos, especializações e informações completas
-- ==================================================

-- NOVAS QUERIES PARA AS APIS USAREM:

-- ========================================
-- 1. QUERY COMPLETA PARA TASKS API
-- ========================================

/*
NOVA QUERY PARA /api/tasks:

SELECT 
    t.*,
    -- Projeto com cliente
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    c.id as client_id,
    c.contact_name as client_name,
    c.company as client_company,
    
    -- Usuário atribuído (com departamento e especialização)
    u.id as assigned_user_id,
    u.full_name as assigned_user_name,
    u.email as assigned_user_email,
    u.avatar_url as assigned_user_avatar,
    u.job_title as assigned_user_job_title,
    
    -- Departamento do usuário
    d.id as user_department_id,
    d.name as user_department_name,
    d.color as user_department_color,
    d.icon as user_department_icon,
    
    -- Especialização do usuário  
    s.id as user_specialization_id,
    s.name as user_specialization_name,
    s.skill_level as user_skill_level,
    s.hourly_rate as user_hourly_rate,
    s.color as user_specialization_color,
    
    -- Criador da task
    creator.id as creator_id,
    creator.full_name as creator_name,
    creator.avatar_url as creator_avatar

FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN clients c ON p.client_id = c.id  
LEFT JOIN user_profiles u ON t.assigned_to = u.id
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN specializations s ON u.specialization_id = s.id
LEFT JOIN user_profiles creator ON t.created_by = creator.id
WHERE t.agency_id = $1
ORDER BY t.position ASC;
*/

-- ========================================
-- 2. QUERY COMPLETA PARA USER PROFILES API
-- ========================================

/*
NOVA QUERY PARA /api/users:

SELECT 
    u.*,
    
    -- Departamento completo
    d.id as department_id,
    d.name as department_name,
    d.description as department_description,
    d.color as department_color,
    d.icon as department_icon,
    d.budget_monthly as department_budget,
    
    -- Especialização completa
    s.id as specialization_id,
    s.name as specialization_name,
    s.description as specialization_description,
    s.skill_level as skill_level,
    s.hourly_rate as hourly_rate,
    s.color as specialization_color,
    s.icon as specialization_icon,
    
    -- Manager do departamento
    mgr.full_name as department_manager_name,
    mgr.avatar_url as department_manager_avatar

FROM user_profiles u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN specializations s ON u.specialization_id = s.id
LEFT JOIN user_profiles mgr ON d.manager_id = mgr.id
WHERE u.agency_id = $1 
AND u.status = 'active'
ORDER BY d.name, u.full_name;
*/

-- ========================================
-- 3. QUERY PARA PROJECTS API COM TEAM COMPLETO
-- ========================================

/*
NOVA QUERY PARA /api/projects com team info:

SELECT 
    p.*,
    
    -- Cliente
    c.id as client_id,
    c.contact_name as client_name,
    c.company as client_company,
    c.email as client_email,
    c.contract_value as client_contract_value,
    
    -- Criador do projeto
    creator.full_name as creator_name,
    creator.avatar_url as creator_avatar,
    creator.job_title as creator_job_title,
    
    -- Estatísticas do projeto
    (
        SELECT COUNT(*) FROM tasks 
        WHERE project_id = p.id AND status = 'completed'
    ) as completed_tasks,
    (
        SELECT COUNT(*) FROM tasks 
        WHERE project_id = p.id
    ) as total_tasks,
    (
        SELECT COUNT(DISTINCT assigned_to) FROM tasks 
        WHERE project_id = p.id AND assigned_to IS NOT NULL
    ) as team_members_count,
    
    -- Team members com especialização
    COALESCE(
        (
            SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', u.id,
                    'name', u.full_name,
                    'avatar', u.avatar_url,
                    'job_title', u.job_title,
                    'department', d.name,
                    'department_color', d.color,
                    'specialization', s.name,
                    'skill_level', s.skill_level,
                    'hourly_rate', s.hourly_rate
                )
            )
            FROM (
                SELECT DISTINCT assigned_to
                FROM tasks 
                WHERE project_id = p.id AND assigned_to IS NOT NULL
            ) t
            JOIN user_profiles u ON t.assigned_to = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN specializations s ON u.specialization_id = s.id
        ), 
        '[]'::JSON
    ) as team_members

FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN user_profiles creator ON p.created_by = creator.id
WHERE p.agency_id = $1
ORDER BY p.created_at DESC;
*/

-- ========================================
-- 4. QUERY PARA DASHBOARD COM MÉTRICAS POR DEPARTAMENTO
-- ========================================

/*
NOVA QUERY PARA DASHBOARD com métricas por departamento:

SELECT 
    d.id,
    d.name as department_name,
    d.color as department_color,
    d.icon as department_icon,
    d.budget_monthly,
    
    -- Membros do departamento
    COUNT(u.id) as total_members,
    
    -- Projetos ativos por departamento
    COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
    
    -- Tasks do departamento
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
    
    -- Receita estimada baseada em horas trabalhadas
    COALESCE(
        SUM(
            CASE WHEN t.status = 'completed' AND s.hourly_rate > 0 
            THEN (t.estimated_hours * s.hourly_rate) 
            ELSE 0 END
        ), 0
    ) as completed_revenue,
    
    -- Performance média do departamento (tasks completadas / total)
    CASE WHEN COUNT(t.id) > 0 
    THEN ROUND(
        (COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::DECIMAL / COUNT(t.id)::DECIMAL) * 100, 
        2
    ) 
    ELSE 0 END as completion_rate

FROM departments d
LEFT JOIN user_profiles u ON d.id = u.department_id AND u.status = 'active'
LEFT JOIN tasks t ON u.id = t.assigned_to
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN specializations s ON u.specialization_id = s.id
WHERE d.agency_id = $1 AND d.is_active = true
GROUP BY d.id, d.name, d.color, d.icon, d.budget_monthly
ORDER BY d.name;
*/

-- ========================================
-- 5. QUERY PARA AUTO-ATRIBUIÇÃO INTELIGENTE
-- ========================================

/*
QUERY para encontrar o melhor usuário para uma tarefa:

SELECT 
    u.id,
    u.full_name,
    u.avatar_url,
    u.weekly_hours,
    
    -- Especialização
    s.name as specialization,
    s.skill_level,
    s.hourly_rate,
    
    -- Departamento
    d.name as department,
    d.color as department_color,
    
    -- Carga de trabalho atual
    COALESCE(
        (
            SELECT COUNT(*) 
            FROM tasks 
            WHERE assigned_to = u.id 
            AND status IN ('todo', 'in_progress')
        ), 0
    ) as current_workload,
    
    -- Score de match baseado em especialização e carga
    CASE s.skill_level
        WHEN 'expert' THEN 100
        WHEN 'senior' THEN 80  
        WHEN 'intermediate' THEN 60
        WHEN 'junior' THEN 40
        ELSE 20
    END - 
    COALESCE(
        (
            SELECT COUNT(*) * 5
            FROM tasks 
            WHERE assigned_to = u.id 
            AND status IN ('todo', 'in_progress')
        ), 0
    ) as match_score

FROM user_profiles u
JOIN departments d ON u.department_id = d.id
JOIN specializations s ON u.specialization_id = s.id
WHERE u.agency_id = $1 
AND u.status = 'active'
AND d.is_active = true
AND s.is_active = true
AND s.name ILIKE '%' || $2 || '%'  -- Match especialização necessária
ORDER BY match_score DESC
LIMIT 3;
*/

-- ========================================
-- 6. VERIFICAÇÃO DOS CAMPOS ADICIONADOS
-- ========================================

-- Verificar se todos os campos foram criados
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN (
    'avatar_url', 'department_id', 'specialization_id', 
    'job_title', 'phone', 'bio', 'hire_date', 
    'weekly_hours', 'timezone', 'location'
)
ORDER BY column_name;

-- Verificar tabelas de departamentos e especializações
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('departments', 'specializations')
ORDER BY table_name, ordinal_position;

-- ==================================================
-- QUERIES PRONTAS PARA USO NAS APIs
-- Execute o WORKSTATION_CAMPOS_ESSENCIAIS.sql primeiro
-- ==================================================