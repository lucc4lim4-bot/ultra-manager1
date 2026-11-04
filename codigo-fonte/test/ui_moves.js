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
  await G(() => { const g = window.__g2d._G; g.state = 'play'; g.restartHold = false; g.stateT = 0; const c = g.ctrl; const b = g.ball; c.x = 34; c.y = 60; b.owner = c; });
  await page.waitForTimeout(500);
  await shot('01_idle');

  const shots = async (name, times, slow) => { await G((s) => { window.__g2d._G.slow = s; }, slow); };
  const seq = async (name, n, ms, who) => { for (let i = 0; i < n; i++) { await page.waitForTimeout(ms); await shot(name + i, who); } };
  const mk = (kind, stars) => G(({ kind, stars }) => { const g = window.__g2d._G; g.ctrl.stars = stars; g.ctrl.skCD = 0; g.ctrl.sk = null; g.ball.owner = g.ctrl; g.ctrl.lastFeint = null; }, { kind, stars });
  // --- carretilha
  await G(() => { window.__g2d._G.slow = 0.2; window.__g2d._G.camZoom = 1.5; });
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(300);
  let got = null;
  for (let i = 0; i < 30 && got !== 'roll'; i++) {
    await G(() => { const g = window.__g2d._G; g.ctrl.stars = 2; g.ctrl.skCD = 0; g.ctrl.sk = null; g.ball.owner = g.ctrl; g.ctrl.lastFeint = null; });
    await page.keyboard.press('i');
    got = await G(() => { const k = window.__g2d._G.ctrl.sk; return k && k.kind; });
    if (got !== 'roll') await page.waitForTimeout(150);
  }
  console.log('roll started:', got);
  await seq('roll_', 5, 330);
  await page.keyboard.up('ArrowUp');
  // --- chapéu
  await page.waitForTimeout(500);
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(300);
  got = null;
  for (let i = 0; i < 40 && got !== 'rainbow'; i++) {
    await G(() => { const g = window.__g2d._G; g.ctrl.stars = 5; g.ctrl.skCD = 0; g.ctrl.sk = null; g.ball.owner = g.ctrl; g.ctrl.lastFeint = null; });
    await page.keyboard.press('i');
    got = await G(() => { const k = window.__g2d._G.ctrl.sk; return k && k.kind; });
    if (got !== 'rainbow') await page.waitForTimeout(150);
  }
  console.log('rainbow started:', got);
  await seq('rainbow_', 8, 330);
  console.log('ball z max seen / owner:', await G(() => { const b = window.__g2d._G.ball; return b.z.toFixed(2) + ' ' + !!b.owner; }));
  await page.keyboard.up('ArrowUp');
  await G(() => { window.__g2d._G.slow = 1; });
  // --- TROCAR
  await G(() => { const g = window.__g2d._G; const o = g.players.find((p) => p.team === 1 && !p.gk); g.ball.owner = o; g.ball.x = o.x; g.ball.y = o.y; });
  await page.waitForTimeout(300);
  const before = await G(() => window.__g2d._G.ctrl.pid);
  await page.keyboard.press('q'); await page.waitForTimeout(150);
  const after = await G(() => window.__g2d._G.ctrl.pid);
  console.log('swap q changed player:', before !== after);
  await shot('swap_ring');
  console.log('swap pad exists:', await G(() => !!document.querySelector('.pad.swap')), '| run pad visible (auto):', await G(() => getComputedStyle(document.querySelector('.pad.run')).display));
  // --- slide tackle
  await G(() => { window.__g2d._G.slow = 0.18; const g = window.__g2d._G; const o = g.players.find((p) => p.team === 1 && !p.gk); const c = g.ctrl; o.x = c.x + 3.5; o.y = c.y; g.ball.owner = o; });
  await page.keyboard.down('ArrowRight'); await page.keyboard.down('k'); await page.waitForTimeout(60); await page.keyboard.up('k');
  await seq('slide_', 5, 260);
  await page.keyboard.up('ArrowRight');
  await G(() => { window.__g2d._G.slow = 1; });
  // --- manual run option via the pause menu
  await page.keyboard.press('p'); await page.waitForTimeout(300);
  await click('[data-run="0"]');
  await shot('pause_menu');
  await page.keyboard.press('p'); await page.waitForTimeout(300);
  console.log('manualrun class:', await G(() => document.querySelector('.g2d').classList.contains('manualrun')), '| run pad visible:', await G(() => getComputedStyle(document.querySelector('.pad.run')).display));
  await G(() => { const g = window.__g2d._G; g.ball.owner = null; g.ball.x = g.ctrl.x; g.ball.y = g.ctrl.y - 30; });
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(900);
  console.log('manual: sprint without button:', await G(() => window.__g2d._G.ctrl.sprint));
  await page.keyboard.down('Shift'); await page.waitForTimeout(500);
  console.log('manual: sprint with Shift:', await G(() => window.__g2d._G.ctrl.sprint));
  await page.keyboard.up('Shift'); await page.keyboard.up('ArrowUp');
  // --- goalkeeper dive pose (forced), in stages
  await G(() => { const g = window.__g2d._G; g.slow = 0.3; g.camZoom = 1.5; const k = g.players.find((p) => p.gk && p.team === 0); g.pk = null; k.x = g.ctrl.x + 1; k.y = g.ctrl.y; k.dv = { t: 0, T: 0.36, x0: k.x, x1: k.x + 3, dir: 1, h: 1.4, land: 0.7 }; k.diveDir = 1; k.diveT = 1.06; g.ctrl = k; });
  await seq('gk_', 8, 160, 'ctrl');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
