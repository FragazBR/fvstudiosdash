'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearCookiesPage() {
  const router = useRouter()

  useEffect(() => {
    const clearAndRedirect = async () => {
      try {
        // Limpar localStorage
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        
        // Redirecionar para login
        router.replace('/login')
      } catch (error) {
        console.error('Erro ao limpar cookies:', error)
        router.replace('/login')
      }
    }

    clearAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Limpando sessão...</h1>
        <p className="text-gray-600">Redirecionando para login...</p>
      </div>
    </div>
  )
}