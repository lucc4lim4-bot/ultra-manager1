// Browser test: sponsorship (stadium naming rights, shirt sponsor, monthly payments, win bonus, perks, 2D shirt text)
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
  await page.fill('#w-name', 'Renato Teste'); await page.fill('#w-fav', 'Corinthians');
  await click('button[type="submit"]');
  await click('[data-a="wizSet"][data-k="era"][data-v="2026"]');
  await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]'); await click('[data-a="wizNext"]');
  await page.waitForSelector('[data-a="pickOffer"]', { timeout: 90000 });
  await click('[data-a="pickOffer"]');
  await page.waitForSelector('.hero-date, .panel h3', { timeout: 180000 });
  await page.waitForTimeout(600);
  await click('[data-a="tab"][data-t="office"]');
  await click('[data-a="subtab"][data-k="spons"]');
  console.log('offers', await G(() => JSON.stringify(window.__um.S.spons.offers.shirt.map((o) => [o.b, o.yrs, o.perYear, o.signing, o.winBonus]))));
  await page.screenshot({ path: path.join(OUT, 'sp_1_offers.png'), fullPage: true });
  const bud = () => G(() => { const S = window.__um.S; return S.teams[S.user.team].budget; });
  const b0 = await bud();
  await click('[data-a="spSign"][data-slot="shirt"]');
  await click('[data-a="spSign"][data-slot="std"]');
  const b1 = await bud();
  console.log('signing bonus in budget', ((b1 - b0) / 1e6).toFixed(2), 'M', await G(() => JSON.stringify({ shirt: window.__um.S.spons.shirt, std: window.__um.S.spons.std && window.__um.S.spons.std.name })));
  console.log('stadium name helper', await G(() => { const S = window.__um.S; return S.teams[S.user.team].std + ' -> ' + document.body.innerText.includes(S.spons.std.name); }));
  await page.screenshot({ path: path.join(OUT, 'sp_2_signed.png'), fullPage: true });
  // catalogue of 1000 brands with logos
  await click('[data-a="spCat"]');
  console.log('catalogue', await G(() => ({ total: window.__um.sp.count(), cards: document.querySelectorAll('#modals svg').length, text: document.querySelector('#modals .muted').textContent })));
  await page.screenshot({ path: path.join(OUT, 'sp_4_cat.png') });
  await page.fill('#spc-q', 'banco');
  console.log('search banco ->', await G(() => document.querySelectorAll('#modals .panel').length), await page.locator('#modals .muted').nth(0).textContent());
  await page.fill('#spc-q', ''); await click('[data-a="spcPerk"][data-v="energy"]');
  await click('[data-a="spcPage"][data-d="1"]');
  console.log('energy filter p2', await page.locator('#modals .muted').nth(0).textContent());
  await click('#modals [data-a="closeModal"]');
  // monthly installments and the win bonus
  const pm = await bud();
  await G(() => window.__um.sp.month());
  const pm2 = await bud();
  console.log('monthly pay', ((pm2 - pm) / 1e6).toFixed(3), 'M', 'expected', await G(() => { const s = window.__um.S.spons; return ((s.std.perYear + s.shirt.perYear) / 12 / 1e6).toFixed(3); }));
  await G(() => { const S = window.__um.S, u = S.user.team; window.__um.sp.after({ h: u, a: u + 1, hg: 2, ag: 0 }); });
  console.log('win bonus', (((await bud()) - pm2) / 1e6).toFixed(3), 'M expected', await G(() => (window.__um.S.spons.shirt.winBonus / 1e6).toFixed(3)));
  await G(() => { const S = window.__um.S, u = S.user.team; window.__um.sp.after({ h: u, a: u + 1, hg: 0, ag: 1 }); });
  console.log('perk', await G(() => window.__um.sp.perk()), 'rating bonus', await G(() => window.__um.sp.bonus(window.__um.S.user.team)));
  // rescind
  await click('[data-a="spBreak"][data-slot="shirt"]'); await click('[data-a="spBreakOk"]');
  console.log('after rescind: shirt', await G(() => window.__um.S.spons.shirt), 'offers', await G(() => window.__um.S.spons.offers.shirt.length));
  await click('[data-a="spSign"][data-slot="shirt"]');
  // expiry
  await G(() => { const S = window.__um.S; S.spons.shirt.end = S.date - 1; S.spons.std.end = S.date - 1; window.__um.sp.month(); });
  console.log('after expiry', await G(() => { const s = window.__um.S.spons; return JSON.stringify({ shirt: s.shirt, std: s.std, offers: [s.offers.shirt.length, s.offers.std.length], hist: s.hist.length }); }));
  // sign again and play a 2D match: sponsor on the shirt
  await click('[data-a="subtab"][data-k="spons"]');
  await click('[data-a="spSign"][data-slot="shirt"]'); await click('[data-a="spSign"][data-slot="std"]');
  await click('[data-a="tab"][data-t="central"]');
  for (let i = 0; i < 80; i++) {
    if (await page.locator('#cel-ok').count()) await click('#cel-ok');
    if (await page.locator('[data-a="goMatch"]').count()) break;
    const adv = page.locator('[data-a="advance"]:not([disabled])').first();
    if (await adv.count()) await adv.click(); else await page.waitForTimeout(500);
    await page.waitForTimeout(700);
  }
  await click('[data-a="goMatch"]');
  console.log('prematch stadium', await G(() => document.body.innerText.includes(window.__um.S.spons.std.name)));
  await click('[data-a="start2d"]'); await click('[data-a="g2dGo"]');
  await page.waitForSelector('.g2d', { timeout: 20000 });
  await page.waitForTimeout(6000);
  console.log('2d tags', await G(() => JSON.stringify({ tag: window.__g2d._G.spTag, perk: window.__g2d._G.spPerk })));
  await page.screenshot({ path: path.join(OUT, 'sp_3_2d.png') });
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
