export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_name: string | null
          resource_type: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_description: string
          action_type: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          address: Json | null
          created_at: string
          email: string
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string
          email: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      agency_members: {
        Row: {
          agency_id: string
          can_manage_clients: boolean | null
          can_manage_projects: boolean | null
          can_manage_team: boolean | null
          can_view_finances: boolean | null
          id: string
          invited_at: string | null
          joined_at: string | null
          user_id: string
        }
        Insert: {
          agency_id: string
          can_manage_clients?: boolean | null
          can_manage_projects?: boolean | null
          can_manage_team?: boolean | null
          can_view_finances?: boolean | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string
          can_manage_clients?: boolean | null
          can_manage_projects?: boolean | null
          can_manage_team?: boolean | null
          can_view_finances?: boolean | null
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cost_cents: number | null
          created_at: string | null
          error_message: string | null
          id: string
          project_id: string | null
          request_type: string
          session_id: string | null
          success: boolean | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          project_id?: string | null
          request_type: string
          session_id?: string | null
          success?: boolean | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          project_id?: string | null
          request_type?: string
          session_id?: string | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      available_integrations: {
        Row: {
          auth_type: string
          auth_url: string | null
          available_for_agency: boolean | null
          available_for_basic: boolean | null
          available_for_enterprise: boolean | null
          available_for_free: boolean | null
          available_for_influencer: boolean | null
          available_for_premium: boolean | null
          available_for_producer: boolean | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          scopes: string[] | null
          slug: string
          token_url: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          auth_type: string
          auth_url?: string | null
          available_for_agency?: boolean | null
          available_for_basic?: boolean | null
          available_for_enterprise?: boolean | null
          available_for_free?: boolean | null
          available_for_influencer?: boolean | null
          available_for_premium?: boolean | null
          available_for_producer?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          scopes?: string[] | null
          slug: string
          token_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          auth_type?: string
          auth_url?: string | null
          available_for_agency?: boolean | null
          available_for_basic?: boolean | null
          available_for_enterprise?: boolean | null
          available_for_free?: boolean | null
          available_for_influencer?: boolean | null
          available_for_premium?: boolean | null
          available_for_producer?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          scopes?: string[] | null
          slug?: string
          token_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      client_api_configs: {
        Row: {
          client_id: string
          created_at: string
          custom_apis: Json | null
          facebook_ads_config: Json | null
          google_ads_config: Json | null
          google_analytics_config: Json | null
          google_search_console_config: Json | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          linkedin_ads_config: Json | null
          microsoft_ads_config: Json | null
          tiktok_ads_config: Json | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          custom_apis?: Json | null
          facebook_ads_config?: Json | null
          google_ads_config?: Json | null
          google_analytics_config?: Json | null
          google_search_console_config?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          linkedin_ads_config?: Json | null
          microsoft_ads_config?: Json | null
          tiktok_ads_config?: Json | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          custom_apis?: Json | null
          facebook_ads_config?: Json | null
          google_ads_config?: Json | null
          google_analytics_config?: Json | null
          google_search_console_config?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          linkedin_ads_config?: Json | null
          microsoft_ads_config?: Json | null
          tiktok_ads_config?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_api_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          agency_id: string | null
          all_day: boolean | null
          attendees: Json | null
          client_id: string
          created_at: string
          description: string | null
          end_date: string | null
          event_type: string | null
          id: string
          location: string | null
          meeting_url: string | null
          project_id: string | null
          start_date: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          all_day?: boolean | null
          attendees?: Json | null
          client_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          project_id?: string | null
          start_date: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          all_day?: boolean | null
          attendees?: Json | null
          client_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          meeting_url?: string | null
          project_id?: string | null
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_usage: {
        Row: {
          action: string
          created_at: string | null
          endpoint: string | null
          error_message: string | null
          id: string
          request_data: Json | null
          response_data: Json | null
          response_time: number | null
          status_code: number | null
          success: boolean | null
          user_id: string
          user_integration_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          response_time?: number | null
          status_code?: number | null
          success?: boolean | null
          user_id: string
          user_integration_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          response_time?: number | null
          status_code?: number | null
          success?: boolean | null
          user_id?: string
          user_integration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_usage_user_integration_id_fkey"
            columns: ["user_integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          read: boolean | null
          related_entity_id: string | null
          related_entity_type: string | null
          scheduled_for: string | null
          sent_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          read?: boolean | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          read?: boolean | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          annual_price: number | null
          api_integrations: Json | null
          created_at: string
          features: Json | null
          id: string
          max_api_calls_month: number | null
          max_campaigns: number | null
          max_clients: number | null
          max_projects: number | null
          max_team_members: number | null
          monthly_price: number | null
          plan_name: string
          updated_at: string
        }
        Insert: {
          annual_price?: number | null
          api_integrations?: Json | null
          created_at?: string
          features?: Json | null
          id?: string
          max_api_calls_month?: number | null
          max_campaigns?: number | null
          max_clients?: number | null
          max_projects?: number | null
          max_team_members?: number | null
          monthly_price?: number | null
          plan_name: string
          updated_at?: string
        }
        Update: {
          annual_price?: number | null
          api_integrations?: Json | null
          created_at?: string
          features?: Json | null
          id?: string
          max_api_calls_month?: number | null
          max_campaigns?: number | null
          max_clients?: number | null
          max_projects?: number | null
          max_team_members?: number | null
          monthly_price?: number | null
          plan_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_collaborators: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          project_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          project_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          project_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string | null
          hourly_rate: number | null
          id: string
          permissions: string[] | null
          project_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          permissions?: string[] | null
          project_id: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          permissions?: string[] | null
          project_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_metrics: {
        Row: {
          clicks: number | null
          conversions: number | null
          cost: number | null
          cpa: number | null
          cpc: number | null
          created_at: string
          ctr: number | null
          date_end: string
          date_start: string
          id: string
          impressions: number | null
          project_id: string
          raw_data: Json | null
          revenue: number | null
          roas: number | null
        }
        Insert: {
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          cpa?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date_end: string
          date_start: string
          id?: string
          impressions?: number | null
          project_id: string
          raw_data?: Json | null
          revenue?: number | null
          roas?: number | null
        }
        Update: {
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          cpa?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date_end?: string
          date_start?: string
          id?: string
          impressions?: number | null
          project_id?: string
          raw_data?: Json | null
          revenue?: number | null
          roas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          agency_id: string | null
          assigned_team: Json | null
          budget: number | null
          campaign_data: Json | null
          campaign_type: string | null
          client_id: string
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          kpis: Json | null
          priority: string | null
          progress: number | null
          spent: number | null
          status: string | null
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          assigned_team?: Json | null
          budget?: number | null
          campaign_data?: Json | null
          campaign_type?: string | null
          client_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          kpis?: Json | null
          priority?: string | null
          progress?: number | null
          spent?: number | null
          status?: string | null
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          assigned_team?: Json | null
          budget?: number | null
          campaign_data?: Json | null
          campaign_type?: string | null
          client_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          kpis?: Json | null
          priority?: string | null
          progress?: number | null
          spent?: number | null
          status?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          id: string
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          attachments: string[] | null
          column_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          position: number
          project_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          attachments?: string[] | null
          column_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          position?: number
          project_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          attachments?: string[] | null
          column_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          position?: number
          project_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_requests_made: number | null
          clients_created: number | null
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          period_type: string | null
          projects_created: number | null
          storage_used_gb: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_requests_made?: number | null
          clients_created?: number | null
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          period_type?: string | null
          projects_created?: number | null
          storage_used_gb?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_requests_made?: number | null
          clients_created?: number | null
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string | null
          projects_created?: number | null
          storage_used_gb?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          connected_account_email: string | null
          connected_account_id: string | null
          connected_account_name: string | null
          created_at: string | null
          encrypted_credentials: Json
          id: string
          integration_id: string
          is_shared_with_agency: boolean | null
          last_error: string | null
          last_sync_at: string | null
          settings: Json | null
          shared_permissions: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connected_account_email?: string | null
          connected_account_id?: string | null
          connected_account_name?: string | null
          created_at?: string | null
          encrypted_credentials: Json
          id?: string
          integration_id: string
          is_shared_with_agency?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          settings?: Json | null
          shared_permissions?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connected_account_email?: string | null
          connected_account_id?: string | null
          connected_account_name?: string | null
          created_at?: string | null
          encrypted_credentials?: Json
          id?: string
          integration_id?: string
          is_shared_with_agency?: boolean | null
          last_error?: string | null
          last_sync_at?: string | null
          settings?: Json | null
          shared_permissions?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "available_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          agency_id: string | null
          company: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          name: string
          phone: string | null
          role: string
          status: string | null
          temp_password: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          accepted_at?: string | null
          agency_id?: string | null
          company?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token: string
          invited_by: string
          name: string
          phone?: string | null
          role?: string
          status?: string | null
          temp_password?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          accepted_at?: string | null
          agency_id?: string | null
          company?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          name?: string
          phone?: string | null
          role?: string
          status?: string | null
          temp_password?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          industry: string | null
          name: string
          notes: string | null
          phone: string | null
          preferences: Json | null
          role: string | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email: string
          id: string
          industry?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_backup: boolean
          created_at: string | null
          email_notifications: boolean
          id: string
          language: string
          marketing_emails: boolean
          push_notifications: boolean
          session_timeout: number
          theme: string
          timezone: string
          two_factor_enabled: boolean
          updated_at: string | null
          user_id: string
          work_days: number[]
          work_hours_end: string
          work_hours_start: string
        }
        Insert: {
          auto_backup?: boolean
          created_at?: string | null
          email_notifications?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          push_notifications?: boolean
          session_timeout?: number
          theme?: string
          timezone?: string
          two_factor_enabled?: boolean
          updated_at?: string | null
          user_id: string
          work_days?: number[]
          work_hours_end?: string
          work_hours_start?: string
        }
        Update: {
          auto_backup?: boolean
          created_at?: string | null
          email_notifications?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          push_notifications?: boolean
          session_timeout?: number
          theme?: string
          timezone?: string
          two_factor_enabled?: boolean
          updated_at?: string | null
          user_id?: string
          work_days?: number[]
          work_hours_end?: string
          work_hours_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_user_invitation: {
        Args:
          | { p_invitation_id: string; p_password: string }
          | { p_token: string; p_password: string }
        Returns: Json
      }
      cancel_invitation: {
        Args: { p_invitation_id: string }
        Returns: Json
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_user_invitation: {
        Args: {
          p_email: string
          p_name: string
          p_role: string
          p_agency_id?: string
          p_company?: string
          p_phone?: string
          p_welcome_message?: string
        }
        Returns: Json
      }
      expire_old_invitations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_current_user_permissions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_pending_invitations: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          name: string
          role: string
          company: string
          agency_name: string
          invited_by_name: string
          expires_at: string
          created_at: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
