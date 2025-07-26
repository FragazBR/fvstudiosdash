-- ===================================================================
-- DEBUG DE PERMISSÕES DO USUÁRIO
-- Execute este script para diagnosticar problemas de role
-- ===================================================================

-- 1. Mostrar todos os usuários e seus roles
SELECT 
    'TODOS OS USUÁRIOS' as categoria,
    id,
    email,
    role,
    name,
    agency_id,
    created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar especificamente usuários agency_owner
SELECT 
    'USUÁRIOS AGENCY_OWNER' as categoria,
    up.id,
    up.email,
    up.role,
    up.name,
    up.agency_id,
    a.name as agency_name
FROM user_profiles up
LEFT JOIN agencies a ON up.agency_id = a.id
WHERE up.role = 'agency_owner';

-- 3. Verificar se existem agências criadas
SELECT 
    'AGÊNCIAS EXISTENTES' as categoria,
    id,
    name,
    owner_id,
    created_at
FROM agencies
ORDER BY created_at DESC;

-- 4. Verificar usuários que deveriam ser agency_owner mas não são
SELECT 
    'POSSÍVEIS PROBLEMAS' as categoria,
    id,
    email,
    role,
    name,
    CASE 
        WHEN email LIKE '%agency%' OR email LIKE '%owner%' THEN 'Pode ser agency_owner'
        WHEN role = 'free_user' AND created_at > NOW() - INTERVAL '1 day' THEN 'Usuário recente - pode precisar de role correto'
        ELSE 'Normal'
    END as sugestao
FROM user_profiles
WHERE role = 'free_user'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Estatísticas de roles
SELECT 
    'ESTATÍSTICAS DE ROLES' as categoria,
    role,
    COUNT(*) as quantidade,
    MAX(created_at) as ultimo_criado
FROM user_profiles
GROUP BY role
ORDER BY quantidade DESC;