// HTTP boundary tests with intercepted Supabase requests; no network or provider session.
import { assert, assertEquals } from 'jsr:@std/assert@1';
const env={SUPABASE_URL:'https://automation-test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'synthetic-operator-key',SUPABASE_ANON_KEY:'synthetic-anon-key',SKILLSURGER_ALLOWED_ORIGINS:'https://skillsurger.com'};
for(const [key,value] of Object.entries(env))Deno.env.set(key,value);
const {handle}=await import('./index.ts');
const A='11111111-1111-1111-1111-111111111111',B='22222222-2222-2222-2222-222222222222';
const ACTION='33333333-3333-3333-3333-333333333333',RUN='44444444-4444-4444-4444-444444444444';
const request=(path:string,body:unknown={},auth='Bearer user-a',origin='https://skillsurger.com')=>new Request(env.SUPABASE_URL+'/functions/v1/skillsurger-automation'+path,
  {method:'POST',headers:{'Content-Type':'application/json',authorization:auth,origin},body:JSON.stringify(body)});
function intercept() {
  const calls:{path:string;body:any;query:URLSearchParams}[]=[];
  let grants=0;
  globalThis.fetch=(input,init)=>{
    const url=new URL(String(input instanceof Request?input.url:input));
    const headers=new Headers(init?.headers || (input instanceof Request?input.headers:{}));
    const body=init?.body?JSON.parse(String(init.body)):null;
    calls.push({path:url.pathname,body,query:url.searchParams});
    assertEquals(url.host,'automation-test.supabase.co','operator or user route must never contact a job board directly');
    const json=(data:unknown,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
    if(url.pathname.endsWith('/auth/v1/user'))return headers.get('authorization')==='Bearer user-a'?json({id:A,email:'synthetic-a@example.com',aud:'authenticated'}):headers.get('authorization')==='Bearer user-b'?json({id:B,email:'synthetic-b@example.com',aud:'authenticated'}):json({message:'Invalid token'},401);
    if(url.pathname.endsWith('/agent_action_ledger'))return json(url.searchParams.get('user_id')==='eq.'+A?[{id:ACTION,user_id:A,product:'skillsurger',action_type:'apply_job',state:'queued',payload:{execution_mode:'anchor',automation:{site:'jobs.skillsurger.com'}}}]:[]);
    if(url.pathname.endsWith('/subscriptions'))return json([{subscription_status:'active',subscription_tier:'lite',created_at:new Date().toISOString()}]);
    if(url.pathname.endsWith('/rpc/skillsurger_enqueue_application'))return json(RUN);
    if(url.pathname.endsWith('/rpc/skillsurger_lease_application'))return json([]);
    if(url.pathname.endsWith('/rpc/skillsurger_authorize_submit'))return json(++grants===1);
    return json([]);
  };
  return calls;
}
Deno.test('HTTP routes deny anonymous, cross-user, operator misuse and disallowed origins',async()=>{
  const original=globalThis.fetch;
  try{
    const calls=intercept();
    for(const path of ['/tick','/verify-connection','/record-cost','/resolve'])assertEquals((await handle(request(path,{},'Bearer user-a'))).status,403);
    for(const auth of ['',`Bearer ${env.SUPABASE_ANON_KEY}`,`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`])assertEquals((await handle(request('/context',{actionId:ACTION},auth))).status,401);
    assertEquals((await handle(request('/context',{actionId:ACTION},'Bearer user-a','https://evil.example'))).status,403);
    assertEquals((await handle(request('/context',{actionId:ACTION},'Bearer user-b'))).status,404);
    assert(!calls.some(c=>c.path.includes('/rpc/')));
  }finally{globalThis.fetch=original;}
});
Deno.test('user enqueue takes owner from JWT and ignores supplied raw provider identity',async()=>{
  const original=globalThis.fetch;
  try{
    Deno.env.set('FF_SKILLSURGER_AUTOMATION','true');const calls=intercept();
    const response=await handle(request('/run',{actionId:ACTION,userId:B,identity_id:'victim-identity'}));
    assertEquals(response.status,200);
    const enqueue=calls.find(c=>c.path.endsWith('/rpc/skillsurger_enqueue_application'))!;
    assertEquals(enqueue.body,{p_action_id:ACTION,p_user_id:A});
    assert(!calls.some(c=>JSON.stringify(c.body).includes('victim-identity')));
  }finally{globalThis.fetch=original;Deno.env.delete('FF_SKILLSURGER_AUTOMATION');}
});
Deno.test('pre-submit route requires scoped token, hashes it, and refuses a replay or a paused flow',async()=>{
  const original=globalThis.fetch;
  try{
    const calls=intercept();const token='a'.repeat(64);
    Deno.env.delete('FF_SKILLSURGER_AUTOMATION');
    assertEquals((await handle(request('/authorize-submit',{run_id:RUN,token},''))).status,403);
    assertEquals(calls.length,0);
    Deno.env.set('FF_SKILLSURGER_AUTOMATION','true');
    assertEquals((await handle(request('/authorize-submit',{run_id:RUN,token:'bad'},''))).status,403);
    const allowed=await handle(request('/authorize-submit',{run_id:RUN,token},''));
    assertEquals(allowed.status,200);assertEquals(await allowed.json(),{authorized:true});
    const rpc=calls.find(c=>c.path.endsWith('/rpc/skillsurger_authorize_submit'))!;
    assertEquals(rpc.body.p_run_id,RUN);assertEquals(rpc.body.p_token_hash.length,64);assert(rpc.body.p_token_hash!==token);
    assertEquals((await handle(request('/authorize-submit',{run_id:RUN,token},''))).status,403);
  }finally{globalThis.fetch=original;Deno.env.delete('FF_SKILLSURGER_AUTOMATION');}
});
Deno.test('operator configuration writes require evidence; user consent is versioned and owner-bound',async()=>{
  const original=globalThis.fetch;
  try{
    const calls=intercept();const operator='Bearer '+env.SUPABASE_SERVICE_ROLE_KEY;
    assertEquals((await handle(request('/verify-connection',{connectionId:ACTION,userId:A},operator))).status,400);
    assertEquals((await handle(request('/record-cost',{runId:RUN,costCredits:0.2},operator))).status,400);
    assertEquals((await handle(request('/consent',{enabled:true,policyVersion:'old'}))).status,400);
    assertEquals((await handle(request('/consent',{enabled:true,policyVersion:'2026-11-17',user_id:B}))).status,200);
    const consent=calls.find(c=>c.path.endsWith('/skillsurger_automation_consent'))!;
    assertEquals(consent.body.user_id,A);assertEquals(consent.body.revoked_at,null);
  }finally{globalThis.fetch=original;}
});
