// Browser test: movable on-screen controls (mobile landscape): default layout, drag in edit mode, persistence, buttons still work
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const G = (f, a) => page.evaluate(f, a);
  await page.goto('http://localhost:8765/_test.html?debug=1');
  await page.waitForSelector('[data-a="openFriendly"]');
  await page.locator('[data-a="openFriendly"]').click();
  await page.locator('[data-a="frLoad"]').click();
  await page.waitForSelector('.any-item', { timeout: 120000 });
  await page.locator('.any-item').nth(0).tap(); await page.locator('.any-item').nth(5).tap();
  await page.locator('[data-a="frPlay"]').click();
  await page.waitForSelector('.g2d .pad[data-k="pass"]');
  await page.waitForTimeout(800);
  const pos = () => G(() => Object.fromEntries([...document.querySelectorAll('.g2d [data-k]')].map((e) => { const r = e.getBoundingClientRect(); return [e.dataset.k, [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), e.offsetParent ? 1 : 0]]; })));
  console.log('default', JSON.stringify(await pos()));
  await page.screenshot({ path: path.join(OUT, 'ly_0_default.png') });
  await page.evaluate(() => document.querySelector('#g2-pause').click());
  await page.waitForSelector('[data-g="lay"]');
  await page.locator('[data-g="lay"]').click();
  await page.waitForSelector('#g2-laybar:not([hidden])');
  await page.screenshot({ path: path.join(OUT, 'ly_1_edit.png') });
  const p0 = await pos();
  console.log('at pass:', await G((p) => { const e = document.elementFromPoint(p[0], p[1]); return e ? e.tagName + '.' + e.className + ' ' + (e.dataset.k || '') : null; }, p0.pass));
  await G(() => { ['pointerdown','pointermove','pointerup'].forEach((n) => window.addEventListener(n, (e) => { window.__ev = (window.__ev || []).concat(n + ':' + (e.target.className || e.target.tagName)); }, true)); });
  // drag PASSE to the upper middle with real pointer events
  const from = p0.pass, to = [400, 250];
  await page.mouse.move(from[0], from[1]); await page.mouse.down(); await page.mouse.move((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, { steps: 5 }); await page.mouse.move(to[0], to[1], { steps: 5 }); await page.mouse.up();
  await page.locator('[data-l="plus"]').click(); await page.locator('[data-l="plus"]').click();
  const p1 = await pos();
  console.log('pass moved', JSON.stringify(p0.pass), '->', JSON.stringify(p1.pass), 'others unchanged:', ['shoot', 'lob', 'joy', 'swap'].every((k) => Math.abs(p0[k][0] - p1[k][0]) < 3 && Math.abs(p0[k][1] - p1[k][1]) < 3));
  console.log('events', JSON.stringify((await G(() => window.__ev)).slice(0, 6)));
  console.log('saved lay', await G(() => JSON.stringify(JSON.parse(localStorage.getItem('um-g2d')).lay)));
  await page.screenshot({ path: path.join(OUT, 'ly_2_moved.png') });
  await page.locator('[data-l="done"]').click();
  await page.waitForSelector('[data-g="resume"]');
  await page.locator('[data-g="resume"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'ly_3_play.png') });
  // the moved button still works: press it and see the input flag
  await page.locator('.g2-intro').tap({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(1500);
  const pp = (await pos()).pass;
  await G(() => { window.__hit = 0; document.querySelector('.g2d .pad[data-k="pass"]').addEventListener('pointerdown', () => window.__hit++); });
  await page.touchscreen.tap(pp[0], pp[1]); await page.waitForTimeout(200);
  console.log('tap on moved PASSE reached the button:', await G(() => window.__hit));
  // reload keeps the layout
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})();
