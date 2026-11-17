const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base=process.env.AUTOMATION_PREVIEW_URL || 'http://127.0.0.1:5173/artifacts/anchor-worker-preview/';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const failures=[];const evidence=[];
  fs.mkdirSync('artifacts/anchor-worker',{recursive:true});
  try{
    const page=await browser.newPage();page.on('pageerror',error=>failures.push(error.message));
    for(const width of [360,390,1280]){
      await page.setViewportSize({width,height:900});await page.goto(base);
      await page.getByRole('button',{name:'Approve this application',exact:true}).click();
      const start=page.getByRole('button',{name:'Start approved application',exact:true});
      await start.waitFor();assert.equal(await start.isDisabled(),true);
      await page.getByRole('checkbox').check();await page.waitForFunction(()=>window.qaAutomation.consent===true);
      await start.click();await page.getByText('Browser application in progress',{exact:true}).waitFor();
      const dispatches=await page.evaluate(()=>window.qaAutomation.calls.filter(c=>c.route==='/run').length);assert.equal(dispatches,1);
      await page.getByRole('button',{name:'Check status',exact:true}).click();
      await page.getByText('Application confirmed by the job board',{exact:true}).waitFor();
      await page.getByText('Confirmation: QA-PREVIEW-ONLY',{exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Discard unstarted draft',exact:true}).count(),0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'no overflow at '+width);
      await page.screenshot({path:`artifacts/anchor-worker/application-ui-${width}.png`,fullPage:true});
      evidence.push({width,one_dispatch:true,confirmed_receipt:true,no_horizontal_overflow:true});
    }
    await page.reload();await page.getByRole('button',{name:'Approve this application',exact:true}).click();
    await page.getByRole('checkbox').check();await page.waitForFunction(()=>window.qaAutomation.consent);
    await page.evaluate(()=>{window.qaAutomation.nextOutcome='reconciling';});
    await page.getByRole('button',{name:'Start approved application',exact:true}).click();
    await page.getByRole('button',{name:'Check status',exact:true}).click();
    await page.getByText('Checking whether the application was submitted',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Start approved application',exact:true}).count(),0);
    await page.getByRole('button',{name:'Withdraw browser permission',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.qaAutomation.consent),false);
    assert.deepEqual(failures,[]);
    fs.writeFileSync('artifacts/anchor-worker/ui-evidence.json',JSON.stringify({checked_at:new Date().toISOString(),scope:'synthetic local component preview with mocked APIs',views:evidence,reconciliation_no_resubmit:true,consent_withdrawal:true,page_errors:failures},null,2)+'\n');
    console.log('PASS approval, consent, one dispatch, receipt, reconciliation and withdrawal; 360/390/1280px; no page errors.');
  }finally{await browser.close();}
})().catch(e=>{console.error('FAIL',e.message);process.exitCode=1;});
