import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Buscar workspace específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = await supabase
      .from('slack_workspaces')
      .select(`
        *,
        slack_channels (
          id,
          channel_id,
          channel_name,
          purpose,
          is_private,
          is_archived,
          notification_types,
          message_format,
          total_messages,
          last_message_at
        )
      `)
      .eq('id', params.id)
      .single()

    if (workspace.error) {
      return NextResponse.json(
        { success: false, error: 'Workspace não encontrado' },
        { status: 404 }
      )
    }

    // Limpar tokens sensíveis
    const sanitizedWorkspace = {
      ...workspace.data,
      access_token: undefined,
      refresh_token: undefined,
      bot_token: undefined
    }

    return NextResponse.json({
      success: true,
      data: sanitizedWorkspace
    })

  } catch (error) {
    console.error('Erro ao buscar workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configurações do workspace
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { is_active, auto_create_channels, default_channel } = body

    const { data, error } = await supabase
      .from('slack_workspaces')
      .update({
        is_active: is_active !== undefined ? is_active : undefined,
        auto_create_channels: auto_create_channels !== undefined ? auto_create_channels : undefined,
        default_channel: default_channel || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar workspace' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        access_token: undefined,
        refresh_token: undefined,
        bot_token: undefined
      }
    })

  } catch (error) {
    console.error('Erro ao atualizar workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('slack_workspaces')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao remover workspace' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Workspace removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao remover workspace:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}