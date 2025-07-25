-- ===================================================================
-- DIAGNOSTIC SCRIPT SIMPLIFIED - Identifica problemas nas APIs
-- ===================================================================

-- 1. VERIFICAR ESTRUTURA DAS TABELAS
SELECT 
  'TABLES CHECK' as check_type,
  'user_profiles' as table_name,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') 
       THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'TABLES CHECK' as check_type,
  'projects' as table_name,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') 
       THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'TABLES CHECK' as check_type,
  'tasks' as table_name,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') 
       THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'TABLES CHECK' as check_type,
  'clients' as table_name,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'clients' AND table_schema = 'public') 
       THEN 'EXISTS (VIEW)' ELSE 'MISSING' END as status
ORDER BY table_name;

-- 2. VERIFICAR FOREIGN KEYS
SELECT 
  'FOREIGN KEYS' as check_type,
  tc.table_name,
  tc.constraint_name,
  'EXISTS' as status
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('projects', 'tasks')
ORDER BY tc.table_name, tc.constraint_name;

-- 3. VERIFICAR COLUNAS IMPORTANTES
SELECT 
  'PROJECTS COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
  AND column_name IN ('id', 'client_id', 'created_by', 'name', 'status')
ORDER BY column_name;

SELECT 
  'TASKS COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public'
  AND column_name IN ('id', 'project_id', 'assigned_to', 'created_by', 'title', 'status')
ORDER BY column_name;

-- 4. CONTAR DADOS
SELECT 
  'DATA COUNT' as check_type,
  'user_profiles' as table_name,
  COUNT(*) as record_count
FROM user_profiles;

SELECT 
  'DATA COUNT' as check_type,
  'projects' as table_name,
  COUNT(*) as record_count
FROM projects;

SELECT 
  'DATA COUNT' as check_type,
  'tasks' as table_name,
  COUNT(*) as record_count
FROM tasks;

-- 5. TESTAR JOIN PROJECTS (o que a API usa)
SELECT 
  'PROJECTS JOIN TEST' as test_type,
  COUNT(*) as total_projects,
  COUNT(p.client_id) as projects_with_client,
  COUNT(client.id) as valid_client_refs
FROM projects p
LEFT JOIN user_profiles client ON client.id = p.client_id;

-- 6. TESTAR JOIN TASKS (o que a API usa)
SELECT 
  'TASKS JOIN TEST' as test_type,
  COUNT(*) as total_tasks,
  COUNT(t.project_id) as tasks_with_project,
  COUNT(p.id) as valid_project_refs
FROM tasks t
LEFT JOIN projects p ON p.id = t.project_id;

-- 7. VERIFICAR CONSTRAINTS ESPECÍFICAS QUE PODEM ESTAR FALTANDO
SELECT 
  'MISSING CONSTRAINTS' as check_type,
  'projects_client_id_fkey' as constraint_name,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_client_id_fkey'
  ) THEN 'EXISTS' ELSE 'MISSING - EXECUTE PRODUCTION_SETUP.sql' END as status
UNION ALL
SELECT 
  'MISSING CONSTRAINTS' as check_type,
  'tasks_project_id_fkey' as constraint_name,
  CASE WHEN EXISTS(
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_project_id_fkey'
  ) THEN 'EXISTS' ELSE 'MISSING - EXECUTE PRODUCTION_SETUP.sql' END as status;

-- 8. VERIFICAR CLIENTS VIEW
SELECT 
  'CLIENTS VIEW' as check_type,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'clients') 
       THEN 'EXISTS' ELSE 'MISSING - CREATE VIEW' END as status,
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'clients') 
       THEN (SELECT COUNT(*)::text FROM clients) || ' records'
       ELSE 'N/A' END as details;

-- 9. VERIFICAR RLS POLICIES
SELECT 
  'RLS STATUS' as check_type,
  tablename,
  CASE WHEN COUNT(*) > 0 THEN 'HAS POLICIES' ELSE 'NO POLICIES' END as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('projects', 'tasks', 'user_profiles')
GROUP BY tablename
ORDER BY tablename;