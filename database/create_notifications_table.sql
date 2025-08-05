-- Criar tabela de notificações se não existir
-- Esta tabela é necessária para o sistema funcionar corretamente

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  category VARCHAR(50) DEFAULT 'general',
  related_id UUID,
  related_type VARCHAR(50),
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas suas próprias notificações
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid()
);

-- Política: apenas o sistema pode criar notificações
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Política: usuários podem atualizar suas próprias notificações (marcar como lidas)
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);

-- Admins podem ver todas as notificações
CREATE POLICY "Admins can view all notifications" ON notifications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap 
    WHERE uap.user_id = auth.uid() 
    AND uap.role = 'admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE notifications IS 'Sistema de notificações para usuários';
COMMENT ON COLUMN notifications.type IS 'Tipo da notificação: info, success, warning, error';
COMMENT ON COLUMN notifications.category IS 'Categoria da notificação para agrupamento';
COMMENT ON COLUMN notifications.related_id IS 'ID do objeto relacionado (task, project, etc)';
COMMENT ON COLUMN notifications.related_type IS 'Tipo do objeto relacionado';
COMMENT ON COLUMN notifications.action_url IS 'URL para ação relacionada à notificação';

SELECT 'Tabela notifications criada com sucesso!' as status;