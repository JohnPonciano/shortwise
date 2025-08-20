-- Fix notification_settings table
-- This migration ensures the notification_settings table exists

-- Create notification_settings table if it doesn't exist
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

-- Enable RLS if not already enabled
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DROP POLICY IF EXISTS "User can manage own notification settings" ON public.notification_settings;
CREATE POLICY "User can manage own notification settings"
ON public.notification_settings FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create workspace_invites table if it doesn't exist
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

-- Enable RLS for workspace_invites if not already enabled
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace_invites if they don't exist
DROP POLICY IF EXISTS "Creators can manage their invites" ON public.workspace_invites;
CREATE POLICY "Creators can manage their invites"
ON public.workspace_invites FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view invites by email" ON public.workspace_invites;
CREATE POLICY "Users can view invites by email"
ON public.workspace_invites FOR SELECT
USING (email IS NOT NULL AND email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Public can validate by token" ON public.workspace_invites;
CREATE POLICY "Public can validate by token"
ON public.workspace_invites FOR SELECT
USING (true);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token); 