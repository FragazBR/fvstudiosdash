'use client'

// ==================================================
// FVStudios Dashboard - WhatsApp Configuration
// Dashboard de configuração WhatsApp para agências
// ==================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  MessageSquare,
  Settings,
  Key,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  TestTube,
  BarChart3,
  Webhook,
  Clock,
  Users,
  MessageCircle,
  Zap,
  Shield,
  Activity,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'

interface WhatsAppConfig {
  id: string
  agency_id: string
  api_key: string
  webhook_url: string
  is_active: boolean
  phone_number: string
  business_name: string
  webhook_verified: boolean
  last_health_check: Date
  notifications_enabled: boolean
  auto_responses_enabled: boolean
  business_hours_only: boolean
  created_at: Date
  updated_at: Date
}

interface ApiStatus {
  status: 'healthy' | 'warning' | 'error'
  message: string
  last_check: Date
  response_time_ms: number
}

interface NotificationStats {
  total_sent: number
  delivered: number
  read: number
  failed: number
  delivery_rate: number
  read_rate: number
  average_response_time: number
}

export function WhatsAppConfigDashboard() {
  const { user } = useUser()
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [stats, setStats] = useState<NotificationStats | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    api_key: '',
    phone_number: '',
    business_name: '',
    webhook_url: '',
    notifications_enabled: true,
    auto_responses_enabled: true,
    business_hours_only: false
  })

  useEffect(() => {
    loadConfig()
    loadStats()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/config', {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        if (data.config) {
          setFormData({
            api_key: '',
            phone_number: data.config.phone_number || '',
            business_name: data.config.business_name || '',
            webhook_url: data.config.webhook_url || '',
            notifications_enabled: data.config.notifications_enabled ?? true,
            auto_responses_enabled: data.config.auto_responses_enabled ?? true,
            business_hours_only: data.config.business_hours_only ?? false
          })
        }
        checkApiStatus()
      } else {
        toast.error('Erro ao carregar configuração')
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
      toast.error('Erro ao carregar configuração')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/whatsapp/stats', {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const checkApiStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/health', {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setApiStatus(data.status)
      }
    } catch (error) {
      console.error('Erro ao verificar status da API:', error)
      setApiStatus({
        status: 'error',
        message: 'Erro ao conectar com a API',
        last_check: new Date(),
        response_time_ms: 0
      })
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/whatsapp/config', {
        method: config ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Configuração salva com sucesso!')
        setShowApiKeyDialog(false)
        loadConfig()
        loadStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar configuração')
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    try {
      setTesting(true)
      
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          test_phone: config?.phone_number
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Teste realizado com sucesso! Verifique seu WhatsApp.')
        checkApiStatus()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro no teste de conexão')
      }
    } catch (error) {
      console.error('Erro no teste:', error)
      toast.error('Erro no teste de conexão')
    } finally {
      setTesting(false)
    }
  }

  const verifyWebhook = async () => {
    try {
      const response = await fetch('/api/whatsapp/webhook/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`
        }
      })

      if (response.ok) {
        toast.success('Webhook verificado com sucesso!')
        loadConfig()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao verificar webhook')
      }
    } catch (error) {
      console.error('Erro ao verificar webhook:', error)
      toast.error('Erro ao verificar webhook')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'error': return <XCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configuração WhatsApp</h1>
            <p className="text-gray-600">Configure a integração com WhatsApp Business API</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={checkApiStatus}
            disabled={!config}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar Status
          </Button>
          
          {config ? (
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </DialogTrigger>
              <ConfigurationDialog 
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                onSave={saveConfig}
                onCancel={() => setShowApiKeyDialog(false)}
              />
            </Dialog>
          ) : (
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Key className="h-4 w-4 mr-2" />
                  Configurar WhatsApp
                </Button>
              </DialogTrigger>
              <ConfigurationDialog 
                formData={formData}
                setFormData={setFormData}
                saving={saving}
                onSave={saveConfig}
                onCancel={() => setShowApiKeyDialog(false)}
              />
            </Dialog>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* API Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status da API</p>
                <div className="flex items-center gap-2 mt-1">
                  {apiStatus ? (
                    <>
                      <Badge className={getStatusColor(apiStatus.status)}>
                        {getStatusIcon(apiStatus.status)}
                        <span className="ml-1 capitalize">{apiStatus.status}</span>
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="secondary">
                      <Activity className="h-4 w-4 mr-1" />
                      Não verificado
                    </Badge>
                  )}
                </div>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
            {apiStatus && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">{apiStatus.message}</p>
                <p className="text-xs text-gray-400">
                  Tempo: {apiStatus.response_time_ms}ms
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notificações Enviadas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notificações</p>
                <p className="text-2xl font-bold">
                  {stats?.total_sent?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500">Total enviadas</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Entrega */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
                <p className="text-2xl font-bold">
                  {stats?.delivery_rate || 0}%
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.delivered || 0} de {stats?.total_sent || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Leitura */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Leitura</p>
                <p className="text-2xl font-bold">
                  {stats?.read_rate || 0}%
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.read || 0} lidas
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration */}
      {config ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuração Atual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuração Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Número WhatsApp</Label>
                    <p className="text-lg font-mono">{config.phone_number}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Nome do Negócio</Label>
                    <p className="text-lg">{config.business_name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={config.is_active ? 'default' : 'secondary'}>
                        {config.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
                      
                      <Badge variant={config.webhook_verified ? 'default' : 'destructive'}>
                        {config.webhook_verified ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Webhook OK
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Webhook Pendente
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={testConnection}
                      disabled={testing}
                      className="w-full"
                    >
                      {testing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4 mr-2" />
                          Testar Conexão
                        </>
                      )}
                    </Button>
                    
                    {!config.webhook_verified && (
                      <Button
                        variant="outline"
                        onClick={verifyWebhook}
                        className="w-full"
                      >
                        <Webhook className="h-4 w-4 mr-2" />
                        Verificar Webhook
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas Detalhadas */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Estatísticas Detalhadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Total Enviadas</Label>
                        <p className="text-xl font-bold">{stats.total_sent.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Entregues</Label>
                        <p className="text-xl font-bold text-green-600">{stats.delivered.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Lidas</Label>
                        <p className="text-xl font-bold text-blue-600">{stats.read.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Falharam</Label>
                        <p className="text-xl font-bold text-red-600">{stats.failed.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tempo médio de resposta</span>
                        <span className="font-mono text-sm">{stats.average_response_time}ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="webhook">
            <WebhookConfiguration config={config} onVerify={verifyWebhook} />
          </TabsContent>

          <TabsContent value="settings">
            <NotificationSettings config={config} onUpdate={loadConfig} />
          </TabsContent>

          <TabsContent value="logs">
            <NotificationLogs />
          </TabsContent>
        </Tabs>
      ) : (
        /* Setup inicial */
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Configure o WhatsApp Business API
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Configure sua chave de API do WhatsApp Business para começar a enviar 
              notificações automáticas para seus clientes.
            </p>
            <Button onClick={() => setShowApiKeyDialog(true)} size="lg">
              <Key className="h-5 w-5 mr-2" />
              Começar Configuração
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Componente de diálogo de configuração
function ConfigurationDialog({ 
  formData, 
  setFormData, 
  saving, 
  onSave, 
  onCancel 
}: {
  formData: any
  setFormData: (data: any) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Configurar WhatsApp Business API</DialogTitle>
        <DialogDescription>
          Configure as credenciais e configurações do WhatsApp Business API
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="business_name">Nome do Negócio</Label>
            <Input
              id="business_name"
              placeholder="Ex: FVStudios Agência"
              value={formData.business_name}
              onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="phone_number">Número WhatsApp</Label>
            <Input
              id="phone_number"
              placeholder="Ex: +5511999999999"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="api_key">Chave da API</Label>
          <div className="relative">
            <Input
              id="api_key"
              type={showApiKey ? 'text' : 'password'}
              placeholder="Sua chave da API do WhatsApp Business"
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-0 h-full"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="webhook_url">URL do Webhook</Label>
          <Input
            id="webhook_url"
            placeholder="https://seudominio.com/api/whatsapp/webhook"
            value={formData.webhook_url}
            onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
          />
          <p className="text-xs text-gray-500 mt-1">
            URL onde o WhatsApp enviará as atualizações de status das mensagens
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications_enabled">Notificações Habilitadas</Label>
              <p className="text-xs text-gray-500">Enviar notificações automáticas para clientes</p>
            </div>
            <Switch
              id="notifications_enabled"
              checked={formData.notifications_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications_enabled: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_responses_enabled">Respostas Automáticas</Label>
              <p className="text-xs text-gray-500">Responder automaticamente a mensagens recebidas</p>
            </div>
            <Switch
              id="auto_responses_enabled"
              checked={formData.auto_responses_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_responses_enabled: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="business_hours_only">Apenas Horário Comercial</Label>
              <p className="text-xs text-gray-500">Enviar mensagens apenas em horário comercial</p>
            </div>
            <Switch
              id="business_hours_only"
              checked={formData.business_hours_only}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, business_hours_only: checked }))}
            />
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configuração'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// Componentes auxiliares (implementações simplificadas)
function WebhookConfiguration({ config, onVerify }: { config: WhatsAppConfig, onVerify: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Webhook</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>URL do Webhook</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input value={config.webhook_url} readOnly />
              <Button onClick={onVerify} variant="outline">
                <Webhook className="h-4 w-4 mr-2" />
                Verificar
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={config.webhook_verified ? 'default' : 'destructive'}>
              {config.webhook_verified ? 'Verificado' : 'Pendente'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationSettings({ config, onUpdate }: { config: WhatsAppConfig, onUpdate: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações Habilitadas</Label>
              <p className="text-sm text-gray-500">Enviar notificações automáticas</p>
            </div>
            <Switch checked={config.notifications_enabled} />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Apenas Horário Comercial</Label>
              <p className="text-sm text-gray-500">9h às 18h, seg-sex</p>
            </div>
            <Switch checked={config.business_hours_only} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationLogs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Notificações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Logs de notificações serão exibidos aqui</p>
        </div>
      </CardContent>
    </Card>
  )
}