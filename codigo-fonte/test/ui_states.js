// Browser test: a career in Brazil with the state championship (Paulistão) and the Copinha
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const mobile = process.env.MOBILE === '1';
const ERA = process.env.ERA || '2026';
const CLUB = process.env.CLUB || 'Corinthians';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const pre = (mobile ? 'm_' : '') + 's' + ERA + '_';
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, pre + n + '.png') }); };
  const click = async (sel, opts) => { await page.locator(sel).first().click(opts); await page.waitForTimeout(150); };
  await page.goto('http://localhost:8765/_test.html');
  await page.waitForSelector('[data-a="newCareer"]', { timeout: 15000 });
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Renato Teste');
  await page.fill('#w-fav', CLUB);
  await click('button[type="submit"]');
  await click(`[data-a="wizSet"][data-k="era"][data-v="${ERA}"]`);
  await click('[data-a="wizNext"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizSet"][data-k="mode"][data-v="normal"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizNext"]');
  await page.waitForSelector('#any-q', { timeout: 60000 });
  await page.fill('#any-q', CLUB);
  await page.waitForTimeout(300);
  await click('#any-list [data-a="pickOffer"]');
  await page.waitForSelector('.hero-date', { timeout: 180000 });
  await shot('01_hub');
  console.log('hub:', (await page.locator('.comp-line').first().innerText().catch(() => '')).replace(/\n/g, ' '));
  // academy: Copinha
  await click('[data-a="tab"][data-t="academy"]');
  await click('[data-a="subtab"][data-g="academy"][data-k="copinha"]');
  await shot('02_copinha');
  // office: state championship in the cups view
  await click('[data-a="tab"][data-t="office"]');
  await click('[data-a="subtab"][data-g="office"][data-k="table"]');
  const est = page.locator('.panel [data-a="pickTable"]');
  console.log('state shortcut on tables:', await est.count());
  if (await est.count()) await est.first().click(); else await click('[data-a="subtab"][data-g="office"][data-k="cups"]');
  await page.waitForTimeout(200);
  await shot('03_state_cup');
  console.log('cups view:', (await page.locator('.page, main, body').first().innerText()).split('\n').filter((l) => /Paulist|Carioca|Gauch|Mineiro|grupos|Mata-mata|Classifica/.test(l)).slice(0, 5).join(' / '));
  // simulate to early March (2026) / mid March (other years)
  await click('[data-a="subtab"][data-g="office"][data-k="calendar"]');
  const months = +(process.env.MONTHS || 2);
  for (let i = 0; i < months; i++) await click('[data-a="calMove"][data-v="1"]');
  await page.locator('.cal .dc.fut .dn').nth(+(process.env.DAYIDX || 20)).click();
  await page.waitForTimeout(150);
  await click('[data-a="simToOpen"]');
  await click('[data-a="simOpt"][data-k="stop"]');
  await click('[data-a="simToGo"]');
  await page.waitForFunction(() => !document.getElementById('simov'), null, { timeout: 300000 });
  await page.waitForTimeout(300);
  await shot('04_sim_done');
  console.log('sim:', (await page.locator('.modal-h h2').last().innerText().catch(() => '')).replace(/\n/g, ' '));
  for (let k = 0; k < 3; k++) { if (await page.locator('#cel-ok').count()) await click('#cel-ok'); }
  if (await page.locator('.modal-f [data-a="closeModal"]').count()) await click('.modal-f [data-a="closeModal"]');
  for (let k = 0; k < 3; k++) { if (await page.locator('#cel-ok').count()) await click('#cel-ok'); }
  await click('[data-a="tab"][data-t="office"]');
  await click('[data-a="subtab"][data-g="office"][data-k="cups"]');
  await page.waitForTimeout(200);
  await shot('05_state_after');
  const sel = page.locator('select[data-a="cupSel"]');
  if (await sel.count()) {
    const opts = await sel.locator('option').allInnerTexts();
    console.log('cup options:', opts.filter((o) => /Paulist|Carioca|Mineiro|Gauch|Paran|Catar|Baiano|Pernamb|Cearense|Goiano|Paraense|Mato|Alagoano/.test(o)).join(', '));
  }
  await click('[data-a="tab"][data-t="academy"]');
  await click('[data-a="subtab"][data-g="academy"][data-k="copinha"]');
  await shot('06_copinha_after');
  await click('[data-a="tab"][data-t="office"]');
  await click('[data-a="subtab"][data-g="office"][data-k="gallery"]');
  await shot('07_gallery');
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
