'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Dashboard from '@/components/dashboard'

export default function UserDashboardPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
        return
      }
      
      // Admin tem acesso a tudo, user role também pode acessar
      if (user.role !== 'admin' && user.role !== 'user') {
        router.replace('/unauthorized')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  if (!user || (user.role !== 'admin' && user.role !== 'user')) {
    return null
  }

  // Dashboard para user autônomo: igual agência, mas sem compartilhamento
  return <Dashboard userMode />
}
