import { NextRequest, NextResponse } from 'next/server'
import { webhookSystem } from '@/lib/webhook-system'

// GET - Buscar eventos de webhook
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('webhook_id')
    const eventType = searchParams.get('event_type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const events = await webhookSystem.getWebhookEvents(
      webhookId || undefined,
      eventType || undefined,
      status || undefined,
      limit
    )

    return NextResponse.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Disparar evento manualmente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.event_type || !body.event_data) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios: event_type, event_data' },
        { status: 400 }
      )
    }

    await webhookSystem.triggerEvent(
      body.event_type,
      body.event_data,
      body.agency_id
    )

    return NextResponse.json({
      success: true,
      message: 'Evento disparado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao disparar evento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}