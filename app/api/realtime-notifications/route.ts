import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Buscar notificações em tempo real
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Parâmetros da URL
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const unreadOnly = url.searchParams.get('unread_only') === 'true'
    const type = url.searchParams.get('type')
    const priority = url.searchParams.get('priority')
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')

    // Construir query
    let query = supabase
      .from('realtime_notifications')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (unreadOnly) {
      query = query.eq('read', false)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    const { data: notifications, error } = await query

    if (error) {
      console.error('Erro ao buscar notificações:', error)
      return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
    }

    // Count total e não lidas
    const { count: totalCount } = await supabase
      .from('realtime_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)

    const { count: unreadCountResult } = await supabase
      .from('realtime_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .eq('read', false)

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      pagination: {
        total: totalCount || 0,
        unread: unreadCountResult || 0,
        limit,
        offset,
        has_more: (notifications?.length || 0) === limit
      }
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões (apenas admins e managers podem criar notificações)
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para criar notificações' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type,
      title,
      message,
      user_id, // null = para toda agência
      priority = 'medium',
      data = {},
      action_url,
      action_label,
      expires_at
    } = body

    // Validações
    if (!type || !title || !message) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: type, title, message' 
      }, { status: 400 })
    }

    const validTypes = [
      'project_update', 'task_completed', 'payment_received', 'client_message',
      'system_alert', 'whatsapp_status', 'ai_credits_low', 'deadline_approaching',
      'new_client', 'team_mention', 'file_uploaded', 'approval_needed'
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: `Tipo inválido. Tipos válidos: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: `Prioridade inválida. Prioridades válidas: ${validPriorities.join(', ')}` 
      }, { status: 400 })
    }

    // Se user_id foi especificado, verificar se pertence à mesma agência
    if (user_id) {
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user_id)
        .single()

      if (!targetProfile || targetProfile.agency_id !== profile.agency_id) {
        return NextResponse.json({ 
          error: 'Usuário alvo não pertence à mesma agência' 
        }, { status: 400 })
      }
    }

    // Criar notificação
    const { data: notification, error } = await supabase
      .from('realtime_notifications')
      .insert({
        agency_id: profile.agency_id,
        user_id,
        type,
        title,
        message,
        data,
        priority,
        action_url,
        action_label,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar notificação:', error)
      return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação criada com sucesso',
      notification
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Atualizar notificação (marcar como lida)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    const body = await request.json()
    const { notification_id, read = true, mark_all = false } = body

    if (mark_all) {
      // Marcar todas as notificações como lidas
      const { error } = await supabase
        .from('realtime_notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('agency_id', profile.agency_id)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .eq('read', false)

      if (error) {
        console.error('Erro ao marcar todas como lidas:', error)
        return NextResponse.json({ error: 'Erro ao marcar notificações como lidas' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Todas as notificações foram marcadas como lidas'
      })
    }

    if (!notification_id) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
    }

    // Verificar se a notificação pertence ao usuário/agência
    const { data: notification } = await supabase
      .from('realtime_notifications')
      .select('*')
      .eq('id', notification_id)
      .eq('agency_id', profile.agency_id)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .single()

    if (!notification) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    // Atualizar notificação
    const updateData: any = { read }
    if (read) {
      updateData.read_at = new Date().toISOString()
    }

    const { data: updatedNotification, error } = await supabase
      .from('realtime_notifications')
      .update(updateData)
      .eq('id', notification_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar notificação:', error)
      return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação atualizada com sucesso',
      notification: updatedNotification
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Excluir notificações antigas (cleanup)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Verificar permissões (apenas admins podem fazer cleanup)
    const allowedRoles = ['admin', 'agency_owner', 'agency_manager']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão para excluir notificações' }, { status: 403 })
    }

    const url = new URL(request.url)
    const olderThanDays = parseInt(url.searchParams.get('older_than_days') || '30')
    const readOnly = url.searchParams.get('read_only') === 'true'

    // Calcular data de corte
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    // Construir query de exclusão
    let deleteQuery = supabase
      .from('realtime_notifications')
      .delete()
      .eq('agency_id', profile.agency_id)
      .lt('created_at', cutoffDate.toISOString())

    if (readOnly) {
      deleteQuery = deleteQuery.eq('read', true)
    }

    const { error, count } = await deleteQuery

    if (error) {
      console.error('Erro ao excluir notificações:', error)
      return NextResponse.json({ error: 'Erro ao excluir notificações' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${count || 0} notificações foram excluídas`,
      deleted_count: count || 0
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}