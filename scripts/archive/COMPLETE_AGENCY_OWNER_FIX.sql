-- ===================================================================
-- CORREÇÃO COMPLETA PARA USUÁRIO AGENCY_OWNER
-- Execute este script no Supabase SQL Editor
-- ===================================================================

-- STEP 1: DEBUG - Mostrar situação atual
SELECT 
    '=== SITUAÇÃO ATUAL ===' as titulo,
    id,
    email,
    role,
    name,
    agency_id,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- STEP 2: Identificar o usuário que deveria ser agency_owner
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email de login
DO $$
DECLARE
    target_email TEXT := 'SEU_EMAIL_AQUI'; -- SUBSTITUA PELO SEU EMAIL REAL
    user_record RECORD;
    agency_record RECORD;
    new_agency_id UUID;
BEGIN
    RAISE NOTICE '=== INICIANDO CORREÇÃO PARA % ===', target_email;
    
    -- Buscar o usuário
    SELECT * INTO user_record FROM user_profiles WHERE email = target_email;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'ERRO: Usuário com email % não encontrado!', target_email;
        RAISE NOTICE 'Usuários disponíveis:';
        FOR user_record IN SELECT email, role FROM user_profiles ORDER BY created_at DESC LIMIT 5 LOOP
            RAISE NOTICE '  - %: %', user_record.email, user_record.role;
        END LOOP;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuário encontrado: % (role atual: %)', user_record.email, user_record.role;
    
    -- Verificar se já tem agência
    IF user_record.agency_id IS NOT NULL THEN
        SELECT * INTO agency_record FROM agencies WHERE id = user_record.agency_id;
        IF FOUND THEN
            RAISE NOTICE 'Usuário já tem agência: % (ID: %)', agency_record.name, agency_record.id;
            new_agency_id := user_record.agency_id;
        ELSE
            RAISE NOTICE 'PROBLEMA: agency_id existe mas agência não encontrada, criando nova...';
            new_agency_id := NULL;
        END IF;
    END IF;
    
    -- Criar agência se necessário
    IF new_agency_id IS NULL THEN
        INSERT INTO agencies (name, description, owner_id) 
        VALUES (
            'Minha Agência - ' || user_record.name,
            'Agência criada automaticamente para ' || user_record.email,
            user_record.id
        )
        RETURNING id INTO new_agency_id;
        
        RAISE NOTICE 'Nova agência criada: % (ID: %)', 'Minha Agência - ' || user_record.name, new_agency_id;
    END IF;
    
    -- Atualizar o usuário para agency_owner
    UPDATE user_profiles 
    SET 
        role = 'agency_owner',
        agency_id = new_agency_id,
        updated_at = NOW()
    WHERE id = user_record.id;
    
    RAISE NOTICE 'SUCCESS: Usuário % atualizado para agency_owner!', target_email;
    
END $$;

-- STEP 3: Verificar o resultado
SELECT 
    '=== RESULTADO FINAL ===' as titulo,
    up.id,
    up.email,
    up.role,
    up.name,
    up.agency_id,
    a.name as agency_name,
    CASE 
        WHEN up.role = 'agency_owner' AND up.agency_id IS NOT NULL THEN 'CORRETO ✓'
        WHEN up.role = 'agency_owner' AND up.agency_id IS NULL THEN 'PROBLEMA: Sem agência ✗'
        WHEN up.role != 'agency_owner' THEN 'PROBLEMA: Role incorreto (' || up.role || ') ✗'
        ELSE 'Estado desconhecido ✗'
    END as status_final
FROM user_profiles up
LEFT JOIN agencies a ON up.agency_id = a.id
WHERE up.email = 'SEU_EMAIL_AQUI' -- SUBSTITUA PELO SEU EMAIL
ORDER BY up.updated_at DESC;

-- STEP 4: Verificar permissões esperadas
SELECT 
    '=== PERMISSÕES ESPERADAS PARA AGENCY_OWNER ===' as info,
    'Sidebar deve mostrar:' as abas_esperadas;

SELECT UNNEST(ARRAY[
    'Home ✓',
    'Dashboard ✓', 
    'Contas ✓',
    'Projetos ✓',
    'Tarefas ✓',
    'Estação de Trabalho ✓',
    'Calendário ✓',
    'Mensagens ✓',
    'IA Agents ✓',
    'Agência ✓',
    'Relatórios ✓',
    'Configurações ✓',
    'Notificações ✓',
    'Buscar ✓'
]) as abas_que_devem_aparecer;

-- STEP 5: Teste de acesso à página /agency
SELECT 
    '=== TESTE DE ACESSO /agency ===' as teste,
    CASE 
        WHEN role = 'agency_owner' THEN 'ACESSO PERMITIDO ✓'
        ELSE 'ACESSO NEGADO - Role: ' || role || ' ✗'
    END as resultado_acesso
FROM user_profiles 
WHERE email = 'SEU_EMAIL_AQUI'; -- SUBSTITUA PELO SEU EMAIL