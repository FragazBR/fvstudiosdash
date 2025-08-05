-- 🔧 CORREÇÃO DE SCHEMAS - PASSO A PASSO
-- Execute uma seção por vez para identificar problemas

-- ========================================
-- PASSO 1: CORRIGIR TABELA AGENCIES
-- ========================================
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Verificar se foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agencies' AND column_name = 'created_by';

-- ========================================
-- PASSO 2: CRIAR TABELA EVENTS
-- ========================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'meeting',
    status VARCHAR(50) DEFAULT 'scheduled',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_all_day BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verificar se foi criada
SELECT table_name FROM information_schema.tables WHERE table_name = 'events';

-- ========================================
-- PASSO 3: CRIAR TABELA NOTIFICATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    category VARCHAR(50) DEFAULT 'general',
    related_id UUID,
    related_type VARCHAR(50),
    action_url TEXT,
    read_status BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar se foi criada
SELECT table_name FROM information_schema.tables WHERE table_name = 'notifications';

-- ========================================
-- PASSO 4: CRIAR ÍNDICES BÁSICOS
-- ========================================
CREATE INDEX IF NOT EXISTS idx_agencies_created_by ON agencies(created_by);
CREATE INDEX IF NOT EXISTS idx_events_agency_id ON events(agency_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read_status);

-- ========================================
-- VERIFICAÇÃO FINAL DO PASSO 1-4
-- ========================================
SELECT 'Passo 1-4 concluído com sucesso!' as status;

SELECT 
    table_name, 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('agencies', 'events', 'notifications') 
AND column_name IN ('created_by', 'user_id', 'date', 'read_status')
ORDER BY table_name, column_name;