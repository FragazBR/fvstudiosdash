'use client'

// ==================================================
// WORKSTATION FIX - Componente de teste
// Para identificar problemas específicos
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  FolderKanban,
  Loader2
} from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  health_score?: number
  client?: { name: string }
}

interface Task {
  id: string
  title: string
  status: string
  project?: { name: string }
  created_at: string
}

export default function WorkstationFix() {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingTasks: 0
  })

  // Testar conexão e carregamento de dados
  useEffect(() => {
    if (user) {
      testDataLoading()
    }
  }, [user])

  const testDataLoading = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = supabaseBrowser()

      console.log('👤 Usuário:', user)
      console.log('🏢 Agency ID:', user?.agency_id)

      if (!user?.agency_id) {
        throw new Error('Usuário sem agency_id')
      }

      // Teste 1: Carregar projetos básicos
      console.log('🔄 Testando carregamento de projetos...')
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, health_score')
        .eq('agency_id', user.agency_id)
        .limit(10)

      if (projectsError) {
        console.error('❌ Erro em projetos:', projectsError)
        throw new Error(`Erro em projetos: ${projectsError.message}`)
      }

      console.log('✅ Projetos carregados:', projectsData?.length || 0)
      setProjects(projectsData || [])

      // Teste 2: Carregar tarefas básicas
      console.log('🔄 Testando carregamento de tarefas...')
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id, 
          title, 
          status, 
          created_at,
          project:projects(name)
        `)
        .eq('agency_id', user.agency_id)
        .limit(10)

      if (tasksError) {
        console.error('❌ Erro em tarefas:', tasksError)
        throw new Error(`Erro em tarefas: ${tasksError.message}`)
      }

      console.log('✅ Tarefas carregadas:', tasksData?.length || 0)
      setTasks(tasksData || [])

      // Calcular estatísticas
      const activeProjects = projectsData?.filter(p => p.status === 'active').length || 0
      const completedTasks = tasksData?.filter(t => t.status === 'completed').length || 0
      const pendingTasks = tasksData?.filter(t => t.status !== 'completed').length || 0

      setStats({
        totalProjects: projectsData?.length || 0,
        activeProjects,
        completedTasks,
        pendingTasks
      })

      console.log('📊 Estatísticas calculadas:', {
        totalProjects: projectsData?.length || 0,
        activeProjects,
        completedTasks,
        pendingTasks
      })

    } catch (error: any) {
      console.error('💥 Erro no carregamento:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Componente de teste para Kanban
  const TestKanban = () => {
    const columns = [
      { id: 'pending', title: 'Pendente', status: 'pending', color: '#6B7280' },
      { id: 'active', title: 'Ativo', status: 'active', color: '#3B82F6' },
      { id: 'completed', title: 'Concluído', status: 'completed', color: '#10B981' }
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => {
          const columnProjects = projects.filter(p => p.status === column.status)
          
          return (
            <Card key={column.id} className="h-96">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: column.color }}
                  />
                  {column.title}
                  <Badge variant="secondary" className="ml-auto">
                    {columnProjects.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {columnProjects.map(project => (
                  <Card key={project.id} className="p-3 hover:bg-muted/50 cursor-pointer">
                    <div className="space-y-2">
                      <div className="font-medium text-sm truncate">
                        {project.name}
                      </div>
                      {project.health_score && (
                        <div className="flex items-center gap-2">
                          <Progress value={project.health_score} className="h-1 flex-1" />
                          <span className="text-xs text-muted-foreground">
                            {project.health_score}%
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                {columnProjects.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Nenhum projeto
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Componente de teste para Timeline
  const TestTimeline = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Timeline de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.slice(0, 5).map(task => (
          <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg border">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <div className="flex-1">
              <div className="font-medium text-sm">{task.title}</div>
              <div className="text-xs text-muted-foreground">
                {task.project?.name || 'Sem projeto'} • {task.status}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(task.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit'
              })}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma atividade encontrada
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Componente de teste para Analytics
  const TestAnalytics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-blue-500" />
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
          </div>
          <div className="text-sm text-muted-foreground">Total Projetos</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
          </div>
          <div className="text-sm text-muted-foreground">Projetos Ativos</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
          </div>
          <div className="text-sm text-muted-foreground">Tarefas Concluídas</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
          </div>
          <div className="text-sm text-muted-foreground">Tarefas Pendentes</div>
        </CardContent>
      </Card>
    </div>
  )

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando usuário...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Testando carregamento de dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Erro no Carregamento</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={testDataLoading} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header de Debug */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">✅ Workstation - Teste Funcional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Usuário:</span> {user.name}
            </div>
            <div>
              <span className="font-medium">Agency:</span> {user.agency_id}
            </div>
            <div>
              <span className="font-medium">Projetos:</span> {projects.length}
            </div>
            <div>
              <span className="font-medium">Tarefas:</span> {tasks.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Teste */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <TestAnalytics />
          <TestTimeline />
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          <TestKanban />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <TestTimeline />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TestAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}