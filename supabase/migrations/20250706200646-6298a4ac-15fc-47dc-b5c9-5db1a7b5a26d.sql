-- Fix the infinite recursion in workspace_members RLS policies
DROP POLICY IF EXISTS "Users can view workspace members if they are members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can manage members" ON public.workspace_members;

-- Create corrected RLS policies for workspace_members
CREATE POLICY "Users can view workspace members if they are members" 
ON public.workspace_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w 
    WHERE w.owner_id = auth.uid()
  )
);

CREATE POLICY "Workspace owners can manage members" 
ON public.workspace_members 
FOR ALL 
USING (
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w 
    WHERE w.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert themselves as members" 
ON public.workspace_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());