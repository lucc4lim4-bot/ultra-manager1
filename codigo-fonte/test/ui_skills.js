// Browser test: new player models and the dribble moves (FINTA / GIRO) in the playable match; takes screenshots
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const mobile = process.env.MOBILE === '1';
  const ctx = await browser.newContext(mobile ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 760 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(200); };
  const shot = (n) => page.screenshot({ path: path.join(OUT, (mobile ? 'm_' : '') + 'sk_' + n + '.png') });
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
  await G(() => { window.__g2d._G.slow = 0.12; });
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(900); await shot('02_run_up');
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight'); await page.keyboard.down('Shift'); await page.waitForTimeout(800); await shot('03_run_right');
  await page.keyboard.up('Shift');
  await G(() => { const g = window.__g2d._G; g.ball.owner = g.ctrl; g.ctrl.skCD = 0; g.ctrl.sk = null; }); await page.keyboard.press('i'); await frozen('04_feint_a', 300); await frozen('05_feint_b', 700); await frozen('05b_feint_c', 900);
  console.log('feint active:', await G(() => { const g = window.__g2d._G; return JSON.stringify({ sk: g.ctrl.sk, cd: g.ctrl.skCD, has: g.ball.owner === g.ctrl, st: g.state, hold: g.restartHold, inp: g.input.skill }); }));
  await page.keyboard.up('ArrowRight'); await page.waitForTimeout(900);
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(250);
  await G(() => { const g = window.__g2d._G; g.ball.owner = g.ctrl; g.ctrl.skCD = 0; g.ctrl.sk = null; }); await page.keyboard.press('o'); await frozen('06_spin_a', 300); await frozen('07_spin_b', 800); await frozen('07b_spin_c', 800);
  console.log('spin active:', await G(() => !!window.__g2d._G.ctrl.sk && window.__g2d._G.ctrl.sk.kind));
  await page.keyboard.up('ArrowUp'); await page.waitForTimeout(900);
  // FINTA varies with the stars: 1 star only the plain feint; 5 stars give the whole repertoire
  await G(() => { const g = window.__g2d._G; g.ctrl.stars = 1; g.ctrl.lastFeint = null; g.ball.owner = g.ctrl; g.ctrl.sk = null; g.ctrl.skCD = 0; });
  await page.keyboard.press('i'); await page.waitForTimeout(100);
  console.log('1 star finta kind:', await G(() => { const k = window.__g2d._G.ctrl.sk; return k && k.kind; }));
  const seen = new Set();
  for (let i = 0; i < 40 && seen.size < 5; i++) {
    await G(() => { const g = window.__g2d._G; g.ctrl.stars = 5; g.ball.owner = g.ctrl; g.ctrl.sk = null; g.ctrl.skCD = 0; });
    await page.keyboard.press('i');
    const kind = await G(() => { const k = window.__g2d._G.ctrl.sk; return k ? k.kind : null; });
    if (kind && !seen.has(kind)) { seen.add(kind); await frozen('10_finta_' + kind, 500); } else await page.waitForTimeout(300);
  }
  console.log('finta moves seen:', [...seen].join(','));
  console.log('ESPECIAL pad present:', await G(() => !!document.querySelector('.pad[data-k=special]')));
  await G(() => { const g = window.__g2d._G; g.ball.owner = g.ctrl; g.ctrl.sk = null; });
  await page.keyboard.down('k'); await page.waitForTimeout(2500); await page.keyboard.up('k'); console.log('after k:', await G(() => { const g = window.__g2d._G; return JSON.stringify({ kick: g.ctrl.kickT, has: g.ball.owner === g.ctrl, shot: !!g.ball.shot, slide: g.ctrl.slide }); })); for (let i = 0; i < 12; i++) { const r = await G(() => { const g = window.__g2d._G; return g.ball.last.kickT + ' shot ' + !!g.ball.shot + ' st ' + g.state + ' owner ' + (g.ball.owner === g.ctrl); }); console.log('poll', i, r); if (parseFloat(r) > 0) { await shot('08_kick_a'); break; } await page.waitForTimeout(150); }
  await frozen('08_kick_a2', 250); await frozen('09_kick_b', 250); await frozen('09b_kick_c', 250);
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
