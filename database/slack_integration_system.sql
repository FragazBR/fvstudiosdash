-- ===================================================
-- FVStudios Dashboard - Sistema de Integração Slack
-- Tabelas para gerenciar integrações Slack por agência
-- ===================================================

BEGIN;

-- Tabela de configurações de workspace Slack
CREATE TABLE IF NOT EXISTS slack_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    team_id VARCHAR(50) UNIQUE NOT NULL, -- Slack Team ID
    team_name VARCHAR(255) NOT NULL,
    
    -- OAuth tokens (criptografados)
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    bot_token TEXT NOT NULL,
    
    -- Metadados
    scope TEXT NOT NULL, -- Permissões aprovadas
    bot_user_id VARCHAR(50), -- ID do bot no Slack
    
    -- Configurações
    is_active BOOLEAN NOT NULL DEFAULT true,
    auto_create_channels BOOLEAN DEFAULT false,
    default_channel VARCHAR(100) DEFAULT '#general',
    
    -- Auditoria
    installed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de canais Slack mapeados
CREATE TABLE IF NOT EXISTS slack_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
    
    -- Identificação do canal
    channel_id VARCHAR(50) NOT NULL, -- Slack Channel ID (C1234567890)
    channel_name VARCHAR(255) NOT NULL, -- Nome do canal (#general)
    
    -- Configurações do canal
    purpose VARCHAR(500), -- Propósito do canal
    is_private BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    -- Configurações de notificação
    notification_types TEXT[], -- Tipos de eventos a serem enviados
    message_format VARCHAR(50) DEFAULT 'rich', -- 'simple', 'rich', 'custom'
    
    -- Filtros
    filters JSONB DEFAULT '{}', -- Filtros específicos por canal
    
    -- Estatísticas
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para canal único por workspace
    CONSTRAINT unique_channel_per_workspace UNIQUE (workspace_id, channel_id)
);

-- Tabela de notificações enviadas para Slack
CREATE TABLE IF NOT EXISTS slack_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES slack_channels(id) ON DELETE CASCADE,
    
    -- Dados da notificação
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    
    -- Mensagem enviada
    message_text TEXT NOT NULL,
    message_blocks JSONB, -- Slack Block Kit
    thread_ts VARCHAR(50), -- Timestamp para threading
    
    -- Status do envio
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    slack_message_ts VARCHAR(50), -- Timestamp da mensagem no Slack
    slack_channel_id VARCHAR(50), -- ID real do canal no Slack
    
    -- Resposta do Slack
    slack_response JSONB,
    error_message TEXT,
    
    -- Timing
    sent_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para status válidos
    CONSTRAINT valid_slack_status CHECK (status IN ('pending', 'sent', 'failed', 'retrying'))
);

-- Tabela de templates de mensagem para Slack
CREATE TABLE IF NOT EXISTS slack_message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Identificação do template
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL,
    
    -- Conteúdo do template
    message_format VARCHAR(50) NOT NULL DEFAULT 'rich', -- 'simple', 'rich', 'blocks'
    template_text TEXT, -- Template de texto simples
    template_blocks JSONB, -- Template de blocos Slack
    
    -- Configurações
    use_threading BOOLEAN DEFAULT false,
    mention_users TEXT[], -- IDs de usuários para mencionar
    mention_channels TEXT[], -- IDs de canais para mencionar
    
    -- Metadados
    is_system_template BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para template único por evento por agência
    CONSTRAINT unique_template_per_event UNIQUE (agency_id, event_type, name)
);

-- Tabela de usuários Slack mapeados
CREATE TABLE IF NOT EXISTS slack_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
    
    -- Dados do usuário Slack
    slack_user_id VARCHAR(50) NOT NULL,
    slack_username VARCHAR(255),
    display_name VARCHAR(255),
    real_name VARCHAR(255),
    email VARCHAR(255),
    
    -- Mapeamento com usuário do sistema
    system_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_bot BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    
    -- Configurações de notificação
    receive_notifications BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{}',
    
    -- Dados de perfil
    profile_image VARCHAR(500),
    timezone VARCHAR(100),
    
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para usuário único por workspace
    CONSTRAINT unique_user_per_workspace UNIQUE (workspace_id, slack_user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_agency_id ON slack_workspaces(agency_id);
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_team_id ON slack_workspaces(team_id);
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_is_active ON slack_workspaces(is_active);

CREATE INDEX IF NOT EXISTS idx_slack_channels_workspace_id ON slack_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_slack_channels_channel_id ON slack_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_slack_channels_notification_types ON slack_channels USING GIN(notification_types);

CREATE INDEX IF NOT EXISTS idx_slack_notifications_workspace_id ON slack_notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_slack_notifications_channel_id ON slack_notifications(channel_id);
CREATE INDEX IF NOT EXISTS idx_slack_notifications_status ON slack_notifications(status);
CREATE INDEX IF NOT EXISTS idx_slack_notifications_event_type ON slack_notifications(event_type);
CREATE INDEX IF NOT EXISTS idx_slack_notifications_created_at ON slack_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_slack_templates_agency_id ON slack_message_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_slack_templates_event_type ON slack_message_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_slack_templates_is_active ON slack_message_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_slack_users_workspace_id ON slack_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_slack_users_slack_user_id ON slack_users(slack_user_id);
CREATE INDEX IF NOT EXISTS idx_slack_users_system_user_id ON slack_users(system_user_id);

-- RLS Policies
ALTER TABLE slack_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_users ENABLE ROW LEVEL SECURITY;

-- Policy para slack_workspaces
DROP POLICY IF EXISTS "Users can manage Slack workspaces of their agency" ON slack_workspaces;
CREATE POLICY "Users can manage Slack workspaces of their agency" ON slack_workspaces
    FOR ALL USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários da agência podem ver workspaces da sua agência
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND agency_id = slack_workspaces.agency_id
            AND role IN ('agency_owner', 'agency_manager', 'agency_staff')
        )
    );

-- Policy para slack_channels
DROP POLICY IF EXISTS "Users can view Slack channels of their agency" ON slack_channels;
CREATE POLICY "Users can view Slack channels of their agency" ON slack_channels
    FOR ALL USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários podem ver canais dos workspaces da sua agência
        EXISTS (
            SELECT 1 FROM slack_workspaces sw
            JOIN user_profiles up ON up.agency_id = sw.agency_id
            WHERE sw.id = slack_channels.workspace_id
            AND up.id = auth.uid()
            AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
        )
    );

-- Policy para slack_notifications
DROP POLICY IF EXISTS "Users can view Slack notifications of their agency" ON slack_notifications;
CREATE POLICY "Users can view Slack notifications of their agency" ON slack_notifications
    FOR SELECT USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários podem ver notificações dos workspaces da sua agência
        EXISTS (
            SELECT 1 FROM slack_workspaces sw
            JOIN user_profiles up ON up.agency_id = sw.agency_id
            WHERE sw.id = slack_notifications.workspace_id
            AND up.id = auth.uid()
            AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
        )
    );

-- Policy para slack_message_templates
DROP POLICY IF EXISTS "Users can manage Slack templates of their agency" ON slack_message_templates;
CREATE POLICY "Users can manage Slack templates of their agency" ON slack_message_templates
    FOR ALL USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários da agência podem gerenciar templates da sua agência
        (
            agency_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE id = auth.uid() 
                AND agency_id = slack_message_templates.agency_id
                AND role IN ('agency_owner', 'agency_manager')
            )
        )
        OR
        -- Templates do sistema são visíveis a todos
        (is_system_template = true)
    );

-- Policy para slack_users
DROP POLICY IF EXISTS "Users can view Slack users of their agency" ON slack_users;
CREATE POLICY "Users can view Slack users of their agency" ON slack_users
    FOR ALL USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários podem ver usuários Slack dos workspaces da sua agência
        EXISTS (
            SELECT 1 FROM slack_workspaces sw
            JOIN user_profiles up ON up.agency_id = sw.agency_id
            WHERE sw.id = slack_users.workspace_id
            AND up.id = auth.uid()
            AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
        )
    );

-- Inserir templates de mensagem padrão
INSERT INTO slack_message_templates (name, description, event_type, message_format, template_text, template_blocks, is_system_template) VALUES

-- Templates para eventos de projeto
('Projeto Criado', 'Notificação quando um projeto é criado', 'project.created', 'blocks', 
'🎯 *Novo Projeto Criado*\n\n*Projeto:* {{project.name}}\n*Cliente:* {{client.name}}\n*Criado por:* {{created_by.name}}',
'{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🎯 Novo Projeto Criado"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Projeto:*\n{{project.name}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Cliente:*\n{{client.name}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Status:*\n{{project.status}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Criado por:*\n{{created_by.name}}"
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Ver Projeto"
          },
          "url": "{{project.url}}"
        }
      ]
    }
  ]
}', true),

('Projeto Concluído', 'Notificação quando um projeto é concluído', 'project.completed', 'blocks',
'✅ *Projeto Concluído*\n\n*Projeto:* {{project.name}}\n*Cliente:* {{client.name}}\n*Concluído por:* {{completed_by.name}}',
'{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "✅ Projeto Concluído"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Projeto:*\n{{project.name}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Cliente:*\n{{client.name}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Data de Conclusão:*\n{{completion_date}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Concluído por:*\n{{completed_by.name}}"
        }
      ]
    }
  ]
}', true),

-- Templates para alertas do sistema
('Alerta Crítico', 'Notificação para alertas críticos do sistema', 'system.alert_triggered', 'blocks',
'🚨 *Alerta Crítico*\n\n*Tipo:* {{alert.type}}\n*Severidade:* {{alert.severity}}\n*Descrição:* {{alert.message}}',
'{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 Alerta Crítico do Sistema"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Tipo:*\n{{alert.type}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Severidade:*\n{{alert.severity}}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Descrição:*\n{{alert.message}}"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "⏰ {{alert.triggered_at}}"
        }
      ]
    }
  ]
}', true),

-- Templates para eventos de usuário
('Novo Usuário', 'Notificação quando um usuário é criado', 'user.created', 'simple',
'👋 *Novo usuário cadastrado*\n\n*Nome:* {{user.name}}\n*Email:* {{user.email}}\n*Agência:* {{agency.name}}',
null, true),

-- Templates para backup
('Backup Concluído', 'Notificação quando backup é concluído', 'system.backup_completed', 'blocks',
'💾 *Backup Concluído*\n\n*Tipo:* {{backup.type}}\n*Tamanho:* {{backup.size}}\n*Duração:* {{backup.duration}}',
'{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "💾 Backup Concluído"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Tipo:*\n{{backup.type}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Tamanho:*\n{{backup.size}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Duração:*\n{{backup.duration}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Status:*\n✅ Sucesso"
        }
      ]
    }
  ]
}', true)

ON CONFLICT (agency_id, event_type, name) DO NOTHING;

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_slack_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_slack_workspaces_updated_at ON slack_workspaces;
CREATE TRIGGER update_slack_workspaces_updated_at
    BEFORE UPDATE ON slack_workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_slack_updated_at();

DROP TRIGGER IF EXISTS update_slack_channels_updated_at ON slack_channels;
CREATE TRIGGER update_slack_channels_updated_at
    BEFORE UPDATE ON slack_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_slack_updated_at();

DROP TRIGGER IF EXISTS update_slack_templates_updated_at ON slack_message_templates;
CREATE TRIGGER update_slack_templates_updated_at
    BEFORE UPDATE ON slack_message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_slack_updated_at();

DROP TRIGGER IF EXISTS update_slack_users_updated_at ON slack_users;
CREATE TRIGGER update_slack_users_updated_at
    BEFORE UPDATE ON slack_users
    FOR EACH ROW
    EXECUTE FUNCTION update_slack_updated_at();

-- Trigger para atualizar estatísticas de uso de templates
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementar contador de uso do template (se identificado)
    IF NEW.event_type IS NOT NULL THEN
        UPDATE slack_message_templates 
        SET usage_count = usage_count + 1
        WHERE event_type = NEW.event_type 
        AND is_system_template = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_template_usage_trigger ON slack_notifications;
CREATE TRIGGER update_template_usage_trigger
    AFTER INSERT ON slack_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_template_usage();

-- Trigger para atualizar última mensagem do canal
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'sent' THEN
        UPDATE slack_channels 
        SET 
            total_messages = total_messages + 1,
            last_message_at = NEW.sent_at
        WHERE id = NEW.channel_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_channel_last_message_trigger ON slack_notifications;
CREATE TRIGGER update_channel_last_message_trigger
    AFTER UPDATE OF status ON slack_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_last_message();

COMMIT;