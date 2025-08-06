-- ===============================================================
-- ADICIONAR VINCULAÇÃO DE CLIENTES AOS CONVITES
-- ===============================================================

-- Adicionar coluna client_id na tabela user_invitations
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_client_id 
ON user_invitations(client_id);

-- Comentário
COMMENT ON COLUMN user_invitations.client_id IS 'Vinculação do convite ao registro de cliente criado';

SELECT 'Coluna client_id adicionada à tabela user_invitations! ✅' as resultado;