// Contract tests for supabase/migrations/20261110020000_agent_platform_core.sql
// (the Supabase adaptation of the master plan's Part D T0-T11). In-memory PGlite only.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const BRAND = '33333333-3333-3333-3333-333333333333';

(async () => {
  const db = new PGlite();
  const as = async (role, uid) => db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${uid || ''}',false)`);
  const admin = async () => db.exec(`reset role; select set_config('request.jwt.claim.sub','',false)`);
  const rejects = async (sql, re, name) => {
    await assert.rejects(db.query(sql), re, name);
  };
  const pass = name => console.log('PASS', name);
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth, public to anon, authenticated, service_role;
      insert into auth.users values ('${A}'), ('${B}');
    `);
    const migration = fs.readFileSync('supabase/migrations/20261110020000_agent_platform_core.sql', 'utf8');
    await db.exec(migration);
    await db.exec(migration); // re-runnable
    pass('T0 migration loads and re-runs');

    // T1/T2 memory RLS and brand isolation
    await admin();
    await db.exec(`insert into agent_memory_record (user_id, product, record_type, body, source) values ('${B}','skillsurger','profile_fact','{"role":"pm"}','user_statement')`);
    await as('authenticated', A);
    await db.exec(`insert into agent_memory_record (user_id, product, record_type, body, source) values ('${A}','skillsurger','profile_fact','{"role":"engineer"}','user_statement')`);
    assert.equal((await db.query('select count(*)::int n from agent_memory_record')).rows[0].n, 1, 'A sees only own memory');
    await rejects(`insert into agent_memory_record (user_id, product, record_type, body, source) values ('${B}','skillsurger','profile_fact','{}','user_statement')`, /row-level security/, 'cannot write as B');
    await rejects(`insert into agent_memory_record (user_id, product, brand_id, record_type, body, source) values ('${A}','gencon','${BRAND}','brand_rule','{}','user_statement')`, /row-level security/, 'brand row needs membership');
    await admin(); await db.exec(`insert into agent_brand_member values ('${BRAND}','${A}')`);
    await as('authenticated', A);
    await db.exec(`insert into agent_memory_record (user_id, product, brand_id, record_type, body, source) values ('${A}','gencon','${BRAND}','brand_rule','{"banned":["guaranteed"]}','user_statement')`);
    await rejects(`insert into agent_brand_member values ('${BRAND}','${A}')`, /permission denied/, 'users cannot join brands');
    pass('T1/T2 memory RLS, write check and brand isolation');

    // T3 supersede must stay inside same user + product
    await admin();
    const bRow = (await db.query(`select id from agent_memory_record where user_id='${B}'`)).rows[0].id;
    const aRow = (await db.query(`select id from agent_memory_record where user_id='${A}' and product='skillsurger'`)).rows[0].id;
    await as('authenticated', A);
    await rejects(`insert into agent_memory_record (user_id, product, record_type, body, source, supersedes_id) values ('${A}','skillsurger','profile_fact','{}','correction','${bRow}')`, /same user and product/, 'cross-user supersede');
    await db.exec(`insert into agent_memory_record (user_id, product, record_type, body, source, supersedes_id) values ('${A}','skillsurger','profile_fact','{"role":"senior engineer"}','correction','${aRow}')`);
    pass('T3 supersede same-owner');

    // T4 idempotent action creation via RPC
    const create = `select * from agent_create_action('skillsurger','apply_job','apply_job:${A}:job9','jobboard.example.com','{"cv":"v1","answers":{"notice":"30d"}}')`;
    const first = (await db.query(create)).rows[0];
    const second = (await db.query(create)).rows[0];
    assert.equal(first.created, true); assert.equal(second.created, false); assert.equal(first.action_id, second.action_id);
    assert.equal((await db.query(`select count(*)::int n from agent_action_ledger`)).rows[0].n, 1);
    await rejects(`insert into agent_action_ledger (user_id, product, action_type, intent_key, destination, payload, payload_hash) values ('${A}','skillsurger','apply_job','x','d','{}','h')`, /permission denied/, 'no direct ledger insert from browser');
    await rejects(`update agent_action_ledger set state='queued'`, /permission denied/, 'no direct ledger update from browser');
    pass('T4 intent_key dedupe; browser cannot write ledger directly');

    // T6 approvals bound to hash, expiry, revocation; T7 owner check
    const action = first.action_id;
    const hash = (await db.query(`select payload_hash from agent_action_ledger where id='${action}'`)).rows[0].payload_hash;
    await rejects(`select agent_decide_approval('${action}','approved','wrong-hash')`, /approval_payload_mismatch/, 'hash mismatch refused');
    await as('authenticated', B);
    await rejects(`select agent_decide_approval('${action}','approved','${hash}')`, /action not found/, 'B cannot approve A action');
    await as('authenticated', A);
    const approvalId = (await db.query(`select agent_decide_approval('${action}','approved','${hash}') id`)).rows[0].id;
    await rejects(`select agent_claim_action('${action}')`, /permission denied/, 'browser cannot claim execution');
    await as('service_role');
    // revoked approval blocks execution
    await admin(); await db.exec(`update agent_approval set revoked_at = now() where id='${approvalId}'`);
    await as('service_role');
    assert.equal((await db.query(`select agent_claim_action('${action}') id`)).rows[0].id, null, 'revoked blocks');
    await admin(); await db.exec(`update agent_approval set revoked_at = null, expires_at = now() - interval '1 minute' where id='${approvalId}'`);
    await as('service_role');
    assert.equal((await db.query(`select agent_claim_action('${action}') id`)).rows[0].id, null, 'expired blocks');
    await admin(); await db.exec(`update agent_approval set expires_at = now() + interval '1 hour' where id='${approvalId}'`);
    await as('service_role');
    assert.equal((await db.query(`select agent_claim_action('${action}') id`)).rows[0].id, action, 'valid approval executes');
    assert.equal((await db.query(`select agent_claim_action('${action}') id`)).rows[0].id, null, 'second claim does nothing');
    await admin();
    await rejects(`insert into agent_approval (action_id, user_id, payload_hash, expires_at) values ('${action}','${B}','${hash}', now())`, /same user/, 'approval owner check');
    pass('T6/T7 approval hash, revocation, expiry, single claim, owner check');

    // edited approval re-hashes the payload
    await as('authenticated', A);
    const e = (await db.query(`select * from agent_create_action('skillsurger','apply_job','apply_job:${A}:job10','jobboard.example.com','{"cv":"v1"}')`)).rows[0];
    const eh = (await db.query(`select payload_hash from agent_action_ledger where id='${e.action_id}'`)).rows[0].payload_hash;
    await db.query(`select agent_decide_approval('${e.action_id}','edited','${eh}','{"cv":"v2"}')`);
    const after = (await db.query(`select payload_hash, state from agent_action_ledger where id='${e.action_id}'`)).rows[0];
    assert.notEqual(after.payload_hash, eh); assert.equal(after.state, 'queued');
    const r = (await db.query(`select * from agent_create_action('skillsurger','apply_job','apply_job:${A}:job11','jobboard.example.com','{}')`)).rows[0];
    const rh = (await db.query(`select payload_hash from agent_action_ledger where id='${r.action_id}'`)).rows[0].payload_hash;
    await db.query(`select agent_decide_approval('${r.action_id}','rejected','${rh}')`);
    assert.equal((await db.query(`select state from agent_action_ledger where id='${r.action_id}'`)).rows[0].state, 'failed');
    pass('T6b edited approval re-hashes; rejection fails the action');

    // T5 terminal states never move; illegal transitions refused
    await admin();
    await db.exec(`update agent_action_ledger set state='done' where id='${action}'`);
    await rejects(`update agent_action_ledger set state='running' where id='${action}'`, /terminal state/, 'done is terminal');
    await rejects(`update agent_action_ledger set state='done' where id='${e.action_id}'`, /illegal ledger transition/, 'queued -> done refused');
    pass('T5 state machine guard');

    // T8 connect state consumed once; browser cannot read tokens or consume
    await db.exec(`insert into agent_connect_state values ('st1','${A}','skillsurger','jobboard.example.com','app1','tok1', now() + interval '15 minutes', null),
                                                     ('st2','${A}','skillsurger','other.example.com','app1','tok2', now() - interval '1 minute', null)`);
    await as('authenticated', A);
    await rejects(`select * from agent_connect_state`, /permission denied/, 'browser cannot read connect tokens');
    await rejects(`select * from agent_consume_connect_state('st1')`, /permission denied/, 'browser cannot consume');
    await as('service_role');
    assert.equal((await db.query(`select * from agent_consume_connect_state('st1')`)).rows.length, 1);
    assert.equal((await db.query(`select * from agent_consume_connect_state('st1')`)).rows.length, 0, 'second consume');
    assert.equal((await db.query(`select * from agent_consume_connect_state('st2')`)).rows.length, 0, 'expired state');
    pass('T8 connect state atomic, single-use, expiring, server-only');

    // T9 queue lease and fencing
    await admin();
    await db.exec(`insert into agent_job_queue (kind, payload) values ('apply', '{}')`);
    const claim = `with cte as (select id from agent_job_queue where done_at is null and run_at <= now()
                     and (locked_at is null or locked_at < now() - interval '10 minutes') order by run_at limit 1 for update skip locked)
                   update agent_job_queue j set locked_at = now(), lock_owner = $1, lock_gen = j.lock_gen + 1, attempts = j.attempts + 1
                   from cte where j.id = cte.id returning j.id, j.lock_gen`;
    const w1 = (await db.query(claim, ['w1'])).rows[0];
    assert.equal((await db.query(claim, ['w2'])).rows.length, 0, 'leased job not reclaimed');
    await db.exec(`update agent_job_queue set locked_at = now() - interval '11 minutes'`);
    const w2 = (await db.query(claim, ['w2'])).rows[0];
    assert.equal(Number(w2.lock_gen), Number(w1.lock_gen) + 1);
    const stale = await db.query(`update agent_job_queue set done_at = now() where id = $1 and lock_owner = 'w1' and lock_gen = $2`, [w1.id, w1.lock_gen]);
    assert.equal(stale.affectedRows, 0, 'stale worker fenced');
    const fresh = await db.query(`update agent_job_queue set done_at = now() where id = $1 and lock_owner = 'w2' and lock_gen = $2`, [w2.id, w2.lock_gen]);
    assert.equal(fresh.affectedRows, 1);
    pass('T9 queue lease and fencing');

    // T10 anonymous has no access; signed-in users only read their own ledger
    await as('anon');
    for (const t of ['agent_memory_record', 'agent_action_ledger', 'agent_approval', 'agent_external_identity', 'agent_job_queue', 'agent_connect_state']) {
      await rejects(`select * from ${t}`, /permission denied/, `anon ${t}`);
    }
    await rejects(`select * from agent_create_action('skillsurger','apply_job','k','d','{}')`, /permission denied|not signed in/, 'anon cannot create actions');
    await as('authenticated', B);
    assert.equal((await db.query(`select count(*)::int n from agent_action_ledger`)).rows[0].n, 0, 'B sees none of A actions');
    await rejects(`select * from agent_job_queue`, /permission denied/, 'queue server-only');
    pass('T10 anon denied; owner-only reads; queue server-only');

    // T11 account deletion cascades
    await admin();
    await db.exec(`delete from auth.users where id='${A}'`);
    for (const t of ['agent_memory_record', 'agent_action_ledger', 'agent_approval', 'agent_brand_member', 'agent_connect_state']) {
      assert.equal((await db.query(`select count(*)::int n from ${t} where user_id='${A}'`)).rows[0].n, 0, `${t} cascades`);
    }
    pass('T11 deleting the account removes its agent data');
    console.log('PASS: agent platform core contracts (synthetic in-memory database only).');
  } finally {
    await db.close();
  }
})().catch(error => { console.error('FAIL', error.message); process.exit(1); });
