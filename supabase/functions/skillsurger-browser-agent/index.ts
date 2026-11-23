// AI browser agent: applies to an approved job on any site in an Anchor browser, driven through
// Anchor's browser MCP server. The user watches live, answers questions (login, OTP, new account,
// unknown answers), takes over for CAPTCHAs, and approves the final submit.
// Off unless FF_SKILLSURGER_BROWSER_AGENT=true. Pilot users: skillsurger_automation_policy.enabled,
// or everyone when SKILLSURGER_AGENT_ALLOW_ALL=true.
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as anchor from '../_shared/anchor.ts';
import { anchorBrowserMcp, McpClient, McpError, textOf, type McpResult } from '../_shared/mcp.ts';
import { cvParagraphs, textPdf } from '../_shared/automation/cvpdf.ts';
import { attachFile } from '../_shared/cdp.ts';
import {
  cleanFields, confirmed, guardSubmit, isLinkedIn, pageInfo, parseArgs, redact, safeUrl, SECRET_TYPES, stepKind,
  systemPrompt, taskMessage, TOOLS, trimHistory, type Msg, type ToolCall,
} from '../_shared/browser-agent/core.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const enabled = () => Deno.env.get('FF_SKILLSURGER_BROWSER_AGENT') === 'true';
const origins = (Deno.env.get('SKILLSURGER_ALLOWED_ORIGINS') || 'https://skillsurger.com,https://www.skillsurger.com').split(',').map((v) => v.trim());
const MODEL = Deno.env.get('SKILLSURGER_BROWSER_AGENT_MODEL') || Deno.env.get('SKILLSURGER_AI_MODEL') || 'gpt-4.1';
const WEEKLY_RUNS = Number(Deno.env.get('SKILLSURGER_AGENT_WEEKLY_RUNS') || 15);
const POLICY = '2026-11-23';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIVE = ['starting', 'working', 'waiting_user', 'ready_to_submit'];
const WORK_MS = 95_000;
const LEASE_S = 150;

class RequestError extends Error { constructor(public status: number, public code: string) { super(code); } }
function must<T>(r: { data: T; error: any }): T { if (r.error) throw new Error(String(r.error.message || r.error)); return r.data; }

// ---------- secrets (passwords / OTPs): AES-GCM, key derived from a server secret ----------
let keyPromise: Promise<CryptoKey> | null = null;
function secretKey() {
  keyPromise ??= (async () => {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('SKILLSURGER_AGENT_SECRET_KEY') || serviceKey), 'HKDF', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('skillsurger-agent-secrets'), info: new Uint8Array() },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  })();
  return keyPromise;
}
const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function encrypt(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await secretKey(), new TextEncoder().encode(value)));
  return b64(iv) + '.' + b64(ct);
}
async function decrypt(value: string) {
  const [iv, ct] = value.split('.');
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await secretKey(), unb64(ct)));
}

// ---------- access checks ----------
async function activePlan(userId: string) {
  const p: any = must(await admin.from('subscriptions').select('subscription_status,subscription_tier,trial_end,created_at')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle());
  const tier = String(p?.subscription_tier || '').toLowerCase();
  const expires = Date.parse(p?.trial_end || new Date(Date.parse(p?.created_at || '') + 7 * 86400000).toString());
  if (!p || p.subscription_status !== 'active' || !tier || tier === 'free' || (tier.includes('trial') && (!Number.isFinite(expires) || Date.now() >= expires)))
    throw new RequestError(403, 'active_plan_required');
}
async function allowedUser(userId: string) {
  if (Deno.env.get('SKILLSURGER_AGENT_ALLOW_ALL') === 'true') return true;
  const p: any = must(await admin.from('skillsurger_automation_policy').select('enabled').eq('user_id', userId).maybeSingle());
  return !!p?.enabled;
}
async function consentOf(userId: string) {
  const c: any = must(await admin.from('skillsurger_agent_consent').select('*').eq('user_id', userId).maybeSingle());
  const ok = !!c && !c.revoked_at && c.policy_version === POLICY;
  return { ok, linkedin: ok && !!c.linkedin_risk_accepted_at };
}
async function ownAction(userId: string, actionId: unknown) {
  if (typeof actionId !== 'string' || !UUID.test(actionId)) throw new RequestError(400, 'application_not_found');
  const a: any = must(await admin.from('agent_action_ledger').select('*').eq('id', actionId).eq('user_id', userId)
    .eq('product', 'skillsurger').eq('action_type', 'apply_job').maybeSingle());
  if (!a) throw new RequestError(404, 'application_not_found');
  return a;
}
async function ownRun(userId: string, runId: unknown) {
  if (typeof runId !== 'string' || !UUID.test(runId)) throw new RequestError(400, 'run_not_found');
  const r: any = must(await admin.from('skillsurger_agent_runs').select('*').eq('id', runId).eq('user_id', userId).maybeSingle());
  if (!r) throw new RequestError(404, 'run_not_found');
  return r;
}

// ---------- view for the UI (never the transcript or secrets) ----------
async function signed(path: string | null) {
  if (!path) return null;
  const { data } = await admin.storage.from('agent-screenshots').createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
async function view(run: any) {
  if (!run) return null;
  const steps: any[] = must(await admin.from('skillsurger_agent_steps').select('id,kind,summary,page_url,page_title,screenshot_path,created_at')
    .eq('run_id', run.id).order('id', { ascending: false }).limit(80)) || [];
  const req: any = must(await admin.from('skillsurger_agent_requests').select('id,kind,message,fields,screenshot_path,created_at')
    .eq('run_id', run.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle());
  const lastShot = steps.find((s) => s.screenshot_path)?.screenshot_path ?? null;
  return {
    id: run.id, status: run.status, activity: run.activity, current_url: run.current_url, current_title: run.current_title,
    step_count: run.step_count, max_steps: run.max_steps, error: run.error, result: run.result,
    created_at: run.created_at, ended_at: run.ended_at,
    live_view_url: LIVE.includes(run.status) ? run.live_view_url : null,
    last_screenshot_url: await signed(lastShot),
    steps: steps.reverse().map(({ screenshot_path, ...s }) => ({ ...s, has_screenshot: !!screenshot_path })),
    request: req ? { id: req.id, kind: req.kind, message: req.message, fields: req.fields, screenshot_url: await signed(req.screenshot_path), created_at: req.created_at } : null,
  };
}

// ---------- run bookkeeping ----------
async function step(runId: string, kind: string, summary: string, page: { url?: string | null; title?: string | null } = {}, screenshot: string | null = null) {
  must(await admin.from('skillsurger_agent_steps').insert({ run_id: runId, kind, summary: summary.slice(0, 500), page_url: page.url ?? null, page_title: page.title ?? null, screenshot_path: screenshot }));
}
async function patch(runId: string, fields: Record<string, unknown>) {
  must(await admin.from('skillsurger_agent_runs').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', runId));
}
async function kick(runId: string) {
  try {
    await fetch(`${url}/functions/v1/skillsurger-browser-agent/work`, {
      method: 'POST', headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId }), signal: AbortSignal.timeout(10000),
    });
  } catch { /* the UI's status polling restarts stale runs */ }
}
function background(p: Promise<unknown>) {
  const guarded = p.catch((e) => console.error(JSON.stringify({ area: 'browser-agent', code: String(e?.code || e?.message || e).slice(0, 200) })));
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(guarded);
}

/** End a run. Releases the application back to "approved" unless a submit click may have happened. */
async function endRun(run: any, status: 'submitted' | 'stopped' | 'failed' | 'check_needed', fields: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  must(await admin.from('skillsurger_agent_runs').update({ status, ended_at: status === 'check_needed' ? null : now, updated_at: now,
    lease_owner: null, lease_until: null, ...fields }).eq('id', run.id));
  const reqs: any[] = must(await admin.from('skillsurger_agent_requests').select('id').eq('run_id', run.id)) || [];
  if (reqs.length) must(await admin.from('skillsurger_agent_secrets').delete().in('request_id', reqs.map((r) => r.id)));
  must(await admin.from('skillsurger_agent_requests').update({ status: 'cancelled' }).eq('run_id', run.id).eq('status', 'pending'));
  try {
    // Ledger path (agent_ledger_transition_guard): running -> reconciling while the outcome is unknown,
    // -> needs_you once we know nothing was submitted, -> done when applied. Never back to queued.
    if (status === 'submitted') await markApplied(run, fields.result as Record<string, unknown>);
    else if (status === 'check_needed') must(await admin.from('agent_action_ledger').update({ state: 'reconciling' }).eq('id', run.action_id).eq('state', 'running'));
    // Nothing was submitted: the user can run the agent again or apply themselves.
    else must(await admin.from('agent_action_ledger').update({ state: 'needs_you' }).eq('id', run.action_id).in('state', ['running', 'reconciling']));
  } catch (e) {
    // Never let bookkeeping restart the agent; the run itself is already closed above.
    console.error(JSON.stringify({ area: 'browser-agent', run: run.id, code: 'ledger_update_failed', detail: String((e as any)?.message || e).slice(0, 200) }));
  }
  if (run.anchor_session_id) await anchor.endSession(run.anchor_session_id).catch(() => undefined);
}
async function markApplied(run: any, result: Record<string, unknown> = {}) {
  const a: any = must(await admin.from('agent_action_ledger').select('payload,state').eq('id', run.action_id).single());
  if (a.state === 'done') return;
  must(await admin.from('agent_action_ledger').update({ state: 'done', evidence: {
    method: 'browser_agent', run_id: run.id, applied_at: new Date().toISOString(),
    confirmation: result?.confirmation ?? null, page_url: result?.page_url ?? null, confirmed_by: result?.confirmed_by ?? 'site',
  } }).eq('id', run.action_id));
  must(await admin.from('saved_jobs').update({ status: 'applied', status_updated_at: new Date().toISOString() })
    .eq('id', a.payload.saved_job_id).eq('user_id', run.user_id).eq('status', 'saved'));
}

// ---------- browser ----------
async function openBrowser(run: any, action: any): Promise<any> {
  const session = await anchor.createAgentSession(`ss-${run.user_id}`);
  const pdf = textPdf(cvParagraphs(action.payload.cv_content, action.payload.answers || {}));
  const name = `${String(action.payload.answers?.full_name || 'CV').replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}-CV.pdf`;
  const cvPath = await anchor.uploadSessionFile(session.id, name, pdf, 'application/pdf');
  const fields = { anchor_session_id: session.id, live_view_url: session.liveViewUrl, cv_file_path: cvPath, status: 'working' };
  await patch(run.id, fields);
  await step(run.id, 'info', 'Opened a secure browser for this application');
  return { ...run, ...fields };
}
async function screenshot(mcp: McpClient, run: any): Promise<string | null> {
  try {
    const shot = await mcp.callTool('anchor_take_screenshot', {}, 30000);
    const img = shot.content.find((c) => c.type === 'image' && c.data);
    if (!img?.data) { console.error(JSON.stringify({ area: 'browser-agent', code: 'screenshot_no_image', types: shot.content.map((c) => c.type), text: textOf(shot, 200) })); return null; }
    const path = `${run.user_id}/${run.id}/${Date.now()}.jpg`;
    const { error } = await admin.storage.from('agent-screenshots').upload(path, unb64(img.data), { contentType: img.mimeType || 'image/jpeg' });
    if (error) console.error(JSON.stringify({ area: 'browser-agent', code: 'screenshot_store_failed', detail: error.message }));
    return error ? null : path;
  } catch (e) { console.error(JSON.stringify({ area: 'browser-agent', code: 'screenshot_failed', detail: String((e as any)?.detail || e).slice(0, 200) })); return null; }
}

async function llm(messages: Msg[]): Promise<Msg> {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new McpError('openai_not_configured');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: 'required', parallel_tool_calls: false, temperature: 0.2 }),
    signal: AbortSignal.timeout(60000),
  });
  const body = await response.json().catch(() => null);
  const msg = body?.choices?.[0]?.message;
  if (!response.ok || !msg) throw new McpError('llm_failed', String(body?.error?.message || response.status).slice(0, 200));
  return { role: 'assistant', content: msg.content ?? null, ...(msg.tool_calls?.length ? { tool_calls: msg.tool_calls.slice(0, 1) } : {}) };
}

type Outcome = { content: string; pause?: boolean; end?: boolean; page?: { url: string | null; title: string | null } };

async function runTool(call: ToolCall, run: any, mcp: McpClient, linkedinOk: boolean): Promise<Outcome> {
  const a = parseArgs(call.function.arguments);
  const name = call.function.name;
  const mcpCall = async (tool: string, args: Record<string, unknown>, secrets: string[] = []): Promise<Outcome> => {
    const r: McpResult = await mcp.callTool(tool, args);
    const text = redact(textOf(r), secrets);
    return { content: (r.isError ? 'ERROR: ' : '') + (text || 'done'), page: pageInfo(text) };
  };
  switch (name) {
    case 'open_url': {
      const target = safeUrl(a.url);
      if (!target) return { content: 'ERROR: only public https URLs can be opened.' };
      if (isLinkedIn(target) && !linkedinOk) return { content: 'ERROR: the user has not allowed LinkedIn. Use the company\'s own application page, or call finish with cannot_continue.' };
      return mcpCall('anchor_navigate', { url: target });
    }
    case 'read_page': return mcpCall('anchor_snapshot', {});
    case 'click': {
      const g = guardSubmit(String(a.element), !!run.submit_approved_at, !!run.submit_clicked_at);
      if (!g.allow) return { content: g.reason };
      const out = await mcpCall('anchor_click', { element: String(a.element), ref: String(a.ref) });
      // Count the submit only when the click actually ran (a stale ref fails before clicking).
      if (g.marksSubmit && !out.content.startsWith('ERROR')) { run.submit_clicked_at = new Date().toISOString(); await patch(run.id, { submit_clicked_at: run.submit_clicked_at }); }
      return out;
    }
    case 'type_text': {
      const g = guardSubmit(String(a.element), !!run.submit_approved_at, !!run.submit_clicked_at, !!a.press_enter);
      if (!g.allow) return { content: g.reason };
      return mcpCall('anchor_type', { element: String(a.element), ref: String(a.ref), text: String(a.text ?? '').slice(0, 10000), submit: !!a.press_enter });
    }
    case 'fill_secret': {
      const m = /^secret:([0-9a-f-]{36}):([a-z0-9_]{1,40})$/i.exec(String(a.secret || ''));
      if (!m) return { content: 'ERROR: unknown secret id.' };
      const owned: any = must(await admin.from('skillsurger_agent_requests').select('id').eq('id', m[1]).eq('run_id', run.id).maybeSingle());
      const s: any = owned && must(await admin.from('skillsurger_agent_secrets').select('ciphertext,expires_at').eq('request_id', m[1]).eq('field', m[2]).maybeSingle());
      if (!s || Date.parse(s.expires_at) < Date.now()) return { content: 'ERROR: that secret expired. Ask the user again.' };
      const value = await decrypt(s.ciphertext);
      return mcpCall('anchor_type', { element: String(a.element), ref: String(a.ref), text: value }, [value]);
    }
    case 'select_option':
      return mcpCall('anchor_select_option', { element: String(a.element), ref: String(a.ref), values: (Array.isArray(a.values) ? a.values : [a.values]).map(String).slice(0, 20) });
    case 'press_key': {
      const key = String(a.key || '');
      if (/^(enter|return)$/i.test(key) && !run.submit_approved_at)
        return { content: 'Blocked: Enter can submit the form before the user reviews it. Click the option or button instead.' };
      return mcpCall('anchor_press_key', { key });
    }
    case 'upload_cv': {
      if (!run.cv_file_path) return { content: 'ERROR: no CV file in this browser.' };
      // If the model opened a file chooser anyway, close it so other tools keep working.
      await mcp.callTool('anchor_file_upload', { paths: [] }, 15000).catch(() => undefined);
      const r = await attachFile(run.anchor_session_id, run.cv_file_path, String(a.hint || ''));
      if (!r.attached) return { content: r.inputs ? `ERROR: ${r.inputs} file fields found and none is clearly the resume. Call upload_cv with a hint from the resume field label.` : 'ERROR: no file upload field found on this page. Open the step of the form that asks for a resume first.' };
      const snap = await mcpCall('anchor_snapshot', {});
      return { content: `CV attached (${r.inputs} file field(s) on the page). Check the file name appears:\n` + snap.content, page: snap.page };
    }
    case 'wait': return mcpCall('anchor_wait_for', a.text ? { text: String(a.text).slice(0, 200) } : { time: Math.min(10, Math.max(1, Number(a.seconds) || 2)) });
    case 'go_back': return mcpCall('anchor_navigate_back', {});
    case 'tabs': return typeof a.switch_to === 'number' ? mcpCall('anchor_tab_select', { index: a.switch_to }) : mcpCall('anchor_tab_list', {});
    case 'handle_dialog': return mcpCall('anchor_handle_dialog', { accept: !!a.accept });
    case 'ask_user': {
      const kind = ['login', 'otp', 'new_account', 'question'].includes(a.kind) ? a.kind : 'question';
      const fields = cleanFields(a.fields);
      if (!fields.length) fields.push({ name: 'answer', label: 'Your answer', type: kind === 'otp' ? 'otp' : 'text' });
      must(await admin.from('skillsurger_agent_requests').insert({ run_id: run.id, tool_call_id: call.id, kind, message: String(a.message || '').slice(0, 1000), fields }));
      await patch(run.id, { status: 'waiting_user', activity: String(a.message || 'Waiting for you').slice(0, 300) });
      return { content: '', pause: true };
    }
    case 'ask_user_takeover': {
      must(await admin.from('skillsurger_agent_requests').insert({ run_id: run.id, tool_call_id: call.id, kind: 'takeover', message: String(a.message || '').slice(0, 1000) }));
      await patch(run.id, { status: 'waiting_user', activity: String(a.message || 'Your turn in the browser').slice(0, 300) });
      return { content: '', pause: true };
    }
    case 'request_submit_review': {
      if (run.submit_clicked_at) return { content: 'Submit was already clicked. Read the page and call finish.' };
      const shot = await screenshot(mcp, run);
      const answers = (Array.isArray(a.answers) ? a.answers : []).slice(0, 60).map((x: any) => ({ question: String(x?.question || '').slice(0, 300), answer: String(x?.answer || '').slice(0, 2000) }));
      must(await admin.from('skillsurger_agent_requests').insert({ run_id: run.id, tool_call_id: call.id, kind: 'submit_review',
        message: String(a.summary || 'The form is filled in.').slice(0, 1500), fields: answers, screenshot_path: shot }));
      await patch(run.id, { status: 'ready_to_submit', activity: 'Ready to submit: waiting for your review' });
      await step(run.id, 'ask', 'Filled the form. Waiting for your review before submitting', {}, shot);
      return { content: '', pause: true };
    }
    case 'finish': {
      const shot = await screenshot(mcp, run);
      const result = { outcome: a.outcome, message: String(a.message || '').slice(0, 1500), confirmation: a.confirmation ? String(a.confirmation).slice(0, 500) : null, page_url: run.current_url };
      await step(run.id, 'done', result.message || 'Finished', { url: run.current_url, title: run.current_title }, shot);
      if (a.outcome === 'submitted' && run.submit_clicked_at && confirmed(a.confirmation)) await endRun(run, 'submitted', { result, activity: 'Application submitted' });
      else if (run.submit_clicked_at) await endRun(run, 'check_needed', { result, activity: 'Please check whether the application went through' });
      else await endRun(run, 'stopped', { result, activity: result.message || 'Stopped' });
      return { content: 'ok', end: true };
    }
  }
  return { content: 'ERROR: unknown tool.' };
}

async function work(runId: string) {
  const owner = crypto.randomUUID();
  const leased: any[] = must(await admin.rpc('skillsurger_agent_lease', { p_run_id: runId, p_owner: owner, p_seconds: LEASE_S })) || [];
  let run = leased[0];
  if (!run) return;
  const started = Date.now();
  try {
    if (!enabled()) { await endRun(run, 'stopped', { activity: 'The AI agent is paused', error: 'agent_paused' }); return; }
    const action: any = must(await admin.from('agent_action_ledger').select('payload').eq('id', run.action_id).single());
    const { ok: consented, linkedin } = await consentOf(run.user_id);
    if (!consented) { await endRun(run, 'stopped', { activity: 'Permission withdrawn', error: 'consent_withdrawn' }); return; }
    let messages: Msg[] = Array.isArray(run.messages) ? run.messages : [];
    if (!run.anchor_session_id) run = await openBrowser(run, action);
    let mcp: McpClient;
    try {
      mcp = await anchorBrowserMcp(run.anchor_session_id);
      await mcp.callTool('anchor_tab_list', {}, 20000);
    } catch {
      // The browser timed out while waiting (or crashed): start a fresh one; site logins live in the profile.
      run = await openBrowser({ ...run, anchor_session_id: null }, action);
      mcp = await anchorBrowserMcp(run.anchor_session_id);
      if (messages.length) messages.push({ role: 'user', content: 'The browser was restarted and the page was lost. Open the application URL again and continue. You may still be signed in.' });
    }
    if (messages.length && messages[messages.length - 1].role !== 'assistant') {
      // New connection, new element refs: give the model a fresh snapshot before it acts.
      const snap = textOf(await mcp.callTool('anchor_snapshot', {}).catch(() => ({ content: [] })) as McpResult, 24000);
      if (snap) messages.push({ role: 'user', content: 'Current page (fresh snapshot; earlier element refs are no longer valid):\n' + snap });
    }
    if (!messages.length) {
      const profile: any = must(await admin.from('profiles').select('email').eq('id', run.user_id).maybeSingle());
      const cvText = cvParagraphs(action.payload.cv_content, action.payload.answers || {}).join('\n');
      messages = [{ role: 'system', content: systemPrompt() }, { role: 'user', content: taskMessage({
        jobTitle: action.payload.job_title || '', company: action.payload.company || '', applicationUrl: run.application_url,
        answers: action.payload.answers || {}, coverNote: action.payload.cover_note || '', cvText, userEmail: profile?.email || action.payload.answers?.email || '',
      }) }];
      await step(run.id, 'info', 'Started the AI agent');
    }
    let errors = 0;
    while (Date.now() - started < WORK_MS) {
      const fresh: any = must(await admin.from('skillsurger_agent_runs').select('status,submit_approved_at,lease_owner').eq('id', run.id).single());
      if (fresh.status !== 'working' || fresh.lease_owner !== owner) return; // user stopped it, or another worker took over
      run.submit_approved_at = fresh.submit_approved_at;
      if (run.step_count >= run.max_steps) {
        await step(run.id, 'error', 'Stopped: the step limit for one application was reached');
        await endRun(run, run.submit_clicked_at ? 'check_needed' : 'stopped', { activity: 'Step limit reached', error: 'step_limit' });
        return;
      }
      const reply = await llm(trimHistory(messages));
      const call = reply.tool_calls?.[0];
      messages.push(reply);
      if (!call) { messages.push({ role: 'user', content: 'Use the tools. Call finish when done.' }); continue; }
      const a = parseArgs(call.function.arguments);
      const noteText = String(a.note || call.function.name).slice(0, 300);
      let out: Outcome;
      try { out = await runTool(call, run, mcp, linkedin); errors = 0; }
      catch (e) {
        if (++errors >= 3) throw e;
        out = { content: `ERROR: ${e instanceof McpError ? e.code + ' ' + e.detail : 'tool failed'}. Try read_page.` };
      }
      run.step_count += 1;
      if (out.end) return;
      if (!out.pause) messages.push({ role: 'tool', tool_call_id: call.id, content: out.content.slice(0, 60000) });
      const page = out.page?.url ? out.page : { url: run.current_url, title: run.current_title };
      run.current_url = page.url; run.current_title = page.title;
      if (!out.pause) await step(run.id, out.content.startsWith('Blocked') ? 'info' : stepKind(call.function.name), out.content.startsWith('Blocked') ? (out.content.includes('already clicked') ? 'Prevented a second submit' : 'Held back the final submit until you review it') : noteText, page);
      else if (call.function.name !== 'request_submit_review') await step(run.id, 'ask', noteText, page);
      await admin.from('skillsurger_agent_runs').update({
        messages, step_count: run.step_count, current_url: run.current_url, current_title: run.current_title,
        ...(out.pause ? {} : { activity: noteText }), updated_at: new Date().toISOString(),
        lease_until: new Date(Date.now() + LEASE_S * 1000).toISOString(),
      }).eq('id', run.id).eq('lease_owner', owner);
      if (out.pause) { await patch(run.id, { lease_owner: null, lease_until: null }); return; }
    }
    // Time's up for this invocation: hand over to a fresh one.
    await patch(run.id, { lease_owner: null, lease_until: null });
    await kick(run.id);
  } catch (e) {
    const code = e instanceof McpError || e instanceof anchor.AnchorError ? (e as any).code : 'agent_error';
    console.error(JSON.stringify({ area: 'browser-agent', run: run.id, code, detail: (e as any)?.detail?.slice?.(0, 200) }));
    await step(run.id, 'error', 'The agent hit a problem and stopped. Nothing was submitted unless shown above.').catch(() => undefined);
    await endRun(run, run.submit_clicked_at ? 'check_needed' : 'failed', { error: code, activity: 'Stopped after an error' }).catch(() => undefined);
  }
}

// ---------- routes ----------
export async function handle(request: Request) {
  const origin = request.headers.get('origin') || '';
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin',
    'Access-Control-Allow-Origin': origins.includes(origin) ? origin : origins[0],
    'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info', 'Access-Control-Allow-Methods': 'POST,OPTIONS' };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !origins.includes(origin)) return json({ error: 'origin_not_allowed' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const route = new URL(request.url).pathname.replace(/^.*\/skillsurger-browser-agent/, '');
  try {
    const raw = await request.text();
    if (raw.length > 20000) return json({ error: 'request_too_large' }, 413);
    let body: any;
    try { body = raw ? JSON.parse(raw) : {}; if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(); }
    catch { return json({ error: 'invalid_json' }, 400); }
    const auth = request.headers.get('authorization') || '';
    if (auth === `Bearer ${serviceKey}`) {
      if (route === '/work') {
        if (!UUID.test(String(body.runId))) return json({ error: 'run_required' }, 400);
        background(work(body.runId));
        return json({ accepted: true }, 202);
      }
      if (route === '/mcp-tools') return json({ tools: (await (await anchorBrowserMcp()).listTools()).map((t) => t.name) });
      return json({ error: 'not_found' }, 404);
    }
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!token || token === Deno.env.get('SUPABASE_ANON_KEY')) throw new RequestError(401, 'sign_in_required');
    const user = await admin.auth.getUser(token);
    if (user.error || !user.data.user) throw new RequestError(401, 'sign_in_required');
    const uid = user.data.user.id;

    if (route === '/consent') {
      if (typeof body.enabled !== 'boolean') throw new RequestError(400, 'invalid_consent');
      const now = new Date().toISOString();
      must(await admin.from('skillsurger_agent_consent').upsert({ user_id: uid, policy_version: POLICY, granted_at: now,
        revoked_at: body.enabled ? null : now, linkedin_risk_accepted_at: body.enabled && body.linkedin === true ? now : null }));
      return json(await consentOf(uid));
    }
    if (route === '/context') {
      const a = await ownAction(uid, body.actionId);
      const latest: any = must(await admin.from('skillsurger_agent_runs').select('*').eq('action_id', a.id).eq('user_id', uid)
        .order('created_at', { ascending: false }).limit(1).maybeSingle());
      return json({ enabled: enabled(), allowed: enabled() && await allowedUser(uid), consent: await consentOf(uid),
        linkedin_url: isLinkedIn(a.payload.application_url), run: await view(latest) });
    }
    if (route === '/start') {
      if (!enabled()) throw new RequestError(404, 'agent_paused');
      if (!await allowedUser(uid)) throw new RequestError(403, 'agent_not_enabled');
      await activePlan(uid);
      const consent = await consentOf(uid);
      if (!consent.ok) throw new RequestError(409, 'consent_required');
      const a = await ownAction(uid, body.actionId);
      const target = safeUrl(a.payload.application_url);
      if (!target) throw new RequestError(409, 'application_url_required');
      if (isLinkedIn(target) && !consent.linkedin) throw new RequestError(409, 'linkedin_consent_required');
      if (a.payload.execution_mode === 'anchor') throw new RequestError(409, 'reviewed_board_flow');
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count } = await admin.from('skillsurger_agent_runs').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', since);
      if ((count ?? 0) >= WEEKLY_RUNS) throw new RequestError(429, 'weekly_limit_reached');
      const claimed = must(await admin.rpc('skillsurger_agent_claim', { p_action_id: a.id }));
      if (!claimed) throw new RequestError(409, 'approval_required');
      const ins = await admin.from('skillsurger_agent_runs').insert({ user_id: uid, action_id: a.id, application_url: target, activity: 'Opening a secure browser…' }).select('*').single();
      if (ins.error) {
        must(await admin.from('agent_action_ledger').update({ state: 'needs_you' }).eq('id', a.id).eq('state', 'running'));
        throw new RequestError(409, 'run_already_active');
      }
      await kick(ins.data.id);
      return json({ run: await view(ins.data) });
    }

    const run = await ownRun(uid, body.runId);
    if (route === '/state') {
      // Heartbeat: restart a run whose worker went away.
      if (['starting', 'working'].includes(run.status) && (!run.lease_until || Date.parse(run.lease_until) < Date.now()) &&
        Date.now() - Date.parse(run.updated_at) > 20000) await kick(run.id);
      return json({ run: await view(run) });
    }
    if (route === '/stop') {
      if (LIVE.includes(run.status)) {
        await step(run.id, 'info', 'You stopped the agent');
        await endRun(run, run.submit_clicked_at ? 'check_needed' : 'stopped', { activity: 'Stopped by you' });
      }
      return json({ run: await view(await ownRun(uid, run.id)) });
    }
    if (route === '/confirm-outcome') {
      if (run.status !== 'check_needed' || typeof body.submitted !== 'boolean') throw new RequestError(409, 'nothing_to_confirm');
      if (body.submitted) await endRun(run, 'submitted', { result: { ...(run.result || {}), confirmed_by: 'user' }, activity: 'You confirmed the application was submitted' });
      else await endRun(run, 'stopped', { activity: 'Not submitted. You can try again or apply yourself' });
      return json({ run: await view(await ownRun(uid, run.id)) });
    }
    if (route === '/answer') {
      if (typeof body.requestId !== 'string' || !UUID.test(body.requestId)) throw new RequestError(400, 'request_not_found');
      const req: any = must(await admin.from('skillsurger_agent_requests').select('*').eq('id', body.requestId).eq('run_id', run.id).eq('status', 'pending').maybeSingle());
      if (!req || !['waiting_user', 'ready_to_submit'].includes(run.status)) throw new RequestError(409, 'request_not_found');
      let toolResult: string;
      let extra: Record<string, unknown> = {};
      const stored: Record<string, string> = {};
      if (req.kind === 'submit_review') {
        if (body.decision === 'approve') {
          extra = { submit_approved_at: new Date().toISOString() };
          toolResult = 'The user APPROVED. Click the final submit button exactly once now, then read the page and call finish.';
          await step(run.id, 'submit', 'You approved. Submitting the application');
        } else {
          const feedback = String(body.feedback || '').slice(0, 1500);
          toolResult = `The user did NOT approve yet. Their feedback: ${JSON.stringify(feedback || 'Please re-check the answers.')} Fix it, then call request_submit_review again.`;
          await step(run.id, 'info', 'You asked for changes before submitting');
          stored.feedback = feedback;
        }
      } else if (req.kind === 'takeover' || body.mode === 'browser') {
        toolResult = 'The user says they finished this themselves in the live browser. Call read_page to see where things are, then continue.';
        await step(run.id, 'info', 'You finished this step in the browser');
      } else if (body.decline === true) {
        toolResult = 'The user chose not to provide this. If you cannot continue without it, call finish with cannot_continue.';
        await step(run.id, 'info', 'You skipped this question');
      } else {
        const values = body.values && typeof body.values === 'object' ? body.values : {};
        const secrets: Record<string, string> = {};
        for (const f of req.fields as { name: string; type: string }[]) {
          const v = values[f.name];
          if (typeof v !== 'string' || !v.trim()) continue;
          if (SECRET_TYPES.includes(f.type)) {
            must(await admin.from('skillsurger_agent_secrets').upsert({ request_id: req.id, field: f.name, ciphertext: await encrypt(v.slice(0, 500)) }));
            secrets[f.name] = `secret:${req.id}:${f.name}`;
          } else stored[f.name] = v.slice(0, 4000);
        }
        if (!Object.keys(stored).length && !Object.keys(secrets).length) throw new RequestError(400, 'answer_required');
        toolResult = JSON.stringify({ answered: true, values: stored, secrets, note: Object.keys(secrets).length ? 'Type secrets with fill_secret using these ids.' : undefined });
        await step(run.id, 'info', Object.keys(secrets).length ? 'You sent your details (passwords are hidden from the AI)' : 'You answered the question');
      }
      must(await admin.from('skillsurger_agent_requests').update({ status: 'answered', answer: stored, answered_at: new Date().toISOString() }).eq('id', req.id));
      const messages = Array.isArray(run.messages) ? run.messages : [];
      messages.push({ role: 'tool', tool_call_id: req.tool_call_id, content: toolResult });
      await patch(run.id, { messages, status: 'working', activity: 'Continuing…', ...extra });
      await kick(run.id);
      return json({ run: await view(await ownRun(uid, run.id)) });
    }
    return json({ error: 'not_found' }, 404);
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.code }, error.status);
    console.error(JSON.stringify({ area: 'skillsurger-browser-agent', route, code: error instanceof anchor.AnchorError || error instanceof McpError ? (error as any).code : 'request_failed', detail: String((error as any)?.message || '').slice(0, 200) }));
    return json({ error: 'request_failed' }, 503);
  }
}
if (import.meta.main) Deno.serve(handle);
