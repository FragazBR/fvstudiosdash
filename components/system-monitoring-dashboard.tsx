'use client'

// ==================================================
// FVStudios Dashboard - System Monitoring Dashboard
// Dashboard completo de monitoramento e performance
// ==================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Server, 
  Cpu, 
  MemoryStick, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  Gauge,
  Shield,
  Bug,
  Users,
  Globe
} from 'lucide-react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart as RechartsBarChart, Bar, AreaChart, Area } from 'recharts'

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical'
  timestamp: string
  uptime_seconds: number
  response_time_ms: number
  system_metrics: {
    memory_usage_mb: number
    cpu_usage_percent: number
    active_connections: number
    cache_hit_rate_percent: number
    error_rate_percent: number
    avg_response_time_ms: number
  }
  components: Array<{
    name: string
    status: 'healthy' | 'degraded' | 'critical'
    response_time_ms: number
    details: Record<string, any>
  }>
  recent_activity: {
    total_logs_24h: number
    error_logs_24h: number
    performance_measurements_1h: number
  }
}

interface LogMetrics {
  time_range: string
  period: {
    start: string
    end: string
  }
  summary: {
    total_logs: number
    error_rate_percent: number
    unique_sessions: number
    avg_response_time_ms: number
  }
  log_levels: Record<string, number>
  categories: Record<string, number>
  performance: {
    avg_duration_ms: number
    max_duration_ms: number
    min_duration_ms: number
    total_requests_with_duration: number
  }
  trends: {
    hourly: Array<{
      hour: string
      level: string
      category: string
      log_count: number
      avg_duration_ms: number
    }>
  }
  top_errors: Array<{
    message: string
    count: number
  }>
  top_users?: Array<{
    user_id: string
    email: string
    name: string
    count: number
  }>
}

interface LogEntry {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  category: string
  message: string
  details: Record<string, any>
  duration_ms?: number
  created_at: string
  user?: {
    id: string
    email: string
    name: string
  }
}

const COLORS = ['#01b86c', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

export function SystemMonitoringDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [logMetrics, setLogMetrics] = useState<LogMetrics | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000) // Atualizar a cada 30s
      return () => clearInterval(interval)
    }
  }, [selectedTimeRange, autoRefresh])

  // Carregar logs quando filtros mudarem
  useEffect(() => {
    loadLogs()
  }, [selectedLogLevel, selectedCategory, searchQuery, currentPage])

  const loadData = async () => {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) return

      // Carregar saúde do sistema
      const healthResponse = await fetch('/api/system/health', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setSystemHealth(healthData.health)
      }

      // Carregar métricas de logs
      const metricsResponse = await fetch(`/api/logs/metrics?time_range=${selectedTimeRange}&include_details=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setLogMetrics(metricsData)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do sistema')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadLogs = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      if (!token) return

      const params = new URLSearchParams({
        limit: '50',
        offset: (currentPage * 50).toString()
      })

      if (selectedLogLevel) params.append('level', selectedLogLevel)
      if (selectedCategory) params.append('category', selectedCategory)  
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/logs/search?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'degraded': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'error': return 'bg-red-100 text-red-700'
      case 'warn': return 'bg-yellow-100 text-yellow-800'
      case 'info': return 'bg-blue-100 text-blue-800'
      case 'debug': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Preparar dados para gráficos
  const prepareChartData = () => {
    if (!logMetrics) return { hourlyData: [], levelData: [], categoryData: [] }

    // Dados por hora
    const hourlyData = logMetrics.trends.hourly.reduce((acc: any[], curr) => {
      const existingHour = acc.find(item => item.hour === curr.hour)
      if (existingHour) {
        existingHour[curr.level] = (existingHour[curr.level] || 0) + curr.log_count
        existingHour.total += curr.log_count
      } else {
        acc.push({
          hour: new Date(curr.hour).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          [curr.level]: curr.log_count,
          total: curr.log_count
        })
      }
      return acc
    }, [])

    // Dados por nível
    const levelData = Object.entries(logMetrics.log_levels).map(([level, count]) => ({
      name: level,
      value: count,
      color: level === 'critical' ? '#ef4444' : 
             level === 'error' ? '#f97316' :
             level === 'warn' ? '#f59e0b' :
             level === 'info' ? '#06b6d4' : '#6b7280'
    }))

    // Dados por categoria
    const categoryData = Object.entries(logMetrics.categories).map(([category, count]) => ({
      name: category,
      value: count
    }))

    return { hourlyData, levelData, categoryData }
  }

  const { hourlyData, levelData, categoryData } = prepareChartData()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando monitoramento do sistema...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento do Sistema</h2>
          <p className="text-muted-foreground">
            Acompanhe a saúde, performance e logs do sistema em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 hora</SelectItem>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Geral do Sistema */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status Geral do Sistema
              <Badge className={getStatusColor(systemHealth.status)}>
                {getStatusIcon(systemHealth.status)}
                <span className="ml-1 capitalize">{systemHealth.status}</span>
              </Badge>
            </CardTitle>
            <CardDescription>
              Última verificação: {new Date(systemHealth.timestamp).toLocaleString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatUptime(systemHealth.uptime_seconds)}</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.system_metrics.avg_response_time_ms}ms</div>
                <div className="text-sm text-muted-foreground">Tempo de Resposta</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.system_metrics.cache_hit_rate_percent}%</div>
                <div className="text-sm text-muted-foreground">Taxa de Cache</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{systemHealth.system_metrics.error_rate_percent}%</div>
                <div className="text-sm text-muted-foreground">Taxa de Erro</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas de Sistema */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.system_metrics.cpu_usage_percent}%</div>
              <Progress value={systemHealth.system_metrics.cpu_usage_percent} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memória</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(systemHealth.system_metrics.memory_usage_mb * 1024 * 1024)}</div>
              <Progress value={(systemHealth.system_metrics.memory_usage_mb / 2048) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conexões</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemHealth.system_metrics.active_connections}</div>
              <p className="text-xs text-muted-foreground">conexões ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Componentes</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemHealth.components.filter(c => c.status === 'healthy').length}/{systemHealth.components.length}
              </div>
              <p className="text-xs text-muted-foreground">saudáveis</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {logMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de logs por hora */}
              <Card>
                <CardHeader>
                  <CardTitle>Logs por Hora</CardTitle>
                  <CardDescription>Volume de logs ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="total" stroke="#01b86c" fill="#01b86c" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="error" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="warn" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribuição por nível */}
              <Card>
                <CardHeader>
                  <CardTitle>Logs por Nível</CardTitle>
                  <CardDescription>Distribuição por severidade</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={levelData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {levelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top erros */}
              <Card>
                <CardHeader>
                  <CardTitle>Principais Erros</CardTitle>
                  <CardDescription>Erros mais frequentes no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {logMetrics.top_errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <div className="flex-1 text-sm truncate">{error.message}</div>
                        <Badge variant="destructive">{error.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                  <CardDescription>Métricas de resposta e duração</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tempo Médio</span>
                      <span className="font-medium">{logMetrics.performance.avg_duration_ms}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tempo Máximo</span>
                      <span className="font-medium">{logMetrics.performance.max_duration_ms}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tempo Mínimo</span>
                      <span className="font-medium">{logMetrics.performance.min_duration_ms}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Requisições com Duração</span>
                      <span className="font-medium">{logMetrics.performance.total_requests_with_duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          {systemHealth && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemHealth.components.map((component, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        {component.name}
                      </span>
                      <Badge className={getStatusColor(component.status)}>
                        {getStatusIcon(component.status)}
                        <span className="ml-1 capitalize">{component.status}</span>
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tempo de Resposta</span>
                        <span className="font-medium">{component.response_time_ms}ms</span>
                      </div>
                      {Object.entries(component.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium">
                            {typeof value === 'number' ? value.toFixed(2) : value?.toString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {/* Filtros de logs */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="level">Nível</Label>
                  <Select value={selectedLogLevel} onValueChange={setSelectedLogLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os níveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="auth">Auth</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="security">Segurança</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar nos logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de logs */}
          <Card>
            <CardHeader>
              <CardTitle>Logs Recentes</CardTitle>
              <CardDescription>
                {logs.length} logs encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getLevelColor(log.level)}>
                            {log.level}
                          </Badge>
                          <Badge variant="outline">{log.category}</Badge>
                          {log.duration_ms && (
                            <Badge variant="outline">{log.duration_ms}ms</Badge>
                          )}
                        </div>
                        
                        <div className="font-medium mb-1">{log.message}</div>
                        
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                          {log.user && (
                            <span className="ml-2">• {log.user.name || log.user.email}</span>
                          )}
                        </div>
                        
                        {Object.keys(log.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-blue-600">
                              Ver detalhes
                            </summary>
                            <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {logs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado com os filtros selecionados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {logMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logs por categoria */}
              <Card>
                <CardHeader>
                  <CardTitle>Logs por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#01b86c" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Resumo numérico */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Período</CardTitle>
                  <CardDescription>{logMetrics.time_range}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{logMetrics.summary.total_logs.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total de Logs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{logMetrics.summary.unique_sessions}</div>
                      <div className="text-sm text-muted-foreground">Sessões Únicas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{logMetrics.summary.error_rate_percent}%</div>
                      <div className="text-sm text-muted-foreground">Taxa de Erro</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{logMetrics.summary.avg_response_time_ms}ms</div>
                      <div className="text-sm text-muted-foreground">Tempo Médio</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top usuários ativos (se disponível) */}
              {logMetrics.top_users && (
                <Card>
                  <CardHeader>
                    <CardTitle>Usuários Mais Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {logMetrics.top_users.slice(0, 5).map((user, index) => (
                        <div key={user.user_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{user.name || user.email}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                          <Badge>{user.count} logs</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}