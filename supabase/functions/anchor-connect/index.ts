// Anchor connect flow entry point. Logic lives in handler.ts (tested with injected I/O).
// Secrets: ANCHOR_API_KEY, ANCHOR_APPLICATIONS (JSON site -> Anchor application id),
// FF_SKILLSURGER_CONNECT=true to enable (default off), optional SKILLSURGER_SITE_URL.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handle } from './handler.ts';
import * as anchor from '../_shared/anchor.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const check = <T>(result: { data: T; error: unknown }): T => { if (result.error) throw new Error('database_error'); return result.data; };

Deno.serve(request => handle(request, {
  enabled: Deno.env.get('FF_SKILLSURGER_CONNECT') === 'true',
  siteUrl: (Deno.env.get('SKILLSURGER_SITE_URL') || 'https://skillsurger.com').replace(/\/$/, ''),
  callbackBase: `${supabaseUrl}/functions/v1/anchor-connect/callback`,
  allowedOrigins: (Deno.env.get('SKILLSURGER_ALLOWED_ORIGINS') || 'https://skillsurger.com,https://www.skillsurger.com').split(',').map(v => v.trim()),
  async userFromRequest(req) {
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (!token || token === Deno.env.get('SUPABASE_ANON_KEY')) return null;
    const { data, error } = await admin.auth.getUser(token);
    return error || !data.user ? null : data.user.id;
  },
  sites: anchor.configuredSites,
  randomState: () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''),
  anchor,
  db: {
    async connections(userId) {
      return check(await admin.from('agent_external_identity').select('id, site, status, anchor_identity_id, connected_at').eq('user_id', userId).eq('product', 'skillsurger')) || [];
    },
    async insertConnectState(row) { check(await admin.from('agent_connect_state').insert(row)); },
    async consumeState(state) {
      const rows = check(await admin.rpc('agent_consume_connect_state', { p_state: state })) as unknown[];
      return (rows?.[0] as any) || null;
    },
    async identityClaimed(id) {
      return (check(await admin.from('agent_external_identity').select('id').eq('anchor_identity_id', id).limit(1)) || []).length > 0;
    },
    async removeConnection(userId, site) {
      check(await admin.from('agent_external_identity').delete().eq('user_id', userId).eq('product', 'skillsurger').eq('site', site));
    },
    async clearInactive(userId, site) {
      check(await admin.from('agent_external_identity').delete().eq('user_id', userId).eq('product', 'skillsurger').eq('site', site).in('status', ['deleted', 'failed']));
    },
    async insertIdentity(row) {
      const result = await admin.from('agent_external_identity').insert({ ...row, status: 'pending_verification' });
      if (result.error) return (result.error as { code?: string }).code === '23505' ? 'conflict' : (() => { throw new Error('database_error'); })();
      return 'ok';
    },
  },
  log: entry => console.log(JSON.stringify({ area: 'anchor-connect', ...entry })),
}).catch(error => {
  console.error(JSON.stringify({ area: 'anchor-connect', code: error instanceof anchor.AnchorError ? error.code : 'request_failed' }));
  return new Response(JSON.stringify({ error: { code: 'connect_failed', message: 'Could not connect right now. Please try again.' } }), {
    status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://skillsurger.com' },
  });
}));
