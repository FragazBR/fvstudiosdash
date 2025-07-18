-- =====================================================
-- SCRIPT PARA CRIAR USUÁRIOS DE TESTE NO SUPABASE
-- =====================================================
-- ATENÇÃO: Execute este script no SQL Editor do Supabase
-- Este script cria usuários diretamente na tabela auth.users
-- (somente administradores podem fazer isso)

-- 1. PRIMEIRO: Limpar usuários de teste existentes (opcional)
DELETE FROM auth.users WHERE email LIKE '%@test.com';
DELETE FROM profiles WHERE email LIKE '%@test.com';

-- 2. CRIAR USUÁRIOS NA TABELA AUTH.USERS
-- Usuário Admin
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
);

-- Usuário Agency
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'agency@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Agency User"}',
    NOW(),
    NOW()
);

-- Usuário User
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'user@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "User User"}',
    NOW(),
    NOW()
);

-- Usuário Client
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'client@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Client User"}',
    NOW(),
    NOW()
);

-- Usuário Personal
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-5555-5555-555555555555',
    'authenticated',
    'authenticated',
    'personal@test.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Personal User"}',
    NOW(),
    NOW()
);

-- 3. CRIAR PERFIS CORRESPONDENTES (sem updated_at)
INSERT INTO profiles (id, name, email, role, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@test.com', 'admin', NOW()),
('22222222-2222-2222-2222-222222222222', 'Agency User', 'agency@test.com', 'agency', NOW()),
('33333333-3333-3333-3333-333333333333', 'User User', 'user@test.com', 'user', NOW()),
('44444444-4444-4444-4444-444444444444', 'Client User', 'client@test.com', 'client', NOW()),
('55555555-5555-5555-5555-555555555555', 'Personal User', 'personal@test.com', 'personal', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 4. VERIFICAR SE OS USUÁRIOS FORAM CRIADOS
SELECT 
    u.email, 
    u.id, 
    p.role,
    u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%@test.com'
ORDER BY u.email;

-- 5. RESULTADO ESPERADO:
-- admin@test.com    | 11111111-1111-1111-1111-111111111111 | admin    | timestamp
-- agency@test.com   | 22222222-2222-2222-2222-222222222222 | agency   | timestamp  
-- client@test.com   | 44444444-4444-4444-4444-444444444444 | client   | timestamp
-- personal@test.com | 55555555-5555-5555-5555-555555555555 | personal | timestamp
-- user@test.com     | 33333333-3333-3333-3333-333333333333 | user     | timestamp
