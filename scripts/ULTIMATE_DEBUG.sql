-- Debug final - investigar a função em detalhes

-- 1. VERIFICAR todos os emails em auth.users (incluindo case variations)
SELECT 'TODOS AUTH.USERS' as check_type, email, id, created_at 
FROM auth.users 
ORDER BY email;

-- 2. VERIFICAR todos os emails em user_profiles
SELECT 'TODOS USER_PROFILES' as check_type, email, id, name 
FROM user_profiles 
ORDER BY email;

-- 3. LIMPAR TODOS os usuários de teste (força bruta)
DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%test%' OR email LIKE '%exemplo%' OR email LIKE '%agencyteste%'
);

DELETE FROM user_profiles 
WHERE email LIKE '%test%' OR email LIKE '%exemplo%' OR email LIKE '%agencyteste%';

DELETE FROM auth.users 
WHERE email LIKE '%test%' OR email LIKE '%exemplo%' OR email LIKE '%agencyteste%';

-- 4. VERIFICAR se a limpeza funcionou
SELECT 'APOS LIMPEZA AUTH' as status, COUNT(*) as total FROM auth.users;
SELECT 'APOS LIMPEZA PROFILES' as status, COUNT(*) as total FROM user_profiles;

-- 5. MODIFICAR temporariamente a função para dar mais detalhes
CREATE OR REPLACE FUNCTION public.debug_create_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT,
  p_agency_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_existing_user UUID;
  v_encrypted_password TEXT;
  v_agency_exists BOOLEAN;
BEGIN
  -- Log do que está sendo testado
  RAISE NOTICE 'Testando email: %', p_email;
  RAISE NOTICE 'Agency ID: %', p_agency_id;
  
  -- Verificar se agency existe
  SELECT EXISTS(SELECT 1 FROM agencies WHERE id = p_agency_id) INTO v_agency_exists;
  RAISE NOTICE 'Agency existe: %', v_agency_exists;
  
  -- Check if user already exists (com log)
  SELECT id INTO v_existing_user FROM auth.users WHERE email = LOWER(p_email);
  RAISE NOTICE 'Usuario existente encontrado: %', v_existing_user;
  
  IF v_existing_user IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'DEBUG: Usuário já existe com este email: ' || v_existing_user);
  END IF;

  -- Se chegou aqui, email não existe
  RETURN json_build_object('success', true, 'message', 'Email disponível para criação');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'DEBUG ERROR: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 6. TESTAR a função de debug
SELECT 'DEBUG TEST' as teste, public.debug_create_user(
  'debug_email_novo@teste.com',
  'senha123',
  'Debug User',
  'agency_staff',
  (SELECT id FROM agencies LIMIT 1)
);