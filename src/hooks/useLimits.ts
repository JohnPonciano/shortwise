import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

export function useLimits() {
  const { profile } = useAuth();
  const { getLimits } = useSubscription();

  const limits = getLimits();

  const checkLinkLimit = (currentLinks: number) => {
    if (limits.links === -1) return { canCreate: true, remaining: -1 };
    return {
      canCreate: currentLinks < limits.links,
      remaining: Math.max(0, limits.links - currentLinks)
    };
  };

  const checkWorkspaceLimit = (currentWorkspaces: number) => {
    if (limits.workspaces === -1) return { canCreate: true, remaining: -1 };
    return {
      canCreate: currentWorkspaces < limits.workspaces,
      remaining: Math.max(0, limits.workspaces - currentWorkspaces)
    };
  };

  const canUseFeature = (feature: keyof typeof limits) => {
    return limits[feature] === true || limits[feature] === 'advanced';
  };

  const getUpgradeMessage = (feature: string) => {
    return `Upgrade para Pro para acessar ${feature}`;
  };

  return {
    limits,
    checkLinkLimit,
    checkWorkspaceLimit,
    canUseFeature,
    getUpgradeMessage,
    isPro: limits.links === -1,
  };
} 