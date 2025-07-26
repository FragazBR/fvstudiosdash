-- ================================
-- CORREÇÃO ESPECÍFICA PARA COLUNAS DA TABELA CONTACTS
-- Execute este script no Supabase SQL Editor
-- ================================

-- Adicionar colunas que estão faltando na tabela contacts
DO $$ 
BEGIN
  -- Adicionar agency_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'agency_id') THEN
    ALTER TABLE contacts ADD COLUMN agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE;
  END IF;
  
  -- Adicionar created_by se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'created_by') THEN
    ALTER TABLE contacts ADD COLUMN created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Adicionar assigned_to se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'assigned_to') THEN
    ALTER TABLE contacts ADD COLUMN assigned_to uuid REFERENCES user_profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Adicionar total_project_value se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'total_project_value') THEN
    ALTER TABLE contacts ADD COLUMN total_project_value numeric(12,2) DEFAULT 0;
  END IF;
  
  -- Adicionar active_projects se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'active_projects') THEN
    ALTER TABLE contacts ADD COLUMN active_projects integer DEFAULT 0;
  END IF;
  
  -- Adicionar tags se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'tags') THEN
    ALTER TABLE contacts ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  
  -- Adicionar address se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'address') THEN
    ALTER TABLE contacts ADD COLUMN address jsonb DEFAULT '{}';
  END IF;
  
  -- Adicionar social_media se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'social_media') THEN
    ALTER TABLE contacts ADD COLUMN social_media jsonb DEFAULT '{}';
  END IF;
  
  -- Adicionar custom_fields se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'custom_fields') THEN
    ALTER TABLE contacts ADD COLUMN custom_fields jsonb DEFAULT '{}';
  END IF;
END $$;

-- Atualizar dados existentes com valores padrão
UPDATE contacts SET 
  total_project_value = 0 WHERE total_project_value IS NULL;
UPDATE contacts SET 
  active_projects = 0 WHERE active_projects IS NULL;
UPDATE contacts SET 
  tags = ARRAY[]::text[] WHERE tags IS NULL;
UPDATE contacts SET 
  address = '{}'::jsonb WHERE address IS NULL;
UPDATE contacts SET 
  social_media = '{}'::jsonb WHERE social_media IS NULL;
UPDATE contacts SET 
  custom_fields = '{}'::jsonb WHERE custom_fields IS NULL;

-- Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policies básicas
DO $$
BEGIN
  -- Remover policies existentes
  DROP POLICY IF EXISTS "Admin full access contacts" ON contacts;
  DROP POLICY IF EXISTS "Agency members see own agency contacts" ON contacts;
  DROP POLICY IF EXISTS "Users see assigned contacts" ON contacts;
  
  -- Criar policies novas
  CREATE POLICY "Admin full access contacts" ON contacts FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
  
  CREATE POLICY "Agency members see own agency contacts" ON contacts FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.agency_id = contacts.agency_id
    )
  );
  
  CREATE POLICY "Users see assigned contacts" ON contacts FOR ALL USING (
    assigned_to = auth.uid() OR created_by = auth.uid()
  );
END $$;