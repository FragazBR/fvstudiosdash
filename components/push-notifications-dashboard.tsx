"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bell, 
  Smartphone, 
  Settings, 
  BarChart3, 
  Send, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  Edit,
  Plus,
  Eye,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';
import { pwaNotificationManager } from '@/lib/pwa-notifications';

// Types
interface PushNotificationStats {
  total_subscriptions: number;
  active_subscriptions: number;
  total_sent: number;
  total_delivered: number;
  total_clicked: number;
  delivery_rate: number;
  click_rate: number;
  daily_stats: Array<{
    date: string;
    sent: number;
    delivered: number;
    clicked: number;
  }>;
}

interface NotificationSubscription {
  id: string;
  user_id: string;
  agency_id?: string;
  endpoint: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser_name?: string;
  os_name?: string;
  enabled: boolean;
  notification_types: string[];
  created_at: string;
  last_used_at?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  event_type: string;
  title_template: string;
  message_template: string;
  icon_url?: string;
  priority: string;
  is_active: boolean;
  is_default: boolean;
}

interface UserPreferences {
  enabled: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

export default function PushNotificationsDashboard() {
  const [stats, setStats] = useState<PushNotificationStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Estado para envio de notificação de teste
  const [testNotification, setTestNotification] = useState({
    title: '',
    message: '',
    icon_url: '',
    target_users: 'all' as 'all' | 'agency' | 'specific',
    specific_user_ids: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  });

  // Estado para criação de template
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    event_type: '',
    title_template: '',
    message_template: '',
    icon_url: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  });

  // Estado para configuração PWA
  const [pwaStatus, setPwaStatus] = useState({
    isSupported: false,
    isSubscribed: false,
    canInstall: false,
    isInstalled: false
  });

  useEffect(() => {
    loadDashboardData();
    checkPWAStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar estatísticas
      const statsResponse = await fetch('/api/realtime/notifications/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Carregar subscriptions
      const subscriptionsResponse = await fetch('/api/realtime/notifications/subscribe');
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        setSubscriptions(subscriptionsData.data || []);
      }

      // Carregar templates
      const templatesResponse = await fetch('/api/push/templates');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.data || []);
      }

      // Carregar preferências
      const preferencesResponse = await fetch('/api/realtime/notifications/preferences');
      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json();
        setPreferences(preferencesData.data);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const checkPWAStatus = async () => {
    try {
      await pwaNotificationManager.initialize();
      
      setPwaStatus({
        isSupported: true,
        isSubscribed: pwaNotificationManager.isSubscribed(),
        canInstall: pwaNotificationManager.canInstallPWA(),
        isInstalled: pwaNotificationManager.isRunningAsPWA()
      });
    } catch (error) {
      console.error('Erro ao verificar status PWA:', error);
    }
  };

  const handleSubscribeToPush = async () => {
    try {
      const subscription = await pwaNotificationManager.subscribeToNotifications();
      if (subscription) {
        toast.success('Inscrito em notificações push!');
        setPwaStatus(prev => ({ ...prev, isSubscribed: true }));
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Erro ao inscrever-se:', error);
      toast.error('Erro ao inscrever-se em notificações push');
    }
  };

  const handleUnsubscribeFromPush = async () => {
    try {
      const success = await pwaNotificationManager.unsubscribeFromNotifications();
      if (success) {
        toast.success('Desinscrito de notificações push');
        setPwaStatus(prev => ({ ...prev, isSubscribed: false }));
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Erro ao desinscrever-se:', error);
      toast.error('Erro ao desinscrever-se de notificações push');
    }
  };

  const handleInstallPWA = async () => {
    try {
      const success = await pwaNotificationManager.installPWA();
      if (success) {
        toast.success('App instalado com sucesso!');
        setPwaStatus(prev => ({ ...prev, canInstall: false, isInstalled: true }));
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
      toast.error('Erro ao instalar aplicativo');
    }
  };

  const handleSendTestNotification = async () => {
    if (!testNotification.title || !testNotification.message) {
      toast.error('Título e mensagem são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/realtime/notifications/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_user_id: testNotification.target_users === 'specific' ? 
            testNotification.specific_user_ids.split(',')[0] : null,
          event_type: 'test_notification',
          event_data: {
            title: testNotification.title,
            message: testNotification.message,
            icon: testNotification.icon_url || '/logo-c.png',
            priority: testNotification.priority
          },
          delivery_channels: ['push', 'web'],
          priority: testNotification.priority
        })
      });

      if (response.ok) {
        toast.success('Notificação de teste enviada!');
        setTestNotification({
          title: '',
          message: '',
          icon_url: '',
          target_users: 'all',
          specific_user_ids: '',
          priority: 'normal'
        });
      } else {
        throw new Error('Erro na resposta da API');
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação de teste');
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.title_template || !newTemplate.message_template) {
      toast.error('Nome, título e mensagem são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/push/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTemplate)
      });

      if (response.ok) {
        toast.success('Template criado com sucesso!');
        setNewTemplate({
          name: '',
          event_type: '',
          title_template: '',
          message_template: '',
          icon_url: '',
          priority: 'normal'
        });
        await loadDashboardData();
      } else {
        throw new Error('Erro na resposta da API');
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    }
  };

  const handleUpdatePreferences = async (updatedPreferences: Partial<UserPreferences>) => {
    try {
      const response = await fetch('/api/realtime/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedPreferences)
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
        toast.success('Preferências atualizadas!');
      } else {
        throw new Error('Erro na resposta da API');
      }
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      toast.error('Erro ao atualizar preferências');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#01b86c]"></div>
      </div>
    );
  }

  const chartColors = ['#01b86c', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard de Push Notifications
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure e monitore notificações push em tempo real
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscriptions">Inscrições</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Teste</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="pwa">PWA</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_subscriptions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.active_subscriptions || 0} ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notificações Enviadas</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_sent || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.delivery_rate?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.total_delivered || 0} entregues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Cliques</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.click_rate?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.total_clicked || 0} cliques
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Notificações</CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats?.daily_stats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sent" stroke="#01b86c" name="Enviadas" />
                    <Line type="monotone" dataKey="delivered" stroke="#3b82f6" name="Entregues" />
                    <Line type="monotone" dataKey="clicked" stroke="#f59e0b" name="Clicadas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Dispositivo</CardTitle>
                <CardDescription>Inscrições ativas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Desktop', value: subscriptions.filter(s => s.device_type === 'desktop').length },
                        { name: 'Mobile', value: subscriptions.filter(s => s.device_type === 'mobile').length },
                        { name: 'Tablet', value: subscriptions.filter(s => s.device_type === 'tablet').length }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartColors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inscrições Ativas</CardTitle>
              <CardDescription>
                Gerencie inscrições de push notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-5 w-5 text-gray-400" />
                        <Badge variant={subscription.device_type === 'mobile' ? 'default' : 'secondary'}>
                          {subscription.device_type}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {subscription.browser_name} - {subscription.os_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Criado em {new Date(subscription.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={subscription.enabled}
                        onCheckedChange={(checked) => {
                          // TODO: Implementar toggle de habilitação
                          console.log('Toggle subscription:', subscription.id, checked);
                        }}
                      />
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {subscriptions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma inscrição encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Criar Template</CardTitle>
                <CardDescription>
                  Crie templates reutilizáveis para notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Nome do Template</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Tarefa Atrasada"
                  />
                </div>

                <div>
                  <Label htmlFor="event-type">Tipo de Evento</Label>
                  <Select
                    value={newTemplate.event_type}
                    onValueChange={(value) => setNewTemplate(prev => ({ ...prev, event_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task_assigned">Tarefa Atribuída</SelectItem>
                      <SelectItem value="task_due_soon">Tarefa Próxima do Prazo</SelectItem>
                      <SelectItem value="task_overdue">Tarefa Atrasada</SelectItem>
                      <SelectItem value="project_completed">Projeto Concluído</SelectItem>
                      <SelectItem value="payment_received">Pagamento Recebido</SelectItem>
                      <SelectItem value="system_alert">Alerta do Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title-template">Template do Título</Label>
                  <Input
                    id="title-template"
                    value={newTemplate.title_template}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, title_template: e.target.value }))}
                    placeholder="Ex: Nova tarefa: {{task_name}}"
                  />
                </div>

                <div>
                  <Label htmlFor="message-template">Template da Mensagem</Label>
                  <Textarea
                    id="message-template"
                    value={newTemplate.message_template}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, message_template: e.target.value }))}
                    placeholder="Ex: Você tem uma nova tarefa no projeto {{project_name}}"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={newTemplate.priority}
                    onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCreateTemplate} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Templates Existentes</CardTitle>
                <CardDescription>
                  Gerencie seus templates de notificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.is_default && <Badge variant="secondary">Padrão</Badge>}
                          <Badge variant={template.is_active ? 'default' : 'secondary'}>
                            {template.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {template.title_template}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Evento: {template.event_type} • Prioridade: {template.priority}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {templates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum template encontrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Notificação de Teste</CardTitle>
              <CardDescription>
                Teste o sistema de notificações push
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-title">Título da Notificação</Label>
                <Input
                  id="test-title"
                  value={testNotification.title}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Teste de Notificação"
                />
              </div>

              <div>
                <Label htmlFor="test-message">Mensagem</Label>
                <Textarea
                  id="test-message"
                  value={testNotification.message}
                  onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Ex: Esta é uma notificação de teste do sistema."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="test-priority">Prioridade</Label>
                <Select
                  value={testNotification.priority}
                  onValueChange={(value: any) => setTestNotification(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="test-target">Público Alvo</Label>
                <Select
                  value={testNotification.target_users}
                  onValueChange={(value: any) => setTestNotification(prev => ({ ...prev, target_users: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="agency">Usuários da agência</SelectItem>
                    <SelectItem value="specific">Usuários específicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {testNotification.target_users === 'specific' && (
                <div>
                  <Label htmlFor="specific-users">IDs dos Usuários (separados por vírgula)</Label>
                  <Input
                    id="specific-users"
                    value={testNotification.specific_user_ids}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, specific_user_ids: e.target.value }))}
                    placeholder="Ex: user1,user2,user3"
                  />
                </div>
              )}

              <Button onClick={handleSendTestNotification} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Enviar Notificação de Teste
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure suas preferências pessoais de notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {preferences && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações Habilitadas</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ativar ou desativar todas as notificações
                      </p>
                    </div>
                    <Switch
                      checked={preferences.enabled}
                      onCheckedChange={(checked) => handleUpdatePreferences({ enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receber notificações push no dispositivo
                      </p>
                    </div>
                    <Switch
                      checked={preferences.push_notifications}
                      onCheckedChange={(checked) => handleUpdatePreferences({ push_notifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receber notificações por email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) => handleUpdatePreferences({ email_notifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Horário Silencioso</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Não receber notificações em horários específicos
                      </p>
                    </div>
                    <Switch
                      checked={preferences.quiet_hours_enabled}
                      onCheckedChange={(checked) => handleUpdatePreferences({ quiet_hours_enabled: checked })}
                    />
                  </div>

                  {preferences.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quiet-start">Início do Silêncio</Label>
                        <Input
                          id="quiet-start"
                          type="time"
                          value={preferences.quiet_hours_start}
                          onChange={(e) => handleUpdatePreferences({ quiet_hours_start: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="quiet-end">Fim do Silêncio</Label>
                        <Input
                          id="quiet-end"
                          type="time"
                          value={preferences.quiet_hours_end}
                          onChange={(e) => handleUpdatePreferences({ quiet_hours_end: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PWA Tab */}
        <TabsContent value="pwa" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status do Progressive Web App</CardTitle>
                <CardDescription>
                  Configure o aplicativo como PWA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>PWA Suportado</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Seu navegador suporta PWA
                    </p>
                  </div>
                  <Badge variant={pwaStatus.isSupported ? 'default' : 'secondary'}>
                    {pwaStatus.isSupported ? 'Sim' : 'Não'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>App Instalado</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Aplicativo instalado no dispositivo
                    </p>
                  </div>
                  <Badge variant={pwaStatus.isInstalled ? 'default' : 'secondary'}>
                    {pwaStatus.isInstalled ? 'Sim' : 'Não'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Inscrito</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Inscrito em notificações push
                    </p>
                  </div>
                  <Badge variant={pwaStatus.isSubscribed ? 'default' : 'secondary'}>
                    {pwaStatus.isSubscribed ? 'Sim' : 'Não'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {pwaStatus.canInstall && (
                    <Button onClick={handleInstallPWA} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Instalar Aplicativo
                    </Button>
                  )}

                  {!pwaStatus.isSubscribed ? (
                    <Button onClick={handleSubscribeToPush} className="w-full" variant="outline">
                      <Bell className="h-4 w-4 mr-2" />
                      Ativar Push Notifications
                    </Button>
                  ) : (
                    <Button onClick={handleUnsubscribeFromPush} className="w-full" variant="outline">
                      <Bell className="h-4 w-4 mr-2" />
                      Desativar Push Notifications
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações do Dispositivo</CardTitle>
                <CardDescription>
                  Detalhes sobre o dispositivo atual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>User Agent</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                    {navigator.userAgent}
                  </p>
                </div>

                <div>
                  <Label>Permissão de Notificação</Label>
                  <Badge variant={
                    Notification.permission === 'granted' ? 'default' :
                    Notification.permission === 'denied' ? 'destructive' : 'secondary'
                  }>
                    {Notification.permission === 'granted' ? 'Concedida' :
                     Notification.permission === 'denied' ? 'Negada' : 'Padrão'}
                  </Badge>
                </div>

                <div>
                  <Label>Service Worker</Label>
                  <Badge variant={'serviceWorker' in navigator ? 'default' : 'secondary'}>
                    {'serviceWorker' in navigator ? 'Suportado' : 'Não Suportado'}
                  </Badge>
                </div>

                <div>
                  <Label>Conexão</Label>
                  <Badge variant={navigator.onLine ? 'default' : 'destructive'}>
                    {navigator.onLine ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}