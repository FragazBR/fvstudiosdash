const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('🧪 Testando login direto via API...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'agencyowner@test.com',
      password: 'test123'
    });

    if (error) {
      console.error('❌ Erro no login:', error);
      return;
    }

    console.log('✅ Login bem-sucedido!');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    
    // Verificar perfil
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();
      
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
    } else {
      console.log('✅ Perfil encontrado:');
      console.log('📋 Nome:', profile.name);
      console.log('🎭 Role:', profile.role);
      console.log('🏢 Empresa:', profile.company);
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testLogin();