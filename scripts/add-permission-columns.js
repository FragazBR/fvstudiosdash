// Script para adicionar colunas de permissões e configurar permissões
// Execute com: node scripts/add-permission-columns.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addPermissionColumns() {
  try {
    console.log('🔧 Adicionando colunas de permissões à tabela user_profiles...')

    // Executar queries individuais para adicionar colunas
    const queries = [
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_assign_tasks BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_view_team_metrics BOOLEAN DEFAULT FALSE`
    ]

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Erro ao executar: ${query}`, error)
        return
      }
    }

    console.log('✅ Colunas de permissões adicionadas com sucesso!')

    // Agora atualizar permissões para agency_owner e agency_manager
    console.log('🔧 Configurando permissões para agency_owner e agency_manager...')

    const { data: updatedUsers, error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        can_manage_team: true,
        can_assign_tasks: true,
        can_view_team_metrics: true
      })
      .in('role', ['agency_owner', 'agency_manager'])
      .select('id, email, name, role')

    if (updateError) {
      console.error('❌ Erro ao atualizar permissões:', updateError)
      return
    }

    console.log(`✅ Permissões atualizadas para ${updatedUsers?.length || 0} usuários:`)
    
    if (updatedUsers && updatedUsers.length > 0) {
      updatedUsers.forEach(user => {
        console.log(`  - ${user.name || user.email} (${user.role})`)
      })
    } else {
      console.log('  Nenhum usuário com role agency_owner ou agency_manager encontrado')
      
      // Vamos verificar que usuários existem
      console.log('\n📋 Verificando usuários existentes...')
      const { data: allUsers, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, email, name, role')
        .limit(10)

      if (fetchError) {
        console.error('❌ Erro ao buscar usuários:', fetchError)
        return
      }

      console.log('👥 Usuários encontrados:')
      allUsers?.forEach(user => {
        console.log(`  - ${user.name || user.email} (${user.role || 'sem role'})`)
      })
    }

    console.log('\n🚀 Configuração concluída! Permissões de gerenciamento configuradas.')

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

addPermissionColumns()