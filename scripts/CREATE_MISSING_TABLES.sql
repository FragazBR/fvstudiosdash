-- ================================
-- MISSING DATABASE TABLES
-- Execute este script no Supabase SQL Editor
-- ================================

-- Tabela: agency_leads
-- Armazena leads de agências interessadas
CREATE TABLE IF NOT EXISTS agency_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  company_name text,
  phone text,
  website text,
  current_tools text,
  estimated_clients text,
  plan_interest text DEFAULT 'agency_basic',
  billing_cycle text DEFAULT 'monthly',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo', 'proposal', 'converted', 'lost')),
  notes text,
  assigned_to uuid REFERENCES user_profiles(id),
  converted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: agency_subscriptions
-- Gerencia assinaturas das agências
CREATE TABLE IF NOT EXISTS agency_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_cents integer NOT NULL,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: invoices
-- Histórico de faturas
CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES agency_subscriptions(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  amount_cents integer NOT NULL,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  stripe_invoice_id text UNIQUE,
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: discount_coupons
-- Sistema de cupons de desconto
CREATE TABLE IF NOT EXISTS discount_coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric(10,2) NOT NULL,
  currency text DEFAULT 'BRL',
  min_amount_cents integer DEFAULT 0,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela: agency_onboarding
-- Processo de integração de agências
CREATE TABLE IF NOT EXISTS agency_onboarding (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  current_step text DEFAULT 'account_created',
  steps_completed text[] DEFAULT '{}',
  onboarding_data jsonb DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar campos que podem estar faltando na tabela agencies
DO $$ 
BEGIN
  -- Adicionar stripe_customer_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE agencies ADD COLUMN stripe_customer_id text;
  END IF;
  
  -- Adicionar stripe_subscription_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE agencies ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;

-- Adicionar campos que podem estar faltando na tabela projects
DO $$ 
BEGIN
  -- Adicionar progress se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'progress') THEN
    ALTER TABLE projects ADD COLUMN progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
  END IF;
  
  -- Adicionar priority se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority') THEN
    ALTER TABLE projects ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
  
  -- Adicionar color se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'color') THEN
    ALTER TABLE projects ADD COLUMN color text DEFAULT '#3b82f6';
  END IF;
  
  -- Adicionar tags se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tags') THEN
    ALTER TABLE projects ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_agency_leads_email ON agency_leads(email);
CREATE INDEX IF NOT EXISTS idx_agency_leads_status ON agency_leads(status);
CREATE INDEX IF NOT EXISTS idx_agency_leads_created_at ON agency_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_agency_id ON agency_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_status ON agency_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_agency_subscriptions_stripe_subscription_id ON agency_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_invoices_agency_id ON invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_discount_coupons_code ON discount_coupons(code);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_active ON discount_coupons(active);

CREATE INDEX IF NOT EXISTS idx_agency_onboarding_agency_id ON agency_onboarding(agency_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_agency_leads_updated_at ON agency_leads;
CREATE TRIGGER update_agency_leads_updated_at BEFORE UPDATE ON agency_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agency_subscriptions_updated_at ON agency_subscriptions;
CREATE TRIGGER update_agency_subscriptions_updated_at BEFORE UPDATE ON agency_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discount_coupons_updated_at ON discount_coupons;
CREATE TRIGGER update_discount_coupons_updated_at BEFORE UPDATE ON discount_coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agency_onboarding_updated_at ON agency_onboarding;
CREATE TRIGGER update_agency_onboarding_updated_at BEFORE UPDATE ON agency_onboarding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE agency_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_onboarding ENABLE ROW LEVEL SECURITY;

-- Policies para agency_leads
CREATE POLICY "Admin full access agency_leads" ON agency_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency owners see own leads" ON agency_leads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('agency_owner', 'agency_manager')
  )
);

-- Policies para agency_subscriptions
CREATE POLICY "Admin full access agency_subscriptions" ON agency_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency owners see own subscriptions" ON agency_subscriptions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = agency_subscriptions.agency_id
    AND up.role IN ('agency_owner', 'agency_manager')
  )
);

-- Policies para invoices
CREATE POLICY "Admin full access invoices" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency owners see own invoices" ON invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = invoices.agency_id
    AND up.role IN ('agency_owner', 'agency_manager')
  )
);

-- Policies para discount_coupons (público para verificação)
CREATE POLICY "Public read discount_coupons" ON discount_coupons FOR SELECT USING (active = true);

CREATE POLICY "Admin full access discount_coupons" ON discount_coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies para agency_onboarding
CREATE POLICY "Admin full access agency_onboarding" ON agency_onboarding FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users manage own onboarding" ON agency_onboarding FOR ALL USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.agency_id = agency_onboarding.agency_id
    AND up.role IN ('agency_owner', 'agency_manager')
  )
);

-- Inserir cupons de exemplo
INSERT INTO discount_coupons (code, name, description, discount_type, discount_value, expires_at) VALUES
  ('WELCOME30', 'Desconto de Boas-vindas', '30% off no primeiro mês', 'percentage', 30.00, now() + interval '30 days'),
  ('ANUAL50', 'Desconto Anual', 'R$ 50 off em planos anuais', 'fixed_amount', 50.00, now() + interval '90 days'),
  ('LAUNCH25', 'Desconto de Lançamento', '25% off por tempo limitado', 'percentage', 25.00, now() + interval '60 days')
ON CONFLICT (code) DO NOTHING;

-- Comentários
COMMENT ON TABLE agency_leads IS 'Leads de agências interessadas no serviço';
COMMENT ON TABLE agency_subscriptions IS 'Assinaturas ativas das agências';
COMMENT ON TABLE invoices IS 'Histórico de faturas e pagamentos';
COMMENT ON TABLE discount_coupons IS 'Cupons de desconto disponíveis';
COMMENT ON TABLE agency_onboarding IS 'Processo de integração das agências';