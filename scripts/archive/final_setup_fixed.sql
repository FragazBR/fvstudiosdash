-- ==========================================
-- FVSTUDIOS SETUP CORRIGIDO - VERSÃO SIMPLIFICADA
-- ==========================================

-- EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABELA PRINCIPAL: USER_PROFILES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Hierarquia simplificada
  role VARCHAR(50) DEFAULT 'free_user',
  agency_id UUID,
  parent_agency_id UUID,
  
  -- Dados básicos
  company VARCHAR(255),
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- CONSTRAINTS
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'user_profiles_role_check'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('admin', 'agency_owner', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user'));
  END IF;
END $$;

-- ==========================================
-- ÍNDICES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON public.user_profiles(agency_id);

-- ==========================================
-- RLS SIMPLIFICADO
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas SEM RECURSÃO
DO $$
BEGIN
  -- Remove policies existentes primeiro
  DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Admin full access" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.user_profiles;
  
  -- Cria policies novas
  CREATE POLICY "Users can view own profile" ON public.user_profiles 
  FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile" ON public.user_profiles 
  FOR UPDATE USING (auth.uid() = id);

  -- Admin pode gerenciar todos (usando uma query simples sem recursão)
  CREATE POLICY "Admin full access" ON public.user_profiles 
  FOR ALL USING (
    auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid
  );

  -- Permitir inserção para novos usuários
  CREATE POLICY "Allow insert for authenticated" ON public.user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
END $$;

-- ==========================================
-- FUNÇÃO SIMPLES PARA CRIAR PERFIL
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'free_user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-criar perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- ==========================================
-- VERIFICAÇÃO
-- ==========================================

SELECT 'Setup simplificado completo!' AS status;