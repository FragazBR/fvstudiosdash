import { useState, useEffect } from 'react'

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  budget_total?: number
  budget_spent?: number
  start_date?: string
  end_date?: string
  created_at: string
  client?: {
    id: string
    name: string
    email: string
    company?: string
  }
  creator?: {
    id: string
    name: string
  }
  tasks?: any[]
}

interface Contact {
  id: string
  name: string
  email: string
  company?: string
  type: 'lead' | 'client' | 'prospect'
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  total_project_value?: number
  active_projects?: number
}

interface DashboardData {
  recentProjects: Project[]
  recentClients: Contact[]
  loading: boolean
  error: string | null
}

export function useDashboardData(): DashboardData {
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [recentClients, setRecentClients] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar projetos recentes
        const projectsResponse = await fetch('/api/projects')
        if (!projectsResponse.ok) {
          throw new Error('Falha ao buscar projetos')
        }
        const projectsData = await projectsResponse.json()
        
        // Ordenar projetos por data de criação e pegar os mais recentes
        const sortedProjects = (projectsData.projects || [])
          .sort((a: Project, b: Project) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4) // Apenas os 4 mais recentes
        
        setRecentProjects(sortedProjects)

        // Buscar clientes recentes
        const contactsResponse = await fetch('/api/contacts')
        if (!contactsResponse.ok) {
          throw new Error('Falha ao buscar contatos')
        }
        const contactsData = await contactsResponse.json()
        
        // Ordenar contatos por data de criação e pegar os mais recentes que são clientes
        const sortedClients = (contactsData.contacts || [])
          .filter((c: Contact) => c.type === 'client')
          .sort((a: Contact, b: Contact) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3) // Apenas os 3 mais recentes
        
        setRecentClients(sortedClients)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        console.error('Erro ao buscar dados do dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return { recentProjects, recentClients, loading, error }
}