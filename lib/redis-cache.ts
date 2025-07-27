'use client'

// ==================================================
// FVStudios Dashboard - Redis Cache System
// Sistema de cache Redis para otimização de performance
// ==================================================

import { Redis } from '@upstash/redis'

// Configuração do Redis via Upstash (serverless Redis)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface CacheOptions {
  ttl?: number // Time to live em segundos
  compress?: boolean // Comprimir dados grandes
  tags?: string[] // Tags para invalidação em grupo
}

export interface CacheStats {
  hits: number
  misses: number
  hit_rate: number
  total_requests: number
  memory_usage: string
  keys_count: number
}

class RedisCacheManager {
  private defaultTTL = 3600 // 1 hora
  private compressionThreshold = 1024 // 1KB
  private keyPrefix = 'fvstudios:'
  private statsKey = 'cache:stats'

  // Gerar chave com prefixo
  private generateKey(key: string, userId?: string, agencyId?: string): string {
    let fullKey = `${this.keyPrefix}${key}`
    
    if (agencyId) {
      fullKey += `:agency:${agencyId}`
    }
    
    if (userId) {
      fullKey += `:user:${userId}`
    }
    
    return fullKey
  }

  // Comprimir dados se necessário
  private async compressData(data: any): Promise<{ data: any, compressed: boolean }> {
    const serialized = JSON.stringify(data)
    
    if (serialized.length > this.compressionThreshold) {
      try {
        // Usar compressão simples (Base64 + LZ string compression simulada)
        const compressed = Buffer.from(serialized).toString('base64')
        return { data: compressed, compressed: true }
      } catch {
        return { data: serialized, compressed: false }
      }
    }
    
    return { data: serialized, compressed: false }
  }

  // Descomprimir dados se necessário
  private async decompressData(data: any, compressed: boolean): Promise<any> {
    if (!compressed) {
      return typeof data === 'string' ? JSON.parse(data) : data
    }
    
    try {
      const decompressed = Buffer.from(data, 'base64').toString('utf-8')
      return JSON.parse(decompressed)
    } catch {
      return data
    }
  }

  // Armazenar no cache
  async set(
    key: string, 
    value: any, 
    options: CacheOptions = {},
    userId?: string,
    agencyId?: string
  ): Promise<boolean> {
    try {
      const fullKey = this.generateKey(key, userId, agencyId)
      const ttl = options.ttl || this.defaultTTL
      
      // Comprimir se necessário
      const { data, compressed } = await this.compressData(value)
      
      // Objeto final para cache
      const cacheObject = {
        data,
        compressed,
        timestamp: Date.now(),
        ttl,
        tags: options.tags || [],
        key: fullKey
      }

      // Armazenar no Redis
      await redis.setex(fullKey, ttl, JSON.stringify(cacheObject))
      
      // Adicionar tags para invalidação em grupo
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = `${this.keyPrefix}tag:${tag}`
          await redis.sadd(tagKey, fullKey)
          await redis.expire(tagKey, ttl + 300) // Tag expira 5min após o cache
        }
      }

      // Atualizar estatísticas
      await this.updateStats('set')
      
      return true
    } catch (error) {
      console.error('Erro ao armazenar no cache:', error)
      return false
    }
  }

  // Recuperar do cache
  async get<T = any>(
    key: string, 
    userId?: string, 
    agencyId?: string
  ): Promise<T | null> {
    try {
      const fullKey = this.generateKey(key, userId, agencyId)
      const cached = await redis.get(fullKey)
      
      if (!cached) {
        await this.updateStats('miss')
        return null
      }

      const cacheObject = JSON.parse(cached as string)
      
      // Verificar se não expirou
      const age = Date.now() - cacheObject.timestamp
      if (age > (cacheObject.ttl * 1000)) {
        await this.delete(key, userId, agencyId)
        await this.updateStats('miss')
        return null
      }

      // Descomprimir se necessário
      const data = await this.decompressData(cacheObject.data, cacheObject.compressed)
      
      await this.updateStats('hit')
      return data as T
    } catch (error) {
      console.error('Erro ao recuperar do cache:', error)
      await this.updateStats('miss')
      return null
    }
  }

  // Excluir do cache
  async delete(key: string, userId?: string, agencyId?: string): Promise<boolean> {
    try {
      const fullKey = this.generateKey(key, userId, agencyId)
      
      // Recuperar tags antes de deletar
      const cached = await redis.get(fullKey)
      if (cached) {
        const cacheObject = JSON.parse(cached as string)
        
        // Remover das tags
        if (cacheObject.tags && cacheObject.tags.length > 0) {
          for (const tag of cacheObject.tags) {
            const tagKey = `${this.keyPrefix}tag:${tag}`
            await redis.srem(tagKey, fullKey)
          }
        }
      }
      
      const result = await redis.del(fullKey)
      return result > 0
    } catch (error) {
      console.error('Erro ao deletar do cache:', error)
      return false
    }
  }

  // Invalidar por tags
  async invalidateByTags(tags: string[]): Promise<number> {
    let deletedCount = 0
    
    try {
      for (const tag of tags) {
        const tagKey = `${this.keyPrefix}tag:${tag}`
        const keys = await redis.smembers(tagKey)
        
        if (keys && keys.length > 0) {
          // Deletar todas as chaves da tag
          for (const key of keys) {
            await redis.del(key)
            deletedCount++
          }
          
          // Deletar a tag
          await redis.del(tagKey)
        }
      }
      
      console.log(`Cache invalidado: ${deletedCount} chaves removidas para tags:`, tags)
      return deletedCount
    } catch (error) {
      console.error('Erro ao invalidar cache por tags:', error)
      return 0
    }
  }

  // Invalidar cache de agência
  async invalidateAgency(agencyId: string): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}*:agency:${agencyId}*`
      
      // No Redis Cloud/Upstash, usar SCAN é mais eficiente que KEYS
      let cursor = 0
      let deletedCount = 0
      
      do {
        const result = await redis.scan(cursor, { match: pattern, count: 100 })
        cursor = result.cursor
        
        if (result.keys.length > 0) {
          await redis.del(...result.keys)
          deletedCount += result.keys.length
        }
      } while (cursor !== 0)
      
      console.log(`Cache da agência ${agencyId} invalidado: ${deletedCount} chaves removidas`)
      return deletedCount
    } catch (error) {
      console.error('Erro ao invalidar cache da agência:', error)
      return 0
    }
  }

  // Cache com função de fallback
  async getOrSet<T = any>(
    key: string,
    fallbackFn: () => Promise<T>,
    options: CacheOptions = {},
    userId?: string,
    agencyId?: string
  ): Promise<T> {
    // Tentar recuperar do cache primeiro
    const cached = await this.get<T>(key, userId, agencyId)
    
    if (cached !== null) {
      return cached
    }

    // Se não encontrou, executar função de fallback
    try {
      const data = await fallbackFn()
      
      // Armazenar no cache para próximas requisições
      await this.set(key, data, options, userId, agencyId)
      
      return data
    } catch (error) {
      console.error('Erro na função de fallback do cache:', error)
      throw error
    }
  }

  // Atualizar estatísticas
  private async updateStats(operation: 'hit' | 'miss' | 'set'): Promise<void> {
    try {
      const statsKey = `${this.keyPrefix}${this.statsKey}`
      
      // Usar transação Redis para operações atômicas
      const pipeline = redis.pipeline()
      
      switch (operation) {
        case 'hit':
          pipeline.hincrby(statsKey, 'hits', 1)
          pipeline.hincrby(statsKey, 'total_requests', 1)
          break
        case 'miss':
          pipeline.hincrby(statsKey, 'misses', 1)
          pipeline.hincrby(statsKey, 'total_requests', 1)
          break
        case 'set':
          pipeline.hincrby(statsKey, 'sets', 1)
          break
      }
      
      pipeline.expire(statsKey, 86400) // Estatísticas por 24h
      await pipeline.exec()
    } catch (error) {
      // Falha nas estatísticas não deve quebrar o cache
      console.warn('Erro ao atualizar estatísticas do cache:', error)
    }
  }

  // Obter estatísticas do cache
  async getStats(): Promise<CacheStats> {
    try {
      const statsKey = `${this.keyPrefix}${this.statsKey}`
      const stats = await redis.hgetall(statsKey)
      
      const hits = parseInt(stats.hits as string || '0')
      const misses = parseInt(stats.misses as string || '0')
      const total = hits + misses
      
      // Informações do servidor Redis
      const info = await redis.info()
      const memoryUsage = this.extractMemoryUsage(info)
      const keysCount = await this.getKeysCount()
      
      return {
        hits,
        misses,
        hit_rate: total > 0 ? Math.round((hits / total) * 100) : 0,
        total_requests: total,
        memory_usage: memoryUsage,
        keys_count: keysCount
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas do cache:', error)
      return {
        hits: 0,
        misses: 0,
        hit_rate: 0,
        total_requests: 0,
        memory_usage: '0MB',
        keys_count: 0
      }
    }
  }

  // Extrair uso de memória do comando INFO
  private extractMemoryUsage(info: string): string {
    try {
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      return memoryMatch ? memoryMatch[1].trim() : '0MB'
    } catch {
      return '0MB'
    }
  }

  // Contar chaves do projeto
  private async getKeysCount(): Promise<number> {
    try {
      let cursor = 0
      let count = 0
      const pattern = `${this.keyPrefix}*`
      
      do {
        const result = await redis.scan(cursor, { match: pattern, count: 1000 })
        cursor = result.cursor
        count += result.keys.length
      } while (cursor !== 0)
      
      return count
    } catch {
      return 0
    }
  }

  // Limpar cache expirado (cleanup manual)
  async cleanup(): Promise<number> {
    try {
      let cursor = 0
      let cleanedCount = 0
      const pattern = `${this.keyPrefix}*`
      
      do {
        const result = await redis.scan(cursor, { match: pattern, count: 100 })
        cursor = result.cursor
        
        for (const key of result.keys) {
          try {
            const cached = await redis.get(key)
            if (cached) {
              const cacheObject = JSON.parse(cached as string)
              const age = Date.now() - cacheObject.timestamp
              
              if (age > (cacheObject.ttl * 1000)) {
                await redis.del(key)
                cleanedCount++
              }
            }
          } catch {
            // Se não conseguir parsear, remover a chave corrompida
            await redis.del(key)
            cleanedCount++
          }
        }
      } while (cursor !== 0)
      
      console.log(`Cleanup do cache concluído: ${cleanedCount} chaves removidas`)
      return cleanedCount
    } catch (error) {
      console.error('Erro no cleanup do cache:', error)
      return 0
    }
  }

  // Flush completo (usar com cuidado)
  async flush(): Promise<boolean> {
    try {
      await redis.flushdb()
      console.log('Cache completamente limpo')
      return true
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
      return false
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', latency: number, error?: string }> {
    const start = Date.now()
    
    try {
      await redis.ping()
      const latency = Date.now() - start
      
      return {
        status: 'healthy',
        latency
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Instância global do cache
export const redisCache = new RedisCacheManager()

// Decorators para cache automático
export function Cached(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `method:${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
      
      return await redisCache.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        options
      )
    }
  }
}

// Hooks React para cache
export function useCache() {
  return {
    get: redisCache.get.bind(redisCache),
    set: redisCache.set.bind(redisCache),
    delete: redisCache.delete.bind(redisCache),
    getOrSet: redisCache.getOrSet.bind(redisCache),
    invalidateByTags: redisCache.invalidateByTags.bind(redisCache),
    invalidateAgency: redisCache.invalidateAgency.bind(redisCache),
    getStats: redisCache.getStats.bind(redisCache)
  }
}

// Estratégias de cache predefinidas
export const CacheStrategies = {
  // Cache de dados estáticos (24h)
  STATIC: { ttl: 86400, tags: ['static'] },
  
  // Cache de dados de usuário (1h)
  USER_DATA: { ttl: 3600, tags: ['user'] },
  
  // Cache de dados de agência (30min)
  AGENCY_DATA: { ttl: 1800, tags: ['agency'] },
  
  // Cache de APIs externas (15min)
  EXTERNAL_API: { ttl: 900, tags: ['external', 'api'] },
  
  // Cache de métricas (5min)
  METRICS: { ttl: 300, tags: ['metrics'] },
  
  // Cache de notificações (2min)
  NOTIFICATIONS: { ttl: 120, tags: ['notifications'] },
  
  // Cache de sessão (30min)
  SESSION: { ttl: 1800, tags: ['session'] }
}

export default redisCache