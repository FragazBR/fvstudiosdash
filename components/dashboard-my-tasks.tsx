"use client"

import { useState } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import TaskViewHeader from "./task-view-header"
import TaskColumn from "./task-column"
import type { Task, TaskStatus } from "@/types/task"

// Sample data
const initialTasks: Task[] = [
  {
    id: "task-0",
    title: "Planejar novo sistema de notificações",
    description: "Definir requisitos e arquitetura para sistema de notificações",
    status: "backlog",
    priority: "medium",
    dueDate: "2023-07-01T00:00:00.000Z",
    progress: 0,
    assignees: [
      { id: "user-1", name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
    ],
    project: "Sistema de Notificações",
    attachments: 1,
    comments: 2,
    subtasks: {
      completed: 0,
      total: 4,
      items: [
        { title: "Levantar requisitos", completed: false },
        { title: "Definir arquitetura", completed: false },
        { title: "Criar documentação", completed: false },
        { title: "Revisar com equipe", completed: false },
      ],
    },
  },
  {
    id: "task-1",
    title: "Redesenhar página inicial",
    description: "Atualizar a página inicial com nova identidade visual",
    status: "todo",
    priority: "high",
    dueDate: "2023-06-15T00:00:00.000Z",
    progress: 10,
    assignees: [
      { id: "user-1", name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
      { id: "user-2", name: "David Kim", avatar: "/avatars/david-kim.png" },
    ],
    project: "Redesign do Website",
    attachments: 2,
    comments: 5,
    subtasks: {
      completed: 1,
      total: 3,
      items: [
        { title: "Criar wireframes", completed: true },
        { title: "Desenvolver mockups", completed: false },
        { title: "Obter feedback", completed: false },
      ],
    },
  },
  {
    id: "task-2",
    title: "Corrigir bug de navegação",
    description: "O menu dropdown não está funcionando no mobile",
    status: "in-progress",
    priority: "medium",
    dueDate: "2023-06-10T00:00:00.000Z",
    progress: 50,
    assignees: [{ id: "user-3", name: "Jessica Chen", avatar: "/avatars/jessica-chen.png" }],
    project: "Correção de Bugs",
    attachments: 0,
    comments: 3,
    subtasks: {
      completed: 2,
      total: 4,
      items: [
        { title: "Identificar o problema", completed: true },
        { title: "Corrigir o bug", completed: true },
        { title: "Testar em diferentes dispositivos", completed: false },
        { title: "Fazer deploy da correção", completed: false },
      ],
    },
  },
  {
    id: "task-3",
    title: "Criar fluxo de onboarding",
    description: "Projetar e implementar a experiência de onboarding do usuário",
    status: "in-review",
    priority: "high",
    dueDate: "2023-06-20T00:00:00.000Z",
    progress: 85,
    assignees: [
      { id: "user-1", name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
      { id: "user-4", name: "Alex Morgan", avatar: "/avatars/alex-morgan.png" },
    ],
    project: "Experiência do Usuário",
    attachments: 5,
    comments: 8,
    subtasks: {
      completed: 3,
      total: 5,
      items: [
        { title: "Pesquisar melhores práticas", completed: true },
        { title: "Criar wireframes", completed: true },
        { title: "Desenvolver mockups", completed: true },
        { title: "Implementar frontend", completed: false },
        { title: "Testar com usuários", completed: false },
      ],
    },
  },
  {
    id: "task-4",
    title: "Atualizar documentação da API",
    description: "Atualizar a documentação da API com novos endpoints",
    status: "done",
    priority: "low",
    dueDate: "2023-06-05T00:00:00.000Z",
    progress: 100,
    assignees: [{ id: "user-5", name: "Ryan Park", avatar: "/avatars/ryan-park.png" }],
    project: "Documentação",
    attachments: 1,
    comments: 2,
    subtasks: {
      completed: 2,
      total: 2,
      items: [
        { title: "Documentar novos endpoints", completed: true },
        { title: "Atualizar exemplos", completed: true },
      ],
    },
  },
]

export default function DashboardMyTasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeView, setActiveView] = useState<string>("board")

  // Função para calcular progresso baseado no status
  const getProgressByStatus = (status: TaskStatus): number => {
    const statusProgress: Record<TaskStatus, number> = {
      "backlog": 0,
      "todo": 10,
      "in-progress": 50,
      "in-review": 85,
      "done": 100
    }
    return statusProgress[status] || 0
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  const handleTaskMove = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prevTasks) => prevTasks.map((task) => {
      if (task.id === taskId) {
        // Atualizar progresso automaticamente baseado no novo status
        const newProgress = getProgressByStatus(newStatus)
        
        // Atualizar subtarefas se necessário
        let updatedSubtasks = task.subtasks
        if (newStatus === "done" && task.subtasks) {
          // Se movido para "done", marcar todas as subtarefas como completadas
          updatedSubtasks = {
            ...task.subtasks,
            completed: task.subtasks.total,
            items: task.subtasks.items?.map(item => ({ ...item, completed: true })) || []
          }
        } else if (newStatus === "backlog" || newStatus === "todo") {
          // Se movido para backlog/todo, resetar subtarefas se aplicável
          updatedSubtasks = {
            ...task.subtasks,
            completed: 0,
            items: task.subtasks.items?.map(item => ({ ...item, completed: false })) || []
          }
        }

        return { 
          ...task, 
          status: newStatus,
          progress: newProgress,
          subtasks: updatedSubtasks
        }
      }
      return task
    }))
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask])
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
  }

  const handleViewChange = (view: string) => {
    setActiveView(view)
  }

  return (
    <div className="flex flex-col h-full">
      <TaskViewHeader activeView={activeView} onViewChange={handleViewChange} />
      <div className="flex-1 p-3 lg:p-6">
        <DndProvider backend={HTML5Backend}>
          <div className="grid grid-cols-1 md:grid-cols-2  xl:grid-cols-3 2xl:grid-cols-5 gap-6 h-full">
            <TaskColumn
              title="Backlog"
              status="backlog"
              tasks={getTasksByStatus("backlog")}
              onTaskMove={handleTaskMove}
              onTaskCreated={handleTaskCreated}
              onTaskUpdated={handleTaskUpdated}
            />
            <TaskColumn
              title="A Fazer"
              status="todo"
              tasks={getTasksByStatus("todo")}
              onTaskMove={handleTaskMove}
              onTaskCreated={handleTaskCreated}
              onTaskUpdated={handleTaskUpdated}
            />
            <TaskColumn
              title="Em Progresso"
              status="in-progress"
              tasks={getTasksByStatus("in-progress")}
              onTaskMove={handleTaskMove}
              onTaskCreated={handleTaskCreated}
              onTaskUpdated={handleTaskUpdated}
            />
            <TaskColumn
              title="Em Revisão"
              status="in-review"
              tasks={getTasksByStatus("in-review")}
              onTaskMove={handleTaskMove}
              onTaskCreated={handleTaskCreated}
              onTaskUpdated={handleTaskUpdated}
            />
            <TaskColumn
              title="Concluído"
              status="done"
              tasks={getTasksByStatus("done")}
              onTaskMove={handleTaskMove}
              onTaskCreated={handleTaskCreated}
              onTaskUpdated={handleTaskUpdated}
            />
          </div>
        </DndProvider>
      </div>
    </div>
  )
}
