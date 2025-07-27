-- =============================================
-- Sistema Avançado de Subscriptions de Notificação
-- =============================================

-- Tabela para subscriptions avançadas de notificação
CREATE TABLE IF NOT EXISTS notification_subscriptions_advanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração da subscription
    name VARCHAR(255),
    description TEXT,
    event_types TEXT[] NOT NULL DEFAULT ARRAY['all'],
    channels notification_channel[] NOT NULL DEFAULT ARRAY['web', 'push'],
    
    -- Filtros e condições
    filters JSONB DEFAULT '{}',
    conditions JSONB DEFAULT '[]',
    priority_threshold notification_priority DEFAULT 'normal',
    
    -- Configurações de delivery
    delivery_config JSONB DEFAULT '{}',
    rate_limit_config JSONB DEFAULT '{}',
    retry_config JSONB DEFAULT '{}',
    
    -- Estado e controle
    enabled BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT unique_user_subscription UNIQUE(user_id, name)
);

-- Enums para notificações
DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('web', 'push', 'email', 'sms', 'whatsapp', 'slack', 'webhook');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rule_action_type AS ENUM ('send_notification', 'send_email', 'send_sms', 'send_whatsapp', 'create_task', 'webhook', 'escalate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela para regras de subscription automáticas
CREATE TABLE IF NOT EXISTS notification_subscription_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração da regra
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_types TEXT[] NOT NULL DEFAULT ARRAY['all'],
    
    -- Condições para ativar a regra
    conditions JSONB NOT NULL DEFAULT '[]', -- Array de {field, operator, value}
    actions JSONB NOT NULL DEFAULT '[]', -- Array de ações para executar
    
    -- Configurações
    priority notification_priority DEFAULT 'normal',
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Controle de execução
    execution_limit INTEGER, -- Máximo de execuções por período
    execution_window_hours INTEGER DEFAULT 24,
    current_executions INTEGER DEFAULT 0,
    last_execution_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Auditoria
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0
);

-- Tabela para histórico de execução de subscriptions
CREATE TABLE IF NOT EXISTS notification_subscription_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES notification_subscriptions_advanced(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES notification_subscription_rules(id) ON DELETE CASCADE,
    
    -- Dados do evento que ativou
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    
    -- Resultado da execução
    status execution_status DEFAULT 'pending',
    channels_used notification_channel[],
    
    -- Métricas de execução
    execution_time_ms INTEGER,
    delivery_results JSONB DEFAULT '{}',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Auditoria
    triggered_for UUID NOT NULL REFERENCES auth.users(id),
    agency_id UUID REFERENCES agencies(id),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enum para status de execução
DO $$ BEGIN
    CREATE TYPE execution_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'rate_limited');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela para templates de ação
CREATE TABLE IF NOT EXISTS notification_action_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração do template
    name VARCHAR(255) NOT NULL,
    action_type rule_action_type NOT NULL,
    
    -- Template de conteúdo
    title_template TEXT,
    content_template TEXT,
    
    -- Configurações específicas por tipo
    config JSONB DEFAULT '{}',
    
    -- Variáveis disponíveis no template
    available_variables TEXT[] DEFAULT '{}',
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, name),
    UNIQUE(agency_id, action_type, is_default) WHERE is_default = TRUE
);

-- Tabela para rate limiting de subscriptions
CREATE TABLE IF NOT EXISTS notification_subscription_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES notification_subscriptions_advanced(id) ON DELETE CASCADE,
    
    -- Configuração de rate limit
    max_executions INTEGER NOT NULL DEFAULT 100,
    window_hours INTEGER NOT NULL DEFAULT 1,
    
    -- Estado atual
    current_executions INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Controle
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(subscription_id)
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_id ON notification_subscriptions_advanced(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_agency_id ON notification_subscriptions_advanced(agency_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_enabled ON notification_subscriptions_advanced(enabled) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_event_types ON notification_subscriptions_advanced USING GIN(event_types);

CREATE INDEX IF NOT EXISTS idx_subscription_rules_agency_id ON notification_subscription_rules(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscription_rules_enabled ON notification_subscription_rules(enabled) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscription_rules_event_types ON notification_subscription_rules USING GIN(event_types);

CREATE INDEX IF NOT EXISTS idx_subscription_executions_subscription_id ON notification_subscription_executions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_executions_rule_id ON notification_subscription_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_subscription_executions_triggered_for ON notification_subscription_executions(triggered_for);
CREATE INDEX IF NOT EXISTS idx_subscription_executions_executed_at ON notification_subscription_executions(executed_at);
CREATE INDEX IF NOT EXISTS idx_subscription_executions_status ON notification_subscription_executions(status);

-- RLS (Row Level Security)
ALTER TABLE notification_subscriptions_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscription_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscription_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_action_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscription_rate_limits ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notification_subscriptions_advanced
CREATE POLICY "Users can manage their own subscriptions"
    ON notification_subscriptions_advanced FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Agency members can view agency subscriptions"
    ON notification_subscriptions_advanced FOR SELECT
    USING (
        agency_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = notification_subscriptions_advanced.agency_id
        )
    );

-- Políticas RLS para notification_subscription_rules
CREATE POLICY "Agency admins can manage agency rules"
    ON notification_subscription_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = notification_subscription_rules.agency_id
            AND up.role IN ('agency_owner', 'agency_manager', 'admin')
        )
    );

-- Políticas RLS para notification_subscription_executions
CREATE POLICY "Users can view their own executions"
    ON notification_subscription_executions FOR SELECT
    USING (auth.uid() = triggered_for);

CREATE POLICY "System can insert executions"
    ON notification_subscription_executions FOR INSERT
    WITH CHECK (true);

-- Políticas RLS para notification_action_templates
CREATE POLICY "Agency members can view agency templates"
    ON notification_action_templates FOR SELECT
    USING (
        agency_id IS NULL OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = notification_action_templates.agency_id
        )
    );

CREATE POLICY "Agency admins can manage agency templates"
    ON notification_action_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = notification_action_templates.agency_id
            AND up.role IN ('agency_owner', 'agency_manager', 'admin')
        )
    );

-- Função para avaliar condições de regra
CREATE OR REPLACE FUNCTION evaluate_rule_conditions(
    p_conditions JSONB,
    p_event_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_condition JSONB;
    v_field TEXT;
    v_operator TEXT;
    v_expected_value JSONB;
    v_actual_value JSONB;
BEGIN
    -- Se não há condições, retorna true
    IF p_conditions IS NULL OR jsonb_array_length(p_conditions) = 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Avaliar cada condição
    FOR v_condition IN SELECT jsonb_array_elements(p_conditions)
    LOOP
        v_field := v_condition->>'field';
        v_operator := v_condition->>'operator';
        v_expected_value := v_condition->'value';
        
        -- Extrair valor do evento (suporta nested fields com jsonb_extract_path)
        v_actual_value := jsonb_extract_path(p_event_data, variadic string_to_array(v_field, '.'));
        
        -- Avaliar operador
        CASE v_operator
            WHEN 'eq' THEN
                IF v_actual_value != v_expected_value THEN
                    RETURN FALSE;
                END IF;
            WHEN 'ne' THEN
                IF v_actual_value = v_expected_value THEN
                    RETURN FALSE;
                END IF;
            WHEN 'gt' THEN
                IF (v_actual_value->>0)::NUMERIC <= (v_expected_value->>0)::NUMERIC THEN
                    RETURN FALSE;
                END IF;
            WHEN 'gte' THEN
                IF (v_actual_value->>0)::NUMERIC < (v_expected_value->>0)::NUMERIC THEN
                    RETURN FALSE;
                END IF;
            WHEN 'lt' THEN
                IF (v_actual_value->>0)::NUMERIC >= (v_expected_value->>0)::NUMERIC THEN
                    RETURN FALSE;
                END IF;
            WHEN 'lte' THEN
                IF (v_actual_value->>0)::NUMERIC > (v_expected_value->>0)::NUMERIC THEN
                    RETURN FALSE;
                END IF;
            WHEN 'in' THEN
                IF NOT (v_expected_value ? (v_actual_value->>0)) THEN
                    RETURN FALSE;
                END IF;
            WHEN 'contains' THEN
                IF NOT ((v_actual_value->>0) ILIKE '%' || (v_expected_value->>0) || '%') THEN
                    RETURN FALSE;
                END IF;
            WHEN 'starts_with' THEN
                IF NOT ((v_actual_value->>0) ILIKE (v_expected_value->>0) || '%') THEN
                    RETURN FALSE;
                END IF;
            WHEN 'ends_with' THEN
                IF NOT ((v_actual_value->>0) ILIKE '%' || (v_expected_value->>0)) THEN
                    RETURN FALSE;
                END IF;
            ELSE
                -- Operador não reconhecido, falha na condição
                RETURN FALSE;
        END CASE;
    END LOOP;
    
    -- Todas as condições passaram
    RETURN TRUE;
END;
$$;

-- Função para processar subscriptions de um evento
CREATE OR REPLACE FUNCTION process_event_subscriptions(
    p_user_id UUID,
    p_agency_id UUID,
    p_event_type TEXT,
    p_event_data JSONB,
    p_priority notification_priority DEFAULT 'normal'
)
RETURNS TABLE(
    subscription_id UUID,
    channels notification_channel[],
    delivery_config JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subscription RECORD;
    v_rule RECORD;
    v_priority_value INTEGER;
    v_threshold_value INTEGER;
    v_execution_id UUID;
BEGIN
    -- Converter prioridade para valor numérico
    v_priority_value := CASE p_priority
        WHEN 'low' THEN 1
        WHEN 'normal' THEN 2
        WHEN 'high' THEN 3
        WHEN 'urgent' THEN 4
        WHEN 'critical' THEN 5
        ELSE 2
    END;

    -- Processar subscriptions diretas do usuário
    FOR v_subscription IN
        SELECT s.*, sl.max_executions, sl.current_executions, sl.window_hours
        FROM notification_subscriptions_advanced s
        LEFT JOIN notification_subscription_rate_limits sl ON sl.subscription_id = s.id
        WHERE s.user_id = p_user_id
        AND s.enabled = true
        AND (s.event_types @> ARRAY[p_event_type] OR s.event_types @> ARRAY['all'])
        AND (s.agency_id = p_agency_id OR s.agency_id IS NULL)
    LOOP
        -- Verificar threshold de prioridade
        v_threshold_value := CASE v_subscription.priority_threshold
            WHEN 'low' THEN 1
            WHEN 'normal' THEN 2
            WHEN 'high' THEN 3
            WHEN 'urgent' THEN 4
            WHEN 'critical' THEN 5
            ELSE 2
        END;

        IF v_priority_value < v_threshold_value THEN
            CONTINUE;
        END IF;

        -- Verificar rate limit
        IF v_subscription.max_executions IS NOT NULL THEN
            IF v_subscription.current_executions >= v_subscription.max_executions THEN
                CONTINUE;
            END IF;
        END IF;

        -- Avaliar filtros personalizados (implementação simplificada)
        -- Em produção, seria mais complexo com evaluate_rule_conditions
        
        -- Registrar execução
        INSERT INTO notification_subscription_executions (
            subscription_id, event_type, event_data, triggered_for, agency_id
        ) VALUES (
            v_subscription.id, p_event_type, p_event_data, p_user_id, p_agency_id
        ) RETURNING id INTO v_execution_id;

        -- Atualizar contadores
        UPDATE notification_subscriptions_advanced
        SET trigger_count = trigger_count + 1,
            last_triggered_at = NOW()
        WHERE id = v_subscription.id;

        -- Atualizar rate limit
        UPDATE notification_subscription_rate_limits
        SET current_executions = current_executions + 1
        WHERE subscription_id = v_subscription.id;

        -- Retornar subscription para processamento
        subscription_id := v_subscription.id;
        channels := v_subscription.channels;
        delivery_config := v_subscription.delivery_config;
        
        RETURN NEXT;
    END LOOP;

    -- Processar regras automáticas da agência
    FOR v_rule IN
        SELECT r.*
        FROM notification_subscription_rules r
        WHERE (r.agency_id = p_agency_id OR r.agency_id IS NULL)
        AND r.enabled = true
        AND (r.event_types @> ARRAY[p_event_type] OR r.event_types @> ARRAY['all'])
        AND evaluate_rule_conditions(r.conditions, p_event_data)
    LOOP
        -- Verificar limite de execução
        IF v_rule.execution_limit IS NOT NULL THEN
            IF v_rule.current_executions >= v_rule.execution_limit THEN
                CONTINUE;
            END IF;
        END IF;

        -- Registrar execução da regra
        INSERT INTO notification_subscription_executions (
            rule_id, event_type, event_data, triggered_for, agency_id
        ) VALUES (
            v_rule.id, p_event_type, p_event_data, p_user_id, p_agency_id
        ) RETURNING id INTO v_execution_id;

        -- Atualizar contadores da regra
        UPDATE notification_subscription_rules
        SET trigger_count = trigger_count + 1,
            last_triggered_at = NOW(),
            current_executions = current_executions + 1
        WHERE id = v_rule.id;

        -- Processar ações da regra (simplificado)
        -- Em produção, isso executaria as ações definidas em v_rule.actions
    END LOOP;
END;
$$;

-- Função para obter estatísticas de subscriptions
CREATE OR REPLACE FUNCTION get_subscription_stats(
    p_agency_id UUID DEFAULT NULL,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_subscriptions BIGINT,
    active_subscriptions BIGINT,
    total_rules BIGINT,
    active_rules BIGINT,
    total_executions BIGINT,
    successful_executions BIGINT,
    failed_executions BIGINT,
    avg_execution_time_ms DECIMAL,
    top_event_types JSONB,
    execution_trend JSONB
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
            COUNT(DISTINCT s.id) as total_subs,
            COUNT(DISTINCT s.id) FILTER (WHERE s.enabled = TRUE) as active_subs,
            COUNT(DISTINCT r.id) as total_rules,
            COUNT(DISTINCT r.id) FILTER (WHERE r.enabled = TRUE) as active_rules,
            COUNT(e.id) as total_exec,
            COUNT(e.id) FILTER (WHERE e.status = 'completed') as success_exec,
            COUNT(e.id) FILTER (WHERE e.status = 'failed') as failed_exec,
            AVG(e.execution_time_ms) as avg_time
        FROM notification_subscriptions_advanced s
        FULL OUTER JOIN notification_subscription_rules r ON (
            r.agency_id = s.agency_id OR (r.agency_id IS NULL AND s.agency_id IS NULL)
        )
        LEFT JOIN notification_subscription_executions e ON (
            e.subscription_id = s.id OR e.rule_id = r.id
        ) AND e.executed_at >= v_start_date
        WHERE (p_agency_id IS NULL OR s.agency_id = p_agency_id OR r.agency_id = p_agency_id)
    ),
    event_types AS (
        SELECT jsonb_agg(
            jsonb_build_object('event_type', event_type, 'count', count)
            ORDER BY count DESC
        ) as top_events
        FROM (
            SELECT event_type, COUNT(*) as count
            FROM notification_subscription_executions
            WHERE executed_at >= v_start_date
            AND (p_agency_id IS NULL OR agency_id = p_agency_id)
            GROUP BY event_type
            ORDER BY count DESC
            LIMIT 10
        ) t
    ),
    daily_trend AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'date', date_trunc('day', executed_at),
                'executions', COUNT(*),
                'successful', COUNT(*) FILTER (WHERE status = 'completed'),
                'failed', COUNT(*) FILTER (WHERE status = 'failed')
            ) ORDER BY date_trunc('day', executed_at)
        ) as trend
        FROM notification_subscription_executions
        WHERE executed_at >= v_start_date
        AND (p_agency_id IS NULL OR agency_id = p_agency_id)
        GROUP BY date_trunc('day', executed_at)
    )
    SELECT 
        s.total_subs,
        s.active_subs,
        s.total_rules,
        s.active_rules,
        s.total_exec,
        s.success_exec,
        s.failed_exec,
        s.avg_time,
        COALESCE(et.top_events, '[]'::jsonb),
        COALESCE(dt.trend, '[]'::jsonb)
    FROM stats s, event_types et, daily_trend dt;
END;
$$;

-- Função para resetar rate limits expirados
CREATE OR REPLACE FUNCTION reset_expired_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reset_count INTEGER;
    v_rule_reset_count INTEGER;
BEGIN
    -- Reset subscription rate limits
    UPDATE notification_subscription_rate_limits
    SET current_executions = 0,
        window_start = NOW()
    WHERE window_start + (window_hours || ' hours')::INTERVAL <= NOW()
    AND current_executions > 0;
    
    GET DIAGNOSTICS v_reset_count = ROW_COUNT;

    -- Reset rule execution limits
    UPDATE notification_subscription_rules
    SET current_executions = 0,
        last_execution_reset = NOW()
    WHERE last_execution_reset + (execution_window_hours || ' hours')::INTERVAL <= NOW()
    AND current_executions > 0;
    
    GET DIAGNOSTICS v_rule_reset_count = ROW_COUNT;
    
    RETURN v_reset_count + v_rule_reset_count;
END;
$$;

-- Triggers para manutenção automática
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_subscriptions_advanced_updated_at
    BEFORE UPDATE ON notification_subscriptions_advanced
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_subscription_rules_updated_at
    BEFORE UPDATE ON notification_subscription_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_action_templates_updated_at
    BEFORE UPDATE ON notification_action_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();