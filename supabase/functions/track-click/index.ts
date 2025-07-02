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

    // Get client IP from headers (Cloudflare, nginx, etc.)
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // For MVP, we'll set country as unknown since we don't have a geolocation service
    // In production, you'd use a service like ipapi.co or maxmind
    let country = 'Unknown';
    let city = 'Unknown';

    // Basic geolocation using a free service (optional)
    try {
      if (clientIP !== 'unknown' && !clientIP.includes('127.0.0.1') && !clientIP.includes('localhost')) {
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            country = geoData.country || 'Unknown';
            city = geoData.city || 'Unknown';
          }
        }
      }
    } catch (geoError) {
      console.log('Geolocation failed, using Unknown:', geoError);
    }

    // Insert click record
    const { error } = await supabaseClient
      .from('clicks')
      .insert({
        link_id: linkId,
        ip_address: clientIP,
        user_agent: userAgent || null,
        referer: referer || null,
        country,
        city,
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