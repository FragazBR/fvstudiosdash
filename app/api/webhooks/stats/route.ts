import { NextRequest, NextResponse } from 'next/server'
import { webhookSystem } from '@/lib/webhook-system'

// GET - Buscar estatísticas de webhooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('webhook_id')
    const agencyId = searchParams.get('agency_id')

    const stats = await webhookSystem.getWebhookStats(
      webhookId || undefined,
      agencyId || undefined
    )

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}