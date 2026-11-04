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
  // ---- tactics presets in the squad screen
  await click('[data-a="tab"][data-t="squad"]');
  await page.waitForTimeout(400);
  console.log('squad subtabs', await G(() => [...document.querySelectorAll('.subtabs button')].map((b) => b.textContent.trim()).join(' | ')));
  const hasSel = await page.locator('#sty-sel').count();
  console.log('style select present', hasSel);
  if (!hasSel) { const b = page.locator('.subtabs button', { hasText: 'Escala' }); if (await b.count()) await b.first().click(); await page.waitForTimeout(300); }
  console.log('ment buttons', await G(() => document.querySelectorAll('[data-a="setMent"]').length));
  await page.selectOption('#form-sel', '4-2-2-2'); await page.waitForTimeout(200);
  await click('[data-a="setMent"][data-v="2"]');
  await page.selectOption('#sty-sel', 'counter'); await page.waitForTimeout(200);
  await page.locator('summary', { hasText: 'Táticas prontas' }).click();
  await page.fill('#tp-name', 'Contra 4-2-2-2'); await click('[data-a="tpSave"]');
  await page.selectOption('#form-sel', '5-2-3'); await click('[data-a="setMent"][data-v="-2"]');
  await page.fill('#tp-name', 'Retranca 5-2-3'); await click('[data-a="tpSave"]');
  console.log('presets', await G(() => JSON.stringify(window.__um.tac.presets().map((q) => [q.name, q.form, q.ment, q.sty, q.xi.length]))));
  await click('[data-a="tpUse"][data-id="1"]');
  console.log('after activate', await G(() => { const S = window.__um.S, t = S.teams[S.user.team]; return [t.form, t.ment, t.sty, t.xi.filter(Boolean).length].join(' / '); }));
  // ---- live tactics in the engine
  const lt = await G(() => {
    const S = window.__um.S, t = S.teams[S.user.team];
    const m = { id: 9999, h: t.id, a: Object.values(S.teams).find((x) => x.id !== t.id && !x.isNat).id, d: S.date, c: 0 };
    S.matches[9999] = m; const st = window.__um.startMatchState(m, { user: t.id });
    const before = st.sides[0].on.slice();
    const ch = window.__um.tac.live(st, 0, { form: '3-4-1-2', ment: 2, sty: 'press' });
    const after = st.sides[0].on;
    return { changed: ch, form: st.sides[0].form, ment: st.sides[0].mentality, sty: st.sides[0].style, same: [...before].sort().join() === [...after].sort().join(), slots: st.sides[0].slotsOn.join(','), xg: st.xg.map((x) => +x.toFixed(2)) };
  });
  console.log('live', JSON.stringify(lt));
  // ---- transfers: loans tab
  await click('[data-a="tab"][data-t="transfers"]');
  await click('[data-a="subtab"][data-g="transfers"][data-k="loans"]');
  console.log('loan rows', await G(() => document.querySelectorAll('#search-list tbody tr').length), 'buttons', await G(() => document.querySelectorAll('#search-list [data-a="pLoan"]').length));
  await click('#search-list [data-a="pLoan"]');
  console.log('loan modal', await G(() => (document.querySelector('.modal, .modal-card, [role=dialog]') || {}).textContent ? document.querySelector('.modal, .modal-card, [role=dialog]').textContent.slice(0, 60) : 'none'));
  await click('[data-a="closeModal"]');
  // ---- auto renewal
  const ar = await G(() => {
    const T = window.__um.tac, S = window.__um.S, t = S.teams[S.user.team];
    const p = T.squad(t.id).sort((a, b) => b.o - a.o)[0];
    p.rn = 1; p.ct = T.seasonEndYear(); const w0 = p.w;
    const y = T.ymd(S.date).y + 1;
    const ok = T.autoRenew(p, t, y);
    return { name: p.n, ok, ct: p.ct, w0, w1: p.w };
  });
  console.log('auto renew', JSON.stringify(ar));
    console.log('trophy preview', await G(() => window.__um.tac.trophy('LIB', 60).length > 500));
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
