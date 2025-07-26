'use client'

// ==================================================
// FVStudios Dashboard - Sistema de Recomendações IA
// Sistema inteligente de recomendações personalizadas com aprendizado
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Brain,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Star,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  X,
  Play,
  Pause,
  Settings,
  Filter,
  RefreshCw,
  Eye,
  ChevronRight,
  Activity,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Heart,
  Bookmark,
  Share2
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { AIRecommendationEngine } from '@/lib/intelligent-system'

// Interfaces
interface Recommendation {
  id: string
  type: 'optimization' | 'automation' | 'strategy' | 'content' | 'campaign' | 'resource'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  reasoning: string
  confidence_score: number
  potential_impact: {
    time_saved?: number
    cost_reduction?: number
    efficiency_gain?: number
    revenue_increase?: number
  }
  implementation: {
    steps: string[]
    estimated_time: string
    difficulty: 'easy' | 'medium' | 'hard'
    required_resources: string[]
  }
  status: 'pending' | 'accepted' | 'dismissed' | 'implemented'
  category: string
  tags: string[]
  created_at: Date
  expires_at?: Date
  user_feedback?: {
    rating: number
    helpful: boolean
    comments?: string
  }
}

interface RecommendationFilter {
  type?: string
  priority?: string
  status?: string
  category?: string
}

// ==================================================
// COMPONENTES
// ==================================================

// Card de Recomendação
function RecommendationCard({ 
  recommendation, 
  onAccept, 
  onDismiss, 
  onImplement,
  onFeedback 
}: {
  recommendation: Recommendation
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
  onImplement: (id: string) => void
  onFeedback: (id: string, feedback: any) => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  const getTypeIcon = (type: string) => {
    const icons = {
      optimization: <TrendingUp className="h-4 w-4" />,
      automation: <Zap className="h-4 w-4" />,
      strategy: <Target className="h-4 w-4" />,
      content: <Star className="h-4 w-4" />,
      campaign: <BarChart3 className="h-4 w-4" />,
      resource: <Users className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || <Lightbulb className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    const colors = {
      optimization: 'bg-green-100 text-green-800',
      automation: 'bg-purple-100 text-purple-800',
      strategy: 'bg-blue-100 text-blue-800',
      content: 'bg-yellow-100 text-yellow-800',
      campaign: 'bg-orange-100 text-orange-800',
      resource: 'bg-indigo-100 text-indigo-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[priority as keyof typeof colors]
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'text-green-600',
      medium: 'text-yellow-600',
      hard: 'text-red-600'
    }
    return colors[difficulty as keyof typeof colors]
  }

  const formatImpactValue = (value: number, type: string) => {
    switch (type) {
      case 'time_saved':
        return `${value}h economizadas`
      case 'cost_reduction':
        return `R$ ${value.toLocaleString()} economia`
      case 'efficiency_gain':
        return `+${value}% eficiência`
      case 'revenue_increase':
        return `+R$ ${value.toLocaleString()} receita`
      default:
        return value.toString()
    }
  }

  return (
    <Card className={`border-l-4 ${
      recommendation.priority === 'critical' ? 'border-l-red-500' :
      recommendation.priority === 'high' ? 'border-l-orange-500' :
      recommendation.priority === 'medium' ? 'border-l-yellow-500' :
      'border-l-gray-300'
    } hover:shadow-lg transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getTypeColor(recommendation.type)}`}>
                {getTypeIcon(recommendation.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {recommendation.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {recommendation.category}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(recommendation.priority)}>
                {recommendation.priority === 'critical' ? 'Crítica' :
                 recommendation.priority === 'high' ? 'Alta' :
                 recommendation.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
              
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Brain className="h-3 w-3" />
                {(recommendation.confidence_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700">
            {recommendation.description}
          </p>

          {/* Impact Metrics */}
          {Object.keys(recommendation.potential_impact).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(recommendation.potential_impact).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatImpactValue(value, key)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {recommendation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recommendation.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Details Expandable */}
          {showDetails && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <h4 className="font-medium text-sm mb-2">Raciocínio da IA:</h4>
                <p className="text-sm text-gray-600">{recommendation.reasoning}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Plano de Implementação:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Tempo estimado: {recommendation.implementation.estimated_time}</span>
                    </div>
                    <div className={`font-medium ${getDifficultyColor(recommendation.implementation.difficulty)}`}>
                      {recommendation.implementation.difficulty === 'easy' ? 'Fácil' :
                       recommendation.implementation.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {recommendation.implementation.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </div>
                    ))}
                  </div>
                  
                  {recommendation.implementation.required_resources.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Recursos necessários:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recommendation.implementation.required_resources.map(resource => (
                          <Badge key={resource} variant="secondary" className="text-xs">
                            {resource}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Eye className="h-3 w-3 mr-1" />
                {showDetails ? 'Ocultar' : 'Detalhes'}
              </Button>
              
              {recommendation.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onFeedback(recommendation.id, { helpful: true })}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onFeedback(recommendation.id, { helpful: false })}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {recommendation.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDismiss(recommendation.id)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Descartar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onAccept(recommendation.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aceitar
                  </Button>
                </>
              )}
              
              {recommendation.status === 'accepted' && (
                <Button
                  size="sm"
                  onClick={() => onImplement(recommendation.id)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Implementar
                </Button>
              )}
              
              {recommendation.status === 'implemented' && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Implementado
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Filtros de Recomendações
function RecommendationFilters({ 
  filters, 
  onFilterChange,
  totalCount,
  filteredCount 
}: {
  filters: RecommendationFilter
  onFilterChange: (filters: RecommendationFilter) => void
  totalCount: number
  filteredCount: number
}) {
  const types = [
    { value: 'optimization', label: 'Otimização' },
    { value: 'automation', label: 'Automação' },
    { value: 'strategy', label: 'Estratégia' },
    { value: 'content', label: 'Conteúdo' },
    { value: 'campaign', label: 'Campanha' },
    { value: 'resource', label: 'Recursos' }
  ]

  const priorities = [
    { value: 'critical', label: 'Crítica' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Média' },
    { value: 'low', label: 'Baixa' }
  ]

  const statuses = [
    { value: 'pending', label: 'Pendente' },
    { value: 'accepted', label: 'Aceita' },
    { value: 'implemented', label: 'Implementada' },
    { value: 'dismissed', label: 'Descartada' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </div>
          <div className="text-sm text-gray-600">
            {filteredCount} de {totalCount} recomendações
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo</label>
            <select
              value={filters.type || ''}
              onChange={(e) => onFilterChange({ ...filters, type: e.target.value || undefined })}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Todos os tipos</option>
              {types.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Prioridade</label>
            <select
              value={filters.priority || ''}
              onChange={(e) => onFilterChange({ ...filters, priority: e.target.value || undefined })}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Todas as prioridades</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value || undefined })}
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Todos os status</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => onFilterChange({})}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Métricas de Recomendações
function RecommendationMetrics({ recommendations }: { recommendations: Recommendation[] }) {
  const totalRecommendations = recommendations.length
  const implementedCount = recommendations.filter(r => r.status === 'implemented').length
  const acceptedCount = recommendations.filter(r => r.status === 'accepted').length
  const pendingCount = recommendations.filter(r => r.status === 'pending').length
  
  const totalTimeSaved = recommendations
    .filter(r => r.status === 'implemented')
    .reduce((sum, r) => sum + (r.potential_impact.time_saved || 0), 0)
  
  const totalCostReduction = recommendations
    .filter(r => r.status === 'implemented')
    .reduce((sum, r) => sum + (r.potential_impact.cost_reduction || 0), 0)
  
  const implementationRate = totalRecommendations > 0 ? (implementedCount / totalRecommendations) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Métricas de Recomendações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalRecommendations}</div>
            <div className="text-sm text-gray-600">Total de Recomendações</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{implementedCount}</div>
            <div className="text-sm text-gray-600">Implementadas</div>
            <div className="text-xs text-gray-500 mt-1">
              Taxa: {implementationRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{totalTimeSaved}h</div>
            <div className="text-sm text-gray-600">Tempo Economizado</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              R$ {totalCostReduction.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Economia Gerada</div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Taxa de Implementação</span>
            <span>{implementationRate.toFixed(1)}%</span>
          </div>
          <Progress value={implementationRate} className="w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function AIRecommendations() {
  const { user } = useUser()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<RecommendationFilter>({})
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock data
      const mockRecommendations: Recommendation[] = [
        {
          id: '1',
          type: 'optimization',
          priority: 'high',
          title: 'Otimizar Orçamento das Campanhas Instagram',
          description: 'Identifiquei que suas campanhas do Instagram têm ROAS 45% superior ao Facebook. Recomendo realocação de 30% do orçamento.',
          reasoning: 'Análise de 30 dias mostra que Instagram Stories geram ROAS médio de 6.8x vs 4.2x do Facebook. Público feminino 25-35 anos converte melhor no Instagram.',
          confidence_score: 0.92,
          potential_impact: {
            revenue_increase: 15600,
            efficiency_gain: 25
          },
          implementation: {
            steps: [
              'Analisar performance detalhada por campanha',
              'Reduzir orçamento do Facebook em R$ 3.000',
              'Aumentar orçamento do Instagram em R$ 3.000',
              'Monitorar resultados por 7 dias',
              'Ajustar baseado na performance'
            ],
            estimated_time: '2 horas',
            difficulty: 'easy',
            required_resources: ['Facebook Ads Manager', 'Planilha de controle', 'Analytics']
          },
          status: 'pending',
          category: 'Marketing Digital',
          tags: ['ROAS', 'Instagram', 'Orçamento'],
          created_at: new Date(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          type: 'automation',
          priority: 'critical',
          title: 'Automatizar Relatórios de Performance',
          description: 'Você gasta 8h semanais criando relatórios manuais. Posso automatizar 90% desse processo.',
          reasoning: 'Detectei padrões repetitivos na criação de relatórios. Automação reduziria tempo gasto de 8h para 1h por semana.',
          confidence_score: 0.96,
          potential_impact: {
            time_saved: 7,
            cost_reduction: 2800,
            efficiency_gain: 40
          },
          implementation: {
            steps: [
              'Criar templates de relatórios automatizados',
              'Configurar conexões com APIs de dados',
              'Implementar geração automática semanal',
              'Configurar envio automático por email',
              'Criar dashboard para monitoramento'
            ],
            estimated_time: '4 horas',
            difficulty: 'medium',
            required_resources: ['APIs de integração', 'Templates', 'Sistema de email']
          },
          status: 'pending',
          category: 'Automação',
          tags: ['Relatórios', 'Automação', 'Produtividade'],
          created_at: new Date(),
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          type: 'content',
          priority: 'medium',
          title: 'Criar Conteúdo Sazonal para Q1',
          description: 'Baseado no histórico, conteúdo sazonal para Q1 aumenta engajamento em 35%. Recomendo criação antecipada.',
          reasoning: 'Análise de 2 anos mostra que posts sobre "Ano Novo" e "Volta às aulas" têm performance 35% superior em janeiro-março.',
          confidence_score: 0.83,
          potential_impact: {
            efficiency_gain: 35,
            revenue_increase: 8900
          },
          implementation: {
            steps: [
              'Pesquisar tendências sazonais para Q1',
              'Criar calendário editorial temático',
              'Produzir 20 posts sobre Ano Novo',
              'Criar 15 posts sobre Volta às aulas',
              'Agendar publicações otimizadas'
            ],
            estimated_time: '6 horas',
            difficulty: 'medium',
            required_resources: ['Designer', 'Copywriter', 'Ferramenta de agendamento']
          },
          status: 'accepted',
          category: 'Criação de Conteúdo',
          tags: ['Sazonal', 'Q1', 'Engajamento'],
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '4',
          type: 'strategy',
          priority: 'high',
          title: 'Implementar Funil de Remarketing Avançado',
          description: 'Apenas 12% dos visitantes convertem na primeira visita. Funil de remarketing pode recuperar 40% dos visitantes perdidos.',
          reasoning: 'Taxa de conversão de 12% está abaixo da média do setor (18%). Remarketing segmentado pode aumentar conversões em 40%.',
          confidence_score: 0.89,
          potential_impact: {
            revenue_increase: 22400,
            efficiency_gain: 40
          },
          implementation: {
            steps: [
              'Configurar pixels de rastreamento avançado',
              'Criar audiências segmentadas por comportamento',
              'Desenvolver criativos específicos por segmento',
              'Configurar campanhas de remarketing',
              'Implementar testes A/B contínuos'
            ],
            estimated_time: '8 horas',
            difficulty: 'hard',
            required_resources: ['Facebook Pixel', 'Google Analytics', 'Creative team', 'Budget adicional']
          },
          status: 'implemented',
          category: 'Estratégia Digital',
          tags: ['Remarketing', 'Conversão', 'Funil'],
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          id: '5',
          type: 'resource',
          priority: 'medium',
          title: 'Redistribuir Carga de Trabalho da Equipe',
          description: 'João está 120% sobrecarregado enquanto Maria tem 40% de capacidade disponível. Redistribuição otimizaria produtividade.',
          reasoning: 'Análise de workload mostra desequilíbrio. João tem 15 tarefas pendentes vs 6 de Maria. Redistribuição melhoraria eficiência geral.',
          confidence_score: 0.87,
          potential_impact: {
            efficiency_gain: 25,
            time_saved: 5
          },
          implementation: {
            steps: [
              'Analisar competências de cada membro',
              'Identificar tarefas transferíveis',
              'Transferir 4 tarefas de João para Maria',
              'Balancear cargas futuras automaticamente',
              'Monitorar produtividade pós-mudança'
            ],
            estimated_time: '3 horas',
            difficulty: 'easy',
            required_resources: ['Ferramenta de gestão', 'Reunião de equipe']
          },
          status: 'dismissed',
          category: 'Gestão de Recursos',
          tags: ['Equipe', 'Produtividade', 'Balanceamento'],
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ]

      setRecommendations(mockRecommendations)
      
    } catch (error) {
      console.error('Erro ao carregar recomendações:', error)
      toast.error('Erro ao carregar recomendações')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRecommendations()
    setRefreshing(false)
    toast.success('Recomendações atualizadas!')
  }

  const filteredRecommendations = recommendations.filter(rec => {
    if (filters.type && rec.type !== filters.type) return false
    if (filters.priority && rec.priority !== filters.priority) return false
    if (filters.status && rec.status !== filters.status) return false
    if (filters.category && rec.category !== filters.category) return false
    return true
  })

  const handleAccept = async (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, status: 'accepted' as const } : rec
      )
    )
    toast.success('Recomendação aceita!')
  }

  const handleDismiss = async (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, status: 'dismissed' as const } : rec
      )
    )
    toast.success('Recomendação descartada')
  }

  const handleImplement = async (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, status: 'implemented' as const } : rec
      )
    )
    toast.success('Recomendação implementada!')
  }

  const handleFeedback = async (id: string, feedback: any) => {
    toast.success(`Feedback registrado: ${feedback.helpful ? '👍' : '👎'}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
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
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Recomendações IA</h1>
            <p className="text-gray-600">Insights personalizados para otimizar sua operação</p>
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
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <RecommendationMetrics recommendations={recommendations} />

      {/* Filtros */}
      <RecommendationFilters
        filters={filters}
        onFilterChange={setFilters}
        totalCount={recommendations.length}
        filteredCount={filteredRecommendations.length}
      />

      {/* Lista de Recomendações */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma recomendação encontrada</h3>
              <p className="text-gray-600 mb-4">
                Não há recomendações que correspondam aos filtros selecionados.
              </p>
              <Button onClick={() => setFilters({})}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRecommendations.map(recommendation => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
              onImplement={handleImplement}
              onFeedback={handleFeedback}
            />
          ))
        )}
      </div>
    </div>
  )
}