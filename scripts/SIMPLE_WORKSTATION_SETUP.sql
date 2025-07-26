-- ===================================================================
-- SETUP SIMPLES APENAS PARA WORKSTATION FUNCIONAR
-- ===================================================================
-- Execute este script para criar apenas o essencial
-- ===================================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpar tabelas se existirem (em ordem de dependência)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;

-- Remover funções se existirem
DROP FUNCTION IF EXISTS get_dashboard_projects(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ===================================================================
-- CRIAR TABELAS ESSENCIAIS
-- ===================================================================

-- 1. Tabela de Agências
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Perfis de Usuário
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    agency_id UUID REFERENCES agencies(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Contatos
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    agency_id UUID REFERENCES agencies(id),
    created_by UUID REFERENCES user_profiles(id),
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
    client_id UUID REFERENCES contacts(id),
    agency_id UUID REFERENCES agencies(id),
    created_by UUID REFERENCES user_profiles(id),
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
    assigned_to UUID REFERENCES user_profiles(id),
    created_by UUID REFERENCES user_profiles(id),
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    position INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- ÍNDICES BÁSICOS
-- ===================================================================

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX idx_projects_agency_id ON projects(agency_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ===================================================================
-- FUNÇÃO PARA DASHBOARD
-- ===================================================================

CREATE OR REPLACE FUNCTION get_dashboard_projects(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
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
                    'assigned_to', json_build_object('id', t.assigned_to)
                )
            ) FROM tasks t 
            WHERE t.project_id = p.id),
            '[]'::json
        ) as tasks
    FROM projects p
    LEFT JOIN contacts c ON c.id = p.client_id
    ORDER BY p.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- RLS BÁSICO APENAS PARA ADMIN
-- ===================================================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Permitir acesso total para todos (temporário para teste)
CREATE POLICY "Allow all for now" ON agencies FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON tasks FOR ALL USING (true);

-- ===================================================================
-- INSERIR DADOS DE EXEMPLO
-- ===================================================================

-- Inserir agência
INSERT INTO agencies (id, name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'FVStudios');

-- Inserir usuário admin
INSERT INTO user_profiles (id, email, name, role, agency_id) VALUES
('450e8400-e29b-41d4-a716-446655440000', 'admin@fvstudios.com', 'Admin Sistema', 'admin', '550e8400-e29b-41d4-a716-446655440000');

-- Inserir contatos
INSERT INTO contacts (name, email, company, agency_id, created_by) VALUES
('João Silva', 'joao@exemplo.com', 'Empresa ABC', '550e8400-e29b-41d4-a716-446655440000', '450e8400-e29b-41d4-a716-446655440000'),
('Maria Santos', 'maria@exemplo.com', 'Empresa XYZ', '550e8400-e29b-41d4-a716-446655440000', '450e8400-e29b-41d4-a716-446655440000'),
('Pedro Costa', 'pedro@exemplo.com', 'Startup Tech', '550e8400-e29b-41d4-a716-446655440000', '450e8400-e29b-41d4-a716-446655440000');

-- Inserir projetos
INSERT INTO projects (name, description, status, priority, client_id, agency_id, created_by, budget_total) VALUES
('Projeto Marketing João', 'Campanha de marketing digital para Empresa ABC', 'active', 'high', 
 (SELECT id FROM contacts WHERE email = 'joao@exemplo.com'), 
 '550e8400-e29b-41d4-a716-446655440000', 
 '450e8400-e29b-41d4-a716-446655440000', 15000.00),
('Projeto Social Media Maria', 'Gestão de redes sociais para Empresa XYZ', 'active', 'medium',
 (SELECT id FROM contacts WHERE email = 'maria@exemplo.com'), 
 '550e8400-e29b-41d4-a716-446655440000', 
 '450e8400-e29b-41d4-a716-446655440000', 8000.00),
('Projeto Website Pedro', 'Desenvolvimento de website para Startup Tech', 'active', 'medium',
 (SELECT id FROM contacts WHERE email = 'pedro@exemplo.com'), 
 '550e8400-e29b-41d4-a716-446655440000', 
 '450e8400-e29b-41d4-a716-446655440000', 12000.00);

-- Inserir tarefas
INSERT INTO tasks (title, description, project_id, created_by, status, priority, position) VALUES
('Definir estratégia de conteúdo', 'Elaborar plano de conteúdo mensal', 
 (SELECT id FROM projects WHERE name = 'Projeto Marketing João'), 
 '450e8400-e29b-41d4-a716-446655440000', 'todo', 'high', 1),
('Criar artes para Instagram', 'Desenvolver 10 posts para Instagram', 
 (SELECT id FROM projects WHERE name = 'Projeto Social Media Maria'), 
 '450e8400-e29b-41d4-a716-446655440000', 'in_progress', 'medium', 1),
('Wireframes do website', 'Criar wireframes das páginas principais', 
 (SELECT id FROM projects WHERE name = 'Projeto Website Pedro'), 
 '450e8400-e29b-41d4-a716-446655440000', 'todo', 'medium', 1),
('Configurar Google Analytics', 'Implementar tracking de conversões', 
 (SELECT id FROM projects WHERE name = 'Projeto Marketing João'), 
 '450e8400-e29b-41d4-a716-446655440000', 'completed', 'low', 2),
('Review final do site', 'Revisão completa antes do go-live', 
 (SELECT id FROM projects WHERE name = 'Projeto Website Pedro'), 
 '450e8400-e29b-41d4-a716-446655440000', 'todo', 'high', 2);

-- Mensagem final
SELECT 
    'SETUP COMPLETO!' as status,
    'Tabelas: agencies, user_profiles, contacts, projects, tasks' as tabelas,
    'Função: get_dashboard_projects() disponível' as funcao,
    'RLS: Políticas básicas ativas' as seguranca,
    'Dados: 1 agência, 1 usuário, 3 contatos, 3 projetos, 5 tarefas' as dados;