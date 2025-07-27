import { NextRequest, NextResponse } from 'next/server'
import { webhookSystem } from '@/lib/webhook-system'

// POST - Repetir evento de webhook
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await webhookSystem.retryWebhookEvent(params.id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Erro ao repetir evento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Evento reenviado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao repetir evento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}