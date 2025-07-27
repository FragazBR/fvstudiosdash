'use client'

// ==================================================
// FVStudios Dashboard - Advanced Logging System
// Sistema avançado de logs e monitoring
// ==================================================

import { createClient } from '@supabase/supabase-js'
import { redisCache } from './redis-cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogCategory = 'system' | 'user_action' | 'api' | 'auth' | 'performance' | 'security' | 'integration' | 'ai' | 'backup'

export interface LogEntry {
  id?: string
  level: LogLevel
  category: LogCategory
  message: string
  details?: Record<string, any>
  user_id?: string
  agency_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  request_id?: string
  duration_ms?: number
  stack_trace?: string
  created_at?: string
}

export interface PerformanceMetric {
  id?: string
  metric_name: string
  metric_value: number
  metric_type: 'counter' | 'gauge' | 'histogram' | 'timing'
  labels?: Record<string, string>
  agency_id?: string
  user_id?: string
  timestamp?: string
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical'
  uptime_seconds: number
  memory_usage_mb: number
  cpu_usage_percent: number
  active_connections: number
  cache_hit_rate: number
  error_rate_percent: number
  response_time_avg_ms: number
  last_check: string
}

class AdvancedLogger {
  private batchBuffer: LogEntry[] = []
  private metricsBuffer: PerformanceMetric[] = []
  private readonly BATCH_SIZE = 50
  private readonly FLUSH_INTERVAL = 5000 // 5 segundos
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    // Iniciar flush automático
    this.startAutoFlush()
    
    // Capturar erros não tratados
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Uncaught Error', {
          message: event.message,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack
        }, 'system')
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', {
          reason: event.reason?.toString(),
          stack: event.reason?.stack
        }, 'system')
      })
    }
  }

  // Métodos de logging por nível
  debug(message: string, details?: Record<string, any>, category: LogCategory = 'system', context?: Partial<LogEntry>) {
    this.log('debug', message, details, category, context)
  }

  info(message: string, details?: Record<string, any>, category: LogCategory = 'system', context?: Partial<LogEntry>) {
    this.log('info', message, details, category, context)
  }

  warn(message: string, details?: Record<string, any>, category: LogCategory = 'system', context?: Partial<LogEntry>) {
    this.log('warn', message, details, category, context)
  }

  error(message: string, details?: Record<string, any>, category: LogCategory = 'system', context?: Partial<LogEntry>) {
    this.log('error', message, details, category, context)
  }

  critical(message: string, details?: Record<string, any>, category: LogCategory = 'system', context?: Partial<LogEntry>) {
    this.log('critical', message, details, category, context)
    // Logs críticos são enviados imediatamente
    this.flush()
  }

  // Método principal de logging
  private log(
    level: LogLevel, 
    message: string, 
    details?: Record<string, any>, 
    category: LogCategory = 'system',
    context?: Partial<LogEntry>
  ) {
    const logEntry: LogEntry = {
      level,
      category,
      message,
      details: details || {},
      created_at: new Date().toISOString(),
      ...context
    }

    // Adicionar informações de contexto automáticas
    if (typeof window !== 'undefined') {
      logEntry.user_agent = navigator.userAgent
      logEntry.session_id = this.getSessionId()
    }

    // Console logging baseado no nível
    const consoleMethod = level === 'critical' || level === 'error' ? 'error' :
                         level === 'warn' ? 'warn' : 
                         level === 'debug' ? 'debug' : 'log'
    
    console[consoleMethod](`[${level.toUpperCase()}] [${category}] ${message}`, details)

    // Adicionar ao buffer para envio em batch
    this.batchBuffer.push(logEntry)

    // Flush se buffer estiver cheio ou for log crítico
    if (this.batchBuffer.length >= this.BATCH_SIZE || level === 'critical') {
      this.flush()
    }
  }

  // Logging de ações do usuário
  logUserAction(
    action: string,
    details?: Record<string, any>,
    userId?: string,
    agencyId?: string
  ) {
    this.info(`User action: ${action}`, {
      action,
      ...details
    }, 'user_action', {
      user_id: userId,
      agency_id: agencyId
    })
  }

  // Logging de performance de API
  logApiCall(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    userId?: string,
    agencyId?: string,
    requestId?: string
  ) {
    const level: LogLevel = statusCode >= 500 ? 'error' : 
                           statusCode >= 400 ? 'warn' : 'info'

    this.log(level, `API ${method} ${path}`, {
      method,
      path,
      status_code: statusCode,
      duration_ms: durationMs,
      success: statusCode < 400
    }, 'api', {
      user_id: userId,
      agency_id: agencyId,
      request_id: requestId,
      duration_ms: durationMs
    })

    // Registrar métrica de performance
    this.recordMetric('api_response_time', durationMs, 'timing', {
      method,
      path,
      status: statusCode.toString()
    }, agencyId, userId)

    this.recordMetric('api_requests_total', 1, 'counter', {
      method,
      path,
      status: statusCode.toString()
    }, agencyId, userId)
  }

  // Logging de autenticação
  logAuth(
    event: 'login' | 'logout' | 'login_failed' | 'token_refresh' | 'unauthorized',
    userId?: string,
    details?: Record<string, any>
  ) {
    const level: LogLevel = event === 'login_failed' || event === 'unauthorized' ? 'warn' : 'info'
    
    this.log(level, `Auth event: ${event}`, {
      event,
      ...details
    }, 'auth', {
      user_id: userId
    })
  }

  // Logging de segurança
  logSecurity(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>,
    userId?: string,
    ipAddress?: string
  ) {
    const level: LogLevel = severity === 'critical' ? 'critical' :
                           severity === 'high' ? 'error' :
                           severity === 'medium' ? 'warn' : 'info'

    this.log(level, `Security event: ${event}`, {
      event,
      severity,
      ...details
    }, 'security', {
      user_id: userId,
      ip_address: ipAddress
    })
  }

  // Registrar métricas de performance
  recordMetric(
    name: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram' | 'timing',
    labels?: Record<string, string>,
    agencyId?: string,
    userId?: string
  ) {
    const metric: PerformanceMetric = {
      metric_name: name,
      metric_value: value,
      metric_type: type,
      labels: labels || {},
      agency_id: agencyId,
      user_id: userId,
      timestamp: new Date().toISOString()
    }

    this.metricsBuffer.push(metric)

    // Cache da métrica para dashboard em tempo real
    const cacheKey = `metric:${name}:${JSON.stringify(labels || {})}`
    redisCache.set(cacheKey, {
      ...metric,
      last_updated: Date.now()
    }, { ttl: 300 }).catch(err => console.warn('Cache metric error:', err))

    // Flush métricas se buffer estiver cheio
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      this.flushMetrics()
    }
  }

  // Monitorar performance de função
  async measurePerformance<T>(
    operationName: string,
    operation: () => Promise<T>,
    labels?: Record<string, string>,
    agencyId?: string,
    userId?: string
  ): Promise<T> {
    const startTime = Date.now()
    let error: Error | null = null

    try {
      const result = await operation()
      const duration = Date.now() - startTime

      this.recordMetric(`operation_duration`, duration, 'timing', {
        operation: operationName,
        status: 'success',
        ...labels
      }, agencyId, userId)

      this.info(`Operation completed: ${operationName}`, {
        duration_ms: duration,
        status: 'success'
      }, 'performance')

      return result
    } catch (err) {
      error = err as Error
      const duration = Date.now() - startTime

      this.recordMetric(`operation_duration`, duration, 'timing', {
        operation: operationName,
        status: 'error',
        ...labels
      }, agencyId, userId)

      this.error(`Operation failed: ${operationName}`, {
        duration_ms: duration,
        error: error.message,
        stack: error.stack
      }, 'performance')

      throw error
    }
  }

  // Flush logs para o banco
  private async flush() {
    if (this.batchBuffer.length === 0) return

    const logsToSend = [...this.batchBuffer]
    this.batchBuffer = []

    try {
      const { error } = await supabase
        .from('system_logs')
        .insert(logsToSend.map(log => ({
          level: log.level,
          category: log.category,
          message: log.message,
          details: log.details || {},
          user_id: log.user_id,
          agency_id: log.agency_id,
          session_id: log.session_id,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          request_id: log.request_id,
          duration_ms: log.duration_ms,
          stack_trace: log.stack_trace,
          created_at: log.created_at
        })))

      if (error) {
        console.error('Failed to flush logs:', error)
        // Re-adicionar logs ao buffer se falhou
        this.batchBuffer.unshift(...logsToSend)
      }
    } catch (error) {
      console.error('Error flushing logs:', error)
      // Re-adicionar logs ao buffer se falhou
      this.batchBuffer.unshift(...logsToSend)
    }
  }

  // Flush métricas para o banco
  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return

    const metricsToSend = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(metricsToSend.map(metric => ({
          metric_name: metric.metric_name,
          metric_value: metric.metric_value,
          metric_type: metric.metric_type,
          labels: metric.labels || {},
          agency_id: metric.agency_id,
          user_id: metric.user_id,
          timestamp: metric.timestamp
        })))

      if (error) {
        console.error('Failed to flush metrics:', error)
        // Re-adicionar métricas ao buffer se falhou
        this.metricsBuffer.unshift(...metricsToSend)
      }
    } catch (error) {
      console.error('Error flushing metrics:', error)
      // Re-adicionar métricas ao buffer se falhou
      this.metricsBuffer.unshift(...metricsToSend)
    }
  }

  // Auto flush periódico
  private startAutoFlush() {
    this.flushTimer = setInterval(() => {
      this.flush()
      this.flushMetrics()
    }, this.FLUSH_INTERVAL)
  }

  // Parar auto flush
  stopAutoFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    // Flush final
    this.flush()
    this.flushMetrics()
  }

  // Obter ID da sessão
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('fvstudios_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
      sessionStorage.setItem('fvstudios_session_id', sessionId)
    }
    return sessionId
  }

  // Buscar logs com filtros
  async searchLogs(filters: {
    level?: LogLevel[]
    category?: LogCategory[]
    user_id?: string
    agency_id?: string
    start_date?: string
    end_date?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from('system_logs')
        .select(`
          id,
          level,
          category,
          message,
          details,
          user_id,
          agency_id,
          session_id,
          ip_address,
          duration_ms,
          created_at,
          profiles!user_id(email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (filters.level && filters.level.length > 0) {
        query = query.in('level', filters.level)
      }

      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category)
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters.agency_id) {
        query = query.eq('agency_id', filters.agency_id)
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date)
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date)
      }

      if (filters.search) {
        query = query.ilike('message', `%${filters.search}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error searching logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error searching logs:', error)
      return []
    }
  }

  // Obter métricas agregadas
  async getAggregatedMetrics(
    metricName: string,
    timeRange: '1h' | '24h' | '7d' | '30d',
    agencyId?: string
  ) {
    try {
      const now = new Date()
      const startTime = new Date()
      
      switch (timeRange) {
        case '1h':
          startTime.setHours(now.getHours() - 1)
          break
        case '24h':
          startTime.setHours(now.getHours() - 24)
          break
        case '7d':
          startTime.setDate(now.getDate() - 7)
          break
        case '30d':
          startTime.setDate(now.getDate() - 30)
          break
      }

      let query = supabase
        .from('performance_metrics')
        .select('*')
        .eq('metric_name', metricName)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true })

      if (agencyId) {
        query = query.eq('agency_id', agencyId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error getting metrics:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting metrics:', error)
      return []
    }
  }

  // Obter status de saúde do sistema
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Buscar métricas recentes do cache
      const cacheKeys = [
        'system:memory_usage',
        'system:cpu_usage', 
        'system:active_connections',
        'system:response_time'
      ]

      const cachedMetrics = await Promise.all(
        cacheKeys.map(key => redisCache.get(key))
      )

      const [memoryUsage, cpuUsage, activeConnections, responseTime] = cachedMetrics

      // Calcular taxa de erro das últimas 24h
      const errorLogsCount = await supabase
        .from('system_logs')
        .select('id', { count: 'exact' })
        .in('level', ['error', 'critical'])
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const totalLogsCount = await supabase
        .from('system_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const errorRate = totalLogsCount.count && totalLogsCount.count > 0 
        ? (errorLogsCount.count || 0) / totalLogsCount.count * 100 
        : 0

      // Determinar status geral
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
      
      if (errorRate > 10 || (responseTime as number) > 2000) {
        status = 'critical'
      } else if (errorRate > 5 || (responseTime as number) > 1000) {
        status = 'degraded'
      }

      return {
        status,
        uptime_seconds: Math.floor(process.uptime?.() || 0),
        memory_usage_mb: (memoryUsage as number) || 0,
        cpu_usage_percent: (cpuUsage as number) || 0,
        active_connections: (activeConnections as number) || 0,
        cache_hit_rate: 95, // Simulado
        error_rate_percent: errorRate,
        response_time_avg_ms: (responseTime as number) || 0,
        last_check: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting system health:', error)
      return {
        status: 'critical',
        uptime_seconds: 0,
        memory_usage_mb: 0,
        cpu_usage_percent: 0,
        active_connections: 0,
        cache_hit_rate: 0,
        error_rate_percent: 100,
        response_time_avg_ms: 0,
        last_check: new Date().toISOString()
      }
    }
  }
}

// Instância global do logger
export const logger = new AdvancedLogger()

// Hook React para logging
export function useLogger() {
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    critical: logger.critical.bind(logger),
    logUserAction: logger.logUserAction.bind(logger),
    logApiCall: logger.logApiCall.bind(logger),
    logAuth: logger.logAuth.bind(logger),
    logSecurity: logger.logSecurity.bind(logger),
    recordMetric: logger.recordMetric.bind(logger),
    measurePerformance: logger.measurePerformance.bind(logger),
    searchLogs: logger.searchLogs.bind(logger),
    getAggregatedMetrics: logger.getAggregatedMetrics.bind(logger),
    getSystemHealth: logger.getSystemHealth.bind(logger)
  }
}

export default logger