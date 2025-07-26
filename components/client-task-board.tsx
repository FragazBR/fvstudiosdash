"use client"

import { useState, useEffect } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useToast } from "@/components/ui/use-toast"
import TaskColumn from "./task-column"
import type { TaskStatus } from "@/types/task"

interface ClientTask {
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
    avatar_url?: string;
  };
  creator?: {
    id: string;
    name: string;
  };
}

// Map API status to kanban status
const mapApiStatusToKanban = (apiStatus: string): TaskStatus => {
  switch (apiStatus) {
    case 'todo': return 'todo'
    case 'in_progress': return 'in-progress'
    case 'review': return 'in-review'
    case 'completed': return 'done'
    case 'cancelled': return 'done' // Treat cancelled as done for kanban
    default: return 'todo'
  }
}

// Map kanban status back to API status
const mapKanbanStatusToApi = (kanbanStatus: TaskStatus): string => {
  switch (kanbanStatus) {
    case 'todo': return 'todo'
    case 'in-progress': return 'in_progress'
    case 'in-review': return 'review'
    case 'done': return 'completed'
    default: return 'todo'
  }
}

// Convert ClientTask to Task for kanban board
const convertToKanbanTask = (clientTask: ClientTask) => ({
  id: clientTask.id,
  title: clientTask.title,
  project: clientTask.project?.name || 'Sem projeto',
  priority: clientTask.priority === 'urgent' ? 'high' : clientTask.priority as 'low' | 'medium' | 'high',
  status: mapApiStatusToKanban(clientTask.status),
  dueDate: clientTask.due_date || new Date().toISOString(),
  attachments: 0, // Not available from API
  comments: 0, // Not available from API
  progress: clientTask.progress,
  subtasks: { completed: 0, total: 0 }, // Not available from API
  assignees: clientTask.assigned_to ? [{
    id: clientTask.assigned_to.id,
    name: clientTask.assigned_to.name,
    avatar: clientTask.assigned_to.avatar_url || '/placeholder-avatar.png'
  }] : [],
  description: clientTask.description
})

interface ClientTaskBoardProps {
  clientId: string;
  onTaskCreated: () => void;
}

export default function ClientTaskBoard({ clientId, onTaskCreated }: ClientTaskBoardProps) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<ClientTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientTasks()
  }, [clientId])

  const fetchClientTasks = async () => {
    try {
      setLoading(true)
      
      // Fetch projects for this client
      const projectsResponse = await fetch(`/api/projects?client_id=${clientId}`)
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        const clientProjects = projectsData.projects || []
        
        // Fetch tasks for all client projects
        const allTasks: ClientTask[] = []
        if (clientProjects.length > 0) {
          const taskPromises = clientProjects.map(async (project: any) => {
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
      }
    } catch (error) {
      console.error('Error fetching client tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  // Handle moving a task to a different status
  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newApiStatus = mapKanbanStatusToApi(newStatus)
    
    try {
      // Update task status via API
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newApiStatus,
          progress: newStatus === 'done' ? 100 : task.progress // Set to 100% when completed
        }),
      })

      if (response.ok) {
        // Update local state
        setTasks((prevTasks) => {
          const updatedTasks = prevTasks.map((t) => {
            if (t.id === taskId) {
              const updatedTask = { 
                ...t, 
                status: newApiStatus as any,
                progress: newStatus === 'done' ? 100 : t.progress,
                completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
              }
              
              // Show completion toast
              if (newStatus === "done" && t.status !== 'completed') {
                toast({
                  title: "🎉 Tarefa concluída!",
                  description: `"${t.title}" foi marcada como concluída.`,
                })
              }
              
              return updatedTask
            }
            return t
          })
          return updatedTasks
        })
      } else {
        console.error('Failed to update task status:', response.status)
        toast({
          title: "Erro ao atualizar tarefa",
          description: "Não foi possível atualizar o status da tarefa.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast({
        title: "Erro ao atualizar tarefa",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      })
    }
  }

  // Handle adding a new task
  const handleTaskCreated = () => {
    onTaskCreated() // Refresh parent component
    fetchClientTasks() // Refresh local tasks
  }

  // Filter tasks by status for kanban columns
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks
      .filter((task) => mapApiStatusToKanban(task.status) === status)
      .map(convertToKanbanTask)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TaskColumn
            title="A Fazer"
            status="todo"
            tasks={getTasksByStatus("todo")}
            onTaskMove={handleTaskMove}
            onTaskCreated={handleTaskCreated}
          />
          <TaskColumn
            title="Em Progresso"
            status="in-progress"
            tasks={getTasksByStatus("in-progress")}
            onTaskMove={handleTaskMove}
            onTaskCreated={handleTaskCreated}
          />
          <TaskColumn
            title="Em Revisão"
            status="in-review"
            tasks={getTasksByStatus("in-review")}
            onTaskMove={handleTaskMove}
            onTaskCreated={handleTaskCreated}
          />
          <TaskColumn
            title="Concluído"
            status="done"
            tasks={getTasksByStatus("done")}
            onTaskMove={handleTaskMove}
            onTaskCreated={handleTaskCreated}
          />
        </div>
      </div>
    </DndProvider>
  )
}