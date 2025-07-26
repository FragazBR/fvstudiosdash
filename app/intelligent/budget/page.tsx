'use client'

// ==================================================
// FVStudios Dashboard - Otimização Inteligente de Orçamento
// Sistema de IA para distribuição e otimização automática de budget
// ==================================================

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Settings,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Calculator,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface BudgetAllocation {
  id: string
  campaign_name: string
  platform: 'facebook' | 'instagram' | 'google' | 'tiktok' | 'linkedin'
  current_budget: number
  recommended_budget: number
  performance_score: number
  roas: number
  spend_rate: number
  remaining_days: number
  status: 'optimal' | 'underperforming' | 'overspending' | 'needs_attention'
  ai_confidence: number
}

interface BudgetOptimization {
  id: string
  type: 'increase' | 'decrease' | 'redistribute' | 'pause'
  campaign_id: string
  current_amount: number
  recommended_amount: number
  expected_impact: string
  confidence: number
  reasoning: string[]
  priority: 'high' | 'medium' | 'low'
}

interface BudgetInsight {
  id: string
  title: string
  description: string
  impact: string
  action: string
  savings_potential: number
  type: 'optimization' | 'warning' | 'opportunity'
}

// ==================================================
// COMPONENTES
// ==================================================

// Budget Overview Cards
function BudgetOverview({ allocations }: { allocations: BudgetAllocation[] }) {
  const totalCurrentBudget = allocations.reduce((sum, a) => sum + a.current_budget, 0)
  const totalRecommendedBudget = allocations.reduce((sum, a) => sum + a.recommended_budget, 0)
  const avgPerformanceScore = allocations.length > 0 
    ? allocations.reduce((sum, a) => sum + a.performance_score, 0) / allocations.length 
    : 0
  const potentialSavings = totalCurrentBudget - totalRecommendedBudget

  const metrics = [
    {
      title: 'Orçamento Total Atual',
      value: `R$ ${totalCurrentBudget.toLocaleString()}`,
      subtitle: 'Distribuído em campanhas',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Otimização Sugerida',
      value: `R$ ${Math.abs(potentialSavings).toLocaleString()}`,
      subtitle: potentialSavings > 0 ? 'Economia potencial' : 'Investimento adicional',
      icon: potentialSavings > 0 ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />,
      color: potentialSavings > 0 ? 'text-green-600' : 'text-orange-600',
      bg: potentialSavings > 0 ? 'bg-green-100' : 'bg-orange-100'
    },
    {
      title: 'Performance Média',
      value: `${avgPerformanceScore.toFixed(1)}/10`,
      subtitle: avgPerformanceScore >= 8 ? 'Excelente' : avgPerformanceScore >= 6 ? 'Boa' : 'Precisa melhorar',
      icon: <Target className="h-5 w-5" />,
      color: avgPerformanceScore >= 8 ? 'text-green-600' : avgPerformanceScore >= 6 ? 'text-yellow-600' : 'text-red-600',
      bg: avgPerformanceScore >= 8 ? 'bg-green-100' : avgPerformanceScore >= 6 ? 'bg-yellow-100' : 'bg-red-100'
    },
    {
      title: 'Campanhas Otimizáveis',
      value: allocations.filter(a => a.status === 'needs_attention' || a.status === 'underperforming').length,
      subtitle: `de ${allocations.length} campanhas`,
      icon: <Brain className="h-5 w-5" />,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
                {metric.subtitle && (
                  <p className="text-sm text-gray-500 mt-1">{metric.subtitle}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${metric.bg}`}>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Budget Distribution Chart
function BudgetDistributionChart({ allocations }: { allocations: BudgetAllocation[] }) {
  const data = allocations.map(allocation => ({
    name: allocation.campaign_name,
    current: allocation.current_budget,
    recommended: allocation.recommended_budget,
    platform: allocation.platform
  }))

  const pieData = allocations.map(allocation => ({
    name: allocation.campaign_name,
    value: allocation.current_budget,
    platform: allocation.platform
  }))

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Distribuição Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, 'Orçamento']} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Atual vs Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString()}`} />
              <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString()}`, '']} />
              <Legend />
              <Bar dataKey="current" fill="#3b82f6" name="Atual" />
              <Bar dataKey="recommended" fill="#10b981" name="Recomendado" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// AI Budget Optimizer
function AIBudgetOptimizer({ 
  allocations, 
  optimizations, 
  onApplyOptimization,
  onAutoOptimize 
}: {
  allocations: BudgetAllocation[]
  optimizations: BudgetOptimization[]
  onApplyOptimization: (optimization: BudgetOptimization) => void
  onAutoOptimize: () => void
}) {
  const [autoOptimizeEnabled, setAutoOptimizeEnabled] = useState(false)

  const getOptimizationIcon = (type: string) => {
    const icons = {
      increase: <ArrowUpRight className="h-4 w-4 text-green-600" />,
      decrease: <ArrowDownRight className="h-4 w-4 text-red-600" />,
      redistribute: <Zap className="h-4 w-4 text-blue-600" />,
      pause: <Pause className="h-4 w-4 text-gray-600" />
    }
    return icons[type as keyof typeof icons]
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    }
    return colors[priority as keyof typeof colors]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Otimizador IA
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoOptimizeEnabled}
                onCheckedChange={setAutoOptimizeEnabled}
              />
              <span className="text-sm">Auto-otimização</span>
            </div>
            <Button
              onClick={onAutoOptimize}
              className="bg-gradient-to-r from-purple-500 to-indigo-500"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Otimizar Tudo
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {optimizations.map(optimization => {
            const campaign = allocations.find(a => a.id === optimization.campaign_id)
            if (!campaign) return null

            return (
              <div 
                key={optimization.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getOptimizationIcon(optimization.type)}
                    <div>
                      <h4 className="font-semibold">{campaign.campaign_name}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {optimization.type} • Confiança: {optimization.confidence}%
                      </p>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(optimization.priority)}>
                    {optimization.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-gray-600">Orçamento Atual</div>
                    <div className="text-lg font-semibold">
                      R$ {optimization.current_amount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Recomendado</div>
                    <div className="text-lg font-semibold text-blue-600">
                      R$ {optimization.recommended_amount.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm font-medium mb-1">Impacto Esperado:</div>
                  <p className="text-sm text-gray-700">{optimization.expected_impact}</p>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium mb-1">Justificativa da IA:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {optimization.reasoning.map((reason, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">
                      Baseado em dados dos últimos 30 dias
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => onApplyOptimization(optimization)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL  
// ==================================================

export default function IntelligentBudgetPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([])
  const [optimizations, setOptimizations] = useState<BudgetOptimization[]>([])
  const [insights, setInsights] = useState<BudgetInsight[]>([])
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      loadBudgetData()
    }
  }, [user])

  const loadBudgetData = async () => {
    try {
      setLoading(true)

      // Mock data - em produção viria do banco e APIs das plataformas
      const mockAllocations: BudgetAllocation[] = [
        {
          id: '1',
          campaign_name: 'Black Friday - Facebook',
          platform: 'facebook',
          current_budget: 5000,
          recommended_budget: 6200,
          performance_score: 8.7,
          roas: 4.2,
          spend_rate: 0.85,
          remaining_days: 15,
          status: 'optimal',
          ai_confidence: 94
        },
        {
          id: '2',
          campaign_name: 'Instagram Stories Jovem',
          platform: 'instagram',
          current_budget: 2500,
          recommended_budget: 1800,
          performance_score: 5.2,
          roas: 2.1,
          spend_rate: 1.2,
          remaining_days: 12,
          status: 'underperforming',
          ai_confidence: 89
        },
        {
          id: '3',
          campaign_name: 'Google Ads Premium',
          platform: 'google',
          current_budget: 8000,
          recommended_budget: 8500,
          performance_score: 9.1,
          roas: 3.8,
          spend_rate: 0.75,
          remaining_days: 20,
          status: 'optimal',
          ai_confidence: 96
        }
      ]

      const mockOptimizations: BudgetOptimization[] = [
        {
          id: '1',
          type: 'increase',
          campaign_id: '1',
          current_amount: 5000,
          recommended_amount: 6200,
          expected_impact: '+24% conversões, +18% receita estimada',
          confidence: 94,
          reasoning: [
            'ROAS de 4.2x está muito acima da meta',
            'Taxa de conversão cresceu 15% na última semana',
            'Público ainda não saturado (overlap < 20%)',
            'Competição baixa no segmento premium'
          ],
          priority: 'high'
        },
        {
          id: '2',
          type: 'decrease',
          campaign_id: '2',
          current_amount: 2500,
          recommended_amount: 1800,
          expected_impact: 'Economia de R$ 700, -5% conversões apenas',
          confidence: 89,
          reasoning: [
            'ROAS de 2.1x está abaixo da meta de 3x',
            'CPC aumentou 25% nos últimos 7 dias',
            'Taxa de rejeição alta (78%)',
            'Público jovem saturado neste segmento'
          ],
          priority: 'high'
        },
        {
          id: '3',
          type: 'redistribute',
          campaign_id: '3',
          current_amount: 8000,
          recommended_amount: 8500,
          expected_impact: '+12% conversões com realocação de horários',
          confidence: 96,
          reasoning: [
            'Performance excepcional nos fins de semana',
            'CPC 30% menor entre 18h-22h',
            'Oportunidade de expansão para mobile',
            'Keywords de cauda longa com potencial'
          ],
          priority: 'medium'
        }
      ]

      const mockInsights: BudgetInsight[] = [
        {
          id: '1',
          title: 'Oportunidade de Economia',
          description: 'Reduzindo orçamento de campanhas com baixo ROAS, você pode economizar R$ 700/mês',
          impact: 'Economia de R$ 8.400 no ano',
          action: 'Revisar campanhas Instagram',
          savings_potential: 8400,
          type: 'optimization'
        },
        {
          id: '2',
          title: 'Campanhas Subutilizadas',
          description: 'Facebook Ads tem orçamento disponível e alta performance',
          impact: 'Potencial de +24% conversões',
          action: 'Aumentar investimento',
          savings_potential: 0,
          type: 'opportunity'
        }
      ]

      setAllocations(mockAllocations)
      setOptimizations(mockOptimizations)
      setInsights(mockInsights)

    } catch (error) {
      console.error('Erro ao carregar dados de orçamento:', error)
      toast.error('Erro ao carregar otimizações')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyOptimization = async (optimization: BudgetOptimization) => {
    const campaign = allocations.find(a => a.id === optimization.campaign_id)
    if (!campaign) return

    toast.success(`Aplicando otimização para "${campaign.campaign_name}"...`)
    
    // Aqui seria feita a integração real com as APIs das plataformas
    // Por exemplo: Meta Marketing API, Google Ads API, etc.
    
    // Simular aplicação da otimização
    setTimeout(() => {
      setAllocations(prev => 
        prev.map(allocation => 
          allocation.id === optimization.campaign_id
            ? { ...allocation, current_budget: optimization.recommended_amount }
            : allocation
        )
      )
      
      setOptimizations(prev => 
        prev.filter(opt => opt.id !== optimization.id)
      )
      
      toast.success('Otimização aplicada com sucesso!')
    }, 2000)
  }

  const handleAutoOptimize = async () => {
    toast.success('Iniciando otimização automática de todos os orçamentos...')
    
    // Aplicar todas as otimizações automaticamente
    setTimeout(() => {
      optimizations.forEach(opt => handleApplyOptimization(opt))
      toast.success('Otimização automática concluída!')
    }, 3000)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-[#121212] min-h-screen">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
          <Topbar 
            name="Otimização de Orçamento"
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64" />
                <div className="grid grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="h-96 bg-gray-200 rounded" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Otimização Inteligente de Orçamento"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Otimização de Orçamento</h1>
                  <p className="text-gray-600">IA realoca recursos para máxima performance</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </div>

            {/* Overview */}
            <BudgetOverview allocations={allocations} />

            {/* Charts */}
            <BudgetDistributionChart allocations={allocations} />

            {/* AI Optimizer */}
            <AIBudgetOptimizer 
              allocations={allocations}
              optimizations={optimizations}
              onApplyOptimization={handleApplyOptimization}
              onAutoOptimize={handleAutoOptimize}
            />
          </div>
        </main>
      </div>
    </div>
  )
}