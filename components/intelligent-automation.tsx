'use client'

// ==================================================
// FVStudios Dashboard - Sistema de Automação Inteligente
// Automação avançada para projetos recorrentes com IA
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Zap,
  Bot,
  Calendar,
  Repeat,
  Clock,
  CheckCircle,
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Workflow,
  GitBranch,
  Sparkles,
  Brain,
  Award,
  AlertTriangle,
  Eye,
  Copy,
  Download,
  Upload,
  Rocket,
  Gauge,
  Activity,
  Database,
  RefreshCw,
  Bell
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface AutomationRule {
  id: string
  name: string
  description: string
  type: 'recurring_project' | 'task_assignment' | 'notification' | 'report_generation' | 'workflow'
  trigger_type: 'schedule' | 'event' | 'condition'
  trigger_config: {
    schedule?: string // cron expression
    event?: string
    conditions?: any[]
  }
  actions: AutomationAction[]
  status: 'active' | 'inactive' | 'testing'
  success_rate: number
  executions_count: number
  last_execution: string | null
  created_at: string
  updated_at: string
}

interface AutomationAction {
  id: string
  type: 'create_project' | 'assign_task' | 'send_notification' | 'generate_report' | 'update_status'
  config: any
  order: number
}

interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: 'project' | 'task' | 'client' | 'report'
  template_config: any
  usage_count: number
  success_rate: number
  estimated_time_saved: number // em horas
}

interface AutomationInsight {
  id: string
  type: 'optimization' | 'pattern' | 'anomaly' | 'suggestion'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  recommendation: string
  data_points: any[]
}

// ==================================================
// MOTOR DE AUTOMAÇÃO
// ==================================================

class AutomationEngine {
  static templates: AutomationTemplate[] = [
    {
      id: 'monthly-client-report',
      name: 'Relatório Mensal para Cliente',
      description: 'Gera e envia automaticamente relatório de progresso mensal',
      category: 'report',
      template_config: {
        schedule: '0 9 1 * *', // Todo dia 1 às 9h
        actions: [
          { type: 'generate_report', config: { template: 'client_progress' } },
          { type: 'send_notification', config: { recipients: 'client', template: 'monthly_report' } }
        ]
      },
      usage_count: 45,
      success_rate: 96,
      estimated_time_saved: 8
    },
    {
      id: 'project-kickoff',
      name: 'Kickoff Automático de Projeto',
      description: 'Cria estrutura inicial de projeto com tarefas padrão',
      category: 'project',
      template_config: {
        trigger: 'project_created',
        actions: [
          { type: 'create_task', config: { template: 'kickoff_meeting' } },
          { type: 'create_task', config: { template: 'requirements_gathering' } },
          { type: 'create_task', config: { template: 'initial_planning' } },
          { type: 'assign_task', config: { role: 'project_manager' } }
        ]
      },
      usage_count: 72,
      success_rate: 94,
      estimated_time_saved: 4
    },
    {
      id: 'deadline-alerts',
      name: 'Alertas Inteligentes de Prazo',
      description: 'Sistema proativo de alertas baseado em análise preditiva',
      category: 'task',
      template_config: {
        schedule: '0 */6 * * *', // A cada 6 horas
        conditions: [
          { field: 'deadline_risk', operator: '>', value: 0.7 }
        ],
        actions: [
          { type: 'send_notification', config: { type: 'deadline_warning' } },
          { type: 'suggest_reallocation', config: { threshold: 'high' } }
        ]
      },
      usage_count: 128,
      success_rate: 89,
      estimated_time_saved: 12
    },
    {
      id: 'team-workload-balance',
      name: 'Balanceamento Automático de Carga',
      description: 'Redistribui tarefas automaticamente baseado na capacidade da equipe',
      category: 'task',
      template_config: {
        schedule: '0 8 * * 1', // Toda segunda às 8h
        conditions: [
          { field: 'workload_imbalance', operator: '>', value: 0.3 }
        ],
        actions: [
          { type: 'analyze_workload', config: {} },
          { type: 'suggest_redistribution', config: {} },
          { type: 'auto_reassign', config: { threshold: 'safe' } }
        ]
      },
      usage_count: 36,
      success_rate: 82,
      estimated_time_saved: 6
    },
    {
      id: 'quality-checkpoint',
      name: 'Checkpoint de Qualidade',
      description: 'Executa verificações automáticas de qualidade em marcos do projeto',
      category: 'project',
      template_config: {
        trigger: 'milestone_completed',
        actions: [
          { type: 'run_quality_check', config: { criteria: 'standard' } },
          { type: 'generate_quality_report', config: {} },
          { type: 'notify_stakeholders', config: { if: 'issues_found' } }
        ]
      },
      usage_count: 52,
      success_rate: 91,
      estimated_time_saved: 10
    }
  ]

  static generateInsights(rules: AutomationRule[]): AutomationInsight[] {
    const insights: AutomationInsight[] = []

    // Insight 1: Taxa de sucesso baixa
    const lowSuccessRules = rules.filter(r => r.success_rate < 85)
    if (lowSuccessRules.length > 0) {
      insights.push({
        id: 'low-success-rate',
        type: 'optimization',
        title: 'Automações com Baixa Taxa de Sucesso',
        description: `${lowSuccessRules.length} automações têm taxa de sucesso abaixo de 85%`,
        impact: 'medium',
        recommendation: 'Revisar configurações e adicionar validações extras',
        data_points: lowSuccessRules.map(r => ({ name: r.name, rate: r.success_rate }))
      })
    }

    // Insight 2: Padrões de execução
    const frequentRules = rules.filter(r => r.executions_count > 50)
    if (frequentRules.length > 0) {
      insights.push({
        id: 'frequent-executions',
        type: 'pattern',
        title: 'Automações Mais Utilizadas',
        description: `${frequentRules.length} automações são executadas frequentemente`,
        impact: 'high',
        recommendation: 'Considere otimizar estas automações para máxima eficiência',
        data_points: frequentRules.map(r => ({ name: r.name, count: r.executions_count }))
      })
    }

    // Insight 3: Automações inativas
    const inactiveRules = rules.filter(r => r.status === 'inactive')
    if (inactiveRules.length > 0) {
      insights.push({
        id: 'inactive-rules',
        type: 'anomaly',
        title: 'Automações Inativas',
        description: `${inactiveRules.length} automações estão desativadas`,
        impact: 'low',
        recommendation: 'Revisar se estas automações ainda são necessárias',
        data_points: inactiveRules.map(r => ({ name: r.name, status: r.status }))
      })
    }

    // Insight 4: Oportunidades de automação
    insights.push({
      id: 'automation-opportunities',
      type: 'suggestion',
      title: 'Novas Oportunidades de Automação',
      description: 'Identificamos processos que podem ser automatizados',
      impact: 'high',
      recommendation: 'Implemente automações para relatórios de tempo e follow-ups de cliente',
      data_points: [
        { process: 'Relatórios de Tempo', potential_saving: '4h/semana' },
        { process: 'Follow-ups Cliente', potential_saving: '2h/semana' }
      ]
    })

    return insights
  }

  static calculateTimeSaved(rules: AutomationRule[]): number {
    return rules.reduce((total, rule) => {
      const avgExecutionsPerWeek = rule.executions_count / 12 // Assumindo 3 meses de dados
      const timeSavedPerExecution = this.getEstimatedTimeSaved(rule.type)
      return total + (avgExecutionsPerWeek * timeSavedPerExecution)
    }, 0)
  }

  private static getEstimatedTimeSaved(type: string): number {
    switch (type) {
      case 'recurring_project': return 2
      case 'task_assignment': return 0.5
      case 'notification': return 0.25
      case 'report_generation': return 3
      case 'workflow': return 1.5
      default: return 1
    }
  }
}

// ==================================================
// HOOKS
// ==================================================

function useAutomationData() {
  const { user } = useUser()
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [insights, setInsights] = useState<AutomationInsight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.agency_id) {
      loadAutomationData()
    }
  }, [user])

  const loadAutomationData = async () => {
    try {
      setLoading(true)
      
      // Simular dados de automação (em produção viria do banco)
      const mockRules: AutomationRule[] = [
        {
          id: 'rule-1',
          name: 'Relatórios Mensais Automáticos',
          description: 'Gera e envia relatórios de progresso mensalmente',
          type: 'report_generation',
          trigger_type: 'schedule',
          trigger_config: { schedule: '0 9 1 * *' },
          actions: [
            { id: 'a1', type: 'generate_report', config: { template: 'monthly' }, order: 1 },
            { id: 'a2', type: 'send_notification', config: { recipients: 'clients' }, order: 2 }
          ],
          status: 'active',
          success_rate: 94,
          executions_count: 48,
          last_execution: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'rule-2',
          name: 'Atribuição Inteligente de Tarefas',
          description: 'Atribui tarefas automaticamente baseado na especialidade',
          type: 'task_assignment',
          trigger_type: 'event',
          trigger_config: { event: 'task_created' },
          actions: [
            { id: 'a3', type: 'assign_task', config: { criteria: 'skill_match' }, order: 1 }
          ],
          status: 'active',
          success_rate: 87,
          executions_count: 156,
          last_execution: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'rule-3',
          name: 'Alertas de Prazo Crítico',
          description: 'Envia alertas quando projetos estão em risco de atraso',
          type: 'notification',
          trigger_type: 'condition',
          trigger_config: { 
            conditions: [{ field: 'deadline_risk', operator: '>', value: 0.8 }] 
          },
          actions: [
            { id: 'a4', type: 'send_notification', config: { type: 'urgent' }, order: 1 }
          ],
          status: 'active',
          success_rate: 92,
          executions_count: 23,
          last_execution: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'rule-4',
          name: 'Workflow de Aprovação',
          description: 'Automatiza processo de aprovação de entregas',
          type: 'workflow',
          trigger_type: 'event',
          trigger_config: { event: 'deliverable_submitted' },
          actions: [
            { id: 'a5', type: 'send_notification', config: { role: 'reviewer' }, order: 1 },
            { id: 'a6', type: 'update_status', config: { status: 'under_review' }, order: 2 }
          ],
          status: 'testing',
          success_rate: 76,
          executions_count: 12,
          last_execution: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setRules(mockRules)
      
      // Gerar insights baseados nos dados
      const generatedInsights = AutomationEngine.generateInsights(mockRules)
      setInsights(generatedInsights)

    } catch (error) {
      console.error('Erro ao carregar dados de automação:', error)
      toast.error('Erro ao carregar dados das automações')
    } finally {
      setLoading(false)
    }
  }

  const toggleRuleStatus = async (ruleId: string, newStatus: 'active' | 'inactive') => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, status: newStatus } : rule
    ))
    toast.success(`Automação ${newStatus === 'active' ? 'ativada' : 'desativada'}`)
  }

  return {
    rules,
    insights,
    loading,
    toggleRuleStatus,
    refreshData: loadAutomationData
  }
}

// ==================================================
// COMPONENTES
// ==================================================

function AutomationRuleCard({ rule, onToggleStatus }: { 
  rule: AutomationRule
  onToggleStatus: (id: string, status: 'active' | 'inactive') => void 
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'testing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recurring_project': return <Repeat className="h-5 w-5" />
      case 'task_assignment': return <Users className="h-5 w-5" />
      case 'notification': return <Bell className="h-5 w-5" />
      case 'report_generation': return <BarChart3 className="h-5 w-5" />
      case 'workflow': return <Workflow className="h-5 w-5" />
      default: return <Zap className="h-5 w-5" />
    }
  }

  const getTriggerLabel = (rule: AutomationRule) => {
    switch (rule.trigger_type) {
      case 'schedule': return 'Agendada'
      case 'event': return 'Por Evento'
      case 'condition': return 'Condicional'
      default: return 'Manual'
    }
  }

  return (
    <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md hover:scale-105 hover:border-[#01b86c]/40 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            {getTypeIcon(rule.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {rule.name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getStatusColor(rule.status)}`}>
                  {rule.status === 'active' ? 'Ativa' :
                   rule.status === 'inactive' ? 'Inativa' : 'Teste'}
                </Badge>
                <Switch
                  checked={rule.status === 'active'}
                  onCheckedChange={(checked) => 
                    onToggleStatus(rule.id, checked ? 'active' : 'inactive')
                  }
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {rule.description}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {rule.success_rate}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Taxa de Sucesso
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {rule.executions_count}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Execuções
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {rule.actions.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Ações
                </div>
              </div>
              
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  {getTriggerLabel(rule)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Última execução: {rule.last_execution 
                  ? new Date(rule.last_execution).toLocaleDateString('pt-BR')
                  : 'Nunca'
                }
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs hover:text-[#01b86c] hover:border-[#01b86c]/40"
                  onClick={() => toast.info('Abrindo editor de automação...')}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs hover:text-[#01b86c] hover:border-[#01b86c]/40"
                  onClick={() => toast.info('Visualizando logs...')}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Logs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AutomationTemplateCard({ template }: { template: AutomationTemplate }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'project': return <Target className="h-5 w-5" />
      case 'task': return <CheckCircle className="h-5 w-5" />
      case 'client': return <Users className="h-5 w-5" />
      case 'report': return <BarChart3 className="h-5 w-5" />
      default: return <Sparkles className="h-5 w-5" />
    }
  }

  return (
    <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md hover:scale-105 hover:border-[#01b86c]/40 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            {getCategoryIcon(template.category)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {template.name}
              </h3>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                {template.usage_count} usos
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {template.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  <span className="font-medium">{template.success_rate}%</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">sucesso</span>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  <span className="font-medium">{template.estimated_time_saved}h</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">economizadas</span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs capitalize">
                {template.category}
              </Badge>
              <Button
                size="sm"
                className="bg-[#01b86c] hover:bg-[#01b86c]/90 text-white text-xs h-7 px-3"
                onClick={() => toast.info('Criando automação baseada no template...')}
              >
                <Plus className="h-3 w-3 mr-1" />
                Usar Template
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InsightCard({ insight }: { insight: AutomationInsight }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="h-5 w-5" />
      case 'pattern': return <BarChart3 className="h-5 w-5" />
      case 'anomaly': return <AlertTriangle className="h-5 w-5" />
      case 'suggestion': return <Sparkles className="h-5 w-5" />
      default: return <Brain className="h-5 w-5" />
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
    <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            {getTypeIcon(insight.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {insight.title}
              </h3>
              <Badge className={`text-xs ${getImpactColor(insight.impact)}`}>
                {insight.impact === 'high' ? 'Alto' :
                 insight.impact === 'medium' ? 'Médio' : 'Baixo'} impacto
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {insight.description}
            </p>
            
            <div className="p-3 bg-gray-50 dark:bg-[#1e1e1e]/50 rounded-lg mb-3">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recomendação:
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100">
                {insight.recommendation}
              </div>
            </div>
            
            {insight.data_points && insight.data_points.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Dados:
                </div>
                {insight.data_points.slice(0, 2).map((point, index) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400 pl-2 border-l border-gray-300 dark:border-gray-600">
                    • {JSON.stringify(point).replace(/[{}:"]/g, ' ').trim()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function IntelligentAutomation() {
  const { rules, insights, loading, toggleRuleStatus, refreshData } = useAutomationData()
  const [activeTab, setActiveTab] = useState('rules')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Automação Inteligente
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

  const activeRules = rules.filter(r => r.status === 'active')
  const totalExecutions = rules.reduce((sum, rule) => sum + rule.executions_count, 0)
  const avgSuccessRate = Math.round(rules.reduce((sum, rule) => sum + rule.success_rate, 0) / rules.length)
  const estimatedTimeSaved = AutomationEngine.calculateTimeSaved(rules)

  return (
    <div className="space-y-6">
      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {activeRules.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Automações Ativas
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalExecutions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total de Execuções
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {avgSuccessRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Taxa de Sucesso
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(estimatedTimeSaved)}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tempo Economizado/Semana
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              Central de Automação
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                IA Avançada
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="hover:text-[#01b86c] hover:border-[#01b86c]/40"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
              <Button
                size="sm"
                className="bg-[#01b86c] hover:bg-[#01b86c]/90"
                onClick={() => toast.info('Abrindo criador de automação...')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Automação
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full lg:w-96">
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Regras</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Insights</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* Regras de Automação */}
            <TabsContent value="rules" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rules.map((rule) => (
                  <AutomationRuleCard
                    key={rule.id}
                    rule={rule}
                    onToggleStatus={toggleRuleStatus}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Templates */}
            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {AutomationEngine.templates.map((template) => (
                  <AutomationTemplateCard key={template.id} template={template} />
                ))}
              </div>
            </TabsContent>

            {/* Insights */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <CardTitle className="text-sm">Performance por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(
                        rules.reduce((acc, rule) => {
                          acc[rule.type] = acc[rule.type] || { count: 0, totalSuccess: 0 }
                          acc[rule.type].count++
                          acc[rule.type].totalSuccess += rule.success_rate
                          return acc
                        }, {} as any)
                      ).map(([type, data]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">
                            {type.replace('_', ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={Math.round(data.totalSuccess / data.count)} 
                              className="w-20 h-2" 
                            />
                            <span className="text-sm font-medium">
                              {Math.round(data.totalSuccess / data.count)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <CardTitle className="text-sm">Execuções por Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Gráfico de execuções seria exibido aqui
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}