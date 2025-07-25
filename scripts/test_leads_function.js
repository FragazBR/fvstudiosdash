const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLeadsFunction() {
  console.log('🧪 Testando função process_website_lead...');
  
  try {
    const { data, error } = await supabase.rpc('process_website_lead', {
      p_name: 'Teste Usuario',
      p_email: 'teste@exemplo.com',
      p_company_name: 'Empresa Teste',
      p_phone: '(11) 99999-9999',
      p_plan_interest: 'agency_basic',
      p_billing_cycle: 'monthly'
    });

    if (error) {
      console.error('❌ Erro na função:', error);
    } else {
      console.log('✅ Função funcionando:', data);
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testLeadsFunction();