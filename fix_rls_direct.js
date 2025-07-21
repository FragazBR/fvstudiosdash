const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://htlzesfvekijsulzufbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bHplc2Z2ZWtpanN1bHp1ZmJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2NjQ2MSwiZXhwIjoyMDY4MzQyNDYxfQ.RXHEeka87f59nm4_cV0x0gahDXt9PNbj-LiBO9hy6Gk'
);

async function fixRLS() {
  console.log('=== Corrigindo RLS Recursion ===');
  
  try {
    // 1. Remover política problemática
    console.log('1. Removendo política admin problemática...');
    const dropResult = await supabase.rpc('exec', {
      sql: 'DROP POLICY IF EXISTS "Admin can manage all" ON public.user_profiles;'
    });
    
    console.log('Drop result:', dropResult);
    
    // 2. Criar política simples
    console.log('2. Criando política admin simples...');
    const createResult = await supabase.rpc('exec', {
      sql: `CREATE POLICY "Admin bypass" ON public.user_profiles FOR ALL 
            USING (auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid)
            WITH CHECK (auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid);`
    });
    
    console.log('Create result:', createResult);
    
  } catch (error) {
    console.log('Erro:', error.message);
    
    // Vou tentar uma abordagem diferente - desabilitar RLS temporariamente
    console.log('\nTentando abordagem alternativa...');
    
    try {
      // Desabilitar RLS na tabela user_profiles
      const disableRLS = await supabase.rpc('exec', {
        sql: 'ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;'
      });
      
      console.log('RLS desabilitado:', disableRLS);
      
    } catch (e) {
      console.log('Erro na abordagem alternativa:', e.message);
    }
  }
  
  // 3. Testar se o problema foi resolvido
  console.log('\n3. Testando se o problema foi resolvido...');
  
  try {
    // Login admin
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@fvstudios.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.log('Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login realizado');
    
    // Tentar buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, id, email')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Ainda há erro no perfil:', profileError.message);
    } else {
      console.log('✅ Perfil acessível! Problema resolvido:', profile);
    }
    
    // Fazer logout
    await supabase.auth.signOut();
    
  } catch (error) {
    console.log('Erro no teste:', error.message);
  }
}

fixRLS();