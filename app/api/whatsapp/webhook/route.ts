import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { whatsappAPI } from '@/lib/whatsapp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificação do webhook (GET)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Token de verificação do WhatsApp (deve ser configurado no .env)
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'FVStudios2024'

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook WhatsApp verificado com sucesso')
      return new NextResponse(challenge)
    } else {
      console.log('Falha na verificação do webhook WhatsApp')
      return NextResponse.json({ error: 'Token de verificação inválido' }, { status: 403 })
    }
  } catch (error) {
    console.error('Erro na verificação do webhook:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Receber mensagens (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log para debug
    console.log('Webhook WhatsApp recebido:', JSON.stringify(body, null, 2))

    // Verificar se é uma mensagem
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value

            // Processar mensagens recebidas
            if (value.messages) {
              for (const message of value.messages) {
                await processIncomingMessage(message, value.metadata?.phone_number_id)
              }
            }

            // Processar status de mensagens
            if (value.statuses) {
              for (const status of value.statuses) {
                await processMessageStatus(status)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao processar webhook WhatsApp:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Processar mensagem recebida
async function processIncomingMessage(message: any, phoneNumberId: string) {
  try {
    // Ignorar mensagens próprias
    if (message.from === phoneNumberId) return

    // Buscar agência por phone_number_id
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('agency_id')
      .eq('service_name', 'whatsapp_business')
      .eq('additional_config->phone_number_id', phoneNumberId)
      .single()

    if (!apiKey) {
      console.log('Agência não encontrada para phone_number_id:', phoneNumberId)
      return
    }

    // Processar diferentes tipos de mensagem
    let messageData = {
      id: message.id,
      from: message.from,
      timestamp: message.timestamp,
      text: null as any,
      type: message.type
    }

    switch (message.type) {
      case 'text':
        messageData.text = message.text
        break
      case 'button':
        messageData.text = { body: message.button.text }
        break
      case 'interactive':
        if (message.interactive.type === 'button_reply') {
          messageData.text = { body: message.interactive.button_reply.title }
        } else if (message.interactive.type === 'list_reply') {
          messageData.text = { body: message.interactive.list_reply.title }
        }
        break
      default:
        messageData.text = { body: `[${message.type}]` }
    }

    // Verificar se é comando especial
    const messageContent = messageData.text?.body?.toLowerCase().trim()
    
    if (messageContent === 'briefing' || messageContent === '/briefing') {
      // Iniciar novo fluxo de briefing
      await startBriefingFlow(message.from, apiKey.agency_id)
    } else if (messageContent === 'suporte' || messageContent === '/suporte') {
      // Transferir para suporte humano
      await transferToSupport(message.from, apiKey.agency_id)
    } else {
      // Processar mensagem normal no fluxo
      await whatsappAPI.processIncomingMessage(messageData, apiKey.agency_id)
    }

  } catch (error) {
    console.error('Erro ao processar mensagem recebida:', error)
  }
}

// Processar status de mensagem
async function processMessageStatus(status: any) {
  try {
    const { id, status: messageStatus, timestamp, recipient_id } = status

    // Atualizar status da mensagem no banco
    await supabase
      .from('whatsapp_messages')
      .update({
        status: messageStatus,
        updated_at: new Date(timestamp * 1000).toISOString()
      })
      .eq('id', id)

  } catch (error) {
    console.error('Erro ao processar status da mensagem:', error)
  }
}

// Iniciar fluxo de briefing
async function startBriefingFlow(phoneNumber: string, agencyId: string) {
  try {
    // Verificar se já existe conversa ativa
    const { data: existingConversation } = await supabase
      .from('whatsapp_conversations')
      .select('id, status')
      .eq('phone_number', phoneNumber)
      .eq('agency_id', agencyId)
      .eq('status', 'active')
      .single()

    if (existingConversation) {
      // Resetar conversa existente
      await supabase
        .from('whatsapp_conversations')
        .update({
          briefing_data: {
            current_step: 0,
            total_steps: 6
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConversation.id)
    }

    // Enviar mensagem de boas-vindas
    await whatsappAPI.sendTextMessage(
      phoneNumber,
      `Olá! 👋 Sou o assistente inteligente da *FVStudios*.

Vou te ajudar a criar um briefing completo para seu projeto. Em alguns minutos, teremos todas as informações necessárias!

Vamos começar? Digite *SIM* para iniciar ou *SUPORTE* para falar com nossa equipe.`,
      agencyId
    )

  } catch (error) {
    console.error('Erro ao iniciar fluxo de briefing:', error)
  }
}

// Transferir para suporte
async function transferToSupport(phoneNumber: string, agencyId: string) {
  try {
    // Pausar conversa automática
    await supabase
      .from('whatsapp_conversations')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('phone_number', phoneNumber)
      .eq('agency_id', agencyId)

    // Enviar mensagem de transferência
    await whatsappAPI.sendTextMessage(
      phoneNumber,
      `📞 *Transferindo para nossa equipe!*

Um consultor especializado entrará em contato com você em breve.

*Horário de atendimento:*
🕘 Segunda a Sexta: 9h às 18h
🕘 Sábado: 9h às 14h

Para emergências, ligue: (11) 99999-9999

Muito obrigado! 🙏`,
      agencyId
    )

    // Notificar equipe
    await supabase
      .from('notifications')
      .insert({
        agency_id: agencyId,
        type: 'whatsapp_support_request',
        title: 'Solicitação de Suporte WhatsApp',
        message: `Cliente ${phoneNumber} solicitou atendimento humano`,
        data: {
          phone_number: phoneNumber,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Erro ao transferir para suporte:', error)
  }
}