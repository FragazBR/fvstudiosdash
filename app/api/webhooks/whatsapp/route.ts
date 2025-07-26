import { NextRequest, NextResponse } from 'next/server'
import { N8nIntegrationManager } from '@/lib/n8n-integration'
import { WhatsAppBusinessAPI } from '@/lib/n8n-integration'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  // Verificação do webhook do WhatsApp
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verificar assinatura do webhook
    const signature = request.headers.get('x-hub-signature-256')
    if (!verifyWebhookSignature(JSON.stringify(body), signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Processar mensagens recebidas
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (value?.messages) {
      for (const message of value.messages) {
        await processIncomingMessage(message, value.metadata.phone_number_id)
      }
    }

    return NextResponse.json({ status: 'success' })

  } catch (error) {
    console.error('Erro ao processar webhook WhatsApp:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function processIncomingMessage(message: any, phoneNumberId: string) {
  try {
    const supabase = supabaseServer()
    
    // Verificar se é uma nova conversa ou existente
    const { data: existingConversation } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('phone_number', message.from)
      .eq('status', 'active')
      .single()

    let conversationId = existingConversation?.id
    let workflowType = 'briefing'

    if (!existingConversation) {
      // Nova conversa - iniciar fluxo de briefing
      const { data: newConversation } = await supabase
        .from('whatsapp_conversations')
        .insert({
          phone_number: message.from,
          contact_name: message.profile?.name || 'Sem nome',
          status: 'active',
          current_step: 'initial_greeting',
          context: {}
        })
        .select()
        .single()

      conversationId = newConversation?.id
      
      // Enviar saudação inicial
      await sendInitialGreeting(message.from, phoneNumberId)
    } else {
      // Conversa existente - continuar fluxo atual
      workflowType = determineWorkflowType(existingConversation.current_step)
    }

    // Executar workflow n8n apropriado
    if (conversationId) {
      const n8nManager = new N8nIntegrationManager()
      
      // Buscar workflow de briefing ativo
      const { data: workflow } = await supabase
        .from('n8n_workflows')
        .select('*')
        .eq('workflow_type', workflowType)
        .eq('is_active', true)
        .single()

      if (workflow) {
        await n8nManager.executeWorkflow(workflow.id, {
          conversation_id: conversationId,
          message_text: message.text?.body || '',
          message_type: message.type,
          phone_number: message.from,
          timestamp: message.timestamp,
          context: existingConversation?.context || {}
        })
      }
    }

    // Salvar mensagem no histórico
    await supabase.from('whatsapp_messages').insert({
      conversation_id: conversationId,
      message_id: message.id,
      direction: 'inbound',
      message_type: message.type,
      content: message.text?.body || '',
      timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      raw_data: message
    })

  } catch (error) {
    console.error('Erro ao processar mensagem:', error)
  }
}

async function sendInitialGreeting(phoneNumber: string, phoneNumberId: string) {
  const whatsapp = new WhatsAppBusinessAPI(
    process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId
  )

  const greetingMessage = `👋 Olá! Bem-vindo à FVStudios!

Sou seu assistente inteligente e vou te ajudar a criar uma campanha de marketing digital incrível.

Para começar, preciso entender melhor seu projeto. Qual é o principal objetivo da sua campanha?

🎯 Aumentar vendas
📈 Gerar leads
🌟 Fortalecer a marca
📱 Divulgar produto/serviço
💡 Outro objetivo

Pode me contar com suas palavras! 😊`

  await whatsapp.sendTextMessage(phoneNumber, greetingMessage)
}

function determineWorkflowType(currentStep: string): string {
  const stepWorkflowMap: { [key: string]: string } = {
    'initial_greeting': 'briefing',
    'collecting_objective': 'briefing',
    'collecting_audience': 'briefing',
    'collecting_budget': 'briefing',
    'collecting_timeline': 'briefing',
    'collecting_platforms': 'briefing',
    'briefing_complete': 'analysis',
    'analysis_complete': 'planning',
    'planning_complete': 'production',
    'content_ready': 'approval',
    'content_approved': 'campaign',
    'campaign_live': 'reporting'
  }

  return stepWorkflowMap[currentStep] || 'briefing'
}

function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.WHATSAPP_APP_SECRET) return false

  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
    .update(payload)
    .digest('hex')

  const signatureHash = signature.replace('sha256=', '')
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signatureHash, 'hex')
  )
}