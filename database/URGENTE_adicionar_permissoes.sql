-- ===============================================================
-- URGENTE: ADICIONAR COLUNAS DE PERMISSÕES E CONFIGURAR USUÁRIOS
-- Execute este script diretamente no SQL Editor do Supabase
-- ===============================================================

-- Passo 1: Adicionar colunas de permissões
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_assign_tasks BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_view_team_metrics BOOLEAN DEFAULT FALSE;

-- Passo 2: Configurar permissões para usuários existentes
UPDATE user_profiles 
SET 
    can_manage_team = TRUE,
    can_assign_tasks = TRUE,
    can_view_team_metrics = TRUE,
    updated_at = NOW()
WHERE role IN ('admin', 'agency_owner', 'agency_manager');

-- Passo 3: Verificar os resultados
SELECT 
    email,
    name,
    role,
    can_manage_team,
    can_assign_tasks,
    can_view_team_metrics,
    agency_id
FROM user_profiles 
WHERE role IN ('admin', 'agency_owner', 'agency_manager')
ORDER BY role, email;

-- Mostrar quantos usuários foram atualizados
SELECT 
    COUNT(*) as total_usuarios_atualizados,
    'Permissões configuradas com sucesso! 🚀' as resultado
FROM user_profiles 
WHERE can_manage_team = TRUE;