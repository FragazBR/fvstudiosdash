'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = supabaseBrowser()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] px-4">
        <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 w-full max-w-md text-center">
          <div className="text-green-600 dark:text-green-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Conta criada com sucesso!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Verificque seu email para confirmar sua conta.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#121212] px-4">
      {/* Logo fora da caixa */}
      <div className="text-center mb-8">
        {mounted && (
          <>
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Image
                src={resolvedTheme === 'dark' ? "/logo-c-white.png" : "/logo-c.png"}
                alt="FVSTUDIOS Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="relative w-44 h-12 mx-auto">
              <Image
                src={resolvedTheme === 'dark' ? "/Logotipo-FVstudios-Branco.png" : "/Logotipo-FVstudios-Preto.png"}
                alt="FVSTUDIOS"
                fill
                className="object-contain"
                priority
              />
            </div>
          </>
        )}
        {!mounted && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-44 h-12 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </>
        )}
        <p className="text-gray-600 dark:text-gray-400 mt-2">Dashboard de Gerenciamento</p>
      </div>
      
      {hasSession ? (
        // Se tem sessão ativa, mostrar opção de logout
        <div className="bg-white dark:bg-[#1e1e1e] p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-500 w-full max-w-md space-y-6 transition-all">
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-300">Você já está logado</p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-lg text-sm">
            Para criar uma nova conta, você precisa fazer logout primeiro.
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-all duration-200"
          >
            Fazer Logout
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline text-sm font-medium transition-colors"
            >
              Ir para Login
            </button>
          </div>
        </div>
      ) : (
        // Formulário normal de signup
        <form
          onSubmit={handleSignup}
          className="bg-white dark:bg-[#1e1e1e] p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-500 w-full max-w-md space-y-6 transition-all"
        >
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-300">Criar uma nova conta</p>
          </div>
        
        <input
          type="text"
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all"
          required
          disabled={loading}
        />
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all"
          required
          disabled={loading}
        />
        
        <input
          type="password"
          placeholder="Senha (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all"
          required
          minLength={6}
          disabled={loading}
        />
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline font-medium transition-colors"
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
