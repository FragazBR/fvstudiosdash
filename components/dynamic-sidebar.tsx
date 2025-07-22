"use client";

import { useUser } from "@/hooks/useUser";
import { usePermissions } from "@/hooks/usePermissions";
import { canAccess, getUserPermissions, USER_ROLE_LABELS, type UserRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  LayoutDashboard,
  Users,
  FolderKanban,
  Calendar,
  Settings,
  Bot,
  BarChart3,
  MessageSquare,
  Bell,
  Video,
  Star,
  Crown,
  Shield,
  X,
  Building,
  Briefcase,
  Camera,
  Lock
} from "lucide-react";

interface DynamicSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function DynamicSidebar({ open, setOpen }: DynamicSidebarProps) {
  const { user } = useUser();
  const { permissions } = usePermissions();
  const pathname = usePathname();
  
  if (!user || !user.role) {
    return null;
  }

  const userRole = user.role as UserRole;
  const userPermissions = getUserPermissions(userRole);

  // Definir itens do menu baseado no tipo de usuário
  const getMenuItems = () => {
    const items = [];

    // Home/Dashboard principal baseado no role
    switch (userRole) {
      case 'admin':
        items.push({ 
          href: "/admin", 
          label: "Admin Home", 
          icon: Shield, 
          color: "text-red-600"
        });
        break;
      case 'agency_owner':
      case 'agency_staff':
        items.push({ 
          href: "/agency", 
          label: "Dashboard", 
          icon: Building
        });
        break;
      case 'independent_producer':
        items.push({ 
          href: "/independent", 
          label: "Painel", 
          icon: Briefcase
        });
        break;
      case 'influencer':
        items.push({ 
          href: "/influencer", 
          label: "Estúdio", 
          icon: Camera
        });
        break;
      case 'free_user':
        items.push({ 
          href: "/free", 
          label: "Dashboard", 
          icon: Home
        });
        break;
      case 'agency_client':
      case 'independent_client':
        items.push({ 
          href: "/client", 
          label: "Painel", 
          icon: LayoutDashboard
        });
        break;
    }

    // Gestão de Clientes
    if (userPermissions.canManageOwnClients) {
      items.push({ 
        href: "/client", 
        label: "Clientes", 
        icon: Users
      });
    }

    // Projetos
    if (userPermissions.canCreateProjects) {
      items.push({ 
        href: "/projects", 
        label: "Projetos", 
        icon: FolderKanban
      });
    }

    // Ferramentas de IA
    if (userPermissions.canAccessAIAgents) {
      items.push({ 
        href: "/ai-agents", 
        label: "IA Assistente", 
        icon: Bot, 
        badge: "PRO"
      });
    }

    // Calendário
    items.push({ 
      href: "/calendar", 
      label: "Calendário", 
      icon: Calendar
    });

    // Tarefas
    if (userPermissions.canCreateProjects) {
      items.push({ 
        href: "/my-tasks", 
        label: "Tarefas", 
        icon: FolderKanban,
        isLocked: userRole === 'free_user'
      });
    }

    // Relatórios
    if (userPermissions.canGenerateBasicReports) {
      items.push({ 
        href: "/reports", 
        label: "Relatórios", 
        icon: BarChart3,
        badge: userPermissions.canGenerateAdvancedReports ? "AVANÇADO" : "BÁSICO"
      });
    }

    // Chat/Comunicação
    if (userPermissions.canChatWithClients || userPermissions.canChatWithTeam) {
      items.push({ 
        href: "/messages", 
        label: "Mensagens", 
        icon: MessageSquare
      });
    }

    // Notificações
    items.push({ 
      href: "/notifications", 
      label: "Notificações", 
      icon: Bell
    });

    // Configurações
    items.push({ 
      href: "/settings", 
      label: "Configurações", 
      icon: Settings
    });

    return items;
  };

  const menuItems = getMenuItems();
  
  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return { 
          label: USER_ROLE_LABELS[userRole], 
          color: 'text-red-600', 
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: Shield
        };
      case 'agency_owner':
      case 'agency_staff':
        return { 
          label: USER_ROLE_LABELS[userRole], 
          color: 'text-blue-600', 
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: Building
        };
      case 'independent_producer':
        return { 
          label: USER_ROLE_LABELS[userRole], 
          color: 'text-green-600', 
          bg: 'bg-green-50 dark:bg-green-900/20',
          icon: Briefcase
        };
      case 'influencer':
        return { 
          label: USER_ROLE_LABELS[userRole], 
          color: 'text-purple-600', 
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          icon: Camera
        };
      case 'free_user':
        return { 
          label: USER_ROLE_LABELS[userRole], 
          color: 'text-gray-600', 
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          icon: Home
        };
      case 'agency_client':
      case 'independent_client':
        return { 
          label: USER_ROLE_LABELS[userRole], 
          color: 'text-indigo-600', 
          bg: 'bg-indigo-50 dark:bg-indigo-900/20',
          icon: Users
        };
      default:
        return { 
          label: 'Usuário', 
          color: 'text-gray-600', 
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          icon: Home
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <>
      {/* Overlay para mobile */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <Link href={userRole === 'admin' ? '/admin' : `/${userRole}`} className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">FV</span>
            </div>
            <span className="text-xl font-bold">FVStudios</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className={cn("m-4 p-3 rounded-lg", roleInfo.bg)}>
          <div className="flex items-center space-x-3">
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", roleInfo.bg)}>
              <RoleIcon className={cn("h-4 w-4", roleInfo.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || user.email}</p>
              <p className={cn("text-xs", roleInfo.color)}>{roleInfo.label}</p>
            </div>
            {userRole === 'free_user' && (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          
          {/* Limites para planos não admin */}
          {userRole !== 'admin' && (
            <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Projetos:</span>
                <span>
                  {userPermissions.maxProjects === -1 ? '∞' : `0/${userPermissions.maxProjects}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Storage:</span>
                <span>
                  {userPermissions.maxStorageGB === -1 ? '∞' : `0GB/${userPermissions.maxStorageGB}GB`}
                </span>
              </div>
              {userPermissions.maxAIRequests > 0 && (
                <div className="flex justify-between">
                  <span>IA:</span>
                  <span>0/{userPermissions.maxAIRequests}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isLocked = item.isLocked || false;

            return (
              <Link
                key={index}
                href={isLocked ? '#' : item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isLocked 
                    ? "opacity-50 cursor-not-allowed"
                    : isActive 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={isLocked ? (e) => e.preventDefault() : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={cn(
                    "h-5 w-5",
                    item.color || (isActive ? "text-green-600" : "text-gray-400")
                  )} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                      {item.badge}
                    </span>
                  )}
                  {isLocked && <Lock className="h-3 w-3 text-gray-400" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Upgrade Button para usuários gratuitos */}
        {userRole === 'free_user' && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => window.location.href = '/upgrade'}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Premium
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
