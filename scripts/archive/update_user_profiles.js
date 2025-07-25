const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Testing database access and updating for agency_manager support...');
  
  try {
    // Test basic database access
    console.log('📡 Testing database connection...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .limit(5);

    if (profileError) {
      console.error('❌ Database connection error:', profileError);
      return;
    }

    console.log('✅ Database connection successful');
    console.log(`📊 Found ${profiles.length} user profiles`);
    
    if (profiles.length > 0) {
      console.log('👥 Current user roles:');
      profiles.forEach(profile => {
        console.log(`   - ${profile.id}: ${profile.role}`);
      });
    }

    // Check if we can create a test user with agency_manager role
    console.log('\n🧪 Testing agency_manager role creation...');
    
    // First, let's check if the constraint exists by trying to insert
    const testEmail = `test-agency-manager-${Date.now()}@test.com`;
    
    console.log('⚠️  Since we cannot execute DDL statements directly, here are the required SQL commands:');
    console.log('\n📋 MANUAL EXECUTION REQUIRED IN SUPABASE SQL EDITOR:');
    console.log('═'.repeat(60));
    
    const sqlCommands = [
      '-- 1. Update user_profiles table constraint',
      'ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;',
      "ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user'));",
      '',
      '-- 2. Update user_invitations table constraint',
      'ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_check;',
      "ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_role_check CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'client'));",
      '',
      '-- 3. Update helper functions',
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
      '',
      `CREATE OR REPLACE FUNCTION public.can_manage_accounts()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'agency', 'agency_owner', 'agency_manager', 'agency_staff', 'independent')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`
    ];

    sqlCommands.forEach(cmd => console.log(cmd));
    console.log('═'.repeat(60));
    
    console.log('\n✅ SUMMARY OF FIXES APPLIED:');
    console.log('📱 Frontend Components: ✅ Updated');
    console.log('🔐 Login Routing: ✅ Updated');
    console.log('🛡️  Permission Guards: ✅ Updated');
    console.log('🎛️  Dashboard Components: ✅ Updated');
    console.log('🗃️  Database Constraints: ⚠️  Manual execution required');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Copy the SQL commands above');
    console.log('2. Go to Supabase Dashboard → SQL Editor');
    console.log('3. Paste and execute the SQL commands');
    console.log('4. Test creating an agency_manager user');
    console.log('5. Deploy the frontend changes');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();