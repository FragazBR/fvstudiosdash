-- ===================================================================
-- CORREÇÃO SIMPLES DE ROLE PARA AGENCY_OWNER
-- Execute este script no Supabase SQL Editor
-- ===================================================================

-- STEP 1: Ver usuários atuais
SELECT 'USUÁRIOS ATUAIS' as info, email, role, name, agency_id, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- STEP 2: Verificar estrutura da tabela agencies
SELECT 'COLUNAS DA TABELA AGENCIES' as info, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'agencies' AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 3: CORREÇÃO SIMPLES - Substitua o email pelo seu
-- IMPORTANTE: Troque 'SEU_EMAIL_AQUI' pelo seu email real

-- Opção A: Apenas atualizar role (se não precisar de agência)
/*
UPDATE user_profiles 
SET role = 'agency_owner', updated_at = NOW()
WHERE email = 'SEU_EMAIL_AQUI';
*/

-- Opção B: Criar agência E atualizar role
DO $$
DECLARE
    user_email TEXT := 'SEU_EMAIL_AQUI'; -- SUBSTITUA AQUI
    user_id UUID;
    agency_id UUID;
BEGIN
    -- Buscar usuário
    SELECT id INTO user_id FROM user_profiles WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'ERRO: Usuário % não encontrado', user_email;
        RETURN;
    END IF;
    
    -- Criar agência (estrutura mínima)
    INSERT INTO agencies (name, owner_id) 
    VALUES ('Minha Agência', user_id)
    RETURNING id INTO agency_id;
    
    -- Atualizar usuário
    UPDATE user_profiles 
    SET role = 'agency_owner', agency_id = agency_id, updated_at = NOW()
    WHERE id = user_id;
    
    RAISE NOTICE 'SUCCESS: % atualizado para agency_owner com agência %', user_email, agency_id;
END $$;

-- STEP 4: Verificar resultado
SELECT 'RESULTADO' as info, email, role, agency_id, 
       CASE WHEN role = 'agency_owner' THEN 'CORRETO ✓' ELSE 'Ainda precisa correção ✗' END as status
FROM user_profiles 
WHERE email = 'SEU_EMAIL_AQUI'  -- SUBSTITUA AQUI
ORDER BY updated_at DESC;