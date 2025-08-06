-- ===============================================================
-- ADICIONAR CAMPOS FINANCEIROS À TABELA CLIENTS
-- ===============================================================

-- Adicionar campos financeiros na tabela clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS contract_value DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contract_duration INTEGER DEFAULT NULL, -- em meses
ADD COLUMN IF NOT EXISTS contract_start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contract_end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly, one-time
ADD COLUMN IF NOT EXISTS contract_currency VARCHAR(3) DEFAULT 'BRL';

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN clients.contract_value IS 'Valor total do contrato em decimal';
COMMENT ON COLUMN clients.contract_duration IS 'Duração do contrato em meses';
COMMENT ON COLUMN clients.contract_start_date IS 'Data de início do contrato';
COMMENT ON COLUMN clients.contract_end_date IS 'Data de fim do contrato (calculada automaticamente)';
COMMENT ON COLUMN clients.payment_frequency IS 'Frequência de pagamento: monthly, quarterly, yearly, one-time';
COMMENT ON COLUMN clients.contract_currency IS 'Moeda do contrato (ISO 4217)';

-- Criar função para calcular data de fim automaticamente
CREATE OR REPLACE FUNCTION update_contract_end_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Se temos data de início e duração, calcular data de fim
    IF NEW.contract_start_date IS NOT NULL AND NEW.contract_duration IS NOT NULL THEN
        NEW.contract_end_date := NEW.contract_start_date + (NEW.contract_duration || ' months')::INTERVAL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para calcular data de fim automaticamente
DROP TRIGGER IF EXISTS trigger_update_contract_end_date ON clients;
CREATE TRIGGER trigger_update_contract_end_date
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_end_date();

-- Adicionar índices para performance em consultas financeiras
CREATE INDEX IF NOT EXISTS idx_clients_contract_value ON clients(contract_value);
CREATE INDEX IF NOT EXISTS idx_clients_contract_dates ON clients(contract_start_date, contract_end_date);
CREATE INDEX IF NOT EXISTS idx_clients_agency_contract ON clients(agency_id, contract_value);

SELECT 'Campos financeiros adicionados à tabela clients! ✅' as resultado;