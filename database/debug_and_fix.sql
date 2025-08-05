-- 🔍 DEBUG: VERIFICAR ESTRUTURA ATUAL DO BANCO
-- Execute este script primeiro para entender o problema

-- ========================================
-- PASSO 1: VERIFICAR TABELAS EXISTENTES
-- ========================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ========================================
-- PASSO 2: VERIFICAR ESTRUTURA DA TABELA user_agency_permissions
-- ========================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_agency_permissions'
ORDER BY ordinal_position;

-- ========================================
-- PASSO 3: VERIFICAR ESTRUTURA DA TABELA agencies
-- ========================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agencies'
ORDER BY ordinal_position;

-- ========================================
-- PASSO 4: VERIFICAR SE JÁ EXISTEM TABELAS events E notifications
-- ========================================
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') 
        THEN 'events EXISTS'
        ELSE 'events NOT EXISTS'
    END as events_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
        THEN 'notifications EXISTS'
        ELSE 'notifications NOT EXISTS'
    END as notifications_status;

-- ========================================
-- PASSO 5: VERIFICAR CONSTRAINTS E FOREIGN KEYS
-- ========================================
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('user_agency_permissions', 'agencies')
ORDER BY tc.table_name, tc.constraint_name;