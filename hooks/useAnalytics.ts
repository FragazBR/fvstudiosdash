import { useState, useEffect } from 'react'

interface ProjectAnalytics {
  total: number
  active: number
  completed: number
  revenue: {
    total: number
    spent: number
  }
}

interface TaskAnalytics {
  total: number
  completed: number
  in_progress: number
  overdue: number
  hours: {
    estimated: number
    actual: number
  }
}

interface ContactAnalytics {
  total: number
  leads: number
  clients: number
  active: number
}

interface AnalyticsData {
  projects: ProjectAnalytics
  tasks: TaskAnalytics
  contacts: ContactAnalytics
  period_days: number
}

interface DailyMetric {
  date: string
  projects_created: number
  tasks_completed: number
}

interface AnalyticsResponse {
  analytics: AnalyticsData
  daily_metrics: DailyMetric[]
  generated_at: string
}

export function useAnalytics(period: string = '30') {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/analytics?period=${period}`)
        
        if (!response.ok) {
          throw new Error('Falha ao buscar analytics')
        }
        
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        console.error('Erro ao buscar analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [period])

  const refetch = () => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/analytics?period=${period}`)
        
        if (!response.ok) {
          throw new Error('Falha ao buscar analytics')
        }
        
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        console.error('Erro ao buscar analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }

  return { data, loading, error, refetch }
}