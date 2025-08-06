import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { linkId, userAgent, deviceType, referer } = await req.json();

    if (!linkId) {
      throw new Error('Link ID is required');
    }

    // Enhanced user agent parsing
    const getBrowser = (ua: string) => {
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Edge')) return 'Edge';
      return 'Other';
    };

    const getOS = (ua: string) => {
      if (ua.includes('Windows')) return 'Windows';
      if (ua.includes('Mac')) return 'macOS';
      if (ua.includes('Linux')) return 'Linux';
      if (ua.includes('Android')) return 'Android';
      if (ua.includes('iOS')) return 'iOS';
      return 'Other';
    };

    // Enhanced referer parsing to detect source platforms
    const getSourcePlatform = (refererUrl: string) => {
      if (!refererUrl) return 'Direct';
      
      const url = refererUrl.toLowerCase();
      
      // Social Media Platforms
      if (url.includes('whatsapp') || url.includes('wa.me')) return 'WhatsApp';
      if (url.includes('facebook.com') || url.includes('fb.com') || url.includes('m.facebook')) return 'Facebook';
      if (url.includes('instagram.com')) return 'Instagram';
      if (url.includes('twitter.com') || url.includes('t.co') || url.includes('x.com')) return 'Twitter/X';
      if (url.includes('linkedin.com')) return 'LinkedIn';
      if (url.includes('tiktok.com')) return 'TikTok';
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
      if (url.includes('pinterest.com')) return 'Pinterest';
      if (url.includes('reddit.com')) return 'Reddit';
      if (url.includes('discord.com') || url.includes('discord.gg')) return 'Discord';
      if (url.includes('telegram.org') || url.includes('t.me')) return 'Telegram';
      
      // Search Engines
      if (url.includes('google.com') || url.includes('google.')) return 'Google';
      if (url.includes('bing.com')) return 'Bing';
      if (url.includes('yahoo.com')) return 'Yahoo';
      if (url.includes('duckduckgo.com')) return 'DuckDuckGo';
      
      // Email Platforms
      if (url.includes('gmail.com')) return 'Gmail';
      if (url.includes('outlook.com') || url.includes('hotmail.com')) return 'Outlook';
      
      // Messaging Apps
      if (url.includes('slack.com')) return 'Slack';
      if (url.includes('teams.microsoft.com')) return 'Microsoft Teams';
      
      // Other common sources
      if (url.includes('github.com')) return 'GitHub';
      if (url.includes('stackoverflow.com')) return 'Stack Overflow';
      
      // Extract domain for unknown sources
      try {
        const domain = new URL(refererUrl).hostname;
        return domain.replace('www.', '').replace('m.', '');
      } catch {
        return 'Unknown';
      }
    };

    const browser = getBrowser(userAgent || '');
    const os = getOS(userAgent || '');
    const sourcePlatform = getSourcePlatform(referer || '');

    // Get client IP from headers (Cloudflare, nginx, etc.)
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Enhanced geolocation
    let country = 'Unknown';
    let city = 'Unknown';
    let region = 'Unknown';
    let timezone = 'Unknown';

    // Enhanced geolocation using a free service
    try {
      if (clientIP !== 'unknown' && !clientIP.includes('127.0.0.1') && !clientIP.includes('localhost')) {
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,city,regionName,timezone`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            country = geoData.country || 'Unknown';
            city = geoData.city || 'Unknown';
            region = geoData.regionName || 'Unknown';
            timezone = geoData.timezone || 'Unknown';
          }
        }
      }
    } catch (geoError) {
      console.log('Geolocation failed, using Unknown:', geoError);
    }

    // Insert enhanced click record
    const { error } = await supabaseClient
      .from('clicks')
      .insert({
        link_id: linkId,
        ip_address: clientIP,
        user_agent: userAgent || null,
        referer: referer || null,
        source_platform: sourcePlatform,
        country,
        city,
        region,
        timezone,
        browser,
        os,
        device_type: deviceType || 'unknown'
      });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        tracked_data: {
          source_platform: sourcePlatform,
          country,
          city,
          browser,
          os,
          device_type: deviceType
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error tracking click:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
