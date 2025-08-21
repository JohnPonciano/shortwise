import { useMemo } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

export type AccessFeature =
  | 'links.unlimited'
  | 'workspaces.unlimited'
  | 'analytics.advanced'
  | 'customDomains'
  | 'abTesting'
  | 'apiAccess'
  | 'exportData'
  // futuras flags
  | 'prioritySupport'
  | 'betaFeatures';

export interface AccessCheck {
  allowed: boolean;
  reason?: string;
}

export function useAccess() {
  const { getSubscriptionStatus, getLimits } = useSubscription();
  const status = getSubscriptionStatus();
  const limits = getLimits();

  const isPro = status === 'active';
  const isExpired = status === 'expired';

  const check = useMemo(() => {
    return (feature: AccessFeature): AccessCheck => {
      if (isExpired) {
        return { allowed: false, reason: 'Sua assinatura expirou' };
      }
      switch (feature) {
        case 'links.unlimited':
          return { allowed: limits.links === -1, reason: 'Plano Pro oferece links ilimitados' };
        case 'workspaces.unlimited':
          return { allowed: limits.workspaces === -1, reason: 'Plano Pro oferece workspaces ilimitados' };
        case 'analytics.advanced':
          return { allowed: limits.analytics === 'advanced', reason: 'Analytics avançados apenas no Pro' };
        case 'customDomains':
          return { allowed: !!limits.customDomains, reason: 'Domínios customizados apenas no Pro' };
        case 'abTesting':
          return { allowed: !!limits.abTesting, reason: 'A/B testing apenas no Pro' };
        case 'apiAccess':
          return { allowed: !!limits.apiAccess, reason: 'API disponível apenas no Pro' };
        case 'exportData':
          return { allowed: !!limits.exportData, reason: 'Exportação de dados apenas no Pro' };
        case 'prioritySupport':
        case 'betaFeatures':
          // Flags futuras: por padrão, apenas Pro
          return { allowed: isPro, reason: 'Recurso disponível apenas no Pro' };
        default:
          return { allowed: false };
      }
    };
  }, [limits, isPro, isExpired]);

  return { check, status, limits, isPro, isExpired };
} 