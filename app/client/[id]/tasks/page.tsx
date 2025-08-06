'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NewTaskModal } from '@/components/new-task-modal'
import ClientTaskBoard from '@/components/client-task-board'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  FolderKanban,
  Activity,
  Clock,
  Circle
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

interface Client {
  id: string;
  contact_name: string; // SCHEMA PADRONIZADO WORKSTATION
  email: string;
  company?: string;
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

function ClientTasksContent() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0
  })

  useEffect(() => {
    fetchClientData()
    fetchClientTasks()
  }, [clientId])

  const fetchClientData = async () => {
    try {
      const response = await fetch(`/api/contacts/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data.contact)
      }
    } catch (error) {
      console.error('Error fetching client data:', error)
    }
  }

  const fetchClientTasks = async () => {
    try {
      // Primeiro, buscar projetos do cliente
      const projectsResponse = await fetch(`/api/projects?client_id=${clientId}`)
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        const clientProjects = projectsData.projects || []
        
        console.log(`Found ${clientProjects.length} projects for client ${clientId}`);
        
        // Depois, buscar tarefas de todos os projetos do cliente em paralelo
        const allTasks: Task[] = []
        if (clientProjects.length > 0) {
          const taskPromises = clientProjects.map(async (project) => {
            try {
              const tasksResponse = await fetch(`/api/tasks?project_id=${project.id}`)
              if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json()
                return tasksData.tasks || []
              }
              return []
            } catch (error) {
              console.error(`Error fetching tasks for project ${project.id}:`, error)
              return []
            }
          })
          
          const taskResults = await Promise.all(taskPromises)
          taskResults.forEach(tasks => allTasks.push(...tasks))
        }
        
        setTasks(allTasks)
        
        // Calcular estatísticas
        const totalTasks = allTasks.length
        const completedTasks = allTasks.filter(t => t.status === 'completed').length
        const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length
        const overdueTasks = allTasks.filter(t => 
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
      } else {
        console.error('Failed to fetch projects:', projectsResponse.status, projectsResponse.statusText)
        setTasks([])
        setStats({
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0
        })
      }
    } catch (error) {
      console.error('Error fetching client tasks:', error)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name={client ? `Tarefas - ${client.contact_name}` : "Tarefas do Cliente"}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-4">
                  {client && (
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {client.contact_name?.charAt(0)?.toUpperCase() || client.email?.charAt(0)?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {client ? `Tarefas - ${client.contact_name}` : 'Carregando...'}
                    </h1>
                    {client && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {client.company && `${client.company} • `}{client.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
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

            {/* Kanban Board */}
            <ClientTaskBoard 
              clientId={clientId}
              onTaskCreated={fetchClientTasks}
            />
          </div>
        </main>
      </div>

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onTaskCreated={fetchClientTasks}
        preSelectedClientId={clientId}
      />
    </div>
  )
}

export default function ClientTasksPage() {
  return <ClientTasksContent />
}