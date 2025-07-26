-- ===================================================================
-- CORREÇÃO MÍNIMA DE ROLE - SÓ user_profiles
-- Execute este script para corrigir apenas o role do usuário
-- ===================================================================

-- STEP 1: Ver usuários atuais
SELECT 'ANTES DA CORREÇÃO' as status, email, role, name, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- STEP 2: CORREÇÃO SIMPLES - SUBSTITUA O EMAIL
-- IMPORTANTE: Troque 'SEU_EMAIL_AQUI' pelo seu email real

UPDATE user_profiles 
SET 
    role = 'agency_owner',
    updated_at = NOW()
WHERE email = 'SEU_EMAIL_AQUI';  -- SUBSTITUA PELO SEU EMAIL REAL

-- STEP 3: Verificar se a correção funcionou
SELECT 'APÓS CORREÇÃO' as status, email, role, name, updated_at
FROM user_profiles 
WHERE email = 'SEU_EMAIL_AQUI'  -- SUBSTITUA PELO SEU EMAIL REAL
ORDER BY updated_at DESC;

-- STEP 4: Verificar todos os usuários agency_owner
SELECT 'TODOS AGENCY_OWNERS' as status, email, role, name, created_at
FROM user_profiles 
WHERE role = 'agency_owner'
ORDER BY created_at DESC;

-- STEP 5: Estatísticas finais
SELECT 'ESTATÍSTICAS' as info, role, COUNT(*) as quantidade
FROM user_profiles 
GROUP BY role 
ORDER BY quantidade DESC;