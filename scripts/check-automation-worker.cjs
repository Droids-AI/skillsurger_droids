// Synthetic in-memory database only. No credentials, provider calls or customer data.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const A='11111111-1111-1111-1111-111111111111';
const B='22222222-2222-2222-2222-222222222222';
const db=new PGlite();
const as=(role,uid='')=>db.exec(`reset role;set role ${role};select set_config('request.jwt.claim.sub','${uid}',false)`);
const rpc=async(name,args=[])=>{
  const q=await db.query(`select * from ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')})`,args);
  return q.rows;
};
const scalar=async(name,args)=>(await rpc(name,args))[0][name];
const admin=()=>db.exec('reset role');
const pass=name=>console.log('PASS',name);
let n=0;
async function draft({approve=true,url='https://jobs.skillsurger.com/jobs/123',owner=A,jobId,mode='anchor'}={}) {
  await admin();
  if(!jobId) jobId=(await db.query(`insert into saved_jobs(user_id,title,company) values($1,'Synthetic Python Engineer','QA Fixture') returning id`,[owner])).rows[0].id;
  let cv=(await db.query(`select * from skillsurger_tailored_cvs where saved_job_id=$1 and status='approved'`,[jobId])).rows[0];
  if(!cv) cv=(await db.query(`insert into skillsurger_tailored_cvs(user_id,saved_job_id,version,facts,content,status) values($1,$2,1,'[]','{"headline":"Synthetic Python Engineer","sections":[]}','approved') returning *`,[owner,jobId])).rows[0];
  const payload={saved_job_id:jobId,cv_version_id:cv.id,cv_content:cv.content,execution_mode:mode,application_url:url,destination:url,answers:{full_name:'Synthetic Candidate',email:'synthetic@example.com'},cover_note:'Synthetic application',automation:{site:'jobs.skillsurger.com',task_id:'qa-task',revision:'qa-1',max_run_credits:'0.2'}};
  await as('authenticated',owner);
  const a=(await rpc('agent_create_action',['skillsurger','apply_job','synthetic-'+(++n),url,JSON.stringify(payload)]))[0].action_id;
  const hash=(await db.query('select payload_hash from agent_action_ledger where id=$1',[a])).rows[0].payload_hash;
  if(approve) await scalar('agent_decide_approval',[a,'approved',hash]);
  await as('service_role');
  return {id:a,jobId,cvId:cv.id,payload,hash};
}
(async()=>{
try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to anon,authenticated,service_role;
    insert into auth.users values('${A}'),('${B}');
    create table saved_jobs(id uuid primary key default gen_random_uuid(),user_id uuid,title text,company text,status text default 'saved');
    grant all on saved_jobs to service_role;`);
  for(const file of ['20261110020000_agent_platform_core.sql','20261110030000_application_pipeline.sql','20261117000000_anchor_application_worker.sql'])
    await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
  await db.exec(fs.readFileSync('supabase/migrations/20261117000000_anchor_application_worker.sql','utf8'));
  pass('worker migration loads and re-runs without enabling a board or budget');
  await db.exec(`insert into skillsurger_automation_boards(site,application_id,task_id,revision,enabled,terms_url,terms_verified_at,reviewed_by,max_run_credits)
    values('jobs.skillsurger.com','qa-app','qa-task','qa-1',true,'https://skillsurger.com/privacy',now(),'synthetic operator',0.2);
    insert into skillsurger_automation_policy values('${A}',true,10,0.2),('${B}',true,10,0.2);
    insert into skillsurger_automation_consent(user_id,policy_version) values('${A}','2026-11-17'),('${B}','2026-11-17');
    insert into agent_external_identity(user_id,product,site,anchor_identity_id,status,ownership_verified_at,ownership_verified_by,ownership_evidence_ref)
      values('${A}','skillsurger','jobs.skillsurger.com','qa-identity-a','active',now(),'operator','authenticated-chat-reference-a'),
            ('${B}','skillsurger','jobs.skillsurger.com','qa-identity-b','active',now(),'operator','authenticated-chat-reference-b');`);
  const unapproved=await draft({approve:false});
  await assert.rejects(scalar('skillsurger_enqueue_application',[unapproved.id,A]),/approval_required/);
  const manual=await draft({mode:'manual'});
  await assert.rejects(scalar('skillsurger_enqueue_application',[manual.id,A]),/manual_application/);
  const a=await draft();
  await assert.rejects(scalar('skillsurger_enqueue_application',[a.id,B]),/application_not_found/);
  pass('separate matching application approval, execution mode and ownership required');
  for(const [sql,undo,error] of [
    [`update skillsurger_automation_consent set revoked_at=now() where user_id='${A}'`,`update skillsurger_automation_consent set revoked_at=null where user_id='${A}'`,/consent_required/],
    [`update agent_external_identity set ownership_verified_at=null where user_id='${A}'`,`update agent_external_identity set ownership_verified_at=now() where user_id='${A}'`,/verified_connection_required/],
    [`update skillsurger_automation_policy set enabled=false where user_id='${A}'`,`update skillsurger_automation_policy set enabled=true where user_id='${A}'`,/budget_required/],
    [`update skillsurger_tailored_cvs set status='superseded' where id='${a.cvId}'`,`update skillsurger_tailored_cvs set status='approved' where id='${a.cvId}'`,/cv_or_job_changed/],
    [`update agent_approval set revoked_at=now() where action_id='${a.id}'`,`update agent_approval set revoked_at=null where action_id='${a.id}'`,/approval_required/],
    [`update agent_approval set expires_at=now()-interval '1 minute' where action_id='${a.id}'`,`update agent_approval set expires_at=now()+interval '1 hour' where action_id='${a.id}'`,/approval_required/],
  ]){
    await admin();await db.exec(sql);await as('service_role');
    await assert.rejects(scalar('skillsurger_enqueue_application',[a.id,A]),error);
    await admin();await db.exec(undo);await as('service_role');
  }
  pass('revoked/expired approvals, consent, ownership evidence, approved CV and owner budget fail closed');
  await admin();
  await assert.rejects(db.query(`update skillsurger_automation_boards set task_id='changed'`),/revision/);
  await db.exec(`update skillsurger_automation_boards set revision='qa-2'`);
  await as('service_role');await assert.rejects(scalar('skillsurger_enqueue_application',[a.id,A]),/board_changed/);
  await admin();await db.exec(`update skillsurger_automation_boards set revision='qa-1'`);await as('service_role');
  pass('task/config changes require a revision and fresh application review');
  const r=await scalar('skillsurger_enqueue_application',[a.id,A]);
  assert.equal(await scalar('skillsurger_enqueue_application',[a.id,A]),r);
  const duplicate=await draft({jobId:a.jobId});
  await assert.rejects(scalar('skillsurger_enqueue_application',[duplicate.id,A]),/job_already_dispatched/);
  pass('repeat enqueue reserves once; a second action for the same job cannot dispatch');
  await admin();await db.exec(`update skillsurger_automation_policy set weekly_credits=0.3 where user_id='${A}'`);
  const other=await draft();await assert.rejects(scalar('skillsurger_enqueue_application',[other.id,A]),/weekly_budget_exhausted/);
  await admin();await db.exec(`update skillsurger_automation_policy set weekly_credits=10 where user_id='${A}'`);await as('service_role');
  pass('weekly reservation cannot be overspent by another action');
  let lease=(await rpc('skillsurger_lease_application',[r,'worker-1']))[0];
  assert.equal((await rpc('skillsurger_lease_application',[r,'worker-2'])).length,0);
  const capabilityHash='a'.repeat(64);
  assert.equal(await scalar('skillsurger_begin_application',[r,'worker-1',lease.lock_gen,capabilityHash]),true);
  assert.equal(await scalar('skillsurger_begin_application',[r,'worker-1',lease.lock_gen,capabilityHash]),false);
  assert.equal(await scalar('skillsurger_authorize_submit',[r,'b'.repeat(64)]),false);
  await admin();await db.exec(`update agent_approval set revoked_at=now() where action_id='${a.id}'`);await as('service_role');
  await assert.rejects(scalar('skillsurger_authorize_submit',[r,capabilityHash]),/approval_required/);
  await admin();await db.exec(`update agent_approval set revoked_at=null where action_id='${a.id}'`);await as('service_role');
  assert.equal(await scalar('skillsurger_authorize_submit',[r,capabilityHash]),true);
  assert.equal(await scalar('skillsurger_authorize_submit',[r,capabilityHash]),false);
  pass('one-use pre-submit capability rechecks approval immediately before the click');
  await admin();await db.exec(`update skillsurger_application_runs set locked_at=now()-interval '6 minutes' where id='${r}'`);await as('service_role');
  const next=(await rpc('skillsurger_lease_application',[r,'worker-2']))[0];
  assert.equal(next.state,'reconciling');
  assert.equal(await scalar('skillsurger_begin_application',[r,'worker-2',next.lock_gen,capabilityHash]),false);
  assert.equal(await scalar('skillsurger_update_application_run',[r,'worker-1',lease.lock_gen,'running','qa-run',null,null]),false);
  assert.equal(await scalar('skillsurger_update_application_run',[r,'worker-2',next.lock_gen,'running','qa-run',null,null]),true);
  pass('single dispatch, durable crash tombstone and stale-worker fencing');
  await admin();await db.exec(`update skillsurger_application_runs set next_check_at=now() where id='${r}'`);await as('service_role');
  lease=(await rpc('skillsurger_lease_application',[r,'worker-3']))[0];
  await assert.rejects(scalar('skillsurger_update_application_run',[r,'worker-3',lease.lock_gen,'done','qa-run',null,JSON.stringify({})]),/submission_evidence_required/);
  assert.equal(await scalar('skillsurger_update_application_run',[r,'worker-3',lease.lock_gen,'done','qa-run',null,JSON.stringify({confirmation_reference:'synthetic-receipt'})]),true);
  assert.equal((await db.query('select status from saved_jobs where id=$1',[a.jobId])).rows[0].status,'applied');
  assert.equal((await db.query(`select count(*)::int n from agent_memory_record where body->>'action_id'=$1`,[a.id])).rows[0].n,1);
  assert.equal((await rpc('skillsurger_lease_application',[r,'worker-4'])).length,0);
  pass('receipt required; completion updates tracker and evidence memory once');
  assert.equal(await scalar('skillsurger_record_application_cost',[r,0.4,'provider-usage-ledger-qa']),true);
  assert.equal((await db.query('select enabled from skillsurger_automation_policy where user_id=$1',[A])).rows[0].enabled,false);
  assert.equal(Number((await db.query('select cost_credits from agent_action_ledger where id=$1',[a.id])).rows[0].cost_credits),0.4);
  pass('measured costs recorded separately; over-reservation charge pauses further runs');
  const cancel=await draft({owner:B});const cancelRun=await scalar('skillsurger_enqueue_application',[cancel.id,B]);
  assert.equal(await scalar('skillsurger_close_application',[cancel.id,A]),false);
  assert.equal(await scalar('skillsurger_close_application',[cancel.id,B]),true);
  assert.equal((await db.query('select state from skillsurger_application_runs where id=$1',[cancelRun])).rows[0].state,'failed');
  const fresh=await draft({owner:B,jobId:cancel.jobId});
  await scalar('skillsurger_enqueue_application',[fresh.id,B]);
  pass('only the owner can close an unstarted draft; a fresh approval can replace a never-dispatched attempt');
  await admin();await db.exec(`insert into agent_connect_state values('disconnect-state','${B}','skillsurger','jobs.skillsurger.com','qa-app','hash',now()+interval '15 minutes',null)`);await as('service_role');
  await scalar('skillsurger_prepare_disconnect',[B,'jobs.skillsurger.com']);
  assert.notEqual((await db.query(`select consumed_at from agent_connect_state where state='disconnect-state'`)).rows[0].consumed_at,null);
  assert.equal((await db.query('select ownership_verified_at from agent_external_identity where user_id=$1',[B])).rows[0].ownership_verified_at,null);
  assert.equal((await db.query('select state from agent_action_ledger where id=$1',[fresh.id])).rows[0].state,'failed');
  pass('disconnect invalidates unused callbacks, future submit permission and queued attempts before vendor cleanup');
  await admin();await db.exec(`update agent_external_identity set status='pending_verification' where user_id='${B}'`);await as('service_role');
  const connection=(await db.query('select id from agent_external_identity where user_id=$1',[B])).rows[0].id;
  await assert.rejects(scalar('skillsurger_verify_connection',[connection,B,'jobs.skillsurger.com','operator','short']),/ownership_evidence/);
  assert.equal(await scalar('skillsurger_verify_connection',[connection,B,'jobs.skillsurger.com','operator','authenticated-qa-user-confirmation']),true);
  const bounded=await draft({owner:B});const boundedRun=await scalar('skillsurger_enqueue_application',[bounded.id,B]);
  const boundedLease=(await rpc('skillsurger_lease_application',[boundedRun,'bounded-worker']))[0];
  await scalar('skillsurger_begin_application',[boundedRun,'bounded-worker',boundedLease.lock_gen,'c'.repeat(64)]);
  await admin();await db.exec(`update skillsurger_application_runs set submit_token_expires_at=now()-interval '1 minute' where id='${boundedRun}'`);await as('service_role');
  assert.equal(await scalar('skillsurger_authorize_submit',[boundedRun,'c'.repeat(64)]),false);
  await scalar('skillsurger_update_application_run',[boundedRun,'bounded-worker',boundedLease.lock_gen,'running','bounded-provider-run',null,null]);
  await admin();await db.exec(`update skillsurger_application_runs set status_checks=60,next_check_at=now() where id='${boundedRun}'`);await as('service_role');
  assert.equal((await rpc('skillsurger_lease_application',[boundedRun,'later-worker'])).length,0);
  assert.equal((await db.query('select state from skillsurger_application_runs where id=$1',[boundedRun])).rows[0].state,'needs_you');
  assert.equal(await scalar('skillsurger_resolve_application',[boundedRun,'not_submitted','independent-synthetic-site-check','operator']),true);
  assert.equal((await db.query('select state from agent_action_ledger where id=$1',[bounded.id])).rows[0].state,'failed');
  pass('capabilities expire; automatic status checks are bounded; independent operator reconciliation never retries');
  await as('authenticated',B);
  const visible=(await db.query('select id,state,user_id from skillsurger_application_runs')).rows;
  assert(visible.length>0 && visible.every(row=>row.user_id===B));
  for(const name of ['skillsurger_enqueue_application','skillsurger_lease_application','skillsurger_verify_connection']) {
    const args=name==='skillsurger_enqueue_application'?[a.id,A]:name==='skillsurger_lease_application'?[r,'evil']:[a.id,A,'jobs.skillsurger.com','evil','fake-reference'];
    await assert.rejects(rpc(name,args),/permission denied/);
  }
  await assert.rejects(db.query(`select * from skillsurger_automation_boards`),/permission denied/);
  await assert.rejects(db.query(`select anchor_run_id from skillsurger_application_runs`),/permission denied/);
  await as('anon');await assert.rejects(db.query('select id from skillsurger_application_runs'),/permission denied/);
  pass('tenant-isolated reads; provider IDs/config and all dispatch/operator RPCs are private');
  console.log('PASS: Anchor application worker database contracts (synthetic local database).');
}finally{await db.close();}
})().catch(e=>{console.error('FAIL',e.message);process.exitCode=1;});
