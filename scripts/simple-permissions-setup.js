// Script simples para configurar permissões
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL  
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setup() {
  console.log('🔧 Verificando e configurando permissões...')
  
  try {
    // Primeiro, vamos ver a estrutura atual da tabela
    const { data: tableInfo, error: infoError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (infoError) {
      console.error('❌ Erro ao acessar user_profiles:', infoError)
      return
    }
    
    console.log('📋 Estrutura atual da tabela (primeira linha):', 
      tableInfo[0] ? Object.keys(tableInfo[0]) : 'Tabela vazia')
    
    // Vamos verificar que usuários temos
    const { data: users, error: usersError } = await supabase
      .from('user_profiles') 
      .select('id, email, name, role')
      
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return
    }
    
    console.log(`👥 Encontrados ${users.length} usuários:`)
    users.forEach(user => {
      console.log(`  - ${user.email} | ${user.name || 'Sem nome'} | Role: ${user.role || 'Sem role'}`)
    })
    
    // Se não há coluna can_manage_team, vamos identificar os usuários que precisam de permissões
    // baseado no papel atual
    const managementUsers = users.filter(user => 
      user.role && ['agency_owner', 'agency_manager', 'admin'].includes(user.role)
    )
    
    console.log(`\n🎯 Usuários que deveriam ter permissões de gerenciamento: ${managementUsers.length}`)
    managementUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`)
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

setup()