// ==========================================
// FUNÇÕES PARA GERENCIAMENTO DE CLIENTES
// ==========================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { 
  Client, 
  Project, 
  Task, 
  ClientStats, 
  ProjectStats, 
  TaskFilters,
  ProjectFilters,
  ClientFilters,
  CalendarEvent,
  CreateClientForm,
  CreateProjectForm,
  CreateTaskForm
} from './supabase-types'

const supabase = createClientComponentClient()

// ==========================================
// FUNÇÕES DE CLIENTES
// ==========================================

export async function getClients(filters?: ClientFilters): Promise<Client[]> {
  let query = supabase
    .from('clients')
    .select(`
      *,
      projects:projects(count)
    `)
    .order('created_at', { ascending: false })

  // Aplicar filtros
  if (filters?.status?.length) {
    query = query.in('status', filters.status)
  }
  if (filters?.subscription_tier?.length) {
    query = query.in('subscription_tier', filters.subscription_tier)
  }
  if (filters?.industry?.length) {
    query = query.in('industry', filters.industry)
  }
  if (filters?.company_size?.length) {
    query = query.in('company_size', filters.company_size)
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar clientes:', error)
    throw error
  }

  return data || []
}

export async function getClientById(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      projects:projects(*),
      client_settings:client_settings(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar cliente:', error)
    return null
  }

  return data
}

export async function createClient(client: CreateClientForm): Promise<Client | null> {
  // Buscar o ID da agência/usuário atual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!userProfile) throw new Error('Perfil de usuário não encontrado')

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...client,
      agency_id: userProfile.id,
      account_manager_id: userProfile.id
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar cliente:', error)
    throw error
  }

  // Criar configurações padrão para o cliente
  await supabase.from('client_settings').insert({
    client_id: data.id,
    can_create_tasks: client.subscription_tier === 'enterprise'
  })

  return data
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar cliente:', error)
    throw error
  }

  return data
}

export async function getClientStats(): Promise<ClientStats[]> {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      company_name,
      avatar_url,
      status,
      subscription_tier,
      created_at,
      projects:projects(
        id,
        status,
        budget,
        spent_amount,
        updated_at,
        tasks:tasks(
          id,
          status,
          due_date,
          completed_at
        )
      )
    `)
    .eq('status', 'active')

  if (error) {
    console.error('Erro ao buscar estatísticas de clientes:', error)
    throw error
  }

  // Processar dados para estatísticas
  return (data || []).map(client => {
    const projects = client.projects || []
    const allTasks = projects.flatMap(p => p.tasks || [])
    
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const spentAmount = projects.reduce((sum, p) => sum + (p.spent_amount || 0), 0)
    
    const completedTasks = allTasks.filter(t => t.status === 'done').length
    const overdueTasks = allTasks.filter(t => 
      t.status !== 'done' && 
      t.due_date && 
      new Date(t.due_date) < new Date()
    ).length

    const progressPercentage = allTasks.length > 0 
      ? Math.round((completedTasks / allTasks.length) * 100) 
      : 0

    const lastActivity = projects.reduce((latest, project) => {
      const projectDate = new Date(project.updated_at)
      return projectDate > latest ? projectDate : latest
    }, new Date(client.created_at))

    return {
      id: client.id,
      name: client.name,
      company_name: client.company_name,
      avatar_url: client.avatar_url,
      status: client.status,
      subscription_tier: client.subscription_tier,
      projects_count: projects.length,
      active_projects: projects.filter(p => p.status === 'active').length,
      total_tasks: allTasks.length,
      completed_tasks: completedTasks,
      overdue_tasks: overdueTasks,
      total_budget: totalBudget,
      spent_amount: spentAmount,
      last_activity: lastActivity.toISOString(),
      progress_percentage: progressPercentage
    }
  })
}

// ==========================================
// FUNÇÕES DE PROJETOS
// ==========================================

export async function getProjects(filters?: ProjectFilters): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select(`
      *,
      client:clients(*),
      project_manager:user_profiles(*),
      tasks:tasks(count)
    `)
    .order('created_at', { ascending: false })

  // Aplicar filtros
  if (filters?.status?.length) {
    query = query.in('status', filters.status)
  }
  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority)
  }
  if (filters?.client_id?.length) {
    query = query.in('client_id', filters.client_id)
  }
  if (filters?.project_manager_id?.length) {
    query = query.in('project_manager_id', filters.project_manager_id)
  }
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar projetos:', error)
    throw error
  }

  return data || []
}

export async function getProjectsByClient(clientId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      tasks:tasks(
        id,
        status,
        priority,
        due_date,
        progress_percentage
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar projetos do cliente:', error)
    throw error
  }

  return data || []
}

export async function createProject(project: CreateProjectForm): Promise<Project | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!userProfile) throw new Error('Perfil de usuário não encontrado')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...project,
      agency_id: userProfile.id
    })
    .select(`
      *,
      client:clients(*)
    `)
    .single()

  if (error) {
    console.error('Erro ao criar projeto:', error)
    throw error
  }

  return data
}

// ==========================================
// FUNÇÕES DE TAREFAS
// ==========================================

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select(`
      *,
      project:projects(*),
      client:clients(*),
      assignee:user_profiles(*),
      created_by:user_profiles(*),
      subtasks:subtasks(*),
      comments:task_comments(count)
    `)
    .order('created_at', { ascending: false })

  // Aplicar filtros
  if (filters?.status?.length) {
    query = query.in('status', filters.status)
  }
  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority)
  }
  if (filters?.assignee_id?.length) {
    query = query.in('assignee_id', filters.assignee_id)
  }
  if (filters?.client_id?.length) {
    query = query.in('client_id', filters.client_id)
  }
  if (filters?.project_id?.length) {
    query = query.in('project_id', filters.project_id)
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar tarefas:', error)
    throw error
  }

  return data || []
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:user_profiles(*),
      subtasks:subtasks(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar tarefas do projeto:', error)
    throw error
  }

  return data || []
}

export async function createTask(task: CreateTaskForm): Promise<Task | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar o client_id do projeto
  const { data: project } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', task.project_id)
    .single()

  if (!project) throw new Error('Projeto não encontrado')

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      client_id: project.client_id,
      created_by_id: user.id
    })
    .select(`
      *,
      project:projects(*),
      client:clients(*),
      assignee:user_profiles(*)
    `)
    .single()

  if (error) {
    console.error('Erro ao criar tarefa:', error)
    throw error
  }

  return data
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      project:projects(*),
      client:clients(*),
      assignee:user_profiles(*),
      subtasks:subtasks(*)
    `)
    .single()

  if (error) {
    console.error('Erro ao atualizar tarefa:', error)
    throw error
  }

  return data
}

export async function moveTask(taskId: string, newStatus: Task['status']): Promise<Task | null> {
  return updateTask(taskId, { 
    status: newStatus,
    completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
  })
}

// ==========================================
// FUNÇÕES DE INTEGRAÇÃO COM CALENDÁRIO
// ==========================================

export async function getCalendarEvents(start: string, end: string): Promise<any[]> {
  // Funcionalidade de calendário temporariamente simplificada
  return []
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function getTaskColor(status: string, priority: string): string {
  if (status === 'done') return '#10b981' // green
  if (status === 'in_progress') return '#3b82f6' // blue
  if (priority === 'urgent') return '#ef4444' // red
  if (priority === 'high') return '#f59e0b' // amber
  return '#6b7280' // gray
}

function getProjectColor(status: string, priority: string): string {
  if (status === 'completed') return '#10b981' // green
  if (priority === 'urgent') return '#ef4444' // red
  if (priority === 'high') return '#f59e0b' // amber
  return '#8b5cf6' // purple
}

export async function getUserProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(name, company_name)
    `)
    .or(`agency_id.eq.${user.id},project_manager_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar projetos do usuário:', error)
    return []
  }

  return data || []
}

export async function getUserTasks(): Promise<Task[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects(name),
      client:clients(name, company_name),
      subtasks:subtasks(id, completed)
    `)
    .or(`assignee_id.eq.${user.id},created_by_id.eq.${user.id}`)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Erro ao buscar tarefas do usuário:', error)
    return []
  }

  return data || []
}