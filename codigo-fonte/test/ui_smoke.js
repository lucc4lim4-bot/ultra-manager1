// Browser smoke test: start a career, browse tabs, play/sim matches, check for runtime errors.
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
// emulate the artifact skeleton (doctype + head) around the page body
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const mobile = process.env.MOBILE === '1';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 820 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, (mobile ? 'm_' : '') + n + '.png') }); };
  const click = async (sel, opts) => { await page.locator(sel).first().click(opts); await page.waitForTimeout(120); };
  await page.goto('http://localhost:8765/_test.html');
  await page.waitForSelector('[data-a="newCareer"]', { timeout: 15000 });
  await shot('01_start');
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Renato Teste');
  await page.fill('#w-fav', process.env.FAV || 'Corinthians');
  await click('button[type="submit"]');
  const era = process.env.ERA || '2026';
  await click(`[data-a="wizSet"][data-k="era"][data-v="${era}"]`);
  await click('[data-a="wizNext"]');
  if (process.env.KIND === 'national') await click('[data-a="wizSet"][data-k="kind"][data-v="national"]');
  await click('[data-a="wizNext"]');
  if (process.env.KIND !== 'national') {
    if (process.env.MODE === 'normal') await click('[data-a="wizSet"][data-k="mode"][data-v="normal"]');
    await click('[data-a="wizNext"]');
  }
  if (process.env.ZOEIRA === '1') await click('[data-a="wizToggle"]');
  await click('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 60000 });
  await shot('02_offers');
  const offerSel = process.env.OFFER ? `[data-a="pickOffer"]:nth-of-type(${process.env.OFFER})` : '[data-a="pickOffer"]';
  await click(offerSel);
  await page.waitForSelector('.hero-date', { timeout: 120000 });
  await shot('03_hub');
  for (const t of ['inbox', 'squad', 'transfers', 'academy', 'office']) {
    const b = page.locator(`[data-a="tab"][data-t="${t}"]`).first();
    if (await b.count()) { await b.click(); await page.waitForTimeout(200); await shot('04_tab_' + t); }
  }
  // squad sub tabs & office sub tabs
  await click('[data-a="tab"][data-t="squad"]');
  const subs = await page.locator('.subtabs button').all();
  for (let i = 0; i < subs.length; i++) { const bs = await page.locator('.subtabs button').all(); if (bs[i]) { await bs[i].click(); await page.waitForTimeout(150); await shot('05_squad_sub' + i); } }
  await click('[data-a="tab"][data-t="office"]');
  const osubs = await page.locator('.subtabs button').count();
  for (let i = 0; i < osubs; i++) { const bs = await page.locator('.subtabs button').all(); if (bs[i]) { await bs[i].click(); await page.waitForTimeout(200); await shot('06_office_sub' + i); } }
  await click('[data-a="tab"][data-t="central"]');
  // open a team modal from the table
  // play: advance to match
  let found = false;
  for (let i = 0; i < 60 && !found; i++) {
    if (await page.locator('[data-a="goMatch"]').count()) { found = true; break; }
    if (await page.locator('[data-a="openSeasonEnd"]').count()) break;
    const adv = page.locator('[data-a="advance"][data-m="match"]');
    if (await adv.count()) await adv.first().click(); else await click('[data-a="advance"]');
    await page.waitForTimeout(300);
    // close any modal that might have appeared (celebration etc.)
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
  }
  console.log('match day found:', found);
  if (found) {
    await click('[data-a="goMatch"]');
    await page.waitForTimeout(300);
    await shot('07_prematch');
    if (process.env.PLAY !== '0') {
      await click('[data-a="start2d"]');
      await shot('08_play_modal');
      await click('[data-a="g2dGo"]');
      await page.waitForTimeout(1500);
      await shot('09_game_kickoff');
      // move & pass a bit
      await page.keyboard.down('j'); await page.keyboard.up('j');
      await page.keyboard.down('w'); await page.waitForTimeout(1200); await page.keyboard.up('w');
      await page.keyboard.down('d'); await page.waitForTimeout(500);
      await page.keyboard.down('k'); await page.waitForTimeout(500); await page.keyboard.up('k'); await page.keyboard.up('d');
      await page.waitForTimeout(2500);
      await shot('10_game_play');
      await page.keyboard.press('p');
      await page.waitForTimeout(200);
      await shot('11_game_pause');
      await click('[data-g="subs"]');
      await shot('12_game_subs');
      await click('[data-g="back"]');
      await click('[data-g="sim"]');
      await page.waitForSelector('[data-a="postContinue"]', { timeout: 20000 });
      await shot('13_post');
      await click('[data-a="postContinue"]');
    } else {
      await click('[data-a="startLive"]');
      await page.waitForTimeout(2500);
      await shot('08_live');
      await click('[data-a="liveSkip"]');
      await page.waitForSelector('[data-a="postContinue"]', { timeout: 20000 });
      await shot('09_post');
      await click('[data-a="postContinue"]');
    }
  }
  // advance a few weeks with quick sims of user matches
  const weeks = +(process.env.WEEKS || 3);
  for (let i = 0; i < weeks * 8; i++) {
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
    if (await page.locator('[data-a="endStay"]').count()) { await shot('20_season_end'); await click('[data-a="endStay"]'); continue; }
    if (await page.locator('[data-a="openSeasonEnd"]').count()) { await click('[data-a="openSeasonEnd"]'); continue; }
    if (await page.locator('[data-a="goMatch"]').count()) {
      await click('[data-a="goMatch"]');
      await click('[data-a="simNow"]');
      await page.waitForSelector('[data-a="postContinue"]', { timeout: 20000 });
      await click('[data-a="postContinue"]');
      continue;
    }
    const adv = page.locator('[data-a="advance"][data-m="week"]');
    if (await adv.count()) await adv.first().click(); else break;
    await page.waitForTimeout(250);
  }
  await shot('14_hub_later');
  await click('[data-a="tab"][data-t="office"]');
  await shot('15_office_later');
  console.log('date now:', await page.locator('.hero-date').count() ? 'hub' : 'other');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
