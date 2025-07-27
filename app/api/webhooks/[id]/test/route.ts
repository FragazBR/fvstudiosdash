import { NextRequest, NextResponse } from 'next/server'
import { webhookSystem } from '@/lib/webhook-system'

// POST - Testar webhook
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await webhookSystem.testWebhook(params.id)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Erro ao testar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}