// app/dashboard/page.tsx
'use client'

import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Dashboard from "@/components/dashboard";

export default function DashboardPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
        return
      }
      
      // Admin e agency têm acesso ao dashboard principal
      if (user.role !== 'admin' && user.role !== 'agency') {
        router.replace('/unauthorized')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  if (!user || (user.role !== 'admin' && user.role !== 'agency')) {
    return null
  }

  return <Dashboard />;
}
