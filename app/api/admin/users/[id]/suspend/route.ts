import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(
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

    // Verificar se o usuário existe e não é admin
    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(userId)
    
    if (userError || !targetUser.user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se não é um admin (admins não podem ser suspensos)
    const { data: targetPermissions } = await supabase
      .from('user_agency_permissions')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (targetPermissions && targetPermissions.role === 'admin') {
      return NextResponse.json({ error: 'Não é possível suspender administradores' }, { status: 403 })
    }

    // Suspender usuário no Supabase Auth
    const { error: suspendError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '999999h' // Suspensão indefinida
    })

    if (suspendError) {
      console.error('Erro ao suspender usuário:', suspendError)
      return NextResponse.json({ 
        error: 'Erro ao suspender usuário: ' + suspendError.message 
      }, { status: 500 })
    }

    // Suspender todas as assinaturas ativas do usuário
    await supabase
      .from('user_subscriptions')
      .update({ status: 'suspended' })
      .eq('user_id', userId)
      .eq('status', 'active')

    // Log da ação
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_user_id: user.id,
        action: 'suspend_user',
        target_user_id: userId,
        target_email: targetUser.user.email,
        details: {
          reason: 'Suspenso via painel admin',
          suspended_at: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Usuário suspenso com sucesso'
    })

  } catch (error) {
    console.error('Erro ao suspender usuário:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}