'use client'

// ==================================================
// FVStudios Dashboard - Estação de Trabalho Moderna
// Interface Kanban inspirada em Linear, ClickUp, Notion
// ==================================================

import React, { useState, useEffect, useMemo } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  Edit3,
  Trash2,
  Copy,
  ArrowRight,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Filter,
  Search,
  LayoutGrid,
  List,
  Kanban,
  Calendar as CalendarView,
  Settings,
  Bell,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ProjectStage, ProjectAutomationEngine } from '@/lib/project-automation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface ProjectCard {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  due_date?: string
  progress: number
  tags: string[]
  comments_count: number
  attachments_count: number
  estimated_hours?: number
  actual_hours?: number
  client_name?: string
  budget?: number
  stage_color: string
  template_name?: string
}

interface Column {
  id: string
  title: string
  status: string
  color: string
  count: number
  limit?: number
  cards: ProjectCard[]
}

interface WorkstationFilters {
  search: string
  assignee: string
  priority: string
  due_date: string
  client: string
  template: string
}

interface WorkstationView {
  type: 'kanban' | 'list' | 'calendar' | 'timeline'
  groupBy: 'status' | 'assignee' | 'priority' | 'client'
  sortBy: 'due_date' | 'priority' | 'created_at' | 'progress'
  sortOrder: 'asc' | 'desc'
}

// ==================================================
// COMPONENTS
// ==================================================

// Componente do Card Draggável
function DraggableCard({ card }: { card: ProjectCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityConfig = {
    urgent: { color: 'bg-red-500', label: 'Urgente', icon: '🔥' },
    high: { color: 'bg-orange-500', label: 'Alta', icon: '⚡' },
    medium: { color: 'bg-yellow-500', label: 'Média', icon: '📋' },
    low: { color: 'bg-green-500', label: 'Baixa', icon: '📌' }
  }

  const statusConfig = {
    pending: { color: 'bg-gray-500', label: 'Pendente' },
    in_progress: { color: 'bg-blue-500', label: 'Em Progresso' },
    completed: { color: 'bg-green-500', label: 'Concluído' },
    blocked: { color: 'bg-red-500', label: 'Bloqueado' },
    cancelled: { color: 'bg-gray-400', label: 'Cancelado' }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group cursor-grab active:cursor-grabbing transition-all duration-200
        hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1
        border-l-4 border-l-transparent hover:border-l-blue-500
        ${isDragging ? 'shadow-2xl shadow-blue-500/25 scale-105' : ''}
      `}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
              {card.title}
            </CardTitle>
            {card.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {card.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <div className={`w-2 h-2 rounded-full ${priorityConfig[card.priority].color}`} title={priorityConfig[card.priority].label} />
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Progress Bar */}
        {card.progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Progresso</span>
              <span className="font-medium">{card.progress}%</span>
            </div>
            <Progress value={card.progress} className="h-1.5" />
          </div>
        )}

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {card.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{card.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metadata Row */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {card.comments_count > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{card.comments_count}</span>
              </div>
            )}
            {card.attachments_count > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{card.attachments_count}</span>
              </div>
            )}
            {card.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{card.estimated_hours}h</span>
              </div>
            )}
          </div>

          {/* Due Date */}
          {card.due_date && (
            <div className={`flex items-center gap-1 ${
              new Date(card.due_date) < new Date() ? 'text-red-500' : ''
            }`}>
              <CalendarIcon className="h-3 w-3" />
              <span>{format(new Date(card.due_date), 'dd/MM', { locale: ptBR })}</span>
            </div>
          )}
        </div>

        {/* Assignee & Client */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {card.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={card.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {card.assignee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
            {card.client_name && (
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {card.client_name}
              </span>
            )}
          </div>

          {card.budget && (
            <span className="text-xs font-medium text-green-600">
              R$ {card.budget.toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente da Coluna
function KanbanColumn({ column, onAddCard }: { column: Column; onAddCard: (columnId: string) => void }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', column }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 min-w-80 max-w-80
        border border-gray-200 dark:border-gray-700
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {column.title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {column.count}
            {column.limit && `/${column.limit}`}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddCard(column.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 space-y-3 min-h-[200px]">
        <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <DraggableCard key={card.id} card={card} />
          ))}
        </SortableContext>
        
        {column.cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-600">
            <Kanban className="h-8 w-8 mb-2" />
            <p className="text-sm">Nenhum projeto aqui</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddCard(column.id)}
              className="mt-2 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar projeto
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function ModernProjectWorkstation({ userId }: { userId: string }) {
  const [columns, setColumns] = useState<Column[]>([])
  const [activeCard, setActiveCard] = useState<ProjectCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<WorkstationFilters>({
    search: '',
    assignee: '',
    priority: '',
    due_date: '',
    client: '',
    template: ''
  })
  const [view, setView] = useState<WorkstationView>({
    type: 'kanban',
    groupBy: 'status',
    sortBy: 'due_date',
    sortOrder: 'asc'
  })
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Carregar dados dos projetos
  useEffect(() => {
    loadProjectData()
  }, [userId, filters, view])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      const supabase = supabaseBrowser()
      
      let query = supabase
        .from('projects')
        .select(`
          *,
          client:contacts(id, name)
        `)
        .eq('status', 'active')

      // Aplicar filtros
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters.client) {
        query = query.eq('client_id', filters.client)
      }

      const { data: projects, error } = await query

      if (error) throw error

      // Transformar dados para o formato do Kanban
      const transformedData = transformProjectsToKanban(projects || [])
      setColumns(transformedData)
    } catch (error) {
      console.error('Erro ao carregar projetos:', error)
      toast.error('Erro ao carregar dados dos projetos')
    } finally {
      setLoading(false)
    }
  }

  const transformProjectsToKanban = (projects: any[]): Column[] => {
    const statusColumns = [
      { id: 'pending', title: 'Pendente', status: 'pending', color: '#6B7280' },
      { id: 'in_progress', title: 'Em Progresso', status: 'in_progress', color: '#3B82F6' },
      { id: 'completed', title: 'Concluído', status: 'completed', color: '#10B981' },
      { id: 'blocked', title: 'Bloqueado', status: 'blocked', color: '#EF4444' },
    ]

    return statusColumns.map(columnDef => {
      const columnProjects = projects.filter(project => {
        const mainStage = project.project_stages?.[0]
        return mainStage?.status === columnDef.status
      })

      const cards: ProjectCard[] = columnProjects.map(project => {
        const mainStage = project.project_stages?.[0] || {}
        return {
          id: project.id,
          title: project.name,
          description: project.description,
          status: mainStage.status || 'pending',
          priority: project.priority || 'medium',
          assignee: mainStage.assignee ? {
            id: mainStage.assignee.id,
            name: mainStage.assignee.name,
            avatar: mainStage.assignee.avatar_url
          } : undefined,
          due_date: mainStage.estimated_end_date,
          progress: mainStage.progress_percentage || 0,
          tags: project.tags || [],
          comments_count: 0, // TODO: Implementar contagem real
          attachments_count: 0, // TODO: Implementar contagem real
          estimated_hours: project.estimated_hours,
          client_name: project.client?.name,
          budget: project.budget_total,
          stage_color: mainStage.color || columnDef.color,
          template_name: project.template?.name
        }
      })

      return {
        ...columnDef,
        count: cards.length,
        cards
      }
    })
  }

  // Handlers para Drag & Drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = findCardById(active.id as string)
    setActiveCard(card)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeCard = findCardById(active.id as string)
    const overColumn = findColumnById(over.id as string) || findColumnByCardId(over.id as string)

    if (!activeCard || !overColumn) return

    // Mover card para nova coluna se necessário
    if (activeCard.status !== overColumn.status) {
      moveCardToColumn(activeCard.id, overColumn.id)
    }
  }

  const findCardById = (id: string): ProjectCard | null => {
    for (const column of columns) {
      const card = column.cards.find(c => c.id === id)
      if (card) return card
    }
    return null
  }

  const findColumnById = (id: string): Column | null => {
    return columns.find(c => c.id === id) || null
  }

  const findColumnByCardId = (cardId: string): Column | null => {
    return columns.find(c => c.cards.some(card => card.id === cardId)) || null
  }

  const moveCardToColumn = async (cardId: string, targetColumnId: string) => {
    try {
      const supabase = supabaseBrowser()
      const targetColumn = findColumnById(targetColumnId)
      
      if (!targetColumn) return

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('project_stages')
        .update({ status: targetColumn.status })
        .eq('project_id', cardId)

      if (error) throw error

      // Atualizar estado local
      setColumns(prevColumns => {
        const newColumns = [...prevColumns]
        
        // Remover card da coluna atual
        newColumns.forEach(column => {
          column.cards = column.cards.filter(card => card.id !== cardId)
          column.count = column.cards.length
        })

        // Adicionar card na nova coluna
        const targetColumnIndex = newColumns.findIndex(c => c.id === targetColumnId)
        if (targetColumnIndex !== -1) {
          const card = findCardById(cardId)
          if (card) {
            card.status = targetColumn.status as any
            newColumns[targetColumnIndex].cards.push(card)
            newColumns[targetColumnIndex].count = newColumns[targetColumnIndex].cards.length
          }
        }

        return newColumns
      })

      toast.success('Projeto movido com sucesso!')
    } catch (error) {
      console.error('Erro ao mover projeto:', error)
      toast.error('Erro ao mover projeto')
    }
  }

  const handleAddCard = (columnId: string) => {
    setSelectedColumn(columnId)
    setIsAddingCard(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando projetos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Estação de Trabalho
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todos os seus projetos em um só lugar
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Filters & Views */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar projetos..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={view.type} onValueChange={(value) => setView(prev => ({ ...prev, type: value as any }))}>
            <TabsList>
              <TabsTrigger value="kanban">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarView className="h-4 w-4 mr-2" />
                Calendário
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 p-6 h-full overflow-x-auto">
            <SortableContext items={columns.map(c => c.id)}>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onAddCard={handleAddCard}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeCard ? <DraggableCard card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Card Modal */}
      <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>
          {/* TODO: Implementar formulário de criação */}
          <p>Formulário de criação de projeto será implementado aqui</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}