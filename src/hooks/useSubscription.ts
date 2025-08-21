import { abacatePayClient } from '@/integrations/abacatepay/client';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useSubscription() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const manageSubscription = async () => {
    if (!profile?.abacatepay_customer_id) {
      toast({
        title: 'Erro',
        description: 'Informações de assinatura não encontradas',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Redirecionar para portal do cliente AbacatePay
      // Nota: AbacatePay pode não ter portal do cliente ainda
      // Neste caso, você pode implementar um painel próprio
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'Portal de gerenciamento será implementado em breve',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao acessar portal de assinatura: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const cancelSubscription = async () => {
    if (!profile) {
      toast({ title: 'Erro', description: 'Perfil não carregado', variant: 'destructive' });
      return;
    }

    const confirmed = confirm(
      'Tem certeza que deseja cancelar sua assinatura Pro? Você continuará com acesso até o final do período atual.'
    );

    if (!confirmed) return;

    try {
      if (profile.abacatepay_subscription_id) {
        await abacatePayClient.cancelSubscription(profile.abacatepay_subscription_id);
      }

      // Downgrade local imediato e mantém data de término atual (se existir) ou define para hoje
      const endDate = profile.subscription_end_date || new Date().toISOString();
      await supabase
        .from('profiles')
        .update({
          subscription_active: false,
          subscription_end_date: endDate,
        })
        .eq('user_id', profile.user_id);

      await refreshProfile();
      toast({
        title: 'Assinatura cancelada',
        description: 'Seu acesso Pro seguirá até a data de término.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao cancelar assinatura: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const getSubscriptionStatus = () => {
    if (!profile) return 'unknown';
    
    if (profile.subscription_tier === 'pro' && profile.subscription_active) {
      return 'active';
    }
    
    if (profile.subscription_tier === 'pro' && !profile.subscription_active) {
      return 'inactive';
    }
    
    return 'free';
  };

  const getLimits = () => {
    const status = getSubscriptionStatus();
    
    if (status === 'active') {
      return {
        links: -1, // ilimitado
        workspaces: -1, // ilimitado
        analytics: 'advanced',
        customDomains: true,
        abTesting: true,
        apiAccess: true,
        exportData: true,
      };
    }
    
    return {
      links: 100,
      workspaces: 2,
      analytics: 'basic',
      customDomains: false,
      abTesting: false,
      apiAccess: false,
      exportData: false,
    };
  };

  return {
    manageSubscription,
    cancelSubscription,
    getSubscriptionStatus,
    getLimits,
    isPro: getSubscriptionStatus() === 'active',
  };
} 