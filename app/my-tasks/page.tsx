'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import PersonalTaskBoard from '@/components/personal-task-board'
import TimelineView from '@/components/timeline-view'
import { NewTaskModal } from '@/components/new-task-modal'
import { useUser } from '@/hooks/useUser'
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  FolderKanban,
  Activity,
  LayoutGrid,
  List,
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
    department_id?: string;
    specialization_id?: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

function MyTasksContent() {
  const { user } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0
  })
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)

  useEffect(() => {
    fetchUserTasks()
  }, [user?.id])

  const fetchUserTasks = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      
      // Fetch all tasks and filter by current user
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        const allTasks = data.tasks || []
        
        // Filter tasks assigned to current user
        const userTasks = allTasks.filter((task: Task) => 
          task.assigned_to?.id === user?.id
        )
        
        setTasks(userTasks)
        
        // Calcular estatísticas das tarefas do usuário
        const totalTasks = userTasks.length
        const completedTasks = userTasks.filter((t: Task) => t.status === 'completed').length
        const inProgressTasks = userTasks.filter((t: Task) => t.status === 'in_progress').length
        const overdueTasks = userTasks.filter((t: Task) => 
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
      console.error('Error fetching user tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
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
                  {viewMode === 'kanban' ? (
                    <LayoutGrid className="h-8 w-8 text-blue-500" />
                  ) : (
                    <CalendarDays className="h-8 w-8 text-blue-500" />
                  )}
                  Minhas Tarefas
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {viewMode === 'kanban' 
                    ? 'Organize suas tarefas pessoais no quadro kanban'
                    : 'Suas tarefas organizadas por prioridade de entrega'
                  }
                </p>
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className="px-3 py-1.5 text-xs"
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    Kanban
                  </Button>
                  <Button
                    variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('timeline')}
                    className="px-3 py-1.5 text-xs"
                  >
                    <List className="h-4 w-4 mr-1" />
                    Timeline
                  </Button>
                </div>
                <Button 
                  onClick={() => window.location.href = '/projects'}
                  variant="outline"
                >
                  <FolderKanban className="h-4 w-4 mr-2" />
                  Ver Projetos
                </Button>
                <Button 
                  onClick={() => setIsNewTaskModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Nova Tarefa
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Minhas Tarefas</p>
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

            {/* Content based on view mode */}
            {viewMode === 'kanban' ? (
              <PersonalTaskBoard />
            ) : (
              <TimelineView onTaskCreated={fetchUserTasks} />
            )}
          </div>
        </main>
      </div>
      
      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onTaskCreated={fetchUserTasks}
      />
    </div>
  )
}

export default function MyTasksPage() {
  return <MyTasksContent />
}