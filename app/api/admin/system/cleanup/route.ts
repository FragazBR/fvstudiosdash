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
        error: 'Apenas o admin principal pode executar limpeza do sistema' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { confirm } = body

    if (confirm !== 'DELETE_ALL_USERS_EXCEPT_ADMIN') {
      return NextResponse.json({ 
        error: 'Confirmação inválida. Use: DELETE_ALL_USERS_EXCEPT_ADMIN' 
      }, { status: 400 })
    }

    // Buscar todos os usuários exceto o admin principal usando cliente admin
    const adminClient = supabaseAdmin()
    const { data: allUsers, error: listError } = await adminClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError)
      return NextResponse.json({ 
        error: 'Erro ao listar usuários: ' + listError.message 
      }, { status: 500 })
    }

    const usersToDelete = allUsers.users.filter(u => 
      u.email !== 'franco@fvstudios.com.br' && u.id !== user.id
    )

    let deletedCount = 0
    let errors = []

    // Deletar usuários um por um
    for (const userToDelete of usersToDelete) {
      try {
        // Primeiro limpar dados relacionados no banco
        await supabase
          .from('user_subscriptions')
          .update({ 
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            canceled_by: user.id
          })
          .eq('user_id', userToDelete.id)

        await supabase
          .from('user_agency_permissions')
          .delete()
          .eq('user_id', userToDelete.id)

        await supabase
          .from('user_invitations')
          .update({ status: 'cancelled' })
          .eq('invited_by', userToDelete.id)

        // Deletar do Supabase Auth usando cliente admin
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userToDelete.id)
        
        if (deleteError) {
          errors.push(`Erro ao deletar ${userToDelete.email}: ${deleteError.message}`)
        } else {
          deletedCount++
          console.log(`Usuário deletado: ${userToDelete.email}`)
        }
      } catch (error: any) {
        errors.push(`Erro ao processar ${userToDelete.email}: ${error.message}`)
      }
    }

    // Limpar agências que não foram criadas pelo admin
    const { error: agencyError } = await supabase
      .from('agencies')
      .delete()
      .neq('created_by', user.id)

    if (agencyError) {
      errors.push(`Erro ao limpar agências: ${agencyError.message}`)
    }

    // Limpar dados órfãos
    await supabase.from('user_invitations').delete().neq('invited_by', user.id)
    await supabase.from('admin_user_creation_queue').delete()
    await supabase.from('plan_change_history').delete()

    // Log da ação
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'system_cleanup_complete',
        details: {
          users_deleted: deletedCount,
          total_users_found: usersToDelete.length,
          errors: errors,
          cleaned_at: new Date().toISOString(),
          admin_email: user.email
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Limpeza do sistema concluída',
      summary: {
        users_deleted: deletedCount,
        total_users_found: usersToDelete.length,
        errors_count: errors.length,
        errors: errors,
        remaining_admin: user.email
      }
    })

  } catch (error) {
    console.error('Erro na limpeza do sistema:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}