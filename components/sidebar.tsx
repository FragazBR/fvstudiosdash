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
} from "lucide-react";
import { useState } from "react";
import { SearchModal } from "./search-modal";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/useUser";
import { isAgencyOwnerOrAdmin } from "@/lib/permissions";
import Image from "next/image";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const projects = [
  { name: "Website Redesign", completed: "progress", link: "/projects/1", color: "bg-blue-500" },
  { name: "Mobile App", completed: "planning", link: "/projects/2", color: "bg-green-500" },
  { name: "Brand Identity", completed: "completed", link: "/projects/3", color: "bg-purple-500" }
];

const messages = [
  { name: "João Silva", message: "Sobre o projeto...", avatar: "", time: "2h", unread: true },
  { name: "Maria Santos", message: "Aprovado!", avatar: "", time: "4h", unread: false },
  { name: "Pedro Costa", message: "Preciso de ajuda", avatar: "", time: "1d", unread: true }
];

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllMessage, setShowAllMessage] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const { user, loading } = useUser();

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

  const visiableProjects = showAllProjects ? projects : projects.slice(0, 3);
  const visiableMessages = showAllMessage ? messages : messages.slice(0, 3);

  // Verificar se o usuário pode acessar o módulo Agency
  const canAccessAgency = isAgencyOwnerOrAdmin(user?.role);

  // Verificar se é admin para mostrar opções administrativas
  const isAdmin = user?.role === 'admin';

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
            <NavItem href="/contas" icon={Users}>Contas</NavItem>
            <NavItem href="/projects" icon={FileText}>Projetos</NavItem>
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

          <Section title="Projetos Recentes">
            {visiableProjects.map(({ name, completed, link, color }, idx) => (
              <ProjectItem key={idx} name={name} href={link} color={color} status={completed} />
            ))}
            {projects.length > 3 && (
              <SectionToggle
                expanded={showAllProjects}
                onToggle={() => setShowAllProjects(!showAllProjects)}
              />
            )}
          </Section>

          <Section title="Mensagens Recentes">
            {visiableMessages.map(({ name, message, avatar, time, unread }, idx) => (
              <MessageItem key={idx} name={name} message={message} avatar={avatar} time={time} unread={unread} />
            ))}
            {messages.length > 3 && (
              <SectionToggle
                expanded={showAllMessage}
                onToggle={() => setShowAllMessage(!showAllMessage)}
              />
            )}
          </Section>
        </div>
      </div>

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-gray-400 dark:text-[#737373] uppercase tracking-wider px-3 mb-3 font-inter">
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

function ProjectItem({ name, href, color, status }: any) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2.5 text-sm rounded-lg text-gray-600 dark:text-[#737373] hover:text-gray-900 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-[#1e1e1e]/80 transition-colors font-inter"
    >
      <span className={`h-2 w-2 rounded-full ${color} mr-3`} />
      <span className="flex-1">{name}</span>
      <span
        className={cn(
          "ml-auto text-xs px-2 py-1 rounded-full font-medium",
          status === "planning" && "bg-blue-500/20 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
          status === "progress" && "bg-amber-500/20 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
          status === "completed" && "bg-slate-500/20 text-slate-700 dark:bg-[#64f481]/20 dark:text-[#64f481]"
        )}
      >
        {status === "progress"
          ? "Progress"
          : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </Link>
  );
}

function MessageItem({ name, message, avatar, time, unread }: any) {
  return (
    <Link
      href="/messages"
      className="flex items-center px-3 py-2.5 rounded-lg text-gray-600 dark:text-[#737373] hover:text-gray-900 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-[#1e1e1e]/80 transition-colors font-inter"
    >
      <Avatar className="h-8 w-8 mr-3">
        <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn("text-sm font-medium", unread ? "text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-[#737373]")}>
            {name}
          </span>
          <span className="text-xs text-gray-400 dark:text-[#737373]">{time}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-[#737373] truncate">{message}</p>
      </div>
      {unread && <span className="h-2 w-2 bg-slate-600 dark:bg-[#64f481] rounded-full ml-2" />}
    </Link>
  );
}

export default Sidebar;
