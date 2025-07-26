// ==================================================
// FVStudios Dashboard - Página de Integrações de API
// Interface para gerenciar integrações com APIs externas
// ==================================================

"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/useUser"
import { APIIntegrations } from "@/components/api-integrations"

export default function ApiIntegrationsPage() {
  const { user } = useUser()
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    // Cada usuário gerencia suas próprias integrações
    // Cada cliente (da agência ou independente) tem suas próprias integrações
    if (user?.id) {
      setClientId(user.id)
    }
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Faça login para acessar as integrações.</p>
        </div>
      </div>
    )
  }

  if (!clientId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Carregando informações do usuário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Integrações de API
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas integrações com plataformas de marketing digital como Meta Ads, Google Ads, TikTok, LinkedIn e muito mais.
        </p>
      </div>

      {/* Componente de Integrações */}
      <APIIntegrations clientId={clientId} />
    </div>
  )
}