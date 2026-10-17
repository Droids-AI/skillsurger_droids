// Signature verification and idempotent recording for the dodo-webhook edge function. Mocks only.
const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');const ts=require('typescript');
const {webcrypto,createHmac}=require('node:crypto');
const secretBytes=Buffer.from('synthetic-signing-key-for-tests');const env={SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only',DODO_WEBHOOK_SECRET:'whsec_'+secretBytes.toString('base64')};
const events=new Map();const sheet=[];
const admin={async rpc(name,{p_event}){assert.equal(name,'record_payment_event');if(events.has(p_event.event_id))return {data:{duplicate:true},error:null};events.set(p_event.event_id,p_event);return {data:{duplicate:false,email:p_event.customer_email},error:null};}};
let handler;
const out=ts.transpileModule(fs.readFileSync('supabase/functions/dodo-webhook/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(out,{exports:{},require:()=>({createClient:()=>admin}),Response,Request,TextEncoder,Uint8Array,AbortSignal,atob,btoa,String,Number,Math,Date,JSON,Array,crypto:webcrypto,console:{error(){}},Deno:{env:{get:k=>env[k]},serve:fn=>{handler=fn}},async fetch(url,o){assert.ok(String(url).endsWith('/functions/v1/sheets-sync'));sheet.push(JSON.parse(o.body));return new Response('{}');}});
const sign=(id,t,body)=>'v1,'+createHmac('sha256',secretBytes).update(`${id}.${t}.${body}`).digest('base64');
const send=(payload,{id='msg_1',t=Math.floor(Date.now()/1000),sig}={})=>{const body=JSON.stringify(payload);return handler(new Request('https://synthetic.invalid',{method:'POST',headers:{'webhook-id':id,'webhook-timestamp':String(t),'webhook-signature':sig??sign(id,t,body)},body}));};
const paid={type:'payment.succeeded',data:{payment_id:'pay_1',status:'succeeded',total_amount:500000,currency:'INR',customer:{email:'buyer@example.com',name:'Buyer'},product_cart:[{product_id:'pdt_1',quantity:1}]}};
(async()=>{
  assert.equal((await send(paid,{sig:'v1,AAAA'})).status,401);assert.equal(events.size,0);
  assert.equal((await send(paid,{t:Math.floor(Date.now()/1000)-3600})).status,401,'Stale timestamp rejected');
  assert.equal((await send(paid)).status,200);assert.equal(events.size,1);
  const row=events.get('msg_1');assert.equal(row.amount_minor,500000);assert.equal(row.customer_email,'buyer@example.com');assert.deepEqual(row.product_ids,['pdt_1']);
  assert.equal((await send(paid)).status,200);assert.equal(events.size,1);assert.equal(sheet.length,1,'Redelivery is idempotent');
  assert.equal(sheet[0].formType,'payment');assert.equal(sheet[0].amountInr,5000);
  assert.equal((await send({type:'refund.succeeded',data:{refund_id:'ref_1',payment_id:'pay_1',amount:500000,currency:'INR',status:'succeeded'}},{id:'msg_2'})).status,200);
  assert.equal(events.get('msg_2').refund_id,'ref_1');assert.equal(sheet.length,2);
  delete env.DODO_WEBHOOK_SECRET;assert.equal((await send(paid,{id:'msg_3'})).status,503);
  console.log('PASS: Dodo webhook rejects bad/stale signatures, records payment and refund once, syncs one sheet row each, refuses when unconfigured. Mocks only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
