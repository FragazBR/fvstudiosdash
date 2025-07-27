'use client'

// ==================================================
// FVStudios Dashboard - WhatsApp Client Notifications System
// Sistema completo de notificações para clientes via WhatsApp
// ==================================================

import { whatsappAPI } from './whatsapp-api'
import { creditsManager } from './credits-manager'
import { openAIClient } from './openai-client'
import { supabaseBrowser } from './supabaseBrowser'
import { templateEngine } from './whatsapp-template-engine'
import { toast } from 'sonner'

// Tipos de notificações
export interface ClientNotification {
  id: string
  client_id: string
  project_id?: string
  agency_id: string
  notification_type: 'project_update' | 'payment_reminder' | 'report' | 'meeting' | 'delivery' | 'feedback_request'
  title: string
  message: string
  whatsapp_phone?: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  scheduled_at?: Date
  sent_at?: Date
  template_used?: string
  metadata?: any
  created_at: Date
}

export interface ProjectStage {
  stage: string
  name: string
  description: string
  expected_duration: number // em dias
  deliverables: string[]
  client_actions_required: string[]
}

// Etapas padrão de projetos
export const PROJECT_STAGES: Record<string, ProjectStage[]> = {
  'website': [
    {
      stage: 'briefing',
      name: '📋 Briefing e Planejamento',
      description: 'Coletamos todas as informações necessárias e criamos o planejamento do projeto',
      expected_duration: 3,
      deliverables: ['Briefing completo', 'Cronograma do projeto', 'Proposta aprovada'],
      client_actions_required: ['Aprovar proposta', 'Enviar materiais (textos, imagens)']
    },
    {
      stage: 'design',
      name: '🎨 Design e Wireframes',
      description: 'Criação do design visual e estrutura das páginas',
      expected_duration: 7,
      deliverables: ['Wireframes', 'Layout das páginas', 'Paleta de cores'],
      client_actions_required: ['Feedback sobre layouts', 'Aprovação do design']
    },
    {
      stage: 'development',
      name: '⚙️ Desenvolvimento',
      description: 'Programação e implementação das funcionalidades',
      expected_duration: 10,
      deliverables: ['Site funcional', 'Integração com sistemas', 'Testes realizados'],
      client_actions_required: ['Testes de aceitação', 'Validação de conteúdo']
    },
    {
      stage: 'testing',
      name: '🧪 Testes e Ajustes',
      description: 'Testes finais, correções e otimizações',
      expected_duration: 3,
      deliverables: ['Site testado', 'Correções aplicadas', 'Performance otimizada'],
      client_actions_required: ['Aprovação final', 'Teste em diferentes dispositivos']
    },
    {
      stage: 'launch',
      name: '🚀 Lançamento',
      description: 'Publicação do site e entrega final',
      expected_duration: 2,
      deliverables: ['Site publicado', 'Documentação', 'Treinamento'],
      client_actions_required: ['Divulgação nas redes sociais']
    }
  ],
  'branding': [
    {
      stage: 'research',
      name: '🔍 Pesquisa e Estratégia',
      description: 'Análise de mercado, concorrentes e definição da estratégia de marca',
      expected_duration: 5,
      deliverables: ['Análise de mercado', 'Posicionamento da marca', 'Estratégia criativa'],
      client_actions_required: ['Questionário de marca', 'Referências visuais']
    },
    {
      stage: 'concepts',
      name: '💡 Conceitos Criativos',
      description: 'Desenvolvimento dos primeiros conceitos e direções criativas',
      expected_duration: 7,
      deliverables: ['3 conceitos de logo', 'Paleta de cores', 'Tipografia sugerida'],
      client_actions_required: ['Escolha do conceito preferido', 'Feedback detalhado']
    },
    {
      stage: 'design',
      name: '🎨 Design Final',
      description: 'Refinamento e finalização da identidade visual',
      expected_duration: 5,
      deliverables: ['Logo finalizado', 'Manual de marca', 'Aplicações'],
      client_actions_required: ['Aprovação final', 'Validação das aplicações']
    },
    {
      stage: 'delivery',
      name: '📦 Entrega e Implementação',
      description: 'Entrega de todos os arquivos e orientações de uso',
      expected_duration: 2,
      deliverables: ['Arquivos finais', 'Manual de uso', 'Templates'],
      client_actions_required: ['Implementação nos materiais']
    }
  ],
  'marketing': [
    {
      stage: 'strategy',
      name: '📊 Estratégia Digital',
      description: 'Definição da estratégia e objetivos de marketing',
      expected_duration: 3,
      deliverables: ['Estratégia de marketing', 'Personas definidas', 'Cronograma de conteúdo'],
      client_actions_required: ['Validação da estratégia', 'Definição de objetivos']
    },
    {
      stage: 'setup',
      name: '⚙️ Configuração das Campanhas',
      description: 'Setup das campanhas e ferramentas de marketing',
      expected_duration: 5,
      deliverables: ['Campanhas configuradas', 'Públicos segmentados', 'Criativos iniciais'],
      client_actions_required: ['Aprovação dos criativos', 'Liberação de orçamento']
    },
    {
      stage: 'execution',
      name: '🚀 Execução e Monitoramento',
      description: 'Lançamento das campanhas e acompanhamento diário',
      expected_duration: 30,
      deliverables: ['Campanhas ativas', 'Relatórios semanais', 'Otimizações aplicadas'],
      client_actions_required: ['Feedback sobre resultados', 'Aprovação de ajustes']
    },
    {
      stage: 'optimization',
      name: '📈 Otimização e Relatórios',
      description: 'Análise de resultados e otimizações contínuas',
      expected_duration: 15,
      deliverables: ['Relatório final', 'Insights e recomendações', 'Próximos passos'],
      client_actions_required: ['Avaliação dos resultados', 'Definição de continuidade']
    }
  ]
}

// Templates de notificações
export const NOTIFICATION_TEMPLATES = {
  project_started: {
    title: '🚀 Projeto Iniciado!',
    template: `Olá *{{client_name}}*! 👋

Seu projeto *{{project_name}}* foi oficialmente iniciado!

*📋 Detalhes:*
• Tipo: {{project_type}}
• Prazo estimado: {{estimated_duration}} dias
• Próxima etapa: {{next_stage}}

*👥 Sua equipe:*
{{team_members}}

*📱 Próximos Passos:*
{{next_actions}}

Vamos criar algo incrível juntos! 🚀

_Equipe {{agency_name}}_`
  },

  stage_started: {
    title: '📈 Nova Etapa Iniciada',
    template: `*{{stage_name}}* iniciada! 🎯

Olá {{client_name}}, começamos uma nova fase do seu projeto:

*📊 Progresso Atual:*
{{progress_bar}}
Etapa {{current_stage}} de {{total_stages}}

*🎯 Nesta etapa iremos:*
{{stage_description}}

*📦 Entregas previstas:*
{{deliverables}}

*👤 Ações necessárias de sua parte:*
{{client_actions}}

*⏰ Prazo estimado:* {{duration}} dias

Qualquer dúvida, é só chamar! 😊`
  },

  stage_completed: {
    title: '✅ Etapa Concluída',
    template: `*{{stage_name}}* concluída com sucesso! ✅

Parabéns {{client_name}}! Mais uma etapa do seu projeto foi finalizada.

*📊 Progresso:*
{{progress_bar}}
{{completed_percentage}}% concluído

*📦 Entregas desta etapa:*
{{completed_deliverables}}

*🔄 Próxima etapa:*
*{{next_stage_name}}*
Início previsto: {{next_stage_date}}

*📋 Preparativos necessários:*
{{next_stage_preparations}}

Continue acompanhando seu projeto! 🚀`
  },

  payment_reminder: {
    title: '💰 Lembrete de Pagamento',
    template: `Olá {{client_name}}! 💰

Este é um lembrete amigável sobre o pagamento do seu projeto:

*📋 Detalhes:*
• Projeto: {{project_name}}
• Valor: R$ {{amount}}
• Vencimento: {{due_date}}
• Parcela: {{installment}} de {{total_installments}}

*💳 Formas de pagamento:*
• PIX: {{pix_key}}
• Boleto: {{boleto_link}}
• Cartão: {{card_link}}

Após o pagamento, é só nos enviar o comprovante! 

Dúvidas? Estamos aqui para ajudar! 😊`
  },

  feedback_request: {
    title: '🎯 Solicitação de Feedback',
    template: `Sua opinião é muito importante! 💭

Olá {{client_name}}, precisamos do seu feedback sobre:

*{{feedback_subject}}*

{{feedback_details}}

*📝 Como avaliar:*
{{evaluation_criteria}}

*🔗 Link para avaliação:*
{{feedback_link}}

*⏰ Prazo:* {{feedback_deadline}}

Aguardamos seu retorno para dar continuidade ao projeto! 🚀`
  },

  delivery_ready: {
    title: '📦 Entrega Pronta!',
    template: `Seu projeto está pronto! 🎉

*{{client_name}}*, é com muito prazer que informamos:

*✅ {{deliverable_name}} finalizado!*

*📦 O que está incluído:*
{{delivery_items}}

*🔗 Acesso aos arquivos:*
{{download_links}}

*📋 Próximos passos:*
{{next_steps}}

*📞 Precisa de ajuda?*
Nossa equipe está disponível para suporte!

Obrigado por confiar na {{agency_name}}! 🙏`
  },

  project_completed: {
    title: '🏆 Projeto Concluído!',
    template: `*PROJETO CONCLUÍDO COM SUCESSO!* 🏆

Parabéns {{client_name}}! 

Finalizamos seu *{{project_name}}* com muito carinho e dedicação.

*📊 Resumo Final:*
• Duração: {{project_duration}} dias
• Etapas concluídas: {{completed_stages}}
• Entregas realizadas: {{total_deliveries}}

*📦 Todos os arquivos foram entregues:*
{{final_deliverables}}

*🎯 Próximos Passos:*
{{post_project_actions}}

*⭐ Avalie nosso trabalho:*
{{review_link}}

Foi um prazer trabalhar com você! 
Até o próximo projeto! 🚀

_Equipe {{agency_name}}_`
  }
}

export class WhatsAppNotificationManager {
  private supabase = supabaseBrowser()

  // Enviar notificação para cliente
  async sendClientNotification(
    clientId: string,
    agencyId: string,
    notificationType: string,
    templateData: any,
    scheduleAt?: Date
  ): Promise<boolean> {
    try {
      // Buscar dados do cliente
      const { data: client } = await this.supabase
        .from('clients')
        .select('name, whatsapp_phone, email')
        .eq('id', clientId)
        .single()

      if (!client?.whatsapp_phone) {
        console.log('Cliente não possui WhatsApp cadastrado')
        return false
      }

      // Buscar template personalizado da agência primeiro
      const customTemplate = await templateEngine.getCustomTemplate(agencyId, notificationType)
      
      let title: string
      let messageTemplate: string
      let templateName: string

      if (customTemplate) {
        // Usar template personalizado
        title = customTemplate.title_template
        messageTemplate = customTemplate.message_template
        templateName = customTemplate.template_name
      } else {
        // Usar template padrão
        const defaultTemplate = NOTIFICATION_TEMPLATES[notificationType as keyof typeof NOTIFICATION_TEMPLATES]
        if (!defaultTemplate) {
          console.error('Template de notificação não encontrado:', notificationType)
          return false
        }
        title = defaultTemplate.title
        messageTemplate = defaultTemplate.template
        templateName = `default_${notificationType}`
      }

      // Processar template com dados
      const processed = templateEngine.processTemplate(title, messageTemplate, {
        client_name: client.name,
        ...templateData
      })

      const processedTitle = processed.title
      const processedMessage = processed.message

      // Se deve ser agendado
      if (scheduleAt && scheduleAt > new Date()) {
        return await this.scheduleNotification({
          client_id: clientId,
          agency_id: agencyId,
          notification_type: notificationType as any,
          title: processedTitle,
          message: processedMessage,
          whatsapp_phone: client.whatsapp_phone,
          scheduled_at: scheduleAt,
          status: 'pending',
          template_used: templateName,
          metadata: templateData,
          created_at: new Date()
        })
      }

      // Enviar imediatamente
      const success = await whatsappAPI.sendTextMessage(
        client.whatsapp_phone,
        processedMessage,
        agencyId
      )

      // Registrar notificação
      await this.logNotification({
        client_id: clientId,
        agency_id: agencyId,
        notification_type: notificationType as any,
        title: processedTitle,
        message: processedMessage,
        whatsapp_phone: client.whatsapp_phone,
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date() : undefined,
        template_used: templateName,
        metadata: templateData,
        created_at: new Date()
      })

      // Incrementar contador de uso do template personalizado
      if (customTemplate && success) {
        await this.supabase
          .from('notification_templates')
          .update({ 
            usage_count: customTemplate.usage_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', customTemplate.id)
      }

      return success
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      return false
    }
  }

  // Notificar início de projeto
  async notifyProjectStarted(
    projectId: string,
    clientId: string,
    agencyId: string,
    projectData: {
      project_name: string
      project_type: string
      estimated_duration: number
      team_members: string[]
      next_actions: string[]
    }
  ): Promise<boolean> {
    const templateData = {
      project_name: projectData.project_name,
      project_type: projectData.project_type,
      estimated_duration: projectData.estimated_duration,
      next_stage: this.getFirstStage(projectData.project_type),
      team_members: projectData.team_members.join('\n• '),
      next_actions: projectData.next_actions.join('\n• '),
      agency_name: await this.getAgencyName(agencyId)
    }

    return await this.sendClientNotification(
      clientId,
      agencyId,
      'project_started',
      templateData
    )
  }

  // Notificar início de etapa
  async notifyStageStarted(
    projectId: string,
    clientId: string,
    agencyId: string,
    stageData: {
      project_type: string
      current_stage: number
      total_stages: number
      stage_info: ProjectStage
    }
  ): Promise<boolean> {
    const progressBar = this.generateProgressBar(stageData.current_stage, stageData.total_stages)
    
    const templateData = {
      stage_name: stageData.stage_info.name,
      current_stage: stageData.current_stage,
      total_stages: stageData.total_stages,
      progress_bar: progressBar,
      stage_description: stageData.stage_info.description,
      deliverables: stageData.stage_info.deliverables.join('\n• '),
      client_actions: stageData.stage_info.client_actions_required.join('\n• '),
      duration: stageData.stage_info.expected_duration
    }

    return await this.sendClientNotification(
      clientId,
      agencyId,
      'stage_started',
      templateData
    )
  }

  // Notificar conclusão de etapa
  async notifyStageCompleted(
    projectId: string,
    clientId: string,
    agencyId: string,
    completionData: {
      completed_stage: ProjectStage
      current_stage: number
      total_stages: number
      next_stage?: ProjectStage
      completed_deliverables: string[]
    }
  ): Promise<boolean> {
    const completedPercentage = Math.round((completionData.current_stage / completionData.total_stages) * 100)
    const progressBar = this.generateProgressBar(completionData.current_stage, completionData.total_stages)
    
    const templateData = {
      stage_name: completionData.completed_stage.name,
      progress_bar: progressBar,
      completed_percentage: completedPercentage,
      completed_deliverables: completionData.completed_deliverables.join('\n• '),
      next_stage_name: completionData.next_stage?.name || 'Projeto finalizado',
      next_stage_date: this.calculateNextStageDate(2), // 2 dias úteis
      next_stage_preparations: completionData.next_stage?.client_actions_required.join('\n• ') || 'Nenhuma ação necessária'
    }

    return await this.sendClientNotification(
      clientId,
      agencyId,
      'stage_completed',
      templateData
    )
  }

  // Enviar lembrete de pagamento
  async sendPaymentReminder(
    clientId: string,
    agencyId: string,
    paymentData: {
      project_name: string
      amount: number
      due_date: Date
      installment: number
      total_installments: number
      payment_methods: {
        pix_key?: string
        boleto_link?: string
        card_link?: string
      }
    }
  ): Promise<boolean> {
    const templateData = {
      project_name: paymentData.project_name,
      amount: paymentData.amount.toLocaleString('pt-BR'),
      due_date: paymentData.due_date.toLocaleDateString('pt-BR'),
      installment: paymentData.installment,
      total_installments: paymentData.total_installments,
      pix_key: paymentData.payment_methods.pix_key || 'A ser enviado',
      boleto_link: paymentData.payment_methods.boleto_link || 'A ser enviado',
      card_link: paymentData.payment_methods.card_link || 'Entre em contato'
    }

    return await this.sendClientNotification(
      clientId,
      agencyId,
      'payment_reminder',
      templateData
    )
  }

  // Solicitar feedback
  async requestFeedback(
    clientId: string,
    agencyId: string,
    feedbackData: {
      subject: string
      details: string
      criteria: string[]
      feedback_link: string
      deadline: Date
    }
  ): Promise<boolean> {
    const templateData = {
      feedback_subject: feedbackData.subject,
      feedback_details: feedbackData.details,
      evaluation_criteria: feedbackData.criteria.join('\n• '),
      feedback_link: feedbackData.feedback_link,
      feedback_deadline: feedbackData.deadline.toLocaleDateString('pt-BR')
    }

    return await this.sendClientNotification(
      clientId,
      agencyId,
      'feedback_request',
      templateData
    )
  }

  // Notificar entrega pronta
  async notifyDeliveryReady(
    clientId: string,
    agencyId: string,
    deliveryData: {
      deliverable_name: string
      items: string[]
      download_links: string[]
      next_steps: string[]
    }
  ): Promise<boolean> {
    const templateData = {
      deliverable_name: deliveryData.deliverable_name,
      delivery_items: deliveryData.items.join('\n• '),
      download_links: deliveryData.download_links.join('\n• '),
      next_steps: deliveryData.next_steps.join('\n• '),
      agency_name: await this.getAgencyName(agencyId)
    }

    return await this.sendClientNotification(
      clientId,
      agencyId,
      'delivery_ready',
      templateData
    )
  }

  // Notificar projeto concluído
  async notifyProjectCompleted(
    projectId: string,
    clientId: string,
    agencyId: string,
    completionData: {
      project_name: string
      project_duration: number
      completed_stages: number
      total_deliveries: number
      final_deliverables: string[]
      post_project_actions: string[]
      review_link: string
    }
  ): Promise<boolean> {
    const templateData = {
      project_name: completionData.project_name,
      project_duration: completionData.project_duration,
      completed_stages: completionData.completed_stages,
      total_deliveries: completionData.total_deliveries,
      final_deliverables: completionData.final_deliverables.join('\n• '),
      post_project_actions: completionData.post_project_actions.join('\n• '),
      review_link: completionData.review_link,
      agency_name: await this.getAgencyName(agencyId)
    }

    return await this.sendClientNotification(
      clientId,
      agencyId,
      'project_completed',
      templateData
    )
  }

  // Métodos auxiliares
  private processTemplate(template: string, data: any): string {
    let processed = template
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processed = processed.replace(regex, String(value))
    })
    return processed
  }

  private generateProgressBar(current: number, total: number): string {
    const percentage = Math.round((current / total) * 100)
    const filled = Math.round(percentage / 10)
    const empty = 10 - filled
    
    return `${'▓'.repeat(filled)}${'░'.repeat(empty)} ${percentage}%`
  }

  private getFirstStage(projectType: string): string {
    const stages = PROJECT_STAGES[projectType.toLowerCase()]
    return stages?.[0]?.name || 'Primeira etapa'
  }

  private calculateNextStageDate(daysFromNow: number): string {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toLocaleDateString('pt-BR')
  }

  private async getAgencyName(agencyId: string): Promise<string> {
    try {
      const { data: agency } = await this.supabase
        .from('agencies')
        .select('name')
        .eq('id', agencyId)
        .single()
      
      return agency?.name || 'Nossa Equipe'
    } catch {
      return 'Nossa Equipe'
    }
  }

  private async scheduleNotification(notification: Omit<ClientNotification, 'id'>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('client_notifications')
        .insert(notification)

      return !error
    } catch (error) {
      console.error('Erro ao agendar notificação:', error)
      return false
    }
  }

  private async logNotification(notification: Omit<ClientNotification, 'id'>): Promise<void> {
    try {
      await this.supabase
        .from('client_notifications')
        .insert(notification)
    } catch (error) {
      console.error('Erro ao registrar notificação:', error)
    }
  }

  // Processar notificações agendadas
  async processScheduledNotifications(): Promise<void> {
    try {
      const { data: notifications } = await this.supabase
        .from('client_notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .limit(50)

      for (const notification of notifications || []) {
        const success = await whatsappAPI.sendTextMessage(
          notification.whatsapp_phone!,
          notification.message,
          notification.agency_id
        )

        await this.supabase
          .from('client_notifications')
          .update({
            status: success ? 'sent' : 'failed',
            sent_at: success ? new Date().toISOString() : null
          })
          .eq('id', notification.id)
      }
    } catch (error) {
      console.error('Erro ao processar notificações agendadas:', error)
    }
  }

  // Buscar histórico de notificações
  async getNotificationHistory(
    agencyId: string,
    clientId?: string,
    limit: number = 100
  ): Promise<ClientNotification[]> {
    try {
      let query = this.supabase
        .from('client_notifications')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      return []
    }
  }

  // Estatísticas de notificações
  async getNotificationStats(agencyId: string, period: 'week' | 'month' = 'month') {
    try {
      const startDate = new Date()
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7)
      } else {
        startDate.setMonth(startDate.getMonth() - 1)
      }

      const { data, error } = await this.supabase
        .from('client_notifications')
        .select('status, notification_type, created_at')
        .eq('agency_id', agencyId)
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        sent: data?.filter(n => n.status === 'sent').length || 0,
        failed: data?.filter(n => n.status === 'failed').length || 0,
        pending: data?.filter(n => n.status === 'pending').length || 0,
        by_type: {} as Record<string, number>
      }

      data?.forEach(notification => {
        const type = notification.notification_type
        stats.by_type[type] = (stats.by_type[type] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error)
      return null
    }
  }
}

// Instância global
export const notificationManager = new WhatsAppNotificationManager()

// Hook React para usar o sistema de notificações
export function useWhatsAppNotifications() {
  return {
    sendClientNotification: notificationManager.sendClientNotification.bind(notificationManager),
    notifyProjectStarted: notificationManager.notifyProjectStarted.bind(notificationManager),
    notifyStageStarted: notificationManager.notifyStageStarted.bind(notificationManager),
    notifyStageCompleted: notificationManager.notifyStageCompleted.bind(notificationManager),
    sendPaymentReminder: notificationManager.sendPaymentReminder.bind(notificationManager),
    requestFeedback: notificationManager.requestFeedback.bind(notificationManager),
    notifyDeliveryReady: notificationManager.notifyDeliveryReady.bind(notificationManager),
    notifyProjectCompleted: notificationManager.notifyProjectCompleted.bind(notificationManager),
    getNotificationHistory: notificationManager.getNotificationHistory.bind(notificationManager),
    getNotificationStats: notificationManager.getNotificationStats.bind(notificationManager)
  }
}