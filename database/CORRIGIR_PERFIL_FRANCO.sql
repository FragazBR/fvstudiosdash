-- ==================================================
-- CORRIGIR PERFIL DO FRANCO - PRONTO PARA EXECUTAR
-- UUID correto já inserido: 9a8772a1-1387-4b08-81f8-8e2ffdff55cc
-- ==================================================

-- 1. Limpar perfil admin falso e perfil antigo do franco
DELETE FROM user_profiles WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;
DELETE FROM user_profiles WHERE email = 'franco@fvstudios.com.br';

-- 2. Criar perfil correto do Franco com UUID do auth.users
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

-- 3. Corrigir owner da workstation para o Franco
UPDATE workstations 
SET owner_id = '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;

-- 4. Limpar membros antigos e adicionar Franco como owner
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

-- 5. VERIFICAÇÕES FINAIS
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
-- PRONTO! Este script está configurado com o UUID correto.
-- Execute diretamente no SQL Editor do Supabase.
-- ==================================================