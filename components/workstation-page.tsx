'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
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
  MoreHorizontal
} from 'lucide-react'
import { WORKFLOW_STAGES, type Project, type WorkflowStage, type AIAgent } from '@/types/workflow'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock data para demonstração
const mockProjects: Project[] = [
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStageProgress = (project: Project) => {
    const currentStageIndex = WORKFLOW_STAGES.findIndex(stage => stage.id === project.currentStage)
    return ((currentStageIndex + 1) / WORKFLOW_STAGES.length) * 100
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workstation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie projetos individuais e acompanhe todas as etapas do workflow
          </p>
        </div>
        <Button className="bg-[#64f481] hover:bg-[#50d66f] text-black">
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
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
            <SelectItem value="discovery">Discovery</SelectItem>
            <SelectItem value="planning">Planejamento</SelectItem>
            <SelectItem value="production">Produção</SelectItem>
            <SelectItem value="approval">Aprovação</SelectItem>
            <SelectItem value="campaign">Campanha</SelectItem>
            <SelectItem value="reporting">Relatório</SelectItem>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card 
            key={project.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedProject(project)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(project.status)}
                  <Badge variant={project.priority === 'high' ? 'destructive' : 'secondary'}>
                    {project.priority}
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
                    <span>Progresso</span>
                    <span>{Math.round(getStageProgress(project))}%</span>
                  </div>
                  <Progress value={getStageProgress(project)} className="h-2" />
                </div>

                {/* Current Stage */}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Etapa Atual</p>
                  <Badge className={getStageColor(
                    WORKFLOW_STAGES.find(s => s.id === project.currentStage)!,
                    true
                  )}>
                    {WORKFLOW_STAGES.find(s => s.id === project.currentStage)?.name}
                  </Badge>
                </div>

                {/* Team */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member) => (
                      <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.team.length > 3 && (
                      <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center text-xs border-2 border-white">
                        +{project.team.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Entrega: {project.timeline.endDate.toLocaleDateString()}</span>
                </div>

                {/* AI Agents Active */}
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#64f481]" />
                  <span className="text-sm text-gray-600">
                    {mockAIAgents.filter(agent => agent.isActive).length} IA Agents ativos
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </div>
  )
}

function ProjectDetailModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const currentStageIndex = WORKFLOW_STAGES.findIndex(stage => stage.id === project.currentStage)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            <h3 className="text-lg font-semibold mb-4">Workflow Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WORKFLOW_STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex
                const isActive = index === currentStageIndex
                const isNext = index === currentStageIndex + 1

                return (
                  <Card key={stage.id} className={`${isActive ? 'ring-2 ring-[#64f481]' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-3 w-3 rounded-full ${
                          isCompleted ? 'bg-green-500' : 
                          isActive ? 'bg-[#64f481]' : 
                          'bg-gray-300'
                        }`} />
                        <h4 className="font-medium text-sm">{stage.name}</h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{stage.description}</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{stage.duration}</span>
                      </div>
                      {isActive && (
                        <Badge className="mt-2 bg-[#64f481] text-black text-xs">
                          Em Andamento
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
                <Card key={agent.id}>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.team.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cronograma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.timeline.milestones.map((milestone) => (
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
