-- ===================================================
-- Fix RLS Policies para user_profiles
-- Execute no SQL Editor do Supabase se houver problemas de acesso
-- ===================================================

-- 1. Verificar políticas atuais
SELECT schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 2. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 3. Se necessário, desabilitar RLS temporariamente para debug
-- (NÃO USAR EM PRODUÇÃO)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Ou criar/ajustar policies para permitir acesso
-- Política para permitir que usuários vejam seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para permitir que usuários atualizem seu próprio perfil  
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para permitir inserção de novos perfis
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política específica para admins (acesso total)
DROP POLICY IF EXISTS "Admins can access all profiles" ON user_profiles;
CREATE POLICY "Admins can access all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Reabilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Testar acesso - este comando deve retornar dados se estiver funcionando
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    subscription_plan,
    created_at
FROM user_profiles
WHERE role = 'admin'
LIMIT 5;

-- 7. Se ainda não funcionar, criar uma política mais permissiva temporariamente
-- (REMOVER DEPOIS EM PRODUÇÃO)
/*
DROP POLICY IF EXISTS "Temporary allow all" ON user_profiles;
CREATE POLICY "Temporary allow all" ON user_profiles
    FOR ALL USING (true);
*/