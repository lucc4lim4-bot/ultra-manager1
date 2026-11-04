// Browser test: Online friendly with a mock room (BroadcastChannel) between two pages: host + guest
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
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  await ctx.addInitScript(MOCK);
  const errors = [];
  const mkPage = async (tag) => {
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(tag + ' pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push(tag + ' console: ' + m.text()); });
    await page.goto('http://localhost:8765/_test.html?debug=1');
    await page.waitForSelector('[data-a="openFriendlyNet"]');
    return page;
  };
  const H = await mkPage('H'), Gp = await mkPage('G');
  const click = async (page, sel) => { await page.locator(sel).first().click(); await page.waitForTimeout(250); };
  const shot = (page, n) => page.screenshot({ path: path.join(OUT, 'fn_' + n + '.png') });
  await click(H, '[data-a="openFriendlyNet"]');
  await H.fill('[data-a="fnNick"]', 'Anfitriao');
  await click(H, '[data-a="fnCreate"]');
  await H.waitForSelector('.pill b', { timeout: 30000 });
  const code = (await H.locator('.pill b').first().innerText()).trim().toLowerCase();
  console.log('room code:', code);
  await H.waitForSelector('#fn-list .any-item', { timeout: 120000 });
  await click(Gp, '[data-a="openFriendlyNet"]');
  await Gp.fill('[data-a="fnNick"]', 'Amigo'); await Gp.fill('[data-a="fnCodeIn"]', code);
  await click(Gp, '[data-a="fnJoin"]');
  await Gp.waitForSelector('#fn-list .any-item', { timeout: 120000 });
  await click(H, '#fn-list .any-item >> nth=0');
  await click(Gp, '#fn-list .any-item >> nth=3');
  await Gp.locator('[data-a="fnMent"][data-v="1"]').first().click();
  await H.selectOption('[data-a="fnForm"]', '4-4-2');
  await click(H, '[data-a="fnReady"]'); await click(Gp, '[data-a="fnReady"]');
  await H.waitForTimeout(800);
  await shot(H, '1_lobby'); await shot(Gp, '1_lobby_g');
  await click(H, '[data-a="fnStart"]');
  // the first half plays back (about 14 s), then the half-time panel
  await H.waitForSelector('[data-a="fnHalfReady"]', { timeout: 60000 });
  await Gp.waitForSelector('[data-a="fnHalfReady"]', { timeout: 60000 });
  const sc = async (p) => (await p.locator('.sc').first().innerText()).replace(/\s/g, '');
  console.log('HT scores', await sc(H), await sc(Gp));
  await shot(H, '2_ht');
  await click(H, '[data-a="fnMent"][data-v="-1"]');
  await click(H, '[data-a="fnHalfReady"]');
  await H.waitForTimeout(500);
  await click(Gp, '[data-a="fnHalfReady"]');
  await H.waitForSelector('[data-a="fnAgain"]', { timeout: 60000 });
  await Gp.waitForSelector('[data-a="fnAgain"]', { timeout: 60000 });
  const a = await sc(H), b = await sc(Gp);
  console.log('FT scores', a, b);
  const fa = await H.locator('.panel').first().innerText(), fb = await Gp.locator('.panel').first().innerText();
  console.log('same feed:', fa.replace(/\s+/g, ' ') === fb.replace(/\s+/g, ' '));
  await shot(H, '3_end'); await shot(Gp, '3_end_g');
  // rematch
  await click(H, '[data-a="fnAgain"]'); await click(Gp, '[data-a="fnAgain"]');
  await click(H, '[data-a="fnReady"]'); await click(Gp, '[data-a="fnReady"]');
  await H.waitForTimeout(600);
  await click(H, '[data-a="fnStart"]');
  await H.waitForSelector('[data-a="fnHalfReady"]', { timeout: 60000 });
  await Gp.waitForSelector('[data-a="fnHalfReady"]', { timeout: 60000 });
  console.log('rematch ok', await sc(H), await sc(Gp));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})();
