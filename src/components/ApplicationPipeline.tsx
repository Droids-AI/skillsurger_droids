import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ApplicationExecution from './ApplicationExecution';

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

export default function ApplicationPipeline({ job }: { job: { id: string; title: string; company: string } }) {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [action, setAction] = useState<Action | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState({ name: '', role: '', channel: 'linkedin' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');

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
  useEffect(() => { setApplicationUrl(''); void load().catch(e => setError(e.message)); }, [load]);

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
  const btn = 'min-h-11 rounded-lg px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

  return (
    <div className="mt-3 space-y-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
      {error && <p role="alert" className="text-red-600">{error}</p>}

      {/* Step 1: tailored CV */}
      <section aria-label="Tailored CV">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900">1. CV tailored to this job</h3>
          <button type="button" disabled={!!busy} onClick={() => void run('tailor', () => call('/tailor', { savedJobId: job.id }))} className={`${btn} bg-blue-600 text-white`}>
            {busy === 'tailor' ? 'Tailoring…' : latest ? 'Tailor again' : 'Tailor my CV'}
          </button>
        </div>
        <p className="mt-1 text-gray-600">Uses only facts from your profile. Every line shows the profile fact it came from; anything that could not be backed by your profile is removed.</p>
        {latest && (
          <div className="mt-3 rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Version {latest.version} · {latest.status}</p>
            {latest.content.headline && <p className="mt-1 font-medium">{latest.content.headline}</p>}
            {[...(latest.content.summary ? [{ heading: 'Summary', items: [latest.content.summary] }] : []), ...latest.content.sections].map((section) => (
              <div key={section.heading} className="mt-3">
                <p className="font-medium">{section.heading}</p>
                <ul className="mt-1 space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="grid gap-1 sm:grid-cols-2">
                      <span>{item.text}</span>
                      <span className="text-xs text-gray-500">From your profile: {factText(latest, item.evidence)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {latest.questions.length > 0 && (
              <div className="mt-3 rounded bg-amber-50 p-2 text-amber-900">
                <p className="font-medium">The job asks for things your profile does not show. Add them to your profile if true, then tailor again:</p>
                <ul className="list-disc pl-5">{latest.questions.map((q) => <li key={q}>{q}</li>)}</ul>
              </div>
            )}
            {latest.dropped.length > 0 && (
              <details className="mt-2 text-xs text-gray-600"><summary>{latest.dropped.length} line(s) removed because your profile did not support them</summary>
                <ul className="list-disc pl-5">{latest.dropped.map((d, i) => <li key={i}>{d.text} ({d.reason})</li>)}</ul>
              </details>
            )}
            {latest.status === 'draft' && (
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={!!busy} onClick={() => void run('cv', () => call('/cv-decision', { cvId: latest.id, decision: 'approved' }))} className={`${btn} bg-green-600 text-white`}>Approve this CV</button>
                <button type="button" disabled={!!busy} onClick={() => void run('cv', () => call('/cv-decision', { cvId: latest.id, decision: 'rejected' }))} className={`${btn} border border-gray-300`}>Reject</button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Step 2: application */}
      <section aria-label="Application">
        <h3 className="font-semibold text-gray-900">2. Application</h3>
        {!approved ? (
          <p className="mt-1 text-gray-600">Approve a tailored CV first.</p>
        ) : !action || action.state === 'failed' ? (
          <div className="mt-2 space-y-2">
          {action?.state === 'failed' && <p role="status" className="text-gray-700">Your previous draft is closed. A new draft will need a new approval.</p>}
          <label className="block font-medium" htmlFor={`application-url-${job.id}`}>Exact application link (optional for manual applications)</label>
          <input id={`application-url-${job.id}`} type="url" inputMode="url" value={applicationUrl} onChange={event => setApplicationUrl(event.target.value)}
            placeholder="https://…" className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2" />
          <p className="text-gray-600">Use the link for this specific job. Browser applications are available only on supported, verified boards.</p>
          <button type="button" disabled={!!busy} onClick={() => void run('app', () => call('/application', { savedJobId: job.id, applicationUrl: applicationUrl.trim() }))} className={`${btn} mt-2 bg-blue-600 text-white`}>
            {busy === 'app' ? 'Preparing…' : 'Prepare application'}
          </button>
          </div>
        ) : (
          <div className="mt-2 rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">{STATE_LABEL[action.state] || action.state}</p>
            <p className="mt-1 break-words"><span className="font-medium">Where:</span> {action.payload.destination}</p>
            <p className="mt-1 text-gray-600">{action.payload.execution_mode === 'anchor' ? 'Skillsurger can run this application through Anchor after your approval and the account checks below.' : 'Manual application: you complete and submit the form on the job board.'}</p>
            {action.payload.cover_note && <p className="mt-2 whitespace-pre-wrap"><span className="font-medium">Cover note:</span> {action.payload.cover_note}</p>}
            <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {Object.entries(action.payload.answers || {}).map(([k, v]) => <div key={k}><dt className="inline font-medium capitalize">{k.replace(/_/g, ' ')}: </dt><dd className="inline">{String(v)}</dd></div>)}
            </dl>
            {(action.payload.questions_for_user?.length ?? 0) > 0 && (
              <ul className="mt-2 list-disc pl-5 text-amber-900">{(action.payload.questions_for_user || []).map((q: string) => <li key={q}>{q}</li>)}</ul>
            )}
            {action.state === 'needs_approval' && (
              <button type="button" disabled={!!busy} onClick={() => void approveApplication()} className={`${btn} mt-3 bg-green-600 text-white`}>Approve this application</button>
            )}
            {action.payload.execution_mode === 'anchor' && <ApplicationExecution actionId={action.id} actionState={action.state} onUpdate={load} />}
            {['needs_approval','queued'].includes(action.state) && <button type="button" disabled={!!busy}
              onClick={() => void run('close',() => call('/application-close',{actionId:action.id}))} className={`${btn} mt-3 border border-gray-300`}>Discard unstarted draft</button>}
            {action.state === 'queued' && action.payload.execution_mode !== 'anchor' && (
              <div className="mt-3 space-y-2">
                <p>Apply on {job.company}'s site using your approved CV and the details above. Skillsurger does not submit anything for you.</p>
                {typeof action.payload.application_url === 'string' && /^https:\/\//.test(action.payload.application_url) &&
                  <a href={action.payload.application_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline">Open application form</a>}
                <button type="button" disabled={!!busy} onClick={() => void run('applied', () => call('/applied', { actionId: action.id }))} className={`${btn} bg-green-600 text-white`}>I've applied</button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Step 3: outreach */}
      <section aria-label="Outreach">
        <h3 className="font-semibold text-gray-900">3. Outreach drafts (you send them)</h3>
        <p className="mt-1 text-gray-600">Drafts for one contact at {job.company}. Copy and send each one yourself; nothing is sent automatically. A reply, or an interview, offer or rejection on this job, stops the sequence.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <input aria-label="Contact name" placeholder="Contact name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="rounded border px-2 py-1.5" />
          <input aria-label="Contact role" placeholder="Their role (optional)" value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value })} className="rounded border px-2 py-1.5" />
          <select aria-label="Channel" value={contact.channel} onChange={(e) => setContact({ ...contact, channel: e.target.value })} className="rounded border px-2 py-1.5"><option value="linkedin">LinkedIn</option><option value="email">Email</option></select>
          <button type="button" disabled={!!busy || !contact.name.trim()} onClick={() => void run('outreach', async () => { await call('/outreach', { savedJobId: job.id, contactName: contact.name, contactRole: contact.role, channel: contact.channel }); setContact({ name: '', role: '', channel: 'linkedin' }); })} className={`${btn} bg-blue-600 text-white`}>
            {busy === 'outreach' ? 'Drafting…' : 'Draft messages'}
          </button>
        </div>
        {sequences.map((seq) => (
          <div key={seq.id} className="mt-3 rounded-lg bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{seq.contact_name}{seq.contact_role ? `, ${seq.contact_role}` : ''} · {seq.channel}</p>
              <span className="text-xs text-gray-500">{seq.status}{seq.stop_reason ? ` (${seq.stop_reason.replace(/_/g, ' ')})` : ''}</span>
            </div>
            {messages.filter((m) => m.sequence_id === seq.id).map((m) => (
              <div key={m.id} className="mt-2 border-t pt-2">
                <p className="text-xs font-medium text-gray-500">{STEP_LABEL[m.step]} · {m.status}</p>
                <p className="whitespace-pre-wrap">{m.body}</p>
                {seq.status === 'active' && m.status === 'draft' && (
                  <div className="mt-1 flex gap-2">
                    <button type="button" onClick={() => void navigator.clipboard?.writeText(m.body)} className={`${btn} border border-gray-300`}>Copy</button>
                    <button type="button" disabled={!!busy} onClick={() => void run('sent', () => call('/outreach-event', { sequenceId: seq.id, event: 'sent', messageId: m.id }))} className={`${btn} border border-gray-300`}>I sent this</button>
                  </div>
                )}
              </div>
            ))}
            {seq.status === 'active' && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" disabled={!!busy} onClick={() => void run('stop', () => call('/outreach-event', { sequenceId: seq.id, event: 'replied' }))} className={`${btn} border border-gray-300`}>They replied</button>
                <button type="button" disabled={!!busy} onClick={() => void run('stop', () => call('/outreach-event', { sequenceId: seq.id, event: 'accepted' }))} className={`${btn} border border-gray-300`}>They accepted</button>
                <button type="button" disabled={!!busy} onClick={() => void run('stop', () => call('/outreach-event', { sequenceId: seq.id, event: 'stop' }))} className={`${btn} border border-gray-300`}>Stop</button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

export function WeeklyReport() {
  interface Report { applications: { applied: number; awaiting_approval: number; approved_not_applied: number; failed: number }; messages_sent: number; pipeline: Record<string, number> }
  const [data, setData] = useState<Report | null>(null);
  useEffect(() => { void call<Report>('/report').then(setData).catch(() => setData(null)); }, []);
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
