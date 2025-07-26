// ==================================================
// FVStudios Dashboard - Admin: Gestão Global de Integrações
// Interface para admins gerenciarem todas as integrações do sistema
// ==================================================

"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/useUser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Users, 
  Building2, 
  Eye, 
  Edit3, 
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter
} from "lucide-react"
import { toast } from "sonner"

interface AdminIntegrationView {
  id: string
  client_id: string
  client_name: string
  client_email: string
  agency_name?: string
  provider: string
  provider_type: string
  status: 'active' | 'inactive' | 'error' | 'expired'
  is_valid: boolean
  last_validated_at: string | null
  validation_error: string | null
  created_at: string
}

export default function AdminAPIIntegrationsPage() {
  const { user } = useUser()
  const [integrations, setIntegrations] = useState<AdminIntegrationView[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterProvider, setFilterProvider] = useState<string>('all')

  // Verificar se é admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Acesso negado. Apenas administradores podem acessar esta página.')
      window.location.href = '/'
      return
    }
  }, [user])

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAllIntegrations()
    }
  }, [user])

  const loadAllIntegrations = async () => {
    try {
      setLoading(true)
      
      // TODO: Implementar chamada real para API
      // Por enquanto, dados mock para demonstração
      const mockData: AdminIntegrationView[] = [
        {
          id: '1',
          client_id: 'client1',
          client_name: 'João Silva',
          client_email: 'joao@exemplo.com',
          agency_name: 'Agência ABC Marketing',
          provider: 'meta',
          provider_type: 'ads',
          status: 'active',
          is_valid: true,
          last_validated_at: new Date().toISOString(),
          validation_error: null,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          client_id: 'client2',
          client_name: 'Maria Santos',
          client_email: 'maria@exemplo.com',
          agency_name: null, // Produtora independente
          provider: 'google',
          provider_type: 'ads',
          status: 'error',
          is_valid: false,
          last_validated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          validation_error: 'Token expirado',
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          client_id: 'client3',
          client_name: 'Pedro Influencer',
          client_email: 'pedro@exemplo.com',
          agency_name: null, // Influencer
          provider: 'tiktok',
          provider_type: 'ads',
          status: 'active',
          is_valid: true,
          last_validated_at: new Date().toISOString(),
          validation_error: null,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      
      setIntegrations(mockData)
    } catch (error) {
      console.error('Erro ao carregar integrações:', error)
      toast.error('Erro ao carregar integrações')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string, isValid: boolean) => {
    if (status === 'active' && isValid) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === 'error' || !isValid) return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }

  const getStatusBadge = (status: string, isValid: boolean) => {
    if (status === 'active' && isValid) {
      return <Badge className="bg-green-100 text-green-800">Ativa</Badge>
    }
    if (status === 'error' || !isValid) {
      return <Badge className="bg-red-100 text-red-800">Erro</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Inativa</Badge>
  }

  const getProviderName = (provider: string) => {
    const providers = {
      meta: 'Meta Ads',
      google: 'Google Ads',
      tiktok: 'TikTok Ads',
      linkedin: 'LinkedIn Ads',
      rdstation: 'RD Station',
      buffer: 'Buffer'
    }
    return providers[provider as keyof typeof providers] || provider
  }

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = 
      integration.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.agency_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && integration.status === 'active' && integration.is_valid) ||
      (filterStatus === 'error' && (integration.status === 'error' || !integration.is_valid)) ||
      (filterStatus === 'inactive' && integration.status === 'inactive')

    const matchesProvider = filterProvider === 'all' || integration.provider === filterProvider

    return matchesSearch && matchesStatus && matchesProvider
  })

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Administração - Integrações de API
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize e gerencie todas as integrações de API do sistema. Acesso administrativo completo.
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, email, provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="active">Ativas</option>
                <option value="error">Com Erro</option>
                <option value="inactive">Inativas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provider
              </label>
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
                <option value="tiktok">TikTok Ads</option>
                <option value="linkedin">LinkedIn Ads</option>
                <option value="rdstation">RD Station</option>
                <option value="buffer">Buffer</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i.status === 'active' && i.is_valid).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Com Erro</p>
                <p className="text-2xl font-bold text-red-600">
                  {integrations.filter(i => i.status === 'error' || !i.is_valid).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inativas</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {integrations.filter(i => i.status === 'inactive').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Integrações */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Integrações ({filteredIntegrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando integrações...</p>
            </div>
          ) : filteredIntegrations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhuma integração encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(integration.status, integration.is_valid)}
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {integration.client_name}
                          </h3>
                          {getStatusBadge(integration.status, integration.is_valid)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{integration.client_email}</span>
                          {integration.agency_name && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span>{integration.agency_name}</span>
                              </div>
                            </>
                          )}
                          <span>•</span>
                          <span>{getProviderName(integration.provider)}</span>
                        </div>

                        {integration.validation_error && (
                          <div className="mt-2 text-sm text-red-600">
                            <strong>Erro:</strong> {integration.validation_error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}