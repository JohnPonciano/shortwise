-- Add link expiration and team collaboration features
ALTER TABLE public.links 
ADD COLUMN expires_at timestamp with time zone,
ADD COLUMN password text,
ADD COLUMN max_clicks integer;

-- Add team collaboration tables
CREATE TABLE public.workspace_members (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    invited_by uuid,
    invited_at timestamp with time zone DEFAULT now(),
    joined_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- Enable RLS on workspace_members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace_members
CREATE POLICY "Users can view workspace members if they are members" 
ON public.workspace_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm2 
    WHERE wm2.workspace_id = workspace_members.workspace_id 
    AND wm2.user_id = auth.uid()
  )
);

CREATE POLICY "Workspace admins can manage members" 
ON public.workspace_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm2 
    WHERE wm2.workspace_id = workspace_members.workspace_id 
    AND wm2.user_id = auth.uid() 
    AND wm2.role IN ('owner', 'admin')
  )
);

-- Add enhanced analytics to clicks table
ALTER TABLE public.clicks 
ADD COLUMN browser text,
ADD COLUMN os text,
ADD COLUMN region text,
ADD COLUMN timezone text;

-- Add indexes for better performance
CREATE INDEX idx_links_expires_at ON public.links(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_links_max_clicks ON public.links(max_clicks) WHERE max_clicks IS NOT NULL;
CREATE INDEX idx_workspace_members_workspace_user ON public.workspace_members(workspace_id, user_id);
CREATE INDEX idx_clicks_analytics ON public.clicks(link_id, clicked_at, country, device_type);

-- Create function to auto-add workspace owner as member
CREATE OR REPLACE FUNCTION public.add_workspace_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.owner_id, 'owner', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-adding workspace owner
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.add_workspace_owner_as_member();

-- Update existing workspaces to have owner members
INSERT INTO public.workspace_members (workspace_id, user_id, role, joined_at)
SELECT id, owner_id, 'owner', created_at
FROM public.workspaces
WHERE NOT EXISTS (
  SELECT 1 FROM public.workspace_members 
  WHERE workspace_id = workspaces.id AND user_id = workspaces.owner_id
);

-- Add comments for documentation
COMMENT ON COLUMN public.links.expires_at IS 'Optional expiration date for the link';
COMMENT ON COLUMN public.links.password IS 'Optional password protection for the link';
COMMENT ON COLUMN public.links.max_clicks IS 'Optional maximum number of clicks before link becomes inactive';
COMMENT ON TABLE public.workspace_members IS 'Team collaboration - workspace members and their roles';