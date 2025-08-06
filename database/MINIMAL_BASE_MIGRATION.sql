-- ==================================================
-- MINIMAL BASE MIGRATION - Essential Tables Only
-- Execute this first to establish the core structure
-- ==================================================

-- 1. Drop existing tables to start fresh
DROP TABLE IF EXISTS integration_logs CASCADE;
DROP TABLE IF EXISTS synced_campaigns CASCADE; 
DROP TABLE IF EXISTS synced_posts CASCADE;
DROP TABLE IF EXISTS api_integrations CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;

-- 2. Create core extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Core tables in dependency order

-- Agencies (no dependencies)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles (depends on agencies)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'free_user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_roles CHECK (role IN (
        'admin', 'agency_owner', 'agency_manager', 'agency_staff', 
        'agency_client', 'independent_producer', 'independent_client', 
        'influencer', 'free_user'
    ))
);

-- Clients (depends on agencies, user_profiles)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    company VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects (depends on agencies, clients, user_profiles)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Integrations (depends on user_profiles, agencies)
CREATE TABLE api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    provider_type VARCHAR(100) NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_valid BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_provider_per_client UNIQUE(client_id, provider, name)
);

-- 4. Create basic indexes
CREATE INDEX idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX idx_clients_agency_id ON clients(agency_id);
CREATE INDEX idx_projects_agency_id ON projects(agency_id);
CREATE INDEX idx_api_integrations_client_id ON api_integrations(client_id);

-- 5. Insert admin user
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    agency_id
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'admin@fvstudios.com.br',
    'Administrador FVStudios',
    'admin',
    NULL
) ON CONFLICT (id) DO NOTHING;

-- 6. Insert example agency
INSERT INTO agencies (
    id,
    name,
    email,
    subscription_plan,
    subscription_status
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'FVStudios Marketing',
    'contato@fvstudios.com.br',
    'enterprise',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 7. Verification
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('agencies', 'user_profiles', 'clients', 'projects', 'api_integrations');
    
    RAISE NOTICE '✅ Created % essential tables', table_count;
    
    IF table_count = 5 THEN
        RAISE NOTICE '🎉 BASE MIGRATION SUCCESSFUL!';
        RAISE NOTICE 'Ready for additional schemas.';
    ELSE
        RAISE EXCEPTION '❌ Some tables failed to create';
    END IF;
END $$;