'use client'

import { useState } from 'react'
import { PermissionGuard } from '@/components/permission-guard'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FolderKanban, 
  Calendar, 
  BarChart3, 
  Bot, 
  Star,
  Clock,
  CheckCircle,
  TrendingUp,
  Plus,
  UserPlus,
  Settings
} from 'lucide-react'

function IndependentDashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  // Mock data para produtor independente
  const stats = [
    { title: 'Clientes Ativos', value: '5', icon: Users, color: 'text-blue-600', limit: '/ 10' },
    { title: 'Projetos', value: '8', icon: FolderKanban, color: 'text-green-600', limit: '/ 25' },
    { title: 'IA Requests', value: '1.2k', icon: Bot, color: 'text-purple-600', limit: '/ 5k' },
    { title: 'Storage', value: '15GB', icon: BarChart3, color: 'text-orange-600', limit: '/ 50GB' }
  ]

  const recentProjects = [
    { name: 'Campanha Instagram - Cliente A', status: 'Em Andamento', progress: 75, deadline: '2 dias' },
    { name: 'Estratégia de Conteúdo - Cliente B', status: 'Finalizado', progress: 100, deadline: 'Concluído' },
    { name: 'Planejamento Q1 - Cliente C', status: 'Planejamento', progress: 25, deadline: '1 semana' }
  ]

  const myClients = [
    { name: 'Cliente A', company: 'Tech Startup', status: 'Ativo', projects: 3 },
    { name: 'Cliente B', company: 'E-commerce', status: 'Ativo', projects: 2 },
    { name: 'Cliente C', company: 'Consultoria', status: 'Novo', projects: 1 }
  ]

  return (
    <div className="bg-gray-50 dark:bg-[#121212]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Topbar
          name="Dashboard Independente"
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
                    Painel do Produtor Independente
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Gerencie seus clientes e projetos de forma autônoma
                  </p>
                </div>
                <Button onClick={() => router.push('/independent/new-client')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Cliente
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Projetos Recentes */}
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FolderKanban className="h-5 w-5 mr-2" />
                    Projetos Recentes
                  </CardTitle>
                  <CardDescription>
                    Acompanhe o progresso dos seus projetos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentProjects.map((project, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{project.name}</p>
                          <Badge variant={project.status === 'Finalizado' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Progresso: {project.progress}%</span>
                          <span>{project.deadline}</span>
                        </div>
                        <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div 
                            className="bg-green-600 h-1.5 rounded-full transition-all" 
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/projects')}>
                    Ver Todos os Projetos
                  </Button>
                </CardContent>
              </Card>

              {/* Meus Clientes */}
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Meus Clientes
                  </CardTitle>
                  <CardDescription>
                    Gerencie sua carteira de clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myClients.map((client, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className="text-xs text-gray-500">{client.company}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={client.status === 'Ativo' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{client.projects} projetos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/independent/clients')}>
                    Gerenciar Clientes
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Ferramentas e Acesso Rápido */}
            <Card className="bg-white dark:bg-gray-800 mt-8">
              <CardHeader>
                <CardTitle>Ferramentas de Produção</CardTitle>
                <CardDescription>
                  Acesse rapidamente suas ferramentas de trabalho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => router.push('/ai-agents')}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Bot className="h-8 w-8 text-purple-600 mb-2" />
                    <p className="font-medium">IA Assistente</p>
                    <p className="text-xs text-gray-500">Automação e conteúdo</p>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/calendar')}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                    <p className="font-medium">Calendário</p>
                    <p className="text-xs text-gray-500">Agendamento</p>
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
                    onClick={() => router.push('/reports')}
                    className="p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                    <p className="font-medium">Relatórios</p>
                    <p className="text-xs text-gray-500">Analytics</p>
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

export default function IndependentPage() {
  return (
    <PermissionGuard allowedRoles={['admin', 'independent']} showUnauthorized>
      <IndependentDashboardContent />
    </PermissionGuard>
  )
}
