-- ===================================================================
-- DIAGNOSTIC SCRIPT - Identifica problemas nas APIs
-- ===================================================================
-- Execute este script para ver exatamente o que está causando os erros 500

-- 1. VERIFICAR ESTRUTURA DAS TABELAS
SELECT 
  'TABLES CHECK' as check_type,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'projects', 'tasks', 'clients')
ORDER BY table_name;

-- 2. VERIFICAR FOREIGN KEYS
SELECT 
  'FOREIGN KEYS' as check_type,
  tc.table_name,
  tc.constraint_name,
  '✅ EXISTS' as status
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('projects', 'tasks')
UNION ALL
SELECT 
  'FOREIGN KEYS' as check_type,
  'projects' as table_name,
  'projects_client_id_fkey' as constraint_name,
  '❌ MISSING' as status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.table_constraints 
  WHERE constraint_name = 'projects_client_id_fkey'
)
UNION ALL
SELECT 
  'FOREIGN KEYS' as check_type,
  'tasks' as table_name,
  'tasks_project_id_fkey' as constraint_name,
  '❌ MISSING' as status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.table_constraints 
  WHERE constraint_name = 'tasks_project_id_fkey'
)
ORDER BY table_name, constraint_name;

-- 3. VERIFICAR COLUNAS DAS TABELAS
SELECT 
  'COLUMNS - PROJECTS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'COLUMNS - TASKS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR DADOS DE TESTE
SELECT 
  'DATA COUNT' as check_type,
  'user_profiles' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END as status
FROM user_profiles
UNION ALL
SELECT 
  'DATA COUNT' as check_type,
  'projects' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END as status
FROM projects
UNION ALL
SELECT 
  'DATA COUNT' as check_type,
  'tasks' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ HAS DATA' ELSE '⚠️ EMPTY' END as status
FROM tasks;

-- 5. TESTAR QUERY ESPECÍFICA QUE A API USA (PROJECTS)
DO $$
DECLARE
  test_result RECORD;
  error_msg TEXT;
BEGIN
  -- Testar a query exata que a API de projects usa
  BEGIN
    SELECT COUNT(*) as count INTO test_result
    FROM projects p
    LEFT JOIN user_profiles client ON client.id = p.client_id
    LEFT JOIN user_profiles creator ON creator.id = p.created_by;
    
    RAISE NOTICE 'PROJECTS API TEST: ✅ SUCCESS - Found % projects with joins', test_result.count;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
      RAISE NOTICE 'PROJECTS API TEST: ❌ ERROR - %', error_msg;
  END;
END $$;

-- 6. TESTAR QUERY ESPECÍFICA QUE A API USA (TASKS)
DO $$
DECLARE
  test_result RECORD;
  error_msg TEXT;
BEGIN
  -- Testar a query exata que a API de tasks usa
  BEGIN
    SELECT COUNT(*) as count INTO test_result
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN user_profiles assigned ON assigned.id = t.assigned_to
    LEFT JOIN user_profiles creator ON creator.id = t.created_by;
    
    RAISE NOTICE 'TASKS API TEST: ✅ SUCCESS - Found % tasks with joins', test_result.count;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
      RAISE NOTICE 'TASKS API TEST: ❌ ERROR - %', error_msg;
  END;
END $$;

-- 7. VERIFICAR PERMISSÕES RLS
SELECT 
  'RLS POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  '✅ EXISTS' as status
FROM pg_policies 
WHERE tablename IN ('projects', 'tasks', 'user_profiles')
ORDER BY tablename, policyname;

-- 8. VERIFICAR VIEW CLIENTS
SELECT 
  'CLIENTS VIEW' as check_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'clients') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'clients') 
    THEN (SELECT COUNT(*) FROM clients)::text || ' records'
    ELSE 'N/A'
  END as record_count;

-- 9. MOSTRAR ERROS COMUNS E SOLUÇÕES
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNÓSTICO COMPLETO ===';
  RAISE NOTICE 'Verifique os resultados acima para identificar problemas:';
  RAISE NOTICE '';
  RAISE NOTICE '❌ Se FOREIGN KEYS está MISSING:';
  RAISE NOTICE '   → Execute o script PRODUCTION_SETUP.sql';
  RAISE NOTICE '';
  RAISE NOTICE '❌ Se CLIENTS VIEW está MISSING:';
  RAISE NOTICE '   → Execute: CREATE VIEW clients AS SELECT id,name,email FROM user_profiles WHERE role LIKE ''%client'';';
  RAISE NOTICE '';
  RAISE NOTICE '❌ Se API TEST falhou:';
  RAISE NOTICE '   → Verifique as mensagens de erro específicas acima';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Se tudo está OK mas ainda há erro 500:';
  RAISE NOTICE '   → O problema pode ser nas permissões RLS ou no código da API';
END $$;