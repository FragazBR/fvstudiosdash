"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function OnboardingSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setVerificationStatus('error')
        return
      }

      try {
        // Aqui podemos adicionar verificação adicional se necessário
        // Por agora, assumimos sucesso se temos session_id
        setTimeout(() => {
          setVerificationStatus('success')
        }, 2000)
      } catch (error) {
        console.error('Payment verification error:', error)
        setVerificationStatus('error')
      }
    }

    verifyPayment()
  }, [sessionId])

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Verificando pagamento...</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Aguarde enquanto confirmamos sua assinatura.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-red-400 text-xl">✕</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Problema na verificação</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Houve um problema ao verificar seu pagamento. Entre em contato com o suporte.
              </p>
              <Button asChild variant="outline">
                <Link href="/agency-signup">Tentar Novamente</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-600 dark:text-green-400">
            🎉 Pagamento Confirmado!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">
              Bem-vindo ao FVStudios Dashboard!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sua agência foi criada com sucesso e sua assinatura está ativa.
              Agora você pode começar a gerenciar seus clientes e projetos.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🚀 Próximos passos:
              </h3>
              <ul className="text-left text-blue-700 dark:text-blue-300 space-y-2">
                <li>✅ Configure o perfil da sua agência</li>
                <li>✅ Adicione seus primeiros clientes</li>
                <li>✅ Crie projetos e organize tarefas</li>
                <li>✅ Conecte suas contas do Google/Facebook Ads</li>
                <li>✅ Explore os relatórios automáticos</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button asChild className="flex-1">
                <Link href="/agency">
                  Ir para Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/settings">
                  Configurar Perfil
                </Link>
              </Button>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mt-6">
              Session ID: {sessionId}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>}>
      <OnboardingSuccessContent />
    </Suspense>
  )
}