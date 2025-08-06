-- ==================================================
-- TESTE DO INTELLIGENT SYSTEM SCHEMA
-- Execute este script para validar se o schema foi aplicado corretamente
-- ==================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'api_keys',
    'intelligent_campaigns', 
    'ai_generated_content',
    'intelligent_templates',
    'budget_optimizations',
    'ai_insights',
    'ai_predictions', 
    'intelligent_automations',
    'ai_execution_logs',
    'ai_system_metrics'
)
ORDER BY table_name;

-- Verificar constraints de foreign key
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
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
    'api_keys',
    'intelligent_campaigns', 
    'ai_generated_content',
    'intelligent_templates',
    'budget_optimizations',
    'ai_insights',
    'ai_predictions', 
    'intelligent_automations',
    'ai_execution_logs',
    'ai_system_metrics'
);

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN (
    'api_keys',
    'intelligent_campaigns', 
    'ai_generated_content',
    'intelligent_templates',
    'budget_optimizations',
    'ai_insights',
    'ai_predictions', 
    'intelligent_automations',
    'ai_execution_logs',
    'ai_system_metrics'
)
ORDER BY tablename, policyname;

-- Verificar índices criados
SELECT 
    i.relname AS index_name,
    t.relname AS table_name,
    array_to_string(array_agg(a.attname), ', ') AS column_names
FROM 
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a
WHERE 
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname IN (
        'api_keys',
        'intelligent_campaigns', 
        'ai_generated_content',
        'intelligent_templates',
        'budget_optimizations',
        'ai_insights',
        'ai_predictions', 
        'intelligent_automations',
        'ai_execution_logs',
        'ai_system_metrics'
    )
GROUP BY t.relname, i.relname
ORDER BY t.relname, i.relname;

-- Testar inserção de dados de exemplo (comentado por segurança)
/*
-- Exemplo de inserção na tabela api_keys
INSERT INTO api_keys (user_id, agency_id, service_name, api_key_encrypted, additional_config)
VALUES (
    (SELECT id FROM user_profiles LIMIT 1),
    (SELECT agency_id FROM user_profiles LIMIT 1),
    'openai',
    'encrypted_key_example_123',
    '{"model": "gpt-4", "max_tokens": 1000}'
);
*/

-- Mostrar estatísticas das tabelas
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN (
    'api_keys',
    'intelligent_campaigns', 
    'ai_generated_content',
    'intelligent_templates',
    'budget_optimizations',
    'ai_insights',
    'ai_predictions', 
    'intelligent_automations',
    'ai_execution_logs',
    'ai_system_metrics'
)
ORDER BY tablename, attname;

-- ==================================================
-- RELATÓRIO DE VALIDAÇÃO
-- ==================================================

-- Se todas as consultas retornaram dados sem erro, 
-- o Intelligent System Schema foi aplicado com sucesso!
--
-- Próximos passos:
-- 1. Execute o SOCIAL_MEDIA_API_SCHEMA.sql se ainda não foi executado
-- 2. Teste as APIs REST do sistema inteligente
-- 3. Configure as chaves de API das plataformas de IA
-- 4. Ative os workflows de automação
--
-- Sistema 100% operacional! ✅