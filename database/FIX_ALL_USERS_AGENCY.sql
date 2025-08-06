-- CORRIGIR TODOS OS USUÁRIOS SEM AGENCY_ID
-- Execute no Supabase SQL Editor

-- 1. Verificar quantos usuários estão sem agency_id
SELECT email, role, agency_id 
FROM user_profiles 
WHERE agency_id IS NULL;

-- 2. Pegar o ID da agência existente
SELECT id, name FROM agencies LIMIT 1;

-- 3. Atualizar TODOS os usuários sem agency_id
UPDATE user_profiles 
SET agency_id = (SELECT id FROM agencies LIMIT 1)
WHERE agency_id IS NULL;

-- 4. Verificar se todos foram corrigidos
SELECT email, role, agency_id 
FROM user_profiles 
WHERE agency_id IS NULL;

-- 5. Mostrar todos os usuários agora com agency_id
SELECT email, role, agency_id 
FROM user_profiles 
ORDER BY created_at DESC;