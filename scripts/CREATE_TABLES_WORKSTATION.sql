-- ================================
-- CRIAR TABELAS NECESSÁRIAS PARA WORKSTATION
-- Execute este script no Supabase SQL Editor
-- ================================

-- 1. Criar tabela contacts se não existir
CREATE TABLE IF NOT EXISTS contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  position text,
  type text DEFAULT 'lead',
  status text DEFAULT 'active',
  agency_id uuid,
  created_by uuid,
  assigned_to uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Adicionar colunas essenciais para tasks se não existirem
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

-- 3. Atualizar valores NULL com padrões apenas se as tabelas existirem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    UPDATE tasks SET status = 'todo' WHERE status IS NULL;
    UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;
    UPDATE tasks SET position = 0 WHERE position IS NULL;
    UPDATE tasks SET progress = 0 WHERE progress IS NULL;
  END IF;
END $$;

-- 4. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- 5. Habilitar RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para tasks
DROP POLICY IF EXISTS "Admin full access tasks" ON tasks;
DROP POLICY IF EXISTS "Users see tasks" ON tasks;
DROP POLICY IF EXISTS "Agency tasks access" ON tasks;

CREATE POLICY "Admin full access tasks" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency tasks access" ON tasks FOR ALL USING (
  assigned_to = auth.uid() OR created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN projects p ON p.agency_id = up.agency_id 
    WHERE up.id = auth.uid() AND p.id = tasks.project_id
  )
);

-- 7. Políticas para contacts
DROP POLICY IF EXISTS "Admin full access contacts" ON contacts;
DROP POLICY IF EXISTS "Users see contacts" ON contacts;
DROP POLICY IF EXISTS "Agency contacts access" ON contacts;

CREATE POLICY "Admin full access contacts" ON contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency contacts access" ON contacts FOR ALL USING (
  assigned_to = auth.uid() OR created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.agency_id = contacts.agency_id
  )
);

-- 8. Inserir alguns dados de exemplo básicos
INSERT INTO contacts (name, email, company, type, status) VALUES
  ('João Silva', 'joao@exemplo.com', 'Empresa ABC', 'client', 'active'),
  ('Maria Santos', 'maria@exemplo.com', 'Empresa XYZ', 'lead', 'active')
ON CONFLICT DO NOTHING;

-- Inserir tarefas básicas se existirem projetos
INSERT INTO tasks (title, description, status, priority, position)
SELECT 
  'Tarefa Exemplo #' || generate_series(1,3),
  'Descrição da tarefa de exemplo',
  'todo',
  'medium', 
  generate_series(1,3)
WHERE EXISTS (SELECT 1 FROM projects)
ON CONFLICT DO NOTHING;