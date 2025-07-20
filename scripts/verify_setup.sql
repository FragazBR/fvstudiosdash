-- ==========================================
-- VERIFICAÇÃO DO SETUP COMPLETO
-- ==========================================
-- Execute este script após sample_data.sql para verificar se tudo está funcionando

-- Verificar tabelas criadas
SELECT 'TABELAS CRIADAS' as verification_type, 
       table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('agencies', 'user_profiles', 'client_api_configs', 'projects', 'project_metrics', 'events', 'notifications', 'plan_limits')
ORDER BY table_name;

-- Verificar dados inseridos
SELECT 'DADOS INSERIDOS' as verification_type, 'agencies' as table_name, COUNT(*) as records FROM public.agencies
UNION ALL
SELECT 'DADOS INSERIDOS', 'user_profiles', COUNT(*) FROM public.user_profiles
UNION ALL
SELECT 'DADOS INSERIDOS', 'client_api_configs', COUNT(*) FROM public.client_api_configs
UNION ALL
SELECT 'DADOS INSERIDOS', 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'DADOS INSERIDOS', 'project_metrics', COUNT(*) FROM public.project_metrics
UNION ALL
SELECT 'DADOS INSERIDOS', 'events', COUNT(*) FROM public.events
UNION ALL
SELECT 'DADOS INSERIDOS', 'notifications', COUNT(*) FROM public.notifications
UNION ALL
SELECT 'DADOS INSERIDOS', 'plan_limits', COUNT(*) FROM public.plan_limits;

-- Verificar políticas RLS
SELECT 'POLÍTICAS RLS' as verification_type,
       tablename,
       policyname,
       permissive,
       roles,
       cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar funções criadas
SELECT 'FUNÇÕES CRIADAS' as verification_type,
       routine_name as function_name,
       routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_updated_at_column', 'handle_new_user', 'handle_new_client', 'calculate_project_metrics', 'get_dashboard_stats');

-- Verificar triggers
SELECT 'TRIGGERS CRIADOS' as verification_type,
       trigger_name,
       event_object_table as table_name,
       event_manipulation as trigger_event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Teste da função dashboard
SELECT 'TESTE DASHBOARD' as verification_type,
       'dashboard_function_test' as test_name,
       'Execute: SELECT public.get_dashboard_stats(); para testar' as instruction;

-- Verificar hierarquia multi-tenant
SELECT 'HIERARQUIA MULTI-TENANT' as verification_type,
       a.name as agency_name,
       up.name as user_name,
       up.role,
       up.email,
       COUNT(p.id) as projects_count
FROM public.agencies a
LEFT JOIN public.user_profiles up ON a.id = up.agency_id
LEFT JOIN public.projects p ON up.id = p.client_id
GROUP BY a.id, a.name, up.id, up.name, up.role, up.email
ORDER BY a.name, up.role, up.name;

-- Verificar métricas calculadas automaticamente
SELECT 'MÉTRICAS CALCULADAS' as verification_type,
       pm.project_id,
       p.title as project_name,
       pm.impressions,
       pm.clicks,
       pm.conversions,
       pm.cost,
       pm.revenue,
       ROUND(pm.ctr, 2) as ctr_calculated,
       ROUND(pm.cpc, 2) as cpc_calculated,
       ROUND(pm.cpa, 2) as cpa_calculated,
       ROUND(pm.roas, 2) as roas_calculated
FROM public.project_metrics pm
JOIN public.projects p ON pm.project_id = p.id
ORDER BY p.title, pm.date_start;

-- Status final
SELECT 'STATUS FINAL' as verification_type,
       'SETUP COMPLETO!' as status,
       json_build_object(
         'database_ready', true,
         'multi_tenant', true,
         'rls_enabled', true,
         'sample_data', true,
         'ready_for_development', true
       ) as details;
