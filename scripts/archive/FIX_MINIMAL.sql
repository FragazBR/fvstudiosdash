-- ================================
-- CORREÇÃO MÍNIMA - APENAS ADICIONAR COLUNAS ESSENCIAIS
-- Execute este script no Supabase SQL Editor
-- ================================

-- 1. Adicionar colunas essenciais para tasks
DO $$ 
BEGIN
  -- Adicionar status se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'status') THEN
    ALTER TABLE tasks ADD COLUMN status text DEFAULT 'todo';
  END IF;
  
  -- Adicionar priority se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') THEN
    ALTER TABLE tasks ADD COLUMN priority text DEFAULT 'medium';
  END IF;
  
  -- Adicionar position se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'position') THEN
    ALTER TABLE tasks ADD COLUMN position integer DEFAULT 0;
  END IF;
  
  -- Adicionar progress se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'progress') THEN
    ALTER TABLE tasks ADD COLUMN progress integer DEFAULT 0;
  END IF;
END $$;

-- 2. Adicionar colunas essenciais para contacts
DO $$ 
BEGIN
  -- Adicionar agency_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'agency_id') THEN
    ALTER TABLE contacts ADD COLUMN agency_id uuid;
  END IF;
  
  -- Adicionar created_by se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'created_by') THEN
    ALTER TABLE contacts ADD COLUMN created_by uuid;
  END IF;
  
  -- Adicionar assigned_to se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'assigned_to') THEN
    ALTER TABLE contacts ADD COLUMN assigned_to uuid;
  END IF;
END $$;

-- 3. Atualizar valores NULL com padrões
UPDATE tasks SET status = 'todo' WHERE status IS NULL;
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;
UPDATE tasks SET position = 0 WHERE position IS NULL;
UPDATE tasks SET progress = 0 WHERE progress IS NULL;

-- 4. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- 5. Habilitar RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 6. Políticas básicas para tasks
DROP POLICY IF EXISTS "Admin full access tasks" ON tasks;
DROP POLICY IF EXISTS "Users see tasks" ON tasks;

CREATE POLICY "Admin full access tasks" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see tasks" ON tasks FOR SELECT USING (
  assigned_to = auth.uid() OR created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN projects p ON p.agency_id = up.agency_id 
    WHERE up.id = auth.uid() AND p.id = tasks.project_id
  )
);

-- 7. Políticas básicas para contacts
DROP POLICY IF EXISTS "Admin full access contacts" ON contacts;
DROP POLICY IF EXISTS "Users see contacts" ON contacts;

CREATE POLICY "Admin full access contacts" ON contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see contacts" ON contacts FOR SELECT USING (
  assigned_to = auth.uid() OR created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.agency_id = contacts.agency_id
  )
);