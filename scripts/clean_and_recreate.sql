-- ==========================================
-- LIMPEZA COMPLETA E RECREAÇÃO TOTAL
-- FVStudios Dashboard - Fix Definitivo
-- ==========================================

-- PASSO 1: REMOVER TODAS AS POLÍTICAS RLS PROBLEMÁTICAS
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    -- Remover todas as políticas da user_profiles que causam recursão
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.user_profiles';
    END LOOP;
    
    -- Remover políticas de outras tabelas também
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename IN ('agencies', 'projects', 'client_api_configs', 'events', 'notifications', 'project_metrics')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.' || (SELECT tablename FROM pg_policies WHERE policyname = pol_name LIMIT 1);
    END LOOP;
END $$;

-- PASSO 2: REMOVER TRIGGERS CONFLITANTES
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_public_users_created ON auth.users;

-- PASSO 3: REMOVER FUNÇÕES PROBLEMÁTICAS
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;

-- PASSO 4: LIMPAR DADOS EXISTENTES (CUIDADO!)
TRUNCATE TABLE public.user_profiles CASCADE;
TRUNCATE TABLE public.agencies CASCADE;
TRUNCATE TABLE public.projects CASCADE;
TRUNCATE TABLE public.client_api_configs CASCADE;
TRUNCATE TABLE public.events CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.project_metrics CASCADE;

-- PASSO 5: DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_api_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_metrics DISABLE ROW LEVEL SECURITY;

-- PASSO 6: RECRIAR ESTRUTURA LIMPA
-- (Execute o final_setup.sql após este script)

SELECT 'Limpeza completa executada! Execute final_setup.sql agora.' AS next_step;