// Anchor connect flow (master plan Part B section 6). Pure request handling; I/O is injected.
//
//   GET  /sites             signed in   -> job boards configured in ANCHOR_APPLICATIONS + this user's connections
//   POST /start {site}      signed in   -> { redirect_url, expires_at } (Anchor hosted sign-in)
//   GET  /callback/{state}  browser redirect from Anchor (?identity_id=&status=success), no session
//   POST /disconnect {site} signed in   -> removes the connection here and at Anchor
//
// Ownership gate (plan section 6, BLOCKED INTEGRATION GATE): Anchor's identity record carries no
// reference to the token that created it, so the callback's identity_id is an unverified claim.
// We bind it as far as the API allows (single-use state in the path, identity must exist under our
// application, must not be claimed by anyone else) and store it as `pending_verification`.
// Nothing here ever sets a connection to `active`.

export interface ConnectRow { id: string; site: string; status: string; anchor_identity_id: string; connected_at: string }
export interface ConsumedState { user_id: string; product: string; site: string; anchor_app_id: string }

export interface Deps {
  enabled: boolean;
  siteUrl: string;            // where the user lands after the callback, e.g. https://skillsurger.com
  callbackBase: string;       // .../functions/v1/anchor-connect/callback
  allowedOrigins: string[];
  userFromRequest(request: Request): Promise<string | null>;
  sites(): Record<string, string>;
  randomState(): string;
  anchor: {
    createIdentityToken(applicationId: string, callbackUrl: string): Promise<{ token: string; expiresAt: string | null; tokenHash: string | null }>;
    getIdentity(identityId: string): Promise<{ id: string }>;
    applicationHasIdentity(applicationId: string, identityId: string): Promise<boolean>;
    updateIdentityMetadata(identityId: string, name: string, metadata: Record<string, unknown>): Promise<void>;
    deleteIdentity(identityId: string): Promise<void>;
  };
  db: {
    connections(userId: string): Promise<ConnectRow[]>;
    insertConnectState(row: { state: string; user_id: string; product: string; site: string; anchor_app_id: string; anchor_token: string; expires_at: string }): Promise<void>;
    consumeState(state: string): Promise<ConsumedState | null>;
    identityClaimed(anchorIdentityId: string): Promise<boolean>;
    removeConnection(userId: string, site: string): Promise<void>;
    clearInactive(userId: string, site: string): Promise<void>;
    insertIdentity(row: { user_id: string; product: string; site: string; anchor_identity_id: string }): Promise<'ok' | 'conflict'>;
  };
  log(entry: Record<string, unknown>): void;
}

const PRODUCT = 'skillsurger';
const STATE_RE = /^[a-f0-9]{32}$/;
const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

export async function handle(request: Request, deps: Deps): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^.*\/anchor-connect/, '') || '/';

  // ---- browser redirect from Anchor (no session; the state in the path identifies the attempt) ----
  const callback = path.match(/^\/callback\/([^/]+)$/);
  if (callback && request.method === 'GET') return await handleCallback(callback[1], url, deps);

  const origin = request.headers.get('origin') || '';
  const allowOrigin = deps.allowedOrigins.includes(origin) ? origin : deps.allowedOrigins[0];
  const headers = {
    'Access-Control-Allow-Origin': allowOrigin, Vary: 'Origin', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Content-Type': 'application/json',
  };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !deps.allowedOrigins.includes(origin)) return json({ error: { code: 'origin_not_allowed' } }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!deps.enabled) return json({ error: { code: 'connect_disabled', message: 'Job board connections are not available yet.' } }, 404);

  const userId = await deps.userFromRequest(request);
  if (!userId) return json({ error: { code: 'not_signed_in', message: 'Please sign in again.' } }, 401);
  const sites = deps.sites();

  if (path === '/sites' && request.method === 'GET') {
    const rows = await deps.db.connections(userId);
    return json({
      sites: Object.keys(sites).sort(),
      connections: rows.filter(r => r.status !== 'deleted').map(r => ({ site: r.site, status: r.status, connected_at: r.connected_at })),
    });
  }

  if (request.method !== 'POST') return json({ error: { code: 'not_found' } }, 404);
  let body: { site?: unknown };
  try { body = await request.json(); } catch { return json({ error: { code: 'invalid_json' } }, 400); }
  const site = typeof body?.site === 'string' ? body.site : '';
  const applicationId = sites[site];
  if (!applicationId) return json({ error: { code: 'unknown_site', message: 'That job board is not available.' } }, 400);

  if (path === '/start') {
    const existing = (await deps.db.connections(userId)).find(r => r.site === site && ['pending_verification', 'active'].includes(r.status));
    if (existing) return json({ error: { code: 'already_connected', message: 'This job board is already connected.' } }, 409);
    const state = deps.randomState();
    const callbackUrl = `${deps.callbackBase}/${state}`;
    const token = await deps.anchor.createIdentityToken(applicationId, callbackUrl);
    const anchorExpiry = token.expiresAt ? Date.parse(token.expiresAt) : NaN;
    const expiresAt = new Date(Math.min(Number.isFinite(anchorExpiry) ? anchorExpiry : Infinity, Date.now() + 15 * 60_000)).toISOString();
    // Only the token hash is kept: the raw token is needed once, in the redirect below.
    await deps.db.insertConnectState({ state, user_id: userId, product: PRODUCT, site, anchor_app_id: applicationId, anchor_token: token.tokenHash || 'not-provided', expires_at: expiresAt });
    deps.log({ code: 'connect_started', site });
    return json({ redirect_url: `https://app.anchorbrowser.io/identity/create?token=${encodeURIComponent(token.token)}`, expires_at: expiresAt });
  }

  if (path === '/disconnect') {
    const rows = (await deps.db.connections(userId)).filter(r => r.site === site && r.status !== 'deleted');
    for (const row of rows) await deps.anchor.deleteIdentity(row.anchor_identity_id);
    await deps.db.removeConnection(userId, site);
    deps.log({ code: 'connect_removed', site });
    return json({ removed: rows.length });
  }

  return json({ error: { code: 'not_found' } }, 404);
}

async function handleCallback(state: string, url: URL, deps: Deps): Promise<Response> {
  const land = (result: string) => Response.redirect(`${deps.siteUrl}/dashboard?section=career&connect=${result}`, 302);
  if (!deps.enabled) return land('unavailable');
  if (!STATE_RE.test(state)) return land('invalid');
  // Consume first: the state is single-use even when the rest fails, so a replayed callback does nothing.
  const consumed = await deps.db.consumeState(state);
  if (!consumed) return land('expired');

  const identityId = url.searchParams.get('identity_id') || '';
  if (url.searchParams.get('status') !== 'success' || !ID_RE.test(identityId)) {
    deps.log({ code: 'connect_callback_rejected', reason: 'bad_params', site: consumed.site });
    return land('failed');
  }
  try {
    await deps.anchor.getIdentity(identityId); // must exist
    if (!(await deps.anchor.applicationHasIdentity(consumed.anchor_app_id, identityId))) {
      deps.log({ code: 'connect_callback_rejected', reason: 'identity_not_in_application', site: consumed.site });
      return land('failed');
    }
    if (await deps.db.identityClaimed(identityId)) {
      deps.log({ code: 'connect_callback_rejected', reason: 'identity_already_claimed', site: consumed.site });
      return land('failed');
    }
    await deps.db.clearInactive(consumed.user_id, consumed.site); // an earlier deleted/failed row for this site; a live one makes the insert conflict
    const inserted = await deps.db.insertIdentity({ user_id: consumed.user_id, product: consumed.product, site: consumed.site, anchor_identity_id: identityId });
    if (inserted === 'conflict') return land('failed');
    // Tag the identity at Anchor so an operator can match it to our user during manual verification.
    await deps.anchor.updateIdentityMetadata(identityId, `skillsurger:${consumed.user_id}`, {
      externalUserId: consumed.user_id, product: consumed.product, site: consumed.site, connectState: state, connectedAt: new Date().toISOString(),
    }).catch(() => deps.log({ code: 'connect_metadata_failed', site: consumed.site }));
    deps.log({ code: 'connect_pending_verification', site: consumed.site });
    return land('pending_verification');
  } catch {
    deps.log({ code: 'connect_callback_failed', site: consumed.site });
    return land('failed');
  }
}
