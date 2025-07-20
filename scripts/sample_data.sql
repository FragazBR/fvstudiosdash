-- ==========================================
-- DADOS DE EXEMPLO MULTI-TENANT
-- ==========================================
-- Script para popular o banco com dados de exemplo
-- Execute APÓS todos os scripts de setup

-- ATENÇÃO: Este script é apenas para desenvolvimento/teste
-- NÃO EXECUTE EM PRODUÇÃO!

-- ==========================================
-- CRIAR AGÊNCIAS DE EXEMPLO
-- ==========================================

INSERT INTO public.agencies (id, name, email, phone, website, subscription_plan, subscription_status) 
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'FV Studios Marketing', 'admin@fvstudios.com', '+55 11 99999-9999', 'https://fvstudios.com', 'agency_pro', 'active'),
  ('a2222222-2222-2222-2222-222222222222', 'Digital Growth Agency', 'contact@digitalgrowth.com', '+55 11 88888-8888', 'https://digitalgrowth.com', 'agency_basic', 'active'),
  ('a3333333-3333-3333-3333-333333333333', 'Performance Marketing Co', 'hello@performancemc.com', '+55 21 77777-7777', 'https://performancemc.com', 'agency_pro', 'active')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- CRIAR USUÁRIOS DE EXEMPLO
-- ==========================================

-- NOTA: Em produção, estes usuários seriam criados via Supabase Auth
-- Este é apenas um exemplo da estrutura

INSERT INTO public.user_profiles (
  id, email, name, role, agency_id, company, subscription_plan, subscription_status
) VALUES 
  -- Admin Global
  ('u0000000-0000-0000-0000-000000000000', 'admin@fvstudios.com', 'Admin FVStudios', 'admin', NULL, 'FVStudios', 'enterprise', 'active'),
  
  -- FV Studios Team
  ('u1111111-1111-1111-1111-111111111111', 'owner@fvstudios.com', 'João Silva', 'agency_owner', 'a1111111-1111-1111-1111-111111111111', 'FV Studios Marketing', 'agency_pro', 'active'),
  ('u1111111-1111-1111-1111-111111111112', 'manager@fvstudios.com', 'Maria Santos', 'agency_staff', 'a1111111-1111-1111-1111-111111111111', 'FV Studios Marketing', 'agency_pro', 'active'),
  ('u1111111-1111-1111-1111-111111111113', 'ana@fvstudios.com', 'Ana Costa', 'agency_staff', 'a1111111-1111-1111-1111-111111111111', 'FV Studios Marketing', 'agency_pro', 'active'),
  
  -- Digital Growth Team
  ('u2222222-2222-2222-2222-222222222221', 'owner@digitalgrowth.com', 'Carlos Pereira', 'agency_owner', 'a2222222-2222-2222-2222-222222222222', 'Digital Growth Agency', 'agency_basic', 'active'),
  ('u2222222-2222-2222-2222-222222222222', 'staff@digitalgrowth.com', 'Julia Rodrigues', 'agency_staff', 'a2222222-2222-2222-2222-222222222222', 'Digital Growth Agency', 'agency_basic', 'active'),
  
  -- Clientes da FV Studios
  ('c1111111-1111-1111-1111-111111111111', 'contato@empresaabc.com', 'Roberto Lima', 'client', 'a1111111-1111-1111-1111-111111111111', 'Empresa ABC Ltda', 'premium', 'active'),
  ('c1111111-1111-1111-1111-111111111112', 'marketing@lojaxyz.com', 'Fernanda Oliveira', 'client', 'a1111111-1111-1111-1111-111111111111', 'Loja XYZ', 'basic', 'active'),
  ('c1111111-1111-1111-1111-111111111113', 'ceo@startupdef.com', 'Pedro Souza', 'client', 'a1111111-1111-1111-1111-111111111111', 'Startup DEF', 'enterprise', 'trial'),
  
  -- Clientes da Digital Growth
  ('c2222222-2222-2222-2222-222222222221', 'admin@restauranteghi.com', 'Lucia Ferreira', 'client', 'a2222222-2222-2222-2222-222222222222', 'Restaurante GHI', 'basic', 'active'),
  ('c2222222-2222-2222-2222-222222222222', 'owner@academijkl.com', 'Marcos Almeida', 'client', 'a2222222-2222-2222-2222-222222222222', 'Academia JKL', 'premium', 'active'),
  
  -- Cliente Independente (sem agência)
  ('c0000000-0000-0000-0000-000000000001', 'freelancer@exemplo.com', 'Sandra Ribeiro', 'client', NULL, 'Freelancer', 'free', 'active')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- CRIAR CONFIGURAÇÕES DE API PARA CLIENTES
-- ==========================================

INSERT INTO public.client_api_configs (
  client_id, 
  google_ads_config, 
  facebook_ads_config, 
  google_analytics_config,
  is_active
) VALUES 
  -- Empresa ABC (cliente premium com todas as APIs)
  ('c1111111-1111-1111-1111-111111111111', 
   '{"client_id": "abc-google-ads-client", "configured": true}',
   '{"app_id": "abc-facebook-app", "configured": true}',
   '{"client_id": "abc-ga-client", "view_id": "123456789", "configured": true}',
   true),
   
  -- Loja XYZ (cliente básico com Google Ads e Analytics)
  ('c1111111-1111-1111-1111-111111111112',
   '{"client_id": "xyz-google-ads-client", "configured": true}',
   NULL,
   '{"client_id": "xyz-ga-client", "view_id": "987654321", "configured": true}',
   true),
   
  -- Startup DEF (em trial, todas APIs configuradas)
  ('c1111111-1111-1111-1111-111111111113',
   '{"client_id": "def-google-ads-client", "configured": true}',
   '{"app_id": "def-facebook-app", "configured": true}',
   '{"client_id": "def-ga-client", "view_id": "555666777", "configured": true}',
   true),
   
  -- Restaurante GHI (básico, só Facebook e GA)
  ('c2222222-2222-2222-2222-222222222221',
   NULL,
   '{"app_id": "ghi-facebook-app", "configured": true}',
   '{"client_id": "ghi-ga-client", "view_id": "111222333", "configured": true}',
   true),
   
  -- Academia JKL (premium, Google Ads e GA)
  ('c2222222-2222-2222-2222-222222222222',
   '{"client_id": "jkl-google-ads-client", "configured": true}',
   NULL,
   '{"client_id": "jkl-ga-client", "view_id": "444555666", "configured": true}',
   true),
   
  -- Freelancer (free, só GA)
  ('c0000000-0000-0000-0000-000000000001',
   NULL,
   NULL,
   '{"client_id": "freelancer-ga-client", "view_id": "777888999", "configured": true}',
   true)
ON CONFLICT (client_id) DO NOTHING;

-- ==========================================
-- CRIAR PROJETOS DE EXEMPLO
-- ==========================================

INSERT INTO public.projects (
  id, title, description, client_id, agency_id, status, priority, progress, 
  budget, spent, campaign_type, deadline
) VALUES 
  -- Projetos da FV Studios
  ('p1111111-1111-1111-1111-111111111111', 'Campanha Google Ads - Empresa ABC', 'Campanha de conversão para produtos principais', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'active', 'high', 75, 50000.00, 37500.00, 'google_ads', '2025-09-30'),
  
  ('p1111111-1111-1111-1111-111111111112', 'SEO e Conteúdo - Loja XYZ', 'Otimização SEO e criação de conteúdo', 'c1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', 'active', 'medium', 40, 15000.00, 6000.00, 'seo', '2025-12-31'),
  
  ('p1111111-1111-1111-1111-111111111113', 'Facebook Ads - Startup DEF', 'Campanha de awareness para novo produto', 'c1111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111111', 'active', 'urgent', 90, 25000.00, 22500.00, 'facebook_ads', '2025-08-15'),
  
  ('p1111111-1111-1111-1111-111111111114', 'Social Media - Empresa ABC', 'Gerenciamento completo de redes sociais', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'active', 'medium', 60, 8000.00, 4800.00, 'social_media', '2025-12-31'),
  
  -- Projetos da Digital Growth
  ('p2222222-2222-2222-2222-222222222221', 'Facebook Ads - Restaurante GHI', 'Promoção de pratos especiais', 'c2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222222', 'active', 'high', 85, 5000.00, 4250.00, 'facebook_ads', '2025-10-31'),
  
  ('p2222222-2222-2222-2222-222222222222', 'Google Ads - Academia JKL', 'Captação de novos alunos', 'c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'active', 'medium', 50, 10000.00, 5000.00, 'google_ads', '2025-11-30'),
  
  -- Projeto do cliente independente
  ('p0000000-0000-0000-0000-000000000001', 'Website Pessoal', 'Criação de portfólio online', 'c0000000-0000-0000-0000-000000000001', NULL, 'completed', 'low', 100, 2000.00, 1800.00, 'website', '2025-06-30')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- CRIAR MÉTRICAS DE EXEMPLO
-- ==========================================

INSERT INTO public.project_metrics (
  project_id, date_start, date_end, impressions, clicks, conversions, 
  cost, revenue
) VALUES 
  -- Métricas da Empresa ABC - Google Ads
  ('p1111111-1111-1111-1111-111111111111', '2025-07-01', '2025-07-31', 125000, 2500, 85, 5000.00, 17000.00),
  ('p1111111-1111-1111-1111-111111111111', '2025-06-01', '2025-06-30', 110000, 2200, 78, 4800.00, 15600.00),
  
  -- Métricas da Startup DEF - Facebook Ads
  ('p1111111-1111-1111-1111-111111111113', '2025-07-01', '2025-07-31', 75000, 1800, 45, 3500.00, 9000.00),
  ('p1111111-1111-1111-1111-111111111113', '2025-06-01', '2025-06-30', 68000, 1650, 42, 3200.00, 8400.00),
  
  -- Métricas do Restaurante GHI - Facebook Ads
  ('p2222222-2222-2222-2222-222222222221', '2025-07-01', '2025-07-31', 25000, 850, 35, 800.00, 3500.00),
  ('p2222222-2222-2222-2222-222222222221', '2025-06-01', '2025-06-30', 22000, 750, 30, 750.00, 3000.00),
  
  -- Métricas da Academia JKL - Google Ads
  ('p2222222-2222-2222-2222-222222222222', '2025-07-01', '2025-07-31', 15000, 450, 18, 900.00, 3600.00),
  ('p2222222-2222-2222-2222-222222222222', '2025-06-01', '2025-06-30', 13500, 400, 15, 850.00, 3200.00)
ON CONFLICT DO NOTHING;

-- ==========================================
-- CRIAR EVENTOS DE EXEMPLO
-- ==========================================

INSERT INTO public.events (
  id, title, description, start_date, end_date, event_type, status,
  client_id, agency_id, project_id, location
) VALUES 
  -- Reuniões da FV Studios
  ('e1111111-1111-1111-1111-111111111111', 'Reunião Mensal - Empresa ABC', 'Revisão de performance e próximos passos', '2025-08-01 10:00:00-03', '2025-08-01 11:00:00-03', 'meeting', 'scheduled', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Escritório FV Studios'),
  
  ('e1111111-1111-1111-1111-111111111112', 'Entrega de Relatório - Loja XYZ', 'Apresentação dos resultados SEO', '2025-08-05 14:00:00-03', '2025-08-05 15:00:00-03', 'report_delivery', 'scheduled', 'c1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111112', 'Online'),
  
  ('e1111111-1111-1111-1111-111111111113', 'Deadline - Campanha Startup DEF', 'Prazo final da campanha de awareness', '2025-08-15 23:59:00-03', '2025-08-15 23:59:00-03', 'deadline', 'scheduled', 'c1111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111113', NULL),
  
  -- Eventos da Digital Growth
  ('e2222222-2222-2222-2222-222222222221', 'Reunião Semanal - Restaurante GHI', 'Acompanhamento semanal da campanha', '2025-08-02 16:00:00-03', '2025-08-02 16:30:00-03', 'meeting', 'scheduled', 'c2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222221', 'Online'),
  
  ('e2222222-2222-2222-2222-222222222222', 'Início de Campanha - Academia JKL', 'Lançamento da nova campanha Google Ads', '2025-08-10 09:00:00-03', '2025-08-10 09:00:00-03', 'campaign_start', 'scheduled', 'c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', NULL)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- CRIAR NOTIFICAÇÕES DE EXEMPLO
-- ==========================================

INSERT INTO public.notifications (
  title, message, type, priority, user_id, related_entity_type, related_entity_id
) VALUES 
  -- Notificações para Admin
  ('Nova Agência Cadastrada', 'A agência "Performance Marketing Co" foi cadastrada no sistema.', 'info', 'low', 'u0000000-0000-0000-0000-000000000000', 'agency', 'a3333333-3333-3333-3333-333333333333'),
  
  ('Meta de Receita Atingida', 'O sistema atingiu R$ 150.000 em receita total neste mês.', 'success', 'medium', 'u0000000-0000-0000-0000-000000000000', 'system', NULL),
  
  -- Notificações para FV Studios
  ('Campanha com Performance Baixa', 'A campanha da Empresa ABC está com CTR abaixo do esperado (1,8%).', 'warning', 'high', 'u1111111-1111-1111-1111-111111111111', 'project', 'p1111111-1111-1111-1111-111111111111'),
  
  ('Novo Cliente Adicionado', 'O cliente "Startup DEF" foi adicionado à sua agência.', 'success', 'medium', 'u1111111-1111-1111-1111-111111111111', 'user', 'c1111111-1111-1111-1111-111111111113'),
  
  ('Reunião Agendada', 'Nova reunião marcada com Empresa ABC para amanhã às 10h.', 'info', 'medium', 'u1111111-1111-1111-1111-111111111112', 'event', 'e1111111-1111-1111-1111-111111111111'),
  
  -- Notificações para clientes
  ('Relatório Disponível', 'Seu relatório mensal de performance já está disponível.', 'info', 'medium', 'c1111111-1111-1111-1111-111111111111', 'project', 'p1111111-1111-1111-1111-111111111111'),
  
  ('Meta de Conversões Atingida', 'Parabéns! Sua campanha atingiu 85 conversões este mês.', 'success', 'high', 'c1111111-1111-1111-1111-111111111111', 'project', 'p1111111-1111-1111-1111-111111111111'),
  
  ('Orçamento Quase Esgotado', 'Atenção: 90% do orçamento da campanha já foi utilizado.', 'warning', 'high', 'c1111111-1111-1111-1111-111111111113', 'project', 'p1111111-1111-1111-1111-111111111113')
ON CONFLICT DO NOTHING;

-- ==========================================
-- CRIAR TEMPLATES DE RELATÓRIO
-- ==========================================

INSERT INTO public.report_templates (
  name, description, agency_id, created_by, template_config, is_public
) VALUES 
  ('Relatório Padrão Google Ads', 'Template padrão para relatórios de Google Ads', 'a1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', '{"sections": ["overview", "keywords", "ads", "conversions"], "charts": ["performance_trend", "ctr_chart"]}', false),
  
  ('Relatório Facebook Ads', 'Template para campanhas de Facebook Ads', 'a1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', '{"sections": ["overview", "audiences", "creatives", "conversions"], "charts": ["reach_trend", "engagement_chart"]}', false),
  
  ('Relatório SEO Mensal', 'Template para relatórios mensais de SEO', 'a1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111113', '{"sections": ["rankings", "traffic", "keywords", "technical"], "charts": ["ranking_trend", "traffic_chart"]}', false),
  
  ('Relatório Básico Universal', 'Template público para uso geral', NULL, 'u0000000-0000-0000-0000-000000000000', '{"sections": ["overview", "metrics"], "charts": ["performance_chart"]}', true)
ON CONFLICT DO NOTHING;

-- Sucesso!
SELECT 'Sample data inserted successfully!' AS status,
       'Agências: 3, Usuários: 12, Projetos: 7, Métricas: 8, Eventos: 5' AS summary;
