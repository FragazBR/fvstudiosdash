-- ==========================================
-- FVSTUDIOS MULTI-TENANT - SETUP FINAL
-- ==========================================
-- Script completo para configuração multi-tenant
-- Cole este código no SQL Editor do Supabase

-- ==========================================
-- RESUMO DO SISTEMA
-- ==========================================

/*
ESTRUTURA MULTI-TENANT:

1. HIERARQUIA:
   Admin Global (vê tudo)
   └── Agência A
       ├── Funcionário da Agência A (vê clientes da agência)
       ├── Cliente 1 da Agência A (APIs próprias, vê apenas seus dados)
       └── Cliente 2 da Agência A (APIs próprias, vê apenas seus dados)
   └── Agência B
       ├── Cliente da Agência B
       └── ...

2. PLANOS DISPONÍVEIS:
   - free: 1 cliente, 3 projetos, só Google Analytics
   - basic: 5 clientes, 20 projetos, Google Ads + Facebook + Analytics
   - premium: 25 clientes, 100 projetos, + LinkedIn + automação
   - enterprise: Ilimitado, todas as integrações
   - agency_basic: 50 clientes, multi-client dashboard
   - agency_pro: 200 clientes, white-label, automação avançada

3. CONFIGURAÇÕES DE API:
   Cada CLIENTE tem suas próprias chaves de API
   Agências gerenciam, mas não possuem as APIs dos clientes
   
4. SEGURANÇA:
   Row Level Security (RLS) em todas as tabelas
   Isolamento completo por tenant
   Permissões granulares por role
*/

-- ==========================================
-- EXTENSÕES NECESSÁRIAS
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- TABELAS PRINCIPAIS
-- ==========================================

-- Agências (Master Tenants)
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),
  logo_url TEXT,
  address JSONB,
  settings JSONB DEFAULT '{}',
  subscription_plan VARCHAR(50) DEFAULT 'agency_basic',
  subscription_status VARCHAR(20) DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Usuários Multi-role
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Hierarquia
  role VARCHAR(50) DEFAULT 'client',
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Dados do Cliente/Usuário
  company VARCHAR(255),
  industry VARCHAR(100),
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
  notes TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurações de API por Cliente (Isoladas)
CREATE TABLE IF NOT EXISTS public.client_api_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- APIs Principais
  google_ads_config JSONB,
  facebook_ads_config JSONB,
  google_analytics_config JSONB,
  google_search_console_config JSONB,
  linkedin_ads_config JSONB,
  tiktok_ads_config JSONB,
  microsoft_ads_config JSONB,
  
  -- APIs Customizadas
  custom_apis JSONB DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(client_id)
);

-- Projetos/Campanhas
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Associações Multi-tenant
  client_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Status e Progresso
  status VARCHAR(50) DEFAULT 'active',
  priority VARCHAR(20) DEFAULT 'medium',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Financeiro
  budget DECIMAL(12,2),
  spent DECIMAL(12,2) DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  
  -- Dados da Campanha
  campaign_type VARCHAR(50),
  campaign_data JSONB DEFAULT '{}',
  kpis JSONB DEFAULT '{}',
  assigned_team JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Métricas de Performance
CREATE TABLE IF NOT EXISTS public.project_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  
  -- Métricas Base
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Métricas Calculadas (automáticas)
  ctr DECIMAL(5,2),
  cpc DECIMAL(8,2),
  cpa DECIMAL(8,2),
  roas DECIMAL(8,2),
  
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Eventos/Calendário
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  event_type VARCHAR(50) DEFAULT 'meeting',
  status VARCHAR(20) DEFAULT 'scheduled',
  location VARCHAR(255),
  meeting_url TEXT,
  
  -- Associações Multi-tenant
  client_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  
  attendees JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  priority VARCHAR(20) DEFAULT 'medium',
  read BOOLEAN DEFAULT false,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  action_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Planos e Limites
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plan_name VARCHAR(50) UNIQUE NOT NULL,
  max_clients INTEGER,
  max_projects INTEGER,
  max_campaigns INTEGER,
  max_api_calls_month INTEGER,
  max_team_members INTEGER,
  features JSONB DEFAULT '[]',
  api_integrations JSONB DEFAULT '[]',
  monthly_price DECIMAL(8,2),
  annual_price DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- CONSTRAINTS DE VALIDAÇÃO
-- ==========================================

-- Aplicar constraints se não existirem
DO $$
BEGIN
  -- User profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'user_profiles_role_check') THEN
    ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('admin', 'agency_owner', 'agency_staff', 'client'));
  END IF;

  -- Projects
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'projects_status_check') THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled'));
  END IF;

  -- Events
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'events_status_check') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_status_check 
    CHECK (status IN ('scheduled', 'completed', 'cancelled'));
  END IF;

  -- Notifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'notifications_type_check') THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('info', 'success', 'warning', 'error', 'campaign_alert'));
  END IF;
END $$;

-- ==========================================
-- ÍNDICES DE PERFORMANCE
-- ==========================================

DO $$
BEGIN
  -- User profiles indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_agency_id') THEN
    CREATE INDEX idx_user_profiles_agency_id ON public.user_profiles(agency_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_role') THEN
    CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
  END IF;

  -- Projects indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_client_id') THEN
    CREATE INDEX idx_projects_client_id ON public.projects(client_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_agency_id') THEN
    CREATE INDEX idx_projects_agency_id ON public.projects(agency_id);
  END IF;

  -- Events indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_client_id') THEN
    CREATE INDEX idx_events_client_id ON public.events(client_id);
  END IF;
  
  -- Notifications indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
    CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
  END IF;
END $$;

-- ==========================================
-- PLANOS DISPONÍVEIS
-- ==========================================

INSERT INTO public.plan_limits (plan_name, max_clients, max_projects, max_campaigns, max_api_calls_month, max_team_members, features, api_integrations, monthly_price, annual_price)
VALUES 
  -- Planos Individuais
  ('free', 1, 3, 3, 1000, 1, 
   '["basic_dashboard", "basic_reports"]',
   '["google_analytics"]', 0, 0),
   
  ('basic', 5, 20, 20, 10000, 3,
   '["dashboard", "reports", "email_alerts"]',
   '["google_analytics", "google_ads", "facebook_ads"]', 99, 990),
   
  ('premium', 25, 100, 100, 50000, 10,
   '["advanced_dashboard", "advanced_reports", "automation", "white_label"]',
   '["google_analytics", "google_ads", "facebook_ads", "linkedin_ads", "google_search_console"]', 299, 2990),
   
  ('enterprise', NULL, NULL, NULL, NULL, NULL,
   '["enterprise_dashboard", "custom_reports", "priority_support", "api_access", "custom_integrations"]',
   '["all_integrations"]', 999, 9990),
   
  -- Planos de Agência
  ('agency_basic', 50, 200, 200, 100000, 25,
   '["multi_client_dashboard", "client_portals", "team_management", "basic_white_label"]',
   '["google_analytics", "google_ads", "facebook_ads", "linkedin_ads"]', 499, 4990),
   
  ('agency_pro', 200, 1000, 1000, 500000, 100,
   '["multi_client_dashboard", "client_portals", "advanced_automation", "full_white_label", "custom_reports", "api_access"]',
   '["all_integrations", "custom_apis"]', 1299, 12990)
ON CONFLICT (plan_name) DO NOTHING;

-- ==========================================
-- HABILITAR ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS RLS ESSENCIAIS
-- ==========================================

DO $$
BEGIN
  -- ===== USER PROFILES =====
  
  -- Usuários podem ver próprio perfil
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
  END IF;

  -- Usuários podem atualizar próprio perfil
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- Admin pode gerenciar todos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admin can manage all') THEN
    CREATE POLICY "Admin can manage all" ON public.user_profiles FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- Agência pode ver/gerenciar seus usuários
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Agency can manage team') THEN
    CREATE POLICY "Agency can manage team" ON public.user_profiles FOR ALL 
    USING (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      ) OR auth.uid() = id
    )
    WITH CHECK (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      ) OR auth.uid() = id
    );
  END IF;

  -- ===== PROJECTS =====
  
  -- Clientes podem gerenciar próprios projetos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Clients can manage own projects') THEN
    CREATE POLICY "Clients can manage own projects" ON public.projects FOR ALL 
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());
  END IF;

  -- Agência pode ver/gerenciar projetos de seus clientes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Agency can manage client projects') THEN
    CREATE POLICY "Agency can manage client projects" ON public.projects FOR ALL 
    USING (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      )
    )
    WITH CHECK (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      )
    );
  END IF;

  -- Admin pode gerenciar todos os projetos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Admin can manage all projects') THEN
    CREATE POLICY "Admin can manage all projects" ON public.projects FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- ===== CLIENT API CONFIGS =====
  
  -- Clientes podem gerenciar próprias configurações
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_api_configs' AND policyname = 'Clients can manage own configs') THEN
    CREATE POLICY "Clients can manage own configs" ON public.client_api_configs FOR ALL 
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());
  END IF;

  -- Agência pode ver (não editar) configurações dos clientes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_api_configs' AND policyname = 'Agency can view client configs') THEN
    CREATE POLICY "Agency can view client configs" ON public.client_api_configs FOR SELECT 
    USING (
      client_id IN (
        SELECT id FROM public.user_profiles 
        WHERE agency_id IN (
          SELECT agency_id FROM public.user_profiles 
          WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
        )
      )
    );
  END IF;

  -- ===== EVENTS =====
  
  -- Clientes podem gerenciar próprios eventos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Clients can manage own events') THEN
    CREATE POLICY "Clients can manage own events" ON public.events FOR ALL 
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());
  END IF;

  -- Agência pode gerenciar eventos de seus clientes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Agency can manage client events') THEN
    CREATE POLICY "Agency can manage client events" ON public.events FOR ALL 
    USING (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      )
    )
    WITH CHECK (
      agency_id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      )
    );
  END IF;

  -- ===== NOTIFICATIONS =====
  
  -- Usuários podem ver próprias notificações
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications') THEN
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- Usuários podem marcar como lida
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications') THEN
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
  END IF;

  -- Sistema pode criar notificações
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'System can create notifications') THEN
    CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
  END IF;

  -- ===== PLAN LIMITS =====
  
  -- Todos podem ver planos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_limits' AND policyname = 'Everyone can view plans') THEN
    CREATE POLICY "Everyone can view plans" ON public.plan_limits FOR SELECT USING (true);
  END IF;

  -- ===== PROJECT METRICS =====
  
  -- Clientes podem ver métricas de seus projetos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_metrics' AND policyname = 'Clients can view own metrics') THEN
    CREATE POLICY "Clients can view own metrics" ON public.project_metrics FOR SELECT 
    USING (
      project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid())
    );
  END IF;

  -- Agência pode ver métricas dos projetos de seus clientes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_metrics' AND policyname = 'Agency can view client metrics') THEN
    CREATE POLICY "Agency can view client metrics" ON public.project_metrics FOR SELECT 
    USING (
      project_id IN (
        SELECT id FROM public.projects 
        WHERE agency_id IN (
          SELECT agency_id FROM public.user_profiles 
          WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
        )
      )
    );
  END IF;

  -- Sistema pode inserir métricas (para automação)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_metrics' AND policyname = 'System can insert metrics') THEN
    CREATE POLICY "System can insert metrics" ON public.project_metrics FOR INSERT WITH CHECK (true);
  END IF;

  -- ===== AGENCIES =====
  
  -- Admin pode ver todas as agências
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies' AND policyname = 'Admin can view all agencies') THEN
    CREATE POLICY "Admin can view all agencies" ON public.agencies FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  -- Agency owners podem ver própria agência
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies' AND policyname = 'Agency owners can view own agency') THEN
    CREATE POLICY "Agency owners can view own agency" ON public.agencies FOR SELECT 
    USING (
      id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role IN ('agency_owner', 'agency_staff')
      )
    );
  END IF;

  -- Agency owners podem atualizar própria agência
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies' AND policyname = 'Agency owners can update own agency') THEN
    CREATE POLICY "Agency owners can update own agency" ON public.agencies FOR UPDATE 
    USING (
      id IN (
        SELECT agency_id FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'agency_owner'
      )
    );
  END IF;
END $$;

-- ==========================================
-- FUNÇÕES E TRIGGERS
-- ==========================================

-- Função updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar config de API quando cliente é criado
CREATE OR REPLACE FUNCTION public.handle_new_client()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'client' THEN
    INSERT INTO public.client_api_configs (client_id)
    VALUES (NEW.id)
    ON CONFLICT (client_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular métricas automaticamente
CREATE OR REPLACE FUNCTION public.calculate_project_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- CTR
  IF NEW.impressions > 0 THEN
    NEW.ctr = (NEW.clicks::DECIMAL / NEW.impressions::DECIMAL) * 100;
  END IF;
  
  -- CPC
  IF NEW.clicks > 0 AND NEW.cost > 0 THEN
    NEW.cpc = NEW.cost / NEW.clicks;
  END IF;
  
  -- CPA
  IF NEW.conversions > 0 AND NEW.cost > 0 THEN
    NEW.cpa = NEW.cost / NEW.conversions;
  END IF;
  
  -- ROAS
  IF NEW.cost > 0 AND NEW.revenue > 0 THEN
    NEW.roas = NEW.revenue / NEW.cost;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_api_configs_updated_at BEFORE UPDATE ON public.client_api_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para auto-criar perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para auto-criar config de API
CREATE TRIGGER on_client_created
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_client();

-- Trigger para calcular métricas
CREATE TRIGGER calculate_metrics_trigger
  BEFORE INSERT OR UPDATE ON public.project_metrics
  FOR EACH ROW EXECUTE FUNCTION public.calculate_project_metrics();

-- ==========================================
-- FUNÇÕES DASHBOARD
-- ==========================================

-- Função dashboard multi-role
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    user_role VARCHAR;
    user_agency_id UUID;
    total_projects INT;
    active_projects INT;
    total_revenue DECIMAL;
    unread_notifications INT;
BEGIN
    -- Obter dados do usuário
    SELECT role, agency_id INTO user_role, user_agency_id
    FROM public.user_profiles WHERE id = auth.uid();
    
    IF user_role IS NULL THEN
        RETURN '{"error": "User not found"}';
    END IF;

    -- Admin - vê tudo
    IF user_role = 'admin' THEN
        SELECT COUNT(*) INTO total_projects FROM public.projects;
        SELECT COUNT(*) INTO active_projects FROM public.projects WHERE status = 'active';
        SELECT COALESCE(SUM(revenue), 0) INTO total_revenue FROM public.project_metrics;
        
        SELECT json_build_object(
            'role', 'admin',
            'totalProjects', total_projects,
            'activeProjects', active_projects,
            'totalRevenue', total_revenue,
            'scope', 'global'
        ) INTO result;
        
    -- Agency - vê dados da agência
    ELSIF user_role IN ('agency_owner', 'agency_staff') THEN
        SELECT COUNT(*) INTO total_projects FROM public.projects WHERE agency_id = user_agency_id;
        SELECT COUNT(*) INTO active_projects FROM public.projects WHERE agency_id = user_agency_id AND status = 'active';
        SELECT COALESCE(SUM(pm.revenue), 0) INTO total_revenue 
        FROM public.project_metrics pm 
        JOIN public.projects p ON pm.project_id = p.id 
        WHERE p.agency_id = user_agency_id;
        
        SELECT json_build_object(
            'role', user_role,
            'agencyId', user_agency_id,
            'totalProjects', total_projects,
            'activeProjects', active_projects,
            'totalRevenue', total_revenue,
            'scope', 'agency'
        ) INTO result;
        
    -- Client - vê apenas seus dados
    ELSE
        SELECT COUNT(*) INTO total_projects FROM public.projects WHERE client_id = auth.uid();
        SELECT COUNT(*) INTO active_projects FROM public.projects WHERE client_id = auth.uid() AND status = 'active';
        SELECT COALESCE(SUM(pm.revenue), 0) INTO total_revenue 
        FROM public.project_metrics pm 
        JOIN public.projects p ON pm.project_id = p.id 
        WHERE p.client_id = auth.uid();
        
        SELECT json_build_object(
            'role', 'client',
            'totalProjects', total_projects,
            'activeProjects', active_projects,
            'totalRevenue', total_revenue,
            'scope', 'client'
        ) INTO result;
    END IF;
    
    -- Notificações não lidas (para todos)
    SELECT COUNT(*) INTO unread_notifications 
    FROM public.notifications 
    WHERE user_id = auth.uid() AND read = false;
    
    -- Adicionar notificações ao resultado
    result := result || json_build_object('unreadNotifications', unread_notifications);
    
    RETURN result;
END;
$$;

-- ==========================================
-- DOCUMENTAÇÃO E COMENTÁRIOS
-- ==========================================

COMMENT ON TABLE public.agencies IS 'Agências - Master tenants, podem ter múltiplos clientes';
COMMENT ON TABLE public.user_profiles IS 'Usuários multi-role: admin, agency_owner, agency_staff, client';
COMMENT ON TABLE public.client_api_configs IS 'Configurações de API individuais POR CLIENTE (isoladas)';
COMMENT ON TABLE public.projects IS 'Projetos/campanhas associados a cliente E agência';
COMMENT ON TABLE public.project_metrics IS 'Métricas com cálculos automáticos (CTR, CPC, CPA, ROAS)';
COMMENT ON TABLE public.events IS 'Sistema de calendário multi-tenant';
COMMENT ON TABLE public.notifications IS 'Notificações contextuais por usuário';
COMMENT ON TABLE public.plan_limits IS 'Definição de limites e recursos por plano de assinatura';

-- ==========================================
-- FINALIZAÇÃO
-- ==========================================

SELECT 
  'FVStudios Multi-tenant Database Setup Complete!' AS status,
  json_build_object(
    'tables_created', 8,
    'policies_created', '20+',
    'functions_created', 4,
    'triggers_created', 6,
    'plans_available', 6,
    'next_steps', 'Execute sample_data.sql para dados de teste'
  ) AS summary;
