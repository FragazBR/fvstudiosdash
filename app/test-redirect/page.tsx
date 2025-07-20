'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'

export default function TestRedirectPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = supabaseBrowser()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profile)
      setLoading(false)
    }

    checkUser()
  }, [])

  const testRedirect = () => {
    if (!profile) return

    const { role, id } = profile
    let redirectPath = ''
    
    if (role === 'admin') {
      redirectPath = '/admin'
    } else if (role === 'agency') {
      redirectPath = '/dashboard'
    } else if (role === 'user') {
      redirectPath = '/user/dashboard'
    } else if (role === 'client') {
      redirectPath = `/client/${id}`
    } else if (role === 'personal') {
      redirectPath = '/personal/dashboard'
    }

    console.log('Redirecionando para:', redirectPath)
    router.push(redirectPath)
  }

  const changeRole = async (newRole: string) => {
    if (!user) return

    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', user.id)

    if (!error) {
      setProfile({ ...profile, role: newRole })
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Redirecionamento</h1>
      
      <div className="bg-white p-4 rounded border mb-4">
        <h2 className="font-bold mb-2">Informações do Usuário:</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>ID:</strong> {user?.id}</p>
      </div>

      <div className="bg-white p-4 rounded border mb-4">
        <h2 className="font-bold mb-2">Perfil:</h2>
        <p><strong>Role:</strong> {profile?.role}</p>
        <p><strong>Nome:</strong> {profile?.name}</p>
        <p><strong>ID do Perfil:</strong> {profile?.id}</p>
      </div>

      <div className="space-y-2 mb-4">
        <h2 className="font-bold">Testar Roles:</h2>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => changeRole('admin')}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Admin
          </button>
          <button 
            onClick={() => changeRole('agency')}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Agency
          </button>
          <button 
            onClick={() => changeRole('user')}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            User
          </button>
          <button 
            onClick={() => changeRole('client')}
            className="px-3 py-1 bg-yellow-500 text-white rounded"
          >
            Client
          </button>
          <button 
            onClick={() => changeRole('personal')}
            className="px-3 py-1 bg-purple-500 text-white rounded"
          >
            Personal
          </button>
        </div>
      </div>

      <button 
        onClick={testRedirect}
        className="w-full py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
      >
        Testar Redirecionamento
      </button>

      <div className="mt-4 text-sm text-gray-600">
        <p>Esta página permite testar o redirecionamento baseado no role do usuário.</p>
        <p>1. Mude o role clicando nos botões coloridos</p>
        <p>2. Clique em "Testar Redirecionamento" para ir para o dashboard correto</p>
      </div>
    </div>
  )
}
