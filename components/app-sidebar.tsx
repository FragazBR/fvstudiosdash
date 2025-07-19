"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Users,
  FolderKanban,
  Bell,
  Settings,
  Home,
  MessageSquare,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/admin", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/contas", label: "Contas", icon: Users },
    { href: "/projects", label: "Projetos", icon: FolderKanban },
    { href: "/calendar", label: "Calendário", icon: Calendar },
    { href: "/contacts", label: "Contatos", icon: Users },
    { href: "/kanban", label: "Kanban", icon: FolderKanban },
    { href: "/notifications", label: "Notificações", icon: Bell },
    { href: "/settings", label: "Configurações", icon: Settings },
  ]

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-background h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center px-4 border-b">
        <Link href="/admin" className="flex items-center gap-2">
          <Home className="h-6 w-6" />
          {!collapsed && <span className="font-bold text-xl">FVStudios</span>}
        </Link>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setCollapsed(!collapsed)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Button
                key={index}
                variant={isActive ? "secondary" : "ghost"}
                className={cn("flex items-center gap-3 justify-start", collapsed ? "px-2" : "px-3")}
                asChild
              >
                <Link href={item.href}>
                  <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
