-- Versão segura das políticas RLS para admins
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Primeiro, vamos verificar as políticas existentes
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

-- 2. Remover apenas as políticas de admin problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all links" ON public.links;
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.clicks;
DROP POLICY IF EXISTS "Admins can view all notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Admins can view all workspace invites" ON public.workspace_invites;

-- 3. Criar função simples para verificar role do usuário
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar políticas que permitem acesso total apenas para admins
-- Política para profiles
CREATE POLICY "Admin full access to profiles"
ON public.profiles FOR SELECT
USING (get_user_role() = 'admin');

-- Política para workspaces
CREATE POLICY "Admin full access to workspaces"
ON public.workspaces FOR SELECT
USING (get_user_role() = 'admin');

-- Política para links
CREATE POLICY "Admin full access to links"
ON public.links FOR SELECT
USING (get_user_role() = 'admin');

-- Política para clicks
CREATE POLICY "Admin full access to clicks"
ON public.clicks FOR SELECT
USING (get_user_role() = 'admin');

-- Política para notification_settings
CREATE POLICY "Admin full access to notification settings"
ON public.notification_settings FOR SELECT
USING (get_user_role() = 'admin');

-- Política para workspace_invites
CREATE POLICY "Admin full access to workspace invites"
ON public.workspace_invites FOR SELECT
USING (get_user_role() = 'admin');

-- 5. Verificar se as políticas foram criadas
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

-- 6. Testar a função get_user_role
SELECT 
  auth.uid() as current_user_id,
  get_user_role() as user_role;

-- 7. Verificar usuários admin
SELECT 
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin';

-- 8. Testar acesso aos dados (execute como admin)
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_records
FROM public.profiles
WHERE get_user_role() = 'admin'
UNION ALL
SELECT 
  'workspaces' as table_name,
  COUNT(*) as total_records
FROM public.workspaces
WHERE get_user_role() = 'admin'
UNION ALL
SELECT 
  'links' as table_name,
  COUNT(*) as total_records
FROM public.links
WHERE get_user_role() = 'admin'
UNION ALL
SELECT 
  'clicks' as table_name,
  COUNT(*) as total_records
FROM public.clicks
WHERE get_user_role() = 'admin'; 