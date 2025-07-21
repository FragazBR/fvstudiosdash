-- ==========================================
-- SETUP DIRETO - MÍNIMO NECESSÁRIO
-- ==========================================

-- Simplesmente dropar e recriar a tabela user_profiles
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Criar tabela limpa
CREATE TABLE public.user_profiles (
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

-- Constraint de roles
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('admin', 'agency_owner', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user'));

-- Índices
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_agency_id ON public.user_profiles(agency_id);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies simples SEM RECURSÃO
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

-- Função para criar perfil
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

-- Dropar trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger novo
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- Sucesso
SELECT 'Setup direto completo! user_profiles recriada.' AS status;