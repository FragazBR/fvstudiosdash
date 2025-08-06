-- CORRIGIR CLIENTES COM AGENCY_ID NULL
-- Execute no Supabase SQL Editor

-- 1. Verificar qual cliente está com agency_id null
SELECT name, email, agency_id, status 
FROM clients 
WHERE agency_id IS NULL;

-- 2. Atualizar clientes com agency_id null para usar a agência padrão
UPDATE clients 
SET agency_id = '29aa9c02-fcce-4f77-8118-bde93a83487b'
WHERE agency_id IS NULL;

-- 3. Verificar se foi corrigido
SELECT name, email, agency_id, status 
FROM clients 
WHERE agency_id IS NULL;

-- 4. Mostrar todos os clientes agora
SELECT 
  name, 
  email, 
  agency_id, 
  status,
  created_at
FROM clients 
ORDER BY created_at DESC;