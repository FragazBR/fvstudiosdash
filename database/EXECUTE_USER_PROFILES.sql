-- ==================================================
-- CRIAR PERFIS PARA TODOS OS USUÁRIOS EXISTENTES
-- Execute após EXECUTE_CONTRACT_COLUMNS.sql
-- ==================================================

-- 1. Criar perfil para atendimento@fvstudios.com.br
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    agency_id,
    status,
    subscription_plan,
    created_at,
    updated_at
) VALUES (
    'ab1e981a-5b0b-4aaf-af1d-6a6ff08cb551'::UUID,
    'atendimento@fvstudios.com.br',
    'Atendimento FVStudios',
    'agency_owner',
    '00000000-0000-0000-0000-000000000001'::UUID,
    'active',
    'enterprise',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    subscription_plan = EXCLUDED.subscription_plan;

-- 2. Criar perfil para criativo@fvstudios.com.br
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    agency_id,
    status,
    subscription_plan,
    created_at,
    updated_at
) VALUES (
    '791867dc-8ca5-4d3d-9118-2f5096bcd777'::UUID,
    'criativo@fvstudios.com.br',
    'Criativo FVStudios',
    'agency_manager',
    '00000000-0000-0000-0000-000000000001'::UUID,
    'active',
    'pro',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    subscription_plan = EXCLUDED.subscription_plan;

-- 3. Criar perfil para ricardo@restaurantedrummond.com.br (cliente)
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    agency_id,
    status,
    subscription_plan,
    created_at,
    updated_at
) VALUES (
    '252288eb-902a-45b8-8aeb-154cf8a086d6'::UUID,
    'ricardo@restaurantedrummond.com.br',
    'Ricardo Restaurante Drummond',
    'agency_client',
    '00000000-0000-0000-0000-000000000001'::UUID,
    'active',
    'basic',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    subscription_plan = EXCLUDED.subscription_plan;

-- 4. Criar perfil para zolet@hotmail.com (cliente)
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    agency_id,
    status,
    subscription_plan,
    created_at,
    updated_at
) VALUES (
    'd53a6c12-91f3-4c7c-9723-bd799fb10f17'::UUID,
    'zolet@hotmail.com',
    'Zolet Cliente',
    'agency_client',
    '00000000-0000-0000-0000-000000000001'::UUID,
    'active',
    'basic',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    subscription_plan = EXCLUDED.subscription_plan;

-- 5. ADICIONAR MEMBROS DA EQUIPE À WORKSTATION
-- Atendimento como manager
INSERT INTO workstation_members (
    workstation_id,
    user_id,
    role,
    permissions
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'ab1e981a-5b0b-4aaf-af1d-6a6ff08cb551'::UUID,
    'manager',
    '["all", "clients", "projects", "reports", "settings"]'
) ON CONFLICT (workstation_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions;

-- Criativo como manager
INSERT INTO workstation_members (
    workstation_id,
    user_id,
    role,
    permissions
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '791867dc-8ca5-4d3d-9118-2f5096bcd777'::UUID,
    'manager',
    '["all", "projects", "creative", "campaigns", "reports"]'
) ON CONFLICT (workstation_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions;

-- 6. CRIAR REGISTROS DE CLIENTES NA TABELA CLIENTS (COM INFORMAÇÕES FINANCEIRAS)
-- Ricardo Drummond - Restaurante
INSERT INTO clients (
    id,
    agency_id,
    created_by,
    contact_name,
    email,
    company,
    status,
    contract_value,
    contract_duration,
    contract_start_date,
    payment_frequency,
    contract_currency,
    created_at,
    updated_at
) VALUES (
    '252288eb-902a-45b8-8aeb-154cf8a086d6'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID,
    'Ricardo D''Aquino',
    'ricardo@restaurantedrummond.com.br',
    'Restaurante Drummond',
    'active',
    5000.00,
    12,
    '2025-01-01'::DATE,
    'monthly',
    'BRL',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    contact_name = EXCLUDED.contact_name,
    company = EXCLUDED.company,
    status = EXCLUDED.status,
    contract_value = EXCLUDED.contract_value,
    contract_duration = EXCLUDED.contract_duration;

-- Zolet Cliente
INSERT INTO clients (
    id,
    agency_id,
    created_by,
    contact_name,
    email,
    company,
    status,
    contract_value,
    contract_duration,
    contract_start_date,
    payment_frequency,
    contract_currency,
    created_at,
    updated_at
) VALUES (
    'd53a6c12-91f3-4c7c-9723-bd799fb10f17'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID,
    'Zolet',
    'zolet@hotmail.com',
    'Cliente Zolet',
    'active',
    3000.00,
    6,
    '2025-02-01'::DATE,
    'monthly',
    'BRL',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    contact_name = EXCLUDED.contact_name,
    company = EXCLUDED.company,
    status = EXCLUDED.status,
    contract_value = EXCLUDED.contract_value,
    contract_duration = EXCLUDED.contract_duration;

-- 7. VERIFICAÇÕES FINAIS
-- Ver todos os perfis criados
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.agency_id,
    au.email as auth_email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.role, up.full_name;

-- Ver membros da workstation
SELECT 
    wm.workstation_id,
    wm.user_id,
    wm.role,
    up.full_name as member_name,
    up.role as user_role
FROM workstation_members wm
JOIN user_profiles up ON wm.user_id = up.id
WHERE wm.workstation_id = '00000000-0000-0000-0000-000000000001'::UUID
ORDER BY wm.role DESC, up.full_name;

-- Ver clientes na tabela clients
SELECT 
    id,
    contact_name,
    email,
    company,
    contract_value,
    status
FROM clients
ORDER BY contact_name;