-- ==================================================
-- CHECK AND FIX MISSING COLUMNS
-- This script checks existing table structure and adds missing columns
-- ==================================================

-- Check current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Add missing columns to user_profiles if they don't exist
DO $$
BEGIN
    -- Check and add full_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN full_name VARCHAR(255) NOT NULL DEFAULT 'Usuário';
        RAISE NOTICE '✅ Added column: user_profiles.full_name';
    ELSE
        RAISE NOTICE '⚠️ Column user_profiles.full_name already exists';
    END IF;
    
    -- Check and add avatar_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Added column: user_profiles.avatar_url';
    ELSE
        RAISE NOTICE '⚠️ Column user_profiles.avatar_url already exists';
    END IF;
    
    -- Check and add phone column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE '✅ Added column: user_profiles.phone';
    ELSE
        RAISE NOTICE '⚠️ Column user_profiles.phone already exists';
    END IF;
    
    -- Check and add subscription_plan column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'free';
        RAISE NOTICE '✅ Added column: user_profiles.subscription_plan';
    ELSE
        RAISE NOTICE '⚠️ Column user_profiles.subscription_plan already exists';
    END IF;
    
    -- Check and add subscription_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'active';
        RAISE NOTICE '✅ Added column: user_profiles.subscription_status';
    ELSE
        RAISE NOTICE '⚠️ Column user_profiles.subscription_status already exists';
    END IF;
    
    -- Check and add stripe_customer_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN stripe_customer_id VARCHAR(255);
        RAISE NOTICE '✅ Added column: user_profiles.stripe_customer_id';
    ELSE
        RAISE NOTICE '⚠️ Column user_profiles.stripe_customer_id already exists';
    END IF;

    -- Check and add role constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'valid_roles'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT valid_roles CHECK (role IN (
            'admin', 'agency_owner', 'agency_manager', 'agency_staff', 
            'agency_client', 'independent_producer', 'independent_client', 
            'influencer', 'free_user'
        ));
        RAISE NOTICE '✅ Added constraint: valid_roles';
    ELSE
        RAISE NOTICE '⚠️ Constraint valid_roles already exists';
    END IF;
    
END $$;

-- Show updated table structure
SELECT 
    'user_profiles' as table_name,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    COALESCE(column_default, 'No default') as default_value
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Now try to insert admin user safely
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
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Verify the admin user was created/updated
SELECT 
    id, 
    email, 
    full_name, 
    role,
    created_at
FROM user_profiles 
WHERE email = 'admin@fvstudios.com.br';

SELECT 'SUCCESS: user_profiles table structure fixed and admin user created!' as result;