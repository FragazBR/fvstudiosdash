import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { Bell, LogOut, Menu, Plus, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dispatch, SetStateAction, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NewProjectModal from "./NewProjectModal";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useRouter } from "next/navigation";
import { AdvancedSettingsPanel } from "../advanced-settings-panel";

type topbarPropsT = {
  name: string;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
};

const Topbar = ({ name, sidebarOpen, setSidebarOpen }: topbarPropsT) => {
  const { user, loading } = useUser();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();
  const supabase = supabaseBrowser();

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error);
        return;
      }
      
      // Redireciona para login
      window.location.replace('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  // Função para obter as iniciais do usuário
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="bg-white dark:bg-[#171717] border-b border-gray-200 dark:border-[#272727] shadow-sm backdrop-blur-xl fixed w-full lg:w-[calc(100%-16rem)] top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Menu Button (mobile) and Date/Greeting */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 lg:hidden text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/50"
            >
              <Menu className="h-10 w-10" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-300">{name}</h2>
          </div>

          {/* Right: Notifications, New Project Button and Profile */}
          <div className="flex items-center space-x-4">
            <Link href="/notifications" className="relative text-gray-700 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute top-[-6px] -right-1 h-2 w-2 bg-green-500 rounded-full"></span>
              <span className="sr-only">Notifications</span>
            </Link>
            <NewProjectModal />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.avatar_url || "/avatars/william-jack.png"}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>
                      {user?.name ? getUserInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-black/95 border-gray-200/50 dark:border-white/10 backdrop-blur-xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/5">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSettingsOpen(true)}
                  className="cursor-pointer text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{logoutLoading ? 'Saindo...' : 'Logout'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Advanced Settings Panel */}
      <AdvancedSettingsPanel 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </>
  );
};

export default Topbar;
