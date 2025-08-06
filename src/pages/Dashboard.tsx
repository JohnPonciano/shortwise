
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, Plus, Link2, BarChart3, Settings, Smartphone, Edit, QrCode } from 'lucide-react';
import { SimpleLinkForm } from '@/components/SimpleLinkForm';
import AdvancedLinkForm from '@/components/LinkFeatures/AdvancedLinkForm';
import PlatformDetectionTest from '@/components/LinkFeatures/PlatformDetectionTest';
import QRCodeGenerator from '@/components/LinkFeatures/QRCodeGenerator';
import { supabase } from '@/integrations/supabase/client';
import { LoadingState } from '@/components/LoadingState';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('simple');
  const [editingLink, setEditingLink] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedLinkForQR, setSelectedLinkForQR] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
    loadLinks();
  }, [user, navigate]);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading links:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout',
        variant: 'destructive',
      });
    }
  };

  const handleLinkCreated = (newLink: any) => {
    if (editingLink) {
      // Update existing link
      setLinks(prev => prev.map(link => link.id === editingLink.id ? newLink : link));
      setEditingLink(null);
      toast({
        title: 'Link atualizado!',
        description: `Link atualizado com sucesso`,
      });
    } else {
      // Add new link
      setLinks(prev => [newLink, ...prev]);
      toast({
        title: 'Link criado!',
        description: `Link disponível em: ${window.location.origin}/${newLink.short_slug}`,
      });
    }
    setShowForm(false);
  };

  const handleEditLink = (link: any) => {
    setEditingLink(link);
    setActiveTab('advanced');
    setShowForm(true);
  };

  const handleViewQRCode = (link: any) => {
    setSelectedLinkForQR(link);
    setQrDialogOpen(true);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="links" className="space-y-6">
          <TabsList>
            <TabsTrigger value="links">
              <Link2 className="w-4 h-4 mr-2" />
              Meus Links
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="deep-linking">
              <Smartphone className="w-4 h-4 mr-2" />
              Deep Linking
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Meus Links</h2>
                  <p className="text-muted-foreground">
                    Gerencie seus links encurtados
                  </p>
                </div>
                <Button onClick={() => {
                  setEditingLink(null);
                  setShowForm(!showForm);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Link
                </Button>
              </div>

              {showForm && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{editingLink ? 'Editar Link' : 'Criar Link'}</CardTitle>
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                          <TabsTrigger value="simple">Simples</TabsTrigger>
                          <TabsTrigger value="advanced">Avançado</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'simple' ? (
                      <SimpleLinkForm 
                        onSuccess={handleLinkCreated}
                        onCancel={() => {
                          setShowForm(false);
                          setEditingLink(null);
                        }}
                        initialData={editingLink}
                      />
                    ) : (
                      <AdvancedLinkForm 
                        onSubmit={handleLinkCreated}
                        loading={loading}
                        initialData={editingLink}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Lista de Links */}
              <div className="grid gap-4">
                {links.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Nenhum link criado ainda
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Crie seu primeiro link encurtado
                      </p>
                      <Button onClick={() => setShowForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar primeiro link
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  links.map((link: any) => (
                    <Card key={link.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">
                              {link.title || 'Link sem título'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <a 
                                href={`${window.location.origin}/${link.short_slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-mono"
                              >
                                {window.location.origin}/{link.short_slug}
                              </a>
                              <Badge variant={link.is_active ? "default" : "secondary"}>
                                {link.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                              {link.qr_code_enabled && (
                                <Badge variant="outline">QR Code</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {link.original_url}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="text-right text-sm text-muted-foreground mr-4">
                              <div>{link.click_count || 0} cliques</div>
                              <div>{new Date(link.created_at).toLocaleDateString()}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLink(link)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {link.qr_code_enabled && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewQRCode(link)}
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Acompanhe o desempenho dos seus links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Analytics em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deep-linking">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Deep Linking Inteligente
                  </CardTitle>
                  <CardDescription>
                    Configure redirecionamentos específicos por plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PlatformDetectionTest />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Gerencie suas preferências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configurações em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedLinkForQR?.title || 'Link'}</DialogTitle>
          </DialogHeader>
          {selectedLinkForQR && (
            <QRCodeGenerator
              shortUrl={`${window.location.origin}/${selectedLinkForQR.short_slug}`}
              linkTitle={selectedLinkForQR.title}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
