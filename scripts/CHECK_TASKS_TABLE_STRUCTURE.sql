-- ===================================================================
-- VERIFICAR ESTRUTURA DA TABELA TASKS E RELACIONADAS
-- Execute este script para diagnosticar problemas na API de tasks
-- ===================================================================

-- 1. Verificar se a tabela tasks existe e suas colunas
SELECT 'TABELA TASKS - COLUNAS' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se as tabelas relacionadas existem
SELECT 'TABELAS RELACIONADAS' as info, table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tasks', 'projects', 'contacts', 'user_profiles', 'agencies')
ORDER BY table_name;

-- 3. Verificar dados na tabela tasks (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela tasks existe - verificando dados...';
        PERFORM COUNT(*) FROM tasks;
        RAISE NOTICE 'Dados encontrados na tabela tasks';
    ELSE
        RAISE NOTICE 'PROBLEMA: Tabela tasks NÃO existe';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO ao acessar tabela tasks: %', SQLERRM;
END $$;

-- 4. Se a tabela existir, mostrar sample dos dados
SELECT 'SAMPLE TASKS' as info, COUNT(*) as total_tasks FROM tasks;

-- 5. Verificar FKs - se as referências existem
DO $$
BEGIN
    -- Verificar se project_id referencia projects
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
            RAISE NOTICE 'Referência project_id -> projects: OK';
        ELSE
            RAISE NOTICE 'PROBLEMA: tasks.project_id referencia projects que não existe';
        END IF;
    ELSE
        RAISE NOTICE 'PROBLEMA: Coluna project_id não existe em tasks';
    END IF;
    
    -- Verificar se assigned_to referencia user_profiles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
            RAISE NOTICE 'Referência assigned_to -> user_profiles: OK';
        ELSE
            RAISE NOTICE 'PROBLEMA: tasks.assigned_to referencia user_profiles que não existe';
        END IF;
    ELSE
        RAISE NOTICE 'PROBLEMA: Coluna assigned_to não existe em tasks';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERRO verificando FKs: %', SQLERRM;
END $$;