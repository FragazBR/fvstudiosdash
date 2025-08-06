-- ===============================================================
-- CORRIGIR AGENCY_ID DO USUÁRIO atendimento@fvstudios.com.br
-- ===============================================================

-- 1. Verificar se existe uma agência
SELECT id, name FROM agencies LIMIT 5;

-- 2. Se não existir agência, criar uma
INSERT INTO agencies (id, name, slug, description, created_at, updated_at) 
SELECT 
  gen_random_uuid(),
  'FV Studios',
  'fv-studios',
  'Agência principal',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM agencies WHERE name = 'FV Studios');

-- 3. Atualizar o usuário atendimento para ter agency_id
UPDATE user_profiles 
SET agency_id = (SELECT id FROM agencies WHERE name = 'FV Studios' LIMIT 1)
WHERE email = 'atendimento@fvstudios.com.br' AND agency_id IS NULL;

-- 4. Verificar se foi corrigido
SELECT 
  email, 
  role, 
  agency_id,
  CASE WHEN agency_id IS NOT NULL THEN '✅ CORRIGIDO' ELSE '❌ AINDA NULL' END as status
FROM user_profiles 
WHERE email = 'atendimento@fvstudios.com.br';

-- 5. Mostrar agências disponíveis
SELECT id, name, slug FROM agencies;