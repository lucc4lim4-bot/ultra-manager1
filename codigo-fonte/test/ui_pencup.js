// Browser test: Copa de Pênaltis: pick a team, play whole cup of shoot-outs with key presses until the cup ends
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const kind = process.env.KIND || 'club';
  const page = await (await browser.newContext(process.env.MOBILE === '1' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };
  const shot = (n) => page.screenshot({ path: path.join(OUT, (process.env.MOBILE === '1' ? 'm_' : '') + 'pc_' + n + '.png') });
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="openPenCup"]');
  await click('[data-a="openPenCup"]');
  await click('[data-a="pcSet"][data-k="size"][data-v="4"]');
  await shot('01_setup');
  await click('[data-a="pcLoad"]');
  await page.waitForSelector('#pc-q', { timeout: 120000 });
  await page.fill('#pc-q', 'Flamengo'); await page.waitForTimeout(300);
  await click('#pc-list [data-a="pcPick"]');
  await shot('02_pick');
  await click('[data-a="pcStart"]');
  await shot('03_bracket');
  let rounds = 0;
  for (let guard = 0; guard < 6; guard++) {
    if (await page.locator('[data-a="pcPlay"]').count() === 0) break;
    await click('[data-a="pcPlay"]');
    await page.waitForSelector('.g2d', { timeout: 20000 });
    rounds++;
    const t0 = Date.now();
    let shotDone = false;
    while (Date.now() - t0 < 150000) {
      if (await page.locator('.g2d').count() === 0) break;
      const st = await page.evaluate(() => window.__g2d && window.__g2d._G ? (window.__g2d._G.pk ? window.__g2d._G.pk.phase : window.__g2d._G.state) : 'none');
      if (st === 'aim') { await page.keyboard.down('ArrowRight'); await page.waitForTimeout(150); await page.keyboard.up('ArrowRight'); await page.keyboard.down('k'); await page.waitForTimeout(500); await page.keyboard.up('k'); }
      else if (st === 'dive') { await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(200); await page.keyboard.up('ArrowLeft'); }
      else if (st === 'shootoutIntro' || st === 'shootoutEnd') { await page.keyboard.press('j'); }
      if (!shotDone && st === 'aim') { shotDone = true; await shot('04_aim_r' + rounds); }
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(500);
    await shot('05_after_r' + rounds);
    console.log('round', rounds, 'ended; banner:', (await page.locator('.panel b').first().innerText().catch(() => '')).slice(0, 80));
  }
  console.log('rounds played:', rounds, '| over screen:', await page.locator('[data-a="pcAgain"]').count() > 0);
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
