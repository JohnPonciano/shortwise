import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Building, 
  BarChart3, 
  Shield, 
  Crown, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Eye,
  Settings,
  Database,
  Zap
} from 'lucide-react';
import UserManagement from '@/components/Admin/UserManagement';
import WorkspaceManagement from '@/components/Admin/WorkspaceManagement';
import AnalyticsOverview from '@/components/Admin/AnalyticsOverview';
import SystemHealth from '@/components/Admin/SystemHealth';

interface AdminStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalLinks: number;
  totalClicks: number;
  proUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  newWorkspacesThisMonth: number;
  newUsersToday: number;
  newLinksToday: number;
  clicksToday: number;
  proUpgradesToday: number;
}

export default function Admin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalWorkspaces: 0,
    totalLinks: 0,
    totalClicks: 0,
    proUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    newWorkspacesThisMonth: 0,
    newUsersToday: 0,
    newLinksToday: 0,
    clicksToday: 0,
    proUpgradesToday: 0,
  });

  useEffect(() => {
    // Verificar se o usuário é admin
    if (!user || profile?.role !== 'admin') {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para acessar esta área.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    loadStats();
  }, [user, profile]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Calcular datas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthISO = thisMonth.toISOString();
      
      // Buscar estatísticas gerais
      const [
        { count: totalUsers },
        { count: totalWorkspaces },
        { count: totalLinks },
        { count: totalClicks },
        { count: proUsers },
        { count: activeUsers },
        { count: newUsersThisMonth },
        { count: newWorkspacesThisMonth },
        { count: newUsersToday },
        { count: newLinksToday },
        { count: clicksToday },
        { data: proUpgradesToday }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('workspaces').select('*', { count: 'exact', head: true }),
        supabase.from('links').select('*', { count: 'exact', head: true }),
        supabase.from('clicks').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthISO),
        supabase.from('workspaces').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthISO),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('links').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', todayISO),
        supabase.from('profiles').select('*').eq('subscription_tier', 'pro').gte('updated_at', todayISO),
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        totalWorkspaces: totalWorkspaces || 0,
        totalLinks: totalLinks || 0,
        totalClicks: totalClicks || 0,
        proUsers: proUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        newWorkspacesThisMonth: newWorkspacesThisMonth || 0,
        newUsersToday: newUsersToday || 0,
        newLinksToday: newLinksToday || 0,
        clicksToday: clicksToday || 0,
        proUpgradesToday: proUpgradesToday?.length || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h1 className="text-2xl font-bold">Painel de Administração</h1>
                <Badge variant="secondary" className="ml-2">Admin</Badge>
              </div>
            </div>
            <Button onClick={loadStats} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newUsersThisMonth} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Pro</CardTitle>
              <Crown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.proUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalUsers > 0 ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Links</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLinks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalClicks.toLocaleString()} cliques totais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkspaces.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newWorkspacesThisMonth} este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Workspaces
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Atividade Recente
                  </CardTitle>
                  <CardDescription>Últimas atividades do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Novos usuários hoje</span>
                      <Badge variant="secondary">+{stats.newUsersToday}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Links criados hoje</span>
                      <Badge variant="secondary">+{stats.newLinksToday}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cliques hoje</span>
                      <Badge variant="secondary">+{stats.clicksToday}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Upgrades para Pro</span>
                      <Badge variant="default">+{stats.proUpgradesToday}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Alertas do Sistema
                  </CardTitle>
                  <CardDescription>Problemas e notificações importantes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.totalUsers > 0 && stats.activeUsers < stats.totalUsers * 0.8 && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium">Usuários inativos</p>
                          <p className="text-xs text-muted-foreground">
                            {stats.totalUsers - stats.activeUsers} usuários não acessaram há 30 dias
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {stats.proUsers > 0 && stats.proUsers < stats.totalUsers * 0.1 && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Crown className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Baixa conversão Pro</p>
                          <p className="text-xs text-muted-foreground">
                            Apenas {((stats.proUsers / stats.totalUsers) * 100).toFixed(1)}% dos usuários são Pro
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Zap className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Sistema estável</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.totalUsers} usuários ativos • {stats.totalLinks} links criados • {stats.totalClicks} cliques totais
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="workspaces">
            <WorkspaceManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsOverview />
          </TabsContent>

          <TabsContent value="system">
            <SystemHealth />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 