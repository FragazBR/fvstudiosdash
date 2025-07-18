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

  const createAllTestUsers = async () => {
    const users = [
      { email: 'admin@test.com', role: 'admin' },
      { email: 'agency@test.com', role: 'agency' },
      { email: 'user@test.com', role: 'user' },
      { email: 'client@test.com', role: 'client' },
      { email: 'personal@test.com', role: 'personal' }
    ]

    setError('🚀 Criando todos os usuários de teste...')
    
    for (const user of users) {
      await createTestUser(user.email, 'test123456', user.role)
      // Aguardar entre criações para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    setError('✅ Processo de criação concluído! Verifique as mensagens acima.')
  }

  const createTestUser = async (email: string, password: string, role: string) => {
    try {
      setError(`Criando usuário ${email}...`)
      
      // Primeiro fazer logout se houver sessão ativa
      await supabase.auth.signOut()
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`
          }
        }
      })

      if (error) {
        setError(`❌ Erro ao criar usuário: ${error.message}`)
        return
      }

      if (data.user) {
        // Aguardar um pouco antes de criar o perfil
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Criar perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
            email: email,
            role: role,
          })

        if (profileError) {
          setError(`⚠️ Usuário criado, mas erro ao criar perfil: ${profileError.message}`)
        } else {
          setError(`✅ Usuário ${email} criado com sucesso! Senha: ${password}`)
        }
      }
    } catch (err) {
      setError(`❌ Erro: ${err}`)
    }
  }

  const testLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(`Erro de login: ${error.message}`)
        return
      }

      if (data.user) {
        setError(`Login realizado com sucesso!`)
        checkAuth()
      }
    } catch (err) {
      setError(`Erro: ${err}`)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setError('Logout realizado')
  }

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

  if (loading) return <div className="p-6">Carregando...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Debug Dashboard - FVSTUDIOS</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações de Sessão */}
        <div className="bg-white p-6 rounded-lg border">
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
        <div className="bg-white p-6 rounded-lg border">
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

      {/* Criar Usuários de Teste */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-bold mb-4">Criar Usuários de Teste</h2>
        
        {/* Botão para criar todos */}
        <div className="mb-4">
          <button
            onClick={createAllTestUsers}
            className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
          >
            🚀 Criar TODOS os Usuários de Teste
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Isso criará: admin@test.com, agency@test.com, user@test.com, client@test.com, personal@test.com
            <br />
            Todos com senha: <code className="bg-gray-100 px-1 rounded">test123456</code>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['admin', 'agency', 'user', 'client', 'personal'].map(role => (
            <button
              key={role}
              onClick={() => createTestUser(`${role}@test.com`, 'test123456', role)}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded border text-center"
            >
              Criar {role.charAt(0).toUpperCase() + role.slice(1)}
              <br />
              <span className="text-sm text-gray-600">{role}@test.com</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fazer Login com Usuários de Teste */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-bold mb-4">Login com Usuários de Teste</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['admin', 'agency', 'user', 'client', 'personal'].map(role => (
            <button
              key={role}
              onClick={() => testLogin(`${role}@test.com`, 'test123456')}
              className={`p-3 text-white rounded hover:opacity-90 ${
                role === 'admin' ? 'bg-red-500' :
                role === 'agency' ? 'bg-blue-500' :
                role === 'user' ? 'bg-green-500' :
                role === 'client' ? 'bg-yellow-500' :
                'bg-purple-500'
              }`}
            >
              Login como {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Links de Navegação */}
      <div className="bg-white p-6 rounded-lg border">
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
  )
}
