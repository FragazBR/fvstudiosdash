'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Button
} from '@/components/ui/button'
import {
  Badge
} from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Label
} from '@/components/ui/label'
import {
  Input
} from '@/components/ui/input'
import {
  Textarea
} from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  TestTube,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Filter,
  BarChart3,
  Webhook as WebhookIcon
} from 'lucide-react'
import { Webhook, WebhookEvent, WebhookEventType } from '@/lib/webhook-system'
import { toast } from 'react-hot-toast'

interface WebhookStats {
  total_webhooks: number
  active_webhooks: number
  total_events: number
  successful_events: number
  failed_events: number
  success_rate: number
  events_last_24h: number
}

export default function WebhookDashboard() {
  const user = useUser()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [eventTypes, setEventTypes] = useState<WebhookEventType[]>([])
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    method: 'POST',
    headers: '{}',
    secret_token: '',
    events: [] as string[],
    retry_attempts: 3,
    retry_delay_seconds: 60,
    timeout_seconds: 30,
    filters: '{}'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadWebhooks(),
        loadEvents(),
        loadEventTypes(),
        loadStats()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks')
      const data = await response.json()
      if (data.success) {
        setWebhooks(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error)
    }
  }

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/webhooks/events?limit=100')
      const data = await response.json()
      if (data.success) {
        setEvents(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    }
  }

  const loadEventTypes = async () => {
    try {
      const response = await fetch('/api/webhooks/event-types')
      const data = await response.json()
      if (data.success) {
        setEventTypes(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de eventos:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/webhooks/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleCreateWebhook = async () => {
    try {
      const headers = JSON.parse(formData.headers || '{}')
      const filters = JSON.parse(formData.filters || '{}')

      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          headers,
          filters,
          created_by: user?.id
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Webhook criado com sucesso!')
        setShowCreateDialog(false)
        resetForm()
        loadWebhooks()
      } else {
        toast.error(data.error || 'Erro ao criar webhook')
      }
    } catch (error) {
      toast.error('Erro ao criar webhook')
      console.error(error)
    }
  }

  const handleUpdateWebhook = async () => {
    if (!selectedWebhook) return

    try {
      const headers = JSON.parse(formData.headers || '{}')
      const filters = JSON.parse(formData.filters || '{}')

      const response = await fetch(`/api/webhooks/${selectedWebhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          headers,
          filters
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Webhook atualizado com sucesso!')
        setShowEditDialog(false)
        setSelectedWebhook(null)
        resetForm()
        loadWebhooks()
      } else {
        toast.error(data.error || 'Erro ao atualizar webhook')
      }
    } catch (error) {
      toast.error('Erro ao atualizar webhook')
      console.error(error)
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Tem certeza que deseja deletar este webhook?')) return

    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Webhook deletado com sucesso!')
        loadWebhooks()
      } else {
        toast.error(data.error || 'Erro ao deletar webhook')
      }
    } catch (error) {
      toast.error('Erro ao deletar webhook')
      console.error(error)
    }
  }

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST'
      })

      const data = await response.json()
      if (data.success) {
        const result = data.data
        if (result.success) {
          toast.success(`Teste realizado com sucesso! Status: ${result.status_code}`)
        } else {
          toast.error(`Teste falhou: ${result.error}`)
        }
      } else {
        toast.error('Erro ao testar webhook')
      }
    } catch (error) {
      toast.error('Erro ao testar webhook')
      console.error(error)
    }
  }

  const handleToggleWebhook = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !webhook.is_active
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Webhook ${webhook.is_active ? 'desativado' : 'ativado'} com sucesso!`)
        loadWebhooks()
      } else {
        toast.error(data.error || 'Erro ao alterar status do webhook')
      }
    } catch (error) {
      toast.error('Erro ao alterar status do webhook')
      console.error(error)
    }
  }

  const handleRetryEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/webhooks/events/${eventId}/retry`, {
        method: 'POST'
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Evento reenviado com sucesso!')
        loadEvents()
      } else {
        toast.error(data.error || 'Erro ao reenviar evento')
      }
    } catch (error) {
      toast.error('Erro ao reenviar evento')
      console.error(error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      method: 'POST',
      headers: '{}',
      secret_token: '',
      events: [],
      retry_attempts: 3,
      retry_delay_seconds: 60,
      timeout_seconds: 30,
      filters: '{}'
    })
  }

  const openEditDialog = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setFormData({
      name: webhook.name,
      description: webhook.description || '',
      url: webhook.url,
      method: webhook.method,
      headers: JSON.stringify(webhook.headers || {}, null, 2),
      secret_token: webhook.secret_token || '',
      events: webhook.events,
      retry_attempts: webhook.retry_attempts,
      retry_delay_seconds: webhook.retry_delay_seconds,
      timeout_seconds: webhook.timeout_seconds,
      filters: JSON.stringify(webhook.filters || {}, null, 2)
    })
    setShowEditDialog(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'sending':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'retrying':
        return <RefreshCw className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === 'success' ? 'success' : 
                   status === 'failed' ? 'destructive' :
                   status === 'pending' ? 'secondary' : 'default'
    
    return (
      <Badge variant={variant as any} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Webhooks</h1>
          <p className="text-muted-foreground">
            Configure e monitore webhooks para integração com sistemas externos
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Webhook</DialogTitle>
              <DialogDescription>
                Configure um novo webhook para receber eventos do sistema
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nome do webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="method">Método HTTP</Label>
                  <Select value={formData.method} onValueChange={(value) => setFormData({...formData, method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://exemplo.com/webhook"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição opcional"
                />
              </div>

              <div>
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {eventTypes.map((eventType) => (
                    <label key={eventType.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(eventType.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, events: [...formData.events, eventType.name]})
                          } else {
                            setFormData({...formData, events: formData.events.filter(e => e !== eventType.name)})
                          }
                        }}
                      />
                      <span className="text-sm">{eventType.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="retry_attempts">Tentativas</Label>
                  <Input
                    id="retry_attempts"
                    type="number"
                    value={formData.retry_attempts}
                    onChange={(e) => setFormData({...formData, retry_attempts: parseInt(e.target.value)})}
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <Label htmlFor="retry_delay">Delay (seg)</Label>
                  <Input
                    id="retry_delay"
                    type="number"
                    value={formData.retry_delay_seconds}
                    onChange={(e) => setFormData({...formData, retry_delay_seconds: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (seg)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={formData.timeout_seconds}
                    onChange={(e) => setFormData({...formData, timeout_seconds: parseInt(e.target.value)})}
                    min="1"
                    max="300"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secret_token">Secret Token (opcional)</Label>
                <Input
                  id="secret_token"
                  value={formData.secret_token}
                  onChange={(e) => setFormData({...formData, secret_token: e.target.value})}
                  placeholder="Token para assinatura HMAC"
                />
              </div>

              <div>
                <Label htmlFor="headers">Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={formData.headers}
                  onChange={(e) => setFormData({...formData, headers: e.target.value})}
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="filters">Filtros (JSON)</Label>
                <Textarea
                  id="filters"
                  value={formData.filters}
                  onChange={(e) => setFormData({...formData, filters: e.target.value})}
                  placeholder='{"status": "active"}'
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWebhook}>
                Criar Webhook
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
              <WebhookIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_webhooks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_webhooks} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_events}</div>
              <p className="text-xs text-muted-foreground">
                {stats.events_last_24h} nas últimas 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.success_rate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.successful_events} sucessos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Falhados</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed_events}</div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="events">Histórico de Eventos</TabsTrigger>
          <TabsTrigger value="event-types">Tipos de Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks Configurados</CardTitle>
              <CardDescription>
                Gerencie seus webhooks e monitore seu status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Eventos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Execução</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{webhook.name}</div>
                          {webhook.description && (
                            <div className="text-xs text-muted-foreground">
                              {webhook.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {webhook.method}
                          </Badge>
                          <a 
                            href={webhook.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <span className="truncate max-w-48">{webhook.url}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {webhook.events.slice(0, 2).join(', ')}
                          {webhook.events.length > 2 && (
                            <span className="text-muted-foreground">
                              {' '}e mais {webhook.events.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                          {webhook.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {webhook.last_triggered ? (
                          <div className="text-xs">
                            {new Date(webhook.last_triggered).toLocaleString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestWebhook(webhook.id)}
                          >
                            <TestTube className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleWebhook(webhook)}
                          >
                            {webhook.is_active ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(webhook)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Eventos</CardTitle>
              <CardDescription>
                Monitore execuções de webhooks e seu status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativa</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.event_type}</div>
                      </TableCell>
                      <TableCell>
                        {webhooks.find(w => w.id === event.webhook_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(event.status)}
                      </TableCell>
                      <TableCell>
                        {event.attempt_number}
                      </TableCell>
                      <TableCell>
                        {event.duration_ms ? `${event.duration_ms}ms` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {new Date(event.triggered_at).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetryEvent(event.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="event-types">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Eventos</CardTitle>
              <CardDescription>
                Eventos disponíveis para configuração em webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventTypes.map((eventType) => (
                    <TableRow key={eventType.id}>
                      <TableCell className="font-medium">
                        {eventType.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {eventType.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {eventType.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={eventType.is_active ? 'default' : 'secondary'}>
                          {eventType.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Webhook</DialogTitle>
            <DialogDescription>
              Atualize as configurações do webhook
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nome do webhook"
                />
              </div>
              <div>
                <Label htmlFor="edit-method">Método HTTP</Label>
                <Select value={formData.method} onValueChange={(value) => setFormData({...formData, method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://exemplo.com/webhook"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição opcional"
              />
            </div>

            <div>
              <Label>Eventos</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {eventTypes.map((eventType) => (
                  <label key={eventType.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(eventType.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, events: [...formData.events, eventType.name]})
                        } else {
                          setFormData({...formData, events: formData.events.filter(e => e !== eventType.name)})
                        }
                      }}
                    />
                    <span className="text-sm">{eventType.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-retry">Tentativas</Label>
                <Input
                  id="edit-retry"
                  type="number"
                  value={formData.retry_attempts}
                  onChange={(e) => setFormData({...formData, retry_attempts: parseInt(e.target.value)})}
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <Label htmlFor="edit-delay">Delay (seg)</Label>
                <Input
                  id="edit-delay"
                  type="number"
                  value={formData.retry_delay_seconds}
                  onChange={(e) => setFormData({...formData, retry_delay_seconds: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="edit-timeout">Timeout (seg)</Label>
                <Input
                  id="edit-timeout"
                  type="number"
                  value={formData.timeout_seconds}
                  onChange={(e) => setFormData({...formData, timeout_seconds: parseInt(e.target.value)})}
                  min="1"
                  max="300"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-secret">Secret Token (opcional)</Label>
              <Input
                id="edit-secret"
                value={formData.secret_token}
                onChange={(e) => setFormData({...formData, secret_token: e.target.value})}
                placeholder="Token para assinatura HMAC"
              />
            </div>

            <div>
              <Label htmlFor="edit-headers">Headers (JSON)</Label>
              <Textarea
                id="edit-headers"
                value={formData.headers}
                onChange={(e) => setFormData({...formData, headers: e.target.value})}
                placeholder='{"Authorization": "Bearer token"}'
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-filters">Filtros (JSON)</Label>
              <Textarea
                id="edit-filters"
                value={formData.filters}
                onChange={(e) => setFormData({...formData, filters: e.target.value})}
                placeholder='{"status": "active"}'
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateWebhook}>
              Atualizar Webhook
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}