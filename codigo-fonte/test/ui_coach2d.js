// Browser test: the user's coach on the touchline in a 2D match
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="openFriendly"]');
  await page.locator('[data-a="openFriendly"]').click();
  await page.locator('[data-a="frLoad"]').click();
  await page.waitForSelector('.any-item', { timeout: 120000 });
  await page.locator('.any-item').nth(0).tap(); await page.locator('.any-item').nth(5).tap();
  await page.locator('[data-a="frPlay"]').click();
  await page.waitForSelector('.g2d .pad[data-k="pass"]');
  await page.waitForTimeout(5000);
  await page.evaluate(() => { const g = window.__g2d._G; g.ball.x = 3; g.ball.y = 52; g.ball.owner = null; g.ball.vx = g.ball.vy = 0; });
  await page.waitForTimeout(900);
  console.log('coach look', await page.evaluate(() => JSON.stringify(window.__um.S.coach.look)));
  await page.screenshot({ path: path.join(OUT, 'coach2d.png') });
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
