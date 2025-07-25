-- Limpar usuários órfãos (existem em auth.users mas não em user_profiles)

-- 1. VERIFICAR usuários órfãos
SELECT 
  'USUARIOS ORFAOS' as status,
  au.email,
  au.id,
  au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- 2. LIMPAR o usuário específico que está causando problema
DELETE FROM auth.identities WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'agencymanager@test.com'
);

DELETE FROM auth.users WHERE email = 'agencymanager@test.com';

-- 3. VERIFICAR se foi removido
SELECT 'VERIFICACAO APOS LIMPEZA' as status, COUNT(*) as total
FROM auth.users 
WHERE email = 'agencymanager@test.com';

-- 4. TESTAR novamente a criação do usuário
SELECT public.create_user_with_profile(
  'agencymanager@test.com',
  'senha123',
  'Agency Manager Test',
  'agency_manager',
  (SELECT id FROM agencies LIMIT 1),
  'Test Company',
  '11999999999'
);

-- 5. VERIFICAR se foi criado corretamente
SELECT 'RESULTADO FINAL' as status, up.email, up.name, up.role
FROM user_profiles up
WHERE up.email = 'agencymanager@test.com';