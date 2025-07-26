-- ================================
-- CORREÇÃO ESPECÍFICA PARA COLUNAS DA TABELA TASKS
-- Execute este script no Supabase SQL Editor
-- ================================

-- Adicionar colunas que estão faltando na tabela tasks
DO $$ 
BEGIN
  -- Adicionar status se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'status') THEN
    ALTER TABLE tasks ADD COLUMN status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled'));
  END IF;
  
  -- Adicionar priority se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') THEN
    ALTER TABLE tasks ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
  
  -- Adicionar position se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'position') THEN
    ALTER TABLE tasks ADD COLUMN position integer DEFAULT 0;
  END IF;
  
  -- Adicionar progress se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'progress') THEN
    ALTER TABLE tasks ADD COLUMN progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
  END IF;
  
  -- Adicionar tags se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'tags') THEN
    ALTER TABLE tasks ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  
  -- Adicionar labels se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'labels') THEN
    ALTER TABLE tasks ADD COLUMN labels text[] DEFAULT '{}';
  END IF;
  
  -- Adicionar attachments se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'attachments') THEN
    ALTER TABLE tasks ADD COLUMN attachments jsonb DEFAULT '[]';
  END IF;
  
  -- Adicionar dependencies se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'dependencies') THEN
    ALTER TABLE tasks ADD COLUMN dependencies text[] DEFAULT '{}';
  END IF;
  
  -- Adicionar comments_count se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'comments_count') THEN
    ALTER TABLE tasks ADD COLUMN comments_count integer DEFAULT 0;
  END IF;
  
  -- Adicionar actual_hours se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'actual_hours') THEN
    ALTER TABLE tasks ADD COLUMN actual_hours numeric(5,2) DEFAULT 0;
  END IF;
  
  -- Adicionar completed_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_at') THEN
    ALTER TABLE tasks ADD COLUMN completed_at timestamptz;
  END IF;
  
  -- Adicionar estimated_hours se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'estimated_hours') THEN
    ALTER TABLE tasks ADD COLUMN estimated_hours numeric(5,2);
  END IF;
  
  -- Adicionar due_date se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
    ALTER TABLE tasks ADD COLUMN due_date timestamptz;
  END IF;
END $$;

-- Atualizar dados existentes com valores padrão
UPDATE tasks SET 
  status = 'todo' WHERE status IS NULL;
UPDATE tasks SET 
  priority = 'medium' WHERE priority IS NULL;
UPDATE tasks SET 
  position = 0 WHERE position IS NULL;
UPDATE tasks SET 
  progress = 0 WHERE progress IS NULL;
UPDATE tasks SET 
  tags = ARRAY[]::text[] WHERE tags IS NULL;
UPDATE tasks SET 
  labels = ARRAY[]::text[] WHERE labels IS NULL;
UPDATE tasks SET 
  attachments = '[]'::jsonb WHERE attachments IS NULL;
UPDATE tasks SET 
  dependencies = ARRAY[]::text[] WHERE dependencies IS NULL;
UPDATE tasks SET 
  comments_count = 0 WHERE comments_count IS NULL;
UPDATE tasks SET 
  actual_hours = 0 WHERE actual_hours IS NULL;

-- Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies básicas
DO $$
BEGIN
  -- Remover policies existentes
  DROP POLICY IF EXISTS "Admin full access tasks" ON tasks;
  DROP POLICY IF EXISTS "Agency members see own agency tasks" ON tasks;
  DROP POLICY IF EXISTS "Users see assigned tasks" ON tasks;
  
  -- Criar policies novas
  CREATE POLICY "Admin full access tasks" ON tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
  
  CREATE POLICY "Agency members see own agency tasks" ON tasks FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      JOIN projects p ON p.agency_id = up.agency_id 
      WHERE up.id = auth.uid() 
      AND p.id = tasks.project_id
    )
  );
  
  CREATE POLICY "Users see assigned tasks" ON tasks FOR ALL USING (
    assigned_to = auth.uid() OR created_by = auth.uid()
  );
END $$;