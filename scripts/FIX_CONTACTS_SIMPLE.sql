-- ================================
-- CORREÇÃO SIMPLES PARA CONTACTS
-- Execute este script no Supabase SQL Editor
-- ================================

-- 1. Adicionar apenas colunas essenciais
DO $$ 
BEGIN
  -- Adicionar agency_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'agency_id') THEN
    ALTER TABLE contacts ADD COLUMN agency_id uuid;
  END IF;
  
  -- Adicionar created_by se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'created_by') THEN
    ALTER TABLE contacts ADD COLUMN created_by uuid;
  END IF;
  
  -- Adicionar assigned_to se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'assigned_to') THEN
    ALTER TABLE contacts ADD COLUMN assigned_to uuid;
  END IF;
END $$;

-- 2. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- 3. Habilitar RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 4. Políticas básicas (drop primeiro para evitar conflitos)
DROP POLICY IF EXISTS "Admin full access contacts" ON contacts;
DROP POLICY IF EXISTS "Agency members see contacts" ON contacts;
DROP POLICY IF EXISTS "Users see assigned contacts" ON contacts;

-- Criar políticas simples
CREATE POLICY "Admin full access contacts" ON contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see agency contacts" ON contacts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND (up.agency_id = contacts.agency_id OR contacts.agency_id IS NULL)
  ) OR assigned_to = auth.uid() OR created_by = auth.uid()
);

CREATE POLICY "Users manage contacts" ON contacts FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "Users update contacts" ON contacts FOR UPDATE USING (
  created_by = auth.uid() OR assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = contacts.agency_id
  )
);

-- 5. Inserir alguns contatos de exemplo se não existirem
INSERT INTO contacts (name, email, company, type, status, agency_id, created_by) 
SELECT 
  'Cliente Exemplo #' || ROW_NUMBER() OVER() as name,
  'cliente' || ROW_NUMBER() OVER() || '@exemplo.com' as email,
  'Empresa Exemplo Ltda' as company,
  'client' as type,
  'active' as status,
  a.id as agency_id,
  up.id as created_by
FROM agencies a
JOIN user_profiles up ON up.agency_id = a.id
WHERE up.role IN ('agency_owner', 'agency_manager')
AND NOT EXISTS (SELECT 1 FROM contacts WHERE agency_id = a.id)
LIMIT 3
ON CONFLICT DO NOTHING;