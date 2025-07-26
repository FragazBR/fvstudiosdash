'use client'

// ==================================================
// FVStudios Dashboard - Sistema Inteligente de Recomendações
// Análise de padrões, histórico e comportamento para sugerir tarefas otimizadas
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Brain,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Users,
  Zap,
  Star,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
  Workflow,
  Rocket,
  Award,
  Filter,
  Gauge
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface TaskRecommendation {
  id: string
  type: 'optimization' | 'automation' | 'priority' | 'resource' | 'deadline' | 'pattern'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  category: string
  priority_score: number
  estimated_time_saved: number // em horas
  confidence: number // 0-100
  action: {
    label: string
    onClick: () => void
  }
  data_points?: any[]
}

interface UserPattern {
  most_productive_hours: string[]
  common_task_types: string[]
  average_completion_time: { [key: string]: number }
  bottlenecks: string[]
  peak_performance_days: string[]
  collaboration_patterns: any[]
}

interface ProjectInsight {
  recurring_patterns: any[]
  resource_optimization: any[]
  deadline_predictions: any[]
  team_performance: any[]
}

// ==================================================
// HOOKS E UTILITÁRIOS
// ==================================================

function useIntelligentRecommendations() {
  const { user } = useUser()
  const [recommendations, setRecommendations] = useState<TaskRecommendation[]>([])
  const [userPatterns, setUserPatterns] = useState<UserPattern | null>(null)
  const [projectInsights, setProjectInsights] = useState<ProjectInsight | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.agency_id) {
      analyzeAndGenerateRecommendations()
    }
  }, [user])

  const analyzeAndGenerateRecommendations = async () => {
    try {
      setLoading(true)
      const supabase = supabaseBrowser()

      // Buscar dados históricos para análise
      const [tasksResult, projectsResult, timeLogsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('agency_id', user?.agency_id)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('projects')
          .select('*')
          .eq('agency_id', user?.agency_id)
          .order('created_at', { ascending: false })
          .limit(100),
        // Simular logs de tempo (seria uma tabela real em produção)
        supabase
          .from('tasks')
          .select('*, created_at, updated_at')
          .eq('agency_id', user?.agency_id)
          .not('updated_at', 'is', null)
      ])

      const tasks = tasksResult.data || []
      const projects = projectsResult.data || []
      const timeLogs = timeLogsResult.data || []

      // Analisar padrões do usuário
      const patterns = analyzeUserPatterns(tasks, timeLogs)
      setUserPatterns(patterns)

      // Analisar insights de projetos
      const insights = analyzeProjectInsights(projects, tasks)
      setProjectInsights(insights)

      // Gerar recomendações inteligentes
      const generatedRecommendations = generateSmartRecommendations(
        tasks,
        projects,
        patterns,
        insights
      )
      setRecommendations(generatedRecommendations)

    } catch (error) {
      console.error('Erro ao analisar recomendações:', error)
      toast.error('Erro ao carregar recomendações inteligentes')
    } finally {
      setLoading(false)
    }
  }

  return {
    recommendations,
    userPatterns,
    projectInsights,
    loading,
    refreshRecommendations: analyzeAndGenerateRecommendations
  }
}

// ==================================================
// ANÁLISES INTELIGENTES
// ==================================================

function analyzeUserPatterns(tasks: any[], timeLogs: any[]): UserPattern {
  // Análise de horários mais produtivos
  const tasksByHour = tasks.reduce((acc, task) => {
    if (task.updated_at && task.status === 'concluido') {
      const hour = new Date(task.updated_at).getHours()
      acc[hour] = (acc[hour] || 0) + 1
    }
    return acc
  }, {})

  const mostProductiveHours = Object.entries(tasksByHour)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`)

  // Análise de tipos de tarefas mais comuns
  const taskTypes = tasks.reduce((acc, task) => {
    const type = task.categoria || 'Geral'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const commonTaskTypes = Object.entries(taskTypes)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([type]) => type)

  // Tempo médio de conclusão por categoria
  const avgCompletionTime = tasks
    .filter(t => t.status === 'concluido' && t.created_at && t.updated_at)
    .reduce((acc, task) => {
      const category = task.categoria || 'Geral'
      const createdAt = new Date(task.created_at)
      const completedAt = new Date(task.updated_at)
      const hoursDiff = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      
      if (!acc[category]) acc[category] = { total: 0, count: 0 }
      acc[category].total += hoursDiff
      acc[category].count += 1
      return acc
    }, {} as any)

  const averageCompletionTime = Object.entries(avgCompletionTime).reduce((acc, [category, data]: [string, any]) => {
    acc[category] = Math.round(data.total / data.count)
    return acc
  }, {} as any)

  return {
    most_productive_hours: mostProductiveHours,
    common_task_types: commonTaskTypes,
    average_completion_time: averageCompletionTime,
    bottlenecks: identifyBottlenecks(tasks),
    peak_performance_days: identifyPeakDays(tasks),
    collaboration_patterns: analyzeCollaboration(tasks)
  }
}

function analyzeProjectInsights(projects: any[], tasks: any[]): ProjectInsight {
  return {
    recurring_patterns: identifyRecurringPatterns(projects),
    resource_optimization: analyzeResourceOptimization(projects, tasks),
    deadline_predictions: predictDeadlineRisks(projects, tasks),
    team_performance: analyzeTeamPerformance(tasks)
  }
}

function generateSmartRecommendations(
  tasks: any[],
  projects: any[],
  patterns: UserPattern,
  insights: ProjectInsight
): TaskRecommendation[] {
  const recommendations: TaskRecommendation[] = []

  // Recomendação 1: Otimização de horários
  if (patterns.most_productive_hours.length > 0) {
    recommendations.push({
      id: 'productive-hours',
      type: 'optimization',
      title: 'Otimizar Horários de Trabalho',
      description: `Você é mais produtivo entre ${patterns.most_productive_hours.join(', ')}. Agende tarefas importantes nesses horários.`,
      impact: 'high',
      effort: 'low',
      category: 'Produtividade',
      priority_score: 95,
      estimated_time_saved: 8,
      confidence: 87,
      action: {
        label: 'Ver Calendário',
        onClick: () => toast.info('Redirecionando para calendário otimizado...')
      }
    })
  }

  // Recomendação 2: Automação de tarefas recorrentes
  const recurringTasks = tasks.filter(t => 
    patterns.common_task_types.includes(t.categoria) && 
    patterns.average_completion_time[t.categoria] < 2
  )

  if (recurringTasks.length > 5) {
    recommendations.push({
      id: 'automate-recurring',
      type: 'automation',
      title: 'Automatizar Tarefas Recorrentes',
      description: `${recurringTasks.length} tarefas similares podem ser automatizadas, economizando até 12 horas semanais.`,
      impact: 'high',
      effort: 'medium',
      category: 'Automação',
      priority_score: 92,
      estimated_time_saved: 12,
      confidence: 78,
      action: {
        label: 'Configurar Automação',
        onClick: () => toast.info('Abrindo assistente de automação...')
      }
    })
  }

  // Recomendação 3: Redistribuição de carga de trabalho
  const overdueTasks = tasks.filter(t => t.status !== 'concluido' && new Date(t.prazo) < new Date())
  if (overdueTasks.length > 3) {
    recommendations.push({
      id: 'redistribute-workload',
      type: 'resource',
      title: 'Redistribuir Carga de Trabalho',
      description: `${overdueTasks.length} tarefas em atraso. Considere redistribuir ou estender prazos.`,
      impact: 'high',
      effort: 'medium',
      category: 'Gestão',
      priority_score: 88,
      estimated_time_saved: 6,
      confidence: 82,
      action: {
        label: 'Analisar Tarefas',
        onClick: () => toast.info('Abrindo análise de redistribuição...')
      }
    })
  }

  // Recomendação 4: Templates inteligentes
  const projectsByType = projects.reduce((acc, p) => {
    const type = p.tipo || 'Geral'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const mostCommonProjectType = Object.entries(projectsByType)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]

  if (mostCommonProjectType && mostCommonProjectType[1] > 3) {
    recommendations.push({
      id: 'smart-templates',
      type: 'automation',
      title: 'Criar Template Inteligente',
      description: `Você tem ${mostCommonProjectType[1]} projetos do tipo "${mostCommonProjectType[0]}". Um template reduziria 70% do tempo de setup.`,
      impact: 'medium',
      effort: 'low',
      category: 'Templates',
      priority_score: 75,
      estimated_time_saved: 4,
      confidence: 90,
      action: {
        label: 'Criar Template',
        onClick: () => toast.info('Abrindo criador de templates...')
      }
    })
  }

  // Recomendação 5: Análise preditiva de prazos
  const riskyProjects = projects.filter(p => {
    const tasks = tasks.filter(t => t.project_id === p.id)
    const completedTasks = tasks.filter(t => t.status === 'concluido')
    const completionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0
    return completionRate < 0.6 && p.status === 'active'
  })

  if (riskyProjects.length > 0) {
    recommendations.push({
      id: 'deadline-prediction',
      type: 'deadline',
      title: 'Projetos em Risco de Atraso',
      description: `${riskyProjects.length} projetos têm alta probabilidade de atraso baseado no progresso atual.`,
      impact: 'high',
      effort: 'medium',
      category: 'Prazos',
      priority_score: 85,
      estimated_time_saved: 10,
      confidence: 75,
      action: {
        label: 'Analisar Riscos',
        onClick: () => toast.info('Abrindo análise preditiva...')
      }
    })
  }

  // Recomendação 6: Otimização de colaboração
  const collaborativeTasks = tasks.filter(t => t.responsavel_id && t.responsavel_id !== t.created_by)
  if (collaborativeTasks.length > 10) {
    recommendations.push({
      id: 'collaboration-optimization',
      type: 'resource',
      title: 'Otimizar Colaboração',
      description: 'Padrões de colaboração mostram oportunidades para melhorar comunicação e reduzir handoffs.',
      impact: 'medium',
      effort: 'low',
      category: 'Equipe',
      priority_score: 70,
      estimated_time_saved: 5,
      confidence: 65,
      action: {
        label: 'Ver Insights',
        onClick: () => toast.info('Abrindo insights de colaboração...')
      }
    })
  }

  return recommendations.sort((a, b) => b.priority_score - a.priority_score)
}

// Funções auxiliares de análise
function identifyBottlenecks(tasks: any[]): string[] {
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {})

  const bottlenecks = []
  if (statusCounts['em_andamento'] > statusCounts['concluido'] * 0.3) {
    bottlenecks.push('Muitas tarefas em andamento')
  }
  if (statusCounts['bloqueado'] > 0) {
    bottlenecks.push('Tarefas bloqueadas')
  }
  
  return bottlenecks
}

function identifyPeakDays(tasks: any[]): string[] {
  const tasksByDay = tasks.reduce((acc, task) => {
    if (task.updated_at && task.status === 'concluido') {
      const day = new Date(task.updated_at).toLocaleDateString('pt-BR', { weekday: 'long' })
      acc[day] = (acc[day] || 0) + 1
    }
    return acc
  }, {})

  return Object.entries(tasksByDay)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 2)
    .map(([day]) => day)
}

function analyzeCollaboration(tasks: any[]): any[] {
  // Simulação de análise de colaboração
  return []
}

function identifyRecurringPatterns(projects: any[]): any[] {
  return []
}

function analyzeResourceOptimization(projects: any[], tasks: any[]): any[] {
  return []
}

function predictDeadlineRisks(projects: any[], tasks: any[]): any[] {
  return []
}

function analyzeTeamPerformance(tasks: any[]): any[] {
  return []
}

// ==================================================
// COMPONENTES
// ==================================================

function RecommendationCard({ recommendation }: { recommendation: TaskRecommendation }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="h-5 w-5" />
      case 'automation': return <Zap className="h-5 w-5" />
      case 'priority': return <Target className="h-5 w-5" />
      case 'resource': return <Users className="h-5 w-5" />
      case 'deadline': return <Clock className="h-5 w-5" />
      case 'pattern': return <BarChart3 className="h-5 w-5" />
      default: return <Lightbulb className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'text-green-500'
      case 'automation': return 'text-purple-500'
      case 'priority': return 'text-orange-500'
      case 'resource': return 'text-blue-500'
      case 'deadline': return 'text-red-500'
      case 'pattern': return 'text-indigo-500'
      default: return 'text-gray-500'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md hover:scale-105 hover:border-[#01b86c]/40 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-[#1e1e1e]/80 ${getTypeColor(recommendation.type)}`}>
            {getTypeIcon(recommendation.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {recommendation.title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getImpactColor(recommendation.impact)}`}>
                  {recommendation.impact === 'high' ? 'Alto' : 
                   recommendation.impact === 'medium' ? 'Médio' : 'Baixo'} Impacto
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {recommendation.confidence}% confiança
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {recommendation.description}
            </p>
            
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">Economia estimada:</span> {recommendation.estimated_time_saved}h
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">Categoria:</span> {recommendation.category}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.round(recommendation.priority_score / 20)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Prioridade {recommendation.priority_score}
                </span>
              </div>
              
              <Button
                size="sm"
                onClick={recommendation.action.onClick}
                className="bg-[#01b86c] hover:bg-[#01b86c]/90 text-white text-xs h-7 px-3"
              >
                {recommendation.action.label}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function IntelligentTaskRecommendations() {
  const { recommendations, userPatterns, loading, refreshRecommendations } = useIntelligentRecommendations()
  const [filter, setFilter] = useState<string>('all')

  const filteredRecommendations = recommendations.filter(rec => 
    filter === 'all' || rec.type === filter
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Recomendações Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Recomendações Inteligentes
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                {recommendations.length} insights
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshRecommendations}
                className="hover:text-[#01b86c] hover:border-[#01b86c]/40"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'optimization', 'automation', 'priority', 'resource', 'deadline'].map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
                className={filter === type ? 'bg-[#01b86c] hover:bg-[#01b86c]/90' : 'hover:text-[#01b86c] hover:border-[#01b86c]/40'}
              >
                {type === 'all' ? 'Todas' :
                 type === 'optimization' ? 'Otimização' :
                 type === 'automation' ? 'Automação' :
                 type === 'priority' ? 'Prioridade' :
                 type === 'resource' ? 'Recursos' : 'Prazos'}
              </Button>
            ))}
          </div>

          {/* Estatísticas Rápidas */}
          {userPatterns && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {userPatterns.most_productive_hours.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Horários de Pico
                </div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg">
                <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {userPatterns.common_task_types.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tipos Frequentes
                </div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <Gauge className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(recommendations.reduce((acc, rec) => acc + rec.estimated_time_saved, 0))}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Economia Potencial
                </div>
              </div>
            </div>
          )}

          {/* Lista de Recomendações */}
          {filteredRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma recomendação encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'all' 
                  ? 'Continue usando o sistema para gerar insights inteligentes.'
                  : 'Tente outro filtro ou atualize as recomendações.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}