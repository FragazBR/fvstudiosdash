import { NextRequest, NextResponse } from 'next/server'
import { slackIntegration } from '@/lib/slack-integration'

// POST - Enviar notificação para Slack
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      workspace_id, 
      channel_id, 
      event_type, 
      event_data 
    } = body

    // Validação básica
    if (!workspace_id || !channel_id || !event_type || !event_data) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios: workspace_id, channel_id, event_type, event_data' },
        { status: 400 }
      )
    }

    const success = await slackIntegration.sendNotification(
      workspace_id,
      channel_id,
      event_type,
      event_data
    )

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Notificação enviada com sucesso'
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Falha ao enviar notificação' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}