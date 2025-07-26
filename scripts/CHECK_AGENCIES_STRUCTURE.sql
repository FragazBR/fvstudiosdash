-- ===================================================================
-- VERIFICAR ESTRUTURA DA TABELA AGENCIES
-- Execute este script para ver as colunas disponíveis
-- ===================================================================

-- Verificar se a tabela agencies existe e suas colunas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agencies' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Se não mostrar nada, a tabela não existe
-- Vamos verificar todas as tabelas que contêm 'agenc' no nome
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%agenc%';

-- Verificar também se há dados na tabela agencies (se existir)
SELECT COUNT(*) as total_agencies FROM agencies;