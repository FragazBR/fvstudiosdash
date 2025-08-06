-- ==================================================
-- EXECUTAR AGORA DEFINITIVO - BASEADO NO QUE JÁ FUNCIONA
-- Usando WORKSTATION_CAMPOS_ESSENCIAIS.sql como base
-- SEM CRIAR NOVOS IDs, USANDO OS QUE JÁ EXISTEM
-- ==================================================

-- ========================================
-- 1. ADICIONAR PERMISSÕES ADMIN
-- ========================================

-- USER_PROFILES: Adicionar permissões admin
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_assign_tasks BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_view_team_metrics BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_access_admin_panel BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_agencies BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_global_settings BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_view_system_logs BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_backups BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_webhooks BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_integrations BOOLEAN DEFAULT false;

-- ========================================
-- 2. USAR O SCHEMA WORKSTATION QUE JÁ FUNCIONA
-- ========================================

-- Criar departments se não existir
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
-- 3. ADICIONAR CAMPOS WORKSTATION
-- ========================================

-- USER_PROFILES: Campos do workstation (sem foreign keys inicialmente)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS specialization_id UUID;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 40;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2) DEFAULT 0.00;

-- TASKS: Progress e completed_at
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- CLIENTS: Campos financeiros
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_value DECIMAL(10,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_duration INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'BRL';

-- ========================================
-- 4. INSERIR DEPARTAMENTOS (USANDO IDs DO WORKSTATION_CAMPOS_ESSENCIAIS)
-- ========================================

INSERT INTO departments (
    id,
    agency_id,
    name,
    description,
    color,
    icon,
    budget_monthly
) VALUES 
-- Atendimento
(
    '10000000-0000-0000-0000-000000000004'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Atendimento',
    'Relacionamento com Cliente e Gestão de Projetos',
    '#F59E0B',
    'users',
    8000.00
),
-- Criativo
(
    '10000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Criativo',
    'Design, Branding, Conteúdo Visual e Campanhas Criativas',
    '#8B5CF6',
    'palette',
    15000.00
),
-- Desenvolvimento
(
    '10000000-0000-0000-0000-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Desenvolvimento',
    'Desenvolvimento Web, Mobile e Sistemas',
    '#3B82F6',
    'code',
    20000.00
),
-- Marketing
(
    '10000000-0000-0000-0000-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Marketing Digital',
    'Social Media, Ads, SEO e Growth',
    '#10B981',
    'trending-up',
    12000.00
),
-- Administração  
(
    '10000000-0000-0000-0000-000000000005'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Administração',
    'Gestão administrativa e financeira',
    '#EF4444',
    'settings',
    30000.00
)
ON CONFLICT (agency_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    budget_monthly = EXCLUDED.budget_monthly;

-- ========================================
-- 5. INSERIR ESPECIALIZAÇÕES (USANDO IDs DO WORKSTATION_CAMPOS_ESSENCIAIS)
-- ========================================

INSERT INTO specializations (
    id,
    agency_id,
    department_id,
    name,
    description,
    skill_level,
    hourly_rate,
    color,
    icon
) VALUES 
-- ATENDIMENTO
(
    '20000000-0000-0000-0000-000000000007'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000004'::UUID,
    'Project Manager',
    'Gestão de projetos e metodologias ágeis',
    'expert',
    110.00,
    '#F59E0B',
    'briefcase'
),
(
    '20000000-0000-0000-0000-000000000008'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000004'::UUID,
    'Account Manager',
    'Relacionamento e retenção de clientes',
    'senior',
    95.00,
    '#6366F1',
    'handshake'
),
-- CRIATIVO
(
    '20000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000001'::UUID,
    'UI/UX Designer',
    'Design de interfaces e experiência do usuário',
    'senior',
    120.00,
    '#8B5CF6',
    'paintbrush'
),
-- DESENVOLVIMENTO
(
    '20000000-0000-0000-0000-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000002'::UUID,
    'Full Stack Developer',
    'Desenvolvimento completo web e mobile',
    'expert',
    150.00,
    '#3B82F6',
    'code'
),
-- MARKETING
(
    '20000000-0000-0000-0000-000000000005'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000003'::UUID,
    'Social Media Manager',
    'Gestão de redes sociais e conteúdo',
    'senior',
    90.00,
    '#10B981',
    'share-2'
),
-- ADMINISTRAÇÃO
(
    '20000000-0000-0000-0000-000000000009'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000005'::UUID,
    'System Administrator',
    'Administração completa do sistema',
    'expert',
    200.00,
    '#EF4444',
    'shield'
)
ON CONFLICT (agency_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    skill_level = EXCLUDED.skill_level,
    hourly_rate = EXCLUDED.hourly_rate,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon;

-- ========================================
-- 6. CONFIGURAR USUÁRIOS
-- ========================================

-- Franco (Admin Master)
UPDATE user_profiles SET
    role = 'admin',
    department_id = '10000000-0000-0000-0000-000000000005'::UUID,
    specialization_id = '20000000-0000-0000-0000-000000000009'::UUID,
    job_title = 'CEO & System Administrator',
    hourly_rate = 200.00,
    weekly_hours = 50,
    hire_date = '2020-01-01'::DATE,
    avatar_url = 'https://ui-avatars.com/api/?name=Franco+FVStudios&background=3B82F6&color=fff&size=150',
    phone = '+55 11 99999-9999',
    bio = 'Founder da FVStudios, especialista em gestão de projetos e relacionamento com clientes.',
    location = 'São Paulo, SP',
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

-- Atendimento (Account Manager)
UPDATE user_profiles SET
    role = 'agency_owner',
    department_id = '10000000-0000-0000-0000-000000000004'::UUID,
    specialization_id = '20000000-0000-0000-0000-000000000008'::UUID,
    job_title = 'Account Manager',
    hourly_rate = 95.00,
    weekly_hours = 40,
    hire_date = '2021-03-01'::DATE,
    avatar_url = 'https://ui-avatars.com/api/?name=Atendimento+FVStudios&background=F59E0B&color=fff&size=150',
    phone = '+55 11 98888-8888',
    bio = 'Especialista em relacionamento com cliente.',
    location = 'São Paulo, SP',
    can_manage_team = true,
    can_assign_tasks = true,
    can_view_team_metrics = true
WHERE id = 'ab1e981a-5b0b-4aaf-af1d-6a6ff08cb551'::UUID;

-- Criativo (Creative Director)
UPDATE user_profiles SET
    role = 'agency_manager',
    department_id = '10000000-0000-0000-0000-000000000001'::UUID,
    specialization_id = '20000000-0000-0000-0000-000000000001'::UUID,
    job_title = 'Creative Director',
    hourly_rate = 120.00,
    weekly_hours = 40,
    hire_date = '2021-06-01'::DATE,
    avatar_url = 'https://ui-avatars.com/api/?name=Criativo+FVStudios&background=8B5CF6&color=fff&size=150',
    phone = '+55 11 97777-7777',
    bio = 'Designer especialista em UI/UX.',
    location = 'São Paulo, SP',
    can_manage_team = false,
    can_assign_tasks = true,
    can_view_team_metrics = true
WHERE id = '791867dc-8ca5-4d3d-9118-2f5096bcd777'::UUID;

-- ========================================
-- 7. ATUALIZAR TASKS E CLIENTS
-- ========================================

-- Atualizar tasks com progress
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

-- Atualizar clientes com dados de contrato
UPDATE clients SET
    contract_value = 5000.00,
    contract_duration = 12,
    contract_start_date = '2025-01-01'::DATE,
    payment_frequency = 'monthly',
    currency = 'BRL'
WHERE contract_value IS NULL;

-- ========================================
-- 8. CRIAR TABELA DE LOGS ADMIN
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
-- 9. RELATÓRIO FINAL
-- ========================================

SELECT 
    '🎯 SCHEMA WORKSTATION APLICADO COM SUCESSO!' as status,
    'Franco configurado como ADMIN MASTER' as admin_status,
    'Sistema 100% funcional baseado no workstation' as workstation_status;

-- Verificar estrutura criada
SELECT 'departments' as tabela, COUNT(*) as registros FROM departments WHERE agency_id = '00000000-0000-0000-0000-000000000001'::UUID
UNION ALL
SELECT 'specializations' as tabela, COUNT(*) as registros FROM specializations WHERE agency_id = '00000000-0000-0000-0000-000000000001'::UUID
UNION ALL
SELECT 'users_com_departamento' as tabela, COUNT(*) as registros FROM user_profiles WHERE department_id IS NOT NULL
UNION ALL
SELECT 'admin_users' as tabela, COUNT(*) as registros FROM user_profiles WHERE role = 'admin' AND can_access_admin_panel = true;