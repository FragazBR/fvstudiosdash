'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useRouter } from 'next/navigation'

export default function DebugPage() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = supabaseBrowser()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setError(`Erro de sessão: ${sessionError.message}`)
        setLoading(false)
        return
      }

      setSession(session)

      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          setError(`Erro de perfil: ${profileError.message}`)
        } else {
          setProfile(profile)
        }
      }
    } catch (err) {
      setError(`Erro geral: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const testRedirect = () => {
    if (profile?.role) {
      let redirectPath = '';
      if (profile.role === 'admin') {
        redirectPath = '/admin';
      } else if (profile.role === 'agency') {
        redirectPath = '/dashboard';
      } else if (profile.role === 'user') {
        redirectPath = '/user/dashboard';
      } else if (profile.role === 'client') {
        redirectPath = `/client/${profile.id}`;
      } else if (profile.role === 'personal') {
        redirectPath = '/personal/dashboard';
      }
      
      router.push(redirectPath)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Debug Dashboard</h1>
          <p className="text-lg text-gray-600">Informações de autenticação e debugging</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações de Sessão */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Informações de Sessão</h2>
            {session ? (
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>ID:</strong> {session.user.id}</p>
                <p><strong>Criado em:</strong> {new Date(session.user.created_at).toLocaleString()}</p>      
                <button
                  onClick={logout}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma sessão ativa</p>
            )}
          </div>

          {/* Informações de Perfil */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Perfil do Usuário</h2>
            {profile ? (
              <div className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {profile.name}</p>
                <p><strong>Role:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{profile.role}</span></p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>ID:</strong> {profile.id}</p>
                <button
                  onClick={testRedirect}
                  className="mt-2 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Ir para Dashboard ({profile.role})
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Nenhum perfil encontrado</p>
            )}
          </div>
        </div>

        {/* Links de Navegação */}
        <div className="bg-white p-6 rounded-lg border shadow-sm mt-6">
          <h2 className="text-xl font-bold mb-4">Navegação Direta</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <a href="/admin" className="p-2 bg-red-100 text-red-800 rounded hover:bg-red-200">/admin</a>     
            <a href="/dashboard" className="p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">/dashboard</a>
            <a href="/user/dashboard" className="p-2 bg-green-100 text-green-800 rounded hover:bg-green-200">/user/dashboard</a>
            <a href="/client/test" className="p-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">/client/[id]</a>
            <a href="/personal/dashboard" className="p-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200">/personal/dashboard</a>
            <a href="/login" className="p-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">/login</a>  
          </div>
        </div>
      </div>
    </div>
  )
}
