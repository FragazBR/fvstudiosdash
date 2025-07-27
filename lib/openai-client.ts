'use client'

// ==================================================
// FVStudios Dashboard - OpenAI Client with Credits System
// Cliente OpenAI integrado com sistema de créditos e billing
// ==================================================

import OpenAI from 'openai'
import { creditsManager } from './credits-manager'
import { apiKeysManager } from './api-keys-manager'
import { supabaseBrowser } from './supabaseBrowser'
import { toast } from 'sonner'

// Tipos específicos para nossos serviços
export interface AIRequest {
  userId: string
  agencyId: string
  serviceType: 'content_generation' | 'campaign_optimization' | 'briefing_automation' | 'insights_analysis' | 'keyword_research'
  prompt: string
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo'
  maxTokens?: number
  temperature?: number
  metadata?: any
}

export interface AIResponse {
  success: boolean
  content?: string
  tokensUsed: {
    input: number
    output: number
    total: number
  }
  cost: number
  creditsDebited: number
  model: string
  executionTime: number
  error?: string
}

// Templates de prompts para diferentes serviços
export const AI_PROMPTS = {
  content_generation: {
    social_media: `Como especialista em marketing digital, crie um post para redes sociais sobre: {topic}
    Requisitos:
    - Tom: {tone}
    - Plataforma: {platform}
    - Objetivo: {objective}
    - Inclua hashtags relevantes
    - Máximo 280 caracteres se Twitter, sem limite para outras plataformas
    
    Formato de resposta:
    TEXTO: [conteúdo do post]
    HASHTAGS: [hashtags separadas por espaço]
    SUGESTÕES: [3 variações do mesmo post]`,
    
    email_campaign: `Como copywriter especializado, crie um email marketing sobre: {topic}
    Dados do cliente:
    - Segmento: {segment}
    - Objetivo: {objective}
    - Tom: {tone}
    
    Inclua:
    - Subject line impactante
    - Corpo do email persuasivo
    - Call-to-action claro
    - Personalização`,
    
    blog_article: `Como redator SEO, escreva um artigo de blog sobre: {topic}
    Especificações:
    - Palavras-chave: {keywords}
    - Tamanho: {word_count} palavras
    - Tom: {tone}
    - Público-alvo: {audience}
    
    Estrutura:
    - Título SEO otimizado
    - Introdução engajante
    - 3-5 subtópicos bem desenvolvidos
    - Conclusão com CTA
    - Meta description`
  },
  
  campaign_optimization: {
    facebook_ads: `Como especialista em Facebook Ads, analise esta campanha e sugira otimizações:
    
    Dados da campanha:
    {campaign_data}
    
    Métricas atuais:
    - CTR: {ctr}%
    - CPC: R$ {cpc}
    - ROAS: {roas}x
    - Impressões: {impressions}
    - Conversões: {conversions}
    
    Forneça:
    1. Análise detalhada da performance
    2. 5 pontos de melhoria específicos
    3. Sugestões de copy para anúncios
    4. Recomendações de targeting
    5. Otimizações de orçamento`,
    
    google_ads: `Como especialista em Google Ads, otimize esta campanha:
    
    Dados:
    {campaign_data}
    
    Palavras-chave performance:
    {keywords_data}
    
    Forneça:
    1. Análise de Quality Score
    2. Palavras-chave para pausar/otimizar
    3. Novas palavras-chave sugeridas
    4. Otimizações de anúncios
    5. Estratégia de lances
    6. Extensões recomendadas`
  },
  
  insights_analysis: {
    general: `Como analista de dados de marketing, analise estas métricas e forneça insights acionáveis:
    
    Dados:
    {data}
    
    Período: {period}
    Objetivo: {objective}
    
    Forneça:
    1. 3 insights principais
    2. Tendências identificadas
    3. Oportunidades de melhoria
    4. Recomendações específicas
    5. Próximos passos
    
    Use dados concretos e seja específico nas recomendações.`
  }
}

export class OpenAIClient {
  private openai: OpenAI | null = null
  private supabase = supabaseBrowser()
  private isCompanyKey = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      // Tentar usar API key da empresa primeiro (para planos free/basic)
      const companyKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
      
      if (companyKey) {
        this.openai = new OpenAI({
          apiKey: companyKey,
          dangerouslyAllowBrowser: true
        })
        this.isCompanyKey = true
        return
      }

      // Se não tem key da empresa, tentar buscar do usuário
      const userApiKey = await apiKeysManager.getAPIKey('openai')
      if (userApiKey) {
        this.openai = new OpenAI({
          apiKey: userApiKey.apiKey,
          dangerouslyAllowBrowser: true
        })
        this.isCompanyKey = false
      }
    } catch (error) {
      console.error('Erro ao inicializar OpenAI:', error)
    }
  }

  // Método principal para processar requisições
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      // 1. Verificar se tem créditos suficientes
      const estimatedTokens = this.estimateTokens(request.prompt, request.maxTokens || 1000)
      const creditsCheck = await creditsManager.hasCredits(request.userId, estimatedTokens)
      
      if (!creditsCheck.hasCredits) {
        return {
          success: false,
          tokensUsed: { input: 0, output: 0, total: 0 },
          cost: 0,
          creditsDebited: 0,
          model: request.model || 'gpt-4',
          executionTime: Date.now() - startTime,
          error: creditsCheck.isBlocked ? 
            `Conta bloqueada: ${creditsCheck.blockReason}` : 
            `Créditos insuficientes. Você tem ${creditsCheck.currentCredits} créditos, mas precisa de ${estimatedTokens}.`
        }
      }

      // 2. Verificar se OpenAI está configurada
      if (!this.openai) {
        await this.initialize()
        if (!this.openai) {
          return {
            success: false,
            tokensUsed: { input: 0, output: 0, total: 0 },
            cost: 0,
            creditsDebited: 0,
            model: request.model || 'gpt-4',
            executionTime: Date.now() - startTime,
            error: 'OpenAI não configurada. Configure suas credenciais ou entre em contato com o suporte.'
          }
        }
      }

      // 3. Fazer a requisição para OpenAI
      const completion = await this.openai.chat.completions.create({
        model: request.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em marketing digital da FVStudios. Sempre forneça respostas detalhadas, práticas e acionáveis.'
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        stream: false
      })

      // 4. Processar resposta
      const content = completion.choices[0]?.message?.content || ''
      const tokensUsed = {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0
      }

      // 5. Calcular custo e debitar créditos
      const cost = this.calculateCost(request.model || 'gpt-4', tokensUsed.input, tokensUsed.output)
      const creditsToDebit = tokensUsed.total // 1 crédito = 1 token
      
      const debitSuccess = await creditsManager.debitCredits(
        request.userId,
        request.agencyId,
        creditsToDebit,
        request.serviceType,
        tokensUsed.total,
        {
          model: request.model,
          prompt_length: request.prompt.length,
          response_length: content.length,
          request_metadata: request.metadata
        }
      )

      if (!debitSuccess) {
        return {
          success: false,
          tokensUsed,
          cost,
          creditsDebited: 0,
          model: request.model || 'gpt-4',
          executionTime: Date.now() - startTime,
          error: 'Erro ao debitar créditos. Tente novamente.'
        }
      }

      // 6. Registrar log de uso
      await this.logUsage(request, tokensUsed, cost, content, true, Date.now() - startTime)

      return {
        success: true,
        content,
        tokensUsed,
        cost,
        creditsDebited: creditsToDebit,
        model: request.model || 'gpt-4',
        executionTime: Date.now() - startTime
      }

    } catch (error: any) {
      console.error('Erro na requisição OpenAI:', error)
      
      // Registrar erro no log
      await this.logUsage(request, { input: 0, output: 0, total: 0 }, 0, '', false, Date.now() - startTime, error.message)
      
      return {
        success: false,
        tokensUsed: { input: 0, output: 0, total: 0 },
        cost: 0,
        creditsDebited: 0,
        model: request.model || 'gpt-4',
        executionTime: Date.now() - startTime,
        error: error.message || 'Erro interno na requisição OpenAI'
      }
    }
  }

  // Métodos específicos para cada serviço
  async generateContent(
    userId: string,
    agencyId: string,
    contentType: 'social_media' | 'email_campaign' | 'blog_article',
    params: {
      topic: string
      tone?: string
      platform?: string
      objective?: string
      segment?: string
      keywords?: string
      word_count?: number
      audience?: string
    }
  ): Promise<AIResponse> {
    let prompt = AI_PROMPTS.content_generation[contentType]
    
    // Substituir placeholders
    Object.entries(params).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value || '')
    })

    return this.processRequest({
      userId,
      agencyId,
      serviceType: 'content_generation',
      prompt,
      model: 'gpt-4',
      maxTokens: contentType === 'blog_article' ? 2000 : 800,
      metadata: { contentType, params }
    })
  }

  async optimizeCampaign(
    userId: string,
    agencyId: string,
    platform: 'facebook_ads' | 'google_ads',
    campaignData: any,
    metricsData: any
  ): Promise<AIResponse> {
    let prompt = AI_PROMPTS.campaign_optimization[platform]
    
    // Substituir dados da campanha
    prompt = prompt.replace('{campaign_data}', JSON.stringify(campaignData, null, 2))
    
    if (platform === 'facebook_ads') {
      prompt = prompt
        .replace('{ctr}', metricsData.ctr || '0')
        .replace('{cpc}', metricsData.cpc || '0')
        .replace('{roas}', metricsData.roas || '0')
        .replace('{impressions}', metricsData.impressions || '0')
        .replace('{conversions}', metricsData.conversions || '0')
    } else if (platform === 'google_ads') {
      prompt = prompt.replace('{keywords_data}', JSON.stringify(metricsData.keywords || [], null, 2))
    }

    return this.processRequest({
      userId,
      agencyId,
      serviceType: 'campaign_optimization',
      prompt,
      model: 'gpt-4',
      maxTokens: 1500,
      metadata: { platform, campaignData, metricsData }
    })
  }

  async analyzeInsights(
    userId: string,
    agencyId: string,
    data: any,
    period: string,
    objective: string
  ): Promise<AIResponse> {
    let prompt = AI_PROMPTS.insights_analysis.general
    
    prompt = prompt
      .replace('{data}', JSON.stringify(data, null, 2))
      .replace('{period}', period)
      .replace('{objective}', objective)

    return this.processRequest({
      userId,
      agencyId,
      serviceType: 'insights_analysis',
      prompt,
      model: 'gpt-4-turbo', // Modelo mais rápido para análises
      maxTokens: 1200,
      metadata: { data, period, objective }
    })
  }

  // Métodos utilitários
  private estimateTokens(prompt: string, maxTokens: number): number {
    // Estimativa aproximada: 1 token ≈ 4 caracteres em português
    const promptTokens = Math.ceil(prompt.length / 4)
    return promptTokens + maxTokens
  }

  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    }

    const modelCosts = costs[model as keyof typeof costs] || costs['gpt-4']
    const inputCost = (inputTokens / 1000) * modelCosts.input
    const outputCost = (outputTokens / 1000) * modelCosts.output
    
    return inputCost + outputCost
  }

  private async logUsage(
    request: AIRequest,
    tokensUsed: { input: number; output: number; total: number },
    cost: number,
    responseContent: string,
    success: boolean,
    executionTime: number,
    errorMessage?: string
  ) {
    try {
      const { error } = await this.supabase
        .from('openai_usage_logs')
        .insert({
          user_id: request.userId,
          agency_id: request.agencyId,
          service_type: request.serviceType,
          model_used: request.model || 'gpt-4',
          tokens_input: tokensUsed.input,
          tokens_output: tokensUsed.output,
          total_tokens: tokensUsed.total,
          cost_usd: cost,
          tier_used: this.isCompanyKey ? 'company_paid' : 'user_api_key',
          request_data: {
            prompt: request.prompt,
            max_tokens: request.maxTokens,
            temperature: request.temperature,
            metadata: request.metadata
          },
          response_data: {
            content: responseContent,
            execution_time_ms: executionTime
          },
          success,
          error_message: errorMessage,
          execution_time_ms: executionTime,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Erro ao registrar log de uso:', error)
      }
    } catch (error) {
      console.error('Erro ao registrar log de uso:', error)
    }
  }

  // Validar se o serviço está disponível
  async validateService(): Promise<{ available: boolean; reason?: string }> {
    try {
      if (!this.openai) {
        await this.initialize()
      }

      if (!this.openai) {
        return {
          available: false,
          reason: 'OpenAI API não configurada'
        }
      }

      // Teste simples
      await this.openai.models.list()
      
      return { available: true }
    } catch (error: any) {
      return {
        available: false,
        reason: error.message || 'Erro na conexão com OpenAI'
      }
    }
  }

  // Buscar modelos disponíveis
  async getAvailableModels(): Promise<string[]> {
    try {
      if (!this.openai) {
        await this.initialize()
      }

      if (!this.openai) return []

      const models = await this.openai.models.list()
      return models.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort()
    } catch (error) {
      console.error('Erro ao buscar modelos:', error)
      return ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo']
    }
  }
}

// Instância global
export const openAIClient = new OpenAIClient()

// Hook React para usar o cliente
export function useOpenAI() {
  return {
    generateContent: openAIClient.generateContent.bind(openAIClient),
    optimizeCampaign: openAIClient.optimizeCampaign.bind(openAIClient),
    analyzeInsights: openAIClient.analyzeInsights.bind(openAIClient),
    validateService: openAIClient.validateService.bind(openAIClient),
    getAvailableModels: openAIClient.getAvailableModels.bind(openAIClient)
  }
}