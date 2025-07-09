import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink } from 'lucide-react';
import PasswordProtection from '@/components/LinkFeatures/PasswordProtection';

const Redirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [linkInfo, setLinkInfo] = useState<{
    id: string;
    original_url: string;
    title: string | null;
    password: string | null;
    expires_at: string | null;
    max_clicks: number | null;
    click_count: number;
    ab_test_urls: string[];
    deep_link_ios: string | null;
    deep_link_android: string | null;
    platformMessage?: string;
  } | null>(null);

  useEffect(() => {
    if (slug) {
      handleRedirect();
    }
  }, [slug]);

  const detectDevice = (userAgent: string): 'desktop' | 'mobile' | 'tablet' => {
    const ua = userAgent.toLowerCase();
    
    if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
      return 'tablet';
    }
    
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
      return 'mobile';
    }
    
    return 'desktop';
  };

  const detectPlatform = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    
    return {
      isIOS: /ipad|iphone|ipod/.test(ua),
      isAndroid: /android/.test(ua),
      isMobile: /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua),
      isTablet: /tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(ua),
      isDesktop: !/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile|tablet|ipad|playbook|silk/i.test(ua),
      isSafari: /safari/i.test(ua) && !/chrome|chromium|edg/i.test(ua),
      isChrome: /chrome/i.test(ua),
      isFirefox: /firefox/i.test(ua),
      isEdge: /edg/i.test(ua),
      isMacOS: /macintosh|mac os x/i.test(ua),
      isWindows: /windows/i.test(ua),
      isLinux: /linux/i.test(ua),
      deviceType: /tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(ua) ? 'tablet' : 
                  /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua) ? 'mobile' : 'desktop'
    };
  };

  const handleRedirect = async () => {
    try {
      console.log('Redirect attempt for slug:', slug);
      
      // Check if this is a custom domain request
      const currentDomain = window.location.hostname;
      console.log('Current domain:', currentDomain);
      
      const isCustomDomain = currentDomain !== 'localhost' && 
                            !currentDomain.includes('lovableproject.com') && 
                            !currentDomain.includes('lovable.app') &&
                            !currentDomain.includes('shortwise.app');
      
      console.log('Is custom domain:', isCustomDomain);

      let linkData;
      let linkError;

      if (isCustomDomain) {
        console.log('Querying for custom domain...');
        // First get the link
        const { data: linkResult, error: linkErr } = await supabase
          .from('links')
          .select('id, original_url, title, is_active, user_id, password, expires_at, max_clicks, click_count, ab_test_urls, deep_link_ios, deep_link_android')
          .eq('short_slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (linkErr || !linkResult) {
          linkData = null;
          linkError = linkErr;
        } else {
          // Then check if the user's custom domain matches
          const { data: profileResult, error: profileErr } = await supabase
            .from('profiles')
            .select('custom_domain')
            .eq('user_id', linkResult.user_id)
            .maybeSingle();

          if (profileErr || !profileResult || profileResult.custom_domain !== currentDomain) {
            linkData = null;
            linkError = { message: 'Custom domain mismatch' };
          } else {
            linkData = linkResult;
            linkError = null;
          }
        }
      } else {
        console.log('Querying for standard domain...');
        // Standard domain handling
        const { data, error } = await supabase
          .from('links')
          .select('id, original_url, title, is_active, password, expires_at, max_clicks, click_count, ab_test_urls, deep_link_ios, deep_link_android')
          .eq('short_slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        linkData = data;
        linkError = error;
      }

      console.log('Query result:', { linkData, linkError });

      if (linkError) {
        console.error('Database error:', linkError);
        setError('An error occurred while processing the redirect');
        setLoading(false);
        return;
      }

      if (!linkData) {
        console.log('No link data found for slug:', slug);
        setError('Link not found or has been disabled');
        setLoading(false);
        return;
      }

      // Check if link has expired
      if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
        setError('Este link expirou');
        setLoading(false);
        return;
      }

      // Check if max clicks reached
      if (linkData.max_clicks && linkData.click_count >= linkData.max_clicks) {
        setError('Este link atingiu o limite máximo de cliques');
        setLoading(false);
        return;
      }

      setLinkInfo(linkData);

      // Check if password is required
      if (linkData.password) {
        setPasswordRequired(true);
        setLoading(false);
        return;
      }

      // If no password required, proceed with redirect
      await performRedirect(linkData);

      // This code moved to performRedirect function

    } catch (error) {
      console.error('Error handling redirect:', error);
      setError('An error occurred while processing the redirect');
      setLoading(false);
    }
  };

  const performRedirect = async (linkData: any) => {
    try {
      // Detect platform for enhanced deep linking
      const userAgent = navigator.userAgent;
      const platform = detectPlatform(userAgent);
      
      let redirectUrl = linkData.original_url;
      let redirectType = 'default';
      
      // Handle A/B testing first
      if (linkData.ab_test_urls && linkData.ab_test_urls.length > 0) {
        const allUrls = [linkData.original_url, ...linkData.ab_test_urls];
        redirectUrl = allUrls[Math.floor(Math.random() * allUrls.length)];
        redirectType = 'ab_test';
      }
      
      // Handle deep linking with priority
      if (platform.isIOS && linkData.deep_link_ios) {
        redirectUrl = linkData.deep_link_ios;
        redirectType = 'deep_link_ios';
        
        // Try to open the app first, then fallback to URL
        if (linkData.deep_link_ios.startsWith('http')) {
          // It's a regular URL, just redirect
          window.location.href = redirectUrl;
        } else {
          // It's a deep link scheme, try to open app
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = linkData.deep_link_ios;
          document.body.appendChild(iframe);
          
          // Fallback to original URL if app doesn't open
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.location.href = linkData.original_url;
          }, 2000);
          
          // Track the click and return early
          await supabase.functions.invoke('track-click', {
            body: {
              linkId: linkData.id,
              userAgent,
              deviceType: platform.deviceType,
              referer: document.referrer || null,
              redirectType,
              platform: 'ios'
            }
          });
          return;
        }
      } else if (platform.isAndroid && linkData.deep_link_android) {
        redirectUrl = linkData.deep_link_android;
        redirectType = 'deep_link_android';
        
        // Try to open the app first, then fallback to URL
        if (linkData.deep_link_android.startsWith('http')) {
          // It's a regular URL, just redirect
          window.location.href = redirectUrl;
        } else {
          // It's a deep link scheme, try to open app
          const startTime = Date.now();
          
          // Try to open the app
          window.location.href = linkData.deep_link_android;
          
          // Fallback to original URL if app doesn't open within 2 seconds
          setTimeout(() => {
            if (Date.now() - startTime < 2100) {
              window.location.href = linkData.original_url;
            }
          }, 2000);
          
          // Track the click and return early
          await supabase.functions.invoke('track-click', {
            body: {
              linkId: linkData.id,
              userAgent,
              deviceType: platform.deviceType,
              referer: document.referrer || null,
              redirectType,
              platform: 'android'
            }
          });
          return;
        }
      }

      // Track the click with enhanced platform detection
      await supabase.functions.invoke('track-click', {
        body: {
          linkId: linkData.id,
          userAgent,
          deviceType: platform.deviceType,
          referer: document.referrer || null,
          redirectType,
          platform: platform.isIOS ? 'ios' : platform.isAndroid ? 'android' : 'other',
          browser: platform.isChrome ? 'chrome' : 
                  platform.isSafari ? 'safari' : 
                  platform.isFirefox ? 'firefox' : 
                  platform.isEdge ? 'edge' : 'other',
          os: platform.isMacOS ? 'macos' : 
              platform.isWindows ? 'windows' : 
              platform.isLinux ? 'linux' : 'other'
        }
      });

      // Show platform-specific message
      const platformMessage = platform.isIOS ? 'Redirecionando para iOS...' :
                            platform.isAndroid ? 'Redirecionando para Android...' :
                            platform.isMobile ? 'Redirecionando para mobile...' :
                            'Redirecionando...';
      
      // Update the UI to show platform-specific message
      setLinkInfo(prev => prev ? { ...prev, platformMessage } : null);

      // Redirect after a brief moment
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
      
    } catch (error) {
      console.error('Error during redirect:', error);
      setError('Erro durante o redirecionamento');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!linkInfo || !linkInfo.password) return;
    
    if (password === linkInfo.password) {
      setPasswordRequired(false);
      setPasswordError(null);
      setLoading(true);
      await performRedirect(linkInfo);
    } else {
      setPasswordError('Senha incorreta');
    }
  };

  if (passwordRequired && linkInfo) {
    return (
      <PasswordProtection
        onPasswordSubmit={handlePasswordSubmit}
        loading={loading}
        error={passwordError}
        linkTitle={linkInfo.title}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold mb-4">Link Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-flex items-center space-x-2 text-primary hover:underline"
          >
            <span>Go to Shortwise</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">
          {linkInfo?.platformMessage || 'Redirecting...'}
        </h1>
        
        {linkInfo && (
          <div className="space-y-4">
            {linkInfo.title && (
              <p className="text-lg font-medium">{linkInfo.title}</p>
            )}
            <p className="text-sm text-muted-foreground break-all">
              Taking you to: {linkInfo.original_url}
            </p>
            {linkInfo.deep_link_ios && (
              <p className="text-xs text-muted-foreground">
                📱 Deep link configured for iOS
              </p>
            )}
            {linkInfo.deep_link_android && (
              <p className="text-xs text-muted-foreground">
                🤖 Deep link configured for Android
              </p>
            )}
          </div>
        )}
        
        <div className="mt-8">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-medium text-primary">Shortwise</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Redirect;