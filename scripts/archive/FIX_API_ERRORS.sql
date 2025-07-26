-- ===================================================================
-- CORRIGIR ERROS 500 DAS APIs - Adicionar colunas e foreign keys
-- ===================================================================

-- 1. ADICIONAR COLUNA created_by NA TABELA PROJECTS
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS created_by uuid;

-- 2. ADICIONAR COLUNA assigned_to NA TABELA TASKS  
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- 3. ADICIONAR FOREIGN KEYS QUE ESTÃO FALTANDO

-- Foreign key para projects.created_by
ALTER TABLE projects 
ADD CONSTRAINT IF NOT EXISTS projects_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Foreign key para tasks.created_by (já existe a coluna, só falta a constraint)
ALTER TABLE tasks 
ADD CONSTRAINT IF NOT EXISTS tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Foreign key para tasks.assigned_to
ALTER TABLE tasks 
ADD CONSTRAINT IF NOT EXISTS tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 4. VERIFICAR RESULTADO
SELECT 
  'NOVA ESTRUTURA PROJECTS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
  AND column_name IN ('created_by', 'client_id', 'agency_id')
ORDER BY column_name;

SELECT 
  'NOVA ESTRUTURA TASKS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public'
  AND column_name IN ('assigned_to', 'created_by', 'project_id')
ORDER BY column_name;

SELECT 
  'TODAS AS FOREIGN KEYS' as check_type,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('projects', 'tasks')
ORDER BY tc.table_name, tc.constraint_name;