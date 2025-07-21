-- Criar perfil de admin CORRETO para resolver erro 500
-- Execute no Supabase SQL Editor

-- 1. Primeiro verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Inserir o perfil admin com a estrutura correta
INSERT INTO public.user_profiles (
    id,
    email,
    name,  -- CORRIGIDO: era full_name, agora é name
    role,
    company,
    phone,
    subscription_plan,
    subscription_status,
    created_at,
    updated_at
) VALUES (
    '71f0cbbb-1963-430c-b445-78907e747574',
    'admin@fvstudios.com',
    'Admin FVStudios',
    'admin',
    'FVStudios',
    NULL,
    'enterprise',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    company = EXCLUDED.company,
    subscription_plan = EXCLUDED.subscription_plan,
    subscription_status = EXCLUDED.subscription_status,
    updated_at = NOW();

-- 3. Verificar se o perfil foi criado
SELECT id, email, name, role, company, subscription_plan, created_at 
FROM public.user_profiles 
WHERE id = '71f0cbbb-1963-430c-b445-78907e747574';

-- 4. Verificar se o usuário existe no auth.users
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE id = '71f0cbbb-1963-430c-b445-78907e747574';