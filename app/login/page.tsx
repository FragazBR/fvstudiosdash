'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = supabaseBrowser()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError || !data.user) {
      setError(t('login.invalidCredentials'))
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      setError(t('login.profileFetchError'))
      return
    }

    const role = profile.role
    const id = profile.id

    if (role === 'admin') {
      window.location.href = '/admin/dashboard'
    } else if (role === 'agency') {
      window.location.href = '/dashboard'
    } else if (role === 'client') {
      window.location.href = `/client/${id}`
    } else if (role === 'personal') {
      window.location.href = '/personal/dashboard'
    } else {
      setError('Permissão inválida')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-bold">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
        >
          Login
        </button>
      </form>
    </div>
  )
}
