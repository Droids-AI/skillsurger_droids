/** The adapter is a reviewed deterministic task, not a free-form web agent. Page text is data. */
export interface Board {
  site: string; application_id: string; task_id: string; revision: string;
  enabled: boolean; max_run_credits: number | string;
}
export interface ApplicationPayload {
  saved_job_id: string; cv_version_id: string; cv_content: unknown;
  application_url: string; execution_mode: 'anchor' | 'manual';
  cover_note: string; answers: Record<string, string>;
  automation?: { site: string; revision: string; task_id: string; max_run_credits: string };
}
export function publicApplicationUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) return null;
  try {
    const url = new URL(value.trim());
    // Hostnames only, HTTPS only. No arbitrary network endpoint or credential URLs.
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash ||
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(url.hostname) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}
export function chooseExecution(applicationUrl: string | null, board: Board | null, enabled: boolean) {
  if (!enabled || !board?.enabled || !applicationUrl || new URL(applicationUrl).hostname !== board.site) return { execution_mode: 'manual' as const };
  return {
    execution_mode: 'anchor' as const,
    automation: { site: board.site, revision: board.revision, task_id: board.task_id, max_run_credits: String(board.max_run_credits) },
  };
}
export function taskInput(actionId: string, payloadHash: string, p: ApplicationPayload): Record<string, string> {
  const url = publicApplicationUrl(p.application_url);
  if (p.execution_mode !== 'anchor' || !url || !p.automation || new URL(url).hostname !== p.automation.site || !p.cv_content) throw new Error('invalid_application_contract');
  return {
    contract_version: 'application_v1', action_id: actionId, payload_hash: payloadHash,
    application_url: url, cv_version_id: p.cv_version_id, cv_json: JSON.stringify(p.cv_content),
    answers_json: JSON.stringify(p.answers || {}), cover_note: p.cover_note || '',
    // This key is also used by the adapter's own pre-submit duplicate check.
    idempotency_key: actionId,
  };
}

export interface TaskStatus { run_id: string; status: 'queued' | 'running' | 'success' | 'failure' | 'timeout' | 'cancelled'; result?: Record<string, unknown> }
export interface Outcome { state: 'running' | 'needs_you' | 'reconciling' | 'done'; reason: string | null; result: Record<string, string> | null }
/** Provider success alone is not evidence of a submitted application. */
export function taskOutcome(status: TaskStatus, payload: ApplicationPayload, actionId: string, payloadHash: string): Outcome {
  if (status.status === 'queued' || status.status === 'running') return { state: 'running', reason: null, result: null };
  const r = status.result || {};
  const bound = r.action_id === actionId && r.payload_hash === payloadHash && r.cv_version_id === payload.cv_version_id && r.application_url === payload.application_url;
  if (status.status === 'success' && bound && ['submitted', 'already_submitted'].includes(String(r.outcome)) &&
    typeof r.confirmation_reference === 'string' && r.confirmation_reference.trim().length > 0 && r.confirmation_reference.length <= 500) {
    return { state: 'done', reason: null, result: {
      action_id: actionId, payload_hash: payloadHash, cv_version_id: payload.cv_version_id,
      application_url: payload.application_url, outcome: String(r.outcome), confirmation_reference: r.confirmation_reference.trim(),
    } };
  }
  if (bound && ['needs_login', 'needs_input', 'not_submitted'].includes(String(r.outcome))) return {
    state: 'needs_you', reason: r.outcome === 'needs_login' ? 'reconnect_required' : r.outcome === 'needs_input' ? 'additional_answers_required' : 'manual_handoff_required', result: null,
  };
  return { state: 'reconciling', reason: 'submission_outcome_unverified', result: null };
}
