
'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PerformanceMetrics } from '@/components/PerformanceMetrics'
import CalendarPage from '@/components/calendar-page'

export default function PersonalDashboardPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
        return
      }
      
      // Admin tem acesso a tudo, personal role também pode acessar
      if (user.role !== 'admin' && user.role !== 'personal') {
        router.replace('/unauthorized')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  if (!user || (user.role !== 'admin' && user.role !== 'personal')) {
    return null
  }

  // Versão limitada: acesso a planejamento, execuções, kanban, calendário, métricas básicas
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Pessoal (Free)</h1>
      <PerformanceMetrics />
      <CalendarPage personalMode />
    </div>
  )
}
