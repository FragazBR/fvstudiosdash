-- =====================================================
-- LIMPEZA COMPLETA DOS USUÁRIOS DE TESTE
-- =====================================================
-- Execute este script no SQL Editor do Supabase primeiro

-- 1. Verificar usuários atuais
SELECT 
  p.email,
  p.role,
  p.name,
  p.created_at,
  au.id as auth_user_id
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email LIKE '%@test.com'
ORDER BY p.email;

-- 2. LIMPAR TODOS OS USUÁRIOS DE TESTE
-- ATENÇÃO: Isso vai deletar TODOS os usuários com @test.com

-- Deletar perfis primeiro (foreign key)
DELETE FROM profiles WHERE email LIKE '%@test.com';

-- Deletar usuários da auth
DELETE FROM auth.users WHERE email LIKE '%@test.com';

-- 3. Verificar se foi limpo
SELECT COUNT(*) as usuarios_restantes 
FROM profiles 
WHERE email LIKE '%@test.com';

SELECT COUNT(*) as auth_users_restantes 
FROM auth.users 
WHERE email LIKE '%@test.com';

-- =====================================================
-- RECRIAR O TRIGGER (caso não exista)
-- =====================================================

-- Verificar se o trigger existe
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'set_user_role_trigger';

-- Se não existir, criar novamente:
CREATE OR REPLACE FUNCTION assign_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir role baseado no email para usuários de teste
  IF NEW.email LIKE '%@test.com' THEN
    IF NEW.email LIKE 'admin@%' THEN
      NEW.role := 'admin';
    ELSIF NEW.email LIKE 'agency@%' THEN
      NEW.role := 'agency';
    ELSIF NEW.email LIKE 'user@%' THEN
      NEW.role := 'user';
    ELSIF NEW.email LIKE 'client@%' THEN
      NEW.role := 'client';
    ELSIF NEW.email LIKE 'personal@%' THEN
      NEW.role := 'personal';
    ELSE
      -- Default para emails @test.com não reconhecidos
      NEW.role := 'personal';
    END IF;
  ELSE
    -- Para emails reais, usar role padrão
    IF NEW.role IS NULL THEN
      NEW.role := 'personal';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS set_user_role_trigger ON profiles;
CREATE TRIGGER set_user_role_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_user_role();

-- =====================================================
-- DEPOIS DE EXECUTAR ESTE SCRIPT
-- =====================================================

/*
PASSO A PASSO:

1. Execute este script completo no SQL Editor do Supabase
2. Vá para: http://localhost:3000/signup
3. Crie os usuários um por um:

   📧 admin@test.com | 🔑 test123456 | 👤 Admin User
   📧 agency@test.com | 🔑 test123456 | 👤 Agency User  
   📧 user@test.com | 🔑 test123456 | 👤 User User
   📧 client@test.com | 🔑 test123456 | 👤 Client User
   📧 personal@test.com | 🔑 test123456 | 👤 Personal User

4. Teste login em: http://localhost:3000/login

5. Verificar se cada usuário é redirecionado corretamente:
   - admin@test.com → /admin
   - agency@test.com → /dashboard  
   - user@test.com → /user/dashboard
   - client@test.com → /client/[id]
   - personal@test.com → /personal/dashboard
*/

-- Query final para verificar usuários criados
-- Execute depois de criar todos os usuários via signup
SELECT 
  p.email,
  p.role,
  p.name,
  p.created_at,
  'Criado com sucesso!' as status
FROM profiles p
WHERE p.email LIKE '%@test.com'
ORDER BY p.email;
