const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:#0b1537;color:white;font-family:Arial,sans-serif"><div style="height:630px;box-sizing:border-box;padding:74px 84px;background:linear-gradient(125deg,#0b1537,#183c87)"><p style="font-size:32px;font-weight:700;color:#8ddbf6;margin:0 0 68px">Skillsurger</p><h1 style="font-size:66px;line-height:1.12;max-width:950px;margin:0 0 34px">Prepare for your<br>next career move.</h1><p style="font-size:28px;color:#d5e5ff;margin:0">Resume feedback · Job search · Interview practice</p><p style="font-size:23px;color:#8ddbf6;margin-top:52px">skillsurger.com</p></div></body></html>`);
    await page.screenshot({ path: 'public/og-image.png' });
    console.log('Generated 1200 × 630 social sharing image.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
