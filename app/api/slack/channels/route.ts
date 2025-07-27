import { NextRequest, NextResponse } from 'next/server'
import { slackIntegration } from '@/lib/slack-integration'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar canais de um workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID é obrigatório' },
        { status: 400 }
      )
    }

    const channels = await slackIntegration.getChannelsByWorkspace(workspaceId)

    return NextResponse.json({
      success: true,
      data: channels
    })

  } catch (error) {
    console.error('Erro ao buscar canais:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configurações de um canal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      channel_id, 
      notification_types, 
      message_format, 
      filters 
    } = body

    if (!channel_id) {
      return NextResponse.json(
        { success: false, error: 'Channel ID é obrigatório' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (notification_types !== undefined) {
      updateData.notification_types = notification_types
    }

    if (message_format !== undefined) {
      updateData.message_format = message_format
    }

    if (filters !== undefined) {
      updateData.filters = filters
    }

    const { data, error } = await supabase
      .from('slack_channels')
      .update(updateData)
      .eq('id', channel_id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar canal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Erro ao atualizar canal:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}