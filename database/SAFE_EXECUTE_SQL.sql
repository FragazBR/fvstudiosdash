-- ===============================================================
-- SQL SEGURO - EXECUTE ESTE NO SUPABASE DASHBOARD
-- ===============================================================

-- 1. CRIAR TABELA CLIENTS SE NÃO EXISTIR
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADICIONAR CAMPOS FINANCEIROS SE NÃO EXISTIREM
DO $$
BEGIN
    -- Adicionar contract_value se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='contract_value') THEN
        ALTER TABLE clients ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL;
    END IF;
    
    -- Adicionar contract_duration se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='contract_duration') THEN
        ALTER TABLE clients ADD COLUMN contract_duration INTEGER DEFAULT NULL;
    END IF;
    
    -- Adicionar contract_start_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='contract_start_date') THEN
        ALTER TABLE clients ADD COLUMN contract_start_date DATE DEFAULT NULL;
    END IF;
    
    -- Adicionar contract_end_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='contract_end_date') THEN
        ALTER TABLE clients ADD COLUMN contract_end_date DATE DEFAULT NULL;
    END IF;
    
    -- Adicionar payment_frequency se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='payment_frequency') THEN
        ALTER TABLE clients ADD COLUMN payment_frequency VARCHAR(20) DEFAULT 'monthly';
    END IF;
    
    -- Adicionar contract_currency se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='contract_currency') THEN
        ALTER TABLE clients ADD COLUMN contract_currency VARCHAR(3) DEFAULT 'BRL';
    END IF;
END
$$;

-- 3. CRIAR/ATUALIZAR FUNÇÃO DO TRIGGER
CREATE OR REPLACE FUNCTION update_contract_end_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_start_date IS NOT NULL AND NEW.contract_duration IS NOT NULL THEN
        NEW.contract_end_date := NEW.contract_start_date + (NEW.contract_duration || ' months')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. REMOVER E RECRIAR TRIGGER
DROP TRIGGER IF EXISTS trigger_update_contract_end_date ON clients;
CREATE TRIGGER trigger_update_contract_end_date
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_end_date();

-- 5. ADICIONAR client_id À TABELA user_invitations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_invitations' AND column_name='client_id') THEN
        ALTER TABLE user_invitations ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_contract_value ON clients(contract_value);
CREATE INDEX IF NOT EXISTS idx_user_invitations_client_id ON user_invitations(client_id);

-- 7. RLS POLICIES
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can manage clients from their agency" ON clients;

-- Criar política atualizada
CREATE POLICY "Users can manage clients from their agency" ON clients
    USING (agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

-- Verificar se tudo foi criado corretamente
SELECT 
    'Tabela clients: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN '✅ OK' ELSE '❌ ERRO' END as clients_table,
    'Campos financeiros: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='contract_value') THEN '✅ OK' ELSE '❌ ERRO' END as financial_fields,
    'Trigger: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_update_contract_end_date') THEN '✅ OK' ELSE '❌ ERRO' END as trigger_status,
    'Coluna client_id: ' || CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_invitations' AND column_name='client_id') THEN '✅ OK' ELSE '❌ ERRO' END as client_id_column;

SELECT '🚀 Sistema de gestão financeira configurado com sucesso!' as resultado;