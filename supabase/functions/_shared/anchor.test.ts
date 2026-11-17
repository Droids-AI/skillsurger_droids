import { assertEquals, assert } from 'jsr:@std/assert@1';
import { deleteIdentity, parseConfiguredSites, readiness } from './anchor.ts';

Deno.test('site configuration accepts only domain names and application ID strings', () => {
  assertEquals(parseConfiguredSites('{"jobs.example.com":"app-1"}'), { 'jobs.example.com': 'app-1' });
  for (const raw of ['null', '[]', '"string"', '{', '{"jobs.example.com":42}', '{"https://jobs.example.com":"app"}', '{"__proto__":"app"}', '{"jobs.example.com":""}']) {
    assertEquals(parseConfiguredSites(raw), {});
  }
});

Deno.test('identity deletion accepts an empty 204 and an already-deleted 404', async () => {
  const previous = Deno.env.get('ANCHOR_API_KEY');
  const originalFetch = globalThis.fetch;
  try {
    Deno.env.set('ANCHOR_API_KEY', 'synthetic-key');
    for (const status of [204, 404]) {
      globalThis.fetch = (_input, init) => {
        assertEquals(init?.method, 'DELETE');
        return Promise.resolve(new Response(null, { status }));
      };
      await deleteIdentity('synthetic-verified-identity');
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) Deno.env.delete('ANCHOR_API_KEY'); else Deno.env.set('ANCHOR_API_KEY', previous);
  }
});

// Fetch is replaced in these tests. No Anchor browser, identity or task is created.
Deno.test('readiness checks the provider using GET only and returns no keys or application IDs', async () => {
  const keys = ['ANCHOR_API_KEY', 'ANCHOR_APPLICATIONS', 'ANCHOR_WEBHOOK_SECRET', 'FF_SKILLSURGER_CONNECT'];
  const previous = keys.map(k => Deno.env.get(k));
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  try {
    Deno.env.set('ANCHOR_API_KEY', 'test-secret-do-not-return');
    Deno.env.set('ANCHOR_APPLICATIONS', '{"jobs.example.com":"private-app-id"}');
    Deno.env.set('ANCHOR_WEBHOOK_SECRET', 'private-webhook');
    Deno.env.delete('FF_SKILLSURGER_CONNECT');
    globalThis.fetch = (input, init) => {
      requests.push(String(input));
      assertEquals(init?.method || 'GET', 'GET');
      assertEquals(init?.redirect, 'error', 'never forward the key to another host');
      const body = String(input).endsWith('/billing')
        ? { data: { tier: 'monthly_starter', credits: 50, cost_limit: 100, secret_extra: 'hidden' } }
        : { applications: [{ id: 'private-app-id', url: 'https://jobs.example.com/login?token=private', name: 'private-name' }] };
      return Promise.resolve(new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }));
    };
    const report = await readiness();
    assertEquals(requests.sort(), ['https://api.anchorbrowser.io/v1/applications', 'https://api.anchorbrowser.io/v1/billing']);
    assertEquals(report.pilot_ready, false, 'paid plan is not proof of pilot readiness');
    assertEquals(report.applications, { ok: true, available: [{ host: 'jobs.example.com' }], configured: [{ site: 'jobs.example.com', found: true }] });
    for (const secret of ['test-secret-do-not-return', 'private-app-id', 'private-webhook', 'private-name', 'secret_extra', '?token=']) assert(!JSON.stringify(report).includes(secret));

    globalThis.fetch = () => Promise.resolve(new Response('{"error":"private provider message"}', { status: 401 }));
    const rejected = await readiness();
    assertEquals(rejected.billing, { ok: false, code: 'anchor_auth_rejected', http_status: 401 });
    assert(!JSON.stringify(rejected).includes('private provider message'));

    Deno.env.delete('ANCHOR_API_KEY');
    globalThis.fetch = () => { throw new Error('must not call without key'); };
    assertEquals((await readiness()).authentication, 'unconfigured');
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((k, i) => previous[i] === undefined ? Deno.env.delete(k) : Deno.env.set(k, previous[i]!));
  }
});
