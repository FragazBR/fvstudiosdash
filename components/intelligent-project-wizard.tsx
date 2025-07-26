'use client'

// ==================================================
// FVStudios Dashboard - Assistente Inteligente de Projetos
// Wizard para criação automática com IA e templates
// ==================================================

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Wand2,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Globe,
  Smartphone,
  Palette,
  Megaphone,
  FileText,
  Settings,
  Brain,
  Zap,
  Timer,
  Building2,
  User,
  Eye,
  Play,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ProjectTemplate, ProjectAutomationEngine, AutomationConfig } from '@/lib/project-automation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface ProjectConfig {
  name: string
  description: string
  client_id?: string
  template_id: string
  complexity: 'low' | 'medium' | 'high' | 'enterprise'
  budget_total?: number
  start_date: Date
  estimated_completion: Date
  auto_assign: boolean
  notify_team: boolean
  calendar_integration: boolean
  slack_integration: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
}

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface Client {
  id: string
  name: string
  company?: string
  email: string
}

interface TeamMember {
  id: string
  name: string
  role: string
  avatar_url?: string
  available: boolean
}

// ==================================================
// COMPONENTES
// ==================================================

// Template Card Component
function TemplateCard({ 
  template, 
  selected, 
  onSelect 
}: { 
  template: ProjectTemplate
  selected: boolean
  onSelect: () => void 
}) {
  const iconMap = {
    globe: <Globe className="h-6 w-6" />,
    smartphone: <Smartphone className="h-6 w-6" />,
    palette: <Palette className="h-6 w-6" />,
    megaphone: <Megaphone className="h-6 w-6" />,
    'file-text': <FileText className="h-6 w-6" />
  }

  const categoryColors = {
    web_development: 'from-blue-500 to-cyan-500',
    mobile_app: 'from-green-500 to-teal-500',
    branding: 'from-pink-500 to-rose-500',
    marketing: 'from-orange-500 to-yellow-500',
    consulting: 'from-purple-500 to-indigo-500'
  }

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selected 
          ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
          : 'hover:scale-102'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg bg-gradient-to-r ${categoryColors[template.category]}`}>
            {iconMap[template.icon as keyof typeof iconMap] || <Settings className="h-6 w-6" />}
          </div>
          {selected && (
            <CheckCircle className="h-5 w-5 text-blue-500" />
          )}
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {template.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Etapas:</span>
            <span className="font-medium">{template.stages?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Duração estimada:</span>
            <span className="font-medium">
              {template.stages?.reduce((total, stage) => total + stage.estimated_days, 0) || 0} dias
            </span>
          </div>
        </div>

        {template.stages && template.stages.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1">
              {template.stages.slice(0, 3).map((stage) => (
                <Badge 
                  key={stage.id} 
                  variant="secondary" 
                  className="text-xs"
                  style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                >
                  {stage.name}
                </Badge>
              ))}
              {template.stages.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.stages.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Stage Preview Component
function StagePreview({ template }: { template: ProjectTemplate }) {
  if (!template.stages || template.stages.length === 0) return null

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Prévia das Etapas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {template.stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{stage.name}</h4>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stage.description}
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium">{stage.estimated_days} dias</div>
                <div className="text-xs text-gray-500 capitalize">
                  {stage.default_assignee_role?.replace('_', ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Complexity Analyzer Component
function ComplexityAnalyzer({ 
  config, 
  onChange 
}: { 
  config: ProjectConfig
  onChange: (complexity: 'low' | 'medium' | 'high' | 'enterprise') => void 
}) {
  const complexityLevels = {
    low: {
      label: 'Baixa',
      description: 'Projeto simples, poucas etapas',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      multiplier: 1.0
    },
    medium: {
      label: 'Média', 
      description: 'Projeto padrão, complexidade normal',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      multiplier: 1.2
    },
    high: {
      label: 'Alta',
      description: 'Projeto complexo, muitas integrações',
      color: 'text-orange-600', 
      bgColor: 'bg-orange-100',
      multiplier: 1.5
    },
    enterprise: {
      label: 'Enterprise',
      description: 'Projeto corporativo, múltiplas fases',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      multiplier: 2.0
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(complexityLevels).map(([key, level]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all duration-200 ${
              config.complexity === key 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => onChange(key as any)}
          >
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full ${level.bgColor} flex items-center justify-center`}>
                <Target className={`h-6 w-6 ${level.color}`} />
              </div>
              <h4 className="font-medium mb-1">{level.label}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {level.description}
              </p>
              <div className="mt-2 text-xs font-medium">
                {level.multiplier}x prazo base
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Smart Recommendations */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Recomendação Inteligente
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {getComplexityRecommendation(config)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getComplexityRecommendation(config: ProjectConfig): string {
  const budget = config.budget_total || 0
  
  if (budget < 5000) {
    return "Baseado no orçamento, recomendamos complexidade 'Baixa' para otimizar recursos."
  }
  if (budget < 20000) {
    return "Orçamento médio detectado. Complexidade 'Média' oferece bom equilíbrio."
  }
  if (budget < 50000) {
    return "Orçamento alto permite complexidade 'Alta' com recursos avançados."
  }
  return "Orçamento enterprise detectado. Complexidade 'Enterprise' recomendada."
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function IntelligentProjectWizard({ 
  open, 
  onClose,
  onSuccess 
}: { 
  open: boolean
  onClose: () => void
  onSuccess?: (projectId: string) => void 
}) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  
  const [config, setConfig] = useState<ProjectConfig>({
    name: '',
    description: '',
    template_id: '',
    complexity: 'medium',
    start_date: new Date(),
    estimated_completion: new Date(),
    auto_assign: true,
    notify_team: true,
    calendar_integration: false,
    slack_integration: false,
    priority: 'medium',
    tags: []
  })

  const steps: WizardStep[] = [
    {
      id: 'template',
      title: 'Escolher Template',
      description: 'Selecione o tipo de projeto',
      icon: <Wand2 className="h-5 w-5" />,
      completed: !!selectedTemplate
    },
    {
      id: 'details',
      title: 'Detalhes do Projeto',
      description: 'Configure informações básicas',
      icon: <FileText className="h-5 w-5" />,
      completed: !!config.name && !!config.description
    },
    {
      id: 'complexity',
      title: 'Complexidade',
      description: 'Define prazos e recursos',
      icon: <Brain className="h-5 w-5" />,
      completed: !!config.complexity
    },
    {
      id: 'automation',
      title: 'Automação',
      description: 'Configure integrações',
      icon: <Zap className="h-5 w-5" />,
      completed: true // Sempre true pois tem valores padrão
    },
    {
      id: 'preview',
      title: 'Prévia & Criação',
      description: 'Revisar e confirmar',
      icon: <Play className="h-5 w-5" />,
      completed: false
    }
  ]

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  // Atualizar data estimada quando template ou complexidade mudarem
  useEffect(() => {
    if (selectedTemplate && config.complexity) {
      updateEstimatedCompletion()
    }
  }, [selectedTemplate, config.complexity, config.start_date])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const automation = new ProjectAutomationEngine()
      
      // Carregar templates
      const templatesData = await automation.getAvailableTemplates()
      setTemplates(templatesData)

      // Carregar clientes
      const supabase = supabaseBrowser()
      const { data: clientsData } = await supabase
        .from('contacts')
        .select('id, name, company, email')
        .eq('type', 'client')
        .order('name')

      setClients(clientsData || [])

      // Carregar membros da equipe
      const { data: teamData } = await supabase
        .from('user_profiles')
        .select('id, name, role, avatar_url')
        .eq('is_active', true)
        .order('name')

      setTeamMembers(teamData?.map(member => ({
        ...member,
        available: true
      })) || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados iniciais')
    } finally {
      setLoading(false)
    }
  }

  const updateEstimatedCompletion = () => {
    if (!selectedTemplate?.stages) return

    const baseDays = selectedTemplate.stages.reduce((total, stage) => total + stage.estimated_days, 0)
    const complexityMultiplier = {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
      enterprise: 2.0
    }[config.complexity]

    const totalDays = Math.ceil(baseDays * complexityMultiplier)
    const estimatedDate = new Date(config.start_date)
    estimatedDate.setDate(estimatedDate.getDate() + totalDays)

    setConfig(prev => ({
      ...prev,
      estimated_completion: estimatedDate
    }))
  }

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setConfig(prev => ({
      ...prev,
      template_id: template.id
    }))
  }

  const handleCreateProject = async () => {
    if (!selectedTemplate) return

    try {
      setLoading(true)
      const automation = new ProjectAutomationEngine()

      const result = await automation.createProjectWithAutomation({
        ...config,
        project_id: '', // Will be generated
        name: config.name,
        description: config.description,
        client_id: config.client_id,
        budget_total: config.budget_total,
        template_id: config.template_id,
        complexity: config.complexity,
        start_date: config.start_date,
        auto_assign: config.auto_assign,
        notify_team: config.notify_team,
        calendar_integration: config.calendar_integration,
        slack_integration: config.slack_integration
      })

      toast.success(`Projeto criado com sucesso! ${result.stages_created} etapas geradas automaticamente.`)
      
      if (onSuccess) {
        onSuccess(result.project_id)
      }
      
      onClose()
      router.push(`/projects/${result.project_id}`)

    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      toast.error('Erro ao criar projeto automatizado')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'template':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Escolha um Template</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Selecione o tipo de projeto para gerar automaticamente as etapas otimizadas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplate?.id === template.id}
                  onSelect={() => handleTemplateSelect(template)}
                />
              ))}
            </div>

            {selectedTemplate && <StagePreview template={selectedTemplate} />}
          </div>
        )

      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Detalhes do Projeto</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configure as informações básicas do seu projeto
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Projeto *</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Website Corporativo ABC"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva os objetivos e escopo do projeto..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={config.client_id} onValueChange={(value) => setConfig(prev => ({ ...prev, client_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Orçamento</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={config.budget_total || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, budget_total: parseFloat(e.target.value) || undefined }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={config.priority} onValueChange={(value: any) => setConfig(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(config.start_date, 'PPP', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={config.start_date}
                        onSelect={(date) => date && setConfig(prev => ({ ...prev, start_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        )

      case 'complexity':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Análise de Complexidade</h3>
              <p className="text-gray-600 dark:text-gray-400">
                A complexidade define os prazos automáticos e recursos necessários
              </p>
            </div>

            <ComplexityAnalyzer 
              config={config}
              onChange={(complexity) => setConfig(prev => ({ ...prev, complexity }))}
            />

            {/* Timeline Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Cronograma Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {format(config.start_date, 'dd/MM/yyyy')}
                    </div>
                    <div className="text-sm text-gray-600">Data de Início</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.ceil((config.estimated_completion.getTime() - config.start_date.getTime()) / (1000 * 60 * 60 * 24))} dias
                    </div>
                    <div className="text-sm text-gray-600">Duração Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {format(config.estimated_completion, 'dd/MM/yyyy')}
                    </div>
                    <div className="text-sm text-gray-600">Entrega Prevista</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'automation':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Configurações de Automação</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Configure como o sistema deve automatizar o gerenciamento do projeto
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Automação de Equipe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-atribuir responsáveis</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Atribuir automaticamente membros da equipe baseado nos roles
                      </div>
                    </div>
                    <Switch
                      checked={config.auto_assign}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_assign: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Notificar equipe</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Enviar notificações quando for atribuído ao projeto
                      </div>
                    </div>
                    <Switch
                      checked={config.notify_team}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, notify_team: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Integrações Externas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Google Calendar</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Criar eventos automáticos para prazos das etapas
                      </div>
                    </div>
                    <Switch
                      checked={config.calendar_integration}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, calendar_integration: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Slack</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Notificar canal do Slack sobre atualizações
                      </div>
                    </div>
                    <Switch
                      checked={config.slack_integration}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, slack_integration: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 'preview':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Revisar & Confirmar</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Verifique todas as configurações antes de criar o projeto
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo do Projeto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span className="font-medium">{config.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Template:</span>
                    <span className="font-medium">{selectedTemplate?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Complexidade:</span>
                    <Badge variant="secondary" className="capitalize">
                      {config.complexity}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prioridade:</span>
                    <Badge variant="secondary" className="capitalize">
                      {config.priority}
                    </Badge>
                  </div>
                  {config.budget_total && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orçamento:</span>
                      <span className="font-medium">R$ {config.budget_total.toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Automation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configurações de Automação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Auto-atribuir:</span>
                    <CheckCircle className={`h-4 w-4 ${config.auto_assign ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Notificações:</span>
                    <CheckCircle className={`h-4 w-4 ${config.notify_team ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Google Calendar:</span>
                    <CheckCircle className={`h-4 w-4 ${config.calendar_integration ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Slack:</span>
                    <CheckCircle className={`h-4 w-4 ${config.slack_integration ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cronograma Automático</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Início</div>
                    <div className="font-medium">{format(config.start_date, 'dd/MM/yyyy')}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Entrega</div>
                    <div className="font-medium">{format(config.estimated_completion, 'dd/MM/yyyy')}</div>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Sparkles className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>{selectedTemplate?.stages?.length || 0} etapas</strong> serão criadas automaticamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Assistente Inteligente de Projetos
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Steps Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    index === currentStep 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : step.completed 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      index === currentStep 
                        ? 'bg-blue-500 text-white' 
                        : step.completed 
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step.completed && index !== currentStep ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{step.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <Progress value={((currentStep + 1) / steps.length) * 100} />
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 min-h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
                </div>
              </div>
            ) : (
              renderStepContent()
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleCreateProject}
                disabled={loading || !selectedTemplate || !config.name}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Criar Projeto
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 0 && !selectedTemplate) ||
                  (currentStep === 1 && (!config.name || !config.description))
                }
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}