-- 🧹 LIMPEZA MÍNIMA E SEGURA
-- Execute este script no SQL Editor do Supabase

-- ========================================
-- VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
-- ========================================
SELECT 'ESTRUTURA DA TABELA user_profiles:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

SELECT 'ESTRUTURA DA TABELA agencies:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agencies' 
ORDER BY ordinal_position;

-- ========================================
-- VERIFICAR DADOS ATUAIS
-- ========================================
SELECT 'DADOS ATUAIS:' as status;

-- Usuários
SELECT COUNT(*) as total_users FROM auth.users;
SELECT email FROM auth.users ORDER BY created_at;

-- User profiles
SELECT COUNT(*) as total_user_profiles FROM user_profiles;
SELECT * FROM user_profiles LIMIT 5;

-- Agencies
SELECT COUNT(*) as total_agencies FROM agencies;
SELECT id, name, created_at FROM agencies LIMIT 5;

-- ========================================
-- OBTER ID DO ADMIN
-- ========================================
CREATE TEMP TABLE admin_info AS
SELECT id as admin_id, email 
FROM auth.users 
WHERE email = 'franco@fvstudios.com.br';

SELECT 'ADMIN ENCONTRADO:' as info;
SELECT * FROM admin_info;

-- ========================================
-- LIMPEZA BASEADA NA ESTRUTURA REAL
-- ========================================

-- Limpar user_profiles baseado na estrutura real
-- Vamos verificar qual coluna conecta com auth.users
DO $$
DECLARE
    col_name text;
BEGIN
    -- Verificar se existe coluna user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_id') THEN
        DELETE FROM user_profiles WHERE user_id NOT IN (SELECT admin_id FROM admin_info);
        RAISE NOTICE 'Limpeza user_profiles por user_id';
    -- Verificar se existe coluna id
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'id') THEN
        DELETE FROM user_profiles WHERE id NOT IN (SELECT admin_id FROM admin_info);
        RAISE NOTICE 'Limpeza user_profiles por id';
    ELSE
        RAISE NOTICE 'Estrutura user_profiles não reconhecida';
    END IF;
END $$;

-- Limpar agencies - manter apenas as criadas pelo admin
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'created_by') THEN
        DELETE FROM agencies WHERE created_by NOT IN (SELECT admin_id FROM admin_info) OR created_by IS NULL;
        RAISE NOTICE 'Limpeza agencies por created_by';
    ELSE
        -- Se não tem created_by, limpar todas exceto uma possível do admin
        DELETE FROM agencies WHERE id NOT IN (
            SELECT DISTINCT agency_id 
            FROM user_agency_permissions uap
            JOIN admin_info ai ON uap.user_id = ai.admin_id
            WHERE agency_id IS NOT NULL
        );
        RAISE NOTICE 'Limpeza agencies por user_agency_permissions';
    END IF;
END $$;

-- Garantir permissões admin
INSERT INTO user_agency_permissions (user_id, role, permissions, granted_by)
SELECT 
    ai.admin_id,
    'admin',
    json_build_object(
        'manage_users', 'true',
        'manage_agencies', 'true', 
        'manage_payments', 'true',
        'view_analytics', 'true',
        'manage_settings', 'true',
        'super_admin', 'true'
    ),
    ai.admin_id
FROM admin_info ai
WHERE NOT EXISTS (
    SELECT 1 FROM user_agency_permissions uap 
    WHERE uap.user_id = ai.admin_id AND uap.role = 'admin'
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

-- Limpar outras permissões
DELETE FROM user_agency_permissions 
WHERE user_id NOT IN (SELECT admin_id FROM admin_info);

-- ========================================
-- RESULTADO FINAL
-- ========================================
SELECT '✅ LIMPEZA CONCLUÍDA!' as resultado;

SELECT COUNT(*) as usuarios_finais FROM auth.users;
SELECT COUNT(*) as profiles_finais FROM user_profiles;
SELECT COUNT(*) as agencies_finais FROM agencies;
SELECT COUNT(*) as permissions_finais FROM user_agency_permissions;

-- Verificar admin
SELECT 
    u.email,
    uap.role,
    uap.permissions
FROM auth.users u
LEFT JOIN user_agency_permissions uap ON u.id = uap.user_id
WHERE u.email = 'franco@fvstudios.com.br';

DROP TABLE admin_info;