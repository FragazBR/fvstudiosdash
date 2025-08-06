-- DIAGNOSTICAR POR QUE JOÃO TESTE NÃO APARECE
-- Execute no Supabase SQL Editor

-- 1. Verificar todos os clientes na tabela
SELECT 
  id,
  name, 
  email, 
  status, 
  agency_id,
  created_at
FROM clients 
ORDER BY created_at DESC;

-- 2. Verificar se João Teste tem o mesmo agency_id que Ricardo
SELECT 
  name,
  email,
  agency_id,
  status
FROM clients 
WHERE email IN ('ricardo@restaurantedrummond.com.br', 'joao.teste@exemplo.com');

-- 3. Verificar agency_id do usuário atendimento (para comparar)
SELECT 
  email,
  agency_id 
FROM user_profiles 
WHERE email = 'atendimento@fvstudios.com.br';

-- 4. Contar total de clientes por agency
SELECT 
  agency_id,
  COUNT(*) as total_clientes
FROM clients 
GROUP BY agency_id;