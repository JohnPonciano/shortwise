import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Crown, 
  User, 
  Mail, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Shield,
  Ban,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro';
  subscription_active: boolean;
  subscription_end_date: string | null;
  role?: 'user' | 'admin' | 'moderator';
  created_at: string;
  updated_at: string;
  links_count?: number;
  workspaces_count?: number;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar todos os links para contar por usuário
      const { data: allLinks } = await supabase
        .from('links')
        .select('user_id');

      // Buscar todos os workspaces para contar por usuário
      const { data: allWorkspaces } = await supabase
        .from('workspaces')
        .select('owner_id');

      // Processar dados
      const processedUsers = usersData?.map(user => {
        const linksCount = allLinks?.filter(l => l.user_id === user.user_id).length || 0;
        const workspacesCount = allWorkspaces?.filter(w => w.owner_id === user.user_id).length || 0;
        
        return {
          ...user,
          links_count: linksCount,
          workspaces_count: workspacesCount,
          role: (user.role as 'user' | 'admin' | 'moderator') || 'user'
        };
      }) || [];

      setUsers(processedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesTier = filterTier === 'all' || user.subscription_tier === filterTier;
    
    return matchesSearch && matchesRole && matchesTier;
  });

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Role do usuário atualizada com sucesso.',
      });

      loadUsers(); // Recarregar dados
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o role do usuário.',
        variant: 'destructive',
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_active: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });

      loadUsers(); // Recarregar dados
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do usuário.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie todos os usuários da plataforma
          </p>
        </div>
        <Button onClick={loadUsers} disabled={loading}>
          <Users className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os roles</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground flex items-center justify-center">
              {filteredUsers.length} usuários encontrados
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            Lista completa de usuários registrados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.full_name || 'Sem nome'}</h3>
                        {user.role === 'admin' && <Badge variant="destructive">Admin</Badge>}
                        {user.role === 'moderator' && <Badge variant="secondary">Moderador</Badge>}
                        {user.subscription_tier === 'pro' && <Crown className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {user.links_count} links • {user.workspaces_count} workspaces
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={user.subscription_active ? "default" : "secondary"}>
                      {user.subscription_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant={user.subscription_tier === 'pro' ? "default" : "outline"}>
                      {user.subscription_tier === 'pro' ? "Pro" : "Free"}
                    </Badge>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Gerenciar Usuário</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{user.full_name || 'Sem nome'}</h3>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select
                              value={user.role || 'user'}
                              onValueChange={(value) => updateUserRole(user.user_id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="moderator">Moderador</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant={user.subscription_active ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleUserStatus(user.user_id, user.subscription_active)}
                            >
                              {user.subscription_active ? "Desativar" : "Ativar"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetails(true);
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

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">{getInitials(selectedUser.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.full_name || 'Sem nome'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedUser.subscription_tier === 'pro' ? "default" : "outline"}>
                      {selectedUser.subscription_tier === 'pro' ? "Pro" : "Free"}
                    </Badge>
                    <Badge variant={selectedUser.role === 'admin' ? "destructive" : "secondary"}>
                      {selectedUser.role || 'user'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Estatísticas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Links criados:</span>
                      <span className="font-medium">{selectedUser.links_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Workspaces:</span>
                      <span className="font-medium">{selectedUser.workspaces_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">
                        {selectedUser.subscription_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Informações</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Membro desde:</span>
                      <span className="font-medium">
                        {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Última atualização:</span>
                      <span className="font-medium">
                        {new Date(selectedUser.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {selectedUser.subscription_end_date && (
                      <div className="flex justify-between">
                        <span>Pro até:</span>
                        <span className="font-medium">
                          {new Date(selectedUser.subscription_end_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
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