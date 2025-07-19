-- =============================================
-- POLÍTICAS RLS COMPLETAS COM INTEGRAÇÕES
-- =============================================

-- 1. Ativar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_usage ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA PROFILES

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    );

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Donos de agência podem ver funcionários e clientes da agência
CREATE POLICY "Agency owners can view their team and clients" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'agency_owner'
            AND (
                profiles.agency_id = p.agency_id
                OR profiles.created_by IN (
                    SELECT user_id FROM agency_members 
                    WHERE agency_id = p.agency_id
                )
            )
        )
    );

-- Produtores independentes podem ver seus clientes
CREATE POLICY "Independent producers can view their clients" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'independent_producer'
            AND (
                profiles.producer_id = p.id
                OR profiles.created_by = p.id
            )
        )
    );

-- Funcionários de agência podem ver colegas da mesma agência
CREATE POLICY "Agency employees can view colleagues" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('agency_manager', 'agency_employee')
            AND profiles.agency_id = p.agency_id
        )
    );

-- 3. POLÍTICAS PARA AVAILABLE_INTEGRATIONS

-- Todos podem ver integrações disponíveis (catálogo público)
CREATE POLICY "Everyone can view available integrations" ON available_integrations
    FOR SELECT USING (is_active = true);

-- Apenas admins podem modificar o catálogo
CREATE POLICY "Only admins can modify integrations catalog" ON available_integrations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. POLÍTICAS PARA USER_INTEGRATIONS

-- Usuários podem ver e gerenciar suas próprias integrações
CREATE POLICY "Users can manage own integrations" ON user_integrations
    FOR ALL USING (user_id = auth.uid());

-- Donos de agência podem ver integrações de funcionários e clientes
CREATE POLICY "Agency owners can view team integrations" ON user_integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'agency_owner'
            AND user_id IN (
                SELECT id FROM profiles 
                WHERE agency_id = p.agency_id 
                OR created_by IN (
                    SELECT user_id FROM agency_members 
                    WHERE agency_id = p.agency_id
                )
            )
        )
    );

-- Produtores independentes podem ver integrações de seus clientes
CREATE POLICY "Producers can view client integrations" ON user_integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'independent_producer'
            AND user_id IN (
                SELECT id FROM profiles 
                WHERE producer_id = p.id OR created_by = p.id
            )
        )
    );

-- Gerentes podem ver integrações da equipe designada
CREATE POLICY "Agency managers can view team integrations" ON user_integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'agency_manager'
            AND user_id IN (
                SELECT id FROM profiles 
                WHERE agency_id = p.agency_id
            )
        )
    );

-- 5. POLÍTICAS PARA INTEGRATION_USAGE

-- Usuários podem ver logs de suas próprias integrações
CREATE POLICY "Users can view own integration usage" ON integration_usage
    FOR SELECT USING (user_id = auth.uid());

-- Donos de agência podem ver logs de toda a agência
CREATE POLICY "Agency owners can view team usage" ON integration_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'agency_owner'
            AND user_id IN (
                SELECT id FROM profiles 
                WHERE agency_id = p.agency_id 
                OR created_by IN (
                    SELECT user_id FROM agency_members 
                    WHERE agency_id = p.agency_id
                )
            )
        )
    );

-- Produtores podem ver logs de seus clientes
CREATE POLICY "Producers can view client usage" ON integration_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'independent_producer'
            AND user_id IN (
                SELECT id FROM profiles 
                WHERE producer_id = p.id OR created_by = p.id
            )
        )
    );

-- Admins podem ver todos os logs
CREATE POLICY "Admins can view all usage" ON integration_usage
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. POLÍTICAS DE ATUALIZAÇÃO E INSERÇÃO

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Permitir criação de perfil no signup
CREATE POLICY "Allow profile creation on signup" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Donos de agência podem criar funcionários e clientes
CREATE POLICY "Agency owners can create team members" ON profiles
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT p.id FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'agency_owner'
        )
        AND role IN ('agency_manager', 'agency_employee', 'client')
    );

-- Produtores independentes podem criar clientes
CREATE POLICY "Producers can create clients" ON profiles
    FOR INSERT WITH CHECK (
        role = 'client' 
        AND created_by IN (
            SELECT p.id FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'independent_producer'
        )
    );

-- Sistema pode criar logs de uso automaticamente
CREATE POLICY "Allow integration usage logging" ON integration_usage
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'agency_owner', 'independent_producer')
        )
    );

SELECT 'Políticas RLS completas criadas com sucesso!' as status;
