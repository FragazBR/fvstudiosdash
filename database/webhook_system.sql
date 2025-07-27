-- ===================================================
-- FVStudios Dashboard - Sistema de Webhooks
-- Tabelas para gerenciar webhooks e eventos
-- ===================================================

BEGIN;

-- Tabela de configurações de webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'POST',
    headers JSONB DEFAULT '{}',
    secret_token VARCHAR(255),
    events TEXT[] NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    retry_attempts INTEGER NOT NULL DEFAULT 3,
    retry_delay_seconds INTEGER NOT NULL DEFAULT 60,
    timeout_seconds INTEGER NOT NULL DEFAULT 30,
    
    -- Filtros opcionais
    filters JSONB DEFAULT '{}',
    
    -- Estatísticas
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    last_triggered TIMESTAMPTZ,
    
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para métodos HTTP válidos
    CONSTRAINT valid_http_methods CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    
    -- Constraint para URL válida
    CONSTRAINT valid_url CHECK (url ~ '^https?://'),
    
    -- Constraint para retry attempts
    CONSTRAINT valid_retry_attempts CHECK (retry_attempts >= 0 AND retry_attempts <= 10),
    
    -- Constraint para timeout
    CONSTRAINT valid_timeout CHECK (timeout_seconds > 0 AND timeout_seconds <= 300)
);

-- Tabela de eventos de webhook (log de execuções)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    
    -- Status da execução
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    http_status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    
    -- Timing
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Retry information
    attempt_number INTEGER NOT NULL DEFAULT 1,
    next_retry_at TIMESTAMPTZ,
    
    -- Request details
    request_headers JSONB,
    request_body TEXT,
    
    -- Constraint para status válidos
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sending', 'success', 'failed', 'retrying'))
);

-- Tabela de tipos de eventos disponíveis
CREATE TABLE IF NOT EXISTS webhook_event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    payload_schema JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para categorias válidas
    CONSTRAINT valid_event_categories CHECK (category IN (
        'project', 'task', 'client', 'user', 'payment', 'notification', 'system'
    ))
);

-- Tabela de assinantes de eventos (para performance)
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_webhook_event UNIQUE (webhook_id, event_type)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhooks_agency_id ON webhooks(agency_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_triggered_at ON webhook_events(triggered_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_webhook_id ON webhook_subscriptions(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_event_type ON webhook_subscriptions(event_type);

-- RLS Policies
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy para webhooks
DROP POLICY IF EXISTS "Users can manage webhooks of their agency" ON webhooks;
CREATE POLICY "Users can manage webhooks of their agency" ON webhooks
    FOR ALL USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários da agência podem ver webhooks da sua agência
        (
            agency_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE id = auth.uid() 
                AND agency_id = webhooks.agency_id
                AND role IN ('agency_owner', 'agency_manager', 'agency_staff')
            )
        )
    );

-- Policy para webhook_events
DROP POLICY IF EXISTS "Users can view webhook events of their agency" ON webhook_events;
CREATE POLICY "Users can view webhook events of their agency" ON webhook_events
    FOR SELECT USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários podem ver eventos dos webhooks da sua agência
        EXISTS (
            SELECT 1 FROM webhooks w
            JOIN user_profiles up ON up.agency_id = w.agency_id
            WHERE w.id = webhook_events.webhook_id
            AND up.id = auth.uid()
            AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
        )
    );

-- Policy para webhook_event_types (público para leitura)
DROP POLICY IF EXISTS "Event types are readable by authenticated users" ON webhook_event_types;
CREATE POLICY "Event types are readable by authenticated users" ON webhook_event_types
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy para webhook_subscriptions
DROP POLICY IF EXISTS "Users can manage subscriptions of their webhooks" ON webhook_subscriptions;
CREATE POLICY "Users can manage subscriptions of their webhooks" ON webhook_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM webhooks w
            JOIN user_profiles up ON (up.agency_id = w.agency_id OR up.role = 'admin')
            WHERE w.id = webhook_subscriptions.webhook_id
            AND up.id = auth.uid()
            AND (up.role = 'admin' OR up.role IN ('agency_owner', 'agency_manager'))
        )
    );

-- Inserir tipos de eventos padrão
INSERT INTO webhook_event_types (name, description, category, payload_schema) VALUES
-- Eventos de projeto
('project.created', 'Projeto criado', 'project', '{
  "type": "object",
  "properties": {
    "project": {"type": "object"},
    "agency": {"type": "object"},
    "created_by": {"type": "object"}
  }
}'),
('project.updated', 'Projeto atualizado', 'project', '{
  "type": "object",
  "properties": {
    "project": {"type": "object"},
    "changes": {"type": "object"},
    "updated_by": {"type": "object"}
  }
}'),
('project.completed', 'Projeto concluído', 'project', '{
  "type": "object",
  "properties": {
    "project": {"type": "object"},
    "completion_date": {"type": "string"},
    "completed_by": {"type": "object"}
  }
}'),
('project.deleted', 'Projeto deletado', 'project', '{
  "type": "object",
  "properties": {
    "project_id": {"type": "string"},
    "project_name": {"type": "string"},
    "deleted_by": {"type": "object"}
  }
}'),

-- Eventos de tarefa
('task.created', 'Tarefa criada', 'task', '{
  "type": "object",
  "properties": {
    "task": {"type": "object"},
    "project": {"type": "object"},
    "created_by": {"type": "object"}
  }
}'),
('task.updated', 'Tarefa atualizada', 'task', '{
  "type": "object",
  "properties": {
    "task": {"type": "object"},
    "changes": {"type": "object"},
    "updated_by": {"type": "object"}
  }
}'),
('task.completed', 'Tarefa concluída', 'task', '{
  "type": "object",
  "properties": {
    "task": {"type": "object"},
    "completion_date": {"type": "string"},
    "completed_by": {"type": "object"}
  }
}'),

-- Eventos de cliente
('client.created', 'Cliente criado', 'client', '{
  "type": "object",
  "properties": {
    "client": {"type": "object"},
    "agency": {"type": "object"},
    "created_by": {"type": "object"}
  }
}'),
('client.updated', 'Cliente atualizado', 'client', '{
  "type": "object",
  "properties": {
    "client": {"type": "object"},
    "changes": {"type": "object"},
    "updated_by": {"type": "object"}
  }
}'),

-- Eventos de usuário
('user.created', 'Usuário criado', 'user', '{
  "type": "object",
  "properties": {
    "user": {"type": "object"},
    "agency": {"type": "object"},
    "created_by": {"type": "object"}
  }
}'),
('user.login', 'Usuário fez login', 'user', '{
  "type": "object",
  "properties": {
    "user": {"type": "object"},
    "login_time": {"type": "string"},
    "ip_address": {"type": "string"}
  }
}'),

-- Eventos de pagamento
('payment.received', 'Pagamento recebido', 'payment', '{
  "type": "object",
  "properties": {
    "payment": {"type": "object"},
    "client": {"type": "object"},
    "project": {"type": "object"}
  }
}'),
('payment.failed', 'Pagamento falhou', 'payment', '{
  "type": "object",
  "properties": {
    "payment": {"type": "object"},
    "error": {"type": "string"},
    "client": {"type": "object"}
  }
}'),

-- Eventos de notificação
('notification.sent', 'Notificação enviada', 'notification', '{
  "type": "object",
  "properties": {
    "notification": {"type": "object"},
    "recipient": {"type": "object"},
    "channel": {"type": "string"}
  }
}'),

-- Eventos de sistema
('system.backup_completed', 'Backup concluído', 'system', '{
  "type": "object",
  "properties": {
    "backup": {"type": "object"},
    "duration": {"type": "number"},
    "size": {"type": "number"}
  }
}'),
('system.alert_triggered', 'Alerta disparado', 'system', '{
  "type": "object",
  "properties": {
    "alert": {"type": "object"},
    "severity": {"type": "string"},
    "conditions": {"type": "object"}
  }
}')

ON CONFLICT (name) DO NOTHING;

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_updated_at();

-- Trigger para manter as assinaturas sincronizadas
CREATE OR REPLACE FUNCTION sync_webhook_subscriptions()
RETURNS TRIGGER AS $$
BEGIN
    -- Deletar assinaturas antigas
    DELETE FROM webhook_subscriptions WHERE webhook_id = NEW.id;
    
    -- Criar novas assinaturas
    INSERT INTO webhook_subscriptions (webhook_id, event_type)
    SELECT NEW.id, unnest(NEW.events);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_webhook_subscriptions_trigger ON webhooks;
CREATE TRIGGER sync_webhook_subscriptions_trigger
    AFTER INSERT OR UPDATE OF events ON webhooks
    FOR EACH ROW
    EXECUTE FUNCTION sync_webhook_subscriptions();

-- Trigger para atualizar estatísticas do webhook
CREATE OR REPLACE FUNCTION update_webhook_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'success' AND OLD.status != 'success' THEN
        UPDATE webhooks 
        SET 
            successful_requests = successful_requests + 1,
            total_requests = total_requests + 1,
            last_triggered = NEW.completed_at
        WHERE id = NEW.webhook_id;
    ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        UPDATE webhooks 
        SET 
            failed_requests = failed_requests + 1,
            total_requests = total_requests + 1,
            last_triggered = NEW.completed_at
        WHERE id = NEW.webhook_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_webhook_stats_trigger ON webhook_events;
CREATE TRIGGER update_webhook_stats_trigger
    AFTER UPDATE OF status ON webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_stats();

COMMIT;