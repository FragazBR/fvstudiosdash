// Script final para adicionar colunas e configurar permissões
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function finalSetup() {
  console.log('🚀 Configuração final de permissões iniciada...\n')
  
  try {
    console.log('📝 Passo 1: Adicionando colunas de permissões...')
    
    // Adicionar colunas usando SQL raw
    const addColumnsSQL = `
      DO $$
      BEGIN
          -- Adicionar can_manage_team
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'user_profiles' AND column_name = 'can_manage_team') THEN
              ALTER TABLE user_profiles ADD COLUMN can_manage_team BOOLEAN DEFAULT FALSE;
              RAISE NOTICE 'Coluna can_manage_team adicionada';
          END IF;

          -- Adicionar can_assign_tasks  
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'user_profiles' AND column_name = 'can_assign_tasks') THEN
              ALTER TABLE user_profiles ADD COLUMN can_assign_tasks BOOLEAN DEFAULT FALSE;
              RAISE NOTICE 'Coluna can_assign_tasks adicionada';
          END IF;

          -- Adicionar can_view_team_metrics
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'user_profiles' AND column_name = 'can_view_team_metrics') THEN  
              ALTER TABLE user_profiles ADD COLUMN can_view_team_metrics BOOLEAN DEFAULT FALSE;
              RAISE NOTICE 'Coluna can_view_team_metrics adicionada';
          END IF;
      END $$;
    `

    const { error: addError } = await supabase.rpc('exec_sql', { 
      sql: addColumnsSQL 
    })

    if (addError) {
      console.error('❌ Erro ao adicionar colunas:', addError)
      
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...')
      
      const alternativeQueries = [
        'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN DEFAULT FALSE',
        'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_assign_tasks BOOLEAN DEFAULT FALSE', 
        'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_view_team_metrics BOOLEAN DEFAULT FALSE'
      ]
      
      for (const query of alternativeQueries) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: query })
          if (error) {
            console.log(`ℹ️ ${query} - ${error.message}`)
          } else {
            console.log(`✅ Executado: ${query}`)
          }
        } catch (e) {
          console.log(`ℹ️ ${query} - pode já existir`)
        }
      }
    } else {
      console.log('✅ Colunas adicionadas com sucesso!')
    }

    console.log('\n📝 Passo 2: Configurando permissões para usuários...')

    // Atualizar permissões
    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        can_manage_team: true,
        can_assign_tasks: true, 
        can_view_team_metrics: true
      })
      .in('role', ['admin', 'agency_owner', 'agency_manager'])
      .select('email, name, role')

    if (updateError) {
      console.error('❌ Erro ao atualizar permissões:', updateError)
      return
    }

    console.log(`✅ Permissões atualizadas para ${updated?.length || 0} usuários:`)
    updated?.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`)
    })

    console.log('\n📝 Passo 3: Verificando configuração final...')
    
    const { data: verification, error: verifyError } = await supabase
      .from('user_profiles')
      .select('email, role, can_manage_team, can_assign_tasks, can_view_team_metrics')
      .in('role', ['admin', 'agency_owner', 'agency_manager'])

    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError)
      return  
    }

    console.log('📋 Configuração final:')
    verification?.forEach(user => {
      console.log(`  - ${user.email}: manage=${user.can_manage_team}, assign=${user.can_assign_tasks}, view=${user.can_view_team_metrics}`)
    })

    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!')
    console.log('✨ Agora os usuários podem criar colaboradores através do dashboard da agência!')

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
  }
}

finalSetup()