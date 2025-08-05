-- 👑 PERMISSÕES ADMIN - PASSO FINAL
-- Execute por último para garantir permissões do Franco

-- ========================================
-- GARANTIR PERMISSÕES ADMIN PARA FRANCO
-- ========================================

-- Primeiro, verificar se Franco existe
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'franco@fvstudios.com.br';

-- Inserir ou atualizar permissões admin
INSERT INTO user_agency_permissions (user_id, role, permissions, granted_by, created_at, updated_at)
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
    u.id,
    NOW(),
    NOW()
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

-- ========================================
-- VERIFICAÇÃO FINAL COMPLETA
-- ========================================

SELECT 'Sistema completamente configurado!' as status;

-- Verificar usuários restantes
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email = 'franco@fvstudios.com.br' THEN 1 END) as admin_users
FROM auth.users;

-- Verificar permissões do Franco
SELECT 
    u.email,
    uap.role,
    uap.permissions
FROM auth.users u
LEFT JOIN user_agency_permissions uap ON u.id = uap.user_id
WHERE u.email = 'franco@fvstudios.com.br';

-- Verificar tabelas criadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_name IN ('agencies', 'events', 'notifications', 'user_agency_permissions')
ORDER BY table_name;

-- Verificar se colunas necessárias existem
SELECT 
    table_name, 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('agencies', 'events', 'notifications') 
AND column_name IN ('created_by', 'user_id', 'date', 'read_status')
ORDER BY table_name, column_name;