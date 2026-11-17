// Runs the real Anchor test-board task code against the real /qa/test-job page (local dev server) in local Chromium.
// skillsurger.com is served from the dev server; the inbox POST is answered locally. Nothing reaches production.
// Usage: dev server on :5173, then: node --experimental-strip-types scripts/check-test-board-task.mjs
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { runApplication, textPdf } from '../automation/tasks/skillsurger-test-board.ts';

const DEV = process.env.DEV_URL || 'http://localhost:5173';
const SUBMIT = 'https://jpnunlbnthcfvstyymdl.supabase.co/functions/v1/skillsurger-test-board';
const ACTION = '0b0b0b0b-0000-4000-8000-000000000001';
const base = {
  contract_version: 'application_v1', action_id: ACTION, idempotency_key: ACTION, payload_hash: 'a'.repeat(64),
  application_url: 'https://skillsurger.com/qa/test-job', cv_version_id: '0b0b0b0b-0000-4000-8000-000000000002',
  cv_json: JSON.stringify({ headline: 'Site Reliability Engineer', summary: { text: 'Runs (production) systems — on call.' }, sections: [{ heading: 'Experience', items: [{ text: 'Cut deploy time at Acme' }] }] }),
  answers_json: JSON.stringify({ full_name: 'Test Candidate', email: 'candidate@skillsurger.test', phone: '+91 90000 00000' }),
  cover_note: 'Approved note', local_run_id: 'x', submit_authorization_token: 'y',
};

const browser = await chromium.launch();
async function scenario(name, inputs, authorize, extra) {
  const page = await browser.newPage();
  const posts = [];
  await page.route('**/*', async (route) => {
    const req = route.request(); const u = new URL(req.url());
    if (u.href === SUBMIT) {
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } });
      const body = req.postDataBuffer() || Buffer.alloc(0);
      posts.push(body.toString('latin1'));
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ confirmation_reference: 'SKS-TEST-LOCAL', action_id: ACTION }) });
    }
    if (u.hostname === 'skillsurger.com') {
      const r = await fetch(DEV + u.pathname + u.search);
      return route.fulfill({ status: r.status, headers: Object.fromEntries(r.headers), body: Buffer.from(await r.arrayBuffer()) });
    }
    return route.continue();
  });
  if (extra) await extra(page);
  const result = await runApplication(page, { ...base, ...inputs }, authorize);
  await page.close();
  console.log('PASS', name, '→', result.outcome);
  return { result, posts };
}

try {
  assert.ok(new TextDecoder().decode(textPdf(['Hello (world)', 'Ünïcode — text'])).startsWith('%PDF-1.4'));
  let authorizeCalls = 0;
  const ok = await scenario('approved run submits once with a bound receipt', {}, async () => { authorizeCalls++; return true; });
  assert.equal(ok.result.outcome, 'submitted'); assert.equal(ok.result.confirmation_reference, 'SKS-TEST-LOCAL');
  assert.equal(ok.result.action_id, ACTION); assert.equal(ok.posts.length, 1); assert.equal(authorizeCalls, 1);
  for (const field of ['Test Candidate', 'candidate@skillsurger.test', 'Approved note', ACTION, '%PDF-1.4', 'Site Reliability Engineer']) assert.ok(ok.posts[0].includes(field), field);

  const denied = await scenario('no submit permission → nothing sent', {}, async () => false);
  assert.equal(denied.result.outcome, 'not_submitted'); assert.equal(denied.posts.length, 0);

  const missing = await scenario('missing approved phone → needs input, nothing sent', { answers_json: JSON.stringify({ full_name: 'A', email: 'a@b.co' }) }, async () => true);
  assert.equal(missing.result.outcome, 'needs_input'); assert.equal(missing.posts.length, 0);

  const other = await scenario('any other URL is refused', { application_url: 'https://evil.example.com/qa/test-job' }, async () => true);
  assert.equal(other.result.outcome, 'not_submitted'); assert.equal(other.posts.length, 0);

  const early = await scenario('page script posting before permission is blocked', {}, async () => false, async (page) => {
    await page.addInitScript(() => { addEventListener('load', () => { fetch('https://jpnunlbnthcfvstyymdl.supabase.co/functions/v1/skillsurger-test-board', { method: 'POST', body: 'x' }).catch(() => {}); }); });
  });
  assert.equal(early.posts.length, 0);
  console.log('PASS: test-board task (local Chromium, real page, faked inbox).');
} finally {
  await browser.close();
}
