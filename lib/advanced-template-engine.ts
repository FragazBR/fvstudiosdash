import { createClient } from '@supabase/supabase-js'
import { EventEmitter } from 'events'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type TemplateType = 'email' | 'whatsapp' | 'slack' | 'sms' | 'push_notification' | 'social_media' | 'pdf_report' | 'web_page'
export type TemplateStatus = 'draft' | 'active' | 'archived' | 'testing'
export type ElementType = 'text' | 'heading' | 'image' | 'button' | 'divider' | 'spacer' | 'container' | 'columns' | 'list' | 'table' | 'chart' | 'social_buttons' | 'qr_code' | 'variable' | 'conditional' | 'loop'

export interface AdvancedTemplate {
  id: string
  name: string
  description?: string
  category?: string
  tags?: string[]
  template_type: TemplateType
  status: TemplateStatus
  version: number
  parent_template_id?: string
  structure: TemplateStructure
  compiled_content?: any
  preview_data?: any
  styles?: any
  scripts?: any
  responsive_config?: any
  variables: TemplateVariable[]
  data_sources?: TemplateDataSource[]
  email_settings?: any
  whatsapp_settings?: any
  slack_settings?: any
  social_media_settings?: any
  is_public: boolean
  is_system_template: boolean
  allowed_roles?: string[]
  usage_count: number
  last_used_at?: string
  success_rate: number
  ab_test_enabled: boolean
  ab_test_config?: any
  created_by?: string
  agency_id?: string
  created_at: string
  updated_at: string
}

export interface TemplateElement {
  id: string
  template_id: string
  parent_element_id?: string
  element_order: number
  element_path?: string
  element_type: ElementType
  element_name?: string
  content: any
  properties: any
  conditions?: any
  data_binding?: any
  variables_used?: string[]
  mobile_properties?: any
  tablet_properties?: any
  desktop_properties?: any
  validation_rules?: any
  is_required: boolean
  created_at: string
  updated_at: string
}

export interface TemplateVariable {
  id: string
  template_id: string
  variable_name: string
  variable_key: string
  description?: string
  data_type: string
  default_value?: any
  is_required: boolean
  validation_rules?: any
  possible_values?: any
  input_type?: string
  input_properties?: any
  category?: string
  group_name?: string
  display_order: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface TemplateDataSource {
  id: string
  template_id: string
  source_name: string
  source_key: string
  description?: string
  source_type: string
  connection_config: any
  query_config?: any
  parameters?: any
  cache_duration: number
  cache_key_template?: string
  data_transformation?: any
  output_schema?: any
  requires_authentication: boolean
  allowed_roles?: string[]
  is_active: boolean
  last_sync_at?: string
  last_sync_status?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface TemplateStructure {
  elements: TemplateElementStructure[]
  global_styles?: any
  responsive_breakpoints?: any
  metadata?: any
}

export interface TemplateElementStructure {
  type: ElementType
  id?: string
  properties?: any
  content?: any
  children?: TemplateElementStructure[]
  conditions?: any
  data_binding?: any
  responsive?: {
    mobile?: any
    tablet?: any
    desktop?: any
  }
}

export interface RenderContext {
  variables: Record<string, any>
  data_sources?: Record<string, any>
  user_context?: any
  device_type?: 'mobile' | 'tablet' | 'desktop'
  locale?: string
  timezone?: string
}

export interface RenderResult {
  success: boolean
  content?: string
  format?: string
  metadata?: any
  render_time_ms: number
  data_fetch_time_ms?: number
  error?: string
  error_details?: any
}

export class AdvancedTemplateEngine extends EventEmitter {
  private renderers = new Map<TemplateType, TemplateRenderer>()
  private dataSourceCache = new Map<string, { data: any; expires_at: number }>()
  private variableProcessors = new Map<string, VariableProcessor>()

  constructor() {
    super()
    this.initializeRenderers()
    this.initializeVariableProcessors()
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  /**
   * Criar novo template
   */
  async createTemplate(templateData: Partial<AdvancedTemplate>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('advanced_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          tags: templateData.tags,
          template_type: templateData.template_type,
          status: templateData.status || 'draft',
          structure: templateData.structure || { elements: [] },
          variables: templateData.variables || [],
          styles: templateData.styles || {},
          responsive_config: templateData.responsive_config || {},
          is_public: templateData.is_public || false,
          created_by: templateData.created_by,
          agency_id: templateData.agency_id
        })
        .select('id')
        .single()

      if (error) {
        console.error('Erro ao criar template:', error)
        return null
      }

      this.emit('templateCreated', { templateId: data.id, templateData })
      return data.id

    } catch (error) {
      console.error('Erro ao criar template:', error)
      return null
    }
  }

  /**
   * Buscar template por ID
   */
  async getTemplate(templateId: string): Promise<AdvancedTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('advanced_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) {
        console.error('Erro ao buscar template:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar template:', error)
      return null
    }
  }

  /**
   * Listar templates com filtros
   */
  async listTemplates(filters: {
    template_type?: TemplateType
    status?: TemplateStatus
    category?: string
    is_public?: boolean
    agency_id?: string
    created_by?: string
    tags?: string[]
    limit?: number
    offset?: number
  } = {}): Promise<AdvancedTemplate[]> {
    try {
      let query = supabase
        .from('advanced_templates')
        .select('*')
        .order('updated_at', { ascending: false })

      if (filters.template_type) {
        query = query.eq('template_type', filters.template_type)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public)
      }

      if (filters.agency_id) {
        query = query.eq('agency_id', filters.agency_id)
      }

      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao listar templates:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Erro ao listar templates:', error)
      return []
    }
  }

  /**
   * Atualizar template
   */
  async updateTemplate(templateId: string, updates: Partial<AdvancedTemplate>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('advanced_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)

      if (error) {
        console.error('Erro ao atualizar template:', error)
        return false
      }

      this.emit('templateUpdated', { templateId, updates })
      return true
    } catch (error) {
      console.error('Erro ao atualizar template:', error)
      return false
    }
  }

  /**
   * Deletar template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('advanced_templates')
        .delete()
        .eq('id', templateId)

      if (error) {
        console.error('Erro ao deletar template:', error)
        return false
      }

      this.emit('templateDeleted', { templateId })
      return true
    } catch (error) {
      console.error('Erro ao deletar template:', error)
      return false
    }
  }

  // ==================== RENDERING ENGINE ====================

  /**
   * Renderizar template
   */
  async renderTemplate(
    templateId: string,
    context: RenderContext,
    renderType: 'preview' | 'production' | 'test' = 'preview'
  ): Promise<RenderResult> {
    const startTime = Date.now()
    let dataFetchStart = 0
    let dataFetchEnd = 0

    try {
      // Buscar template
      const template = await this.getTemplate(templateId)
      if (!template) {
        return {
          success: false,
          error: 'Template não encontrado',
          render_time_ms: Date.now() - startTime
        }
      }

      if (template.status !== 'active' && renderType === 'production') {
        return {
          success: false,
          error: 'Template não está ativo',
          render_time_ms: Date.now() - startTime
        }
      }

      // Validar variáveis obrigatórias
      const validationResult = this.validateRequiredVariables(template, context.variables)
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Variáveis obrigatórias faltando: ${validationResult.missing.join(', ')}`,
          render_time_ms: Date.now() - startTime
        }
      }

      // Buscar dados das fontes de dados
      dataFetchStart = Date.now()
      const dataSources = await this.fetchDataSources(template, context)
      dataFetchEnd = Date.now()

      // Processar variáveis
      const processedVariables = await this.processVariables(template.variables, context.variables)

      // Obter renderer para o tipo de template
      const renderer = this.renderers.get(template.template_type)
      if (!renderer) {
        return {
          success: false,
          error: `Renderer não encontrado para tipo: ${template.template_type}`,
          render_time_ms: Date.now() - startTime
        }
      }

      // Renderizar conteúdo
      const renderResult = await renderer.render(template, {
        ...context,
        variables: processedVariables,
        data_sources: dataSources
      })

      const totalRenderTime = Date.now() - startTime

      // Registrar histórico de renderização
      await this.logRenderHistory(templateId, {
        render_context: context,
        render_type: renderType,
        rendered_content: renderResult.content,
        render_format: renderResult.format,
        render_time_ms: totalRenderTime,
        data_fetch_time_ms: dataFetchEnd - dataFetchStart,
        success: renderResult.success,
        error_message: renderResult.error,
        error_details: renderResult.error_details
      })

      return {
        ...renderResult,
        render_time_ms: totalRenderTime,
        data_fetch_time_ms: dataFetchEnd - dataFetchStart
      }

    } catch (error: any) {
      const totalRenderTime = Date.now() - startTime
      
      await this.logRenderHistory(templateId, {
        render_context: context,
        render_type: renderType,
        render_time_ms: totalRenderTime,
        success: false,
        error_message: error.message,
        error_details: { stack: error.stack }
      })

      return {
        success: false,
        error: error.message,
        error_details: { stack: error.stack },
        render_time_ms: totalRenderTime,
        data_fetch_time_ms: dataFetchEnd - dataFetchStart
      }
    }
  }

  /**
   * Preview de template com dados de exemplo
   */
  async previewTemplate(templateId: string, sampleData?: Record<string, any>): Promise<RenderResult> {
    const template = await this.getTemplate(templateId)
    if (!template) {
      return {
        success: false,
        error: 'Template não encontrado',
        render_time_ms: 0
      }
    }

    // Usar dados de preview do template ou dados fornecidos
    const previewData = sampleData || template.preview_data || {}
    
    // Gerar valores de exemplo para variáveis obrigatórias
    const exampleVariables = this.generateExampleVariables(template.variables, previewData)

    return this.renderTemplate(templateId, {
      variables: exampleVariables,
      device_type: 'desktop'
    }, 'preview')
  }

  // ==================== VARIABLE PROCESSING ====================

  /**
   * Validar variáveis obrigatórias
   */
  private validateRequiredVariables(
    template: AdvancedTemplate,
    variables: Record<string, any>
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = []

    for (const variable of template.variables) {
      if (variable.is_required && !(variable.variable_key in variables)) {
        missing.push(variable.variable_key)
      }
    }

    return {
      valid: missing.length === 0,
      missing
    }
  }

  /**
   * Processar variáveis com validação e transformação
   */
  private async processVariables(
    templateVariables: TemplateVariable[],
    inputVariables: Record<string, any>
  ): Promise<Record<string, any>> {
    const processed: Record<string, any> = {}

    for (const variable of templateVariables) {
      let value = inputVariables[variable.variable_key] ?? variable.default_value

      // Aplicar processador específico se existir
      const processor = this.variableProcessors.get(variable.data_type)
      if (processor) {
        value = await processor.process(value, variable)
      }

      // Validar valor
      if (variable.validation_rules) {
        const isValid = this.validateVariableValue(value, variable.validation_rules)
        if (!isValid && variable.is_required) {
          throw new Error(`Valor inválido para variável ${variable.variable_key}`)
        }
      }

      processed[variable.variable_key] = value
    }

    return processed
  }

  /**
   * Validar valor de variável
   */
  private validateVariableValue(value: any, rules: any): boolean {
    if (!rules) return true

    // Implementar validações (regex, min/max, etc.)
    if (rules.regex && typeof value === 'string') {
      const regex = new RegExp(rules.regex)
      if (!regex.test(value)) return false
    }

    if (rules.min !== undefined && value < rules.min) return false
    if (rules.max !== undefined && value > rules.max) return false
    if (rules.minLength !== undefined && value.length < rules.minLength) return false
    if (rules.maxLength !== undefined && value.length > rules.maxLength) return false

    return true
  }

  /**
   * Gerar variáveis de exemplo para preview
   */
  private generateExampleVariables(
    templateVariables: TemplateVariable[],
    providedData: Record<string, any>
  ): Record<string, any> {
    const examples: Record<string, any> = { ...providedData }

    for (const variable of templateVariables) {
      if (!(variable.variable_key in examples)) {
        examples[variable.variable_key] = this.generateExampleValue(variable)
      }
    }

    return examples
  }

  /**
   * Gerar valor de exemplo para uma variável
   */
  private generateExampleValue(variable: TemplateVariable): any {
    if (variable.default_value !== undefined) {
      return variable.default_value
    }

    switch (variable.data_type) {
      case 'string':
        return `Exemplo ${variable.variable_name}`
      case 'number':
        return 42
      case 'boolean':
        return true
      case 'date':
        return new Date().toISOString().split('T')[0]
      case 'array':
        return ['Item 1', 'Item 2', 'Item 3']
      case 'object':
        return { exemplo: 'valor' }
      default:
        return 'Valor de exemplo'
    }
  }

  // ==================== DATA SOURCES ====================

  /**
   * Buscar dados das fontes de dados
   */
  private async fetchDataSources(
    template: AdvancedTemplate,
    context: RenderContext
  ): Promise<Record<string, any>> {
    const dataSources: Record<string, any> = {}

    if (!template.data_sources) return dataSources

    for (const source of template.data_sources) {
      if (!source.is_active) continue

      try {
        const data = await this.fetchDataSource(source, context)
        dataSources[source.source_key] = data
      } catch (error) {
        console.error(`Erro ao buscar dados da fonte ${source.source_key}:`, error)
        dataSources[source.source_key] = null
      }
    }

    return dataSources
  }

  /**
   * Buscar dados de uma fonte específica
   */
  private async fetchDataSource(
    source: TemplateDataSource,
    context: RenderContext
  ): Promise<any> {
    // Verificar cache
    const cacheKey = this.generateCacheKey(source, context)
    const cached = this.dataSourceCache.get(cacheKey)
    
    if (cached && cached.expires_at > Date.now()) {
      return cached.data
    }

    let data: any = null

    switch (source.source_type) {
      case 'database':
        data = await this.fetchDatabaseData(source, context)
        break
      case 'api':
        data = await this.fetchApiData(source, context)
        break
      case 'static':
        data = source.query_config
        break
      case 'calculated':
        data = await this.calculateData(source, context)
        break
      default:
        throw new Error(`Tipo de fonte de dados não suportado: ${source.source_type}`)
    }

    // Aplicar transformações
    if (source.data_transformation) {
      data = this.transformData(data, source.data_transformation)
    }

    // Cachear resultado
    this.dataSourceCache.set(cacheKey, {
      data,
      expires_at: Date.now() + (source.cache_duration * 1000)
    })

    return data
  }

  // ==================== RENDERERS ====================

  /**
   * Inicializar renderers para diferentes tipos de template
   */
  private initializeRenderers(): void {
    this.renderers.set('email', new EmailRenderer())
    this.renderers.set('whatsapp', new WhatsAppRenderer())
    this.renderers.set('slack', new SlackRenderer())
    this.renderers.set('sms', new SMSRenderer())
    this.renderers.set('push_notification', new PushNotificationRenderer())
    this.renderers.set('social_media', new SocialMediaRenderer())
    this.renderers.set('pdf_report', new PDFReportRenderer())
    this.renderers.set('web_page', new WebPageRenderer())
  }

  /**
   * Inicializar processadores de variáveis
   */
  private initializeVariableProcessors(): void {
    this.variableProcessors.set('string', new StringProcessor())
    this.variableProcessors.set('number', new NumberProcessor())
    this.variableProcessors.set('date', new DateProcessor())
    this.variableProcessors.set('boolean', new BooleanProcessor())
    this.variableProcessors.set('array', new ArrayProcessor())
    this.variableProcessors.set('object', new ObjectProcessor())
  }

  // ==================== UTILITY METHODS ====================

  private generateCacheKey(source: TemplateDataSource, context: RenderContext): string {
    const keyTemplate = source.cache_key_template || `${source.source_key}_{{variables}}`
    return keyTemplate.replace('{{variables}}', JSON.stringify(context.variables))
  }

  private async fetchDatabaseData(source: TemplateDataSource, context: RenderContext): Promise<any> {
    // Implementar busca no banco de dados
    return {}
  }

  private async fetchApiData(source: TemplateDataSource, context: RenderContext): Promise<any> {
    // Implementar busca via API
    return {}
  }

  private async calculateData(source: TemplateDataSource, context: RenderContext): Promise<any> {
    // Implementar cálculos customizados
    return {}
  }

  private transformData(data: any, transformation: any): any {
    // Implementar transformações de dados
    return data
  }

  private async logRenderHistory(templateId: string, historyData: any): Promise<void> {
    try {
      await supabase
        .from('template_render_history')
        .insert({
          template_id: templateId,
          ...historyData
        })
    } catch (error) {
      console.error('Erro ao registrar histórico de renderização:', error)
    }
  }
}

// ==================== INTERFACES ====================

interface TemplateRenderer {
  render(template: AdvancedTemplate, context: RenderContext): Promise<RenderResult>
}

interface VariableProcessor {
  process(value: any, variable: TemplateVariable): Promise<any>
}

// ==================== RENDERER IMPLEMENTATIONS ====================

class EmailRenderer implements TemplateRenderer {
  async render(template: AdvancedTemplate, context: RenderContext): Promise<RenderResult> {
    // Implementar renderização de email HTML
    const html = this.renderHtml(template.structure, context)
    
    return {
      success: true,
      content: html,
      format: 'html',
      render_time_ms: 0
    }
  }

  private renderHtml(structure: TemplateStructure, context: RenderContext): string {
    // Implementar conversão da estrutura para HTML
    return '<html><body>Email renderizado</body></html>'
  }
}

class WhatsAppRenderer implements TemplateRenderer {
  async render(template: AdvancedTemplate, context: RenderContext): Promise<RenderResult> {
    // Implementar renderização de mensagem WhatsApp
    const text = this.renderText(template.structure, context)
    
    return {
      success: true,
      content: text,
      format: 'text',
      render_time_ms: 0
    }
  }

  private renderText(structure: TemplateStructure, context: RenderContext): string {
    // Implementar conversão da estrutura para texto WhatsApp
    return 'Mensagem WhatsApp renderizada'
  }
}

class SlackRenderer implements TemplateRenderer {
  async render(template: AdvancedTemplate, context: RenderContext): Promise<RenderResult> {
    // Implementar renderização de blocos Slack
    const blocks = this.renderBlocks(template.structure, context)
    
    return {
      success: true,
      content: JSON.stringify(blocks),
      format: 'json',
      render_time_ms: 0
    }
  }

  private renderBlocks(structure: TemplateStructure, context: RenderContext): any[] {
    // Implementar conversão da estrutura para Slack blocks
    return []
  }
}

// Implementações simplificadas dos outros renderers
class SMSRenderer implements TemplateRenderer {
  async render(template: AdvancedTemplate, context: RenderContext): Promise<RenderResult> {
    return { success: true, content: 'SMS renderizado', format: 'text', render_time_ms: 0 }
  }
}

class PushNotificationRenderer implements TemplateRenderer {
  async render(template: AdvancedTemplate, context: RenderContext): Promise<RenderResult> {
    return { success: true, content: '{"title":"Push","body":"Notification"}', format: 'json', render_time_ms: 0 }
  }
}

class SocialMediaRenderer implements TemplateRenderer {
  async render(template: AdvancedTemplate, context: RenderContext): Promise<RenderResult> {
    return { success: true, content: 'Post de rede social', format: 'text', render_time_ms: 0 }
  }
}

class PDFReportRenderer implements TemplateRenderer {
  async render(template: AdvancedTemplate, context: RenderContext): Promise<RenderResult> {
    return { success: true, content: 'PDF Base64', format: 'pdf', render_time_ms: 0 }
  }
}

class WebPageRenderer implements TemplateRenderer {
  async render(template: AdvancedTemplate, context: RenderContext): Promise<RenderResult> {
    return { success: true, content: '<html>Web page</html>', format: 'html', render_time_ms: 0 }
  }
}

// ==================== VARIABLE PROCESSORS ====================

class StringProcessor implements VariableProcessor {
  async process(value: any, variable: TemplateVariable): Promise<any> {
    return String(value || '')
  }
}

class NumberProcessor implements VariableProcessor {
  async process(value: any, variable: TemplateVariable): Promise<any> {
    return Number(value) || 0
  }
}

class DateProcessor implements VariableProcessor {
  async process(value: any, variable: TemplateVariable): Promise<any> {
    if (!value) return null
    return new Date(value).toISOString()
  }
}

class BooleanProcessor implements VariableProcessor {
  async process(value: any, variable: TemplateVariable): Promise<any> {
    return Boolean(value)
  }
}

class ArrayProcessor implements VariableProcessor {
  async process(value: any, variable: TemplateVariable): Promise<any> {
    return Array.isArray(value) ? value : []
  }
}

class ObjectProcessor implements VariableProcessor {
  async process(value: any, variable: TemplateVariable): Promise<any> {
    return typeof value === 'object' ? value : {}
  }
}

// Instância global do template engine
let globalTemplateEngine: AdvancedTemplateEngine | null = null

/**
 * Obter instância global do template engine
 */
export function getTemplateEngine(): AdvancedTemplateEngine {
  if (!globalTemplateEngine) {
    globalTemplateEngine = new AdvancedTemplateEngine()
  }
  return globalTemplateEngine
}

/**
 * Helper para renderizar template
 */
export async function renderTemplate(
  templateId: string,
  variables: Record<string, any>,
  renderType: 'preview' | 'production' | 'test' = 'preview'
): Promise<RenderResult> {
  const engine = getTemplateEngine()
  return await engine.renderTemplate(templateId, { variables }, renderType)
}

/**
 * Helper para preview de template
 */
export async function previewTemplate(
  templateId: string,
  sampleData?: Record<string, any>
): Promise<RenderResult> {
  const engine = getTemplateEngine()
  return await engine.previewTemplate(templateId, sampleData)
}

export { AdvancedTemplateEngine }