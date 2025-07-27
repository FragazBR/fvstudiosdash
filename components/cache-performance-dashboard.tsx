'use client'

// ==================================================
// FVStudios Dashboard - Cache Performance Dashboard
// Dashboard de performance e monitoramento do cache Redis
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  RefreshCw,
  Trash2,
  Server,
  HardDrive,
  Network,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Settings,
  Eye,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'

interface CacheStats {
  hits: number
  misses: number
  hit_rate: number
  total_requests: number
  memory_usage: string
  keys_count: number
  response_time: number
  status: 'healthy' | 'warning' | 'error'
}

interface CacheMetrics {
  current_stats: CacheStats
  historical_data: Array<{
    timestamp: string
    hit_rate: number
    response_time: number
    memory_usage_mb: number
    keys_count: number
    requests_per_minute: number
  }>
  top_keys: Array<{
    key: string
    hits: number
    size_kb: number
    ttl: number
    last_access: string
  }>
  performance_insights: {
    bottlenecks: string[]
    recommendations: string[]
    efficiency_score: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function CachePerformanceDashboard() {
  const { user } = useUser()
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('24h')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showCleanupDialog, setShowCleanupDialog] = useState(false)
  const [cleanupLoading, setCleanupLoading] = useState(false)

  useEffect(() => {
    loadMetrics()
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [period])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/cache/metrics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
        setLastUpdated(new Date())
      } else {
        toast.error('Erro ao carregar métricas do cache')
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      toast.error('Erro ao carregar métricas do cache')
    } finally {
      setLoading(false)
    }
  }

  const handleCacheCleanup = async (type: 'expired' | 'all') => {
    try {
      setCleanupLoading(true)
      
      const response = await fetch('/api/cache/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Cache limpo: ${data.cleaned_count} chaves removidas`)
        setShowCleanupDialog(false)
        loadMetrics()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao limpar cache')
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
      toast.error('Erro ao limpar cache')
    } finally {
      setCleanupLoading(false)
    }
  }

  const invalidateCache = async (pattern?: string) => {
    try {
      const response = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({ pattern })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.invalidated_count} chaves invalidadas`)
        loadMetrics()
      } else {
        toast.error('Erro ao invalidar cache')
      }
    } catch (error) {
      console.error('Erro ao invalidar cache:', error)
      toast.error('Erro ao invalidar cache')
    }
  }

  const exportMetrics = async () => {
    try {
      const response = await fetch(`/api/cache/export?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cache-metrics-${period}-${new Date().toISOString().split('T')[0]}.csv`
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'error': return <XCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Performance do Cache Redis</h1>
            <p className="text-gray-600">
              Monitoramento e otimização do sistema de cache
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
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
          
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpeza
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Limpeza do Cache</DialogTitle>
                <DialogDescription>
                  Escolha o tipo de limpeza que deseja realizar
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Button
                  onClick={() => handleCacheCleanup('expired')}
                  disabled={cleanupLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Limpar apenas chaves expiradas
                </Button>
                
                <Button
                  onClick={() => handleCacheCleanup('all')}
                  disabled={cleanupLoading}
                  className="w-full justify-start"
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar todo o cache (cuidado!)
                </Button>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCleanupDialog(false)}>
                  Cancelar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
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

      {/* Status Cards */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hit Rate</p>
                    <p className="text-2xl font-bold">{metrics.current_stats.hit_rate}%</p>
                    <p className="text-xs text-gray-500">
                      {metrics.current_stats.hits.toLocaleString()} hits
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${getStatusColor(metrics.current_stats.status)}`}>
                    {getStatusIcon(metrics.current_stats.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tempo de Resposta</p>
                    <p className="text-2xl font-bold">{metrics.current_stats.response_time}ms</p>
                    <p className="text-xs text-gray-500">Média atual</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Uso de Memória</p>
                    <p className="text-2xl font-bold">{metrics.current_stats.memory_usage}</p>
                    <p className="text-xs text-gray-500">Redis</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Chaves Armazenadas</p>
                    <p className="text-2xl font-bold">{metrics.current_stats.keys_count.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total no cache</p>
                  </div>
                  <Database className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hit Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Hit Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.historical_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="hit_rate" 
                      stroke="#00C49F" 
                      strokeWidth={2}
                      name="Hit Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card>
              <CardHeader>
                <CardTitle>Tempo de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.historical_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="response_time" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="Tempo (ms)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Uso de Memória & Chaves</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.historical_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="memory_usage_mb" 
                      stackId="1"
                      stroke="#FF8042" 
                      fill="#FF8042" 
                      name="Memória (MB)"
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="keys_count" 
                      stackId="2"
                      stroke="#0088FE" 
                      fill="#0088FE" 
                      name="Chaves"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Requests per Minute */}
            <Card>
              <CardHeader>
                <CardTitle>Requisições por Minuto</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.historical_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="requests_per_minute" 
                      fill="#00C49F" 
                      name="Requisições/min"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Keys */}
          <Card>
            <CardHeader>
              <CardTitle>Chaves Mais Acessadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.top_keys.map((key, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium font-mono text-sm">{key.key}</p>
                        <p className="text-sm text-gray-500">
                          Último acesso: {new Date(key.last_access).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{key.hits.toLocaleString()}</p>
                        <p className="text-gray-500">Hits</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{formatBytes(key.size_kb * 1024)}</p>
                        <p className="text-gray-500">Tamanho</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{key.ttl > 0 ? `${Math.round(key.ttl/60)}min` : 'Sem TTL'}</p>
                        <p className="text-gray-500">TTL</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => invalidateCache(key.key)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Invalidar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Gargalos Identificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.performance_insights.bottlenecks.length > 0 ? (
                  <ul className="space-y-2">
                    {metrics.performance_insights.bottlenecks.map((bottleneck, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="text-sm">{bottleneck}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600">Nenhum gargalo detectado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Recomendações de Otimização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Score de Eficiência</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                          style={{ width: `${metrics.performance_insights.efficiency_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{metrics.performance_insights.efficiency_score}%</span>
                    </div>
                  </div>
                  
                  {metrics.performance_insights.recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {metrics.performance_insights.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-600">Sistema otimizado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}