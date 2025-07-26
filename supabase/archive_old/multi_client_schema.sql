-- ==========================================
-- SCHEMA COMPLETO PARA SISTEMA MULTI-CLIENTE
-- ==========================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. TABELA DE CLIENTES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  company_name text,
  phone text,
  avatar_url text,
  address jsonb DEFAULT '{}'::jsonb,
  -- Informações de negócio
  industry text,
  company_size text CHECK (company_size IN ('small', 'medium', 'large', 'enterprise')),
  monthly_budget numeric(10,2),
  -- Relacionamentos
  agency_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  account_manager_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  -- Status e configurações
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  subscription_tier text DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
  -- Configurações de acesso
  portal_access boolean DEFAULT true,
  notifications_enabled boolean DEFAULT true,
  -- Metadados
  onboarding_completed boolean DEFAULT false,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- Tags para categorização
  tags text[] DEFAULT '{}'::text[]
);

-- ==========================================
-- 2. TABELA DE PROJETOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  -- Relacionamentos
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  project_manager_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  -- Informações do projeto
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  -- Datas e prazos
  start_date date,
  end_date date,
  deadline date,
  -- Orçamento e custos
  budget numeric(12,2),
  spent_amount numeric(12,2) DEFAULT 0,
  estimated_hours integer,
  actual_hours integer DEFAULT 0,
  -- Configurações
  visibility text DEFAULT 'client_visible' CHECK (visibility IN ('internal_only', 'client_visible', 'public')),
  billing_type text DEFAULT 'fixed' CHECK (billing_type IN ('fixed', 'hourly', 'milestone')),
  -- Metadados
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- Campos adicionais
  custom_fields jsonb DEFAULT '{}'::jsonb,
  attachments_count integer DEFAULT 0
);

-- ==========================================
-- 3. TABELA DE TAREFAS (ATUALIZADA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  -- Relacionamentos
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_by_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  -- Status e prioridade
  status text DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  -- Datas
  due_date timestamp with time zone,
  start_date timestamp with time zone,
  completed_at timestamp with time zone,
  -- Estimativas e tempo
  estimated_hours numeric(5,2),
  actual_hours numeric(5,2) DEFAULT 0,
  story_points integer,
  -- Progresso
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  -- Configurações
  is_billable boolean DEFAULT true,
  visibility text DEFAULT 'team' CHECK (visibility IN ('private', 'team', 'client', 'public')),
  -- Relacionamentos entre tarefas
  parent_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  depends_on_task_ids uuid[] DEFAULT '{}'::uuid[],
  -- Metadados
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- Campos personalizados
  custom_fields jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[]
);

-- ==========================================
-- 4. TABELA DE SUBTAREFAS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subtasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false,
  assignee_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- Ordem das subtarefas
  sort_order integer DEFAULT 0
);

-- ==========================================
-- 5. TABELA DE COMENTÁRIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  comment_type text DEFAULT 'comment' CHECK (comment_type IN ('comment', 'status_change', 'assignment', 'attachment')),
  -- Metadados para mudanças de status
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- Resposta a outro comentário
  parent_comment_id uuid REFERENCES public.task_comments(id) ON DELETE SET NULL
);

-- ==========================================
-- 6. TABELA DE ANEXOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Relacionamentos polimórficos
  entity_type text NOT NULL CHECK (entity_type IN ('task', 'project', 'client', 'comment')),
  entity_id uuid NOT NULL,
  -- Informações do arquivo
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  -- Metadados
  uploaded_by_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 7. TABELA DE TEMPO REGISTRADO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  -- Informações de tempo
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  duration_minutes integer, -- calculado automaticamente
  description text,
  -- Faturamento
  is_billable boolean DEFAULT true,
  hourly_rate numeric(8,2),
  billed_amount numeric(10,2),
  billed_at timestamp with time zone,
  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'billed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 8. TABELA DE NOTIFICAÇÕES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('task_assigned', 'task_completed', 'task_overdue', 'project_update', 'client_message', 'system')),
  -- Relacionamentos
  entity_type text CHECK (entity_type IN ('task', 'project', 'client', 'user')),
  entity_id uuid,
  -- Status
  is_read boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  -- Configurações
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  action_url text,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  archived_at timestamp with time zone
);

-- ==========================================
-- 9. TABELA DE RELACIONAMENTO USUÁRIO-PROJETO
-- ==========================================
CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  permissions jsonb DEFAULT '{}'::jsonb,
  joined_at timestamp with time zone DEFAULT now(),
  -- Constraint para evitar duplicatas
  UNIQUE(project_id, user_id)
);

-- ==========================================
-- 10. TABELA DE CONFIGURAÇÕES DE CLIENTE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.client_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  -- Configurações de notificação
  email_notifications boolean DEFAULT true,
  task_updates boolean DEFAULT true,
  project_updates boolean DEFAULT true,
  deadline_reminders boolean DEFAULT true,
  -- Configurações de interface
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'pt-BR',
  timezone text DEFAULT 'America/Sao_Paulo',
  -- Configurações de acesso
  can_create_tasks boolean DEFAULT false,
  can_comment_tasks boolean DEFAULT true,
  can_upload_files boolean DEFAULT true,
  can_view_time_entries boolean DEFAULT false,
  can_view_budget boolean DEFAULT false,
  -- Outras configurações
  custom_branding jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TRIGGERS PARA UPDATED_AT
-- ==========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas as tabelas que precisam
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON public.subtasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_client_settings_updated_at
  BEFORE UPDATE ON public.client_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON public.clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON public.projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON public.projects(project_manager_id);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- Índices para subtasks
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_completed ON public.subtasks(completed);

-- Índices para comments
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(created_at);

-- Índices para attachments
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.attachments(uploaded_by_id);

-- Índices para time_entries
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON public.time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_client_id ON public.time_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON public.time_entries(start_time);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Índices para project_members
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

-- ==========================================
-- RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS serão criadas em um arquivo separado para melhor organização