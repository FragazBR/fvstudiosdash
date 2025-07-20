-- ==========================================
-- SISTEMA DE GESTÃO DE USUÁRIOS PELO ADMIN
-- ==========================================
-- Adicionar tabelas e funções para admin gerenciar usuários

-- Tabela de convites pendentes
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados do usuário a ser criado
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'client',
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  company VARCHAR(255),
  phone VARCHAR(20),
  
  -- Configurações do convite
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days') NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados opcionais
  welcome_message TEXT,
  temp_password VARCHAR(255), -- senha temporária gerada
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de logs de ações do admin
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- create_user, delete_user, update_user, create_agency, etc
  target_type VARCHAR(50), -- user, agency, project, etc
  target_id UUID,
  
  -- Detalhes da ação
  action_description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- dados adicionais da ação
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- CONSTRAINTS E VALIDAÇÕES
-- ==========================================

DO $$
BEGIN
  -- User invitations
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'user_invitations_role_check') THEN
    ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_role_check 
    CHECK (role IN ('admin', 'agency_owner', 'agency_staff', 'client'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'user_invitations_status_check') THEN
    ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));
  END IF;
END $$;

-- ==========================================
-- ÍNDICES
-- ==========================================

DO $$
BEGIN
  -- User invitations indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_invitations_token') THEN
    CREATE UNIQUE INDEX idx_user_invitations_token ON public.user_invitations(invitation_token);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_invitations_status') THEN
    CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_invitations_expires_at') THEN
    CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations(expires_at);
  END IF;

  -- Admin actions indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_actions_admin_id') THEN
    CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_actions_created_at') THEN
    CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at);
  END IF;
END $$;

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- ===== USER INVITATIONS =====
  
  -- Admin pode gerenciar todos os convites
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'Admin can manage all invitations') THEN
    CREATE POLICY "Admin can manage all invitations" ON public.user_invitations FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- Agency owners podem gerenciar convites de sua agência
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'Agency owners can manage agency invitations') THEN
    CREATE POLICY "Agency owners can manage agency invitations" ON public.user_invitations FOR ALL 
    USING (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'agency_owner'
      )
    )
    WITH CHECK (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'agency_owner'
      )
    );
  END IF;

  -- ===== ADMIN ACTIONS =====
  
  -- Admin pode ver todos os logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'Admin can view all actions') THEN
    CREATE POLICY "Admin can view all actions" ON public.admin_actions FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- Sistema pode inserir logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_actions' AND policyname = 'System can log actions') THEN
    CREATE POLICY "System can log actions" ON public.admin_actions FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ==========================================
-- FUNÇÕES PRINCIPAIS
-- ==========================================

-- Função para criar convite de usuário
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_email VARCHAR(255),
  p_name VARCHAR(255),
  p_role VARCHAR(50),
  p_agency_id UUID DEFAULT NULL,
  p_company VARCHAR(255) DEFAULT NULL,
  p_phone VARCHAR(20) DEFAULT NULL,
  p_welcome_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_data RECORD;
    invitation_id UUID;
    invitation_token VARCHAR(255);
    temp_password VARCHAR(12);
BEGIN
    -- Verificar se o usuário atual é admin ou agency_owner
    SELECT id, role, agency_id INTO admin_data 
    FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'agency_owner');
    
    IF admin_data IS NULL THEN
        RETURN '{"error": "Unauthorized: Only admins and agency owners can create invitations"}';
    END IF;
    
    -- Se é agency_owner, só pode convidar para sua própria agência
    IF admin_data.role = 'agency_owner' AND (p_agency_id IS NULL OR p_agency_id != admin_data.agency_id) THEN
        RETURN '{"error": "Agency owners can only invite users to their own agency"}';
    END IF;
    
    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = p_email) THEN
        RETURN '{"error": "User with this email already exists"}';
    END IF;
    
    -- Verificar se já existe convite pendente
    IF EXISTS (SELECT 1 FROM public.user_invitations WHERE email = p_email AND status = 'pending' AND expires_at > now()) THEN
        RETURN '{"error": "Pending invitation already exists for this email"}';
    END IF;
    
    -- Gerar token e senha temporária
    invitation_token := encode(gen_random_bytes(32), 'base64');
    temp_password := encode(gen_random_bytes(8), 'base64');
    
    -- Criar convite
    INSERT INTO public.user_invitations (
        email, invited_by, name, role, agency_id, company, phone, 
        invitation_token, temp_password, welcome_message
    ) VALUES (
        p_email, auth.uid(), p_name, p_role, p_agency_id, p_company, p_phone,
        invitation_token, temp_password, p_welcome_message
    ) RETURNING id INTO invitation_id;
    
    -- Log da ação
    INSERT INTO public.admin_actions (
        admin_id, action_type, target_type, target_id, action_description, metadata
    ) VALUES (
        auth.uid(), 'create_invitation', 'user_invitation', invitation_id,
        format('Created invitation for %s (%s) with role %s', p_name, p_email, p_role),
        json_build_object('email', p_email, 'role', p_role, 'agency_id', p_agency_id)
    );
    
    RETURN json_build_object(
        'success', true,
        'invitation_id', invitation_id,
        'invitation_token', invitation_token,
        'temp_password', temp_password,
        'invitation_url', format('https://dashboard.fvstudios.com/accept-invitation?token=%s', invitation_token)
    );
END;
$$;

-- Função para aceitar convite e criar usuário
CREATE OR REPLACE FUNCTION public.accept_user_invitation(
  p_token VARCHAR(255),
  p_password VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_data RECORD;
    new_user_id UUID;
BEGIN
    -- Buscar convite válido
    SELECT * INTO invitation_data 
    FROM public.user_invitations 
    WHERE invitation_token = p_token 
      AND status = 'pending' 
      AND expires_at > now();
    
    IF invitation_data IS NULL THEN
        RETURN '{"error": "Invalid or expired invitation token"}';
    END IF;
    
    -- Verificar se email já existe (double check)
    IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = invitation_data.email) THEN
        RETURN '{"error": "User with this email already exists"}';
    END IF;
    
    -- Gerar UUID para o novo usuário
    new_user_id := gen_random_uuid();
    
    -- Criar perfil do usuário
    INSERT INTO public.user_profiles (
        id, email, name, role, agency_id, company, phone, subscription_status
    ) VALUES (
        new_user_id, invitation_data.email, invitation_data.name, invitation_data.role, 
        invitation_data.agency_id, invitation_data.company, invitation_data.phone, 'active'
    );
    
    -- Se é cliente, criar configuração de API
    IF invitation_data.role = 'client' THEN
        INSERT INTO public.client_api_configs (client_id) 
        VALUES (new_user_id) 
        ON CONFLICT (client_id) DO NOTHING;
    END IF;
    
    -- Marcar convite como aceito
    UPDATE public.user_invitations 
    SET status = 'accepted', accepted_at = now(), updated_at = now()
    WHERE id = invitation_data.id;
    
    -- Log da ação
    INSERT INTO public.admin_actions (
        admin_id, action_type, target_type, target_id, action_description, metadata
    ) VALUES (
        invitation_data.invited_by, 'accept_invitation', 'user', new_user_id,
        format('User %s (%s) accepted invitation and was created', invitation_data.name, invitation_data.email),
        json_build_object('invitation_id', invitation_data.id, 'user_id', new_user_id)
    );
    
    -- Criar notificação para quem convidou
    INSERT INTO public.notifications (
        title, message, type, priority, user_id, related_entity_type, related_entity_id
    ) VALUES (
        'Convite Aceito',
        format('O usuário %s (%s) aceitou seu convite e já pode acessar o sistema.', invitation_data.name, invitation_data.email),
        'success',
        'medium',
        invitation_data.invited_by,
        'user',
        new_user_id
    );
    
    RETURN json_build_object(
        'success', true,
        'user_id', new_user_id,
        'message', 'Invitation accepted successfully. Account created.',
        'redirect_to', '/login'
    );
END;
$$;

-- Função para listar convites pendentes
CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    company VARCHAR(255),
    agency_name VARCHAR(255),
    invited_by_name VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role VARCHAR(50);
    user_agency_id UUID;
BEGIN
    -- Verificar role do usuário atual
    SELECT up.role, up.agency_id INTO user_role, user_agency_id
    FROM public.user_profiles up 
    WHERE up.id = auth.uid();
    
    IF user_role IS NULL THEN
        RETURN;
    END IF;
    
    -- Admin vê todos os convites
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT 
            ui.id,
            ui.email,
            ui.name,
            ui.role,
            ui.company,
            a.name as agency_name,
            up.name as invited_by_name,
            ui.expires_at,
            ui.created_at
        FROM public.user_invitations ui
        LEFT JOIN public.agencies a ON ui.agency_id = a.id
        LEFT JOIN public.user_profiles up ON ui.invited_by = up.id
        WHERE ui.status = 'pending' AND ui.expires_at > now()
        ORDER BY ui.created_at DESC;
    
    -- Agency owner vê apenas convites de sua agência
    ELSIF user_role = 'agency_owner' THEN
        RETURN QUERY
        SELECT 
            ui.id,
            ui.email,
            ui.name,
            ui.role,
            ui.company,
            a.name as agency_name,
            up.name as invited_by_name,
            ui.expires_at,
            ui.created_at
        FROM public.user_invitations ui
        LEFT JOIN public.agencies a ON ui.agency_id = a.id
        LEFT JOIN public.user_profiles up ON ui.invited_by = up.id
        WHERE ui.status = 'pending' 
          AND ui.expires_at > now()
          AND ui.agency_id = user_agency_id
        ORDER BY ui.created_at DESC;
    END IF;
END;
$$;

-- Função para cancelar convite
CREATE OR REPLACE FUNCTION public.cancel_invitation(p_invitation_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_data RECORD;
    user_role VARCHAR(50);
    user_agency_id UUID;
BEGIN
    -- Verificar dados do usuário atual
    SELECT role, agency_id INTO user_role, user_agency_id
    FROM public.user_profiles WHERE id = auth.uid();
    
    -- Buscar convite
    SELECT * INTO invitation_data 
    FROM public.user_invitations 
    WHERE id = p_invitation_id AND status = 'pending';
    
    IF invitation_data IS NULL THEN
        RETURN '{"error": "Invitation not found or already processed"}';
    END IF;
    
    -- Verificar permissões
    IF user_role = 'agency_owner' AND invitation_data.agency_id != user_agency_id THEN
        RETURN '{"error": "You can only cancel invitations for your own agency"}';
    END IF;
    
    IF user_role NOT IN ('admin', 'agency_owner') THEN
        RETURN '{"error": "Unauthorized"}';
    END IF;
    
    -- Cancelar convite
    UPDATE public.user_invitations 
    SET status = 'cancelled', updated_at = now()
    WHERE id = p_invitation_id;
    
    -- Log da ação
    INSERT INTO public.admin_actions (
        admin_id, action_type, target_type, target_id, action_description
    ) VALUES (
        auth.uid(), 'cancel_invitation', 'user_invitation', p_invitation_id,
        format('Cancelled invitation for %s (%s)', invitation_data.name, invitation_data.email)
    );
    
    RETURN json_build_object('success', true, 'message', 'Invitation cancelled successfully');
END;
$$;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger para updated_at
CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON public.user_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DADOS INICIAIS
-- ==========================================

-- Marcar convites expirados automaticamente (função para ser executada periodicamente)
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.user_invitations 
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending' AND expires_at <= now();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    RETURN expired_count;
END;
$$;

SELECT 'Sistema de gestão de usuários pelo admin criado!' AS status,
       'Funções: 4, Tabelas: 2, Admin pode criar usuários pelo dashboard' AS summary;
