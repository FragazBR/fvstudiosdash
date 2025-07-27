'use client'

// ==================================================
// FVStudios Dashboard - Google Ads API Integration
// Integração real com Google Ads API para otimização de campanhas
// ==================================================

import { apiKeysManager } from './api-keys-manager'
import { supabaseBrowser } from './supabaseBrowser'
import { toast } from 'sonner'

// Types
export interface GoogleAdsAccount {
  resourceName: string
  id: string
  name: string
  currency: string
  timeZone: string
  descriptiveName: string
  canManageClients: boolean
  testAccount: boolean
}

export interface GoogleAdsCampaign {
  resourceName: string
  id: string
  name: string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  advertisingChannelType: string
  biddingStrategyType: string
  campaignBudget: string
  startDate: string
  endDate?: string
  servingStatus: string
  adServingOptimizationStatus: string
  metrics?: GoogleAdsMetrics
}

export interface GoogleAdsAdGroup {
  resourceName: string
  id: string
  name: string
  campaign: string
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  type: string
  cpcBidMicros?: string
  cpmBidMicros?: string
  metrics?: GoogleAdsMetrics
}

export interface GoogleAdsKeyword {
  resourceName: string
  adGroup: string
  criterion: {
    keywordMatchType: string
    keyword: string
  }
  status: 'ENABLED' | 'PAUSED' | 'REMOVED'
  finalUrls: string[]
  qualityScore?: number
  metrics?: GoogleAdsMetrics
}

export interface GoogleAdsMetrics {
  impressions: string
  clicks: string
  cost: string
  conversions: string
  conversionValue: string
  ctr: number
  averageCpc: string
  averageCpm: string
  costPerConversion: string
  conversionRate: number
  valuePerConversion: string
  searchImpressionShare?: number
  searchTopImpressionShare?: number
  searchAbsoluteTopImpressionShare?: number
}

export interface GoogleAdsRecommendation {
  resourceName: string
  type: string
  impact: {
    baseMetrics: GoogleAdsMetrics
    potentialMetrics: GoogleAdsMetrics
  }
  campaignBudgetRecommendation?: {
    currentBudgetAmountMicros: string
    recommendedBudgetAmountMicros: string
  }
  keywordRecommendation?: {
    keyword: string
    matchType: string
    recommendedCpcBidMicros: string
  }
  textAdRecommendation?: {
    ad: any
    creationDate: string
  }
}

export interface GoogleAdsInsights {
  performanceInsights: {
    campaign_id: string
    impressions_trend: 'up' | 'down' | 'stable'
    clicks_trend: 'up' | 'down' | 'stable'
    cost_trend: 'up' | 'down' | 'stable'
    quality_score_avg: number
    impression_share: number
    wasted_spend_estimate: number
    top_performing_keywords: string[]
    underperforming_keywords: string[]
    suggested_optimizations: string[]
  }
}

// Google Ads API Client
export class GoogleAdsAPI {
  private baseURL = 'https://googleads.googleapis.com/v16'
  private accessToken: string | null = null
  private customerId: string | null = null
  private developerToken: string | null = null

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      const apiData = await apiKeysManager.getAPIKey('google_ads')
      if (apiData) {
        this.accessToken = apiData.apiKey
        this.customerId = apiData.additionalConfig.customer_id?.replace(/-/g, '') // Remove hífens
        this.developerToken = apiData.additionalConfig.developer_token
      }
    } catch (error) {
      console.error('Erro ao inicializar Google Ads API:', error)
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    if (!this.accessToken || !this.customerId || !this.developerToken) {
      throw new Error('Google Ads API não configurada. Configure suas credenciais em /intelligent/settings')
    }

    const url = `${this.baseURL}/customers/${this.customerId}/${endpoint}`

    const config: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'developer-token': this.developerToken,
        'Content-Type': 'application/json'
      }
    }

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro na Google Ads API')
      }

      // Log da execução
      await this.logAPIExecution(endpoint, method, body, data)

      return data
    } catch (error) {
      console.error('Erro na requisição Google Ads API:', error)
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
          action_type: `google_ads_${method.toLowerCase()}_${endpoint}`,
          entity_type: 'google_campaign',
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

  // Buscar campanhas
  async getCampaigns(): Promise<GoogleAdsCampaign[]> {
    try {
      const query = `
        SELECT 
          campaign.resource_name,
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.bidding_strategy_type,
          campaign.campaign_budget,
          campaign.start_date,
          campaign.end_date,
          campaign.serving_status,
          campaign.ad_serving_optimization_status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value,
          metrics.ctr,
          metrics.average_cpc,
          metrics.average_cpm,
          metrics.cost_per_conversion,
          metrics.conversion_rate,
          metrics.value_per_conversion
        FROM campaign 
        WHERE campaign.status != 'REMOVED'
        AND segments.date DURING LAST_30_DAYS
      `

      const response = await this.makeRequest<any>('googleAds:searchStream', 'POST', {
        query
      })

      const campaigns: GoogleAdsCampaign[] = []
      
      if (response.results) {
        for (const result of response.results) {
          const campaign = result.campaign
          const metrics = result.metrics

          campaigns.push({
            resourceName: campaign.resourceName,
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            advertisingChannelType: campaign.advertisingChannelType,
            biddingStrategyType: campaign.biddingStrategyType,
            campaignBudget: campaign.campaignBudget,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            servingStatus: campaign.servingStatus,
            adServingOptimizationStatus: campaign.adServingOptimizationStatus,
            metrics: metrics ? {
              impressions: metrics.impressions || '0',
              clicks: metrics.clicks || '0',
              cost: metrics.costMicros || '0',
              conversions: metrics.conversions || '0',
              conversionValue: metrics.conversionsValue || '0',
              ctr: parseFloat(metrics.ctr || '0'),
              averageCpc: metrics.averageCpc || '0',
              averageCpm: metrics.averageCpm || '0',
              costPerConversion: metrics.costPerConversion || '0',
              conversionRate: parseFloat(metrics.conversionRate || '0'),
              valuePerConversion: metrics.valuePerConversion || '0'
            } : undefined
          })
        }
      }

      return campaigns
    } catch (error) {
      console.error('Erro ao buscar campanhas Google Ads:', error)
      toast.error('Erro ao buscar campanhas do Google Ads')
      return []
    }
  }

  // Buscar grupos de anúncios
  async getAdGroups(campaignId?: string): Promise<GoogleAdsAdGroup[]> {
    try {
      let whereClause = "WHERE ad_group.status != 'REMOVED'"
      if (campaignId) {
        whereClause += ` AND campaign.id = ${campaignId}`
      }

      const query = `
        SELECT 
          ad_group.resource_name,
          ad_group.id,
          ad_group.name,
          ad_group.campaign,
          ad_group.status,
          ad_group.type,
          ad_group.cpc_bid_micros,
          ad_group.cpm_bid_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc
        FROM ad_group 
        ${whereClause}
        AND segments.date DURING LAST_30_DAYS
      `

      const response = await this.makeRequest<any>('googleAds:searchStream', 'POST', {
        query
      })

      const adGroups: GoogleAdsAdGroup[] = []
      
      if (response.results) {
        for (const result of response.results) {
          const adGroup = result.adGroup
          const metrics = result.metrics

          adGroups.push({
            resourceName: adGroup.resourceName,
            id: adGroup.id,
            name: adGroup.name,
            campaign: adGroup.campaign,
            status: adGroup.status,
            type: adGroup.type,
            cpcBidMicros: adGroup.cpcBidMicros,
            cpmBidMicros: adGroup.cpmBidMicros,
            metrics: metrics ? {
              impressions: metrics.impressions || '0',
              clicks: metrics.clicks || '0',
              cost: metrics.costMicros || '0',
              conversions: metrics.conversions || '0',
              conversionValue: '0',
              ctr: parseFloat(metrics.ctr || '0'),
              averageCpc: metrics.averageCpc || '0',
              averageCpm: '0',
              costPerConversion: '0',
              conversionRate: 0,
              valuePerConversion: '0'
            } : undefined
          })
        }
      }

      return adGroups
    } catch (error) {
      console.error('Erro ao buscar grupos de anúncios:', error)
      return []
    }
  }

  // Buscar palavras-chave
  async getKeywords(adGroupId?: string): Promise<GoogleAdsKeyword[]> {
    try {
      let whereClause = "WHERE ad_group_criterion.status != 'REMOVED' AND ad_group_criterion.type = 'KEYWORD'"
      if (adGroupId) {
        whereClause += ` AND ad_group.id = ${adGroupId}`
      }

      const query = `
        SELECT 
          ad_group_criterion.resource_name,
          ad_group_criterion.ad_group,
          ad_group_criterion.criterion_id,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.keyword.text,
          ad_group_criterion.status,
          ad_group_criterion.final_urls,
          ad_group_criterion.quality_info.quality_score,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc
        FROM ad_group_criterion 
        ${whereClause}
        AND segments.date DURING LAST_30_DAYS
        LIMIT 1000
      `

      const response = await this.makeRequest<any>('googleAds:searchStream', 'POST', {
        query
      })

      const keywords: GoogleAdsKeyword[] = []
      
      if (response.results) {
        for (const result of response.results) {
          const criterion = result.adGroupCriterion
          const metrics = result.metrics

          keywords.push({
            resourceName: criterion.resourceName,
            adGroup: criterion.adGroup,
            criterion: {
              keywordMatchType: criterion.keyword?.matchType || 'EXACT',
              keyword: criterion.keyword?.text || ''
            },
            status: criterion.status,
            finalUrls: criterion.finalUrls || [],
            qualityScore: criterion.qualityInfo?.qualityScore,
            metrics: metrics ? {
              impressions: metrics.impressions || '0',
              clicks: metrics.clicks || '0',
              cost: metrics.costMicros || '0',
              conversions: metrics.conversions || '0',
              conversionValue: '0',
              ctr: parseFloat(metrics.ctr || '0'),
              averageCpc: metrics.averageCpc || '0',
              averageCpm: '0',
              costPerConversion: '0',
              conversionRate: 0,
              valuePerConversion: '0'
            } : undefined
          })
        }
      }

      return keywords
    } catch (error) {
      console.error('Erro ao buscar palavras-chave:', error)
      return []
    }
  }

  // Buscar recomendações
  async getRecommendations(): Promise<GoogleAdsRecommendation[]> {
    try {
      const query = `
        SELECT 
          recommendation.resource_name,
          recommendation.type,
          recommendation.impact.base_metrics.impressions,
          recommendation.impact.base_metrics.clicks,
          recommendation.impact.base_metrics.cost_micros,
          recommendation.impact.potential_metrics.impressions,
          recommendation.impact.potential_metrics.clicks,
          recommendation.impact.potential_metrics.cost_micros,
          recommendation.campaign_budget_recommendation.current_budget_amount_micros,
          recommendation.campaign_budget_recommendation.recommended_budget_amount_micros
        FROM recommendation 
        WHERE recommendation.dismissed != true
        LIMIT 50
      `

      const response = await this.makeRequest<any>('googleAds:searchStream', 'POST', {
        query
      })

      const recommendations: GoogleAdsRecommendation[] = []
      
      if (response.results) {
        for (const result of response.results) {
          const rec = result.recommendation
          
          recommendations.push({
            resourceName: rec.resourceName,
            type: rec.type,
            impact: {
              baseMetrics: {
                impressions: rec.impact?.baseMetrics?.impressions || '0',
                clicks: rec.impact?.baseMetrics?.clicks || '0',
                cost: rec.impact?.baseMetrics?.costMicros || '0',
                conversions: '0',
                conversionValue: '0',
                ctr: 0,
                averageCpc: '0',
                averageCpm: '0',
                costPerConversion: '0',
                conversionRate: 0,
                valuePerConversion: '0'
              },
              potentialMetrics: {
                impressions: rec.impact?.potentialMetrics?.impressions || '0',
                clicks: rec.impact?.potentialMetrics?.clicks || '0',
                cost: rec.impact?.potentialMetrics?.costMicros || '0',
                conversions: '0',
                conversionValue: '0',
                ctr: 0,
                averageCpc: '0',
                averageCpm: '0',
                costPerConversion: '0',
                conversionRate: 0,
                valuePerConversion: '0'
              }
            },
            campaignBudgetRecommendation: rec.campaignBudgetRecommendation ? {
              currentBudgetAmountMicros: rec.campaignBudgetRecommendation.currentBudgetAmountMicros,
              recommendedBudgetAmountMicros: rec.campaignBudgetRecommendation.recommendedBudgetAmountMicros
            } : undefined
          })
        }
      }

      return recommendations
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error)
      return []
    }
  }

  // Atualizar status da campanha
  async updateCampaignStatus(campaignResourceName: string, status: 'ENABLED' | 'PAUSED'): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('campaigns:mutate', 'POST', {
        operations: [{
          update: {
            resourceName: campaignResourceName,
            status: status
          },
          updateMask: {
            paths: ['status']
          }
        }]
      })

      if (response.results && response.results.length > 0) {
        toast.success(`Campanha ${status === 'ENABLED' ? 'ativada' : 'pausada'} com sucesso!`)
        return true
      }

      return false
    } catch (error) {
      console.error('Erro ao atualizar status da campanha:', error)
      toast.error('Erro ao atualizar campanha no Google Ads')
      return false
    }
  }

  // Validar credenciais
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('customers:listAccessibleCustomers', 'GET')
      return !!response.resourceNames && response.resourceNames.length > 0
    } catch (error) {
      console.error('Credenciais Google Ads inválidas:', error)
      return false
    }
  }

  // Obter dados completos para análise
  async getCompleteAnalysisData(): Promise<{
    campaigns: GoogleAdsCampaign[]
    adGroups: GoogleAdsAdGroup[]
    keywords: GoogleAdsKeyword[]
    recommendations: GoogleAdsRecommendation[]
  }> {
    try {
      const [campaigns, adGroups, keywords, recommendations] = await Promise.all([
        this.getCampaigns(),
        this.getAdGroups(),
        this.getKeywords(),
        this.getRecommendations()
      ])

      return {
        campaigns,
        adGroups,
        keywords,
        recommendations
      }
    } catch (error) {
      console.error('Erro ao buscar dados completos:', error)
      return {
        campaigns: [],
        adGroups: [],
        keywords: [],
        recommendations: []
      }
    }
  }

  // Gerar insights de IA
  async generateInsights(campaigns: GoogleAdsCampaign[]): Promise<GoogleAdsInsights[]> {
    const insights: GoogleAdsInsights[] = []

    for (const campaign of campaigns) {
      if (!campaign.metrics) continue

      const metrics = campaign.metrics
      const impressions = parseInt(metrics.impressions)
      const clicks = parseInt(metrics.clicks)
      const cost = parseInt(metrics.cost) / 1000000 // Converter micros para valor real
      const conversions = parseFloat(metrics.conversions)

      const insight: GoogleAdsInsights = {
        performanceInsights: {
          campaign_id: campaign.id,
          impressions_trend: impressions > 10000 ? 'up' : impressions < 1000 ? 'down' : 'stable',
          clicks_trend: clicks > 500 ? 'up' : clicks < 50 ? 'down' : 'stable',
          cost_trend: cost > 1000 ? 'up' : cost < 100 ? 'down' : 'stable',
          quality_score_avg: 7, // Seria calculado das keywords
          impression_share: 0.75, // Seria obtido da API
          wasted_spend_estimate: cost * 0.15, // Estimativa de 15% de desperdício
          top_performing_keywords: [], // Seria obtido das keywords
          underperforming_keywords: [],
          suggested_optimizations: this.generateOptimizationSuggestions(campaign)
        }
      }

      insights.push(insight)
    }

    return insights
  }

  private generateOptimizationSuggestions(campaign: GoogleAdsCampaign): string[] {
    const suggestions: string[] = []
    
    if (!campaign.metrics) return suggestions

    const ctr = campaign.metrics.ctr
    const cost = parseInt(campaign.metrics.cost) / 1000000
    const conversions = parseFloat(campaign.metrics.conversions)

    if (ctr < 2.0) {
      suggestions.push('CTR baixo: Otimizar anúncios e palavras-chave')
    }

    if (cost > 500 && conversions < 10) {
      suggestions.push('Alto custo com poucas conversões: Revisar targeting')
    }

    if (campaign.status === 'ENABLED' && parseInt(campaign.metrics.impressions) < 1000) {
      suggestions.push('Baixas impressões: Aumentar lances ou expandir palavras-chave')
    }

    return suggestions
  }
}

// Instância global
export const googleAdsAPI = new GoogleAdsAPI()