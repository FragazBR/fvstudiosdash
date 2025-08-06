-- ===============================================================
-- CORRIGIR USUÁRIO ESPECÍFICO QUE FOI CRIADO INCORRETAMENTE
-- ===============================================================

-- PASSO 1: Verificar usuário criado recentemente com role incorreto
-- ===============================================================
SELECT 
    id,
    email,
    name,
    role,
    can_manage_team,
    can_assign_tasks,
    can_view_team_metrics,
    created_at
FROM user_profiles 
WHERE role = 'agency_staff'
  AND created_at > (NOW() - INTERVAL '2 hours')
ORDER BY created_at DESC;

-- PASSO 2: Corrigir o usuário mais recente criado como agency_staff para agency_manager
-- ===============================================================
UPDATE user_profiles 
SET 
    role = 'agency_manager',
    can_manage_team = TRUE,
    can_assign_tasks = TRUE,
    can_view_team_metrics = TRUE,
    updated_at = NOW()
WHERE role = 'agency_staff' 
  AND created_at > (NOW() - INTERVAL '2 hours')
  AND id = (
    SELECT id FROM user_profiles 
    WHERE role = 'agency_staff' 
      AND created_at > (NOW() - INTERVAL '2 hours')
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- PASSO 3: Verificar a correção
-- ===============================================================
SELECT 
    id,
    email,
    name,
    role,
    can_manage_team,
    can_assign_tasks,
    can_view_team_metrics,
    updated_at,
    'Usuário corrigido! ✅' as status
FROM user_profiles 
WHERE role = 'agency_manager'
  AND updated_at > (NOW() - INTERVAL '1 minute')
ORDER BY updated_at DESC
LIMIT 1;

-- RESULTADO
-- ===============================================================
SELECT 'Usuário corrigido para agency_manager com permissões completas! 🚀' as resultado;