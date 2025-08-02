import { Server } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import { supabaseServer } from './supabaseServer';
import { pushNotificationManager } from './realtime-notifications';

// Types para WebSocket
export interface SocketUser {
  id: string;
  socket_id: string;
  agency_id?: string;
  connected_at: string;
  last_activity: string;
  user_agent?: string;
  ip_address?: string;
}

export interface WebSocketMessage {
  type: 'notification' | 'typing' | 'status_update' | 'custom';
  data: any;
  timestamp: string;
  sender_id?: string;
  target_id?: string;
  room?: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  type: 'project' | 'agency' | 'private' | 'public';
  members: string[];
  created_at: string;
  metadata?: Record<string, any>;
}

// Classe principal para gerenciar WebSocket
export class WebSocketManager {
  private static instance: WebSocketManager;
  private io: Server | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]
  private rooms: Map<string, RoomInfo> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map(); // roomId -> Set<userId>

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // Inicializar servidor WebSocket
  initialize(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    console.log('🔌 WebSocket Server initialized');
    return this.io;
  }

  // Configurar event handlers
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        // Extrair token de autenticação
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Token de autenticação obrigatório'));
        }

        // Verificar token com Supabase
        const supabase = await supabaseServer();
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
          return next(new Error('Token inválido'));
        }

        // Adicionar user ao socket
        socket.data.user = user;
        socket.data.userId = user.id;

        // Buscar dados do perfil
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('agency_id, role, name')
          .eq('id', user.id)
          .single();

        socket.data.profile = profile;
        socket.data.agencyId = profile?.agency_id;

        next();
      } catch (error) {
        console.error('Erro na autenticação WebSocket:', error);
        next(new Error('Erro na autenticação'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  // Lidar com nova conexão
  private handleConnection(socket: any) {
    const userId = socket.data.userId;
    const agencyId = socket.data.agencyId;

    console.log(`👤 Usuário conectado: ${userId} (socket: ${socket.id})`);

    // Registrar usuário conectado
    const socketUser: SocketUser = {
      id: userId,
      socket_id: socket.id,
      agency_id: agencyId,
      connected_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      user_agent: socket.handshake.headers['user-agent'],
      ip_address: socket.handshake.address
    };

    this.connectedUsers.set(socket.id, socketUser);

    // Manter lista de sockets por usuário
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)!.push(socket.id);

    // Juntar-se a salas automáticas
    if (agencyId) {
      socket.join(`agency:${agencyId}`);
    }
    socket.join(`user:${userId}`);

    // Event handlers
    socket.on('join_room', (data: { room_id: string; room_type?: string }) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on('leave_room', (data: { room_id: string }) => {
      this.handleLeaveRoom(socket, data);
    });

    socket.on('send_message', (data: WebSocketMessage) => {
      this.handleMessage(socket, data);
    });

    socket.on('typing_start', (data: { room_id: string }) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', (data: { room_id: string }) => {
      this.handleTypingStop(socket, data);
    });

    socket.on('status_update', (data: { status: string; message?: string }) => {
      this.handleStatusUpdate(socket, data);
    });

    socket.on('get_online_users', (data: { agency_id?: string }) => {
      this.handleGetOnlineUsers(socket, data);
    });

    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Atualizar atividade a cada ping
    socket.on('ping', () => {
      this.updateUserActivity(socket.id);
    });

    // Emitir evento de usuário online
    this.broadcastUserStatus(userId, 'online', agencyId);
  }

  // Juntar-se a uma sala
  private handleJoinRoom(socket: any, data: { room_id: string; room_type?: string }) {
    const { room_id, room_type = 'public' } = data;
    const userId = socket.data.userId;

    socket.join(room_id);

    // Registrar sala se não existir
    if (!this.rooms.has(room_id)) {
      this.rooms.set(room_id, {
        id: room_id,
        name: room_id,
        type: room_type as any,
        members: [],
        created_at: new Date().toISOString()
      });
    }

    const room = this.rooms.get(room_id)!;
    if (!room.members.includes(userId)) {
      room.members.push(userId);
    }

    console.log(`👥 Usuário ${userId} entrou na sala ${room_id}`);

    // Notificar outros membros
    socket.to(room_id).emit('user_joined_room', {
      user_id: userId,
      room_id,
      timestamp: new Date().toISOString()
    });

    // Confirmar entrada
    socket.emit('room_joined', {
      room_id,
      members_count: room.members.length,
      timestamp: new Date().toISOString()
    });
  }

  // Sair de uma sala
  private handleLeaveRoom(socket: any, data: { room_id: string }) {
    const { room_id } = data;
    const userId = socket.data.userId;

    socket.leave(room_id);

    // Remover da lista de membros
    const room = this.rooms.get(room_id);
    if (room) {
      room.members = room.members.filter(id => id !== userId);
      
      // Limpar sala vazia
      if (room.members.length === 0) {
        this.rooms.delete(room_id);
      }
    }

    console.log(`👋 Usuário ${userId} saiu da sala ${room_id}`);

    // Notificar outros membros
    socket.to(room_id).emit('user_left_room', {
      user_id: userId,
      room_id,
      timestamp: new Date().toISOString()
    });

    // Parar typing se estava digitando
    this.handleTypingStop(socket, { room_id });
  }

  // Lidar com mensagens
  private handleMessage(socket: any, message: WebSocketMessage) {
    const userId = socket.data.userId;
    const enrichedMessage = {
      ...message,
      sender_id: userId,
      timestamp: new Date().toISOString(),
      socket_id: socket.id
    };

    // Determinar onde enviar a mensagem
    if (message.target_id) {
      // Mensagem privada
      this.sendToUser(message.target_id, 'message', enrichedMessage);
    } else if (message.room) {
      // Mensagem para sala
      socket.to(message.room).emit('message', enrichedMessage);
    } else {
      // Broadcast para agência
      const agencyId = socket.data.agencyId;
      if (agencyId) {
        socket.to(`agency:${agencyId}`).emit('message', enrichedMessage);
      }
    }

    console.log(`💬 Mensagem de ${userId}: ${message.type}`);
  }

  // Iniciar digitação
  private handleTypingStart(socket: any, data: { room_id: string }) {
    const { room_id } = data;
    const userId = socket.data.userId;

    if (!this.typingUsers.has(room_id)) {
      this.typingUsers.set(room_id, new Set());
    }

    this.typingUsers.get(room_id)!.add(userId);

    socket.to(room_id).emit('typing_start', {
      user_id: userId,
      room_id,
      timestamp: new Date().toISOString()
    });

    // Auto-stop após 10 segundos
    setTimeout(() => {
      this.handleTypingStop(socket, { room_id });
    }, 10000);
  }

  // Parar digitação
  private handleTypingStop(socket: any, data: { room_id: string }) {
    const { room_id } = data;
    const userId = socket.data.userId;

    const typingSet = this.typingUsers.get(room_id);
    if (typingSet) {
      typingSet.delete(userId);
      
      if (typingSet.size === 0) {
        this.typingUsers.delete(room_id);
      }
    }

    socket.to(room_id).emit('typing_stop', {
      user_id: userId,
      room_id,
      timestamp: new Date().toISOString()
    });
  }

  // Atualizar status do usuário
  private handleStatusUpdate(socket: any, data: { status: string; message?: string }) {
    const userId = socket.data.userId;
    const agencyId = socket.data.agencyId;

    this.broadcastUserStatus(userId, data.status, agencyId, data.message);
  }

  // Obter usuários online
  private handleGetOnlineUsers(socket: any, data: { agency_id?: string }) {
    const agencyId = data.agency_id || socket.data.agencyId;
    
    const onlineUsers = Array.from(this.connectedUsers.values())
      .filter(user => !agencyId || user.agency_id === agencyId)
      .reduce((acc, user) => {
        if (!acc.find(u => u.id === user.id)) {
          acc.push({
            id: user.id,
            agency_id: user.agency_id,
            connected_at: user.connected_at,
            last_activity: user.last_activity
          });
        }
        return acc;
      }, [] as any[]);

    socket.emit('online_users', {
      users: onlineUsers,
      count: onlineUsers.length,
      timestamp: new Date().toISOString()
    });
  }

  // Lidar com desconexão
  private handleDisconnection(socket: any, reason: string) {
    const userId = socket.data.userId;
    const agencyId = socket.data.agencyId;

    console.log(`👋 Usuário desconectado: ${userId} (${reason})`);

    // Remover das estruturas de dados
    this.connectedUsers.delete(socket.id);

    const userSocketsList = this.userSockets.get(userId);
    if (userSocketsList) {
      const index = userSocketsList.indexOf(socket.id);
      if (index > -1) {
        userSocketsList.splice(index, 1);
      }
      
      // Se não há mais sockets para este usuário
      if (userSocketsList.length === 0) {
        this.userSockets.delete(userId);
        this.broadcastUserStatus(userId, 'offline', agencyId);
      }
    }

    // Limpar typing de todas as salas
    this.typingUsers.forEach((users, roomId) => {
      if (users.has(userId)) {
        users.delete(userId);
        socket.to(roomId).emit('typing_stop', {
          user_id: userId,
          room_id: roomId,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Métodos públicos para integração com APIs

  // Enviar notificação para usuário específico
  sendNotificationToUser(userId: string, notification: any) {
    const message = {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    };

    this.sendToUser(userId, 'notification', message);
  }

  // Enviar para todos os usuários de uma agência
  sendToAgency(agencyId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`agency:${agencyId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Enviar para usuário específico
  sendToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds && this.io) {
      socketIds.forEach(socketId => {
        this.io!.to(socketId).emit(event, {
          ...data,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  // Broadcast para todos
  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Atualizar atividade do usuário
  private updateUserActivity(socketId: string) {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      user.last_activity = new Date().toISOString();
    }
  }

  // Broadcast status do usuário
  private broadcastUserStatus(userId: string, status: string, agencyId?: string, message?: string) {
    const statusData = {
      user_id: userId,
      status,
      message,
      timestamp: new Date().toISOString()
    };

    if (agencyId) {
      this.sendToAgency(agencyId, 'user_status_changed', statusData);
    }
  }

  // Obter estatísticas
  getStats() {
    return {
      connected_users: this.connectedUsers.size,
      unique_users: this.userSockets.size,
      active_rooms: this.rooms.size,
      typing_rooms: this.typingUsers.size,
      timestamp: new Date().toISOString()
    };
  }

  // Obter usuários online
  getOnlineUsers(agencyId?: string) {
    return Array.from(this.connectedUsers.values())
      .filter(user => !agencyId || user.agency_id === agencyId)
      .reduce((acc, user) => {
        if (!acc.find(u => u.id === user.id)) {
          acc.push(user);
        }
        return acc;
      }, [] as SocketUser[]);
  }

  // Integração com sistema de notificações
  setupNotificationIntegration() {
    // Escutar eventos do sistema de notificações
    pushNotificationManager.on('realtime_event_created', (eventData) => {
      this.sendNotificationToUser(eventData.userId, {
        type: 'realtime_event',
        event_type: eventData.eventType,
        data: eventData.eventData,
        priority: eventData.priority || 'normal'
      });
    });

    pushNotificationManager.on('push_notification_sent', (data) => {
      // Notificar via WebSocket também para garantia
      const userId = data.userId || data.subscriptionId; // Adaptar conforme estrutura
      this.sendNotificationToUser(userId, {
        type: 'push_sent',
        data: data.payload
      });
    });
  }

  // Cleanup
  destroy() {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    
    this.connectedUsers.clear();
    this.userSockets.clear();
    this.rooms.clear();
    this.typingUsers.clear();
    
    console.log('💀 WebSocket Manager destroyed');
  }
}

// Instância singleton
export const webSocketManager = WebSocketManager.getInstance();