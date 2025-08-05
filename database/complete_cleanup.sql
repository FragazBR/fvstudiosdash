-- 🧹 LIMPEZA COMPLETA DO SISTEMA - REMOVER DADOS RESIDUAIS
-- Execute este script no SQL Editor do Supabase

-- ========================================
-- VERIFICAR DADOS ATUAIS
-- ========================================
SELECT 'ANTES DA LIMPEZA' as status;

-- Contar usuários restantes
SELECT COUNT(*) as total_users FROM auth.users;
SELECT email FROM auth.users ORDER BY created_at;

-- Contar dados residuais
SELECT COUNT(*) as total_user_profiles FROM user_profiles;
SELECT COUNT(*) as total_agencies FROM agencies;
SELECT COUNT(*) as total_user_subscriptions FROM user_subscriptions;
SELECT COUNT(*) as total_user_invitations FROM user_invitations;

-- ========================================
-- OBTER ID DO ADMIN PRINCIPAL
-- ========================================
CREATE TEMP TABLE admin_info AS
SELECT id as admin_id, email 
FROM auth.users 
WHERE email = 'franco@fvstudios.com.br';

-- Verificar se encontrou o admin
SELECT * FROM admin_info;

-- ========================================
-- LIMPEZA COMPLETA DE TODAS AS TABELAS
-- ========================================

-- 1. LIMPAR user_profiles (exceto admin)
DELETE FROM user_profiles 
WHERE user_id NOT IN (SELECT admin_id FROM admin_info);

-- 2. LIMPAR agencies (exceto as criadas pelo admin, se houver)
DELETE FROM agencies 
WHERE id NOT IN (
  SELECT DISTINCT agency_id 
  FROM user_agency_permissions uap
  JOIN admin_info ai ON uap.user_id = ai.admin_id
  WHERE agency_id IS NOT NULL
);

-- 3. LIMPAR user_subscriptions (exceto admin)
DELETE FROM user_subscriptions 
WHERE user_id NOT IN (SELECT admin_id FROM admin_info);

-- 4. LIMPAR user_invitations (exceto as feitas pelo admin)
DELETE FROM user_invitations 
WHERE invited_by NOT IN (SELECT admin_id FROM admin_info);

-- 5. LIMPAR user_agency_permissions (exceto admin)
-- CUIDADO: Primeiro vamos preservar as permissões do admin se existirem
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

-- Agora limpar outras permissões (manter apenas do admin)
DELETE FROM user_agency_permissions 
WHERE user_id NOT IN (SELECT admin_id FROM admin_info);

-- 6. LIMPAR TABELAS AUXILIARES
DELETE FROM admin_user_creation_queue;
DELETE FROM plan_change_history;
DELETE FROM activity_logs WHERE user_id NOT IN (SELECT admin_id FROM admin_info);
DELETE FROM ai_usage_logs WHERE user_id NOT IN (SELECT admin_id FROM admin_info);
DELETE FROM usage_tracking WHERE user_id NOT IN (SELECT admin_id FROM admin_info);

-- 7. LIMPAR DADOS DE PROJETOS E TASKS
DELETE FROM tasks;
DELETE FROM projects;
DELETE FROM contacts;
DELETE FROM messages;
DELETE FROM conversations;

-- 8. LIMPAR LOGS ANTIGOS (manter últimos 7 dias)
DELETE FROM admin_action_logs 
WHERE created_at < NOW() - INTERVAL '7 days'
AND admin_user_id NOT IN (SELECT admin_id FROM admin_info);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
SELECT 'APÓS LIMPEZA COMPLETA' as status;

-- Verificar usuários finais
SELECT COUNT(*) as total_users_final FROM auth.users;
SELECT email, created_at FROM auth.users ORDER BY created_at;

-- Verificar dados residuais finais
SELECT COUNT(*) as final_user_profiles FROM user_profiles;
SELECT COUNT(*) as final_agencies FROM agencies;
SELECT COUNT(*) as final_user_subscriptions FROM user_subscriptions;
SELECT COUNT(*) as final_user_invitations FROM user_invitations;
SELECT COUNT(*) as final_user_permissions FROM user_agency_permissions;

-- Verificar permissões do admin
SELECT 
    u.email,
    uap.role,
    uap.permissions,
    uap.created_at
FROM auth.users u
JOIN user_agency_permissions uap ON u.id = uap.user_id
WHERE u.email = 'franco@fvstudios.com.br';

-- Estatísticas finais
SELECT 
    'LIMPEZA COMPLETA REALIZADA!' as resultado,
    (SELECT COUNT(*) FROM auth.users) as usuarios_restantes,
    (SELECT COUNT(*) FROM user_profiles) as profiles_restantes,
    (SELECT COUNT(*) FROM agencies) as agencias_restantes,
    (SELECT COUNT(*) FROM user_agency_permissions) as permissoes_restantes;

-- Remover tabela temporária
DROP TABLE admin_info;