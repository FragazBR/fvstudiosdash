-- =============================================
-- Sistema de CMS Dinâmico para Gestão de Conteúdo
-- =============================================

-- Enum para tipos de conteúdo
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM (
        'page', 'post', 'article', 'product', 'service', 
        'case_study', 'testimonial', 'faq', 'team_member',
        'portfolio_item', 'landing_page', 'email_template',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de conteúdo
DO $$ BEGIN
    CREATE TYPE content_status AS ENUM (
        'draft', 'review', 'scheduled', 'published', 
        'archived', 'deleted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de campo
DO $$ BEGIN
    CREATE TYPE field_type AS ENUM (
        'text', 'textarea', 'rich_text', 'number', 'email', 'url',
        'date', 'datetime', 'boolean', 'select', 'multiselect',
        'image', 'file', 'gallery', 'video', 'color',
        'json', 'relation', 'location', 'repeater'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela para tipos de conteúdo personalizados
CREATE TABLE IF NOT EXISTS cms_content_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração básica
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    
    -- Configurações de comportamento
    is_system BOOLEAN DEFAULT FALSE,
    is_hierarchical BOOLEAN DEFAULT FALSE,
    has_categories BOOLEAN DEFAULT FALSE,
    has_tags BOOLEAN DEFAULT FALSE,
    has_comments BOOLEAN DEFAULT FALSE,
    has_seo BOOLEAN DEFAULT TRUE,
    has_featured_image BOOLEAN DEFAULT TRUE,
    
    -- Configurações de URL
    url_pattern VARCHAR(255),
    list_url_pattern VARCHAR(255),
    
    -- Schema dos campos
    field_schema JSONB DEFAULT '[]',
    
    -- Configurações de listagem
    list_fields TEXT[] DEFAULT ARRAY['title', 'status', 'created_at'],
    search_fields TEXT[] DEFAULT ARRAY['title', 'content'],
    sortable_fields TEXT[] DEFAULT ARRAY['title', 'created_at', 'updated_at'],
    
    -- Configurações de permissão
    permission_roles TEXT[] DEFAULT ARRAY['admin', 'agency_owner', 'agency_manager'],
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, slug)
);

-- Tabela principal de conteúdo
CREATE TABLE IF NOT EXISTS cms_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    content_type_id UUID NOT NULL REFERENCES cms_content_types(id) ON DELETE CASCADE,
    
    -- Informações básicas
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500),
    excerpt TEXT,
    content TEXT,
    
    -- Conteúdo estruturado (campos customizados)
    custom_fields JSONB DEFAULT '{}',
    
    -- Configurações de publicação
    status content_status DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'public', -- public, private, password
    password VARCHAR(255),
    
    -- Datas importantes
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Hierarquia
    parent_id UUID REFERENCES cms_contents(id) ON DELETE CASCADE,
    menu_order INTEGER DEFAULT 0,
    
    -- SEO
    seo_title VARCHAR(200),
    seo_description TEXT,
    seo_keywords TEXT,
    seo_og_image TEXT,
    seo_canonical_url TEXT,
    
    -- Imagem destacada
    featured_image_url TEXT,
    featured_image_alt TEXT,
    
    -- Métricas
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- Versionamento
    version INTEGER DEFAULT 1,
    revision_parent_id UUID REFERENCES cms_contents(id) ON DELETE CASCADE,
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    published_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, slug) WHERE status != 'deleted'
);

-- Tabela para categorias
CREATE TABLE IF NOT EXISTS cms_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    content_type_id UUID NOT NULL REFERENCES cms_content_types(id) ON DELETE CASCADE,
    
    -- Informações da categoria
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color
    icon VARCHAR(50),
    
    -- Hierarquia
    parent_id UUID REFERENCES cms_categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    
    -- SEO
    seo_title VARCHAR(200),
    seo_description TEXT,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, content_type_id, slug)
);

-- Tabela para tags
CREATE TABLE IF NOT EXISTS cms_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Informações da tag
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color
    
    -- Métricas
    usage_count INTEGER DEFAULT 0,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, slug)
);

-- Tabela de relacionamento conteúdo-categoria
CREATE TABLE IF NOT EXISTS cms_content_categories (
    content_id UUID NOT NULL REFERENCES cms_contents(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES cms_categories(id) ON DELETE CASCADE,
    
    PRIMARY KEY(content_id, category_id)
);

-- Tabela de relacionamento conteúdo-tag
CREATE TABLE IF NOT EXISTS cms_content_tags (
    content_id UUID NOT NULL REFERENCES cms_contents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES cms_tags(id) ON DELETE CASCADE,
    
    PRIMARY KEY(content_id, tag_id)
);

-- Tabela para templates de conteúdo
CREATE TABLE IF NOT EXISTS cms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    content_type_id UUID REFERENCES cms_content_types(id) ON DELETE CASCADE,
    
    -- Informações do template
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Conteúdo do template
    template_content TEXT,
    template_fields JSONB DEFAULT '{}',
    
    -- Configurações
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, content_type_id, is_default) WHERE is_default = TRUE
);

-- Tabela para histórico de revisões
CREATE TABLE IF NOT EXISTS cms_content_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES cms_contents(id) ON DELETE CASCADE,
    
    -- Snapshot do conteúdo
    title VARCHAR(500),
    content TEXT,
    custom_fields JSONB DEFAULT '{}',
    status content_status,
    
    -- Informações da revisão
    revision_note TEXT,
    version INTEGER NOT NULL,
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para comentários (se habilitado)
CREATE TABLE IF NOT EXISTS cms_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES cms_contents(id) ON DELETE CASCADE,
    
    -- Informações do comentário
    author_name VARCHAR(200),
    author_email VARCHAR(255),
    author_url VARCHAR(500),
    author_ip INET,
    
    -- Conteúdo do comentário
    comment_content TEXT NOT NULL,
    
    -- Status e moderação
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, spam, trash
    is_reply BOOLEAN DEFAULT FALSE,
    parent_comment_id UUID REFERENCES cms_comments(id) ON DELETE CASCADE,
    
    -- Metadados
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para formulários dinâmicos
CREATE TABLE IF NOT EXISTS cms_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração do formulário
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Schema dos campos
    field_schema JSONB NOT NULL DEFAULT '[]',
    
    -- Configurações de comportamento
    submit_action VARCHAR(50) DEFAULT 'email', -- email, webhook, database
    submit_config JSONB DEFAULT '{}',
    
    -- Configurações de email
    notification_emails TEXT[],
    success_message TEXT,
    error_message TEXT,
    
    -- Configurações avançadas
    requires_auth BOOLEAN DEFAULT FALSE,
    allow_file_uploads BOOLEAN DEFAULT FALSE,
    max_submissions_per_user INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para submissões de formulários
CREATE TABLE IF NOT EXISTS cms_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES cms_forms(id) ON DELETE CASCADE,
    
    -- Dados da submissão
    form_data JSONB NOT NULL,
    
    -- Informações do visitante
    visitor_ip INET,
    visitor_user_agent TEXT,
    visitor_referer TEXT,
    
    -- Informações do usuário (se logado)
    submitted_by UUID REFERENCES auth.users(id),
    
    -- Status de processamento
    status VARCHAR(20) DEFAULT 'new', -- new, processed, archived
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para menus
CREATE TABLE IF NOT EXISTS cms_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração do menu
    name VARCHAR(200) NOT NULL,
    location VARCHAR(100), -- header, footer, sidebar, etc.
    description TEXT,
    
    -- Estrutura do menu
    menu_items JSONB DEFAULT '[]',
    
    -- Configurações
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(agency_id, location)
);

-- Tabela para widgets/blocos reutilizáveis
CREATE TABLE IF NOT EXISTS cms_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Configuração do widget
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- text, image, gallery, form, etc.
    description TEXT,
    
    -- Conteúdo do widget
    widget_content JSONB NOT NULL DEFAULT '{}',
    
    -- Configurações de exibição
    css_classes TEXT,
    custom_css TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_global BOOLEAN DEFAULT FALSE, -- pode ser usado em qualquer página
    
    -- Metadados
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_cms_contents_agency_id ON cms_contents(agency_id);
CREATE INDEX IF NOT EXISTS idx_cms_contents_content_type_id ON cms_contents(content_type_id);
CREATE INDEX IF NOT EXISTS idx_cms_contents_status ON cms_contents(status);
CREATE INDEX IF NOT EXISTS idx_cms_contents_published_at ON cms_contents(published_at);
CREATE INDEX IF NOT EXISTS idx_cms_contents_slug ON cms_contents(agency_id, slug);
CREATE INDEX IF NOT EXISTS idx_cms_contents_parent_id ON cms_contents(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cms_categories_content_type_id ON cms_categories(content_type_id);
CREATE INDEX IF NOT EXISTS idx_cms_categories_parent_id ON cms_categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cms_categories_slug ON cms_categories(agency_id, slug);

CREATE INDEX IF NOT EXISTS idx_cms_tags_agency_id ON cms_tags(agency_id);
CREATE INDEX IF NOT EXISTS idx_cms_tags_slug ON cms_tags(agency_id, slug);

CREATE INDEX IF NOT EXISTS idx_cms_content_revisions_content_id ON cms_content_revisions(content_id);
CREATE INDEX IF NOT EXISTS idx_cms_content_revisions_version ON cms_content_revisions(content_id, version);

CREATE INDEX IF NOT EXISTS idx_cms_comments_content_id ON cms_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_cms_comments_status ON cms_comments(status);
CREATE INDEX IF NOT EXISTS idx_cms_comments_parent ON cms_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cms_form_submissions_form_id ON cms_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_cms_form_submissions_created_at ON cms_form_submissions(created_at);

-- Índices de texto completo
CREATE INDEX IF NOT EXISTS idx_cms_contents_search ON cms_contents USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(content, '')));

-- RLS (Row Level Security)
ALTER TABLE cms_content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_widgets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cms_content_types
CREATE POLICY "Users can view agency content types"
    ON cms_content_types FOR SELECT
    USING (
        agency_id IS NULL OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = cms_content_types.agency_id
        )
    );

CREATE POLICY "Agency admins can manage content types"
    ON cms_content_types FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = cms_content_types.agency_id
            AND up.role IN ('agency_owner', 'agency_manager', 'admin')
        )
    );

-- Políticas RLS para cms_contents
CREATE POLICY "Users can view published content"
    ON cms_contents FOR SELECT
    USING (
        status = 'published' OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = cms_contents.agency_id
        )
    );

CREATE POLICY "Content creators can manage their content"
    ON cms_contents FOR ALL
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = cms_contents.agency_id
            AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff', 'admin')
        )
    );

-- Políticas similares para outras tabelas
CREATE POLICY "Agency members can view categories"
    ON cms_categories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = cms_categories.agency_id
        )
    );

CREATE POLICY "Content creators can manage categories"
    ON cms_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid()
            AND up.agency_id = cms_categories.agency_id
            AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff', 'admin')
        )
    );

-- Função para criar revisão automaticamente
CREATE OR REPLACE FUNCTION create_content_revision()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar revisão apenas se o conteúdo mudou significativamente
    IF TG_OP = 'UPDATE' AND (
        OLD.title != NEW.title OR 
        OLD.content != NEW.content OR 
        OLD.custom_fields != NEW.custom_fields OR
        OLD.status != NEW.status
    ) THEN
        INSERT INTO cms_content_revisions (
            content_id, title, content, custom_fields, status,
            revision_note, version, created_by
        ) VALUES (
            NEW.id, OLD.title, OLD.content, OLD.custom_fields, OLD.status,
            'Auto-revision on update', OLD.version, NEW.updated_by
        );
        
        -- Atualizar versão
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar revisões
CREATE TRIGGER trigger_create_content_revision
    BEFORE UPDATE ON cms_contents
    FOR EACH ROW
    EXECUTE FUNCTION create_content_revision();

-- Função para atualizar contadores de tags
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE cms_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE cms_tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para contadores de tags
CREATE TRIGGER trigger_update_tag_usage_on_insert
    AFTER INSERT ON cms_content_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER trigger_update_tag_usage_on_delete
    AFTER DELETE ON cms_content_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

-- Função para busca avançada de conteúdo
CREATE OR REPLACE FUNCTION search_cms_content(
    p_agency_id UUID,
    p_query TEXT,
    p_content_type_id UUID DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_tag_id UUID DEFAULT NULL,
    p_status content_status DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title VARCHAR(500),
    excerpt TEXT,
    slug VARCHAR(500),
    status content_status,
    published_at TIMESTAMP WITH TIME ZONE,
    featured_image_url TEXT,
    content_type_name VARCHAR(100),
    category_names TEXT[],
    tag_names TEXT[],
    search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.excerpt,
        c.slug,
        c.status,
        c.published_at,
        c.featured_image_url,
        ct.name as content_type_name,
        ARRAY_AGG(DISTINCT cat.name) FILTER (WHERE cat.name IS NOT NULL) as category_names,
        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tag_names,
        ts_rank(to_tsvector('portuguese', c.title || ' ' || COALESCE(c.content, '')), plainto_tsquery('portuguese', p_query)) as search_rank
    FROM cms_contents c
    JOIN cms_content_types ct ON ct.id = c.content_type_id
    LEFT JOIN cms_content_categories cc ON cc.content_id = c.id
    LEFT JOIN cms_categories cat ON cat.id = cc.category_id
    LEFT JOIN cms_content_tags ctag ON ctag.content_id = c.id
    LEFT JOIN cms_tags t ON t.id = ctag.tag_id
    WHERE c.agency_id = p_agency_id
    AND (p_content_type_id IS NULL OR c.content_type_id = p_content_type_id)
    AND (p_category_id IS NULL OR cc.category_id = p_category_id)
    AND (p_tag_id IS NULL OR ctag.tag_id = p_tag_id)
    AND (p_status IS NULL OR c.status = p_status)
    AND (
        p_query IS NULL OR
        to_tsvector('portuguese', c.title || ' ' || COALESCE(c.content, '')) @@ plainto_tsquery('portuguese', p_query)
    )
    GROUP BY c.id, c.title, c.excerpt, c.slug, c.status, c.published_at, c.featured_image_url, ct.name, c.title, c.content
    ORDER BY 
        CASE WHEN p_query IS NOT NULL THEN search_rank ELSE 0 END DESC,
        c.published_at DESC NULLS LAST,
        c.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Função para obter estatísticas do CMS
CREATE OR REPLACE FUNCTION get_cms_stats(
    p_agency_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_contents BIGINT,
    published_contents BIGINT,
    draft_contents BIGINT,
    total_categories BIGINT,
    total_tags BIGINT,
    total_views BIGINT,
    recent_contents BIGINT,
    content_by_type JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    v_start_date := NOW() - (p_days_back || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        COUNT(c.id) as total_contents,
        COUNT(c.id) FILTER (WHERE c.status = 'published') as published_contents,
        COUNT(c.id) FILTER (WHERE c.status = 'draft') as draft_contents,
        COUNT(DISTINCT cat.id) as total_categories,
        COUNT(DISTINCT t.id) as total_tags,
        SUM(c.view_count) as total_views,
        COUNT(c.id) FILTER (WHERE c.created_at >= v_start_date) as recent_contents,
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'type', ct.name,
                'count', (
                    SELECT COUNT(*) 
                    FROM cms_contents c2 
                    WHERE c2.content_type_id = ct.id 
                    AND c2.agency_id = p_agency_id
                )
            )
        ) as content_by_type
    FROM cms_contents c
    JOIN cms_content_types ct ON ct.id = c.content_type_id
    LEFT JOIN cms_content_categories cc ON cc.content_id = c.id
    LEFT JOIN cms_categories cat ON cat.id = cc.category_id
    LEFT JOIN cms_content_tags ctag ON ctag.content_id = c.id
    LEFT JOIN cms_tags t ON t.id = ctag.tag_id
    WHERE c.agency_id = p_agency_id;
END;
$$;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_cms_content_types_updated_at
    BEFORE UPDATE ON cms_content_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_contents_updated_at
    BEFORE UPDATE ON cms_contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_categories_updated_at
    BEFORE UPDATE ON cms_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_tags_updated_at
    BEFORE UPDATE ON cms_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_templates_updated_at
    BEFORE UPDATE ON cms_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_forms_updated_at
    BEFORE UPDATE ON cms_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_menus_updated_at
    BEFORE UPDATE ON cms_menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cms_widgets_updated_at
    BEFORE UPDATE ON cms_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();