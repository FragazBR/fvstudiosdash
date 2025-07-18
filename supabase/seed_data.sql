-- Seed data para testes

-- Inserir agência de exemplo
INSERT INTO agencies (id, name, email, phone, website) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'FVSTUDIOS', 'contato@fvstudios.com', '+55 11 99999-9999', 'https://fvstudios.com')
ON CONFLICT (id) DO NOTHING;

-- Inserir perfis de exemplo (você precisará substituir os IDs por IDs reais do Supabase Auth)
-- Estes são apenas exemplos, você deve criar usuários reais via Supabase Auth primeiro

-- Admin
INSERT INTO profiles (id, name, email, role, agency_id) 
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'Admin User', 'admin@fvstudios.com', 'admin', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  agency_id = EXCLUDED.agency_id;

-- Agency User  
INSERT INTO profiles (id, name, email, role, agency_id) 
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'Agency Manager', 'manager@fvstudios.com', 'agency', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  agency_id = EXCLUDED.agency_id;

-- User (colaborador)
INSERT INTO profiles (id, name, email, role, agency_id) 
VALUES 
  ('30000000-0000-0000-0000-000000000001', 'Team Member', 'team@fvstudios.com', 'user', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  agency_id = EXCLUDED.agency_id;

-- Client
INSERT INTO clients (id, name, company, email, agency_id) 
VALUES 
  ('40000000-0000-0000-0000-000000000001', 'João Silva', 'Silva & Cia', 'joao@silva.com', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, name, email, role) 
VALUES 
  ('40000000-0000-0000-0000-000000000002', 'Cliente João', 'cliente@silva.com', 'client')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Personal User
INSERT INTO profiles (id, name, email, role) 
VALUES 
  ('50000000-0000-0000-0000-000000000001', 'User Personal', 'personal@email.com', 'personal')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Projeto de exemplo
INSERT INTO projects (id, name, description, client_id, agency_id, status, color) 
VALUES 
  ('60000000-0000-0000-0000-000000000001', 'Website Corporativo', 'Desenvolvimento do novo site da Silva & Cia', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'progress', '#3B82F6')
ON CONFLICT (id) DO NOTHING;

-- Tasks de exemplo
INSERT INTO tasks (id, title, description, project_id, assigned_to, status, priority) 
VALUES 
  ('70000000-0000-0000-0000-000000000001', 'Design do Header', 'Criar design responsivo para o cabeçalho', '60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'in_progress', 'high'),
  ('70000000-0000-0000-0000-000000000002', 'Desenvolvimento Backend', 'API para gerenciamento de conteúdo', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'todo', 'medium')
ON CONFLICT (id) DO NOTHING;

-- Mensagens de exemplo
INSERT INTO messages (id, sender_id, recipient_id, subject, content) 
VALUES 
  ('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Update do Projeto', 'Olá! Preciso de um update sobre o progresso do header.')
ON CONFLICT (id) DO NOTHING;

-- Notificações de exemplo  
INSERT INTO notifications (id, user_id, title, message, type) 
VALUES 
  ('90000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Nova Task Atribuída', 'Você foi atribuído à task: Design do Header', 'info'),
  ('90000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Projeto Atualizado', 'O projeto Website Corporativo foi atualizado', 'success')
ON CONFLICT (id) DO NOTHING;
