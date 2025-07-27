"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

// Types
interface WebSocketMessage {
  type: 'notification' | 'typing' | 'status_update' | 'custom';
  data: any;
  timestamp: string;
  sender_id?: string;
  target_id?: string;
  room?: string;
}

interface OnlineUser {
  id: string;
  agency_id?: string;
  connected_at: string;
  last_activity: string;
}

interface WebSocketHookOptions {
  autoConnect?: boolean;
  enableTyping?: boolean;
  enableNotifications?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

// Hook principal para WebSocket
export function useWebSocket(options: WebSocketHookOptions = {}) {
  const {
    autoConnect = true,
    enableTyping = true,
    enableNotifications = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options;

  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const reconnectAttemptsRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Conectar ao WebSocket
  const connect = useCallback(async () => {
    if (!user?.id || socket?.connected) return;

    try {
      // Obter token de sessão
      const { data: { session } } = await window.supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || window.location.origin, {
        auth: {
          token: session.access_token
        },
        reconnection: true,
        reconnectionAttempts: reconnectAttempts,
        reconnectionDelay: reconnectDelay,
        timeout: 20000
      });

      // Event listeners
      socketInstance.on('connect', () => {
        console.log('🔌 WebSocket conectado');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        if (enableNotifications) {
          toast.success('Conectado ao chat em tempo real');
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ WebSocket desconectado:', reason);
        setIsConnected(false);
        setOnlineUsers([]);
        setTypingUsers(new Set());
        
        if (reason === 'io client disconnect') {
          // Desconexão manual, não tentar reconectar
          return;
        }
        
        if (enableNotifications) {
          toast.error('Desconectado do chat');
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('❌ Erro de conexão WebSocket:', error);
        setConnectionError(error.message);
        
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current >= reconnectAttempts) {
          toast.error('Falha ao conectar ao chat em tempo real');
        }
      });

      // Eventos de notificação
      if (enableNotifications) {
        socketInstance.on('notification', (data) => {
          handleNotification(data);
        });

        socketInstance.on('admin_message', (data) => {
          toast.info(data.message, {
            description: 'Mensagem do sistema',
            duration: 10000
          });
        });
      }

      // Eventos de usuários online
      socketInstance.on('online_users', (data) => {
        setOnlineUsers(data.users || []);
      });

      // Eventos de status
      socketInstance.on('user_status_changed', (data) => {
        setOnlineUsers(prev => {
          const updated = prev.filter(u => u.id !== data.user_id);
          if (data.status === 'online') {
            updated.push({
              id: data.user_id,
              connected_at: data.timestamp,
              last_activity: data.timestamp
            });
          }
          return updated;
        });
      });

      // Eventos de typing (se habilitado)
      if (enableTyping) {
        socketInstance.on('typing_start', (data) => {
          setTypingUsers(prev => new Set([...prev, data.user_id]));
        });

        socketInstance.on('typing_stop', (data) => {
          setTypingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(data.user_id);
            return updated;
          });
        });
      }

      // Eventos de sala
      socketInstance.on('room_joined', (data) => {
        console.log('🏠 Entrou na sala:', data.room_id);
      });

      socketInstance.on('user_joined_room', (data) => {
        console.log('👤 Usuário entrou na sala:', data);
      });

      socketInstance.on('user_left_room', (data) => {
        console.log('👋 Usuário saiu da sala:', data);
      });

      setSocket(socketInstance);

      // Solicitar usuários online após conectar
      setTimeout(() => {
        socketInstance.emit('get_online_users', {});
      }, 1000);

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      setConnectionError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }, [user?.id, reconnectAttempts, reconnectDelay, enableNotifications, enableTyping]);

  // Desconectar
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
      setTypingUsers(new Set());
    }
  }, [socket]);

  // Lidar com notificações recebidas
  const handleNotification = useCallback((data: any) => {
    switch (data.type) {
      case 'realtime_event':
        toast.info(data.data.title || 'Nova notificação', {
          description: data.data.message,
          duration: 5000
        });
        break;

      case 'push_sent':
        // Notificação de que um push foi enviado
        break;

      default:
        if (data.data?.title) {
          toast.info(data.data.title, {
            description: data.data.message,
            duration: 5000
          });
        }
    }
  }, []);

  // Métodos de interação

  // Enviar mensagem
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (socket?.connected) {
      socket.emit('send_message', {
        ...message,
        timestamp: new Date().toISOString()
      });
    }
  }, [socket]);

  // Juntar-se a uma sala
  const joinRoom = useCallback((roomId: string, roomType: string = 'public') => {
    if (socket?.connected) {
      socket.emit('join_room', { room_id: roomId, room_type: roomType });
    }
  }, [socket]);

  // Sair de uma sala
  const leaveRoom = useCallback((roomId: string) => {
    if (socket?.connected) {
      socket.emit('leave_room', { room_id: roomId });
    }
  }, [socket]);

  // Iniciar digitação
  const startTyping = useCallback((roomId: string) => {
    if (socket?.connected && enableTyping) {
      socket.emit('typing_start', { room_id: roomId });
      
      // Auto-stop após 10 segundos
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(roomId);
      }, 10000);
    }
  }, [socket, enableTyping]);

  // Parar digitação
  const stopTyping = useCallback((roomId: string) => {
    if (socket?.connected && enableTyping) {
      socket.emit('typing_stop', { room_id: roomId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = undefined;
      }
    }
  }, [socket, enableTyping]);

  // Atualizar status
  const updateStatus = useCallback((status: string, message?: string) => {
    if (socket?.connected) {
      socket.emit('status_update', { status, message });
    }
  }, [socket]);

  // Atualizar lista de usuários online  
  const refreshOnlineUsers = useCallback(() => {
    if (socket?.connected) {
      socket.emit('get_online_users', {});
    }
  }, [socket]);

  // Efeitos
  useEffect(() => {
    if (autoConnect && user?.id) {
      connect();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      disconnect();
    };
  }, [user?.id, autoConnect, connect, disconnect]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estado
    isConnected,
    onlineUsers,
    typingUsers: Array.from(typingUsers),
    connectionError,
    socket,

    // Métodos
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    updateStatus,
    refreshOnlineUsers
  };
}

// Componente para indicador de status de conexão
export function WebSocketConnectionStatus() {
  const { isConnected, connectionError, onlineUsers } = useWebSocket({ autoConnect: true });

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span className="text-gray-600 dark:text-gray-400">
        {isConnected ? (
          <>Online ({onlineUsers.length} usuários)</>
        ) : (
          <>Desconectado {connectionError && `(${connectionError})`}</>
        )}
      </span>
    </div>
  );
}

// Provider para WebSocket (opcional)
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const webSocket = useWebSocket({ autoConnect: true });

  // Disponibilizar o WebSocket via context se necessário
  return (
    <>
      {children}
      {/* Indicador de status fixo */}
      <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
        <WebSocketConnectionStatus />
      </div>
    </>
  );
}