import { NextRequest, NextResponse } from 'next/server'
import { webhookSystem } from '@/lib/webhook-system'

// GET - Buscar tipos de eventos disponíveis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const eventTypes = await webhookSystem.getEventTypes(category || undefined)

    return NextResponse.json({
      success: true,
      data: eventTypes
    })
  } catch (error) {
    console.error('Erro ao buscar tipos de eventos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}