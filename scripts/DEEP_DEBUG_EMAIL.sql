-- Investigação profunda do problema de email

-- 1. VERIFICAR se ainda existe em auth.users
SELECT 'AINDA EM AUTH.USERS' as check_type, email, id, created_at 
FROM auth.users 
WHERE email = 'agencymanager@test.com';

-- 2. VERIFICAR se existe em user_profiles  
SELECT 'EM USER_PROFILES' as check_type, email, id, name, created_at
FROM user_profiles 
WHERE email = 'agencymanager@test.com';

-- 3. VERIFICAR identities
SELECT 'EM AUTH.IDENTITIES' as check_type, user_id, identity_data
FROM auth.identities 
WHERE identity_data->>'email' = 'agencymanager@test.com';

-- 4. VERIFICAR se a função tem permissões para DELETE
SELECT 'CURRENT USER' as info, current_user;

-- 5. FORÇAR DELETE com mais detalhes
DO $$
DECLARE
  user_count int;
BEGIN
  -- Contar antes
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email = 'agencymanager@test.com';
  RAISE NOTICE 'Usuários antes do delete: %', user_count;
  
  -- Delete identities primeiro
  DELETE FROM auth.identities WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'agencymanager@test.com'
  );
  
  -- Delete user
  DELETE FROM auth.users WHERE email = 'agencymanager@test.com';
  
  -- Contar depois
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email = 'agencymanager@test.com';
  RAISE NOTICE 'Usuários após o delete: %', user_count;
END $$;

-- 6. VERIFICAR novamente
SELECT 'VERIFICACAO FINAL' as check_type, COUNT(*) as total
FROM auth.users 
WHERE email = 'agencymanager@test.com';

-- 7. TESTAR com email completamente diferente
SELECT public.create_user_with_profile(
  'teste_novo_' || EXTRACT(epoch FROM NOW())::text || '@exemplo.com',
  'senha123',
  'Teste Novo Usuario',
  'agency_staff',
  (SELECT id FROM agencies LIMIT 1),
  'Empresa Teste',
  '11999999999'
);