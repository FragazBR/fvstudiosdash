-- =============================================
-- ARQUITETURA COMPLETA - VERSÃO CORRIGIDA
-- =============================================

-- 1. Primeiro, remover tudo que pode causar conflito
DROP TABLE IF EXISTS integration_usage CASCADE;
DROP TABLE IF EXISTS user_integrations CASCADE;
DROP TABLE IF EXISTS available_integrations CASCADE;
DROP TABLE IF EXISTS agency_members CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Remover tipos existentes
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS integration_type CASCADE;
DROP TYPE IF EXISTS integration_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS agency_role CASCADE;

-- 2. Criar todos os ENUMs primeiro
CREATE TYPE user_role AS ENUM (
    'admin',
    'agency_owner',
    'agency_manager',
    'agency_employee',
    'independent_producer',
    'client',
    'freelancer',
    'influencer',
    'free'
);

CREATE TYPE plan_type AS ENUM (
    'free',
    'basic',
    'premium',
    'enterprise',
    'agency',
    'producer',
    'influencer'
);

CREATE TYPE user_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);

CREATE TYPE agency_role AS ENUM (
    'owner',
    'manager',
    'employee'
);

CREATE TYPE integration_type AS ENUM (
    'social_media',
    'analytics',
    'marketing',
    'design',
    'ai',
    'storage',
    'payment',
    'communication',
    'productivity',
    'other'
);

CREATE TYPE integration_status AS ENUM (
    'active',
    'inactive',
    'error',
    'expired',
    'pending'
);

-- 3. Criar tabela PROFILES primeiro (sem foreign keys para ela mesma)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'free',
    plan_type plan_type DEFAULT 'free',
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT false,
    
    -- Informações de contato
    phone TEXT,
    company TEXT,
    website TEXT,
    bio TEXT,
    location TEXT,
    
    -- Configurações
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'pt-BR',
    
    -- Controle de hierarquia (vamos adicionar as FKs depois)
    agency_id UUID,
    producer_id UUID,
    created_by UUID,
    
    -- Limites de integração por plano
    max_integrations INTEGER DEFAULT 3,
    max_clients INTEGER DEFAULT 5,
    max_projects INTEGER DEFAULT 10,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabela AGENCIES
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    
    -- Dono da agência
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Status e plano
    status user_status DEFAULT 'active',
    plan_type plan_type DEFAULT 'agency',
    
    -- Limites da agência
    max_employees INTEGER DEFAULT 10,
    max_clients INTEGER DEFAULT 50,
    max_integrations INTEGER DEFAULT 20,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar tabela AGENCY_MEMBERS
CREATE TABLE agency_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role agency_role NOT NULL,
    
    -- Permissões específicas
    can_manage_projects BOOLEAN DEFAULT false,
    can_manage_clients BOOLEAN DEFAULT false,
    can_manage_team BOOLEAN DEFAULT false,
    can_view_finances BOOLEAN DEFAULT false,
    
    -- Timestamps
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(agency_id, user_id)
);

-- 6. Agora adicionar as foreign keys para profiles
ALTER TABLE profiles 
ADD CONSTRAINT profiles_agency_fkey 
FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_producer_fkey 
FOREIGN KEY (producer_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 7. Criar tabela AVAILABLE_INTEGRATIONS
CREATE TABLE available_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    type integration_type NOT NULL,
    icon_url TEXT,
    website TEXT,
    
    -- Configurações de autenticação
    auth_type TEXT NOT NULL,
    auth_url TEXT,
    token_url TEXT,
    scopes TEXT[],
    
    -- Disponibilidade por plano
    available_for_free BOOLEAN DEFAULT false,
    available_for_basic BOOLEAN DEFAULT true,
    available_for_premium BOOLEAN DEFAULT true,
    available_for_enterprise BOOLEAN DEFAULT true,
    available_for_agency BOOLEAN DEFAULT true,
    available_for_producer BOOLEAN DEFAULT true,
    available_for_influencer BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Criar tabela USER_INTEGRATIONS
CREATE TABLE user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES available_integrations(id) ON DELETE CASCADE,
    
    -- Credenciais (criptografadas)
    encrypted_credentials JSONB NOT NULL,
    
    -- Configurações específicas
    settings JSONB DEFAULT '{}',
    
    -- Informações da conta conectada
    connected_account_id TEXT,
    connected_account_name TEXT,
    connected_account_email TEXT,
    
    -- Status da integração
    status integration_status DEFAULT 'pending',
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    
    -- Controle de acesso
    is_shared_with_agency BOOLEAN DEFAULT false,
    shared_permissions TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, integration_id)
);

-- 9. Criar tabela INTEGRATION_USAGE
CREATE TABLE integration_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_integration_id UUID NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Detalhes do uso
    action TEXT NOT NULL,
    endpoint TEXT,
    request_data JSONB,
    response_data JSONB,
    
    -- Métricas
    response_time INTEGER,
    status_code INTEGER,
    success BOOLEAN,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Criar todos os índices
CREATE INDEX profiles_role_idx ON profiles(role);
CREATE INDEX profiles_agency_idx ON profiles(agency_id);
CREATE INDEX profiles_producer_idx ON profiles(producer_id);
CREATE INDEX agency_members_agency_idx ON agency_members(agency_id);
CREATE INDEX agency_members_user_idx ON agency_members(user_id);
CREATE INDEX user_integrations_user_idx ON user_integrations(user_id);
CREATE INDEX user_integrations_status_idx ON user_integrations(status);
CREATE INDEX integration_usage_user_idx ON integration_usage(user_id);
CREATE INDEX integration_usage_created_idx ON integration_usage(created_at);
CREATE INDEX available_integrations_type_idx ON available_integrations(type);

SELECT '✅ Estrutura base criada com sucesso!' as status;
