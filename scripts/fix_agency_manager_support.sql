-- Fix agency_manager role support in database
-- CRITICAL: Update role constraints and helper functions

-- 1. Update role constraints in user_profiles table
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user'));

-- 2. Update role constraints in user_invitations table
ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_check;
ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_role_check 
CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'client'));

-- 3. Update is_agency_owner helper function to include agency_manager
CREATE OR REPLACE FUNCTION public.is_agency_owner()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'agency', 'agency_owner', 'agency_manager')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update can_manage_accounts helper function
CREATE OR REPLACE FUNCTION public.can_manage_accounts()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'agency', 'agency_owner', 'agency_manager', 'agency_staff', 'independent')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update same_agency helper function
CREATE OR REPLACE FUNCTION public.same_agency()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update handle_new_user_from_invitation function
CREATE OR REPLACE FUNCTION public.handle_new_user_from_invitation()
RETURNS TRIGGER AS $$
DECLARE
    invitation_record RECORD;
    profile_id UUID;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record 
    FROM public.user_invitations 
    WHERE email = NEW.email 
    AND status = 'pending';

    IF invitation_record.id IS NOT NULL THEN
        -- Validate that the role is allowed (including agency_manager)
        IF invitation_record.role NOT IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'client') THEN
            RAISE EXCEPTION 'Invalid role in invitation: %', invitation_record.role;
        END IF;

        -- Create user profile
        INSERT INTO public.user_profiles (
            id, email, name, role, agency_id, company, phone, created_at, updated_at
        ) VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(invitation_record.name, NEW.email), 
            invitation_record.role,
            invitation_record.agency_id,
            invitation_record.company,
            invitation_record.phone,
            NOW(),
            NOW()
        ) RETURNING id INTO profile_id;

        -- Update invitation status
        UPDATE public.user_invitations 
        SET status = 'accepted', accepted_at = NOW() 
        WHERE id = invitation_record.id;

        -- Create client config if needed
        IF invitation_record.role IN ('client', 'agency_client', 'independent_client') THEN
            INSERT INTO public.client_api_configs (client_id) VALUES (profile_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update invitation creation function to allow agency_manager
CREATE OR REPLACE FUNCTION public.create_user_invitation(
    user_email TEXT,
    user_name TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'client',
    user_agency_id UUID DEFAULT NULL,
    user_company TEXT DEFAULT NULL,
    user_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    admin_data RECORD;
    invitation_id UUID;
    result JSON;
BEGIN
    -- Get admin user data
    SELECT id, role, agency_id INTO admin_data 
    FROM public.user_profiles 
    WHERE id = auth.uid();

    -- Check permissions (agency_manager can now create invitations)
    IF admin_data.role NOT IN ('admin', 'agency_owner', 'agency_manager') THEN
        RETURN '{"error": "Sem permissão para criar convites"}';
    END IF;

    -- Validate role
    IF user_role NOT IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'client') THEN
        RETURN '{"error": "Role inválido"}';
    END IF;

    -- Insert invitation
    INSERT INTO public.user_invitations (
        id, email, name, role, agency_id, company, phone, invited_by, status
    ) VALUES (
        gen_random_uuid(),
        user_email,
        user_name,
        user_role,
        COALESCE(user_agency_id, admin_data.agency_id),
        user_company,
        user_phone,
        admin_data.id,
        'pending'
    ) RETURNING id INTO invitation_id;

    SELECT json_build_object(
        'success', true,
        'invitation_id', invitation_id,
        'message', 'Convite criado com sucesso'
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update RLS policies for user_invitations to include agency_manager
DROP POLICY IF EXISTS "user_invitations_select_policy" ON public.user_invitations;
CREATE POLICY "user_invitations_select_policy" ON public.user_invitations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'agency_owner', 'agency_manager')
    )
);

DROP POLICY IF EXISTS "user_invitations_insert_policy" ON public.user_invitations;
CREATE POLICY "user_invitations_insert_policy" ON public.user_invitations
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'agency_owner', 'agency_manager')
    )
);

DROP POLICY IF EXISTS "user_invitations_update_policy" ON public.user_invitations;
CREATE POLICY "user_invitations_update_policy" ON public.user_invitations
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'agency_owner', 'agency_manager')
    )
);

-- 9. Update team management policies to include agency_manager
DROP POLICY IF EXISTS "agency_team_management" ON public.user_profiles;
CREATE POLICY "agency_team_management" ON public.user_profiles
FOR ALL USING (
    id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.user_profiles admin_user
        WHERE admin_user.id = auth.uid()
        AND admin_user.role IN ('admin', 'agency_owner', 'agency_manager')
        AND (admin_user.role = 'admin' OR admin_user.agency_id = user_profiles.agency_id)
    )
);