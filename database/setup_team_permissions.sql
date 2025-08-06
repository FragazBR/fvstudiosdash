-- ===============================================================
-- CONFIGURAR PERMISSÕES DE GERENCIAMENTO DE EQUIPE
-- ===============================================================

-- Este script concede permissões de gerenciamento de equipe para usuários
-- com papéis de agency_owner e agency_manager

DO $$
BEGIN
    -- Atualizar permissões para agency_owner e agency_manager
    UPDATE user_profiles 
    SET 
        can_manage_team = true,
        can_assign_tasks = true,
        can_view_team_metrics = true,
        updated_at = now()
    WHERE role IN ('agency_owner', 'agency_manager');

    -- Mostrar quantos usuários foram atualizados
    RAISE NOTICE 'Permissões atualizadas para % usuários', (
        SELECT COUNT(*) 
        FROM user_profiles 
        WHERE role IN ('agency_owner', 'agency_manager')
    );

END $$;

-- Verificar os usuários que receberam permissões
SELECT 
    id,
    email,
    name,
    role,
    can_manage_team,
    can_assign_tasks,
    can_view_team_metrics,
    agency_id
FROM user_profiles 
WHERE role IN ('agency_owner', 'agency_manager')
ORDER BY role, name;

-- Resultado esperado
SELECT 'Script de permissões executado com sucesso! 🚀' as resultado;