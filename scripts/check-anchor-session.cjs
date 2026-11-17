// Optional billable smoke check, explicitly operator invoked. Secret comes from the environment.
// Creates one bounded browser, runs intercepted synthetic forms and always requests cleanup.
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const crypto=require('node:crypto');
const out='artifacts/anchor-worker';fs.mkdirSync(out,{recursive:true});
async function call(route,method='GET',body){
  const response=await fetch('https://api.anchorbrowser.io'+route,{method,redirect:'error',signal:AbortSignal.timeout(30000),
    headers:{'anchor-api-key':process.env.ANCHOR_API_KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw new Error('anchor_http_'+response.status);
  const data=await response.json().catch(()=>({}));return data.data??data;
}
(async()=>{
  const report={started_at:new Date().toISOString(),scope:'Anchor Chromium with intercepted synthetic application fixture only; v2 Task dispatch is separately mocked in contract checks',session_created:false,session_ended:false};
  let session;
  try{
    if(!process.env.ANCHOR_API_KEY)throw new Error('anchor_key_missing');
    session=await call('/v1/sessions','POST',{session:{timeout:{max_duration:2,idle_timeout:1},recording:{active:false},proxy:{active:false},domain_allowlist:['qa.skillsurger.com']},browser:{headless:{active:true},captcha_solver:{active:false}}});
    report.session_created=true;report.session_reference_sha256=crypto.createHash('sha256').update(session.id).digest('hex');
    const {ANCHOR_API_KEY,...childEnv}=process.env;
    report.adapter_check_exit_code=await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,['scripts/check-automation-browser.cjs'],{env:{...childEnv,ANCHOR_CDP_URL:session.cdp_url},stdio:'inherit'});
      const timer=setTimeout(()=>child.kill('SIGTERM'),95000);
      child.on('error',reject);child.on('close',code=>{clearTimeout(timer);resolve(code??1);});
    });
  }catch(error){report.error=/^anchor_http_\d+$|^anchor_key_missing$/.test(error.message)?error.message:error.name;}
  finally{
    if(session){try{await call('/v1/sessions/'+encodeURIComponent(session.id),'DELETE');report.session_ended=true;}catch{report.cleanup_error='session_cleanup_failed';}}
    report.completed_at=new Date().toISOString();
    fs.writeFileSync(out+'/live-session-evidence.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
    if(report.adapter_check_exit_code!==0 || !report.session_ended)process.exitCode=1;
  }
})().catch(()=>{console.error('Anchor check failed');process.exitCode=1;});
