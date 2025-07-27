-- ==================================================
-- FVStudios Dashboard - WhatsApp System Database Schema
-- Sistema completo de automação de briefings via WhatsApp
-- ==================================================

-- 1. Tabela de conversas WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  contact_name VARCHAR(100),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  conversation_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (conversation_type IN ('briefing', 'support', 'sales', 'general')),
  briefing_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_whatsapp_conversations_agency ON whatsapp_conversations(agency_id),
  INDEX idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number),
  INDEX idx_whatsapp_conversations_status ON whatsapp_conversations(status),
  INDEX idx_whatsapp_conversations_type ON whatsapp_conversations(conversation_type),
  INDEX idx_whatsapp_conversations_last_message ON whatsapp_conversations(last_message_at)
);

-- 2. Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id VARCHAR(100) PRIMARY KEY, -- ID do WhatsApp
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'template', 'interactive', 'image', 'document', 'button')),
  content TEXT NOT NULL,
  template_name VARCHAR(100),
  template_params JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  direction VARCHAR(10) NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id),
  INDEX idx_whatsapp_messages_agency ON whatsapp_messages(agency_id),
  INDEX idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp),
  INDEX idx_whatsapp_messages_status ON whatsapp_messages(status),
  INDEX idx_whatsapp_messages_direction ON whatsapp_messages(direction),
  INDEX idx_whatsapp_messages_from ON whatsapp_messages(from_number),
  INDEX idx_whatsapp_messages_to ON whatsapp_messages(to_number)
);

-- 3. Tabela de templates WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('briefing', 'follow_up', 'proposal', 'support', 'marketing', 'general')),
  language VARCHAR(10) NOT NULL DEFAULT 'pt_BR',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED')),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  components JSONB NOT NULL DEFAULT '[]',
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  UNIQUE (name, agency_id),
  INDEX idx_whatsapp_templates_agency ON whatsapp_templates(agency_id),
  INDEX idx_whatsapp_templates_category ON whatsapp_templates(category),
  INDEX idx_whatsapp_templates_status ON whatsapp_templates(status)
);

-- 4. Tabela de análises de briefing
CREATE TABLE IF NOT EXISTS briefing_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  analysis_content TEXT NOT NULL,
  analysis_data JSONB DEFAULT '{}',
  generated_by VARCHAR(20) NOT NULL DEFAULT 'ai' CHECK (generated_by IN ('ai', 'human', 'hybrid')),
  model_used VARCHAR(50),
  tokens_used INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2) DEFAULT 0.85,
  status VARCHAR(20) NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'approved', 'sent_to_client')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_briefing_analyses_conversation ON briefing_analyses(conversation_id),
  INDEX idx_briefing_analyses_status ON briefing_analyses(status),
  INDEX idx_briefing_analyses_generated_by ON briefing_analyses(generated_by),
  INDEX idx_briefing_analyses_created ON briefing_analyses(created_at)
);

-- 5. Tabela de contacts WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  contact_info JSONB DEFAULT '{}', -- email, empresa, cargo, etc.
  tags TEXT[] DEFAULT '{}',
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  opt_in_status BOOLEAN NOT NULL DEFAULT TRUE,
  opt_in_date TIMESTAMPTZ,
  opt_out_date TIMESTAMPTZ,
  first_contact_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  UNIQUE (phone_number, agency_id),
  INDEX idx_whatsapp_contacts_agency ON whatsapp_contacts(agency_id),
  INDEX idx_whatsapp_contacts_phone ON whatsapp_contacts(phone_number),
  INDEX idx_whatsapp_contacts_blocked ON whatsapp_contacts(is_blocked),
  INDEX idx_whatsapp_contacts_opt_in ON whatsapp_contacts(opt_in_status),
  INDEX idx_whatsapp_contacts_last_contact ON whatsapp_contacts(last_contact_at)
);

-- 6. Tabela de campanhas de broadcast
CREATE TABLE IF NOT EXISTS whatsapp_broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  target_audience JSONB DEFAULT '{}', -- filtros de segmentação
  message_content TEXT NOT NULL,
  template_params JSONB DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_whatsapp_broadcasts_agency ON whatsapp_broadcasts(agency_id),
  INDEX idx_whatsapp_broadcasts_status ON whatsapp_broadcasts(status),
  INDEX idx_whatsapp_broadcasts_scheduled ON whatsapp_broadcasts(scheduled_at),
  INDEX idx_whatsapp_broadcasts_created_by ON whatsapp_broadcasts(created_by)
);

-- 7. Função para atualizar last_message_at automaticamente
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations 
  SET 
    last_message_at = NEW.timestamp,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- 8. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefing_analyses_updated_at
  BEFORE UPDATE ON briefing_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Função para atualizar estatísticas de contato
CREATE OR REPLACE FUNCTION update_contact_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar ou criar contato
  INSERT INTO whatsapp_contacts (
    phone_number,
    agency_id,
    last_contact_at,
    total_messages
  )
  VALUES (
    NEW.from_number,
    NEW.agency_id,
    NEW.timestamp,
    1
  )
  ON CONFLICT (phone_number, agency_id) 
  DO UPDATE SET
    last_contact_at = NEW.timestamp,
    total_messages = whatsapp_contacts.total_messages + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_stats
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_stats();

-- 10. Views para relatórios
CREATE OR REPLACE VIEW whatsapp_conversation_summary AS
SELECT 
  wc.id,
  wc.phone_number,
  wc.contact_name,
  wc.agency_id,
  wc.status,
  wc.conversation_type,
  wc.created_at,
  wc.last_message_at,
  COUNT(wm.id) as total_messages,
  COUNT(CASE WHEN wm.direction = 'inbound' THEN 1 END) as inbound_messages,
  COUNT(CASE WHEN wm.direction = 'outbound' THEN 1 END) as outbound_messages,
  COUNT(CASE WHEN wm.status = 'read' THEN 1 END) as read_messages,
  wc.briefing_data->>'current_step' as current_step,
  wc.briefing_data->>'client_name' as client_name,
  wc.briefing_data->>'project_type' as project_type
FROM whatsapp_conversations wc
LEFT JOIN whatsapp_messages wm ON wc.id = wm.conversation_id
GROUP BY wc.id;

CREATE OR REPLACE VIEW whatsapp_daily_stats AS
SELECT 
  DATE_TRUNC('day', timestamp) as date,
  agency_id,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_messages,
  COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_messages,
  COUNT(DISTINCT conversation_id) as active_conversations,
  COUNT(DISTINCT from_number) as unique_contacts
FROM whatsapp_messages
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), agency_id
ORDER BY date DESC;

-- 11. RLS (Row Level Security)
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_conversations
CREATE POLICY whatsapp_conversations_policy ON whatsapp_conversations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = whatsapp_conversations.agency_id
    )
  );

-- Políticas RLS para whatsapp_messages
CREATE POLICY whatsapp_messages_policy ON whatsapp_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = whatsapp_messages.agency_id
    )
  );

-- Políticas RLS para whatsapp_templates
CREATE POLICY whatsapp_templates_policy ON whatsapp_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = whatsapp_templates.agency_id
    )
  );

-- Políticas RLS para briefing_analyses
CREATE POLICY briefing_analyses_policy ON briefing_analyses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations wc
      JOIN profiles p ON p.agency_id = wc.agency_id
      WHERE p.id = auth.uid() 
      AND wc.id = briefing_analyses.conversation_id
    )
  );

-- Políticas RLS para whatsapp_contacts
CREATE POLICY whatsapp_contacts_policy ON whatsapp_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = whatsapp_contacts.agency_id
    )
  );

-- Políticas RLS para whatsapp_broadcasts
CREATE POLICY whatsapp_broadcasts_policy ON whatsapp_broadcasts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = whatsapp_broadcasts.agency_id
    )
  );

-- 12. Inserir templates padrão de briefing
INSERT INTO whatsapp_templates (name, category, language, status, agency_id, components) 
SELECT 
  'briefing_welcome',
  'briefing',
  'pt_BR',
  'APPROVED',
  a.id,
  '[
    {
      "type": "BODY",
      "text": "Olá! 👋 Sou o assistente inteligente da *{{1}}*.\n\nVou te ajudar a criar um briefing completo para seu projeto. Em alguns minutos, teremos todas as informações necessárias!\n\nVamos começar? Digite *SIM* para iniciar."
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {"type": "QUICK_REPLY", "text": "✅ Vamos começar!", "payload": "START_BRIEFING"},
        {"type": "QUICK_REPLY", "text": "📞 Falar com humano", "payload": "HUMAN_SUPPORT"}
      ]
    }
  ]'::jsonb
FROM agencies a
ON CONFLICT (name, agency_id) DO NOTHING;

-- 13. Comentários para documentação
COMMENT ON TABLE whatsapp_conversations IS 'Armazena todas as conversas WhatsApp com dados de briefing';
COMMENT ON TABLE whatsapp_messages IS 'Log de todas as mensagens enviadas e recebidas via WhatsApp';
COMMENT ON TABLE whatsapp_templates IS 'Templates aprovados pelo WhatsApp para envio de mensagens';
COMMENT ON TABLE briefing_analyses IS 'Análises de briefing geradas por IA com base nas conversas';
COMMENT ON TABLE whatsapp_contacts IS 'Base de contatos WhatsApp com dados de engajamento';
COMMENT ON TABLE whatsapp_broadcasts IS 'Campanhas de broadcast em massa via WhatsApp';
COMMENT ON VIEW whatsapp_conversation_summary IS 'Resumo de conversas com estatísticas de mensagens';
COMMENT ON VIEW whatsapp_daily_stats IS 'Estatísticas diárias de uso do WhatsApp por agência';