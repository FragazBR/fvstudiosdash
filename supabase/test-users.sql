-- Script para criar usuários de teste
-- Execute no SQL Editor do Supabase após criar o schema

-- Limpar dados existentes (cuidado em produção!)
DELETE FROM profiles WHERE email LIKE '%test%';

-- Criar perfis de teste (os usuários devem ser criados via auth primeiro)
-- Estes são apenas exemplos para teste

-- Admin de teste
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Admin Teste',
  'admin@test.com',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Agency de teste  
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Agency Teste',
  'agency@test.com',
  'agency',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'agency';

-- User de teste
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'User Teste',
  'user@test.com',
  'user',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'user';

-- Client de teste
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Client Teste',
  'client@test.com',
  'client',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'client';

-- Personal de teste
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'Personal Teste',
  'personal@test.com',
  'personal',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET role = 'personal';

-- Verificar se os perfis foram criados
SELECT * FROM profiles WHERE email LIKE '%test%' ORDER BY role;
