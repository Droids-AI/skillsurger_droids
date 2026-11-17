// Minimal Anchor Browser REST client (https://api.anchorbrowser.io, `anchor-api-key` header).
// Secret: ANCHOR_API_KEY. Only the calls the connect flow needs.
import type { TaskStatus } from './automation/contracts.ts';

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
    signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new AnchorError(response.status, response.status === 404 ? 'anchor_not_found' : response.status === 401 || response.status === 403 ? 'anchor_auth_rejected' : 'anchor_request_failed');
  if (body === null && !(init.method === 'DELETE' && response.status === 204)) throw new AnchorError(502, 'anchor_invalid_response');
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

function validTaskStatus(value: any): TaskStatus {
  if (typeof value?.run_id !== 'string' || !/^[A-Za-z0-9_-]{1,150}$/.test(value.run_id) ||
    !['queued','running','success','failure','timeout','cancelled'].includes(value.status)) throw new AnchorError(502,'anchor_invalid_task_response');
  return { run_id: value.run_id, status: value.status, result: value.result && typeof value.result === 'object' ? value.result : undefined };
}
// Pinned code tasks: board task_id "code:<task uuid>:<version number>". Run ids are "code_<task uuid>_<execution uuid>".
const CODE_TASK = /^code:([0-9a-f-]{36}):(\d{1,6})$/i;
const CODE_RUN = /^code_([0-9a-f-]{36})_([0-9a-f-]{36})$/i;
export function parseCodeTask(taskId: string) {
  const m = CODE_TASK.exec(taskId); return m ? { id: m[1], version: m[2] } : null;
}
function codeStatus(taskId: string, execution: any): TaskStatus {
  const status = String(execution?.status || '');
  let result: Record<string, unknown> | undefined;
  if (typeof execution?.output === 'string' && execution.output) {
    try { const parsed = JSON.parse(execution.output); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) result = parsed; } catch { /* not a receipt */ }
  }
  return validTaskStatus({ run_id: `code_${taskId}_${execution?.id}`, status, result });
}

/** Tasks: no retries on this POST; the caller owns the dispatch tombstone. */
export async function runTask(taskId: string, identityId: string, inputs: Record<string,string>): Promise<TaskStatus> {
  const code = parseCodeTask(taskId);
  if (code) {
    const prefixed = Object.fromEntries(Object.entries(inputs).map(([k, v]) => ['ANCHOR_' + k.toUpperCase(), v]));
    const started = await call('/v1/task/run', { method: 'POST', body: JSON.stringify({
      taskId: code.id, version: code.version, async: true, cleanupSessions: true, inputs: prefixed,
    }) });
    if (typeof started?.executionResultId !== 'string') throw new AnchorError(502, 'anchor_invalid_task_response');
    return validTaskStatus({ run_id: `code_${code.id}_${started.executionResultId}`, status: 'queued' });
  }
  return validTaskStatus(await call(`/v2/tasks/${encodeURIComponent(taskId)}/run`, {
    method:'POST', body:JSON.stringify({ input_params:inputs,identity_id:identityId,identity_skip_validation:false,cleanup_sessions:true,sync:false }),
  }));
}
export async function taskStatus(runId: string): Promise<TaskStatus> {
  const code = CODE_RUN.exec(runId);
  if (code) return codeStatus(code[1], await call(`/v1/task/${code[1]}/executions/${code[2]}`));
  return validTaskStatus(await call(`/v2/tasks/runs/${encodeURIComponent(runId)}/status`));
}

/** Operator-only: create (or reuse by name) a code task and deploy a new pinned version. Returns "code:<id>:<version>". */
export async function provisionCodeTask(name: string, codeBase64: string, description: string, domainAllowlist: string[]): Promise<string> {
  const browserConfiguration = { recording: { active: false }, timeout: { max_duration: 5, idle_timeout: 2 }, domain_allowlist: domainAllowlist };
  const list = await call('/v1/task?limit=100').catch(() => null);
  const tasks: any[] = Array.isArray(list) ? list : Array.isArray(list?.tasks) ? list.tasks : [];
  let task = tasks.find((t) => t?.name === name && !t?.deleted);
  if (!task) task = await call('/v1/task', { method: 'POST', body: JSON.stringify({ name, language: 'typescript', description, code: codeBase64, browserConfiguration }) });
  const version = await call(`/v1/task/${encodeURIComponent(task.id)}/deploy`, { method: 'POST', body: JSON.stringify({ code: codeBase64, language: 'typescript', description, browserConfiguration }) });
  if (!/^\d+$/.test(String(version?.version))) throw new AnchorError(502, 'anchor_invalid_task_response');
  return `code:${task.id}:${version.version}`;
}

/** Configured job boards: ANCHOR_APPLICATIONS = {"site.example.com":"<anchor application id>", ...} */
export function configuredSites(): Record<string, string> {
  return parseConfiguredSites(Deno.env.get('ANCHOR_APPLICATIONS') || '{}');
}

export function parseConfiguredSites(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const sites: Record<string, string> = {};
    for (const [site, id] of Object.entries(parsed)) {
      if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(site) &&
        typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id)) sites[site] = id;
    }
    return sites;
  } catch {
    return {};
  }
}

/** Operator-only probe. GETs only: never opens a browser, creates an identity or runs a task. */
export async function readiness(): Promise<Record<string, unknown>> {
  const configured = configuredSites();
  const configuration = {
    api_key: !!Deno.env.get('ANCHOR_API_KEY'),
    webhook_secret: !!Deno.env.get('ANCHOR_WEBHOOK_SECRET'),
    connect_enabled: Deno.env.get('FF_SKILLSURGER_CONNECT') === 'true',
    sites: Object.keys(configured).sort(),
  };
  if (!configuration.api_key) return { configuration, authentication: 'unconfigured', pilot_ready: false };
  const probe = async (path: string) => {
    try { return { ok: true as const, data: await call(path) }; }
    catch (error) {
      return { ok: false as const, code: error instanceof AnchorError ? error.code : 'anchor_unreachable', http_status: error instanceof AnchorError ? error.status : null };
    }
  };
  const [billing, apps] = await Promise.all([probe('/v1/billing'), probe('/v1/applications')]);
  const list = apps.ok && Array.isArray(apps.data?.applications) ? apps.data.applications : null;
  const safeHost = (value: unknown) => { try { return new URL(String(value)).hostname; } catch { return null; } };
  return {
    configuration,
    billing: billing.ok ? {
      ok: true, tier: typeof billing.data?.tier === 'string' ? billing.data.tier : null,
      credits: typeof billing.data?.credits === 'number' ? billing.data.credits : null,
      included_credits: typeof billing.data?.included_credits === 'number' ? billing.data.included_credits : null,
      credits_used: typeof billing.data?.credits_used === 'number' ? billing.data.credits_used : null,
      cost_limit: typeof billing.data?.cost_limit === 'number' ? billing.data.cost_limit : null,
    } : billing,
    applications: apps.ok ? {
      ok: list !== null,
      available: list?.map((app: { url?: unknown }) => ({ host: safeHost(app.url) })) ?? [],
      configured: Object.entries(configured).map(([site, id]) => ({ site, found: !!list?.some((app: { id?: string }) => app.id === id) })),
    } : apps,
    // These remain separate gates even when the provider accepts the key and the account is paid.
    pilot_ready: false,
    remaining_gates: ['job_board_and_terms_verified', 'identity_ownership_verified', 'owner_usage_budget', 'test_account_walkthrough'],
  };
}
