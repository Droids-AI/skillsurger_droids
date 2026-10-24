// WhatsApp via Green API (green-api.com), the same gateway Intervue-Backend uses.
// Plain text, no template approval. Secrets: GREENAPI_API_URL (instance host),
// GREENAPI_ID_INSTANCE, GREENAPI_API_TOKEN.
// The instance's single webhook URL belongs to Intervue-Backend, so STOP/START
// replies are read by polling lastIncomingMessages instead of a webhook.

const base = () => `${(Deno.env.get('GREENAPI_API_URL') || 'https://api.green-api.com').replace(/\/+$/, '')}/waInstance${Deno.env.get('GREENAPI_ID_INSTANCE')}`;

export function greenApiConfigured(): boolean {
  return !!(Deno.env.get('GREENAPI_ID_INSTANCE') && Deno.env.get('GREENAPI_API_TOKEN'));
}

// phone is E.164 (+919876543210). Returns Green API's idMessage when accepted.
export async function sendGreenApiMessage(phone: string, message: string): Promise<{ ok: boolean; id: string | null }> {
  const response = await fetch(`${base()}/sendMessage/${Deno.env.get('GREENAPI_API_TOKEN')}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ chatId: `${phone.replace(/\D/g, '')}@c.us`, message }),
  });
  const body = await response.json().catch(() => null);
  const id = response.ok && typeof body?.idMessage === 'string' ? body.idMessage : null;
  return { ok: !!id, id };
}

// Opt-out keywords received in the last `minutes`, oldest first, so a later START undoes an earlier STOP.
export async function recentOptOutReplies(minutes: number): Promise<{ phone: string; optOut: boolean }[]> {
  const response = await fetch(`${base()}/lastIncomingMessages/${Deno.env.get('GREENAPI_API_TOKEN')}?minutes=${minutes}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('green_api_incoming_failed');
  const messages = await response.json();
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(m => typeof m?.chatId === 'string' && m.chatId.endsWith('@c.us'))
    .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0))
    .flatMap((m): { phone: string; optOut: boolean }[] => {
      const word = String(m.textMessage ?? m.extendedTextMessage?.text ?? '').trim().toUpperCase();
      const phone = `+${m.chatId.replace('@c.us', '')}`;
      if (['STOP', 'UNSUBSCRIBE', 'STOP ALL', 'CANCEL'].includes(word)) return [{ phone, optOut: true }];
      if (word === 'START') return [{ phone, optOut: false }];
      return [];
    });
}
