// ==================================================
// FVStudios Dashboard - Sistema de Criptografia Avançada
// Criptografia segura para tokens de API e dados sensíveis
// ==================================================

import crypto from 'crypto'

// Configurações de criptografia
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits

// Interface para dados criptografados
export interface EncryptedData {
  encryptedData: string
  iv: string
  tag: string
  algorithm: string
}

// Classe principal de criptografia
export class TokenEncryption {
  private static masterKey: Buffer | null = null

  // Inicializar ou obter a chave mestra
  private static getMasterKey(): Buffer {
    if (!TokenEncryption.masterKey) {
      const keyString = process.env.ENCRYPTION_MASTER_KEY
      
      if (!keyString) {
        throw new Error('ENCRYPTION_MASTER_KEY não configurada nas variáveis de ambiente')
      }

      // Verificar se a chave tem o tamanho correto
      if (keyString.length !== 64) { // 32 bytes = 64 caracteres hex
        throw new Error('ENCRYPTION_MASTER_KEY deve ter 64 caracteres (32 bytes em hex)')
      }

      TokenEncryption.masterKey = Buffer.from(keyString, 'hex')
    }

    return TokenEncryption.masterKey
  }

  // Gerar uma nova chave mestra (apenas para setup inicial)
  public static generateMasterKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex')
  }

  // Criptografar dados sensíveis
  public static encrypt(plaintext: string): EncryptedData {
    try {
      const masterKey = TokenEncryption.getMasterKey()
      const iv = crypto.randomBytes(IV_LENGTH)
      
      const cipher = crypto.createCipherGCM(ALGORITHM, masterKey, iv)
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = cipher.getAuthTag()

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: ALGORITHM
      }
    } catch (error) {
      console.error('Erro na criptografia:', error)
      throw new Error('Falha ao criptografar dados sensíveis')
    }
  }

  // Descriptografar dados sensíveis
  public static decrypt(encryptedData: EncryptedData): string {
    try {
      const masterKey = TokenEncryption.getMasterKey()
      
      const decipher = crypto.createDecipherGCM(
        encryptedData.algorithm, 
        masterKey, 
        Buffer.from(encryptedData.iv, 'hex')
      )
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
      
      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Erro na descriptografia:', error)
      throw new Error('Falha ao descriptografar dados sensíveis')
    }
  }

  // Criptografar especificamente tokens OAuth
  public static encryptOAuthToken(tokenData: {
    access_token: string
    refresh_token?: string
    expires_at?: number
    token_type?: string
    scope?: string
  }): string {
    const tokenString = JSON.stringify(tokenData)
    const encrypted = TokenEncryption.encrypt(tokenString)
    
    // Retornar como string base64 para facilitar armazenamento
    return Buffer.from(JSON.stringify(encrypted)).toString('base64')
  }

  // Descriptografar tokens OAuth
  public static decryptOAuthToken(encryptedToken: string): {
    access_token: string
    refresh_token?: string
    expires_at?: number
    token_type?: string
    scope?: string
  } {
    try {
      const encryptedData = JSON.parse(Buffer.from(encryptedToken, 'base64').toString('utf8'))
      const decryptedString = TokenEncryption.decrypt(encryptedData)
      return JSON.parse(decryptedString)
    } catch (error) {
      console.error('Erro ao descriptografar token OAuth:', error)
      throw new Error('Token OAuth inválido ou corrompido')
    }
  }

  // Validar se um token está expirado
  public static isTokenExpired(encryptedToken: string): boolean {
    try {
      const tokenData = TokenEncryption.decryptOAuthToken(encryptedToken)
      
      if (!tokenData.expires_at) {
        return false // Se não tem expiração, considera como válido
      }

      const now = Math.floor(Date.now() / 1000)
      const bufferTime = 300 // 5 minutos de buffer
      
      return tokenData.expires_at < (now + bufferTime)
    } catch (error) {
      return true // Se não conseguir descriptografar, considera expirado
    }
  }

  // Hash seguro para verificação de integridade
  public static createSecureHash(data: string, salt?: string): string {
    const saltBuffer = salt ? Buffer.from(salt, 'utf8') : crypto.randomBytes(32)
    const hash = crypto.pbkdf2Sync(data, saltBuffer, 100000, 64, 'sha512')
    
    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex')
    }.hash
  }

  // Verificar hash
  public static verifySecureHash(data: string, hash: string, salt: string): boolean {
    try {
      const newHash = crypto.pbkdf2Sync(data, Buffer.from(salt, 'hex'), 100000, 64, 'sha512')
      return newHash.toString('hex') === hash
    } catch (error) {
      return false
    }
  }
}

// Classe para gerenciar chaves específicas por provider
export class ProviderKeyManager {
  // Gerar chave derivada específica para cada provider
  private static deriveProviderKey(provider: string, agencyId: string): Buffer {
    const masterKey = TokenEncryption['getMasterKey']()
    const salt = `${provider}-${agencyId}-fvstudios`
    
    return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512')
  }

  // Criptografar com chave específica do provider
  public static encryptForProvider(
    plaintext: string, 
    provider: string, 
    agencyId: string
  ): EncryptedData {
    try {
      const providerKey = ProviderKeyManager.deriveProviderKey(provider, agencyId)
      const iv = crypto.randomBytes(IV_LENGTH)
      
      const cipher = crypto.createCipherGCM(ALGORITHM, providerKey, iv)
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = cipher.getAuthTag()

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: ALGORITHM
      }
    } catch (error) {
      console.error('Erro na criptografia específica do provider:', error)
      throw new Error('Falha ao criptografar dados do provider')
    }
  }

  // Descriptografar com chave específica do provider
  public static decryptForProvider(
    encryptedData: EncryptedData, 
    provider: string, 
    agencyId: string
  ): string {
    try {
      const providerKey = ProviderKeyManager.deriveProviderKey(provider, agencyId)
      
      const decipher = crypto.createDecipherGCM(
        encryptedData.algorithm, 
        providerKey, 
        Buffer.from(encryptedData.iv, 'hex')
      )
      
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
      
      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Erro na descriptografia específica do provider:', error)
      throw new Error('Falha ao descriptografar dados do provider')
    }
  }
}

// Utilitários para trabalhar com tokens mascarados (para UI)
export class TokenMasking {
  // Mascarar token para exibição segura na UI
  public static maskToken(token: string): string {
    if (!token || token.length < 8) {
      return '••••••••'
    }

    const start = token.substring(0, 4)
    const end = token.substring(token.length - 4)
    const middle = '••••••••'.repeat(Math.max(1, Math.floor((token.length - 8) / 8)))
    
    return `${start}${middle}${end}`
  }

  // Verificar se um token está mascarado
  public static isTokenMasked(token: string): boolean {
    return token.includes('••••')
  }

  // Obter informações do token sem revelar dados sensíveis
  public static getTokenInfo(encryptedToken: string): {
    isValid: boolean
    isExpired: boolean
    expiresIn?: number
    scope?: string
    tokenType?: string
  } {
    try {
      const tokenData = TokenEncryption.decryptOAuthToken(encryptedToken)
      const isExpired = TokenEncryption.isTokenExpired(encryptedToken)
      
      let expiresIn: number | undefined
      if (tokenData.expires_at) {
        const now = Math.floor(Date.now() / 1000)
        expiresIn = Math.max(0, tokenData.expires_at - now)
      }

      return {
        isValid: true,
        isExpired,
        expiresIn,
        scope: tokenData.scope,
        tokenType: tokenData.token_type
      }
    } catch (error) {
      return {
        isValid: false,
        isExpired: true
      }
    }
  }
}

// Validações de segurança
export class SecurityValidation {
  // Validar força da chave de API
  public static validateApiKeyStrength(apiKey: string): {
    isValid: boolean
    score: number
    issues: string[]
  } {
    const issues: string[] = []
    let score = 0

    // Verificar comprimento mínimo
    if (apiKey.length < 32) {
      issues.push('Chave muito curta (mínimo 32 caracteres)')
    } else if (apiKey.length >= 64) {
      score += 30
    } else {
      score += 20
    }

    // Verificar caracteres especiais
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(apiKey)) {
      score += 20
    } else {
      issues.push('Ausência de caracteres especiais')
    }

    // Verificar números
    if (/\d/.test(apiKey)) {
      score += 15
    } else {
      issues.push('Ausência de números')
    }

    // Verificar letras maiúsculas e minúsculas
    if (/[a-z]/.test(apiKey) && /[A-Z]/.test(apiKey)) {
      score += 15
    } else {
      issues.push('Ausência de letras maiúsculas e minúsculas')
    }

    // Verificar padrões comuns inseguros
    const insecurePatterns = [
      /^(test|demo|sample|example)/i,
      /^(123|abc|qwe)/i,
      /(password|secret|key)/i
    ]

    const hasInsecurePattern = insecurePatterns.some(pattern => pattern.test(apiKey))
    if (hasInsecurePattern) {
      issues.push('Contém padrões inseguros')
      score -= 20
    } else {
      score += 20
    }

    return {
      isValid: score >= 70 && issues.length === 0,
      score: Math.max(0, Math.min(100, score)),
      issues
    }
  }

  // Detectar tentativas de acesso suspeitas
  public static detectSuspiciousActivity(logs: any[]): {
    isSuspicious: boolean
    riskLevel: 'low' | 'medium' | 'high'
    alerts: string[]
  } {
    const alerts: string[] = []
    let riskScore = 0

    // Verificar muitas tentativas de acesso falharam
    const failedAttempts = logs.filter(log => log.status === 'error').length
    const totalAttempts = logs.length

    if (totalAttempts > 0) {
      const failureRate = failedAttempts / totalAttempts
      
      if (failureRate > 0.5) {
        alerts.push('Alta taxa de falhas nas requisições')
        riskScore += 30
      }
    }

    // Verificar frequência anormal de requisições
    const timeRange = 3600000 // 1 hora em ms
    const recentLogs = logs.filter(log => 
      new Date(log.created_at).getTime() > Date.now() - timeRange
    )

    if (recentLogs.length > 100) {
      alerts.push('Volume anormalmente alto de requisições')
      riskScore += 25
    }

    // Verificar padrões de erro específicos
    const authErrors = logs.filter(log => 
      log.status === 'error' && 
      (log.error_message?.includes('unauthorized') || log.error_message?.includes('forbidden'))
    ).length

    if (authErrors > 5) {
      alerts.push('Múltiplas tentativas de autenticação falharam')
      riskScore += 35
    }

    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (riskScore >= 60) riskLevel = 'high'
    else if (riskScore >= 30) riskLevel = 'medium'

    return {
      isSuspicious: riskScore > 30,
      riskLevel,
      alerts
    }
  }
}

// Export das principais funcionalidades
export default {
  TokenEncryption,
  ProviderKeyManager,
  TokenMasking,
  SecurityValidation
}