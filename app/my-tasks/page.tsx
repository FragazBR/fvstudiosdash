'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle,
  Circle,
  AlertCircle,
  Users,
  FolderKanban,
  Activity,
  Building2,
  ArrowRight,
  CalendarDays
} from 'lucide-react'

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  due_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  project?: {
    id: string;
    name: string;
    status: string;
    client?: {
      id: string;
      name: string;
      company?: string;
    };
  };
  assigned_to?: {
    id: string;
    name: string;
    email: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />
    case 'review': return <AlertCircle className="h-4 w-4 text-purple-500" />
    default: return <Circle className="h-4 w-4 text-gray-400" />
  }
}

function MyTasksContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0
  })

  useEffect(() => {
    fetchAllTasks()
  }, [])

  const fetchAllTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        const tasksData = data.tasks || []
        
        // Ordenar por prioridade de entrega
        const sortedTasks = tasksData.sort((a: Task, b: Task) => {
          // Primeiro, tarefas com due_date
          if (a.due_date && b.due_date) {
            const dateA = new Date(a.due_date).getTime()
            const dateB = new Date(b.due_date).getTime()
            if (dateA !== dateB) return dateA - dateB
          }
          if (a.due_date && !b.due_date) return -1
          if (!a.due_date && b.due_date) return 1
          
          // Segundo, por prioridade
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          const priorityDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1)
          if (priorityDiff !== 0) return priorityDiff
          
          // Por último, por status (in_progress primeiro)
          const statusOrder = { in_progress: 3, review: 2, todo: 1, completed: 0, cancelled: 0 }
          return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0)
        })
        
        setTasks(sortedTasks)
        
        // Calcular estatísticas
        const totalTasks = tasksData.length
        const completedTasks = tasksData.filter((t: Task) => t.status === 'completed').length
        const inProgressTasks = tasksData.filter((t: Task) => t.status === 'in_progress').length
        const overdueTasks = tasksData.filter((t: Task) => 
          t.due_date && 
          t.status !== 'completed' && 
          new Date(t.due_date) < new Date()
        ).length
        
        setStats({
          totalTasks,
          completedTasks,
          inProgressTasks,
          overdueTasks
        })
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.project?.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === '' || task.status === filterStatus
    const matchesPriority = filterPriority === '' || task.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const isOverdue = (task: Task) => {
    return task.due_date && 
           task.status !== 'completed' && 
           new Date(task.due_date) < new Date()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sem prazo'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getDaysUntilDue = (dateString?: string) => {
    if (!dateString) return null
    const dueDate = new Date(dateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const groupTasksByDate = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      later: [],
      noDueDate: []
    }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const endOfWeek = new Date(today)
    endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()))
    const endOfNextWeek = new Date(endOfWeek)
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7)

    tasks.forEach(task => {
      if (!task.due_date) {
        groups.noDueDate.push(task)
        return
      }

      const dueDate = new Date(task.due_date)
      const isTaskOverdue = isOverdue(task)

      if (isTaskOverdue) {
        groups.overdue.push(task)
      } else if (dueDate.toDateString() === today.toDateString()) {
        groups.today.push(task)
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        groups.tomorrow.push(task)
      } else if (dueDate <= endOfWeek) {
        groups.thisWeek.push(task)
      } else if (dueDate <= endOfNextWeek) {
        groups.nextWeek.push(task)
      } else {
        groups.later.push(task)
      }
    })

    return groups
  }

  const taskGroups = groupTasksByDate(filteredTasks)
  
  const groupLabels = {
    overdue: 'Atrasadas',
    today: 'Hoje',
    tomorrow: 'Amanhã', 
    thisWeek: 'Esta Semana',
    nextWeek: 'Próxima Semana',
    later: 'Mais Tarde',
    noDueDate: 'Sem Prazo'
  }

  const groupColors = {
    overdue: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    today: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    tomorrow: 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    thisWeek: 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    nextWeek: 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    later: 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800',
    noDueDate: 'text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-800'
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Minhas Tarefas"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                  <CalendarDays className="h-8 w-8 text-blue-500" />
                  Timeline de Tarefas
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Todas as suas tarefas organizadas por prioridade de entrega
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar tarefas, projetos ou clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-w-[120px]"
              >
                <option value="">Todos os status</option>
                <option value="todo">A fazer</option>
                <option value="in_progress">Em progresso</option>
                <option value="review">Em revisão</option>
                <option value="completed">Concluído</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-w-[120px]"
              >
                <option value="">Todas prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tarefas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTasks}</p>
                    </div>
                    <FolderKanban className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Concluídas</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Progresso</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgressTasks}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Atrasadas</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdueTasks}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Timeline */}
            {loading ? (
              <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-8 w-32 mb-4" />
                    <div className="space-y-4">
                      {[...Array(2)].map((_, j) => (
                        <Card key={j} className="bg-white/90 dark:bg-[#171717]/60">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <Skeleton className="h-8 w-8" />
                                <div className="space-y-2 flex-1">
                                  <Skeleton className="h-5 w-2/3" />
                                  <Skeleton className="h-4 w-1/2" />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(taskGroups).map(([groupKey, groupTasks]) => {
                  if (groupTasks.length === 0) return null
                  
                  return (
                    <div key={groupKey} className="space-y-4">
                      <div className={`flex items-center gap-3 pb-2 border-b-2 ${groupColors[groupKey as keyof typeof groupColors]}`}>
                        <h2 className="text-xl font-semibold">
                          {groupLabels[groupKey as keyof typeof groupLabels]}
                        </h2>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {groupTasks.length}
                        </Badge>
                      </div>
                      
                      <div className="space-y-4">
                        {groupTasks.map((task) => {
                          const daysUntilDue = getDaysUntilDue(task.due_date)
                          const overdue = isOverdue(task)
                          
                          return (
                            <Card key={task.id} className={`bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md transition-all duration-200 ${overdue ? 'border-l-4 border-l-red-500' : ''}`}>
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    {getStatusIcon(task.status)}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                          {task.title}
                                        </h3>
                                        {overdue && (
                                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                            Atrasada
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                          <FolderKanban className="h-4 w-4" />
                                          <span>{task.project?.name}</span>
                                        </div>
                                        
                                        {task.project?.client && (
                                          <div className="flex items-center gap-1">
                                            <Building2 className="h-4 w-4" />
                                            <span>
                                              {task.project.client.company || task.project.client.name}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {task.assigned_to && (
                                          <div className="flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            <span>{task.assigned_to.name}</span>
                                          </div>
                                        )}
                                        
                                        {task.due_date && (
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatDate(task.due_date)}</span>
                                            {daysUntilDue !== null && !overdue && (
                                              <span className={`ml-1 ${daysUntilDue <= 3 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                                                ({daysUntilDue > 0 ? `${daysUntilDue} dias` : 'Hoje'})
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {task.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                      
                                      {task.progress > 0 && (
                                        <div className="mt-3">
                                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                            <span>Progresso</span>
                                            <span>{task.progress}%</span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div 
                                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                              style={{ width: `${task.progress}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge className={getStatusColor(task.status)} variant="secondary">
                                      {task.status}
                                    </Badge>
                                    <Badge className={getPriorityColor(task.priority)} variant="outline">
                                      {task.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {tasks.length === 0 ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa encontrada com os filtros aplicados'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function MyTasksPage() {
  return <MyTasksContent />
}