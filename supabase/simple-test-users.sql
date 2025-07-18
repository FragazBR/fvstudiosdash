-- =====================================================
-- VERSÃO SIMPLES - CRIAR USUÁRIOS DE TESTE
-- =====================================================
-- Execute este script no SQL Editor do Supabase

-- 1. Limpar dados existentes (opcional)
DELETE FROM profiles WHERE email LIKE '%@test.com';

-- 2. Criar apenas os perfis (os usuários serão criados via signup)
-- O sistema criará automaticamente o perfil quando não existir

INSERT INTO profiles (id, name, email, role, created_at, updated_at) VALUES
-- Use UUIDs temporários - serão substituídos quando o usuário fizer signup
('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@test.com', 'admin', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'Agency User', 'agency@test.com', 'agency', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'User User', 'user@test.com', 'user', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'Client User', 'client@test.com', 'client', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Personal User', 'personal@test.com', 'personal', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 3. Verificar se foram criados
SELECT * FROM profiles WHERE email LIKE '%@test.com' ORDER BY email;

-- INSTRUÇÕES APÓS EXECUTAR ESTE SCRIPT:
-- 1. Vá para http://localhost:3000/signup
-- 2. Crie usuários com os emails: admin@test.com, agency@test.com, etc.
-- 3. Use a senha: test123456
-- 4. O sistema atualizará automaticamente os perfis existentes
