-- ================================
-- FIX CONTACTS API ERROR - CREATE/UPDATE CONTACTS TABLE
-- Execute este script no Supabase SQL Editor
-- ================================

-- Criar tabela contacts se não existir
CREATE TABLE IF NOT EXISTS contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  position text,
  type text DEFAULT 'lead' CHECK (type IN ('lead', 'prospect', 'client', 'partner')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'converted', 'lost')),
  source text,
  tags text[] DEFAULT '{}',
  notes text,
  address jsonb DEFAULT '{}',
  website text,
  social_media jsonb DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  total_project_value numeric(12,2) DEFAULT 0,
  active_projects integer DEFAULT 0,
  last_contact_date timestamptz,
  next_followup_date timestamptz,
  lead_score integer DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  lifecycle_stage text DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'marketing_qualified', 'sales_qualified', 'opportunity', 'customer', 'evangelist')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar campos que podem estar faltando
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
  
  -- Adicionar last_contact_date se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'last_contact_date') THEN
    ALTER TABLE contacts ADD COLUMN last_contact_date timestamptz;
  END IF;
  
  -- Adicionar next_followup_date se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'next_followup_date') THEN
    ALTER TABLE contacts ADD COLUMN next_followup_date timestamptz;
  END IF;
  
  -- Adicionar lead_score se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lead_score') THEN
    ALTER TABLE contacts ADD COLUMN lead_score integer DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100);
  END IF;
  
  -- Adicionar lifecycle_stage se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lifecycle_stage') THEN
    ALTER TABLE contacts ADD COLUMN lifecycle_stage text DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'marketing_qualified', 'sales_qualified', 'opportunity', 'customer', 'evangelist'));
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

-- Criar tabela contact_interactions se não existir
CREATE TABLE IF NOT EXISTS contact_interactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'proposal_sent', 'contract_signed', 'payment_received')),
  date timestamptz DEFAULT now(),
  duration_minutes integer,
  notes text,
  outcome text CHECK (outcome IN ('completed', 'scheduled', 'cancelled', 'no_response')),
  next_action text,
  next_action_date timestamptz,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela contact_tags se não existir (para tags customizadas)
CREATE TABLE IF NOT EXISTS contact_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  color text DEFAULT '#6b7280',
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle_stage ON contacts(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_score ON contacts(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact_date ON contacts(last_contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_next_followup_date ON contacts(next_followup_date);

CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact_id ON contact_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_type ON contact_interactions(type);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_date ON contact_interactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_created_by ON contact_interactions(created_by);

CREATE INDEX IF NOT EXISTS idx_contact_tags_agency_id ON contact_tags(agency_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_interactions_updated_at ON contact_interactions;
CREATE TRIGGER update_contact_interactions_updated_at BEFORE UPDATE ON contact_interactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar last_contact_date quando há nova interação
CREATE OR REPLACE FUNCTION update_contact_last_contact_date()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contacts 
    SET last_contact_date = NEW.date 
    WHERE id = NEW.contact_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_contact_last_contact_date ON contact_interactions;
CREATE TRIGGER trigger_update_contact_last_contact_date
  AFTER INSERT ON contact_interactions
  FOR EACH ROW EXECUTE FUNCTION update_contact_last_contact_date();

-- Trigger para atualizar contadores de projetos
CREATE OR REPLACE FUNCTION update_contact_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE contacts SET
      active_projects = (
        SELECT COUNT(*) 
        FROM projects 
        WHERE client_id = NEW.client_id 
        AND status IN ('active', 'on_hold')
      ),
      total_project_value = (
        SELECT COALESCE(SUM(budget_total), 0) 
        FROM projects 
        WHERE client_id = NEW.client_id
      )
    WHERE id = NEW.client_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contacts SET
      active_projects = (
        SELECT COUNT(*) 
        FROM projects 
        WHERE client_id = OLD.client_id 
        AND status IN ('active', 'on_hold')
      ),
      total_project_value = (
        SELECT COALESCE(SUM(budget_total), 0) 
        FROM projects 
        WHERE client_id = OLD.client_id
      )
    WHERE id = OLD.client_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Aplicar trigger apenas se a tabela projects existir com campo client_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_id') THEN
    DROP TRIGGER IF EXISTS trigger_update_contact_project_stats ON projects;
    CREATE TRIGGER trigger_update_contact_project_stats
      AFTER INSERT OR UPDATE OR DELETE ON projects
      FOR EACH ROW EXECUTE FUNCTION update_contact_project_stats();
  END IF;
END $$;

-- RLS Policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

-- Policies para contacts
CREATE POLICY "Admin full access contacts" ON contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency members see own agency contacts" ON contacts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = contacts.agency_id
    AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
  )
);

CREATE POLICY "Agency members create contacts" ON contacts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = agency_id
    AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
  )
);

CREATE POLICY "Agency members update contacts" ON contacts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = contacts.agency_id
    AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
  )
);

CREATE POLICY "Agency owners delete contacts" ON contacts FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = contacts.agency_id
    AND up.role IN ('agency_owner', 'agency_manager')
  )
);

-- Users can see contacts assigned to them
CREATE POLICY "Users see assigned contacts" ON contacts FOR SELECT USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
);

-- Independent users see only their own contacts
CREATE POLICY "Independent users see own contacts" ON contacts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('independent_producer', 'independent_client', 'influencer')
    AND created_by = auth.uid()
  )
);

-- Policies para contact_interactions
CREATE POLICY "Admin full access contact_interactions" ON contact_interactions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see interactions of accessible contacts" ON contact_interactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.id = contact_interactions.contact_id
    AND (
      c.assigned_to = auth.uid() OR
      c.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.agency_id = c.agency_id
        AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
      )
    )
  )
);

CREATE POLICY "Users create interactions on accessible contacts" ON contact_interactions FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.id = contact_id
    AND (
      c.assigned_to = auth.uid() OR
      c.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.agency_id = c.agency_id
        AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
      )
    )
  )
);

CREATE POLICY "Users update own interactions" ON contact_interactions FOR UPDATE USING (
  created_by = auth.uid()
);

CREATE POLICY "Users delete own interactions" ON contact_interactions FOR DELETE USING (
  created_by = auth.uid()
);

-- Policies para contact_tags
CREATE POLICY "Admin full access contact_tags" ON contact_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency members see own agency tags" ON contact_tags FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = contact_tags.agency_id
  )
);

CREATE POLICY "Agency members create tags" ON contact_tags FOR INSERT WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = agency_id
    AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
  )
);

-- Inserir alguns contatos de exemplo para teste
INSERT INTO contacts (name, email, company, type, status, agency_id, created_by) 
SELECT 
  'João Silva' as name,
  'joao@empresa.com' as email,
  'Empresa Exemplo Ltda' as company,
  'client' as type,
  'active' as status,
  a.id as agency_id,
  up.id as created_by
FROM agencies a
JOIN user_profiles up ON up.agency_id = a.id
WHERE up.role = 'agency_owner'
LIMIT 3
ON CONFLICT DO NOTHING;

INSERT INTO contacts (name, email, company, type, status, agency_id, created_by) 
SELECT 
  'Maria Santos' as name,
  'maria@lead.com' as email,
  'Lead Company' as company,
  'lead' as type,
  'pending' as status,
  a.id as agency_id,
  up.id as created_by
FROM agencies a
JOIN user_profiles up ON up.agency_id = a.id
WHERE up.role = 'agency_owner'
LIMIT 3
ON CONFLICT DO NOTHING;

-- Inserir algumas tags de exemplo
INSERT INTO contact_tags (name, color, agency_id, created_by)
SELECT DISTINCT
  tag_name,
  colors.color,
  a.id as agency_id,
  up.id as created_by
FROM (
  VALUES 
    ('Cliente Premium', '#10b981'),
    ('Lead Quente', '#f59e0b'),
    ('Prospecto', '#3b82f6'),
    ('Parceiro', '#8b5cf6'),
    ('VIP', '#ef4444')
) AS tag_data(tag_name)
CROSS JOIN (
  VALUES ('#10b981'), ('#f59e0b'), ('#3b82f6'), ('#8b5cf6'), ('#ef4444')
) AS colors(color)
JOIN agencies a ON true
JOIN user_profiles up ON up.agency_id = a.id AND up.role = 'agency_owner'
LIMIT 25
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE contacts IS 'Contatos, leads e clientes das agências';
COMMENT ON TABLE contact_interactions IS 'Histórico de interações com contatos';
COMMENT ON TABLE contact_tags IS 'Tags personalizadas para organizar contatos';