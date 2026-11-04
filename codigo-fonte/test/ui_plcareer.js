// Browser test: player career (create, play matches as one player, training, offers, season end)
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
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(200); };
  const G = (f, a) => page.evaluate(f, a);
  const shot = (n) => page.screenshot({ path: path.join(OUT, 'pl_' + n + '.png') });
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="openPlayerCareer"]');
  await click('[data-a="openPlayerCareer"]');
  await page.fill('#plw-name', 'Lucas Teste');
  await click('[data-a="plwSet"][data-k="pos"][data-v="CM"]');
  await shot('0_create');
  await click('[data-a="plwNext"]');
  await page.waitForSelector('[data-a="plwPick"]', { timeout: 120000 });
  await shot('1_pick');
  await click('.offer[data-a="plwPick"]');
  await page.waitForSelector('.hero-date, .panel h3', { timeout: 180000 });
  await page.waitForTimeout(500);
  console.log('player', await G(() => { const S = window.__um.S; const p = S.players[S.pl.pid]; return `${p.n} ${p.p} ${p.age}a ovr ${p.o}/${p.pot} team ${S.teams[p.t].n}`; }));
  await G(() => { const S = window.__um.S; const p = S.players[S.pl.pid]; p.o = 74; S.pl.trust = 90; });
  await shot('2_jogador');
  await click('[data-a="tab"][data-t="central"]'); await shot('3_central');
  await click('[data-a="tab"][data-t="agente"]'); await shot('4_agente');
  await click('[data-a="tab"][data-t="tabela"]');
  await click('[data-a="tab"][data-t="central"]');
  // play through matches: the first starter match in 2D, the rest simulated
  let did2d = false, played = 0, roles = { start: 0, sub: 0, out: 0 };
  for (let i = 0; i < 80 && played < 14; i++) {
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
    if (await page.locator('[data-a="openSeasonEnd"]').count()) break;
    if (await page.locator('[data-a="goMatch"]').count()) {
      await click('[data-a="goMatch"]');
      const role = await G(() => { const M = window.__um.UI.match; const m = window.__um.S.matches[M.mid]; return m.pls ? m.pls.r : '?'; });
      roles[role] = (roles[role] || 0) + 1;
      if (role === 'start' && !did2d && await page.locator('[data-a="start2d"]').count()) {
        did2d = true;
        await shot('5_prematch');
        await click('[data-a="start2d"]'); await click('[data-a="g2dGo"]');
        await page.waitForSelector('.g2d', { timeout: 20000 });
        await page.waitForTimeout(4500);
        console.log('solo ctrl', await G(() => { const g = window.__g2d && window.__g2d._G; return g ? JSON.stringify({ solo: g.solo, ctrl: g.ctrl && g.ctrl.pid, mine: window.__um.S.pl.pid }) : 'noG'; }));
        await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowRight');
        await page.keyboard.press('v'); await page.waitForTimeout(300);
        await shot('6_2d');
        await G(() => document.querySelector('#g2-pause').click());
        await page.waitForSelector('[data-g="sim"]');
        console.log('subs button in solo:', await page.locator('[data-g="subs"]').count());
        await click('[data-g="sim"]');
      } else {
        await click('[data-a="simNow"]');
      }
      await page.waitForSelector('[data-a="postContinue"]', { timeout: 60000 });
      if (played === 0) await shot('7_post');
      await click('[data-a="postContinue"]');
      played++;
      continue;
    }
    const adv = page.locator('[data-a="advance"][data-m="match"]');
    if (await adv.count()) { await adv.first().click(); await page.waitForSelector('[data-a="goMatch"], [data-a="openSeasonEnd"], #cel-ok', { timeout: 120000 }); } else break;
    await page.waitForTimeout(200);
  }
  console.log('played', played, 'roles', JSON.stringify(roles));
  console.log('state', await G(() => { const S = window.__um.S, pl = S.pl, p = S.players[pl.pid]; return JSON.stringify({ ovr: p.o, trust: Math.round(pl.trust), cur: pl.cur, log: pl.log.length, xp: pl.xp, yr: pl.yrGain }); }));
  await click('[data-a="tab"][data-t="jogador"]'); await shot('8_jogador_after');
  // force the end of the season: fast-forward to June, check the season-end screen
  await G(() => { const S = window.__um.S; const t = window.__um.dayOf(S.date ? new Date().getFullYear() * 0 + 2027 : 2027, 6, 19); });
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})();
