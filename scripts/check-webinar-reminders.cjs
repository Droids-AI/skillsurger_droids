// Scheduling, consent, opt-out, paid-skip and send-once behaviour of the webinar-reminders edge function. Mocks only.
const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');const ts=require('typescript');
const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only',WEBINAR_REMINDERS_SECRET:'cron-test',GREENAPI_API_URL:'https://7000.api.greenapi.invalid/',GREENAPI_ID_INSTANCE:'7000',GREENAPI_API_TOKEN:'tok',
  WEBINAR_JOIN_URL:'https://meeting.invalid/join',WEBINAR_EMAIL_ENABLED:'true',TWILIO_API_KEY:'k',TWILIO_API_SECRET:'s',TWILIO_EMAIL_FROM:'webinar@synthetic.invalid'};
const lead=(name,phone,consent,extra={})=>({payload:{name,phoneNumber:phone,whatsappConsent:consent,stage:'Registered',paymentStatus:'unpaid',...extra}});
const registrations=[
  {id:'r-a',email:'a@example.com',created_at:'2026-10-20T10:00:00Z',leads:lead('Asha Rao','+919800000001','yes')},
  {id:'r-b',email:'b@example.com',created_at:'2026-10-20T10:00:00Z',leads:lead('Bilal','+919800000002','no')},
  {id:'r-c',email:'c@example.com',created_at:'2026-10-20T10:00:00Z',leads:lead('Chitra','+919800000003','yes')},
  {id:'r-d',email:'d@example.com',created_at:'2026-10-23T10:30:00Z',leads:lead('Dev','+919800000004','yes')},
];
const optOuts=new Map([['+919800000003',{phone:'+919800000003'}]]);let incoming=[];let failIncoming=false;const reminders=new Map();const sends=[];
function from(table){
  let op='select',value,filters=[];
  const q={select(){return q},eq(k,v){filters.push([k,v]);return q},upsert(v){op='upsert';value=v;return q},update(v){op='update';value=v;return q},delete(){op='delete';return q},then(resolve,reject){
    let data=null;
    if(table==='webinar_registrations'){assert.deepEqual(filters,[['session_id','job-switch-2026-10-24']]);data=registrations;}
    else if(table==='messaging_opt_outs'){if(op==='select')data=[...optOuts.values()];if(op==='upsert'&&!optOuts.has(value.phone))optOuts.set(value.phone,value);if(op==='delete')optOuts.delete(Object.fromEntries(filters).phone);}
    else if(table==='webinar_reminders'){
      const key=r=>`${r.registration_id}:${r.stage}:${r.channel}`;
      if(op==='select')data=[...reminders.values()];
      if(op==='upsert'){data=reminders.has(key(value))?[]:[value];if(data.length)reminders.set(key(value),{...value});}
      if(op==='update'){const f=Object.fromEntries(filters);Object.assign(reminders.get(key(f)),value);}
    } else assert.fail('unexpected table '+table);
    return Promise.resolve({data,error:null}).then(resolve,reject);
  }};return q;
}
let now=0,handler,sharedCtx;
function loadShared(){const code=ts.transpileModule(fs.readFileSync('supabase/functions/_shared/greenApi.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const ctx={...sharedCtx,exports:{}};vm.runInNewContext(code,ctx);return ctx.exports;}
class ClockDate extends Date{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}static parse(s){return Date.parse(s)}}
const out=ts.transpileModule(fs.readFileSync('supabase/functions/webinar-reminders/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
sharedCtx={exports:{},require:n=>n.includes('greenApi')?loadShared():({createClient:()=>({from})}),Response,Request,AbortSignal,btoa,JSON,Date:ClockDate,Promise,Math,Array,Object,String,Set,console:{error(){}},Deno:{env:{get:k=>env[k]},serve:fn=>{handler=fn}},
  async fetch(url,o){if(String(url).startsWith('https://7000.api.greenapi.invalid/waInstance7000/lastIncomingMessages/tok?minutes=')){if(failIncoming)return new Response('x',{status:500});return new Response(JSON.stringify(incoming),{status:200});}const body=JSON.parse(o.body);
    if(String(url).startsWith('https://7000.api.greenapi.invalid/waInstance7000/sendMessage/tok')){sends.push({channel:'whatsapp',to:body.chatId.replace('@c.us',''),text:body.message});return new Response(JSON.stringify({idMessage:'wamid-'+sends.length}),{status:200});}
    if(String(url)==='https://comms.twilio.com/v1/Emails'){sends.push({channel:'email',to:body.to[0].address,subject:body.content.subject,text:body.to[0].variables.reminder_body});return new Response('{"operationId":"comms_operation_x'+sends.length+'"}',{status:202});}
    assert.fail('unexpected fetch '+url);}};
vm.runInNewContext(out,sharedCtx);
const call=(body={},secret='cron-test')=>handler(new Request('https://synthetic.invalid',{method:'POST',headers:{'x-cron-secret':secret},body:JSON.stringify(body)}));
const at=s=>{now=Date.parse(s)};
(async()=>{
  at('2026-10-23T16:00:00+05:30');
  assert.equal((await call({},'wrong')).status,403);
  const dry=await (await call({dryRun:true})).json();
  assert.deepEqual(dry.due,['reminder_24h']);assert.deepEqual(dry.counts,{'reminder_24h:whatsapp':1,'reminder_24h:email':3});assert.equal(sends.length,0,'Dry run sends nothing');

  const first=await (await call()).json();assert.equal(first.sent,4);
  const wa=sends.filter(s=>s.channel==='whatsapp');
  assert.deepEqual(wa.map(s=>s.to),['919800000001'],'WhatsApp only with consent and no STOP');
  assert.ok(wa[0].text.startsWith('Hi Asha,'));assert.ok(wa[0].text.includes('https://meeting.invalid/join'));assert.ok(wa[0].text.includes('Reply STOP'));
  assert.deepEqual(sends.filter(s=>s.channel==='email').map(s=>s.to).sort(),['a@example.com','b@example.com','c@example.com'],'Registered after the send time: skipped');
  assert.ok(sends.find(s=>s.channel==='email').text.includes('https://meeting.invalid/join'));
  assert.equal(reminders.get('r-a:reminder_24h:whatsapp').status,'accepted');assert.equal(reminders.get('r-a:reminder_24h:whatsapp').provider_message_id,'wamid-1');
  assert.equal((await (await call()).json()).sent,0,'Nothing is sent twice');assert.equal(sends.length,4);

  at('2026-10-24T14:30:00+05:30');
  incoming=[{chatId:'919800000001@c.us',timestamp:1,textMessage:' Stop '},{chatId:'919800000003@c.us',timestamp:1,textMessage:'STOP'},{chatId:'919800000003@c.us',timestamp:2,textMessage:'start'},{chatId:'120363@g.us',timestamp:3,textMessage:'STOP'}];
  const hour=await (await call()).json();assert.deepEqual(hour.due,['reminder_1h']);
  assert.ok(optOuts.has('+919800000001')&&!optOuts.has('+919800000003'),'STOP and later START replies are applied in order');
  const hourWa=sends.slice(4).filter(s=>s.channel==='whatsapp').map(s=>s.to).sort();assert.deepEqual(hourWa,['919800000003','919800000004'],'Opted-out number skipped, re-subscribed number messaged');
  assert.equal(hour.sent,6);incoming=[];

  sends.length=0;registrations[0].leads.payload.paymentStatus='paid';
  at('2026-10-24T16:30:00+05:30');
  const post=await (await call()).json();assert.deepEqual(post.due,['post_event']);
  assert.ok(!sends.some(s=>s.to==='a@example.com'||s.to==='919800000001'),'Buyers get no post-event sales messages');
  const postWa=sends.filter(s=>s.channel==='whatsapp').sort((a,b)=>a.to.localeCompare(b.to));assert.deepEqual(postWa.map(s=>s.to),['919800000003','919800000004']);assert.ok(postWa[0].text.includes('https://skillsurger.com/job-switch-copilot#programme'));
  assert.ok(sends.find(s=>s.channel==='email').text.includes('₹5,000'));

  sends.length=0;at('2026-10-25T10:30:00+05:30');
  failIncoming=true;const blocked=await (await call()).json();assert.deepEqual(blocked.due,['next_day']);assert.equal(sends.length,0,'No WhatsApp when STOP replies cannot be read');failIncoming=false;
  const next=await (await call()).json();assert.deepEqual(sends.map(s=>s.channel+':'+s.to).sort(),['whatsapp:919800000003','whatsapp:919800000004'],'Next day: WhatsApp only');

  at('2026-10-27T18:00:00+05:30');assert.deepEqual((await (await call()).json()).due,[],'Sequence ends after 72h');
  delete env.WEBINAR_REMINDERS_SECRET;assert.equal((await call()).status,503);
  console.log('PASS: Webinar reminders send each stage in its window once, honour consent and polled STOP/START replies, skip late registrants and buyers, dry run sends nothing, refuse without the cron secret. Mocks only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
