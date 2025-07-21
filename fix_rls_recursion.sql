-- Script para corrigir recursão infinita nas políticas RLS
-- Problema: A política admin consulta user_profiles para verificar se é admin,
-- causando recursão quando tenta acessar a própria tabela

-- 1. Remover política problemática
DROP POLICY IF EXISTS "Admin can manage all" ON public.user_profiles;

-- 2. Criar nova política admin sem recursão
-- Usamos uma abordagem diferente: criar uma função que usa auth.jwt()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Verificar se o usuário tem role admin através de uma consulta direta
  -- usando o service role para evitar RLS
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users u
    JOIN public.user_profiles p ON u.id = p.id
    WHERE u.id = auth.uid() 
    AND p.role = 'admin'
  );
$$;

-- 3. Criar política admin simplificada
CREATE POLICY "Admin can manage all" ON public.user_profiles FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Alternativa: usar uma abordagem ainda mais simples
-- Remover a política atual e criar uma que bypasse RLS para admin
DROP POLICY IF EXISTS "Admin can manage all" ON public.user_profiles;

-- Criar policy que permite acesso total para usuários específicos conhecidos
CREATE POLICY "Admin bypass" ON public.user_profiles FOR ALL 
USING (auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid)
WITH CHECK (auth.uid() = '71f0cbbb-1963-430c-b445-78907e747574'::uuid);

-- Comentário: Este UUID é do usuário admin@fvstudios.com
-- Em produção, seria melhor usar uma tabela separada para roles ou metadata do JWT