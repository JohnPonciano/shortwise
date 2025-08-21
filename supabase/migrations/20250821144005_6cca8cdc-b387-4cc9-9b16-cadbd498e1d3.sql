
-- Remover a política existente que só permite visualização pública
DROP POLICY IF EXISTS "Public can view active links for redirection" ON public.links;

-- Criar políticas para membros do workspace poderem gerenciar links
CREATE POLICY "Workspace members can view links" ON public.links
FOR SELECT USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  ) OR
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w 
    WHERE w.owner_id = auth.uid()
  )
);

-- Política para inserção de links (membros do workspace)
CREATE POLICY "Workspace members can create links" ON public.links
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  ) OR
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w 
    WHERE w.owner_id = auth.uid()
  )
);

-- Política para atualização de links (membros do workspace)
CREATE POLICY "Workspace members can update links" ON public.links
FOR UPDATE USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  ) OR
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w 
    WHERE w.owner_id = auth.uid()
  )
);

-- Política para deleção de links (membros do workspace)
CREATE POLICY "Workspace members can delete links" ON public.links
FOR DELETE USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_members wm 
    WHERE wm.user_id = auth.uid()
  ) OR
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w 
    WHERE w.owner_id = auth.uid()
  )
);

-- Manter política pública para redirecionamento (sem autenticação)
CREATE POLICY "Public can view active links for redirection" ON public.links
FOR SELECT USING (is_active = true);
