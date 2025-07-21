-- CORREÇÃO EMERGENCIAL - Execute LINHA POR LINHA
-- Se executar tudo junto não funcionar, execute cada comando separadamente

-- COMANDO 1: Listar todas as políticas atuais
SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';

-- COMANDO 2: Desabilitar RLS (pode dar erro, ignore)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- COMANDO 3: Forçar remoção de RLS
DROP POLICY IF EXISTS "user_profiles_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_can_read_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_can_update_own" ON public.user_profiles;

-- COMANDO 4: Testar consulta direta (deve funcionar)
SELECT * FROM public.user_profiles WHERE id = '71f0cbbb-1963-430c-b445-78907e747574';

-- COMANDO 5: Se ainda der erro, RECRIAR A TABELA (EXTREMO)
-- CREATE TABLE public.user_profiles_backup AS SELECT * FROM public.user_profiles;
-- DROP TABLE public.user_profiles CASCADE;
-- CREATE TABLE public.user_profiles AS SELECT * FROM public.user_profiles_backup;
-- DROP TABLE public.user_profiles_backup;