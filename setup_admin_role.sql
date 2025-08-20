-- Script para configurar sistema de roles e tornar um usuário admin
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Adicionar coluna role na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- 2. Criar índice para role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Adicionar comentário explicando o sistema de roles
COMMENT ON COLUMN public.profiles.role IS 'User role: user (default), admin (full access), moderator (limited admin access)';

-- 4. Tornar um usuário específico admin (substitua pelo email do usuário que você quer tornar admin)
-- IMPORTANTE: Substitua 'seu-email@exemplo.com' pelo email do usuário que você quer tornar admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';

-- 5. Verificar se a atualização foi bem-sucedida
SELECT email, role, full_name, created_at 
FROM public.profiles 
WHERE role = 'admin';

-- 6. Criar políticas RLS para permitir que admins acessem todos os dados
-- Política para profiles (admins podem ver todos os perfis)
CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para workspaces (admins podem ver todos os workspaces)
CREATE POLICY IF NOT EXISTS "Admins can view all workspaces"
ON public.workspaces FOR SELECT
USING (
  owner_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para links (admins podem ver todos os links)
CREATE POLICY IF NOT EXISTS "Admins can view all links"
ON public.links FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para clicks (admins podem ver todos os cliques)
CREATE POLICY IF NOT EXISTS "Admins can view all clicks"
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

-- 7. Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'workspaces', 'links', 'clicks')
AND policyname LIKE '%admin%';

-- 8. Mostrar estatísticas básicas
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderator_users,
  COUNT(CASE WHEN subscription_tier = 'pro' THEN 1 END) as pro_users
FROM public.profiles; 