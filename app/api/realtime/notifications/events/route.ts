import { createServerSupabaseClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { pushNotificationManager } from '@/lib/realtime-notifications'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      target_user_id,
      event_type,
      event_data,
      agency_id,
      delivery_channels = ['web', 'push'],
      priority = 'normal'
    } = body

    if (!target_user_id || !event_type || !event_data) {
      return NextResponse.json(
        { error: 'target_user_id, event_type e event_data são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o usuário pode enviar notificações para o target_user_id
    // (implementar lógica de permissões aqui)

    // Criar evento de notificação em tempo real
    const eventId = await pushNotificationManager.createRealtimeEvent(
      target_user_id,
      event_type,
      event_data,
      {
        agencyId: agency_id,
        deliveryChannels: delivery_channels,
        priority
      }
    )

    if (!eventId) {
      return NextResponse.json(
        { error: 'Erro ao criar evento de notificação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        event_id: eventId,
        message: 'Evento de notificação criado com sucesso'
      }
    })

  } catch (error) {
    console.error('Erro ao criar evento de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    const processed = searchParams.get('processed')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('realtime_notification_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    if (processed !== null) {
      query = query.eq('processed', processed === 'true')
    }

    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Erro ao buscar eventos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar eventos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: events || []
    })

  } catch (error) {
    console.error('Erro ao listar eventos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}