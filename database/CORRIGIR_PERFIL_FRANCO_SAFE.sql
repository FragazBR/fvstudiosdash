-- ==================================================
-- CORRIGIR PERFIL DO FRANCO - VERSÃO SEGURA
-- Cria workstation se não existir
-- ==================================================

-- 1. Limpar perfil admin falso e perfil antigo do franco
DELETE FROM user_profiles WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;
DELETE FROM user_profiles WHERE email = 'franco@fvstudios.com.br';

-- 2. Garantir que a agência existe
INSERT INTO agencies (
    id,
    name,
    email,
    subscription_plan,
    subscription_status
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'FVStudios Marketing',
    'contato@fvstudios.com.br',
    'enterprise',
    'active'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    subscription_plan = EXCLUDED.subscription_plan;

-- 3. Criar perfil correto do Franco
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    agency_id,
    status,
    created_at,
    updated_at
) VALUES (
    '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID,
    'franco@fvstudios.com.br',
    'Franco FVSTUDIOS',
    'admin',
    '00000000-0000-0000-0000-000000000001'::UUID,
    'active',
    NOW(),
    NOW()
);

-- 4. Garantir que a workstation existe
INSERT INTO workstations (
    id,
    agency_id,
    owner_id,
    name,
    description,
    workstation_code,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID,
    'Centro de Comando Principal',
    'Workstation principal da FVStudios para controle centralizado',
    'COMMAND_CENTER',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    owner_id = EXCLUDED.owner_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 5. Limpar membros antigos e adicionar Franco como owner
DELETE FROM workstation_members 
WHERE workstation_id = '00000000-0000-0000-0000-000000000001'::UUID;

INSERT INTO workstation_members (
    workstation_id,
    user_id,
    role,
    permissions
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID,
    'owner',
    '["all"]'
);

-- 6. VERIFICAÇÕES FINAIS
-- Ver se perfil do Franco está correto
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.agency_id,
    au.email as auth_email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.email = 'franco@fvstudios.com.br';

-- Ver se workstation está correta
SELECT 
    w.id,
    w.name,
    w.owner_id,
    up.full_name as owner_name
FROM workstations w
LEFT JOIN user_profiles up ON w.owner_id = up.id
WHERE w.id = '00000000-0000-0000-0000-000000000001'::UUID;

-- Ver membros da workstation
SELECT 
    wm.workstation_id,
    wm.user_id,
    wm.role,
    up.full_name as member_name
FROM workstation_members wm
JOIN user_profiles up ON wm.user_id = up.id
WHERE wm.workstation_id = '00000000-0000-0000-0000-000000000001'::UUID;

-- ==================================================
-- VERSÃO SEGURA - Garante que tudo existe antes de referenciar
-- ==================================================