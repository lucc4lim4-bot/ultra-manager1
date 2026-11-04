// Browser test of the playable 2D match: options, intro, goal + replay, half-time, penalties, shoot-out.
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const mobile = process.env.MOBILE === '1';
const land = process.env.LAND === '1';
(async () => {
  const browser = await chromium.launch();
  const vp = mobile ? (land ? { width: 844, height: 390 } : { width: 390, height: 844 }) : { width: 1366, height: 820 };
  const ctx = await browser.newContext(mobile ? { viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: vp });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const pre = (mobile ? (land ? 'ml_' : 'm_') : '') + 'g2_';
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, pre + n + '.png') }); };
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(150); };
  const G = (fn) => page.evaluate(fn);
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="newCareer"]', { timeout: 15000 });
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Renato Teste');
  await page.fill('#w-fav', 'Corinthians');
  await click('button[type="submit"]');
  await click('[data-a="wizSet"][data-k="era"][data-v="2026"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizSet"][data-k="mode"][data-v="normal"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 60000 });
  await click('[data-a="pickOffer"]');
  await page.waitForSelector('.hero-date', { timeout: 120000 });
  for (let i = 0; i < 60; i++) {
    if (await page.locator('[data-a="goMatch"]').count()) break;
    const adv = page.locator('[data-a="advance"][data-m="match"]');
    if (await adv.count()) await adv.first().click(); else await click('[data-a="advance"]');
    await page.waitForTimeout(300);
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
  }
  await click('[data-a="goMatch"]');
  await click('[data-a="start2d"]');
  await click('[data-a="g2dOpt"][data-k="diff"][data-v="dificil"]');
  await shot('01_options');
  await click('[data-a="g2dGo"]');
  await page.waitForTimeout(900);
  await shot('02_intro');
  await page.keyboard.press('j');
  await page.waitForTimeout(800);
  // play a little: pass, run, through ball
  await page.keyboard.press('j');
  await page.keyboard.down('w'); await page.keyboard.down('Shift'); await page.waitForTimeout(1500); await page.keyboard.up('Shift'); await page.keyboard.up('w');
  await page.keyboard.press('l');
  await page.waitForTimeout(1200);
  await shot('03_play');
  // force a goal for the user after some open play, to see the celebration and the replay
  await G(() => { const g = window.__g2d._G; g.state = 'play'; g.restartHold = false; });
  await page.waitForTimeout(2200);
  const goalOk = await G(() => {
    const g = window.__g2d._G; const b = g.ball;
    const p = g.players.find((q) => q.team === 0 && !q.gk && !q.out);
    if (g.state !== 'play') return 'state ' + g.state;
    Object.assign(b, { owner: null, x: 34 + 1.5, y: 6, z: 0.4, vx: 0, vy: -24, vz: 0, last: p, lastTeam: 0, passer: null, target: null });
    b.shot = { team: 0, by: p, t: 0.6, checked: true, beaten: true, force: null };
    return 'ok ' + g.rec.length;
  });
  console.log('force goal:', goalOk);
  await page.waitForTimeout(700);
  await shot('04_goal');
  await page.waitForTimeout(3300);
  const st1 = await G(() => window.__g2d._G.state);
  console.log('after goal state:', st1);
  await shot('05_replay');
  await page.waitForTimeout(9000);
  console.log('after replay state:', await G(() => window.__g2d._G.state));
  // half-time
  await G(() => { window.__g2d._G.clock = 1e6; });
  await page.waitForTimeout(500);
  await shot('06_halftime');
  await click('[data-g="second"]');
  await page.waitForTimeout(1500);
  // a penalty for the user
  await G(() => { const g = window.__g2d._G; g.state = 'play'; g.restartHold = false; window.__g2d._startPenalty(0); });
  await page.waitForTimeout(600);
  await page.keyboard.down('d'); await page.waitForTimeout(350); await page.keyboard.up('d');
  await page.keyboard.down('k'); await page.waitForTimeout(450);
  await shot('07_pen_aim');
  await page.keyboard.up('k');
  await page.waitForTimeout(700);
  await shot('08_pen_kick');
  await page.waitForTimeout(3500);
  console.log('after user penalty:', await G(() => { const g = window.__g2d._G; return g.state + ' ' + g.st.score.join('-'); }));
  // a penalty against the user: pick a corner
  await G(() => { const g = window.__g2d._G; if (g.state === 'goal' || g.state === 'replay') return; g.state = 'play'; g.restartHold = false; window.__g2d._startPenalty(1); });
  await page.waitForTimeout(300);
  if (await G(() => !!(window.__g2d._G.pk))) {
    await page.keyboard.down('a'); await page.waitForTimeout(300);
    await shot('09_pen_dive');
    await page.keyboard.up('a');
    await page.waitForTimeout(3500);
  }
  console.log('after cpu penalty:', await G(() => { const g = window.__g2d._G; return g.state + ' ' + g.st.score.join('-'); }));
  // knockout tie level at full time: extra time is simulated (kept goalless here) and the shoot-out is played
  for (let i = 0; i < 30 && !['play', 'kickoff', 'setpiece'].includes(await G(() => window.__g2d._G.state)); i++) await page.waitForTimeout(300);
  await G(() => { const g = window.__g2d._G; g.testDecider = true; g.st.score = [1, 1]; g.st.xg = [0.001, 0.001]; g.st.shotRate = [0, 0]; g.st.rate = [0, 0]; g.clock = 1e6; });
  await page.waitForTimeout(600);
  await shot('09b_extra_time');
  console.log('break buttons:', await page.locator('.g2d-pause button').allInnerTexts());
  await click('[data-g="pens"]');
  await page.waitForTimeout(2600);
  let n = 0, shotMid = false;
  while (n++ < 240) {
    const s = await G(() => { const g = window.__g2d._G; return g ? (g.pk ? g.pk.phase : g.state) : 'gone'; });
    if (s === 'gone' || s === 'over') break;
    if (s === 'aim') { await page.keyboard.down(Math.random() < 0.5 ? 'a' : 'd'); await page.waitForTimeout(250); await page.keyboard.up('a'); await page.keyboard.up('d'); await page.keyboard.down('k'); await page.waitForTimeout(500); await page.keyboard.up('k'); }
    else if (s === 'dive') { await page.keyboard.down('a'); await page.waitForTimeout(300); await page.keyboard.up('a'); }
    await page.waitForTimeout(400);
    if (!shotMid && n > 6) { shotMid = true; await shot('10_shootout'); }
  }
  console.log('shoot-out loops', n);
  await page.waitForSelector('[data-a="postContinue"]', { timeout: 60000 });
  await shot('11_post');
  console.log('post score:', await page.locator('.scorebox').first().innerText());
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})();
