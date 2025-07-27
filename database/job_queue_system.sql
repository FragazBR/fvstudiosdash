-- ===================================================
-- FVStudios Dashboard - Sistema de Job Queue Distribuído
-- Tabelas para gerenciar filas de tarefas assíncronas
-- ===================================================

BEGIN;

-- Enum para tipos de job
CREATE TYPE job_status AS ENUM (
  'pending',
  'processing', 
  'completed',
  'failed',
  'cancelled',
  'retrying'
);

CREATE TYPE job_priority AS ENUM (
  'low',
  'normal', 
  'high',
  'critical'
);

-- Tabela principal de jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do job
    queue_name VARCHAR(100) NOT NULL DEFAULT 'default',
    job_type VARCHAR(100) NOT NULL,
    job_name VARCHAR(255),
    
    -- Dados do job
    payload JSONB NOT NULL DEFAULT '{}',
    context JSONB DEFAULT '{}', -- Contexto adicional (user_id, agency_id, etc)
    
    -- Configurações de execução
    priority job_priority NOT NULL DEFAULT 'normal',
    max_attempts INTEGER NOT NULL DEFAULT 3,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    timeout_seconds INTEGER DEFAULT 300, -- 5 minutos padrão
    
    -- Agendamento
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delay_seconds INTEGER DEFAULT 0,
    
    -- Status e timing
    status job_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Resultados
    result JSONB,
    error_message TEXT,
    error_details JSONB,
    
    -- Worker info
    worker_id VARCHAR(255), -- ID do worker que processou
    worker_hostname VARCHAR(255),
    
    -- Dependências
    depends_on UUID[], -- IDs de jobs que devem completar primeiro
    parent_job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Progress tracking
    progress_current INTEGER DEFAULT 0,
    progress_total INTEGER DEFAULT 100,
    progress_message TEXT,
    
    -- Metadados
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_attempts CHECK (attempt_count <= max_attempts),
    CONSTRAINT valid_progress CHECK (progress_current >= 0 AND progress_current <= progress_total),
    CONSTRAINT valid_timeout CHECK (timeout_seconds > 0)
);

-- Tabela de configurações de filas
CREATE TABLE IF NOT EXISTS job_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação da fila
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    
    -- Configurações da fila
    is_active BOOLEAN DEFAULT true,
    max_workers INTEGER DEFAULT 5,
    max_jobs_per_worker INTEGER DEFAULT 10,
    
    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 3600,
    
    -- Retry configuration
    default_max_attempts INTEGER DEFAULT 3,
    default_timeout_seconds INTEGER DEFAULT 300,
    retry_delay_base_seconds INTEGER DEFAULT 60, -- Delay base para retry exponencial
    retry_delay_max_seconds INTEGER DEFAULT 3600, -- Máximo 1 hora
    
    -- Dead letter queue
    dead_letter_queue_name VARCHAR(100),
    dead_letter_after_attempts INTEGER DEFAULT 5,
    
    -- Prioridades permitidas
    allowed_priorities job_priority[] DEFAULT ARRAY['low', 'normal', 'high', 'critical'],
    
    -- Configurações de limpeza
    retention_completed_hours INTEGER DEFAULT 168, -- 7 dias
    retention_failed_hours INTEGER DEFAULT 720, -- 30 dias
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de workers
CREATE TABLE IF NOT EXISTS job_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do worker
    worker_id VARCHAR(255) UNIQUE NOT NULL,
    hostname VARCHAR(255) NOT NULL,
    process_id INTEGER,
    
    -- Configurações
    queues VARCHAR(100)[], -- Filas que este worker processa
    max_concurrent_jobs INTEGER DEFAULT 5,
    
    -- Status
    status VARCHAR(50) DEFAULT 'idle', -- idle, working, stopping, stopped
    is_healthy BOOLEAN DEFAULT true,
    
    -- Estatísticas
    jobs_processed INTEGER DEFAULT 0,
    jobs_failed INTEGER DEFAULT 0,
    total_processing_time_ms BIGINT DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_job_at TIMESTAMPTZ,
    
    -- Worker metadata
    version VARCHAR(50),
    environment VARCHAR(50) DEFAULT 'production',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de execuções
CREATE TABLE IF NOT EXISTS job_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Tentativa
    attempt_number INTEGER NOT NULL,
    
    -- Worker
    worker_id VARCHAR(255),
    worker_hostname VARCHAR(255),
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Resultado
    status job_status NOT NULL,
    result JSONB,
    error_message TEXT,
    error_details JSONB,
    
    -- Métricas
    memory_usage_mb INTEGER,
    cpu_time_ms INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de estatísticas de filas (agregadas)
CREATE TABLE IF NOT EXISTS job_queue_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name VARCHAR(100) NOT NULL,
    
    -- Período das estatísticas
    date_hour TIMESTAMPTZ NOT NULL, -- Truncado para hora
    
    -- Contadores
    jobs_pending INTEGER DEFAULT 0,
    jobs_processing INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_failed INTEGER DEFAULT 0,
    jobs_cancelled INTEGER DEFAULT 0,
    
    -- Métricas de tempo
    avg_processing_time_ms INTEGER DEFAULT 0,
    min_processing_time_ms INTEGER DEFAULT 0,
    max_processing_time_ms INTEGER DEFAULT 0,
    
    -- Throughput
    jobs_per_minute DECIMAL(10,2) DEFAULT 0,
    
    -- Workers
    active_workers INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT unique_queue_stats_hour UNIQUE (queue_name, date_hour)
);

-- Tabela de jobs recorrentes (cron-like)
CREATE TABLE IF NOT EXISTS recurring_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    
    -- Configuração do job
    queue_name VARCHAR(100) NOT NULL DEFAULT 'default',
    job_type VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',
    
    -- Schedule (cron expression)
    cron_expression VARCHAR(100) NOT NULL, -- Ex: '0 0 * * *' para diário à meia-noite
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Configurações
    is_active BOOLEAN DEFAULT true,
    max_attempts INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 300,
    
    -- Tracking
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    last_job_id UUID REFERENCES jobs(id),
    
    -- Estatísticas
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_jobs_queue_status ON jobs(queue_name, status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_priority ON jobs(scheduled_at, priority) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_agency_id ON jobs(agency_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_parent_job_id ON jobs(parent_job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_depends_on ON jobs USING GIN(depends_on);

CREATE INDEX IF NOT EXISTS idx_job_executions_job_id ON job_executions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_executions_started_at ON job_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_job_workers_worker_id ON job_workers(worker_id);
CREATE INDEX IF NOT EXISTS idx_job_workers_queues ON job_workers USING GIN(queues);
CREATE INDEX IF NOT EXISTS idx_job_workers_last_heartbeat ON job_workers(last_heartbeat);

CREATE INDEX IF NOT EXISTS idx_job_queue_stats_queue_date ON job_queue_stats(queue_name, date_hour);

CREATE INDEX IF NOT EXISTS idx_recurring_jobs_next_run ON recurring_jobs(next_run_at, is_active);

-- RLS Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_jobs ENABLE ROW LEVEL SECURITY;

-- Policy para jobs
DROP POLICY IF EXISTS "Users can manage jobs of their agency" ON jobs;
CREATE POLICY "Users can manage jobs of their agency" ON jobs
    FOR ALL USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários podem ver jobs da sua agência
        (
            agency_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE id = auth.uid() 
                AND agency_id = jobs.agency_id
                AND role IN ('agency_owner', 'agency_manager', 'agency_staff')
            )
        )
        OR
        -- Usuários podem ver jobs que criaram
        (created_by = auth.uid())
    );

-- Policy para job_queues (admin only para configuração)
DROP POLICY IF EXISTS "Admins can manage job queues" ON job_queues;
CREATE POLICY "Admins can manage job queues" ON job_queues
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy para job_workers (admin only)
DROP POLICY IF EXISTS "Admins can view job workers" ON job_workers;
CREATE POLICY "Admins can view job workers" ON job_workers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy para job_executions
DROP POLICY IF EXISTS "Users can view executions of their jobs" ON job_executions;
CREATE POLICY "Users can view executions of their jobs" ON job_executions
    FOR SELECT USING (
        -- Admin pode ver tudo
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR
        -- Usuários podem ver execuções de jobs da sua agência
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN user_profiles up ON (up.agency_id = j.agency_id OR j.created_by = up.id)
            WHERE j.id = job_executions.job_id
            AND up.id = auth.uid()
            AND (up.role = 'admin' OR up.role IN ('agency_owner', 'agency_manager', 'agency_staff'))
        )
    );

-- Policy para job_queue_stats (read-only para usuários)
DROP POLICY IF EXISTS "Users can view queue stats" ON job_queue_stats;
CREATE POLICY "Users can view queue stats" ON job_queue_stats
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy para recurring_jobs
DROP POLICY IF EXISTS "Admins can manage recurring jobs" ON recurring_jobs;
CREATE POLICY "Admins can manage recurring jobs" ON recurring_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'agency_owner', 'agency_manager')
        )
    );

-- Inserir filas padrão
INSERT INTO job_queues (name, display_name, description) VALUES
('default', 'Fila Padrão', 'Fila padrão para jobs gerais'),
('notifications', 'Notificações', 'Jobs de envio de notificações (email, WhatsApp, Slack)'),
('webhooks', 'Webhooks', 'Processamento de webhooks externos'),
('reports', 'Relatórios', 'Geração de relatórios e analytics'),
('backups', 'Backups', 'Jobs de backup e recovery'),
('ai_processing', 'Processamento IA', 'Jobs que utilizam APIs de IA (OpenAI, etc)'),
('integrations', 'Integrações', 'Sincronização com APIs externas'),
('cleanup', 'Limpeza', 'Jobs de limpeza e manutenção do sistema'),
('high_priority', 'Alta Prioridade', 'Fila para jobs críticos que precisam ser processados rapidamente')
ON CONFLICT (name) DO NOTHING;

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_job_updated_at();

DROP TRIGGER IF EXISTS update_job_queues_updated_at ON job_queues;
CREATE TRIGGER update_job_queues_updated_at
    BEFORE UPDATE ON job_queues
    FOR EACH ROW
    EXECUTE FUNCTION update_job_updated_at();

DROP TRIGGER IF EXISTS update_job_workers_updated_at ON job_workers;
CREATE TRIGGER update_job_workers_updated_at
    BEFORE UPDATE ON job_workers
    FOR EACH ROW
    EXECUTE FUNCTION update_job_updated_at();

DROP TRIGGER IF EXISTS update_recurring_jobs_updated_at ON recurring_jobs;
CREATE TRIGGER update_recurring_jobs_updated_at
    BEFORE UPDATE ON recurring_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_job_updated_at();

-- Trigger para criar execução quando job muda de status
CREATE OR REPLACE FUNCTION log_job_execution()
RETURNS TRIGGER AS $$
BEGIN
    -- Só loga se mudou para processing, completed ou failed
    IF NEW.status IN ('processing', 'completed', 'failed') AND 
       (OLD.status IS NULL OR OLD.status != NEW.status) THEN
        
        INSERT INTO job_executions (
            job_id,
            attempt_number,
            worker_id,
            worker_hostname,
            started_at,
            completed_at,
            duration_ms,
            status,
            result,
            error_message,
            error_details
        ) VALUES (
            NEW.id,
            NEW.attempt_count,
            NEW.worker_id,
            NEW.worker_hostname,
            CASE WHEN NEW.status = 'processing' THEN NOW() ELSE OLD.started_at END,
            CASE WHEN NEW.status IN ('completed', 'failed') THEN NOW() ELSE NULL END,
            CASE WHEN NEW.status IN ('completed', 'failed') AND OLD.started_at IS NOT NULL 
                 THEN EXTRACT(EPOCH FROM (NOW() - OLD.started_at)) * 1000 
                 ELSE NULL END,
            NEW.status,
            NEW.result,
            NEW.error_message,
            NEW.error_details
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_job_execution_trigger ON jobs;
CREATE TRIGGER log_job_execution_trigger
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION log_job_execution();

-- Trigger para atualizar estatísticas de workers
CREATE OR REPLACE FUNCTION update_worker_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status = 'processing' THEN
        UPDATE job_workers 
        SET 
            jobs_processed = jobs_processed + 1,
            total_processing_time_ms = total_processing_time_ms + 
                COALESCE(EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) * 1000, 0),
            last_job_at = NOW()
        WHERE worker_id = NEW.worker_id;
        
    ELSIF NEW.status = 'failed' AND OLD.status = 'processing' THEN
        UPDATE job_workers 
        SET 
            jobs_failed = jobs_failed + 1,
            last_job_at = NOW()
        WHERE worker_id = NEW.worker_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_worker_stats_trigger ON jobs;
CREATE TRIGGER update_worker_stats_trigger
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_stats();

-- Função para limpar jobs antigos
CREATE OR REPLACE FUNCTION cleanup_old_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    queue_record RECORD;
BEGIN
    -- Limpar jobs baseado na configuração de cada fila
    FOR queue_record IN 
        SELECT name, retention_completed_hours, retention_failed_hours 
        FROM job_queues 
        WHERE is_active = true
    LOOP
        -- Limpar jobs completed antigos
        DELETE FROM jobs 
        WHERE queue_name = queue_record.name
        AND status = 'completed'
        AND completed_at < NOW() - (queue_record.retention_completed_hours || ' hours')::INTERVAL;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Limpar jobs failed antigos
        DELETE FROM jobs 
        WHERE queue_name = queue_record.name
        AND status = 'failed'
        AND failed_at < NOW() - (queue_record.retention_failed_hours || ' hours')::INTERVAL;
        
        GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter próximo job da fila
CREATE OR REPLACE FUNCTION get_next_job(
    p_queue_names TEXT[] DEFAULT ARRAY['default'],
    p_worker_id TEXT DEFAULT NULL
)
RETURNS TABLE(
    job_id UUID,
    queue_name VARCHAR(100),
    job_type VARCHAR(100),
    payload JSONB,
    context JSONB
) AS $$
DECLARE
    selected_job_id UUID;
BEGIN
    -- Buscar próximo job disponível com SKIP LOCKED para concorrência
    SELECT j.id INTO selected_job_id
    FROM jobs j
    WHERE j.queue_name = ANY(p_queue_names)
    AND j.status = 'pending'
    AND j.scheduled_at <= NOW()
    AND (j.depends_on IS NULL OR NOT EXISTS (
        SELECT 1 FROM jobs dep 
        WHERE dep.id = ANY(j.depends_on) 
        AND dep.status NOT IN ('completed', 'cancelled')
    ))
    ORDER BY j.priority DESC, j.scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF selected_job_id IS NOT NULL THEN
        -- Marcar como processando
        UPDATE jobs 
        SET 
            status = 'processing',
            started_at = NOW(),
            worker_id = p_worker_id,
            attempt_count = attempt_count + 1
        WHERE id = selected_job_id;
        
        -- Retornar dados do job
        RETURN QUERY 
        SELECT j.id, j.queue_name, j.job_type, j.payload, j.context
        FROM jobs j
        WHERE j.id = selected_job_id;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMIT;