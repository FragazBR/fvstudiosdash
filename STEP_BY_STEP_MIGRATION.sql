-- ==================================================
-- MIGRAÇÃO PASSO A PASSO - SISTEMA INTELIGENTE
-- Execute uma etapa por vez para evitar erros
-- ==================================================

-- ETAPA 1: ADICIONAR CAMPOS FALTANTES ÀS TABELAS EXISTENTES
-- Execute este bloco primeiro:

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS estimated_complexity VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS automation_level VARCHAR(20) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS stage_id UUID,
ADD COLUMN IF NOT EXISTS automation_triggered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS complexity_score INTEGER DEFAULT 3 CHECK (complexity_score >= 1 AND complexity_score <= 10);

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS workload_capacity INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS performance_score DECIMAL(3,2) DEFAULT 4.0;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ ETAPA 1 CONCLUÍDA: Campos adicionados às tabelas existentes';
END $$;