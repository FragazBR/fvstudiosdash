'use client'

// ==================================================
// FVStudios Dashboard - Project Notification Triggers
// Sistema de triggers automáticos para notificações de projeto
// ==================================================

import { notificationManager } from './whatsapp-notifications'
import { supabaseBrowser } from './supabaseBrowser'
import { toast } from 'sonner'

// Tipos de eventos de projeto
export interface ProjectEvent {
  id: string
  project_id: string
  client_id: string
  agency_id: string
  event_type: 'project_created' | 'stage_changed' | 'task_completed' | 'payment_due' | 'deadline_approaching' | 'feedback_required' | 'project_completed'
  event_data: any
  triggered_at: Date
  notifications_sent: string[]
}

export interface ProjectStatus {
  id: string
  name: string
  type: string
  current_stage: number
  total_stages: number
  progress_percentage: number
  estimated_completion: Date
  client_id: string
  agency_id: string
  metadata: any
}

export class ProjectNotificationTriggers {
  private supabase = supabaseBrowser()

  // Registrar evento de projeto
  async registerProjectEvent(
    projectId: string,
    eventType: string,
    eventData: any,
    triggerNotifications: boolean = true
  ): Promise<void> {
    try {
      // Buscar dados do projeto
      const { data: project } = await this.supabase
        .from('projects')
        .select('client_id, agency_id, name, type, status')
        .eq('id', projectId)
        .single()

      if (!project) {
        console.error('Projeto não encontrado:', projectId)
        return
      }

      // Registrar evento
      const { error } = await this.supabase
        .from('project_events')
        .insert({
          project_id: projectId,
          client_id: project.client_id,
          agency_id: project.agency_id,
          event_type: eventType,
          event_data: eventData,
          triggered_at: new Date().toISOString(),
          notifications_sent: []
        })

      if (error) {
        console.error('Erro ao registrar evento:', error)
        return
      }

      // Disparar notificações se solicitado
      if (triggerNotifications) {
        await this.processProjectEvent(projectId, eventType, eventData)
      }

    } catch (error) {
      console.error('Erro ao registrar evento do projeto:', error)
    }
  }

  // Processar evento e enviar notificações
  private async processProjectEvent(
    projectId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    try {
      // Buscar dados completos do projeto
      const { data: project } = await this.supabase
        .from('projects')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', projectId)
        .single()

      if (!project) return

      switch (eventType) {
        case 'project_created':
          await this.handleProjectCreated(project, eventData)
          break

        case 'stage_changed':
          await this.handleStageChanged(project, eventData)
          break

        case 'task_completed':
          await this.handleTaskCompleted(project, eventData)
          break

        case 'payment_due':
          await this.handlePaymentDue(project, eventData)
          break

        case 'deadline_approaching':
          await this.handleDeadlineApproaching(project, eventData)
          break

        case 'feedback_required':
          await this.handleFeedbackRequired(project, eventData)
          break

        case 'project_completed':
          await this.handleProjectCompleted(project, eventData)
          break

        default:
          console.log('Tipo de evento não reconhecido:', eventType)
      }

    } catch (error) {
      console.error('Erro ao processar evento do projeto:', error)
    }
  }

  // Handlers para cada tipo de evento
  private async handleProjectCreated(project: any, eventData: any): Promise<void> {
    await notificationManager.notifyProjectStarted(
      project.id,
      project.client_id,
      project.agency_id,
      {
        project_name: project.name,
        project_type: project.type,
        estimated_duration: eventData.estimated_duration || 30,
        team_members: eventData.team_members || ['Equipe FVStudios'],
        next_actions: eventData.next_actions || [
          'Aguardar briefing detalhado',
          'Definir cronograma final',
          'Iniciar primeira etapa'
        ]
      }
    )

    // Agendar lembretes automáticos
    await this.scheduleAutomaticReminders(project.id, project.estimated_completion)
  }

  private async handleStageChanged(project: any, eventData: any): Promise<void> {
    const { new_stage, previous_stage, stage_info } = eventData

    if (previous_stage && previous_stage > 0) {
      // Notificar conclusão da etapa anterior
      await notificationManager.notifyStageCompleted(
        project.id,
        project.client_id,
        project.agency_id,
        {
          completed_stage: eventData.previous_stage_info,
          current_stage: new_stage,
          total_stages: eventData.total_stages,
          next_stage: stage_info,
          completed_deliverables: eventData.completed_deliverables || []
        }
      )
    }

    // Notificar início da nova etapa
    if (new_stage <= eventData.total_stages) {
      await notificationManager.notifyStageStarted(
        project.id,
        project.client_id,
        project.agency_id,
        {
          project_type: project.type,
          current_stage: new_stage,
          total_stages: eventData.total_stages,
          stage_info: stage_info
        }
      )
    }
  }

  private async handleTaskCompleted(project: any, eventData: any): Promise<void> {
    const { task_name, deliverables, requires_client_action } = eventData

    if (requires_client_action) {
      await notificationManager.requestFeedback(
        project.client_id,
        project.agency_id,
        {
          subject: `Aprovação necessária: ${task_name}`,
          details: `A tarefa "${task_name}" foi concluída e precisa da sua aprovação.`,
          criteria: [
            'Qualidade do trabalho realizado',
            'Atendimento aos requisitos',
            'Necessidade de ajustes'
          ],
          feedback_link: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${project.id}/tasks/${eventData.task_id}`,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
        }
      )
    } else if (deliverables && deliverables.length > 0) {
      await notificationManager.notifyDeliveryReady(
        project.client_id,
        project.agency_id,
        {
          deliverable_name: task_name,
          items: deliverables,
          download_links: eventData.download_links || [],
          next_steps: eventData.next_steps || ['Aguardar próxima etapa']
        }
      )
    }
  }

  private async handlePaymentDue(project: any, eventData: any): Promise<void> {
    await notificationManager.sendPaymentReminder(
      project.client_id,
      project.agency_id,
      {
        project_name: project.name,
        amount: eventData.amount,
        due_date: new Date(eventData.due_date),
        installment: eventData.installment || 1,
        total_installments: eventData.total_installments || 1,
        payment_methods: eventData.payment_methods || {}
      }
    )
  }

  private async handleDeadlineApproaching(project: any, eventData: any): Promise<void> {
    const daysUntilDeadline = eventData.days_until_deadline

    let message = `⏰ *Lembrete de Prazo*

Olá ${project.client.name}!

O prazo do seu projeto *${project.name}* está se aproximando:

*📅 Prazo final:* ${new Date(eventData.deadline).toLocaleDateString('pt-BR')}
*⏳ Tempo restante:* ${daysUntilDeadline} dias

*📊 Status atual:*
${eventData.progress_bar}
${eventData.progress_percentage}% concluído

*🎯 Para cumprir o prazo:*
${eventData.pending_actions?.join('\n• ') || '• Todas as etapas estão em dia'}

Qualquer dúvida, estamos aqui! 😊`

    await notificationManager.sendClientNotification(
      project.client_id,
      project.agency_id,
      'deadline_approaching',
      { message }
    )
  }

  private async handleFeedbackRequired(project: any, eventData: any): Promise<void> {
    await notificationManager.requestFeedback(
      project.client_id,
      project.agency_id,
      eventData
    )
  }

  private async handleProjectCompleted(project: any, eventData: any): Promise<void> {
    await notificationManager.notifyProjectCompleted(
      project.id,
      project.client_id,
      project.agency_id,
      {
        project_name: project.name,
        project_duration: eventData.project_duration || 30,
        completed_stages: eventData.completed_stages || 5,
        total_deliveries: eventData.total_deliveries || 10,
        final_deliverables: eventData.final_deliverables || [],
        post_project_actions: eventData.post_project_actions || [
          'Período de garantia de 30 dias',
          'Suporte técnico disponível',
          'Avaliação do projeto'
        ],
        review_link: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${project.id}/review`
      }
    )
  }

  // Agendar lembretes automáticos
  private async scheduleAutomaticReminders(
    projectId: string,
    estimatedCompletion: Date
  ): Promise<void> {
    try {
      const reminders = [
        {
          days_before: 7,
          type: 'deadline_approaching',
          message: 'Prazo se aproximando - 1 semana restante'
        },
        {
          days_before: 3,
          type: 'deadline_approaching',
          message: 'Prazo se aproximando - 3 dias restantes'
        },
        {
          days_before: 1,
          type: 'deadline_approaching',
          message: 'Prazo se aproximando - último dia'
        }
      ]

      for (const reminder of reminders) {
        const reminderDate = new Date(estimatedCompletion)
        reminderDate.setDate(reminderDate.getDate() - reminder.days_before)

        if (reminderDate > new Date()) {
          await this.supabase
            .from('scheduled_notifications')
            .insert({
              project_id: projectId,
              scheduled_at: reminderDate.toISOString(),
              notification_type: reminder.type,
              notification_data: {
                days_until_deadline: reminder.days_before,
                message: reminder.message
              },
              status: 'pending'
            })
        }
      }
    } catch (error) {
      console.error('Erro ao agendar lembretes:', error)
    }
  }

  // Métodos para triggers manuais
  async triggerProjectCreated(
    projectId: string,
    projectData: {
      estimated_duration?: number
      team_members?: string[]
      next_actions?: string[]
    }
  ): Promise<void> {
    await this.registerProjectEvent(projectId, 'project_created', projectData)
  }

  async triggerStageChanged(
    projectId: string,
    stageData: {
      new_stage: number
      previous_stage?: number
      total_stages: number
      stage_info: any
      previous_stage_info?: any
      completed_deliverables?: string[]
    }
  ): Promise<void> {
    await this.registerProjectEvent(projectId, 'stage_changed', stageData)
  }

  async triggerTaskCompleted(
    projectId: string,
    taskData: {
      task_id: string
      task_name: string
      deliverables?: string[]
      download_links?: string[]
      next_steps?: string[]
      requires_client_action?: boolean
    }
  ): Promise<void> {
    await this.registerProjectEvent(projectId, 'task_completed', taskData)
  }

  async triggerPaymentDue(
    projectId: string,
    paymentData: {
      amount: number
      due_date: string
      installment?: number
      total_installments?: number
      payment_methods?: any
    }
  ): Promise<void> {
    await this.registerProjectEvent(projectId, 'payment_due', paymentData)
  }

  async triggerFeedbackRequired(
    projectId: string,
    feedbackData: {
      subject: string
      details: string
      criteria: string[]
      feedback_link: string
      deadline: Date
    }
  ): Promise<void> {
    await this.registerProjectEvent(projectId, 'feedback_required', feedbackData)
  }

  async triggerProjectCompleted(
    projectId: string,
    completionData: {
      project_duration?: number
      completed_stages?: number
      total_deliveries?: number
      final_deliverables?: string[]
      post_project_actions?: string[]
    }
  ): Promise<void> {
    await this.registerProjectEvent(projectId, 'project_completed', completionData)
  }

  // Processar notificações agendadas
  async processScheduledNotifications(): Promise<void> {
    try {
      const { data: notifications } = await this.supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .limit(50)

      for (const notification of notifications || []) {
        await this.processProjectEvent(
          notification.project_id,
          notification.notification_type,
          notification.notification_data
        )

        await this.supabase
          .from('scheduled_notifications')
          .update({ status: 'sent' })
          .eq('id', notification.id)
      }
    } catch (error) {
      console.error('Erro ao processar notificações agendadas:', error)
    }
  }

  // Buscar eventos de projeto
  async getProjectEvents(
    projectId: string,
    limit: number = 50
  ): Promise<ProjectEvent[]> {
    try {
      const { data, error } = await this.supabase
        .from('project_events')
        .select('*')
        .eq('project_id', projectId)
        .order('triggered_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar eventos do projeto:', error)
      return []
    }
  }

  // Estatísticas de eventos
  async getEventStats(agencyId: string, period: 'week' | 'month' = 'month') {
    try {
      const startDate = new Date()
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7)
      } else {
        startDate.setMonth(startDate.getMonth() - 1)
      }

      const { data, error } = await this.supabase
        .from('project_events')
        .select('event_type, triggered_at')
        .eq('agency_id', agencyId)
        .gte('triggered_at', startDate.toISOString())

      if (error) throw error

      const stats = {
        total_events: data?.length || 0,
        by_type: {} as Record<string, number>,
        daily_breakdown: {} as Record<string, number>
      }

      data?.forEach(event => {
        // Por tipo
        const type = event.event_type
        stats.by_type[type] = (stats.by_type[type] || 0) + 1

        // Por dia
        const day = new Date(event.triggered_at).toDateString()
        stats.daily_breakdown[day] = (stats.daily_breakdown[day] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Erro ao calcular estatísticas de eventos:', error)
      return null
    }
  }
}

// Instância global
export const projectTriggers = new ProjectNotificationTriggers()

// Hook React para usar os triggers
export function useProjectTriggers() {
  return {
    triggerProjectCreated: projectTriggers.triggerProjectCreated.bind(projectTriggers),
    triggerStageChanged: projectTriggers.triggerStageChanged.bind(projectTriggers),
    triggerTaskCompleted: projectTriggers.triggerTaskCompleted.bind(projectTriggers),
    triggerPaymentDue: projectTriggers.triggerPaymentDue.bind(projectTriggers),
    triggerFeedbackRequired: projectTriggers.triggerFeedbackRequired.bind(projectTriggers),
    triggerProjectCompleted: projectTriggers.triggerProjectCompleted.bind(projectTriggers),
    getProjectEvents: projectTriggers.getProjectEvents.bind(projectTriggers),
    getEventStats: projectTriggers.getEventStats.bind(projectTriggers)
  }
}