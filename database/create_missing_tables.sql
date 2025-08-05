-- ✅ CRIAR TABELAS FALTANTES E CORRIGIR SCHEMAS
-- Execute este script completo no SQL Editor

-- ========================================
-- PASSO 1: ADICIONAR COLUNA created_by EM agencies
-- ========================================
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ========================================
-- PASSO 2: CRIAR TABELA user_agency_permissions (FALTANTE!)
-- ========================================
CREATE TABLE IF NOT EXISTS user_agency_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint única para user + agency
    UNIQUE(user_id, agency_id)
);

-- ========================================
-- PASSO 3: ADICIONAR COLUNAS FALTANTES EM events (se necessário)
-- ========================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ========================================
-- PASSO 4: ADICIONAR COLUNAS FALTANTES EM notifications (se necessário)
-- ========================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_status BOOLEAN DEFAULT false;

-- ========================================
-- PASSO 5: CRIAR ÍNDICES IMPORTANTES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_agencies_created_by ON agencies(created_by);
CREATE INDEX IF NOT EXISTS idx_user_agency_permissions_user_id ON user_agency_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agency_permissions_agency_id ON user_agency_permissions(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_agency_permissions_role ON user_agency_permissions(role);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_agency_id ON events(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ========================================
-- PASSO 6: HABILITAR RLS NAS NOVAS TABELAS
-- ========================================
ALTER TABLE user_agency_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASSO 7: CRIAR TRIGGER PARA updated_at
-- ========================================
CREATE TRIGGER update_user_agency_permissions_updated_at 
    BEFORE UPDATE ON user_agency_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PASSO 8: GARANTIR PERMISSÕES ADMIN PARA FRANCO
-- ========================================
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

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
SELECT 'Tabelas criadas e configuradas com sucesso!' as status;

-- Verificar estrutura das tabelas principais
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('agencies', 'events', 'notifications', 'user_agency_permissions')
AND t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;

-- Verificar se Franco tem permissões
SELECT 
    u.email,
    uap.role,
    uap.permissions
FROM auth.users u
JOIN user_agency_permissions uap ON u.id = uap.user_id
WHERE u.email = 'franco@fvstudios.com.br';