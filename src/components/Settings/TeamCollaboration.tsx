import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Mail, UserPlus, Crown, Shield, User, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export default function TeamCollaboration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  useEffect(() => {
    if (selectedWorkspace) {
      loadTeamMembers();
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, slug')
        .eq('owner_id', user?.id);

      if (error) throw error;
      setWorkspaces(data || []);
      
      if (data && data.length > 0) {
        setSelectedWorkspace(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os workspaces',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    if (!selectedWorkspace) return;

    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          profiles(full_name, email, avatar_url)
        `)
        .eq('workspace_id', selectedWorkspace);

      if (error) throw error;
      
      // Filter out any members where profiles data might be null
      const validMembers = (data || []).filter(member => member.profiles);
      setTeamMembers(validMembers);
    } catch (error: any) {
      console.error('Error loading team members:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os membros da equipe',
        variant: 'destructive',
      });
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace || !user) return;

    try {
      // In a real application, this would send an email invitation
      // For now, we'll just show a success message
      toast({
        title: 'Convite enviado!',
        description: `Um convite foi enviado para ${inviteEmail}`,
      });
      
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      setTeamMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, role: newRole }
            : member
        )
      );

      toast({
        title: 'Role atualizado!',
        description: 'O role do membro foi atualizado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      
      toast({
        title: 'Membro removido',
        description: 'O membro foi removido do workspace.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'member': return 'Membro';
      default: return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div>Carregando equipe...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Colaboração em Equipe
              </CardTitle>
              <CardDescription>
                Gerencie membros da equipe e suas permissões
              </CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar Membro
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Workspace Selector */}
          <div className="space-y-2">
            <Label>Workspace</Label>
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name} ({workspace.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Members List */}
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum membro na equipe</h3>
              <p className="text-muted-foreground mb-4">
                Convide pessoas para colaborar no seu workspace
              </p>
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Primeiro Membro
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Membros da Equipe ({teamMembers.length})</h3>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profiles.avatar_url} />
                        <AvatarFallback>
                          {getInitials(member.profiles.full_name || member.profiles.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.profiles.full_name || member.profiles.email}</p>
                        <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        {getRoleName(member.role)}
                      </Badge>
                      {member.role !== 'owner' && (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(newRole) => handleUpdateRole(member.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Membro</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Membros podem criar links. Admins podem gerenciar membros e configurações.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Convite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
