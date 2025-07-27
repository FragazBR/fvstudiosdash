'use client'

// ==================================================
// FVStudios Dashboard - Realtime Notification Center
// Centro de notificações em tempo real
// ==================================================

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Settings,
  Filter,
  Search,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  MessageSquare,
  CreditCard,
  User,
  FileText,
  Calendar,
  Volume2,
  VolumeX,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'
import { useRealtimeNotifications, type RealtimeNotification } from '@/lib/realtime-notifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NotificationCenterProps {
  className?: string
}

export function RealtimeNotificationCenter({ className }: NotificationCenterProps) {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState({
    showToast: true,
    playSound: true,
    showDesktop: true,
    autoHide: true,
    hideDelay: 5000
  })

  const {
    subscribe,
    unsubscribe,
    markAsRead,
    markAllAsRead,
    updateSettings,
    getStats
  } = useRealtimeNotifications(user?.id, user?.agency_id)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!user?.id || !user?.agency_id) return

    const initializeNotifications = async () => {
      setLoading(true)
      
      // Carregar configurações salvas
      const savedSettings = localStorage.getItem('fvstudios_notification_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        updateSettings(parsed)
      }

      // Inscrever-se em notificações
      await subscribe({
        onNotification: handleNewNotification,
        onError: (error) => {
          console.error('Erro na inscrição de notificações:', error)
          toast.error('Erro na conexão de notificações em tempo real')
        }
      })

      setLoading(false)
    }

    initializeNotifications()

    // Listeners para eventos personalizados
    const handleUnreadNotifications = (event: CustomEvent) => {
      setNotifications(event.detail.notifications)
      setUnreadCount(event.detail.count)
    }

    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail as RealtimeNotification
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    const handleNotificationUpdate = (event: CustomEvent) => {
      const updatedNotification = event.detail as RealtimeNotification
      setNotifications(prev => 
        prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
      )
      if (updatedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }

    window.addEventListener('fvstudios:unread-notifications', handleUnreadNotifications as EventListener)
    window.addEventListener('fvstudios:notification', handleNewNotification as EventListener)
    window.addEventListener('fvstudios:notification-updated', handleNotificationUpdate as EventListener)

    return () => {
      unsubscribe()
      window.removeEventListener('fvstudios:unread-notifications', handleUnreadNotifications as EventListener)
      window.removeEventListener('fvstudios:notification', handleNewNotification as EventListener)
      window.removeEventListener('fvstudios:notification-updated', handleNotificationUpdate as EventListener)
    }
  }, [user?.id, user?.agency_id])

  const handleNewNotification = (notification: RealtimeNotification) => {
    // Atualizar lista local
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Tocar som se habilitado
    if (settings.playSound && audioRef.current) {
      audioRef.current.volume = 0.3
      audioRef.current.play().catch(console.warn)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markAsRead(notificationId)
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead()
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('Todas as notificações foram marcadas como lidas')
    } else {
      toast.error('Erro ao marcar notificações como lidas')
    }
  }

  const handleSettingsChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    updateSettings(newSettings)
    localStorage.setItem('fvstudios_notification_settings', JSON.stringify(newSettings))
  }

  const handleNotificationClick = async (notification: RealtimeNotification) => {
    // Marcar como lida se não foi lida
    if (!notification.read) {
      await handleMarkAsRead(notification.id)
    }

    // Abrir URL de ação se existir
    if (notification.action_url) {
      window.open(notification.action_url, '_blank')
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === notification.type)

    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'urgent' ? 'text-red-500' : 
                     priority === 'high' ? 'text-orange-500' :
                     priority === 'medium' ? 'text-blue-500' : 'text-gray-500'

    switch (type) {
      case 'project_update':
        return <FileText className={`h-4 w-4 ${iconClass}`} />
      case 'task_completed':
        return <CheckCircle className={`h-4 w-4 ${iconClass}`} />
      case 'payment_received':
        return <CreditCard className={`h-4 w-4 ${iconClass}`} />
      case 'client_message':
        return <MessageSquare className={`h-4 w-4 ${iconClass}`} />
      case 'system_alert':
        return <AlertTriangle className={`h-4 w-4 ${iconClass}`} />
      case 'whatsapp_status':
        return <MessageSquare className={`h-4 w-4 ${iconClass}`} />
      case 'ai_credits_low':
        return <Zap className={`h-4 w-4 ${iconClass}`} />
      case 'deadline_approaching':
        return <Clock className={`h-4 w-4 ${iconClass}`} />
      default:
        return <Bell className={`h-4 w-4 ${iconClass}`} />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const notificationTypes = [
    { value: 'all', label: 'Todas', count: notifications.length },
    { value: 'unread', label: 'Não lidas', count: unreadCount },
    { value: 'project_update', label: 'Projetos', count: notifications.filter(n => n.type === 'project_update').length },
    { value: 'task_completed', label: 'Tarefas', count: notifications.filter(n => n.type === 'task_completed').length },
    { value: 'client_message', label: 'Mensagens', count: notifications.filter(n => n.type === 'client_message').length },
    { value: 'system_alert', label: 'Sistema', count: notifications.filter(n => n.type === 'system_alert').length }
  ]

  return (
    <>
      {/* Audio element for notification sounds */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.ogg" type="audio/ogg" />
      </audio>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`relative ${className}`}
          >
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
            <span className="sr-only">
              {unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Notificações</h3>
              
              <div className="flex items-center gap-2">
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configurações de Notificação</DialogTitle>
                      <DialogDescription>
                        Configure como você quer receber as notificações
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Mostrar Toast</Label>
                          <p className="text-sm text-gray-500">Exibir notificações na tela</p>
                        </div>
                        <Switch
                          checked={settings.showToast}
                          onCheckedChange={(checked) => handleSettingsChange('showToast', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Tocar Som</Label>
                          <p className="text-sm text-gray-500">Som ao receber notificação</p>
                        </div>
                        <Switch
                          checked={settings.playSound}
                          onCheckedChange={(checked) => handleSettingsChange('playSound', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Notificação Desktop</Label>
                          <p className="text-sm text-gray-500">Notificação do sistema operacional</p>
                        </div>
                        <Switch
                          checked={settings.showDesktop}
                          onCheckedChange={(checked) => handleSettingsChange('showDesktop', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Ocultar Automaticamente</Label>
                          <p className="text-sm text-gray-500">Fechar toast automaticamente</p>
                        </div>
                        <Switch
                          checked={settings.autoHide}
                          onCheckedChange={(checked) => handleSettingsChange('autoHide', checked)}
                        />
                      </div>
                      
                      {settings.autoHide && (
                        <div>
                          <Label>Tempo para Ocultar (ms)</Label>
                          <Input
                            type="number"
                            value={settings.hideDelay}
                            onChange={(e) => handleSettingsChange('hideDelay', parseInt(e.target.value))}
                            min={1000}
                            max={10000}
                            step={1000}
                          />
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button onClick={() => setShowSettings(false)}>
                        Fechar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Marcar todas
                  </Button>
                )}
              </div>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto">
              {notificationTypes.map(type => (
                <Button
                  key={type.value}
                  variant={filter === type.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(type.value)}
                  className="flex-shrink-0"
                >
                  {type.label}
                  {type.count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {type.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando notificações...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  {searchTerm || filter !== 'all' 
                    ? 'Nenhuma notificação encontrada' 
                    : 'Nenhuma notificação'}
                </p>
                <p className="text-gray-400 text-sm">
                  {searchTerm || filter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Você receberá notificações aqui'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-medium text-sm ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority}
                            </Badge>
                            
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                          
                          {notification.action_url && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <span>{notification.action_label || 'Ver mais'}</span>
                              <ExternalLink className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setIsOpen(false)
                  // Navegar para página completa de notificações
                  window.location.href = '/notifications'
                }}
              >
                Ver todas as notificações
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  )
}