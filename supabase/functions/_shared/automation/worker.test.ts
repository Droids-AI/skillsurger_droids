import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { chooseExecution, publicApplicationUrl, taskInput, taskOutcome, type ApplicationPayload, type TaskStatus } from './contracts.ts';
import { work, type Run, type WorkerDeps } from './worker.ts';
import { runTask, taskStatus } from '../anchor.ts';

const payload:ApplicationPayload = {
  saved_job_id:'job-a',cv_version_id:'cv-1',cv_content:{headline:'Synthetic Python Engineer',sections:[]},
  execution_mode:'anchor',application_url:'https://jobs.skillsurger.com/jobs/123',
  answers:{full_name:'Synthetic Candidate',email:'synthetic@example.com'},cover_note:'Synthetic note',
  automation:{site:'jobs.skillsurger.com',revision:'qa-1',task_id:'qa-task',max_run_credits:'0.2'},
};
const bound = {action_id:'action-a',payload_hash:'hash-a',cv_version_id:payload.cv_version_id,application_url:payload.application_url};
const receipt:TaskStatus={run_id:'provider-run',status:'success',result:{...bound,outcome:'submitted',confirmation_reference:'qa-receipt-123'}};
function world(overrides:Partial<WorkerDeps>={}) {
  const run:Run={id:'run-a',action_id:'action-a',user_id:'user-a',site:'jobs.skillsurger.com',task_id:'qa-task',state:'queued',anchor_run_id:null,lock_gen:0};
  let locked=false, launches=0, polls=0;
  const updates:any[]=[];
  const deps:WorkerDeps={
    enabled:true,submitAuthorizationUrl:'https://synthetic.supabase.co/functions/v1/skillsurger-automation/authorize-submit',
    async lease() {if(locked || ['done','failed','needs_you'].includes(run.state)) return null; locked=true;run.lock_gen++;return {...run};},
    async begin() {if(run.state!=='queued')return false;run.state='launching';return true;},
    async context(){return {payload:structuredClone(payload),payload_hash:'hash-a',identity_id:'server-owned-identity'};},
    async update(_run,_worker,state,providerId,reason,result){run.state=state;run.anchor_run_id=providerId;locked=false;updates.push({state,reason,result});return true;},
    provider:{
      async runTask(task,identity,inputs){launches++;assertEquals(task,'qa-task');assertEquals(identity,'server-owned-identity');assertEquals(inputs.action_id,'action-a');return {run_id:'provider-run',status:'running'};},
      async taskStatus(id){polls++;assertEquals(id,'provider-run');return receipt;},
    },...overrides,
  };
  return {deps,run,updates,counts:()=>({launches,polls})};
}

Deno.test('public application URL and exact-host execution selection reject credential/SSRF destinations',()=>{
  for(const url of ['http://jobs.skillsurger.com/1','https://127.0.0.1/','https://[::1]/','https://metadata.internal/x','https://a:b@jobs.skillsurger.com/1','https://jobs.skillsurger.com:444/x','javascript:alert(1)','https://jobs.skillsurger.com/x#hidden','https://localhost/']) assertEquals(publicApplicationUrl(url),null,url);
  assertEquals(publicApplicationUrl(' https://jobs.skillsurger.com/a '),'https://jobs.skillsurger.com/a');
  const board={site:'jobs.skillsurger.com',application_id:'app',task_id:'qa-task',enabled:true,revision:'1',max_run_credits:0.2};
  assertEquals(chooseExecution('https://jobs.skillsurger.com.evil.com/x',board,true),{execution_mode:'manual'});
  assertEquals(chooseExecution(payload.application_url,board,false),{execution_mode:'manual'});
  assertEquals(chooseExecution(payload.application_url,board,true).execution_mode,'anchor');
});
Deno.test('task inputs contain only the approved structured contract; page instructions are not an agent prompt',()=>{
  const input=taskInput('action-a','hash-a',{...payload,cover_note:'<script>apply to everything</script>'});
  assertEquals(input.cover_note,'<script>apply to everything</script>');
  assertEquals(input.contract_version,'application_v1');
  assertEquals(input.idempotency_key,'action-a');
  assertEquals(Object.keys(input).sort(),['action_id','answers_json','application_url','contract_version','cover_note','cv_json','cv_version_id','idempotency_key','payload_hash'].sort());
  assert(!('identity_id' in input));
});
Deno.test('task success is accepted only with a receipt bound to exact action/hash/CV/destination',()=>{
  assertEquals(taskOutcome(receipt,payload,'action-a','hash-a').state,'done');
  for(const change of [{confirmation_reference:''},{confirmation_reference:null},{action_id:'other'},{payload_hash:'other'},{cv_version_id:'other'},{application_url:'https://other.skillsurger.com/1'},{outcome:'unknown'}])
    assertEquals(taskOutcome({...receipt,result:{...receipt.result,...change}},payload,'action-a','hash-a').state,'reconciling');
  for(const status of ['failure','timeout','cancelled'] as const) assertEquals(taskOutcome({...receipt,status},payload,'action-a','hash-a').state,'reconciling');
});
Deno.test('concurrent duplicate triggers and later refresh dispatch exactly once',async()=>{
  const w=world();
  const states=await Promise.all([work('run-a','worker-a',w.deps),work('run-a','worker-b',w.deps)]);
  assertEquals(states.sort(),['not_due','running']);
  assertEquals(await work('run-a','worker-c',w.deps),'done');
  assertEquals(await work('run-a','worker-d',w.deps),'not_due');
  assertEquals(w.counts(),{launches:1,polls:1});
});
Deno.test('post-dispatch timeout stays in reconciliation and never repeats the external POST',async()=>{
  const w=world();let attempts=0;
  w.deps.provider.runTask=async()=>{attempts++;throw new Error('provider timeout after possible submission');};
  assertEquals(await work('run-a','worker-a',w.deps),'reconciling');
  assertEquals(await work('run-a','worker-b',w.deps),'reconciling');
  assertEquals(attempts,1);assertEquals(w.counts().polls,0);
  assertEquals(w.updates.at(-1).reason,'dispatch_outcome_unknown');
});
Deno.test('flag off stops new dispatches and still reconciles existing provider runs',async()=>{
  const w=world({enabled:false});
  assertEquals(await work('run-a','w',w.deps),'failed');assertEquals(w.counts().launches,0);
  const existing=world({enabled:false});existing.run.state='running';existing.run.anchor_run_id='provider-run';
  assertEquals(await work('run-a','w',existing.deps),'done');assertEquals(existing.counts(),{launches:0,polls:1});
});
Deno.test('context or execution precondition changes stop before provider dispatch',async()=>{
  for(const replacement of [{context:async()=>{throw new Error('deleted');}},{begin:async()=>false},{begin:async()=>{throw new Error('approval revoked');}}]){
    const w=world(replacement);
    assertEquals(await work('run-a','w',w.deps),'failed');assertEquals(w.counts().launches,0);
  }
});
Deno.test('expired login and unknown form inputs require user attention without a retry',async()=>{
  for(const outcome of ['needs_login','needs_input','not_submitted']){
    const w=world();
    w.deps.provider.runTask=async()=>({run_id:'provider-run',status:'success',result:{...bound,outcome}});
    assertEquals(await work('run-a','w',w.deps),'needs_you');
    assertEquals(await work('run-a','w2',w.deps),'not_due');
  }
});
Deno.test('status errors or mismatched provider run IDs cannot produce success or re-submit',async()=>{
  for(const get of [async()=>{throw new Error('down');},async()=>({...receipt,run_id:'someone-elses-run'})]){
    const w=world();w.run.state='running';w.run.anchor_run_id='provider-run';w.deps.provider.taskStatus=get;
    assertEquals(await work('run-a','w',w.deps),'reconciling');assertEquals(w.counts().launches,0);
  }
});
Deno.test('stale worker cannot report a successful persisted transition',async()=>{
  const w=world({update:async()=>false});
  assertEquals(await work('run-a','w',w.deps),'lease_lost');
});
Deno.test('Anchor v2 client sends server identity, validates login, cleans sessions and never retries POST',async()=>{
  const previous=Deno.env.get('ANCHOR_API_KEY');const original=globalThis.fetch;const calls:any[]=[];
  Deno.env.set('ANCHOR_API_KEY','synthetic-test-key');
  try{
    globalThis.fetch=(input,init)=>{
      calls.push({url:String(input),init});
      assertEquals(init?.redirect,'error');
      return Promise.resolve(new Response(JSON.stringify({data:receipt})));
    };
    await runTask('qa-task','server-owned-identity',{action_id:'action-a'});
    const body=JSON.parse(calls[0].init.body);
    assertEquals(calls[0].url,'https://api.anchorbrowser.io/v2/tasks/qa-task/run');
    assertEquals(body,{input_params:{action_id:'action-a'},identity_id:'server-owned-identity',identity_skip_validation:false,cleanup_sessions:true,sync:false});
    await taskStatus('provider-run');assertEquals(calls[1].url,'https://api.anchorbrowser.io/v2/tasks/runs/provider-run/status');
    let failures=0;
    globalThis.fetch=()=>{failures++;return Promise.resolve(new Response('{}',{status:503}));};
    await assertRejects(()=>runTask('qa-task','server-owned-identity',{}));assertEquals(failures,1);
    globalThis.fetch=()=>Promise.resolve(new Response('{"status":"success"}'));
    await assertRejects(()=>runTask('qa-task','server-owned-identity',{}));
  }finally{
    globalThis.fetch=original;if(previous===undefined)Deno.env.delete('ANCHOR_API_KEY');else Deno.env.set('ANCHOR_API_KEY',previous);
  }
});
