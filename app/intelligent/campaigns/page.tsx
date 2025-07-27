'use client'

// ==================================================
// FVStudios Dashboard - Análise Inteligente de Campanhas
// Sistema completo de análise de performance com IA
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
import { toast } from 'sonner'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  DollarSign,
  Clock,
  Zap,
  Brain,
  Activity,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Settings,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface Campaign {
  id: string
  name: string
  platform: 'facebook' | 'instagram' | 'google' | 'tiktok' | 'linkedin'
  status: 'active' | 'paused' | 'draft' | 'completed'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roas: number
  created_at: Date
  updated_at: Date
}

interface CampaignInsight {
  id: string
  campaign_id: string
  type: 'optimization' | 'warning' | 'success' | 'recommendation'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  action_required: boolean
  suggested_actions: string[]
  created_at: Date
}

interface PlatformPerformance {
  platform: string
  campaigns: number
  total_spent: number
  total_conversions: number
  avg_roas: number
  best_performing: string
  trend: 'up' | 'down' | 'stable'
}

// ==================================================
// COMPONENTES
// ==================================================

// Performance Overview
function CampaignOverview({ campaigns }: { campaigns: Campaign[] }) {
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const avgROAS = campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length : 0

  const metrics = [
    {
      title: 'Campanhas Ativas',
      value: campaigns.filter(c => c.status === 'active').length,
      total: campaigns.length,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Orçamento Total',
      value: `R$ ${totalBudget.toLocaleString()}`,
      subtitle: `Gasto: R$ ${totalSpent.toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Conversões',
      value: totalConversions.toLocaleString(),
      subtitle: 'Este mês',
      icon: <Target className="h-5 w-5" />,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      title: 'ROAS Médio',
      value: `${avgROAS.toFixed(2)}x`,
      subtitle: avgROAS > 3 ? 'Excelente' : avgROAS > 2 ? 'Bom' : 'Precisa melhorar',
      icon: <TrendingUp className="h-5 w-5" />,
      color: avgROAS > 3 ? 'text-green-600' : avgROAS > 2 ? 'text-yellow-600' : 'text-red-600',
      bg: avgROAS > 3 ? 'bg-green-100' : avgROAS > 2 ? 'bg-yellow-100' : 'bg-red-100'
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

// Lista de Campanhas com IA
function CampaignsList({ campaigns, insights, onOptimize }: {
  campaigns: Campaign[]
  insights: CampaignInsight[]
  onOptimize: (campaignId: string) => void
}) {
  const [filteredCampaigns, setFilteredCampaigns] = useState(campaigns)
  const [filter, setFilter] = useState<'all' | 'active' | 'needs_attention'>('all')

  useEffect(() => {
    let filtered = campaigns
    
    if (filter === 'active') {
      filtered = campaigns.filter(c => c.status === 'active')
    } else if (filter === 'needs_attention') {
      const campaignsWithIssues = insights
        .filter(i => i.type === 'warning' || i.action_required)
        .map(i => i.campaign_id)
      filtered = campaigns.filter(c => campaignsWithIssues.includes(c.id))
    }
    
    setFilteredCampaigns(filtered)
  }, [campaigns, insights, filter])

  const getCampaignInsights = (campaignId: string) => {
    return insights.filter(i => i.campaign_id === campaignId)
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      google: '🔍',
      tiktok: '🎵',
      linkedin: '💼'
    }
    return icons[platform as keyof typeof icons] || '📊'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800'
    }
    return colors[status as keyof typeof colors]
  }

  const getPerformanceColor = (roas: number) => {
    if (roas >= 3) return 'text-green-600'
    if (roas >= 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance das Campanhas
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({campaigns.length})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Ativas ({campaigns.filter(c => c.status === 'active').length})
              </Button>
              <Button
                variant={filter === 'needs_attention' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('needs_attention')}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Atenção
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredCampaigns.map(campaign => {
            const campaignInsights = getCampaignInsights(campaign.id)
            const hasWarnings = campaignInsights.some(i => i.type === 'warning')
            const hasRecommendations = campaignInsights.some(i => i.type === 'recommendation')

            return (
              <div 
                key={campaign.id}
                className="p-4 border rounded-lg hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getPlatformIcon(campaign.platform)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <span className="text-sm text-gray-500 capitalize">
                          {campaign.platform}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasWarnings && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Atenção
                      </Badge>
                    )}
                    {hasRecommendations && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        IA Sugere
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-gray-600">Orçamento</div>
                    <div className="font-semibold">R$ {campaign.budget.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      Gasto: R$ {campaign.spent.toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Conversões</div>
                    <div className="font-semibold">{campaign.conversions}</div>
                    <div className="text-xs text-gray-500">
                      CTR: {campaign.ctr.toFixed(2)}%
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">CPC</div>
                    <div className="font-semibold">R$ {campaign.cpc.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {campaign.clicks.toLocaleString()} clicks
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">ROAS</div>
                    <div className={`font-semibold ${getPerformanceColor(campaign.roas)}`}>
                      {campaign.roas.toFixed(2)}x
                    </div>
                    <div className="text-xs text-gray-500">
                      {campaign.impressions.toLocaleString()} views
                    </div>
                  </div>
                </div>

                {campaignInsights.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium mb-2">Insights da IA:</div>
                    <div className="space-y-1">
                      {campaignInsights.slice(0, 2).map(insight => (
                        <div 
                          key={insight.id}
                          className={`text-xs p-2 rounded ${
                            insight.type === 'warning' ? 'bg-red-50 text-red-700' :
                            insight.type === 'recommendation' ? 'bg-blue-50 text-blue-700' :
                            insight.type === 'success' ? 'bg-green-50 text-green-700' :
                            'bg-gray-50 text-gray-700'
                          }`}
                        >
                          <strong>{insight.title}:</strong> {insight.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Atualizado: {new Date(campaign.updated_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Detalhes
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onOptimize(campaign.id)}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    >
                      <Brain className="h-3 w-3 mr-1" />
                      Otimizar IA
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

export default function IntelligentCampaignsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [insights, setInsights] = useState<CampaignInsight[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadCampaignData()
    }
  }, [user])

  const loadCampaignData = async () => {
    try {
      setLoading(true)
      
      // Buscar campanhas reais da Meta Marketing API
      const response = await fetch('/api/meta/campaigns', {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar campanhas')
      }

      const data = await response.json()
      
      if (data.success && data.campaigns) {
        // Converter dados da Meta API para formato local
        const metaCampaigns: Campaign[] = data.campaigns.map((metaCampaign: any) => ({
          id: metaCampaign.id,
          name: metaCampaign.name,
          platform: 'facebook' as const,
          status: metaCampaign.status.toLowerCase() as 'active' | 'paused' | 'draft' | 'completed',
          budget: parseFloat(metaCampaign.daily_budget || metaCampaign.lifetime_budget || '0') / 100,
          spent: parseFloat(metaCampaign.insights?.spend || '0'),
          impressions: parseInt(metaCampaign.insights?.impressions || '0'),
          clicks: parseInt(metaCampaign.insights?.clicks || '0'),
          conversions: metaCampaign.insights?.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0,
          ctr: parseFloat(metaCampaign.insights?.ctr || '0'),
          cpc: parseFloat(metaCampaign.insights?.cpc || '0'),
          roas: calculateRoas(metaCampaign.insights),
          created_at: new Date(metaCampaign.created_time),
          updated_at: new Date(metaCampaign.updated_time || metaCampaign.created_time)
        }))

        setCampaigns(metaCampaigns)

        // Buscar insights de IA
        const insightsResponse = await fetch('/api/meta/insights', {
          headers: {
            'Authorization': `Bearer ${user?.access_token || ''}`
          }
        })

        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json()
          
          if (insightsData.success && insightsData.aiInsights) {
            const formattedInsights: CampaignInsight[] = insightsData.aiInsights.map((insight: any) => ({
              id: insight.id || Math.random().toString(),
              campaign_id: metaCampaigns[0]?.id || '1', // Associar ao primeiro ou usar default
              type: insight.impact_level === 'high' && insight.category.includes('optimization') ? 'warning' : 
                    insight.impact_level === 'high' && insight.category.includes('opportunity') ? 'success' : 'recommendation',
              title: insight.title,
              description: insight.description,
              impact: insight.impact_level as 'high' | 'medium' | 'low',
              action_required: insight.impact_level === 'high',
              suggested_actions: insight.suggested_actions || [],
              created_at: new Date()
            }))

            setInsights(formattedInsights)
          }
        }
      } else {
        // Fallback para dados mock se a API não estiver configurada
        toast.info('Configure a Meta Marketing API em /intelligent/settings para ver dados reais')
        loadMockData()
      }

    } catch (error) {
      console.error('Erro ao carregar dados das campanhas:', error)
      toast.error('Erro ao carregar campanhas. Verifique a configuração da API.')
      loadMockData() // Fallback para dados mock
    } finally {
      setLoading(false)
    }
  }

  const calculateRoas = (insights: any): number => {
    if (!insights) return 0
    
    const spend = parseFloat(insights.spend || '0')
    const revenue = insights.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0
    
    if (spend === 0) return 0
    return revenue / spend
  }

  const loadMockData = () => {
    // Dados mock como fallback
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Black Friday - Produtos Premium',
        platform: 'facebook',
        status: 'active',
        budget: 5000,
        spent: 3200,
        impressions: 45000,
        clicks: 890,
        conversions: 67,
        ctr: 1.98,
        cpc: 3.60,
        roas: 4.2,
        created_at: new Date('2024-01-15'),
        updated_at: new Date()
      },
      {
        id: '2',
        name: 'Instagram Stories - Jovem Público',
        platform: 'instagram',
        status: 'active',
        budget: 2500,
        spent: 1800,
        impressions: 28000,
        clicks: 420,
        conversions: 23,
        ctr: 1.50,
        cpc: 4.29,
        roas: 2.1,
        created_at: new Date('2024-01-10'),
        updated_at: new Date()
      }
    ]

    const mockInsights: CampaignInsight[] = [
      {
        id: '1',
        campaign_id: '2',
        type: 'warning',
        title: 'ROAS Baixo Detectado',
        description: 'ROAS de 2.1x está abaixo da meta de 3x. Configure a Meta API para análises reais.',
        impact: 'high',
        action_required: true,
        suggested_actions: [
          'Configurar Meta Marketing API em /intelligent/settings',
          'Verificar credenciais de acesso',
          'Testar conexão com Facebook/Instagram'
        ],
        created_at: new Date()
      }
    ]

    setCampaigns(mockCampaigns)
    setInsights(mockInsights)
  }

  const handleOptimizeCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) return

    toast.success(`Iniciando otimização IA para "${campaign.name}"...`)
    
    try {
      // Otimização real via Meta Marketing API
      const response = await fetch('/api/meta/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          action: 'optimize',
          campaignId: campaignId,
          optimizations: [
            'budget_adjustment',
            'audience_expansion', 
            'creative_rotation'
          ]
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          toast.success('Otimização aplicada com sucesso!')
          // Recarregar dados atualizados
          await loadCampaignData()
        } else {
          throw new Error('Erro na otimização')
        }
      } else {
        throw new Error('Erro na requisição')
      }
    } catch (error) {
      console.error('Erro na otimização:', error)
      toast.error('Otimização via API não disponível. Configure a Meta API em /intelligent/settings')
      
      // Simular otimização para demonstração
      setTimeout(() => {
        toast.success('Simulação de otimização concluída!')
      }, 2000)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadCampaignData()
    setRefreshing(false)
    toast.success('Dados atualizados!')
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
            name="Análise de Campanhas"
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded animate-pulse" />
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
          name="Análise Inteligente de Campanhas"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Análise de Campanhas</h1>
                  <p className="text-gray-600">IA analisa performance e sugere otimizações</p>
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
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => router.push('/intelligent/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar APIs
                </Button>
              </div>
            </div>

            {/* Overview */}
            <CampaignOverview campaigns={campaigns} />

            {/* Campanhas List */}
            <CampaignsList 
              campaigns={campaigns}
              insights={insights}
              onOptimize={handleOptimizeCampaign}
            />
          </div>
        </main>
      </div>
    </div>
  )
}