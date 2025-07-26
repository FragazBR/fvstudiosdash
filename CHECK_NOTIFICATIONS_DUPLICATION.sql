-- ==================================================
-- VERIFICAR DUPLICAÇÃO ENTRE NOTIFICATIONS E PROJECT_NOTIFICATIONS
-- Analisar estruturas e consolidar em uma única tabela
-- ==================================================

-- 1. Verificar se ambas as tabelas existem
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE '✅ Tabela notifications existe';
    ELSE
        RAISE NOTICE '❌ Tabela notifications NÃO existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_notifications') THEN
        RAISE NOTICE '✅ Tabela project_notifications existe';
    ELSE
        RAISE NOTICE '❌ Tabela project_notifications NÃO existe';
    END IF;
END $$;

-- 2. Comparar estruturas das tabelas
RAISE NOTICE '';
RAISE NOTICE '📋 ESTRUTURA DA TABELA notifications:';
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

RAISE NOTICE '';
RAISE NOTICE '📋 ESTRUTURA DA TABELA project_notifications:';
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_notifications'
ORDER BY ordinal_position;

-- 3. Contar registros em cada tabela
DO $$
DECLARE
    notifications_count INTEGER := 0;
    project_notifications_count INTEGER := 0;
BEGIN
    -- Contar notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        SELECT COUNT(*) INTO notifications_count FROM notifications;
    END IF;
    
    -- Contar project_notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_notifications') THEN
        SELECT COUNT(*) INTO project_notifications_count FROM project_notifications;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 DADOS NAS TABELAS:';
    RAISE NOTICE '   notifications: % registros', notifications_count;
    RAISE NOTICE '   project_notifications: % registros', project_notifications_count;
END $$;

-- 4. Verificar componentes que usam cada tabela
RAISE NOTICE '';
RAISE NOTICE '🔍 ANÁLISE DE USO:';
RAISE NOTICE '   - RealtimeNotifications component usa: project_notifications';
RAISE NOTICE '   - APIs gerais provavelmente usam: notifications';
RAISE NOTICE '   - Workstation pode usar ambas';
RAISE NOTICE '';
RAISE NOTICE '💡 RECOMENDAÇÃO:';
RAISE NOTICE '   Consolidar em uma única tabela notifications com campos do projeto inteligente';