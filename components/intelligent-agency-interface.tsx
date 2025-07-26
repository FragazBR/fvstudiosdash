'use client'

// ==================================================
// FVStudios Dashboard - Interface Inteligente da Agência
// Integração completa de todas as funcionalidades de IA
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Brain,
  Zap,
  Target,
  BarChart3,
  MessageSquare,
  Lightbulb,
  Gem,
  Settings,
  Play,
  RefreshCw,
  Sparkles,
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Star,
  Eye,
  ChevronRight,
  Plus,
  Workflow,
  Bot,
  Filter
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'

// Importar componentes inteligentes
import { IntelligentAnalytics } from './intelligent-analytics'
import { AutomationCenter } from './automation-center'
import { AIAssistant } from './ai-assistant'
import { AIRecommendations } from './ai-recommendations'
import { PredictiveAnalyticsAdvanced } from './predictive-analytics-advanced'
import { SmartActionsEngine } from '@/lib/intelligent-system'

// Interfaces
interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  onClick: () => void
  category: string
  usage_count: number
  estimated_time: string
}

interface SystemOverview {
  ai_systems_active: number
  total_automations: number
  recommendations_pending: number
  predictions_accuracy: number
  time_saved_today: number
  actions_executed: number
}

// ==================================================
// COMPONENTES
// ==================================================

// Visão Geral do Sistema Inteligente
function IntelligentSystemOverview({ overview }: { overview: SystemOverview }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Sistemas IA</p>
              <p className="text-2xl font-bold text-blue-700">{overview.ai_systems_active}</p>
              <p className="text-xs text-blue-500">ativos</p>
            </div>
            <div className="p-2 bg-blue-200 rounded-lg">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Automações</p>
              <p className="text-2xl font-bold text-purple-700">{overview.total_automations}</p>
              <p className="text-xs text-purple-500">configuradas</p>
            </div>
            <div className="p-2 bg-purple-200 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Recomendações</p>
              <p className="text-2xl font-bold text-orange-700">{overview.recommendations_pending}</p>
              <p className="text-xs text-orange-500">pendentes</p>
            </div>
            <div className="p-2 bg-orange-200 rounded-lg">
              <Lightbulb className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Precisão IA</p>
              <p className="text-2xl font-bold text-green-700">{overview.predictions_accuracy}%</p>
              <p className="text-xs text-green-500">previsões</p>
            </div>
            <div className="p-2 bg-green-200 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Tempo Economizado</p>
              <p className="text-2xl font-bold text-indigo-700">{overview.time_saved_today}h</p>
              <p className="text-xs text-indigo-500">hoje</p>
            </div>
            <div className="p-2 bg-indigo-200 rounded-lg">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-600 font-medium">Ações Executadas</p>
              <p className="text-2xl font-bold text-teal-700">{overview.actions_executed}</p>
              <p className="text-xs text-teal-500">últimas 24h</p>
            </div>
            <div className="p-2 bg-teal-200 rounded-lg">
              <Activity className="h-5 w-5 text-teal-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Ações Rápidas Inteligentes
function SmartQuickActions({ actions, onExecuteAction }: {
  actions: QuickAction[]
  onExecuteAction: (actionId: string) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'Todas', count: actions.length },
    { id: 'analytics', name: 'Analytics', count: actions.filter(a => a.category === 'analytics').length },
    { id: 'automation', name: 'Automação', count: actions.filter(a => a.category === 'automation').length },
    { id: 'optimization', name: 'Otimização', count: actions.filter(a => a.category === 'optimization').length },
    { id: 'content', name: 'Conteúdo', count: actions.filter(a => a.category === 'content').length }
  ]

  const filteredActions = selectedCategory === 'all' 
    ? actions 
    : actions.filter(action => action.category === selectedCategory)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Ações Rápidas Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-1"
            >
              {category.name}
              <Badge variant="secondary" className="text-xs ml-1">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Grid de Ações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActions.map(action => (
            <Card 
              key={action.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group"
              onClick={() => onExecuteAction(action.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      {action.icon}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>{action.usage_count} usos</div>
                      <div>{action.estimated_time}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{action.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className="text-xs capitalize">
                      {action.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Play className="h-3 w-3" />
                      Executar
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Dashboard de Status dos Sistemas
function SystemsStatusDashboard() {
  const systems = [
    {
      id: 'analytics',
      name: 'Analytics Inteligente',
      status: 'active',
      health: 98,
      last_update: '2 min atrás',
      icon: <BarChart3 className="h-4 w-4" />,
      color: 'text-green-600',
      bg_color: 'bg-green-100'
    },
    {
      id: 'automation',
      name: 'Central de Automação',
      status: 'active',
      health: 95,
      last_update: '5 min atrás',
      icon: <Zap className="h-4 w-4" />,
      color: 'text-blue-600',
      bg_color: 'bg-blue-100'
    },
    {
      id: 'assistant',
      name: 'Assistente IA',
      status: 'active',
      health: 100,
      last_update: '1 min atrás',
      icon: <Bot className="h-4 w-4" />,
      color: 'text-purple-600',
      bg_color: 'bg-purple-100'
    },
    {
      id: 'recommendations',
      name: 'Sistema de Recomendações',
      status: 'active',
      health: 92,
      last_update: '3 min atrás',
      icon: <Lightbulb className="h-4 w-4" />,
      color: 'text-orange-600',
      bg_color: 'bg-orange-100'
    },
    {
      id: 'predictions',
      name: 'Análise Preditiva',
      status: 'training',
      health: 87,
      last_update: '10 min atrás',
      icon: <Gem className="h-4 w-4" />,
      color: 'text-indigo-600',
      bg_color: 'bg-indigo-100'
    }
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      training: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors]
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      active: <Play className="h-3 w-3" />,
      training: <RefreshCw className="h-3 w-3 animate-spin" />,
      maintenance: <Settings className="h-3 w-3" />,
      error: <Target className="h-3 w-3" />
    }
    return icons[status as keyof typeof icons]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Status dos Sistemas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {systems.map(system => (
            <div key={system.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${system.bg_color} ${system.color}`}>
                  {system.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{system.name}</h4>
                  <p className="text-xs text-gray-500">
                    Atualizado {system.last_update}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">{system.health}%</div>
                  <div className="text-xs text-gray-500">saúde</div>
                </div>
                
                <Badge className={getStatusColor(system.status)}>
                  {getStatusIcon(system.status)}
                  <span className="ml-1 capitalize">{system.status}</span>
                </Badge>
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

export function IntelligentAgencyInterface() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<SystemOverview>({
    ai_systems_active: 5,
    total_automations: 12,
    recommendations_pending: 8,
    predictions_accuracy: 94,
    time_saved_today: 6.5,
    actions_executed: 23
  })
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])

  useEffect(() => {
    initializeIntelligentSystems()
  }, [])

  const initializeIntelligentSystems = async () => {
    try {
      setLoading(true)
      
      // Simular inicialização dos sistemas
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Carregar ações rápidas disponíveis
      const mockActions: QuickAction[] = [
        {
          id: 'analyze_campaigns',
          title: 'Analisar Performance de Campanhas',
          description: 'Análise inteligente de todas as campanhas ativas com insights acionáveis',
          icon: <BarChart3 className="h-4 w-4 text-white" />,
          color: 'bg-blue-500',
          category: 'analytics',
          usage_count: 47,
          estimated_time: '2 min',
          onClick: () => toast.success('Iniciando análise de campanhas...')
        },
        {
          id: 'optimize_budget',
          title: 'Otimizar Distribuição de Orçamento',
          description: 'IA realoca orçamento automaticamente para campanhas de melhor performance',
          icon: <DollarSign className="h-4 w-4 text-white" />,
          color: 'bg-green-500',
          category: 'optimization',
          usage_count: 34,
          estimated_time: '3 min',
          onClick: () => toast.success('Otimizando orçamento com IA...')
        },
        {
          id: 'generate_content',
          title: 'Gerar Conteúdo Automático',
          description: 'Cria posts, anúncios e textos personalizados com IA generativa',
          icon: <Sparkles className="h-4 w-4 text-white" />,
          color: 'bg-purple-500',
          category: 'content',
          usage_count: 89,
          estimated_time: '1 min',
          onClick: () => toast.success('Gerando conteúdo com IA...')
        },
        {
          id: 'predict_performance',
          title: 'Previsão de Performance',
          description: 'Prevê resultados das próximas semanas baseado em dados históricos',
          icon: <Gem className="h-4 w-4 text-white" />,
          color: 'bg-indigo-500',
          category: 'analytics',
          usage_count: 23,
          estimated_time: '4 min',
          onClick: () => toast.success('Gerando previsões...')
        },
        {
          id: 'automate_reports',
          title: 'Automatizar Relatórios',
          description: 'Configura envio automático de relatórios personalizados para clientes',
          icon: <Workflow className="h-4 w-4 text-white" />,
          color: 'bg-orange-500',
          category: 'automation',
          usage_count: 12,
          estimated_time: '5 min',
          onClick: () => toast.success('Configurando automação...')
        },
        {
          id: 'intelligent_insights',
          title: 'Insights Inteligentes',
          description: 'Gera insights acionáveis baseados em análise profunda dos dados',
          icon: <Lightbulb className="h-4 w-4 text-white" />,
          color: 'bg-yellow-500',
          category: 'analytics',
          usage_count: 56,
          estimated_time: '2 min',
          onClick: () => toast.success('Gerando insights...')
        }
      ]

      setQuickActions(mockActions)
      
    } catch (error) {
      console.error('Erro ao inicializar sistemas inteligentes:', error)
      toast.error('Erro ao carregar sistemas de IA')
    } finally {
      setLoading(false)
    }
  }

  const handleExecuteAction = async (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId)
    if (action) {
      // Incrementar contador de uso
      setQuickActions(prev => 
        prev.map(a => 
          a.id === actionId 
            ? { ...a, usage_count: a.usage_count + 1 }
            : a
        )
      )
      
      // Executar ação
      action.onClick()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
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
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">IA Avançada</h1>
            <p className="text-gray-600">Sistema inteligente completo para otimização da agência</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Sistemas
          </Button>
          
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações IA
          </Button>
        </div>
      </div>

      {/* Visão Geral dos Sistemas */}
      <IntelligentSystemOverview overview={overview} />

      {/* Ações Rápidas e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SmartQuickActions 
            actions={quickActions}
            onExecuteAction={handleExecuteAction}
          />
        </div>
        
        <div>
          <SystemsStatusDashboard />
        </div>
      </div>

      {/* Tabs com Sistemas Completos */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automação
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Assistente
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recomendações
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Gem className="h-4 w-4" />
            Previsões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <IntelligentAnalytics />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <AutomationCenter />
        </TabsContent>

        <TabsContent value="assistant" className="space-y-6">
          <AIAssistant />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <AIRecommendations />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictiveAnalyticsAdvanced />
        </TabsContent>
      </Tabs>
    </div>
  )
}