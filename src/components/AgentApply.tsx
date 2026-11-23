import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Check, AlertCircle, Eye, Globe, Hand, KeyRound, Loader2, MousePointerClick, Send, Square, Type, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

// AI browser agent (skillsurger-browser-agent): applies in a secure Anchor browser on any site.
// The user watches live, answers questions (login, OTP, new account), takes over for CAPTCHAs
// and approves the final submit. Hidden unless the feature is on for this user.

interface Field { name: string; label: string; type: 'text' | 'email' | 'password' | 'otp' | 'long_text' | 'choice'; options?: string[] }
interface Step { id: number; kind: string; summary: string; page_url: string | null; page_title: string | null; created_at: string }
interface Request { id: string; kind: 'login' | 'otp' | 'new_account' | 'question' | 'takeover' | 'submit_review'; message: string; fields: unknown[]; screenshot_url: string | null }
interface Run {
  id: string; status: string; activity: string | null; current_url: string | null; current_title: string | null;
  step_count: number; max_steps: number; error: string | null; result: { message?: string; confirmation?: string | null } | null;
  live_view_url: string | null; last_screenshot_url: string | null; steps: Step[]; request: Request | null;
}
interface Context { enabled: boolean; allowed: boolean; consent: { ok: boolean; linkedin: boolean }; linkedin_url: boolean; run: Run | null }

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skillsurger-browser-agent`;
const LIVE = ['starting', 'working', 'waiting_user', 'ready_to_submit'];
const ERRORS: Record<string, string> = {
  consent_required: 'Tick the permission box first.',
  linkedin_consent_required: 'This job is on LinkedIn. Tick the LinkedIn box to let the agent use your LinkedIn account.',
  approval_required: 'Approve this application above first.',
  active_plan_required: 'An active trial or plan is required.',
  weekly_limit_reached: 'You have used this week\'s AI agent applications.',
  run_already_active: 'The agent is already working on another application. Wait for it to finish or stop it.',
  application_url_required: 'Add the job\'s application link (https) when preparing the application.',
  agent_paused: 'The AI agent is paused right now.',
  agent_not_enabled: 'The AI agent is not enabled for your account yet.',
  answer_required: 'Fill in at least one field.',
  request_not_found: 'That question was already answered.',
};
async function call(route: string, body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in again.');
  const response = await fetch(`${FN}${route}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(ERRORS[data.error] || 'Something went wrong. Please try again.');
  return data;
}
const host = (u: string | null) => { try { return u ? new URL(u).hostname.replace(/^www\./, '') : ''; } catch { return ''; } };
const STEP_ICON: Record<string, JSX.Element> = {
  navigate: <Globe className="h-4 w-4" />, click: <MousePointerClick className="h-4 w-4" />, type: <Type className="h-4 w-4" />,
  select: <Check className="h-4 w-4" />, upload: <Upload className="h-4 w-4" />, read: <Eye className="h-4 w-4" />,
  ask: <Hand className="h-4 w-4" />, submit: <Send className="h-4 w-4" />, done: <Check className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />, info: <Bot className="h-4 w-4" />,
};
const btn = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
const primary = `${btn} bg-blue-600 text-white hover:bg-blue-700`;
const secondary = `${btn} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
const input = 'w-full min-h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

export default function AgentApply({ actionId, actionState, onUpdate }: { actionId: string; actionState: string; onUpdate: () => Promise<void> }) {
  const [ctx, setCtx] = useState<Context | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const [linkedin, setLinkedin] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [control, setControl] = useState(false); // user is typing in the live browser
  const stepsEnd = useRef<HTMLLIElement>(null);
  const run = ctx?.run ?? null;
  const live = !!run && LIVE.includes(run.status);

  const load = useCallback(async () => {
    const data: Context = await call('/context', { actionId });
    setCtx(data); setConsent(data.consent.ok); setLinkedin(data.consent.linkedin);
  }, [actionId]);
  useEffect(() => { void load().catch(() => setCtx(null)); }, [load]);

  // Live progress: poll every 2.5 seconds while the agent is running.
  const runId = run?.id; const status = run?.status;
  useEffect(() => {
    if (!runId || !status || !LIVE.includes(status)) return;
    const timer = setInterval(() => {
      void call('/state', { runId }).then((d) => {
        setCtx((p) => (p ? { ...p, run: d.run } : p));
        if (!LIVE.includes(d.run.status)) { void onUpdate(); window.dispatchEvent(new Event('saved-jobs-changed')); }
      }).catch(() => {});
    }, 2500);
    return () => clearInterval(timer);
  }, [runId, status, onUpdate]);
  const requestId = run?.request?.id;
  useEffect(() => { setValues({}); setFeedback(''); setControl(run?.request?.kind === 'takeover'); }, [requestId, run?.request?.kind]);
  useEffect(() => { stepsEnd.current?.scrollIntoView({ block: 'nearest' }); }, [run?.steps.length]);

  const act = async (fn: () => Promise<{ run?: Run } | undefined>) => {
    setBusy(true); setError('');
    try { const d = await fn(); if (d?.run) setCtx((p) => (p ? { ...p, run: d.run } : p)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  };
  const start = () => act(async () => {
    if (!ctx?.consent.ok || (ctx.linkedin_url && !ctx.consent.linkedin)) {
      const c = await call('/consent', { enabled: true, linkedin });
      setCtx((p) => (p ? { ...p, consent: c } : p));
    }
    const d = await call('/start', { actionId });
    await onUpdate();
    return d;
  });
  const answer = (body: Record<string, unknown>) => act(() => call('/answer', { runId: run!.id, requestId: run!.request!.id, ...body }));

  if (!ctx || !ctx.enabled || !ctx.allowed) return null;
  const canStart = ['queued', 'needs_you'].includes(actionState) && (!run || ['stopped', 'failed'].includes(run.status));
  if (!run && !canStart) return null;

  return <section aria-label="AI agent application" className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
    <div className="flex items-start gap-2">
      <Bot className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-medium text-gray-900">Let the AI agent apply for you</p>
        <p className="text-sm text-gray-600">It opens the job in a secure browser, signs in or creates an account with your help, fills the form with your approved details and CV, and shows you everything before it submits.</p>
      </div>
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

    {canStart && <div className="space-y-2">
      {run && <p className="rounded-lg bg-white px-3 py-2 text-sm text-gray-700">Last run: {run.activity || run.status}. Nothing was submitted.</p>}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-gray-700">
        <input type="checkbox" checked={consent} disabled={busy} className="mt-1 h-5 w-5 shrink-0" onChange={(e) => setConsent(e.target.checked)} />
        <span>I allow Skillsurger's AI agent to open this job in an Anchor browser and use my approved CV and details there. Page content is processed by Anchor and OpenAI. Passwords and codes I give are hidden from the AI and deleted after the run. <a href="/privacy" target="_blank" rel="noreferrer" className="underline">Privacy details</a>.</span>
      </label>
      {ctx.linkedin_url && <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <input type="checkbox" checked={linkedin} disabled={busy} className="mt-1 h-5 w-5 shrink-0" onChange={(e) => setLinkedin(e.target.checked)} />
        <span><strong>LinkedIn:</strong> LinkedIn's terms do not allow automated tools, and LinkedIn may restrict accounts it detects. I understand the risk and want the agent to use my LinkedIn account.</span>
      </label>}
      <button type="button" className={primary} disabled={busy || !consent || (ctx.linkedin_url && !linkedin)} onClick={() => void start()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}Start AI agent
      </button>
    </div>}

    {run && !canStart && <div className="space-y-3">
      {/* Where we are right now */}
      <div className="rounded-lg bg-white p-3" role="status" aria-live="polite">
        <p className="flex items-center gap-2 font-medium text-gray-900">
          {['working', 'starting'].includes(run.status) ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-600" /> : null}
          <span className="min-w-0 break-words">{run.activity || 'Working…'}</span>
        </p>
        {run.current_url && <p className="mt-1 truncate text-sm text-gray-600" title={run.current_url}>
          On: {run.current_title ? `${run.current_title} · ` : ''}{host(run.current_url)}
        </p>}
        <p className="mt-1 text-xs text-gray-500">Step {run.step_count} of up to {run.max_steps}</p>
      </div>

      {/* The live browser. Interactive only while the user is in control. */}
      {run.live_view_url && <div className="space-y-2">
        <div className={`relative w-full overflow-hidden rounded-lg border bg-gray-900 ${control ? 'border-violet-500 ring-2 ring-violet-300' : 'border-gray-200'}`} style={{ aspectRatio: '16 / 10' }}>
          <iframe title="Live application browser" src={run.live_view_url} className="absolute inset-0 h-full w-full"
            sandbox="allow-same-origin allow-scripts" allow="clipboard-read; clipboard-write" style={{ pointerEvents: control ? 'auto' : 'none' }} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-600">{control ? 'You are in control of the browser.' : 'Watching live.'}</span>
          {!control && run.status !== 'ready_to_submit' && <button type="button" className={secondary} onClick={() => setControl(true)}><Hand className="h-4 w-4" />Take control</button>}
          {control && run.request?.kind !== 'takeover' && <button type="button" className={secondary} onClick={() => setControl(false)}>Stop controlling</button>}
        </div>
      </div>}

      {/* What the agent needs from the user */}
      {run.request && <RequestPanel request={run.request} busy={busy} values={values} setValues={setValues} feedback={feedback} setFeedback={setFeedback}
        onAnswer={answer} onTypeInBrowser={() => setControl(true)} inControl={control} />}

      {run.status === 'check_needed' && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-medium">Did the application go through?</p>
        <p>The agent clicked submit but could not confirm the result. Check the screenshot or your email.</p>
        {run.last_screenshot_url && <img src={run.last_screenshot_url} alt="Last page the agent saw" className="w-full rounded border border-amber-200" />}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primary} disabled={busy} onClick={() => void act(() => call('/confirm-outcome', { runId: run.id, submitted: true }).then(async (d) => { await onUpdate(); return d; }))}>Yes, it was submitted</button>
          <button type="button" className={secondary} disabled={busy} onClick={() => void act(() => call('/confirm-outcome', { runId: run.id, submitted: false }).then(async (d) => { await onUpdate(); return d; }))}>No, it wasn't</button>
        </div>
      </div>}

      {run.status === 'submitted' && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
        <p className="font-medium">Application submitted.</p>
        {run.result?.message && <p className="mt-1">{run.result.message}</p>}
        {run.result?.confirmation && <p className="mt-1 break-words">Confirmation: {run.result.confirmation}</p>}
      </div>}

      {/* Step-by-step log */}
      <details open={live} className="rounded-lg bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-900">What the agent did ({run.steps.length})</summary>
        <ol className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
          {run.steps.map((s, i) => <li key={s.id} ref={i === run.steps.length - 1 ? stepsEnd : undefined} className="flex gap-2">
            <span className={`mt-0.5 shrink-0 ${s.kind === 'error' ? 'text-red-600' : s.kind === 'ask' ? 'text-amber-600' : 'text-violet-600'}`} aria-hidden="true">{STEP_ICON[s.kind] || STEP_ICON.info}</span>
            <span className="min-w-0">
              <span className="break-words text-gray-800">{s.summary}</span>
              <span className="block truncate text-xs text-gray-500">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{s.page_url ? ` · ${s.page_title || host(s.page_url)}` : ''}</span>
            </span>
          </li>)}
        </ol>
      </details>

      {live && <button type="button" className={secondary} disabled={busy} onClick={() => void act(() => call('/stop', { runId: run.id }).then(async (d) => { await onUpdate(); return d; }))}>
        <Square className="h-4 w-4" />Stop the agent
      </button>}
    </div>}
  </section>;
}

function RequestPanel({ request, busy, values, setValues, feedback, setFeedback, onAnswer, onTypeInBrowser, inControl }: {
  request: Request; busy: boolean; values: Record<string, string>; setValues: (v: Record<string, string>) => void;
  feedback: string; setFeedback: (v: string) => void; onAnswer: (b: Record<string, unknown>) => Promise<void>;
  onTypeInBrowser: () => void; inControl: boolean;
}) {
  const box = 'space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm';
  if (request.kind === 'submit_review') {
    const answers = (request.fields || []) as { question: string; answer: string }[];
    return <div className={box}>
      <p className="font-medium text-gray-900">Review before submitting</p>
      <p className="whitespace-pre-wrap text-gray-800">{request.message}</p>
      {request.screenshot_url && <img src={request.screenshot_url} alt="The filled application form" className="w-full rounded border border-amber-200" />}
      {answers.length > 0 && <dl className="divide-y divide-amber-200 rounded border border-amber-200 bg-white">
        {answers.map((a, i) => <div key={i} className="grid gap-1 p-2 sm:grid-cols-[1fr_1.5fr]"><dt className="font-medium text-gray-900">{a.question}</dt><dd className="break-words text-gray-700">{a.answer}</dd></div>)}
      </dl>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primary} disabled={busy} onClick={() => void onAnswer({ decision: 'approve' })}><Send className="h-4 w-4" />Submit application</button>
      </div>
      <label className="block space-y-1"><span className="text-gray-700">Something to fix? Tell the agent:</span>
        <textarea className={input} rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={1500} /></label>
      <button type="button" className={secondary} disabled={busy || !feedback.trim()} onClick={() => void onAnswer({ decision: 'change', feedback })}>Ask for changes</button>
    </div>;
  }
  if (request.kind === 'takeover') return <div className={box}>
    <p className="flex items-center gap-2 font-medium text-gray-900"><Hand className="h-4 w-4" />Your turn in the browser</p>
    <p className="text-gray-800">{request.message}</p>
    <p className="text-gray-600">Use the live browser above, then press Done.</p>
    <button type="button" className={primary} disabled={busy} onClick={() => void onAnswer({ mode: 'browser' })}>Done, continue</button>
  </div>;
  const fields = (request.fields || []) as Field[];
  const secret = fields.some((f) => f.type === 'password' || f.type === 'otp');
  const title = { login: 'Sign-in needed', otp: 'Verification code needed', new_account: 'Create an account?', question: 'Question from the form' }[request.kind];
  return <form className={box} onSubmit={(e) => { e.preventDefault(); void onAnswer({ values }); }}>
    <p className="flex items-center gap-2 font-medium text-gray-900"><KeyRound className="h-4 w-4" />{title}</p>
    <p className="whitespace-pre-wrap text-gray-800">{request.message}</p>
    {fields.map((f) => <label key={f.name} className="block space-y-1">
      <span className="text-gray-700">{f.label}</span>
      {f.type === 'choice' && f.options?.length ? <select className={input} value={values[f.name] || ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
        <option value="">Choose…</option>{f.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select> : f.type === 'long_text' ? <textarea className={input} rows={3} value={values[f.name] || ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
        : <input className={input} type={f.type === 'password' ? 'password' : f.type === 'email' ? 'email' : 'text'} inputMode={f.type === 'otp' ? 'numeric' : undefined}
          autoComplete={f.type === 'otp' ? 'one-time-code' : f.type === 'password' ? (request.kind === 'new_account' ? 'new-password' : 'current-password') : f.type === 'email' ? 'email' : 'off'}
          value={values[f.name] || ''} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />}
    </label>)}
    {secret && <p className="text-xs text-gray-600">Passwords and codes go straight into the page. The AI never sees them, and they are deleted when the run ends.</p>}
    <div className="flex flex-wrap gap-2">
      <button type="submit" className={primary} disabled={busy}>Send to agent</button>
      {(request.kind === 'login' || request.kind === 'otp' || request.kind === 'new_account') && (inControl
        ? <button type="button" className={secondary} disabled={busy} onClick={() => void onAnswer({ mode: 'browser' })}>I typed it in the browser, continue</button>
        : <button type="button" className={secondary} onClick={onTypeInBrowser}>I'll type it in the browser myself</button>)}
      <button type="button" className={secondary} disabled={busy} onClick={() => void onAnswer({ decline: true })}>{request.kind === 'new_account' ? 'Don\'t create an account' : 'Skip'}</button>
    </div>
  </form>;
}
