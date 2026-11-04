// Browser test: training drills (penalty / free kick / pass), XP in the player career, look editors, coach on the touchline
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };
  const G = (f, a) => page.evaluate(f, a);
  const openTr = async () => { if (!(await page.locator('#modals [data-a="trStart"]').count())) { await click('[data-a="openMenu"]'); await click('#modals [data-a="openTraining"]'); } };
  const shot = (n) => page.screenshot({ path: path.join(OUT, 'tr_' + n + '.png') });
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="openPlayerCareer"]');
  await click('[data-a="openPlayerCareer"]');
  await page.fill('#plw-name', 'Lucas Treino');
  await click('[data-a="plwSet"][data-k="pos"][data-v="ST"]');
  await click('[data-a="plwNext"]');
  await page.waitForSelector('[data-a="plwPick"]', { timeout: 120000 });
  await click('.offer[data-a="plwPick"]');
  await page.waitForSelector('.hero-date, .panel h3', { timeout: 180000 });
  await page.waitForTimeout(500);
  // ---- look editor (player)
  await click('[data-a="tab"][data-t="jogador"]');
  await click('[data-a="openPlLook"]');
  await click('[data-a="lkSet"][data-k="skin"][data-v="5"]');
  await click('[data-a="lkSet"][data-k="hs"][data-v="6"]');
  await click('[data-a="lkTog"][data-k="beard"]');
  await click('[data-a="lkSet"][data-k="boots"][data-v="#ff5a1f"]');
  await page.fill('#lk-num', '77'); await page.fill('#lk-nick', 'Treino');
  await shot('0_look');
  await click('[data-a="lkSave"]');
  console.log('look', await G(() => { const S = window.__um.S; const p = S.players[S.pl.pid]; return JSON.stringify({ look: S.pl.look, num: p.num, s: p.s }); }));
  // ---- training menu
  const attr0 = await G(() => { const S = window.__um.S; return JSON.stringify(S.players[S.pl.pid].a); });
  await openTr();
  await shot('1_menu');
  if (!process.env.FAST) {
  // penalty drill: 10 kicks (hold CHUTE, release)
  await click('[data-a="trStart"][data-k="pen"]');
  await page.waitForSelector('.g2d.train', { timeout: 20000 });
  const startT = Date.now(); let seenKick = 0;
  for (let i = 0; i < 400; i++) {
    const s = await G(() => { const g = window.__g2d._G; return g ? { st: g.state, ph: g.pk && g.pk.phase, n: g.tr.n, done: g.tr.phase } : null; });
    if (!s) break;
    if (s.st === 'over') break;
    if (s.st === 'penalty' && s.ph === 'aim') {
      await page.keyboard.down('ArrowRight'); await page.keyboard.down('k'); await page.waitForTimeout(450 + Math.random() * 300); await page.keyboard.up('k'); await page.keyboard.up('ArrowRight'); seenKick++;
      await page.waitForTimeout(600);
    } else await page.waitForTimeout(150);
    if (i === 40) await shot('2_pen');
  }
  console.log('pen kicks taken', seenKick, 'secs', Math.round((Date.now() - startT) / 1000));
  await page.waitForSelector('[data-g="trdone"]', { timeout: 15000 });
  console.log('pen result', await G(() => JSON.stringify(window.__g2d._G.trResult)));
  await shot('3_pen_done');
  await click('[data-g="trdone"]');
  await page.waitForTimeout(500);
  console.log('after pen: toast/xp', await G(() => JSON.stringify({ train: window.__um.S.train, dxp: window.__um.S.pl.dxp, drill: window.__um.S.pl.drill, back: !document.querySelector('.g2d') })));
  // free kick drill
  await openTr();
  await click('[data-a="trStart"][data-k="free"]');
  await page.waitForSelector('.g2d.train');
  let shots = 0, lastN = -1;
  for (let i = 0; i < 700; i++) {
    const s = await G(() => { const g = window.__g2d._G; return g ? { st: g.state, n: g.tr.n, ph: g.tr.phase, own: g.ctrl && g.ctrl.pid } : null; });
    if (!s || s.st === 'over') break;
    if (s.ph === 'ready' && s.st !== 'trainWait' && s.n !== lastN + 100) {
      await page.waitForTimeout(1100);
      if (shots === 1) await shot('4_free');
      await page.keyboard.down('k'); await page.waitForTimeout(500 + Math.random() * 300); await page.keyboard.up('k'); shots++;
      lastN = s.n; await page.waitForTimeout(400);
    } else await page.waitForTimeout(120);
  }
  console.log('free kicks taken', shots);
  await page.waitForSelector('[data-g="trdone"]', { timeout: 20000 });
  console.log('free result', await G(() => JSON.stringify(window.__g2d._G.trResult)));
  await click('[data-g="trdone"]');
  }
  // pass drill: send the ball to the target (ok), then to a wrong spot (miss)
  await openTr();
  await click('[data-a="trStart"][data-k="pass"]');
  await page.waitForSelector('.g2d.train');
  let tried = 0;
  for (let i = 0; i < 400; i++) {
    const s = await G(() => { const g = window.__g2d._G; return g ? { st: g.state, n: g.tr.n, ph: g.tr.phase } : null; });
    if (!s || s.st === 'over') break;
    if (s.ph === 'ready' && s.st === 'play') {
      if (s.n === 1) await shot('5_pass');
      const d = await G(() => { const g = window.__g2d._G, t = g.tr, tk = t.taker; return { dx: t.target.x - tk.x, dy: t.target.y - tk.y, land: g.landscape }; });
      // screen input = world rotated in landscape
      const sx = d.land ? -d.dy : d.dx, sy = d.land ? d.dx : d.dy;
      const keys = [];
      const wrong = s.n % 4 === 3; // every 4th: aim the opposite way
      const k = wrong ? -1 : 1;
      if (sx * k > Math.abs(sy) * 0.4) keys.push('ArrowRight'); else if (sx * k < -Math.abs(sy) * 0.4) keys.push('ArrowLeft');
      if (sy * k > Math.abs(sx) * 0.4) keys.push('ArrowDown'); else if (sy * k < -Math.abs(sx) * 0.4) keys.push('ArrowUp');
      for (const kk of keys) await page.keyboard.down(kk);
      await page.waitForTimeout(150);
      await page.keyboard.press('j');
      await page.waitForTimeout(250);
      for (const kk of keys) await page.keyboard.up(kk);
      tried++;
      await page.waitForTimeout(1200);
    } else await page.waitForTimeout(120);
  }
  console.log('passes tried', tried);
  await page.waitForSelector('[data-g="trdone"]', { timeout: 20000 });
  console.log('pass result', await G(() => JSON.stringify(window.__g2d._G.trResult)));
  await click('[data-g="trdone"]');
  console.log('xp state', await G(() => { const S = window.__um.S; return JSON.stringify({ train: S.train, dxp: S.pl.dxp, drill: S.pl.drill }); }));
  // second pen training the same week gives no XP
  await openTr();
  await shot('6_menu_after');
  // weekly tick applies the drill XP
  await click('[data-a="closeModal"]');
  await G(() => { const S = window.__um.S; S.pl.dxp = [0, 6, 0, 0, 0, 0]; window.__um.UI; });
  const before = await G(() => window.__um.S.players[window.__um.S.pl.pid].a[1]);
  await G(() => window.__um.plWeek());
  console.log('attr FIN before/after', before, await G(() => window.__um.S.players[window.__um.S.pl.pid].a[1]), 'dxp', await G(() => JSON.stringify(window.__um.S.pl.dxp)));
  // ---- coach editor
  await G(() => { document.body.insertAdjacentHTML('beforeend', '<button id="tmpc" data-a="openCoachLook"></button>'); document.querySelector('#tmpc').click(); });
  await page.waitForSelector('#lk-name');
  await click('[data-a="lkSet"][data-k="suit"][data-v="#6b2b2b"]'); await click('[data-a="lkTog"][data-k="glasses"]');
  await page.fill('#lk-name', 'Professor Teste'); await page.selectOption('#lk-nat', 'ARG');
  await shot('7_coach');
  await click('[data-a="lkSave"]');
  console.log('coach', await G(() => JSON.stringify({ n: window.__um.S.coach.name, nat: window.__um.S.coach.nat, look: window.__um.S.coach.look })));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
