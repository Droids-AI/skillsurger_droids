// Contract tests for 20261117010000_anchor_test_board.sql. Synthetic in-memory database only.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const A = '11111111-1111-1111-1111-111111111111';
const db = new PGlite();
const as = (role, uid = '') => db.exec(`reset role;set role ${role};select set_config('request.jwt.claim.sub','${uid}',false)`);
const one = async (sql, args = []) => (await db.query(sql, args)).rows[0];
const pass = (n) => console.log('PASS', n);
const URL_ = 'https://skillsurger.com/qa/test-job';
const TASK = 'code:0b0b0b0b-0000-4000-8000-00000000000a:1';
const HASH = 'b'.repeat(64);

(async () => {
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,public to anon,authenticated,service_role;
      insert into auth.users values('${A}');
      create table saved_jobs(id uuid primary key default gen_random_uuid(),user_id uuid,title text,company text,status text default 'saved');
      grant all on saved_jobs to service_role;`);
    for (const f of ['20261110020000_agent_platform_core.sql', '20261110030000_application_pipeline.sql', '20261117000000_anchor_application_worker.sql', '20261117010000_anchor_test_board.sql'])
      await db.exec(fs.readFileSync('supabase/migrations/' + f, 'utf8'));
    await db.exec(fs.readFileSync('supabase/migrations/20261117010000_anchor_test_board.sql', 'utf8'));
    pass('test-board migration loads and re-runs');

    await db.exec(`insert into skillsurger_automation_boards(site,application_id,task_id,revision,enabled,terms_url,terms_verified_at,reviewed_by,max_run_credits,requires_login)
        values('skillsurger.com','first-party','${TASK}','test-board-1',true,'https://skillsurger.com/terms',now(),'operator',1,false);
      insert into skillsurger_automation_policy values('${A}',true,10,2);
      insert into skillsurger_automation_consent(user_id,policy_version) values('${A}','2026-11-17');`);
    const job = (await one(`insert into saved_jobs(user_id,title,company) values($1,'QA Test Role','Skillsurger') returning id`, [A])).id;
    const cv = await one(`insert into skillsurger_tailored_cvs(user_id,saved_job_id,version,facts,content,status) values($1,$2,1,'[]','{"headline":"x","sections":[]}','approved') returning *`, [A, job]);
    const payload = { saved_job_id: job, cv_version_id: cv.id, cv_content: cv.content, execution_mode: 'anchor', application_url: URL_, destination: URL_,
      answers: { full_name: 'T', email: 't@skillsurger.com', phone: '1' }, cover_note: '', automation: { site: 'skillsurger.com', task_id: TASK, revision: 'test-board-1', max_run_credits: '1' } };
    await as('authenticated', A);
    const action = (await one(`select * from agent_create_action('skillsurger','apply_job','t1',$1,$2)`, [URL_, JSON.stringify(payload)])).action_id;
    const hash = (await one('select payload_hash from agent_action_ledger where id=$1', [action])).payload_hash;
    await one(`select * from agent_decide_approval($1,'approved',$2)`, [action, hash]);
    await as('service_role');

    await assert.rejects(one(`select skillsurger_receive_test_application($1,'T','t@x.co','1','','${HASH}',10)`, [action]), /not_an_authorized_test_application/);
    pass('inbox refuses a submission with no run');

    const run = (await one('select skillsurger_enqueue_application($1,$2) id', [action, A])).id;
    pass('login-free board runs without a connected account');
    const leased = await one(`select * from skillsurger_lease_application($1,'w1')`, [run]);
    assert.equal((await one(`select skillsurger_begin_application($1,'w1',$2,$3) ok`, [run, leased.lock_gen, HASH])).ok, true);
    await assert.rejects(one(`select skillsurger_receive_test_application($1,'T','t@x.co','1','','${HASH}',10)`, [action]), /not_an_authorized_test_application/);
    pass('inbox refuses a run that has not used its submit permission');
    assert.equal((await one(`select skillsurger_authorize_submit($1,$2) ok`, [run, HASH])).ok, true);
    const ref = (await one(`select skillsurger_receive_test_application($1,'T','t@x.co','1','note','${HASH}',10) r`, [action])).r;
    assert.match(ref, /^SKS-TEST-[0-9A-F]{10}$/);
    assert.equal((await one(`select skillsurger_receive_test_application($1,'T','t@x.co','1','note','${HASH}',10) r`, [action])).r, ref);
    assert.equal((await one('select count(*)::int n from skillsurger_test_board_applications')).n, 1);
    pass('authorized run gets one receipt; a repeat returns the same reference');

    await db.exec(`update skillsurger_automation_boards set requires_login=true, revision='test-board-2'`);
    const job2 = (await one(`insert into saved_jobs(user_id,title,company) values($1,'QA Test Role 2','Skillsurger') returning id`, [A])).id;
    const cv2 = await one(`insert into skillsurger_tailored_cvs(user_id,saved_job_id,version,facts,content,status) values($1,$2,1,'[]','{"headline":"y","sections":[]}','approved') returning *`, [A, job2]);
    const p2 = { ...payload, saved_job_id: job2, cv_version_id: cv2.id, cv_content: cv2.content, automation: { ...payload.automation, revision: 'test-board-2' } };
    await as('authenticated', A);
    const action2 = (await one(`select * from agent_create_action('skillsurger','apply_job','t2',$1,$2)`, [URL_, JSON.stringify(p2)])).action_id;
    await one(`select * from agent_decide_approval($1,'approved',(select payload_hash from agent_action_ledger where id=$1))`, [action2]);
    await as('service_role');
    await assert.rejects(db.query('select skillsurger_check_automation_application($1)', [action2]), /verified_connection_required/);
    pass('boards that need sign-in still require a verified account');

    for (const role of ['anon', 'authenticated']) {
      await as(role, role === 'authenticated' ? A : '');
      await assert.rejects(db.query('select * from skillsurger_test_board_applications'), /permission denied/);
      await assert.rejects(db.query(`select skillsurger_receive_test_application($1,'T','t@x.co','1','','${HASH}',10)`, [action]), /permission denied/);
    }
    pass('browser roles cannot read the inbox or post to it directly');
    console.log('PASS: test-board contracts (synthetic in-memory database only).');
  } finally { await db.close(); }
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
