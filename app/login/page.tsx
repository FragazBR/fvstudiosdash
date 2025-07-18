'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = supabaseBrowser()
  const { resolvedTheme } = useTheme()

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
        .from('profiles')
        .select('role, id')
        .eq('id', data.user.id)
        .single()

      console.log('Login success:', { profile, user: data.user })

      if (profileError || !profile) {
        console.log('Perfil não encontrado, criando novo perfil...')
        // Se não tem perfil, cria um básico
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.email?.split('@')[0] || 'Usuário',
            role: 'personal',
          })
          .select('role, id')
          .single();

        if (newProfile) {
          console.log('Novo perfil criado:', newProfile)
          // Redireciona para dashboard pessoal
          setTimeout(() => {
            window.location.replace('/personal/dashboard');
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
        // Admin tem acesso completo - redireciona para dashboard principal
        redirectPath = '/dashboard';
      } else if (role === 'agency') {
        redirectPath = '/dashboard';
      } else if (role === 'user') {
        redirectPath = '/user/dashboard';
      } else if (role === 'client') {
        redirectPath = `/client/${id}`;
      } else if (role === 'personal') {
        redirectPath = '/personal/dashboard';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      {/* Logo fora da caixa */}
      <div className="text-center mb-8">
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
        <p className="text-gray-600 dark:text-gray-400 mt-2">Dashboard de Gerenciamento</p>
      </div>
      
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-400">Faça login na sua conta</p>
        </div>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={loading}
        />
        
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
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
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Ainda não tem conta?{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="text-blue-600 hover:underline"
            >
              Criar conta
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}
