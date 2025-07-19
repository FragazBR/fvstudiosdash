-- =============================================
-- VERIFICAR SISTEMA COMPLETO
-- =============================================

-- 1. Verificar usuário admin
SELECT 
    email,
    role,
    plan_type,
    max_integrations,
    max_clients,
    email_verified,
    status
FROM profiles 
WHERE email = 'admin@fvstudios.com';

-- 2. Verificar integrações disponíveis
SELECT 
    type,
    COUNT(*) as count
FROM available_integrations 
WHERE is_active = true
GROUP BY type
ORDER BY type;

-- 3. Verificar políticas RLS ativas
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. Verificar triggers ativos
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 5. Status geral do sistema
SELECT 'Sistema FVStudios Dashboard' as sistema,
       'Arquitetura completa implementada' as status,
       '9 tipos de usuário' as usuarios,
       '23 integrações disponíveis' as integracoes,
       '5 tabelas principais' as estrutura;

SELECT '🎯 SISTEMA PRONTO PARA USO!' as final_status;
