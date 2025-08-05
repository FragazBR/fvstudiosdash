-- 🧹 LIMPEZA SEGURA E COMPLETA - APENAS TABELAS EXISTENTES
-- Execute este script no SQL Editor do Supabase

-- ========================================
-- VERIFICAR TABELAS EXISTENTES PRIMEIRO
-- ========================================
SELECT 'TABELAS DISPONÍVEIS:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles', 'agencies', 'user_subscriptions', 'user_invitations',
  'user_agency_permissions', 'admin_user_creation_queue', 'plan_change_history',
  'activity_logs', 'ai_usage_logs', 'usage_tracking', 'tasks', 'projects',
  'contacts', 'messages', 'conversations', 'admin_action_logs'
)
ORDER BY table_name;

-- ========================================
-- VERIFICAR DADOS ATUAIS
-- ========================================
SELECT 'ANTES DA LIMPEZA' as status;

-- Contar usuários restantes
SELECT COUNT(*) as total_users FROM auth.users;
SELECT email FROM auth.users ORDER BY created_at;

-- Contar dados residuais (apenas tabelas que existem)
SELECT COUNT(*) as total_user_profiles FROM user_profiles;
SELECT COUNT(*) as total_agencies FROM agencies;

-- Verificar se user_invitations existe antes de contar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_invitations') THEN
    PERFORM 1; -- tabela existe
  END IF;
END $$;

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
-- LIMPEZA SEGURA - APENAS TABELAS EXISTENTES
-- ========================================

-- 1. LIMPAR user_profiles (exceto admin)
DELETE FROM user_profiles 
WHERE user_id NOT IN (SELECT admin_id FROM admin_info);

-- 2. LIMPAR agencies (exceto as criadas pelo admin, se houver)
DELETE FROM agencies 
WHERE created_by NOT IN (SELECT admin_id FROM admin_info)
OR created_by IS NULL;

-- 3. LIMPAR user_invitations (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_invitations') THEN
    DELETE FROM user_invitations 
    WHERE invited_by NOT IN (SELECT admin_id FROM admin_info);
  END IF;
END $$;

-- 4. LIMPAR user_agency_permissions e GARANTIR ADMIN
-- Primeiro, garantir permissões admin
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

-- Limpar outras permissões (manter apenas admin)
DELETE FROM user_agency_permissions 
WHERE user_id NOT IN (SELECT admin_id FROM admin_info);

-- 5. LIMPAR TABELAS AUXILIARES (se existirem)
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
  
  -- activity_logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    DELETE FROM activity_logs WHERE user_id NOT IN (SELECT admin_id FROM admin_info);
  END IF;
  
  -- ai_usage_logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_usage_logs') THEN
    DELETE FROM ai_usage_logs WHERE user_id NOT IN (SELECT admin_id FROM admin_info);
  END IF;
  
  -- usage_tracking
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
    DELETE FROM usage_tracking WHERE user_id NOT IN (SELECT admin_id FROM admin_info);
  END IF;
END $$;

-- 6. LIMPAR DADOS DE PROJETOS (se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    DELETE FROM tasks;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    DELETE FROM projects;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    DELETE FROM contacts;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    DELETE FROM messages;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    DELETE FROM conversations;
  END IF;
END $$;

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
    '✅ LIMPEZA COMPLETA REALIZADA!' as resultado,
    (SELECT COUNT(*) FROM auth.users) as usuarios_restantes,
    (SELECT COUNT(*) FROM user_profiles) as profiles_restantes,
    (SELECT COUNT(*) FROM agencies) as agencias_restantes,
    (SELECT COUNT(*) FROM user_agency_permissions) as permissoes_restantes;

-- Remover tabela temporária
DROP TABLE admin_info;