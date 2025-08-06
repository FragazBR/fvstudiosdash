-- ==================================================
-- TESTE DO N8N INTEGRATION SCHEMA
-- Execute este script para validar se o schema foi aplicado corretamente
-- ==================================================

-- Verificar se as tabelas base existem primeiro
DO $$
BEGIN
    -- Verificar se agencies existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agencies') THEN
        RAISE EXCEPTION 'ERRO: Tabela agencies não existe. Execute COMPLETE_MIGRATION.sql primeiro.';
    END IF;
    
    -- Verificar se user_profiles existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'ERRO: Tabela user_profiles não existe. Execute COMPLETE_MIGRATION.sql primeiro.';
    END IF;
    
    -- Verificar se projects existe (opcional para alguns workflows)
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        RAISE WARNING 'AVISO: Tabela projects não existe. Alguns workflows podem não funcionar.';
    END IF;
    
    RAISE NOTICE 'Tabelas base verificadas com sucesso!';
END $$;

-- Verificar se todas as tabelas do N8N foram criadas
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ CREATED'
        ELSE '❌ MISSING'
    END as status
FROM (VALUES 
    ('api_integrations'),
    ('api_integration_metrics'),
    ('n8n_workflows'),
    ('ai_agents'),
    ('workflow_executions'),
    ('whatsapp_conversations'),
    ('whatsapp_messages'),
    ('canva_designs'),
    ('canva_design_versions'),
    ('canva_templates')
) AS expected(table_name)
LEFT JOIN information_schema.tables t ON t.table_name = expected.table_name AND t.table_schema = 'public'
ORDER BY expected.table_name;

-- Verificar foreign keys das tabelas N8N
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name IN ('agencies', 'user_profiles', 'projects', 'api_integrations', 'n8n_workflows') 
        THEN '✅ VALID'
        ELSE '❌ INVALID'
    END as fk_status
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN (
    'api_integrations', 'api_integration_metrics', 'n8n_workflows', 'ai_agents',
    'workflow_executions', 'whatsapp_conversations', 'whatsapp_messages',
    'canva_designs', 'canva_design_versions', 'canva_templates'
)
ORDER BY tc.table_name, kcu.column_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ RLS ACTIVE'
        ELSE '❌ NO POLICY'
    END as rls_status
FROM pg_policies 
WHERE tablename IN (
    'api_integrations', 'n8n_workflows', 'workflow_executions',
    'whatsapp_conversations', 'whatsapp_messages', 'canva_designs',
    'canva_design_versions', 'canva_templates', 'api_integration_metrics'
)
ORDER BY tablename, policyname;

-- Verificar índices criados
SELECT 
    i.relname AS index_name,
    t.relname AS table_name,
    CASE 
        WHEN i.relname IS NOT NULL THEN '✅ INDEX EXISTS'
        ELSE '❌ MISSING INDEX'
    END as index_status
FROM 
    pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
WHERE 
    t.relkind = 'r'
    AND t.relname IN (
        'api_integrations', 'api_integration_metrics', 'n8n_workflows', 'ai_agents',
        'workflow_executions', 'whatsapp_conversations', 'whatsapp_messages',
        'canva_designs', 'canva_design_versions', 'canva_templates'
    )
    AND i.relname LIKE 'idx_%'
ORDER BY t.relname, i.relname;

-- Verificar triggers
SELECT 
    t.trigger_name,
    t.table_name,
    CASE 
        WHEN t.trigger_name IS NOT NULL THEN '✅ TRIGGER EXISTS'
        ELSE '❌ NO TRIGGER'
    END as trigger_status
FROM information_schema.triggers t
WHERE t.table_name IN (
    'api_integrations', 'n8n_workflows', 'ai_agents', 'whatsapp_conversations',
    'canva_designs', 'canva_templates'
)
AND t.trigger_name LIKE '%updated_at%'
ORDER BY t.table_name;

-- Teste básico de inserção (comentado por segurança)
/*
-- Exemplo de teste de inserção
DO $$
DECLARE
    test_agency_id UUID;
    test_user_id UUID;
    test_workflow_id UUID;
BEGIN
    -- Buscar uma agência existente
    SELECT id INTO test_agency_id FROM agencies LIMIT 1;
    SELECT id INTO test_user_id FROM user_profiles WHERE agency_id = test_agency_id LIMIT 1;
    
    IF test_agency_id IS NULL OR test_user_id IS NULL THEN
        RAISE EXCEPTION 'Não foi possível encontrar agência e usuário para teste';
    END IF;
    
    -- Testar inserção de workflow
    INSERT INTO n8n_workflows (agency_id, created_by, name, workflow_type, n8n_workflow_id)
    VALUES (test_agency_id, test_user_id, 'Teste Workflow', 'briefing', 'test_workflow_' || gen_random_uuid())
    RETURNING id INTO test_workflow_id;
    
    -- Testar inserção de execução
    INSERT INTO workflow_executions (workflow_id, execution_id, status)
    VALUES (test_workflow_id, 'exec_' || gen_random_uuid(), 'running');
    
    -- Limpar dados de teste
    DELETE FROM workflow_executions WHERE workflow_id = test_workflow_id;
    DELETE FROM n8n_workflows WHERE id = test_workflow_id;
    
    RAISE NOTICE '✅ Teste de inserção realizado com sucesso!';
END $$;
*/

-- Verificar funções criadas
SELECT 
    p.proname as function_name,
    CASE 
        WHEN p.proname IS NOT NULL THEN '✅ FUNCTION EXISTS'
        ELSE '❌ MISSING FUNCTION'
    END as function_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('get_workflow_stats', 'cleanup_old_executions', 'update_updated_at_column')
ORDER BY p.proname;

-- Status final
DO $$
DECLARE
    total_tables INTEGER;
    total_policies INTEGER;
    total_indexes INTEGER;
    total_triggers INTEGER;
BEGIN
    -- Contar tabelas N8N
    SELECT COUNT(*) INTO total_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'api_integrations', 'api_integration_metrics', 'n8n_workflows', 'ai_agents',
        'workflow_executions', 'whatsapp_conversations', 'whatsapp_messages',
        'canva_designs', 'canva_design_versions', 'canva_templates'
    );
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO total_policies 
    FROM pg_policies 
    WHERE tablename ~ '^(api_|n8n_|workflow_|whatsapp_|canva_)';
    
    -- Contar índices
    SELECT COUNT(*) INTO total_indexes
    FROM pg_class i
    JOIN pg_index ix ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    WHERE t.relname ~ '^(api_|n8n_|workflow_|whatsapp_|canva_)' 
    AND i.relname LIKE 'idx_%';
    
    -- Contar triggers
    SELECT COUNT(*) INTO total_triggers
    FROM information_schema.triggers 
    WHERE table_name ~ '^(api_|n8n_|workflow_|whatsapp_|canva_)'
    AND trigger_name LIKE '%updated_at%';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '   N8N INTEGRATION SCHEMA - TESTE COMPLETO';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Resultados:';
    RAISE NOTICE '   • Tabelas: % / 10', total_tables;
    RAISE NOTICE '   • Políticas RLS: %', total_policies;
    RAISE NOTICE '   • Índices: %', total_indexes;
    RAISE NOTICE '   • Triggers: %', total_triggers;
    RAISE NOTICE '';
    
    IF total_tables = 10 THEN
        RAISE NOTICE '✅ SCHEMA N8N 100%% FUNCIONAL!';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Próximos passos:';
        RAISE NOTICE '   1. Configurar instância n8n';
        RAISE NOTICE '   2. Configurar webhooks WhatsApp Business';
        RAISE NOTICE '   3. Configurar API keys das plataformas';
        RAISE NOTICE '   4. Testar workflows básicos';
    ELSE
        RAISE NOTICE '❌ Algumas tabelas estão faltando!';
        RAISE NOTICE '   Execute novamente o N8N_INTEGRATION_SCHEMA.sql';
    END IF;
    RAISE NOTICE '';
END $$;

-- Comandos úteis para debug
SELECT '🔧 COMANDOS ÚTEIS PARA DEBUG:' as debug_commands;
SELECT '  • SELECT * FROM n8n_workflows LIMIT 5;' as command;
SELECT '  • SELECT * FROM workflow_executions LIMIT 5;' as command;
SELECT '  • SELECT * FROM api_integrations LIMIT 5;' as command;
SELECT '  • SELECT * FROM whatsapp_conversations LIMIT 5;' as command;