"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "./sidebar";
import Topbar from "./Shared/Topbar";
import { StatCard } from "./stat-card";
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Briefcase,
  MessageSquare,
  Star,
  Award,
  Loader2,
  Plus,
  Download,
  Eye,
  RefreshCw,
  ArrowUp,
  FileText,
  FolderPlus
} from "lucide-react";
import { DonutChart } from "./donut-chart";
import { AreaChart } from "./area-chart";
import { BarChart } from "./bar-chart";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { Send, UserPlus, Mail } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDashboardData } from "@/hooks/useDashboardData";
import { TeamManagement } from "./team-management";
import { supabaseBrowser } from '@/lib/supabaseBrowser';

// Real data interfaces
interface Contract {
  id: string;
  clientName: string;
  contractType: string;
  monthlyValue: number;
  status: string;
  paymentStatus: string;
  services: string[];
  remainingMonths: number;
  nextBillingDate: string;
}

interface AgencyMetrics {
  financial: {
    monthlyRevenue: number;
    recurringRevenue: number;
    profitMargin: number;
    growthRate: number;
    totalOutstanding: number;
  };
  clients: {
    totalActive: number;
    newThisMonth: number;
    churnedThisMonth: number;
    satisfactionScore: number;
    contractsExpiring: number;
  };
  performance: {
    projectsCompleted: number;
    teamUtilization: number;
    clientRetentionRate: number;
    onTimeDelivery: number;
  };
}

// Helper functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0 
  }).format(value);
};

const calculateProjectProgress = (project: any): number => {
  // Use progress field from database if available, otherwise calculate from tasks
  if (project.progress !== undefined && project.progress !== null) {
    return project.progress;
  }
  
  if (!project.tasks || !Array.isArray(project.tasks) || project.tasks.length === 0) {
    return 0;
  }
  
  const completedTasks = project.tasks.filter((task: any) => task?.status === 'completed').length;
  return Math.round((completedTasks / project.tasks.length) * 100);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'up_to_date': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'in_progress': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400';
    case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'planning': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

export function AgencyDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'agency_staff',
    company: '',
    phone: '',
    password: '',
    mode: 'direct' // 'direct' ou 'invite'
  });
  
  // Real data state
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [agencyMetrics, setAgencyMetrics] = useState<AgencyMetrics | null>(null);
  const [realDataLoading, setRealDataLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { data: analytics, loading: analyticsLoading } = useAnalytics('30');
  const { recentProjects, recentClients, loading: dashboardLoading } = useDashboardData();
  
  const isLoading = analyticsLoading || dashboardLoading || realDataLoading;

  // Fetch real contract data
  const fetchContracts = async () => {
    try {
      const supabase = supabaseBrowser();
      
      // Buscar projetos ativos diretamente da tabela projects
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          budget_total,
          start_date,
          end_date,
          client:contacts(name)
        `)
        .eq('status', 'active')
        .limit(20);
      
      if (error) throw error;
      
      // Transform project data to contract format
      const contractData = (projects || []).map((project: any) => ({
        id: project.id,
        clientName: project.client?.name || 'Cliente não informado',
        contractType: 'project',
        monthlyValue: project.budget_total || 0,
        status: project.status,
        paymentStatus: 'up_to_date', // Default status
        services: ['Projeto Digital'],
        remainingMonths: 0,
        nextBillingDate: '2024-12-01'
      }));
      
      setContracts(contractData);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Erro ao carregar contratos');
      setContracts([]); // Set empty array on error
    }
  };

  // Fetch real agency metrics
  const fetchAgencyMetrics = async () => {
    try {
      const supabase = supabaseBrowser();
      
      // Buscar métricas básicas das tabelas existentes
      const [projectsResult, contactsResult, tasksResult] = await Promise.all([
        supabase.from('projects').select('status, budget_total').eq('agency_id', user?.agency_id),
        supabase.from('contacts').select('type, status').eq('agency_id', user?.agency_id),
        supabase.from('tasks').select('status').eq('agency_id', user?.agency_id)
      ]);
      
      const projects = projectsResult.data || [];
      const contacts = contactsResult.data || [];
      const tasks = tasksResult.data || [];
      
      // Calcular métricas básicas
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const totalRevenue = projects.reduce((sum, p) => sum + (p.budget_total || 0), 0);
      const activeClients = contacts.filter(c => c.status === 'active').length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      
      setAgencyMetrics({
        financial: {
          monthlyRevenue: totalRevenue,
          recurringRevenue: totalRevenue * 0.8, // Estimativa
          profitMargin: 25, // Valor padrão
          growthRate: 15, // Valor padrão
          totalOutstanding: 0
        },
        clients: {
          totalActive: activeClients,
          newThisMonth: Math.floor(activeClients * 0.1), // Estimativa
          churnedThisMonth: 0,
          satisfactionScore: 4.5, // Valor padrão
          contractsExpiring: 0
        },
        performance: {
          projectsCompleted: projects.filter(p => p.status === 'completed').length,
          teamUtilization: 85, // Valor padrão
          clientRetentionRate: 92, // Valor padrão
          onTimeDelivery: completedTasks
        }
      });
    } catch (error) {
      console.error('Error fetching agency metrics:', error);
      toast.error('Erro ao carregar métricas');
      // Set default metrics on error
      setAgencyMetrics({
        financial: { monthlyRevenue: 0, recurringRevenue: 0, profitMargin: 0, growthRate: 0, totalOutstanding: 0 },
        clients: { totalActive: 0, newThisMonth: 0, churnedThisMonth: 0, satisfactionScore: 0, contractsExpiring: 0 },
        performance: { projectsCompleted: 0, teamUtilization: 0, clientRetentionRate: 0, onTimeDelivery: 0 }
      });
    }
  };

  // Initialize real data on component mount
  useEffect(() => {
    const initializeDashboard = async () => {
      setRealDataLoading(true);
      await Promise.all([
        fetchContracts(),
        fetchAgencyMetrics()
      ]);
      setRealDataLoading(false);
    };
    
    initializeDashboard();
  }, []);

  // Set initial tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['dashboard', 'contracts', 'financial', 'team', 'analytics', 'management'].includes(tabParam)) {
      setSelectedTab(tabParam);
    }
  }, [searchParams]);

  // Handle tab change with financial redirect
  const handleTabChange = (value: string) => {
    if (value === 'financial') {
      router.push('/agency/financial');
      return;
    }
    setSelectedTab(value);
  };

  // Handle invite form submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.can_manage_team) {
      toast.error('Você não tem permissão para convidar colaboradores');
      return;
    }

    try {
      if (inviteForm.mode === 'direct') {
        // Cadastro direto com senha
        const { data, error } = await supabaseBrowser().rpc('create_user_with_profile', {
          p_email: inviteForm.email,
          p_password: inviteForm.password,
          p_name: inviteForm.name,
          p_role: inviteForm.role,
          p_agency_id: user?.agency_id || user?.id,
          p_company: inviteForm.company,
          p_phone: inviteForm.phone
        });

        if (error) {
          console.error('Erro ao criar usuário:', error);
          toast.error('Erro ao criar usuário: ' + error.message);
          return;
        }

        // Check if the function returned an error in the data
        if (data && !data.success) {
          console.error('Erro na função create_user_with_profile:', data.error);
          toast.error('Erro ao criar usuário: ' + data.error);
          return;
        }

        toast.success(`Colaborador ${inviteForm.name} criado com sucesso!`);
      } else {
        // Sistema de convite por email
        const { data, error } = await supabaseBrowser().rpc('create_user_invitation', {
          p_email: inviteForm.email,
          p_name: inviteForm.name,
          p_role: inviteForm.role,
          p_agency_id: user?.agency_id || user?.id,
          p_company: inviteForm.company,
          p_phone: inviteForm.phone,
          p_welcome_message: `Você foi convidado para fazer parte da equipe da ${user?.company || 'nossa agência'}!`
        });

        if (error) {
          console.error('Erro ao criar convite:', error);
          toast.error('Erro ao enviar convite: ' + error.message);
          return;
        }

        toast.success(`Convite enviado para ${inviteForm.email}!`);
      }

      setInviteForm({ name: '', email: '', role: 'agency_staff', company: '', phone: '', password: '', mode: 'direct' });
      setInviteDialogOpen(false);

    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      toast.error('Erro ao processar solicitação');
    }
  };

  return (
    <div className="bg-[#fafafa] dark:bg-[#121212] min-h-screen font-inter">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:w-[calc(100%-16rem)] lg:ml-64 flex flex-col overflow-hidden pt-16">
        <Topbar
          name="Dashboard da Agência"
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Gestão da Agência
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Dashboard completo com dados reais e controle avançado
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Este mês
                </Button>
                {user?.can_manage_team && (
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Colaborador
                        <Users className="h-4 w-4 ml-2" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {inviteForm.mode === 'direct' ? 'Criar Colaborador' : 'Enviar Convite'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleInviteSubmit} className="space-y-4">
                        {/* Toggle para modo de criação */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            {inviteForm.mode === 'direct' ? (
                              <UserPlus className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Mail className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-sm font-medium">
                              {inviteForm.mode === 'direct' ? 'Criar usuário direto' : 'Enviar convite por email'}
                            </span>
                          </div>
                          <Switch
                            checked={inviteForm.mode === 'invite'}
                            onCheckedChange={(checked) => 
                              setInviteForm({...inviteForm, mode: checked ? 'invite' : 'direct'})
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            value={inviteForm.name}
                            onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                            placeholder="Nome completo"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                            placeholder="email@exemplo.com"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="role">Cargo</Label>
                          <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agency_manager">Gerente</SelectItem>
                              <SelectItem value="agency_staff">Colaborador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Campo senha só aparece no modo direto */}
                        {inviteForm.mode === 'direct' && (
                          <div>
                            <Label htmlFor="password">Senha</Label>
                            <Input
                              id="password"
                              type="password"
                              value={inviteForm.password}
                              onChange={(e) => setInviteForm({...inviteForm, password: e.target.value})}
                              placeholder="Senha para acesso"
                              required
                              minLength={6}
                            />
                          </div>
                        )}

                        <div>
                          <Label htmlFor="phone">Telefone (opcional)</Label>
                          <Input
                            id="phone"
                            value={inviteForm.phone}
                            onChange={(e) => setInviteForm({...inviteForm, phone: e.target.value})}
                            placeholder="(11) 99999-9999"
                          />
                        </div>

                        <Button type="submit" className="w-full">
                          {inviteForm.mode === 'direct' ? (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Criar Colaborador
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar Convite
                            </>
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                <Link href="/projects">
                  <Button 
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Projeto
                    <FolderPlus className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="contracts">Contratos</TabsTrigger>
                <TabsTrigger value="financial">Controle Financeiro</TabsTrigger>
                <TabsTrigger value="team">Equipe</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="management">Gestão</TabsTrigger>
              </TabsList>

              {/* Dashboard Tab - Dados Reais */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Welcome Message */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Bem-vindo, {user?.name || 'Agência'}! 👋
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Aqui está um resumo do desempenho da sua agência
                  </p>
                </div>

                {/* KPIs Principais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} className="p-6"><Skeleton className="h-16 w-full" /></Card>
                    ))
                  ) : (
                    <>
                      <StatCard
                        title="Clientes Ativos"
                        value={analytics?.analytics.contacts.active.toString() || '0'}
                        icon={Building2}
                        change={`+${analytics?.analytics.contacts.total || 0}`}
                        changeText="total de contatos"
                        trend="up"
                      />
                      <StatCard
                        title="Projetos em Andamento"
                        value={analytics?.analytics.projects.active.toString() || '0'}
                        icon={Briefcase}
                        change={`${analytics?.analytics.projects.total || 0} total`}
                        changeText="projetos cadastrados"
                        trend="up"
                      />
                      <StatCard
                        title="Receita Total"
                        value={`R$ ${(analytics?.analytics.projects.revenue.total || 0).toLocaleString()}`}
                        icon={DollarSign}
                        change={`R$ ${(analytics?.analytics.projects.revenue.spent || 0).toLocaleString()}`}
                        changeText="já executado"
                        trend="up"
                      />
                      <StatCard
                        title="Taxa de Conclusão"
                        value={`${analytics?.analytics.tasks.completed || 0}/${analytics?.analytics.tasks.total || 0}`}
                        icon={CheckCircle}
                        change={`${Math.round(((analytics?.analytics.tasks.completed || 0) / (analytics?.analytics.tasks.total || 1)) * 100)}%`}
                        changeText="tarefas concluídas"
                        trend="up"
                      />
                    </>
                  )}
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Projetos Recentes */}
                  <div className="lg:col-span-2">
                    <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-gray-100">Projetos Ativos</CardTitle>
                          <CardDescription>Acompanhamento em tempo real</CardDescription>
                        </div>
                        <Link href="/projects">
                          <Button variant="ghost" size="sm">Ver todos</Button>
                        </Link>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isLoading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-lg border">
                              <Skeleton className="h-20 w-full" />
                            </div>
                          ))
                        ) : (recentProjects && recentProjects.length > 0) ? (
                          recentProjects.map((project) => {
                            const progress = calculateProjectProgress(project);
                            return (
                              <div key={project.id} className="p-4 rounded-lg border border-gray-100 dark:border-[#1f1f1f] hover:border-[#64f481]/20 dark:hover:border-[#64f481]/20 transition-all duration-200">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                      {project.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {project.client?.company || project.client?.name || 'Sem cliente'}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={getPriorityColor(project.priority)} variant="secondary">
                                      {project.priority}
                                    </Badge>
                                    <Badge className={getStatusColor(project.status)} variant="secondary">
                                      {project.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{progress}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Criado: {new Date(project.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {project.budget_total ? `R$ ${project.budget_total.toLocaleString()}` : 'Orçamento não definido'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <Briefcase className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Nenhum projeto encontrado</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Estatísticas de Tarefas */}
                  <div>
                    <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
                      <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-gray-100">Tarefas</CardTitle>
                        <CardDescription>Visão geral das atividades</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isLoading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-8" />
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-[#1f1f1f]">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Concluídas</span>
                              </div>
                              <span className="font-semibold text-green-600">{analytics?.analytics.tasks.completed || 0}</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-[#1f1f1f]">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Em Progresso</span>
                              </div>
                              <span className="font-semibold text-blue-600">{analytics?.analytics.tasks.in_progress || 0}</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-[#1f1f1f]">
                              <div className="flex items-center space-x-2">
                                <Activity className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{analytics?.analytics.tasks.total || 0}</span>
                            </div>

                            {analytics?.analytics.tasks.hours && (
                              <div className="pt-3 border-t border-gray-100 dark:border-[#1f1f1f]">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Horas estimadas</span>
                                  <span className="font-medium">{analytics.analytics.tasks.hours.estimated}h</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">Horas realizadas</span>
                                  <span className="font-medium">{analytics.analytics.tasks.hours.actual}h</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Estatísticas e Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Receita por Mês */}
                  <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-gray-100">Receita Mensal</CardTitle>
                      <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AreaChart />
                    </CardContent>
                  </Card>

                  {/* Distribuição de Projetos */}
                  <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-gray-100">Status dos Projetos</CardTitle>
                      <CardDescription>Distribuição atual</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : analytics ? (
                        <DonutChart data={[
                          { 
                            name: "Ativos", 
                            value: analytics.analytics.projects.active || 0, 
                            color: "#3b82f6" 
                          },
                          { 
                            name: "Concluídos", 
                            value: analytics.analytics.projects.completed || 0, 
                            color: "#10b981" 
                          },
                          { 
                            name: "Outros", 
                            value: (analytics.analytics.projects.total - analytics.analytics.projects.active - analytics.analytics.projects.completed) || 0, 
                            color: "#6b7280" 
                          }
                        ]} />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">Dados não disponíveis</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Clientes Recentes */}
                <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-gray-100">Clientes Recentes</CardTitle>
                      <CardDescription>Novos e ativos</CardDescription>
                    </div>
                    <Link href="/contas">
                      <Button variant="ghost" size="sm">Ver todos</Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {isLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center space-x-4">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <Skeleton className="h-6 w-16" />
                          </div>
                        ))
                      ) : (recentClients && recentClients.length > 0) ? (
                        recentClients.map((client) => (
                          <div key={client.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-[#1f1f1f] hover:border-[#64f481]/20 dark:hover:border-[#64f481]/20 transition-all duration-200">
                            <div className="flex items-center space-x-4">
                              <Avatar>
                                <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{client.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {client.company && `${client.company} • `}{client.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {client.active_projects || 0} projetos
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {client.total_project_value 
                                    ? `R$ ${client.total_project_value.toLocaleString()}` 
                                    : 'R$ 0'
                                  }
                                </p>
                              </div>
                              <Badge className={getStatusColor(client.status)} variant="secondary">
                                {client.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Nenhum cliente encontrado</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contracts Tab */}
              <TabsContent value="contracts" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contratos</h2>
                    <p className="text-gray-600 dark:text-gray-400">Gestão de contratos e pagamentos</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Contrato
                    </Button>
                  </div>
                </div>

                {/* Métricas de Contratos */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Receita Mensal</p>
                          <p className="text-2xl font-semibold">{formatCurrency(agencyMetrics?.financial.monthlyRevenue || 0)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">+{agencyMetrics?.financial.growthRate || 0}%</span>
                          </div>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">MRR (Receita Recorrente)</p>
                          <p className="text-2xl font-semibold">{formatCurrency(agencyMetrics?.financial.recurringRevenue || 0)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <ArrowUp className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">+8.4%</span>
                          </div>
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Margem de Lucro</p>
                          <p className="text-2xl font-semibold">{agencyMetrics?.financial.profitMargin || 0}%</p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">+2.1%</span>
                          </div>
                        </div>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clientes Ativos</p>
                          <p className="text-2xl font-semibold">{agencyMetrics?.clients.totalActive || 0}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-600">+{agencyMetrics?.clients.newThisMonth || 0} este mês</span>
                          </div>
                        </div>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Contratos */}
                <Card className="bg-white/90 dark:bg-[#171717]/60">
                  <CardHeader>
                    <CardTitle>Contratos Ativos</CardTitle>
                    <CardDescription>Lista completa de contratos e status de pagamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contracts.map((contract) => (
                        <div key={contract.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-[#1f1f1f] rounded-lg hover:border-[#64f481]/20 dark:hover:border-[#64f481]/20 transition-all duration-200">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>{contract.clientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{contract.clientName}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>{contract.contractType}</span>
                                <span>•</span>
                                <span>{contract.services.join(', ')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {formatCurrency(contract.monthlyValue)}/mês
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {contract.remainingMonths} meses restantes
                              </p>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <Badge className={getStatusColor(contract.status)}>
                                {contract.status}
                              </Badge>
                              <Badge className={getStatusColor(contract.paymentStatus)} variant="outline">
                                {contract.paymentStatus}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-400">Análise detalhada de performance</p>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/90 dark:bg-[#171717]/60">
                    <CardHeader>
                      <CardTitle>Performance Geral</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Projetos Completados</span>
                        <span className="font-semibold">{agencyMetrics?.performance.projectsCompleted || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Utilização da Equipe</span>
                        <span className="font-semibold">{agencyMetrics?.performance.teamUtilization || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Retenção de Clientes</span>
                        <span className="font-semibold">{agencyMetrics?.performance.clientRetentionRate || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Entrega no Prazo</span>
                        <span className="font-semibold">{agencyMetrics?.performance.onTimeDelivery || 0}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60">
                    <CardHeader>
                      <CardTitle>Métricas de Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Novos este Mês</span>
                        <span className="font-semibold text-green-600">+{agencyMetrics?.clients.newThisMonth || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Perdidos este Mês</span>
                        <span className="font-semibold text-red-600">-{agencyMetrics?.clients.churnedThisMonth || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Satisfação Média</span>
                        <span className="font-semibold">{agencyMetrics?.clients.satisfactionScore || 0}/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Contratos Expirando</span>
                        <span className="font-semibold text-yellow-600">{agencyMetrics?.clients.contractsExpiring || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60">
                    <CardHeader>
                      <CardTitle>Indicadores Financeiros</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Crescimento</span>
                        <span className="font-semibold text-green-600">+{agencyMetrics?.financial.growthRate || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Pendências</span>
                        <span className="font-semibold text-red-600">{formatCurrency(agencyMetrics?.financial.totalOutstanding || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Margem de Lucro</span>
                        <span className="font-semibold">{agencyMetrics?.financial.profitMargin || 0}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/90 dark:bg-[#171717]/60">
                    <CardHeader>
                      <CardTitle>Evolução da Receita</CardTitle>
                      <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AreaChart />
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60">
                    <CardHeader>
                      <CardTitle>Performance por Projeto</CardTitle>
                      <CardDescription>Comparativo mensal</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BarChart />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="space-y-6">
                <TeamManagement />
              </TabsContent>

              {/* Management Tab */}
              <TabsContent value="management" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Gestão Avançada</h2>
                  <p className="text-gray-600 dark:text-gray-400">Controle financeiro e operacional</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="bg-white/90 dark:bg-[#171717]/60">
                    <CardHeader>
                      <CardTitle>Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Relatório Financeiro
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Análise de Clientes
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Dashboard Executivo
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Planejamento Estratégico
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 dark:bg-[#171717]/60 lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Resumo Executivo</CardTitle>
                      <CardDescription>Principais métricas e insights</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-green-900 dark:text-green-100">Performance Positiva</h4>
                          </div>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            A agência está com crescimento de {agencyMetrics?.financial.growthRate || 0}% e margem de lucro saudável de {agencyMetrics?.financial.profitMargin || 0}%.
                          </p>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Clientes</h4>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {agencyMetrics?.clients.totalActive || 0} clientes ativos com satisfação de {agencyMetrics?.clients.satisfactionScore || 0}/10. 
                            {agencyMetrics?.clients.contractsExpiring || 0} contratos expirando nos próximos 3 meses.
                          </p>
                        </div>

                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Atenção</h4>
                          </div>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            {formatCurrency(agencyMetrics?.financial.totalOutstanding || 0)} em pendências de pagamento requerem acompanhamento.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}