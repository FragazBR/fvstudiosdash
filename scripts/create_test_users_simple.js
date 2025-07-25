const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🧪 CRIAÇÃO SIMPLIFICADA DE USUÁRIOS DE TESTE');
  console.log('==========================================');
  
  console.log('\n✅ PASSOS PARA CRIAR USUÁRIOS DE TESTE:');
  console.log('\n1. 🗃️ PRIMEIRO: Execute este SQL no Supabase Dashboard:');
  console.log('───────────────────────────────────────────────────────');
  console.log(`
-- Permitir role agency_manager
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('admin', 'agency_owner', 'agency_manager', 'agency_staff', 'agency_client', 'independent_producer', 'independent_client', 'influencer', 'free_user'));
  `);
  
  console.log('\n2. 👤 CRIAR USUÁRIOS MANUALMENTE:');
  console.log('───────────────────────────────────');
  
  const testUsers = [
    {
      email: 'agency.manager@test.com',
      password: 'Test123456!',
      role: 'agency_manager',
      name: 'Test Agency Manager'
    },
    {
      email: 'agency.owner@test.com', 
      password: 'Test123456!',
      role: 'agency_owner',
      name: 'Test Agency Owner'
    },
    {
      email: 'agency.staff@test.com',
      password: 'Test123456!', 
      role: 'agency_staff',
      name: 'Test Agency Staff'
    }
  ];

  console.log('\n📋 INSTRUÇÕES DETALHADAS:');
  console.log('\nPara cada usuário abaixo:');
  console.log('a) Faça logout da conta atual');
  console.log('b) Vá para /signup');
  console.log('c) Crie conta com as credenciais abaixo');
  console.log('d) Após criar a conta, execute o SQL de correção de role');
  
  testUsers.forEach((user, index) => {
    console.log(`\n🎯 USUÁRIO ${index + 1}: ${user.role.toUpperCase()}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🔐 Senha: ${user.password}`);
    console.log(`   👤 Nome: ${user.name}`);
    console.log(`   🎭 Role: ${user.role}`);
    console.log(`   
   📝 SQL para corrigir role:
   UPDATE public.user_profiles 
   SET role = '${user.role}', name = '${user.name}' 
   WHERE email = '${user.email}';
   `);
  });

  console.log('\n🔄 PROCESSO RECOMENDADO:');
  console.log('1. Execute o SQL de constraint primeiro');
  console.log('2. Crie o usuário agency.manager@test.com');
  console.log('3. Execute o SQL de correção de role');
  console.log('4. Teste o login com agency_manager');
  console.log('5. Verifique se redireciona para /agency');
  console.log('6. Teste as permissões de acesso');
  
  console.log('\n🎯 TESTE PRINCIPAL:');
  console.log('👉 Foque no agency.manager@test.com primeiro');
  console.log('👉 Este é o novo role que implementamos');
  console.log('👉 Deve ter acesso igual ao agency_owner');

  // Verificar usuários existentes
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('email, role, name')
      .order('created_at', { ascending: false });

    if (!error && profiles) {
      console.log('\n👥 USUÁRIOS ATUALMENTE NO SISTEMA:');
      profiles.forEach(profile => {
        console.log(`   - ${profile.email} → ${profile.role} (${profile.name || 'Sem nome'})`);
      });
    }
  } catch (err) {
    console.log('\n⚠️ Não foi possível listar usuários existentes');
  }
}

main();