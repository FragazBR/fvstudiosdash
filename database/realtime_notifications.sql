-- ==================================================
-- FVStudios Dashboard - Real-time Notifications Database Schema
-- Sistema de notificações em tempo real
-- ==================================================

-- Tabela principal de notificações em tempo real
CREATE TABLE IF NOT EXISTS realtime_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = notificação para toda agência
  
  -- Conteúdo da notificação
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'project_update', 'task_completed', 'payment_received', 'client_message', 
    'system_alert', 'whatsapp_status', 'ai_credits_low', 'deadline_approaching', 
    'new_client', 'team_mention', 'file_uploaded', 'approval_needed'
  )),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Dados extras contextuais
  
  -- Configurações
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Data de expiração (opcional)
  
  -- Ação opcional
  action_url TEXT, -- URL para ação relacionada
  action_label VARCHAR(50), -- Texto do botão de ação
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_agency_id ON realtime_notifications(agency_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_user_id ON realtime_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_read ON realtime_notifications(read);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_type ON realtime_notifications(type);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_priority ON realtime_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_created_at ON realtime_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_expires_at ON realtime_notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_agency_unread 
ON realtime_notifications(agency_id, read, created_at DESC) 
WHERE read = FALSE;

-- Tabela de preferências de notificação por usuário
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Canais de notificação
  browser_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Tipos de notificação
  notification_types JSONB NOT NULL DEFAULT '[]', -- Array de tipos habilitados
  
  -- Configurações de horário
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start TIME, -- Ex: 22:00
  quiet_hours_end TIME,   -- Ex: 08:00
  
  -- Frequência
  digest_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- Resumo diário/semanal
  digest_frequency VARCHAR(10) CHECK (digest_frequency IN ('daily', 'weekly')) DEFAULT 'daily',
  digest_time TIME DEFAULT '09:00',
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, agency_id)
);

-- Índices para preferências
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_agency_id ON notification_preferences(agency_id);

-- Tabela de templates de notificação (para notificações automáticas)
CREATE TABLE IF NOT EXISTS notification_templates_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Configuração do template
  trigger_type VARCHAR(50) NOT NULL, -- Ex: 'project_created', 'task_overdue'
  notification_type VARCHAR(50) NOT NULL, -- Tipo da notificação final
  
  -- Template da mensagem
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Configurações
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  target_users JSONB DEFAULT '[]', -- Array de user_ids ou 'all' para toda agência
  conditions JSONB DEFAULT '{}', -- Condições para disparo
  
  -- Ação opcional
  action_url_template TEXT,
  action_label VARCHAR(50),
  
  -- Metadados
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_realtime_agency_id ON notification_templates_realtime(agency_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_realtime_trigger_type ON notification_templates_realtime(trigger_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_realtime_active ON notification_templates_realtime(is_active);

-- Tabela de logs de notificações (para auditoria e debugging)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES realtime_notifications(id) ON DELETE CASCADE,
  
  -- Log da ação
  action VARCHAR(50) NOT NULL, -- 'created', 'sent', 'read', 'expired', 'failed'
  channel VARCHAR(20), -- 'browser', 'email', 'whatsapp'
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'pending'
  
  -- Detalhes
  details JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_agency_id ON notification_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_action ON notification_logs(action);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates_realtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para realtime_notifications
CREATE POLICY "Usuários podem ver notificações da sua agência"
ON realtime_notifications FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM user_profiles WHERE id = auth.uid()
  )
  AND (
    user_id IS NULL OR user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar suas notificações"
ON realtime_notifications FOR UPDATE
USING (
  agency_id IN (
    SELECT agency_id FROM user_profiles WHERE id = auth.uid()
  )
  AND (
    user_id IS NULL OR user_id = auth.uid()
  )
);

CREATE POLICY "Sistema pode inserir notificações"
ON realtime_notifications FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT agency_id FROM user_profiles WHERE id = auth.uid()
  )
);

-- Políticas RLS para notification_preferences
CREATE POLICY "Usuários podem gerenciar suas preferências"
ON notification_preferences FOR ALL
USING (user_id = auth.uid());

-- Políticas RLS para notification_templates_realtime
CREATE POLICY "Usuários da agência podem ver templates"
ON notification_templates_realtime FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM user_profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Gerentes podem gerenciar templates"
ON notification_templates_realtime FOR ALL
USING (
  agency_id IN (
    SELECT agency_id FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'agency_owner', 'agency_manager')
  )
);

-- Políticas RLS para notification_logs
CREATE POLICY "Usuários da agência podem ver logs"
ON notification_logs FOR SELECT
USING (
  agency_id IN (
    SELECT agency_id FROM user_profiles WHERE id = auth.uid()
  )
);

-- Função para limpar notificações expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM realtime_notifications
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND read = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificação automática
CREATE OR REPLACE FUNCTION create_auto_notification(
  p_agency_id UUID,
  p_trigger_type VARCHAR,
  p_trigger_data JSONB DEFAULT '{}'
)
RETURNS void AS $$
DECLARE
  template_record RECORD;
  processed_title TEXT;
  processed_message TEXT;
  processed_action_url TEXT;
  target_user UUID;
BEGIN
  -- Buscar templates ativos para este trigger
  FOR template_record IN
    SELECT * FROM notification_templates_realtime
    WHERE agency_id = p_agency_id
      AND trigger_type = p_trigger_type
      AND is_active = TRUE
  LOOP
    -- Processar templates (substituir variáveis)
    processed_title := template_record.title_template;
    processed_message := template_record.message_template;
    processed_action_url := template_record.action_url_template;
    
    -- Aqui seria implementada a lógica de substituição de variáveis
    -- Por exemplo: {project_name}, {client_name}, etc.
    
    -- Determinar usuários alvo
    IF template_record.target_users::text = '["all"]' THEN
      -- Enviar para todos os usuários da agência
      FOR target_user IN
        SELECT id FROM user_profiles WHERE agency_id = p_agency_id
      LOOP
        INSERT INTO realtime_notifications (
          agency_id,
          user_id,
          type,
          title,
          message,
          data,
          priority,
          action_url,
          action_label
        ) VALUES (
          p_agency_id,
          target_user,
          template_record.notification_type,
          processed_title,
          processed_message,
          p_trigger_data,
          template_record.priority,
          processed_action_url,
          template_record.action_label
        );
      END LOOP;
    ELSE
      -- Enviar para usuários específicos
      INSERT INTO realtime_notifications (
        agency_id,
        user_id,
        type,
        title,
        message,
        data,
        priority,
        action_url,
        action_label
      ) VALUES (
        p_agency_id,
        NULL, -- Para toda agência se não especificado
        template_record.notification_type,
        processed_title,
        processed_message,
        p_trigger_data,
        template_record.priority,
        processed_action_url,
        template_record.action_label
      );
    END IF;
    
    -- Incrementar contador de uso
    UPDATE notification_templates_realtime
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_realtime_notifications_updated_at
  BEFORE UPDATE ON realtime_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_realtime_updated_at
  BEFORE UPDATE ON notification_templates_realtime
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para logging automático
CREATE OR REPLACE FUNCTION log_notification_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notification_logs (agency_id, notification_id, action, status, details)
    VALUES (NEW.agency_id, NEW.id, 'created', 'success', row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log quando notificação é marcada como lida
    IF OLD.read = FALSE AND NEW.read = TRUE THEN
      INSERT INTO notification_logs (agency_id, notification_id, action, status, details)
      VALUES (NEW.agency_id, NEW.id, 'read', 'success', 
              json_build_object('read_at', NEW.read_at, 'user_id', NEW.user_id));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_realtime_notifications_changes
  AFTER INSERT OR UPDATE ON realtime_notifications
  FOR EACH ROW EXECUTE FUNCTION log_notification_changes();

-- Comentários para documentação
COMMENT ON TABLE realtime_notifications IS 'Notificações em tempo real para usuários e agências';
COMMENT ON TABLE notification_preferences IS 'Preferências de notificação por usuário';
COMMENT ON TABLE notification_templates_realtime IS 'Templates para notificações automáticas';
COMMENT ON TABLE notification_logs IS 'Logs de auditoria das notificações';

COMMENT ON COLUMN realtime_notifications.type IS 'Tipo da notificação (project_update, task_completed, etc.)';
COMMENT ON COLUMN realtime_notifications.priority IS 'Prioridade: low, medium, high, urgent';
COMMENT ON COLUMN realtime_notifications.data IS 'Dados contextuais em JSON';
COMMENT ON COLUMN realtime_notifications.expires_at IS 'Data de expiração da notificação';

-- Inserir algumas preferências padrão (executar uma vez por instalação)
INSERT INTO notification_templates_realtime (
  agency_id,
  trigger_type,
  notification_type,
  title_template,
  message_template,
  priority,
  target_users,
  action_label,
  created_by
) 
SELECT 
  id as agency_id,
  'project_created' as trigger_type,
  'project_update' as notification_type,
  '🚀 Novo Projeto Criado' as title_template,
  'O projeto "{project_name}" foi criado e atribuído à sua equipe.' as message_template,
  'medium' as priority,
  '["all"]'::jsonb as target_users,
  'Ver Projeto' as action_label,
  null as created_by
FROM agencies
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates_realtime 
  WHERE trigger_type = 'project_created' 
  AND agency_id = agencies.id
);

-- Função para estatísticas de notificações
CREATE OR REPLACE FUNCTION get_notification_stats(p_agency_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  total_count BIGINT,
  unread_count BIGINT,
  read_rate NUMERIC,
  by_type JSON,
  by_priority JSON,
  daily_counts JSON
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE read = FALSE) as unread,
      type,
      priority,
      DATE(created_at) as notification_date
    FROM realtime_notifications
    WHERE agency_id = p_agency_id
      AND created_at >= NOW() - INTERVAL '%s days'
    GROUP BY type, priority, DATE(created_at)
  ),
  totals AS (
    SELECT 
      SUM(total) as total_notifications,
      SUM(unread) as unread_notifications
    FROM stats
  )
  SELECT 
    COALESCE(t.total_notifications, 0)::BIGINT,
    COALESCE(t.unread_notifications, 0)::BIGINT,
    CASE 
      WHEN t.total_notifications > 0 
      THEN ROUND(((t.total_notifications - t.unread_notifications)::NUMERIC / t.total_notifications) * 100, 2)
      ELSE 0 
    END,
    COALESCE(
      (SELECT json_object_agg(type, type_count) 
       FROM (SELECT type, SUM(total) as type_count FROM stats GROUP BY type) type_stats),
      '{}'::json
    ),
    COALESCE(
      (SELECT json_object_agg(priority, priority_count) 
       FROM (SELECT priority, SUM(total) as priority_count FROM stats GROUP BY priority) priority_stats),
      '{}'::json
    ),
    COALESCE(
      (SELECT json_object_agg(notification_date, daily_total) 
       FROM (SELECT notification_date, SUM(total) as daily_total FROM stats GROUP BY notification_date ORDER BY notification_date) daily_stats),
      '{}'::json
    )
  FROM totals t;
END;
$$ LANGUAGE plpgsql;