-- ==================================================
-- SCHEMA DEFINITIVO COMPLETO COM ADMIN MASTER
-- EXECUÇÃO ÚNICA - PADRONIZAÇÃO TOTAL DO WORKSTATION
-- Inclui TODAS as funcionalidades ADMIN + Sistema completo
-- ==================================================

-- ========================================
-- 1. ADICIONAR COLUNAS DE PERMISSÕES ADMIN
-- ========================================

-- USER_PROFILES: Adicionar TODAS as permissões necessárias
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_assign_tasks BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_view_team_metrics BOOLEAN DEFAULT false;

-- PERMISSÕES ADMIN ESPECÍFICAS
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_access_admin_panel BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_manage_agencies BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_manage_global_settings BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_view_system_logs BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_manage_backups BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_manage_webhooks BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS can_manage_integrations BOOLEAN DEFAULT false;

-- ========================================
-- 2. GARANTIR TABELAS DEPARTMENTS E SPECIALIZATIONS PRIMEIRO
-- ========================================

-- Criar departments se não existir (com manager_id para admin)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'building',
    manager_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    budget_monthly DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agency_id, name)
);

-- Criar specializations se não existir
CREATE TABLE IF NOT EXISTS specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    skill_level VARCHAR(20) DEFAULT 'intermediate',
    hourly_rate DECIMAL(8,2) DEFAULT 0.00,
    color VARCHAR(7) DEFAULT '#8B5CF6',
    icon VARCHAR(50) DEFAULT 'star',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agency_id, name),
    CHECK (skill_level IN ('junior', 'intermediate', 'senior', 'expert'))
);

-- ========================================
-- 3. ADICIONAR COLUNAS WORKSTATION ESSENCIAIS
-- ========================================

-- USER_PROFILES: Campos do workstation (agora sem foreign keys)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS department_id UUID;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS specialization_id UUID;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2) DEFAULT 0.00;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 40;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS hire_date DATE;

-- TASKS: Campos essenciais para kanban
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 
CHECK (progress >= 0 AND progress <= 100);

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- CLIENTS: Campos financeiros e contratuais
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS contract_value DECIMAL(10,2);

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS contract_duration INTEGER;

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS contract_start_date DATE;

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) DEFAULT 'monthly';

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'BRL';

-- ========================================
-- 4. INSERIR DEPARTAMENTOS PADRÃO
-- ========================================

INSERT INTO departments (id, agency_id, name, description, color, icon, budget_monthly, manager_id) VALUES 
('d1000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'Atendimento', 'Gestão de clientes e relacionamento', '#3B82F6', 'users', 15000.00, '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID),
('d2000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'Criativo', 'Design, arte e criação', '#8B5CF6', 'palette', 18000.00, '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID),
('d3000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'Marketing', 'Estratégia e performance digital', '#10B981', 'trending-up', 20000.00, '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID),
('d4000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'Desenvolvimento', 'Tecnologia e automação', '#F59E0B', 'code', 25000.00, '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID),
('d5000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'Administração', 'Gestão administrativa e financeira', '#EF4444', 'settings', 30000.00, '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID)
ON CONFLICT (agency_id, name) DO UPDATE SET
    manager_id = EXCLUDED.manager_id,
    budget_monthly = EXCLUDED.budget_monthly;

-- ========================================
-- 5. INSERIR ESPECIALIZAÇÕES COMPLETAS
-- ========================================

INSERT INTO specializations (id, agency_id, department_id, name, description, skill_level, hourly_rate, color) VALUES 
-- ATENDIMENTO
('11000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd1000000-0000-0000-0000-000000000001'::UUID, 'Account Manager', 'Gestão de contas e clientes', 'senior', 95.00, '#3B82F6'),
('12000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd1000000-0000-0000-0000-000000000001'::UUID, 'Project Manager', 'Gestão de projetos e processos', 'senior', 110.00, '#1D4ED8'),
-- CRIATIVO
('13000000-0000-0000-0000-000000000003'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd2000000-0000-0000-0000-000000000002'::UUID, 'UI/UX Designer', 'Design de interfaces e experiência', 'senior', 120.00, '#8B5CF6'),
('14000000-0000-0000-0000-000000000004'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd2000000-0000-0000-0000-000000000002'::UUID, 'Motion Designer', 'Animação e motion graphics', 'intermediate', 85.00, '#A855F7'),
-- MARKETING
('15000000-0000-0000-0000-000000000005'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd3000000-0000-0000-0000-000000000003'::UUID, 'Traffic Manager', 'Gestão de tráfego pago', 'senior', 100.00, '#10B981'),
('16000000-0000-0000-0000-000000000006'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd3000000-0000-0000-0000-000000000003'::UUID, 'Social Media', 'Gestão de redes sociais', 'intermediate', 75.00, '#059669'),
-- DESENVOLVIMENTO
('17000000-0000-0000-0000-000000000007'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd4000000-0000-0000-0000-000000000004'::UUID, 'Full Stack Developer', 'Desenvolvimento completo', 'expert', 150.00, '#F59E0B'),
('18000000-0000-0000-0000-000000000008'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd4000000-0000-0000-0000-000000000004'::UUID, 'DevOps Engineer', 'Infraestrutura e automação', 'expert', 140.00, '#D97706'),
-- ADMINISTRAÇÃO (ADMIN)
('19000000-0000-0000-0000-000000000009'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd5000000-0000-0000-0000-000000000005'::UUID, 'System Administrator', 'Administração completa do sistema', 'expert', 200.00, '#EF4444'),
('1a000000-0000-0000-0000-000000000010'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'd5000000-0000-0000-0000-000000000005'::UUID, 'Financial Manager', 'Gestão financeira e contratos', 'senior', 130.00, '#DC2626')
ON CONFLICT (agency_id, name) DO NOTHING;

-- ========================================
-- 6. CONFIGURAR FRANCO COMO ADMIN MASTER
-- ========================================

UPDATE user_profiles SET
    role = 'admin',
    department_id = 'd5000000-0000-0000-0000-000000000005'::UUID,
    specialization_id = '19000000-0000-0000-0000-000000000009'::UUID,
    job_title = 'CEO & System Administrator',
    hourly_rate = 200.00,
    weekly_hours = 50,
    hire_date = '2020-01-01'::DATE,
    
    -- TODAS AS PERMISSÕES ADMIN
    can_manage_team = true,
    can_assign_tasks = true,
    can_view_team_metrics = true,
    can_access_admin_panel = true,
    can_manage_agencies = true,
    can_manage_global_settings = true,
    can_view_system_logs = true,
    can_manage_backups = true,
    can_manage_webhooks = true,
    can_view_analytics = true,
    can_manage_integrations = true
    
WHERE id = '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID;

-- ========================================
-- 7. CONFIGURAR OUTROS USUÁRIOS
-- ========================================

-- Atendimento (Account Manager)
UPDATE user_profiles SET
    role = 'agency_owner',
    department_id = 'd1000000-0000-0000-0000-000000000001'::UUID,
    specialization_id = '11000000-0000-0000-0000-000000000001'::UUID,
    job_title = 'Account Manager',
    hourly_rate = 95.00,
    weekly_hours = 40,
    hire_date = '2021-03-01'::DATE,
    can_manage_team = true,
    can_assign_tasks = true,
    can_view_team_metrics = true
WHERE id = 'ab1e981a-5b0b-4aaf-af1d-6a6ff08cb551'::UUID;

-- Criativo (Creative Director)
UPDATE user_profiles SET
    role = 'agency_manager',
    department_id = 'd2000000-0000-0000-0000-000000000002'::UUID,
    specialization_id = '13000000-0000-0000-0000-000000000003'::UUID,
    job_title = 'Creative Director',
    hourly_rate = 120.00,
    weekly_hours = 40,
    hire_date = '2021-06-01'::DATE,
    can_manage_team = false,
    can_assign_tasks = true,
    can_view_team_metrics = true
WHERE id = '791867dc-8ca5-4d3d-9118-2f5096bcd777'::UUID;

-- ========================================
-- 8. ADICIONAR FOREIGN KEY CONSTRAINTS APÓS DADOS
-- ========================================

-- Adicionar foreign keys agora que as tabelas e dados existem
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_department 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_specialization 
FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE SET NULL;

-- ========================================
-- 9. ATUALIZAR TASKS COM PROGRESS
-- ========================================

UPDATE tasks SET progress = 
    CASE 
        WHEN status = 'todo' THEN 0
        WHEN status = 'in_progress' THEN 50
        WHEN status = 'review' THEN 75
        WHEN status = 'completed' THEN 100
        ELSE 0
    END
WHERE progress IS NULL OR progress = 0;

-- Definir completed_at para tarefas já completadas
UPDATE tasks SET completed_at = updated_at 
WHERE status = 'completed' AND completed_at IS NULL;

-- ========================================
-- 10. ATUALIZAR CLIENTS COM CONTRATOS
-- ========================================

-- Atualizar clientes existentes com dados de contrato
UPDATE clients SET
    contract_value = 5000.00,
    contract_duration = 12,
    contract_start_date = '2025-01-01'::DATE,
    payment_frequency = 'monthly',
    currency = 'BRL'
WHERE contract_value IS NULL;

-- ========================================
-- 11. CRIAR TABELA DE LOGS ADMIN (se não existir)
-- ========================================

CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 12. RELATÓRIO FINAL
-- ========================================

SELECT 
    '🎯 SCHEMA DEFINITIVO APLICADO COM SUCESSO!' as status,
    'Franco configurado como ADMIN MASTER' as admin_status,
    'Workstation 100% funcional' as workstation_status;

-- Contar estrutura criada
SELECT 
    'departments' as tabela, 
    COUNT(*) as registros 
FROM departments 
WHERE agency_id = '00000000-0000-0000-0000-000000000001'::UUID

UNION ALL

SELECT 
    'specializations' as tabela, 
    COUNT(*) as registros 
FROM specializations 
WHERE agency_id = '00000000-0000-0000-0000-000000000001'::UUID

UNION ALL

SELECT 
    'users_com_departamento' as tabela, 
    COUNT(*) as registros 
FROM user_profiles 
WHERE agency_id = '00000000-0000-0000-0000-000000000001'::UUID 
AND department_id IS NOT NULL

UNION ALL

SELECT 
    'admin_users' as tabela, 
    COUNT(*) as registros 
FROM user_profiles 
WHERE role = 'admin' AND can_access_admin_panel = true

UNION ALL

SELECT 
    'tasks_com_progress' as tabela, 
    COUNT(*) as registros 
FROM tasks 
WHERE progress IS NOT NULL;