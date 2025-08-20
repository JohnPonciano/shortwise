
-- Criar tabela para convites de workspace
CREATE TABLE public.workspace_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_by UUID NOT NULL,
  accepted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Adicionar índices para performance
CREATE INDEX idx_workspace_invites_token ON public.workspace_invites(token);
CREATE INDEX idx_workspace_invites_workspace_id ON public.workspace_invites(workspace_id);
CREATE INDEX idx_workspace_invites_email ON public.workspace_invites(email);

-- Habilitar RLS
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Política para criação de convites (apenas proprietários de workspace)
CREATE POLICY "Workspace owners can create invites" ON public.workspace_invites
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  )
);

-- Política para visualização de convites (proprietários e convidados)
CREATE POLICY "Users can view relevant invites" ON public.workspace_invites
FOR SELECT USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  ) OR 
  email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()) OR
  auth.uid() = accepted_by
);

-- Política para atualização de convites (para aceitar convites)
CREATE POLICY "Users can accept their own invites" ON public.workspace_invites
FOR UPDATE USING (
  email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()) OR
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  )
);

-- Política para deletar convites (apenas proprietários)
CREATE POLICY "Workspace owners can delete invites" ON public.workspace_invites
FOR DELETE USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
  )
);
