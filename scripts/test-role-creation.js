// Teste para verificar criação de roles
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRoleCreation() {
  console.log('🧪 Testando criação de usuário com role agency_manager...')
  
  try {
    // Simular dados que viriam do formulário
    const testData = {
      role: 'agency_manager', // O que deveria ser salvo
      email: 'teste-manager@test.com',
      name: 'Teste Manager'
    }
    
    console.log('📤 Dados do teste:', testData)
    
    // Verificar o que acontece quando fazemos insert direto
    const testId = crypto.randomUUID()
    
    const { data: result, error } = await supabase
      .from('user_profiles')
      .insert({
        id: testId,
        email: testData.email,
        name: testData.name,
        role: testData.role,
        can_manage_team: true,
        can_assign_tasks: true,
        can_view_team_metrics: true
      })
      .select()
    
    if (error) {
      console.error('❌ Erro no teste:', error)
      return
    }
    
    console.log('✅ Teste inserido, verificando resultado...')
    
    // Verificar o que foi realmente salvo
    const { data: saved, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', testData.email)
      .single()
    
    if (fetchError) {
      console.error('❌ Erro ao buscar resultado:', fetchError)
      return
    }
    
    console.log('📋 O que foi salvo no banco:', saved)
    
    // Verificar se os triggers funcionaram
    console.log('\n🔍 Análise dos resultados:')
    console.log('- Role esperado:', testData.role)
    console.log('- Role salvo:', saved.role)
    console.log('- can_manage_team:', saved.can_manage_team)
    console.log('- can_assign_tasks:', saved.can_assign_tasks)
    console.log('- can_view_team_metrics:', saved.can_view_team_metrics)
    
    if (saved.role === testData.role && saved.can_manage_team === true) {
      console.log('✅ SUCESSO: Role e permissões corretos!')
    } else {
      console.log('❌ PROBLEMA: Role ou permissões incorretos!')
    }
    
    // Limpar teste
    await supabase
      .from('user_profiles')
      .delete()
      .eq('email', testData.email)
    
    console.log('🧹 Teste limpo')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testRoleCreation()