'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

export function CreateClientForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = supabaseBrowser()

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Primeiro, obter o usuário atual para verificar permissões
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

    if (userError || !currentUser) {
      setMessage('Erro: Usuário não autenticado')
      setLoading(false)
      return
    }

    // Criar usuário
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'client'
      }
    })

    if (createError) {
      setMessage(`Erro ao criar usuário: ${createError.message}`)
      setLoading(false)
      return
    }

    // Inserir perfil manualmente
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: created.user?.id,
        name,
        role: 'client',
        agency_id: currentUser.id
      })

    if (profileError) {
      setMessage(`Erro ao criar perfil: ${profileError.message}`)
      setLoading(false)
      return
    }

    setMessage('Cliente criado com sucesso!')
    setEmail('')
    setPassword('')
    setName('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleCreateClient} className="space-y-4 bg-white p-4 rounded shadow max-w-md">
      <h2 className="text-lg font-bold">Novo Cliente</h2>
      <input
        type="text"
        placeholder="Nome (opcional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-2 rounded"
      />
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
      {message && <p className="text-sm text-blue-600">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        {loading ? 'Criando...' : 'Criar cliente'}
      </button>
    </form>
  )
}
