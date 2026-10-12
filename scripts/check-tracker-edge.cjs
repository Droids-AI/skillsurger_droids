const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const {webcrypto,createHmac}=require('node:crypto');
const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only',WHATSAPP_PHONE_NUMBER_ID:'test-sender',WHATSAPP_ACCESS_TOKEN:'test-only',WHATSAPP_WEBINAR_TEMPLATE:'approved_test_template',WEBINAR_JOIN_URL:'https://meeting.invalid/private',WHATSAPP_GRAPH_VERSION:'v-test',WHATSAPP_APP_SECRET:'test-signature-secret',WHATSAPP_WEBHOOK_VERIFY_TOKEN:'test-verify'};
let now=Date.parse('2026-10-12T10:00:00Z'),failInsert=false,failProvider=false,sendCount=0,rateAllowed=true;
const sheetRows=[];
const registrations=new Map(),notifications=new Map();
function query(table){
  let update,filters=[],select=false,single=false;
  const q={update(v){update=v;return q},eq(k,v){filters.push([k,[v]]);return q},in(k,v){filters.push([k,v]);return q},select(){select=true;return q},single(){single=true;return q},then(resolve,reject){
    const entries=[...notifications.entries()].filter(([id,row])=>filters.every(([k,vs])=>vs.includes(k==='registration_id'?id:row[k])));
    const result=entries.map(([id,row])=>{if(update)Object.assign(row,update);return {...row,registration_id:id}});
    return Promise.resolve({data:single?result[0]:select?result:null,error:single&&!result.length?{message:'not found'}:null}).then(resolve,reject);
  }};assert.equal(table,'webinar_notifications');return q;
}
const admin={from:query,async rpc(name,args){
  if(name==='webinar_rate_limit')return {data:rateAllowed,error:null};
  if(failInsert)return {data:null,error:{message:'synthetic failure'}};
  const key=args.p_payload.email;
  const previous=registrations.get(key);if(previous)return {data:{registrationId:previous,alreadyRegistered:true},error:null};
  const id='registration-'+(registrations.size+1);registrations.set(key,id);notifications.set(id,{status:'pending'});
  return {data:{registrationId:id,alreadyRegistered:false},error:null};
}};
function load(file){
  let handler;
  const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  class ClockDate extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
  const context={exports:{},require(){return {createClient(){return admin}}},Date:ClockDate,Response,Request,URL,Uint8Array,TextEncoder,AbortSignal,crypto:webcrypto,console:{error(){}},Deno:{env:{get:k=>env[k]},serve:fn=>{handler=fn}},async fetch(url,options){
    if(String(url).endsWith('/functions/v1/sheets-sync')){const row=JSON.parse(options.body);assert.equal(row.formType,'webinar_registration');sheetRows.push(row.email);return new Response('{"success":true}',{status:200});}
    sendCount++;const body=JSON.parse(options.body);assert.equal(body.to,'919876543210');assert.equal(body.type,'template');assert.equal(body.template.components[0].parameters[2].text,env.WEBINAR_JOIN_URL);
    if(failProvider)throw new Error('synthetic timeout');
    return new Response(JSON.stringify({messages:[{id:'message-'+sendCount}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }};
  vm.runInNewContext(output,context,{filename:file});return handler;
}
const register=load('supabase/functions/register-webinar/index.ts');
const input={name:'Synthetic QA',email:'qa@example.com',phoneNumber:'+919876543210',sessionId:'job-switch-2026-10-17'};
const request=(body=input,origin='https://skillsurger.com')=>new Request('https://synthetic.invalid/register-webinar',{method:'POST',headers:{origin,'Content-Type':'application/json','x-forwarded-for':'192.0.2.1'},body:JSON.stringify(body)});
(async()=>{
  assert.equal((await register(request(input,'https://attacker.invalid'))).status,403);assert.equal(sendCount,0);
  assert.equal((await register(request({...input,email:'invalid'}))).status,400);assert.equal(sendCount,0);
  assert.equal((await register(new Request('https://synthetic.invalid',{method:'POST',headers:{origin:'https://skillsurger.com'},body:'invalid json'}))).status,400);
  failInsert=true;assert.equal((await register(request())).status,500);assert.equal(sendCount,0);failInsert=false;
  const first=await register(request());assert.equal(first.status,200);const body=await first.json();assert.equal(body.alreadyRegistered,false);assert.equal(body.whatsappStatus,'accepted');assert.equal(sendCount,1);
  assert.ok(!JSON.stringify(body).includes(env.WEBINAR_JOIN_URL),'Private link stays server-side');
  const duplicate=await (await register(request({...input,email:'QA@EXAMPLE.COM'}))).json();assert.equal(duplicate.alreadyRegistered,true);assert.equal(sendCount,1);assert.deepEqual(sheetRows,['qa@example.com'],'One sheet row per new registration, none for duplicates');
  failProvider=true;const failed=await register(request({...input,email:'fail@example.com'}));assert.equal(failed.status,200);const failedBody=await failed.json();assert.equal(failedBody.whatsappStatus,'failed');assert.equal(registrations.size,2);assert.equal(notifications.get(failedBody.registrationId).error_code,'provider_response_unknown');failProvider=false;
  await register(request({...input,email:'fail@example.com'}));assert.equal(sendCount,2,'Uncertain provider sends must not auto-repeat');
  delete env.WHATSAPP_ACCESS_TOKEN;const unavailable=await (await register(request({...input,email:'unconfigured@example.com'}))).json();assert.equal(unavailable.whatsappStatus,'unconfigured');assert.equal(sendCount,2);
  rateAllowed=false;assert.equal((await register(request())).status,429);assert.equal(sendCount,2);rateAllowed=true;
  now=Date.parse('2026-10-17T09:30:00Z');assert.equal((await register(request())).status,409);assert.equal(sendCount,2);
  const webhook=load('supabase/functions/whatsapp-status/index.ts');
  assert.equal((await webhook(new Request('https://synthetic.invalid?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123'))).status,403);
  assert.equal(await (await webhook(new Request('https://synthetic.invalid?hub.mode=subscribe&hub.verify_token=test-verify&hub.challenge=123'))).text(),'123');
  function statusRequest(status,valid=true){const payload=JSON.stringify({entry:[{changes:[{value:{statuses:[{id:'message-1',status}]}}]}]});return new Request('https://synthetic.invalid',{method:'POST',headers:{'x-hub-signature-256':'sha256='+createHmac('sha256',valid?env.WHATSAPP_APP_SECRET:'wrong').update(payload).digest('hex')},body:payload});}
  assert.equal((await webhook(statusRequest('delivered',false))).status,403);assert.equal(notifications.get(body.registrationId).status,'accepted');
  assert.equal((await webhook(statusRequest('delivered'))).status,200);assert.equal(notifications.get(body.registrationId).status,'delivered');
  await webhook(statusRequest('sent'));assert.equal(notifications.get(body.registrationId).status,'delivered');
  await webhook(statusRequest('read'));assert.equal(notifications.get(body.registrationId).status,'read');
  await webhook(statusRequest('failed'));assert.equal(notifications.get(body.registrationId).status,'read');
  console.log('PASS: Edge validation/origin/rate limit/expiry, no message on persistence failure, one send on success, duplicate/uncertain-send protection, private link, logged provider failure/configuration state, signed delivery webhook, monotonic statuses and one Google Sheet row per new registration. Mock providers only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
