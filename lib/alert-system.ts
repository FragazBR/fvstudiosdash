'use client'

// ==================================================
// FVStudios Dashboard - Advanced Alert System
// Sistema de alertas inteligente e configurável
// ==================================================

import { createClient } from '@supabase/supabase-js'
import { logger } from './advanced-logger'
import { redisCache } from './redis-cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AlertType = 'performance' | 'security' | 'system' | 'business' | 'compliance' | 'custom'
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed'
export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'slack' | 'webhook' | 'dashboard'

export interface AlertRule {
  id?: string
  name: string
  description: string
  type: AlertType
  severity: AlertSeverity
  conditions: AlertCondition[]
  notification_channels: NotificationChannel[]
  cooldown_minutes: number
  is_active: boolean
  agency_id?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not_contains'
  value: number | string
  timeframe_minutes?: number
  aggregation?: 'avg' | 'sum' | 'count' | 'min' | 'max'
}

export interface Alert {
  id?: string
  rule_id: string
  rule_name: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  details: Record<string, any>
  status: AlertStatus
  agency_id?: string
  triggered_at: string
  acknowledged_at?: string
  acknowledged_by?: string
  resolved_at?: string
  resolved_by?: string
  notification_sent: boolean
  created_at?: string
}

export interface NotificationTemplate {
  id?: string
  name: string
  channel: NotificationChannel
  template_type: 'alert' | 'digest' | 'report'
  subject_template: string
  body_template: string
  variables: string[]
  is_active: boolean
  agency_id?: string
  created_at?: string
  updated_at?: string
}

class AlertSystem {
  private readonly CACHE_PREFIX = 'alert'
  private evaluationInterval: NodeJS.Timeout | null = null

  constructor() {
    // Iniciar avaliação automática de alertas
    this.startAlertEvaluation()
  }

  // Criar regra de alerta
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert({
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to create alert rule', { error, rule }, 'system')
        return null
      }

      logger.info('Alert rule created', { rule_id: data.id, rule_name: rule.name }, 'system')
      
      // Invalidar cache de regras
      await redisCache.invalidateByTags(['alert_rules'])
      
      return data.id
    } catch (error) {
      logger.error('Error creating alert rule', { error, rule }, 'system')
      return null
    }
  }

  // Avaliar condições de alerta
  async evaluateAlertRules(): Promise<void> {
    try {
      // Buscar regras ativas
      const { data: rules, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('is_active', true)

      if (error) {
        logger.error('Error fetching alert rules', { error }, 'system')
        return
      }

      // Avaliar cada regra
      for (const rule of rules || []) {
        await this.evaluateRule(rule)
      }
    } catch (error) {
      logger.error('Error evaluating alert rules', { error }, 'system')
    }
  }

  // Avaliar regra específica
  private async evaluateRule(rule: AlertRule): Promise<void> {
    try {
      // Verificar cooldown
      const lastTrigger = await redisCache.get(`${this.CACHE_PREFIX}:cooldown:${rule.id}`)
      if (lastTrigger) {
        const cooldownEndTime = new Date(lastTrigger as string).getTime() + (rule.cooldown_minutes * 60 * 1000)
        if (Date.now() < cooldownEndTime) {
          return // Ainda em cooldown
        }
      }

      // Avaliar todas as condições
      const conditionResults = await Promise.all(
        rule.conditions.map(condition => this.evaluateCondition(condition, rule.agency_id))
      )

      // Todas as condições devem ser verdadeiras para disparar o alerta
      const shouldTrigger = conditionResults.every(result => result.triggered)

      if (shouldTrigger) {
        await this.triggerAlert(rule, conditionResults)
      }
    } catch (error) {
      logger.error('Error evaluating rule', { error, rule_id: rule.id }, 'system')
    }
  }

  // Avaliar condição específica
  private async evaluateCondition(condition: AlertCondition, agencyId?: string): Promise<{
    triggered: boolean
    currentValue: any
    threshold: any
  }> {
    try {
      let currentValue: any = 0

      // Buscar valor atual baseado na métrica
      switch (condition.metric) {
        case 'error_rate':
          currentValue = await this.getErrorRate(condition.timeframe_minutes || 60, agencyId)
          break
        case 'response_time':
          currentValue = await this.getResponseTime(condition.timeframe_minutes || 60, agencyId)
          break
        case 'memory_usage':
          currentValue = await this.getMemoryUsage()
          break
        case 'cpu_usage':
          currentValue = await this.getCpuUsage()
          break
        case 'cache_hit_rate':
          currentValue = await this.getCacheHitRate()
          break
        case 'disk_usage':
          currentValue = await this.getDiskUsage()
          break
        case 'active_users':
          currentValue = await this.getActiveUsers(condition.timeframe_minutes || 60, agencyId)
          break
        case 'failed_logins':
          currentValue = await this.getFailedLogins(condition.timeframe_minutes || 60, agencyId)
          break
        case 'backup_age':
          currentValue = await this.getLastBackupAge(agencyId)
          break
        default:
          // Métrica customizada
          currentValue = await this.getCustomMetric(condition.metric, condition.timeframe_minutes, agencyId)
      }

      // Avaliar condição
      const triggered = this.evaluateConditionLogic(currentValue, condition.operator, condition.value)

      return {
        triggered,
        currentValue,
        threshold: condition.value
      }
    } catch (error) {
      logger.error('Error evaluating condition', { error, condition }, 'system')
      return { triggered: false, currentValue: null, threshold: condition.value }
    }
  }

  // Lógica de avaliação de condições
  private evaluateConditionLogic(currentValue: any, operator: string, threshold: any): boolean {
    switch (operator) {
      case 'gt': return Number(currentValue) > Number(threshold)
      case 'lt': return Number(currentValue) < Number(threshold)
      case 'eq': return currentValue === threshold
      case 'gte': return Number(currentValue) >= Number(threshold)
      case 'lte': return Number(currentValue) <= Number(threshold)
      case 'contains': return String(currentValue).includes(String(threshold))
      case 'not_contains': return !String(currentValue).includes(String(threshold))
      default: return false
    }
  }

  // Métricas específicas
  private async getErrorRate(timeframeMinutes: number, agencyId?: string): Promise<number> {
    const startTime = new Date(Date.now() - timeframeMinutes * 60 * 1000)
    
    let errorQuery = supabase
      .from('system_logs')
      .select('id', { count: 'exact' })
      .in('level', ['error', 'critical'])
      .gte('created_at', startTime.toISOString())

    let totalQuery = supabase
      .from('system_logs')
      .select('id', { count: 'exact' })
      .gte('created_at', startTime.toISOString())

    if (agencyId) {
      errorQuery = errorQuery.eq('agency_id', agencyId)
      totalQuery = totalQuery.eq('agency_id', agencyId)
    }

    const [{ count: errorCount }, { count: totalCount }] = await Promise.all([
      errorQuery,
      totalQuery
    ])

    return totalCount && totalCount > 0 ? (errorCount || 0) / totalCount * 100 : 0
  }

  private async getResponseTime(timeframeMinutes: number, agencyId?: string): Promise<number> {
    const startTime = new Date(Date.now() - timeframeMinutes * 60 * 1000)
    
    let query = supabase
      .from('system_logs')
      .select('duration_ms')
      .not('duration_ms', 'is', null)
      .gte('created_at', startTime.toISOString())

    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    const { data } = await query
    
    if (!data || data.length === 0) return 0
    
    const durations = data.map(d => d.duration_ms).filter(d => d !== null)
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
  }

  private async getMemoryUsage(): Promise<number> {
    return await redisCache.get('system:memory_usage') as number || 0
  }

  private async getCpuUsage(): Promise<number> {
    return await redisCache.get('system:cpu_usage') as number || 0
  }

  private async getCacheHitRate(): Promise<number> {
    const stats = await redisCache.getStats()
    return stats.hits + stats.misses > 0 ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0
  }

  private async getDiskUsage(): Promise<number> {
    return await redisCache.get('system:disk_usage') as number || 0
  }

  private async getActiveUsers(timeframeMinutes: number, agencyId?: string): Promise<number> {
    const startTime = new Date(Date.now() - timeframeMinutes * 60 * 1000)
    
    let query = supabase
      .from('system_logs')
      .select('user_id')
      .not('user_id', 'is', null)
      .gte('created_at', startTime.toISOString())

    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    const { data } = await query
    const uniqueUsers = new Set(data?.map(d => d.user_id))
    return uniqueUsers.size
  }

  private async getFailedLogins(timeframeMinutes: number, agencyId?: string): Promise<number> {
    const startTime = new Date(Date.now() - timeframeMinutes * 60 * 1000)
    
    let query = supabase
      .from('system_logs')
      .select('id', { count: 'exact' })
      .eq('category', 'auth')
      .ilike('message', '%failed%')
      .gte('created_at', startTime.toISOString())

    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    const { count } = await query
    return count || 0
  }

  private async getLastBackupAge(agencyId?: string): Promise<number> {
    let query = supabase
      .from('backup_records')
      .select('completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)

    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    const { data } = await query
    
    if (!data || data.length === 0) return Infinity
    
    const lastBackup = new Date(data[0].completed_at)
    return (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60) // horas
  }

  private async getCustomMetric(metricName: string, timeframeMinutes?: number, agencyId?: string): Promise<number> {
    const startTime = timeframeMinutes 
      ? new Date(Date.now() - timeframeMinutes * 60 * 1000)
      : new Date(Date.now() - 60 * 60 * 1000) // padrão 1 hora

    let query = supabase
      .from('performance_metrics')
      .select('metric_value')
      .eq('metric_name', metricName)
      .gte('timestamp', startTime.toISOString())

    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }

    const { data } = await query
    
    if (!data || data.length === 0) return 0
    
    const values = data.map(d => d.metric_value)
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  // Disparar alerta
  private async triggerAlert(rule: AlertRule, conditionResults: any[]): Promise<void> {
    try {
      // Criar alerta
      const alertData: Alert = {
        rule_id: rule.id!,
        rule_name: rule.name,
        type: rule.type,
        severity: rule.severity,
        title: `${rule.name} - Alerta Disparado`,
        message: this.generateAlertMessage(rule, conditionResults),
        details: {
          conditions: conditionResults,
          rule_conditions: rule.conditions,
          triggered_at: new Date().toISOString()
        },
        status: 'active',
        agency_id: rule.agency_id,
        triggered_at: new Date().toISOString(),
        notification_sent: false
      }

      const { data, error } = await supabase
        .from('alerts')
        .insert(alertData)
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to create alert', { error, alert: alertData }, 'system')
        return
      }

      // Definir cooldown
      await redisCache.set(`${this.CACHE_PREFIX}:cooldown:${rule.id}`, new Date().toISOString(), {
        ttl: rule.cooldown_minutes * 60
      })

      // Enviar notificações
      await this.sendNotifications(rule, { ...alertData, id: data.id })

      // Log do alerta
      logger.critical('Alert triggered', {
        alert_id: data.id,
        rule_id: rule.id,
        rule_name: rule.name,
        severity: rule.severity,
        conditions: conditionResults
      }, 'system')

    } catch (error) {
      logger.error('Error triggering alert', { error, rule_id: rule.id }, 'system')
    }
  }

  // Gerar mensagem do alerta
  private generateAlertMessage(rule: AlertRule, conditionResults: any[]): string {
    const messages = conditionResults.map((result, index) => {
      const condition = rule.conditions[index]
      return `${condition.metric} (${result.currentValue}) ${condition.operator} ${condition.value}`
    })

    return `${rule.description}\n\nCondições disparadas:\n${messages.join('\n')}`
  }

  // Enviar notificações
  private async sendNotifications(rule: AlertRule, alert: Alert): Promise<void> {
    try {
      for (const channel of rule.notification_channels) {
        await this.sendNotification(channel, rule, alert)
      }

      // Marcar notificações como enviadas
      await supabase
        .from('alerts')
        .update({ notification_sent: true })
        .eq('id', alert.id)

    } catch (error) {
      logger.error('Error sending notifications', { error, alert_id: alert.id }, 'system')
    }
  }

  // Enviar notificação específica
  private async sendNotification(channel: NotificationChannel, rule: AlertRule, alert: Alert): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(rule, alert)
          break
        case 'slack':
          await this.sendSlackNotification(rule, alert)
          break
        case 'webhook':
          await this.sendWebhookNotification(rule, alert)
          break
        case 'dashboard':
          await this.sendDashboardNotification(rule, alert)
          break
        default:
          logger.warn('Unsupported notification channel', { channel, alert_id: alert.id })
      }
    } catch (error) {
      logger.error('Error sending notification', { error, channel, alert_id: alert.id }, 'system')
    }
  }

  private async sendEmailNotification(rule: AlertRule, alert: Alert): Promise<void> {
    // Implementar envio de email
    logger.info('Email notification sent', { alert_id: alert.id, rule_name: rule.name })
  }

  private async sendSlackNotification(rule: AlertRule, alert: Alert): Promise<void> {
    // Implementar envio para Slack
    logger.info('Slack notification sent', { alert_id: alert.id, rule_name: rule.name })
  }

  private async sendWebhookNotification(rule: AlertRule, alert: Alert): Promise<void> {
    // Implementar webhook
    logger.info('Webhook notification sent', { alert_id: alert.id, rule_name: rule.name })
  }

  private async sendDashboardNotification(rule: AlertRule, alert: Alert): Promise<void> {
    // Cache para dashboard em tempo real
    await redisCache.set(`alert:dashboard:${alert.id}`, alert, { ttl: 3600 })
    logger.info('Dashboard notification sent', { alert_id: alert.id, rule_name: rule.name })
  }

  // Reconhecer alerta
  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId
        })
        .eq('id', alertId)

      if (error) {
        logger.error('Failed to acknowledge alert', { error, alert_id: alertId }, 'system')
        return false
      }

      logger.info('Alert acknowledged', { alert_id: alertId, user_id: userId }, 'system')
      return true
    } catch (error) {
      logger.error('Error acknowledging alert', { error, alert_id: alertId }, 'system')
      return false
    }
  }

  // Resolver alerta
  async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: userId
        })
        .eq('id', alertId)

      if (error) {
        logger.error('Failed to resolve alert', { error, alert_id: alertId }, 'system')
        return false
      }

      logger.info('Alert resolved', { alert_id: alertId, user_id: userId }, 'system')
      return true
    } catch (error) {
      logger.error('Error resolving alert', { error, alert_id: alertId }, 'system')
      return false
    }
  }

  // Listar alertas
  async getAlerts(filters: {
    status?: AlertStatus
    severity?: AlertSeverity
    type?: AlertType
    agency_id?: string
    limit?: number
    offset?: number
  } = {}): Promise<Alert[]> {
    try {
      let query = supabase
        .from('alerts')
        .select(`
          *,
          profiles!acknowledged_by(email, full_name),
          profiles!resolved_by(email, full_name)
        `)
        .order('triggered_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity)
      }

      if (filters.type) {
        query = query.eq('type', filters.type)
      }

      if (filters.agency_id) {
        query = query.eq('agency_id', filters.agency_id)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Error fetching alerts', { error, filters }, 'system')
        return []
      }

      return data || []
    } catch (error) {
      logger.error('Error fetching alerts', { error, filters }, 'system')
      return []
    }
  }

  // Iniciar avaliação automática
  private startAlertEvaluation(): void {
    // Avaliar a cada 5 minutos
    this.evaluationInterval = setInterval(() => {
      this.evaluateAlertRules()
    }, 5 * 60 * 1000)

    // Avaliação inicial
    setTimeout(() => {
      this.evaluateAlertRules()
    }, 10000) // 10 segundos após inicialização
  }

  // Parar avaliação automática
  stopAlertEvaluation(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval)
      this.evaluationInterval = null
    }
  }

  // Obter estatísticas de alertas
  async getAlertStatistics(agencyId?: string): Promise<Record<string, any>> {
    try {
      let query = supabase
        .from('alerts')
        .select('severity, status, type, triggered_at')

      if (agencyId) {
        query = query.eq('agency_id', agencyId)
      }

      const { data } = await query

      if (!data) return {}

      // Estatísticas por severidade
      const bySeverity = data.reduce((acc: any, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1
        return acc
      }, {})

      // Estatísticas por status
      const byStatus = data.reduce((acc: any, alert) => {
        acc[alert.status] = (acc[alert.status] || 0) + 1
        return acc
      }, {})

      // Estatísticas por tipo
      const byType = data.reduce((acc: any, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1
        return acc
      }, {})

      // Alertas nas últimas 24h
      const last24h = data.filter(alert => {
        const alertTime = new Date(alert.triggered_at).getTime()
        return Date.now() - alertTime < 24 * 60 * 60 * 1000
      }).length

      return {
        total: data.length,
        by_severity: bySeverity,
        by_status: byStatus,
        by_type: byType,
        last_24h: last24h,
        active_count: byStatus.active || 0,
        critical_count: bySeverity.critical || 0
      }
    } catch (error) {
      logger.error('Error getting alert statistics', { error, agency_id: agencyId }, 'system')
      return {}
    }
  }
}

// Instância global do sistema de alertas
export const alertSystem = new AlertSystem()

// Hook React para alertas
export function useAlerts() {
  return {
    createAlertRule: alertSystem.createAlertRule.bind(alertSystem),
    getAlerts: alertSystem.getAlerts.bind(alertSystem),
    acknowledgeAlert: alertSystem.acknowledgeAlert.bind(alertSystem),
    resolveAlert: alertSystem.resolveAlert.bind(alertSystem),
    getAlertStatistics: alertSystem.getAlertStatistics.bind(alertSystem)
  }
}

export default alertSystem