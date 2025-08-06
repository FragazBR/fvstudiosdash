-- ==================================================
-- VERIFICAR USUÁRIOS EXISTENTES
-- Execute no SQL Editor para ver o que já temos
-- ==================================================

-- 1. Ver todos os usuários no auth.users
SELECT 
    id, 
    email, 
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at;

-- 2. Ver todos os perfis em user_profiles
SELECT 
    id,
    email,
    full_name,
    role,
    agency_id,
    status
FROM user_profiles 
ORDER BY created_at;

-- 3. Ver se franco já existe no auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'franco@fvstudios.com.br';

-- 4. Ver se franco já existe em user_profiles
SELECT 
    id,
    email,
    full_name,
    role
FROM user_profiles 
WHERE email = 'franco@fvstudios.com.br';

-- 5. Ver agências existentes
SELECT 
    id,
    name,
    email
FROM agencies;

-- 6. Ver workstations existentes
SELECT 
    id,
    name,
    owner_id,
    agency_id
FROM workstations;