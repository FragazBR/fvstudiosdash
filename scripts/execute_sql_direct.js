const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('SQL Error:', error);
      return false;
    }
    console.log('✅ SQL executed successfully');
    return true;
  } catch (err) {
    // Try alternative method with raw query
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      });
      
      if (response.ok) {
        console.log('✅ SQL executed successfully (alternative method)');
        return true;
      } else {
        console.error('❌ Alternative method failed:', await response.text());
        return false;
      }
    } catch (altErr) {
      console.error('❌ Both methods failed:', altErr);
      return false;
    }
  }
}

async function main() {
  console.log('🔧 Executing SQL fixes...');
  
  const sqlCommands = [
    // 1. Update user_profiles constraint
    "ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check",
    "ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user'))",
    
    // 2. Update user_invitations constraint  
    "ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_check",
    "ALTER TABLE public.user_invitations ADD CONSTRAINT user_invitations_role_check CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'client'))"
  ];

  for (let i = 0; i < sqlCommands.length; i++) {
    console.log(`📝 Executing command ${i + 1}/${sqlCommands.length}...`);
    const success = await executeSQL(sqlCommands[i]);
    if (!success) {
      console.log('⚠️ Continuing with next command...');
    }
    // Small delay between commands
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('🎉 Database constraint updates completed!');
}

main();