import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { abacatePayClient } from '@/integrations/abacatepay/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, ArrowLeft, Check, Zap, QrCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('PIX');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerTaxId, setCustomerTaxId] = useState<string>('');
  const [customerCellphone, setCustomerCellphone] = useState<string>('');

  const plan = searchParams.get('plan');
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const getMethodDisplayName = (method: string) => {
    switch (method) {
      case 'PIX':
        return 'PIX';
      default:
        return 'PIX';
    }
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    toast({
      title: 'Método selecionado',
      description: `Você escolheu pagar com ${getMethodDisplayName(method)}`,
    });
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth?redirect=/checkout?plan=pro');
      return;
    }

    // Prefill dos dados do cliente
    setCustomerName(profile?.full_name || user.email || '');
    setCustomerEmail(user.email || '');

    // Debug: verificar se a API key está configurada
    console.log('Checkout - API Key configurada:', import.meta.env.VITE_ABACATEPAY_API_KEY ? 'Sim' : 'Não');
  }, [user, plan, profile]);

  const createBilling = async () => {
    if (!user || !profile) return;

    setLoading(true);

    try {
      console.log('Criando cobrança com método:', selectedMethod);
      
      const apiMethod = selectedMethod;
      const billing = await abacatePayClient.createSubscription({
        frequency: 'ONE_TIME',
        methods: [apiMethod],
        products: [
          {
            externalId: 'PRO-PLAN',
            name: 'Plano Pro - Shortwise',
            quantity: 1,
            price: 1990 // R$ 19,90 em centavos
          }
        ],
        returnUrl: `${window.location.origin}/settings?subscription=canceled`,
        completionUrl: `${window.location.origin}/dashboard?subscription=success`,
        customer: {
          email: customerEmail || user.email || '',
          name: customerName || profile.full_name || user.email || '',
          taxId: customerTaxId || '123.456.789-09',
          cellphone: customerCellphone || '(11) 4002-8922'
        },
        metadata: {
          user_id: user.id,
          plan: 'pro',
          subscription_type: 'monthly'
        },
      });

      console.log('Resposta do AbacatePay:', billing);

      // Guardar infos para pós-retorno (fallback local enquanto webhook não atualiza)
      try {
        const last = {
          id: billing?.id || billing?.data?.id,
          customerId: billing?.customer?.id || billing?.data?.customer?.id,
          status: billing?.status || billing?.data?.status,
          method: apiMethod,
        };
        localStorage.setItem('abacatepay_last_billing', JSON.stringify(last));
      } catch {}

      // Verificar se temos a URL de pagamento (pode estar em payment_url ou url)
      const paymentUrl = billing?.payment_url || billing?.url;
      
      if (!billing || !paymentUrl) {
        console.error('URL de pagamento não encontrada:', billing);
        toast({
          title: 'Erro',
          description: 'URL de pagamento não foi gerada. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Redirecionando para:', paymentUrl);
      
      // Redirecionar automaticamente para a página de pagamento
      window.location.href = paymentUrl;
    } catch (error: any) {
      console.error('Erro ao criar cobrança:', error);
      
      let errorMessage = 'Erro ao processar pagamento';
      
      if (error.message?.includes('API key')) {
        errorMessage = 'API key do AbacatePay não configurada. Verifique as variáveis de ambiente.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Erro de conexão com AbacatePay. Verifique sua internet.';
      } else if (error.message?.includes('403')) {
        errorMessage = 'Seu ambiente não está habilitado para este método. Tente outro método (ex.: PIX).';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user || !profile) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return;
    }

    // Validações mínimas de cliente
    if (!customerName || !customerEmail || !customerTaxId || !customerCellphone) {
      toast({
        title: 'Dados do cliente',
        description: 'Preencha Nome, Email, CPF e Celular para continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedMethod) {
      toast({
        title: 'Método de pagamento',
        description: 'Por favor, selecione um método de pagamento',
        variant: 'destructive',
      });
      return;
    }

    // Criar cobrança e redirecionar
    await createBilling();
  };

  const handleCancel = () => {
    navigate(returnUrl);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Shortwise
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Plano Pro Card */}
          <Card className="border-0 shadow-lg ring-2 ring-primary relative mb-8">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Mais Popular
              </Badge>
            </div>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-yellow-500 mr-2" />
                <CardTitle className="text-2xl">Plano Pro</CardTitle>
              </div>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold">R$ 19,90</span>
                <span className="text-muted-foreground ml-2">/mês</span>
              </div>
              <Badge variant="secondary" className="mt-2">
                7 dias de teste grátis
              </Badge>
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
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Nome</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Seu nome completo" />
                </div>
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="seuemail@exemplo.com" />
                </div>
                <div>
                  <Label className="text-sm">CPF</Label>
                  <Input value={customerTaxId} onChange={(e) => setCustomerTaxId(e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label className="text-sm">Celular</Label>
                  <Input value={customerCellphone} onChange={(e) => setCustomerCellphone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métodos de Pagamento */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <p className="text-sm text-muted-foreground">
                Apenas PIX disponível no momento
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleMethodSelect('PIX')}
                  className={`flex flex-col items-start p-4 border rounded-lg transition-all cursor-pointer ${
                    selectedMethod === 'PIX'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <QrCode className={`h-4 w-4 mr-2 ${
                      selectedMethod === 'PIX' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <span className={`text-sm font-medium ${
                      selectedMethod === 'PIX' ? 'text-primary' : 'text-foreground'
                    }`}>
                      PIX
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pagamento instantâneo via QR Code
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Status do Método Selecionado */}
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary font-medium">
                Método selecionado: {getMethodDisplayName(selectedMethod)}
              </span>
              <Check className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <Button 
              onClick={handlePayment}
              disabled={loading || !selectedMethod}
              className="flex-1"
              size="lg"
            >
              {loading ? 'Processando...' : `Pagar com ${getMethodDisplayName(selectedMethod)}`}
            </Button>
            <Button variant="outline" onClick={handleCancel} size="lg">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 