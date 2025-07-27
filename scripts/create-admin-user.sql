-- ===================================================
-- Script para criar usuário admin no Supabase
-- Execute este script no SQL Editor do Supabase
-- ===================================================

-- 1. Primeiro, vamos verificar a estrutura da tabela user_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Verificar se já existe algum usuário admin
SELECT id, email, full_name, role, created_at 
FROM user_profiles 
WHERE role = 'admin';

-- 3. Verificar usuários na auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email LIKE '%@admin%' OR email LIKE '%admin%';

-- 4. CRIAR USUÁRIO ADMIN (substitua os dados pelos seus)
-- Primeiro criar o usuário no auth.users (isso deve ser feito via Supabase dashboard)
-- Depois executar:

-- IMPORTANTE: Substitua 'seu-email@admin.com' pelo email que você quer usar como admin
-- E substitua 'user-id-from-auth-users' pelo UUID gerado quando criar o usuário

DO $$
DECLARE
    admin_email TEXT := 'admin@fvstudios.com'; -- ALTERE AQUI
    admin_user_id UUID;
BEGIN
    -- Verificar se o usuário existe na auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'ATENÇÃO: Usuário % não encontrado na tabela auth.users. Você precisa criar primeiro no Supabase Dashboard Authentication.', admin_email;
    ELSE
        -- Verificar se já existe na user_profiles
        IF EXISTS (SELECT 1 FROM user_profiles WHERE id = admin_user_id) THEN
            -- Atualizar para admin se já existe
            UPDATE user_profiles 
            SET 
                role = 'admin',
                subscription_plan = 'enterprise',
                subscription_status = 'active',
                updated_at = NOW()
            WHERE id = admin_user_id;
            
            RAISE NOTICE 'Usuário % atualizado para admin com sucesso!', admin_email;
        ELSE
            -- Criar novo perfil admin
            INSERT INTO user_profiles (
                id,
                email,
                full_name,
                role,
                subscription_plan,
                subscription_status,
                created_at,
                updated_at
            ) VALUES (
                admin_user_id,
                admin_email,
                'Administrador FVStudios',
                'admin',
                'enterprise',
                'active',
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Perfil admin criado com sucesso para %!', admin_email;
        END IF;
    END IF;
END $$;

-- 5. Verificar se foi criado corretamente
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.subscription_plan,
    up.subscription_status,
    au.email_confirmed_at
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.role = 'admin';

-- 6. Se necessário, habilitar RLS policies para admin
-- Verificar policies existentes
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 7. Script alternativo para criar manualmente (se precisar)
/*
-- Se você souber o UUID do usuário da auth.users, use este insert direto:
INSERT INTO user_profiles (
    id, -- UUID do auth.users
    email,
    full_name,
    role,
    subscription_plan,
    subscription_status
) VALUES (
    'cole-aqui-o-uuid-do-auth-users',
    'admin@fvstudios.com',
    'Administrador FVStudios', 
    'admin',
    'enterprise',
    'active'
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    subscription_plan = 'enterprise',
    subscription_status = 'active';
*/