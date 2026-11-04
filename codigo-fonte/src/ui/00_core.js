/* ===================== UI core ===================== */
const UI = {
  screen: 'start', tab: 'central', sub: {}, sel: null, newsIdx: 0, filters: {}, wiz: null, busy: false,
};
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const ACT = {};
function act(name, fn) { ACT[name] = fn; }

function render() {
  const app = $('#app');
  let html = '';
  try {
    if (UI.screen === 'start') html = viewStart();
    else if (UI.screen === 'wizard') html = viewWizard();
    else if (UI.screen === 'friendly') html = viewFriendly();
    else if (UI.screen === 'pencup') html = viewPenCup();
    else if (UI.screen === 'fnet') html = viewFriendlyNet();
    else if (UI.screen === 'plwiz') html = viewPlWizard();
    else if (UI.screen === 'career') html = viewCareer();
    else if (UI.screen === 'match') html = viewMatch();
    else if (UI.screen === 'loading') html = viewLoading();
  } catch (e) {
    console.error(e);
    html = `<div class="page"><div class="panel"><h3>Algo deu errado ao desenhar esta tela</h3><p class="muted">${esc(e.message)}</p><button class="btn" data-a="goHub">Voltar à Central</button></div></div>`;
  }
  app.innerHTML = html;
  afterRender();
}
const AFTER = [];
function afterRender() {
  while (AFTER.length) { try { AFTER.shift()(); } catch (e) { console.error(e); } }
}
function later(fn) { AFTER.push(fn); }

// event delegation
function handle(e) {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  // inputs and selects act on change/input only (a checkbox fires click and change: handle it once)
  if (e.type === 'click' && (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type !== 'button' && el.type !== 'submit'))) return;
  if (e.type === 'click' && el.tagName === 'LABEL' && e.target.tagName === 'INPUT') return;
  if ((e.type === 'change' || e.type === 'input') && !(el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
  if (e.type === 'input' && !el.dataset.live) return;
  if (e.type === 'change' && el.dataset.live) return;
  if (el.tagName === 'FORM' && e.type !== 'submit') return;
  const fn = ACT[el.dataset.a];
  if (!fn) return;
  if (el.tagName === 'A') e.preventDefault();
  fn(el, e);
}
document.addEventListener('click', handle);
document.addEventListener('change', handle);
document.addEventListener('input', handle);
document.addEventListener('submit', (e) => { e.preventDefault(); handle(e); });

// ---------- modals & toasts
const MODALS = [];
function openModal(html, opts = {}) {
  MODALS.push({ html, opts });
  drawModals();
}
function replaceModal(html, opts = {}) { if (MODALS.length) MODALS.pop(); openModal(html, opts); }
function closeModal() { const m = MODALS.pop(); drawModals(); if (m && m.opts.onClose) m.opts.onClose(); }
function closeAllModals() { MODALS.length = 0; drawModals(); }
function drawModals() {
  const root = $('#modals');
  root.innerHTML = MODALS.map((m, i) => `<div class="modal-bg" data-mi="${i}" ${i < MODALS.length - 1 ? 'style="display:none"' : ''}>
    <div class="modal ${m.opts.size || ''}" role="dialog" aria-modal="true">${typeof m.html === 'function' ? m.html() : m.html}</div></div>`).join('');
  afterRender();
}
function refreshModal() { drawModals(); }
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && MODALS.length && !(MODALS[MODALS.length - 1].opts.locked)) closeModal();
});
document.addEventListener('mousedown', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-bg')) {
    const top = MODALS[MODALS.length - 1];
    if (top && !top.opts.locked) closeModal();
  }
});
act('closeModal', () => closeModal());
function toast(msg, bad) {
  if (!msg) return;
  const el = document.createElement('div');
  el.className = 'toast' + (bad ? ' bad' : '');
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
async function offerDownload(filename, blob, okMsg) {
  let dl = null;
  try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
  if (dl) {
    try { await dl.save({ filename, data: blob }); toast(okMsg); }
    catch (e) {
      if (e && e.code === 'declined') toast('Download cancelado.');
      else if (e && e.code === 'rate_limited') toast('Já existe um download aguardando confirmação.', true);
      else toast('Download indisponível aqui. Seus dados continuam salvos neste navegador.', true);
    }
    return;
  }
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(okMsg);
  } catch (e) { toast('Download indisponível neste visualizador.', true); }
}
function modalShell(title, body, footer, extraHead = '') {
  return `<div class="modal-h">${extraHead}<h2 class="grow">${title}</h2><button class="icon-btn" data-a="closeModal" aria-label="Fechar">✕</button></div>
  <div class="modal-b">${body}</div>${footer ? `<div class="modal-f">${footer}</div>` : ''}`;
}

// ---------- hashing & colors
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function hexToRgb(h) { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [128, 128, 128]; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function lum(h) { const [r, g, b] = hexToRgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function textOn(h) { return lum(h) > 0.6 ? '#10161a' : '#ffffff'; }

// ---------- crests: original badges generated from each club's colours (never the official crests).
// A player can replace any crest with an image of their own; it is kept only on their device.
const CUSTOM_CRESTS = {}; // team key -> PNG data URL
const CREST_URLS = {}; // team key -> short blob: URL used in the markup (keeps re-renders light)
const isCrestData = (s) => typeof s === 'string' && s.length < 3e6 && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(s);
function crestSrc(key) {
  const d = CUSTOM_CRESTS[key];
  if (!d) return null;
  if (CREST_URLS[key]) return CREST_URLS[key];
  try {
    const comma = d.indexOf(',');
    const bin = atob(d.slice(comma + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    CREST_URLS[key] = URL.createObjectURL(new Blob([bytes], { type: d.slice(5, d.indexOf(';')) }));
  } catch (e) { CREST_URLS[key] = d; }
  return CREST_URLS[key];
}
function customCrestOf(t) { return t && t.key && CUSTOM_CRESTS[t.key] ? crestSrc(t.key) : null; }
function setCustomCrest(key, data) {
  if (CREST_URLS[key] && CREST_URLS[key].startsWith('blob:')) URL.revokeObjectURL(CREST_URLS[key]);
  delete CREST_URLS[key];
  if (data) CUSTOM_CRESTS[key] = data; else delete CUSTOM_CRESTS[key];
}
async function loadCustomCrests() {
  try {
    const c = await IDB.get('crests');
    if (c && typeof c === 'object') for (const k in c) if (isCrestData(c[k])) CUSTOM_CRESTS[k] = c[k];
  } catch (e) { /* storage unavailable */ }
}
async function persistCustomCrests() { try { await IDB.set('crests', Object.assign({}, CUSTOM_CRESTS)); } catch (e) { /* storage unavailable */ } }
const CREST_SHAPES = [
  'M20 2 L36 7 L36 20 C36 30 28 36 20 39 C12 36 4 30 4 20 L4 7 Z',
  'M20 1.5 C30.2 1.5 38.5 9.8 38.5 20 C38.5 30.2 30.2 38.5 20 38.5 C9.8 38.5 1.5 30.2 1.5 20 C1.5 9.8 9.8 1.5 20 1.5 Z',
  'M4 4 L36 4 L36 22 C36 31 28 36 20 39 C12 36 4 31 4 22 Z',
  'M20 1 L38 10 L34 30 L20 39 L6 30 L2 10 Z',
  'M6 3 L14 3 L20 7 L26 3 L34 3 L37 12 L33 30 L20 39 L7 30 L3 12 Z',
  'M4 3 H36 V18 Q36 32 20 39 Q4 32 4 18 Z',
  'M9 2 H31 Q38 2 38 9 V31 Q38 38 31 38 H9 Q2 38 2 31 V9 Q2 2 9 2 Z',
  'M20 1 L37 13 L31 37 H9 L3 13 Z',
];
function crestPattern(pat, c1, c2) {
  const base = `<rect width="40" height="40" fill="${c1}"/>`;
  switch (pat) {
    case 0: return base;
    case 1: return base + [8, 20, 32].map((x) => `<rect x="${x - 3}" y="0" width="6" height="40" fill="${c2}"/>`).join('');
    case 2: return base + `<rect x="20" y="0" width="20" height="40" fill="${c2}"/>`;
    case 3: return base + `<path d="M-4 30 L30 -4 L44 -4 L44 4 L4 44 L-4 44Z" fill="${c2}"/>`;
    case 4: return base + `<rect x="0" y="15" width="40" height="11" fill="${c2}"/>`;
    case 5: return base + [7, 19, 31].map((y) => `<rect x="0" y="${y}" width="40" height="5" fill="${c2}"/>`).join('');
    case 6: return base + `<rect width="20" height="20" fill="${c2}"/><rect x="20" y="20" width="20" height="20" fill="${c2}"/>`;
    case 7: return base + `<path d="M0 6 L20 20 L40 6 L40 15 L20 29 L0 15Z" fill="${c2}"/>`;
    default: return base + `<rect x="15" y="0" width="10" height="40" fill="${c2}"/>`;
  }
}
function crestStar(cx, cy, r, fill) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)} `; }
  return `<path d="${d}Z" fill="${fill}" stroke="rgba(0,0,0,0.35)" stroke-width="0.4"/>`;
}
function crest(teamOrId, size = 36) {
  const t = typeof teamOrId === 'object' ? teamOrId : S.teams[teamOrId];
  if (!t) return `<svg width="${size}" height="${size}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#2a3a40"/></svg>`;
  const custom = customCrestOf(t);
  if (custom) return `<img class="crest-img" src="${esc(custom)}" width="${size}" height="${size}" alt="${esc(t.n)}" draggable="false">`;
  const c1 = t.c1 || '#555', c2 = t.c2 || '#fff';
  const h = hashStr(t.key || String(t.id));
  const id = 'cr' + (h % 100000) + '_' + size;
  if (t.isNat) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-label="${esc(t.n)}"><defs><clipPath id="${id}"><circle cx="20" cy="20" r="18"/></clipPath></defs>
      <g clip-path="url(#${id})"><rect width="40" height="40" fill="${c1}"/><path d="M0 26 L40 14 L40 40 L0 40Z" fill="${c2}"/></g>
      <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
      <text x="20" y="24.5" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="12" fill="${textOn(c1)}" stroke="${c1 === '#ffffff' ? 'none' : 'rgba(0,0,0,0.25)'}" stroke-width="0.4">${esc(t.s)}</text></svg>`;
  }
  const shape = CREST_SHAPES[h % CREST_SHAPES.length];
  const pat = (h >> 3) % 9;
  const emblem = (h >> 7) % 5;
  const busy = pat !== 0;
  const label = (t.s || '?').slice(0, 4);
  const fs = label.length >= 4 ? 9 : label.length === 3 ? 11 : 13;
  const txtCol = !busy ? textOn(c1) : '#ffffff';
  const gold = '#ffd34d';
  let emb = '';
  if (emblem === 1) emb = crestStar(20, 9.5, 3.4, gold);
  else if (emblem === 2) emb = crestStar(13, 10, 2.3, gold) + crestStar(20, 8.4, 2.6, gold) + crestStar(27, 10, 2.3, gold);
  else if (emblem === 3) emb = `<circle cx="20" cy="10" r="3.6" fill="#fff" stroke="#111" stroke-width="0.6"/><path d="M20 8.2 L21.6 9.4 L21 11.3 L19 11.3 L18.4 9.4Z" fill="#111"/>`;
  else if (emblem === 4) emb = `<path d="${shape}" fill="none" stroke="${lum(c2) > 0.5 ? c2 : '#ffffff'}" stroke-width="1.2" transform="translate(20 20) scale(0.84) translate(-20 -20)" opacity="0.85"/>`;
  const ty = emblem >= 1 && emblem <= 3 ? 27 : 24.5;
  const band = busy ? `<rect x="5" y="${ty - fs + 1.6}" width="30" height="${fs + 1.4}" rx="2.5" fill="rgba(0,0,0,0.32)"/>` : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-label="${esc(t.n)}"><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs>
    <g clip-path="url(#${id})">${crestPattern(pat, c1, c2)}${band}</g>${emb}<path d="${shape}" fill="none" stroke="${lum(c1) > 0.85 ? '#9aa' : 'rgba(255,255,255,0.75)'}" stroke-width="1.6"/>
    <text x="20" y="${ty}" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="${fs}" fill="${txtCol}" stroke="${txtCol === '#ffffff' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.4)'}" stroke-width="0.6" paint-order="stroke">${esc(label)}</text></svg>`;
}
// crest drawn inside another SVG (news images)
function crestInSvg(t, size) {
  const custom = customCrestOf(typeof t === 'object' ? t : S.teams[t]);
  if (custom) return `<image href="${esc(custom)}" x="0" y="0" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  return crest(t, size).replace('<svg', '<svg x="0" y="0"');
}
// turn an uploaded image into a small square PNG for the crest
async function imageFileToCrest(file) {
  if (!file || !/^image\//.test(file.type || '') && !/\.(png|jpe?g|webp|gif|svg)$/i.test(file.name || '')) throw new Error('Escolha um arquivo de imagem (PNG, JPG, WebP ou SVG).');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Não foi possível abrir essa imagem.')); i.src = url; });
    const N = 128;
    const cv = document.createElement('canvas'); cv.width = N; cv.height = N;
    const g = cv.getContext('2d');
    const w = img.naturalWidth || N, h = img.naturalHeight || N;
    const k = Math.min(N / w, N / h);
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, (N - w * k) / 2, (N - h * k) / 2, w * k, h * k);
    return cv.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}
function compBadge(c, size = 26) {
  if (!c) return '';
  const key = c.key || '';
  const col = COMP_LOGO[key] || (key.startsWith('CUP') ? COMP_LOGO.CUP : key.startsWith('UL') ? COMP_LOGO.UL1 : key === 'QUAL' ? COMP_LOGO.QUAL : '#4b5b62');
  const lbl = { UCL: 'UCL', UEL: 'UEL', UECL: 'UECL', UCLQ: 'PRÉ', UECLQ: 'PRÉ', LIB: 'LIB', SULA: 'SUL', MUN: 'MUN', WC: 'WC', EURO: 'EU', COPA: 'CA', QUAL: 'EL', FRIEND: 'AM', YOUTH: 'S19', COPINHA: 'S20' }[key] ||
    (key.startsWith('CUP') ? 'COPA' : key.startsWith('UL') ? key : key.startsWith('EST') ? key.slice(3) : key.slice(0, 3));
  return `<svg width="${size}" height="${size}" viewBox="0 0 30 30" aria-hidden="true"><rect x="1" y="1" width="28" height="28" rx="8" fill="${col}"/><text x="15" y="19" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="${lbl.length > 3 ? 8.5 : 10.5}" fill="${textOn(col)}">${lbl}</text></svg>`;
}
function natFlag(code, size = 18) {
  const n = S.nations[code];
  if (!n) return '';
  return `<svg width="${size}" height="${Math.round(size * 0.7)}" viewBox="0 0 30 21" aria-label="${esc(n.n)}"><rect width="30" height="21" rx="3" fill="${n.c1}"/><path d="M0 14 L30 7 L30 21 L0 21Z" fill="${n.c2}"/><rect width="30" height="21" rx="3" fill="none" stroke="rgba(255,255,255,0.25)"/></svg>`;
}
// Trophy illustrations: each competition gets its own cup (shape, metal and colour), drawn in the style of the real
// trophies (Libertadores: tall silver cup with big handles on a dark base; Brasileirão: gold cup; Copa do Brasil: gold
// goblet with a ball; Paulistão: gold cup with a red band; Champions: silver "big ears"; World Cup: gold globe)
let TSVG_N = 0;
function trophyDesign(key) {
  const k = String(key || '');
  const T = {
    LIB: ['lib', 'silver', '#0f7a3b'], SULA: ['lib', 'gold', '#1f4fa8'], UCL: ['ears', 'silver', '#1c3f94'], UEL: ['ears', 'gold', '#f08a00'],
    WC: ['globe', 'gold', '#0d6b3a'], MUN: ['globe', 'silver', '#c9a227'], EURO: ['ears', 'silver', '#1c3f94'], COPA: ['lib', 'gold', '#d62828'],
    BRA: ['cup', 'gold', '#0b7d3b'], CUPBRA: ['goblet', 'gold', '#0b7d3b'], COPINHA: ['goblet', 'silver', '#c8102e'], YOUTH: ['cup', 'silver', '#6b7a86'],
    UL1: ['cup', 'gold', '#6a35d6'], CUPUL: ['goblet', 'gold', '#6a35d6'],
  };
  if (T[k]) return T[k];
  if (k.startsWith('EST')) return ['cup', 'gold', (typeof UF_INFO !== 'undefined' && UF_INFO[k.slice(3)] ? UF_INFO[k.slice(3)][2] : '#c8102e')];
  if (k.startsWith('CUP')) return ['goblet', 'gold', '#b8860b'];
  const h = hashStr(k);
  return [['cup', 'ears', 'goblet'][h % 3], h % 5 === 0 ? 'silver' : 'gold', ['#0b7d3b', '#1c3f94', '#c8102e', '#6a35d6'][(h >> 3) % 4]];
}
function trophySVG(key, size = 70) {
  const [shape, metal, acc] = trophyDesign(key);
  const id = 'tg' + (++TSVG_N);
  const m = metal === 'silver' ? ['#ffffff', '#d5dce2', '#8e9aa5', '#5d6872'] : ['#fff4cf', '#ffc94d', '#c98a14', '#7d4d08'];
  const G = `fill="url(#${id})"`, S = `stroke="url(#${id}d)" stroke-width="1.2"`;
  let body = '';
  if (shape === 'lib') { // tall cup, flared bowl, two big handles from rim to stem, dark base with a plate
    body = `<path d="M31 10 H69 C70 30 64 44 54 50 L54 58 H46 L46 50 C36 44 30 30 31 10Z" ${G} ${S}/>
      <path d="M31 14 C12 12 8 38 28 44 M31 14 C20 16 18 34 30 38" fill="none" stroke="url(#${id})" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M69 14 C88 12 92 38 72 44 M69 14 C80 16 82 34 70 38" fill="none" stroke="url(#${id})" stroke-width="4.5" stroke-linecap="round"/>
      <ellipse cx="50" cy="58" rx="9" ry="3" ${G}/><path d="M44 61 H56 L58 70 H42Z" ${G}/>
      <rect x="30" y="70" width="40" height="8" rx="2" fill="#2a1c12"/><rect x="26" y="78" width="48" height="10" rx="2" fill="#3a271a"/><rect x="36" y="72.5" width="28" height="3.2" rx="1" fill="${acc}"/>
      <path d="M36 14 C37 30 40 40 47 46" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>`;
  } else if (shape === 'ears') { // slim bowl with huge handles
    body = `<path d="M38 12 H62 C63 28 58 38 53 42 L53 56 H47 L47 42 C42 38 37 28 38 12Z" ${G} ${S}/>
      <path d="M38 14 C14 6 6 40 32 52 C36 54 38 50 35 48 C20 40 22 20 38 20Z" ${G}/>
      <path d="M62 14 C86 6 94 40 68 52 C64 54 62 50 65 48 C80 40 78 20 62 20Z" ${G}/>
      <path d="M44 56 H56 L60 70 H40Z" ${G}/><rect x="34" y="70" width="32" height="6" rx="1.5" fill="${acc}"/><rect x="30" y="76" width="40" height="12" rx="2" fill="#20242a"/>
      <path d="M42 14 C42 28 45 36 49 40" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>`;
  } else if (shape === 'globe') { // gold globe on a twisted column, coloured band at the base
    body = `<circle cx="50" cy="26" r="18" ${G} ${S}/><ellipse cx="50" cy="26" rx="18" ry="6" fill="none" stroke="url(#${id}d)" stroke-width="1"/><path d="M50 8 C40 20 40 32 50 44 M50 8 C60 20 60 32 50 44" fill="none" stroke="url(#${id}d)" stroke-width="1"/>
      <path d="M40 44 C36 56 44 62 42 74 H58 C56 62 64 56 60 44 C56 50 44 50 40 44Z" ${G} ${S}/>
      <rect x="34" y="74" width="32" height="5" rx="1.5" fill="${acc}"/><rect x="31" y="79" width="38" height="5" rx="1.5" fill="${acc}" opacity=".75"/><rect x="28" y="84" width="44" height="6" rx="2" fill="#1d2a22"/>
      <path d="M40 18 C41 12 46 9 50 9" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/>`;
  } else if (shape === 'goblet') { // goblet with a lid and a ball on top, accent band on the foot
    body = `<circle cx="50" cy="9" r="5" fill="#f3f3f3" stroke="#222" stroke-width="1"/><path d="M47 8 L50 5 L53 8 L52 12 H48Z" fill="#222"/>
      <path d="M36 20 C36 17 40 15 50 15 C60 15 64 17 64 20 Z" ${G}/><path d="M34 22 H66 C66 40 60 48 53 52 L53 60 H47 L47 52 C40 48 34 40 34 22Z" ${G} ${S}/>
      <path d="M34 24 C24 24 24 40 38 42 M66 24 C76 24 76 40 62 42" fill="none" stroke="url(#${id})" stroke-width="3.6" stroke-linecap="round"/>
      <ellipse cx="50" cy="60" rx="8" ry="2.6" ${G}/><path d="M43 62 H57 L61 74 H39Z" ${G}/><rect x="33" y="74" width="34" height="5" rx="1.5" fill="${acc}"/><rect x="28" y="79" width="44" height="10" rx="2" fill="#2d2118"/>
      <path d="M39 26 C39 38 43 44 48 48" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>`;
  } else { // classic two-handled cup
    body = `<path d="M30 14 H70 V34 C70 50 60 58 50 58 C40 58 30 50 30 34Z" ${G} ${S}/>
      <path d="M30 18 C10 16 10 46 33 46 M70 18 C90 16 90 46 67 46" fill="none" stroke="url(#${id})" stroke-width="5" stroke-linecap="round"/>
      <rect x="45" y="57" width="10" height="13" ${G}/><path d="M34 70 H66 L70 80 H30Z" ${G}/><rect x="27" y="80" width="46" height="9" rx="2" fill="#2d2118"/><rect x="31" y="82.5" width="38" height="3.6" rx="1" fill="${acc}"/>
      <rect x="30" y="14" width="40" height="5" rx="1" fill="${acc}" opacity=".9"/><path d="M36 22 C36 36 40 46 47 52" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" fill="none"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" class="tsvg" aria-hidden="true"><defs>
    <linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${m[0]}"/><stop offset="0.3" stop-color="${m[1]}"/><stop offset="0.7" stop-color="${m[2]}"/><stop offset="1" stop-color="${m[3]}"/></linearGradient>
    <linearGradient id="${id}d" x1="0" x2="1"><stop offset="0" stop-color="${m[2]}"/><stop offset="1" stop-color="${m[3]}"/></linearGradient></defs>${body}</svg>`;
}
function ovrTier(o) { return o >= 85 ? 't1' : o >= 75 ? 't2' : o >= 65 ? 't3' : 't4'; }
function ovrBadge(o) { return `<span class="ovr ${ovrTier(o)}">${o}</span>`; }
// form arrow next to the overall (temporary bonus)
const FORM_UI = { 3: ['▲▲', 'f-up', 'Em chamas'], 2: ['▲', 'f-up', 'Grande fase'], 1: ['↗', 'f-up1', 'Boa fase'], '-1': ['↘', 'f-dn1', 'Fase ruim'], '-2': ['▼', 'f-dn', 'Má fase'] };
function formTag(p, withNum) {
  const b = formBonus(p);
  if (!b) return '';
  const [ic, cls, lbl] = FORM_UI[b];
  const n = `${b > 0 ? '+' : ''}${b}`;
  return `<span class="ftag ${cls}" title="${lbl}: ${n} de overall enquanto durar a fase">${ic}${withNum ? n : ''}</span>`;
}
function formLine(p) {
  const b = formBonus(p);
  if (!b) return '<span class="muted">Normal (sem bônus)</span>';
  return `${formTag(p)} <b>${FORM_UI[b][2]}</b> · ${b > 0 ? '+' : ''}${b} de overall (joga como ${formOvr(p)}) <span class="muted">enquanto durar a fase</span>`;
}
function posBadge(p) { return `<span class="pos ${POS_GROUP[p]}">${POS_PT[p]}</span>`; }
function fitBar(p) {
  const f = Math.round(fitnessNow(p));
  const col = f >= 85 ? 'var(--win)' : f >= 70 ? '#c9d84a' : f >= 55 ? 'var(--warn)' : 'var(--loss)';
  return `<span class="fit" title="Condição física ${f}%"><i style="width:${f}%;background:${col}"></i></span>`;
}
function statusFlags(p) {
  let s = '';
  if (isInjured(p)) s += ` <span class="flag-inj" title="${esc(p.injN || 'Lesionado')} até ${fmtDate(p.inj, 'short')}">✚</span>`;
  if (isSuspended(p)) s += ` <span class="flag-sus" title="Suspenso">▮</span>`;
  if (p.tl) s += ` <span class="chip" title="Lista de transferências">À VENDA</span>`;
  if (p.ll) s += ` <span class="chip" title="Lista de empréstimo">EMPR.</span>`;
  if (p.rn && p.t === S.user.team) s += ` <span class="chip" title="Renovação automática ligada">↻ AUTO</span>`;
  if (p.loan) s += ` <span class="chip" title="Emprestado por ${esc(teamName(p.loan.from))}">EMPRESTADO</span>`;
  if (p.pc) s += ` <span class="chip" title="Treinando como ${esc(POS_LONG[p.pc.to].toLowerCase())}">⇄ ${POS_PT[p.pc.to]} ${Math.round(posChangeProgress(p) * 100)}%</span>`;
  return s;
}
function formRow(teamId, n = 5) {
  const res = lastResults(teamId, n);
  const cells = res.map((m) => `<span class="res ${resultLetter(m, teamId)}" title="${esc(teamName(m.h))} ${m.hg}x${m.ag} ${esc(teamName(m.a))}">${resultLetter(m, teamId)}</span>`);
  while (cells.length < n) cells.unshift('<span class="res n">–</span>');
  return `<span class="form-row">${cells.join('')}</span>`;
}
function teamLink(id, size = 22) {
  return `<span class="team-cell" data-a="openTeam" data-id="${id}" style="cursor:pointer">${crest(id, size)}<span class="tn">${esc(teamName(id))}</span></span>`;
}
function playerLink(p) {
  return `<span data-a="openPlayer" data-id="${p.id}" style="cursor:pointer;font-weight:600">${esc(p.n)}</span>`;
}
function starStr(r) {
  const s = stars(r);
  let out = '';
  for (let i = 1; i <= 5; i++) out += s >= i ? '★' : s >= i - 0.5 ? '⯪' : '☆';
  return `<span class="stars" title="${r.toFixed ? r.toFixed(1) : r}">${out}</span>`;
}
function coinPill() { return `<span class="coin-pill" title="${INFINITE_COINS ? 'FutCoins infinitas' : 'FutCoins'}"><span class="coin">F</span>${coinsLabel()}</span>`; }
function money(v) { return fmtMoney(v); }
