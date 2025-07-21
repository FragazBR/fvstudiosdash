// hooks/usePermissionsV2.ts
// Hook atualizado para o novo sistema de permissões v2

import { useUser } from '@/hooks/useUser'
import { UserRole, UserPermissions, FeatureFlags } from '@/types/database'
import { supabaseHelpers } from '@/lib/supabase-client'
import { useMemo, useEffect, useState } from 'react'

// Get role permissions
import { 
  ROLE_PERMISSIONS, 
  hasPermission, 
  getUserPermissions,
  getFeatureFlags,
  getUpgradeOptions,
  isAgencyOwnerOrAdmin 
} from '@/lib/permissions'

// Helper function to get role quotas from permission matrix
function getRoleQuotas(role: UserRole) {
  const permissions = getUserPermissions(role)
  return {
    maxProjects: permissions.maxProjects,
    maxClients: permissions.maxClients,
    maxAIRequests: permissions.maxAIRequests,
    maxStorageGB: permissions.maxStorageGB
  }
}

interface UsePermissionsReturn {
  // Permission checking functions
  hasPermission: (permission: keyof UserPermissions) => boolean
  canAccess: (resource: string, action?: string) => boolean
  
  // Legacy compatibility
  isAgencyOwnerOrAdmin: () => boolean
  
  // Role information
  userRole: UserRole | null
  isAdmin: boolean
  isAgency: boolean
  isIndependent: boolean
  isInfluencer: boolean
  isFree: boolean
  isClient: boolean
  
  // Permission objects
  permissions: UserPermissions
  features: FeatureFlags
  
  // Quota information
  quotas: {
    projects: { used: number; limit: number; percentage: number }
    clients: { used: number; limit: number; percentage: number }
    aiRequests: { used: number; limit: number; percentage: number }
    storage: { used: number; limit: number; percentage: number }
  }
  
  // Quota checking
  canCreateProject: boolean
  canCreateClient: boolean
  canUseAI: boolean
  hasStorageSpace: boolean
  
  // Navigation helpers
  getHomeRoute: () => string
  getDashboardRoute: () => string
  canAccessRoute: (route: string) => boolean
  
  // UI helpers
  shouldShowPremiumBadge: (feature: string) => boolean
  getUpgradeMessage: (feature: string) => string
  
  // Agency information
  isAgencyMember: boolean
  agencyRole: string | null
  agency: any | null
  
  // Loading states
  isLoading: boolean
  error: string | null
}

export function usePermissionsV2(): UsePermissionsReturn {
  const { user, loading } = useUser()
  const [profile, setProfile] = useState<any>(null)
  const [agency, setAgency] = useState<any>(null)
  const [agencyLoading, setAgencyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const userRole = user?.role || profile?.role || null
  const agencyRole = profile?.agency_role || null
  const isAgencyMember = !!(profile?.parent_agency_id || ['agency_owner', 'agency_staff', 'agency_client'].includes(profile?.role))
  
  // Load user profile if user exists
  useEffect(() => {
    if (user?.id && !profile) {
      const loadProfile = async () => {
        try {
          const { data, error } = await supabaseHelpers.getUserProfile(user.id)
          if (error) throw error
          setProfile(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load profile')
        }
      }
      
      loadProfile()
    }
  }, [user, profile])
  
  // Load agency information if user is part of an agency
  useEffect(() => {
    if (profile?.parent_agency_id || ['agency_owner', 'agency_staff', 'agency_client'].includes(profile?.role)) {
      setAgencyLoading(true)
      
      const loadAgency = async () => {
        try {
          let agencyData = null
          
          if (profile.role === 'agency_owner') {
            // User is agency owner
            const { data, error } = await supabaseHelpers.getUserAgency(profile.id)
            if (error) throw error
            agencyData = data
          } else if (profile.parent_agency_id) {
            // User is agency member
            const { data, error } = await supabaseHelpers.getUserProfile(profile.id)
            if (error) throw error
            agencyData = data?.agency_member?.[0]?.agency
          }
          
          setAgency(agencyData)
          setError(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load agency info')
        } finally {
          setAgencyLoading(false)
        }
      }
      
      loadAgency()
    }
  }, [profile])
  
  // Get permissions, features, and quotas based on role
  const permissions = useMemo(() => {
    if (!userRole) return getUserPermissions('free_user')
    return getUserPermissions(userRole)
  }, [userRole])
  
  const features = useMemo(() => {
    if (!userRole) return getFeatureFlags('free_user')
    return getFeatureFlags(userRole)
  }, [userRole])
  
  const baseQuotas = useMemo(() => {
    if (!userRole) return getRoleQuotas('free_user')
    return getRoleQuotas(userRole)
  }, [userRole])
  
  // Calculate current usage and quotas
  const quotas = useMemo(() => {
    if (!profile) {
      return {
        projects: { used: 0, limit: baseQuotas.maxProjects, percentage: 0 },
        clients: { used: 0, limit: baseQuotas.maxClients, percentage: 0 },
        aiRequests: { used: 0, limit: baseQuotas.maxAIRequests, percentage: 0 },
        storage: { used: 0, limit: baseQuotas.maxStorageGB, percentage: 0 }
      }
    }
    
    return {
      projects: {
        used: profile.current_projects || 0,
        limit: baseQuotas.maxProjects,
        percentage: baseQuotas.maxProjects === -1 ? 0 : 
          Math.round(((profile.current_projects || 0) / baseQuotas.maxProjects) * 100)
      },
      clients: {
        used: profile.current_clients || 0,
        limit: baseQuotas.maxClients,
        percentage: baseQuotas.maxClients === -1 ? 0 : 
          Math.round(((profile.current_clients || 0) / baseQuotas.maxClients) * 100)
      },
      aiRequests: {
        used: profile.current_ai_requests || 0,
        limit: baseQuotas.maxAIRequests,
        percentage: baseQuotas.maxAIRequests === -1 ? 0 : 
          Math.round(((profile.current_ai_requests || 0) / baseQuotas.maxAIRequests) * 100)
      },
      storage: {
        used: profile.current_storage_gb || 0,
        limit: baseQuotas.maxStorageGB,
        percentage: baseQuotas.maxStorageGB === -1 ? 0 : 
          Math.round(((profile.current_storage_gb || 0) / baseQuotas.maxStorageGB) * 100)
      }
    }
  }, [profile, baseQuotas])
  
  // Permission checking functions
  const checkPermission = (permission: keyof UserPermissions): boolean => {
    if (!userRole) return false
    return hasPermission(userRole, permission)
  }
  
  const canAccess = (resource: string, action: string = 'read'): boolean => {
    if (!userRole) return false
    
    // Custom access logic based on resource and action
    const key = `can${resource.charAt(0).toUpperCase()}${resource.slice(1)}${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof UserPermissions
    return permissions[key] as boolean || false
  }
  
  // Legacy compatibility function
  const checkIsAgencyOwnerOrAdmin = (): boolean => {
    if (!user || !profile) return false
    return isAgencyOwnerOrAdmin(userRole)
  }
  
  // Quota checking
  const canCreateProject = quotas.projects.limit === -1 || quotas.projects.used < quotas.projects.limit
  const canCreateClient = quotas.clients.limit === -1 || quotas.clients.used < quotas.clients.limit
  const canUseAI = quotas.aiRequests.limit === -1 || quotas.aiRequests.used < quotas.aiRequests.limit
  const hasStorageSpace = quotas.storage.limit === -1 || quotas.storage.used < quotas.storage.limit
  
  // Navigation helpers
  const getHomeRoute = (): string => {
    if (!userRole) return '/login'
    
    switch (userRole) {
      case 'admin':
        return '/admin'
      case 'agency_owner':
      case 'agency_staff':
        return '/agency'
      case 'agency_client':
      case 'independent_client':
        return '/client'
      case 'independent_producer':
      case 'influencer':
      case 'free_user':
        return '/dashboard'
      default:
        return '/dashboard'
    }
  }
  
  const getDashboardRoute = (): string => {
    if (!userRole) return '/login'
    
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard'
      case 'agency_owner':
      case 'agency_staff':
        return '/agency/dashboard'
      case 'agency_client':
      case 'independent_client':
        return '/client/dashboard'
      case 'independent_producer':
      case 'influencer':
      case 'free_user':
        return '/dashboard'
      default:
        return '/dashboard'
    }
  }
  
  const canAccessRoute = (route: string): boolean => {
    if (!userRole) return route === '/login' || route === '/signup'
    
    // Admin can access everything
    if (userRole === 'admin') return true
    
    // Route-specific access control
    if (route.startsWith('/admin')) return userRole === 'admin'
    if (route.startsWith('/agency')) return ['admin', 'agency_owner', 'agency_staff'].includes(userRole)
    if (route.startsWith('/client')) return ['admin', 'agency_client', 'independent_client'].includes(userRole)
    
    // General dashboard routes accessible by most roles
    if (route.startsWith('/dashboard')) {
      return ['admin', 'agency_owner', 'agency_staff', 'independent_producer', 'influencer', 'free_user'].includes(userRole)
    }
    
    return true // Allow access to other routes by default
  }
  
  // UI helpers
  const shouldShowPremiumBadge = (feature: string): boolean => {
    if (!userRole || userRole === 'admin') return false
    
    // Show premium badge for features not available in current plan
    const featureMap: Record<string, boolean> = {
      'ai-assistant': features.aiAssistant,
      'advanced-reports': features.advancedReports,
      'team-collaboration': features.teamCollaboration,
      'client-management': features.clientManagement,
      'unlimited-projects': features.unlimitedProjects,
      'priority-support': features.prioritySupport,
      'custom-branding': features.customBranding,
      'api-access': features.apiAccess
    }
    
    return !featureMap[feature]
  }
  
  const getUpgradeMessage = (feature: string): string => {
    const messages: Record<string, string> = {
      'ai-assistant': 'Upgrade to access AI-powered assistance',
      'advanced-reports': 'Upgrade for detailed analytics and reporting',
      'team-collaboration': 'Upgrade to collaborate with your team',
      'client-management': 'Upgrade to manage unlimited clients',
      'unlimited-projects': 'Upgrade for unlimited project creation',
      'priority-support': 'Upgrade for priority customer support',
      'custom-branding': 'Upgrade to customize your workspace branding',
      'api-access': 'Upgrade for full API access'
    }
    
    return messages[feature] || 'Upgrade your plan to access this feature'
  }
  
  return {
    // Permission checking
    hasPermission: checkPermission,
    canAccess,
    
    // Legacy compatibility
    isAgencyOwnerOrAdmin: checkIsAgencyOwnerOrAdmin,
    
    // Role information
    userRole,
    isAdmin: userRole === 'admin',
    isAgency: ['agency_owner', 'agency_staff', 'agency_client'].includes(userRole || ''),
    isIndependent: ['independent_producer', 'independent_client'].includes(userRole || ''),
    isInfluencer: userRole === 'influencer',
    isFree: userRole === 'free_user',
    isClient: ['agency_client', 'independent_client'].includes(userRole || ''),
    
    // Permission objects
    permissions,
    features,
    
    // Quota information
    quotas,
    
    // Quota checking
    canCreateProject,
    canCreateClient,
    canUseAI,
    hasStorageSpace,
    
    // Navigation helpers
    getHomeRoute,
    getDashboardRoute,
    canAccessRoute,
    
    // UI helpers
    shouldShowPremiumBadge,
    getUpgradeMessage,
    
    // Agency information
    isAgencyMember,
    agencyRole,
    agency,
    
    // Loading states
    isLoading: loading || agencyLoading,
    error
  }
}
