-- Sistema de Gamificação para Equipes
-- Permite criar desafios, metas, rankings e recompensas para motivar equipes

-- Enum para tipos de objetivos
CREATE TYPE objective_type AS ENUM (
  'sales_volume',
  'sales_count',
  'customer_satisfaction',
  'task_completion',
  'meeting_attendance',
  'training_completion',
  'custom_metric'
);

-- Enum para tipos de recompensa
CREATE TYPE reward_type AS ENUM (
  'points',
  'badge',
  'money',
  'time_off',
  'recognition',
  'gift_card',
  'custom'
);

-- Enum para frequência de desafios
CREATE TYPE challenge_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'one_time'
);

-- Enum para status de desafio
CREATE TYPE challenge_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'canceled'
);

-- 1. Sistema de Pontos e Níveis
CREATE TABLE IF NOT EXISTS gamification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Configurações gerais
  system_name VARCHAR(100) DEFAULT 'Sistema de Gamificação',
  is_active BOOLEAN DEFAULT true,
  
  -- Configurações de pontos
  points_currency_name VARCHAR(50) DEFAULT 'Pontos',
  points_currency_symbol VARCHAR(10) DEFAULT 'pts',
  
  -- Sistema de níveis
  enable_levels BOOLEAN DEFAULT true,
  level_names JSONB DEFAULT '["Iniciante", "Intermediário", "Avançado", "Expert", "Master"]',
  points_per_level JSONB DEFAULT '[0, 100, 300, 600, 1000, 1500]',
  
  -- Configurações de badges
  enable_badges BOOLEAN DEFAULT true,
  
  -- Configurações de rankings
  enable_rankings BOOLEAN DEFAULT true,
  ranking_period VARCHAR(20) DEFAULT 'monthly',
  
  -- Configurações de notificações
  notify_achievements BOOLEAN DEFAULT true,
  notify_level_up BOOLEAN DEFAULT true,
  notify_badge_earned BOOLEAN DEFAULT true,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(agency_id)
);

-- 2. Desafios e Metas
CREATE TABLE IF NOT EXISTS gamification_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Informações básicas
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  
  -- Configurações do desafio
  objective_type objective_type NOT NULL,
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,
  
  -- Participação
  is_team_challenge BOOLEAN DEFAULT false,
  max_participants INTEGER,
  auto_join BOOLEAN DEFAULT false,
  
  -- Timing
  frequency challenge_frequency NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status
  status challenge_status DEFAULT 'draft',
  
  -- Recompensas
  reward_points INTEGER DEFAULT 0,
  reward_badges TEXT[],
  reward_money DECIMAL(10,2) DEFAULT 0,
  reward_description TEXT,
  
  -- Configurações avançadas
  rules JSONB DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Ranking
  show_progress BOOLEAN DEFAULT true,
  show_leaderboard BOOLEAN DEFAULT true,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Participação em Desafios
CREATE TABLE IF NOT EXISTS gamification_challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES gamification_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_value DECIMAL(12,2) DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Posição no ranking
  ranking_position INTEGER,
  
  -- Recompensas recebidas
  points_earned INTEGER DEFAULT 0,
  badges_earned TEXT[],
  money_earned DECIMAL(10,2) DEFAULT 0,
  
  -- Metadados
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(challenge_id, user_id)
);

-- 4. Sistema de Badges
CREATE TABLE IF NOT EXISTS gamification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Informações do badge
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  color VARCHAR(7) DEFAULT '#007bff',
  
  -- Configurações de conquista
  is_active BOOLEAN DEFAULT true,
  is_rare BOOLEAN DEFAULT false,
  rarity_level INTEGER DEFAULT 1, -- 1=common, 2=uncommon, 3=rare, 4=epic, 5=legendary
  
  -- Critérios para ganhar o badge
  criteria JSONB NOT NULL DEFAULT '{}',
  required_points INTEGER DEFAULT 0,
  required_challenges INTEGER DEFAULT 0,
  required_achievements TEXT[],
  
  -- Estatísticas
  times_awarded INTEGER DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(agency_id, name)
);

-- 5. Badges dos Usuários
CREATE TABLE IF NOT EXISTS gamification_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES gamification_badges(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Detalhes da conquista
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  earned_from_challenge_id UUID REFERENCES gamification_challenges(id) ON DELETE SET NULL,
  
  -- Visualização
  is_favorite BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  UNIQUE(user_id, badge_id)
);

-- 6. Pontuação dos Usuários
CREATE TABLE IF NOT EXISTS gamification_user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Pontuação
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  points_to_next_level INTEGER DEFAULT 100,
  
  -- Estatísticas
  challenges_completed INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  
  -- Ranking
  overall_rank INTEGER,
  monthly_rank INTEGER,
  weekly_rank INTEGER,
  
  -- Histórico
  points_this_month INTEGER DEFAULT 0,
  points_this_week INTEGER DEFAULT 0,
  points_today INTEGER DEFAULT 0,
  
  -- Metadados
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, agency_id)
);

-- 7. Histórico de Pontos
CREATE TABLE IF NOT EXISTS gamification_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES gamification_challenges(id) ON DELETE SET NULL,
  
  -- Detalhes da pontuação
  points_awarded INTEGER NOT NULL,
  reason VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Contexto
  action_type VARCHAR(50),
  source_table VARCHAR(50),
  source_id UUID,
  
  -- Metadados
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 8. Rankings e Leaderboards
CREATE TABLE IF NOT EXISTS gamification_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Configurações do leaderboard
  name VARCHAR(100) NOT NULL,
  description TEXT,
  period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly, yearly, all_time
  
  -- Critérios
  ranking_criteria VARCHAR(50) DEFAULT 'total_points', -- total_points, challenges_completed, badges_earned
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  max_positions INTEGER DEFAULT 100,
  
  -- Recompensas por posição
  position_rewards JSONB DEFAULT '{}',
  
  -- Data da última atualização
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(agency_id, name, period)
);

-- 9. Posições nos Rankings
CREATE TABLE IF NOT EXISTS gamification_leaderboard_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID REFERENCES gamification_leaderboards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Posição
  position INTEGER NOT NULL,
  score DECIMAL(12,2) NOT NULL,
  
  -- Detalhes
  points INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  
  -- Mudanças
  previous_position INTEGER,
  position_change INTEGER DEFAULT 0,
  
  -- Período
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(leaderboard_id, user_id, period_start)
);

-- 10. Conquistas e Achievements
CREATE TABLE IF NOT EXISTS gamification_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Informações da conquista
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(50),
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false,
  difficulty_level INTEGER DEFAULT 1, -- 1=easy, 2=medium, 3=hard, 4=expert, 5=legendary
  
  -- Critérios
  criteria JSONB NOT NULL DEFAULT '{}',
  
  -- Recompensas
  reward_points INTEGER DEFAULT 0,
  reward_badges TEXT[],
  reward_title VARCHAR(100),
  
  -- Estatísticas
  times_unlocked INTEGER DEFAULT 0,
  unlock_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(agency_id, name)
);

-- 11. Conquistas dos Usuários
CREATE TABLE IF NOT EXISTS gamification_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES gamification_achievements(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Detalhes da conquista
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_when_unlocked JSONB DEFAULT '{}',
  
  -- Recompensas recebidas
  points_awarded INTEGER DEFAULT 0,
  badges_awarded TEXT[],
  title_awarded VARCHAR(100),
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  UNIQUE(user_id, achievement_id)
);

-- Indexes para performance
CREATE INDEX idx_gamification_challenges_agency_status ON gamification_challenges(agency_id, status);
CREATE INDEX idx_gamification_challenges_dates ON gamification_challenges(start_date, end_date);
CREATE INDEX idx_gamification_challenge_participants_challenge ON gamification_challenge_participants(challenge_id, ranking_position);
CREATE INDEX idx_gamification_user_points_agency_rank ON gamification_user_points(agency_id, overall_rank);
CREATE INDEX idx_gamification_points_history_user_date ON gamification_points_history(user_id, awarded_at);
CREATE INDEX idx_gamification_leaderboard_positions_board_position ON gamification_leaderboard_positions(leaderboard_id, position);

-- Triggers para updated_at
CREATE TRIGGER update_gamification_settings_updated_at BEFORE UPDATE ON gamification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamification_challenges_updated_at BEFORE UPDATE ON gamification_challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamification_challenge_participants_updated_at BEFORE UPDATE ON gamification_challenge_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamification_badges_updated_at BEFORE UPDATE ON gamification_badges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamification_user_points_updated_at BEFORE UPDATE ON gamification_user_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamification_leaderboards_updated_at BEFORE UPDATE ON gamification_leaderboards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions auxiliares
CREATE OR REPLACE FUNCTION calculate_user_level(points INTEGER, level_points JSONB)
RETURNS INTEGER AS $$
DECLARE
  level INTEGER := 1;
  level_array INTEGER[];
  level_point INTEGER;
BEGIN
  level_array := ARRAY(SELECT jsonb_array_elements_text(level_points)::INTEGER);
  
  FOREACH level_point IN ARRAY level_array
  LOOP
    IF points >= level_point THEN
      level := level + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN GREATEST(1, level - 1);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_points_and_level()
RETURNS TRIGGER AS $$
DECLARE
  settings_rec RECORD;
  new_level INTEGER;
  points_for_next_level INTEGER;
BEGIN
  -- Buscar configurações da gamificação
  SELECT * INTO settings_rec 
  FROM gamification_settings 
  WHERE agency_id = NEW.agency_id;
  
  IF settings_rec IS NOT NULL AND settings_rec.enable_levels THEN
    -- Calcular novo nível
    new_level := calculate_user_level(NEW.total_points, settings_rec.points_per_level);
    
    -- Calcular pontos para próximo nível
    IF jsonb_array_length(settings_rec.points_per_level) > new_level THEN
      points_for_next_level := (settings_rec.points_per_level->>new_level)::INTEGER - NEW.total_points;
    ELSE
      points_for_next_level := 0;
    END IF;
    
    -- Atualizar nível e pontos para próximo nível
    NEW.current_level := new_level;
    NEW.points_to_next_level := GREATEST(0, points_for_next_level);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_level_trigger
  BEFORE UPDATE OF total_points ON gamification_user_points
  FOR EACH ROW EXECUTE FUNCTION update_user_points_and_level();

-- Trigger para atualizar ranking quando pontos mudam
CREATE OR REPLACE FUNCTION update_user_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar ranking geral
  WITH ranked_users AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
    FROM gamification_user_points 
    WHERE agency_id = NEW.agency_id
  )
  UPDATE gamification_user_points 
  SET overall_rank = ranked_users.rank
  FROM ranked_users 
  WHERE gamification_user_points.user_id = ranked_users.user_id 
    AND gamification_user_points.agency_id = NEW.agency_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rankings_trigger
  AFTER UPDATE OF total_points ON gamification_user_points
  FOR EACH ROW EXECUTE FUNCTION update_user_rankings();

-- RLS Policies
ALTER TABLE gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_leaderboard_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies básicas (ver dados da própria agência)
CREATE POLICY "Usuários podem ver gamificação de sua agência" ON gamification_settings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap
    WHERE uap.user_id = auth.uid() AND uap.agency_id = gamification_settings.agency_id
  )
);

CREATE POLICY "Usuários podem ver desafios de sua agência" ON gamification_challenges FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap
    WHERE uap.user_id = auth.uid() AND uap.agency_id = gamification_challenges.agency_id
  )
);

CREATE POLICY "Usuários podem ver seus pontos" ON gamification_user_points FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM user_agency_permissions uap
    WHERE uap.user_id = auth.uid() AND uap.agency_id = gamification_user_points.agency_id
  )
);

-- Views para relatórios
CREATE VIEW gamification_challenge_stats AS
SELECT 
  c.id,
  c.agency_id,
  c.title,
  c.objective_type,
  c.target_value,
  c.current_value,
  c.status,
  COUNT(cp.id) as total_participants,
  COUNT(CASE WHEN cp.is_completed THEN 1 END) as completed_participants,
  ROUND(AVG(cp.progress_percentage), 2) as avg_progress,
  SUM(cp.points_earned) as total_points_awarded
FROM gamification_challenges c
LEFT JOIN gamification_challenge_participants cp ON cp.challenge_id = c.id
GROUP BY c.id, c.agency_id, c.title, c.objective_type, c.target_value, c.current_value, c.status;

CREATE VIEW gamification_user_summary AS
SELECT 
  up.user_id,
  up.agency_id,
  up.total_points,
  up.current_level,
  up.overall_rank,
  up.challenges_completed,
  up.badges_earned,
  COUNT(ub.id) as total_badges,
  COUNT(ua.id) as total_achievements,
  COUNT(CASE WHEN cp.is_completed THEN 1 END) as active_challenges
FROM gamification_user_points up
LEFT JOIN gamification_user_badges ub ON ub.user_id = up.user_id
LEFT JOIN gamification_user_achievements ua ON ua.user_id = up.user_id
LEFT JOIN gamification_challenge_participants cp ON cp.user_id = up.user_id AND cp.is_completed = false
GROUP BY up.user_id, up.agency_id, up.total_points, up.current_level, up.overall_rank, up.challenges_completed, up.badges_earned;

-- Comentários nas tabelas
COMMENT ON TABLE gamification_settings IS 'Configurações gerais do sistema de gamificação por agência';
COMMENT ON TABLE gamification_challenges IS 'Desafios e metas criados para motivar as equipes';
COMMENT ON TABLE gamification_challenge_participants IS 'Participação dos usuários nos desafios';
COMMENT ON TABLE gamification_badges IS 'Badges disponíveis para serem conquistados';
COMMENT ON TABLE gamification_user_badges IS 'Badges conquistados pelos usuários';
COMMENT ON TABLE gamification_user_points IS 'Pontuação e nível atual de cada usuário';
COMMENT ON TABLE gamification_points_history IS 'Histórico de todas as pontuações recebidas';
COMMENT ON TABLE gamification_leaderboards IS 'Configuração dos rankings e leaderboards';
COMMENT ON TABLE gamification_leaderboard_positions IS 'Posições dos usuários nos rankings';
COMMENT ON TABLE gamification_achievements IS 'Conquistas especiais disponíveis';
COMMENT ON TABLE gamification_user_achievements IS 'Conquistas desbloqueadas pelos usuários';