-- ===============================================================
-- ADICIONAR COLUNAS DE PERMISSÕES À TABELA user_profiles
-- ===============================================================

-- Adicionar colunas de permissões se não existirem
DO $$
BEGIN
    -- Adicionar can_manage_team
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'can_manage_team') THEN
        ALTER TABLE user_profiles ADD COLUMN can_manage_team BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna can_manage_team adicionada';
    ELSE
        RAISE NOTICE 'Coluna can_manage_team já existe';
    END IF;

    -- Adicionar can_assign_tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'can_assign_tasks') THEN
        ALTER TABLE user_profiles ADD COLUMN can_assign_tasks BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna can_assign_tasks adicionada';
    ELSE
        RAISE NOTICE 'Coluna can_assign_tasks já existe';
    END IF;

    -- Adicionar can_view_team_metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'can_view_team_metrics') THEN
        ALTER TABLE user_profiles ADD COLUMN can_view_team_metrics BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna can_view_team_metrics adicionada';
    ELSE
        RAISE NOTICE 'Coluna can_view_team_metrics já existe';
    END IF;

END $$;

-- Atualizar permissões para agency_owner e agency_manager
UPDATE user_profiles 
SET 
    can_manage_team = true,
    can_assign_tasks = true,
    can_view_team_metrics = true,
    updated_at = now()
WHERE role IN ('agency_owner', 'agency_manager');

-- Verificar as mudanças
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

SELECT 'Colunas de permissões criadas e configuradas com sucesso! 🚀' as resultado;