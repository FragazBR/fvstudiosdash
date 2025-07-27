'use client'

// ==================================================
// FVStudios Dashboard - Google Ads API Hook
// Hook personalizado para gerenciar integração com Google Ads API
// ==================================================

import { useState, useEffect } from 'react'
import { useUser } from './useUser'
import { apiKeysManager } from '@/lib/api-keys-manager'
import { 
  googleAdsAPI, 
  GoogleAdsCampaign, 
  GoogleAdsAdGroup, 
  GoogleAdsKeyword, 
  GoogleAdsRecommendation,
  GoogleAdsAccount 
} from '@/lib/google-ads-api'
import { toast } from 'sonner'

export interface GoogleAdsAPIStatus {
  isConfigured: boolean
  isValid: boolean
  lastChecked: Date | null
  account: GoogleAdsAccount | null
  error: string | null
}

export function useGoogleAdsAPI() {
  const { user } = useUser()
  const [status, setStatus] = useState<GoogleAdsAPIStatus>({
    isConfigured: false,
    isValid: false,
    lastChecked: null,
    account: null,
    error: null
  })
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaign[]>([])
  const [adGroups, setAdGroups] = useState<GoogleAdsAdGroup[]>([])
  const [keywords, setKeywords] = useState<GoogleAdsKeyword[]>([])
  const [recommendations, setRecommendations] = useState<GoogleAdsRecommendation[]>([])

  // Verificar se a API está configurada
  useEffect(() => {
    if (user) {
      checkAPIConfiguration()
    }
  }, [user])

  const checkAPIConfiguration = async () => {
    try {
      setLoading(true)
      
      const apiKeyData = await apiKeysManager.getAPIKey('google_ads')
      
      if (!apiKeyData) {
        setStatus({
          isConfigured: false,
          isValid: false,
          lastChecked: new Date(),
          account: null,
          error: 'Google Ads API não está configurada'
        })
        return
      }

      // Validar credenciais
      const isValid = await googleAdsAPI.validateCredentials()
      
      if (isValid) {
        // Buscar informações da conta (simulado - Google Ads API não tem endpoint direto)
        const mockAccount: GoogleAdsAccount = {
          resourceName: `customers/${apiKeyData.additionalConfig.customer_id}`,
          id: apiKeyData.additionalConfig.customer_id || '',
          name: 'Conta Google Ads',
          currency: 'BRL',
          timeZone: 'America/Sao_Paulo',
          descriptiveName: 'Conta Principal',
          canManageClients: false,
          testAccount: false
        }

        setStatus({
          isConfigured: true,
          isValid: true,
          lastChecked: new Date(),
          account: mockAccount,
          error: null
        })
      } else {
        setStatus({
          isConfigured: true,
          isValid: false,
          lastChecked: new Date(),
          account: null,
          error: 'Credenciais inválidas ou expiradas'
        })
      }

    } catch (error) {
      console.error('Erro ao verificar configuração Google Ads API:', error)
      setStatus({
        isConfigured: false,
        isValid: false,
        lastChecked: new Date(),
        account: null,
        error: 'Erro ao verificar configuração da API'
      })
    } finally {
      setLoading(false)
    }
  }

  // Buscar campanhas
  const fetchCampaigns = async () => {
    if (!status.isValid) {
      toast.error('Configure a Google Ads API primeiro')
      return []
    }

    try {
      setLoading(true)
      
      // Buscar campanhas via API route
      const response = await fetch('/api/google-ads/campaigns', {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar campanhas')
      }

      const data = await response.json()
      setCampaigns(data.campaigns || [])
      return data.campaigns || []
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error)
      toast.error('Erro ao buscar campanhas do Google Ads')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Buscar grupos de anúncios
  const fetchAdGroups = async (campaignId?: string) => {
    if (!status.isValid) {
      toast.error('Configure a Google Ads API primeiro')
      return []
    }

    try {
      const adGroupsList = await googleAdsAPI.getAdGroups(campaignId)
      setAdGroups(adGroupsList)
      return adGroupsList
    } catch (error) {
      console.error('Erro ao buscar grupos de anúncios:', error)
      toast.error('Erro ao buscar grupos de anúncios')
      return []
    }
  }

  // Buscar palavras-chave
  const fetchKeywords = async (adGroupId?: string) => {
    if (!status.isValid) {
      toast.error('Configure a Google Ads API primeiro')
      return []
    }

    try {
      // Buscar keywords via API route
      const url = new URL('/api/google-ads/keywords', window.location.origin)
      if (adGroupId) {
        url.searchParams.set('adGroupId', adGroupId)
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar palavras-chave')
      }

      const data = await response.json()
      setKeywords(data.keywords || [])
      return {
        keywords: data.keywords || [],
        analysis: data.analysis || {}
      }
    } catch (error) {
      console.error('Erro ao buscar palavras-chave:', error)
      toast.error('Erro ao buscar palavras-chave')
      return { keywords: [], analysis: {} }
    }
  }

  // Buscar recomendações
  const fetchRecommendations = async () => {
    if (!status.isValid) {
      toast.error('Configure a Google Ads API primeiro')
      return []
    }

    try {
      const recs = await googleAdsAPI.getRecommendations()
      setRecommendations(recs)
      return recs
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error)
      toast.error('Erro ao buscar recomendações do Google Ads')
      return []
    }
  }

  // Atualizar status da campanha
  const updateCampaignStatus = async (campaignResourceName: string, newStatus: 'ENABLED' | 'PAUSED') => {
    if (!status.isValid) {
      toast.error('Configure a Google Ads API primeiro')
      return false
    }

    try {
      const response = await fetch('/api/google-ads/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          action: 'update_status',
          campaignResourceName,
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status da campanha')
      }

      const data = await response.json()
      
      if (data.success) {
        // Atualizar campanha local
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.resourceName === campaignResourceName 
              ? { ...campaign, status: newStatus }
              : campaign
          )
        )

        toast.success(`Campanha ${newStatus === 'ENABLED' ? 'ativada' : 'pausada'} com sucesso!`)
      }

      return data.success
    } catch (error) {
      console.error('Erro ao atualizar status da campanha:', error)
      toast.error('Erro ao atualizar campanha')
      return false
    }
  }

  // Otimizar campanha com IA
  const optimizeCampaign = async (campaignResourceName: string, optimizations: string[]) => {
    if (!status.isValid) {
      toast.error('Configure a Google Ads API primeiro')
      return false
    }

    try {
      const response = await fetch('/api/google-ads/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          action: 'optimize',
          campaignResourceName,
          optimizations
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao otimizar campanha')
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success('Campanha otimizada com sucesso!')
        // Recarregar campanhas para obter dados atualizados
        await fetchCampaigns()
      }

      return data.success
    } catch (error) {
      console.error('Erro ao otimizar campanha:', error)
      toast.error('Erro ao otimizar campanha')
      return false
    }
  }

  // Obter dados completos para análise
  const getCompleteAnalysisData = async () => {
    if (!status.isValid) {
      toast.error('Configure a Google Ads API primeiro')
      return null
    }

    try {
      setLoading(true)
      const data = await googleAdsAPI.getCompleteAnalysisData()
      
      setCampaigns(data.campaigns)
      setAdGroups(data.adGroups)
      setKeywords(data.keywords)
      setRecommendations(data.recommendations)
      
      return data
    } catch (error) {
      console.error('Erro ao buscar dados completos:', error)
      toast.error('Erro ao buscar dados da análise')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Função para reconfigurar API
  const reconfigureAPI = () => {
    window.location.href = '/intelligent/settings'
  }

  return {
    // Status
    status,
    loading,
    
    // Dados
    campaigns,
    adGroups,
    keywords,
    recommendations,
    
    // Funções
    checkAPIConfiguration,
    fetchCampaigns,
    fetchAdGroups,
    fetchKeywords,
    fetchRecommendations,
    updateCampaignStatus,
    optimizeCampaign,
    getCompleteAnalysisData,
    reconfigureAPI,
    
    // Helpers
    isConfigured: status.isConfigured,
    isValid: status.isValid,
    hasError: !!status.error,
    error: status.error,
    account: status.account
  }
}