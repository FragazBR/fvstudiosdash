-- ===================================================================
-- CRIAÇÃO DE DADOS DE TESTE INTEGRADOS
-- Este script cria dados completos e interligados para demonstrar
-- todas as funcionalidades do sistema FVStudios Dashboard
-- ===================================================================

-- 1. Primeiro, verificar se já existe um agency_owner
DO $$
DECLARE
    agency_owner_exists boolean := false;
    test_agency_id uuid;
    test_user_id uuid;
BEGIN
    -- Verificar se já existe agency_owner
    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE role = 'agency_owner') INTO agency_owner_exists;
    
    -- Se não existe, criar
    IF NOT agency_owner_exists THEN
        -- Criar agência de teste
        INSERT INTO agencies (id, name, description, website, phone, email, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'FVStudios Digital Agency',
            'Agência especializada em marketing digital e desenvolvimento web',
            'https://fvstudios.com.br',
            '+55 11 99999-9999',
            'contato@fvstudios.com.br',
            NOW(),
            NOW()
        ) RETURNING id INTO test_agency_id;
        
        -- Criar perfil do agency_owner
        INSERT INTO user_profiles (id, email, full_name, role, agency_id, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'admin@fvstudios.com.br',
            'Administrador FVStudios',
            'agency_owner',
            test_agency_id,
            NOW(),
            NOW()
        ) RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'Agency Owner criado com sucesso! Email: admin@fvstudios.com.br';
    ELSE
        -- Pegar IDs existentes
        SELECT agency_id, id INTO test_agency_id, test_user_id 
        FROM user_profiles 
        WHERE role = 'agency_owner' 
        LIMIT 1;
        
        RAISE NOTICE 'Usando Agency Owner existente.';
    END IF;

    -- 2. CRIAR CLIENTES (CONTAS) DA AGÊNCIA
    INSERT INTO contacts (id, name, email, phone, company, role, status, agency_id, created_by, created_at, updated_at) VALUES
    (gen_random_uuid(), 'João Silva', 'joao@techinova.com.br', '+55 11 98765-4321', 'TechInova Solutions', 'client', 'active', test_agency_id, test_user_id, NOW(), NOW()),
    (gen_random_uuid(), 'Maria Santos', 'maria@bellacosmeticos.com.br', '+55 11 97654-3210', 'Bella Cosméticos', 'client', 'active', test_agency_id, test_user_id, NOW(), NOW()),
    (gen_random_uuid(), 'Carlos Oliveira', 'carlos@fastfood.com.br', '+55 11 96543-2109', 'FastFood Express', 'client', 'active', test_agency_id, test_user_id, NOW(), NOW()),
    (gen_random_uuid(), 'Ana Costa', 'ana@modafashion.com.br', '+55 11 95432-1098', 'Moda Fashion Store', 'client', 'active', test_agency_id, test_user_id, NOW(), NOW()),
    (gen_random_uuid(), 'Roberto Lima', 'roberto@construtora.com.br', '+55 11 94321-0987', 'Lima Construções', 'client', 'active', test_agency_id, test_user_id, NOW(), NOW());

    -- 3. CRIAR PROJETOS PARA CADA CLIENTE
    DECLARE
        client_techinova uuid;
        client_bella uuid;
        client_fastfood uuid;
        client_moda uuid;
        client_lima uuid;
        
        project_website_techinova uuid;
        project_app_techinova uuid;
        project_social_bella uuid;
        project_ecommerce_bella uuid;
        project_delivery_fastfood uuid;
        project_branding_moda uuid;
        project_website_lima uuid;
    BEGIN
        -- Buscar IDs dos clientes
        SELECT id INTO client_techinova FROM contacts WHERE company = 'TechInova Solutions';
        SELECT id INTO client_bella FROM contacts WHERE company = 'Bella Cosméticos';
        SELECT id INTO client_fastfood FROM contacts WHERE company = 'FastFood Express';
        SELECT id INTO client_moda FROM contacts WHERE company = 'Moda Fashion Store';
        SELECT id INTO client_lima FROM contacts WHERE company = 'Lima Construções';

        -- Projetos para TechInova
        INSERT INTO projects (id, name, description, client_id, status, priority, budget_total, budget_spent, start_date, end_date, agency_id, created_by, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Website Corporativo TechInova', 'Desenvolvimento de website institucional com blog e área de clientes', client_techinova, 'in_progress', 'high', 25000.00, 12500.00, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '30 days', test_agency_id, test_user_id, NOW(), NOW()) RETURNING id INTO project_website_techinova;
        
        INSERT INTO projects (id, name, description, client_id, status, priority, budget_total, budget_spent, start_date, end_date, agency_id, created_by, created_at, updated_at) VALUES
        (gen_random_uuid(), 'App Mobile TechInova', 'Aplicativo móvel para gestão de projetos internos', client_techinova, 'planning', 'medium', 45000.00, 0.00, CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '120 days', test_agency_id, test_user_id, NOW(), NOW()) RETURNING id INTO project_app_techinova;

        -- Projetos para Bella Cosméticos
        INSERT INTO projects (id, name, description, client_id, status, priority, budget_total, budget_spent, start_date, end_date, agency_id, created_by, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Estratégia Redes Sociais', 'Gestão completa de redes sociais e criação de conteúdo', client_bella, 'active', 'high', 8000.00, 3200.00, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days', test_agency_id, test_user_id, NOW(), NOW()) RETURNING id INTO project_social_bella;
        
        INSERT INTO projects (id, name, description, client_id, status, priority, budget_total, budget_spent, start_date, end_date, agency_id, created_by, created_at, updated_at) VALUES
        (gen_random_uuid(), 'E-commerce Bella', 'Desenvolvimento de loja virtual com integração de pagamento', client_bella, 'in_progress', 'urgent', 35000.00, 21000.00, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '25 days', test_agency_id, test_user_id, NOW(), NOW()) RETURNING id INTO project_ecommerce_bella;

        -- Projeto para FastFood Express
        INSERT INTO projects (id, name, description, client_id, status, priority, budget_total, budget_spent, start_date, end_date, agency_id, created_by, created_at, updated_at) VALUES
        (gen_random_uuid(), 'App Delivery FastFood', 'Aplicativo de delivery com sistema de pedidos', client_fastfood, 'completed', 'high', 28000.00, 28000.00, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '10 days', test_agency_id, test_user_id, NOW(), NOW()) RETURNING id INTO project_delivery_fastfood;

        -- Projeto para Moda Fashion
        INSERT INTO projects (id, name, description, client_id, status, priority, budget_total, budget_spent, start_date, end_date, agency_id, created_by, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Rebranding Moda Fashion', 'Criação de nova identidade visual e materiais gráficos', client_moda, 'review', 'medium', 15000.00, 13500.00, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '5 days', test_agency_id, test_user_id, NOW(), NOW()) RETURNING id INTO project_branding_moda;

        -- Projeto para Lima Construções
        INSERT INTO projects (id, name, description, client_id, status, priority, budget_total, budget_spent, start_date, end_date, agency_id, created_by, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Website Lima Construções', 'Portal institucional com galeria de obras', client_lima, 'planning', 'low', 18000.00, 0.00, CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '75 days', test_agency_id, test_user_id, NOW(), NOW()) RETURNING id INTO project_website_lima;

        -- 4. CRIAR TAREFAS PARA CADA PROJETO
        DECLARE
            task_counter int := 0;
        BEGIN
            -- Tarefas para Website TechInova
            INSERT INTO tasks (id, title, description, project_id, status, priority, due_date, assigned_to, agency_id, created_by, created_at, updated_at) VALUES
            (gen_random_uuid(), 'Análise de Requisitos', 'Levantamento completo dos requisitos do website', project_website_techinova, 'completed', 'high', CURRENT_DATE - INTERVAL '10 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Design Homepage', 'Criação do layout da página inicial', project_website_techinova, 'completed', 'high', CURRENT_DATE - INTERVAL '5 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Desenvolvimento Frontend', 'Codificação das páginas em HTML/CSS/JS', project_website_techinova, 'in_progress', 'high', CURRENT_DATE + INTERVAL '10 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Integração Backend', 'Desenvolvimento da API e banco de dados', project_website_techinova, 'todo', 'medium', CURRENT_DATE + INTERVAL '20 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Testes e Deploy', 'Testes finais e publicação do website', project_website_techinova, 'todo', 'high', CURRENT_DATE + INTERVAL '30 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW());

            -- Tarefas para E-commerce Bella
            INSERT INTO tasks (id, title, description, project_id, status, priority, due_date, assigned_to, agency_id, created_by, created_at, updated_at) VALUES
            (gen_random_uuid(), 'Setup WooCommerce', 'Instalação e configuração da plataforma', project_ecommerce_bella, 'completed', 'urgent', CURRENT_DATE - INTERVAL '15 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Cadastro de Produtos', 'Inserção de todos os produtos no sistema', project_ecommerce_bella, 'completed', 'high', CURRENT_DATE - INTERVAL '8 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Integração Pagamento', 'Configuração dos gateways de pagamento', project_ecommerce_bella, 'in_progress', 'urgent', CURRENT_DATE + INTERVAL '3 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Testes de Compra', 'Validação do fluxo completo de compra', project_ecommerce_bella, 'todo', 'urgent', CURRENT_DATE + INTERVAL '10 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW());

            -- Tarefas para Redes Sociais Bella
            INSERT INTO tasks (id, title, description, project_id, status, priority, due_date, assigned_to, agency_id, created_by, created_at, updated_at) VALUES
            (gen_random_uuid(), 'Planejamento Editorial', 'Criação do calendário de conteúdo mensal', project_social_bella, 'completed', 'high', CURRENT_DATE - INTERVAL '5 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Criação de Posts', 'Desenvolvimento de 30 posts para Instagram', project_social_bella, 'in_progress', 'medium', CURRENT_DATE + INTERVAL '7 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Stories Diários', 'Criação de stories para engajamento', project_social_bella, 'todo', 'medium', CURRENT_DATE + INTERVAL '1 day', test_user_id, test_agency_id, test_user_id, NOW(), NOW());

            -- Tarefas para App FastFood (projeto concluído)
            INSERT INTO tasks (id, title, description, project_id, status, priority, due_date, assigned_to, agency_id, created_by, created_at, updated_at) VALUES
            (gen_random_uuid(), 'Desenvolvimento App', 'Criação do aplicativo mobile', project_delivery_fastfood, 'completed', 'high', CURRENT_DATE - INTERVAL '30 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Integração API', 'Conexão com sistema de pedidos', project_delivery_fastfood, 'completed', 'high', CURRENT_DATE - INTERVAL '20 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Publicação Stores', 'Publicação na App Store e Google Play', project_delivery_fastfood, 'completed', 'medium', CURRENT_DATE - INTERVAL '10 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW());

            -- Tarefas para Branding Moda Fashion
            INSERT INTO tasks (id, title, description, project_id, status, priority, due_date, assigned_to, agency_id, created_by, created_at, updated_at) VALUES
            (gen_random_uuid(), 'Pesquisa de Mercado', 'Análise da concorrência e tendências', project_branding_moda, 'completed', 'medium', CURRENT_DATE - INTERVAL '25 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Criação da Logo', 'Desenvolvimento da nova identidade visual', project_branding_moda, 'completed', 'high', CURRENT_DATE - INTERVAL '15 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW()),
            (gen_random_uuid(), 'Manual da Marca', 'Criação do brandbook completo', project_branding_moda, 'review', 'medium', CURRENT_DATE + INTERVAL '5 days', test_user_id, test_agency_id, test_user_id, NOW(), NOW());

            RAISE NOTICE 'Tarefas criadas com sucesso!';
        END;
    END;

    -- 5. CRIAR EVENTOS DE CALENDÁRIO
    INSERT INTO calendar_events (id, title, description, start_date, end_date, all_day, project_id, agency_id, created_by, created_at, updated_at) VALUES
    -- Reuniões com clientes
    (gen_random_uuid(), 'Reunião - TechInova', 'Apresentação do progresso do website', CURRENT_DATE + INTERVAL '2 days' + TIME '10:00', CURRENT_DATE + INTERVAL '2 days' + TIME '11:30', false, (SELECT id FROM projects WHERE name = 'Website Corporativo TechInova'), test_agency_id, test_user_id, NOW(), NOW()),
    (gen_random_uuid(), 'Reunião - Bella Cosméticos', 'Aprovação de layouts do e-commerce', CURRENT_DATE + INTERVAL '5 days' + TIME '14:00', CURRENT_DATE + INTERVAL '5 days' + TIME '15:00', false, (SELECT id FROM projects WHERE name = 'E-commerce Bella'), test_agency_id, test_user_id, NOW(), NOW()),
    (gen_random_uuid(), 'Workshop - Moda Fashion', 'Apresentação da nova identidade visual', CURRENT_DATE + INTERVAL '7 days' + TIME '09:00', CURRENT_DATE + INTERVAL '7 days' + TIME '12:00', false, (SELECT id FROM projects WHERE name = 'Rebranding Moda Fashion'), test_agency_id, test_user_id, NOW(), NOW()),
    
    -- Deadlines importantes
    (gen_random_uuid(), 'Deadline - E-commerce Bella', 'Entrega final do e-commerce', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '25 days', true, (SELECT id FROM projects WHERE name = 'E-commerce Bella'), test_agency_id, test_user_id, NOW(), NOW()),
    (gen_random_uuid(), 'Deadline - Website TechInova', 'Entrega do website corporativo', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days', true, (SELECT id FROM projects WHERE name = 'Website Corporativo TechInova'), test_agency_id, test_user_id, NOW(), NOW()),
    
    -- Eventos de planejamento
    (gen_random_uuid(), 'Planejamento Mensal', 'Reunião de planejamento da equipe', CURRENT_DATE + TIME '16:00', CURRENT_DATE + TIME '18:00', false, NULL, test_agency_id, test_user_id, NOW(), NOW()),
    (gen_random_uuid(), 'Review Projetos', 'Revisão de status de todos os projetos', CURRENT_DATE + INTERVAL '15 days' + TIME '09:00', CURRENT_DATE + INTERVAL '15 days' + TIME '11:00', false, NULL, test_agency_id, test_user_id, NOW(), NOW());

    -- 6. CRIAR ALGUMAS CONVERSAS E MENSAGENS
    DECLARE
        conv_techinova uuid;
        conv_bella uuid;
        conv_team uuid;
    BEGIN
        -- Conversa com TechInova
        INSERT INTO conversations (id, title, type, agency_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Projeto Website TechInova', 'project', test_agency_id, test_user_id, NOW(), NOW())
        RETURNING id INTO conv_techinova;

        INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
        VALUES (conv_techinova, test_user_id, NOW());

        INSERT INTO messages (id, conversation_id, sender_id, content, message_type, created_at)
        VALUES 
        (gen_random_uuid(), conv_techinova, test_user_id, 'Bom dia! Gostaria de agendar uma reunião para revisar o progresso do website.', 'text', NOW() - INTERVAL '2 hours'),
        (gen_random_uuid(), conv_techinova, test_user_id, 'Já finalizamos o design da homepage e estamos iniciando o desenvolvimento.', 'text', NOW() - INTERVAL '1 hour'),
        (gen_random_uuid(), conv_techinova, test_user_id, 'Podemos marcar para terça-feira às 10h?', 'text', NOW() - INTERVAL '30 minutes');

        -- Conversa com Bella Cosméticos
        INSERT INTO conversations (id, title, type, agency_id, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), 'E-commerce Bella Cosméticos', 'project', test_agency_id, test_user_id, NOW(), NOW())
        RETURNING id INTO conv_bella;

        INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
        VALUES (conv_bella, test_user_id, NOW());

        INSERT INTO messages (id, conversation_id, sender_id, content, message_type, created_at)
        VALUES 
        (gen_random_uuid(), conv_bella, test_user_id, 'O e-commerce está quase pronto! Faltam apenas os testes finais.', 'text', NOW() - INTERVAL '4 hours'),
        (gen_random_uuid(), conv_bella, test_user_id, 'Conseguimos integrar todos os métodos de pagamento solicitados.', 'text', NOW() - INTERVAL '3 hours'),
        (gen_random_uuid(), conv_bella, test_user_id, 'Vamos agendar uma demonstração para quinta-feira?', 'text', NOW() - INTERVAL '1 hour');

        RAISE NOTICE 'Conversas e mensagens criadas com sucesso!';
    END;

    -- 7. RELATÓRIO FINAL
    RAISE NOTICE '=== DADOS DE TESTE CRIADOS COM SUCESSO! ===';
    RAISE NOTICE 'Clientes criados: %', (SELECT COUNT(*) FROM contacts WHERE agency_id = test_agency_id);
    RAISE NOTICE 'Projetos criados: %', (SELECT COUNT(*) FROM projects WHERE agency_id = test_agency_id);
    RAISE NOTICE 'Tarefas criadas: %', (SELECT COUNT(*) FROM tasks WHERE agency_id = test_agency_id);
    RAISE NOTICE 'Eventos criados: %', (SELECT COUNT(*) FROM calendar_events WHERE agency_id = test_agency_id);
    RAISE NOTICE 'Conversas criadas: %', (SELECT COUNT(*) FROM conversations WHERE agency_id = test_agency_id);
    RAISE NOTICE '';
    RAISE NOTICE 'AGORA VOCÊ PODE:';
    RAISE NOTICE '1. Acessar a aba CONTAS e ver todos os clientes';
    RAISE NOTICE '2. Acessar a aba PROJETOS e ver projetos organizados por cliente';
    RAISE NOTICE '3. Acessar a aba TAREFAS e ver todas as tarefas dos projetos';
    RAISE NOTICE '4. Acessar a aba CALENDÁRIO e ver eventos e deadlines';
    RAISE NOTICE '5. Acessar a aba MENSAGENS e ver conversas com clientes';
    RAISE NOTICE '6. Acessar WORKSTATION e ver o dashboard completo';
    RAISE NOTICE '';
    RAISE NOTICE 'TUDO ESTÁ INTEGRADO E FUNCIONANDO! 🎉';

END $$;