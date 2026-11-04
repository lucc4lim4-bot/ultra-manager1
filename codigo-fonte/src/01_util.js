/* ===================== util ===================== */
'use strict';
const DAY_MS = 86400000;

// ---------- seeded RNG (mulberry32) kept in state so saves are deterministic
const RNG = {
  s: 123456789,
  seed(n) { RNG.s = (n >>> 0) || 1; },
  next() {
    let t = (RNG.s += 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },
};
const rnd = () => RNG.next();
const rint = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const rfloat = (a, b) => a + rnd() * (b - a);
const chance = (p) => rnd() < p;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function weighted(items, wfn) {
  let tot = 0;
  const ws = items.map((it) => { const w = Math.max(0, wfn(it)); tot += w; return w; });
  if (tot <= 0) return items[Math.floor(rnd() * items.length)];
  let r = rnd() * tot;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
function gauss() { // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);
const avg = (arr, f) => (arr.length ? sum(arr, f) / arr.length : 0);
const by = (f, dir = 1) => (a, b) => { const x = f(a), y = f(b); return x < y ? -dir : x > y ? dir : 0; };
const uniq = (arr) => [...new Set(arr)];
function binomial(n, p) { let k = 0; for (let i = 0; i < n; i++) if (rnd() < p) k++; return k; }
function poisson(l) {
  if (l > 30) return Math.round(l + Math.sqrt(l) * gauss());
  const L = Math.exp(-l); let k = 0, p = 1;
  do { k++; p *= rnd(); } while (p > L);
  return k - 1;
}

// ---------- dates: integer "day numbers" since epoch, UTC
function dayOf(y, m, d) { return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS); }
function dateOf(day) { return new Date(day * DAY_MS); }
function ymd(day) { const d = dateOf(day); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), w: d.getUTCDay() }; }
const yearOf = (day) => dateOf(day).getUTCFullYear();
const monthOf = (day) => dateOf(day).getUTCMonth() + 1;
const weekday = (day) => dateOf(day).getUTCDay(); // 0 Sun .. 6 Sat
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAYS_S = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_S = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
function fmtDate(day, style) {
  const t = ymd(day);
  if (style === 'long') return `${WEEKDAYS[t.w]}, ${t.d} de ${MONTHS[t.m - 1]} de ${t.y}`;
  if (style === 'hero') return `${WEEKDAYS[t.w].toUpperCase()}, ${String(t.d).padStart(2, '0')} DE ${MONTHS_S[t.m - 1]}`;
  if (style === 'dm') return `${t.d} de ${MONTHS[t.m - 1]}`;
  if (style === 'short') return `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}`;
  if (style === 'wd') return `${WEEKDAYS_S[t.w]} ${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}`;
  return `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}/${t.y}`;
}
// first given weekday (0..6) on/after day
function onOrAfter(day, wd) { return day + ((wd - weekday(day) + 7) % 7); }
function onOrBefore(day, wd) { return day - ((weekday(day) - wd + 7) % 7); }

// ---------- money
function fmtMoney(v, short) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  const a = Math.abs(v), s = v < 0 ? '-' : '';
  if (a >= 1e9) return `${s}€${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}€${(a / 1e6).toFixed(a >= 1e8 || short ? 0 : 1)}M`;
  if (a >= 1e3) return `${s}€${Math.round(a / 1e3)}mil`;
  return `${s}€${Math.round(a)}`;
}
function roundMoney(v) {
  if (v >= 1e7) return Math.round(v / 5e5) * 5e5;
  if (v >= 1e6) return Math.round(v / 1e5) * 1e5;
  if (v >= 1e5) return Math.round(v / 1e4) * 1e4;
  return Math.round(v / 1e3) * 1e3;
}

// ---------- strings / html
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function strip(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
const plural = (n, s, p) => `${n} ${n === 1 ? s : (p || s + 's')}`;
function ordinal(n) { return `${n}º`; }
