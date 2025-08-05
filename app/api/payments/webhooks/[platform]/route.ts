import { NextRequest, NextResponse } from 'next/server'
import { processPaymentWebhook } from '@/lib/payment-integration-engine'

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || 
                     request.headers.get('paypal-auth-algo') || 
                     request.headers.get('x-signature') || ''
    
    const headers = Object.fromEntries(request.headers.entries())

    // Validar plataforma suportada
    const supportedPlatforms = ['stripe', 'paypal', 'mercado_pago', 'pagseguro', 'asaas']
    if (!supportedPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Plataforma não suportada' }, { status: 400 })
    }

    let payload
    try {
      payload = JSON.parse(body)
    } catch (parseError) {
      console.error('Erro ao fazer parse do payload:', parseError)
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // Log do webhook recebido
    console.log(`Webhook recebido para ${platform}:`, {
      type: payload.type || payload.event_type,
      id: payload.id,
      timestamp: new Date().toISOString()
    })

    // Processar webhook
    const success = await processPaymentWebhook(platform, signature, payload, headers)

    if (!success) {
      return NextResponse.json({ error: 'Falha ao processar webhook' }, { status: 500 })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error(`Erro ao processar webhook ${params.platform}:`, error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Para permitir verificação da URL do webhook
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  
  // Para Facebook/Meta webhook verification
  if (challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({
    webhook_url: `${request.nextUrl.origin}/api/payments/webhooks/${platform}`,
    platform,
    status: 'active',
    timestamp: new Date().toISOString()
  })
}