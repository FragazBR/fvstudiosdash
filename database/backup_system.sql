-- =================================================
-- FVStudios Dashboard - Backup System Tables
-- Sistema de backup e recuperação para dados críticos
-- =================================================

-- Tabela de configurações de backup
CREATE TABLE IF NOT EXISTS backup_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'critical_only')),
    schedule TEXT NOT NULL CHECK (schedule IN ('daily', 'weekly', 'monthly', 'manual')),
    retention_days INTEGER NOT NULL DEFAULT 30,
    include_tables TEXT[] DEFAULT ARRAY[]::TEXT[],
    exclude_tables TEXT[] DEFAULT ARRAY[]::TEXT[],
    compress BOOLEAN DEFAULT true,
    encrypt BOOLEAN DEFAULT true,
    storage_location TEXT NOT NULL DEFAULT 'supabase' CHECK (storage_location IN ('supabase', 's3', 'local')),
    is_active BOOLEAN DEFAULT true,
    last_backup TIMESTAMPTZ,
    next_backup TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de registros de backup
CREATE TABLE IF NOT EXISTS backup_records (
    id TEXT PRIMARY KEY,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'critical_only')),
    file_path TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    checksum TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Tabela de pontos de recuperação
CREATE TABLE IF NOT EXISTS recovery_points (
    id TEXT PRIMARY KEY,
    backup_id TEXT NOT NULL REFERENCES backup_records(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    recovery_type TEXT NOT NULL CHECK (recovery_type IN ('full_restore', 'partial_restore', 'point_in_time')),
    target_timestamp TIMESTAMPTZ NOT NULL,
    tables_to_restore TEXT[] DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    estimated_completion TIMESTAMPTZ,
    error_message TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_backup_configs_agency_id ON backup_configs(agency_id);
CREATE INDEX IF NOT EXISTS idx_backup_configs_active ON backup_configs(agency_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_backup_configs_schedule ON backup_configs(schedule, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_backup_records_agency_id ON backup_records(agency_id);
CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_backup_records_started_at ON backup_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_records_agency_status ON backup_records(agency_id, status);

CREATE INDEX IF NOT EXISTS idx_recovery_points_agency_id ON recovery_points(agency_id);
CREATE INDEX IF NOT EXISTS idx_recovery_points_backup_id ON recovery_points(backup_id);
CREATE INDEX IF NOT EXISTS idx_recovery_points_status ON recovery_points(status);
CREATE INDEX IF NOT EXISTS idx_recovery_points_created_at ON recovery_points(created_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_backup_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em backup_configs
CREATE TRIGGER backup_configs_updated_at
    BEFORE UPDATE ON backup_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_config_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE backup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_points ENABLE ROW LEVEL SECURITY;

-- Políticas para backup_configs
CREATE POLICY "Usuários podem ver configs de backup da própria agência"
    ON backup_configs FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins e owners podem gerenciar configs de backup"
    ON backup_configs FOR ALL
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

-- Políticas para backup_records
CREATE POLICY "Usuários podem ver registros de backup da própria agência"
    ON backup_records FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Sistema pode inserir registros de backup"
    ON backup_records FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Sistema pode atualizar registros de backup"
    ON backup_records FOR UPDATE
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Políticas para recovery_points
CREATE POLICY "Usuários podem ver pontos de recuperação da própria agência"
    ON recovery_points FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins podem gerenciar pontos de recuperação"
    ON recovery_points FOR ALL
    USING (
        agency_id IN (
            SELECT agency_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

-- View para estatísticas de backup
CREATE OR REPLACE VIEW backup_statistics AS
SELECT 
    br.agency_id,
    COUNT(*) as total_backups,
    COUNT(*) FILTER (WHERE br.status = 'completed') as successful_backups,
    COUNT(*) FILTER (WHERE br.status = 'failed') as failed_backups,
    COUNT(*) FILTER (WHERE br.status IN ('pending', 'running')) as running_backups,
    AVG(EXTRACT(EPOCH FROM (br.completed_at - br.started_at))) FILTER (WHERE br.status = 'completed') as avg_duration_seconds,
    SUM(br.file_size) FILTER (WHERE br.status = 'completed') as total_backup_size,
    MAX(br.started_at) as last_backup_time,
    COUNT(*) FILTER (WHERE br.started_at > NOW() - INTERVAL '7 days') as backups_last_7_days,
    COUNT(*) FILTER (WHERE br.started_at > NOW() - INTERVAL '30 days') as backups_last_30_days
FROM backup_records br
GROUP BY br.agency_id;

-- View para próximos backups agendados
CREATE OR REPLACE VIEW scheduled_backups AS
SELECT 
    bc.id,
    bc.agency_id,
    bc.backup_type,
    bc.schedule,
    bc.next_backup,
    bc.retention_days,
    CASE 
        WHEN bc.next_backup < NOW() THEN 'overdue'
        WHEN bc.next_backup < NOW() + INTERVAL '1 hour' THEN 'due_soon'
        ELSE 'scheduled'
    END as status
FROM backup_configs bc
WHERE bc.is_active = true
  AND bc.next_backup IS NOT NULL
ORDER BY bc.next_backup ASC;

-- Comentários das tabelas
COMMENT ON TABLE backup_configs IS 'Configurações de backup automático por agência';
COMMENT ON TABLE backup_records IS 'Histórico de execuções de backup com metadados';
COMMENT ON TABLE recovery_points IS 'Pontos de recuperação e processos de restore';
COMMENT ON VIEW backup_statistics IS 'Estatísticas agregadas de backup por agência';
COMMENT ON VIEW scheduled_backups IS 'Próximos backups agendados com status';