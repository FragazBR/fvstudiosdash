-- ==========================================
-- DADOS DE TESTE PARA SISTEMA MULTI-CLIENTE
-- ==========================================

-- Inserir clientes de teste
INSERT INTO public.clients (
  id,
  name,
  email,
  company_name,
  phone,
  industry,
  company_size,
  monthly_budget,
  agency_id,
  account_manager_id,
  status,
  subscription_tier,
  onboarding_completed,
  tags
) VALUES 
-- Cliente 1: TechCorp Solutions
(
  uuid_generate_v4(),
  'João Silva',
  'joao@techcorp.com',
  'TechCorp Solutions',
  '+55 11 99999-1111',
  'technology',
  'medium',
  15000.00,
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'active',
  'premium',
  true,
  ARRAY['tech', 'b2b', 'startup']
),
-- Cliente 2: Creative Agency
(
  uuid_generate_v4(),
  'Maria Santos',
  'maria@creativeagency.com',
  'Creative Agency',
  '+55 11 99999-2222',
  'marketing',
  'small',
  8000.00,
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'active',
  'basic',
  true,
  ARRAY['creative', 'marketing', 'design']
),
-- Cliente 3: RetailPro
(
  uuid_generate_v4(),
  'Pedro Costa',
  'pedro@retailpro.com',
  'RetailPro',
  '+55 11 99999-3333',
  'retail',
  'large',
  25000.00,
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'active',
  'enterprise',
  true,
  ARRAY['retail', 'e-commerce', 'b2c']
),
-- Cliente 4: StartupX
(
  uuid_generate_v4(),
  'Ana Oliveira',
  'ana@startupx.com',
  'StartupX Inc',
  '+55 11 99999-4444',
  'fintech',
  'small',
  5000.00,
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'active',
  'basic',
  false,
  ARRAY['fintech', 'startup', 'b2b']
),
-- Cliente 5: Fashion Forward
(
  uuid_generate_v4(),
  'Carlos Mendes',
  'carlos@fashionforward.com',
  'Fashion Forward',
  '+55 11 99999-5555',
  'fashion',
  'medium',
  12000.00,
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'active',
  'premium',
  true,
  ARRAY['fashion', 'lifestyle', 'b2c']
);

-- Inserir projetos de teste para os clientes
INSERT INTO public.projects (
  id,
  name,
  description,
  client_id,
  agency_id,
  project_manager_id,
  status,
  priority,
  start_date,
  end_date,
  deadline,
  budget,
  estimated_hours,
  visibility,
  billing_type
) VALUES 
-- Projetos para TechCorp Solutions
(
  uuid_generate_v4(),
  'Website Redesign',
  'Redesenhar o website corporativo com nova identidade visual',
  (SELECT id FROM public.clients WHERE company_name = 'TechCorp Solutions'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'active',
  'high',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 months',
  CURRENT_DATE + INTERVAL '2.5 months',
  18000.00,
  120,
  'client_visible',
  'fixed'
),
-- Projeto para Creative Agency
(
  uuid_generate_v4(),
  'Brand Identity Package',
  'Desenvolvimento completo da identidade visual da marca',
  (SELECT id FROM public.clients WHERE company_name = 'Creative Agency'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'active',
  'medium',
  CURRENT_DATE - INTERVAL '1 month',
  CURRENT_DATE + INTERVAL '2 months',
  CURRENT_DATE + INTERVAL '1.5 months',
  12000.00,
  80,
  'client_visible',
  'milestone'
),
-- Projeto para RetailPro
(
  uuid_generate_v4(),
  'E-commerce Platform',
  'Desenvolvimento de plataforma de e-commerce completa',
  (SELECT id FROM public.clients WHERE company_name = 'RetailPro'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'planning',
  'high',
  CURRENT_DATE + INTERVAL '1 week',
  CURRENT_DATE + INTERVAL '6 months',
  CURRENT_DATE + INTERVAL '5 months',
  45000.00,
  300,
  'client_visible',
  'hourly'
),
-- Projeto para StartupX
(
  uuid_generate_v4(),
  'Mobile App Development',
  'Aplicativo mobile para plataforma fintech',
  (SELECT id FROM public.clients WHERE company_name = 'StartupX Inc'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'active',
  'urgent',
  CURRENT_DATE - INTERVAL '2 weeks',
  CURRENT_DATE + INTERVAL '4 months',
  CURRENT_DATE + INTERVAL '3.5 months',
  25000.00,
  200,
  'client_visible',
  'fixed'
),
-- Projeto para Fashion Forward
(
  uuid_generate_v4(),
  'Digital Campaign',
  'Campanha digital integrada para lançamento de coleção',
  (SELECT id FROM public.clients WHERE company_name = 'Fashion Forward'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'completed',
  'medium',
  CURRENT_DATE - INTERVAL '3 months',
  CURRENT_DATE - INTERVAL '1 week',
  CURRENT_DATE - INTERVAL '2 weeks',
  15000.00,
  100,
  'client_visible',
  'fixed'
);

-- Inserir tarefas de teste
INSERT INTO public.tasks (
  id,
  title,
  description,
  project_id,
  client_id,
  assignee_id,
  created_by_id,
  status,
  priority,
  due_date,
  estimated_hours,
  progress_percentage,
  visibility
) VALUES 
-- Tarefas para Website Redesign (TechCorp)
(
  uuid_generate_v4(),
  'Criar wireframes da página inicial',
  'Desenvolver wireframes detalhados para a nova homepage',
  (SELECT id FROM public.projects WHERE name = 'Website Redesign'),
  (SELECT id FROM public.clients WHERE company_name = 'TechCorp Solutions'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'in_progress',
  'high',
  CURRENT_DATE + INTERVAL '1 week',
  8.0,
  65,
  'client'
),
(
  uuid_generate_v4(),
  'Definir paleta de cores',
  'Escolher e definir a nova paleta de cores da marca',
  (SELECT id FROM public.projects WHERE name = 'Website Redesign'),
  (SELECT id FROM public.clients WHERE company_name = 'TechCorp Solutions'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'todo',
  'medium',
  CURRENT_DATE + INTERVAL '3 days',
  4.0,
  0,
  'client'
),
-- Tarefas para Brand Identity (Creative Agency)
(
  uuid_generate_v4(),
  'Pesquisa de mercado',
  'Análise da concorrência e tendências do setor',
  (SELECT id FROM public.projects WHERE name = 'Brand Identity Package'),
  (SELECT id FROM public.clients WHERE company_name = 'Creative Agency'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'done',
  'medium',
  CURRENT_DATE - INTERVAL '1 week',
  12.0,
  100,
  'client'
),
(
  uuid_generate_v4(),
  'Desenvolvimento do logotipo',
  'Criação de opções de logotipo para aprovação',
  (SELECT id FROM public.projects WHERE name = 'Brand Identity Package'),
  (SELECT id FROM public.clients WHERE company_name = 'Creative Agency'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'in_review',
  'high',
  CURRENT_DATE + INTERVAL '5 days',
  16.0,
  90,
  'client'
),
-- Tarefas para E-commerce Platform (RetailPro)
(
  uuid_generate_v4(),
  'Análise de requisitos',
  'Levantamento detalhado dos requisitos funcionais',
  (SELECT id FROM public.projects WHERE name = 'E-commerce Platform'),
  (SELECT id FROM public.clients WHERE company_name = 'RetailPro'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'backlog',
  'high',
  CURRENT_DATE + INTERVAL '2 weeks',
  20.0,
  0,
  'team'
),
-- Tarefas para Mobile App (StartupX)
(
  uuid_generate_v4(),
  'Prototipagem UX/UI',
  'Desenvolvimento dos protótipos de interface do usuário',
  (SELECT id FROM public.projects WHERE name = 'Mobile App Development'),
  (SELECT id FROM public.clients WHERE company_name = 'StartupX Inc'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'in_progress',
  'urgent',
  CURRENT_DATE + INTERVAL '1 week',
  24.0,
  40,
  'client'
);

-- Inserir subtarefas de exemplo
INSERT INTO public.subtasks (
  id,
  task_id,
  title,
  completed,
  sort_order
) VALUES 
-- Subtarefas para "Criar wireframes da página inicial"
(
  uuid_generate_v4(),
  (SELECT id FROM public.tasks WHERE title = 'Criar wireframes da página inicial'),
  'Definir layout do header',
  true,
  1
),
(
  uuid_generate_v4(),
  (SELECT id FROM public.tasks WHERE title = 'Criar wireframes da página inicial'),
  'Estruturar seção hero',
  true,
  2
),
(
  uuid_generate_v4(),
  (SELECT id FROM public.tasks WHERE title = 'Criar wireframes da página inicial'),
  'Organizar seções de conteúdo',
  false,
  3
),
(
  uuid_generate_v4(),
  (SELECT id FROM public.tasks WHERE title = 'Criar wireframes da página inicial'),
  'Definir footer',
  false,
  4
);

-- Inserir configurações padrão para os clientes
INSERT INTO public.client_settings (
  client_id,
  email_notifications,
  task_updates,
  project_updates,
  can_create_tasks,
  can_comment_tasks
) 
SELECT 
  id,
  true,
  true,
  true,
  CASE 
    WHEN subscription_tier = 'enterprise' THEN true
    ELSE false
  END,
  true
FROM public.clients;

-- Inserir alguns comentários de exemplo
INSERT INTO public.task_comments (
  id,
  task_id,
  user_id,
  content,
  comment_type
) VALUES 
(
  uuid_generate_v4(),
  (SELECT id FROM public.tasks WHERE title = 'Criar wireframes da página inicial'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'Progresso excelente! Os wireframes estão ficando muito bons. Apenas alguns ajustes no header e estará pronto.',
  'comment'
),
(
  uuid_generate_v4(),
  (SELECT id FROM public.tasks WHERE title = 'Desenvolvimento do logotipo'),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'Enviado 3 opções para aprovação do cliente. Aguardando feedback.',
  'comment'
);

-- Criar algumas notificações de exemplo
INSERT INTO public.notifications (
  id,
  user_id,
  title,
  message,
  notification_type,
  entity_type,
  entity_id,
  priority
) VALUES 
(
  uuid_generate_v4(),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'Nova tarefa atribuída',
  'Você foi atribuído à tarefa "Criar wireframes da página inicial"',
  'task_assigned',
  'task',
  (SELECT id FROM public.tasks WHERE title = 'Criar wireframes da página inicial'),
  'normal'
),
(
  uuid_generate_v4(),
  (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'agency') LIMIT 1),
  'Tarefa próxima do prazo',
  'A tarefa "Definir paleta de cores" vence em 3 dias',
  'task_overdue',
  'task',
  (SELECT id FROM public.tasks WHERE title = 'Definir paleta de cores'),
  'high'
);