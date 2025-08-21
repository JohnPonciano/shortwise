import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const planDetails = {
    name: 'Plano Pro',
    price: 1990, // R$ 19,90 em centavos
    description: 'Links ilimitados, múltiplos workspaces, analytics avançados',
    features: [
      'Links ilimitados',
      'Workspaces ilimitados', 
      'Analytics avançados',
      'Domínios customizados',
      'A/B testing',
      'API para desenvolvedores',
      'Exportação de dados',
      'Suporte prioritário'
    ]
  };

  const handleSubscribe = () => {
    if (!user || !profile) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return;
    }

    // Redirecionar para página de checkout
    navigate('/checkout?plan=pro&returnUrl=/settings');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-yellow-500 mr-2" />
          <CardTitle className="text-2xl">Upgrade para Pro</CardTitle>
        </div>
        <p className="text-muted-foreground">
          Desbloqueie todo o potencial do Shortwise
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preço */}
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">
            R$ 19,90
          </div>
          <div className="text-sm text-muted-foreground">por mês</div>
          <Badge variant="secondary" className="mt-2">
            7 dias de teste grátis
          </Badge>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Inclui:
          </h4>
          <ul className="space-y-2">
            {planDetails.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <Zap className="h-4 w-4 text-yellow-500 mr-3 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Button 
            onClick={handleSubscribe} 
            className="w-full"
            size="lg"
          >
            Começar Teste Grátis
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>

        {/* Informações adicionais */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>
            • Teste grátis por 7 dias
          </p>
          <p>
            • Cancele a qualquer momento
          </p>
          <p>
            • Pagamento seguro via AbacatePay
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 