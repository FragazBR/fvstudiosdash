-- ==================================================
-- ADICIONAR COLUNAS FINANCEIRAS À TABELA CLIENTS
-- Execute este primeiro antes dos perfis de usuários
-- ==================================================

-- 1. Adicionar coluna contract_value à tabela clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contract_value DECIMAL(10,2) DEFAULT 0.00;

-- 2. Adicionar outras colunas financeiras importantes
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contract_duration INTEGER; -- duração em meses

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contract_start_date DATE;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) DEFAULT 'monthly';

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contract_currency VARCHAR(3) DEFAULT 'BRL';

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN clients.contract_value IS 'Valor do contrato em decimal (ex: 5000.00)';
COMMENT ON COLUMN clients.contract_duration IS 'Duração do contrato em meses';
COMMENT ON COLUMN clients.contract_start_date IS 'Data de início do contrato';
COMMENT ON COLUMN clients.payment_frequency IS 'Frequência de pagamento: monthly, quarterly, yearly';
COMMENT ON COLUMN clients.contract_currency IS 'Moeda do contrato: BRL, USD, EUR';

-- 4. Verificar se as colunas foram criadas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('contract_value', 'contract_duration', 'contract_start_date', 'payment_frequency', 'contract_currency')
ORDER BY column_name;