"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  MoreHorizontal,
  Star,
  FileText,
  BarChart2,
  Clock,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ProjectViewDetailsModal } from "./project-view-details-modal";
import { ProjectTimelineModal } from "./project-timeline-modal";
import { ProjectStatusModal } from "./project-status-modal";
import { ProjectArchiveModal } from "./project-archive-modal";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "in_progress" | "review" | "completed" | "cancelled";
  deadline: string;
  progress: number;
  tasks: number;
  activity: number;
  starred: boolean;
  team: {
    name: string;
    avatar: string;
  }[];
  priority: "low" | "medium" | "high" | "urgent";
  client: {
    id: string;
    name: string;
    company?: string;
  };
  budget_total: number;
  budget_spent: number;
  startDate: string;
  endDate: string;
}

interface ClientGroup {
  client: {
    id: string;
    name: string;
    company?: string;
  };
  projects: Project[];
}

interface ProjectsListProps {
  viewMode: "grid" | "list";
  filterStatus: string | null;
}

const teamMembers = [
  {
    id: 1,
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    role: "UI/UX Designer",
    avatar: "/avatars/alex-morgan.png",
    tasks: {
      total: 18,
      running: 7,
      completed: 11,
    },
    performance: 12,
  },
  {
    id: 2,
    name: "Jessica Chen",
    email: "jessica.chen@example.com",
    role: "Frontend Developer",
    avatar: "/avatars/jessica-chen.png",
    tasks: {
      total: 24,
      running: 9,
      completed: 15,
    },
    performance: 8,
  },
  {
    id: 3,
    name: "Ryan Park",
    email: "ryan.park@example.com",
    role: "Product Manager",
    avatar: "/avatars/ryan-park.png",
    tasks: {
      total: 14,
      running: 3,
      completed: 11,
    },
    performance: 15,
  },
  {
    id: 4,
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    role: "Backend Developer",
    avatar: "/avatars/sarah-johnson.png",
    tasks: {
      total: 20,
      running: 8,
      completed: 12,
    },
    performance: -3,
  },
  {
    id: 5,
    name: "David Kim",
    email: "david.kim@example.com",
    role: "QA Engineer",
    avatar: "/avatars/david-kim.png",
    tasks: {
      total: 16,
      running: 5,
      completed: 11,
    },
    performance: 6,
  },
];

const supabase = supabaseBrowser();

export default function ProjectsList({
  viewMode,
  filterStatus,
}: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientGroups, setClientGroups] = useState<ClientGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<ClientGroup[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<
    "complete" | "hold" | "change"
  >("change");
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch projects from database
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          *,
          contacts:client_id (
            id,
            name,
            company
          ),
          tasks:tasks(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar projetos:', error);
        toast({
          title: "Erro ao carregar projetos",
          description: "Não foi possível carregar os projetos. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Transform data to match component interface
      const transformedProjects: Project[] = (projectsData || []).map(project => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.status,
        deadline: project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : 'Sem prazo',
        progress: calculateProgress(project.budget_spent, project.budget_total),
        tasks: project.tasks?.length || 0,
        activity: Math.floor(Math.random() * 50) + 10, // Temporary
        starred: false, // Temporary
        team: [], // Temporary
        priority: project.priority || 'medium',
        client: {
          id: project.contacts?.id || '',
          name: project.contacts?.name || 'Cliente não encontrado',
          company: project.contacts?.company
        },
        budget_total: project.budget_total || 0,
        budget_spent: project.budget_spent || 0,
        startDate: project.start_date ? new Date(project.start_date).toLocaleDateString('pt-BR') : 'Não definido',
        endDate: project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : 'Não definido'
      }));

      setProjects(transformedProjects);
      
      // Group projects by client
      const grouped = groupProjectsByClient(transformedProjects);
      setClientGroups(grouped);
      
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      toast({
        title: "Erro ao carregar projetos",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (spent: number, total: number): number => {
    if (!total || total === 0) return 0;
    return Math.min(Math.round((spent / total) * 100), 100);
  };

  const groupProjectsByClient = (projects: Project[]): ClientGroup[] => {
    const grouped = projects.reduce((acc, project) => {
      const clientId = project.client.id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client: project.client,
          projects: []
        };
      }
      acc[clientId].projects.push(project);
      return acc;
    }, {} as Record<string, ClientGroup>);

    return Object.values(grouped).sort((a, b) => 
      a.client.name.localeCompare(b.client.name)
    );
  };

  // Apply filters
  useEffect(() => {
    if (filterStatus) {
      const filtered = clientGroups.map(group => ({
        ...group,
        projects: group.projects.filter((project) => 
          project.status.toLowerCase().replace('_', ' ') === filterStatus.toLowerCase()
        )
      })).filter(group => group.projects.length > 0);
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(clientGroups);
    }
  }, [filterStatus, clientGroups]);

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setViewDetailsOpen(true);
  };

  const handleViewTimeline = (project: Project) => {
    setSelectedProject(project);
    setTimelineOpen(true);
  };

  const handleToggleStar = (project: Project) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === project.id) {
        return { ...p, starred: !p.starred };
      }
      return p;
    });
    setProjects(updatedProjects);

    toast({
      title: project.starred
        ? "Project removed from favorites"
        : "Project added to favorites",
      description: `"${project.name}" has been ${
        project.starred ? "removed from" : "added to"
      } your favorites.`,
      duration: 3000,
    });
  };

  const handleStatusChange = (
    project: Project,
    action: "complete" | "hold" | "change"
  ) => {
    setSelectedProject(project);
    setStatusAction(action);
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = (
    status: "Planning" | "In Progress" | "Completed" | "On Hold",
    note: string
  ) => {
    if (!selectedProject) return;

    const updatedProjects = projects.map((p) => {
      if (p.id === selectedProject.id) {
        return { ...p, status };
      }
      return p;
    });
    setProjects(updatedProjects);

    toast({
      title: `Project status updated`,
      description: `"${selectedProject.name}" has been marked as ${status}.`,
      duration: 3000,
    });
  };

  const handleArchiveProject = (project: Project) => {
    setSelectedProject(project);
    setArchiveModalOpen(true);
  };

  const handleConfirmArchive = (notifyTeam: boolean) => {
    if (!selectedProject) return;

    // In a real app, you would call an API to archive the project
    const updatedProjects = projects.filter((p) => p.id !== selectedProject.id);
    setProjects(updatedProjects);

    setArchiveModalOpen(false);

    toast({
      title: "Project archived",
      description: `"${selectedProject.name}" has been archived. ${
        notifyTeam ? "Team members have been notified." : ""
      }`,
      duration: 3000,
    });

    setSelectedProject(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (filteredGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Nenhum projeto encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Tente ajustar os filtros ou criar um novo projeto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {filteredGroups.map((group) => (
        <div key={group.client.id} className="space-y-4">
          {/* Client Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {group.client.company || group.client.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {group.projects.length} projeto{group.projects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast({
                title: "Funcionalidade em desenvolvimento",
                description: "Ver todos os projetos do cliente em breve."
              })}
            >
              Ver Todos os Projetos
            </Button>
          </div>

          {/* Projects Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 xl:gap-6">
              {group.projects.slice(0, 3).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onViewDetails={handleViewDetails}
                  onViewTimeline={handleViewTimeline}
                  onToggleStar={handleToggleStar}
                  onStatusChange={handleStatusChange}
                  onArchive={handleArchiveProject}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white/90 dark:bg-[#171717]/60 border border-gray-200 dark:border-[#272727] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#1e1e1e]/80 border-b border-gray-200 dark:border-[#272727]">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Projeto
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Progresso
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Prazo
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Equipe
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.projects.slice(0, 3).map((project) => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        onViewDetails={handleViewDetails}
                        onViewTimeline={handleViewTimeline}
                        onToggleStar={handleToggleStar}
                        onStatusChange={handleStatusChange}
                        onArchive={handleArchiveProject}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {group.projects.length > 3 && (
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => toast({
                  title: "Funcionalidade em desenvolvimento",
                  description: "Ver mais projetos em breve."
                })}
                className="text-blue-600 hover:text-blue-700"
              >
                Ver mais {group.projects.length - 3} projeto{group.projects.length - 3 !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Modals */}
      <ProjectViewDetailsModal
        project={selectedProject}
        isOpen={viewDetailsOpen}
        onClose={() => setViewDetailsOpen(false)}
      />

      <ProjectTimelineModal
        project={selectedProject}
        isOpen={timelineOpen}
        onClose={() => setTimelineOpen(false)}
      />

      <ProjectStatusModal
        project={selectedProject}
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onStatusChange={handleUpdateStatus}
        action={statusAction}
      />

      <ProjectArchiveModal
        project={selectedProject}
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onArchive={handleConfirmArchive}
      />
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onViewDetails: (project: Project) => void;
  onViewTimeline: (project: Project) => void;
  onToggleStar: (project: Project) => void;
  onStatusChange: (
    project: Project,
    action: "complete" | "hold" | "change"
  ) => void;
  onArchive: (project: Project) => void;
}

function ProjectCard({
  project,
  onViewDetails,
  onViewTimeline,
  onToggleStar,
  onStatusChange,
  onArchive,
}: ProjectCardProps) {
  return (
    <Card className="bg-white/90 dark:bg-[#171717]/60 border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 overflow-hidden transition-all hover:shadow-md duration-200">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap gap-2 justify-between items-start">
          <div className="flex items-start space-x-2">
            <div
              className={cn(
                "w-1 h-12 rounded-full",
                (project.status === "in_progress" || project.status === "active") && "bg-yellow-500",
                project.status === "completed" && "bg-green-500",
                project.status === "planning" && "bg-slate-500",
                (project.status === "cancelled" || project.status === "review") && "bg-gray-500"
              )}
            />
            <div>
              <CardTitle className="text-lg flex items-center">
                {project.name}
                {project.starred && (
                  <Star className="h-4 w-4 ml-2 text-yellow-500 fill-yellow-500" />
                )}
              </CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </div>
          </div>
          <Badge
            className={cn(
              "font-medium text-nowrap",
              (project.status === "in_progress" || project.status === "active") &&
                "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
              project.status === "completed" &&
                "bg-green-100 text-green-800 hover:bg-green-100",
              project.status === "planning" &&
                "bg-slate-100 text-slate-800 hover:bg-slate-100",
              (project.status === "cancelled" || project.status === "review") &&
                "bg-gray-100 text-gray-800 hover:bg-gray-100"
            )}
          >
            {project.status === 'in_progress' ? 'Em Andamento' :
             project.status === 'active' ? 'Ativo' :
             project.status === 'completed' ? 'Concluído' :
             project.status === 'planning' ? 'Planejamento' :
             project.status === 'review' ? 'Revisão' :
             project.status === 'cancelled' ? 'Cancelado' : project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Deadline: {project.deadline}</span>
          </div>
          <ProjectActions
            project={project}
            onViewDetails={onViewDetails}
            onViewTimeline={onViewTimeline}
            onToggleStar={onToggleStar}
            onStatusChange={onStatusChange}
            onArchive={onArchive}
          />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="flex -space-x-2">
            {project.team.map((member, index) => (
              <Avatar key={index} className="h-8 w-8 border-2 border-white">
                <AvatarImage
                  src={member.avatar || "/placeholder.svg"}
                  alt={member.name}
                />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <div className="flex items-center">
              <FileText className="h-3.5 w-3.5 mr-1" />
              <span>{project.tasks} tasks</span>
            </div>
            <div className="flex items-center">
              <BarChart2 className="h-3.5 w-3.5 mr-1" />
              <span>{project.activity} activities</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-500 mb-1">Cliente</p>
              <p className="font-medium">{project.client.company || project.client.name}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Orçamento</p>
              <p className="font-medium">R$ {project.budget_total?.toLocaleString('pt-BR') || '0'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Início</p>
              <p className="font-medium">{project.startDate}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Prioridade</p>
              <Badge
                className={cn(
                  "font-medium",
                  (project.priority === "high" || project.priority === "urgent") &&
                    "bg-red-100 text-red-800 hover:bg-red-100",
                  project.priority === "medium" &&
                    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                  project.priority === "low" &&
                    "bg-green-100 text-green-800 hover:bg-green-100"
                )}
              >
                {project.priority === 'high' ? 'Alta' :
                 project.priority === 'urgent' ? 'Urgente' :
                 project.priority === 'medium' ? 'Média' :
                 project.priority === 'low' ? 'Baixa' : project.priority}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProjectRowProps {
  project: Project;
  onViewDetails: (project: Project) => void;
  onViewTimeline: (project: Project) => void;
  onToggleStar: (project: Project) => void;
  onStatusChange: (
    project: Project,
    action: "complete" | "hold" | "change"
  ) => void;
  onArchive: (project: Project) => void;
}

function ProjectRow({
  project,
  onViewDetails,
  onViewTimeline,
  onToggleStar,
  onStatusChange,
  onArchive,
}: ProjectRowProps) {
  return (
    <tr className="border-b border-gray-200 dark:border-[#272727] hover:bg-gray-50 dark:hover:bg-[#1e1e1e]/80 transition-colors duration-200">
      <td className="py-3 px-4">
        <div className="flex items-center">
          <div
            className={cn(
              "w-1 h-8 rounded-full mr-3",
              project.status === "In Progress" && "bg-yellow-500",
              project.status === "Completed" && "bg-green-500",
              project.status === "Planning" && "bg-blue-500",
              project.status === "On Hold" && "bg-gray-500"
            )}
          />
          <div>
            <div className="font-medium text-gray-900 flex items-center text-nowrap">
              {project.name}
              {project.starred && (
                <Star className="h-3.5 w-3.5 ml-1.5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <div className="text-xs text-gray-500">{project.description}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <Badge
          className={cn(
            "font-medium text-nowrap",
            project.status === "In Progress" &&
              "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
            project.status === "Completed" &&
              "bg-green-100 text-green-800 hover:bg-green-100",
            project.status === "Planning" &&
              "bg-slate-100 text-slate-800 hover:bg-slate-100",
            project.status === "On Hold" &&
              "bg-gray-100 text-gray-800 hover:bg-gray-100"
          )}
        >
          {project.status}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <div className="w-32">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-nowrap">{project.deadline}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex -space-x-2">
          {project.team.map((member, index) => (
            <Avatar key={index} className="h-7 w-7 border-2 border-white">
              <AvatarImage
                src={member.avatar || "/placeholder.svg"}
                alt={member.name}
              />
              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </td>
      <td className="py-3 px-4  flex justify-end cursor-pointer">
        <MoreHorizontal className="text-end" />
      </td>
    </tr>
  );
}

interface ProjectActionsProps {
  project: Project;
  onViewDetails: (project: Project) => void;
  onViewTimeline: (project: Project) => void;
  onToggleStar: (project: Project) => void;
  onStatusChange: (
    project: Project,
    action: "complete" | "hold" | "change"
  ) => void;
  onArchive: (project: Project) => void;
}

function ProjectActions({
  project,
  onViewDetails,
  onViewTimeline,
  onToggleStar,
  onStatusChange,
  onArchive,
}: ProjectActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Project actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onViewDetails(project)}>
          <FileText className="h-4 w-4 mr-2" />
          <span>View Details</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewTimeline(project)}>
          <Clock className="h-4 w-4 mr-2" />
          <span>View Timeline</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleStar(project)}>
          <Star
            className={cn(
              "h-4 w-4 mr-2",
              project.starred ? "fill-yellow-500 text-yellow-500" : "text-gray-500 dark:text-[#6b7280]"
            )}
          />
          <span>{project.starred ? "Remove Star" : "Star Project"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onStatusChange(project, "change")}
          disabled={project.status === "Completed"}
        >
          <Clock className="h-4 w-4 mr-2" />
          <span>Change Status</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(project, "complete")}
          disabled={project.status === "Completed"}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Mark as Completed</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(project, "hold")}
          disabled={project.status === "On Hold"}
        >
          <PauseCircle className="h-4 w-4 mr-2" />
          <span>Put on Hold</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onArchive(project)}
          className="text-red-600"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Archive Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to get initials from name
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

// Sample projects data
const sampleProjects: Project[] = [
  {
    id: 1,
    name: "Figma Design System",
    description: "UI component library for design system",
    status: "In Progress",
    deadline: "Nov 15, 2023",
    progress: 65,
    tasks: 24,
    activity: 128,
    starred: true,
    team: [
      { name: "Alex Morgan", avatar: "/avatars/alex-morgan.png" },
      { name: "Jessica Chen", avatar: "/avatars/jessica-chen.png" },
      { name: "Ryan Park", avatar: "/avatars/ryan-park.png" },
    ],
    priority: "High",
    client: "Acme Inc.",
    budget: "$12,500",
    startDate: "Oct 1, 2023",
  },
  {
    id: 2,
    name: "Keep React",
    description: "React component library development",
    status: "Planning",
    deadline: "Dec 5, 2023",
    progress: 25,
    tasks: 18,
    activity: 86,
    starred: false,
    team: [
      { name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
      { name: "David Kim", avatar: "/avatars/david-kim.png" },
      { name: "Alex Morgan", avatar: "/avatars/alex-morgan.png" },
    ],
    priority: "Medium",
    client: "TechCorp",
    budget: "$18,000",
    startDate: "Oct 15, 2023",
  },
  {
    id: 3,
    name: "StaticMania",
    description: "Marketing website redesign project",
    status: "Completed",
    deadline: "Oct 25, 2023",
    progress: 100,
    tasks: 32,
    activity: 214,
    starred: true,
    team: [
      { name: "Jessica Chen", avatar: "/avatars/jessica-chen.png" },
      { name: "Ryan Park", avatar: "/avatars/ryan-park.png" },
      { name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
    ],
    priority: "Medium",
    client: "StaticMania",
    budget: "$9,800",
    startDate: "Sep 5, 2023",
  },
  {
    id: 4,
    name: "Mobile App Development",
    description: "Cross-platform mobile application",
    status: "In Progress",
    deadline: "Dec 20, 2023",
    progress: 42,
    tasks: 45,
    activity: 156,
    starred: false,
    team: [
      { name: "David Kim", avatar: "/avatars/david-kim.png" },
      { name: "Alex Morgan", avatar: "/avatars/alex-morgan.png" },
      { name: "Jessica Chen", avatar: "/avatars/jessica-chen.png" },
    ],
    priority: "High",
    client: "MobiTech",
    budget: "$32,000",
    startDate: "Sep 15, 2023",
  },
  {
    id: 5,
    name: "E-commerce Platform",
    description: "Online shopping platform development",
    status: "On Hold",
    deadline: "Jan 10, 2024",
    progress: 30,
    tasks: 38,
    activity: 92,
    starred: false,
    team: [
      { name: "Ryan Park", avatar: "/avatars/ryan-park.png" },
      { name: "Sarah Johnson", avatar: "/avatars/sarah-johnson.png" },
    ],
    priority: "Low",
    client: "ShopNow Inc.",
    budget: "$24,500",
    startDate: "Oct 5, 2023",
  },
  {
    id: 6,
    name: "Analytics Dashboard",
    description: "Data visualization and reporting tool",
    status: "Planning",
    deadline: "Jan 25, 2024",
    progress: 15,
    tasks: 22,
    activity: 48,
    starred: true,
    team: [
      { name: "Jessica Chen", avatar: "/avatars/jessica-chen.png" },
      { name: "David Kim", avatar: "/avatars/david-kim.png" },
    ],
    priority: "Medium",
    client: "DataViz Corp",
    budget: "$16,800",
    startDate: "Nov 1, 2023",
  },
];
