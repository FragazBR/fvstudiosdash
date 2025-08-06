-- CORREÇÃO RÁPIDA - Execute no Supabase agora:

-- Corrigir todos os usuários criados nas últimas 2 horas que foram marcados como agency_staff
-- mas que deveriam ser agency_manager
UPDATE user_profiles 
SET 
    role = 'agency_manager',
    can_manage_team = TRUE,
    can_assign_tasks = TRUE,
    can_view_team_metrics = TRUE,
    updated_at = NOW()
WHERE role = 'agency_staff' 
  AND created_at > (NOW() - INTERVAL '2 hours');

-- Verificar quantos foram corrigidos e mostrar os usuários
SELECT 
    email,
    name,
    role,
    can_manage_team,
    'Corrigido! ✅' as status
FROM user_profiles 
WHERE updated_at > (NOW() - INTERVAL '1 minute')
  AND role = 'agency_manager'
ORDER BY updated_at DESC;