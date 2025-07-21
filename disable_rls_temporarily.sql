-- CORREÇÃO RADICAL: Desabilitar RLS completamente para testar
-- Execute no Supabase SQL Editor

-- 1. REMOVER TODAS as políticas RLS problemáticas
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- 2. DESABILITAR RLS completamente (temporário para teste)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Testar se consegue consultar agora
SELECT id, email, name, role, created_at 
FROM public.user_profiles 
WHERE id = '71f0cbbb-1963-430c-b445-78907e747574';

-- 4. Verificar todas as políticas existentes (deve estar vazio)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- =======================================
-- DEPOIS DE TESTAR O LOGIN FUNCIONANDO:
-- Execute este bloco para reativar RLS de forma simples
-- =======================================

-- RECRIAR RLS de forma super simples (SEM RECURSÃO)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política simples para admin (hardcoded, sem lookup)
CREATE POLICY "admin_bypass" ON public.user_profiles
    FOR ALL 
    USING (auth.uid()::text = '71f0cbbb-1963-430c-b445-78907e747574');

-- Política para usuários normais (sem recursão)  
CREATE POLICY "user_own_profile" ON public.user_profiles
    FOR ALL 
    USING (auth.uid() = id);

-- Verificar políticas criadas
SELECT policyname, permissive, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_profiles';