// Browser test on iPad screen sizes (portrait and landscape, touch): start screen, hub, calendar, 2D match with the
// on-screen controls. PW_DEVICE picks the Playwright device profile (default iPad (gen 11)).
const pw = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const name = process.env.PW_DEVICE || 'iPad (gen 11)';
  const dev = pw.devices[name];
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({ ...dev, defaultBrowserType: undefined });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const tag = name.includes('landscape') ? 'ipad_l_' : 'ipad_p_';
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, tag + n + '.png') }); };
  const tap = async (sel) => { await page.locator(sel).first().tap(); await page.waitForTimeout(200); };
  console.log('device', name, JSON.stringify(dev.viewport), 'touch', dev.hasTouch);
  await page.goto('http://localhost:8765/_test.html');
  await page.waitForSelector('[data-a="newCareer"]', { timeout: 15000 });
  console.log('pointer coarse:', await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'hover none:', await page.evaluate(() => matchMedia('(hover: none)').matches));
  await shot('01_start');
  await tap('[data-a="newCareer"]');
  await page.fill('#w-name', 'Teste iPad');
  await page.fill('#w-fav', 'Flamengo');
  await tap('button[type="submit"]');
  await tap('[data-a="wizSet"][data-k="era"][data-v="2026"]');
  await tap('[data-a="wizNext"]');
  await tap('[data-a="wizNext"]');
  await tap('[data-a="wizNext"]');
  await tap('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 60000 });
  await shot('02_offers');
  await tap('[data-a="pickOffer"]');
  await page.waitForSelector('.hero-date', { timeout: 120000 });
  await shot('03_hub');
  await tap('[data-a="simToCal"]');
  await shot('04_calendar');
  await tap('[data-a="tab"][data-t="central"]');
  // to the first match day and into the 2D match
  for (let i = 0; i < 40; i++) {
    if (await page.locator('[data-a="goMatch"]').count()) break;
    if (await page.locator('#cel-ok').count()) await tap('#cel-ok');
    const adv = page.locator('[data-a="advance"][data-m="match"]');
    if (await adv.count()) await adv.first().tap(); else break;
    await page.waitForTimeout(400);
  }
  await tap('[data-a="goMatch"]');
  await shot('05_prematch');
  await tap('[data-a="start2d"]');
  await shot('06_play_setup');
  await tap('[data-a="g2dGo"]');
  await page.waitForTimeout(2500);
  const ctl = await page.evaluate(() => { const j = document.querySelector('.g2d .joy'), p = document.querySelector('.g2d .pads'); const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0; return { joy: vis(j), pads: vis(p) }; });
  console.log('touch controls visible:', JSON.stringify(ctl));
  // use the joystick and the pads with touch
  const joy = await page.locator('.g2d .joy').boundingBox();
  if (joy) {
    const cx = joy.x + joy.width / 2, cy = joy.y + joy.height / 2;
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
    for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + k * 5, y: cy - k * 3, id: 1 }] }); await page.waitForTimeout(80); }
    await page.waitForTimeout(600);
    await shot('07_game_joystick');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await tap('.g2d .pad.pass');
  await page.waitForTimeout(1500);
  await shot('08_game_play');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
