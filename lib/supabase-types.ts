// ==========================================
// TIPOS TYPESCRIPT PARA O SISTEMA MULTI-CLIENTE
// ==========================================

// Interface para Perfil de Usuário
export interface PerfilUsuario {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company_name?: string;
  phone?: string;
  avatar_url?: string;
  address?: Record<string, any>;
  industry?: string;
  company_size?: 'small' | 'medium' | 'large' | 'enterprise';
  monthly_budget?: number;
  agency_id: string;
  account_manager_id?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  subscription_tier: 'basic' | 'premium' | 'enterprise';
  portal_access: boolean;
  notifications_enabled: boolean;
  onboarding_completed: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  agency_id: string;
  project_manager_id?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  end_date?: string;
  deadline?: string;
  budget?: number;
  spent_amount: number;
  estimated_hours?: number;
  actual_hours: number;
  visibility: 'internal_only' | 'client_visible' | 'public';
  billing_type: 'fixed' | 'hourly' | 'milestone';
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, any>;
  attachments_count: number;
  // Relacionamentos
  client?: Client;
  project_manager?: PerfilUsuario;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id: string;
  client_id: string;
  assignee_id?: string;
  created_by_id?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  start_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours: number;
  story_points?: number;
  progress_percentage: number;
  is_billable: boolean;
  visibility: 'private' | 'team' | 'client' | 'public';
  parent_task_id?: string;
  depends_on_task_ids: string[];
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, any>;
  tags: string[];
  // Relacionamentos
  project?: Project;
  client?: Client;
  assignee?: PerfilUsuario;
  created_by?: PerfilUsuario;
  subtasks?: Subtarefa[];
  comments?: ComentarioTarefa[];
  attachments?: Anexo[];
}

export interface Subtarefa {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  completed: boolean;
  assignee_id?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
  // Relacionamentos
  task?: Task;
  assignee?: PerfilUsuario;
}

export interface ComentarioTarefa {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  comment_type: 'comment' | 'status_change' | 'assignment' | 'attachment';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  parent_comment_id?: string;
  // Relacionamentos
  task?: Task;
  user?: PerfilUsuario;
  parent_comment?: ComentarioTarefa;
  replies?: ComentarioTarefa[];
}

export interface Anexo {
  id: string;
  entity_type: 'task' | 'project' | 'client' | 'comment';
  entity_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  uploaded_by_id: string;
  description?: string;
  created_at: string;
  // Relacionamentos
  uploaded_by?: PerfilUsuario;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  project_id: string;
  client_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  is_billable: boolean;
  hourly_rate?: number;
  billed_amount?: number;
  billed_at?: string;
  status: 'draft' | 'submitted' | 'approved' | 'billed';
  created_at: string;
  updated_at: string;
  // Relacionamentos
  task?: Task;
  user?: PerfilUsuario;
  project?: Project;
  client?: Client;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: 'task_assigned' | 'task_completed' | 'task_overdue' | 'project_update' | 'client_message' | 'system';
  entity_type?: 'task' | 'project' | 'client' | 'user';
  entity_id?: string;
  is_read: boolean;
  is_archived: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  created_at: string;
  read_at?: string;
  archived_at?: string;
  // Relacionamentos
  user?: PerfilUsuario;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'member' | 'viewer';
  permissions?: Record<string, any>;
  joined_at: string;
  // Relacionamentos
  project?: Project;
  user?: PerfilUsuario;
}

export interface ClientSettings {
  id: string;
  client_id: string;
  email_notifications: boolean;
  task_updates: boolean;
  project_updates: boolean;
  deadline_reminders: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  can_create_tasks: boolean;
  can_comment_tasks: boolean;
  can_upload_files: boolean;
  can_view_time_entries: boolean;
  can_view_budget: boolean;
  custom_branding?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  client?: Client;
}

// ==========================================
// TIPOS PARA ESTATÍSTICAS E DASHBOARDS
// ==========================================

export interface ClientStats {
  id: string;
  name: string;
  company_name?: string;
  avatar_url?: string;
  status: string;
  subscription_tier: string;
  projects_count: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_budget: number;
  spent_amount: number;
  last_activity?: string;
  progress_percentage: number;
}

export interface ProjectStats {
  id: string;
  name: string;
  client_name: string;
  status: string;
  priority: string;
  progress_percentage: number;
  tasks_count: number;
  completed_tasks: number;
  overdue_tasks: number;
  budget?: number;
  spent_amount: number;
  deadline?: string;
  days_remaining?: number;
  is_overdue: boolean;
}

export interface TaskStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  high_priority_tasks: number;
  tasks_this_week: number;
  completion_rate: number;
}

export interface DashboardData {
  client_stats: ClientStats[];
  project_stats: ProjectStats[];
  task_stats: TaskStats;
  recent_activities: any[];
  upcoming_deadlines: any[];
}

// ==========================================
// TIPOS PARA FILTROS E BUSCAS
// ==========================================

export interface TaskFilters {
  status?: Task['status'][];
  priority?: Task['priority'][];
  assignee_id?: string[];
  client_id?: string[];
  project_id?: string[];
  due_date_range?: {
    start?: string;
    end?: string;
  };
  tags?: string[];
  search?: string;
}

export interface ProjectFilters {
  status?: Project['status'][];
  priority?: Project['priority'][];
  client_id?: string[];
  project_manager_id?: string[];
  deadline_range?: {
    start?: string;
    end?: string;
  };
  search?: string;
}

export interface ClientFilters {
  status?: Client['status'][];
  subscription_tier?: Client['subscription_tier'][];
  industry?: string[];
  company_size?: Client['company_size'][];
  tags?: string[];
  search?: string;
}

// ==========================================
// TIPOS PARA CALENDAR INTEGRATION
// ==========================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  all_day?: boolean;
  event_type: 'task' | 'project_deadline' | 'meeting' | 'reminder';
  entity_id: string;
  entity_type: 'task' | 'project' | 'client';
  client_id?: string;
  project_id?: string;
  assignee_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  color?: string;
  url?: string;
}

// ==========================================
// TIPOS PARA FORMS E INPUTS
// ==========================================

export interface CreateClientForm {
  name: string;
  email: string;
  company_name?: string;
  phone?: string;
  industry?: string;
  company_size?: Client['company_size'];
  monthly_budget?: number;
  subscription_tier: Client['subscription_tier'];
  tags?: string[];
}

export interface CreateProjectForm {
  name: string;
  description?: string;
  client_id: string;
  project_manager_id?: string;
  status: Project['status'];
  priority: Project['priority'];
  start_date?: string;
  end_date?: string;
  deadline?: string;
  budget?: number;
  estimated_hours?: number;
  visibility: Project['visibility'];
  billing_type: Project['billing_type'];
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  project_id: string;
  assignee_id?: string;
  status: Task['status'];
  priority: Task['priority'];
  due_date?: string;
  estimated_hours?: number;
  visibility: Task['visibility'];
  tags?: string[];
}