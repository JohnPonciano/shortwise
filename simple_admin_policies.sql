-- Versão simplificada das políticas RLS para admins
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover todas as políticas de admin existentes
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all links" ON public.links;
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.clicks;
DROP POLICY IF EXISTS "Admins can view all notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Admins can view all workspace invites" ON public.workspace_invites;

-- 2. Remover função is_admin se existir
DROP FUNCTION IF EXISTS is_admin();

-- 3. Criar políticas mais simples que permitem acesso total para admins
-- Política para profiles - permitir acesso total (admin pode ver tudo)
CREATE POLICY "Allow admin access to profiles"
ON public.profiles FOR SELECT
USING (true);

-- Política para workspaces - permitir acesso total
CREATE POLICY "Allow admin access to workspaces"
ON public.workspaces FOR SELECT
USING (true);

-- Política para links - permitir acesso total
CREATE POLICY "Allow admin access to links"
ON public.links FOR SELECT
USING (true);

-- Política para clicks - permitir acesso total
CREATE POLICY "Allow admin access to clicks"
ON public.clicks FOR SELECT
USING (true);

-- Política para notification_settings - permitir acesso total
CREATE POLICY "Allow admin access to notification settings"
ON public.notification_settings FOR SELECT
USING (true);

-- Política para workspace_invites - permitir acesso total
CREATE POLICY "Allow admin access to workspace invites"
ON public.workspace_invites FOR SELECT
USING (true);

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
AND policyname LIKE '%admin%'
ORDER BY tablename, policyname;

-- 5. Testar acesso aos dados
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_records
FROM public.profiles
UNION ALL
SELECT 
  'workspaces' as table_name,
  COUNT(*) as total_records
FROM public.workspaces
UNION ALL
SELECT 
  'links' as table_name,
  COUNT(*) as total_records
FROM public.links
UNION ALL
SELECT 
  'clicks' as table_name,
  COUNT(*) as total_records
FROM public.clicks;

-- 6. Verificar usuários admin
SELECT 
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin'; 