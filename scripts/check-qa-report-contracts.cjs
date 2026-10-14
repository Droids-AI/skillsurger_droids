const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');

function load(file, overrides = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8').replace(/import\.meta\.env/g, '({})'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports, console: { error() {}, log() {}, warn() {} }, URL, Date, Response, Request, TextEncoder, Uint8Array, AbortSignal, crypto: webcrypto, ...overrides };
  context.require = overrides.require || (name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name.endsWith('.ts') ? name : name + '.ts'), overrides) : require(name));
  vm.runInNewContext(code, context, { filename: file });
  return exports;
}
const location = load('src/lib/jobLocation.ts');
assert.equal(location.profileJobLocation({ city: '', preferred_locations: ['Bangalore'] }), 'Bangalore, India');
assert.equal(location.jobCountryCode('Bengaluru'), 'in');
assert.equal(location.matchesJobLocation({ location: 'St Paul, MN, United States' }, 'Bangalore, India'), false);
assert.equal(location.matchesJobLocation({ location: 'Bangalore, United States' }, 'Bangalore, India'), false);
assert.equal(location.matchesJobLocation({ location: 'Bengaluru, Karnataka, India' }, 'Bangalore, India'), true);
assert.equal(location.jobSalary({ salary_currency: 'INR', salary_min: 1800000, salary_max: 2400000 }, ''), '₹18,00,000 – ₹24,00,000');
assert.equal(location.jobSalary({ salary_currency: 'INR', salary_min: 1800000 }, '$120,000'), '$120,000');
const validation = load('supabase/functions/_shared/auditValidation.ts');
assert.ok(validation.phoneError('+911234567890').includes('starting with 6'));
for (const phone of ['', '+919876543210', '+12025550147', '+447123456789']) assert.equal(validation.phoneError(phone), undefined);
assert.equal(Object.keys(validation.validateAudit({ fullName: 'QA', email: 'qa@example.com', resumeStoragePath: '11111111-1111-4111-8111-111111111111/cv.pdf' })).length, 0);

(async () => {
  // Exercise the real resource-generation and completion pipeline, including empty AI output.
  const curated = load('src/lib/curatedLearningResources.ts');
  const generated = load('src/lib/enhancedLearningResources.ts', { require(name) {
    if (name === 'axios') return { default: { post: async () => ({ data: { success: true, data: { resources: [] } } }) } };
    if (name.includes('curatedLearningResources')) return curated;
    if (name.includes('courseValidation')) return { verifyCourseCandidates: async resources => resources, normalizeCourseMetadata: resource => resource };
    if (name.includes('linkVerification')) return {};
    if (name.includes('safeLogging')) return { reportError() {} };
    throw new Error(name);
  } });
  const resources = await generated.generateVerifiedLearningResources('Software Engineer', '', ['Python', 'AWS']);
  assert.equal(resources.length, 2);
  assert.ok(resources.some(resource => resource.url === 'https://docs.python.org/3/tutorial/'));
  const plans = load('src/lib/openai.ts', { require(name) {
    if (name.includes('enhancedLearningResources')) return generated;
    if (name.includes('safeLogging')) return { reportError() {} };
    return {};
  } });
  await assert.rejects(plans.generateLearningPlan('Unknown role', '', []), /could not find learning resources/);
  assert.equal((await plans.generateLearningPlan('Engineer', '', ['Python', 'AWS'])).length, 2);

  let sends = 0, failSend = false;
  const env = { LEAD_CONFIRMATION_WEBHOOK_URL: 'https://receipt.invalid', LEAD_CONFIRMATION_WEBHOOK_SECRET: 'synthetic-secret' };
  const emails = new Map();
  const admin = { from(table) {
    assert.equal(table, 'lead_email_notifications');
    let update, filters = [], selected = false, single = false;
    const query = { upsert(row) { if (!emails.has(row.lead_id)) emails.set(row.lead_id, { status: 'pending' }); return query; }, update(row) { update = row; return query; }, eq(key, value) { filters.push([key, value]); return query; }, select() { selected = true; return query; }, single() { single = true; return query; }, then(resolve, reject) {
      const rows = [...emails].filter(([id, row]) => filters.every(([key, value]) => (key === 'lead_id' ? id : row[key]) === value)).map(([id, row]) => { if (update) Object.assign(row, update); return { lead_id: id, ...row }; });
      return Promise.resolve({ data: single ? rows[0] : selected ? rows : null, error: null }).then(resolve, reject);
    } }; return query;
  } };
  const { sendLeadConfirmation } = load('supabase/functions/_shared/leadConfirmation.ts', { Deno: { env: { get: key => env[key] } }, fetch: async () => { sends++; if (failSend) throw new Error('timeout'); return new Response('{"success":true}'); } });
  const receipt = { leadId: 'lead-1', email: 'qa@example.com', name: 'QA', subject: 'Receipt', body: 'Confirmation' };
  assert.equal(await sendLeadConfirmation(admin, receipt), 'accepted');
  assert.equal(await sendLeadConfirmation(admin, receipt), 'accepted');
  assert.equal(sends, 1);
  failSend = true;
  assert.equal(await sendLeadConfirmation(admin, { ...receipt, leadId: 'lead-2' }), 'failed');
  assert.equal(await sendLeadConfirmation(admin, { ...receipt, leadId: 'lead-2' }), 'failed');
  assert.equal(sends, 2, 'Uncertain email sends must not auto-repeat');
  delete env.LEAD_CONFIRMATION_WEBHOOK_SECRET;
  assert.equal(await sendLeadConfirmation(admin, { ...receipt, leadId: 'lead-3' }), 'unconfigured');
  assert.equal(sends, 2);

  env.LEAD_CONFIRMATION_WEBHOOK_SECRET='synthetic-secret';
  failSend=false;
  assert.equal(await sendLeadConfirmation(admin, { ...receipt, leadId: 'lead-3' }), 'accepted');
  assert.equal(sends, 3, 'Known unconfigured non-sends can safely recover after setup');
  let handler, failPersistence=false;
  const auditLeads=new Map();
  const auditAdmin={from:admin.from,async rpc(name,args){
    if(name==='webinar_rate_limit')return {data:true,error:null};
    assert.equal(name,'register_resume_audit');
    if(failPersistence)return {error:{message:'synthetic failure'}};
    const existing=auditLeads.get(args.p_request_id);
    if(existing)return {data:{leadId:existing,alreadyRegistered:true},error:null};
    const leadId='audit-'+(auditLeads.size+1);auditLeads.set(args.p_request_id,leadId);
    return {data:{leadId,alreadyRegistered:false},error:null};
  }};
  load('supabase/functions/register-resume-audit/index.ts',{
    Deno:{env:{get:key=>({...env,SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic'})[key]},serve:fn=>{handler=fn}},
    require(name){if(name.includes('auditValidation'))return validation;if(name.includes('leadConfirmation'))return {sendLeadConfirmation};return {createClient:()=>auditAdmin};},
    fetch:async()=>new Response('{"success":true}'),
  });
  const auditInput={requestId:'11111111-1111-4111-8111-111111111111',fullName:'Synthetic QA',email:'audit@example.com',resumeStoragePath:'11111111-1111-4111-8111-111111111111/resume.pdf'};
  const auditRequest=(input=auditInput)=>new Request('https://synthetic.invalid',{method:'POST',headers:{origin:'https://skillsurger.com'},body:JSON.stringify(input)});
  const invalid=await handler(auditRequest({...auditInput,phoneNumber:'+911234567890'}));
  assert.equal(invalid.status,400);assert.ok((await invalid.json()).errors.phoneNumber);assert.equal(auditLeads.size,0);
  const beforeAuditEmails=sends;
  failPersistence=true;assert.equal((await handler(auditRequest())).status,500);assert.equal(sends,beforeAuditEmails);failPersistence=false;
  const auditSuccess=await handler(auditRequest());assert.equal(auditSuccess.status,200);assert.equal((await auditSuccess.json()).emailStatus,'accepted');
  assert.equal((await handler(auditRequest())).status,200);assert.equal(auditLeads.size,1);assert.equal(sends,beforeAuditEmails+1);

  const properties = new Map([['LEAD_CONFIRMATION_WEBHOOK_SECRET', 'synthetic-secret']]);
  let mailCount = 0;
  const script = { PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties.get(key), setProperty: (key, value) => properties.set(key, value) }) }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }, MailApp: { sendEmail() { mailCount++; } }, ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: json => ({ result: JSON.parse(json), setMimeType() { return this; } }) } };
  vm.runInNewContext(fs.readFileSync('scripts/google-apps-script/book-a-call-webhook.gs', 'utf8'), script);
  const confirmation = { ...receipt, leadId: '11111111-1111-4111-8111-111111111111', secret: 'synthetic-secret' };
  assert.equal(script.sendLeadConfirmation({ ...confirmation, secret: 'wrong' }).result.success, false);
  assert.equal(mailCount, 0);
  assert.equal(script.sendLeadConfirmation(confirmation).result.success, true);
  assert.equal(script.sendLeadConfirmation(confirmation).result.success, true);
  assert.equal(mailCount, 1);

  const metadataRoutes = JSON.parse(fs.readFileSync('artifacts/route-metadata-manifest.json', 'utf8'));
  for (const route of metadataRoutes) {
    const html = fs.readFileSync(route === '/' ? 'dist/index.html' : `dist${route}/index.html`, 'utf8');
    assert.equal((html.match(/<title\b/g) || []).length, 1);
    for (const tag of ['name="description"', 'property="og:title"', 'property="og:description"', 'property="og:image"', 'name="twitter:card"']) assert.ok(html.includes(tag), `${route}: missing ${tag}`);
    assert.ok(html.includes(`https://skillsurger.com${route}`));
  }
  assert.ok(fs.readFileSync('dist/og-image.png').length > 1000);
  console.log('PASS: report regressions for Python/AWS resources, empty-plan rejection, Bangalore location, published INR salaries, optional/invalid phone validation, email idempotence and failure states, authenticated Apps Script receipts, and metadata on every generated route. Providers mocked; no live messages.');
})().catch(error => { console.error(error); process.exitCode = 1; });
