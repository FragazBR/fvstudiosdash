// Script para configurar permissões de gerenciamento de equipe
// Execute com: node scripts/setup-permissions.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE não encontradas')
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configuradas em .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupPermissions() {
  try {
    console.log('🔧 Configurando permissões de gerenciamento de equipe...')

    // Primeiro, vamos verificar quais colunas existem
    const { data: existingUsers, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email, name, role, can_manage_team')
      .in('role', ['agency_owner', 'agency_manager'])
      .limit(1)

    if (fetchError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', fetchError)
      return
    }

    // Atualizar apenas can_manage_team (coluna que sabemos que existe)
    const { data: updatedUsers, error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        can_manage_team: true
      })
      .in('role', ['agency_owner', 'agency_manager'])
      .select('id, email, name, role, can_manage_team')

    if (updateError) {
      console.error('❌ Erro ao atualizar permissões:', updateError)
      return
    }

    console.log(`✅ Campo can_manage_team atualizado para ${updatedUsers?.length || 0} usuários:`)
    
    if (updatedUsers && updatedUsers.length > 0) {
      updatedUsers.forEach(user => {
        console.log(`  - ${user.name || user.email} (${user.role})`)
      })
    } else {
      console.log('  Nenhum usuário com role agency_owner ou agency_manager encontrado')
    }

    console.log('\n🚀 Configuração concluída! Agora os usuários agency_owner e agency_manager podem criar colaboradores.')

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

setupPermissions()