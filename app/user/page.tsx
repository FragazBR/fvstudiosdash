'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
        return
      }
      
      // Admin tem acesso a tudo, outros roles redirecionam para seu dashboard específico
      if (user.role === 'admin' || user.role === 'user') {
        router.replace('/user/dashboard')
      } else {
        // Outros roles não têm acesso direto ao user dashboard
        router.replace('/unauthorized')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  return null
}
