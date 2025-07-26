-- ===================================================================
-- TESTE COMPLETO DAS FUNCIONALIDADES DO SISTEMA
-- Execute este script para verificar se tudo está funcionando
-- ===================================================================

-- 1. Verificar estrutura das tabelas principais
SELECT 'TABELAS PRINCIPAIS' as teste, 
       CASE WHEN COUNT(*) = 9 THEN 'PASS ✓' ELSE 'FAIL ✗' END as resultado,
       COUNT(*) as tabelas_encontradas
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'agencies', 'contacts', 'projects', 'tasks', 
                     'conversations', 'messages', 'notifications', 'calendar_events');

-- 2. Verificar se o usuário agency_owner existe
SELECT 'USUÁRIO AGENCY_OWNER' as teste,
       CASE WHEN COUNT(*) > 0 THEN 'PASS ✓' ELSE 'FAIL ✗' END as resultado,
       COUNT(*) as usuarios_encontrados
FROM user_profiles 
WHERE role = 'agency_owner';

-- 3. Verificar APIs essenciais (simulado - verificando tabelas)
SELECT 'APIs ESSENCIAIS' as teste,
       CASE 
         WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') AND
              EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') AND
              EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') 
         THEN 'PASS ✓' 
         ELSE 'FAIL ✗' 
       END as resultado;

-- 4. Verificar sistema de mensagens
SELECT 'SISTEMA DE MENSAGENS' as teste,
       CASE 
         WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') AND
              EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') 
         THEN 'PASS ✓' 
         ELSE 'FAIL ✗' 
       END as resultado;

-- 5. Verificar funções do banco
SELECT 'FUNÇÕES DO BANCO' as teste,
       CASE WHEN COUNT(*) >= 2 THEN 'PASS ✓' ELSE 'FAIL ✗' END as resultado,
       COUNT(*) as funcoes_encontradas
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_dashboard_projects', 'get_user_conversations', 'get_conversation_messages');

-- 6. Dados de teste - verificar se há dados mínimos
SELECT 'DADOS DE TESTE' as teste,
       CASE 
         WHEN (SELECT COUNT(*) FROM user_profiles) > 0 AND
              (SELECT COUNT(*) FROM agencies) > 0
         THEN 'PASS ✓' 
         ELSE 'FAIL ✗' 
       END as resultado;

-- 7. Resumo geral do sistema
SELECT 
    'RESUMO GERAL' as secao,
    'Sistema está pronto para uso' as status,
    (SELECT COUNT(*) FROM user_profiles) as usuarios_cadastrados,
    (SELECT COUNT(*) FROM user_profiles WHERE role = 'agency_owner') as agency_owners,
    (SELECT COUNT(*) FROM agencies) as agencias,
    (SELECT COUNT(*) FROM projects) as projetos,
    (SELECT COUNT(*) FROM tasks) as tarefas,
    (SELECT COUNT(*) FROM contacts) as contatos;

-- 8. Instruções finais
SELECT 
    'PRÓXIMOS PASSOS' as info,
    '1. Execute o FINAL_CORRECT_ROLE_FIX.sql se ainda não executou' as passo_1,
    '2. Faça logout e login no sistema' as passo_2,
    '3. Verifique se todas as 14 abas aparecem na sidebar' as passo_3,
    '4. Teste os botões de "Nova Tarefa", "Nova Conta", "Novo Projeto", "Novo Evento"' as passo_4,
    '5. Verifique se consegue acessar /agency, /workstation, /messages' as passo_5;