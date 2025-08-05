-- 🗓️ CORRIGIR TABELA EVENTS - VERSÃO 2
-- Execute este script no SQL Editor do Supabase

-- ========================================
-- VERIFICAR ESTRUTURA ATUAL DA TABELA EVENTS
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- ========================================
-- CORRIGIR COLUNA start_date PARA PERMITIR NULL
-- ========================================
ALTER TABLE events ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE events ALTER COLUMN end_date DROP NOT NULL;

-- ========================================
-- GARANTIR QUE A COLUNA DATE EXISTE
-- ========================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS date DATE;

-- ========================================
-- REMOVER POLÍTICAS EXISTENTES QUE PODEM ESTAR CAUSANDO PROBLEMA
-- ========================================
DROP POLICY IF EXISTS "Users can view agency events" ON events;
DROP POLICY IF EXISTS "Users can create events for their agencies" ON events;
DROP POLICY IF EXISTS "Users can update events for their agencies" ON events;
DROP POLICY IF EXISTS "Users can delete events for their agencies" ON events;
DROP POLICY IF EXISTS "Allow select events" ON events;
DROP POLICY IF EXISTS "Allow insert events" ON events;
DROP POLICY IF EXISTS "Allow update own events" ON events;
DROP POLICY IF EXISTS "Allow delete own events" ON events;

-- ========================================
-- CRIAR POLÍTICAS RLS SIMPLES PARA EVENTS
-- ========================================

-- Política de SELECT (todos podem ver events por enquanto)
CREATE POLICY "events_select_policy" ON events FOR SELECT USING (true);

-- Política de INSERT (usuários logados podem criar)
CREATE POLICY "events_insert_policy" ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política de UPDATE (usuários podem editar seus próprios events)
CREATE POLICY "events_update_policy" ON events FOR UPDATE USING (
  created_by = auth.uid() OR user_id = auth.uid()
);

-- Política de DELETE (usuários podem deletar seus próprios events)
CREATE POLICY "events_delete_policy" ON events FOR DELETE USING (
  created_by = auth.uid() OR user_id = auth.uid()
);

-- ========================================
-- INSERIR EVENTO DE TESTE COM TODOS OS CAMPOS NECESSÁRIOS
-- ========================================
INSERT INTO events (
  title, 
  description,
  date, 
  start_date, 
  end_date,
  user_id, 
  created_by,
  event_type,
  status
) 
SELECT 
  'Evento de Teste Sistema',
  'Evento criado para teste do sistema pós-limpeza',
  CURRENT_DATE,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 day',
  u.id,
  u.id,
  'meeting',
  'scheduled'
FROM auth.users u 
WHERE u.email = 'franco@fvstudios.com.br'
AND NOT EXISTS (
  SELECT 1 FROM events 
  WHERE title = 'Evento de Teste Sistema'
)
LIMIT 1;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
SELECT 'Tabela events corrigida e políticas criadas!' as status;

-- Testar query que estava falhando (formato original da API)
SELECT id, title, date, user_id, start_date, end_date
FROM events 
WHERE date >= CURRENT_DATE 
AND date < CURRENT_DATE + INTERVAL '1 day'
LIMIT 5;

-- Verificar eventos criados
SELECT COUNT(*) as total_events FROM events;

-- Verificar políticas criadas
SELECT policyname, permissive
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;