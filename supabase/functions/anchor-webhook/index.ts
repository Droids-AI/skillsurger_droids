// Anchor Browser webhook receiver.
// Verifies Anchor-Signature (HMAC-SHA256 over `v0:{Anchor-Timestamp}:{raw body}`,
// header `t=...,v1=<hex>`), rejects anything older than 2 minutes, and stores each
// event once in anchor_webhook_events. It never starts outward actions.
// Secrets: ANCHOR_WEBHOOK_SECRET, optional ANCHOR_WEBHOOK_SECRET_PREVIOUS (24 h rotation overlap).

const REPLAY_WINDOW_SECONDS = 120;
const encoder = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(mac), b => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyAnchorSignature(raw: string, signatureHeader: string, timestamp: string, secrets: string[], nowSeconds = Date.now() / 1000): Promise<'ok' | 'stale' | 'invalid'> {
  const ts = Number(timestamp);
  if (!timestamp || Number.isNaN(ts) || Math.abs(nowSeconds - ts) > REPLAY_WINDOW_SECONDS) return 'stale';
  const provided = signatureHeader.split(',').map(p => p.trim()).filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  if (!provided.length) return 'invalid';
  for (const secret of secrets) {
    const expected = await hmacHex(secret, `v0:${timestamp}:${raw}`);
    if (provided.some(p => safeEqual(expected, p))) return 'ok';
  }
  return 'invalid';
}

if (import.meta.main) Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secrets = [Deno.env.get('ANCHOR_WEBHOOK_SECRET'), Deno.env.get('ANCHOR_WEBHOOK_SECRET_PREVIOUS')].filter((s): s is string => !!s);
  if (!secrets.length) return new Response('Webhook secret not configured', { status: 503 });

  const raw = await request.text();
  if (raw.length > 256_000) return new Response('Payload too large', { status: 413 });
  const result = await verifyAnchorSignature(raw, request.headers.get('Anchor-Signature') || '', request.headers.get('Anchor-Timestamp') || '', secrets);
  if (result === 'stale') return new Response('Stale or missing timestamp', { status: 400 });
  if (result === 'invalid') return new Response('Invalid signature', { status: 401 });

  let event: { id?: string; type?: string; project_id?: string; created?: string; data?: unknown };
  try { event = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (typeof event?.id !== 'string' || typeof event?.type !== 'string') return new Response('Invalid event', { status: 400 });

  const { createClient } = await import('npm:@supabase/supabase-js@2');
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const saved = await admin.from('anchor_webhook_events').upsert({
    id: event.id, type: event.type, project_id: event.project_id ?? null,
    event_created_at: event.created ?? null, data: event.data ?? {},
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (saved.error) {
    console.error(JSON.stringify({ area: 'anchor-webhook', code: 'store_failed', eventId: event.id, type: event.type }));
    return new Response('Could not store event', { status: 500 }); // Anchor retries
  }
  console.log(JSON.stringify({ area: 'anchor-webhook', code: 'received', eventId: event.id, type: event.type }));
  return new Response('ok', { status: 200 });
});
