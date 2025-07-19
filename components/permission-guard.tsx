"use client";

import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldX } from "lucide-react";
import { canAccess, type UserRole } from "@/lib/permissions";

interface PermissionGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  showUnauthorized?: boolean;
  requireSpecificCheck?: (userRole: UserRole) => boolean;
}

export function PermissionGuard({ 
  children, 
  allowedRoles, 
  redirectTo = "/unauthorized",
  showUnauthorized = false,
  requireSpecificCheck
}: PermissionGuardProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }
      
      const userRole = user.role as UserRole;
      let hasAccess = false;

      // Verificação básica de role
      if (canAccess(userRole, allowedRoles)) {
        hasAccess = true;
      }

      // Verificação específica adicional se fornecida
      if (requireSpecificCheck && !requireSpecificCheck(userRole)) {
        hasAccess = false;
      }

      if (!hasAccess) {
        if (showUnauthorized) {
          return; // Mostra a mensagem de não autorizado
        }
        router.replace(redirectTo);
      }
    }
  }, [user, loading, router, allowedRoles, redirectTo, showUnauthorized, requireSpecificCheck]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          <span className="text-gray-600 dark:text-gray-300">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userRole = user.role as UserRole;
  let hasAccess = canAccess(userRole, allowedRoles);

  // Verificação específica adicional
  if (requireSpecificCheck && !requireSpecificCheck(userRole)) {
    hasAccess = false;
  }

  if (!hasAccess) {
    if (showUnauthorized) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <ShieldX className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Acesso Negado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Seu nível:</strong> {user.role}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Requerido:</strong> {allowedRoles.join(', ')}
              </p>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => router.back()}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

// Hook para verificar permissões em componentes
export function usePermissionCheck(allowedRoles: UserRole[]) {
  const { user, loading } = useUser();
  
  const userRole = user?.role as UserRole;
  const hasPermission = user && canAccess(userRole, allowedRoles);
  
  return {
    user,
    userRole,
    loading,
    hasPermission,
    canAccess: (roles: UserRole[]) => user && canAccess(userRole, roles)
  };
}
