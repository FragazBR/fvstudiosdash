'use client'

// ==================================================
// FVStudios Dashboard - WhatsApp Template Engine
// Motor de processamento de templates personalizados
// ==================================================

import { supabaseBrowser } from './supabaseBrowser'

export interface TemplateVariable {
  name: string
  description: string
  example: string
  required: boolean
  type: 'string' | 'number' | 'date' | 'boolean' | 'array'
}

export interface ProcessedTemplate {
  title: string
  message: string
  variables_used: string[]
  missing_variables: string[]
}

export interface CustomTemplate {
  id: string
  agency_id: string
  template_name: string
  notification_type: string
  title_template: string
  message_template: string
  variables: Record<string, string>
  is_active: boolean
  is_default: boolean
  usage_count: number
  created_at: Date
  updated_at: Date
}

// Variáveis disponíveis para cada tipo de notificação
export const TEMPLATE_VARIABLES: Record<string, TemplateVariable[]> = {
  'project_started': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'project_name', description: 'Nome do projeto', example: 'Site Institucional', required: true, type: 'string' },
    { name: 'project_type', description: 'Tipo do projeto', example: 'Website', required: false, type: 'string' },
    { name: 'estimated_duration', description: 'Duração estimada em dias', example: '30', required: false, type: 'number' },
    { name: 'team_members', description: 'Lista de membros da equipe', example: '• João - Designer\n• Maria - Desenvolvedora', required: false, type: 'array' },
    { name: 'next_actions', description: 'Próximas ações necessárias', example: '• Enviar briefing\n• Agendar reunião', required: false, type: 'array' },
    { name: 'agency_name', description: 'Nome da agência', example: 'FVStudios', required: false, type: 'string' },
    { name: 'project_manager', description: 'Gerente do projeto', example: 'Ana Costa', required: false, type: 'string' },
    { name: 'start_date', description: 'Data de início', example: '15/12/2024', required: false, type: 'date' },
    { name: 'budget', description: 'Orçamento do projeto', example: 'R$ 5.000,00', required: false, type: 'string' }
  ],
  
  'stage_started': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'stage_name', description: 'Nome da etapa', example: '🎨 Design e Wireframes', required: true, type: 'string' },
    { name: 'current_stage', description: 'Número da etapa atual', example: '2', required: true, type: 'number' },
    { name: 'total_stages', description: 'Total de etapas', example: '5', required: true, type: 'number' },
    { name: 'progress_bar', description: 'Barra de progresso visual', example: '▓▓░░░░░░░░ 40%', required: false, type: 'string' },
    { name: 'stage_description', description: 'Descrição da etapa', example: 'Criação do design visual', required: false, type: 'string' },
    { name: 'deliverables', description: 'Entregas previstas', example: '• Wireframes\n• Layout das páginas', required: false, type: 'array' },
    { name: 'client_actions', description: 'Ações necessárias do cliente', example: '• Feedback sobre layouts\n• Aprovação do design', required: false, type: 'array' },
    { name: 'duration', description: 'Duração estimada da etapa', example: '7', required: false, type: 'number' },
    { name: 'project_name', description: 'Nome do projeto', example: 'Site Institucional', required: false, type: 'string' }
  ],
  
  'stage_completed': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'stage_name', description: 'Nome da etapa concluída', example: '🎨 Design e Wireframes', required: true, type: 'string' },
    { name: 'progress_bar', description: 'Barra de progresso atualizada', example: '▓▓▓▓░░░░░░ 60%', required: false, type: 'string' },
    { name: 'completed_percentage', description: 'Porcentagem concluída', example: '60', required: false, type: 'number' },
    { name: 'completed_deliverables', description: 'Entregas desta etapa', example: '• Layout final aprovado\n• Wireframes detalhados', required: false, type: 'array' },
    { name: 'next_stage_name', description: 'Nome da próxima etapa', example: '⚙️ Desenvolvimento', required: false, type: 'string' },
    { name: 'next_stage_date', description: 'Data de início da próxima etapa', example: '18/12/2024', required: false, type: 'date' },
    { name: 'next_stage_preparations', description: 'Preparativos para próxima etapa', example: '• Aprovar design final\n• Enviar textos do site', required: false, type: 'array' },
    { name: 'project_name', description: 'Nome do projeto', example: 'Site Institucional', required: false, type: 'string' }
  ],
  
  'task_completed': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'task_name', description: 'Nome da tarefa', example: 'Logo e Identidade Visual', required: true, type: 'string' },
    { name: 'deliverables', description: 'Entregas da tarefa', example: '• Logo em diversos formatos\n• Manual de marca', required: false, type: 'array' },
    { name: 'download_links', description: 'Links para download', example: '• https://drive.google.com/folder/logo-files', required: false, type: 'array' },
    { name: 'next_steps', description: 'Próximos passos', example: '• Aplicar logo nos materiais\n• Feedback até sexta-feira', required: false, type: 'array' },
    { name: 'completion_date', description: 'Data de conclusão', example: '15/12/2024', required: false, type: 'date' },
    { name: 'project_name', description: 'Nome do projeto', example: 'Identidade Visual ABC', required: false, type: 'string' }
  ],
  
  'payment_reminder': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'project_name', description: 'Nome do projeto', example: 'Site Institucional', required: true, type: 'string' },
    { name: 'amount', description: 'Valor a ser pago', example: '2.500,00', required: true, type: 'string' },
    { name: 'due_date', description: 'Data de vencimento', example: '20/12/2024', required: true, type: 'date' },
    { name: 'installment', description: 'Parcela atual', example: '2', required: false, type: 'number' },
    { name: 'total_installments', description: 'Total de parcelas', example: '3', required: false, type: 'number' },
    { name: 'pix_key', description: 'Chave PIX', example: 'agencia@fvstudios.com.br', required: false, type: 'string' },
    { name: 'boleto_link', description: 'Link para boleto', example: 'https://banco.com.br/boleto/123456', required: false, type: 'string' },
    { name: 'card_link', description: 'Link para pagamento por cartão', example: 'https://pay.fvstudios.com.br/card', required: false, type: 'string' },
    { name: 'days_overdue', description: 'Dias em atraso (se aplicável)', example: '3', required: false, type: 'number' }
  ],
  
  'feedback_request': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'feedback_subject', description: 'Assunto do feedback', example: 'Aprovação do Design Final', required: true, type: 'string' },
    { name: 'feedback_details', description: 'Detalhes do que precisa ser avaliado', example: 'O design do seu site está pronto e precisa da sua aprovação', required: false, type: 'string' },
    { name: 'evaluation_criteria', description: 'Critérios de avaliação', example: '• Cores e tipografia\n• Layout geral\n• Navegação', required: false, type: 'array' },
    { name: 'feedback_link', description: 'Link para dar feedback', example: 'https://app.fvstudios.com.br/projects/123/feedback', required: true, type: 'string' },
    { name: 'feedback_deadline', description: 'Prazo para resposta', example: '22/12/2024', required: false, type: 'date' },
    { name: 'project_name', description: 'Nome do projeto', example: 'Site Institucional', required: false, type: 'string' }
  ],
  
  'delivery_ready': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'deliverable_name', description: 'Nome da entrega', example: 'Site Institucional Finalizado', required: true, type: 'string' },
    { name: 'delivery_items', description: 'Itens incluídos na entrega', example: '• Site publicado\n• Código-fonte\n• Documentação', required: false, type: 'array' },
    { name: 'download_links', description: 'Links para download', example: '• https://drive.google.com/site-files\n• https://github.com/repo', required: false, type: 'array' },
    { name: 'next_steps', description: 'Próximos passos', example: '• Teste em diferentes dispositivos\n• Divulgação nas redes sociais', required: false, type: 'array' },
    { name: 'agency_name', description: 'Nome da agência', example: 'FVStudios', required: false, type: 'string' },
    { name: 'delivery_date', description: 'Data da entrega', example: '20/12/2024', required: false, type: 'date' }
  ],
  
  'project_completed': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'project_name', description: 'Nome do projeto', example: 'Site Institucional', required: true, type: 'string' },
    { name: 'project_duration', description: 'Duração do projeto em dias', example: '25', required: false, type: 'number' },
    { name: 'completed_stages', description: 'Etapas concluídas', example: '5', required: false, type: 'number' },
    { name: 'total_deliveries', description: 'Total de entregas realizadas', example: '12', required: false, type: 'number' },
    { name: 'final_deliverables', description: 'Entregas finais', example: '• Site publicado\n• Código-fonte\n• Documentação\n• Manual de uso', required: false, type: 'array' },
    { name: 'post_project_actions', description: 'Ações pós-projeto', example: '• Período de garantia de 30 dias\n• Suporte técnico disponível', required: false, type: 'array' },
    { name: 'review_link', description: 'Link para avaliação', example: 'https://app.fvstudios.com.br/projects/123/review', required: false, type: 'string' },
    { name: 'agency_name', description: 'Nome da agência', example: 'FVStudios', required: false, type: 'string' },
    { name: 'completion_date', description: 'Data de conclusão', example: '20/12/2024', required: false, type: 'date' }
  ],
  
  'deadline_approaching': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'project_name', description: 'Nome do projeto', example: 'Site Institucional', required: true, type: 'string' },
    { name: 'deadline_date', description: 'Data do prazo', example: '25/12/2024', required: true, type: 'date' },
    { name: 'days_remaining', description: 'Dias restantes', example: '3', required: true, type: 'number' },
    { name: 'progress_percentage', description: 'Porcentagem concluída', example: '75', required: false, type: 'number' },
    { name: 'progress_bar', description: 'Barra de progresso', example: '▓▓▓▓▓▓▓░░░ 75%', required: false, type: 'string' },
    { name: 'pending_actions', description: 'Ações pendentes', example: '• Aprovação final do cliente\n• Upload dos últimos arquivos', required: false, type: 'array' },
    { name: 'urgency_level', description: 'Nível de urgência', example: 'Alta', required: false, type: 'string' }
  ],
  
  'meeting_reminder': [
    { name: 'client_name', description: 'Nome do cliente', example: 'João Silva', required: true, type: 'string' },
    { name: 'meeting_title', description: 'Título da reunião', example: 'Alinhamento de Projeto', required: true, type: 'string' },
    { name: 'meeting_date', description: 'Data da reunião', example: '18/12/2024', required: true, type: 'date' },
    { name: 'meeting_time', description: 'Horário da reunião', example: '14:30', required: true, type: 'string' },
    { name: 'meeting_duration', description: 'Duração prevista', example: '1 hora', required: false, type: 'string' },
    { name: 'meeting_link', description: 'Link da reunião online', example: 'https://meet.google.com/abc-defg-hij', required: false, type: 'string' },
    { name: 'meeting_agenda', description: 'Agenda da reunião', example: '• Revisão do progresso\n• Próximos passos\n• Dúvidas', required: false, type: 'array' },
    { name: 'meeting_location', description: 'Local da reunião', example: 'Escritório FVStudios ou Online', required: false, type: 'string' }
  ]
}

export class WhatsAppTemplateEngine {
  private supabase = supabaseBrowser()

  // Buscar template personalizado da agência
  async getCustomTemplate(
    agencyId: string, 
    notificationType: string, 
    preferDefault: boolean = true
  ): Promise<CustomTemplate | null> {
    try {
      let query = this.supabase
        .from('notification_templates')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('notification_type', notificationType)
        .eq('is_active', true)

      if (preferDefault) {
        query = query.order('is_default', { ascending: false })
      }

      query = query.order('created_at', { ascending: false }).limit(1)

      const { data, error } = await query

      if (error) {
        console.error('Erro ao buscar template customizado:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Erro ao buscar template:', error)
      return null
    }
  }

  // Processar template com dados
  processTemplate(
    titleTemplate: string,
    messageTemplate: string,
    data: Record<string, any>
  ): ProcessedTemplate {
    const variablesUsed: string[] = []
    const missingVariables: string[] = []

    // Função para processar um template
    const processText = (template: string): string => {
      return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
        variablesUsed.push(variableName)
        
        if (data.hasOwnProperty(variableName)) {
          const value = data[variableName]
          
          // Se for array, juntar com quebras de linha
          if (Array.isArray(value)) {
            return value.join('\n• ')
          }
          
          // Se for data, formatar
          if (value instanceof Date) {
            return value.toLocaleDateString('pt-BR')
          }
          
          return String(value)
        } else {
          missingVariables.push(variableName)
          return match // Manter a variável se não encontrada
        }
      })
    }

    const processedTitle = processText(titleTemplate)
    const processedMessage = processText(messageTemplate)

    return {
      title: processedTitle,
      message: processedMessage,
      variables_used: [...new Set(variablesUsed)], // Remover duplicatas
      missing_variables: [...new Set(missingVariables)]
    }
  }

  // Validar template
  validateTemplate(
    titleTemplate: string,
    messageTemplate: string,
    notificationType: string
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Verificar se os campos obrigatórios estão preenchidos
    if (!titleTemplate.trim()) {
      errors.push('Título do template é obrigatório')
    }

    if (!messageTemplate.trim()) {
      errors.push('Mensagem do template é obrigatória')
    }

    // Verificar variáveis disponíveis para o tipo de notificação
    const availableVars = TEMPLATE_VARIABLES[notificationType] || []
    const requiredVars = availableVars.filter(v => v.required)

    // Extrair variáveis usadas no template
    const titleVars = [...titleTemplate.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1])
    const messageVars = [...messageTemplate.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1])
    const allUsedVars = [...new Set([...titleVars, ...messageVars])]

    // Verificar variáveis obrigatórias
    requiredVars.forEach(requiredVar => {
      if (!allUsedVars.includes(requiredVar.name)) {
        warnings.push(`Variável obrigatória '${requiredVar.name}' não está sendo usada`)
      }
    })

    // Verificar variáveis inexistentes
    const availableVarNames = availableVars.map(v => v.name)
    allUsedVars.forEach(usedVar => {
      if (!availableVarNames.includes(usedVar)) {
        errors.push(`Variável '${usedVar}' não está disponível para este tipo de notificação`)
      }
    })

    // Validações específicas
    if (titleTemplate.length > 200) {
      warnings.push('Título muito longo (máximo recomendado: 200 caracteres)')
    }

    if (messageTemplate.length > 4000) {
      warnings.push('Mensagem muito longa (máximo recomendado: 4000 caracteres)')
    }

    // Verificar sintaxe das variáveis
    const invalidSyntax = [...titleTemplate.matchAll(/\{[^}]*\}/g), ...messageTemplate.matchAll(/\{[^}]*\}/g)]
      .filter(match => !match[0].match(/^\{\{\w+\}\}$/))

    if (invalidSyntax.length > 0) {
      errors.push('Sintaxe de variável incorreta. Use {{nome_da_variavel}}')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Gerar preview do template
  generatePreview(
    titleTemplate: string,
    messageTemplate: string,
    notificationType: string
  ): ProcessedTemplate {
    const availableVars = TEMPLATE_VARIABLES[notificationType] || []
    const sampleData: Record<string, any> = {}

    // Preencher com dados de exemplo
    availableVars.forEach(variable => {
      sampleData[variable.name] = variable.example
    })

    return this.processTemplate(titleTemplate, messageTemplate, sampleData)
  }

  // Obter variáveis disponíveis para um tipo de notificação
  getAvailableVariables(notificationType: string): TemplateVariable[] {
    return TEMPLATE_VARIABLES[notificationType] || []
  }

  // Verificar se um template usa variáveis válidas
  getTemplateVariables(template: string): string[] {
    const matches = [...template.matchAll(/\{\{(\w+)\}\}/g)]
    return [...new Set(matches.map(match => match[1]))]
  }

  // Sugestões de melhoria para templates
  getTemplateSuggestions(
    titleTemplate: string,
    messageTemplate: string,
    notificationType: string
  ): string[] {
    const suggestions: string[] = []
    const availableVars = TEMPLATE_VARIABLES[notificationType] || []
    const usedVars = this.getTemplateVariables(titleTemplate + ' ' + messageTemplate)

    // Sugerir uso de variáveis importantes não utilizadas
    const importantVars = ['client_name', 'project_name', 'agency_name']
    const availableImportantVars = availableVars.filter(v => importantVars.includes(v.name))
    
    availableImportantVars.forEach(variable => {
      if (!usedVars.includes(variable.name)) {
        suggestions.push(`Considere usar a variável '${variable.name}' para personalização`)
      }
    })

    // Sugerir emojis se não houver
    if (!titleTemplate.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u)) {
      suggestions.push('Adicione emojis ao título para torná-lo mais atrativo')
    }

    // Sugerir formatação
    if (!messageTemplate.includes('*') && !messageTemplate.includes('_')) {
      suggestions.push('Use *texto* para negrito ou _texto_ para itálico no WhatsApp')
    }

    // Sugerir estrutura
    if (messageTemplate.length > 200 && !messageTemplate.includes('\n\n')) {
      suggestions.push('Divida o texto em parágrafos para melhor legibilidade')
    }

    return suggestions
  }

  // Estatísticas de uso de templates
  async getTemplateStats(agencyId: string, templateId?: string) {
    try {
      let query = this.supabase
        .from('client_notifications')
        .select('template_used, status, created_at')
        .eq('agency_id', agencyId)

      if (templateId) {
        // Buscar nome do template
        const { data: template } = await this.supabase
          .from('notification_templates')
          .select('template_name')
          .eq('id', templateId)
          .single()

        if (template) {
          query = query.eq('template_used', template.template_name)
        }
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        total_sent: data?.length || 0,
        delivered: data?.filter(n => n.status === 'delivered').length || 0,
        read: data?.filter(n => n.status === 'read').length || 0,
        failed: data?.filter(n => n.status === 'failed').length || 0,
        delivery_rate: 0,
        read_rate: 0
      }

      if (stats.total_sent > 0) {
        stats.delivery_rate = Math.round((stats.delivered / stats.total_sent) * 100)
        stats.read_rate = Math.round((stats.read / stats.total_sent) * 100)
      }

      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas do template:', error)
      return null
    }
  }
}

// Instância global
export const templateEngine = new WhatsAppTemplateEngine()

// Hook React para usar o template engine
export function useWhatsAppTemplates() {
  return {
    getCustomTemplate: templateEngine.getCustomTemplate.bind(templateEngine),
    processTemplate: templateEngine.processTemplate.bind(templateEngine),
    validateTemplate: templateEngine.validateTemplate.bind(templateEngine),
    generatePreview: templateEngine.generatePreview.bind(templateEngine),
    getAvailableVariables: templateEngine.getAvailableVariables.bind(templateEngine),
    getTemplateVariables: templateEngine.getTemplateVariables.bind(templateEngine),
    getTemplateSuggestions: templateEngine.getTemplateSuggestions.bind(templateEngine),
    getTemplateStats: templateEngine.getTemplateStats.bind(templateEngine)
  }
}