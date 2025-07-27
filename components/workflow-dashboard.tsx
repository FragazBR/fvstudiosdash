"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Workflow, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  Play,
  Pause,
  Settings,
  MessageCircle,
  FileText,
  Send,
  UserCheck,
  Timer,
  Activity,
  Zap,
  Archive,
  Star,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { toast } from 'sonner';

// Types
interface Workflow {
  id: string;
  name: string;
  description: string;
  type: string;
  is_active: boolean;
  is_parallel: boolean;
  requires_all_approvers: boolean;
  auto_approve_threshold: number;
  auto_reject_threshold: number;
  default_timeout_hours: number;
  escalation_timeout_hours: number;
  business_hours_only: boolean;
  workflow_schema: any[];
  notification_settings: any;
  total_instances: number;
  completed_instances: number;
  average_completion_time_hours: number;
  created_at: string;
  updated_at: string;
}

interface WorkflowInstance {
  id: string;
  title: string;
  description: string;
  reference_id: string;
  reference_type: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  current_step: number;
  total_steps: number;
  progress_percentage: number;
  context_data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  started_at: string;
  due_date: string;
  completed_at: string;
  final_decision: string;
  created_at: string;
  workflows: {
    id: string;
    name: string;
    type: string;
  };
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_schema: any;
  default_settings: any;
  usage_count: number;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
}

interface WorkflowStats {
  overview: {
    total_workflows: number;
    active_workflows: number;
    total_instances: number;
    pending_instances: number;
    in_progress_instances: number;
    completed_instances: number;
    average_completion_hours: number;
    completion_rate: number;
    average_response_time_hours: number;
  };
  instances_by_status: Array<{ status: string; count: number }>;
  instances_by_type: Array<{ type: string; count: number }>;
  daily_activity: Array<{ date: string; created: number; completed: number }>;
  recent_instances: WorkflowInstance[];
  pending_approvals: WorkflowInstance[];
  workflow_performance: Array<{
    workflow_name: string;
    workflow_type: string;
    total_instances: number;
    completed_instances: number;
    avg_completion_hours: number;
    completion_rate: number;
  }>;
}

export default function WorkflowDashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);

  // Estados para modais
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showNewInstance, setShowNewInstance] = useState(false);
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);
  const [selectedWorkflowDetails, setSelectedWorkflowDetails] = useState<Workflow | null>(null);

  // Estados para formulários
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    type: 'project_approval' as const,
    is_parallel: false,
    requires_all_approvers: true,
    auto_approve_threshold: 2,
    default_timeout_hours: 72,
    escalation_timeout_hours: 168,
    business_hours_only: false,
    workflow_schema: [
      {
        name: 'Revisão Inicial',
        type: 'approval',
        approver_roles: ['project_manager'],
        required_approvals: 1,
        timeout_hours: 24
      }
    ]
  });

  const [newInstance, setNewInstance] = useState({
    workflow_id: '',
    title: '',
    description: '',
    reference_id: '',
    reference_type: '',
    priority: 'medium' as const,
    context_data: {},
    form_data: {}
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar workflows
      const workflowsResponse = await fetch('/api/workflows');
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        setWorkflows(workflowsData.data || []);
      }

      // Carregar instâncias
      const instancesResponse = await fetch('/api/workflows/instances?limit=50');
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json();
        setInstances(instancesData.data || []);
      }

      // Carregar templates
      const templatesResponse = await fetch('/api/workflows/templates');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.data || []);
      }

      // Carregar estatísticas
      const statsResponse = await fetch('/api/workflows/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWorkflow)
      });

      if (response.ok) {
        toast.success('Workflow criado com sucesso!');
        setShowNewWorkflow(false);
        setNewWorkflow({
          name: '',
          description: '',
          type: 'project_approval',
          is_parallel: false,
          requires_all_approvers: true,
          auto_approve_threshold: 2,
          default_timeout_hours: 72,
          escalation_timeout_hours: 168,
          business_hours_only: false,
          workflow_schema: [
            {
              name: 'Revisão Inicial',
              type: 'approval',
              approver_roles: ['project_manager'],
              required_approvals: 1,
              timeout_hours: 24
            }
          ]
        });
        await loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar workflow');
      }
    } catch (error) {
      console.error('Erro ao criar workflow:', error);
      toast.error('Erro ao criar workflow');
    }
  };

  const handleStartInstance = async () => {
    if (!newInstance.workflow_id || !newInstance.title) {
      toast.error('Workflow e título são obrigatórios');
      return;
    }

    try {
      const response = await fetch('/api/workflows/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInstance)
      });

      if (response.ok) {
        toast.success('Instância de workflow iniciada!');
        setShowNewInstance(false);
        setNewInstance({
          workflow_id: '',
          title: '',
          description: '',
          reference_id: '',
          reference_type: '',
          priority: 'medium',
          context_data: {},
          form_data: {}
        });
        await loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao iniciar instância');
      }
    } catch (error) {
      console.error('Erro ao iniciar instância:', error);
      toast.error('Erro ao iniciar instância');
    }
  };

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        toast.success(`Workflow ${!isActive ? 'ativado' : 'pausado'} com sucesso!`);
        await loadDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao alterar status do workflow');
      }
    } catch (error) {
      console.error('Erro ao alterar workflow:', error);
      toast.error('Erro ao alterar workflow');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'in_progress': return 'outline';
      case 'rejected': return 'destructive';
      case 'cancelled': return 'secondary';
      case 'expired': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'in_progress': return Activity;
      case 'rejected': return XCircle;
      case 'cancelled': return XCircle;
      case 'expired': return AlertTriangle;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'urgent': return 'text-orange-600 bg-orange-50';
      case 'high': return 'text-yellow-600 bg-yellow-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredInstances = instances.filter(instance => {
    const matchesSearch = instance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instance.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWorkflow = !selectedWorkflow || instance.workflows.id === selectedWorkflow;
    const matchesStatus = !selectedStatus || instance.status === selectedStatus;
    const matchesPriority = !selectedPriority || instance.priority === selectedPriority;
    
    return matchesSearch && matchesWorkflow && matchesStatus && matchesPriority;
  });

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
          Sistema de Workflow Automatizado
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie processos de aprovação e workflows automatizados
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="instances">Instâncias</TabsTrigger>
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Workflows</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview.total_workflows || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.overview.active_workflows || 0} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instâncias Ativas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.overview.pending_instances || 0) + (stats?.overview.in_progress_instances || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.overview.pending_instances || 0} pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.overview.completion_rate?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.overview.completed_instances || 0} concluídas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.overview.average_completion_hours?.toFixed(1) || 0}h
                </div>
                <p className="text-xs text-muted-foreground">
                  Para conclusão
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atividade Diária</CardTitle>
                <CardDescription>Instâncias criadas e concluídas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats?.daily_activity || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="created" stackId="1" stroke="#01b86c" fill="#01b86c" name="Criadas" />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Concluídas" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <CardDescription>Instâncias por status atual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.instances_by_status || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(stats?.instances_by_status || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Instâncias Recentes</CardTitle>
                <CardDescription>Últimas instâncias criadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recent_instances.slice(0, 5).map((instance) => {
                    const StatusIcon = getStatusIcon(instance.status);
                    return (
                      <div key={instance.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <StatusIcon className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <h4 className="font-medium">{instance.title}</h4>
                          <p className="text-sm text-gray-500">
                            {instance.workflows.name} • {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusBadgeColor(instance.status)}>
                            {instance.status}
                          </Badge>
                          <Badge className={getPriorityColor(instance.priority)}>
                            {instance.priority}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pendentes de Aprovação</CardTitle>
                <CardDescription>Instâncias aguardando sua aprovação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.pending_approvals.slice(0, 5).map((instance) => (
                    <div key={instance.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <UserCheck className="h-5 w-5 text-orange-500" />
                      <div className="flex-1">
                        <h4 className="font-medium">{instance.title}</h4>
                        <p className="text-sm text-gray-500">
                          Etapa {instance.current_step} de {instance.total_steps}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {Math.ceil((new Date(instance.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
                        </Badge>
                        <Button size="sm">
                          Revisar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Workflows</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Configure e gerencie seus workflows automatizados
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Dialog open={showNewWorkflow} onOpenChange={setShowNewWorkflow}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Workflow
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Workflow</DialogTitle>
                    <DialogDescription>
                      Configure um novo processo de aprovação automatizado
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="workflow-name">Nome</Label>
                        <Input
                          id="workflow-name"
                          value={newWorkflow.name}
                          onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome do workflow"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="workflow-type">Tipo</Label>
                        <Select 
                          value={newWorkflow.type} 
                          onValueChange={(value: any) => setNewWorkflow(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="project_approval">Aprovação de Projeto</SelectItem>
                            <SelectItem value="content_approval">Aprovação de Conteúdo</SelectItem>
                            <SelectItem value="budget_approval">Aprovação de Orçamento</SelectItem>
                            <SelectItem value="contract_approval">Aprovação de Contrato</SelectItem>
                            <SelectItem value="design_approval">Aprovação de Design</SelectItem>
                            <SelectItem value="payment_approval">Aprovação de Pagamento</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="workflow-description">Descrição</Label>
                      <Textarea
                        id="workflow-description"
                        value={newWorkflow.description}
                        onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva o propósito deste workflow"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timeout-hours">Timeout Padrão (horas)</Label>
                        <Input
                          id="timeout-hours"
                          type="number"
                          value={newWorkflow.default_timeout_hours}
                          onChange={(e) => setNewWorkflow(prev => ({ ...prev, default_timeout_hours: parseInt(e.target.value) }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="approve-threshold">Limite Auto-Aprovação</Label>
                        <Input
                          id="approve-threshold"
                          type="number"
                          value={newWorkflow.auto_approve_threshold}
                          onChange={(e) => setNewWorkflow(prev => ({ ...prev, auto_approve_threshold: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newWorkflow.is_parallel}
                          onCheckedChange={(checked) => setNewWorkflow(prev => ({ ...prev, is_parallel: checked }))}
                        />
                        <Label>Aprovações em Paralelo</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newWorkflow.business_hours_only}
                          onCheckedChange={(checked) => setNewWorkflow(prev => ({ ...prev, business_hours_only: checked }))}
                        />
                        <Label>Apenas Horário Comercial</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewWorkflow(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateWorkflow}>
                      Criar Workflow
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Workflow className="h-5 w-5 mr-2" />
                      {workflow.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Ativo' : 'Pausado'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleWorkflow(workflow.id, workflow.is_active)}
                      >
                        {workflow.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {workflow.description || 'Sem descrição'}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Tipo:</span>
                      <Badge variant="outline">{workflow.type.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total de Instâncias:</span>
                      <span className="font-medium">{workflow.total_instances}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Taxa de Conclusão:</span>
                      <span className="font-medium">
                        {workflow.total_instances > 0 
                          ? ((workflow.completed_instances / workflow.total_instances) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tempo Médio:</span>
                      <span className="font-medium">
                        {workflow.average_completion_time_hours?.toFixed(1) || 0}h
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={() => {
                        setNewInstance(prev => ({ ...prev, workflow_id: workflow.id }));
                        setShowNewInstance(true);
                      }}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Iniciar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="instances" className="space-y-6">
          {/* Filtros e Ações */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-1 flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar instâncias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os workflows" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os workflows</SelectItem>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as prioridades</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={showNewInstance} onOpenChange={setShowNewInstance}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Instância
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Iniciar Nova Instância</DialogTitle>
                  <DialogDescription>
                    Execute um workflow para um caso específico
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="instance-workflow">Workflow</Label>
                    <Select 
                      value={newInstance.workflow_id} 
                      onValueChange={(value) => setNewInstance(prev => ({ ...prev, workflow_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o workflow" />
                      </SelectTrigger>
                      <SelectContent>
                        {workflows.filter(w => w.is_active).map((workflow) => (
                          <SelectItem key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="instance-title">Título</Label>
                      <Input
                        id="instance-title"
                        value={newInstance.title}
                        onChange={(e) => setNewInstance(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Título da instância"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instance-priority">Prioridade</Label>
                      <Select 
                        value={newInstance.priority} 
                        onValueChange={(value: any) => setNewInstance(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instance-description">Descrição</Label>
                    <Textarea
                      id="instance-description"
                      value={newInstance.description}
                      onChange={(e) => setNewInstance(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o contexto desta instância"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reference-id">ID de Referência</Label>
                      <Input
                        id="reference-id"
                        value={newInstance.reference_id}
                        onChange={(e) => setNewInstance(prev => ({ ...prev, reference_id: e.target.value }))}
                        placeholder="Ex: PROJ-123, TASK-456"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reference-type">Tipo de Referência</Label>
                      <Input
                        id="reference-type"
                        value={newInstance.reference_type}
                        onChange={(e) => setNewInstance(prev => ({ ...prev, reference_type: e.target.value }))}
                        placeholder="Ex: project, task, contract"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewInstance(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleStartInstance}>
                    Iniciar Instância
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Instâncias */}
          <div className="space-y-4">
            {filteredInstances.map((instance) => {
              const StatusIcon = getStatusIcon(instance.status);
              const progressPercentage = (instance.current_step / instance.total_steps) * 100;
              
              return (
                <Card key={instance.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{instance.title}</h3>
                          <Badge variant={getStatusBadgeColor(instance.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {instance.status}
                          </Badge>
                          <Badge className={getPriorityColor(instance.priority)}>
                            {instance.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {instance.description || 'Sem descrição disponível'}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <Workflow className="h-4 w-4 mr-1" />
                            {instance.workflows.name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {instance.reference_id && (
                            <span className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {instance.reference_id}
                            </span>
                          )}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span>{instance.current_step} de {instance.total_steps}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#01b86c] h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium">{progressPercentage.toFixed(0)}%</span>
                        </div>
                        
                        {instance.due_date && (
                          <div className="flex items-center text-sm text-orange-600 mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            Vence em {Math.ceil((new Date(instance.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {['pending', 'in_progress'].includes(instance.status) && (
                          <Button size="sm">
                            <UserCheck className="h-4 w-4 mr-1" />
                            Revisar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredInstances.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma instância encontrada</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tente ajustar os filtros ou crie uma nova instância
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Aprovações Pendentes</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Instâncias que requerem sua aprovação
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {stats?.pending_approvals.map((instance) => (
              <Card key={instance.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{instance.title}</h3>
                        <Badge className={getPriorityColor(instance.priority)}>
                          {instance.priority}
                        </Badge>
                        <Badge variant="outline">
                          Etapa {instance.current_step} de {instance.total_steps}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Workflow: {instance.workflows.name}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Criado em {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center text-orange-600">
                          <Clock className="h-4 w-4 mr-1" />
                          Vence em {Math.ceil((new Date(instance.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Comentar
                      </Button>
                      <Button variant="outline">
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!stats?.pending_approvals || stats.pending_approvals.length === 0) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Todas as aprovações em dia!</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Você não tem nenhuma aprovação pendente no momento
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Templates de Workflow</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Templates reutilizáveis para criar workflows rapidamente
              </p>
            </div>
            
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="relative">
                {template.is_featured && (
                  <div className="absolute top-3 right-3">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    {template.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{template.category}</Badge>
                    {template.is_public && <Badge variant="secondary">Público</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {template.description || 'Sem descrição'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {template.usage_count} usos
                    </span>
                    <span>
                      {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex justify-between space-x-2">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button size="sm">
                      Usar Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Workflow</CardTitle>
                <CardDescription>Taxa de conclusão e tempo médio</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.workflow_performance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="workflow_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completion_rate" fill="#01b86c" name="Taxa de Conclusão (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>Instâncias por tipo de workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.instances_by_type || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(stats?.instances_by_type || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalhadas por Workflow</CardTitle>
              <CardDescription>Performance completa de cada workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.workflow_performance.map((perf, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{perf.workflow_name}</h4>
                      <p className="text-sm text-gray-500">{perf.workflow_type}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-8 text-center">
                      <div>
                        <div className="text-2xl font-bold">{perf.total_instances}</div>
                        <div className="text-xs text-gray-500">Instâncias</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{perf.completion_rate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">Taxa Conclusão</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{perf.avg_completion_hours.toFixed(1)}h</div>
                        <div className="text-xs text-gray-500">Tempo Médio</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}