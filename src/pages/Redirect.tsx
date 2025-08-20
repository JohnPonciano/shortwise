import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PasswordProtection from '@/components/LinkFeatures/PasswordProtection';

interface PlatformInfo {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  userAgent: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  timezone: string;
}

export default function Redirect() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<any | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError('Slug não encontrado');
      setLoading(false);
      return;
    }

    handleInitialFetch();
  }, [slug]);

  const detectPlatform = (): PlatformInfo => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android.*?(?=.*Tablet)/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';

    // Browser detection
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'chrome';
    else if (userAgent.includes('Firefox')) browser = 'firefox';
    else if (userAgent.includes('Safari')) browser = 'safari';
    else if (userAgent.includes('Edge')) browser = 'edge';

    // OS detection
    let os = 'unknown';
    if (isIOS) os = 'ios';
    else if (isAndroid) os = 'android';
    else if (userAgent.includes('Windows')) os = 'windows';
    else if (userAgent.includes('Mac')) os = 'macos';
    else if (userAgent.includes('Linux')) os = 'linux';

    return {
      isMobile,
      isTablet,
      isIOS,
      isAndroid,
      userAgent,
      deviceType,
      browser,
      os,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  };

  const trackClick = async (linkId: string, platformInfo: PlatformInfo) => {
    try {
      const clickData = {
        link_id: linkId,
        ip_address: null, // Will be handled by the edge function
        device_type: platformInfo.deviceType,
        user_agent: platformInfo.userAgent,
        referer: document.referrer || null,
        browser: platformInfo.browser,
        os: platformInfo.os,
        timezone: platformInfo.timezone,
      };

      const { error } = await supabase
        .from('clicks')
        .insert([clickData]);

      if (error) {
        console.error('Error tracking click:', error);
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const proceedRedirect = async (linkData: any) => {
    try {
      // Detect platform & track
      const platformInfo = detectPlatform();
      await trackClick(linkData.id, platformInfo);

      // Update click count (best-effort)
      const { error: updateError } = await supabase
        .from('links')
        .update({ 
          click_count: (linkData.click_count || 0) + 1 
        })
        .eq('id', linkData.id);

      if (updateError) {
        console.error('Error updating click count:', updateError);
      }

      // Determine redirect URL based on platform
      let redirectUrl = linkData.original_url;

      if (platformInfo.isIOS && linkData.deep_link_ios) {
        redirectUrl = linkData.deep_link_ios;
      } else if (platformInfo.isAndroid && linkData.deep_link_android) {
        redirectUrl = linkData.deep_link_android;
      }

      // Add UTM parameters if they exist
      if (linkData.utm_source || linkData.utm_medium || linkData.utm_campaign || linkData.utm_term || linkData.utm_content) {
        const url = new URL(redirectUrl);
        if (linkData.utm_source) url.searchParams.set('utm_source', linkData.utm_source);
        if (linkData.utm_medium) url.searchParams.set('utm_medium', linkData.utm_medium);
        if (linkData.utm_campaign) url.searchParams.set('utm_campaign', linkData.utm_campaign);
        if (linkData.utm_term) url.searchParams.set('utm_term', linkData.utm_term);
        if (linkData.utm_content) url.searchParams.set('utm_content', linkData.utm_content);
        redirectUrl = url.toString();
      }

      // Handle A/B testing
      if (linkData.ab_test_urls && linkData.ab_test_urls.length > 0) {
        const allUrls = [redirectUrl, ...linkData.ab_test_urls];
        const weights = linkData.ab_test_weights || allUrls.map(() => 1);
        const totalWeight = weights.reduce((sum: number, weight: number) => sum + weight, 0);
        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        for (let i = 0; i < allUrls.length; i++) {
          currentWeight += weights[i] || 1;
          if (random <= currentWeight) {
            redirectUrl = allUrls[i];
            break;
          }
        }
      }

      // Redirect
      window.location.href = redirectUrl;
    } finally {
      setLoading(false);
    }
  };

  const handleInitialFetch = async () => {
    try {
      setLoading(true);

      // Get link data
      const { data: fetchedLink, error: fetchError } = await supabase
        .from('links')
        .select('*')
        .eq('short_slug', slug)
        .eq('is_active', true)
        .single();

      if (fetchError || !fetchedLink) {
        setError('Link não encontrado ou inativo');
        return;
      }

      // Check if link has expired
      if (fetchedLink.expires_at && new Date(fetchedLink.expires_at) < new Date()) {
        setError('Este link expirou');
        return;
      }

      // Check max clicks limit
      if (fetchedLink.max_clicks && fetchedLink.click_count >= fetchedLink.max_clicks) {
        setError('Este link atingiu o limite máximo de cliques');
        return;
      }

      // If password protected, request password and stop here
      if (fetchedLink.password_protected) {
        setLink(fetchedLink);
        setNeedsPassword(true);
        return;
      }

      // Otherwise, proceed
      await proceedRedirect(fetchedLink);
    } catch (error) {
      console.error('Redirect error:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!link) return;
    setVerifyingPassword(true);
    setPasswordError(null);
    try {
      // Validate password on DB without exposing the stored password
      const { data, error } = await supabase
        .from('links')
        .select('id')
        .eq('id', link.id)
        .eq('password', password)
        .single();

      if (error || !data) {
        setPasswordError('Senha incorreta');
        return;
      }

      // Password OK, proceed
      await proceedRedirect(link);
    } catch (err) {
      console.error('Password validation error:', err);
      setPasswordError('Erro ao validar a senha');
    } finally {
      setVerifyingPassword(false);
    }
  };

  if (needsPassword && link) {
    return (
      <PasswordProtection
        onPasswordSubmit={handlePasswordSubmit}
        loading={verifyingPassword}
        error={passwordError || undefined}
        linkTitle={link.title}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      {loading && <p>Redirecionando...</p>}
      {error && (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Erro ao redirecionar</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}
    </div>
  );
}
