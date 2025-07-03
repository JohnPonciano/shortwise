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

    const browser = getBrowser(userAgent || '');
    const os = getOS(userAgent || '');

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
      JSON.stringify({ success: true }),
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