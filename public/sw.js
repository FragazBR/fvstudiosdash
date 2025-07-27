// Service Worker para Push Notifications
// FVStudios Dashboard - Progressive Web App

const CACHE_NAME = 'fvstudios-dashboard-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo-c.png',
  '/logo-c-white.png',
  '/Logotipo-FVstudios-Branco.png',
  '/Logotipo-FVstudios-Preto.png'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Fazendo cache dos recursos estáticos');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker instalado com sucesso');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erro ao instalar Service Worker:', error);
      })
  );
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker ativado');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar extensões do navegador
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se disponível
        if (response) {
          return response;
        }

        // Fazer requisição à rede
        return fetch(event.request)
          .then((response) => {
            // Verificar se é uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar a resposta
            const responseToCache = response.clone();

            // Adicionar ao cache apenas se for um recurso estático
            if (event.request.url.includes('/static/') || 
                event.request.url.includes('.png') ||
                event.request.url.includes('.jpg') ||
                event.request.url.includes('.css') ||
                event.request.url.includes('.js')) {
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Se offline, retornar página offline para navegação
            if (event.request.mode === 'navigate') {
              return caches.match('/offline');
            }
            
            // Para outros recursos, retornar resposta vazia
            return new Response('', {
              status: 200,
              statusText: 'OK'
            });
          });
      })
  );
});

// Lidar com push notifications
self.addEventListener('push', (event) => {
  console.log('📧 Push notification recebida:', event);

  if (!event.data) {
    console.warn('Push notification sem dados');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('Erro ao parsear dados da push notification:', error);
    notificationData = {
      title: 'FVStudios Dashboard',
      body: event.data.text() || 'Nova notificação',
      icon: '/logo-c.png',
      badge: '/logo-c.png'
    };
  }

  const notificationOptions = {
    body: notificationData.body || notificationData.message,
    icon: notificationData.icon || '/logo-c.png',
    badge: notificationData.badge || '/logo-c.png',
    image: notificationData.image,
    data: notificationData.data || {},
    tag: notificationData.tag || 'fvstudios-notification',
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    renotify: notificationData.renotify || true,
    vibrate: notificationData.vibrate || [200, 100, 200],
    timestamp: Date.now(),
    actions: notificationData.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'FVStudios Dashboard',
      notificationOptions
    ).then(() => {
      console.log('✅ Push notification exibida');
      
      // Registrar que a notificação foi exibida
      return self.registration.sync.register('notification-delivered');
    }).catch((error) => {
      console.error('❌ Erro ao exibir push notification:', error);
    })
  );
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Clique em notificação:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;
  
  let urlToOpen = notificationData.url || '/';
  
  // Lidar com ações específicas
  if (action) {
    switch (action) {
      case 'view':
        urlToOpen = notificationData.viewUrl || urlToOpen;
        break;
      case 'dismiss':
        // Apenas fechar a notificação
        return;
      case 'reply':
        urlToOpen = notificationData.replyUrl || '/messages';
        break;
      default:
        urlToOpen = notificationData.actionUrls?.[action] || urlToOpen;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Procurar por uma janela já aberta
        for (const client of clientList) {
          if (client.url.includes(new URL(urlToOpen).pathname) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Se não encontrou, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .then(() => {
        // Registrar que a notificação foi clicada
        return self.registration.sync.register('notification-clicked');
      })
      .catch((error) => {
        console.error('❌ Erro ao lidar com clique na notificação:', error);
      })
  );
});

// Lidar com fechamento de notificações
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificação fechada:', event);
  
  const notificationData = event.notification.data || {};
  
  // Registrar que a notificação foi fechada
  event.waitUntil(
    self.registration.sync.register('notification-closed')
      .catch((error) => {
        console.error('❌ Erro ao registrar fechamento da notificação:', error);
      })
  );
});

// Background sync para quando volta online
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'notification-delivered') {
    event.waitUntil(
      updateNotificationStatus('delivered')
    );
  } else if (event.tag === 'notification-clicked') {
    event.waitUntil(
      updateNotificationStatus('clicked')
    );
  } else if (event.tag === 'notification-closed') {
    event.waitUntil(
      updateNotificationStatus('dismissed')
    );
  }
});

// Função para atualizar status da notificação
async function updateNotificationStatus(status) {
  try {
    // Obter dados da última notificação do IndexedDB ou localStorage
    // e enviar para o servidor o status atualizado
    
    const response = await fetch('/api/realtime/notifications/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update_status',
        status: status,
        timestamp: Date.now()
      })
    });

    if (response.ok) {
      console.log(`✅ Status da notificação atualizado: ${status}`);
    } else {
      console.warn(`⚠️ Falha ao atualizar status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar status da notificação:', error);
  }
}

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('💬 Mensagem recebida no Service Worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              return caches.delete(cacheName);
            })
          );
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
    );
  }
});

// Lidar com erros não tratados
self.addEventListener('error', (event) => {
  console.error('❌ Erro no Service Worker:', event.error);
});

// Lidar com rejeições de Promise não tratadas
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rejeitada no Service Worker:', event.reason);
  event.preventDefault();
});

// Atualização do Service Worker
self.addEventListener('controllerchange', () => {
  console.log('🔄 Service Worker atualizado, recarregando página...');
  
  // Notificar todos os clientes que o SW foi atualizado
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SW_UPDATED',
        message: 'Service Worker foi atualizado'
      });
    });
  });
});

console.log('🚀 Service Worker carregado - FVStudios Dashboard');