
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingState } from '@/components/LoadingState';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function Redirect() {
  const { slug } = useParams();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (slug) {
      handleRedirect();
    }
  }, [slug]);

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    let deviceType = 'desktop';
    let browser = 'unknown';
    let os = 'unknown';

    // Detect device type
    if (/iphone|ipod/.test(userAgent)) {
      deviceType = 'mobile';
      os = 'iOS';
    } else if (/ipad/.test(userAgent)) {
      deviceType = 'tablet';
      os = 'iOS';
    } else if (/android/.test(userAgent)) {
      deviceType = isMobile ? 'mobile' : 'tablet';
      os = 'Android';
    } else if (isMobile) {
      deviceType = 'mobile';
    }

    // Detect browser
    if (/chrome/.test(userAgent)) browser = 'Chrome';
    else if (/firefox/.test(userAgent)) browser = 'Firefox';
    else if (/safari/.test(userAgent)) browser = 'Safari';
    else if (/edge/.test(userAgent)) browser = 'Edge';

    // Detect OS for desktop
    if (deviceType === 'desktop') {
      if (/windows/.test(userAgent)) os = 'Windows';
      else if (/macintosh|mac os x/.test(userAgent)) os = 'macOS';
      else if (/linux/.test(userAgent)) os = 'Linux';
    }

    return { deviceType, browser, os };
  };

  const trackClick = async (linkData: any) => {
    try {
      const platform = detectPlatform();
      
      const clickData = {
        link_id: linkData.id,
        ip_address: null,
        device_type: platform.deviceType,
        user_agent: navigator.userAgent,
        referer: document.referrer || null,
        browser: platform.browser,
        os: platform.os,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      console.log('Tracking click with data:', clickData);

      await supabase
        .from('clicks')
        .insert([clickData]);

    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const handleRedirect = async () => {
    try {
      console.log('Redirect attempt for slug:', slug);
      console.log('Current domain:', window.location.hostname);
      
      const currentDomain = window.location.hostname;
      const isCustomDomain = !currentDomain.includes('lovableproject.com') && 
                            !currentDomain.includes('localhost') && 
                            currentDomain !== '127.0.0.1';

      console.log('Is custom domain:', isCustomDomain);

      let query = supabase
        .from('links')
        .select(`
          id,
          original_url,
          title,
          is_active,
          password,
          expires_at,
          max_clicks,
          click_count,
          ab_test_urls,
          deep_link_ios,
          deep_link_android
        `)
        .eq('short_slug', slug)
        .eq('is_active', true);

      console.log('Querying for standard domain...');

      const { data: linkData, error: linkError } = await query.maybeSingle();

      console.log('Query result:', { linkData, linkError });

      if (linkError) {
        console.error('Database error:', linkError);
        throw new Error('Erro ao buscar link');
      }

      if (!linkData) {
        console.log('No link data found for slug:', slug);
        setError('Link não encontrado ou expirado');
        setLoading(false);
        return;
      }

      // Check if link has expired (only if expires_at is set)
      if (linkData.expires_at) {
        const now = new Date();
        const expiresAt = new Date(linkData.expires_at);
        
        console.log('Checking expiration:', {
          now: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          isExpired: now > expiresAt
        });

        if (now > expiresAt) {
          setError('Este link expirou');
          setLoading(false);
          return;
        }
      }

      // Check max clicks (only if max_clicks is set)
      if (linkData.max_clicks && linkData.click_count >= linkData.max_clicks) {
        setError('Este link atingiu o limite máximo de cliques');
        setLoading(false);
        return;
      }

      // Check password protection
      if (linkData.password) {
        if (!password) {
          setShowPasswordForm(true);
          setLink(linkData);
          setLoading(false);
          return;
        }
        
        if (password !== linkData.password) {
          setError('Senha incorreta');
          return;
        }
      }

      setLink(linkData);
      
      // Track the click
      await trackClick(linkData);

      // Handle platform-specific redirects
      const platform = detectPlatform();
      let redirectUrl = linkData.original_url;

      // Check for deep links based on platform
      if (platform.os === 'iOS' && linkData.deep_link_ios) {
        console.log('Redirecting to iOS deep link:', linkData.deep_link_ios);
        redirectUrl = linkData.deep_link_ios;
      } else if (platform.os === 'Android' && linkData.deep_link_android) {
        console.log('Redirecting to Android deep link:', linkData.deep_link_android);
        redirectUrl = linkData.deep_link_android;
      }

      // Handle A/B testing
      if (linkData.ab_test_urls && linkData.ab_test_urls.length > 0) {
        const allUrls = [linkData.original_url, ...linkData.ab_test_urls];
        const randomIndex = Math.floor(Math.random() * allUrls.length);
        redirectUrl = allUrls[randomIndex];
        console.log('A/B testing redirect to:', redirectUrl);
      }

      console.log('Final redirect URL:', redirectUrl);

      // Redirect
      window.location.href = redirectUrl;

    } catch (error) {
      console.error('Redirect error:', error);
      setError('Erro ao processar redirecionamento');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    await handleRedirect();
  };

  if (loading) {
    return <LoadingState />;
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-xl font-semibold">Link Protegido</h1>
              <p className="text-muted-foreground mt-2">
                Este link requer uma senha para acesso
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full">
                Acessar Link
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h1 className="text-xl font-semibold mb-2">Ops!</h1>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This should rarely be shown as redirection happens quickly
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecionando...</p>
        </CardContent>
      </Card>
    </div>
  );
}
