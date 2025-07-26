-- Script para testar se a função create_user_with_profile está funcionando

-- 1. Verificar se a extensão pgcrypto está habilitada
SELECT name, installed_version FROM pg_available_extensions WHERE name = 'pgcrypto';

-- 2. Se não estiver, habilitar
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Verificar se a função existe
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'create_user_with_profile';

-- 4. Testar a função (ajuste os parâmetros)
-- IMPORTANTE: Use um email de teste que não existe no sistema!
SELECT public.create_user_with_profile(
  'teste@exemplo.com',  -- p_email (USE UM EMAIL DE TESTE!)
  'senha123',           -- p_password
  'Usuário Teste',      -- p_name
  'agency_staff',       -- p_role
  (SELECT id FROM agencies LIMIT 1), -- p_agency_id (pega o primeiro agency_id)
  'Empresa Teste',      -- p_company
  '11999999999'        -- p_phone
);

-- 5. Verificar se o usuário foi criado (rode APÓS o teste)
-- SELECT email, name, role FROM user_profiles WHERE email = 'teste@exemplo.com';

-- 6. Limpar o teste (rode APÓS verificar)
-- DELETE FROM user_profiles WHERE email = 'teste@exemplo.com';
-- DELETE FROM auth.users WHERE email = 'teste@exemplo.com';
-- DELETE FROM auth.identities WHERE identity_data->>'email' = 'teste@exemplo.com';