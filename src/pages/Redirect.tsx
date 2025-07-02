import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink } from 'lucide-react';

const Redirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkInfo, setLinkInfo] = useState<{
    original_url: string;
    title: string | null;
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

  const handleRedirect = async () => {
    try {
      // Find the link by slug
      const { data: linkData, error: linkError } = await supabase
        .from('links')
        .select('id, original_url, title, is_active')
        .eq('short_slug', slug)
        .eq('is_active', true)
        .single();

      if (linkError || !linkData) {
        setError('Link not found or has been disabled');
        setLoading(false);
        return;
      }

      setLinkInfo({
        original_url: linkData.original_url,
        title: linkData.title
      });

      // Track the click
      const userAgent = navigator.userAgent;
      const deviceType = detectDevice(userAgent);
      
      // Get user's IP and location (this would be done server-side in production)
      // For now, we'll just record basic info
      await supabase.functions.invoke('track-click', {
        body: {
          linkId: linkData.id,
          userAgent,
          deviceType,
          referer: document.referrer || null
        }
      });

      // Redirect after a brief moment
      setTimeout(() => {
        window.location.href = linkData.original_url;
      }, 1000);

    } catch (error) {
      console.error('Error handling redirect:', error);
      setError('An error occurred while processing the redirect');
      setLoading(false);
    }
  };

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
        
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        
        {linkInfo && (
          <div className="space-y-4">
            {linkInfo.title && (
              <p className="text-lg font-medium">{linkInfo.title}</p>
            )}
            <p className="text-sm text-muted-foreground break-all">
              Taking you to: {linkInfo.original_url}
            </p>
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