-- ==================================================
-- SIMPLE MIGRATION - Basic Tables Only
-- No complex blocks, just simple SQL statements
-- ==================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
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

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
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

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create api_integrations table (THE IMPORTANT ONE)
CREATE TABLE IF NOT EXISTS api_integrations (
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

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_client_id ON api_integrations(client_id);

-- Create update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers (to avoid "already exists" error)
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_api_integrations_updated_at ON api_integrations;

-- Create triggers
CREATE TRIGGER update_agencies_updated_at 
    BEFORE UPDATE ON agencies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_integrations_updated_at 
    BEFORE UPDATE ON api_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert admin user
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

-- Insert example agency
INSERT INTO agencies (
    id,
    name,
    email,
    phone,
    subscription_plan,
    subscription_status
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'FVStudios Marketing',
    'contato@fvstudios.com.br',
    '+55 11 99999-9999',
    'enterprise',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Show results
SELECT 'SUCCESS: Core database structure created!' as result;
SELECT table_name, 'CREATED' as status 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('agencies', 'user_profiles', 'clients', 'projects', 'tasks', 'api_integrations')
ORDER BY table_name;