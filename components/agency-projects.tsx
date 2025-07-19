"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: number;
  name: string;
  client: string;
  status: "planning" | "in_progress" | "review" | "completed" | "on_hold";
  priority: "low" | "medium" | "high";
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  deadline: string;
  team: Array<{
    id: number;
    name: string;
    avatar: string;
    role: string;
  }>;
  description: string;
  tags: string[];
}

const mockProjects: Project[] = [
  {
    id: 1,
    name: "Website Redesign - TechCorp",
    client: "TechCorp Solutions",
    status: "in_progress",
    priority: "high",
    progress: 75,
    budget: 15000,
    spent: 11250,
    startDate: "2024-01-15",
    deadline: "2024-02-15",
    team: [
      { id: 1, name: "Alex Morgan", avatar: "/avatars/alex-morgan.png", role: "Designer" },
      { id: 2, name: "Jessica Chen", avatar: "/avatars/jessica-chen.png", role: "Developer" }
    ],
    description: "Redesign completo do website corporativo com foco em UX/UI moderno",
    tags: ["Website", "Design", "Development"]
  },
  {
    id: 2,
    name: "Brand Identity - StartupX",
    client: "StartupX Inc",
    status: "review",
    priority: "medium",
    progress: 90,
    budget: 8500,
    spent: 7650,
    startDate: "2024-01-08",
    deadline: "2024-01-28",
    team: [
      { id: 3, name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png", role: "Brand Designer" },
      { id: 4, name: "David Kim", avatar: "/avatars/david-kim.png", role: "Creative Director" }
    ],
    description: "Desenvolvimento de identidade visual completa para startup de tecnologia",
    tags: ["Branding", "Logo", "Identity"]
  },
  {
    id: 3,
    name: "Mobile App Development",
    client: "RetailPro",
    status: "planning",
    priority: "high",
    progress: 25,
    budget: 25000,
    spent: 3000,
    startDate: "2024-02-01",
    deadline: "2024-03-20",
    team: [
      { id: 5, name: "Ryan Park", avatar: "/avatars/ryan-park.png", role: "Project Manager" },
      { id: 2, name: "Jessica Chen", avatar: "/avatars/jessica-chen.png", role: "Developer" },
      { id: 1, name: "Alex Morgan", avatar: "/avatars/alex-morgan.png", role: "UI Designer" }
    ],
    description: "Aplicativo mobile para e-commerce com integração completa",
    tags: ["Mobile", "E-commerce", "iOS", "Android"]
  },
  {
    id: 4,
    name: "E-commerce Platform",
    client: "Fashion Forward",
    status: "completed",
    priority: "low",
    progress: 100,
    budget: 18000,
    spent: 17200,
    startDate: "2023-12-01",
    deadline: "2024-01-10",
    team: [
      { id: 3, name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png", role: "Project Manager" },
      { id: 4, name: "David Kim", avatar: "/avatars/david-kim.png", role: "Backend Developer" }
    ],
    description: "Plataforma de e-commerce completa para marca de moda",
    tags: ["E-commerce", "Fashion", "Backend"]
  },
  {
    id: 5,
    name: "Marketing Campaign",
    client: "LocalBusiness",
    status: "on_hold",
    priority: "low",
    progress: 45,
    budget: 5000,
    spent: 2000,
    startDate: "2024-01-20",
    deadline: "2024-02-20",
    team: [
      { id: 6, name: "Maria Santos", avatar: "/avatars/maria-santos.png", role: "Marketing Specialist" }
    ],
    description: "Campanha de marketing digital multi-canal",
    tags: ["Marketing", "Digital", "Campaign"]
  }
];

interface ProjectListProps {
  projects?: Project[];
  viewMode?: "grid" | "list";
}

export function ProjectList({ projects = mockProjects, viewMode = "grid" }: ProjectListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'planning':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: Project["priority"]) => {
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

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'review':
        return <Eye className="h-4 w-4" />;
      case 'planning':
        return <Calendar className="h-4 w-4" />;
      case 'on_hold':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: Project["status"]) => {
    switch (status) {
      case 'in_progress':
        return 'Em Progresso';
      case 'review':
        return 'Em Revisão';
      case 'planning':
        return 'Planejamento';
      case 'completed':
        return 'Concluído';
      case 'on_hold':
        return 'Em Espera';
      default:
        return status;
    }
  };

  const formatPriority = (priority: Project["priority"]) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Projetos da Agência
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie todos os projetos em um só lugar
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-[#64f481] dark:hover:bg-[#4ade80] dark:text-black">
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar projetos ou clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="review">Em Revisão</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="on_hold">Em Espera</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Projetos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727] hover:border-gray-300 dark:hover:border-[#64f481]/30 transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100 line-clamp-2">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {project.client}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <Badge className={cn("text-xs flex items-center gap-1", getStatusColor(project.status))} variant="secondary">
                  {getStatusIcon(project.status)}
                  {formatStatus(project.status)}
                </Badge>
                <Badge className={cn("text-xs", getPriorityColor(project.priority))} variant="secondary">
                  {formatPriority(project.priority)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progresso */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Progresso</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              {/* Orçamento */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>Orçamento</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    R$ {project.spent.toLocaleString()} / R$ {project.budget.toLocaleString()}
                  </div>
                  <div className={cn(
                    "text-xs",
                    project.spent > project.budget * 0.9 ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-500"
                  )}>
                    {Math.round((project.spent / project.budget) * 100)}% utilizado
                  </div>
                </div>
              </div>

              {/* Prazo */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Prazo</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(project.deadline).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                  </div>
                </div>
              </div>

              {/* Equipe */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Equipe</span>
                  </div>
                </div>
                <div className="flex items-center -space-x-2">
                  {project.team.slice(0, 4).map((member) => (
                    <Avatar key={member.id} className="h-8 w-8 border-2 border-white dark:border-[#171717]">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.team.length > 4 && (
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-[#1f1f1f] border-2 border-white dark:border-[#171717] flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                      +{project.team.length - 4}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {project.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs py-0">
                    {tag}
                  </Badge>
                ))}
                {project.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs py-0">
                    +{project.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="bg-white/90 dark:bg-[#171717]/60 backdrop-blur-sm border-gray-200 dark:border-[#272727]">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-[#1f1f1f] rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tente ajustar seus filtros ou criar um novo projeto
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Projeto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
