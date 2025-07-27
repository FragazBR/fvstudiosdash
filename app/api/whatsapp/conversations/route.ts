import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { whatsappAPI } from '@/lib/whatsapp-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Buscar conversas
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    // Parâmetros da URL
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')

    // Query base
    let query = supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        messages:whatsapp_messages(count)
      `)
      .eq('agency_id', profile.agency_id)
      .order('last_message_at', { ascending: false })
      .limit(limit)

    // Filtros opcionais
    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('conversation_type', type)
    }

    const { data: conversations, error } = await query

    if (error) {
      console.error('Erro ao buscar conversas:', error)
      return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 })
    }

    // Processar dados das conversas
    const processedConversations = conversations?.map(conv => ({
      ...conv,
      message_count: conv.messages[0]?.count || 0,
      contact_name: conv.contact_name || formatPhoneNumber(conv.phone_number),
      last_message_preview: getMessagePreview(conv),
      completion_percentage: calculateCompletionPercentage(conv.briefing_data)
    })) || []

    return NextResponse.json({
      success: true,
      conversations: processedConversations,
      total: processedConversations.length
    })

  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Criar nova conversa ou enviar mensagem
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar dados do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!profile?.agency_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma agência' }, { status: 403 })
    }

    const body = await request.json()
    const { action, phone_number, message, conversation_id, template_name, template_params } = body

    switch (action) {
      case 'send_message':
        if (!phone_number || !message) {
          return NextResponse.json({ error: 'Telefone e mensagem são obrigatórios' }, { status: 400 })
        }

        const success = await whatsappAPI.sendTextMessage(
          phone_number,
          message,
          profile.agency_id,
          user.id
        )

        return NextResponse.json({
          success,
          message: success ? 'Mensagem enviada' : 'Erro ao enviar mensagem'
        })

      case 'send_template':
        if (!phone_number || !template_name) {
          return NextResponse.json({ error: 'Telefone e template são obrigatórios' }, { status: 400 })
        }

        const templateSuccess = await whatsappAPI.sendTemplate(
          phone_number,
          template_name,
          template_params || [],
          profile.agency_id,
          user.id
        )

        return NextResponse.json({
          success: templateSuccess,
          message: templateSuccess ? 'Template enviado' : 'Erro ao enviar template'
        })

      case 'start_briefing':
        if (!phone_number) {
          return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 })
        }

        // Iniciar fluxo de briefing
        const briefingSuccess = await whatsappAPI.sendTextMessage(
          phone_number,
          `Olá! 👋 Sou o assistente inteligente da *FVStudios*.

Vou te ajudar a criar um briefing completo para seu projeto. Em alguns minutos, teremos todas as informações necessárias!

Vamos começar? Digite *SIM* para iniciar.`,
          profile.agency_id,
          user.id
        )

        return NextResponse.json({
          success: briefingSuccess,
          message: briefingSuccess ? 'Fluxo de briefing iniciado' : 'Erro ao iniciar briefing'
        })

      case 'update_status':
        if (!conversation_id || !body.status) {
          return NextResponse.json({ error: 'ID da conversa e status são obrigatórios' }, { status: 400 })
        }

        const { error: updateError } = await supabase
          .from('whatsapp_conversations')
          .update({
            status: body.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversation_id)
          .eq('agency_id', profile.agency_id)

        if (updateError) {
          return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'Status atualizado'
        })

      default:
        return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro na ação da conversa:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Funções auxiliares
function formatPhoneNumber(phone: string): string {
  // Formatar número de telefone brasileiro
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.substring(2, 4)
    const number = cleaned.substring(4)
    return `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`
  }
  return phone
}

function getMessagePreview(conversation: any): string {
  if (!conversation.briefing_data) return 'Conversa iniciada'
  
  const step = conversation.briefing_data.current_step || 0
  const steps = [
    'Aguardando início',
    'Coletando nome e empresa',
    'Definindo tipo de projeto',
    'Definindo orçamento',
    'Definindo prazo',
    'Coletando requisitos',
    'Coletando contato',
    'Briefing concluído'
  ]
  
  return steps[step] || 'Em andamento'
}

function calculateCompletionPercentage(briefingData: any): number {
  if (!briefingData) return 0
  
  const currentStep = briefingData.current_step || 0
  const totalSteps = briefingData.total_steps || 6
  
  return Math.round((currentStep / totalSteps) * 100)
}