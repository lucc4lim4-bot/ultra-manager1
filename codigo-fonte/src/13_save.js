/* ===================== persistence: saves, wallet (futcoins) ===================== */
const IDB = {
  db: null,
  failed: false,
  async open() {
    if (IDB.db) return IDB.db;
    if (IDB.failed || typeof indexedDB === 'undefined') return null;
    if (IDB.opening) return IDB.opening;
    IDB.opening = new Promise((res) => {
      const fail = () => { IDB.failed = true; res(null); };
      const timer = setTimeout(fail, 4000);
      try {
        const r = indexedDB.open('ultra-manager', 1);
        r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); };
        r.onsuccess = () => { clearTimeout(timer); IDB.db = r.result; res(IDB.db); };
        r.onerror = () => { clearTimeout(timer); fail(); };
        r.onblocked = () => { clearTimeout(timer); fail(); };
      } catch (e) { clearTimeout(timer); fail(); }
    });
    return IDB.opening;
  },
  async get(key) {
    const db = await IDB.open();
    if (!db) return MEMSTORE[key];
    return new Promise((res) => {
      try {
        const tx = db.transaction('kv', 'readonly');
        const q = tx.objectStore('kv').get(key);
        q.onsuccess = () => res(q.result);
        q.onerror = () => res(undefined);
      } catch (e) { res(MEMSTORE[key]); }
    });
  },
  async set(key, val) {
    MEMSTORE[key] = val;
    const db = await IDB.open();
    if (!db) return false;
    return new Promise((res) => {
      try {
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(val, key);
        tx.oncomplete = () => res(true);
        tx.onerror = () => res(false);
      } catch (e) { res(false); }
    });
  },
  async del(key) {
    delete MEMSTORE[key];
    const db = await IDB.open();
    if (!db) return;
    return new Promise((res) => {
      try { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(key); tx.oncomplete = () => res(true); tx.onerror = () => res(false); } catch (e) { res(false); }
    });
  },
};
const MEMSTORE = {};

async function gzip(str) {
  if (typeof CompressionStream === 'undefined') return new Blob([str], { type: 'application/json' });
  const cs = new CompressionStream('gzip');
  const stream = new Blob([str]).stream().pipeThrough(cs);
  return await new Response(stream).blob();
}
async function gunzip(blob) {
  if (typeof blob === 'string') return blob;
  if (typeof DecompressionStream === 'undefined' || blob.type === 'application/json') return await blob.text();
  try {
    const ds = new DecompressionStream('gzip');
    const stream = blob.stream().pipeThrough(ds);
    return await new Response(stream).text();
  } catch (e) { return await blob.text(); }
}

function serializeState() {
  RNG_SAVE();
  return JSON.stringify(S);
}
function RNG_SAVE() { S.rng = RNG.s; }
function saveMeta() {
  const t = S.teams[S.user.team];
  return { id: S.id, coach: S.coach.name, team: t ? t.n : '—', teamId: t ? t.id : 0, key: t ? t.key : '', c1: t ? t.c1 : '#888', c2: t ? t.c2 : '#fff', short: t ? t.s : '',
    date: S.date, era: S.era, mode: S.mode, zoeira: S.zoeira, saved: Date.now(), rec: S.coach.rec, trophies: S.coach.trophies.length };
}
async function saveGame(slot) {
  const key = 'save:' + (slot || S.id);
  const blob = await gzip(serializeState());
  await IDB.set(key, blob);
  const idx = (await IDB.get('saves')) || [];
  const meta = saveMeta();
  meta.key = key;
  const i = idx.findIndex((x) => x.key === key);
  if (i >= 0) idx[i] = meta; else idx.unshift(meta);
  await IDB.set('saves', idx);
  return meta;
}
async function listSaves() { return (await IDB.get('saves')) || []; }
async function deleteSave(key) {
  await IDB.del(key);
  const idx = ((await IDB.get('saves')) || []).filter((x) => x.key !== key);
  await IDB.set('saves', idx);
}
async function loadSaveData(key) {
  const blob = await IDB.get(key);
  if (!blob) return null;
  const txt = await gunzip(blob);
  return JSON.parse(txt);
}
function adoptState(obj) {
  S = obj;
  RNG.seed(S.rng || 1);
  cutBraBudgets();
  purgeWomen2026(); // careers saved before the 2026 database fix
  if (S.flags && !S.flags.potV2) { // higher ceiling for the young talents of older careers (once)
    S.flags.potV2 = 1; S.flags.potV3 = 1;
    for (const id in S.players) { const p = S.players[id]; if (!p.yth) boostYoungPot(p); }
  } else if (S.flags && !S.flags.potV3) { // minimum of 80 of potential for the youngsters (once)
    S.flags.potV3 = 1;
    for (const id in S.players) { const p = S.players[id]; if (!p.yth && !p.natOnly && p.age <= 22 && p.pot < YOUNG_POT_MIN) p.pot = YOUNG_POT_MIN; }
  }
}
async function exportSaveBlob() { return new Blob([serializeState()], { type: 'application/json' }); } // .json is on the download allowlist
async function importSaveFile(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let txt;
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) txt = await gunzip(new Blob([buf], { type: 'application/gzip' }));
  else txt = new TextDecoder().decode(bytes);
  const obj = JSON.parse(txt);
  if (!obj || !obj.teams || !obj.players || !obj.era) throw new Error('Arquivo de save inválido.');
  return obj;
}

// ---------------------------------------------------------------- wallet (global, across saves)
const WALLET = { coins: 0, owned: [], log: [] };
const INFINITE_COINS = true; // FutCoins ilimitadas para todos os jogadores
function canAfford(price) { return INFINITE_COINS || WALLET.coins >= price; }
function coinsLabel() { return INFINITE_COINS ? '∞' : String(WALLET.coins); }
async function loadWallet() {
  let w = null;
  try { const s = localStorage.getItem('um-wallet'); if (s) w = JSON.parse(s); } catch (e) {}
  const w2 = await IDB.get('wallet');
  if (w2 && (!w || (w2.ts || 0) > (w.ts || 0))) w = w2;
  if (w) Object.assign(WALLET, w);
  return WALLET;
}
async function persistWallet() {
  WALLET.ts = Date.now();
  try { localStorage.setItem('um-wallet', JSON.stringify(WALLET)); } catch (e) {}
  await IDB.set('wallet', JSON.parse(JSON.stringify(WALLET)));
}
function awardFutcoins(n, reason) {
  WALLET.coins += n;
  WALLET.log.unshift({ n, reason, t: Date.now() });
  if (WALLET.log.length > 60) WALLET.log.length = 60;
  persistWallet();
}
function teamPriceByRating(r) {
  const x = clamp((r - 62) / (89 - 62), 0, 1);
  return Math.round((50 + Math.pow(x, 2.1) * 950) / 10) * 10;
}
function buyTeam(key, price) {
  if (WALLET.owned.includes(key)) return 'Você já tem este time.';
  if (!INFINITE_COINS) {
    if (WALLET.coins < price) return 'FutCoins insuficientes.';
    WALLET.coins -= price;
    WALLET.log.unshift({ n: -price, reason: `Compra: ${key}`, t: Date.now() });
  }
  WALLET.owned.push(key);
  persistWallet();
  return null;
}
