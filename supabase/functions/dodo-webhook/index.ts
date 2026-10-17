// Supabase Edge Function: dodo-webhook
//
// Receives Dodo Payments webhooks (Standard Webhooks format), verifies the
// signature, records payment and refund events in public.payments, moves the
// buyer's leads to Paid/Refunded, and appends a row to the "Payments" sheet tab.
//
// Secret: DODO_WEBHOOK_SECRET (the whsec_... signing key from the Dodo dashboard).
// Endpoint: https://<project>.supabase.co/functions/v1/dodo-webhook
import { createClient } from 'npm:@supabase/supabase-js@2';

const TOLERANCE_SECONDS = 5 * 60;

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0));
}

function bytesToBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

// Standard Webhooks: HMAC-SHA256 over "id.timestamp.body", base64, header "v1,<sig> v1,<sig2>".
async function verify(secret: string, id: string, timestamp: string, body: string, header: string): Promise<boolean> {
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!id || !Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;
  const key = await crypto.subtle.importKey('raw', base64ToBytes(secret.replace(/^whsec_/, '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = bytesToBase64(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`)));
  return header.split(' ').some(part => {
    const [version, signature] = part.split(',');
    if (version !== 'v1' || !signature || signature.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    return diff === 0;
  });
}

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('DODO_WEBHOOK_SECRET');
  if (!secret) {
    console.error(JSON.stringify({ area: 'dodo-webhook', code: 'secret_not_configured' }));
    return new Response('Not configured', { status: 503 });
  }
  const body = await request.text();
  if (body.length > 100_000) return new Response('Too large', { status: 413 });
  const id = request.headers.get('webhook-id') || '';
  const valid = await verify(secret, id, request.headers.get('webhook-timestamp') || '', body, request.headers.get('webhook-signature') || '');
  if (!valid) return new Response('Invalid signature', { status: 401 });

  let event;
  try { event = JSON.parse(body); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const data = event?.data ?? {};
  const record = {
    event_id: id,
    event_type: String(event?.type ?? 'unknown'),
    payment_id: data.payment_id ?? null,
    refund_id: data.refund_id ?? null,
    status: data.status ?? null,
    amount_minor: data.total_amount ?? data.amount ?? null,
    currency: data.currency ?? null,
    customer_email: data.customer?.email ?? null,
    customer_name: data.customer?.name ?? null,
    product_ids: Array.isArray(data.product_cart) ? data.product_cart.map((item: { product_id?: string }) => item.product_id).filter(Boolean) : [],
    raw: event,
  };

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const result = await admin.rpc('record_payment_event', { p_event: record });
  if (result.error) {
    console.error(JSON.stringify({ area: 'dodo-webhook', code: 'record_failed', eventId: id }));
    return new Response('Retry', { status: 500 });
  }

  if (!result.data?.duplicate && /^(payment|refund)\./.test(record.event_type)) {
    const sync = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sheets-sync`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        formType: 'payment', eventType: record.event_type, paymentId: record.payment_id ?? '', refundId: record.refund_id ?? '',
        status: record.status ?? '', amountInr: record.amount_minor == null ? '' : Number(record.amount_minor) / 100,
        currency: record.currency ?? '', email: result.data?.email ?? record.customer_email ?? '', name: record.customer_name ?? '',
        productIds: record.product_ids.join(' '), eventId: id,
      }),
    }).catch(() => console.error(JSON.stringify({ area: 'dodo-webhook', code: 'sheets_sync_failed', eventId: id })));
    // deno-lint-ignore no-explicit-any
    const runtime = (globalThis as any).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(sync); else await sync;
  }
  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
