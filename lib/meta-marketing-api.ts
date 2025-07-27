'use client'

// ==================================================
// FVStudios Dashboard - Meta Marketing API Integration
// Integração real com Facebook e Instagram Marketing API
// ==================================================

import { apiKeysManager } from './api-keys-manager'
import { supabaseBrowser } from './supabaseBrowser'
import { toast } from 'sonner'

// Types
export interface MetaAccount {
  id: string
  name: string
  account_id: string
  account_status: number
  currency: string
  timezone_name: string
  created_time: string
  business: {
    id: string
    name: string
  }
}

export interface MetaCampaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  objective: string
  buying_type: string
  created_time: string
  updated_time: string
  start_time?: string
  stop_time?: string
  budget_remaining?: string
  daily_budget?: string
  lifetime_budget?: string
  account_id: string
  adsets?: MetaAdSet[]
  insights?: MetaCampaignInsights
}

export interface MetaAdSet {
  id: string
  name: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  billing_event: string
  optimization_goal: string
  created_time: string
  updated_time: string
  daily_budget?: string
  lifetime_budget?: string
  targeting?: any
  insights?: MetaAdSetInsights
}

export interface MetaAd {
  id: string
  name: string
  adset_id: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  created_time: string
  updated_time: string
  creative?: {
    id: string
    title: string
    body: string
    image_url?: string
    video_id?: string
  }
  insights?: MetaAdInsights
}

export interface MetaCampaignInsights {
  impressions: string
  clicks: string
  spend: string
  reach: string
  frequency: string
  ctr: string
  cpc: string
  cpm: string
  cpp: string
  actions?: MetaAction[]
  cost_per_action_type?: MetaCostPerAction[]
  date_start: string
  date_stop: string
}

export interface MetaAdSetInsights extends MetaCampaignInsights {
  adset_id: string
}

export interface MetaAdInsights extends MetaCampaignInsights {
  ad_id: string
}

export interface MetaAction {
  action_type: string
  value: string
}

export interface MetaCostPerAction {
  action_type: string
  value: string
}

export interface MetaRecommendation {
  id: string
  title: string
  description: string
  recommendation_type: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  potential_reach_increase?: string
  potential_result_increase?: string
  estimated_impact?: string
}

// API Response Types
interface MetaAPIResponse<T> {
  data: T[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
    previous?: string
  }
}

interface MetaAPIError {
  error: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id: string
  }
}

// Meta Marketing API Client
export class MetaMarketingAPI {
  private baseURL = 'https://graph.facebook.com/v18.0'
  private accessToken: string | null = null
  private appId: string | null = null
  private adAccountId: string | null = null

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      const apiData = await apiKeysManager.getAPIKey('meta_ads')
      if (apiData) {
        this.accessToken = apiData.apiKey
        this.appId = apiData.additionalConfig.app_id
        this.adAccountId = apiData.additionalConfig.ad_account_id
      }
    } catch (error) {
      console.error('Erro ao inicializar Meta API:', error)
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    params?: Record<string, any>,
    body?: any
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Meta API não configurada. Configure suas credenciais em /intelligent/settings')
    }

    const url = new URL(`${this.baseURL}/${endpoint}`)
    
    // Adicionar access_token aos parâmetros
    const searchParams = new URLSearchParams({
      access_token: this.accessToken,
      ...params
    })
    
    url.search = searchParams.toString()

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url.toString(), config)
      const data = await response.json()
      
      if (!response.ok) {
        const error = data as MetaAPIError
        throw new Error(error.error.message || 'Erro na API do Meta')
      }

      // Log da execução
      await this.logAPIExecution(endpoint, method, params, data)
      
      return data
    } catch (error) {
      console.error('Erro na requisição Meta API:', error)
      throw error
    }
  }

  private async logAPIExecution(
    endpoint: string,
    method: string,
    params: any,
    response: any
  ) {
    try {
      const supabase = supabaseBrowser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .single()

      if (profile?.agency_id) {
        await supabase.from('ai_execution_logs').insert({
          agency_id: profile.agency_id,
          action_type: `meta_api_${method.toLowerCase()}_${endpoint}`,
          entity_type: 'meta_campaign',
          input_data: { endpoint, method, params },
          output_data: response,
          execution_time_ms: Date.now(),
          status: 'success'
        })
      }
    } catch (error) {
      console.error('Erro ao registrar log:', error)
    }
  }

  // Buscar contas de anúncios
  async getAdAccounts(): Promise<MetaAccount[]> {
    try {
      const response = await this.makeRequest<MetaAPIResponse<MetaAccount>>(
        'me/adaccounts',
        'GET',
        {
          fields: 'id,name,account_id,account_status,currency,timezone_name,created_time,business'
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Erro ao buscar contas:', error)
      toast.error('Erro ao carregar contas do Meta')
      return []
    }
  }

  // Buscar campanhas
  async getCampaigns(accountId?: string): Promise<MetaCampaign[]> {
    try {
      const adAccountId = accountId || this.adAccountId
      if (!adAccountId) {
        throw new Error('ID da conta de anúncios não configurado')
      }

      const response = await this.makeRequest<MetaAPIResponse<MetaCampaign>>(
        `act_${adAccountId}/campaigns`,
        'GET',
        {
          fields: 'id,name,status,objective,buying_type,created_time,updated_time,start_time,stop_time,budget_remaining,daily_budget,lifetime_budget',
          limit: 100
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error)
      toast.error('Erro ao carregar campanhas do Meta')
      return []
    }
  }

  // Buscar insights de campanha
  async getCampaignInsights(
    campaignId: string,
    dateRange: { start: string; end: string } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  ): Promise<MetaCampaignInsights | null> {
    try {
      const response = await this.makeRequest<MetaAPIResponse<MetaCampaignInsights>>(
        `${campaignId}/insights`,
        'GET',
        {
          fields: 'impressions,clicks,spend,reach,frequency,ctr,cpc,cpm,cpp,actions,cost_per_action_type',
          time_range: JSON.stringify({
            since: dateRange.start,
            until: dateRange.end
          }),
          level: 'campaign'
        }
      )
      
      return response.data[0] || null
    } catch (error) {
      console.error('Erro ao buscar insights da campanha:', error)
      return null
    }
  }

  // Buscar conjuntos de anúncios
  async getAdSets(campaignId: string): Promise<MetaAdSet[]> {
    try {
      const response = await this.makeRequest<MetaAPIResponse<MetaAdSet>>(
        `${campaignId}/adsets`,
        'GET',
        {
          fields: 'id,name,campaign_id,status,billing_event,optimization_goal,created_time,updated_time,daily_budget,lifetime_budget,targeting',
          limit: 100
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Erro ao buscar conjuntos de anúncios:', error)
      return []
    }
  }

  // Buscar anúncios
  async getAds(adsetId: string): Promise<MetaAd[]> {
    try {
      const response = await this.makeRequest<MetaAPIResponse<MetaAd>>(
        `${adsetId}/ads`,
        'GET',
        {
          fields: 'id,name,adset_id,campaign_id,status,created_time,updated_time,creative{id,title,body,image_url,video_id}',
          limit: 100
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error)
      return []
    }
  }

  // Obter recomendações da IA do Meta
  async getRecommendations(accountId?: string): Promise<MetaRecommendation[]> {
    try {
      const adAccountId = accountId || this.adAccountId
      if (!adAccountId) {
        throw new Error('ID da conta de anúncios não configurado')
      }

      const response = await this.makeRequest<MetaAPIResponse<MetaRecommendation>>(
        `act_${adAccountId}/recommendations`,
        'GET',
        {
          fields: 'id,title,description,recommendation_type,confidence,potential_reach_increase,potential_result_increase,estimated_impact'
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error)
      return []
    }
  }

  // Pausar/Ativar campanha
  async updateCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<boolean> {
    try {
      await this.makeRequest(
        campaignId,
        'POST',
        {},
        { status }
      )
      
      toast.success(`Campanha ${status === 'ACTIVE' ? 'ativada' : 'pausada'} com sucesso!`)
      return true
    } catch (error) {
      console.error('Erro ao atualizar status da campanha:', error)
      toast.error('Erro ao atualizar campanha')
      return false
    }
  }

  // Atualizar orçamento da campanha
  async updateCampaignBudget(
    campaignId: string, 
    budgetType: 'daily' | 'lifetime',
    amount: number
  ): Promise<boolean> {
    try {
      const budgetField = budgetType === 'daily' ? 'daily_budget' : 'lifetime_budget'
      
      await this.makeRequest(
        campaignId,
        'POST',
        {},
        { [budgetField]: (amount * 100).toString() } // Meta API usa centavos
      )
      
      toast.success('Orçamento da campanha atualizado com sucesso!')
      return true
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error)
      toast.error('Erro ao atualizar orçamento da campanha')
      return false
    }
  }

  // Obter insights consolidados da conta
  async getAccountInsights(
    accountId?: string,
    dateRange: { start: string; end: string } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  ): Promise<MetaCampaignInsights | null> {
    try {
      const adAccountId = accountId || this.adAccountId
      if (!adAccountId) {
        throw new Error('ID da conta de anúncios não configurado')
      }

      const response = await this.makeRequest<MetaAPIResponse<MetaCampaignInsights>>(
        `act_${adAccountId}/insights`,
        'GET',
        {
          fields: 'impressions,clicks,spend,reach,frequency,ctr,cpc,cpm,cpp,actions,cost_per_action_type',
          time_range: JSON.stringify({
            since: dateRange.start,
            until: dateRange.end
          }),
          level: 'account'
        }
      )
      
      return response.data[0] || null
    } catch (error) {
      console.error('Erro ao buscar insights da conta:', error)
      return null
    }
  }

  // Validar token de acesso
  async validateAccessToken(): Promise<boolean> {
    try {
      await this.makeRequest('me', 'GET', { fields: 'id,name' })
      return true
    } catch (error) {
      console.error('Token Meta inválido:', error)
      return false
    }
  }

  // Buscar dados completos para análise IA
  async getCompleteAnalysisData(accountId?: string): Promise<{
    account: MetaAccount | null
    campaigns: MetaCampaign[]
    insights: MetaCampaignInsights | null
    recommendations: MetaRecommendation[]
  }> {
    try {
      const adAccountId = accountId || this.adAccountId
      
      // Buscar dados em paralelo
      const [accounts, campaigns, insights, recommendations] = await Promise.all([
        this.getAdAccounts(),
        this.getCampaigns(adAccountId),
        this.getAccountInsights(adAccountId),
        this.getRecommendations(adAccountId)
      ])

      const account = accounts.find(acc => acc.account_id === adAccountId) || null

      // Buscar insights para cada campanha
      const campaignsWithInsights = await Promise.all(
        campaigns.map(async (campaign) => {
          const campaignInsights = await this.getCampaignInsights(campaign.id)
          return {
            ...campaign,
            insights: campaignInsights
          }
        })
      )

      return {
        account,
        campaigns: campaignsWithInsights,
        insights,
        recommendations
      }
    } catch (error) {
      console.error('Erro ao buscar dados completos:', error)
      return {
        account: null,
        campaigns: [],
        insights: null,
        recommendations: []
      }
    }
  }
}

// Instância global
export const metaAPI = new MetaMarketingAPI()