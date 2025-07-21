// lib/supabase-client.ts
// Cliente Supabase configurado com os novos tipos

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper functions for common queries
export const supabaseHelpers = {
  // Get user profile with agency info
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *
      `)
      .eq('id', userId)
      .single()

    return { data, error }
  },

  // Get user's agency with members
  async getUserAgency(userId: string) {
    const { data, error } = await supabase
      .from('agencies')
      .select(`
        *,
        members:agency_members(
          id,
          role,
          permissions,
          status,
          user:user_profiles(
            id,
            email,
            name,
            avatar_url,
            role,
            status
          )
        )
      `)
      .eq('owner_id', userId)
      .single()

    return { data, error }
  },

  // Get user's projects with relations
  async getUserProjects(userId: string, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:user_profiles!projects_owner_id_fkey(
          id,
          name,
          avatar_url
        ),
        client:clients(
          id,
          name,
          company
        ),
        agency:agencies(
          id,
          name,
          logo_url
        ),
        collaborators:project_collaborators(
          id,
          role,
          permissions,
          user:user_profiles(
            id,
            name,
            avatar_url
          )
        )
      `)
      .or(`owner_id.eq.${userId},project_collaborators.user_id.eq.${userId}`)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    return { data, error }
  },

  // Get user's clients
  async getUserClients(userId: string, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        owner:user_profiles!clients_owner_id_fkey(
          id,
          name,
          avatar_url
        ),
        agency:agencies(
          id,
          name,
          logo_url
        ),
        projects:projects(
          id,
          name,
          status,
          progress
        )
      `)
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    return { data, error }
  },

  // Get user's usage stats
  async getUserUsageStats(userId: string, period: 'month' | 'year' = 'month') {
    const now = new Date()
    const startDate = new Date()
    
    if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else {
      startDate.setFullYear(now.getFullYear() - 1)
    }

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', startDate.toISOString())
      .order('period_start', { ascending: false })

    return { data, error }
  },

  // Get user's notifications
  async getUserNotifications(userId: string, unreadOnly = false, limit = 20) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data, error }
  },

  // Check if user can perform action
  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    const { data: profile } = await this.getUserProfile(userId)
    
    if (!profile) return false

    // Admin has all permissions
    if (profile.role === 'admin') return true

    // Check role-based permissions using our permission system
    // This would integrate with lib/permissions.ts
    return false // Placeholder - implement with actual permission check
  },

  // Create a new project with proper relations
  async createProject(projectData: any, userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    return { data, error }
  },

  // Create a new client
  async createClient(clientData: any, userId: string) {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    return { data, error }
  },

  // Update user's current usage counts
  async updateUserUsage(
    userId: string, 
    updates: {
      projects?: number
      clients?: number
      ai_requests?: number
      storage_gb?: number
    }
  ) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        current_projects: updates.projects,
        current_clients: updates.clients,
        current_ai_requests: updates.ai_requests,
        current_storage_gb: updates.storage_gb,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  },

  // Log AI usage
  async logAIUsage(
    userId: string,
    requestType: string,
    tokensUsed: number,
    costCents: number,
    projectId?: string,
    success = true,
    errorMessage?: string
  ) {
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: userId,
        request_type: requestType,
        tokens_used: tokensUsed,
        cost_cents: costCents,
        project_id: projectId,
        success,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      })

    return { data, error }
  },

  // Create notification
  async createNotification(
    userId: string,
    type: 'info' | 'warning' | 'success' | 'error',
    title: string,
    message?: string,
    actionUrl?: string,
    actionLabel?: string,
    relatedId?: string,
    relatedType?: string
  ) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        action_label: actionLabel,
        related_id: relatedId,
        related_type: relatedType,
        created_at: new Date().toISOString()
      })

    return { data, error }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    return { data, error }
  }
}

// Export helper for easy access
export default supabaseHelpers
