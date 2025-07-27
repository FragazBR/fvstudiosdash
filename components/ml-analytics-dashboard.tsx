'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Button
} from '@/components/ui/button'
import {
  Badge
} from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Label
} from '@/components/ui/label'
import {
  Input
} from '@/components/ui/input'
import {
  Textarea
} from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Progress
} from '@/components/ui/progress'
import {
  Plus,
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  BarChart3,
  Activity,
  Zap,
  Eye,
  ThumbsUp,
  Share2,
  X,
  Play,
  Pause,
  Settings,
  Lightbulb,
  Cpu,
  Database,
  ChartBar,
  PieChart,
  LineChart,
  Gauge
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from 'recharts'

interface MLModel {
  id: string
  name: string
  description?: string
  model_type: string
  prediction_type: string
  status: string
  accuracy?: number
  precision_score?: number
  recall?: number
  f1_score?: number
  last_trained_at?: string
  last_prediction_at?: string
  usage_count?: number
  created_at: string
}

interface MLPrediction {
  id: string
  model_id: string
  prediction_type: string
  predicted_value: any
  prediction_probability?: number
  prediction_confidence: string
  risk_level: string
  opportunity_score?: number
  explanation_text?: string
  prediction_date: string
  is_validated: boolean
  prediction_accuracy?: number
  ml_models?: {
    name: string
    model_type: string
  }
}

interface MLInsight {
  id: string
  insight_type: string
  category?: string
  title: string
  description: string
  importance_score: number
  priority: string
  confidence_level?: number
  insight_date: string
  view_count: number
  like_count: number
  share_count: number
  is_dismissed: boolean
  is_featured: boolean
  recommended_actions?: any
  ml_models?: {
    name: string
    model_type: string
  }
}

interface MLAnalytics {
  models: {
    total: number
    active: number
    training: number
    inactive: number
    by_type: Record<string, number>
    by_prediction_type: Record<string, number>
  }
  predictions: {
    total: number
    high_risk: number
    medium_risk: number
    low_risk: number
    avg_accuracy: number
    by_type: Record<string, number>
    daily_trend: Array<{
      date: string
      count: number
      high_risk: number
      medium_risk: number
      low_risk: number
    }>
  }
  insights: {
    total: number
    active: number
    high_priority: number
    critical_priority: number
    avg_importance: number
    by_category: Record<string, number>
  }
  training: {
    total: number
    running: number
    completed: number
    failed: number
    avg_duration: number
    by_type: Record<string, number>
  }
  top_insights: MLInsight[]
  top_models: MLModel[]
}

const MODEL_TYPES = [
  { value: 'regression', label: 'Regressão', icon: TrendingUp },
  { value: 'classification', label: 'Classificação', icon: Target },
  { value: 'clustering', label: 'Clustering', icon: Users },
  { value: 'time_series', label: 'Séries Temporais', icon: BarChart3 },
  { value: 'anomaly_detection', label: 'Detecção de Anomalias', icon: AlertTriangle },
  { value: 'recommendation', label: 'Recomendação', icon: ThumbsUp },
  { value: 'forecasting', label: 'Previsão', icon: TrendingUp },
  { value: 'sentiment_analysis', label: 'Análise de Sentimento', icon: Brain },
  { value: 'churn_prediction', label: 'Predição de Churn', icon: TrendingDown },
  { value: 'conversion_prediction', label: 'Predição de Conversão', icon: Target }
]

const PREDICTION_TYPES = [
  { value: 'project_completion', label: 'Conclusão de Projeto', category: 'Projetos' },
  { value: 'client_churn', label: 'Churn de Cliente', category: 'Clientes' },
  { value: 'revenue_forecast', label: 'Previsão de Receita', category: 'Financeiro' },
  { value: 'resource_demand', label: 'Demanda de Recursos', category: 'Recursos' },
  { value: 'campaign_performance', label: 'Performance de Campanha', category: 'Marketing' },
  { value: 'user_behavior', label: 'Comportamento do Usuário', category: 'Usuários' },
  { value: 'market_trends', label: 'Tendências de Mercado', category: 'Mercado' },
  { value: 'risk_assessment', label: 'Avaliação de Risco', category: 'Risco' },
  { value: 'quality_score', label: 'Score de Qualidade', category: 'Qualidade' },
  { value: 'engagement_prediction', label: 'Predição de Engajamento', category: 'Engajamento' }
]

const RISK_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const CONFIDENCE_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-purple-100 text-purple-800'
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0']

export default function MLAnalyticsDashboard() {
  const user = useUser()
  const [analytics, setAnalytics] = useState<MLAnalytics | null>(null)
  const [models, setModels] = useState<MLModel[]>([])
  const [predictions, setPredictions] = useState<MLPrediction[]>([])
  const [insights, setInsights] = useState<MLInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30')
  const [showCreateModelDialog, setShowCreateModelDialog] = useState(false)
  const [showPredictionDialog, setShowPredictionDialog] = useState(false)
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null)
  const [modelForm, setModelForm] = useState({
    name: '',
    description: '',
    model_type: 'classification',
    prediction_type: 'client_churn',
    algorithm: 'random_forest',
    feature_columns: '',
    target_column: '',
    hyperparameters: '{}',
    is_public: false
  })
  const [predictionForm, setPredictionForm] = useState({
    model_id: '',
    input_features: '{}',
    prediction_key: '',
    return_explanation: true
  })

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000) // Atualizar a cada minuto
    return () => clearInterval(interval)
  }, [user?.id, selectedTimeRange])

  const loadData = async () => {
    if (!user?.id) return
    
    try {
      await Promise.all([
        loadAnalytics(),
        loadModels(),
        loadPredictions(),
        loadInsights()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const agencyId = 'current-agency-id' // TODO: Obter do contexto
      const response = await fetch(`/api/ml/analytics?agency_id=${agencyId}&time_range=${selectedTimeRange}`)
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    }
  }

  const loadModels = async () => {
    try {
      const response = await fetch('/api/ml/models?limit=20')
      const data = await response.json()
      if (data.success) {
        setModels(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar modelos:', error)
    }
  }

  const loadPredictions = async () => {
    try {
      const response = await fetch('/api/ml/predictions?limit=50')
      const data = await response.json()
      if (data.success) {
        setPredictions(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar predições:', error)
    }
  }

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/ml/insights?limit=20&is_active=true')
      const data = await response.json()
      if (data.success) {
        setInsights(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar insights:', error)
    }
  }

  const handleCreateModel = async () => {
    try {
      let featureColumns, hyperparameters
      try {
        featureColumns = modelForm.feature_columns.split(',').map(col => col.trim()).filter(Boolean)
        hyperparameters = JSON.parse(modelForm.hyperparameters)
      } catch {
        toast.error('Formato inválido em colunas de features ou hyperparâmetros')
        return
      }

      const response = await fetch('/api/ml/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...modelForm,
          feature_columns: featureColumns,
          hyperparameters
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Modelo criado com sucesso!')
        setShowCreateModelDialog(false)
        resetModelForm()
        loadModels()
        loadAnalytics()
      } else {
        toast.error(data.error || 'Erro ao criar modelo')
      }
    } catch (error) {
      toast.error('Erro ao criar modelo')
      console.error(error)
    }
  }

  const handleMakePrediction = async () => {
    try {
      let inputFeatures
      try {
        inputFeatures = JSON.parse(predictionForm.input_features)
      } catch {
        toast.error('JSON de features inválido')
        return
      }

      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...predictionForm,
          input_features: inputFeatures
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Predição realizada com sucesso!')
        setShowPredictionDialog(false)
        resetPredictionForm()
        loadPredictions()
        loadAnalytics()
      } else {
        toast.error(data.error || 'Erro ao fazer predição')
      }
    } catch (error) {
      toast.error('Erro ao fazer predição')
      console.error(error)
    }
  }

  const handleTrainModel = async (modelId: string) => {
    try {
      const response = await fetch('/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: modelId,
          job_type: 'retraining'
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Treinamento iniciado com sucesso!')
        loadModels()
        loadAnalytics()
      } else {
        toast.error(data.error || 'Erro ao iniciar treinamento')
      }
    } catch (error) {
      toast.error('Erro ao iniciar treinamento')
      console.error(error)
    }
  }

  const handleInsightAction = async (insightId: string, action: string) => {
    try {
      const response = await fetch(`/api/ml/insights/${insightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const data = await response.json()
      if (data.success) {
        loadInsights()
      }
    } catch (error) {
      console.error(`Erro ao ${action} insight:`, error)
    }
  }

  const generateInsights = async () => {
    try {
      const response = await fetch('/api/ml/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          agency_id: 'current-agency-id',
          time_range_days: parseInt(selectedTimeRange)
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`${data.data.generated_insights} insights gerados!`)
        loadInsights()
        loadAnalytics()
      } else {
        toast.error(data.error || 'Erro ao gerar insights')
      }
    } catch (error) {
      toast.error('Erro ao gerar insights')
      console.error(error)
    }
  }

  const resetModelForm = () => {
    setModelForm({
      name: '',
      description: '',
      model_type: 'classification',
      prediction_type: 'client_churn',
      algorithm: 'random_forest',
      feature_columns: '',
      target_column: '',
      hyperparameters: '{}',
      is_public: false
    })
  }

  const resetPredictionForm = () => {
    setPredictionForm({
      model_id: '',
      input_features: '{}',
      prediction_key: '',
      return_explanation: true
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'training':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'inactive':
        return <Pause className="h-4 w-4 text-gray-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getModelTypeIcon = (type: string) => {
    const modelType = MODEL_TYPES.find(t => t.value === type)
    const IconComponent = modelType?.icon || Brain
    return <IconComponent className="h-4 w-4" />
  }

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'trend':
        return <BarChart3 className="h-4 w-4 text-blue-500" />
      case 'anomaly':
        return <Zap className="h-4 w-4 text-orange-500" />
      default:
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            Analytics Preditivo
          </h1>
          <p className="text-muted-foreground">
            Machine Learning e insights inteligentes para sua agência
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={showCreateModelDialog} onOpenChange={setShowCreateModelDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Modelo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Modelo ML</DialogTitle>
                <DialogDescription>
                  Configure um novo modelo de machine learning
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Modelo</Label>
                    <Input
                      id="name"
                      value={modelForm.name}
                      onChange={(e) => setModelForm({...modelForm, name: e.target.value})}
                      placeholder="Nome do modelo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="algorithm">Algoritmo</Label>
                    <Select 
                      value={modelForm.algorithm} 
                      onValueChange={(value) => setModelForm({...modelForm, algorithm: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear_regression">Linear Regression</SelectItem>
                        <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                        <SelectItem value="random_forest">Random Forest</SelectItem>
                        <SelectItem value="decision_tree">Decision Tree</SelectItem>
                        <SelectItem value="neural_network">Neural Network</SelectItem>
                        <SelectItem value="lstm_neural_network">LSTM</SelectItem>
                        <SelectItem value="transformer_bert">Transformer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model_type">Tipo de Modelo</Label>
                    <Select 
                      value={modelForm.model_type} 
                      onValueChange={(value) => setModelForm({...modelForm, model_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prediction_type">Tipo de Predição</Label>
                    <Select 
                      value={modelForm.prediction_type} 
                      onValueChange={(value) => setModelForm({...modelForm, prediction_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PREDICTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={modelForm.description}
                    onChange={(e) => setModelForm({...modelForm, description: e.target.value})}
                    placeholder="Descrição do modelo"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="feature_columns">Colunas de Features (separadas por vírgula)</Label>
                    <Input
                      id="feature_columns"
                      value={modelForm.feature_columns}
                      onChange={(e) => setModelForm({...modelForm, feature_columns: e.target.value})}
                      placeholder="col1, col2, col3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="target_column">Coluna Alvo</Label>
                    <Input
                      id="target_column"
                      value={modelForm.target_column}
                      onChange={(e) => setModelForm({...modelForm, target_column: e.target.value})}
                      placeholder="target_column"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hyperparameters">Hyperparâmetros (JSON)</Label>
                  <Textarea
                    id="hyperparameters"
                    value={modelForm.hyperparameters}
                    onChange={(e) => setModelForm({...modelForm, hyperparameters: e.target.value})}
                    placeholder='{"max_depth": 10, "n_estimators": 100}'
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModelDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateModel}>
                  Criar Modelo
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={generateInsights}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Gerar Insights
          </Button>

          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modelos Ativos</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.models.active}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.models.total} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predições Hoje</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.predictions.daily_trend.slice(-1)[0]?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.predictions.total} no período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acurácia Média</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analytics.predictions.avg_accuracy * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Dos modelos ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Insights Ativos</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.insights.active}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.insights.high_priority} alta prioridade
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="predictions">Predições</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {analytics && (
            <div className="grid gap-6">
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prediction Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Tendência de Predições
                    </CardTitle>
                    <CardDescription>
                      Número de predições por dia e nível de risco
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={analytics.predictions.daily_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" name="Total" />
                        <Line type="monotone" dataKey="high_risk" stroke="#ff7c7c" name="Alto Risco" />
                        <Line type="monotone" dataKey="medium_risk" stroke="#ffc658" name="Médio Risco" />
                        <Line type="monotone" dataKey="low_risk" stroke="#82ca9d" name="Baixo Risco" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Model Types Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Distribuição por Tipo de Modelo
                    </CardTitle>
                    <CardDescription>
                      Tipos de modelos ML em uso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={Object.entries(analytics.models.by_type).map(([type, count]) => ({
                            name: MODEL_TYPES.find(t => t.value === type)?.label || type,
                            value: count
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(analytics.models.by_type).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Insights Principais
                  </CardTitle>
                  <CardDescription>
                    Insights mais importantes baseados em ML
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.top_insights.map((insight) => (
                      <div key={insight.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          {getInsightTypeIcon(insight.insight_type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{insight.title}</h4>
                              <Badge className={PRIORITY_COLORS[insight.priority as keyof typeof PRIORITY_COLORS]}>
                                {insight.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {insight.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {insight.view_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {insight.like_count}
                              </span>
                              <span>Score: {insight.importance_score.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleInsightAction(insight.id, 'like')}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleInsightAction(insight.id, 'share')}
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleInsightAction(insight.id, 'dismiss')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Models */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Modelos de Melhor Performance
                  </CardTitle>
                  <CardDescription>
                    Modelos com maior acurácia e uso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Acurácia</TableHead>
                        <TableHead>Última Predição</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.top_models.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getModelTypeIcon(model.model_type)}
                              <div>
                                <div className="font-medium">{model.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {PREDICTION_TYPES.find(t => t.value === model.prediction_type)?.label}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {MODEL_TYPES.find(t => t.value === model.model_type)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(model.accuracy || 0) * 100} 
                                className="w-20"
                              />
                              <span className="text-sm">
                                {((model.accuracy || 0) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {model.last_prediction_at ? 
                                new Date(model.last_prediction_at).toLocaleDateString('pt-BR') :
                                'Nunca'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTrainModel(model.id)}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedModel(model)
                                  setPredictionForm({...predictionForm, model_id: model.id})
                                  setShowPredictionDialog(true)
                                }}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Modelos ML</CardTitle>
              <CardDescription>
                Gerencie seus modelos de machine learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Último Treino</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getModelTypeIcon(model.model_type)}
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {model.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {MODEL_TYPES.find(t => t.value === model.model_type)?.label}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {PREDICTION_TYPES.find(t => t.value === model.prediction_type)?.label}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(model.status)}
                          <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                            {model.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {model.accuracy ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={model.accuracy * 100} 
                                className="w-16"
                              />
                              <span className="text-xs">
                                {(model.accuracy * 100).toFixed(1)}%
                              </span>
                            </div>
                            {model.precision_score && (
                              <div className="text-xs text-muted-foreground">
                                Precisão: {(model.precision_score * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {model.last_trained_at ? 
                            new Date(model.last_trained_at).toLocaleDateString('pt-BR') :
                            'Nunca treinado'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTrainModel(model.id)}
                            disabled={model.status === 'training'}
                          >
                            <RefreshCw className={`h-3 w-3 ${model.status === 'training' ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedModel(model)
                              setPredictionForm({...predictionForm, model_id: model.id})
                              setShowPredictionDialog(true)
                            }}
                            disabled={model.status !== 'active'}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Predições</CardTitle>
                  <CardDescription>
                    Histórico de predições realizadas pelos modelos
                  </CardDescription>
                </div>
                <Dialog open={showPredictionDialog} onOpenChange={setShowPredictionDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Predição
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fazer Predição</DialogTitle>
                      <DialogDescription>
                        Execute uma predição usando um modelo ML
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="model_select">Modelo</Label>
                        <Select 
                          value={predictionForm.model_id} 
                          onValueChange={(value) => setPredictionForm({...predictionForm, model_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {models.filter(m => m.status === 'active').map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="prediction_key">Chave da Predição (opcional)</Label>
                        <Input
                          id="prediction_key"
                          value={predictionForm.prediction_key}
                          onChange={(e) => setPredictionForm({...predictionForm, prediction_key: e.target.value})}
                          placeholder="client_123, project_456, etc"
                        />
                      </div>

                      <div>
                        <Label htmlFor="input_features">Features de Entrada (JSON)</Label>
                        <Textarea
                          id="input_features"
                          value={predictionForm.input_features}
                          onChange={(e) => setPredictionForm({...predictionForm, input_features: e.target.value})}
                          placeholder='{"feature1": 0.8, "feature2": "value", "feature3": 123}'
                          rows={4}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowPredictionDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleMakePrediction}>
                        Fazer Predição
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((prediction) => (
                    <TableRow key={prediction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {prediction.ml_models?.name || 'Modelo desconhecido'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {prediction.ml_models?.model_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PREDICTION_TYPES.find(t => t.value === prediction.prediction_type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {typeof prediction.predicted_value === 'number' 
                              ? prediction.predicted_value.toFixed(3)
                              : String(prediction.predicted_value)
                            }
                          </div>
                          {prediction.prediction_probability && (
                            <div className="text-xs text-muted-foreground">
                              Prob: {(prediction.prediction_probability * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={CONFIDENCE_COLORS[prediction.prediction_confidence as keyof typeof CONFIDENCE_COLORS]}>
                          {prediction.prediction_confidence}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={RISK_COLORS[prediction.risk_level as keyof typeof RISK_COLORS]}>
                          {prediction.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(prediction.prediction_date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(prediction.prediction_date).toLocaleTimeString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {prediction.is_validated ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-xs">
                            {prediction.is_validated ? 'Validado' : 'Pendente'}
                          </span>
                        </div>
                        {prediction.prediction_accuracy && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Acurácia: {(prediction.prediction_accuracy * 100).toFixed(1)}%
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Insights ML</CardTitle>
                  <CardDescription>
                    Insights automáticos gerados pelos modelos de ML
                  </CardDescription>
                </div>
                <Button onClick={generateInsights}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Gerar Insights
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className={`p-4 border rounded-lg ${insight.is_featured ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getInsightTypeIcon(insight.insight_type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            <Badge className={PRIORITY_COLORS[insight.priority as keyof typeof PRIORITY_COLORS]}>
                              {insight.priority}
                            </Badge>
                            {insight.is_featured && (
                              <Badge variant="secondary">
                                Destaque
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {insight.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <span>Score: {insight.importance_score.toFixed(1)}/100</span>
                            <span>Categoria: {insight.category || 'Geral'}</span>
                            {insight.confidence_level && (
                              <span>Confiança: {(insight.confidence_level * 100).toFixed(0)}%</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {insight.view_count} visualizações
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {insight.like_count} curtidas
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              {insight.share_count} compartilhamentos
                            </span>
                            <span>
                              {new Date(insight.insight_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleInsightAction(insight.id, 'like')}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleInsightAction(insight.id, 'share')}
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                        {!insight.is_dismissed && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleInsightAction(insight.id, 'dismiss')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}