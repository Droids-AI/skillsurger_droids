import { createClient } from 'npm:@supabase/supabase-js@2';

// Meta calls this endpoint; no browser CORS. Verify every POST with the app secret.
Deno.serve(async request => {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const verify = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (verify && url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === verify) {
      return new Response(url.searchParams.get('hub.challenge') || '');
    }
    return new Response('Forbidden', { status: 403 });
  }
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('WHATSAPP_APP_SECRET');
  if (!secret) return new Response('Unavailable', { status: 503 });
  const raw = await request.text();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const hex = request.headers.get('x-hub-signature-256')?.replace(/^sha256=/, '') || '';
  if (!/^[a-f0-9]{64}$/.test(hex)) return new Response('Forbidden', { status: 403 });
  const signature = Uint8Array.from(hex.match(/../g)!, x => parseInt(x, 16));
  if (!await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(raw))) return new Response('Forbidden', { status: 403 });
  try {
    const payload = JSON.parse(raw);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    for (const entry of payload.entry || []) for (const change of entry.changes || []) {
      for (const status of change.value?.statuses || []) {
        const next = status.status === 'sent' ? 'accepted' : status.status;
        if (!['accepted', 'delivered', 'read', 'failed'].includes(next)) continue;
        // Do not let late sent/delivered webhooks regress a read/delivered state.
        const predecessors = next === 'accepted' ? ['sending', 'accepted'] : next === 'delivered' ? ['sending', 'accepted', 'delivered'] : next === 'read' ? ['sending', 'accepted', 'delivered', 'read'] : ['sending', 'accepted', 'failed'];
        const update = { status: next, error_code: next === 'failed' ? 'delivery_failed' : null, updated_at: new Date().toISOString() };
        const result = await admin.from('webinar_notifications').update(update).eq('provider_message_id', status.id).in('status', predecessors);
        if (result.error) throw new Error('log_failed');
        const reminder = await admin.from('webinar_reminders').update(update).eq('provider_message_id', status.id).in('status', predecessors);
        if (reminder.error) throw new Error('log_failed');
      }
      // Replies: STOP opts the number out of all further WhatsApp messages, START opts back in.
      for (const message of change.value?.messages || []) {
        const word = String(message.text?.body ?? message.button?.text ?? '').trim().toUpperCase();
        const phone = /^\d{7,15}$/.test(String(message.from)) ? `+${message.from}` : '';
        if (!phone) continue;
        if (['STOP', 'UNSUBSCRIBE', 'STOP ALL', 'CANCEL'].includes(word)) {
          const saved = await admin.from('messaging_opt_outs').upsert({ phone, channel: 'whatsapp' }, { onConflict: 'phone', ignoreDuplicates: true });
          if (saved.error) throw new Error('opt_out_failed');
        } else if (word === 'START') {
          const removed = await admin.from('messaging_opt_outs').delete().eq('phone', phone);
          if (removed.error) throw new Error('opt_out_failed');
        }
      }
    }
    return new Response('OK');
  } catch {
    console.error(JSON.stringify({ area: 'whatsapp-status', code: 'status_update_failed', requestId: crypto.randomUUID() }));
    return new Response('Retry', { status: 500 });
  }
});
