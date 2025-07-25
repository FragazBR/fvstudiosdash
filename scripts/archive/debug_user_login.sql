-- Debug: Verificar usuário agencyowner@test.com
-- Execute no Supabase SQL Editor

-- 1. Verificar se usuário existe no auth.users
SELECT 
  'auth.users' as tabela,
  id,
  email,
  encrypted_password IS NOT NULL as tem_senha,
  email_confirmed_at IS NOT NULL as email_confirmado,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'agencyowner@test.com';

-- 2. Verificar se perfil existe
SELECT 
  'user_profiles' as tabela,
  id,
  email,
  name,
  role,
  company,
  created_at
FROM public.user_profiles 
WHERE email = 'agencyowner@test.com';

-- 3. Se usuário não existir, criar tudo do zero
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Verificar se usuário já existe
    SELECT id INTO user_id FROM auth.users WHERE email = 'agencyowner@test.com';
    
    IF user_id IS NULL THEN
        -- Criar usuário no auth
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            aud,
            role
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'agencyowner@test.com',
            crypt('test123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            '',
            'authenticated',
            'authenticated'
        ) RETURNING id INTO user_id;
        
        RAISE NOTICE 'Usuário criado no auth.users com ID: %', user_id;
    ELSE
        -- Atualizar senha do usuário existente
        UPDATE auth.users 
        SET 
            encrypted_password = crypt('test123', gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW(),
            aud = 'authenticated',
            role = 'authenticated'
        WHERE id = user_id;
        
        RAISE NOTICE 'Senha atualizada para usuário ID: %', user_id;
    END IF;
    
    -- Criar ou atualizar perfil
    INSERT INTO public.user_profiles (
        id,
        email,
        name,
        role,
        company,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'agencyowner@test.com',
        'Test Agency Owner',
        'agency_owner',
        'Test Agency',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        company = EXCLUDED.company,
        updated_at = NOW();
        
    RAISE NOTICE 'Perfil criado/atualizado para usuário ID: %', user_id;
END
$$;

-- 4. Verificar resultado final
SELECT 
  'RESULTADO FINAL' as status,
  u.id,
  u.email,
  u.encrypted_password IS NOT NULL as tem_senha,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  u.aud,
  u.role as auth_role,
  p.name,
  p.role as profile_role,
  p.company
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE u.email = 'agencyowner@test.com';

-- 5. Testar se a senha está correta (deve retornar true)
SELECT 
  'TESTE SENHA' as teste,
  (encrypted_password = crypt('test123', encrypted_password)) as senha_correta
FROM auth.users 
WHERE email = 'agencyowner@test.com';