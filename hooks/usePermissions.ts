import { useUser } from './useUser'
import { 
  isAdmin,
  isAgency,
  isIndependent,
  isInfluencer,
  isFree,
  isClient,
  isAgencyOwnerOrAdmin,
  isPremiumUser,
  canManageClients,
  canUseAI,
  canCreateProjects,
  canManageTeam,
  canAccessReports,
  canExportData,
  canAccessSystemSettings,
  canAccessDashboard,
  hasReachedLimit,
  getRemainingQuota,
  getUpgradeOptions,
  getFeatureFlags,
  getUserPermissions,
  type UserRole,
  type UserPermissions,
  type FeatureFlags
} from '@/lib/permissions'

export function usePermissions() {
  const { user, loading } = useUser()
  const userRole = user?.role as UserRole

  // Verificações básicas de role
  const permissions = {
    // Roles específicos
    isAdmin: isAdmin(userRole),
    isAgency: isAgency(userRole),
    isIndependent: isIndependent(userRole),
    isInfluencer: isInfluencer(userRole),
    isFree: isFree(userRole),
    isClient: isClient(userRole),
    
    // Manter compatibilidade
    isAgencyOwnerOrAdmin: isAgencyOwnerOrAdmin(userRole),
    
    // Grupos de usuários
    isPremiumUser: isPremiumUser(userRole),
    
    // Capacidades funcionais
    canManageClients: canManageClients(userRole),
    canUseAI: canUseAI(userRole),
    canCreateProjects: canCreateProjects(userRole),
    canManageTeam: canManageTeam(userRole),
    canAccessReports: canAccessReports(userRole),
    canExportData: canExportData(userRole),
    canAccessSystemSettings: canAccessSystemSettings(userRole),
  }

  // Funções úteis
  const checkDashboardAccess = (dashboardType: string) => 
    canAccessDashboard(userRole, dashboardType)

  const checkLimit = (limitType: keyof UserPermissions, currentUsage: number) => 
    hasReachedLimit(userRole, limitType, currentUsage)

  const getQuota = (limitType: keyof UserPermissions, currentUsage: number) => 
    getRemainingQuota(userRole, limitType, currentUsage)

  const getAvailableUpgrades = () => getUpgradeOptions(userRole)

  const getFeatures = (): FeatureFlags => getFeatureFlags(userRole)

  const getUserLimits = (): UserPermissions => getUserPermissions(userRole)

  // Status de limites comuns
  const limits = getUserLimits()
  const quotaStatus = {
    projects: {
      max: limits.maxProjects,
      isUnlimited: limits.maxProjects === -1,
      getUsage: (current: number) => ({ current, remaining: getQuota('maxProjects', current) })
    },
    clients: {
      max: limits.maxClients,
      isUnlimited: limits.maxClients === -1,
      getUsage: (current: number) => ({ current, remaining: getQuota('maxClients', current) })
    },
    aiRequests: {
      max: limits.maxAIRequests,
      isUnlimited: limits.maxAIRequests === -1,
      getUsage: (current: number) => ({ current, remaining: getQuota('maxAIRequests', current) })
    },
    storage: {
      max: limits.maxStorageGB,
      isUnlimited: limits.maxStorageGB === -1,
      getUsage: (current: number) => ({ current, remaining: getQuota('maxStorageGB', current) })
    }
  }

  return {
    user,
    userRole,
    loading,
    permissions,
    limits,
    quotaStatus,
    features: getFeatures(),
    upgradeOptions: getAvailableUpgrades(),
    
    // Funções utilitárias
    checkDashboardAccess,
    checkLimit,
    getQuota,
    getAvailableUpgrades,
    getFeatures,
    getUserLimits,
    
    // Helpers para UI
    getRoleBadge: () => {
      const badges = {
        admin: { label: 'FVStudios', color: 'bg-red-100 text-red-800', icon: '🛡️' },
        agency: { label: 'Agência', color: 'bg-blue-100 text-blue-800', icon: '🏢' },
        independent: { label: 'Independente', color: 'bg-green-100 text-green-800', icon: '🎯' },
        influencer: { label: 'Criador', color: 'bg-purple-100 text-purple-800', icon: '🎬' },
        free: { label: 'Gratuito', color: 'bg-gray-100 text-gray-800', icon: '🆓' },
        client: { label: 'Cliente', color: 'bg-indigo-100 text-indigo-800', icon: '👤' }
      }
      return badges[userRole] || badges.free
    },
    
    shouldShowUpgrade: () => ['free', 'influencer'].includes(userRole),
    
    getNavigation: () => {
      // Retorna itens de navegação baseados nas permissões
      const navItems = []
      
      if (permissions.isAdmin) {
        navItems.push({ href: '/admin', label: 'Admin', icon: 'Shield' })
      }
      
      if (permissions.isAgency) {
        navItems.push({ href: '/agency', label: 'Agência', icon: 'Building2' })
      }
      
      if (permissions.isIndependent) {
        navItems.push({ href: '/independent', label: 'Independente', icon: 'Target' })
      }
      
      if (permissions.isInfluencer) {
        navItems.push({ href: '/influencer', label: 'Estúdio', icon: 'Video' })
      }
      
      if (permissions.isFree) {
        navItems.push({ href: '/free', label: 'Dashboard', icon: 'Home' })
      }
      
      if (permissions.canManageClients) {
        navItems.push({ href: '/contas', label: 'Clientes', icon: 'Users' })
      }
      
      if (permissions.canCreateProjects) {
        navItems.push({ href: '/projects', label: 'Projetos', icon: 'FolderKanban' })
      }
      
      if (permissions.canUseAI) {
        navItems.push({ href: '/ai-agents', label: 'IA', icon: 'Bot', badge: 'PRO' })
      }
      
      navItems.push({ href: '/calendar', label: 'Calendário', icon: 'Calendar' })
      navItems.push({ href: '/kanban', label: 'Kanban', icon: 'Kanban' })
      
      if (permissions.canAccessReports) {
        navItems.push({ href: '/reports', label: 'Relatórios', icon: 'BarChart3' })
      }
      
      navItems.push({ href: '/notifications', label: 'Notificações', icon: 'Bell' })
      
      if (permissions.canAccessSystemSettings) {
        navItems.push({ href: '/settings', label: 'Configurações', icon: 'Settings' })
      }
      
      return navItems
    }
  }
}

// Hook específico para verificações rápidas de permissão
export function useRoleCheck() {
  const { user } = useUser()
  const userRole = user?.role

  return {
    isAdmin: () => isAdmin(userRole),
    isAgency: () => isAgency(userRole),
    isIndependent: () => isIndependent(userRole),
    isInfluencer: () => isInfluencer(userRole),
    isFree: () => isFree(userRole),
    isClient: () => isClient(userRole),
    
    // Manter compatibilidade
    isAgencyOwnerOrAdmin: () => isAgencyOwnerOrAdmin(userRole),
    
    // Grupos
    isPremium: () => isPremiumUser(userRole),
    
    // Capacidades
    canUseAI: () => canUseAI(userRole),
    canManageTeam: () => canManageTeam(userRole),
    canManageClients: () => canManageClients(userRole),
  }
}

export type { UserRole, UserPermissions, FeatureFlags }
