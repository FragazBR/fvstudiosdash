-- ==================================================
-- CRIAR TABELAS FALTANTES
-- Para resolver erros nas APIs calendar e notifications
-- ==================================================

-- 1. Criar tabela calendar_events se não existir
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    event_type VARCHAR(50) DEFAULT 'meeting', -- 'meeting', 'deadline', 'milestone', 'reminder'
    color VARCHAR(7) DEFAULT '#3b82f6',
    attendees UUID[] DEFAULT '{}',
    location TEXT,
    is_all_day BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela notifications se não existir
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    category VARCHAR(50) DEFAULT 'general', -- 'general', 'project', 'task', 'calendar', 'system'
    related_id UUID,
    related_type VARCHAR(50),
    action_url TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON calendar_events(project_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 4. Verificar se conseguimos criar com sucesso
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
        RAISE NOTICE '✅ Tabela calendar_events criada/existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE '✅ Tabela notifications criada/existe';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 TABELAS AUXILIARES CRIADAS COM SUCESSO!';
    RAISE NOTICE '   Agora as APIs /api/calendar e /api/notifications devem funcionar';
    RAISE NOTICE '';
END $$;