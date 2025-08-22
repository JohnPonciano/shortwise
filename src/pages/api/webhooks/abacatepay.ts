import { supabase } from '@/integrations/supabase/client';
import { WEBHOOK_CONFIG, validateWebhookSecret } from '@/config/webhook';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('abacatepay-signature');
    // Verificar se o webhook secret está correto
    if (!validateWebhookSecret(req.url)) {
      console.error('Webhook secret inválido');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const event = JSON.parse(body);
    console.log('Webhook event received:', event);

    switch (event.type) {
      case 'billing.completed':
        await handleBillingCompleted(event.data);
        break;

      case 'billing.cancelled':
        await handleBillingCancelled(event.data);
        break;

      case 'billing.failed':
        await handleBillingFailed(event.data);
        break;

      case 'billing.recurring':
        await handleBillingRecurring(event.data);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleBillingCompleted(billing: any) {
  const { user_id, plan } = billing.metadata || {};
  
  if (!user_id) {
    console.error('No user_id in billing metadata');
    return;
  }

  // Atualizar perfil do usuário
  await supabase
    .from('profiles')
    .update({
      subscription_tier: plan || 'pro',
      subscription_active: true,
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      abacatepay_customer_id: billing.customer?.id,
      abacatepay_subscription_id: billing.id,
    })
    .eq('user_id', user_id);
}

async function handleBillingCancelled(billing: any) {
  const { user_id } = billing.metadata || {};
  
  if (!user_id) return;

  await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
      subscription_active: false,
      subscription_end_date: null,
    })
    .eq('user_id', user_id);
}

async function handleBillingFailed(billing: any) {
  const { user_id } = billing.metadata || {};
  
  if (!user_id) return;

  await supabase
    .from('profiles')
    .update({
      subscription_active: false,
    })
    .eq('user_id', user_id);
}

async function handleBillingRecurring(billing: any) {
  const { user_id } = billing.metadata || {};
  
  if (!user_id) return;

  // Renovar assinatura quando pagamento recorrente for bem-sucedido
  await supabase
    .from('profiles')
    .update({
      subscription_active: true,
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('user_id', user_id);
} 