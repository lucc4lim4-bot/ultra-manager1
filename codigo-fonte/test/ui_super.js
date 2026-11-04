// Browser test: SUPER CHUTE button (separate from CHUTE): charge, sweet spot, speed, stamina cost, cooldown, layout
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
  const G = (f, a) => page.evaluate(f, a);
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="openFriendly"]');
  await page.locator('[data-a="openFriendly"]').click();
  await page.locator('[data-a="frLoad"]').click();
  await page.waitForSelector('.any-item', { timeout: 120000 });
  await page.locator('.any-item').nth(0).tap(); await page.locator('.any-item').nth(5).tap();
  await page.locator('[data-a="frPlay"]').click();
  await page.waitForSelector('.g2d .pad[data-k="super"]');
  const vis = await G(() => { const e = document.querySelector('.pad.super'); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), shown: !!e.offsetParent, txt: e.textContent }; });
  console.log('super button', JSON.stringify(vis));
  await page.waitForTimeout(5000);
  const place = () => G(() => { const g = window.__g2d._G, c = g.ctrl, b = g.ball; for (const p of g.players) { if (p !== c) { p.x = p.team === 0 ? 10 : 58; p.y = 70; } } g.state = 'play'; g.restartHold = false; c.x = 34; c.y = 30; c.sta = 1; c.supCD = 0; c.dx = 0; c.dy = -1; b.owner = c; b.x = 34; b.y = 30; b.z = 0; b.vx = b.vy = b.vz = 0; return 1; });
  const shootNorm = async (hold) => { await place(); await page.keyboard.down('u'); await page.waitForTimeout(hold); const mid = await G(() => window.__g2d._G.input.supHold); await page.keyboard.up('u'); await page.waitForTimeout(60); return { mid, v: await G(() => { const b = window.__g2d._G.ball; return { sp: Math.hypot(b.vx, b.vy), sup: !!(b.shot && b.shot.sup), sta: window.__g2d._G.ctrl.sta, cd: window.__g2d._G.ctrl.supCD }; }) }; };
  console.log('sweet 700ms', JSON.stringify(await shootNorm(700)));
  await page.screenshot({ path: path.join(OUT, 'super_1.png') });
  // normal shot for comparison
  await place(); await page.keyboard.down('k'); await page.waitForTimeout(700); await page.keyboard.up('k'); await page.waitForTimeout(60);
  console.log('normal shot speed', await G(() => { const b = window.__g2d._G.ball; return Math.hypot(b.vx, b.vy).toFixed(1); }));
  // cooldown: a second super at once is refused
  await place(); await G(() => { window.__g2d._G.ctrl.supCD = 5; }); await page.keyboard.down('u'); await page.waitForTimeout(300); await page.keyboard.up('u'); await page.waitForTimeout(60);
  console.log('cooldown blocks', await G(() => { const g = window.__g2d._G; return JSON.stringify({ sup: !!(g.ball.shot && g.ball.shot.sup), owner: g.ball.owner === g.ctrl, hint: document.querySelector('#g2-hint').textContent }); }));
  // low stamina refuses
  await place(); await G(() => { window.__g2d._G.ctrl.sta = 0.1; }); await page.keyboard.down('u'); await page.waitForTimeout(300); await page.keyboard.up('u'); await page.waitForTimeout(60);
  console.log('stamina blocks', await G(() => { const g = window.__g2d._G; return JSON.stringify({ sup: !!(g.ball.shot && g.ball.shot.sup), hint: document.querySelector('#g2-hint').textContent }); }));
  // touch: tap-and-hold on the pad
  await place();
  const box = await page.locator('.pad.super').boundingBox();
  await page.touchscreen.tap(box.x + 5, box.y + 5);
  console.log('tap quick -> shot made', await G(() => !!window.__g2d._G.ball.shot));
  // many super shots: speed vs normal, and some goals
  let sumS = 0, n = 0, goals = 0;
  for (let i = 0; i < 12; i++) {
    await place(); await page.keyboard.down('u'); await page.waitForTimeout(650); await page.keyboard.up('u'); await page.waitForTimeout(40);
    sumS += await G(() => Math.hypot(window.__g2d._G.ball.vx, window.__g2d._G.ball.vy)); n++;
    await page.waitForTimeout(1600);
    goals += await G(() => { const g = window.__g2d._G; return g.st.score[0] > (window.__sc || 0) ? (window.__sc = g.st.score[0], 1) : 0; });
  }
  console.log('avg super speed', (sumS / n).toFixed(1), 'goals of 12', goals);
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
