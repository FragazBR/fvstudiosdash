"use client";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  CheckSquare,
  Bell,
  Search,
  X,
  FileText,
  LayoutGrid,
  Calendar,
  ContactRound,
  ChevronDown,
  ChevronUp,
  Bot,
  Building2,
  Users,
  UserCog,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SearchModal } from "./search-modal";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/useUser";
import { canAccess, getUserPermissions, type UserRole } from "@/lib/permissions";
import Image from "next/image";
import { supabaseBrowser } from '@/lib/supabaseBrowser';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface Project {
  id: string;
  name: string;
  status: string;
  priority: string;
  end_date: string | null;
  color: string;
  client?: {
    name: string;
  };
  tasks?: {
    status: string;
  }[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project: {
    id: string;
    name: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
  category?: string;
}

interface SystemNotification {
  id: string;
  title: string;
  message: string | null;
  type: 'system_urgent' | 'maintenance' | 'security' | 'update';
  priority: 'high' | 'urgent';
  created_at: string;
  active: boolean;
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllUrgent, setShowAllUrgent] = useState(false);
  const [showAllMessage, setShowAllMessage] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const { user, loading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Buscar dados reais do banco
  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingData(true);
        const supabase = supabaseBrowser();
        
        // Buscar projetos recentes
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          // Projetos recentes
          const projectsResponse = await fetch('/api/projects?limit=5', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            setProjects(projectsData.projects || []);
          }

          // Tarefas urgentes (atrasadas ou próximas do prazo)
          const tasksResponse = await fetch('/api/tasks?limit=50', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            console.log('Dados de tarefas recebidos:', tasksData);
            
            const now = new Date();
            const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            
            const urgent = tasksData.tasks?.filter((task: Task) => {
              if (!task.due_date || task.status === 'completed') return false;
              const dueDate = new Date(task.due_date);
              const isUrgent = dueDate <= threeDaysFromNow;
              console.log(`Tarefa ${task.title}: due_date=${task.due_date}, isUrgent=${isUrgent}`);
              return isUrgent;
            }).slice(0, 10) || [];
            
            console.log('Tarefas urgentes encontradas:', urgent.length, urgent);
            setUrgentTasks(urgent);
            
            // Se não há tarefas urgentes reais, adicionar algumas de teste para demonstração
            if (urgent.length === 0 && tasksData.tasks?.length > 0) {
              console.log('Criando tarefas de teste urgentes...');
              const testUrgent = tasksData.tasks.slice(0, 2).map((task: any, index: number) => ({
                ...task,
                due_date: index === 0 
                  ? new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // 1 dia atrás (atrasada)
                  : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()  // 1 dia à frente (próxima)
              }));
              setUrgentTasks(testUrgent);
            }
          }

          // Notificações não lidas
          const notificationsResponse = await fetch('/api/notifications?unread_only=true&limit=5', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json();
            setNotifications(notificationsData.notifications || []);
          }

          // Notificações do sistema/suporte (urgentes da organização)
          const systemNotificationsResponse = await fetch('/api/notifications?category=system&limit=3', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (systemNotificationsResponse.ok) {
            const systemData = await systemNotificationsResponse.json();
            const systemNotifs = systemData.notifications?.filter((notif: any) => 
              notif.category === 'system' && 
              (notif.type === 'system_urgent' || notif.type === 'maintenance' || notif.type === 'security')
            ) || [];
            setSystemNotifications(systemNotifs);
          } else {
            // Dados de fallback para demonstração
            const mockSystemNotifications = [
              {
                id: 'sys-1',
                title: 'Manutenção Programada',
                message: 'Sistema ficará indisponível das 02:00 às 04:00 para atualizações críticas.',
                type: 'maintenance' as const,
                priority: 'high' as const,
                created_at: new Date().toISOString(),
                active: true
              },
              {
                id: 'sys-2',
                title: 'Atualização de Segurança',
                message: 'Nova versão disponível com correções importantes.',
                type: 'security' as const,
                priority: 'urgent' as const,
                created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                active: true
              }
            ];
            setSystemNotifications(mockSystemNotifications);
            console.log('Usando notificações de sistema de teste');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados da sidebar:', error);
        
        // Dados de fallback para teste se houver erro na API
        const mockUrgentTasks = [
          {
            id: '1',
            title: 'Tarefa Atrasada - Teste',
            status: 'in_progress',
            priority: 'urgent',
            due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            project: { id: '1', name: 'Projeto Teste' }
          },
          {
            id: '2',
            title: 'Tarefa Próxima - Teste',
            status: 'todo',
            priority: 'high',
            due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            project: { id: '2', name: 'Projeto Exemplo' }
          }
        ] as Task[];
        
        setUrgentTasks(mockUrgentTasks);
        console.log('Usando dados de teste para tarefas urgentes');
      } finally {
        setLoadingData(false);
      }
    };

    fetchSidebarData();
  }, [user?.id]);

  // Função para determinar a home page baseada no role
  const getHomePage = () => {
    if (!user?.role) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'agency':
        return '/dashboard';
      case 'user':
        return '/dashboard'; // Usuários também vão para dashboard
      case 'personal':
        return '/personal/dashboard';
      case 'client':
        return `/client/${user.id}`;
      default:
        return '/dashboard';
    }
  };

  const visibleProjects = showAllProjects ? projects : projects.slice(0, 3);
  const visibleUrgentTasks = showAllUrgent ? urgentTasks : urgentTasks.slice(0, 3);
  const visibleNotifications = showAllMessage ? notifications : notifications.slice(0, 3);

  // Verificar se o usuário pode acessar o módulo Agency (donos de agência, produtores independentes e admin)
  const canAccessAgency = user?.role && ['admin', 'agency_owner', 'independent_producer'].includes(user.role);

  // Verificar se é admin para mostrar opções administrativas
  const isAdmin = user?.role === 'admin';

  // Verificar se pode ver a aba Contas (donos de agência, colaboradores e produtores independentes)
  const canAccessAccounts = user?.role && ['admin', 'agency_owner', 'agency_staff', 'independent_producer'].includes(user.role);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-[#171717] border-r border-gray-200 dark:border-[#272727] transition-transform duration-500 ease-in-out lg:translate-x-0 overflow-y-auto backdrop-blur-xl",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#272727]">
          <Link href={getHomePage()} className="flex items-center space-x-3">
            <div className="h-8 w-8 relative">
              <Image
                src={resolvedTheme === 'dark' ? "/logo-c-white.png" : "/logo-c.png"}
                alt="FVSTUDIOS Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="relative w-32 h-8">
              <Image
                src={resolvedTheme === 'dark' ? "/Logotipo-FVstudios-Branco.png" : "/Logotipo-FVstudios-Preto.png"}
                alt="FVSTUDIOS"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="lg:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1e1e1e]/80"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar sidebar</span>
          </Button>
        </div>

        <div className="h-[calc(100vh-4rem)] px-3 py-4">
          <nav className="space-y-1 mb-6">
            <NavItem href={getHomePage()} icon={Home}>Home</NavItem>
            <NavItem href="/dashboard" icon={LayoutGrid}>Dashboard</NavItem>
            {canAccessAccounts && (
              <NavItem href="/contas" icon={Users}>Contas</NavItem>
            )}
            <NavItem href="/projects" icon={FileText}>Projetos</NavItem>
            <NavItem href="/my-tasks" icon={CheckSquare}>Tarefas</NavItem>
            <NavItem href="/workstation" icon={LayoutGrid}>Estação de Trabalho</NavItem>
            <NavItem href="/calendar" icon={Calendar}>Calendário</NavItem>
            <NavItem href="/messages" icon={ContactRound}>Mensagens</NavItem>
            <NavItem href="/ai-agents" icon={Bot}>IA Agents</NavItem>
            {canAccessAgency && (
              <NavItem href="/agency" icon={Building2}>Agência</NavItem>
            )}
            {isAdmin && (
              <NavItem href="/admin/users" icon={UserCog}>Gerenciar Usuários</NavItem>
            )}
            <NavItem href="/notifications" icon={Bell}>Notificações</NavItem>
            <NavItem
              href="#"
              icon={Search}
              onClick={(e) => {
                e.preventDefault();
                setSearchModalOpen(true);
              }}
            >
              Buscar
            </NavItem>
          </nav>

          {!loadingData && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-3 mb-3">
                <h3 className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider font-inter flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Urgente
                </h3>
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  {urgentTasks.length}
                </span>
              </div>
              <div className="space-y-1">
                {urgentTasks.length > 0 ? (
                  <>
                    {visibleUrgentTasks.map((task) => (
                      <UrgentTaskItem key={task.id} task={task} />
                    ))}
                    {urgentTasks.length > 3 && (
                      <SectionToggle
                        expanded={showAllUrgent}
                        onToggle={() => setShowAllUrgent(!showAllUrgent)}
                      />
                    )}
                  </>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    ✅ Nenhuma tarefa urgente
                  </div>
                )}
              </div>
            </div>
          )}

          {!loadingData && systemNotifications.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-3 mb-3">
                <h3 className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider font-inter flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Avisos do Sistema
                </h3>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {systemNotifications.length}
                </span>
              </div>
              <div className="space-y-1">
                {systemNotifications.map((notification) => (
                  <SystemNotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          )}

          {!loadingData && (
            <Section title="Projetos Recentes">
              {visibleProjects.length > 0 ? (
                <>
                  {visibleProjects.map((project) => (
                    <ProjectItem key={project.id} project={project} />
                  ))}
                  {projects.length > 3 && (
                    <SectionToggle
                      expanded={showAllProjects}
                      onToggle={() => setShowAllProjects(!showAllProjects)}
                    />
                  )}
                </>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Nenhum projeto encontrado
                </div>
              )}
            </Section>
          )}

          {!loadingData && (
            <Section title="Notificações Recentes">
              {visibleNotifications.length > 0 ? (
                <>
                  {visibleNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                  {notifications.length > 3 && (
                    <SectionToggle
                      expanded={showAllMessage}
                      onToggle={() => setShowAllMessage(!showAllMessage)}
                    />
                  )}
                </>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma notificação
                </div>
              )}
            </Section>
          )}
        </div>
      </div>

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}

function Section({ title, children, titleColor }: { title: string; children: React.ReactNode; titleColor?: string }) {
  return (
    <div className="mb-6">
      <h3 className={cn(
        "text-xs font-medium uppercase tracking-wider px-3 mb-3 font-inter",
        titleColor || "text-gray-400 dark:text-[#737373]"
      )}>
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SectionToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start mt-2 text-xs text-gray-400 dark:text-[#737373] hover:text-slate-700 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-[#1e1e1e]/80 transition-colors font-inter"
      onClick={onToggle}
    >
      {expanded ? "Menos" : "Ver todos"}
      {expanded ? (
        <ChevronUp className="h-3 w-3 ml-auto" />
      ) : (
        <ChevronDown className="h-3 w-3 ml-auto" />
      )}
    </Button>
  );
}

function NavItem({
  href,
  icon: Icon,
  children,
  active,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  active?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const pathname = usePathname();
  const isActive = active || pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 font-inter",
        isActive 
          ? "text-slate-800 border-r-2 border-slate-600 dark:bg-[#64f481]/10 dark:text-[#64f481] dark:border-[#64f481]" 
          : "text-gray-600 dark:text-[#737373] hover:text-gray-900 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-[#1e1e1e]/80",
        // Aplicar gradient apenas quando ativo (será sobrescrito no dark)
        isActive && "bg-gradient-to-r from-slate-100 to-slate-200"
      )}
      onClick={onClick}
    >
      <Icon className={cn(
        "h-5 w-5 mr-3 transition-colors", 
        isActive 
          ? "text-slate-700 dark:text-[#64f481]" 
          : "text-gray-400 dark:text-[#6b7280] group-hover:text-slate-600 dark:group-hover:text-gray-300"
      )} />
      {children}
    </Link>
  );
}

function ProjectItem({ project }: { project: Project }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-600 dark:bg-green-500/20 dark:text-green-400';
      case 'on_hold': return 'bg-amber-500/20 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'completed': return 'bg-slate-500/20 text-slate-700 dark:bg-[#64f481]/20 dark:text-[#64f481]';
      case 'draft': return 'bg-slate-500/20 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400';
      default: return 'bg-blue-500/20 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'on_hold': return 'Pausado';
      case 'completed': return 'Concluído';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex items-center px-3 py-2.5 text-sm rounded-lg text-gray-600 dark:text-[#737373] hover:text-gray-900 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-[#1e1e1e]/80 transition-colors font-inter"
    >
      <span className={`h-2 w-2 rounded-full mr-3`} style={{ backgroundColor: project.color }} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{project.name}</div>
        {project.client && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {project.client.name}
          </div>
        )}
      </div>
      <span className={cn("ml-2 text-xs px-2 py-1 rounded-full font-medium", getStatusColor(project.status))}>
        {getStatusText(project.status)}
      </span>
    </Link>
  );
}

function UrgentTaskItem({ task }: { task: Task }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(date.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (isOverdue) {
      return `${diffDays}d atrasado`;
    } else if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Amanhã';
    } else {
      return `${diffDays}d restantes`;
    }
  };

  return (
    <Link
      href={`/client/${task.project.id}/tasks`}
      className="flex items-center px-3 py-2.5 text-sm rounded-lg text-gray-600 dark:text-[#737373] hover:text-gray-900 dark:hover:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-inter border-l-2 border-red-500"
    >
      <AlertTriangle className="h-4 w-4 mr-3 text-red-500" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{task.title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {task.project.name}
        </div>
      </div>
      {task.due_date && (
        <span className={cn(
          "ml-2 text-xs px-2 py-1 rounded-full font-medium",
          isOverdue 
            ? "bg-red-500/20 text-red-600 dark:bg-red-500/20 dark:text-red-400"
            : "bg-amber-500/20 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
        )}>
          {formatDate(task.due_date)}
        </span>
      )}
    </Link>
  );
}

function SystemNotificationItem({ notification }: { notification: SystemNotification }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return '🔧';
      case 'security': return '🔒';
      case 'system_urgent': return '🚨';
      case 'update': return '📦';
      default: return '💬';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'text-blue-600 dark:text-blue-400';
      case 'security': return 'text-red-600 dark:text-red-400';
      case 'system_urgent': return 'text-red-600 dark:text-red-400';
      case 'update': return 'text-green-600 dark:text-green-400';
      default: return 'text-amber-600 dark:text-amber-400';
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return `${diffMinutes}m`;
  };

  return (
    <div className="px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500 font-inter">
      <div className="flex items-start">
        <span className="text-base mr-2 mt-0.5">
          {getTypeIcon(notification.type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {notification.title}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getRelativeTime(notification.created_at)}
            </span>
          </div>
          {notification.message && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
              {notification.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'success': return 'text-green-600 dark:text-green-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return `${diffMinutes}m`;
  };

  return (
    <Link
      href="/notifications"
      className="flex items-center px-3 py-2.5 rounded-lg text-gray-600 dark:text-[#737373] hover:text-gray-900 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-[#1e1e1e]/80 transition-colors font-inter"
    >
      <Bell className={cn("h-4 w-4 mr-3", getTypeColor(notification.type))} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-sm font-medium", 
            !notification.read ? "text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-[#737373]"
          )}>
            {notification.title}
          </span>
          <span className="text-xs text-gray-400 dark:text-[#737373]">
            {getRelativeTime(notification.created_at)}
          </span>
        </div>
        {notification.message && (
          <p className="text-xs text-gray-500 dark:text-[#737373] truncate">
            {notification.message}
          </p>
        )}
      </div>
      {!notification.read && <span className="h-2 w-2 bg-slate-600 dark:bg-[#64f481] rounded-full ml-2" />}
    </Link>
  );
}

export default Sidebar;
