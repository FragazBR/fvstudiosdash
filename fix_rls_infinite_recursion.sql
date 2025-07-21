-- CORREÇÃO URGENTE: Infinite Recursion no RLS
-- Execute no Supabase SQL Editor

-- 1. DESABILITAR RLS temporariamente para permitir inserção
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Inserir perfil admin diretamente
INSERT INTO public.user_profiles (
    id,
    email,
    name,
    role,
    company,
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
    'enterprise',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 3. Verificar se foi inserido
SELECT id, email, name, role, created_at 
FROM public.user_profiles 
WHERE id = '71f0cbbb-1963-430c-b445-78907e747574';

-- 4. REABILITAR RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. CORRIGIR POLÍTICAS RLS problemáticas
-- Remover políticas que podem causar recursão infinita
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Recriar políticas RLS mais simples para evitar recursão
CREATE POLICY "Users can read own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política especial para admin (sem recursão)
CREATE POLICY "Admin can read all profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.id = '71f0cbbb-1963-430c-b445-78907e747574'
        )
    );

-- 6. Testar consulta admin
SELECT id, email, name, role 
FROM public.user_profiles 
WHERE id = '71f0cbbb-1963-430c-b445-78907e747574';