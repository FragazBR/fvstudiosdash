-- 🗓️ CORRIGIR TABELA EVENTS - VERSÃO SIMPLES
-- Execute este script no SQL Editor do Supabase

-- ========================================
-- VERIFICAR ESTRUTURA ATUAL
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- ========================================
-- REMOVER CONSTRAINTS NOT NULL PROBLEMÁTICAS
-- ========================================
ALTER TABLE events ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE events ALTER COLUMN end_date DROP NOT NULL;
ALTER TABLE events ALTER COLUMN client_id DROP NOT NULL;

-- ========================================
-- GARANTIR COLUNA DATE
-- ========================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS date DATE;

-- ========================================
-- LIMPAR POLÍTICAS EXISTENTES
-- ========================================
DROP POLICY IF EXISTS "Users can view agency events" ON events;
DROP POLICY IF EXISTS "Users can create events for their agencies" ON events;
DROP POLICY IF EXISTS "Users can update events for their agencies" ON events;
DROP POLICY IF EXISTS "Users can delete events for their agencies" ON events;
DROP POLICY IF EXISTS "Allow select events" ON events;
DROP POLICY IF EXISTS "Allow insert events" ON events;
DROP POLICY IF EXISTS "Allow update own events" ON events;
DROP POLICY IF EXISTS "Allow delete own events" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

-- ========================================
-- CRIAR POLÍTICAS RLS BÁSICAS
-- ========================================

-- SELECT: Todos podem ver events
CREATE POLICY "basic_events_select" ON events FOR SELECT USING (true);

-- INSERT: Usuários logados podem criar
CREATE POLICY "basic_events_insert" ON events FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- UPDATE: Usuários podem editar próprios events
CREATE POLICY "basic_events_update" ON events FOR UPDATE USING (
  created_by = auth.uid() OR user_id = auth.uid()
);

-- DELETE: Usuários podem deletar próprios events  
CREATE POLICY "basic_events_delete" ON events FOR DELETE USING (
  created_by = auth.uid() OR user_id = auth.uid()
);

-- ========================================
-- VERIFICAÇÃO FINAL SEM INSERIR DADOS
-- ========================================
SELECT 'Events table corrigida!' as status;

-- Testar se a query da API funciona agora (sem dados, só estrutura)
SELECT COUNT(*) as event_count FROM events;

-- Verificar políticas
SELECT policyname FROM pg_policies WHERE tablename = 'events';

-- Verificar se as colunas problemáticas agora permitem NULL
SELECT 
  column_name,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('start_date', 'end_date', 'client_id', 'date')
ORDER BY column_name;