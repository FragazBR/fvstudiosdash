-- MIGRAR USUÁRIOS agency_client DA TABELA user_profiles PARA clients
-- Execute no Supabase SQL Editor

-- 1. Verificar usuários agency_client que não estão na tabela clients
SELECT up.id, up.name, up.email, up.role, up.agency_id
FROM user_profiles up
LEFT JOIN clients c ON c.id = up.id
WHERE up.role = 'agency_client' 
AND c.id IS NULL;

-- 2. Inserir esses usuários na tabela clients (apenas campos que existem)
INSERT INTO clients (
  id, 
  agency_id, 
  created_by, 
  name, 
  email, 
  notes, 
  status, 
  created_at, 
  updated_at
)
SELECT 
  up.id,
  up.agency_id,
  up.id, -- created_by será o próprio usuário por enquanto
  up.name,
  up.email,
  'Migrado automaticamente do sistema de usuários' as notes,
  'active' as status,
  up.created_at,
  up.updated_at
FROM user_profiles up
LEFT JOIN clients c ON c.id = up.id
WHERE up.role = 'agency_client' 
AND c.id IS NULL;

-- 3. Verificar se a migração funcionou
SELECT 
  'user_profiles com role agency_client: ' || COUNT(*) as usuarios_agency_client
FROM user_profiles 
WHERE role = 'agency_client';

SELECT 
  'clients na tabela: ' || COUNT(*) as clientes_na_tabela
FROM clients;

-- 4. Mostrar todos os clientes migrados
SELECT 
  c.name, 
  c.email, 
  c.status,
  c.created_at,
  'Migrado' as origem
FROM clients c
WHERE c.notes LIKE '%Migrado automaticamente%'
ORDER BY c.created_at DESC;