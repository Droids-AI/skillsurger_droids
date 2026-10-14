const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = 'http://127.0.0.1:4185';
const root = path.resolve('dist');
const server = http.createServer((req, res) => {
  const target = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  const file = fs.existsSync(target) && fs.statSync(target).isFile() ? target : fs.existsSync(path.join(target, 'index.html')) ? path.join(target, 'index.html') : path.join(root, 'index.html');
  res.setHeader('Content-Type', ({ '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.mjs': 'application/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(4185, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const evidence = { cases: [], environment: 'local build / mocked providers / synthetic data' };
  const passed = name => { evidence.cases.push(name); console.log('PASS: ' + name); };
  try {
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'qa@example.com', aud: 'authenticated', role: 'authenticated', created_at: new Date().toISOString() };
    const profile = { id: user.id, full_name: 'Synthetic QA', email: user.email, onboarding_completed: true, city: '', country: '', preferred_locations: ['Bangalore'], current_role: 'Software Engineer', years_of_experience: 3, summary: '', skills: ['Python', 'AWS'], education: [], experience: [], projects: [], cv_parsed_data: {} };
    const savedJobs = [], learningPaths = [], aiSessions = [], searches = [], profileUpdates = [];
    let auditCalls = 0, auditError = false, activeTrial = true, signupExisting = false, signupProfileWrites = 0, generationEmpty = true;
    const apiJobs = [
      { job_id: 'us-job', title: 'Senior Software Engineer', company_name: 'Pearson', location: 'St Paul, MN, United States', description: 'US job.', extensions: ['$120,000 per year'], detected_extensions: { posted_at: '2 days ago' } },
      { job_id: 'india-job', title: 'Senior Software Engineer', company_name: 'Synthetic India', location: 'Bengaluru, Karnataka, India', description: 'Python AWS '.repeat(110), extensions: ['₹18,00,000 per year'], detected_extensions: { posted_at: '2 days ago' } },
      { job_id: 'junior-job', title: 'Junior Software Engineer', company_name: 'Synthetic Junior', location: 'Mumbai, India', description: 'Graduate software engineer.', detected_extensions: { posted_at: '14 days ago' } },
    ];
    async function context(authenticated) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      if (authenticated) await context.addInitScript(({ user }) => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })) + '.synthetic';
        localStorage.setItem('supabase.auth.token', JSON.stringify({ access_token: token, refresh_token: 'synthetic-refresh', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, user }));
      }, { user });
      await context.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url()), method = request.method();
        const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
        if (url.origin === base) return route.continue();
        if (url.pathname.includes('/auth/v1/signup')) return signupExisting ? json({ code: 'user_already_exists', msg: 'User already registered' }, 422) : json({ user, session: null });
        if (url.pathname.includes('/auth/v1/user')) return json(user);
        if (url.pathname.includes('/dodo/subscription/')) return json({ success: true, data: activeTrial ? { id: 'trial', user_id: user.id, subscription_status: 'active', subscription_tier: 'trial', created_at: new Date().toISOString(), is_active: true } : null });
        if (url.pathname.includes('/candidate/jobs')) { searches.push(request.postDataJSON()); await new Promise(resolve => setTimeout(resolve, 250)); return json({ data: apiJobs }); }
        if (url.pathname.includes('/openai/skillsurger')) {
          const input = request.postDataJSON();
          if (input.type === 'generateVerifiedLearningResources') return json({ success: true, data: { resources: [] } });
          return json({ success: true, data: [] });
        }
        if (url.pathname.includes('/functions/v1/register-resume-audit')) {
          auditCalls++;
          if (auditError) return json({ errors: { phoneNumber: 'Please check this phone number.' } }, 400);
          return json({ leadId: 'audit-id', emailStatus: 'accepted' });
        }
        if (url.pathname.includes('/storage/v1/object/')) return json({ Key: 'synthetic-resume' });
        if (url.pathname.includes('/rest/v1/')) {
          const table = url.pathname.split('/').pop();
          const single = request.headers().accept?.includes('object+json');
          let data = [];
          if (table === 'profiles') {
            if (method === 'PATCH') { const update = request.postDataJSON(); profileUpdates.push(update); Object.assign(profile, update); }
            if (method === 'POST') signupProfileWrites++;
            const returned = generationEmpty && url.searchParams.get('select') === '*' ? { ...profile, skills: [], cv_parsed_data: {} } : profile;
            data = single ? returned : [returned];
          }
          if (table === 'user_skills') data = generationEmpty ? [] : [{ skill: 'Python' }, { skill: 'AWS' }];
          if (table === 'user_interests') data = [];
          if (table === 'saved_jobs') {
            if (method === 'POST') { const incoming = request.postDataJSON(); for (const job of Array.isArray(incoming) ? incoming : [incoming]) savedJobs.push({ ...job, id: 'saved-' + (savedJobs.length + 1) }); }
            data = single ? savedJobs[0] || null : savedJobs;
          }
          if (table === 'learning_paths') {
            if (method === 'POST') { const row = request.postDataJSON(); const item = { ...row, id: row.id || 'path-' + (learningPaths.length + 1), created_at: new Date().toISOString() }; const index = learningPaths.findIndex(path => path.id === item.id); if (index === -1) learningPaths.push(item); else learningPaths[index] = item; data = single ? item : [item]; }
            else { let found = learningPaths; const title = url.searchParams.get('job_title'); if (title) found = found.filter(path => path.job_title === title.slice(3)); data = single ? found[0] || null : found; }
          }
          if (table === 'ai_mentorship_sessions') {
            if (method === 'POST') { const row = request.postDataJSON()[0]; aiSessions.push({ ...row, id: 'session-1', created_at: new Date().toISOString() }); }
            data = single ? aiSessions[aiSessions.length - 1] : aiSessions;
          }
          return json(data);
        }
        return route.abort();
      });
      return context;
    }
    const guest = await context(false), page = await guest.newPage();
    await page.goto(base + '/');
    assert.ok(!(await page.locator('main').innerText()).match(/5,000\+|98%|500\+|Tredence|Careers Transformed/));
    await page.goto(base + '/job-readiness-index');
    assert.ok(!(await page.locator('main').innerText()).includes('10,000+'));
    passed('Unsupported homepage and readiness claims removed');
    await page.goto(base + '/user-type-selection');
    const card = page.getByRole('button', { name: /Experienced Professional/ });
    await card.focus(); await page.keyboard.press('Enter');
    assert.equal(await card.getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByText('After this step, upload your CV in Profile to add your skills and experience.', { exact: true }).waitFor();
    passed('Profile-type selection works by keyboard; CV onboarding copy describes the next action');

    await page.goto(base + '/free-resume-audit');
    await page.getByLabel('Full name', { exact: false }).fill('Synthetic Audit');
    await page.getByLabel('Email', { exact: false }).fill('qa@example.com');
    await page.getByLabel('Resume (PDF)', { exact: false }).setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF synthetic test fixture') });
    await page.getByText('Optional contact and role details', { exact: true }).click();
    await page.getByLabel('Phone number (optional)', { exact: true }).fill('1234567890');
    await page.getByRole('button', { name: 'Get Free Resume Audit', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'starting with 6' }).waitFor();
    assert.equal(auditCalls, 0);
    auditError = true;
    await page.getByLabel('Phone number (optional)', { exact: true }).fill('9876543210');
    await page.getByRole('button', { name: 'Get Free Resume Audit', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Please check this phone number.' }).waitFor();
    auditError = false;
    await page.getByLabel('Phone number (optional)', { exact: true }).fill('');
    await page.getByRole('button', { name: 'Get Free Resume Audit', exact: true }).click();
    await page.waitForURL('**/thank-you?type=resume-audit&email=accepted');
    await page.getByText('Your confirmation email has been sent. Check your inbox and spam folder.', { exact: true }).waitFor();
    passed('Audit: local and server field errors, optional phone, minimal submission and email receipt');

    await page.goto(base + '/signup');
    await page.getByLabel('Full Name', { exact: true }).fill('Synthetic QA');
    await page.getByLabel('Email address', { exact: true }).fill('qa@example.com');
    await page.getByLabel('Password', { exact: true }).fill('SyntheticPassword123!');
    await page.getByLabel('Confirm Password', { exact: true }).fill('SyntheticPassword123!');
    await page.locator('#terms').check();
    signupExisting = true; await page.getByRole('button', { name: 'Create account', exact: true }).click();
    const notice = 'If signup can be completed, check your inbox to continue. You can also log in or reset your password.';
    await page.getByText(notice, { exact: true }).waitFor();
    signupExisting = false; await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.getByText(notice, { exact: true }).waitFor();
    assert.equal(signupProfileWrites, 0);
    passed('Signup uses the same notice for existing emails and signup awaiting confirmation');

    await page.goto(base + '/job-search?title=Software%20Engineer');
    await page.getByRole('status').filter({ hasText: 'Searching current job listings' }).waitFor();
    await page.getByText('Showing 3 of 3 jobs matching your search', { exact: true }).waitFor();
    await page.getByLabel('Experience', { exact: true }).selectOption('entry');
    await page.getByText('Showing 1 of 3 jobs matching your search', { exact: true }).waitFor();
    await page.getByLabel('Posted date', { exact: true }).selectOption('7');
    await page.getByText('Showing 0 of 3 jobs matching your search', { exact: true }).waitFor();
    await page.getByLabel('Experience', { exact: true }).selectOption('');
    await page.getByLabel('Filter by location').fill('Bangalore');
    await page.getByText('Showing 1 of 3 jobs matching your search', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Read full description', exact: true }).click();
    assert.ok(await page.getByRole('button', { name: 'Show less', exact: true }).count());
    passed('Public job search works without a paywall, with progress, counts, location/experience/date filters and expandable descriptions');

    const signedIn = await context(true), dashboard = await signedIn.newPage();
    activeTrial = false;
    await dashboard.goto(base + '/dashboard?section=profile');
    await dashboard.getByRole('heading', { name: 'Profile Management', exact: true }).waitFor();
    assert.equal(new URL(dashboard.url()).pathname, '/dashboard');
    assert.equal(await dashboard.getByText('Step 1 of 4', { exact: true }).count(), 0);
    passed('New account with no subscription can use Profile without pricing or a blocking tour');
    activeTrial = true; generationEmpty = false;
    await dashboard.goto(base + '/dashboard?section=mentorship');
    await dashboard.getByRole('button', { name: 'Explore Careers & Save Jobs', exact: true }).waitFor();
    assert.equal(await dashboard.getByRole('button', { name: 'Human Mentors', exact: true }).count(), 0);
    await dashboard.getByRole('button', { name: 'Explore Careers & Save Jobs', exact: true }).click();
    await dashboard.getByRole('button', { name: 'Find Jobs Based on Profile', exact: true }).click();
    await dashboard.getByText('Synthetic India', { exact: true }).first().waitFor();
    assert.equal(searches.at(-1).location, 'Bangalore, India');
    assert.equal(searches.at(-1).countryCode, 'in');
    assert.equal(await dashboard.getByText('Pearson', { exact: true }).count(), 0);
    assert.ok((await dashboard.locator('main').innerText()).includes('₹18,00,000'));
    for (const width of [320, 390, 768, 1280]) { await dashboard.setViewportSize({ width, height: 900 }); assert.ok(await dashboard.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Dashboard overflow at ' + width); }
    await dashboard.setViewportSize({ width: 1280, height: 900 });
    await dashboard.getByRole('button', { name: 'Save Job', exact: true }).click();
    await dashboard.getByRole('button', { name: 'Saved', exact: true }).waitFor();
    await dashboard.getByRole('button', { name: 'Mentorship Hub', exact: true }).click();
    await dashboard.locator('select').filter({ has: dashboard.locator('option', { hasText: 'Senior Software Engineer at Synthetic India' }) }).waitFor();
    assert.equal(savedJobs.length, 1);
    passed('Bangalore profile yields local jobs with INR pay; dashboard widths fit and newly saved jobs immediately reach interviews');

    await dashboard.getByRole('button', { name: 'AI Mentor', exact: true }).click();
    await dashboard.getByPlaceholder('e.g., Career Transition to Tech').fill('Career growth');
    await dashboard.getByRole('button', { name: 'Start Session', exact: true }).click();
    await dashboard.getByText(/Hi! I’m your AI career mentor/).waitFor();
    passed('AI Mentor opens with a persisted greeting; unavailable Human Mentors tab is hidden');

    generationEmpty = true;
    await dashboard.getByRole('button', { name: 'Learning Paths', exact: true }).click();
    await dashboard.getByRole('button', { name: 'Generate My Learning Path', exact: true }).click();
    await dashboard.getByText(/We could not find learning resources for your profile/).waitFor();
    assert.equal(learningPaths.length, 0);
    generationEmpty = false;
    await dashboard.getByRole('button', { name: 'Generate My Learning Path', exact: true }).click();
    await dashboard.getByText('The Python Tutorial', { exact: true }).waitFor();
    assert.equal(learningPaths.length, 1);
    assert.ok(learningPaths[0].resources.length >= 2);
    passed('Empty generation shows an error and saves nothing; retry with Python/AWS saves usable resources');
    learningPaths[0].resources=[];
    await dashboard.goto(base + '/dashboard?section=learning');
    await dashboard.getByRole('button', {name:'Retry learning path',exact:true}).click();
    await dashboard.getByText('The Python Tutorial', {exact:true}).waitFor();
    assert.equal(learningPaths.length,1);
    assert.ok(learningPaths[0].resources.length>=2);
    passed('Previously saved empty learning path can be repaired without creating a duplicate');
    await dashboard.goto(base + '/user-type-selection');
    await dashboard.getByRole('button', {name:/Experienced Professional/}).click();
    await dashboard.getByRole('button', {name:'Continue',exact:true}).click();
    await dashboard.getByPlaceholder('Enter your full name').fill('Synthetic QA');
    await dashboard.getByPlaceholder('e.g., Software Engineer').fill('Software Engineer');
    await dashboard.getByPlaceholder('Enter a number').fill('3');
    await dashboard.getByPlaceholder('e.g., Bangalore, Mumbai, Remote').fill('Bangalore');
    await dashboard.getByRole('button', {name:'Save and Continue',exact:true}).click();
    await dashboard.getByRole('heading', {name:'Profile Management',exact:true}).waitFor();
    assert.equal(profileUpdates.at(-1).city,'Bangalore');
    assert.deepEqual(profileUpdates.at(-1).preferred_locations,['Bangalore']);
    passed('Onboarding saves preferred locations and profile city');
    await dashboard.screenshot({ path: 'artifacts/qa-learning-path.png', fullPage: true });
    await guest.close(); await signedIn.close();
    console.log(`PASS: ${evidence.cases.length} report browser scenarios. All external requests intercepted; no live leads or messages.`);
  } finally { fs.mkdirSync('artifacts', { recursive: true }); fs.writeFileSync('artifacts/qa-report-browser-evidence.json', JSON.stringify(evidence, null, 2)); await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
