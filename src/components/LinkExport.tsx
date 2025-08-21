
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces } from '@/hooks/useWorkspaces';

interface LinkExportProps {
  links: any[];
}

interface ExportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  minClicks?: number;
  maxClicks?: number;
  status?: 'all' | 'active' | 'inactive' | 'expired';
  hasPassword?: 'all' | 'yes' | 'no';
  hasQR?: 'all' | 'yes' | 'no';
  searchTerm?: string;
}

export function LinkExport({ links }: LinkExportProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaces();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    status: 'all',
    hasPassword: 'all',
    hasQR: 'all',
  });

  const applyFilters = (links: any[]) => {
    return links.filter(link => {
      // Filtro por data
      if (filters.dateFrom || filters.dateTo) {
        const linkDate = new Date(link.created_at);
        if (filters.dateFrom && linkDate < filters.dateFrom) return false;
        if (filters.dateTo && linkDate > filters.dateTo) return false;
      }

      // Filtro por cliques
      if (filters.minClicks !== undefined && link.click_count < filters.minClicks) return false;
      if (filters.maxClicks !== undefined && link.click_count > filters.maxClicks) return false;

      // Filtro por status
      if (filters.status !== 'all') {
        const now = new Date();
        const isExpired = link.expires_at && new Date(link.expires_at) < now;
        
        switch (filters.status) {
          case 'active':
            if (!link.is_active || isExpired) return false;
            break;
          case 'inactive':
            if (link.is_active && !isExpired) return false;
            break;
          case 'expired':
            if (!isExpired) return false;
            break;
        }
      }

      // Filtro por proteção por senha
      if (filters.hasPassword !== 'all') {
        const hasPassword = link.password_protected;
        if (filters.hasPassword === 'yes' && !hasPassword) return false;
        if (filters.hasPassword === 'no' && hasPassword) return false;
      }

      // Filtro por QR Code
      if (filters.hasQR !== 'all') {
        const hasQR = link.qr_code_enabled;
        if (filters.hasQR === 'yes' && !hasQR) return false;
        if (filters.hasQR === 'no' && hasQR) return false;
      }

      // Filtro por termo de busca
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesTitle = link.title?.toLowerCase().includes(term);
        const matchesUrl = link.original_url?.toLowerCase().includes(term);
        const matchesSlug = link.short_slug?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesUrl && !matchesSlug) return false;
      }

      return true;
    });
  };

  const exportToCSV = async () => {
    if (!user || !currentWorkspace) {
      toast({
        title: 'Erro',
        description: 'Usuário ou workspace não encontrado',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar dados completos dos links com analytics
      const { data: fullLinks, error } = await supabase
        .from('links')
        .select(`
          *,
          clicks (
            id,
            clicked_at,
            ip_address,
            device_type,
            browser,
            os,
            country,
            city,
            referer
          )
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aplicar filtros
      const filteredLinks = applyFilters(fullLinks || []);

      if (filteredLinks.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhum link encontrado com os filtros aplicados',
        });
        return;
      }

      // Preparar dados para CSV
      const csvData = filteredLinks.map(link => {
        const lastClick = link.clicks?.[0]?.clicked_at;
        const uniqueCountries = [...new Set(link.clicks?.map((c: any) => c.country).filter(Boolean))];
        const topBrowser = getMostFrequent(link.clicks?.map((c: any) => c.browser).filter(Boolean));

        return {
          'Título': link.title || '',
          'URL Original': link.original_url,
          'Slug': link.short_slug,
          'URL Curta': `${window.location.origin}/${link.short_slug}`,
          'Cliques': link.click_count,
          'Status': link.is_active ? 'Ativo' : 'Inativo',
          'Criado em': format(new Date(link.created_at), 'dd/MM/yyyy HH:mm'),
          'Último Clique': lastClick ? format(new Date(lastClick), 'dd/MM/yyyy HH:mm') : 'Nunca',
          'Protegido por Senha': link.password_protected ? 'Sim' : 'Não',
          'QR Code': link.qr_code_enabled ? 'Sim' : 'Não',
          'Expira em': link.expires_at ? format(new Date(link.expires_at), 'dd/MM/yyyy HH:mm') : '',
          'Países': uniqueCountries.join(', '),
          'Navegador Principal': topBrowser || '',
          'Tags': link.tags?.join(', ') || '',
          'UTM Source': link.utm_source || '',
          'UTM Medium': link.utm_medium || '',
          'UTM Campaign': link.utm_campaign || '',
        };
      });

      // Converter para CSV
      const csvContent = convertToCSV(csvData);
      
      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `links-${currentWorkspace.name}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Sucesso!',
        description: `${filteredLinks.length} links exportados com sucesso`,
      });

      setIsOpen(false);
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar dados: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMostFrequent = (arr: string[]) => {
    if (!arr.length) return null;
    const frequency: { [key: string]: number } = {};
    arr.forEach(item => frequency[item] = (frequency[item] || 0) + 1);
    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escapar aspas e envolver em aspas se necessário
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const filteredCount = applyFilters(links).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Links para CSV
          </DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros de Exportação
            </CardTitle>
            <CardDescription>
              Configure os filtros para exportar apenas os dados desejados.
              {filteredCount < links.length && (
                <span className="block mt-1 text-primary font-medium">
                  {filteredCount} de {links.length} links serão exportados
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Busca */}
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Buscar por título, URL ou slug</Label>
              <Input
                id="searchTerm"
                placeholder="Digite para filtrar..."
                value={filters.searchTerm || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>

            {/* Cliques */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minClicks">Mín. de Cliques</Label>
                <Input
                  id="minClicks"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.minClicks || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, minClicks: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxClicks">Máx. de Cliques</Label>
                <Input
                  id="maxClicks"
                  type="number"
                  min="0"
                  placeholder="Sem limite"
                  value={filters.maxClicks || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxClicks: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
            </div>

            {/* Filtros categóricos */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="expired">Expirados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Com Senha</Label>
                <Select value={filters.hasPassword} onValueChange={(value: any) => setFilters(prev => ({ ...prev, hasPassword: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                    <SelectItem value="no">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Com QR Code</Label>
                <Select value={filters.hasQR} onValueChange={(value: any) => setFilters(prev => ({ ...prev, hasQR: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                    <SelectItem value="no">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={exportToCSV} disabled={loading || filteredCount === 0}>
            {loading ? 'Exportando...' : `Exportar ${filteredCount} links`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
