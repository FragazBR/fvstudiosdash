'use client'

// ==================================================
// FVStudios Dashboard - Google Ads API Status Component
// Componente para mostrar status da integração com Google Ads API
// ==================================================

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  RefreshCw,
  ExternalLink,
  Users,
  Activity,
  DollarSign,
  Globe
} from 'lucide-react'
import { useGoogleAdsAPI } from '@/hooks/useGoogleAdsAPI'

interface GoogleAdsStatusProps {
  showFullCard?: boolean
  showActions?: boolean
  onRefresh?: () => void
}

export function GoogleAdsStatus({ 
  showFullCard = true, 
  showActions = true,
  onRefresh 
}: GoogleAdsStatusProps) {
  const { 
    status, 
    loading, 
    checkAPIConfiguration, 
    reconfigureAPI,
    campaigns,
    account
  } = useGoogleAdsAPI()

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (status.isValid) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status.isConfigured) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusText = () => {
    if (loading) return 'Verificando...'
    if (status.isValid) return 'Conectado'
    if (status.isConfigured) return 'Configurado (Erro)'
    return 'Não Configurado'
  }

  const getStatusColor = () => {
    if (loading) return 'bg-gray-100 text-gray-800'
    if (status.isValid) return 'bg-green-100 text-green-800'
    if (status.isConfigured) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const handleRefresh = async () => {
    await checkAPIConfiguration()
    if (onRefresh) onRefresh()
  }

  // Versão compacta (apenas badge)
  if (!showFullCard) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor()}>
          {getStatusIcon()}
          <span className="ml-1">Google Ads: {getStatusText()}</span>
        </Badge>
        {showActions && (
          <Button size="sm" variant="ghost" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // Versão completa (card)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            Google Ads API
          </div>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Conexão */}
        {status.error ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erro:</strong> {status.error}
            </AlertDescription>
          </Alert>
        ) : status.isValid && account ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Conectado com sucesso!</strong> Conta: {account.name} ({account.currency})
            </AlertDescription>
          </Alert>
        ) : !status.isConfigured ? (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>API não configurada.</strong> Configure suas credenciais do Google Ads para começar.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Informações da Conta */}
        {status.isValid && account && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Cliente ID</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{account.id}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Moeda</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{account.currency}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Fuso</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{account.timeZone}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Campanhas</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{campaigns.length}</div>
            </div>
          </div>
        )}

        {/* Status da Última Verificação */}
        {status.lastChecked && (
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <RefreshCw className="h-3 w-3" />
            Última verificação: {status.lastChecked.toLocaleString()}
          </div>
        )}

        {/* Ações */}
        {showActions && (
          <div className="flex items-center gap-2">
            {!status.isConfigured ? (
              <Button onClick={reconfigureAPI} className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Configurar Google Ads API
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Verificar
                </Button>
                
                <Button variant="outline" onClick={reconfigureAPI}>
                  <Settings className="h-4 w-4 mr-2" />
                  Reconfigurar
                </Button>
              </>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open('https://developers.google.com/google-ads/api/docs', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Docs
            </Button>
          </div>
        )}

        {/* Instruções rápidas */}
        {!status.isConfigured && (
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <div className="font-medium">Para configurar a Google Ads API:</div>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Acesse o Google Cloud Console</li>
              <li>Crie um projeto e ative a Google Ads API</li>
              <li>Configure OAuth2 e gere credenciais</li>
              <li>Obtenha um Developer Token do Google Ads</li>
              <li>Configure o Customer ID da conta</li>
              <li>Insira as credenciais na página de configurações</li>
            </ol>
          </div>
        )}

        {/* Recursos específicos do Google Ads */}
        {status.isValid && (
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <div className="font-medium">Recursos disponíveis:</div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Análise de performance de campanhas</li>
              <li>Otimização automática de lances</li>
              <li>Monitoramento de palavras-chave</li>
              <li>Recomendações de melhorias</li>
              <li>Relatórios de Quality Score</li>
              <li>Ajuste automático de orçamentos</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente compacto para uso em headers
export function GoogleAdsStatusBadge() {
  return <GoogleAdsStatus showFullCard={false} showActions={false} />
}

// Componente inline para uso em listas
export function GoogleAdsStatusInline({ onRefresh }: { onRefresh?: () => void }) {
  return <GoogleAdsStatus showFullCard={false} showActions={true} onRefresh={onRefresh} />
}