import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é o admin principal
    if (user.email !== 'franco@fvstudios.com.br') {
      return NextResponse.json({ 
        error: 'Apenas o admin principal pode executar limpeza nuclear' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { confirm } = body

    if (confirm !== 'NUCLEAR_CLEANUP_DELETE_EVERYTHING') {
      return NextResponse.json({ 
        error: 'Confirmação inválida. Use: NUCLEAR_CLEANUP_DELETE_EVERYTHING' 
      }, { status: 400 })
    }

    const adminClient = supabaseAdmin()
    let results = {
      tablesCleared: [],
      errors: [],
      usersCleaned: 0,
      adminPreserved: user.email
    }

    // Lista de tabelas para limpeza nuclear
    const tablesToTruncate = [
      'tasks', 'projects', 'contacts', 'messages', 'conversations', 
      'conversation_participants', 'activity_logs', 'ai_usage_logs', 
      'usage_tracking', 'project_members', 'project_collaborators',
      'task_assignments', 'agency_leads', 'website_leads', 
      'agency_onboarding', 'agency_members', 'user_invitations',
      'reports', 'report_executions', 'report_files',
      'admin_user_creation_queue', 'plan_change_history'
    ]

    // Truncate tables
    for (const table of tablesToTruncate) {
      try {
        const { error } = await adminClient
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Delete tudo
        
        if (!error) {
          results.tablesCleared.push(table)
        } else {
          results.errors.push(`${table}: ${error.message}`)
        }
      } catch (error: any) {
        results.errors.push(`${table}: ${error.message}`)
      }
    }

    // Limpar users do Auth (exceto admin)
    try {
      const { data: allUsers } = await adminClient.auth.admin.listUsers()
      
      if (allUsers?.users) {
        const usersToDelete = allUsers.users.filter(u => 
          u.email !== 'franco@fvstudios.com.br' && u.id !== user.id
        )

        for (const userToDelete of usersToDelete) {
          try {
            await adminClient.auth.admin.deleteUser(userToDelete.id)
            results.usersCleaned++
          } catch (error: any) {
            results.errors.push(`User ${userToDelete.email}: ${error.message}`)
          }
        }
      }
    } catch (error: any) {
      results.errors.push(`Auth cleanup: ${error.message}`)
    }

    // Limpar user_profiles (exceto admin)
    try {
      const { error } = await adminClient
        .from('user_profiles')
        .delete()
        .neq('id', user.id)
      
      if (!error) {
        results.tablesCleared.push('user_profiles')
      } else {
        results.errors.push(`user_profiles: ${error.message}`)
      }
    } catch (error: any) {
      results.errors.push(`user_profiles: ${error.message}`)
    }

    // Limpar agencies (exceto as do admin)
    try {
      const { error } = await adminClient
        .from('agencies')
        .delete()
        .or(`created_by.neq.${user.id},created_by.is.null`)
      
      if (!error) {
        results.tablesCleared.push('agencies')
      } else {
        results.errors.push(`agencies: ${error.message}`)
      }
    } catch (error: any) {
      results.errors.push(`agencies: ${error.message}`)
    }

    // Limpar e recriar permissões admin
    try {
      await adminClient
        .from('user_agency_permissions')
        .delete()
        .neq('user_id', user.id)

      await adminClient
        .from('user_agency_permissions')
        .upsert({
          user_id: user.id,
          role: 'admin',
          permissions: {
            manage_users: 'true',
            manage_agencies: 'true',
            manage_payments: 'true',
            view_analytics: 'true',
            manage_settings: 'true',
            super_admin: 'true'
          },
          granted_by: user.id
        })

      results.tablesCleared.push('user_agency_permissions')
    } catch (error: any) {
      results.errors.push(`permissions: ${error.message}`)
    }

    // Log da ação
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'nuclear_cleanup',
        details: {
          method: 'web_interface',
          tables_cleared: results.tablesCleared,
          users_cleaned: results.usersCleaned,
          errors: results.errors,
          timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      message: '💥 Limpeza nuclear concluída!',
      results,
      summary: {
        tables_cleared: results.tablesCleared.length,
        users_cleaned: results.usersCleaned,
        errors_count: results.errors.length,
        admin_preserved: results.adminPreserved
      }
    })

  } catch (error) {
    console.error('Erro na limpeza nuclear:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}