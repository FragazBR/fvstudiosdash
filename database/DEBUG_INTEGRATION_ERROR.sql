-- ==================================================
-- DEBUG SCRIPT PARA ERRO DE integration_id
-- Execute este script para diagnosticar o problema
-- ==================================================

-- 1. Verificar se as extensões estão ativas
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pg_stat_statements');

-- 2. Verificar se as tabelas base existem
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('agencies', 'user_profiles', 'api_integrations')
ORDER BY table_name;

-- 3. Verificar estrutura da tabela api_integrations se existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_integrations') THEN
        RAISE NOTICE '✅ Tabela api_integrations existe!';
        
        -- Verificar colunas da tabela
        PERFORM column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'api_integrations' 
        AND column_name = 'id';
        
        IF FOUND THEN
            RAISE NOTICE '✅ Coluna id existe na tabela api_integrations';
        ELSE
            RAISE NOTICE '❌ Coluna id NÃO existe na tabela api_integrations';
        END IF;
    ELSE
        RAISE NOTICE '❌ Tabela api_integrations NÃO existe!';
    END IF;
END $$;

-- 4. Teste de criação isolada da tabela api_integrations
DROP TABLE IF EXISTS test_api_integrations CASCADE;

CREATE TABLE test_api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    agency_id UUID,
    created_by UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Teste de criação de tabela que referencia
DROP TABLE IF EXISTS test_integration_logs CASCADE;

CREATE TABLE test_integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES test_api_integrations(id) ON DELETE CASCADE,
    operation VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Teste de inserção
INSERT INTO test_api_integrations (client_id, agency_id, created_by, name, provider)
VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'Teste', 'test_provider');

INSERT INTO test_integration_logs (integration_id, operation)
SELECT id, 'test_operation' FROM test_api_integrations LIMIT 1;

-- 7. Verificar se os testes funcionaram
SELECT 
    'test_api_integrations' as table_name,
    COUNT(*) as records
FROM test_api_integrations
UNION ALL
SELECT 
    'test_integration_logs' as table_name,
    COUNT(*) as records
FROM test_integration_logs;

-- 8. Limpar testes
DROP TABLE test_integration_logs CASCADE;
DROP TABLE test_api_integrations CASCADE;

-- 9. Diagnóstico completo
DO $$
DECLARE
    api_integrations_exists BOOLEAN;
    integration_logs_exists BOOLEAN;
    error_line TEXT;
BEGIN
    -- Verificar se api_integrations existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'api_integrations'
    ) INTO api_integrations_exists;
    
    -- Verificar se integration_logs existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'integration_logs'
    ) INTO integration_logs_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNÓSTICO DO ERRO integration_id:';
    RAISE NOTICE '';
    RAISE NOTICE 'Tabela api_integrations existe: %', 
        CASE WHEN api_integrations_exists THEN '✅ SIM' ELSE '❌ NÃO' END;
    RAISE NOTICE 'Tabela integration_logs existe: %',
        CASE WHEN integration_logs_exists THEN '✅ SIM' ELSE '❌ NÃO' END;
    RAISE NOTICE '';
    
    IF NOT api_integrations_exists THEN
        RAISE NOTICE '❌ PROBLEMA ENCONTRADO:';
        RAISE NOTICE '   A tabela api_integrations não existe!';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 SOLUÇÃO:';
        RAISE NOTICE '   1. Execute primeiro a criação das tabelas base';
        RAISE NOTICE '   2. Verifique se não há erros na definição da tabela api_integrations';
        RAISE NOTICE '   3. Execute o COMPLETE_MIGRATION.sql novamente';
    ELSIF integration_logs_exists THEN
        RAISE NOTICE '✅ TABELAS EXISTEM - Problema pode ser na execução:';
        RAISE NOTICE '   1. Verifique se há transações não commitadas';
        RAISE NOTICE '   2. Execute ROLLBACK; e tente novamente';
        RAISE NOTICE '   3. Verifique se há caracteres especiais no arquivo';
    ELSE
        RAISE NOTICE '✅ api_integrations existe, mas integration_logs não';
        RAISE NOTICE '   Isso é normal se o erro ocorreu na criação de integration_logs';
    END IF;
    RAISE NOTICE '';
END $$;

-- 10. Comando para verificar transações ativas
SELECT 
    pid,
    state,
    query,
    state_change
FROM pg_stat_activity 
WHERE state != 'idle' 
AND pid != pg_backend_pid()
ORDER BY state_change DESC;

-- 11. Sugestão de correção
SELECT '🔧 COMANDOS PARA CORRIGIR:' as fix_commands;
SELECT '  1. ROLLBACK; -- Se estiver em transação' as command;
SELECT '  2. DROP TABLE IF EXISTS integration_logs CASCADE;' as command; 
SELECT '  3. DROP TABLE IF EXISTS api_integrations CASCADE;' as command;
SELECT '  4. Execute novamente a seção específica do COMPLETE_MIGRATION.sql' as command;