
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SimpleLinkForm } from '@/components/SimpleLinkForm';
import { Plus, Link, BarChart3, Copy, ExternalLink, Settings, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Link {
  id: string;
  original_url: string;
  short_slug: string;
  title?: string;
  click_count: number;
  created_at: string;
  qr_code_enabled: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  const fetchLinks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCreated = (newLink: Link) => {
    setLinks(prev => [newLink, ...prev]);
    setShowCreateForm(false);
    toast({
      title: 'Link criado!',
      description: 'Seu link foi criado com sucesso.',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Link copiado para a área de transferência.',
    });
  };

  const getShortUrl = (slug: string) => {
    return `${window.location.origin}/${slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">Shortwise</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{links.length}</p>
                  <p className="text-sm text-muted-foreground">Links Criados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">
                    {links.reduce((sum, link) => sum + link.click_count, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total de Cliques</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-sm text-muted-foreground">Workspace Ativo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Link Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Novo Link
                </CardTitle>
                <CardDescription>
                  Transforme URLs longas em links curtos e personalizados
                </CardDescription>
              </div>
              {!showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Link
                </Button>
              )}
            </div>
          </CardHeader>
          {showCreateForm && (
            <CardContent>
              <SimpleLinkForm
                onSuccess={handleLinkCreated}
                onCancel={() => setShowCreateForm(false)}
              />
            </CardContent>
          )}
        </Card>

        {/* Links List */}
        <Card>
          <CardHeader>
            <CardTitle>Seus Links</CardTitle>
            <CardDescription>
              Gerencie e monitore todos os seus links encurtados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <div className="text-center py-12">
                <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum link ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro link encurtado para começar
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {link.title || 'Link sem título'}
                        </h3>
                        {link.qr_code_enabled && (
                          <Badge variant="secondary" className="text-xs">
                            QR
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-primary font-mono mb-1">
                        {getShortUrl(link.short_slug)}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {link.original_url}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {link.click_count} cliques
                        </span>
                        <span>
                          {new Date(link.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(getShortUrl(link.short_slug))}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getShortUrl(link.short_slug), '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
