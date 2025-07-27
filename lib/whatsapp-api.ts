'use client'

// ==================================================
// FVStudios Dashboard - WhatsApp Business API Integration
// Sistema completo de automação de briefings via WhatsApp
// ==================================================

import { apiKeysManager } from './api-keys-manager'
import { creditsManager } from './credits-manager'
import { openAIClient } from './openai-client'
import { supabaseBrowser } from './supabaseBrowser'
import { toast } from 'sonner'

// Tipos WhatsApp
export interface WhatsAppMessage {
  id: string
  from: string
  to: string
  message_type: 'text' | 'template' | 'interactive' | 'image' | 'document'
  content: string
  template_name?: string
  template_params?: string[]
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: Date
  conversation_id: string
  agency_id: string
  user_id?: string
}

export interface WhatsAppConversation {
  id: string
  phone_number: string
  contact_name?: string
  agency_id: string
  status: 'active' | 'completed' | 'paused'
  conversation_type: 'briefing' | 'support' | 'sales' | 'general'
  briefing_data?: {
    client_name?: string
    project_type?: string
    budget_range?: string
    deadline?: string
    requirements?: string[]
    current_step?: number
    total_steps?: number
  }
  created_at: Date
  updated_at: Date
  last_message_at: Date
}

export interface WhatsAppTemplate {
  id: string
  name: string
  category: 'briefing' | 'follow_up' | 'proposal' | 'support'
  language: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  components: {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
    text?: string
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
      text: string
      payload?: string
      url?: string
      phone_number?: string
    }>
  }[]
}

// Templates pré-definidos para briefings
export const BRIEFING_TEMPLATES = {
  welcome: {
    name: 'briefing_welcome',
    text: 'Olá! 👋 Sou o assistente inteligente da *FVStudios*.\n\nVou te ajudar a criar um briefing completo para seu projeto. Em alguns minutos, teremos todas as informações necessárias!\n\nVamos começar? Digite *SIM* para iniciar.',
    buttons: [
      { type: 'QUICK_REPLY', text: '✅ Vamos começar!', payload: 'START_BRIEFING' },
      { type: 'QUICK_REPLY', text: '📞 Falar com humano', payload: 'HUMAN_SUPPORT' }
    ]
  },
  
  step1_name: {
    name: 'briefing_step1',
    text: 'Perfeito! Vamos começar. 📝\n\n*PASSO 1/6: IDENTIFICAÇÃO*\n\nPor favor, me informe:\n• Seu nome completo\n• Nome da empresa (se aplicável)',
    buttons: []
  },
  
  step2_project_type: {
    name: 'briefing_step2',
    text: '*PASSO 2/6: TIPO DE PROJETO* 🎯\n\nQue tipo de projeto você precisa?\n\n1️⃣ Site/Landing Page\n2️⃣ Identidade Visual/Logo\n3️⃣ Marketing Digital\n4️⃣ E-commerce\n5️⃣ Aplicativo Mobile\n6️⃣ Outro\n\nDigite o número da opção desejada:',
    buttons: []
  },
  
  step3_budget: {
    name: 'briefing_step3',
    text: '*PASSO 3/6: ORÇAMENTO* 💰\n\nQual sua faixa de investimento?\n\nA) Até R$ 5.000\nB) R$ 5.000 - R$ 15.000\nC) R$ 15.000 - R$ 30.000\nD) Acima de R$ 30.000\nE) Preciso de uma cotação\n\nDigite a letra da opção:',
    buttons: []
  },
  
  step4_deadline: {
    name: 'briefing_step4',
    text: '*PASSO 4/6: PRAZO* ⏰\n\nQual o prazo ideal para seu projeto?\n\n🟢 Até 2 semanas\n🟡 1 mês\n🟠 2-3 meses\n🔴 Mais de 3 meses\n⚫ Flexível\n\nEscreva sua opção:',
    buttons: []
  },
  
  step5_requirements: {
    name: 'briefing_step5',
    text: '*PASSO 5/6: DETALHES* 📋\n\nAgora me conte mais sobre seu projeto:\n\n• Qual o objetivo principal?\n• Quem é seu público-alvo?\n• Tem alguma referência que gosta?\n• Outras informações importantes?\n\nPode escrever livremente:',
    buttons: []
  },
  
  step6_contact: {
    name: 'briefing_step6',
    text: '*PASSO 6/6: CONTATO* 📞\n\nPara finalizar, preciso de:\n\n• Melhor e-mail para contato\n• Como prefere que entremos em contato? (WhatsApp, e-mail, telefone)\n• Há algum horário de preferência?',
    buttons: []
  },
  
  completion: {
    name: 'briefing_complete',
    text: '✅ *BRIEFING CONCLUÍDO!*\n\nMuito obrigado pelas informações! Nossa IA já está analisando seu projeto e em breve você receberá:\n\n📊 Análise detalhada do seu briefing\n💡 Sugestões personalizadas\n📝 Proposta inicial\n📅 Cronograma estimado\n\n*Previsão de retorno: 2-4 horas úteis*\n\nFique tranquilo, entraremos em contato em breve! 🚀',
    buttons: [
      { type: 'URL', text: '🌐 Conheça nosso portfólio', url: 'https://fvstudios.com.br' },
      { type: 'QUICK_REPLY', text: '📞 Falar com consultor', payload: 'TALK_TO_CONSULTANT' }
    ]
  }
}

export class WhatsAppAPI {
  private baseURL = 'https://graph.facebook.com/v18.0'
  private phoneNumberId: string | null = null
  private accessToken: string | null = null
  private supabase = supabaseBrowser()

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      const apiData = await apiKeysManager.getAPIKey('whatsapp_business')
      if (apiData) {
        this.accessToken = apiData.apiKey
        this.phoneNumberId = apiData.additionalConfig.phone_number_id
      }
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp API:', error)
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(
    to: string, 
    message: string, 
    agencyId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp Business API não configurada')
      }

      const response = await fetch(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
              body: message
            }
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar mensagem')
      }

      // Registrar mensagem no banco
      await this.logMessage({
        id: data.messages[0].id,
        from: this.phoneNumberId!,
        to,
        message_type: 'text',
        content: message,
        status: 'sent',
        timestamp: new Date(),
        conversation_id: await this.getOrCreateConversation(to, agencyId),
        agency_id: agencyId,
        user_id: userId
      })

      return true
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error)
      return false
    }
  }

  // Enviar template
  async sendTemplate(
    to: string,
    templateName: string,
    parameters: string[],
    agencyId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp Business API não configurada')
      }

      const response = await fetch(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: 'pt_BR'
              },
              components: parameters.length > 0 ? [{
                type: 'body',
                parameters: parameters.map(param => ({
                  type: 'text',
                  text: param
                }))
              }] : []
            }
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar template')
      }

      // Registrar mensagem no banco
      await this.logMessage({
        id: data.messages[0].id,
        from: this.phoneNumberId!,
        to,
        message_type: 'template',
        content: `Template: ${templateName}`,
        template_name: templateName,
        template_params: parameters,
        status: 'sent',
        timestamp: new Date(),
        conversation_id: await this.getOrCreateConversation(to, agencyId),
        agency_id: agencyId,
        user_id: userId
      })

      return true
    } catch (error) {
      console.error('Erro ao enviar template WhatsApp:', error)
      return false
    }
  }

  // Processar mensagem recebida (webhook)
  async processIncomingMessage(
    messageData: any,
    agencyId: string
  ): Promise<void> {
    try {
      const { from, text, timestamp, id } = messageData
      const messageContent = text?.body || ''

      // Registrar mensagem recebida
      const conversationId = await this.getOrCreateConversation(from, agencyId)
      
      await this.logMessage({
        id,
        from,
        to: this.phoneNumberId!,
        message_type: 'text',
        content: messageContent,
        status: 'delivered',
        timestamp: new Date(timestamp * 1000),
        conversation_id: conversationId,
        agency_id: agencyId
      })

      // Processar lógica de briefing
      await this.processBriefingFlow(from, messageContent, agencyId, conversationId)

    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error)
    }
  }

  // Fluxo de briefing automatizado
  private async processBriefingFlow(
    phoneNumber: string,
    message: string,
    agencyId: string,
    conversationId: string
  ): Promise<void> {
    try {
      const conversation = await this.getConversation(conversationId)
      if (!conversation) return

      const briefingData = conversation.briefing_data || {}
      const currentStep = briefingData.current_step || 0
      const messageNormalized = message.toLowerCase().trim()

      // Lógica do fluxo de briefing
      switch (currentStep) {
        case 0: // Início
          if (messageNormalized.includes('sim') || messageNormalized.includes('começar')) {
            await this.sendBriefingStep(phoneNumber, 1, agencyId)
            await this.updateBriefingStep(conversationId, 1)
          } else if (messageNormalized.includes('humano') || messageNormalized.includes('suporte')) {
            await this.sendTextMessage(phoneNumber, 
              '📞 Transferindo para nosso time humano! Em breve um consultor entrará em contato.',
              agencyId
            )
            await this.updateConversationStatus(conversationId, 'paused')
          }
          break

        case 1: // Nome e empresa
          await this.updateBriefingData(conversationId, { client_name: message })
          await this.sendBriefingStep(phoneNumber, 2, agencyId)
          await this.updateBriefingStep(conversationId, 2)
          break

        case 2: // Tipo de projeto
          const projectTypes = {
            '1': 'Site/Landing Page',
            '2': 'Identidade Visual/Logo',
            '3': 'Marketing Digital',
            '4': 'E-commerce',
            '5': 'Aplicativo Mobile',
            '6': 'Outro'
          }
          const projectType = projectTypes[messageNormalized as keyof typeof projectTypes] || message
          await this.updateBriefingData(conversationId, { project_type: projectType })
          await this.sendBriefingStep(phoneNumber, 3, agencyId)
          await this.updateBriefingStep(conversationId, 3)
          break

        case 3: // Orçamento
          const budgetRanges = {
            'a': 'Até R$ 5.000',
            'b': 'R$ 5.000 - R$ 15.000',
            'c': 'R$ 15.000 - R$ 30.000',
            'd': 'Acima de R$ 30.000',
            'e': 'Preciso de uma cotação'
          }
          const budgetRange = budgetRanges[messageNormalized as keyof typeof budgetRanges] || message
          await this.updateBriefingData(conversationId, { budget_range: budgetRange })
          await this.sendBriefingStep(phoneNumber, 4, agencyId)
          await this.updateBriefingStep(conversationId, 4)
          break

        case 4: // Prazo
          await this.updateBriefingData(conversationId, { deadline: message })
          await this.sendBriefingStep(phoneNumber, 5, agencyId)
          await this.updateBriefingStep(conversationId, 5)
          break

        case 5: // Requisitos
          await this.updateBriefingData(conversationId, { requirements: [message] })
          await this.sendBriefingStep(phoneNumber, 6, agencyId)
          await this.updateBriefingStep(conversationId, 6)
          break

        case 6: // Contato final
          await this.updateBriefingData(conversationId, { contact_info: message })
          await this.completeBriefing(phoneNumber, agencyId, conversationId)
          break

        default:
          // Resposta padrão para mensagens fora do fluxo
          await this.sendTextMessage(phoneNumber,
            'Desculpe, não entendi. Digite *BRIEFING* para iniciar um novo briefing ou *SUPORTE* para falar com nossa equipe.',
            agencyId
          )
      }

    } catch (error) {
      console.error('Erro no fluxo de briefing:', error)
    }
  }

  // Completar briefing com IA
  private async completeBriefing(
    phoneNumber: string,
    agencyId: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Enviar mensagem de conclusão
      await this.sendTextMessage(phoneNumber, BRIEFING_TEMPLATES.completion.text, agencyId)

      // Buscar dados completos do briefing
      const conversation = await this.getConversation(conversationId)
      if (!conversation?.briefing_data) return

      // Gerar análise com IA (usando créditos da empresa)
      const systemUserId = 'system' // User ID do sistema para usar créditos da empresa
      const analysisPrompt = `
        Analise este briefing de cliente e gere uma resposta profissional:
        
        Cliente: ${conversation.briefing_data.client_name}
        Projeto: ${conversation.briefing_data.project_type}
        Orçamento: ${conversation.briefing_data.budget_range}
        Prazo: ${conversation.briefing_data.deadline}
        Requisitos: ${conversation.briefing_data.requirements?.join(', ')}
        
        Gere:
        1. Resumo executivo do projeto
        2. Escopo sugerido
        3. Cronograma estimado
        4. Próximos passos
        5. Perguntas adicionais (se necessário)
        
        Tom: Profissional, consultivo, proposivo
      `

      const aiResponse = await openAIClient.processRequest({
        userId: systemUserId,
        agencyId,
        serviceType: 'briefing_automation',
        prompt: analysisPrompt,
        model: 'gpt-4',
        maxTokens: 1500,
        metadata: { 
          conversation_id: conversationId,
          phone_number: phoneNumber,
          briefing_data: conversation.briefing_data
        }
      })

      // Salvar análise gerada
      if (aiResponse.success) {
        await this.saveBriefingAnalysis(conversationId, aiResponse.content!)
        
        // Notificar equipe interna
        await this.notifyTeam(agencyId, {
          type: 'new_briefing',
          phone_number: phoneNumber,
          client_name: conversation.briefing_data.client_name,
          project_type: conversation.briefing_data.project_type,
          analysis: aiResponse.content
        })
      }

      // Atualizar status da conversa
      await this.updateConversationStatus(conversationId, 'completed')

    } catch (error) {
      console.error('Erro ao completar briefing:', error)
    }
  }

  // Métodos auxiliares
  private async sendBriefingStep(phoneNumber: string, step: number, agencyId: string): Promise<void> {
    const templates = BRIEFING_TEMPLATES
    const stepTemplates = {
      1: templates.step1_name,
      2: templates.step2_project_type,
      3: templates.step3_budget,
      4: templates.step4_deadline,
      5: templates.step5_requirements,
      6: templates.step6_contact
    }

    const template = stepTemplates[step as keyof typeof stepTemplates]
    if (template) {
      await this.sendTextMessage(phoneNumber, template.text, agencyId)
    }
  }

  private async getOrCreateConversation(phoneNumber: string, agencyId: string): Promise<string> {
    try {
      // Buscar conversa existente
      const { data: existing } = await this.supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('phone_number', phoneNumber)
        .eq('agency_id', agencyId)
        .eq('status', 'active')
        .single()

      if (existing) return existing.id

      // Criar nova conversa
      const { data: newConversation, error } = await this.supabase
        .from('whatsapp_conversations')
        .insert({
          phone_number: phoneNumber,
          agency_id: agencyId,
          status: 'active',
          conversation_type: 'briefing',
          briefing_data: {
            current_step: 0,
            total_steps: 6
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return newConversation.id

    } catch (error) {
      console.error('Erro ao criar/buscar conversa:', error)
      return ''
    }
  }

  private async getConversation(conversationId: string): Promise<WhatsAppConversation | null> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar conversa:', error)
      return null
    }
  }

  private async updateBriefingStep(conversationId: string, step: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_conversations')
        .update({
          briefing_data: this.supabase.rpc('jsonb_set', {
            target: 'briefing_data',
            path: ['current_step'],
            new_value: step
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar step do briefing:', error)
    }
  }

  private async updateBriefingData(conversationId: string, data: any): Promise<void> {
    try {
      const conversation = await this.getConversation(conversationId)
      if (!conversation) return

      const updatedBriefingData = {
        ...conversation.briefing_data,
        ...data
      }

      const { error } = await this.supabase
        .from('whatsapp_conversations')
        .update({
          briefing_data: updatedBriefingData,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar dados do briefing:', error)
    }
  }

  private async updateConversationStatus(conversationId: string, status: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_conversations')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao atualizar status da conversa:', error)
    }
  }

  private async logMessage(message: Omit<WhatsAppMessage, 'id'> & { id: string }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_messages')
        .insert({
          ...message,
          created_at: message.timestamp.toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao registrar mensagem:', error)
    }
  }

  private async saveBriefingAnalysis(conversationId: string, analysis: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('briefing_analyses')
        .insert({
          conversation_id: conversationId,
          analysis_content: analysis,
          generated_by: 'ai',
          created_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao salvar análise do briefing:', error)
    }
  }

  private async notifyTeam(agencyId: string, notification: any): Promise<void> {
    try {
      // Enviar notificação para equipe da agência
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          agency_id: agencyId,
          type: notification.type,
          title: 'Novo Briefing Recebido',
          message: `Cliente ${notification.client_name} enviou briefing para ${notification.project_type}`,
          data: notification,
          created_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao notificar equipe:', error)
    }
  }

  // Validar configuração
  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        return { valid: false, error: 'Credenciais não configuradas' }
      }

      // Testar conexão
      const response = await fetch(
        `${this.baseURL}/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return { valid: false, error: error.error?.message || 'Erro na validação' }
      }

      return { valid: true }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }

  // Buscar conversas da agência
  async getConversations(agencyId: string, limit: number = 50): Promise<WhatsAppConversation[]> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('agency_id', agencyId)
        .order('last_message_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
      return []
    }
  }

  // Buscar mensagens de uma conversa
  async getMessages(conversationId: string, limit: number = 100): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
      return []
    }
  }
}

// Instância global
export const whatsappAPI = new WhatsAppAPI()