-- ================================
-- CORREÇÃO SIMPLES PARA TASKS - SEM CONFLITOS DE TIPO
-- Execute este script no Supabase SQL Editor
-- ================================

-- 1. Adicionar apenas colunas essenciais que sabemos que estão faltando
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

-- 2. Atualizar apenas campos que foram criados
UPDATE tasks SET status = 'todo' WHERE status IS NULL;
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;
UPDATE tasks SET position = 0 WHERE position IS NULL;
UPDATE tasks SET progress = 0 WHERE progress IS NULL;

-- 3. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- 4. Habilitar RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 5. Políticas básicas (drop primeiro para evitar conflitos)
DROP POLICY IF EXISTS "Admin full access tasks" ON tasks;
DROP POLICY IF EXISTS "Agency members see tasks" ON tasks; 
DROP POLICY IF EXISTS "Users see assigned tasks" ON tasks;

-- Criar políticas simples
CREATE POLICY "Admin full access tasks" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see project tasks" ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN projects p ON p.agency_id = up.agency_id 
    WHERE up.id = auth.uid() 
    AND p.id = tasks.project_id
  ) OR assigned_to = auth.uid() OR created_by = auth.uid()
);

CREATE POLICY "Users manage project tasks" ON tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN projects p ON p.agency_id = up.agency_id 
    WHERE up.id = auth.uid() 
    AND p.id = project_id
  )
);

CREATE POLICY "Users update project tasks" ON tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN projects p ON p.agency_id = up.agency_id 
    WHERE up.id = auth.uid() 
    AND p.id = tasks.project_id
  ) OR assigned_to = auth.uid()
);

-- 6. Inserir algumas tarefas de exemplo se não existirem
INSERT INTO tasks (title, description, project_id, created_by, status, priority, position) 
SELECT 
  'Tarefa de Exemplo #' || ROW_NUMBER() OVER() as title,
  'Descrição da tarefa de exemplo para testes' as description,
  p.id as project_id,
  p.created_by as created_by,
  'todo' as status,
  'medium' as priority,
  1 as position
FROM projects p 
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = p.id)
LIMIT 5
ON CONFLICT DO NOTHING;