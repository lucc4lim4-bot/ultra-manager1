// Browser test: Online Copa de Pênaltis with a mock room (BroadcastChannel) between two pages: host + guest
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.env.SHOTS || '/tmp/shots';
const dist = path.join(__dirname, '../dist');
const body = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dist, '_test.html'), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const MOCK = `(() => {
  const bc = new BroadcastChannel('mockroom'), me = Math.random().toString(36).slice(2, 10);
  const rooms = {};
  const mk = (name) => {
    const R = { name, mine: {}, peers: new Map(), ls: [], conn: [] };
    const emitCh = () => R.ls.forEach((f) => { try { f({ peers: R.peers_(), joined: [], left: [], updated: [] }); } catch (e) {} });
    R.peers_ = () => [{ peer: me, isMe: true, sameTab: true, kind: 'viewer', guest: false, by: null, presence: R.mine, updatedAt: Date.now() }, ...[...R.peers.entries()].map(([p, pr]) => ({ peer: p, isMe: false, sameTab: false, kind: 'viewer', guest: false, by: null, presence: pr, updatedAt: Date.now() }))];
    R.api = {
      name, emit: async () => {}, on: () => () => {}, presence: async (patch) => { for (const k in patch) { if (patch[k] === null) delete R.mine[k]; else R.mine[k] = patch[k]; } bc.postMessage({ t: 'pres', room: name, peer: me, presence: R.mine }); },
      peers: () => R.peers_(), onPeers: (f) => { R.ls.push(f); return () => { R.ls = R.ls.filter((x) => x !== f); }; }, connected: () => true, onConnection: () => () => {}, leave: async () => { bc.postMessage({ t: 'bye', room: name, peer: me }); delete rooms[name]; },
    };
    R.emitCh = emitCh;
    return R;
  };
  bc.onmessage = (e) => {
    const m = e.data; const R = rooms[m.room]; if (!R || m.peer === me) return;
    if (m.t === 'hello') { R.peers.set(m.peer, m.presence || {}); bc.postMessage({ t: 'pres', room: m.room, peer: me, presence: R.mine }); }
    else if (m.t === 'pres') R.peers.set(m.peer, m.presence);
    else if (m.t === 'bye') R.peers.delete(m.peer);
    R.emitCh();
  };
  const lobby = { join: async (name) => { const R = rooms[name] || (rooms[name] = mk(name)); bc.postMessage({ t: 'hello', room: name, peer: me, presence: R.mine }); return R.api; } };
  window.claude = { use: async (n) => (n === 'room' ? lobby : null) };
})();`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 760 } });
  await ctx.addInitScript(MOCK);
  const errors = [];
  const mkPage = async (tag) => {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(tag + ' pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
    page.on('console', (m) => { if (/pcnDone/.test(m.text())) console.log(tag, m.text()); if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push(tag + ' console: ' + m.text()); });
    await page.goto('http://localhost:8765/_test.html?debug=1');
    await page.waitForSelector('[data-a="openPenCup"]');
    return page;
  };
  const H = await mkPage('H'), Gp = await mkPage('G');
  const click = async (page, sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };
  const shot = (page, n) => page.screenshot({ path: path.join(OUT, 'po_' + n + '.png') });
  await click(H, '[data-a="openPenCup"]'); await click(H, '[data-a="pcOnline"]');
  await click(H, '[data-a="pcSet"][data-k="size"][data-v="4"]');
  await H.fill('#pc-nick', 'Anfitriao');
  await click(H, '[data-a="pcCreate"]');
  await H.waitForSelector('.disp', { timeout: 30000 });
  const code = (await H.locator('.disp').first().innerText()).trim().toLowerCase();
  console.log('room code:', code);
  await H.waitForSelector('#pc-q', { timeout: 120000 });
  await click(Gp, '[data-a="openPenCup"]'); await click(Gp, '[data-a="pcOnline"]');
  await Gp.fill('#pc-nick', 'Amigo'); await Gp.fill('#pc-code', code);
  await click(Gp, '[data-a="pcJoin"]');
  await Gp.waitForSelector('#pc-q', { timeout: 120000 });
  await H.fill('#pc-q', 'Flamengo'); await H.waitForTimeout(300); await click(H, '#pc-list [data-a="pcoPick"]');
  await Gp.fill('#pc-q', 'Palmeiras'); await Gp.waitForTimeout(300); await click(Gp, '#pc-list [data-a="pcoPick"]');
  await click(H, '[data-a="pcoReady"]'); await click(Gp, '[data-a="pcoReady"]');
  await H.waitForTimeout(800);
  await shot(H, '01_lobby_host'); await shot(Gp, '02_lobby_guest');
  await click(H, '[data-a="pcoStart"]');
  await H.waitForSelector('[data-a="pcoPlay"]', { timeout: 15000 });
  await Gp.waitForSelector('[data-a="pcoPlay"]', { timeout: 15000 });
  await shot(H, '03_bracket_host');
  console.log('host sees human opp label:', (await H.locator('[data-a="pcoPlay"]').first().innerText()));
  // both play the human tie; a routine presses keys on each page
  const driver = async (page, tag) => {
    const t0 = Date.now(); let seenGame = false; let lastSeq = '';
    while (Date.now() - t0 < 200000) {
      if (await page.locator('.g2d').count()) {
        seenGame = true;
        const st = await page.evaluate(() => window.__g2d && window.__g2d._G ? (window.__g2d._G.pk ? window.__g2d._G.pk.phase : window.__g2d._G.state) : 'none');
        const sq = await page.evaluate(() => { const g = window.__g2d && window.__g2d._G; return g && g.shootout ? JSON.stringify(g.shootout.kicks) + ' turn' + g.shootout.turn : ''; });
        if (sq !== lastSeq) { lastSeq = sq; console.log(tag, sq); }
        if (st === 'aim') { await page.keyboard.down('ArrowDown'); await page.waitForTimeout(200); await page.keyboard.up('ArrowDown'); await page.keyboard.down('k'); await page.waitForTimeout(500); await page.keyboard.up('k'); }
        else if (st === 'dive') { const dk = Math.random() < 0.6 ? 'ArrowDown' : 'ArrowUp'; await page.keyboard.down(dk); await page.waitForTimeout(250); await page.keyboard.up(dk); }
        else if (st === 'shootoutIntro' || st === 'shootoutEnd') await page.keyboard.press('j');
      } else if (seenGame) break;
      await page.waitForTimeout(350);
    }
    return seenGame;
  };
  await click(H, '[data-a="pcoPlay"]'); await click(Gp, '[data-a="pcoPlay"]');
  await H.waitForSelector('.g2d', { timeout: 20000 }); await Gp.waitForSelector('.g2d', { timeout: 20000 });
  console.log('both games started');
  await H.waitForTimeout(6000);
  await shot(H, '04_game_host'); await shot(Gp, '05_game_guest');
  const [a, b] = await Promise.all([driver(H, 'H'), driver(Gp, 'G')]);
  console.log('drivers done', a, b);
  const score = async (page) => page.evaluate(() => document.body.innerText.match(/venceu|perdeu/g)?.[0] + ' ' + (document.body.innerText.match(/por (\d+) x (\d+)/) || []).slice(1).join('-'));
  await H.waitForTimeout(1500);
  console.log('HOST TEXT:', (await H.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 500));
  for (const [pg, tag] of [[H, 'H'], [Gp, 'G']]) {
    if (await pg.locator('[data-a="pcoPlay"]').count()) {
      console.log(tag, 'plays the final against the bot');
      await pg.locator('[data-a="pcoPlay"]').first().click();
      await pg.waitForSelector('.g2d', { timeout: 20000 });
      await driver(pg, tag);
    }
  }
  await H.waitForTimeout(2500);
  console.log('END host:', (await H.evaluate(() => document.body.innerText.match(/Você é o campeão|Fim da copa|Campeão: [^\n]+/g))) , '| END guest:', (await Gp.evaluate(() => document.body.innerText.match(/Você é o campeão|Fim da copa|Campeão: [^\n]+/g))));
  await shot(H, '08_end_host'); await shot(Gp, '09_end_guest');
  console.log('GUEST TEXT:', (await Gp.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 400));
  console.log('host result:', await score(H), '| guest result:', await score(Gp));
  await shot(H, '06_after_host'); await shot(Gp, '07_after_guest');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch((e) => { console.error('TEST FAILED', e); process.exit(1); });
