'use client'

// ==================================================
// FVStudios Dashboard - Estação de Trabalho Inteligente
// Sistema completo integrado: Kanban + AI + Automação + Notificações
// ==================================================

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import PersonalTaskBoard from '@/components/personal-task-board'
import TimelineView from '@/components/timeline-view'
import { IntelligentProjectWizard } from '@/components/intelligent-project-wizard'
import { RealtimeNotifications } from '@/components/realtime-notifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Wand2,
  Sparkles,
  Brain,
  Zap,
  Target,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  BarChart3,
  Activity,
  Plus,
  Settings,
  Filter,
  Search,
  Eye,
  Bell,
  Rocket,
  Bolt,
  Cpu,
  Database,
  Globe,
  Smartphone,
  Palette,
  Megaphone,
  FileText,
  CheckCircle,
  AlertTriangle,
  Star,
  Award,
  Trophy,
  Briefcase,
  FolderKanban,
  Layout,
  Layers,
  Command,
  Workflow,
  GitBranch,
  Gauge,
  PieChart,
  LineChart
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { ProjectAutomationEngine } from '@/lib/project-automation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface WorkstationStats {
  total_projects: number
  active_projects: number
  completed_projects: number
  overdue_projects: number
  total_stages: number
  completed_stages: number
  team_velocity: number
  automation_rate: number
  avg_completion_time: number
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  action: () => void
  badge?: string
}

interface SmartInsight {
  id: string
  type: 'warning' | 'success' | 'info' | 'tip'
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

// ==================================================
// COMPONENTES
// ==================================================

// Header Inteligente com IA
function IntelligentHeader() {
  const { user } = useUser()
  const [stats, setStats] = useState<WorkstationStats>({
    total_projects: 0,
    active_projects: 0,
    completed_projects: 0,
    overdue_projects: 0,
    total_stages: 0,
    completed_stages: 0,
    team_velocity: 0,
    automation_rate: 0,
    avg_completion_time: 0
  })

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      const supabase = supabaseBrowser()
      
      // Verificar se o usuário tem agency_id
      if (!user?.agency_id) {
        console.log('Usuário sem agency_id para estatísticas:', user)
        return
      }
      
      // Carregar estatísticas em paralelo - apenas da agência do usuário
      const [projectsResult, tasksResult] = await Promise.all([
        supabase.from('projects').select('status').eq('agency_id', user.agency_id),
        supabase.from('tasks').select('status, created_at, updated_at').eq('agency_id', user.agency_id)
      ])

      const projects = projectsResult.data || []
      const tasks = tasksResult.data || []

      console.log('Estatísticas carregadas:', { projects, tasks })

      setStats({
        total_projects: projects.length,
        active_projects: projects.filter(p => p.status === 'active').length,
        completed_projects: projects.filter(p => p.status === 'completed').length,
        overdue_projects: projects.filter(p => p.status === 'overdue').length,
        total_stages: tasks.length, // Usando tasks como etapas
        completed_stages: tasks.filter(s => s.status === 'concluido').length,
        team_velocity: calculateVelocity(tasks),
        automation_rate: 85, // Mock - seria calculado baseado em projetos auto-gerados
        avg_completion_time: 14 // Mock - média de dias para conclusão
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const calculateVelocity = (tasks: any[]): number => {
    const recentTasks = tasks.filter(task => {
      const updatedAt = new Date(task.updated_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return updatedAt > weekAgo && task.status === 'concluido'
    })
    return recentTasks.length
  }

  const progressPercentage = stats.total_stages > 0 ? Math.round((stats.completed_stages / stats.total_stages) * 100) : 0

  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 rounded-lg mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        {/* Welcome Section */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Bem-vindo, {user?.name}! 🚀
              </h1>
              <p className="text-blue-100">
                Sua estação de trabalho inteligente está otimizada e pronta
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm">Projetos Ativos</span>
              </div>
              <div className="text-xl font-bold">{stats.active_projects}</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Velocidade da Equipe</span>
              </div>
              <div className="text-xl font-bold">{stats.team_velocity}/sem</div>
            </div>

            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="text-sm">Automação</span>
              </div>
              <div className="text-xl font-bold">{stats.automation_rate}%</div>
            </div>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray={`${progressPercentage * 0.628} ${100 * 0.628}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold">{progressPercentage}%</div>
                <div className="text-xs text-blue-100">Progresso</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Insights Inteligentes
function SmartInsights() {
  const [insights, setInsights] = useState<SmartInsight[]>([])

  useEffect(() => {
    generateSmartInsights()
  }, [])

  const generateSmartInsights = async () => {
    // Simular análise inteligente (seria feita com IA real)
    const mockInsights: SmartInsight[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Projetos com Risco de Atraso',
        message: '3 projetos podem atrasar baseado no progresso atual. Considere realocar recursos.',
        action: {
          label: 'Ver Projetos',
          onClick: () => toast.info('Navegando para projetos em risco...')
        }
      },
      {
        id: '2',
        type: 'success',
        title: 'Automação Funcionando',
        message: '85% dos seus projetos foram criados automaticamente este mês!',
      },
      {
        id: '3',
        type: 'tip',
        title: 'Dica de Produtividade',
        message: 'Use templates personalizados para acelerar a criação de projetos similares.',
        action: {
          label: 'Ver Templates',
          onClick: () => toast.info('Abrindo catálogo de templates...')
        }
      },
      {
        id: '4',
        type: 'info',
        title: 'Integração Disponível',
        message: 'Conecte seu Google Calendar para sincronizar prazos automaticamente.',
        action: {
          label: 'Configurar',
          onClick: () => toast.info('Abrindo configurações de integração...')
        }
      }
    ]

    setInsights(mockInsights)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'info': return <Brain className="h-5 w-5 text-blue-500" />
      case 'tip': return <Sparkles className="h-5 w-5 text-purple-500" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case 'success': return 'border-l-green-500 bg-green-50 dark:bg-green-900/10'
      case 'info': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
      case 'tip': return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10'
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Insights Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {insight.message}
                  </p>
                  {insight.action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={insight.action.onClick}
                      className="text-xs h-7 px-3"
                    >
                      {insight.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Ações Rápidas Inteligentes
function QuickActions({ onCreateProject }: { onCreateProject: () => void }) {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      id: 'create-project',
      title: 'Novo Projeto Inteligente',
      description: 'Criar com IA e automação',
      icon: <Wand2 className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-blue-500 to-purple-500',
      action: onCreateProject,
      badge: 'IA'
    },
    {
      id: 'templates',
      title: 'Gerenciar Templates',
      description: 'Criar e editar templates',
      icon: <Layout className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-green-500 to-teal-500',
      action: () => router.push('/templates')
    },
    {
      id: 'analytics',
      title: 'Analytics Avançados',
      description: 'Insights e relatórios',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
      action: () => router.push('/analytics')
    },
    {
      id: 'automation',
      title: 'Central de Automação',
      description: 'Configurar automações',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      action: () => router.push('/automation')
    },
    {
      id: 'integrations',
      title: 'Integrações',
      description: 'Conectar ferramentas',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      action: () => router.push('/integrations')
    },
    {
      id: 'ai-assistant',
      title: 'Assistente IA',
      description: 'Chat inteligente',
      icon: <Brain className="h-5 w-5" />,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      action: () => toast.info('Assistente IA em breve!'),
      badge: 'Novo'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bolt className="h-5 w-5 text-yellow-500" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto p-4 justify-start hover:scale-105 transition-transform"
              onClick={action.action}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded-lg text-white ${action.color}`}>
                  {action.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{action.title}</span>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {action.description}
                  </span>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Métricas de Performance
function PerformanceMetrics() {
  const metrics = [
    {
      label: 'Eficiência da Equipe',
      value: 94,
      trend: '+5%',
      icon: <Users className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      label: 'Tempo Médio de Entrega',
      value: 12,
      unit: 'dias',
      trend: '-2 dias',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      label: 'Taxa de Automação',
      value: 85,
      trend: '+12%',
      icon: <Cpu className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      label: 'Satisfação do Cliente',
      value: 4.8,
      unit: '/5',
      trend: '+0.3',
      icon: <Star className="h-4 w-4" />,
      color: 'text-yellow-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-green-500" />
          Performance em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className={`inline-flex p-2 rounded-full bg-gray-100 dark:bg-gray-700 mb-2 ${metric.color}`}>
                {metric.icon}
              </div>
              <div className="text-2xl font-bold">
                {metric.value}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.unit}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {metric.label}
              </div>
              <div className={`text-xs font-medium ${metric.color}`}>
                {metric.trend}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Analytics View com dados reais
function AnalyticsView({ userId }: { userId: string }) {
  const { user } = useUser()
  const [analytics, setAnalytics] = useState<any>({
    totalProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    clients: 0,
    projectsByStatus: {}
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user?.agency_id) return
      
      try {
        const supabase = supabaseBrowser()
        const [projectsResult, tasksResult, clientsResult] = await Promise.all([
          supabase.from('projects').select('status').eq('agency_id', user.agency_id),
          supabase.from('tasks').select('status').eq('agency_id', user.agency_id),
          supabase.from('contacts').select('id').eq('agency_id', user.agency_id)
        ])

        const projects = projectsResult.data || []
        const tasks = tasksResult.data || []
        const clients = clientsResult.data || []

        const projectsByStatus = projects.reduce((acc: any, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1
          return acc
        }, {})

        setAnalytics({
          totalProjects: projects.length,
          completedTasks: tasks.filter(t => t.status === 'concluido').length,
          pendingTasks: tasks.filter(t => t.status === 'a_fazer').length,
          clients: clients.length,
          projectsByStatus
        })
      } catch (error) {
        console.error('Erro ao carregar analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) loadAnalytics()
  }, [user])

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Projetos</p>
                <p className="text-2xl font-bold">{analytics.totalProjects}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tarefas Concluídas</p>
                <p className="text-2xl font-bold">{analytics.completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tarefas Pendentes</p>
                <p className="text-2xl font-bold">{analytics.pendingTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes</p>
                <p className="text-2xl font-bold">{analytics.clients}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Status dos Projetos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.projectsByStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(count / analytics.totalProjects) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function IntelligentWorkstation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'kanban' | 'timeline' | 'analytics'>('dashboard')
  const { user } = useUser()

  const handleProjectCreated = (projectId: string) => {
    toast.success('Projeto criado com sucesso! Redirecionando...')
    // Atualizar dados do Kanban ou outras visualizações
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Estação de Trabalho Inteligente"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Inteligente */}
            <IntelligentHeader />

            {/* Navigation Tabs */}
            <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)} className="mb-6">
              <TabsList className="grid grid-cols-4 w-full lg:w-96">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  <span className="hidden sm:inline">Tarefas</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>

              {/* Dashboard View */}
              <TabsContent value="dashboard" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    <QuickActions onCreateProject={() => setShowWizard(true)} />
                    <PerformanceMetrics />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <SmartInsights />
                    
                    {/* Notificações Integradas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-blue-500" />
                            Notificações
                          </div>
                          <RealtimeNotifications />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-4">
                          <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Sistema de notificações em tempo real ativo
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Tarefas View */}
              <TabsContent value="kanban" className="space-y-6">
                <PersonalTaskBoard />
              </TabsContent>

              {/* Timeline View */}
              <TabsContent value="timeline" className="space-y-6">
                <TimelineView />
              </TabsContent>

              {/* Analytics View */}
              <TabsContent value="analytics" className="space-y-6">
                <AnalyticsView userId={user.id} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Wizard de Projeto Inteligente */}
      <IntelligentProjectWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  )
}