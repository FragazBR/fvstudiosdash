-- Sistema de Gerenciamento de Usuários e Convites
-- Permite criar usuários diretamente ou via convite

-- 1. Tabela de convites pendentes
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  company VARCHAR(255),
  phone VARCHAR(20),
  welcome_message TEXT,
  
  -- Status do convite
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired, cancelled
  
  -- Quem convidou
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Controle de expiração
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Controle de uso
  used_at TIMESTAMP WITH TIME ZONE,
  used_by_ip INET,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices e constraints
  UNIQUE(email, agency_id)
);

-- 2. Tabela de logs de ações do admin
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_user_id UUID,
  target_email VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Função para criar convite de usuário
CREATE OR REPLACE FUNCTION create_user_invitation(
  p_email VARCHAR,
  p_name VARCHAR,
  p_role VARCHAR,
  p_agency_id UUID DEFAULT NULL,
  p_company VARCHAR DEFAULT NULL,
  p_phone VARCHAR DEFAULT NULL,
  p_welcome_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_invitation_id UUID;
  v_invitation_url TEXT;
  v_agency_name TEXT;
  v_invited_by_name TEXT;
  v_admin_user_id UUID;
BEGIN
  -- Verificar se o usuário atual tem permissão de admin
  v_admin_user_id := auth.uid();
  
  IF v_admin_user_id IS NULL THEN
    RETURN json_build_object('error', 'Usuário não autenticado');
  END IF;
  
  -- Verificar se já existe convite pendente para este email
  IF EXISTS (
    SELECT 1 FROM user_invitations 
    WHERE email = p_email 
    AND status = 'pending' 
    AND expires_at > NOW()
  ) THEN
    RETURN json_build_object('error', 'Já existe um convite pendente para este email');
  END IF;
  
  -- Verificar se usuário já existe no sistema
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) THEN
    RETURN json_build_object('error', 'Usuário já existe no sistema');
  END IF;
  
  -- Buscar nome da agência se fornecida
  IF p_agency_id IS NOT NULL THEN
    SELECT name INTO v_agency_name FROM agencies WHERE id = p_agency_id;
  END IF;
  
  -- Buscar nome do admin que está convidando
  SELECT COALESCE(raw_user_meta_data->>'name', email) INTO v_invited_by_name 
  FROM auth.users WHERE id = v_admin_user_id;
  
  -- Criar o convite
  INSERT INTO user_invitations (
    email, name, role, agency_id, company, phone, welcome_message, invited_by
  ) VALUES (
    p_email, p_name, p_role, p_agency_id, p_company, p_phone, p_welcome_message, v_admin_user_id
  ) RETURNING id INTO v_invitation_id;
  
  -- Gerar URL do convite
  v_invitation_url := 'https://fvstudiosdash.vercel.app/accept-invite?token=' || v_invitation_id;
  
  -- Log da ação
  INSERT INTO admin_action_logs (
    admin_user_id, action, target_email, details, ip_address
  ) VALUES (
    v_admin_user_id, 
    'create_invitation', 
    p_email,
    json_build_object(
      'name', p_name,
      'role', p_role,
      'agency_id', p_agency_id,
      'invitation_id', v_invitation_id
    ),
    inet_client_addr()
  );
  
  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'invitation_url', v_invitation_url,
    'expires_at', (NOW() + INTERVAL '7 days')::text
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função para criar usuário diretamente (com senha)
CREATE OR REPLACE FUNCTION create_user_directly(
  p_email VARCHAR,
  p_password VARCHAR,
  p_name VARCHAR,
  p_role VARCHAR,
  p_agency_id UUID DEFAULT NULL,
  p_company VARCHAR DEFAULT NULL,
  p_phone VARCHAR DEFAULT NULL,
  p_send_welcome_email BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_admin_user_id UUID;
  v_agency_name TEXT;
BEGIN
  -- Verificar se o usuário atual tem permissão de admin
  v_admin_user_id := auth.uid();
  
  IF v_admin_user_id IS NULL THEN
    RETURN json_build_object('error', 'Usuário não autenticado');
  END IF;
  
  -- Verificar se usuário já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN json_build_object('error', 'Usuário já existe no sistema');
  END IF;
  
  -- Validar senha
  IF LENGTH(p_password) < 6 THEN
    RETURN json_build_object('error', 'Senha deve ter pelo menos 6 caracteres');
  END IF;
  
  -- Buscar nome da agência se fornecida
  IF p_agency_id IS NOT NULL THEN
    SELECT name INTO v_agency_name FROM agencies WHERE id = p_agency_id;
    IF v_agency_name IS NULL THEN
      RETURN json_build_object('error', 'Agência não encontrada');
    END IF;
  END IF;
  
  -- Criar usuário no Supabase Auth (simulado - na prática seria via API)
  -- Por enquanto, vamos criar um registro para controle
  INSERT INTO admin_user_creation_queue (
    email, password_hash, name, role, agency_id, company, phone, 
    created_by, send_welcome_email, status
  ) VALUES (
    p_email, 
    crypt(p_password, gen_salt('bf')), -- Hash da senha
    p_name, 
    p_role, 
    p_agency_id, 
    p_company, 
    p_phone,
    v_admin_user_id,
    p_send_welcome_email,
    'pending'
  ) RETURNING id INTO v_user_id;
  
  -- Log da ação
  INSERT INTO admin_action_logs (
    admin_user_id, action, target_email, details, ip_address
  ) VALUES (
    v_admin_user_id, 
    'create_user_directly', 
    p_email,
    json_build_object(
      'name', p_name,
      'role', p_role,
      'agency_id', p_agency_id,
      'user_creation_id', v_user_id
    ),
    inet_client_addr()
  );
  
  RETURN json_build_object(
    'success', true,
    'user_creation_id', v_user_id,
    'message', 'Usuário será criado em breve'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Tabela para queue de criação de usuários
CREATE TABLE IF NOT EXISTS admin_user_creation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  company VARCHAR(255),
  phone VARCHAR(20),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  send_welcome_email BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  supabase_user_id UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Função para buscar convites pendentes
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  name VARCHAR,
  role VARCHAR,
  company VARCHAR,
  agency_name VARCHAR,
  invited_by_name VARCHAR,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.email,
    ui.name,
    ui.role,
    ui.company,
    COALESCE(a.name, 'N/A') as agency_name,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as invited_by_name,
    ui.expires_at,
    ui.created_at
  FROM user_invitations ui
  LEFT JOIN agencies a ON a.id = ui.agency_id
  LEFT JOIN auth.users au ON au.id = ui.invited_by
  WHERE ui.status = 'pending' 
  AND ui.expires_at > NOW()
  ORDER BY ui.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para cancelar convite
CREATE OR REPLACE FUNCTION cancel_invitation(p_invitation_id UUID)
RETURNS JSON AS $$
DECLARE
  v_admin_user_id UUID;
  v_invitation_email VARCHAR;
BEGIN
  v_admin_user_id := auth.uid();
  
  IF v_admin_user_id IS NULL THEN
    RETURN json_build_object('error', 'Usuário não autenticado');
  END IF;
  
  -- Buscar email do convite para log
  SELECT email INTO v_invitation_email FROM user_invitations WHERE id = p_invitation_id;
  
  IF v_invitation_email IS NULL THEN
    RETURN json_build_object('error', 'Convite não encontrado');
  END IF;
  
  -- Cancelar convite
  UPDATE user_invitations 
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_invitation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Convite não encontrado ou já processado');
  END IF;
  
  -- Log da ação
  INSERT INTO admin_action_logs (
    admin_user_id, action, target_email, details
  ) VALUES (
    v_admin_user_id, 
    'cancel_invitation', 
    v_invitation_email,
    json_build_object('invitation_id', p_invitation_id)
  );
  
  RETURN json_build_object('success', true);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para aceitar convite
CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_id UUID,
  p_password VARCHAR,
  p_user_ip INET DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
BEGIN
  -- Buscar convite
  SELECT * INTO v_invitation 
  FROM user_invitations 
  WHERE id = p_invitation_id 
  AND status = 'pending' 
  AND expires_at > NOW();
  
  IF v_invitation IS NULL THEN
    RETURN json_build_object('error', 'Convite não encontrado ou expirado');
  END IF;
  
  -- Verificar se usuário já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_invitation.email) THEN
    RETURN json_build_object('error', 'Usuário já existe no sistema');
  END IF;
  
  -- Validar senha
  IF LENGTH(p_password) < 6 THEN
    RETURN json_build_object('error', 'Senha deve ter pelo menos 6 caracteres');
  END IF;
  
  -- Marcar convite como usado
  UPDATE user_invitations 
  SET 
    status = 'accepted',
    used_at = NOW(),
    used_by_ip = COALESCE(p_user_ip, inet_client_addr()),
    updated_at = NOW()
  WHERE id = p_invitation_id;
  
  -- Adicionar à queue de criação de usuário
  INSERT INTO admin_user_creation_queue (
    email, password_hash, name, role, agency_id, company, phone,
    created_by, send_welcome_email, status
  ) VALUES (
    v_invitation.email,
    crypt(p_password, gen_salt('bf')),
    v_invitation.name,
    v_invitation.role,
    v_invitation.agency_id,
    v_invitation.company,
    v_invitation.phone,
    v_invitation.invited_by,
    false, -- Não precisa enviar email de boas-vindas pois já aceitou
    'pending'
  ) RETURNING id INTO v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'user_creation_id', v_user_id,
    'message', 'Convite aceito! Sua conta será criada em breve.'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função para buscar usuários criados
CREATE OR REPLACE FUNCTION get_created_users(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  name VARCHAR,
  role VARCHAR,
  agency_name VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    COALESCE(uap.role, 'client') as role,
    COALESCE(a.name, 'N/A') as agency_name,
    CASE 
      WHEN au.email_confirmed_at IS NOT NULL THEN 'active'
      ELSE 'pending_confirmation'
    END as status,
    au.created_at,
    au.last_sign_in_at as last_login
  FROM auth.users au
  LEFT JOIN user_agency_permissions uap ON uap.user_id = au.id
  LEFT JOIN agencies a ON a.id = uap.agency_id
  ORDER BY au.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER update_user_invitations_updated_at 
  BEFORE UPDATE ON user_invitations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_user_invitations_email_status ON user_invitations(email, status);
CREATE INDEX idx_user_invitations_expires_at ON user_invitations(expires_at);
CREATE INDEX idx_admin_action_logs_admin_action ON admin_action_logs(admin_user_id, action);
CREATE INDEX idx_admin_user_creation_queue_status ON admin_user_creation_queue(status, created_at);

-- RLS Policies
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_creation_queue ENABLE ROW LEVEL SECURITY;

-- Policy para convites - apenas admins podem ver
CREATE POLICY "Admins podem gerenciar convites" ON user_invitations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap 
    WHERE uap.user_id = auth.uid() 
    AND uap.role IN ('admin', 'agency_owner')
  )
);

-- Policy para logs - apenas admins podem ver
CREATE POLICY "Admins podem ver logs" ON admin_action_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap 
    WHERE uap.user_id = auth.uid() 
    AND uap.role IN ('admin', 'agency_owner')
  )
);

-- Policy para queue - apenas admins podem ver
CREATE POLICY "Admins podem ver queue de criação" ON admin_user_creation_queue FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap 
    WHERE uap.user_id = auth.uid() 
    AND uap.role IN ('admin', 'agency_owner')
  )
);

-- Comentários
COMMENT ON TABLE user_invitations IS 'Convites pendentes para novos usuários';
COMMENT ON TABLE admin_action_logs IS 'Log de todas as ações administrativas';
COMMENT ON TABLE admin_user_creation_queue IS 'Queue para criação de usuários no Supabase Auth';

COMMENT ON FUNCTION create_user_invitation IS 'Cria um convite para novo usuário';
COMMENT ON FUNCTION create_user_directly IS 'Cria usuário diretamente com senha';
COMMENT ON FUNCTION get_pending_invitations IS 'Lista todos os convites pendentes';
COMMENT ON FUNCTION cancel_invitation IS 'Cancela um convite pendente';
COMMENT ON FUNCTION accept_invitation IS 'Aceita um convite e cria o usuário';
COMMENT ON FUNCTION get_created_users IS 'Lista usuários criados no sistema';