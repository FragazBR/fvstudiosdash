import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

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

    let deletedCount = 0
    let errors = []

    // Limpar dados relacionados no banco primeiro
    try {
      // 1. Cancelar todas as assinaturas (exceto do admin)
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          canceled_by: user.id
        })
        .neq('user_id', user.id)

      if (subscriptionError) {
        errors.push(`Erro ao cancelar assinaturas: ${subscriptionError.message}`)
      }

      // 2. Cancelar todos os convites (exceto do admin)
      const { error: inviteError } = await supabase
        .from('user_invitations')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .neq('invited_by', user.id)

      if (inviteError) {
        errors.push(`Erro ao cancelar convites: ${inviteError.message}`)
      }

      // 3. Remover permissões de agência (exceto do admin)
      const { error: permError } = await supabase
        .from('user_agency_permissions')
        .delete()
        .neq('user_id', user.id)

      if (permError) {
        errors.push(`Erro ao remover permissões: ${permError.message}`)
      }

      // 4. Remover agências criadas por outros usuários
      const { error: agencyError } = await supabase
        .from('agencies')
        .delete()
        .neq('created_by', user.id)

      if (agencyError) {
        errors.push(`Erro ao remover agências: ${agencyError.message}`)
      }

      // 5. Limpar tabelas auxiliares
      await supabase.from('admin_user_creation_queue').delete().neq('created_by', user.id)
      await supabase.from('plan_change_history').delete()

      // 6. Limpar logs antigos (manter últimos 30 dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      await supabase
        .from('admin_action_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())

      deletedCount = 1 // Simulado - não conseguimos contar usuários do Auth sem service role

    } catch (error: any) {
      errors.push(`Erro na limpeza do banco: ${error.message}`)
    }

    // Log da ação
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'system_cleanup_simple',
        details: {
          method: 'database_cleanup_only',
          note: 'Limpeza apenas do banco de dados - usuários do Auth precisam ser removidos manualmente',
          errors: errors,
          cleaned_at: new Date().toISOString(),
          admin_email: user.email
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Limpeza do banco de dados concluída',
      note: 'IMPORTANTE: Os usuários ainda existem no Supabase Auth e precisam ser removidos manualmente pelo dashboard do Supabase',
      summary: {
        database_cleaned: true,
        auth_users_removed: false,
        errors_count: errors.length,
        errors: errors,
        remaining_admin: user.email,
        next_steps: [
          '1. Acesse o Dashboard do Supabase',
          '2. Vá em Authentication > Users',
          '3. Delete manualmente todos os usuários exceto franco@fvstudios.com.br',
          '4. Execute os scripts SQL necessários'
        ]
      }
    })

  } catch (error) {
    console.error('Erro na limpeza do sistema:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}