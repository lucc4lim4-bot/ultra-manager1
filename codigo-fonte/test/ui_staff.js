// Browser test: carretilha / chapéu poses, slide tackle, penalty keeper dive, TROCAR button and manual-run option; takes screenshots
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const mobile = process.env.MOBILE === '1';
  const ctx = await browser.newContext(mobile ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 760 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(200); };
  const shot = async (n, who) => { let clip; if (who !== false) { const p = await page.evaluate((w) => { const g = window.__g2d._G; const t = w === 'gk' ? g.pk && g.pk.gk : g.ctrl; return t ? window.__g2d._scr(t) : null; }, who || 'ctrl'); if (p) clip = { x: Math.min(1020, Math.max(0, p.x - 130)), y: Math.min(500, Math.max(0, p.y - 190)), width: 260, height: 260 }; } await page.screenshot(clip ? { path: path.join(OUT, 'mv_' + n + '.png'), clip } : { path: path.join(OUT, 'mv_' + n + '.png') }); };
  const G = (f) => page.evaluate(f);
  // freeze the game (the loop keeps drawing) to take the picture of a pose, then let it run again
  const frozen = async (n, ms) => { await page.waitForTimeout(ms); console.log(n, await G(() => { const k = window.__g2d._G.ctrl; return k.sk ? k.sk.kind + ' t=' + k.sk.t.toFixed(2) : window.__g2d._G.ball.last.kickT > 0 ? 'kick ' + window.__g2d._G.ball.last.kickT.toFixed(2) : '-'; })); await shot(n); };
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="newCareer"]');
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Teste'); await page.fill('#w-fav', 'Palmeiras');
  await click('button[type="submit"]');
  await click('[data-a="wizSet"][data-k="era"][data-v="2026"]');
  for (let i = 0; i < 2; i++) await click('[data-a="wizNext"]');
  await click('[data-a="wizSet"][data-k="mode"][data-v="normal"]');
  for (let i = 0; i < 2; i++) await click('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 60000 });
  await click('[data-a="pickOffer"]');
  await page.waitForSelector('.hero-date', { timeout: 120000 });
  await click('[data-a="tab"][data-t="central"]');
  for (let i = 0; i < 40; i++) {
    if (await page.locator('[data-a="goMatch"]').count()) break;
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
    const adv = page.locator('[data-a="advance"][data-m="match"]');
    if (await adv.count()) await adv.first().click(); else break;
    await page.waitForTimeout(300);
  }
  await click('[data-a="goMatch"]');
  await click('[data-a="start2d"]');
  await click('[data-a="g2dGo"]');
  await page.waitForTimeout(4200);
  // jump into open play with the ball at the feet of the controlled player
  await G(() => { const g = window.__g2d._G; g.state = 'play'; g.restartHold = false; g.stateT = 0; g.ball.x = 3; g.ball.y = 56; g.ball.owner = null; g.cam.x = 3; g.cam.y = 56; });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'staff1.png') });
  await G(() => { const g = window.__g2d._G; g.ball.x = 30; g.ball.y = 40; });
  console.log('ref', await G(() => { const g = window.__g2d._G; return JSON.stringify([g.ref.x, g.ref.y, g.lines.map((l) => l.y), g.coaches.map((c) => [c.x, c.y])].map((v) => typeof v === 'number' ? Math.round(v) : v)); }));
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(OUT, 'staff2.png') });
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
