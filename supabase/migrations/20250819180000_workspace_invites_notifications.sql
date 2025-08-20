-- Create workspace_invites table
CREATE TABLE IF NOT EXISTS public.workspace_invites (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
	token TEXT UNIQUE NOT NULL,
	email TEXT,
	role TEXT NOT NULL DEFAULT 'member',
	created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
	expires_at TIMESTAMP WITH TIME ZONE,
	accepted_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
	accepted_at TIMESTAMP WITH TIME ZONE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- RLS: creators can see their invites; users can see invites addressed to their email; public can check by token for acceptance
CREATE POLICY "Creators can manage their invites"
ON public.workspace_invites FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view invites by email"
ON public.workspace_invites FOR SELECT
USING (email IS NOT NULL AND email = auth.jwt() ->> 'email');

CREATE POLICY "Public can validate by token"
ON public.workspace_invites FOR SELECT
USING (true);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
	user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
	email_new_links BOOLEAN DEFAULT true,
	email_analytics BOOLEAN DEFAULT true,
	email_security BOOLEAN DEFAULT true,
	email_team BOOLEAN DEFAULT true,
	email_marketing BOOLEAN DEFAULT false,
	push_new_links BOOLEAN DEFAULT false,
	push_analytics BOOLEAN DEFAULT false,
	push_security BOOLEAN DEFAULT true,
	push_team BOOLEAN DEFAULT true,
	frequency TEXT DEFAULT 'daily',
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can manage own notification settings"
ON public.notification_settings FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid()); 