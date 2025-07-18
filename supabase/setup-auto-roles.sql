-- =====================================================
-- TRIGGER PARA AUTO-ATRIBUIÇÃO DE ROLES
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Depois crie os usuários manualmente via /signup

-- 1. Criar função para atribuir role baseado no email
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

-- 2. Criar trigger na tabela profiles
DROP TRIGGER IF EXISTS set_user_role_trigger ON profiles;
CREATE TRIGGER set_user_role_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_user_role();

-- 3. Verificar se o trigger foi criado
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'set_user_role_trigger';

-- =====================================================
-- INSTRUÇÕES PARA CRIAR USUÁRIOS DE TESTE
-- =====================================================

/*
AGORA FAÇA O SEGUINTE:

1. Vá para: http://localhost:3000/signup

2. Crie os usuários um por um:

   EMAIL: admin@test.com
   SENHA: test123456
   NOME: Admin User
   → Role será automaticamente definido como 'admin'

   EMAIL: agency@test.com
   SENHA: test123456
   NOME: Agency User
   → Role será automaticamente definido como 'agency'

   EMAIL: user@test.com
   SENHA: test123456
   NOME: User User
   → Role será automaticamente definido como 'user'

   EMAIL: client@test.com
   SENHA: test123456
   NOME: Client User
   → Role será automaticamente definido como 'client'

   EMAIL: personal@test.com
   SENHA: test123456
   NOME: Personal User
   → Role será automaticamente definido como 'personal'

3. Depois teste o login em: http://localhost:3000/login

4. Cada usuário será redirecionado para seu dashboard específico:
   - admin@test.com → /admin
   - agency@test.com → /dashboard
   - user@test.com → /user/dashboard
   - client@test.com → /client/[id]
   - personal@test.com → /personal/dashboard

5. Verificar se funcionou:
*/

-- Query para verificar usuários criados
SELECT 
  p.email,
  p.role,
  p.name,
  p.created_at
FROM profiles p
WHERE p.email LIKE '%@test.com'
ORDER BY p.email;

-- =====================================================
-- LIMPEZA (se necessário)
-- =====================================================

/*
-- Se precisar limpar e recomeçar:

DELETE FROM auth.users WHERE email LIKE '%@test.com';
DELETE FROM profiles WHERE email LIKE '%@test.com';

-- Depois recrie os usuários via signup
*/
