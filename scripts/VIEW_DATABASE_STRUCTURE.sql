-- ===================================================================
-- VER ESTRUTURA REAL DO BANCO DE DADOS
-- Execute este script para entender as tabelas disponíveis
-- ===================================================================

-- 1. Listar todas as tabelas
SELECT 'TABELAS DISPONÍVEIS' as info, table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Estrutura da tabela user_profiles
SELECT 'USER_PROFILES COLUNAS' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Estrutura da tabela agencies (se existir)
SELECT 'AGENCIES COLUNAS' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agencies' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Dados atuais de user_profiles
SELECT 'DADOS USER_PROFILES' as info, id, email, role, name, agency_id, created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Dados atuais de agencies (se existir e tiver dados)
SELECT 'DADOS AGENCIES' as info, COUNT(*) as total_agencies
FROM agencies;

-- Se houver agencies, mostrar algumas
SELECT 'SAMPLE AGENCIES' as info, id, name, owner_id, created_at
FROM agencies 
ORDER BY created_at DESC
LIMIT 3;