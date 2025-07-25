-- Drop existing function first
DROP FUNCTION IF EXISTS public.create_user_invitation;

-- Create user invitation function for team management
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_email TEXT,
  p_name TEXT,
  p_role TEXT,
  p_agency_id UUID,
  p_company TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_welcome_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_invitation_id UUID;
  v_existing_user UUID;
  v_existing_invitation UUID;
  v_inviter_name TEXT;
  v_inviter_company TEXT;
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
    -- Verificar se já está na mesma agência
    IF EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = v_existing_user 
      AND (agency_id = p_agency_id OR id = p_agency_id)
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Usuário já faz parte desta agência'
      );
    END IF;
  END IF;

  -- Verificar se já existe convite pendente
  SELECT id INTO v_existing_invitation
  FROM user_invitations
  WHERE LOWER(email) = LOWER(p_email)
  AND status IN ('pending', 'sent')
  AND (agency_id = p_agency_id OR invited_by = p_agency_id);

  IF v_existing_invitation IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Já existe um convite pendente para este email'
    );
  END IF;

  -- Buscar dados do convitador
  SELECT name, company INTO v_inviter_name, v_inviter_company
  FROM user_profiles
  WHERE id = auth.uid();

  -- Gerar ID para o convite
  v_invitation_id := gen_random_uuid();

  -- Inserir convite
  INSERT INTO user_invitations (
    id,
    email,
    name,
    role,
    agency_id,
    invited_by,
    company,
    phone,
    welcome_message,
    status,
    created_at,
    expires_at
  ) VALUES (
    v_invitation_id,
    LOWER(p_email),
    p_name,
    p_role,
    p_agency_id,
    auth.uid(),
    p_company,
    p_phone,
    COALESCE(p_welcome_message, 'Você foi convidado para fazer parte da nossa equipe!'),
    'pending',
    NOW(),
    NOW() + INTERVAL '7 days'
  );

  -- TODO: Aqui seria integrado o envio de email
  -- Por enquanto, apenas retornamos sucesso

  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'message', 'Convite criado com sucesso',
    'data', json_build_object(
      'email', p_email,
      'name', p_name,
      'role', p_role,
      'expires_at', (NOW() + INTERVAL '7 days')::text
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro interno: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.create_user_invitation TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION public.create_user_invitation IS 'Cria convites para novos membros da equipe da agência';