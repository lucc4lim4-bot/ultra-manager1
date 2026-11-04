// Browser test: player career, a whole season fast-forwarded: weekly training, season-end screen, offers, new club, retirement
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };
  const G = (f, a) => page.evaluate(f, a);
  const shot = (n) => page.screenshot({ path: path.join(OUT, 'ps_' + n + '.png') });
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="openPlayerCareer"]');
  await click('[data-a="openPlayerCareer"]');
  await page.fill('#plw-name', 'Ana Teste');
  await click('[data-a="plwSet"][data-k="pos"][data-v="ST"]');
  await click('[data-a="plwNext"]');
  await page.waitForSelector('[data-a="plwPick"]', { timeout: 120000 });
  await click('.offer[data-a="plwPick"]');
  await page.waitForSelector('.hero-date, .panel h3', { timeout: 180000 });
  const info = () => G(() => { const S = window.__um.S, pl = S.pl, p = S.players[pl.pid]; return JSON.stringify({ d: window.__um.S.date, ovr: p.o, age: p.age, team: S.teams[p.t].n, user: S.teams[S.user.team].n, ct: p.ct, trust: Math.round(pl.trust), cur: [pl.cur.a, pl.cur.s, pl.cur.g], yr: pl.yrGain, pend: !!S.pendingEnd, offers: pl.offers.length }); });
  console.log('start', await info());
  await click('[data-a="tab"][data-t="central"]');
  // advance weeks via the UI until the season end shows up (matches simulated through the match screen)
  let n = 0;
  for (let i = 0; i < 400 && n < 400; i++) {
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
    if (await page.locator('[data-a="openSeasonEnd"]').count()) break;
    if (await page.locator('[data-a="goMatch"]').count()) { await click('[data-a="goMatch"]'); await click('[data-a="simNow"]'); await page.waitForSelector('[data-a="postContinue"], [data-a="pensSim"]', { timeout: 60000 }); if (await page.locator('[data-a="pensSim"]').count()) await click('[data-a="pensSim"]'); await page.waitForSelector('[data-a="postContinue"]', { timeout: 60000 }); await click('[data-a="postContinue"]'); n++; continue; }
    const adv = page.locator('[data-a="advance"][data-m="match"]');
    if (!(await adv.count())) { console.log('no advance'); break; }
    await adv.first().click();
    await page.waitForSelector('[data-a="goMatch"], [data-a="openSeasonEnd"], #cel-ok', { timeout: 120000 });
  }
  console.log('matches', n, await info());
  if (!(await page.locator('[data-a="plEndStay"], [data-a="plEndPick"], [data-a="plEndRenew"]').count())) await click('[data-a="openSeasonEnd"]');
  await page.waitForSelector('.modal, [data-a="plEndStay"], [data-a="plEndPick"]', { timeout: 10000 });
  await page.waitForTimeout(400);
  await shot('2_seasonend');
  const hasOffer = await page.locator('[data-a="plEndPick"]').count();
  console.log('offers in modal', hasOffer, 'renew', await page.locator('[data-a="plEndRenew"]').count());
  if (hasOffer) await click('[data-a="plEndPick"]'); else if (await page.locator('[data-a="plEndRenew"]').count()) await click('[data-a="plEndRenew"]'); else await click('[data-a="plEndStay"]');
  await page.waitForTimeout(600);
  console.log('after choice', await info());
  // next season starts: advance past July 1 and play a few matches
  for (let i = 0; i < 30; i++) {
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
    if (await page.locator('[data-a="goMatch"]').count()) { await click('[data-a="goMatch"]'); await click('[data-a="simNow"]'); await page.waitForSelector('[data-a="postContinue"], [data-a="pensSim"]', { timeout: 60000 }); if (await page.locator('[data-a="pensSim"]').count()) await click('[data-a="pensSim"]'); await page.waitForSelector('[data-a="postContinue"]', { timeout: 60000 }); await click('[data-a="postContinue"]'); if (i > 6) break; continue; }
    const adv = page.locator('[data-a="advance"][data-m="match"]');
    if (!(await adv.count())) break;
    await adv.first().click();
    await page.waitForSelector('[data-a="goMatch"], [data-a="openSeasonEnd"], #cel-ok', { timeout: 120000 });
  }
  console.log('next season', await info(), await page.locator('[data-a="advance"]').count(), await page.locator('[data-a="openSeasonEnd"]').count());
  for (let k = 0; k < 6; k++) { const w = page.locator('[data-a="advance"][data-m="week"]'); if (!(await w.count())) break; await w.first().click(); await page.waitForTimeout(1500); }
  console.log('after weeks', await info());
  await click('[data-a="tab"][data-t="jogador"]'); await shot('3_jogador2');
  await click('[data-a="tab"][data-t="agente"]'); await shot('4_agente');
  await G(() => { const S = window.__um.S; S.players[S.pl.pid].age = 31; });
  await G(() => window.__um.render());
  await click('[data-a="plRetireAsk"]'); await click('[data-a="plRetireOk"]');
  await page.waitForTimeout(400); await shot('5_end');
  console.log('ended', await G(() => !!window.__um.S.pl.ended));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})();
