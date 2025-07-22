-- ==========================================
-- POLÍTICAS RLS PARA SISTEMA MULTI-CLIENTE
-- ==========================================

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se o usuário é proprietário de agência
CREATE OR REPLACE FUNCTION public.is_agency_owner()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'agency', 'agency_owner')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se o usuário pode gerenciar contas
CREATE OR REPLACE FUNCTION public.can_manage_accounts()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'agency', 'agency_owner', 'agency_staff', 'independent')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se o usuário pertence à mesma agência
CREATE OR REPLACE FUNCTION public.same_agency(agency_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN role IN ('admin') THEN true
        WHEN role IN ('agency', 'agency_owner') THEN id = agency_id
        WHEN role IN ('agency_staff') THEN (
          SELECT parent_id FROM public.user_profiles WHERE id = auth.uid()
        ) = agency_id
        ELSE false
      END
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- POLÍTICAS PARA CLIENTS
-- ==========================================

-- Política para visualizar clientes
CREATE POLICY "Users can view clients they manage" ON public.clients
  FOR SELECT
  USING (
    -- Admins podem ver tudo
    is_admin() OR
    -- Agency owners/staff podem ver seus clientes
    same_agency(agency_id) OR
    -- Clientes podem ver apenas suas próprias informações
    (
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role = 'client' 
        AND email = clients.email
      )
    )
  );

-- Política para inserir clientes
CREATE POLICY "Agency users can create clients" ON public.clients
  FOR INSERT
  WITH CHECK (
    can_manage_accounts() AND 
    same_agency(agency_id)
  );

-- Política para atualizar clientes
CREATE POLICY "Agency users can update their clients" ON public.clients
  FOR UPDATE
  USING (
    is_admin() OR 
    same_agency(agency_id)
  )
  WITH CHECK (
    is_admin() OR 
    same_agency(agency_id)
  );

-- Política para deletar clientes
CREATE POLICY "Agency owners can delete clients" ON public.clients
  FOR DELETE
  USING (
    is_admin() OR 
    same_agency(agency_id)
  );

-- ==========================================
-- POLÍTICAS PARA PROJECTS
-- ==========================================

-- Política para visualizar projetos
CREATE POLICY "Users can view relevant projects" ON public.projects
  FOR SELECT
  USING (
    -- Admins podem ver tudo
    is_admin() OR
    -- Agency users podem ver projetos de seus clientes
    same_agency(agency_id) OR
    -- Project members podem ver seus projetos
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = projects.id AND user_id = auth.uid()
    ) OR
    -- Clientes podem ver seus próprios projetos
    (
      EXISTS (
        SELECT 1 FROM public.clients c
        JOIN public.user_profiles u ON c.email = u.email
        WHERE c.id = projects.client_id 
        AND u.id = auth.uid()
        AND u.role = 'client'
      )
    )
  );

-- Política para inserir projetos
CREATE POLICY "Agency users can create projects" ON public.projects
  FOR INSERT
  WITH CHECK (
    can_manage_accounts() AND 
    same_agency(agency_id) AND
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id AND same_agency(agency_id)
    )
  );

-- Política para atualizar projetos
CREATE POLICY "Authorized users can update projects" ON public.projects
  FOR UPDATE
  USING (
    is_admin() OR 
    same_agency(agency_id) OR
    project_manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    is_admin() OR 
    same_agency(agency_id) OR
    project_manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'manager')
    )
  );

-- ==========================================
-- POLÍTICAS PARA TASKS
-- ==========================================

-- Política para visualizar tarefas
CREATE POLICY "Users can view relevant tasks" ON public.tasks
  FOR SELECT
  USING (
    -- Admins podem ver tudo
    is_admin() OR
    -- Assignee pode ver suas tarefas
    assignee_id = auth.uid() OR
    -- Creator pode ver tarefas que criou
    created_by_id = auth.uid() OR
    -- Agency users podem ver tarefas de seus clientes/projetos
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id 
      AND same_agency(p.agency_id)
    ) OR
    -- Project members podem ver tarefas do projeto
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = tasks.project_id 
      AND pm.user_id = auth.uid()
    ) OR
    -- Clientes podem ver tarefas visíveis dos seus projetos
    (
      visibility IN ('client', 'public') AND
      EXISTS (
        SELECT 1 FROM public.clients c
        JOIN public.user_profiles u ON c.email = u.email
        WHERE c.id = tasks.client_id 
        AND u.id = auth.uid()
        AND u.role = 'client'
      )
    )
  );

-- Política para inserir tarefas
CREATE POLICY "Authorized users can create tasks" ON public.tasks
  FOR INSERT
  WITH CHECK (
    -- Verificar se pode acessar o projeto
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id 
      AND (
        is_admin() OR
        same_agency(p.agency_id) OR
        p.project_manager_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = p.id 
          AND pm.user_id = auth.uid()
        )
      )
    )
  );

-- Política para atualizar tarefas
CREATE POLICY "Authorized users can update tasks" ON public.tasks
  FOR UPDATE
  USING (
    is_admin() OR
    assignee_id = auth.uid() OR
    created_by_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id 
      AND (
        same_agency(p.agency_id) OR
        p.project_manager_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = tasks.project_id 
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'manager', 'member')
    )
  )
  WITH CHECK (
    is_admin() OR
    assignee_id = auth.uid() OR
    created_by_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id 
      AND (
        same_agency(p.agency_id) OR
        p.project_manager_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = tasks.project_id 
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'manager', 'member')
    )
  );

-- ==========================================
-- POLÍTICAS PARA SUBTASKS
-- ==========================================

-- Política para visualizar subtarefas
CREATE POLICY "Users can view subtasks of accessible tasks" ON public.subtasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = subtasks.task_id
      -- Reutiliza a lógica de acesso das tasks
    )
  );

-- Política para inserir/atualizar subtarefas
CREATE POLICY "Users can manage subtasks of accessible tasks" ON public.subtasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = subtasks.task_id
      AND (
        is_admin() OR
        t.assignee_id = auth.uid() OR
        t.created_by_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = t.project_id 
          AND same_agency(p.agency_id)
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = subtasks.task_id
      AND (
        is_admin() OR
        t.assignee_id = auth.uid() OR
        t.created_by_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = t.project_id 
          AND same_agency(p.agency_id)
        )
      )
    )
  );

-- ==========================================
-- POLÍTICAS PARA TASK_COMMENTS
-- ==========================================

-- Política para visualizar comentários
CREATE POLICY "Users can view comments on accessible tasks" ON public.task_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id
      -- Reutiliza a lógica de acesso das tasks
    )
  );

-- Política para inserir comentários
CREATE POLICY "Users can comment on accessible tasks" ON public.task_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      -- Verificar se pode acessar a task
    )
  );

-- Política para atualizar próprios comentários
CREATE POLICY "Users can update their own comments" ON public.task_comments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- POLÍTICAS PARA ATTACHMENTS
-- ==========================================

-- Política para visualizar anexos
CREATE POLICY "Users can view attachments of accessible entities" ON public.attachments
  FOR SELECT
  USING (
    is_admin() OR
    uploaded_by_id = auth.uid() OR
    (
      entity_type = 'task' AND
      EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = attachments.entity_id
        -- Reutiliza lógica de acesso das tasks
      )
    ) OR
    (
      entity_type = 'project' AND
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = attachments.entity_id
        -- Reutiliza lógica de acesso dos projects
      )
    )
  );

-- Política para inserir anexos
CREATE POLICY "Users can upload attachments to accessible entities" ON public.attachments
  FOR INSERT
  WITH CHECK (
    uploaded_by_id = auth.uid() AND (
      is_admin() OR
      (
        entity_type = 'task' AND
        EXISTS (
          SELECT 1 FROM public.tasks t
          WHERE t.id = entity_id
          -- Verificar acesso à task
        )
      ) OR
      (
        entity_type = 'project' AND
        EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = entity_id
          -- Verificar acesso ao project
        )
      )
    )
  );

-- ==========================================
-- POLÍTICAS PARA TIME_ENTRIES
-- ==========================================

-- Política para visualizar registros de tempo
CREATE POLICY "Users can view relevant time entries" ON public.time_entries
  FOR SELECT
  USING (
    is_admin() OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = time_entries.project_id 
      AND same_agency(p.agency_id)
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = time_entries.project_id 
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'manager')
    )
  );

-- Política para inserir registros de tempo
CREATE POLICY "Users can create time entries for their tasks" ON public.time_entries
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id 
      AND (t.assignee_id = auth.uid() OR t.created_by_id = auth.uid())
    )
  );

-- ==========================================
-- POLÍTICAS PARA NOTIFICATIONS
-- ==========================================

-- Política para visualizar notificações
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Política para atualizar notificações
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- POLÍTICAS PARA PROJECT_MEMBERS
-- ==========================================

-- Política para visualizar membros do projeto
CREATE POLICY "Users can view project members of accessible projects" ON public.project_members
  FOR SELECT
  USING (
    is_admin() OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_members.project_id 
      AND same_agency(p.agency_id)
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_members pm2
      WHERE pm2.project_id = project_members.project_id 
      AND pm2.user_id = auth.uid()
    )
  );

-- Política para gerenciar membros do projeto
CREATE POLICY "Project managers can manage project members" ON public.project_members
  FOR ALL
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_members.project_id 
      AND (
        same_agency(p.agency_id) OR
        p.project_manager_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_members pm2
      WHERE pm2.project_id = project_members.project_id 
      AND pm2.user_id = auth.uid()
      AND pm2.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id 
      AND (
        same_agency(p.agency_id) OR
        p.project_manager_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_members pm2
      WHERE pm2.project_id = project_id 
      AND pm2.user_id = auth.uid()
      AND pm2.role IN ('owner', 'manager')
    )
  );

-- ==========================================
-- POLÍTICAS PARA CLIENT_SETTINGS
-- ==========================================

-- Política para visualizar configurações do cliente
CREATE POLICY "Users can view relevant client settings" ON public.client_settings
  FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_settings.client_id 
      AND same_agency(c.agency_id)
    ) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.user_profiles u ON c.email = u.email
      WHERE c.id = client_settings.client_id 
      AND u.id = auth.uid()
      AND u.role = 'client'
    )
  );

-- Política para atualizar configurações do cliente
CREATE POLICY "Authorized users can update client settings" ON public.client_settings
  FOR ALL
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_settings.client_id 
      AND same_agency(c.agency_id)
    ) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.user_profiles u ON c.email = u.email
      WHERE c.id = client_settings.client_id 
      AND u.id = auth.uid()
      AND u.role = 'client'
    )
  )
  WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id 
      AND same_agency(c.agency_id)
    ) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.user_profiles u ON c.email = u.email
      WHERE c.id = client_id 
      AND u.id = auth.uid()
      AND u.role = 'client'
    )
  );