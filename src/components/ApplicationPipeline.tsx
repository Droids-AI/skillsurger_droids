import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, ChevronDown, Copy, FileText, Send, Users } from 'lucide-react';
import ApplicationExecution from './ApplicationExecution';
import AgentApply from './AgentApply';

// Per-job pipeline (agent-platform plan 4.3, manual handoff until browser automation exists):
// 1. tailored CV from profile facts only, shown against the source facts, user approves
// 2. application drafted from the approved CV, separately approved, then the user applies on the site
// 3. outreach drafts the user sends themselves; replies or job status changes stop the sequence

const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skillsurger-agent`;

async function call<T = unknown>(route: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in again');
  const response = await fetch(`${FN}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Something went wrong. Please try again.');
  return data as T;
}

interface Fact { id: string; label: string; text: string }
interface Item { text: string; evidence: string[] }
interface CV { id: string; version: number; status: string; facts: Fact[]; content: { headline: string; summary: Item | null; sections: { heading: string; items: Item[] }[] }; dropped: { text: string; reason: string }[]; questions: string[]; created_at: string }
interface Action { id: string; state: string; payload: { destination: string; execution_mode?: string; application_url?: string; cover_note?: string; answers?: Record<string, string>; questions_for_user?: string[] }; payload_hash: string }
interface Sequence { id: string; contact_name: string; contact_role: string; channel: string; status: string; stop_reason: string | null }
interface Message { id: string; sequence_id: string; step: string; body: string; status: string }

const STEP_LABEL: Record<string, string> = { connection_note: 'Connection note', referral_ask: 'Referral ask', follow_up_1: 'Follow-up 1', follow_up_2: 'Follow-up 2' };
const STATE_LABEL: Record<string, string> = { needs_approval: 'Waiting for your approval', queued: 'Approved', running: 'In progress', needs_you: 'Needs your attention', reconciling: 'Checking submission outcome', done: 'Applied', failed: 'Closed' };

function Step({ n, title, icon, badge, done, children }: { n: number; title: string; icon: JSX.Element; badge?: string; done?: boolean; children: React.ReactNode }) {
  return (
  <section aria-label={title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex flex-wrap items-center gap-3">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${done ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
        {done ? <Check className="h-4 w-4" aria-hidden="true" /> : n}
      </span>
      <h3 className="flex items-center gap-2 font-semibold text-gray-900">{icon}{title}</h3>
      {badge && <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${done ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{badge}</span>}
    </div>
    <div className="mt-3 text-sm text-gray-700">{children}</div>
  </section>
);
}

export default function ApplicationPipeline({ job }: { job: { id: string; title: string; company: string; application_url?: string | null } }) {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [action, setAction] = useState<Action | null>(null);
  const [agentAvailable, setAgentAvailable] = useState(false);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState({ name: '', role: '', channel: 'linkedin' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [applicationUrl, setApplicationUrl] = useState(job.application_url || '');
  const [editingLink, setEditingLink] = useState(false);

  const load = useCallback(async () => {
    const [c, a, s] = await Promise.all([
      supabase.from('skillsurger_tailored_cvs').select('*').eq('saved_job_id', job.id).order('version', { ascending: false }),
      supabase.from('agent_action_ledger').select('id,state,payload,payload_hash').eq('action_type', 'apply_job').eq('payload->>saved_job_id', job.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('skillsurger_outreach_sequences').select('*').eq('saved_job_id', job.id).order('created_at'),
    ]);
    if (c.error || a.error || s.error) throw new Error('Could not load this application. Refresh before taking any action.');
    setCvs((c.data as CV[]) || []);
    setAction(((a.data as Action[]) || [])[0] || null);
    const seqs = (s.data as Sequence[]) || [];
    setSequences(seqs);
    if (seqs.length) {
      const m = await supabase.from('skillsurger_outreach_messages').select('*').in('sequence_id', seqs.map((q) => q.id));
      if (m.error) throw new Error('Could not load your outreach drafts.');
      setMessages(((m.data as Message[]) || []).sort((x, y) => Object.keys(STEP_LABEL).indexOf(x.step) - Object.keys(STEP_LABEL).indexOf(y.step)));
    } else setMessages([]);
  }, [job.id]);
  useEffect(() => { setApplicationUrl(job.application_url || ''); setEditingLink(false); void load().catch(e => setError(e.message)); }, [load, job.application_url]);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key); setError('');
    try { await fn(); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); } finally { setBusy(''); }
  };

  const latest = cvs[0];
  const approved = cvs.find((c) => c.status === 'approved');
  const factText = (cv: CV, ids: string[]) => ids.map((id) => cv.facts.find((f) => f.id === id)?.text).filter(Boolean).join(' · ');
  const approveApplication = () => run('approve', async () => {
    const { error: rpcError } = await supabase.rpc('agent_decide_approval', { p_action_id: action!.id, p_decision: 'approved', p_payload_hash: action!.payload_hash });
    if (rpcError) throw new Error(rpcError.message.includes('mismatch') ? 'The application changed since you opened it. Reload and review again.' : 'Could not approve.');
  });
  const btn = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
  const primary = `${btn} bg-blue-600 text-white hover:bg-blue-700`;
  const success = `${btn} bg-green-600 text-white hover:bg-green-700`;
  const secondary = `${btn} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
  const field = 'min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';

  const cvDone = !!approved;
  const appDone = action?.state === 'done';
  const appState = !action || action.state === 'failed' ? (approved ? 'Ready to prepare' : 'Locked') : STATE_LABEL[action.state] || action.state;
  const steps = [
    { n: 1, label: 'Tailored CV', done: cvDone, current: !cvDone },
    { n: 2, label: 'Application', done: appDone, current: cvDone && !appDone },
    { n: 3, label: 'Outreach', done: sequences.some((q) => q.status !== 'active'), current: false },
  ];

  return (
    <div className="mt-4 space-y-4 text-sm">
      <ol className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Progress">
        {steps.map((st, i) => (
          <li key={st.n} className="flex min-w-0 items-center gap-2">
            <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${st.done ? 'bg-green-100 text-green-800' : st.current ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {st.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <span>{st.n}</span>}{st.label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-6 shrink-0 bg-gray-300" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</p>}

      <Step n={1} title="CV tailored to this job" icon={<FileText className="h-4 w-4 text-gray-400" aria-hidden="true" />} done={cvDone}
        badge={latest ? `Version ${latest.version} · ${latest.status}` : undefined}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-gray-600">Uses only facts from your profile. Every line shows the fact it came from; anything your profile can't back up is removed.</p>
          <button type="button" disabled={!!busy} onClick={() => void run('tailor', () => call('/tailor', { savedJobId: job.id }))} className={`${latest ? secondary : primary} shrink-0`}>
            {busy === 'tailor' ? 'Tailoring…' : latest ? 'Tailor again' : 'Tailor my CV'}
          </button>
        </div>
        {latest && (
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
            {latest.content.headline && <p className="text-base font-semibold text-gray-900">{latest.content.headline}</p>}
            {[...(latest.content.summary ? [{ heading: 'Summary', items: [latest.content.summary] }] : []), ...latest.content.sections].map((section) => (
              <div key={section.heading} className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{section.heading}</p>
                <ul className="mt-2 space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="rounded-md bg-white p-3 ring-1 ring-gray-100">
                      <p className="text-gray-900">{item.text}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500" title={factText(latest, item.evidence)}>From your profile: {factText(latest, item.evidence)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {latest.questions.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="font-medium">The job asks for things your profile doesn't show. Add them to your profile if true, then tailor again:</p>
                <ul className="mt-1 list-disc pl-5">{latest.questions.map((q) => <li key={q}>{q}</li>)}</ul>
              </div>
            )}
            {latest.dropped.length > 0 && (
              <details className="group mt-3 text-xs text-gray-600">
                <summary className="flex cursor-pointer list-none items-center gap-1 font-medium"><ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />{latest.dropped.length} line(s) removed because your profile didn't support them</summary>
                <ul className="mt-1 list-disc pl-5">{latest.dropped.map((d, i) => <li key={i}>{d.text} ({d.reason})</li>)}</ul>
              </details>
            )}
            {latest.status === 'draft' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={!!busy} onClick={() => void run('cv', () => call('/cv-decision', { cvId: latest.id, decision: 'approved' }))} className={success}><Check className="h-4 w-4" aria-hidden="true" />Approve this CV</button>
                <button type="button" disabled={!!busy} onClick={() => void run('cv', () => call('/cv-decision', { cvId: latest.id, decision: 'rejected' }))} className={secondary}>Reject</button>
              </div>
            )}
          </div>
        )}
      </Step>

      <Step n={2} title="Application" icon={<Send className="h-4 w-4 text-gray-400" aria-hidden="true" />} done={appDone} badge={appState}>
        {!approved ? (
          <p className="text-gray-500">Approve a tailored CV first.</p>
        ) : !action || action.state === 'failed' ? (
          <div className="space-y-3">
            {action?.state === 'failed' && <p role="status" className="rounded-lg bg-gray-50 px-3 py-2 text-gray-700">Your previous draft is closed. A new draft needs a new approval.</p>}
            <div>
              <label className="mb-1 block font-medium text-gray-900" htmlFor={`application-url-${job.id}`}>Application link</label>
              <input id={`application-url-${job.id}`} type="url" inputMode="url" value={applicationUrl} onChange={event => setApplicationUrl(event.target.value)}
                placeholder="https://…" className={field} />
              <p className="mt-1 text-xs text-gray-500">{job.application_url && applicationUrl.trim() === job.application_url
                ? 'Taken from this job\'s Apply button. Change it if you want to apply on a different page.'
                : 'The page where you apply for this specific job (https). Leave it empty to apply manually.'}</p>
            </div>
            <button type="button" disabled={!!busy} onClick={() => void run('app', () => call('/application', { savedJobId: job.id, applicationUrl: applicationUrl.trim() }))} className={primary}>
              {busy === 'app' ? 'Preparing…' : 'Prepare application'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 break-words"><span className="font-medium text-gray-900">Where:</span> {action.payload.destination}</p>
                {['needs_approval', 'queued', 'needs_you'].includes(action.state) && !editingLink &&
                  <button type="button" disabled={!!busy} className="shrink-0 text-sm font-medium text-blue-700 underline-offset-2 hover:underline disabled:opacity-50"
                    onClick={() => { setApplicationUrl(action.payload.application_url || job.application_url || ''); setEditingLink(true); }}>Change link</button>}
              </div>
              {editingLink && <div className="mt-2 space-y-2 rounded-lg border border-blue-100 bg-white p-3">
                <label className="block font-medium text-gray-900" htmlFor={`change-url-${job.id}`}>New application link</label>
                <input id={`change-url-${job.id}`} type="url" inputMode="url" value={applicationUrl} onChange={event => setApplicationUrl(event.target.value)} placeholder="https://…" className={field} />
                <p className="text-xs text-gray-500">Changing the link closes this draft and prepares a new one for you to approve.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={!!busy || !applicationUrl.trim() || applicationUrl.trim() === action.payload.application_url} className={primary}
                    onClick={() => void run('app', async () => { await call('/application-close', { actionId: action.id }); await call('/application', { savedJobId: job.id, applicationUrl: applicationUrl.trim() }); setEditingLink(false); })}>
                    {busy === 'app' ? 'Updating…' : 'Use this link'}</button>
                  <button type="button" disabled={!!busy} className={secondary} onClick={() => setEditingLink(false)}>Cancel</button>
                </div>
              </div>}
              <p className="mt-1 text-gray-600">{action.payload.execution_mode === 'anchor' ? 'Skillsurger will fill and submit this form in a secure browser after your approval.' : agentAvailable ? 'Apply yourself on the job board, or let the AI agent below do it with your review before it submits.' : 'Manual application: you complete and submit the form on the job board.'}</p>
              {action.payload.cover_note && <p className="mt-3 whitespace-pre-wrap"><span className="font-medium text-gray-900">Cover note:</span> {action.payload.cover_note}</p>}
              {Object.keys(action.payload.answers || {}).length > 0 && (
                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                  {Object.entries(action.payload.answers || {}).map(([k, v]) => <div key={k} className="min-w-0 truncate"><dt className="inline font-medium capitalize text-gray-900">{k.replace(/_/g, ' ')}: </dt><dd className="inline" title={String(v)}>{String(v)}</dd></div>)}
                </dl>
              )}
              {(action.payload.questions_for_user?.length ?? 0) > 0 && (
                <ul className="mt-3 list-disc rounded-lg border border-amber-200 bg-amber-50 py-2 pl-8 pr-3 text-amber-900">{(action.payload.questions_for_user || []).map((q: string) => <li key={q}>{q}</li>)}</ul>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {action.state === 'needs_approval' && (
                <button type="button" disabled={!!busy} onClick={() => void approveApplication()} className={success}><Check className="h-4 w-4" aria-hidden="true" />Approve this application</button>
              )}
              {['needs_approval','queued'].includes(action.state) && <button type="button" disabled={!!busy}
                onClick={() => void run('close',() => call('/application-close',{actionId:action.id}))} className={secondary}>Discard draft</button>}
            </div>
            {action.payload.execution_mode === 'anchor' && <ApplicationExecution actionId={action.id} actionState={action.state} onUpdate={load} />}
            {action.payload.execution_mode !== 'anchor' && typeof action.payload.application_url === 'string' && ['queued', 'running', 'needs_you', 'reconciling', 'done'].includes(action.state) &&
              <AgentApply actionId={action.id} actionState={action.state} onUpdate={load} onAvailable={setAgentAvailable} />}
            {['queued', 'needs_you'].includes(action.state) && action.payload.execution_mode !== 'anchor' && (
              <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p>{agentAvailable ? `Prefer to apply yourself? Use your approved CV and the details above on ${job.company}'s site, then tap "I've applied".` : `Apply on ${job.company}'s site using your approved CV and the details above. Skillsurger doesn't submit anything for you.`}</p>
                <div className="flex flex-wrap gap-2">
                  {typeof action.payload.application_url === 'string' && /^https:\/\//.test(action.payload.application_url) &&
                    <a href={action.payload.application_url} target="_blank" rel="noreferrer" className={secondary}>Open application form</a>}
                  <button type="button" disabled={!!busy} onClick={() => void run('applied', () => call('/applied', { actionId: action.id }))} className={success}>I've applied</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Step>

      <Step n={3} title="Outreach drafts" icon={<Users className="h-4 w-4 text-gray-400" aria-hidden="true" />} badge="You send them">
        <p className="text-gray-600">Drafts for one contact at {job.company}. Copy and send each one yourself; nothing is sent automatically. A reply, or an interview, offer or rejection on this job, stops the sequence.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_9rem_auto]">
          <input aria-label="Contact name" placeholder="Contact name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={field} />
          <input aria-label="Contact role" placeholder="Their role (optional)" value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value })} className={field} />
          <div className="relative">
            <select aria-label="Channel" value={contact.channel} onChange={(e) => setContact({ ...contact, channel: e.target.value })} className={`${field} cursor-pointer appearance-none pr-9`}>
              <option value="linkedin">LinkedIn</option><option value="email">Email</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          </div>
          <button type="button" disabled={!!busy || !contact.name.trim()} onClick={() => void run('outreach', async () => { await call('/outreach', { savedJobId: job.id, contactName: contact.name, contactRole: contact.role, channel: contact.channel }); setContact({ name: '', role: '', channel: 'linkedin' }); })} className={primary}>
            {busy === 'outreach' ? 'Drafting…' : 'Draft messages'}
          </button>
        </div>
        {sequences.map((seq) => (
          <div key={seq.id} className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-gray-900">{seq.contact_name}{seq.contact_role ? `, ${seq.contact_role}` : ''} <span className="font-normal text-gray-500">· {seq.channel === 'email' ? 'Email' : 'LinkedIn'}</span></p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${seq.status === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>{seq.status}{seq.stop_reason ? ` (${seq.stop_reason.replace(/_/g, ' ')})` : ''}</span>
            </div>
            {messages.filter((m) => m.sequence_id === seq.id).map((m) => (
              <div key={m.id} className="mt-3 rounded-md bg-white p-3 ring-1 ring-gray-100">
                <p className="text-xs font-medium text-gray-500">{STEP_LABEL[m.step]} · {m.status}</p>
                <p className="mt-1 whitespace-pre-wrap text-gray-900">{m.body}</p>
                {seq.status === 'active' && m.status === 'draft' && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void navigator.clipboard?.writeText(m.body)} className={secondary}><Copy className="h-4 w-4" aria-hidden="true" />Copy</button>
                    <button type="button" disabled={!!busy} onClick={() => void run('sent', () => call('/outreach-event', { sequenceId: seq.id, event: 'sent', messageId: m.id }))} className={secondary}>I sent this</button>
                  </div>
                )}
              </div>
            ))}
            {seq.status === 'active' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={!!busy} onClick={() => void run('stop', () => call('/outreach-event', { sequenceId: seq.id, event: 'replied' }))} className={secondary}>They replied</button>
                <button type="button" disabled={!!busy} onClick={() => void run('stop', () => call('/outreach-event', { sequenceId: seq.id, event: 'accepted' }))} className={secondary}>They accepted</button>
                <button type="button" disabled={!!busy} onClick={() => void run('stop', () => call('/outreach-event', { sequenceId: seq.id, event: 'stop' }))} className={secondary}>Stop</button>
              </div>
            )}
          </div>
        ))}
      </Step>
    </div>
  );
}

export function WeeklyReport() {
  interface Report { applications: { applied: number; awaiting_approval: number; approved_not_applied: number; failed: number }; messages_sent: number; pipeline: Record<string, number> }
  const [data, setData] = useState<Report | null>(null);
  useEffect(() => {
    const load = () => { void call<Report>('/report').then(setData).catch(() => setData(null)); };
    load();
    window.addEventListener('saved-jobs-changed', load);
    return () => window.removeEventListener('saved-jobs-changed', load);
  }, []);
  if (!data) return null;
  const a = data.applications;
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="weekly-report-heading">
      <h2 id="weekly-report-heading" className="text-lg font-semibold text-gray-900">This week</h2>
      <p className="mb-3 text-sm text-gray-600">From your application record for the last 7 days.</p>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        <div><dt className="text-gray-500">Applied</dt><dd className="text-xl font-semibold">{a.applied}</dd></div>
        <div><dt className="text-gray-500">Awaiting your approval</dt><dd className="text-xl font-semibold">{a.awaiting_approval}</dd></div>
        <div><dt className="text-gray-500">Approved, not yet applied</dt><dd className="text-xl font-semibold">{a.approved_not_applied}</dd></div>
        <div><dt className="text-gray-500">Closed</dt><dd className="text-xl font-semibold">{a.failed}</dd></div>
        <div><dt className="text-gray-500">Messages sent</dt><dd className="text-xl font-semibold">{data.messages_sent}</dd></div>
      </dl>
      <p className="mt-3 text-sm text-gray-600">Pipeline: {Object.entries(data.pipeline).filter(([, n]) => (n as number) > 0).map(([s, n]) => `${s} ${n}`).join(' · ') || 'no saved jobs yet'}</p>
    </section>
  );
}
