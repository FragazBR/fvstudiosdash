-- ===============================================================
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD PARA FINALIZAR
-- ===============================================================

-- 1. CRIAR TABELA CLIENTS COM CAMPOS FINANCEIROS
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    client_type VARCHAR(50) DEFAULT 'agency_client',
    -- Campos financeiros
    contract_value DECIMAL(10,2) DEFAULT NULL,
    contract_duration INTEGER DEFAULT NULL, -- em meses
    contract_start_date DATE DEFAULT NULL,
    contract_end_date DATE DEFAULT NULL,
    payment_frequency VARCHAR(20) DEFAULT 'monthly',
    contract_currency VARCHAR(3) DEFAULT 'BRL',
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TRIGGER PARA CALCULAR DATA DE FIM AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_contract_end_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_start_date IS NOT NULL AND NEW.contract_duration IS NOT NULL THEN
        NEW.contract_end_date := NEW.contract_start_date + (NEW.contract_duration || ' months')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se já existe e criar novamente
DROP TRIGGER IF EXISTS trigger_update_contract_end_date ON clients;
CREATE TRIGGER trigger_update_contract_end_date
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_end_date();

-- 3. ADICIONAR client_id À TABELA user_invitations (se ainda não existe)
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_contract_value ON clients(contract_value);
CREATE INDEX IF NOT EXISTS idx_user_invitations_client_id ON user_invitations(client_id);

-- 5. RLS POLICIES
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage clients from their agency" ON clients
    USING (agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

SELECT 'Sistema de gestão financeira de clientes configurado! ✅' as resultado;