// Browser test: fans mood, complaints, random events, Brazilian organised groups (inbox answers, office tab, 2D stands)
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const click = async (s) => { await page.locator(s).first().click(); await page.waitForTimeout(200); };
  const G = (f, a) => page.evaluate(f, a);
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="newCareer"]');
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Renato Teste'); await page.fill('#w-fav', process.env.FAV || 'Corinthians');
  await click('button[type="submit"]');
  await click('[data-a="wizSet"][data-k="era"][data-v="2026"]');
  await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 90000 });
  const nOff = await page.locator('[data-a="pickOffer"]').count();
  const br = page.locator('[data-a="pickOffer"]', { hasText: /Corinthians|Palmeiras|Flamengo|São Paulo|Santos|Vasco|Grêmio|Internacional|Cruzeiro|Fluminense|Botafogo/ });
  console.log('offers', nOff, 'brazilian', await br.count());
  await (await br.count() ? br : page.locator('[data-a="pickOffer"]')).first().click();
  await page.waitForSelector('.hero-date, .panel h3', { timeout: 180000 });
  await page.waitForTimeout(600);
  console.log('team', await G(() => { const S = window.__um.S, t = S.teams[S.user.team]; return t.n + ' ' + t.c + ' orgs=' + JSON.stringify(window.__um.fans.orgs(t.id)); }), 'counts', await G(() => window.__um.fans.counts()));
  // every event builds and every option applies
  const bad = await G(() => { const um = window.__um, S = um.S, bad = []; const [a, b] = um.fans.counts();
    for (let i = 0; i < a + b; i++) { try { const ok = um.fans.send(i % (i < a ? a : b), i >= a); if (!ok) bad.push('null ' + i); } catch (e) { bad.push(i + ':' + e.message); } }
    return bad; });
  console.log('event build errors', JSON.stringify(bad));
  await click('[data-a="tab"][data-t="inbox"]');
  console.log('fan messages', await G(() => window.__um.S.inbox.filter((m) => m.type === 'fan').length), 'buttons', await page.locator('[data-a="fanAns"]').count());
  const before = await G(() => JSON.stringify({ f: window.__um.S.fans.mood, o: window.__um.S.fans.org, c: window.__um.S.board.conf }));
  await page.locator('.msg-item').first().click();
  await click('[data-a="fanAns"][data-i="0"]');
  console.log('answered', await G(() => { const m = window.__um.S.inbox.find((x) => x.type === 'fan' && x.act.done); return m && m.act.res; }), before, await G(() => JSON.stringify({ f: window.__um.S.fans.mood, o: window.__um.S.fans.org, c: window.__um.S.board.conf })));
  await page.screenshot({ path: path.join(OUT, 'fn_1_inbox.png') });
  // answer all with the last option and make sure nothing breaks
  await G(() => { const S = window.__um.S; for (const m of S.inbox) if (m.type === 'fan' && !m.act.done) { const n = m.act.opts.length - 1; } });
  const n = await page.locator('.msg-item').count();
  for (let i = 0; i < Math.min(n, 30); i++) { await page.locator('.msg-item').nth(i).click(); const b = page.locator('[data-a="fanAns"]'); if (await b.count()) await b.last().click(); }
  console.log('pending after', await G(() => window.__um.S.inbox.filter((m) => m.type === 'fan' && !m.act.done).length));
  // mood from results + weekly
  await G(() => { const S = window.__um.S, u = S.user.team; for (let i = 0; i < 5; i++) window.__um.fans.after({ h: u, a: u + 1, hg: 0, ag: 3 }); window.__um.S.inbox = []; S.fans.lastCompl = -99; S.fans.lastOrg = -99; });
  console.log('mood after 5 losses', await G(() => window.__um.S.fans.mood.toFixed(1) + ' org ' + window.__um.S.fans.org.toFixed(1) + ' recent ' + window.__um.S.fans.recent.join('')));
  let got = [];
  for (let i = 0; i < 6; i++) { await G(() => { const S = window.__um.S; S.fans.lastCompl = -99; S.fans.lastOrg = -99; S.fans.lastEv = -99; window.__um.fans.week(); }); }
  console.log('weekly messages', await G(() => window.__um.S.inbox.filter((m) => m.type === 'fan').map((m) => m.subj)));
  await click('[data-a="tab"][data-t="office"]');
  await click('[data-a="subtab"][data-k="fans"]');
  await page.screenshot({ path: path.join(OUT, 'fn_2_tab.png'), fullPage: true });
  console.log('tab text has org', await G(() => document.body.innerText.includes('Gaviões da Fiel')));
  // 2D with the group in the stands (low mood = protest banner)
  await click('[data-a="tab"][data-t="central"]');
  for (let i = 0; i < 80; i++) {
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
    if (await page.locator('[data-a="goMatch"]').count()) break;
    const adv = page.locator('[data-a="advance"]:not([disabled])').first();
    if (await adv.count()) await adv.click(); else await page.waitForTimeout(500);
    await page.waitForTimeout(700);
  }
  await click('[data-a="goMatch"]');
  await click('[data-a="start2d"]'); await click('[data-a="g2dGo"]');
  await page.waitForSelector('.g2d', { timeout: 20000 });
  await page.waitForTimeout(4000);
  console.log('2d orgs', await G(() => JSON.stringify(window.__g2d._G.orgs.map((o) => [o.name, o.top, Math.round(o.mood)])) + ' sup ' + window.__g2d._G.fanSup));
  await page.screenshot({ path: path.join(OUT, 'fn_3_2d_low.png') });
  const shotOrg = async (name, mood, cheer) => {
    await G(([mood, cheer]) => { const G_ = window.__g2d._G; G_.camZoom = 0.4; G_.orgs.forEach((o) => { o.mood = mood; o.cheer = cheer; }); G_.state = 'play'; Object.assign(G_.ball, { x: 34, y: 100, vx: 0, vy: 0 }); G_.cam.x = 34; G_.cam.y = 100; G_.camFreeze = 1; }, [mood, cheer]);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, name) });
  };
  await shotOrg('fn_4_2d_high.png', 85, 4);
  await shotOrg('fn_5_2d_low.png', 15, 0);
  await shotOrg('fn_6_2d_mid.png', 50, 0);
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
