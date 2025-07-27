import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar histórico de notificações Slack
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    const channelId = searchParams.get('channel_id')
    const eventType = searchParams.get('event_type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('slack_notifications')
      .select(`
        *,
        slack_channels!inner (
          channel_name,
          workspace_id,
          slack_workspaces!inner (
            team_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (channelId) {
      query = query.eq('channel_id', channelId)
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar notificações' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}