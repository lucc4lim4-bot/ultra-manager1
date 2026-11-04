// Browser test: kit editor (2D shirt pattern) and player swaps in transfers
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const click = async (s) => { await page.locator(s).first().click(); await page.waitForTimeout(250); };
  const G = (f, a) => page.evaluate(f, a);
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="newCareer"]');
  await click('[data-a="newCareer"]');
  await page.fill('#w-name', 'Renato Teste'); await page.fill('#w-fav', 'Corinthians');
  await click('button[type="submit"]');
  await click('[data-a="wizSet"][data-k="era"][data-v="2026"]');
  for (let i = 0; i < 4; i++) await click('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 90000 });
  await click('[data-a="pickOffer"]');
  await page.waitForSelector('.hero-date, .panel h3', { timeout: 180000 });
  await page.waitForTimeout(600);
  // ---- swap (engine)
  const info = await G(() => {
    const um = window.__um, S = um.S, ut = S.teams[S.user.team];
    const mine = ut.sq.map((id) => S.players[id]).sort((a, b) => b.o - a.o);
    const other = Object.values(S.teams).find((t) => t.id !== ut.id && !t.isNat && t.sq.length > 20 && t.budget > 5e7);
    const target = other.sq.map((id) => S.players[id]).sort((a, b) => b.o - a.o)[3];
    return { me: ut.id, mineIds: mine.slice(5, 8).map((p) => p.id), target: target.id, tn: target.n, from: other.id, value: um.tr.swapValue(mine[5].id) };
  });
  console.log('swap setup', JSON.stringify(info));
  console.log('swap total', await G((i) => window.__um.tr.swapTotal(i.mineIds), info));
  console.log('club answer cash only 10%', JSON.stringify(await G((i) => window.__um.tr.resp(i.target, 1e6), info)));
  const before = await G((i) => { const S = window.__um.S; return { sq: S.teams[i.me].sq.length, b: S.teams[i.me].budget, inTarget: S.teams[i.from].sq.length }; }, info);
  const res = await G((i) => window.__um.tr.sign(i.target, 0, i.mineIds), info);
  console.log('sign with swap', JSON.stringify(res));
  console.log('after', await G((i) => { const S = window.__um.S; return JSON.stringify({ tgtNow: S.players[i.target].t === i.me, outNow: i.mineIds.map((id) => S.players[id].t === i.from), sq: S.teams[i.me].sq.length, fromSq: S.teams[i.from].sq.length }); }, info), JSON.stringify(before));
  // AI swap offers
  console.log('ai swap offers', await G(() => window.__um.tr.offers()));
  const sw = await G(() => { const S = window.__um.S; const o = S.tr.offers.find((x) => x.swap && x.status === 'open'); return o ? { id: o.id, p: S.players[o.pid].n, q: S.players[o.swap].n, cash: o.cash, from: o.from, pid: o.pid, swap: o.swap } : null; });
  console.log('open swap offer', JSON.stringify(sw));
  if (sw) {
    await click('[data-a="tab"][data-t="transfers"]');
    await click('[data-a="subtab"][data-k="offers"]');
    await page.screenshot({ path: path.join(OUT, 'ks_1_offers.png'), fullPage: true });
    const r = await G((id) => window.__um.tr.respond(id, 'accept'), sw.id);
    console.log('accept swap ->', JSON.stringify(r), await G((s) => { const S = window.__um.S; return S.players[s.pid].t === s.from && S.players[s.swap].t === S.user.team; }, sw));
  }
  // bid modal with swap selection
  const tgt = await G((i) => { const S = window.__um.S; const t = S.teams[i.from]; const q = t.sq.map((id) => S.players[id]).sort((a, b) => b.o - a.o)[6]; return q.id; }, info);
  await G((id) => { window.__um.UI.openBid = id; }, tgt);
  await page.evaluate((id) => { const el = document.createElement('button'); el.dataset.a = 'pBid'; el.dataset.id = id; el.id = 'tmpbid'; document.body.appendChild(el); }, tgt);
  await click('#tmpbid');
  console.log('bid modal swap rows', await page.locator('#modals [data-a="bidSwap"]').count());
  await page.locator('#modals [data-a="bidSwap"]').nth(2).check(); await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, 'ks_2_bid.png') });
  await click('#modals [data-a="sendBid"]');
  console.log('bid reply', await page.locator('#modals .panel').last().innerText().catch(() => ''));
  await page.screenshot({ path: path.join(OUT, 'ks_3_bidreply.png') });
  await G(() => document.querySelectorAll('#modals [data-a="closeModal"]').forEach((b) => b.click()));
  // ---- kit editor
  await click('[data-a="openMenu"]');
  await click('#modals [data-a="openKit"]');
  await click('#modals [data-a="kitPat"][data-v="2"]');
  await page.evaluate(() => { const el = document.querySelector('#modals [data-a="kitCol"][data-k="shirt"]'); el.value = '#0b6e3c'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.evaluate(() => { const el = document.querySelector('#modals [data-a="kitCol"][data-k="trim"]'); el.value = '#ffd400'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.screenshot({ path: path.join(OUT, 'ks_4_kit.png') });
  await click('#modals [data-a="kitSave"]');
  console.log('kit saved', await G(() => { const S = window.__um.S; return JSON.stringify(S.kits[S.user.team].home); }));
  await G(() => { const S = window.__um.S, k = S.kits[S.user.team]; k.away = Object.assign({}, k.home); });
  // 2D with the kit
  await click('[data-a="tab"][data-t="central"]');
  for (let i = 0; i < 80; i++) {
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
    if (await page.locator('[data-a="goMatch"]').count()) break;
    const adv = page.locator('[data-a="advance"]:not([disabled])').first();
    if (await adv.count()) await adv.click(); else await page.waitForTimeout(500);
    await page.waitForTimeout(700);
  }
  await click('[data-a="goMatch"]'); await click('[data-a="start2d"]'); await click('[data-a="g2dGo"]');
  await page.waitForSelector('.g2d', { timeout: 20000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(OUT, 'ks_5_2d.png') });
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
