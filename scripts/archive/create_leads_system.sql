-- Criar sistema completo de leads para agency signup
-- Execute no Supabase SQL Editor

-- 1. Criar tabela de leads se não existir
CREATE TABLE IF NOT EXISTS public.website_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    website TEXT,
    current_tools TEXT,
    estimated_clients TEXT,
    plan_interest TEXT,
    billing_cycle TEXT DEFAULT 'monthly',
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_website_leads_email ON public.website_leads(email);
CREATE INDEX IF NOT EXISTS idx_website_leads_created_at ON public.website_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_website_leads_status ON public.website_leads(status);

-- 3. Habilitar RLS
ALTER TABLE public.website_leads ENABLE ROW LEVEL SECURITY;

-- 4. Criar política RLS (admin pode ver todos os leads)
CREATE POLICY "Admin can manage all leads" ON public.website_leads
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. Criar função process_website_lead
CREATE OR REPLACE FUNCTION public.process_website_lead(
    p_name TEXT,
    p_email TEXT,
    p_company_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_current_tools TEXT DEFAULT NULL,
    p_estimated_clients TEXT DEFAULT NULL,
    p_plan_interest TEXT DEFAULT NULL,
    p_billing_cycle TEXT DEFAULT 'monthly',
    p_utm_source TEXT DEFAULT NULL,
    p_utm_medium TEXT DEFAULT NULL,
    p_utm_campaign TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    lead_id UUID;
    result JSON;
BEGIN
    -- Validar dados obrigatórios
    IF p_name IS NULL OR p_name = '' THEN
        RETURN json_build_object('error', 'Nome é obrigatório');
    END IF;
    
    IF p_email IS NULL OR p_email = '' THEN
        RETURN json_build_object('error', 'Email é obrigatório');
    END IF;

    -- Inserir lead
    INSERT INTO public.website_leads (
        name, email, company_name, phone, website, current_tools,
        estimated_clients, plan_interest, billing_cycle,
        utm_source, utm_medium, utm_campaign, status
    ) VALUES (
        p_name, p_email, p_company_name, p_phone, p_website, p_current_tools,
        p_estimated_clients, p_plan_interest, p_billing_cycle,
        p_utm_source, p_utm_medium, p_utm_campaign, 'new'
    ) RETURNING id INTO lead_id;

    -- Retornar sucesso
    SELECT json_build_object(
        'success', true,
        'lead_id', lead_id,
        'message', 'Lead criado com sucesso'
    ) INTO result;

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'error', 'Erro interno: ' || SQLERRM,
        'success', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atualizar função de criação de usuário via webhook para incluir leads
CREATE OR REPLACE FUNCTION public.handle_stripe_webhook_user_creation(
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_company TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_stripe_customer_id TEXT DEFAULT NULL,
    p_subscription_id TEXT DEFAULT NULL,
    p_plan_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    user_role TEXT DEFAULT 'agency_owner'; -- Default para agency signup
    result JSON;
BEGIN
    -- Determinar role baseado no plano
    IF p_plan_name ILIKE '%agency%' THEN
        user_role := 'agency_owner';
    ELSIF p_plan_name ILIKE '%independent%' THEN
        user_role := 'independent_producer'; 
    ELSE
        user_role := 'agency_owner'; -- Default
    END IF;

    -- Verificar se usuário já existe
    SELECT id INTO new_user_id
    FROM public.user_profiles
    WHERE email = p_email;

    IF new_user_id IS NOT NULL THEN
        -- Usuário já existe, atualizar dados
        UPDATE public.user_profiles 
        SET 
            name = COALESCE(p_name, name),
            company = COALESCE(p_company, company),
            phone = COALESCE(p_phone, phone),
            stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
            updated_at = NOW()
        WHERE id = new_user_id;
        
        RETURN json_build_object(
            'success', true,
            'user_id', new_user_id,
            'action', 'updated',
            'message', 'Usuário atualizado com sucesso'
        );
    ELSE
        -- Criar novo usuário (será criado quando fizer primeiro login)
        -- Por enquanto, apenas marcar o lead como convertido
        UPDATE public.website_leads 
        SET status = 'converted', updated_at = NOW()
        WHERE email = p_email;
        
        RETURN json_build_object(
            'success', true,
            'action', 'lead_converted',
            'message', 'Lead marcado como convertido, usuário será criado no primeiro login'
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'error', 'Erro interno: ' || SQLERRM,
        'success', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_website_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_website_leads_updated_at
    BEFORE UPDATE ON public.website_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_website_leads_updated_at();

-- 8. Inserir dados de teste para validar
INSERT INTO public.website_leads (
    name, email, company_name, phone, plan_interest, billing_cycle, status
) VALUES (
    'Teste Lead Agency', 'test.lead@agency.com', 'Test Agency Company', 
    '(11) 99999-9999', 'agency_basic', 'monthly', 'test'
) ON CONFLICT DO NOTHING;

-- Verificar se tudo foi criado
SELECT 'Tabela website_leads criada' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'website_leads');

SELECT 'Função process_website_lead criada' as status  
WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'process_website_lead');