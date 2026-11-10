// Minimal Anchor Browser REST client (https://api.anchorbrowser.io, `anchor-api-key` header).
// Secret: ANCHOR_API_KEY. Only the calls the connect flow needs.

const BASE = 'https://api.anchorbrowser.io';

export class AnchorError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

async function call(path: string, init: RequestInit = {}): Promise<any> {
  const key = Deno.env.get('ANCHOR_API_KEY');
  if (!key) throw new AnchorError(503, 'anchor_not_configured');
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'anchor-api-key': key, 'Content-Type': 'application/json', ...(init.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new AnchorError(response.status, response.status === 404 ? 'anchor_not_found' : 'anchor_request_failed');
  // Anchor wraps most responses as { data: ... }
  return body && typeof body === 'object' && 'data' in body ? body.data : body;
}

/** One-time token (15 min) that starts Anchor's hosted identity creation for an application. */
export async function createIdentityToken(applicationId: string, callbackUrl: string): Promise<{ token: string; expiresAt: string | null; tokenHash: string | null }> {
  const data = await call(`/v1/applications/${encodeURIComponent(applicationId)}/tokens`, {
    method: 'POST', body: JSON.stringify({ callbackUrl }),
  });
  if (typeof data?.token !== 'string') throw new AnchorError(502, 'anchor_token_missing');
  return { token: data.token, expiresAt: data.expiresAt ?? null, tokenHash: data.tokenHash ?? null };
}

export async function getIdentity(identityId: string): Promise<{ id: string; status?: string; created_at?: string; metadata?: Record<string, unknown> }> {
  return await call(`/v1/identities/${encodeURIComponent(identityId)}`);
}

/** True when the identity is listed under this application (it was created for our application). */
export async function applicationHasIdentity(applicationId: string, identityId: string): Promise<boolean> {
  const data = await call(`/v1/applications/${encodeURIComponent(applicationId)}/identities`);
  const list = Array.isArray(data) ? data : Array.isArray(data?.identities) ? data.identities : [];
  return list.some((identity: { id?: string }) => identity?.id === identityId);
}

export async function updateIdentityMetadata(identityId: string, name: string, metadata: Record<string, unknown>): Promise<void> {
  await call(`/v1/identities/${encodeURIComponent(identityId)}`, { method: 'PUT', body: JSON.stringify({ name, metadata }) });
}

export async function deleteIdentity(identityId: string): Promise<void> {
  try {
    await call(`/v1/identities/${encodeURIComponent(identityId)}`, { method: 'DELETE' });
  } catch (error) {
    if (!(error instanceof AnchorError && error.status === 404)) throw error; // already gone is fine
  }
}

/** Configured job boards: ANCHOR_APPLICATIONS = {"site.example.com":"<anchor application id>", ...} */
export function configuredSites(): Record<string, string> {
  try {
    const parsed = JSON.parse(Deno.env.get('ANCHOR_APPLICATIONS') || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
