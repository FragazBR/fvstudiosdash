'use client'

// ==================================================
// FVStudios Dashboard - Real-time Notifications System
// Sistema de notificações em tempo real via WebSocket
// ==================================================

import { supabaseBrowser } from './supabaseBrowser'
import { toast } from 'sonner'

export interface RealtimeNotification {
  id: string
  type: 'project_update' | 'task_completed' | 'payment_received' | 'client_message' | 'system_alert' | 'whatsapp_status' | 'ai_credits_low'
  title: string
  message: string
  data?: Record<string, any>
  user_id?: string
  agency_id: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read: boolean
  created_at: string
  expires_at?: string
  action_url?: string
  action_label?: string
}

export interface NotificationSubscription {
  user_id: string
  agency_id: string
  notification_types: string[]
  channels: ('browser' | 'email' | 'whatsapp')[]
  active: boolean
}

class RealtimeNotificationManager {
  private supabase = supabaseBrowser()
  private subscriptions = new Map<string, any>()
  private notificationQueue: RealtimeNotification[] = []
  private isOnline = true
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  // Configurações de notificação
  private notificationSettings = {
    showToast: true,
    playSound: true,
    showDesktop: true,
    autoHide: true,
    hideDelay: 5000,
    maxNotifications: 50
  }

  constructor() {
    this.initializeOnlineStatus()
    this.initializeBrowserNotifications()
  }

  // Inicializar status online/offline
  private initializeOnlineStatus() {
    this.isOnline = navigator.onLine
    
    window.addEventListener('online', () => {
      this.isOnline = true
      this.reconnectAttempts = 0
      this.processQueuedNotifications()
      console.log('🟢 Reconectado - processando notificações em fila')
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('🔴 Offline - notificações serão enfileiradas')
    })
  }

  // Inicializar notificações do browser
  private async initializeBrowserNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      console.log('Permissão de notificação:', permission)
    }
  }

  // Inscrever-se em notificações em tempo real
  async subscribeToNotifications(userId: string, agencyId: string, options?: {
    types?: string[]
    onNotification?: (notification: RealtimeNotification) => void
    onError?: (error: any) => void
  }) {
    const subscriptionKey = `${userId}_${agencyId}`

    try {
      // Cancelar inscrição anterior se existir
      if (this.subscriptions.has(subscriptionKey)) {
        this.unsubscribeFromNotifications(userId, agencyId)
      }

      // Inscrever-se na tabela de notificações
      const channel = this.supabase
        .channel(`notifications:${subscriptionKey}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'realtime_notifications',
            filter: `agency_id=eq.${agencyId}`
          },
          (payload) => {
            const notification = payload.new as RealtimeNotification
            this.handleIncomingNotification(notification, options?.onNotification)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'realtime_notifications',
            filter: `agency_id=eq.${agencyId}`
          },
          (payload) => {
            const notification = payload.new as RealtimeNotification
            this.handleNotificationUpdate(notification)
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${subscriptionKey}:`, status)
          
          if (status === 'SUBSCRIBED') {
            this.reconnectAttempts = 0
            console.log('✅ Inscrito em notificações em tempo real')
          } else if (status === 'CHANNEL_ERROR') {
            this.handleSubscriptionError(subscriptionKey, options?.onError)
          }
        })

      this.subscriptions.set(subscriptionKey, channel)

      // Carregar notificações não lidas
      await this.loadUnreadNotifications(userId, agencyId)

      return true
    } catch (error) {
      console.error('Erro ao inscrever-se em notificações:', error)
      options?.onError?.(error)
      return false
    }
  }

  // Cancelar inscrição de notificações
  unsubscribeFromNotifications(userId: string, agencyId: string) {
    const subscriptionKey = `${userId}_${agencyId}`
    const subscription = this.subscriptions.get(subscriptionKey)
    
    if (subscription) {
      this.supabase.removeChannel(subscription)
      this.subscriptions.delete(subscriptionKey)
      console.log(`🔕 Desinscrito de notificações: ${subscriptionKey}`)
    }
  }

  // Processar notificação recebida
  private handleIncomingNotification(
    notification: RealtimeNotification,
    onNotification?: (notification: RealtimeNotification) => void
  ) {
    console.log('📩 Nova notificação:', notification)

    if (!this.isOnline) {
      this.notificationQueue.push(notification)
      return
    }

    // Callback customizado
    onNotification?.(notification)

    // Mostrar toast
    if (this.notificationSettings.showToast) {
      this.showToastNotification(notification)
    }

    // Mostrar notificação do browser
    if (this.notificationSettings.showDesktop) {
      this.showDesktopNotification(notification)
    }

    // Tocar som
    if (this.notificationSettings.playSound) {
      this.playNotificationSound(notification.priority)
    }

    // Disparar evento customizado
    window.dispatchEvent(new CustomEvent('fvstudios:notification', {
      detail: notification
    }))
  }

  // Processar atualização de notificação
  private handleNotificationUpdate(notification: RealtimeNotification) {
    console.log('🔄 Notificação atualizada:', notification)
    
    window.dispatchEvent(new CustomEvent('fvstudios:notification-updated', {
      detail: notification
    }))
  }

  // Lidar com erro de inscrição
  private handleSubscriptionError(subscriptionKey: string, onError?: (error: any) => void) {
    console.error('❌ Erro na inscrição:', subscriptionKey)
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      setTimeout(() => {
        console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
        // A reconexão seria implementada aqui
      }, delay)
    } else {
      console.error('❌ Máximo de tentativas de reconexão atingido')
      onError?.(new Error('Falha na conexão de notificações em tempo real'))
    }
  }

  // Carregar notificações não lidas
  private async loadUnreadNotifications(userId: string, agencyId: string) {
    try {
      const { data, error } = await this.supabase
        .from('realtime_notifications')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('read', false)
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      console.log(`📬 ${data?.length || 0} notificações não lidas carregadas`)
      
      // Disparar evento com notificações não lidas
      window.dispatchEvent(new CustomEvent('fvstudios:unread-notifications', {
        detail: { notifications: data || [], count: data?.length || 0 }
      }))

    } catch (error) {
      console.error('Erro ao carregar notificações não lidas:', error)
    }
  }

  // Processar fila de notificações offline
  private processQueuedNotifications() {
    if (this.notificationQueue.length === 0) return

    console.log(`📤 Processando ${this.notificationQueue.length} notificações em fila`)
    
    this.notificationQueue.forEach(notification => {
      this.handleIncomingNotification(notification)
    })

    this.notificationQueue = []
  }

  // Mostrar toast notification
  private showToastNotification(notification: RealtimeNotification) {
    const toastOptions: any = {
      description: notification.message,
      duration: this.notificationSettings.autoHide ? this.notificationSettings.hideDelay : Infinity
    }

    if (notification.action_url && notification.action_label) {
      toastOptions.action = {
        label: notification.action_label,
        onClick: () => window.open(notification.action_url, '_blank')
      }
    }

    switch (notification.priority) {
      case 'urgent':
        toast.error(notification.title, toastOptions)
        break
      case 'high':
        toast.warning(notification.title, toastOptions)
        break
      case 'medium':
        toast.info(notification.title, toastOptions)
        break
      default:
        toast.success(notification.title, toastOptions)
    }
  }

  // Mostrar notificação do desktop
  private showDesktopNotification(notification: RealtimeNotification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/logo-c.png',
      badge: '/logo-c.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      silent: false
    }

    const desktopNotification = new Notification(notification.title, options)

    desktopNotification.onclick = () => {
      window.focus()
      if (notification.action_url) {
        window.open(notification.action_url, '_blank')
      }
      desktopNotification.close()
    }

    // Auto fechar após delay
    if (this.notificationSettings.autoHide && notification.priority !== 'urgent') {
      setTimeout(() => {
        desktopNotification.close()
      }, this.notificationSettings.hideDelay)
    }
  }

  // Tocar som de notificação
  private playNotificationSound(priority: string) {
    try {
      const audio = new Audio()
      
      switch (priority) {
        case 'urgent':
          audio.src = '/sounds/urgent-notification.mp3'
          break
        case 'high':
          audio.src = '/sounds/high-notification.mp3'
          break
        default:
          audio.src = '/sounds/default-notification.mp3'
      }

      audio.volume = 0.3
      audio.play().catch(console.warn) // Ignorar erros de autoplay
    } catch (error) {
      console.warn('Erro ao tocar som de notificação:', error)
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string) {
    try {
      const { error } = await this.supabase
        .from('realtime_notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)

      if (error) throw error

      console.log(`✅ Notificação marcada como lida: ${notificationId}`)
      return true
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      return false
    }
  }

  // Marcar todas como lidas
  async markAllAsRead(userId: string, agencyId: string) {
    try {
      const { error } = await this.supabase
        .from('realtime_notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('agency_id', agencyId)
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .eq('read', false)

      if (error) throw error

      console.log('✅ Todas as notificações marcadas como lidas')
      return true
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      return false
    }
  }

  // Enviar notificação (para admins/sistema)
  async sendNotification(notification: Omit<RealtimeNotification, 'id' | 'created_at' | 'read'>) {
    try {
      const { data, error } = await this.supabase
        .from('realtime_notifications')
        .insert({
          ...notification,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      console.log('📤 Notificação enviada:', data)
      return data
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      return null
    }
  }

  // Configurar preferências de notificação
  updateSettings(newSettings: Partial<typeof this.notificationSettings>) {
    this.notificationSettings = { ...this.notificationSettings, ...newSettings }
    localStorage.setItem('fvstudios_notification_settings', JSON.stringify(this.notificationSettings))
    console.log('⚙️ Configurações de notificação atualizadas:', this.notificationSettings)
  }

  // Carregar configurações salvas
  loadSettings() {
    try {
      const saved = localStorage.getItem('fvstudios_notification_settings')
      if (saved) {
        this.notificationSettings = { ...this.notificationSettings, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações de notificação:', error)
    }
  }

  // Obter estatísticas de notificações
  async getNotificationStats(agencyId: string, period = 7) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - period)

      const { data, error } = await this.supabase
        .from('realtime_notifications')
        .select('type, priority, read, created_at')
        .eq('agency_id', agencyId)
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        unread: data?.filter(n => !n.read).length || 0,
        by_type: {} as Record<string, number>,
        by_priority: {} as Record<string, number>,
        read_rate: 0
      }

      data?.forEach(notification => {
        stats.by_type[notification.type] = (stats.by_type[notification.type] || 0) + 1
        stats.by_priority[notification.priority] = (stats.by_priority[notification.priority] || 0) + 1
      })

      if (stats.total > 0) {
        stats.read_rate = Math.round(((stats.total - stats.unread) / stats.total) * 100)
      }

      return stats
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return null
    }
  }

  // Limpar notificações antigas
  async cleanupOldNotifications(agencyId: string, olderThanDays = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const { error } = await this.supabase
        .from('realtime_notifications')
        .delete()
        .eq('agency_id', agencyId)
        .lt('created_at', cutoffDate.toISOString())
        .eq('read', true)

      if (error) throw error

      console.log(`🧹 Notificações antigas limpas (>${olderThanDays} dias)`)
      return true
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error)
      return false
    }
  }

  // Destruir manager (cleanup)
  destroy() {
    // Cancelar todas as inscrições
    this.subscriptions.forEach((_, key) => {
      const [userId, agencyId] = key.split('_')
      this.unsubscribeFromNotifications(userId, agencyId)
    })

    // Limpar fila
    this.notificationQueue = []

    console.log('💀 RealtimeNotificationManager destruído')
  }
}

// Instância global
export const realtimeNotifications = new RealtimeNotificationManager()

// Hook React para notificações em tempo real
export function useRealtimeNotifications(userId?: string, agencyId?: string) {
  return {
    subscribe: (options?: Parameters<typeof realtimeNotifications.subscribeToNotifications>[2]) => 
      userId && agencyId ? realtimeNotifications.subscribeToNotifications(userId, agencyId, options) : Promise.resolve(false),
    unsubscribe: () => 
      userId && agencyId ? realtimeNotifications.unsubscribeFromNotifications(userId, agencyId) : undefined,
    markAsRead: realtimeNotifications.markAsRead.bind(realtimeNotifications),
    markAllAsRead: () => 
      userId && agencyId ? realtimeNotifications.markAllAsRead(userId, agencyId) : Promise.resolve(false),
    sendNotification: realtimeNotifications.sendNotification.bind(realtimeNotifications),
    updateSettings: realtimeNotifications.updateSettings.bind(realtimeNotifications),
    getStats: (period?: number) => 
      agencyId ? realtimeNotifications.getNotificationStats(agencyId, period) : Promise.resolve(null)
  }
}