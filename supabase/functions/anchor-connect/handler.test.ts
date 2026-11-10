// deno test supabase/functions/anchor-connect/handler.test.ts
import { assertEquals, assert } from 'jsr:@std/assert@1';
import { handle, type Deps, type ConnectRow } from './handler.ts';

const A = 'user-a', B = 'user-b';
const BASE = 'https://proj.supabase.co/functions/v1/anchor-connect';

function world(overrides: Partial<Deps> = {}) {
  const states = new Map<string, { user_id: string; product: string; site: string; anchor_app_id: string; anchor_token: string; expires_at: string; consumed: boolean }>();
  const identities: (ConnectRow & { user_id: string })[] = [];
  const anchorIdentities = new Map<string, string>([['ident-a', 'app-1'], ['ident-b', 'app-1'], ['ident-other-app', 'app-2']]);
  const calls: string[] = [];
  let n = 0;
  const deps: Deps = {
    enabled: true, siteUrl: 'https://skillsurger.com', callbackBase: `${BASE}/callback`,
    allowedOrigins: ['https://skillsurger.com'],
    userFromRequest: async req => ({ 'Bearer a': A, 'Bearer b': B } as Record<string, string>)[req.headers.get('authorization') || ''] || null,
    sites: () => ({ 'jobs.example.com': 'app-1' }),
    randomState: () => (++n).toString(16).padStart(32, '0'),
    anchor: {
      createIdentityToken: async (app, cb) => { calls.push(`token:${app}:${cb}`); return { token: 'raw-token', expiresAt: new Date(Date.now() + 900_000).toISOString(), tokenHash: 'hash-1' }; },
      getIdentity: async id => { if (!anchorIdentities.has(id)) throw new Error('404'); return { id }; },
      applicationHasIdentity: async (app, id) => anchorIdentities.get(id) === app,
      updateIdentityMetadata: async (id, name) => { calls.push(`meta:${id}:${name}`); },
      deleteIdentity: async id => { calls.push(`delete:${id}`); },
    },
    db: {
      connections: async uid => identities.filter(i => i.user_id === uid),
      insertConnectState: async row => { states.set(row.state, { ...row, consumed: false }); },
      consumeState: async state => {
        const s = states.get(state);
        if (!s || s.consumed || Date.parse(s.expires_at) <= Date.now()) return null;
        s.consumed = true;
        return { user_id: s.user_id, product: s.product, site: s.site, anchor_app_id: s.anchor_app_id };
      },
      identityClaimed: async id => identities.some(i => i.anchor_identity_id === id),
      removeConnection: async (uid, site) => { for (let i = identities.length - 1; i >= 0; i--) if (identities[i].user_id === uid && identities[i].site === site) identities.splice(i, 1); },
      clearInactive: async (uid, site) => { for (let i = identities.length - 1; i >= 0; i--) if (identities[i].user_id === uid && identities[i].site === site && ['deleted', 'failed'].includes(identities[i].status)) identities.splice(i, 1); },
      insertIdentity: async row => {
        if (identities.some(i => i.anchor_identity_id === row.anchor_identity_id || (i.user_id === row.user_id && i.site === row.site))) return 'conflict';
        identities.push({ id: `row-${identities.length}`, ...row, status: 'pending_verification', connected_at: new Date().toISOString() });
        return 'ok';
      },
    },
    log: () => {},
    ...overrides,
  };
  return { deps, states, identities, calls };
}

const post = (path: string, auth: string | null, body: unknown) => new Request(`${BASE}${path}`, {
  method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://skillsurger.com', ...(auth ? { authorization: auth } : {}) }, body: JSON.stringify(body),
});
const callback = (state: string, q: string) => new Request(`${BASE}/callback/${state}?${q}`);
const landing = (r: Response) => new URL(r.headers.get('location')!).searchParams.get('connect');

async function start(w: ReturnType<typeof world>, auth = 'Bearer a') {
  const r = await handle(post('/start', auth, { site: 'jobs.example.com' }), w.deps);
  const body = await r.json();
  return { r, body, state: [...w.states.keys()].at(-1)! };
}

Deno.test('disabled flag hides everything', async () => {
  const w = world({ enabled: false });
  assertEquals((await handle(post('/start', 'Bearer a', { site: 'jobs.example.com' }), w.deps)).status, 404);
  assertEquals(landing(await handle(callback('0'.repeat(32), 'identity_id=ident-a&status=success'), w.deps)), 'unavailable');
});

Deno.test('start requires sign-in and a configured site; stores only the token hash', async () => {
  const w = world();
  assertEquals((await handle(post('/start', null, { site: 'jobs.example.com' }), w.deps)).status, 401);
  assertEquals((await handle(post('/start', 'Bearer a', { site: 'evil.example.com' }), w.deps)).status, 400);
  const { r, body, state } = await start(w);
  assertEquals(r.status, 200);
  assertEquals(body.redirect_url, 'https://app.anchorbrowser.io/identity/create?token=raw-token');
  assertEquals(w.states.get(state)!.anchor_token, 'hash-1');
  assert(w.calls[0].endsWith(`/callback/${state}`), 'callback URL carries the state in the path');
});

Deno.test('callback binds the identity as pending_verification, tags it, and is single-use', async () => {
  const w = world();
  const { state } = await start(w);
  const r = await handle(callback(state, 'identity_id=ident-a&status=success'), w.deps);
  assertEquals(r.status, 302);
  assertEquals(landing(r), 'pending_verification');
  assertEquals(w.identities.length, 1);
  assertEquals(w.identities[0].status, 'pending_verification');
  assertEquals(w.identities[0].user_id, A);
  assert(w.calls.includes(`meta:ident-a:skillsurger:${A}`));
  assertEquals(landing(await handle(callback(state, 'identity_id=ident-a&status=success'), w.deps)), 'expired', 'replay does nothing');
  assertEquals((await handle(post('/start', 'Bearer a', { site: 'jobs.example.com' }), w.deps)).status, 409, 'already connected');
});

Deno.test('S15: an identity already claimed by another user cannot be claimed', async () => {
  const w = world();
  const a = await start(w, 'Bearer a');
  await handle(callback(a.state, 'identity_id=ident-a&status=success'), w.deps);
  const b = await start(w, 'Bearer b');
  assertEquals(landing(await handle(callback(b.state, 'identity_id=ident-a&status=success'), w.deps)), 'failed');
  assertEquals(w.identities.filter(i => i.user_id === B).length, 0);
});

Deno.test('callback rejects identities outside our application, unknown ids, bad params and unknown state', async () => {
  const w = world();
  let s = (await start(w)).state;
  assertEquals(landing(await handle(callback(s, 'identity_id=ident-other-app&status=success'), w.deps)), 'failed');
  s = (await start(w)).state;
  assertEquals(landing(await handle(callback(s, 'identity_id=does-not-exist&status=success'), w.deps)), 'failed');
  s = (await start(w)).state;
  assertEquals(landing(await handle(callback(s, 'identity_id=ident-a&status=error'), w.deps)), 'failed');
  assertEquals(landing(await handle(callback('f'.repeat(32), 'identity_id=ident-a&status=success'), w.deps)), 'expired');
  assertEquals(landing(await handle(callback('not-a-state', 'identity_id=ident-a&status=success'), w.deps)), 'invalid');
  assertEquals(w.identities.length, 0);
});

Deno.test('expired state is refused', async () => {
  const w = world();
  const { state } = await start(w);
  w.states.get(state)!.expires_at = new Date(Date.now() - 1000).toISOString();
  assertEquals(landing(await handle(callback(state, 'identity_id=ident-a&status=success'), w.deps)), 'expired');
});

Deno.test('disconnect removes the identity at Anchor and here; reconnect then works', async () => {
  const w = world();
  await handle(callback((await start(w)).state, 'identity_id=ident-a&status=success'), w.deps);
  const r = await handle(post('/disconnect', 'Bearer a', { site: 'jobs.example.com' }), w.deps);
  assertEquals((await r.json()).removed, 1);
  assert(w.calls.includes('delete:ident-a'));
  assertEquals(w.identities.length, 0);
  assertEquals(landing(await handle(callback((await start(w)).state, 'identity_id=ident-b&status=success'), w.deps)), 'pending_verification');
});

Deno.test('disallowed browser origin is refused', async () => {
  const w = world();
  const req = new Request(`${BASE}/start`, { method: 'POST', headers: { origin: 'https://evil.example', authorization: 'Bearer a', 'content-type': 'application/json' }, body: '{"site":"jobs.example.com"}' });
  assertEquals((await handle(req, w.deps)).status, 403);
});
