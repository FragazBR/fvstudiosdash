-- ============================================================================
-- SCRIPT DE LIMPEZA COMPLETA DO BANCO DE DADOS
-- FVStudios Dashboard - Multi-Tenant System
-- 
-- ATENCAO: Este script REMOVE TUDO do banco de dados!
-- Execute apenas se quiser ZERAR completamente o banco
-- Faca backup antes de executar se necessario
-- ============================================================================

-- Mensagem de inicio
DO $$ 
BEGIN 
    RAISE NOTICE 'INICIANDO LIMPEZA COMPLETA DO BANCO DE DADOS...';
    RAISE NOTICE 'Este processo ira remover TODAS as tabelas, funcoes, triggers e politicas RLS!';
END $$;

-- ============================================================================
-- 1. REMOVER TODAS AS POLITICAS RLS
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Removendo todas as politicas RLS...';
    
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE '  Politica removida: %.%', r.tablename, r.policyname;
    END LOOP;
END $$;
-- ============================================================================
-- 2. DESABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Desabilitando RLS em todas as tabelas...';
    
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
        AND tablename NOT LIKE 'system_settings'
        AND tablename NOT LIKE 'auth_%'
        AND tablename NOT LIKE 'supabase_%'
        AND tablename NOT LIKE 'client_users'
    ) LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE '  RLS desabilitado: %', r.tablename;
    END LOOP;
END $$;

-- ============================================================================
-- 3. REMOVER TODOS OS TRIGGERS
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Removendo todos os triggers...';
    
    FOR r IN (
        SELECT event_object_schema as schemaname, event_object_table as tablename, trigger_name as triggername
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name NOT LIKE 'pg_%'
    ) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', r.triggername, r.schemaname, r.tablename);
        RAISE NOTICE '  Trigger removido: %.%', r.tablename, r.triggername;
    END LOOP;
END $$;

-- ============================================================================
-- 4. REMOVER TODAS AS FUNCOES PERSONALIZADAS
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Removendo todas as funcoes personalizadas...';
    
    FOR r IN (
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT IN ('array_to_string', 'format', 'current_setting')
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', r.schema_name, r.function_name, r.args);
        RAISE NOTICE '  Funcao removida: %(%)', r.function_name, r.args;
    END LOOP;
END $$;

-- ============================================================================
-- 5. REMOVER TABELAS ESPECIFICAS DO PROJETO (em ordem de dependencia)
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Removendo tabelas do projeto em ordem de dependencias...';
END $$;

-- Tabelas com foreign keys primeiro
DROP TABLE IF EXISTS project_metrics CASCADE;
DO $$ BEGIN RAISE NOTICE '  Tabela removida: project_metrics'; END $$;

DROP TABLE IF EXISTS events CASCADE;
DO $$ BEGIN RAISE NOTICE '  Tabela removida: events'; END $$;

DROP TABLE IF EXISTS notifications CASCADE;
DO $$ BEGIN RAISE NOTICE '  Tabela removida: notifications'; END $$;

DROP TABLE IF EXISTS projects CASCADE;
DO $$ BEGIN RAISE NOTICE '  Tabela removida: projects'; END $$;

DROP TABLE IF EXISTS client_api_configs CASCADE;
DO $$ BEGIN RAISE NOTICE '  Tabela removida: client_api_configs'; END $$;

DROP TABLE IF EXISTS user_profiles CASCADE;
DO $$ BEGIN RAISE NOTICE '  Tabela removida: user_profiles'; END $$;

-- Tabelas principais por ultimo
DROP TABLE IF EXISTS agencies CASCADE;
DO $$ BEGIN RAISE NOTICE '  Tabela removida: agencies'; END $$;

DROP TABLE IF EXISTS plan_limits CASCADE;
DO $$ BEGIN RAISE NOTICE '  Tabela removida: plan_limits'; END $$;

-- ============================================================================
-- 6. REMOVER OUTRAS TABELAS ANTIGAS (se existirem)
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Removendo possiveis tabelas antigas...';
END $$;

-- Tabelas que podem ter sobrado de versoes anteriores (apenas do nosso projeto)
DROP TABLE IF EXISTS client_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS metrics CASCADE;
DROP TABLE IF EXISTS api_configs CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE; -- Pode conflitar com Supabase

DO $$
BEGIN
    RAISE NOTICE '  Tabelas antigas removidas (se existiam)';
END $$;

-- ============================================================================
-- 7. REMOVER TIPOS ENUM PERSONALIZADOS
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Removendo tipos ENUM personalizados...';
    
    FOR r IN (
        SELECT typname 
        FROM pg_type 
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND typtype = 'e'
        AND typname NOT LIKE 'pg_%'
    ) LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I CASCADE', r.typname);
        RAISE NOTICE '  Tipo ENUM removido: %', r.typname;
    END LOOP;
END $$;

-- ============================================================================
-- 8. REMOVER SEQUENCIAS ORFAS
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Removendo sequencias orfas...';
    
    FOR r IN (
        SELECT schemaname, sequencename
        FROM pg_sequences 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS %I.%I CASCADE', r.schemaname, r.sequencename);
        RAISE NOTICE '  Sequencia removida: %', r.sequencename;
    END LOOP;
END $$;

-- ============================================================================
-- 9. REMOVER INDICES PERSONALIZADOS
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Removendo indices personalizados...';
    
    FOR r IN (
        SELECT schemaname, indexname
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname NOT LIKE 'pg_%'
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_key'
        AND indexname NOT LIKE 'system_settings_%'
        AND indexname NOT LIKE 'auth_%'
        AND indexname NOT LIKE 'supabase_%'
        AND indexname NOT LIKE 'client_users_%'
    ) LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I.%I CASCADE', r.schemaname, r.indexname);
        RAISE NOTICE '  Indice removido: %', r.indexname;
    END LOOP;
END $$;

-- ============================================================================
-- 10. LIMPEZA FINAL E VERIFICACAO
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Verificando limpeza...';
END $$;

-- Verificar se ainda existem tabelas
DO $$ 
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND tablename NOT LIKE 'system_settings'
    AND tablename NOT LIKE 'auth_%'
    AND tablename NOT LIKE 'supabase_%'
    AND tablename NOT LIKE 'client_users';
    
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT IN ('array_to_string', 'format', 'current_setting');
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Resultados da limpeza:';
    RAISE NOTICE '   - Tabelas restantes: %', table_count;
    RAISE NOTICE '   - Funcoes restantes: %', function_count;
    RAISE NOTICE '   - Politicas RLS restantes: %', policy_count;
    
    IF table_count = 0 AND function_count = 0 AND policy_count = 0 THEN
        RAISE NOTICE 'LIMPEZA COMPLETA REALIZADA COM SUCESSO!';
        RAISE NOTICE 'Banco de dados esta completamente limpo e pronto para nova estrutura.';
    ELSE
        RAISE NOTICE 'Alguns itens podem nao ter sido removidos. Verifique manualmente se necessario.';
    END IF;
END $$;

-- ============================================================================
-- 11. LIMPEZA FISICA (VACUUM NAO NECESSARIO NO SUPABASE)
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Limpeza fisica sera feita automaticamente pelo Supabase.';
    RAISE NOTICE 'VACUUM nao e necessario em ambiente gerenciado.';
END $$;

-- Mensagem final
DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE 'PROCESSO DE LIMPEZA CONCLUIDO!';
    RAISE NOTICE '';
    RAISE NOTICE 'Proximos passos:';
    RAISE NOTICE '   1. Execute o script final_setup.sql para criar a nova estrutura';
    RAISE NOTICE '   2. Execute o script sample_data.sql para dados de teste (opcional)';
    RAISE NOTICE '   3. Configure as variaveis de ambiente no Next.js';
    RAISE NOTICE '   4. Teste a aplicacao com a nova estrutura';
    RAISE NOTICE '';
    RAISE NOTICE 'Banco de dados pronto para receber a nova arquitetura multi-tenant!';
END $$;
