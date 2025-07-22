"use client";

import { useUser } from "@/hooks/useUser";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "@/components/permission-guard";
import { 
  isAgencyOwnerOrAdmin,
  canAccess,
  getUserPermissions,
  USER_ROLE_LABELS,
  type UserRole
} from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, Users, Star } from "lucide-react";

export function TestPermissions() {
  const { user, loading } = useUser();
  const { permissions } = usePermissions();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="m-6">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Usuário não logado
          </div>
        </CardContent>
      </Card>
    );
  }

  const userRole = user.role as UserRole;
  const userPermissions = getUserPermissions(userRole);
  
  // Teste das funções de compatibilidade
  const isOwnerOrAdmin = isAgencyOwnerOrAdmin(user?.role || null);
  const canAccessAdmin = canAccess(userRole, ['admin']);
  const canAccessAgency = canAccess(userRole, ['admin', 'agency_owner', 'agency_staff']);
  const canAccessMultiple = canAccess(userRole, ['admin', 'agency_owner', 'agency_staff', 'independent_producer']);

  const permissionTests = [
    {
      label: "É Admin ou Agency (legacy)",
      test: isOwnerOrAdmin,
      description: "Testa a função isAgencyOwnerOrAdmin"
    },
    {
      label: "Pode acessar Admin",
      test: canAccessAdmin,
      description: "Acesso restrito a admin"
    },
    {
      label: "Pode acessar Agency+",
      test: canAccessAgency,
      description: "Admin ou Agency"
    },
    {
      label: "Acesso Amplo",
      test: canAccessMultiple,
      description: "Admin, Agency ou Independent"
    },
    {
      label: "Pode gerenciar clientes",
      test: userPermissions.canManageOwnClients,
      description: "Permissão para clientes"
    },
    {
      label: "Pode usar IA",
      test: userPermissions.canAccessAIAgents,
      description: "Acesso a ferramentas de IA"
    },
    {
      label: "Pode criar projetos",
      test: userPermissions.canCreateProjects,
      description: "Criação de projetos"
    },
    {
      label: "Relatórios avançados",
      test: userPermissions.canGenerateAdvancedReports,
      description: "Relatórios completos"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header do usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Nome/Email</div>
              <div className="font-medium">{user.name || user.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tipo de Usuário</div>
              <Badge variant="secondary">
                {USER_ROLE_LABELS[userRole] || userRole}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-gray-500">Max Projetos</div>
              <div className="font-medium">
                {userPermissions.maxProjects === -1 ? '∞' : userPermissions.maxProjects}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Max Storage</div>
              <div className="font-medium">
                {userPermissions.maxStorageGB === -1 ? '∞' : `${userPermissions.maxStorageGB}GB`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testes de permissão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Testes de Permissão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionTests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">{test.label}</div>
                  <div className="text-xs text-gray-500">{test.description}</div>
                </div>
                <div className="flex items-center">
                  {test.test ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exemplos de PermissionGuard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Componentes Protegidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PermissionGuard allowedRoles={['admin']}>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="font-medium text-red-800">Área Admin</div>
              <div className="text-sm text-red-600">Só admins veem isso</div>
            </div>
          </PermissionGuard>

          <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_staff']}>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800">Área Agency+</div>
              <div className="text-sm text-blue-600">Admin e Agency podem ver</div>
            </div>
          </PermissionGuard>

          <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_staff', 'independent_producer']}>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-medium text-green-800">Área Profissional</div>
              <div className="text-sm text-green-600">Usuários profissionais</div>
            </div>
          </PermissionGuard>

          <PermissionGuard allowedRoles={['admin', 'agency_owner', 'agency_staff', 'independent_producer', 'influencer', 'free_user']}>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="font-medium text-gray-800">Área Geral</div>
              <div className="text-sm text-gray-600">Todos os usuários logados</div>
            </div>
          </PermissionGuard>

          {/* Exemplo com componente bloqueado para free */}
          <PermissionGuard 
            allowedRoles={['admin', 'agency_owner', 'agency_staff', 'independent_producer', 'influencer']}
            showUnauthorized={true}
          >
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="font-medium text-purple-800">Recurso Premium</div>
              <div className="text-sm text-purple-600">Usuários free não podem ver</div>
            </div>
          </PermissionGuard>
        </CardContent>
      </Card>
    </div>
  );
}
