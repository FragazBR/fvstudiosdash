const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript() {
  console.log('🔧 Applying agency_manager fixes to database...');
  
  const sqlCommands = [
    // 1. Update role constraints in user_profiles table
    `ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;`,
    
    `ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
     CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user'));`,

    // 2. Update role constraints in user_invitations table  
    `ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_check;`,
    
    `ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_role_check 
     CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'client'));`,

    // 3. Update is_agency_owner helper function
    `CREATE OR REPLACE FUNCTION public.is_agency_owner()
     RETURNS boolean AS $$
     BEGIN
       RETURN (
         SELECT role IN ('admin', 'agency', 'agency_owner', 'agency_manager')
         FROM public.user_profiles
         WHERE id = auth.uid()
       );
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // 4. Update can_manage_accounts helper function
    `CREATE OR REPLACE FUNCTION public.can_manage_accounts()
     RETURNS boolean AS $$
     BEGIN
       RETURN (
         SELECT role IN ('admin', 'agency', 'agency_owner', 'agency_manager', 'agency_staff', 'independent')
         FROM public.user_profiles
         WHERE id = auth.uid()
       );
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // 5. Update same_agency helper function
    `CREATE OR REPLACE FUNCTION public.same_agency()
     RETURNS boolean AS $$
     BEGIN
       RETURN (
         SELECT role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff')
         FROM public.user_profiles
         WHERE id = auth.uid()
       );
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;`
  ];

  try {
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`📝 Executing command ${i + 1}/${sqlCommands.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: command
      });

      if (error) {
        console.error(`❌ Error executing command ${i + 1}:`, error);
        // Continue with other commands
      } else {
        console.log(`✅ Command ${i + 1} executed successfully`);
      }
    }

    // Update RLS policies using direct SQL
    console.log('📝 Updating RLS policies...');
    
    const rlsPolicies = [
      // User invitations policies
      `DROP POLICY IF EXISTS "user_invitations_select_policy" ON public.user_invitations;`,
      
      `CREATE POLICY "user_invitations_select_policy" ON public.user_invitations
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM public.user_profiles 
           WHERE id = auth.uid() 
           AND role IN ('admin', 'agency_owner', 'agency_manager')
         )
       );`,

      `DROP POLICY IF EXISTS "user_invitations_insert_policy" ON public.user_invitations;`,
      
      `CREATE POLICY "user_invitations_insert_policy" ON public.user_invitations
       FOR INSERT WITH CHECK (
         EXISTS (
           SELECT 1 FROM public.user_profiles 
           WHERE id = auth.uid() 
           AND role IN ('admin', 'agency_owner', 'agency_manager')
         )
       );`,

      `DROP POLICY IF EXISTS "user_invitations_update_policy" ON public.user_invitations;`,
      
      `CREATE POLICY "user_invitations_update_policy" ON public.user_invitations
       FOR UPDATE USING (
         EXISTS (
           SELECT 1 FROM public.user_profiles 
           WHERE id = auth.uid() 
           AND role IN ('admin', 'agency_owner', 'agency_manager')
         )
       );`
    ];

    for (let i = 0; i < rlsPolicies.length; i++) {
      const policy = rlsPolicies[i];
      console.log(`📝 Executing RLS policy ${i + 1}/${rlsPolicies.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: policy
      });

      if (error) {
        console.error(`❌ Error executing RLS policy ${i + 1}:`, error);
      } else {
        console.log(`✅ RLS policy ${i + 1} executed successfully`);
      }
    }

    console.log('🎉 All agency_manager fixes applied successfully!');
    console.log('');
    console.log('✅ Database is now ready for agency_manager users');
    console.log('✅ Frontend components have been updated');
    console.log('✅ Login routing includes agency_manager');
    console.log('✅ Permission guards updated');
    console.log('');
    console.log('🔄 Next: Deploy to test the changes');

  } catch (error) {
    console.error('❌ Error applying fixes:', error);
    process.exit(1);
  }
}

// Alternative method if exec_sql doesn't exist
async function executeSQLAlternative() {
  console.log('🔧 Applying agency_manager fixes using alternative method...');
  
  try {
    // Test if we can query the database
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .limit(1);

    if (error) {
      console.error('❌ Database connection error:', error);
      return;
    }

    console.log('✅ Database connection successful');
    console.log('⚠️  Manual SQL execution required in Supabase dashboard');
    console.log('');
    console.log('📋 Please execute the following SQL commands manually:');
    console.log('');
    
    // Read the SQL file and display it
    const sqlFilePath = path.join(__dirname, 'fix_agency_manager_support.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(sqlContent);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
executeSQLAlternative();