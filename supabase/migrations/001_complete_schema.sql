-- ============================================================================
-- FVSTUDIOS DASHBOARD - SCHEMA COMPLETO
-- ============================================================================

-- Tipos enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'agency', 'user', 'client', 'personal');
CREATE TYPE project_status AS ENUM ('planning', 'progress', 'completed', 'on_hold', 'cancelled');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ============================================================================
-- TABELA AGENCIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABELA PROFILES (ATUALIZADA)
-- ============================================================================
-- Primeiro, vamos fazer backup da tabela existente se ela tem dados
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Se a tabela existe, vamos adicionas as colunas que faltam
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'agency_id') THEN
      ALTER TABLE profiles ADD COLUMN agency_id UUID REFERENCES agencies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
      ALTER TABLE profiles ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
      ALTER TABLE profiles ADD COLUMN phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
      ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
      ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Atualizar tipo da coluna role se ainda não é enum
    ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
  ELSE
    -- Se não existe, criar a tabela completa
    CREATE TABLE profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      phone VARCHAR(50),
      role user_role NOT NULL DEFAULT 'personal',
      agency_id UUID REFERENCES agencies(id),
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================================================
-- TABELA CLIENTS (ATUALIZADA)
-- ============================================================================
-- Atualizar tabela clients existente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'agency_id') THEN
      ALTER TABLE clients ADD COLUMN agency_id UUID REFERENCES agencies(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'name') THEN
      ALTER TABLE clients ADD COLUMN name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
      ALTER TABLE clients ADD COLUMN email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'phone') THEN
      ALTER TABLE clients ADD COLUMN phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'updated_at') THEN
      ALTER TABLE clients ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  ELSE
    CREATE TABLE clients (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      agency_id UUID REFERENCES agencies(id) NOT NULL,
      name VARCHAR(255),
      company VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================================================
-- TABELA PROJECTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  agency_id UUID REFERENCES agencies(id),
  status project_status DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABELA TASKS (ATUALIZADA)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    -- Adicionar colunas que faltam
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'project_id') THEN
      ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
      ALTER TABLE tasks ADD COLUMN assigned_to UUID REFERENCES profiles(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') THEN
      ALTER TABLE tasks ADD COLUMN priority task_priority DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
      ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at') THEN
      ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Atualizar tipo da coluna status
    ALTER TABLE tasks ALTER COLUMN status TYPE task_status USING status::task_status;
  ELSE
    CREATE TABLE tasks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      project_id UUID REFERENCES projects(id),
      campaign_id UUID REFERENCES campaigns(id),
      assigned_to UUID REFERENCES profiles(id),
      status task_status DEFAULT 'todo',
      priority task_priority DEFAULT 'medium',
      due_date TIMESTAMP WITH TIME ZONE,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================================================
-- TABELA CAMPAIGNS (ATUALIZADA)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'project_id') THEN
      ALTER TABLE campaigns ADD COLUMN project_id UUID REFERENCES projects(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'name') THEN
      ALTER TABLE campaigns ADD COLUMN name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'updated_at') THEN
      ALTER TABLE campaigns ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  ELSE
    CREATE TABLE campaigns (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      project_id UUID REFERENCES projects(id),
      client_id UUID REFERENCES clients(id),
      platform VARCHAR(100),
      metrics JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================================================
-- TABELA MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  recipient_id UUID REFERENCES profiles(id) NOT NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABELA NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers em todas as tabelas
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at 
            BEFORE UPDATE ON %I 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            tbl, tbl);
    END LOOP;
END $$;

-- ============================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies para PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies para AGENCIES (admin e agency podem ver todas)
CREATE POLICY "Agency admin can manage agencies" ON agencies FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'agency')
  )
);

-- Policies para CLIENTS
CREATE POLICY "Users can view related clients" ON clients FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (role IN ('admin', 'agency') OR agency_id = clients.agency_id)
  )
);

-- Policies para PROJECTS
CREATE POLICY "Users can view related projects" ON projects FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    LEFT JOIN clients c ON c.agency_id = p.agency_id
    WHERE p.id = auth.uid() 
    AND (
      p.role IN ('admin', 'agency') OR 
      c.id = projects.client_id OR
      p.agency_id = projects.agency_id
    )
  )
);

-- Policies para TASKS
CREATE POLICY "Users can view assigned or related tasks" ON tasks FOR SELECT 
USING (
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p
    LEFT JOIN projects pr ON pr.agency_id = p.agency_id
    WHERE p.id = auth.uid() 
    AND (
      p.role IN ('admin', 'agency') OR 
      pr.id = tasks.project_id
    )
  )
);

-- Policies para MESSAGES
CREATE POLICY "Users can view own messages" ON messages FOR SELECT 
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Policies para NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT 
USING (user_id = auth.uid());

-- ============================================================================
-- DADOS DE EXEMPLO (opcional)
-- ============================================================================

-- Inserir agência exemplo
INSERT INTO agencies (id, name, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'FVSTUDIOS', 'contato@fvstudios.com')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_agency_id ON projects(agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_campaigns_project_id ON campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
