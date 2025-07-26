// ==================================================
// FVStudios Dashboard - Sistema de Validação de APIs Externas
// Validação automática e gestão de tokens para integrações
// ==================================================

import { TokenEncryption, TokenMasking } from './encryption'

// Interfaces para validação
export interface ValidationResult {
  isValid: boolean
  provider: string
  validatedAt: Date
  expiresAt?: Date
  error?: string
  accountInfo?: {
    id: string
    name: string
    email?: string
    permissions?: string[]
  }
  rateLimits?: {
    remaining: number
    total: number
    resetAt: Date
  }
}

export interface TokenValidationConfig {
  provider: string
  integration_id: string
  access_token: string
  refresh_token?: string
  account_id?: string
  base_url?: string
  api_version?: string
}

// ==================================================
// VALIDADORES ESPECÍFICOS POR PLATAFORMA
// ==================================================

export class MetaAdsValidator {
  static async validateToken(config: TokenValidationConfig): Promise<ValidationResult> {
    try {
      const baseUrl = config.base_url || 'https://graph.facebook.com'
      const version = config.api_version || 'v18.0'
      
      // Validar token principal
      const meResponse = await fetch(`${baseUrl}/${version}/me?access_token=${config.access_token}&fields=id,name,email`)
      
      if (!meResponse.ok) {
        const error = await meResponse.json()
        return {
          isValid: false,
          provider: 'meta',
          validatedAt: new Date(),
          error: error.error?.message || 'Token inválido'
        }
      }

      const userData = await meResponse.json()

      // Verificar permissões para ads
      const permissionsResponse = await fetch(`${baseUrl}/${version}/me/permissions?access_token=${config.access_token}`)
      const permissionsData = await permissionsResponse.json()
      
      const permissions = permissionsData.data?.map((p: any) => p.permission) || []
      const hasAdsPermissions = permissions.includes('ads_management') || permissions.includes('ads_read')

      if (!hasAdsPermissions) {
        return {
          isValid: false,
          provider: 'meta',
          validatedAt: new Date(),
          error: 'Token não possui permissões necessárias para gerenciar anúncios'
        }
      }

      // Verificar rate limits
      const rateLimitHeaders = {
        remaining: parseInt(meResponse.headers.get('x-business-use-case-usage') || '100'),
        total: 100,
        resetAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
      }

      return {
        isValid: true,
        provider: 'meta',
        validatedAt: new Date(),
        accountInfo: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          permissions: permissions
        },
        rateLimits: rateLimitHeaders
      }

    } catch (error) {
      console.error('Erro ao validar token Meta:', error)
      return {
        isValid: false,
        provider: 'meta',
        validatedAt: new Date(),
        error: 'Erro de conexão com a API do Meta'
      }
    }
  }

  static async refreshToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{
    access_token: string
    expires_in: number
    token_type: string
  } | null> {
    try {
      const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
        })
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao renovar token Meta:', error)
      return null
    }
  }
}

export class GoogleAdsValidator {
  static async validateToken(config: TokenValidationConfig): Promise<ValidationResult> {
    try {
      const baseUrl = config.base_url || 'https://googleads.googleapis.com'
      const version = config.api_version || 'v14'
      
      // Verificar informações da conta
      const headers = {
        'Authorization': `Bearer ${config.access_token}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
        'Content-Type': 'application/json'
      }

      // Primeiro, verificar se o token é válido fazendo uma requisição simples
      const customerResponse = await fetch(
        `${baseUrl}/${version}/customers:listAccessibleCustomers`,
        { headers }
      )

      if (!customerResponse.ok) {
        const error = await customerResponse.json()
        return {
          isValid: false,
          provider: 'google',
          validatedAt: new Date(),
          error: error.error?.message || 'Token inválido'
        }
      }

      const customerData = await customerResponse.json()
      const customers = customerData.resourceNames || []

      if (customers.length === 0) {
        return {
          isValid: false,
          provider: 'google',
          validatedAt: new Date(),
          error: 'Nenhuma conta do Google Ads acessível'
        }
      }

      // Obter informações do primeiro cliente
      const customerId = customers[0].replace('customers/', '')
      const accountResponse = await fetch(
        `${baseUrl}/${version}/customers/${customerId}?field_mask=id,descriptive_name,currency_code,time_zone`,
        { headers }
      )

      const accountData = await accountResponse.json()

      return {
        isValid: true,
        provider: 'google',
        validatedAt: new Date(),
        accountInfo: {
          id: customerId,
          name: accountData.descriptive_name || 'Google Ads Account',
          permissions: ['ads_read', 'ads_write']
        },
        rateLimits: {
          remaining: 10000, // Google Ads tem limites mais altos
          total: 10000,
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
        }
      }

    } catch (error) {
      console.error('Erro ao validar token Google:', error)
      return {
        isValid: false,
        provider: 'google',
        validatedAt: new Date(),
        error: 'Erro de conexão com a API do Google Ads'
      }
    }
  }

  static async refreshToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{
    access_token: string
    expires_in: number
    token_type: string
  } | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
        })
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao renovar token Google:', error)
      return null
    }
  }
}

export class TikTokAdsValidator {
  static async validateToken(config: TokenValidationConfig): Promise<ValidationResult> {
    try {
      const baseUrl = config.base_url || 'https://business-api.tiktok.com'
      const version = config.api_version || 'v1.3'
      
      // Verificar informações do usuário
      const response = await fetch(`${baseUrl}/${version}/user/info/`, {
        headers: {
          'Access-Token': config.access_token,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          isValid: false,
          provider: 'tiktok',
          validatedAt: new Date(),
          error: error.message || 'Token inválido'
        }
      }

      const userData = await response.json()
      
      if (userData.code !== 0) {
        return {
          isValid: false,
          provider: 'tiktok',
          validatedAt: new Date(),
          error: userData.message || 'Erro na validação do token'
        }
      }

      // Verificar contas de anúncios acessíveis
      const advertiserResponse = await fetch(`${baseUrl}/${version}/advertiser/get/`, {
        headers: {
          'Access-Token': config.access_token,
          'Content-Type': 'application/json'
        }
      })

      const advertiserData = await advertiserResponse.json()
      const advertisers = advertiserData.data?.list || []

      return {
        isValid: true,
        provider: 'tiktok',
        validatedAt: new Date(),
        accountInfo: {
          id: userData.data?.user_id || 'unknown',
          name: userData.data?.display_name || 'TikTok Business Account',
          email: userData.data?.email,
          permissions: ['ads_management']
        },
        rateLimits: {
          remaining: 1000,
          total: 1000,
          resetAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
        }
      }

    } catch (error) {
      console.error('Erro ao validar token TikTok:', error)
      return {
        isValid: false,
        provider: 'tiktok',
        validatedAt: new Date(),
        error: 'Erro de conexão com a API do TikTok'
      }
    }
  }

  static async refreshToken(refreshToken: string, clientKey: string, clientSecret: string): Promise<{
    access_token: string
    expires_in: number
    token_type: string
    refresh_token: string
  } | null> {
    try {
      const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_key: clientKey,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      
      if (data.code !== 0) {
        return null
      }

      return data.data
    } catch (error) {
      console.error('Erro ao renovar token TikTok:', error)
      return null
    }
  }
}

export class LinkedInAdsValidator {
  static async validateToken(config: TokenValidationConfig): Promise<ValidationResult> {
    try {
      const baseUrl = config.base_url || 'https://api.linkedin.com'
      const version = config.api_version || 'v2'
      
      // Verificar perfil do usuário
      const profileResponse = await fetch(`${baseUrl}/${version}/people/~:(id,firstName,lastName,emailAddress)`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      })

      if (!profileResponse.ok) {
        const error = await profileResponse.json()
        return {
          isValid: false,
          provider: 'linkedin',
          validatedAt: new Date(),
          error: error.message || 'Token inválido'
        }
      }

      const profileData = await profileResponse.json()

      // Verificar contas de anúncios
      const adAccountsResponse = await fetch(`${baseUrl}/${version}/adAccountsV2?q=search&search.type.values[0]=BUSINESS&search.status.values[0]=ACTIVE`, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      })

      const adAccountsData = await adAccountsResponse.json()

      return {
        isValid: true,
        provider: 'linkedin',
        validatedAt: new Date(),
        accountInfo: {
          id: profileData.id,
          name: `${profileData.firstName?.localized?.en_US || ''} ${profileData.lastName?.localized?.en_US || ''}`.trim(),
          email: profileData.emailAddress,
          permissions: ['ads_management', 'r_ads_reporting']
        },
        rateLimits: {
          remaining: 500,
          total: 500,
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
        }
      }

    } catch (error) {
      console.error('Erro ao validar token LinkedIn:', error)
      return {
        isValid: false,
        provider: 'linkedin',
        validatedAt: new Date(),
        error: 'Erro de conexão com a API do LinkedIn'
      }
    }
  }

  static async refreshToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{
    access_token: string
    expires_in: number
    token_type: string
  } | null> {
    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
        })
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao renovar token LinkedIn:', error)
      return null
    }
  }
}

// ==================================================
// GERENCIADOR PRINCIPAL DE VALIDAÇÃO
// ==================================================

export class TokenValidationManager {
  private static validators: { [key: string]: any } = {
    meta: MetaAdsValidator,
    google: GoogleAdsValidator,
    tiktok: TikTokAdsValidator,
    linkedin: LinkedInAdsValidator
  }

  // Validar token de qualquer provider
  static async validateToken(config: TokenValidationConfig): Promise<ValidationResult> {
    const validator = this.validators[config.provider]
    
    if (!validator) {
      return {
        isValid: false,
        provider: config.provider,
        validatedAt: new Date(),
        error: `Provider ${config.provider} não suportado`
      }
    }

    try {
      return await validator.validateToken(config)
    } catch (error) {
      console.error(`Erro ao validar token ${config.provider}:`, error)
      return {
        isValid: false,
        provider: config.provider,
        validatedAt: new Date(),
        error: 'Erro interno na validação'
      }
    }
  }

  // Renovar token de qualquer provider
  static async refreshToken(
    provider: string, 
    refreshToken: string, 
    clientId: string, 
    clientSecret: string
  ): Promise<any> {
    const validator = this.validators[provider]
    
    if (!validator || !validator.refreshToken) {
      return null
    }

    try {
      return await validator.refreshToken(refreshToken, clientId, clientSecret)
    } catch (error) {
      console.error(`Erro ao renovar token ${provider}:`, error)
      return null
    }
  }

  // Agendar validação automática
  static async scheduleValidation(integrationId: string, intervalHours: number = 24): Promise<void> {
    // Em produção, isso seria implementado com um job queue como Bull/Agenda
    console.log(`Agendando validação para integração ${integrationId} a cada ${intervalHours} horas`)
    
    // Simular agendamento
    setTimeout(async () => {
      try {
        // Aqui seria carregada a integração do banco e validada
        console.log(`Executando validação automática para ${integrationId}`)
        
        // Implementar lógica de validação periódica
        // await this.performScheduledValidation(integrationId)
      } catch (error) {
        console.error('Erro na validação agendada:', error)
      }
    }, intervalHours * 60 * 60 * 1000)
  }

  // Validar múltiplas integrações em lote
  static async validateMultiple(configs: TokenValidationConfig[]): Promise<ValidationResult[]> {
    const promises = configs.map(config => this.validateToken(config))
    return await Promise.all(promises)
  }

  // Verificar status de saúde geral das integrações
  static async healthCheck(integrations: TokenValidationConfig[]): Promise<{
    healthy: number
    unhealthy: number
    expired: number
    details: ValidationResult[]
  }> {
    const results = await this.validateMultiple(integrations)
    
    const healthy = results.filter(r => r.isValid).length
    const unhealthy = results.filter(r => !r.isValid && !r.error?.includes('expirado')).length
    const expired = results.filter(r => r.error?.includes('expirado')).length

    return {
      healthy,
      unhealthy,
      expired,
      details: results
    }
  }
}

// ==================================================
// UTILITÁRIOS PARA LOGS E MONITORAMENTO
// ==================================================

export class ValidationLogger {
  // Log de validação com detalhes
  static async logValidation(
    integrationId: string,
    result: ValidationResult,
    duration: number
  ): Promise<void> {
    const logEntry = {
      integration_id: integrationId,
      operation: 'validate_token',
      method: 'GET',
      endpoint: '/validate',
      response_status: result.isValid ? 200 : 401,
      duration_ms: duration,
      status: result.isValid ? 'success' : 'error',
      error_message: result.error || null,
      created_at: new Date().toISOString()
    }

    // Em produção, isso salvaria no banco de dados
    console.log('Validation log:', logEntry)
  }

  // Estatísticas de validação
  static async getValidationStats(integrationId: string, days: number = 7): Promise<{
    total_validations: number
    successful_validations: number
    failed_validations: number
    avg_response_time: number
    success_rate: number
  }> {
    // Em produção, isso consultaria o banco de dados
    return {
      total_validations: 48,
      successful_validations: 44,
      failed_validations: 4,
      avg_response_time: 1250,
      success_rate: 0.92
    }
  }
}

// Export das funcionalidades principais
export default {
  TokenValidationManager,
  MetaAdsValidator,
  GoogleAdsValidator,
  TikTokAdsValidator,
  LinkedInAdsValidator,
  ValidationLogger
}