// Contract tests for 20261110030000_application_pipeline.sql (S11, S13) on top of the agent core.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const JOB = '33333333-3333-3333-3333-333333333333';

(async () => {
  const db = new PGlite();
  const as = (role, uid = '') => db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${uid}',false)`);
  const pass = (n) => console.log('PASS', n);
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth, public to anon, authenticated, service_role;
      insert into auth.users values ('${A}'), ('${B}');
      create table public.saved_jobs (id uuid primary key, user_id uuid, title text, company text, status text not null default 'saved');
      grant select, update on public.saved_jobs to authenticated, service_role;
      insert into public.saved_jobs (id, user_id, title, company) values ('${JOB}', '${A}', 'SRE', 'Acme');
    `);
    await db.exec(fs.readFileSync('supabase/migrations/20261110020000_agent_platform_core.sql', 'utf8'));
    const m = fs.readFileSync('supabase/migrations/20261110030000_application_pipeline.sql', 'utf8');
    await db.exec(m); await db.exec(m);
    pass('migration loads and re-runs');

    // S11: no application without an approved tailored CV
    await as('authenticated', A);
    const payload = (cv) => `'{"saved_job_id":"${JOB}","cv_version_id":"${cv}"}'`;
    await assert.rejects(db.query(`select * from agent_create_action('skillsurger','apply_job','apply_job:${A}:${JOB}','Acme: SRE',${payload('00000000-0000-0000-0000-000000000000')})`), /approved tailored CV/);
    await db.exec('reset role');
    const cv = (await db.query(`insert into skillsurger_tailored_cvs (user_id, saved_job_id, version, facts, content) values ('${A}','${JOB}',1,'[]','{}') returning id`)).rows[0].id;
    await as('authenticated', A);
    await assert.rejects(db.query(`select * from agent_create_action('skillsurger','apply_job','apply_job:${A}:${JOB}','Acme: SRE',${payload(cv)})`), /approved tailored CV/, 'draft CV is not enough');
    await db.exec('reset role'); await db.exec(`update skillsurger_tailored_cvs set status='approved' where id='${cv}'`);
    await as('authenticated', B);
    await assert.rejects(db.query(`select * from agent_create_action('skillsurger','apply_job','apply_job:${B}:${JOB}','Acme: SRE',${payload(cv)})`), /approved tailored CV/, "another user's CV");
    await as('authenticated', A);
    const created = (await db.query(`select * from agent_create_action('skillsurger','apply_job','apply_job:${A}:${JOB}','Acme: SRE',${payload(cv)})`)).rows[0];
    assert.equal(created.created, true);
    await db.exec('reset role');
    await assert.rejects(db.query(`insert into skillsurger_tailored_cvs (user_id, saved_job_id, version, facts, content, status) values ('${A}','${JOB}',2,'[]','{}','approved')`), /duplicate key/, 'one approved CV per job');
    pass('S11: applications need an approved tailored CV of the same user and job');

    // S13: one sequence per job-contact; status change stops it
    const seq = (await db.query(`insert into skillsurger_outreach_sequences (user_id, saved_job_id, contact_name) values ('${A}','${JOB}','Priya') returning id`)).rows[0].id;
    await assert.rejects(db.query(`insert into skillsurger_outreach_sequences (user_id, saved_job_id, contact_name) values ('${A}','${JOB}','priya')`), /duplicate key/);
    await db.exec(`insert into skillsurger_outreach_messages (sequence_id, user_id, step, body) values ('${seq}','${A}','connection_note','Hi'), ('${seq}','${A}','referral_ask','Could you')`);
    await db.exec(`update skillsurger_outreach_messages set status='sent' where step='connection_note'`);
    await db.exec(`update saved_jobs set status='applied' where id='${JOB}'`);
    assert.equal((await db.query(`select status from skillsurger_outreach_sequences where id='${seq}'`)).rows[0].status, 'active', 'applied does not stop outreach');
    await db.exec(`update saved_jobs set status='interviewing' where id='${JOB}'`);
    const s = (await db.query(`select status, stop_reason from skillsurger_outreach_sequences where id='${seq}'`)).rows[0];
    assert.equal(s.status, 'stopped'); assert.equal(s.stop_reason, 'job_status_interviewing');
    const msgs = (await db.query(`select step, status from skillsurger_outreach_messages order by step`)).rows;
    assert.deepEqual(msgs, [{ step: 'connection_note', status: 'sent' }, { step: 'referral_ask', status: 'skipped' }]);
    pass('S13: one sequence per job-contact; interview/offer/rejection stops it and skips unsent drafts');

    // Read access
    await as('authenticated', B);
    for (const t of ['skillsurger_tailored_cvs', 'skillsurger_outreach_sequences', 'skillsurger_outreach_messages']) {
      assert.equal((await db.query(`select count(*)::int n from ${t}`)).rows[0].n, 0, t);
    }
    await assert.rejects(db.query(`insert into skillsurger_outreach_sequences (user_id, saved_job_id, contact_name) values ('${B}','${JOB}','x')`), /permission denied/);
    await as('anon');
    await assert.rejects(db.query('select * from skillsurger_tailored_cvs'), /permission denied/);
    pass('owner-only reads; browser cannot write; anon denied');
    console.log('PASS: application pipeline contracts (synthetic in-memory database only).');
  } finally {
    await db.close();
  }
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
