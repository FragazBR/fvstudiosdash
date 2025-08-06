-- ==================================================
-- CORREÇÃO PARA TABELA API_INTEGRATIONS FALTANTE
-- Execute este script para criar apenas a tabela api_integrations
-- ==================================================

-- 1. Limpar qualquer transação pendente
ROLLBACK;

-- 2. Criar a tabela api_integrations corretamente
CREATE TABLE IF NOT EXISTS api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Informações básicas da integração
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- meta, google, tiktok, linkedin, rdstation, buffer
    provider_type VARCHAR(100) NOT NULL, -- ads, social_media, analytics, crm, email_marketing
    description TEXT,
    
    -- Configurações de autenticação
    auth_type VARCHAR(50) NOT NULL DEFAULT 'oauth2',
    oauth_client_id TEXT, -- OAuth Client ID
    client_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    api_key_encrypted TEXT,
    
    -- Metadados da API
    api_version VARCHAR(50),
    base_url TEXT,
    scopes TEXT[],
    
    -- Status e validação
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_valid BOOLEAN DEFAULT false,
    last_validated_at TIMESTAMPTZ,
    validation_error TEXT,
    
    -- Configurações de sincronização
    auto_sync BOOLEAN DEFAULT true,
    sync_frequency VARCHAR(50) DEFAULT 'hourly',
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    
    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_remaining INTEGER,
    rate_limit_reset_at TIMESTAMPTZ,
    
    -- Configurações específicas do provider
    provider_config JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint única por cliente
    CONSTRAINT unique_provider_per_client UNIQUE(client_id, provider, name),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error', 'pending')),
    CONSTRAINT valid_auth_type CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth', 'bearer_token')),
    CONSTRAINT valid_provider_type CHECK (provider_type IN ('ads', 'social_media', 'analytics', 'crm', 'email_marketing', 'automation'))
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_api_integrations_client_id ON api_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_agency_id ON api_integrations(agency_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_provider ON api_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_api_integrations_status ON api_integrations(status);
CREATE INDEX IF NOT EXISTS idx_api_integrations_active ON api_integrations(is_valid) WHERE is_valid = true;

-- 4. Habilitar RLS
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
CREATE POLICY "api_integrations_client_access" ON api_integrations
    FOR ALL USING (
        client_id = auth.uid() OR 
        agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()) OR
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Criar função para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para updated_at
CREATE TRIGGER update_api_integrations_updated_at 
    BEFORE UPDATE ON api_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Verificar se foi criada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_integrations') THEN
        RAISE NOTICE '✅ SUCCESS: Tabela api_integrations criada com sucesso!';
        RAISE NOTICE '';
        RAISE NOTICE '📊 Estrutura da tabela:';
        
        -- Contar colunas
        DECLARE
            column_count INTEGER;
            index_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO column_count
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'api_integrations';
            
            SELECT COUNT(*) INTO index_count
            FROM pg_indexes 
            WHERE tablename = 'api_integrations' AND schemaname = 'public';
            
            RAISE NOTICE '   • Colunas: %', column_count;
            RAISE NOTICE '   • Índices: %', index_count;
            RAISE NOTICE '   • RLS: Habilitado';
            RAISE NOTICE '   • Triggers: Configurado';
        END;
        
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Próximo passo: Execute o COMPLETE_MIGRATION.sql novamente';
        RAISE NOTICE '   A tabela api_integrations agora existe e as outras tabelas podem referenciar ela.';
    ELSE
        RAISE EXCEPTION '❌ ERRO: Tabela api_integrations não foi criada!';
    END IF;
END $$;

-- 9. Commit das mudanças
COMMIT;

-- 10. Verificação final
SELECT 'api_integrations' as table_name, 
       COUNT(*) as column_count,
       '✅ READY' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'api_integrations';