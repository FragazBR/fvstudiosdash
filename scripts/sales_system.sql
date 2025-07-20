-- ==========================================
-- SISTEMA DE CADASTRO E PAGAMENTO
-- ==========================================
-- Adicionar tabelas para sistema de vendas e onboarding

-- Tabela de leads/interessados (antes do pagamento)
CREATE TABLE IF NOT EXISTS public.agency_leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Plano de interesse
  interested_plan VARCHAR(50) NOT NULL DEFAULT 'agency_basic',
  estimated_clients INTEGER DEFAULT 1,
  current_tools TEXT, -- "Google Ads, Facebook Ads, etc"
  
  -- Status do lead
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, demo_scheduled, proposal_sent, closed_won, closed_lost
  lead_source VARCHAR(100), -- "website", "google_ads", "referral", "linkedin"
  notes TEXT,
  
  -- Dados de contato/demo
  demo_scheduled_at TIMESTAMP WITH TIME ZONE,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  assigned_sales_rep VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de pagamentos/assinaturas
CREATE TABLE IF NOT EXISTS public.agency_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Dados do plano
  plan_name VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, annual
  
  -- Preços
  monthly_price DECIMAL(8,2) NOT NULL,
  annual_price DECIMAL(8,2),
  current_price DECIMAL(8,2) NOT NULL, -- preço atual sendo cobrado
  
  -- Status da assinatura
  status VARCHAR(50) DEFAULT 'active', -- active, cancelled, suspended, past_due
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Integração com gateway de pagamento
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  pagseguro_subscription_id VARCHAR(255),
  payment_method JSONB, -- dados do cartão/boleto
  
  -- Histórico
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(agency_id)
);

-- Tabela de faturas/cobrança
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.agency_subscriptions(id) ON DELETE CASCADE,
  
  -- Dados da fatura
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados do período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Integração gateway
  stripe_invoice_id VARCHAR(255),
  pagseguro_transaction_id VARCHAR(255),
  payment_method VARCHAR(50), -- credit_card, boleto, pix
  
  -- URLs e arquivos
  invoice_url TEXT,
  pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de cupons de desconto
CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Tipo de desconto
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
  discount_value DECIMAL(8,2) NOT NULL,
  
  -- Restrições
  applicable_plans JSONB DEFAULT '[]', -- ["agency_basic", "agency_pro"]
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  
  -- Validade
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de onboarding/setup inicial
CREATE TABLE IF NOT EXISTS public.agency_onboarding (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Etapas do onboarding
  steps_completed JSONB DEFAULT '[]', -- ["account_created", "payment_confirmed", "team_invited", "first_client_added", "apis_configured"]
  current_step VARCHAR(50) DEFAULT 'account_created',
  
  -- Dados coletados no onboarding
  business_info JSONB DEFAULT '{}',
  goals JSONB DEFAULT '[]',
  current_tools JSONB DEFAULT '[]',
  team_size INTEGER,
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(agency_id)
);

-- ==========================================
-- CONSTRAINTS E VALIDAÇÕES
-- ==========================================

DO $$
BEGIN
  -- Agency leads
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'agency_leads_status_check') THEN
    ALTER TABLE public.agency_leads ADD CONSTRAINT agency_leads_status_check 
    CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'proposal_sent', 'closed_won', 'closed_lost'));
  END IF;

  -- Subscriptions
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'agency_subscriptions_status_check') THEN
    ALTER TABLE public.agency_subscriptions ADD CONSTRAINT agency_subscriptions_status_check 
    CHECK (status IN ('active', 'cancelled', 'suspended', 'past_due', 'trialing'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'agency_subscriptions_billing_cycle_check') THEN
    ALTER TABLE public.agency_subscriptions ADD CONSTRAINT agency_subscriptions_billing_cycle_check 
    CHECK (billing_cycle IN ('monthly', 'annual'));
  END IF;

  -- Invoices
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'invoices_status_check') THEN
    ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));
  END IF;

  -- Discount coupons
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'discount_coupons_type_check') THEN
    ALTER TABLE public.discount_coupons ADD CONSTRAINT discount_coupons_type_check 
    CHECK (discount_type IN ('percentage', 'fixed_amount'));
  END IF;
END $$;

-- ==========================================
-- ÍNDICES
-- ==========================================

DO $$
BEGIN
  -- Agency leads indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_leads_status') THEN
    CREATE INDEX idx_agency_leads_status ON public.agency_leads(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_leads_created_at') THEN
    CREATE INDEX idx_agency_leads_created_at ON public.agency_leads(created_at);
  END IF;

  -- Subscriptions indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_subscriptions_status') THEN
    CREATE INDEX idx_agency_subscriptions_status ON public.agency_subscriptions(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_subscriptions_current_period') THEN
    CREATE INDEX idx_agency_subscriptions_current_period ON public.agency_subscriptions(current_period_end);
  END IF;

  -- Invoices indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_status') THEN
    CREATE INDEX idx_invoices_status ON public.invoices(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_due_date') THEN
    CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
  END IF;
END $$;

-- ==========================================
-- RLS POLICIES - Sistema de Vendas
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.agency_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_onboarding ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- ===== AGENCY LEADS =====
  
  -- Admin pode gerenciar todos os leads
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agency_leads' AND policyname = 'Admin can manage all leads') THEN
    CREATE POLICY "Admin can manage all leads" ON public.agency_leads FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- ===== AGENCY SUBSCRIPTIONS =====
  
  -- Agências podem ver própria assinatura
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agency_subscriptions' AND policyname = 'Agency can view own subscription') THEN
    CREATE POLICY "Agency can view own subscription" ON public.agency_subscriptions FOR SELECT 
    USING (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      )
    );
  END IF;

  -- Admin pode gerenciar todas as assinaturas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agency_subscriptions' AND policyname = 'Admin can manage all subscriptions') THEN
    CREATE POLICY "Admin can manage all subscriptions" ON public.agency_subscriptions FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- ===== INVOICES =====
  
  -- Agências podem ver próprias faturas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Agency can view own invoices') THEN
    CREATE POLICY "Agency can view own invoices" ON public.invoices FOR SELECT 
    USING (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      )
    );
  END IF;

  -- Admin pode gerenciar todas as faturas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Admin can manage all invoices') THEN
    CREATE POLICY "Admin can manage all invoices" ON public.invoices FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- ===== DISCOUNT COUPONS =====
  
  -- Todos podem visualizar cupons ativos (para validação)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discount_coupons' AND policyname = 'Everyone can view active coupons') THEN
    CREATE POLICY "Everyone can view active coupons" ON public.discount_coupons FOR SELECT 
    USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));
  END IF;

  -- Admin pode gerenciar cupons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discount_coupons' AND policyname = 'Admin can manage coupons') THEN
    CREATE POLICY "Admin can manage coupons" ON public.discount_coupons FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- ===== AGENCY ONBOARDING =====
  
  -- Agência pode gerenciar próprio onboarding
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agency_onboarding' AND policyname = 'Agency can manage own onboarding') THEN
    CREATE POLICY "Agency can manage own onboarding" ON public.agency_onboarding FOR ALL 
    USING (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      ) OR user_id = auth.uid()
    )
    WITH CHECK (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      ) OR user_id = auth.uid()
    );
  END IF;
END $$;

-- ==========================================
-- FUNÇÕES DO SISTEMA DE VENDAS
-- ==========================================

-- Função para criar agência após pagamento aprovado
CREATE OR REPLACE FUNCTION public.create_agency_after_payment(
  lead_email VARCHAR(255),
  plan_name VARCHAR(50),
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  stripe_customer_id VARCHAR(255) DEFAULT NULL,
  stripe_subscription_id VARCHAR(255) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_agency_id UUID;
    new_user_id UUID;
    lead_data RECORD;
    plan_data RECORD;
    subscription_id UUID;
    onboarding_id UUID;
BEGIN
    -- Buscar dados do lead
    SELECT * INTO lead_data FROM public.agency_leads WHERE email = lead_email;
    
    IF lead_data IS NULL THEN
        RETURN '{"error": "Lead not found"}';
    END IF;
    
    -- Buscar dados do plano
    SELECT * INTO plan_data FROM public.plan_limits WHERE plan_name = create_agency_after_payment.plan_name;
    
    IF plan_data IS NULL THEN
        RETURN '{"error": "Plan not found"}';
    END IF;
    
    -- Criar agência
    INSERT INTO public.agencies (name, email, phone, subscription_plan, subscription_status)
    VALUES (lead_data.company_name, lead_data.email, lead_data.phone, plan_name, 'active')
    RETURNING id INTO new_agency_id;
    
    -- Criar usuário owner da agência (será criado no auth.users externamente)
    new_user_id := gen_random_uuid();
    
    INSERT INTO public.user_profiles (id, email, name, role, agency_id, company, subscription_plan, subscription_status)
    VALUES (new_user_id, lead_data.email, lead_data.name, 'agency_owner', new_agency_id, lead_data.company_name, plan_name, 'active');
    
    -- Criar assinatura
    INSERT INTO public.agency_subscriptions (
        agency_id, plan_name, billing_cycle, monthly_price, annual_price, current_price,
        current_period_start, current_period_end, stripe_customer_id, stripe_subscription_id
    ) VALUES (
        new_agency_id, 
        plan_name, 
        billing_cycle, 
        plan_data.monthly_price, 
        plan_data.annual_price,
        CASE WHEN billing_cycle = 'annual' THEN plan_data.annual_price ELSE plan_data.monthly_price END,
        now(),
        CASE WHEN billing_cycle = 'annual' THEN now() + interval '1 year' ELSE now() + interval '1 month' END,
        stripe_customer_id,
        stripe_subscription_id
    ) RETURNING id INTO subscription_id;
    
    -- Criar onboarding
    INSERT INTO public.agency_onboarding (agency_id, user_id, steps_completed, current_step)
    VALUES (new_agency_id, new_user_id, '["account_created", "payment_confirmed"]', 'team_setup')
    RETURNING id INTO onboarding_id;
    
    -- Atualizar lead como "closed_won"
    UPDATE public.agency_leads SET status = 'closed_won', updated_at = now() WHERE email = lead_email;
    
    RETURN json_build_object(
        'success', true,
        'agency_id', new_agency_id,
        'user_id', new_user_id,
        'subscription_id', subscription_id,
        'onboarding_id', onboarding_id
    );
END;
$$;

-- Função para processar lead do site
CREATE OR REPLACE FUNCTION public.process_website_lead(
  email VARCHAR(255),
  name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(20) DEFAULT NULL,
  interested_plan VARCHAR(50) DEFAULT 'agency_basic',
  lead_source VARCHAR(100) DEFAULT 'website'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lead_id UUID;
BEGIN
    -- Inserir ou atualizar lead
    INSERT INTO public.agency_leads (email, name, company_name, phone, interested_plan, lead_source, status)
    VALUES (email, name, company_name, phone, interested_plan, lead_source, 'new')
    ON CONFLICT (email) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        company_name = EXCLUDED.company_name,
        phone = EXCLUDED.phone,
        interested_plan = EXCLUDED.interested_plan,
        updated_at = now()
    RETURNING id INTO lead_id;
    
    -- Criar notificação para admin
    INSERT INTO public.notifications (title, message, type, priority, user_id, related_entity_type, related_entity_id)
    SELECT 
        'Novo Lead Cadastrado',
        format('Nova agência interessada: %s (%s) - Plano: %s', company_name, email, interested_plan),
        'info',
        'medium',
        id,
        'lead',
        lead_id
    FROM public.user_profiles WHERE role = 'admin' LIMIT 1;
    
    RETURN json_build_object(
        'success', true,
        'lead_id', lead_id,
        'message', 'Lead criado com sucesso'
    );
END;
$$;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger para updated_at
CREATE TRIGGER update_agency_leads_updated_at BEFORE UPDATE ON public.agency_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agency_subscriptions_updated_at BEFORE UPDATE ON public.agency_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_coupons_updated_at BEFORE UPDATE ON public.discount_coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agency_onboarding_updated_at BEFORE UPDATE ON public.agency_onboarding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DADOS INICIAIS
-- ==========================================

-- Inserir cupons de desconto iniciais
INSERT INTO public.discount_coupons (code, description, discount_type, discount_value, applicable_plans, max_uses)
VALUES 
  ('WELCOME30', 'Desconto de boas-vindas - 30% off primeiro mês', 'percentage', 30.00, '["agency_basic", "agency_pro"]', 100),
  ('ANUAL50', 'Desconto plano anual - R$ 50 off', 'fixed_amount', 50.00, '["agency_basic", "agency_pro"]', NULL),
  ('LAUNCH25', 'Desconto de lançamento - 25% off', 'percentage', 25.00, '["agency_basic", "agency_pro"]', 50)
ON CONFLICT (code) DO NOTHING;

SELECT 'Sistema de vendas e pagamento criado!' AS status,
       'Tabelas: 5, Funções: 2, Políticas RLS: 10+' AS summary;
