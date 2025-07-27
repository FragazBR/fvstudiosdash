'use client'

// ==================================================
// FVStudios Dashboard - Meta API Hook
// Hook personalizado para gerenciar integração com Meta Marketing API
// ==================================================

import { useState, useEffect } from 'react'
import { useUser } from './useUser'
import { apiKeysManager } from '@/lib/api-keys-manager'
import { metaAPI, MetaCampaign, MetaAccount, MetaRecommendation } from '@/lib/meta-marketing-api'
import { toast } from 'sonner'

export interface MetaAPIStatus {
  isConfigured: boolean
  isValid: boolean
  lastChecked: Date | null
  account: MetaAccount | null
  error: string | null
}

export function useMetaAPI() {
  const { user } = useUser()
  const [status, setStatus] = useState<MetaAPIStatus>({
    isConfigured: false,
    isValid: false,
    lastChecked: null,
    account: null,
    error: null
  })
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([])
  const [recommendations, setRecommendations] = useState<MetaRecommendation[]>([])

  // Verificar se a API está configurada
  useEffect(() => {
    if (user) {
      checkAPIConfiguration()
    }
  }, [user])

  const checkAPIConfiguration = async () => {
    try {
      setLoading(true)
      
      const apiKeyData = await apiKeysManager.getAPIKey('meta_ads')
      
      if (!apiKeyData) {
        setStatus({
          isConfigured: false,
          isValid: false,
          lastChecked: new Date(),
          account: null,
          error: 'Meta Marketing API não está configurada'
        })
        return
      }

      // Validar token
      const isValid = await metaAPI.validateAccessToken()
      
      if (isValid) {
        // Buscar informações da conta
        const accounts = await metaAPI.getAdAccounts()
        const account = accounts[0] || null

        setStatus({
          isConfigured: true,
          isValid: true,
          lastChecked: new Date(),
          account,
          error: null
        })
      } else {
        setStatus({
          isConfigured: true,
          isValid: false,
          lastChecked: new Date(),
          account: null,
          error: 'Token de acesso inválido ou expirado'
        })
      }

    } catch (error) {
      console.error('Erro ao verificar configuração Meta API:', error)
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
  const fetchCampaigns = async (accountId?: string) => {
    if (!status.isValid) {
      toast.error('Configure a Meta Marketing API primeiro')
      return []
    }

    try {
      setLoading(true)
      const campaignsList = await metaAPI.getCampaigns(accountId)
      
      // Buscar insights para cada campanha
      const campaignsWithInsights = await Promise.all(
        campaignsList.map(async (campaign) => {
          const insights = await metaAPI.getCampaignInsights(campaign.id)
          return {
            ...campaign,
            insights
          }
        })
      )

      setCampaigns(campaignsWithInsights)
      return campaignsWithInsights
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error)
      toast.error('Erro ao buscar campanhas do Meta')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Buscar recomendações
  const fetchRecommendations = async (accountId?: string) => {
    if (!status.isValid) {
      toast.error('Configure a Meta Marketing API primeiro')
      return []
    }

    try {
      const recs = await metaAPI.getRecommendations(accountId)
      setRecommendations(recs)
      return recs
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error)
      toast.error('Erro ao buscar recomendações do Meta')
      return []
    }
  }

  // Atualizar status da campanha
  const updateCampaignStatus = async (campaignId: string, newStatus: 'ACTIVE' | 'PAUSED') => {
    if (!status.isValid) {
      toast.error('Configure a Meta Marketing API primeiro')
      return false
    }

    try {
      const success = await metaAPI.updateCampaignStatus(campaignId, newStatus)
      
      if (success) {
        // Atualizar campanha local
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, status: newStatus }
              : campaign
          )
        )

        toast.success(`Campanha ${newStatus === 'ACTIVE' ? 'ativada' : 'pausada'} com sucesso!`)
      }

      return success
    } catch (error) {
      console.error('Erro ao atualizar status da campanha:', error)
      toast.error('Erro ao atualizar campanha')
      return false
    }
  }

  // Atualizar orçamento da campanha
  const updateCampaignBudget = async (
    campaignId: string, 
    budgetType: 'daily' | 'lifetime',
    amount: number
  ) => {
    if (!status.isValid) {
      toast.error('Configure a Meta Marketing API primeiro')
      return false
    }

    try {
      const success = await metaAPI.updateCampaignBudget(campaignId, budgetType, amount)
      
      if (success) {
        // Atualizar campanha local
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.id === campaignId 
              ? { 
                  ...campaign, 
                  [budgetType === 'daily' ? 'daily_budget' : 'lifetime_budget']: (amount * 100).toString()
                }
              : campaign
          )
        )

        toast.success('Orçamento da campanha atualizado!')
      }

      return success
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error)
      toast.error('Erro ao atualizar orçamento')
      return false
    }
  }

  // Obter dados completos para análise
  const getCompleteAnalysisData = async (accountId?: string) => {
    if (!status.isValid) {
      toast.error('Configure a Meta Marketing API primeiro')
      return null
    }

    try {
      setLoading(true)
      const data = await metaAPI.getCompleteAnalysisData(accountId)
      
      setCampaigns(data.campaigns)
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
    recommendations,
    
    // Funções
    checkAPIConfiguration,
    fetchCampaigns,
    fetchRecommendations,
    updateCampaignStatus,
    updateCampaignBudget,
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