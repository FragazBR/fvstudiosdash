-- =============================================
-- TRIGGERS PARA SISTEMA COMPLETO COM INTEGRAÇÕES
-- =============================================

-- 1. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Função para criar perfil inteligente
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_to_assign user_role := 'free';
    user_plan plan_type := 'free';
    max_integrations_limit INTEGER := 3;
    max_clients_limit INTEGER := 5;
    max_projects_limit INTEGER := 10;
BEGIN
    -- Determinar role e limites baseado no email ou contexto
    IF NEW.email LIKE '%@fvstudios.com' THEN
        user_role_to_assign := 'admin';
        user_plan := 'enterprise';
        max_integrations_limit := 999;
        max_clients_limit := 999;
        max_projects_limit := 999;
    ELSIF NEW.email LIKE '%agency%' OR NEW.raw_user_meta_data->>'account_type' = 'agency' THEN
        user_role_to_assign := 'agency_owner';
        user_plan := 'agency';
        max_integrations_limit := 20;
        max_clients_limit := 50;
        max_projects_limit := 100;
    ELSIF NEW.raw_user_meta_data->>'account_type' = 'producer' THEN
        user_role_to_assign := 'independent_producer';
        user_plan := 'producer';
        max_integrations_limit := 15;
        max_clients_limit := 20;
        max_projects_limit := 50;
    ELSIF NEW.raw_user_meta_data->>'account_type' = 'influencer' THEN
        user_role_to_assign := 'influencer';
        user_plan := 'influencer';
        max_integrations_limit := 10;
        max_clients_limit := 5;
        max_projects_limit := 25;
    END IF;
    
    INSERT INTO profiles (
        id,
        email,
        full_name,
        role,
        plan_type,
        email_verified,
        max_integrations,
        max_clients,
        max_projects
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        user_role_to_assign,
        user_plan,
        NEW.email_confirmed_at IS NOT NULL,
        max_integrations_limit,
        max_clients_limit,
        max_projects_limit
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para validar limites de integração
CREATE OR REPLACE FUNCTION validate_integration_limits()
RETURNS TRIGGER AS $$
DECLARE
    current_integrations INTEGER;
    max_allowed INTEGER;
    user_plan_type plan_type;
BEGIN
    -- Buscar informações do usuário
    SELECT plan_type, max_integrations 
    INTO user_plan_type, max_allowed
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Contar integrações ativas atuais
    SELECT COUNT(*) 
    INTO current_integrations
    FROM user_integrations 
    WHERE user_id = NEW.user_id 
    AND status = 'active';
    
    -- Verificar se excede o limite (exceto para admins)
    IF current_integrations >= max_allowed THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = NEW.user_id AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Limite de integrações atingido (% de %)', current_integrations, max_allowed;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para log automático de uso de integrações
CREATE OR REPLACE FUNCTION log_integration_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Log quando uma integração é usada (status muda para active ou há erro)
    IF OLD.status != NEW.status OR OLD.last_error != NEW.last_error THEN
        INSERT INTO integration_usage (
            user_integration_id,
            user_id,
            action,
            success,
            error_message,
            created_at
        ) VALUES (
            NEW.id,
            NEW.user_id,
            CASE 
                WHEN NEW.status = 'active' THEN 'activation'
                WHEN NEW.status = 'error' THEN 'error'
                WHEN NEW.status = 'expired' THEN 'token_expired'
                ELSE 'status_change'
            END,
            NEW.status = 'active',
            NEW.last_error,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para validar criação de clientes
CREATE OR REPLACE FUNCTION validate_client_creation()
RETURNS TRIGGER AS $$
DECLARE
    creator_role user_role;
    current_clients INTEGER;
    max_allowed_clients INTEGER;
BEGIN
    -- Buscar informações do criador
    SELECT role, max_clients 
    INTO creator_role, max_allowed_clients
    FROM profiles 
    WHERE id = NEW.created_by;
    
    -- Verificar se pode criar clientes
    IF creator_role NOT IN ('admin', 'agency_owner', 'independent_producer') THEN
        RAISE EXCEPTION 'Apenas admins, donos de agência ou produtores independentes podem criar clientes';
    END IF;
    
    -- Contar clientes atuais
    SELECT COUNT(*) 
    INTO current_clients
    FROM profiles 
    WHERE created_by = NEW.created_by 
    AND role = 'client' 
    AND status = 'active';
    
    -- Verificar limite (exceto para admins)
    IF current_clients >= max_allowed_clients AND creator_role != 'admin' THEN
        RAISE EXCEPTION 'Limite de clientes atingido (% de %)', current_clients, max_allowed_clients;
    END IF;
    
    -- Definir relacionamento correto
    IF creator_role = 'agency_owner' THEN
        SELECT agency_id INTO NEW.agency_id FROM profiles WHERE id = NEW.created_by;
    ELSIF creator_role = 'independent_producer' THEN
        NEW.producer_id := NEW.created_by;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para auto-adicionar dono à agência
CREATE OR REPLACE FUNCTION add_owner_to_agency()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar o perfil do dono para incluir agency_id
    UPDATE profiles 
    SET 
        agency_id = NEW.id,
        role = 'agency_owner',
        plan_type = 'agency'
    WHERE id = NEW.owner_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar todos os triggers
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_new_user();

CREATE TRIGGER validate_client_creation_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    WHEN (NEW.role = 'client')
    EXECUTE FUNCTION validate_client_creation();

CREATE TRIGGER validate_integration_limits_trigger
    BEFORE INSERT ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION validate_integration_limits();

CREATE TRIGGER log_integration_usage_trigger
    AFTER UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION log_integration_usage();

CREATE TRIGGER add_owner_to_agency_trigger
    AFTER INSERT ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION add_owner_to_agency();

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agencies_updated_at
    BEFORE UPDATE ON agencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON available_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Atualizar o usuário admin existente
UPDATE profiles 
SET 
    role = 'admin',
    plan_type = 'enterprise',
    email_verified = true,
    full_name = 'Admin FVStudios',
    status = 'active',
    max_integrations = 999,
    max_clients = 999,
    max_projects = 999
WHERE email = 'admin@fvstudios.com';

SELECT 'Triggers completos criados com sucesso!' as status;
SELECT 'Admin configurado:' as info;
SELECT email, role, plan_type, max_integrations, max_clients 
FROM profiles 
WHERE email = 'admin@fvstudios.com';
