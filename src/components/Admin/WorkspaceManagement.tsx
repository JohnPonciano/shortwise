import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building, 
  Search, 
  MoreHorizontal, 
  Users, 
  Link, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  slug: string;
  created_at: string;
  updated_at: string;
  owner?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  links_count?: number;
  members_count?: number;
}

export default function WorkspaceManagement() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showWorkspaceDetails, setShowWorkspaceDetails] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      
      // Buscar workspaces
      const { data: workspacesData, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos proprietários
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url');

      // Buscar todos os links para contar por workspace
      const { data: allLinks } = await supabase
        .from('links')
        .select('workspace_id');

      // Processar dados
      const processedWorkspaces = workspacesData?.map(workspace => {
        const owner = profilesData?.find(p => p.user_id === workspace.owner_id);
        const linksCount = allLinks?.filter(l => l.workspace_id === workspace.id).length || 0;
        
        return {
          ...workspace,
          owner: owner ? {
            full_name: owner.full_name,
            email: owner.email,
            avatar_url: owner.avatar_url
          } : null,
          links_count: linksCount,
          members_count: 1, // Por enquanto, apenas o proprietário
        };
      }) || [];

      setWorkspaces(processedWorkspaces);
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os workspaces.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workspace.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workspace.owner?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Workspaces</h2>
          <p className="text-muted-foreground">
            Gerencie todos os workspaces da plataforma
          </p>
        </div>
        <Button onClick={loadWorkspaces} disabled={loading}>
          <Building className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar workspaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workspaces List */}
      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>
            Lista completa de workspaces criados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={workspace.owner?.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(workspace.owner?.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{workspace.name}</h3>
                        <Badge variant="outline">{workspace.slug}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {workspace.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          <Link className="w-3 h-3 inline mr-1" />
                          {workspace.links_count} links
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <Users className="w-3 h-3 inline mr-1" />
                          {workspace.members_count} membros
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(workspace.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">{workspace.owner?.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground">{workspace.owner?.email}</p>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWorkspace(workspace)}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Gerenciar Workspace</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={workspace.owner?.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(workspace.owner?.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{workspace.name}</h3>
                              <p className="text-sm text-muted-foreground">{workspace.slug}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm">
                              <strong>Descrição:</strong> {workspace.description || 'Sem descrição'}
                            </p>
                            <p className="text-sm">
                              <strong>Proprietário:</strong> {workspace.owner?.full_name} ({workspace.owner?.email})
                            </p>
                            <p className="text-sm">
                              <strong>Criado em:</strong> {new Date(workspace.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedWorkspace(workspace);
                                setShowWorkspaceDetails(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workspace Details Dialog */}
      <Dialog open={showWorkspaceDetails} onOpenChange={setShowWorkspaceDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Workspace</DialogTitle>
          </DialogHeader>
          {selectedWorkspace && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedWorkspace.owner?.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">{getInitials(selectedWorkspace.owner?.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedWorkspace.name}</h3>
                  <p className="text-muted-foreground">{selectedWorkspace.slug}</p>
                  <p className="text-sm mt-1">{selectedWorkspace.description || 'Sem descrição'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Estatísticas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Links criados:</span>
                      <span className="font-medium">{selectedWorkspace.links_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Membros:</span>
                      <span className="font-medium">{selectedWorkspace.members_count}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Informações</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Proprietário:</span>
                      <span className="font-medium">{selectedWorkspace.owner?.full_name || 'Sem nome'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{selectedWorkspace.owner?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Criado em:</span>
                      <span className="font-medium">
                        {new Date(selectedWorkspace.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Última atualização:</span>
                      <span className="font-medium">
                        {new Date(selectedWorkspace.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 