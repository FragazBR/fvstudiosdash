'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = supabaseBrowser()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError || !data.user) {
        setError('Email ou senha inválidos')
        return
      }

      // Busca o perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, id')
        .eq('id', data.user.id)
        .single()

      console.log('Login success:', { profile, user: data.user })

      if (profileError || !profile) {
        console.log('Perfil não encontrado, criando novo perfil...')
        // Se não tem perfil, cria um básico
        const { data: newProfile } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.email?.split('@')[0] || 'Usuário',
            role: 'free',
            email_verified: true,
          })
          .select('role, id')
          .single();

        if (newProfile) {
          console.log('Novo perfil criado:', newProfile)
          // Redireciona para dashboard gratuito
          setTimeout(() => {
            window.location.replace('/free');
          }, 100);
        } else {
          setError('Erro ao criar perfil do usuário');
        }
        return;
      }

      if (!profile.role) {
        console.log('Perfil sem role:', profile)
        setError('Perfil do usuário sem role definido');
        return;
      }

      const role = profile.role
      const id = profile.id

      console.log('Dados do perfil:', { role, id })

      // Redireciona baseado no role
      let redirectPath = '';
      if (role === 'admin') {
        redirectPath = '/admin';
      } else if (role === 'agency_owner') {
        redirectPath = '/agency';
      } else if (role === 'agency_manager') {
        redirectPath = '/agency';
      } else if (role === 'agency_employee') {
        redirectPath = '/agency';
      } else if (role === 'independent_producer') {
        redirectPath = '/independent';
      } else if (role === 'influencer') {
        redirectPath = '/influencer';
      } else if (role === 'freelancer') {
        redirectPath = '/free';
      } else if (role === 'free') {
        redirectPath = '/free';
      } else if (role === 'client') {
        redirectPath = '/client';
      } else {
        setError('Tipo de usuário inválido');
        return;
      }

      console.log('Redirecionando para:', redirectPath);
      
      // Força redirecionamento imediato
      setTimeout(() => {
        window.location.replace(redirectPath);
      }, 100);
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
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
      
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-[#1e1e1e] p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-500 w-full max-w-md space-y-6 transition-all"
      >
        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-300">Faça login na sua conta</p>
        </div>
        
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
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all"
          required
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
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ainda não tem conta?{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:underline font-medium transition-colors"
            >
              Criar conta
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}
