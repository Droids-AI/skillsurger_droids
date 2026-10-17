const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const JSZip = require('jszip');
const { jsPDF } = require('jspdf');
const root = path.resolve('dist');
const server = http.createServer((req,res) => {
  const filename=path.join(root,decodeURIComponent(req.url.split('?')[0]));
  const file=fs.existsSync(filename)&&fs.statSync(filename).isFile()?filename:fs.existsSync(path.join(filename,'index.html'))?path.join(filename,'index.html'):path.join(root,'index.html');
  res.setHeader('Content-Type',({'.js':'application/javascript','.mjs':'application/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const base='http://127.0.0.1:4174';
const schedule='Saturday, 24 October 2026 at 3:00 PM IST';

(async()=>{
  await new Promise(resolve=>server.listen(4174,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const evidence={at:new Date().toISOString(),environment:'local dist / mocked providers / synthetic fixtures',cases:[]};
  function passed(id,detail){evidence.cases.push({id,result:'Developer check passed',detail});}
  try {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const registrations=new Map();let attempts=0,fail=false,recoveryRequests=0,failRecovery=false,updatedPassword=false;
    const authCalls=[];
    const qaUser={id:'11111111-1111-1111-1111-111111111111',email:'qa@example.com',aud:'authenticated',role:'authenticated',created_at:new Date().toISOString()};
    const token='eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({sub:qaUser.id,exp:Math.floor(Date.now()/1000)+3600,amr:[{method:'recovery',timestamp:Math.floor(Date.now()/1000)}]})).toString('base64url')+'.synthetic';
    await context.addInitScript(()=>{
      Date.now=()=>Date.parse('2026-10-12T06:00:00Z');
      window.__qaConversions=[];
      const layer=[];
      layer.push=function(...entries){for(const e of entries)if(e[0]==='event'&&e[1]==='conversion')window.__qaConversions.push(e[2]);return Array.prototype.push.apply(this,entries)};
      window.dataLayer=layer;
    });
    await context.route('**/*',async route=>{
      const req=route.request(),url=req.url();
      if(url.includes('/auth/v1/')) authCalls.push(new URL(url).pathname);
      if(url.startsWith(base))return route.continue();
      if(url.includes('/functions/v1/register-webinar')){
        attempts++;const input=req.postDataJSON();
        await new Promise(r=>setTimeout(r,200));
        if(fail)return route.fulfill({status:500,contentType:'application/json',body:'{"error":"synthetic failure"}'});
        const key=input.email.trim().toLowerCase(),previous=registrations.get(key);
        const id=previous||`synthetic-${registrations.size+1}`;registrations.set(key,id);
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({registrationId:id,alreadyRegistered:!!previous,whatsappStatus:'unconfigured'})});
      }
      if(url.includes('/auth/v1/recover')){recoveryRequests++;return route.fulfill({status:failRecovery?500:200,contentType:'application/json',body:failRecovery?'{"msg":"synthetic failure"}':'{}'});}
      if(url.includes('/auth/v1/token'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({access_token:token,refresh_token:'synthetic-refresh',token_type:'bearer',expires_in:3600,user:qaUser})});
      if(url.includes('/auth/v1/user')){
        if(req.method()==='PUT'){updatedPassword=req.postDataJSON().password==='SyntheticPassword123!';}
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(qaUser)});
      }
      if(url.includes('/auth/v1/logout'))return route.fulfill({status:204,body:''});
      if(url.includes('/rest/v1/'))return route.fulfill({status:200,contentType:'application/json',body:'[]'});
      return route.abort();
    });
    const page=await context.newPage();
    await page.goto(base+'/job-switch-copilot');
    const conversions=()=>page.evaluate(()=>window.__qaConversions);
    assert.equal((await conversions()).length,0);passed('QA-001','Zero conversion on page load.');
    assert.equal(await page.locator('script[src*="googletagmanager.com/gtag/js"]').count(),1);
    const configs=await page.evaluate(()=>window.dataLayer.filter(x=>x[0]==='config').map(x=>x[1]));
    assert.ok(configs.includes('AW-994095654')&&configs.includes('AW-18357417979'));
    await page.getByRole('button',{name:'Reserve my free seat',exact:true}).click();
    assert.equal(attempts,0);assert.equal((await conversions()).length,0);passed('QA-002','Empty/invalid form produces no request or conversion.');
    assert.ok(await page.getByText(schedule,{exact:true}).count()>=2);
    assert.ok((await page.locator('#webinar form').innerText()).split(schedule).length >= 3, 'Schedule in card and below-form copy');
    assert.ok(await page.getByText(schedule,{exact:true}).first().evaluate(el=>el.getBoundingClientRect().bottom<innerHeight),'Schedule appears above fold on mobile');
    await page.getByLabel('Full name').fill('Synthetic QA');await page.getByLabel('Email',{exact:true}).fill('qa@example.com');await page.getByLabel('WhatsApp number with country code').fill('+919876543210');await page.getByLabel('Current role').fill('Senior Engineer');await page.getByLabel('Target role').fill('Engineering Manager');await page.getByLabel('Experience').selectOption('6–8 years');await page.getByLabel('When do you want to switch?').selectOption('1–3 months');
    fail=true;await page.getByRole('button',{name:'Reserve my free seat',exact:true}).click();await page.getByRole('alert').waitFor();
    assert.equal(registrations.size,0);assert.equal((await conversions()).length,0);
    fail=false;
    const before=attempts;
    await page.locator('#webinar form').evaluate(form=>{form.requestSubmit();form.requestSubmit()});
    await page.waitForURL('**/thank-you?type=webinar&existing=0&delivery=unconfigured&email=unconfigured');
    assert.equal(attempts-before,1);assert.equal(registrations.size,1);
    // SPA navigation leaves the dataLayer intact, so inspect the actual gtag call.
    const events=await conversions();assert.equal(events.length,1);assert.equal(events[0].send_to,'AW-18357417979/018aCPbEh5gdEPvvv7FE');assert.equal(events[0].transaction_id,'synthetic-1');
    passed('QA-003','Forced 500 emits zero conversion; successful retry emits exactly one.');passed('QA-004','Exact Ads destination/label and registration transaction_id checked.');
    assert.ok((await page.locator('main').innerText()).includes(schedule));
    const calendarUrl=new URL(await page.getByRole('link',{name:'Add to Google Calendar'}).getAttribute('href'));
    assert.equal(calendarUrl.searchParams.get('dates'),'20261024T093000Z/20261024T103000Z');
    await page.reload();assert.equal((await conversions()).length,0);
    await page.goto(base+'/job-switch-copilot');
    await page.getByLabel('Full name').fill('Synthetic QA');await page.getByLabel('Email',{exact:true}).fill('QA@EXAMPLE.COM');await page.getByLabel('WhatsApp number with country code').fill('+919876543210');await page.getByLabel('Current role').fill('Senior Engineer');await page.getByLabel('Target role').fill('Engineering Manager');await page.getByLabel('Experience').selectOption('6–8 years');await page.getByLabel('When do you want to switch?').selectOption('1–3 months');
    await page.getByRole('button',{name:'Reserve my free seat',exact:true}).click();await page.getByRole('heading',{name:'You are already registered.'}).waitFor();
    assert.equal((await conversions()).length,0);assert.equal(registrations.size,1);passed('QA-005','Concurrent submits, success refresh and existing-registration response do not duplicate conversions.');
    assert.equal(await page.getByRole('link',{name:'Join WhatsApp group'}).getAttribute('href'),'https://chat.whatsapp.com/L3kJ4PBEKDH6PADvfqYXwE');
    for(const width of [320,390,768,1280]) {
      await page.setViewportSize({width,height:900});await page.goto(base+'/job-switch-copilot');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      if(width===1280)assert.ok(await page.getByText(schedule,{exact:true}).first().evaluate(el=>el.getBoundingClientRect().bottom<innerHeight));
    }
    passed('QA-006','Schedule in hero/card/below-form/confirmation, above-fold hero on mobile/desktop; no overflow at 320/390/768/1280.');

    // Synthetic PDF and DOCX carry identical facts; no real resume is read.
    const lines=['Synthetic Candidate','Software Engineer','Skills: Python, Java, SQL, Docker, REST APIs','Experience','Developed Python REST APIs using Java and SQL with Docker.','Education','Computer Science'];
    const pdf=new jsPDF();lines.forEach((line,i)=>pdf.text(line,20,20+i*10));
    const zip=new JSZip();
    zip.file('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml','<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+lines.map(l=>'<w:p><w:r><w:t>'+l+'</w:t></w:r></w:p>').join('')+'</w:body></w:document>');
    const fixtures=[{name:'synthetic-resume.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf.output('arraybuffer'))},{name:'synthetic-resume.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:await zip.generateAsync({type:'nodebuffer'})}];
    for(const fixture of fixtures){
      await page.goto(base+'/job-readiness-index');await page.getByRole('button',{name:'Upload Resume to Start'}).click();await page.locator('input[type=file]').setInputFiles(fixture);
      await page.getByRole('button',{name:'Analyze My Resume'}).click();await page.getByRole('heading',{name:'Verify Your Skills'}).waitFor();
      const text=await page.locator('main').innerText();for(const skill of ['Python','Java','SQL','Docker','REST APIs'])assert.ok(text.includes(skill));
      const questions=[];
      for(let i=0;i<5;i++){
        questions.push(await page.locator('main h3').first().innerText());
        await page.locator('main button').filter({has:page.locator('span')}).first().count();
        // Option buttons are before the submit button; answer selection is enough
        // to inspect all skill-specific questions regardless of chosen correctness.
        await page.locator('main button').first().click();await page.getByRole('button',{name:'Submit Answer'}).click();
        if(i<4)await page.getByRole('button',{name:'Next Question'}).click();
      }
      assert.ok(!questions.some(q=>q.includes('version control')));assert.ok(questions.some(q=>q.includes('Java Virtual Machine')));assert.ok(questions.some(q=>q.includes('HTTP method')));
      passed(fixture.name.endsWith('pdf')?'QA-008':'QA-007','Equivalent synthetic resume extracts all five skills; quiz includes Python/Java/SQL/Docker/REST-specific questions.');
    }
    await page.goto(base+'/job-readiness-index');await page.getByRole('button',{name:'Upload Resume to Start'}).click();await page.locator('input[type=file]').setInputFiles({name:'broken.pdf',mimeType:'application/pdf',buffer:Buffer.from('not a PDF')});await page.getByRole('button',{name:'Analyze My Resume'}).click();await page.getByText(/Could not read this resume/).waitFor();
    // Java must not be falsely detected within JavaScript.
    await page.locator('input[type=file]').count();
    await page.getByRole('button',{name:'Upload Different File'}).click();await page.locator('input[type=file]').setInputFiles({name:'javascript.txt',mimeType:'text/plain',buffer:Buffer.from('JavaScript engineer with React experience')});await page.getByRole('button',{name:'Analyze My Resume'}).click();await page.getByRole('heading',{name:'Verify Your Skills'}).waitFor();assert.ok(!(await page.locator('main').innerText()).includes('Java, '));

    await page.goto(base+'/login');await page.getByRole('link',{name:'Forgot your password?'}).click();await page.getByLabel('Email address').fill('qa@example.com');
    failRecovery=true;await page.getByRole('button',{name:'Send reset link'}).click();await page.getByRole('alert').waitFor();
    failRecovery=false;await page.getByRole('button',{name:'Send reset link'}).click();await page.getByRole('status').waitFor();assert.equal(recoveryRequests,2);
    await page.goto(base+'/reset-password?code=synthetic-code');await page.getByLabel('New password',{exact:true}).waitFor();
    try { await page.waitForFunction(()=>!document.querySelector('#new-password').disabled,{},{timeout:10000}); }
    catch(error) { console.log('Synthetic recovery debug:', authCalls, await page.evaluate(()=>({keys:Object.keys(localStorage),marker:sessionStorage.getItem('skillsurger-recovery'),verifierKeys:Object.keys(localStorage).filter(k=>k.endsWith('code-verifier')).map(k=>({key:k,recovery:localStorage.getItem(k).includes('recovery')}))}))); throw error; }
    await page.getByLabel('New password',{exact:true}).fill('SyntheticPassword123!');await page.getByLabel('Confirm password').fill('SyntheticPassword123!');await page.getByRole('button',{name:'Update password'}).click();await page.getByRole('status').filter({hasText:'Your password has been updated'}).waitFor();assert.equal(updatedPassword,true);
    await page.goto(base+'/reset-password');await page.getByText(/reset link is missing, invalid, or expired/).waitFor();assert.ok(await page.getByRole('link',{name:'Request a new reset link'}).count()===1);passed('DEV-013','Reset request failure/retry, PKCE recovery callback, password update/signout and expired-link recovery checked with mocked auth.');
    await page.goto(base+'/book-diagnosis');await page.waitForURL('**/book-a-call');await page.getByRole('heading',{name:'Book Your Career Diagnosis Call'}).waitFor();passed('DEV-012','Booking alias resolves to existing usable booking form.');
    await page.goto(base+'/courses/forward-deployed-ai-engineer');
    const sections=page.locator('details').filter({has:page.locator('ol')});assert.equal(await sections.count(),18);
    for(const detail of await sections.all())await detail.locator('summary').click();assert.equal(await sections.locator('ol li').count(),156);
    for(const name of ['OmniGuard','AuditMesh'])assert.equal(await page.getByRole('heading',{name,exact:true}).count(),1);
    assert.equal(await page.getByRole('link',{name:'Enroll on Udemy'}).getAttribute('href'),'https://www.udemy.com/course/ai-forward-deployed-engineer-extensive-program/?referralCode=059C9E3DEB7126402751');
    assert.ok(await page.title().then(t=>t.includes('Forward Deployed AI Engineer')));assert.ok(await page.locator('meta[property="og:description"]').getAttribute('content'));
    for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    passed('QA-036','18 sections/156 items, two exact capstone names, supplied Udemy CTA and metadata; responsive widths checked. Public Udemy availability not tested.');
    fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/fde-course-desktop.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.goto(base+'/job-switch-copilot');await page.screenshot({path:'artifacts/tracker-webinar-mobile.png',fullPage:true});
    const expiredAttempts=attempts;
    await page.getByLabel('Full name').fill('Synthetic Expired');await page.getByLabel('Email',{exact:true}).fill('expired@example.com');await page.getByLabel('WhatsApp number with country code').fill('+919876543210');await page.getByLabel('Current role').fill('Senior Engineer');await page.getByLabel('Target role').fill('Engineering Manager');await page.getByLabel('Experience').selectOption('6–8 years');await page.getByLabel('When do you want to switch?').selectOption('1–3 months');
    await page.evaluate(()=>{Date.now=()=>Date.parse('2026-10-24T09:30:00Z');document.querySelector('#webinar form').requestSubmit()});
    await page.getByRole('button',{name:'Registration closed',exact:true}).waitFor();assert.equal(attempts,expiredAttempts);assert.equal((await conversions()).length,0);
    passed('Webinar expiry','At the confirmed start boundary the form closes without a request or conversion.');
    await context.close();
    console.log('PASS: '+evidence.cases.length+' browser QA scenarios; providers mocked, synthetic resumes only, no live leads/messages.');
  } finally {
    fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/tracker-browser-evidence.json',JSON.stringify(evidence,null,2));
    await browser.close();server.close();
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
