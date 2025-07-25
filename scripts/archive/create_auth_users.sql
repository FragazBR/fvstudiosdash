-- ==========================================
-- CRIAR USUÁRIOS DE AUTENTICAÇÃO
-- ==========================================
-- Este script cria usuários na tabela auth.users do Supabase
-- Execute APÓS sample_data.sql
-- ATENÇÃO: Este script é apenas para desenvolvimento/teste
-- NÃO EXECUTE EM PRODUÇÃO!

-- IMPORTANTE: 
-- No Supabase, você precisa executar isso via SQL Editor ou 
-- criar os usuários manualmente no Authentication > Users
-- As senhas seguem o padrão: nomedousuario123

-- ==========================================
-- INSERIR USUÁRIOS DE AUTH
-- ==========================================

-- NOTA: Este é um exemplo de como os usuários devem ser criados
-- No Supabase, é melhor usar o painel de Authentication > Users
-- ou a função auth.users via SQL (requer permissões especiais)

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
  -- Admin Global (senha: admin123)
  ('u0000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'admin@fvstudios.com', 
   crypt('admin123', gen_salt('bf')), now(), now(), now(), 
   '{"provider":"email","providers":["email"]}', 
   '{"full_name":"Admin FVStudios"}', false, 'authenticated'),
   
  -- FV Studios Team
  -- João Silva (senha: joao123)
  ('u1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'owner@fvstudios.com',
   crypt('joao123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"João Silva"}', false, 'authenticated'),
   
  -- Maria Santos (senha: maria123)
  ('u1111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000000', 'manager@fvstudios.com',
   crypt('maria123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Maria Santos"}', false, 'authenticated'),
   
  -- Ana Costa (senha: ana123)
  ('u1111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000000', 'ana@fvstudios.com',
   crypt('ana123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Ana Costa"}', false, 'authenticated'),
   
  -- Digital Growth Team
  -- Carlos Pereira (senha: carlos123)
  ('u2222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000000', 'owner@digitalgrowth.com',
   crypt('carlos123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Carlos Pereira"}', false, 'authenticated'),
   
  -- Julia Rodrigues (senha: julia123)
  ('u2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'staff@digitalgrowth.com',
   crypt('julia123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Julia Rodrigues"}', false, 'authenticated'),
   
  -- Clientes da FV Studios
  -- Roberto Lima (senha: roberto123)
  ('c1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'contato@empresaabc.com',
   crypt('roberto123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Roberto Lima"}', false, 'authenticated'),
   
  -- Fernanda Oliveira (senha: fernanda123)
  ('c1111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000000', 'marketing@lojaxyz.com',
   crypt('fernanda123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Fernanda Oliveira"}', false, 'authenticated'),
   
  -- Pedro Souza (senha: pedro123)
  ('c1111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000000', 'ceo@startupdef.com',
   crypt('pedro123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Pedro Souza"}', false, 'authenticated'),
   
  -- Clientes da Digital Growth
  -- Lucia Ferreira (senha: lucia123)
  ('c2222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000000', 'admin@restauranteghi.com',
   crypt('lucia123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Lucia Ferreira"}', false, 'authenticated'),
   
  -- Marcos Almeida (senha: marcos123)
  ('c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'owner@academijkl.com',
   crypt('marcos123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Marcos Almeida"}', false, 'authenticated'),
   
  -- Cliente Independente
  -- Sandra Ribeiro (senha: sandra123)
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'freelancer@exemplo.com',
   crypt('sandra123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Sandra Ribeiro"}', false, 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- RESUMO DE USUÁRIOS E SENHAS
-- ==========================================

SELECT 'Usuários de Auth criados!' AS status,
       json_build_object(
         'total_users', 12,
         'password_pattern', 'nomedousuario123',
         'admin_login', json_build_object('email', 'admin@fvstudios.com', 'password', 'admin123'),
         'agency_owner_login', json_build_object('email', 'owner@fvstudios.com', 'password', 'joao123'),
         'client_login', json_build_object('email', 'contato@empresaabc.com', 'password', 'roberto123')
       ) AS login_examples;
