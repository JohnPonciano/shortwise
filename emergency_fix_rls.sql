-- SOLUÇÃO DE EMERGÊNCIA - Resolver recursão infinita
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover TODAS as políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all links" ON public.links;
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.clicks;
DROP POLICY IF EXISTS "Admins can view all notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Admins can view all workspace invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Allow admin access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin access to workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Allow admin access to links" ON public.links;
DROP POLICY IF EXISTS "Allow admin access to clicks" ON public.clicks;
DROP POLICY IF EXISTS "Allow admin access to notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Allow admin access to workspace invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Admin full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access to workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admin full access to links" ON public.links;
DROP POLICY IF EXISTS "Admin full access to clicks" ON public.clicks;
DROP POLICY IF EXISTS "Admin full access to notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Admin full access to workspace invites" ON public.workspace_invites;

-- 2. Remover funções problemáticas
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS get_user_role();

-- 3. Verificar políticas existentes
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

-- 4. OPÇÃO A: Desabilitar RLS temporariamente para admins
-- (Execute apenas se você quiser acesso total temporário)

-- Desabilitar RLS nas tabelas principais
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.links DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clicks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notification_settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workspace_invites DISABLE ROW LEVEL SECURITY;

-- 5. OPÇÃO B: Criar políticas muito simples sem recursão
-- (Execute esta seção se quiser manter RLS)

-- Política simples para profiles - permitir acesso total
CREATE POLICY "Simple access to profiles"
ON public.profiles FOR SELECT
USING (true);

-- Política simples para workspaces - permitir acesso total
CREATE POLICY "Simple access to workspaces"
ON public.workspaces FOR SELECT
USING (true);

-- Política simples para links - permitir acesso total
CREATE POLICY "Simple access to links"
ON public.links FOR SELECT
USING (true);

-- Política simples para clicks - permitir acesso total
CREATE POLICY "Simple access to clicks"
ON public.clicks FOR SELECT
USING (true);

-- Política simples para notification_settings - permitir acesso total
CREATE POLICY "Simple access to notification settings"
ON public.notification_settings FOR SELECT
USING (true);

-- Política simples para workspace_invites - permitir acesso total
CREATE POLICY "Simple access to workspace invites"
ON public.workspace_invites FOR SELECT
USING (true);

-- 6. Verificar se as políticas foram criadas
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

-- 7. Testar acesso aos dados
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

-- 8. Verificar usuários admin
SELECT 
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin';

-- 9. Se ainda houver problemas, execute esta consulta para verificar o status do RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'workspaces', 'links', 'clicks', 'notification_settings', 'workspace_invites')
AND schemaname = 'public'; 