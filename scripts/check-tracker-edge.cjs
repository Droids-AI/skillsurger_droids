const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const {webcrypto,createHmac}=require('node:crypto');
const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only',GREENAPI_API_URL:'https://7000.api.greenapi.invalid',GREENAPI_ID_INSTANCE:'7000',GREENAPI_API_TOKEN:'test-only',WEBINAR_JOIN_URL:'https://meeting.invalid/private',WHATSAPP_GRAPH_VERSION:'v-test',WHATSAPP_APP_SECRET:'test-signature-secret',WHATSAPP_WEBHOOK_VERIFY_TOKEN:'test-verify',LEAD_CONFIRMATION_WEBHOOK_URL:'https://confirmation.invalid',LEAD_CONFIRMATION_WEBHOOK_SECRET:'test-secret',TWILIO_API_KEY:'test-key',TWILIO_API_SECRET:'test-only',TWILIO_EMAIL_FROM:'webinar@synthetic.invalid',WEBINAR_EMAIL_ENABLED:'true'};
let now=Date.parse('2026-10-12T10:00:00Z'),failInsert=false,failProvider=false,sendCount=0,rateAllowed=true;
const sheetRows=[];
const registrations=new Map(),notifications=new Map(),emailNotifications=new Map(),reminders=new Map(),optOuts=new Map();
let confirmationCount=0;
function query(table){
  const tables={webinar_notifications:[notifications,'registration_id'],lead_email_notifications:[emailNotifications,'lead_id'],webinar_reminders:[reminders,'provider_message_id'],messaging_opt_outs:[optOuts,'phone']};
  assert.ok(tables[table]);
  const [storage,primary]=tables[table];
  let update,remove=false,filters=[],select=false,single=false;
  const q={upsert(v){if(!storage.has(v[primary]))storage.set(v[primary],{status:v.status});return q},update(v){update=v;return q},delete(){remove=true;return q},eq(k,v){filters.push([k,[v]]);return q},in(k,v){filters.push([k,v]);return q},select(){select=true;return q},maybeSingle(){return q.single()},single(){single=true;return q},then(resolve,reject){
    const entries=[...storage.entries()].filter(([id,row])=>filters.every(([k,vs])=>vs.includes(k===primary?id:row[k])));
    if(remove)entries.forEach(([id])=>storage.delete(id));
    const result=entries.map(([id,row])=>{if(update)Object.assign(row,update);return {...row,[primary]:id}});
    return Promise.resolve({data:single?result[0]:select?result:null,error:single&&!result.length?{message:'not found'}:null}).then(resolve,reject);
  }};return q;
}
const admin={from:query,async rpc(name,args){
  if(name==='webinar_rate_limit')return {data:rateAllowed,error:null};
  if(failInsert)return {data:null,error:{message:'synthetic failure'}};
  const key=args.p_payload.email;
  const previous=registrations.get(key);if(previous)return {data:{registrationId:previous,leadId:previous,alreadyRegistered:true},error:null};
  const id='registration-'+(registrations.size+1);registrations.set(key,id);notifications.set(id,{status:'pending'});
  return {data:{registrationId:id,leadId:id,alreadyRegistered:false},error:null};
}};
function load(file){
  let handler;
  const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  class ClockDate extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
  const context={exports:{},require(name){if(name.includes('webinarEmail'))return load('supabase/functions/_shared/webinarEmail.ts');if(name.includes('greenApi'))return load('supabase/functions/_shared/greenApi.ts');return name.includes('leadConfirmation')?load('supabase/functions/_shared/leadConfirmation.ts'):{createClient(){return admin}}},btoa,Date:ClockDate,Response,Request,URL,Uint8Array,TextEncoder,AbortSignal,crypto:webcrypto,console:{error(){}},Deno:{env:{get:k=>env[k]},serve:fn=>{handler=fn}},async fetch(url,options){
    if(String(url)==='https://comms.twilio.com/v1/Emails'){confirmationCount++;const mail=JSON.parse(options.body);const text=mail.to[0].variables.confirmation_body;assert.ok(text.includes('Saturday, 24 October 2026 at 3:00 PM IST'));assert.ok(text.includes('chat.whatsapp.com'));assert.ok(text.includes('Before the webinar'));return new Response('{"operationId":"comms_operation_test1"}',{status:202});}
    if(String(url)==='https://confirmation.invalid'){confirmationCount++;const receipt=JSON.parse(options.body).confirmation;assert.equal(receipt.secret,'test-secret');assert.ok(receipt.body.includes('Saturday, 24 October 2026 at 3:00 PM IST'));assert.ok(receipt.body.includes('chat.whatsapp.com'));return new Response('{"success":true}',{status:200});}
    if(String(url).endsWith('/functions/v1/sheets-sync')){const row=JSON.parse(options.body);assert.equal(row.formType,'webinar_registration');assert.equal(row.startsAt,'2026-10-24T15:00:00+05:30');assert.equal(row.utmSource,'google');assert.equal(row.utmCampaign,'webinar-oct');assert.equal(row.stage,'Registered');assert.equal(row.qualified,'yes');assert.equal(row.experience,'6–8 years');sheetRows.push(row.email);return new Response('{"success":true}',{status:200});}
    sendCount++;assert.equal(String(url),'https://7000.api.greenapi.invalid/waInstance7000/sendMessage/test-only');const body=JSON.parse(options.body);assert.equal(body.chatId,'919876543210@c.us');assert.ok(body.message.includes(env.WEBINAR_JOIN_URL));
    assert.ok(body.message.includes('Saturday, 24 October 2026 at 3:00 PM IST'));assert.ok(body.message.startsWith('Hi Synthetic,'));assert.ok(body.message.includes('Reply STOP'));
    if(failProvider)throw new Error('synthetic timeout');
    return new Response(JSON.stringify({idMessage:'message-'+sendCount}),{status:200,headers:{'Content-Type':'application/json'}});
  }};
  vm.runInNewContext(output,context,{filename:file});return handler || context.exports;
}
const register=load('supabase/functions/register-webinar/index.ts');
const input={name:'Synthetic QA',email:'qa@example.com',phoneNumber:'+919876543210',sessionId:'job-switch-2026-10-24',currentRole:'Senior Engineer',targetRole:'Engineering Manager',experience:'6–8 years',timeline:'1–3 months',whatsappConsent:true,attribution:{utmSource:'google',utmCampaign:'webinar-oct'}};
const request=(body=input,origin='https://skillsurger.com')=>new Request('https://synthetic.invalid/register-webinar',{method:'POST',headers:{origin,'Content-Type':'application/json','x-forwarded-for':'192.0.2.1'},body:JSON.stringify(body)});
(async()=>{
  assert.equal((await register(request(input,'https://attacker.invalid'))).status,403);assert.equal(sendCount,0);
  assert.equal((await register(request({...input,email:'invalid'}))).status,400);assert.equal(sendCount,0);
  assert.equal((await register(new Request('https://synthetic.invalid',{method:'POST',headers:{origin:'https://skillsurger.com'},body:'invalid json'}))).status,400);
  failInsert=true;assert.equal((await register(request())).status,500);assert.equal(sendCount,0);failInsert=false;
  const first=await register(request());assert.equal(first.status,200);const body=await first.json();assert.equal(body.alreadyRegistered,false);assert.equal(body.whatsappStatus,'accepted');assert.equal(body.emailStatus,'accepted');assert.equal(confirmationCount,1);assert.equal(sendCount,1);
  assert.ok(!JSON.stringify(body).includes(env.WEBINAR_JOIN_URL),'Private link stays server-side');
  const duplicate=await (await register(request({...input,email:'QA@EXAMPLE.COM'}))).json();assert.equal(duplicate.alreadyRegistered,true);assert.equal(confirmationCount,1);assert.equal(sendCount,1);assert.deepEqual(sheetRows,['qa@example.com'],'One sheet row per new registration, none for duplicates');
  failProvider=true;const failed=await register(request({...input,email:'fail@example.com'}));assert.equal(failed.status,200);const failedBody=await failed.json();assert.equal(failedBody.whatsappStatus,'failed');assert.equal(registrations.size,2);assert.equal(notifications.get(failedBody.registrationId).error_code,'provider_response_unknown');failProvider=false;
  await register(request({...input,email:'fail@example.com'}));assert.equal(sendCount,2,'Uncertain provider sends must not auto-repeat');
  const noConsent=await (await register(request({...input,email:'noconsent@example.com',whatsappConsent:false}))).json();assert.equal(noConsent.whatsappStatus,'unconfigured');assert.equal(sendCount,2,'No WhatsApp message without consent');
  delete env.GREENAPI_API_TOKEN;const unavailable=await (await register(request({...input,email:'unconfigured@example.com'}))).json();assert.equal(unavailable.whatsappStatus,'unconfigured');assert.equal(sendCount,2);
  rateAllowed=false;assert.equal((await register(request())).status,429);assert.equal(sendCount,2);rateAllowed=true;
  now=Date.parse('2026-10-24T09:30:00Z');assert.equal((await register(request())).status,409);assert.equal(sendCount,2);
  const webhook=load('supabase/functions/whatsapp-status/index.ts');
  assert.equal((await webhook(new Request('https://synthetic.invalid?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123'))).status,403);
  assert.equal(await (await webhook(new Request('https://synthetic.invalid?hub.mode=subscribe&hub.verify_token=test-verify&hub.challenge=123'))).text(),'123');
  function statusRequest(status,valid=true){const payload=JSON.stringify({entry:[{changes:[{value:{statuses:[{id:'message-1',status}]}}]}]});return new Request('https://synthetic.invalid',{method:'POST',headers:{'x-hub-signature-256':'sha256='+createHmac('sha256',valid?env.WHATSAPP_APP_SECRET:'wrong').update(payload).digest('hex')},body:payload});}
  assert.equal((await webhook(statusRequest('delivered',false))).status,403);assert.equal(notifications.get(body.registrationId).status,'accepted');
  assert.equal((await webhook(statusRequest('delivered'))).status,200);assert.equal(notifications.get(body.registrationId).status,'delivered');
  await webhook(statusRequest('sent'));assert.equal(notifications.get(body.registrationId).status,'delivered');
  await webhook(statusRequest('read'));assert.equal(notifications.get(body.registrationId).status,'read');
  await webhook(statusRequest('failed'));assert.equal(notifications.get(body.registrationId).status,'read');
  reminders.set('message-r1',{status:'accepted'});
  const reminderStatus=JSON.stringify({entry:[{changes:[{value:{statuses:[{id:'message-r1',status:'delivered'}]}}]}]});
  await webhook(new Request('https://synthetic.invalid',{method:'POST',headers:{'x-hub-signature-256':'sha256='+createHmac('sha256',env.WHATSAPP_APP_SECRET).update(reminderStatus).digest('hex')},body:reminderStatus}));
  assert.equal(reminders.get('message-r1').status,'delivered','Reminder delivery statuses are tracked');
  function reply(text){const payload=JSON.stringify({entry:[{changes:[{value:{messages:[{from:'919876543210',type:'text',text:{body:text}}]}}]}]});return new Request('https://synthetic.invalid',{method:'POST',headers:{'x-hub-signature-256':'sha256='+createHmac('sha256',env.WHATSAPP_APP_SECRET).update(payload).digest('hex')},body:payload});}
  assert.equal((await webhook(reply(' stop '))).status,200);assert.ok(optOuts.has('+919876543210'),'STOP opts the number out');
  await webhook(reply('hello'));assert.ok(optOuts.has('+919876543210'));
  await webhook(reply('START'));assert.ok(!optOuts.has('+919876543210'),'START opts back in');
  console.log('PASS: Edge validation/origin/rate limit/expiry, no message on persistence failure, one send on success, duplicate/uncertain-send protection, private link, logged provider failure/configuration state, signed delivery webhook, monotonic statuses, reminder statuses, STOP/START opt-out and one Google Sheet row per new registration. Mock providers only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
