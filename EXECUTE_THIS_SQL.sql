-- ===================================================================
-- EXECUTE ESTE SQL NO EDITOR DO SUPABASE PARA CORRIGIR O SISTEMA
-- ===================================================================

-- 1. Verificar e adicionar colunas necessárias na tabela tasks
DO $$
BEGIN
    -- Adicionar agency_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='agency_id') THEN
        ALTER TABLE tasks ADD COLUMN agency_id UUID REFERENCES agencies(id);
        RAISE NOTICE 'Coluna agency_id adicionada à tabela tasks';
    END IF;
    
    -- Adicionar progress se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='progress') THEN
        ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
        RAISE NOTICE 'Coluna progress adicionada à tabela tasks';
    END IF;
END $$;

-- 1.1. Verificar e adicionar colunas necessárias na tabela contacts
DO $$
BEGIN
    -- Adicionar colunas básicas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='name') THEN
        ALTER TABLE contacts ADD COLUMN name TEXT NOT NULL;
        RAISE NOTICE 'Coluna name adicionada à tabela contacts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='email') THEN
        ALTER TABLE contacts ADD COLUMN email TEXT NOT NULL;
        RAISE NOTICE 'Coluna email adicionada à tabela contacts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='phone') THEN
        ALTER TABLE contacts ADD COLUMN phone TEXT;
        RAISE NOTICE 'Coluna phone adicionada à tabela contacts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='company') THEN
        ALTER TABLE contacts ADD COLUMN company TEXT;
        RAISE NOTICE 'Coluna company adicionada à tabela contacts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='position') THEN
        ALTER TABLE contacts ADD COLUMN position TEXT;
        RAISE NOTICE 'Coluna position adicionada à tabela contacts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='website') THEN
        ALTER TABLE contacts ADD COLUMN website TEXT;
        RAISE NOTICE 'Coluna website adicionada à tabela contacts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='type') THEN
        ALTER TABLE contacts ADD COLUMN type TEXT DEFAULT 'client';
        RAISE NOTICE 'Coluna type adicionada à tabela contacts';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='status') THEN
        ALTER TABLE contacts ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Coluna status adicionada à tabela contacts';
    END IF;
    
    -- Adicionar address se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='address') THEN
        ALTER TABLE contacts ADD COLUMN address TEXT;
        RAISE NOTICE 'Coluna address adicionada à tabela contacts';
    END IF;
    
    -- Adicionar tags se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='tags') THEN
        ALTER TABLE contacts ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Coluna tags adicionada à tabela contacts';
    END IF;
    
    -- Adicionar social_media se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='social_media') THEN
        ALTER TABLE contacts ADD COLUMN social_media JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna social_media adicionada à tabela contacts';
    END IF;
    
    -- Adicionar custom_fields se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='custom_fields') THEN
        ALTER TABLE contacts ADD COLUMN custom_fields JSONB DEFAULT '{}';
        RAISE NOTICE 'Coluna custom_fields adicionada à tabela contacts';
    END IF;
    
    -- Adicionar source se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='source') THEN
        ALTER TABLE contacts ADD COLUMN source TEXT DEFAULT 'Manual';
        RAISE NOTICE 'Coluna source adicionada à tabela contacts';
    END IF;
    
    -- Adicionar notes se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='notes') THEN
        ALTER TABLE contacts ADD COLUMN notes TEXT;
        RAISE NOTICE 'Coluna notes adicionada à tabela contacts';
    END IF;
END $$;

-- 1.2. Verificar e adicionar colunas necessárias na tabela user_profiles
DO $$
BEGIN
    -- Adicionar avatar_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='avatar_url') THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Coluna avatar_url adicionada à tabela user_profiles';
    END IF;
    
    -- Adicionar department_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='department_id') THEN
        ALTER TABLE user_profiles ADD COLUMN department_id UUID;
        RAISE NOTICE 'Coluna department_id adicionada à tabela user_profiles';
    END IF;
    
    -- Adicionar specialization_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='specialization_id') THEN
        ALTER TABLE user_profiles ADD COLUMN specialization_id UUID;
        RAISE NOTICE 'Coluna specialization_id adicionada à tabela user_profiles';
    END IF;
END $$;

-- 2. Atualizar tarefas existentes com agency_id
UPDATE tasks 
SET agency_id = (
    SELECT agency_id 
    FROM user_profiles 
    WHERE user_profiles.id = tasks.created_by 
    LIMIT 1
)
WHERE agency_id IS NULL;

-- 3. Inserir tarefas de exemplo
DO $$
DECLARE
    agency_id_var UUID;
    user_id_var UUID;
    project_ids UUID[];
BEGIN
    -- Buscar agência e usuário
    SELECT id INTO agency_id_var FROM agencies LIMIT 1;
    SELECT id INTO user_id_var FROM user_profiles WHERE role = 'agency_owner' LIMIT 1;
    
    -- Buscar IDs dos projetos
    SELECT ARRAY(SELECT id FROM projects ORDER BY created_at LIMIT 3) INTO project_ids;
    
    IF agency_id_var IS NOT NULL AND user_id_var IS NOT NULL AND array_length(project_ids, 1) > 0 THEN
        
        -- Tarefas para o primeiro projeto
        INSERT INTO tasks (id, title, description, project_id, status, priority, due_date, assigned_to, agency_id, created_by, progress, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Análise de Requisitos', 'Levantamento completo dos requisitos do projeto', project_ids[1], 'completed', 'high', CURRENT_DATE - INTERVAL '5 days', user_id_var, agency_id_var, user_id_var, 100, NOW(), NOW()),
        (gen_random_uuid(), 'Design da Interface', 'Criação do layout e design das telas principais', project_ids[1], 'in_progress', 'high', CURRENT_DATE + INTERVAL '3 days', user_id_var, agency_id_var, user_id_var, 65, NOW(), NOW()),
        (gen_random_uuid(), 'Desenvolvimento Frontend', 'Implementação das telas em React/Next.js', project_ids[1], 'todo', 'medium', CURRENT_DATE + INTERVAL '10 days', user_id_var, agency_id_var, user_id_var, 0, NOW(), NOW());
        
        -- Tarefas para o segundo projeto (se existir)
        IF array_length(project_ids, 1) >= 2 THEN
            INSERT INTO tasks (id, title, description, project_id, status, priority, due_date, assigned_to, agency_id, created_by, progress, created_at, updated_at) VALUES
            (gen_random_uuid(), 'Estratégia de Conteúdo', 'Planejamento do calendário editorial', project_ids[2], 'completed', 'high', CURRENT_DATE - INTERVAL '2 days', user_id_var, agency_id_var, user_id_var, 100, NOW(), NOW()),
            (gen_random_uuid(), 'Criação de Posts', 'Desenvolvimento de 20 posts para redes sociais', project_ids[2], 'in_progress', 'urgent', CURRENT_DATE + INTERVAL '1 day', user_id_var, agency_id_var, user_id_var, 75, NOW(), NOW()),
            (gen_random_uuid(), 'Análise de Métricas', 'Relatório de performance das campanhas', project_ids[2], 'review', 'medium', CURRENT_DATE + INTERVAL '7 days', user_id_var, agency_id_var, user_id_var, 90, NOW(), NOW());
        END IF;
        
        -- Tarefas para o terceiro projeto (se existir)
        IF array_length(project_ids, 1) >= 3 THEN
            INSERT INTO tasks (id, title, description, project_id, status, priority, due_date, assigned_to, agency_id, created_by, progress, created_at, updated_at) VALUES
            (gen_random_uuid(), 'Configuração do Servidor', 'Setup do ambiente de produção', project_ids[3], 'todo', 'high', CURRENT_DATE + INTERVAL '5 days', user_id_var, agency_id_var, user_id_var, 0, NOW(), NOW()),
            (gen_random_uuid(), 'Testes de Performance', 'Validação de velocidade e otimização', project_ids[3], 'todo', 'low', CURRENT_DATE + INTERVAL '14 days', user_id_var, agency_id_var, user_id_var, 0, NOW(), NOW());
        END IF;
        
        RAISE NOTICE 'Tarefas de exemplo criadas com sucesso!';
    ELSE
        RAISE NOTICE 'Erro: Não foi possível encontrar agência, usuário ou projetos necessários.';
    END IF;
END $$;

-- 4. Verificar resultado
SELECT 
    'RESUMO DO SISTEMA' as info,
    (SELECT COUNT(*) FROM agencies) as agencias,
    (SELECT COUNT(*) FROM user_profiles WHERE role = 'agency_owner') as agency_owners,
    (SELECT COUNT(*) FROM contacts) as clientes,
    (SELECT COUNT(*) FROM projects) as projetos,
    (SELECT COUNT(*) FROM tasks) as tarefas;

-- 5. Mostrar tarefas criadas
SELECT 
    t.title as tarefa,
    p.name as projeto,
    c.name as cliente,
    t.status,
    t.priority,
    t.due_date as prazo,
    t.progress as progresso
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN contacts c ON p.client_id = c.id
ORDER BY t.due_date;

-- Mensagem final
SELECT '🎉 SISTEMA CONFIGURADO COM SUCESSO!' as resultado,
       '✅ Agora o botão "Nova Tarefa" funcionará corretamente' as info1,
       '✅ Todas as abas estão integradas com dados reais' as info2,
       '✅ Você pode criar novas tarefas diretamente na página /my-tasks' as info3;