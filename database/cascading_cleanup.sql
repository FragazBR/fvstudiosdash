-- 🧹 LIMPEZA COM RESPEITO ÀS FOREIGN KEYS
-- Execute este script no SQL Editor do Supabase

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
-- VERIFICAR DADOS ANTES DA LIMPEZA
-- ========================================
SELECT 'ANTES DA LIMPEZA:' as status;
SELECT COUNT(*) as users FROM auth.users;
SELECT COUNT(*) as profiles FROM user_profiles;
SELECT COUNT(*) as agencies FROM agencies;
SELECT COUNT(*) as contacts FROM contacts;
SELECT COUNT(*) as permissions FROM user_agency_permissions;

-- ========================================
-- LIMPEZA EM ORDEM CORRETA (FILHOS PRIMEIRO)
-- ========================================

-- 1. LIMPAR TABELAS QUE REFERENCIAM user_profiles PRIMEIRO
-- contacts que referenciam user_profiles via created_by
DELETE FROM contacts 
WHERE created_by NOT IN (SELECT admin_id FROM admin_info)
AND created_by IS NOT NULL;

-- tasks que podem referenciar user_profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    DELETE FROM tasks 
    WHERE assigned_to NOT IN (SELECT admin_id FROM admin_info)
    AND assigned_to IS NOT NULL;
    
    DELETE FROM tasks 
    WHERE created_by NOT IN (SELECT admin_id FROM admin_info)
    AND created_by IS NOT NULL;
  END IF;
END $$;

-- projects que podem referenciar user_profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    DELETE FROM projects 
    WHERE created_by NOT IN (SELECT admin_id FROM admin_info)
    AND created_by IS NOT NULL;
  END IF;
END $$;

-- messages que podem referenciar user_profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    DELETE FROM messages 
    WHERE sender_id NOT IN (SELECT admin_id FROM admin_info)
    AND sender_id IS NOT NULL;
  END IF;
END $$;

-- 2. LIMPAR OUTRAS TABELAS DEPENDENTES
-- user_invitations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_invitations') THEN
    DELETE FROM user_invitations 
    WHERE invited_by NOT IN (SELECT admin_id FROM admin_info);
  END IF;
END $$;

-- activity_logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    DELETE FROM activity_logs 
    WHERE user_id NOT IN (SELECT admin_id FROM admin_info);
  END IF;
END $$;

-- 3. AGORA LIMPAR user_profiles (após limpar dependências)
DELETE FROM user_profiles 
WHERE id NOT IN (SELECT admin_id FROM admin_info);

-- 4. LIMPAR agencies (após limpar user_profiles)
DELETE FROM agencies 
WHERE created_by NOT IN (SELECT admin_id FROM admin_info)
OR created_by IS NULL;

-- 5. GARANTIR PERMISSÕES ADMIN
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

-- 6. LIMPAR TABELAS AUXILIARES
DO $$
BEGIN
  -- admin_user_creation_queue
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_user_creation_queue') THEN
    DELETE FROM admin_user_creation_queue;
  END IF;
  
  -- plan_change_history
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_change_history') THEN
    DELETE FROM plan_change_history;
  END IF;
  
  -- conversations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    DELETE FROM conversations;
  END IF;
END $$;

-- ========================================
-- RESULTADO FINAL
-- ========================================
SELECT '✅ LIMPEZA CASCATA CONCLUÍDA!' as resultado;

SELECT 'APÓS LIMPEZA:' as status;
SELECT COUNT(*) as users_final FROM auth.users;
SELECT COUNT(*) as profiles_final FROM user_profiles;
SELECT COUNT(*) as agencies_final FROM agencies;
SELECT COUNT(*) as contacts_final FROM contacts;
SELECT COUNT(*) as permissions_final FROM user_agency_permissions;

-- Verificar admin
SELECT 
    u.email,
    uap.role,
    uap.permissions
FROM auth.users u
LEFT JOIN user_agency_permissions uap ON u.id = uap.user_id
WHERE u.email = 'franco@fvstudios.com.br';

-- Estatísticas finais
SELECT 
    'SISTEMA COMPLETAMENTE LIMPO!' as status,
    (SELECT COUNT(*) FROM auth.users) as usuarios,
    (SELECT COUNT(*) FROM user_profiles) as profiles,
    (SELECT COUNT(*) FROM agencies) as agencias,
    (SELECT COUNT(*) FROM contacts) as contatos,
    (SELECT COUNT(*) FROM user_agency_permissions) as permissoes;

DROP TABLE admin_info;