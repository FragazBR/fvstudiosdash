import { NextRequest, NextResponse } from 'next/server'
import { slackIntegration } from '@/lib/slack-integration'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar workspaces Slack da agência
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: 'Agency ID é obrigatório' },
        { status: 400 }
      )
    }

    const workspaces = await slackIntegration.getWorkspacesByAgency(agencyId)

    // Limpar tokens sensíveis antes de retornar
    const sanitizedWorkspaces = workspaces.map(workspace => ({
      ...workspace,
      access_token: undefined,
      refresh_token: undefined,
      bot_token: undefined
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedWorkspaces
    })

  } catch (error) {
    console.error('Erro ao buscar workspaces:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Sincronizar canais de um workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspace_id, action } = body

    if (!workspace_id) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID é obrigatório' },
        { status: 400 }
      )
    }

    if (action === 'sync_channels') {
      const success = await slackIntegration.syncWorkspaceChannels(workspace_id)
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Canais sincronizados com sucesso'
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Falha ao sincronizar canais' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Ação não suportada' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro ao processar ação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}