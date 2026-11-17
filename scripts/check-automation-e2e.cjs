// The real SQL -> worker -> deterministic browser adapter -> SQL receipt flow, on synthetic data.
// Anchor v2 Task transport is replaced with the local adapter. No employer, account or provider call.
const fs=require('node:fs');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const {chromium}=require('playwright');
const A='11111111-1111-1111-1111-111111111111';
(async()=>{
  const {work}=await import('../supabase/functions/_shared/automation/worker.ts');
  const {executeApprovedApplication}=await import('../automation/approved-application.mjs');
  const db=new PGlite();const browser=await chromium.launch({headless:true});
  const rpc=async(name,args)=> (await db.query(`select * from ${name}(${args.map((_,i)=>'$'+(i+1)).join(',')})`,args)).rows;
  const scalar=async(name,args)=>(await rpc(name,args))[0][name];
  const as=async(role,uid='')=>db.exec(`reset role;set role ${role};select set_config('request.jwt.claim.sub','${uid}',false)`);
  const report=[];
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
      create table auth.users(id uuid primary key);insert into auth.users values('${A}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth,public to anon,authenticated,service_role;
      create table saved_jobs(id uuid primary key default gen_random_uuid(),user_id uuid,title text,company text,status text default 'saved');
      grant all on saved_jobs to service_role;`);
    for(const name of ['20261110020000_agent_platform_core.sql','20261110030000_application_pipeline.sql','20261117000000_anchor_application_worker.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));
    await db.exec(`insert into skillsurger_automation_boards(site,application_id,task_id,revision,enabled,terms_url,terms_verified_at,reviewed_by,max_run_credits)
      values('qa.skillsurger.com','synthetic-app','synthetic-task','qa-1',true,'https://skillsurger.com/privacy',now(),'synthetic operator',0.2);
      insert into skillsurger_automation_policy values('${A}',true,10,0.2);
      insert into skillsurger_automation_consent(user_id,policy_version) values('${A}','2026-11-17');
      insert into agent_external_identity(user_id,product,site,anchor_identity_id,status,ownership_verified_at,ownership_verified_by,ownership_evidence_ref)
      values('${A}','skillsurger','qa.skillsurger.com','synthetic-owned-identity','active',now(),'synthetic operator','authenticated-synthetic-confirmation');`);
    for(const scenario of ['approved','revoked_after_dispatch','unknown_required_question']){
      await as('service_role');
      const job=(await db.query(`insert into saved_jobs(user_id,title,company) values($1,'Synthetic Python Engineer','QA Fixture') returning id`,[A])).rows[0].id;
      const content={headline:'Synthetic Python Engineer',summary:null,sections:[{heading:'Skills',items:[{text:'Python and FastAPI',evidence:['skills']}]}]};
      const cv=(await db.query(`insert into skillsurger_tailored_cvs(user_id,saved_job_id,version,facts,content,status) values($1,$2,1,'[]',$3,'approved') returning id`,[A,job,JSON.stringify(content)])).rows[0].id;
      const target='https://qa.skillsurger.com/application/'+job;
      const payload={saved_job_id:job,cv_version_id:cv,cv_content:content,execution_mode:'anchor',application_url:target,destination:target,
        cover_note:'Synthetic application only.',answers:{full_name:'Synthetic Candidate',email:'synthetic@example.com'},
        automation:{site:'qa.skillsurger.com',task_id:'synthetic-task',revision:'qa-1',max_run_credits:'0.2'}};
      await as('authenticated',A);
      const action=(await rpc('agent_create_action',['skillsurger','apply_job','synthetic-e2e-'+job,target,JSON.stringify(payload)]))[0].action_id;
      const hash=(await db.query('select payload_hash from agent_action_ledger where id=$1',[action])).rows[0].payload_hash;
      await scalar('agent_decide_approval',[action,'approved',hash]);await as('service_role');
      const run=await scalar('skillsurger_enqueue_application',[action,A]);
      assert.equal(await scalar('skillsurger_enqueue_application',[action,A]),run);
      const context=await browser.newContext();const page=await context.newPage();let submissions=0,dispatches=0;
      await context.route('**/*',route=>{
        const request=route.request();const url=new URL(request.url());
        if(url.href===target){
          let html=fs.readFileSync('scripts/fixtures/anchor-application.html','utf8');
          if(scenario==='unknown_required_question')html=html.replace('</form>','<input name="salary" required></form>');
          return route.fulfill({status:200,contentType:'text/html',body:html});
        }
        if(url.pathname==='/submit' && request.method()==='POST'){
          submissions++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({action_id:action,confirmation_reference:'synthetic-receipt-'+job})});
        }
        return route.abort();
      });
      const deps={
        enabled:true,submitAuthorizationUrl:'https://synthetic.supabase.co/functions/v1/skillsurger-automation/authorize-submit',
        lease:async(id,worker)=>(await rpc('skillsurger_lease_application',[id,worker]))[0] || null,
        begin:async(r,worker,tokenHash)=>await scalar('skillsurger_begin_application',[r.id,worker,r.lock_gen,tokenHash]),
        context:async()=>({payload,payload_hash:hash,identity_id:'synthetic-owned-identity'}),
        update:async(r,worker,state,providerId,reason,result)=>await scalar('skillsurger_update_application_run',[r.id,worker,r.lock_gen,state,providerId,reason,result?JSON.stringify(result):null]),
        provider:{
          runTask:async(task,identity,inputs)=>{
            dispatches++;assert.equal(identity,'synthetic-owned-identity');assert.equal(task,'synthetic-task');
            if(scenario==='revoked_after_dispatch')await db.query('update agent_approval set revoked_at=now() where action_id=$1',[action]);
            const output=await executeApprovedApplication({page,inputs,adapter:{site:'qa.skillsurger.com',pathPrefix:'/application/',submitPath:'/submit',formSelector:'#application',
              fields:{full_name:'#full-name',email:'#email'},coverNoteSelector:'#cover-note',resumeSelector:'#resume',submitSelector:'#submit-application',receiptSelector:'#receipt',receiptAttribute:'data-receipt'},
              authorizeSubmit:async()=>{
                const digest=crypto.createHash('sha256').update(inputs.submit_authorization_token).digest('hex');
                try{return await scalar('skillsurger_authorize_submit',[run,digest]);}catch{return false;}
              }});
            return {run_id:'synthetic-v2-run-'+job,status:'success',result:output};
          },taskStatus:async()=>{throw new Error('No polling expected for synchronous synthetic transport');},
        },
      };
      const states=await Promise.all([work(run,'worker-1',deps),work(run,'worker-2',deps)]);
      const expected=scenario==='approved'?'done':'needs_you';assert(states.includes(expected));assert(states.includes('not_due'));
      assert.equal(submissions,scenario==='approved'?1:0);assert.equal(dispatches,1);
      const ledger=(await db.query('select state,cost_credits,evidence from agent_action_ledger where id=$1',[action])).rows[0];
      assert.equal(ledger.state,expected);assert.equal(ledger.cost_credits,null);
      assert.equal((await db.query('select status from saved_jobs where id=$1',[job])).rows[0].status,scenario==='approved'?'applied':'saved');
      assert.equal(await work(run,'worker-3',deps),'not_due');
      report.push({scenario,worker_state:expected,dispatches,submissions,concurrent_duplicate_blocked:true,actual_cost:null});
      console.log('PASS E2E',scenario,expected,'submissions='+submissions);await context.close();
    }
    fs.mkdirSync('artifacts/anchor-worker',{recursive:true});
    fs.writeFileSync('artifacts/anchor-worker/e2e-evidence.json',JSON.stringify({checked_at:new Date().toISOString(),scope:'real in-memory SQL + worker + Chromium adapter; synthetic accounts and form; Anchor v2 transport mocked',results:report},null,2)+'\n');
  }finally{await browser.close();await db.close();}
})().catch(error=>{console.error('FAIL',error.message);process.exitCode=1;});
