-- Create user with profile function for direct user creation
-- This function creates a user directly in auth.users and user_profiles

CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT,
  p_agency_id UUID,
  p_company TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_existing_user UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Validar se o role é válido
  IF p_role NOT IN ('agency_manager', 'agency_staff', 'agency_client') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Role inválido. Deve ser agency_manager, agency_staff ou agency_client'
    );
  END IF;

  -- Verificar se o usuário já existe
  SELECT id INTO v_existing_user
  FROM auth.users
  WHERE email = LOWER(p_email);

  IF v_existing_user IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário já existe com este email'
    );
  END IF;

  -- Validar senha (mínimo 6 caracteres)
  IF LENGTH(p_password) < 6 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Senha deve ter pelo menos 6 caracteres'
    );
  END IF;

  -- Gerar ID para o usuário
  v_user_id := gen_random_uuid();

  -- Criptografar a senha usando crypt do Supabase
  v_encrypted_password := crypt(p_password, gen_salt('bf'));

  -- Inserir usuário na tabela auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    LOWER(p_email),
    v_encrypted_password,
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Inserir perfil na tabela user_profiles
  INSERT INTO user_profiles (
    id,
    email,
    name,
    role,
    agency_id,
    company,
    phone,
    subscription_plan,
    subscription_status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    LOWER(p_email),
    p_name,
    p_role,
    p_agency_id,
    p_company,
    p_phone,
    'basic',
    'active',
    NOW(),
    NOW()
  );

  -- Inserir na tabela identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id::text, LOWER(p_email))::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Usuário criado com sucesso',
    'data', json_build_object(
      'email', p_email,
      'name', p_name,
      'role', p_role,
      'agency_id', p_agency_id
    )
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email já está em uso'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.create_user_with_profile TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.create_user_with_profile IS 'Cria usuário diretamente no auth.users e user_profiles com senha para login imediato';