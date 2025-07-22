"use client";
import { useState } from "react";
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
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DonutChart } from "./donut-chart";
import { AreaChart } from "./area-chart";
import { BarChart } from "./bar-chart";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/hooks/useUser";

// Mock data para demonstração
const agencyStats = {
  totalClients: 24,
  activeProjects: 12,
  monthlyRevenue: 85400,
  revenueGrowth: 12.3,
  teamMembers: 8,
  completedProjects: 156,
  clientSatisfaction: 4.8,
  projectsOnTime: 94
};

const recentProjects = [
  {
    id: 1,
    name: "Website Redesign - TechCorp",
    client: "TechCorp Solutions",
    status: "in_progress",
    deadline: "2024-02-15",
    progress: 75,
    budget: 15000,
    team: ["Alex Morgan", "Jessica Chen"],
    priority: "high"
  },
  {
    id: 2,
    name: "Brand Identity - StartupX",
    client: "StartupX Inc",
    status: "review",
    deadline: "2024-01-28",
    progress: 90,
    budget: 8500,
    team: ["Sarah Johnson", "David Kim"],
    priority: "medium"
  },
  {
    id: 3,
    name: "Mobile App Development",
    client: "RetailPro",
    status: "planning",
    deadline: "2024-03-20",
    progress: 25,
    budget: 25000,
    team: ["Ryan Park", "Jessica Chen", "Alex Morgan"],
    priority: "high"
  },
  {
    id: 4,
    name: "E-commerce Platform",
    client: "Fashion Forward",
    status: "completed",
    deadline: "2024-01-10",
    progress: 100,
    budget: 18000,
    team: ["Sarah Johnson", "David Kim"],
    priority: "low"
  }
];

const teamPerformance = [
  {
    id: 1,
    name: "Alex Morgan",
    role: "Lead Designer",
    avatar: "/avatars/alex-morgan.png",
    activeProjects: 3,
    completedTasks: 28,
    efficiency: 95,
    clientRating: 4.9
  },
  {
    id: 2,
    name: "Jessica Chen",
    role: "Frontend Developer",
    avatar: "/avatars/jessica-chen.png",
    activeProjects: 2,
    completedTasks: 34,
    efficiency: 92,
    clientRating: 4.7
  },
  {
    id: 3,
    name: "Sarah Johnson",
    role: "Project Manager",
    avatar: "/avatars/sarah-johnson.png",
    activeProjects: 4,
    completedTasks: 22,
    efficiency: 88,
    clientRating: 4.8
  },
  {
    id: 4,
    name: "David Kim",
    role: "Backend Developer",
    avatar: "/avatars/david-kim.png",
    activeProjects: 2,
    completedTasks: 31,
    efficiency: 90,
    clientRating: 4.6
  }
];

const recentClients = [
  {
    id: 1,
    name: "TechCorp Solutions",
    contact: "John Smith",
    email: "john@techcorp.com",
    projects: 3,
    totalValue: 45000,
    status: "active"
  },
  {
    id: 2,
    name: "StartupX Inc",
    contact: "Maria Garcia",
    email: "maria@startupx.com",
    projects: 1,
    totalValue: 8500,
    status: "review"
  },
  {
    id: 3,
    name: "RetailPro",
    contact: "David Wilson",
    email: "david@retailpro.com",
    projects: 2,
    totalValue: 32000,
    status: "active"
  }
];

export function AgencyDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'planning':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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
          {/* Header da Agência */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Bem-vindo, {user?.name || 'Agência'}! 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Aqui está um resumo do desempenho da sua agência hoje
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Este mês
                </Button>
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-[#64f481] dark:hover:bg-[#4ade80] dark:text-black">
                  <Target className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Button>
              </div>
            </div>
          </div>

          {/* KPIs Principais */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Métricas Principais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Clientes Ativos"
                value={agencyStats.totalClients.toString()}
                icon={Building2}
                change="+8"
                changeText="vs. mês anterior"
                trend="up"
              />
              <StatCard
                title="Projetos em Andamento"
                value={agencyStats.activeProjects.toString()}
                icon={Briefcase}
                change="+2"
                changeText="novos este mês"
                trend="up"
              />
              <StatCard
                title="Receita Mensal"
                value={`R$ ${agencyStats.monthlyRevenue.toLocaleString()}`}
                icon={DollarSign}
                change={`+${agencyStats.revenueGrowth}%`}
                changeText="crescimento"
                trend="up"
              />
              <StatCard
                title="Satisfação do Cliente"
                value={`${agencyStats.clientSatisfaction}/5`}
                icon={Star}
                change="+0.2"
                changeText="avaliação média"
                trend="up"
              />
            </div>
          </section>

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
                  {recentProjects.map((project) => (
                    <div key={project.id} className="p-4 rounded-lg border border-gray-100 dark:border-[#1f1f1f] hover:border-gray-200 dark:hover:border-[#64f481]/20 transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{project.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{project.client}</p>
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
                          <span className="font-medium text-gray-900 dark:text-gray-100">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Prazo: {new Date(project.deadline).toLocaleDateString()}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">R$ {project.budget.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Performance da Equipe */}
            <div>
              <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Equipe</CardTitle>
                  <CardDescription>Performance individual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teamPerformance.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 dark:border-[#1f1f1f] hover:border-gray-200 dark:hover:border-[#64f481]/20 transition-all duration-200">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{member.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{member.role}</p>
                        <div className="flex items-center mt-1">
                          <Activity className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-xs text-green-600 dark:text-green-400">{member.efficiency}% eficiência</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {member.activeProjects}
                        </div>
                        <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          {member.clientRating}
                        </div>
                      </div>
                    </div>
                  ))}
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
                <DonutChart data={[
                  { name: "Em Andamento", value: 45, color: "#3b82f6" },
                  { name: "Planejamento", value: 25, color: "#8b5cf6" },
                  { name: "Revisão", value: 20, color: "#f59e0b" },
                  { name: "Concluído", value: 10, color: "#10b981" }
                ]} />
              </CardContent>
            </Card>
          </div>

          {/* Clientes Recentes */}
          <section>
            <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Clientes Recentes</CardTitle>
                  <CardDescription>Novos e ativos</CardDescription>
                </div>
                <Link href="/contacts">
                  <Button variant="ghost" size="sm">Ver todos</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-[#1f1f1f] hover:border-gray-200 dark:hover:border-[#64f481]/20 transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{client.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{client.contact} • {client.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{client.projects} projetos</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">R$ {client.totalValue.toLocaleString()}</p>
                        </div>
                        <Badge className={getStatusColor(client.status)} variant="secondary">
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
