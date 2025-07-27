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
  Switch
} from '@/components/ui/switch'
import {
  Plus,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Slack,
  Hash,
  Users,
  MessageSquare,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Bell,
  Zap
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SlackWorkspace {
  id: string
  agency_id: string
  team_id: string
  team_name: string
  is_active: boolean
  auto_create_channels: boolean
  default_channel: string
  bot_user_id?: string
  installed_at: string
  last_used_at?: string
  slack_channels?: SlackChannel[]
}

interface SlackChannel {
  id: string
  workspace_id: string
  channel_id: string
  channel_name: string
  purpose?: string
  is_private: boolean
  is_archived: boolean
  notification_types: string[]
  message_format: 'simple' | 'rich' | 'blocks'
  filters: Record<string, any>
  total_messages: number
  last_message_at?: string
}

interface SlackTemplate {
  id: string
  agency_id?: string
  name: string
  description?: string
  event_type: string
  message_format: 'simple' | 'rich' | 'blocks'
  template_text?: string
  template_blocks?: any
  is_system_template: boolean
  is_active: boolean
  usage_count: number
}

interface SlackNotification {
  id: string
  event_type: string
  status: 'pending' | 'sent' | 'failed' | 'retrying'
  message_text: string
  sent_at?: string
  duration_ms?: number
  error_message?: string
  slack_channels: {
    channel_name: string
    slack_workspaces: {
      team_name: string
    }
  }
}

interface SlackStats {
  total_workspaces: number
  active_workspaces: number
  total_channels: number
  total_notifications: number
  successful_notifications: number
  failed_notifications: number
  success_rate: number
  notifications_last_24h: number
}

const EVENT_TYPES = [
  { value: 'project.created', label: 'Projeto Criado', category: 'Projeto' },
  { value: 'project.updated', label: 'Projeto Atualizado', category: 'Projeto' },
  { value: 'project.completed', label: 'Projeto Concluído', category: 'Projeto' },
  { value: 'task.created', label: 'Tarefa Criada', category: 'Tarefa' },
  { value: 'task.completed', label: 'Tarefa Concluída', category: 'Tarefa' },
  { value: 'client.created', label: 'Cliente Criado', category: 'Cliente' },
  { value: 'user.created', label: 'Usuário Criado', category: 'Usuário' },
  { value: 'system.alert_triggered', label: 'Alerta do Sistema', category: 'Sistema' },
  { value: 'system.backup_completed', label: 'Backup Concluído', category: 'Sistema' },
  { value: 'payment.received', label: 'Pagamento Recebido', category: 'Pagamento' },
  { value: 'payment.failed', label: 'Pagamento Falhou', category: 'Pagamento' },
]

export default function SlackDashboard() {
  const user = useUser()
  const [workspaces, setWorkspaces] = useState<SlackWorkspace[]>([])
  const [templates, setTemplates] = useState<SlackTemplate[]>([])
  const [notifications, setNotifications] = useState<SlackNotification[]>([])
  const [stats, setStats] = useState<SlackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWorkspace, setSelectedWorkspace] = useState<SlackWorkspace | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<SlackChannel | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    event_type: '',
    message_format: 'blocks' as 'simple' | 'rich' | 'blocks',
    template_text: '',
    template_blocks: ''
  })

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      await Promise.all([
        loadWorkspaces(),
        loadTemplates(),
        loadNotifications(),
        loadStats()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadWorkspaces = async () => {
    try {
      // TODO: Obter agency_id do contexto do usuário
      const agencyId = 'current-agency-id'
      const response = await fetch(`/api/slack/workspaces?agency_id=${agencyId}`)
      const data = await response.json()
      if (data.success) {
        setWorkspaces(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const agencyId = 'current-agency-id'
      const response = await fetch(`/api/slack/templates?agency_id=${agencyId}&include_system=true`)
      const data = await response.json()
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/slack/notifications?limit=50')
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const loadStats = async () => {
    try {
      const agencyId = 'current-agency-id'
      const response = await fetch(`/api/slack/stats?agency_id=${agencyId}`)
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleConnectSlack = () => {
    const agencyId = 'current-agency-id'
    window.location.href = `/api/slack/oauth?agency_id=${agencyId}`
  }

  const handleSyncChannels = async (workspaceId: string) => {
    try {
      const response = await fetch('/api/slack/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          action: 'sync_channels'
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Canais sincronizados com sucesso!')
        loadWorkspaces()
      } else {
        toast.error(data.error || 'Erro ao sincronizar canais')
      }
    } catch (error) {
      toast.error('Erro ao sincronizar canais')
      console.error(error)
    }
  }

  const handleToggleWorkspace = async (workspace: SlackWorkspace) => {
    try {
      const response = await fetch(`/api/slack/workspaces/${workspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !workspace.is_active
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Workspace ${workspace.is_active ? 'desativado' : 'ativado'} com sucesso!`)
        loadWorkspaces()
      } else {
        toast.error(data.error || 'Erro ao alterar status do workspace')
      }
    } catch (error) {
      toast.error('Erro ao alterar status do workspace')
      console.error(error)
    }
  }

  const handleUpdateChannelConfig = async (
    channelId: string,
    updates: Partial<SlackChannel>
  ) => {
    try {
      const response = await fetch('/api/slack/channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          ...updates
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Configurações do canal atualizadas!')
        loadWorkspaces()
      } else {
        toast.error(data.error || 'Erro ao atualizar canal')
      }
    } catch (error) {
      toast.error('Erro ao atualizar canal')
      console.error(error)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      let templateBlocks = null
      if (templateForm.message_format === 'blocks' && templateForm.template_blocks) {
        try {
          templateBlocks = JSON.parse(templateForm.template_blocks)
        } catch {
          toast.error('JSON de blocos inválido')
          return
        }
      }

      const response = await fetch('/api/slack/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: 'current-agency-id',
          name: templateForm.name,
          description: templateForm.description,
          event_type: templateForm.event_type,
          message_format: templateForm.message_format,
          template_text: templateForm.template_text,
          template_blocks: templateBlocks,
          created_by: user?.id
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Template criado com sucesso!')
        setShowTemplateDialog(false)
        resetTemplateForm()
        loadTemplates()
      } else {
        toast.error(data.error || 'Erro ao criar template')
      }
    } catch (error) {
      toast.error('Erro ao criar template')
      console.error(error)
    }
  }

  const handleTestNotification = async () => {
    if (!selectedWorkspace || !selectedChannel) return

    try {
      const response = await fetch('/api/slack/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: selectedWorkspace.id,
          channel_id: selectedChannel.id,
          event_type: 'system.test',
          event_data: {
            message: 'Esta é uma mensagem de teste do FVStudios Dashboard',
            timestamp: new Date().toISOString(),
            user: {
              name: user?.user_metadata?.name || 'Usuário Teste'
            }
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Mensagem de teste enviada!')
        setShowTestDialog(false)
        loadNotifications()
      } else {
        toast.error(data.error || 'Erro ao enviar mensagem de teste')
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem de teste')
      console.error(error)
    }
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      event_type: '',
      message_format: 'blocks',
      template_text: '',
      template_blocks: ''
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'retrying':
        return <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === 'sent' ? 'success' : 
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Slack className="h-8 w-8 text-[#4A154B]" />
            Integração Slack
          </h1>
          <p className="text-muted-foreground">
            Configure notificações automáticas para seus canais Slack
          </p>
        </div>
        {workspaces.length === 0 ? (
          <Button onClick={handleConnectSlack} className="bg-[#4A154B] hover:bg-[#611f69]">
            <Slack className="h-4 w-4 mr-2" />
            Conectar Slack
          </Button>
        ) : (
          <Button onClick={handleConnectSlack} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Workspace
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
              <Slack className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_workspaces}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_workspaces} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canais</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_channels}</div>
              <p className="text-xs text-muted-foreground">
                Configurados
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
                {stats.successful_notifications} sucessos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notifications_last_24h}</div>
              <p className="text-xs text-muted-foreground">
                Notificações enviadas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="workspaces" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="notifications">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces">
          <div className="space-y-4">
            {workspaces.map((workspace) => (
              <Card key={workspace.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Slack className="h-6 w-6 text-[#4A154B]" />
                      <div>
                        <CardTitle className="text-lg">{workspace.team_name}</CardTitle>
                        <CardDescription>
                          {workspace.slack_channels?.length || 0} canais configurados
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={workspace.is_active ? 'default' : 'secondary'}>
                        {workspace.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncChannels(workspace.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleWorkspace(workspace)}
                      >
                        {workspace.is_active ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {workspace.slack_channels && workspace.slack_channels.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Canais Configurados</h4>
                      <div className="grid gap-3">
                        {workspace.slack_channels.map((channel) => (
                          <div
                            key={channel.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {channel.channel_name}
                                  {channel.is_private && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      Privado
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {channel.notification_types.length} tipos de eventos
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                value={channel.message_format}
                                onValueChange={(value) => 
                                  handleUpdateChannelConfig(channel.id, { 
                                    message_format: value as any 
                                  })
                                }
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="simple">Simples</SelectItem>
                                  <SelectItem value="rich">Rico</SelectItem>
                                  <SelectItem value="blocks">Blocos</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedWorkspace(workspace)
                                  setSelectedChannel(channel)
                                  setShowTestDialog(true)
                                }}
                              >
                                <Zap className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum canal configurado</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => handleSyncChannels(workspace.id)}
                      >
                        Sincronizar Canais
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {workspaces.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Slack className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nenhum workspace conectado</h3>
                  <p className="text-muted-foreground mb-4">
                    Conecte seu Slack para receber notificações automáticas
                  </p>
                  <Button onClick={handleConnectSlack} className="bg-[#4A154B] hover:bg-[#611f69]">
                    <Slack className="h-4 w-4 mr-2" />
                    Conectar Slack
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Templates de Mensagem</CardTitle>
                  <CardDescription>
                    Gerencie templates personalizados para diferentes tipos de eventos
                  </CardDescription>
                </div>
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Criar Template</DialogTitle>
                      <DialogDescription>
                        Crie um template personalizado para eventos Slack
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                            placeholder="Nome do template"
                          />
                        </div>
                        <div>
                          <Label htmlFor="event_type">Tipo de Evento</Label>
                          <Select 
                            value={templateForm.event_type} 
                            onValueChange={(value) => setTemplateForm({...templateForm, event_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o evento" />
                            </SelectTrigger>
                            <SelectContent>
                              {EVENT_TYPES.map((event) => (
                                <SelectItem key={event.value} value={event.value}>
                                  {event.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                          id="description"
                          value={templateForm.description}
                          onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                          placeholder="Descrição opcional"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="message_format">Formato da Mensagem</Label>
                        <Select 
                          value={templateForm.message_format} 
                          onValueChange={(value) => setTemplateForm({...templateForm, message_format: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">Simples (apenas texto)</SelectItem>
                            <SelectItem value="rich">Rico (texto formatado)</SelectItem>
                            <SelectItem value="blocks">Blocos (Slack Block Kit)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="template_text">Texto do Template</Label>
                        <Textarea
                          id="template_text"
                          value={templateForm.template_text}
                          onChange={(e) => setTemplateForm({...templateForm, template_text: e.target.value})}
                          placeholder="Use {{variavel}} para interpolação dinâmica"
                          rows={4}
                        />
                      </div>

                      {templateForm.message_format === 'blocks' && (
                        <div>
                          <Label htmlFor="template_blocks">Blocos JSON (Block Kit)</Label>
                          <Textarea
                            id="template_blocks"
                            value={templateForm.template_blocks}
                            onChange={(e) => setTemplateForm({...templateForm, template_blocks: e.target.value})}
                            placeholder='{"blocks": [...]} - Use {{variavel}} para interpolação'
                            rows={6}
                            className="font-mono text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateTemplate}>
                        Criar Template
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.description && (
                            <div className="text-xs text-muted-foreground">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {EVENT_TYPES.find(e => e.value === template.event_type)?.label || template.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          template.message_format === 'blocks' ? 'default' :
                          template.message_format === 'rich' ? 'secondary' : 'outline'
                        }>
                          {template.message_format}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_system_template ? 'secondary' : 'default'}>
                          {template.is_system_template ? 'Sistema' : 'Customizado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.usage_count}
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Notificações</CardTitle>
              <CardDescription>
                Monitore o envio de notificações para o Slack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {EVENT_TYPES.find(e => e.value === notification.event_type)?.label || notification.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Hash className="h-3 w-3" />
                          <span className="text-sm">
                            {notification.slack_channels.channel_name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notification.slack_channels.slack_workspaces.team_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(notification.status)}
                      </TableCell>
                      <TableCell>
                        {notification.duration_ms ? `${notification.duration_ms}ms` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {notification.sent_at ? 
                            new Date(notification.sent_at).toLocaleString('pt-BR') :
                            'Pendente'
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testar Notificação</DialogTitle>
            <DialogDescription>
              Enviar uma mensagem de teste para o canal selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedWorkspace && selectedChannel && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Workspace:</strong> {selectedWorkspace.team_name}
                </p>
                <p className="text-sm">
                  <strong>Canal:</strong> #{selectedChannel.channel_name}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleTestNotification}>
                  <Zap className="h-4 w-4 mr-2" />
                  Enviar Teste
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}