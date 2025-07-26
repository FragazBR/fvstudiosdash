'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import Sidebar from './sidebar'
import Topbar from './Shared/Topbar'
import { Toaster } from '@/components/ui/toaster'
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Users,
  Calendar,
  Target,
  Bot,
  Filter,
  Search,
  Plus,
  MoreHorizontal,
  TrendingUp,
  Eye,
  Timer,
  Zap,
  BarChart3
} from 'lucide-react'
import { WORKFLOW_STAGES, type Project, type WorkflowStage, type AIAgent } from '@/types/workflow'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces para dados reais
interface WorkstationProject {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  current_stage: string;
  stage_progress: number;
  client: {
    id: string;
    name: string;
    email?: string;
  };
  start_date: string;
  end_date: string;
  budget_total?: number;
  budget_spent?: number;
  team_size: number;
  tasks_total: number;
  tasks_completed: number;
  days_remaining: number;
  created_at: string;
  updated_at: string;
}

interface ProductionMetrics {
  totalProjects: number;
  activeProjects: number;
  projectsOnTrack: number;
  projectsDelayed: number;
  projectsBlocked: number;
  averageProgress: number;
  totalTasks: number;
  completedTasks: number;
  teamUtilization: number;
}

// Mock data para demonstração
const mockProjects: any[] = [
  {
    id: '1',
    name: 'Campanha Nike - Summer Collection',
    client: {
      id: '1',
      name: 'Nike Brasil',
      contact: {
        name: 'Maria Silva',
        email: 'maria@nike.com',
        phone: '(11) 99999-9999',
        company: 'Nike Brasil',
        position: 'Marketing Manager'
      },
      industry: 'Fashion',
      size: 'large',
      goals: ['Increase brand awareness', 'Drive sales'],
      currentChallenges: ['Market competition'],
      budget: 150000,
      timeline: '3 months',
      apiKeys: {
        google: { enabled: true, accountId: 'google-123' },
        meta: { enabled: true, accountId: 'meta-456' },
        tiktok: { enabled: false }
      },
      assignedTeam: ['team-1'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      projects: ['1'],
      totalProjects: 3,
      activeProjects: 1,
      completedProjects: 2,
      revenue: 450000
    },
    description: 'Campanha de verão para Nike focada em produtos esportivos',
    status: 'production',
    priority: 'high',
    currentStage: 'desenvolvimento',
    team: [
      { id: '1', name: 'João Santos', role: 'Project Manager', avatar: '', email: 'joao@agency.com', skills: ['PM', 'Strategy'] }
    ],
    timeline: {
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-04-15'),
      milestones: [
        { id: '1', name: 'Kick-off', date: new Date('2024-01-15'), completed: true },
        { id: '2', name: 'Creative Review', date: new Date('2024-02-15'), completed: false }
      ]
    },
    budget: {
      total: 150000,
      allocated: 120000,
      spent: 75000,
      remaining: 45000,
      breakdown: [
        { category: 'Creative', amount: 50000, spent: 30000 },
        { category: 'Media', amount: 100000, spent: 45000 }
      ]
    },
    deliverables: [],
    tags: ['nike', 'fashion', 'summer'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockAIAgents: AIAgent[] = [
  {
    id: '1',
    name: 'Creative Assistant',
    type: 'content',
    workflowStage: 'criacao_conteudo',
    description: 'Auxilia na criação de conteúdo e ideias criativas',
    capabilities: ['Content generation', 'Creative brainstorming', 'Copy writing'],
    isActive: true
  },
  {
    id: '2',
    name: 'Analytics Bot',
    type: 'analytics',
    workflowStage: 'relatorio',
    description: 'Analisa dados e gera insights de performance',
    capabilities: ['Data analysis', 'Report generation', 'Performance insights'],
    isActive: true
  }
]

export function WorkstationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [projects, setProjects] = useState<WorkstationProject[]>([])
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  
  // Buscar dados reais do banco de dados
  useEffect(() => {
    const fetchWorkstationData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          // Buscar projetos com dados completos
          const projectsResponse = await fetch('/api/projects?limit=50&include_tasks=true&include_team=true', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            
            // Transformar dados para formato da Workstation
            const transformedProjects = (projectsData.projects || []).map((project: any) => {
              const totalTasks = (project.tasks && Array.isArray(project.tasks)) ? project.tasks.length : 0;
              const completedTasks = (project.tasks && Array.isArray(project.tasks)) ? 
                project.tasks.filter((task: any) => task?.status === 'completed').length : 0;
              const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              
              // Calcular stage baseado no progresso
              const stageIndex = Math.floor((progress / 100) * WORKFLOW_STAGES.length);
              const currentStage = WORKFLOW_STAGES[Math.min(stageIndex, WORKFLOW_STAGES.length - 1)];
              
              // Calcular dias restantes
              const endDate = new Date(project.end_date || Date.now());
              const today = new Date();
              const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return {
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                priority: project.priority || 'medium',
                current_stage: currentStage.id,
                stage_progress: progress,
                client: {
                  id: project.client?.id || 'unknown',
                  name: project.client?.name || 'Cliente não informado',
                  email: project.client?.email
                },
                start_date: project.start_date || project.created_at,
                end_date: project.end_date || project.created_at,
                budget_total: project.budget_total,
                budget_spent: project.budget_spent,
                team_size: (project.tasks && Array.isArray(project.tasks)) ? 
                  project.tasks
                    .map((task: any) => task?.assigned_to?.id)
                    .filter((id: string | undefined) => id)
                    .filter((id: string, index: number, arr: string[]) => arr.indexOf(id) === index)
                    .length || 1 : 1,
                tasks_total: totalTasks,
                tasks_completed: completedTasks,
                days_remaining: daysRemaining,
                created_at: project.created_at,
                updated_at: project.updated_at
              };
            });
            
            setProjects(transformedProjects);
            
            // Calcular métricas
            const activeProjects = transformedProjects.filter((p: any) => p.status === 'active');
            const onTrackProjects = activeProjects.filter((p: any) => p.days_remaining > 0 && p.stage_progress >= 50);
            const delayedProjects = activeProjects.filter((p: any) => p.days_remaining < 0);
            const blockedProjects = transformedProjects.filter((p: any) => p.status === 'on_hold');
            
            const totalTasks = transformedProjects.reduce((sum: number, p: any) => sum + p.tasks_total, 0);
            const completedTasks = transformedProjects.reduce((sum: number, p: any) => sum + p.tasks_completed, 0);
            const averageProgress = transformedProjects.reduce((sum: number, p: any) => sum + p.stage_progress, 0) / transformedProjects.length;
            
            setMetrics({
              totalProjects: transformedProjects.length,
              activeProjects: activeProjects.length,
              projectsOnTrack: onTrackProjects.length,
              projectsDelayed: delayedProjects.length,
              projectsBlocked: blockedProjects.length,
              averageProgress: averageProgress || 0,
              totalTasks,
              completedTasks,
              teamUtilization: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados da workstation:', error);
        // Usar dados mock em caso de erro
        setProjects(mockProjects.map(p => ({
          ...p,
          current_stage: p.currentStage,
          stage_progress: 65,
          team_size: p.team.length,
          tasks_total: 12,
          tasks_completed: 8,
          days_remaining: 15
        })));
        setMetrics({
          totalProjects: 1,
          activeProjects: 1,
          projectsOnTrack: 1,
          projectsDelayed: 0,
          projectsBlocked: 0,
          averageProgress: 65,
          totalTasks: 12,
          completedTasks: 8,
          teamUtilization: 67
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkstationData();
  }, [user?.id]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
    const matchesStage = stageFilter === 'all' || project.current_stage === stageFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesStage
  })

  const getStageProgress = (project: WorkstationProject) => {
    return project.stage_progress || 0
  }
  
  const getProjectHealth = (project: WorkstationProject) => {
    if (project.days_remaining < 0) return 'delayed';
    if (project.days_remaining <= 3) return 'urgent';
    if (project.stage_progress < 30 && project.days_remaining <= 10) return 'at_risk';
    return 'healthy';
  }
  
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'delayed': return 'bg-red-500 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'at_risk': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  }
  
  const getHealthText = (health: string) => {
    switch (health) {
      case 'delayed': return 'Atrasado';
      case 'urgent': return 'Urgente';
      case 'at_risk': return 'Em Risco';
      default: return 'No Prazo';
    }
  }

  const getStageColor = (stage: WorkflowStage, isActive: boolean) => {
    if (isActive) return 'bg-[#64f481] text-black'
    if (stage.status === 'completed') return 'bg-green-100 text-green-800'
    if (stage.status === 'in_progress') return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-600'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'in_progress': return <Play className="h-4 w-4" />
      case 'on_hold': return <Pause className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col pt-16">
        <Topbar
          name="Estação de Trabalho"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Production Control Center</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Centro de comando para monitoramento e controle do workflow de produção
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#64f481] text-[#64f481] hover:bg-[#64f481] hover:text-black">
                <Eye className="h-4 w-4 mr-2" />
                Visão Geral
              </Button>
              <Button 
                onClick={() => window.location.href = '/projects/new'}
                className="bg-[#64f481] hover:bg-[#50d66f] text-black"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </div>
          </div>
          
          {/* Métricas de Produção */}
          {metrics && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Projetos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalProjects}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Em Produção</p>
                      <p className="text-2xl font-bold text-green-600">{metrics.activeProjects}</p>
                    </div>
                    <Play className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">No Prazo</p>
                      <p className="text-2xl font-bold text-green-600">{metrics.projectsOnTrack}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Atrasados</p>
                      <p className="text-2xl font-bold text-red-600">{metrics.projectsDelayed}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Progresso Médio</p>
                      <p className="text-2xl font-bold text-blue-600">{Math.round(metrics.averageProgress)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Utilização</p>
                      <p className="text-2xl font-bold text-purple-600">{Math.round(metrics.teamUtilization)}%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="on_hold">Pausado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Etapas</SelectItem>
                {WORKFLOW_STAGES.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const health = getProjectHealth(project);
                return (
                  <Card 
                    key={project.id} 
                    className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(project.status)}
                          <Badge variant={project.priority === 'high' || project.priority === 'urgent' ? 'destructive' : 'secondary'}>
                            {project.priority}
                          </Badge>
                          <Badge className={getHealthColor(health) + ' text-xs'}>
                            {getHealthText(health)}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>{project.client.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progresso do Workflow</span>
                            <span>{Math.round(getStageProgress(project))}%</span>
                          </div>
                          <Progress value={getStageProgress(project)} className="h-2" />
                        </div>

                        {/* Current Stage */}
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Etapa Atual</p>
                          <Badge className={getStageColor(
                            WORKFLOW_STAGES.find(s => s.id === project.current_stage) || WORKFLOW_STAGES[0],
                            true
                          )}>
                            {WORKFLOW_STAGES.find(s => s.id === project.current_stage)?.name || 'Não definido'}
                          </Badge>
                        </div>

                        {/* Tasks Progress */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Tarefas</span>
                          <span className="font-medium">
                            {project.tasks_completed}/{project.tasks_total}
                          </span>
                        </div>

                        {/* Team Size */}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {project.team_size} membro{project.team_size !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Timeline */}
                        <div className="flex items-center gap-2 text-sm">
                          <Timer className="h-4 w-4 text-gray-400" />
                          <span className={`${
                            project.days_remaining < 0 ? 'text-red-600' : 
                            project.days_remaining <= 3 ? 'text-orange-600' : 
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {project.days_remaining < 0 ? 
                              `${Math.abs(project.days_remaining)} dias de atraso` :
                              `${project.days_remaining} dias restantes`
                            }
                          </span>
                        </div>

                        {/* Budget Progress */}
                        {project.budget_total && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Orçamento:</span>
                            <span className="font-medium">
                              {Math.round(((project.budget_spent || 0) / project.budget_total) * 100)}% usado
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
        </div>
      </div>
      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

function ProjectDetailModal({ project, onClose }: { project: any; onClose: () => void }) {
  const currentStageIndex = WORKFLOW_STAGES.findIndex(stage => stage.id === (project.current_stage || project.currentStage))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border border-gray-200 dark:border-[#272727] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{project.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{project.client.name}</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Workflow Progress */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Workflow Progress - Sistema FVStudios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WORKFLOW_STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex
                const isActive = index === currentStageIndex
                const isNext = index === currentStageIndex + 1
                const progress = project.stage_progress || 0
                const stageProgress = Math.max(0, Math.min(100, (progress - (index * (100 / WORKFLOW_STAGES.length)))))

                return (
                  <Card key={stage.id} className={`bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200 ${isActive ? 'ring-2 ring-[#64f481]' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-3 w-3 rounded-full ${
                          isCompleted ? 'bg-green-500' : 
                          isActive ? 'bg-[#64f481]' : 
                          'bg-gray-300'
                        }`} />
                        <h4 className="font-medium text-sm">{stage.name}</h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{stage.description}</p>
                      
                      {/* Progresso da etapa */}
                      {isActive && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progresso</span>
                            <span>{Math.round(Math.min(100, Math.max(0, stageProgress)))}%</span>
                          </div>
                          <Progress value={Math.min(100, Math.max(0, stageProgress))} className="h-1" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{stage.duration}</span>
                      </div>
                      
                      {/* Tools necessárias */}
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Ferramentas:</p>
                        <div className="flex flex-wrap gap-1">
                          {stage.tools.slice(0, 2).map((tool) => (
                            <Badge key={tool} variant="outline" className="text-xs px-1 py-0">
                              {tool}
                            </Badge>
                          ))}
                          {stage.tools.length > 2 && (
                            <span className="text-xs text-gray-400">+{stage.tools.length - 2}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Deliverables */}
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Entregáveis:</p>
                        <div className="text-xs text-gray-600">
                          {stage.deliverables.slice(0, 2).join(', ')}
                          {stage.deliverables.length > 2 && '...'}
                        </div>
                      </div>
                      
                      {isActive && (
                        <Badge className="mt-2 bg-[#64f481] text-black text-xs">
                          Em Andamento
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="mt-2 bg-green-500 text-white text-xs">
                          Concluído
                        </Badge>
                      )}
                      {!isActive && !isCompleted && (
                        <Badge className="mt-2 bg-gray-200 text-gray-600 text-xs">
                          Pendente
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* AI Agents for Current Stage */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">IA Agents para esta Etapa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockAIAgents.filter(agent => 
                agent.workflowStage === project.currentStage
              ).map((agent) => (
                <Card key={agent.id} className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Bot className="h-5 w-5 text-[#64f481]" />
                      <h4 className="font-medium">{agent.name}</h4>
                      <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                        {agent.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Team & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg">Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.team.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map((n: any) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg">Cronograma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.timeline.milestones.map((milestone: any) => (
                    <div key={milestone.id} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${
                        milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{milestone.name}</p>
                        <p className="text-xs text-gray-600">
                          {milestone.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
