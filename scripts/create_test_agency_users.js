const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUsers() {
  console.log('🏢 Criando usuários de teste para agência...');
  
  const testUsers = [
    {
      email: 'agency.owner@test.com',
      role: 'agency_owner',
      name: 'João Silva - Owner',
      company: 'FV Studios Test'
    },
    {
      email: 'agency.manager@test.com', 
      role: 'agency_manager',
      name: 'Maria Santos - Manager',
      company: 'FV Studios Test'
    },
    {
      email: 'agency.staff@test.com',
      role: 'agency_staff', 
      name: 'Pedro Costa - Staff',
      company: 'FV Studios Test'
    },
    {
      email: 'agency.client@test.com',
      role: 'agency_client',
      name: 'Ana Lima - Client', 
      company: 'Cliente Teste'
    }
  ];

  try {
    // Primeiro, vamos verificar se podemos criar convites
    console.log('📝 Criando convites para os usuários de teste...');
    
    for (const user of testUsers) {
      console.log(`\n👤 Criando convite para: ${user.email} (${user.role})`);
      
      // Usar a função de criar convite
      const { data, error } = await supabase.rpc('create_user_invitation', {
        user_email: user.email,
        user_name: user.name,
        user_role: user.role,
        user_company: user.company
      });

      if (error) {
        console.error(`❌ Erro ao criar convite para ${user.email}:`, error);
      } else {
        console.log(`✅ Convite criado para ${user.email}`);
        console.log(`📧 O usuário deve se registrar com este email: ${user.email}`);
      }
    }

    console.log('\n🎯 INSTRUÇÕES PARA TESTE:');
    console.log('1. Faça logout da conta atual');
    console.log('2. Vá para a página de signup');
    console.log('3. Registre-se com um dos emails acima');
    console.log('4. O sistema automaticamente atribuirá o role correto');
    console.log('\n📧 Emails de teste criados:');
    testUsers.forEach(user => {
      console.log(`   - ${user.email} → ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    console.log('\n⚠️ MÉTODO ALTERNATIVO - Criação Manual:');
    console.log('Se o script falhar, você pode criar os usuários manualmente:');
    console.log('\n1. Faça logout');
    console.log('2. Crie conta com email: agency.manager@test.com');
    console.log('3. Após criar, execute este SQL no Supabase:');
    console.log(`
UPDATE public.user_profiles 
SET role = 'agency_manager', name = 'Test Agency Manager' 
WHERE email = 'agency.manager@test.com';
    `);
  }
}

// Função para verificar se os usuários foram criados
async function checkTestUsers() {
  console.log('🔍 Verificando usuários existentes...');
  
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('email, role, name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }

    console.log('\n👥 Usuários existentes no sistema:');
    profiles.forEach(profile => {
      console.log(`   - ${profile.email} → ${profile.role} (${profile.name || 'Sem nome'})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function main() {
  console.log('🧪 SCRIPT DE CRIAÇÃO DE USUÁRIOS DE TESTE');
  console.log('=====================================');
  
  // Primeiro, verificar usuários existentes
  await checkTestUsers();
  
  console.log('\n');
  
  // Criar novos usuários de teste
  await createTestUsers();
}

main();