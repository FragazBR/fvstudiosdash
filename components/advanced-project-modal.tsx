"use client"

import React, { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FolderKanban,
  Loader2,
  Building2,
  Users,
  Calendar,
  CheckSquare,
  Plus,
  X,
  Clock,
  DollarSign,
  Bell,
  MessageSquare,
  Briefcase,
  Target,
  Save,
  Trash2,
  User,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'

interface AdvancedProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: () => void
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
  email: string
  role: string
  avatar?: string
}

interface ProjectTask {
  id: string
  title: string
  description: string
  assigned_to?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  due_date?: string
  estimated_hours?: number
  dependencies?: string[]
}

interface ProjectMilestone {
  id: string
  title: string
  description: string
  due_date: string
  tasks: string[]
}

const supabase = supabaseBrowser()

export function AdvancedProjectModal({ isOpen, onClose, onProjectCreated }: AdvancedProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Data states
  const [clients, setClients] = useState<Client[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Form states
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    client_id: '',
    status: 'planning',
    priority: 'medium',
    budget_total: '',
    start_date: '',
    end_date: '',
    project_type: 'website',
    delivery_method: 'waterfall'
  })

  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [notificationSettings, setNotificationSettings] = useState({
    email_updates: true,
    slack_integration: false,
    deadline_reminders: true,
    progress_reports: 'weekly'
  })

  const { user } = useUser()

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  const loadInitialData = async () => {
    setLoadingData(true)
    try {
      await Promise.all([
        loadClients(),
        loadTeamMembers()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados iniciais')
    } finally {
      setLoadingData(false)
    }
  }

  const loadClients = async () => {
    // Get user profile to filter by agency
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', currentUser.id)
      .single()

    if (!userProfile?.agency_id) return

    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('id, contact_name, company, email')
      .eq('agency_id', userProfile.agency_id)
      .eq('status', 'active')
      .order('contact_name')

    if (error) {
      console.error('Erro ao carregar clientes:', error)
      return
    }

    // Transform to match the expected interface
    const transformedClients = (clientsData || []).map(client => ({
      id: client.id,
      name: client.contact_name,
      company: client.company,
      email: client.email
    }))

    setClients(transformedClients)
  }

  const loadTeamMembers = async () => {
    // Get user profile to filter by agency
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('agency_id')
      .eq('id', currentUser.id)
      .single()

    if (!userProfile?.agency_id) return

    const { data: membersData, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('agency_id', userProfile.agency_id)
      .in('role', ['agency_staff', 'agency_manager', 'agency_owner'])
      .eq('status', 'active')
      .order('full_name')

    if (error) {
      console.error('Erro ao carregar equipe:', error)
      return
    }

    // Transform to match the expected interface
    const transformedMembers = (membersData || []).map(member => ({
      id: member.id,
      name: member.full_name,
      email: member.email,
      role: member.role
    }))

    setTeamMembers(transformedMembers)
  }

  const addTask = () => {
    const newTask: ProjectTask = {
      id: Date.now().toString(),
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      estimated_hours: 1
    }
    setTasks([...tasks, newTask])
  }

  const updateTask = (taskId: string, field: string, value: any) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ))
  }

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const addMilestone = () => {
    const newMilestone: ProjectMilestone = {
      id: Date.now().toString(),
      title: '',
      description: '',
      due_date: '',
      tasks: []
    }
    setMilestones([...milestones, newMilestone])
  }

  const updateMilestone = (milestoneId: string, field: string, value: any) => {
    setMilestones(milestones.map(milestone => 
      milestone.id === milestoneId ? { ...milestone, [field]: value } : milestone
    ))
  }

  const removeMilestone = (milestoneId: string) => {
    setMilestones(milestones.filter(milestone => milestone.id !== milestoneId))
  }

  const generateDefaultTasks = (projectType: string) => {
    const taskTemplates = {
      website: [
        { title: 'Análise de Requisitos', description: 'Levantar e documentar requisitos do projeto', priority: 'high', estimated_hours: 8 },
        { title: 'Design UX/UI', description: 'Criar wireframes e layouts do sistema', priority: 'high', estimated_hours: 16 },
        { title: 'Desenvolvimento Frontend', description: 'Implementar interface do usuário', priority: 'medium', estimated_hours: 32 },
        { title: 'Desenvolvimento Backend', description: 'Criar APIs e lógica de negócio', priority: 'medium', estimated_hours: 24 },
        { title: 'Integração e Testes', description: 'Integrar componentes e realizar testes', priority: 'medium', estimated_hours: 12 },
        { title: 'Deploy e Go-live', description: 'Publicar projeto em produção', priority: 'high', estimated_hours: 4 }
      ],
      marketing: [
        { title: 'Briefing e Estratégia', description: 'Definir estratégia e público-alvo', priority: 'high', estimated_hours: 6 },
        { title: 'Criação de Conteúdo', description: 'Desenvolver materiais promocionais', priority: 'medium', estimated_hours: 20 },
        { title: 'Configuração de Campanhas', description: 'Setup em plataformas de ads', priority: 'medium', estimated_hours: 8 },
        { title: 'Lançamento', description: 'Ativar campanhas e monitorar início', priority: 'high', estimated_hours: 4 },
        { title: 'Otimização', description: 'Ajustar campanhas baseado em performance', priority: 'medium', estimated_hours: 12 }
      ],
      app: [
        { title: 'Prototipagem', description: 'Criar protótipos navegáveis', priority: 'high', estimated_hours: 12 },
        { title: 'Desenvolvimento iOS', description: 'Criar versão para iOS', priority: 'medium', estimated_hours: 40 },
        { title: 'Desenvolvimento Android', description: 'Criar versão para Android', priority: 'medium', estimated_hours: 40 },
        { title: 'Testes em Dispositivos', description: 'Testar em diferentes dispositivos', priority: 'medium', estimated_hours: 16 },
        { title: 'Publicação nas Stores', description: 'Submeter para App Store e Play Store', priority: 'high', estimated_hours: 8 }
      ],
      consulting: [
        { title: 'Diagnóstico Inicial', description: 'Avaliar situação atual do cliente', priority: 'high', estimated_hours: 8 },
        { title: 'Análise de Dados', description: 'Coletar e analisar métricas relevantes', priority: 'medium', estimated_hours: 16 },
        { title: 'Relatório de Recomendações', description: 'Criar documento com insights e ações', priority: 'high', estimated_hours: 12 },
        { title: 'Apresentação', description: 'Apresentar resultados ao cliente', priority: 'high', estimated_hours: 4 },
        { title: 'Acompanhamento', description: 'Monitorar implementação das recomendações', priority: 'medium', estimated_hours: 8 }
      ]
    }

    const templates = taskTemplates[projectType as keyof typeof taskTemplates] || taskTemplates.website
    const newTasks = templates.map((template, index) => ({
      id: (Date.now() + index).toString(),
      title: template.title,
      description: template.description,
      priority: template.priority as ProjectTask['priority'],
      status: 'todo' as ProjectTask['status'],
      estimated_hours: template.estimated_hours
    }))

    setTasks(newTasks)
    toast.success(`${newTasks.length} tarefas padrão adicionadas para projeto de ${projectType}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectData.name.trim()) {
      toast.error('Nome do projeto é obrigatório')
      setActiveTab('basic')
      return
    }

    if (!projectData.client_id) {
      toast.error('Cliente é obrigatório')
      setActiveTab('basic')
      return
    }

    if (tasks.some(task => !task.title.trim())) {
      toast.error('Todas as tarefas devem ter um título')
      setActiveTab('tasks')
      return
    }

    setLoading(true)

    try {
      // 1. Criar projeto
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        toast.error('Usuário não autenticado')
        return
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, agency_id')
        .eq('email', session.user.email)
        .single()

      if (!userProfile) {
        toast.error('Perfil de usuário não encontrado')
        return
      }

      const newProjectData = {
        name: projectData.name.trim(),
        description: projectData.description.trim() || null,
        client_id: projectData.client_id,
        status: projectData.status,
        priority: projectData.priority,
        budget_total: projectData.budget_total ? parseFloat(projectData.budget_total) : null,
        budget_spent: 0,
        start_date: projectData.start_date || null,
        end_date: projectData.end_date || null,
        project_type: projectData.project_type,
        delivery_method: projectData.delivery_method,
        agency_id: userProfile.agency_id,
        created_by: userProfile.id,
        team_members: selectedTeamMembers,
        notification_settings: notificationSettings
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([newProjectData])
        .select()
        .single()

      if (projectError) {
        console.error('Erro ao criar projeto:', projectError)
        toast.error('Erro ao criar projeto')
        return
      }

      // 2. Criar tarefas
      if (tasks.length > 0) {
        const taskData = tasks.map(task => ({
          title: task.title,
          description: task.description || null,
          project_id: project.id,
          assigned_to: task.assigned_to || null,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date || null,
          estimated_hours: task.estimated_hours || null,
          agency_id: userProfile.agency_id,
          created_by: userProfile.id
        }))

        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(taskData)

        if (tasksError) {
          console.error('Erro ao criar tarefas:', tasksError)
          toast.error('Projeto criado, mas erro ao criar tarefas')
        }
      }

      // 3. Criar marcos se existirem
      if (milestones.length > 0) {
        const milestoneData = milestones.map(milestone => ({
          title: milestone.title,
          description: milestone.description || null,
          project_id: project.id,
          due_date: milestone.due_date,
          agency_id: userProfile.agency_id,
          created_by: userProfile.id
        }))

        const { error: milestonesError } = await supabase
          .from('project_milestones')
          .insert(milestoneData)

        if (milestonesError) {
          console.error('Erro ao criar marcos:', milestonesError)
          toast.error('Projeto criado, mas erro ao criar marcos')
        }
      }

      // 4. Associar membros da equipe
      if (selectedTeamMembers.length > 0) {
        const teamData = selectedTeamMembers.map(memberId => ({
          project_id: project.id,
          user_id: memberId,
          role: 'member',
          joined_at: new Date().toISOString()
        }))

        const { error: teamError } = await supabase
          .from('project_team_members')
          .insert(teamData)

        if (teamError) {
          console.error('Erro ao adicionar equipe:', teamError)
          toast.error('Projeto criado, mas erro ao associar equipe')
        }
      }

      toast.success(`Projeto "${projectData.name}" criado com sucesso!`)
      resetForm()
      onProjectCreated()
      onClose()

    } catch (error) {
      console.error('Erro inesperado:', error)
      toast.error('Erro inesperado ao criar projeto')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setProjectData({
      name: '',
      description: '',
      client_id: '',
      status: 'planning',
      priority: 'medium',
      budget_total: '',
      start_date: '',
      end_date: '',
      project_type: 'website',
      delivery_method: 'waterfall'
    })
    setTasks([])
    setMilestones([])
    setSelectedTeamMembers([])
    setNotificationSettings({
      email_updates: true,
      slack_integration: false,
      deadline_reminders: true,
      progress_reports: 'weekly'
    })
    setActiveTab('basic')
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      resetForm()
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getStatusColor = (status: string) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800'
    }
    return colors[status as keyof typeof colors] || colors.todo
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-blue-600" />
            Novo Projeto Avançado
          </DialogTitle>
          <DialogDescription>
            Crie um projeto completo com tarefas, equipe, marcos e configurações integradas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Equipe
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Cronograma
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            {/* Aba Informações Básicas */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-name">Nome do Projeto *</Label>
                  <Input
                    id="project-name"
                    value={projectData.name}
                    onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                    placeholder="Ex: Website Corporativo"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="client">Cliente *</Label>
                  <Select 
                    value={projectData.client_id}
                    onValueChange={(value) => setProjectData({...projectData, client_id: value})}
                    disabled={loading || loadingData}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione um cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <div>
                              <span className="font-medium">{client.name}</span>
                              {client.company && (
                                <span className="text-xs text-gray-500 ml-2">{client.company}</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                  placeholder="Descreva os objetivos e escopo do projeto..."
                  rows={3}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="project-type">Tipo de Projeto</Label>
                  <Select
                    value={projectData.project_type}
                    onValueChange={(value) => {
                      setProjectData({...projectData, project_type: value})
                      if (tasks.length === 0) {
                        generateDefaultTasks(value)
                      }
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="app">App Mobile</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="consulting">Consultoria</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={projectData.priority}
                    onValueChange={(value) => setProjectData({...projectData, priority: value})}
                    disabled={loading}
                  >
                    <SelectTrigger className="mt-1">
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
                  <Label htmlFor="budget">Orçamento (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={projectData.budget_total}
                    onChange={(e) => setProjectData({...projectData, budget_total: e.target.value})}
                    placeholder="0.00"
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Data de Início</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={projectData.start_date}
                    onChange={(e) => setProjectData({...projectData, start_date: e.target.value})}
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Data de Entrega</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={projectData.end_date}
                    onChange={(e) => setProjectData({...projectData, end_date: e.target.value})}
                    disabled={loading}
                    min={projectData.start_date}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Aba Tarefas */}
            <TabsContent value="tasks" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Tarefas do Projeto</h3>
                  <p className="text-sm text-gray-600">Defina as tarefas principais que compõem este projeto</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => generateDefaultTasks(projectData.project_type)}
                    disabled={loading}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Gerar Tarefas Padrão
                  </Button>
                  <Button
                    type="button"
                    onClick={addTask}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {tasks.map((task, index) => (
                  <Card key={task.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              placeholder="Título da tarefa"
                              value={task.title}
                              onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                              disabled={loading}
                            />
                            <Select
                              value={task.assigned_to || ''}
                              onValueChange={(value) => updateTask(task.id, 'assigned_to', value)}
                              disabled={loading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Atribuir para..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Não atribuído</SelectItem>
                                {teamMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      {member.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Textarea
                            placeholder="Descrição da tarefa (opcional)"
                            value={task.description}
                            onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                            rows={2}
                            disabled={loading}
                          />

                          <div className="grid grid-cols-4 gap-3">
                            <Select
                              value={task.priority}
                              onValueChange={(value) => updateTask(task.id, 'priority', value)}
                              disabled={loading}
                            >
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

                            <Select
                              value={task.status}
                              onValueChange={(value) => updateTask(task.id, 'status', value)}
                              disabled={loading}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todo">A Fazer</SelectItem>
                                <SelectItem value="in_progress">Em Progresso</SelectItem>
                                <SelectItem value="review">Em Revisão</SelectItem>
                                <SelectItem value="completed">Concluída</SelectItem>
                              </SelectContent>
                            </Select>

                            <Input
                              type="date"
                              placeholder="Data limite"
                              value={task.due_date || ''}
                              onChange={(e) => updateTask(task.id, 'due_date', e.target.value)}
                              disabled={loading}
                            />

                            <Input
                              type="number"
                              placeholder="Horas"
                              value={task.estimated_hours || ''}
                              onChange={(e) => updateTask(task.id, 'estimated_hours', parseInt(e.target.value))}
                              min="0"
                              disabled={loading}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            {task.estimated_hours && (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {task.estimated_hours}h
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTask(task.id)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma tarefa adicionada ainda</p>
                    <p className="text-sm">Clique em "Nova Tarefa" ou "Gerar Tarefas Padrão" para começar</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Aba Equipe */}
            <TabsContent value="team" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Membros da Equipe</h3>
                <p className="text-sm text-gray-600 mb-4">Selecione os membros que irão trabalhar neste projeto</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTeamMembers.includes(member.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (selectedTeamMembers.includes(member.id)) {
                          setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== member.id))
                        } else {
                          setSelectedTeamMembers([...selectedTeamMembers, member.id])
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gray-100">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          <Badge variant="outline" className="mt-1">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTeamMembers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">
                      {selectedTeamMembers.length} membro(s) selecionado(s)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeamMembers.map((memberId) => {
                        const member = teamMembers.find(m => m.id === memberId)
                        return member ? (
                          <Badge key={member.id} variant="secondary">
                            {member.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Aba Cronograma */}
            <TabsContent value="timeline" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Marco e Entregas</h3>
                  <p className="text-sm text-gray-600">Defina marcos importantes do projeto</p>
                </div>
                <Button
                  type="button"
                  onClick={addMilestone}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Marco
                </Button>
              </div>

              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Título do marco"
                              value={milestone.title}
                              onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                              disabled={loading}
                            />

                            <Textarea
                              placeholder="Descrição do marco"
                              value={milestone.description}
                              onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                              rows={2}
                              disabled={loading}
                            />

                            <Input
                              type="date"
                              value={milestone.due_date}
                              onChange={(e) => updateMilestone(milestone.id, 'due_date', e.target.value)}
                              disabled={loading}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMilestone(milestone.id)}
                            disabled={loading}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {milestones.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum marco adicionado ainda</p>
                    <p className="text-sm">Marcos ajudam a acompanhar o progresso do projeto</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Aba Configurações */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Configurações do Projeto</h3>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Notificações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Atualizações por Email</Label>
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_updates}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            email_updates: e.target.checked
                          })}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Lembretes de Prazo</Label>
                        <input
                          type="checkbox"
                          checked={notificationSettings.deadline_reminders}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            deadline_reminders: e.target.checked
                          })}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Integração Slack</Label>
                        <input
                          type="checkbox"
                          checked={notificationSettings.slack_integration}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            slack_integration: e.target.checked
                          })}
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <Label>Relatórios de Progresso</Label>
                        <Select
                          value={notificationSettings.progress_reports}
                          onValueChange={(value) => setNotificationSettings({
                            ...notificationSettings,
                            progress_reports: value
                          })}
                          disabled={loading}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diário</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="never">Nunca</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Metodologia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Label>Método de Entrega</Label>
                      <Select
                        value={projectData.delivery_method}
                        onValueChange={(value) => setProjectData({...projectData, delivery_method: value})}
                        disabled={loading}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waterfall">Waterfall</SelectItem>
                          <SelectItem value="agile">Ágil</SelectItem>
                          <SelectItem value="scrum">Scrum</SelectItem>
                          <SelectItem value="kanban">Kanban</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !projectData.name.trim() || !projectData.client_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Projeto...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Criar Projeto Completo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}