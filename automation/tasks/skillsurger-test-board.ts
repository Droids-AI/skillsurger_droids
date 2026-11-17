// Anchor code task "skillsurger-test-board" (application_v1). Deterministic: no AI, page text is never an instruction.
// Fills ONLY skillsurger.com/qa/test-job with approved values, asks Skillsurger for the one-time submit
// permission, clicks submit once and returns a receipt bound to the approved action.
// Uploaded with: POST /v1/task + /v1/task/{id}/deploy (see skillsurger-automation /provision-code-task).

import { chromium } from 'playwright';

const SITE = 'skillsurger.com';
const PATH = '/qa/test-job';
const SUBMIT_URL = 'https://jpnunlbnthcfvstyymdl.supabase.co/functions/v1/skillsurger-test-board';
const AUTH_URL = 'https://jpnunlbnthcfvstyymdl.supabase.co/functions/v1/skillsurger-automation/authorize-submit';
const ASSET_HOSTS = ['skillsurger.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

type Inputs = Record<string, string>;
let currentStep = 'start';
let currentPage: any = null;
type Outcome = 'submitted' | 'already_submitted' | 'needs_login' | 'needs_input' | 'not_submitted' | 'unknown';

/** Minimal multi-page text PDF (Helvetica, Latin-1). The CV only contains approved text. */
export function textPdf(paragraphs: string[]): Uint8Array {
  const clean = (s: string) => s.replace(/[^\x20-\x7e]/g, (c) => ({ '–': '-', '—': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '•': '-' } as Record<string, string>)[c] ?? '?');
  const lines: string[] = [];
  for (const p of paragraphs) {
    const words = clean(String(p)).split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 90) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
    }
    if (line) lines.push(line);
    lines.push('');
  }
  const perPage = 56;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  if (!pages.length) pages.push(['']);
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const objects: string[] = [];
  const pageIds = pages.map((_, i) => 4 + i * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  pages.forEach((pageLines, i) => {
    const stream = `BT /F1 10 Tf 13 TL 50 800 Td ${pageLines.map((l) => `(${esc(l)}) '`).join(' ')} ET`;
    objects[pageIds[i]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageIds[i] + 1} 0 R >>`;
    objects[pageIds[i] + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) { offsets[id] = out.length; out += `${id} 0 obj\n${objects[id]}\nendobj\n`; }
  const xref = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n` + offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

export function cvParagraphs(cv: any, answers: Record<string, string>): string[] {
  return [answers.full_name, [answers.email, answers.phone, answers.location].filter(Boolean).join(' | '), cv?.headline, cv?.summary?.text,
    ...((cv?.sections || []) as any[]).flatMap((s) => [String(s.heading || '').toUpperCase(), ...((s.items || []) as any[]).map((i) => '- ' + i.text)])]
    .filter((v) => typeof v === 'string' && v.trim()).map((v) => v.slice(0, 5000));
}

/** Fill a field; if the normal fill can't act in time, set the value directly (the form's fields are uncontrolled). */
async function setField(page: any, selector: string, value: string) {
  const el = page.locator(selector);
  try { await el.fill(value, { timeout: 8000 }); }
  catch { await el.evaluate((node: any, v: string) => { node.value = v; node.dispatchEvent(new Event('input', { bubbles: true })); }, value, { timeout: 8000 }); }
  if (await el.inputValue({ timeout: 5000 }) !== value) throw new Error('field_value_mismatch ' + selector);
}

/** Core flow, testable with any Playwright page. `authorize` asks the backend for the one-time submit permission. */
export async function runApplication(page: any, inputs: Inputs, authorize: () => Promise<boolean>) {
  const bound = { action_id: inputs.action_id, payload_hash: inputs.payload_hash, cv_version_id: inputs.cv_version_id, application_url: inputs.application_url };
  const result = (outcome: Outcome, extra: Record<string, string> = {}) => ({ ...bound, outcome, ...extra });
  const target = new URL(inputs.application_url);
  if (inputs.contract_version !== 'application_v1' || target.protocol !== 'https:' || target.hostname !== SITE || target.port ||
    target.username || target.password || target.pathname !== PATH || !inputs.action_id || !inputs.payload_hash || !inputs.cv_version_id ||
    inputs.idempotency_key !== inputs.action_id) return result('not_submitted');
  const answers: Record<string, string> = JSON.parse(inputs.answers_json || '{}');
  const cv = JSON.parse(inputs.cv_json || 'null');
  let submitAllowed = false, submitSent = false;
  // Only the reviewed site loads; the only write is ONE POST to the test inbox after permission.
  await page.route('**/*', async (route: any) => {
    const req = route.request(); const u = new URL(req.url());
    if (req.isNavigationRequest() && req.frame() === page.mainFrame() && u.hostname !== SITE) return route.abort();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
      if (!submitAllowed || submitSent || req.method() !== 'POST' || u.href !== SUBMIT_URL) return route.abort();
      submitSent = true; return route.fallback();
    }
    if (u.href === SUBMIT_URL && req.method() === 'OPTIONS') return route.fallback();
    if (!ASSET_HOSTS.includes(u.hostname)) return route.abort();
    return route.fallback();
  });
  currentPage = page; currentStep = 'goto';
  for (let attempt = 1; ; attempt++) {
    try { await page.goto(target.href, { waitUntil: 'load', timeout: 30000 }); break; }
    catch (e) { if (attempt >= 3) throw e; await page.waitForTimeout(2000); } // loading a page never submits anything
  }
  if (new URL(page.url()).hostname !== SITE) return result('unknown');
  currentStep = 'wait_form';
  try { await page.locator('#application').waitFor({ state: 'visible', timeout: 20000 }); } catch { return result('not_submitted'); }
  for (const [key, selector] of [['full_name', '#full-name'], ['email', '#email'], ['phone', '#phone']]) {
    const value = answers[key];
    if (typeof value !== 'string' || !value.trim()) return result('needs_input');
    currentStep = 'fill ' + selector;
    await setField(page, selector, value);
  }
  currentStep = 'fill #cover-note';
  await setField(page, '#cover-note', inputs.cover_note || '');
  currentStep = 'set idempotency';
  await page.locator('#idempotency-key').evaluate((el: any, v: string) => { el.value = v; }, inputs.idempotency_key);
  currentStep = 'upload cv';
  await page.locator('#resume').setInputFiles({ name: 'approved-cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from(textPdf(cvParagraphs(cv, answers))) });
  // Never guess: any other required field means the form changed since review.
  const unknown = await page.locator('#application').evaluate((form: any) =>
    [...form.querySelectorAll('input[required],select[required],textarea[required]')]
      .filter((el: any) => !['full-name', 'email', 'phone', 'resume'].includes(el.id)).length);
  if (unknown) return result('needs_input');
  currentStep = 'authorize';
  if (!await authorize()) return result('not_submitted');
  submitAllowed = true;
  currentStep = 'click submit';
  await page.locator('#submit-application').click({ timeout: 10000 }); // exactly one click
  try { await page.locator('#receipt').waitFor({ state: 'visible', timeout: 20000 }); } catch { return result('unknown'); }
  const reference = await page.locator('#receipt').getAttribute('data-receipt');
  const receiptAction = await page.locator('#receipt').getAttribute('data-action-id');
  if (!reference || receiptAction !== inputs.action_id) return result('unknown');
  return result('submitted', { confirmation_reference: reference });
}

function readInputs(env: Record<string, string | undefined>): Inputs {
  const keys = ['contract_version', 'action_id', 'payload_hash', 'application_url', 'cv_version_id', 'cv_json', 'answers_json', 'cover_note',
    'idempotency_key', 'local_run_id', 'submit_authorization_token'];
  return Object.fromEntries(keys.map((k) => [k, env['ANCHOR_' + k.toUpperCase()] || '']));
}

export default async function run() {
  const inputs = readInputs(process.env as Record<string, string | undefined>);
  // Anchor starts this task's own browser session (with the task's domain allowlist) and passes its CDP URL.
  const browser = await chromium.connectOverCDP(process.env.ANCHOR_CDP_URL as string);
  try {
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    return await runApplication(page, inputs, async () => {
      const r = await fetch(AUTH_URL, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ run_id: inputs.local_run_id, token: inputs.submit_authorization_token }) });
      return r.ok && (await r.json()).authorized === true;
    });
  } catch (error: any) {
    // An error after the click is ambiguous: report unknown so Skillsurger reconciles instead of retrying.
    // Only the error type and a short message are returned (no inputs).
    return { action_id: inputs.action_id, payload_hash: inputs.payload_hash, cv_version_id: inputs.cv_version_id, application_url: inputs.application_url, outcome: 'unknown',
      error: `${error?.name || 'Error'}: ${String(error?.message || '').split('\n')[0].slice(0, 300)}`, step: currentStep,
      page_url: currentPage ? String(currentPage.url()).slice(0, 200) : null,
      page_text: currentPage ? String(await currentPage.locator('body').innerText({ timeout: 3000 }).catch(() => '')).replace(/\s+/g, ' ').slice(0, 400) : null, input_sizes: Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, v.length])) };
  } finally {
    await browser.close().catch(() => {});
  }
}
