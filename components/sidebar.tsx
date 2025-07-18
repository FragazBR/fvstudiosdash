"use client";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
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
} from "lucide-react";
import { useState } from "react";
import { SearchModal } from "./search-modal";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/useUser";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const projects: any[] = [/* ... seus dados ... */];
const messages: any[] = [/* ... seus dados ... */];


export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllMessage, setShowAllMessage] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const { user, loading } = useUser();

  const visiableProjects = showAllProjects ? projects : projects.slice(0, 3);
  const visiableMessages = showAllMessage ? messages : messages.slice(0, 3);

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
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-500 ease-in-out lg:translate-x-0 overflow-y-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-auto" />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar sidebar</span>
          </Button>
        </div>

        <div className="h-[calc(100vh-4rem)] px-3 py-4">
          <nav className="space-y-1 mb-6">
            {loading ? null : (
              <>
                <NavItem href="/" icon={Home}>Home</NavItem>
                {/* Admin */}
                {user?.role === "admin" && (
                  <>
                    <NavItem href="/admin" icon={LayoutGrid}>Admin Panel</NavItem>
                    <NavItem href="/projects" icon={FileText}>Projects</NavItem>
                    <NavItem href="/contacts" icon={ContactRound}>Contacts</NavItem>
                  </>
                )}
                {/* Agency */}
                {user?.role === "agency" && (
                  <>
                    <NavItem href="/dashboard" icon={LayoutGrid}>Agency Dashboard</NavItem>
                    <NavItem href="/projects" icon={FileText}>Projects</NavItem>
                    <NavItem href="/my-tasks" icon={CheckSquare}>My Tasks</NavItem>
                    <NavItem href="/kanban" icon={LayoutGrid}>Kanban desk</NavItem>
                    <NavItem href="/calendar" icon={Calendar}>Calendar</NavItem>
                    <NavItem href="/contacts" icon={ContactRound}>Contacts</NavItem>
                    <NavItem href="/notifications" icon={Bell}>Notifications</NavItem>
                  </>
                )}
                {/* Client */}
                {user?.role === "client" && (
                  <>
                    <NavItem href={`/client/${user.id}`} icon={LayoutGrid}>Client Dashboard</NavItem>
                    <NavItem href="/projects" icon={FileText}>Projects</NavItem>
                    <NavItem href="/calendar" icon={Calendar}>Calendar</NavItem>
                    <NavItem href="/contacts" icon={ContactRound}>Contacts</NavItem>
                  </>
                )}
                {/* Personal/Free */}
                {user?.role === "personal" && (
                  <>
                    <NavItem href="/personal/dashboard" icon={LayoutGrid}>Personal Dashboard</NavItem>
                    <NavItem href="/kanban" icon={LayoutGrid}>Kanban desk</NavItem>
                    <NavItem href="/calendar" icon={Calendar}>Calendar</NavItem>
                  </>
                )}
                {/* Search (todos) */}
                <NavItem
                  href="#"
                  icon={Search}
                  onClick={(e) => {
                    e.preventDefault();
                    setSearchModalOpen(true);
                  }}
                >
                  Search
                </NavItem>
              </>
            )}
          </nav>

          {/* Projects */}
          <Section title="Latest Projects">
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

          {/* Messages */}
          <Section title="Latest Message">
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
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
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
      className="w-full justify-start mt-2 text-xs text-gray-500"
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
        "flex items-center px-3 py-2 text-sm font-medium rounded-md",
        isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-blue-700" : "text-gray-500")} />
      {children}
    </Link>
  );
}

function ProjectItem({ name, href, color, status }: any) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
    >
      <span className={`h-2 w-2 rounded-full ${color} mr-3`} />
      <span className="text-gray-700">{name}</span>
      <span
        className={cn(
          "ml-auto text-xs px-1.5 py-0.5 rounded-full",
          status === "planning" && "bg-blue-100 text-blue-800",
          status === "progress" && "bg-yellow-100 text-yellow-800",
          status === "completed" && "bg-green-100 text-green-800"
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
      className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
    >
      <Avatar className="h-8 w-8 mr-3">
        <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn("text-sm font-medium", unread ? "text-gray-900" : "text-gray-700")}>
            {name}
          </span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{message}</p>
      </div>
      {unread && <span className="h-2 w-2 bg-blue-600 rounded-full ml-2" />}
    </Link>
  );
}

export default Sidebar;
