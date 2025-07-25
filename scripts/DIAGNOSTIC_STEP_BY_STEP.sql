-- Execute cada seção separadamente para ver onde está parando

-- PARTE 1: VERIFICAR TABELAS
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