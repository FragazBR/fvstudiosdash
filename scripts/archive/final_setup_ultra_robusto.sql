-- ==========================================
-- SETUP ULTRA ROBUSTO - LIMPEZA TOTAL SEGURA
-- ==========================================

-- PASSO 1: DESABILITAR RLS EM TODAS AS TABELAS
DO $$
BEGIN
  -- Desabilitar RLS em todas as tabelas que possam ter
  ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.agencies DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.client_api_configs DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.project_metrics DISABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'RLS desabilitado em todas as tabelas';
END $$;

-- PASSO 2: DROPAR POLICIES PROBLEMÁTICAS
DO $$
DECLARE
  pol_name TEXT;
BEGIN
  -- Remove todas as políticas da user_profiles
  FOR pol_name IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.user_profiles';
  END LOOP;
  
  RAISE NOTICE 'Todas as policies removidas';
END $$;

-- PASSO 3: DROPAR TRIGGERS ANTIGOS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_public_users_created ON auth.users;

-- PASSO 4: DROPAR FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS public.handle_new_user_simple() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- PASSO 5: LIMPEZA DE DADOS SEGURA
DO $$
BEGIN
  -- Limpar dados na ordem correta (dependências primeiro)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_metrics') THEN
    TRUNCATE TABLE public.project_metrics CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
    TRUNCATE TABLE public.events CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    TRUNCATE TABLE public.notifications CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects') THEN
    TRUNCATE TABLE public.projects CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_api_configs') THEN
    TRUNCATE TABLE public.client_api_configs CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    TRUNCATE TABLE public.user_profiles CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agencies') THEN
    TRUNCATE TABLE public.agencies CASCADE;
  END IF;
  
  RAISE NOTICE 'Dados limpos em todas as tabelas';
END $$;

-- PASSO 6: GARANTIR QUE A TABELA USER_PROFILES ESTÁ CORRETA
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

-- PASSO 7: CONSTRAINTS SEGUROS
DO $$
BEGIN
  -- Dropar constraint se existir
  ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
  
  -- Adicionar constraint novo
  ALTER TABLE public.user_profiles 
  ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('admin', 'agency_owner', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user'));
  
  RAISE NOTICE 'Constraint de roles recriada';
END $$;

-- PASSO 8: ÍNDICES
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON public.user_profiles(agency_id);

-- PASSO 9: RLS E POLICIES SIMPLIFICADOS
-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies super simples SEM RECURSÃO
CREATE POLICY "Users can view own profile" ON public.user_profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles 
FOR UPDATE USING (auth.uid() = id);

-- Admin pode tudo (SEM CONSULTA À TABELA)
CREATE POLICY "Admin full access" ON public.user_profiles 
FOR ALL USING (
  auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid
);

-- Permitir inserção
CREATE POLICY "Allow insert for authenticated" ON public.user_profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- PASSO 10: FUNÇÃO E TRIGGER SIMPLES
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

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- VERIFICAÇÃO FINAL
SELECT 
  'Setup ultra robusto completo!' AS status,
  COUNT(*) AS total_policies
FROM pg_policies 
WHERE tablename = 'user_profiles';