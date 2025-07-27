'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  Shield,
  Server,
  Database,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Globe,
  Building
} from 'lucide-react'
import { ExecutiveMetrics, TrendData, AlertSummary } from '@/lib/executive-analytics'

interface ExecutiveDashboardProps {
  agencyId?: string
}

interface APIResponse {
  success: boolean
  metrics: ExecutiveMetrics
  scope: 'agency' | 'global'
  agency_id?: string
  generated_at: string
}

interface TrendAPIResponse {
  success: boolean
  metric: string
  days: number
  scope: 'agency' | 'global'
  data: TrendData[]
  statistics: {
    total: number
    average: number
    max: number
    min: number
    growth_percent: number
  }
  generated_at: string
}

interface AlertsAPIResponse {
  success: boolean
  critical_alerts: AlertSummary[]
  summary: Record<string, Record<string, number>>
  statistics: {
    total: number
    critical: number
    error: number
    warning: number
    info: number
  }
  trend: TrendData[]
  scope: 'agency' | 'global'
  generated_at: string
}

export default function ExecutiveDashboard({ agencyId }: ExecutiveDashboardProps) {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null)
  const [trends, setTrends] = useState<Record<string, TrendData[]>>({})
  const [alerts, setAlerts] = useState<AlertsAPIResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState<'agency' | 'global'>('agency')
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    if (refreshing) return
    setRefreshing(true)

    try {
      const token = localStorage.getItem('supabase-token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Carregar métricas principais
      const metricsResponse = await fetch(`/api/executive/metrics?scope=${scope}`, { headers })
      if (metricsResponse.ok) {
        const data: APIResponse = await metricsResponse.json()
        setMetrics(data.metrics)
      }

      // Carregar tendências
      const trendMetrics = ['projects', 'revenue', 'users', 'performance']
      const trendPromises = trendMetrics.map(async (metric) => {
        const response = await fetch(`/api/executive/trends?metric=${metric}&days=30&scope=${scope}`, { headers })
        if (response.ok) {
          const data: TrendAPIResponse = await response.json()
          return { metric, data: data.data }
        }
        return { metric, data: [] }
      })

      const trendResults = await Promise.all(trendPromises)
      const trendsData: Record<string, TrendData[]> = {}
      trendResults.forEach(({ metric, data }) => {
        trendsData[metric] = data
      })
      setTrends(trendsData)

      // Carregar alertas críticos
      const alertsResponse = await fetch(`/api/executive/alerts?scope=${scope}`, { headers })
      if (alertsResponse.ok) {
        const data: AlertsAPIResponse = await alertsResponse.json()
        setAlerts(data)
      }

    } catch (error) {
      console.error('Erro ao carregar dados executivos:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [scope])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      default: return 'outline'
    }
  }

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando analytics executivo...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Executivo</h1>
          <p className="text-muted-foreground">
            Visão geral dos indicadores-chave de performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScope(scope === 'agency' ? 'global' : 'agency')}
          >
            {scope === 'agency' ? <Building className="h-4 w-4 mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
            {scope === 'agency' ? 'Agência' : 'Global'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.overview.revenue_this_month)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {metrics.overview.revenue_growth_percent >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  {Math.abs(metrics.overview.revenue_growth_percent).toFixed(1)}% vs mês anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.overview.total_projects}</div>
                <p className="text-xs text-muted-foreground">
                  +{metrics.overview.projects_this_month} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.overview.active_users}</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saúde do Sistema</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(metrics.overview.system_health_score)}`}>
                  {metrics.overview.system_health_score}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {metrics.overview.uptime_percent}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance & Business Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance do Sistema</CardTitle>
                <CardDescription>Métricas técnicas em tempo real</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tempo de Resposta</span>
                    <span className="font-medium">{metrics.performance.avg_response_time}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Erro</span>
                    <span className="font-medium">{metrics.performance.error_rate_percent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="font-medium">{metrics.performance.cache_hit_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uso de Memória</span>
                    <span className="font-medium">{metrics.performance.memory_usage_percent.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uso de CPU</span>
                    <span className="font-medium">{metrics.performance.cpu_usage_percent.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Requisições Hoje</span>
                    <span className="font-medium">{formatNumber(metrics.performance.api_requests_today)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Negócio</CardTitle>
                <CardDescription>Indicadores comerciais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Novos Clientes</span>
                    <span className="font-medium">{metrics.business.new_clients_this_month}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Churn</span>
                    <span className="font-medium">{metrics.business.churn_rate_percent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Satisfação</span>
                    <span className="font-medium">{metrics.business.customer_satisfaction}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valor Médio</span>
                    <span className="font-medium">{formatCurrency(metrics.business.avg_project_value)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa Conversão</span>
                    <span className="font-medium">{metrics.business.conversion_rate_percent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">MRR</span>
                    <span className="font-medium">{formatCurrency(metrics.business.monthly_recurring_revenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Tendências (30 dias)</CardTitle>
              <CardDescription>Evolução dos principais indicadores</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="projects" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="projects">Projetos</TabsTrigger>
                  <TabsTrigger value="revenue">Receita</TabsTrigger>
                  <TabsTrigger value="users">Usuários</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                {Object.entries(trends).map(([metric, data]) => (
                  <TabsContent key={metric} value={metric}>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                            formatter={(value: number) => {
                              switch (metric) {
                                case 'revenue':
                                  return [formatCurrency(value), 'Receita']
                                case 'performance':
                                  return [`${value}ms`, 'Tempo de Resposta']
                                default:
                                  return [formatNumber(value), metric.charAt(0).toUpperCase() + metric.slice(1)]
                              }
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={chartColors[0]} 
                            fill={chartColors[0]} 
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Security & Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Segurança & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Alertas Ativos</span>
                  <Badge variant={metrics.security.active_alerts > 0 ? 'destructive' : 'outline'}>
                    {metrics.security.active_alerts}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Alertas Críticos</span>
                  <Badge variant={metrics.security.critical_alerts > 0 ? 'destructive' : 'outline'}>
                    {metrics.security.critical_alerts}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Score de Compliance</span>
                  <span className={`font-medium ${getHealthColor(metrics.security.compliance_score)}`}>
                    {metrics.security.compliance_score}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Saúde dos Backups</span>
                  <span className={`font-medium ${getHealthColor(metrics.security.backup_health_score)}`}>
                    {metrics.security.backup_health_score}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Login Falhados (24h)</span>
                  <span className="font-medium">{metrics.security.failed_login_attempts}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  Operações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total de Backups</span>
                  <span className="font-medium">{metrics.operations.total_backups}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Backups Bem-sucedidos</span>
                  <span className="font-medium">{metrics.operations.successful_backups_percent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Último Backup</span>
                  <span className="font-medium">{metrics.operations.last_backup_hours_ago}h atrás</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uso de Storage</span>
                  <span className="font-medium">{metrics.operations.storage_usage_gb} GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Integrações Ativas</span>
                  <span className="font-medium">{metrics.operations.active_integrations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>WhatsApp Enviados</span>
                  <span className="font-medium">{formatNumber(metrics.operations.whatsapp_messages_sent)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts */}
          {alerts && alerts.critical_alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Alertas Críticos Ativos
                </CardTitle>
                <CardDescription>
                  Alertas que requerem atenção imediata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.critical_alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.type} • {new Date(alert.triggered_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {alert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}