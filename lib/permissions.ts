// Sistema de permissões da agência

export type UserRole = 'owner' | 'admin' | 'manager' | 'employee' | 'client' | 'personal';

export interface PermissionConfig {
  roles: UserRole[];
  description: string;
}

// Definição de permissões por funcionalidade
export const PERMISSIONS = {
  // Permissões do módulo Agency Management
  AGENCY_DASHBOARD: {
    roles: ['owner', 'admin'] as UserRole[],
    description: 'Acesso ao dashboard interno da agência'
  },
  
  AGENCY_CONTRACTS: {
    roles: ['owner', 'admin', 'manager'] as UserRole[],
    description: 'Visualizar contratos da agência'
  },
  
  AGENCY_FINANCIALS: {
    roles: ['owner', 'admin'] as UserRole[],
    description: 'Visualizar dados financeiros da agência'
  },
  
  AGENCY_GROWTH_DATA: {
    roles: ['owner', 'admin'] as UserRole[],
    description: 'Visualizar dados de crescimento da agência'
  },
  
  AGENCY_CLIENT_GROWTH: {
    roles: ['owner', 'admin', 'manager'] as UserRole[],
    description: 'Visualizar crescimento dos clientes'
  },
  
  AGENCY_FORECASTING: {
    roles: ['owner', 'admin'] as UserRole[],
    description: 'Acessar previsões e planejamento'
  },
  
  // Outras permissões gerais
  CLIENT_MANAGEMENT: {
    roles: ['owner', 'admin', 'manager', 'employee'] as UserRole[],
    description: 'Gerenciar clientes'
  },
  
  PROJECT_MANAGEMENT: {
    roles: ['owner', 'admin', 'manager', 'employee'] as UserRole[],
    description: 'Gerenciar projetos'
  },
  
  USER_MANAGEMENT: {
    roles: ['owner', 'admin'] as UserRole[],
    description: 'Gerenciar usuários da agência'
  }
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Verifica se o usuário tem permissão para acessar uma funcionalidade
 */
export function hasPermission(userRole: string | undefined, permission: PermissionKey): boolean {
  if (!userRole) return false;
  
  const permissionConfig = PERMISSIONS[permission];
  if (!permissionConfig) return false;
  
  return permissionConfig.roles.includes(userRole as UserRole);
}

/**
 * Verifica se o usuário é dono ou admin da agência
 */
export function isAgencyOwnerOrAdmin(userRole: string | undefined): boolean {
  return hasPermission(userRole, 'AGENCY_DASHBOARD');
}

/**
 * Verifica se o usuário pode acessar dados financeiros
 */
export function canAccessFinancials(userRole: string | undefined): boolean {
  return hasPermission(userRole, 'AGENCY_FINANCIALS');
}

/**
 * Verifica se o usuário pode gerenciar contratos
 */
export function canManageContracts(userRole: string | undefined): boolean {
  return hasPermission(userRole, 'AGENCY_CONTRACTS');
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: string | undefined): string {
  const roleNames: Record<UserRole, string> = {
    owner: 'Proprietário',
    admin: 'Administrador', 
    manager: 'Gerente',
    employee: 'Funcionário',
    client: 'Cliente',
    personal: 'Usuário'
  };
  
  return roleNames[role as UserRole] || 'Usuário';
}

/**
 * Atualizar o mock do usuário para incluir diferentes roles
 */
export function getMockUsersByRole() {
  return {
    owner: {
      id: '1',
      name: 'Fernando Vieira',
      email: 'fernando@fvstudios.com',
      role: 'owner',
      agency_id: 'agency-1'
    },
    admin: {
      id: '2', 
      name: 'Ana Silva',
      email: 'ana@fvstudios.com',
      role: 'admin',
      agency_id: 'agency-1'
    },
    manager: {
      id: '3',
      name: 'João Santos',
      email: 'joao@fvstudios.com', 
      role: 'manager',
      agency_id: 'agency-1'
    },
    employee: {
      id: '4',
      name: 'Maria Costa',
      email: 'maria@fvstudios.com',
      role: 'employee', 
      agency_id: 'agency-1'
    },
    client: {
      id: '5',
      name: 'Cliente Nike',
      email: 'contato@nike.com',
      role: 'client',
      agency_id: null
    }
  };
}
