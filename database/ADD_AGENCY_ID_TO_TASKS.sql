-- ==================================================
-- ADICIONAR AGENCY_ID À TABELA TASKS
-- Para garantir multi-tenancy e compatibilidade com API
-- ==================================================

-- 1. Adicionar agency_id se não existir
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_tasks_agency_id ON tasks(agency_id);

-- 3. Atualizar tarefas existentes com agency_id baseado no projeto
UPDATE tasks 
SET agency_id = (
    SELECT p.agency_id 
    FROM projects p 
    WHERE p.id = tasks.project_id
)
WHERE agency_id IS NULL;

-- 4. Tornar agency_id obrigatório
ALTER TABLE tasks 
ALTER COLUMN agency_id SET NOT NULL;

-- 5. Verificar se foi aplicado corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name = 'agency_id';

-- 6. Contar tarefas por agência
SELECT 
    a.name as agency_name,
    COUNT(t.id) as total_tasks
FROM agencies a
LEFT JOIN tasks t ON a.id = t.agency_id
GROUP BY a.id, a.name
ORDER BY total_tasks DESC;

-- ==================================================
-- Execute este script para adicionar multi-tenancy em tasks
-- ==================================================