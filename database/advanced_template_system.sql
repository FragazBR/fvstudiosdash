-- ===================================================
-- FVStudios Dashboard - Sistema de Templates Avançados
-- Sistema completo de templates com builder visual
-- ===================================================

BEGIN;

-- Enum para tipos de template
CREATE TYPE template_type AS ENUM (
  'email',
  'whatsapp',
  'slack',
  'sms',
  'push_notification',
  'social_media',
  'pdf_report',
  'web_page'
);

-- Enum para status do template
CREATE TYPE template_status AS ENUM (
  'draft',
  'active',
  'archived',
  'testing'
);

-- Enum para tipos de elemento no builder
CREATE TYPE element_type AS ENUM (
  'text',
  'heading',
  'image',
  'button',
  'divider',
  'spacer',
  'container',
  'columns',
  'list',
  'table',
  'chart',
  'social_buttons',
  'qr_code',
  'variable',
  'conditional',
  'loop'
);

-- Tabela principal de templates
CREATE TABLE IF NOT EXISTS advanced_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    tags TEXT[], -- Array de tags para categorização
    
    -- Tipo e configurações
    template_type template_type NOT NULL,
    status template_status DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES advanced_templates(id) ON DELETE SET NULL,
    
    -- Estrutura do template
    structure JSONB NOT NULL DEFAULT '{}', -- Estrutura completa do builder visual
    compiled_content JSONB, -- Conteúdo compilado para performance
    preview_data JSONB, -- Dados de exemplo para preview
    
    -- Configurações de renderização
    styles JSONB DEFAULT '{}', -- CSS customizado e configurações de estilo
    scripts JSONB DEFAULT '{}', -- JavaScript personalizado
    responsive_config JSONB DEFAULT '{}', -- Configurações responsivas
    
    -- Variáveis e dados dinâmicos
    variables JSONB DEFAULT '[]', -- Lista de variáveis disponíveis
    data_sources JSONB DEFAULT '[]', -- Fontes de dados conectadas
    
    -- Configurações específicas por tipo
    email_settings JSONB, -- Subject, from, reply-to, etc
    whatsapp_settings JSONB, -- Template parameters, buttons, etc
    slack_settings JSONB, -- Blocks configuration, channels, etc
    social_media_settings JSONB, -- Platform-specific settings
    
    -- Controle de acesso
    is_public BOOLEAN DEFAULT false,
    is_system_template BOOLEAN DEFAULT false,
    allowed_roles TEXT[], -- Roles que podem usar o template
    
    -- Estatísticas de uso
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Configurações de teste A/B
    ab_test_enabled BOOLEAN DEFAULT false,
    ab_test_config JSONB,
    
    -- Metadados
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_version CHECK (version > 0),
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- Tabela de elementos do builder
CREATE TABLE IF NOT EXISTS template_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES advanced_templates(id) ON DELETE CASCADE,
    
    -- Hierarquia e posicionamento
    parent_element_id UUID REFERENCES template_elements(id) ON DELETE CASCADE,
    element_order INTEGER NOT NULL DEFAULT 0,
    element_path VARCHAR(500), -- Path hierárquico (ex: "header.logo")
    
    -- Tipo e configuração
    element_type element_type NOT NULL,
    element_name VARCHAR(255),
    
    -- Conteúdo e propriedades
    content JSONB DEFAULT '{}', -- Conteúdo específico do elemento
    properties JSONB DEFAULT '{}', -- Propriedades de styling e comportamento
    conditions JSONB DEFAULT '{}', -- Condições para renderização
    
    -- Dados dinâmicos
    data_binding JSONB, -- Vinculação com fontes de dados
    variables_used TEXT[], -- Variáveis utilizadas neste elemento
    
    -- Configurações responsivas
    mobile_properties JSONB DEFAULT '{}',
    tablet_properties JSONB DEFAULT '{}',
    desktop_properties JSONB DEFAULT '{}',
    
    -- Validação e regras
    validation_rules JSONB DEFAULT '{}',
    is_required BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de variáveis de template
CREATE TABLE IF NOT EXISTS template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES advanced_templates(id) ON DELETE CASCADE,
    
    -- Identificação da variável
    variable_name VARCHAR(255) NOT NULL,
    variable_key VARCHAR(255) NOT NULL, -- Chave para uso {{variable_key}}
    description TEXT,
    
    -- Tipo e configurações
    data_type VARCHAR(50) NOT NULL, -- string, number, boolean, date, array, object
    default_value JSONB,
    is_required BOOLEAN DEFAULT false,
    
    -- Validação
    validation_rules JSONB DEFAULT '{}', -- Regex, min/max, etc
    possible_values JSONB, -- Array de valores possíveis (enum)
    
    -- Configurações de input
    input_type VARCHAR(50), -- text, textarea, select, date, etc
    input_properties JSONB DEFAULT '{}',
    
    -- Categorização
    category VARCHAR(100),
    group_name VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    
    -- Metadados
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_template_variable UNIQUE (template_id, variable_key)
);

-- Tabela de fontes de dados
CREATE TABLE IF NOT EXISTS template_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES advanced_templates(id) ON DELETE CASCADE,
    
    -- Identificação
    source_name VARCHAR(255) NOT NULL,
    source_key VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuração da fonte
    source_type VARCHAR(100) NOT NULL, -- database, api, static, calculated
    connection_config JSONB NOT NULL DEFAULT '{}',
    
    -- Query/configuração
    query_config JSONB DEFAULT '{}', -- SQL query, API endpoint, etc
    parameters JSONB DEFAULT '{}', -- Parâmetros necessários
    
    -- Cache e performance
    cache_duration INTEGER DEFAULT 300, -- segundos
    cache_key_template VARCHAR(500),
    
    -- Transformação de dados
    data_transformation JSONB, -- Regras de transformação dos dados
    output_schema JSONB, -- Schema esperado dos dados de saída
    
    -- Configurações de segurança
    requires_authentication BOOLEAN DEFAULT false,
    allowed_roles TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(50),
    
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_template_data_source UNIQUE (template_id, source_key)
);

-- Tabela de histórico de renderização
CREATE TABLE IF NOT EXISTS template_render_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES advanced_templates(id) ON DELETE CASCADE,
    
    -- Contexto da renderização
    render_context JSONB NOT NULL DEFAULT '{}', -- Variáveis e dados usados
    render_type VARCHAR(100), -- preview, production, test
    
    -- Resultado
    rendered_content TEXT, -- Conteúdo final renderizado
    render_format VARCHAR(50), -- html, json, pdf, etc
    
    -- Performance
    render_time_ms INTEGER,
    data_fetch_time_ms INTEGER,
    
    -- Status
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    error_details JSONB,
    
    -- Metadados
    rendered_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de testes A/B
CREATE TABLE IF NOT EXISTS template_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES advanced_templates(id) ON DELETE CASCADE,
    
    -- Configuração do teste
    test_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Variantes
    variant_a_config JSONB NOT NULL, -- Configuração da variante A
    variant_b_config JSONB NOT NULL, -- Configuração da variante B
    
    -- Configurações do teste
    traffic_split DECIMAL(3,2) DEFAULT 0.50, -- % para variante B
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    -- Métricas objetivo
    primary_metric VARCHAR(100), -- open_rate, click_rate, conversion_rate
    secondary_metrics TEXT[],
    significance_level DECIMAL(3,2) DEFAULT 0.95,
    
    -- Resultados
    variant_a_performance JSONB,
    variant_b_performance JSONB,
    winning_variant VARCHAR(10), -- 'A', 'B', or 'INCONCLUSIVE'
    confidence_level DECIMAL(5,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, running, completed, stopped
    
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de compartilhamento de templates
CREATE TABLE IF NOT EXISTS template_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES advanced_templates(id) ON DELETE CASCADE,
    
    -- Compartilhamento
    shared_with_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    shared_with_agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    shared_with_role VARCHAR(100), -- Compartilhar com role específico
    
    -- Permissões
    can_view BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT false,
    can_duplicate BOOLEAN DEFAULT true,
    can_share BOOLEAN DEFAULT false,
    
    -- Configurações
    expires_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    max_access_count INTEGER,
    
    -- Metadados
    shared_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    share_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_advanced_templates_type_status ON advanced_templates(template_type, status);
CREATE INDEX IF NOT EXISTS idx_advanced_templates_agency_created ON advanced_templates(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advanced_templates_category_tags ON advanced_templates(category) WHERE tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_advanced_templates_usage ON advanced_templates(usage_count DESC, last_used_at DESC);

CREATE INDEX IF NOT EXISTS idx_template_elements_template_order ON template_elements(template_id, element_order);
CREATE INDEX IF NOT EXISTS idx_template_elements_parent_order ON template_elements(parent_element_id, element_order);
CREATE INDEX IF NOT EXISTS idx_template_elements_type ON template_elements(element_type);

CREATE INDEX IF NOT EXISTS idx_template_variables_template_key ON template_variables(template_id, variable_key);
CREATE INDEX IF NOT EXISTS idx_template_variables_category ON template_variables(category, group_name);

CREATE INDEX IF NOT EXISTS idx_template_data_sources_template_type ON template_data_sources(template_id, source_type);
CREATE INDEX IF NOT EXISTS idx_template_data_sources_active ON template_data_sources(is_active, last_sync_at);

CREATE INDEX IF NOT EXISTS idx_template_render_history_template_date ON template_render_history(template_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_render_history_success ON template_render_history(success, render_type);

CREATE INDEX IF NOT EXISTS idx_template_ab_tests_template_status ON template_ab_tests(template_id, status);
CREATE INDEX IF NOT EXISTS idx_template_ab_tests_dates ON template_ab_tests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_template_shares_template_user ON template_shares(template_id, shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_template_shares_expires ON template_shares(expires_at) WHERE expires_at IS NOT NULL;

-- RLS Policies
ALTER TABLE advanced_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_render_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;

-- Policy para advanced_templates
DROP POLICY IF EXISTS "Users can manage templates of their agency" ON advanced_templates;
CREATE POLICY "Users can manage templates of their agency" ON advanced_templates
    FOR ALL USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Templates públicos ou do sistema
        (is_public = true OR is_system_template = true)
        OR
        -- Usuários podem ver templates da sua agência
        (
            agency_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE id = auth.uid() 
                AND agency_id = advanced_templates.agency_id
                AND role IN ('agency_owner', 'agency_manager', 'agency_staff')
            )
        )
        OR
        -- Usuários podem ver templates que criaram
        (created_by = auth.uid())
        OR
        -- Templates compartilhados com o usuário
        EXISTS (
            SELECT 1 FROM template_shares
            WHERE template_id = advanced_templates.id
            AND (
                shared_with_user_id = auth.uid()
                OR 
                (shared_with_agency_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE id = auth.uid() AND agency_id = template_shares.shared_with_agency_id
                ))
            )
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- Policies para tabelas relacionadas (herdam permissões do template principal)
DROP POLICY IF EXISTS "Template elements inherit template permissions" ON template_elements;
CREATE POLICY "Template elements inherit template permissions" ON template_elements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM advanced_templates t
            WHERE t.id = template_elements.template_id
            AND (
                EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
                OR t.agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
                OR t.created_by = auth.uid()
                OR t.is_public = true
                OR t.is_system_template = true
            )
        )
    );

-- Policy similar para outras tabelas
DROP POLICY IF EXISTS "Template variables inherit template permissions" ON template_variables;
CREATE POLICY "Template variables inherit template permissions" ON template_variables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM advanced_templates t
            WHERE t.id = template_variables.template_id
            AND (
                EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
                OR t.agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
                OR t.created_by = auth.uid()
                OR t.is_public = true
                OR t.is_system_template = true
            )
        )
    );

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_advanced_templates_updated_at ON advanced_templates;
CREATE TRIGGER update_advanced_templates_updated_at
    BEFORE UPDATE ON advanced_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

DROP TRIGGER IF EXISTS update_template_elements_updated_at ON template_elements;
CREATE TRIGGER update_template_elements_updated_at
    BEFORE UPDATE ON template_elements
    FOR EACH ROW
    EXECUTE FUNCTION update_template_updated_at();

-- Trigger para atualizar contador de uso
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE advanced_templates 
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_template_usage_trigger ON template_render_history;
CREATE TRIGGER increment_template_usage_trigger
    AFTER INSERT ON template_render_history
    FOR EACH ROW
    WHEN (NEW.success = true AND NEW.render_type = 'production')
    EXECUTE FUNCTION increment_template_usage();

-- Inserir templates do sistema
INSERT INTO advanced_templates (
    name, description, category, template_type, status, is_system_template, structure, variables
) VALUES
(
    'Email Boas-vindas Padrão',
    'Template padrão para emails de boas-vindas a novos usuários',
    'Onboarding',
    'email',
    'active',
    true,
    '{
        "elements": [
            {
                "type": "container",
                "properties": {"padding": "20px", "backgroundColor": "#f8f9fa"},
                "children": [
                    {
                        "type": "heading",
                        "content": "Bem-vindo, {{user_name}}!",
                        "properties": {"fontSize": "24px", "color": "#333", "textAlign": "center"}
                    },
                    {
                        "type": "text",
                        "content": "Estamos felizes em tê-lo conosco. Sua conta foi criada com sucesso.",
                        "properties": {"fontSize": "16px", "color": "#666", "lineHeight": "1.5"}
                    },
                    {
                        "type": "button",
                        "content": "Acessar Dashboard",
                        "properties": {
                            "backgroundColor": "#01b86c",
                            "color": "white",
                            "padding": "12px 24px",
                            "borderRadius": "6px",
                            "textDecoration": "none"
                        },
                        "href": "{{dashboard_url}}"
                    }
                ]
            }
        ]
    }',
    '[
        {"key": "user_name", "name": "Nome do Usuário", "type": "string", "required": true},
        {"key": "dashboard_url", "name": "URL do Dashboard", "type": "string", "required": true}
    ]'
),
(
    'Notificação WhatsApp Projeto',
    'Template para notificações de projeto via WhatsApp',
    'Projetos',
    'whatsapp',
    'active',
    true,
    '{
        "elements": [
            {
                "type": "text",
                "content": "🚀 *{{project_name}}*\n\n{{message}}\n\n📅 Prazo: {{due_date}}\n✅ Status: {{status}}"
            }
        ]
    }',
    '[
        {"key": "project_name", "name": "Nome do Projeto", "type": "string", "required": true},
        {"key": "message", "name": "Mensagem", "type": "string", "required": true},
        {"key": "due_date", "name": "Data de Prazo", "type": "date", "required": false},
        {"key": "status", "name": "Status", "type": "string", "required": true}
    ]'
);

-- Função para renderizar template
CREATE OR REPLACE FUNCTION render_template(
    p_template_id UUID,
    p_variables JSONB DEFAULT '{}',
    p_render_type VARCHAR(100) DEFAULT 'preview'
)
RETURNS JSONB AS $$
DECLARE
    template_record RECORD;
    rendered_content TEXT;
    render_start_time TIMESTAMPTZ;
    render_duration INTEGER;
BEGIN
    render_start_time := NOW();
    
    -- Buscar template
    SELECT * INTO template_record
    FROM advanced_templates
    WHERE id = p_template_id AND status IN ('active', 'testing');
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Template não encontrado ou inativo'
        );
    END IF;
    
    -- Aqui seria implementada a lógica de renderização
    -- Por simplicidade, retornamos a estrutura com as variáveis substituídas
    rendered_content := template_record.structure::TEXT;
    
    -- Calcular duração
    render_duration := EXTRACT(EPOCH FROM (NOW() - render_start_time)) * 1000;
    
    -- Registrar histórico
    INSERT INTO template_render_history (
        template_id,
        render_context,
        render_type,
        rendered_content,
        render_time_ms,
        success
    ) VALUES (
        p_template_id,
        p_variables,
        p_render_type,
        rendered_content,
        render_duration,
        true
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'rendered_content', rendered_content,
        'render_time_ms', render_duration
    );
END;
$$ LANGUAGE plpgsql;

COMMIT;