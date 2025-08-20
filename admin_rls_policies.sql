-- Script para adicionar políticas RLS para admins
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Política para profiles (admins podem ver todos os perfis)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2. Política para workspaces (admins podem ver todos os workspaces)
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
CREATE POLICY "Admins can view all workspaces"
ON public.workspaces FOR SELECT
USING (
  owner_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 3. Política para links (admins podem ver todos os links)
DROP POLICY IF EXISTS "Admins can view all links" ON public.links;
CREATE POLICY "Admins can view all links"
ON public.links FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. Política para clicks (admins podem ver todos os cliques)
DROP POLICY IF EXISTS "Admins can view all clicks" ON public.clicks;
CREATE POLICY "Admins can view all clicks"
ON public.clicks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.links 
    WHERE links.id = clicks.link_id AND links.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5. Política para notification_settings (admins podem ver todas as configurações)
DROP POLICY IF EXISTS "Admins can view all notification settings" ON public.notification_settings;
CREATE POLICY "Admins can view all notification settings"
ON public.notification_settings FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 6. Política para workspace_invites (admins podem ver todos os convites)
DROP POLICY IF EXISTS "Admins can view all workspace invites" ON public.workspace_invites;
CREATE POLICY "Admins can view all workspace invites"
ON public.workspace_invites FOR SELECT
USING (
  created_by = auth.uid() OR 
  email = auth.jwt() ->> 'email' OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 7. Verificar se as políticas foram criadas
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

-- 8. Testar se um usuário admin pode acessar os dados
-- (Execute isso após tornar um usuário admin)
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_records
FROM public.profiles
WHERE EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
)
UNION ALL
SELECT 
  'workspaces' as table_name,
  COUNT(*) as total_records
FROM public.workspaces
WHERE EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
)
UNION ALL
SELECT 
  'links' as table_name,
  COUNT(*) as total_records
FROM public.links
WHERE EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
)
UNION ALL
SELECT 
  'clicks' as table_name,
  COUNT(*) as total_records
FROM public.clicks
WHERE EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
); 