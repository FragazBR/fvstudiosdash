-- Fix database foreign key relationships
-- This script fixes the relationship issues causing API errors

-- First, let's check if tables exist and their current structure
-- If tables don't exist, create them with proper relationships

-- Create clients table if it doesn't exist (using user_profiles as clients)
-- The API expects client_id to reference a table with id, name, email fields

-- Option 1: Create a view for clients based on user_profiles
CREATE OR REPLACE VIEW public.clients AS
SELECT 
  id,
  name,
  email,
  company,
  phone,
  avatar_url,
  created_at,
  updated_at
FROM public.user_profiles
WHERE role IN ('agency_client', 'independent_client');

-- Grant permissions on the view
GRANT SELECT ON public.clients TO authenticated;

-- Option 2: Ensure projects table has correct structure and foreign keys
-- First drop existing foreign key constraints if they exist
DO $$ 
BEGIN
  -- Drop existing foreign key constraints if they exist
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'projects_client_id_fkey' 
             AND table_name = 'projects') THEN
    ALTER TABLE projects DROP CONSTRAINT projects_client_id_fkey;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'tasks_project_id_fkey' 
             AND table_name = 'tasks') THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_project_id_fkey;
  END IF;
END $$;

-- Re-create foreign key constraints
-- projects.client_id should reference user_profiles(id) since we use user_profiles for clients
ALTER TABLE projects 
ADD CONSTRAINT projects_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- tasks.project_id should reference projects(id)
ALTER TABLE tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Ensure we have the correct indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Update RLS policies to work with the relationships
-- Enable RLS on projects and tasks if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy for projects - users can see projects from their agency
DROP POLICY IF EXISTS "Users can view projects from their agency" ON projects;
CREATE POLICY "Users can view projects from their agency" ON projects
  FOR SELECT USING (
    -- Admin can see all
    is_admin() OR
    -- Agency members can see projects from their agency
    (client_id IN (
      SELECT id FROM user_profiles 
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
      OR id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    )) OR
    -- User can see their own projects as client
    client_id = auth.uid()
  );

-- RLS Policy for tasks - users can see tasks from projects they have access to
DROP POLICY IF EXISTS "Users can view tasks from accessible projects" ON tasks;
CREATE POLICY "Users can view tasks from accessible projects" ON tasks
  FOR SELECT USING (
    -- Admin can see all
    is_admin() OR
    -- Check if user has access to the project
    project_id IN (
      SELECT id FROM projects 
      WHERE 
        -- Agency members can see projects from their agency
        (client_id IN (
          SELECT id FROM user_profiles 
          WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
          OR id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
        )) OR
        -- User can see their own projects as client
        client_id = auth.uid()
    )
  );

-- Insert/Update/Delete policies for projects
DROP POLICY IF EXISTS "Agency members can insert projects" ON projects;
CREATE POLICY "Agency members can insert projects" ON projects
  FOR INSERT WITH CHECK (
    is_admin() OR
    (can_manage_accounts() AND client_id IN (
      SELECT id FROM user_profiles 
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
      OR id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    ))
  );

DROP POLICY IF EXISTS "Agency members can update projects" ON projects;
CREATE POLICY "Agency members can update projects" ON projects
  FOR UPDATE USING (
    is_admin() OR
    (can_manage_accounts() AND client_id IN (
      SELECT id FROM user_profiles 
      WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
      OR id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    ))
  );

-- Insert/Update/Delete policies for tasks
DROP POLICY IF EXISTS "Agency members can insert tasks" ON tasks;
CREATE POLICY "Agency members can insert tasks" ON tasks
  FOR INSERT WITH CHECK (
    is_admin() OR
    project_id IN (
      SELECT id FROM projects 
      WHERE 
        (client_id IN (
          SELECT id FROM user_profiles 
          WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
          OR id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
        ))
    )
  );

DROP POLICY IF EXISTS "Agency members can update tasks" ON tasks;
CREATE POLICY "Agency members can update tasks" ON tasks
  FOR UPDATE USING (
    is_admin() OR
    project_id IN (
      SELECT id FROM projects 
      WHERE 
        (client_id IN (
          SELECT id FROM user_profiles 
          WHERE agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
          OR id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
        ))
    )
  );

-- Refresh the schema cache (this might help with PostgREST relationship detection)
NOTIFY pgrst, 'reload schema';

-- Comment for documentation
COMMENT ON VIEW public.clients IS 'View of user_profiles filtered for client roles - used by API for client relationships';
COMMENT ON CONSTRAINT projects_client_id_fkey ON projects IS 'Foreign key linking projects to user_profiles (clients)';
COMMENT ON CONSTRAINT tasks_project_id_fkey ON tasks IS 'Foreign key linking tasks to projects';