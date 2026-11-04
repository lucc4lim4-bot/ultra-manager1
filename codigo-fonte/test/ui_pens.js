// Browser test: a level knockout tie from the quick sim / live mode lets the user play the shoot-out in the 2D game
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 860 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const click = async (sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(200); };
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
  const r = await page.evaluate(() => { const { S, UI, askPens, startMatchState } = window.__um; const m = S.matches[UI.match.mid]; const st = startMatchState(m, { user: S.user.team }); st.deferPens = true; st.pendPens = true; st.score = [1, 1]; UI.match.st = st; askPens(m, st); return !!document.querySelector('[data-a="pensPlay"]'); });
  console.log('modal with the choice:', r);
  await click('[data-a="pensPlay"]');
  await page.waitForTimeout(4500);
  console.log('2D shoot-out state:', await page.evaluate(() => window.__g2d && window.__g2d._G ? window.__g2d._G.state + ' / ' + (window.__g2d._G.pk ? window.__g2d._G.pk.phase : '-') : 'none'));
  // let the shoot-out run: shoot when it is our turn, otherwise it plays itself
  for (let i = 0; i < 220; i++) {
    const s = await page.evaluate(() => window.__g2d && window.__g2d._G ? { st: window.__g2d._G.state, ph: window.__g2d._G.pk && window.__g2d._G.pk.phase } : null);
    if (!s) break;
    if (s.ph === 'aim') { await page.keyboard.down('k'); await page.waitForTimeout(500); await page.keyboard.up('k'); }
    else if (s.ph === 'dive') { await page.keyboard.press('ArrowLeft'); }
    await page.waitForTimeout(700);
  }
  console.log('after: phase', await page.evaluate(() => window.__um.UI.match.phase), '| pen', await page.evaluate(() => JSON.stringify(window.__um.UI.match.st.pen)), '| played', await page.evaluate(() => window.__um.UI.match.st.penPlayed));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
