// types/database.ts
// Tipos TypeScript para o novo sistema de permissões

export type UserRole = 'admin' | 'agency_owner' | 'agency_staff' | 'agency_client' | 'independent_producer' | 'independent_client' | 'influencer' | 'free_user'
export type AgencyLevel = 'owner' | 'manager' | 'employee'
export type ProjectRole = 'owner' | 'admin' | 'editor' | 'member' | 'viewer'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'past_due' | 'canceled'

// Database Tables Types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: UserRole
          status: UserStatus
          email_verified: boolean
          agency_role: AgencyLevel | null
          parent_agency_id: string | null
          plan_type: string | null
          subscription_status: SubscriptionStatus
          subscription_id: string | null
          current_projects: number
          current_clients: number
          current_storage_gb: number
          current_ai_requests: number
          preferences: Record<string, any>
          settings: Record<string, any>
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          role?: UserRole
          status?: UserStatus
          email_verified?: boolean
          agency_role?: AgencyLevel | null
          parent_agency_id?: string | null
          plan_type?: string | null
          subscription_status?: SubscriptionStatus
          subscription_id?: string | null
          current_projects?: number
          current_clients?: number
          current_storage_gb?: number
          current_ai_requests?: number
          preferences?: Record<string, any>
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: UserRole
          status?: UserStatus
          email_verified?: boolean
          agency_role?: AgencyLevel | null
          parent_agency_id?: string | null
          plan_type?: string | null
          subscription_status?: SubscriptionStatus
          subscription_id?: string | null
          current_projects?: number
          current_clients?: number
          current_storage_gb?: number
          current_ai_requests?: number
          preferences?: Record<string, any>
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      agencies: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string | null
          description: string | null
          website_url: string | null
          logo_url: string | null
          settings: Record<string, any>
          branding: Record<string, any>
          status: 'active' | 'inactive' | 'suspended'
          custom_limits: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug?: string | null
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          settings?: Record<string, any>
          branding?: Record<string, any>
          status?: 'active' | 'inactive' | 'suspended'
          custom_limits?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string | null
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          settings?: Record<string, any>
          branding?: Record<string, any>
          status?: 'active' | 'inactive' | 'suspended'
          custom_limits?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      agency_members: {
        Row: {
          id: string
          agency_id: string
          user_id: string
          role: AgencyLevel
          permissions: Record<string, any>
          status: 'active' | 'inactive' | 'suspended'
          invited_by: string | null
          invited_at: string | null
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          user_id: string
          role: AgencyLevel
          permissions?: Record<string, any>
          status?: 'active' | 'inactive' | 'suspended'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          user_id?: string
          role?: AgencyLevel
          permissions?: Record<string, any>
          status?: 'active' | 'inactive' | 'suspended'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          owner_id: string
          agency_id: string | null
          name: string
          email: string | null
          phone: string | null
          company: string | null
          address: Record<string, any>
          settings: Record<string, any>
          notes: string | null
          status: 'active' | 'inactive' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          agency_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: Record<string, any>
          settings?: Record<string, any>
          notes?: string | null
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          agency_id?: string | null
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          address?: Record<string, any>
          settings?: Record<string, any>
          notes?: string | null
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      client_users: {
        Row: {
          id: string
          client_id: string
          user_id: string
          permissions: Record<string, any>
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          user_id: string
          permissions?: Record<string, any>
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          user_id?: string
          permissions?: Record<string, any>
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          owner_id: string
          agency_id: string | null
          client_id: string | null
          name: string
          description: string | null
          slug: string | null
          category: string | null
          tags: string[] | null
          status: 'draft' | 'active' | 'on_hold' | 'completed' | 'canceled' | 'archived'
          progress: number
          start_date: string | null
          due_date: string | null
          completed_date: string | null
          settings: Record<string, any>
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          agency_id?: string | null
          client_id?: string | null
          name: string
          description?: string | null
          slug?: string | null
          category?: string | null
          tags?: string[] | null
          status?: 'draft' | 'active' | 'on_hold' | 'completed' | 'canceled' | 'archived'
          progress?: number
          start_date?: string | null
          due_date?: string | null
          completed_date?: string | null
          settings?: Record<string, any>
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          agency_id?: string | null
          client_id?: string | null
          name?: string
          description?: string | null
          slug?: string | null
          category?: string | null
          tags?: string[] | null
          status?: 'draft' | 'active' | 'on_hold' | 'completed' | 'canceled' | 'archived'
          progress?: number
          start_date?: string | null
          due_date?: string | null
          completed_date?: string | null
          settings?: Record<string, any>
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: ProjectRole
          permissions: Record<string, any>
          status: 'active' | 'inactive'
          invited_by: string | null
          invited_at: string | null
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: ProjectRole
          permissions?: Record<string, any>
          status?: 'active' | 'inactive'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: ProjectRole
          permissions?: Record<string, any>
          status?: 'active' | 'inactive'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          user_id: string
          period_start: string
          period_end: string
          period_type: 'day' | 'week' | 'month' | 'year'
          projects_created: number
          clients_created: number
          ai_requests_made: number
          storage_used_gb: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period_start: string
          period_end: string
          period_type?: 'day' | 'week' | 'month' | 'year'
          projects_created?: number
          clients_created?: number
          ai_requests_made?: number
          storage_used_gb?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          period_start?: string
          period_end?: string
          period_type?: 'day' | 'week' | 'month' | 'year'
          projects_created?: number
          clients_created?: number
          ai_requests_made?: number
          storage_used_gb?: number
          created_at?: string
          updated_at?: string
        }
      }
      ai_usage_logs: {
        Row: {
          id: string
          user_id: string
          request_type: string
          tokens_used: number
          cost_cents: number
          project_id: string | null
          session_id: string | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          request_type: string
          tokens_used?: number
          cost_cents?: number
          project_id?: string | null
          session_id?: string | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          request_type?: string
          tokens_used?: number
          cost_cents?: number
          project_id?: string | null
          session_id?: string | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'info' | 'warning' | 'success' | 'error'
          title: string
          message: string | null
          action_url: string | null
          action_label: string | null
          read: boolean
          archived: boolean
          related_id: string | null
          related_type: string | null
          created_at: string
          read_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'info' | 'warning' | 'success' | 'error'
          title: string
          message?: string | null
          action_url?: string | null
          action_label?: string | null
          read?: boolean
          archived?: boolean
          related_id?: string | null
          related_type?: string | null
          created_at?: string
          read_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'info' | 'warning' | 'success' | 'error'
          title?: string
          message?: string | null
          action_url?: string | null
          action_label?: string | null
          read?: boolean
          archived?: boolean
          related_id?: string | null
          related_type?: string | null
          created_at?: string
          read_at?: string | null
          expires_at?: string | null
        }
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: Record<string, any> | null
          description: string | null
          category: string
          is_public: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: Record<string, any> | null
          description?: string | null
          category?: string
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Record<string, any> | null
          description?: string | null
          category?: string
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      agency_level: AgencyLevel
      project_role: ProjectRole
      user_status: UserStatus
      subscription_status: SubscriptionStatus
    }
  }
}

// Simplified types for use in components
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Agency = Database['public']['Tables']['agencies']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Extended types with relationships
export type UserProfileWithAgency = UserProfile & {
  agency?: Agency
  parent_agency?: Agency
}

export type ProjectWithRelations = Project & {
  owner?: UserProfile
  agency?: Agency
  client?: Client
  collaborators?: (Database['public']['Tables']['project_collaborators']['Row'] & {
    user?: UserProfile
  })[]
}

export type AgencyWithMembers = Agency & {
  owner?: UserProfile
  members?: (Database['public']['Tables']['agency_members']['Row'] & {
    user?: UserProfile
  })[]
}

// Permission-related types
export interface UserPermissions {
  canAccessAdminDashboard: boolean
  canAccessAgencyDashboard: boolean
  canAccessIndependentDashboard: boolean
  canAccessInfluencerDashboard: boolean
  canAccessFreeDashboard: boolean
  canAccessClientDashboard: boolean
  canManageAllClients: boolean
  canManageOwnClients: boolean
  canViewClientReports: boolean
  canCreateClientAccounts: boolean
  canAccessAIAgents: boolean
  canAccessAdvancedAI: boolean
  canAccessBasicAI: boolean
  canInviteCollaborators: boolean
  canManageTeam: boolean
  canAssignTasks: boolean
  canViewTeamMetrics: boolean
  canCreateProjects: boolean
  canManageAllProjects: boolean
  canManageOwnProjects: boolean
  canViewProjectAnalytics: boolean
  canAccessSystemSettings: boolean
  canManageUserRoles: boolean
  canViewSystemLogs: boolean
  canExportData: boolean
  canChatWithClients: boolean
  canChatWithTeam: boolean
  canSendNotifications: boolean
  canGenerateAdvancedReports: boolean
  canGenerateBasicReports: boolean
  canScheduleReports: boolean
  maxProjects: number
  maxClients: number
  maxAIRequests: number
  maxStorageGB: number
}

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

export interface QuotaUsage {
  used: number
  limit: number
  percentage: number
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// Form types
export interface CreateUserData {
  email: string
  name: string
  role: UserRole
  agency_id?: string
  permissions?: Record<string, any>
}

export interface CreateProjectData {
  name: string
  description?: string
  client_id?: string
  category?: string
  tags?: string[]
  start_date?: string
  due_date?: string
}

export interface CreateClientData {
  name: string
  email?: string
  phone?: string
  company?: string
  address?: Record<string, any>
  notes?: string
}

// Navigation and UI types
export interface NavigationItem {
  label: string
  href: string
  icon: any // React component
  roles: UserRole[]
  badge?: string
  isPremium?: boolean
  children?: NavigationItem[]
}

export interface DashboardStats {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: any
  description?: string
}
