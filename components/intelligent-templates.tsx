'use client'

// ==================================================
// FVStudios Dashboard - Central de Templates Inteligentes
// Sistema avançado de templates com IA para otimização de processos
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Layout,
  Sparkles,
  Brain,
  Wand2,
  Copy,
  Star,
  TrendingUp,
  Clock,
  Users,
  Target,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  BarChart3,
  Zap,
  Award,
  Rocket,
  Settings,
  FileText,
  Folder,
  Lightbulb,
  Gauge,
  Activity,
  Calendar,
  Database
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface SmartTemplate {
  id: string
  name: string
  description: string
  category: 'project' | 'task' | 'workflow' | 'report' | 'automation'
  type: 'basic' | 'advanced' | 'ai_generated' | 'community'
  template_data: {
    structure: any
    default_values: any
    conditional_logic: any[]
    ai_suggestions: string[]
  }
  usage_stats: {
    usage_count: number
    success_rate: number
    avg_completion_time: number
    user_rating: number
    time_saved_total: number
  }
  ai_insights: {
    optimization_score: number
    suggested_improvements: string[]
    pattern_analysis: any[]
    performance_prediction: number
  }
  tags: string[]
  author: string
  is_public: boolean
  created_at: string
  updated_at: string
}

interface TemplateRecommendation {
  id: string
  template_id: string
  confidence: number
  reason: string
  potential_time_saved: number
  match_score: number
  context: any
}

interface AITemplateGenerator {
  input_data: any
  generated_template: SmartTemplate | null
  confidence: number
  processing: boolean
}

// ==================================================
// INTELIGÊNCIA DE TEMPLATES
// ==================================================

class TemplateIntelligence {
  static mockTemplates: SmartTemplate[] = [
    {
      id: 'web-development',
      name: 'Desenvolvimento Web Completo',
      description: 'Template completo para projetos de desenvolvimento web com React/Next.js',
      category: 'project',
      type: 'advanced',
      template_data: {
        structure: {
          phases: [
            { name: 'Planejamento', duration: 5, tasks: ['Análise de requisitos', 'Wireframes', 'Arquitetura'] },
            { name: 'Design', duration: 8, tasks: ['UI/UX Design', 'Prototipação', 'Review de Design'] },
            { name: 'Desenvolvimento', duration: 20, tasks: ['Setup inicial', 'Frontend', 'Backend', 'Integrações'] },
            { name: 'Testes', duration: 7, tasks: ['Testes unitários', 'Testes E2E', 'QA'] },
            { name: 'Deploy', duration: 3, tasks: ['Setup produção', 'Deploy', 'Monitoramento'] }
          ]
        },
        default_values: {
          technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
          team_size: 3,
          estimated_hours: 320
        },
        conditional_logic: [
          { if: 'ecommerce', then: 'add_payment_integration' },
          { if: 'multi_language', then: 'add_i18n_setup' }
        ],
        ai_suggestions: [
          'Considere usar Server Components para melhor performance',
          'Implemente cache strategies desde o início',
          'Configure monitoring e analytics'
        ]
      },
      usage_stats: {
        usage_count: 47,
        success_rate: 94,
        avg_completion_time: 28,
        user_rating: 4.8,
        time_saved_total: 376
      },
      ai_insights: {
        optimization_score: 92,
        suggested_improvements: [
          'Adicionar mais automação nos testes',
          'Melhorar estimativas de tempo baseadas em histórico'
        ],
        pattern_analysis: [
          { pattern: 'frontend_first', frequency: 0.8 },
          { pattern: 'api_integration_delays', frequency: 0.3 }
        ],
        performance_prediction: 89
      },
      tags: ['web', 'react', 'nextjs', 'fullstack'],
      author: 'FV Studios',
      is_public: true,
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mobile-app',
      name: 'Desenvolvimento Mobile (React Native)',
      description: 'Template otimizado para apps mobile com React Native',
      category: 'project',
      type: 'advanced',
      template_data: {
        structure: {
          phases: [
            { name: 'Discovery', duration: 4, tasks: ['Market Research', 'User Personas', 'Features Definition'] },
            { name: 'Design', duration: 10, tasks: ['Mobile UI Design', 'User Flow', 'Design System'] },
            { name: 'Development', duration: 25, tasks: ['Setup RN', 'Core Features', 'API Integration', 'Platform Specific'] },
            { name: 'Testing', duration: 8, tasks: ['Device Testing', 'Performance Tests', 'User Testing'] },
            { name: 'Deploy', duration: 5, tasks: ['App Store Submission', 'Play Store', 'Distribution'] }
          ]
        },
        default_values: {
          platforms: ['iOS', 'Android'],
          technologies: ['React Native', 'Expo', 'Firebase'],
          team_size: 4
        },
        conditional_logic: [
          { if: 'offline_support', then: 'add_offline_storage' },
          { if: 'push_notifications', then: 'setup_notification_service' }
        ],
        ai_suggestions: [
          'Use Expo para prototipagem rápida',
          'Implemente deep linking desde o início',
          'Configure analytics e crash reporting'
        ]
      },
      usage_stats: {
        usage_count: 32,
        success_rate: 89,
        avg_completion_time: 45,
        user_rating: 4.6,
        time_saved_total: 288
      },
      ai_insights: {
        optimization_score: 87,
        suggested_improvements: [
          'Adicionar mais testes automatizados',
          'Melhorar processo de deploy'
        ],
        pattern_analysis: [
          { pattern: 'platform_specific_issues', frequency: 0.4 },
          { pattern: 'api_performance_concerns', frequency: 0.25 }
        ],
        performance_prediction: 85
      },
      tags: ['mobile', 'react-native', 'ios', 'android'],
      author: 'Community',
      is_public: true,
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'ai-generated-saas',
      name: 'SaaS Startup (Gerado por IA)',
      description: 'Template gerado automaticamente para startups SaaS baseado em padrões de sucesso',
      category: 'project',
      type: 'ai_generated',
      template_data: {
        structure: {
          phases: [
            { name: 'MVP Definition', duration: 6, tasks: ['Problem Validation', 'Core Features', 'Tech Stack'] },
            { name: 'Development', duration: 30, tasks: ['Auth System', 'Core Platform', 'Payment Integration', 'Dashboard'] },
            { name: 'Launch Prep', duration: 8, tasks: ['Marketing Site', 'Onboarding', 'Documentation'] },
            { name: 'Beta Launch', duration: 10, tasks: ['Beta Users', 'Feedback Collection', 'Iterations'] },
            { name: 'Production', duration: 5, tasks: ['Scale Infrastructure', 'Launch Campaign', 'Support Setup'] }
          ]
        },
        default_values: {
          technologies: ['Next.js', 'Prisma', 'Stripe', 'Vercel'],
          pricing_model: 'subscription',
          target_users: 'small_business'
        },
        conditional_logic: [
          { if: 'enterprise_target', then: 'add_sso_integration' },
          { if: 'freemium_model', then: 'implement_usage_limits' }
        ],
        ai_suggestions: [
          'Foque no onboarding perfeito para reduzir churn',
          'Implemente analytics de produto desde o dia 1',
          'Configure automação de email marketing'
        ]
      },
      usage_stats: {
        usage_count: 18,
        success_rate: 83,
        avg_completion_time: 52,
        user_rating: 4.4,
        time_saved_total: 216
      },
      ai_insights: {
        optimization_score: 84,
        suggested_improvements: [
          'Adicionar mais validação de mercado',
          'Melhorar métricas de produto'
        ],
        pattern_analysis: [
          { pattern: 'payment_integration_complexity', frequency: 0.6 },
          { pattern: 'scaling_challenges', frequency: 0.35 }
        ],
        performance_prediction: 82
      },
      tags: ['saas', 'startup', 'ai-generated', 'mvp'],
      author: 'AI System',
      is_public: true,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'client-onboarding',
      name: 'Onboarding de Cliente',
      description: 'Processo estruturado para onboarding de novos clientes',
      category: 'workflow',
      type: 'basic',
      template_data: {
        structure: {
          steps: [
            { name: 'Kickoff Meeting', duration: 2, checklist: ['Apresentações', 'Expectativas', 'Cronograma'] },
            { name: 'Discovery', duration: 5, checklist: ['Briefing detalhado', 'Recursos necessários', 'Stakeholders'] },
            { name: 'Proposal', duration: 3, checklist: ['Proposta técnica', 'Cronograma', 'Orçamento'] },
            { name: 'Contract', duration: 2, checklist: ['Contrato', 'SOW', 'Setup inicial'] }
          ]
        },
        default_values: {
          duration: 12,
          stakeholders: ['Cliente', 'PM', 'Tech Lead'],
          deliverables: ['Proposal', 'SOW', 'Project Setup']
        },
        conditional_logic: [
          { if: 'enterprise_client', then: 'add_compliance_check' },
          { if: 'international', then: 'add_timezone_considerations' }
        ],
        ai_suggestions: [
          'Documente tudo desde o primeiro dia',
          'Estabeleça canais de comunicação claros',
          'Defina métricas de sucesso antecipadamente'
        ]
      },
      usage_stats: {
        usage_count: 73,
        success_rate: 96,
        avg_completion_time: 11,
        user_rating: 4.9,
        time_saved_total: 438
      },
      ai_insights: {
        optimization_score: 95,
        suggested_improvements: [
          'Automatizar envio de documentos',
          'Criar checklist interativo'
        ],
        pattern_analysis: [
          { pattern: 'documentation_delays', frequency: 0.2 },
          { pattern: 'stakeholder_alignment', frequency: 0.9 }
        ],
        performance_prediction: 94
      },
      tags: ['onboarding', 'client', 'workflow', 'process'],
      author: 'FV Studios',
      is_public: true,
      created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  static generateRecommendations(userProjects: any[], userPreferences: any): TemplateRecommendation[] {
    const recommendations: TemplateRecommendation[] = []

    // Analisar padrões dos projetos do usuário
    const projectTypes = userProjects.map(p => p.tipo || 'geral')
    const mostCommonType = this.getMostFrequent(projectTypes)

    // Recomendar templates baseados em padrões
    this.mockTemplates.forEach(template => {
      let confidence = 0
      let reason = ''
      let matchScore = 0

      // Análise de compatibilidade
      if (template.category === 'project') {
        if (mostCommonType === 'web' && template.tags.includes('web')) {
          confidence = 90
          reason = 'Baseado no seu histórico de projetos web'
          matchScore = 95
        } else if (mostCommonType === 'mobile' && template.tags.includes('mobile')) {
          confidence = 88
          reason = 'Compatível com seus projetos mobile'
          matchScore = 92
        } else if (template.type === 'ai_generated') {
          confidence = 75
          reason = 'Template otimizado por IA para seu perfil'
          matchScore = 80
        }
      } else if (template.category === 'workflow') {
        confidence = 85
        reason = 'Melhore seus processos com workflow estruturado'
        matchScore = 88
      }

      if (confidence > 70) {
        recommendations.push({
          id: `rec-${template.id}`,
          template_id: template.id,
          confidence,
          reason,
          potential_time_saved: Math.round(template.usage_stats.time_saved_total / template.usage_stats.usage_count),
          match_score: matchScore,
          context: { user_type: mostCommonType, projects_count: userProjects.length }
        })
      }
    })

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  static async generateAITemplate(input: any): Promise<SmartTemplate> {
    // Simular geração de template por IA
    await new Promise(resolve => setTimeout(resolve, 3000))

    const aiTemplate: SmartTemplate = {
      id: `ai-generated-${Date.now()}`,
      name: `${input.project_type} Personalizado`,
      description: `Template gerado automaticamente para ${input.project_type} baseado nas suas especificações`,
      category: 'project',
      type: 'ai_generated',
      template_data: {
        structure: {
          phases: this.generatePhases(input),
          estimated_duration: this.estimateDuration(input)
        },
        default_values: {
          technologies: this.suggestTechnologies(input),
          team_size: this.estimateTeamSize(input),
          budget_range: this.estimateBudget(input)
        },
        conditional_logic: this.generateConditionalLogic(input),
        ai_suggestions: this.generateAISuggestions(input)
      },
      usage_stats: {
        usage_count: 0,
        success_rate: 0,
        avg_completion_time: 0,
        user_rating: 0,
        time_saved_total: 0
      },
      ai_insights: {
        optimization_score: 85,
        suggested_improvements: [],
        pattern_analysis: [],
        performance_prediction: 82
      },
      tags: this.generateTags(input),
      author: 'AI System',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return aiTemplate
  }

  private static getMostFrequent(arr: string[]): string {
    const frequency = arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {} as any)

    return Object.entries(frequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'geral'
  }

  private static generatePhases(input: any): any[] {
    const basePhases = [
      { name: 'Planejamento', duration: 5 },
      { name: 'Desenvolvimento', duration: 20 },
      { name: 'Testes', duration: 5 },
      { name: 'Deploy', duration: 3 }
    ]

    // Personalizar baseado no input
    if (input.project_type === 'ecommerce') {
      basePhases.splice(1, 0, { name: 'Design & UX', duration: 8 })
      basePhases.push({ name: 'Integração de Pagamentos', duration: 5 })
    }

    return basePhases
  }

  private static estimateDuration(input: any): number {
    const baseDuration = 30
    const complexity = input.complexity || 'medium'
    
    switch (complexity) {
      case 'simple': return baseDuration * 0.7
      case 'complex': return baseDuration * 1.5
      default: return baseDuration
    }
  }

  private static suggestTechnologies(input: any): string[] {
    const baseTech = ['React', 'Node.js', 'PostgreSQL']
    
    if (input.project_type === 'mobile') {
      return ['React Native', 'Expo', 'Firebase']
    }
    
    if (input.project_type === 'ai') {
      return [...baseTech, 'Python', 'TensorFlow', 'OpenAI API']
    }

    return baseTech
  }

  private static estimateTeamSize(input: any): number {
    const complexity = input.complexity || 'medium'
    switch (complexity) {
      case 'simple': return 2
      case 'complex': return 5
      default: return 3
    }
  }

  private static estimateBudget(input: any): string {
    const complexity = input.complexity || 'medium'
    switch (complexity) {
      case 'simple': return '$5k - $15k'
      case 'complex': return '$50k - $100k'
      default: return '$15k - $50k'
    }
  }

  private static generateConditionalLogic(input: any): any[] {
    return [
      { if: 'mobile_app', then: 'add_app_store_requirements' },
      { if: 'user_auth', then: 'implement_auth_system' },
      { if: 'payment_processing', then: 'integrate_payment_gateway' }
    ]
  }

  private static generateAISuggestions(input: any): string[] {
    return [
      'Considere implementar CI/CD desde o início',
      'Planeje a arquitetura pensando em escalabilidade',
      'Documente APIs e processos continuamente',
      'Configure monitoramento e analytics'
    ]
  }

  private static generateTags(input: any): string[] {
    const baseTags = ['ai-generated', 'custom']
    if (input.project_type) baseTags.push(input.project_type)
    if (input.industry) baseTags.push(input.industry)
    return baseTags
  }
}

// ==================================================
// HOOKS
// ==================================================

function useSmartTemplates() {
  const { user } = useUser()
  const [templates, setTemplates] = useState<SmartTemplate[]>([])
  const [recommendations, setRecommendations] = useState<TemplateRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    if (user?.agency_id) {
      loadTemplatesData()
    }
  }, [user])

  const loadTemplatesData = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de dados
      const supabase = supabaseBrowser()
      const projectsResult = await supabase
        .from('projects')
        .select('tipo')
        .eq('agency_id', user?.agency_id)

      const userProjects = projectsResult.data || []
      
      // Usar templates mock
      setTemplates(TemplateIntelligence.mockTemplates)
      
      // Gerar recomendações baseadas no perfil do usuário
      const userRecommendations = TemplateIntelligence.generateRecommendations(
        userProjects, 
        { preferences: 'web_focus' }
      )
      setRecommendations(userRecommendations)

    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      toast.error('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    
    return matchesSearch && matchesCategory
  })

  return {
    templates: filteredTemplates,
    recommendations,
    loading,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    refreshData: loadTemplatesData
  }
}

function useAITemplateGenerator() {
  const [generator, setGenerator] = useState<AITemplateGenerator>({
    input_data: {},
    generated_template: null,
    confidence: 0,
    processing: false
  })

  const generateTemplate = async (inputData: any) => {
    setGenerator(prev => ({ ...prev, processing: true, input_data: inputData }))
    
    try {
      const aiTemplate = await TemplateIntelligence.generateAITemplate(inputData)
      setGenerator(prev => ({
        ...prev,
        generated_template: aiTemplate,
        confidence: 85,
        processing: false
      }))
      toast.success('Template gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar template:', error)
      toast.error('Erro ao gerar template')
      setGenerator(prev => ({ ...prev, processing: false }))
    }
  }

  const resetGenerator = () => {
    setGenerator({
      input_data: {},
      generated_template: null,
      confidence: 0,
      processing: false
    })
  }

  return {
    generator,
    generateTemplate,
    resetGenerator
  }
}

// ==================================================
// COMPONENTES
// ==================================================

function TemplateCard({ template, isRecommended = false }: { 
  template: SmartTemplate
  isRecommended?: boolean 
}) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'basic': return <FileText className="h-5 w-5" />
      case 'advanced': return <Settings className="h-5 w-5" />
      case 'ai_generated': return <Brain className="h-5 w-5" />
      case 'community': return <Users className="h-5 w-5" />
      default: return <Layout className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'basic': return 'text-blue-500'
      case 'advanced': return 'text-purple-500'
      case 'ai_generated': return 'text-green-500'
      case 'community': return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      project: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      task: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      workflow: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      report: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      automation: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    return colors[category as keyof typeof colors] || colors.project
  }

  return (
    <Card className={`bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md hover:scale-105 hover:border-[#01b86c]/40 transition-all duration-200 ${
      isRecommended ? 'ring-2 ring-[#01b86c]/20' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-[#1e1e1e]/80 ${getTypeColor(template.type)}`}>
            {getTypeIcon(template.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {template.name}
                {isRecommended && (
                  <Sparkles className="inline h-4 w-4 text-[#01b86c] ml-1" />
                )}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getCategoryBadge(template.category)}`}>
                  {template.category}
                </Badge>
                {template.type === 'ai_generated' && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                    IA
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {template.description}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {template.usage_stats.usage_count}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Usos
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {template.usage_stats.success_rate}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Sucesso
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.round(template.usage_stats.user_rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {template.usage_stats.user_rating.toFixed(1)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(template.usage_stats.time_saved_total / template.usage_stats.usage_count || 0)}h
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Economizadas
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{template.tags.length - 4}
                </Badge>
              )}
            </div>

            {/* IA Insights */}
            {template.ai_insights.optimization_score > 0 && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Score de Otimização: {template.ai_insights.optimization_score}/100
                  </span>
                </div>
                <Progress 
                  value={template.ai_insights.optimization_score} 
                  className="h-2 mb-2" 
                />
                {template.ai_insights.suggested_improvements.length > 0 && (
                  <div className="text-xs text-purple-800 dark:text-purple-200">
                    💡 {template.ai_insights.suggested_improvements[0]}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Por {template.author} • {new Date(template.updated_at).toLocaleDateString('pt-BR')}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs hover:text-[#01b86c] hover:border-[#01b86c]/40"
                  onClick={() => toast.info('Visualizando template...')}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                <Button
                  size="sm"
                  className="bg-[#01b86c] hover:bg-[#01b86c]/90 text-white text-xs h-7 px-3"
                  onClick={() => toast.success('Template aplicado ao projeto!')}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Usar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecommendationCard({ recommendation, template }: { 
  recommendation: TemplateRecommendation
  template: SmartTemplate 
}) {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-[#01b86c]/30">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-[#01b86c]/10 text-[#01b86c]">
            <Sparkles className="h-5 w-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {template.name}
              </h3>
              <Badge className="bg-[#01b86c]/10 text-[#01b86c] text-xs">
                {recommendation.confidence}% match
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {recommendation.reason}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {recommendation.potential_time_saved}h economizadas
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {recommendation.match_score}% compatibilidade
                  </span>
                </div>
              </div>
              
              <Button
                size="sm"
                className="bg-[#01b86c] hover:bg-[#01b86c]/90 text-white text-xs h-7 px-3"
                onClick={() => toast.success('Template recomendado aplicado!')}
              >
                <Rocket className="h-3 w-3 mr-1" />
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AITemplateGenerator() {
  const { generator, generateTemplate, resetGenerator } = useAITemplateGenerator()
  const [inputData, setInputData] = useState({
    project_type: '',
    complexity: 'medium',
    industry: '',
    requirements: ''
  })

  const handleGenerate = () => {
    if (!inputData.project_type) {
      toast.error('Por favor, especifique o tipo de projeto')
      return
    }
    generateTemplate(inputData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          Gerador de Templates com IA
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!generator.generated_template ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project-type">Tipo de Projeto *</Label>
                <Select 
                  value={inputData.project_type} 
                  onValueChange={(value) => setInputData(prev => ({ ...prev, project_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Desenvolvimento Web</SelectItem>
                    <SelectItem value="mobile">App Mobile</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="ai">Projeto com IA</SelectItem>
                    <SelectItem value="blockchain">Blockchain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="complexity">Complexidade</Label>
                <Select 
                  value={inputData.complexity} 
                  onValueChange={(value) => setInputData(prev => ({ ...prev, complexity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simples</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="complex">Complexo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="industry">Setor/Indústria</Label>
              <Input
                id="industry"
                value={inputData.industry}
                onChange={(e) => setInputData(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="Ex: Fintech, E-commerce, Saúde..."
              />
            </div>

            <div>
              <Label htmlFor="requirements">Requisitos Específicos</Label>
              <Textarea
                id="requirements"
                value={inputData.requirements}
                onChange={(e) => setInputData(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="Descreva funcionalidades específicas, integrações necessárias, etc."
                rows={3}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generator.processing}
              className="w-full bg-[#01b86c] hover:bg-[#01b86c]/90"
            >
              {generator.processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Gerando Template com IA...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Gerar Template Personalizado
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900 dark:text-green-100">
                  Template Gerado com Sucesso!
                </span>
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                Confiança da IA: {generator.confidence}%
              </div>
            </div>

            <TemplateCard template={generator.generated_template} />

            <div className="flex gap-2">
              <Button
                onClick={() => toast.success('Template salvo na sua biblioteca!')}
                className="flex-1 bg-[#01b86c] hover:bg-[#01b86c]/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Salvar Template
              </Button>
              <Button
                onClick={resetGenerator}
                variant="outline"
                className="flex-1 hover:text-[#01b86c] hover:border-[#01b86c]/40"
              >
                <Plus className="h-4 w-4 mr-2" />
                Gerar Novo
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function IntelligentTemplates() {
  const { 
    templates, 
    recommendations, 
    loading, 
    searchTerm, 
    setSearchTerm, 
    filterCategory, 
    setFilterCategory 
  } = useSmartTemplates()
  
  const [activeTab, setActiveTab] = useState('browse')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-purple-500" />
            Templates Inteligentes
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

  const totalTemplates = templates.length
  const aiGeneratedCount = templates.filter(t => t.type === 'ai_generated').length
  const totalTimeSaved = templates.reduce((sum, t) => sum + t.usage_stats.time_saved_total, 0)
  const avgRating = templates.reduce((sum, t) => sum + t.usage_stats.user_rating, 0) / templates.length

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <Layout className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalTemplates}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Templates Disponíveis
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <Brain className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {aiGeneratedCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Gerados por IA
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(totalTimeSaved)}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tempo Total Economizado
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {avgRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avaliação Média
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-purple-500" />
              Central de Templates
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                IA Avançada
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full lg:w-96">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Explorar</span>
              </TabsTrigger>
              <TabsTrigger value="recommended" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Recomendados</span>
              </TabsTrigger>
              <TabsTrigger value="generator" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                <span className="hidden sm:inline">Gerador IA</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* Explorar Templates */}
            <TabsContent value="browse" className="space-y-6">
              {/* Filtros e Busca */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="project">Projetos</SelectItem>
                    <SelectItem value="task">Tarefas</SelectItem>
                    <SelectItem value="workflow">Workflows</SelectItem>
                    <SelectItem value="report">Relatórios</SelectItem>
                    <SelectItem value="automation">Automação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de Templates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-8">
                  <Layout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nenhum template encontrado
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tente ajustar os filtros ou criar um novo template.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Templates Recomendados */}
            <TabsContent value="recommended" className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Templates Recomendados para Você
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Baseado no seu histórico de projetos e padrões de uso
                </p>
              </div>

              <div className="space-y-4">
                {recommendations.map((recommendation) => {
                  const template = templates.find(t => t.id === recommendation.template_id)
                  return template ? (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      template={template}
                    />
                  ) : null
                })}
              </div>

              {recommendations.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Coletando dados para recomendações
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Continue usando o sistema para receber recomendações personalizadas.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Gerador de Templates com IA */}
            <TabsContent value="generator" className="space-y-6">
              <AITemplateGenerator />
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <CardTitle className="text-sm">Templates por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(
                        templates.reduce((acc, template) => {
                          acc[template.category] = (acc[template.category] || 0) + 1
                          return acc
                        }, {} as any)
                      ).map(([category, count]: [string, any]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{category}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={(count / totalTemplates) * 100} className="w-20 h-2" />
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                  <CardHeader>
                    <CardTitle className="text-sm">Performance dos Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Gráficos de performance seriam exibidos aqui
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