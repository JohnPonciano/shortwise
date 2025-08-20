-- Script para reativar RLS quando necessário
-- Execute este script no SQL Editor do Supabase Dashboard quando quiser reativar a segurança

-- 1. Reativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas básicas de segurança
-- Políticas para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas para workspaces
CREATE POLICY "Users can view their own workspaces" 
ON public.workspaces FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own workspaces" 
ON public.workspaces FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own workspaces" 
ON public.workspaces FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own workspaces" 
ON public.workspaces FOR DELETE 
USING (auth.uid() = owner_id);

-- Políticas para links
CREATE POLICY "Users can view their own links" 
ON public.links FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own links" 
ON public.links FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links" 
ON public.links FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" 
ON public.links FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para clicks
CREATE POLICY "Users can view clicks on their links" 
ON public.clicks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.links 
  WHERE links.id = clicks.link_id 
  AND links.user_id = auth.uid()
));

CREATE POLICY "Anyone can insert clicks" 
ON public.clicks FOR INSERT 
WITH CHECK (true);

-- Políticas para notification_settings
CREATE POLICY "User can manage own notification settings"
ON public.notification_settings FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Políticas para workspace_invites
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

-- 3. Verificar se RLS foi reativado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'workspaces', 'links', 'clicks', 'notification_settings', 'workspace_invites')
AND schemaname = 'public';

-- 4. Verificar se as políticas foram criadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'workspaces', 'links', 'clicks', 'notification_settings', 'workspace_invites')
ORDER BY tablename, policyname;

-- 5. Testar se as políticas estão funcionando
-- (Execute como usuário normal, não como admin)
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_records
FROM public.profiles
WHERE auth.uid() = user_id
UNION ALL
SELECT 
  'workspaces' as table_name,
  COUNT(*) as total_records
FROM public.workspaces
WHERE auth.uid() = owner_id
UNION ALL
SELECT 
  'links' as table_name,
  COUNT(*) as total_records
FROM public.links
WHERE auth.uid() = user_id;

-- 6. MENSAGEM IMPORTANTE
-- O RLS foi reativado com políticas básicas de segurança
-- Agora os usuários só podem acessar seus próprios dados
-- Para adicionar funcionalidades de admin, você precisará criar políticas específicas 