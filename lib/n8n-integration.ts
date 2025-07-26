// ==================================================
// FVStudios Dashboard - Integração n8n com Agentes de IA
// Sistema completo de automação e orquestração de workflows
// ==================================================

import { supabaseBrowser } from './supabaseBrowser'

// Interfaces para n8n
export interface N8nWorkflow {
  id: string
  name: string
  workflow_type: 'briefing' | 'analysis' | 'planning' | 'production' | 'approval' | 'campaign' | 'reporting'
  n8n_workflow_id: string
  is_active: boolean
  configuration: WorkflowConfig
  agency_id: string
}

export interface WorkflowConfig {
  triggers: string[]
  ai_agents: AIAgentConfig[]
  integrations: string[]
  output_format: string
  webhook_urls: string[]
}

export interface AIAgentConfig {
  name: string
  type: 'openai' | 'claude' | 'cohere'
  model: string
  system_prompt: string
  temperature: number
  max_tokens: number
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  project_id?: string
  execution_id: string
  status: 'running' | 'success' | 'error' | 'stopped'
  started_at: Date
  completed_at?: Date
  error_message?: string
  execution_data: any
  results?: any
}

// ==================================================
// GERENCIADOR PRINCIPAL N8N
// ==================================================

export class N8nIntegrationManager {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.N8N_URL || 'http://localhost:5678'
    this.apiKey = process.env.N8N_API_KEY || ''
  }

  // Executar workflow via webhook
  async executeWorkflow(workflowId: string, data: any): Promise<WorkflowExecution> {
    try {
      const workflow = await this.getWorkflow(workflowId)
      if (!workflow) throw new Error('Workflow não encontrado')

      const response = await fetch(`${this.baseUrl}/webhook/${workflow.n8n_workflow_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Erro ao executar workflow: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Salvar execução no banco
      const execution = await this.saveExecution({
        workflow_id: workflowId,
        execution_id: result.executionId || this.generateExecutionId(),
        status: 'running',
        started_at: new Date(),
        execution_data: data,
        project_id: data.project_id
      })

      return execution
    } catch (error) {
      console.error('Erro ao executar workflow n8n:', error)
      throw error
    }
  }

  // Obter status de execução
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const supabase = supabaseBrowser()
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('execution_id', executionId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao obter status:', error)
      return null
    }
  }

  // Obter workflow por ID
  private async getWorkflow(workflowId: string): Promise<N8nWorkflow | null> {
    try {
      const supabase = supabaseBrowser()
      const { data, error } = await supabase
        .from('n8n_workflows')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao obter workflow:', error)
      return null
    }
  }

  // Salvar execução no banco
  private async saveExecution(execution: Partial<WorkflowExecution>): Promise<WorkflowExecution> {
    const supabase = supabaseBrowser()
    const { data, error } = await supabase
      .from('workflow_executions')
      .insert(execution)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Gerar ID de execução único
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Atualizar status de execução
  async updateExecutionStatus(
    executionId: string, 
    status: WorkflowExecution['status'], 
    results?: any,
    error?: string
  ): Promise<void> {
    const supabase = supabaseBrowser()
    const updateData: any = {
      status,
      ...(results && { results }),
      ...(error && { error_message: error }),
      ...(status !== 'running' && { completed_at: new Date().toISOString() })
    }

    await supabase
      .from('workflow_executions')
      .update(updateData)
      .eq('execution_id', executionId)
  }
}

// ==================================================
// WORKFLOWS PRÉ-CONFIGURADOS
// ==================================================

export class PredefinedWorkflows {
  static readonly BRIEFING_WORKFLOW = {
    name: 'WhatsApp Briefing Collection',
    workflow_type: 'briefing' as const,
    configuration: {
      triggers: ['whatsapp_message'],
      ai_agents: [{
        name: 'briefing_agent',
        type: 'openai' as const,
        model: 'gpt-4-turbo',
        system_prompt: `Você é um especialista em briefing de marketing digital da FVStudios. 
        Sua missão é coletar informações essenciais dos clientes de forma natural e amigável.
        
        Informações a coletar:
        1. Objetivo da campanha (vendas, awareness, leads, etc.)
        2. Público-alvo (idade, interesses, localização)
        3. Orçamento disponível
        4. Prazo desejado
        5. Plataformas de interesse (Facebook, Instagram, Google, TikTok, etc.)
        6. Produtos/serviços a promover
        7. Diferencial competitivo
        
        Faça uma pergunta por vez, seja conversacional e use emojis quando apropriado.
        Quando tiver todas as informações, resuma o briefing e peça confirmação.`,
        temperature: 0.7,
        max_tokens: 500
      }],
      integrations: ['whatsapp', 'supabase'],
      output_format: 'json',
      webhook_urls: ['/api/webhooks/briefing-complete']
    }
  }

  static readonly ANALYSIS_WORKFLOW = {
    name: 'AI Campaign Analysis',
    workflow_type: 'analysis' as const,
    configuration: {
      triggers: ['briefing_complete'],
      ai_agents: [{
        name: 'analysis_agent',
        type: 'claude' as const,
        model: 'claude-3-opus',
        system_prompt: `Você é um estrategista de marketing digital sênior da FVStudios.
        Analise o briefing fornecido e crie uma estratégia completa.
        
        Sua análise deve incluir:
        1. Análise do público-alvo e personas
        2. Estratégia de plataformas recomendadas
        3. Alocação de orçamento sugerida
        4. Timeline otimizada
        5. KPIs e métricas de sucesso
        6. Análise de riscos e oportunidades
        7. Recomendações de criativos
        8. Estratégia de bidding
        
        Seja específico, use dados de mercado quando relevante e forneça justificativas para suas recomendações.`,
        temperature: 0.3,
        max_tokens: 1500
      }],
      integrations: ['supabase', 'market_data'],
      output_format: 'structured_json',
      webhook_urls: ['/api/webhooks/analysis-complete']
    }
  }

  static readonly PLANNING_WORKFLOW = {
    name: 'AI Project Planning',
    workflow_type: 'planning' as const,
    configuration: {
      triggers: ['analysis_complete'],
      ai_agents: [{
        name: 'planning_agent',
        type: 'openai' as const,
        model: 'gpt-4-turbo',
        system_prompt: `Você é um gerente de projetos especializado em marketing digital da FVStudios.
        Com base na análise estratégica, crie um plano de execução detalhado.
        
        Seu plano deve incluir:
        1. Fases do projeto com marcos principais
        2. Breakdown detalhado de tarefas
        3. Alocação de recursos e responsáveis
        4. Cronograma com dependências
        5. Entregáveis por fase
        6. Pontos de controle e aprovação
        7. Plano de contingência
        8. Estrutura de relatórios
        
        Crie tarefas específicas, mensuráveis e com prazos realistas.
        Considere a capacidade da equipe e possíveis gargalos.`,
        temperature: 0.2,
        max_tokens: 2000
      }],
      integrations: ['supabase', 'google_calendar', 'slack'],
      output_format: 'project_structure',
      webhook_urls: ['/api/webhooks/planning-complete']
    }
  }

  static readonly CONTENT_CREATION_WORKFLOW = {
    name: 'AI Content Creation',
    workflow_type: 'production' as const,
    configuration: {
      triggers: ['content_request'],
      ai_agents: [
        {
          name: 'copy_agent',
          type: 'openai' as const,
          model: 'gpt-4-turbo',
          system_prompt: `Você é um copywriter especialista da FVStudios.
          Crie textos persuasivos e engajadores para campanhas digitais.
          
          Diretrizes:
          - Use tom de voz da marca
          - Inclua CTAs claros
          - Adapte para cada plataforma
          - Considere limitações de caracteres
          - Aplique gatilhos mentais apropriados
          - Mantenha consistência da mensagem`,
          temperature: 0.8,
          max_tokens: 800
        },
        {
          name: 'visual_agent',
          type: 'openai' as const,
          model: 'dall-e-3',
          system_prompt: `Crie descrições detalhadas para geração de imagens publicitárias.
          Considere:
          - Identidade visual da marca
          - Público-alvo
          - Plataforma de veiculação
          - Padrões de alta performance
          - Compliance publicitário`,
          temperature: 0.6,
          max_tokens: 400
        }
      ],
      integrations: ['supabase', 'canva', 'openai_dalle', 'brand_assets'],
      output_format: 'creative_package',
      webhook_urls: ['/api/webhooks/content-ready']
    }
  }

  static readonly APPROVAL_WORKFLOW = {
    name: 'Streamlined Approval',
    workflow_type: 'approval' as const,
    configuration: {
      triggers: ['content_ready'],
      ai_agents: [{
        name: 'approval_agent',
        type: 'claude' as const,
        model: 'claude-3-sonnet',
        system_prompt: `Você é um assistente de aprovação da FVStudios.
        Prepare materiais para aprovação do cliente de forma clara e organizada.
        
        Sua função:
        1. Criar resumo executivo dos criativos
        2. Destacar pontos-chave da estratégia
        3. Explicar decisões criativas
        4. Antecipar possíveis dúvidas
        5. Preparar interface de aprovação intuitiva
        6. Sugerir alternativas se necessário
        
        Seja claro, objetivo e facilite a tomada de decisão do cliente.`,
        temperature: 0.4,
        max_tokens: 600
      }],
      integrations: ['supabase', 'whatsapp', 'email', 'approval_interface'],
      output_format: 'approval_package',
      webhook_urls: ['/api/webhooks/approval-sent']
    }
  }

  static readonly CAMPAIGN_LAUNCH_WORKFLOW = {
    name: 'Multi-Platform Campaign Launch',
    workflow_type: 'campaign' as const,
    configuration: {
      triggers: ['content_approved'],
      ai_agents: [{
        name: 'launch_agent',
        type: 'openai' as const,
        model: 'gpt-4-turbo',
        system_prompt: `Você é um especialista em lançamento de campanhas da FVStudios.
        Execute o lançamento coordenado em múltiplas plataformas.
        
        Responsabilidades:
        1. Verificar compliance de cada creatiro
        2. Configurar configurações otimizadas por plataforma
        3. Sincronizar lançamento simultâneo
        4. Implementar tracking e monitoramento
        5. Configurar alertas de performance
        6. Iniciar relatórios automáticos
        
        Garanta que tudo esteja perfeito antes do go-live.`,
        temperature: 0.1,
        max_tokens: 800
      }],
      integrations: ['meta_ads', 'google_ads', 'tiktok_ads', 'linkedin_ads', 'analytics'],
      output_format: 'campaign_status',
      webhook_urls: ['/api/webhooks/campaign-live']
    }
  }

  static readonly REPORTING_WORKFLOW = {
    name: 'AI Performance Reporting',
    workflow_type: 'reporting' as const,
    configuration: {
      triggers: ['scheduled_report', 'campaign_complete'],
      ai_agents: [{
        name: 'reporting_agent',
        type: 'claude' as const,
        model: 'claude-3-opus',
        system_prompt: `Você é um analista de performance sênior da FVStudios.
        Crie relatórios inteligentes e insights acionáveis.
        
        Seu relatório deve incluir:
        1. Executive Summary com principais insights
        2. Performance por plataforma e formato
        3. Análise de público e comportamento
        4. ROI e eficiência de orçamento
        5. Benchmarks de mercado
        6. Recomendações de otimização
        7. Próximos passos sugeridos
        8. Previsões baseadas em tendências
        
        Use dados concretos, visualizações claras e linguagem acessível.
        Foque em insights que gerem ação.`,
        temperature: 0.3,
        max_tokens: 2500
      }],
      integrations: ['analytics', 'all_ad_platforms', 'market_data', 'visualization'],
      output_format: 'comprehensive_report',
      webhook_urls: ['/api/webhooks/report-ready']
    }
  }
}

// ==================================================
// CANVA INTEGRATION
// ==================================================

export interface CanvaTemplate {
  id: string
  name: string
  category: string
  tags: string[]
  preview_url: string
  is_premium: boolean
}

export interface CanvaDesign {
  id: string
  name: string
  template_id?: string
  preview_url: string
  edit_url: string
  download_url?: string
  status: 'draft' | 'published'
  brand_id?: string
}

export interface BrandGuidelines {
  colors: string[]
  fonts: string[]
  logo_url: string
  tone_of_voice: string
  visual_style: string
}

export class CanvaAPIManager {
  private baseUrl = 'https://api.canva.com/rest/v1'
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // Obter templates por categoria
  async getTemplates(category?: string, tags?: string[]): Promise<CanvaTemplate[]> {
    const params = new URLSearchParams({
      ...(category && { category }),
      ...(tags && { tags: tags.join(',') })
    })
    
    const response = await fetch(`${this.baseUrl}/templates?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Erro ao buscar templates')
    return response.json()
  }

  // Criar design a partir de template
  async createDesignFromTemplate(
    templateId: string, 
    customizations: any
  ): Promise<CanvaDesign> {
    const response = await fetch(`${this.baseUrl}/designs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: templateId,
        ...customizations
      })
    })
    
    if (!response.ok) throw new Error('Erro ao criar design')
    return response.json()
  }

  // Gerar design com IA
  async generateWithAI(
    prompt: string, 
    brandGuidelines: BrandGuidelines,
    category: string = 'social-media'
  ): Promise<CanvaDesign> {
    try {
      // 1. Usar IA para analisar o prompt e sugerir elementos
      const aiAnalysis = await this.analyzePromptWithAI(prompt, brandGuidelines)
      
      // 2. Buscar template mais adequado
      const templates = await this.getTemplates(category, aiAnalysis.suggested_tags)
      const bestTemplate = this.selectBestTemplate(templates, aiAnalysis)
      
      // 3. Gerar customizações baseadas na IA
      const customizations = {
        text_replacements: aiAnalysis.text_suggestions,
        color_palette: brandGuidelines.colors,
        font_selections: brandGuidelines.fonts,
        layout_modifications: aiAnalysis.layout_suggestions
      }
      
      // 4. Criar design
      return await this.createDesignFromTemplate(bestTemplate.id, customizations)
    } catch (error) {
      console.error('Erro ao gerar design com IA:', error)
      throw error
    }
  }

  // Analisar prompt com IA
  private async analyzePromptWithAI(prompt: string, brand: BrandGuidelines): Promise<any> {
    const response = await fetch('/api/ai/analyze-design-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, brand })
    })
    
    return response.json()
  }

  // Selecionar melhor template
  private selectBestTemplate(templates: CanvaTemplate[], analysis: any): CanvaTemplate {
    // Lógica para selecionar o template mais adequado baseado na análise IA
    return templates.find(t => 
      analysis.suggested_tags.some((tag: string) => t.tags.includes(tag))
    ) || templates[0]
  }

  // Exportar design
  async exportDesign(designId: string, format: 'png' | 'jpg' | 'pdf' = 'png'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/designs/${designId}/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ format })
    })
    
    if (!response.ok) throw new Error('Erro ao exportar design')
    const result = await response.json()
    return result.download_url
  }
}

// ==================================================
// WHATSAPP BUSINESS API
// ==================================================

export class WhatsAppBusinessAPI {
  private baseUrl = 'https://graph.facebook.com/v18.0'
  private accessToken: string
  private phoneNumberId: string

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
  }

  // Enviar mensagem de texto
  async sendTextMessage(to: string, message: string): Promise<void> {
    await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message }
      })
    })
  }

  // Enviar mensagem com template
  async sendTemplateMessage(to: string, templateName: string, parameters: any[]): Promise<void> {
    await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components: [{
            type: 'body',
            parameters
          }]
        }
      })
    })
  }

  // Enviar mídia
  async sendMediaMessage(to: string, mediaUrl: string, type: 'image' | 'video' | 'document'): Promise<void> {
    await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type,
        [type]: { link: mediaUrl }
      })
    })
  }
}

// Export principal
export default {
  N8nIntegrationManager,
  PredefinedWorkflows,
  CanvaAPIManager,
  WhatsAppBusinessAPI
}