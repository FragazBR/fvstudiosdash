-- ===================================================================
-- FVSTUDIOS DASHBOARD - COMPLETE PRODUCTION SETUP
-- ===================================================================
-- This script sets up the complete database from scratch
-- Run this script once in a fresh Supabase project
-- ===================================================================

-- Step 1: Create core tables and relationships
-- ===================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'free_user',
  company TEXT,
  phone TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  agency_id UUID REFERENCES user_profiles(id),
  department_id UUID,
  specialization_id UUID,
  skills JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_role CHECK (role IN (
    'admin', 'agency_owner', 'agency_manager', 'agency_staff', 
    'agency_client', 'independent_producer', 'independent_client', 
    'influencer', 'free_user'
  )),
  CONSTRAINT valid_subscription_plan CHECK (subscription_plan IN (
    'free', 'basic', 'pro', 'enterprise'
  )),
  CONSTRAINT valid_subscription_status CHECK (subscription_status IN (
    'active', 'inactive', 'pending', 'cancelled'
  ))
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  client_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES user_profiles(id),
  budget_total DECIMAL(10,2),
  budget_spent DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN (
    'planning', 'in_progress', 'review', 'completed', 'cancelled'
  )),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'))
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES user_profiles(id),
  created_by UUID REFERENCES user_profiles(id),
  due_date TIMESTAMPTZ,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'in_progress', 'review', 'completed', 'cancelled'
  )),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'))
);

-- User invitations table (for team collaboration)
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL,
  agency_id UUID NOT NULL,
  invited_by UUID REFERENCES user_profiles(id),
  company TEXT,
  phone TEXT,
  welcome_message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  CONSTRAINT valid_role CHECK (role IN (
    'agency_manager', 'agency_staff', 'agency_client'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'sent', 'accepted', 'expired', 'cancelled'
  ))
);

-- Leads table (for website signup processing)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  plan_type TEXT,
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT 'website',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN (
    'new', 'contacted', 'qualified', 'converted', 'lost'
  ))
);

-- Step 2: Create indexes for performance
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- Step 3: Create helper functions
-- ===================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can manage accounts
CREATE OR REPLACE FUNCTION public.can_manage_accounts()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'agency_owner', 'agency_manager') 
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's agency ID
CREATE OR REPLACE FUNCTION public.same_agency()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT COALESCE(agency_id, id) 
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create business logic functions
-- ===================================================================

-- Function to create user with profile (for direct team member creation)
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
  -- Validate role
  IF p_role NOT IN ('agency_manager', 'agency_staff', 'agency_client') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Role inválido. Deve ser agency_manager, agency_staff ou agency_client'
    );
  END IF;

  -- Check if user already exists
  SELECT id INTO v_existing_user FROM auth.users WHERE email = LOWER(p_email);
  IF v_existing_user IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuário já existe com este email');
  END IF;

  -- Validate password
  IF LENGTH(p_password) < 6 THEN
    RETURN json_build_object('success', false, 'error', 'Senha deve ter pelo menos 6 caracteres');
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_password := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    LOWER(p_email), v_encrypted_password, NOW(), NOW(), NOW(), '', '', '', ''
  );

  -- Insert into user_profiles
  INSERT INTO user_profiles (
    id, email, name, role, agency_id, company, phone,
    subscription_plan, subscription_status, created_at, updated_at
  ) VALUES (
    v_user_id, LOWER(p_email), p_name, p_role, p_agency_id, p_company, p_phone,
    'basic', 'active', NOW(), NOW()
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id::text, LOWER(p_email))::jsonb,
    'email', NOW(), NOW(), NOW()
  );

  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Usuário criado com sucesso'
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Email já está em uso');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user invitation (for email-based invites)
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
BEGIN
  -- Validate role
  IF p_role NOT IN ('agency_manager', 'agency_staff', 'agency_client') THEN
    RETURN json_build_object('success', false, 'error', 'Role inválido');
  END IF;

  -- Check if user already exists
  SELECT id INTO v_existing_user FROM auth.users WHERE email = LOWER(p_email);
  IF v_existing_user IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM user_profiles WHERE id = v_existing_user AND (agency_id = p_agency_id OR id = p_agency_id)) THEN
      RETURN json_build_object('success', false, 'error', 'Usuário já faz parte desta agência');
    END IF;
  END IF;

  -- Check if invitation already exists
  SELECT id INTO v_existing_invitation
  FROM user_invitations
  WHERE LOWER(email) = LOWER(p_email) AND status IN ('pending', 'sent')
  AND (agency_id = p_agency_id OR invited_by = p_agency_id);

  IF v_existing_invitation IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Já existe um convite pendente para este email');
  END IF;

  v_invitation_id := gen_random_uuid();

  INSERT INTO user_invitations (
    id, email, name, role, agency_id, invited_by, company, phone,
    welcome_message, status, created_at, expires_at
  ) VALUES (
    v_invitation_id, LOWER(p_email), p_name, p_role, p_agency_id, auth.uid(),
    p_company, p_phone, COALESCE(p_welcome_message, 'Você foi convidado para nossa equipe!'),
    'pending', NOW(), NOW() + INTERVAL '7 days'
  );

  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'message', 'Convite criado com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process website leads (for Stripe integration)
CREATE OR REPLACE FUNCTION public.process_website_lead(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_plan_type TEXT DEFAULT 'basic',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  v_lead_id := gen_random_uuid();
  
  INSERT INTO leads (
    id, name, email, phone, company, message, plan_type, 
    status, source, metadata, created_at, updated_at
  ) VALUES (
    v_lead_id, p_name, LOWER(p_email), p_phone, p_company, p_message, p_plan_type,
    'new', 'website', p_metadata, NOW(), NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'message', 'Lead processado com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create views for API compatibility
-- ===================================================================

-- Clients view (used by API for project relationships)
CREATE OR REPLACE VIEW public.clients AS
SELECT 
  id, name, email, company, phone, avatar_url, created_at, updated_at
FROM public.user_profiles
WHERE role IN ('agency_client', 'independent_client');

-- Step 6: Enable Row Level Security and create policies
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view profiles from their agency" ON user_profiles
  FOR SELECT USING (
    is_admin() OR 
    id = auth.uid() OR 
    COALESCE(agency_id, id) = same_agency()
  );

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin());

-- Projects Policies
CREATE POLICY "Users can view projects from their agency" ON projects
  FOR SELECT USING (
    is_admin() OR
    client_id IN (SELECT id FROM user_profiles WHERE COALESCE(agency_id, id) = same_agency()) OR
    client_id = auth.uid()
  );

CREATE POLICY "Agency members can manage projects" ON projects
  FOR ALL USING (is_admin() OR can_manage_accounts());

-- Tasks Policies
CREATE POLICY "Users can view accessible tasks" ON tasks
  FOR SELECT USING (
    is_admin() OR
    assigned_to = auth.uid() OR
    project_id IN (
      SELECT id FROM projects 
      WHERE client_id IN (SELECT id FROM user_profiles WHERE COALESCE(agency_id, id) = same_agency())
    )
  );

CREATE POLICY "Agency members can manage tasks" ON tasks
  FOR ALL USING (is_admin() OR can_manage_accounts());

-- User Invitations Policies
CREATE POLICY "Users can view their invitations" ON user_invitations
  FOR SELECT USING (invited_by = auth.uid() OR is_admin());

CREATE POLICY "Agency members can manage invitations" ON user_invitations
  FOR ALL USING (can_manage_accounts() OR is_admin());

-- Leads Policies
CREATE POLICY "Agency members can view leads" ON leads
  FOR SELECT USING (can_manage_accounts() OR is_admin());

CREATE POLICY "Agency members can manage leads" ON leads
  FOR ALL USING (can_manage_accounts() OR is_admin());

-- Step 7: Grant permissions
-- ===================================================================

GRANT SELECT ON public.clients TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION public.same_agency TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_with_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_website_lead TO authenticated;

-- Step 8: Create first admin user (replace with your email)
-- ===================================================================

-- IMPORTANT: Change this email to your actual email before running!
DO $$
DECLARE
  v_admin_email TEXT := 'admin@fvstudios.com'; -- CHANGE THIS EMAIL!
  v_admin_password TEXT := 'admin123456';      -- CHANGE THIS PASSWORD!
  v_user_id UUID;
BEGIN
  -- Check if admin already exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin') THEN
    
    v_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_admin_email, crypt(v_admin_password, gen_salt('bf')), 
      NOW(), NOW(), NOW(), '', '', '', ''
    );
    
    -- Insert into user_profiles
    INSERT INTO user_profiles (
      id, email, name, role, company, subscription_plan, subscription_status
    ) VALUES (
      v_user_id, v_admin_email, 'Admin FVStudios', 'admin', 'FVStudios', 'enterprise', 'active'
    );
    
    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, v_admin_email)::jsonb,
      'email', NOW(), NOW()
    );
    
    RAISE NOTICE 'Admin user created successfully with email: %', v_admin_email;
  ELSE
    RAISE NOTICE 'Admin user already exists, skipping creation';
  END IF;
END $$;

-- ===================================================================
-- SETUP COMPLETE!
-- ===================================================================
-- Your FVSTUDIOS Dashboard is now ready to use.
-- 
-- Default Admin Login:
-- Email: admin@fvstudios.com (change this above before running!)
-- Password: admin123456 (change this above before running!)
--
-- Available Features:
-- ✅ User management with roles and permissions
-- ✅ Project and task management
-- ✅ Team collaboration (direct creation + email invites)
-- ✅ Agency management with multi-tenant support
-- ✅ Stripe integration for lead processing
-- ✅ Row Level Security for data protection
-- ===================================================================