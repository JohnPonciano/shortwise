-- SOLUÇÃO DEFINITIVA - Desabilitar RLS completamente
-- Execute este script no SQL Editor do Supabase Dashboard
-- ATENÇÃO: Isso remove toda a segurança de dados, use apenas para desenvolvimento

-- 1. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view their own links" ON public.links;
DROP POLICY IF EXISTS "Users can create their own links" ON public.links;
DROP POLICY IF EXISTS "Users can update their own links" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.links;
DROP POLICY IF EXISTS "Users can view clicks on their links" ON public.clicks;
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.clicks;
DROP POLICY IF EXISTS "User can manage own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Creators can manage their invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Users can view invites by email" ON public.workspace_invites;
DROP POLICY IF EXISTS "Public can validate by token" ON public.workspace_invites;

-- 2. Remover políticas de admin
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
DROP POLICY IF EXISTS "Simple access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Simple access to workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Simple access to links" ON public.links;
DROP POLICY IF EXISTS "Simple access to clicks" ON public.clicks;
DROP POLICY IF EXISTS "Simple access to notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Simple access to workspace invites" ON public.workspace_invites;

-- 3. Remover funções problemáticas
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS get_user_role();

-- 4. Desabilitar RLS em todas as tabelas
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites DISABLE ROW LEVEL SECURITY;

-- 5. Verificar se RLS foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'workspaces', 'links', 'clicks', 'notification_settings', 'workspace_invites')
AND schemaname = 'public';

-- 6. Verificar se não há mais políticas
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

-- 9. Testar consulta específica que estava dando erro
SELECT * FROM public.profiles WHERE user_id = '5566f386-d002-4cb8-a6cd-8ff1f3f534d0';

-- 10. MENSAGEM IMPORTANTE
-- Agora o RLS está completamente desabilitado
-- Isso significa que qualquer usuário autenticado pode acessar todos os dados
-- Para reativar a segurança, execute o script de reativação quando necessário 