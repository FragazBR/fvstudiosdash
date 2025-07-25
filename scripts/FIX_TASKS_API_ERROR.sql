-- ================================
-- FIX TASKS API ERROR - CREATE/UPDATE TASKS TABLE
-- Execute este script no Supabase SQL Editor
-- ================================

-- Criar tabela tasks se não existir
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  position integer DEFAULT 0,
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2) DEFAULT 0,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date timestamptz,
  completed_at timestamptz,
  tags text[] DEFAULT '{}',
  attachments jsonb DEFAULT '[]',
  comments_count integer DEFAULT 0,
  dependencies text[] DEFAULT '{}',
  labels text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar campos que podem estar faltando
DO $$ 
BEGIN
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
END $$;

-- Criar tabela task_comments para suporte aos comentários
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES task_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela task_time_logs para registro de tempo
CREATE TABLE IF NOT EXISTS task_time_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  hours numeric(5,2) NOT NULL,
  description text,
  logged_date date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(project_id, status, position);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON task_time_logs(user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar contador de comentários
CREATE OR REPLACE FUNCTION update_task_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tasks SET comments_count = comments_count + 1 WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tasks SET comments_count = comments_count - 1 WHERE id = OLD.task_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_task_comments_count ON task_comments;
CREATE TRIGGER trigger_update_task_comments_count
  AFTER INSERT OR DELETE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_task_comments_count();

-- Trigger para atualizar horas gastas
CREATE OR REPLACE FUNCTION update_task_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tasks 
    SET actual_hours = (
      SELECT COALESCE(SUM(hours), 0) 
      FROM task_time_logs 
      WHERE task_id = NEW.task_id
    ) 
    WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE tasks 
    SET actual_hours = (
      SELECT COALESCE(SUM(hours), 0) 
      FROM task_time_logs 
      WHERE task_id = NEW.task_id
    ) 
    WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tasks 
    SET actual_hours = (
      SELECT COALESCE(SUM(hours), 0) 
      FROM task_time_logs 
      WHERE task_id = OLD.task_id
    ) 
    WHERE id = OLD.task_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_task_actual_hours ON task_time_logs;
CREATE TRIGGER trigger_update_task_actual_hours
  AFTER INSERT OR UPDATE OR DELETE ON task_time_logs
  FOR EACH ROW EXECUTE FUNCTION update_task_actual_hours();

-- Trigger para atualizar completed_at quando status muda para completed
CREATE OR REPLACE FUNCTION update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
    NEW.progress = 100;
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_task_completed_at ON tasks;
CREATE TRIGGER trigger_update_task_completed_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_task_completed_at();

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;

-- Policies para tasks
CREATE POLICY "Admin full access tasks" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency members see own agency tasks" ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN projects p ON p.agency_id = up.agency_id 
    WHERE up.id = auth.uid() 
    AND p.id = tasks.project_id
    AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
  )
);

CREATE POLICY "Agency members create tasks" ON tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN projects p ON p.agency_id = up.agency_id 
    WHERE up.id = auth.uid() 
    AND p.id = project_id
    AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
  )
);

CREATE POLICY "Agency members update tasks" ON tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN projects p ON p.agency_id = up.agency_id 
    WHERE up.id = auth.uid() 
    AND p.id = tasks.project_id
    AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
  )
);

CREATE POLICY "Agency members delete tasks" ON tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    JOIN projects p ON p.agency_id = up.agency_id 
    WHERE up.id = auth.uid() 
    AND p.id = tasks.project_id
    AND up.role IN ('agency_owner', 'agency_manager')
  )
);

-- Assigned users can see their tasks
CREATE POLICY "Users see assigned tasks" ON tasks FOR SELECT USING (
  assigned_to = auth.uid()
);

-- Users can update their assigned tasks
CREATE POLICY "Users update assigned tasks" ON tasks FOR UPDATE USING (
  assigned_to = auth.uid()
);

-- Policies para task_comments
CREATE POLICY "Admin full access task_comments" ON task_comments FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see comments of accessible tasks" ON task_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_comments.task_id
    AND (
      t.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles up 
        JOIN projects p ON p.agency_id = up.agency_id 
        WHERE up.id = auth.uid() 
        AND p.id = t.project_id
        AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
      )
    )
  )
);

CREATE POLICY "Users create comments on accessible tasks" ON task_comments FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_id
    AND (
      t.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles up 
        JOIN projects p ON p.agency_id = up.agency_id 
        WHERE up.id = auth.uid() 
        AND p.id = t.project_id
        AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
      )
    )
  )
);

CREATE POLICY "Users update own comments" ON task_comments FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "Users delete own comments" ON task_comments FOR DELETE USING (
  user_id = auth.uid()
);

-- Policies para task_time_logs
CREATE POLICY "Admin full access task_time_logs" ON task_time_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see time logs of accessible tasks" ON task_time_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_time_logs.task_id
    AND (
      t.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles up 
        JOIN projects p ON p.agency_id = up.agency_id 
        WHERE up.id = auth.uid() 
        AND p.id = t.project_id
        AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
      )
    )
  )
);

CREATE POLICY "Users create time logs" ON task_time_logs FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_id
    AND (
      t.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles up 
        JOIN projects p ON p.agency_id = up.agency_id 
        WHERE up.id = auth.uid() 
        AND p.id = t.project_id
        AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
      )
    )
  )
);

CREATE POLICY "Users update own time logs" ON task_time_logs FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "Users delete own time logs" ON task_time_logs FOR DELETE USING (
  user_id = auth.uid()
);

-- Inserir algumas tarefas de exemplo para teste
INSERT INTO tasks (title, description, project_id, created_by, status, priority, position) 
SELECT 
  'Configurar ambiente de desenvolvimento' as title,
  'Configurar ambiente local e dependências do projeto' as description,
  p.id as project_id,
  p.created_by as created_by,
  'todo' as status,
  'high' as priority,
  1 as position
FROM projects p 
WHERE p.status = 'active'
LIMIT 3
ON CONFLICT DO NOTHING;

INSERT INTO tasks (title, description, project_id, created_by, status, priority, position) 
SELECT 
  'Revisar especificações do cliente' as title,
  'Analisar requisitos e validar escopo do projeto' as description,
  p.id as project_id,
  p.created_by as created_by,
  'in_progress' as status,
  'medium' as priority,
  2 as position
FROM projects p 
WHERE p.status = 'active'
LIMIT 3
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE tasks IS 'Tarefas dos projetos com status e prioridades';
COMMENT ON TABLE task_comments IS 'Comentários nas tarefas';
COMMENT ON TABLE task_time_logs IS 'Registro de horas trabalhadas nas tarefas';