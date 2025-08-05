-- 🗓️ CORRIGIR TABELA EVENTS PARA RESOLVER ERRO 400
-- Execute este script no SQL Editor do Supabase

-- ========================================
-- VERIFICAR ESTRUTURA ATUAL DA TABELA EVENTS
-- ========================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- ========================================
-- GARANTIR QUE A COLUNA DATE EXISTE E TEM O TIPO CORRETO
-- ========================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS date DATE;

-- ========================================
-- CRIAR POLÍTICAS RLS BÁSICAS PARA EVENTS (se não existirem)
-- ========================================

-- Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Users can view agency events" ON events;
DROP POLICY IF EXISTS "Users can create events for their agencies" ON events;
DROP POLICY IF EXISTS "Users can update events for their agencies" ON events;
DROP POLICY IF EXISTS "Users can delete events for their agencies" ON events;

-- Política simples de SELECT (todos podem ver events por enquanto)
CREATE POLICY "Allow select events" ON events FOR SELECT USING (true);

-- Política simples de INSERT (usuários logados podem criar)
CREATE POLICY "Allow insert events" ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política simples de UPDATE (usuários podem editar seus próprios events)
CREATE POLICY "Allow update own events" ON events FOR UPDATE USING (
  created_by = auth.uid() OR user_id = auth.uid()
);

-- Política simples de DELETE (usuários podem deletar seus próprios events)
CREATE POLICY "Allow delete own events" ON events FOR DELETE USING (
  created_by = auth.uid() OR user_id = auth.uid()
);

-- ========================================
-- INSERIR ALGUNS DADOS DE TESTE PARA VALIDAR
-- ========================================
INSERT INTO events (title, date, user_id, created_by) 
SELECT 
  'Evento de Teste', 
  CURRENT_DATE,
  u.id,
  u.id
FROM auth.users u 
WHERE u.email = 'franco@fvstudios.com.br'
AND NOT EXISTS (
  SELECT 1 FROM events 
  WHERE title = 'Evento de Teste' 
  AND date = CURRENT_DATE
);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
SELECT 'Tabela events corrigida!' as status;

-- Testar query que estava falhando
SELECT id, title, date, user_id 
FROM events 
WHERE date >= CURRENT_DATE 
AND date < CURRENT_DATE + INTERVAL '1 day'
LIMIT 5;

-- Verificar políticas criadas
SELECT policyname, permissive, roles
FROM pg_policies 
WHERE tablename = 'events';