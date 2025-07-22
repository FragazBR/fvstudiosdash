// Tipos simplificados para resolver problemas de build
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
        }
      }
      agencies: {
        Row: {
          id: string
          name: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          client_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          client_id: string
        }
        Update: {
          id?: string
          title?: string
          client_id?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
        }
        Update: {
          id?: string
          content?: string
        }
      }
      notifications: {
        Row: {
          id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
        }
        Update: {
          id?: string
          title?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
        }
        Update: {
          id?: string
          title?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}