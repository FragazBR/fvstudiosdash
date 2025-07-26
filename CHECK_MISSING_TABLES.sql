-- ==================================================
-- VERIFICAR TABELAS FALTANTES
-- Identificar o que pode estar causando erros
-- ==================================================

-- Verificar quais tabelas existem
SELECT 
    schemaname, 
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
    AND (
        tablename LIKE '%calendar%' OR 
        tablename LIKE '%notification%' OR
        tablename = 'projects' OR
        tablename = 'tasks' OR
        tablename = 'contacts' OR
        tablename = 'user_profiles' OR
        tablename = 'agencies'
    )
ORDER BY tablename;

-- Verificar se calendar_events existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
        RAISE NOTICE '✅ Tabela calendar_events existe';
    ELSE
        RAISE NOTICE '❌ Tabela calendar_events NÃO existe - pode causar erro na API /api/calendar';
    END IF;
END $$;

-- Verificar se notifications existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE '✅ Tabela notifications existe';
    ELSE
        RAISE NOTICE '❌ Tabela notifications NÃO existe - pode causar erro na API /api/notifications';
    END IF;
END $$;

-- Verificar estrutura das tabelas principais
DO $$
DECLARE
    projects_cols INTEGER;
    tasks_cols INTEGER;
    contacts_cols INTEGER;
BEGIN
    SELECT COUNT(*) INTO projects_cols FROM information_schema.columns WHERE table_name = 'projects';
    SELECT COUNT(*) INTO tasks_cols FROM information_schema.columns WHERE table_name = 'tasks';
    SELECT COUNT(*) INTO contacts_cols FROM information_schema.columns WHERE table_name = 'contacts';
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTRUTURA DAS TABELAS:';
    RAISE NOTICE '   projects: % colunas', projects_cols;
    RAISE NOTICE '   tasks: % colunas', tasks_cols;
    RAISE NOTICE '   contacts: % colunas', contacts_cols;
END $$;

-- Listar colunas da tabela projects para debug
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;