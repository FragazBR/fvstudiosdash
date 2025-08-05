-- 🔧 CORREÇÃO DE SCHEMAS E CRIAÇÃO DE TABELAS FALTANTES
-- Execute este script no SQL Editor do Supabase

-- 1. CORRIGIR TABELA AGENCIES - ADICIONAR COLUNA created_by
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. CRIAR TABELA EVENTS (para resolver erro 400)
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

-- 3. CRIAR TABELA NOTIFICATIONS (corrigir API de notificações)
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
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agencies_created_by ON agencies(created_by);
CREATE INDEX IF NOT EXISTS idx_events_agency_id ON events(agency_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 5. HABILITAR RLS NAS NOVAS TABELAS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA EVENTS
CREATE POLICY "Users can view agency events" ON events FOR SELECT USING (
    agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create events for their agencies" ON events FOR INSERT WITH CHECK (
    agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update events for their agencies" ON events FOR UPDATE USING (
    agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete events for their agencies" ON events FOR DELETE USING (
    agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
    )
);

-- 7. POLÍTICAS RLS PARA NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
    user_id = auth.uid()
);

CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
    user_id = auth.uid()
);

CREATE POLICY "Admins can view all notifications" ON notifications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'admin'
    )
);

-- 8. TRIGGERS PARA updated_at
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. GARANTIR PERMISSÕES ADMIN PARA FRANCO
INSERT INTO user_agency_permissions (user_id, role, permissions, granted_by)
SELECT 
    u.id,
    'admin',
    json_build_object(
        'manage_users', 'true',
        'manage_agencies', 'true', 
        'manage_payments', 'true',
        'view_analytics', 'true',
        'manage_settings', 'true',
        'super_admin', 'true'
    ),
    u.id
FROM auth.users u
WHERE u.email = 'franco@fvstudios.com.br'
AND NOT EXISTS (
    SELECT 1 FROM user_agency_permissions uap 
    WHERE uap.user_id = u.id AND uap.role = 'admin'
)
ON CONFLICT (user_id, agency_id) DO UPDATE SET
    role = 'admin',
    permissions = json_build_object(
        'manage_users', 'true',
        'manage_agencies', 'true',
        'manage_payments', 'true', 
        'view_analytics', 'true',
        'manage_settings', 'true',
        'super_admin', 'true'
    ),
    updated_at = NOW();

-- 10. VERIFICAÇÃO FINAL
SELECT 'Schemas corrigidos e tabelas criadas com sucesso!' as status;

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email = 'franco@fvstudios.com.br' THEN 1 END) as admin_users
FROM auth.users;

SELECT 
    table_name, 
    column_name 
FROM information_schema.columns 
WHERE table_name IN ('agencies', 'events', 'notifications') 
AND column_name IN ('created_by', 'date', 'user_id')
ORDER BY table_name, column_name;