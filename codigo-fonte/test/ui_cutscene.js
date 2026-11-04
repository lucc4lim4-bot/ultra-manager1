// Browser test: kit editor (2D shirt pattern) and player swaps in transfers
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const click = async (s) => { await page.locator(s).first().click(); await page.waitForTimeout(250); };
  const G = (f, a) => page.evaluate(f, a);
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="newCareer"]');
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Renato Teste'); await page.fill('#w-fav', 'Corinthians');
  await click('button[type="submit"]');
  await click('[data-a="wizSet"][data-k="era"][data-v="2026"]');
  for (let i = 0; i < 4; i++) await click('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 90000 });
  await click('[data-a="pickOffer"]');
  await page.waitForSelector('.hero-date, .panel h3', { timeout: 180000 });
  await page.waitForTimeout(600);
  // ---- swap (engine)
  await G(() => { const U = window.__um, S = U.S; S.celebrate = [{ key: 'LIB', name: 'Copa Libertadores', season: '2026', team: S.user.team, teamN: S.teams[S.user.team].n, coins: 100, d: S.date }]; U.render(); });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/shots/cut1.png' });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: '/tmp/shots/cut2.png' });
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
