'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export default function ClearCookiesPage() {
  const router = useRouter()
  const supabase = supabaseBrowser()

  useEffect(() => {
    const clearAndRedirect = async () => {
      try {
        // Fazer logout no Supabase
        await supabase.auth.signOut()
        
        // Limpar localStorage
        localStorage.clear()
        
        // Limpar sessionStorage
        sessionStorage.clear()
        
        // Redirecionar para login
        router.replace('/login')
      } catch (error) {
        console.error('Erro ao limpar cookies:', error)
        router.replace('/login')
      }
    }

    clearAndRedirect()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Limpando sessão...</h1>
        <p className="text-gray-600">Redirecionando para login...</p>
      </div>
    </div>
  )
}