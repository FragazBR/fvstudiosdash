-- ===============================================================
-- TRIGGER AUTOMÁTICO PARA CONFIGURAR PERMISSÕES
-- Aplica permissões automaticamente quando usuários são criados/atualizados
-- ===============================================================

-- Função para configurar permissões baseadas no role
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

-- Criar trigger para INSERT (novos usuários)
DROP TRIGGER IF EXISTS trigger_auto_permissions_insert ON user_profiles;
CREATE TRIGGER trigger_auto_permissions_insert
    BEFORE INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_configure_permissions();

-- Criar trigger para UPDATE (quando role é alterado)
DROP TRIGGER IF EXISTS trigger_auto_permissions_update ON user_profiles;
CREATE TRIGGER trigger_auto_permissions_update
    BEFORE UPDATE OF role ON user_profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION auto_configure_permissions();

-- Comentários para documentação
COMMENT ON FUNCTION auto_configure_permissions() IS 'Configura automaticamente permissões baseadas no role do usuário';
COMMENT ON TRIGGER trigger_auto_permissions_insert ON user_profiles IS 'Aplica permissões automaticamente para novos usuários';
COMMENT ON TRIGGER trigger_auto_permissions_update ON user_profiles IS 'Reaplica permissões quando o role é alterado';

-- Teste do trigger (opcional - remover em produção)
-- INSERT INTO user_profiles (id, email, name, role) 
-- VALUES (gen_random_uuid(), 'teste@exemplo.com', 'Teste', 'agency_manager')
-- ON CONFLICT DO NOTHING;

SELECT 'Triggers de permissões automáticas configurados com sucesso! 🚀' as resultado;