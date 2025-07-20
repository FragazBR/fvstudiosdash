"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Sidebar from './sidebar';
import Topbar from './Shared/Topbar';
import { Toaster } from '@/components/ui/toaster';
import { 
  Bell, 
  BellOff, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  FileText,
  Calendar,
  Settings,
  MoreHorizontal,
  Eye,
  Archive,
  Trash2,
  Bot,
  User,
  ExternalLink
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Mock data
const mockNotifications = [
  {
    id: '1',
    type: 'system' as const,
    title: 'Sistema Atualizado',
    message: 'Nova versão do dashboard disponível com melhorias de performance.',
    timestamp: new Date('2024-01-20T10:30:00'),
    read: false,
    actionRequired: false,
    priority: 'medium' as const,
    source: 'system',
    metadata: {}
  },
  {
    id: '2',
    type: 'project' as const,
    title: 'Projeto Finalizado',
    message: 'O projeto "Nike Summer Campaign" foi concluído com sucesso.',
    timestamp: new Date('2024-01-19T14:15:00'),
    read: true,
    actionRequired: false,
    priority: 'high' as const,
    source: 'project',
    metadata: { projectId: '1' }
  },
  {
    id: '3',
    type: 'workflow' as const,
    title: 'Aprovação Pendente',
    message: 'Aguardando aprovação do cliente para prosseguir com a próxima etapa.',
    timestamp: new Date('2024-01-19T09:00:00'),
    read: false,
    actionRequired: true,
    priority: 'high' as const,
    source: 'workflow',
    metadata: { workflowStage: 'aprovacao' }
  }
];

export function NotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSettings, setShowSettings] = useState(false);

  const filteredNotifications = mockNotifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'read' && notification.read) ||
                         (statusFilter === 'unread' && !notification.read) ||
                         (statusFilter === 'action' && notification.actionRequired);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = mockNotifications.filter(n => !n.read).length;
  const actionRequiredCount = mockNotifications.filter(n => n.actionRequired).length;

  const markAsRead = (id: string) => {
    console.log('Marking as read:', id);
  };

  const markAllAsRead = () => {
    console.log('Marking all as read');
  };

  const deleteNotification = (id: string) => {
    console.log('Deleting notification:', id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return <Bot className="h-4 w-4" />;
      case 'project': return <FileText className="h-4 w-4" />;
      case 'workflow': return <MessageCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-600 dark:text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return 'agora';
  };

  return (
    <div className="bg-gray-50 dark:bg-[#121212]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Bell className="h-8 w-8 text-[#64f481]" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {unreadCount} não lidas • {actionRequiredCount} requerem ação
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar Todas Lidas
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Buscar notificações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="project">Projeto</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unread">Não Lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="action">Requer Ação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.read 
                    ? 'border-l-4 border-l-[#64f481] bg-[#64f481]/5' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setSelectedNotification(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </h3>
                          {notification.actionRequired && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Ação
                            </Badge>
                          )}
                          {!notification.read && (
                            <div className="h-2 w-2 bg-[#64f481] rounded-full" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(notification.timestamp)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Menu de ações
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma notificação encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Não há notificações que correspondam aos filtros selecionados.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <Toaster />
    </div>
  );
}
