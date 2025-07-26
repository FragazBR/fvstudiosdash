-- ===================================================================
-- FVSTUDIOS DASHBOARD - COMPLETE RESET AND FRESH SETUP
-- ===================================================================
-- Execute este script para limpar tudo e criar o sistema do zero
-- Baseado na documentação completa do README.md
-- ===================================================================

-- ETAPA 1: LIMPEZA COMPLETA
-- ===================================================================

-- Remover todas as políticas RLS existentes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname 
               FROM pg_policies 
               WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Remover todos os triggers personalizados
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN SELECT trigger_name, event_object_table 
                FROM information_schema.triggers 
                WHERE trigger_schema = 'public' 
                AND trigger_name LIKE '%update%' OR trigger_name LIKE '%audit%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trig.trigger_name, trig.event_object_table);
    END LOOP;
END $$;

-- Remover apenas funções personalizadas específicas do sistema
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS update_task_completed_at() CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_projects(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_agency_metrics() CASCADE;
DROP FUNCTION IF EXISTS process_website_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_user_with_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

-- Remover todas as tabelas do sistema
DROP TABLE IF EXISTS 
    task_time_logs,
    task_comments,
    tasks,
    contact_interactions,
    contact_tags,
    contacts,
    agency_onboarding,
    discount_coupons,
    invoices,
    agency_subscriptions,
    agency_leads,
    calendar_events,
    notifications,
    project_metrics,
    projects,
    client_api_configs,
    user_invitations,
    agencies,
    user_profiles
CASCADE;

-- ETAPA 2: CONFIGURAÇÃO INICIAL
-- ===================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ETAPA 3: CRIAR ESTRUTURA PRINCIPAL
-- ===================================================================

-- 1. Tabela de Agências (Multi-tenant master)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    subscription_plan TEXT DEFAULT 'agency_basic' CHECK (subscription_plan IN ('agency_basic', 'agency_pro', 'agency_enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    max_users INTEGER DEFAULT 5,
    max_projects INTEGER DEFAULT 10,
    max_clients INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Perfis de Usuário (Sistema de 9 roles)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN (
        'admin', 'agency_owner', 'agency_manager', 'agency_staff', 
        'agency_client', 'independent_producer', 'independent_client', 
        'influencer', 'free_user'
    )),
    company TEXT,
    phone TEXT,
    avatar_url TEXT,
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    department_id UUID,
    specialization_id UUID,
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
    stripe_customer_id TEXT,
    skills JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Convites (Sistema de gestão de equipes)
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL CHECK (role IN (
        'agency_manager', 'agency_staff', 'agency_client'
    )),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    company TEXT,
    phone TEXT,
    welcome_message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    token UUID DEFAULT gen_random_uuid() UNIQUE,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Contatos
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    position TEXT,
    type TEXT DEFAULT 'lead' CHECK (type IN ('lead', 'prospect', 'client', 'partner')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'converted', 'lost')),
    source TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    address JSONB DEFAULT '{}',
    website TEXT,
    social_media JSONB DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    total_project_value NUMERIC(12,2) DEFAULT 0,
    active_projects INTEGER DEFAULT 0,
    last_contact_date TIMESTAMPTZ,
    next_followup_date TIMESTAMPTZ,
    lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'marketing_qualified', 'sales_qualified', 'opportunity', 'customer', 'evangelist')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Projetos
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'draft', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    color TEXT DEFAULT '#3b82f6',
    tags TEXT[] DEFAULT '{}',
    client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    budget_total NUMERIC(12,2),
    budget_spent NUMERIC(12,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Tarefas
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    position INTEGER DEFAULT 0,
    estimated_hours NUMERIC(5,2),
    actual_hours NUMERIC(5,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    comments_count INTEGER DEFAULT 0,
    dependencies TEXT[] DEFAULT '{}',
    labels TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Eventos/Calendário
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,
    event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'deadline', 'reminder', 'milestone')),
    color TEXT DEFAULT '#3b82f6',
    attendees JSONB DEFAULT '[]',
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Notificações
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'project', 'task', 'payment', 'system')),
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    related_type TEXT,
    action_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ETAPA 4: ÍNDICES PARA PERFORMANCE
-- ===================================================================

-- Índices para user_profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_agency_id ON user_profiles(agency_id);

-- Índices para contacts
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX idx_contacts_created_by ON contacts(created_by);
CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_status ON contacts(status);

-- Índices para projects
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_agency_id ON projects(agency_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);

-- Índices para tasks
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Índices para events
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_project_id ON calendar_events(project_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ETAPA 5: FUNÇÕES E TRIGGERS
-- ===================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger de updated_at em todas as tabelas relevantes
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON user_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'free_user';
    user_name TEXT := '';
BEGIN
    -- Extrair nome do email se disponível
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1));
    
    -- Definir role baseado no domínio do email
    IF NEW.email LIKE '%@fvstudios.com' THEN
        user_role := 'admin';
    END IF;
    
    -- Inserir perfil
    INSERT INTO user_profiles (id, email, name, role)
    VALUES (NEW.id, NEW.email, user_name, user_role);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar perfil automaticamente
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Função para atualizar completed_at quando task é marcada como completed
CREATE OR REPLACE FUNCTION update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
        NEW.progress = 100;
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_task_completed_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_task_completed_at();

-- ETAPA 6: ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para agencies
CREATE POLICY "Admin full access agencies" ON agencies FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency owners see own agency" ON agencies FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND agency_id = agencies.id 
        AND role IN ('agency_owner', 'agency_manager')
    )
);

-- Políticas para user_profiles
CREATE POLICY "Admin full access user_profiles" ON user_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see own profile" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Agency members see team" ON user_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.agency_id = user_profiles.agency_id 
        AND up.role IN ('agency_owner', 'agency_manager')
    )
);

-- Políticas para contacts
CREATE POLICY "Admin full access contacts" ON contacts FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency members see own agency contacts" ON contacts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.agency_id = contacts.agency_id
        AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
    )
);

CREATE POLICY "Users see assigned contacts" ON contacts FOR SELECT USING (
    assigned_to = auth.uid() OR created_by = auth.uid()
);

-- Políticas para projects
CREATE POLICY "Admin full access projects" ON projects FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency members see own agency projects" ON projects FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.agency_id = projects.agency_id
        AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
    )
);

CREATE POLICY "Clients see own projects" ON projects FOR SELECT USING (
    client_id IN (
        SELECT id FROM contacts 
        WHERE assigned_to = auth.uid() OR created_by = auth.uid()
    )
);

-- Políticas para tasks
CREATE POLICY "Admin full access tasks" ON tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agency members see own agency tasks" ON tasks FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        JOIN projects p ON p.agency_id = up.agency_id 
        WHERE up.id = auth.uid() 
        AND p.id = tasks.project_id
        AND up.role IN ('agency_owner', 'agency_manager', 'agency_staff')
    )
);

CREATE POLICY "Users see assigned tasks" ON tasks FOR ALL USING (
    assigned_to = auth.uid() OR created_by = auth.uid()
);

-- Políticas para calendar_events
CREATE POLICY "Admin full access calendar_events" ON calendar_events FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see own events" ON calendar_events FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Agency members see team events" ON calendar_events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up1
        JOIN user_profiles up2 ON up1.agency_id = up2.agency_id
        WHERE up1.id = auth.uid() 
        AND up2.id = calendar_events.user_id
        AND up1.role IN ('agency_owner', 'agency_manager')
    )
);

-- Políticas para notifications
CREATE POLICY "Admin full access notifications" ON notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- ETAPA 7: DADOS INICIAIS
-- ===================================================================

-- Inserir agência exemplo
INSERT INTO agencies (id, name, domain, subscription_plan, max_users, max_projects, max_clients) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'FVStudios', 'fvstudios.com', 'agency_enterprise', 50, 100, 100)
ON CONFLICT DO NOTHING;

-- Inserir usuário admin (será criado via trigger quando fizer login)
-- O perfil será criado automaticamente quando o usuário se registrar

-- Inserir alguns contatos de exemplo
INSERT INTO contacts (name, email, company, type, status, agency_id) VALUES
('João Silva', 'joao@exemplo.com', 'Empresa ABC', 'client', 'active', '550e8400-e29b-41d4-a716-446655440000'),
('Maria Santos', 'maria@exemplo.com', 'Empresa XYZ', 'lead', 'active', '550e8400-e29b-41d4-a716-446655440000'),
('Pedro Costa', 'pedro@exemplo.com', 'Startup Tech', 'prospect', 'active', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- ETAPA 8: FUNÇÕES PARA DASHBOARD
-- ===================================================================

-- Função para buscar projetos do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_projects(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    progress INTEGER,
    client_name TEXT,
    client_email TEXT,
    budget_total NUMERIC,
    budget_spent NUMERIC,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    tasks_count BIGINT,
    completed_tasks_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.priority,
        p.progress,
        c.name as client_name,
        c.email as client_email,
        p.budget_total,
        p.budget_spent,
        p.start_date,
        p.end_date,
        p.created_at,
        p.updated_at,
        COALESCE(t.task_count, 0) as tasks_count,
        COALESCE(t.completed_count, 0) as completed_tasks_count
    FROM projects p
    LEFT JOIN contacts c ON c.id = p.client_id
    LEFT JOIN (
        SELECT 
            project_id,
            COUNT(*) as task_count,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_count
        FROM tasks
        GROUP BY project_id
    ) t ON t.project_id = p.id
    ORDER BY p.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- LIMPEZA FINAL
-- ===================================================================

-- Executar VACUUM para otimizar o banco
VACUUM ANALYZE;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ FVSTUDIOS DASHBOARD SETUP COMPLETO!';
    RAISE NOTICE '🚀 Sistema multi-tenant com 9 roles configurado';
    RAISE NOTICE '🔐 Row Level Security ativo';
    RAISE NOTICE '📊 Tabelas: agencies, user_profiles, contacts, projects, tasks, calendar_events, notifications';
    RAISE NOTICE '🎯 Próximo passo: Fazer login com email @fvstudios.com para ser admin';
END $$;