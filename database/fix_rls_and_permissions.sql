-- 🔐 RLS E PERMISSÕES - PASSO 5
-- Execute DEPOIS do passo 1-4 estar funcionando

-- ========================================
-- PASSO 5: HABILITAR RLS
-- ========================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASSO 6: POLÍTICAS RLS PARA EVENTS
-- ========================================

-- Política de SELECT para events
CREATE POLICY "Users can view agency events" ON events FOR SELECT USING (
    agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
    )
    OR
    user_id = auth.uid()
);

-- Política de INSERT para events
CREATE POLICY "Users can create events for their agencies" ON events FOR INSERT WITH CHECK (
    agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
    )
    OR
    user_id = auth.uid()
);

-- Política de UPDATE para events
CREATE POLICY "Users can update events for their agencies" ON events FOR UPDATE USING (
    agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
    )
    OR
    user_id = auth.uid()
);

-- Política de DELETE para events
CREATE POLICY "Users can delete events for their agencies" ON events FOR DELETE USING (
    agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
    )
    OR
    user_id = auth.uid()
);

-- ========================================
-- PASSO 7: POLÍTICAS RLS PARA NOTIFICATIONS
-- ========================================

-- Política de SELECT para notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
    user_id = auth.uid()
);

-- Política de INSERT para notifications (sistema)
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Política de UPDATE para notifications
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
    user_id = auth.uid()
);

-- Política de SELECT para admins
CREATE POLICY "Admins can view all notifications" ON notifications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_agency_permissions uap 
        WHERE uap.user_id = auth.uid() 
        AND uap.role = 'admin'
        AND uap.permissions->>'super_admin' = 'true'
    )
);

-- ========================================
-- PASSO 8: TRIGGERS updated_at
-- ========================================

-- Trigger para events
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para notifications
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
SELECT 'RLS e permissões configuradas com sucesso!' as status;

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('events', 'notifications')
ORDER BY tablename, policyname;