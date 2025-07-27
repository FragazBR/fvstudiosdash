import { NextRequest, NextResponse } from 'next/server'
import { webhookSystem } from '@/lib/webhook-system'

// GET - Buscar webhook específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const webhook = await webhookSystem.getWebhook(params.id)
    
    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: webhook
    })
  } catch (error) {
    console.error('Erro ao buscar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const success = await webhookSystem.updateWebhook(params.id, body)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar webhook' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await webhookSystem.deleteWebhook(params.id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar webhook' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook deletado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}