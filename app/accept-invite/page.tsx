'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface InviteData {
  id: string
  email: string
  name: string
  role: string
  company?: string
  phone?: string
  agency_id: string
  invited_by: string
  welcome_message?: string
  status: string
  expires_at: string
  inviter_name?: string
  inviter_company?: string
}

function AcceptInviteContent() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const supabase = supabaseBrowser()

  useEffect(() => {
    setMounted(true)
    loadInviteData()
  }, [])

  const loadInviteData = async () => {
    const token = searchParams.get('token')
    
    if (!token) {
      setError('Token de convite inválido')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          inviter:invited_by (
            name,
            company
          )
        `)
        .eq('id', token)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        setError('Convite não encontrado ou já foi utilizado')
        setLoading(false)
        return
      }

      // Verificar se o convite expirou
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        setError('Este convite expirou')
        setLoading(false)
        return
      }

      setInviteData({
        ...data,
        inviter_name: data.inviter?.name,
        inviter_company: data.inviter?.company
      })
    } catch (err) {
      console.error('Erro ao carregar convite:', err)
      setError('Erro ao carregar dados do convite')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (!inviteData) return

    setSubmitting(true)

    try {
      // Criar o usuário usando a função que já temos
      const { data, error } = await supabase.rpc('create_user_with_profile', {
        p_email: inviteData.email,
        p_password: password,
        p_name: inviteData.name,
        p_role: inviteData.role,
        p_agency_id: inviteData.agency_id,
        p_company: inviteData.company,
        p_phone: inviteData.phone
      })

      if (error) {
        setError('Erro ao criar conta: ' + error.message)
        return
      }

      // Marcar convite como aceito
      await supabase
        .from('user_invitations')
        .update({ status: 'accepted' })
        .eq('id', inviteData.id)

      toast.success('Conta criada com sucesso!')
      
      // Redirecionar para login
      setTimeout(() => {
        router.push('/login?message=Conta criada com sucesso! Faça login para continuar.')
      }, 1500)

    } catch (err) {
      console.error('Erro ao aceitar convite:', err)
      setError('Erro interno do servidor')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Carregando convite...</p>
        </div>
      </div>
    )
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Convite Inválido
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button onClick={() => router.push('/login')} variant="outline">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#121212] px-4">
      {/* Logo */}
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
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-xl">Aceitar Convite</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Você foi convidado para fazer parte da equipe
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {inviteData && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Nome:</span>
                <span className="text-sm font-medium">{inviteData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                <span className="text-sm font-medium">{inviteData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Cargo:</span>
                <span className="text-sm font-medium">
                  {inviteData.role === 'agency_manager' ? 'Gerente' :
                   inviteData.role === 'agency_staff' ? 'Colaborador' : 'Cliente'}
                </span>
              </div>
              {inviteData.inviter_company && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Empresa:</span>
                  <span className="text-sm font-medium">{inviteData.inviter_company}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleAcceptInvite} className="space-y-4">
            <div>
              <Label htmlFor="password">Criar Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                required
                minLength={6}
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Aceitar Convite e Criar Conta'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}