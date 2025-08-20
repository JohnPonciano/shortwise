-- Script para corrigir políticas RLS e evitar recursão infinita
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all links" ON public.links;
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.clicks;
DROP POLICY IF EXISTS "Admins can view all notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Admins can view all workspace invites" ON public.workspace_invites;

-- 2. Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar políticas corrigidas usando a função
-- Política para profiles (admins podem ver todos os perfis)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id OR is_admin()
);

-- Política para workspaces (admins podem ver todos os workspaces)
CREATE POLICY "Admins can view all workspaces"
ON public.workspaces FOR SELECT
USING (
  owner_id = auth.uid() OR is_admin()
);

-- Política para links (admins podem ver todos os links)
CREATE POLICY "Admins can view all links"
ON public.links FOR SELECT
USING (
  user_id = auth.uid() OR is_admin()
);

-- Política para clicks (admins podem ver todos os cliques)
CREATE POLICY "Admins can view all clicks"
ON public.clicks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.links 
    WHERE links.id = clicks.link_id AND links.user_id = auth.uid()
  ) OR is_admin()
);

-- Política para notification_settings (admins podem ver todas as configurações)
CREATE POLICY "Admins can view all notification settings"
ON public.notification_settings FOR SELECT
USING (
  user_id = auth.uid() OR is_admin()
);

-- Política para workspace_invites (admins podem ver todos os convites)
CREATE POLICY "Admins can view all workspace invites"
ON public.workspace_invites FOR SELECT
USING (
  created_by = auth.uid() OR 
  email = auth.jwt() ->> 'email' OR
  is_admin()
);

-- 4. Verificar se as políticas foram criadas corretamente
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

-- 5. Testar a função is_admin
SELECT 
  auth.uid() as current_user_id,
  is_admin() as is_admin_user;

-- 6. Verificar se um usuário admin pode acessar os dados
-- (Execute isso após tornar um usuário admin)
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_records
FROM public.profiles
WHERE is_admin()
UNION ALL
SELECT 
  'workspaces' as table_name,
  COUNT(*) as total_records
FROM public.workspaces
WHERE is_admin()
UNION ALL
SELECT 
  'links' as table_name,
  COUNT(*) as total_records
FROM public.links
WHERE is_admin()
UNION ALL
SELECT 
  'clicks' as table_name,
  COUNT(*) as total_records
FROM public.clicks
WHERE is_admin(); 