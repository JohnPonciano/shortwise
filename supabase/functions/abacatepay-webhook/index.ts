import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const url = new URL(req.url);
		const secret = url.searchParams.get('webhookSecret');
		const expected = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET') || 'pokemon201';
		if (!secret || secret !== expected) {
			return new Response(JSON.stringify({ error: 'unauthorized' }), {
				status: 401,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		const body = await req.json();
		// Log básico para depuração (remova em produção)
		console.log('Webhook recebido AbacatePay:', JSON.stringify(body));
		
		// AbacatePay responde no formato { data, error } consistentemente
		const eventType = body?.type || body?.event || body?.data?.event || null;
		const data = body?.data || body;

		// Extraímos os identificadores necessários considerando múltiplas estruturas
		const status: string | undefined = data?.status || data?.billing?.status || data?.payment?.status;
		const billingId: string | undefined = data?.id || data?.billing?.id || data?.payment?.id;
		const customerId: string | undefined = data?.customer?.id || data?.billing?.customer?.id;
		const metadata = data?.metadata || data?.billing?.metadata || {};
		const customerMetadata = data?.customer?.metadata || data?.billing?.customer?.metadata || {};
		let userId: string | undefined = metadata?.user_id || metadata?.userId || metadata?.supabase_user_id;
		if (!userId) {
			userId = customerMetadata?.user_id || customerMetadata?.userId || customerMetadata?.supabase_user_id;
		}

		// Inicializa Supabase com Service Role para bypass RLS
		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
		const supabase = createClient(supabaseUrl, serviceRoleKey, {
			auth: { persistSession: false },
		});

		// Somente processa quando pago/concluído
		const paid = (status || '').toUpperCase() === 'PAID' || (status || '').toUpperCase() === 'COMPLETED';
		if (!paid) {
			return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'not paid', status, eventType }), {
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		if (!userId) {
			return new Response(JSON.stringify({ error: 'missing user_id in metadata', data }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		// Calcula data de expiração (30 dias) em UTC ISO para compatibilidade de tipos
		const expiresAt = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() + 30); return d.toISOString(); })();

		// Atualiza o perfil do usuário para PRO
		const { error: upErr } = await supabase
			.from('profiles')
			.update({
				subscription_tier: 'pro',
				subscription_active: true,
				subscription_end_date: expiresAt,
				abacatepay_customer_id: customerId ?? null,
				abacatepay_subscription_id: billingId ?? null,
			})
			.eq('user_id', userId);

		if (upErr) {
			return new Response(JSON.stringify({ error: upErr.message }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	} catch (e) {
		return new Response(JSON.stringify({ error: e?.message || 'internal error' }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}
}); 