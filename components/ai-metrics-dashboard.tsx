'use client'

// ==================================================
// FVStudios Dashboard - AI Metrics & Performance Dashboard
// Dashboard de métricas e performance do sistema IA
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  Brain,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  CreditCard,
  Cpu,
  Database,
  Network,
  Target
} from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'

interface AIMetrics {
  overview: {
    total_requests: number
    total_tokens_consumed: number
    total_cost: number
    average_response_time: number
    success_rate: number
    active_users: number
    credits_used: number
    credits_remaining: number
  }
  usage_by_service: Array<{
    service: string
    requests: number
    tokens: number
    cost: number
    success_rate: number
    avg_response_time: number
  }>
  daily_usage: Array<{
    date: string
    requests: number
    tokens: number
    cost: number
    success_rate: number
  }>
  user_stats: Array<{
    user_id: string
    user_name: string
    requests: number
    tokens: number
    cost: number
    last_usage: string
  }>
  performance_metrics: {
    avg_response_time: number
    p95_response_time: number
    p99_response_time: number
    error_rate: number
    timeout_rate: number
    cache_hit_rate: number
  }
  cost_breakdown: Array<{
    category: string
    amount: number
    percentage: number
    color: string
  }>
  predictions: {
    monthly_cost_forecast: number
    credits_depletion_date: string
    usage_trend: 'increasing' | 'decreasing' | 'stable'
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const AI_SERVICES = [
  { value: 'content_generation', label: 'Geração de Conteúdo', icon: '📝' },
  { value: 'social_media_analysis', label: 'Análise Social Media', icon: '📊' },
  { value: 'campaign_optimization', label: 'Otimização de Campanhas', icon: '🎯' },
  { value: 'client_insights', label: 'Insights de Cliente', icon: '💡' },
  { value: 'automated_responses', label: 'Respostas Automáticas', icon: '🤖' },
  { value: 'image_generation', label: 'Geração de Imagens', icon: '🎨' },
  { value: 'text_analysis', label: 'Análise de Texto', icon: '🔍' },
  { value: 'translation', label: 'Tradução', icon: '🌐' }
]

export function AIMetricsDashboard() {
  const { user } = useUser()
  const [metrics, setMetrics] = useState<AIMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7') // dias
  const [selectedService, setSelectedService] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    loadMetrics()
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(loadMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [period, selectedService])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        period,
        ...(selectedService !== 'all' && { service: selectedService })
      })

      const response = await fetch(`/api/ai/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
        setLastUpdated(new Date())
      } else {
        toast.error('Erro ao carregar métricas de IA')
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      toast.error('Erro ao carregar métricas de IA')
    } finally {
      setLoading(false)
    }
  }

  const exportMetrics = async () => {
    try {
      const params = new URLSearchParams({
        period,
        format: 'csv',
        ...(selectedService !== 'all' && { service: selectedService })
      })

      const response = await fetch(`/api/ai/metrics/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ai-metrics-${period}d-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Métricas exportadas com sucesso!')
      } else {
        toast.error('Erro ao exportar métricas')
      }
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar métricas')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />
      default: return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Métricas de IA & Performance</h1>
            <p className="text-gray-600">
              Monitoramento completo do uso e performance dos sistemas de IA
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 dia</SelectItem>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Serviços</SelectItem>
              {AI_SERVICES.map(service => (
                <SelectItem key={service.value} value={service.value}>
                  {service.icon} {service.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button variant="outline" onClick={loadMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Última atualização: {lastUpdated.toLocaleString('pt-BR')}
        </div>
      )}

      {/* Overview Cards */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Requisições</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.overview.total_requests)}</p>
                    <p className="text-xs text-gray-500">
                      {metrics.overview.success_rate.toFixed(1)}% de sucesso
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tokens Consumidos</p>
                    <p className="text-2xl font-bold">{formatNumber(metrics.overview.total_tokens_consumed)}</p>
                    <p className="text-xs text-gray-500">
                      {(metrics.overview.total_tokens_consumed / metrics.overview.total_requests).toFixed(0)} por requisição
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Custo Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.overview.total_cost)}</p>
                    <p className="text-xs text-gray-500">
                      {getTrendIcon(metrics.predictions.usage_trend)}
                      <span className="ml-1">Tendência {metrics.predictions.usage_trend}</span>
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tempo de Resposta</p>
                    <p className="text-2xl font-bold">{metrics.overview.average_response_time.toFixed(0)}ms</p>
                    <p className="text-xs text-gray-500">
                      P95: {metrics.performance_metrics.p95_response_time.toFixed(0)}ms
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Usuários Ativos</p>
                    <p className="text-lg font-bold">{metrics.overview.active_users}</p>
                  </div>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Erro</p>
                    <p className="text-lg font-bold">{metrics.performance_metrics.error_rate.toFixed(2)}%</p>
                  </div>
                  <AlertTriangle className={`h-5 w-5 ${metrics.performance_metrics.error_rate > 5 ? 'text-red-500' : 'text-green-500'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cache Hit Rate</p>
                    <p className="text-lg font-bold">{metrics.performance_metrics.cache_hit_rate.toFixed(1)}%</p>
                  </div>
                  <Network className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Créditos Restantes</p>
                    <p className="text-lg font-bold">{formatNumber(metrics.overview.credits_remaining)}</p>
                  </div>
                  <CreditCard className="h-5 w-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">P99 Response</p>
                    <p className="text-lg font-bold">{metrics.performance_metrics.p99_response_time.toFixed(0)}ms</p>
                  </div>
                  <Cpu className="h-5 w-5 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Timeout Rate</p>
                    <p className="text-lg font-bold">{metrics.performance_metrics.timeout_rate.toFixed(2)}%</p>
                  </div>
                  <Clock className={`h-5 w-5 ${metrics.performance_metrics.timeout_rate > 2 ? 'text-red-500' : 'text-green-500'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="usage" className="space-y-6">
            <TabsList>
              <TabsTrigger value="usage">Uso & Performance</TabsTrigger>
              <TabsTrigger value="costs">Custos & Análises</TabsTrigger>
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Usage Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tendência de Uso Diário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={metrics.daily_usage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="requests" 
                          stackId="1"
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          name="Requisições"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tokens" 
                          stackId="2"
                          stroke="#82ca9d" 
                          fill="#82ca9d" 
                          name="Tokens (k)"
                          formatter={(value: number) => [Math.round(value / 1000), 'Tokens (k)']}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Success Rate Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Taxa de Sucesso & Custo Diário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics.daily_usage}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="success_rate" 
                          stroke="#00C49F" 
                          strokeWidth={2}
                          name="Taxa de Sucesso (%)"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="cost" 
                          stroke="#FF8042" 
                          strokeWidth={2}
                          name="Custo ($)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Custos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metrics.cost_breakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {metrics.cost_breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Predictions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Previsões & Alertas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Previsão de Custo Mensal</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(metrics.predictions.monthly_cost_forecast)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Baseado no uso atual
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Esgotamento de Créditos</span>
                      </div>
                      <p className="text-lg font-bold text-orange-600">
                        {metrics.predictions.credits_depletion_date}
                      </p>
                      <p className="text-sm text-gray-600">
                        Data estimada para reposição
                      </p>
                    </div>

                    <div className={`p-4 rounded-lg ${
                      metrics.predictions.usage_trend === 'increasing' ? 'bg-red-50' :
                      metrics.predictions.usage_trend === 'decreasing' ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getTrendIcon(metrics.predictions.usage_trend)}
                        <span className="font-medium">Tendência de Uso</span>
                      </div>
                      <p className="text-lg font-bold capitalize">
                        {metrics.predictions.usage_trend === 'increasing' ? 'Crescente' :
                         metrics.predictions.usage_trend === 'decreasing' ? 'Decrescente' : 'Estável'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance por Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={metrics.usage_by_service}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="service" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="requests" fill="#8884d8" name="Requisições" />
                      <Bar dataKey="tokens" fill="#82ca9d" name="Tokens" />
                      <Bar dataKey="cost" fill="#ffc658" name="Custo ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {metrics.usage_by_service.map((service, index) => {
                  const serviceInfo = AI_SERVICES.find(s => s.value === service.service)
                  return (
                    <Card key={service.service}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <span>{serviceInfo?.icon || '🤖'}</span>
                          {serviceInfo?.label || service.service}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Requisições</span>
                          <span className="font-medium">{formatNumber(service.requests)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tokens</span>
                          <span className="font-medium">{formatNumber(service.tokens)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Custo</span>
                          <span className="font-medium">{formatCurrency(service.cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                          <Badge variant={service.success_rate > 95 ? 'default' : service.success_rate > 90 ? 'secondary' : 'destructive'}>
                            {service.success_rate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tempo Médio</span>
                          <span className="font-medium">{service.avg_response_time.toFixed(0)}ms</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas por Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.user_stats.map((user, index) => (
                      <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                            {user.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.user_name}</p>
                            <p className="text-sm text-gray-500">
                              Último uso: {new Date(user.last_usage).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{formatNumber(user.requests)}</p>
                            <p className="text-gray-500">Requisições</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{formatNumber(user.tokens)}</p>
                            <p className="text-gray-500">Tokens</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{formatCurrency(user.cost)}</p>
                            <p className="text-gray-500">Custo</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}