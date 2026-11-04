// Sul-Americana and Mundial de Clubes in the interface: a Brazilian club in "ligas normais", calendar moved on directly.
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, 'cont_' + n + '.png'), fullPage: !!process.env.FULL }); };
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(120); };
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="newCareer"]', { timeout: 15000 });
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Teste Continental');
  await page.keyboard.press('Enter');
  await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]');
  await click('[data-a="wizSet"][data-k="mode"][data-v="normal"]');
  await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]');
  await page.waitForSelector('.offer[data-a="pickOffer"]', { timeout: 60000 });
  // the Brazilian offer
  const n = await page.locator('.offer[data-a="pickOffer"]').count();
  let picked = false;
  for (let i = 0; i < n && !picked; i++) {
    const t = await page.locator('.offer[data-a="pickOffer"]').nth(i).innerText();
    if (/Brasileir/.test(t)) { await page.locator('.offer[data-a="pickOffer"]').nth(i).click(); picked = true; }
  }
  await page.waitForSelector('.hero-date', { timeout: 180000 });
  const go = async (y, m, d) => page.evaluate(([y, m, d]) => { const u = window.__um; u.fastForward(u.dayOf(y, m, d)); u.render(); }, [y, m, d]);
  await go(2026, 7, 20);
  await click('[data-a="tab"][data-t="office"]');
  await click('[data-a="subtab"][data-k="table"]');
  await shot('01_table_bra');
  await click('[data-a="subtab"][data-k="cups"]');
  const opts = await page.locator('select[data-a="cupSel"] option').allInnerTexts();
  console.log('cups:', opts.join(' | '));
  const sula = await page.locator('select[data-a="cupSel"] option', { hasText: 'Sul-Americana' }).first().getAttribute('value');
  await page.selectOption('select[data-a="cupSel"]', sula);
  await page.waitForTimeout(200);
  await shot('02_sula');
  await go(2026, 12, 13);
  await click('[data-a="tab"][data-t="office"]');
  await click('[data-a="subtab"][data-k="cups"]');
  const mun = await page.locator('select[data-a="cupSel"] option', { hasText: 'Mundial' }).first().getAttribute('value').catch(() => null);
  console.log('mundial option', mun);
  if (mun) { await page.selectOption('select[data-a="cupSel"]', mun); await page.waitForTimeout(200); await shot('03_mundial'); }
  await go(2026, 12, 20);
  await click('[data-a="tab"][data-t="office"]');
  await click('[data-a="subtab"][data-k="gallery"]');
  await shot('04_gallery');
  await click('[data-a="tab"][data-t="central"]').catch(() => {});
  await shot('05_central');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
