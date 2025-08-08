
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building, Plus, Edit, Trash2, Users, Settings } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  description: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export default function WorkspaceManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
  });

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
        .eq('owner_id', user?.id);

      if (ownedError) throw ownedError;

      // Load member workspaces
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspaces(*)')
        .eq('user_id', user?.id)
        .neq('workspaces.owner_id', user?.id);

      if (memberError) throw memberError;

      const memberWorkspacesList = memberWorkspaces?.map(m => m.workspaces).filter(Boolean) || [];

      // Get member counts for all workspaces
      const allWorkspaceIds = [...(ownedWorkspaces || []), ...memberWorkspacesList].map(w => w.id);
      
      const { data: memberCounts, error: countError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .in('workspace_id', allWorkspaceIds);

      if (countError) throw countError;

      const counts = memberCounts?.reduce((acc, member) => {
        acc[member.workspace_id] = (acc[member.workspace_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const allWorkspaces = [...(ownedWorkspaces || []), ...memberWorkspacesList].map(workspace => ({
        ...workspace,
        member_count: counts[workspace.id] || 0
      }));

      setWorkspaces(allWorkspaces);
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

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: formData.name,
          description: formData.description,
          slug: formData.slug,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setWorkspaces(prev => [...prev, { ...data, member_count: 1 }]);
      setShowCreateDialog(false);
      setFormData({ name: '', description: '', slug: '' });
      
      toast({
        title: 'Workspace criado!',
        description: 'Seu novo workspace foi criado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspace) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          name: formData.name,
          description: formData.description,
          slug: formData.slug,
        })
        .eq('id', editingWorkspace.id);

      if (error) throw error;

      setWorkspaces(prev => 
        prev.map(ws => 
          ws.id === editingWorkspace.id 
            ? { ...ws, ...formData }
            : ws
        )
      );
      
      setEditingWorkspace(null);
      setFormData({ name: '', description: '', slug: '' });
      
      toast({
        title: 'Workspace atualizado!',
        description: 'As informações do workspace foram atualizadas.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este workspace? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;

      setWorkspaces(prev => prev.filter(ws => ws.id !== workspaceId));
      
      toast({
        title: 'Workspace excluído',
        description: 'O workspace foi excluído permanentemente.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setFormData({
      name: workspace.name,
      description: workspace.description,
      slug: workspace.slug,
    });
  };

  const isOwner = (workspace: Workspace) => workspace.owner_id === user?.id;

  if (loading) {
    return <div className="flex justify-center p-8">Carregando workspaces...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Team Workspaces
              </CardTitle>
              <CardDescription>
                Organize seus links em workspaces e colabore com sua equipe
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Workspace
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workspaces.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum workspace encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro workspace para organizar seus links e colaborar com sua equipe
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Workspace
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{workspace.name}</h3>
                      <Badge variant="outline">{workspace.slug}</Badge>
                      {isOwner(workspace) && (
                        <Badge variant="default">Proprietário</Badge>
                      )}
                      {!isOwner(workspace) && (
                        <Badge variant="secondary">Membro</Badge>
                      )}
                    </div>
                    {workspace.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {workspace.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {workspace.member_count} membros
                      </span>
                      <span>
                        Criado em {new Date(workspace.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner(workspace) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(workspace)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Navigate to workspace settings */}}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Workspace Dialog */}
      <Dialog open={showCreateDialog || !!editingWorkspace} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingWorkspace(null);
          setFormData({ name: '', description: '', slug: '' });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWorkspace ? 'Editar Workspace' : 'Novo Workspace'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingWorkspace ? handleUpdateWorkspace : handleCreateWorkspace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Workspace</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Minha Empresa"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (identificador único)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.replace(/[^a-zA-Z0-9-_]/g, '') }))}
                placeholder="minha-empresa"
                required
              />
              <p className="text-sm text-muted-foreground">
                Apenas letras, números, hífens e underscores
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Workspace para organizar os links da empresa"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingWorkspace(null);
                  setFormData({ name: '', description: '', slug: '' });
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingWorkspace ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
