'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { AdvancedProjectModal } from '@/components/advanced-project-modal'
import {
  FolderKanban,
  Search,
  Filter,
  Eye,
  Calendar,
  Users,
  TrendingUp,
  Activity,
  Clock,
  DollarSign,
  Plus,
  Building2
} from 'lucide-react'

// SCHEMA PADRONIZADO WORKSTATION
interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'planning' | 'active' | 'on_hold' | 'completed' | 'canceled' | 'archived'; // ENUMs padronizados
  priority: 'low' | 'medium' | 'high' | 'urgent'; // priority_level enum
  budget_cents?: number; // Valores em centavos para precisão
  start_date?: string;
  end_date?: string;
  progress_percentage?: number; // Campo do schema workstation
  created_at: string;
  client?: {
    id: string;
    contact_name: string; // Usar contact_name do schema
    email: string;
    company?: string;
  };
  creator?: {
    id: string;
    full_name: string; // Usar full_name do schema
  };
  workstation_id?: string; // Referência à workstation
  tasks?: any[];
}

interface ClientGroup {
  client: {
    id: string;
    name: string; // Mapeado de contact_name
    email: string;
    company?: string;
  };
  projects: Project[];
  totalBudget: number;
  activeProjects: number;
  completedProjects: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

function ProjectsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedClientParam = searchParams.get('client')
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalBudget: 0,
    totalClients: 0
  })
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        const projectsData = data.projects || []
        setProjects(projectsData)

        // Agrupar projetos por cliente
        const groupedByClient = projectsData.reduce((acc: { [key: string]: ClientGroup }, project: Project) => {
          if (project.client) {
            const clientId = project.client.id
            if (!acc[clientId]) {
              acc[clientId] = {
                client: {
                  id: project.client.id,
                  name: project.client.contact_name, // Mapear contact_name para name
                  email: project.client.email,
                  company: project.client.company
                },
                projects: [],
                totalBudget: 0,
                activeProjects: 0,
                completedProjects: 0
              }
            }
            acc[clientId].projects.push(project)
            acc[clientId].totalBudget += (project.budget_cents || 0) / 100 // Converter centavos para reais
            if (project.status === 'active') acc[clientId].activeProjects++
            if (project.status === 'completed') acc[clientId].completedProjects++
          }
          return acc
        }, {})

        const clientGroupsArray = Object.values(groupedByClient) as ClientGroup[]
        setClientGroups(clientGroupsArray)

        // Calcular estatísticas
        const totalProjects = projectsData.length
        const activeProjects = projectsData.filter((p: Project) => p.status === 'active').length
        const totalBudget = projectsData.reduce((sum: number, p: Project) => sum + ((p.budget_cents || 0) / 100), 0)
        const totalClients = clientGroupsArray.length

        setStats({
          totalProjects,
          activeProjects,
          totalBudget,
          totalClients
        })
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClientClick = (clientId: string) => {
    router.push(`/client/${clientId}/tasks`)
  }

  const filteredClientGroups = clientGroups.filter(group =>
    group.client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.projects.some(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Se há um cliente específico selecionado, filtrar apenas esse
  const displayGroups = selectedClientParam 
    ? filteredClientGroups.filter(group => group.client.id === selectedClientParam)
    : filteredClientGroups

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name={selectedClientParam ? "Projetos do Cliente" : "Projetos"}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                  <FolderKanban className="h-8 w-8 text-blue-500" />
                  Projetos por Cliente
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Organize seus projetos agrupados por cliente
                </p>
              </div>
              
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar clientes ou projetos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projetos</p>
                      {loading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProjects}</p>
                      )}
                    </div>
                    <FolderKanban className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projetos Ativos</p>
                      {loading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeProjects}</p>
                      )}
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clientes</p>
                      {loading ? (
                        <Skeleton className="h-8 w-12" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalClients}</p>
                      )}
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Total</p>
                      {loading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0 
                          }).format(stats.totalBudget)}
                        </p>
                      )}
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Loading skeleton */}
            {loading ? (
              <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-white/90 dark:bg-[#171717]/60">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(2)].map((_, j) => (
                          <div key={j} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Client Groups */}
                <div className="space-y-8">
                  {displayGroups.map((clientGroup) => (
                    <Card key={clientGroup.client.id} className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                      <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/50 transition-colors" onClick={() => handleClientClick(clientGroup.client.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {clientGroup.client.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                {clientGroup.client.name}
                                {clientGroup.client.company && (
                                  <span className="text-sm text-gray-500 font-normal">
                                    - {clientGroup.client.company}
                                  </span>
                                )}
                              </CardTitle>
                              <p className="text-gray-600 dark:text-gray-400">{clientGroup.client.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{clientGroup.projects.length}</p>
                              <p>Projetos</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">{clientGroup.activeProjects}</p>
                              <p>Ativos</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(clientGroup.totalBudget)}
                              </p>
                              <p>Total</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {clientGroup.projects.map((project) => (
                            <div key={project.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {project.name}
                                  </h4>
                                  <div className="flex gap-1">
                                    <Badge className={getStatusColor(project.status)} variant="secondary">
                                      {project.status}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {project.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {project.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-1">
                                    <Badge className={getPriorityColor(project.priority)} variant="outline">
                                      {project.priority}
                                    </Badge>
                                  </div>
                                  {project.budget_cents && (
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(project.budget_cents / 100)}
                                    </span>
                                  )}
                                </div>
                                
                                {project.tasks && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {project.tasks.length} tarefa{project.tasks.length !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 flex justify-center">
                          <Button 
                            onClick={() => handleClientClick(clientGroup.client.id)}
                            className="w-full sm:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Todas as Tarefas do Cliente
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Empty state */}
                {!loading && displayGroups.length === 0 && (
                  <div className="text-center py-12">
                    <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {clientGroups.length === 0 ? 'Nenhum projeto cadastrado ainda' : 'Nenhum resultado encontrado'}
                    </p>
                    <Button onClick={() => setIsNewProjectModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Projeto
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      
      {/* Advanced Project Modal */}
      <AdvancedProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={fetchProjects}
      />
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <ProjectsContent />
    </Suspense>
  )
}