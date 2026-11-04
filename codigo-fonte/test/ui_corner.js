// Corners in the playable match: frames of a corner for the user and one for the computer side.
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const tag = process.env.TAG || 'c';
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, tag + '_' + n + '.png') }); };
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(150); };
  const G = (fn, arg) => page.evaluate(fn, arg);
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="newCareer"]', { timeout: 15000 });
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Teste Escanteio');
  await page.fill('#w-fav', 'Santos');
  await click('button[type="submit"]');
  await click('[data-a="wizSet"][data-k="era"][data-v="2026"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizNext"]');
  await click('[data-a="wizSet"][data-k="mode"][data-v="ultra"]');
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
  await click('[data-a="g2dOpt"][data-k="sound"][data-v="false"]');
  await click(`[data-a="g2dOpt"][data-k="cam"][data-v="${process.env.CAM || 'longe'}"]`);
  await click('[data-a="g2dGo"]');
  await page.waitForTimeout(4200);
  const runCorner = async (team, label, keys) => {
    await G(({ team }) => { const g = window.__g2d._G; g.state = 'play'; g.restartHold = false; window.__g2d._setPiece(team, team === 0 ? 67.7 : 0.3, team === 0 ? 0.3 : 104.7, 'corner'); }, { team });
    await page.waitForTimeout(250);
    await shot(label + '0_setup');
    if (keys) { await page.waitForTimeout(700); await keys(); }
    const log = [];
    for (let i = 1; i <= 8; i++) {
      await page.waitForTimeout(260);
      log.push(await G(() => { const g = window.__g2d._G; const b = g.ball; return `${g.state} ball(${b.x.toFixed(1)},${b.y.toFixed(1)},z${b.z.toFixed(1)}) owner=${b.owner ? b.owner.label + '/' + b.owner.team : '-'} shot=${b.shot ? 1 : 0}`; }));
      if (i % 2 === 0) await shot(label + i);
    }
    console.log(label, '\n  ' + log.join('\n  '));
  };
  const waitPlay = async () => { for (let i = 0; i < 80; i++) { if (await G(() => ['play', 'kickoff', 'setpiece'].includes(window.__g2d._G.state))) return; await page.waitForTimeout(250); } };
  await runCorner(0, 'user', async () => { await page.keyboard.down('d'); await page.waitForTimeout(120); await page.keyboard.up('d'); await page.keyboard.press('k'); });
  await waitPlay();
  await runCorner(1, 'cpu', null);
  await waitPlay();
  // a shot at the user's goal: the keeper's dive, frame by frame
  const saveLog = [];
  for (let k = 0; k < 3; k++) {
    await waitPlay();
    await G(({ k }) => {
      const g = window.__g2d._G; const b = g.ball;
      g.state = 'play'; g.restartHold = false;
      const sh = g.players.find((q) => q.team === 1 && !q.gk && !q.out);
      const gk = g.players.find((q) => q.team === 0 && q.gk && !q.out);
      Object.assign(gk, { x: 34, y: 102.5, vx: 0, vy: 0, dv: null, gz: 0, plan: null });
      Object.assign(sh, { x: 30 + k * 4, y: 86 });
      g.players.forEach((q, i) => { if (q !== gk && q !== sh && !q.out) Object.assign(q, { x: 6 + (i % 10) * 6, y: 55 + (i % 3) * 3, vx: 0, vy: 0 }); });
      const tx = 34 + [2.9, -2.6, 1.6][k], ty = 105, sx = sh.x, sy = sh.y + 0.6;
      const d = Math.hypot(tx - sx, ty - sy), v = 24;
      Object.assign(b, { owner: null, x: sx, y: sy, z: 0.1, vx: (tx - sx) / d * v, vy: (ty - sy) / d * v, vz: [1.8, 4.2, 2.6][k], last: sh, lastTeam: 1, passer: null, target: null, curve: 0, cross: null });
      b.shot = { team: 1, by: sh, t: 0, checked: false, beaten: false, force: null };
    }, { k });
    for (let i = 0; i < 9; i++) {
      await page.waitForTimeout(70);
      await shot(`save${k}_${i}`);
      saveLog.push(await G(() => { const g = window.__g2d._G; const gk = g.players.find((q) => q.team === 0 && q.gk); return `${g.state} gk(${gk.x.toFixed(1)},${gk.y.toFixed(1)}) gz ${gk.gz.toFixed(2)} dive ${gk.dv ? gk.dv.t.toFixed(2) : '-'} ball(${g.ball.x.toFixed(1)},${g.ball.y.toFixed(1)},z${g.ball.z.toFixed(1)}) own=${g.ball.owner ? g.ball.owner.label : '-'}`; }));
    }
    await page.waitForTimeout(1500);
  }
  console.log('saves\n  ' + saveLog.join('\n  '));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})();
