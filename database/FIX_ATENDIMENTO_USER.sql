-- CORRIGIR USUÁRIO ATENDIMENTO SEM AGENCY_ID
-- Execute no Supabase SQL Editor

-- 1. Verificar agencies existentes
SELECT id, name FROM agencies LIMIT 3;

-- 2. Se não houver agencies, criar uma (só se não existir)
INSERT INTO agencies (name, created_at, updated_at) 
SELECT 'FV Studios', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM agencies WHERE name = 'FV Studios');

-- 3. Atualizar usuário atendimento com agency_id
UPDATE user_profiles 
SET agency_id = (SELECT id FROM agencies LIMIT 1)
WHERE email = 'atendimento@fvstudios.com.br';

-- 4. Verificar se foi corrigido  
SELECT email, role, agency_id 
FROM user_profiles 
WHERE email = 'atendimento@fvstudios.com.br';