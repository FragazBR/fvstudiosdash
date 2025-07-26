'use client'

// ==================================================
// FVStudios Dashboard - Configurações de API Keys
// Gerenciamento seguro de chaves de API para integrações
// ==================================================

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import Topbar from '@/components/Shared/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Save,
  Copy,
  Shield,
  Zap,
  Brain,
  Palette,
  MessageSquare,
  BarChart3,
  Users,
  Link2,
  Sparkles
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { 
  apiKeysManager, 
  SERVICE_CONFIGS, 
  ServiceType, 
  ServiceConfig 
} from '@/lib/api-keys-manager'

// Interfaces
interface SavedAPIKey {
  id: string
  service_name: ServiceType
  is_active: boolean
  created_at: Date
  updated_at: Date
  has_secret: boolean
  additional_config: Record<string, any>
  validation_status?: 'valid' | 'invalid' | 'unknown'
}

// ==================================================
// COMPONENTES
// ==================================================

// Formulário para configurar API Key
function APIKeyConfigForm({ 
  service, 
  onSave, 
  onCancel,
  existingConfig 
}: {
  service: ServiceConfig
  onSave: (apiKey: string, secret?: string, config?: Record<string, any>) => void
  onCancel: () => void
  existingConfig?: Record<string, any>
}) {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [additionalConfig, setAdditionalConfig] = useState<Record<string, any>>(existingConfig || {})
  const [showKey, setShowKey] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Insira a chave da API')
      return
    }

    if (service.requires_secret && !apiSecret.trim()) {
      toast.error('Insira o secret da API')
      return
    }

    setSaving(true)
    try {
      await onSave(
        apiKey.trim(), 
        service.requires_secret ? apiSecret.trim() : undefined,
        additionalConfig
      )
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: string, value: any) => {
    setAdditionalConfig(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* API Key Field */}
      <div>
        <Label htmlFor="apiKey">Chave da API *</Label>
        <div className="relative mt-1">
          <Input
            id="apiKey"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Insira sua chave da API..."
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* API Secret Field (se necessário) */}
      {service.requires_secret && (
        <div>
          <Label htmlFor="apiSecret">Secret da API *</Label>
          <div className="relative mt-1">
            <Input
              id="apiSecret"
              type={showSecret ? 'text' : 'password'}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Insira o secret da API..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Campos de configuração adicional */}
      {service.config_fields.map(field => (
        <div key={field.key}>
          <Label htmlFor={field.key}>
            {field.label} {field.required && '*'}
          </Label>
          
          {field.type === 'select' ? (
            <Select 
              value={additionalConfig[field.key] || ''} 
              onValueChange={(value) => updateConfig(field.key, value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={field.placeholder || `Selecione ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={field.key}
              type={field.type}
              value={additionalConfig[field.key] || ''}
              onChange={(e) => updateConfig(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="mt-1"
            />
          )}
        </div>
      ))}

      {/* Documentação */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Precisa de ajuda?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {service.description}
            </p>
            <Button
              variant="link"
              size="sm"
              className="p-0 mt-2 text-blue-600 dark:text-blue-400"
              onClick={() => window.open(service.documentation_url, '_blank')}
            >
              Ver documentação oficial
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// Lista de API Keys configuradas
function APIKeysList({ 
  apiKeys, 
  onEdit, 
  onDelete, 
  onToggle,
  onValidate 
}: {
  apiKeys: SavedAPIKey[]
  onEdit: (service: ServiceType) => void
  onDelete: (service: ServiceType) => void
  onToggle: (service: ServiceType, active: boolean) => void
  onValidate: (service: ServiceType) => void
}) {
  const getServiceIcon = (service: ServiceType) => {
    const iconMap: Record<ServiceType, React.ReactNode> = {
      openai: <Brain className="h-5 w-5" />,
      claude: <Sparkles className="h-5 w-5" />,
      cohere: <Zap className="h-5 w-5" />,
      meta_ads: <Users className="h-5 w-5" />,
      google_ads: <BarChart3 className="h-5 w-5" />,
      tiktok_ads: <Users className="h-5 w-5" />,
      linkedin_ads: <Users className="h-5 w-5" />,
      hubspot: <Users className="h-5 w-5" />,
      pipedrive: <BarChart3 className="h-5 w-5" />,
      whatsapp_business: <MessageSquare className="h-5 w-5" />,
      canva: <Palette className="h-5 w-5" />,
      n8n: <Link2 className="h-5 w-5" />,
      zapier: <Zap className="h-5 w-5" />
    }
    return iconMap[service] || <Key className="h-5 w-5" />
  }

  const getStatusColor = (isActive: boolean, validationStatus?: string) => {
    if (!isActive) return 'bg-gray-100 text-gray-800'
    if (validationStatus === 'valid') return 'bg-green-100 text-green-800'
    if (validationStatus === 'invalid') return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getStatusText = (isActive: boolean, validationStatus?: string) => {
    if (!isActive) return 'Inativa'
    if (validationStatus === 'valid') return 'Ativa ✓'
    if (validationStatus === 'invalid') return 'Erro'
    return 'Ativa'
  }

  return (
    <div className="space-y-4">
      {apiKeys.map(apiKey => {
        const serviceConfig = SERVICE_CONFIGS[apiKey.service_name]
        
        return (
          <Card key={apiKey.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
                    {getServiceIcon(apiKey.service_name)}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {serviceConfig.display_name}
                      <span className="text-2xl">{serviceConfig.icon}</span>
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {serviceConfig.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={getStatusColor(apiKey.is_active, apiKey.validation_status)}>
                        {getStatusText(apiKey.is_active, apiKey.validation_status)}
                      </Badge>
                      {apiKey.has_secret && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Com Secret
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        Atualizado: {apiKey.updated_at.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={apiKey.is_active}
                    onCheckedChange={(checked) => onToggle(apiKey.service_name, checked)}
                  />
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onValidate(apiKey.service_name)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Testar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(apiKey.service_name)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => onDelete(apiKey.service_name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Lista de serviços disponíveis para configurar
function AvailableServicesList({ 
  availableServices, 
  onSelect 
}: {
  availableServices: ServiceConfig[]
  onSelect: (service: ServiceConfig) => void
}) {
  const getCategoryIcon = (service: ServiceConfig) => {
    if (service.name.includes('ai') || service.name.includes('gpt') || service.name.includes('claude')) {
      return <Brain className="h-5 w-5 text-purple-600" />
    }
    if (service.name.includes('ads')) {
      return <BarChart3 className="h-5 w-5 text-blue-600" />
    }
    if (service.name.includes('crm') || service.name.includes('hubspot') || service.name.includes('pipedrive')) {
      return <Users className="h-5 w-5 text-green-600" />
    }
    if (service.name.includes('whatsapp') || service.name.includes('message')) {
      return <MessageSquare className="h-5 w-5 text-green-600" />
    }
    if (service.name.includes('canva') || service.name.includes('design')) {
      return <Palette className="h-5 w-5 text-pink-600" />
    }
    return <Link2 className="h-5 w-5 text-gray-600" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {availableServices.map(service => (
        <Card 
          key={service.name} 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => onSelect(service)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              {getCategoryIcon(service)}
              <div>
                <h3 className="font-semibold text-sm">{service.display_name}</h3>
                <span className="text-2xl">{service.icon}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {service.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {service.requires_secret && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Secret
                  </Badge>
                )}
                {service.config_fields.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {service.config_fields.length} configs
                  </Badge>
                )}
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export default function IntelligentSettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [apiKeys, setApiKeys] = useState<SavedAPIKey[]>([])
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceConfig | null>(null)
  const [validatingServices, setValidatingServices] = useState<Set<ServiceType>>(new Set())
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      loadAPIKeys()
    }
  }, [user])

  const loadAPIKeys = async () => {
    try {
      setLoading(true)
      const keys = await apiKeysManager.getAllAPIKeys()
      setApiKeys(keys)
    } catch (error) {
      console.error('Erro ao carregar API keys:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAPIKey = async (apiKey: string, secret?: string, config?: Record<string, any>) => {
    if (!selectedService) return

    const success = await apiKeysManager.saveAPIKey(
      selectedService.name as ServiceType,
      apiKey,
      secret,
      config
    )

    if (success) {
      setShowConfigDialog(false)
      setSelectedService(null)
      await loadAPIKeys()
    }
  }

  const handleDeleteAPIKey = async (serviceType: ServiceType) => {
    if (!confirm(`Tem certeza que deseja remover a configuração de ${SERVICE_CONFIGS[serviceType].display_name}?`)) {
      return
    }

    const success = await apiKeysManager.deleteAPIKey(serviceType)
    if (success) {
      await loadAPIKeys()
    }
  }

  const handleToggleAPIKey = async (serviceType: ServiceType, active: boolean) => {
    const success = await apiKeysManager.toggleAPIKey(serviceType, active)
    if (success) {
      await loadAPIKeys()
    }
  }

  const handleValidateAPIKey = async (serviceType: ServiceType) => {
    setValidatingServices(prev => new Set([...prev, serviceType]))
    
    try {
      const isValid = await apiKeysManager.validateAPIKey(serviceType)
      
      // Atualizar status de validação local
      setApiKeys(prev => 
        prev.map(key => 
          key.service_name === serviceType 
            ? { ...key, validation_status: isValid ? 'valid' : 'invalid' }
            : key
        )
      )

      toast.success(
        isValid 
          ? `✅ ${SERVICE_CONFIGS[serviceType].display_name} está funcionando!`
          : `❌ ${SERVICE_CONFIGS[serviceType].display_name} com problema de autenticação`
      )
    } catch (error) {
      toast.error('Erro ao validar API key')
    } finally {
      setValidatingServices(prev => {
        const newSet = new Set(prev)
        newSet.delete(serviceType)
        return newSet
      })
    }
  }

  const configuredServices = new Set(apiKeys.map(key => key.service_name))
  const availableServices = Object.values(SERVICE_CONFIGS).filter(
    service => !configuredServices.has(service.name as ServiceType)
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-[#121212] min-h-screen">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
          <Topbar 
            name="Configurações de API"
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64" />
                <div className="grid grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-[#121212] min-h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar 
          name="Configurações de API Keys"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Configurações de API</h1>
                  <p className="text-gray-600">Gerencie as integrações do sistema inteligente</p>
                </div>
              </div>
              
              <Button onClick={() => loadAPIKeys()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="configured" className="space-y-6">
              <TabsList>
                <TabsTrigger value="configured" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Configuradas ({apiKeys.length})
                </TabsTrigger>
                <TabsTrigger value="available" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Disponíveis ({availableServices.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="configured" className="space-y-6">
                {apiKeys.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhuma API configurada</h3>
                      <p className="text-gray-600 mb-4">
                        Configure suas primeiras integrações para ativar o sistema inteligente
                      </p>
                      <Button onClick={() => setShowConfigDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Configurar primeira API
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <APIKeysList
                    apiKeys={apiKeys}
                    onEdit={(service) => {
                      setSelectedService(SERVICE_CONFIGS[service])
                      setShowConfigDialog(true)
                    }}
                    onDelete={handleDeleteAPIKey}
                    onToggle={handleToggleAPIKey}
                    onValidate={handleValidateAPIKey}
                  />
                )}
              </TabsContent>

              <TabsContent value="available" className="space-y-6">
                <AvailableServicesList
                  availableServices={availableServices}
                  onSelect={(service) => {
                    setSelectedService(service)
                    setShowConfigDialog(true)
                  }}
                />
              </TabsContent>
            </Tabs>

            {/* Dialog de Configuração */}
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    {selectedService && (
                      <>
                        <span className="text-3xl">{selectedService.icon}</span>
                        Configurar {selectedService.display_name}
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>
                
                {selectedService && (
                  <APIKeyConfigForm
                    service={selectedService}
                    onSave={handleSaveAPIKey}
                    onCancel={() => {
                      setShowConfigDialog(false)
                      setSelectedService(null)
                    }}
                    existingConfig={
                      apiKeys.find(key => key.service_name === selectedService.name)?.additional_config
                    }
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}