import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ExecutiveMetrics {
  overview: {
    total_agencies: number
    active_users: number
    total_projects: number
    projects_this_month: number
    revenue_this_month: number
    revenue_growth_percent: number
    system_health_score: number
    uptime_percent: number
  }
  performance: {
    avg_response_time: number
    api_requests_today: number
    error_rate_percent: number
    cache_hit_rate: number
    database_connections: number
    memory_usage_percent: number
    cpu_usage_percent: number
  }
  business: {
    new_clients_this_month: number
    churn_rate_percent: number
    customer_satisfaction: number
    avg_project_value: number
    conversion_rate_percent: number
    monthly_recurring_revenue: number
    lifetime_value: number
  }
  security: {
    active_alerts: number
    critical_alerts: number
    security_incidents: number
    compliance_score: number
    failed_login_attempts: number
    data_breaches: number
    backup_health_score: number
  }
  operations: {
    total_backups: number
    successful_backups_percent: number
    last_backup_hours_ago: number
    storage_usage_gb: number
    bandwidth_usage_gb: number
    active_integrations: number
    whatsapp_messages_sent: number
  }
}

export interface TrendData {
  date: string
  value: number
  comparison?: number
}

export interface AlertSummary {
  id: string
  title: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  type: string
  triggered_at: string
  status: string
}

export class ExecutiveAnalytics {
  async getExecutiveMetrics(agencyId?: string): Promise<ExecutiveMetrics> {
    try {
      const [
        overview,
        performance,
        business,
        security,
        operations
      ] = await Promise.all([
        this.getOverviewMetrics(agencyId),
        this.getPerformanceMetrics(agencyId),
        this.getBusinessMetrics(agencyId),
        this.getSecurityMetrics(agencyId),
        this.getOperationsMetrics(agencyId)
      ])

      return {
        overview,
        performance,
        business,
        security,
        operations
      }
    } catch (error) {
      console.error('Erro ao buscar métricas executivas:', error)
      throw error
    }
  }

  private async getOverviewMetrics(agencyId?: string): Promise<ExecutiveMetrics['overview']> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [agenciesQuery, usersQuery, projectsQuery, revenueQuery, healthQuery] = await Promise.all([
      // Total de agências
      supabase
        .from('agencies')
        .select('id', { count: 'exact', head: true })
        .then(result => result.count || 0),

      // Usuários ativos (logaram nos últimos 30 dias)
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString())
        .then(result => result.count || 0),

      // Projetos
      supabase
        .from('projects')
        .select('id, created_at')
        .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
        .then(result => ({
          total: result.data?.length || 0,
          this_month: result.data?.filter(p => 
            new Date(p.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          ).length || 0
        })),

      // Receita (simulada baseada em projetos)
      this.calculateRevenue(agencyId),

      // Saúde do sistema
      this.getSystemHealthScore()
    ])

    const revenueGrowth = await this.calculateRevenueGrowth(agencyId)

    return {
      total_agencies: agencyId ? 1 : agenciesQuery,
      active_users: usersQuery,
      total_projects: projectsQuery.total,
      projects_this_month: projectsQuery.this_month,
      revenue_this_month: revenueQuery.current,
      revenue_growth_percent: revenueGrowth,
      system_health_score: healthQuery.score,
      uptime_percent: healthQuery.uptime
    }
  }

  private async getPerformanceMetrics(agencyId?: string): Promise<ExecutiveMetrics['performance']> {
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const [apiMetrics, systemMetrics] = await Promise.all([
      // Métricas de API dos logs
      supabase
        .from('system_logs')
        .select('response_time, created_at')
        .eq('category', 'api')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .then(result => ({
          avg_response_time: result.data?.reduce((acc, log) => 
            acc + (log.response_time || 0), 0
          ) / (result.data?.length || 1) || 0,
          total_requests: result.data?.length || 0
        })),

      // Métricas do sistema
      this.getSystemMetrics()
    ])

    const errorLogs = await supabase
      .from('system_logs')
      .select('id', { count: 'exact', head: true })
      .eq('level', 'error')
      .gte('created_at', twentyFourHoursAgo.toISOString())

    const totalLogs = await supabase
      .from('system_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString())

    const errorRate = totalLogs.count ? 
      ((errorLogs.count || 0) / totalLogs.count) * 100 : 0

    return {
      avg_response_time: Math.round(apiMetrics.avg_response_time),
      api_requests_today: apiMetrics.total_requests,
      error_rate_percent: Number(errorRate.toFixed(2)),
      cache_hit_rate: systemMetrics.cache_hit_rate,
      database_connections: systemMetrics.db_connections,
      memory_usage_percent: systemMetrics.memory_usage,
      cpu_usage_percent: systemMetrics.cpu_usage
    }
  }

  private async getBusinessMetrics(agencyId?: string): Promise<ExecutiveMetrics['business']> {
    const firstDayThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const firstDayLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)

    const [clientsQuery, projectsQuery] = await Promise.all([
      // Novos clientes este mês
      supabase
        .from('clients')
        .select('id, created_at')
        .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
        .gte('created_at', firstDayThisMonth.toISOString())
        .then(result => result.data?.length || 0),

      // Projetos para cálculo de métricas
      supabase
        .from('projects')
        .select('id, status, budget, created_at, client_id')
        .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
    ])

    const projects = projectsQuery.data || []
    const completedProjects = projects.filter(p => p.status === 'completed')
    const avgProjectValue = completedProjects.length > 0 ? 
      completedProjects.reduce((acc, p) => acc + (p.budget || 0), 0) / completedProjects.length : 0

    // Simular outras métricas baseadas em dados disponíveis
    const totalClients = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)

    const churnRate = Math.max(0, Math.random() * 5) // Simulado: 0-5%
    const customerSatisfaction = 4.2 + Math.random() * 0.6 // Simulado: 4.2-4.8
    const conversionRate = 15 + Math.random() * 10 // Simulado: 15-25%

    return {
      new_clients_this_month: clientsQuery,
      churn_rate_percent: Number(churnRate.toFixed(1)),
      customer_satisfaction: Number(customerSatisfaction.toFixed(1)),
      avg_project_value: avgProjectValue,
      conversion_rate_percent: Number(conversionRate.toFixed(1)),
      monthly_recurring_revenue: avgProjectValue * 0.3, // Estimativa
      lifetime_value: avgProjectValue * 3.5 // Estimativa
    }
  }

  private async getSecurityMetrics(agencyId?: string): Promise<ExecutiveMetrics['security']> {
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const [alertsQuery, complianceQuery, securityQuery] = await Promise.all([
      // Alertas ativos
      supabase
        .from('alerts')
        .select('id, severity')
        .eq('status', 'active')
        .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
        .then(result => ({
          total: result.data?.length || 0,
          critical: result.data?.filter(a => a.severity === 'critical').length || 0
        })),

      // Score de compliance
      supabase
        .from('compliance_reports')
        .select('overall_score')
        .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(result => result.data?.overall_score || 85),

      // Logs de segurança
      supabase
        .from('system_logs')
        .select('id, details')
        .in('category', ['security', 'auth'])
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .then(result => ({
          failed_logins: result.data?.filter(log => 
            log.details?.event === 'login_failed'
          ).length || 0,
          incidents: result.data?.filter(log => 
            log.details?.severity === 'high'
          ).length || 0
        }))
    ])

    const backupHealth = await this.getBackupHealthScore(agencyId)

    return {
      active_alerts: alertsQuery.total,
      critical_alerts: alertsQuery.critical,
      security_incidents: securityQuery.incidents,
      compliance_score: complianceQuery,
      failed_login_attempts: securityQuery.failed_logins,
      data_breaches: 0, // Monitoramento específico necessário
      backup_health_score: backupHealth
    }
  }

  private async getOperationsMetrics(agencyId?: string): Promise<ExecutiveMetrics['operations']> {
    const [backupsQuery, integrationsQuery, whatsappQuery] = await Promise.all([
      // Backups
      supabase
        .from('backups')
        .select('id, status, created_at')
        .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
        .then(result => ({
          total: result.data?.length || 0,
          successful: result.data?.filter(b => b.status === 'completed').length || 0,
          last_backup: result.data?.[0]?.created_at
        })),

      // Integrações ativas (simulado)
      Promise.resolve(5 + Math.floor(Math.random() * 3)), // 5-7 integrações

      // Mensagens WhatsApp enviadas hoje
      supabase
        .from('client_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('channel', 'whatsapp')
        .gte('created_at', new Date().toISOString().split('T')[0])
        .then(result => result.count || 0)
    ])

    const successfulBackupsPercent = backupsQuery.total > 0 ? 
      (backupsQuery.successful / backupsQuery.total) * 100 : 100

    const lastBackupHours = backupsQuery.last_backup ? 
      Math.floor((Date.now() - new Date(backupsQuery.last_backup).getTime()) / (1000 * 60 * 60)) : 999

    // Simular uso de storage e bandwidth
    const storageUsage = 50 + Math.random() * 200 // 50-250 GB
    const bandwidthUsage = 10 + Math.random() * 40 // 10-50 GB

    return {
      total_backups: backupsQuery.total,
      successful_backups_percent: Number(successfulBackupsPercent.toFixed(1)),
      last_backup_hours_ago: lastBackupHours,
      storage_usage_gb: Number(storageUsage.toFixed(1)),
      bandwidth_usage_gb: Number(bandwidthUsage.toFixed(1)),
      active_integrations: integrationsQuery,
      whatsapp_messages_sent: whatsappQuery
    }
  }

  async getTrendData(metric: string, days: number = 30, agencyId?: string): Promise<TrendData[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      switch (metric) {
        case 'projects':
          return await this.getProjectsTrend(startDate, agencyId)
        case 'revenue':
          return await this.getRevenueTrend(startDate, agencyId)
        case 'users':
          return await this.getUsersTrend(startDate, agencyId)
        case 'alerts':
          return await this.getAlertsTrend(startDate, agencyId)
        case 'performance':
          return await this.getPerformanceTrend(startDate, agencyId)
        default:
          return []
      }
    } catch (error) {
      console.error(`Erro ao buscar trend data para ${metric}:`, error)
      return []
    }
  }

  async getCriticalAlerts(agencyId?: string, limit: number = 10): Promise<AlertSummary[]> {
    const { data } = await supabase
      .from('alerts')
      .select('id, title, severity, type, triggered_at, status')
      .eq('status', 'active')
      .in('severity', ['critical', 'error'])
      .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
      .order('triggered_at', { ascending: false })
      .limit(limit)

    return data?.map(alert => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      type: alert.type,
      triggered_at: alert.triggered_at,
      status: alert.status
    })) || []
  }

  private async calculateRevenue(agencyId?: string): Promise<{ current: number, previous: number }> {
    const firstDayThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const firstDayLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)

    const [currentMonth, previousMonth] = await Promise.all([
      supabase
        .from('projects')
        .select('budget')
        .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
        .gte('created_at', firstDayThisMonth.toISOString())
        .then(result => result.data?.reduce((acc, p) => acc + (p.budget || 0), 0) || 0),

      supabase
        .from('projects')
        .select('budget')
        .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
        .gte('created_at', firstDayLastMonth.toISOString())
        .lt('created_at', firstDayThisMonth.toISOString())
        .then(result => result.data?.reduce((acc, p) => acc + (p.budget || 0), 0) || 0)
    ])

    return { current: currentMonth, previous: previousMonth }
  }

  private async calculateRevenueGrowth(agencyId?: string): Promise<number> {
    const revenue = await this.calculateRevenue(agencyId)
    if (revenue.previous === 0) return 0
    return ((revenue.current - revenue.previous) / revenue.previous) * 100
  }

  private async getSystemHealthScore(): Promise<{ score: number, uptime: number }> {
    // Simular baseado em métricas reais do sistema
    const alertsCount = await supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .in('severity', ['critical', 'error'])

    const criticalAlerts = alertsCount.count || 0
    const healthScore = Math.max(0, 100 - (criticalAlerts * 10))
    const uptime = 99.5 + (Math.random() * 0.5) // 99.5-100%

    return { score: healthScore, uptime: Number(uptime.toFixed(2)) }
  }

  private async getSystemMetrics(): Promise<{
    cache_hit_rate: number
    db_connections: number
    memory_usage: number
    cpu_usage: number
  }> {
    // Buscar métricas reais do cache se disponível
    const cacheMetrics = await supabase
      .from('system_logs')
      .select('details')
      .eq('category', 'cache')
      .order('created_at', { ascending: false })
      .limit(100)

    const hitRates = cacheMetrics.data
      ?.map(log => log.details?.hit_rate)
      .filter(rate => rate !== undefined) || []

    const avgHitRate = hitRates.length > 0 ? 
      hitRates.reduce((acc, rate) => acc + rate, 0) / hitRates.length : 85

    return {
      cache_hit_rate: Number(avgHitRate.toFixed(1)),
      db_connections: 15 + Math.floor(Math.random() * 10), // Simulado
      memory_usage: 45 + Math.random() * 30, // Simulado: 45-75%
      cpu_usage: 25 + Math.random() * 40 // Simulado: 25-65%
    }
  }

  private async getBackupHealthScore(agencyId?: string): Promise<number> {
    const recentBackups = await supabase
      .from('backups')
      .select('status, created_at')
      .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const backups = recentBackups.data || []
    if (backups.length === 0) return 50

    const successfulBackups = backups.filter(b => b.status === 'completed').length
    const successRate = (successfulBackups / backups.length) * 100

    // Considerar também a idade do último backup
    const lastBackup = backups[0]
    const hoursAgo = (Date.now() - new Date(lastBackup.created_at).getTime()) / (1000 * 60 * 60)
    const timeScore = Math.max(0, 100 - hoursAgo * 2) // Reduz 2 pontos por hora

    return Math.round((successRate * 0.7) + (timeScore * 0.3))
  }

  private async getProjectsTrend(startDate: Date, agencyId?: string): Promise<TrendData[]> {
    const { data } = await supabase
      .from('projects')
      .select('created_at')
      .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
      .gte('created_at', startDate.toISOString())

    const projectsByDay = this.groupByDay(data || [], 'created_at')
    return this.generateTrendData(projectsByDay, startDate)
  }

  private async getRevenueTrend(startDate: Date, agencyId?: string): Promise<TrendData[]> {
    const { data } = await supabase
      .from('projects')
      .select('created_at, budget')
      .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
      .gte('created_at', startDate.toISOString())

    const revenueByDay = this.groupByDay(data || [], 'created_at', 'budget')
    return this.generateTrendData(revenueByDay, startDate)
  }

  private async getUsersTrend(startDate: Date, agencyId?: string): Promise<TrendData[]> {
    const { data } = await supabase
      .from('profiles')
      .select('last_sign_in_at')
      .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
      .gte('last_sign_in_at', startDate.toISOString())

    const usersByDay = this.groupByDay(data || [], 'last_sign_in_at')
    return this.generateTrendData(usersByDay, startDate)
  }

  private async getAlertsTrend(startDate: Date, agencyId?: string): Promise<TrendData[]> {
    const { data } = await supabase
      .from('alerts')
      .select('triggered_at')
      .apply(query => agencyId ? query.eq('agency_id', agencyId) : query)
      .gte('triggered_at', startDate.toISOString())

    const alertsByDay = this.groupByDay(data || [], 'triggered_at')
    return this.generateTrendData(alertsByDay, startDate)
  }

  private async getPerformanceTrend(startDate: Date, agencyId?: string): Promise<TrendData[]> {
    const { data } = await supabase
      .from('system_logs')
      .select('created_at, response_time')
      .eq('category', 'api')
      .gte('created_at', startDate.toISOString())

    const performanceByDay = this.groupByDay(data || [], 'created_at', 'response_time', 'average')
    return this.generateTrendData(performanceByDay, startDate)
  }

  private groupByDay(
    data: any[], 
    dateField: string, 
    valueField?: string, 
    aggregation: 'count' | 'sum' | 'average' = 'count'
  ): Record<string, number> {
    const grouped: Record<string, number[]> = {}

    data.forEach(item => {
      const date = new Date(item[dateField]).toISOString().split('T')[0]
      if (!grouped[date]) grouped[date] = []
      
      if (valueField && item[valueField] !== null) {
        grouped[date].push(item[valueField])
      } else {
        grouped[date].push(1)
      }
    })

    const result: Record<string, number> = {}
    Object.entries(grouped).forEach(([date, values]) => {
      switch (aggregation) {
        case 'sum':
          result[date] = values.reduce((acc, val) => acc + val, 0)
          break
        case 'average':
          result[date] = values.reduce((acc, val) => acc + val, 0) / values.length
          break
        default:
          result[date] = values.length
      }
    })

    return result
  }

  private generateTrendData(groupedData: Record<string, number>, startDate: Date): TrendData[] {
    const days = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const trend: TrendData[] = []

    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      trend.push({
        date: dateStr,
        value: groupedData[dateStr] || 0
      })
    }

    return trend
  }
}

export const executiveAnalytics = new ExecutiveAnalytics()