'use client'

// ==================================================
// FVStudios Dashboard - Sistema de Analytics Inteligente
// Dashboard avançado com insights de IA e análise preditiva
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Users,
  DollarSign,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Lightbulb,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PredictiveAnalysisEngine, AIRecommendationEngine } from '@/lib/intelligent-system'

// Interfaces
interface AnalyticsMetric {
  id: string
  name: string
  value: number
  previous_value: number
  change_percentage: number
  trend: 'up' | 'down' | 'stable'
  format: 'number' | 'currency' | 'percentage' | 'time'
  icon: React.ReactNode
  color: string
}

interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'trend' | 'optimization'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  action_required: boolean
  estimated_value?: number
  timeframe: string
}

interface CampaignPerformance {
  campaign_id: string
  campaign_name: string
  platform: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpm: number
  cpc: number
  roas: number
  status: 'active' | 'paused' | 'completed'
}

// ==================================================
// COMPONENTES
// ==================================================

// Métricas Principais
function KeyMetricsGrid({ metrics }: { metrics: AnalyticsMetric[] }) {
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'time':
        return `${value}h`
      default:
        return new Intl.NumberFormat('pt-BR').format(value)
    }
  }

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-500" />
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map(metric => (
        <Card key={metric.id} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${metric.color}`}>
                  {metric.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{metric.name}</p>
                  <p className="text-2xl font-bold">
                    {formatValue(metric.value, metric.format)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend, metric.change_percentage)}
                  <span className={`text-sm font-medium ${
                    metric.change_percentage > 0 ? 'text-green-500' : 
                    metric.change_percentage < 0 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {Math.abs(metric.change_percentage).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">vs. período anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Insights de IA
function AIInsightsPanel({ insights }: { insights: AIInsight[] }) {
  const getInsightIcon = (type: string) => {
    const icons = {
      opportunity: <Lightbulb className="h-5 w-5 text-yellow-500" />,
      warning: <AlertTriangle className="h-5 w-5 text-red-500" />,
      trend: <TrendingUp className="h-5 w-5 text-blue-500" />,
      optimization: <Zap className="h-5 w-5 text-purple-500" />
    }
    return icons[type as keyof typeof icons]
  }

  const getImpactColor = (impact: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    }
    return colors[impact as keyof typeof colors]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Insights de IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map(insight => (
            <div key={insight.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <h4 className="font-medium">{insight.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getImpactColor(insight.impact)}>
                    {insight.impact}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Brain className="h-3 w-3" />
                    {insight.confidence}%
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>⏱️ {insight.timeframe}</span>
                  {insight.estimated_value && (
                    <span>💰 {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(insight.estimated_value)}</span>
                  )}
                </div>
                
                {insight.action_required && (
                  <Button size="sm" variant="outline">
                    <Zap className="h-3 w-3 mr-1" />
                    Aplicar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Performance de Campanhas
function CampaignPerformanceTable({ campaigns }: { campaigns: CampaignPerformance[] }) {
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors]
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      'Facebook': '📘',
      'Instagram': '📷',
      'Google': '🔍',
      'LinkedIn': '💼',
      'TikTok': '🎵'
    }
    return icons[platform as keyof typeof icons] || '📊'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Performance de Campanhas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Campanha</th>
                <th className="text-right py-2">Investimento</th>
                <th className="text-right py-2">Impressões</th>
                <th className="text-right py-2">Cliques</th>
                <th className="text-right py-2">CTR</th>
                <th className="text-right py-2">CPC</th>
                <th className="text-right py-2">ROAS</th>
                <th className="text-center py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => (
                <tr key={campaign.campaign_id} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPlatformIcon(campaign.platform)}</span>
                      <div>
                        <p className="font-medium text-sm">{campaign.campaign_name}</p>
                        <p className="text-xs text-gray-500">{campaign.platform}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(campaign.spend)}
                  </td>
                  <td className="text-right py-3">
                    {new Intl.NumberFormat('pt-BR').format(campaign.impressions)}
                  </td>
                  <td className="text-right py-3">
                    {new Intl.NumberFormat('pt-BR').format(campaign.clicks)}
                  </td>
                  <td className="text-right py-3">{campaign.ctr.toFixed(2)}%</td>
                  <td className="text-right py-3">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(campaign.cpc)}
                  </td>
                  <td className="text-right py-3">
                    <span className={campaign.roas >= 4 ? 'text-green-600 font-medium' : 
                                   campaign.roas >= 2 ? 'text-yellow-600' : 'text-red-600'}>
                      {campaign.roas.toFixed(2)}x
                    </span>
                  </td>
                  <td className="text-center py-3">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Gráficos de Performance
function PerformanceCharts() {
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  
  // Dados mockados para os gráficos
  const timeSeriesData = [
    { date: '01/01', revenue: 12500, leads: 45, conversions: 23, roas: 3.2 },
    { date: '02/01', revenue: 15200, leads: 52, conversions: 28, roas: 3.8 },
    { date: '03/01', revenue: 18900, leads: 61, conversions: 35, roas: 4.1 },
    { date: '04/01', revenue: 16800, leads: 48, conversions: 31, roas: 3.5 },
    { date: '05/01', revenue: 22100, leads: 67, conversions: 42, roas: 4.7 },
    { date: '06/01', revenue: 25600, leads: 73, conversions: 48, roas: 5.2 },
    { date: '07/01', revenue: 28200, leads: 81, conversions: 52, roas: 5.8 }
  ]

  const platformData = [
    { name: 'Facebook', value: 35, color: '#1877F2' },
    { name: 'Instagram', value: 28, color: '#E4405F' },
    { name: 'Google', value: 22, color: '#4285F4' },
    { name: 'LinkedIn', value: 10, color: '#0A66C2' },
    { name: 'TikTok', value: 5, color: '#000000' }
  ]

  const deviceData = [
    { device: 'Mobile', sessions: 1240, conversions: 89, revenue: 15600 },
    { device: 'Desktop', sessions: 890, conversions: 67, revenue: 12800 },
    { device: 'Tablet', sessions: 340, conversions: 24, revenue: 4200 }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Linha - Performance ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Performance ao Longo do Tempo
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('revenue')}
              >
                Receita
              </Button>
              <Button
                size="sm"
                variant={selectedMetric === 'roas' ? 'default' : 'outline'}
                onClick={() => setSelectedMetric('roas')}
              >
                ROAS
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue') return [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)),
                    'Receita'
                  ]
                  if (name === 'roas') return [`${Number(value).toFixed(1)}x`, 'ROAS']
                  return [value, name]
                }}
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke="#01b86c"
                fill="#01b86c"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Distribuição por Plataforma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Distribuição por Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Performance por Dispositivo */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance por Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deviceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="device" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'revenue') return [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)),
                    'Receita'
                  ]
                  return [new Intl.NumberFormat('pt-BR').format(Number(value)), name === 'sessions' ? 'Sessões' : 'Conversões']
                }}
              />
              <Legend />
              <Bar dataKey="sessions" fill="#8884d8" name="sessions" />
              <Bar dataKey="conversions" fill="#82ca9d" name="conversions" />
              <Bar dataKey="revenue" fill="#ffc658" name="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function IntelligentAnalytics() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [campaigns, setCampaigns] = useState<CampaignPerformance[]>([])
  const [selectedDateRange, setSelectedDateRange] = useState('7d')

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedDateRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Métricas principais
      const mockMetrics: AnalyticsMetric[] = [
        {
          id: 'revenue',
          name: 'Receita Total',
          value: 142850,
          previous_value: 128400,
          change_percentage: 11.3,
          trend: 'up',
          format: 'currency',
          icon: <DollarSign className="h-4 w-4 text-white" />,
          color: 'bg-green-500'
        },
        {
          id: 'conversions',
          name: 'Conversões',
          value: 287,
          previous_value: 245,
          change_percentage: 17.1,
          trend: 'up',
          format: 'number',
          icon: <Target className="h-4 w-4 text-white" />,
          color: 'bg-blue-500'
        },
        {
          id: 'roas',
          name: 'ROAS Médio',
          value: 4.8,
          previous_value: 4.2,
          change_percentage: 14.3,
          trend: 'up',
          format: 'number',
          icon: <TrendingUp className="h-4 w-4 text-white" />,
          color: 'bg-purple-500'
        },
        {
          id: 'active_campaigns',
          name: 'Campanhas Ativas',
          value: 12,
          previous_value: 15,
          change_percentage: -20.0,
          trend: 'down',
          format: 'number',
          icon: <Activity className="h-4 w-4 text-white" />,
          color: 'bg-orange-500'
        }
      ]

      // Insights de IA
      const mockInsights: AIInsight[] = [
        {
          id: '1',
          type: 'opportunity',
          title: 'Oportunidade: Aumentar orçamento do Instagram',
          description: 'A campanha do Instagram está gerando ROAS de 6.2x, 45% acima da média. Recomendo aumentar o orçamento em 30% para maximizar retorno.',
          confidence: 87,
          impact: 'high',
          action_required: true,
          estimated_value: 15600,
          timeframe: '7 dias'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Alerta: Queda no CTR do Google Ads',
          description: 'O CTR das campanhas do Google caiu 23% nos últimos 3 dias. Pode indicar fadiga criativa ou mudanças na concorrência.',
          confidence: 92,
          impact: 'medium',
          action_required: true,
          timeframe: '3 dias'
        },
        {
          id: '3',
          type: 'optimization',
          title: 'Otimização: Realocação de orçamento por horário',
          description: 'Análise indica que 68% das conversões acontecem entre 18h-22h. Realoque orçamento para estes horários.',
          confidence: 79,
          impact: 'medium',
          action_required: false,
          estimated_value: 8900,
          timeframe: '14 dias'
        }
      ]

      // Performance de campanhas
      const mockCampaigns: CampaignPerformance[] = [
        {
          campaign_id: '1',
          campaign_name: 'Black Friday - Produtos Premium',
          platform: 'Facebook',
          spend: 8500,
          impressions: 245000,
          clicks: 3420,
          conversions: 89,
          ctr: 1.4,
          cpm: 34.7,
          cpc: 2.48,
          roas: 5.2,
          status: 'active'
        },
        {
          campaign_id: '2',
          campaign_name: 'Remarketing - Carrinho Abandonado',
          platform: 'Instagram',
          spend: 3200,
          impressions: 89000,
          clicks: 1240,
          conversions: 56,
          ctr: 1.39,
          cpm: 35.9,
          cpc: 2.58,
          roas: 6.8,
          status: 'active'
        },
        {
          campaign_id: '3',
          campaign_name: 'Palavras-chave Brand',
          platform: 'Google',
          spend: 5600,
          impressions: 156000,
          clicks: 2890,
          conversions: 72,
          ctr: 1.85,
          cpm: 35.9,
          cpc: 1.94,
          roas: 3.9,
          status: 'active'
        }
      ]

      setMetrics(mockMetrics)
      setInsights(mockInsights)
      setCampaigns(mockCampaigns)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalyticsData()
    setRefreshing(false)
    toast.success('Dados atualizados!')
  }

  const dateRanges = [
    { value: '1d', label: 'Hoje' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Analytics Inteligente</h1>
            <p className="text-gray-600">Insights avançados com inteligência artificial</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border p-1">
            {dateRanges.map(range => (
              <Button
                key={range.value}
                size="sm"
                variant={selectedDateRange === range.value ? 'default' : 'ghost'}
                onClick={() => setSelectedDateRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <KeyMetricsGrid metrics={metrics} />

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PerformanceCharts />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignPerformanceTable campaigns={campaigns} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AIInsightsPanel insights={insights} />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Análise Preditiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Previsões Avançadas em Desenvolvimento</h3>
                <p className="text-gray-600 mb-4">
                  Nossa IA está analisando padrões históricos para gerar previsões precisas de performance.
                </p>
                <Button>
                  <Zap className="h-4 w-4 mr-2" />
                  Ativar Análise Preditiva
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}