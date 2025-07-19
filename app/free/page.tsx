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
  FolderKanban, 
  Calendar, 
  BarChart3, 
  Crown, 
  Lock,
  Star,
  Clock,
  CheckCircle,
  Plus,
  Zap,
  Gift,
  ArrowRight,
  AlertTriangle
} from 'lucide-react'

function FreeDashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  // Mock data para usuário gratuito
  const stats = [
    { title: 'Projetos', value: '2', icon: FolderKanban, color: 'text-green-600', limit: '/ 3', used: 67 },
    { title: 'Storage', value: '0.3GB', icon: BarChart3, color: 'text-blue-600', limit: '/ 1GB', used: 30 },
    { title: 'Tarefas Ativas', value: '8', icon: CheckCircle, color: 'text-purple-600', limit: '/ 15', used: 53 },
    { title: 'Eventos', value: '4', icon: Calendar, color: 'text-orange-600', limit: '/ 10', used: 40 }
  ]

  const currentProjects = [
    { 
      name: 'Projeto Pessoal - Blog', 
      progress: 45, 
      deadline: '2 semanas',
      status: 'Em andamento'
    },
    { 
      name: 'Estudo de Design', 
      progress: 75, 
      deadline: '3 dias',
      status: 'Quase pronto'
    }
  ]

  const premiumFeatures = [
    { name: 'IA Assistente', description: 'Automação e geração de conteúdo', icon: Zap },
    { name: 'Projetos Ilimitados', description: 'Sem limite de projetos ativos', icon: FolderKanban },
    { name: 'Analytics Avançado', description: 'Relatórios detalhados', icon: BarChart3 },
    { name: 'Storage 50GB', description: 'Muito mais espaço para seus arquivos', icon: BarChart3 },
    { name: 'Suporte Prioritário', description: 'Atendimento especializado', icon: Star },
    { name: 'Integrações', description: 'Conecte com suas ferramentas favoritas', icon: ArrowRight }
  ]

  return (
    <div className="bg-gray-50 dark:bg-[#121212]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Topbar
          name="Dashboard Gratuito"
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
                    Bem-vindo ao FVStudios
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Organize seus projetos pessoais com nossa versão gratuita
                  </p>
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" onClick={() => router.push('/upgrade')}>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Premium
                </Button>
              </div>
            </div>

            {/* Upgrade Banner */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gift className="h-8 w-8 text-purple-600 mr-4" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        🚀 Desbloqueie todo o potencial!
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Upgrade para Premium e tenha acesso a IA, projetos ilimitados e muito mais!
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => router.push('/pricing')}>
                    Ver Planos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards with Usage */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                const isNearLimit = stat.used > 80
                return (
                  <Card key={index} className="bg-white dark:bg-gray-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <div className="flex items-center">
                        <Icon className={`h-4 w-4 ${stat.color} mr-1`} />
                        {isNearLimit && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">
                        {stat.value}
                        <span className="text-sm text-gray-500 ml-1">{stat.limit}</span>
                      </div>
                      <Progress value={stat.used} className="h-1" />
                      <p className="text-xs text-gray-500 mt-1">{stat.used}% utilizado</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Projetos Atuais */}
              <div className="lg:col-span-2">
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FolderKanban className="h-5 w-5 mr-2" />
                        Seus Projetos
                      </div>
                      <Badge variant="secondary">2/3 usados</Badge>
                    </CardTitle>
                    <CardDescription>
                      Gerencie seus projetos pessoais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {currentProjects.map((project, index) => (
                        <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-medium">{project.name}</p>
                            <Badge variant="outline">{project.status}</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso</span>
                              <span>{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                            <p className="text-xs text-gray-500">Prazo: {project.deadline}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Adicionar novo projeto */}
                      <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                        <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Você pode criar mais 1 projeto
                        </p>
                        <Button variant="outline" size="sm" onClick={() => router.push('/projects/new')}>
                          Criar Projeto
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Features Premium */}
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-purple-600" />
                    Recursos Premium
                  </CardTitle>
                  <CardDescription>
                    Desbloqueie funcionalidades avançadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {premiumFeatures.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-start p-2 bg-gray-50 dark:bg-gray-700 rounded opacity-60">
                        <Lock className="h-4 w-4 text-gray-400 mt-1 mr-2" />
                        <div>
                          <p className="font-medium text-sm text-gray-600">{feature.name}</p>
                          <p className="text-xs text-gray-500">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={() => router.push('/pricing')}
                  >
                    Desbloquear Premium
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Ferramentas Disponíveis */}
            <Card className="bg-white dark:bg-gray-800 mt-8">
              <CardHeader>
                <CardTitle>Ferramentas Gratuitas</CardTitle>
                <CardDescription>
                  Funcionalidades disponíveis no seu plano atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => router.push('/calendar')}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                    <p className="font-medium">Calendário</p>
                    <p className="text-xs text-gray-500">Básico</p>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/kanban')}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FolderKanban className="h-8 w-8 text-green-600 mb-2" />
                    <p className="font-medium">Kanban</p>
                    <p className="text-xs text-gray-500">Organização</p>
                  </button>
                  
                  <button 
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 opacity-60 cursor-not-allowed"
                  >
                    <div className="flex items-center mb-2">
                      <Zap className="h-8 w-8 text-gray-400" />
                      <Lock className="h-4 w-4 text-gray-400 ml-1" />
                    </div>
                    <p className="font-medium text-gray-500">IA Assistente</p>
                    <p className="text-xs text-gray-400">Premium</p>
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

export default function FreePage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'free']} showUnauthorized>
      <FreeDashboardContent />
    </PermissionGuard>
  )
}
