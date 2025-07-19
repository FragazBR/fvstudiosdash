'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PersonalPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
        return
      }
      
      // Admin tem acesso a tudo, outros roles redirecionam para seu dashboard específico
      if (user.role === 'admin') {
        // Admin pode acessar, redireciona para dashboard pessoal
        router.replace('/personal/dashboard')
      } else if (user.role === 'personal') {
        router.replace('/personal/dashboard')
      } else {
        // Outros roles não têm acesso direto ao personal
        router.replace('/unauthorized')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  return null
}
