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
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .insert({
          name: config.name,
          description: config.description,
          client_id: config.client_id,
          budget_total: config.budget_total,
          template_id: config.template_id,
          complexity: config.complexity,
          auto_generated: true,
          estimated_completion_date: this.calculateEstimatedCompletion(config.template_id, config.start_date),
          actual_start_date: config.start_date.toISOString().split('T')[0],
          project_health: 'on_track',
          status: 'active'
        })
        .select()
        .single()

      if (projectError) throw projectError

      // Gerar etapas automaticamente usando stored procedure
      const { error: stagesError } = await this.supabase
        .rpc('generate_project_stages', {
          p_project_id: project.id,
          p_template_id: config.template_id,
          p_start_date: config.start_date.toISOString().split('T')[0]
        })

      if (stagesError) throw stagesError

      // Contar etapas criadas
      const { count } = await this.supabase
        .from('project_stages')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id)

      // Auto-atribuir responsáveis se configurado
      if (config.auto_assign) {
        await this.autoAssignTeamMembers(project.id)
      }

      // Enviar notificações se configurado
      if (config.notify_team) {
        await this.notifyTeamMembers(project.id, 'project_created')
      }

      // Integração com Google Calendar
      if (config.calendar_integration) {
        await this.createCalendarEvents(project.id)
      }

      // Integração com Slack
      if (config.slack_integration) {
        await this.sendSlackNotification(project.id, 'project_created')
      }

      // Log da ação
      await this.logActivity(project.id, project.created_by, 'created', 'project', project.id, {
        template_used: config.template_id,
        auto_generated: true,
        complexity: config.complexity
      })

      return { project_id: project.id, stages_created: count || 0 }
    } catch (error) {
      console.error('Erro na automação do projeto:', error)
      throw new Error('Falha ao criar projeto automatizado')
    }
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
          project_template_stages!inner (default_assignee_role)
        `)
        .eq('project_id', project_id)

      for (const stage of stages || []) {
        const role = stage.project_template_stages?.default_assignee_role
        if (!role) continue

        // Buscar usuário disponível com o role necessário
        const { data: user } = await this.supabase
          .from('user_profiles')
          .select('id')
          .eq('role', role)
          .eq('is_active', true)
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
    }
  }

  // Sistema de notificações inteligentes
  async notifyTeamMembers(project_id: string, notification_type: string): Promise<void> {
    try {
      const { data: project } = await this.supabase
        .from('projects')
        .select('name, client:contacts(name)')
        .eq('id', project_id)
        .single()

      const { data: assignedUsers } = await this.supabase
        .from('project_stages')
        .select('assigned_user_id')
        .eq('project_id', project_id)
        .not('assigned_user_id', 'is', null)

      const uniqueUsers = [...new Set(assignedUsers?.map(u => u.assigned_user_id))]

      for (const user_id of uniqueUsers) {
        if (!user_id) continue

        await this.supabase
          .from('project_notifications')
          .insert({
            project_id,
            user_id,
            notification_type,
            title: `Novo projeto: ${project?.name}`,
            message: `Você foi atribuído(a) ao projeto "${project?.name}"${project?.client?.name ? ` para ${project.client.name}` : ''}. Verifique suas etapas e comece a trabalhar!`,
            priority: 'medium',
            metadata: { project_name: project?.name, client_name: project?.client?.name }
          })
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error)
    }
  }

  // Integração com Google Calendar (webhook)
  private async createCalendarEvents(project_id: string): Promise<void> {
    try {
      const { data: stages } = await this.supabase
        .from('project_stages')
        .select('name, estimated_start_date, estimated_end_date, assigned_user_id')
        .eq('project_id', project_id)
        .not('estimated_start_date', 'is', null)

      const { data: project } = await this.supabase
        .from('projects')
        .select('name')
        .eq('id', project_id)
        .single()

      for (const stage of stages || []) {
        if (!stage.assigned_user_id) continue

        // Aqui você integraria com Google Calendar API
        const calendarEvent = {
          summary: `${project?.name} - ${stage.name}`,
          start: stage.estimated_start_date,
          end: stage.estimated_end_date,
          attendees: [stage.assigned_user_id]
        }

        // TODO: Implementar integração real com Google Calendar
        console.log('Evento criado:', calendarEvent)
      }
    } catch (error) {
      console.error('Erro na integração com Calendar:', error)
    }
  }

  // Integração com Slack (webhook)
  private async sendSlackNotification(project_id: string, event_type: string): Promise<void> {
    try {
      const { data: project } = await this.supabase
        .from('projects')
        .select('name, client:contacts(name)')
        .eq('id', project_id)
        .single()

      const message = {
        text: `🚀 Novo projeto criado: *${project?.name}*`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🚀 *Novo projeto criado*\n\n*Projeto:* ${project?.name}\n*Cliente:* ${project?.client?.name || 'Não informado'}\n*Status:* Iniciado automaticamente`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Ver Projeto' },
                url: `${window.location.origin}/projects/${project_id}`
              }
            ]
          }
        ]
      }

      // TODO: Implementar webhook real do Slack
      console.log('Mensagem Slack:', message)
    } catch (error) {
      console.error('Erro na integração com Slack:', error)
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
      await this.supabase
        .from('project_activity_log')
        .insert({
          project_id,
          user_id,
          action_type,
          entity_type,
          entity_id,
          new_value: metadata,
          description: `Projeto criado automaticamente usando template ${metadata.template_used}`
        })
    } catch (error) {
      console.error('Erro ao registrar atividade:', error)
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