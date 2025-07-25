-- Corrigir problema: tabela agencies vazia

-- 1. VERIFICAR se a tabela agencies existe e está vazia
SELECT 'AGENCIES STATUS' as status, COUNT(*) as total FROM agencies;

-- 2. CRIAR uma agency básica para testes
INSERT INTO agencies (
  name, 
  email, 
  phone, 
  website,
  subscription_plan,
  subscription_status,
  created_at,
  updated_at
) VALUES (
  'FVStudios Agency',
  'admin@fvstudios.com',
  '+55 11 99999-9999',
  'https://fvstudios.com.br',
  'enterprise',
  'active',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 3. VERIFICAR se foi criada
SELECT 'AGENCY CRIADA' as status, id, name, email FROM agencies LIMIT 1;

-- 4. AGORA TESTAR a função create_user_with_profile
SELECT 'TESTE COM AGENCY' as teste, public.create_user_with_profile(
  'agencyteste_' || EXTRACT(epoch FROM NOW())::text || '@test.com',
  'senha123',
  'Teste Com Agency',
  'agency_staff',
  (SELECT id FROM agencies LIMIT 1),
  'Empresa Teste',
  '11999999999'
);

-- 5. VERIFICAR se o usuário foi criado
SELECT 'USUARIO CRIADO' as status, email, name, role, agency_id
FROM user_profiles 
WHERE email LIKE 'agencyteste_%@test.com';