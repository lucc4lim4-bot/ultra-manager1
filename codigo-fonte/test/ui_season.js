// Browser test: play a whole season through the UI (quick sims), reach the season end, continue into the next season.
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 820 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, 's_' + n + '.png') }); };
  const has = async (sel) => (await page.locator(sel).count()) > 0;
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(80); };
  await page.goto('http://localhost:8765/_test.html');
  await page.waitForSelector('[data-a="newCareer"]', { timeout: 15000 });
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Temporada Teste');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  if (process.env.MODE === 'normal') { await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]'); await click('[data-a="wizSet"][data-k="mode"][data-v="normal"]'); await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]'); }
  else for (let i = 0; i < 4; i++) await click('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 60000 });
  await click('[data-a="wizToggleNoFire"]');
  await click('[data-a="pickOffer"]');
  await page.waitForSelector('.hero-date', { timeout: 180000 });
  const t0 = Date.now();
  let matches = 0, ends = 0, cel = 0, guard = 0;
  while (guard++ < 900 && ends < 1) {
    if (await has('#cel-ok')) { cel++; if (cel === 1) await shot('celebration'); await click('#cel-ok'); continue; }
    if (await has('[data-a="endStay"]')) { await shot('season_end'); await click('[data-a="endStay"]'); ends++; continue; }
    if (await has('[data-a="openSeasonEnd"]')) { await click('[data-a="openSeasonEnd"]'); continue; }
    if (await has('[data-a="goMatch"]')) {
      await click('[data-a="goMatch"]');
      await click('[data-a="simNow"]');
      await page.waitForSelector('[data-a="postContinue"]', { timeout: 20000 });
      await click('[data-a="postContinue"]');
      matches++;
      continue;
    }
    if (await has('[data-a="advance"][data-m="match"]')) { await click('[data-a="advance"][data-m="match"]'); await page.waitForTimeout(60); continue; }
    if (await has('[data-a="advance"]')) { await click('[data-a="advance"]'); continue; }
    if (await has('.modal [data-a="closeModal"]')) { await click('.modal [data-a="closeModal"]'); continue; }
    await page.waitForTimeout(200);
  }
  console.log(`season loop: matches ${matches}, celebrations ${cel}, season ends ${ends}, ${((Date.now() - t0) / 1000).toFixed(0)}s, guard ${guard}`);
  await page.waitForTimeout(300);
  await shot('new_season_hub');
  const hero = await page.locator('.hero-date').first().textContent().catch(() => '');
  const sub = await page.locator('.comp-line').first().textContent().catch(() => '');
  console.log('after season end:', hero, '|', sub);
  await click('[data-a="tab"][data-t="office"]');
  for (const k of ['gallery', 'career']) { await click(`[data-a="subtab"][data-k="${k}"]`); await shot('office_' + k); }
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
