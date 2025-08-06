import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    if (!slug) {
      setError('Slug não encontrado');
      setLoading(false);
      return;
    }

    handleRedirect();
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

  const handleRedirect = async () => {
    try {
      setLoading(true);

      // Get link data
      const { data: link, error } = await supabase
        .from('links')
        .select('*')
        .eq('short_slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !link) {
        setError('Link não encontrado ou inativo');
        return;
      }

      // Check if link has expired
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        setError('Este link expirou');
        return;
      }

      // Check max clicks limit
      if (link.max_clicks && link.click_count >= link.max_clicks) {
        setError('Este link atingiu o limite máximo de cliques');
        return;
      }

      // Detect platform
      const platformInfo = detectPlatform();

      // Track the click
      await trackClick(link.id, platformInfo);

      // Update click count
      const { error: updateError } = await supabase
        .from('links')
        .update({ 
          click_count: (link.click_count || 0) + 1 
        })
        .eq('id', link.id);

      if (updateError) {
        console.error('Error updating click count:', updateError);
      }

      // Determine redirect URL based on platform
      let redirectUrl = link.original_url;

      if (platformInfo.isIOS && link.deep_link_ios) {
        redirectUrl = link.deep_link_ios;
      } else if (platformInfo.isAndroid && link.deep_link_android) {
        redirectUrl = link.deep_link_android;
      }

      // Add UTM parameters if they exist
      if (link.utm_source || link.utm_medium || link.utm_campaign || link.utm_term || link.utm_content) {
        const url = new URL(redirectUrl);
        if (link.utm_source) url.searchParams.set('utm_source', link.utm_source);
        if (link.utm_medium) url.searchParams.set('utm_medium', link.utm_medium);
        if (link.utm_campaign) url.searchParams.set('utm_campaign', link.utm_campaign);
        if (link.utm_term) url.searchParams.set('utm_term', link.utm_term);
        if (link.utm_content) url.searchParams.set('utm_content', link.utm_content);
        redirectUrl = url.toString();
      }

      // Handle A/B testing
      if (link.ab_test_urls && link.ab_test_urls.length > 0) {
        const allUrls = [redirectUrl, ...link.ab_test_urls];
        const weights = link.ab_test_weights || allUrls.map(() => 1);
        
        // Weighted random selection
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
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

    } catch (error) {
      console.error('Redirect error:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

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
