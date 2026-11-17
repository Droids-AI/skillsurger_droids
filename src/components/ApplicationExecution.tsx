import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Run { state: string; reason: string | null; result: { confirmation_reference?: string; method?: string; evidence_reference?: string } | null; cost_credits: number | null }
interface Context { run: Run | null; enabled: boolean; consent: boolean; connection_verified: boolean; budget_enabled: boolean }
const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skillsurger-automation`;
const REASONS: Record<string, string> = {
  reconnect_required: 'Sign in to the job board again. This application will not be submitted again automatically.',
  additional_answers_required: 'The form needs an answer we do not have. Review the application on the job board.',
  manual_handoff_required: 'Complete this application on the job board yourself.',
  dispatch_outcome_unknown: 'The browser request may have started. We are checking its outcome before taking any further action.',
  submission_outcome_unverified: 'We do not have a confirmed submission receipt. Check the job board before applying again.',
  provider_status_unavailable: 'The browser service could not return a status. Check again shortly.',
  dispatch_preconditions_changed: 'An approval, CV, connection or budget changed before the run. Nothing was dispatched by this run.',
  application_context_unavailable: 'We could not load the application details. Check the job board if a run had already started.',
  automation_paused: 'Browser applications are paused.',
  reconciliation_limit_reached: 'Automatic checks have stopped. Contact support to verify the outcome; this application will not be submitted again automatically.',
};
const ERRORS: Record<string, string> = {
  consent_required: 'Confirm permission to send your approved details to Anchor.',
  verified_connection_required: 'Connect this job board account and wait for ownership verification.',
  budget_required: 'Browser usage has not been enabled for your account.',
  weekly_budget_exhausted: 'Your weekly browser usage allowance is used up.',
  job_already_dispatched: 'A browser application already exists for this job. Check its result before applying again.',
  approval_required: 'This approval expired or was withdrawn. Review a fresh application before continuing.',
  cv_or_job_changed: 'Your CV or job status changed. Prepare and review the application again.',
  board_changed: 'The job board connection changed. Prepare and review the application again.',
  active_plan_required: 'An active trial or plan is required.',
  automation_paused: 'Browser applications are paused.',
};
async function call(route: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in again.');
  const response = await fetch(`${FN}${route}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(ERRORS[data.error] || 'Could not check this application. Please try again.');
  return data;
}
export default function ApplicationExecution({ actionId, actionState, onUpdate }: { actionId: string; actionState: string; onUpdate: () => Promise<void> }) {
  const [context, setContext] = useState<Context | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => { setContext(await call('/context', { actionId })); }, [actionId]);
  useEffect(() => {
    setContext(null); setError('');
    let alive = true;
    void call('/context', { actionId }).then(data => { if (alive) setContext(data); })
      .catch(() => { if (alive) setError('Browser status is unavailable. Refresh before taking further action.'); });
    return () => { alive = false; };
  }, [actionId]);
  const change = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await fn(); await load(); await onUpdate(); window.dispatchEvent(new Event('saved-jobs-changed')); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update this application.'); }
    finally { setBusy(false); }
  };
  const changeConsent = (checked: boolean) => {
    setContext(previous => previous ? { ...previous, consent: checked } : previous);
    void change(async () => {
      try { await call('/consent', { enabled: checked, policyVersion: '2026-11-17' }); }
      catch (error) { setContext(previous => previous ? { ...previous, consent: !checked } : previous); throw error; }
    });
  };
  const run = context?.run;
  // While a run is in flight, check every 10 seconds (up to ~5 minutes). When it finishes, refresh the job list too.
  const runState = run?.state;
  useEffect(() => {
    if (!runState || !['queued', 'launching', 'running'].includes(runState)) return;
    let ticks = 0;
    const timer = setInterval(() => {
      if (++ticks > 30) { clearInterval(timer); return; }
      void call('/refresh', { actionId }).then((data) => {
        setContext((previous) => previous ? { ...previous, run: data.run } : previous);
        if (data.run && !['queued', 'launching', 'running'].includes(data.run.state)) {
          void onUpdate(); window.dispatchEvent(new Event('saved-jobs-changed'));
        }
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, [runState, actionId, onUpdate]);
  const status = run?.state === 'done' ? run.result?.method === 'operator_reconciliation' ? 'Application outcome verified by support' : 'Application confirmed by the job board'
    : run?.state === 'reconciling' ? 'Checking whether the application was submitted'
    : run?.state === 'needs_you' ? 'Your attention is needed'
    : run?.state === 'failed' ? 'Browser run closed'
    : run ? 'Browser application in progress' : actionState === 'needs_approval' ? 'Review the details above before approving' : 'Ready to start after the checks below';
  const btn = 'inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
  return <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
    <p role="status" aria-atomic="true" className="font-medium text-gray-900">{busy ? 'Checking your application…' : status}</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {run?.reason && <p className="text-gray-700">{REASONS[run.reason] || 'Check this application before taking another action.'}</p>}
    {run?.result?.confirmation_reference && <p className="break-words text-gray-700">Confirmation: {run.result.confirmation_reference}</p>}
    {context && !run && <>
      {!context.enabled && <p>Browser applications are paused. Your approval will not start a run.</p>}
      {!context.connection_verified && <p>Connect this job board under “Job board accounts”. Ownership must be verified before a run can start.</p>}
      {!context.budget_enabled && <p>Browser usage needs to be enabled for your account before a run can start.</p>}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-gray-700">
        <input type="checkbox" checked={context.consent} disabled={busy} className="mt-1 h-5 w-5 shrink-0"
          onChange={event => changeConsent(event.target.checked)} />
        <span>I allow Skillsurger to send my approved CV and application details to Anchor Browser and this job board to carry out applications I approve. <a href="/privacy" target="_blank" rel="noreferrer" className="underline">Privacy details</a>.</span>
      </label>
      {actionState === 'queued' && <button type="button" disabled={busy || !context.enabled || !context.consent || !context.connection_verified || !context.budget_enabled}
        onClick={() => void change(() => call('/run', { actionId }))} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>Start approved application</button>}
    </>}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => void change(() => call('/refresh', { actionId }))} className={`${btn} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}>Check status</button>
      {context?.consent && <button type="button" disabled={busy} onClick={() => void change(() => call('/consent', { enabled: false, policyVersion: '2026-11-17' }))}
        className={`${btn} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}>Withdraw browser permission</button>}
    </div>
    {run && context?.consent && <p className="text-xs text-gray-600">Withdrawing permission blocks new runs. A task already sent to the browser may finish; check its status here.</p>}
  </div>;
}
