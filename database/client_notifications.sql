-- ==================================================
-- FVStudios Dashboard - Client Notifications Database Schema
-- Sistema de notificações WhatsApp para clientes
-- ==================================================

-- 1. Tabela de notificações para clientes
CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'project_update', 'payment_reminder', 'report', 'meeting', 
    'delivery', 'feedback_request', 'project_started', 'stage_started',
    'stage_completed', 'project_completed', 'deadline_approaching'
  )),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  whatsapp_phone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  template_used VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_client_notifications_client ON client_notifications(client_id),
  INDEX idx_client_notifications_project ON client_notifications(project_id),
  INDEX idx_client_notifications_agency ON client_notifications(agency_id),
  INDEX idx_client_notifications_status ON client_notifications(status),
  INDEX idx_client_notifications_type ON client_notifications(notification_type),
  INDEX idx_client_notifications_scheduled ON client_notifications(scheduled_at),
  INDEX idx_client_notifications_priority ON client_notifications(priority)
);

-- 2. Tabela de eventos de projeto
CREATE TABLE IF NOT EXISTS project_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'project_created', 'stage_changed', 'task_completed', 'payment_due',
    'deadline_approaching', 'feedback_required', 'project_completed',
    'project_paused', 'project_resumed', 'team_assigned', 'budget_updated'
  )),
  event_data JSONB NOT NULL DEFAULT '{}',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notifications_sent TEXT[] DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Índices para performance
  INDEX idx_project_events_project ON project_events(project_id),
  INDEX idx_project_events_client ON project_events(client_id),
  INDEX idx_project_events_agency ON project_events(agency_id),
  INDEX idx_project_events_type ON project_events(event_type),
  INDEX idx_project_events_triggered ON project_events(triggered_at),
  INDEX idx_project_events_processed ON project_events(processed)
);

-- 3. Tabela de notificações agendadas
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  notification_data JSONB NOT NULL DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para performance
  INDEX idx_scheduled_notifications_project ON scheduled_notifications(project_id),
  INDEX idx_scheduled_notifications_client ON scheduled_notifications(client_id),
  INDEX idx_scheduled_notifications_agency ON scheduled_notifications(agency_id),
  INDEX idx_scheduled_notifications_scheduled ON scheduled_notifications(scheduled_at),
  INDEX idx_scheduled_notifications_status ON scheduled_notifications(status)
);

-- 4. Tabela de templates de notificação personalizados
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- variáveis disponíveis no template
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices
  UNIQUE (agency_id, template_name),
  INDEX idx_notification_templates_agency ON notification_templates(agency_id),
  INDEX idx_notification_templates_type ON notification_templates(notification_type),
  INDEX idx_notification_templates_active ON notification_templates(is_active)
);

-- 5. Tabela de configurações de notificação por cliente
CREATE TABLE IF NOT EXISTS client_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notification_types JSONB DEFAULT '{}', -- tipos de notificação habilitados
  quiet_hours JSONB DEFAULT '{"start": "22:00", "end": "08:00"}',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  language VARCHAR(10) DEFAULT 'pt_BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices
  UNIQUE (client_id, agency_id),
  INDEX idx_client_preferences_client ON client_notification_preferences(client_id),
  INDEX idx_client_preferences_agency ON client_notification_preferences(agency_id)
);

-- 6. Tabela de logs de entrega de notificações
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES client_notifications(id) ON DELETE CASCADE,
  delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('whatsapp', 'email', 'sms', 'push')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'bounced')),
  provider_response JSONB DEFAULT '{}',
  delivery_time_ms INTEGER,
  cost_cents INTEGER DEFAULT 0,
  error_code VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices
  INDEX idx_delivery_logs_notification ON notification_delivery_logs(notification_id),
  INDEX idx_delivery_logs_method ON notification_delivery_logs(delivery_method),
  INDEX idx_delivery_logs_status ON notification_delivery_logs(status),
  INDEX idx_delivery_logs_created ON notification_delivery_logs(created_at)
);

-- 7. Função para processar eventos automaticamente
CREATE OR REPLACE FUNCTION process_project_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar evento como não processado para processamento em background
  NEW.processed = FALSE;
  
  -- Se for um evento crítico, disparar notificação imediata
  IF NEW.event_type IN ('payment_due', 'deadline_approaching', 'project_completed') THEN
    -- Aqui seria chamada a função de processamento imediato
    -- Por enquanto, apenas logamos
    INSERT INTO notification_delivery_logs (
      notification_id,
      delivery_method,
      status,
      provider_response,
      created_at
    ) VALUES (
      gen_random_uuid(),
      'system',
      'sent',
      jsonb_build_object('event_type', NEW.event_type, 'auto_processed', true),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar eventos automaticamente
CREATE TRIGGER trigger_process_project_event
  AFTER INSERT ON project_events
  FOR EACH ROW
  EXECUTE FUNCTION process_project_event();

-- 8. Função para atualizar estatísticas de uso de templates
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_used IS NOT NULL THEN
    UPDATE notification_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE template_name = NEW.template_used;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar uso de templates
CREATE TRIGGER trigger_update_template_usage
  AFTER UPDATE OF status ON client_notifications
  FOR EACH ROW
  WHEN (NEW.status = 'sent' AND OLD.status != 'sent')
  EXECUTE FUNCTION update_template_usage();

-- 9. Função para limpar notificações antigas
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Arquivar notificações antigas (mais de 6 meses)
  UPDATE client_notifications 
  SET metadata = jsonb_set(metadata, '{archived}', 'true'::jsonb)
  WHERE created_at < NOW() - INTERVAL '6 months'
    AND status IN ('sent', 'delivered', 'read', 'failed');
    
  -- Limpar logs de entrega antigos (mais de 1 ano)
  DELETE FROM notification_delivery_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Limpar eventos processados antigos (mais de 3 meses)
  DELETE FROM project_events
  WHERE triggered_at < NOW() - INTERVAL '3 months'
    AND processed = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 10. Views para relatórios
CREATE OR REPLACE VIEW notification_performance AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  agency_id,
  notification_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN status IN ('sent', 'delivered', 'read') THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as success_rate
FROM client_notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), agency_id, notification_type
ORDER BY date DESC;

CREATE OR REPLACE VIEW client_engagement AS
SELECT 
  c.id as client_id,
  c.name as client_name,
  c.agency_id,
  COUNT(cn.id) as total_notifications,
  COUNT(CASE WHEN cn.status = 'read' THEN 1 END) as notifications_read,
  COUNT(CASE WHEN cn.status = 'delivered' THEN 1 END) as notifications_delivered,
  ROUND(
    COUNT(CASE WHEN cn.status = 'read' THEN 1 END)::numeric / 
    NULLIF(COUNT(CASE WHEN cn.status IN ('sent', 'delivered', 'read') THEN 1 END), 0) * 100, 2
  ) as read_rate,
  MAX(cn.read_at) as last_read_at,
  MAX(cn.sent_at) as last_notification_at
FROM clients c
LEFT JOIN client_notifications cn ON c.id = cn.client_id
WHERE cn.created_at >= NOW() - INTERVAL '30 days' OR cn.created_at IS NULL
GROUP BY c.id, c.name, c.agency_id;

-- 11. RLS (Row Level Security)
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY client_notifications_policy ON client_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = client_notifications.agency_id
    )
  );

CREATE POLICY project_events_policy ON project_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = project_events.agency_id
    )
  );

CREATE POLICY scheduled_notifications_policy ON scheduled_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = scheduled_notifications.agency_id
    )
  );

CREATE POLICY notification_templates_policy ON notification_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = notification_templates.agency_id
    )
  );

CREATE POLICY client_preferences_policy ON client_notification_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.agency_id = client_notification_preferences.agency_id
    )
  );

CREATE POLICY delivery_logs_policy ON notification_delivery_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM client_notifications cn
      JOIN profiles p ON p.agency_id = cn.agency_id
      WHERE p.id = auth.uid() 
      AND cn.id = notification_delivery_logs.notification_id
    )
  );

-- 12. Inserir templates padrão
INSERT INTO notification_templates (agency_id, template_name, notification_type, title_template, message_template, variables, is_default) 
SELECT 
  a.id,
  'project_started_default',
  'project_started',
  '🚀 Projeto {{project_name}} Iniciado!',
  'Olá {{client_name}}! 👋

Seu projeto {{project_name}} foi oficialmente iniciado!

📋 Detalhes:
• Tipo: {{project_type}}
• Prazo estimado: {{estimated_duration}} dias
• Próxima etapa: {{next_stage}}

👥 Sua equipe:
{{team_members}}

📱 Próximos Passos:
{{next_actions}}

Vamos criar algo incrível juntos! 🚀

_Equipe {{agency_name}}_',
  '{"client_name": "Nome do cliente", "project_name": "Nome do projeto", "project_type": "Tipo do projeto", "estimated_duration": "Duração estimada", "next_stage": "Próxima etapa", "team_members": "Membros da equipe", "next_actions": "Próximas ações", "agency_name": "Nome da agência"}',
  true
FROM agencies a
ON CONFLICT (agency_id, template_name) DO NOTHING;

-- 13. Função para agendar cron job de limpeza
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * 0', 'SELECT cleanup_old_notifications();');

-- 14. Comentários para documentação
COMMENT ON TABLE client_notifications IS 'Notificações enviadas para clientes via WhatsApp, email, etc.';
COMMENT ON TABLE project_events IS 'Eventos de projeto que podem disparar notificações automáticas';
COMMENT ON TABLE scheduled_notifications IS 'Notificações agendadas para envio futuro';
COMMENT ON TABLE notification_templates IS 'Templates personalizáveis de notificação por agência';
COMMENT ON TABLE client_notification_preferences IS 'Preferências de notificação de cada cliente';
COMMENT ON TABLE notification_delivery_logs IS 'Logs detalhados de entrega de notificações';
COMMENT ON VIEW notification_performance IS 'Performance de entrega de notificações por dia e tipo';
COMMENT ON VIEW client_engagement IS 'Métricas de engajamento dos clientes com notificações';