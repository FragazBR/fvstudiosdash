-- 👑 RESTAURAR PERMISSÕES ADMIN PARA FRANCO
-- Execute este script no SQL Editor do Supabase

-- Verificar se Franco existe
SELECT 'VERIFICANDO FRANCO:' as status;
SELECT id, email, created_at FROM auth.users WHERE email = 'franco@fvstudios.com.br';

-- Garantir permissões admin para Franco
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

-- Verificar resultado
SELECT 'PERMISSÕES RESTAURADAS:' as status;
SELECT 
    u.email,
    uap.role,
    uap.permissions,
    uap.created_at
FROM auth.users u
JOIN user_agency_permissions uap ON u.id = uap.user_id
WHERE u.email = 'franco@fvstudios.com.br';

SELECT '✅ Permissões admin restauradas com sucesso!' as resultado;