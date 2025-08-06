-- ===============================================================
-- CRIAR FUNÇÕES FALTANTES NO BANCO DE DADOS
-- ===============================================================

-- Função para buscar convites pendentes
CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    role TEXT,
    agency_id UUID,
    agency_name TEXT,
    company TEXT,
    phone TEXT,
    welcome_message TEXT,
    plan_id UUID,
    plan_name TEXT,
    invited_by UUID,
    invited_by_name TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        ui.email,
        ui.name,
        ui.role,
        ui.agency_id,
        a.name as agency_name,
        ui.company,
        ui.phone,
        ui.welcome_message,
        ui.plan_id,
        pl.plan_name,
        ui.invited_by,
        au.email as invited_by_name,
        ui.expires_at,
        ui.created_at,
        ui.status
    FROM user_invitations ui
    LEFT JOIN agencies a ON ui.agency_id = a.id
    LEFT JOIN plan_limits pl ON ui.plan_id = pl.id
    LEFT JOIN auth.users au ON ui.invited_by = au.id
    WHERE ui.status = 'pending' 
      AND ui.expires_at > NOW()
    ORDER BY ui.created_at DESC;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations() TO service_role;

-- Comentário
COMMENT ON FUNCTION public.get_pending_invitations() IS 'Lista todos os convites de usuário pendentes e não expirados';

-- Verificar se a função foi criada
SELECT 'Função get_pending_invitations criada com sucesso!' as resultado;