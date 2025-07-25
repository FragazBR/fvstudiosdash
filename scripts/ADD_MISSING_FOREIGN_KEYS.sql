-- Adicionar foreign keys que estão faltando nas tabelas
-- Execute APÓS verificar a estrutura com CHECK_STRUCTURE.sql

-- Para projects table
-- Adicionar created_by (se a coluna existir)
DO $$
BEGIN
  -- Verificar se a coluna created_by existe na tabela projects
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'created_by' 
    AND table_schema = 'public'
  ) THEN
    -- Verificar se a foreign key já existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'projects_created_by_fkey'
    ) THEN
      -- Adicionar foreign key para created_by
      ALTER TABLE projects 
      ADD CONSTRAINT projects_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;
      
      RAISE NOTICE '✅ Added projects_created_by_fkey constraint';
    ELSE
      RAISE NOTICE '⚠️ projects_created_by_fkey already exists';
    END IF;
  ELSE
    RAISE NOTICE '❌ Column created_by does not exist in projects table';
  END IF;
END $$;

-- Para tasks table
-- Adicionar assigned_to foreign key (se a coluna existir)
DO $$
BEGIN
  -- Verificar se a coluna assigned_to existe na tabela tasks
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'assigned_to' 
    AND table_schema = 'public'
  ) THEN
    -- Verificar se a foreign key já existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'tasks_assigned_to_fkey'
    ) THEN
      -- Adicionar foreign key para assigned_to
      ALTER TABLE tasks 
      ADD CONSTRAINT tasks_assigned_to_fkey 
      FOREIGN KEY (assigned_to) REFERENCES user_profiles(id) ON DELETE SET NULL;
      
      RAISE NOTICE '✅ Added tasks_assigned_to_fkey constraint';
    ELSE
      RAISE NOTICE '⚠️ tasks_assigned_to_fkey already exists';
    END IF;
  ELSE
    RAISE NOTICE '❌ Column assigned_to does not exist in tasks table';
  END IF;
END $$;

-- Adicionar created_by foreign key para tasks (se a coluna existir)
DO $$
BEGIN
  -- Verificar se a coluna created_by existe na tabela tasks
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'created_by' 
    AND table_schema = 'public'
  ) THEN
    -- Verificar se a foreign key já existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'tasks_created_by_fkey'
    ) THEN
      -- Adicionar foreign key para created_by
      ALTER TABLE tasks 
      ADD CONSTRAINT tasks_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;
      
      RAISE NOTICE '✅ Added tasks_created_by_fkey constraint';
    ELSE
      RAISE NOTICE '⚠️ tasks_created_by_fkey already exists';
    END IF;
  ELSE
    RAISE NOTICE '❌ Column created_by does not exist in tasks table';
  END IF;
END $$;

-- Verificar outros foreign keys importantes
-- client_id para projects
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'client_id' 
    AND table_schema = 'public'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'projects_client_id_fkey'
    ) THEN
      ALTER TABLE projects 
      ADD CONSTRAINT projects_client_id_fkey 
      FOREIGN KEY (client_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
      
      RAISE NOTICE '✅ Added projects_client_id_fkey constraint';
    ELSE
      RAISE NOTICE '⚠️ projects_client_id_fkey already exists';
    END IF;
  ELSE
    RAISE NOTICE '❌ Column client_id does not exist in projects table';
  END IF;
END $$;

-- project_id para tasks
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'project_id' 
    AND table_schema = 'public'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'tasks_project_id_fkey'
    ) THEN
      ALTER TABLE tasks 
      ADD CONSTRAINT tasks_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
      
      RAISE NOTICE '✅ Added tasks_project_id_fkey constraint';
    ELSE
      RAISE NOTICE '⚠️ tasks_project_id_fkey already exists';
    END IF;
  ELSE
    RAISE NOTICE '❌ Column project_id does not exist in tasks table';
  END IF;
END $$;

-- Mostrar resultado final
SELECT 
  'FINAL FOREIGN KEYS CHECK' as check_type,
  tc.table_name,
  tc.constraint_name,
  '✅' as status
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('projects', 'tasks')
ORDER BY tc.table_name, tc.constraint_name;