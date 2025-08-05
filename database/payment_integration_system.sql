-- Sistema de Integração com Plataformas de Pagamento
-- Permite integração com Stripe, PayPal, Mercado Pago, PagSeguro, etc.

-- Enum para tipos de eventos de pagamento
CREATE TYPE payment_event_type AS ENUM (
  'payment_intent_created',
  'payment_succeeded',
  'payment_failed',
  'payment_canceled',
  'payment_refunded',
  'subscription_created',
  'subscription_updated',
  'subscription_canceled'
);

-- Enum para status de pagamento
CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'canceled',
  'refunded',
  'partially_refunded'
);

-- Enum para tipos de plataforma de pagamento
CREATE TYPE payment_platform AS ENUM (
  'stripe',
  'paypal',
  'mercado_pago',
  'pagseguro',
  'asaas',
  'gerencianet',
  'cielo',
  'rede'
);

-- Enum para tipos de plano de assinatura
CREATE TYPE subscription_interval AS ENUM (
  'day',
  'week',
  'month',
  'quarter',
  'year'
);

-- 1. Configurações de Integração de Pagamento
CREATE TABLE IF NOT EXISTS payment_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  platform payment_platform NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Configurações da plataforma
  api_key_encrypted TEXT,
  secret_key_encrypted TEXT,
  webhook_secret_encrypted TEXT,
  sandbox_mode BOOLEAN DEFAULT true,
  
  -- URLs e configurações
  webhook_url TEXT,
  success_url TEXT,
  cancel_url TEXT,
  notification_url TEXT,
  
  -- Configurações avançadas
  config JSONB NOT NULL DEFAULT '{}',
  supported_currencies TEXT[] DEFAULT ARRAY['BRL', 'USD'],
  
  -- Status e controle
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  test_mode BOOLEAN DEFAULT true,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(agency_id, platform, name)
);

-- 2. Produtos e Serviços
CREATE TABLE IF NOT EXISTS payment_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES payment_integrations(id) ON DELETE SET NULL,
  
  -- Informações do produto
  name VARCHAR(200) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  category VARCHAR(100),
  
  -- Preços e configurações
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Configurações de recorrência
  is_subscription BOOLEAN DEFAULT false,
  billing_interval subscription_interval,
  billing_interval_count INTEGER DEFAULT 1,
  trial_period_days INTEGER DEFAULT 0,
  
  -- URLs e imagens
  image_url TEXT,
  product_url TEXT,
  
  -- IDs externos nas plataformas
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  paypal_product_id TEXT,
  mercadopago_product_id TEXT,
  
  -- Inventário
  track_inventory BOOLEAN DEFAULT false,
  stock_quantity INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES payment_integrations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES payment_products(id) ON DELETE SET NULL,
  
  -- IDs externos
  external_id TEXT NOT NULL,
  session_id TEXT,
  checkout_id TEXT,
  
  -- Informações do cliente
  customer_name VARCHAR(200),
  customer_email VARCHAR(200),
  customer_phone VARCHAR(20),
  customer_document VARCHAR(20),
  
  -- Detalhes do pagamento
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  description TEXT,
  
  -- Status e processamento
  status payment_status NOT NULL DEFAULT 'pending',
  platform payment_platform NOT NULL,
  payment_method VARCHAR(50),
  
  -- Datas importantes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- URLs
  checkout_url TEXT,
  receipt_url TEXT,
  
  -- Dados do webhook
  webhook_data JSONB DEFAULT '{}',
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  UNIQUE(external_id, platform)
);

-- 4. Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES payment_integrations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES payment_products(id) ON DELETE SET NULL,
  
  -- IDs externos
  external_id TEXT NOT NULL,
  customer_id TEXT,
  
  -- Informações do cliente
  customer_name VARCHAR(200),
  customer_email VARCHAR(200),
  customer_phone VARCHAR(20),
  
  -- Configurações da assinatura
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  platform payment_platform NOT NULL,
  
  -- Preços e billing
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  billing_interval subscription_interval NOT NULL,
  billing_interval_count INTEGER DEFAULT 1,
  
  -- Datas importantes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  trial_end_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados adicionais
  cancel_reason TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  UNIQUE(external_id, platform)
);

-- 5. Eventos de Webhook
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES payment_integrations(id) ON DELETE SET NULL,
  
  -- Identificação do evento
  external_event_id TEXT NOT NULL,
  event_type payment_event_type NOT NULL,
  platform payment_platform NOT NULL,
  
  -- Dados do evento
  payload JSONB NOT NULL,
  headers JSONB DEFAULT '{}',
  
  -- Processamento
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_attempts INTEGER DEFAULT 0,
  last_processing_error TEXT,
  
  -- Relacionamentos
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(external_event_id, platform)
);

-- 6. Log de Transações
CREATE TABLE IF NOT EXISTS payment_transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES payment_integrations(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  
  -- Detalhes da transação
  action VARCHAR(50) NOT NULL,
  status VARCHAR(50),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  
  -- Dados da requisição/resposta
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  
  -- Timing
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- IP e user agent
  ip_address INET,
  user_agent TEXT
);

-- 7. Relatórios de Pagamento
CREATE TABLE IF NOT EXISTS payment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES payment_integrations(id) ON DELETE SET NULL,
  
  -- Configurações do relatório
  name VARCHAR(200) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,
  
  -- Filtros e configurações
  date_range JSONB NOT NULL,
  filters JSONB DEFAULT '{}',
  grouping JSONB DEFAULT '{}',
  
  -- Dados calculados
  total_transactions INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  successful_transactions INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  refunded_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  generated_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  
  -- Agendamento
  is_scheduled BOOLEAN DEFAULT false,
  schedule_config JSONB DEFAULT '{}',
  next_run_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 8. Configurações de Checkout
CREATE TABLE IF NOT EXISTS payment_checkout_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES payment_integrations(id) ON DELETE CASCADE,
  
  -- Configurações visuais
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#007bff',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  
  -- Configurações de comportamento
  collect_billing_address BOOLEAN DEFAULT true,
  collect_shipping_address BOOLEAN DEFAULT false,
  allow_promotion_codes BOOLEAN DEFAULT true,
  
  -- Configurações de pagamento
  accepted_payment_methods TEXT[] DEFAULT ARRAY['card', 'pix', 'boleto'],
  default_currency VARCHAR(3) DEFAULT 'BRL',
  
  -- URLs de redirecionamento
  success_url TEXT NOT NULL,
  cancel_url TEXT NOT NULL,
  
  -- Configurações avançadas
  session_timeout_minutes INTEGER DEFAULT 30,
  metadata JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(agency_id, name)
);

-- Indexes para performance
CREATE INDEX idx_payment_integrations_agency_platform ON payment_integrations(agency_id, platform);
CREATE INDEX idx_payment_products_agency_active ON payment_products(agency_id, is_active);
CREATE INDEX idx_payments_agency_status ON payments(agency_id, status);
CREATE INDEX idx_payments_external_platform ON payments(external_id, platform);
CREATE INDEX idx_subscriptions_agency_status ON subscriptions(agency_id, status);
CREATE INDEX idx_payment_webhook_events_processed ON payment_webhook_events(processed, created_at);
CREATE INDEX idx_payment_transaction_logs_payment_created ON payment_transaction_logs(payment_id, created_at);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_integrations_updated_at BEFORE UPDATE ON payment_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_products_updated_at BEFORE UPDATE ON payment_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_reports_updated_at BEFORE UPDATE ON payment_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_checkout_configs_updated_at BEFORE UPDATE ON payment_checkout_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE payment_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_checkout_configs ENABLE ROW LEVEL SECURITY;

-- Policies para payment_integrations
CREATE POLICY "Usuários podem ver integrações de pagamento de sua agência" ON payment_integrations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap
    WHERE uap.user_id = auth.uid() AND uap.agency_id = payment_integrations.agency_id
  )
);

CREATE POLICY "Usuários podem inserir integrações de pagamento em sua agência" ON payment_integrations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap
    WHERE uap.user_id = auth.uid() AND uap.agency_id = payment_integrations.agency_id
    AND (uap.role = 'admin' OR uap.permissions->>'manage_payments' = 'true')
  )
);

CREATE POLICY "Usuários podem atualizar integrações de pagamento de sua agência" ON payment_integrations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap
    WHERE uap.user_id = auth.uid() AND uap.agency_id = payment_integrations.agency_id
    AND (uap.role = 'admin' OR uap.permissions->>'manage_payments' = 'true')
  )
);

-- Policies similares para outras tabelas
CREATE POLICY "Usuários podem ver produtos de pagamento de sua agência" ON payment_products FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap
    WHERE uap.user_id = auth.uid() AND uap.agency_id = payment_products.agency_id
  )
);

CREATE POLICY "Usuários podem ver pagamentos de sua agência" ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap
    WHERE uap.user_id = auth.uid() AND uap.agency_id = payments.agency_id
  )
);

CREATE POLICY "Usuários podem ver assinaturas de sua agência" ON subscriptions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap
    WHERE uap.user_id = auth.uid() AND uap.agency_id = subscriptions.agency_id
  )
);

-- Views para relatórios
CREATE VIEW payment_integration_stats AS
SELECT 
  pi.id,
  pi.agency_id,
  pi.platform,
  pi.name,
  COUNT(p.id) as total_payments,
  SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END) as total_revenue,
  COUNT(CASE WHEN p.status = 'succeeded' THEN 1 END) as successful_payments,
  COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_payments,
  AVG(CASE WHEN p.status = 'succeeded' THEN p.amount END) as avg_payment_amount
FROM payment_integrations pi
LEFT JOIN payments p ON p.integration_id = pi.id
GROUP BY pi.id, pi.agency_id, pi.platform, pi.name;

-- Comentários nas tabelas
COMMENT ON TABLE payment_integrations IS 'Configurações de integração com plataformas de pagamento';
COMMENT ON TABLE payment_products IS 'Produtos e serviços disponíveis para venda';
COMMENT ON TABLE payments IS 'Registro de todos os pagamentos processados';
COMMENT ON TABLE subscriptions IS 'Assinaturas recorrentes';
COMMENT ON TABLE payment_webhook_events IS 'Eventos recebidos via webhook das plataformas';
COMMENT ON TABLE payment_transaction_logs IS 'Log detalhado de todas as transações';
COMMENT ON TABLE payment_reports IS 'Relatórios de análise de pagamentos';
COMMENT ON TABLE payment_checkout_configs IS 'Configurações personalizadas de checkout';