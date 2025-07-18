-- Script para popular dados de exemplo no FVSTUDIOS Dashboard
-- Execute este script no SQL Editor do Supabase

-- Criar uma agência de exemplo
INSERT INTO agencies (id, name, email, phone, address, website, logo_url, created_at, updated_at)
VALUES (
  'agency-1',
  'FVSTUDIOS Creative Agency',
  'contato@fvstudios.com',
  '+55 11 99999-9999',
  'São Paulo, SP, Brasil',
  'https://fvstudios.com',
  '/logo-c.png',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar usuário admin de exemplo
INSERT INTO profiles (id, name, email, role, agency_id, avatar_url, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin FVSTUDIOS',
  'admin@fvstudios.com',
  'admin',
  'agency-1',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar usuário agency de exemplo
INSERT INTO profiles (id, name, email, role, agency_id, avatar_url, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Manager FVSTUDIOS',
  'manager@fvstudios.com',
  'agency',
  'agency-1',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar cliente de exemplo
INSERT INTO clients (id, name, email, phone, company, address, notes, agency_id, created_at, updated_at)
VALUES (
  'client-1',
  'João Silva',
  'joao@empresa.com',
  '+55 11 88888-8888',
  'Empresa XYZ Ltda',
  'São Paulo, SP',
  'Cliente importante - contrato anual',
  'agency-1',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar perfil para o cliente
INSERT INTO profiles (id, name, email, role, client_id, avatar_url, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'João Silva',
  'joao@empresa.com',
  'client',
  'client-1',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar usuário personal de exemplo
INSERT INTO profiles (id, name, email, role, avatar_url, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Maria Santos',
  'maria@gmail.com',
  'personal',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar projeto de exemplo
INSERT INTO projects (id, title, description, status, priority, start_date, end_date, budget, client_id, agency_id, created_by, created_at, updated_at)
VALUES (
  'project-1',
  'Website Institucional',
  'Desenvolvimento de website institucional responsivo com CMS',
  'in_progress',
  'high',
  '2024-01-15',
  '2024-03-15',
  15000.00,
  'client-1',
  'agency-1',
  '00000000-0000-0000-0000-000000000002',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar tarefas de exemplo
INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assigned_to, created_by, created_at, updated_at)
VALUES 
(
  'task-1',
  'Design da Homepage',
  'Criar design da página inicial seguindo o briefing do cliente',
  'in_progress',
  'high',
  '2024-01-25',
  'project-1',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  NOW(),
  NOW()
),
(
  'task-2',
  'Desenvolvimento Frontend',
  'Implementar o frontend em React/Next.js',
  'todo',
  'high',
  '2024-02-10',
  'project-1',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  NOW(),
  NOW()
),
(
  'task-3',
  'Configuração CMS',
  'Configurar sistema de gerenciamento de conteúdo',
  'todo',
  'medium',
  '2024-02-20',
  'project-1',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar campanha de exemplo
INSERT INTO campaigns (id, name, description, status, start_date, end_date, budget, client_id, agency_id, created_by, created_at, updated_at)
VALUES (
  'campaign-1',
  'Campanha de Lançamento',
  'Campanha digital para lançamento do novo produto',
  'active',
  '2024-01-20',
  '2024-02-20',
  8000.00,
  'client-1',
  'agency-1',
  '00000000-0000-0000-0000-000000000002',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar algumas notificações de exemplo
INSERT INTO notifications (id, title, message, type, user_id, read, created_at)
VALUES 
(
  'notif-1',
  'Nova tarefa atribuída',
  'Você foi atribuído à tarefa "Design da Homepage"',
  'task',
  '00000000-0000-0000-0000-000000000002',
  false,
  NOW()
),
(
  'notif-2',
  'Projeto atualizado',
  'O projeto "Website Institucional" foi atualizado',
  'project',
  '00000000-0000-0000-0000-000000000003',
  false,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar mensagens de exemplo
INSERT INTO messages (id, content, sender_id, receiver_id, project_id, created_at, read)
VALUES 
(
  'msg-1',
  'Olá! Gostaria de discutir os detalhes do projeto.',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'project-1',
  NOW(),
  false
),
(
  'msg-2',
  'Claro! Vamos agendar uma reunião para amanhã.',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  'project-1',
  NOW(),
  false
) ON CONFLICT (id) DO NOTHING;
