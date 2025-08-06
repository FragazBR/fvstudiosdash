-- SCHEMA AVANÇADO PARA PROJETOS INTEGRADOS
-- Execute no Supabase SQL Editor

-- 1. Adicionar campos ao projects se não existirem
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'website',
ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(50) DEFAULT 'waterfall',
ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}'::JSONB;

-- 2. Criar tabela de marcos/milestones do projeto
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, overdue
    completion_date TIMESTAMPTZ,
    agency_id UUID NOT NULL REFERENCES agencies(id),
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela de membros da equipe do projeto
CREATE TABLE IF NOT EXISTS project_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    role VARCHAR(50) DEFAULT 'member', -- leader, member, viewer
    permissions JSONB DEFAULT '{}'::JSONB,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(project_id, user_id)
);

-- 4. Atualizar tabela de tasks para suportar dependências
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS dependencies UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'general', -- general, milestone, bug, feature
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id);

-- 5. Criar tabela de comentários de tarefas
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    comment TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar tabela de arquivos do projeto
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}'
);

-- 7. Criar tabela de templates de projeto
CREATE TABLE IF NOT EXISTS project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    project_type VARCHAR(50),
    template_data JSONB NOT NULL, -- estrutura completa do template
    default_tasks JSONB DEFAULT '[]'::JSONB,
    default_milestones JSONB DEFAULT '[]'::JSONB,
    agency_id UUID REFERENCES agencies(id),
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Criar tabela de time tracking
CREATE TABLE IF NOT EXISTS task_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    is_billable BOOLEAN DEFAULT TRUE,
    hourly_rate DECIMAL(8,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Criar tabela de notificações do projeto
CREATE TABLE IF NOT EXISTS project_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    notification_type VARCHAR(50) NOT NULL, -- task_assigned, deadline_reminder, status_change, etc
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Criar tabela de mensagens/chat do projeto
CREATE TABLE IF NOT EXISTS project_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, file, system, mention
    attachments JSONB DEFAULT '[]'::JSONB,
    mentions UUID[] DEFAULT '{}', -- IDs dos usuários mencionados
    reply_to UUID REFERENCES project_messages(id),
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Criar tabela de eventos do calendário
CREATE TABLE IF NOT EXISTS project_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'meeting', -- meeting, deadline, review, delivery
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT FALSE,
    location TEXT,
    attendees UUID[] DEFAULT '{}',
    meeting_link TEXT,
    reminder_minutes INTEGER DEFAULT 30,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_due_date ON project_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_user_id ON project_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_task_id ON project_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_task_id ON task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user_id ON task_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_project_notifications_user_id ON project_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_project_notifications_is_read ON project_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_calendar_events_project_id ON project_calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_calendar_events_start_time ON project_calendar_events(start_time);

-- 13. Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_project_milestones_updated_at 
    BEFORE UPDATE ON project_milestones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_task_comments_updated_at 
    BEFORE UPDATE ON task_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_project_templates_updated_at 
    BEFORE UPDATE ON project_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_project_calendar_events_updated_at 
    BEFORE UPDATE ON project_calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Habilitar RLS (Row Level Security)
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_calendar_events ENABLE ROW LEVEL SECURITY;

-- 15. Criar políticas RLS básicas (exemplo para project_milestones)
CREATE POLICY "Users can view milestones from their agency" ON project_milestones
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create milestones in their agency" ON project_milestones
    FOR INSERT WITH CHECK (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update milestones in their agency" ON project_milestones
    FOR UPDATE USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete milestones in their agency" ON project_milestones
    FOR DELETE USING (
        agency_id IN (
            SELECT agency_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Repetir políticas similares para outras tabelas...

-- 16. Criar função para estatísticas do projeto
CREATE OR REPLACE FUNCTION get_project_stats(project_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_tasks', (
            SELECT COUNT(*) FROM tasks WHERE project_id = project_uuid
        ),
        'completed_tasks', (
            SELECT COUNT(*) FROM tasks WHERE project_id = project_uuid AND status = 'completed'
        ),
        'overdue_tasks', (
            SELECT COUNT(*) FROM tasks 
            WHERE project_id = project_uuid 
            AND due_date < CURRENT_DATE 
            AND status != 'completed'
        ),
        'total_hours_estimated', (
            SELECT COALESCE(SUM(estimated_hours), 0) FROM tasks WHERE project_id = project_uuid
        ),
        'total_hours_logged', (
            SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 
            FROM task_time_entries tte
            JOIN tasks t ON t.id = tte.task_id
            WHERE t.project_id = project_uuid
        ),
        'team_members_count', (
            SELECT COUNT(*) FROM project_team_members WHERE project_id = project_uuid
        ),
        'completion_percentage', (
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed') * 100.0) / COUNT(*))
            END
            FROM tasks WHERE project_id = project_uuid
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 17. Criar função para dashboard de tarefas por usuário
CREATE OR REPLACE FUNCTION get_user_task_dashboard(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'tasks_assigned', (
            SELECT COUNT(*) FROM tasks WHERE assigned_to = user_uuid
        ),
        'tasks_completed_this_week', (
            SELECT COUNT(*) FROM tasks 
            WHERE assigned_to = user_uuid 
            AND status = 'completed'
            AND updated_at >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'tasks_overdue', (
            SELECT COUNT(*) FROM tasks 
            WHERE assigned_to = user_uuid 
            AND due_date < CURRENT_DATE 
            AND status != 'completed'
        ),
        'hours_logged_this_week', (
            SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 
            FROM task_time_entries 
            WHERE user_id = user_uuid
            AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'active_projects', (
            SELECT COUNT(DISTINCT p.id) 
            FROM projects p
            JOIN tasks t ON t.project_id = p.id
            WHERE t.assigned_to = user_uuid AND p.status = 'active'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comentários de conclusão
-- Este schema suporta:
-- ✅ Projetos com tarefas integradas
-- ✅ Gestão de equipe por projeto  
-- ✅ Marcos e cronograma
-- ✅ Sistema de comentários e arquivos
-- ✅ Time tracking
-- ✅ Notificações contextuais
-- ✅ Chat/mensagens por projeto
-- ✅ Calendário de eventos
-- ✅ Templates de projeto
-- ✅ Estatísticas e dashboard
-- ✅ Row Level Security (RLS)
-- ✅ Performance otimizada com índices