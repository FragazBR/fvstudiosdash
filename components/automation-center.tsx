'use client'

// ==================================================
// FVStudios Dashboard - Central de Automação Inteligente
// Sistema completo de automação com IA e workflows personalizados
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Zap,
  Bot,
  Settings,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  AlertTriangle,
  Workflow,
  ArrowRight,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Target,
  Users,
  MessageSquare,
  Mail,
  Calendar,
  Database,
  FileText,
  Image,
  Video,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  Lightbulb,
  Brain,
  Sparkles,
  Filter,
  Search,
  MoreVertical,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { SmartActionsEngine, N8nIntegrationManager } from '@/lib/n8n-integration'

// Interfaces
interface AutomationRule {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'draft'
  trigger: {
    type: 'schedule' | 'event' | 'condition' | 'webhook'
    configuration: any
  }
  actions: AutomationAction[]
  conditions?: AutomationCondition[]
  execution_count: number
  success_rate: number
  last_execution?: Date
  created_at: Date
  updated_at: Date
}

interface AutomationAction {
  id: string
  type: 'send_message' | 'create_task' | 'update_status' | 'generate_report' | 'ai_analysis' | 'api_call'
  name: string
  configuration: any
  order: number
}

interface AutomationCondition {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between'
  value: any
  logic: 'and' | 'or'
}

interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: 'marketing' | 'sales' | 'support' | 'operations' | 'reporting'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_setup_time: string
  usage_count: number
  rating: number
  preview_url?: string
  configuration: any
}

interface ExecutionLog {
  id: string
  rule_id: string
  status: 'success' | 'failed' | 'partial'
  started_at: Date
  completed_at?: Date
  duration_ms?: number
  actions_executed: number
  actions_failed: number
  logs: string[]
  error_message?: string
}

// ==================================================
// COMPONENTES
// ==================================================

// Templates de Automação
function AutomationTemplates({ onSelectTemplate }: { onSelectTemplate: (template: AutomationTemplate) => void }) {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = [
    { id: 'all', name: 'Todos', icon: '🎯' },
    { id: 'marketing', name: 'Marketing', icon: '📈' },
    { id: 'sales', name: 'Vendas', icon: '💰' },
    { id: 'support', name: 'Suporte', icon: '🎧' },
    { id: 'operations', name: 'Operações', icon: '⚙️' },
    { id: 'reporting', name: 'Relatórios', icon: '📊' }
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de templates
      const mockTemplates: AutomationTemplate[] = [
        {
          id: '1',
          name: 'Resposta Automática WhatsApp',
          description: 'Responde automaticamente mensagens no WhatsApp com IA e direciona para o time correto',
          category: 'support',
          difficulty: 'beginner',
          estimated_setup_time: '10 minutos',
          usage_count: 245,
          rating: 4.8,
          configuration: {
            triggers: ['whatsapp_message'],
            actions: ['ai_response', 'route_to_team'],
            integrations: ['whatsapp', 'openai']
          }
        },
        {
          id: '2',
          name: 'Lead Scoring Inteligente',
          description: 'Analisa leads automaticamente com IA e prioriza os mais promissores',
          category: 'sales',
          difficulty: 'intermediate',
          estimated_setup_time: '25 minutos',
          usage_count: 156,
          rating: 4.6,
          configuration: {
            triggers: ['new_lead'],
            actions: ['ai_analysis', 'score_calculation', 'assign_salesperson'],
            integrations: ['crm', 'openai', 'email']
          }
        },
        {
          id: '3',
          name: 'Relatório de Performance Semanal',
          description: 'Gera relatórios automáticos de performance das campanhas toda segunda-feira',
          category: 'reporting',
          difficulty: 'beginner',
          estimated_setup_time: '15 minutos',
          usage_count: 189,
          rating: 4.9,
          configuration: {
            triggers: ['schedule_weekly'],
            actions: ['gather_metrics', 'generate_report', 'send_email'],
            integrations: ['facebook_ads', 'google_ads', 'email']
          }
        },
        {
          id: '4',
          name: 'Campanha Inteligente de Remarketing',
          description: 'Cria automaticamente campanhas de remarketing baseadas no comportamento do usuário',
          category: 'marketing',
          difficulty: 'advanced',
          estimated_setup_time: '45 minutos',
          usage_count: 78,
          rating: 4.7,
          configuration: {
            triggers: ['user_behavior'],
            actions: ['audience_analysis', 'creative_generation', 'campaign_creation'],
            integrations: ['facebook_ads', 'google_ads', 'analytics', 'canva']
          }
        },
        {
          id: '5',
          name: 'Backup Automático de Dados',
          description: 'Faz backup automático de todos os dados importantes diariamente',
          category: 'operations',
          difficulty: 'intermediate',
          estimated_setup_time: '20 minutos',
          usage_count: 324,
          rating: 4.5,
          configuration: {
            triggers: ['schedule_daily'],
            actions: ['export_data', 'compress_files', 'upload_cloud'],
            integrations: ['database', 'cloud_storage']
          }
        },
        {
          id: '6',
          name: 'Análise de Sentimento em Comentários',
          description: 'Monitora comentários nas redes sociais e alerta sobre sentimentos negativos',
          category: 'marketing',
          difficulty: 'advanced',
          estimated_setup_time: '35 minutos',
          usage_count: 67,
          rating: 4.4,
          configuration: {
            triggers: ['new_comment'],
            actions: ['sentiment_analysis', 'categorize_comment', 'alert_team'],
            integrations: ['facebook', 'instagram', 'openai', 'slack']
          }
        }
      ]

      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }
    return colors[difficulty as keyof typeof colors]
  }

  const getCategoryIcon = (category: string) => {
    const category_obj = categories.find(c => c.id === category)
    return category_obj?.icon || '🎯'
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar templates de automação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="flex flex-wrap gap-2 pb-4 border-b">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center gap-2"
          >
            <span>{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <Card 
              key={template.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                      <div>
                        <h4 className="font-medium text-sm line-clamp-2">{template.name}</h4>
                        <p className="text-xs text-gray-500 capitalize">{template.category}</p>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>⏱️ {template.estimated_setup_time}</span>
                    <span>👥 {template.usage_count} usos</span>
                    <span>⭐ {template.rating}</span>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                      <Copy className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" className="h-7 text-xs flex-1">
                      <Plus className="h-3 w-3 mr-1" />
                      Usar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Regras de Automação Ativas
function ActiveAutomations({ rules, onToggleRule, onEditRule }: {
  rules: AutomationRule[]
  onToggleRule: (ruleId: string, enabled: boolean) => void
  onEditRule: (rule: AutomationRule) => void
}) {
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors]
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      active: <Play className="h-3 w-3" />,
      paused: <Pause className="h-3 w-3" />,
      draft: <Edit3 className="h-3 w-3" />
    }
    return icons[status as keyof typeof icons]
  }

  const getTriggerIcon = (type: string) => {
    const icons = {
      schedule: <Clock className="h-4 w-4" />,
      event: <Zap className="h-4 w-4" />,
      condition: <Filter className="h-4 w-4" />,
      webhook: <Globe className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || <Workflow className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {rules.map(rule => (
        <Card key={rule.id} className="group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  {getTriggerIcon(rule.trigger.type)}
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-1">{rule.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Métricas */}
                <div className="text-right text-sm">
                  <div className="flex items-center gap-4 text-gray-500">
                    <span>{rule.execution_count} execuções</span>
                    <span className={rule.success_rate >= 95 ? 'text-green-600' : 
                                   rule.success_rate >= 80 ? 'text-yellow-600' : 'text-red-600'}>
                      {rule.success_rate}% sucesso
                    </span>
                    {rule.last_execution && (
                      <span>
                        Última: {new Date(rule.last_execution).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <Badge className={getStatusColor(rule.status)}>
                  {getStatusIcon(rule.status)}
                  <span className="ml-1 capitalize">{rule.status}</span>
                </Badge>

                {/* Controles */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.status === 'active'}
                    onCheckedChange={(checked) => onToggleRule(rule.id, checked)}
                  />
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditRule(rule)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>

                  <Button size="sm" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Detalhes expandidos */}
            <div className="mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span>{rule.actions.length} ações configuradas</span>
                  {rule.conditions && rule.conditions.length > 0 && (
                    <span>{rule.conditions.length} condições</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Activity className="h-3 w-3 mr-1" />
                    Logs
                  </Button>
                  <Button size="sm" variant="outline">
                    <Play className="h-3 w-3 mr-1" />
                    Executar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Logs de Execução
function ExecutionLogs({ logs }: { logs: ExecutionLog[] }) {
  const getStatusColor = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status as keyof typeof colors]
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      success: <CheckCircle className="h-3 w-3" />,
      failed: <AlertTriangle className="h-3 w-3" />,
      partial: <Clock className="h-3 w-3" />
    }
    return icons[status as keyof typeof icons]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Logs de Execução
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(log.status)}>
                    {getStatusIcon(log.status)}
                    <span className="ml-1 capitalize">{log.status}</span>
                  </Badge>
                  <span className="text-sm font-medium">Automação #{log.rule_id.slice(-6)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(log.started_at).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>{log.actions_executed} ações executadas</span>
                  {log.actions_failed > 0 && (
                    <span className="text-red-600">{log.actions_failed} falhas</span>
                  )}
                  {log.duration_ms && (
                    <span>{(log.duration_ms / 1000).toFixed(1)}s duração</span>
                  )}
                </div>
                
                {log.error_message && (
                  <Button size="sm" variant="ghost">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Ver Erro
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

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function AutomationCenter() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('rules')
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadAutomationData()
  }, [])

  const loadAutomationData = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      const mockRules: AutomationRule[] = [
        {
          id: '1',
          name: 'Resposta Automática WhatsApp',
          description: 'Responde mensagens automaticamente no horário comercial',
          status: 'active',
          trigger: {
            type: 'event',
            configuration: { event: 'whatsapp_message' }
          },
          actions: [
            {
              id: '1',
              type: 'ai_analysis',
              name: 'Analisar Intenção com IA',
              configuration: { model: 'gpt-4' },
              order: 1
            },
            {
              id: '2',
              type: 'send_message',
              name: 'Enviar Resposta',
              configuration: { template: 'greeting' },
              order: 2
            }
          ],
          execution_count: 1247,
          success_rate: 96.3,
          last_execution: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          name: 'Relatório Semanal de Performance',
          description: 'Gera relatório automático toda segunda-feira às 9h',
          status: 'active',
          trigger: {
            type: 'schedule',
            configuration: { cron: '0 9 * * 1' }
          },
          actions: [
            {
              id: '3',
              type: 'generate_report',
              name: 'Gerar Relatório',
              configuration: { type: 'weekly_performance' },
              order: 1
            }
          ],
          execution_count: 23,
          success_rate: 100,
          last_execution: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '3',
          name: 'Lead Scoring Inteligente',
          description: 'Analisa e pontua leads automaticamente',
          status: 'paused',
          trigger: {
            type: 'event',
            configuration: { event: 'new_lead' }
          },
          actions: [
            {
              id: '4',
              type: 'ai_analysis',
              name: 'Analisar Lead',
              configuration: { criteria: 'qualification' },
              order: 1
            }
          ],
          execution_count: 89,
          success_rate: 87.6,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]

      const mockLogs: ExecutionLog[] = [
        {
          id: '1',
          rule_id: '1',
          status: 'success',
          started_at: new Date(Date.now() - 5 * 60 * 1000),
          completed_at: new Date(Date.now() - 4 * 60 * 1000),
          duration_ms: 1250,
          actions_executed: 2,
          actions_failed: 0,
          logs: ['Mensagem recebida', 'IA analisou intenção', 'Resposta enviada']
        },
        {
          id: '2',
          rule_id: '2',
          status: 'success',
          started_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000),
          duration_ms: 30000,
          actions_executed: 1,
          actions_failed: 0,
          logs: ['Relatório gerado com sucesso']
        },
        {
          id: '3',
          rule_id: '1',
          status: 'failed',
          started_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
          duration_ms: 2000,
          actions_executed: 1,
          actions_failed: 1,
          logs: ['Erro ao conectar com WhatsApp API'],
          error_message: 'API rate limit exceeded'
        }
      ]

      setRules(mockRules)
      setLogs(mockLogs)
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar automações')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const updatedRules = rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, status: enabled ? 'active' : 'paused' as const }
          : rule
      )
      setRules(updatedRules)
      
      toast.success(`Automação ${enabled ? 'ativada' : 'pausada'}!`)
    } catch (error) {
      toast.error('Erro ao alterar status da automação')
    }
  }

  const handleEditRule = (rule: AutomationRule) => {
    toast.info('Editor de automação em desenvolvimento')
  }

  const handleSelectTemplate = (template: AutomationTemplate) => {
    toast.success(`Template "${template.name}" selecionado!`)
    setShowCreateDialog(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Central de Automação</h1>
            <p className="text-gray-600">Automatize processos com inteligência artificial</p>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Automação</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Constructor de Automação</h3>
              <p className="text-gray-600 mb-4">
                Interface visual para criar automações personalizadas em desenvolvimento.
              </p>
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Criar com IA
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Regras Ativas</p>
                <p className="text-2xl font-bold">{rules.filter(r => r.status === 'active').length}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Execuções Hoje</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => 
                    new Date(l.started_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {(rules.reduce((acc, rule) => acc + rule.success_rate, 0) / rules.length).toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Economizado</p>
                <p className="text-2xl font-bold">24.5h</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Minhas Regras
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <ActiveAutomations 
            rules={rules} 
            onToggleRule={handleToggleRule}
            onEditRule={handleEditRule}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <AutomationTemplates onSelectTemplate={handleSelectTemplate} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <ExecutionLogs logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}