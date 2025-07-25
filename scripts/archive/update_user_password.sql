-- Script para atualizar senha do usuário agencyowner@test.com
-- Execute no Supabase SQL Editor

-- 1. Atualizar senha no auth.users (criptografada)
UPDATE auth.users 
SET 
  encrypted_password = crypt('test123', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'agencyowner@test.com';

-- 2. Verificar se a atualização funcionou
SELECT 
  id, 
  email, 
  created_at,
  updated_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'agencyowner@test.com';

-- 3. Verificar perfil do usuário
SELECT 
  id,
  email,
  name,
  role,
  company,
  created_at
FROM public.user_profiles 
WHERE email = 'agencyowner@test.com';

-- 4. Se não existir perfil, criar um
INSERT INTO public.user_profiles (
  id, 
  email, 
  name, 
  role, 
  company, 
  created_at, 
  updated_at
)
SELECT 
  u.id,
  u.email,
  'Test Agency Owner',
  'agency_owner',
  'Test Agency',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'agencyowner@test.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_profiles p 
  WHERE p.email = u.email
);

-- 5. Resultado final - mostrar dados do usuário
SELECT 
  'SUCESSO: Usuário atualizado!' as status,
  u.email,
  p.name,
  p.role,
  p.company
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE u.email = 'agencyowner@test.com';