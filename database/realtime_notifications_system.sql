-- =============================================
-- Sistema de Notificações Push em Tempo Real
-- =============================================

-- Tabela para gerenciar subscriptions de notificação push
CREATE TABLE IF NOT EXISTS notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Dados da subscription (endpoint, keys, etc.)
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    
    -- Configurações da subscription
    device_type device_type DEFAULT 'desktop',
    browser_name VARCHAR(50),
    os_name VARCHAR(50),
    user_agent TEXT,
    
    -- Configurações de notificação
    enabled BOOLEAN DEFAULT TRUE,
    notification_types TEXT[] DEFAULT ARRAY['all'],
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Enum para tipos de dispositivo
DO $$ BEGIN
    CREATE TYPE device_type AS ENUM ('desktop', 'mobile', 'tablet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela para logs de push notifications enviadas
CREATE TABLE IF NOT EXISTS push_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES notification_subscriptions(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Dados da notificação enviada
    title VARCHAR(255) NOT NULL,
    message TEXT,
    icon_url TEXT,
    badge_url TEXT,
    image_url TEXT,
    click_action TEXT,
    
    -- Dados de rastreamento
    status push_status DEFAULT 'sent',
    delivery_status delivery_status DEFAULT 'pending',
    
    -- Resposta do serviço push
    push_service_response JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps importantes
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enums para status de push notifications
DO $$ BEGIN
    CREATE TYPE push_status AS ENUM ('sent', 'failed', 'cancelled', 'retry');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('pending', 'delivered', 'failed', 'expired', 'clicked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela para eventos de notificação em tempo real
CREATE TABLE IF NOT EXISTS realtime_notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Dados do evento
    event_type notification_event_type NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    
    -- Configurações de delivery
    delivery_channels channel_type[] DEFAULT ARRAY['web', 'push'],
    priority event_priority DEFAULT 'normal',
    
    -- Status de processamento
    processed BOOLEAN DEFAULT FALSE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_errors JSONB,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Enums para eventos de notificação
DO $$ BEGIN
    CREATE TYPE notification_event_type AS ENUM (
        'project_created', 'project_updated', 'project_completed',
        'task_assigned', 'task_due_soon', 'task_overdue', 'task_completed',
        'payment_received', 'payment_overdue', 'invoice_created',
        'message_received', 'comment_added', 'mention_received',
        'report_generated', 'system_alert', 'maintenance_scheduled',
        'user_joined', 'user_left', 'permission_changed',
        'ai_insight_generated', 'backup_completed', 'backup_failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('web', 'push', 'email', 'sms', 'whatsapp', 'slack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_priority AS ENUM ('low', 'normal', 'high', 'urgent', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela para configurações de notificação por usuário
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Preferências gerais
    enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    whatsapp_notifications BOOLEAN DEFAULT FALSE,
    
    -- Configurações específicas por tipo de evento
    event_preferences JSONB DEFAULT '{}',
    
    -- Configurações de horário
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    
    -- Configurações de frequência
    digest_enabled BOOLEAN DEFAULT FALSE,
    digest_frequency VARCHAR(20) DEFAULT 'daily', -- daily, weekly, never
    digest_time TIME DEFAULT '09:00:00',
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, agency_id)
);

-- Tabela para templates de notificação push
CREATE TABLE IF NOT EXISTS push_notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Dados do template
    name VARCHAR(255) NOT NULL,
    event_type notification_event_type NOT NULL,
    
    -- Conteúdo do template
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    icon_url TEXT,
    badge_url TEXT,
    image_url TEXT,
    click_action_template TEXT,
    
    -- Configurações
    priority event_priority DEFAULT 'normal',
    ttl_seconds INTEGER DEFAULT 86400, -- 24 horas
    require_interaction BOOLEAN DEFAULT FALSE,
    silent BOOLEAN DEFAULT FALSE,
    
    -- Variáveis disponíveis
    available_variables TEXT[] DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, event_type, is_default) WHERE is_default = TRUE
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_id ON notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_agency_id ON notification_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_active ON notification_subscriptions(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_push_notification_logs_subscription_id ON push_notification_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_sent_at ON push_notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_status ON push_notification_logs(status);

CREATE INDEX IF NOT EXISTS idx_realtime_events_user_id ON realtime_notification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_agency_id ON realtime_notification_events(agency_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_processed ON realtime_notification_events(processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_realtime_events_created_at ON realtime_notification_events(created_at);
CREATE INDEX IF NOT EXISTS idx_realtime_events_expires_at ON realtime_notification_events(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_push_templates_agency_event ON push_notification_templates(agency_id, event_type);

-- RLS (Row Level Security)
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notification_subscriptions
CREATE POLICY "Users can manage their own subscriptions"
    ON notification_subscriptions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Agency members can view agency subscriptions"
    ON notification_subscriptions FOR SELECT
    USING (
        agency_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = notification_subscriptions.agency_id
        )
    );

-- Políticas RLS para push_notification_logs
CREATE POLICY "Users can view their own push logs"
    ON push_notification_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert push logs"
    ON push_notification_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update push logs"
    ON push_notification_logs FOR UPDATE
    USING (true);

-- Políticas RLS para realtime_notification_events
CREATE POLICY "Users can view their own events"
    ON realtime_notification_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage events"
    ON realtime_notification_events FOR ALL
    USING (true);

-- Políticas RLS para user_notification_preferences
CREATE POLICY "Users can manage their own preferences"
    ON user_notification_preferences FOR ALL
    USING (auth.uid() = user_id);

-- Políticas RLS para push_notification_templates
CREATE POLICY "Agency members can view agency templates"
    ON push_notification_templates FOR SELECT
    USING (
        agency_id IS NULL OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = push_notification_templates.agency_id
        )
    );

CREATE POLICY "Agency owners can manage agency templates"
    ON push_notification_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = push_notification_templates.agency_id
            AND up.role IN ('agency_owner', 'agency_manager', 'admin')
        )
    );

-- Função para processar eventos de notificação em tempo real
CREATE OR REPLACE FUNCTION process_realtime_notification_event(
    p_user_id UUID,
    p_agency_id UUID DEFAULT NULL,
    p_event_type notification_event_type,
    p_event_data JSONB DEFAULT '{}',
    p_delivery_channels channel_type[] DEFAULT ARRAY['web', 'push'],
    p_priority event_priority DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_user_prefs user_notification_preferences;
    v_template push_notification_templates;
    v_subscription notification_subscriptions;
    v_notification_id UUID;
BEGIN
    -- Criar evento
    INSERT INTO realtime_notification_events (
        user_id, agency_id, event_type, event_data,
        delivery_channels, priority
    ) VALUES (
        p_user_id, p_agency_id, p_event_type, p_event_data,
        p_delivery_channels, p_priority
    ) RETURNING id INTO v_event_id;
    
    -- Buscar preferências do usuário
    SELECT * INTO v_user_prefs
    FROM user_notification_preferences
    WHERE user_id = p_user_id
    AND (agency_id = p_agency_id OR agency_id IS NULL)
    LIMIT 1;
    
    -- Se usuário não tem preferências ou tem notificações desabilitadas, sair
    IF v_user_prefs IS NULL OR NOT v_user_prefs.enabled THEN
        RETURN v_event_id;
    END IF;
    
    -- Verificar horário silencioso
    IF v_user_prefs.quiet_hours_enabled THEN
        DECLARE
            v_current_time TIME := (NOW() AT TIME ZONE v_user_prefs.timezone)::TIME;
        BEGIN
            IF v_current_time BETWEEN v_user_prefs.quiet_hours_start AND v_user_prefs.quiet_hours_end THEN
                -- Está em horário silencioso, não enviar notificação push
                p_delivery_channels := array_remove(p_delivery_channels, 'push');
            END IF;
        END;
    END IF;
    
    -- Se deve enviar push notification
    IF v_user_prefs.push_notifications AND 'push' = ANY(p_delivery_channels) THEN
        -- Buscar template
        SELECT * INTO v_template
        FROM push_notification_templates
        WHERE event_type = p_event_type
        AND (agency_id = p_agency_id OR agency_id IS NULL)
        AND is_active = TRUE
        ORDER BY is_default DESC, created_at DESC
        LIMIT 1;
        
        -- Se tem template, criar notificação e enviar push
        IF v_template IS NOT NULL THEN
            -- Criar notificação no sistema
            INSERT INTO notifications (
                user_id, agency_id, title, message, type,
                category, priority, notification_data
            ) VALUES (
                p_user_id, p_agency_id,
                v_template.title_template,
                v_template.message_template,
                'push_notification',
                'realtime',
                v_template.priority::VARCHAR,
                jsonb_build_object(
                    'event_id', v_event_id,
                    'event_type', p_event_type,
                    'template_id', v_template.id
                )
            ) RETURNING id INTO v_notification_id;
            
            -- Buscar subscriptions ativas do usuário
            FOR v_subscription IN 
                SELECT * FROM notification_subscriptions
                WHERE user_id = p_user_id
                AND is_active = TRUE
                AND enabled = TRUE
            LOOP
                -- Inserir log de push notification
                INSERT INTO push_notification_logs (
                    subscription_id, notification_id, user_id, agency_id,
                    title, message, icon_url, badge_url, image_url, click_action
                ) VALUES (
                    v_subscription.id, v_notification_id, p_user_id, p_agency_id,
                    v_template.title_template,
                    v_template.message_template,
                    v_template.icon_url,
                    v_template.badge_url,
                    v_template.image_url,
                    v_template.click_action_template
                );
            END LOOP;
        END IF;
    END IF;
    
    -- Marcar evento como processado
    UPDATE realtime_notification_events
    SET processed = TRUE,
        processing_completed_at = NOW()
    WHERE id = v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- Função para registrar subscription de push notification
CREATE OR REPLACE FUNCTION register_push_subscription(
    p_user_id UUID,
    p_agency_id UUID DEFAULT NULL,
    p_endpoint TEXT,
    p_p256dh_key TEXT,
    p_auth_key TEXT,
    p_device_type device_type DEFAULT 'desktop',
    p_browser_name VARCHAR(50) DEFAULT NULL,
    p_os_name VARCHAR(50) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription_id UUID;
BEGIN
    -- Tentar atualizar subscription existente
    UPDATE notification_subscriptions
    SET 
        p256dh_key = p_p256dh_key,
        auth_key = p_auth_key,
        device_type = p_device_type,
        browser_name = p_browser_name,
        os_name = p_os_name,
        user_agent = p_user_agent,
        updated_at = NOW(),
        last_used_at = NOW(),
        is_active = TRUE
    WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    RETURNING id INTO v_subscription_id;
    
    -- Se não encontrou, criar nova
    IF v_subscription_id IS NULL THEN
        INSERT INTO notification_subscriptions (
            user_id, agency_id, endpoint, p256dh_key, auth_key,
            device_type, browser_name, os_name, user_agent
        ) VALUES (
            p_user_id, p_agency_id, p_endpoint, p_p256dh_key, p_auth_key,
            p_device_type, p_browser_name, p_os_name, p_user_agent
        ) RETURNING id INTO v_subscription_id;
    END IF;
    
    RETURN v_subscription_id;
END;
$$;

-- Função para obter estatísticas de push notifications
CREATE OR REPLACE FUNCTION get_push_notification_stats(
    p_agency_id UUID DEFAULT NULL,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_subscriptions BIGINT,
    active_subscriptions BIGINT,
    total_sent BIGINT,
    total_delivered BIGINT,
    total_clicked BIGINT,
    delivery_rate DECIMAL,
    click_rate DECIMAL,
    daily_stats JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    v_start_date := NOW() - (p_days_back || ' days')::INTERVAL;
    
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(DISTINCT ns.id) as total_subs,
            COUNT(DISTINCT ns.id) FILTER (WHERE ns.is_active = TRUE) as active_subs,
            COUNT(pnl.id) as sent_count,
            COUNT(pnl.id) FILTER (WHERE pnl.delivery_status = 'delivered') as delivered_count,
            COUNT(pnl.id) FILTER (WHERE pnl.delivery_status = 'clicked') as clicked_count
        FROM notification_subscriptions ns
        LEFT JOIN push_notification_logs pnl ON pnl.subscription_id = ns.id
            AND pnl.sent_at >= v_start_date
        WHERE (p_agency_id IS NULL OR ns.agency_id = p_agency_id)
    ),
    daily_data AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'date', date_trunc('day', pnl.sent_at),
                'sent', COUNT(*),
                'delivered', COUNT(*) FILTER (WHERE pnl.delivery_status = 'delivered'),
                'clicked', COUNT(*) FILTER (WHERE pnl.delivery_status = 'clicked')
            ) ORDER BY date_trunc('day', pnl.sent_at)
        ) as daily_stats
        FROM push_notification_logs pnl
        WHERE pnl.sent_at >= v_start_date
        AND (p_agency_id IS NULL OR pnl.agency_id = p_agency_id)
        GROUP BY date_trunc('day', pnl.sent_at)
    )
    SELECT 
        s.total_subs,
        s.active_subs,
        s.sent_count,
        s.delivered_count,
        s.clicked_count,
        CASE 
            WHEN s.sent_count > 0 THEN 
                ROUND((s.delivered_count::DECIMAL / s.sent_count::DECIMAL) * 100, 2)
            ELSE 0 
        END as delivery_rate,
        CASE 
            WHEN s.delivered_count > 0 THEN 
                ROUND((s.clicked_count::DECIMAL / s.delivered_count::DECIMAL) * 100, 2)
            ELSE 0 
        END as click_rate,
        COALESCE(dd.daily_stats, '[]'::jsonb)
    FROM stats s, daily_data dd;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_subscriptions_updated_at
    BEFORE UPDATE ON notification_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_notification_logs_updated_at
    BEFORE UPDATE ON push_notification_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_notification_templates_updated_at
    BEFORE UPDATE ON push_notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar eventos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_notification_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM realtime_notification_events
    WHERE expires_at < NOW()
    AND processed = TRUE;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;