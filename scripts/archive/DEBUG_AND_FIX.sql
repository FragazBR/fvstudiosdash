-- ===================================================================
-- DEBUG AND FIX SCRIPT - Execute this to fix current database issues
-- ===================================================================

-- Step 1: Check current table structure and foreign keys
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  ccu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('projects', 'tasks', 'user_invitations');

-- Step 2: Ensure all required helper functions exist
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_accounts()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'agency_owner', 'agency_manager') 
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.same_agency()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT COALESCE(agency_id, id) 
    FROM user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Fix foreign key relationships if missing
DO $$
BEGIN
  -- Fix projects.client_id -> user_profiles(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_client_id_fkey' 
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects 
    ADD CONSTRAINT projects_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;

  -- Fix tasks.project_id -> projects(id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_project_id_fkey' 
    AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Create or recreate the clients view
DROP VIEW IF EXISTS public.clients CASCADE;
CREATE VIEW public.clients AS
SELECT 
  id, name, email, company, phone, avatar_url, created_at, updated_at
FROM public.user_profiles
WHERE role IN ('agency_client', 'independent_client');

GRANT SELECT ON public.clients TO authenticated;

-- Step 5: Update RLS policies to be more permissive for testing
DROP POLICY IF EXISTS "Users can view projects from their agency" ON projects;
CREATE POLICY "Users can view projects from their agency" ON projects
  FOR SELECT USING (
    -- Admin can see all
    is_admin() OR
    -- Users can see projects they're involved with
    (auth.uid() IS NOT NULL AND (
      client_id = auth.uid() OR
      created_by = auth.uid() OR
      client_id IN (
        SELECT id FROM user_profiles 
        WHERE COALESCE(agency_id, id) = same_agency()
      )
    ))
  );

DROP POLICY IF EXISTS "Users can view accessible tasks" ON tasks;
CREATE POLICY "Users can view accessible tasks" ON tasks
  FOR SELECT USING (
    -- Admin can see all
    is_admin() OR
    -- Users can see tasks from accessible projects
    (auth.uid() IS NOT NULL AND (
      assigned_to = auth.uid() OR
      created_by = auth.uid() OR
      project_id IN (
        SELECT id FROM projects 
        WHERE 
          client_id = auth.uid() OR
          created_by = auth.uid() OR
          client_id IN (
            SELECT id FROM user_profiles 
            WHERE COALESCE(agency_id, id) = same_agency()
          )
      )
    ))
  );

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION public.same_agency TO authenticated;

-- Step 7: Check if we have any projects/tasks data for testing
DO $$
DECLARE
  project_count INTEGER;
  task_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO project_count FROM projects;
  SELECT COUNT(*) INTO task_count FROM tasks;
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  RAISE NOTICE 'Database Status:';
  RAISE NOTICE '- Users: %', user_count;
  RAISE NOTICE '- Projects: %', project_count;
  RAISE NOTICE '- Tasks: %', task_count;
  
  -- Create sample data if none exists
  IF project_count = 0 AND user_count > 0 THEN
    INSERT INTO projects (name, description, status, client_id, created_by)
    SELECT 
      'Projeto de Exemplo',
      'Projeto criado automaticamente para teste',
      'planning',
      id,
      id
    FROM user_profiles 
    WHERE role IN ('admin', 'agency_owner') 
    LIMIT 1;
    
    RAISE NOTICE 'Sample project created for testing';
  END IF;
END $$;

-- Step 8: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ===================================================================
-- VERIFICATION QUERIES - Run these to check if everything is working
-- ===================================================================

-- Check if foreign keys exist
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('projects', 'tasks')
ORDER BY tc.table_name;

-- Check if helper functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('is_admin', 'can_manage_accounts', 'same_agency');

-- Check if clients view exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'clients' AND table_schema = 'public';

RAISE NOTICE 'Debug script completed! Check the output above for any issues.';
RAISE NOTICE 'If you see the expected foreign keys, functions, and views, the API should work now.';