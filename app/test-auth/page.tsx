'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export default function TestAuthPage() {
  const [status, setStatus] = useState('Verificando conexão...')
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      const supabase = supabaseBrowser()
      
      // Teste 1: Verificar conexão
      setStatus('Testando conexão com Supabase...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setError(`Erro de sessão: ${sessionError.message}`)
        return
      }

      setSession(session)
      setStatus('Conexão OK!')

      // Teste 2: Se tem sessão, buscar perfil
      if (session) {
        setStatus('Buscando perfil do usuário...')
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          setError(`Erro de perfil: ${profileError.message}`)
        } else {
          setProfile(profile)
          setStatus('Perfil encontrado!')
        }
      }

      // Teste 3: Verificar se tabela profiles existe
      setStatus('Testando acesso às tabelas...')
      const { data: profiles, error: tablesError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)

      if (tablesError) {
        setError(`Erro nas tabelas: ${tablesError.message}`)
      } else {
        setStatus('Tabelas acessíveis!')
      }

    } catch (err: any) {
      setError(`Erro geral: ${err.message}`)
      setStatus('Erro na conexão')
    }
  }

  const testLogin = async () => {
    try {
      const supabase = supabaseBrowser()
      setStatus('Testando login com usuário admin...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'test123456'
      })

      if (error) {
        setError(`Erro no login: ${error.message}`)
      } else {
        setStatus('Login realizado com sucesso!')
        setSession(data.session)
        
        // Buscar perfil após login
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (profileError) {
            setError(`Erro ao buscar perfil: ${profileError.message}`)
          } else {
            setProfile(profile)
          }
        }
      }
    } catch (err: any) {
      setError(`Erro no teste de login: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste de Autenticação</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status da Conexão</h2>
          <p className="text-lg">{status}</p>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 font-medium">Erro:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {session && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Sessão Ativa</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>ID:</strong> {session.user.id}</p>
              <p><strong>Criado em:</strong> {new Date(session.user.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}

        {profile && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Perfil do Usuário</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Nome:</strong> {profile.name || 'Não definido'}</p>
              <p><strong>Email:</strong> {profile.email || 'Não definido'}</p>
              <p><strong>Role:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{profile.role || 'Não definido'}</span></p>
              <p><strong>Agency ID:</strong> {profile.agency_id || 'Não definido'}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Testes</h2>
          <div className="space-y-4">
            <button
              onClick={testConnection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Testar Conexão Novamente
            </button>
            
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
            >
              Testar Login Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
