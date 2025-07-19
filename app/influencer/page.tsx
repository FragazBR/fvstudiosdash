'use client'

import { useState } from 'react'
import { PermissionGuard } from '@/components/permission-guard'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Video, 
  Image, 
  Calendar, 
  BarChart3, 
  Bot, 
  Star,
  Clock,
  TrendingUp,
  Plus,
  Play,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Target,
  Sparkles
} from 'lucide-react'

function InfluencerDashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  // Mock data para influencer
  const stats = [
    { title: 'Projetos Ativos', value: '7', icon: Video, color: 'text-red-600', limit: '/ 15' },
    { title: 'IA Requests', value: '875', icon: Bot, color: 'text-purple-600', limit: '/ 3k' },
    { title: 'Storage Usado', value: '8.5GB', icon: BarChart3, color: 'text-orange-600', limit: '/ 25GB' },
    { title: 'Conteúdos/Mês', value: '24', icon: Sparkles, color: 'text-green-600', limit: 'Meta: 30' }
  ]

  const currentProjects = [
    { 
      name: 'Série YouTube: Tech Reviews', 
      type: 'YouTube', 
      progress: 65, 
      deadline: '3 dias',
      status: 'Em produção'
    },
    { 
      name: 'Posts Instagram: Lifestyle', 
      type: 'Instagram', 
      progress: 90, 
      deadline: 'Amanhã',
      status: 'Finalização'
    },
    { 
      name: 'TikTok: Trends da Semana', 
      type: 'TikTok', 
      progress: 30, 
      deadline: '5 dias',
      status: 'Roteiro'
    }
  ]

  const contentMetrics = [
    { platform: 'YouTube', views: '125K', engagement: '8.5%', growth: '+12%' },
    { platform: 'Instagram', views: '89K', engagement: '6.2%', growth: '+8%' },
    { platform: 'TikTok', views: '340K', engagement: '12.1%', growth: '+25%' }
  ]

  const aiTools = [
    { name: 'Gerador de Ideias', usage: '12 hoje', color: 'bg-blue-100 text-blue-800' },
    { name: 'Editor de Texto', usage: '8 hoje', color: 'bg-green-100 text-green-800' },
    { name: 'Criador de Hashtags', usage: '5 hoje', color: 'bg-purple-100 text-purple-800' },
    { name: 'Análise de Tendências', usage: '3 hoje', color: 'bg-orange-100 text-orange-800' }
  ]

  return (
    <div className="bg-gray-50 dark:bg-[#121212]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Topbar
          name="Dashboard Criador"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Estúdio do Criador
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Centralize sua produção de conteúdo e maximize seus resultados
                  </p>
                </div>
                <Button onClick={() => router.push('/influencer/new-project')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index} className="bg-white dark:bg-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stat.value}
                        <span className="text-sm text-gray-500 ml-1">{stat.limit}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Projetos em Andamento */}
              <div className="lg:col-span-2">
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Video className="h-5 w-5 mr-2" />
                      Projetos em Andamento
                    </CardTitle>
                    <CardDescription>
                      Acompanhe o progresso dos seus conteúdos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentProjects.map((project, index) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-gray-500">{project.type}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">{project.status}</Badge>
                              <p className="text-xs text-gray-500 mt-1">{project.deadline}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso</span>
                              <span>{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/projects')}>
                      Ver Todos os Projetos
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Ferramentas de IA */}
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="h-5 w-5 mr-2" />
                    IA Assistente
                  </CardTitle>
                  <CardDescription>
                    Ferramentas inteligentes para criação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiTools.map((tool, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div>
                          <p className="font-medium text-sm">{tool.name}</p>
                          <p className="text-xs text-gray-500">{tool.usage}</p>
                        </div>
                        <Badge className={tool.color} variant="secondary">
                          Disponível
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/ai-agents')}>
                    Abrir IA Studio
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Métricas de Performance */}
            <Card className="bg-white dark:bg-gray-800 mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance das Plataformas
                </CardTitle>
                <CardDescription>
                  Acompanhe o desempenho do seu conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {contentMetrics.map((metric, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{metric.platform}</h4>
                        <Badge variant="outline" className="text-green-600">
                          {metric.growth}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            Views
                          </span>
                          <span className="font-semibold">{metric.views}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            Engagement
                          </span>
                          <span className="font-semibold">{metric.engagement}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ferramentas Rápidas */}
            <Card className="bg-white dark:bg-gray-800 mt-8">
              <CardHeader>
                <CardTitle>Ferramentas de Criação</CardTitle>
                <CardDescription>
                  Acesse rapidamente suas ferramentas favoritas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => router.push('/content-calendar')}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                    <p className="font-medium">Calendário</p>
                    <p className="text-xs text-gray-500">Planejamento</p>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/trend-analyzer')}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                    <p className="font-medium">Tendências</p>
                    <p className="text-xs text-gray-500">Análise</p>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/content-ideas')}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Sparkles className="h-8 w-8 text-purple-600 mb-2" />
                    <p className="font-medium">Ideias</p>
                    <p className="text-xs text-gray-500">IA Criativo</p>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/analytics')}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Target className="h-8 w-8 text-orange-600 mb-2" />
                    <p className="font-medium">Analytics</p>
                    <p className="text-xs text-gray-500">Métricas</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function InfluencerPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'influencer']} showUnauthorized>
      <InfluencerDashboardContent />
    </PermissionGuard>
  )
}
