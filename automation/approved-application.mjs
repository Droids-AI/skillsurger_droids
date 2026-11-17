// Deterministic reference adapter for an operator-reviewed form. No AI runtime or page instructions.
// Bundle this with a reviewed Anchor Task; configure exact selectors from an authorized test site.
import { jsPDF } from 'jspdf';

export function cvPdf(cv, answers) {
  const doc = new jsPDF();
  const paragraphs = [answers.full_name, answers.email, answers.phone, cv.headline, cv.summary?.text,
    ...(cv.sections || []).flatMap(section => [section.heading, ...(section.items || []).map(item => item.text)])].filter(Boolean);
  let y=20;
  for (const paragraph of paragraphs) {
    for (const line of doc.splitTextToSize(String(paragraph).slice(0,10000),170)) {
      if (y>275) {doc.addPage();y=20;}
      doc.text(line,20,y);y+=6;
    }
    y+=3;
  }
  return Buffer.from(doc.output('arraybuffer'));
}

export async function executeApprovedApplication({page,inputs,adapter,authorizeSubmit}) {
  const bound = Object.fromEntries(['action_id','payload_hash','cv_version_id','application_url'].map(key=>[key,inputs[key]]));
  const result=(outcome,extra={})=>({...bound,outcome,...extra});
  let submitPermission=false,submitSent=false;
  const target=new URL(inputs.application_url);
  if(inputs.contract_version!=='application_v1' || target.protocol!=='https:' || target.hostname!==adapter.site || target.port || target.username || target.password ||
      !target.pathname.startsWith(adapter.pathPrefix) || !inputs.action_id || !inputs.cv_version_id || !inputs.payload_hash)
    throw new Error('invalid_application_contract');
  const answers=JSON.parse(inputs.answers_json);
  const cv=JSON.parse(inputs.cv_json);
  // Prevent the page from sending an application or navigating to an unreviewed destination.
  const guard=async route=>{
    const request=route.request();const u=new URL(request.url());
    if (request.isNavigationRequest() && (u.hostname!==adapter.site || u.protocol!=='https:')) return route.abort();
    if(u.origin!==target.origin && !(adapter.assetHosts || []).includes(u.hostname)) return route.abort();
    if (!['GET','HEAD','OPTIONS'].includes(request.method())) {
      if(!submitPermission || submitSent || u.origin!==target.origin || u.pathname!==adapter.submitPath || request.method()!=='POST') return route.abort();
      submitSent=true;
    }
    return route.fallback();
  };
  await page.route('**/*',guard);
  try {
    await page.goto(inputs.application_url,{waitUntil:'domcontentloaded',timeout:30000});
    if(new URL(page.url()).hostname!==adapter.site) return result('unknown');
    if(adapter.loginSelector && await page.locator(adapter.loginSelector).isVisible()) return result('needs_login');
    if(await page.locator(adapter.receiptSelector).count()) {
      const existing=page.locator(adapter.receiptSelector);
      if(await existing.getAttribute('data-action-id')===inputs.action_id) {
        const reference=await existing.getAttribute(adapter.receiptAttribute);
        if(reference) return result('already_submitted',{confirmation_reference:reference});
      }
    }
    if(!await page.locator(adapter.formSelector).count()) return result('not_submitted');
    const covered=[];
    for(const [key,selector] of Object.entries(adapter.fields)) {
      const locator=page.locator(selector);
      if(!await locator.count() || typeof answers[key]!=='string' || !answers[key].trim()) return result('needs_input');
      await locator.fill(answers[key]);covered.push(selector);
    }
    if(adapter.coverNoteSelector) {await page.locator(adapter.coverNoteSelector).fill(inputs.cover_note || '');covered.push(adapter.coverNoteSelector);}
    if(adapter.resumeSelector) {
      await page.locator(adapter.resumeSelector).setInputFiles({name:'skillsurger-approved-cv.pdf',mimeType:'application/pdf',buffer:cvPdf(cv,answers)});
      covered.push(adapter.resumeSelector);
    }
    // Required questions/checkboxes not explicitly covered by approved answers are never guessed.
    const unknown=await page.locator(adapter.formSelector).evaluate((form,selectors)=>
      [...form.querySelectorAll('input[required],select[required],textarea[required]')]
        .filter(el=>!el.disabled && el.type!=='hidden' && !selectors.some(selector=>el.matches(selector))).length,covered);
    if(unknown) return result('needs_input');
    let authorized=false;
    if(authorizeSubmit) authorized=await authorizeSubmit();
    else {
      const endpoint=new URL(inputs.submit_authorization_url);
      if(endpoint.origin!==adapter.authorizationOrigin || endpoint.pathname!=='/functions/v1/skillsurger-automation/authorize-submit' || endpoint.protocol!=='https:') throw new Error('invalid_authorization_endpoint');
      const response=await fetch(endpoint,{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),
        headers:{'Content-Type':'application/json'},body:JSON.stringify({run_id:inputs.local_run_id,token:inputs.submit_authorization_token})});
      authorized=response.ok && (await response.json()).authorized===true;
    }
    if(!authorized) return result('not_submitted');
    submitPermission=true;
    // There is exactly one click. A missing receipt never leads to another click.
    await page.locator(adapter.submitSelector).click({timeout:10000});
    try {await page.locator(adapter.receiptSelector).waitFor({state:'visible',timeout:adapter.receiptTimeoutMs || 15000});}
    catch {return result('unknown');}
    const receipt=page.locator(adapter.receiptSelector);
    const reference=await receipt.getAttribute(adapter.receiptAttribute);
    const receiptAction=await receipt.getAttribute('data-action-id');
    // The first-party fixture binds its receipt to the idempotency key. Other adapters must
    // implement equally strong job/candidate/receipt checks before their operator review.
    if(!reference || receiptAction!==inputs.action_id) return result('unknown');
    return result('submitted',{confirmation_reference:reference});
  } finally {await page.unroute('**/*',guard);}
}
