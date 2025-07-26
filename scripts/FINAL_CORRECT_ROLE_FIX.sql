-- ===================================================================
-- CORREÇÃO FINAL DE ROLE - BASEADO NA ESTRUTURA REAL
-- Execute este script para corrigir o role agency_owner
-- ===================================================================

-- STEP 1: Verificar estrutura real
SELECT 'ESTRUTURA AGENCIES' as info, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'agencies' AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Ver usuários atuais
SELECT 'USUÁRIOS ATUAIS' as info, email, role, name, agency_id, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- STEP 3: Ver agências existentes (estrutura real: id, name, created_at, updated_at)
SELECT 'AGÊNCIAS EXISTENTES' as info, id, name, created_at
FROM agencies 
ORDER BY created_at DESC
LIMIT 3;

-- STEP 4: CORREÇÃO COMPLETA
-- IMPORTANTE: Substitua 'agencyowner@test.com' pelo seu email real

DO $$
DECLARE
    user_email TEXT := 'agencyowner@test.com';
    user_id UUID;
    user_agency_id UUID;
    new_agency_id UUID;
BEGIN
    -- Buscar o usuário
    SELECT id, agency_id INTO user_id, user_agency_id 
    FROM user_profiles 
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'ERRO: Usuário % não encontrado', user_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuário encontrado: % (ID: %)', user_email, user_id;
    
    -- Verificar se já tem agência válida
    IF user_agency_id IS NOT NULL THEN
        -- Verificar se a agência existe
        IF EXISTS (SELECT 1 FROM agencies WHERE id = user_agency_id) THEN
            RAISE NOTICE 'Usuário já tem agência válida: %', user_agency_id;
            new_agency_id := user_agency_id;
        ELSE
            RAISE NOTICE 'agency_id inválido, criando nova agência...';
            user_agency_id := NULL;
        END IF;
    END IF;
    
    -- Criar nova agência se necessário (apenas com colunas que existem)
    IF user_agency_id IS NULL THEN
        INSERT INTO agencies (name) 
        VALUES ('Agência - ' || user_email)
        RETURNING id INTO new_agency_id;
        
        RAISE NOTICE 'Nova agência criada: %', new_agency_id;
    ELSE
        new_agency_id := user_agency_id;
    END IF;
    
    -- Atualizar o usuário para agency_owner
    UPDATE user_profiles 
    SET 
        role = 'agency_owner',
        agency_id = new_agency_id,
        updated_at = NOW()
    WHERE id = user_id;
    
    RAISE NOTICE 'SUCCESS: Usuário % atualizado para agency_owner com agência %', user_email, new_agency_id;
    
END $$;

-- STEP 5: Verificar resultado final
SELECT 
    'RESULTADO FINAL' as status,
    up.email,
    up.role,
    up.name,
    up.agency_id,
    a.name as agency_name,
    CASE 
        WHEN up.role = 'agency_owner' AND up.agency_id IS NOT NULL THEN 'PERFEITO ✓'
        WHEN up.role = 'agency_owner' AND up.agency_id IS NULL THEN 'PROBLEMA: Sem agência ✗'
        WHEN up.role != 'agency_owner' THEN 'PROBLEMA: Role incorreto ✗'
        ELSE 'Estado desconhecido ✗'
    END as status_final
FROM user_profiles up
LEFT JOIN agencies a ON up.agency_id = a.id
WHERE up.email = 'agencyowner@test.com'
ORDER BY up.updated_at DESC;

-- STEP 6: Verificar permissões
SELECT 
    'PERMISSÕES VERIFICADAS' as info,
    CASE 
        WHEN role = 'agency_owner' THEN 'Acesso à /agency: PERMITIDO ✓'
        ELSE 'Acesso à /agency: NEGADO ✗ (role: ' || role || ')'
    END as acesso_agency,
    CASE 
        WHEN role != 'free_user' THEN 'Sidebar completa: SIM ✓'
        ELSE 'Sidebar limitada: SIM ✗'
    END as sidebar_status
FROM user_profiles 
WHERE email = 'agencyowner@test.com';