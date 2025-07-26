'use client'

// ==================================================
// FVStudios Dashboard - Central de Integrações de APIs
// Interface completa para gerenciar integrações com APIs externas
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Plus,
  Settings,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Key,
  Globe,
  Zap,
  BarChart3,
  Clock,
  Activity,
  Link as LinkIcon,
  Unlink,
  Copy,
  Download,
  Upload,
  Database,
  Webhook,
  PlayCircle,
  PauseCircle,
  Info,
  ExternalLink,
  Code,
  FileText,
  Sparkles
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { supabaseBrowser } from '@/lib/supabaseBrowser'

// Interfaces
interface APIIntegration {
  id: string
  client_id: string
  agency_id: string
  created_by: string
  name: string
  provider: string
  provider_type: string
  description: string
  auth_type: string
  status: 'active' | 'inactive' | 'error' | 'expired'
  is_valid: boolean
  last_validated_at: string | null
  validation_error: string | null
  auto_sync: boolean
  sync_frequency: string
  last_sync_at: string | null
  next_sync_at: string | null
  rate_limit_per_hour: number
  rate_limit_remaining: number | null
  rate_limit_reset_at: string | null
  provider_config: any
  created_at: string
  updated_at: string
}

interface APIProvider {
  id: string
  name: string
  displayName: string
  type: 'ads' | 'social_media' | 'analytics' | 'crm' | 'email_marketing'
  icon: React.ReactNode
  color: string
  authType: 'oauth2' | 'api_key' | 'bearer_token'
  documentation: string
  features: string[]
  popular: boolean
}

interface IntegrationLog {
  id: string
  operation: string
  method: string
  endpoint: string
  response_status: number | null
  duration_ms: number | null
  status: 'success' | 'error' | 'timeout' | 'rate_limited'
  error_message: string | null
  created_at: string
}

// ==================================================
// PROVIDERS DISPONÍVEIS
// ==================================================

const API_PROVIDERS: APIProvider[] = [
  {
    id: 'meta',
    name: 'meta',
    displayName: 'Meta Ads (Facebook/Instagram)',
    type: 'ads',
    icon: <Globe className="h-5 w-5" />,
    color: 'bg-blue-500',
    authType: 'oauth2',
    documentation: 'https://developers.facebook.com/docs/marketing-api',
    features: ['Gerenciamento de Campanhas', 'Métricas de Performance', 'Públicos Personalizados', 'Creative Management'],
    popular: true
  },
  {
    id: 'google',
    name: 'google',
    displayName: 'Google Ads',
    type: 'ads',
    icon: <Globe className="h-5 w-5" />,
    color: 'bg-red-500',
    authType: 'oauth2',
    documentation: 'https://developers.google.com/google-ads/api',
    features: ['Campanhas de Pesquisa', 'Display Network', 'Shopping Ads', 'Relatórios Avançados'],
    popular: true
  },
  {
    id: 'tiktok',
    name: 'tiktok',
    displayName: 'TikTok Business API',
    type: 'ads',
    icon: <Globe className="h-5 w-5" />,
    color: 'bg-black',
    authType: 'oauth2',
    documentation: 'https://ads.tiktok.com/marketing_api/docs',
    features: ['TikTok Ads Manager', 'Spark Ads', 'Branded Effects', 'Analytics'],
    popular: true
  },
  {
    id: 'linkedin',
    name: 'linkedin',
    displayName: 'LinkedIn Marketing API',
    type: 'ads',
    icon: <Globe className="h-5 w-5" />,
    color: 'bg-blue-600',
    authType: 'oauth2',
    documentation: 'https://docs.microsoft.com/en-us/linkedin/',
    features: ['Sponsored Content', 'Lead Gen Forms', 'Company Pages', 'Analytics'],
    popular: false
  },
  {
    id: 'rdstation',
    name: 'rdstation',
    displayName: 'RD Station',
    type: 'crm',
    icon: <Database className="h-5 w-5" />,
    color: 'bg-green-500',
    authType: 'oauth2',
    documentation: 'https://developers.rdstation.com/',
    features: ['Marketing Automation', 'Lead Management', 'Email Marketing', 'Landing Pages'],
    popular: false
  },
  {
    id: 'buffer',
    name: 'buffer',
    displayName: 'Buffer',
    type: 'social_media',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'bg-purple-500',
    authType: 'oauth2',
    documentation: 'https://buffer.com/developers/api',
    features: ['Social Media Scheduling', 'Analytics', 'Team Collaboration', 'Content Calendar'],
    popular: false
  }
]

// ==================================================
// HOOKS
// ==================================================

function useAPIIntegrations(clientId: string) {
  const { user } = useUser()
  const [integrations, setIntegrations] = useState<APIIntegration[]>([])
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clientId) {
      loadIntegrations()
    }
  }, [clientId])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      
      // Simular dados até a migração do banco estar completa
      const mockIntegrations: APIIntegration[] = [
        {
          id: '1',
          client_id: clientId,
          agency_id: user?.agency_id || '',
          created_by: user?.id || '',
          name: 'Meta Ads Principal',
          provider: 'meta',
          provider_type: 'ads',
          description: 'Integração principal com Meta Ads para campanhas do Facebook e Instagram',
          auth_type: 'oauth2',
          status: 'active',
          is_valid: true,
          last_validated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          validation_error: null,
          auto_sync: true,
          sync_frequency: 'hourly',
          last_sync_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          next_sync_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          rate_limit_per_hour: 200,
          rate_limit_remaining: 156,
          rate_limit_reset_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          provider_config: { account_id: '123456789', pixel_id: '987654321' },
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          agency_id: user?.agency_id || '',
          created_by: user?.id || '',
          name: 'Google Ads Conta Principal',
          provider: 'google',
          provider_type: 'ads',
          description: 'Integração com Google Ads para campanhas de pesquisa e display',
          auth_type: 'oauth2',
          status: 'error',
          is_valid: false,
          last_validated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          validation_error: 'Token de acesso expirado',
          auto_sync: false,
          sync_frequency: 'daily',
          last_sync_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          next_sync_at: null,
          rate_limit_per_hour: 500,
          rate_limit_remaining: 0,
          rate_limit_reset_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          provider_config: { customer_id: '123-456-7890' },
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          agency_id: user?.agency_id || '',
          created_by: user?.id || '',
          name: 'TikTok Business',
          provider: 'tiktok',
          provider_type: 'ads',
          description: 'Integração com TikTok Ads Manager',
          auth_type: 'oauth2',
          status: 'inactive',
          is_valid: false,
          last_validated_at: null,
          validation_error: 'Integração não configurada',
          auto_sync: false,
          sync_frequency: 'manual',
          last_sync_at: null,
          next_sync_at: null,
          rate_limit_per_hour: 100,
          rate_limit_remaining: null,
          rate_limit_reset_at: null,
          provider_config: {},
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      const mockLogs: IntegrationLog[] = [
        {
          id: '1',
          operation: 'sync',
          method: 'GET',
          endpoint: '/campaigns',
          response_status: 200,
          duration_ms: 1250,
          status: 'success',
          error_message: null,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          operation: 'validate',
          method: 'GET',
          endpoint: '/me',
          response_status: 401,
          duration_ms: 890,
          status: 'error',
          error_message: 'Invalid access token',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          operation: 'sync',
          method: 'GET',
          endpoint: '/insights',
          response_status: 429,
          duration_ms: 2340,
          status: 'rate_limited',
          error_message: 'Rate limit exceeded',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]

      setIntegrations(mockIntegrations)
      setLogs(mockLogs)

    } catch (error) {
      console.error('Erro ao carregar integrações:', error)
      toast.error('Erro ao carregar integrações de API')
    } finally {
      setLoading(false)
    }
  }

  const validateIntegration = async (integrationId: string) => {
    toast.info('Validando integração...')
    
    // Simular validação
    setTimeout(() => {
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              is_valid: true,
              status: 'active' as const,
              last_validated_at: new Date().toISOString(),
              validation_error: null
            }
          : integration
      ))
      toast.success('Integração validada com sucesso!')
    }, 2000)
  }

  const toggleIntegration = async (integrationId: string, enabled: boolean) => {
    setIntegrations(prev => prev.map(integration =>
      integration.id === integrationId
        ? {
            ...integration,
            status: enabled ? 'active' as const : 'inactive' as const,
            auto_sync: enabled
          }
        : integration
    ))
    
    toast.success(`Integração ${enabled ? 'ativada' : 'desativada'}`)
  }

  const syncIntegration = async (integrationId: string) => {
    toast.info('Iniciando sincronização...')
    
    // Simular sincronização
    setTimeout(() => {
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              last_sync_at: new Date().toISOString(),
              next_sync_at: integration.sync_frequency === 'hourly' 
                ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }
          : integration
      ))
      toast.success('Sincronização concluída!')
    }, 3000)
  }

  return {
    integrations,
    logs,
    loading,
    validateIntegration,
    toggleIntegration,
    syncIntegration,
    refreshIntegrations: loadIntegrations
  }
}

// ==================================================
// COMPONENTES
// ==================================================

function IntegrationCard({ integration, onValidate, onToggle, onSync }: {
  integration: APIIntegration
  onValidate: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onSync: (id: string) => void
}) {
  const provider = API_PROVIDERS.find(p => p.name === integration.provider)
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'expired':
        return <Clock className="h-5 w-5 text-orange-500" />
      case 'inactive':
        return <PauseCircle className="h-5 w-5 text-gray-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'expired':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'error': return 'Erro'
      case 'expired': return 'Expirado'
      case 'inactive': return 'Inativo'
      default: return 'Desconhecido'
    }
  }

  return (
    <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md hover:scale-105 hover:border-[#01b86c]/40 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg text-white ${provider?.color || 'bg-gray-500'}`}>
            {provider?.icon || <Globe className="h-5 w-5" />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {integration.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {provider?.displayName || integration.provider}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getStatusColor(integration.status)}`}>
                  {getStatusLabel(integration.status)}
                </Badge>
                <Switch
                  checked={integration.status === 'active'}
                  onCheckedChange={(checked) => onToggle(integration.id, checked)}
                  disabled={!integration.is_valid}
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {integration.description}
            </p>

            {/* Status Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon(integration.status)}
                <span className="text-gray-600 dark:text-gray-400">
                  {integration.validation_error || 'Funcionando normalmente'}
                </span>
              </div>

              {integration.last_sync_at && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <RefreshCw className="h-4 w-4" />
                  <span>
                    Última sincronização: {new Date(integration.last_sync_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {integration.rate_limit_remaining !== null && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Zap className="h-4 w-4" />
                  <span>
                    Rate limit: {integration.rate_limit_remaining}/{integration.rate_limit_per_hour}
                  </span>
                  <Progress 
                    value={(integration.rate_limit_remaining / integration.rate_limit_per_hour) * 100} 
                    className="w-16 h-2" 
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Criado em {new Date(integration.created_at).toLocaleDateString('pt-BR')}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs hover:text-[#01b86c] hover:border-[#01b86c]/40"
                  onClick={() => onValidate(integration.id)}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Validar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs hover:text-[#01b86c] hover:border-[#01b86c]/40"
                  onClick={() => onSync(integration.id)}
                  disabled={integration.status !== 'active'}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sincronizar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs hover:text-[#01b86c] hover:border-[#01b86c]/40"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configurar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProviderCard({ provider, onConnect }: {
  provider: APIProvider
  onConnect: (providerId: string) => void
}) {
  return (
    <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:shadow-md hover:scale-105 hover:border-[#01b86c]/40 transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg text-white ${provider.color}`}>
            {provider.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {provider.displayName}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {provider.type.replace('_', ' ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {provider.popular && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
                    Popular
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {provider.authType}
                </Badge>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recursos:
              </div>
              <div className="flex flex-wrap gap-1">
                {provider.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {provider.features.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{provider.features.length - 3}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs hover:text-[#01b86c] hover:border-[#01b86c]/40"
                onClick={() => window.open(provider.documentation, '_blank')}
              >
                <FileText className="h-3 w-3 mr-1" />
                Docs
              </Button>
              <Button
                size="sm"
                className="bg-[#01b86c] hover:bg-[#01b86c]/90 text-white text-xs h-7 px-3"
                onClick={() => onConnect(provider.id)}
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                Conectar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LogsTable({ logs }: { logs: IntegrationLog[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'rate_limited':
        return <Zap className="h-4 w-4 text-orange-500" />
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'rate_limited':
        return 'text-orange-600'
      case 'timeout':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="overflow-hidden">
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-[#1e1e1e]/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(log.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {log.method} {log.endpoint}
                    </span>
                    {log.response_status && (
                      <Badge variant="outline" className={`text-xs ${getStatusColor(log.status)}`}>
                        {log.response_status}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {log.operation} • {new Date(log.created_at).toLocaleString('pt-BR')}
                    {log.duration_ms && ` • ${log.duration_ms}ms`}
                  </div>
                  {log.error_message && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {log.error_message}
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toast.info('Visualizador de logs em desenvolvimento')}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function APIIntegrations({ clientId }: { clientId: string }) {
  const { 
    integrations, 
    logs, 
    loading, 
    validateIntegration, 
    toggleIntegration, 
    syncIntegration,
    refreshIntegrations 
  } = useAPIIntegrations(clientId)
  
  const [activeTab, setActiveTab] = useState('integrations')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const handleConnectProvider = (providerId: string) => {
    toast.info(`Iniciando conexão com ${providerId}...`)
    setShowAddDialog(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Integrações de API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeIntegrations = integrations.filter(i => i.status === 'active')
  const errorIntegrations = integrations.filter(i => i.status === 'error' || i.status === 'expired')

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <Globe className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {integrations.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total de Integrações
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {activeIntegrations.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Ativas
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {errorIntegrations.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Com Erro
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {logs.filter(l => l.status === 'success').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Sincronizações Hoje
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Central de Integrações
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Seguro
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshIntegrations}
                className="hover:text-[#01b86c] hover:border-[#01b86c]/40"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
              <Button
                size="sm"
                className="bg-[#01b86c] hover:bg-[#01b86c]/90"
                onClick={() => setActiveTab('providers')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Integração
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full lg:w-96">
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Minhas</span>
              </TabsTrigger>
              <TabsTrigger value="providers" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Disponíveis</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Logs</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
              </TabsTrigger>
            </TabsList>

            {/* Minhas Integrações */}
            <TabsContent value="integrations" className="space-y-6">
              {errorIntegrations.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {errorIntegrations.length} integração(ões) precisam de atenção. 
                    Verifique as configurações e tokens de acesso.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {integrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onValidate={validateIntegration}
                    onToggle={toggleIntegration}
                    onSync={syncIntegration}
                  />
                ))}
              </div>

              {integrations.length === 0 && (
                <div className="text-center py-8">
                  <Unlink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nenhuma integração configurada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Conecte-se com plataformas de marketing para automatizar seus processos.
                  </p>
                  <Button
                    onClick={() => setActiveTab('providers')}
                    className="bg-[#01b86c] hover:bg-[#01b86c]/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Integração
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Providers Disponíveis */}
            <TabsContent value="providers" className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Plataformas Disponíveis
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Conecte-se com as principais plataformas de marketing digital
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {API_PROVIDERS.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onConnect={handleConnectProvider}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Logs */}
            <TabsContent value="logs" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Logs de Integração
                </h3>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="rate_limited">Rate Limited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <LogsTable logs={logs} />
            </TabsContent>

            {/* Configurações */}
            <TabsContent value="settings" className="space-y-6">
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Configurações Avançadas
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Configurações globais de integração e segurança em desenvolvimento.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}