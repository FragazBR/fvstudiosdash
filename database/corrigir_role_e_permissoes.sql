-- ===============================================================
-- DIAGNÓSTICO E CORREÇÃO DE ROLES E PERMISSÕES
-- ===============================================================

-- PASSO 1: Verificar usuários criados recentemente
-- ===============================================================
SELECT 
    email,
    name,
    role,
    can_manage_team,
    can_assign_tasks,
    can_view_team_metrics,
    created_at,
    updated_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- PASSO 2: Verificar se os triggers existem
-- ===============================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    trigger_schema,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles'
AND trigger_name LIKE '%auto_permissions%';

-- PASSO 3: Corrigir usuários com role incorreto
-- ===============================================================

-- Se você selecionou "Gerente" mas foi salvo como "agency_staff", 
-- vamos corrigir para "agency_manager"
UPDATE user_profiles 
SET 
    role = 'agency_manager',
    can_manage_team = TRUE,
    can_assign_tasks = TRUE,
    can_view_team_metrics = TRUE,
    updated_at = NOW()
WHERE role = 'agency_staff' 
  AND created_at > (NOW() - INTERVAL '1 hour'); -- Apenas usuários criados na última hora

-- PASSO 4: Forçar aplicação de permissões para todos os usuários com roles de gerenciamento
-- ===============================================================
UPDATE user_profiles 
SET 
    can_manage_team = TRUE,
    can_assign_tasks = TRUE,
    can_view_team_metrics = TRUE,
    updated_at = NOW()
WHERE role IN ('agency_manager', 'agency_owner', 'admin');

-- PASSO 5: Verificar a correção
-- ===============================================================
SELECT 
    email,
    name,
    role,
    can_manage_team,
    can_assign_tasks,
    can_view_team_metrics,
    'Status: ' || 
    CASE 
        WHEN role IN ('agency_manager', 'agency_owner', 'admin') AND can_manage_team = TRUE THEN '✅ Correto'
        WHEN role = 'agency_staff' AND can_manage_team = FALSE THEN '✅ Correto (staff)'
        ELSE '❌ Precisa correção'
    END as status_permissoes
FROM user_profiles 
ORDER BY created_at DESC;

-- PASSO 6: Recriar os triggers (caso não estejam funcionando)
-- ===============================================================

-- Garantir que a função existe
CREATE OR REPLACE FUNCTION auto_configure_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Log para debug (remover em produção)
    RAISE NOTICE 'Trigger executado para usuário: % com role: %', NEW.email, NEW.role;
    
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

-- Recriar triggers
DROP TRIGGER IF EXISTS trigger_auto_permissions_insert ON user_profiles;
CREATE TRIGGER trigger_auto_permissions_insert
    BEFORE INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_configure_permissions();

DROP TRIGGER IF EXISTS trigger_auto_permissions_update ON user_profiles;
CREATE TRIGGER trigger_auto_permissions_update
    BEFORE UPDATE OF role ON user_profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION auto_configure_permissions();

-- RESULTADO
-- ===============================================================
SELECT 'Diagnóstico e correção executados! 🔧' as resultado;