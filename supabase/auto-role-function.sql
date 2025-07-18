-- =====================================================
-- FUNÇÃO PARA ATUALIZAR ROLE APÓS SIGNUP
-- =====================================================
-- Execute este script no SQL Editor do Supabase

-- 1. Criar função para atualizar role baseado no email
CREATE OR REPLACE FUNCTION update_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o email termina com @test.com, define o role baseado no prefixo
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger para executar a função
DROP TRIGGER IF EXISTS set_test_user_role ON profiles;
CREATE TRIGGER set_test_user_role
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role();

-- 3. Teste a função
-- Agora quando você criar usuários via signup com emails @test.com,
-- eles automaticamente receberão o role correto!

-- 4. Verificar se a função foi criada
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'update_user_role';

-- INSTRUÇÕES:
-- 1. Execute este script
-- 2. Vá para /signup e crie usuários com:
--    - admin@test.com
--    - agency@test.com  
--    - user@test.com
--    - client@test.com
--    - personal@test.com
-- 3. Todos com senha: test123456
-- 4. Os roles serão definidos automaticamente!
