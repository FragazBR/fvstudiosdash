'use client';

// Sistema de PWA e Push Notifications para Mobile
// Integração com Service Worker e Web Push API

export interface PWANotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  timestamp?: number;
}

export interface ServiceWorkerMessage {
  type: string;
  data?: any;
}

export interface SubscriptionInfo {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Classe principal para gerenciar PWA e notificações
export class PWANotificationManager {
  private static instance: PWANotificationManager;
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string;
  private isSupported: boolean = false;
  private installPrompt: any = null;

  private constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    this.checkSupport();
    this.setupInstallPrompt();
  }

  public static getInstance(): PWANotificationManager {
    if (!PWANotificationManager.instance) {
      PWANotificationManager.instance = new PWANotificationManager();
    }
    return PWANotificationManager.instance;
  }

  // Verificar suporte do navegador
  private checkSupport(): void {
    this.isSupported = 
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    
    console.log('📱 PWA Support:', this.isSupported);
  }

  // Configurar prompt de instalação
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📲 PWA pode ser instalado');
      e.preventDefault();
      this.installPrompt = e;
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('pwa-installable', {
        detail: { canInstall: true }
      }));
    });

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA instalado com sucesso');
      this.installPrompt = null;
      
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
  }

  // Inicializar PWA
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('❌ PWA não suportado neste navegador');
      return false;
    }

    try {
      // Registrar Service Worker
      this.serviceWorker = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('🔧 Service Worker registrado:', this.serviceWorker.scope);

      // Configurar listeners
      this.setupServiceWorkerListeners();

      // Verificar se já tem subscription
      await this.checkExistingSubscription();

      return true;

    } catch (error) {
      console.error('❌ Erro ao inicializar PWA:', error);
      return false;
    }
  }

  // Configurar listeners do Service Worker
  private setupServiceWorkerListeners(): void {
    if (!this.serviceWorker) return;

    // Escutar mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('💬 Mensagem do SW:', event.data);
      
      if (event.data?.type === 'SW_UPDATED') {
        window.dispatchEvent(new CustomEvent('sw-updated', {
          detail: event.data
        }));
      }
    });

    // Escutar mudanças no Service Worker
    this.serviceWorker.addEventListener('updatefound', () => {
      console.log('🔄 Nova versão do Service Worker encontrada');
      
      const newWorker = this.serviceWorker!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🆕 Nova versão do Service Worker disponível');
            
            window.dispatchEvent(new CustomEvent('sw-update-available'));
          }
        });
      }
    });
  }

  // Verificar subscription existente
  private async checkExistingSubscription(): Promise<void> {
    if (!this.serviceWorker) return;

    try {
      this.subscription = await this.serviceWorker.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('📧 Subscription existente encontrada');
        
        // Verificar se ainda é válida
        const isValid = await this.validateSubscription();
        if (!isValid) {
          await this.unsubscribeFromNotifications();
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar subscription:', error);
    }
  }

  // Validar subscription
  private async validateSubscription(): Promise<boolean> {
    if (!this.subscription) return false;
    
    try {
      // Tentar fazer uma requisição de teste
      const response = await fetch('/api/realtime/notifications/subscribe', {
        method: 'HEAD'
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ Subscription inválida:', error);
      return false;
    }
  }

  // Solicitar permissão de notificação
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notificações não suportadas');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    console.log('🔔 Permissão de notificação:', permission);
    return permission;
  }

  // Inscrever-se em push notifications
  async subscribeToNotifications(userId?: string, agencyId?: string): Promise<SubscriptionInfo | null> {
    if (!this.serviceWorker) {
      throw new Error('Service Worker não registrado');
    }

    try {
      // Solicitar permissão primeiro
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Permissão de notificação negada');
      }

      // Criar subscription
      this.subscription = await this.serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('📧 Subscription criada:', this.subscription);

      // Extrair dados da subscription
      const subscriptionData: SubscriptionInfo = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!)
        }
      };

      // Registrar no servidor
      await this.registerSubscriptionOnServer(subscriptionData, userId, agencyId);

      return subscriptionData;

    } catch (error) {
      console.error('❌ Erro ao inscrever-se em notificações:', error);
      return null;
    }
  }

  // Cancelar subscription
  async unsubscribeFromNotifications(): Promise<boolean> {
    if (!this.subscription) {
      console.log('📭 Nenhuma subscription ativa');
      return true;
    }

    try {
      // Cancelar subscription
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        console.log('📭 Subscription cancelada com sucesso');
        
        // Remover do servidor
        await this.unregisterSubscriptionOnServer();
        
        this.subscription = null;
      }

      return success;

    } catch (error) {
      console.error('❌ Erro ao cancelar subscription:', error);
      return false;
    }
  }

  // Registrar subscription no servidor
  private async registerSubscriptionOnServer(
    subscriptionData: SubscriptionInfo,
    userId?: string,
    agencyId?: string
  ): Promise<void> {
    try {
      const deviceInfo = {
        deviceType: this.getDeviceType(),
        browserName: this.getBrowserName(),
        osName: this.getOSName(),
        userAgent: navigator.userAgent
      };

      const response = await fetch('/api/realtime/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscriptionData,
          device_info: deviceInfo,
          user_id: userId,
          agency_id: agencyId
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Subscription registrada no servidor:', result);

    } catch (error) {
      console.error('❌ Erro ao registrar subscription no servidor:', error);
      throw error;
    }
  }

  // Remover subscription do servidor
  private async unregisterSubscriptionOnServer(): Promise<void> {
    if (!this.subscription) return;

    try {
      const response = await fetch(`/api/realtime/notifications/subscribe?endpoint=${encodeURIComponent(this.subscription.endpoint)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Subscription removida do servidor');
      }
    } catch (error) {
      console.error('❌ Erro ao remover subscription do servidor:', error);
    }
  }

  // Mostrar notificação local
  async showLocalNotification(options: PWANotificationOptions): Promise<boolean> {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return false;
    }

    try {
      if (this.serviceWorker) {
        // Usar Service Worker para mostrar notificação
        await this.serviceWorker.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/logo-c.png',
          badge: options.badge || '/logo-c.png',
          image: options.image,
          tag: options.tag || 'fvstudios-local',
          data: options.data || {},
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
          vibrate: options.vibrate || [200, 100, 200],
          timestamp: options.timestamp || Date.now(),
          actions: options.actions || []
        });
      } else {
        // Fallback para notificação direta
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/logo-c.png',
          tag: options.tag || 'fvstudios-local',
          data: options.data || {},
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
          vibrate: options.vibrate || [200, 100, 200]
        });
      }

      return true;

    } catch (error) {
      console.error('❌ Erro ao mostrar notificação local:', error);
      return false;
    }
  }

  // Instalar PWA
  async installPWA(): Promise<boolean> {
    if (!this.installPrompt) {
      console.log('❌ Prompt de instalação não disponível');
      return false;
    }

    try {
      this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      console.log('📲 Resultado da instalação:', result.outcome);
      
      if (result.outcome === 'accepted') {
        this.installPrompt = null;
        return true;
      }
      
      return false;

    } catch (error) {
      console.error('❌ Erro ao instalar PWA:', error);
      return false;
    }
  }

  // Verificar se PWA pode ser instalado
  canInstallPWA(): boolean {
    return this.installPrompt !== null;
  }

  // Verificar se está rodando como PWA
  isRunningAsPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  // Obter tipo de dispositivo
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    
    return 'desktop';
  }

  // Obter nome do navegador
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  }

  // Obter nome do OS
  private getOSName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  }

  // Converter VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Converter ArrayBuffer para Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let result = '';
    
    for (let i = 0; i < bytes.length; i++) {
      result += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(result);
  }

  // Limpar cache
  async clearCache(): Promise<boolean> {
    if (!this.serviceWorker) return false;

    try {
      // Enviar mensagem para o Service Worker limpar cache
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success || false);
        };

        this.serviceWorker!.active?.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });

    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      return false;
    }
  }

  // Atualizar Service Worker
  async updateServiceWorker(): Promise<boolean> {
    if (!this.serviceWorker) return false;

    try {
      await this.serviceWorker.update();
      
      // Forçar ativação da nova versão
      if (this.serviceWorker.waiting) {
        this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
      
      return false;

    } catch (error) {
      console.error('❌ Erro ao atualizar Service Worker:', error);
      return false;
    }
  }

  // Obter informações da subscription atual
  getSubscriptionInfo(): SubscriptionInfo | null {
    if (!this.subscription) return null;

    return {
      endpoint: this.subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!)
      }
    };
  }

  // Verificar se está subscrito
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  // Destruir instância
  destroy(): void {
    this.subscription = null;
    this.serviceWorker = null;
    this.installPrompt = null;
    console.log('💀 PWANotificationManager destruído');
  }
}

// Instância singleton
export const pwaNotificationManager = PWANotificationManager.getInstance();