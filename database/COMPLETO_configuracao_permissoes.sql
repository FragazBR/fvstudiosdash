-- ===============================================================
-- CONFIGURAÇÃO COMPLETA DE PERMISSÕES AUTOMÁTICAS
-- Execute este script no SQL Editor do Supabase
-- ===============================================================

-- PASSO 1: Adicionar colunas de permissões (se não existirem)
-- ===============================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_assign_tasks BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_view_team_metrics BOOLEAN DEFAULT FALSE;

-- PASSO 2: Configurar permissões para usuários existentes
-- ===============================================================
UPDATE user_profiles 
SET 
    can_manage_team = TRUE,
    can_assign_tasks = TRUE,
    can_view_team_metrics = TRUE,
    updated_at = NOW()
WHERE role IN ('admin', 'agency_owner', 'agency_manager');

-- PASSO 3: Criar função para configurar permissões automaticamente
-- ===============================================================
CREATE OR REPLACE FUNCTION auto_configure_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Configurar permissões baseadas no role
    CASE NEW.role
        WHEN 'admin' THEN
            NEW.can_manage_team := TRUE;
            NEW.can_assign_tasks := TRUE;
            NEW.can_view_team_metrics := TRUE;
            
        WHEN 'agency_owner' THEN
            NEW.can_manage_team := TRUE;
            NEW.can_assign_tasks := TRUE;
            NEW.can_view_team_metrics := TRUE;
            
        WHEN 'agency_manager' THEN
            NEW.can_manage_team := TRUE;
            NEW.can_assign_tasks := TRUE;
            NEW.can_view_team_metrics := TRUE;
            
        WHEN 'agency_staff' THEN
            NEW.can_manage_team := FALSE;
            NEW.can_assign_tasks := TRUE;
            NEW.can_view_team_metrics := TRUE;
            
        ELSE
            -- Para outros roles, permissões básicas
            NEW.can_manage_team := FALSE;
            NEW.can_assign_tasks := FALSE;
            NEW.can_view_team_metrics := FALSE;
    END CASE;
    
    -- Garantir que updated_at seja sempre atualizado
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 4: Criar triggers para aplicar permissões automaticamente
-- ===============================================================

-- Trigger para novos usuários (INSERT)
DROP TRIGGER IF EXISTS trigger_auto_permissions_insert ON user_profiles;
CREATE TRIGGER trigger_auto_permissions_insert
    BEFORE INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_configure_permissions();

-- Trigger para quando o role é alterado (UPDATE)
DROP TRIGGER IF EXISTS trigger_auto_permissions_update ON user_profiles;
CREATE TRIGGER trigger_auto_permissions_update
    BEFORE UPDATE OF role ON user_profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION auto_configure_permissions();

-- PASSO 5: Verificação dos resultados
-- ===============================================================

-- Mostrar usuários com permissões configuradas
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

-- Contar quantos usuários foram configurados
SELECT 
    COUNT(*) as total_usuarios_com_permissoes,
    'Sistema de permissões automáticas configurado com sucesso! 🚀' as resultado
FROM user_profiles 
WHERE can_manage_team = TRUE;

-- PASSO 6: Comentários para documentação
-- ===============================================================
COMMENT ON FUNCTION auto_configure_permissions() IS 'Configura automaticamente permissões baseadas no role do usuário';
COMMENT ON TRIGGER trigger_auto_permissions_insert ON user_profiles IS 'Aplica permissões automaticamente para novos usuários';
COMMENT ON TRIGGER trigger_auto_permissions_update ON user_profiles IS 'Reaplica permissões quando o role é alterado';

-- ===============================================================
-- TESTE (opcional - descomente para testar)
-- ===============================================================
/*
-- Testar inserção de novo usuário
INSERT INTO user_profiles (id, email, name, role, agency_id) 
VALUES (
    gen_random_uuid(), 
    'teste-manager@exemplo.com', 
    'Teste Manager', 
    'agency_manager',
    (SELECT id FROM agencies LIMIT 1)
) 
ON CONFLICT (id) DO NOTHING;

-- Verificar se o teste funcionou
SELECT 
    email, 
    role, 
    can_manage_team, 
    can_assign_tasks, 
    can_view_team_metrics 
FROM user_profiles 
WHERE email = 'teste-manager@exemplo.com';
*/