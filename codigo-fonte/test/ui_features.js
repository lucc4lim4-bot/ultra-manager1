// Browser test of the v8 features: form arrows, wage budget transfer, simulate to a date from the calendar,
// development reports
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const mobile = process.env.MOBILE === '1';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 860 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const pre = (mobile ? 'm_' : '') + 'f_';
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, pre + n + '.png') }); };
  const click = async (sel, opts) => { await page.locator(sel).first().click(opts); await page.waitForTimeout(150); };
  await page.goto('http://localhost:8765/_test.html');
  await page.waitForSelector('[data-a="newCareer"]', { timeout: 15000 });
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Renato Teste');
  await page.fill('#w-fav', process.env.FAV || 'Palmeiras');
  await click('button[type="submit"]');
  await click('[data-a="wizSet"][data-k="era"][data-v="2026"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizSet"][data-k="mode"][data-v="normal"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 60000 });
  await click('[data-a="pickOffer"]');
  await page.waitForSelector('.hero-date', { timeout: 120000 });
  const team = await page.evaluate(() => document.querySelector('.hero-date') && document.title);
  console.log('started', team);
  // finance: move money to the wage budget
  await click('[data-a="tab"][data-t="office"]');
  await click('[data-a="subtab"][data-g="office"][data-k="finance"]');
  await shot('01_finance');
  const before = await page.locator('.stat-tile').nth(1).innerText();
  const up = page.locator('[data-a="wbMove"]:not([disabled])').first();
  if (await up.count()) { await up.click(); await page.waitForTimeout(200); }
  const after = await page.locator('.stat-tile').nth(1).innerText();
  console.log('wage tile before/after:', before.replace(/\n/g, ' '), '|', after.replace(/\n/g, ' '));
  await shot('02_finance_after');
  // calendar: pick a day ~40 days ahead and simulate to it
  await click('[data-a="subtab"][data-g="office"][data-k="calendar"]');
  for (let i = 0; i < +(process.env.MONTHS || 3); i++) await click('[data-a="calMove"][data-v="1"]');
  const days = page.locator('.cal .dc.fut');
  console.log('future days in that month:', await days.count());
  await page.locator('.cal .dc.fut .dn').nth(+(process.env.DAYIDX || 8)).click();
  await page.waitForTimeout(150);
  await shot('03_calendar_pick');
  await click('[data-a="simToOpen"]');
  await shot('04_sim_modal');
  if (process.env.NOSTOP !== '0') await click('[data-a="simOpt"][data-k="stop"]');
  await click('[data-a="simToGo"]');
  await page.waitForTimeout(400);
  await shot('05_sim_progress');
  await page.waitForFunction(() => !document.getElementById('simov'), null, { timeout: 180000 });
  await page.waitForTimeout(300);
  await shot('06_sim_done');
  const title = await page.locator('.modal-h h2').last().innerText().catch(() => '');
  console.log('sim result:', title);
  const txt = await page.locator('.modal-b').last().innerText().catch(() => '');
  console.log(txt.split('\n').slice(0, 8).join(' / '));
  if (await page.locator('[data-a="closeModal"]').count()) await click('.modal-f [data-a="closeModal"]');
  if (await page.locator('#cel-ok').count()) await click('#cel-ok');
  // squad with form arrows
  await click('[data-a="tab"][data-t="squad"]');
  const subs = page.locator('.subtabs button');
  const n = await subs.count();
  for (let i = 0; i < n; i++) {
    const t = await subs.nth(i).innerText();
    if (/Central|Elenco/i.test(t) && i > 0) { await subs.nth(i).click(); await page.waitForTimeout(200); break; }
  }
  console.log('form tags on squad screen:', await page.locator('.ftag').count());
  await shot('07_squad_form');
  const fp = page.locator('tr.click[data-a="openPlayer"]').first();
  if (await fp.count()) { await fp.click(); await page.waitForTimeout(250); await shot('08_player_form'); const kv = await page.locator('.kv').first().innerText(); console.log('player kv:', kv.split('\n').filter((l) => /Fase|Clube/.test(l)).join(' / ')); await click('[data-a="closeModal"]'); }
  // inbox: development report shows up after a quarter (Oct 1st) if the sim crossed it
  await click('[data-a="tab"][data-t="inbox"]');
  const subj = await page.locator('body').innerText();
  console.log('development report in inbox:', /Evolução dos jovens|Evolução do elenco/.test(subj));
  await shot('09_inbox');
  // central shows the "Simular até…" button
  await click('[data-a="tab"][data-t="central"]');
  console.log('simToCal button:', await page.locator('[data-a="simToCal"]').count());
  await shot('10_central');
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
