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

    if (role === 'agency') {
      router.push('/')
    } else if (role === 'client') {
      router.push(`/client/${id}`)
    } else {
      setError(t('login.invalidPermission'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-bold">{t('login.title')}</h1>
        <input
          type="email"
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder={t('login.passwordPlaceholder')}
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
          {t('login.button')}
        </button>
      </form>
    </div>
  )
}
