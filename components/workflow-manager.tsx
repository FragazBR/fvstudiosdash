"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Play,
  Pause,
  BarChart3,
  FileText,
  Camera,
  Edit3,
  ThumbsUp,
  Settings,
  TrendingUp,
  Workflow,
  Plus,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WORKFLOW_STAGES, type WorkflowStage, type Project } from "@/types/workflow";

// Mock data para demonstração
const mockProject: Project = {
  id: "1",
  name: "Campanha Digital - TechCorp",
  client: {
    id: "client-1",
    name: "TechCorp Solutions",
    contact: {
      name: "João Silva",
      email: "joao@techcorp.com",
      phone: "(11) 99999-9999",
      company: "TechCorp Solutions",
      position: "Marketing Manager"
    },
    industry: "Tecnologia",
    size: "medium",
    goals: ["Aumentar Brand Awareness", "Gerar Leads Qualificados", "Aumentar Vendas Online"],
    currentChallenges: ["Baixo engajamento nas redes sociais", "Falta de conteúdo consistente"],
    budget: 50000,
    timeline: "3 meses"
  },
  currentStage: "criacao_conteudo",
  stages: WORKFLOW_STAGES.map((stage, index) => ({
    ...stage,
    status: index <= 6 ? (index === 6 ? 'in_progress' : 'completed') : 'not_started'
  })),
  timeline: {
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-04-15"),
    milestones: [
      { id: "1", name: "Kickoff Meeting", date: new Date("2024-01-15"), completed: true },
      { id: "2", name: "Strategy Approval", date: new Date("2024-01-28"), completed: true },
      { id: "3", name: "Content Production", date: new Date("2024-02-15"), completed: false },
      { id: "4", name: "Campaign Launch", date: new Date("2024-03-01"), completed: false }
    ]
  },
  budget: {
    total: 50000,
    allocated: 45000,
    spent: 28000,
    remaining: 22000,
    breakdown: [
      { category: "Estratégia & Planejamento", amount: 8000, spent: 8000 },
      { category: "Produção de Conteúdo", amount: 15000, spent: 12000 },
      { category: "Tráfego Pago", amount: 20000, spent: 8000 },
      { category: "Relatórios & Analytics", amount: 2000, spent: 0 }
    ]
  },
  team: [
    { id: "1", name: "Ana Silva", role: "Account Manager", avatar: "/avatars/ana-silva.png", email: "ana@agency.com", skills: ["Strategy", "Client Relations"] },
    { id: "2", name: "Carlos Santos", role: "Creative Director", avatar: "/avatars/carlos-santos.png", email: "carlos@agency.com", skills: ["Design", "Video"] },
    { id: "3", name: "Marina Costa", role: "Content Creator", avatar: "/avatars/marina-costa.png", email: "marina@agency.com", skills: ["Copy", "Social Media"] }
  ],
  status: "production",
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-02-18")
};

const getStageIcon = (stageId: string) => {
  const iconMap: Record<string, React.ElementType> = {
    atendimento: Users,
    analise_diagnostico: BarChart3,
    planejamento_execucao: FileText,
    desenvolvimento_processos: Settings,
    agendamento_producoes: Calendar,
    execucao_producoes: Camera,
    criacao_conteudo: Edit3,
    aprovacao: ThumbsUp,
    ajustes_finais: CheckCircle,
    trafego_gestao: TrendingUp,
    relatorio_metricas: BarChart3
  };
  return iconMap[stageId] || Clock;
};

const getStageColor = (status: WorkflowStage['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    case 'blocked':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700';
  }
};

const getStatusIcon = (status: WorkflowStage['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'in_progress':
      return <Play className="h-4 w-4" />;
    case 'blocked':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export function WorkflowManager() {
  const [selectedProject] = useState<Project>(mockProject);
  const [activeTab, setActiveTab] = useState("overview");

  const completedStages = selectedProject.stages.filter(stage => stage.status === 'completed').length;
  const totalStages = selectedProject.stages.length;
  const progressPercentage = (completedStages / totalStages) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Workflow do Projeto
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe todas as etapas do processo da agência
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver Cliente
          </Button>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-[#64f481] dark:hover:bg-[#4ade80] dark:text-black">
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                {selectedProject.name}
              </CardTitle>
              <CardDescription className="mt-1">
                Cliente: {selectedProject.client.name} • {selectedProject.client.industry}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {selectedProject.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Progresso Geral</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {completedStages}/{totalStages} etapas
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {Math.round(progressPercentage)}% concluído
              </p>
            </div>

            {/* Budget */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Orçamento</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  R$ {selectedProject.budget.spent.toLocaleString()} / R$ {selectedProject.budget.total.toLocaleString()}
                </span>
              </div>
              <Progress value={(selectedProject.budget.spent / selectedProject.budget.total) * 100} className="h-2" />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                R$ {selectedProject.budget.remaining.toLocaleString()} restante
              </p>
            </div>

            {/* Timeline */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Timeline</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {Math.ceil((selectedProject.timeline.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                {selectedProject.timeline.startDate.toLocaleDateString()} - {selectedProject.timeline.endDate.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Equipe do Projeto</h4>
              <div className="flex items-center -space-x-2">
                {selectedProject.team.map((member) => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-white dark:border-[#171717]">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Contato do Cliente</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedProject.client.contact.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {selectedProject.client.contact.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Stages */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="stages">Etapas Detalhadas</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedProject.stages.map((stage, index) => {
              const StageIcon = getStageIcon(stage.id);
              const isNext = stage.status === 'not_started' && 
                            (index === 0 || selectedProject.stages[index - 1].status === 'completed');

              return (
                <Card key={stage.id} className={cn(
                  "bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-2 transition-all duration-200",
                  getStageColor(stage.status),
                  isNext && "ring-2 ring-blue-500 dark:ring-[#64f481] ring-opacity-50"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <StageIcon className="h-5 w-5" />
                        <span className="text-xs font-medium">#{index + 1}</span>
                      </div>
                      {getStatusIcon(stage.status)}
                    </div>
                    <CardTitle className="text-sm font-semibold leading-tight">
                      {stage.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {stage.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-500">Duração:</span>
                        <span className="font-medium">{stage.duration}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-500">Ferramentas:</span>
                        <span className="font-medium">{stage.tools.length}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-500">Entregáveis:</span>
                        <span className="font-medium">{stage.deliverables.length}</span>
                      </div>
                    </div>

                    {isNext && (
                      <Button size="sm" className="w-full mt-3 bg-blue-600 hover:bg-blue-700 dark:bg-[#64f481] dark:hover:bg-[#4ade80] dark:text-black">
                        <Play className="h-3 w-3 mr-1" />
                        Iniciar Etapa
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          {selectedProject.stages.map((stage, index) => {
            const StageIcon = getStageIcon(stage.id);
            
            return (
              <Card key={stage.id} className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        getStageColor(stage.status)
                      )}>
                        <StageIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                          {stage.name}
                        </CardTitle>
                        <CardDescription>
                          Etapa {index + 1} • Duração: {stage.duration}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={cn("text-xs", getStageColor(stage.status))} variant="outline">
                      {stage.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Descrição</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{stage.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Ferramentas</h4>
                      <div className="flex flex-wrap gap-1">
                        {stage.tools.map((tool, toolIndex) => (
                          <Badge key={toolIndex} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Entregáveis</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {stage.deliverables.map((deliverable, delIndex) => (
                          <li key={delIndex} className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2 text-gray-400" />
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Timeline do Projeto</CardTitle>
              <CardDescription>Marcos importantes e prazos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedProject.timeline.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center space-x-4">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      milestone.completed ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={cn(
                          "text-sm font-medium",
                          milestone.completed ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                        )}>
                          {milestone.name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {milestone.date.toLocaleDateString()}
                        </span>
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
