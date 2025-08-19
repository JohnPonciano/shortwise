
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Workspace {
  id: string;
  name: string;
  description: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export function useWorkspaces() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  const loadWorkspaces = async () => {
    try {
      // Load owned workspaces
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Load member workspaces
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspaces(*)')
        .eq('user_id', user?.id);

      if (memberError) throw memberError;

      const memberWorkspacesList = memberWorkspaces?.map(m => m.workspaces).filter(Boolean) || [];
      
      // Combine all workspaces
      const allWorkspaces = [...(ownedWorkspaces || []), ...memberWorkspacesList];
      
      setWorkspaces(allWorkspaces);
      
      // Set current workspace to first one if none selected
      if (allWorkspaces.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(allWorkspaces[0]);
      }
    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os workspaces',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (data: { name: string; description?: string; slug: string }) => {
    try {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          name: data.name,
          description: data.description,
          slug: data.slug,
          owner_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setWorkspaces(prev => [workspace, ...prev]);
      setCurrentWorkspace(workspace);
      
      toast({
        title: 'Workspace criado!',
        description: 'Seu novo workspace foi criado com sucesso.',
      });

      return workspace;
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    loading,
    createWorkspace,
    refetch: loadWorkspaces,
  };
}
