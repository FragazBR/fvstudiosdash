'use client'

// ==================================================
// FVStudios Dashboard - Análise Preditiva Avançada
// Sistema de previsões inteligentes com machine learning
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
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
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Calendar,
  Zap,
  Eye,
  Settings,
  RefreshCw,
  Download,
  Share2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Gem,
  Lightbulb,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PredictiveAnalysisEngine } from '@/lib/intelligent-system'

// Interfaces
interface PredictionModel {
  id: string
  name: string
  description: string
  type: 'revenue' | 'conversions' | 'traffic' | 'cost' | 'performance' | 'resource'
  status: 'active' | 'training' | 'paused'
  accuracy: number
  last_updated: Date
  prediction_horizon: string
  confidence_level: number
}

interface Prediction {
  id: string
  model_id: string
  subject: string
  prediction_type: string
  current_value: number
  predicted_value: number
  confidence: number
  date_range: {
    start: Date
    end: Date
  }
  trend: 'up' | 'down' | 'stable'
  change_percentage: number
  factors: string[]
  recommendations: string[]
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  created_at: Date
}

interface TrendData {
  date: string
  actual?: number
  predicted: number
  confidence_upper: number
  confidence_lower: number
}

interface ScenarioAnalysis {
  id: string
  name: string
  description: string
  scenario_type: 'optimistic' | 'realistic' | 'pessimistic'
  parameters: { [key: string]: number }
  predicted_outcome: {
    revenue_change: number
    conversion_change: number
    cost_change: number
    timeline: string
  }
  probability: number
}

// ==================================================
// COMPONENTES
// ==================================================

// Modelos de Predição
function PredictionModels({ models, onToggleModel }: {
  models: PredictionModel[]
  onToggleModel: (modelId: string, active: boolean) => void
}) {
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      training: 'bg-yellow-100 text-yellow-800',
      paused: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors]
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      active: <Play className="h-3 w-3" />,
      training: <RefreshCw className="h-3 w-3 animate-spin" />,
      paused: <Pause className="h-3 w-3" />
    }
    return icons[status as keyof typeof icons]
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      revenue: <DollarSign className="h-4 w-4" />,
      conversions: <Target className="h-4 w-4" />,
      traffic: <Users className="h-4 w-4" />,
      cost: <TrendingDown className="h-4 w-4" />,
      performance: <BarChart3 className="h-4 w-4" />,
      resource: <Activity className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || <Brain className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Modelos de IA Ativo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map(model => (
            <div 
              key={model.id}
              className="p-4 border rounded-lg hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {getTypeIcon(model.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{model.name}</h4>
                    <p className="text-xs text-gray-500">{model.type}</p>
                  </div>
                </div>
                
                <Badge className={getStatusColor(model.status)}>
                  {getStatusIcon(model.status)}
                  <span className="ml-1 capitalize">{model.status}</span>
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {model.description}
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span>Precisão:</span>
                  <span className="font-medium">{model.accuracy}%</span>
                </div>
                <Progress value={model.accuracy} className="h-2" />
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Horizonte: {model.prediction_horizon}</span>
                  <span>Confiança: {model.confidence_level}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={model.status === 'active' ? 'outline' : 'default'}
                  onClick={() => onToggleModel(model.id, model.status !== 'active')}
                  disabled={model.status === 'training'}
                  className="flex-1"
                >
                  {model.status === 'active' ? 'Pausar' : 'Ativar'}
                </Button>
                
                <Button size="sm" variant="ghost">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Gráfico de Tendências Preditivas
function PredictiveTrendChart({ data, title, type }: {
  data: TrendData[]
  title: string
  type: 'revenue' | 'conversions' | 'traffic'
}) {
  const formatValue = (value: number) => {
    switch (type) {
      case 'revenue':
        return `R$ ${value.toLocaleString()}`
      case 'conversions':
        return value.toString()
      case 'traffic':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Gem className="h-5 w-5" />
            {title}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Precisão: 94%
            </Badge>
            <Button size="sm" variant="ghost">
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatValue} />
            <Tooltip 
              formatter={(value, name) => [formatValue(Number(value)), name]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend />
            
            {/* Área de confiança */}
            <Area
              type="monotone"
              dataKey="confidence_upper"
              stackId="confidence"
              stroke="none"
              fill="#3b82f6"
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="confidence_lower"
              stackId="confidence"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
            />
            
            {/* Linha de valores reais */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="Valores Reais"
            />
            
            {/* Linha de predição */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Predição IA"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Previsões Detalhadas
function DetailedPredictions({ predictions, onViewDetails }: {
  predictions: Prediction[]
  onViewDetails: (predictionId: string) => void
}) {
  const getTrendIcon = (trend: string, changePercentage: number) => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-green-500" />
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getRiskColor = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return colors[risk as keyof typeof colors]
  }

  const formatValue = (value: number, type: string) => {
    if (type.includes('revenue') || type.includes('cost')) {
      return `R$ ${value.toLocaleString()}`
    }
    return value.toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Previsões Detalhadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map(prediction => (
            <div 
              key={prediction.id}
              className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => onViewDetails(prediction.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(prediction.trend, prediction.change_percentage)}
                    <h4 className="font-medium">{prediction.subject}</h4>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {prediction.prediction_type}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getRiskColor(prediction.risk_level)}>
                    {prediction.risk_level === 'low' ? 'Baixo' :
                     prediction.risk_level === 'medium' ? 'Médio' :
                     prediction.risk_level === 'high' ? 'Alto' : 'Crítico'}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Brain className="h-3 w-3" />
                    {(prediction.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-600">Valor Atual</div>
                  <div className="text-lg font-semibold">
                    {formatValue(prediction.current_value, prediction.prediction_type)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Predição</div>
                  <div className="text-lg font-semibold">
                    {formatValue(prediction.predicted_value, prediction.prediction_type)}
                    <span className={`ml-2 text-sm ${
                      prediction.change_percentage > 0 ? 'text-green-600' : 
                      prediction.change_percentage < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      ({prediction.change_percentage > 0 ? '+' : ''}{prediction.change_percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Principais Fatores:</div>
                <div className="flex flex-wrap gap-1">
                  {prediction.factors.slice(0, 3).map(factor => (
                    <Badge key={factor} variant="secondary" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                  {prediction.factors.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{prediction.factors.length - 3} mais
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Período: {new Date(prediction.date_range.start).toLocaleDateString()} - {new Date(prediction.date_range.end).toLocaleDateString()}
                </span>
                <Button size="sm" variant="ghost">
                  <Eye className="h-3 w-3 mr-1" />
                  Ver Detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Análise de Cenários
function ScenarioAnalysis({ scenarios }: { scenarios: ScenarioAnalysis[] }) {
  const getScenarioColor = (type: string) => {
    const colors = {
      optimistic: 'border-green-200 bg-green-50',
      realistic: 'border-blue-200 bg-blue-50',
      pessimistic: 'border-red-200 bg-red-50'
    }
    return colors[type as keyof typeof colors]
  }

  const getScenarioIcon = (type: string) => {
    const icons = {
      optimistic: <TrendingUp className="h-4 w-4 text-green-600" />,
      realistic: <Activity className="h-4 w-4 text-blue-600" />,
      pessimistic: <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return icons[type as keyof typeof icons]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Análise de Cenários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map(scenario => (
            <div 
              key={scenario.id}
              className={`p-4 border-2 rounded-lg ${getScenarioColor(scenario.scenario_type)}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {getScenarioIcon(scenario.scenario_type)}
                <h4 className="font-semibold capitalize">{scenario.scenario_type}</h4>
                <Badge variant="outline" className="text-xs ml-auto">
                  {scenario.probability}% prob.
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {scenario.description}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Receita:</span>
                  <span className={`font-medium ${
                    scenario.predicted_outcome.revenue_change > 0 ? 'text-green-600' : 
                    scenario.predicted_outcome.revenue_change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {scenario.predicted_outcome.revenue_change > 0 ? '+' : ''}
                    {scenario.predicted_outcome.revenue_change.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Conversões:</span>
                  <span className={`font-medium ${
                    scenario.predicted_outcome.conversion_change > 0 ? 'text-green-600' : 
                    scenario.predicted_outcome.conversion_change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {scenario.predicted_outcome.conversion_change > 0 ? '+' : ''}
                    {scenario.predicted_outcome.conversion_change.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Custos:</span>
                  <span className={`font-medium ${
                    scenario.predicted_outcome.cost_change > 0 ? 'text-red-600' : 
                    scenario.predicted_outcome.cost_change < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {scenario.predicted_outcome.cost_change > 0 ? '+' : ''}
                    {scenario.predicted_outcome.cost_change.toFixed(1)}%
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 mb-1">Timeline:</div>
                  <div className="text-sm font-medium">{scenario.predicted_outcome.timeline}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function PredictiveAnalyticsAdvanced() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [models, setModels] = useState<PredictionModel[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [scenarios, setScenarios] = useState<ScenarioAnalysis[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPredictiveData()
  }, [])

  const loadPredictiveData = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock data
      const mockModels: PredictionModel[] = [
        {
          id: '1',
          name: 'Predição de Receita',
          description: 'Prevê receita mensal baseada em campanhas ativas e histórico',
          type: 'revenue',
          status: 'active',
          accuracy: 94,
          last_updated: new Date(),
          prediction_horizon: '30 dias',
          confidence_level: 92
        },
        {
          id: '2',
          name: 'Previsão de Conversões',
          description: 'Modelo que prevê número de conversões por campanha',
          type: 'conversions',
          status: 'active',
          accuracy: 89,
          last_updated: new Date(),
          prediction_horizon: '14 dias',
          confidence_level: 87
        },
        {
          id: '3',
          name: 'Análise de Tráfego',
          description: 'Prevê variações no tráfego orgânico e pago',
          type: 'traffic',
          status: 'training',
          accuracy: 76,
          last_updated: new Date(),
          prediction_horizon: '7 dias',
          confidence_level: 78
        },
        {
          id: '4',
          name: 'Otimização de Custos',
          description: 'Prevê oportunidades de redução de custos em campanhas',
          type: 'cost',
          status: 'active',
          accuracy: 91,
          last_updated: new Date(),
          prediction_horizon: '21 dias',
          confidence_level: 89
        }
      ]

      const mockPredictions: Prediction[] = [
        {
          id: '1',
          model_id: '1',
          subject: 'Receita Total - Janeiro 2024',
          prediction_type: 'revenue_monthly',
          current_value: 145600,
          predicted_value: 167800,
          confidence: 0.94,
          date_range: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
          },
          trend: 'up',
          change_percentage: 15.3,
          factors: ['Aumento de budget Instagram', 'Sazonalidade Janeiro', 'Novas campanhas Stories', 'Melhoria no ROAS'],
          recommendations: [
            'Aumentar investimento em campanhas de alta performance',
            'Manter foco no público feminino 25-35 anos',
            'Criar mais conteúdo sazonal para janeiro'
          ],
          risk_level: 'low',
          created_at: new Date()
        },
        {
          id: '2',
          model_id: '2',
          subject: 'Conversões Instagram Stories',
          prediction_type: 'conversions_campaign',
          current_value: 89,
          predicted_value: 127,
          confidence: 0.87,
          date_range: {
            start: new Date(),
            end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          },
          trend: 'up',
          change_percentage: 42.7,
          factors: ['Otimização de creative', 'Público qualificado', 'Horário otimizado'],
          recommendations: [
            'Aumentar budget desta campanha em 30%',
            'Criar variações do creative de maior sucesso',
            'Expandir targeting para lookalike similar'
          ],
          risk_level: 'medium',
          created_at: new Date()
        },
        {
          id: '3',
          model_id: '4',
          subject: 'Custo por Aquisição - Google Ads',
          prediction_type: 'cost_optimization',
          current_value: 45.30,
          predicted_value: 38.90,
          confidence: 0.91,
          date_range: {
            start: new Date(),
            end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
          },
          trend: 'down',
          change_percentage: -14.1,
          factors: ['Melhoria no Quality Score', 'Otimização de palavras-chave', 'Landing page otimizada'],
          recommendations: [
            'Pausar palavras-chave de baixa performance',
            'Aumentar lances em termos de alta conversão',
            'Testar novas extensões de anúncios'
          ],
          risk_level: 'low',
          created_at: new Date()
        }
      ]

      const mockScenarios: ScenarioAnalysis[] = [
        {
          id: '1',
          name: 'Cenário Otimista',
          description: 'Implementação de todas as recomendações da IA + aumento de 20% no budget',
          scenario_type: 'optimistic',
          parameters: { budget_increase: 20, optimization_level: 100 },
          predicted_outcome: {
            revenue_change: 35.2,
            conversion_change: 28.7,
            cost_change: -12.5,
            timeline: '60 dias'
          },
          probability: 25
        },
        {
          id: '2',
          name: 'Cenário Realista',
          description: 'Implementação gradual das otimizações com budget atual',
          scenario_type: 'realistic',
          parameters: { budget_increase: 0, optimization_level: 70 },
          predicted_outcome: {
            revenue_change: 18.4,
            conversion_change: 15.2,
            cost_change: -5.8,
            timeline: '45 dias'
          },
          probability: 60
        },
        {
          id: '3',
          name: 'Cenário Pessimista',
          description: 'Manutenção do status quo com possível redução de budget',
          scenario_type: 'pessimistic',
          parameters: { budget_increase: -10, optimization_level: 30 },
          predicted_outcome: {
            revenue_change: -8.7,
            conversion_change: -12.3,
            cost_change: 8.9,
            timeline: '30 dias'
          },
          probability: 15
        }
      ]

      const mockTrendData: TrendData[] = [
        { date: '01/12', actual: 42500, predicted: 42800, confidence_upper: 45000, confidence_lower: 40500 },
        { date: '08/12', actual: 45200, predicted: 45100, confidence_upper: 47500, confidence_lower: 42800 },
        { date: '15/12', actual: 48900, predicted: 48200, confidence_upper: 51000, confidence_lower: 45500 },
        { date: '22/12', actual: 52100, predicted: 51800, confidence_upper: 54500, confidence_lower: 49200 },
        { date: '29/12', actual: 49800, predicted: 50200, confidence_upper: 53000, confidence_lower: 47500 },
        { date: '05/01', predicted: 53500, confidence_upper: 56200, confidence_lower: 50800 },
        { date: '12/01', predicted: 56800, confidence_upper: 59800, confidence_lower: 53900 },
        { date: '19/01', predicted: 59200, confidence_upper: 62500, confidence_lower: 56000 },
        { date: '26/01', predicted: 61800, confidence_upper: 65200, confidence_lower: 58500 }
      ]

      setModels(mockModels)
      setPredictions(mockPredictions)
      setScenarios(mockScenarios)
      setTrendData(mockTrendData)
      
    } catch (error) {
      console.error('Erro ao carregar dados preditivos:', error)
      toast.error('Erro ao carregar análise preditiva')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPredictiveData()
    setRefreshing(false)
    toast.success('Previsões atualizadas!')
  }

  const handleToggleModel = async (modelId: string, active: boolean) => {
    setModels(prev => 
      prev.map(model => 
        model.id === modelId 
          ? { ...model, status: active ? 'active' as const : 'paused' as const }
          : model
      )
    )
    toast.success(`Modelo ${active ? 'ativado' : 'pausado'}!`)
  }

  const handleViewDetails = (predictionId: string) => {
    toast.info('Abrindo detalhes da previsão...')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
            <Gem className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Análise Preditiva Avançada</h1>
            <p className="text-gray-600">Previsões inteligentes com machine learning</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
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

      {/* Modelos de IA */}
      <PredictionModels models={models} onToggleModel={handleToggleModel} />

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="scenarios">Cenários</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <PredictiveTrendChart 
            data={trendData}
            title="Tendência de Receita Preditiva"
            type="revenue"
          />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <DetailedPredictions 
            predictions={predictions}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <ScenarioAnalysis scenarios={scenarios} />
        </TabsContent>
      </Tabs>
    </div>
  )
}