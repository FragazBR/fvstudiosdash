-- ==========================================
-- CRIAR USUÁRIO ADMIN CORRETAMENTE
-- ==========================================
-- Execute APÓS setup_direto.sql

-- Desabilitar RLS temporariamente para inserção admin
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Inserir usuário admin diretamente na user_profiles
INSERT INTO public.user_profiles (
  id,
  email, 
  name,
  role,
  company,
  subscription_plan,
  subscription_status
) VALUES (
  '71f0cbbb-1963-430c-b445-78907e747574',
  'admin@fvstudios.com',
  'Admin FVStudios',
  'admin',
  'FVStudios',
  'enterprise',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  name = 'Admin FVStudios',
  company = 'FVStudios',
  subscription_plan = 'enterprise',
  subscription_status = 'active';

-- Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Verificar se foi criado
SELECT id, email, name, role FROM public.user_profiles WHERE role = 'admin';