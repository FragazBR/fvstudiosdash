-- =====================================================
-- LIMPEZA SIMPLES DOS USUÁRIOS DE TESTE
-- =====================================================
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários atuais na tabela profiles
SELECT 
  email,
  role,
  name,
  created_at
FROM profiles 
WHERE email LIKE '%@test.com'
ORDER BY email;

-- 2. Verificar usuários na tabela auth.users
SELECT 
  email,
  created_at
FROM auth.users 
WHERE email LIKE '%@test.com'
ORDER BY email;

-- 3. LIMPAR TODOS OS USUÁRIOS DE TESTE
-- ATENÇÃO: Isso vai deletar TODOS os usuários com @test.com

-- Deletar perfis primeiro (foreign key)
DELETE FROM profiles WHERE email LIKE '%@test.com';

-- Deletar usuários da auth  
DELETE FROM auth.users WHERE email LIKE '%@test.com';

-- 4. Verificar se foi limpo
SELECT COUNT(*) as usuarios_profiles_restantes 
FROM profiles 
WHERE email LIKE '%@test.com';

SELECT COUNT(*) as usuarios_auth_restantes 
FROM auth.users 
WHERE email LIKE '%@test.com';

-- 5. RECRIAR O TRIGGER
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

-- 6. Verificar se trigger foi criado
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'set_user_role_trigger';

-- =====================================================
-- AGORA CRIE OS USUÁRIOS VIA SIGNUP
-- =====================================================
/*
Vá para: http://localhost:3000/signup

Crie os usuários:
📧 admin@test.com | 🔑 test123456 | 👤 Admin User
📧 agency@test.com | 🔑 test123456 | 👤 Agency User  
📧 user@test.com | 🔑 test123456 | 👤 User User
📧 client@test.com | 🔑 test123456 | 👤 Client User
📧 personal@test.com | 🔑 test123456 | 👤 Personal User

Depois teste login em: http://localhost:3000/login
*/

-- Query para verificar usuários criados (execute depois)
SELECT 
  email,
  role,
  name,
  created_at
FROM profiles 
WHERE email LIKE '%@test.com'
ORDER BY email;
