-- 💣 LIMPEZA NUCLEAR - DELETAR TUDO E RECOMEÇAR
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
-- LIMPEZA NUCLEAR - ORDEM MAIS PROFUNDA
-- ========================================

-- 1. TASKS PRIMEIRO (pode referenciar projects, users, etc.)
TRUNCATE tasks CASCADE;

-- 2. PROJECTS (pode referenciar contacts, agencies, users)
TRUNCATE projects CASCADE;

-- 3. CONTACTS (pode referenciar agencies, users) 
TRUNCATE contacts CASCADE;

-- 4. MESSAGES E CONVERSAS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    TRUNCATE messages CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    TRUNCATE conversations CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_participants') THEN
    TRUNCATE conversation_participants CASCADE;
  END IF;
END $$;

-- 5. LIMPAR OUTRAS TABELAS DE DADOS
DO $$
BEGIN
  -- Tabelas de atividade e logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    TRUNCATE activity_logs CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_usage_logs') THEN
    TRUNCATE ai_usage_logs CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
    TRUNCATE usage_tracking CASCADE;
  END IF;
  
  -- Tabelas de projetos e colaboração
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_members') THEN
    TRUNCATE project_members CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_collaborators') THEN
    TRUNCATE project_collaborators CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_assignments') THEN
    TRUNCATE task_assignments CASCADE;
  END IF;
  
  -- Tabelas de leads e onboarding
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_leads') THEN
    TRUNCATE agency_leads CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_leads') THEN
    TRUNCATE website_leads CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_onboarding') THEN
    TRUNCATE agency_onboarding CASCADE;
  END IF;
  
  -- Tabelas de membros e convites
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agency_members') THEN
    TRUNCATE agency_members CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_invitations') THEN
    TRUNCATE user_invitations CASCADE;
  END IF;
  
  -- Tabelas de relatórios
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
    TRUNCATE reports CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_executions') THEN
    TRUNCATE report_executions CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_files') THEN
    TRUNCATE report_files CASCADE;
  END IF;
  
  -- Tabelas auxiliares
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_user_creation_queue') THEN
    TRUNCATE admin_user_creation_queue CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plan_change_history') THEN
    TRUNCATE plan_change_history CASCADE;
  END IF;
END $$;

-- 6. AGORA LIMPAR user_profiles (deve estar livre de dependências)
DELETE FROM user_profiles 
WHERE id NOT IN (SELECT admin_id FROM admin_info);

-- 7. LIMPAR agencies
DELETE FROM agencies 
WHERE created_by NOT IN (SELECT admin_id FROM admin_info)
OR created_by IS NULL;

-- 8. LIMPAR user_agency_permissions EXCETO ADMIN
DELETE FROM user_agency_permissions 
WHERE user_id NOT IN (SELECT admin_id FROM admin_info);

-- 9. GARANTIR PERMISSÕES ADMIN
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

-- ========================================
-- RESULTADO FINAL
-- ========================================
SELECT '💥 LIMPEZA NUCLEAR CONCLUÍDA!' as resultado;

-- Contar tudo que sobrou
SELECT 
    'RESULTADO FINAL:' as status,
    (SELECT COUNT(*) FROM auth.users) as usuarios,
    (SELECT COUNT(*) FROM user_profiles) as profiles,
    (SELECT COUNT(*) FROM agencies) as agencias,
    (SELECT COUNT(*) FROM contacts) as contatos,
    (SELECT COUNT(*) FROM projects) as projetos,
    (SELECT COUNT(*) FROM tasks) as tarefas,
    (SELECT COUNT(*) FROM user_agency_permissions) as permissoes;

-- Verificar admin final
SELECT 
    u.email,
    up.id as profile_id,
    uap.role,
    uap.permissions
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN user_agency_permissions uap ON u.id = uap.user_id
WHERE u.email = 'franco@fvstudios.com.br';

SELECT '🎉 SISTEMA COMPLETAMENTE LIMPO E PRONTO!' as final_status;

DROP TABLE admin_info;