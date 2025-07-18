-- =====================================================
-- VERSÃO CORRIGIDA - CRIAR USUÁRIOS DE TESTE
-- =====================================================
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura da tabela profiles primeiro
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Limpar usuários de teste existentes (opcional)
DELETE FROM auth.users WHERE email LIKE '%@test.com';
DELETE FROM profiles WHERE email LIKE '%@test.com';

-- 3. Criar apenas os perfis (versão simples)
-- Adaptado para a estrutura atual da tabela
INSERT INTO profiles (id, name, email, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@test.com', 'admin'),
('22222222-2222-2222-2222-222222222222', 'Agency User', 'agency@test.com', 'agency'),
('33333333-3333-3333-3333-333333333333', 'User User', 'user@test.com', 'user'),
('44444444-4444-4444-4444-444444444444', 'Client User', 'client@test.com', 'client'),
('55555555-5555-5555-5555-555555555555', 'Personal User', 'personal@test.com', 'personal')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 4. Criar usuários na auth.users (método simplificado)
-- Nota: Pode falhar se não tiver permissões de admin

-- Admin
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    'authenticated',
    'authenticated'
);

-- Agency
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'agency@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Agency User"}',
    'authenticated',
    'authenticated'
);

-- User
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'user@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "User User"}',
    'authenticated',
    'authenticated'
);

-- Client
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'client@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Client User"}',
    'authenticated',
    'authenticated'
);

-- Personal
INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'personal@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Personal User"}',
    'authenticated',
    'authenticated'
);

-- 5. Verificar se os usuários foram criados
SELECT 
    u.email, 
    u.id, 
    p.role,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%@test.com'
ORDER BY u.email;

-- 6. Se der erro, use apenas a parte dos perfis e depois faça signup manual
-- As credenciais serão:
-- admin@test.com / test123456
-- agency@test.com / test123456
-- user@test.com / test123456
-- client@test.com / test123456
-- personal@test.com / test123456
