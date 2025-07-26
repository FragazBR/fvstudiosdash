-- ===================================================================
-- SISTEMA DE MENSAGENS REAL - CRIAR TABELAS E DADOS
-- Execute este script no Supabase SQL Editor
-- ===================================================================

-- 1. Tabela de Conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'project')),
    name TEXT, -- Nome da conversa (para grupos)
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Participantes das Conversas
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(conversation_id, user_id)
);

-- 3. Tabela de Mensagens
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Status de Leitura
CREATE TABLE IF NOT EXISTS message_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversations_agency_id ON conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar last_read_at do participante quando ele lê mensagens
CREATE OR REPLACE FUNCTION update_participant_last_read()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversation_participants 
    SET last_read_at = NOW() 
    WHERE conversation_id = NEW.message_id 
    AND user_id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_participant_last_read
    AFTER INSERT ON message_read_status
    FOR EACH ROW EXECUTE FUNCTION update_participant_last_read();

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;

-- Policies para conversations
CREATE POLICY "Admin full access conversations" ON conversations FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see conversations they participate in" ON conversations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = conversations.id 
        AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Users create conversations" ON conversations FOR INSERT WITH CHECK (
    created_by = auth.uid()
);

-- Policies para conversation_participants
CREATE POLICY "Admin full access conversation_participants" ON conversation_participants FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see participants of their conversations" ON conversation_participants FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp2
        WHERE cp2.conversation_id = conversation_participants.conversation_id 
        AND cp2.user_id = auth.uid()
    )
);

CREATE POLICY "Users manage their own participation" ON conversation_participants FOR ALL USING (
    user_id = auth.uid()
);

-- Policies para messages
CREATE POLICY "Admin full access messages" ON messages FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users see messages from their conversations" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id 
        AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Users send messages to their conversations" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = conversation_id 
        AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Users update own messages" ON messages FOR UPDATE USING (
    sender_id = auth.uid()
);

-- Policies para message_read_status
CREATE POLICY "Admin full access message_read_status" ON message_read_status FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users manage own read status" ON message_read_status FOR ALL USING (
    user_id = auth.uid()
);

-- Inserir dados de exemplo
DO $$
DECLARE
    admin_user_id UUID;
    agency_id UUID;
    client_contact_id UUID;
    project_id UUID;
    conv_direct_id UUID;
    conv_group_id UUID;
BEGIN
    -- Buscar IDs necessários
    SELECT id INTO admin_user_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
    SELECT id INTO agency_id FROM agencies LIMIT 1;
    SELECT id INTO client_contact_id FROM contacts LIMIT 1;
    SELECT id INTO project_id FROM projects LIMIT 1;

    -- Inserir conversa direta com cliente
    INSERT INTO conversations (id, type, agency_id, created_by) 
    VALUES (gen_random_uuid(), 'direct', agency_id, admin_user_id)
    RETURNING id INTO conv_direct_id;

    -- Inserir conversa de grupo do projeto
    INSERT INTO conversations (id, type, name, project_id, agency_id, created_by) 
    VALUES (gen_random_uuid(), 'project', 'Equipe do Projeto', project_id, agency_id, admin_user_id)
    RETURNING id INTO conv_group_id;

    -- Inserir participantes na conversa direta
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES
    (conv_direct_id, admin_user_id);

    -- Inserir participantes na conversa de grupo
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES
    (conv_group_id, admin_user_id);

    -- Inserir mensagens na conversa direta
    INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
    (conv_direct_id, admin_user_id, 'Olá! Como posso ajudá-lo com o projeto hoje?', NOW() - INTERVAL '2 hours'),
    (conv_direct_id, admin_user_id, 'Temos algumas atualizações importantes para compartilhar.', NOW() - INTERVAL '1 hour'),
    (conv_direct_id, admin_user_id, 'O progresso está indo muito bem. Vou enviar um relatório detalhado em breve.', NOW() - INTERVAL '30 minutes');

    -- Inserir mensagens na conversa de grupo
    INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
    (conv_group_id, admin_user_id, 'Pessoal, vamos alinhar as tarefas da semana!', NOW() - INTERVAL '3 hours'),
    (conv_group_id, admin_user_id, 'Lembrem-se do deadline na sexta-feira.', NOW() - INTERVAL '2 hours'),
    (conv_group_id, admin_user_id, 'Excelente trabalho da equipe! 🚀', NOW() - INTERVAL '1 hour');

END $$;

-- Função para buscar conversas do usuário
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    conversation_id UUID,
    conversation_type TEXT,
    conversation_name TEXT,
    project_name TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT,
    participants JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        c.type as conversation_type,
        COALESCE(c.name, 'Conversa Direta') as conversation_name,
        p.name as project_name,
        COALESCE(last_msg.content, 'Nenhuma mensagem') as last_message,
        COALESCE(last_msg.created_at, c.created_at) as last_message_time,
        COALESCE(unread.count, 0) as unread_count,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', up.id,
                    'name', up.name,
                    'email', up.email,
                    'role', up.role
                )
            ) FILTER (WHERE up.id IS NOT NULL),
            '[]'::json
        ) as participants
    FROM conversations c
    INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) last_msg ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM messages m
        WHERE m.conversation_id = c.id
        AND m.created_at > cp.last_read_at
        AND m.sender_id != p_user_id
    ) unread ON true
    LEFT JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    LEFT JOIN user_profiles up ON cp2.user_id = up.id
    WHERE cp.user_id = p_user_id
    AND c.is_active = true
    GROUP BY c.id, c.type, c.name, p.name, last_msg.content, last_msg.created_at, unread.count
    ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar mensagens de uma conversa
CREATE OR REPLACE FUNCTION get_conversation_messages(p_conversation_id UUID, p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    message_id UUID,
    sender_id UUID,
    sender_name TEXT,
    sender_email TEXT,
    content TEXT,
    message_type TEXT,
    file_url TEXT,
    file_name TEXT,
    reply_to_id UUID,
    is_edited BOOLEAN,
    created_at TIMESTAMPTZ,
    is_read BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as message_id,
        m.sender_id,
        up.name as sender_name,
        up.email as sender_email,
        m.content,
        m.message_type,
        m.file_url,
        m.file_name,
        m.reply_to_id,
        m.is_edited,
        m.created_at,
        (mrs.read_at IS NOT NULL) as is_read
    FROM messages m
    LEFT JOIN user_profiles up ON m.sender_id = up.id
    LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = p_user_id
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE conversations IS 'Conversas entre usuários (diretas, grupos, projetos)';
COMMENT ON TABLE conversation_participants IS 'Participantes das conversas';
COMMENT ON TABLE messages IS 'Mensagens das conversas';
COMMENT ON TABLE message_read_status IS 'Status de leitura das mensagens';

SELECT 
    'SISTEMA DE MENSAGENS CRIADO!' as status,
    'Tabelas: conversations, conversation_participants, messages, message_read_status' as tabelas,
    'Funções: get_user_conversations(), get_conversation_messages()' as funcoes,
    'RLS: Políticas de segurança ativas' as seguranca;