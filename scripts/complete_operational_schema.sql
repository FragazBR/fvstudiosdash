-- ==========================================
-- SCHEMA OPERACIONAL COMPLETO - SISTEMA FUNCIONAL
-- ==========================================

-- PARTE 1: ESTRUTURA BÁSICA (já existente)
-- user_profiles, agencies - mantemos como está

-- PARTE 2: SISTEMA DE PROJETOS E TAREFAS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  -- Status e controle
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Orçamento e prazos
  budget_total DECIMAL(15,2),
  budget_spent DECIMAL(15,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  
  -- Metadados
  tags TEXT[],
  color VARCHAR(7) DEFAULT '#3b82f6',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  -- Status Kanban
  status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Progresso e tempo
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2) DEFAULT 0,
  
  -- Datas
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ordenação no Kanban
  position INTEGER DEFAULT 0,
  
  -- Metadados
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTE 3: SISTEMA DE CALENDÁRIO
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  
  -- Dados do evento
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  
  -- Tipo e categorização
  event_type VARCHAR(50) DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'deadline', 'reminder', 'task', 'personal')),
  color VARCHAR(7) DEFAULT '#3b82f6',
  
  -- Recorrência
  recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT, -- JSON para padrão de recorrência
  
  -- Notificações
  reminder_minutes INTEGER DEFAULT 15,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTE 4: CRM COMPLETO
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(255),
  
  -- Relacionamentos
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Dados de contato
  address TEXT,
  website VARCHAR(255),
  linkedin_url VARCHAR(255),
  
  -- Classificação CRM
  contact_type VARCHAR(50) DEFAULT 'lead' CHECK (contact_type IN ('lead', 'prospect', 'client', 'partner', 'supplier')),
  lead_source VARCHAR(100),
  lead_score INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  
  -- Metadados
  tags TEXT[],
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Dados da interação
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('email', 'call', 'meeting', 'proposal', 'contract', 'note')),
  subject VARCHAR(255),
  content TEXT,
  
  -- Resultados
  outcome VARCHAR(100),
  next_action VARCHAR(255),
  next_action_date TIMESTAMP WITH TIME ZONE,
  
  -- Arquivos anexados
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTE 5: SISTEMA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Conteúdo da notificação
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  -- Tipo e categoria
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'task', 'project', 'payment', 'system')),
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  
  -- Dados relacionados
  related_id UUID, -- ID do objeto relacionado (task, project, etc)
  related_type VARCHAR(50), -- Tipo do objeto relacionado
  
  -- URL de ação
  action_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTE 6: SISTEMA DE CHAT
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Dados da conversa
  name VARCHAR(255),
  type VARCHAR(50) DEFAULT 'project' CHECK (type IN ('project', 'direct', 'group')),
  
  -- Participantes (JSON array de user IDs)
  participants JSONB NOT NULL DEFAULT '[]',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Conteúdo
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  
  -- Arquivos anexados
  attachments JSONB DEFAULT '[]',
  
  -- Status
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Reações
  reactions JSONB DEFAULT '{}', -- {emoji: [user_ids]}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- PARTE 7: SISTEMA DE RELATÓRIOS E MÉTRICAS
CREATE TABLE IF NOT EXISTS public.project_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Métricas de tempo
  total_hours_logged DECIMAL(10,2) DEFAULT 0,
  total_hours_estimated DECIMAL(10,2) DEFAULT 0,
  
  -- Métricas de tarefas
  tasks_total INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  tasks_overdue INTEGER DEFAULT 0,
  
  -- Métricas financeiras
  budget_utilization DECIMAL(5,2) DEFAULT 0, -- Percentual usado do orçamento
  
  -- Data da métrica
  metric_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTE 8: CONFIGURAÇÕES E INTEGRAÇÕES
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Tipo de integração
  integration_type VARCHAR(100) NOT NULL, -- 'google_analytics', 'facebook_ads', etc
  
  -- Configurações (JSON)
  config_data JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON public.projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON public.calendar_events(project_id);

CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON public.contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON public.contacts(contact_type);

CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact_id ON public.contact_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_created_at ON public.contact_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas necessárias
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PARTE 9: POLÍTICAS RLS BÁSICAS
-- Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agency projects" ON public.projects 
FOR SELECT USING (
  agency_id IN (
    SELECT agency_id FROM public.user_profiles WHERE id = auth.uid()
  ) OR
  client_id = auth.uid() OR
  created_by = auth.uid()
);

CREATE POLICY "Agency users can manage projects" ON public.projects 
FOR ALL USING (
  agency_id IN (
    SELECT agency_id FROM public.user_profiles WHERE id = auth.uid()
  ) OR
  created_by = auth.uid()
);

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view related tasks" ON public.tasks 
FOR SELECT USING (
  project_id IN (
    SELECT id FROM public.projects WHERE 
    agency_id IN (
      SELECT agency_id FROM public.user_profiles WHERE id = auth.uid()
    ) OR
    client_id = auth.uid() OR
    created_by = auth.uid()
  ) OR
  assigned_to = auth.uid() OR
  created_by = auth.uid()
);

CREATE POLICY "Users can manage tasks" ON public.tasks 
FOR ALL USING (
  project_id IN (
    SELECT id FROM public.projects WHERE 
    agency_id IN (
      SELECT agency_id FROM public.user_profiles WHERE id = auth.uid()
    ) OR
    created_by = auth.uid()
  ) OR
  assigned_to = auth.uid() OR
  created_by = auth.uid()
);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications 
FOR UPDATE USING (user_id = auth.uid());

-- Admin bypass para todas as tabelas
CREATE POLICY "Admin full access projects" ON public.projects 
FOR ALL USING (auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid);

CREATE POLICY "Admin full access tasks" ON public.tasks 
FOR ALL USING (auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid);

CREATE POLICY "Admin full access notifications" ON public.notifications 
FOR ALL USING (auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid);

SELECT 'Schema operacional completo criado com sucesso!' AS status;