const { createClient } = require('@supabase/supabase-js');

// Usar service role key para operações administrativas
const supabase = createClient(
  'https://htlzesfvekijsulzufbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bHplc2Z2ZWtpanN1bHp1ZmJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2NjQ2MSwiZXhwIjoyMDY4MzQyNDYxfQ.RXHEeka87f59nm4_cV0x0gahDXt9PNbj-LiBO9hy6Gk'
);

async function disableRLSTemporarily() {
  console.log('=== Desabilitando RLS temporariamente ===');
  
  try {
    // O service role pode acessar os dados diretamente
    console.log('1. Listando dados atuais...');
    const { data: profiles, error: listError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(5);
    
    if (listError) {
      console.log('Erro ao listar perfis:', listError.message);
    } else {
      console.log('✅ Perfis encontrados com service role:', profiles);
    }
    
    // Agora vou testar com um cliente anon normal
    console.log('\n2. Testando com cliente anon...');
    const anonSupabase = createClient(
      'https://htlzesfvekijsulzufbd.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bHplc2Z2ZWtpanN1bHp1ZmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjY0NjEsImV4cCI6MjA2ODM0MjQ2MX0.DG22TS0BBrKC1mZClHBYTvSp-GhQxyk60ldON6PnLtI'
    );
    
    // Login
    const { data: authData, error: loginError } = await anonSupabase.auth.signInWithPassword({
      email: 'admin@fvstudios.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.log('Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login OK com anon client');
    
    // Tentar acessar perfil
    const { data: profile, error: profileError } = await anonSupabase
      .from('user_profiles')
      .select('role, id, email')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Erro RLS ainda presente:', profileError.message);
      console.log('Detalhes:', profileError);
    } else {
      console.log('✅ Perfil acessível:', profile);
    }
    
    // Vamos verificar que políticas estão ativas
    console.log('\n3. Verificando políticas RLS...');
    
    // Como não conseguimos executar SQL diretamente, vamos simular
    // uma solução de contorno no middleware
    
  } catch (error) {
    console.log('Erro geral:', error.message);
  }
}

disableRLSTemporarily();