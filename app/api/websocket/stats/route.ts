import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'
import { webSocketManager } from '@/lib/websocket-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin ou agency owner
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'agency_owner', 'agency_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id') || profile.agency_id

    // Obter estatísticas do WebSocket
    const wsStats = webSocketManager.getStats()
    const onlineUsers = webSocketManager.getOnlineUsers(agencyId || undefined)

    // Estatísticas detalhadas por agência se for agency owner/manager
    let agencyStats = null
    if (agencyId && profile.role !== 'admin') {
      const agencyOnlineUsers = onlineUsers.filter(u => u.agency_id === agencyId)
      
      agencyStats = {
        agency_id: agencyId,
        online_users: agencyOnlineUsers.length,
        users_detail: agencyOnlineUsers.map(u => ({
          id: u.id,
          connected_at: u.connected_at,
          last_activity: u.last_activity,
          socket_id: u.socket_id
        }))
      }
    }

    // Estatísticas históricas (últimas 24 horas)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Aqui você poderia implementar um sistema de métricas históricas
    // salvando snapshots periódicos das estatísticas em uma tabela
    
    const stats = {
      current: {
        timestamp: new Date().toISOString(),
        websocket: wsStats,
        online_users_total: onlineUsers.length,
        ...(agencyStats && { agency: agencyStats })
      },
      summary: {
        peak_connections: wsStats.connected_users, // Seria melhor ter um histórico
        active_agencies: new Set(onlineUsers.map(u => u.agency_id).filter(Boolean)).size,
        avg_session_duration: '15min', // Calcular baseado em dados reais
        total_messages_today: 0 // Implementar contador
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Erro ao obter estatísticas WebSocket:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { action, target_user_id, message, data } = body

    switch (action) {
      case 'broadcast':
        // Broadcast para todos os usuários
        webSocketManager.broadcast('admin_message', {
          message,
          data,
          from: 'system'
        })
        break

      case 'send_to_user':
        // Enviar para usuário específico
        if (!target_user_id) {
          return NextResponse.json(
            { error: 'target_user_id é obrigatório para send_to_user' },
            { status: 400 }
          )
        }
        webSocketManager.sendToUser(target_user_id, 'admin_message', {
          message,
          data,
          from: 'system'
        })
        break

      case 'send_to_agency':
        // Enviar para agência específica
        const agencyId = data?.agency_id
        if (!agencyId) {
          return NextResponse.json(
            { error: 'agency_id é obrigatório para send_to_agency' },
            { status: 400 }
          )
        }
        webSocketManager.sendToAgency(agencyId, 'admin_message', {
          message,
          data,
          from: 'system'
        })
        break

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao enviar mensagem WebSocket:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}