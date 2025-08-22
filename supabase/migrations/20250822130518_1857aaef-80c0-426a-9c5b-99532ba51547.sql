
-- Atualizar a política para permitir que membros vejam outros membros do mesmo workspace
DROP POLICY IF EXISTS "Users can view workspace members if they are members" ON public.workspace_members;

CREATE POLICY "Members can view other members in same workspace" 
ON public.workspace_members 
FOR SELECT 
USING (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM workspace_members wm 
    WHERE wm.user_id = auth.uid()
  ) 
  OR 
  workspace_id IN (
    SELECT w.id 
    FROM workspaces w 
    WHERE w.owner_id = auth.uid()
  )
);
