-- ==================================================
-- FIXED SAFE MIGRATION - Corrected Syntax Issues
-- This script safely adds missing tables/triggers without errors
-- ==================================================

-- Start transaction
BEGIN;

-- ==================================================
-- 1. CREATE MISSING TABLES SAFELY
-- ==================================================

-- Check and create agencies if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agencies') THEN
        CREATE TABLE agencies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(50),
            website VARCHAR(255),
            logo_url TEXT,
            address TEXT,
            subscription_plan VARCHAR(50) DEFAULT 'free',
            subscription_status VARCHAR(50) DEFAULT 'active',
            stripe_customer_id VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created table: agencies';
    ELSE
        RAISE NOTICE '⚠️ Table agencies already exists, skipping';
    END IF;
END $$;

-- Check and create user_profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        CREATE TABLE user_profiles (
            id UUID PRIMARY KEY,
            agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'free_user',
            avatar_url TEXT,
            phone VARCHAR(50),
            subscription_plan VARCHAR(50) DEFAULT 'free',
            subscription_status VARCHAR(50) DEFAULT 'active',
            stripe_customer_id VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            
            CONSTRAINT valid_roles CHECK (role IN (
                'admin', 'agency_owner', 'agency_manager', 'agency_staff', 
                'agency_client', 'independent_producer', 'independent_client', 
                'influencer', 'free_user'
            ))
        );
        RAISE NOTICE '✅ Created table: user_profiles';
    ELSE
        RAISE NOTICE '⚠️ Table user_profiles already exists, skipping';
    END IF;
END $$;

-- Check and create clients if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        CREATE TABLE clients (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
            created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
            company VARCHAR(255) NOT NULL,
            contact_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            contract_value DECIMAL(12,2),
            contract_duration INTEGER,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created table: clients';
    ELSE
        RAISE NOTICE '⚠️ Table clients already exists, skipping';
    END IF;
END $$;

-- Check and create projects if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        CREATE TABLE projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
            client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
            created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'planning',
            budget DECIMAL(12,2),
            start_date DATE,
            end_date DATE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created table: projects';
    ELSE
        RAISE NOTICE '⚠️ Table projects already exists, skipping';
    END IF;
END $$;

-- Check and create tasks if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
        CREATE TABLE tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
            created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
            assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            priority VARCHAR(50) DEFAULT 'medium',
            due_date DATE,
            estimated_hours DECIMAL(5,2),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created table: tasks';
    ELSE
        RAISE NOTICE '⚠️ Table tasks already exists, skipping';
    END IF;
END $$;

-- Check and create api_integrations if not exists (this is the critical one)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_integrations') THEN
        CREATE TABLE api_integrations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
            agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
            created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
            
            name VARCHAR(255) NOT NULL,
            provider VARCHAR(100) NOT NULL,
            provider_type VARCHAR(100) NOT NULL,
            description TEXT,
            
            auth_type VARCHAR(50) NOT NULL DEFAULT 'oauth2',
            oauth_client_id TEXT,
            client_secret_encrypted TEXT,
            access_token_encrypted TEXT,
            refresh_token_encrypted TEXT,
            api_key_encrypted TEXT,
            
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            is_valid BOOLEAN DEFAULT false,
            last_validated_at TIMESTAMPTZ,
            
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            
            CONSTRAINT unique_provider_per_client UNIQUE(client_id, provider, name),
            CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'pending')),
            CONSTRAINT valid_auth_type CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth', 'bearer_token'))
        );
        RAISE NOTICE '✅ Created table: api_integrations';
    ELSE
        RAISE NOTICE '⚠️ Table api_integrations already exists, skipping';
    END IF;
END $$;

-- ==================================================
-- 2. CREATE MISSING INDEXES SAFELY
-- ==================================================

DO $$
BEGIN
    -- Create indexes only if they don't exist
    CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
    CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
    CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
    CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_api_integrations_client_id ON api_integrations(client_id);
    CREATE INDEX IF NOT EXISTS idx_api_integrations_agency_id ON api_integrations(agency_id);
    
    RAISE NOTICE '✅ Created indexes (if not existing)';
END $$;

-- ==================================================
-- 3. CREATE UPDATE FUNCTION SAFELY
-- ==================================================

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 4. CREATE TRIGGERS SAFELY (avoiding duplicates)
-- ==================================================

DO $$
BEGIN
    -- Drop existing triggers first, then recreate
    DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
    DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
    DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
    DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
    DROP TRIGGER IF EXISTS update_api_integrations_updated_at ON api_integrations;
    
    -- Recreate all triggers
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agencies') THEN
        CREATE TRIGGER update_agencies_updated_at 
            BEFORE UPDATE ON agencies 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        CREATE TRIGGER update_user_profiles_updated_at 
            BEFORE UPDATE ON user_profiles 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        CREATE TRIGGER update_clients_updated_at 
            BEFORE UPDATE ON clients 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        CREATE TRIGGER update_projects_updated_at 
            BEFORE UPDATE ON projects 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
        CREATE TRIGGER update_tasks_updated_at 
            BEFORE UPDATE ON tasks 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_integrations') THEN
        CREATE TRIGGER update_api_integrations_updated_at 
            BEFORE UPDATE ON api_integrations 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    RAISE NOTICE '✅ Recreated all triggers successfully';
END $$;

-- ==================================================
-- 5. INSERT SAMPLE DATA SAFELY
-- ==================================================

DO $$
BEGIN
    -- Insert admin user if not exists
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
    
    -- Insert example agency if not exists
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
    
    RAISE NOTICE '✅ Sample data inserted (if not existing)';
END $$;

-- ==================================================
-- 6. FINAL VERIFICATION
-- ==================================================

DO $$
DECLARE
    table_count INTEGER;
    trigger_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count essential tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('agencies', 'user_profiles', 'clients', 'projects', 'tasks', 'api_integrations');
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name LIKE '%updated_at%';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '   SAFE MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Status:';
    RAISE NOTICE '   • Essential Tables: % / 6', table_count;
    RAISE NOTICE '   • Triggers: %', trigger_count;
    RAISE NOTICE '   • Indexes: %', index_count;
    RAISE NOTICE '';
    
    IF table_count = 6 THEN
        RAISE NOTICE '✅ CORE DATABASE STRUCTURE COMPLETE!';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Next Steps:';
        RAISE NOTICE '   1. Test basic functionality';
        RAISE NOTICE '   2. Add additional schemas if needed';
        RAISE NOTICE '   3. Configure environment variables';
        RAISE NOTICE '   4. Start the application';
    ELSE
        RAISE NOTICE '⚠️ Some essential tables may be missing';
        RAISE NOTICE '   Expected: 6, Found: %', table_count;
    END IF;
    RAISE NOTICE '';
END $$;

-- Commit all changes
COMMIT;

-- Show final table list
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('agencies', 'user_profiles', 'clients', 'projects', 'tasks', 'api_integrations') 
        THEN '✅ ESSENTIAL'
        ELSE '📄 ADDITIONAL'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY 
    CASE WHEN table_name IN ('agencies', 'user_profiles', 'clients', 'projects', 'tasks', 'api_integrations') THEN 1 ELSE 2 END,
    table_name;