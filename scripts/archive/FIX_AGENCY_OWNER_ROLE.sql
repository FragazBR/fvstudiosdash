-- ===================================================================
-- CORRIGIR ROLE DO USUÁRIO AGENCY_OWNER
-- Execute este script no Supabase SQL Editor para corrigir o role
-- ===================================================================

-- Primeiro, vamos ver todos os usuários atuais para identificar qual precisa ser agency_owner
SELECT id, email, role, name, created_at 
FROM user_profiles 
ORDER BY created_at DESC;

-- ===================================================================
-- IMPORTANTE: Substitua 'SEU_EMAIL_AQUI' pelo seu email real
-- ===================================================================

-- Opção 1: Se você quiser atualizar um usuário existente para agency_owner
-- Descomente e modifique o email abaixo:

/*
UPDATE user_profiles 
SET role = 'agency_owner', 
    updated_at = NOW()
WHERE email = 'SEU_EMAIL_AQUI';
*/

-- Opção 2: Se você quiser criar uma agência para o usuário
-- (necessário para agency_owner ter uma agency_id)

-- Primeiro, criar uma agência se não existir
DO $$
DECLARE
    user_email TEXT := 'SEU_EMAIL_AQUI'; -- SUBSTITUA PELO SEU EMAIL
    user_id UUID;
    existing_agency_id UUID;
    new_agency_id UUID;
BEGIN
    -- Buscar o ID do usuário pelo email
    SELECT id INTO user_id FROM user_profiles WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'Usuário com email % não encontrado', user_email;
        RETURN;
    END IF;
    
    -- Verificar se já tem uma agência
    SELECT agency_id INTO existing_agency_id FROM user_profiles WHERE id = user_id;
    
    IF existing_agency_id IS NULL THEN
        -- Criar nova agência
        INSERT INTO agencies (name, description, owner_id, status) 
        VALUES (
            'Minha Agência', 
            'Agência criada automaticamente', 
            user_id, 
            'active'
        )
        RETURNING id INTO new_agency_id;
        
        RAISE NOTICE 'Nova agência criada com ID: %', new_agency_id;
    ELSE
        new_agency_id := existing_agency_id;
        RAISE NOTICE 'Usuário já tem agência com ID: %', existing_agency_id;
    END IF;
    
    -- Atualizar o usuário para agency_owner
    UPDATE user_profiles 
    SET 
        role = 'agency_owner',
        agency_id = new_agency_id,
        updated_at = NOW()
    WHERE id = user_id;
    
    RAISE NOTICE 'Usuário % atualizado para agency_owner com agência %', user_email, new_agency_id;
END $$;

-- ===================================================================
-- SCRIPT DE VERIFICAÇÃO - Execute depois de fazer as alterações
-- ===================================================================

-- Verificar se a correção funcionou
SELECT 
    up.id,
    up.email,
    up.role,
    up.name,
    up.agency_id,
    a.name as agency_name,
    a.status as agency_status
FROM user_profiles up
LEFT JOIN agencies a ON up.agency_id = a.id
WHERE up.role = 'agency_owner'
ORDER BY up.created_at DESC;

-- Verificar permissões do usuário
SELECT 
    'Verificação de Permissões' as titulo,
    CASE 
        WHEN role = 'agency_owner' AND agency_id IS NOT NULL THEN 'CORRETO: Usuário é agency_owner com agência'
        WHEN role = 'agency_owner' AND agency_id IS NULL THEN 'PROBLEMA: agency_owner sem agência'
        WHEN role != 'agency_owner' THEN 'PROBLEMA: Role não é agency_owner (' || role || ')'
        ELSE 'Estado desconhecido'
    END as status
FROM user_profiles 
WHERE email = 'SEU_EMAIL_AQUI'; -- SUBSTITUA PELO SEU EMAIL