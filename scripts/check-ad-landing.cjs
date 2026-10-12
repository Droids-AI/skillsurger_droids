const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve('dist');
const server = http.createServer((req,res) => {
  const filename = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  const file = fs.existsSync(filename) && fs.statSync(filename).isFile() ? filename : path.join(root,'index.html');
  const types = {'.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'};
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(4173,'127.0.0.1',resolve));
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844}});
    const rows=[];let failLead=false;
    await context.route('**/*', async route => {
      const request=route.request(),url=request.url();
      if(url.startsWith('http://127.0.0.1:4173')) return route.continue();
      if(url.includes('/functions/v1/register-webinar')) {
        if(failLead) return route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'Test persistence failure'})});
        const input=request.postDataJSON(); rows.push({form_type:'webinar_registration',payload:{...input,durationMinutes:60}});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({registrationId:'smoke-registration',alreadyRegistered:false,whatsappStatus:'unconfigured'})});
      }
      if(url.includes('/dodo/subscription/')) return route.fulfill({status:200,contentType:'application/json',body:'{"success":false}'});
      if(url.includes('/rest/v1/')) return route.fulfill({status:200,contentType:'application/json',body:'[]'});
      if(url.includes('/functions/v1/sheets-sync')) return route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'});
      return route.abort();
    });
    await context.addInitScript(()=>{Date.now=()=>Date.parse('2026-10-12T06:00:00Z')});
    const page=await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.getByRole('button',{name:'Open mobile menu'}).click();
    await page.getByRole('dialog',{name:'Main menu'}).waitFor();
    assert.equal(await page.getByRole('dialog').getByRole('heading',{name:'Platform',exact:true}).count(),1);
    for(const name of ['Career Explorer','Learning Paths','AI Mentor','Free Resume Audit','Job Switch Copilot']) assert.equal(await page.getByRole('dialog').getByRole('link',{name,exact:true}).count(),1);
    assert.equal(await page.getByRole('dialog').getByText('Services',{exact:true}).count(),0);
    await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
    await page.goto('http://127.0.0.1:4173/training');await page.waitForURL('**/job-switch-copilot');
    assert.ok((await page.locator('main').innerText()).includes('₹9,999'));
    assert.equal(await page.getByText('JSC Lite',{exact:true}).count(),0);
    assert.ok(await page.evaluate(() => document.getElementById('webinar').getBoundingClientRect().top < document.getElementById('programme').getBoundingClientRect().top), 'Registration must precede the paid programme');
    await page.getByRole('link',{name:'Register for the free webinar'}).click();await page.waitForFunction(()=>document.activeElement?.id==='webinar-name');
    await page.getByLabel('Full name').fill('Smoke Test');await page.getByLabel('Email',{exact:true}).fill('smoke@example.com');await page.getByLabel('WhatsApp number with country code').fill('+91 98765 43210');
    failLead=true;await page.getByRole('button',{name:'Reserve my free seat'}).click();await page.getByRole('alert').waitFor();assert.equal(rows.length,0);
    failLead=false;await page.getByRole('button',{name:'Reserve my free seat'}).click();await page.waitForURL('**/thank-you?type=webinar&existing=0&delivery=unconfigured');
    assert.equal(rows.length,1);assert.equal(rows[0].form_type,'webinar_registration');assert.equal(rows[0].payload.durationMinutes,60);
    await page.getByRole('heading',{name:'Your free webinar registration is received.'}).waitFor();
    await page.goto('http://127.0.0.1:4173/pricing');await page.getByRole('heading',{name:'Choose your career growth plan'}).waitFor();assert.ok(new URL(page.url()).pathname==='/pricing');assert.equal(await page.getByRole('link',{name:/Start Free Trial/}).getAttribute('href'),'/signup');assert.ok((await page.getByRole('link',{name:/Get Monthly Pro/}).getAttribute('href')).startsWith('https://checkout.dodopayments.com/'));
    for(const width of [320,390,768,1280]) {await page.setViewportSize({width,height:844});await page.goto('http://127.0.0.1:4173/job-switch-copilot');if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) console.log(await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,70),right:el.getBoundingClientRect().right})).slice(0,12)));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'Horizontal overflow at '+width);}
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>localStorage.setItem('supabase.auth.token',JSON.stringify({access_token:'mock-access',refresh_token:'mock-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'smoke-user',email:'smoke@example.com'}})));
    await page.reload();await page.locator('header').getByRole('link',{name:'Dashboard',exact:true,includeHidden:true}).waitFor({state:'attached'});await page.getByRole('button',{name:'Open mobile menu'}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
    fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/job-switch-copilot-mobile.png',fullPage:true});
    await page.setViewportSize({width:1280,height:900});await page.screenshot({path:'artifacts/job-switch-copilot-desktop.png',fullPage:true});
    console.log('PASS: mobile navigation, signed-in menu, redirects, offer, form failure/retry, saved lead, confirmation, and responsive widths. All submissions were mocked; no live leads were created.');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
