"use client"

import { useRef, useEffect } from "react"
import { useDrag } from "react-dnd"
import {
  Calendar,
  Paperclip,
  MessageSquare,
  CheckSquare,
  MoreVertical,
  Edit,
  Trash,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task } from "@/types/task"

// Add an onClick prop to the component interface
interface TaskCardProps {
  task: Task
  onClick?: () => void
}

// Update the function signature to include the onClick prop
export default function TaskCard({ task, onClick }: TaskCardProps) {
  const dragRef = useRef<HTMLDivElement>(null)
  
  // Use task progress or calculate from subtasks as fallback
  const progress = task.progress !== undefined 
    ? task.progress 
    : task.subtasks.total > 0 
      ? Math.round((task.subtasks.completed / task.subtasks.total) * 100) 
      : 0

  // Set up drag source
  const [{ isDragging }, drag] = useDrag({
    type: "task",
    item: () => {
      console.log(`🖱️ DRAG START: Task ${task.id} - ${task.title}`)
      return { id: task.id }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      console.log(`🖱️ DRAG END: Task ${task.id}, dropped: ${monitor.didDrop()}`)
    }
  })

  useEffect(() => {
    drag(dragRef.current)
  }, [drag])

  // Priority badge color
  const priorityColor = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    medium: "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400",
    high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  }[task.priority]

  return (
    <div
      ref={dragRef}
      className={`bg-white/90 dark:bg-[#1f1f1f]/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-[#272727] hover:border-gray-300 dark:hover:border-[#64f481]/30 shadow-sm hover:shadow-md transition-all cursor-grab ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onClick={(e) => {
        e.stopPropagation()
        if (onClick) onClick()
      }}
    >
      <div className="p-4">
        {/* Project & Priority */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{task.project}</span>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${priorityColor}`}>
{task.priority === 'low' ? 'Baixa' : task.priority === 'medium' ? 'Média' : task.priority === 'high' ? 'Alta' : 'Urgente'}
          </span>
        </div>

        {/* Task Title */}
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{task.title}</h4>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Progresso</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Task Metadata */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-3 mb-3">
          {/* Due Date */}
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>{format(new Date(task.dueDate), "MMM d")}</span>
          </div>

          {/* Attachments */}
          {task.attachments > 0 && (
            <div className="flex items-center">
              <Paperclip className="h-3.5 w-3.5 mr-1" />
              <span>{task.attachments}</span>
            </div>
          )}

          {/* Comments */}
          {task.comments > 0 && (
            <div className="flex items-center">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              <span>{task.comments}</span>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks.total > 0 && (
            <div className="flex items-center">
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              <span>
                {task.subtasks.completed}/{task.subtasks.total}
              </span>
            </div>
          )}
        </div>

        {/* Assignees & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {task.assignees.map((assignee) => (
              <Avatar key={assignee.id} className="h-6 w-6 border-2 border-white dark:border-[#1f1f1f]">
                <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                <AvatarFallback>{assignee.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            ))}
          </div>

          {/* Task Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-[#64f481]">
                <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="sr-only">Ações da tarefa</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#272727]">
              <DropdownMenuItem className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#272727]">
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar Tarefa</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#272727]">
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>Marcar como Concluída</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#272727]">
                <Clock className="mr-2 h-4 w-4" />
                <span>Alterar Prazo</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#272727]">
                <AlertCircle className="mr-2 h-4 w-4" />
                <span>Alterar Prioridade</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Archive className="mr-2 h-4 w-4" />
                <span>Arquivar Tarefa</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash className="mr-2 h-4 w-4" />
                <span>Excluir Tarefa</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
