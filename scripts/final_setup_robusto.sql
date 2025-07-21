-- ==========================================
-- SETUP ROBUSTO - VERIFICA ANTES DE CRIAR
-- ==========================================

-- VERIFICAR SE TABELA EXISTE E RECRIAR SE NECESSÁRIO
DO $$
BEGIN
  -- Se a tabela existe mas está com problemas, drop e recria
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Desabilitar RLS primeiro
    ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
    
    -- Dropar policies existentes
    DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Admin full access" ON public.user_profiles;
    DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.user_profiles;
    DROP POLICY IF EXISTS "Admin can manage all" ON public.user_profiles;
    DROP POLICY IF EXISTS "Agency can manage team" ON public.user_profiles;
    DROP POLICY IF EXISTS "Producer can manage own clients" ON public.user_profiles;
    
    -- Dropar constraints que podem estar problemáticas
    ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
    
    -- Limpar dados (CASCADE para limpar tabelas dependentes)
    TRUNCATE public.user_profiles CASCADE;
    
    RAISE NOTICE 'Tabela user_profiles limpa e preparada para reconfiguração';
  END IF;
  
  -- Criar tabela se não existir
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
  
  RAISE NOTICE 'Tabela user_profiles verificada/criada';
END $$;

-- ==========================================
-- CONSTRAINTS SEGURAS
-- ==========================================

-- Adicionar constraint apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'user_profiles_role_check'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('admin', 'agency_owner', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user'));
    
    RAISE NOTICE 'Constraint de roles adicionada';
  ELSE
    RAISE NOTICE 'Constraint de roles já existe';
  END IF;
END $$;

-- ==========================================
-- ÍNDICES SEGUROS
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON public.user_profiles(agency_id);

-- ==========================================
-- RLS E POLICIES LIMPOS
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Criar policies sempre limpas
DO $$
BEGIN
  -- Limpar todas as policies primeiro
  DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Admin full access" ON public.user_profiles;
  DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.user_profiles;
  
  -- Criar policies novas e simples
  CREATE POLICY "Users can view own profile" ON public.user_profiles 
  FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile" ON public.user_profiles 
  FOR UPDATE USING (auth.uid() = id);

  -- Admin pode gerenciar todos (SEM RECURSÃO)
  CREATE POLICY "Admin full access" ON public.user_profiles 
  FOR ALL USING (
    auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid
  );

  -- Permitir inserção para novos usuários
  CREATE POLICY "Allow insert for authenticated" ON public.user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);
  
  RAISE NOTICE 'Policies RLS criadas com sucesso';
END $$;

-- ==========================================
-- FUNÇÃO SIMPLES PARA CRIAR PERFIL
-- ==========================================

-- Dropar função anterior se existir
DROP FUNCTION IF EXISTS public.handle_new_user_simple() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Criar função nova
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

-- ==========================================
-- TRIGGER LIMPO
-- ==========================================

-- Dropar triggers antigos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Criar trigger novo
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

SELECT 
  'Setup robusto completo!' AS status,
  COUNT(*) AS total_policies
FROM pg_policies 
WHERE tablename = 'user_profiles';