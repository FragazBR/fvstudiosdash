'use client'

// ==================================================
// FVStudios Dashboard - Sistema de Notificações em Tempo Real
// Notificações inteligentes com WebSocket e toast moderno
// ==================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, Clock, User, Calendar, Zap, Settings, Filter, Search, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabaseBrowser } from '@/lib/supabaseBrowser'
import { useUser } from '@/hooks/useUser'

// Interfaces
interface Notification {
  id: string
  project_id: string
  user_id: string
  notification_type: 'stage_started' | 'stage_completed' | 'deadline_approaching' | 'overdue' | 'assigned' | 'comment' | 'file_uploaded' | 'status_changed'
  title: string
  message: string
  is_read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  metadata: {
    project_name?: string
    stage_name?: string
    assignee_name?: string
    due_date?: string
    [key: string]: any
  }
  created_at: string
  read_at?: string
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  slack_notifications: boolean
  notification_types: {
    stage_updates: boolean
    deadlines: boolean
    assignments: boolean
    comments: boolean
    status_changes: boolean
  }
  quiet_hours: {
    enabled: boolean
    start_time: string
    end_time: string
  }
}

// ==================================================
// HOOKS CUSTOMIZADOS
// ==================================================

// Hook para gerenciar notificações em tempo real
function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const supabase = supabaseBrowser()

  // Carregar notificações iniciais
  const loadNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  // Configurar listener em tempo real
  useEffect(() => {
    loadNotifications()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev.slice(0, 49)])
            setUnreadCount(prev => prev + 1)
            
            // Mostrar toast para notificações importantes
            if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
              showNotificationToast(newNotification)
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
            
            // Atualizar contador se foi marcada como lida
            if (updatedNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, loadNotifications])

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }, [supabase])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }, [userId, supabase])

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }, [supabase])

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: loadNotifications
  }
}

// ==================================================
// FUNÇÕES AUXILIARES
// ==================================================

function showNotificationToast(notification: Notification) {
  const config = getNotificationConfig(notification.notification_type)
  
  toast(notification.title, {
    description: notification.message,
    icon: config.icon,
    duration: notification.priority === 'urgent' ? 10000 : 5000,
    action: {
      label: 'Ver',
      onClick: () => {
        // Navegar para projeto ou abrir detalhes
        if (notification.project_id) {
          window.location.href = `/projects/${notification.project_id}`
        }
      }
    }
  })
}

function getNotificationConfig(type: string) {
  const configs = {
    stage_started: {
      icon: <Clock className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      label: 'Etapa Iniciada'
    },
    stage_completed: {
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Etapa Concluída'
    },
    deadline_approaching: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      label: 'Prazo Próximo'
    },
    overdue: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Atrasado'
    },
    assigned: {
      icon: <User className="h-4 w-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      label: 'Atribuído'
    },
    comment: {
      icon: <Info className="h-4 w-4" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      label: 'Comentário'
    },
    file_uploaded: {
      icon: <Info className="h-4 w-4" />,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      label: 'Arquivo'
    },
    status_changed: {
      icon: <Zap className="h-4 w-4" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      label: 'Status Alterado'
    }
  }

  return configs[type as keyof typeof configs] || configs.comment
}

// ==================================================
// COMPONENTES
// ==================================================

// Componente da Notificação Individual
function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification
  onMarkAsRead: () => void
  onDelete: () => void 
}) {
  const config = getNotificationConfig(notification.notification_type)
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
    addSuffix: true, 
    locale: ptBR 
  })

  const priorityColors = {
    low: 'border-l-gray-400',
    medium: 'border-l-blue-400',
    high: 'border-l-orange-400',
    urgent: 'border-l-red-400'
  }

  return (
    <Card className={`
      transition-all duration-200 hover:shadow-md cursor-pointer
      border-l-4 ${priorityColors[notification.priority]}
      ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
    `}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-full ${config.bgColor} flex-shrink-0`}>
            <div className={config.color}>
              {config.icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'} dark:text-gray-100 line-clamp-1`}>
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkAsRead()
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {config.label}
                </Badge>
                {notification.metadata.project_name && (
                  <span>{notification.metadata.project_name}</span>
                )}
              </div>
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Unread Indicator */}
          {!notification.is_read && (
            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Popup de Notificações
function NotificationsPopup({ 
  notifications, 
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete 
}: {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
}) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [search, setSearch] = useState('')

  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.is_read)
    }

    if (search) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase()) ||
        n.metadata.project_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    return filtered
  }, [notifications, filter, search])

  return (
    <div className="w-96 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-blue-600 hover:text-blue-700"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar notificações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-8"
            />
          </div>

          <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all" className="text-xs">
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Não lidas ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {search ? 'Nenhuma notificação encontrada' : 'Nenhuma notificação'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div key={notification.id} className="group">
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={() => onMarkAsRead(notification.id)}
                  onDelete={() => onDelete(notification.id)}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50 dark:bg-gray-800">
        <Button variant="ghost" size="sm" className="w-full text-xs">
          Ver todas as notificações
        </Button>
      </div>
    </div>
  )
}

// Configurações de Notificação
function NotificationSettings({ 
  settings, 
  onSave 
}: { 
  settings: NotificationSettings
  onSave: (settings: NotificationSettings) => void 
}) {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSave = () => {
    onSave(localSettings)
    toast.success('Configurações salvas com sucesso!')
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configurações de Notificação</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Personalize como e quando você recebe notificações
        </p>
      </div>

      {/* Canais de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canais de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações por Email</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receber resumos diários por email
              </p>
            </div>
            <Switch
              checked={localSettings.email_notifications}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({ ...prev, email_notifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações Push</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Alertas instantâneos no navegador
              </p>
            </div>
            <Switch
              checked={localSettings.push_notifications}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({ ...prev, push_notifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Slack</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Notificar no canal do Slack
              </p>
            </div>
            <Switch
              checked={localSettings.slack_notifications}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({ ...prev, slack_notifications: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipos de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Atualizações de Etapas</Label>
            <Switch
              checked={localSettings.notification_types.stage_updates}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({
                  ...prev,
                  notification_types: { ...prev.notification_types, stage_updates: checked }
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Prazos e Deadlines</Label>
            <Switch
              checked={localSettings.notification_types.deadlines}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({
                  ...prev,
                  notification_types: { ...prev.notification_types, deadlines: checked }
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Atribuições de Tarefas</Label>
            <Switch
              checked={localSettings.notification_types.assignments}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({
                  ...prev,
                  notification_types: { ...prev.notification_types, assignments: checked }
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Comentários</Label>
            <Switch
              checked={localSettings.notification_types.comments}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({
                  ...prev,
                  notification_types: { ...prev.notification_types, comments: checked }
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Mudanças de Status</Label>
            <Switch
              checked={localSettings.notification_types.status_changes}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({
                  ...prev,
                  notification_types: { ...prev.notification_types, status_changes: checked }
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Horário Silencioso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horário Silencioso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar Horário Silencioso</Label>
            <Switch
              checked={localSettings.quiet_hours.enabled}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({
                  ...prev,
                  quiet_hours: { ...prev.quiet_hours, enabled: checked }
                }))
              }
            />
          </div>

          {localSettings.quiet_hours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início</Label>
                <Input
                  type="time"
                  value={localSettings.quiet_hours.start_time}
                  onChange={(e) => 
                    setLocalSettings(prev => ({
                      ...prev,
                      quiet_hours: { ...prev.quiet_hours, start_time: e.target.value }
                    }))
                  }
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={localSettings.quiet_hours.end_time}
                  onChange={(e) => 
                    setLocalSettings(prev => ({
                      ...prev,
                      quiet_hours: { ...prev.quiet_hours, end_time: e.target.value }
                    }))
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export function RealtimeNotifications() {
  const { user } = useUser()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    slack_notifications: false,
    notification_types: {
      stage_updates: true,
      deadlines: true,
      assignments: true,
      comments: true,
      status_changes: true
    },
    quiet_hours: {
      enabled: false,
      start_time: '22:00',
      end_time: '08:00'
    }
  })

  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useRealtimeNotifications(user?.id || '')

  if (!user) return null

  return (
    <>
      {/* Bell Icon with Badge */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="p-0">
          <NotificationsPopup
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDelete={deleteNotification}
          />
        </PopoverContent>
      </Popover>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurações de Notificação</DialogTitle>
          </DialogHeader>
          <NotificationSettings
            settings={settings}
            onSave={(newSettings) => {
              setSettings(newSettings)
              setShowSettingsModal(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

// Hook para usar notificações em outros componentes
export function useNotifications() {
  const { user } = useUser()
  
  const sendNotification = useCallback(async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'read_at'>) => {
    if (!user) return

    try {
      const supabase = supabaseBrowser()
      const { error } = await supabase
        .from('notifications')
        .insert(notification)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }, [user])

  return { sendNotification }
}