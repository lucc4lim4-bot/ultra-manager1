// Browser interaction test: player modal actions, lineup edits, transfers, inbox, office, academy, save/load.
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 820 } });
  const page = await ctx.newPage();
  const errors = [];
  const toasts = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, 'a_' + n + '.png') }); };
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(150); };
  const grabToasts = async () => { const t = await page.locator('.toast').allTextContents(); t.forEach((x) => { if (!toasts.includes(x)) toasts.push(x); }); };
  const step = async (name, fn) => { try { await fn(); await grabToasts(); console.log('ok  ', name); } catch (e) { console.log('FAIL', name, '-', e.message.split('\n')[0]); await shot('fail_' + name.replace(/\W+/g, '_')); } };
  await page.goto('http://localhost:8765/_test.html');
  await page.waitForSelector('[data-a="newCareer"]', { timeout: 15000 });
  await step('new career', async () => {
    await click('[data-a="newCareer"]');
    await page.click('#w-name');
    await page.fill('#w-name', 'Treinador Teste');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    for (let i = 0; i < 4; i++) await click('[data-a="wizNext"]');
    await page.waitForSelector('[data-a="pickOffer"]', { timeout: 60000 });
    await click('[data-a="pickOffer"]');
    await page.waitForSelector('.hero-date', { timeout: 120000 });
  });
  await step('lineup swap + formation', async () => {
    await click('[data-a="tab"][data-t="squad"]');
    const slots = page.locator('[data-a="slotClick"]');
    const n = await slots.count();
    if (n < 2) throw new Error('no slots ' + n);
    await slots.nth(1).click(); await page.waitForTimeout(100);
    await page.locator('[data-a="slotClick"]').nth(n - 1).click(); await page.waitForTimeout(150);
    await page.selectOption('#form-sel', '4-4-2'); await page.waitForTimeout(200);
    await click('[data-a="setMent"][data-v="1"]');
    await click('[data-a="autoXI"]');
    await shot('lineup');
  });
  await step('squad hub player modal: number, transfer list, renew', async () => {
    await click('[data-a="subtab"][data-k="hub"]');
    await page.locator('[data-a="openPlayer"]').first().click(); await page.waitForTimeout(200);
    await shot('player_modal');
    await click('.modal [data-a="pNumber"]');
    await page.fill('#num-in', '77');
    await click('.modal button[type="submit"]');
    await click('.modal [data-a="pTL"]');
    await click('.modal [data-a="pRenew"]');
    await click('.modal [data-a="sendContract"]');
    await shot('renew');
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  });
  await step('transfers search + bid', async () => {
    await click('[data-a="tab"][data-t="transfers"]');
    await click('[data-a="fPos"][data-v="ST"]');
    await page.fill('#f-q', 'Silva'); await page.waitForTimeout(500);
    await click('[data-a="fPage"][data-v="1"]').catch(() => {});
    await page.locator('#search-list [data-a="openPlayer"]').first().click(); await page.waitForTimeout(200);
    const bid = page.locator('.modal [data-a="pBid"]');
    if (await bid.count()) {
      await bid.first().click(); await page.waitForTimeout(150);
      await page.fill('#bid-fee', '1000000');
      await click('.modal [data-a="sendBid"]');
      await shot('bid');
    }
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await click('[data-a="subtab"][data-k="short"]').catch(() => {});
    await click('[data-a="subtab"][data-k="log"]').catch(() => {});
  });
  await step('inbox select/delete/delete all', async () => {
    await click('[data-a="tab"][data-t="inbox"]');
    await page.locator('[data-a="selMsg"]').first().click(); await page.waitForTimeout(120);
    await shot('inbox');
    await click('[data-a="delMsg"]');
    await click('[data-a="askDelAll"]');
    await click('.modal [data-a="delAll"]');
  });
  await step('office: other leagues, team modal, calendar other team, results, cups, gallery, board, jobs, finance', async () => {
    await click('[data-a="tab"][data-t="office"]');
    await click('[data-a="otherLeagues"]');
    await page.locator('.modal [data-a="pickTable"]').nth(1).click(); await page.waitForTimeout(200);
    await page.locator('[data-a="openTeam"]').first().click(); await page.waitForTimeout(200);
    for (const k of ['squad', 'cal', 'xi']) await click(`.modal [data-a="teamTab"][data-k="${k}"]`);
    await shot('team_modal');
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    const subs = await page.locator('.subtabs [data-a="subtab"]').allTextContents();
    for (let i = 1; i < subs.length; i++) {
      await page.locator('.subtabs [data-a="subtab"]').nth(i).click(); await page.waitForTimeout(200);
      if (subs[i].includes('Calend')) {
        await click('[data-a="calOther"]');
        await page.locator('.modal [data-a="calPickTeam"]').nth(2).click(); await page.waitForTimeout(150);
        await shot('cal_other');
      }
    }
  });
  await step('academy: hire and send scout', async () => {
    await click('[data-a="tab"][data-t="academy"]');
    const subs = page.locator('.subtabs [data-a="subtab"]');
    if (await subs.count()) await subs.nth(0).click();
    const hire = page.locator('[data-a="hireScout"]');
    if (await hire.count()) await hire.first().click();
    await page.waitForTimeout(150);
    const send = page.locator('[data-a="sendScout"]');
    if (await send.count()) await send.first().click();
    await shot('academy');
  });
  await step('advance 2 weeks', async () => {
    await click('[data-a="tab"][data-t="central"]');
    for (let i = 0; i < 2; i++) { const b = page.locator('[data-a="advance"][data-m="week"]'); if (await b.count()) await b.first().click(); await page.waitForTimeout(400); }
  });
  await step('save, exit, continue', async () => {
    await click('[data-a="openMenu"]');
    await click('.modal [data-a="manualSave"]');
    await click('[data-a="openMenu"]');
    await click('.modal [data-a="exitToStart"]');
    await page.waitForSelector('[data-a="openSaves"]', { timeout: 10000 });
    await click('[data-a="openSaves"]');
    await click('.modal [data-a="loadSave"]');
    await page.waitForSelector('.hero-date', { timeout: 20000 });
    await shot('reloaded');
  });
  await step('store modal', async () => {
    await click('[data-a="openMenu"]');
    await click('.modal [data-a="openStoreInGame"]');
    await page.fill('#store-q', 'flam'); await page.waitForTimeout(250);
    await shot('store');
    await page.keyboard.press('Escape');
  });
  console.log('toasts:', toasts.join(' | '));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
