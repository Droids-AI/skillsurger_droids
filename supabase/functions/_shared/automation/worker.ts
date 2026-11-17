import { taskInput, taskOutcome, type ApplicationPayload, type TaskStatus } from './contracts.ts';

export interface Run {
  id: string; action_id: string; user_id: string; site: string; task_id: string;
  state: string; anchor_run_id: string | null; lock_gen: number;
}
export interface WorkerDeps {
  enabled: boolean;
  submitAuthorizationUrl: string;
  lease(runId: string, worker: string): Promise<Run | null>;
  begin(run: Run, worker: string, tokenHash: string): Promise<boolean>;
  context(run: Run): Promise<{ payload: ApplicationPayload; payload_hash: string; identity_id: string }>;
  update(run: Run, worker: string, state: string, anchorRunId: string | null, reason: string | null, result: Record<string, string> | null): Promise<boolean>;
  provider: {
    runTask(taskId: string, identityId: string, inputs: Record<string, string>): Promise<TaskStatus>;
    taskStatus(runId: string): Promise<TaskStatus>;
  };
}
export async function work(runId: string, worker: string, deps: WorkerDeps): Promise<string> {
  // Disabling stops new dispatches, while existing tasks can still be reconciled.
  const run = await deps.lease(runId, worker);
  if (!run) return 'not_due';
  const write = async (state: string, providerId: string | null, reason: string | null, result: Record<string, string> | null = null) =>
    (await deps.update(run, worker, state, providerId, reason, result)) ? state : 'lease_lost';
  if (run.state === 'queued' && !deps.enabled) return await write('failed', null, 'automation_paused');
  let context: Awaited<ReturnType<WorkerDeps['context']>>;
  try { context = await deps.context(run); }
  catch { return await write(run.state === 'queued' ? 'failed' : 'reconciling', run.anchor_run_id, 'application_context_unavailable'); }
  let status: TaskStatus;
  if (run.state === 'queued') {
    let inputs: Record<string, string>;
    try {
      inputs = taskInput(run.action_id, context.payload_hash, context.payload);
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b=>b.toString(16).padStart(2,'0')).join('');
      const tokenHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
      inputs.submit_authorization_url=deps.submitAuthorizationUrl;
      inputs.submit_authorization_token=token;
      inputs.local_run_id=run.id;
      if (!await deps.begin(run, worker, tokenHash)) return await write('failed', null, 'dispatch_preconditions_changed');
    } catch { return await write('failed', null, 'dispatch_preconditions_changed'); }
    // begin persisted the launching tombstone BEFORE the only external POST.
    // Even a timeout/HTTP failure is ambiguous: do not start this action again.
    try { status = await deps.provider.runTask(run.task_id, context.identity_id, inputs); }
    catch { return await write('reconciling', null, 'dispatch_outcome_unknown'); }
  } else {
    if (!run.anchor_run_id) return await write('reconciling', null, 'dispatch_outcome_unknown');
    try { status = await deps.provider.taskStatus(run.anchor_run_id); }
    catch { return await write('reconciling', run.anchor_run_id, 'provider_status_unavailable'); }
    if (status.run_id !== run.anchor_run_id) return await write('reconciling', run.anchor_run_id, 'provider_run_mismatch');
  }
  const outcome = taskOutcome(status, context.payload, run.action_id, context.payload_hash);
  return await write(outcome.state, status.run_id, outcome.reason, outcome.result);
}
