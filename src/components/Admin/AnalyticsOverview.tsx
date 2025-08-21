import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  Link, 
  MousePointer,
  Globe,
  Smartphone,
  Monitor,
  Calendar
} from 'lucide-react';

interface AnalyticsData {
  totalClicks: number;
  totalLinks: number;
  totalUsers: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  topCountries: Array<{ country: string; clicks: number }>;
  topDevices: Array<{ device: string; clicks: number }>;
  topBrowsers: Array<{ browser: string; clicks: number }>;
  clicksByDay: Array<{ date: string; clicks: number }>;
  topReferrers: Array<{ referer: string; clicks: number }>;
  averageClicksPerLink: number;
}

export default function AnalyticsOverview() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalClicks: 0,
    totalLinks: 0,
    totalUsers: 0,
    clicksToday: 0,
    clicksThisWeek: 0,
    clicksThisMonth: 0,
    topCountries: [],
    topDevices: [],
    topBrowsers: [],
    clicksByDay: [],
    topReferrers: [],
    averageClicksPerLink: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Buscar dados básicos
      const [
        { count: totalClicks },
        { count: totalLinks },
        { count: totalUsers },
        { data: clicksToday },
        { data: clicksThisWeek },
        { data: clicksThisMonth },
        { data: allClicks }
      ] = await Promise.all([
        supabase.from('clicks').select('*', { count: 'exact', head: true }),
        supabase.from('links').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('clicks').select('*').gte('clicked_at', new Date().toISOString().split('T')[0]),
        supabase.from('clicks').select('*').gte('clicked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('clicks').select('*').gte('clicked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('clicks').select('*')
      ]);

      // Processar dados de países
      const countryCounts = allClicks?.reduce((acc, click) => {
        const country = click.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const processedCountries = Object.entries(countryCounts)
        .map(([country, clicks]) => ({ country, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      // Processar dados de dispositivos
      const deviceCounts = allClicks?.reduce((acc, click) => {
        const device = click.device_type || 'Unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const processedDevices = Object.entries(deviceCounts)
        .map(([device, clicks]) => ({ device, clicks }))
        .sort((a, b) => b.clicks - a.clicks);

      // Processar dados de navegadores
      const browserCounts = allClicks?.reduce((acc, click) => {
        const browser = click.browser || 'Unknown';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const processedBrowsers = Object.entries(browserCounts)
        .map(([browser, clicks]) => ({ browser, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 4);

      // Processar dados por dia (últimos 7 dias)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const clicksByDay = allClicks?.filter(click => 
        new Date(click.clicked_at) >= sevenDaysAgo
      ) || [];
      
      const dayCounts = clicksByDay.reduce((acc, click) => {
        const date = new Date(click.clicked_at).toLocaleDateString('pt-BR');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const processedClicksByDay = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
        return {
          date,
          clicks: dayCounts[date] || 0
        };
      }).reverse();

      // Processar dados de referrers
      const referrerCounts = allClicks?.reduce((acc, click) => {
        const referer = click.referer || 'Direct';
        acc[referer] = (acc[referer] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const processedReferrers = Object.entries(referrerCounts)
        .map(([referer, clicks]) => ({ referer, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5);

      // Calcular média de cliques por link
      const averageClicksPerLink = totalLinks > 0 ? (totalClicks || 0) / totalLinks : 0;

      setAnalytics({
        totalClicks: totalClicks || 0,
        totalLinks: totalLinks || 0,
        totalUsers: totalUsers || 0,
        clicksToday: clicksToday?.length || 0,
        clicksThisWeek: clicksThisWeek?.length || 0,
        clicksThisMonth: clicksThisMonth?.length || 0,
        topCountries: processedCountries,
        topDevices: processedDevices,
        topBrowsers: processedBrowsers,
        clicksByDay: processedClicksByDay,
        topReferrers: processedReferrers,
        averageClicksPerLink
      });
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de analytics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'tablet': return <Smartphone className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics da Plataforma</h2>
          <p className="text-muted-foreground">
            Visão geral dos dados e métricas da plataforma
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.clicksToday} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Links Criados</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLinks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Média de {(analytics.totalClicks / Math.max(analytics.totalLinks, 1)).toFixed(1)} cliques por link
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.clicksThisWeek} cliques esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Cliques</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.averageClicksPerLink.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cliques por link criado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Top Países
            </CardTitle>
            <CardDescription>Países com mais cliques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCountries.map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{country.country}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {country.clicks.toLocaleString()} cliques
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Dispositivos
            </CardTitle>
            <CardDescription>Distribuição por tipo de dispositivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topDevices.map((device) => (
                <div key={device.device} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(device.device)}
                    <span className="font-medium capitalize">{device.device}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {device.clicks.toLocaleString()} cliques
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Navegadores
            </CardTitle>
            <CardDescription>Navegadores mais utilizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topBrowsers.map((browser) => (
                <div key={browser.browser} className="flex items-center justify-between">
                  <span className="font-medium">{browser.browser}</span>
                  <span className="text-sm text-muted-foreground">
                    {browser.clicks.toLocaleString()} cliques
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Cliques nos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.clicksByDay.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="font-medium">{day.date}</span>
                  <span className="text-sm text-muted-foreground">
                    {day.clicks.toLocaleString()} cliques
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Top Referrers
            </CardTitle>
            <CardDescription>Principais fontes de tráfego</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topReferrers.map((referer) => (
                <div key={referer.referer} className="flex items-center justify-between">
                  <span className="font-medium truncate max-w-[200px]" title={referer.referer}>
                    {referer.referer}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {referer.clicks.toLocaleString()} cliques
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 