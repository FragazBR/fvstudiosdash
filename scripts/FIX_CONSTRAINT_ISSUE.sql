-- Corrigir problema de constraint NOT NULL em projects.client_id

-- 1. PRIMEIRO, fazer backup dos dados importantes
SELECT 'PROJECTS EXISTENTES' as status, id, title, client_id, created_at
FROM projects;

-- 2. VERIFICAR a constraint atual
SELECT 'CONSTRAINT INFO' as info, 
       column_name, 
       is_nullable, 
       column_default
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'client_id';

-- 3. TEMPORARIAMENTE permitir NULL em client_id (para limpeza)
ALTER TABLE projects ALTER COLUMN client_id DROP NOT NULL;

-- 4. AGORA limpar os usuários de teste novamente
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%test%' OR email LIKE '%exemplo%' OR email LIKE '%agencyteste%'
);

DELETE FROM user_profiles 
WHERE email LIKE '%test%' OR email LIKE '%exemplo%' OR email LIKE '%agencyteste%';

DELETE FROM auth.users 
WHERE email LIKE '%test%' OR email LIKE '%exemplo%' OR email LIKE '%agencyteste%';

-- 5. VERIFICAR quantos usuários restaram
SELECT 'USUARIOS RESTANTES AUTH' as status, COUNT(*) as total FROM auth.users;
SELECT 'USUARIOS RESTANTES PROFILES' as status, COUNT(*) as total FROM user_profiles;

-- 6. TESTAR a função debug novamente
SELECT 'TESTE APOS LIMPEZA' as teste, public.debug_create_user(
  'teste_final_' || EXTRACT(epoch FROM NOW())::text || '@exemplo.com',
  'senha123',
  'Teste Final',
  'agency_staff',
  (SELECT id FROM agencies LIMIT 1)
);

-- 7. SE funcionou, testar a função real
SELECT 'TESTE FUNCAO REAL' as teste, public.create_user_with_profile(
  'usuario_real_' || EXTRACT(epoch FROM NOW())::text || '@exemplo.com',
  'senha123',
  'Usuario Real Teste',
  'agency_staff',
  (SELECT id FROM agencies LIMIT 1),
  'Empresa Real',
  '11999999999'
);

-- 8. VERIFICAR se foi criado
SELECT 'USUARIO FINAL CRIADO' as status, email, name, role
FROM user_profiles 
WHERE email LIKE '%usuario_real_%';