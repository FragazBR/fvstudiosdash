// lib/permissions.ts
// Sistema completo de permissões para FVStudios Dashboard

export type UserRole = 'admin' | 'agency_owner' | 'agency_staff' | 'agency_client' | 'independent_producer' | 'independent_client' | 'influencer' | 'free_user'

// Labels amigáveis para os roles
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  agency_owner: 'Proprietário de Agência',
  agency_staff: 'Colaborador de Agência',
  agency_client: 'Cliente de Agência',
  independent_producer: 'Produtor Independente',
  independent_client: 'Cliente de Produtor',
  influencer: 'Influencer',
  free_user: 'Usuário Gratuito'
}

// Interface de permissões
export interface UserPermissions {
  // Dashboard access
  canAccessAdminDashboard: boolean
  canAccessAgencyDashboard: boolean
  canAccessIndependentDashboard: boolean
  canAccessInfluencerDashboard: boolean
  canAccessFreeDashboard: boolean
  canAccessClientDashboard: boolean
  
  // Client management
  canManageAllClients: boolean
  canManageOwnClients: boolean
  canViewClientReports: boolean
  canCreateClientAccounts: boolean
  
  // AI features
  canAccessAIAgents: boolean
  canAccessAdvancedAI: boolean
  canAccessBasicAI: boolean
  
  // Team management
  canInviteCollaborators: boolean
  canManageTeam: boolean
  canAssignTasks: boolean
  canViewTeamMetrics: boolean
  
  // Project management
  canCreateProjects: boolean
  canManageAllProjects: boolean
  canManageOwnProjects: boolean
  canViewProjectAnalytics: boolean
  
  // System administration
  canAccessSystemSettings: boolean
  canManageUserRoles: boolean
  canViewSystemLogs: boolean
  canExportData: boolean
  
  // Communication
  canChatWithClients: boolean
  canChatWithTeam: boolean
  canSendNotifications: boolean
  
  // Reporting
  canGenerateAdvancedReports: boolean
  canGenerateBasicReports: boolean
  canScheduleReports: boolean
  
  // Quotas and limits
  maxProjects: number
  maxClients: number
  maxAIRequests: number
  maxStorageGB: number
}

// Permission matrix by role
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canAccessAdminDashboard: true,
    canAccessAgencyDashboard: true,
    canAccessIndependentDashboard: true,
    canAccessInfluencerDashboard: true,
    canAccessFreeDashboard: true,
    canAccessClientDashboard: true,
    canManageAllClients: true,
    canManageOwnClients: true,
    canViewClientReports: true,
    canCreateClientAccounts: true,
    canAccessAIAgents: true,
    canAccessAdvancedAI: true,
    canAccessBasicAI: true,
    canInviteCollaborators: true,
    canManageTeam: true,
    canAssignTasks: true,
    canViewTeamMetrics: true,
    canCreateProjects: true,
    canManageAllProjects: true,
    canManageOwnProjects: true,
    canViewProjectAnalytics: true,
    canAccessSystemSettings: true,
    canManageUserRoles: true,
    canViewSystemLogs: true,
    canExportData: true,
    canChatWithClients: true,
    canChatWithTeam: true,
    canSendNotifications: true,
    canGenerateAdvancedReports: true,
    canGenerateBasicReports: true,
    canScheduleReports: true,
    maxProjects: -1,
    maxClients: -1,
    maxAIRequests: -1,
    maxStorageGB: -1
  },
  
  agency_owner: {
    canAccessAdminDashboard: false,
    canAccessAgencyDashboard: true,
    canAccessIndependentDashboard: false,
    canAccessInfluencerDashboard: false,
    canAccessFreeDashboard: false,
    canAccessClientDashboard: false,
    canManageAllClients: false,
    canManageOwnClients: true,
    canViewClientReports: true,
    canCreateClientAccounts: true,
    canAccessAIAgents: true,
    canAccessAdvancedAI: true,
    canAccessBasicAI: true,
    canInviteCollaborators: true,
    canManageTeam: true,
    canAssignTasks: true,
    canViewTeamMetrics: true,
    canCreateProjects: true,
    canManageAllProjects: false,
    canManageOwnProjects: true,
    canViewProjectAnalytics: true,
    canAccessSystemSettings: false,
    canManageUserRoles: false,
    canViewSystemLogs: false,
    canExportData: true,
    canChatWithClients: true,
    canChatWithTeam: true,
    canSendNotifications: true,
    canGenerateAdvancedReports: true,
    canGenerateBasicReports: true,
    canScheduleReports: true,
    maxProjects: 100,
    maxClients: 50,
    maxAIRequests: 5000,
    maxStorageGB: 100
  },
  
  agency_staff: {
    canAccessAdminDashboard: false,
    canAccessAgencyDashboard: true,
    canAccessIndependentDashboard: false,
    canAccessInfluencerDashboard: false,
    canAccessFreeDashboard: false,
    canAccessClientDashboard: false,
    canManageAllClients: false,
    canManageOwnClients: true,
    canViewClientReports: true,
    canCreateClientAccounts: true,
    canAccessAIAgents: true,
    canAccessAdvancedAI: false,
    canAccessBasicAI: true,
    canInviteCollaborators: true,
    canManageTeam: false,
    canAssignTasks: true,
    canViewTeamMetrics: true,
    canCreateProjects: true,
    canManageAllProjects: false,
    canManageOwnProjects: true,
    canViewProjectAnalytics: true,
    canAccessSystemSettings: false,
    canManageUserRoles: false,
    canViewSystemLogs: false,
    canExportData: true,
    canChatWithClients: true,
    canChatWithTeam: true,
    canSendNotifications: true,
    canGenerateAdvancedReports: false,
    canGenerateBasicReports: true,
    canScheduleReports: false,
    maxProjects: 25,
    maxClients: 15,
    maxAIRequests: 1000,
    maxStorageGB: 25
  },
  
  agency_client: {
    canAccessAdminDashboard: false,
    canAccessAgencyDashboard: false,
    canAccessIndependentDashboard: false,
    canAccessInfluencerDashboard: false,
    canAccessFreeDashboard: false,
    canAccessClientDashboard: true,
    canManageAllClients: false,
    canManageOwnClients: false,
    canViewClientReports: true,
    canCreateClientAccounts: false,
    canAccessAIAgents: true,
    canAccessAdvancedAI: false,
    canAccessBasicAI: true,
    canInviteCollaborators: false,
    canManageTeam: false,
    canAssignTasks: false,
    canViewTeamMetrics: false,
    canCreateProjects: false,
    canManageAllProjects: false,
    canManageOwnProjects: false,
    canViewProjectAnalytics: true,
    canAccessSystemSettings: false,
    canManageUserRoles: false,
    canViewSystemLogs: false,
    canExportData: false,
    canChatWithClients: false,
    canChatWithTeam: true,
    canSendNotifications: false,
    canGenerateAdvancedReports: false,
    canGenerateBasicReports: true,
    canScheduleReports: false,
    maxProjects: 0,
    maxClients: 0,
    maxAIRequests: 100,
    maxStorageGB: 5
  },
  
  independent_producer: {
    canAccessAdminDashboard: false,
    canAccessAgencyDashboard: false,
    canAccessIndependentDashboard: true,
    canAccessInfluencerDashboard: false,
    canAccessFreeDashboard: false,
    canAccessClientDashboard: false,
    canManageAllClients: false,
    canManageOwnClients: true,
    canViewClientReports: true,
    canCreateClientAccounts: true,
    canAccessAIAgents: true,
    canAccessAdvancedAI: true,
    canAccessBasicAI: true,
    canInviteCollaborators: false,
    canManageTeam: false,
    canAssignTasks: false,
    canViewTeamMetrics: false,
    canCreateProjects: true,
    canManageAllProjects: false,
    canManageOwnProjects: true,
    canViewProjectAnalytics: true,
    canAccessSystemSettings: false,
    canManageUserRoles: false,
    canViewSystemLogs: false,
    canExportData: true,
    canChatWithClients: true,
    canChatWithTeam: false,
    canSendNotifications: true,
    canGenerateAdvancedReports: true,
    canGenerateBasicReports: true,
    canScheduleReports: true,
    maxProjects: 50,
    maxClients: 20,
    maxAIRequests: 2000,
    maxStorageGB: 50
  },
  
  influencer: {
    canAccessAdminDashboard: false,
    canAccessAgencyDashboard: false,
    canAccessIndependentDashboard: false,
    canAccessInfluencerDashboard: true,
    canAccessFreeDashboard: false,
    canAccessClientDashboard: false,
    canManageAllClients: false,
    canManageOwnClients: false,
    canViewClientReports: false,
    canCreateClientAccounts: false,
    canAccessAIAgents: true,
    canAccessAdvancedAI: false,
    canAccessBasicAI: true,
    canInviteCollaborators: false,
    canManageTeam: false,
    canAssignTasks: false,
    canViewTeamMetrics: false,
    canCreateProjects: true,
    canManageAllProjects: false,
    canManageOwnProjects: true,
    canViewProjectAnalytics: true,
    canAccessSystemSettings: false,
    canManageUserRoles: false,
    canViewSystemLogs: false,
    canExportData: false,
    canChatWithClients: false,
    canChatWithTeam: false,
    canSendNotifications: false,
    canGenerateAdvancedReports: false,
    canGenerateBasicReports: true,
    canScheduleReports: false,
    maxProjects: 15,
    maxClients: 3,
    maxAIRequests: 1000,
    maxStorageGB: 25
  },
  
  independent_client: {
    canAccessAdminDashboard: false,
    canAccessAgencyDashboard: false,
    canAccessIndependentDashboard: false,
    canAccessInfluencerDashboard: false,
    canAccessFreeDashboard: false,
    canAccessClientDashboard: true,
    canManageAllClients: false,
    canManageOwnClients: false,
    canViewClientReports: true,
    canCreateClientAccounts: false,
    canAccessAIAgents: true,
    canAccessAdvancedAI: false,
    canAccessBasicAI: true,
    canInviteCollaborators: false,
    canManageTeam: false,
    canAssignTasks: false,
    canViewTeamMetrics: false,
    canCreateProjects: false,
    canManageAllProjects: false,
    canManageOwnProjects: false,
    canViewProjectAnalytics: true,
    canAccessSystemSettings: false,
    canManageUserRoles: false,
    canViewSystemLogs: false,
    canExportData: false,
    canChatWithClients: false,
    canChatWithTeam: true,
    canSendNotifications: false,
    canGenerateAdvancedReports: false,
    canGenerateBasicReports: true,
    canScheduleReports: false,
    maxProjects: 0,
    maxClients: 0,
    maxAIRequests: 100,
    maxStorageGB: 5
  },
  
  free_user: {
    canAccessAdminDashboard: false,
    canAccessAgencyDashboard: false,
    canAccessIndependentDashboard: false,
    canAccessInfluencerDashboard: false,
    canAccessFreeDashboard: true,
    canAccessClientDashboard: false,
    canManageAllClients: false,
    canManageOwnClients: false,
    canViewClientReports: false,
    canCreateClientAccounts: false,
    canAccessAIAgents: false,
    canAccessAdvancedAI: false,
    canAccessBasicAI: false,
    canInviteCollaborators: false,
    canManageTeam: false,
    canAssignTasks: false,
    canViewTeamMetrics: false,
    canCreateProjects: true,
    canManageAllProjects: false,
    canManageOwnProjects: true,
    canViewProjectAnalytics: false,
    canAccessSystemSettings: false,
    canManageUserRoles: false,
    canViewSystemLogs: false,
    canExportData: false,
    canChatWithClients: false,
    canChatWithTeam: false,
    canSendNotifications: false,
    canGenerateAdvancedReports: false,
    canGenerateBasicReports: false,
    canScheduleReports: false,
    maxProjects: 3,
    maxClients: 1,
    maxAIRequests: 0,
    maxStorageGB: 1
  },
  
}

// Utility functions
export function getUserPermissions(role: UserRole): UserPermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.free_user
}

export function hasPermission(role: UserRole, permission: keyof UserPermissions): boolean {
  const permissions = getUserPermissions(role)
  return permissions[permission] as boolean
}

export function canAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

// Legacy compatibility functions
export function isAgencyOwnerOrAdmin(role: string | null): boolean {
  return role === 'admin' || role === 'agency_owner'
}

export function isAdmin(role: string | null): boolean {
  return role === 'admin'
}

export function isAgency(role: string | null): boolean {
  return role === 'agency_owner' || role === 'agency_staff' || role === 'agency_client'
}

export function isIndependent(role: string | null): boolean {
  return role === 'independent_producer'
}

export function isInfluencer(role: string | null): boolean {
  return role === 'influencer'
}

export function isFree(role: string | null): boolean {
  return role === 'free_user'
}

export function isClient(role: string | null): boolean {
  return role === 'agency_client' || role === 'independent_client'
}

export function isPremiumUser(role: string | null): boolean {
  return ['admin', 'agency_owner', 'agency_staff', 'independent_producer'].includes(role || '')
}

export function canManageClients(role: string | null): boolean {
  return hasPermission(role as UserRole, 'canManageOwnClients')
}

export function canUseAI(role: string | null): boolean {
  return hasPermission(role as UserRole, 'canAccessAIAgents')
}

export function canCreateProjects(role: string | null): boolean {
  return hasPermission(role as UserRole, 'canCreateProjects')
}

export function canManageTeam(role: string | null): boolean {
  return hasPermission(role as UserRole, 'canManageTeam')
}

export function canAccessReports(role: string | null): boolean {
  return hasPermission(role as UserRole, 'canGenerateBasicReports')
}

export function canExportData(role: string | null): boolean {
  return hasPermission(role as UserRole, 'canExportData')
}

export function canAccessSystemSettings(role: string | null): boolean {
  return hasPermission(role as UserRole, 'canAccessSystemSettings')
}

export function canAccessDashboard(role: string | null, dashboardType: string): boolean {
  const permissions = getUserPermissions(role as UserRole)
  
  switch (dashboardType) {
    case 'admin':
      return permissions.canAccessAdminDashboard
    case 'agency':
      return permissions.canAccessAgencyDashboard
    case 'independent':
      return permissions.canAccessIndependentDashboard
    case 'influencer':
      return permissions.canAccessInfluencerDashboard
    case 'free':
      return permissions.canAccessFreeDashboard
    case 'client':
      return permissions.canAccessClientDashboard
    default:
      return false
  }
}

// Feature flags by role
export interface FeatureFlags {
  aiAssistant: boolean
  advancedReports: boolean
  teamCollaboration: boolean
  clientManagement: boolean
  unlimitedProjects: boolean
  prioritySupport: boolean
  customBranding: boolean
  apiAccess: boolean
}

export function getFeatureFlags(role: UserRole): FeatureFlags {
  const permissions = getUserPermissions(role)
  
  return {
    aiAssistant: permissions.canAccessAIAgents,
    advancedReports: permissions.canGenerateAdvancedReports,
    teamCollaboration: permissions.canManageTeam || permissions.canInviteCollaborators,
    clientManagement: permissions.canManageOwnClients,
    unlimitedProjects: permissions.maxProjects === -1,
    prioritySupport: ['admin', 'agency_owner', 'independent_producer'].includes(role),
    customBranding: ['admin', 'agency_owner'].includes(role),
    apiAccess: ['admin', 'agency_owner', 'independent_producer'].includes(role)
  }
}

// Quota management
export function hasReachedLimit(role: UserRole, limitType: keyof UserPermissions, currentUsage: number): boolean {
  const permissions = getUserPermissions(role)
  const limit = permissions[limitType] as number
  
  if (limit === -1) return false // Unlimited
  return currentUsage >= limit
}

export function getRemainingQuota(role: UserRole, limitType: keyof UserPermissions, currentUsage: number): number {
  const permissions = getUserPermissions(role)
  const limit = permissions[limitType] as number
  
  if (limit === -1) return -1 // Unlimited
  return Math.max(0, limit - currentUsage)
}

// Upgrade suggestions
export function getUpgradeOptions(role: UserRole): string[] {
  switch (role) {
    case 'free_user':
      return ['influencer', 'independent_producer']
    case 'influencer':
      return ['independent_producer', 'agency_owner']
    case 'agency_client':
      return ['agency_staff']
    case 'independent_client':
      return ['independent_producer']
    default:
      return []
  }
}
