'use client'

// ==================================================
// FVStudios Dashboard - API Keys Manager
// Sistema seguro para gerenciar chaves de API das integrações
// ==================================================

import { createClient } from '@supabase/supabase-js'
import { supabaseBrowser } from './supabaseBrowser'
import { toast } from 'sonner'

// Tipos de serviços suportados
export type ServiceType = 
  | 'openai' 
  | 'claude' 
  | 'cohere'
  | 'meta_ads' 
  | 'google_ads' 
  | 'tiktok_ads'
  | 'linkedin_ads'
  | 'hubspot'
  | 'pipedrive'
  | 'whatsapp_business'
  | 'canva'
  | 'n8n'
  | 'zapier'

export interface APIKey {
  id: string
  agency_id: string
  service_name: ServiceType
  api_key_encrypted: string
  api_secret_encrypted?: string
  additional_config: Record<string, any>
  is_active: boolean
  expires_at?: Date
  created_at: Date
  updated_at: Date
}

export interface ServiceConfig {
  name: string
  display_name: string
  description: string
  icon: string
  requires_secret: boolean
  config_fields: {
    key: string
    label: string
    type: 'text' | 'password' | 'select' | 'number'
    required: boolean
    options?: string[]
    placeholder?: string
  }[]
  documentation_url: string
}

// Configurações dos serviços
export const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  openai: {
    name: 'openai',
    display_name: 'OpenAI GPT',
    description: 'API para geração de conteúdo com GPT-4 e ChatGPT',
    icon: '🤖',
    requires_secret: false,
    config_fields: [
      {
        key: 'organization_id',
        label: 'Organization ID (opcional)',
        type: 'text',
        required: false,
        placeholder: 'org-...'
      },
      {
        key: 'model',
        label: 'Modelo padrão',
        type: 'select',
        required: false,
        options: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
      }
    ],
    documentation_url: 'https://platform.openai.com/docs/quickstart'
  },
  claude: {
    name: 'claude',
    display_name: 'Anthropic Claude',
    description: 'API da Anthropic para Claude 3',
    icon: '🧠',
    requires_secret: false,
    config_fields: [
      {
        key: 'model',
        label: 'Modelo padrão',
        type: 'select',
        required: false,
        options: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
      }
    ],
    documentation_url: 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api'
  },
  meta_ads: {
    name: 'meta_ads',
    display_name: 'Meta Ads API',
    description: 'API para Facebook e Instagram Ads',
    icon: '📘',
    requires_secret: true,
    config_fields: [
      {
        key: 'app_id',
        label: 'App ID',
        type: 'text',
        required: true,
        placeholder: 'ID da aplicação Meta'
      },
      {
        key: 'ad_account_id',
        label: 'Ad Account ID',
        type: 'text',
        required: true,
        placeholder: 'act_...'
      }
    ],
    documentation_url: 'https://developers.facebook.com/docs/marketing-apis'
  },
  google_ads: {
    name: 'google_ads',
    display_name: 'Google Ads API',
    description: 'API para campanhas do Google Ads',
    icon: '🔍',
    requires_secret: true,
    config_fields: [
      {
        key: 'customer_id',
        label: 'Customer ID',
        type: 'text',
        required: true,
        placeholder: '123-456-7890'
      },
      {
        key: 'developer_token',
        label: 'Developer Token',
        type: 'password',
        required: true
      }
    ],
    documentation_url: 'https://developers.google.com/google-ads/api/docs/first-call/overview'
  },
  whatsapp_business: {
    name: 'whatsapp_business',
    display_name: 'WhatsApp Business',
    description: 'API do WhatsApp Business para automação',
    icon: '💬',
    requires_secret: false,
    config_fields: [
      {
        key: 'phone_number_id',
        label: 'Phone Number ID',
        type: 'text',
        required: true
      },
      {
        key: 'webhook_verify_token',
        label: 'Webhook Verify Token',
        type: 'password',
        required: true
      }
    ],
    documentation_url: 'https://developers.facebook.com/docs/whatsapp/cloud-api'
  },
  canva: {
    name: 'canva',
    display_name: 'Canva API',
    description: 'API para criação de designs automatizada',
    icon: '🎨',
    requires_secret: false,
    config_fields: [
      {
        key: 'team_id',
        label: 'Team ID (opcional)',
        type: 'text',
        required: false
      }
    ],
    documentation_url: 'https://www.canva.com/developers/docs/connect-api/'
  },
  hubspot: {
    name: 'hubspot',
    display_name: 'HubSpot CRM',
    description: 'Integração com HubSpot CRM',
    icon: '🟠',
    requires_secret: false,
    config_fields: [
      {
        key: 'portal_id',
        label: 'Portal ID',
        type: 'text',
        required: true
      }
    ],
    documentation_url: 'https://developers.hubspot.com/docs/api/overview'
  },
  n8n: {
    name: 'n8n',
    display_name: 'n8n Automation',
    description: 'Plataforma de automação de workflows',
    icon: '🔗',
    requires_secret: false,
    config_fields: [
      {
        key: 'base_url',
        label: 'Base URL',
        type: 'text',
        required: true,
        placeholder: 'https://your-n8n-instance.com'
      }
    ],
    documentation_url: 'https://docs.n8n.io/api/'
  },
  // Adicionar outros serviços conforme necessário
  cohere: {
    name: 'cohere',
    display_name: 'Cohere AI',
    description: 'API da Cohere para processamento de linguagem natural',
    icon: '💡',
    requires_secret: false,
    config_fields: [],
    documentation_url: 'https://docs.cohere.com/docs'
  },
  tiktok_ads: {
    name: 'tiktok_ads',
    display_name: 'TikTok Ads',
    description: 'API para campanhas do TikTok',
    icon: '🎵',
    requires_secret: true,
    config_fields: [
      {
        key: 'advertiser_id',
        label: 'Advertiser ID',
        type: 'text',
        required: true
      }
    ],
    documentation_url: 'https://ads.tiktok.com/marketing_api/docs'
  },
  linkedin_ads: {
    name: 'linkedin_ads',
    display_name: 'LinkedIn Ads',
    description: 'API para anúncios do LinkedIn',
    icon: '💼',
    requires_secret: true,
    config_fields: [
      {
        key: 'account_id',
        label: 'Account ID',
        type: 'text',
        required: true
      }
    ],
    documentation_url: 'https://docs.microsoft.com/en-us/linkedin/marketing/'
  },
  pipedrive: {
    name: 'pipedrive',
    display_name: 'Pipedrive CRM',
    description: 'Integração com Pipedrive CRM',
    icon: '📊',
    requires_secret: false,
    config_fields: [
      {
        key: 'company_domain',
        label: 'Company Domain',
        type: 'text',
        required: true,
        placeholder: 'your-company'
      }
    ],
    documentation_url: 'https://developers.pipedrive.com/docs/api/v1'
  },
  zapier: {
    name: 'zapier',
    display_name: 'Zapier',
    description: 'Integração com Zapier para automações',
    icon: '⚡',
    requires_secret: false,
    config_fields: [],
    documentation_url: 'https://zapier.com/developer'
  }
}

class APIKeysManager {
  private supabase = supabaseBrowser()

  // Criptografia simples (em produção usar crypto mais robusto)
  private encryptKey(key: string): string {
    // Em produção, usar AES-256-GCM com chave secreta do servidor
    return btoa(key) // Base64 por enquanto - SUBSTITUIR em produção
  }

  private decryptKey(encryptedKey: string): string {
    try {
      return atob(encryptedKey) // SUBSTITUIR em produção
    } catch {
      return ''
    }
  }

  async saveAPIKey(
    serviceType: ServiceType,
    apiKey: string,
    apiSecret?: string,
    additionalConfig: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('agency_id')
        .single()

      if (!profile?.agency_id) {
        toast.error('Erro: Usuário não está associado a uma agência')
        return false
      }

      const encryptedKey = this.encryptKey(apiKey)
      const encryptedSecret = apiSecret ? this.encryptKey(apiSecret) : null

      const { error } = await this.supabase
        .from('api_keys')
        .upsert({
          agency_id: profile.agency_id,
          service_name: serviceType,
          api_key_encrypted: encryptedKey,
          api_secret_encrypted: encryptedSecret,
          additional_config: additionalConfig,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'agency_id,service_name'
        })

      if (error) {
        console.error('Erro ao salvar API key:', error)
        toast.error('Erro ao salvar chave da API')
        return false
      }

      toast.success(`Chave da API ${SERVICE_CONFIGS[serviceType].display_name} salva com sucesso!`)
      return true

    } catch (error) {
      console.error('Erro ao salvar API key:', error)
      toast.error('Erro interno ao salvar chave da API')
      return false
    }
  }

  async getAPIKey(serviceType: ServiceType): Promise<{
    apiKey: string
    apiSecret?: string
    additionalConfig: Record<string, any>
  } | null> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('agency_id')
        .single()

      if (!profile?.agency_id) return null

      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .eq('service_name', serviceType)
        .eq('is_active', true)
        .single()

      if (error || !data) return null

      return {
        apiKey: this.decryptKey(data.api_key_encrypted),
        apiSecret: data.api_secret_encrypted ? this.decryptKey(data.api_secret_encrypted) : undefined,
        additionalConfig: data.additional_config || {}
      }

    } catch (error) {
      console.error('Erro ao buscar API key:', error)
      return null
    }
  }

  async getAllAPIKeys(): Promise<Array<{
    id: string
    service_name: ServiceType
    is_active: boolean
    created_at: Date
    updated_at: Date
    has_secret: boolean
    additional_config: Record<string, any>
  }>> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('agency_id')
        .single()

      if (!profile?.agency_id) return []

      const { data, error } = await this.supabase
        .from('api_keys')
        .select(`
          id,
          service_name,
          is_active,
          created_at,
          updated_at,
          api_secret_encrypted,
          additional_config
        `)
        .eq('agency_id', profile.agency_id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar API keys:', error)
        return []
      }

      return (data || []).map(item => ({
        id: item.id,
        service_name: item.service_name as ServiceType,
        is_active: item.is_active,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
        has_secret: !!item.api_secret_encrypted,
        additional_config: item.additional_config || {}
      }))

    } catch (error) {
      console.error('Erro ao buscar API keys:', error)
      return []
    }
  }

  async deleteAPIKey(serviceType: ServiceType): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('agency_id')
        .single()

      if (!profile?.agency_id) return false

      const { error } = await this.supabase
        .from('api_keys')
        .delete()
        .eq('agency_id', profile.agency_id)
        .eq('service_name', serviceType)

      if (error) {
        console.error('Erro ao deletar API key:', error)
        toast.error('Erro ao remover chave da API')
        return false
      }

      toast.success(`Chave da API ${SERVICE_CONFIGS[serviceType].display_name} removida com sucesso!`)
      return true

    } catch (error) {
      console.error('Erro ao deletar API key:', error)
      toast.error('Erro interno ao remover chave da API')
      return false
    }
  }

  async toggleAPIKey(serviceType: ServiceType, isActive: boolean): Promise<boolean> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('agency_id')
        .single()

      if (!profile?.agency_id) return false

      const { error } = await this.supabase
        .from('api_keys')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('agency_id', profile.agency_id)
        .eq('service_name', serviceType)

      if (error) {
        console.error('Erro ao atualizar status da API key:', error)
        toast.error('Erro ao atualizar status da chave')
        return false
      }

      toast.success(`API ${SERVICE_CONFIGS[serviceType].display_name} ${isActive ? 'ativada' : 'desativada'}!`)
      return true

    } catch (error) {
      console.error('Erro ao atualizar API key:', error)
      return false
    }
  }

  // Validar se uma API key está funcionando
  async validateAPIKey(serviceType: ServiceType): Promise<boolean> {
    const keyData = await this.getAPIKey(serviceType)
    if (!keyData) return false

    try {
      // Implementar validação específica para cada serviço
      switch (serviceType) {
        case 'openai':
          return await this.validateOpenAIKey(keyData.apiKey)
        case 'claude':
          return await this.validateClaudeKey(keyData.apiKey)
        // Adicionar validações para outros serviços
        default:
          return true // Por enquanto assume que está válida
      }
    } catch (error) {
      console.error(`Erro ao validar ${serviceType}:`, error)
      return false
    }
  }

  private async validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch {
      return false
    }
  }

  private async validateClaudeKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      return response.status !== 401 // Não é erro de autenticação
    } catch {
      return false
    }
  }
}

export const apiKeysManager = new APIKeysManager()