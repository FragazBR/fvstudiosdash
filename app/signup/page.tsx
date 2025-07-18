'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { Logo } from '@/components/ui/logo'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()
  const supabase = supabaseBrowser()

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setHasSession(true)
      setError('Você já está logado. Faça logout primeiro para criar uma nova conta.')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setHasSession(false)
    setError('')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      })

      if (signupError) {
        setError(signupError.message)
        return
      }

      if (data.user) {
        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: name,
            email: email,
            role: 'personal', // default role
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Mesmo com erro no perfil, permite continuar
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
      
    } catch (error) {
      console.error('Signup error:', error)
      setError('Erro interno do servidor')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Conta criada com sucesso!</h2>
          <p className="text-gray-600 mb-4">Verificque seu email para confirmar sua conta.</p>
          <p className="text-sm text-gray-500">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      {hasSession ? (
        // Se tem sessão ativa, mostrar opção de logout
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <Logo width={150} height={50} />
            </div>
            <p className="text-gray-600">Você já está logado</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm">
            Para criar uma nova conta, você precisa fazer logout primeiro.
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition"
          >
            Fazer Logout
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline text-sm"
            >
              Ir para Login
            </button>
          </div>
        </div>
      ) : (
        // Formulário normal de signup
        <form
          onSubmit={handleSignup}
          className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
        >
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <Logo width={150} height={50} />
            </div>
            <p className="text-gray-600">Criar uma nova conta</p>
          </div>
        
        <input
          type="text"
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />
        
        <input
          type="password"
          placeholder="Senha (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={6}
          disabled={loading}
        />
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
        </form>
      )}
    </div>
  )
}
