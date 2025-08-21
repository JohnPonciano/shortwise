import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BarChart3, Globe, Link, MousePointerClick, Zap, Check, Crown } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Shortwise
          </h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            Plataforma Inteligente de Gestão de Links
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Encurte, Rastreie e Otimize Seus Links
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transforme suas URLs longas em links curtos e poderosos com analytics detalhados. 
            Perfeito para freelancers, agências e pequenas equipes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" onClick={() => navigate('/checkout?plan=pro')} className="shadow-glow">
              Começar Teste Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa para gerenciar links
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Recursos poderosos projetados para negócios modernos e profissionais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Link className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Encurtamento Inteligente</CardTitle>
              <CardDescription>
                Crie links curtos personalizados com slugs customizados ou gerados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Criação em lote</li>
                <li>• Controles de expiração</li>
                <li>• Proteção por senha</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Analytics Detalhados</CardTitle>
              <CardDescription>
                Acompanhe cliques, localização, dispositivos e muito mais em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Relatórios em tempo real</li>
                <li>• Análise geográfica</li>
                <li>• Exportação de dados</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Workspaces Organizados</CardTitle>
              <CardDescription>
                Organize seus links em workspaces separados para diferentes projetos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Múltiplos projetos</li>
                <li>• Colaboração em equipe</li>
                <li>• Controle de acesso</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Preços simples e transparentes
          </h2>
          <p className="text-xl text-muted-foreground">
            Comece grátis, faça upgrade quando precisar de mais
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gratuito</CardTitle>
                <Badge variant="secondary">Perfeito para testar</Badge>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">R$ 0</span>
                <span className="text-muted-foreground ml-2">/mês</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3" />
                  <span>Até 100 links por workspace</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3" />
                  <span>2 workspaces</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3" />
                  <span>Analytics básicos</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3" />
                  <span>QR codes</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-3" />
                  <span>Proteção por senha</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                Começar Grátis
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg ring-2 ring-primary relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Mais Popular
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Pro
                </CardTitle>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">R$ 19,90</span>
                <span className="text-muted-foreground ml-2">/mês</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-3" />
                  <span>Links ilimitados</span>
                </li>
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-3" />
                  <span>Workspaces ilimitados</span>
                </li>
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-3" />
                  <span>Analytics avançados</span>
                </li>
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-3" />
                  <span>Domínios customizados</span>
                </li>
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-3" />
                  <span>A/B testing</span>
                </li>
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-3" />
                  <span>API para desenvolvedores</span>
                </li>
                <li className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-3" />
                  <span>Exportação de dados</span>
                </li>
              </ul>
              <Button className="w-full shadow-glow" onClick={() => navigate('/checkout?plan=pro')}>
                Começar Teste Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                7 dias de teste grátis, depois R$ 19,90/mês
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Shortwise
            </h3>
            <p className="text-sm text-muted-foreground">
              Gestão inteligente de links para equipes modernas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
