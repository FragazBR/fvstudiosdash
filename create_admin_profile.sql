-- Criar perfil de admin para resolver erro 500
-- Execute no Supabase SQL Editor

-- 1. Inserir o perfil admin na tabela user_profiles
INSERT INTO public.user_profiles (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
) VALUES (
    '71f0cbbb-1963-430c-b445-78907e747574',
    'admin@fvstudios.com',
    'Admin FVStudios',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 2. Verificar se o perfil foi criado
SELECT id, email, name, role, created_at 
FROM public.user_profiles 
WHERE id = '71f0cbbb-1963-430c-b445-78907e747574';

-- 3. Verificar se o usuário existe no auth.users
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE id = '71f0cbbb-1963-430c-b445-78907e747574';