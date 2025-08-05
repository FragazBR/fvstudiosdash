import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await supabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: permissions } = await supabase
      .from('user_agency_permissions')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!permissions || permissions.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão de admin' }, { status: 403 })
    }

    const userId = params.id

    // Verificar se o usuário existe
    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !targetUser.user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se não é um admin (admins não podem ser excluídos)
    const { data: targetPermissions } = await supabase
      .from('user_agency_permissions')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (targetPermissions && targetPermissions.role === 'admin') {
      return NextResponse.json({ error: 'Não é possível excluir administradores' }, { status: 403 })
    }

    // Não permitir auto-exclusão
    if (userId === user.id) {
      return NextResponse.json({ error: 'Não é possível excluir sua própria conta' }, { status: 403 })
    }

    // Log da ação antes de excluir
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'delete_user',
        target_user_id: userId,
        target_email: targetUser.user.email,
        details: {
          user_data: {
            name: targetUser.user.user_metadata?.name,
            email: targetUser.user.email,
            created_at: targetUser.user.created_at
          },
          deleted_at: new Date().toISOString()
        }
      })

    // Excluir registros relacionados primeiro (devido às constraints de FK)
    
    // 1. Cancelar assinaturas
    await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        canceled_by: user.id
      })
      .eq('user_id', userId)

    // 2. Cancelar convites pendentes
    await supabase
      .from('user_invitations')
      .update({ 
        status: 'cancelled' 
      })
      .eq('invited_by', userId)

    // 3. Remover permissões de agência
    await supabase
      .from('user_agency_permissions')
      .delete()
      .eq('user_id', userId)

    // 4. Excluir usuário do Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Erro ao excluir usuário do Auth:', deleteError)
      return NextResponse.json({ 
        error: 'Erro ao excluir usuário: ' + deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}