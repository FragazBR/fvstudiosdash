-- Adicionar campo plan_id à tabela user_invitations
-- para suportar seleção de plano durante criação de convite

-- Adicionar coluna plan_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_invitations' 
    AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE user_invitations 
    ADD COLUMN plan_id UUID REFERENCES plan_limits(id) ON DELETE SET NULL;
    
    COMMENT ON COLUMN user_invitations.plan_id IS 'Plano selecionado para o usuário convidado';
  END IF;
END $$;

-- Adicionar coluna interval_type à tabela user_subscriptions se não existir
-- (necessária para compatibilidade com o sistema de planos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'interval_type'
  ) THEN
    -- Primeiro criar o tipo ENUM se não existir
    DO $enum$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_interval') THEN
        CREATE TYPE plan_interval AS ENUM ('monthly', 'quarterly', 'yearly');
      END IF;
    END $enum$;
    
    ALTER TABLE user_subscriptions 
    ADD COLUMN interval_type plan_interval DEFAULT 'monthly';
    
    COMMENT ON COLUMN user_subscriptions.interval_type IS 'Intervalo de cobrança da assinatura';
  END IF;
END $$;

-- Verificar se a tabela user_subscriptions existe, senão criar estrutura básica
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plan_limits(id) ON DELETE RESTRICT,
  interval_type plan_interval DEFAULT 'monthly',
  price_paid DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'BRL',
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE user_subscriptions IS 'Assinaturas ativas dos usuários/agências';
COMMENT ON COLUMN user_subscriptions.plan_id IS 'Referência ao plano contratado';
COMMENT ON COLUMN user_subscriptions.status IS 'Status da assinatura: active, canceled, expired, suspended';

-- RLS se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_subscriptions' 
    AND policyname = 'Users can view own subscriptions'
  ) THEN
    ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (
      user_id = auth.uid() OR 
      agency_id IN (
        SELECT agency_id FROM user_agency_permissions 
        WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM user_agency_permissions 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_plan ON user_subscriptions(user_id, plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_agency_status ON user_subscriptions(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_plan_id ON user_invitations(plan_id);

SELECT 'Tabela user_invitations atualizada com campo plan_id' as status;