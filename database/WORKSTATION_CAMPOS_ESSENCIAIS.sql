-- ==================================================
-- WORKSTATION SCHEMA - CAMPOS ESSENCIAIS PARA SISTEMA INTELIGENTE
-- Implementar todos os campos críticos para funcionalidade completa
-- ==================================================

-- ========================================
-- 1. CRIAR TABELAS DE DEPARTAMENTOS E ESPECIALIZAÇÕES
-- ========================================

-- Tabela de Departamentos
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color para UI
    icon VARCHAR(50) DEFAULT 'building',
    manager_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    budget_monthly DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(agency_id, name)
);

-- Tabela de Especializações
CREATE TABLE IF NOT EXISTS specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    skill_level VARCHAR(20) DEFAULT 'intermediate', -- junior, intermediate, senior, expert
    hourly_rate DECIMAL(8,2) DEFAULT 0.00,
    color VARCHAR(7) DEFAULT '#8B5CF6',
    icon VARCHAR(50) DEFAULT 'star',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(agency_id, name),
    CHECK (skill_level IN ('junior', 'intermediate', 'senior', 'expert'))
);

-- ========================================
-- 2. ADICIONAR CAMPOS ESSENCIAIS AO USER_PROFILES
-- ========================================

-- Avatar URL para fotos de perfil
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Departamento do usuário
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Especialização principal do usuário
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS specialization_id UUID REFERENCES specializations(id) ON DELETE SET NULL;

-- Informações profissionais adicionais
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Data de contratação
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Disponibilidade (horas por semana)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS weekly_hours INTEGER DEFAULT 40;

-- Localização/timezone
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo';

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- ========================================
-- 3. CRIAR DEPARTAMENTOS E ESPECIALIZAÇÕES PADRÃO
-- ========================================

-- Departamentos padrão para FVStudios
INSERT INTO departments (
    id,
    agency_id,
    name,
    description,
    color,
    icon,
    budget_monthly,
    created_at,
    updated_at
) VALUES 
-- Departamento Criativo
(
    '10000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Criativo',
    'Design, Branding, Conteúdo Visual e Campanhas Criativas',
    '#8B5CF6',
    'palette',
    15000.00,
    NOW(),
    NOW()
),
-- Departamento de Desenvolvimento
(
    '10000000-0000-0000-0000-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Desenvolvimento',
    'Desenvolvimento Web, Mobile e Sistemas',
    '#3B82F6',
    'code',
    20000.00,
    NOW(),
    NOW()
),
-- Departamento de Marketing
(
    '10000000-0000-0000-0000-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Marketing Digital',
    'Social Media, Ads, SEO e Growth',
    '#10B981',
    'trending-up',
    12000.00,
    NOW(),
    NOW()
),
-- Departamento de Atendimento
(
    '10000000-0000-0000-0000-000000000004'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Atendimento',
    'Relacionamento com Cliente e Gestão de Projetos',
    '#F59E0B',
    'users',
    8000.00,
    NOW(),
    NOW()
)
ON CONFLICT (agency_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    budget_monthly = EXCLUDED.budget_monthly;

-- Especializações padrão
INSERT INTO specializations (
    id,
    agency_id,
    department_id,
    name,
    description,
    skill_level,
    hourly_rate,
    color,
    icon,
    created_at,
    updated_at
) VALUES 
-- Especializações Criativas
(
    '20000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000001'::UUID,
    'UI/UX Designer',
    'Design de interfaces e experiência do usuário',
    'senior',
    120.00,
    '#8B5CF6',
    'paintbrush',
    NOW(),
    NOW()
),
(
    '20000000-0000-0000-0000-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000001'::UUID,
    'Motion Designer',
    'Animações e vídeos promocionais',
    'intermediate',
    100.00,
    '#EC4899',
    'video',
    NOW(),
    NOW()
),
-- Especializações Desenvolvimento
(
    '20000000-0000-0000-0000-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000002'::UUID,
    'Full Stack Developer',
    'Desenvolvimento completo web e mobile',
    'expert',
    150.00,
    '#3B82F6',
    'code',
    NOW(),
    NOW()
),
(
    '20000000-0000-0000-0000-000000000004'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000002'::UUID,
    'Frontend Specialist',
    'Especialista em React, Next.js e interfaces',
    'senior',
    130.00,
    '#06B6D4',
    'monitor',
    NOW(),
    NOW()
),
-- Especializações Marketing
(
    '20000000-0000-0000-0000-000000000005'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000003'::UUID,
    'Social Media Manager',
    'Gestão de redes sociais e conteúdo',
    'senior',
    90.00,
    '#10B981',
    'share-2',
    NOW(),
    NOW()
),
(
    '20000000-0000-0000-0000-000000000006'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000003'::UUID,
    'Performance Marketing',
    'Campanhas pagas e otimização de conversão',
    'expert',
    140.00,
    '#EF4444',
    'target',
    NOW(),
    NOW()
),
-- Especializações Atendimento
(
    '20000000-0000-0000-0000-000000000007'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    '10000000-0000-0000-0000-000000000004'::UUID,
    'Project Manager',
    'Gestão de projetos e metodologias ágeis',
    'expert',
    110.00,
    '#F59E0B',
    'briefcase',
    NOW(),
    NOW()
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
    'handshake',
    NOW(),
    NOW()
)
ON CONFLICT (agency_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    skill_level = EXCLUDED.skill_level,
    hourly_rate = EXCLUDED.hourly_rate,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon;

-- ========================================
-- 4. ATUALIZAR PERFIS DOS USUÁRIOS COM INFORMAÇÕES COMPLETAS
-- ========================================

-- Franco (Owner) - Project Manager e Account Manager
UPDATE user_profiles SET
    avatar_url = 'https://ui-avatars.com/api/?name=Franco+FVStudios&background=3B82F6&color=fff&size=150',
    department_id = '10000000-0000-0000-0000-000000000004'::UUID, -- Atendimento
    specialization_id = '20000000-0000-0000-0000-000000000007'::UUID, -- Project Manager
    job_title = 'CEO & Project Manager',
    phone = '+55 11 99999-9999',
    bio = 'Founder da FVStudios, especialista em gestão de projetos e relacionamento com clientes. 10+ anos de experiência em agências digitais.',
    hire_date = '2020-01-01'::DATE,
    weekly_hours = 50,
    timezone = 'America/Sao_Paulo',
    location = 'São Paulo, SP'
WHERE id = '9a8772a1-1387-4b08-81f8-8e2ffdff55cc'::UUID;

-- Atendimento - Account Manager
UPDATE user_profiles SET
    avatar_url = 'https://ui-avatars.com/api/?name=Atendimento+FVStudios&background=F59E0B&color=fff&size=150',
    department_id = '10000000-0000-0000-0000-000000000004'::UUID, -- Atendimento
    specialization_id = '20000000-0000-0000-0000-000000000008'::UUID, -- Account Manager
    job_title = 'Account Manager',
    phone = '+55 11 98888-8888',
    bio = 'Especialista em relacionamento com cliente, garantindo a satisfação e retenção. Foco em resultados e crescimento sustentável.',
    hire_date = '2021-03-01'::DATE,
    weekly_hours = 40,
    timezone = 'America/Sao_Paulo',
    location = 'São Paulo, SP'
WHERE id = 'ab1e981a-5b0b-4aaf-af1d-6a6ff08cb551'::UUID;

-- Criativo - UI/UX Designer
UPDATE user_profiles SET
    avatar_url = 'https://ui-avatars.com/api/?name=Criativo+FVStudios&background=8B5CF6&color=fff&size=150',
    department_id = '10000000-0000-0000-0000-000000000001'::UUID, -- Criativo
    specialization_id = '20000000-0000-0000-0000-000000000001'::UUID, -- UI/UX Designer
    job_title = 'Creative Director',
    phone = '+55 11 97777-7777',
    bio = 'Designer especialista em UI/UX, branding e campanhas criativas. Paixão por criar experiências visuais impactantes.',
    hire_date = '2021-06-01'::DATE,
    weekly_hours = 40,
    timezone = 'America/Sao_Paulo',
    location = 'São Paulo, SP'
WHERE id = '791867dc-8ca5-4d3d-9118-2f5096bcd777'::UUID;

-- ========================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para departments
CREATE INDEX IF NOT EXISTS idx_departments_agency_id ON departments(agency_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- Índices para specializations
CREATE INDEX IF NOT EXISTS idx_specializations_agency_id ON specializations(agency_id);
CREATE INDEX IF NOT EXISTS idx_specializations_department_id ON specializations(department_id);
CREATE INDEX IF NOT EXISTS idx_specializations_skill_level ON specializations(skill_level);
CREATE INDEX IF NOT EXISTS idx_specializations_active ON specializations(is_active);

-- Índices para user_profiles (novos campos)
CREATE INDEX IF NOT EXISTS idx_user_profiles_department_id ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_specialization_id ON user_profiles(specialization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_hire_date ON user_profiles(hire_date);

-- ========================================
-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================

COMMENT ON TABLE departments IS 'Departamentos da agência para organização e orçamento';
COMMENT ON COLUMN departments.color IS 'Cor hexadecimal para identificação visual na UI';
COMMENT ON COLUMN departments.budget_monthly IS 'Orçamento mensal do departamento em reais';

COMMENT ON TABLE specializations IS 'Especializações técnicas dos profissionais';
COMMENT ON COLUMN specializations.skill_level IS 'Nível de senioridade: junior, intermediate, senior, expert';
COMMENT ON COLUMN specializations.hourly_rate IS 'Taxa por hora padrão da especialização em reais';

COMMENT ON COLUMN user_profiles.avatar_url IS 'URL da foto de perfil do usuário';
COMMENT ON COLUMN user_profiles.department_id IS 'Departamento ao qual o usuário pertence';
COMMENT ON COLUMN user_profiles.specialization_id IS 'Especialização principal do usuário';
COMMENT ON COLUMN user_profiles.weekly_hours IS 'Horas de trabalho por semana (default: 40)';
COMMENT ON COLUMN user_profiles.timezone IS 'Timezone do usuário para agendamentos';

-- ========================================
-- 7. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ========================================

-- Trigger para updated_at em departments
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_departments_updated_at_trigger ON departments;
CREATE TRIGGER update_departments_updated_at_trigger
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_departments_updated_at();

-- Trigger para updated_at em specializations
CREATE OR REPLACE FUNCTION update_specializations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_specializations_updated_at_trigger ON specializations;
CREATE TRIGGER update_specializations_updated_at_trigger
    BEFORE UPDATE ON specializations
    FOR EACH ROW
    EXECUTE FUNCTION update_specializations_updated_at();

-- ========================================
-- 8. VERIFICAÇÕES FINAIS
-- ========================================

-- Ver estrutura dos departamentos
SELECT 
    d.id,
    d.name,
    d.description,
    d.color,
    d.budget_monthly,
    d.is_active,
    COUNT(up.id) as total_members
FROM departments d
LEFT JOIN user_profiles up ON d.id = up.department_id
WHERE d.agency_id = '00000000-0000-0000-0000-000000000001'::UUID
GROUP BY d.id, d.name, d.description, d.color, d.budget_monthly, d.is_active
ORDER BY d.name;

-- Ver especializações com departamentos
SELECT 
    s.name as specialization,
    s.skill_level,
    s.hourly_rate,
    d.name as department,
    s.color,
    s.is_active
FROM specializations s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.agency_id = '00000000-0000-0000-0000-000000000001'::UUID
ORDER BY d.name, s.name;

-- Ver usuários com informações completas
SELECT 
    up.full_name,
    up.job_title,
    d.name as department,
    s.name as specialization,
    s.hourly_rate,
    up.weekly_hours,
    up.hire_date,
    up.avatar_url IS NOT NULL as has_avatar
FROM user_profiles up
LEFT JOIN departments d ON up.department_id = d.id
LEFT JOIN specializations s ON up.specialization_id = s.id
WHERE up.agency_id = '00000000-0000-0000-0000-000000000001'::UUID
ORDER BY up.full_name;

-- ==================================================
-- SCRIPT COMPLETO PARA CAMPOS ESSENCIAIS WORKSTATION
-- Execute este script para ter sistema 100% inteligente
-- ==================================================