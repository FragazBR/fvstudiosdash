-- ==================================================
-- FVStudios Dashboard - Credits System Database Schema
-- Sistema completo de créditos e billing
-- ==================================================

-- 1. Tabela de créditos dos usuários
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise')),
  current_credits INTEGER NOT NULL DEFAULT 0,
  monthly_free_credits INTEGER NOT NULL DEFAULT 0,
  total_purchased_credits INTEGER NOT NULL DEFAULT 0,
  total_used_credits INTEGER NOT NULL DEFAULT 0,
  last_reset_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_reason TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  custom_quota INTEGER, -- Para casos especiais
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  UNIQUE (user_id),
  INDEX idx_user_credits_agency ON user_credits(agency_id),
  INDEX idx_user_credits_plan ON user_credits(plan_type),
  INDEX idx_user_credits_blocked ON user_credits(is_blocked)
);

-- 2. Tabela de transações de créditos
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'bonus', 'refund', 'monthly_reset')),
  credits_amount INTEGER NOT NULL, -- Positivo para adição, negativo para uso
  cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  service_used VARCHAR(50), -- Para transações de usage
  tokens_consumed INTEGER, -- Tokens da OpenAI consumidos
  payment_method VARCHAR(20), -- card, pix, boleto
  payment_id VARCHAR(100), -- ID do gateway de pagamento
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para relatórios e analytics
  INDEX idx_credit_transactions_user ON credit_transactions(user_id),
  INDEX idx_credit_transactions_agency ON credit_transactions(agency_id),
  INDEX idx_credit_transactions_type ON credit_transactions(transaction_type),
  INDEX idx_credit_transactions_date ON credit_transactions(created_at),
  INDEX idx_credit_transactions_service ON credit_transactions(service_used)
);

-- 3. Tabela de logs de uso da OpenAI
CREATE TABLE IF NOT EXISTS openai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL, -- content_generation, campaign_optimization, etc.
  model_used VARCHAR(30) NOT NULL, -- gpt-4, gpt-3.5-turbo, etc.
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  tier_used VARCHAR(20) NOT NULL DEFAULT 'company_paid', -- company_paid, user_api_key, premium_plan
  request_data JSONB DEFAULT '{}', -- Dados da requisição (prompt, parâmetros)
  response_data JSONB DEFAULT '{}', -- Dados da resposta
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para analytics e billing
  INDEX idx_openai_logs_user ON openai_usage_logs(user_id),
  INDEX idx_openai_logs_agency ON openai_usage_logs(agency_id),
  INDEX idx_openai_logs_service ON openai_usage_logs(service_type),
  INDEX idx_openai_logs_model ON openai_usage_logs(model_used),
  INDEX idx_openai_logs_date ON openai_usage_logs(created_at),
  INDEX idx_openai_logs_tier ON openai_usage_logs(tier_used)
);

-- 4. Tabela de configurações de API Keys (atualizar existente)
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS credits_limit INTEGER DEFAULT NULL;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS monthly_spend_limit DECIMAL(10,2) DEFAULT NULL;

-- 5. Função para incrementar quota de forma atômica
CREATE OR REPLACE FUNCTION increment_quota(user_id_param UUID, tokens_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_used_credits INTEGER;
BEGIN
  UPDATE user_credits 
  SET 
    used_this_month = used_this_month + tokens_param,
    total_used_credits = total_used_credits + tokens_param,
    updated_at = NOW()
  WHERE user_id = user_id_param
  RETURNING used_this_month INTO new_used_credits;
  
  RETURN new_used_credits;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para reset mensal automático
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  -- Reset credits for users whose last reset was in a different month
  UPDATE user_credits 
  SET 
    current_credits = current_credits + monthly_free_credits,
    last_reset_date = NOW(),
    updated_at = NOW()
  WHERE 
    EXTRACT(MONTH FROM last_reset_date) != EXTRACT(MONTH FROM NOW())
    OR EXTRACT(YEAR FROM last_reset_date) != EXTRACT(YEAR FROM NOW());
    
  -- Log the reset transactions
  INSERT INTO credit_transactions (
    user_id, 
    agency_id, 
    transaction_type, 
    credits_amount, 
    cost_usd, 
    description,
    created_at
  )
  SELECT 
    user_id,
    agency_id,
    'monthly_reset',
    monthly_free_credits,
    0,
    'Reset mensal de créditos gratuitos',
    NOW()
  FROM user_credits 
  WHERE monthly_free_credits > 0
    AND (
      EXTRACT(MONTH FROM last_reset_date) != EXTRACT(MONTH FROM NOW())
      OR EXTRACT(YEAR FROM last_reset_date) != EXTRACT(YEAR FROM NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. View para relatórios de billing
CREATE OR REPLACE VIEW billing_summary AS
SELECT 
  uc.agency_id,
  uc.plan_type,
  COUNT(*) as total_users,
  SUM(uc.current_credits) as total_current_credits,
  SUM(uc.total_purchased_credits) as total_purchased_credits,
  SUM(uc.total_used_credits) as total_used_credits,
  SUM(ct.cost_usd) FILTER (WHERE ct.transaction_type = 'purchase') as total_revenue,
  SUM(ct.cost_usd) FILTER (WHERE ct.tier_used = 'company_paid') as company_sponsored_cost,
  AVG(uc.current_credits) as avg_credits_per_user
FROM user_credits uc
LEFT JOIN credit_transactions ct ON uc.user_id = ct.user_id
GROUP BY uc.agency_id, uc.plan_type;

-- 9. View para usage analytics
CREATE OR REPLACE VIEW usage_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as usage_date,
  agency_id,
  service_type,
  model_used,
  COUNT(*) as total_requests,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost,
  AVG(total_tokens) as avg_tokens_per_request,
  AVG(execution_time_ms) as avg_execution_time
FROM openai_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), agency_id, service_type, model_used
ORDER BY usage_date DESC;

-- 10. RLS (Row Level Security) para segurança
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE openai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Política para user_credits
CREATE POLICY user_credits_policy ON user_credits
  FOR ALL
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = user_credits.agency_id
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Política para credit_transactions
CREATE POLICY credit_transactions_policy ON credit_transactions
  FOR ALL
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = credit_transactions.agency_id
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Política para openai_usage_logs
CREATE POLICY openai_usage_logs_policy ON openai_usage_logs
  FOR ALL
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = openai_usage_logs.agency_id
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- 11. Cron job para reset mensal (executar mensalmente)
-- Esta função deve ser chamada via cron job ou similar
-- SELECT cron.schedule('monthly-credits-reset', '0 0 1 * *', 'SELECT reset_monthly_credits();');

-- 12. Inserir dados iniciais para agências existentes
INSERT INTO user_credits (user_id, agency_id, plan_type, current_credits, monthly_free_credits)
SELECT 
  p.id as user_id,
  p.agency_id,
  CASE 
    WHEN p.role IN ('owner', 'admin') THEN 'basic'
    ELSE 'free'
  END as plan_type,
  CASE 
    WHEN p.role IN ('owner', 'admin') THEN 5000
    ELSE 1000
  END as current_credits,
  CASE 
    WHEN p.role IN ('owner', 'admin') THEN 5000
    ELSE 1000
  END as monthly_free_credits
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_credits uc WHERE uc.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 13. Comentários para documentação
COMMENT ON TABLE user_credits IS 'Armazena os créditos e configurações de billing de cada usuário';
COMMENT ON TABLE credit_transactions IS 'Log de todas as transações de créditos (compras, usos, bônus, etc.)';
COMMENT ON TABLE openai_usage_logs IS 'Log detalhado de uso da OpenAI API para billing e analytics';
COMMENT ON FUNCTION increment_quota IS 'Incrementa o uso de quota de forma atômica e thread-safe';
COMMENT ON FUNCTION reset_monthly_credits IS 'Reseta os créditos mensais gratuitos no início de cada mês';
COMMENT ON VIEW billing_summary IS 'Resumo de billing por agência e plano para dashboards';
COMMENT ON VIEW usage_analytics IS 'Analytics de uso dos serviços IA para relatórios';