-- ===================================================================
-- VERIFICAÇÃO SEGURA DA ESTRUTURA DO BANCO
-- Execute este script primeiro para ver a estrutura real
-- ===================================================================

-- 1. Listar todas as tabelas
SELECT 'TABELAS DISPONÍVEIS' as info, table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Estrutura da tabela user_profiles
SELECT 'USER_PROFILES COLUNAS' as info, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Estrutura da tabela agencies (se existir)
SELECT 'AGENCIES COLUNAS' as info, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'agencies' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Dados atuais de user_profiles (apenas colunas que sabemos que existem)
SELECT 'DADOS USER_PROFILES' as info, id, email, role, name, created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar se a tabela agencies existe e tem dados
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agencies' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela agencies existe';
        
        -- Tentar contar registros
        PERFORM COUNT(*) FROM agencies;
        RAISE NOTICE 'Tabela agencies tem dados';
    ELSE
        RAISE NOTICE 'Tabela agencies NÃO existe';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao verificar tabela agencies: %', SQLERRM;
END $$;

-- 6. Mostrar apenas as primeiras colunas da tabela agencies (se existir)
-- Este comando só roda se a tabela existir
SELECT 'ESTRUTURA AGENCIES' as info;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agencies' AND table_schema = 'public') THEN
        -- Usar EXECUTE para evitar erro se a tabela não existir
        EXECUTE 'SELECT ''SAMPLE AGENCIES'' as info, id, name FROM agencies LIMIT 3';
    ELSE
        RAISE NOTICE 'Tabela agencies não existe - não é possível mostrar dados';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao acessar agencies: %. Colunas podem não existir.', SQLERRM;
END $$;