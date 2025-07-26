-- ===================================================================
-- FVSTUDIOS DASHBOARD - SAFE COMPLETE SETUP
-- ===================================================================
-- Script seguro que não tenta remover funções do sistema
-- Execute este script para configurar o sistema do zero
-- ===================================================================

-- ETAPA 1: LIMPEZA SEGURA
-- ===================================================================

-- Remover políticas RLS existentes (seguro)
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

-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- Remover triggers personalizados específicos
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS trigger_update_task_completed_at ON tasks;

-- Remover funções personalizadas específicas
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS update_task_completed_at() CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_projects(INTEGER) CASCADE;

-- Remover tabelas do sistema (em ordem de dependência)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;

-- ETAPA 2: CONFIGURAÇÃO INICIAL
-- ===================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ETAPA 3: CRIAR ESTRUTURA PRINCIPAL
-- ===================================================================

-- 1. Tabela de Agências
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    subscription_plan TEXT DEFAULT 'agency_basic',
    subscription_status TEXT DEFAULT 'active',
    stripe_customer_id TEXT,
    max_users INTEGER DEFAULT 5,
    max_projects INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Perfis de Usuário
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'free_user',
    company TEXT,
    phone TEXT,
    avatar_url TEXT,
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    subscription_plan TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',
    skills JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Contatos
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    position TEXT,
    type TEXT DEFAULT 'lead',
    status TEXT DEFAULT 'active',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Projetos
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    progress INTEGER DEFAULT 0,
    client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    budget_total NUMERIC(12,2),
    budget_spent NUMERIC(12,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Tarefas
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    position INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Eventos
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Notificações
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ETAPA 4: ÍNDICES BÁSICOS
-- ===================================================================

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX idx_projects_agency_id ON projects(agency_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ETAPA 5: FUNÇÕES BÁSICAS
-- ===================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para dashboard
CREATE OR REPLACE FUNCTION get_dashboard_projects(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    progress INTEGER,
    client JSON,
    budget_total NUMERIC,
    budget_spent NUMERIC,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    tasks JSON
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
        CASE 
            WHEN c.id IS NOT NULL THEN 
                json_build_object('id', c.id, 'name', c.name, 'email', c.email)
            ELSE 
                json_build_object('id', null, 'name', 'Cliente não informado', 'email', null)
        END as client,
        p.budget_total,
        p.budget_spent,
        p.start_date,
        p.end_date,
        p.created_at,
        p.updated_at,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', t.id,
                    'title', t.title,
                    'status', t.status,
                    'assigned_to', json_build_object('id', t.assigned_to, 'name', up.name)
                )
            ) FROM tasks t 
            LEFT JOIN user_profiles up ON up.id = t.assigned_to
            WHERE t.project_id = p.id),
            '[]'::json
        ) as tasks
    FROM projects p
    LEFT JOIN contacts c ON c.id = p.client_id
    ORDER BY p.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ETAPA 6: ROW LEVEL SECURITY
-- ===================================================================

-- Habilitar RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para admin
CREATE POLICY "Admin full access agencies" ON agencies FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access user_profiles" ON user_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access contacts" ON contacts FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access projects" ON projects FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access tasks" ON tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access calendar_events" ON calendar_events FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin full access notifications" ON notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para usuários normais
CREATE POLICY "Users see own profile" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users see own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users see own events" ON calendar_events FOR ALL USING (user_id = auth.uid());

-- Políticas para agências
CREATE POLICY "Agency members see agency data" ON contacts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.agency_id = contacts.agency_id
    )
);

CREATE POLICY "Agency members see agency projects" ON projects FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.agency_id = projects.agency_id
    )
);

CREATE POLICY "Agency members see project tasks" ON tasks FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        JOIN projects p ON p.agency_id = up.agency_id 
        WHERE up.id = auth.uid() 
        AND p.id = tasks.project_id
    ) OR assigned_to = auth.uid() OR created_by = auth.uid()
);

-- ETAPA 7: DADOS INICIAIS
-- ===================================================================

-- Inserir agência exemplo
INSERT INTO agencies (id, name, domain, max_users, max_projects) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'FVStudios', 'fvstudios.com', 50, 100)
ON CONFLICT DO NOTHING;

-- Inserir contatos de exemplo
INSERT INTO contacts (name, email, company, type, status, agency_id) VALUES
('João Silva', 'joao@exemplo.com', 'Empresa ABC', 'client', 'active', '550e8400-e29b-41d4-a716-446655440000'),
('Maria Santos', 'maria@exemplo.com', 'Empresa XYZ', 'lead', 'active', '550e8400-e29b-41d4-a716-446655440000'),
('Pedro Costa', 'pedro@exemplo.com', 'Startup Tech', 'prospect', 'active', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Inserir projetos de exemplo
INSERT INTO projects (name, description, status, priority, client_id, agency_id, budget_total) 
SELECT 
    'Projeto ' || c.name,
    'Projeto de marketing digital para ' || c.company,
    'active',
    'medium',
    c.id,
    c.agency_id,
    15000.00
FROM contacts c
LIMIT 3
ON CONFLICT DO NOTHING;

-- Inserir tarefas de exemplo
INSERT INTO tasks (title, description, project_id, status, priority, position)
SELECT 
    'Tarefa exemplo para ' || p.name,
    'Descrição da tarefa de exemplo',
    p.id,
    'todo',
    'medium',
    1
FROM projects p
LIMIT 5
ON CONFLICT DO NOTHING;

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '✅ SETUP COMPLETO!';
    RAISE NOTICE '🚀 Tabelas criadas: agencies, user_profiles, contacts, projects, tasks, calendar_events, notifications';
    RAISE NOTICE '🔐 RLS ativo com políticas básicas';
    RAISE NOTICE '📊 Função get_dashboard_projects() disponível';
    RAISE NOTICE '🎯 Sistema pronto para uso!';
END $$;