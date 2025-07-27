import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { webhookSystem } from '@/lib/webhook-system'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar webhooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agency_id')
    const isActive = searchParams.get('is_active')

    const webhooks = await webhookSystem.getWebhooks(
      agencyId || undefined,
      isActive ? isActive === 'true' : undefined
    )

    return NextResponse.json({
      success: true,
      data: webhooks
    })
  } catch (error) {
    console.error('Erro ao buscar webhooks:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação básica
    if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios: name, url, events' },
        { status: 400 }
      )
    }

    const webhookId = await webhookSystem.createWebhook({
      agency_id: body.agency_id,
      name: body.name,
      description: body.description,
      url: body.url,
      method: body.method || 'POST',
      headers: body.headers || {},
      secret_token: body.secret_token,
      events: body.events,
      is_active: body.is_active !== false,
      retry_attempts: body.retry_attempts || 3,
      retry_delay_seconds: body.retry_delay_seconds || 60,
      timeout_seconds: body.timeout_seconds || 30,
      filters: body.filters || {},
      created_by: body.created_by
    })

    if (!webhookId) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar webhook' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { id: webhookId }
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}