-- Debug do problema "Email já está em uso"

-- 1. VERIFICAR se o email realmente existe (substitua pelo email que você testou)
SELECT 'auth.users' as tabela, email, id, created_at 
FROM auth.users 
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

SELECT 'user_profiles' as tabela, email, id, name, created_at 
FROM user_profiles 
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- 2. VERIFICAR todos os emails que existem (para ver se há duplicatas)
SELECT email, COUNT(*) as total
FROM auth.users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY total DESC;

-- 3. VERIFICAR se a função está fazendo LOWER() corretamente
-- Teste manual com email que certamente não existe
SELECT public.create_user_with_profile(
  'debug_test_' || EXTRACT(epoch FROM NOW())::text || '@testeemail.com',
  'senha123',
  'Debug Test User', 
  'agency_staff',
  (SELECT id FROM agencies LIMIT 1),
  'Debug Company',
  '11999999999'
);

-- 4. VERIFICAR últimos usuários criados
SELECT email, name, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 10;