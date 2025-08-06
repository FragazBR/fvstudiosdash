// ==================================================
// FVStudios Dashboard - Sistema de Automação de Projetos
// Lógica inteligente para templates e geração automática
// ==================================================

import { supabaseBrowser } from './supabaseBrowser'

// Interfaces para Types Safety
export interface ProjectTemplate {
  id: string
  name: string
  slug: string
  description: string
  category: 'web_development' | 'mobile_app' | 'branding' | 'marketing' | 'consulting'
  color: string
  icon: string
  is_active: boolean
  stages?: ProjectTemplateStage[]
}

export interface ProjectTemplateStage {
  id: string
  template_id: string
  name: string
  slug: string
  description: string
  order_index: number
  estimated_days: number
  is_required: boolean
  default_assignee_role: string
  completion_criteria: string
  color: string
  tasks?: ProjectTemplateTask[]
}

export interface ProjectTemplateTask {
  id: string
  stage_id: string
  name: string
  description: string
  order_index: number
  estimated_hours: number
  is_required: boolean
  default_assignee_role: string
  tags: string[]
}

export interface ProjectStage {
  id: string
  project_id: string
  template_stage_id?: string
  name: string
  slug: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'
  order_index: number
  progress_percentage: number
  estimated_start_date?: string
  estimated_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  assigned_user_id?: string
  notes?: string
  color: string
}

export interface AutomationConfig {
  project_id: string
  template_id: string
  complexity: 'low' | 'medium' | 'high' | 'enterprise'
  start_date: Date
  auto_assign: boolean
  notify_team: boolean
  calendar_integration: boolean
  slack_integration: boolean
}

// ==================================================
// CLASSE PRINCIPAL - PROJECT AUTOMATION ENGINE
// ==================================================

export class ProjectAutomationEngine {
  private supabase = supabaseBrowser()

  // Buscar todos os templates disponíveis
  async getAvailableTemplates(): Promise<ProjectTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('project_templates')
        .select(`
          *,
          project_template_stages (
            *,
            project_template_tasks (*)
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      return data?.map(template => ({
        ...template,
        stages: template.project_template_stages?.sort((a: any, b: any) => a.order_index - b.order_index)
      })) || []
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      throw new Error('Falha ao carregar templates de projeto')
    }
  }

  // Criar projeto com automação completa
  async createProjectWithAutomation(config: AutomationConfig & {
    name: string
    description?: string
    client_id?: string
    budget_total?: number
  }): Promise<{ project_id: string; stages_created: number }> {
    try {
      // Buscar user profile para pegar agency_id e created_by
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.agency_id) throw new Error('Perfil de usuário não encontrado')

      // 1. CRIAR O PROJETO BASE
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .insert({
          name: config.name,
          description: config.description,
          client_id: config.client_id,
          budget_cents: config.budget_total ? Math.round(config.budget_total * 100) : null,
          status: 'active',
          priority: 'medium',
          agency_id: userProfile.agency_id,
          created_by: user.id,
          start_date: config.start_date.toISOString().split('T')[0],
          end_date: await this.calculateEstimatedCompletion(config.template_id, config.start_date),
          project_health: 'on_track'
        })
        .select()
        .single()

      if (projectError) throw projectError

      // 2. CRIAR STAGES BASEADAS NO TEMPLATE
      const stagesCreated = await this.createProjectStagesFromTemplate(
        project.id, 
        config.template_id, 
        config.start_date,
        userProfile.agency_id,
        user.id
      )

      // 3. AUTO-ATRIBUIR MEMBROS SE HABILITADO
      if (config.auto_assign) {
        await this.autoAssignTeamMembers(project.id)
      }

      // 4. ENVIAR NOTIFICAÇÕES SE HABILITADO
      if (config.notify_team) {
        await this.notifyTeamMembers(project.id, 'project_created')
      }

      // 5. INTEGRAÇÃO COM GOOGLE CALENDAR
      if (config.calendar_integration) {
        await this.createCalendarEvents(project.id)
      }

      // 6. INTEGRAÇÃO COM SLACK
      if (config.slack_integration) {
        await this.sendSlackNotification(project.id, 'project_created')
      }

      // 7. LOG DE AUDITORIA
      await this.logActivity(
        project.id,
        user.id,
        'create',
        'project',
        project.id,
        {
          template_used: config.template_id,
          complexity: config.complexity,
          budget: config.budget_total,
          integrations_enabled: {
            calendar: config.calendar_integration,
            slack: config.slack_integration,
            auto_assign: config.auto_assign,
            notifications: config.notify_team
          }
        }
      )

      // 8. ANÁLISE INICIAL DE SAÚDE DO PROJETO
      await this.analyzeProjectHealth(project.id)

      console.log(`🚀 Projeto "${project.name}" criado com automação completa:`, {
        project_id: project.id,
        stages_created: stagesCreated,
        integrations: {
          calendar: config.calendar_integration,
          slack: config.slack_integration,
          auto_assign: config.auto_assign,
          notifications: config.notify_team
        }
      })

      return { project_id: project.id, stages_created: stagesCreated }
    } catch (error) {
      console.error('Erro na automação do projeto:', error)
      throw new Error(`Falha ao criar projeto automatizado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  // Criar stages do projeto baseadas no template
  private async createProjectStagesFromTemplate(
    project_id: string,
    template_id: string,
    start_date: Date,
    agency_id: string,
    created_by: string
  ): Promise<number> {
    try {
      // Buscar template com stages e tasks
      const { data: template } = await this.supabase
        .from('project_templates')
        .select(`
          *,
          project_template_stages (
            *,
            project_template_tasks (*)
          )
        `)
        .eq('id', template_id)
        .single()

      if (!template?.project_template_stages) {
        console.warn('Template não encontrado ou sem stages, criando stages básicas')
        return await this.createBasicProjectStages(project_id, agency_id, created_by)
      }

      let stagesCreated = 0
      let currentDate = new Date(start_date)

      // Ordenar stages por order_index
      const orderedStages = template.project_template_stages.sort(
        (a: any, b: any) => a.order_index - b.order_index
      )

      for (const templateStage of orderedStages) {
        // Calcular datas estimadas
        const estimatedStartDate = new Date(currentDate)
        const estimatedEndDate = new Date(currentDate)
        estimatedEndDate.setDate(estimatedEndDate.getDate() + templateStage.estimated_days)

        // Criar stage do projeto
        const { data: projectStage } = await this.supabase
          .from('project_stages')
          .insert({
            project_id,
            template_stage_id: templateStage.id,
            name: templateStage.name,
            slug: templateStage.slug,
            description: templateStage.description,
            status: 'pending',
            order_index: templateStage.order_index,
            progress_percentage: 0,
            estimated_start_date: estimatedStartDate.toISOString().split('T')[0],
            estimated_end_date: estimatedEndDate.toISOString().split('T')[0],
            color: templateStage.color,
            agency_id,
            created_by
          })
          .select()
          .single()

        if (projectStage) {
          stagesCreated++

          // Criar tasks desta stage
          if (templateStage.project_template_tasks?.length > 0) {
            for (const templateTask of templateStage.project_template_tasks) {
              await this.supabase
                .from('tasks')
                .insert({
                  title: templateTask.name,
                  description: templateTask.description,
                  project_id,
                  stage_id: projectStage.id,
                  status: 'todo',
                  priority: 'medium',
                  estimated_hours: templateTask.estimated_hours,
                  order_index: templateTask.order_index,
                  agency_id,
                  created_by
                })
            }
          }
        }

        // Próxima stage começa após esta terminar
        currentDate = new Date(estimatedEndDate)
        currentDate.setDate(currentDate.getDate() + 1) // 1 dia de buffer
      }

      return stagesCreated
    } catch (error) {
      console.error('Erro ao criar stages do template:', error)
      // Fallback para stages básicas
      return await this.createBasicProjectStages(project_id, agency_id, created_by)
    }
  }

  // Criar stages básicas quando template não estiver disponível
  private async createBasicProjectStages(
    project_id: string,
    agency_id: string,
    created_by: string
  ): Promise<number> {
    const basicStages = [
      {
        name: 'Planejamento',
        slug: 'planning',
        description: 'Definição de escopo e requisitos',
        color: '#3B82F6',
        estimated_days: 5
      },
      {
        name: 'Design',
        slug: 'design',
        description: 'Criação de layouts e interfaces',
        color: '#8B5CF6',
        estimated_days: 10
      },
      {
        name: 'Desenvolvimento',
        slug: 'development',
        description: 'Implementação das funcionalidades',
        color: '#F59E0B',
        estimated_days: 20
      },
      {
        name: 'Testes',
        slug: 'testing',
        description: 'Validação e correções',
        color: '#EF4444',
        estimated_days: 7
      },
      {
        name: 'Entrega',
        slug: 'delivery',
        description: 'Deploy e entrega final',
        color: '#10B981',
        estimated_days: 3
      }
    ]

    let stagesCreated = 0
    let currentDate = new Date()

    for (let i = 0; i < basicStages.length; i++) {
      const stage = basicStages[i]
      const estimatedStartDate = new Date(currentDate)
      const estimatedEndDate = new Date(currentDate)
      estimatedEndDate.setDate(estimatedEndDate.getDate() + stage.estimated_days)

      const { data: projectStage } = await this.supabase
        .from('project_stages')
        .insert({
          project_id,
          name: stage.name,
          slug: stage.slug,
          description: stage.description,
          status: 'pending',
          order_index: i + 1,
          progress_percentage: 0,
          estimated_start_date: estimatedStartDate.toISOString().split('T')[0],
          estimated_end_date: estimatedEndDate.toISOString().split('T')[0],
          color: stage.color,
          agency_id,
          created_by
        })
        .select()
        .single()

      if (projectStage) {
        stagesCreated++

        // Criar algumas tarefas básicas para cada stage
        const basicTasks = this.getBasicTasksForStage(stage.slug)
        for (let j = 0; j < basicTasks.length; j++) {
          const task = basicTasks[j]
          await this.supabase
            .from('tasks')
            .insert({
              title: task.title,
              description: task.description,
              project_id,
              stage_id: projectStage.id,
              status: 'todo',
              priority: 'medium',
              estimated_hours: task.estimated_hours || 8,
              order_index: j + 1,
              agency_id,
              created_by
            })
        }
      }

      currentDate = new Date(estimatedEndDate)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return stagesCreated
  }

  // Obter tarefas básicas para cada tipo de stage
  private getBasicTasksForStage(stageSlug: string): Array<{title: string, description: string, estimated_hours?: number}> {
    const tasksByStage: Record<string, Array<{title: string, description: string, estimated_hours?: number}>> = {
      planning: [
        { title: 'Kickoff meeting', description: 'Reunião inicial com cliente e equipe', estimated_hours: 2 },
        { title: 'Análise de requisitos', description: 'Levantamento detalhado das necessidades', estimated_hours: 8 },
        { title: 'Definição de escopo', description: 'Documentar escopo e limites do projeto', estimated_hours: 4 },
        { title: 'Cronograma inicial', description: 'Criar timeline preliminar', estimated_hours: 3 }
      ],
      design: [
        { title: 'Pesquisa e referências', description: 'Buscar inspirações e tendências', estimated_hours: 4 },
        { title: 'Wireframes', description: 'Criar estruturas básicas das telas', estimated_hours: 8 },
        { title: 'Design visual', description: 'Desenvolver identidade visual', estimated_hours: 16 },
        { title: 'Prototipagem', description: 'Criar protótipos interativos', estimated_hours: 8 }
      ],
      development: [
        { title: 'Configuração do ambiente', description: 'Setup inicial do projeto', estimated_hours: 4 },
        { title: 'Desenvolvimento backend', description: 'APIs e lógica de negócio', estimated_hours: 40 },
        { title: 'Desenvolvimento frontend', description: 'Interface do usuário', estimated_hours: 32 },
        { title: 'Integração de sistemas', description: 'Conectar diferentes partes', estimated_hours: 16 }
      ],
      testing: [
        { title: 'Testes unitários', description: 'Validar componentes individuais', estimated_hours: 12 },
        { title: 'Testes de integração', description: 'Validar funcionamento conjunto', estimated_hours: 8 },
        { title: 'Testes de usuário', description: 'Validação com usuários reais', estimated_hours: 6 },
        { title: 'Correção de bugs', description: 'Resolver problemas encontrados', estimated_hours: 10 }
      ],
      delivery: [
        { title: 'Deploy em produção', description: 'Publicar aplicação', estimated_hours: 4 },
        { title: 'Documentação final', description: 'Manual e documentação técnica', estimated_hours: 6 },
        { title: 'Treinamento do cliente', description: 'Capacitar equipe do cliente', estimated_hours: 4 },
        { title: 'Revisão final', description: 'Verificação geral e entrega', estimated_hours: 2 }
      ]
    }

    return tasksByStage[stageSlug] || [
      { title: 'Tarefa genérica', description: 'Executar atividades da etapa', estimated_hours: 8 }
    ]
  }

  // Calcular data estimada de conclusão baseada no template
  private async calculateEstimatedCompletion(template_id: string, start_date: Date): Promise<string> {
    try {
      const { data: stages } = await this.supabase
        .from('project_template_stages')
        .select('estimated_days')
        .eq('template_id', template_id)

      const totalDays = stages?.reduce((total, stage) => total + stage.estimated_days, 0) || 30
      
      const estimatedDate = new Date(start_date)
      estimatedDate.setDate(estimatedDate.getDate() + totalDays)
      
      return estimatedDate.toISOString().split('T')[0]
    } catch (error) {
      console.error('Erro ao calcular data de conclusão:', error)
      const defaultDate = new Date(start_date)
      defaultDate.setDate(defaultDate.getDate() + 30)
      return defaultDate.toISOString().split('T')[0]
    }
  }

  // Auto-atribuir membros da equipe baseado nos roles padrão
  private async autoAssignTeamMembers(project_id: string): Promise<void> {
    try {
      const { data: stages } = await this.supabase
        .from('project_stages')
        .select(`
          id,
          template_stage_id,
          project_template_stages!template_stage_id (default_assignee_role)
        `)
        .eq('project_id', project_id)
        .not('template_stage_id', 'is', null)

      // Buscar projeto para pegar agency_id
      const { data: project } = await this.supabase
        .from('projects')
        .select('agency_id')
        .eq('id', project_id)
        .single()

      if (!project) return

      for (const stage of stages || []) {
        const role = stage.project_template_stages?.default_assignee_role
        if (!role) continue

        // Buscar usuário disponível com o role necessário da mesma agência
        const { data: user } = await this.supabase
          .from('user_profiles')
          .select('id')
          .eq('role', role)
          .eq('status', 'active')
          .eq('agency_id', project.agency_id)
          .limit(1)
          .single()

        if (user) {
          await this.supabase
            .from('project_stages')
            .update({ assigned_user_id: user.id })
            .eq('id', stage.id)
        }
      }
    } catch (error) {
      console.error('Erro na auto-atribuição:', error)
      // Não é crítico, apenas registra o erro
    }
  }

  // Sistema de notificações inteligentes
  async notifyTeamMembers(project_id: string, notification_type: string): Promise<void> {
    try {
      const { data: project } = await this.supabase
        .from('projects')
        .select('name, agency_id, client:client_id(contact_name, company)')
        .eq('id', project_id)
        .single()

      const { data: assignedUsers } = await this.supabase
        .from('project_stages')
        .select('assigned_user_id')
        .eq('project_id', project_id)
        .not('assigned_user_id', 'is', null)

      const uniqueUsers = [...new Set(assignedUsers?.map(u => u.assigned_user_id))]

      // Se não há usuários atribuídos, notificar todos os managers da agência
      if (uniqueUsers.length === 0) {
        const { data: managers } = await this.supabase
          .from('user_profiles')
          .select('id')
          .eq('agency_id', project?.agency_id)
          .in('role', ['agency_owner', 'agency_manager'])
          .eq('status', 'active')

        uniqueUsers.push(...(managers?.map(m => m.id) || []))
      }

      const clientName = project?.client?.contact_name || project?.client?.company || 'Cliente não informado'

      for (const user_id of uniqueUsers) {
        if (!user_id) continue

        try {
          await this.supabase
            .from('realtime_notifications')
            .insert({
              user_id,
              title: `🚀 Novo projeto: ${project?.name}`,
              message: `Você foi atribuído(a) ao projeto "${project?.name}" para ${clientName}. Verifique suas etapas e comece a trabalhar!`,
              type: notification_type,
              priority: 'medium',
              entity_type: 'project',
              entity_id: project_id,
              metadata: { 
                project_name: project?.name, 
                client_name: clientName,
                project_id 
              },
              agency_id: project?.agency_id
            })
        } catch (notifError) {
          console.log('Erro ao criar notificação individual:', notifError)
        }
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error)
      // Não é crítico, apenas registra o erro
    }
  }

  // Integração com Google Calendar (webhook)
  private async createCalendarEvents(project_id: string): Promise<void> {
    try {
      const { data: stages } = await this.supabase
        .from('project_stages')
        .select(`
          name,
          estimated_start_date,
          estimated_end_date,
          assigned_user_id,
          description,
          user_profiles!assigned_user_id(full_name, email)
        `)
        .eq('project_id', project_id)
        .not('estimated_start_date', 'is', null)

      const { data: project } = await this.supabase
        .from('projects')
        .select('name, agency_id')
        .eq('id', project_id)
        .single()

      // Buscar configurações do Google Calendar da agência
      const { data: calendarConfig } = await this.supabase
        .from('google_calendar_integrations')
        .select('access_token, calendar_id, is_active')
        .eq('agency_id', project?.agency_id)
        .eq('is_active', true)
        .single()

      if (!calendarConfig?.access_token) {
        console.log('Integração Google Calendar não configurada')
        // Criar eventos locais para sincronização futura
        await this.createLocalCalendarEvents(project_id, stages || [])
        return
      }

      const eventsCreated = []
      
      for (const stage of stages || []) {
        try {
          const calendarEvent = {
            summary: `${project?.name} - ${stage.name}`,
            description: `Projeto: ${project?.name}\nEtapa: ${stage.name}\n\n${stage.description || 'Sem descrição'}\n\nID do Projeto: ${project_id}`,
            start: {
              date: stage.estimated_start_date,
              timeZone: 'America/Sao_Paulo'
            },
            end: {
              date: stage.estimated_end_date,
              timeZone: 'America/Sao_Paulo'
            },
            attendees: stage.user_profiles ? [{
              email: stage.user_profiles.email,
              displayName: stage.user_profiles.full_name
            }] : [],
            colorId: '9', // Azul para projetos
            extendedProperties: {
              private: {
                project_id: project_id,
                stage_id: stage.id,
                created_by: 'fvstudios_automation'
              }
            }
          }

          // Criar evento via Google Calendar API
          const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calendarConfig.calendar_id}/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${calendarConfig.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(calendarEvent)
            }
          )

          if (response.ok) {
            const createdEvent = await response.json()
            eventsCreated.push({
              stage_id: stage.id,
              calendar_event_id: createdEvent.id,
              event_url: createdEvent.htmlLink
            })
            
            // Salvar referência do evento
            await this.supabase
              .from('calendar_events')
              .insert({
                project_id,
                stage_id: stage.id,
                google_event_id: createdEvent.id,
                event_url: createdEvent.htmlLink,
                event_title: calendarEvent.summary,
                start_date: stage.estimated_start_date,
                end_date: stage.estimated_end_date,
                agency_id: project?.agency_id
              })
          } else {
            console.error('Erro ao criar evento no Google Calendar:', response.status, await response.text())
          }
        } catch (eventError) {
          console.error('Erro ao criar evento individual:', eventError)
        }
      }

      console.log(`📅 Criados ${eventsCreated.length} eventos no Google Calendar`)
    } catch (error) {
      console.error('Erro na integração com Calendar:', error)
      // Não é crítico, apenas registra o erro
    }
  }

  // Criar eventos locais para sincronização futura quando Calendar não estiver configurado
  private async createLocalCalendarEvents(project_id: string, stages: any[]): Promise<void> {
    try {
      for (const stage of stages) {
        await this.supabase
          .from('calendar_events')
          .insert({
            project_id,
            stage_id: stage.id,
            event_title: stage.name,
            start_date: stage.estimated_start_date,
            end_date: stage.estimated_end_date,
            sync_status: 'pending',
            event_type: 'project_stage'
          })
      }
      console.log('📅 Eventos salvos localmente para sincronização futura')
    } catch (error) {
      console.error('Erro ao criar eventos locais:', error)
    }
  }

  // Integração com Slack (webhook)
  private async sendSlackNotification(project_id: string, event_type: string): Promise<void> {
    try {
      const { data: project } = await this.supabase
        .from('projects')
        .select('name, agency_id, client:client_id(contact_name, company)')
        .eq('id', project_id)
        .single()

      // Buscar configurações de Slack da agência
      const { data: slackConfig } = await this.supabase
        .from('slack_integrations')
        .select('webhook_url, channel, is_active')
        .eq('agency_id', project?.agency_id)
        .eq('is_active', true)
        .single()

      if (!slackConfig?.webhook_url) {
        console.log('Integração Slack não configurada para esta agência')
        return
      }

      const clientName = project?.client?.contact_name || project?.client?.company || 'Não informado'
      
      const message = {
        text: `🚀 Novo projeto criado: *${project?.name}*`,
        channel: slackConfig.channel || '#projetos',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🚀 *Novo projeto criado automaticamente*\n\n*Projeto:* ${project?.name}\n*Cliente:* ${clientName}\n*Status:* Iniciado com automação inteligente\n*ID:* ${project_id.substring(0, 8)}...`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '👀 Ver Projeto' },
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.fvstudios.com.br'}/workstation?project=${project_id}`,
                style: 'primary'
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: '📋 Ver Tarefas' },
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.fvstudios.com.br'}/projects/${project_id}/tasks`
              }
            ]
          }
        ]
      }

      // Enviar para Slack webhook
      try {
        const response = await fetch(slackConfig.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        })

        if (!response.ok) {
          throw new Error(`Slack webhook failed: ${response.status}`)
        }

        console.log('✅ Notificação Slack enviada com sucesso')
      } catch (fetchError) {
        console.error('Erro ao enviar para Slack:', fetchError)
      }
    } catch (error) {
      console.error('Erro na integração com Slack:', error)
      // Não é crítico, apenas registra o erro
    }
  }

  // Log de atividades para auditoria
  private async logActivity(
    project_id: string,
    user_id: string,
    action_type: string,
    entity_type: string,
    entity_id: string,
    metadata: any
  ): Promise<void> {
    try {
      // Buscar agência do usuário
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('agency_id')
        .eq('id', user_id)
        .single()

      await this.supabase
        .from('activity_log')
        .insert({
          user_id,
          action_type,
          entity_type,
          entity_id,
          old_value: null,
          new_value: metadata,
          description: `Projeto criado automaticamente usando template ${metadata.template_used}`,
          ip_address: null, // Será preenchido pelo RLS se necessário
          user_agent: 'FVStudios Automation Engine',
          agency_id: userProfile?.agency_id,
          metadata: {
            project_id,
            automation_version: '2.0',
            ...metadata
          }
        })

      console.log('📝 Log de auditoria criado com sucesso')
    } catch (error) {
      console.error('Erro ao registrar atividade:', error)
      // Não é crítico, apenas registra o erro
    }
  }

  // Calcular complexidade automática baseada em parâmetros
  static calculateComplexity(params: {
    stages_count: number
    estimated_hours: number
    budget: number
    team_size: number
  }): 'low' | 'medium' | 'high' | 'enterprise' {
    let score = 0

    // Pontuação baseada em etapas
    if (params.stages_count <= 3) score += 1
    else if (params.stages_count <= 6) score += 2
    else if (params.stages_count <= 10) score += 3
    else score += 4

    // Pontuação baseada em horas
    if (params.estimated_hours <= 40) score += 1
    else if (params.estimated_hours <= 160) score += 2
    else if (params.estimated_hours <= 400) score += 3
    else score += 4

    // Pontuação baseada em orçamento
    if (params.budget <= 5000) score += 1
    else if (params.budget <= 20000) score += 2
    else if (params.budget <= 50000) score += 3
    else score += 4

    // Pontuação baseada em tamanho da equipe
    if (params.team_size <= 2) score += 1
    else if (params.team_size <= 5) score += 2
    else if (params.team_size <= 10) score += 3
    else score += 4

    if (score <= 6) return 'low'
    if (score <= 10) return 'medium'
    if (score <= 14) return 'high'
    return 'enterprise'
  }

  // Monitoramento inteligente de saúde do projeto
  async analyzeProjectHealth(project_id: string): Promise<{
    health: 'on_track' | 'at_risk' | 'delayed'
    score: number
    issues: string[]
    recommendations: string[]
  }> {
    try {
      const { data: project } = await this.supabase
        .from('projects')
        .select(`
          *,
          project_stages (*)
        `)
        .eq('id', project_id)
        .single()

      const issues: string[] = []
      const recommendations: string[] = []
      let score = 100

      const stages = project.project_stages || []
      const totalStages = stages.length
      const completedStages = stages.filter((s: any) => s.status === 'completed').length
      const overdue = stages.filter((s: any) => 
        s.estimated_end_date && new Date(s.estimated_end_date) < new Date() && s.status !== 'completed'
      ).length

      // Análise de progresso
      const progressRate = totalStages > 0 ? (completedStages / totalStages) : 0
      if (progressRate < 0.3) {
        score -= 20
        issues.push('Progresso lento detectado')
        recommendations.push('Revisar cronograma e recursos alocados')
      }

      // Análise de etapas atrasadas
      if (overdue > 0) {
        score -= overdue * 15
        issues.push(`${overdue} etapa(s) em atraso`)
        recommendations.push('Redistribuir tarefas e ajustar prazos')
      }

      // Análise de etapas bloqueadas
      const blocked = stages.filter((s: any) => s.status === 'blocked').length
      if (blocked > 0) {
        score -= blocked * 25
        issues.push(`${blocked} etapa(s) bloqueada(s)`)
        recommendations.push('Resolver bloqueios urgentemente')
      }

      let health: 'on_track' | 'at_risk' | 'delayed'
      if (score >= 80) health = 'on_track'
      else if (score >= 60) health = 'at_risk'
      else health = 'delayed'

      // Atualizar saúde no banco
      await this.supabase
        .from('projects')
        .update({ project_health: health })
        .eq('id', project_id)

      return { health, score, issues, recommendations }
    } catch (error) {
      console.error('Erro na análise de saúde:', error)
      return { 
        health: 'at_risk', 
        score: 50, 
        issues: ['Erro na análise'], 
        recommendations: ['Verificar dados do projeto'] 
      }
    }
  }
}

// Instância global do sistema de automação
export const projectAutomation = new ProjectAutomationEngine()

// Utilidades auxiliares
export const ProjectUtils = {
  // Converter dias em data legível
  formatDuration: (days: number): string => {
    if (days === 1) return '1 dia'
    if (days < 7) return `${days} dias`
    if (days === 7) return '1 semana'
    if (days % 7 === 0) return `${days / 7} semanas`
    return `${Math.floor(days / 7)} semanas e ${days % 7} dias`
  },

  // Cores dinâmicas para status
  getStatusColor: (status: string): string => {
    const colors = {
      pending: '#6B7280',
      in_progress: '#3B82F6',
      completed: '#10B981',
      blocked: '#EF4444',
      cancelled: '#6B7280'
    }
    return colors[status as keyof typeof colors] || '#6B7280'
  },

  // Validar template antes de usar
  validateTemplate: (template: ProjectTemplate): boolean => {
    return template.stages !== undefined && 
           template.stages.length > 0 && 
           template.stages.every(stage => stage.estimated_days > 0)
  }
}