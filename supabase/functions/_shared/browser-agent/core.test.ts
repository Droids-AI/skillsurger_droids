import { assert, assertEquals } from 'jsr:@std/assert@1';
import { cleanFields, guardSubmit, isFinalSubmit, isLinkedIn, pageInfo, redact, safeUrl, TOOLS, trimHistory, type Msg } from './core.ts';

Deno.test('final submit wording is recognised; form navigation is not', () => {
  for (const s of ['Submit application', 'Submit', 'button "Submit Application"', 'Send application', 'Complete application', 'Finish and submit application'])
    assert(isFinalSubmit(s), s);
  for (const s of ['Easy Apply', 'Apply now', 'Apply on company website', 'Next', 'Continue', 'Review your application', 'Upload resume', 'Sign in'])
    assert(!isFinalSubmit(s), s);
});

Deno.test('submit is blocked until approved, then allowed exactly once', () => {
  assertEquals(guardSubmit('Submit application', false, false).allow, false);
  assertEquals(guardSubmit('Submit application', true, false), { allow: true, marksSubmit: true });
  assertEquals(guardSubmit('Submit application', true, true).allow, false);
  assertEquals(guardSubmit('Next', false, false), { allow: true, marksSubmit: false });
  // Enter inside an application field could submit the form
  assertEquals(guardSubmit('Application question: years of experience', false, false, true).allow, false);
});

Deno.test('only public https URLs; LinkedIn detection', () => {
  assert(safeUrl('https://www.linkedin.com/jobs/view/123'));
  assert(safeUrl('https://boards.greenhouse.io/acme/jobs/1'));
  for (const bad of ['http://acme.com', 'https://user:pw@acme.com', 'https://localhost/x', 'https://127.0.0.1/', 'https://x.supabase.co/functions', 'javascript:alert(1)', 'https://acme.com:8443/'])
    assertEquals(safeUrl(bad), null, bad);
  assert(isLinkedIn('https://in.linkedin.com/jobs/view/1'));
  assert(!isLinkedIn('https://notlinkedin.com/'));
});

Deno.test('secrets are redacted from tool output', () => {
  const out = redact(`await page.getByRole('textbox', { name: 'Password' }).fill('p@ss\\'w"rd');\n"p@ss'w\\"rd"`, [`p@ss'w"rd`]);
  assert(!out.includes('p@ss'), out);
});

Deno.test('old snapshots are trimmed, recent kept', () => {
  const big = 'x'.repeat(5000);
  const msgs: Msg[] = [{ role: 'system', content: 's' }, ...Array.from({ length: 6 }, (_, i) => ({ role: 'tool' as const, tool_call_id: String(i), content: big }))];
  const t = trimHistory(msgs, 2);
  assertEquals(t.filter((m) => m.content === big).length, 2);
  assert(String(t[1].content).includes('older page snapshot removed'));
});

Deno.test('page info and ask fields are parsed defensively', () => {
  assertEquals(pageInfo('- Page URL: https://a.com/x\n- Page Title: Apply | Acme\n'), { url: 'https://a.com/x', title: 'Apply | Acme' });
  const f = cleanFields([{ name: 'pass word', label: 'Password', type: 'password' }, { name: 'pass word', label: 'dup', type: 'text' }, { name: 'x', label: 'X', type: 'weird' }]);
  assertEquals(f.map((x) => [x.name, x.type]), [['pass_word', 'password'], ['x', 'text']]);
});

Deno.test('every tool requires a user-facing note', () => {
  for (const t of TOOLS) assert(t.function.parameters.required.includes('note'), t.function.name);
});

import { confirmed } from './core.ts';
import { resumeScore } from '../cdp.ts';
Deno.test('submitted needs a real confirmation from the site', () => {
  assert(confirmed('Thank you for applying! Application received.'));
  assert(confirmed('Confirmation #A12345'));
  for (const t of ['', 'No explicit confirmation message displayed.', 'none', 'N/A', 'Confirmation not shown'])
    assert(!confirmed(t), t);
});
Deno.test('resume field is preferred over cover letter / photo fields', () => {
  assert(resumeScore(['type', 'file', 'name', 'resume', 'accept', '.pdf,.doc']) > resumeScore(['type', 'file', 'name', 'cover_letter']));
  assert(resumeScore(['type', 'file', 'id', 'photo', 'accept', 'image/*']) < 0);
});
