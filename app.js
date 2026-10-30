(function(){
'use strict';
/* ===================== util ===================== */

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

/* ===================== world model ===================== */
let S = null;           // current save state
let DATA = null;        // loaded era data (raw)

const POSITIONS = ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST'];
const POS_PT = { GK: 'GOL', RB: 'LD', CB: 'ZAG', LB: 'LE', CDM: 'VOL', CM: 'MC', CAM: 'MEI', RM: 'MD', LM: 'ME', RW: 'PD', LW: 'PE', ST: 'ATA' };
const POS_LONG = { GK: 'Goleiro', RB: 'Lateral direito', CB: 'Zagueiro', LB: 'Lateral esquerdo', CDM: 'Volante', CM: 'Meio-campista', CAM: 'Meia ofensivo', RM: 'Meia direita', LM: 'Meia esquerda', RW: 'Ponta direita', LW: 'Ponta esquerda', ST: 'Atacante' };
const POS_GROUP = { GK: 'GK', RB: 'DEF', CB: 'DEF', LB: 'DEF', CDM: 'MID', CM: 'MID', CAM: 'MID', RM: 'MID', LM: 'MID', RW: 'ATT', LW: 'ATT', ST: 'ATT' };
const GROUP_PT = { GK: 'Goleiros', DEF: 'Defensores', MID: 'Meio-campistas', ATT: 'Atacantes' };

// formation slots: [pos, x (0 left..100 right), y (0 own goal .. 100 opp goal)]
const FORMATIONS = {
  '4-3-3': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['CM', 70, 46], ['CDM', 50, 40], ['CM', 30, 46], ['RW', 82, 72], ['ST', 50, 80], ['LW', 18, 72]],
  '4-4-2': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['RM', 84, 54], ['CM', 60, 46], ['CM', 40, 46], ['LM', 16, 54], ['ST', 60, 78], ['ST', 40, 78]],
  '4-2-3-1': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['CDM', 62, 40], ['CDM', 38, 40], ['RW', 80, 62], ['CAM', 50, 62], ['LW', 20, 62], ['ST', 50, 82]],
  '4-1-4-1': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['CDM', 50, 38], ['RM', 82, 56], ['CM', 62, 52], ['CM', 38, 52], ['LM', 18, 56], ['ST', 50, 80]],
  '4-3-1-2': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['CM', 70, 44], ['CDM', 50, 38], ['CM', 30, 44], ['CAM', 50, 62], ['ST', 62, 80], ['ST', 38, 80]],
  '4-5-1': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['RM', 84, 52], ['CM', 66, 46], ['CDM', 50, 40], ['CM', 34, 46], ['LM', 16, 52], ['ST', 50, 78]],
  '3-5-2': [['GK', 50, 4], ['CB', 72, 20], ['CB', 50, 18], ['CB', 28, 20], ['RM', 88, 50], ['CM', 66, 46], ['CDM', 50, 38], ['CM', 34, 46], ['LM', 12, 50], ['ST', 60, 78], ['ST', 40, 78]],
  '3-4-3': [['GK', 50, 4], ['CB', 72, 20], ['CB', 50, 18], ['CB', 28, 20], ['RM', 86, 48], ['CM', 60, 44], ['CM', 40, 44], ['LM', 14, 48], ['RW', 78, 74], ['ST', 50, 80], ['LW', 22, 74]],
  '5-3-2': [['GK', 50, 4], ['RB', 88, 32], ['CB', 70, 20], ['CB', 50, 18], ['CB', 30, 20], ['LB', 12, 32], ['CM', 68, 48], ['CDM', 50, 42], ['CM', 32, 48], ['ST', 60, 78], ['ST', 40, 78]],
  '5-4-1': [['GK', 50, 4], ['RB', 88, 30], ['CB', 70, 20], ['CB', 50, 18], ['CB', 30, 20], ['LB', 12, 30], ['RM', 82, 54], ['CM', 60, 46], ['CM', 40, 46], ['LM', 18, 54], ['ST', 50, 78]],
};
const FORMATION_LIST = Object.keys(FORMATIONS);

const COMPAT = {
  GK: { GK: 1 },
  CB: { CB: 1, CDM: 0.9, RB: 0.88, LB: 0.88, CM: 0.78 },
  RB: { RB: 1, LB: 0.9, RM: 0.88, CB: 0.86, RW: 0.82, CDM: 0.82, CM: 0.78 },
  LB: { LB: 1, RB: 0.9, LM: 0.88, CB: 0.86, LW: 0.82, CDM: 0.82, CM: 0.78 },
  CDM: { CDM: 1, CM: 0.95, CB: 0.88, CAM: 0.84, RB: 0.8, LB: 0.8 },
  CM: { CM: 1, CDM: 0.95, CAM: 0.94, RM: 0.88, LM: 0.88, RW: 0.82, LW: 0.82 },
  CAM: { CAM: 1, CM: 0.93, ST: 0.88, RW: 0.9, LW: 0.9, RM: 0.88, LM: 0.88, CDM: 0.82 },
  RM: { RM: 1, RW: 0.96, LM: 0.9, CM: 0.88, RB: 0.84, LW: 0.88, CAM: 0.88 },
  LM: { LM: 1, LW: 0.96, RM: 0.9, CM: 0.88, LB: 0.84, RW: 0.88, CAM: 0.88 },
  RW: { RW: 1, RM: 0.96, LW: 0.92, ST: 0.88, CAM: 0.89, LM: 0.88 },
  LW: { LW: 1, LM: 0.96, RW: 0.92, ST: 0.88, CAM: 0.89, RM: 0.88 },
  ST: { ST: 1, CAM: 0.87, RW: 0.88, LW: 0.88, RM: 0.82, LM: 0.82 },
};
function posFit(pl, slotPos) {
  if (pl.p === slotPos) return 1;
  let f;
  if (pl.alt && pl.alt.split(',').includes(slotPos)) f = 0.97;
  else f = (COMPAT[slotPos] && COMPAT[slotPos][pl.p]) || (slotPos === 'GK' || pl.p === 'GK' ? 0.35 : 0.68);
  return pl.pc ? posTrainFit(pl, slotPos, f) : f; // a position being trained (18_positions.js)
}

// ---------- ratings
const ovr = (pl) => pl.o;
function fitnessNow(pl, day = S.date) {
  if (!pl.fitD) return pl.fit ?? 100;
  const days = day - pl.fitD;
  if (days <= 0) return pl.fit;
  const rate = pl.p === 'GK' ? 14 : 11 + (pl.a ? (pl.a[5] - 60) / 20 : 0) - Math.max(0, pl.age - 30) * 0.6;
  return Math.min(100, pl.fit + days * clamp(rate, 6, 16));
}
function setFitness(pl, v, day = S.date) { pl.fit = clamp(Math.round(v), 0, 100); pl.fitD = day; }
const isInjured = (pl, day = S.date) => pl.inj && pl.inj > day;
const isSuspended = (pl) => pl.sus > 0;
function available(pl, day = S.date) { return !isInjured(pl, day) && !isSuspended(pl) && !pl.away; }

// effective rating used in matches
function effRating(pl, slotPos, day = S.date) {
  const fit = fitnessNow(pl, day);
  const fitF = 0.8 + 0.2 * Math.min(1, fit / 92);
  return (pl.o + formBonus(pl)) * posFit(pl, slotPos) * fitF;
}
// temporary overall from the player's form, like FIFA's form arrows: a run of good games gives +1 to +3, a bad run
// -1 or -2. p.form moves after every match (see applyMatchResult) and fades when he stops playing (formDecay)
const FORM_TIERS = [[4, 3], [2.5, 2], [1.2, 1], [-1.8, 0], [-3.6, -1]];
const FORM_BASE = { GK: 6.95, DEF: 6.4, MID: 6.45, ATT: 6.75 }; // average match rating by position
function formBonus(p) {
  const f = p.form || 0;
  for (const [min, b] of FORM_TIERS) if (f >= min) return b;
  return -2;
}
const formOvr = (p) => p.o + formBonus(p);

// ---------- value (Transfermarkt-like scale) & wages
const ERA_MONEY = { 2016: 0.55, 2021: 0.8, 2026: 1.0 };
function moneyFactor() {
  const base = ERA_MONEY[S.era] || 1;
  const years = Math.max(0, yearOf(S.date) - S.era);
  return base * Math.pow(1.035, years);
}
const LEAGUE_VALUE = { BRA: 0.85, ARG: 0.75, MEX: 0.8, USA: 0.8, KSA: 0.8, EGY: 0.6, RSA: 0.6, RUS: 0.8, POR: 0.95, NED: 0.95, TUR: 0.85, GRE: 0.8, UKR: 0.8, SCO: 0.85 };
function playerValue(pl) {
  let o = pl.o;
  if (o > 99) o = 99 + (o - 99) * 0.15; // zoeira monsters
  const age = pl.age;
  const gap = Math.max(0, (pl.pot || o) - o);
  const g = age <= 17 ? 0.6 : age <= 19 ? 0.5 : age <= 21 ? 0.38 : age <= 23 ? 0.24 : age <= 25 ? 0.12 : 0;
  const eff = o + gap * g;
  let v = 150e6 * Math.exp(0.1833 * (eff - 90));
  const ageF = age <= 28 ? 1 : age === 29 ? 0.86 : age === 30 ? 0.72 : age === 31 ? 0.58 : age === 32 ? 0.45 : age === 33 ? 0.34 : age === 34 ? 0.25 : age === 35 ? 0.17 : 0.1;
  v *= ageF;
  const posF = { GK: 0.72, CB: 0.95, RB: 0.88, LB: 0.88, CDM: 0.98, CM: 1, CAM: 1.05, RM: 1, LM: 1, RW: 1.06, LW: 1.06, ST: 1.1 }[pl.p] || 1;
  v *= posF;
  const t = S.teams[pl.t];
  if (t && LEAGUE_VALUE[t.c]) v *= LEAGUE_VALUE[t.c];
  if (pl.ct && pl.ct <= seasonEndYear() && !isFree(pl)) v *= 0.75; // expiring contract
  v *= moneyFactor();
  return roundMoney(Math.max(v, 25e3));
}
function seasonEndYear() { const t = ymd(S.date); return t.m >= 7 ? t.y + 1 : t.y; }
const isFree = (pl) => !pl.t;
function wageDemand(pl, team) {
  const fin = team ? team.fin : 3;
  let o = Math.min(pl.o, 99);
  let w = 350e3 * Math.exp(0.1386 * (o - 90));
  const finF = [0.12, 0.18, 0.3, 0.45, 0.7, 0.9, 1.05][clamp(fin, 0, 6)];
  w *= finF;
  if (pl.age >= 31) w *= 1.05;
  if (pl.age <= 21) w *= 0.7;
  w *= moneyFactor();
  return Math.max(500, Math.round(w / 100) * 100);
}
function weeklyWage(pl) { return pl.w || 0; }

// ---------- names / misc
function teamName(id) { const t = S.teams[id]; return t ? t.n : 'Sem clube'; }
// Portuguese articles for club and country names: "o Flamengo", "a Juventus", "a Argentina", "os Estados Unidos", "Portugal"
const FEM_CLUBS = new Set(['juventus', 'inter', 'roma', 'lazio', 'atalanta', 'fiorentina', 'udinese', 'cremonese', 'sampdoria', 'salernitana', 'realsociedad', 'chapecoense', 'pontepreta', 'portuguesa', 'ferroviaria']);
const NAT_PLURAL = { 'Estados Unidos': 'os', 'Emirados Árabes': 'os', 'Ilhas Faroé': 'as', Filipinas: 'as', Bermudas: 'as' };
const NAT_NO_ART = new Set(['Portugal', 'Israel', 'Angola', 'Cuba', 'Andorra', 'Malta', 'San Marino', 'Gibraltar', 'Liechtenstein', 'Mônaco', 'Cabo Verde', 'Honduras', 'El Salvador',
  'Trinidad e Tobago', 'Moçambique', 'Madagascar', 'Omã', 'Fiji', 'Aruba', 'Curaçao', 'Montserrat', 'Barbados', 'Granada', 'Guam', 'Hong Kong', 'Taipé Chinesa', 'Antígua e Barbuda',
  'São Tomé e Príncipe', 'São Cristóvão', 'Santa Lúcia', 'Vanuatu', 'Belize', 'Camarões', 'Ruanda', 'Belarus', 'Timor-Leste']);
const NAT_FEM = new Set(['Guiné', 'Guiné Equatorial', 'Guiné-Bissau', 'Papua-Nova Guiné', 'Irlanda do Norte', 'Costa do Marfim', 'África do Sul', 'RD Congo', 'Coreia do Norte', 'Coreia do Sul', 'Macedônia do Norte']);
const NAT_MASC = new Set(['Canadá', 'Panamá', 'Gana', 'Quênia']);
function teamArticle(x) {
  const t = typeof x === 'object' ? x : S.teams[x];
  if (!t) return 'o';
  if (!t.isNat) return FEM_CLUBS.has(t.key) ? 'a' : 'o';
  const n = t.n;
  if (NAT_PLURAL[n]) return NAT_PLURAL[n];
  if (NAT_NO_ART.has(n)) return '';
  if (NAT_FEM.has(n)) return 'a';
  if (NAT_MASC.has(n)) return 'o';
  return /a$/.test(strip(n)) ? 'a' : 'o';
}
const ART_FORMS = { o: { o: 'o', a: 'a', os: 'os', as: 'as', '': '' }, do: { o: 'do', a: 'da', os: 'dos', as: 'das', '': 'de' }, no: { o: 'no', a: 'na', os: 'nos', as: 'nas', '': 'em' },
  ao: { o: 'ao', a: 'à', os: 'aos', as: 'às', '': 'a' }, pelo: { o: 'pelo', a: 'pela', os: 'pelos', as: 'pelas', '': 'por' } };
// tA(team, 'do') -> "do Flamengo" / "da Juventus" / "de Portugal"; accepts a team id or a team object
function tA(x, form = 'o') {
  const t = typeof x === 'object' ? x : S.teams[x];
  const w = ART_FORMS[form][teamArticle(t || x)];
  const n = t ? t.n : teamName(x);
  return w ? `${w} ${n}` : n;
}
// competitions: "o Brasileirão", "a Libertadores", "do Mundial de Clubes", "na Premier League"
const MASC_COMPS = /^(Brasileirão|Mundial|Campeonato|Championship|Torneio|Paulistão|Carioca|Mineiro|Gauchão|Paranaense|Catarinense|Baiano|Pernambucano|Cearense|Goiano|Paraense|Mato-Grossense|Alagoano)/;
function cA(name, form = 'o') { return `${ART_FORMS[form][MASC_COMPS.test(name) ? 'o' : 'a']} ${name}`; }
function TA(x, form = 'o') { const v = tA(x, form); return v.charAt(0).toUpperCase() + v.slice(1); }
// agreement for adjectives: classificado / classificada / classificados
function tGen(x, masc) { const a = teamArticle(x); return a === 'a' ? masc.replace(/o$/, 'a') : a === 'os' ? masc + 's' : a === 'as' ? masc.replace(/o$/, 'as') : masc; }
function teamShort(id) { const t = S.teams[id]; return t ? t.s : '—'; }
function natName(code) { const n = S.nations[code]; return n ? n.n : code || '—'; }
function playerName(id) { const p = S.players[id]; return p ? p.n : '?'; }

// ---------- squads
function squadOf(teamId) {
  const t = S.teams[teamId];
  if (!t) return [];
  return t.sq.map((id) => S.players[id]).filter(Boolean);
}
function nationSquad(code) {
  const n = S.nations[code];
  if (!n) return [];
  return (n.sq || []).map((id) => S.players[id]).filter(Boolean);
}

// best XI for formation; returns {xi:[pid], bench:[pid]}
function autoLineup(players, formation, opts = {}) {
  const slots = FORMATIONS[formation] || FORMATIONS['4-3-3'];
  const day = opts.day ?? S.date;
  let pool = players.filter((p) => available(p, day));
  if (opts.rotate) pool = pool.filter((p) => fitnessNow(p, day) >= 62 || pool.length < 14);
  const used = new Set();
  const xi = new Array(slots.length).fill(0);
  // order slots: GK, then by scarcity
  const order = slots.map((s, i) => i).sort((a, b) => (slots[a][0] === 'GK' ? -1 : slots[b][0] === 'GK' ? 1 : 0));
  for (const i of order) {
    const pos = slots[i][0];
    let best = null, bestV = -1;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      const v = effRating(p, pos, day) - (opts.rotate && fitnessNow(p, day) < 75 ? 6 : 0) + (p.loan && p.age <= 23 ? 2 : 0);
      if (v > bestV) { bestV = v; best = p; }
    }
    if (best) { xi[i] = best.id; used.add(best.id); }
  }
  const rest = pool.filter((p) => !used.has(p.id)).sort(by((p) => p.o, -1));
  const bench = [];
  const gk = rest.find((p) => p.p === 'GK');
  if (gk) bench.push(gk.id);
  for (const p of rest) { if (bench.length >= (opts.benchSize || 9)) break; if (!bench.includes(p.id)) bench.push(p.id); }
  return { xi, bench };
}

function teamStrength(teamId, formation) {
  const t = S.teams[teamId];
  const players = squadOf(teamId);
  if (!players.length) return 50;
  const lu = autoLineup(players, formation || t.form || '4-3-3', { day: S.date });
  const xs = lu.xi.map((id) => S.players[id]).filter(Boolean);
  return avg(xs, (p) => p.o);
}
// static reputation (cached, refreshed weekly)
function teamRating(teamId) {
  const t = S.teams[teamId];
  if (!t) return 60;
  if (t._r && t._rD && S.date - t._rD < 7) return t._r;
  const ps = squadOf(teamId).sort(by((p) => p.o, -1)).slice(0, 14);
  t._r = ps.length ? Math.round(avg(ps, (p) => p.o) * 10) / 10 : 55;
  t._rD = S.date;
  return t._r;
}
function nationRating(code) {
  let ps = nationSquad(code);
  if (!ps.length) ps = Object.values(S.players).filter((p) => p.nat === code && !(p.yth > 0) && p.yth !== -1); // before the first call-up
  ps = ps.sort(by((p) => p.o, -1)).slice(0, 14);
  return ps.length ? avg(ps, (p) => p.o) : 55;
}
function stars(r) { // 0.5..5 stars from rating
  return clamp(Math.round(((r - 58) / 26) * 10) / 2, 0.5, 5);
}

/* ===================== calendar (real dates) ===================== */
// FIFA international windows (Saturday of the break) for European season starting in year y
function fifaWeekendsEU(y) {
  const sats = [];
  const sat = (m, d, yy) => onOrAfter(dayOf(yy, m, d), 6);
  sats.push(sat(9, 3, y), sat(10, 8, y), sat(11, 12, y), sat(3, 21, y + 1));
  return sats;
}
function isWCYear(y) { return y % 4 === 2; }

// European league matchdays (season y/y+1)
function euLeagueDates(y, rounds, opts = {}) {
  let start = onOrAfter(dayOf(y, 8, opts.startDay || 15), 6);
  if (isWCYear(y)) start = onOrAfter(dayOf(y, 8, 21), 6);
  const end = onOrBefore(dayOf(y + 1, 5, 25), 6);
  const blocked = new Set(fifaWeekendsEU(y));
  const sats = [];
  for (let d = start; d <= end; d += 7) if (!blocked.has(d)) sats.push(d);
  // midweek rounds in UEFA-free weeks
  const mid = [dayOf(y, 12, 30), dayOf(y, 12, 3), dayOf(y + 1, 4, 22), dayOf(y + 1, 1, 14), dayOf(y + 1, 2, 4),
    dayOf(y, 10, 29), dayOf(y + 1, 3, 4), dayOf(y + 1, 5, 6), dayOf(y, 9, 30), dayOf(y + 1, 2, 25),
    dayOf(y, 11, 26), dayOf(y + 1, 1, 28), dayOf(y, 10, 22), dayOf(y + 1, 4, 8), dayOf(y + 1, 3, 18)]
    .map((d) => onOrAfter(d, 3));
  let dates = sats.slice();
  let i = 0;
  while (dates.length < rounds && i < mid.length) { if (!dates.includes(mid[i])) dates.push(mid[i]); i++; }
  dates.sort((a, b) => a - b);
  if (dates.length < rounds) { // huge leagues (zoeira): add Wednesdays everywhere
    for (let d = onOrAfter(start, 3); d < end && dates.length < rounds; d += 7) if (!dates.includes(d)) dates.push(d);
    dates.sort((a, b) => a - b);
    for (let d = onOrAfter(start, 2); d < end && dates.length < rounds; d += 7) if (!dates.includes(d)) dates.push(d);
    dates.sort((a, b) => a - b);
  }
  if (dates.length > rounds) {
    // drop surplus weekends evenly, keeping first and last
    while (dates.length > rounds) {
      const idx = 1 + Math.floor((dates.length - 2) * ((dates.length - rounds) % 2 ? 0.37 : 0.73));
      dates.splice(idx, 1);
    }
  }
  return dates;
}

// South American calendar-year league
// European leagues played in the calendar year (spring to autumn)
const SPRING_LEAGUES = new Set(['NOR', 'SWE', 'FIN', 'LTU', 'LVA', 'KAZ', 'GEO']);
function saLeagueDates(y, rounds, country) {
  let start = onOrAfter(dayOf(y, 2, 1), 6);
  let end = onOrBefore(dayOf(y, 12, 6), 0) - 1;
  const pause = isWCYear(y) ? [dayOf(y, 6, 6), dayOf(y, 7, 22)] : [dayOf(y, 6, 9), dayOf(y, 6, 12)];
  if (country === 'BRA') start = y === 2026 ? onOrAfter(dayOf(y, 1, 28), 3) : onOrAfter(dayOf(y, 4, 10), 6);
  else if (SPRING_LEAGUES.has(country)) { start = onOrAfter(dayOf(y, 3, 28), 6); end = onOrBefore(dayOf(y, 11, 29), 0) - 1; }
  const sats = [];
  for (let d = onOrAfter(start, 6); d <= end; d += 7) if (!(d >= pause[0] && d <= pause[1])) sats.push(d);
  // Brazilian midweek rounds (Wednesday)
  const weds = [];
  for (let d = onOrAfter(start + 2, 3); d <= end; d += 7) if (!(d >= pause[0] && d <= pause[1])) weds.push(d);
  let dates = sats.slice();
  // spread wednesdays evenly
  const need = Math.max(0, rounds - dates.length);
  if (need > 0) {
    const step = weds.length / need;
    for (let k = 0; k < need && k * step < weds.length; k++) dates.push(weds[Math.floor(k * step + step / 2)] || weds[k]);
  }
  dates = uniq(dates).sort((a, b) => a - b);
  while (dates.length > rounds) dates.splice(Math.floor(dates.length / 2), 1);
  let extra = end;
  while (dates.length < rounds) { extra += 3; dates.push(extra); }
  return dates;
}

// UEFA club competitions: [tuesday-of-week] days for each matchday
function uefaDates(y) {
  const tue = (m, d, yy = y) => onOrAfter(dayOf(yy, m, d), 2);
  return {
    qual: [tue(7, 21), tue(7, 28), tue(8, 4), tue(8, 18), tue(8, 25)],
    league: [tue(9, 16), tue(9, 30), tue(10, 21), tue(11, 4), tue(11, 25), tue(12, 9), tue(1, 20, y + 1), tue(1, 27, y + 1)],
    playoff: [tue(2, 17, y + 1), tue(2, 24, y + 1)],
    r16: [tue(3, 10, y + 1), tue(3, 17, y + 1)],
    qf: [tue(4, 7, y + 1), tue(4, 14, y + 1)],
    sf: [tue(4, 28, y + 1), tue(5, 5, y + 1)],
    final: onOrAfter(dayOf(y + 1, 5, 29), 6),
    finalUEL: onOrAfter(dayOf(y + 1, 5, 19), 3),
    // Conference League: 6 Thursdays from October to mid-December, final on a late-May Wednesday
    ueclLeague: [tue(9, 30) + 2, tue(10, 21) + 2, tue(11, 4) + 2, tue(11, 25) + 2, tue(12, 9) + 2, tue(12, 9) + 9],
    finalUECL: onOrAfter(dayOf(y + 1, 5, 26), 3),
  };
}
// domestic cup rounds (wednesdays in UEFA-free weeks), final on a late-May Saturday
function euCupDates(y, nRounds) {
  const wed = (m, d, yy = y) => onOrAfter(dayOf(yy, m, d), 3);
  const base = [wed(8, 26), wed(9, 23), wed(10, 28), wed(12, 2), wed(1, 14, y + 1), wed(2, 4, y + 1), wed(3, 4, y + 1), wed(4, 22, y + 1)];
  const final = onOrAfter(dayOf(y + 1, 5, 23), 6) + 7;
  const rounds = base.slice(base.length - (nRounds - 1));
  return { rounds, final };
}
function saCupDates(y, nRounds) {
  const wed = (m, d) => onOrAfter(dayOf(y, m, d), 3);
  const base = [wed(2, 18), wed(3, 11), wed(4, 22), wed(5, 13), wed(7, 29), wed(8, 26), wed(9, 16), wed(10, 14)];
  const rounds = base.slice(Math.max(0, base.length - nRounds));
  return { rounds, legGap: 7 };
}
function libertadoresDates(y) {
  const tue = (m, d) => onOrAfter(dayOf(y, m, d), 2);
  return {
    groups: [tue(4, 7), tue(4, 21), tue(5, 5), tue(5, 12), tue(5, 19), tue(5, 26)],
    r16: [tue(8, 11), tue(8, 18)], qf: [tue(9, 15), tue(9, 22)], sf: [tue(10, 20), tue(10, 27)],
    final: onOrAfter(dayOf(y, 11, 25), 6),
  };
}

// Copa Sul-Americana: groups in the Libertadores weeks, play-offs in July, single final a week before the Libertadores one
function sulaDates(y) {
  const tue = (m, d) => onOrAfter(dayOf(y, m, d), 2);
  return {
    groups: [tue(4, 7), tue(4, 21), tue(5, 5), tue(5, 12), tue(5, 19), tue(5, 26)],
    po: tue(7, 14), r16: tue(8, 11) + 1, qf: tue(9, 15) + 1, sf: tue(10, 20) + 1,
    final: onOrAfter(dayOf(y, 11, 18), 6),
  };
}
// Mundial de Clubes in December (FIFA's yearly format): first round, Afro-Asian-Pacific cup, Derby of the Americas,
// Challenger cup and the final against the European champion, all at a neutral venue
function cwcDates(y) {
  const final = onOrAfter(dayOf(y, 12, 15), 3);
  return { r1: final - 11, aap: final - 8, derby: final - 7, chal: final - 4, final };
}

// kick-off times
function kickoffTime(zone, day, idx) {
  const w = weekday(day);
  if (zone === 'SA') {
    if (w === 3) return ['19:00', '21:30', '20:00'][idx % 3];
    if (w === 6) return ['16:00', '18:30', '21:00', '17:00'][idx % 4];
    return ['11:00', '16:00', '18:30', '20:30'][idx % 4];
  }
  if (zone === 'UEFA') return idx % 6 === 0 ? '18:45' : '21:00';
  if (zone === 'INTL') return ['16:00', '19:00', '21:00', '13:00'][idx % 4];
  if (w === 3 || w === 2) return ['19:30', '20:00', '20:45'][idx % 3];
  if (w === 6) return ['12:30', '15:00', '15:00', '17:30', '20:00'][idx % 5];
  if (w === 0) return ['14:00', '16:30', '19:00'][idx % 3];
  return ['20:00', '20:45'][idx % 2];
}
// spread a weekend round over Fri..Mon
function spreadDay(base, idx, total, zone) {
  const w = weekday(base);
  if (w !== 6) return base; // midweek: same day (one day earlier for half)
  const r = idx / Math.max(1, total);
  if (zone === 'SA') return r < 0.45 ? base : base + 1;
  if (r < 0.06) return base - 1;
  if (r < 0.62) return base;
  if (r < 0.95) return base + 1;
  return base + 2;
}

/* ===================== competitions ===================== */
function nextId(kind) { S.seq[kind] = (S.seq[kind] || 0) + 1; return S.seq[kind]; }

// ---------- matches & scheduling
function teamBusy(teamId, day, gap = 2) {
  const list = S.tm[teamId];
  if (!list) return false;
  for (const mid of list) {
    const m = S.matches[mid];
    if (m && Math.abs(m.d - day) < gap) return true;
  }
  return false;
}
function findDay(day, h, a, gap = 2) {
  const tries = [0, 1, -1, 2, -2, 3, 4, -3, 5, 6, 7];
  for (const t of tries) {
    const d = day + t;
    if (d < S.date) continue;
    if (!teamBusy(h, d, gap) && !teamBusy(a, d, gap)) return d;
  }
  return day;
}
function addMatch(comp, roundIdx, day, h, a, opts = {}) {
  const id = nextId('m');
  const d = opts.fixed ? day : findDay(day, h, a, opts.gap || 2);
  const m = { id, c: comp.id, r: roundIdx, d, t: opts.time || kickoffTime(comp.zone, d, opts.idx || 0), h, a, hg: null, ag: null, done: false };
  if (opts.neutral) m.n = 1;
  if (opts.tie) m.tie = opts.tie;
  if (opts.leg) m.leg = opts.leg;
  if (opts.group !== undefined) m.g = opts.group;
  S.matches[id] = m;
  (S.days[d] = S.days[d] || []).push(id);
  (S.tm[h] = S.tm[h] || []).push(id);
  (S.tm[a] = S.tm[a] || []).push(id);
  if (comp.rounds && comp.rounds[roundIdx]) comp.rounds[roundIdx].m.push(id);
  return m;
}
function removeMatchIndex(m) {
  const arr = S.days[m.d];
  if (arr) { const i = arr.indexOf(m.id); if (i >= 0) arr.splice(i, 1); }
}

// ---------- round robin (circle method)
function roundRobin(teams, double = true) {
  const list = teams.slice();
  if (list.length % 2) list.push(0); // 0 = bye
  const n = list.length, rounds = [];
  const fixed = list[0];
  let rot = list.slice(1);
  for (let r = 0; r < n - 1; r++) {
    const arr = [fixed, ...rot];
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      if (!a || !b) continue;
      pairs.push(r % 2 === 0 ? (i === 0 ? [b, a] : [a, b]) : (i === 0 ? [a, b] : [b, a]));
    }
    rounds.push(pairs);
    rot = [rot[rot.length - 1], ...rot.slice(0, -1)];
  }
  if (!double) return rounds;
  return rounds.concat(rounds.map((ps) => ps.map(([a, b]) => [b, a])));
}

// ---------- tables
function blankRow() { return { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; }
function ensureRow(table, id) { return table[id] || (table[id] = blankRow()); }
function applyToTable(table, m) {
  const h = ensureRow(table, m.h), a = ensureRow(table, m.a);
  h.p++; a.p++; h.gf += m.hg; h.ga += m.ag; a.gf += m.ag; a.ga += m.hg;
  if (m.hg > m.ag) { h.w++; a.l++; h.pts += 3; }
  else if (m.hg < m.ag) { a.w++; h.l++; a.pts += 3; }
  else { h.d++; a.d++; h.pts++; a.pts++; }
}
function sortTable(table, teams) {
  const ids = teams || Object.keys(table).map(Number);
  return ids.map((id) => ({ id, ...(table[id] || blankRow()) }))
    .sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || y.w - x.w ||
      (teamName(x.id) < teamName(y.id) ? -1 : 1));
}

// ---------- competition factory
function newComp(o) {
  const c = Object.assign({ id: nextId('c'), rounds: [], table: {}, done: false, teams: [], ties: {}, stage: 0 }, o);
  S.comps[c.id] = c;
  S.active.push(c.id);
  return c;
}

// League
function makeLeague(o) {
  const c = newComp({ kind: 'league', ...o });
  // o.rr round-robin cycles (2 = home and away; small leagues play 3 or 4 times), o.single: once
  const base = roundRobin(shuffle(c.teams.slice()), false);
  let rr = base;
  if (!o.single) {
    rr = [];
    for (let k = 0; k < (o.rr || 2); k++) rr = rr.concat(k % 2 ? base.map((ps) => ps.map(([a, b]) => [b, a])) : base);
  }
  const dates = o.dates || (c.zone === 'SA' ? saLeagueDates(c.year, rr.length, c.country) : euLeagueDates(c.year, rr.length));
  c.teams.forEach((t) => ensureRow(c.table, t));
  rr.forEach((pairs, r) => {
    const base = dates[r] ?? dates[dates.length - 1] + (r - dates.length + 1) * 3;
    const rd = { name: `Rodada ${r + 1}`, d: base, m: [] };
    c.rounds.push(rd);
    pairs.forEach(([h, a], i) => {
      const day = spreadDay(base, i, pairs.length, c.zone);
      addMatch(c, r, day, h, a, { idx: i, time: kickoffTime(c.zone, day, i) });
    });
  });
  return c;
}

// Knockout cup
// o.teams should be ordered by seed (strongest first)
function makeCup(o) {
  const c = newComp({ kind: 'cup', legs: o.legs || 1, ...o });
  c.seeds = o.teams.slice();
  const N = c.seeds.length;
  let P = 1; while (P * 2 <= N) P *= 2;
  c.plan = [];
  if (N > P) c.plan.push({ size: (N - P) * 2, name: 'Fase preliminar' });
  for (let s = P; s >= 2; s /= 2) c.plan.push({ size: s, name: koName(s) });
  c.dates = o.dates; // array of days per plan round (+ final)
  c.alive = c.seeds.slice();
  startCupRound(c, 0);
  return c;
}
function koName(size) {
  return { 2: 'Final', 4: 'Semifinal', 8: 'Quartas de final', 16: 'Oitavas de final', 32: '16-avos de final', 64: '32-avos de final', 128: '64-avos de final' }[size] || `Fase de ${size}`;
}
function startCupRound(c, idx) {
  const pl = c.plan[idx];
  if (!pl) return;
  let entrants;
  if (idx === 0 && c.plan.length > 1 && pl.name === 'Fase preliminar') {
    entrants = c.alive.slice(c.alive.length - pl.size); // weakest play preliminary
  } else entrants = c.alive.slice();
  shuffle(entrants);
  const day = c.dates[idx] ?? (c.rounds.length ? c.rounds[c.rounds.length - 1].d + 21 : S.date + 7);
  const isFinal = pl.size === 2;
  const legs = isFinal ? (c.finalLegs || 1) : c.legs;
  const rd = { name: pl.name, d: day, m: [], ties: [] };
  c.rounds.push(rd);
  const r = c.rounds.length - 1;
  for (let i = 0; i + 1 < entrants.length; i += 2) {
    const a = entrants[i], b = entrants[i + 1];
    const tieId = nextId('tie');
    const tie = { id: tieId, r, a, b, m: [], w: 0 };
    c.ties[tieId] = tie;
    rd.ties.push(tieId);
    if (legs === 2) {
      const m1 = addMatch(c, r, day, a, b, { tie: tieId, leg: 1, idx: i });
      const m2 = addMatch(c, r, m1.d + (c.legGap || 7), b, a, { tie: tieId, leg: 2, idx: i });
      tie.m = [m1.id, m2.id];
    } else {
      const m1 = addMatch(c, r, day, a, b, { tie: tieId, idx: i, neutral: isFinal && !c.homeFinal });
      tie.m = [m1.id];
    }
  }
}
function tieWinner(c, tie) {
  const ms = tie.m.map((id) => S.matches[id]);
  if (!ms.every((m) => m.done)) return 0;
  let ga = 0, gb = 0;
  for (const m of ms) {
    if (m.h === tie.a) { ga += m.hg; gb += m.ag; } else { ga += m.ag; gb += m.hg; }
  }
  if (ga > gb) return tie.a;
  if (gb > ga) return tie.b;
  const last = ms[ms.length - 1];
  if (last.pen) {
    const [ph, pa] = last.pen;
    const homeWins = ph > pa;
    return homeWins ? last.h : last.a;
  }
  return tie.a;
}
// called when a cup match finishes; returns true if the tie needs ET/pens decided (handled in sim)
function cupAfterMatch(c, m) {
  const tie = c.ties[m.tie];
  if (!tie) return;
  const w = tieWinner(c, tie);
  if (w) tie.w = w;
  if (c.cwc) { if (w) cwcAdvance(c); return; }
  const rd = c.rounds[tie.r];
  if (rd.ties.every((tid) => c.ties[tid].w)) {
    // round complete
    const winners = rd.ties.map((tid) => c.ties[tid].w);
    const losers = rd.ties.map((tid) => { const t = c.ties[tid]; return t.w === t.a ? t.b : t.a; });
    if (c.isQual) { c.done = true; launchUEFALeagues(c); return; }
    if (c.plan && c.plan[c.stage] && c.plan[c.stage].name === 'Fase preliminar') {
      c.alive = c.alive.filter((id) => !losers.includes(id));
    } else c.alive = winners;
    c.stage++;
    if (rd.name === 'Final' || c.alive.length === 1) {
      finishComp(c, c.alive[0], losers[0]);
    } else if (c.onStageDone) STAGE_HOOKS[c.onStageDone](c);
    else startCupRound(c, c.stage);
  }
}
// does the match decide a tie (needs extra-time/penalties if level)?
function matchNeedsDecider(m) {
  const c = S.comps[m.c];
  if (!c || !m.tie) return false;
  const tie = c.ties[m.tie];
  if (!tie) return false;
  const lastId = tie.m[tie.m.length - 1];
  return lastId === m.id;
}
function tieAggregateBefore(m) { // goals of first leg from perspective of m.h
  const c = S.comps[m.c];
  const tie = c.ties[m.tie];
  let gh = 0, ga = 0;
  for (const id of tie.m) {
    if (id === m.id) continue;
    const x = S.matches[id];
    if (!x.done) continue;
    if (x.h === m.h) { gh += x.hg; ga += x.ag; } else { gh += x.ag; ga += x.hg; }
  }
  return [gh, ga];
}

// ---------- Swiss league phase (UCL/UEL style, 36 teams, 8 matchdays)
function makeSwiss(o) {
  const c = newComp({ kind: 'swiss', ...o });
  const teams = c.teams.slice();
  const nRounds = o.nRounds || 8, nPots = o.nPots || 4; // Conference League: 6 matchdays, 6 pots
  const potSize = Math.ceil(teams.length / nPots), perPot = nRounds / nPots;
  const pots = Array.from({ length: nPots }, (_, i) => teams.slice(i * potSize, i * potSize + potSize));
  const potOf = {}; pots.forEach((p, i) => p.forEach((t) => (potOf[t] = i)));
  const ctry = (t) => S.teams[t].c;
  // choose the rounds from a full round robin that balance pots and avoid same-country
  let best = null, bestScore = -1e9;
  for (let attempt = 0; attempt < 160; attempt++) {
    const order = shuffle(teams.slice());
    const rr = roundRobin(order, false);
    const idx = shuffle(rr.map((_, i) => i)).slice(0, nRounds);
    const rounds = idx.map((i) => rr[i]);
    let score = 0;
    const cnt = {};
    for (const pairs of rounds) for (const [a, b] of pairs) {
      if (ctry(a) && ctry(a) === ctry(b)) score -= 6;
      const ka = a + ':' + potOf[b], kb = b + ':' + potOf[a];
      cnt[ka] = (cnt[ka] || 0) + 1; cnt[kb] = (cnt[kb] || 0) + 1;
    }
    for (const k in cnt) score -= Math.abs(cnt[k] - perPot) * 2;
    if (score > bestScore) { bestScore = score; best = rounds; }
  }
  // orient home/away to balance 4/4
  const home = {}; teams.forEach((t) => (home[t] = 0));
  const all = [];
  best.forEach((pairs, r) => pairs.forEach((p) => all.push([r, p])));
  for (const [r, p] of all) {
    let [a, b] = p;
    if (home[a] > home[b]) [a, b] = [b, a];
    home[a]++;
    p[0] = a; p[1] = b;
  }
  const dates = o.dates;
  teams.forEach((t) => ensureRow(c.table, t));
  best.forEach((pairs, r) => {
    const rd = { name: `Rodada ${r + 1}`, d: dates[r], m: [] };
    c.rounds.push(rd);
    pairs.forEach(([h, a], i) => {
      const day = dates[r] + (i % 2); // tue/wed (or thu/fri for UEL offset)
      addMatch(c, r, day, h, a, { idx: i, time: kickoffTime('UEFA', day, i), fixed: false });
    });
  });
  c.leaguePhaseRounds = best.length;
  return c;
}

// ---------- groups (Libertadores / World Cup / Euro / Copa América / qualifiers)
function makeGroups(o) {
  const c = newComp({ kind: 'groups', ...o });
  // o.groups: arrays of team ids
  c.groups = o.groups.map((ts, i) => ({ name: o.groupNames ? o.groupNames[i] : String.fromCharCode(65 + i), teams: ts, table: {} }));
  const double = !!o.double;
  let maxR = 0;
  c.groups.forEach((g, gi) => {
    g.teams.forEach((t) => ensureRow(g.table, t));
    const rr = roundRobin(g.teams.slice(), double);
    maxR = Math.max(maxR, rr.length);
    rr.forEach((pairs, r) => {
      if (!c.rounds[r]) c.rounds[r] = { name: `${o.roundLabel || 'Rodada'} ${r + 1}`, d: o.dates[r], m: [] };
      pairs.forEach(([h, a], i) => {
        const base = o.dates[r] ?? (o.dates[o.dates.length - 1] + (r - o.dates.length + 1) * 4);
        const day = base + (o.spread ? ((gi + i) % (o.spread)) : 0);
        addMatch(c, r, day, h, a, { idx: gi * 2 + i, neutral: !!o.neutral, group: gi, time: kickoffTime(o.zone === 'INTL' ? 'INTL' : c.zone, day, gi + i), gap: 2 });
      });
    });
  });
  c.groupRounds = maxR;
  return c;
}
function groupStageDone(c) {
  for (let r = 0; r < c.groupRounds; r++) {
    const rd = c.rounds[r];
    if (!rd || !rd.m.every((id) => S.matches[id].done)) return false;
  }
  return true;
}

// ---------- results
function recordResult(m) {
  const c = S.comps[m.c];
  if (!c) return;
  if (c.state) { stateRecord(c, m); return; } // state championships (17_states.js)
  if (c.kind === 'league' || (c.kind === 'swiss' && m.r < c.leaguePhaseRounds)) applyToTable(c.table, m);
  if (c.kind === 'groups' && m.g !== undefined && m.r < c.groupRounds) applyToTable(c.groups[m.g].table, m);
  if (m.tie) cupAfterMatch(c, m);
  if (c.kind === 'league') {
    if (c.rounds.every((rd) => rd.m.every((id) => S.matches[id].done))) {
      const tab = sortTable(c.table, c.teams);
      finishComp(c, tab[0].id, tab[1] && tab[1].id);
    }
  } else if (c.kind === 'swiss' && !c.koStarted && m.r < c.leaguePhaseRounds) {
    let done = true;
    for (let r = 0; r < c.leaguePhaseRounds; r++) if (!c.rounds[r].m.every((id) => S.matches[id].done)) { done = false; break; }
    if (done) { c.koStarted = true; swissToKO(c); }
  } else if (c.kind === 'groups' && !c.koStarted && m.r < c.groupRounds) {
    if (groupStageDone(c)) { c.koStarted = true; groupsToKO(c); }
  }
}

function swissToKO(c) {
  const tab = sortTable(c.table, c.teams);
  c.finalTable = tab.map((r) => r.id);
  const top8 = tab.slice(0, 8).map((r) => r.id);
  const po = tab.slice(8, 24).map((r) => r.id);
  c.top8 = top8;
  // playoff: 9v24, 10v23 ...
  const d = c.koDates;
  c.plan = [{ size: 16, name: 'Playoffs' }, { size: 16, name: 'Oitavas de final' }, { size: 8, name: 'Quartas de final' }, { size: 4, name: 'Semifinal' }, { size: 2, name: 'Final' }];
  c.stage = 0;
  const rd = { name: 'Playoffs', d: d[0], m: [], ties: [] };
  c.rounds.push(rd);
  const r = c.rounds.length - 1;
  for (let i = 0; i < 8; i++) {
    const hi = po[i], lo = po[15 - i];
    const tieId = nextId('tie');
    const tie = { id: tieId, r, a: hi, b: lo, m: [], w: 0 };
    c.ties[tieId] = tie; rd.ties.push(tieId);
    const m1 = addMatch(c, r, d[0], lo, hi, { tie: tieId, leg: 1, idx: i, time: kickoffTime('UEFA', d[0], i) });
    const m2 = addMatch(c, r, m1.d + 7, hi, lo, { tie: tieId, leg: 2, idx: i, time: kickoffTime('UEFA', m1.d + 7, i) });
    tie.m = [m1.id, m2.id];
  }
  c.onStageDone = 'uefaKO';
  c.alive = po;
}
const STAGE_HOOKS = {
  uefaKO(c) {
    const d = c.koDates;
    const idx = c.stage; // 1 = R16, 2 = QF, 3 = SF, 4 = Final
    let entrants;
    if (idx === 1) {
      const rdPrev = c.rounds[c.rounds.length - 1];
      const winners = rdPrev.ties.map((tid) => c.ties[tid].w);
      entrants = [];
      const w = shuffle(winners.slice());
      c.top8.forEach((t, i) => entrants.push([t, w[i]]));
    } else {
      const rdPrev = c.rounds[c.rounds.length - 1];
      const winners = shuffle(rdPrev.ties.map((tid) => c.ties[tid].w));
      entrants = [];
      for (let i = 0; i + 1 < winners.length; i += 2) entrants.push([winners[i], winners[i + 1]]);
    }
    const name = c.plan[idx].name;
    const day = d[idx];
    const rd = { name, d: day, m: [], ties: [] };
    c.rounds.push(rd);
    const r = c.rounds.length - 1;
    entrants.forEach(([hi, lo], i) => {
      const tieId = nextId('tie');
      const tie = { id: tieId, r, a: hi, b: lo, m: [], w: 0 };
      c.ties[tieId] = tie; rd.ties.push(tieId);
      if (name === 'Final') {
        const m1 = addMatch(c, r, day, hi, lo, { tie: tieId, neutral: true, time: '21:00', idx: i });
        tie.m = [m1.id];
      } else {
        const m1 = addMatch(c, r, day, lo, hi, { tie: tieId, leg: 1, idx: i, time: kickoffTime('UEFA', day, i) });
        const m2 = addMatch(c, r, m1.d + 7, hi, lo, { tie: tieId, leg: 2, idx: i, time: kickoffTime('UEFA', m1.d + 7, i) });
        tie.m = [m1.id, m2.id];
      }
    });
  },
  // Sul-Americana: after the play-offs the group winners meet the play-off winners (2nd leg at the group winner's home)
  sulaKO(c) {
    const idx = c.stage;
    const step = c.koPlan[idx];
    const rdPrev = c.rounds[c.rounds.length - 1];
    const winners = shuffle(rdPrev.ties.map((tid) => c.ties[tid].w));
    if (idx === 1 && c.groupWinners) {
      const gw = shuffle(c.groupWinners.slice());
      createKORound(c, step, gw.map((g, i) => [g, winners[i]]).filter(([a, b]) => a && b));
      return;
    }
    const pairs = [];
    for (let i = 0; i + 1 < winners.length; i += 2) pairs.push([winners[i], winners[i + 1]]);
    createKORound(c, step, pairs);
  },
  groupKO(c) {
    // generic: next round from winners (random pairing), using c.koPlan
    const idx = c.stage;
    const step = c.koPlan[idx];
    const rdPrev = c.rounds[c.rounds.length - 1];
    const winners = shuffle(rdPrev.ties.map((tid) => c.ties[tid].w));
    const losers = rdPrev.ties.map((tid) => { const t = c.ties[tid]; return t.w === t.a ? t.b : t.a; });
    createKORound(c, step, winners.map((w, i) => (i % 2 === 0 ? [w, winners[i + 1]] : null)).filter(Boolean));
  },
};
function createKORound(c, step, pairs) {
  const rd = { name: step.name, d: step.d, m: [], ties: [] };
  c.rounds.push(rd);
  const r = c.rounds.length - 1;
  pairs.forEach(([a, b], i) => {
    const tieId = nextId('tie');
    const tie = { id: tieId, r, a, b, m: [], w: 0 };
    c.ties[tieId] = tie; rd.ties.push(tieId);
    const legs = step.legs || 1;
    const day = step.d + (step.spread ? (i % step.spread) : 0);
    if (legs === 2) {
      const m1 = addMatch(c, r, day, b, a, { tie: tieId, leg: 1, idx: i });
      const m2 = addMatch(c, r, m1.d + 7, a, b, { tie: tieId, leg: 2, idx: i });
      tie.m = [m1.id, m2.id];
    } else {
      const m1 = addMatch(c, r, day, a, b, { tie: tieId, idx: i, neutral: !!step.neutral || c.neutral });
      tie.m = [m1.id];
    }
  });
}
function groupsToKO(c) {
  const tabs = c.groups.map((g) => sortTable(g.table, g.teams));
  c.groupFinal = tabs.map((t) => t.map((r) => r.id));
  if (c.qualOnly) { finishQualifiers(c); return; }
  // Sul-Americana: the play-offs need the Libertadores group stage (its 3rd-placed clubs drop down)
  if (c.koCustom === 'sula') { c.waitLib = true; sulaPlayoffs(c.year); return; }
  if (c.koCustom === 'top4') {
    const A = tabs[0].map((r) => r.id), B = tabs[1].map((r) => r.id);
    c.stage = 0; c.onStageDone = 'groupKO';
    createKORound(c, c.koPlan[0], [[A[0], B[3]], [A[1], B[2]], [B[0], A[3]], [B[1], A[2]]]);
    return;
  }
  const firsts = tabs.map((t) => t[0].id), seconds = tabs.map((t) => t[1].id);
  let thirds = [];
  if (c.bestThirds) {
    thirds = tabs.map((t) => t[2]).filter(Boolean).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf).slice(0, c.bestThirds).map((r) => r.id);
  }
  c.stage = 0;
  c.onStageDone = 'groupKO';
  const step = c.koPlan[0];
  // pair: winners vs (runners-up/thirds), avoid same group when possible
  const strong = firsts.slice();
  let weak = seconds.concat(thirds);
  if (strong.length < weak.length) { // e.g. WC48: 12 winners + 4 best runners? keep simple: top seeds = winners + best runners
    const extra = weak.length - strong.length;
    const rs = tabs.map((t) => t[1]).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga)).slice(0, extra / 2).map((r) => r.id);
    strong.push(...rs);
    weak = weak.filter((id) => !rs.includes(id));
  }
  shuffle(weak);
  const groupOf = {}; c.groups.forEach((g, gi) => g.teams.forEach((t) => (groupOf[t] = gi)));
  const pairs = [];
  for (const s of strong) {
    let j = weak.findIndex((w) => groupOf[w] !== groupOf[s]);
    if (j < 0) j = 0;
    pairs.push([s, weak[j]]);
    weak.splice(j, 1);
  }
  createKORound(c, step, pairs);
  if (c.key === 'LIB') sulaPlayoffs(c.year);
}

// ---------- completion & history
function finishComp(c, champion, runnerUp) {
  if (c.done) return;
  c.done = true;
  c.champion = champion;
  c.runnerUp = runnerUp;
  const ts = topScorers(c.id, 1)[0];
  const entry = { key: c.key, name: c.name, season: c.season, year: c.year, ch: champion, ru: runnerUp || 0,
    chN: teamName(champion), ruN: runnerUp ? teamName(runnerUp) : '', ts: ts ? [ts.name, ts.goals, teamShort(ts.team)] : null };
  if (c.kind === 'league') entry.table = sortTable(c.table, c.teams).slice(0, 6).map((r) => [r.id, r.pts]);
  S.hist.push(entry);
  (S.titles[champion] = S.titles[champion] || []).push({ key: c.key, name: c.name, season: c.season });
  onCompFinished(c, entry);
  // the Libertadores champion goes to the Mundial de Clubes in December
  if (c.key === 'LIB' && S.mode === 'normal') createClubWorldCup(c.year);
}

// ---------- top scorers (from player season stats)
function topScorers(compId, n = 20, field = 'g') {
  const rows = [];
  for (const id in S.players) {
    const p = S.players[id];
    const st = p.st && p.st[compId];
    if (!st) continue;
    const v = field === 'g' ? st[1] : field === 'a' ? st[2] : st[0];
    if (v > 0) rows.push({ pid: p.id, name: p.n, team: st[5] || p.t, goals: st[1], assists: st[2], apps: st[0], v });
  }
  rows.sort((x, y) => y.v - x.v || y.goals - x.goals || x.apps - y.apps);
  return rows.slice(0, n);
}

// matches helpers
function teamMatches(teamId) { return (S.tm[teamId] || []).map((id) => S.matches[id]).filter(Boolean).sort(by((m) => m.d)); }
function lastResults(teamId, n = 5, before = Infinity) {
  return teamMatches(teamId).filter((m) => m.done && m.d <= before).slice(-n);
}
function resultLetter(m, teamId) {
  const gf = m.h === teamId ? m.hg : m.ag, ga = m.h === teamId ? m.ag : m.hg;
  if (gf > ga) return 'V';
  if (gf < ga) return 'D';
  if (m.pen) { const [ph, pa] = m.pen; const won = m.h === teamId ? ph > pa : pa > ph; return won ? 'V' : 'D'; }
  return 'E';
}
function nextMatch(teamId, fromDay = S.date) {
  return teamMatches(teamId).find((m) => !m.done && m.d >= fromDay);
}

/* ===================== match simulation ===================== */
// side preparation -----------------------------------------------------------
function teamPlayersFor(teamId) {
  const t = S.teams[teamId];
  if (t.isNat) return nationSquad(t.code);
  return squadOf(teamId);
}
function prepareSide(teamId, m) {
  const t = S.teams[teamId];
  const isUser = isUserTeam(teamId);
  const players = teamPlayersFor(teamId);
  const formation = t.form || '4-3-3';
  let xi, bench;
  if (isUser && t.xi && t.xi.length === 11) {
    // validate user's lineup, auto-replace unavailable
    const slots = FORMATIONS[formation];
    const avail = new Set(players.filter((p) => available(p, m.d)).map((p) => p.id));
    xi = t.xi.slice();
    bench = (t.bench || []).filter((id) => avail.has(id) && !xi.includes(id));
    const used = new Set(xi.filter((id) => avail.has(id)));
    xi = xi.map((id, i) => {
      if (id && avail.has(id)) return id;
      const pos = slots[i][0];
      const cand = players.filter((p) => avail.has(p.id) && !used.has(p.id)).sort(by((p) => effRating(p, pos, m.d), -1))[0];
      if (cand) { used.add(cand.id); bench = bench.filter((b) => b !== cand.id); return cand.id; }
      return 0;
    });
    if (bench.length < 7) {
      const extra = players.filter((p) => avail.has(p.id) && !used.has(p.id) && !bench.includes(p.id)).sort(by((p) => p.o, -1));
      for (const p of extra) { if (bench.length >= 9) break; bench.push(p.id); }
    }
  } else {
    const lu = autoLineup(players, formation, { day: m.d, rotate: true });
    xi = lu.xi; bench = lu.bench;
  }
  return { id: teamId, form: formation, slots: FORMATIONS[formation].map((s) => s[0]), xi: xi.slice(), bench: bench.slice(), mentality: t.ment || 0 };
}

function sideRatings(side, day) {
  let att = 0, attW = 0, mid = 0, midW = 0, def = 0, defW = 0, gk = 60;
  side.on.forEach((pid, i) => {
    const p = S.players[pid];
    if (!p) return;
    const pos = side.slotsOn[i];
    const r = effRating(p, pos, day);
    const g = POS_GROUP[pos];
    if (g === 'GK') gk = r;
    else if (g === 'DEF') { def += r; defW++; if (pos !== 'CB') { mid += r * 0.3; midW += 0.3; } }
    else if (g === 'MID') { mid += r; midW++; if (pos === 'CAM' || pos === 'RM' || pos === 'LM') { att += r * 0.6; attW += 0.6; } else { def += r * 0.4; defW += 0.4; } }
    else { att += r; attW++; mid += r * 0.25; midW += 0.25; }
  });
  const A = attW ? att / attW : 45, M = midW ? mid / midW : 45, D = defW ? def / defW : 45;
  // missing players (red cards) penalties
  const n = side.on.filter(Boolean).length;
  const pen = (11 - n) * 4.5;
  return { A: A - pen, M: M - pen, D: (D * 0.75 + gk * 0.25) - pen, GK: gk };
}

// state ------------------------------------------------------------------------
function startMatchState(m, opts = {}) {
  const sides = [prepareSide(m.h, m), prepareSide(m.a, m)];
  const st = { mid: m.id, min: 0, half: 1, score: [0, 0], ev: [], sides, done: false,
    stats: { sh: [0, 0], sot: [0, 0], cor: [0, 0], fo: [0, 0], yc: [0, 0], rc: [0, 0], poss: [50, 50], off: [0, 0] },
    mins: {}, rate: [1, 1], subsLeft: [5, 5], subWindows: [3, 3], ratings: {}, injured: [], stoppage: [rint(1, 4), rint(2, 7)], user: opts.user };
  sides.forEach((s, k) => {
    s.on = s.xi.slice(); s.slotsOn = s.slots.slice(); s.out = [];
    s.on.forEach((pid) => { if (pid) { st.mins[pid] = { in: 0, out: null }; st.ratings[pid] = 6.3; } });
  });
  computeRates(st, m);
  return st;
}
function computeRates(st, m) {
  const day = m.d;
  const R = st.sides.map((s) => sideRatings(s, day));
  st.R = R;
  const neutral = !!m.n;
  const homeAdv = neutral ? 1 : 1.0;
  const zo = S.zoeira;
  let xh = 1.42 * Math.exp(0.066 * (R[0].A - R[1].D)) * Math.exp(0.02 * (R[0].M - R[1].M));
  let xa = (neutral ? 1.42 : 1.1) * Math.exp(0.066 * (R[1].A - R[0].D)) * Math.exp(0.02 * (R[1].M - R[0].M));
  xh *= homeAdv;
  // mentality: + attacking raises both own xg and opponent xg
  const mh = st.sides[0].mentality || 0, ma = st.sides[1].mentality || 0;
  xh *= 1 + mh * 0.12 - ma * 0.06; xa *= 1 + ma * 0.12 - mh * 0.06;
  const cap = zo ? 11 : 4.2;
  st.xg = [clamp(xh, 0.15, cap), clamp(xa, 0.12, cap)];
  const poss = clamp(50 + 2.2 * (R[0].M - R[1].M) + (neutral ? 0 : 3), 26, 74);
  st.stats.poss = [Math.round(poss), 100 - Math.round(poss)];
  st.shotRate = st.xg.map((x) => (8 + 4.2 * x) / 90);
}
function pidName(pid) { const p = S.players[pid]; return p ? p.s || p.n : pid === 0 ? 'Gol contra' : '?'; }

// pick helpers
const SCORE_W = { ST: 5, LW: 3.2, RW: 3.2, CAM: 2.6, LM: 1.8, RM: 1.8, CM: 1.15, CDM: 0.55, LB: 0.45, RB: 0.45, CB: 0.5, GK: 0.01 };
const ASSIST_W = { CAM: 3, LW: 2.8, RW: 2.8, LM: 2.4, RM: 2.4, CM: 2, ST: 1.6, LB: 1.4, RB: 1.4, CDM: 1, CB: 0.4, GK: 0.05 };
function pickScorer(side) {
  const opts = side.on.map((pid, i) => ({ pid, pos: side.slotsOn[i] })).filter((x) => x.pid);
  return weighted(opts, (x) => { const p = S.players[x.pid]; const sh = p.a ? p.a[1] : p.o; return SCORE_W[x.pos] * Math.pow(Math.max(20, x.pos === 'GK' ? 20 : sh) / 70, 2.2); }).pid;
}
function pickAssister(side, scorer) {
  const opts = side.on.map((pid, i) => ({ pid, pos: side.slotsOn[i] })).filter((x) => x.pid && x.pid !== scorer);
  if (!opts.length) return 0;
  return weighted(opts, (x) => { const p = S.players[x.pid]; const pa = p.a ? p.a[2] : p.o; return ASSIST_W[x.pos] * Math.pow(Math.max(20, pa) / 70, 2); }).pid;
}
function pickAny(side, excludeGK = true) {
  const opts = side.on.map((pid, i) => ({ pid, pos: side.slotsOn[i] })).filter((x) => x.pid && (!excludeGK || x.pos !== 'GK'));
  return opts.length ? pick(opts).pid : 0;
}
function pickDefender(side) {
  const opts = side.on.map((pid, i) => ({ pid, pos: side.slotsOn[i] })).filter((x) => x.pid && x.pos !== 'GK');
  return opts.length ? weighted(opts, (x) => (POS_GROUP[x.pos] === 'DEF' ? 3 : POS_GROUP[x.pos] === 'MID' ? 2 : 1)).pid : 0;
}
function gkOf(side) { const i = side.slotsOn.indexOf('GK'); return i >= 0 ? side.on[i] : 0; }
function addRating(st, pid, v) { if (pid && st.ratings[pid] !== undefined) st.ratings[pid] += v; }

// event phrases
const PH = {
  goal: ['GOOOL! {p} balança a rede!', 'GOL! {p} finaliza com categoria!', 'É GOL! {p} não perdoa!', 'GOLAÇO de {p}!', 'GOL! {p} completa para o fundo das redes!', 'GOOOL! {p} estufa a rede!', 'É dele! {p} marca!', 'GOL! {p} bate firme e não dá chance ao goleiro!', 'Que golaço! {p} acerta o ângulo!', 'GOL! {p} aparece livre e empurra para as redes!'],
  saveH: ['{g} faz grande defesa no chute de {p}.', 'Que defesa de {g}! {p} quase marcou.', '{p} bate firme, {g} espalma.', '{g} voa e faz milagre no chute de {p}!', '{p} bate cruzado, {g} defende firme.', 'Defesaça de {g}! {p} não acredita.', '{g} encaixa a finalização de {p}.'],
  miss: ['{p} chuta por cima do gol.', '{p} arrisca de longe, para fora.', 'Finalização de {p} passa raspando a trave!', '{p} cabeceia à direita do gol.', 'Na trave! {p} quase abre o placar.', '{p} isola a bola!', '{p} pega mal e a bola sai à esquerda.', 'Chute de {p} tira tinta da trave!', '{p} cabeceia para fora, com perigo.'],
  yellow: ['Cartão amarelo para {p}.', '{p} recebe o amarelo por falta dura.', 'Amarelo para {p} após reclamação.', '{p} leva amarelo por segurar o adversário.', 'Amarelo para {p}, que chegou atrasado na dividida.'],
  red: ['CARTÃO VERMELHO! {p} está expulso!', 'Segundo amarelo para {p}, expulso!'],
  corner: ['Escanteio para {t}.'],
  injury: ['{p} sente lesão e precisa de atendimento.'],
  chance: ['Boa jogada de {p} pelo lado.', '{p} tenta o passe em profundidade.', 'Pressão no campo de ataque, com {t} rondando a área.', '{p} arranca com a bola dominada.', '{p} dá um lindo passe, mas ninguém chega.', 'Contra-ataque perigoso puxado por {p}.', '{p} recebe na área, a zaga corta na hora certa.', 'Escanteio cobrado por {p}, a defesa afasta.'],
};
function phrase(k, o) { return pick(PH[k]).replace('{p}', o.p || '').replace('{g}', o.g || '').replace('{t}', o.t || ''); }

function evAdd(st, e) { if (e.h === undefined) e.h = st.half || 1; st.ev.push(e); return e; }

// simulate minutes [from, to] inclusive-exclusive of minute counter (minute numbers 1..)
function simulateRange(st, m, toMin) {
  const zo = S.zoeira;
  while (st.min < toMin) {
    st.min++;
    const minute = st.min;
    for (let k = 0; k < 2; k++) {
      const side = st.sides[k], opp = st.sides[1 - k];
      const diff = st.score[k] - st.score[1 - k];
      let mult = st.rate[k];
      if (diff < 0) mult *= minute > 70 ? 1.22 : 1.1;
      else if (diff > 0) mult *= minute > 70 ? 0.85 : 0.94;
      if (minute > 75) mult *= 1.06; // late tiredness
      const pShot = st.shotRate[k] * mult;
      if (rnd() < pShot) {
        st.stats.sh[k]++;
        const shooter = pickScorer(side);
        const conv = clamp(st.xg[k] / Math.max(1, st.shotRate[k] * 90), 0.04, zo ? 0.7 : 0.42) * (zo ? 1 : diff >= 3 ? 0.55 : diff >= 2 ? 0.72 : 1);
        const onTarget = rnd() < 0.38 + conv * 0.5;
        if (onTarget) st.stats.sot[k]++;
        if (onTarget && rnd() < conv / (0.38 + conv * 0.5)) {
          // GOAL
          const assist = rnd() < 0.74 ? pickAssister(side, shooter) : 0;
          st.score[k]++;
          st.rate[k] *= 0.86; st.rate[1 - k] *= 1.05;
          addRating(st, shooter, 1.1); addRating(st, assist, 0.6);
          addRating(st, gkOf(opp), -0.35);
          evAdd(st, { min: minute, t: 'goal', s: k, p: shooter, p2: assist, sc: st.score.slice(), txt: phrase('goal', { p: pidName(shooter) }) + (assist ? ` Assistência de ${pidName(assist)}.` : '') });
        } else if (onTarget) {
          const gk = gkOf(opp);
          addRating(st, gk, 0.22); addRating(st, shooter, 0.08);
          if (rnd() < 0.55) evAdd(st, { min: minute, t: 'save', s: k, p: shooter, p2: gk, txt: phrase('saveH', { p: pidName(shooter), g: pidName(gk) }) });
          if (rnd() < 0.35) { st.stats.cor[k]++; }
        } else {
          if (rnd() < 0.4) evAdd(st, { min: minute, t: 'miss', s: k, p: shooter, txt: phrase('miss', { p: pidName(shooter) }) });
          if (rnd() < 0.25) st.stats.cor[k]++;
        }
      } else if (rnd() < 0.012) {
        evAdd(st, { min: minute, t: 'chance', s: k, p: pickAny(side), txt: phrase('chance', { p: pidName(pickAny(side)), t: tA(side.id) }) });
      }
      // fouls & cards
      if (rnd() < 0.12) {
        st.stats.fo[k]++;
        if (rnd() < 0.15) {
          const pid = pickDefender(side);
          if (pid) {
            const pl = S.players[pid];
            const already = st.ev.some((e) => e.t === 'yellow' && e.p === pid);
            if (already && rnd() < 0.6) { sendOff(st, k, pid, minute, true); }
            else if (!already) {
              st.stats.yc[k]++; addRating(st, pid, -0.3);
              evAdd(st, { min: minute, t: 'yellow', s: k, p: pid, txt: phrase('yellow', { p: pidName(pid) }) });
            }
          }
        } else if (rnd() < 0.0035) {
          const pid = pickDefender(side);
          if (pid) sendOff(st, k, pid, minute, false);
        }
      }
      if (rnd() < 0.0011) { // injury
        const pid = pickAny(side, false);
        if (pid && !st.injured.includes(pid)) {
          st.injured.push(pid);
          evAdd(st, { min: minute, t: 'inj', s: k, p: pid, txt: phrase('injury', { p: pidName(pid) }) });
          if (!st.user || st.sides[k].id !== st.user) aiSub(st, k, pid, minute, true);
        }
      }
      if (zo && !st.alien && rnd() < 0.0004) {
        const pid = pickAny(side, false);
        if (pid) {
          st.alien = pid;
          evAdd(st, { min: minute, t: 'alien', s: k, p: pid, txt: `👽 ALIENÍGENAS INVADEM O GRAMADO! Um disco voador abduz ${pidName(pid)}!` });
          removeFromPitch(st, k, pid, minute);
          if (!st.user || st.sides[k].id !== st.user) aiSub(st, k, null, minute, true);
        }
      }
    }
    // AI substitutions
    if (minute >= 55 && minute <= 85) for (let k = 0; k < 2; k++) {
      if (st.user && st.sides[k].id === st.user && !st.autoUser) continue;
      if (st.subsLeft[k] > 0 && rnd() < 0.07) aiSub(st, k, null, minute, false);
    }
  }
}
function sendOff(st, k, pid, minute, second) {
  st.stats.rc[k]++; addRating(st, pid, -1.5);
  evAdd(st, { min: minute, t: 'red', s: k, p: pid, second, txt: second ? phrase('red', { p: pidName(pid) }).replace('CARTÃO VERMELHO! ', '') : `CARTÃO VERMELHO! ${pidName(pid)} está expulso!` });
  removeFromPitch(st, k, pid, minute);
  st.sides[k].reds = (st.sides[k].reds || 0) + 1;
  computeRatesLive(st);
}
function removeFromPitch(st, k, pid, minute) {
  const side = st.sides[k];
  const i = side.on.indexOf(pid);
  if (i >= 0) { side.on[i] = 0; side.out.push(pid); if (st.mins[pid]) st.mins[pid].out = minute; }
}
function computeRatesLive(st) {
  const m = S.matches[st.mid];
  const keepRate = st.rate.slice();
  computeRates(st, m);
  st.rate = keepRate;
}
function aiSub(st, k, outPid, minute, forced) {
  const side = st.sides[k];
  if (st.subsLeft[k] <= 0) { if (outPid) removeFromPitch(st, k, outPid, minute); computeRatesLive(st); return; }
  // choose who leaves
  let idx = -1;
  if (outPid) idx = side.on.indexOf(outPid);
  else {
    let worst = 1e9;
    side.on.forEach((pid, i) => {
      if (!pid || side.slotsOn[i] === 'GK') return;
      const p = S.players[pid];
      const v = (st.ratings[pid] || 6) * 10 + fitnessNow(p) * 0.2 - (rnd() * 8);
      if (v < worst) { worst = v; idx = i; }
    });
  }
  if (idx < 0) return;
  const pos = side.slotsOn[idx];
  const cand = side.bench.filter((b) => !side.out.includes(b) && !side.on.includes(b) && !st.injured.includes(b))
    .map((b) => S.players[b]).filter(Boolean).sort(by((p) => effRating(p, pos), -1))[0];
  const oldPid = side.on[idx];
  if (!cand) { if (outPid) { removeFromPitch(st, k, outPid, minute); computeRatesLive(st); } return; }
  doSub(st, k, idx, cand.id, minute);
}
function doSub(st, k, idx, inPid, minute) {
  const side = st.sides[k];
  const outPid = side.on[idx];
  side.on[idx] = inPid;
  side.bench = side.bench.filter((b) => b !== inPid);
  if (outPid) { side.out.push(outPid); if (st.mins[outPid]) st.mins[outPid].out = minute; }
  st.mins[inPid] = { in: minute, out: null };
  st.ratings[inPid] = 6.3;
  st.subsLeft[k]--;
  evAdd(st, { min: minute, t: 'sub', s: k, p: inPid, p2: outPid, txt: `Substituição em ${teamName(side.id)}: entra ${pidName(inPid)}${outPid ? `, sai ${pidName(outPid)}` : ''}.` });
  computeRatesLive(st);
}

// full quick simulation
function playWholeMatch(m, opts = {}) {
  const st = startMatchState(m, opts);
  st.autoUser = true;
  simulateRange(st, m, 45 + st.stoppage[0]);
  st.min = 45; st.half = 2;
  simulateRange(st, m, 90 + st.stoppage[1]);
  finishRegulation(st, m);
  return st;
}
function finishRegulation(st, m) {
  // extra time / penalties for ties
  if (matchNeedsDecider(m)) {
    const [bh, ba] = tieAggregateBefore(m);
    const aggH = bh + st.score[0], aggA = ba + st.score[1];
    if (aggH === aggA && S.comps[m.c] && S.comps[m.c].noET) st.pen = decidePens(st);
    else if (aggH === aggA) {
      st.et = true;
      st.min = 90; st.half = 3;
      const saveXg = st.xg.slice();
      st.xg = st.xg.map((x) => x * 0.95);
      st.shotRate = st.shotRate.map((r) => r * 0.85);
      simulateRange(st, m, 120);
      st.xg = saveXg;
      const aggH2 = bh + st.score[0], aggA2 = ba + st.score[1];
      if (aggH2 === aggA2) st.pen = decidePens(st);
    }
  }
  st.done = true;
}
// in matches of the user the shoot-out can be played (st.deferPens): it is left pending until he chooses
function decidePens(st) {
  if (st.deferPens) { st.pendPens = true; return null; }
  return penaltyShootout(st);
}
function penaltyShootout(st) {
  const takers = st.sides.map((s) => s.on.filter(Boolean).map((pid) => S.players[pid]).sort(by((p) => (p.a ? p.a[1] : p.o), -1)));
  const gks = st.sides.map((s) => S.players[gkOf(s)]);
  const sc = [0, 0];
  const seq = [];
  const shoot = (k, i) => {
    const t = takers[k][i % Math.max(1, takers[k].length)];
    const g = gks[1 - k];
    const p = clamp(0.76 + ((t ? (t.a ? t.a[1] : t.o) : 60) - 70) * 0.004 - ((g ? g.o : 60) - 75) * 0.004, 0.55, 0.92);
    const ok = rnd() < p;
    if (ok) sc[k]++;
    seq.push([k, t ? t.id : 0, ok]);
    return ok;
  };
  for (let i = 0; i < 5; i++) {
    shoot(0, i);
    if (sc[0] > sc[1] + (5 - i) || sc[1] > sc[0] + (4 - i)) break;
    shoot(1, i);
    if (sc[0] > sc[1] + (4 - i) || sc[1] > sc[0] + (4 - i)) break;
  }
  let i = 5;
  while (sc[0] === sc[1] && i < 30) { shoot(0, i); shoot(1, i); i++; }
  st.penSeq = seq;
  return sc;
}

// apply results to the world ------------------------------------------------------
function applyMatchResult(m, st) {
  m.hg = st.score[0]; m.ag = st.score[1]; m.done = true;
  if (st.pen) m.pen = st.pen;
  if (st.et) m.et = 1;
  const c = S.comps[m.c];
  const isUserMatch = S.user && (isUserTeam(m.h) || isUserTeam(m.a));
  // compact events: goals & cards (all matches), everything for user's matches
  m.ev = st.ev.filter((e) => isUserMatch || e.t === 'goal' || e.t === 'red' || e.t === 'alien').map((e) => [e.min, e.t, e.s, e.p || 0, e.p2 || 0]);
  if (isUserMatch) { m.stats = st.stats; m.lu = st.sides.map((s) => ({ xi: s.xi, bench: s.bench, form: s.form })); m.rt = {}; }
  // ratings result bonus
  const res = [Math.sign(st.score[0] - st.score[1]), Math.sign(st.score[1] - st.score[0])];
  const day = m.d;
  st.sides.forEach((side, k) => {
    const played = Object.keys(st.mins).map(Number).filter((pid) => side.xi.includes(pid) || (st.ev.some((e) => e.t === 'sub' && e.s === k && e.p === pid)));
    const cleanSheet = st.score[1 - k] === 0;
    for (const pid of played) {
      const p = S.players[pid];
      if (!p) continue;
      const mm = st.mins[pid];
      const minutes = (mm.out ?? (st.et ? 120 : 90)) - mm.in;
      let r = st.ratings[pid] + res[k] * 0.4 + (rnd() - 0.5) * 0.8;
      if (cleanSheet && (POS_GROUP[p.p] === 'DEF' || p.p === 'GK')) r += 0.5;
      r = clamp(Math.round(r * 10) / 10, 3.5, 10);
      if (isUserMatch) m.rt[pid] = r;
      // stats
      const key = m.c;
      p.st = p.st || {};
      const row = p.st[key] || (p.st[key] = [0, 0, 0, 0, 0, side.id, 0]);
      row[0]++; row[6] += r; row[5] = side.isNat ? row[5] : row[5];
      p.car = p.car || [0, 0, 0];
      p.car[0]++;
      p.lp = day;
      p.form = clamp((p.form || 0) * 0.7 + (r - (FORM_BASE[POS_GROUP[p.p]] || 6.55)) * 2, -6, 6); // form vs a normal game in his position
      const app = minutes >= 45 ? 1 : 0.5; // development: games of the year and of the quarter
      p.ay = (p.ay || 0) + app; p.aq = (p.aq || 0) + app;
      if (minutes >= 30) { p.ar = (p.ar || 0) + r; p.an = (p.an || 0) + 1; } // average rating of the year (dynamic potential)
      if (p.loan) p.loan.g = (p.loan.g || 0) + app;
      // fatigue
      const sta = p.a ? p.a[5] : 65;
      const cost = (16 + (100 - (p.p === 'GK' ? 85 : sta)) / 6 + Math.max(0, p.age - 30) * 0.8) * (minutes / 90);
      setFitness(p, fitnessNow(p, day) - cost, day);
    }
    // goals/assists/cards
    for (const e of st.ev) {
      if (e.s !== k) continue;
      const row = (pid) => { const p = S.players[pid]; if (!p) return null; p.st = p.st || {}; return p.st[m.c] || (p.st[m.c] = [0, 0, 0, 0, 0, side.id, 0]); };
      if (e.t === 'goal') {
        const r1 = row(e.p); if (r1) { r1[1]++; S.players[e.p].car[1]++; }
        if (e.p2) { const r2 = row(e.p2); if (r2) { r2[2]++; S.players[e.p2].car[2]++; } }
      } else if (e.t === 'yellow') {
        const r1 = row(e.p); if (r1) r1[3]++;
        const p = S.players[e.p];
        if (p && c && c.kind === 'league' && r1[3] % 5 === 0) { p.sus = (p.sus || 0) + 1; }
      } else if (e.t === 'red') {
        const r1 = row(e.p); if (r1) r1[4]++;
        const p = S.players[e.p]; if (p) p.sus = (p.sus || 0) + (e.second ? 1 : rint(1, 2));
      } else if (e.t === 'inj') {
        const p = S.players[e.p];
        if (p) injurePlayer(p, day);
      } else if (e.t === 'alien') {
        const p = S.players[e.p];
        if (p) { p.inj = seasonEndDay(); p.injN = 'Abduzido por alienígenas'; addNews(`👽 ${p.n} foi abduzido!`, `Durante ${teamName(m.h)} x ${teamName(m.a)}, um disco voador levou ${p.n} (${teamName(p.t)}). Ele está fora pelo resto da temporada.`, 'zoeira', [p.t], { cat: 'Inacreditável', hot: true }); }
      }
    }
    // decrement suspensions for players that were suspended (not in squad)
    for (const p of teamPlayersFor(side.id)) {
      if (p.sus > 0 && !played.includes(p.id) && !st.ev.some((e) => e.t === 'red' && e.p === p.id)) p.sus--;
    }
  });
  // background injuries (rare, also outside the 90 minutes)
  recordResult(m);
  afterMatchHooks(m, st);
}
const INJURIES = [
  ['Contusão muscular', 5, 14], ['Torção no tornozelo', 7, 21], ['Lesão na coxa', 10, 28], ['Estiramento na panturrilha', 10, 24],
  ['Lesão no joelho', 21, 60], ['Fratura no pé', 45, 90], ['Lesão no ombro', 14, 35], ['Pancada na costela', 4, 10],
  ['Lesão no ligamento do joelho', 120, 220], ['Lesão na virilha', 8, 20],
];
function injurePlayer(p, day) {
  const r = rnd();
  const pool = r < 0.55 ? INJURIES.filter((x) => x[2] <= 28) : r < 0.97 ? INJURIES.filter((x) => x[2] <= 90) : INJURIES;
  const [name, a, b] = pick(pool);
  p.inj = day + rint(a, b);
  p.injN = name;
}

// quick-sim used for all AI matches
function simulateMatch(m) {
  const st = playWholeMatch(m);
  applyMatchResult(m, st);
  return st;
}

/* ===================== world creation ===================== */
const LEAGUE_NAMES2 = { ENG: 'Championship', ESP: 'Segunda División', GER: '2. Bundesliga', FRA: 'Ligue 2', ITA: 'Serie B', BRA: 'Série B' };
const COMP_LOGO_EXTRA = { TUR: '#e30a17', BEL: '#1f2937', SCO: '#1d4ed8', GRE: '#0d5eaf', AUT: '#c8102e', SUI: '#d52b1e', DEN: '#c60c30', NOR: '#ba0c2f',
  SWE: '#006aa7', POL: '#dc143c', CZE: '#11457e', CRO: '#d01c1f', SRB: '#c6363c', UKR: '#0057b7', ROU: '#002b7f', HUN: '#477050', BUL: '#00966e',
  CYP: '#d57800', ISR: '#0038b8', AZE: '#00b5e2', SVK: '#0b4ea2', SVN: '#005da4', ARM: '#d90012', KAZ: '#00afca', LTU: '#006a44', ALB: '#e41e20',
  GEO: '#b91c1c', BIH: '#002395', FIN: '#003580', AND: '#10069f', LVA: '#9e3039', GIB: '#da000c', CHI: '#d52b1e', URU: '#5aaae6', PAR: '#d52b1e',
  BOL: '#007934', PER: '#d91023', ECU: '#ffd100', COL: '#fcd116', VEN: '#cf142b' };
const COMP_LOGO = { UL1: '#f5c542', UL2: '#c0c7d6', UL3: '#cd8d5a', UL4: '#7fb08a', ENG: '#3d195b', ESP: '#ee3524', GER: '#d20515', FRA: '#091c3e', ITA: '#008fd7', BRA: '#00a651', ARG: '#74acdf', POR: '#00a3e0', NED: '#ff7a00', UCL: '#0a2a8f', UEL: '#f26522', UECL: '#16a34a', LIB: '#c9a43b', SULA: '#1e88e5', MUN: '#8e24aa', CUP: '#7a5cff', WC: '#8a1538', EURO: '#143cdb', COPA: '#00a3d9', QUAL: '#4b5563', FRIEND: '#6b7280', YOUTH: '#2fbf71' };
Object.assign(COMP_LOGO, COMP_LOGO_EXTRA);

function emptyState(opts) {
  return {
    v: 3, id: opts.id || ('s' + Date.now().toString(36)), created: Date.now(), era: opts.era, mode: opts.mode,
    zoeira: !!opts.zoeira, noFire: !!opts.noFire, date: 0, seq: {}, rng: 0,
    coach: { name: opts.coachName || 'Treinador', age: opts.coachAge || 40, fav: opts.favKey || '', rating: 60, rep: opts.rep || 45,
      rec: { w: 0, d: 0, l: 0, gf: 0, ga: 0 }, hist: [], trophies: [], unemployed: false },
    user: { team: 0 }, teams: {}, players: {}, nations: {}, comps: {}, active: [], matches: {}, days: {}, tm: {},
    inbox: [], news: [], hist: [], titles: {}, lastTables: {}, board: { conf: 65, obj: '', objRank: 10 },
    tr: { offers: [], neg: [], log: [], short: [], counts: {} }, youth: { scouts: [], reports: [], squad: [], lastReport: 0 },
    ultra: null, normal: null, flags: { potV2: 1, potV3: 1 }, seasonStart: 0, euSeason: 0, saSeason: 0, intl: { next: [] },
  };
}

function loadPlayersTeams(data) {
  const T = data.tcols, P = data.pcols;
  for (const r of data.teams) {
    const o = {}; T.forEach((k, i) => (o[k] = r[i]));
    const t = { id: o.id, key: o.key, n: o.name, s: o.short, c: o.country, c1: o.c1, c2: o.c2, ext: o.ext, std: o.stadium, fin: o.fin,
      sq: [], form: '4-3-3', budget: 0, wb: 0 };
    S.teams[t.id] = t;
  }
  for (const r of data.players) {
    const o = {}; P.forEach((k, i) => (o[k] = r[i]));
    const p = { id: o.id, n: o.name, s: o.short, t: o.team, p: o.pos, alt: o.alt, age: o.age, o: o.ovr, pot: o.pot, nat: o.nat,
      f: o.foot, h: o.h, a: [o.pac, o.sho, o.pas, o.dri, o.def, o.phy], num: o.num, ct: o.contract, fit: 100, fitD: 0, form: 0, mor: 70, car: [0, 0, 0] };
    boostYoungPot(p);
    S.players[p.id] = p;
    if (p.t && S.teams[p.t]) S.teams[p.t].sq.push(p.id);
  }
  S.seq.p = Math.max(...Object.keys(S.players).map(Number)) + 1;
  S.seq.t = Math.max(...Object.keys(S.teams).map(Number)) + 1;
  for (const n of data.nations) S.nations[n[0]] = { code: n[0], n: n[1], conf: n[2], c1: n[3], c2: n[4], cnt: n[5] };
  S.names = data.names;
  // contracts & wages
  for (const id in S.players) {
    const p = S.players[id];
    const t = S.teams[p.t];
    p.w = wageDemand(p, t);
  }
  for (const id in S.teams) setBudgets(S.teams[id]);
}
function setBudgets(t) {
  const fin = t.fin || 2;
  const mf = moneyFactor();
  const base = [3e6, 8e6, 20e6, 45e6, 90e6, 160e6, 240e6][clamp(fin, 0, 6)];
  t.budget = roundMoney(base * mf * (0.75 + rnd() * 0.5));
  const wages = sum(squadOf(t.id), (p) => p.w || 0);
  t.wb = Math.max(wages * 1.08, wages + 20000 * mf);
}

// structures from data -------------------------------------------------------
function setupStructures(data) {
  const st = data.struct;
  S.ultra = { div: st.ultra.div.map((d) => d.slice()), bank: st.ultra.bank.slice() };
  S.normal = st.normal.map((lg) => ({ ...lg, teams: lg.teams.slice(), bank: lg.bank.slice() }));
  S.fill = { ucl: st.ucl.slice(), uel: st.uel.slice(), liber: st.liber.slice(), sula: (st.sula || []).slice(), ofc: (st.ofc || []).slice() };
  S.wc2026 = st.wc2026;
}

// national teams as team entities
function setupNations() {
  let id = 900000;
  for (const code in S.nations) {
    const n = S.nations[code];
    const t = { id: ++id, key: 'nat:' + code, n: n.n, s: code, c: code, c1: n.c1, c2: n.c2, ext: 0, std: '', fin: 3, sq: [], form: '4-3-3', isNat: 1, code, budget: 0, wb: 0 };
    S.teams[t.id] = t;
    n.tid = t.id;
  }
}
function natTeam(code) { return S.teams[S.nations[code].tid]; }

// offers -------------------------------------------------------------------------
// returns candidate team ids for the initial job offers
function nationalOpeningCodes() {
  if (S.era === 2016) return EURO2016.flat().concat(COPA2016.flat());
  if (S.era === 2021) return EURO2021.flat().concat(COPA2021.flat());
  return S.wc2026.flat();
}
function initialOffers(mode, opts = {}) {
  if (mode === 'ultra') {
    const pool = S.ultra.div[2].concat(S.ultra.bank).filter((id) => !opts.exclude || !opts.exclude.includes(id));
    const sorted = pool.slice().sort(by((id) => teamRating(id)));
    const weak = sorted.slice(0, 12);
    return shuffle(weak).slice(0, 3).map((id) => ({ team: id, div: S.ultra.bank.includes(id) ? 'bank' : 2 }));
  }
  if (mode === 'normal') {
    // one club of each of the main leagues and three of the others (any club can still be picked from the full list)
    const offer = (lg) => {
      const sorted = lg.teams.slice().sort(by((id) => teamRating(id)));
      return { team: pick(sorted.slice(0, Math.max(3, Math.floor(sorted.length / 3)))), league: lg.id };
    };
    const main = S.normal.filter((lg) => MAIN_LEAGUES.has(lg.id));
    const others = shuffle(S.normal.filter((lg) => !MAIN_LEAGUES.has(lg.id) && lg.teams.length >= 8));
    const topEU = new Set(UEFA_RANK.slice(7, 18)); // Belgium … Sweden
    const eu = others.filter((lg) => topEU.has(lg.id)), sa = others.filter((lg) => lg.conf === 'CONMEBOL');
    const extra = [eu[0], sa[0], eu[1]].filter(Boolean);
    return main.concat(extra).map(offer);
  }
  // national: weaker nations of the opening tournament(s) of the chosen year
  const wc = nationalOpeningCodes().map((c) => S.nations[c] && S.nations[c].tid).filter(Boolean);
  const sorted = wc.sort(by((id) => nationRating(S.teams[id].code)));
  return shuffle(sorted.slice(0, 18)).slice(0, 3).map((id) => ({ team: id }));
}

// =============================== start a new world ===============================
async function createWorld(opts) {
  RNG.seed(opts.seed || (Date.now() & 0x7fffffff));
  S = emptyState(opts);
  loadPlayersTeams(DATA);
  setupStructures(DATA);
  setupNations();
  if (S.mode === 'national') prepareNationalPools();
  return S;
}

// choose user team & date, build competitions, pre-simulate when needed
function prepareCareerStart(teamId) {
  const Y = S.era;
  S.user.team = teamId;
  let target = 0;
  if (S.mode === 'ultra') {
    S.date = dayOf(Y, 7, 1);
    ensureUserInUltraLeague(2); // a team from the bank takes the place of a Ultra Liga 3 club
    createEUSeason(Y, true);
    if (S.zoeira) scheduleZoeira99(Y, 'EU');
  } else if (S.mode === 'normal') {
    const lg = S.normal.find((l) => l.teams.includes(teamId) || l.bank.includes(teamId));
    if (lg && lg.cal === 'SA') {
      S.date = dayOf(Y - 1, 7, 1);
      createEUSeason(Y - 1, true);
      target = dayOf(Y, 1, 2);
    } else {
      const now = dayOf(Y, 7, 1);
      S.date = dayOf(Y, 1, 1);
      createSASeason(Y, true);
      S.euPending = Y;
      target = now;
    }
    if (S.zoeira) scheduleZoeira99(Y, 'EU');
  } else {
    S.date = dayOf(Y, 6, 1);
    setupInternational(Y);
  }
  S.presim = target > 0;
  return target;
}
// the user's club must play a league: a club taken from the bank replaces the weakest club of division `divIdx`
function ensureUserInUltraLeague(divIdx) {
  const uid = S.user && S.user.team;
  if (!uid || S.coach.unemployed || !S.ultra.bank.includes(uid)) return;
  const div = S.ultra.div[Math.min(divIdx, S.ultra.div.length - 1)];
  const out = div.filter((id) => id !== uid).sort(by((id) => teamRating(id)))[0];
  if (!out) { S.ultra.bank = S.ultra.bank.filter((id) => id !== uid); div.push(uid); return; }
  div[div.indexOf(out)] = uid;
  S.ultra.bank = S.ultra.bank.filter((id) => id !== uid).concat(out);
  const dn = ['Ultra Liga', 'Ultra Liga 2', 'Ultra Liga 3', 'Ultra Liga 4'][S.ultra.div.indexOf(div)] || 'Ultra Liga';
  addNews(`${teamName(uid)} entra na ${dn}`, `${teamName(uid)} sai do banco de times e assume a vaga ${tA(out, 'do')} na ${dn}.`, 'promo', [uid, out], { cat: 'Acesso e rebaixamento' });
}
function finishCareerStart(teamId) {
  S.presim = false;
  if (S.euPending) { const y = S.euPending; S.euPending = 0; createEUSeason(y, true); }
  const t = S.teams[teamId];
  S.seasonStart = S.date;
  if (!t.isNat) { t.form = t.form || '4-3-3'; const lu = autoLineup(squadOf(teamId), t.form); t.xi = lu.xi; t.bench = lu.bench; }
  else { autoCallUp(t.code, true); const lu = autoLineup(nationSquad(t.code), t.form); t.xi = lu.xi; t.bench = lu.bench; }
  setBoardObjective();
  welcomeMessages();
  S.started = true;
}
function startCareer(teamId, onProgress) {
  const target = prepareCareerStart(teamId);
  if (target) fastForward(target, onProgress);
  finishCareerStart(teamId);
}
async function startCareerAsync(teamId, onProgress) {
  const target = prepareCareerStart(teamId);
  if (target) {
    const start = S.date;
    while (S.date < target) {
      for (let i = 0; i < 6 && S.date < target; i++) {
        playDay();
        fastDailyEvents();
        S.date++;
        const t = ymd(S.date);
        if (t.m === 7 && t.d === 1 && S.euSeason < t.y && !S.euPending) euRollover();
        if (t.m === 1 && t.d === 1 && S.mode === 'normal' && (S.saSeason || 0) < t.y) saRollover();
      }
      if (onProgress) onProgress((S.date - start) / Math.max(1, target - start));
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  finishCareerStart(teamId);
}

/* ===================== seasons, rollovers, day loop ===================== */
function seasonLabel(y, zone) { return zone === 'SA' || zone === 'INTL' ? String(y) : `${y}/${String((y + 1) % 100).padStart(2, '0')}`; }
function seasonEndDay() {
  const t = ymd(S.date);
  const lg = userLeagueZone();
  if (lg === 'SA') return dayOf(t.y, 12, 31);
  return t.m >= 7 ? dayOf(t.y + 1, 6, 30) : dayOf(t.y, 6, 30);
}
function userLeagueZone() {
  if (S.mode !== 'normal') return S.mode === 'national' ? 'INTL' : 'EU';
  const uid = S.user.team;
  const lg = S.normal.find((l) => l.teams.includes(uid) || l.bank.includes(uid));
  return lg ? lg.cal : 'EU';
}
const isUserTeam = (id) => !!S.user && S.user.team === id && !S.coach.unemployed;

function cupSeeds(ids) { return ids.slice().sort(by((id) => teamRating(id), -1)); }
function cupDatesFor(zone, y, nPlan) {
  if (zone === 'SA') {
    const d = saCupDates(y, nPlan);
    return d.rounds;
  }
  const d = euCupDates(y, nPlan);
  return d.rounds.concat([d.final]);
}

// ------------------------------------------------------------------ EUROPE (and Ultra Liga)
function createEUSeason(y, initial) {
  S.euSeason = y;
  if (!S.euSeasonsCreated) S.euSeasonsCreated = [];
  const label = seasonLabel(y, 'EU');
  if (S.mode === 'ultra') {
    const names = ['Ultra Liga', 'Ultra Liga 2', 'Ultra Liga 3', 'Ultra Liga 4'];
    S.ultra.div.forEach((teams, i) => {
      if (!teams.length) return;
      const single = teams.length > 24;
      makeLeague({ key: `UL${i + 1}`, name: names[i], short: `UL${i + 1}`, zone: 'EU', season: label, year: y, teams: teams.slice(),
        single, tier: i, down: S.zoeira ? 0 : (i < 3 ? 3 : 3), up: i > 0 ? 3 : 0, country: 'ULT' });
    });
    const all = S.ultra.div.flat().concat(S.ultra.bank);
    const nPlan = planLength(all.length);
    makeCup({ key: 'CUPUL', name: 'Copa Ultra', short: 'COPA', zone: 'EU', season: label, year: y, teams: cupSeeds(all), legs: 1,
      dates: cupDatesFor('EU', y, nPlan), country: 'ULT' });
    if (!S.zoeira) makeYouthLeague(userDivisionTeams(), 'EU', y, label);
    return;
  }
  if (S.mode !== 'normal') return;
  for (const lg of S.normal.filter((l) => l.cal === 'EU')) {
    makeLeague({ key: lg.id, name: lg.name, short: lg.id, zone: 'EU', season: label, year: y, teams: lg.teams.slice(), down: lg.down, country: lg.country, lgId: lg.id, rr: lg.rr });
    if (lg.bank.length >= 2) {
      makeLeague({ key: lg.id + '2', name: LEAGUE_NAMES2[lg.id] || lg.name + ' 2', short: lg.id + '2', zone: 'EU', season: label, year: y,
        teams: lg.bank.slice(), up: lg.down, country: lg.country, second: true, lgId: lg.id });
    }
    const cupTeams = lg.teams.concat(lg.bank);
    const nPlan = planLength(cupTeams.length);
    makeCup({ key: 'CUP' + lg.id, name: lg.cup, short: 'COPA', zone: 'EU', season: label, year: y, teams: cupSeeds(cupTeams), legs: 1,
      dates: cupDatesFor('EU', y, nPlan), country: lg.country });
  }
  createUEFA(y, label);
  const ul = S.normal.find((l) => l.teams.includes(S.user.team));
  if (ul && ul.cal === 'EU' && !S.zoeira) makeYouthLeague(ul.teams, 'EU', y, label);
}
function planLength(n) { let P = 1; while (P * 2 <= n) P *= 2; let k = Math.log2(P); return k + (n > P ? 1 : 0); }

function leagueRanking(lgId) {
  // last season final table if any, else by rating
  const last = S.lastTables[lgId];
  const lg = S.normal.find((l) => l.id === lgId);
  if (last && last.length) return last.filter((id) => lg.teams.includes(id)).concat(lg.teams.filter((id) => !last.includes(id)));
  return lg.teams.slice().sort(by((id) => teamRating(id), -1));
}
// Champions League, Europa League and Conference League places come from the league tables of the season before
// (UEFA_SLOTS, 16_access.js); title holders keep a place one level up. Two play-off rounds in August complete
// the Champions League and the Conference League.
function createUEFA(y, label) {
  const cand = uefaCandidates();
  const taken = new Set();
  const take = (ids) => ids.filter((id) => validClub(id) && !taken.has(id) && (taken.add(id), true));
  // the Champions and the Europa League winners play the Champions League, the Conference League winner the Europa League
  const ucl = take([holderOf('UCL', y - 1), holderOf('UEL', y - 1)]).concat(take(cand.U));
  const uelHolder = take([holderOf('UECL', y - 1)]);
  const qual = take(cand.Q);
  let qTies = Math.max(0, Math.min(Math.floor(qual.length / 2), 36 - ucl.length));
  if (ucl.length + qTies < 36) ucl.push(...uefaReserve(taken, 36 - ucl.length - qTies)); // careers without all the leagues
  const qTeams = qual.slice(0, qTies * 2);
  let uel = uelHolder.concat(qual.slice(qTies * 2), take(cand.E));
  let conf = take(cand.C);
  const uelTarget = 36 - qTies; // the play-off losers complete it
  if (uel.length > uelTarget) conf = uel.splice(uelTarget).concat(conf);
  else if (uel.length < uelTarget) uel.push(...conf.splice(0, uelTarget - uel.length));
  if (uel.length < uelTarget) uel.push(...uefaReserve(taken, uelTarget - uel.length));
  // Conference League: 24 direct places and a play-off for the other 12
  const direct = conf.slice(0, 24);
  let po = conf.slice(24, 48);
  if (po.length % 2) po.pop();
  if (direct.length + po.length / 2 < 36) direct.push(...uefaReserve(taken, 36 - direct.length - po.length / 2));
  const d = uefaDates(y);
  const quals = [];
  const playoff = (key, name, teams, day) => {
    const q = newComp({ kind: 'cup', key, name, short: 'PRÉ', zone: 'UEFA', season: label, year: y, legs: 2, teams: teams.slice() });
    q.plan = [{ size: teams.length, name: 'Play-off de acesso' }];
    q.alive = teams.slice(); q.seeds = teams.slice(); q.dates = [day];
    q.onStageDone = null;
    q.isQual = true;
    startCupRound(q, 0);
    quals.push(q.id);
  };
  if (qTeams.length) playoff('UCLQ', 'Pré-Champions', qTeams, d.qual[3]);
  if (po.length) playoff('UECLQ', 'Pré-Conference', po, d.qual[3] + 2);
  S.pendingUEFA = { y, label, ucl, uel, uecl: direct, quals };
  if (!quals.length) launchUEFALeagues(null);
}
function launchUEFALeagues(qComp) {
  const P = S.pendingUEFA;
  if (!P) return;
  if (P.qualId && !P.quals) P.quals = [P.qualId]; // saved before the Conference League existed
  if (P.quals.some((id) => S.comps[id] && !S.comps[id].done)) return; // the other play-off is still going
  const ucl = P.ucl.slice(), uel = P.uel.slice(), uecl = P.uecl ? P.uecl.slice() : null;
  for (const id of P.quals) {
    const q = S.comps[id];
    if (!q || !q.rounds[0]) continue;
    const ties = q.rounds[0].ties.map((tid) => q.ties[tid]);
    const winners = ties.map((t) => t.w), losers = ties.map((t) => (t.w === t.a ? t.b : t.a));
    if (q.key === 'UECLQ') { if (uecl) uecl.push(...winners); } else { ucl.push(...winners); uel.push(...losers); }
  }
  const taken = new Set(ucl.concat(uel, uecl || []));
  const fit = (arr) => arr.slice(0, 36).concat(uefaReserve(taken, 36 - Math.min(36, arr.length)));
  const d = uefaDates(P.y);
  const seedSort = (arr) => arr.slice().sort(by((id) => teamRating(id), -1));
  const c1 = makeSwiss({ key: 'UCL', name: 'Champions League', short: 'UCL', zone: 'UEFA', season: P.label, year: P.y, teams: seedSort(fit(ucl)), dates: d.league });
  c1.koDates = [d.playoff[0], d.r16[0], d.qf[0], d.sf[0], d.final];
  const dUel = d.league.map((x) => x + 2);
  const c2 = makeSwiss({ key: 'UEL', name: 'Europa League', short: 'UEL', zone: 'UEFA', season: P.label, year: P.y, teams: seedSort(fit(uel)), dates: dUel });
  c2.koDates = [d.playoff[0] + 2, d.r16[0] + 2, d.qf[0] + 2, d.sf[0] + 2, d.finalUEL];
  if (uecl) {
    const c3 = makeSwiss({ key: 'UECL', name: 'Conference League', short: 'UECL', zone: 'UEFA', season: P.label, year: P.y, teams: seedSort(fit(uecl)),
      dates: d.ueclLeague, nRounds: 6, nPots: 6 });
    c3.koDates = [d.playoff[0] + 2, d.r16[0] + 2, d.qf[0] + 2, d.sf[0] + 2, d.finalUECL];
  }
  S.pendingUEFA = null;
  if (!S.presim) uefaPlacesInbox([c1, c2]);
}
// the user's club learns where it plays in Europe
function uefaPlacesInbox(comps) {
  const uid = S.user && S.user.team;
  if (!uid || S.coach.unemployed) return;
  const c = S.active.map((id) => S.comps[id]).find((x) => x && x.kind === 'swiss' && x.year === (comps[0] && comps[0].year) && x.teams.includes(uid));
  if (c) addInbox('board', 'Diretoria', `Vaga na ${c.name}`, `${TA(uid)} vai disputar a fase de liga da ${c.name} ${c.season}. A estreia é em ${fmtDate(c.rounds[0].d, 'long')}.`);
}

// ------------------------------------------------------------------ SOUTH AMERICA
function createSASeason(y, initial) {
  S.saSeason = y;
  if (S.mode !== 'normal') return;
  const label = seasonLabel(y, 'SA');
  for (const lg of S.normal.filter((l) => l.cal === 'SA')) {
    const single = lg.teams.length > 24;
    makeLeague({ key: lg.id, name: lg.name, short: lg.id, zone: 'SA', season: label, year: y, teams: lg.teams.slice(), single,
      down: lg.down, country: lg.country, lgId: lg.id, rr: lg.rr });
    if (lg.bank.length >= 2) {
      makeLeague({ key: lg.id + '2', name: LEAGUE_NAMES2[lg.id] || lg.name + ' 2', short: lg.id + '2', zone: 'SA', season: label, year: y,
        teams: lg.bank.slice(), up: lg.down, country: lg.country, second: true, lgId: lg.id });
    }
    const cupTeams = lg.teams.concat(lg.bank);
    const nPlan = planLength(cupTeams.length);
    const cup = makeCup({ key: 'CUP' + lg.id, name: lg.cup, short: 'COPA', zone: 'SA', season: label, year: y, teams: cupSeeds(cupTeams),
      legs: lg.id === 'BRA' ? 2 : 1, finalLegs: lg.id === 'BRA' ? 2 : 1, dates: cupDatesFor('SA', y, nPlan), country: lg.country, legGap: 7 });
  }
  createLibertadores(y, label);
  createSudamericana(y, label);
  createStateChampionships(y);
  createCopinha(y);
  const ul = S.normal.find((l) => l.teams.includes(S.user.team));
  if (ul && ul.cal === 'SA' && !S.zoeira) makeYouthLeague(ul.teams, 'SA', y, label);
}
function createLibertadores(y, label) {
  // the holders of the Libertadores and of the Sul-Americana have a place of their own, the others come from the
  // league tables of the year before (LIB_PLACES, 16_access.js)
  const holders = [holderOf('LIB', y - 1), holderOf('SULA', y - 1)].filter((id) => id && S.teams[id] && !S.teams[id].isNat);
  const fixed = uniq(holders.concat(conmebolRows(LIB_PLACES, new Set(holders)))).slice(0, 32);
  // careers started before the leagues of the smaller countries existed: the old pool of clubs
  const fill = S.fill.liber.filter((id) => !fixed.includes(id) && validClub(id)).sort(by((id) => teamRating(id) + rnd() * 6, -1)).slice(0, 32 - fixed.length);
  // 4 pots of 8, clubs of the same country kept apart when possible
  const groups = drawGroups(fixed.concat(fill).slice(0, 32), 8);
  const d = libertadoresDates(y);
  const c = makeGroups({ key: 'LIB', name: 'Libertadores', short: 'LIB', zone: 'SA', season: label, year: y, groups, double: true, dates: d.groups, spread: 3 });
  c.koPlan = [{ name: 'Oitavas de final', d: d.r16[0], legs: 2 }, { name: 'Quartas de final', d: d.qf[0], legs: 2 },
    { name: 'Semifinal', d: d.sf[0], legs: 2 }, { name: 'Final', d: d.final, legs: 1, neutral: true }];
  c.holders = holders;
}
function leagueRankingSA(id) {
  const lg = S.normal.find((l) => l.id === id);
  if (!lg) return [];
  const last = S.lastTables[id];
  if (last && last.length) return last.filter((x) => lg.teams.includes(x)).concat(lg.teams.filter((x) => !last.includes(x)));
  return lg.teams.slice().sort(by((x) => teamRating(x), -1));
}

// ------------------------------------------------------------------ youth championship
function userDivisionTeams() {
  if (S.mode === 'ultra') return S.ultra.div.find((d) => d.includes(S.user.team)) || S.ultra.div[0];
  const lg = S.normal.find((l) => l.teams.includes(S.user.team));
  return lg ? lg.teams : [];
}
function makeYouthLeague(teams, zone, y, label) {
  if (!teams || teams.length < 4) return;
  const c = newComp({ kind: 'youth', key: 'YOUTH', name: 'Campeonato Sub-19', short: 'SUB-19', zone, season: label, year: y, teams: teams.slice() });
  const rr = roundRobin(shuffle(teams.slice()), true);
  const start = zone === 'SA' ? dayOf(y, 3, 7) : dayOf(y, 8, 22);
  c.ym = [];
  c.ystr = {};
  teams.forEach((t) => { ensureRow(c.table, t); c.ystr[t] = clamp(teamRating(t) - 18 + rfloat(-4, 4), 45, 80); });
  rr.forEach((pairs, r) => {
    const d = onOrAfter(start + r * 7, 0);
    c.rounds.push({ name: `Rodada ${r + 1}`, d, m: [] });
    pairs.forEach(([h, a]) => c.ym.push({ r, d, h, a, hg: null, ag: null }));
  });
}
function playYouthDay(c) {
  if (c.copinha) { playCopinhaDay(c); return; }
  for (const m of c.ym) {
    if (m.d !== S.date || m.hg !== null) continue;
    const sh = youthStrength(c, m.h), sa = youthStrength(c, m.a);
    const xh = 1.35 * Math.exp(0.06 * (sh - sa)), xa = 1.1 * Math.exp(0.06 * (sa - sh));
    m.hg = binomial(7, clamp(xh / 7, 0.02, 0.8)); m.ag = binomial(7, clamp(xa / 7, 0.02, 0.8));
    applyToTable(c.table, m);
  }
  if (!c.done && c.ym.every((m) => m.hg !== null)) {
    const tab = sortTable(c.table, c.teams);
    c.done = true; c.champion = tab[0].id;
    S.hist.push({ key: 'YOUTH', name: c.name, season: c.season, ch: tab[0].id, chN: teamName(tab[0].id), ru: tab[1].id, ruN: teamName(tab[1].id) });
    if (isUserTeam(tab[0].id)) { addInbox('board', 'Diretoria', 'Título na base!', `Os garotos do Sub-19 foram campeões do ${c.name}. A diretoria está muito satisfeita com o trabalho da base.`); S.board.conf = clamp(S.board.conf + 3, 0, 100); }
  }
}
function youthStrength(c, tid) {
  if (isUserTeam(tid)) {
    const ys = S.youth.squad.map((id) => S.players[id]).filter(Boolean);
    if (ys.length >= 8) return avg(ys.sort(by((p) => p.o, -1)).slice(0, 11), (p) => p.o) + 4;
  }
  return c.ystr[tid] || 55;
}

// ------------------------------------------------------------------ rollovers
function archiveZone(zone) {
  // remove finished comps of a zone (EU+UEFA or SA), keep history entries
  const keep = [];
  for (const cid of S.active) {
    const c = S.comps[cid];
    if (!c) continue;
    const z = c.zone === 'UEFA' ? 'EU' : c.zone;
    if (z !== zone) { keep.push(cid); continue; }
    if (c.kind === 'league' && c.lgId) S.lastTables[c.second ? c.lgId + '2' : c.lgId] = sortTable(c.table, c.teams).map((r) => r.id);
    if (c.kind === 'league' && c.key.startsWith('UL')) S.lastTables[c.key] = sortTable(c.table, c.teams).map((r) => r.id);
    // delete matches
    for (const rd of c.rounds) for (const mid of rd.m) {
      const m = S.matches[mid];
      if (!m) continue;
      removeMatchIndex(m);
      for (const tid of [m.h, m.a]) { const l = S.tm[tid]; if (l) { const i = l.indexOf(mid); if (i >= 0) l.splice(i, 1); } }
      delete S.matches[mid];
    }
    delete S.comps[cid];
    for (const id in S.players) { const p = S.players[id]; if (p.st && p.st[cid]) delete p.st[cid]; }
  }
  S.active = keep;
  // drop empty day lists
  for (const d in S.days) if (!S.days[d].length) delete S.days[d];
}

function applyPromotionsUltra() {
  const div = S.ultra.div;
  const tabs = div.map((_, i) => S.lastTables['UL' + (i + 1)] || div[i]);
  if (S.zoeira) {
    // no relegation: top 3 of each lower division go up
    const newDiv = div.map((d) => d.slice());
    for (let i = div.length - 1; i >= 1; i--) {
      const up = tabs[i].slice(0, 3).filter((id) => newDiv[i].includes(id));
      newDiv[i] = newDiv[i].filter((id) => !up.includes(id));
      newDiv[i - 1] = newDiv[i - 1].concat(up);
      up.forEach((id) => newsPromo(id, i - 1));
    }
    S.ultra.div = newDiv;
    return;
  }
  const newDiv = div.map((d) => d.slice());
  for (let i = 0; i < div.length; i++) {
    const t = tabs[i];
    if (i < div.length - 1) {
      const down = t.slice(-3), up = tabs[i + 1].slice(0, 3);
      newDiv[i] = newDiv[i].filter((id) => !down.includes(id)).concat(up);
      newDiv[i + 1] = newDiv[i + 1].filter((id) => !up.includes(id)).concat(down);
      up.forEach((id) => newsPromo(id, i));
    }
  }
  // last division <-> bank
  const last = div.length - 1;
  const down = tabs[last].slice(-3);
  const bank = S.ultra.bank.slice().sort(by((id) => teamRating(id) + rnd() * 4, -1));
  const up = bank.slice(0, 3);
  newDiv[last] = newDiv[last].filter((id) => !down.includes(id)).concat(up);
  S.ultra.bank = bank.slice(3).concat(down);
  S.ultra.div = newDiv;
}
function newsPromo(id, toDiv) { if (isUserTeam(id)) addNews(`Acesso! ${teamName(id)} sobe de divisão`, `${teamName(id)} conquistou o acesso para a ${['Ultra Liga', 'Ultra Liga 2', 'Ultra Liga 3', 'Ultra Liga 4'][toDiv]}.`, 'promo', [id], { cat: 'Acesso e rebaixamento', hot: true }); }

function applyPromotionsNormal(zone) {
  for (const lg of S.normal.filter((l) => l.cal === zone)) {
    if (!lg.down || lg.bank.length < lg.down) continue;
    const t1 = S.lastTables[lg.id], t2 = S.lastTables[lg.id + '2'];
    if (!t1) continue;
    const down = t1.slice(-lg.down);
    const up = (t2 && t2.length ? t2 : lg.bank).slice(0, lg.down);
    lg.teams = lg.teams.filter((id) => !down.includes(id)).concat(up);
    lg.bank = lg.bank.filter((id) => !up.includes(id)).concat(down);
    for (const id of up) if (isUserTeam(id)) addNews(`${teamName(id)} volta à elite!`, `${teamName(id)} conquistou o acesso para ${cA(lg.name)}.`, 'promo', [id], { cat: 'Acesso e rebaixamento', hot: true });
    for (const id of down) if (isUserTeam(id)) addNews(`${teamName(id)} é rebaixado`, `${teamName(id)} vai disputar a ${LEAGUE_NAMES2[lg.id] || 'segunda divisão'} na próxima temporada.`, 'promo', [id], { cat: 'Acesso e rebaixamento', hot: true });
  }
}

function euRollover() {
  const y = yearOf(S.date);
  publishDigest();
  if (S.mode === 'ultra' || S.mode === 'normal') archiveZone('EU');
  if (S.mode === 'ultra') { applyPromotionsUltra(); ensureUserInUltraLeague(S.ultra.div.length - 1); }
  if (S.mode === 'normal') applyPromotionsNormal('EU');
  yearlyPlayers(y);
  if (S.mode !== 'national') {
    for (const id in S.teams) { const t = S.teams[id]; if (!t.isNat) setBudgets(t); }
    S.tr.counts = {};
  }
  createEUSeason(y);
  if (userLeagueZone() === 'EU' && S.mode !== 'national') { S.seasonStart = S.date; setBoardObjective(); seasonStartMessages(); }
  if (S.zoeira) scheduleZoeira99(y, 'EU');
}
function saRollover() {
  const y = yearOf(S.date);
  if (S.mode === 'normal') {
    publishDigest();
    archiveZone('SA');
    applyPromotionsNormal('SA');
    createSASeason(y);
    if (userLeagueZone() === 'SA') { S.seasonStart = S.date; setBoardObjective(); seasonStartMessages(); }
  }
}

// ------------------------------------------------------------------ day loop
function matchesToday() { return (S.days[S.date] || []).map((id) => S.matches[id]).filter(Boolean); }
function userMatchToday() {
  if (!S.user.team || S.coach.unemployed) return null;
  return matchesToday().find((m) => !m.done && (m.h === S.user.team || m.a === S.user.team)) || null;
}
// play all pending AI matches of the current day (user match must already be done)
function playDay() {
  const list = matchesToday().filter((m) => !m.done).sort(by((m) => m.t));
  for (const m of list) {
    if (!S.presim && isUserTeam(m.h) || !S.presim && isUserTeam(m.a)) continue;
    simulateMatch(m);
  }
  for (const cid of S.active) { const c = S.comps[cid]; if (c && c.kind === 'youth') playYouthDay(c); }
}
function advanceDay(fast) {
  const um = userMatchToday();
  if (um && !fast) return { blocked: um };
  playDay();
  if (!fast) dailyEvents();
  else fastDailyEvents();
  S.date++;
  const t = ymd(S.date);
  if (t.m === 7 && t.d === 1 && S.euSeason < t.y) euRollover();
  if (t.m === 1 && t.d === 1 && S.mode === 'normal' && (S.saSeason || 0) < t.y) saRollover();
  if (S.mode === 'national') intlDaily();
  checkSeasonEnd();
  return { ok: true };
}
function fastForward(target, onProgress) {
  const start = S.date;
  let n = 0;
  while (S.date < target) {
    playDay();
    fastDailyEvents();
    S.date++;
    const t = ymd(S.date);
    if (t.m === 7 && t.d === 1 && S.euSeason < t.y && !S.euPending) euRollover();
    if (t.m === 1 && t.d === 1 && S.mode === 'normal' && (S.saSeason || 0) < t.y) saRollover();
    if (onProgress && ++n % 15 === 0) onProgress((S.date - start) / Math.max(1, target - start));
  }
}

/* ===================== players: development, contracts, regens ===================== */
function devDelta(p, minutesFactor) {
  const gap = (p.pot || p.o) - p.o;
  const a = p.age;
  let d;
  if (a <= 18) d = rfloat(2, 6);
  else if (a <= 20) d = rfloat(1.5, 5.5);
  else if (a <= 22) d = rfloat(0.8, 4);
  else if (a <= 24) d = rfloat(0.3, 2.5);
  else if (a <= 27) d = rfloat(-0.5, 2);
  else if (a <= 29) d = rfloat(-1.5, 1);
  else if (a <= 31) d = rfloat(-3, 0.5);
  else if (a <= 33) d = rfloat(-4, 0);
  else d = rfloat(-6, -1);
  // playing time matters, wherever it comes from (a loan included); the last steps to the top are the hardest
  if (d > 0) d *= clamp(gap / 5, 0.25, 1.3) * (0.6 + 0.6 * minutesFactor) * (p.loan && minutesFactor > 0.5 ? 1.15 : 1) * highDamp(p.o);
  return d;
}
const highDamp = (o) => (o >= 88 ? 0.3 : o >= 85 ? 0.45 : o >= 82 ? 0.55 : o >= 79 ? 0.6 : o >= 76 ? 0.8 : 1);
// dynamic potential (July, 19 to 24 years old): a youngster who hardly plays loses some of it, one who plays well
// every week can raise it
function potentialChange(p, mf) {
  if (p.age < 19 || p.age > 24 || p.natOnly) return 0;
  const avgR = p.an ? p.ar / p.an : 0;
  if (mf < 0.25 && p.pot - p.o > 3) return -rint(p.age >= 22 ? 1 : 0, 2);
  if (mf >= 0.8 && avgR >= 7.2 && p.pot < 88) return rnd() < 0.5 ? 1 : 0;
  return 0;
}
// games played in the development year (p.ay counts every match, the season stats are wiped when competitions end)
function seasonApps(p) {
  let apps = 0;
  if (p.st) for (const k in p.st) apps += p.st[k][0];
  return Math.max(p.ay || 0, apps);
}
function minutesFactorOf(p) {
  return !p.st && !p.ay ? 0.3 : clamp(seasonApps(p) / 28, 0, 1);
}
// July: aging, development, retirements, contracts
function yearlyPlayers(y) {
  const skipAging = y <= S.era;
  const retired = [];
  const devReport = [];
  for (const id in S.players) {
    const p = S.players[id];
    if (p.natOnly && S.mode !== 'national') continue;
    if (!skipAging) {
      p.age++;
      if (S.zoeira) {
        p.o += rint(1, 10);
        p.pot = Math.max(p.pot, p.o);
        if (p.a) p.a = p.a.map((v) => v + rint(0, 6));
      } else {
        const mf = minutesFactorOf(p);
        const pc = potentialChange(p, mf);
        if (pc) p.pot = Math.max(p.o, p.pot + pc);
        const o0 = p.o;
        const d = Math.round(devDelta(p, mf));
        p.o = clamp(p.o + d, 30, Math.max(p.pot, p.o));
        if (isUserTeam(p.t) || (p.loan && isUserTeam(p.loan.from))) devReport.push({ p, d: p.o - o0, pc, g: seasonApps(p) });
        if (p.age >= 30 && rnd() < 0.5) p.pot = Math.max(p.o, p.pot - 1);
        if (p.a) p.a = p.a.map((v, i) => clamp(v + d + (i === 0 && p.age > 29 ? -rint(0, 2) : 0), 15, 99));
      }
      // retirement
      if (!S.zoeira) {
        let pr = 0;
        if (p.age >= 41) pr = 0.95; else if (p.age >= 38) pr = 0.6; else if (p.age >= 36) pr = 0.35; else if (p.age >= 34) pr = 0.12; else if (p.age >= 33 && p.o < 70) pr = 0.1;
        if (p.o >= 84) pr *= 0.4;
        if (rnd() < pr) retired.push(p);
      } else if (p.age >= 270) retired.push(p);
    }
    // season stats reset for EU comps already done by archive; refresh wage on expiry
    p.cnp = 0;
    p.ay = 0; p.ar = 0; p.an = 0;
  }
  if (devReport.length && !S.presim) devInbox(devReport, 'Evolução do elenco na temporada', true);
  for (const p of retired) retirePlayer(p);
  // contracts expiring this summer -> free agents (AI renews most)
  const rankCache = {};
  for (const id in S.players) {
    const p = S.players[id];
    if (!p.t || p.natOnly) continue;
    const t = S.teams[p.t];
    if (p.loan && p.loan.until <= S.date) endLoan(p);
    if (p.ct && p.ct < y + (S.mode === 'normal' && t && isSAteam(t.id) ? 0 : 1) && p.ct <= y) {
      if (isUserTeam(p.t)) {
        addInbox('contract', 'Departamento jurídico', `${p.n} deixou o clube`, `O contrato de ${p.n} terminou e ele saiu de graça.`);
        releasePlayer(p, true);
      } else if (rnd() < aiRenewChance(p, t, rankCache)) {
        aiRenew(p, t, y);
      } else releasePlayer(p, true);
    }
  }
  // regens for AI clubs & squad size enforcement
  if (S.mode !== 'national') for (const tid in S.teams) {
    const t = S.teams[tid];
    if (t.isNat || t.ext) continue;
    if (!isUserTeam(t.id)) youthIntakeAI(t);
    if (t.stOnly) refreshStateClub(t);
    enforceSquadSize(t);
  }
  if (isUserTeam(S.user.team) && !S.zoeira && S.mode !== 'national') {
    addInbox('scout', 'Academia', 'Nova safra da base', 'Os juniores da academia subiram de categoria. Confira a aba Academia para promover jogadores.');
  }
}
// Clubs fight to keep the players that matter: the stars and starters renew almost always, only the fringe, the old
// and the surplus are let go (so the free-agent market is made of leftovers, not of the big clubs' best players)
function aiRenewChance(p, t, cache) {
  if (!t) return 0.5;
  let rk = cache && cache[t.id];
  if (!rk) {
    rk = {};
    squadOf(t.id).sort(by((x) => x.o, -1)).forEach((x, i) => { rk[x.id] = i; });
    if (cache) cache[t.id] = rk;
  }
  const rank = rk[p.id] === undefined ? 30 : rk[p.id];
  const lvl = teamRating(t.id);
  let pr = rank < 5 ? 0.985 : rank < 14 ? 0.94 : rank < 22 ? 0.8 : 0.55;
  if (p.o >= lvl + 2) pr = Math.max(pr, 0.985);
  if (p.age <= 23 && p.pot >= p.o + 5) pr = Math.max(pr, 0.95);
  if (p.age >= 36) pr = Math.min(pr, 0.35);
  else if (p.age >= 34) pr = Math.min(pr, rank < 11 ? 0.7 : 0.4);
  else if (p.age >= 32) pr -= 0.05;
  return clamp(pr, 0.05, 0.99);
}
function aiRenew(p, t, y) {
  p.ct = y + rint(1, 4);
  p.w = Math.max(wageDemand(p, t), Math.round((p.w || 0) * 0.9));
}
// during the season the AI also talks to the players with a contract about to end (like real clubs do): many are
// renewed before the summer, so few good players reach the market
function aiMidSeasonRenewals() {
  const cache = {};
  for (const tid of activeClubIds()) {
    if (isUserTeam(tid)) continue;
    const t = S.teams[tid];
    if (!t) continue;
    const end = S.mode === 'normal' && isSAteam(tid) ? ymd(S.date).y : seasonEndYear();
    for (const p of squadOf(tid)) {
      if (!p.ct || p.ct > end || p.loan) continue;
      if (rnd() < aiRenewChance(p, t, cache) * 0.45) aiRenew(p, t, end);
    }
  }
}
function isSAteam(tid) { return S.normal && S.normal.some((l) => l.cal === 'SA' && (l.teams.includes(tid) || l.bank.includes(tid))); }
function retirePlayer(p) {
  if (p.t) { const t = S.teams[p.t]; if (t) t.sq = t.sq.filter((x) => x !== p.id); removeFromLineups(p.id); }
  if (p.o >= 80) addNews(`${p.n} anuncia aposentadoria`, `Aos ${p.age} anos, ${p.n} pendura as chuteiras após uma bela carreira (${p.car[0]} jogos e ${p.car[1]} gols desde o início do jogo).`, 'retire', p.t ? [p.t] : [], { cat: 'Aposentadoria' });
  if (isUserTeam(p.t)) addInbox('info', 'Comissão técnica', `${p.n} se aposentou`, `${p.n} decidiu encerrar a carreira.`);
  for (const code in S.nations) { const n = S.nations[code]; if (n.sq) n.sq = n.sq.filter((x) => x !== p.id); }
  delete S.players[p.id];
}
function releasePlayer(p, free) {
  if (p.t) { const t = S.teams[p.t]; if (t) t.sq = t.sq.filter((x) => x !== p.id); removeFromLineups(p.id); }
  p.t = 0; p.tl = 0; p.ll = 0; p.loan = null;
  p.ct = 0; p.fd = S.date;
  _faCache = null;
}
function removeFromLineups(pid) {
  for (const id in S.teams) {
    const t = S.teams[id];
    if (t.xi) { const i = t.xi.indexOf(pid); if (i >= 0) t.xi[i] = 0; }
    if (t.bench) t.bench = t.bench.filter((x) => x !== pid);
  }
  S.youth.squad = S.youth.squad.filter((x) => x !== pid);
}
function movePlayer(p, toTeam, opts = {}) {
  if (p.t) { const t = S.teams[p.t]; if (t) t.sq = t.sq.filter((x) => x !== p.id); removeFromLineups(p.id); }
  p.t = toTeam;
  if (toTeam) p.fd = 0;
  p.tl = 0; p.ll = 0;
  p.sus = 0;
  if (toTeam) {
    const t = S.teams[toTeam];
    t.sq.push(p.id);
    // shirt number
    const used = new Set(squadOf(toTeam).filter((x) => x.id !== p.id).map((x) => x.num));
    if (!p.num || used.has(p.num)) {
      const pref = { GK: [1, 12, 13, 25], ST: [9, 19, 29], RW: [7, 17, 11], LW: [11, 7, 17], CAM: [10, 20, 8], CM: [8, 6, 14], CDM: [5, 6, 16], CB: [4, 5, 3, 15], RB: [2, 22], LB: [3, 23], RM: [7, 17], LM: [11, 18] }[p.p] || [];
      p.num = pref.concat(Array.from({ length: 98 }, (_, i) => i + 2)).find((n) => !used.has(n)) || 99;
    }
    if (!opts.loan) { p.ct = opts.ct || (seasonEndYear() + rint(2, 4)); p.w = opts.w || wageDemand(p, t); p.joined = S.date; }
    p.mor = 75;
  }
}
function endLoan(p) {
  const { from, o: o0, g } = p.loan;
  const at = p.t;
  p.loan = null;
  if (from && S.teams[from]) {
    movePlayer(p, from, { loan: true });
    if (isUserTeam(from)) {
      const grow = o0 ? p.o - o0 : 0;
      const how = o0 == null ? '' : ` Pelo ${teamName(at)} foram ${Math.round(g || 0)} jogos e o overall foi de ${o0} para ${p.o}` +
        (grow >= 4 ? ': o empréstimo valeu muito a pena.' : grow > 0 ? '.' : ', sem evolução.');
      addInbox('loan', 'Departamento de futebol', `${p.n} voltou de empréstimo${grow > 0 ? ` (+${grow} de overall)` : ''}`,
        `${p.n} retornou ao clube após o fim do empréstimo e já está à disposição.${how}`);
    }
  }
}
// AI youth intake (regens)
function youthIntakeAI(t) {
  const n = rint(1, 3);
  const lvl = teamRating(t.id);
  for (let i = 0; i < n; i++) {
    const p = generatePlayer({ nat: rnd() < 0.82 ? (t.c && S.nations[t.c] ? t.c : pick(['BRA', 'ARG', 'ESP', 'FRA', 'ENG'])) : pick(['BRA', 'ARG', 'FRA', 'POR', 'NGA', 'COL', 'ESP']),
      age: rint(17, 19), ovr: clamp(Math.round(lvl - rint(12, 20)), 45, 72), potBoost: Math.round(4 + 18 * rnd() ** 1.8) });
    movePlayer(p, t.id, { ct: yearOf(S.date) + 3 });
    p.w = Math.round(wageDemand(p, t) * 0.6);
  }
}
function enforceSquadSize(t) {
  let sq = squadOf(t.id);
  if (sq.length > 36) {
    const sorted = sq.sort(by((p) => p.o + (p.age <= 21 ? 4 : 0), -1));
    for (const p of sorted.slice(36)) releasePlayer(p, true);
  }
  sq = squadOf(t.id);
  const gk = sq.filter((p) => p.p === 'GK').length;
  const lvl = teamRating(t.id);
  let need = Math.max(0, 18 - sq.length);
  const add = (pos) => {
    const p = generatePlayer({ nat: t.c && S.nations[t.c] ? t.c : 'BRA', age: rint(18, 27), ovr: clamp(Math.round(lvl - rint(6, 12)), 45, 80), pos });
    movePlayer(p, t.id, { ct: yearOf(S.date) + 2 });
  };
  if (gk < 2) { add('GK'); if (gk < 1) add('GK'); need = Math.max(0, need - (2 - gk)); }
  while (need-- > 0) add(pick(['CB', 'CM', 'ST', 'RB', 'LB', 'CDM', 'RW', 'LW', 'CAM']));
}

// player generation (regens, youth academy, fillers)
const GEN_POS = ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST', 'ST'];
function genName(nat) {
  const pool = (S.names && (S.names[nat] || S.names[{ CONMEBOL: 'ARG', CONCACAF: 'MEX', CAF: 'SEN', AFC: 'KSA', OFC: 'AUS' }[(S.nations[nat] || {}).conf] || 'ENG'])) || { f: ['João'], l: ['Silva'], m: [] };
  if (pool.m && pool.m.length && rnd() < (nat === 'BRA' ? 0.25 : 0.05)) {
    const base = pick(pool.m);
    return rnd() < 0.3 ? base + pick(['inho', 'ão', ' Júnior', ' Jr.']) : base;
  }
  return `${pick(pool.f)} ${pick(pool.l)}`;
}
// the young talents that come in the game data (and saves made before this rule) get a higher ceiling:
// the younger and the better, the bigger the bump
function boostYoungPot(p) {
  if (p.age > 22 || p.natOnly) return;
  if ((p.pot || 0) - p.o >= 2) bumpYoungPot(p);
  if (p.pot < YOUNG_POT_MIN) p.pot = YOUNG_POT_MIN; // every youngster has at least 80 of potential
}
const YOUNG_POT_MIN = 80;
function bumpYoungPot(p) {
  const hi = p.pot >= 80, mid = p.pot >= 74;
  const b = p.age <= 19 ? (hi ? 5 : mid ? 4 : p.pot >= 68 ? 3 : 2) : p.age <= 21 ? (hi ? 4 : mid ? 3 : 2) : (hi ? 2 : 1);
  p.pot = Math.min(95, p.pot + b);
}
// generated youngsters (regens, scouted talents): the top of the potential scale is rare, 85+ is a once-in-a-while
// find and 90+ almost never shows up
function compressPot(v) {
  if (v > 90) v = 90 + (v - 90) * 0.25;
  else if (v > 86) v = 86 + (v - 86) * 0.6;
  else if (v > 81) v = 81 + (v - 81) * 0.85;
  return Math.round(v);
}
function generatePlayer(o) {
  const id = S.seq.p++;
  const pos = o.pos || pick(GEN_POS);
  const ovrV = Math.round(o.ovr);
  const n = genName(o.nat);
  const pot = clamp(Math.max(ovrV, compressPot(ovrV + (o.potBoost ?? rint(4, 18)))), ovrV, 92);
  const prof = { GK: [0, 0, 0, 0, 0, 0], CB: [-12, -25, -12, -14, 2, 0], RB: [2, -18, -6, -6, -4, -6], LB: [2, -18, -6, -6, -4, -6], CDM: [-10, -14, -2, -6, 0, 0], CM: [-6, -6, 1, -2, -10, -6], CAM: [-2, -2, 1, 2, -30, -14], RM: [4, -6, -2, 0, -28, -12], LM: [4, -6, -2, 0, -28, -12], RW: [6, -4, -4, 2, -34, -14], LW: [6, -4, -4, 2, -34, -14], ST: [2, 2, -10, -3, -40, -4] }[pos];
  const a = pos === 'GK' ? [ovrV + rint(-3, 3), ovrV + rint(-3, 3), ovrV + rint(-6, 2), ovrV + rint(-3, 3), 40 + rint(0, 20), ovrV + rint(-3, 3)]
    : prof.map((d) => clamp(ovrV + d + rint(-5, 5), 20, 99));
  const parts = n.split(' ');
  const p = { id, n, s: parts.length > 1 ? parts[parts.length - 1] : n, t: 0, p: pos, alt: '', age: o.age || rint(17, 30), o: ovrV, pot, nat: o.nat,
    f: (pos === 'LB' || pos === 'LM' || pos === 'LW') && rnd() < 0.7 ? 'L' : rnd() < 0.2 ? 'L' : 'R', h: pos === 'GK' ? rint(184, 198) : rint(168, 194), a,
    num: 0, ct: 0, fit: 100, fitD: 0, form: 0, mor: 70, car: [0, 0, 0], w: 0 };
  S.players[id] = p;
  return p;
}

// young players also grow during the season (October, January and April), with the games they played since the
// last step (on loan too)
function midSeasonDevelopment() {
  if (S.zoeira) return;
  const rep = [];
  for (const id in S.players) {
    const p = S.players[id];
    const recent = p.aq || 0;
    p.aq = 0;
    if (p.age > 22 || p.o >= p.pot || p.natOnly) continue;
    const mf = clamp(recent / 9, 0, 1);
    const young = p.age <= 20;
    if (rnd() > (young ? 0.3 + mf * 0.5 : 0.15 + mf * 0.35) * highDamp(p.o)) continue;
    let d = 1;
    if (young && mf > 0.6 && rnd() < 0.3) d++;
    if (p.loan && mf > 0.6 && rnd() < 0.25) d++;
    const o0 = p.o;
    p.o = Math.min(p.pot, p.o + d);
    if (p.a) p.a = p.a.map((v) => clamp(v + (p.o - o0), 15, 99));
    if (p.o > o0 && (isUserTeam(p.t) || (p.loan && isUserTeam(p.loan.from)))) rep.push({ p, d: p.o - o0, g: recent });
  }
  if (rep.length && !S.presim) devInbox(rep, 'Evolução dos jovens no trimestre', false);
}
// a short report of how the user's players developed (loaned players included)
function devInbox(rows, title, yearly) {
  const up = rows.filter((r) => r.d > 0).sort((a, b) => b.d - a.d || b.p.o - a.p.o);
  const dn = rows.filter((r) => r.d < 0).sort((a, b) => a.d - b.d);
  const potDn = rows.filter((r) => r.pc < 0), potUp = rows.filter((r) => r.pc > 0);
  if (!up.length && !(yearly && (dn.length || potDn.length))) return;
  const nm = (r) => `${r.p.n} ${r.d > 0 ? '+' : ''}${r.d} (${r.p.o}${r.p.loan ? `, emprestado ${tA(r.p.t, 'ao')}` : ''})`;
  const parts = [];
  if (up.length) parts.push(`Evoluíram: ${up.slice(0, 10).map(nm).join(', ')}${up.length > 10 ? ` e mais ${up.length - 10}` : ''}.`);
  if (yearly && dn.length) parts.push(`Caíram com a idade: ${dn.slice(0, 6).map(nm).join(', ')}.`);
  if (potUp.length) parts.push(`Potencial em alta pelas boas atuações: ${potUp.map((r) => `${r.p.n} (${r.p.pot})`).join(', ')}.`);
  if (potDn.length) parts.push(`Potencial em queda por falta de minutos: ${potDn.map((r) => `${r.p.n} (${r.p.pot})`).join(', ')}. Jogar ou emprestar ajuda.`);
  if (!yearly) parts.push('Quem joga evolui mais rápido, inclusive emprestado.');
  addInbox('scout', 'Comissão técnica', title, parts.join(' '));
}

/* ===================== transfers & contracts ===================== */
function isWindowOpen(day = S.date) { const m = monthOf(day); return m === 6 || m === 7 || m === 8 || m === 1; }
function windowInfo() {
  const t = ymd(S.date);
  if (isWindowOpen()) {
    const close = t.m === 1 ? dayOf(t.y, 1, 31) : dayOf(t.y, 8, 31);
    return { open: true, text: `Janela aberta até ${fmtDate(close, 'dm')}`, close };
  }
  const open = t.m >= 9 ? dayOf(t.y + 1, 1, 1) : dayOf(t.y, 6, 1);
  return { open: false, text: `Janela fechada · abre em ${fmtDate(open, 'dm')}`, open };
}
function sellerImportance(p) {
  const t = S.teams[p.t];
  if (!t) return 0.8;
  const sq = squadOf(t.id).sort(by((x) => x.o, -1));
  const rank = sq.findIndex((x) => x.id === p.id);
  if (p.tl) return 0.85;
  if (rank < 3) return 1.55;
  if (rank < 11) return 1.28;
  if (rank < 18) return 1.08;
  return 0.95;
}
function askingPrice(p) {
  if (!p.t) return 0;
  let v = playerValue(p) * sellerImportance(p);
  const yearsLeft = (p.ct || 0) - seasonEndYear();
  if (yearsLeft <= 0) v *= 0.7; else if (yearsLeft >= 3) v *= 1.08;
  return roundMoney(v);
}
function teamCount(tid) { return (S.tr.counts[tid] = S.tr.counts[tid] || 0); }
function bumpCount(tid) { S.tr.counts[tid] = (S.tr.counts[tid] || 0) + 1; }

function executeTransfer(p, toTeam, fee, opts = {}) {
  const from = p.t;
  const fromT = S.teams[from], toT = S.teams[toTeam];
  if (fromT) { fromT.budget += fee; bumpCount(from); }
  if (toT) { toT.budget -= fee; bumpCount(toTeam); }
  movePlayer(p, toTeam, { ct: opts.ct, w: opts.w });
  if (opts.loanFrom) p.loan = { from: opts.loanFrom, until: opts.until, o: p.o, g: 0 }; // o, g: overall at the start, games played
  const rec = { d: S.date, pid: p.id, n: p.n, from, to: toTeam, fee, loan: !!opts.loanFrom, o: p.o };
  S.tr.log.unshift(rec);
  if (S.tr.log.length > 400) S.tr.log.length = 400;
  const big = fee >= 50e6 || p.o > 85;
  if (big && !S.presim) {
    const T = teamName(toTeam), F = from ? teamName(from) : '';
    const bomb = fee >= 80e6 || p.o >= 88;
    if (!from) {
      addNews(`${T} contrata ${p.n} de graça`, `${TA(toTeam)} assinou com ${p.n} (${POS_LONG[p.p].toLowerCase()}, ${p.age} anos, ${p.o} de overall), que estava livre no mercado.`,
        'transfer', [toTeam], { cat: 'Mercado da bola', hot: bomb, fee: 0 });
      return rec;
    }
    const head = opts.loanFrom ? `${p.n} é emprestado ${tA(toTeam, 'ao')}`
      : pick(bomb ? [`Bomba no mercado: ${p.n} acerta com ${tA(toTeam)}`, `${T} fecha a contratação de ${p.n}`] : [`${p.n} é o novo reforço ${tA(toTeam, 'do')}`, `${T} anuncia ${p.n}`, `Mercado: ${T} fecha com ${p.n}`]);
    addNews(head, `${TA(toTeam)} ${opts.loanFrom ? 'recebe por empréstimo' : 'acertou a contratação de'} ${p.n} (${POS_LONG[p.p].toLowerCase()}, ${p.age} anos, ${p.o} de overall), que estava ${tA(from, 'no')}${fee ? `. A operação gira em torno de ${fmtMoney(fee)}` : ''}.`,
      'transfer', [toTeam, from], { cat: 'Mercado da bola', hot: bomb, fee });
  }
  return rec;
}

// ---------------------------------------------------------------- AI market
let _poolCache = null;
function marketPool() {
  if (_poolCache && _poolCache.d === S.date) return _poolCache.byPos;
  const byPos = {};
  for (const id in S.players) {
    const p = S.players[id];
    if (p.natOnly || p.ret) continue;
    if (p.t && S.teams[p.t] && S.teams[p.t].isNat) continue;
    (byPos[p.p] = byPos[p.p] || []).push(p);
  }
  for (const k in byPos) byPos[k].sort(by((p) => p.o, -1));
  _poolCache = { d: S.date, byPos };
  return byPos;
}
function activeClubIds() {
  if (S.mode === 'ultra') return S.ultra.div.flat().concat(S.ultra.bank);
  if (S.mode === 'normal') return uniq(S.normal.flatMap((l) => l.teams.concat(l.bank)).concat(S.fill.ucl, S.fill.uel, S.fill.liber, S.fill.sula || []));
  return [];
}
function aiTransferDay(fast) {
  if (S.mode === 'national') return;
  const t = ymd(S.date);
  const open = isWindowOpen();
  // free agents can sign at any time of the year (more in the windows)
  aiFreeAgentDay(open ? 0.05 : 0.02, open && ((t.m === 8 && t.d >= 24) || (t.m === 1 && t.d >= 24)));
  if (!open) return;
  const ids = activeClubIds().filter((id) => !isUserTeam(id));
  const closing = (t.m === 8 && t.d >= 24) || (t.m === 1 && t.d >= 24);
  const last = (t.m === 1 && t.d >= 28);
  // busier market: the summer opens with a rush, and the deadline days are hectic
  const rush = (t.m === 6 || t.m === 7) && t.d <= 25 || (t.m === 1 && t.d <= 12);
  const per = closing ? 0.2 : rush ? 0.1 : 0.07;
  for (const tid of ids) {
    const lacking = teamCount(tid) < 3;
    if (rnd() > per && !(closing && lacking && rnd() < (last ? 1 : 0.35))) continue;
    aiTryBuy(S.teams[tid], closing);
    if (last && teamCount(tid) < 3) aiSellSurplus(S.teams[tid], true);
  }
  // AI offers to the user
  if (!fast && S.user.team && !S.coach.unemployed) aiOffersForUser();
}

// ---------------------------------------------------------------- free agents
let _faCache = null;
function freeAgentPool() {
  if (_faCache && S.date - _faCache.d < 7 && _faCache.s === S) return _faCache.list;
  const list = [];
  for (const id in S.players) {
    const p = S.players[id];
    if (p.t || p.natOnly || p.ret || p.yth) continue;
    list.push(p);
  }
  list.sort(by((p) => p.o, -1));
  _faCache = { d: S.date, s: S, list };
  return list;
}
function aiSignFree(p, t) {
  const wage = wageDemand(p, t);
  executeTransfer(p, t.id, 0, { w: wage, ct: seasonEndYear() + rint(1, 3) });
}
// each day a few clubs look at the free agents: they sign those who really improve the team (and are affordable)
function aiFreeAgentDay(prob, closing) {
  const pool = freeAgentPool();
  if (!pool.length) return;
  for (const tid of activeClubIds()) {
    if (isUserTeam(tid)) continue;
    const t = S.teams[tid];
    if (!t || t.ext || t.isNat) continue;
    if (rnd() > prob && !(closing && teamCount(tid) < 3 && rnd() < 0.3)) continue;
    const n = squadOf(tid).length;
    if (n >= 30) continue;
    const need = aiNeed(t);
    if (!need) continue;
    const lvl = teamRating(tid);
    const posList = [need.pos].concat(Object.keys(COMPAT[need.pos] || {}).filter((x) => x !== need.pos).slice(0, 2));
    const minO = need.depth ? lvl - 12 : Math.max(need.cur + 1, lvl - 7);
    let best = null, bs = -1e9;
    let seen = 0;
    for (const p of pool) {
      if (p.t) continue; // signed meanwhile
      if (p.o > lvl + 7) continue; // too good for this club
      if (p.o < minO) break; // list is sorted by overall
      if (p.age > 35 || !posList.includes(p.p)) continue;
      if (++seen > 40) break;
      const w = wageDemand(p, t);
      if (t.wb && wageBill(tid) + w > t.wb * 1.05) continue;
      const s = (p.o - (need.cur || lvl)) * 3 - Math.max(0, p.age - 30) * 1.5 + (p.age <= 24 ? 2 : 0) + rnd() * 2;
      if (s > bs) { bs = s; best = p; }
    }
    if (best) aiSignFree(best, t);
  }
}
// weekly: good players do not stay long without a club; old/weak ones fade away
function freeAgentWeek() {
  const pool = freeAgentPool();
  const clubs = activeClubIds().filter((id) => !isUserTeam(id) && S.teams[id] && !S.teams[id].ext);
  for (const p of pool.slice()) {
    if (p.t) continue;
    if (!p.fd) p.fd = S.date;
    const free = S.date - p.fd;
    if (p.o >= 70 && free >= 21 && clubs.length) {
      // a club comparable to him takes him (he does not pick a much weaker club)
      const cand = clubs.filter((id) => { const r = teamRating(id); return r <= p.o + 3 && r >= p.o - 5 && squadOf(id).length < 31; });
      if (cand.length) { aiSignFree(p, S.teams[pick(cand)]); continue; }
      if (free >= 70) { const c2 = clubs.filter((id) => teamRating(id) <= p.o + 6 && squadOf(id).length < 32); if (c2.length) { aiSignFree(p, S.teams[pick(c2)]); continue; } }
    }
    if (p.age >= 34 && p.o < 78 && free >= 120) { retirePlayer(p); continue; }
    if (free >= 330 && p.o < 66) retirePlayer(p);
  }
}
function aiNeed(t) {
  const sq = squadOf(t.id);
  const lu = autoLineup(sq, t.form || '4-3-3');
  const slots = FORMATIONS[t.form || '4-3-3'];
  const lvl = teamRating(t.id);
  let worst = null, gap = -1e9;
  lu.xi.forEach((pid, i) => {
    const p = S.players[pid];
    const g = lvl - (p ? effRating(p, slots[i][0]) : 30) + rnd() * 3;
    if (g > gap) { gap = g; worst = { pos: slots[i][0], cur: p ? p.o : 40 }; }
  });
  // depth check
  const groups = {}; sq.forEach((p) => (groups[POS_GROUP[p.p]] = (groups[POS_GROUP[p.p]] || 0) + 1));
  if ((groups.GK || 0) < 2) return { pos: 'GK', cur: 0, depth: true };
  if (sq.length < 22) return { pos: pick(['CB', 'CM', 'ST', 'RW', 'LB']), cur: lvl - 8, depth: true };
  return worst;
}
function aiTryBuy(t, closing) {
  if (!t || t.ext) return;
  const need = aiNeed(t);
  if (!need) return;
  const lvl = teamRating(t.id);
  const pool = marketPool();
  const cands = [];
  const posList = [need.pos].concat(Object.keys(COMPAT[need.pos] || {}).filter((x) => x !== need.pos).slice(0, 2));
  const minO = need.depth ? lvl - 10 : Math.max(need.cur + 1, lvl - 6);
  const maxO = lvl + (closing ? 4 : 7);
  for (const pos of posList) {
    const arr = pool[pos] || [];
    for (let k = 0; k < 60; k++) {
      const p = arr[Math.floor(rnd() * arr.length)];
      if (!p || p.t === t.id || p.o < minO || p.o > maxO || p.age > 33) continue;
      if (p.joined && S.date - p.joined < 200) continue; // just signed: no ping-pong between clubs
      if (isUserTeam(p.t)) continue;
      cands.push(p);
    }
  }
  if (!cands.length) { if (closing && teamCount(t.id) < 3) aiSellSurplus(t); return; }
  let best = null, bestScore = -1e9;
  for (const p of cands) {
    const seller = S.teams[p.t];
    const price = p.t ? askingPrice(p) : 0;
    if (price > t.budget * 1.05) continue;
    if (seller && !seller.ext && teamRating(seller.id) > lvl + 5 && !p.tl && sellerImportance(p) > 1.2) continue;
    const wage = wageDemand(p, t);
    const score = (p.o - (need.cur || lvl)) * 3 - price / Math.max(1, t.budget) * 8 - Math.max(0, p.age - 29) * 1.5 + (p.age <= 23 ? 2 : 0) + rnd() * 2;
    if (score > bestScore) { bestScore = score; best = { p, price, wage }; }
  }
  if (!best) { if (closing && teamCount(t.id) < 3) aiSellSurplus(t); return; }
  const fee = best.p.t ? roundMoney(best.price * rfloat(0.92, 1.15)) : 0;
  executeTransfer(best.p, t.id, fee, { w: best.wage, ct: seasonEndYear() + rint(2, 5) });
  if (squadOf(t.id).length > 30) aiSellSurplus(t);
}
function aiSellSurplus(t, force) {
  const sq = squadOf(t.id).filter((p) => !isUserTeam(p.t) && !(p.joined && S.date - p.joined < 120)).sort(by((p) => p.o + (p.age <= 21 ? 6 : 0)));
  const p = sq[0];
  if (!p || squadOf(t.id).length <= (force ? 18 : 20)) return;
  // sell to an external / smaller club
  const buyers = activeClubIds().map((id) => S.teams[id]).filter((x) => x && x.id !== t.id && !isUserTeam(x.id) && teamRating(x.id) <= p.o + 3 && teamRating(x.id) >= p.o - 8);
  const ext = Object.values(S.teams).filter((x) => x.ext && !x.isNat);
  const buyer = buyers.length && rnd() < 0.6 ? pick(buyers) : pick(ext);
  if (!buyer) return;
  const fee = roundMoney(playerValue(p) * rfloat(0.6, 1.0));
  executeTransfer(p, buyer.id, buyer.budget > fee ? fee : 0, { w: wageDemand(p, buyer), ct: seasonEndYear() + rint(1, 3) });
}

// AI clubs bidding for the user's players
function aiOffersForUser() {
  const ut = S.teams[S.user.team];
  if (!ut || ut.isNat) return;
  const sq = squadOf(ut.id);
  const lvl = teamRating(ut.id);
  for (const p of sq) {
    if (S.tr.offers.some((o) => o.pid === p.id && o.status === 'open')) continue;
    if (p.joined && S.date - p.joined < 60) continue;
    let pr = 0.0025 + (p.tl ? 0.03 : 0) + Math.max(0, p.o - lvl) * 0.002 + (p.age <= 23 && p.pot >= 84 ? 0.004 : 0);
    if (p.ll) pr += 0.02;
    if (rnd() > pr) continue;
    const loanOffer = p.ll && !p.tl;
    // a loan comes from a club where he would play (not much stronger than him)
    const clubs = activeClubIds().map((id) => S.teams[id]).filter((x) => x && x.id !== ut.id && !x.isNat && (loanOffer
      ? teamRating(x.id) >= p.o - 12 && teamRating(x.id) <= p.o + 3 : teamRating(x.id) >= p.o - 5 && x.budget >= playerValue(p) * 0.8));
    const buyer = clubs.length ? pick(clubs) : null;
    if (!buyer) continue;
    const val = playerValue(p);
    const fee = loanOffer ? 0 : roundMoney(val * rfloat(0.82, 1.25) * (p.tl ? 0.92 : 1));
    const o = { id: nextId('of'), pid: p.id, from: buyer.id, fee, loan: loanOffer, status: 'open', d: S.date, maxPay: roundMoney(Math.max(fee, val * rfloat(1.05, 1.45))), rounds: 0 };
    S.tr.offers.push(o);
    addInbox('offer', teamName(buyer.id), loanOffer ? `Proposta de empréstimo por ${p.n}` : `Proposta por ${p.n}`,
      loanOffer ? `${teamName(buyer.id)} quer ${p.n} emprestado até o fim da temporada e promete minutos. Jogador emprestado que joga evolui mais rápido.` :
        `${teamName(buyer.id)} oferece ${fmtMoney(fee)} por ${p.n} (valor de mercado: ${fmtMoney(val)}).`, { offer: o.id });
  }
}
function respondOffer(offerId, action, counterFee) {
  const o = S.tr.offers.find((x) => x.id === offerId);
  if (!o || o.status !== 'open') return { msg: 'Proposta não está mais disponível.' };
  const p = S.players[o.pid];
  if (!p || !isUserTeam(p.t)) { o.status = 'void'; return { msg: 'O jogador não está mais no clube.' }; }
  if (action === 'reject') { o.status = 'rejected'; p.mor = clamp((p.mor || 70) - (p.o > teamRating(p.t) ? 6 : 2), 0, 100); return { msg: 'Proposta recusada.' }; }
  if (action === 'accept') {
    if (!isWindowOpen()) return { msg: 'A janela de transferências está fechada.' };
    o.status = 'done';
    if (o.loan) executeTransfer(p, o.from, 0, { loanFrom: p.t, until: seasonEndDay() });
    else executeTransfer(p, o.from, o.fee, { w: wageDemand(p, S.teams[o.from]) });
    S.board.conf = clamp(S.board.conf + (o.fee > playerValue(p) ? 2 : 0), 0, 100);
    return { msg: o.loan ? `${p.n} foi emprestado ${tA(o.from, 'ao')}.` : `${p.n} foi vendido ${tA(o.from, 'ao')} por ${fmtMoney(o.fee)}.`, done: true };
  }
  if (action === 'counter') {
    o.rounds++;
    if (counterFee <= o.maxPay) {
      o.fee = roundMoney(counterFee);
      return { msg: `${teamName(o.from)} aceitou pagar ${fmtMoney(o.fee)}. Confirme para concluir a venda.`, accepted: true };
    }
    if (o.rounds >= 3 || counterFee > o.maxPay * 1.6) { o.status = 'rejected'; return { msg: `${teamName(o.from)} desistiu da negociação.` }; }
    const mid = roundMoney(Math.min(o.maxPay, (o.fee + counterFee) / 2));
    o.fee = Math.max(o.fee, mid);
    return { msg: `${teamName(o.from)} fez uma contraproposta de ${fmtMoney(o.fee)}.`, countered: true };
  }
  return { msg: '' };
}

// ---------------------------------------------------------------- user buying
function clubResponse(p, fee, loan) {
  const seller = S.teams[p.t];
  if (!p.t) return { ok: true, free: true };
  if (seller && seller.isNat) return { ok: false, msg: 'Jogador indisponível.' };
  if (loan) {
    const imp = sellerImportance(p);
    if (imp > 1.2 && !p.ll) return { ok: false, msg: `${teamName(p.t)} não empresta jogadores importantes.` };
    if (p.age > 29 && !p.ll) return { ok: false, msg: `${teamName(p.t)} prefere não emprestar este jogador.` };
    return { ok: true };
  }
  const ask = askingPrice(p);
  if (fee >= ask) return { ok: true };
  if (fee >= ask * 0.85) return { ok: false, counter: ask, msg: `${teamName(p.t)} pede ${fmtMoney(ask)}.` };
  if (fee >= ask * 0.6) return { ok: false, counter: roundMoney(ask * 1.05), msg: `Proposta baixa. ${teamName(p.t)} quer ${fmtMoney(roundMoney(ask * 1.05))}.` };
  return { ok: false, msg: `${teamName(p.t)} recusou a proposta sem negociar.` };
}
function playerWageDemand(p, team, role) {
  let w = wageDemand(p, team);
  const cur = p.w || 0;
  const strengthGap = p.t ? teamRating(p.t) - teamRating(team.id) : 0;
  if (strengthGap > 0) w *= 1 + strengthGap * 0.05;
  w = Math.max(w, cur * (p.t === team.id ? 1.05 : 1.12));
  w *= { titular: 1, rotacao: 1.1, reserva: 1.25 }[role] || 1;
  return Math.round(w / 100) * 100;
}
function playerContractResponse(p, team, wage, years, role) {
  const demand = playerWageDemand(p, team, role);
  if (p.t && p.t !== team.id && teamRating(p.t) - teamRating(team.id) > 10 && wage < demand * 1.6) return { ok: false, demand: roundMoney(demand * 1.6), msg: `${p.n} não quer se transferir para um clube tão menor.` };
  if (p.age >= 32 && years > 2) return { ok: false, demand, msg: `${p.n} prefere um contrato de no máximo 2 anos.` };
  if (wage >= demand) return { ok: true };
  if (wage >= demand * 0.9) return { ok: false, demand, msg: `${p.n} quer ${fmtMoney(demand)}/semana.` };
  return { ok: false, demand: roundMoney(demand * 1.05), msg: `${p.n} achou a proposta salarial muito baixa.` };
}
function wageBill(teamId) { return sum(squadOf(teamId), (p) => p.w || 0); }
// moving money between the transfer budget and the wage budget (like FIFA's budget slider): every extra unit of weekly
// wages costs the weeks left until the budgets are set again (July 1st); giving wage room back returns 80% of it
function budgetWeeksLeft() {
  const t = ymd(S.date);
  const reset = t.m >= 7 ? dayOf(t.y + 1, 7, 1) : dayOf(t.y, 7, 1);
  return clamp(Math.ceil((reset - S.date) / 7), 4, 52);
}
const niceWage = (v) => Math.max(1000, Math.ceil(v / 1000) * 1000);
function wageRaiseCost(perWeek) { return Math.round(perWeek * budgetWeeksLeft() / 1000) * 1000; }
function wageLowerReturn(perWeek) { return Math.round(perWeek * budgetWeeksLeft() * 0.8 / 1000) * 1000; }
function raiseWageBudget(t, perWeek) {
  perWeek = niceWage(perWeek);
  const cost = wageRaiseCost(perWeek);
  if (cost > t.budget) return { ok: false, msg: `Faltam ${fmtMoney(cost - t.budget)} no orçamento de transferências para ampliar a folha em ${fmtMoney(perWeek)}/semana.` };
  t.budget -= cost;
  t.wb += perWeek;
  return { ok: true, msg: `Folha salarial ampliada em ${fmtMoney(perWeek)}/semana. ${fmtMoney(cost)} saíram do orçamento de transferências.` };
}
function lowerWageBudget(t, perWeek) {
  const room = Math.floor((t.wb - wageBill(t.id)) / 1000) * 1000;
  perWeek = Math.min(niceWage(perWeek), room);
  if (perWeek <= 0) return { ok: false, msg: 'Não há folga na folha salarial para devolver.' };
  const back = wageLowerReturn(perWeek);
  t.wb -= perWeek;
  t.budget += back;
  return { ok: true, msg: `Folha salarial reduzida em ${fmtMoney(perWeek)}/semana. ${fmtMoney(back)} voltaram para o orçamento de transferências.` };
}
function userSign(p, fee, wage, years, loan) {
  const t = S.teams[S.user.team];
  if (!isWindowOpen() && p.t) return { ok: false, msg: 'A janela de transferências está fechada.' };
  if (!loan && fee > t.budget) return { ok: false, msg: 'Orçamento de transferências insuficiente.' };
  if (wageBill(t.id) + wage > t.wb * 1.02) {
    const need = niceWage(wageBill(t.id) + wage - t.wb);
    return { ok: false, wbNeed: need, msg: `O salário estoura a folha salarial definida pela diretoria (faltam ${fmtMoney(need)}/semana). Você pode remanejar verba do orçamento de transferências para a folha.` };
  }
  if (squadOf(t.id).length >= 36) return { ok: false, msg: 'O elenco já tem 36 jogadores (limite).' };
  if (loan) {
    const from = p.t;
    executeTransfer(p, t.id, 0, { loanFrom: from, until: seasonEndDay() });
    p.w = wage;
  } else {
    executeTransfer(p, t.id, fee, { w: wage, ct: seasonEndYear() + years - 1 });
  }
  addNews(pick([`${t.n} anuncia ${p.n}`, `Oficial: ${p.n} é ${tA(t, 'do')}`]), `${p.n} (${POS_LONG[p.p].toLowerCase()}, ${p.o} de overall) chega ${loan ? 'por empréstimo' : fee ? `por ${fmtMoney(fee)}` : 'sem custos'} para reforçar ${tA(t)} de ${S.coach.name}.`, 'transfer', [t.id], { cat: 'Mercado da bola', fee });
  return { ok: true, msg: `${p.n} assinou com ${tA(t)}!` };
}
function renewContract(p, wage, years) {
  const t = S.teams[p.t];
  const r = playerContractResponse(p, t, wage, years, 'titular');
  if (!r.ok) return r;
  p.w = wage; p.ct = seasonEndYear() + years - 1;
  p.mor = clamp((p.mor || 70) + 8, 0, 100);
  return { ok: true, msg: `${p.n} renovou até ${p.ct}.` };
}
function releaseFromUser(p) {
  const t = S.teams[p.t];
  const weeks = Math.max(0, ((p.ct || seasonEndYear()) - seasonEndYear()) * 52 + 26);
  const cost = Math.round((p.w || 0) * weeks * 0.5);
  t.budget -= cost;
  releasePlayer(p, true);
  return cost;
}

/* ===================== career: inbox, news, board, coach, season end ===================== */
const FUTCOIN_TABLE = { UL1: 150, UL2: 50, UL3: 40, UL4: 30, CUPUL: 75, UCL: 100, UEL: 80, UECL: 60, LIB: 100, SULA: 80, MUN: 125, WC: 125, EURO: 100, COPA: 100, YOUTH: 10 };
function futcoinsFor(key) {
  if (FUTCOIN_TABLE[key] !== undefined) return FUTCOIN_TABLE[key];
  if (key.startsWith('CUP')) return MAIN_LEAGUES.has(key.slice(3)) || key === 'CUPUL' ? 75 : 50;
  if (key.startsWith('EST')) return BIG_STATES.has(key) ? 50 : 40; // state championships
  if (/^(ENG|ESP|GER|FRA|ITA|BRA|ARG|POR|NED)$/.test(key)) return 80;
  if (S.normal && leagueById(key)) return 60;
  if (/^(ENG|ESP|GER|FRA|ITA|BRA)2$/.test(key)) return 40;
  return 0;
}

// ---------------------------------------------------------------- inbox / news
function addInbox(type, from, subj, body, act) {
  if (S.presim) return;
  S.inbox.unshift({ id: nextId('msg'), d: S.date, type, from, subj, body, act: act || null, read: false });
  if (S.inbox.length > 120) S.inbox.length = 120;
}
function addNews(title, body, tag, teams, extra) {
  if (S.presim) return;
  const hot = extra && extra.hot;
  S.news.unshift(Object.assign({ id: nextId('news'), d: S.date, title, body, tag: tag || 'geral', teams: teams || [],
    likes: rint(80, 2400) * (hot ? 3 : 1), com: rint(5, 400) * (hot ? 3 : 1) }, extra || {}));
  if (S.news.length > 80) S.news.length = 80;
}
// headline + text for a match of the user's team, in the tone of a sports bulletin
function matchHeadline(m, uid) {
  const home = m.h === uid;
  const opp = home ? m.a : m.h;
  const gf = home ? m.hg : m.ag, ga = home ? m.ag : m.hg;
  const U = teamName(uid), O = teamName(opp);
  const side = home ? 0 : 1;
  const goals = (m.ev || []).filter((e) => e[1] === 'goal').sort((a, b) => a[0] - b[0]);
  const mine = goals.filter((e) => e[2] === side);
  const cnt = {};
  mine.forEach((e) => { if (e[3]) cnt[e[3]] = (cnt[e[3]] || 0) + 1; });
  const ranked = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const hat = ranked.find(([, n]) => n >= 3);
  const top = ranked.length ? pidName(+ranked[0][0]) : null;
  const firstAgainst = goals.length && goals[0][2] !== side;
  const last = goals[goals.length - 1];
  const late = last && last[0] >= 85 && last[2] === side && Math.abs(gf - ga) <= 1;
  const away = home ? '' : ' fora de casa';
  let t;
  if (m.pen) {
    const won = home ? m.pen[0] > m.pen[1] : m.pen[1] > m.pen[0];
    t = won ? pick([`Nos pênaltis, ${U} elimina ${tA(opp)}`, `${U} vence ${tA(opp)} nos pênaltis e avança`]) : pick([`${U} cai nos pênaltis diante ${tA(opp, 'do')}`, `Pênaltis: ${O} elimina ${tA(uid)}`]);
  } else if (gf > ga) {
    if (hat) t = `Hat-trick de ${pidName(+hat[0])}! ${U} vence ${tA(opp)}`;
    else if (gf - ga >= 3) t = pick([`${U} atropela ${tA(opp)}: ${gf} a ${ga}`, `Show de bola: ${U} goleia ${tA(opp)}`, `${U} passeia${away} e faz ${gf} a ${ga} ${tA(opp, 'no')}`]);
    else if (firstAgainst) t = pick([`Virada! ${U} supera ${tA(opp)}${away}`, `${U} sai atrás, mas vira sobre ${tA(opp)}`]);
    else if (late && last[3]) t = `No fim, ${pidName(last[3])} garante a vitória ${tA(uid, 'do')}`;
    else t = pick([top ? `Com gol de ${top}, ${U} vence ${tA(opp)}` : `${U} vence ${tA(opp)}`, `${U} bate ${tA(opp)}${away}`, `${U} supera ${tA(opp)} e soma três pontos`]);
  } else if (gf === ga) {
    if (gf === 0) t = pick([`${U} e ${O} ficam no 0 a 0`, `Sem gols: ${U} e ${O} não saem do zero`]);
    else if (late) t = `${U} arranca o empate no fim contra ${tA(opp)}`;
    else t = pick([`${U} e ${O} empatam em ${gf} a ${ga}`, `${U} fica no empate com ${tA(opp)}`]);
  } else if (ga - gf >= 3) t = pick([`${O} atropela ${tA(uid)}`, `Noite para esquecer: ${U} leva ${ga} ${tA(opp, 'do')}`]);
  else t = pick([`${U} perde para ${tA(opp)}`, `${O} vence ${tA(uid)}`, `Derrota: ${U} cai diante ${tA(opp, 'do')}${away}`]);
  const comp = S.comps[m.c];
  const rd = comp && comp.rounds && comp.rounds[m.r];
  const scorers = (k) => {
    const c2 = {};
    goals.filter((e) => e[2] === k).forEach((e) => { const nm = e[3] ? pidName(e[3]) : 'contra'; c2[nm] = (c2[nm] || 0) + 1; });
    return Object.entries(c2).map(([nm, n]) => (n > 1 ? `${nm} (${n})` : nm)).join(', ');
  };
  let body = `${teamName(m.h)} ${m.hg} x ${m.ag} ${teamName(m.a)}${m.pen ? ` (pênaltis ${m.pen[0]} x ${m.pen[1]})` : ''} · ${comp ? comp.name : ''}${rd ? `, ${rd.name}` : ''}.`;
  const sh = scorers(0), sa = scorers(1);
  if (sh || sa) body += ` Gols: ${[sh && `${teamShort(m.h)} ${sh}`, sa && `${teamShort(m.a)} ${sa}`].filter(Boolean).join(' · ')}.`;
  if (m.rt) {
    const best = Object.entries(m.rt).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 7.5) body += ` Destaque da partida: ${pidName(+best[0])}, nota ${best[1].toFixed(1)}.`;
  }
  return [t, body];
}
function streakOf(id, pred) {
  const res = lastResults(id, 12).slice().reverse();
  let n = 0;
  for (const mm of res) { if (pred(resultLetter(mm, id))) n++; else break; }
  return n;
}
function unreadCount() { return S.inbox.filter((m) => !m.read).length; }

// ---------------------------------------------------------------- board & coach
function userLeagueTeams() {
  const uid = S.user.team;
  if (S.mode === 'ultra') return S.ultra.div.find((d) => d.includes(uid)) || [];
  if (S.mode === 'normal') { const lg = S.normal.find((l) => l.teams.includes(uid) || l.bank.includes(uid)); return lg ? (lg.teams.includes(uid) ? lg.teams : lg.bank) : []; }
  return [];
}
function setBoardObjective() {
  const uid = S.user.team;
  if (!uid) return;
  if (S.mode === 'national') {
    const r = nationRating(S.teams[uid].code);
    S.board.obj = r >= 82 ? 'Brigar por títulos' : r >= 76 ? 'Chegar às fases finais dos torneios' : 'Classificar para os torneios e fazer bons jogos';
    S.board.objRank = 0;
    return;
  }
  const teams = userLeagueTeams();
  const sorted = teams.slice().sort(by((id) => teamRating(id), -1));
  const rank = sorted.indexOf(uid) + 1;
  const n = teams.length || 20;
  let obj, target;
  if (rank <= 2) { obj = 'Ser campeão da liga'; target = 1; }
  else if (rank <= Math.ceil(n * 0.25)) { obj = S.mode === 'normal' ? 'Classificar para uma competição continental' : 'Terminar entre os 4 primeiros'; target = Math.ceil(n * 0.25); }
  else if (rank <= Math.ceil(n * 0.6)) { obj = 'Terminar na primeira metade da tabela'; target = Math.ceil(n / 2); }
  else {
    const lg = S.mode === 'normal' && S.normal.find((l) => l.teams.includes(uid));
    obj = lg && !lg.down ? 'Terminar longe das últimas posições' : 'Evitar o rebaixamento'; target = n - 3;
  }
  S.board.obj = obj; S.board.objRank = target;
}
function expectedPoints(myR, oppR, home) {
  const d = myR - oppR + (home ? 2 : 0);
  const pw = 1 / (1 + Math.exp(-d / 4.2)) * 0.78;
  const pd = 0.26 - Math.min(0.12, Math.abs(d) * 0.008);
  return 3 * pw + pd;
}
function afterMatchHooks(m, st) {
  if (S.presim) return;
  const uid = S.user.team;
  if (!uid || S.coach.unemployed || (m.h !== uid && m.a !== uid)) {
    // headline results
    if (Math.abs(m.hg - m.ag) >= 5 && rnd() < 0.5 && !compIsMinor(S.comps[m.c])) {
      const w = m.hg > m.ag ? m.h : m.a, l = m.hg > m.ag ? m.a : m.h;
      const wg = Math.max(m.hg, m.ag), lg = Math.min(m.hg, m.ag);
      addNews(pick([`Goleada! ${teamName(w)} atropela ${tA(l)}`, `${teamName(w)} faz ${wg} ${tA(l, 'no')}`, `Massacre: ${teamName(w)} ${wg} x ${lg} ${teamName(l)}`]),
        `${teamName(m.h)} ${m.hg} x ${m.ag} ${teamName(m.a)} pela ${S.comps[m.c] ? S.comps[m.c].name : ''}. Resultado que mexe com a rodada.`, 'resultado', [w, l], { cat: 'Rodada', sc: [m.h, m.a, m.hg, m.ag] });
    }
    return;
  }
  const home = m.h === uid;
  const gf = home ? m.hg : m.ag, ga = home ? m.ag : m.hg;
  const opp = home ? m.a : m.h;
  const letter = resultLetter(m, uid);
  const rec = S.coach.rec;
  rec.gf += gf; rec.ga += ga;
  if (letter === 'V') rec.w++; else if (letter === 'D') rec.l++; else rec.d++;
  const pts = letter === 'V' ? 3 : letter === 'E' ? 1 : 0;
  const myR = S.teams[uid].isNat ? nationRating(S.teams[uid].code) : teamRating(uid);
  const opR = S.teams[opp].isNat ? nationRating(S.teams[opp].code) : teamRating(opp);
  const exp = expectedPoints(myR, opR, home && !m.n);
  const delta = (pts - exp) * 2.4;
  S.board.conf = clamp(S.board.conf + delta, 0, 100);
  S.coach.rating = clamp(S.coach.rating + (pts - exp) * 0.9, 10, 99);
  S.coach.rep = clamp(S.coach.rep + (pts - exp) * 0.25, 1, 99);
  // playing-time counters
  if (!S.teams[uid].isNat) {
    const playedIds = new Set(Object.keys(st.mins).map(Number));
    for (const p of squadOf(uid)) {
      if (playedIds.has(p.id)) { p.cnp = 0; if (p.promise) p.promise = Math.max(0, p.promise - 1); }
      else if (available(p, m.d)) p.cnp = (p.cnp || 0) + 1;
    }
  }
  // news about our match
  const [title, body] = matchHeadline(m, uid);
  addNews(title, body, 'clube', [uid, opp], { cat: 'Pós-jogo', sc: [m.h, m.a, m.hg, m.ag] });
  checkFiring();
}
function checkFiring() {
  if (S.noFire || S.coach.unemployed) return;
  const daysIn = S.date - S.seasonStart;
  if (S.board.conf < 12 && daysIn > 40) fireCoach('A diretoria perdeu a confiança no seu trabalho.');
  else if (S.board.conf < 25 && !S.flags.warned) {
    S.flags.warned = true;
    addInbox('board', 'Diretoria', 'Aviso da diretoria', `A diretoria está insatisfeita com os resultados. O objetivo é: ${S.board.obj}. Melhore o desempenho ou você pode ser demitido.`);
  }
  if (S.board.conf > 45) S.flags.warned = false;
}
function fireCoach(reason) {
  const t = S.teams[S.user.team];
  S.coach.hist.push({ team: t.id, n: t.n, from: S.flags.jobStart || S.seasonStart, to: S.date, why: 'Demitido' });
  S.coach.unemployed = true;
  S.coach.rep = clamp(S.coach.rep - 6, 1, 99);
  addInbox('board', 'Diretoria', 'Você foi demitido', `${reason} Seu contrato com ${tA(t)} foi encerrado. Procure um novo clube no Mercado de Trabalho.`);
  addNews(`${t.n} demite ${S.coach.name}`, `Após resultados abaixo do esperado, ${tA(t)} anunciou a saída do técnico ${S.coach.name}. A diretoria já procura um substituto.`, 'clube', [t.id], { cat: 'Bastidores', hot: true });
  S.jobs = generateJobs(6);
}
function resignJob() {
  const t = S.teams[S.user.team];
  S.coach.hist.push({ team: t.id, n: t.n, from: S.flags.jobStart || S.seasonStart, to: S.date, why: 'Pediu demissão' });
  S.coach.unemployed = true;
  addNews(`${S.coach.name} pede demissão ${tA(t, 'do')}`, `O técnico ${S.coach.name} anunciou sua saída ${tA(t, 'do')}.`, 'clube', [t.id], { cat: 'Bastidores', hot: true });
  S.jobs = generateJobs(6);
}
function careerClubIds() {
  if (S.mode === 'ultra') return S.ultra.div.flat();
  if (S.mode === 'normal') return S.normal.flatMap((l) => l.teams.concat(l.bank));
  return [];
}
function teamPrestige(id) {
  const t = S.teams[id];
  const r = t.isNat ? nationRating(t.code) : teamRating(id);
  return clamp((r - 58) * 3.2, 1, 99);
}
function generateJobs(n) {
  let pool;
  if (S.mode === 'national') pool = Object.values(S.nations).filter((x) => x.tid && (S.wcPool || []).includes(x.code)).map((x) => x.tid);
  else pool = careerClubIds();
  pool = pool.filter((id) => id !== S.user.team);
  const rep = S.coach.rep;
  const scored = pool.map((id) => ({ id, d: Math.abs(teamPrestige(id) - rep) + rnd() * 18 }));
  scored.sort(by((x) => x.d));
  return scored.slice(0, n).map((x) => ({ team: x.id, since: S.date }));
}
function applyForJob(teamId) {
  const pr = teamPrestige(teamId);
  const p = 1 / (1 + Math.exp(-(S.coach.rep + 8 - pr) / 7));
  if (rnd() < p) { takeJob(teamId); return { ok: true, msg: `Você foi contratado ${tA(teamId, 'pelo')}!` }; }
  S.jobs = (S.jobs || []).filter((j) => j.team !== teamId);
  return { ok: false, msg: `${teamName(teamId)} preferiu outro treinador.` };
}
function takeJob(teamId) {
  const old = S.user.team;
  if (old && !S.coach.unemployed && old !== teamId) {
    const t = S.teams[old];
    S.coach.hist.push({ team: old, n: t.n, from: S.flags.jobStart || S.seasonStart, to: S.date, why: 'Saiu para outro clube' });
  }
  S.user.team = teamId;
  S.coach.unemployed = false;
  S.flags.jobStart = S.date;
  S.board.conf = 62;
  S.flags.warned = false;
  const t = S.teams[teamId];
  if (t.isNat) { autoCallUp(t.code, true); }
  const lu = autoLineup(t.isNat ? nationSquad(t.code) : squadOf(teamId), t.form || '4-3-3');
  t.xi = lu.xi; t.bench = lu.bench;
  S.seasonStart = S.date;
  setBoardObjective();
  addInbox('board', 'Diretoria', `Bem-vindo ${tA(t, 'ao')}!`, `Seja bem-vindo, ${S.coach.name}. Nosso objetivo nesta temporada: ${S.board.obj}.`);
  addNews(`${t.n} anuncia ${S.coach.name}`, `${S.coach.name} é o novo técnico ${tA(t, 'do')} e chega com a missão de ${S.board.obj.toLowerCase()}.`, 'clube', [teamId], { cat: 'Bastidores' });
}

// ---------------------------------------------------------------- competitions finished
// competitions of the leagues far from the user's: their champions are reported together (publishDigest)
function userLeagueCountry() {
  const uid = S.user && S.user.team;
  const lg = uid && S.normal && S.normal.find((l) => l.teams.includes(uid) || l.bank.includes(uid));
  return lg ? lg.country : '';
}
const BIG_STATES = new Set(['ESTSP', 'ESTRJ', 'ESTMG', 'ESTRS']);
function compIsMinor(c) {
  if (c && c.key && (c.key.startsWith('EST') || c.key === 'COPINHA')) {
    if (c.teams && c.teams.includes(S.user.team)) return false;
    return userLeagueCountry() !== 'BRA' || !(BIG_STATES.has(c.key) || c.key === 'COPINHA');
  }
  if (S.mode !== 'normal' || !c || c.zone === 'UEFA' || ['LIB', 'SULA', 'MUN'].includes(c.key)) return false;
  const id = c.lgId || (c.key.startsWith('CUP') ? c.key.slice(3) : c.key);
  if (MAIN_LEAGUES.has(id) || !leagueById(id)) return false;
  return c.country !== userLeagueCountry();
}
function publishDigest() {
  const list = S.digest || [];
  S.digest = [];
  if (!list.length || S.presim) return;
  const isState = (x) => Object.values(UF_INFO).some((v) => v[0] === x.n);
  const states = list.filter(isState), rest = list.filter((x) => !isState(x));
  const leagues = rest.filter((x) => !/^Copa|Rock Cup/.test(x.n)), cups = rest.filter((x) => /^Copa|Rock Cup/.test(x.n));
  const line = (arr) => arr.map((x) => `${x.n}: ${x.chN}`).join(' · ');
  addNews(`Os campeões da temporada pelo mundo`, `${leagues.length ? `Ligas — ${line(leagues)}.` : ''}${cups.length ? ` Copas — ${line(cups)}.` : ''}${states.length ? ` Estaduais — ${line(states)}.` : ''}`.trim(),
    'titulo', list.slice(0, 4).map((x) => x.ch), { cat: 'Pelo mundo' });
}
function onCompFinished(c, entry) {
  if (S.presim) return;
  const uid = S.user.team;
  if (c.isQual) return;
  if (uid && !S.coach.unemployed && entry.ch === uid) {
    const coins = futcoinsFor(c.key);
    const trophy = { key: c.key, name: c.name, season: c.season, team: uid, teamN: teamName(uid), coins, d: S.date };
    S.coach.trophies.push(trophy);
    S.coach.rep = clamp(S.coach.rep + (coins >= 100 ? 10 : coins >= 75 ? 6 : 3), 1, 99);
    S.coach.rating = clamp(S.coach.rating + 5, 10, 99);
    S.board.conf = clamp(S.board.conf + 15, 0, 100);
    if (coins) awardFutcoins(coins, `${c.name} ${c.season}`);
    S.celebrate = S.celebrate || [];
    S.celebrate.push(trophy);
    if (c.key === 'MUN') addNews(`${TA(uid)} é campeão do mundo!`, `${TA(uid)} vence a final do Mundial de Clubes ${c.season}${entry.ru ? ` contra ${tA(entry.ru)}` : ''} e conquista o planeta sob o comando de ${S.coach.name}.`, 'titulo', [uid], { cat: 'Campeão', hot: true, cup: c.key });
    else addNews(pick([`É campeão! ${teamName(uid)} conquista ${cA(c.name)}`, `Festa: ${teamName(uid)} levanta a taça ${cA(c.name, 'do')}`]), `${teamName(uid)} conquista o título ${cA(c.name, 'do')} ${c.season}, sob o comando de ${S.coach.name}.`, 'titulo', [uid], { cat: 'Campeão', hot: true, cup: c.key });
  } else if (c.kind !== 'youth') {
    if (compIsMinor(c)) { (S.digest = S.digest || []).push({ n: c.name, s: c.season, ch: entry.ch, chN: entry.chN }); return; }
    if (c.key === 'MUN') addNews(`${entry.chN} é campeão do Mundial de Clubes`, `${TA(entry.ch)} conquista o Mundial de Clubes ${c.season}${entry.ru ? ` ao vencer ${tA(entry.ru)} na final` : ''}.`, 'titulo', [entry.ch], { cat: 'Campeão', hot: true, cup: c.key });
    else addNews(pick([`${entry.chN} conquista ${cA(c.name)}`, `${entry.chN} é campeão ${cA(c.name, 'do')}`]), `${TA(entry.ch)} é campeão ${cA(c.name, 'do')} ${c.season}${entry.ru ? `, à frente ${tA(entry.ru, 'do')}` : ''}.`, 'titulo', [entry.ch], { cat: 'Campeão', cup: c.key });
  }
}

// ---------------------------------------------------------------- messages
function welcomeMessages() {
  const t = S.teams[S.user.team];
  S.flags.jobStart = S.date;
  addInbox('board', 'Diretoria', `Bem-vindo ${tA(t, 'ao')}`, `Olá, ${S.coach.name}! A diretoria ${tA(t, 'do')} confia no seu trabalho. Objetivo da temporada: ${S.board.obj}.`);
  if (!t.isNat) {
    addInbox('info', 'Departamento financeiro', 'Orçamento da temporada', `Orçamento para transferências: ${fmtMoney(t.budget)}. Folha salarial máxima: ${fmtMoney(t.wb)}/semana.`);
    if (S.mode !== 'national' && !S.zoeira) addInbox('scout', 'Academia', 'Rede de olheiros', 'Contrate olheiros na aba Academia para descobrir jovens talentos de 14 a 16 anos em até 50 países.');
  } else {
    addInbox('info', 'Federação', 'Convocação', 'Revise a convocação na aba Elenco. Você pode chamar até 26 jogadores.');
  }
}
function seasonStartMessages() {
  if (!S.user.team || S.coach.unemployed) return;
  const t = S.teams[S.user.team];
  addInbox('board', 'Diretoria', `Temporada ${seasonLabel(yearOf(S.date), userLeagueZone())}`, `Nova temporada! Objetivo: ${S.board.obj}. Orçamento: ${fmtMoney(t.budget)}.`);
}
function weeklyPlayerMessages() {
  const uid = S.user.team;
  if (!uid || S.coach.unemployed || S.teams[uid].isNat) return;
  const sq = squadOf(uid);
  const sorted = sq.slice().sort(by((p) => p.o, -1));
  const cut = sorted[13] ? sorted[13].o : 0;
  for (const p of sq) {
    if (p.yth) continue;
    const recently = p.msgD && S.date - p.msgD < 75;
    if (!recently && p.o >= cut && p.age >= 20 && (p.cnp || 0) >= 7 && !p.promise && rnd() < 0.5) {
      p.msgD = S.date;
      p.mor = clamp((p.mor || 70) - 8, 0, 100);
      addInbox('player', p.n, 'Quero mais minutos', `Professor, estou há ${p.cnp} jogos sem entrar em campo. Sinto que posso ajudar o time e preciso jogar mais.`, { player: p.id, kind: 'minutes' });
    } else if (!recently && p.mor < 35 && p.o >= cut && rnd() < 0.25) {
      p.msgD = S.date;
      addInbox('player', p.n, 'Quero ser negociado', `Não estou feliz no clube. Gostaria que você me colocasse na lista de transferências.`, { player: p.id, kind: 'leave' });
    }
    if (p.promise === 0 && p.promiseD && S.date - p.promiseD > 40) { p.mor = clamp(p.mor - 15, 0, 100); p.promiseD = 0; }
  }
}
function answerPlayer(msgId, action) {
  const msg = S.inbox.find((m) => m.id === msgId);
  if (!msg || !msg.act) return '';
  const p = S.players[msg.act.player];
  msg.act.done = action;
  if (!p) return 'Jogador não está mais no clube.';
  if (action === 'promise') { p.promise = 4; p.promiseD = S.date; p.mor = clamp(p.mor + 10, 0, 100); return `Você prometeu mais oportunidades para ${p.n}.`; }
  if (action === 'list') { p.tl = 1; p.mor = clamp(p.mor + 6, 0, 100); return `${p.n} foi colocado na lista de transferências.`; }
  if (action === 'convince') {
    if (rnd() < 0.5) { p.mor = clamp(p.mor + 18, 0, 100); return `${p.n} aceitou ficar e está mais motivado.`; }
    p.mor = clamp(p.mor - 8, 0, 100); return `${p.n} não ficou convencido.`;
  }
  p.mor = clamp(p.mor - 10, 0, 100);
  return `Você ignorou o pedido de ${p.n}.`;
}

// ---------------------------------------------------------------- daily events
function dailyEvents() {
  aiTransferDay(false);
  const t = ymd(S.date);
  if (t.w === 1) { // Mondays
    weeklyPlayerMessages();
    weeklyLoans();
    if (S.coach.unemployed && rnd() < 0.6) { S.jobs = generateJobs(6); jobOfferMessage(); }
    scoutingWeek();
  }
  if (t.d === 1 && t.m === 1) contractReminders();
  if (t.d === 1 && (t.m === 1 || t.m === 4 || t.m === 10)) midSeasonDevelopment();
  if (t.d === 1 && [1, 3, 5, 9, 11].includes(t.m)) aiMidSeasonRenewals();
  if (t.w === 1) freeAgentWeek();
  posChangeDaily();
  if (t.d === 15 && t.m === 3 && userLeagueZone() === 'SA') contractReminders();
  // injury returns
  if (S.user.team && !S.coach.unemployed) {
    for (const p of teamPlayersFor(S.user.team)) {
      if (p.inj && p.inj === S.date) addInbox('injury', 'Departamento médico', `${p.n} está recuperado`, `${p.n} se recuperou de ${p.injN || 'lesão'} e está liberado para jogar.`);
    }
  }
  zoeiraDay();
  if (t.w === 3 && rnd() < 0.35) randomNews();
}
function fastDailyEvents() {
  aiTransferDay(true);
  const t = ymd(S.date);
  if (t.w === 1) { weeklyLoans(); freeAgentWeek(); }
  if (t.d === 1 && (t.m === 1 || t.m === 4 || t.m === 10)) midSeasonDevelopment();
  if (t.d === 1 && [1, 3, 5, 9, 11].includes(t.m)) aiMidSeasonRenewals();
  posChangeDaily();
  zoeiraDay();
}
function weeklyLoans() {
  for (const id in S.players) {
    const p = S.players[id];
    if (p.loan && p.loan.until < S.date) endLoan(p);
    // the form fades when a player stops playing (bench, injury, holidays)
    if (p.form && !(p.lp && S.date - p.lp <= 10)) p.form = Math.abs(p.form) < 0.5 ? 0 : p.form * 0.7;
  }
}
function contractReminders() {
  const uid = S.user.team;
  if (!uid || S.coach.unemployed || S.teams[uid].isNat) return;
  const exp = squadOf(uid).filter((p) => p.ct && p.ct <= seasonEndYear());
  if (exp.length) addInbox('contract', 'Departamento jurídico', 'Contratos terminando', `Estes jogadores têm contrato até o fim da temporada: ${exp.map((p) => p.n).join(', ')}. Renove na Central de Elenco.`);
}
function jobOfferMessage() {
  const j = S.jobs && S.jobs[0];
  if (!j) return;
  addInbox('job', teamName(j.team), `Proposta de emprego: ${teamName(j.team)}`, `${TA(j.team)} quer conversar com você sobre o cargo de técnico.`, { job: j.team });
}
function randomNews() {
  const pool = S.news.length < 6 ? 0.9 : 0.4;
  if (rnd() > pool) return;
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && c.kind === 'league' && !c.done && !c.second && !compIsMinor(c));
  if (!comps.length) return;
  const c = pick(comps);
  const tab = sortTable(c.table, c.teams);
  if (!tab[0] || !tab[0].p) return;
  const ts = topScorers(c.id, 1)[0];
  const lead = tab[0], second = tab[1], lastT = tab[tab.length - 1];
  const opts = [
    () => addNews(pick([`${teamName(lead.id)} lidera ${cA(c.name)}`, `${teamName(lead.id)} segue firme na ponta`]), `${teamName(lead.id)} soma ${lead.pts} pontos em ${lead.p} jogos${second ? `, ${lead.pts - second.pts} à frente ${tA(second.id, 'do')}` : ''}.`, 'liga', [lead.id], { cat: 'Tabela' }),
    () => ts && addNews(pick([`${ts.name} dispara na artilharia`, `Artilheiro: ${ts.name} chega a ${ts.goals} gols`]), `${ts.name} (${teamName(ts.team)}) já balançou as redes ${ts.goals} vezes ${cA(c.name, 'no')}.`, 'liga', [ts.team], { cat: 'Tabela' }),
    () => addNews(`Pressão na lanterna ${cA(c.name, 'do')}`, `${teamName(lastT.id)} ocupa a última posição com ${lastT.pts} pontos e precisa reagir.`, 'liga', [lastT.id], { cat: 'Tabela' }),
    () => {
      const best = c.teams.map((id) => [id, streakOf(id, (r) => r !== 'D')]).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] >= 6) addNews(`${teamName(best[0])} chega a ${best[1]} jogos sem perder`, `A boa fase ${tA(best[0], 'do')} continua: são ${best[1]} partidas de invencibilidade.`, 'liga', [best[0]], { cat: 'Tabela' });
    },
    () => {
      const worst = c.teams.map((id) => [id, streakOf(id, (r) => r === 'D')]).sort((a, b) => b[1] - a[1])[0];
      if (worst && worst[1] >= 4) addNews(`Crise: ${teamName(worst[0])} perde a ${worst[1]}ª seguida`, `O momento é delicado ${tA(worst[0], 'no')}, que acumula ${worst[1]} derrotas consecutivas.`, 'liga', [worst[0]], { cat: 'Tabela' });
    },
  ];
  pick(opts)();
}

// ---------------------------------------------------------------- zoeira
function scheduleZoeira99(y, zone) {
  if (!S.zoeira) return;
  S.z99 = {};
  const ids = activeClubIds();
  for (const id of ids) S.z99[id] = dayOf(y, 9, 1) + rint(0, 200);
}
function zoeiraDay() {
  if (!S.zoeira || !S.z99) return;
  for (const id in S.z99) {
    if (S.z99[id] !== S.date) continue;
    const sq = squadOf(+id);
    if (!sq.length) continue;
    const p = pick(sq);
    p.o = Math.max(p.o, 99); p.pot = Math.max(p.pot, 99);
    if (p.a) p.a = p.a.map((v) => Math.max(v, 95));
    addNews(`🤯 ${p.n} virou 99!`, `Do nada, ${p.n} (${teamName(+id)}) acordou com overall 99. Ninguém no clube sabe explicar.`, 'zoeira', [+id], { cat: 'Inacreditável', hot: true });
    if (isUserTeam(+id)) addInbox('info', 'Comissão técnica', `${p.n} agora é 99!`, `Ninguém sabe explicar, mas ${p.n} amanheceu com overall 99.`);
  }
}

// ---------------------------------------------------------------- season end (user)
function seasonEndTrigger() {
  const z = userLeagueZone();
  const t = ymd(S.date);
  if (z === 'SA') return t.m === 12 && t.d === 20;
  if (z === 'INTL') return t.m === 8 && t.d === 1;
  return t.m === 6 && t.d === 20;
}
function checkSeasonEnd() {
  if (!S.user.team || S.pendingEnd) return;
  if (!seasonEndTrigger()) return;
  if (S.date - (S.lastEndD || 0) < 200) return;
  S.lastEndD = S.date;
  S.pendingEnd = buildSeasonSummary();
}
function buildSeasonSummary() {
  const uid = S.user.team;
  const unemployed = S.coach.unemployed;
  const sum = { d: S.date, team: uid, unemployed, titles: [], coins: 0, pos: null, league: null, offers: [] };
  const z = userLeagueZone();
  const since = S.seasonStart;
  sum.titles = S.coach.trophies.filter((tr) => tr.d >= since - 400 && tr.d <= S.date && !tr.reported);
  sum.titles.forEach((tr) => { tr.reported = true; sum.coins += tr.coins; });
  if (!unemployed && !S.teams[uid].isNat) {
    const lc = S.active.map((id) => S.comps[id]).find((c) => c && c.kind === 'league' && c.teams.includes(uid));
    if (lc) {
      const tab = sortTable(lc.table, lc.teams);
      sum.pos = tab.findIndex((r) => r.id === uid) + 1;
      sum.league = lc.name;
      sum.n = lc.teams.length;
      const target = S.board.objRank || lc.teams.length;
      let delta = (target - sum.pos) * 2.2;
      sum.objOk = sum.pos <= target;
      const down = lc.down || 0;
      sum.relegated = down > 0 && sum.pos > lc.teams.length - down;
      sum.promoted = (lc.up || 0) > 0 && sum.pos <= lc.up;
      if (sum.relegated) delta -= 25;
      if (sum.promoted) delta += 12;
      if (sum.objOk) delta += 8;
      S.board.conf = clamp(S.board.conf + delta, 0, 100);
    }
  }
  sum.obj = S.board.obj;
  sum.conf = Math.round(S.board.conf);
  sum.rating = Math.round(S.coach.rating);
  // three offers from other clubs
  const pool = S.mode === 'national' ? Object.values(S.nations).filter((n) => n.tid && (S.wcPool || []).includes(n.code)).map((n) => n.tid) : careerClubIds();
  const cand = pool.filter((id) => id !== uid).map((id) => ({ id, d: Math.abs(teamPrestige(id) - S.coach.rep - 4) + rnd() * 25 })).sort(by((x) => x.d));
  if (S.mode === 'ultra') {
    const divOf = (id) => S.ultra.div.findIndex((d) => d.includes(id));
    const picks = [];
    for (const dv of shuffle([0, 1, 2])) { const c = cand.find((x) => divOf(x.id) === dv && !picks.includes(x.id)); if (c) picks.push(c.id); }
    sum.offers = picks.slice(0, 3);
  } else if (S.mode === 'normal') {
    const zone = userLeagueZone();
    const same = cand.filter((x) => (isSAteam(x.id) ? 'SA' : 'EU') === zone);
    const other = cand.filter((x) => !same.includes(x));
    sum.offers = uniq(same.slice(0, 2).concat(other.slice(0, 1)).concat(same.slice(2, 4)).map((x) => x.id)).slice(0, 3);
  } else sum.offers = cand.slice(0, 3).map((x) => x.id);
  if (!unemployed && !S.noFire && S.board.conf < 20) { sum.fired = true; }
  return sum;
}
function closeSeasonEnd(choice) {
  const sum = S.pendingEnd;
  S.pendingEnd = null;
  if (!sum) return;
  if (sum.fired && !S.coach.unemployed) fireCoach('A diretoria decidiu não renovar com você após a temporada.');
  if (choice && choice.team) takeJob(choice.team);
  S.celebrate = [];
}

/* ===================== youth academy & scouting ===================== */
const SCOUT_COUNTRIES = ['BRA', 'ARG', 'URU', 'COL', 'CHI', 'PAR', 'ECU', 'PER', 'VEN', 'MEX', 'USA', 'CAN', 'ENG', 'FRA', 'ESP', 'POR', 'GER',
  'ITA', 'NED', 'BEL', 'CRO', 'SRB', 'DEN', 'SWE', 'NOR', 'POL', 'CZE', 'AUT', 'SUI', 'TUR', 'GRE', 'UKR', 'SCO', 'IRL', 'WAL', 'NGA',
  'GHA', 'CIV', 'SEN', 'CMR', 'MAR', 'ALG', 'EGY', 'RSA', 'MLI', 'JPN', 'KOR', 'AUS', 'KSA', 'ISL'];
const COUNTRY_TALENT = { BRA: 5, ARG: 5, FRA: 5, ESP: 5, ENG: 4.6, GER: 4.6, POR: 4.6, NED: 4.3, BEL: 4.1, ITA: 4.2, URU: 4, COL: 3.7, CRO: 3.8,
  NGA: 3.7, SEN: 3.6, CIV: 3.6, MAR: 3.6, DEN: 3.4, SRB: 3.4, SUI: 3.2, AUT: 3.2, MEX: 3.3, USA: 3.3, JPN: 3.3, ECU: 3.4, GHA: 3.5, CMR: 3.4,
  TUR: 3.2, POL: 3.1, NOR: 3.2, SWE: 3.1, CZE: 3, UKR: 3.1, KOR: 3.1, CHI: 3, PAR: 3, ALG: 3.1, MLI: 3.2, SCO: 2.8, IRL: 2.8, GRE: 2.8, EGY: 2.9,
  PER: 2.7, VEN: 2.7, CAN: 2.9, RSA: 2.8, AUS: 2.8, KSA: 2.6, WAL: 2.6, ISL: 2.5 };
const SCOUT_FIRST = ['Paulo', 'Roberto', 'Marcos', 'André', 'Sérgio', 'Luís', 'Carlos', 'Fernando', 'Hugo', 'Rafael', 'Diego', 'Martin', 'Klaus', 'Pierre', 'Enzo', 'Jorge', 'Tomás', 'Victor'];
const SCOUT_LAST = ['Almeida', 'Mendes', 'Rocha', 'Ferraz', 'Bianchi', 'Moreau', 'Becker', 'Santos', 'Ortega', 'Navarro', 'Lima', 'Costa', 'Ribeiro', 'Weber', 'Duarte'];

function scoutCost(level) { return roundMoney(level * level * 60e3 * moneyFactor()); }
function availableScouts() {
  if (!S.youth.market || S.date - (S.youth.marketD || 0) > 30) {
    S.youth.market = Array.from({ length: 5 }, () => {
      const lvl = rint(1, 5);
      return { id: nextId('sc'), n: `${pick(SCOUT_FIRST)} ${pick(SCOUT_LAST)}`, lvl, cost: scoutCost(lvl) };
    });
    S.youth.marketD = S.date;
  }
  return S.youth.market;
}
function hireScout(id) {
  const t = S.teams[S.user.team];
  const sc = (S.youth.market || []).find((x) => x.id === id);
  if (!sc) return 'Olheiro indisponível.';
  if (S.youth.scouts.length >= 4) return 'Você já tem 4 olheiros (máximo).';
  if (t.budget < sc.cost) return 'Orçamento insuficiente.';
  t.budget -= sc.cost;
  S.youth.scouts.push({ ...sc, country: null, until: 0, found: 0 });
  S.youth.market = S.youth.market.filter((x) => x.id !== id);
  return `${sc.n} foi contratado como olheiro.`;
}
function fireScout(id) { S.youth.scouts = S.youth.scouts.filter((s) => s.id !== id); }
function assignScout(id, country, months) {
  const sc = S.youth.scouts.find((s) => s.id === id);
  if (!sc) return;
  sc.country = country;
  sc.until = S.date + months * 30;
  sc.start = S.date;
}
function scoutingWeek() {
  if (S.zoeira || S.mode === 'national' || !S.user.team || S.coach.unemployed) return;
  for (const sc of S.youth.scouts) {
    if (!sc.country) continue;
    if (sc.until && S.date > sc.until) {
      addInbox('scout', sc.n, `Missão encerrada: ${natName(sc.country)}`, `${sc.n} terminou a observação em ${natName(sc.country)} e aguarda uma nova missão.`);
      sc.country = null;
      continue;
    }
    const talent = COUNTRY_TALENT[sc.country] || 2.5;
    if (rnd() > 0.22 + sc.lvl * 0.04) continue;
    const n = rnd() < 0.3 ? 2 : 1;
    const found = [];
    for (let i = 0; i < n; i++) {
      const age = rint(14, 16);
      const ovrV = clamp(Math.round(38 + rnd() * 10 + sc.lvl * 1.4 + (age - 14) * 2.5 + talent), 38, 62);
      const potHi = clamp(Math.round(58 + talent * 3.6 + sc.lvl * 2.2 + gauss() * 6), ovrV + 6, 94);
      const p = generatePlayer({ nat: sc.country, age, ovr: ovrV, potBoost: potHi - ovrV });
      p.yth = -1; // scouted, not signed
      p.t = 0;
      const err = (6 - sc.lvl) * 2;
      const rep = { id: nextId('rep'), pid: p.id, sc: sc.id, scN: sc.n, d: S.date, potLo: clamp(p.pot - rint(0, err), p.o, 99), potHi: clamp(p.pot + rint(0, err), p.o, 99) };
      S.youth.reports.unshift(rep);
      found.push(p);
      sc.found++;
    }
    addInbox('scout', sc.n, `Relatório de ${natName(sc.country)}`, `Encontrei ${found.length === 1 ? 'um jovem promissor' : 'dois jovens promissores'}: ${found.map((p) => `${p.n} (${p.age} anos, ${POS_PT[p.p]})`).join(' e ')}. Veja os detalhes na Academia.`);
  }
  // prune old reports
  while (S.youth.reports.length > 24) {
    const r = S.youth.reports.pop();
    const p = S.players[r.pid];
    if (p && p.yth === -1) delete S.players[p.id];
  }
}
function signProspect(repId) {
  const r = S.youth.reports.find((x) => x.id === repId);
  if (!r) return 'Relatório não encontrado.';
  const p = S.players[r.pid];
  if (!p) return 'Jogador indisponível.';
  if (S.youth.squad.length >= 30) return 'A base já tem 30 jogadores.';
  p.yth = S.user.team;
  p.t = 0;
  p.ct = yearOf(S.date) + 3;
  p.w = 300;
  S.youth.squad.push(p.id);
  S.youth.reports = S.youth.reports.filter((x) => x.id !== repId);
  return `${p.n} entrou para a base!`;
}
function dismissProspect(repId) {
  const r = S.youth.reports.find((x) => x.id === repId);
  if (!r) return;
  const p = S.players[r.pid];
  if (p && p.yth === -1) delete S.players[p.id];
  S.youth.reports = S.youth.reports.filter((x) => x.id !== repId);
}
function promoteYouth(pid) {
  const p = S.players[pid];
  if (!p) return 'Jogador não encontrado.';
  if (p.age < 16) return 'O jogador precisa ter pelo menos 16 anos.';
  if (squadOf(S.user.team).length >= 36) return 'O elenco principal está cheio (36).';
  S.youth.squad = S.youth.squad.filter((x) => x !== pid);
  p.yth = 0;
  movePlayer(p, S.user.team, { ct: seasonEndYear() + 3, w: Math.max(1500, Math.round(wageDemand(p, S.teams[S.user.team]) * 0.6)) });
  return `${p.n} foi promovido ao elenco principal!`;
}
function releaseYouth(pid) {
  S.youth.squad = S.youth.squad.filter((x) => x !== pid);
  const p = S.players[pid];
  if (p) { p.yth = 0; p.t = 0; }
}
function youthPlayers() { return S.youth.squad.map((id) => S.players[id]).filter(Boolean); }

/* ===================== national teams & international football ===================== */
const NAT_POOL = {
  UEFA: ['ENG', 'FRA', 'CRO', 'POR', 'NOR', 'GER', 'NED', 'ESP', 'BEL', 'AUT', 'SUI', 'SCO', 'CZE', 'BIH', 'TUR', 'SWE', 'ITA', 'DEN', 'POL', 'UKR',
    'SRB', 'WAL', 'IRL', 'NIR', 'SVK', 'SVN', 'HUN', 'ROU', 'GRE', 'ISL', 'FIN', 'ALB', 'MKD', 'MNE', 'GEO', 'ARM', 'AZE', 'KAZ', 'ISR', 'BUL',
    'BLR', 'LUX', 'CYP', 'EST', 'LVA', 'LTU', 'KVX', 'FRO', 'MDA', 'MLT', 'AND', 'LIE', 'GIB', 'SMR', 'RUS'],
  CONMEBOL: ['BRA', 'ARG', 'URU', 'COL', 'ECU', 'PAR', 'CHI', 'PER', 'VEN', 'BOL'],
  CONCACAF: ['USA', 'MEX', 'CAN', 'PAN', 'HAI', 'CUW', 'CRC', 'JAM', 'HON', 'SLV', 'GUA', 'TRI', 'SUR'],
  CAF: ['MAR', 'TUN', 'EGY', 'ALG', 'GHA', 'CPV', 'RSA', 'SEN', 'CIV', 'COD', 'NGA', 'CMR', 'MLI', 'BFA', 'GUI', 'GAB', 'ANG', 'ZAM', 'BEN',
    'TOG', 'GAM', 'GNB', 'EQG', 'KEN', 'UGA', 'MOZ', 'ZIM', 'MAD', 'CGO', 'LBY', 'SUD', 'NAM'],
  AFC: ['JPN', 'IRN', 'UZB', 'KOR', 'JOR', 'AUS', 'QAT', 'KSA', 'IRQ', 'UAE', 'OMA', 'CHN', 'SYR', 'BHR', 'PLE', 'LBN', 'KUW', 'THA', 'VIE', 'IDN', 'IND'],
  OFC: ['NZL', 'NCL', 'FIJ'],
};
const WC_QUOTA = { UEFA: 16, CONMEBOL: 6, CONCACAF: 6, CAF: 9, AFC: 8, OFC: 1 };
const WC_HOSTS = { 2018: ['RUS'], 2022: ['QAT'], 2026: ['USA', 'MEX', 'CAN'], 2030: ['ESP', 'POR', 'MAR'], 2034: ['KSA'] };
const EURO_HOST = { 2020: null, 2024: 'GER', 2028: 'ENG', 2032: 'ITA' };
const EURO2016 = [['FRA', 'ROU', 'ALB', 'SUI'], ['ENG', 'RUS', 'WAL', 'SVK'], ['GER', 'UKR', 'POL', 'NIR'], ['ESP', 'CZE', 'TUR', 'CRO'], ['BEL', 'ITA', 'IRL', 'SWE'], ['POR', 'ISL', 'AUT', 'HUN']];
const COPA2016 = [['USA', 'COL', 'CRC', 'PAR'], ['BRA', 'ECU', 'HAI', 'PER'], ['MEX', 'URU', 'JAM', 'VEN'], ['ARG', 'CHI', 'PAN', 'BOL']];
const EURO2021 = [['TUR', 'ITA', 'WAL', 'SUI'], ['DEN', 'FIN', 'BEL', 'RUS'], ['NED', 'UKR', 'AUT', 'MKD'], ['ENG', 'CRO', 'SCO', 'CZE'], ['ESP', 'SWE', 'POL', 'SVK'], ['HUN', 'POR', 'FRA', 'GER']];
const COPA2021 = [['ARG', 'BOL', 'URU', 'CHI', 'PAR'], ['BRA', 'COL', 'VEN', 'ECU', 'PER']];

function natPoolList() {
  const all = [];
  for (const c in NAT_POOL) for (const code of NAT_POOL[c]) if (S.nations[code] && !(code === 'RUS' && S.era >= 2022)) all.push(code);
  return all;
}
const NAT_BASE = { // fallback strength for nations with few real players
  SMR: 50, GIB: 52, LIE: 52, AND: 53, MLT: 56, FRO: 57, MDA: 58, LVA: 59, LTU: 59, EST: 59, KVX: 63, CYP: 61, LUX: 61, KAZ: 61, AZE: 60, ARM: 61, BLR: 61,
  NCL: 50, FIJ: 50, SUR: 60, TRI: 58, GUA: 58, SLV: 58, HON: 61, CUW: 62, HAI: 60, PAN: 63, JAM: 64, CRC: 65, BOL: 62, VEN: 66,
  PLE: 58, LBN: 57, KUW: 56, THA: 58, VIE: 57, IDN: 59, IND: 55, SYR: 59, BHR: 58, OMA: 60, UAE: 62, CHN: 61, IRQ: 64, JOR: 63, UZB: 66,
  SUD: 54, NAM: 54, LBY: 57, CGO: 60, MAD: 58, ZIM: 60, MOZ: 57, UGA: 58, KEN: 57, EQG: 60, GNB: 61, GAM: 62, TOG: 60, BEN: 61, ZAM: 62, ANG: 62,
  GAB: 63, GUI: 64, BFA: 66, CPV: 64, RSA: 64,
};
function prepareNationalPools() {
  S.wcPool = natPoolList();
  for (const code of S.wcPool) {
    const n = S.nations[code];
    const have = Object.values(S.players).filter((p) => p.nat === code && !p.yth).length;
    if (have >= 26) continue;
    const real = Object.values(S.players).filter((p) => p.nat === code).sort(by((p) => p.o, -1));
    const lvl = real.length >= 8 ? avg(real.slice(0, 8), (p) => p.o) - 2 : (NAT_BASE[code] || 60);
    const posNeed = ['GK', 'GK', 'GK', 'RB', 'RB', 'CB', 'CB', 'CB', 'CB', 'LB', 'LB', 'CDM', 'CDM', 'CM', 'CM', 'CM', 'CAM', 'CAM', 'RW', 'LW', 'RM', 'LM', 'ST', 'ST', 'ST', 'CB'];
    const cnt = {}; real.forEach((p) => (cnt[p.p] = (cnt[p.p] || 0) + 1));
    for (const pos of posNeed) {
      if (cnt[pos] > 0) { cnt[pos]--; continue; }
      const p = generatePlayer({ nat: code, pos, age: rint(19, 33), ovr: clamp(lvl + rfloat(-6, 2), 42, 78), potBoost: rint(0, 6) });
      p.natOnly = 1; p.club = 'Clube local';
    }
  }
}
function autoCallUp(code, force) {
  const n = S.nations[code];
  if (!n) return;
  if (n.sq && n.sq.length >= 20 && !force && isUserTeam(n.tid)) return;
  const pool = Object.values(S.players).filter((p) => p.nat === code && p.yth !== -1 && !(p.yth > 0));
  const avail = pool.filter((p) => !isInjured(p)).sort(by((p) => p.o, -1));
  const need = { GK: 3, DEF: 9, MID: 8, ATT: 6 };
  const sq = [];
  for (const g of ['GK', 'DEF', 'MID', 'ATT']) {
    const list = avail.filter((p) => POS_GROUP[p.p] === g && !sq.includes(p.id)).slice(0, need[g]);
    list.forEach((p) => sq.push(p.id));
  }
  for (const p of avail) { if (sq.length >= 26) break; if (!sq.includes(p.id)) sq.push(p.id); }
  n.sq = sq;
  const t = S.teams[n.tid];
  if (!isUserTeam(t.id) || force) { const lu = autoLineup(nationSquad(code), t.form || '4-3-3'); t.xi = lu.xi; t.bench = lu.bench; }
}
const natTid = (code) => S.nations[code].tid;
const natsOf = (codes) => codes.filter((c) => S.nations[c]).map(natTid);

// ---------------------------------------------------------------- windows
function intlWindows(y) {
  const w = [];
  const mk = (m, d, m2, d2) => [onOrAfter(dayOf(y, m, d), 4), onOrAfter(dayOf(y, m2, d2), 1)];
  w.push({ m: 3, days: mk(3, 20, 3, 24) });
  if (!(y % 2 === 0)) w.push({ m: 6, days: mk(6, 4, 6, 8) });
  w.push({ m: 9, days: mk(9, 3, 9, 7) });
  w.push({ m: 10, days: mk(10, 8, 10, 12) });
  w.push({ m: 11, days: mk(11, 12, 11, 16) });
  w.forEach((x) => { if (x.days[1] <= x.days[0]) x.days[1] = x.days[0] + 4; });
  return w;
}
function windowDaysBetween(a, b) {
  const out = [];
  for (let y = yearOf(a); y <= yearOf(b); y++) for (const w of intlWindows(y)) for (const d of w.days) if (d >= a && d <= b) out.push(d);
  return out.sort((x, y) => x - y);
}
function dblRounds(g) { return g % 2 === 0 ? 2 * (g - 1) : 2 * g; }

// ---------------------------------------------------------------- tournaments
function makeTournament(kind, y, groups) {
  const nat = (gs) => gs.map((g) => natsOf(g));
  let o;
  if (kind === 'WC') {
    o = { key: 'WC', name: 'Copa do Mundo', short: 'COPA', dates: [dayOf(y, 6, 11), dayOf(y, 6, 17), dayOf(y, 6, 23)], spread: 5, bestThirds: 8,
      koPlan: [{ name: '16-avos de final', d: dayOf(y, 6, 28), spread: 4 }, { name: 'Oitavas de final', d: dayOf(y, 7, 4), spread: 3 },
        { name: 'Quartas de final', d: dayOf(y, 7, 9), spread: 2 }, { name: 'Semifinal', d: dayOf(y, 7, 14), spread: 1 }, { name: 'Final', d: dayOf(y, 7, 19) }] };
  } else if (kind === 'EURO') {
    o = { key: 'EURO', name: 'Eurocopa', short: 'EURO', dates: [dayOf(y, 6, 12), dayOf(y, 6, 17), dayOf(y, 6, 22)], spread: 4, bestThirds: 4,
      koPlan: [{ name: 'Oitavas de final', d: dayOf(y, 6, 29), spread: 4 }, { name: 'Quartas de final', d: dayOf(y, 7, 5), spread: 2 },
        { name: 'Semifinal', d: dayOf(y, 7, 9), spread: 1 }, { name: 'Final', d: dayOf(y, 7, 14) }] };
  } else {
    o = { key: 'COPA', name: 'Copa América', short: 'C.AMÉR', dates: [dayOf(y, 6, 15), dayOf(y, 6, 19), dayOf(y, 6, 23), dayOf(y, 6, 27), dayOf(y, 7, 1)], spread: 3,
      koPlan: [{ name: 'Quartas de final', d: dayOf(y, 7, 3), spread: 2 }, { name: 'Semifinal', d: dayOf(y, 7, 8), spread: 1 }, { name: 'Final', d: dayOf(y, 7, 13) }] };
    if (groups.length === 2) o.koCustom = 'top4';
  }
  const c = makeGroups({ ...o, zone: 'INTL', season: String(y), year: y, groups: nat(groups), neutral: true, roundLabel: 'Rodada' });
  c.koPlan = o.koPlan; c.bestThirds = o.bestThirds || 0; c.koCustom = o.koCustom; c.neutral = true;
  for (const g of groups) for (const code of g) autoCallUp(code);
  return c;
}
function drawGroups(codes, nGroups, hosts = []) {
  const sorted = codes.slice().sort(by((c) => (hosts.includes(c) ? 999 : nationRating(c)), -1));
  const per = Math.ceil(sorted.length / nGroups);
  const groups = Array.from({ length: nGroups }, () => []);
  for (let pot = 0; pot < per; pot++) {
    const slice = shuffle(sorted.slice(pot * nGroups, pot * nGroups + nGroups));
    slice.forEach((c, i) => groups[i].push(c));
  }
  return groups;
}

// ---------------------------------------------------------------- qualifiers
function makeQualifiers(tKey, tYear, conf, codes, days, quota) {
  const n = codes.length;
  if (!n || quota <= 0) return null;
  const R = days.length;
  let g = 6;
  while (g > 2 && dblRounds(g) > R) g--;
  if (n <= g) g = n;
  const nGroups = Math.max(1, Math.round(n / g));
  const groups = drawGroups(codes, nGroups);
  const c = makeGroups({ key: 'QUAL', name: `Eliminatórias ${tKey === 'WC' ? 'da Copa' : 'da Euro'} (${conf})`, short: 'ELIM', zone: 'INTL',
    season: String(tYear), year: tYear, groups: groups.map((gr) => natsOf(gr)), double: true, dates: days, qualFor: tKey, conf, quota });
  c.qualOnly = true;
  c.tKey = tKey; c.tYear = tYear;
  return c;
}
function finishQualifiers(c) {
  c.done = true;
  const tabs = c.groups.map((g) => sortTable(g.table, g.teams));
  const ranked = [];
  for (let pos = 0; pos < 6; pos++) {
    const tier = tabs.map((t) => t[pos]).filter(Boolean).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
    ranked.push(...tier.map((r) => r.id));
  }
  const q = ranked.slice(0, c.quota);
  const key = c.tKey + c.tYear;
  S.intl.qual = S.intl.qual || {};
  S.intl.qual[key] = (S.intl.qual[key] || []).concat(q.map((tid) => S.teams[tid].code));
  const uid = S.user.team;
  if (uid && c.teams.concat(c.groups.flatMap((g) => g.teams)).includes(uid)) {
    const ok = q.includes(uid);
    addNews(ok ? `${teamName(uid)} está ${tGen(uid, 'classificado')}!` : `${teamName(uid)} fica fora`, ok ? `${teamName(uid)} garantiu vaga na ${c.tKey === 'WC' ? 'Copa do Mundo' : 'Eurocopa'} ${c.tYear}.` : `${teamName(uid)} não conseguiu a classificação para ${c.tKey === 'WC' ? 'a Copa do Mundo' : 'a Eurocopa'} ${c.tYear}.`, 'selecao', [uid], { cat: 'Seleção', hot: true });
    S.board.conf = clamp(S.board.conf + (ok ? 12 : -20), 0, 100);
    if (ok) awardTrophyLike('Classificação', c);
  }
  S.hist.push({ key: 'QUAL', name: c.name, season: c.season, ch: q[0], chN: teamName(q[0]), ru: 0, ruN: '' });
}
function awardTrophyLike() {}

// ---------------------------------------------------------------- yearly planning
function setupInternational(Y) {
  S.intl = { qual: {}, planned: {} };
  // opening tournament(s)
  if (Y === 2026 || Y % 4 === 2) makeTournament('WC', Y, S.wc2026);
  else if (Y === 2016) { makeTournament('EURO', Y, EURO2016); makeTournament('COPA', Y, COPA2016); }
  else if (Y === 2021) { makeTournament('EURO', Y, EURO2021); makeTournament('COPA', Y, COPA2021); }
  S.intl.planned[Y] = true;
  planQualifiersFrom(dayOf(Y, 8, 1), Y);
  planFriendlies(Y, dayOf(Y, 8, 1));
}
function planQualifiersFrom(startDay, Y) {
  // next World Cup
  let wcY = Y + 1; while (wcY % 4 !== 2) wcY++;
  if (!S.intl.planned['WCQ' + wcY]) {
    S.intl.planned['WCQ' + wcY] = true;
    const end = dayOf(wcY, 3, 31);
    const start = Math.max(startDay, dayOf(wcY - 2, 3, 1));
    const days = windowDaysBetween(start, end);
    const hosts = WC_HOSTS[wcY] || [];
    for (const conf in NAT_POOL) {
      const codes = NAT_POOL[conf].filter((c) => S.wcPool.includes(c) && !hosts.includes(c));
      const quota = WC_QUOTA[conf] - hosts.filter((h) => NAT_POOL[conf].includes(h)).length;
      makeQualifiers('WC', wcY, conf, codes, days, quota);
    }
  }
  // next Euro
  let eY = Y + 1; while (eY % 4 !== 0) eY++;
  if (!S.intl.planned['EUQ' + eY] && dayOf(eY - 1, 3, 1) >= startDay) {
    S.intl.planned['EUQ' + eY] = true;
    const days = windowDaysBetween(dayOf(eY - 1, 3, 1), dayOf(eY - 1, 11, 30));
    const host = EURO_HOST[eY];
    const codes = NAT_POOL.UEFA.filter((c) => S.wcPool.includes(c) && c !== host);
    makeQualifiers('EURO', eY, 'UEFA', codes, days, host ? 23 : 24);
  }
}
function planFriendlies(y, from) {
  const uid = S.user.team;
  if (!uid) return;
  const code = S.teams[uid].code;
  const c = newComp({ kind: 'friendly', key: 'FRIEND', name: 'Amistosos', short: 'AMIST', zone: 'INTL', season: String(y), year: y, teams: [] });
  for (const w of intlWindows(y)) for (const d of w.days) {
    if (d < from) continue;
    const busy = (S.tm[uid] || []).some((mid) => Math.abs(S.matches[mid].d - d) < 2);
    if (busy) continue;
    const myR = nationRating(code);
    const opp = shuffle(S.wcPool.filter((x) => x !== code && Math.abs(nationRating(x) - myR) < 9)).find((x) => !(S.tm[natTid(x)] || []).some((mid) => Math.abs(S.matches[mid].d - d) < 2));
    if (!opp) continue;
    if (!c.rounds.length) c.rounds.push({ name: 'Amistoso', d, m: [] });
    const home = rnd() < 0.5;
    addMatch(c, 0, d, home ? uid : natTid(opp), home ? natTid(opp) : uid, { fixed: true, time: '20:00' });
  }
  c.teams = [uid];
}
function intlDaily() {
  const t = ymd(S.date);
  if (t.m === 1 && t.d === 1 && !S.intl.planned[t.y]) {
    S.intl.planned[t.y] = true;
    archiveIntl();
    if (t.y % 4 === 2) {
      const key = 'WC' + t.y;
      let codes = uniq((S.intl.qual[key] || []).concat(WC_HOSTS[t.y] || []));
      const rest = S.wcPool.filter((c) => !codes.includes(c)).sort(by((c) => nationRating(c), -1));
      while (codes.length < 48 && rest.length) codes.push(rest.shift());
      codes = codes.slice(0, 48);
      makeTournament('WC', t.y, drawGroups(codes, 12, WC_HOSTS[t.y] || []));
    }
    if (t.y % 4 === 0) {
      const key = 'EURO' + t.y;
      let codes = uniq((S.intl.qual[key] || []).concat(EURO_HOST[t.y] ? [EURO_HOST[t.y]] : []));
      const rest = NAT_POOL.UEFA.filter((c) => S.wcPool.includes(c) && !codes.includes(c)).sort(by((c) => nationRating(c), -1));
      while (codes.length < 24 && rest.length) codes.push(rest.shift());
      makeTournament('EURO', t.y, drawGroups(codes.slice(0, 24), 6, EURO_HOST[t.y] ? [EURO_HOST[t.y]] : []));
      const copa = NAT_POOL.CONMEBOL.concat(NAT_POOL.CONCACAF.filter((c) => S.wcPool.includes(c)).sort(by((c) => nationRating(c), -1)).slice(0, 6));
      makeTournament('COPA', t.y, drawGroups(copa, 4));
    }
    planQualifiersFrom(S.date, t.y);
    planFriendlies(t.y, S.date);
  }
  // call-ups before windows
  if (t.d === 25 || (t.m === 5 && t.d === 25)) {
    for (const code of S.wcPool) if (!isUserTeam(natTid(code))) autoCallUp(code);
    if (S.user.team) {
      const n = S.nations[S.teams[S.user.team].code];
      if (!n.sq || n.sq.length < 18) autoCallUp(n.code, true);
    }
  }
}
function archiveIntl() {
  const keep = [];
  for (const cid of S.active) {
    const c = S.comps[cid];
    if (!c) continue;
    const allDone = c.rounds.every((rd) => rd.m.every((id) => S.matches[id] && S.matches[id].done));
    if (!(c.done || c.kind === 'friendly') || !allDone) { keep.push(cid); continue; }
    for (const rd of c.rounds) for (const mid of rd.m) {
      const m = S.matches[mid];
      if (!m) continue;
      removeMatchIndex(m);
      for (const tid of [m.h, m.a]) { const l = S.tm[tid]; if (l) { const i = l.indexOf(mid); if (i >= 0) l.splice(i, 1); } }
      delete S.matches[mid];
    }
    delete S.comps[cid];
  }
  S.active = keep;
}

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

/* ===================== data fixes for saves made before them ===================== */
// The 2026 database once carried women's players by mistake (the FC 27 ratings snapshot mixes both games).
// The game is men's football: careers saved before the fix lose them when loaded. Name@nationality pairs.
const WOMEN_2026 = (
  'Ada Hegerberg@NOR|Alara@GER|Alice Corelli@ITA|Alice Pinguet@FRA|Amanda Ilestedt@SWE|Amber Tysiak@BEL|Ana-Maria Crnogorčević@SUI|Andrea Gómez@ESP|' +
  'Andrea Norheim@NOR|Andrea Svibkova@CZE|Anna Csiki@HUN|Anna Klink@GER|Anna Patten@IRL|Anneke Borbe@GER|Barbora Votíková@CZE|Bella Andersson@SWE|' +
  'Bibi@GER|Bo Van Egmond@NED|Camilla Küver@GER|Carla Camacho@ESP|Carla Polito@FRA|Carmen Álvarez@ESP|Caroline Graham Hansen@NOR|Caroline Kehrer@CAN|' +
  'Caroline Møller@DEN|Cathinka Tandberg@NOR|Cecilia Salvai@ITA|Cecilie Fløe@DEN|Celina Degen@AUT|Charlize Rule@AUS|Charlotte Hulst@NED|' +
  'Charlotte Voll@GER|Chiamaka Nnadozie@NGA|Chiara Hahn@GER|Chloe Marty@FRA|Chloé Tapia@FRA|Christiane Endler@CHI|Christy Gavory@FRA|Clare Hunt@AUS|' +
  'Constance Picaud-Inconnu@FRA|Cora Zicai@GER|Courtney Brosnan@IRL|Damaris Egurrola@NED|Daphne Van Domselaar@NED|Dominique Janssen@NED|Edna Imade@ESP|' +
  'Elena Mühlemann@SUI|Elisa Launay@FRA|Elise Isolde Stenevik@NOR|Ellie Roebuck@ENG|Elma Junttila Nelhage@SWE|Elvira Herzog@SUI|Emily Ramsey@ENG|' +
  'Emma Stølen Godø@NOR|Ena Mahmutovic@GER|Esther Mbakem-Niaro@FRA|Esther Sullastres@ESP|Eunate Astralaga@ESP|Eve Boettcher@GER|Fabienne Dongus@GER|' +
  'Fiona Bogi@FRA|Fridolina Rolfö@SWE|Gemma Gili@ESP|Giovanna Hoffmann@GER|Gracie Prior@ENG|Hannah Hampton@ENG|Hillary Diaz@FRA|Ingrid Syrstad Engen@NOR|' +
  'Inès Benyahia@FRA|Irene Oguiza@ESP|Irene Paredes@ESP|Irina Fuchs@SUI|Isa Álvarez@ESP|Jade Rose@CAN|Janina Hechler@GER|Janina Leitzig@GER|' +
  'Jaqueline Dönges@GER|Jenna Clark@SCO|Jennyfer Limage@HAI|Johanna Berg@GER|Jule Brand@GER|Julia Landenberger@GER|Julia Pollak@GER|Julie Pasquereau@FRA|' +
  'Julie Rabanne@FRA|Justine Vanhaevermaet@BEL|Karen Holmgaard@DEN|Katarzyna Kiedrzynek@POL|Katie Reid@ENG|Kelly Gago@FRA|Khadija Shaw@JAM|' +
  'Klára Cahynová@CZE|Larissa Haidner@AUT|Larissa Mühlhaus@GER|Laura Benkarth@GER|Laura Dick@GER|Laura Giuliani@ITA|Lauren James@ENG|Lauren Leal@BRA|' +
  'Laureta Elmazi@GER|Lea Notel@FRA|Lena Lattwein@GER|Lena Oberdorf@GER|Lena Pauels@GER|Lena Petermann@GER|Lieske Carleer@NED|Lily Yohannes@USA|' +
  'Lina Gay@FRA|Lina Hausicke@GER|Lina Von Schrader@GER|Lisa Doorn@NED|Lisa Schmitz@GER|Livia Peng@SUI|Lorena Barth@SUI|Lotte Wubben-Moy@ENG|' +
  'Lou Jumere Seignou@FRA|Louise Van Oosten@NED|Lourdes Romero@GER|Luca Birkholz@GER|Lynn Wilms@NED|Maelys Mpome@FRA|Mara Alber@GER|Maria-Luisa Grohs@GER|' +
  'Marie Petiteau@FRA|Marie-Antoinette Katoto@FRA|Marie-Morgane Sieber@FRA|Marina Georgieva@AUT|Marthine Østenstad@NOR|Martina Piemonte@ITA|' +
  'Mathilde Harviken@NOR|Maximiliane Rall@GER|Mayra Ramírez@COL|Maïté Boucly@FRA|Medina Dešić@MNE|Megan Finnigan@ENG|Merle Frohms@GER|' +
  'Merveille Kanjinga@COD|Michaely Bihina@CMR|Michelle Ulbrich@GER|Mylène Chavas@FRA|Nadine Böhi@SUI|Nathalie Björn@SWE|Nikola Karczewska@POL|' +
  'Nikée Van Dijk@NED|Nina Räcke@GER|Noémie Mouchon@FRA|Nurija Van Schoonhoven@NED|Olivie Lukášová@CZE|Paulina Krumbiegel@GER|Pauline Peyraud-Magnin@FRA|' +
  'Phallon Tullis-Joyce@USA|Rachael Laws@ENG|Rachele Baldi@ITA|Rafaela Borggräfe@GER|Rakel Engesvik@NOR|Rebecca Adamczyk@GER|Rebecca Knaak@GER|' +
  'Regina Van Eijk@NED|Roma Grinfan@FRA|Rosa Ruckert@GER|Roseline Éloissaint@HAI|Rylee Foster Inman@CAN|Salma Paralluelo@ESP|Salomé Elisor@FRA|' +
  'Sara Holmgaard@DEN|Sari Kees@BEL|Selen Altunkulak@TUR|Selina Ostermeier@GER|Shumaira Mheuka@ENG|Signe Bruun@DEN|Simi Awujo@CAN|Sofie Gron@DEN|' +
  'Somea Polozen@BIH|Sophia Winkler@GER|Sophie Lindner@AUT|Sophie Román Haug@NOR|Stina Blackstenius@SWE|Stina Johannes@GER|Stine Ballisager@DEN|' +
  'Sydney Lohmann@GER|Sydney Schertenleib@SUI|Tamar Dongus@GER|Tarciane@BRA|Tatiana Solanet@FRA|Taylor Beitz@CAN|Taylor Ziemer@USA|Teagan Micah@AUS|' +
  'Valentina Mädl@AUT|Vanessa Gilles@CAN|Verena Wieder@GER|Victoria Schulz@GER|Vivianne Miedema@NED|Wendie Renard@FRA|Yasmin Mrabet@MAR|Ziqin Shao@CHN|'
).split('|').filter(Boolean);
function purgeWomen2026() {
  if (!S || S.era !== 2026 || S.purgedW || !S.players) return 0;
  const set = new Set(WOMEN_2026);
  const gone = new Set();
  const mine = [];
  for (const id in S.players) {
    const p = S.players[id];
    if (!p || !set.has(p.n + '@' + p.nat)) continue;
    gone.add(p.id);
    if (S.user && p.t && p.t === S.user.team) mine.push(p.n);
  }
  if (gone.size) {
    for (const id in S.teams) {
      const t = S.teams[id];
      if (t.sq) t.sq = t.sq.filter((x) => !gone.has(x));
      if (t.xi) t.xi = t.xi.map((x) => (gone.has(x) ? 0 : x));
      if (t.bench) t.bench = t.bench.filter((x) => !gone.has(x));
    }
    for (const code in S.nations || {}) { const n = S.nations[code]; if (n.sq) n.sq = n.sq.filter((x) => !gone.has(x)); }
    if (S.youth && S.youth.squad) S.youth.squad = S.youth.squad.filter((x) => !gone.has(x));
    if (S.tr) {
      if (S.tr.short) S.tr.short = S.tr.short.filter((x) => !gone.has(x));
      for (const o of S.tr.offers || []) if (gone.has(o.pid) && o.status === 'open') o.status = 'void';
    }
    for (const pid of gone) delete S.players[pid];
    if (mine.length && typeof addInbox === 'function') {
      addInbox('info', 'Diretoria', 'Elenco atualizado', `${mine.join(', ')} ${mine.length === 1 ? 'deixou' : 'deixaram'} o elenco: a base de dados foi corrigida e o jogo traz apenas o futebol masculino.`);
    }
  }
  S.purgedW = 1;
  return gone.size;
}

/* ===================== Copa Sul-Americana and Mundial de Clubes (ligas normais) ===================== */
// title holders of the seasons before each era starts; afterwards the in-game champions take their place
const REAL_HOLDERS = {
  LIB: { 2015: 'river', 2020: 'palmeiras', 2025: 'flamengo' },
  SULA: { 2015: 'santafe', 2020: 'defensa', 2025: 'lanus' },
  UCL: { 2015: 'realmadrid', 2020: 'chelsea', 2025: 'psg' },
  UEL: { 2015: 'sevilla', 2020: 'villarreal', 2025: 'astonvilla' },
  UECL: { 2025: 'crystalpalace' }, // first played in 2021/22
};
// clubs that can represent the other confederations at the Mundial (the strongest one usually wins its continent)
const CWC_POOL = {
  CONCACAF: ['america', 'monterrey', 'cruzazul', 'chivas', 'pachuca', 'intermiami', 'lafc', 'lagalaxy', 'nycfc'],
  AFC: ['alhilal', 'alnassr'],
  CAF: ['alahly', 'mamelodi'],
  OFC: ['auckland'],
};
const CONF_LABEL = { uefa: 'Europa', conmebol: 'América do Sul', conc: 'Concacaf', afc: 'Ásia', caf: 'África', ofc: 'Oceania' };

let KEY_IDX = null, KEY_IDX_S = null;
function teamIdByKey(key) {
  if (!key) return 0;
  if (KEY_IDX_S !== S || !KEY_IDX || (KEY_IDX[key] && (!S.teams[KEY_IDX[key]] || S.teams[KEY_IDX[key]].key !== key))) {
    KEY_IDX = {};
    for (const id in S.teams) KEY_IDX[S.teams[id].key] = +id;
    KEY_IDX_S = S;
  }
  return KEY_IDX[key] || 0;
}
function compOf(key, year) {
  for (const id of S.active) { const c = S.comps[id]; if (c && c.key === key && c.year === year) return c; }
  return null;
}
function champOf(key, year) {
  for (let i = S.hist.length - 1; i >= 0; i--) { const h = S.hist[i]; if (h.key === key && h.year === year) return h.ch; }
  return 0;
}
function holderOf(key, year) {
  return champOf(key, year) || (year < S.era ? teamIdByKey((REAL_HOLDERS[key] || {})[year]) : 0);
}

// group draw: pots by strength, one club of each pot per group, clubs of the same country apart whenever possible
function drawGroups(ids, nG) {
  const sorted = ids.slice().sort(by((id) => teamRating(id), -1));
  const size = Math.ceil(sorted.length / nG);
  const pots = Array.from({ length: size }, (_, i) => sorted.slice(i * nG, i * nG + nG));
  const ctry = (id) => (S.teams[id] ? S.teams[id].c : '');
  let best = null, bestBad = 1e9;
  for (let attempt = 0; attempt < 60 && bestBad > 0; attempt++) {
    const groups = Array.from({ length: nG }, () => []);
    let bad = 0;
    for (const pot of pots) {
      const free = shuffle(groups.map((_, i) => i));
      for (const id of shuffle(pot.slice())) {
        let k = free.findIndex((g) => !groups[g].some((x) => ctry(x) === ctry(id)));
        if (k < 0) { k = 0; bad++; }
        groups[free[k]].push(id);
        free.splice(k, 1);
      }
    }
    if (bad < bestBad) { bestBad = bad; best = groups; }
  }
  return best;
}

// ---------------------------------------------------------------- Copa Sul-Americana
// 32 clubs: 6 Brazilian and 6 Argentinian clubs right below the Libertadores places, 20 from the other countries
function createSudamericana(y, label) {
  const lib = compOf('LIB', y);
  const inLib = new Set(lib ? lib.groups.flatMap((g) => g.teams) : []);
  const free = (id) => id && S.teams[id] && !inLib.has(id);
  const bra = leagueRankingSA('BRA').filter(free), arg = leagueRankingSA('ARG').filter(free);
  // the clubs right below the Libertadores places of every country (SULA_PLACES, 16_access.js)
  const teams = conmebolRows(SULA_PLACES, inLib).slice(0, 32);
  const others = uniq(S.fill.liber.concat(S.fill.sula || [])).filter((id) => free(id) && !teams.includes(id)).sort(by((id) => teamRating(id) + rnd() * 6, -1));
  teams.push(...others.slice(0, 32 - teams.length));
  // careers started before these clubs existed: more Argentinian and Brazilian clubs instead
  for (let i = 6; teams.length < 32 && (i < arg.length || i < bra.length); i++) {
    if (arg[i] && !teams.includes(arg[i])) teams.push(arg[i]);
    if (teams.length < 32 && bra[i] && !teams.includes(bra[i])) teams.push(bra[i]);
  }
  if (teams.length < 32) return null;
  const d = sulaDates(y);
  const c = makeGroups({ key: 'SULA', name: 'Copa Sul-Americana', short: 'SULA', zone: 'SA', season: label, year: y, groups: drawGroups(teams, 8), double: true, dates: d.groups, spread: 3 });
  c.koCustom = 'sula';
  c.koPlan = [{ name: 'Playoffs', d: d.po, legs: 2, spread: 3 }, { name: 'Oitavas de final', d: d.r16, legs: 2, spread: 2 },
    { name: 'Quartas de final', d: d.qf, legs: 2, spread: 2 }, { name: 'Semifinal', d: d.sf, legs: 2, spread: 2 },
    { name: 'Final', d: d.final, legs: 1, neutral: true }];
  return c;
}
// play-offs: the 8 group runners-up against the 8 clubs that finished 3rd in the Libertadores groups
function sulaPlayoffs(y) {
  const c = compOf('SULA', y);
  if (!c || !c.waitLib || !c.groupFinal) return;
  const lib = compOf('LIB', y);
  if (lib && !lib.groupFinal) return; // the Libertadores group stage is still going
  c.waitLib = false;
  c.groupWinners = c.groupFinal.map((t) => t[0]);
  const seconds = shuffle(c.groupFinal.map((t) => t[1]));
  const thirds = shuffle((lib ? lib.groupFinal : c.groupFinal).map((t) => t[2]).filter(Boolean));
  c.fromLib = lib ? thirds.slice() : [];
  c.stage = 0;
  c.onStageDone = 'sulaKO';
  createKORound(c, c.koPlan[0], seconds.map((s, i) => [thirds[i], s]).filter(([a, b]) => a && b));
  if (S.presim || !lib) return;
  for (const id of thirds) {
    if (!isUserTeam(id)) continue;
    addInbox('board', 'Diretoria', 'Vaga na Copa Sul-Americana', `${TA(id)} terminou em 3º no grupo da Libertadores e continua no continente: agora disputa os playoffs da Copa Sul-Americana.`);
  }
}

// ---------------------------------------------------------------- Mundial de Clubes
function pickRepresentative(keys, used) {
  const ids = keys.map(teamIdByKey).filter((id) => id && !used.has(id) && squadOf(id).length >= 14);
  if (!ids.length) return 0;
  const top = Math.max(...ids.map((id) => teamRating(id)));
  const w = ids.map((id) => Math.exp((teamRating(id) - top) / 3));
  let r = rnd() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ids.length; i++) { r -= w[i]; if (r <= 0) { used.add(ids[i]); return ids[i]; } }
  used.add(ids[0]);
  return ids[0];
}
function bestEuropeanClub(used) {
  const ids = uniq(S.normal.filter((l) => l.cal === 'EU').flatMap((l) => l.teams)).filter((id) => !used.has(id));
  return ids.sort(by((id) => teamRating(id), -1))[0] || 0;
}
function createClubWorldCup(y) {
  if (S.mode !== 'normal') return null;
  S.cwcYears = S.cwcYears || [];
  if (S.cwcYears.includes(y)) return null;
  const conmebol = champOf('LIB', y);
  if (!conmebol) return null;
  const used = new Set([conmebol]);
  let uefa = holderOf('UCL', y - 1);
  if (!uefa || used.has(uefa)) uefa = bestEuropeanClub(used);
  used.add(uefa);
  const conc = pickRepresentative(CWC_POOL.CONCACAF, used), afc = pickRepresentative(CWC_POOL.AFC, used);
  const caf = pickRepresentative(CWC_POOL.CAF, used), ofc = pickRepresentative(CWC_POOL.OFC, used);
  if (!uefa || !conc || !afc || !caf) return null;
  S.cwcYears.push(y);
  const d = cwcDates(y);
  const c = newComp({ kind: 'cup', key: 'MUN', name: 'Mundial de Clubes', short: 'MUN', zone: 'SA', season: String(y), year: y, legs: 1, cwc: true });
  c.reps = { uefa, conmebol, conc, afc, caf, ofc };
  c.teams = [uefa, conmebol, conc, afc, caf, ofc].filter(Boolean);
  const add = (slot, name, day, a, b) => c.rounds.push({ slot, name, d: Math.max(day, S.date + 1), sides: [a, b], m: [], ties: [] });
  // Oceania's champion plays the Asian champion in even years and the African one in odd years
  if (ofc) {
    const first = y % 2 === 0 ? afc : caf;
    add('r1', 'Primeira fase', d.r1, first, ofc);
    add('aap', 'Copa Afro-Asiática-Pacífica', d.aap, first === afc ? caf : afc, { w: 'r1' });
  } else add('aap', 'Copa Afro-Asiática-Pacífica', d.aap, afc, caf);
  add('derby', 'Dérbi das Américas', d.derby, conmebol, conc);
  add('chal', 'Copa Challenger', d.chal, { w: 'derby' }, { w: 'aap' });
  add('final', 'Final', d.final, uefa, { w: 'chal' });
  cwcAdvance(c);
  if (!S.presim) {
    const lines = Object.entries(c.reps).filter(([, id]) => id).map(([k, id]) => `${CONF_LABEL[k]}: ${teamName(id)}`).join(' · ');
    addNews(`Mundial de Clubes ${y}: ${teamName(uefa)} e ${teamName(conmebol)} lideram a lista`, `Definidos os campeões continentais que disputam o Mundial de Clubes em dezembro. ${lines}. O campeão europeu entra direto na final; o campeão da Libertadores começa no Dérbi das Américas.`, 'titulo', [uefa, conmebol], { cat: 'Mundial de Clubes', hot: true, cup: 'MUN' });
    const uid = S.user.team;
    if (!S.coach.unemployed && c.teams.includes(uid)) {
      const first = c.rounds.find((r) => r.sides.includes(uid));
      addInbox('board', 'Diretoria', 'Classificados para o Mundial de Clubes!', `${TA(uid)} vai disputar o Mundial de Clubes ${y}. ${uid === uefa ? `Como campeão europeu, o time estreia direto na final, marcada para ${fmtDate(d.final, 'long')}.` : `A estreia é pela ${first ? first.name : 'primeira fase'}, em ${fmtDate(first ? first.d : d.r1, 'long')}, em campo neutro.`}`);
    }
  }
  return c;
}
// create every match whose two clubs are known; the winner of the final is the world champion
function cwcAdvance(c) {
  const winner = (slot) => {
    const rd = c.rounds.find((r) => r.slot === slot);
    const t = rd && rd.ties.length ? c.ties[rd.ties[0]] : null;
    return t && t.w ? t.w : 0;
  };
  const val = (x) => (x && typeof x === 'object' ? winner(x.w) : x);
  c.rounds.forEach((rd, r) => {
    if (rd.ties.length) return;
    const a = val(rd.sides[0]), b = val(rd.sides[1]);
    if (!a || !b) return;
    const tieId = nextId('tie');
    const tie = { id: tieId, r, a, b, m: [], w: 0 };
    c.ties[tieId] = tie;
    rd.ties.push(tieId);
    const m = addMatch(c, r, Math.max(rd.d, S.date + 1), a, b, { tie: tieId, neutral: true, time: rd.slot === 'final' ? '14:00' : '13:30', idx: 0 });
    tie.m = [m.id];
  });
  const fin = c.rounds[c.rounds.length - 1];
  const t = fin && fin.ties.length ? c.ties[fin.ties[0]] : null;
  if (t && t.w && !c.done) finishComp(c, t.w, t.w === t.a ? t.b : t.a);
}

// ---------------------------------------------------------------- careers saved before these competitions existed
// bring in the new clubs from the loaded era file (new ids), so the next South American season has a Sul-Americana
function importNewClubs() {
  if (!S || S.mode !== 'normal' || !S.fill || S.fill.sula || !DATA || DATA.era !== S.era || !DATA.struct || !DATA.struct.sula) return 0;
  const T = DATA.tcols, P = DATA.pcols, st = DATA.struct;
  const pid0 = st.pid0 || Infinity;
  const rows = new Map(DATA.teams.map((r) => [r[0], r]));
  const yearsOn = Math.max(0, seasonEndYear() - S.era);
  let nextT = Math.max(...Object.keys(S.teams).map(Number).filter((x) => x < 900000)) + 1;
  const idMap = {};
  for (const did of st.sula.concat(st.ofc || [])) {
    const r = rows.get(did);
    if (!r) continue;
    const o = {}; T.forEach((k, i) => (o[k] = r[i]));
    let t = Object.values(S.teams).find((x) => x.key === o.key);
    // clubs that were external teams in the old file keep their id (and their players)
    if (!t && S.teams[did] && S.teams[did].ext && !S.teams[did].isNat && String(S.teams[did].key).startsWith('x:')) t = S.teams[did];
    if (!t) {
      t = { id: S.teams[did] ? nextT++ : did, sq: [], form: '4-3-3', budget: 0, wb: 0 };
      if (t.id >= nextT) nextT = t.id + 1;
      S.teams[t.id] = t;
    }
    Object.assign(t, { key: o.key, n: o.name, s: o.short, c: o.country, c1: o.c1, c2: o.c2, ext: 0, std: o.stadium, fin: o.fin });
    idMap[did] = t.id;
  }
  let added = 0;
  for (const r of DATA.players) {
    if (r[0] < pid0) continue;
    const o = {}; P.forEach((k, i) => (o[k] = r[i]));
    const tid = idMap[o.team];
    if (!tid) continue;
    const p = { id: S.seq.p++, n: o.name, s: o.short, t: tid, p: o.pos, alt: o.alt, age: o.age, o: o.ovr, pot: o.pot, nat: o.nat,
      f: o.foot, h: o.h, a: [o.pac, o.sho, o.pas, o.dri, o.def, o.phy], num: o.num, ct: o.contract + yearsOn, fit: 100, fitD: 0, form: 0, mor: 70, car: [0, 0, 0] };
    boostYoungPot(p);
    S.players[p.id] = p;
    S.teams[tid].sq.push(p.id);
    p.w = wageDemand(p, S.teams[tid]);
    added++;
  }
  for (const did in idMap) setBudgets(S.teams[idMap[did]]);
  S.fill.sula = st.sula.map((id) => idMap[id]).filter(Boolean);
  S.fill.ofc = (st.ofc || []).map((id) => idMap[id]).filter(Boolean);
  KEY_IDX = null;
  // a Libertadores already decided this year still sends its champion to the Mundial
  const y = yearOf(S.date);
  if (champOf('LIB', y) && S.date < dayOf(y, 12, 8)) createClubWorldCup(y);
  return added;
}

// careers saved before the leagues of the Conference League and Sul-Americana countries existed: the clubs come in
// now (external teams of the old file that are these clubs keep their players) and each league starts at the next
// season of its calendar
function importNewLeagues() {
  if (!S || S.mode !== 'normal' || !DATA || DATA.era !== S.era || !DATA.struct || !DATA.struct.lg2) return 0;
  const st = DATA.struct, info = st.lg2;
  const have = new Set(S.normal.map((l) => l.id));
  const fresh = st.normal.filter((l) => !have.has(l.id));
  if (!fresh.length) return 0;
  const T = DATA.tcols, P = DATA.pcols;
  const rows = new Map(DATA.teams.map((r) => [r[0], r]));
  const yearsOn = Math.max(0, seasonEndYear() - S.era);
  let nextT = Math.max(...Object.keys(S.teams).map(Number).filter((x) => x < 900000)) + 1;
  const keyIdx = {};
  for (const id in S.teams) keyIdx[S.teams[id].key] = +id;
  const conv = info.conv || {};
  const idMap = {};
  for (const lg of fresh) for (const did of lg.teams) {
    if (idMap[did]) continue;
    const r = rows.get(did);
    if (!r) continue;
    const o = {}; T.forEach((k, i) => (o[k] = r[i]));
    let t = keyIdx[o.key] ? S.teams[keyIdx[o.key]] : null;
    if (!t) {
      const olds = (conv[did] || []).map((x) => S.teams[x]).filter((x) => x && x.ext && !x.isNat && String(x.key).startsWith('x:'));
      t = olds[0] || null;
      for (const x of olds.slice(1)) { // the same club listed twice by the datasets
        for (const pid of x.sq) { const p = S.players[pid]; if (p) { p.t = t.id; t.sq.push(pid); } }
        delete S.teams[x.id];
      }
    }
    if (!t) {
      t = { id: S.teams[did] ? nextT++ : did, sq: [], form: '4-3-3', budget: 0, wb: 0 };
      if (t.id >= nextT) nextT = t.id + 1;
      S.teams[t.id] = t;
    }
    Object.assign(t, { key: o.key, n: o.name, s: o.short, c: o.country, c1: o.c1, c2: o.c2, ext: 0, std: o.stadium, fin: o.fin });
    idMap[did] = t.id;
  }
  let added = 0;
  const pid1 = info.pid1 || Infinity;
  for (const r of DATA.players) {
    if (r[0] < pid1) continue;
    const o = {}; P.forEach((k, i) => (o[k] = r[i]));
    const tid = idMap[o.team];
    if (!tid) continue;
    const p = { id: S.seq.p++, n: o.name, s: o.short, t: tid, p: o.pos, alt: o.alt, age: o.age, o: o.ovr, pot: o.pot, nat: o.nat,
      f: o.foot, h: o.h, a: [o.pac, o.sho, o.pas, o.dri, o.def, o.phy], num: o.num, ct: o.contract + yearsOn, fit: 100, fitD: 0, form: 0, mor: 70, car: [0, 0, 0] };
    boostYoungPot(p);
    S.players[p.id] = p;
    S.teams[tid].sq.push(p.id);
    p.w = wageDemand(p, S.teams[tid]);
    added++;
  }
  for (const did in idMap) setBudgets(S.teams[idMap[did]]);
  for (const lg of fresh) S.normal.push({ ...lg, teams: lg.teams.map((id) => idMap[id]).filter(Boolean), bank: [] });
  KEY_IDX = null;
  if (!S.presim) addNews('Novas ligas no mundo do jogo', `Chegaram ${fresh.length} ligas: ${fresh.map((l) => l.name).join(', ')}. Cada uma começa na próxima temporada do seu calendário, e a Conference League estreia na próxima temporada europeia.`, 'geral', [], { cat: 'Pelo mundo' });
  return added;
}

/* ===================== continental places by league position (ligas normais) ===================== */
// UEFA associations in coefficient order. Slots by final league position:
// U = Champions League, Q = Champions League play-off, E = Europa League, C = Conference League
const UEFA_RANK = ['ENG', 'ITA', 'ESP', 'GER', 'FRA', 'NED', 'POR', 'BEL', 'TUR', 'CZE', 'GRE', 'NOR', 'POL', 'DEN', 'AUT', 'SUI', 'SCO',
  'SWE', 'ISR', 'CYP', 'SRB', 'CRO', 'HUN', 'UKR', 'ROU', 'SVN', 'BUL', 'SVK', 'AZE', 'KAZ', 'ARM', 'BIH', 'FIN', 'LVA', 'LTU', 'ALB',
  'GEO', 'AND', 'GIB'];
const UEFA_SLOTS = {
  ENG: 'UUUUEEC', ITA: 'UUUUEEC', ESP: 'UUUUEEC', GER: 'UUUUEEC', FRA: 'UUUEEC', NED: 'UUEEC', POR: 'UUEEC',
  BEL: 'UEEC', TUR: 'UEEC', CZE: 'UECC', GRE: 'UECC', NOR: 'UECC', POL: 'UECC', DEN: 'UECC',
  AUT: 'QECC', SUI: 'QECC', SCO: 'QECC', SWE: 'QCC', ISR: 'QC', CYP: 'QC', SRB: 'QEC', CRO: 'QEC', HUN: 'QC', UKR: 'QEC',
  ROU: 'EC', SVN: 'C', BUL: 'QC', SVK: 'EC', AZE: 'QC', KAZ: 'C', ARM: 'C', BIH: 'C', FIN: 'C', LVA: 'C', LTU: 'C', ALB: 'C',
  GEO: 'C', AND: 'C', GIB: 'C',
};
// CONMEBOL: Libertadores places, then Sul-Americana places right below them
const CONMEBOL_RANK = ['BRA', 'ARG', 'COL', 'ECU', 'URU', 'PAR', 'CHI', 'PER', 'BOL', 'VEN'];
const LIB_PLACES = { BRA: 7, ARG: 6, COL: 3, ECU: 3, URU: 2, PAR: 2, CHI: 2, PER: 2, BOL: 2, VEN: 2 };
const SULA_PLACES = { BRA: 6, ARG: 6, COL: 3, ECU: 3, URU: 3, PAR: 2, CHI: 3, PER: 2, BOL: 2, VEN: 2 };
// the leagues every career starts with (the others came with the Conference League update)
const MAIN_LEAGUES = new Set(['ENG', 'ESP', 'GER', 'FRA', 'ITA', 'BRA', 'ARG', 'POR', 'NED']);

const leagueById = (id) => (S.normal || []).find((l) => l.id === id);
const validClub = (id) => !!(id && S.teams[id] && !S.teams[id].isNat && !S.teams[id].ext);

// qualified clubs per kind, in priority order: first slot of that kind of every association (by rank), then the second ones…
function uefaCandidates() {
  const rows = { U: [], Q: [], E: [], C: [] };
  UEFA_RANK.forEach((ctry, ri) => {
    const slots = UEFA_SLOTS[ctry];
    if (!slots || !leagueById(ctry)) return;
    const rk = leagueRanking(ctry);
    const seen = {};
    [...slots].forEach((s, pos) => {
      const id = rk[pos];
      if (!validClub(id)) return;
      seen[s] = (seen[s] || 0) + 1;
      rows[s].push({ id, pr: seen[s] * 100 + ri });
    });
  });
  for (const k in rows) rows[k] = rows[k].sort((a, b) => a.pr - b.pr).map((r) => r.id);
  return rows;
}
// best clubs of the UEFA leagues (or of the old filler pools) that are not in `taken`
function uefaReserve(taken, n) {
  if (n <= 0) return [];
  const pool = uniq(S.normal.filter((l) => UEFA_SLOTS[l.id]).flatMap((l) => leagueRanking(l.id).slice(0, 8))
    .concat(S.fill.ucl || [], S.fill.uel || [])).filter((id) => validClub(id) && !taken.has(id));
  const out = pool.sort(by((id) => teamRating(id), -1)).slice(0, n);
  out.forEach((id) => taken.add(id));
  return out;
}

function conmebolRows(places, exclude) {
  const rows = [];
  CONMEBOL_RANK.forEach((ctry, ri) => {
    if (!leagueById(ctry)) return;
    leagueRankingSA(ctry).filter((id) => validClub(id) && !exclude.has(id)).slice(0, places[ctry] || 0)
      .forEach((id, i) => rows.push({ id, pr: (i + 1) * 100 + ri }));
  });
  return rows.sort((a, b) => a.pr - b.pr).map((r) => r.id);
}

// table zones of a league of the normal mode, from the places above
function continentalZone(c, pos) {
  const ctry = c.lgId || c.key;
  const slot = UEFA_SLOTS[ctry] && UEFA_SLOTS[ctry][pos - 1];
  if (slot) return { U: 'zone-ucl', Q: 'zone-uclq', E: 'zone-uel', C: 'zone-uecl' }[slot];
  if (LIB_PLACES[ctry]) {
    if (pos <= LIB_PLACES[ctry]) return 'zone-lib';
    if (pos <= LIB_PLACES[ctry] + (SULA_PLACES[ctry] || 0)) return 'zone-sula';
  }
  return '';
}
const ZONE_LEGEND = {
  'zone-ucl': ['#4c7dff', 'Champions League'], 'zone-uclq': ['#9db8ff', 'Pré-Champions'], 'zone-uel': ['#ff9a3c', 'Europa League'],
  'zone-uecl': ['#2fbf71', 'Conference League'], 'zone-lib': ['var(--gold)', 'Libertadores'], 'zone-sula': ['#1e88e5', 'Sul-Americana'],
};

/* ===================== Brazilian state championships (estaduais) and the Copinha ===================== */
// Clubs that only play the state championships (and the Copinha) are created when a career needs them, with generated
// squads. Clubs the game already has keep their real players; one missing in an era (Vasco in 2021, say) is created
// here too. key|name|short|colour 1|colour 2|stadium|level (average overall of the best 14)
const STATE_CLUB_ROWS = `
vasco|Vasco da Gama|VAS|#111111|#ffffff|São Januário|64
bahia|Bahia|BAH|#0047ab|#e2001a|Arena Fonte Nova|62
vitoria|Vitória|VIT|#e2001a|#111111|Barradão|61
americamg|América-MG|AMG|#00843d|#111111|Independência|62
atleticogo|Atlético-GO|ACG|#e2001a|#111111|Antônio Accioly|61
vilanova|Vila Nova|VNO|#e2001a|#ffffff|Onésio Brasileiro Alvarenga|59
novorizontino|Novorizontino|NOV|#ffd200|#111111|Jorge Ismael de Biasi|57
mirassol|Mirassol|MIR|#ffd200|#00843d|Campos Maia|58
santacruz|Santa Cruz|STC|#e2001a|#111111|Arruda|55
figueirense|Figueirense|FIG|#111111|#ffffff|Orlando Scarpelli|56
criciuma|Criciúma|CRI|#ffd200|#111111|Heriberto Hülse|59
joinville|Joinville|JEC|#e2001a|#111111|Arena Joinville|53
avai|Avaí|AVA|#0047ab|#ffffff|Ressacada|60
juventude|Juventude|JUV|#00843d|#ffffff|Alfredo Jaconi|57
pontepreta|Ponte Preta|PON|#ffffff|#111111|Moisés Lucarelli|59
br_saobento|São Bento|SBT|#1e40af|#ffffff|Walter Ribeiro|54
br_linense|Linense|LIN|#c8102e|#ffffff|Gilbertão|52
br_botafogosp|Botafogo-SP|BFC|#c8102e|#111111|Santa Cruz|57
br_oeste|Oeste|OES|#c8102e|#ffffff|Arena Barueri|55
br_saobernardo|São Bernardo|SBE|#ffd200|#111111|1º de Maio|56
br_ituano|Ituano|ITU|#c8102e|#111111|Novelli Júnior|56
br_audax|Osasco Audax|AUD|#f97316|#1e3a8a|José Liberatti|55
br_ferroviaria|Ferroviária|FER|#8b0d32|#ffffff|Fonte Luminosa|55
br_xvpiracicaba|XV de Piracicaba|XVP|#111111|#ffffff|Barão de Serra Negra|52
br_capivariano|Capivariano|CAP|#c8102e|#ffffff|Arena Capivari|53
br_redbullbrasil|Red Bull Brasil|RBR|#ffffff|#c8102e|Moisés Lucarelli|55
br_aguasanta|Água Santa|AGS|#1d4ed8|#ffffff|Distrital do Inamar|53
br_mogimirim|Mogi Mirim|MOG|#c8102e|#ffffff|Romildão|51
br_rioclaro|Rio Claro|RCL|#1e40af|#ffffff|Benito Agnelo Castellano|51
br_interlimeira|Inter de Limeira|INL|#111111|#ffffff|Major José Levy Sobrinho|54
br_santoandre|Santo André|STA|#1e40af|#ffffff|Bruno José Daniel|54
br_saocaetano|São Caetano|SCT|#1e40af|#ffffff|Anacleto Campanella|53
br_guarani|Guarani|GUA|#00843d|#ffffff|Brinco de Ouro|58
br_noroeste|Noroeste|NOR|#c8102e|#ffffff|Alfredo de Castilho|54
br_portuguesa|Portuguesa|POR|#c8102e|#00843d|Canindé|56
br_primavera|Primavera|PRI|#e11d48|#ffffff|Ítalo Mário Limongi|54
br_veloclube|Velo Clube|VEL|#00843d|#c8102e|Benito Agnelo Castellano|54
br_boavista|Boavista|BVS|#00843d|#ffffff|Elcyr Resende|54
br_bangu|Bangu|BAN|#c8102e|#ffffff|Moça Bonita|53
br_cabofriense|Cabofriense|CAB|#f59e0b|#111111|Correão|50
br_portuguesarj|Portuguesa-RJ|PRJ|#c8102e|#00843d|Luso-Brasileiro|53
br_resende|Resende|RES|#111111|#ffffff|Estádio do Trabalhador|51
br_macae|Macaé|MAC|#1e40af|#ffffff|Moacyrzão|51
br_voltaredonda|Volta Redonda|VRE|#ffd200|#111111|Raulino de Oliveira|56
br_madureira|Madureira|MAD|#facc15|#1d4ed8|Conselheiro Galvão|53
br_americarj|America-RJ|AME|#c8102e|#ffffff|Giulite Coutinho|50
br_friburguense|Friburguense|FRI|#00843d|#ffffff|Eduardo Guinle|49
br_tigresbrasil|Tigres do Brasil|TIG|#ffd200|#111111|Moça Bonita|49
br_bonsucesso|Bonsucesso|BON|#1e40af|#c8102e|Leônidas da Silva|48
br_novaiguacu|Nova Iguaçu|NIG|#f97316|#ffffff|Laranjão|55
br_sampaiocorrearj|Sampaio Corrêa-RJ|SCR|#00843d|#ffd200|Elcyr Resende|52
br_marica|Maricá|MAR|#0ea5e9|#ffffff|João Saldanha|53
br_urt|URT|URT|#1d4ed8|#ffffff|Zama Maciel|53
br_caldense|Caldense|CAL|#00843d|#ffffff|Ronaldão|53
br_villanova|Villa Nova|VNA|#c8102e|#ffffff|Castor Cifuentes|52
br_tricordiano|Tricordiano|TRI|#1e40af|#ffffff|Elias Arbex|50
br_tombense|Tombense|TOM|#c8102e|#ffffff|Antônio Guimarães de Almeida|56
br_tupi|Tupi|TUP|#111111|#ffffff|Mário Helênio|52
br_uberlandia|Uberlândia|UBE|#00843d|#ffffff|Parque do Sabiá|52
br_guaranimg|Guarani-MG|GMG|#ffd200|#111111|Farião|49
br_boaesporte|Boa Esporte|BOA|#1d4ed8|#ffffff|Melão|53
br_athleticclub|Athletic Club|ATH|#111111|#ffffff|Joaquim Portugal|55
br_coimbra|Coimbra|COI|#2563eb|#ffd200|Arena Coimbra|52
br_patrocinense|Patrocinense|PAT|#1d4ed8|#ffffff|Pedro Alves do Nascimento|51
br_pousoalegre|Pouso Alegre|POU|#c8102e|#111111|Manduzão|53
br_democratagv|Democrata-GV|DEM|#111111|#ffffff|Mamudão|51
br_betim|Betim|BET|#c8102e|#111111|Estádio Municipal de Betim|52
br_north|North|NTH|#16a34a|#ffffff|José Maria de Melo|52
br_itabirito|Itabirito|ITB|#1d4ed8|#ffffff|Castor Cifuentes|52
br_aimore|Aimoré|AIM|#1e40af|#ffffff|Cristo Rei|52
br_brasilpelotas|Brasil de Pelotas|BRP|#c8102e|#111111|Bento Freitas|55
br_cruzeirors|Cruzeiro-RS|CRS|#1e40af|#ffffff|Estrelão|50
br_gloria|Glória|GLO|#16a34a|#ffffff|Altos da Glória|49
br_lajeadense|Lajeadense|LAJ|#1d4ed8|#ffffff|Arena Alviazul|49
br_novohamburgo|Novo Hamburgo|NOH|#1e40af|#ffffff|Estádio do Vale|53
br_passofundo|Passo Fundo|PFU|#c8102e|#1d4ed8|Vermelhão da Serra|49
br_saojosers|São José-RS|SJO|#1e40af|#ffffff|Passo D'Areia|53
br_saopaulors|São Paulo-RS|SPR|#c8102e|#ffffff|Aldo Dapuzzo|49
br_veranopolis|Veranópolis|VER|#1d4ed8|#ffffff|Antônio David Farina|49
br_ypiranga|Ypiranga|YPI|#00843d|#ffd200|Colosso da Lagoa|54
br_caxias|Caxias|CAX|#8b0d32|#ffffff|Centenário|56
br_esportivo|Esportivo|ESP|#1d4ed8|#c8102e|Montanha dos Vinhedos|50
br_pelotas|Pelotas|PEL|#1e40af|#ffd200|Boca do Lobo|52
br_saoluiz|São Luiz|SLU|#c8102e|#ffffff|19 de Outubro|52
br_avenida|Avenida|AVE|#00843d|#ffffff|Eucaliptos|52
br_guaranybage|Guarany de Bagé|GBA|#c8102e|#ffffff|Estrela D'Alva|50
br_monsoon|Monsoon|MON|#7c3aed|#ffffff|Passo D'Areia|50
br_intersm|Inter de Santa Maria|ISM|#c8102e|#ffffff|Presidente Vargas|50
br_fccascavel|FC Cascavel|FCC|#ffd200|#111111|Olímpico Regional|54
br_cascavelcr|Cascavel CR|CCR|#16a34a|#ffffff|Olímpico Regional|51
br_foziguacu|Foz do Iguaçu|FOZ|#1e40af|#ffffff|ABC|50
br_gremiomaringa|Grêmio Maringá|GMA|#1d4ed8|#111111|Willie Davids|50
br_jmalucelli|J. Malucelli|JMA|#16a34a|#ffffff|Eco-Estádio Janguito Malucelli|51
br_londrina|Londrina|LEC|#0ea5e9|#ffffff|Estádio do Café|58
br_operariopr|Operário-PR|OPE|#111111|#ffffff|Germano Krüger|59
br_parana|Paraná|PAR|#1e40af|#c8102e|Vila Capanema|56
br_pstc|PSTC|PST|#c8102e|#1d4ed8|Ubirajara Medeiros|49
br_riobrancopr|Rio Branco-PR|RBP|#c8102e|#ffffff|Estádio da Estradinha|49
br_toledo|Toledo|TOL|#1d4ed8|#ffffff|14 de Dezembro|49
br_azuriz|Azuriz|AZU|#1e40af|#ffffff|Os Pioneiros|53
br_cianorte|Cianorte|CIA|#1d4ed8|#ffffff|Albino Turbay|52
br_maringa|Maringá|MFC|#1e3a8a|#ffffff|Willie Davids|54
br_andraus|Andraus|AND|#0ea5e9|#111111|Estádio do Andraus|50
br_galomaringa|Galo Maringá|GAL|#c8102e|#111111|Willie Davids|50
br_saojoseense|São Joseense|SJS|#16a34a|#ffffff|Estádio Municipal de São José dos Pinhais|49
br_brusque|Brusque|BRU|#ffd200|#16a34a|Augusto Bauer|56
br_camboriu|Camboriú|CBU|#c8102e|#ffffff|Robertão|50
br_guaranipalhoca|Guarani de Palhoça|GPA|#00843d|#ffffff|Renato Silveira|49
br_interlages|Inter de Lages|ILA|#c8102e|#ffffff|Vidal Ramos Júnior|49
br_metropolitano|Metropolitano|MET|#1d4ed8|#ffffff|Sesi|49
br_concordia|Concórdia|CON|#1d4ed8|#ffffff|Domingos Machado de Lima|49
br_hercilioluz|Hercílio Luz|HER|#16a34a|#ffffff|Aníbal Costa|50
br_juventussc|Juventus-SC|JSC|#8b0d32|#ffffff|João Marcatto|50
br_marciliodias|Marcílio Dias|MDI|#c8102e|#1d4ed8|Gigantinho|53
br_prospera|Próspera|PRO|#f97316|#111111|Mário Balsini|49
br_barra|Barra|BAR|#0ea5e9|#ffffff|Arena Barra|53
br_carlosrenaux|Carlos Renaux|CRE|#1d4ed8|#ffffff|Augusto Bauer|50
br_santacatarina|Santa Catarina|SCA|#ef4444|#ffffff|Alfredo João Krieck|49
br_galicia|Galícia|GLC|#1d4ed8|#ffffff|Parque Santiago|49
br_juazeirense|Juazeirense|JUA|#1d4ed8|#c8102e|Adauto Moraes|53
br_flamengoguanambi|Flamengo de Guanambi|FLG|#c8102e|#111111|Estádio Municipal de Guanambi|48
br_bahiadefeira|Bahia de Feira|BDF|#1d4ed8|#c8102e|Joia da Princesa|52
br_colocolo|Colo Colo-BA|CCO|#111111|#ffffff|Mário Pessoa|48
br_jacobina|Jacobina|JAC|#16a34a|#ffffff|José Rocha|48
br_fluminensefeira|Fluminense de Feira|FDF|#16a34a|#ffffff|Joia da Princesa|51
br_conquista|Vitória da Conquista|VDC|#ffd200|#16a34a|Lomanto Júnior|51
br_feirense|Feirense|FEI|#1d4ed8|#ffffff|Joia da Princesa|48
br_jacuipense|Jacuipense|JCP|#c8102e|#ffffff|Eliel Martins|53
br_alagoinhas|Atlético de Alagoinhas|ATA|#c8102e|#ffffff|Carneirão|53
br_docemel|Doce Mel|DME|#ffd200|#111111|Pedro Caetano|48
br_unirb|UNIRB|UNI|#1d4ed8|#ffffff|Pituaçu|48
br_barcelonailheus|Barcelona de Ilhéus|BDI|#c8102e|#1d4ed8|Mário Pessoa|51
br_jequie|Jequié|JEQ|#16a34a|#ffffff|Waldomiro Borges|50
br_portoba|Porto-BA|PBA|#1d4ed8|#ffffff|Estádio Municipal de Porto Seguro|50
br_nautico|Náutico|NAU|#c8102e|#ffffff|Aflitos|58
br_salgueiro|Salgueiro|SAL|#1d4ed8|#ffffff|Cornélio de Barros|51
br_americape|América-PE|AMP|#16a34a|#ffffff|Ademir Cunha|48
br_atleticope|Atlético Pernambucano|ATP|#c8102e|#111111|Ademir Cunha|47
br_belojardim|Belo Jardim|BJA|#1d4ed8|#ffffff|Estádio Mendonção|47
br_central|Central|CEN|#111111|#ffffff|Lacerdão|50
br_pesqueira|Pesqueira|PES|#c8102e|#ffffff|Estádio Joaquim de Brito|46
br_portope|Porto-PE|POP|#1d4ed8|#ffffff|Estádio Antônio Inácio|47
br_serratalhada|Serra Talhada|SET|#c8102e|#111111|Pereirão|47
br_vitoriatabocas|Vitória das Tabocas|VDT|#16a34a|#ffffff|Carneirão|50
br_afogados|Afogados|AFO|#1d4ed8|#ffd200|Vianão|48
br_retro|Retrô|RET|#f59e0b|#111111|Arena de Pernambuco|53
br_setedesetembro|Sete de Setembro|SDS|#16a34a|#ffffff|Estádio Municipal de Garanhuns|46
br_veracruzpe|Vera Cruz|VCR|#c8102e|#ffffff|Estádio Municipal de Vitória de Santo Antão|46
br_decisao|Decisão|DEC|#16a34a|#ffffff|Estádio Municipal de Goiana|48
br_jaguar|Jaguar|JAG|#f59e0b|#111111|Arena de Pernambuco|47
br_maguary|Maguary|MAG|#1d4ed8|#ffffff|Arena de Pernambuco|48
br_atleticocearense|Atlético Cearense|ATC|#c8102e|#111111|Presidente Vargas|50
br_barbalha|Barbalha|BRB|#16a34a|#ffffff|Inaldão|47
br_caucaia|Caucaia|CAU|#1d4ed8|#ffffff|Raimundo de Oliveira|50
br_crato|Crato|CRT|#16a34a|#ffffff|Mirandão|47
br_ferroviarioce|Ferroviário|FCE|#111111|#c8102e|Elzir Cabral|54
br_guaranysobral|Guarany de Sobral|GDS|#111111|#ffffff|Junco|49
br_icasa|Icasa|ICA|#16a34a|#ffffff|Romeirão|50
br_pacajus|Pacajus|PJS|#1d4ed8|#ffffff|Estádio Municipal de Pacajus|47
br_floresta|Floresta|FLO|#16a34a|#ffffff|Domingão|52
br_horizonte|Horizonte|HOR|#c8102e|#ffffff|Domingão|50
br_iguatu|Iguatu|IGU|#1d4ed8|#ffffff|Morenão|50
br_maracana|Maracanã|MRC|#c8102e|#ffffff|Almir Dantas Pinto|49
br_maranguape|Maranguape|MRG|#16a34a|#ffffff|Moraizão|47
br_quixada|Quixadá|QXD|#1d4ed8|#ffd200|Abilhão|46
br_tirol|Tirol|TIR|#1d4ed8|#ffffff|Presidente Vargas|46
br_anapolis|Anápolis|ANA|#c8102e|#ffffff|Jonas Duarte|51
br_itumbiara|Itumbiara|ITM|#c8102e|#ffffff|JK|49
br_crac|CRAC|CRC|#1d4ed8|#c8102e|Genervino da Fonseca|50
br_trindade|Trindade|TRD|#c8102e|#ffffff|Abrahão Ribeiro Teixeira|46
br_aparecidense|Aparecidense|APA|#1d4ed8|#ffffff|Annibal Batista de Toledo|53
br_goianesia|Goianésia|GNS|#16a34a|#ffffff|Valdeir José de Oliveira|48
br_anapolina|Anapolina|ANP|#c8102e|#1d4ed8|Jonas Duarte|48
br_jataiense|Jataiense|JAT|#16a34a|#ffffff|Arthur Marques|48
br_gremioanapolis|Grêmio Anápolis|GAN|#1d4ed8|#111111|Jonas Duarte|51
br_ipora|Iporá|IPO|#ffd200|#16a34a|Ferreirão|47
br_jaragua|Jaraguá|JRG|#c8102e|#ffffff|Estádio Municipal de Jaraguá|46
br_inhumas|Inhumas|INH|#16a34a|#ffffff|Zico Brandão|47
br_goiatuba|Goiatuba|GTB|#1d4ed8|#ffffff|Divino Garcia Rosa|47
br_abecat|ABECAT|ABE|#f59e0b|#111111|Jonas Duarte|47
br_centrooeste|Centro Oeste|COE|#16a34a|#ffd200|Estádio Municipal de Nova Crixás|47
br_paysandu|Paysandu|PAY|#0ea5e9|#ffffff|Curuzu|59
br_aguiamaraba|Águia de Marabá|AGU|#1d4ed8|#ffffff|Zinho Oliveira|51
br_amazonia|Amazônia|AMZ|#16a34a|#ffffff|Mangueirão|47
br_bragantinopa|Bragantino-PA|BRG|#c8102e|#ffffff|Diogão|47
br_cameta|Cametá|CMT|#1d4ed8|#ffffff|Parque do Bacurau|48
br_capitaopoco|Capitão Poço|CPP|#16a34a|#ffffff|Estádio Municipal de Capitão Poço|46
br_castanhal|Castanhal|CAS|#111111|#ffd200|Maximino Porpino|49
br_santarosa|Santa Rosa|SRO|#c8102e|#ffffff|Mangueirão|46
br_saofrancisco|São Francisco|SFR|#1d4ed8|#ffffff|Colosso do Tapajós|46
br_saoraimundopa|São Raimundo-PA|SRA|#111111|#ffffff|Colosso do Tapajós|47
br_tunaluso|Tuna Luso|TUN|#16a34a|#c8102e|Francisco Vasques|48
br_acao|Ação|ACA|#16a34a|#ffffff|Dutrinha|48
br_dombosco|Dom Bosco|DBO|#1d4ed8|#ffffff|Dutrinha|48
br_gremiosorriso|Grêmio Sorriso|GSO|#1d4ed8|#111111|Egídio José Preima|47
br_luverdense|Luverdense|LUV|#16a34a|#ffffff|Passo das Emas|53
br_novamutum|Nova Mutum|NMU|#c8102e|#ffffff|Valdir Doilho Wons|49
br_operariovg|Operário VG|OVG|#111111|#ffffff|Dutrinha|51
br_pocone|Poconé|POC|#1d4ed8|#ffffff|Neco Falcão|46
br_sinop|Sinop|SIN|#1d4ed8|#ffffff|Gigante do Norte|48
br_uniaorondonopolis|União Rondonópolis|URO|#c8102e|#ffffff|Engenheiro Luthero Lopes|50
br_crb|CRB|CRB|#c8102e|#ffffff|Rei Pelé|58
br_cse|CSE|CSE|#1d4ed8|#ffffff|Juca Sampaio|49
br_alianca|Aliança|ALI|#16a34a|#ffffff|Arnon de Mello|46
br_asa|ASA|ASA|#111111|#ffffff|Coaracy da Mata Fonseca|51
br_murici|Murici|MUR|#16a34a|#ffffff|José Gomes da Costa|47
br_jacioba|Jaciobá|JCB|#c8102e|#ffffff|Estádio Municipal de Pão de Açúcar|46
br_coruripe|Coruripe|CRP|#ffd200|#1d4ed8|Gerson Amaral|47
br_ceo|CEO|CEO|#f59e0b|#1d4ed8|Rei Pelé|46
`;
const STATE_CLUBS = {};
STATE_CLUB_ROWS.trim().split('\n').forEach((row) => {
  const [key, n, s, c1, c2, std, lvl] = row.split('|');
  STATE_CLUBS[key] = { key, n, s, c1, c2, std, lvl: +lvl };
});

// the championships: name in the game, full name, badge colour
const UF_INFO = {
  SP: ['Paulistão', 'Campeonato Paulista', '#c8102e'], RJ: ['Carioca', 'Campeonato Carioca', '#1e40af'],
  MG: ['Mineiro', 'Campeonato Mineiro', '#b91c1c'], RS: ['Gauchão', 'Campeonato Gaúcho', '#15803d'],
  PR: ['Paranaense', 'Campeonato Paranaense', '#166534'], SC: ['Catarinense', 'Campeonato Catarinense', '#dc2626'],
  BA: ['Baiano', 'Campeonato Baiano', '#1d4ed8'], PE: ['Pernambucano', 'Campeonato Pernambucano', '#2563eb'],
  CE: ['Cearense', 'Campeonato Cearense', '#16a34a'], GO: ['Goiano', 'Campeonato Goiano', '#0f766e'],
  PA: ['Paraense', 'Campeonato Paraense', '#e11d48'], MT: ['Mato-Grossense', 'Campeonato Mato-Grossense', '#1e3a8a'],
  AL: ['Alagoano', 'Campeonato Alagoano', '#9f1239'],
};
for (const uf in UF_INFO) COMP_LOGO['EST' + uf] = UF_INFO[uf][2];
COMP_LOGO.COPINHA = '#0f766e';
FUTCOIN_TABLE.COPINHA = 20;

// Editions by era (the real ones of 2016, 2021 and 2026; later years repeat the format of the era).
// ph: league phases. play: rr (everyone once), rr2 (twice), cross (only the clubs of the other groups), within (inside
// the group), within2 (inside the group, twice), all2 (everyone twice, tables by group), pots (n matchdays drawn from
// four pots, like the 2026 Paulistão). g: the groups; split: n groups drawn by strength; t: a single table.
// add: clubs that only enter in that phase. q: who goes on: top n of the phase table, or per group (+ best next ones).
// ko: [name, legs, byes]: byes = best seeds that skip that round.
const QF = 'Quartas de final', SF = 'Semifinal', FI = 'Final';
const STATE_ED = {
  2016: {
    SP: { ph: [{ play: 'cross', g: [['santos', 'br_saobento', 'br_linense', 'br_botafogosp', 'br_oeste'], ['palmeiras', 'br_saobernardo', 'pontepreta', 'br_ituano', 'novorizontino'],
      ['br_audax', 'saopaulo', 'br_ferroviaria', 'br_xvpiracicaba', 'br_capivariano'], ['corinthians', 'br_redbullbrasil', 'br_aguasanta', 'br_mogimirim', 'br_rioclaro']], q: { per: 2 } }],
      ko: [[QF, 1], [SF, 1], [FI, 2]] },
    RJ: { ph: [{ play: 'cross', g: [['vasco', 'br_boavista', 'fluminense', 'br_bangu', 'br_cabofriense', 'br_portuguesarj', 'br_resende', 'br_macae'],
      ['botafogo', 'flamengo', 'br_voltaredonda', 'br_madureira', 'br_americarj', 'br_friburguense', 'br_tigresbrasil', 'br_bonsucesso']], q: { per: 4 } }],
      ko: [[QF, 1], [SF, 1], [FI, 2]] },
    MG: { ph: [{ play: 'rr', t: ['cruzeiro', 'atleticomg', 'br_urt', 'americamg', 'br_caldense', 'br_villanova', 'br_tricordiano', 'br_tombense', 'br_tupi', 'br_uberlandia', 'br_guaranimg', 'br_boaesporte'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    RS: { ph: [{ play: 'rr', t: ['br_aimore', 'br_brasilpelotas', 'br_cruzeirors', 'br_gloria', 'gremio', 'internacional', 'juventude', 'br_lajeadense', 'br_novohamburgo', 'br_passofundo',
      'br_saojosers', 'br_saopaulors', 'br_veranopolis', 'br_ypiranga'], q: { top: 8 } }], ko: [[QF, 1], [SF, 2], [FI, 2]] },
    PR: { ph: [{ play: 'rr', t: ['athletico', 'br_fccascavel', 'coritiba', 'br_foziguacu', 'br_gremiomaringa', 'br_jmalucelli', 'br_londrina', 'br_operariopr', 'br_parana', 'br_pstc', 'br_riobrancopr', 'br_toledo'], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    SC: { ph: [{ play: 'rr2', t: ['avai', 'br_brusque', 'br_camboriu', 'chapecoense', 'criciuma', 'figueirense', 'br_guaranipalhoca', 'br_interlages', 'joinville', 'br_metropolitano'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    BA: { ph: [{ play: 'cross', g: [['vitoria', 'br_galicia', 'br_juazeirense', 'br_flamengoguanambi', 'br_bahiadefeira', 'br_colocolo'], ['bahia', 'br_jacobina', 'br_fluminensefeira', 'br_conquista', 'br_feirense', 'br_jacuipense']], q: { per: 4 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    PE: { ph: [{ play: 'within2', split: 2, t: ['br_americape', 'br_atleticope', 'br_belojardim', 'br_central', 'br_pesqueira', 'br_portope', 'br_serratalhada', 'br_vitoriatabocas'], q: { per: 1 }, label: 'Primeira fase' },
      { play: 'rr2', add: ['sport', 'santacruz', 'br_nautico', 'br_salgueiro'], q: { top: 4 }, label: 'Hexagonal' }], ko: [[SF, 2], [FI, 2]] },
    GO: { ph: [{ play: 'all2', g: [['goias', 'br_anapolis', 'br_itumbiara', 'br_crac', 'br_trindade'], ['atleticogo', 'vilanova', 'br_aparecidense', 'br_goianesia', 'br_anapolina']], q: { per: 2 } }],
      ko: [[SF, 2], [FI, 2]] },
  },
  2021: {
    SP: { ph: [{ play: 'cross', g: [['corinthians', 'br_interlimeira', 'br_santoandre', 'br_botafogosp'], ['saopaulo', 'br_ferroviaria', 'pontepreta', 'br_saobento'],
      ['bragantino', 'palmeiras', 'novorizontino', 'br_ituano'], ['mirassol', 'br_guarani', 'santos', 'br_saocaetano']], q: { per: 2 } }], ko: [[QF, 1], [SF, 1], [FI, 2]] },
    RJ: { ph: [{ play: 'rr', t: ['flamengo', 'fluminense', 'br_portuguesarj', 'br_voltaredonda', 'vasco', 'br_novaiguacu', 'botafogo', 'br_madureira', 'br_resende', 'br_boavista', 'br_bangu', 'br_macae'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    MG: { ph: [{ play: 'rr', t: ['americamg', 'br_athleticclub', 'atleticomg', 'br_boaesporte', 'br_caldense', 'br_coimbra', 'cruzeiro', 'br_patrocinense', 'br_pousoalegre', 'br_tombense', 'br_uberlandia', 'br_urt'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    RS: { ph: [{ play: 'rr', t: ['br_aimore', 'br_brasilpelotas', 'br_caxias', 'br_esportivo', 'gremio', 'internacional', 'juventude', 'br_novohamburgo', 'br_pelotas', 'br_saojosers', 'br_saoluiz', 'br_ypiranga'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    PR: { ph: [{ play: 'rr', t: ['athletico', 'br_azuriz', 'br_cascavelcr', 'br_cianorte', 'coritiba', 'br_fccascavel', 'br_londrina', 'br_maringa', 'br_operariopr', 'br_parana', 'br_riobrancopr', 'br_toledo'], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    SC: { ph: [{ play: 'rr', t: ['avai', 'br_brusque', 'chapecoense', 'br_concordia', 'criciuma', 'figueirense', 'br_hercilioluz', 'joinville', 'br_juventussc', 'br_marciliodias', 'br_metropolitano', 'br_prospera'], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    BA: { ph: [{ play: 'rr', t: ['br_alagoinhas', 'bahia', 'br_bahiadefeira', 'br_docemel', 'br_fluminensefeira', 'br_jacuipense', 'br_juazeirense', 'br_unirb', 'vitoria', 'br_conquista'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    PE: { ph: [{ play: 'rr', t: ['br_afogados', 'br_central', 'br_nautico', 'br_retro', 'br_salgueiro', 'santacruz', 'br_setedesetembro', 'sport', 'br_veracruzpe', 'br_vitoriatabocas'], q: { top: 6 } }],
      ko: [[QF, 1, 2], [SF, 1], [FI, 2]] },
    CE: { ph: [{ play: 'rr', t: ['br_atleticocearense', 'br_barbalha', 'br_caucaia', 'br_crato', 'br_ferroviarioce', 'br_guaranysobral', 'br_icasa', 'br_pacajus'], q: { top: 6 }, label: 'Primeira fase' },
      { play: 'rr', add: ['ceara', 'fortaleza'], q: { top: 4 }, label: 'Segunda fase' }], ko: [[SF, 1], [FI, 1]] },
    GO: { ph: [{ play: 'within2', g: [['atleticogo', 'br_jataiense', 'br_crac', 'br_itumbiara', 'br_gremioanapolis', 'br_anapolis'], ['goias', 'vilanova', 'br_goianesia', 'br_aparecidense', 'br_ipora', 'br_jaragua']], q: { per: 4 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    MT: { ph: [{ play: 'rr', t: ['br_acao', 'cuiaba', 'br_dombosco', 'br_gremiosorriso', 'br_luverdense', 'br_novamutum', 'br_operariovg', 'br_pocone', 'br_sinop', 'br_uniaorondonopolis'], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    AL: { ph: [{ play: 'rr', t: ['br_crb', 'csa', 'br_cse', 'br_alianca', 'br_asa', 'br_murici', 'br_jacioba', 'br_coruripe', 'br_ceo'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
  },
  2026: {
    SP: { ph: [{ play: 'pots', n: 8, t: ['br_botafogosp', 'br_capivariano', 'corinthians', 'br_guarani', 'mirassol', 'br_noroeste', 'novorizontino', 'palmeiras', 'pontepreta', 'br_portuguesa', 'br_primavera',
      'bragantino', 'santos', 'br_saobernardo', 'saopaulo', 'br_veloclube'], q: { top: 8 } }], ko: [[QF, 1], [SF, 1], [FI, 2]] },
    RJ: { ph: [{ play: 'cross', g: [['fluminense', 'vasco', 'br_voltaredonda', 'br_sampaiocorrearj', 'br_portuguesarj', 'br_bangu'], ['flamengo', 'botafogo', 'br_madureira', 'br_marica', 'br_boavista', 'br_novaiguacu']], q: { per: 4 } }],
      ko: [[QF, 1], [SF, 2], [FI, 1]] },
    MG: { ph: [{ play: 'cross', g: [['atleticomg', 'br_urt', 'br_uberlandia', 'br_democratagv'], ['americamg', 'br_pousoalegre', 'br_tombense', 'br_betim'], ['cruzeiro', 'br_north', 'br_itabirito', 'br_athleticclub']], q: { per: 1, best: 1 } }],
      ko: [[SF, 2], [FI, 1]] },
    RS: { ph: [{ play: 'cross', g: [['internacional', 'juventude', 'br_avenida', 'br_saojosers', 'br_guaranybage', 'br_saoluiz'], ['gremio', 'br_caxias', 'br_novohamburgo', 'br_monsoon', 'br_ypiranga', 'br_intersm']], q: { per: 4 } }],
      ko: [[QF, 1], [SF, 2], [FI, 2]] },
    PR: { ph: [{ play: 'cross', split: 2, t: ['br_andraus', 'athletico', 'br_azuriz', 'br_cianorte', 'coritiba', 'br_fccascavel', 'br_foziguacu', 'br_galomaringa', 'br_londrina', 'br_maringa', 'br_operariopr', 'br_saojoseense'], q: { per: 4 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    SC: { ph: [{ play: 'cross', split: 2, t: ['avai', 'br_barra', 'br_brusque', 'br_camboriu', 'br_carlosrenaux', 'chapecoense', 'br_concordia', 'criciuma', 'figueirense', 'joinville', 'br_marciliodias', 'br_santacatarina'], q: { per: 4 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    BA: { ph: [{ play: 'rr', t: ['br_alagoinhas', 'bahia', 'br_bahiadefeira', 'br_barcelonailheus', 'br_galicia', 'br_jacuipense', 'br_jequie', 'br_juazeirense', 'br_portoba', 'vitoria'], q: { top: 4 } }],
      ko: [[SF, 1], [FI, 1]] },
    PE: { ph: [{ play: 'rr', t: ['br_decisao', 'br_jaguar', 'br_maguary', 'br_nautico', 'br_retro', 'santacruz', 'sport', 'br_vitoriatabocas'], q: { top: 6 } }],
      ko: [[QF, 2, 2], [SF, 2], [FI, 2]] },
    CE: { ph: [{ play: 'within', g: [['fortaleza', 'br_ferroviarioce', 'br_maracana', 'br_horizonte', 'br_quixada'], ['ceara', 'br_floresta', 'br_iguatu', 'br_tirol', 'br_maranguape']], q: { per: 3 }, label: 'Primeira fase' },
      { play: 'rr', q: { top: 4 }, label: 'Segunda fase' }], ko: [[SF, 2], [FI, 2]] },
    GO: { ph: [{ play: 'cross', g: [['vilanova', 'br_crac', 'br_inhumas', 'br_goiatuba'], ['br_anapolis', 'goias', 'br_jataiense', 'br_aparecidense'], ['atleticogo', 'br_abecat', 'br_centrooeste', 'br_anapolina']], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    PA: { ph: [{ play: 'cross', split: 2, t: ['br_aguiamaraba', 'br_amazonia', 'br_bragantinopa', 'br_cameta', 'br_capitaopoco', 'br_castanhal', 'br_paysandu', 'remo', 'br_santarosa', 'br_saofrancisco', 'br_saoraimundopa', 'br_tunaluso'], q: { top: 8 } }],
      ko: [[QF, 1], [SF, 1], [FI, 2]] },
  },
};
// 3 groups of 4 where every club meets the 8 clubs of the other groups once: 8 matchdays (team index = group * 4 + i)
const CROSS_3X4 = [[[0, 5], [1, 7], [2, 11], [3, 8], [4, 9], [6, 10]], [[0, 9], [1, 4], [2, 8], [3, 7], [5, 10], [6, 11]], [[0, 11], [1, 10], [2, 7], [3, 4], [5, 9], [6, 8]],
  [[0, 6], [1, 11], [2, 4], [3, 10], [5, 8], [7, 9]], [[0, 4], [1, 9], [2, 10], [3, 6], [5, 11], [7, 8]], [[0, 10], [1, 5], [2, 6], [3, 9], [4, 8], [7, 11]],
  [[0, 8], [1, 6], [2, 9], [3, 5], [4, 11], [7, 10]], [[0, 7], [1, 8], [2, 5], [3, 11], [4, 10], [6, 9]]];

const stateEditions = () => (S.mode === 'normal' && STATE_ED[S.era]) || null;
function stateEditionKeys(ed) {
  const keys = new Set();
  for (const uf in ed) {
    if (uf === 'copinha') continue;
    for (const ph of ed[uf].ph) [].concat(ph.t || [], (ph.g || []).flat(), ph.add || []).forEach((k) => keys.add(k));
  }
  return keys;
}
// create the clubs the state championships need (new careers and old saves alike); returns how many were created
function ensureStateClubs() {
  const ed = stateEditions();
  if (!ed) return 0;
  let n = 0;
  for (const key of stateEditionKeys(ed)) if (!teamIdByKey(key) && createStateClub(key)) n++;
  if (n) KEY_IDX = null;
  return n;
}
function createStateClub(key) {
  const d = STATE_CLUBS[key];
  if (!d) return 0;
  const id = Math.max(...Object.keys(S.teams).map(Number).filter((x) => x < 900000)) + 1;
  const t = { id, key, n: d.n, s: d.s, c: 'BRA', c1: d.c1, c2: d.c2, ext: 0, std: d.std, fin: d.lvl >= 57 ? 2 : 1, sq: [], form: pick(['4-3-3', '4-4-2', '4-2-3-1']),
    budget: 0, wb: 0, stOnly: 1 };
  S.teams[id] = t;
  const lvl = d.lvl + (S.era === 2016 ? -1 : 0);
  const plan = [['GK', 2], ['GK', -4], ['GK', -9], ['RB', 1], ['RB', -5], ['CB', 2], ['CB', 1], ['CB', -2], ['CB', -6], ['LB', 0], ['LB', -6], ['CDM', 1], ['CDM', -4],
    ['CM', 2], ['CM', 0], ['CM', -5], ['CAM', 1], ['RM', -3], ['LM', -3], ['RW', 1], ['LW', 0], ['ST', 3], ['ST', -1], ['ST', -6]];
  const y = yearOf(S.date);
  for (const [pos, off] of plan) {
    const age = rint(18, 34);
    const nat = rnd() < 0.05 ? pick(['ARG', 'URU', 'PAR', 'COL']) : 'BRA';
    const p = generatePlayer({ nat, pos, age, ovr: clamp(lvl + off + rint(-2, 2) - (age >= 33 ? 2 : 0), 40, 80), potBoost: age <= 21 ? rint(5, 16) : age <= 24 ? rint(1, 8) : rint(0, 3) });
    movePlayer(p, id, { ct: y + rint(1, 3) });
  }
  setBudgets(t);
  return id;
}
const stateClubId = (key) => (key ? teamIdByKey(key) : 0);
// the clubs that only play the state championship sign a few players in July so they keep their level
function refreshStateClub(t) {
  const d = STATE_CLUBS[t.key];
  if (!d) return;
  const base = d.lvl + (S.era === 2016 ? -1 : 0);
  t._rD = 0;
  const y = yearOf(S.date);
  for (let k = 0; k < 4 && (teamRating(t.id) < base - 1 || squadOf(t.id).length < 22); k++) {
    const sq = squadOf(t.id);
    const cnt = (g) => sq.filter((p) => POS_GROUP[p.p] === g).length;
    const pos = cnt('GK') < 2 ? 'GK' : cnt('DEF') < 7 ? pick(['CB', 'CB', 'RB', 'LB']) : cnt('MID') < 6 ? pick(['CM', 'CDM', 'CAM']) : pick(['ST', 'RW', 'LW', 'ST']);
    const p = generatePlayer({ nat: rnd() < 0.05 ? pick(['ARG', 'URU', 'PAR']) : 'BRA', pos, age: rint(22, 31), ovr: clamp(base + rint(-1, 3), 40, 80), potBoost: rint(0, 3) });
    movePlayer(p, t.id, { ct: y + rint(1, 2) });
    t._rD = 0;
  }
}

// matchdays: Wednesdays and Sundays spread over the window (2026, with the World Cup: January 10th to March 8th;
// the other years from mid-January to early April, before the Brasileirão and the Libertadores)
function stateWindow(y) {
  if (y === 2026) return [dayOf(2026, 1, 10), dayOf(2026, 3, 8)];
  return [onOrAfter(dayOf(y, 1, 17), 0), onOrBefore(dayOf(y, 4, 5), 0)];
}
function stateSlots(y, need) {
  const [a, b] = stateWindow(y);
  const days = [a];
  for (let d = a + 1; d <= b; d++) if (weekday(d) === 0 || weekday(d) === 3) days.push(d);
  if (need >= days.length) { while (days.length < need) days.push(days[days.length - 1] + (weekday(days[days.length - 1]) === 0 ? 3 : 4)); return days; }
  // evenly spread, the final on the last day of the window
  return Array.from({ length: need }, (_, i) => days[Math.round((i * (days.length - 1)) / Math.max(1, need - 1))]);
}
// how many matchdays a championship needs (league phases + knockout legs)
function stateMatchdays(ph, ko) {
  const rr = (n) => n - 1 + (n % 2);
  let n = 0, prevQ = 0;
  ph.forEach((p, i) => {
    const groups = i === 0 ? (p.g ? p.g.map((g) => g.length) : p.split ? Array(p.split).fill(Math.ceil(p.t.length / p.split)) : [p.t.length]) : [prevQ + p.add.length];
    const tot = groups.reduce((x, y) => x + y, 0);
    if (p.play === 'rr') n += rr(tot);
    else if (p.play === 'rr2' || p.play === 'all2') n += 2 * rr(tot);
    else if (p.play === 'within') n += Math.max(...groups.map(rr));
    else if (p.play === 'within2') n += 2 * Math.max(...groups.map(rr));
    else if (p.play === 'pots') n += p.n;
    else if (p.play === 'cross') n += groups.length === 3 ? 8 : groups.length === 4 ? 3 * groups[0] : groups.length === 2 ? groups[0] : rr(tot);
    prevQ = p.q.top || groups.length * p.q.per + (p.q.best || 0);
  });
  return n + ko.reduce((x, k) => x + k.legs, 0);
}
function createStateChampionships(y) {
  const ed = stateEditions();
  if (!ed || S.zoeira) return;
  if (stateWindow(y)[0] <= S.date) return; // the career started after this year's state championships
  ensureStateClubs();
  for (const uf in ed) makeStateComp(uf, ed[uf], y);
}
function makeStateComp(uf, spec, y) {
  const [name, full] = UF_INFO[uf];
  const ids = (arr) => arr.map(stateClubId).filter((id) => id && S.teams[id]);
  const ph = spec.ph.map((p) => ({ play: p.play, n: p.n || 0, split: p.split || 0, label: p.label || '', q: p.q,
    g: p.g ? p.g.map(ids) : null, t: p.t ? ids(p.t) : null, add: p.add ? ids(p.add) : [] }));
  const all = uniq(ph.flatMap((p) => (p.g ? p.g.flat() : p.t || []).concat(p.add)));
  const ko = spec.ko.map(([n, legs, bye]) => ({ n, legs, bye: bye || 0 }));
  const slots = stateSlots(y, stateMatchdays(ph, ko));
  const c = newComp({ kind: 'groups', state: uf, key: 'EST' + uf, name, full, short: uf, zone: 'SA', season: String(y), year: y, teams: all,
    country: 'BRA', groups: [], koPlan: [], slots, si: 0, noET: 1, ph, ko, phase: -1, groupRounds: 0 });
  c.fmtNote = stateFormatNote(c);
  startStatePhase(c, 0, null);
  return c;
}
// splits clubs into n groups by strength (snake draft)
function snakeGroups(teams, n) {
  const sorted = teams.slice().sort(by((id) => teamRating(id) + rnd() * 3, -1));
  const g = Array.from({ length: n }, () => []);
  sorted.forEach((id, i) => { const r = Math.floor(i / n), k = i % n; g[r % 2 ? n - 1 - k : k].push(id); });
  return g;
}
function startStatePhase(c, idx, qualified) {
  const ph = c.ph[idx];
  let groups;
  if (idx === 0) groups = ph.g ? ph.g : ph.split ? snakeGroups(ph.t, ph.split) : [ph.t];
  else groups = [qualified.concat(ph.add)];
  if (c.groups.length) (c.oldGroups = c.oldGroups || []).push({ label: c.ph[c.phase].label || 'Primeira fase', groups: c.groups });
  const single = groups.length === 1;
  c.groups = groups.map((ts, gi) => ({ name: single ? (ph.label || 'Classificação') : String.fromCharCode(65 + gi), teams: ts.slice(), table: {} }));
  c.groupOf = {};
  c.groups.forEach((g, gi) => g.teams.forEach((t) => { c.groupOf[t] = gi; ensureRow(g.table, t); }));
  c.ptab = {};
  groups.flat().forEach((t) => ensureRow(c.ptab, t));
  c.phase = idx;
  c.phR0 = c.rounds.length;
  const rounds = statePairs(ph, groups);
  rounds.forEach((pairs, r) => {
    const base = Math.max(c.slots[c.si++] ?? c.rounds[c.rounds.length - 1].d + 4, S.date + 2);
    const rd = { name: `${!single || idx ? (ph.label ? ph.label + ' · ' : '') : ''}Rodada ${r + 1}`, d: base, m: [] };
    c.rounds.push(rd);
    pairs.forEach(([h, a], i) => {
      const day = weekday(base) === 0 && i % 2 ? base - 1 : base; // Sundays spread over the weekend
      const m = addMatch(c, c.rounds.length - 1, day, h, a, { idx: i, time: kickoffTime('SA', day, i) });
      m.ph = idx;
    });
  });
  c.phR1 = c.rounds.length;
  c.groupRounds = c.rounds.length;
}
// the pairs of every matchday of a phase
function statePairs(ph, groups) {
  const all = groups.flat();
  const balance = (rounds) => { // home and away as even as possible
    const home = {};
    all.forEach((t) => (home[t] = 0));
    rounds.forEach((pairs) => pairs.forEach((p) => { if (home[p[0]] > home[p[1]]) p.reverse(); home[p[0]]++; }));
    return rounds;
  };
  const within = (double) => {
    const per = groups.map((g) => roundRobin(shuffle(g.slice()), double));
    const n = Math.max(...per.map((r) => r.length));
    return Array.from({ length: n }, (_, r) => per.flatMap((rr) => rr[r] || []));
  };
  switch (ph.play) {
    case 'rr': return balance(roundRobin(shuffle(all.slice()), false));
    case 'rr2': case 'all2': return roundRobin(shuffle(all.slice()), true);
    case 'within': return within(false);
    case 'within2': return within(true);
    case 'pots': return balance(potRounds(all, ph.n || 8));
    case 'cross': return balance(crossRounds(groups.map((g) => shuffle(g.slice()))));
  }
  return roundRobin(all, false);
}
// every club plays the clubs of the other groups once
function crossRounds(groups) {
  const G = groups.length, n = groups[0].length;
  const equal = groups.every((g) => g.length === n);
  const shifts = (A, B) => Array.from({ length: n }, (_, r) => A.map((a, i) => [a, B[(i + r) % n]]));
  if (equal && G === 2) return shifts(groups[0], groups[1]);
  if (equal && G === 4) {
    const out = [];
    for (const [p, q, s, t] of [[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]]) {
      const x = shifts(groups[p], groups[q]), y = shifts(groups[s], groups[t]);
      x.forEach((pairs, r) => out.push(pairs.concat(y[r])));
    }
    return shuffle(out);
  }
  if (equal && G === 3 && n === 4) {
    const flat = groups.flat();
    return shuffle(CROSS_3X4.map((pairs) => pairs.map(([a, b]) => [flat[a], flat[b]])));
  }
  // fallback: a full round robin without the matches inside the groups
  const gOf = {};
  groups.forEach((g, gi) => g.forEach((t) => (gOf[t] = gi)));
  return roundRobin(shuffle(groups.flat()), false).map((pairs) => pairs.filter(([a, b]) => gOf[a] !== gOf[b])).filter((p) => p.length);
}
// n matchdays out of a full round robin, every club meeting each of the four pots about the same number of times
function potRounds(teams, n) {
  const sorted = teams.slice().sort(by((id) => teamRating(id), -1));
  const pot = {};
  sorted.forEach((t, i) => (pot[t] = Math.floor((i * 4) / sorted.length)));
  const per = n / 4;
  let best = null, bestScore = -1e9;
  for (let k = 0; k < 120; k++) {
    const rr = roundRobin(shuffle(teams.slice()), false);
    const rounds = shuffle(rr.map((_, i) => i)).slice(0, n).map((i) => rr[i]);
    const cnt = {};
    for (const pairs of rounds) for (const [a, b] of pairs) { cnt[a + ':' + pot[b]] = (cnt[a + ':' + pot[b]] || 0) + 1; cnt[b + ':' + pot[a]] = (cnt[b + ':' + pot[a]] || 0) + 1; }
    let score = 0;
    for (const t of teams) for (let p = 0; p < 4; p++) score -= Math.abs((cnt[t + ':' + p] || 0) - per);
    if (score > bestScore) { bestScore = score; best = rounds; }
  }
  return best.map((pairs) => pairs.map((p) => p.slice()));
}
function applySide(table, id, gf, ga) {
  const r = ensureRow(table, id);
  r.p++; r.gf += gf; r.ga += ga;
  if (gf > ga) { r.w++; r.pts += 3; } else if (gf === ga) { r.d++; r.pts++; } else r.l++;
}
// results of a state championship (called from recordResult)
function stateRecord(c, m) {
  if (m.tie) { cupAfterMatch(c, m); return; }
  if (m.ph !== c.phase) return;
  applyToTable(c.ptab, m);
  const gi = c.groupOf[m.h], gj = c.groupOf[m.a];
  if (gi === gj) applyToTable(c.groups[gi].table, m);
  else { applySide(c.groups[gi].table, m.h, m.hg, m.ag); applySide(c.groups[gj].table, m.a, m.ag, m.hg); }
  for (let r = c.phR0; r < c.phR1; r++) if (!c.rounds[r].m.every((id) => S.matches[id] && S.matches[id].done)) return;
  statePhaseDone(c);
}
function statePhaseDone(c) {
  const ph = c.ph[c.phase];
  const rankAll = sortTable(c.ptab, Object.keys(c.ptab).map(Number)).map((r) => r.id);
  let qual;
  if (ph.q.top) qual = rankAll.slice(0, ph.q.top);
  else {
    const tabs = c.groups.map((g) => sortTable(g.table, g.teams).map((r) => r.id));
    qual = tabs.flatMap((t) => t.slice(0, ph.q.per));
    if (ph.q.best) qual = qual.concat(sortTable(c.ptab, tabs.map((t) => t[ph.q.per]).filter(Boolean)).slice(0, ph.q.best).map((r) => r.id));
  }
  qual = rankAll.filter((id) => qual.includes(id)); // seeded by the phase table
  if (c.phase + 1 < c.ph.length) { startStatePhase(c, c.phase + 1, qual); return; }
  c.seedRank = {};
  qual.forEach((id, i) => (c.seedRank[id] = i + 1));
  c.koStarted = true;
  c.koi = 0;
  c.onStageDone = 'stateKO';
  c.alive = qual;
  c.byes = [];
  stateKORound(c);
}
// a knockout round: best remaining seed against the worst one; the better seed hosts the single match or the second leg
function stateKORound(c) {
  const step = c.ko[c.koi];
  let entrants = c.alive.concat(c.byes || []).sort((a, b) => c.seedRank[a] - c.seedRank[b]);
  c.byes = step.bye ? entrants.slice(0, step.bye) : [];
  entrants = entrants.slice(c.byes.length);
  c.alive = entrants.slice();
  const d1 = Math.max(c.slots[c.si++] ?? c.rounds[c.rounds.length - 1].d + 4, S.date + 2);
  const d2 = step.legs === 2 ? Math.max(c.slots[c.si++] ?? d1 + 4, d1 + 3) : 0;
  const rd = { name: step.n, d: d1, m: [], ties: [] };
  c.rounds.push(rd);
  const r = c.rounds.length - 1;
  for (let i = 0; i < entrants.length / 2; i++) {
    const a = entrants[i], b = entrants[entrants.length - 1 - i];
    const tieId = nextId('tie');
    const tie = { id: tieId, r, a, b, m: [], w: 0 };
    c.ties[tieId] = tie;
    rd.ties.push(tieId);
    if (step.legs === 2) {
      const m1 = addMatch(c, r, d1, b, a, { tie: tieId, leg: 1, idx: i, time: kickoffTime('SA', d1, i) });
      const m2 = addMatch(c, r, Math.max(d2, m1.d + 3), a, b, { tie: tieId, leg: 2, idx: i, time: kickoffTime('SA', d2, i) });
      tie.m = [m1.id, m2.id];
    } else {
      const m1 = addMatch(c, r, d1, a, b, { tie: tieId, idx: i, time: kickoffTime('SA', d1, i) });
      tie.m = [m1.id];
    }
  }
}
STAGE_HOOKS.stateKO = (c) => { c.koi++; stateKORound(c); };

// the format in words, for the competition screen
function stateFormatNote(c) {
  const playTxt = { rr: 'todos contra todos em turno único', rr2: 'todos contra todos em ida e volta', within: 'turno único dentro do grupo', within2: 'ida e volta dentro do grupo',
    all2: 'todos contra todos em ida e volta, com classificação por grupo', cross: 'cada time enfrenta os adversários dos outros grupos', pots: '' };
  const parts = c.ph.map((p, i) => {
    const ng = p.g ? p.g.length : p.split || 1;
    const n = (p.g ? p.g.flat() : p.t || []).length + p.add.length;
    let txt = p.play === 'pots' ? `${n || ''} clubes em tabela única, ${p.n} rodadas contra adversários sorteados de quatro potes` : `${ng > 1 ? `${ng} grupos, ` : ''}${playTxt[p.play]}`;
    if (i && p.add.length) txt = `${p.label || 'Segunda fase'}: ${p.add.map(teamName).join(' e ')} entram; ${txt}`;
    else if (p.label) txt = `${p.label}: ${txt}`;
    const q = p.q.top ? `${p.q.top} melhores avançam` : `${p.q.per === 1 ? 'o líder' : `os ${p.q.per} primeiros`} de cada grupo${p.q.best ? ` e ${p.q.best === 1 ? 'o melhor segundo colocado' : `os ${p.q.best} melhores seguintes`}` : ''} avançam`;
    return `${txt} · ${q}`;
  });
  const ko = c.ko.map((k) => `${k.n.toLowerCase()} ${k.legs === 2 ? 'em ida e volta' : 'em jogo único'}${k.bye ? ` (os ${k.bye} melhores entram na fase seguinte)` : ''}`).join(', ');
  return `${parts.join(' · ')} · Mata-mata: ${ko}; a melhor campanha decide em casa.`;
}

/* ---------------- Copinha (Copa São Paulo de Futebol Júnior): the clubs' under-20 sides in January ---------------- */
function createCopinha(y) {
  if (S.mode !== 'normal' || S.zoeira) return;
  const d0 = dayOf(y, 1, 2);
  if (d0 <= S.date) return;
  const pool = Object.values(S.teams).filter((t) => !t.isNat && !t.ext && t.c === 'BRA' && t.sq.length >= 11).map((t) => t.id);
  if (pool.length < 32) return;
  const G = pool.length >= 96 ? 32 : pool.length >= 48 ? 16 : 8;
  const teams = pool.sort(by((id) => teamRating(id) + rnd() * 5, -1)).slice(0, 4 * G);
  const groups = Array.from({ length: G }, () => []);
  teams.forEach((id, i) => { const r = Math.floor(i / G), k = i % G; groups[r % 2 ? G - 1 - k : k].push(id); });
  const c = newComp({ kind: 'youth', copinha: 1, key: 'COPINHA', name: 'Copinha', full: 'Copa São Paulo de Futebol Júnior', short: 'SUB-20', zone: 'SA', season: String(y), year: y, teams });
  c.groups = groups.map((ts, i) => ({ name: String(i + 1), teams: ts, table: {} }));
  c.ystr = {};
  teams.forEach((t) => { c.ystr[t] = clamp(teamRating(t) - 15 + rfloat(-6, 6), 30, 80); });
  const gd = [dayOf(y, 1, 2), dayOf(y, 1, 5), dayOf(y, 1, 8)];
  c.ym = [];
  c.groups.forEach((g, gi) => {
    g.teams.forEach((t) => ensureRow(g.table, t));
    roundRobin(g.teams.slice(), false).forEach((pairs, r) => pairs.forEach(([h, a]) => c.ym.push({ r, d: gd[r] + (gi % 2), h, a, hg: null, ag: null, g: gi })));
  });
  const nKO = Math.round(Math.log2(2 * G));
  c.koDates = [11, 14, 17, 20, 22, 25].slice(6 - nKO).map((d) => dayOf(y, 1, d));
  c.ko = [];
  c.rounds = [{ name: 'Fase de grupos', d: gd[0], m: [] }];
  const uid = S.user.team;
  if (uid && !S.coach.unemployed && teams.includes(uid)) {
    const gi = c.groups.findIndex((g) => g.teams.includes(uid));
    addInbox('scout', 'Categorias de base', 'Copinha: os garotos entram em campo', `${TA(uid)} disputa a Copa São Paulo de Futebol Júnior a partir de ${fmtDate(d0, 'long')}, no grupo ${gi + 1} (${c.groups[gi].teams.filter((t) => t !== uid).map(teamName).join(', ')}). A final é em 25 de janeiro. Quem joga a Copinha também evolui.`);
  }
  return c;
}
function copinhaKOName(size, c) {
  if (size > 16) return c.ko.length ? 'Terceira fase' : 'Segunda fase';
  return koName(size);
}
function youthGame(c, h, a) {
  const sh = youthStrength(c, h), sa = youthStrength(c, a);
  const xh = 1.25 * Math.exp(0.06 * (sh - sa)), xa = 1.15 * Math.exp(0.06 * (sa - sh));
  return [binomial(7, clamp(xh / 7, 0.02, 0.8)), binomial(7, clamp(xa / 7, 0.02, 0.8))];
}
function playCopinhaDay(c) {
  if (c.done) return;
  for (const m of c.ym) {
    if (m.d !== S.date || m.hg !== null) continue;
    [m.hg, m.ag] = youthGame(c, m.h, m.a);
    applyToTable(c.groups[m.g].table, m);
    copinhaUserStats(c, m.h, m.a, m.hg, m.ag);
  }
  if (!c.koStarted) {
    if (!c.ym.every((m) => m.hg !== null)) return;
    c.koStarted = true;
    const tabs = c.groups.map((g) => sortTable(g.table, g.teams).map((r) => r.id));
    const pairs = [];
    for (let i = 0; i < tabs.length; i += 2) { pairs.push([tabs[i][0], tabs[i + 1][1]]); pairs.push([tabs[i + 1][0], tabs[i][1]]); }
    c.ko.push({ name: copinhaKOName(pairs.length * 2, c), d: c.koDates[0], ties: pairs.map(([a, b]) => ({ a, b, hg: null, ag: null, pen: null, w: 0 })) });
    return;
  }
  const rd = c.ko[c.ko.length - 1];
  if (!rd || rd.d !== S.date) return;
  for (const t of rd.ties) {
    if (t.w) continue;
    [t.hg, t.ag] = youthGame(c, t.a, t.b);
    if (t.hg === t.ag) {
      const pa = 3 + binomial(2, 0.75), pb = 3 + binomial(2, 0.75);
      t.pen = pa === pb ? (rnd() < 0.5 ? [pa + 1, pb] : [pa, pb + 1]) : [pa, pb];
    }
    t.w = t.hg > t.ag || (t.pen && t.pen[0] > t.pen[1]) ? t.a : t.b;
    copinhaUserStats(c, t.a, t.b, t.hg, t.ag);
  }
  const winners = rd.ties.map((t) => t.w);
  if (winners.length === 1) { finishCopinha(c, winners[0], rd.ties[0].w === rd.ties[0].a ? rd.ties[0].b : rd.ties[0].a); return; }
  const pairs = [];
  for (let i = 0; i < winners.length; i += 2) pairs.push([winners[i], winners[i + 1]]);
  c.ko.push({ name: copinhaKOName(winners.length, c), d: c.koDates[c.ko.length], ties: pairs.map(([a, b]) => ({ a, b, hg: null, ag: null, pen: null, w: 0 })) });
}
// the user's academy players: appearances (they count for development) and goals
function copinhaUserStats(c, h, a, hg, ag) {
  const uid = S.user.team;
  if (!uid || S.coach.unemployed || (h !== uid && a !== uid)) return;
  const ys = S.youth.squad.map((id) => S.players[id]).filter(Boolean).sort(by((p) => p.o, -1)).slice(0, 14);
  if (ys.length < 8) return;
  const goals = h === uid ? hg : ag;
  const w = { ST: 5, LW: 3, RW: 3, CAM: 3, LM: 2, RM: 2, CM: 1.5, CDM: 0.7, LB: 0.5, RB: 0.5, CB: 0.6, GK: 0 };
  for (const p of ys) {
    const row = ((p.st = p.st || {})[c.id] = (p.st[c.id] || [0, 0, 0, 0, 0, uid, 0]));
    row[0]++;
    p.ay = (p.ay || 0) + 1; p.aq = (p.aq || 0) + 1;
  }
  for (let g = 0; g < goals; g++) {
    const p = weighted(ys, (x) => (w[x.p] ?? 1) * Math.pow(Math.max(30, x.a ? x.a[1] : x.o) / 60, 2));
    if (p) { p.st[c.id][1]++; p.car = p.car || [0, 0, 0]; }
  }
}
function finishCopinha(c, ch, ru) {
  c.done = true;
  c.champion = ch;
  S.hist.push({ key: 'COPINHA', name: 'Copinha', season: c.season, year: c.year, ch, ru, chN: teamName(ch), ruN: teamName(ru), ts: null });
  (S.titles[ch] = S.titles[ch] || []).push({ key: 'COPINHA', name: 'Copinha', season: c.season });
  if (S.presim) return;
  const uid = S.user.team;
  if (uid && !S.coach.unemployed && ch === uid) {
    const coins = futcoinsFor('COPINHA');
    S.coach.trophies.push({ key: 'COPINHA', name: 'Copinha', season: c.season, team: uid, teamN: teamName(uid), coins, d: S.date });
    if (coins) awardFutcoins(coins, `Copinha ${c.season}`);
    S.board.conf = clamp(S.board.conf + 4, 0, 100);
    addInbox('board', 'Diretoria', 'Campeões da Copinha!', `Os garotos ${tA(uid, 'do')} venceram ${tA(ru)} na final e conquistaram a Copa São Paulo de Futebol Júnior ${c.season}. A diretoria está orgulhosa da base.`);
    addNews(`${teamName(uid)} é campeão da Copinha`, `A garotada ${tA(uid, 'do')} bate ${tA(ru)} na final e levanta a Copa São Paulo de Futebol Júnior ${c.season}.`, 'titulo', [uid], { cat: 'Base', hot: true });
  } else if (userLeagueCountry() === 'BRA') {
    addNews(`${teamName(ch)} conquista a Copinha`, `${TA(ch)} vence ${tA(ru)} na final da Copa São Paulo de Futebol Júnior ${c.season} e revela uma nova geração.`, 'titulo', [ch, ru], { cat: 'Base' });
  }
}

/* ===================== position change (like EA FC's player development) ===================== */
// The coach picks a new position; the player trains it for a time that depends on how close the two positions are
// (a winger to the other wing in two weeks, a midfielder to centre-back in two months). Meanwhile he gets better in
// the new position little by little; at the end it becomes his position, the old one stays as a secondary one and
// the overall is recalculated from his attributes (like the game does when a position changes).

// outfield attributes: pace, shooting, passing, dribbling, defending, physical
const POS_WEIGHTS = {
  ST: [0.2, 0.4, 0.05, 0.2, 0, 0.15], RW: [0.3, 0.2, 0.15, 0.3, 0, 0.05], LW: [0.3, 0.2, 0.15, 0.3, 0, 0.05],
  RM: [0.25, 0.1, 0.25, 0.3, 0.05, 0.05], LM: [0.25, 0.1, 0.25, 0.3, 0.05, 0.05], CAM: [0.1, 0.2, 0.35, 0.3, 0, 0.05],
  CM: [0.05, 0.1, 0.4, 0.2, 0.15, 0.1], CDM: [0.05, 0, 0.25, 0.1, 0.4, 0.2], RB: [0.25, 0, 0.15, 0.1, 0.35, 0.15],
  LB: [0.25, 0, 0.15, 0.1, 0.35, 0.15], CB: [0.1, 0, 0.05, 0, 0.6, 0.25],
};
const posSimilarity = (from, to) => (COMPAT[to] && COMPAT[to][from]) || 0.68;
function posAttrRating(p, pos) {
  const w = POS_WEIGHTS[pos];
  if (!w || !p.a || p.a.length < 6 || p.p === 'GK') return null;
  return w.reduce((s, x, i) => s + x * p.a[i], 0);
}
// days of training for a change (younger players learn faster); a secondary position only needs a week
function posChangeDays(p, to) {
  if (p.alt && p.alt.split(',').includes(to)) return 7;
  const c = posSimilarity(p.p, to);
  const base = c >= 0.95 ? 14 : c >= 0.9 ? 28 : c >= 0.86 ? 42 : c >= 0.8 ? 63 : 90;
  return Math.round(base * (p.age <= 21 ? 0.8 : p.age >= 30 ? 1.25 : 1));
}
// overall in the new position once the change is complete
function posChangeOvr(p, to) {
  const c = posSimilarity(p.p, to);
  const a = posAttrRating(p, to), b = posAttrRating(p, p.p);
  const low = -Math.round((1 - c) * 40);
  const d = a !== null && b !== null ? clamp(Math.round(a - b), low, 3) : -Math.round((1 - c) * 20);
  const sec = p.alt && p.alt.split(',').includes(to);
  return clamp(p.o + (sec ? Math.max(d, -1) : d), 30, 99);
}
const posChangeLabel = (c) => (c >= 0.95 ? 'muito parecida' : c >= 0.88 ? 'parecida' : c >= 0.8 ? 'diferente' : 'muito diferente');
function posChangeProgress(p) {
  const pc = p.pc;
  if (!pc) return 0;
  return clamp((S.date - pc.d0) / Math.max(1, pc.days), 0, 1);
}
// fit for the position being trained: from the natural similarity towards a secondary position as he learns it
function posTrainFit(pl, slotPos, base) {
  if (!pl.pc || pl.pc.to !== slotPos) return base;
  return Math.max(base, base + (0.97 - base) * posChangeProgress(pl));
}
function startPosChange(p, to) {
  if (!POSITIONS.includes(to) || to === p.p) return { ok: false, msg: 'Escolha outra posição.' };
  if ((to === 'GK') !== (p.p === 'GK')) return { ok: false, msg: 'Goleiro não troca de posição com jogador de linha.' };
  const days = posChangeDays(p, to);
  p.pc = { to, from: p.p, d0: S.date, days, o: posChangeOvr(p, to) };
  S.pt = uniq((S.pt || []).concat(p.id));
  return { ok: true, msg: `${p.n} começou a treinar como ${POS_LONG[to].toLowerCase()}: cerca de ${weeksTxt(days)}.` };
}
function cancelPosChange(p) {
  p.pc = null;
  S.pt = (S.pt || []).filter((x) => x !== p.id);
}
const weeksTxt = (days) => (days <= 7 ? '1 semana' : `${Math.round(days / 7)} semanas`);
// daily: changes that are complete
function posChangeDaily() {
  if (!S.pt || !S.pt.length) return;
  for (const id of S.pt.slice()) {
    const p = S.players[id];
    if (!p || !p.pc) { S.pt = S.pt.filter((x) => x !== id); continue; }
    if (S.date < p.pc.d0 + p.pc.days) continue;
    const { to, from } = p.pc;
    const o0 = p.o;
    const o1 = posChangeOvr(p, to); // with the attributes of today
    const alt = (p.alt ? p.alt.split(',') : []).filter((x) => x && x !== to && x !== from);
    p.alt = [from].concat(alt).slice(0, 3).join(',');
    p.p = to;
    p.o = o1;
    p.pot = Math.max(p.o, p.pot + (o1 - o0));
    p.pc = null;
    S.pt = S.pt.filter((x) => x !== id);
    if (isUserTeam(p.t) || (p.loan && isUserTeam(p.loan.from)))
      addInbox('info', 'Comissão técnica', `${p.n} agora é ${POS_LONG[to].toLowerCase()}`,
        `${p.n} concluiu o treino de posição: agora joga como ${POS_LONG[to].toLowerCase()} (overall ${o0} → ${p.o}) e ainda pode atuar como ${POS_LONG[from].toLowerCase()}.`);
  }
}

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
function trophySVG(key, size = 70) {
  const gold = key === 'YOUTH' ? '#c9d3da' : '#ffc54d';
  const big = ['UCL', 'WC', 'UL1', 'LIB', 'EURO', 'COPA', 'MUN'].includes(key);
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" class="tsvg" aria-hidden="true">
    <defs><linearGradient id="tg${key}" x1="0" x2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset="0.45" stop-color="${gold}"/><stop offset="1" stop-color="#a86f12"/></linearGradient></defs>
    <path d="M30 14 H70 V${big ? 40 : 34} C70 ${big ? 56 : 50} 60 62 50 62 C40 62 30 ${big ? 56 : 50} 30 ${big ? 40 : 34}Z" fill="url(#tg${key})"/>
    ${big ? '<path d="M30 20 C14 20 14 44 33 46" stroke="url(#tg' + key + ')" stroke-width="5" fill="none"/><path d="M70 20 C86 20 86 44 67 46" stroke="url(#tg' + key + ')" stroke-width="5" fill="none"/>' : '<path d="M30 18 C18 18 20 36 32 38" stroke="url(#tg' + key + ')" stroke-width="4" fill="none"/><path d="M70 18 C82 18 80 36 68 38" stroke="url(#tg' + key + ')" stroke-width="4" fill="none"/>'}
    <rect x="45" y="61" width="10" height="14" fill="url(#tg${key})"/><path d="M34 76 H66 L70 88 H30Z" fill="url(#tg${key})"/><rect x="28" y="88" width="44" height="6" rx="2" fill="#3a2a10"/></svg>`;
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

/* ===================== start screen, wizard, store ===================== */
let STORE = [];
let SAVES = [];
const ERA_INFO = {
  2016: { t: '2016', d: 'Temporada 2016/17 com os elencos da época (base FIFA 17). Leicester campeão inglês, Neymar no Barça, Gabriel Jesus no Palmeiras.' },
  2021: { t: '2021', d: 'Temporada 2021/22 com os elencos da época (base FIFA 22). Messi chegando ao PSG, Hulk no Galo, Eurocopa e Copa América no meio do ano.' },
  2026: { t: '2026', d: 'Temporada 2026/27 com elencos atualizados (base FC 27, out/2026). Copa do Mundo 2026 para quem escolher seleção.' },
};

async function loadEra(era) {
  if (DATA && DATA.era === era) return DATA;
  const r = await fetch(`data/era${era}.json`);
  if (!r.ok) throw new Error('Não foi possível carregar os dados de ' + era);
  DATA = await r.json();
  return DATA;
}
async function loadStore() {
  if (STORE.length) return STORE;
  try { const r = await fetch('data/store.json'); STORE = await r.json(); } catch (e) { STORE = []; }
  return STORE;
}

function viewLoading() {
  const p = UI.loadP || 0;
  return `<div class="boot"><div class="boot-logo">ULTRA<span>MANAGER</span></div>
    <div class="boot-sub">${esc(UI.loadMsg || 'Carregando…')}</div>
    <div style="width:min(360px,80vw);height:6px;border-radius:3px;background:var(--panel3);margin:16px auto 0;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(p * 100)}%;background:var(--accent-hi)"></i></div></div>`;
}
function setLoading(msg, p) {
  UI.loadMsg = msg; UI.loadP = p;
  if (UI.screen !== 'loading') { UI.screen = 'loading'; render(); return; }
  const el = $('.boot-sub'); if (el) el.textContent = msg;
  const bar = $('.boot i'); if (bar) bar.style.width = Math.round((p || 0) * 100) + '%';
}

// ------------------------------------------------------------------ start
function viewStart() {
  const has = SAVES.length > 0;
  return `<div class="start">
    <div class="start-top"><div class="row"><div class="logo-mark">UM</div><span class="disp" style="font-size:20px;font-weight:700">ULTRA MANAGER</span></div>
      <div class="row">${coinPill()}<span class="chip">${WALLET.owned.length} ${WALLET.owned.length === 1 ? 'time' : 'times'}</span></div></div>
    <div class="start-main">
      <div>
        <div class="title-xl">ULTRA<span class="b">MANAGER</span></div>
        <p class="muted" style="max-width:52ch;font-size:17px;margin-top:18px">Modo carreira com calendário real, Ultra Liga de 4 divisões, ligas nacionais, Champions, Libertadores, Copa do Mundo e partidas que você pode jogar no gramado.</p>
        <div class="row wrap" style="margin-top:14px"><span class="chip">Elencos 2016 · 2021 · 2026</span><span class="chip">38 rodadas</span><span class="chip">Seleções</span><span class="chip">Modo zoeira</span></div>
      </div>
      <div class="menu-list">
        <button class="menu-btn primary" data-a="newCareer"><span class="ic">⚽</span><span>Nova carreira<small>Crie seu treinador e escolha a proposta</small></span></button>
        ${has ? `<button class="menu-btn" data-a="openSaves"><span class="ic">▶</span><span>Continuar<small>${SAVES.length} ${SAVES.length === 1 ? 'save salvo' : 'saves salvos'} · último: ${esc(SAVES[0].team)}</small></span></button>` : ''}
        <button class="menu-btn" data-a="openFriendly"><span class="ic">🎮</span><span>Amistoso<small>Partida 2D contra o computador com qualquer time do jogo</small></span></button>
        <button class="menu-btn" data-a="openStore"><span class="ic">🛒</span><span>Comprar times<small>${INFINITE_COINS ? 'FutCoins infinitas: escolha qualquer clube' : 'Use FutCoins ganhos em títulos'}</small></span></button>
        <button class="menu-btn" data-a="openCrests"><span class="ic">🛡</span><span>Escudos dos times<small>Troque por imagens suas, uma a uma ou em lote</small></span></button>
        <label class="menu-btn" style="cursor:pointer"><span class="ic">⤓</span><span>Importar save<small>Arquivo .json exportado antes</small></span><input type="file" accept=".umsave,.json,.gz,application/json" data-a="importSave" class="hide"></label>
        <button class="menu-btn" data-a="howTo"><span class="ic">?</span><span>Como jogar<small>Controles da partida e dicas</small></span></button>
      </div>
    </div>
    <div class="center dim" style="padding:14px;font-size:12px">Escudos gerados são ilustrações originais; troque o de qualquer time por uma imagem sua em Escudos dos times, na loja ou na ficha do clube. Dados de jogadores: FC 27/FC 26, FIFA 22 e FIFA 17; elencos brasileiros montados a partir de conhecimento público.</div>
  </div>`;
}
act('newCareer', () => {
  UI.wiz = { step: 0, name: '', age: 38, fav: '', era: 2026, kind: 'club', mode: 'ultra', zoeira: false, noFire: false };
  UI.screen = 'wizard'; render();
});
act('openSaves', () => {
  openModal(() => modalShell('Continuar carreira', SAVES.length ? `<div class="col">${SAVES.map((s) => `
    <div class="row panel" style="padding:12px">
      ${crest({ id: s.teamId, key: s.key || s.short + s.team, n: s.team, s: s.short, c1: s.c1, c2: s.c2 }, 40)}
      <div class="grow"><div style="font-weight:700">${esc(s.team)} · ${esc(s.coach)}</div>
      <div class="muted" style="font-size:13px">${fmtDate(s.date, 'long')} · ${s.mode === 'ultra' ? 'Ultra Liga' : s.mode === 'normal' ? 'Ligas normais' : 'Seleção'} ${s.era}${s.zoeira ? ' · zoeira' : ''} · ${s.rec.w}V ${s.rec.d}E ${s.rec.l}D · ${s.trophies} títulos</div></div>
      <button class="btn sm primary" data-a="loadSave" data-k="${s.key}">Carregar</button>
      <button class="btn sm danger" data-a="askDeleteSave" data-k="${s.key}" aria-label="Apagar">Apagar</button>
    </div>`).join('')}</div>` : '<div class="empty">Nenhum save ainda.</div>'));
});
act('askDeleteSave', (el) => {
  const k = el.dataset.k;
  openModal(modalShell('Apagar save?', '<p>Esta ação não pode ser desfeita.</p>', `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="deleteSave" data-k="${k}">Apagar</button>`), { size: 'narrow' });
});
act('deleteSave', async (el) => {
  await deleteSave(el.dataset.k);
  SAVES = await listSaves();
  closeAllModals();
  render();
  toast('Save apagado.');
});
act('loadSave', async (el) => {
  closeAllModals();
  setLoading('Carregando save…', 0.2);
  try {
    const obj = await loadSaveData(el.dataset.k);
    if (!obj) throw new Error('Save não encontrado.');
    adoptState(obj);
    await loadEra(S.era).catch(() => null);
    importNewClubs(); // careers from before the Sul-Americana and the Mundial de Clubes
    importNewLeagues(); // … and before the Conference League and the new leagues
    UI.screen = 'career'; UI.tab = 'central';
    render();
    toast('Carreira carregada.');
  } catch (e) { UI.screen = 'start'; render(); toast(e.message, true); }
});
act('importSave', async (el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  setLoading('Importando save…', 0.3);
  try {
    const obj = await importSaveFile(f);
    adoptState(obj);
    await loadEra(S.era).catch(() => null);
    importNewClubs();
    importNewLeagues();
    await saveGame(S.id);
    SAVES = await listSaves();
    UI.screen = 'career'; UI.tab = 'central';
    render();
    toast('Save importado.');
  } catch (e) { UI.screen = 'start'; render(); toast('Não foi possível importar: ' + e.message, true); }
});
act('howTo', () => {
  openModal(modalShell('Como jogar', `
    <div class="col">
      <p><b>Avançar</b> passa os dias no calendário real. No dia do jogo aparece <b>Ir para a partida</b>, com escalações, banco, horário e clima.</p>
      <p>Na partida você escolhe: <b>Simular</b> (resultado direto), <b>Minuto a minuto</b> (cronômetro de 1 a 45+ e 46 a 90+, com substituições) ou <b>Jogar</b> no gramado.</p>
      <h3 style="font-size:20px">Controles da partida jogável</h3>
      <p class="help-keys">Teclado: <span class="kbd">WASD</span>/<span class="kbd">setas</span> mover · <span class="kbd">J</span> passe · <span class="kbd">K</span> chute (segure para mais força) · <span class="kbd">L</span> lançamento · <span class="kbd">Shift</span> correr · <span class="kbd">J</span> sem a bola: trocar jogador · <span class="kbd">K</span> sem a bola: carrinho.</p>
      <p class="help-keys">Toque: joystick à esquerda, botões PASSE, CHUTE, LANÇAR e CORRER à direita.</p>
      <h3 style="font-size:20px">FutCoins</h3>
      <p class="muted">${INFINITE_COINS ? 'As FutCoins estão infinitas para todos: compre quantos times quiser na loja e comece a carreira (ou a próxima temporada) em qualquer um deles. Os títulos continuam mostrando quanto renderiam (Ultra Liga 150, Champions 100, Copa do Mundo 125, liga nacional 80, copa nacional 75…).' : 'Cada título rende FutCoins (Ultra Liga 150, Champions 100, Copa do Mundo 125, liga nacional 80, copa nacional 75…). Use para comprar qualquer time e começar nele.'}</p>
    </div>`, '<button class="btn primary" data-a="closeModal">Entendi</button>'));
});

// ------------------------------------------------------------------ store
function storeRows(filter) {
  const q = strip(filter || '');
  return STORE.filter((t) => !q || strip(t[1]).includes(q));
}
act('openStore', async () => {
  await loadStore();
  UI.storeQ = '';
  openModal(() => {
    const rows = storeRows(UI.storeQ).slice(0, 120);
    return modalShell('Comprar times', `
      <div class="row wrap" style="margin-bottom:12px">${coinPill()}<input class="input grow" placeholder="Buscar time…" value="${esc(UI.storeQ)}" data-a="storeSearch" data-live="1" id="store-q"></div>
      <p class="muted" style="margin-top:0">Times comprados aparecem em <b>Meus times</b> na tela de propostas e no fim de cada temporada. Toque no escudo de um time para trocar por uma imagem sua.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Time</th><th>País</th><th class="n">Força</th><th class="n">Preço</th><th></th></tr></thead><tbody>
      ${rows.map((t) => {
        const price = teamPriceByRating(t[6]);
        const owned = WALLET.owned.includes(t[0]);
        return `<tr><td><span class="team-cell"><button class="crest-btn sm" data-a="crestEdit" data-k="${esc(t[0])}" title="Trocar o escudo" aria-label="Trocar o escudo do ${esc(t[1])}">${crest({ id: 0, key: t[0], n: t[1], s: t[2], c1: t[4], c2: t[5] }, 24)}</button><span class="tn">${esc(t[1])}</span></span></td>
          <td class="muted">${esc(t[3] === 'ULT' ? '—' : t[3])}</td><td class="n">${t[6].toFixed(1)}</td>
          <td class="n"><span class="coin-pill" style="padding:2px 8px 2px 4px;font-size:14px"><span class="coin">F</span>${price}</span></td>
          <td class="n">${owned ? '<span class="chip on">Seu</span>' : `<button class="btn xs ${canAfford(price) ? 'gold' : ''}" data-a="buyTeam" data-k="${t[0]}" data-p="${price}" ${canAfford(price) ? '' : 'disabled'}>Comprar</button>`}</td></tr>`;
      }).join('')}</tbody></table></div>`, '<button class="btn" data-a="closeModal">Fechar</button>');
  }, { size: 'wide' });
});
act('storeSearch', (el) => {
  UI.storeQ = el.value;
  const pos = el.selectionStart;
  refreshModal();
  const inp = $('#store-q'); if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); }
});
act('buyTeam', (el) => {
  const err = buyTeam(el.dataset.k, +el.dataset.p);
  if (err) toast(err, true); else toast('Time comprado! Ele estará disponível em "Meus times".');
  refreshModal();
  if (UI.screen === 'start' || UI.screen === 'wizard') { const keep = MODALS.length; render(); }
});

// ------------------------------------------------------------------ wizard
const WIZ_STEPS = ['Treinador', 'Ano', 'Clube ou seleção', 'Modo', 'Opções', 'Propostas'];
function viewWizard() {
  const w = UI.wiz;
  const steps = WIZ_STEPS.map((_, i) => `<span class="${i <= w.step ? 'on' : ''}"></span>`).join('');
  let body = '';
  if (w.step === 0) {
    const favList = STORE.map((t) => `<option value="${esc(t[1])}">`).join('');
    body = `<h1 style="font-size:46px;font-weight:800">Crie seu treinador</h1>
      <p class="muted">Seu nome aparece nas notícias, no histórico e na galeria de títulos.</p>
      <form class="grid g3" data-a="wizNext" style="margin-top:18px">
        <div class="field"><label for="w-name">Nome do treinador</label><input id="w-name" class="input" required maxlength="40" value="${esc(w.name)}" placeholder="Ex.: Renato Moreira"></div>
        <div class="field"><label for="w-fav">Time do coração</label><input id="w-fav" class="input" list="fav-list" value="${esc(w.fav)}" placeholder="Ex.: Corinthians"><datalist id="fav-list">${favList}</datalist></div>
        <div class="field"><label for="w-age">Idade</label><input id="w-age" class="input" type="number" min="25" max="80" value="${w.age}"></div>
        <div style="grid-column:1/-1" class="row"><button class="btn" type="button" data-a="wizBack">Voltar</button><button class="btn primary right" type="submit">Continuar</button></div>
      </form>`;
  } else if (w.step === 1) {
    body = `<h1 style="font-size:46px;font-weight:800">Em que ano você quer começar?</h1><p class="muted">Os elencos, idades e forças correspondem à época escolhida.</p>
      <div class="choice-grid" style="margin-top:16px">${[2016, 2021, 2026].map((y) => `<button class="choice ${w.era === y ? 'on' : ''}" data-a="wizSet" data-k="era" data-v="${y}"><span class="t">${ERA_INFO[y].t}</span><span class="d">${ERA_INFO[y].d}</span></button>`).join('')}</div>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button><button class="btn primary right" data-a="wizNext">Continuar</button></div>`;
  } else if (w.step === 2) {
    body = `<h1 style="font-size:46px;font-weight:800">Clube ou seleção?</h1>
      <div class="choice-grid" style="margin-top:16px">
        <button class="choice ${w.kind === 'club' ? 'on' : ''}" data-a="wizSet" data-k="kind" data-v="club"><span class="t">Clube</span><span class="d">Ultra Liga ou ligas nacionais, copas, Champions, Europa League e Libertadores.</span></button>
        <button class="choice ${w.kind === 'national' ? 'on' : ''}" data-a="wizSet" data-k="kind" data-v="national"><span class="t">Seleção</span><span class="d">${w.era === 2026 ? 'Assuma uma das 48 seleções da Copa de 2026 e dispute o Mundial.' : w.era === 2021 ? 'Comece com a Eurocopa e a Copa América de 2021.' : 'Comece com a Eurocopa e a Copa América de 2016.'} Depois vêm eliminatórias, Euro, Copa América e Copa do Mundo com 48 seleções.</span></button>
      </div>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button><button class="btn primary right" data-a="wizNext">Continuar</button></div>`;
  } else if (w.step === 3) {
    body = `<h1 style="font-size:46px;font-weight:800">Escolha o modo</h1>
      <div class="choice-grid" style="margin-top:16px">
        <button class="choice ${w.mode === 'ultra' ? 'on' : ''}" data-a="wizSet" data-k="mode" data-v="ultra"><span class="t">Ultra Liga</span><span class="d">Superliga mundial com 4 divisões de 20 times, 3 sobem e 3 caem, banco de times e Copa Ultra.</span></button>
        <button class="choice ${w.mode === 'normal' ? 'on' : ''}" data-a="wizSet" data-k="mode" data-v="normal"><span class="t">Ligas normais</span><span class="d">Premier League, LaLiga, Bundesliga, Ligue 1, Serie A, Brasileirão, Argentina, Portugal e Holanda, com segundas divisões, copas e torneios continentais.</span></button>
      </div>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button><button class="btn primary right" data-a="wizNext">Continuar</button></div>`;
  } else if (w.step === 4) {
    body = `<h1 style="font-size:46px;font-weight:800">Opções da carreira</h1>
      <div class="panel" style="margin-top:16px">
        <label class="toggle"><input type="checkbox" data-a="wizToggle" data-k="zoeira" ${w.zoeira ? 'checked' : ''}><span class="sw"></span><span><b>Modo zoeira</b><br><span class="muted" style="font-size:14px">Uma vez por temporada um jogador de cada time vira 99, alienígenas abduzem jogadores durante as partidas, ninguém é rebaixado (a primeira divisão cresce até ~80 times), jogadores nunca se aposentam e o overall continua subindo de 1 a 10 por temporada (passa de 99). Sem academia neste modo.</span></span></label>
      </div>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button><button class="btn primary right" data-a="wizNext">Ver propostas</button></div>`;
  } else {
    body = viewOffers();
  }
  return `<div class="start-top"><div class="row"><div class="logo-mark">UM</div><span class="disp" style="font-size:20px;font-weight:700">NOVA CARREIRA</span></div>${coinPill()}</div>
    <div class="wizard"><div class="steps">${steps}</div><div class="muted up" style="font-size:12px;margin-bottom:6px">Passo ${w.step + 1} de ${WIZ_STEPS.length} · ${WIZ_STEPS[w.step]}</div>${body}</div>`;
}
function viewOffers() {
  const w = UI.wiz;
  if (!w.offers) return '<div class="empty">Preparando propostas…</div>';
  const isNat = w.kind === 'national';
  const owned = WALLET.owned.filter((k) => S && Object.values(S.teams).some((t) => t.key === k && validCareerTeam(t.id)));
  const card = (o) => {
    const t = S.teams[o.team];
    const r = t.isNat ? nationRating(t.code) : teamRating(t.id);
    let where = '';
    if (S.mode === 'ultra') where = o.div === 'bank' ? 'Banco de times (entra na Ultra Liga 3)' : 'Ultra Liga 3';
    else if (S.mode === 'normal') { const lg = S.normal.find((l) => l.id === o.league); where = lg ? lg.name : ''; }
    else where = 'Copa do Mundo';
    return `<button class="offer" data-a="pickOffer" data-id="${t.id}">
      <div class="row">${crest(t, 54)}<div class="grow"><div class="tn">${esc(t.n)}</div><div class="muted" style="font-size:13px;margin-top:4px">${esc(where)}</div></div></div>
      <div class="row">${starStr(r)}<span class="muted" style="font-size:13px">Força ${r.toFixed(1)}</span>${!t.isNat ? `<span class="muted right" style="font-size:13px">Orçamento ${money(t.budget)}</span>` : ''}</div>
      <span class="btn sm primary" style="align-self:flex-start">Aceitar proposta</span></button>`;
  };
  return `<h1 style="font-size:46px;font-weight:800">${isNat ? 'Propostas de seleções' : 'Você recebeu propostas'}</h1>
    <p class="muted">${isNat ? 'Três seleções mais modestas da Copa querem você.' : S.mode === 'ultra' ? 'Três clubes da Ultra Liga 3 (ou do banco de times) querem você.' : 'Um clube de cada liga quer você. Escolha onde começar.'}</p>
    <div class="choice-grid" style="margin-top:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">${w.offers.map(card).join('')}</div>
    <div class="row wrap" style="margin-top:16px">
      <button class="btn ${w.noFire ? 'gold' : ''}" data-a="wizToggleNoFire">${w.noFire ? '✓ ' : ''}Sem demissão</button>
      <span class="muted" style="font-size:13px">${w.noFire ? 'A diretoria nunca vai te demitir nesta carreira.' : 'Ative para jogar sem risco de demissão.'}</span>
      <span class="grow"></span>
      <button class="btn" data-a="openStore">🛒 Comprar times</button>
      <button class="btn" data-a="wizReroll">Outras propostas</button>
    </div>
    ${owned.length ? `<div class="panel" style="margin-top:16px"><h3>Meus times <span class="sub">comprados com FutCoins</span></h3><div class="row wrap">${owned.map((k) => {
      const t = Object.values(S.teams).find((x) => x.key === k);
      return `<button class="btn" data-a="pickOffer" data-id="${t.id}">${crest(t, 22)} ${esc(t.n)}</button>`;
    }).join('')}</div></div>` : (WALLET.owned.length ? '<p class="muted" style="font-size:13px">Seus times comprados não existem neste ano/modo.</p>' : '')}
    ${viewAnyClub()}
    <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button></div>`;
}

// ------------------------------------------------------------------ free choice of any club (with search)
const ULTRA_DIV_NAMES = ['Ultra Liga', 'Ultra Liga 2', 'Ultra Liga 3', 'Ultra Liga 4'];
function anyClubEntries() {
  const w = UI.wiz;
  if (w.anyList && w.anyList.world === S) return w.anyList.rows;
  const rows = [];
  if (S.mode === 'ultra') {
    S.ultra.div.forEach((d, i) => d.forEach((id) => rows.push({ id, grp: 'UL' + (i + 1), where: ULTRA_DIV_NAMES[i] })));
    S.ultra.bank.forEach((id) => rows.push({ id, grp: 'BANK', where: 'Banco de times · entra na Ultra Liga 3' }));
  } else if (S.mode === 'normal') {
    for (const lg of S.normal) {
      lg.teams.forEach((id) => rows.push({ id, grp: lg.id, where: lg.name }));
      if (lg.bank.length >= 2) lg.bank.forEach((id) => rows.push({ id, grp: lg.id + '2', where: LEAGUE_NAMES2[lg.id] || `${lg.name} · 2ª divisão` }));
    }
  } else {
    const opening = new Set(nationalOpeningCodes());
    for (const code of (S.wcPool || [])) {
      const n = S.nations[code];
      if (!n || !n.tid) continue;
      rows.push({ id: n.tid, grp: n.conf || 'Outras', where: `${n.conf || ''}${opening.has(code) ? (S.era === 2026 ? ' · na Copa 2026' : ' · na Euro/Copa América') : ''}` });
    }
  }
  for (const r of rows) {
    const t = S.teams[r.id];
    r.q = strip(`${t.n} ${t.s || ''} ${r.where}`);
    r.r = t.isNat ? nationRating(t.code) : teamRating(t.id);
  }
  rows.sort((a, b) => b.r - a.r);
  w.anyList = { world: S, rows };
  return rows;
}
// normal mode: the leagues grouped by region (main leagues, other European leagues, South America)
const ANY_REGIONS = [['main', 'Principais'], ['eu', 'Europa'], ['sa', 'América do Sul']];
function anyRegionOf(g) {
  const lg = S.normal && S.normal.find((l) => l.id === g || l.id + '2' === g);
  if (!lg) return '';
  return MAIN_LEAGUES.has(lg.id) ? 'main' : lg.conf === 'CONMEBOL' ? 'sa' : 'eu';
}
function anyGroupLabel(g) {
  if (g === 'all') return 'Todos';
  const reg = ANY_REGIONS.find(([k]) => k === g);
  if (reg) return reg[1];
  if (S.mode === 'ultra') return g === 'BANK' ? 'Banco' : ULTRA_DIV_NAMES[+g.slice(2) - 1];
  if (S.mode === 'normal') {
    const lg = S.normal.find((l) => l.id === g || l.id + '2' === g);
    if (!lg) return g;
    return g === lg.id ? lg.name : (LEAGUE_NAMES2[lg.id] || `${lg.name} 2`);
  }
  return g;
}
function viewAnyClub() {
  const w = UI.wiz;
  const isNat = S.mode === 'national';
  const rows = anyClubEntries();
  const present = new Set(rows.map((r) => r.grp));
  const order = S.mode === 'ultra' ? ['UL1', 'UL2', 'UL3', 'UL4', 'BANK']
    : S.mode === 'normal' ? S.normal.flatMap((lg) => [lg.id, lg.id + '2'])
      : ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
  const groups = order.filter((x) => present.has(x)).concat([...present].filter((x) => !order.includes(x)));
  const g = w.anyG || 'all';
  if (S.mode === 'normal') return viewAnyClubNormal(rows, groups, g);
  return `<div class="panel" style="margin-top:18px">
    <div class="row wrap" style="margin-bottom:10px"><h3 class="grow" style="font-size:24px;margin:0">${isNat ? 'Ou escolha qualquer seleção' : 'Ou escolha qualquer clube'}</h3><span class="muted" style="font-size:13px">${rows.length} ${isNat ? 'seleções' : 'clubes'}</span></div>
    <input id="any-q" class="input" style="width:100%;margin-bottom:10px" type="search" placeholder="${isNat ? 'Buscar seleção pelo nome…' : 'Buscar clube pelo nome…'}" value="${esc(w.anyQ || '')}" data-a="anyQ" data-live="1" autocomplete="off" aria-label="${isNat ? 'Buscar seleção' : 'Buscar clube'}">
    <div class="row wrap" style="gap:6px;margin-bottom:12px">${['all'].concat(groups).map((x) => `<button class="chip ${g === x ? 'on' : ''}" data-a="anyG" data-v="${esc(x)}">${esc(anyGroupLabel(x))}</button>`).join('')}</div>
    <div id="any-list">${anyClubListHtml()}</div>
  </div>`;
}
function viewAnyClubNormal(rows, groups, g) {
  const w = UI.wiz;
  const reg = ANY_REGIONS.some(([k]) => k === g) ? g : g === 'all' ? '' : anyRegionOf(g);
  const leagues = groups.filter((x) => !reg || anyRegionOf(x) === reg);
  return `<div class="panel" style="margin-top:18px">
    <div class="row wrap" style="margin-bottom:10px"><h3 class="grow" style="font-size:24px;margin:0">Ou escolha qualquer clube</h3><span class="muted" style="font-size:13px">${rows.length} clubes em ${S.normal.length} ligas</span></div>
    <input id="any-q" class="input" style="width:100%;margin-bottom:10px" type="search" placeholder="Buscar clube pelo nome…" value="${esc(w.anyQ || '')}" data-a="anyQ" data-live="1" autocomplete="off" aria-label="Buscar clube">
    <div class="row wrap" style="gap:6px;margin-bottom:12px">${['all'].concat(ANY_REGIONS.map(([k]) => k)).map((x) => `<button class="chip ${g === x || (x === reg && g !== reg) ? 'on' : ''}" data-a="anyG" data-v="${x}">${esc(anyGroupLabel(x))}</button>`).join('')}
      <select class="input" style="max-width:300px" data-a="anyLg" aria-label="Liga"><option value="${reg || 'all'}">Todas as ligas${reg ? ' da região' : ''}</option>${leagues.map((x) => `<option value="${esc(x)}" ${g === x ? 'selected' : ''}>${esc(anyGroupLabel(x))}</option>`).join('')}</select></div>
    <div id="any-list">${anyClubListHtml()}</div>
  </div>`;
}
function anyClubListHtml() {
  const w = UI.wiz;
  const q = strip((w.anyQ || '').trim());
  const g = w.anyG || 'all';
  const isReg = ANY_REGIONS.some(([k]) => k === g);
  const rows = anyClubEntries().filter((r) => (g === 'all' || r.grp === g || (isReg && anyRegionOf(r.grp) === g)) && (!q || r.q.includes(q)));
  if (!rows.length) return '<div class="empty">Nenhum resultado para essa busca.</div>';
  const shown = rows.slice(0, 60);
  return `<div class="any-grid">${shown.map((r) => {
    const t = S.teams[r.id];
    return `<button class="any-item" data-a="pickOffer" data-id="${r.id}" title="Começar ${esc(tA(t, 'no'))}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${esc(r.where)}</span></span><span class="sc">${starStr(r.r)}<span class="muted">força ${r.r.toFixed(1)}</span></span></button>`;
  }).join('')}</div>${rows.length > shown.length ? `<p class="muted" style="font-size:13px;margin:10px 0 0">Mostrando ${shown.length} de ${rows.length}. Digite o nome para achar os outros.</p>` : ''}`;
}
act('anyQ', (el) => { UI.wiz.anyQ = el.value; const box = $('#any-list'); if (box) box.innerHTML = anyClubListHtml(); });
act('anyLg', (el) => { UI.wiz.anyG = el.value; render(); });
act('anyG', (el) => {
  UI.wiz.anyG = el.dataset.v;
  if (S.mode === 'normal') { render(); return; }
  const box = $('#any-list');
  if (box) box.innerHTML = anyClubListHtml();
  $$('[data-a="anyG"]').forEach((b) => b.classList.toggle('on', b === el));
});
function validCareerTeam(id) {
  if (!S) return false;
  if (S.mode === 'ultra') return S.ultra.div.flat().concat(S.ultra.bank).includes(id);
  if (S.mode === 'normal') return S.normal.some((l) => l.teams.includes(id) || l.bank.includes(id));
  return false;
}
act('wizSet', (el) => {
  const w = UI.wiz;
  const k = el.dataset.k;
  w[k] = k === 'era' ? +el.dataset.v : el.dataset.v;
  render();
});
act('wizToggle', (el) => { UI.wiz[el.dataset.k] = el.checked; });
act('wizToggleNoFire', () => { UI.wiz.noFire = !UI.wiz.noFire; render(); });
act('wizBack', () => {
  const w = UI.wiz;
  if (w.step === 0) { UI.screen = 'start'; render(); return; }
  w.step--;
  if (w.step === 3 && w.kind === 'national') w.step = 2;
  w.offers = null;
  render();
});
act('wizNext', async () => {
  const w = UI.wiz;
  if (w.step === 0) {
    w.name = ($('#w-name').value || '').trim();
    w.fav = ($('#w-fav').value || '').trim();
    w.age = clamp(+$('#w-age').value || 38, 25, 80);
    if (!w.name) { toast('Digite o nome do treinador.', true); return; }
  }
  w.step++;
  if (w.step === 3 && w.kind === 'national') w.step = 4;
  if (w.step === 5) { await prepareOffers(); return; }
  render();
});
async function prepareOffers() {
  const w = UI.wiz;
  setLoading('Carregando elencos de ' + w.era + '…', 0.2);
  try {
    await loadEra(w.era);
    setLoading('Montando o mundo…', 0.6);
    await new Promise((r) => setTimeout(r, 20));
    const favT = STORE.find((t) => strip(t[1]) === strip(w.fav));
    await createWorld({ era: w.era, mode: w.kind === 'national' ? 'national' : w.mode, coachName: w.name, coachAge: w.age, favKey: favT ? favT[0] : w.fav, zoeira: w.zoeira, noFire: w.noFire });
    w.offers = initialOffers(S.mode);
    w.anyList = null; w.anyQ = ''; w.anyG = 'all';
    UI.screen = 'wizard';
    render();
  } catch (e) {
    console.error(e);
    UI.screen = 'wizard'; w.step = 4; render(); toast(e.message, true);
  }
}
act('wizReroll', () => { UI.wiz.offers = initialOffers(S.mode, { exclude: UI.wiz.offers.map((o) => o.team) }); render(); });
act('pickOffer', async (el) => {
  const id = +el.dataset.id;
  const w = UI.wiz;
  S.noFire = !!w.noFire;
  closeAllModals();
  setLoading('Preparando o calendário…', 0.05);
  await new Promise((r) => setTimeout(r, 30));
  try {
    await startCareerAsync(id, (p) => setLoading('Simulando o restante do mundo até o seu início…', 0.05 + p * 0.9));
    await saveGame(S.id);
    SAVES = await listSaves();
    UI.screen = 'career'; UI.tab = 'central'; UI.sub = {};
    render();
  } catch (e) { console.error(e); UI.screen = 'wizard'; render(); toast('Erro ao iniciar: ' + e.message, true); }
});

/* ===================== career shell & central ===================== */
function navTabs() {
  const nat = S.mode === 'national';
  const tabs = [['central', 'Central'], ['inbox', 'Notificações'], ['squad', nat ? 'Seleção' : 'Elenco']];
  if (!nat) tabs.push(['transfers', 'Transferências']);
  if (!nat && !S.zoeira) tabs.push(['academy', 'Academia']);
  tabs.push(['office', 'Escritório']);
  return tabs;
}
function viewCareer() {
  const t = S.teams[S.user.team];
  const un = unreadCount();
  const conf = Math.round(S.board.conf);
  const segs = 10, on = Math.round(conf / 10);
  const cls = conf < 30 ? 'low' : conf < 55 ? 'mid' : '';
  const nav = navTabs().map(([k, l]) => `<button class="${UI.tab === k ? 'on' : ''}" data-a="tab" data-t="${k}">${l}${k === 'inbox' && un ? `<span class="badge">${un}</span>` : ''}</button>`).join('');
  let content = '';
  if (UI.tab === 'central') content = viewCentral();
  else if (UI.tab === 'inbox') content = viewInbox();
  else if (UI.tab === 'squad') content = viewSquad();
  else if (UI.tab === 'transfers') content = viewTransfers();
  else if (UI.tab === 'academy') content = viewAcademy();
  else if (UI.tab === 'office') content = viewOffice();
  if (S.celebrate && S.celebrate.length && !UI.celebrating) later(() => showCelebration());
  else if (S.pendingEnd && !UI.seasonOpen && !UI.celebrating) later(() => openSeasonEnd());
  return `<header class="topbar"><div class="topbar-in">
      <div class="logo-mark" title="Ultra Manager">UM</div>
      <nav class="nav" aria-label="Seções">${nav}</nav>
      <div class="club-chip" ${S.coach.unemployed ? '' : `data-a="openTeam" data-id="${t.id}" role="button" tabindex="0" title="Ver o clube" style="cursor:pointer"`}>${S.coach.unemployed ? `<span class="chip">Sem clube</span>` : `${crest(t, 34)}<div><div class="nm">${esc(t.n)}</div><div class="conf-bar ${cls}" title="Confiança da diretoria: ${conf}%">${Array.from({ length: segs }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</div></div>`}</div>
      ${coinPill()}
      <button class="icon-btn" data-a="openMenu" aria-label="Menu">☰</button>
    </div></header>
    <main class="page">${content}</main>`;
}
act('tab', (el) => { UI.tab = el.dataset.t; render(); window.scrollTo(0, 0); });
act('goHub', () => { UI.screen = 'career'; UI.tab = 'central'; closeAllModals(); render(); });
act('openMenu', () => {
  openModal(modalShell('Menu', `<div class="col">
    <button class="menu-btn" data-a="manualSave"><span class="ic">💾</span><span>Salvar carreira<small>Salva no navegador (automático também)</small></span></button>
    <button class="menu-btn" data-a="exportSave"><span class="ic">⤒</span><span>Exportar save<small>Baixar arquivo para guardar ou levar a outro aparelho</small></span></button>
    <button class="menu-btn" data-a="openCrestsInGame"><span class="ic">🛡</span><span>Escudos dos times<small>Use imagens suas, uma a uma ou em lote</small></span></button>
    <button class="menu-btn" data-a="openStoreInGame"><span class="ic">🛒</span><span>Loja de times<small>${INFINITE_COINS ? 'FutCoins infinitas' : WALLET.coins + ' FutCoins disponíveis'}</small></span></button>
    <button class="menu-btn" data-a="howTo"><span class="ic">?</span><span>Como jogar</span></button>
    <button class="menu-btn" data-a="exitToStart"><span class="ic">⏏</span><span>Sair para o menu<small>Salva antes de sair</small></span></button>
  </div>`), { size: 'narrow' });
});
act('openStoreInGame', () => { closeModal(); ACT.openStore(); });
act('openCrestsInGame', () => { closeModal(); ACT.openCrests(); });
act('manualSave', async () => { await saveGame(S.id); SAVES = await listSaves(); closeModal(); toast('Carreira salva.'); });
act('exitToStart', async () => { await saveGame(S.id); SAVES = await listSaves(); closeAllModals(); UI.screen = 'start'; render(); });
act('exportSave', async () => {
  closeAllModals();
  const blob = await exportSaveBlob();
  const name = `ultra-manager-${strip(S.coach.name).replace(/[^a-z0-9]+/g, '-')}-${fmtDate(S.date).replace(/\//g, '-')}.json`;
  await offerDownload(name, blob, 'Save exportado. Use "Importar save" para continuar em outro aparelho.');
});

// ------------------------------------------------------------------ central
function userComps() {
  const uid = S.user.team;
  return S.active.map((id) => S.comps[id]).filter((c) => c && (c.teams.includes(uid) || (c.groups && c.groups.some((g) => g.teams.includes(uid))) || (S.tm[uid] || []).some((mid) => S.matches[mid] && S.matches[mid].c === c.id)));
}
function userLeagueComp() {
  const uid = S.user.team;
  return S.active.map((id) => S.comps[id]).find((c) => c && c.kind === 'league' && c.teams.includes(uid));
}
function viewCentral() {
  if (S.coach.unemployed) return viewUnemployed();
  const uid = S.user.team;
  const t = S.teams[uid];
  const nm = nextMatch(uid);
  const today = userMatchToday();
  const days = nm ? nm.d - S.date : null;
  let fixture = '';
  if (nm) {
    const c = S.comps[nm.c];
    const rd = c && c.rounds[nm.r];
    fixture = `<div class="comp-line">${compBadge(c, 28)}<span>${esc(c ? c.name : '')}${rd ? ` · ${esc(rd.name)}` : ''}</span><span class="when">${fmtDate(nm.d, 'dm')} · ${nm.t}</span></div>
      <div class="fixture"><div class="crests">${crest(nm.h, 64)}${crest(nm.a, 64)}</div><div class="sep"></div>
        <div class="names">${esc(teamName(nm.h))}<br>${esc(teamName(nm.a))}</div></div>
      <div class="row wrap" style="margin:-6px 0 16px;gap:16px;font-size:13px"><span class="muted">Últimos 5:</span><span class="row" style="gap:6px">${crest(nm.h, 18)}${formRow(nm.h)}</span><span class="row" style="gap:6px">${crest(nm.a, 18)}${formRow(nm.a)}</span></div>`;
  } else fixture = `<div class="panel" style="margin:12px 0 18px">Nenhum jogo marcado no momento. ${S.mode === 'national' ? 'A seleção aguarda a próxima data FIFA.' : 'Aproveite para reforçar o elenco.'}</div>`;
  const sub = today ? 'Dia de jogo!' : nm ? (days === 1 ? 'Próximo jogo amanhã' : `Próximo jogo em ${days} dias`) : 'Sem jogos agendados';
  const advance = S.pendingEnd ? `<button class="btn primary big" data-a="openSeasonEnd"><span class="x-key">✕</span>Ver fim de temporada</button>`
    : today ? `<button class="btn primary big" data-a="goMatch" data-id="${today.id}"><span class="x-key">✕</span>Ir para a partida</button>`
      : `<button class="btn primary big" data-a="advance" data-m="day" ${UI.busy ? 'disabled' : ''}><span class="x-key">✕</span>Avançar</button>
         <button class="btn" data-a="advance" data-m="match" ${UI.busy ? 'disabled' : ''}>Até o próximo jogo</button>
         <button class="btn" data-a="advance" data-m="week" ${UI.busy ? 'disabled' : ''}>+7 dias</button>
         <button class="btn" data-a="simToCal" ${UI.busy ? 'disabled' : ''} title="Escolha um dia no calendário e simule até ele">Simular até…</button>`;
  // tasks
  const offers = S.tr.offers.filter((o) => o.status === 'open');
  const unread = unreadCount();
  const inj = teamPlayersFor(uid).filter((p) => isInjured(p));
  const tasks = [];
  if (offers.length) {
    const p = S.players[offers[0].pid];
    tasks.push(['⇄', `${p ? esc(p.n) : 'Jogador'} recebeu ${offers.length > 1 ? 'propostas' : 'proposta'}`, 'inbox']);
  }
  if (unread) tasks.push(['✉', `${unread} ${unread === 1 ? 'mensagem não lida' : 'mensagens não lidas'}`, 'inbox']);
  if (inj.length) tasks.push(['✚', `${inj.length} ${inj.length === 1 ? 'jogador lesionado' : 'jogadores lesionados'}`, 'squad']);
  if (!t.isNat) { const w = windowInfo(); tasks.push(['⌛', w.text, 'transfers']); }
  const susp = teamPlayersFor(uid).filter((p) => isSuspended(p));
  if (susp.length) tasks.push(['▮', `${susp.length} ${susp.length === 1 ? 'suspenso' : 'suspensos'}: ${susp.slice(0, 3).map((p) => esc(p.s || p.n)).join(', ')}`, 'squad']);
  const taskHtml = tasks.map(([ic, txt, tab]) => `<button class="task" data-a="tab" data-t="${tab}"><span class="ic">${ic}</span><span class="grow">${txt}</span><span class="dim">›</span></button>`).join('');
  return `<div class="hub">
    <section>
      <div class="hero-date">${fmtDate(S.date, 'hero')}</div>
      <div class="hero-sub">${sub}${S.zoeira ? ' · <span style="color:#b6ff5a">modo zoeira</span>' : ''}</div>
      ${fixture}
      <div class="advance-row">${advance}</div>
      <div class="task-list">${taskHtml}</div>
      ${viewTeamData()}
    </section>
    <aside class="col" style="gap:16px">${viewNewsCarousel()}${viewRecentResults()}</aside>
  </div>`;
}
function viewTeamData() {
  const uid = S.user.team;
  const t = S.teams[uid];
  const lc = userLeagueComp();
  let pos = '—', pts = '—', played = '';
  if (lc) {
    const tab = sortTable(lc.table, lc.teams);
    const i = tab.findIndex((r) => r.id === uid);
    pos = `${i + 1}º`; pts = tab[i].pts; played = `${tab[i].p} jogos`;
  }
  const comps = userComps();
  const topComp = lc || comps[0];
  const ts = topComp ? topScorers(topComp.id, 50).find((r) => r.team === uid) : null;
  const rec = S.coach.rec;
  return `<div class="grid g4" style="margin-top:18px">
    <div class="stat-tile"><div class="k">${lc ? esc(lc.name) : 'Posição'}</div><div class="v">${pos}</div><div class="muted" style="font-size:13px">${pts} pts ${played ? '· ' + played : ''}</div></div>
    <div class="stat-tile"><div class="k">Artilheiro</div><div class="v" style="font-size:20px">${ts ? esc(ts.name) : '—'}</div><div class="muted" style="font-size:13px">${ts ? `${ts.goals} gols` : 'Sem gols ainda'}</div></div>
    <div class="stat-tile"><div class="k">Carreira</div><div class="v">${rec.w}-${rec.d}-${rec.l}</div><div class="muted" style="font-size:13px">V-E-D · nota ${(S.coach.rating / 10).toFixed(1)}</div></div>
    <div class="stat-tile"><div class="k">${t.isNat ? 'Federação' : 'Orçamento'}</div><div class="v" style="font-size:22px">${t.isNat ? Math.round(S.board.conf) + '%' : money(t.budget)}</div><div class="muted" style="font-size:13px">Objetivo: ${esc(S.board.obj)}</div></div>
  </div>`;
}
function viewUnemployed() {
  const jobs = S.jobs || [];
  return `<div class="hub"><section>
    <div class="hero-date">${fmtDate(S.date, 'hero')}</div>
    <div class="hero-sub">Você está sem clube. Procure um novo trabalho no mercado ou espere propostas.</div>
    <div class="advance-row"><button class="btn primary big" data-a="advance" data-m="week">Avançar 7 dias</button><button class="btn" data-a="advance" data-m="day">Avançar</button></div>
    <div class="panel"><h3>Mercado de trabalho</h3>${viewJobList(jobs)}</div>
  </section><aside class="col">${viewNewsCarousel()}</aside></div>`;
}
function viewJobList(jobs) {
  if (!jobs.length) return '<div class="empty">Nenhuma vaga aberta no momento. Volte na próxima semana.</div>';
  return `<div class="col">${jobs.map((j) => {
    const t = S.teams[j.team];
    const r = t.isNat ? nationRating(t.code) : teamRating(t.id);
    const pr = teamPrestige(t.id);
    const chance = 1 / (1 + Math.exp(-(S.coach.rep + 8 - pr) / 7));
    return `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)">${crest(t, 34)}<div class="grow"><div style="font-weight:700">${esc(t.n)}</div><div class="muted" style="font-size:13px">${starStr(r)} · chance ${Math.round(chance * 100)}%</div></div>
      <button class="btn sm primary" data-a="applyJob" data-id="${t.id}">Candidatar-se</button></div>`;
  }).join('')}</div>`;
}
act('applyJob', (el) => {
  const r = applyForJob(+el.dataset.id);
  toast(r.msg, !r.ok);
  if (r.ok) { UI.tab = 'central'; }
  render();
});

// news · "Ultra Esporte", the game's own fictional sports channel
const NEWS_CATS = {
  'Mercado da bola': '#ffb020', 'Pós-jogo': '#4cc3ff', Rodada: '#38c77f', Tabela: '#9aa4ff', 'Campeão': '#ffc54d',
  'Acesso e rebaixamento': '#ff8a5c', Bastidores: '#c9a0ff', Aposentadoria: '#b9c2c9', 'Inacreditável': '#b6ff5a', 'Seleção': '#ff6b8a', 'Notícias': '#9bb2b8',
};
const NEWS_TAG_CAT = { transfer: 'Mercado da bola', resultado: 'Rodada', clube: 'Pós-jogo', titulo: 'Campeão', liga: 'Tabela', promo: 'Acesso e rebaixamento', retire: 'Aposentadoria', zoeira: 'Inacreditável', selecao: 'Seleção' };
const NEWS_REPORTERS = ['Marina Duarte', 'Caio Andrade', 'Renata Lobo', 'Thiago Barcellos', 'Júlia Pessanha', 'Rodrigo Teles', 'Paula Siqueira', 'Bruno Antunes', 'Lívia Moraes', 'Diego Fontoura'];
function newsCat(n) { const label = n.cat || NEWS_TAG_CAT[n.tag] || 'Notícias'; return { label, color: NEWS_CATS[label] || '#9bb2b8' }; }
function newsReporter(n) { return NEWS_REPORTERS[hashStr('rep' + n.id) % NEWS_REPORTERS.length]; }
function newsAgo(n) { const d = S.date - n.d; return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : d < 7 ? `há ${d} dias` : fmtDate(n.d, 'dm'); }
const ueLogo = (size = 34) => `<span class="ue-logo" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px" aria-hidden="true">UE</span>`;
function newsImage(n) {
  const ids = (n.teams || []).filter((id) => S.teams[id]);
  const t = ids[0] ? S.teams[ids[0]] : null;
  const c1 = t ? t.c1 : '#1d4a57';
  const h = hashStr(String(n.id));
  const cat = newsCat(n);
  const sc = n.sc && S.teams[n.sc[0]] && S.teams[n.sc[1]] ? n.sc : null;
  const crests = sc
    ? `<g transform="translate(70,40) scale(1.7)">${crestInSvg(sc[0], 40)}</g><g transform="translate(182,40) scale(1.7)">${crestInSvg(sc[1], 40)}</g>
       <text x="160" y="92" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="40" fill="#fff" stroke="rgba(0,0,0,0.45)" stroke-width="1.2" paint-order="stroke">${sc[2]}<tspan fill="rgba(255,255,255,0.6)" font-size="26" dx="6" dy="-6">x</tspan><tspan dx="6" dy="6">${sc[3]}</tspan></text>`
    : `<g transform="translate(${ids[1] ? 92 : 128},40) scale(1.6)">${t ? crestInSvg(t, 40) : ''}</g>${ids[1] ? `<g transform="translate(164,40) scale(1.6)">${crestInSvg(ids[1], 40)}</g>` : ''}`;
  const extra = n.tag === 'titulo' ? `<g transform="translate(244,96)">${trophySVG(n.cup && /^(UCL|WC|UL1|LIB|SULA|MUN|EURO|COPA)$/.test(n.cup) ? n.cup : 'UCL', 62)}</g>`
    : n.tag === 'zoeira' ? '<text x="248" y="92" font-size="44">👽</text>'
      : n.tag === 'transfer' && !sc ? `<g transform="translate(222,26) rotate(8)"><rect width="78" height="26" rx="5" fill="rgba(0,0,0,0.35)" stroke="#fff" stroke-width="1.5"/><text x="39" y="18" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="15" fill="#fff" letter-spacing="1">OFICIAL</text></g>` : '';
  const band = `<g><rect x="0" y="150" width="320" height="50" fill="rgba(4,14,18,0.78)"/><rect x="0" y="150" width="6" height="50" fill="${cat.color}"/>
    <text x="16" y="171" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="13" letter-spacing="1.5" fill="${cat.color}">${esc(cat.label.toUpperCase())}</text>
    <text x="16" y="190" font-family="Barlow, sans-serif" font-weight="600" font-size="12" fill="rgba(255,255,255,0.75)">ULTRA ESPORTE${n.fee ? ` · ${esc(fmtMoney(n.fee))}` : ''}</text></g>`;
  return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="ng${n.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="#071318"/></linearGradient>
    <radialGradient id="nl${n.id}" cx="${30 + (h % 40)}%" cy="0%" r="80%"><stop offset="0" stop-color="rgba(255,255,255,0.35)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
    <rect width="320" height="200" fill="url(#ng${n.id})"/><rect width="320" height="200" fill="url(#nl${n.id})"/>
    <g opacity="0.16" stroke="#fff" stroke-width="2" fill="none"><rect x="20" y="118" width="280" height="120"/><circle cx="160" cy="178" r="40"/><line x1="20" y1="178" x2="300" y2="178"/></g>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${((h >> i) % 280)}" y="0" width="${8 + (i * 7) % 20}" height="200" fill="rgba(255,255,255,0.03)" transform="skewX(-18)"/>`).join('')}
    ${crests}${extra}${band}
  </svg>`;
}
function viewNewsCarousel() {
  const list = S.news.slice(0, 6);
  if (!list.length) return `<div class="news-card"><div class="news-top">${ueLogo()}<div><b>Ultra Esporte</b><div class="muted" style="font-size:12px">${fmtDate(S.date, 'dm')}</div></div></div><div class="news-body"><h4>A bola vai rolar</h4><p class="muted">A cobertura do Ultra Esporte aparece aqui conforme a temporada avança: mercado da bola, rodadas, tabela e bastidores.</p></div></div>`;
  const i = clamp(UI.newsIdx, 0, list.length - 1);
  const n = list[i];
  const cat = newsCat(n);
  return `<div class="news-card">
    <div class="news-top">${ueLogo()}<div class="grow"><b>Ultra Esporte</b><div class="muted" style="font-size:12px">${newsAgo(n)} · Por ${esc(newsReporter(n))}</div></div>${n.hot ? '<span class="plantao">PLANTÃO</span>' : S.date - n.d <= 2 ? '<span class="news-new">Novo</span>' : ''}</div>
    <div class="news-img">${newsImage(n)}</div>
    <div class="news-body"><span class="news-cat" style="--c:${cat.color}">${esc(cat.label)}</span><h4>${esc(n.title)}</h4><div class="muted" style="font-size:14px">${esc(n.body)}</div>
      <div class="news-meta"><span>♡ ${n.likes}</span><span>💬 ${n.com} comentários</span><button class="link right" data-a="allNews">Ver todas</button></div></div>
    <div class="dots">${list.map((_, k) => `<button class="${k === i ? 'on' : ''}" data-a="newsDot" data-i="${k}" aria-label="Notícia ${k + 1}"></button>`).join('')}</div>
  </div>`;
}
act('newsDot', (el) => { UI.newsIdx = +el.dataset.i; render(); });
act('allNews', () => {
  UI.newsCat = 'all';
  openModal(() => {
    const cats = uniq(S.news.map((n) => newsCat(n).label));
    const f = UI.newsCat || 'all';
    const list = S.news.filter((n) => f === 'all' || newsCat(n).label === f);
    return modalShell(`${ueLogo(30)} Ultra Esporte`, `
      <div class="row wrap" style="gap:6px;margin-bottom:14px">${['all'].concat(cats).map((c) => `<button class="chip ${f === c ? 'on' : ''}" data-a="newsCatF" data-v="${esc(c)}">${c === 'all' ? 'Todas' : esc(c)}</button>`).join('')}</div>
      <div class="news-feed">${list.map((n) => { const cat = newsCat(n); return `<article class="nf-item"><div class="nf-thumb">${newsImage(n)}</div><div class="nf-text">
        <div class="row wrap" style="gap:8px"><span class="news-cat" style="--c:${cat.color};margin:0">${esc(cat.label)}</span>${n.hot ? '<span class="plantao sm">PLANTÃO</span>' : ''}<span class="muted" style="font-size:12px">${newsAgo(n)}</span></div>
        <h4>${esc(n.title)}</h4><p class="muted">${esc(n.body)}</p><div class="muted" style="font-size:12px">Por ${esc(newsReporter(n))} · ♡ ${n.likes} · 💬 ${n.com}</div></div></article>`; }).join('') || '<div class="empty">Sem notícias nesta categoria.</div>'}</div>`);
  }, { size: 'wide' });
});
act('newsCatF', (el) => { UI.newsCat = el.dataset.v; refreshModal(); });
function viewRecentResults() {
  const lc = userLeagueComp() || userComps()[0];
  if (!lc) return '';
  // last completed round
  let rd = null;
  for (let i = lc.rounds.length - 1; i >= 0; i--) { const r = lc.rounds[i]; if (r.m.length && r.m.every((id) => S.matches[id] && S.matches[id].done)) { rd = r; break; } }
  if (!rd) return '';
  return `<div class="panel"><h3>${compBadge(lc, 22)} ${esc(rd.name)} <span class="sub">${esc(lc.name)}</span></h3>
    <div class="col" style="gap:4px">${rd.m.map((id) => matchLine(S.matches[id])).join('')}</div>
    <div class="row" style="margin-top:10px"><button class="link" data-a="gotoResults" data-c="${lc.id}">Ver todos os resultados ›</button></div></div>`;
}
function matchLine(m, opts = {}) {
  if (!m) return '';
  const uid = S.user.team;
  const me = m.h === uid || m.a === uid;
  const sc = m.done ? `${m.hg} - ${m.ag}${m.pen ? `<span class="dim" style="font-size:11px"> (${m.pen[0]}-${m.pen[1]})</span>` : ''}` : `<span class="dim">${m.t}</span>`;
  return `<div class="row" style="padding:5px 4px;border-radius:8px;${me ? 'background:rgba(111,125,255,0.12)' : ''};font-size:14px;cursor:pointer" data-a="openMatch" data-id="${m.id}">
    ${opts.date ? `<span class="dim" style="width:44px;font-size:12px">${fmtDate(m.d, 'short')}</span>` : ''}
    <span class="grow" style="text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${m.done && m.hg > m.ag ? 'font-weight:700' : ''}">${esc(teamName(m.h))}</span>${crest(m.h, 18)}
    <span class="tnum" style="min-width:58px;text-align:center;font-weight:700">${sc}</span>
    ${crest(m.a, 18)}<span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${m.done && m.ag > m.hg ? 'font-weight:700' : ''}">${esc(teamName(m.a))}</span></div>`;
}
act('gotoResults', (el) => { UI.tab = 'office'; UI.sub.office = 'results'; UI.resComp = +el.dataset.c; UI.resRound = null; render(); });

// ------------------------------------------------------------------ advancing time
let lastAutosave = 0;
act('advance', async (el) => {
  if (UI.busy) return;
  const mode = el.dataset.m;
  UI.busy = true;
  render();
  const max = mode === 'day' ? 1 : mode === 'week' ? 7 : 120;
  const offersBefore = S.tr.offers.filter((o) => o.status === 'open').length;
  const jobsBefore = S.inbox.filter((m) => m.type === 'job').length;
  try {
    for (let i = 0; i < max; i++) {
      if (S.pendingEnd || (S.celebrate && S.celebrate.length)) break;
      const r = advanceDay();
      if (r.blocked) break;
      if (userMatchToday()) break;
      if (mode === 'match') {
        if (S.tr.offers.filter((o) => o.status === 'open').length > offersBefore) break;
        if (S.inbox.filter((m) => m.type === 'job').length > jobsBefore) break;
        if (S.coach.unemployed && i >= 6) break;
      }
      if (i % 4 === 3) await new Promise((r2) => setTimeout(r2, 0));
    }
  } catch (e) { console.error(e); toast('Erro ao avançar: ' + e.message, true); }
  UI.busy = false;
  if (S.date - lastAutosave >= 7) { lastAutosave = S.date; saveGame(S.id).then(async () => { SAVES = await listSaves(); }); }
  render();
});

/* ===================== inbox (notificações) ===================== */
const MSG_IC = { offer: '⇄', player: '🗣', board: '🏛', scout: '🔭', contract: '✍', loan: '↩', injury: '✚', job: '💼', info: 'ℹ' };
function viewInbox() {
  const list = S.inbox;
  const sel = list.find((m) => m.id === UI.msgSel) || list[0];
  if (sel && !sel.read) { sel.read = true; }
  const items = list.map((m) => `<button class="msg-item ${m.read ? '' : 'unread'} ${sel && sel.id === m.id ? 'on' : ''}" data-a="selMsg" data-id="${m.id}">
      <span class="ic">${MSG_IC[m.type] || '✉'}</span><span class="grow" style="min-width:0"><span class="s" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.subj)}</span>
      <span class="muted" style="font-size:12px">${esc(m.from)} · ${fmtDate(m.d, 'short')}</span></span>${m.read ? '' : '<span class="dot" style="background:var(--accent-hi)"></span>'}</button>`).join('');
  return `<div class="row" style="margin-bottom:12px"><h2 style="font-size:34px;font-weight:800">Notificações</h2><span class="grow"></span>
      ${sel ? `<button class="btn sm" data-a="delMsg" data-id="${sel.id}">Apagar mensagem</button>` : ''}
      <button class="btn sm danger" data-a="askDelAll" ${list.length ? '' : 'disabled'}>Apagar tudo</button></div>
    <div class="inbox"><div class="panel" style="padding:8px;max-height:72vh;overflow:auto">${items || '<div class="empty">Caixa de entrada vazia.</div>'}</div>
      <div class="panel">${sel ? viewMessage(sel) : '<div class="empty">Selecione uma mensagem.</div>'}</div></div>`;
}
function viewMessage(m) {
  let actions = '';
  if (m.type === 'offer' && m.act && m.act.offer) {
    const o = S.tr.offers.find((x) => x.id === m.act.offer);
    if (o && o.status === 'open') {
      const p = S.players[o.pid];
      actions = `<div class="panel" style="background:var(--panel2);margin-top:14px">
        <div class="row wrap">${p ? `${ovrBadge(p.o)} ${posBadge(p.p)} <b>${esc(p.n)}</b> <span class="muted">${p.age} anos · valor ${money(playerValue(p))}</span>` : ''}</div>
        <div class="row wrap" style="margin-top:10px"><span>Proposta atual: <b>${o.loan ? 'Empréstimo' : money(o.fee)}</b></span></div>
        <div class="row wrap" style="margin-top:12px">
          <button class="btn primary sm" data-a="offerAct" data-o="${o.id}" data-x="accept">Aceitar</button>
          <button class="btn sm" data-a="offerAct" data-o="${o.id}" data-x="reject">Recusar</button>
          ${o.loan ? '' : `<input class="input" style="max-width:160px" id="ctr-${o.id}" type="number" min="0" step="100000" value="${Math.round(o.fee * 1.2)}"><button class="btn sm" data-a="offerAct" data-o="${o.id}" data-x="counter">Contraproposta</button>`}
        </div><div class="muted" style="font-size:12px;margin-top:6px">${isWindowOpen() ? '' : 'A janela está fechada: a venda só pode ser concluída quando ela abrir.'}</div></div>`;
    } else if (o) actions = `<div class="chip" style="margin-top:12px">${o.status === 'done' ? 'Negócio concluído' : 'Proposta encerrada'}</div>`;
  } else if (m.type === 'player' && m.act && !m.act.done) {
    const k = m.act.kind;
    actions = `<div class="row wrap" style="margin-top:14px">
      ${k === 'minutes' ? '<button class="btn sm primary" data-a="answerP" data-x="promise">Prometer mais jogos</button>' : '<button class="btn sm primary" data-a="answerP" data-x="convince">Convencer a ficar</button>'}
      <button class="btn sm" data-a="answerP" data-x="list">Colocar na lista de transferências</button>
      <button class="btn sm" data-a="answerP" data-x="ignore">Ignorar</button></div>`;
  } else if (m.type === 'job' && m.act && m.act.job) {
    actions = `<div class="row wrap" style="margin-top:14px"><button class="btn sm primary" data-a="applyJob" data-id="${m.act.job}">Conversar com o clube</button></div>`;
  } else if (m.act && m.act.done) actions = `<div class="chip" style="margin-top:12px">Respondido</div>`;
  return `<div class="muted" style="font-size:13px">${esc(m.from)} · ${fmtDate(m.d, 'long')}</div>
    <h2 style="font-size:28px;font-weight:800;margin:6px 0 10px">${esc(m.subj)}</h2>
    <p style="font-size:16px;max-width:65ch">${esc(m.body)}</p>${actions}`;
}
act('selMsg', (el) => { UI.msgSel = +el.dataset.id; render(); });
act('delMsg', (el) => { S.inbox = S.inbox.filter((m) => m.id !== +el.dataset.id); UI.msgSel = null; render(); toast('Mensagem apagada.'); });
act('askDelAll', () => {
  openModal(modalShell('Apagar todas as mensagens?', '<p>Propostas abertas continuam valendo na aba Transferências.</p>', '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="delAll">Apagar tudo</button>'), { size: 'narrow' });
});
act('delAll', () => { S.inbox = []; closeModal(); render(); toast('Caixa de entrada limpa.'); });
act('offerAct', (el) => {
  const id = +el.dataset.o, x = el.dataset.x;
  const counter = x === 'counter' ? +($('#ctr-' + id) || {}).value : 0;
  const r = respondOffer(id, x, counter);
  toast(r.msg);
  render();
  if (UI.tab === 'transfers') render();
});
act('answerP', (el) => {
  const m = S.inbox.find((x) => x.id === (UI.msgSel || (S.inbox[0] && S.inbox[0].id)));
  if (!m) return;
  toast(answerPlayer(m.id, el.dataset.x));
  render();
});

/* ===================== squad: lineup, squad hub, stats, call-ups ===================== */
function userPlayers() {
  const t = S.teams[S.user.team];
  return t.isNat ? nationSquad(t.code) : squadOf(t.id);
}
function viewSquad() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const t = S.teams[S.user.team];
  const sub = UI.sub.squad || 'lineup';
  const tabs = [['lineup', 'Escalação'], ['hub', t.isNat ? 'Convocados' : 'Central de elenco'], ['stats', 'Artilharia']];
  if (t.isNat) tabs.push(['callup', 'Convocação']);
  let body = '';
  if (sub === 'lineup') body = viewLineup();
  else if (sub === 'hub') body = viewSquadHub();
  else if (sub === 'stats') body = viewStats();
  else if (sub === 'callup') body = viewCallup();
  const back = UI.returnToMatch ? `<div class="panel row wrap" style="margin-bottom:12px;border-color:var(--accent-hi)"><b class="grow">Ajuste a escalação e volte para a partida.</b><button class="btn primary" data-a="backToMatch">Voltar à partida</button></div>` : '';
  return `${back}<div class="subtabs">${tabs.map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="subtab" data-g="squad" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}
act('subtab', (el) => { UI.sub[el.dataset.g] = el.dataset.k; UI.sel = null; render(); });

// ------------------------------------------------------------------ lineup editor
function ensureLineup(t) {
  const players = t.isNat ? nationSquad(t.code) : squadOf(t.id);
  const ids = new Set(players.map((p) => p.id));
  if (!t.xi || t.xi.length !== 11) { const lu = autoLineup(players, t.form); t.xi = lu.xi; t.bench = lu.bench; }
  t.xi = t.xi.map((id) => (ids.has(id) ? id : 0));
  t.bench = (t.bench || []).filter((id) => ids.has(id) && !t.xi.includes(id));
  return players;
}
function pitchLines() {
  return `<svg class="lines" viewBox="0 0 68 100" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="0.35">
    <rect x="2" y="2" width="64" height="96"/><line x1="2" y1="50" x2="66" y2="50"/><circle cx="34" cy="50" r="8"/>
    <rect x="16" y="2" width="36" height="15"/><rect x="25" y="2" width="18" height="6"/><rect x="16" y="83" width="36" height="15"/><rect x="25" y="92" width="18" height="6"/>
    <path d="M27 17 A8 8 0 0 0 41 17"/><path d="M27 83 A8 8 0 0 1 41 83"/></g><circle cx="34" cy="50" r="0.6" fill="#fff"/></svg>`;
}
function slotCard(p, pos, i, sel) {
  if (!p) return `<div class="pslot empty ${sel ? 'sel' : ''}" data-a="slotClick" data-k="xi" data-i="${i}"><div class="card"><div class="o">–</div><div class="p">${POS_PT[pos]}</div></div><div class="nm">Vazio</div></div>`;
  const fit = Math.round(fitnessNow(p));
  const col = fit >= 85 ? 'var(--win)' : fit >= 70 ? '#c9d84a' : fit >= 55 ? 'var(--warn)' : 'var(--loss)';
  const pf = posFit(p, pos);
  const warn = !available(p) ? '<span class="warn flag-inj">✚</span>' : pf < 0.9 ? '<span class="warn" style="color:var(--warn)" title="Fora de posição">!</span>' : '';
  return `<div class="pslot ${sel ? 'sel' : ''}" data-a="slotClick" data-k="xi" data-i="${i}" data-pid="${p.id}">
    ${warn}<div class="card"><div class="o">${Math.round(p.o * (pf < 1 ? pf : 1))}</div><div class="p">${POS_PT[pos]}</div></div>
    <div class="nm">${esc(p.s || p.n)}</div><div class="fitbar"><i style="width:${fit}%;background:${col}"></i></div></div>`;
}
function viewLineup() {
  const t = S.teams[S.user.team];
  const players = ensureLineup(t);
  const slots = FORMATIONS[t.form];
  const sel = UI.sel;
  const slotHtml = slots.map((s, i) => {
    const p = S.players[t.xi[i]];
    return `<div style="position:absolute;left:${s[1]}%;top:${100 - s[2]}%">${slotCard(p, s[0], i, sel && sel.k === 'xi' && sel.i === i).replace('class="pslot', 'style="position:relative;transform:translate(-50%,-50%)" class="pslot')}</div>`;
  }).join('');
  const xiSet = new Set(t.xi);
  const benchSet = new Set(t.bench);
  const reserves = players.filter((p) => !xiSet.has(p.id) && !benchSet.has(p.id)).sort(by((p) => p.o, -1));
  const row = (p, k, i) => `<div class="bp ${sel && sel.k === k && sel.i === i ? 'sel' : ''}" data-a="slotClick" data-k="${k}" data-i="${i}" data-pid="${p.id}">
      ${posBadge(p.p)} ${ovrBadge(p.o)}${formTag(p)}<span class="grow" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.n)}${statusFlags(p)}</span>${fitBar(p)}</div>`;
  const avgXI = avg(t.xi.map((id) => S.players[id]).filter(Boolean), (p) => p.o);
  return `<div class="lineup-wrap">
    <div class="col">
      <div class="row wrap">
        <div class="field" style="min-width:140px"><label for="form-sel">Formação</label><select id="form-sel" class="input" data-a="setFormation">${FORMATION_LIST.map((f) => `<option ${f === t.form ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
        <div class="field"><label>Mentalidade</label><div class="seg">${[[-1, 'Defensiva'], [0, 'Equilibrada'], [1, 'Ofensiva']].map(([v, l]) => `<button class="${(t.ment || 0) === v ? 'on' : ''}" data-a="setMent" data-v="${v}">${l}</button>`).join('')}</div></div>
        <span class="grow"></span>
        <div class="stat-tile" style="padding:8px 12px"><div class="k">Média do XI</div><div class="v" style="font-size:22px">${avgXI.toFixed(1)}</div></div>
        <button class="btn sm" data-a="autoXI">Escalação automática</button>
      </div>
      <div class="pitch">${pitchLines()}${slotHtml}</div>
      <p class="muted center" style="font-size:13px;margin:0">Toque em um jogador e depois em outro para trocar de lugar. Arraste no computador.</p>
    </div>
    <div class="col">
      <div class="panel"><h3>Banco <span class="sub">${t.bench.length}/12</span></h3><div class="bench-list">${t.bench.map((id, i) => row(S.players[id], 'bench', i)).join('') || '<div class="muted">Vazio</div>'}</div></div>
      <div class="panel"><h3>Reservas <span class="sub">${reserves.length}</span></h3><div class="bench-list">${reserves.map((p) => row(p, 'res', p.id)).join('') || '<div class="muted">Ninguém</div>'}</div></div>
    </div></div>`;
}
act('setFormation', (el) => {
  const t = S.teams[S.user.team];
  const old = t.xi.map((id) => S.players[id]).filter(Boolean);
  t.form = el.value;
  const slots = FORMATIONS[t.form];
  const used = new Set();
  t.xi = slots.map((s) => {
    const best = old.filter((p) => !used.has(p.id)).sort(by((p) => effRating(p, s[0]), -1))[0];
    if (best) { used.add(best.id); return best.id; }
    return 0;
  });
  render();
});
act('setMent', (el) => { S.teams[S.user.team].ment = +el.dataset.v; render(); });
act('autoXI', () => {
  const t = S.teams[S.user.team];
  const lu = autoLineup(userPlayers(), t.form);
  t.xi = lu.xi; t.bench = lu.bench.slice(0, 12);
  render();
  toast('Escalação montada com os melhores disponíveis.');
});
function lineupGet(t, k, i) { return k === 'xi' ? t.xi[i] : k === 'bench' ? t.bench[i] : i; }
function lineupSwap(a, b) {
  const t = S.teams[S.user.team];
  if (a.k === b.k && a.i === b.i) return;
  const pa = lineupGet(t, a.k, a.i), pb = lineupGet(t, b.k, b.i);
  const setAt = (k, i, v) => {
    if (k === 'xi') t.xi[i] = v || 0;
    else if (k === 'bench') { if (v) t.bench[i] = v; else t.bench.splice(i, 1); }
  };
  if (a.k === 'res' && b.k === 'res') return;
  if (a.k === 'res') { // reserve into slot/bench
    if (b.k === 'bench') t.bench[b.i] = pa; else t.xi[b.i] = pa;
    return;
  }
  if (b.k === 'res') {
    if (a.k === 'bench') t.bench[a.i] = pb; else t.xi[a.i] = pb;
    return;
  }
  setAt(a.k, a.i, pb); setAt(b.k, b.i, pa);
  t.bench = t.bench.filter(Boolean);
}
act('slotClick', (el) => {
  if (UI.dragJustDropped) { UI.dragJustDropped = false; return; }
  const k = el.dataset.k, i = k === 'res' ? +el.dataset.i : +el.dataset.i;
  const cur = { k, i };
  if (!UI.sel) { UI.sel = cur; render(); return; }
  if (UI.sel.k === k && UI.sel.i === i) { UI.sel = null; render(); return; }
  if (UI.sel.k === 'res' && k === 'res') { UI.sel = cur; render(); return; }
  const t = S.teams[S.user.team];
  if ((UI.sel.k === 'res' && k === 'bench' && false)) return;
  if (UI.sel.k === 'res' && cur.k !== 'res' || cur.k === 'res' && UI.sel.k !== 'res') {
    const res = UI.sel.k === 'res' ? UI.sel : cur, other = UI.sel.k === 'res' ? cur : UI.sel;
    lineupSwap(res, other);
  } else lineupSwap(UI.sel, cur);
  if (t.bench.length > 12) t.bench.length = 12;
  UI.sel = null;
  render();
});
// drag & drop for lineup (pointer)
(function setupDrag() {
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.pslot[data-pid], .bp[data-pid]');
    if (!el || e.pointerType === 'touch') return;
    drag = { el, k: el.dataset.k, i: +el.dataset.i, x: e.clientX, y: e.clientY, ghost: null };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      drag.ghost = drag.el.cloneNode(true);
      Object.assign(drag.ghost.style, { position: 'fixed', pointerEvents: 'none', zIndex: 200, opacity: '0.9', left: '0', top: '0', transform: 'none', width: drag.el.offsetWidth + 'px' });
      document.body.appendChild(drag.ghost);
    }
    if (drag.ghost) {
      drag.ghost.style.left = e.clientX - 30 + 'px'; drag.ghost.style.top = e.clientY - 30 + 'px';
      $$('.drop').forEach((x) => x.classList.remove('drop'));
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const tgt = over && over.closest('.pslot[data-k], .bp[data-k]');
      if (tgt && tgt !== drag.el) tgt.classList.add('drop');
    }
  });
  document.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.ghost) return;
    d.ghost.remove();
    const over = document.elementFromPoint(e.clientX, e.clientY);
    const tgt = over && over.closest('.pslot[data-k], .bp[data-k]');
    if (tgt && tgt !== d.el) {
      UI.dragJustDropped = true;
      setTimeout(() => (UI.dragJustDropped = false), 50);
      const a = { k: d.k, i: d.i }, b = { k: tgt.dataset.k, i: +tgt.dataset.i };
      if (a.k === 'res' || b.k === 'res') { const res = a.k === 'res' ? a : b, other = a.k === 'res' ? b : a; if (res !== other) lineupSwap(res, other); }
      else lineupSwap(a, b);
      UI.sel = null;
      render();
    }
  });
})();

// ------------------------------------------------------------------ squad hub
function viewSquadHub() {
  const t = S.teams[S.user.team];
  const sort = UI.hubSort || 'pos';
  const players = userPlayers().slice();
  const posOrder = POSITIONS;
  if (sort === 'pos') players.sort((a, b) => posOrder.indexOf(a.p) - posOrder.indexOf(b.p) || b.o - a.o);
  else if (sort === 'ovr') players.sort(by((p) => p.o, -1));
  else if (sort === 'age') players.sort(by((p) => p.age));
  else if (sort === 'val') players.sort(by((p) => playerValue(p), -1));
  const lc = userLeagueComp();
  const statsOf = (p) => { let a = 0, g = 0, as = 0; for (const k in (p.st || {})) { const r = p.st[k]; if (S.comps[k] && S.comps[k].kind === 'youth') continue; a += r[0]; g += r[1]; as += r[2]; } return [a, g, as]; };
  const head = `<tr><th>Nº</th><th>Nome</th><th>Pos</th><th class="n">Idade</th><th class="c">OVR</th><th class="n">POT</th><th>Condição</th>${t.isNat ? '<th>Clube</th>' : '<th class="n">Valor</th><th class="n">Salário</th><th class="n">Contrato</th>'}<th class="n">J</th><th class="n">G</th><th class="n">A</th></tr>`;
  const rows = players.map((p) => {
    const [a, g, as] = statsOf(p);
    return `<tr class="click" data-a="openPlayer" data-id="${p.id}"><td class="tnum">${p.num || ''}</td><td>${esc(p.n)}${statusFlags(p)}</td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td class="c nw">${ovrBadge(p.o)}${formTag(p, true)}</td><td class="n">${p.pot}</td><td>${fitBar(p)}</td>
      ${t.isNat ? `<td>${p.t ? esc(teamName(p.t)) : 'Clube local'}</td>` : `<td class="n">${money(playerValue(p))}</td><td class="n">${money(p.w || 0)}</td><td class="n">${p.loan ? 'Emp.' : p.ct || '—'}</td>`}
      <td class="n">${a}</td><td class="n">${g}</td><td class="n">${as}</td></tr>`;
  }).join('');
  const wb = t.isNat ? '' : `<div class="row wrap" style="gap:16px"><span class="chip">Elenco: ${players.length}/36</span><span class="chip">Folha: ${money(wageBill(t.id))}/sem de ${money(t.wb)}</span><span class="chip">Orçamento: ${money(t.budget)}</span></div>`;
  return `<div class="row wrap" style="margin-bottom:10px">${wb}<span class="grow"></span><div class="seg">${[['pos', 'Posição'], ['ovr', 'Overall'], ['age', 'Idade'], ['val', 'Valor']].map(([k, l]) => `<button class="${sort === k ? 'on' : ''}" data-a="hubSort" data-k="${k}">${l}</button>`).join('')}</div></div>
    <div class="tbl-wrap"><table class="tbl"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}
act('hubSort', (el) => { UI.hubSort = el.dataset.k; render(); });

// ------------------------------------------------------------------ stats (artilharia)
function viewStats() {
  const comps = userComps().filter((c) => c.kind !== 'youth' && c.kind !== 'friendly');
  const sel = comps.find((c) => c.id === UI.statComp) || comps[0];
  const scope = UI.statScope || 'comp';
  let rowsG = [], rowsA = [], rowsJ = [];
  if (sel && scope === 'comp') { rowsG = topScorers(sel.id, 20, 'g'); rowsA = topScorers(sel.id, 20, 'a'); rowsJ = topScorers(sel.id, 20, 'apps'); }
  else {
    const mine = userPlayers().map((p) => { let a = 0, g = 0, as = 0; for (const k in (p.st || {})) { if (S.comps[k] && S.comps[k].kind === 'youth') continue; const r = p.st[k]; a += r[0]; g += r[1]; as += r[2]; } return { pid: p.id, name: p.n, team: S.user.team, apps: a, goals: g, assists: as }; });
    rowsG = mine.filter((r) => r.goals).sort(by((r) => r.goals, -1)); rowsA = mine.filter((r) => r.assists).sort(by((r) => r.assists, -1)); rowsJ = mine.filter((r) => r.apps).sort(by((r) => r.apps, -1));
  }
  const tbl = (title, rows, f, lbl) => `<div class="panel"><h3>${title}</h3>${rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Jogador</th><th>Time</th><th class="n">${lbl}</th></tr></thead><tbody>
    ${rows.slice(0, 20).map((r, i) => `<tr class="click ${r.team === S.user.team ? 'me' : ''}" data-a="openPlayer" data-id="${r.pid}"><td>${i + 1}</td><td>${esc(r.name)}</td><td>${S.teams[r.team] ? `<span class="team-cell">${crest(r.team, 18)}<span class="tn">${esc(teamShort(r.team))}</span></span>` : ''}</td><td class="n"><b>${r[f]}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Ainda sem números.</div>'}</div>`;
  return `<div class="row wrap" style="margin-bottom:12px"><div class="seg"><button class="${scope === 'comp' ? 'on' : ''}" data-a="statScope" data-k="comp">Competição</button><button class="${scope === 'team' ? 'on' : ''}" data-a="statScope" data-k="team">Meu time</button></div>
    ${scope === 'comp' && comps.length ? `<select class="input" style="max-width:280px" data-a="statComp">${comps.map((c) => `<option value="${c.id}" ${sel && c.id === sel.id ? 'selected' : ''}>${esc(c.name)} ${esc(c.season)}</option>`).join('')}</select>` : ''}</div>
    <div class="grid g3">${tbl('Artilharia', rowsG, 'goals', 'Gols')}${tbl('Assistências', rowsA, 'assists', 'Assist.')}${tbl('Mais jogos', rowsJ, 'apps', 'Jogos')}</div>`;
}
act('statScope', (el) => { UI.statScope = el.dataset.k; render(); });
act('statComp', (el) => { UI.statComp = +el.value; render(); });

// ------------------------------------------------------------------ national call-ups
function viewCallup() {
  const t = S.teams[S.user.team];
  const n = S.nations[t.code];
  const sq = new Set(n.sq || []);
  const pool = Object.values(S.players).filter((p) => p.nat === t.code && p.yth !== -1).sort((a, b) => POSITIONS.indexOf(a.p) - POSITIONS.indexOf(b.p) || b.o - a.o);
  return `<div class="row wrap" style="margin-bottom:10px"><span class="chip">${sq.size}/26 convocados</span><span class="muted" style="font-size:13px">Jogadores de ${esc(natName(t.code))} em qualquer clube do mundo.</span><span class="grow"></span><button class="btn sm" data-a="autoCall">Convocação automática</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Nome</th><th>Pos</th><th class="n">Idade</th><th class="c">OVR</th><th>Clube</th><th>Condição</th></tr></thead><tbody>
    ${pool.slice(0, 120).map((p) => `<tr class="${sq.has(p.id) ? 'me' : ''}"><td><input type="checkbox" ${sq.has(p.id) ? 'checked' : ''} data-a="toggleCall" data-id="${p.id}" aria-label="Convocar ${esc(p.n)}"></td>
      <td><span data-a="openPlayer" data-id="${p.id}" style="cursor:pointer">${esc(p.n)}</span>${statusFlags(p)}</td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td class="c nw">${ovrBadge(p.o)}${formTag(p)}</td><td>${p.t ? esc(teamName(p.t)) : 'Clube local'}</td><td>${fitBar(p)}</td></tr>`).join('')}
    </tbody></table></div>`;
}
act('toggleCall', (el) => {
  const t = S.teams[S.user.team];
  const n = S.nations[t.code];
  const id = +el.dataset.id;
  n.sq = n.sq || [];
  if (el.checked) { if (n.sq.length >= 26) { el.checked = false; toast('Máximo de 26 convocados.', true); return; } n.sq.push(id); }
  else { n.sq = n.sq.filter((x) => x !== id); t.xi = t.xi.map((x) => (x === id ? 0 : x)); t.bench = (t.bench || []).filter((x) => x !== id); }
  render();
});
act('autoCall', () => { const t = S.teams[S.user.team]; autoCallUp(t.code, true); render(); toast('Convocação atualizada.'); });

/* ===================== player modal & negotiations ===================== */
function playerAvatar(p, size = 84) {
  const t = S.teams[p.t] || null;
  const kit = t ? t.c1 : '#5b6b72', kit2 = t ? t.c2 : '#cfd8dc';
  const h = hashStr(p.n);
  const skins = ['#f1c9a5', '#e0ac85', '#c68b62', '#a8683f', '#7d4a2a', '#5a3420'];
  const groupDark = ['NGA', 'GHA', 'CIV', 'SEN', 'CMR', 'MLI', 'COD', 'BFA', 'GUI', 'GAB', 'ANG', 'ZAM', 'TOG', 'BEN', 'JAM', 'HAI', 'CUW', 'RSA', 'CPV', 'GAM', 'GNB', 'EQG', 'KEN', 'UGA', 'MOZ', 'ZIM', 'TRI', 'SUR'];
  let si = h % 4;
  if (groupDark.includes(p.nat)) si = 3 + (h % 3);
  if (p.nat === 'BRA' || p.nat === 'COL') si = (h % 6);
  const skin = skins[si];
  const hair = ['#1b1410', '#2b1d14', '#4a3020', '#7a5230', '#c8a060', '#111'][(h >> 4) % 6];
  const style = (h >> 7) % 4;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.06)"/>
    <path d="M14 100 C16 76 30 68 50 68 C70 68 84 76 86 100Z" fill="${kit}"/><path d="M40 68 L50 80 L60 68" fill="${kit2}"/>
    <rect x="43" y="56" width="14" height="14" rx="5" fill="${skin}"/><ellipse cx="50" cy="42" rx="17" ry="20" fill="${skin}"/>
    ${style === 0 ? `<path d="M33 38 C33 22 67 22 67 38 C64 30 36 30 33 38Z" fill="${hair}"/>` : style === 1 ? `<path d="M32 40 C30 18 70 18 68 40 C66 26 34 26 32 40Z" fill="${hair}"/><path d="M33 36 L31 46 L35 44Z" fill="${hair}"/><path d="M67 36 L69 46 L65 44Z" fill="${hair}"/>` : style === 2 ? `<ellipse cx="50" cy="26" rx="16" ry="7" fill="${hair}"/>` : `<path d="M34 34 C36 22 64 22 66 34 L66 30 C60 24 40 24 34 30Z" fill="${hair}"/>`}
    <circle cx="44" cy="44" r="1.8" fill="#1a1a1a"/><circle cx="56" cy="44" r="1.8" fill="#1a1a1a"/><path d="M45 53 Q50 56 55 53" stroke="#5a3a2a" stroke-width="1.5" fill="none"/></svg>`;
}
function attrBars(p) {
  const labels = p.p === 'GK' ? ['MER', 'MAN', 'CHU', 'REF', 'VEL', 'POS'] : ['RIT', 'FIN', 'PAS', 'DRI', 'DEF', 'FÍS'];
  return `<div class="col" style="gap:6px">${(p.a || []).map((v, i) => {
    const col = v >= 80 ? 'var(--win)' : v >= 70 ? '#c9d84a' : v >= 60 ? 'var(--warn)' : 'var(--loss)';
    return `<div class="attr"><span class="muted">${labels[i]}</span><span class="bar"><i style="width:${clamp(v, 0, 100)}%;background:${col}"></i></span><b class="tnum">${v}</b></div>`;
  }).join('')}</div>`;
}
function playerSeasonRows(p) {
  const rows = [];
  for (const k in (p.st || {})) {
    const c = S.comps[k];
    const r = p.st[k];
    if (!c) continue;
    rows.push(`<tr><td>${compBadge(c, 18)} ${esc(c.name)}</td><td class="n">${r[0]}</td><td class="n">${r[1]}</td><td class="n">${r[2]}</td><td class="n">${r[0] ? (r[6] / r[0]).toFixed(1) : '-'}</td></tr>`);
  }
  return rows.join('');
}
act('openPlayer', (el) => { const p = S.players[+el.dataset.id]; if (p) openPlayerModal(p.id); });
function openPlayerModal(pid) {
  openModal(() => {
    const p = S.players[pid];
    if (!p) return modalShell('Jogador', '<div class="empty">Jogador não encontrado.</div>');
    const t = S.teams[p.t];
    const uid = S.user.team;
    const ut = S.teams[uid];
    const mine = !S.coach.unemployed && ut && !ut.isNat && p.t === uid;
    const natMode = ut && ut.isNat;
    const val = playerValue(p);
    const yth = p.yth > 0;
    let actions = '';
    if (natMode) {
      const n = S.nations[ut.code];
      if (p.nat === ut.code) actions = (n.sq || []).includes(p.id) ? `<button class="btn" data-a="pCall" data-id="${p.id}" data-v="0">Desconvocar</button>` : `<button class="btn primary" data-a="pCall" data-id="${p.id}" data-v="1">Convocar</button>`;
    } else if (S.coach.unemployed) {
      actions = '';
    } else if (mine) {
      actions = `<button class="btn sm" data-a="pTL" data-id="${p.id}">${p.tl ? 'Tirar da lista de transferências' : 'Colocar na lista de transferências'}</button>
        <button class="btn sm" data-a="pLL" data-id="${p.id}">${p.ll ? 'Tirar da lista de empréstimo' : 'Lista de empréstimo'}</button>
        <button class="btn sm" data-a="pRenew" data-id="${p.id}">Renovar contrato</button>
        <button class="btn sm" data-a="pNumber" data-id="${p.id}">Mudar camisa</button>
        <button class="btn sm" data-a="pPos" data-id="${p.id}">${p.pc ? 'Treino de posição' : 'Mudar posição'}</button>
        <button class="btn sm danger" data-a="pRelease" data-id="${p.id}">Liberar</button>`;
    } else if (!yth && p.yth !== -1) {
      const short = S.tr.short.includes(p.id);
      actions = `${p.t ? `<button class="btn primary sm" data-a="pBid" data-id="${p.id}">Fazer proposta</button><button class="btn sm" data-a="pLoan" data-id="${p.id}">Pedir empréstimo</button>` : `<button class="btn primary sm" data-a="pFree" data-id="${p.id}">Contratar (sem custo)</button>`}
        <button class="btn sm" data-a="pShort" data-id="${p.id}">${short ? 'Remover dos observados' : 'Observar'}</button>`;
    }
    const career = p.car || [0, 0, 0];
    return modalShell(esc(p.n), `
      <div class="row wrap" style="gap:18px;align-items:flex-start">
        ${playerAvatar(p, 104)}
        <div class="grow" style="min-width:220px">
          <div class="row wrap">${ovrBadge(p.o)}${formTag(p, true)} ${posBadge(p.p)} ${p.alt ? `<span class="muted" style="font-size:13px">também ${p.alt.split(',').map((x) => POS_PT[x] || x).join(', ')}</span>` : ''}</div>
          <div class="kv" style="margin-top:10px">
            <span class="k">Clube</span><span>${t ? `<span data-a="openTeam" data-id="${t.id}" style="cursor:pointer">${crest(t, 18)} ${esc(t.n)}</span>` : yth ? 'Base (academia)' : p.natOnly ? 'Clube local' : 'Sem clube'}${p.loan ? ` <span class="muted">(emprestado ${esc(tA(p.loan.from, 'pelo'))}${p.loan.o != null ? ` · overall ${p.loan.o} → ${p.o} em ${Math.round(p.loan.g || 0)} jogos` : ''})</span>` : ''}</span>
            ${p.t || mine ? `<span class="k">Fase</span><span>${formLine(p)}</span>` : ''}
            ${p.pc ? `<span class="k">Treino de posição</span><span>${posBadge(p.pc.to)} ${Math.round(posChangeProgress(p) * 100)}% · conclui em ${fmtDate(p.pc.d0 + p.pc.days, 'short')} · overall previsto ${p.pc.o}</span>` : ''}
            <span class="k">Nacionalidade</span><span>${natFlag(p.nat)} ${esc(natName(p.nat))}</span>
            <span class="k">Idade</span><span>${p.age} anos · ${p.h} cm · pé ${p.f === 'L' ? 'esquerdo' : 'direito'}</span>
            <span class="k">Potencial</span><span>${mine || yth ? p.pot : `${clamp(p.pot - 2, p.o, 99)}–${clamp(p.pot + 2, p.o, 99)}`}</span>
            <span class="k">Valor de mercado</span><span>${money(val)}</span>
            ${p.t ? `<span class="k">Salário</span><span>${money(p.w || 0)}/semana</span><span class="k">Contrato até</span><span>${p.ct || '—'}</span>` : ''}
            <span class="k">Condição</span><span>${fitBar(p)} ${Math.round(fitnessNow(p))}% ${isInjured(p) ? `<span class="flag-inj">· ${esc(p.injN || 'Lesionado')} até ${fmtDate(p.inj, 'short')}</span>` : ''}${isSuspended(p) ? ' <span class="flag-sus">· suspenso</span>' : ''}</span>
            ${mine ? `<span class="k">Moral</span><span>${Math.round(p.mor || 70)}/100${p.cnp ? ` · ${p.cnp} jogos sem atuar` : ''}</span>` : ''}
          </div>
        </div>
        <div style="min-width:220px;flex:1">${attrBars(p)}</div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div><h3 style="font-size:18px;margin-bottom:6px">Temporada</h3>${playerSeasonRows(p) ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Competição</th><th class="n">J</th><th class="n">G</th><th class="n">A</th><th class="n">Nota</th></tr></thead><tbody>${playerSeasonRows(p)}</tbody></table></div>` : '<div class="muted">Sem jogos nesta temporada.</div>'}</div>
        <div><h3 style="font-size:18px;margin-bottom:6px">Carreira no jogo</h3><div class="grid g3"><div class="stat-tile"><div class="k">Jogos</div><div class="v">${career[0]}</div></div><div class="stat-tile"><div class="k">Gols</div><div class="v">${career[1]}</div></div><div class="stat-tile"><div class="k">Assist.</div><div class="v">${career[2]}</div></div></div></div>
      </div>`, actions ? `<div class="row wrap" style="gap:8px;justify-content:flex-end">${actions}</div>` : '', '');
  });
}
act('pTL', (el) => { const p = S.players[+el.dataset.id]; p.tl = p.tl ? 0 : 1; if (p.tl) p.ll = 0; refreshModal(); toast(p.tl ? `${p.n} está à venda.` : `${p.n} saiu da lista.`); });
act('pLL', (el) => { const p = S.players[+el.dataset.id]; p.ll = p.ll ? 0 : 1; if (p.ll) p.tl = 0; refreshModal(); toast(p.ll ? `${p.n} disponível para empréstimo.` : `${p.n} saiu da lista de empréstimo.`); });
act('pShort', (el) => { const id = +el.dataset.id; S.tr.short = S.tr.short.includes(id) ? S.tr.short.filter((x) => x !== id) : S.tr.short.concat(id); refreshModal(); });
act('pCall', (el) => {
  const t = S.teams[S.user.team]; const n = S.nations[t.code]; const id = +el.dataset.id;
  n.sq = n.sq || [];
  if (el.dataset.v === '1') { if (n.sq.length >= 26) { toast('Máximo de 26 convocados.', true); return; } n.sq.push(id); }
  else { n.sq = n.sq.filter((x) => x !== id); t.xi = t.xi.map((x) => (x === id ? 0 : x)); t.bench = (t.bench || []).filter((x) => x !== id); }
  refreshModal(); render();
});
act('pNumber', (el) => {
  const p = S.players[+el.dataset.id];
  const used = squadOf(p.t).filter((x) => x.id !== p.id).map((x) => x.num);
  openModal(modalShell('Mudar número da camisa', `<form class="row" data-a="pNumberSave" data-id="${p.id}"><input class="input" id="num-in" type="number" min="1" max="99" value="${p.num || ''}" style="max-width:120px"><button class="btn primary" type="submit">Salvar</button></form>
    <p class="muted" style="font-size:13px">Números em uso: ${used.sort((a, b) => a - b).join(', ')}</p>`), { size: 'narrow' });
});
act('pNumberSave', (el) => {
  const p = S.players[+el.dataset.id];
  const n = clamp(+($('#num-in').value) || 0, 1, 99);
  const other = squadOf(p.t).find((x) => x.id !== p.id && x.num === n);
  if (other) other.num = p.num;
  p.num = n;
  closeModal(); refreshModal(); render();
  toast(`${p.n} agora veste a ${n}${other ? ` (${other.n} ficou com a ${other.num})` : ''}.`);
});
act('pRelease', (el) => {
  const p = S.players[+el.dataset.id];
  const weeks = Math.max(0, ((p.ct || seasonEndYear()) - seasonEndYear()) * 52 + 26);
  const cost = Math.round((p.w || 0) * weeks * 0.5);
  openModal(modalShell(`Liberar ${esc(p.n)}?`, `<p>Rescindir o contrato custa cerca de <b>${money(cost)}</b> do orçamento.</p>`, `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="pReleaseOk" data-id="${p.id}">Liberar</button>`), { size: 'narrow' });
});
act('pReleaseOk', (el) => {
  const p = S.players[+el.dataset.id];
  const cost = releaseFromUser(p);
  closeAllModals(); render();
  toast(`${p.n} foi liberado (custo ${money(cost)}).`);
});

// ---------- negotiations UI
act('pRenew', (el) => openContractModal(+el.dataset.id, 'renew'));
act('pFree', (el) => openContractModal(+el.dataset.id, 'free'));
act('pBid', (el) => openBidModal(+el.dataset.id, false));
act('pLoan', (el) => openBidModal(+el.dataset.id, true));
function openBidModal(pid, loan) {
  const p = S.players[pid];
  const ask = askingPrice(p);
  const ut = S.teams[S.user.team];
  UI.neg = { pid, loan, fee: loan ? 0 : roundMoney(playerValue(p)), msg: '', stage: 'club' };
  openModal(() => {
    const n = UI.neg;
    return modalShell(loan ? `Empréstimo: ${esc(p.n)}` : `Proposta por ${esc(p.n)}`, `
      <div class="row wrap">${crest(p.t, 30)}<b>${esc(teamName(p.t))}</b><span class="muted">· valor ${money(playerValue(p))} · contrato até ${p.ct}</span></div>
      ${windowInfo().open ? '' : `<div class="chip" style="margin-top:10px;color:var(--warn)">${windowInfo().text}</div>`}
      ${loan ? '<p>Empréstimo até o fim da temporada. Você paga o salário do jogador.</p>' : `
      <div class="field" style="margin-top:14px"><label for="bid-fee">Valor da proposta</label>
      <div class="row"><input id="bid-fee" class="input" type="number" min="0" step="100000" value="${n.fee}" style="max-width:220px"><span class="muted">${money(n.fee)} · seu orçamento: ${money(ut.budget)}</span></div></div>`}
      ${n.msg ? `<div class="panel" style="margin-top:12px;background:var(--panel2)">${esc(n.msg)}</div>` : ''}`,
      `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="sendBid">${loan ? 'Pedir empréstimo' : 'Enviar proposta'}</button>`);
  });
}
act('sendBid', () => {
  const n = UI.neg;
  const p = S.players[n.pid];
  if (!n.loan) n.fee = Math.max(0, Math.round(+($('#bid-fee').value) || 0));
  const r = clubResponse(p, n.fee, n.loan);
  if (r.ok) {
    closeModal();
    openContractModal(p.id, n.loan ? 'loan' : 'transfer', n.fee);
    toast(`${teamName(p.t)} aceitou! Agora negocie com o jogador.`);
    return;
  }
  n.msg = r.msg + (r.counter ? ` Contraproposta: ${money(r.counter)}.` : '');
  if (r.counter) n.fee = r.counter;
  refreshModal();
});
function openContractModal(pid, kind, fee = 0) {
  const p = S.players[pid];
  const ut = S.teams[S.user.team];
  const demand = playerWageDemand(p, ut, 'titular');
  UI.ctr = { pid, kind, fee, wage: kind === 'renew' ? Math.max(p.w || 0, demand) : demand, years: kind === 'loan' ? 1 : 3, role: 'titular', msg: '' };
  openModal(() => {
    const c = UI.ctr;
    const title = kind === 'renew' ? `Renovar com ${esc(p.n)}` : kind === 'loan' ? `Salário no empréstimo de ${esc(p.n)}` : `Contrato de ${esc(p.n)}`;
    return modalShell(title, `
      <div class="row wrap">${ovrBadge(p.o)} ${posBadge(p.p)}<b>${esc(p.n)}</b><span class="muted">${p.age} anos · salário atual ${money(p.w || 0)}/sem</span></div>
      <div class="grid g3" style="margin-top:14px">
        <div class="field"><label for="ct-w">Salário semanal</label><input id="ct-w" class="input" type="number" min="0" step="500" value="${c.wage}"></div>
        <div class="field"><label for="ct-y">Duração</label><select id="ct-y" class="input" ${kind === 'loan' ? 'disabled' : ''}>${[1, 2, 3, 4, 5].map((y) => `<option value="${y}" ${y === c.years ? 'selected' : ''}>${y} ${y === 1 ? 'ano' : 'anos'}</option>`).join('')}</select></div>
        <div class="field"><label for="ct-r">Papel no elenco</label><select id="ct-r" class="input">${[['titular', 'Titular'], ['rotacao', 'Rotação'], ['reserva', 'Reserva']].map(([k, l]) => `<option value="${k}" ${k === c.role ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
      <p class="muted" style="font-size:13px">Folha atual ${money(wageBill(ut.id))} de ${money(ut.wb)}/semana. ${fee ? `Taxa acordada: ${money(fee)}.` : ''}</p>
      ${c.msg ? `<div class="panel" style="background:var(--panel2)">${esc(c.msg)}${c.wbNeed ? `<div class="row wrap" style="gap:8px;margin-top:8px"><button class="btn sm primary" data-a="ctrRaiseWb" ${wageRaiseCost(c.wbNeed) > ut.budget ? 'disabled' : ''}>Ampliar a folha em ${money(c.wbNeed)}/sem e assinar</button><span class="muted" style="font-size:13px">custa ${money(wageRaiseCost(c.wbNeed))} do orçamento (${money(ut.budget)} disponíveis)</span></div>` : ''}</div>` : ''}`,
      `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="sendContract">Oferecer contrato</button>`);
  });
}
act('sendContract', () => sendContract());
act('ctrRaiseWb', () => {
  const c = UI.ctr;
  const r = raiseWageBudget(S.teams[S.user.team], c.wbNeed);
  if (!r.ok) { toast(r.msg, true); return; }
  toast(r.msg);
  sendContract();
});
function sendContract() {
  const c = UI.ctr;
  c.wbNeed = 0;
  const p = S.players[c.pid];
  const ut = S.teams[S.user.team];
  c.wage = Math.max(0, Math.round(+($('#ct-w').value) || 0));
  c.years = +($('#ct-y').value) || 1;
  c.role = $('#ct-r').value;
  if (c.kind === 'renew') {
    const r = renewContract(p, c.wage, c.years);
    if (r.ok) { closeModal(); refreshModal(); toast(r.msg); render(); return; }
    c.msg = r.msg + (r.demand ? ` Pedido: ${money(r.demand)}/sem.` : '');
    if (r.demand) c.wage = r.demand;
    refreshModal(); return;
  }
  const r = playerContractResponse(p, ut, c.wage, c.years, c.role);
  if (!r.ok) { c.msg = r.msg + (r.demand ? ` Pedido: ${money(r.demand)}/sem.` : ''); if (r.demand) c.wage = r.demand; refreshModal(); return; }
  const done = userSign(p, c.fee || 0, c.wage, c.years, c.kind === 'loan');
  if (!done.ok) { c.msg = done.msg; c.wbNeed = done.wbNeed || 0; refreshModal(); return; }
  closeAllModals();
  render();
  toast(done.msg);
}
// ---------- position change
act('pPos', (el) => {
  const pid = +el.dataset.id;
  openModal(() => {
    const p = S.players[pid];
    if (p.pc) {
      const pr = posChangeProgress(p);
      return modalShell(`Treino de posição · ${esc(p.n)}`, `
        <div class="row wrap" style="gap:8px">${posBadge(p.p)} → ${posBadge(p.pc.to)} <b>${esc(POS_LONG[p.pc.to])}</b></div>
        <div style="height:10px;border-radius:5px;background:var(--panel3);overflow:hidden;margin:14px 0 8px"><i style="display:block;height:100%;width:${Math.round(pr * 100)}%;background:var(--accent-hi)"></i></div>
        <p class="muted" style="margin:0">${Math.round(pr * 100)}% concluído · termina em ${fmtDate(p.pc.d0 + p.pc.days, 'long')} · overall previsto na nova posição: <b>${p.pc.o}</b> (hoje ${p.o}).
        Enquanto treina, ele já rende cada vez melhor como ${esc(POS_LONG[p.pc.to].toLowerCase())}.</p>`,
        `<button class="btn danger" data-a="pPosCancel" data-id="${p.id}">Cancelar treino</button><button class="btn primary" data-a="closeModal">Fechar</button>`);
    }
    const opts = POSITIONS.filter((x) => x !== p.p && (x === 'GK') === (p.p === 'GK'));
    const rows = opts.map((to) => {
      const c = posSimilarity(p.p, to), sec = p.alt && p.alt.split(',').includes(to);
      const o1 = posChangeOvr(p, to), d = o1 - p.o;
      return { to, c: sec ? 1 : c, sec, days: posChangeDays(p, to), o1, d };
    }).sort((a, b) => b.c - a.c || b.o1 - a.o1);
    return modalShell(`Mudar posição · ${esc(p.n)}`, `
      <p class="muted" style="margin-top:0">Hoje: ${posBadge(p.p)} ${esc(POS_LONG[p.p])}, overall ${p.o}. Quanto mais parecida a posição, mais rápido ele aprende. Ao terminar, a posição atual vira secundária e o overall é recalculado pelos atributos.</p>
      <div class="col" style="gap:6px">${rows.map((r) => `<button class="pos-opt" data-a="pPosGo" data-id="${p.id}" data-to="${r.to}">
        ${posBadge(r.to)}<span class="grow"><b>${esc(POS_LONG[r.to])}</b><span class="muted" style="font-size:12px;display:block">${r.sec ? 'já é posição secundária' : `posição ${posChangeLabel(r.c)}`} · ${weeksTxt(r.days)} de treino</span></span>
        <span class="tnum" style="text-align:right">${ovrBadge(r.o1)}<span style="display:block;font-size:12px;color:${r.d > 0 ? 'var(--win)' : r.d < 0 ? 'var(--loss)' : 'var(--muted)'}">${r.d > 0 ? '+' : ''}${r.d}</span></span></button>`).join('')}</div>`, '');
  }, { size: 'narrow' });
});
act('pPosGo', (el) => {
  const p = S.players[+el.dataset.id];
  const r = startPosChange(p, el.dataset.to);
  toast(r.msg, !r.ok);
  if (r.ok) { closeModal(); refreshModal(); render(); }
});
act('pPosCancel', (el) => { cancelPosChange(S.players[+el.dataset.id]); closeModal(); refreshModal(); render(); toast('Treino de posição cancelado.'); });

/* ===================== transfers ===================== */
function viewTransfers() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const sub = UI.sub.transfers || 'search';
  const offers = S.tr.offers.filter((o) => o.status === 'open');
  const tabs = [['search', 'Buscar jogadores'], ['short', `Observados (${S.tr.short.length})`], ['offers', `Propostas recebidas${offers.length ? ` (${offers.length})` : ''}`], ['log', 'Movimentações']];
  const w = windowInfo();
  const ut = S.teams[S.user.team];
  let body = '';
  if (sub === 'search') body = viewSearch();
  else if (sub === 'short') body = viewPlayerTable(S.tr.short.map((id) => S.players[id]).filter(Boolean));
  else if (sub === 'offers') body = viewOffersIn();
  else body = viewTransferLog();
  return `<div class="row wrap" style="margin-bottom:12px"><h2 style="font-size:34px;font-weight:800">Transferências</h2>
      <span class="chip" style="${w.open ? 'color:var(--win)' : 'color:var(--warn)'}">${w.text}</span><span class="grow"></span>
      <span class="chip">Orçamento ${money(ut.budget)}</span><span class="chip">Folha ${money(wageBill(ut.id))} / ${money(ut.wb)}</span><button class="btn xs" data-a="goFinance" title="Passar verba de transferências para a folha salarial">Remanejar verba</button></div>
    <div class="subtabs">${tabs.map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="subtab" data-g="transfers" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}
function searchResults() {
  const f = UI.filters;
  const pos = f.pos || 'all';
  const q = strip(f.q || '');
  const uid = S.user.team;
  const list = [];
  for (const id in S.players) {
    const p = S.players[id];
    if (p.t === uid || p.yth || p.natOnly) continue;
    if (p.t && S.teams[p.t] && S.teams[p.t].isNat) continue;
    if (pos !== 'all' && p.p !== pos) continue;
    if (f.free && p.t) continue;
    if (f.listed && !p.tl) continue;
    if (f.amin && p.age < f.amin) continue;
    if (f.amax && p.age > f.amax) continue;
    if (f.omin && p.o < f.omin) continue;
    if (q && !strip(p.n).includes(q)) continue;
    list.push(p);
  }
  list.sort(by((p) => p.o, -1));
  return list;
}
function viewSearch() {
  const f = UI.filters;
  const pos = f.pos || 'all';
  const all = searchResults();
  const maxV = f.vmax ? f.vmax * 1e6 : 0;
  const filtered = maxV ? all.filter((p) => playerValue(p) <= maxV) : all;
  if (f.page && filtered.length <= 150) f.page = 0;
  const page = f.page || 0;
  const slice = filtered.slice(page * 150, page * 150 + 150);
  return `<div class="panel" style="margin-bottom:12px">
      <div class="row wrap" style="gap:6px;margin-bottom:10px">${['all'].concat(POSITIONS).map((p) => `<button class="chip ${pos === p ? 'on' : ''}" data-a="fPos" data-v="${p}">${p === 'all' ? 'Todas' : POS_PT[p]}</button>`).join('')}</div>
      <div class="grid g4">
        <div class="field"><label for="f-q">Nome</label><input id="f-q" class="input" placeholder="Buscar" value="${esc(f.q || '')}" data-a="fQ" data-live="1"></div>
        <div class="field"><label>Idade</label><div class="row"><input class="input" type="number" min="14" max="45" placeholder="mín" value="${f.amin || ''}" data-a="fNum" data-k="amin"><input class="input" type="number" min="14" max="45" placeholder="máx" value="${f.amax || ''}" data-a="fNum" data-k="amax"></div></div>
        <div class="field"><label for="f-omin">Overall mínimo</label><input id="f-omin" class="input" type="number" min="40" max="99" value="${f.omin || ''}" data-a="fNum" data-k="omin"></div>
        <div class="field"><label for="f-vmax">Valor máximo (€ milhões)</label><input id="f-vmax" class="input" type="number" min="0" value="${f.vmax || ''}" data-a="fNum" data-k="vmax"></div>
      </div>
      <div class="row wrap" style="margin-top:10px"><label class="toggle"><input type="checkbox" data-a="fBool" data-k="free" ${f.free ? 'checked' : ''}><span class="sw"></span>Somente sem clube</label>
        <label class="toggle"><input type="checkbox" data-a="fBool" data-k="listed" ${f.listed ? 'checked' : ''}><span class="sw"></span>Somente à venda</label>
        <span class="grow"></span><div class="seg"><button class="${page === 0 ? 'on' : ''}" data-a="fPage" data-v="0">1–150</button><button class="${page === 1 ? 'on' : ''}" data-a="fPage" data-v="1" ${filtered.length <= 150 ? 'disabled style="opacity:0.4;cursor:default"' : ''}>151–300</button></div></div>
    </div>
    <div id="search-list">${viewPlayerTable(slice, page * 150)}</div>
    <p class="muted" style="font-size:13px">${filtered.length} jogadores encontrados${pos !== 'all' ? ` em ${POS_LONG[pos]}` : ''}. Mostrando os ${Math.min(150, slice.length)} melhores desta página.</p>`;
}
function viewPlayerTable(list, offset = 0) {
  if (!list.length) return '<div class="panel empty">Nenhum jogador.</div>';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th class="c">OVR</th><th>Pos</th><th>Nome</th><th class="n">Idade</th><th>Nac.</th><th>Clube</th><th class="n">POT</th><th class="n">Valor</th><th></th></tr></thead><tbody>
    ${list.map((p, i) => `<tr class="click" data-a="openPlayer" data-id="${p.id}"><td class="dim">${offset + i + 1}</td><td class="c">${ovrBadge(p.o)}</td><td>${posBadge(p.p)}</td><td><b>${esc(p.n)}</b>${p.tl ? ' <span class="chip">À VENDA</span>' : ''}</td><td class="n">${p.age}</td><td>${natFlag(p.nat)}</td>
      <td>${p.t ? `<span class="team-cell">${crest(p.t, 18)}<span class="tn">${esc(teamName(p.t))}</span></span>` : '<span class="chip">Livre</span>'}</td><td class="n">${clamp(p.pot - 1, p.o, 99)}–${clamp(p.pot + 2, p.o, 99)}</td><td class="n">${money(playerValue(p))}</td><td class="n"><span class="btn xs">Ver</span></td></tr>`).join('')}
  </tbody></table></div>`;
}
act('fPos', (el) => { UI.filters.pos = el.dataset.v; UI.filters.page = 0; render(); });
act('fPage', (el) => { UI.filters.page = +el.dataset.v; render(); });
act('fNum', (el) => { UI.filters[el.dataset.k] = +el.value || 0; UI.filters.page = 0; render(); });
act('fBool', (el) => { UI.filters[el.dataset.k] = el.checked; UI.filters.page = 0; render(); });
let qTimer = 0;
act('fQ', (el) => {
  UI.filters.q = el.value; UI.filters.page = 0;
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    const list = searchResults();
    const box = $('#search-list');
    if (box) box.innerHTML = viewPlayerTable(list.slice(0, 150));
  }, 180);
});
function viewOffersIn() {
  const offers = S.tr.offers.filter((o) => o.status === 'open').sort(by((o) => o.d, -1));
  if (!offers.length) return '<div class="panel empty">Nenhuma proposta aberta. Coloque jogadores na lista de transferências ou de empréstimo para atrair interessados.</div>';
  return `<div class="col">${offers.map((o) => {
    const p = S.players[o.pid];
    if (!p) return '';
    return `<div class="panel"><div class="row wrap">${crest(o.from, 34)}<div class="grow"><b>${esc(teamName(o.from))}</b> quer ${playerLink(p)} <span class="muted">(${p.o} · ${POS_PT[p.p]} · valor ${money(playerValue(p))})</span><div class="muted" style="font-size:13px">${fmtDate(o.d, 'dm')} · ${o.loan ? 'Empréstimo até o fim da temporada' : `Oferta: <b style="color:var(--text)">${money(o.fee)}</b>`}</div></div>
      <button class="btn sm primary" data-a="offerAct" data-o="${o.id}" data-x="accept">Aceitar</button><button class="btn sm" data-a="offerAct" data-o="${o.id}" data-x="reject">Recusar</button>
      ${o.loan ? '' : `<input class="input" style="max-width:150px" id="ctr-${o.id}" type="number" min="0" step="100000" value="${Math.round(o.fee * 1.2)}"><button class="btn sm" data-a="offerAct" data-o="${o.id}" data-x="counter">Contrapropor</button>`}</div></div>`;
  }).join('')}</div>`;
}
function viewTransferLog() {
  const log = S.tr.log.slice(0, 150);
  if (!log.length) return '<div class="panel empty">Nenhuma transferência ainda nesta temporada.</div>';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Jogador</th><th class="c">OVR</th><th>De</th><th>Para</th><th class="n">Valor</th></tr></thead><tbody>
    ${log.map((r) => `<tr class="${r.to === S.user.team || r.from === S.user.team ? 'me' : ''}"><td>${fmtDate(r.d, 'short')}</td><td>${S.players[r.pid] ? `<span data-a="openPlayer" data-id="${r.pid}" style="cursor:pointer">${esc(r.n)}</span>` : esc(r.n)}</td><td class="c">${ovrBadge(r.o)}</td>
      <td>${r.from ? `<span class="team-cell">${crest(r.from, 18)}<span class="tn">${esc(teamName(r.from))}</span></span>` : 'Sem clube'}</td><td><span class="team-cell">${crest(r.to, 18)}<span class="tn">${esc(teamName(r.to))}</span></span></td>
      <td class="n">${r.loan ? 'Empréstimo' : r.fee ? money(r.fee) : 'Livre'}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ===================== academy ===================== */
function viewAcademy() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const sub = UI.sub.academy || 'scouts';
  const tabs = [['scouts', 'Olheiros'], ['reports', `Relatórios (${S.youth.reports.length})`], ['youth', `Base (${S.youth.squad.length})`], ['league', 'Campeonato Sub-19']];
  if (S.mode === 'normal') tabs.push(['copinha', 'Copinha']);
  let body = '';
  if (sub === 'scouts') body = viewScouts();
  else if (sub === 'reports') body = viewReports();
  else if (sub === 'youth') body = viewYouthSquad();
  else if (sub === 'copinha') body = viewCopinha();
  else body = viewYouthLeague();
  return `<div class="row wrap" style="margin-bottom:12px"><h2 style="font-size:34px;font-weight:800">Academia</h2><span class="muted">Jovens de 14 a 16 anos descobertos pelos seus olheiros em até 50 países.</span></div>
    <div class="subtabs">${tabs.map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="subtab" data-g="academy" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}
function scoutStars(l) { return '★'.repeat(l) + '☆'.repeat(5 - l); }
function viewScouts() {
  const mine = S.youth.scouts;
  const market = availableScouts();
  const countryOpts = (sel) => SCOUT_COUNTRIES.slice().sort((a, b) => natName(a).localeCompare(natName(b))).map((c) => `<option value="${c}" ${c === sel ? 'selected' : ''}>${esc(natName(c))} · talento ${'●'.repeat(Math.round(COUNTRY_TALENT[c] || 2))}</option>`).join('');
  return `<div class="grid g2">
    <div class="panel"><h3>Seus olheiros <span class="sub">${mine.length}/4</span></h3>
      ${mine.length ? mine.map((sc) => `<div class="col" style="padding:10px 0;border-bottom:1px solid var(--line)">
        <div class="row"><b>${esc(sc.n)}</b><span class="stars">${scoutStars(sc.lvl)}</span><span class="grow"></span><span class="muted" style="font-size:13px">${sc.found} achados</span><button class="btn xs danger" data-a="fireScout" data-id="${sc.id}">Dispensar</button></div>
        ${sc.country ? `<div class="muted" style="font-size:14px">Observando ${natFlag(sc.country)} ${esc(natName(sc.country))} até ${fmtDate(sc.until, 'dm')}</div>` : '<div class="muted" style="font-size:14px">Sem missão</div>'}
        <div class="row wrap"><select class="input" id="sc-c-${sc.id}" style="max-width:260px">${countryOpts(sc.country)}</select>
          <select class="input" id="sc-m-${sc.id}" style="max-width:120px"><option value="1">1 mês</option><option value="3" selected>3 meses</option><option value="6">6 meses</option></select>
          <button class="btn sm primary" data-a="sendScout" data-id="${sc.id}">Enviar</button></div></div>`).join('') : '<div class="empty">Contrate olheiros ao lado para descobrir talentos.</div>'}
    </div>
    <div class="panel"><h3>Olheiros disponíveis</h3>
      ${market.map((sc) => `<div class="row" style="padding:9px 0;border-bottom:1px solid var(--line)"><b class="grow">${esc(sc.n)}</b><span class="stars">${scoutStars(sc.lvl)}</span><span class="muted">${money(sc.cost)}</span><button class="btn xs" data-a="hireScout" data-id="${sc.id}">Contratar</button></div>`).join('')}
      <p class="muted" style="font-size:13px">Mais estrelas = relatórios mais frequentes e potenciais mais precisos.</p></div>
  </div>`;
}
act('hireScout', (el) => { toast(hireScout(+el.dataset.id)); render(); });
act('fireScout', (el) => { fireScout(+el.dataset.id); render(); });
act('sendScout', (el) => {
  const id = +el.dataset.id;
  assignScout(id, $('#sc-c-' + id).value, +$('#sc-m-' + id).value);
  toast('Olheiro a caminho. Os relatórios chegam semanalmente na caixa de entrada.');
  render();
});
function viewReports() {
  const reps = S.youth.reports;
  if (!reps.length) return '<div class="panel empty">Nenhum relatório. Envie olheiros para algum país na aba Olheiros.</div>';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Jogador</th><th>Pos</th><th class="n">Idade</th><th>Nac.</th><th class="c">OVR</th><th class="n">Potencial</th><th>Olheiro</th><th></th></tr></thead><tbody>
    ${reps.map((r) => { const p = S.players[r.pid]; if (!p) return ''; return `<tr><td><b>${esc(p.n)}</b></td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td>${natFlag(p.nat)} ${esc(natName(p.nat))}</td><td class="c">${ovrBadge(p.o)}</td><td class="n"><b>${r.potLo}–${r.potHi}</b></td><td class="muted">${esc(r.scN)}</td>
      <td class="n"><button class="btn xs primary" data-a="signYouth" data-id="${r.id}">Contratar para a base</button> <button class="btn xs" data-a="dropRep" data-id="${r.id}">Dispensar</button></td></tr>`; }).join('')}
  </tbody></table></div>`;
}
act('signYouth', (el) => { toast(signProspect(+el.dataset.id)); render(); });
act('dropRep', (el) => { dismissProspect(+el.dataset.id); render(); });
function viewYouthSquad() {
  const ys = youthPlayers().sort(by((p) => p.o, -1));
  if (!ys.length) return '<div class="panel empty">A base está vazia. Contrate jovens a partir dos relatórios.</div>';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Jogador</th><th>Pos</th><th class="n">Idade</th><th>Nac.</th><th class="c">OVR</th><th class="n">POT</th><th></th></tr></thead><tbody>
    ${ys.map((p) => `<tr><td><span data-a="openPlayer" data-id="${p.id}" style="cursor:pointer;font-weight:700">${esc(p.n)}</span></td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td>${natFlag(p.nat)}</td><td class="c">${ovrBadge(p.o)}</td><td class="n">${p.pot}</td>
      <td class="n"><button class="btn xs primary" data-a="promote" data-id="${p.id}" ${p.age < 16 ? 'disabled title="Precisa ter 16 anos"' : ''}>Promover</button> <button class="btn xs" data-a="relYouth" data-id="${p.id}">Dispensar</button></td></tr>`).join('')}
  </tbody></table></div><p class="muted" style="font-size:13px">Os garotos evoluem a cada temporada e disputam o Campeonato Sub-19. A partir dos 16 anos podem subir para o profissional.</p>`;
}
act('promote', (el) => { toast(promoteYouth(+el.dataset.id)); render(); });
act('relYouth', (el) => { releaseYouth(+el.dataset.id); render(); });
function viewYouthLeague() {
  const c = S.active.map((id) => S.comps[id]).find((x) => x && x.kind === 'youth' && !x.copinha);
  if (!c) return '<div class="panel empty">Não há campeonato de base ativo agora.</div>';
  const tab = sortTable(c.table, c.teams);
  const recent = c.ym.filter((m) => m.hg !== null).slice(-10).reverse();
  return `<div class="grid g2"><div class="panel"><h3>${compBadge(c, 22)} ${esc(c.name)} <span class="sub">${esc(c.season)}</span></h3>${leagueTableHtml(c, tab, { youth: true })}</div>
    <div class="panel"><h3>Últimos resultados</h3>${recent.map((m) => `<div class="row" style="font-size:14px;padding:4px 0"><span class="grow" style="text-align:right">${esc(teamName(m.h))}</span><b class="tnum">${m.hg} - ${m.ag}</b><span class="grow">${esc(teamName(m.a))}</span></div>`).join('') || '<div class="muted">Ainda sem jogos.</div>'}</div></div>`;
}
// ---------- Copinha (Copa São Paulo de Futebol Júnior)
function viewCopinha() {
  const c = S.active.map((id) => S.comps[id]).find((x) => x && x.copinha);
  const hist = S.hist.filter((h) => h.key === 'COPINHA').slice(-10).reverse();
  const histHtml = hist.length ? `<div class="panel" style="margin-top:16px"><h3>Campeões</h3>${hist.map((h) => `<div class="row" style="padding:5px 0;border-bottom:1px solid var(--line);gap:8px"><span class="dim" style="width:44px">${esc(h.season)}</span>${S.teams[h.ch] ? crest(h.ch, 18) : ''}<span class="grow">${esc(h.chN)}</span>${h.ruN ? `<span class="muted" style="font-size:12px">vice: ${esc(h.ruN)}</span>` : ''}</div>`).join('')}</div>` : '';
  if (!c) return `<div class="panel empty">A Copa São Paulo de Futebol Júnior, a Copinha, reúne em janeiro os times sub-20 dos clubes brasileiros: fase de grupos, mata-mata e final em 25 de janeiro.</div>${histHtml}`;
  const uid = S.user.team;
  const gi = c.groups.findIndex((g) => g.teams.includes(uid));
  const showAll = !!UI.copAll;
  const groups = showAll ? c.groups : gi >= 0 ? [c.groups[gi]] : c.groups.slice(0, 2);
  const tieHtml = (t) => `<div class="tie ${t.a === uid || t.b === uid ? 'me' : ''}">
      <div class="tr ${t.w === t.a ? 'w' : ''}">${crest(t.a, 16)}<span>${esc(teamShort(t.a))}</span><span class="sc">${t.hg ?? ''}${t.pen ? `<span class="dim"> (${t.pen[0]})</span>` : ''}</span></div>
      <div class="tr ${t.w === t.b ? 'w' : ''}">${crest(t.b, 16)}<span>${esc(teamShort(t.b))}</span><span class="sc">${t.ag ?? ''}${t.pen ? `<span class="dim"> (${t.pen[1]})</span>` : ''}</span></div></div>`;
  const ko = c.ko.length ? `<div class="bracket ${showAll ? '' : 'top'}">${c.ko.map((rd) => {
    const ties = showAll || rd.ties.length <= 8 ? rd.ties : rd.ties.filter((t) => t.a === uid || t.b === uid);
    return `<div class="rnd"><h4>${esc(rd.name)} <span class="dim" style="font-size:11px">${fmtDate(rd.d, 'short')}</span></h4>${ties.map(tieHtml).join('') || `<div class="dim" style="font-size:12px">${rd.ties.length} confrontos</div>`}</div>`;
  }).join('')}</div>` : `<div class="muted">O mata-mata começa em ${fmtDate(c.koDates[0], 'long')}, com os dois primeiros de cada grupo.</div>`;
  const mine = (gi >= 0 ? c.ym.filter((m) => m.h === uid || m.a === uid) : []).map((m) => ({ d: m.d, h: m.h, a: m.a, hg: m.hg, ag: m.ag, n: 'Grupos' }))
    .concat(c.ko.flatMap((rd) => rd.ties.filter((t) => t.a === uid || t.b === uid).map((t) => ({ d: rd.d, h: t.a, a: t.b, hg: t.hg, ag: t.ag, pen: t.pen, n: rd.name }))));
  const scorers = S.youth.squad.map((id) => S.players[id]).filter((p) => p && p.st && p.st[c.id]).sort((a, b) => b.st[c.id][1] - a.st[c.id][1] || b.st[c.id][0] - a.st[c.id][0]);
  return `<div class="row wrap" style="margin-bottom:12px;gap:10px">${compBadge(c, 30)}<div class="grow"><b style="font-size:18px">${esc(c.full)} ${esc(c.season)}</b><div class="muted" style="font-size:13px">${c.teams.length} clubes · ${c.groups.length} grupos · os 2 primeiros avançam · mata-mata em jogo único, empate nos pênaltis · final em ${fmtDate(c.koDates[c.koDates.length - 1], 'long')}</div></div>
      ${c.done ? `<span class="chip on">Campeão: ${esc(teamName(c.champion))}</span>` : ''}<button class="btn sm" data-a="copAll">${showAll ? 'Só o meu time' : 'Ver todos os grupos'}</button></div>
    ${gi < 0 && uid && !S.coach.unemployed ? '<p class="muted" style="margin-top:0">Seu clube não disputa a Copinha (só clubes brasileiros).</p>' : ''}
    <div class="grid g2">${groups.map((g) => `<div class="panel"><h3>Grupo ${esc(g.name)}</h3>${leagueTableHtml(c, sortTable(g.table, g.teams), { noZones: true, youth: true })}</div>`).join('')}</div>
    ${mine.length ? `<div class="grid g2" style="margin-top:16px"><div class="panel"><h3>Jogos do seu time</h3>${mine.map((m) => `<div class="row" style="font-size:14px;padding:4px 0;gap:8px"><span class="dim" style="width:46px;font-size:12px">${fmtDate(m.d, 'short')}</span><span class="grow" style="text-align:right">${esc(teamName(m.h))}</span><b class="tnum">${m.hg === null ? 'x' : `${m.hg} - ${m.ag}`}</b><span class="grow">${esc(teamName(m.a))}</span>${m.pen ? `<span class="dim" style="font-size:12px">(${m.pen[0]}-${m.pen[1]} pên.)</span>` : ''}</div>`).join('')}</div>
      <div class="panel"><h3>Seus garotos</h3>${scorers.length ? scorers.slice(0, 10).map((p) => `<div class="row" style="font-size:14px;padding:3px 0;gap:8px">${posBadge(p.p)}<span class="grow">${esc(p.n)}</span><span class="muted">${p.st[c.id][0]} J</span><b>${p.st[c.id][1]} G</b></div>`).join('') : '<div class="muted">Com 8 ou mais jogadores na base, são eles que defendem o clube na Copinha (e evoluem jogando). Sem isso, o clube leva o seu sub-20 genérico.</div>'}</div></div>` : ''}
    <div class="panel" style="margin-top:16px"><h3>Mata-mata</h3>${ko}</div>${histHtml}`;
}
act('copAll', () => { UI.copAll = !UI.copAll; render(); });

/* ===================== office: tables, calendar, results, cups, gallery, board, jobs ===================== */
function viewOffice() {
  const sub = UI.sub.office || 'table';
  const nat = S.mode === 'national';
  const tabs = [['table', nat ? 'Grupos' : 'Classificação'], ['calendar', 'Calendário'], ['results', 'Resultados'], ['cups', nat ? 'Mata-mata' : 'Copas e torneios'], ['gallery', 'Galeria de títulos'], ['career', 'Carreira'], ['board', nat ? 'Federação' : 'Diretoria'], ['jobs', 'Mercado de trabalho']];
  if (!nat) tabs.push(['finance', 'Finanças']);
  let body = '';
  if (sub === 'table') body = viewTables();
  else if (sub === 'calendar') body = viewCalendar();
  else if (sub === 'results') body = viewResults();
  else if (sub === 'cups') body = viewCups();
  else if (sub === 'gallery') body = viewGallery();
  else if (sub === 'career') body = viewCareerStats();
  else if (sub === 'board') body = viewBoard();
  else if (sub === 'jobs') body = viewJobsTab();
  else if (sub === 'finance') body = viewFinance();
  return `<div class="row wrap" style="margin-bottom:12px"><h2 style="font-size:34px;font-weight:800">Escritório</h2></div>
    <div class="subtabs">${tabs.map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="subtab" data-g="office" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}

// ---------- league tables
function zoneFor(c, pos, n) {
  if (c.key && c.key.startsWith('UL')) {
    const tier = +c.key.slice(2) - 1;
    if (tier > 0 && pos <= 3) return 'zone-up';
    if (!S.zoeira && pos > n - 3) return 'zone-down';
    if (tier === 0 && pos === 1) return 'zone-lib';
    return '';
  }
  if (c.second) return pos <= (c.up || 3) ? 'zone-up' : '';
  if (c.kind !== 'league') return '';
  if (c.down && pos > n - c.down) return 'zone-down';
  return S.mode === 'normal' ? continentalZone(c, pos) : '';
}
function leagueTableHtml(c, tab, opts = {}) {
  const uid = S.user.team;
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Time</th><th class="n">J</th><th class="n">V</th><th class="n">E</th><th class="n">D</th><th class="n">GP</th><th class="n">GC</th><th class="n">SG</th><th class="n">Pts</th>${opts.youth ? '' : '<th>Últimos</th>'}</tr></thead><tbody>
    ${tab.map((r, i) => `<tr class="click ${r.id === uid ? 'me' : ''} ${opts.noZones ? '' : zoneFor(c, i + 1, tab.length)}" data-a="openTeam" data-id="${r.id}"><td>${i + 1}</td><td><span class="team-cell">${crest(r.id, 22)}<span class="tn">${esc(teamName(r.id))}</span></span></td>
      <td class="n">${r.p}</td><td class="n">${r.w}</td><td class="n">${r.d}</td><td class="n">${r.l}</td><td class="n">${r.gf}</td><td class="n">${r.ga}</td><td class="n">${r.gf - r.ga}</td><td class="n"><b>${r.pts}</b></td>${opts.youth ? '' : `<td>${formRow(r.id)}</td>`}</tr>`).join('')}
  </tbody></table></div>`;
}
function legendFor(c) {
  if (!c) return '';
  const items = [];
  if (c.key && c.key.startsWith('UL')) { if (c.key !== 'UL1') items.push(['var(--win)', 'Acesso']); if (!S.zoeira) items.push(['var(--loss)', c.key === 'UL4' ? 'Vai para o banco de times' : 'Rebaixamento']); }
  else if (c.second) items.push(['var(--win)', 'Acesso']);
  else if (c.kind === 'league') {
    const zones = new Set((c.teams || []).map((_, i) => zoneFor(c, i + 1, c.teams.length)));
    Object.keys(ZONE_LEGEND).forEach((z) => { if (zones.has(z)) items.push(ZONE_LEGEND[z]); });
    if (zones.has('zone-down')) items.push(['var(--loss)', 'Rebaixamento']);
  }
  return `<div class="row wrap" style="font-size:12px;margin-top:8px;gap:14px">${items.map(([col, l]) => `<span class="row" style="gap:6px"><i class="dot" style="background:${col}"></i>${l}</span>`).join('')}</div>`;
}
function viewTables() {
  if (S.mode === 'national') return viewNatTables();
  const c = (UI.tableComp && S.comps[UI.tableComp]) || userLeagueComp() || S.active.map((id) => S.comps[id]).find((x) => x && x.kind === 'league');
  if (!c) return '<div class="panel empty">Sem liga ativa no momento.</div>';
  const tab = sortTable(c.table, c.teams);
  const est = S.active.map((id) => S.comps[id]).find((x) => x && x.state && x.teams.includes(S.user.team));
  return `<div class="panel"><div class="row wrap" style="margin-bottom:10px">${compBadge(c, 30)}<h3 style="margin:0">${esc(c.name)} <span class="sub">${esc(c.season)}</span></h3><span class="grow"></span>
      ${est ? `<button class="btn sm" data-a="pickTable" data-id="${est.id}">${compBadge(est, 18)} ${esc(est.name)}</button>` : ''}
      ${UI.tableComp ? '<button class="btn sm" data-a="tableMine">Minha liga</button>' : ''}</div>
    ${leagueTableHtml(c, tab)}${legendFor(c)}
    <div class="row" style="margin-top:12px"><span class="grow"></span><button class="btn primary sm" data-a="otherLeagues">Outras ligas</button></div></div>`;
}
act('tableMine', () => { UI.tableComp = null; render(); });
// competitions grouped for lists and selects (normal mode has dozens of leagues)
const COMP_REGIONS = ['Minhas competições', 'Copas continentais', 'Principais', 'Europa', 'América do Sul', 'Estaduais', 'Outras'];
function compRegion(c, mine) {
  if (mine && mine.includes(c.id)) return 'Minhas competições';
  if (c.state) return 'Estaduais';
  if (c.zone === 'UEFA' || ['LIB', 'SULA', 'MUN'].includes(c.key)) return 'Copas continentais';
  if (S.mode !== 'normal') return 'Outras';
  const id = c.lgId || (c.key.startsWith('CUP') ? c.key.slice(3) : c.key);
  if (MAIN_LEAGUES.has(id)) return 'Principais';
  const lg = leagueById(id);
  return lg ? (lg.conf === 'CONMEBOL' ? 'América do Sul' : 'Europa') : 'Outras';
}
function compSelectOptions(comps, selId, mine) {
  if (S.mode !== 'normal') return comps.map((x) => `<option value="${x.id}" ${x.id === selId ? 'selected' : ''}>${esc(x.name)} ${esc(x.season)}${mine.includes(x.id) ? ' ★' : ''}</option>`).join('');
  return COMP_REGIONS.map((reg) => {
    const list = comps.filter((x) => compRegion(x, mine) === reg);
    return list.length ? `<optgroup label="${esc(reg)}">${list.map((x) => `<option value="${x.id}" ${x.id === selId ? 'selected' : ''}>${esc(x.name)} ${esc(x.season)}</option>`).join('')}</optgroup>` : '';
  }).join('');
}
act('otherLeagues', () => {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && (c.kind === 'league' || c.kind === 'swiss' || c.kind === 'groups'));
  const mine = userComps().map((c) => c.id);
  const card = (c) => `<button class="choice" style="min-height:0" data-a="pickTable" data-id="${c.id}"><span class="row">${compBadge(c, 28)}<span class="t" style="font-size:20px">${esc(c.name)}</span></span><span class="d">${esc(c.season)} · ${c.teams.length || (c.groups ? c.groups.length * 4 : 0)} times</span></button>`;
  const body = S.mode !== 'normal' ? `<div class="choice-grid">${comps.map(card).join('')}</div>`
    : COMP_REGIONS.map((reg) => { const list = comps.filter((c) => compRegion(c, mine) === reg); return list.length ? `<h3 style="margin:14px 0 8px">${esc(reg)}</h3><div class="choice-grid">${list.map(card).join('')}</div>` : ''; }).join('');
  openModal(modalShell(S.mode === 'ultra' ? 'Outras divisões' : 'Outras ligas', body), { size: 'wide' });
});
act('pickTable', (el) => {
  const c = S.comps[+el.dataset.id];
  if (MODALS.length) closeModal();
  if (c.kind === 'league') { UI.tableComp = c.id; UI.sub.office = 'table'; render(); }
  else { UI.cupSel = c.id; UI.sub.office = 'cups'; render(); }
});
function viewNatTables() {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && c.kind === 'groups');
  if (!comps.length) return '<div class="panel empty">Nenhum torneio em andamento.</div>';
  const uid = S.user.team;
  const mine = comps.filter((c) => c.groups.some((g) => g.teams.includes(uid)));
  const sel = comps.find((c) => c.id === UI.natComp) || mine[0] || comps[0];
  return `<div class="row wrap" style="margin-bottom:12px"><select class="input" style="max-width:420px" data-a="natComp">${comps.map((c) => `<option value="${c.id}" ${c.id === sel.id ? 'selected' : ''}>${esc(c.name)} ${esc(c.season)}${mine.includes(c) ? ' ★' : ''}</option>`).join('')}</select></div>
    <div class="grid g2">${sel.groups.map((g) => `<div class="panel"><h3>Grupo ${esc(g.name)}</h3>${leagueTableHtml(sel, sortTable(g.table, g.teams), { noZones: true, youth: true })}</div>`).join('')}</div>`;
}
act('natComp', (el) => { UI.natComp = +el.value; render(); });

// ---------- calendar
function viewCalendar() {
  const uid = S.user.team;
  const tid = UI.calTeam || uid;
  const base = UI.calMonth != null ? UI.calMonth : (() => { const t = ymd(S.date); return t.y * 12 + t.m - 1; })();
  const y = Math.floor(base / 12), mo = base % 12 + 1;
  const first = dayOf(y, mo, 1);
  const start = onOrBefore(first, 1);
  const ms = teamMatches(tid);
  const byDay = {};
  ms.forEach((m) => (byDay[m.d] = byDay[m.d] || []).push(m));
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = start + i;
    const t = ymd(d);
    const list = byDay[d] || [];
    const fut = d > S.date && !S.coach.unemployed;
    cells += `<div class="dc ${t.m !== mo ? 'out' : ''} ${d === S.date ? 'today' : ''} ${fut ? 'fut' : ''} ${UI.calPick === d ? 'pick' : ''}" ${fut ? `data-a="calDay" data-d="${d}"` : ''}><div class="dn">${t.d}</div>${list.map((m) => {
      const c = S.comps[m.c];
      const opp = m.h === tid ? m.a : m.h;
      const res = m.done ? resultLetter(m, tid) : '';
      return `<div class="mchip ${res}" data-a="openMatch" data-id="${m.id}" title="${esc(teamName(m.h))} x ${esc(teamName(m.a))}">${crest(opp, 14)}<span class="t">${m.h === tid ? 'x' : '@'} ${esc(teamShort(opp))}</span>${m.done ? `<b>${m.h === tid ? m.hg : m.ag}-${m.h === tid ? m.ag : m.hg}</b>` : `<span class="dim">${m.t}</span>`}</div>`;
    }).join('')}</div>`;
  }
  const upcoming = ms.filter((m) => !m.done).slice(0, 6);
  return `<div class="grid cal-layout">
    <div class="panel"><div class="row wrap" style="margin-bottom:10px"><button class="icon-btn" data-a="calMove" data-v="-1" aria-label="Mês anterior">‹</button>
      <h3 style="margin:0">${MONTHS[mo - 1]} ${y}</h3><button class="icon-btn" data-a="calMove" data-v="1" aria-label="Próximo mês">›</button><span class="grow"></span>
      ${tid !== uid ? `<span class="chip">${crest(tid, 16)} ${esc(teamName(tid))}</span><button class="btn sm" data-a="calTeamReset">Meu time</button>` : ''}
      <button class="btn sm" data-a="calOther">Calendário de outro time</button></div>
      <div class="cal">${['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((d) => `<div class="dh">${d}</div>`).join('')}${cells}</div>
      ${simPickBar()}</div>
    <div class="panel"><h3>Próximos jogos</h3>${upcoming.map((m) => `<div class="col" style="gap:2px;padding:6px 0;border-bottom:1px solid var(--line)"><span class="muted" style="font-size:12px">${fmtDate(m.d, 'wd')} · ${m.t} · ${esc(S.comps[m.c] ? S.comps[m.c].name : '')}</span>${matchLine(m)}</div>`).join('') || '<div class="muted">Nada marcado.</div>'}</div>
  </div>`;
}
act('calMove', (el) => {
  const t = ymd(S.date);
  const base = UI.calMonth != null ? UI.calMonth : t.y * 12 + t.m - 1;
  UI.calMonth = base + +el.dataset.v;
  render();
});
act('calTeamReset', () => { UI.calTeam = null; render(); });
act('calOther', () => {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && c.kind === 'league');
  const lc = userLeagueComp() || comps[0];
  UI.calPickComp = lc ? lc.id : null;
  openModal(() => {
    const c = S.comps[UI.calPickComp];
    return modalShell('Escolha um time', `<div class="row wrap" style="margin-bottom:10px"><select class="input" data-a="calPickComp" style="max-width:320px">${compSelectOptions(comps, c ? c.id : 0, userComps().map((x) => x.id))}</select></div>
      <div class="choice-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${(c ? c.teams : []).map((id) => `<button class="btn" style="justify-content:flex-start" data-a="calPickTeam" data-id="${id}">${crest(id, 22)} ${esc(teamName(id))}</button>`).join('')}</div>`);
  }, { size: 'wide' });
});
act('calPickComp', (el) => { UI.calPickComp = +el.value; refreshModal(); });
act('calPickTeam', (el) => { UI.calTeam = +el.dataset.id; closeAllModals(); render(); });

// ---------- results center
function viewResults() {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && c.rounds && c.rounds.length && c.kind !== 'youth');
  if (!comps.length) return '<div class="panel empty">Sem competições.</div>';
  const mine = userComps().map((c) => c.id);
  const c = comps.find((x) => x.id === UI.resComp) || comps.find((x) => mine.includes(x.id)) || comps[0];
  let r = UI.resRound;
  if (r == null || !c.rounds[r]) {
    r = c.rounds.findIndex((rd) => rd.m.some((id) => S.matches[id] && !S.matches[id].done));
    if (r < 0) r = c.rounds.length - 1;
    const lastDone = (() => { for (let i = c.rounds.length - 1; i >= 0; i--) if (c.rounds[i].m.some((id) => S.matches[id] && S.matches[id].done)) return i; return -1; })();
    if (lastDone >= 0 && r > lastDone && !c.rounds[r].m.some((id) => S.matches[id].done)) r = Math.max(lastDone, 0);
  }
  const rd = c.rounds[r];
  const ms = rd.m.map((id) => S.matches[id]).filter(Boolean).sort(by((m) => m.d * 10000 + parseInt(m.t)));
  let lastDay = null;
  const lines = ms.map((m) => { const hd = m.d !== lastDay ? `<div class="muted up" style="font-size:12px;margin-top:10px">${fmtDate(m.d, 'long')}</div>` : ''; lastDay = m.d; return hd + matchLine(m); }).join('');
  return `<div class="panel"><div class="row wrap" style="margin-bottom:10px">
      <select class="input" style="max-width:340px" data-a="resComp">${compSelectOptions(comps, c.id, mine)}</select>
      <button class="icon-btn" data-a="resMove" data-v="-1" aria-label="Rodada anterior">‹</button>
      <select class="input" style="max-width:220px" data-a="resRound">${c.rounds.map((x, i) => `<option value="${i}" ${i === r ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <button class="icon-btn" data-a="resMove" data-v="1" aria-label="Próxima rodada">›</button></div>
    <div class="col" style="gap:2px">${lines || '<div class="empty">Sem jogos.</div>'}</div></div>`;
}
act('resComp', (el) => { UI.resComp = +el.value; UI.resRound = null; render(); });
act('resRound', (el) => { UI.resRound = +el.value; render(); });
act('resMove', (el) => {
  const c = S.comps[UI.resComp] || null;
  const cur = UI.resRound == null ? 0 : UI.resRound;
  UI.resRound = clamp(cur + +el.dataset.v, 0, c ? c.rounds.length - 1 : 0);
  render();
});
act('openMatch', (el) => openMatchModal(+el.dataset.id));
function openMatchModal(mid) {
  const m = S.matches[mid];
  if (!m) return;
  const c = S.comps[m.c];
  const ev = (m.ev || []).filter((e) => ['goal', 'red', 'yellow', 'alien', 'sub', 'inj'].includes(e[1]));
  const icon = { goal: '⚽', red: '🟥', yellow: '🟨', alien: '👽', sub: '⇄', inj: '✚' };
  const evHtml = ev.map((e) => `<div class="row" style="justify-content:${e[2] === 0 ? 'flex-start' : 'flex-end'};font-size:14px;padding:3px 0">${e[2] === 0 ? `<span class="dim tnum">${e[0]}'</span>` : ''}<span>${icon[e[1]] || ''} ${esc(pidName(e[3]))}${e[1] === 'goal' && e[4] ? ` <span class="muted">(${esc(pidName(e[4]))})</span>` : ''}${e[1] === 'sub' && e[4] ? ` <span class="muted">↔ ${esc(pidName(e[4]))}</span>` : ''}</span>${e[2] === 1 ? `<span class="dim tnum">${e[0]}'</span>` : ''}</div>`).join('');
  const st = m.stats;
  openModal(modalShell(`${esc(teamName(m.h))} x ${esc(teamName(m.a))}`, `
    <div class="muted center" style="font-size:13px">${esc(c ? c.name : '')} · ${c && c.rounds[m.r] ? esc(c.rounds[m.r].name) : ''} · ${fmtDate(m.d, 'long')} · ${m.t}</div>
    <div class="row" style="justify-content:center;gap:18px;margin:14px 0">${crest(m.h, 56)}<div class="disp" style="font-size:52px;font-weight:800">${m.done ? `${m.hg} - ${m.ag}` : 'x'}</div>${crest(m.a, 56)}</div>
    ${m.pen ? `<div class="center muted">Pênaltis: ${m.pen[0]} - ${m.pen[1]}</div>` : ''}${m.et && !m.pen ? '<div class="center muted">Prorrogação</div>' : ''}
    ${m.done ? (evHtml ? `<div class="panel" style="background:var(--panel2)">${evHtml}</div>` : '<div class="muted center">Sem gols.</div>') : `<div class="center muted">Jogo marcado para ${fmtDate(m.d, 'dm')} às ${m.t}.</div>`}
    ${st ? `<div class="col" style="margin-top:14px">${statBars(st)}</div>` : ''}`, ''), { size: 'narrow' });
}
function statBars(st) {
  const rows = [['Posse (%)', st.poss], ['Finalizações', st.sh], ['No gol', st.sot], ['Escanteios', st.cor], ['Faltas', st.fo], ['Amarelos', st.yc], ['Vermelhos', st.rc]];
  return rows.map(([l, v]) => {
    const a = v[0], b = v[1], tot = a + b || 1;
    return `<div class="statbar"><b class="tnum">${a}</b><div><div class="muted center" style="font-size:12px">${l}</div><div class="bars"><i style="width:${(a / tot) * 100}%;background:var(--accent-hi)"></i><i style="width:${(b / tot) * 100}%;background:var(--gold)"></i></div></div><b class="tnum" style="text-align:right">${b}</b></div>`;
  }).join('');
}

// ---------- cups & tournaments
function viewCups() {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && (c.kind === 'cup' || c.kind === 'swiss' || (c.kind === 'groups' && !c.qualOnly)));
  if (!comps.length) return '<div class="panel empty">Nenhuma copa em andamento.</div>';
  const mine = userComps().map((c) => c.id);
  const sel = comps.find((c) => c.id === UI.cupSel) || comps.find((c) => mine.includes(c.id)) || comps[0];
  let body = '';
  if (sel.kind === 'swiss') {
    const tab = sortTable(sel.table, sel.teams);
    body = `<div class="grid g2"><div class="panel"><h3>Fase de liga</h3>${leagueTableHtml(sel, tab, { noZones: true })}
      <div class="row wrap" style="font-size:12px;margin-top:8px;gap:14px"><span>1º–8º: oitavas direto</span><span>9º–24º: playoffs</span><span>25º–36º: eliminados</span></div></div>
      <div class="panel"><h3>Mata-mata</h3>${bracketHtml(sel, sel.leaguePhaseRounds)}</div></div>`;
  } else if (sel.state) {
    const gTitle = (g) => (g.name.length > 2 ? esc(g.name) : `Grupo ${esc(g.name)}`);
    const tables = (groups) => `<div class="grid ${groups.length > 2 ? 'g3' : groups.length === 2 ? 'g2' : ''}">${groups.map((g) => `<div class="panel"><h3>${gTitle(g)}</h3>${leagueTableHtml(sel, sortTable(g.table, g.teams), { noZones: true })}</div>`).join('')}</div>`;
    body = `<p class="muted" style="font-size:13px;margin:0 0 12px">${esc(sel.full)} · ${esc(sel.fmtNote || '')}</p>${tables(sel.groups)}
      ${(sel.oldGroups || []).map((o) => `<h3 style="margin:16px 0 8px">${esc(o.label)}</h3>${tables(o.groups)}`).join('')}
      <div class="panel" style="margin-top:16px"><h3>Mata-mata</h3>${bracketHtml(sel, sel.groupRounds)}</div>`;
  } else if (sel.kind === 'groups') {
    const note = sel.key === 'SULA' ? `<p class="muted" style="font-size:13px;margin:0 0 12px">1º do grupo: oitavas de final · 2º: playoffs contra os 3º colocados dos grupos da Libertadores · o campeão vai para a próxima Libertadores.</p>` : '';
    body = note + `<div class="grid g3">${sel.groups.map((g) => `<div class="panel"><h3>Grupo ${esc(g.name)}</h3>${leagueTableHtml(sel, sortTable(g.table, g.teams), { noZones: true, youth: true })}</div>`).join('')}</div>
      <div class="panel" style="margin-top:16px"><h3>Mata-mata</h3>${bracketHtml(sel, sel.groupRounds)}</div>`;
  } else if (sel.key === 'MUN' && sel.reps) {
    const reps = Object.entries(sel.reps).filter(([, id]) => id && S.teams[id]);
    body = `<div class="panel" style="margin-bottom:16px"><h3>Campeões continentais</h3><div class="mun-reps">${reps.map(([k, id]) => `<div class="team-cell" data-a="openTeam" data-id="${id}" style="cursor:pointer">${crest(id, 26)}<span class="col" style="gap:0"><span class="tn">${esc(teamName(id))}</span><span class="muted" style="font-size:12px">${esc(CONF_LABEL[k])}</span></span></div>`).join('')}</div>
      <p class="muted" style="font-size:13px;margin:10px 0 0">Jogos em campo neutro. O campeão europeu entra direto na final; o da Libertadores estreia no Dérbi das Américas.</p></div>
      <div class="panel">${bracketHtml(sel, 0)}</div>`;
  } else body = `<div class="panel">${bracketHtml(sel, 0)}</div>`;
  return `<div class="row wrap" style="margin-bottom:12px"><select class="input" style="max-width:380px" data-a="cupSel">${compSelectOptions(comps, sel.id, mine)}</select>
    ${sel.done ? `<span class="chip on">Campeão: ${esc(teamName(sel.champion))}</span>` : ''}</div>${body}`;
}
act('cupSel', (el) => { UI.cupSel = +el.value; render(); });
act('histAll', () => { UI.histAll = !UI.histAll; render(); });
function bracketHtml(c, fromRound) {
  const rounds = c.rounds.slice(fromRound).filter((rd) => rd.ties && rd.ties.length);
  if (!rounds.length) return '<div class="empty">O mata-mata ainda não começou.</div>';
  return `<div class="bracket">${rounds.map((rd) => `<div class="rnd"><h4>${esc(rd.name)}</h4>${rd.ties.map((tid) => {
    const t = c.ties[tid];
    const ms = t.m.map((id) => S.matches[id]).filter(Boolean);
    let ga = 0, gb = 0, played = ms.some((m) => m.done);
    ms.forEach((m) => { if (!m.done) return; if (m.h === t.a) { ga += m.hg; gb += m.ag; } else { ga += m.ag; gb += m.hg; } });
    const last = ms[ms.length - 1];
    const pens = last && last.pen ? (last.h === t.a ? last.pen : [last.pen[1], last.pen[0]]) : null;
    return `<div class="tie" data-a="openMatch" data-id="${ms[0] ? ms[0].id : 0}" style="cursor:pointer">
      <div class="tr ${t.w === t.a ? 'w' : ''}">${crest(t.a, 16)}<span>${esc(teamShort(t.a))}</span><span class="sc">${played ? ga : ''}${pens ? `<span class="dim"> (${pens[0]})</span>` : ''}</span></div>
      <div class="tr ${t.w === t.b ? 'w' : ''}">${crest(t.b, 16)}<span>${esc(teamShort(t.b))}</span><span class="sc">${played ? gb : ''}${pens ? `<span class="dim"> (${pens[1]})</span>` : ''}</span></div>
      ${!played && ms[0] ? `<div class="dim" style="font-size:11px">${fmtDate(ms[0].d, 'short')}</div>` : ''}</div>`;
  }).join('')}</div>`).join('')}</div>`;
}

// ---------- gallery
function viewGallery() {
  const tr = S.coach.trophies;
  const uid = S.user.team;
  const clubTitles = S.titles[uid] || [];
  const all = S.hist.slice().reverse().filter((h) => h.key !== 'QUAL');
  const minor = (h) => compIsMinor({ key: h.key, lgId: h.key.startsWith('CUP') ? h.key.slice(3) : h.key, country: (leagueById(h.key.startsWith('CUP') ? h.key.slice(3) : h.key) || {}).country, zone: '' });
  const hist = UI.histAll ? all : all.filter((h) => !minor(h));
  const hidden = all.length - hist.length;
  return `<div class="panel" style="margin-bottom:16px"><h3>Seus títulos <span class="sub">${tr.length} conquista${tr.length === 1 ? '' : 's'}</span></h3>
      ${tr.length ? `<div class="trophy-grid">${tr.map((t) => `<div class="trophy-card">${trophySVG(t.key, 70)}<div style="font-weight:700;margin-top:6px">${esc(t.name)}</div><div class="muted" style="font-size:13px">${esc(t.season)} · ${esc(t.teamN)}</div>${t.coins ? `<div class="coin-pill" style="margin-top:6px;font-size:13px;padding:2px 8px 2px 4px"><span class="coin">F</span>+${t.coins}</div>` : ''}</div>`).join('')}</div>` : '<div class="empty">Nenhum título ainda. A primeira taça vem!</div>'}</div>
    <div class="grid g2"><div class="panel"><h3>Títulos ${esc(tA(uid, 'do'))} <span class="sub">nesta carreira</span></h3>${clubTitles.length ? clubTitles.map((t) => `<div class="row" style="padding:5px 0;border-bottom:1px solid var(--line)">🏆 <span class="grow">${esc(t.name)}</span><span class="muted">${esc(t.season)}</span></div>`).join('') : '<div class="muted">Nenhum ainda.</div>'}</div>
    <div class="panel"><div class="row wrap" style="margin-bottom:8px"><h3 class="grow" style="margin:0">Campeões das temporadas</h3>${hidden || UI.histAll ? `<button class="btn sm" data-a="histAll">${UI.histAll ? 'Só as principais' : `Todas as ligas (+${hidden})`}</button>` : ''}</div><div style="max-height:420px;overflow:auto">${hist.map((h) => `<div class="row" style="padding:5px 0;border-bottom:1px solid var(--line);font-size:14px">${S.teams[h.ch] ? crest(h.ch, 18) : ''}<span class="grow"><b>${esc(h.chN)}</b> · ${esc(h.name)}</span><span class="muted">${esc(h.season)}</span></div>`).join('') || '<div class="muted">A primeira temporada ainda está em andamento.</div>'}</div></div></div>`;
}

// ---------- career stats
function viewCareerStats() {
  const c = S.coach;
  const r = c.rec;
  const games = r.w + r.d + r.l;
  const pct = games ? Math.round(((r.w * 3 + r.d) / (games * 3)) * 100) : 0;
  return `<div class="grid g4" style="margin-bottom:16px">
      <div class="stat-tile"><div class="k">Treinador</div><div class="v" style="font-size:22px">${esc(c.name)}</div><div class="muted" style="font-size:13px">${c.age} anos${c.fav ? ` · torce para ${esc((STORE.find((t) => t[0] === c.fav) || [0, c.fav])[1])}` : ''}</div></div>
      <div class="stat-tile"><div class="k">Vitórias · Empates · Derrotas</div><div class="v">${r.w} · ${r.d} · ${r.l}</div><div class="muted" style="font-size:13px">${games} jogos · ${pct}% de aproveitamento</div></div>
      <div class="stat-tile"><div class="k">Gols</div><div class="v">${r.gf} : ${r.ga}</div><div class="muted" style="font-size:13px">saldo ${r.gf - r.ga >= 0 ? '+' : ''}${r.gf - r.ga}</div></div>
      <div class="stat-tile"><div class="k">Nota do técnico</div><div class="v">${(c.rating / 10).toFixed(1)}</div><div class="muted" style="font-size:13px">Reputação ${Math.round(c.rep)}/100</div></div>
    </div>
    <div class="grid g2"><div class="panel"><h3>Clubes</h3>${c.hist.map((h) => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)">${S.teams[h.team] ? crest(h.team, 22) : ''}<span class="grow">${esc(h.n)}</span><span class="muted" style="font-size:13px">${fmtDate(h.from, 'short')}/${yearOf(h.from)} – ${fmtDate(h.to, 'short')}/${yearOf(h.to)} · ${esc(h.why)}</span></div>`).join('')}
      ${!c.unemployed ? `<div class="row" style="padding:6px 0">${crest(S.user.team, 22)}<span class="grow"><b>${esc(teamName(S.user.team))}</b></span><span class="chip on">Atual</span></div>` : ''}</div>
    <div class="panel"><h3>FutCoins</h3><div class="row">${coinPill()}<span class="muted">${WALLET.owned.length} times comprados</span></div>
      <div style="margin-top:10px">${WALLET.log.slice(0, 12).map((l) => `<div class="row" style="padding:4px 0;font-size:14px;border-bottom:1px solid var(--line)"><span class="grow">${esc(l.reason)}</span><b style="color:${l.n >= 0 ? 'var(--win)' : 'var(--loss)'}">${l.n >= 0 ? '+' : ''}${l.n}</b></div>`).join('') || `<div class="muted">${INFINITE_COINS ? 'FutCoins infinitas ativadas: compre times à vontade.' : 'Ganhe títulos para receber FutCoins.'}</div>`}</div></div></div>`;
}

// ---------- board
function viewBoard() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const conf = Math.round(S.board.conf);
  const col = conf < 30 ? 'var(--loss)' : conf < 55 ? 'var(--warn)' : 'var(--win)';
  return `<div class="grid g2"><div class="panel"><h3>Confiança ${S.mode === 'national' ? 'da federação' : 'da diretoria'}</h3>
      <div class="disp" style="font-size:64px;font-weight:800;color:${col}">${conf}%</div>
      <div style="height:10px;border-radius:5px;background:var(--panel3);overflow:hidden"><i style="display:block;height:100%;width:${conf}%;background:${col}"></i></div>
      <p class="muted">${conf >= 70 ? 'A diretoria está muito satisfeita com o seu trabalho.' : conf >= 45 ? 'A diretoria acompanha de perto, mas confia em você.' : conf >= 25 ? 'A pressão aumentou. Resultados ruins podem custar o cargo.' : 'Situação crítica: o cargo está em risco.'}${S.noFire ? ' (modo sem demissão ativo)' : ''}</p>
      <div class="kv"><span class="k">Objetivo</span><span><b>${esc(S.board.obj)}</b></span><span class="k">Nota do técnico</span><span>${(S.coach.rating / 10).toFixed(1)}</span></div></div>
    <div class="panel"><h3>Pedir demissão</h3><p class="muted">Você deixa o cargo imediatamente e passa a procurar outro clube no mercado de trabalho.</p><button class="btn danger" data-a="askResign">Pedir demissão</button></div></div>`;
}
act('askResign', () => openModal(modalShell('Pedir demissão?', `<p>Você vai deixar ${esc(tA(S.user.team))}.</p>`, '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="resign">Pedir demissão</button>'), { size: 'narrow' }));
act('resign', () => { resignJob(); closeAllModals(); UI.tab = 'central'; render(); toast('Você deixou o cargo.'); });
function viewJobsTab() {
  if (!S.jobs || !S.jobs.length || S.date - (S.jobsD || 0) > 7) { S.jobs = generateJobs(8); S.jobsD = S.date; }
  return `<div class="panel"><h3>Mercado de trabalho <span class="sub">vagas e clubes interessados</span></h3>${viewJobList(S.jobs)}
    <p class="muted" style="font-size:13px;margin-bottom:0">${S.coach.unemployed ? 'Candidate-se a um cargo para voltar ao trabalho.' : 'Se for aceito, você deixa o clube atual imediatamente.'}</p></div>`;
}
function viewFinance() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const t = S.teams[S.user.team];
  const sq = squadOf(t.id).sort(by((p) => p.w || 0, -1));
  const bill = wageBill(t.id);
  return `<div class="grid g3" style="margin-bottom:16px"><div class="stat-tile"><div class="k">Orçamento de transferências</div><div class="v">${money(t.budget)}</div></div>
    <div class="stat-tile"><div class="k">Folha salarial</div><div class="v">${wageFmt(bill)}/sem</div><div class="muted" style="font-size:13px">limite ${wageFmt(t.wb)}/sem</div></div>
    <div class="stat-tile"><div class="k">Valor do elenco</div><div class="v">${money(sum(sq, (p) => playerValue(p)))}</div></div></div>
    ${viewBudgetMove(t, bill)}
    <div class="panel"><h3>Maiores salários</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Jogador</th><th class="n">Salário/sem</th><th class="n">Contrato</th><th class="n">Valor</th></tr></thead><tbody>
    ${sq.slice(0, 15).map((p) => `<tr class="click" data-a="openPlayer" data-id="${p.id}"><td>${esc(p.n)}</td><td class="n">${money(p.w || 0)}</td><td class="n">${p.ct}</td><td class="n">${money(playerValue(p))}</td></tr>`).join('')}</tbody></table></div></div>`;
}
const wageFmt = (v) => (v >= 1e6 && v < 1e8 ? `€${(v / 1e6).toFixed(2)}M` : money(v));
// FIFA-style budget slider: transfer budget <-> wage budget
function viewBudgetMove(t, bill) {
  const weeks = budgetWeeksLeft();
  const room = Math.max(0, t.wb - bill);
  const nice = (v) => { const e = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1000)))); const m = v / e; return (m < 1.5 ? 1 : m < 3.5 ? 2.5 : m < 7.5 ? 5 : 10) * e; };
  const steps = uniq([0.05, 0.1, 0.25, 0.5].map((f) => nice(t.wb * f)));
  const up = steps.map((w) => { const c = wageRaiseCost(w); return `<button class="btn sm" data-a="wbMove" data-v="${w}" ${c > t.budget ? 'disabled' : ''}>+${money(w)}/sem <span class="muted">(${money(c)})</span></button>`; }).join('');
  const down = steps.filter((w) => w <= room).map((w) => `<button class="btn sm" data-a="wbMove" data-v="${-w}">−${money(w)}/sem <span class="muted">(+${money(wageLowerReturn(w))})</span></button>`).join('');
  return `<div class="panel"><h3>Remanejar verba <span class="sub">entre transferências e folha salarial</span></h3>
    <p class="muted" style="font-size:13px;margin-top:0">Cada ${money(1000)} a mais por semana na folha custa ${money(1000 * weeks)} do orçamento de transferências (as ${weeks} semanas que faltam até 1º de julho, quando a diretoria recalcula a folha a partir dos salários do elenco). Devolver folga da folha devolve 80% desse valor.</p>
    <div class="row wrap" style="gap:8px;margin-bottom:6px"><span class="chip">Folga na folha: ${money(room)}/sem</span><span class="chip">Orçamento: ${money(t.budget)}</span></div>
    <div class="muted up" style="font-size:11px;margin:8px 0 4px">Ampliar a folha</div><div class="row wrap" style="gap:8px">${up}</div>
    ${down ? `<div class="muted up" style="font-size:11px;margin:10px 0 4px">Devolver para transferências</div><div class="row wrap" style="gap:8px">${down}</div>` : ''}
    <div class="row wrap" style="gap:8px;margin-top:12px"><input id="wb-x" class="input" type="number" min="0" step="1000" placeholder="Valor por semana" style="max-width:180px"><button class="btn primary sm" data-a="wbMoveX" data-dir="1">Ampliar folha</button>${room > 0 ? '<button class="btn sm" data-a="wbMoveX" data-dir="-1">Devolver</button>' : ''}</div></div>`;
}
function doWbMove(v) {
  const t = S.teams[S.user.team];
  if (!v) return;
  const r = v > 0 ? raiseWageBudget(t, v) : lowerWageBudget(t, -v);
  toast(r.msg, !r.ok);
  if (r.ok) render();
}
act('wbMove', (el) => doWbMove(+el.dataset.v));
act('wbMoveX', (el) => { const v = Math.round(+($('#wb-x').value) || 0); if (v <= 0) { toast('Digite um valor por semana.', true); return; } doWbMove(v * +el.dataset.dir); });
act('goFinance', () => { closeAllModals(); UI.tab = 'office'; UI.sub.office = 'finance'; render(); window.scrollTo(0, 0); });

/* ===================== team modal (other teams) ===================== */
act('openTeam', (el) => { const id = +el.dataset.id; if (S.teams[id]) openTeamModal(id); });
function openTeamModal(tid) {
  UI.teamTab = 'xi';
  openModal(() => {
    const t = S.teams[tid];
    const players = t.isNat ? nationSquad(t.code) : squadOf(tid);
    const r = t.isNat ? nationRating(t.code) : teamRating(tid);
    const tab = UI.teamTab;
    let body = '';
    if (tab === 'xi') {
      const form = t.form || '4-3-3';
      const lu = isUserTeam(tid) && t.xi ? { xi: t.xi } : autoLineup(players, form);
      const slots = FORMATIONS[form];
      body = `<div class="pitch" style="max-width:420px">${pitchLines()}${slots.map((s, i) => {
        const p = S.players[lu.xi[i]];
        return `<div style="position:absolute;left:${s[1]}%;top:${100 - s[2]}%"><div class="pslot" style="position:relative;transform:translate(-50%,-50%)" ${p ? `data-a="openPlayer" data-id="${p.id}"` : ''}><div class="card"><div class="o">${p ? p.o : '-'}</div><div class="p">${POS_PT[s[0]]}</div></div><div class="nm">${p ? esc(p.s || p.n) : ''}</div></div></div>`;
      }).join('')}</div><p class="muted center" style="font-size:13px">${form} · provável escalação</p>`;
    } else if (tab === 'squad') {
      const list = players.slice().sort((a, b) => POSITIONS.indexOf(a.p) - POSITIONS.indexOf(b.p) || b.o - a.o);
      body = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Nome</th><th>Pos</th><th class="n">Idade</th><th class="c">OVR</th><th class="n">Valor</th></tr></thead><tbody>
        ${list.map((p) => `<tr class="click" data-a="openPlayer" data-id="${p.id}"><td>${p.num || ''}</td><td>${esc(p.n)}${statusFlags(p)}</td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td class="c nw">${ovrBadge(p.o)}${formTag(p)}</td><td class="n">${money(playerValue(p))}</td></tr>`).join('')}</tbody></table></div>`;
    } else {
      const ms = teamMatches(tid);
      body = ms.length ? `<div class="col" style="gap:2px">${ms.map((m) => `<div class="row" style="gap:6px"><span class="dim" style="font-size:12px;width:120px">${compBadge(S.comps[m.c], 16)} ${fmtDate(m.d, 'wd')}</span><div class="grow">${matchLine(m)}</div></div>`).join('')}</div>` : '<div class="empty">Sem jogos marcados.</div>';
    }
    const titles = S.titles[tid] || [];
    return modalShell(esc(t.n), `
      <div class="row wrap" style="gap:16px;margin-bottom:14px"><button class="crest-btn" data-a="crestEdit" data-id="${t.id}" title="Trocar o escudo" aria-label="Trocar o escudo ${esc(tA(t, 'do'))}">${crest(t, 76)}<span class="crest-edit">🖼</span></button><div class="grow">
        <div class="row wrap">${starStr(r)}<span class="muted">força ${r.toFixed(1)}</span>${!t.isNat ? `<span class="muted">· ${players.length} jogadores</span>` : ''}</div>
        ${t.std ? `<div class="muted" style="font-size:14px">${esc(t.std)}</div>` : ''}
        ${!t.isNat ? `<div class="muted" style="font-size:14px">Orçamento ${money(t.budget)}</div>` : ''}
        <div class="row" style="margin-top:6px;gap:6px">${formRow(tid)}</div>
        ${titles.length ? `<div class="muted" style="font-size:13px;margin-top:4px">🏆 ${titles.length} título(s) nesta carreira</div>` : ''}</div></div>
      <div class="subtabs">${[['xi', 'Escalação'], ['squad', 'Elenco'], ['cal', 'Calendário']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="teamTab" data-k="${k}">${l}</button>`).join('')}</div>${body}`);
  }, { size: 'wide' });
}
act('teamTab', (el) => { UI.teamTab = el.dataset.k; refreshModal(); });

// ---------- custom crest (image chosen by the player, stored only on this device)
function crestTarget(el) {
  if (el.dataset.id) return S && S.teams[+el.dataset.id];
  const r = STORE.find((x) => x[0] === el.dataset.k);
  return r ? { id: 0, key: r[0], n: r[1], s: r[2], c1: r[4], c2: r[5] } : null;
}
act('crestEdit', (el) => {
  const t = crestTarget(el);
  if (!t) return;
  const ref = el.dataset.id ? `data-id="${el.dataset.id}"` : `data-k="${esc(el.dataset.k)}"`;
  openModal(() => {
    const has = !!customCrestOf(t);
    return modalShell(`Escudo · ${esc(t.n)}`, `
      <div class="row wrap" style="gap:18px;align-items:center">
        <div class="crest-preview">${crest(t, 112)}</div>
        <div class="col grow" style="min-width:200px">
          <p class="muted" style="margin:0">${has ? 'Este time está usando uma imagem sua.' : 'Escudo gerado com as cores do clube.'} Você pode usar uma imagem sua (PNG, JPG, WebP ou SVG). Ela fica salva só neste aparelho e aparece em todo o jogo.</p>
          <label class="btn primary" style="align-self:flex-start;cursor:pointer">Escolher imagem<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" class="hide" data-a="crestFile" ${ref}></label>
          ${has ? `<button class="btn" data-a="crestRemove" ${ref} style="align-self:flex-start">Voltar ao escudo gerado</button>` : ''}
        </div></div>`, '<button class="btn" data-a="closeModal">Fechar</button>');
  }, { size: 'narrow' });
});
act('crestFile', async (el) => {
  const t = crestTarget(el);
  const f = el.files && el.files[0];
  if (!t || !f) return;
  try {
    setCustomCrest(t.key, await imageFileToCrest(f));
    await persistCustomCrests();
    render(); refreshModal();
    toast(`Escudo ${tA(t, 'do')} atualizado.`);
  } catch (e) { toast(e.message || 'Não foi possível usar essa imagem.', true); }
});
act('crestRemove', async (el) => {
  const t = crestTarget(el);
  if (!t) return;
  setCustomCrest(t.key, null);
  await persistCustomCrests();
  render(); refreshModal();
  toast(`${t.n} voltou ao escudo gerado.`);
});

/* ===================== match day: pre-match, live, post ===================== */
function matchWeather(m) {
  const h = hashStr('w' + m.id);
  const t = ymd(m.d);
  const host = S.teams[m.h];
  const c = host ? host.c : 'ENG';
  const south = ['BRA', 'ARG', 'URU', 'PAR', 'CHI', 'RSA', 'AUS', 'BOL', 'PER'].includes(c);
  const hot = ['KSA', 'EGY', 'QAT', 'MEX', 'USA', 'COL', 'ECU', 'VEN'].includes(c) || (c === 'BRA' && t.m !== 6 && t.m !== 7);
  const winter = south ? (t.m >= 6 && t.m <= 8) : (t.m === 12 || t.m <= 2);
  let temp = hot ? 24 + (h % 9) : winter ? -1 + (h % 10) : 11 + (h % 13);
  const r = (h >> 5) % 100;
  let kind = 'sun';
  if (r < (winter ? 32 : hot ? 12 : 22)) kind = 'rain';
  else if (r < 50) kind = 'cloud';
  if (winter && temp <= 1 && r < 18 && !south) kind = 'snow';
  const night = parseInt(m.t) >= 18;
  const label = { sun: night ? 'Céu limpo' : 'Ensolarado', cloud: 'Nublado', rain: 'Chuva', snow: 'Neve' }[kind];
  const icon = { sun: night ? '🌙' : '☀️', cloud: '☁️', rain: '🌧️', snow: '❄️' }[kind];
  return { kind, temp, label, icon, night };
}
act('goMatch', (el) => {
  const m = S.matches[+el.dataset.id];
  if (!m) return;
  UI.match = { mid: m.id, phase: 'pre' };
  UI.screen = 'match';
  closeAllModals();
  render();
  window.scrollTo(0, 0);
});
function sideColumn(teamId, prep, isUser) {
  const t = S.teams[teamId];
  const xi = prep.xi.map((id, i) => ({ p: S.players[id], pos: prep.slots[i] }));
  return `<div class="panel"><div class="row" style="margin-bottom:8px">${crest(t, 30)}<b class="grow">${esc(t.n)}</b><span class="chip">${prep.form}</span></div>
    <div class="lineup-col">${xi.map(({ p, pos }) => p ? `<div class="pl"><span class="pos ${POS_GROUP[pos]}">${POS_PT[pos]}</span><span class="dim tnum" style="width:22px">${p.num || ''}</span><span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.n)}</span>${formTag(p)}${ovrBadge(p.o)}${isUser ? fitBar(p) : ''}</div>` : '').join('')}</div>
    <div class="muted up" style="font-size:11px;margin:10px 0 4px">Banco</div>
    <div class="lineup-col">${prep.bench.slice(0, 9).map((id) => { const p = S.players[id]; return p ? `<div class="pl" style="opacity:0.85"><span class="pos ${POS_GROUP[p.p]}">${POS_PT[p.p]}</span><span class="grow">${esc(p.n)}</span>${formTag(p)}${ovrBadge(p.o)}</div>` : ''; }).join('')}</div></div>`;
}
function viewMatch() {
  const M = UI.match;
  const m = S.matches[M.mid];
  if (!m) return '<div class="page"><div class="panel">Partida não encontrada. <button class="btn" data-a="goHub">Voltar</button></div></div>';
  if (M.phase === 'pre' || M.phase === 'playing') return viewPreMatch(m);
  if (M.phase === 'live') return viewLive(m);
  return viewPost(m);
}
function viewPreMatch(m) {
  const c = S.comps[m.c];
  const rd = c && c.rounds[m.r];
  const w = matchWeather(m);
  const ph = prepareSide(m.h, m), pa = prepareSide(m.a, m);
  const host = S.teams[m.h];
  let tieInfo = '';
  if (m.tie && m.leg === 2) { const [gh, ga] = tieAggregateBefore(m); tieInfo = `<span class="chip">Jogo de volta · ida: ${esc(teamName(m.h))} ${gh} x ${ga} ${esc(teamName(m.a))}</span>`; }
  return `<div class="match-screen">
    <div class="score-head"><div class="side">${crest(m.h, 64)}<div class="tname">${esc(teamName(m.h))}</div></div>
      <div class="scorebox"><div class="disp" style="font-size:22px;font-weight:700">${m.t}</div><div class="muted" style="font-size:13px">${fmtDate(m.d, 'dm')}</div></div>
      <div class="side r"><div class="tname">${esc(teamName(m.a))}</div>${crest(m.a, 64)}</div></div>
    <div class="page" style="padding-top:6px">
      <div class="row wrap" style="justify-content:center;gap:10px;margin-bottom:14px">${compBadge(c, 24)}<b>${esc(c ? c.name : '')}</b><span class="muted">${rd ? esc(rd.name) : ''}</span>
        <span class="chip">🏟 ${esc(m.n ? 'Campo neutro' : (host.std || 'Estádio do ' + host.n))}</span><span class="chip weather">${w.icon} ${w.label}, ${w.temp}°C</span>${tieInfo}</div>
      <div class="grid g2">${sideColumn(m.h, ph, isUserTeam(m.h))}${sideColumn(m.a, pa, isUserTeam(m.a))}</div>
      <div class="row wrap" style="margin-top:18px;gap:10px">
        <button class="btn" data-a="editLineupFromMatch">Alterar escalação</button><span class="grow"></span>
        <button class="btn" data-a="startLive">⏱ Minuto a minuto</button>
        <button class="btn gold" data-a="start2d">🎮 Jogar partida</button>
        <button class="btn primary big" data-a="simNow"><span class="x-key">✕</span>Simular partida</button>
      </div>
    </div></div>`;
}
act('editLineupFromMatch', () => { UI.returnToMatch = UI.match.mid; UI.screen = 'career'; UI.tab = 'squad'; UI.sub.squad = 'lineup'; render(); });
act('backToMatch', () => { UI.screen = 'match'; UI.match = { mid: UI.returnToMatch, phase: 'pre' }; UI.returnToMatch = null; render(); });
act('simNow', () => {
  const m = S.matches[UI.match.mid];
  const st = startMatchState(m, { user: S.user.team });
  st.autoUser = true;
  st.deferPens = true;
  simulateRange(st, m, 45 + st.stoppage[0]);
  st.min = 45; st.half = 2;
  simulateRange(st, m, 90 + st.stoppage[1]);
  finishRegulation(st, m);
  UI.match.st = st;
  if (st.pendPens) { askPens(m, st); return; }
  applyMatchResult(m, st);
  UI.match.phase = 'post';
  render();
});
// the tie goes to penalties: the user chooses between playing them (2D) and simulating them
function askPens(m, st) {
  UI.match.st = st;
  openModal(() => modalShell('🎯 Disputa de pênaltis', `<p style="margin:0 0 10px">${esc(teamName(m.h))} ${st.score[0]} x ${st.score[1]} ${esc(teamName(m.a))}. O confronto está empatado${st.et ? ' mesmo depois da prorrogação' : ' e não tem prorrogação'}: a decisão é nos pênaltis.</p><p class="muted" style="margin:0">Você pode bater e defender os pênaltis na partida jogável, ou deixar o jogo simular.</p>`,
    '<button class="btn" data-a="pensSim">⏩ Simular pênaltis</button><button class="btn gold" data-a="pensPlay">🎯 Disputar pênaltis</button>'), { size: 'narrow' });
}
act('pensSim', () => {
  const M = UI.match, m = S.matches[M.mid], st = M.st;
  closeAllModals();
  st.pendPens = false; st.deferPens = false;
  st.pen = penaltyShootout(st);
  evAdd(st, { min: st.et ? 120 : st.min, t: 'pen', s: -1, txt: `Pênaltis: ${teamName(m.h)} ${st.pen[0]} x ${st.pen[1]} ${teamName(m.a)}.`, h: st.et ? 3 : 2 });
  finishLive();
});
act('pensPlay', () => {
  const M = UI.match, m = S.matches[M.mid], st = M.st;
  closeAllModals();
  g2Defaults();
  st.pendPens = false; st.deferPens = false;
  M.phase = 'playing';
  Game2D.startShootoutOnly(m, st, { minutes: G2PREF.len, diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: G2PREF.replay }, () => { UI.match.st = st; finishLive(); });
});
// ---------- live minute-by-minute
act('startLive', () => {
  const m = S.matches[UI.match.mid];
  const st = startMatchState(m, { user: S.user.team });
  st.half = 1;
  st.deferPens = true;
  UI.match.st = st;
  UI.match.phase = 'live';
  UI.match.speed = UI.match.speed || 2;
  UI.match.paused = false;
  UI.match.stage = 'h1';
  UI.match.mom = []; UI.match.feed = []; UI.match.ball = { x: 52.5, y: 34, k: 0, hot: false };
  evAdd(st, { min: 0, t: 'ko', s: -1, txt: `Bola rolando! ${teamName(m.h)} x ${teamName(m.a)}.`, h: 1 });
  render();
  liveLoop();
});
function minuteLabel(st, e) {
  const half = e ? e.h : st.half;
  const mn = e ? e.min : st.min;
  if (half === 1 && mn > 45) return `45+${mn - 45}'`;
  if (half === 2 && mn > 90) return `90+${mn - 90}'`;
  return `${mn}'`;
}
let liveTimer = 0;
function liveLoop() {
  clearTimeout(liveTimer);
  const M = UI.match;
  if (!M || M.phase !== 'live' || M.paused) return;
  const m = S.matches[M.mid];
  const st = M.st;
  const delay = [0, 700, 380, 160, 60][M.speed] || 380;
  liveTimer = setTimeout(() => {
    if (UI.match !== M || M.paused) return;
    const endH1 = 45 + st.stoppage[0];
    const endH2 = 90 + st.stoppage[1];
    const b4 = { ev: st.ev.length, sh: st.stats.sh.slice(), sot: st.stats.sot.slice(), cor: st.stats.cor.slice(), min: st.min };
    if (M.stage === 'h1') {
      if (st.min < endH1) simulateRange(st, m, st.min + 1);
      if (st.min >= endH1) { M.stage = 'ht'; M.paused = true; evAdd(st, { min: st.min, t: 'ht', s: -1, txt: `Fim do primeiro tempo: ${st.score[0]} x ${st.score[1]}.`, h: 1 }); }
    } else if (M.stage === 'h2') {
      if (st.min < endH2) simulateRange(st, m, st.min + 1);
      if (st.min >= endH2) {
        // extra time / penalties if needed
        const needs = matchNeedsDecider(m) && (() => { const [bh, ba] = tieAggregateBefore(m); return bh + st.score[0] === ba + st.score[1]; })();
        if (needs && S.comps[m.c] && S.comps[m.c].noET) {
          st.pen = decidePens(st);
          if (st.pen) evAdd(st, { min: st.min, t: 'pen', s: -1, txt: `Sem prorrogação: pênaltis! ${teamName(m.h)} ${st.pen[0]} x ${st.pen[1]} ${teamName(m.a)}.`, h: 2 });
          finishLive(); return;
        }
        if (needs) { M.stage = 'et'; st.half = 3; st.min = 90; st.xg = st.xg.map((x) => x * 0.95); evAdd(st, { min: 90, t: 'ht', s: -1, txt: 'Empate no agregado: vamos para a prorrogação!', h: 2 }); }
        else { finishLive(); return; }
      }
    } else if (M.stage === 'et') {
      if (st.min < 120) simulateRange(st, m, st.min + 1);
      if (st.min >= 120) {
        const [bh, ba] = tieAggregateBefore(m);
        if (bh + st.score[0] === ba + st.score[1]) { st.pen = decidePens(st); st.et = true; if (st.pen) evAdd(st, { min: 120, t: 'pen', s: -1, txt: `Pênaltis: ${teamName(m.h)} ${st.pen[0]} x ${st.pen[1]} ${teamName(m.a)}.`, h: 3 }); }
        st.et = true;
        finishLive(); return;
      }
    }
    if (st.min > b4.min) liveTrack(M, st, b4);
    updateLiveDom();
    liveLoop();
  }, delay);
}
// ---------- live tracker: where the play is, attack momentum and the play-by-play between real events
const LIVE_FILL = {
  calm: ['{T} troca passes no campo de defesa.', '{T} roda a bola com paciência.', 'Jogo estudado no meio-campo.', '{p} recua a bola para a defesa.', '{T} tenta encontrar espaços.', 'Bola dividida no meio-campo, ninguém leva vantagem.', '{p} pede calma e organiza a saída.', 'Falta no meio-campo, nada de perigo.'],
  push: ['{T} pressiona a saída de bola.', '{p} tenta o drible pela ponta.', 'Cruzamento de {p}, a zaga afasta.', '{p} recebe na intermediária e procura o passe.', 'Lançamento para {p}, a defesa corta.', '{T} chega com muitos jogadores ao ataque.', 'A torcida empurra {t}!', '{p} arranca pelo meio e sofre a falta.', 'Tabela rápida {d}, a marcação acompanha.'],
  hot: ['Pressão total {d}!', 'Bate-rebate na área, a defesa afasta!', '{p} invade a área e é desarmado na hora H.', '{T} troca passes na entrada da área.', '{p} tenta o passe na pequena área, o goleiro sai bem.', 'Escanteio para {t}, a zaga tira de cabeça.', 'Momento de sufoco para a defesa adversária!'],
};
function liveTrack(M, st, b4) {
  if (!M.mom) { M.mom = []; M.feed = []; M.ball = { x: 52.5, y: 34, k: 0 }; }
  const newEv = st.ev.slice(b4.ev);
  const d = (k) => (st.stats.sh[k] - b4.sh[k]) * 0.45 + (st.stats.sot[k] - b4.sot[k]) * 0.35 + (st.stats.cor[k] - b4.cor[k]) * 0.3;
  const R = Math.random;
  let v = (st.stats.poss[0] - 50) / 50 * 0.35 + (R() - 0.5) * 0.55 + d(0) - d(1);
  for (const e of newEv) { if (e.t === 'goal') v += e.s === 0 ? 0.9 : -0.9; else if (e.t === 'chance') v += e.s === 0 ? 0.35 : -0.35; }
  const prev = M.mom.length ? M.mom[M.mom.length - 1].v : 0;
  v = clamp(prev * 0.35 + v * 0.75, -1, 1);
  M.mom.push({ min: st.min, h: st.half, v, g: newEv.filter((e) => e.t === 'goal').map((e) => e.s), c: newEv.filter((e) => e.t === 'red').map((e) => e.s) });
  // home attacks to the right on the tracker
  const ax = (k, depth) => (k === 0 ? 52.5 + depth * 52.5 : 52.5 - depth * 52.5);
  let k = v >= 0 ? 0 : 1;
  let x, y = 34 + (R() - 0.5) * 44;
  const last = newEv.filter((e) => e.s >= 0 && e.t !== 'sub').pop();
  if (last && ['goal', 'save', 'miss', 'chance'].includes(last.t)) { k = last.s; x = ax(k, last.t === 'goal' ? 0.97 : last.t === 'chance' ? 0.68 : 0.84); y = 34 + (R() - 0.5) * (last.t === 'goal' ? 5 : 20); }
  else if (last && (last.t === 'yellow' || last.t === 'red')) x = ax(1 - last.s, 0.15 + R() * 0.45);
  else x = ax(k, Math.min(0.88, Math.abs(v) * 0.85 + R() * 0.2));
  M.ball = { x: clamp(x, 2, 103), y: clamp(y, 4, 64), k, hot: !!(last && last.t === 'goal'), v };
  if (!newEv.length && R() < 0.32) {
    const side = st.sides[k];
    const set = Math.abs(v) > 0.62 ? LIVE_FILL.hot : Math.abs(v) > 0.3 ? LIVE_FILL.push : LIVE_FILL.calm;
    const outfield = side.on.filter((pid, i) => pid && side.slotsOn[i] !== 'GK');
    const pid = outfield.length ? outfield[Math.floor(R() * outfield.length)] : 0;
    const txt = set[Math.floor(R() * set.length)].replace('{T}', TA(side.id)).replace('{t}', tA(side.id)).replace('{d}', tA(side.id, 'do')).replace('{p}', pid ? pidName(pid) : teamName(side.id));
    M.feed.push({ at: st.ev.length, min: st.min, h: st.half, t: 'info', s: k, txt });
  }
}
function liveColors(m) {
  const H = S.teams[m.h], A = S.teams[m.a];
  const vis = (t) => (lum(t.c1 || '#888') >= 0.16 ? t.c1 : (t.c2 && lum(t.c2) >= 0.16 ? t.c2 : '#9aa7b0'));
  const ch = vis(H);
  let ca = vis(A);
  const [r1, g1, b1] = hexToRgb(ch), [r2, g2, b2] = hexToRgb(ca);
  if (Math.hypot(r1 - r2, g1 - g2, b1 - b2) < 90) ca = A.c2 && A.c2 !== ca && lum(A.c2) >= 0.16 ? A.c2 : (lum(ch) > 0.7 ? '#4b6cff' : '#f2f2f2');
  return [ch, ca];
}
function livePitchSvg(M, m) {
  const b = M.ball || { x: 52.5, y: 34, k: 0 };
  const [ch, ca] = liveColors(m);
  const col = b.k === 0 ? ch : ca;
  const zx = b.x < 35 ? 0 : b.x < 70 ? 35 : 70;
  const danger = Math.abs(b.v || 0) > 0.62 || b.hot;
  return `<svg class="lv-pitch" viewBox="-3 -3 111 74" role="img" aria-label="Campo ao vivo">
    <defs><radialGradient id="lvglow"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect x="-3" y="-3" width="111" height="74" rx="3" fill="#2f6a2a"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 10.5}" y="0" width="10.5" height="68" fill="${i % 2 ? '#3b7a33' : '#357230'}"/>`).join('')}
    <rect id="lv-zone" x="${zx}" y="0" width="35" height="68" fill="${col}" opacity="${danger ? 0.32 : 0.16}"/>
    <g fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="0.5"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/>
      <rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/>
      <rect x="-2" y="30.34" width="2" height="7.32"/><rect x="105" y="30.34" width="2" height="7.32"/></g>
    <g id="lv-ball" style="transform:translate(${b.x}px,${b.y}px)"><circle r="7" fill="url(#lvglow)" opacity="${danger ? 0.9 : 0.45}" class="${danger ? 'lv-pulse' : ''}"/><circle r="1.6" fill="#fff" stroke="#111" stroke-width="0.5"/></g>
  </svg>`;
}
function momentumSvg(M, m) {
  const mom = M.mom || [];
  const [ch, ca] = liveColors(m);
  const W = Math.max(96, mom.length + 2);
  let half = -1;
  mom.forEach((x, i) => { if (half < 0 && x.h === 2) half = i; });
  const bars = mom.map((x, i) => {
    const hgt = Math.max(0.6, Math.abs(x.v) * 18);
    return `<rect x="${i + 0.1}" y="${x.v >= 0 ? -hgt : 0}" width="0.8" height="${hgt}" fill="${x.v >= 0 ? ch : ca}"/>`;
  }).join('');
  const marks = mom.map((x, i) => x.g.map((s) => `<circle cx="${i + 0.5}" cy="${s === 0 ? -20.5 : 20.5}" r="1.6" fill="#fff" stroke="${s === 0 ? ch : ca}" stroke-width="0.7"/>`).join('') + x.c.map((s) => `<rect x="${i}" y="${s === 0 ? -22 : 19}" width="1.2" height="2.6" fill="#ff5d5d"/>`).join('')).join('');
  return `<svg class="lv-mom" viewBox="0 -24 ${W} 48" preserveAspectRatio="none" role="img" aria-label="Pressão no jogo minuto a minuto">
    <line x1="0" y1="0" x2="${W}" y2="0" stroke="rgba(255,255,255,0.25)" stroke-width="0.3"/>
    ${half > 0 ? `<line x1="${half}" y1="-24" x2="${half}" y2="24" stroke="rgba(255,255,255,0.25)" stroke-width="0.3" stroke-dasharray="1 1"/>` : ''}
    ${bars}${marks}</svg>`;
}
// real events and the narration in between, newest first; only the lines added since the last draw animate in
function liveFeedHtml(M, st) {
  const items = st.ev.map((e, i) => ({ e, k: i * 2 + 1, j: 0 })).concat((M.feed || []).map((f, j) => ({ e: f, k: f.at * 2, j })));
  items.sort((a, b) => b.k - a.k || b.j - a.j);
  const fresh = Math.max(0, items.length - (M.feedShown == null ? items.length : M.feedShown));
  M.feedShown = items.length;
  return items.map(({ e }, i) => `<div class="ev ${e.t}${i < fresh ? ' new' : ''}"><span class="mn">${e.s === -1 ? '' : minuteLabel(st, e)}</span><span>${e.t === 'info' ? '·' : EV_ICON[e.t] || '•'}</span><span>${esc(e.txt)}</span></div>`).join('');
}
function liveLabel(M, m) {
  const b = M.ball;
  if (!b || !M.mom || !M.mom.length) return 'Bola rolando';
  const id = b.k === 0 ? m.h : m.a;
  const a = Math.abs(b.v || 0);
  return b.hot ? `Gol ${tA(id, 'do')}!` : a > 0.62 ? `Pressão ${tA(id, 'do')}` : a > 0.3 ? `Ataque ${tA(id, 'do')}` : `Posse ${tA(id, 'do')}`;
}
function finishLive() {
  const M = UI.match;
  const m = S.matches[M.mid];
  if (M.st.pendPens) { askPens(m, M.st); return; }
  M.st.done = true;
  evAdd(M.st, { min: M.st.min, t: 'ft', s: -1, txt: `Fim de jogo: ${teamName(m.h)} ${M.st.score[0]} x ${M.st.score[1]} ${teamName(m.a)}.`, h: M.st.half });
  applyMatchResult(m, M.st);
  M.phase = 'post';
  render();
}
const EV_ICON = { goal: '⚽', save: '🧤', miss: '↗', chance: '⚡', yellow: '🟨', red: '🟥', inj: '✚', sub: '⇄', alien: '👽', ht: '⏸', ft: '🏁', ko: '▶', pen: '🎯' };
function viewLive(m) {
  const M = UI.match;
  const st = M.st;
  const userSide = isUserTeam(m.h) ? 0 : 1;
  const stageLbl = M.stage === 'ht' ? 'INTERVALO' : M.stage === 'et' ? 'PRORROGAÇÃO' : minuteLabel(st);
  return `<div class="match-screen">
    <div class="score-head"><div class="side">${crest(m.h, 56)}<div class="tname">${esc(teamName(m.h))}</div></div>
      <div class="scorebox"><div class="sc" id="lv-score">${st.score[0]} - ${st.score[1]}</div><div class="clock live" id="lv-clock">${stageLbl}</div></div>
      <div class="side r"><div class="tname">${esc(teamName(m.a))}</div>${crest(m.a, 56)}</div></div>
    <div class="page" style="padding-top:6px"><div class="lv-grid">
      <div class="panel lv-a"><div class="row wrap" style="margin-bottom:10px">
        ${M.stage === 'ht' ? `<button class="btn primary" data-a="liveSecondHalf">▶ Iniciar 2º tempo</button>` : `<button class="btn ${M.paused ? 'primary' : ''}" data-a="livePause">${M.paused ? '▶ Continuar' : '⏸ Pausar'}</button>`}
        <div class="seg">${[1, 2, 3, 4].map((s) => `<button class="${M.speed === s ? 'on' : ''}" data-a="liveSpeed" data-v="${s}">${['', '1x', '2x', '4x', '8x'][s]}</button>`).join('')}</div>
        <span class="grow"></span><button class="btn sm" data-a="liveSubs">Substituições (${st.subsLeft[userSide]})</button><button class="btn sm" data-a="liveSkip">Simular o resto</button></div>
        <div class="row wrap" style="margin-bottom:10px"><span class="muted" style="font-size:13px">Mentalidade:</span><div class="seg">${[[-1, 'Defensiva'], [0, 'Equilibrada'], [1, 'Ofensiva']].map(([v, l]) => `<button class="${(st.sides[userSide].mentality || 0) === v ? 'on' : ''}" data-a="liveMent" data-v="${v}">${l}</button>`).join('')}</div></div>
        <div class="lv-track"><div class="lv-tag"><span class="lv-dot"></span><b id="lv-lbl">${esc(liveLabel(M, m))}</b></div>
          <div class="lv-ends"><span>${crest(m.h, 18)} ${esc(teamShort(m.h))} ➜</span><span>⬅ ${esc(teamShort(m.a))} ${crest(m.a, 18)}</span></div>
          <div id="lv-pitch">${livePitchSvg(M, m)}</div>
          <div class="lv-mom-wrap"><div class="muted up" style="font-size:11px">Pressão no jogo</div><div id="lv-mom">${momentumSvg(M, m)}</div><div class="lv-axis"><span>0'</span><span>45'</span><span>90'</span></div></div></div></div>
      <div class="panel lv-b"><h3>Lance a lance</h3><div class="events" id="lv-events">${(M.feedShown = null, liveFeedHtml(M, st))}</div></div>
      <div class="panel lv-c"><h3>Estatísticas</h3><div class="col" id="lv-stats">${statBars(st.stats)}</div></div>
      <div class="panel lv-d"><h3>Em campo · ${esc(teamShort(st.sides[userSide].id))}</h3><div class="lineup-col" id="lv-onpitch">${onPitchHtml(st, userSide)}</div></div>
    </div></div></div>`;
}
function onPitchHtml(st, k) {
  const side = st.sides[k];
  return side.on.map((pid, i) => { const p = S.players[pid]; if (!p) return ''; const r = st.ratings[pid]; return `<div class="pl"><span class="pos ${POS_GROUP[side.slotsOn[i]]}">${POS_PT[side.slotsOn[i]]}</span><span class="grow">${esc(p.n)}</span>${fitBar(p)}<b class="tnum" style="width:30px;text-align:right">${r ? r.toFixed(1) : ''}</b></div>`; }).join('');
}
function updateLiveDom() {
  const M = UI.match;
  const st = M.st;
  const m = S.matches[M.mid];
  const sc = $('#lv-score'); if (!sc) return;
  sc.textContent = `${st.score[0]} - ${st.score[1]}`;
  $('#lv-clock').textContent = M.stage === 'ht' ? 'INTERVALO' : M.stage === 'et' ? `PRORROG. ${st.min}'` : minuteLabel(st);
  const evs = $('#lv-events'); if (evs) evs.innerHTML = liveFeedHtml(M, st);
  const ball = $('#lv-ball');
  if (ball && M.ball) {
    ball.style.transform = `translate(${M.ball.x}px,${M.ball.y}px)`;
    const glow = ball.querySelector('circle');
    const danger = Math.abs(M.ball.v || 0) > 0.62 || M.ball.hot;
    glow.setAttribute('opacity', danger ? 0.9 : 0.45); glow.classList.toggle('lv-pulse', danger);
    const zone = $('#lv-zone');
    if (zone) { const [ch, ca] = liveColors(m); zone.setAttribute('x', M.ball.x < 35 ? 0 : M.ball.x < 70 ? 35 : 70); zone.setAttribute('fill', M.ball.k === 0 ? ch : ca); zone.setAttribute('opacity', danger ? 0.32 : 0.16); }
  }
  const lbl = $('#lv-lbl'); if (lbl) lbl.textContent = liveLabel(M, m);
  const mom = $('#lv-mom'); if (mom) mom.innerHTML = momentumSvg(M, m);
  const stats = $('#lv-stats'); if (stats) stats.innerHTML = statBars(st.stats);
  const userSide = isUserTeam(m.h) ? 0 : 1;
  const op = $('#lv-onpitch'); if (op) op.innerHTML = onPitchHtml(st, userSide);
  if (M.stage === 'ht' && !$('[data-a="liveSecondHalf"]')) render();
}
act('livePause', () => { const M = UI.match; M.paused = !M.paused; render(); if (!M.paused) liveLoop(); });
act('liveSpeed', (el) => { UI.match.speed = +el.dataset.v; render(); liveLoop(); });
act('liveMent', (el) => {
  const M = UI.match; const m = S.matches[M.mid];
  const k = isUserTeam(m.h) ? 0 : 1;
  M.st.sides[k].mentality = +el.dataset.v;
  computeRatesLive(M.st);
  render(); if (!M.paused) liveLoop();
});
act('liveSecondHalf', () => {
  const M = UI.match; const st = M.st;
  st.min = 45; st.half = 2; M.stage = 'h2'; M.paused = false;
  evAdd(st, { min: 45, t: 'ko', s: -1, txt: 'Começa o segundo tempo!', h: 2 });
  render(); liveLoop();
});
act('liveSkip', () => {
  const M = UI.match; const m = S.matches[M.mid]; const st = M.st;
  clearTimeout(liveTimer);
  st.autoUser = true;
  st.deferPens = true;
  if (M.stage === 'h1' || M.stage === 'ht') { simulateRange(st, m, 45 + st.stoppage[0]); st.min = 45; st.half = 2; }
  if (M.stage !== 'et') simulateRange(st, m, 90 + st.stoppage[1]);
  finishRegulation(st, m);
  if (st.pendPens) { askPens(m, st); return; }
  applyMatchResult(m, st);
  M.phase = 'post';
  render();
});
act('liveSubs', () => {
  const M = UI.match; const m = S.matches[M.mid];
  const k = isUserTeam(m.h) ? 0 : 1;
  const wasPaused = M.paused; M.paused = true; clearTimeout(liveTimer);
  UI.subSel = null;
  openModal(() => {
    const st = M.st; const side = st.sides[k];
    const bench = side.bench.filter((b) => !side.on.includes(b) && !side.out.includes(b));
    return modalShell(`Substituições · restam ${st.subsLeft[k]}`, `<div class="grid g2"><div><div class="muted up" style="font-size:12px;margin-bottom:6px">Sai</div>${side.on.map((pid, i) => { const p = S.players[pid]; if (!p) return ''; return `<div class="bp ${UI.subSel === i ? 'sel' : ''}" data-a="subPickOut" data-i="${i}">${posBadge(side.slotsOn[i])}<span class="grow">${esc(p.n)}</span>${fitBar(p)}<b>${(st.ratings[pid] || 6).toFixed(1)}</b></div>`; }).join('')}</div>
      <div><div class="muted up" style="font-size:12px;margin-bottom:6px">Entra</div>${bench.map((pid) => { const p = S.players[pid]; return p ? `<div class="bp" data-a="subPickIn" data-id="${pid}">${posBadge(p.p)}<span class="grow">${esc(p.n)}</span>${formTag(p)}${ovrBadge(p.o)}</div>` : ''; }).join('') || '<div class="muted">Sem reservas.</div>'}</div></div>`,
    '<button class="btn primary" data-a="closeModal">Concluir</button>');
  }, { onClose: () => { M.paused = wasPaused && M.stage !== 'ht' ? wasPaused : M.paused; if (M.stage === 'ht') M.paused = true; else M.paused = wasPaused; render(); if (!M.paused) liveLoop(); } });
});
act('subPickOut', (el) => { UI.subSel = +el.dataset.i; refreshModal(); });
act('subPickIn', (el) => {
  const M = UI.match; const m = S.matches[M.mid];
  const k = isUserTeam(m.h) ? 0 : 1;
  if (UI.subSel == null) { toast('Escolha primeiro quem sai.', true); return; }
  if (M.st.subsLeft[k] <= 0) { toast('Sem substituições restantes.', true); return; }
  doSub(M.st, k, UI.subSel, +el.dataset.id, M.st.min);
  UI.subSel = null;
  refreshModal();
});
// ---------- post match
function viewPost(m) {
  const st = UI.match.st;
  const goals = (k) => st.ev.filter((e) => e.t === 'goal' && e.s === k).map((e) => `${e.p ? esc(pidName(e.p)) : 'Gol contra'} ${minuteLabel(st, e)}`).join(', ');
  const uidSide = isUserTeam(m.h) ? 0 : 1;
  const mine = new Set(st.sides[uidSide].xi.concat(st.ev.filter((e) => e.t === 'sub' && e.s === uidSide).map((e) => e.p)));
  const ratings = Object.entries(m.rt || {}).map(([pid, r]) => ({ p: S.players[pid], r })).filter((x) => x.p && mine.has(x.p.id)).sort(by((x) => x.r, -1));
  const motm = ratings[0];
  const res = resultLetter(m, S.user.team);
  return `<div class="match-screen">
    <div class="score-head"><div class="side">${crest(m.h, 64)}<div class="tname">${esc(teamName(m.h))}</div></div>
      <div class="scorebox"><div class="sc">${m.hg} - ${m.ag}</div><div class="clock">${m.pen ? `PÊN ${m.pen[0]}-${m.pen[1]}` : m.et ? 'PRORROG.' : 'FINAL'}</div></div>
      <div class="side r"><div class="tname">${esc(teamName(m.a))}</div>${crest(m.a, 64)}</div></div>
    <div class="page" style="padding-top:6px">
      <div class="row wrap" style="justify-content:center;gap:24px;margin-bottom:14px;font-size:14px"><span>⚽ ${goals(0) || '—'}</span><span class="muted">|</span><span>⚽ ${goals(1) || '—'}</span></div>
      <div class="grid g2"><div class="panel"><h3>${res === 'V' ? 'Vitória!' : res === 'D' ? 'Derrota' : 'Empate'}</h3><div class="col">${statBars(st.stats)}</div></div>
        <div class="panel"><h3>Notas · ${esc(teamShort(S.user.team))}${motm ? ` <span class="sub">melhor em campo: ${esc(motm.p.n)}</span>` : ''}</h3>
          <div class="lineup-col">${ratings.map((x) => `<div class="pl"><span class="grow">${esc(x.p.n)}</span><b class="tnum" style="color:${x.r >= 7.5 ? 'var(--win)' : x.r < 6 ? 'var(--loss)' : 'var(--text)'}">${x.r.toFixed(1)}</b></div>`).join('')}</div></div></div>
      <div class="row" style="margin-top:18px"><span class="grow"></span><button class="btn primary big" data-a="postContinue"><span class="x-key">✕</span>Continuar</button></div>
    </div></div>`;
}
act('postContinue', async () => {
  UI.match = null;
  UI.screen = 'career'; UI.tab = 'central';
  render();
  saveGame(S.id).then(async () => { SAVES = await listSaves(); });
});

/* ===================== trophies celebration & season end ===================== */
function showCelebration() {
  if (!S.celebrate || !S.celebrate.length) return;
  const tr = S.celebrate.shift();
  UI.celebrating = true;
  const t = S.teams[tr.team];
  const wrap = document.createElement('div');
  wrap.className = 'celebrate';
  wrap.innerHTML = `<canvas></canvas><div class="inner">
      <div class="muted up" style="font-size:14px;letter-spacing:0.2em">${esc(tr.name)} · ${esc(tr.season)}</div>
      ${trophySVG(tr.key, 220).replace('class="tsvg"', 'class="trophy-svg"')}
      <div class="champ">CAMPEÃO!</div>
      <div class="row" style="justify-content:center;gap:12px;margin-top:12px">${crest(t, 48)}<span class="disp" style="font-size:34px;font-weight:800">${esc(t.n)}</span></div>
      ${tr.coins ? `<div class="coin-pill" style="margin-top:14px;font-size:20px"><span class="coin">F</span>+${tr.coins} FutCoins</div>` : ''}
      <div style="margin-top:22px"><button class="btn primary big" id="cel-ok">Continuar</button></div></div>`;
  document.body.appendChild(wrap);
  const cv = wrap.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const resize = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
  resize();
  const cols = [t.c1, t.c2, '#ffc54d', '#ffffff'];
  const parts = Array.from({ length: 220 }, () => ({ x: Math.random() * cv.width, y: -Math.random() * cv.height, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 7, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: cols[Math.floor(Math.random() * cols.length)] }));
  let alive = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = () => {
    if (!alive) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of parts) {
      p.x += p.vx * devicePixelRatio; p.y += p.vy * devicePixelRatio; p.a += p.va;
      if (p.y > cv.height + 20) { p.y = -20; p.x = Math.random() * cv.width; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8); ctx.restore();
    }
    requestAnimationFrame(tick);
  };
  if (!reduce) tick();
  wrap.querySelector('#cel-ok').onclick = () => {
    alive = false; wrap.remove(); UI.celebrating = false;
    if (S.celebrate.length) showCelebration(); else render();
  };
}
act('openSeasonEnd', () => openSeasonEnd());
function openSeasonEnd() {
  const sum = S.pendingEnd;
  if (!sum) return;
  UI.seasonOpen = true;
  const uid = sum.team;
  const t = S.teams[uid];
  const offers = (sum.offers || []).map((id) => S.teams[id]).filter(Boolean);
  const owned = WALLET.owned.map((k) => Object.values(S.teams).find((x) => x.key === k)).filter((x) => x && validCareerTeam(x.id) && x.id !== uid);
  const jobless = sum.unemployed || S.coach.unemployed;
  openModal(() => modalShell('Fim de temporada', `
    <div class="row wrap" style="gap:16px">${jobless ? '<div class="logo-mark" style="width:64px;height:64px;font-size:22px">UM</div>' : crest(t, 64)}<div class="grow"><div class="disp" style="font-size:30px;font-weight:800">${jobless ? esc(S.coach.name) + ' · sem clube' : esc(t.n)}</div>
      <div class="muted">${jobless ? 'Você terminou a temporada sem clube. Aceite uma das propostas ou continue no mercado de trabalho.' : ''}${sum.league ? `${sum.pos}º lugar na ${esc(sum.league)}` : ''}${sum.relegated ? ' · <b style="color:var(--loss)">rebaixado</b>' : ''}${sum.promoted ? ' · <b style="color:var(--win)">promovido</b>' : ''}</div></div>
      ${sum.coins ? `<div class="coin-pill" style="font-size:18px"><span class="coin">F</span>+${sum.coins}</div>` : ''}</div>
    <div class="grid g3" style="margin-top:16px;${jobless ? 'display:none' : ''}">
      <div class="stat-tile"><div class="k">Objetivo</div><div class="v" style="font-size:18px">${esc(sum.obj)}</div><div style="color:${sum.objOk ? 'var(--win)' : sum.objOk === false ? 'var(--loss)' : 'var(--muted)'};font-weight:700;font-size:13px">${sum.objOk ? 'Cumprido' : sum.objOk === false ? 'Não cumprido' : '—'}</div></div>
      <div class="stat-tile"><div class="k">Confiança</div><div class="v">${sum.conf}%</div></div>
      <div class="stat-tile"><div class="k">Nota do técnico</div><div class="v">${(sum.rating / 10).toFixed(1)}</div></div></div>
    ${sum.titles.length ? `<div class="panel" style="margin-top:14px"><h3>Títulos da temporada</h3><div class="trophy-grid">${sum.titles.map((tr) => `<div class="trophy-card">${trophySVG(tr.key, 56)}<div style="font-weight:700">${esc(tr.name)}</div><div class="muted" style="font-size:12px">+${tr.coins} FutCoins</div></div>`).join('')}</div></div>` : ''}
    ${sum.fired ? `<div class="panel" style="margin-top:14px;border-color:var(--loss)"><b>A diretoria decidiu encerrar o seu contrato.</b> Escolha uma das propostas abaixo ou procure trabalho no mercado.</div>` : ''}
    <h3 style="font-size:22px;margin:18px 0 8px">Propostas para a próxima temporada</h3>
    <div class="choice-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${offers.map((o) => {
      const r = o.isNat ? nationRating(o.code) : teamRating(o.id);
      let where = '';
      if (S.mode === 'ultra') { const dv = S.ultra.div.findIndex((d) => d.includes(o.id)); where = dv >= 0 ? `Ultra Liga ${dv + 1}` : 'Banco'; }
      else if (S.mode === 'normal') { const lg = S.normal.find((l) => l.teams.includes(o.id) || l.bank.includes(o.id)); where = lg ? (lg.teams.includes(o.id) ? lg.name : LEAGUE_NAMES2[lg.id] || '2ª divisão') : ''; }
      return `<button class="offer" data-a="endPick" data-id="${o.id}"><div class="row">${crest(o, 40)}<div class="grow"><div class="tn" style="font-size:20px">${esc(o.n)}</div><div class="muted" style="font-size:12px">${esc(where)}</div></div></div><div class="row">${starStr(r)}</div><span class="btn xs primary" style="align-self:flex-start">Aceitar</span></button>`;
    }).join('')}</div>
    ${owned.length ? `<div class="panel" style="margin-top:14px"><h3>Meus times <span class="sub">comprados com FutCoins</span></h3><div class="row wrap">${owned.map((o) => `<button class="btn" data-a="endPick" data-id="${o.id}">${crest(o, 22)} ${esc(o.n)}</button>`).join('')}</div></div>` : ''}`,
    `<button class="btn" data-a="openStore">🛒 Comprar times</button><span class="grow"></span>${sum.fired || jobless ? '<button class="btn" data-a="endStay">Ficar sem clube</button>' : `<button class="btn primary" data-a="endStay">Continuar ${esc(tA(t, 'no'))}</button>`}`), { size: 'wide', locked: true });
}
act('endPick', (el) => {
  const id = +el.dataset.id;
  closeSeasonEnd({ team: id });
  UI.seasonOpen = false;
  closeAllModals();
  render();
  toast(`Você agora comanda ${tA(id)}!`);
  saveGame(S.id);
});
act('endStay', () => {
  closeSeasonEnd(null);
  UI.seasonOpen = false;
  closeAllModals();
  render();
  saveGame(S.id);
});

/* ===================== playable 2D match (top-down arcade, World Soccer Champs style) ===================== */
// match settings kept on this device
const G2PREF = (() => { try { return JSON.parse(localStorage.getItem('um-g2d') || '{}') || {}; } catch (e) { return {}; } })();
function saveG2Pref() { try { localStorage.setItem('um-g2d', JSON.stringify(G2PREF)); } catch (e) { /* storage unavailable */ } }
const G2_DIFFS = [['facil', 'Fácil'], ['normal', 'Normal'], ['dificil', 'Difícil']];
const G2_CAMS = [['perto', 'Perto'], ['normal', 'Normal'], ['longe', 'Longe']];
const G2_ZOOM = { perto: 1.25, normal: 1, longe: 0.8 };
function g2Defaults() {
  if (![4, 6, 10].includes(G2PREF.len)) G2PREF.len = 6;
  if (!G2_DIFFS.some(([k]) => k === G2PREF.diff)) G2PREF.diff = 'normal';
  if (!G2_CAMS.some(([k]) => k === G2PREF.cam)) G2PREF.cam = 'normal';
  if (typeof G2PREF.sound !== 'boolean') G2PREF.sound = true;
  if (typeof G2PREF.replay !== 'boolean') G2PREF.replay = true;
  if (!G2_BTN.some(([k]) => k === G2PREF.btn)) G2PREF.btn = 1;
}
// size of the on-screen controls (joystick and buttons)
const G2_BTN = [[0.8, 'Pequeno'], [1, 'Normal'], [1.25, 'Grande'], [1.5, 'Enorme']];
function applyBtnSize(root) { if (root) root.style.setProperty('--bs', G2PREF.btn || 1); }
act('start2d', () => {
  g2Defaults();
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(G2PREF[k]) === String(v) ? 'on' : ''}" data-a="g2dOpt" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  openModal(() => modalShell('🎮 Jogar partida', `
    <p style="margin:0 0 14px">Você controla <b>${esc(tA(S.user.team))}</b> e ataca sempre para cima (para a direita em telas largas).</p>
    <div class="g2-opts">
      <div><div class="muted up">Duração</div>${seg('len', [[4, '4 min'], [6, '6 min'], [10, '10 min']])}</div>
      <div><div class="muted up">Dificuldade</div>${seg('diff', G2_DIFFS)}</div>
      <div><div class="muted up">Câmera</div>${seg('cam', G2_CAMS)}</div>
      <div><div class="muted up">Som</div>${seg('sound', [[true, 'Ligado'], [false, 'Desligado']])}</div>
      <div><div class="muted up">Replay dos gols</div>${seg('replay', [[true, 'Ligado'], [false, 'Desligado']])}</div>
      <div><div class="muted up">Botões na tela (toque)</div>${seg('btn', G2_BTN)}</div>
    </div>
    <div class="help-keys" style="margin-top:14px"><b>Teclado:</b> <span class="kbd">WASD</span> ou <span class="kbd">setas</span> movem · <span class="kbd">J</span> passe (sem a bola: troca de jogador) · <span class="kbd">K</span> chute, segure para mais força (sem a bola: carrinho) · <span class="kbd">L</span> enfiada no espaço (na cara do gol com o goleiro adiantado: cavadinha) · <span class="kbd">I</span> finta (1★) · <span class="kbd">O</span> giro (2★) · <span class="kbd">U</span> drible especial: caneta (3★), elástico (4★) e chapéu (5★) · <span class="kbd">Shift</span> corre devagar (a corrida é automática ao empurrar o direcional) · <span class="kbd">P</span> pausa</div>
    <div class="help-keys" style="margin-top:8px"><b>Toque:</b> joystick à esquerda (empurre até a borda para correr, mais leve para andar); PASSE, CHUTE e LANÇAR à direita, e FINTA, GIRO e ESPECIAL (dribles, liberados pelas estrelas de finta do jogador, que aparecem ao lado do nome dele) ao lado. A barra azul sob o jogador é o fôlego da corrida.</div>
    <div class="help-keys" style="margin-top:8px"><b>Pênaltis:</b> mire com o direcional e segure CHUTE para dar força (força demais vai por cima). Quando o adversário bate, escolha o canto do goleiro antes do chute. No mata-mata, se o empate persistir, a prorrogação é simulada e você disputa os pênaltis.</div>`,
  '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn gold" data-a="g2dGo">Começar</button>'), { size: 'narrow' });
});
act('g2dOpt', (el) => {
  const k = el.dataset.k;
  let v = el.dataset.v;
  if (k === 'len' || k === 'btn') v = +v;
  if (k === 'sound' || k === 'replay') v = v === 'true';
  G2PREF[k] = v;
  saveG2Pref();
  refreshModal();
});
act('g2dGo', () => {
  const M = UI.match;
  const m = M && S.matches[M.mid];
  closeAllModals();
  if (!m || m.done) return;
  g2Defaults();
  const st = startMatchState(m, { user: S.user.team });
  M.st = st;
  M.phase = 'playing';
  Game2D.start(m, st, { minutes: G2PREF.len, diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: G2PREF.replay }, () => finish2D(m, st));
});
function finish2D(m, st) {
  if (!st.decided) {
    st.min = Math.max(st.min || 0, 90 + st.stoppage[1]);
    st.half = 2;
    finishRegulation(st, m);
  } else st.done = true;
  applyMatchResult(m, st);
  UI.match.phase = 'post';
  render();
  window.scrollTo(0, 0);
  if (st.pen && !st.penPlayed) toast(st.et ? 'Empate no agregado: prorrogação e pênaltis foram simulados.' : 'Empate no agregado: os pênaltis foram simulados (sem prorrogação).');
  else if (st.et && !st.decided && !st.penPlayed) toast('Empate no agregado: a prorrogação foi simulada.');
}

const Game2D = (() => {
  const PL = 105, PW = 68, GOAL_W = 7.32, GOAL_H = 2.44, BOX_W = 40.32, BOX_D = 16.5;
  // difficulty: what the computer-controlled side gets (team 1); in automatic test runs both sides use "normal"
  const DIFF = {
    facil: { tackle: -0.09, passErr: 1.5, speed: 0.95, cpuSave: -0.08, userSave: 0.08, shootErr: 1.25, press: 1, slide: 0.025 },
    normal: { tackle: 0, passErr: 1, speed: 1, cpuSave: 0, userSave: 0, shootErr: 1, press: 2, slide: 0.045 },
    dificil: { tackle: 0.07, passErr: 0.7, speed: 1.04, cpuSave: 0.06, userSave: -0.04, shootErr: 0.85, press: 3, slide: 0.055 },
  };
  const KEYS = {};
  let G = null, root = null, cv = null, ctx = null, radar = null, rctx = null, onDone = null, rafId = 0;
  const hud = {};

  // ------------------------------------------------------------------ helpers
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const nrm = (x, y) => { const l = Math.hypot(x, y); return l > 1e-9 ? { x: x / l, y: y / l } : { x: 0, y: 0 }; };
  const grand = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
  const sideOf = (team) => (team === 0 ? G.userSide : 1 - G.userSide);
  const teamIdOf = (team) => G.st.sides[sideOf(team)].id;
  const nameOf = (p) => (p ? p.label : '');
  function keeperOf(team) { return G.players.find((p) => p.team === team && p.gk && !p.out) || null; }
  function nearestTo(team, x, y, noGK, except) {
    let best = null, bd = 1e9;
    for (const p of G.players) {
      if (p.out || p.team !== team || (noGK && p.gk) || p === except) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  function nearestOppDist(p) { let m = 99; for (const o of G.players) if (!o.out && o.team !== p.team) m = Math.min(m, Math.hypot(o.x - p.x, o.y - p.y)); return m; }
  const inBoxOf = (team, x, y) => Math.abs(x - PW / 2) < BOX_W / 2 && Math.abs(y - (team === 0 ? PL : 0)) < BOX_D; // box defended by `team`
  function pressureOn(p) {
    let s = 0;
    for (const o of G.players) if (!o.out && o.team !== p.team) { const d = dist(o, p); if (d < 3.5) s += (3.5 - d) / 3.5; }
    return s;
  }
  function laneOpen(p, q) {
    const dx = q.x - p.x, dy = q.y - p.y, L2 = dx * dx + dy * dy || 1;
    let m = 10;
    for (const o of G.players) {
      if (o.out || o.team === p.team) continue;
      const t = clamp(((o.x - p.x) * dx + (o.y - p.y) * dy) / L2, 0, 1);
      m = Math.min(m, Math.hypot(o.x - (p.x + dx * t), o.y - (p.y + dy * t)));
    }
    return m;
  }
  function cdist(a, b) { const A = hexToRgb(a), B = hexToRgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); }
  function shade(hex, f) { const [r, g, b] = hexToRgb(hex); const k = (c) => Math.round(clamp(f >= 0 ? c + (255 - c) * f : c * (1 + f), 0, 255)); return `rgb(${k(r)},${k(g)},${k(b)})`; }
  function minuteNow() { return (G.half === 1 ? 0 : 45) + (G.clock / G.halfLen) * 45; }
  function minuteInt() { return Math.max(G.half === 1 ? 1 : 46, Math.ceil(minuteNow())); }
  function halfEnd() { return G.halfLen * (45 + G.st.stoppage[G.half - 1]) / 45; }
  function clockLabel() {
    const mn = minuteNow();
    if (G.half === 1 && mn > 45) return `45+${Math.ceil(mn - 45)}'`;
    if (G.half === 2 && mn > 90) return `90+${Math.ceil(mn - 90)}'`;
    return `${Math.floor(mn)}'`;
  }

  // ------------------------------------------------------------------ teams & sprites
  const SKINS = ['#f3cfb0', '#e8b894', '#d29b6f', '#b07a4e', '#8a5733', '#603a22'];
  const HAIRS = ['#1d1510', '#2e2018', '#5a3a22', '#8a5a2e', '#d1a85c', '#0e0e0e', '#9a9a9a'];
  const DARK = new Set(['NGA', 'GHA', 'CIV', 'SEN', 'CMR', 'MLI', 'COD', 'ANG', 'CPV', 'HAI', 'CUW', 'JAM', 'RSA', 'GAB', 'GUI', 'BFA', 'TOG', 'BEN', 'GAM', 'SLE', 'ZAM', 'ZIM', 'KEN', 'TAN', 'UGA', 'ETH', 'SUR', 'TRI', 'MOZ', 'GNB', 'EQG', 'CGO', 'CTA', 'MTN', 'NIG', 'SDN', 'BDI', 'RWA', 'MAD', 'COM']);
  const MIXED = new Set(['BRA', 'COL', 'FRA', 'ENG', 'NED', 'POR', 'BEL', 'USA', 'VEN', 'ECU', 'PAN', 'CRC', 'HON', 'URU', 'CUB', 'DOM', 'SUI', 'GER', 'SWE', 'NOR', 'DEN', 'ESP', 'ITA', 'CAN', 'MAR', 'ALG', 'TUN', 'EGY', 'QAT', 'KSA', 'MEX', 'PER']);
  function makeKits(hT, aT) {
    const kit = (c1, c2) => ({ shirt: c1, trim: c2 && cdist(c1, c2) > 70 ? c2 : (lum(c1) > 0.5 ? '#1b2440' : '#ffffff'), shorts: cdist(c1, c2 || '#ffffff') < 70 ? (lum(c1) > 0.5 ? '#1b2440' : '#ffffff') : (c2 || '#ffffff'), socks: c1 });
    const home = kit(hT.c1 || '#c0392b', hT.c2);
    let away = kit(aT.c1 || '#2a5bd7', aT.c2);
    if (cdist(home.shirt, away.shirt) < 130) {
      const alt = aT.c2 && cdist(aT.c2, home.shirt) > 150 ? aT.c2 : (lum(home.shirt) > 0.55 ? '#1f2d6e' : '#f4f4f4');
      away = kit(alt, alt === aT.c2 ? aT.c1 : (lum(alt) > 0.5 ? '#1f2d6e' : '#ffffff'));
    }
    return [home, away];
  }
  function gkKitFor(team, kits) {
    const opts = team === 0 ? ['#2fd27a', '#a35cff', '#ff8a1f'] : ['#ffb21f', '#ff4fa3', '#22c3d6'];
    const c = opts.find((o) => cdist(o, kits[0].shirt) > 120 && cdist(o, kits[1].shirt) > 120) || opts[0];
    return { shirt: c, trim: '#1b1b1b', shorts: '#1b1b1b', socks: c };
  }
  function applyPlayer(sp, p) {
    const h = hashStr(p.n + '|' + p.id);
    const si = DARK.has(p.nat) ? 3 + (h % 3) : MIXED.has(p.nat) ? h % 6 : h % 3;
    const fb = formBonus(p); // the form bonus counts in the 2D match too
    const a = (p.a && p.a.length >= 6 ? p.a : [p.o, p.o, p.o, p.o, p.o, p.o]).map((v) => v + fb);
    // goalkeepers' attributes are diving, handling, kicking, reflexes, speed and positioning; an outfield player
    // pushed into goal keeps poor ones
    const natGK = p.p === 'GK';
    const gkv = (i) => (natGK ? a[i] || p.o + fb : clamp(p.o - 30, 25, 45));
    const spd = sp.gk ? 5.9 + clamp((natGK ? a[4] || 55 : 50) - 50, -10, 40) * 0.02 : 5.7 + clamp((a[0] || p.o) - 55, -15, 44) * 0.042;
    Object.assign(sp, {
      p, pid: p.id, speed: spd * (sp.team === 1 ? G.D.speed : 1),
      sho: a[1] || p.o, pas: a[2] || p.o, dri: a[3] || p.o, def: a[4] || p.o, phy: a[5] || p.o, ovr: p.o + fb,
      gkDiv: gkv(0), gkHan: gkv(1), gkKic: gkv(2), gkRef: gkv(3), gkPos: gkv(5), hgt: p.h || 180,
      skin: SKINS[si], hair: HAIRS[(h >> 6) % HAIRS.length], hs: (h >> 11) % 5, num: p.num || sp.slot + 1,
      label: p.s || p.n, sta: 1,
    });
    sp.stars = sp.gk ? 1 : skillStars(sp.dri);
    if (natGK) Object.assign(sp, { pas: sp.gkKic, sho: 40, dri: 40, def: 45 });
  }
  // skill-move stars (like FIFA): the better the dribbling, the more moves he can do
  function skillStars(dri) { return dri >= 84 ? 5 : dri >= 77 ? 4 : dri >= 70 ? 3 : dri >= 62 ? 2 : 1; }
  const SKILL_NEED = { feint: 1, spin: 2, special: 3 };
  const SPECIALS = [['nutmeg', 3], ['elastico', 4], ['rainbow', 5]];
  function makeSprite(p, team, k, pos, fx, fy, slot) {
    const sp = {
      team, side: k, pos, gk: pos === 'GK', slot, fx, fy,
      x: PW / 2, y: PL / 2, vx: 0, vy: 0, wx: 0, wy: 0, tx: PW / 2, ty: PL / 2, run: 0.7, dx: 0, dy: team === 0 ? -1 : 1,
      anim: Math.random() * 6, cool: 0, slide: 0, sx: 0, sy: 0, slideDone: false, fall: 0, tackT: 0, decT: 0, runT: 0, holdT: 0,
      out: false, inX: 0, inY: 0, sprint: false, cornerSpot: null, dive: null, kickT: 0, feintT: 0, fdx: 0, fdy: 0, diveT: 0, diveDir: 0, wall: false, sk: null, skCD: 0,
      dv: null, gz: 0, plan: null, cr: null, claim: null, setT: 0,
    };
    applyPlayer(sp, p);
    return sp;
  }
  function buildPlayers() {
    const { m, st } = G;
    G.kits = makeKits(S.teams[m.h], S.teams[m.a]);
    G.gkKits = [0, 1].map((k) => gkKitFor(k === G.userSide ? 0 : 1, G.kits));
    st.sides.forEach((side, k) => {
      const team = k === G.userSide ? 0 : 1;
      const slots = FORMATIONS[side.form] || FORMATIONS['4-3-3'];
      side.on.forEach((pid, i) => {
        const p = S.players[pid];
        if (!p || !slots[i]) return;
        G.players.push(makeSprite(p, team, k, side.slotsOn[i] || slots[i][0], slots[i][1] / 100, slots[i][2] / 100, i));
      });
    });
  }
  // after substitutions made by the engine (computer side), refresh the sprites of the changed slots
  function syncSprites() {
    for (const sp of G.players) {
      const side = G.st.sides[sp.side];
      const pid = side.on[sp.slot];
      if (!pid) { if (!sp.out) spriteOut(sp); continue; }
      if (pid !== sp.pid && S.players[pid]) { applyPlayer(sp, S.players[pid]); sp.pos = side.slotsOn[sp.slot] || sp.pos; }
    }
  }
  function cpuSub(minute) {
    const st = G.st, k = sideOf(1);
    if (st.subsLeft[k] <= 1) return;
    const before = st.ev.length;
    aiSub(st, k, null, minute, false);
    const e = st.ev[st.ev.length - 1];
    if (st.ev.length > before && e && e.t === 'sub') {
      syncSprites();
      say(`Substituição ${tA(st.sides[k].id, 'no')}: entra ${pidName(e.p)}${e.p2 ? `, sai ${pidName(e.p2)}` : ''}.`, 1);
    }
  }

  // ------------------------------------------------------------------ creation
  function create(m, st, a, b) {
    const opts = a && typeof a === 'object' ? a : Object.assign({}, b || {}, { minutes: a });
    const w = matchWeather(m);
    const minutes = opts.minutes || 6;
    G = {
      m, st, minutes, auto: !!opts.auto, userSide: opts.auto ? 0 : (isUserTeam(m.h) ? 0 : 1),
      D: DIFF[opts.auto ? 'normal' : opts.diff] || DIFF.normal, diff: opts.diff || 'normal', camZoom: G2_ZOOM[opts.cam] || 1, replayOn: opts.replay !== false,
      players: [], weather: w, halfLen: minutes * 30,
      fr: w.kind === 'rain' ? [0.75, 0.17] : w.kind === 'snow' ? [1.6, 0.3] : [1.0, 0.22],
      ball: { x: PW / 2, y: PL / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, lastTeam: 0, shot: null, passer: null, target: null, assist: null, spin: 0, inGoal: false, postT: 0, curve: 0 },
      half: 1, clock: 0, time: 0, state: 'kickoff', stateT: 1, restartHold: true, setKind: 'kickoff', restartTeam: 0, nextKick: 1,
      ctrl: null, cam: { x: PW / 2, y: PL / 2 }, msg: '', msgT: 0, chasers: [[], []], think: 0, previewT: 0, preview: null, idleT: 0,
      input: { jx: 0, jy: 0, sprint: false, skill: null, pass: false, lob: false, shoot: false, shootDown: false, hold: 0, buf: null },
      possT: [0, 0], landscape: false, paused: false, over: false, celebr: null, pk: null, subOut: null, shootout: null,
      drops: w.kind === 'rain' || w.kind === 'snow' ? Array.from({ length: w.kind === 'rain' ? 150 : 90 }, () => ({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 0.8 })) : null,
      ufo: S.zoeira && Math.random() < 0.5 ? { half: Math.random() < 0.5 ? 1 : 2, at: 0, done: false, t: 0 } : null,
      rec: [], recAcc: 0, recGoalIdx: -1, goalTop: true, replay: null, fx: [], shake: 0, net: null, flash: 0, sayT: -9, sayPri: 0, moodT: 0,
      flight: 0, cornerPlay: null, restartSpot: null, cornerAim: 'six', lastCornerT: -99,
      dbg: opts.auto ? { corners: 0, cornerCross: 0, cornerHeaders: 0, cornerAttHeaders: 0, cornerShots: 0, cornerGoals: 0, claims: 0, punches: 0, catches: 0, parries: 0, fumbles: 0, dives: 0, smothers: 0 } : null,
    };
    if (G.ufo) G.ufo.at = G.halfLen * (0.2 + Math.random() * 0.6);
    st.half = 1;
    buildPlayers();
    resetKickoff(0);
    if (!G.auto) {
      G.state = 'intro'; G.stateT = 3.5;
      evAdd(st, { min: 0, t: 'ko', s: -1, h: 1, txt: `Bola rolando! ${teamName(m.h)} x ${teamName(m.a)}.` });
    }
    return G;
  }

  // ------------------------------------------------------------------ restarts
  function kickoffPos(p) {
    if (p.gk) return { x: PW / 2, y: p.team === 0 ? PL - 1.5 : 1.5 };
    const t = clamp((p.fy - 0.18) / 0.64, 0, 1);
    const depth = 0.14 + t * 0.33;
    const across = p.team === 0 ? p.fx : 1 - p.fx;
    return { x: PW / 2 + (across * PW - PW / 2) * 0.9, y: p.team === 0 ? PL * (1 - depth) : PL * depth };
  }
  function resetKickoff(team) {
    const b = G.ball;
    for (const p of G.players) {
      if (p.out) continue;
      const q = kickoffPos(p);
      p.x = q.x; p.y = q.y;
      if (p.team !== team) {
        const d = Math.hypot(p.x - PW / 2, p.y - PL / 2);
        if (d < 9.6) { const n = nrm(p.x - PW / 2, (p.y - PL / 2) || (p.team === 0 ? 1 : -1)); p.x = PW / 2 + n.x * 9.6; p.y = PL / 2 + n.y * 9.6; }
      }
      Object.assign(p, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, cool: 0, runT: 0, tx: p.x, ty: p.y, dx: 0, dy: p.team === 0 ? -1 : 1, cornerSpot: null, dive: null, diveT: 0, feintT: 0, wall: false, kickT: 0, dv: null, gz: 0, plan: null, cr: null, claim: null, sk: null, skCD: 0 });
    }
    const ks = G.players.filter((p) => !p.out && p.team === team && !p.gk).sort((a, c) => c.fy - a.fy || Math.abs(a.fx - 0.5) - Math.abs(c.fx - 0.5));
    const k1 = ks[0], k2 = ks[1];
    const s = team === 0 ? 1 : -1;
    if (k2) { k2.x = PW / 2 - 7; k2.y = PL / 2 + s * 1.5; }
    if (k1) {
      k1.x = PW / 2; k1.y = PL / 2 + s * 0.65; k1.decT = 0.35;
      if (k2) { const n = nrm(k2.x - k1.x, k2.y - k1.y); k1.dx = n.x; k1.dy = n.y; }
    }
    Object.assign(b, { x: PW / 2, y: PL / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: k1 || null, last: k1 || null, lastTeam: team, shot: null, passer: null, target: null, assist: null, inGoal: false, curve: 0 });
    G.state = 'kickoff'; G.stateT = 0.9; G.restartHold = true; G.setKind = 'kickoff'; G.restartTeam = team; G.celebr = null; G.net = null;
    G.restartSpot = { x: PW / 2, y: PL / 2 }; G.cornerPlay = null;
    G.rec.length = 0; G.recGoalIdx = -1;
    if (!G.auto) G.ctrl = team === 0 ? k1 : nearestTo(0, PW / 2, PL / 2, true);
    G.cam.x = PW / 2; G.cam.y = PL / 2;
  }
  function setPiece(team, x, y, kind) {
    const b = G.ball;
    x = clamp(x, 0.2, PW - 0.2); y = clamp(y, 0.2, PL - 0.2);
    if (kind === 'corner') { x = x < PW / 2 ? 0.3 : PW - 0.3; y = y < PL / 2 ? 0.3 : PL - 0.3; } // inside the corner arc
    let taker = kind === 'goalkick' ? keeperOf(team) : null;
    if (!taker) taker = nearestTo(team, x, y, true);
    if (!taker) { resetKickoff(team); return; }
    const fwd = team === 0 ? -1 : 1;
    for (const p of G.players) Object.assign(p, { wall: false, cornerSpot: null, cr: null, dv: null, gz: 0, plan: null, claim: null, diveT: 0, sk: null });
    G.cornerPlay = null;
    if (kind === 'throw') { taker.x = x < PW / 2 ? -0.35 : PW + 0.35; taker.y = y; taker.dx = x < PW / 2 ? 1 : -1; taker.dy = 0; }
    else if (kind === 'corner') { const n = nrm(PW / 2 - x, (y < PL / 2 ? 11 : PL - 11) - y); taker.x = x - n.x * 0.75; taker.y = y - n.y * 0.75; taker.dx = n.x; taker.dy = n.y; }
    else { taker.x = x; taker.y = y - fwd * 0.7; taker.dx = 0; taker.dy = fwd; }
    Object.assign(taker, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, cool: 0, decT: 0.45 + Math.random() * 0.4 });
    Object.assign(b, { x, y, z: 0, vx: 0, vy: 0, vz: 0, owner: taker, last: taker, lastTeam: team, shot: null, passer: null, target: null, curve: 0 });
    G.restartSpot = { x, y }; // the ball waits on its spot, whatever way the taker faces
    for (const p of G.players) {
      if (p.out) continue;
      p.slide = 0;
      if (p.team !== team) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < 9.2) { const n = nrm((p.x - x) || 0.1, (p.y - y) || -fwd); p.x = clamp(x + n.x * 9.2, 0.5, PW - 0.5); p.y = clamp(y + n.y * 9.2, 0.5, PL - 0.5); }
      }
    }
    G.state = 'setpiece'; G.stateT = kind === 'throw' ? 0.5 : kind === 'corner' ? 1.1 : 0.8; G.restartHold = true; G.setKind = kind; G.restartTeam = team;
    G.rec.length = 0; G.recGoalIdx = -1;
    if (taker.gk) taker.holdT = 1.0;
    if (!G.auto && team === 0 && !taker.gk) G.ctrl = taker;
    if (!G.auto && team === 1) G.ctrl = nearestTo(0, x, y, true);
    if (kind === 'corner') {
      G.st.stats.cor[sideOf(team)]++;
      banner('Escanteio', 1);
      say(`Escanteio para ${tA(teamIdOf(team))}.`, 1);
      taker.decT = 0.7 + Math.random() * 0.5;
      setupCorner(team, x, y, taker);
      if (G.dbg) G.dbg.corners++;
      if (!G.auto && team === 0) { G.cornerAim = 'six'; hint('Escanteio: mire com o direcional (1º pau, meio ou 2º pau) e aperte CHUTE para cruzar · LANÇAR cruza na marca do pênalti · PASSE cobra curto.'); }
      if (!G.auto && team === 1) G.ctrl = nearestTo(0, PW / 2, y < PL / 2 ? 6 : PL - 6, true);
    } else if (kind === 'free') {
      const gy = team === 0 ? 0 : PL;
      if (Math.hypot(PW / 2 - x, gy - y) < 30) { buildWall(team, x, y); G.fk = { taker, t: G.time }; if (team === 0 && !G.auto) hint('Falta perigosa: CHUTE bate direto no gol, por cima da barreira (segure para mais força).'); }
    }
    // the computer side changes players during stoppages in the second half
    if (!G.auto && G.half === 2 && minuteNow() > 58 && minuteNow() < 88 && Math.random() < 0.25) cpuSub(minuteInt());
  }
  // defenders line up in a wall between the ball and the goal for dangerous free kicks
  function buildWall(team, x, y) {
    const gy = team === 0 ? 0 : PL;
    const n = nrm(PW / 2 - x, gy - y);
    const wx = x + n.x * 9.2, wy = y + n.y * 9.2;
    const defs = G.players.filter((p) => !p.out && !p.gk && p.team !== team).sort((a, c) => Math.hypot(a.x - wx, a.y - wy) - Math.hypot(c.x - wx, c.y - wy)).slice(0, 4);
    defs.forEach((p, i) => { const off = (i - (defs.length - 1) / 2) * 0.75; p.x = wx - n.y * off; p.y = wy + n.x * off; p.vx = p.vy = 0; p.wall = true; p.dx = -n.x; p.dy = -n.y; });
  }

  // ------------------------------------------------------------------ corners
  // geometry of a corner: goal line, direction into the pitch and side of the flag
  function cornerGeo(bx, by) {
    const gl = by < PL / 2 ? 0 : PL, inward = gl === 0 ? 1 : -1, sx = bx < PW / 2 ? -1 : 1;
    const at = (x, d) => ({ x: clamp(x, 0.6, PW - 0.6), y: gl + inward * d });
    return { gl, inward, sx, at, C: PW / 2 };
  }
  const aerial = (p) => p.phy * 0.45 + (p.hgt - 178) * 1.6 + (p.pos === 'CB' ? 9 : p.pos === 'ST' ? 7 : 0) + p.sho * 0.12;
  // where the crosses of a corner go: near post, six-yard box, far post, penalty spot
  function cornerZones(bx, by) {
    const { sx, at, C } = cornerGeo(bx, by);
    return { near: { ...at(C + sx * 2.0, 4.0), h: 1.85, name: '1º pau' }, six: { ...at(C - sx * 0.3, 6.2), h: 2.0, name: 'meio da área' },
      far: { ...at(C - sx * 3.4, 5.2), h: 2.0, name: '2º pau' }, spot: { ...at(C + sx * 0.6, 10.8), h: 1.8, name: 'marca do pênalti' } };
  }
  // attackers: the best in the air go into the box, one shooter at the edge, one short option, the rest guard the counter;
  // defenders: keeper on his line, one at the near post, two zonal on the six-yard line, markers goal-side, one at the edge, one up front
  function setupCorner(team, bx, by, taker) {
    const { sx, at, C } = cornerGeo(bx, by);
    const att = G.players.filter((p) => !p.out && p.team === team && !p.gk && p !== taker);
    const def = G.players.filter((p) => !p.out && p.team !== team && !p.gk);
    const rest = att.slice().sort((a, c) => aerial(c) - aerial(a));
    const nBox = clamp(att.length - 4, 2, 5);
    const boxSpots = [['near', at(C + sx * 2.6, 3.0)], ['six', at(C + sx * 0.3, 5.8)], ['far', at(C - sx * 3.4, 4.2)], ['spot', at(C + sx * 1.0, 10.6)], ['back', at(C - sx * 6.2, 8.4)]];
    const box = rest.splice(0, nBox);
    // the strongest header takes the central spot
    const order = [1, 2, 0, 3, 4];
    box.forEach((p, i) => { const [role, s] = boxSpots[order[i]]; p.cr = { role, x: s.x, y: s.y }; });
    rest.sort((a, c) => c.sho - a.sho);
    const edge = rest.shift();
    if (edge) edge.cr = { role: 'edge', ...at(C - sx * 1.5, 18.2) };
    rest.sort((a, c) => Math.hypot(a.x - bx, a.y - by) - Math.hypot(c.x - bx, c.y - by));
    const short = rest.length >= 2 ? rest.shift() : null;
    if (short) short.cr = { role: 'short', ...at(bx - sx * 9.5, 3.8) };
    rest.forEach((p, i) => { p.cr = { role: 'back', ...at(C + (i % 2 ? -1 : 1) * (7 + i * 3), 44 + i * 2) }; });
    // defenders
    const dq = def.slice().sort((a, c) => (c.def * 0.6 + aerial(c) * 0.4) - (a.def * 0.6 + aerial(a) * 0.4));
    const threats = box.slice().sort((a, c) => aerial(c) - aerial(a));
    const used = new Set();
    const take = (filter) => { const p = dq.find((q) => !used.has(q) && (!filter || filter(q))); if (p) used.add(p); return p; };
    for (const a of threats) {
      if (dq.length - used.size <= 2 && threats.length > 3) break;
      const m = take();
      if (!m) break;
      const n = nrm(C - a.cr.x, (a.cr.y < PL / 2 ? 0 : PL) - a.cr.y);
      m.cr = { role: 'mark', mark: a, x: a.cr.x + n.x * 0.9, y: a.cr.y + n.y * 0.9 };
    }
    const zonal = [at(C + sx * 2.3, 6.4), at(C - sx * 1.4, 6.4)];
    for (const z of zonal) { const p = take(); if (p) p.cr = { role: 'zone', x: z.x, y: z.y }; }
    const np = take((q) => q.pos !== 'ST');
    if (np) np.cr = { role: 'post', ...at(C + sx * 3.4, 0.9) };
    const ed = take();
    if (ed) ed.cr = { role: 'edge', ...at(C + sx * 1.2, 15.6) };
    dq.filter((q) => !used.has(q)).forEach((p, i) => { p.cr = { role: 'up', ...at(C + (i % 2 ? -1 : 1) * (5 + i * 4), 36) }; });
    const gk = keeperOf(1 - team);
    if (gk) Object.assign(gk, at(C - sx * 0.35, 0.8), { vx: 0, vy: 0, dv: null, gz: 0, plan: null, claim: null });
    const ak = keeperOf(team);
    if (ak) { const home = { x: C, y: (by < PL / 2 ? PL : 0) + (by < PL / 2 ? -1 : 1) * 13 }; Object.assign(ak, home, { vx: 0, vy: 0 }); }
    // everybody takes up the position at once (small jostling around it)
    for (const p of att.concat(def)) {
      if (!p.cr) continue;
      p.x = p.cr.x + (Math.random() - 0.5) * 0.7; p.y = p.cr.y + (Math.random() - 0.5) * 0.7;
      Object.assign(p, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, runT: 0 });
      const n = nrm(bx - p.x, by - p.y); p.dx = n.x; p.dy = n.y;
    }
    if (gk) { const n = nrm(bx - gk.x, by - gk.y); gk.dx = n.x; gk.dy = n.y; }
  }
  // the computer's choice: where its best header is, now and then short
  function aiCornerZone(p) {
    const r = Math.random();
    const short = G.players.find((q) => q.cr && q.cr.role === 'short' && q.team === p.team && !q.out);
    if (short && r < 0.08) return 'short';
    return r < 0.3 ? 'near' : r < 0.62 ? 'six' : r < 0.88 ? 'far' : 'spot';
  }
  // the user's stick picks the area of the cross (seen from the corner flag)
  function zoneFromStick(p, w) {
    if (!(w.x || w.y)) return G.cornerAim || 'six';
    const b = G.ball, Z = cornerZones(b.x, b.y);
    let best = 'six', bs = -2;
    const n = nrm(w.x, w.y);
    for (const k of ['near', 'six', 'far']) { const d = nrm(Z[k].x - b.x, Z[k].y - b.y); const s = d.x * n.x + d.y * n.y; if (s > bs) { bs = s; best = k; } }
    return best;
  }
  // ball flight with drag and swerve: aim so that it comes down to height h right at (tx, ty)
  function simFlight(x, y, vx, vy, vz, curve, T) {
    const dt = 1 / 60;
    let z = 0;
    for (let t = 0; t < T - 1e-6; t += dt) {
      x += vx * dt; y += vy * dt;
      if (curve) { const n = nrm(-vy, vx); vx += n.x * curve * dt; vy += n.y * curve * dt; curve *= Math.exp(-2.2 * dt); if (Math.abs(curve) < 0.05) curve = 0; }
      vz -= 9.8 * dt; z += vz * dt;
      const drag = Math.exp(-0.12 * dt); vx *= drag; vy *= drag;
    }
    return { x, y, z };
  }
  function solveCross(x0, y0, tx, ty, h, apex, curve) {
    const vz = Math.sqrt(2 * 9.8 * apex);
    const T = (vz + Math.sqrt(Math.max(0, vz * vz - 2 * 9.8 * h))) / 9.8;
    let ang = Math.atan2(ty - y0, tx - x0);
    const d0 = Math.hypot(tx - x0, ty - y0);
    let vh = d0 * 0.12 / (1 - Math.exp(-0.12 * T));
    for (let it = 0; it < 5; it++) {
      const e = simFlight(x0, y0, Math.cos(ang) * vh, Math.sin(ang) * vh, vz, curve, T);
      const ex = tx - e.x, ey = ty - e.y;
      if (Math.hypot(ex, ey) < 0.05) break;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const reach = Math.max(1, Math.hypot(e.x - x0, e.y - y0));
      vh *= (reach + ex * dx + ey * dy) / reach;
      ang += Math.atan2(-ex * dy + ey * dx, reach);
    }
    return { vx: Math.cos(ang) * vh, vy: Math.sin(ang) * vh, vz, T };
  }
  // lofted delivery into an area of the box; the receiver attacks the ball
  function deliverCross(p, tx, ty, h, apex, swerve, hitter, zone) {
    const b = G.ball;
    const skill = p.pas / 100;
    // inswinger (bends towards goal) or outswinger
    const gl = ty < PL / 2 ? 0 : PL;
    const v0 = nrm(tx - b.x, ty - b.y);
    const left = { x: -v0.y, y: v0.x };
    const towardGoal = (gl - ty) * left.y > 0 ? 1 : -1; // positive curve bends to the left of the flight
    const curve = swerve * (Math.random() < 0.6 ? towardGoal : -towardGoal);
    const sol = solveCross(b.x, b.y, tx, ty, h, apex, curve);
    const err = (0.012 + (1 - skill) * 0.05) * (p.team === 1 ? G.D.passErr : 1);
    const ang = Math.atan2(sol.vy, sol.vx) + grand() * err;
    const vh = Math.hypot(sol.vx, sol.vy) * (1 + grand() * (0.015 + (1 - skill) * 0.04));
    kick(p, Math.cos(ang) * vh, Math.sin(ang) * vh, sol.vz * (1 + grand() * 0.02));
    b.curve = curve;
    b.passer = p; b.target = hitter || null;
    b.cross = { team: p.team, x: tx, y: ty, h, t: G.time + sol.T, zone };
    return sol.T;
  }
  function cornerKick(p, zone) {
    const b = G.ball, Z = cornerZones(b.x, b.y);
    hint('');
    if (zone === 'short') {
      const s = G.players.find((q) => q.cr && q.cr.role === 'short' && q.team === p.team && !q.out) || bestReceiver(p, nrm(PW / 2 - b.x, 0.001), false);
      passTo(p, s, nrm(s ? s.x - b.x : 1, s ? s.y - b.y : 0), false, false);
      say(`${nameOf(p)} cobra curto.`, 0);
      G.cornerPlay = null;
      return;
    }
    const z = Z[zone] || Z.six;
    // the attacker closest to the area goes for the ball
    const box = G.players.filter((q) => !q.out && q.team === p.team && !q.gk && q !== p && q.cr && ['near', 'six', 'far', 'spot', 'back'].includes(q.cr.role));
    box.sort((a, c) => Math.hypot(a.x - z.x, a.y - z.y) - Math.hypot(c.x - z.x, c.y - z.y));
    const hitter = box[0] || null;
    const d = Math.hypot(z.x - G.ball.x, z.y - G.ball.y);
    const apex = clamp(2.6 + d * 0.085 + (Math.random() - 0.5) * 0.6, 3.4, 6.2);
    const g = cornerGeo(b.x, b.y);
    const T = deliverCross(p, z.x, z.y, z.h, apex, 2.2 + Math.random() * 1.6, hitter, zone);
    G.lastCornerT = G.time;
    G.cornerPlay = { team: p.team, zone, x: z.x, y: z.y, h: z.h, t: G.time + T, until: G.time + T + 1.4, hitter, ...g };
    if (G.dbg) G.dbg.cornerCross++;
    say(`${nameOf(p)} levanta na área, ${z.name === 'meio da área' ? 'no meio da área' : z.name === 'marca do pênalti' ? 'na marca do pênalti' : 'no ' + z.name}.`, 1);
  }

  // ------------------------------------------------------------------ penalties (in play and in the shoot-out)
  function startPenalty(team) {
    const up = team === 0;
    const gy = up ? 0 : PL, fwd = up ? -1 : 1;
    const taker = G.players.filter((p) => !p.out && p.team === team && !p.gk).sort((a, c) => c.sho - a.sho)[0];
    const gk = keeperOf(1 - team);
    if (!taker) { setPiece(team, PW / 2, gy - fwd * 11, 'free'); return; }
    for (const p of G.players) {
      if (p.out || p === taker || p === gk) continue;
      Object.assign(p, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, wall: false });
      if (Math.abs(p.y - gy) < BOX_D + 2) p.y = gy - fwd * (BOX_D + 2 + Math.random() * 5);
    }
    setupKick(team, taker, gk, false);
    banner('PÊNALTI!', 1.6);
    say(`Pênalti para ${tA(teamIdOf(team))}! ${nameOf(taker)} vai para a cobrança.`, 3);
    sfx('whistle', 0.6);
  }
  // place taker, keeper and ball; in the shoot-out every kick goes to the top goal
  function setupKick(team, taker, gk, shootout) {
    const b = G.ball;
    const up = shootout ? true : team === 0;
    const gy = up ? 0 : PL, fwd = up ? -1 : 1;
    const spotY = gy - fwd * 11;
    Object.assign(taker, { x: PW / 2 + 0.4, y: spotY - fwd * 1.6, dx: -0.2, dy: fwd, vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, kickT: 0 });
    if (gk) Object.assign(gk, { x: PW / 2, y: gy - fwd * 0.4, vx: 0, vy: 0, wx: 0, wy: 0, dive: null, diveT: 0, diveDir: 0, dx: 0, dy: -fwd, fall: 0, dv: null, gz: 0, plan: null, claim: null });
    G.cornerPlay = null;
    Object.assign(b, { x: PW / 2, y: spotY, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: taker, lastTeam: team, shot: null, passer: null, target: null, assist: null, inGoal: false, curve: 0 });
    const userShoots = !G.auto && team === 0;
    const userDives = !G.auto && team === 1 && !!gk;
    G.pk = { team, taker, gk, shootout, up, fwd, dirX: up ? 1 : -1, gy, phase: userShoots ? 'aim' : userDives ? 'dive' : 'auto', t: 0, aim: 0, power: 0, charging: false, dive: 0, run: false, outcome: null, scored: false, dead: false };
    G.state = 'penalty'; G.restartHold = true; G.setKind = 'penalty';
    Object.assign(G.input, { shootDown: false, shoot: false, hold: 0, pass: false, lob: false, buf: null });
    G.cam.x = PW / 2; G.cam.y = up ? (G.landscape ? 12 : 7) : (G.landscape ? PL - 12 : PL + 2.5);
    G.rec.length = 0; G.recGoalIdx = -1;
    if (userShoots) G.ctrl = taker;
    if (userShoots) hint(`${nameOf(taker)} na cobrança: mire com o direcional e segure CHUTE para dar força.`);
    else if (userDives) hint(`${nameOf(taker)} vai bater: escolha o canto do goleiro com o direcional.`);
    else hint('');
  }
  function penaltyStep(dt) {
    const k = G.pk, I = G.input;
    k.t += dt;
    idle(dt);
    if (!G.pk) return;
    if (k.phase === 'aim') {
      const kd = keyDir();
      const w = screenToWorld(I.jx + kd.x, I.jy + kd.y);
      if (Math.abs(w.x) > 0.2) k.aim = clamp(k.aim + Math.sign(w.x * k.dirX) * dt * 1.5, -1.1, 1.1);
      if (I.shootDown) { k.charging = true; k.power = Math.min(1.08, k.power + dt / 0.85); }
      I.pass = false; I.lob = false;
      if ((k.charging && !I.shootDown) || I.shoot || k.t > 8) {
        I.shoot = false; I.hold = 0; I.shootDown = false;
        k.kp = k.charging ? Math.max(0.35, k.power) : 0.65; k.ka = k.aim;
        k.phase = 'runup'; k.t = 0; k.run = true;
      }
    } else if (k.phase === 'runup') {
      if (k.t > 0.38) takeKick(k.kp, k.ka);
    } else if (k.phase === 'dive') {
      const kd = keyDir();
      const w = screenToWorld(I.jx + kd.x, I.jy + kd.y);
      if (Math.abs(w.x) > 0.3) k.dive = Math.sign(w.x * k.dirX);
      else if (Math.abs(w.y) > 0.6) k.dive = 0;
      I.pass = false; I.shoot = false; I.lob = false;
      if (k.t > 1.15) k.run = true;
      if (k.t > 1.55) takeKick(0.72 + Math.random() * 0.22, null);
    } else if (k.phase === 'auto') {
      if (k.t > 1.0) k.run = true;
      if (k.t > 1.4) takeKick(0.72 + Math.random() * 0.22, null);
    } else if (k.phase === 'flight') {
      if (k.t > (k.shootout ? 1.75 : 2.1)) finishKick();
    }
  }
  // decide and launch a penalty kick; aim in [-1, 1] across the goal mouth from the taker's view (null = computer)
  function takeKick(power, aim) {
    const k = G.pk, b = G.ball;
    const taker = k.taker, gk = k.gk;
    if (aim === null) aim = Math.random() < 0.12 ? (Math.random() - 0.5) * 0.3 : (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.55);
    const skill = taker.sho / 100;
    aim += grand() * (1.05 - skill) * 0.2 + (power > 0.95 ? grand() * 0.15 : 0);
    // keeper's guess: the user's choice, or the computer reading the kick
    let diveSide;
    if (k.phase === 'dive') diveSide = k.dive;
    else { const r = Math.random(); diveSide = r < 0.42 ? -1 : r < 0.84 ? 1 : 0; if (gk && Math.random() < 0.1 + (gk.ovr - 75) * 0.006) diveSide = Math.abs(aim) < 0.28 ? 0 : Math.sign(aim); }
    const aimSide = Math.abs(aim) < 0.28 ? 0 : Math.sign(aim);
    const over = power > 0.95 && Math.random() < (power - 0.95) * 7;
    const wide = Math.abs(aim) > 1.0;
    let outcome;
    if (over || wide) outcome = 'miss';
    else if (!gk) outcome = 'goal';
    else if (diveSide === aimSide) {
      const corner = Math.abs(aim) > 0.72;
      const bonus = gk.team === 1 ? G.D.cpuSave : G.D.userSave;
      const pSave = (aimSide === 0 ? 0.85 : corner ? 0.3 : 0.68) + (gk.ovr - 75) * 0.006 - (power - 0.7) * 0.4 + bonus;
      outcome = Math.random() < clamp(pSave, 0.1, 0.92) ? 'save' : 'goal';
    } else outcome = 'goal';
    const tx = PW / 2 + k.dirX * aim * (GOAL_W / 2 - 0.25) * (wide ? 1.06 : 1);
    const dx = tx - b.x, dy = k.gy - b.y, d = Math.hypot(dx, dy);
    const sp = 19 + power * 9;
    const t = d / sp;
    const h = over ? 2.8 + Math.random() * 1.2 : 0.15 + Math.random() * (0.5 + power * 1.0);
    const vz = (h + 4.9 * t * t) / t;
    taker.kickT = 0.3; k.run = false;
    Object.assign(b, { owner: null, vx: dx / d * sp, vy: dy / d * sp, vz, last: taker, lastTeam: k.team, passer: null, target: null, curve: 0 });
    b.shot = { team: k.team, by: taker, t: 0, checked: false, beaten: false, force: outcome, pk: true };
    if (!k.shootout) G.st.stats.sh[sideOf(k.team)]++;
    if (gk) { gk.diveDir = k.dirX * diveSide; gk.diveT = diveSide ? 0.75 : 0; gk.dive = { x: PW / 2 + k.dirX * diveSide * 2.6, t: 0.6 }; }
    k.phase = 'flight'; k.t = 0; k.outcome = outcome;
    sfx('kick', 0.9);
    hint('');
  }
  function finishKick() {
    const k = G.pk;
    if (!k) return;
    if (k.shootout) { shootoutResult(); return; }
    G.pk = null;
    hint('');
    const b = G.ball, gk = k.gk, defending = 1 - k.team;
    if (k.outcome === 'save' && gk && !gk.out && b.y > 0 && b.y < PL && Math.hypot(b.vx, b.vy) < 2) { take(gk); gk.holdT = 1; G.state = 'play'; G.restartHold = false; return; }
    if (!k.dead && b.y > 0.3 && b.y < PL - 0.3 && b.x > 0.3 && b.x < PW - 0.3) { G.state = 'play'; G.restartHold = false; return; }
    if (b.lastTeam === defending) setPiece(k.team, b.x < PW / 2 ? 0.3 : PW - 0.3, k.up ? 0.3 : PL - 0.3, 'corner');
    else setPiece(defending, PW / 2 + (b.x < PW / 2 ? -5 : 5), k.up ? 5.5 : PL - 5.5, 'goalkick');
  }

  // ------------------------------------------------------------------ shoot-out (knockout ties still level after extra time)
  function initShootout() {
    const order = (team) => G.players.filter((p) => !p.out && p.team === team && !p.gk).sort((a, c) => c.sho - a.sho);
    G.shootout = { kicks: [[], []], order: [order(0), order(1)], idx: [0, 0], turn: Math.random() < 0.5 ? 0 : 1, done: false, seq: [] };
    return G.shootout;
  }
  function startShootout() {
    initShootout();
    G.state = 'shootoutIntro'; G.stateT = 2.2;
    if (root) root.classList.add('so');
    banner('Pênaltis!', 2);
    say(`Vai para os pênaltis! Começa batendo ${tA(teamIdOf(G.shootout.turn))}.`, 3);
    sfx('whistle', 1);
    G.cam.x = PW / 2; G.cam.y = G.landscape ? 12 : 7;
    lineUpForKicks(null, null);
    showShootoutHud();
  }
  function lineUpForKicks(taker, gk) {
    let i0 = 0, i1 = 0;
    for (const p of G.players) {
      if (p.out || p === taker || p === gk) continue;
      if (p.gk) { p.x = PW / 2 + (p.team === 0 ? -13 : 13); p.y = 15; p.dx = 0; p.dy = -1; }
      else {
        const i = p.team === 0 ? i0++ : i1++;
        p.x = PW / 2 + (p.team === 0 ? -1 : 1) * (2.2 + (i % 5) * 1.25);
        p.y = PL / 2 + (i < 5 ? -0.8 : 0.8);
        p.dx = 0; p.dy = -1;
      }
      Object.assign(p, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, dive: null, diveT: 0 });
    }
  }
  function shootoutTaker(team) {
    const so = G.shootout, list = so.order[team];
    if (!list.length) return null;
    const t = list[so.idx[team] % list.length];
    so.idx[team]++;
    return t;
  }
  function nextShootoutKick() {
    const so = G.shootout, team = so.turn;
    const taker = shootoutTaker(team);
    const gk = keeperOf(1 - team);
    if (!taker) { shootoutRecord(team, null, false); if (so.done) { G.state = 'shootoutEnd'; G.stateT = 2.5; } return; }
    lineUpForKicks(taker, gk);
    setupKick(team, taker, gk, true);
  }
  // record one kick; returns true when the shoot-out is decided
  function shootoutRecord(team, taker, scored) {
    const so = G.shootout;
    so.kicks[team].push(!!scored);
    so.seq.push([sideOf(team), taker ? taker.pid : 0, !!scored]);
    const a = so.kicks[0].filter(Boolean).length, c = so.kicks[1].filter(Boolean).length;
    const na = so.kicks[0].length, nc = so.kicks[1].length;
    let over = false;
    if (na <= 5 && nc <= 5) {
      if (a > c + (5 - nc) || c > a + (5 - na)) over = true;
      else if (na === 5 && nc === 5 && a !== c) over = true;
    } else if (na === nc && a !== c) over = true;
    if (over || na + nc > 60) { finishShootout(); return true; }
    so.turn = 1 - team;
    return false;
  }
  function finishShootout() {
    const so = G.shootout, st = G.st, m = G.m;
    so.done = true;
    const a = so.kicks[0].filter(Boolean).length, c = so.kicks[1].filter(Boolean).length;
    const score = [0, 0];
    score[sideOf(0)] = a; score[sideOf(1)] = c;
    st.pen = score; st.penSeq = so.seq; st.penPlayed = true; st.et = true;
    evAdd(st, { min: 120, t: 'pen', s: -1, h: 3, txt: `Pênaltis: ${teamName(m.h)} ${score[0]} x ${score[1]} ${teamName(m.a)}.` });
  }
  function simShootoutKick() {
    const so = G.shootout, team = so.turn;
    const t = shootoutTaker(team), gk = keeperOf(1 - team);
    const p = clamp(0.76 + ((t ? t.sho : 60) - 70) * 0.004 - ((gk ? gk.ovr : 60) - 75) * 0.004, 0.55, 0.92);
    shootoutRecord(team, t, Math.random() < p);
  }
  function shootoutResult() {
    const k = G.pk;
    G.pk = null;
    hint('');
    const scored = !!k.scored;
    const over = shootoutRecord(k.team, k.taker, scored);
    banner(scored ? 'GOL!' : k.outcome === 'save' ? 'DEFENDEU!' : 'PERDEU!', 1.3);
    if (scored) say(`${nameOf(k.taker)} converte para ${tA(teamIdOf(k.team))}.`, 2);
    else if (k.outcome === 'save') say(`${nameOf(k.gk)} defende a cobrança de ${nameOf(k.taker)}!`, 2);
    else say(`${nameOf(k.taker)} desperdiça a cobrança!`, 2);
    sfx(scored === (k.team === 0) ? 'roar' : 'groan', 0.7);
    showShootoutHud();
    if (over) {
      const so = G.shootout;
      const won = so.kicks[0].filter(Boolean).length > so.kicks[1].filter(Boolean).length;
      G.state = 'shootoutEnd'; G.stateT = 3;
      setTimeout(() => { if (G && G.state === 'shootoutEnd') { banner(won ? 'VITÓRIA NOS PÊNALTIS!' : 'DERROTA NOS PÊNALTIS', 2.5); say(won ? `${TA(teamIdOf(0))} vence nos pênaltis!` : `${TA(teamIdOf(1))} vence nos pênaltis.`, 3); if (won) { confetti(sideOf(0)); sfx('roar', 1); } } }, G.auto ? 0 : 1100);
      return;
    }
    G.state = 'shootoutWait'; G.stateT = 1.2;
  }

  // ------------------------------------------------------------------ main step
  function step(dt) {
    G.time += dt;
    if (G.msgT > 0) { G.msgT -= dt; if (G.msgT <= 0) setMsg(''); }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 3);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    const b = G.ball;
    if (b.postT > 0) b.postT -= dt;
    stepFx(dt);
    switch (G.state) {
      case 'intro': G.stateT -= dt; camera(dt); if (G.stateT <= 0) { hideIntro(); G.state = 'kickoff'; G.stateT = 0.6; sfx('whistle', 1); say('Bola rolando!', 2); } return;
      case 'goal':
        G.stateT -= dt; idle(dt);
        if (!G.auto && G.stateT > 1.4) record(dt);
        if (G.stateT <= 0) { if (!G.auto && G.replayOn && G.recGoalIdx >= 40) startReplay(); else resetKickoff(G.nextKick); }
        return;
      case 'replay': replayStep(dt); return;
      case 'halftime': case 'fulltime': idle(dt); return;
      case 'penalty': penaltyStep(dt); return;
      case 'shootoutIntro': case 'shootoutWait': G.stateT -= dt; idle(dt); if (G.stateT <= 0) nextShootoutKick(); return;
      case 'shootoutEnd': G.stateT -= dt; idle(dt); if (G.stateT <= 0) endGame(false); return;
      case 'ufo': ufoStep(dt); return;
      case 'over': return;
      default: break;
    }
    G.clock += dt;
    if (G.clock >= halfEnd()) { endHalf(); return; }
    if (G.ufo && !G.ufo.done && G.half === G.ufo.half && G.clock >= G.ufo.at && G.state === 'play' && !G.restartHold) { startUfo(); return; }
    if (G.state === 'kickoff' || G.state === 'setpiece') { G.stateT -= dt; if (G.stateT <= 0) G.state = 'play'; }
    if (b.owner) G.possT[sideOf(b.owner.team)] += dt;
    else G.possT[sideOf(b.lastTeam)] += dt * 0.5;
    if (G.cornerPlay) {
      const cp = G.cornerPlay;
      if (b.owner || b.shot || G.time > cp.until || (G.time > cp.t && b.z < 0.3 && Math.hypot(b.vx, b.vy) < 6)) G.cornerPlay = null;
    }
    if (!G.auto) userInput(dt);
    G.think -= dt;
    const think = G.think <= 0;
    if (think) { G.think = 0.1; computeChasers(); }
    for (const p of G.players) if (!p.out) ai(p, dt, think);
    for (const p of G.players) if (!p.out) integrate(p, dt);
    separate();
    if (G.state === 'penalty') return; // a foul in the box just stopped play
    ballStep(dt);
    camera(dt);
    if (!G.auto) { record(dt); crowdMood(dt); }
  }
  function endHalf() {
    const st = G.st, m = G.m;
    sfx('whistle', 1.4);
    if (G.half === 1) {
      if (G.auto) { startSecondHalf(); return; }
      G.state = 'halftime';
      evAdd(st, { min: 45 + st.stoppage[0], t: 'ht', s: -1, h: 1, txt: `Fim do primeiro tempo: ${st.score[0]} x ${st.score[1]}.` });
      say(`Fim do primeiro tempo: ${st.score[0]} x ${st.score[1]}.`, 3);
      // the computer side may change players at the break
      if (Math.random() < 0.45) cpuSub(45);
      showBreak('half');
      return;
    }
    st.min = 90 + st.stoppage[1];
    // knockout tie still level on aggregate: extra time is simulated, the shoot-out is played here
    if (!G.auto && (matchNeedsDecider(m) || G.testDecider)) {
      const [bh, ba] = matchNeedsDecider(m) ? tieAggregateBefore(m) : [0, 0];
      if (bh + st.score[0] === ba + st.score[1] && S.comps[m.c] && S.comps[m.c].noET) {
        st.decided = true;
        G.state = 'fulltime';
        G.etGoals = null;
        showBreak('noet');
        return;
      }
      if (bh + st.score[0] === ba + st.score[1]) {
        const before = st.score.slice();
        st.et = true; st.half = 3; st.min = 90;
        const saveXg = st.xg.slice();
        st.xg = st.xg.map((x) => x * 0.95);
        st.shotRate = st.shotRate.map((r) => r * 0.85);
        simulateRange(st, m, 120);
        st.xg = saveXg;
        st.decided = true;
        syncSprites();
        updateHud(true);
        G.state = 'fulltime';
        G.etGoals = [st.score[0] - before[0], st.score[1] - before[1]];
        showBreak(bh + st.score[0] === ba + st.score[1] ? 'et' : 'etwin');
        return;
      }
    }
    G.state = 'fulltime';
    if (G.auto) { endGame(false); return; }
    showBreak('full');
  }
  function startSecondHalf() {
    hideBreak();
    G.half = 2; G.st.half = 2; G.clock = 0;
    resetKickoff(1);
    banner('2º tempo', 1.2);
    say('Começa o segundo tempo!', 2);
    sfx('whistle', 1);
  }
  function endGame(simulated) {
    const st = G.st;
    if (!simulated && !st.decided) st.min = 90 + st.stoppage[1];
    const tot = G.possT[0] + G.possT[1];
    if (tot > 20) { const h = Math.round(G.possT[0] / tot * 100); st.stats.poss = G.userSide === 0 ? [h, 100 - h] : [100 - h, h]; }
    G.state = 'over'; G.over = true;
    if (!root) return;
    hideBreak();
    setTimeout(() => { const cb = onDone; cleanup(); G = null; if (cb) cb(); }, simulated ? 250 : 600);
  }
  function simulateRest() {
    const st = G.st, m = G.m;
    G.paused = false;
    if (G.shootout) {
      if (!G.shootout.done) { G.pk = null; while (!G.shootout.done) simShootoutKick(); }
      endGame(true);
      return;
    }
    if (st.decided) { endGame(true); return; }
    st.autoUser = true;
    const mn = Math.floor(minuteNow());
    if (G.half === 1) {
      st.min = Math.min(mn, 45 + st.stoppage[0]); st.half = 1;
      simulateRange(st, m, 45 + st.stoppage[0]);
      st.min = 45; st.half = 2;
    } else { st.min = Math.min(Math.max(45, mn), 90 + st.stoppage[1]); st.half = 2; }
    simulateRange(st, m, 90 + st.stoppage[1]);
    endGame(true);
  }

  // ------------------------------------------------------------------ user control
  function screenToWorld(sx, sy) { return G.landscape ? { x: sy, y: -sx } : { x: sx, y: sy }; }
  function keyDir() {
    let x = 0, y = 0;
    if (KEYS.a || KEYS.arrowleft) x -= 1;
    if (KEYS.d || KEYS.arrowright) x += 1;
    if (KEYS.w || KEYS.arrowup) y -= 1;
    if (KEYS.s || KEYS.arrowdown) y += 1;
    return { x, y };
  }
  function userInput(dt) {
    const I = G.input, b = G.ball;
    const kd = keyDir();
    let sx = I.jx + kd.x, sy = I.jy + kd.y;
    const mag = Math.min(1, Math.hypot(sx, sy));
    if (mag > 0.05) { const n = nrm(sx, sy); sx = n.x * mag; sy = n.y * mag; } else { sx = 0; sy = 0; }
    const w = screenToWorld(sx, sy);
    if (b.owner && b.owner.team === 0 && !b.owner.gk) G.ctrl = b.owner;
    if (!G.ctrl || G.ctrl.out || G.ctrl.gk) G.ctrl = nearestTo(0, b.x, b.y, true);
    else if (!(b.owner && b.owner.team === 0) && !(sx || sy)) {
      // idle stick: hand control to whoever reaches the ball first
      let best = G.ctrl, bt = interceptTime(G.ctrl);
      for (const p of G.players) { if (p.out || p.team !== 0 || p.gk) continue; const t = interceptTime(p); if (t < bt - 0.6) { bt = t; best = p; } }
      G.ctrl = best;
    }
    const c = G.ctrl;
    if (!c) return;
    c.inX = w.x; c.inY = w.y;
    const wantSprint = mag > 0.6 && !KEYS.shift; // automatic sprint when the stick is pushed; Shift jogs
    // sprint stamina: roughly 7 seconds of flat-out running, recovers while jogging
    if (wantSprint && (w.x || w.y) && c.sta > 0.02) { c.sta = Math.max(0, c.sta - dt / (6 + c.phy / 40)); c.sprint = c.sta > 0.1; }
    else { c.sprint = false; c.sta = Math.min(1, c.sta + dt * 0.11); }
    for (const p of G.players) if (p !== c && p.team === 0 && p.sta < 1) p.sta = Math.min(1, p.sta + dt * 0.12);
    if (I.shootDown) I.hold = Math.min(1, I.hold + dt / 0.85);
    const has = b.owner === c;
    const canKick = has && G.state === 'play';
    if (has && G.restartHold && (w.x || w.y)) { const n = nrm(w.x, w.y); c.dx = n.x; c.dy = n.y; if (G.setKind === 'corner') G.cornerAim = zoneFromStick(c, w); }
    // nobody waits forever on a restart: after a few seconds the ball is played automatically
    if (has && G.restartHold && G.state === 'play') { G.idleT += dt; if (G.idleT > 6) { G.idleT = 0; if (G.setKind === 'corner') cornerKick(c, G.cornerAim || 'six'); else aiPass(c, false, G.setKind === 'kickoff' || G.setKind === 'throw'); hint(''); return; } }
    else G.idleT = 0;
    // pass preview
    G.previewT -= dt;
    if (has && G.previewT <= 0) { G.previewT = 0.12; G.preview = bestReceiver(c, (w.x || w.y) ? nrm(w.x, w.y) : { x: c.dx, y: c.dy }, false); }
    if (!has) G.preview = null;
    if (I.buf && G.time - I.buf.t > 0.35) I.buf = null;
    if (I.buf && canKick) {
      const bf = I.buf;
      I.buf = null;
      if (bf.k === 'shoot') doUserShoot(c, w, bf.pw || 0.7); else userPass(c, w, bf.k === 'lob');
      return;
    }
    const looseNear = !b.owner && dist(c, b) < 3 && b.z < 1.8;
    if (I.pass) {
      I.pass = false;
      if (canKick) userPass(c, w, false);
      else if (looseNear) I.buf = { k: 'pass', t: G.time };
      else if (!has && !(b.owner && b.owner.team === 0)) { const nx = nearestTo(0, b.x, b.y, true, c); if (nx) G.ctrl = nx; }
    }
    if (I.lob) {
      I.lob = false;
      if (canKick) userPass(c, w, true);
      else if (looseNear) I.buf = { k: 'lob', t: G.time };
    }
    if (I.skill) {
      const kind = I.skill;
      I.skill = null;
      if (has && G.state === 'play' && !G.restartHold && c.skCD <= 0 && !c.sk) doSkill(c, w, kind);
    }
    if (I.shoot) {
      I.shoot = false;
      const pw = clamp(0.3 + I.hold * 0.7, 0.3, 1);
      I.hold = 0;
      if (canKick) doUserShoot(c, w, pw);
      else if (looseNear) I.buf = { k: 'shoot', t: G.time, pw };
      else if (!has && c.slide <= 0 && c.fall <= 0 && !G.restartHold && G.state === 'play') {
        const t = b.owner && b.owner.team === 1 ? b.owner : b;
        if (w.x || w.y) startSlide(c, w.x, w.y); else startSlide(c, t.x - c.x, t.y - c.y);
      }
    }
  }
  // dribbling moves, unlocked by skill stars: FINTA (1★: step-over and a sharp cut away from the closest defender),
  // GIRO (2★: a roulette spin), and the specials from 3★: CANETA (nutmeg through the defender's legs), ELÁSTICO (4★, a
  // flick out and in) and CHAPÉU (5★, the ball lifted over the defender). They fool the defenders around (more so with a
  // good dribbler) and make tackles harder for a moment
  const SK_NAME = { feint: 'finta', spin: 'giro', nutmeg: 'caneta', elastico: 'elástico', rainbow: 'chapéu' };
  function doSkill(c, w, btn) {
    const need = SKILL_NEED[btn] || 1;
    if (c.stars < need) { hint(`${nameOf(c)} tem ${c.stars}★ de finta e este drible pede ${need}★.`); return; }
    let kind = btn;
    if (btn === 'special') {
      const ok = SPECIALS.filter((x) => c.stars >= x[1]);
      kind = ok[Math.floor(Math.random() * ok.length)][0];
    }
    let d = (w.x || w.y) ? nrm(w.x, w.y) : { x: c.dx, y: c.dy };
    if (!d.x && !d.y) d = { x: 0, y: c.team === 0 ? -1 : 1 };
    // the closest defender, preferring the ones in front
    let opp = null, od = 1e9;
    for (const o of G.players) {
      if (o.out || o.team === c.team || o.gk) continue;
      const dd = Math.hypot(o.x - c.x, o.y - c.y) * (((o.x - c.x) * d.x + (o.y - c.y) * d.y) > -0.5 ? 1 : 1.6);
      if (dd < od) { od = dd; opp = o; }
    }
    c.skCD = 0.95; c.sta = Math.max(0, c.sta - 0.07);
    const perp = { x: -d.y, y: d.x };
    const side = opp ? (((opp.x - c.x) * perp.x + (opp.y - c.y) * perp.y) > 0 ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
    const sk = { kind, t: 0.5, T: 0.5, dx: d.x, dy: d.y, sp: 1.1 };
    if (kind === 'spin') { sk.t = sk.T = 0.62; sk.sp = 1.04; }
    else if (kind === 'feint') { const dir = nrm(d.x * 0.5 + perp.x * side * 0.9, d.y * 0.5 + perp.y * side * 0.9); sk.dx = dir.x; sk.dy = dir.y; sk.sp = 1.2; }
    else if (kind === 'nutmeg') { sk.t = sk.T = 0.55; sk.sp = 1.28; }
    else if (kind === 'elastico') { // out to one side, then sharply back across
      sk.t = sk.T = 0.58; sk.sp = 1.22;
      const out = nrm(d.x * 0.35 + perp.x * side * 0.95, d.y * 0.35 + perp.y * side * 0.95);
      const back = nrm(d.x * 0.45 - perp.x * side * 0.9, d.y * 0.45 - perp.y * side * 0.9);
      sk.dx = out.x; sk.dy = out.y; sk.dx2 = back.x; sk.dy2 = back.y;
    } else if (kind === 'rainbow') { sk.t = sk.T = 0.6; sk.sp = 1.1; }
    c.sk = sk;
    const reach = kind === 'spin' ? 2.2 : kind === 'rainbow' ? 3.4 : 2.7;
    if (kind === 'rainbow') {
      // the ball goes up over the head of the defender and comes down behind him
      kick(c, d.x * 6.5, d.y * 6.5, 6.2);
      c.cool = 0.05; c.kickT = 0;
      say(opp && od < reach ? `Chapéu em ${nameOf(opp)}!` : `${nameOf(c)} dá um chapéu!`, 1);
    }
    const bonus = (c.stars - 3) * 0.04;
    if (opp && od < reach) {
      const base = kind === 'nutmeg' ? 0.34 : kind === 'rainbow' ? 0.5 : 0.4;
      const pr = clamp(base + (c.dri - opp.def) / 110 + (kind === 'spin' || kind === 'elastico' ? 0.1 : 0) + bonus, 0.15, 0.88);
      if (Math.random() < pr) {
        opp.cool = Math.max(opp.cool, kind === 'feint' ? 0.6 : 0.85);
        if (Math.random() < 0.3 || kind === 'elastico') opp.fall = Math.max(opp.fall, 0.4);
        if (kind !== 'rainbow') say(`${nameOf(c)} ${kind === 'spin' ? 'gira em cima de' : kind === 'nutmeg' ? 'dá uma caneta em' : kind === 'elastico' ? 'deixa no chão' : 'passa a finta em'} ${nameOf(opp)}!`, 1);
        if (kind === 'elastico' || kind === 'nutmeg') banner(kind === 'nutmeg' ? 'CANETA!' : 'ELÁSTICO!', 0.9);
      } else if (kind === 'nutmeg' && od < 2) {
        // the nutmeg is read: he closes the legs and takes the ball
        opp.cool = 0; opp.tackT = 0;
        tryTackle(opp, c, 0.2);
      }
    }
    sfx('kick', 0.25);
  }
  function doUserShoot(c, w, pw) {
    hint('');
    if (G.restartHold && (G.setKind === 'throw' || G.setKind === 'kickoff')) { userPass(c, w, false); return; }
    if (G.restartHold && G.setKind === 'corner') { cornerKick(c, zoneFromStick(c, w)); return; }
    shoot(c, w.x, pw);
  }
  // PASSE: to feet; LANÇAR: into the space in front of a runner (lofted when the lane is closed or it is long);
  // in front of goal with the keeper off his line, LANÇAR is a chip
  function userPass(c, w, through) {
    hint('');
    if (G.restartHold && G.setKind === 'corner') { cornerKick(c, through ? 'spot' : 'short'); return; }
    const gk = keeperOf(1);
    if (through && !G.restartHold && gk && c.y < 24 && Math.abs(c.x - PW / 2) < 16 && gk.y > 3.2) { chip(c); return; }
    const dir = (w.x || w.y) ? nrm(w.x, w.y) : { x: c.dx, y: c.dy };
    const q = bestReceiver(c, dir, through);
    const throwIn = G.restartHold && G.setKind === 'throw';
    let lob = false;
    if (through && q && !throwIn) lob = laneOpen(c, q) < 1.6 || dist(c, q) > 26;
    else if (through && !q && !throwIn) lob = true;
    passTo(c, q, dir, lob, through);
  }
  function bestReceiver(p, dir, through) {
    let best = null, bs = -1e9;
    const fwd = p.team === 0 ? -1 : 1;
    for (const q of G.players) {
      if (q.out || q.team !== p.team || q === p) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
      if (d < 2.5 || d > (through ? 55 : 42)) continue;
      const align = (dx * dir.x + dy * dir.y) / d;
      if (align < 0.45) continue;
      const open = laneOpen(p, q);
      const s = align * 4.5 + Math.min(open, 6) * (through ? 0.1 : 0.35) - d * (through ? 0.012 : 0.03) - (q.gk ? 3 : 0) + (dy * fwd > 0 ? (through ? 0.8 : 0.3) : 0) + (q.runT > 0 ? 0.8 : 0);
      if (s > bs) { bs = s; best = q; }
    }
    return best;
  }

  // ------------------------------------------------------------------ ball actions
  function kick(p, vx, vy, vz) {
    const b = G.ball;
    Object.assign(b, { owner: null, vx, vy, vz, z: Math.max(b.z, vz > 0 ? 0.05 : 0), last: p, lastTeam: p.team, shot: null, target: null, passer: null, curve: 0, cross: null });
    G.flight++;
    p.cool = 0.32;
    p.kickT = 0.25;
    G.restartHold = false;
    if (G.state === 'kickoff' || G.state === 'setpiece') G.state = 'play';
    const n = nrm(vx, vy);
    if (n.x || n.y) { p.dx = n.x; p.dy = n.y; }
    sfx('kick', clamp(Math.hypot(vx, vy) / 28, 0.2, 1));
  }
  function passTo(p, q, dir, lofted, through) {
    const b = G.ball;
    let tx, ty;
    const fwd = p.team === 0 ? -1 : 1;
    if (q) {
      const d0 = Math.hypot(q.x - b.x, q.y - b.y);
      const tt = Math.min(1.3, lofted ? 0.5 + d0 / 20 : d0 / 17);
      tx = q.x + q.vx * tt * 0.85; ty = q.y + q.vy * tt * 0.85;
      // into the space in front of the receiver
      if (through || q.runT > 0) {
        const room = Math.max(0, Math.abs((p.team === 0 ? 0 : PL) - ty) - 14);
        ty += fwd * Math.min(through ? 6 : 3, room);
        tx += (PW / 2 - tx) * 0.12;
      }
      tx = clamp(tx, 1, PW - 1); ty = clamp(ty, 1, PL - 1);
    } else { tx = b.x + dir.x * (lofted ? 26 : 15); ty = b.y + dir.y * (lofted ? 26 : 15); }
    const dx = tx - b.x, dy = ty - b.y, d = Math.max(1, Math.hypot(dx, dy));
    const errMul = p.team === 1 ? G.D.passErr : 1;
    const err = (0.015 + (1 - p.pas / 100) * 0.11 + pressureOn(p) * 0.025) * grand() * errMul;
    const ang = Math.atan2(dy, dx) + err;
    let vh, vz;
    if (lofted) { vz = clamp(d * 0.26, 3.5, 12); const T = 2 * vz / 9.8; vh = clamp(d / T * 0.92, 6, 26); }
    else { vh = clamp(5 + d * 0.72, 7, 25); vz = 0; }
    vh *= 1 + grand() * (1 - p.pas / 100) * 0.07;
    kick(p, Math.cos(ang) * vh, Math.sin(ang) * vh, vz);
    b.passer = p; b.target = q || null;
    if (q) q.runT = Math.max(q.runT, through ? 1.4 : 0);
    if (!G.auto && q && p.team === 0 && (through || d > 28)) say(through ? `${nameOf(p)} enfia para ${nameOf(q)}!` : `${nameOf(p)} lança para ${nameOf(q)}.`, 0);
  }
  function shoot(p, ax, power) {
    const b = G.ball, st = G.st;
    const up = p.team === 0;
    const gy = up ? 0 : PL;
    const gk = keeperOf(1 - p.team);
    let aimX;
    if (Math.abs(ax) > 0.25) aimX = PW / 2 + Math.sign(ax) * (1.4 + Math.min(1, Math.abs(ax)) * 2.1);
    else aimX = PW / 2 + (gk && gk.x > PW / 2 ? -1 : 1) * (1.8 + Math.random() * 1.4);
    let dx = aimX - b.x;
    const dy = gy - b.y, d = Math.hypot(dx, dy);
    const skill = p.sho / 100;
    const vh = 13 + power * 17 + (p.sho - 70) * 0.05;
    const t = d / vh;
    // placed (not blasted) shots to a corner bend back inside the post: start them a little wide
    let curve = 0;
    const side = Math.sign(aimX - PW / 2) || 1;
    if (Math.abs(aimX - PW / 2) > 2 && power < 0.85 && d > 9) {
      const mag = 2 + Math.random() * 2.5, kd = 2.2;
      dx += side * (mag / kd) * (t - (1 - Math.exp(-kd * t)) / kd);
      curve = -side * mag * (up ? 1 : -1);
    }
    const spread = (0.03 + (1 - skill) * 0.15 + pressureOn(p) * 0.045 + Math.max(0, power - 0.8) * 0.12 + Math.max(0, d - 20) * 0.003) * (p.team === 1 ? G.D.shootErr : 1);
    const ang = Math.atan2(dy, dx) + grand() * spread;
    let hg = 0.25 + Math.random() * 1.5 + Math.max(0, power - 0.85) * 2.4 + grand() * (1 - skill) * 1.1;
    // direct free kick: the ball is lifted over the wall and comes down towards the goal (it used to stop in the wall)
    const fk = !!(G.fk && G.fk.taker === p && G.time - G.fk.t < 10 && d > 14);
    if (fk) { hg = clamp(1.85 + Math.random() * 0.3 + (power - 0.7) * 0.5 + grand() * (1 - skill) * 0.5, 1.6, 2.3); G.fk = null; }
    const vz = clamp((hg + 4.9 * t * t) / t, 0.3, 14);
    kick(p, Math.cos(ang) * vh, Math.sin(ang) * vh, vz);
    b.curve = curve;
    b.shot = { team: p.team, by: p, t: 0, checked: false, beaten: false, force: null, fk };
    st.stats.sh[sideOf(p.team)]++;
    if (power > 0.8 && !G.auto) G.shake = 0.35;
    burst(b.x, b.y, 6, '#7fbf4a');
    say(d > 22 ? `${nameOf(p)} arrisca de longe!` : curve ? `${nameOf(p)} bate colocado!` : `Chute de ${nameOf(p)}!`, 1);
  }
  function chip(p) {
    const b = G.ball;
    const gy = p.team === 0 ? 0 : PL;
    const tx = PW / 2 + (Math.random() - 0.5) * 3;
    const dx = tx - b.x, dy = gy - b.y, d = Math.hypot(dx, dy);
    const vz = clamp(d * 0.42, 5, 10);
    const T = 2 * vz / 9.8;
    const vh = d / T * (0.95 + Math.random() * 0.15);
    const ang = Math.atan2(dy, dx) + (1 - p.sho / 100) * 0.12 * grand();
    kick(p, Math.cos(ang) * vh, Math.sin(ang) * vh, vz);
    b.shot = { team: p.team, by: p, t: 0, checked: false, beaten: false, force: null, chip: true };
    G.st.stats.sh[sideOf(p.team)]++;
    say(`Cavadinha de ${nameOf(p)}!`, 1);
  }
  // cross from the wing: driven into the space in front of a team-mate, coming down at head height
  function cross(p) {
    const b = G.ball;
    const gy = p.team === 0 ? 0 : PL, inward = gy === 0 ? 1 : -1;
    const blocker = G.players.find((o) => !o.out && !o.gk && o.team !== p.team && Math.hypot(o.x - p.x, o.y - p.y) < 1.9 && ((PW / 2 - p.x) * (o.x - p.x) + (gy + inward * 8 - p.y) * (o.y - p.y)) > 0);
    if (blocker && Math.random() < 0.4) {
      kick(p, 0, 0, 0);
      const n = nrm((Math.random() - 0.5) * 0.8 + (p.x < PW / 2 ? -0.4 : 0.4), -inward);
      Object.assign(b, { vx: n.x * (6 + Math.random() * 5), vy: n.y * (6 + Math.random() * 5), vz: 1 + Math.random() * 2.5, last: blocker, lastTeam: blocker.team });
      blocker.kickT = 0.25;
      say(`Cruzamento travado por ${nameOf(blocker)}!`, 1);
      if (G.dbg) G.dbg.crossBlocked = (G.dbg.crossBlocked || 0) + 1;
      return;
    }
    const cands = G.players.filter((q) => !q.out && q.team === p.team && q !== p && !q.gk && Math.abs(q.x - PW / 2) < 15 && Math.abs(q.y - gy) < 20);
    const spot = { x: PW / 2, y: gy + inward * 8 };
    cands.sort((a, c) => Math.hypot(a.x - spot.x, a.y - spot.y) - Math.hypot(c.x - spot.x, c.y - spot.y));
    const tgt = cands[Math.random() < 0.7 ? 0 : Math.min(1, cands.length - 1)] || null;
    let tx, ty;
    if (tgt) { tx = clamp(tgt.x + tgt.vx * 0.5, PW / 2 - 9, PW / 2 + 9); ty = gy + inward * clamp(Math.abs(tgt.y - gy) - 1.2, 4.5, 13); }
    else { tx = PW / 2 + (Math.random() - 0.5) * 8; ty = gy + inward * (6 + Math.random() * 5); }
    const d = Math.hypot(tx - b.x, ty - b.y);
    if (d < 6) { passTo(p, tgt, nrm(tx - b.x, ty - b.y), false, false); return; }
    const apex = clamp(1.9 + d * 0.06, 2.4, 4.8);
    deliverCross(p, tx, ty, 1.75, apex, 0.8 + Math.random() * 1.2, tgt, 'open');
    if (tgt) tgt.runT = Math.max(tgt.runT, 0.8);
    say(`Cruzamento de ${nameOf(p)} na área!`, 1);
  }
  function take(p) {
    const b = G.ball;
    if (b.passer && b.passer.team === p.team && b.passer !== p) b.assist = { pid: b.passer.pid, team: p.team, t: G.time };
    else if (b.lastTeam !== p.team) b.assist = null;
    Object.assign(b, { owner: p, last: p, lastTeam: p.team, shot: null, passer: null, target: null, z: 0, vz: 0, curve: 0, cross: null });
    p.decT = 0.15 + Math.random() * 0.2;
  }
  function poke(p, vx, vy) {
    Object.assign(G.ball, { owner: null, vx, vy, vz: 0.4, last: p, lastTeam: p.team, shot: null, passer: null, target: null, curve: 0, cross: null });
    G.flight++;
    p.cool = 0.2;
  }
  function startSlide(p, dx, dy) {
    const n = nrm(dx, dy);
    if (!n.x && !n.y) return;
    Object.assign(p, { slide: 0.45, sx: n.x, sy: n.y, slideDone: false, dx: n.x, dy: n.y });
    burst(p.x, p.y, 5, '#6fa83a');
  }
  function tryTackle(d, c, bonus) {
    if (c.gk) return false;
    const feint = (c.feintT > 0 ? 0.12 : 0) + (c.sk ? (c.sk.kind === 'spin' ? 0.3 : 0.2) * clamp(c.dri / 80, 0.7, 1.25) : 0);
    const pr = clamp(0.25 + (d.def - c.dri) / 170 + bonus + (d.team === 1 ? G.D.tackle : 0) - feint, 0.05, 0.7);
    d.tackT = 0.5;
    if (Math.random() < pr) {
      c.cool = 0.45;
      if (Math.random() < 0.25) c.fall = 0.35;
      if (Math.random() < 0.6) take(d);
      else { const n = nrm(d.dx + (Math.random() - 0.5), d.dy + (Math.random() - 0.5)); poke(d, n.x * 6, n.y * 6); }
      if (d.team === 0) say(`Bom desarme de ${nameOf(d)}.`, 0);
      return true;
    }
    d.cool = 0.35;
    if (Math.random() < 0.12) d.fall = 0.3;
    if (c.team === 0 && c.feintT > 0) say(`${nameOf(c)} passa pela marcação!`, 0);
    return false;
  }
  function slideContact(p) {
    const b = G.ball;
    if (p.slideDone) return;
    const o = b.owner;
    const fx = p.x + p.sx * 0.7, fy = p.y + p.sy * 0.7;
    if (Math.hypot(b.x - fx, b.y - fy) < 1.15 && b.z < 0.8) {
      p.slideDone = true;
      if (o && o.team !== p.team) {
        if (o.gk) { foul(p, o); return; }
        const behind = o.dx * p.sx + o.dy * p.sy > 0.55;
        const ok = Math.random() < clamp(0.62 + (p.def - o.dri) / 180 - (behind ? 0.35 : 0), 0.1, 0.92);
        if (ok) { o.fall = 0.5; o.cool = 0.5; poke(p, p.sx * 7 + (Math.random() - 0.5) * 2, p.sy * 7 + (Math.random() - 0.5) * 2); }
        else if (Math.random() < 0.7) foul(p, o);
      } else if (!o) poke(p, p.sx * 8 + b.vx * 0.2, p.sy * 8 + b.vy * 0.2);
      return;
    }
    if (o && o.team !== p.team && Math.hypot(o.x - fx, o.y - fy) < 0.85) { p.slideDone = true; foul(p, o); }
  }
  function foul(d, v) {
    const st = G.st, k = sideOf(d.team);
    st.stats.fo[k]++;
    const mn = minuteInt();
    const r = Math.random();
    sfx('whistle', 0.5);
    if (!d.gk && r < 0.18) {
      const had = st.ev.some((e) => e.t === 'yellow' && e.p === d.pid);
      if (had) { sendOff(st, k, d.pid, mn, true); spriteOut(d); banner('Expulso!', 1.4); say(`Segundo amarelo: ${nameOf(d)} está expulso!`, 2); }
      else { st.stats.yc[k]++; addRating(st, d.pid, -0.3); evAdd(st, { min: mn, t: 'yellow', s: k, p: d.pid, txt: phrase('yellow', { p: pidName(d.pid) }) }); banner('Cartão amarelo', 1.2); say(`Cartão amarelo para ${nameOf(d)}.`, 1); }
    } else if (!d.gk && r < 0.188) { sendOff(st, k, d.pid, mn, false); spriteOut(d); banner('Cartão vermelho!', 1.4); say(`Vermelho direto para ${nameOf(d)}!`, 2); }
    else { banner('Falta', 0.8); say(`Falta de ${nameOf(d)} em ${nameOf(v)}.`, 0); }
    v.fall = 0.6;
    if (inBoxOf(d.team, v.x, v.y)) startPenalty(v.team);
    else setPiece(v.team, v.x, v.y, 'free');
  }
  function spriteOut(p) {
    p.out = true;
    if (G.ball.owner === p) G.ball.owner = null;
    if (G.ctrl === p) G.ctrl = null;
  }

  // ------------------------------------------------------------------ AI
  function computeChasers() {
    const b = G.ball, own = b.owner;
    for (const team of [0, 1]) {
      let n;
      if (G.restartHold || (own && own.gk)) n = 0;
      else if (!own) n = team === 1 || G.auto ? 2 : 1;
      else if (own.team === team) n = 0;
      else n = team === 0 && !G.auto ? 1 : (team === 1 ? G.D.press : 2);
      if (!n) { G.chasers[team] = []; continue; }
      G.chasers[team] = G.players.filter((p) => !p.out && p.team === team && !p.gk && !(team === 0 && !G.auto && p === G.ctrl))
        .map((p) => ({ p, d: Math.hypot(p.x - b.x, p.y - b.y) })).sort((a, c) => a.d - c.d).slice(0, n).map((x) => x.p);
    }
  }
  function ai(p, dt, think) {
    const b = G.ball;
    p.cool = Math.max(0, p.cool - dt);
    p.tackT = Math.max(0, p.tackT - dt);
    p.kickT = Math.max(0, p.kickT - dt);
    if (p.feintT > 0) p.feintT -= dt;
    if (p.skCD > 0) p.skCD -= dt;
    if (p.sk) { p.sk.t -= dt; if (p.sk.t <= 0) p.sk = null; }
    if (p.wall) { if (G.restartHold) { p.wx = 0; p.wy = 0; return; } p.wall = false; }
    if (p.fall > 0) { p.fall -= dt; p.wx = 0; p.wy = 0; return; }
    if (p.slide > 0) return;
    if (!G.auto && p === G.ctrl) {
      const has = b.owner === p;
      if (has && G.restartHold) { p.wx = 0; p.wy = 0; return; }
      const s = p.speed * (p.sprint ? 1 : 0.8) * (has ? 0.92 : 1) * (p.sta < 0.15 ? 0.94 : 1);
      p.wx = p.inX * s; p.wy = p.inY * s;
      if (p.sk) { const k = p.sk, back = k.dx2 !== undefined && k.t < k.T * 0.5; p.wx = (back ? k.dx2 : k.dx) * p.speed * k.sp; p.wy = (back ? k.dy2 : k.dy) * p.speed * k.sp; }
      if (G.restartHold && b.owner && b.owner.team === 1) keepDistance(p);
      if (b.owner && b.owner.team === 1 && !G.restartHold && p.tackT <= 0 && dist(p, b.owner) < 1.3) tryTackle(p, b.owner, 0.08);
      return;
    }
    if (p.gk) { keeperAI(p, dt, think); return; }
    if (b.owner === p) { carrierAI(p, dt); return; }
    if (think) offBallAI(p);
    moveTo(p, p.tx, p.ty, p.run);
    if (G.restartHold && b.owner && b.owner.team !== p.team) keepDistance(p);
  }
  function keepDistance(p) {
    const b = G.ball;
    const minD = G.setKind === 'throw' ? 2 : 9.2;
    const d = Math.hypot(p.x + p.wx * 0.1 - b.x, p.y + p.wy * 0.1 - b.y);
    if (d < minD) {
      const n = nrm(p.x - b.x, p.y - b.y);
      const dot = p.wx * -n.x + p.wy * -n.y;
      if (dot > 0) { p.wx += n.x * dot; p.wy += n.y * dot; }
    }
  }
  function moveTo(p, tx, ty, run, maxRun = 1.15) {
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d < 0.35) { p.wx = 0; p.wy = 0; return; }
    const s = p.speed * clamp(run, 0.25, maxRun) * Math.min(1, d / 2.5 + 0.2);
    p.wx = dx / d * s; p.wy = dy / d * s;
  }
  function shapePos(p, attacking) {
    const b = G.ball;
    const bd = p.team === 0 ? 1 - b.y / PL : b.y / PL;
    let back, front;
    if (attacking) { back = clamp(bd - 0.4, 0.14, 0.52); front = clamp(bd + 0.3, 0.5, 0.9); }
    else { back = clamp(bd - 0.32, 0.06, 0.4); front = clamp(bd + 0.06, 0.3, 0.62); }
    const t = clamp((p.fy - 0.18) / 0.64, 0, 1);
    const depth = back + t * (front - back);
    const across = p.team === 0 ? p.fx : 1 - p.fx;
    const x = PW / 2 + (across * PW - PW / 2) * (attacking ? 1.02 : 0.74) + (b.x - PW / 2) * (attacking ? 0.18 : 0.34);
    const y = p.team === 0 ? PL * (1 - depth) : PL * depth;
    return { x: clamp(x, 1.5, PW - 1.5), y: clamp(y, 1.5, PL - 1.5) };
  }
  function interceptPoint(p) {
    const b = G.ball;
    let x = b.x, y = b.y, vx = b.vx, vy = b.vy;
    for (let t = 0.1; t <= 2.5; t += 0.1) {
      const sp = Math.hypot(vx, vy);
      const ns = Math.max(0, sp - (G.fr[0] + G.fr[1] * sp) * 0.1);
      if (sp > 0) { vx *= ns / sp; vy *= ns / sp; }
      x += vx * 0.1; y += vy * 0.1;
      if (Math.hypot(x - p.x, y - p.y) / (p.speed * 0.95) <= t) return { x, y };
    }
    return { x, y };
  }
  function interceptTime(p) {
    const b = G.ball;
    if (b.owner) return Math.hypot(b.x - p.x, b.y - p.y) / p.speed;
    const ip = interceptPoint(p);
    return Math.hypot(ip.x - p.x, ip.y - p.y) / p.speed;
  }
  function offBallAI(p) {
    const b = G.ball, own = b.owner;
    const fwd = p.team === 0 ? -1 : 1;
    const grp = POS_GROUP[p.pos];
    const mine = own ? own.team === p.team : (b.lastTeam === p.team && !b.shot);
    // corners: everybody holds the set-up position until the kick, then attacks or defends the cross
    if (p.cr && ((G.restartHold && G.setKind === 'corner') || G.cornerPlay)) {
      const ct = cornerTarget(p);
      if (ct) { p.tx = clamp(ct.x, 0.5, PW - 0.5); p.ty = clamp(ct.y, 0.5, PL - 0.5); p.run = ct.run; return; }
    }
    let tgt = shapePos(p, mine);
    let run = 0.72;
    if (mine && own && own !== p) {
      if (p.runT > 0) { p.runT -= 0.1; tgt.y += fwd * 9; tgt.x += (PW / 2 - tgt.x) * 0.25; run = 1; }
      else if ((grp === 'ATT' || (grp === 'MID' && Math.random() < 0.35)) && Math.random() < 0.035 && !G.restartHold) p.runT = 1.2 + Math.random();
      let mate = null, md = 99;
      for (const q of G.players) if (q !== p && !q.out && q.team === p.team) { const d = Math.hypot(q.x - tgt.x, q.y - tgt.y); if (d < md) { md = d; mate = q; } }
      if (mate && md < 5) { const n = nrm((tgt.x - mate.x) || 0.3, tgt.y - mate.y); tgt.x += n.x * (5 - md); tgt.y += n.y * (5 - md); }
    } else if (!mine) {
      const idx = G.chasers[p.team].indexOf(p);
      if (idx >= 0 && own) {
        const gy = p.team === 0 ? PL : 0;
        const n = nrm(PW / 2 - own.x, gy - own.y);
        const off = idx === 0 ? 0.8 : idx === 1 ? 4 : 2.2;
        const side = idx === 2 ? (own.x < PW / 2 ? 2.5 : -2.5) : 0;
        tgt = { x: own.x + own.vx * 0.15 + n.x * off + side, y: own.y + own.vy * 0.15 + n.y * off };
        run = idx === 0 ? 1 : 0.9;
      } else if (own && (grp === 'DEF' || grp === 'MID')) {
        let mk = null, md = 13;
        for (const o of G.players) {
          if (o.out || o.team === p.team || o.gk || o === own) continue;
          const d = Math.hypot(o.x - tgt.x, o.y - tgt.y);
          if (d < md) { md = d; mk = o; }
        }
        if (mk) {
          const gy = p.team === 0 ? PL : 0;
          const n = nrm(PW / 2 - mk.x, gy - mk.y);
          tgt = { x: mk.x * 0.7 + tgt.x * 0.3 + n.x * 1.6, y: mk.y * 0.7 + tgt.y * 0.3 + n.y * 1.6 };
          run = 0.85;
        }
      }
      if (own && own.team !== p.team && !own.gk && p.tackT <= 0 && !G.restartHold) {
        const d = dist(p, own);
        if (d < 1.3) tryTackle(p, own, p.team === 1 ? 0.02 : 0);
        else if (d < 3 && Math.random() < (p.team === 1 ? G.D.slide : 0.02)) { startSlide(p, own.x + own.vx * 0.25 - p.x, own.y + own.vy * 0.25 - p.y); p.tackT = 1.2; }
      }
    }
    if (!own && !G.restartHold && (G.chasers[p.team].includes(p) || b.target === p)) { tgt = interceptPoint(p); run = 1; }
    p.tx = clamp(tgt.x, 0.5, PW - 0.5);
    p.ty = clamp(tgt.y, 0.5, PL - 0.5);
    p.run = run;
  }
  function cornerTarget(p) {
    const cp = G.cornerPlay, cr = p.cr;
    if (G.restartHold) {
      const s = G.restartSpot || G.ball;
      if (cr.role === 'mark' && cr.mark && !cr.mark.out) {
        const m = cr.mark, gl = s.y < PL / 2 ? 0 : PL;
        const n = nrm(PW / 2 - m.x, gl - m.y);
        return { x: m.x + n.x * 0.9, y: m.y + n.y * 0.9, run: 0.7 };
      }
      // a little jostling around the spot
      return { x: cr.x + Math.sin(G.time * 2.1 + p.slot) * 0.6, y: cr.y + Math.cos(G.time * 1.7 + p.slot * 2) * 0.45, run: 0.4 };
    }
    if (!cp) return null;
    if (p.team === cp.team) {
      if (p === cp.hitter) { // time the run onto the ball
        const left = Math.max(0.05, cp.t - G.time);
        const d = Math.hypot(cp.x - p.x, cp.y - p.y);
        return { x: cp.x, y: cp.y, run: clamp(d / (p.speed * left), 0.5, 1.15) };
      }
      const A = { near: [2.0, 3.4], six: [0.2, 5.0], far: [-3.2, 4.4], spot: [0.6, 9.2], back: [-5.0, 7.4] }[cr.role];
      if (A) return { ...cp.at(cp.C + cp.sx * A[0], A[1]), run: 0.95 };
      if (cr.role === 'edge') return { ...cp.at(cp.C - cp.sx * 1.0, 17.5), run: 0.6 };
      if (cr.role === 'short') return { ...cp.at(cp.C + cp.sx * 14, 11), run: 0.6 };
      return { x: cr.x, y: cr.y, run: 0.6 };
    }
    // defending: attack the ball when it comes into your zone, otherwise stay between your man and the ball
    const dz = Math.hypot(cp.x - p.x, cp.y - p.y);
    if ((cr.role === 'zone' || cr.role === 'post' || cr.role === 'mark') && dz < 3.0) return { x: cp.x, y: cp.y, run: 1.1 };
    if (cr.role === 'mark' && cr.mark && !cr.mark.out) {
      const m = cr.mark, n = nrm(cp.x - m.x, cp.y - m.y);
      return { x: m.x + n.x * 0.7, y: m.y + n.y * 0.7, run: 1.05 };
    }
    return { x: cr.x, y: cr.y, run: 0.7 };
  }
  // ------------------------------------------------------------------ goalkeepers
  // positions on the line that splits the angle between the posts, off his line by how far away the ball is
  function gkHome(p) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0, inward = gl === 0 ? 1 : -1;
    const dl = Math.abs(b.y - gl);
    const u1 = nrm(PW / 2 - GOAL_W / 2 - b.x, gl - b.y), u2 = nrm(PW / 2 + GOAL_W / 2 - b.x, gl - b.y);
    const bis = nrm(u1.x + u2.x, u1.y + u2.y);
    const dBall = Math.hypot(b.x - PW / 2, b.y - gl);
    let off = dBall > 38 ? clamp(3.4 + (dBall - 38) * 0.1, 3.4, 8) : clamp(0.9 + dBall * 0.07, 0.9, 3.3);
    off = Math.min(off, Math.max(0.55, dl - 1.5));
    const t = Math.abs(bis.y) > 0.05 ? (dl - off) / Math.abs(bis.y) : 0;
    const x = clamp(b.x + bis.x * t, PW / 2 - GOAL_W / 2 + 0.35, PW / 2 + GOAL_W / 2 - 0.35);
    return { x, y: gl + inward * off };
  }
  // the ball's path from now on, with the same physics as ballStep (no players)
  function predictBall(maxT) {
    const b = G.ball, dt = 1 / 60, out = [];
    let x = b.x, y = b.y, z = b.z, vx = b.vx, vy = b.vy, vz = b.vz, curve = b.curve || 0;
    for (let t = dt; t <= maxT; t += dt) {
      x += vx * dt; y += vy * dt;
      if (curve) { const n = nrm(-vy, vx); vx += n.x * curve * dt; vy += n.y * curve * dt; curve *= Math.exp(-2.2 * dt); if (Math.abs(curve) < 0.05) curve = 0; }
      if (z > 0 || vz > 0) {
        vz -= 9.8 * dt; z += vz * dt;
        const drag = Math.exp(-0.12 * dt); vx *= drag; vy *= drag;
        if (z <= 0) { z = 0; if (vz < -1.6) { vz = -vz * 0.48; vx *= 0.82; vy *= 0.82; } else vz = 0; }
      } else { const sp = Math.hypot(vx, vy); if (sp > 0) { const ns = Math.max(0, sp - (G.fr[0] + G.fr[1] * sp) * dt); vx *= ns / sp; vy *= ns / sp; } }
      out.push({ t, x, y, z });
      if (y < -0.5 || y > PL + 0.5 || x < -0.5 || x > PW + 0.5) break;
    }
    return out;
  }
  const gkBonus = (p) => (p.team === 1 ? G.D.cpuSave : G.D.userSave);
  // bodies between the shooter and the keeper make him react later
  function screenedView(p) {
    const b = G.ball;
    const dx = p.x - b.x, dy = p.y - b.y, L2 = dx * dx + dy * dy || 1;
    for (const o of G.players) {
      if (o.out || o === p || (b.shot && o === b.shot.by)) continue;
      const t = ((o.x - b.x) * dx + (o.y - b.y) * dy) / L2;
      if (t < 0.15 || t > 0.85) continue;
      if (Math.hypot(o.x - (b.x + dx * t), o.y - (b.y + dy * t)) < 0.6) return true;
    }
    return false;
  }
  // reading a shot: where it crosses his line, whether it is on target, and how long he needs to react
  function gkPlanShot(p) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0, sg = gl === 0 ? -1 : 1;
    const traj = predictBall(2.4);
    let cr = null, gx = null, gz = 0;
    for (const s of traj) {
      if (!cr && (s.y - p.y) * sg >= 0) cr = s;
      if ((s.y - gl) * sg >= 0) { gx = s.x; gz = s.z; break; }
    }
    if (!cr) cr = traj[traj.length - 1] || { t: 0.4, x: b.x, y: b.y, z: b.z };
    const onT = gx !== null && Math.abs(gx - PW / 2) < GOAL_W / 2 + 0.1 && gz < GOAL_H + 0.1;
    const react = clamp(0.3 - (p.gkRef - 50) * 0.0032 + (screenedView(p) ? 0.08 : 0) - gkBonus(p) * 0.6 + Math.random() * 0.06, 0.12, 0.42);
    return { shot: b.shot, decideAt: G.time + react, cross: cr, tCross: G.time + cr.t, onT, gx, gz, acted: false, stepX: p.x };
  }
  // after reacting: he gets across on his feet when he can, otherwise he runs towards it and times the dive
  // so that he is fully stretched when the ball arrives; shots going well wide he just watches
  const DIVE_T = 0.36;
  function gkAct(p, pl) {
    const cr = pl.cross;
    const dx = cr.x - p.x, ax = Math.abs(dx);
    const left = pl.tCross - G.time;
    const nearPost = pl.gx !== null && Math.abs(pl.gx - PW / 2) < GOAL_W / 2 + 0.8;
    pl.stepX = cr.x;
    if (!pl.onT && !nearPost) { pl.mode = 'watch'; pl.stepX = p.x + Math.sign(dx) * 0.3; return; }
    const runDist = Math.min(ax, p.speed * Math.max(0, left - DIVE_T) * 0.75);
    if ((ax < 0.5 || ax - runDist < 0.45) && cr.z < 2.05) { pl.mode = 'step'; return; }
    pl.mode = 'dive';
    pl.launchAt = Math.max(G.time, pl.tCross - DIVE_T);
  }
  function gkLaunch(p, pl) {
    const cr = pl.cross;
    const dx = cr.x - p.x, ax = Math.abs(dx);
    const Dmax = clamp(1.0 + (p.gkDiv - 50) * 0.015 + gkBonus(p) * 1.5, 0.85, 1.9);
    pl.mode = 'dived';
    startDive(p, Math.sign(dx) || 1, Math.min(Dmax, Math.max(0.15, ax - 0.75) + 0.2), clamp(cr.z - 0.9, 0, 0.95));
    if (G.dbg) G.dbg.dives++;
  }
  // a dive: the body flies sideways (and up for high balls), then he lands and needs a moment to get up
  function startDive(p, dir, dist, h) {
    const T = 0.36;
    const x1 = clamp(p.x + dir * dist, PW / 2 - GOAL_W / 2 - 1.4, PW / 2 + GOAL_W / 2 + 1.4);
    p.dv = { t: 0, T, x0: p.x, x1, dir, h, land: 0.45 + Math.random() * 0.25 };
    p.diveDir = dir; p.diveT = T + p.dv.land;
    p.wx = p.wy = p.vx = p.vy = 0;
  }
  function stepDive(p, dt) {
    const d = p.dv;
    d.t += dt;
    const k = clamp(d.t / d.T, 0, 1);
    p.x = d.x0 + (d.x1 - d.x0) * (1 - (1 - k) * (1 - k));
    p.gz = d.t <= d.T ? d.h * Math.sin(Math.PI * k) : 0;
    p.vx = p.vy = p.wx = p.wy = 0;
    p.diveT = Math.max(0, d.T + d.land - d.t);
    if (d.t >= d.T + d.land) { p.dv = null; p.gz = 0; p.diveT = 0; }
  }
  // does the ball meet his hands as it crosses his line? (null: it beats him)
  function gkReach(gk) {
    const b = G.ball;
    const lat = b.x - gk.x, z = b.z;
    if (gk.dv && gk.dv.t <= gk.dv.T + 0.08) {
      const prog = clamp(gk.dv.t / gk.dv.T, 0, 1);
      const fing = 0.5 + 0.45 * prog;
      const along = lat * gk.dv.dir;
      const zTop = gk.gz + 1.75 + 0.35 * prog, zLow = Math.max(0, gk.gz - 0.45);
      if (along > fing + 0.12 || along < -0.5 || z > zTop || z < zLow - 0.1) return null;
      return { stretch: clamp(along / (fing + 0.12), 0, 1), diving: true };
    }
    if (gk.dv || gk.fall > 0) return Math.abs(lat) < 0.6 && z < 0.6 ? { stretch: 0.6, diving: false } : null;
    const reacted = !gk.plan || gk.plan.shot !== b.shot || G.time >= gk.plan.decideAt;
    const arm = reacted ? 0.9 : 0.45, top = reacted ? 2.3 + clamp((gk.gkDiv - 50) * 0.005, 0, 0.25) : 1.85;
    if (Math.abs(lat) > arm + 0.11 || z > top) return null;
    return { stretch: clamp(Math.abs(lat) / (arm + 0.11), 0, 1) * 0.55 + (z > 2.05 ? 0.3 : 0), diving: false };
  }
  // high balls that drop into his area: he comes for them when he gets there first
  function gkClaimPoint(p) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0;
    if (b.lastTeam === p.team && !b.cross) return null;
    const traj = predictBall(2.4);
    let prevZ = b.z;
    for (const s of traj) {
      const down = s.z < prevZ;
      prevZ = s.z;
      if (!down || s.z > 2.7) continue; // only once it comes down
      if (s.z < 0.9) return null;
      if (Math.abs(s.y - gl) > 6.2 || Math.abs(s.x - PW / 2) > 9.5) continue;
      const tReach = Math.hypot(s.x - p.x, s.y - p.y) / (p.speed * 1.12) + 0.1;
      if (tReach > s.t + 0.05) continue;
      const crowd = G.players.filter((q) => !q.out && q !== p && Math.hypot(q.x - s.x, q.y - s.y) < 2.2).length;
      if (Math.random() > clamp(0.5 + (p.gkPos - 60) * 0.01 - crowd * 0.06, 0.15, 0.85)) return null; // stays on his line
      return { x: s.x, y: s.y };
    }
    return null;
  }
  // loose balls and through passes he reaches before any opponent
  function gkSweep(p) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0;
    if (b.lastTeam === p.team && b.passer && Math.hypot(b.vx, b.vy) > 3) return null;
    const ip = interceptPoint(p);
    const depth = Math.abs(ip.y - gl);
    if (depth > 20 || Math.abs(ip.x - PW / 2) > 22) return null;
    const tMe = Math.hypot(ip.x - p.x, ip.y - p.y) / p.speed;
    let tOpp = 99, tMate = 99;
    for (const o of G.players) {
      if (o.out || o === p) continue;
      const t = interceptTime(o);
      if (o.team !== p.team) tOpp = Math.min(tOpp, t); else tMate = Math.min(tMate, t);
    }
    if (depth > 12 && tMate < tMe) return null;
    if (tMe + 0.25 < tOpp && (depth < 16.5 || tMe + 0.6 < tOpp)) return ip;
    return null;
  }
  // an attacker through on goal: nobody of the keeper's team close to him or in his way
  function isThrough(own, team) {
    const gl = team === 0 ? PL : 0;
    const dx = PW / 2 - own.x, dy = gl - own.y, L2 = dx * dx + dy * dy || 1;
    for (const o of G.players) {
      if (o.out || o.team !== team || o.gk) continue;
      if (Math.hypot(o.x - own.x, o.y - own.y) < 2.2) return false;
      const t = ((o.x - own.x) * dx + (o.y - own.y) * dy) / L2;
      if (t > 0 && t < 1 && Math.hypot(o.x - (own.x + dx * t), o.y - (own.y + dy * t)) < 2.6) return false;
    }
    return true;
  }
  // one against one: down at the striker's feet
  function gkSmother(p, own) {
    p.tackT = 1.0;
    const pr = clamp(0.36 + (p.gkDiv - own.dri) / 110 + gkBonus(p) * 2, 0.12, 0.72);
    const dir = Math.sign(own.x - p.x) || 1;
    startDive(p, dir, clamp(Math.abs(own.x - p.x), 0.3, 1.2), 0);
    const r = Math.random();
    if (r < pr) {
      if (Math.random() < 0.55) { take(p); p.holdT = 1.2; } else poke(p, (Math.random() - 0.5) * 8, (p.team === 0 ? -1 : 1) * (5 + Math.random() * 4));
      own.cool = 0.5;
      banner('Abafou!', 0.8);
      say(`${nameOf(p)} sai nos pés de ${nameOf(own)} e abafa!`, 2);
      if (G.dbg) G.dbg.smothers++;
    } else if (r < pr + 0.06 && inBoxOf(p.team, own.x, own.y)) foul(p, own);
    else {
      Object.assign(own, { feintT: 0.45, feintCD: 1.5, fdx: -dir * 0.9, fdy: p.team === 0 ? 1 : -1 });
      say(`${nameOf(own)} tira do goleiro!`, 1);
    }
  }
  // crosses he gets to: a catch, or a punch when it is crowded
  function claimAir(gk) {
    const b = G.ball;
    const crowd = G.players.filter((q) => !q.out && q.team !== gk.team && Math.hypot(q.x - b.x, q.y - b.y) < 1.6).length;
    const pCatch = clamp(0.66 + (gk.gkHan - 70) * 0.012 - crowd * 0.1 - (b.z > 2.45 ? 0.1 : 0) + gkBonus(gk), 0.25, 0.95);
    G.cornerPlay = null;
    if (Math.random() < pCatch) {
      take(gk); gk.holdT = 1.4;
      banner('Segurou!', 0.8);
      say(pick([`${nameOf(gk)} sai do gol e fica com a bola.`, `Firme, ${nameOf(gk)} encaixa o cruzamento.`]), 1);
      if (G.dbg) G.dbg.claims++;
      return;
    }
    const away = gk.team === 0 ? -1 : 1;
    const n = nrm((Math.random() - 0.5) * 1.4 + (b.x < PW / 2 ? -0.35 : 0.35), away);
    const sp = 11 + Math.random() * 5;
    Object.assign(b, { owner: null, vx: n.x * sp, vy: n.y * sp, vz: 3.5 + Math.random() * 2.5, last: gk, lastTeam: gk.team, shot: null, passer: null, target: null, curve: 0, cross: null });
    G.flight++;
    gk.cool = 0.4; gk.kickT = 0.25;
    banner('Socou!', 0.8);
    say(`${nameOf(gk)} sobe mais alto e afasta de soco.`, 1);
    sfx('kick', 0.6);
    if (G.dbg) G.dbg.punches++;
  }
  function keeperAI(p, dt, think) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0;
    if (p.dv) { stepDive(p, dt); return; }
    if (b.owner === p) {
      p.wx = 0; p.wy = 0;
      if (!G.restartHold && !inBoxOf(p.team, p.x, p.y)) { aiPass(p, true, false); return; } // at his feet outside the box: clear it
      p.holdT -= dt;
      if ((p.holdT <= 0 && G.state === 'play') || p.holdT <= -1.5) aiPass(p, Math.random() < 0.35, false);
      return;
    }
    if (p.dive && p.dive.t > 0) { p.dive.t -= dt; moveTo(p, p.dive.x, p.y, 1.3); return; } // penalty
    if (p.diveT > 0) p.diveT = Math.max(0, p.diveT - dt);
    const own = b.owner;
    // corner against: in the middle of the goal until the kick
    if (G.restartHold && G.setKind === 'corner' && G.restartTeam !== p.team && G.restartSpot) {
      const g = cornerGeo(G.restartSpot.x, G.restartSpot.y);
      moveTo(p, g.C - g.sx * 0.35, g.gl + g.inward * 0.8, 0.5);
      return;
    }
    // a shot: read it, react, then step across or dive
    if (b.shot && b.shot.team !== p.team && !b.shot.pk) {
      if (!p.plan || p.plan.shot !== b.shot) p.plan = gkPlanShot(p);
      const pl = p.plan;
      if (G.time < pl.decideAt) { moveTo(p, p.x + (pl.cross.x - p.x) * 0.15, p.y, 0.3); return; }
      if (!pl.acted) { pl.acted = true; gkAct(p, pl); }
      if (pl.mode === 'dive' && G.time >= pl.launchAt) { gkLaunch(p, pl); return; }
      moveTo(p, pl.stepX, p.y, pl.mode === 'watch' ? 0.5 : 1.15);
      return;
    }
    // crosses: decide once per ball in the air whether to come for it
    if (!own && !G.restartHold && b.z > 0.5) {
      if (p.claimFor !== G.flight) { p.claimFor = G.flight; p.claim = gkClaimPoint(p); }
      if (p.claim) { moveTo(p, p.claim.x, p.claim.y, 1.25); return; }
    } else p.claim = null;
    // loose balls and through passes
    if (!own && !G.restartHold && b.z < 1.6) {
      if (think || !p.sweep) p.sweep = gkSweep(p);
      if (p.sweep) { const ip = think ? p.sweep : interceptPoint(p); moveTo(p, ip.x, ip.y, 1.2); return; }
    } else p.sweep = null;
    // one against one: off the line to narrow the angle, then down at his feet
    if (own && own.team !== p.team && !G.restartHold && G.state === 'play') {
      const dG = Math.hypot(own.x - PW / 2, own.y - gl);
      if (dG < 21 && Math.abs(own.x - PW / 2) < 16 && isThrough(own, p.team)) {
        const n = nrm(own.x - PW / 2, own.y - gl);
        const off = clamp(dG * 0.5, 2.2, 9);
        moveTo(p, PW / 2 + n.x * off, gl + n.y * off, 1.2);
        if (dist(p, own) < 2.2 && p.tackT <= 0) gkSmother(p, own);
        return;
      }
    }
    const h = gkHome(p);
    const set = own && own.team !== p.team && Math.hypot(own.x - PW / 2, own.y - gl) < 26;
    moveTo(p, h.x, h.y, set ? 0.75 : 0.85);
  }
  function carrierAI(p, dt) {
    const fwd = p.team === 0 ? -1 : 1;
    const gy = p.team === 0 ? 0 : PL;
    if (G.restartHold) {
      p.wx = 0; p.wy = 0;
      if (G.state !== 'play') return;
      p.decT -= dt;
      if (p.decT > 0) return;
      const dGoal = Math.hypot(PW / 2 - p.x, gy - p.y);
      if (G.setKind === 'corner') cornerKick(p, aiCornerZone(p));
      else if (G.setKind === 'free' && dGoal < 27 && Math.abs(p.x - PW / 2) < 16 && Math.random() < 0.6) shoot(p, (Math.random() - 0.5) * 2, 0.62 + Math.random() * 0.3);
      else aiPass(p, false, G.setKind === 'kickoff' || G.setKind === 'throw');
      return;
    }
    const dGoal = Math.hypot(PW / 2 - p.x, gy - p.y);
    const press = pressureOn(p);
    const gk = keeperOf(1 - p.team);
    p.decT -= dt;
    if (p.decT <= 0) {
      p.decT = 0.2 + Math.random() * 0.25;
      const central = Math.abs(p.x - PW / 2) < 15;
      if (gk && dGoal < 24 && dGoal > 9 && central && Math.abs(gk.y - gy) > 5 && Math.random() < 0.5) { chip(p); return; }
      if (dGoal < 26 && central) {
        const pShoot = dGoal < 11 ? 0.9 : dGoal < 17 ? 0.65 : 0.28;
        if (Math.random() < pShoot) { const away = gk ? (gk.x > PW / 2 ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1); shoot(p, away * (0.5 + Math.random() * 0.5), 0.5 + Math.random() * 0.5); return; }
      }
      if (!central && Math.abs(gy - p.y) < 22 && Math.random() < 0.3) { cross(p); return; }
      if (press > 0.85 && Math.random() < 0.7) { aiPass(p, false, false); return; }
      if (Math.random() < 0.1) { aiPass(p, false, false); return; }
    }
    let tx = (PW / 2 - p.x) * (dGoal < 30 ? 0.5 : 0.2), ty = fwd * 10;
    let opp = null, od = 99;
    for (const o of G.players) if (!o.out && o.team !== p.team) { const d = dist(o, p); if (d < od && (o.y - p.y) * fwd > -2) { od = d; opp = o; } }
    // feint: a sharp cut away from a closing defender
    p.feintCD = (p.feintCD || 0) - dt;
    if (opp && od < 2.6 && p.feintT <= 0 && p.feintCD <= 0 && Math.abs(opp.x - p.x) < 1.6 && Math.random() < (0.5 + Math.max(0, p.dri - 60) * 0.04) * dt) {
      p.feintT = 0.35; p.feintCD = 1.5; p.fdx = (opp.x > p.x ? -1 : 1) * 0.75; p.fdy = fwd;
    }
    if (p.feintT > 0) { tx = p.fdx * 10; ty = p.fdy * 10; }
    else if (opp && od < 5) { const n = nrm(p.x - opp.x, p.y - opp.y); tx += n.x * (5 - od) * 2.6; ty += n.y * (5 - od) * 0.5; }
    if (p.x < 4) tx += 5;
    if (p.x > PW - 4) tx -= 5;
    const n = nrm(tx, ty);
    const s = p.speed * (0.84 + (p.dri - 70) / 400) * (p.feintT > 0 ? 1.12 : 1);
    p.wx = n.x * s; p.wy = n.y * s;
  }
  function aiPass(p, forceLong, shortOnly) {
    const fwd = p.team === 0 ? -1 : 1;
    let best = null, bs = -1e9, bestLob = false, bestThrough = false;
    for (const q of G.players) {
      if (q.out || q.team !== p.team || q === p || q.gk) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
      if (d < 4 || d > (shortOnly ? 22 : 46)) continue;
      const open = laneOpen(p, q);
      const lob = !shortOnly && ((open < 1.6 && d > 14) || d > 32);
      const space = Math.min(6, nearestOppDist(q));
      const prog = dy * fwd;
      let s = space * 0.55 + Math.min(open, 5) * (lob ? 0.15 : 0.6) + prog * 0.09 - d * 0.03 - (lob ? 0.8 : 0) + Math.random() * 1.1 + (forceLong ? d * 0.06 : 0);
      const through = !shortOnly && q.runT > 0 && prog > 4;
      if (through) s += 1.6;
      if (s > bs) { bs = s; best = q; bestLob = lob; bestThrough = through; }
    }
    if (!best) { passTo(p, null, nrm((PW / 2 - p.x) * 0.02, fwd), true, false); return; }
    passTo(p, best, nrm(best.x - p.x, best.y - p.y), bestLob, bestThrough);
  }

  // ------------------------------------------------------------------ physics
  function integrate(p, dt) {
    if (p.slide > 0) {
      p.slide -= dt;
      const k = Math.max(0.2, p.slide / 0.45);
      p.vx = p.sx * 9 * k; p.vy = p.sy * 9 * k;
      slideContact(p);
      if (p.slide <= 0) { p.fall = Math.max(p.fall, 0.4); p.vx *= 0.3; p.vy *= 0.3; }
    } else {
      const acc = (p.fall > 0 ? 6 : 24) * dt;
      let dvx = p.wx - p.vx, dvy = p.wy - p.vy;
      const dl = Math.hypot(dvx, dvy);
      if (dl > acc) { dvx *= acc / dl; dvy *= acc / dl; }
      p.vx += dvx; p.vy += dvy;
    }
    p.x = clamp(p.x + p.vx * dt, -3, PW + 3);
    p.y = clamp(p.y + p.vy * dt, -3, PL + 3);
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 0.4 && p.slide <= 0 && !(G.ball.owner === p && G.restartHold)) { p.dx = p.vx / sp; p.dy = p.vy / sp; }
    p.anim += sp * dt * 1.9;
  }
  function separate() {
    const ps = G.players;
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i];
      if (a.out) continue;
      for (let j = i + 1; j < ps.length; j++) {
        const c = ps[j];
        if (c.out) continue;
        const dx = a.x - c.x, dy = a.y - c.y, d = Math.hypot(dx, dy);
        if (d > 0.001 && d < 0.85) { const push = (0.85 - d) * 0.5; a.x += dx / d * push; a.y += dy / d * push; c.x -= dx / d * push; c.y -= dy / d * push; }
      }
    }
  }
  function ballStep(dt) {
    const b = G.ball;
    if (b.owner) {
      const o = b.owner;
      if (G.restartHold && G.restartSpot) { b.x = G.restartSpot.x; b.y = G.restartSpot.y; b.z = 0; b.vx = b.vy = b.vz = 0; return; }
      if (o.gk && inBoxOf(o.team, o.x, o.y)) { b.x = o.x + o.dx * 0.28; b.y = o.y + o.dy * 0.28; b.z = 1.0 + o.gz; b.vx = o.vx; b.vy = o.vy; b.vz = 0; return; } // in his hands
      const sp = Math.hypot(o.vx, o.vy);
      const off = 0.5 + Math.min(0.35, sp * 0.045) + Math.sin(o.anim * 2.2) * 0.07;
      b.x = o.x + o.dx * off; b.y = o.y + o.dy * off; b.z = 0; b.vx = o.vx; b.vy = o.vy; b.vz = 0;
      b.spin += sp * dt * 3;
      if (G.restartHold || (b.x >= 0 && b.x <= PW && b.y >= 0 && b.y <= PL)) return;
      if ((b.y < 0 || b.y > PL) && Math.abs(b.x - PW / 2) < GOAL_W / 2) { b.owner = null; goalScored(b.y < 0); return; }
      b.owner = null; o.cool = 0.4;
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.curve) { const n = nrm(-b.vy, b.vx); b.vx += n.x * b.curve * dt; b.vy += n.y * b.curve * dt; b.curve *= Math.exp(-2.2 * dt); if (Math.abs(b.curve) < 0.05) b.curve = 0; }
    if (b.z > 0 || b.vz > 0) {
      b.vz -= 9.8 * dt; b.z += b.vz * dt;
      const drag = Math.exp(-0.12 * dt); b.vx *= drag; b.vy *= drag;
      if (b.z <= 0) { b.z = 0; if (b.vz < -1.6) { b.vz = -b.vz * 0.48; b.vx *= 0.82; b.vy *= 0.82; } else b.vz = 0; }
    } else {
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 0) { const ns = Math.max(0, sp - (G.fr[0] + G.fr[1] * sp) * dt); b.vx *= ns / sp; b.vy *= ns / sp; }
    }
    b.spin += Math.hypot(b.vx, b.vy) * dt * 3;
    if (b.shot) {
      b.shot.t += dt;
      if (!b.shot.pk && (b.shot.t > 2.5 || (Math.hypot(b.vx, b.vy) < 4 && b.z < 0.3 && b.shot.t > 0.3))) b.shot = null;
    }
    const pk = G.pk;
    // goal line
    if (b.y < 0 || b.y > PL) {
      const top = b.y < 0;
      const gx = Math.abs(b.x - PW / 2);
      if (Math.abs(gx - GOAL_W / 2) < 0.22 && b.z < GOAL_H + 0.1 && b.postT <= 0) {
        b.y = top ? 0.05 : PL - 0.05; b.vy = -b.vy * 0.55; b.vx += Math.sign(b.x - PW / 2) * (gx < GOAL_W / 2 ? -2 : 2); b.postT = 0.4;
        if (b.shot) b.shot.checked = true;
        banner('Na trave!', 1); say('Na trave! Que susto!', 2); sfx('post', 1); G.shake = G.auto ? 0 : 0.4;
        return;
      }
      if (gx < GOAL_W / 2 && b.z < GOAL_H) {
        if (pk) { pk.scored = true; pk.dead = true; if (pk.shootout) { b.inGoal = true; b.vx *= 0.3; b.vy *= 0.3; net(top, b.x); sfx('net', 1); G.shake = G.auto ? 0 : 0.3; return; } }
        goalScored(top); return;
      }
      if (gx < GOAL_W / 2 && Math.abs(b.z - GOAL_H) < 0.2 && b.postT <= 0) { b.y = top ? 0.05 : PL - 0.05; b.vy = -b.vy * 0.5; b.vz = -Math.abs(b.vz) * 0.5; b.postT = 0.4; banner('No travessão!', 1); say('No travessão!', 2); sfx('post', 1); return; }
      if (pk) { b.vx = b.vy = 0; b.y = top ? -0.6 : PL + 0.6; pk.dead = true; if (!pk.shootout) pk.t = Math.max(pk.t, 1.4); return; }
      if (b.shot && gx < GOAL_W / 2 + 3) {
        banner(b.z >= GOAL_H ? 'Por cima!' : 'Para fora!', 0.8);
        say(b.z >= GOAL_H ? 'Por cima do gol!' : 'Para fora, raspando a trave!', 1);
        sfx('groan', 0.4);
        if (b.shot.by && Math.random() < 0.5) evAdd(G.st, { min: minuteInt(), t: 'miss', s: sideOf(b.shot.team), p: b.shot.by.pid, txt: phrase('miss', { p: pidName(b.shot.by.pid) }) });
      }
      const defending = top ? 1 : 0;
      if (G.dbg) { const k = b.lastTeam !== defending ? 'outGoalKick' : b.last && b.last.gk ? 'outCornerGK' : 'outCornerDef'; G.dbg[k] = (G.dbg[k] || 0) + 1; }
      if (b.lastTeam === defending) setPiece(1 - defending, b.x < PW / 2 ? 0.3 : PW - 0.3, top ? 0.3 : PL - 0.3, 'corner');
      else setPiece(defending, PW / 2 + (b.x < PW / 2 ? -5 : 5), top ? 5.5 : PL - 5.5, 'goalkick');
      return;
    }
    if (b.x < 0 || b.x > PW) {
      if (pk) { b.vx = b.vy = 0; pk.dead = true; if (!pk.shootout) pk.t = Math.max(pk.t, 1.4); return; }
      setPiece(1 - b.lastTeam, b.x < 0 ? 0.2 : PW - 0.2, clamp(b.y, 1, PL - 1), 'throw');
      return;
    }
    // goalkeeper: when the ball crosses his line, it is a save only if his body or his dive gets there
    if (b.shot && !b.shot.checked) {
      const gk = keeperOf(1 - b.shot.team);
      if (gk) {
        const prevY = b.y - b.vy * dt;
        if ((prevY - gk.y) * (b.y - gk.y) <= 0 || Math.abs(b.y - gk.y) < 0.3) {
          b.shot.checked = true;
          if (b.shot.pk) { // penalties are decided when the kick is taken
            if (b.shot.force === 'save') { gkSave(gk, { stretch: 0.5, diving: true, pk: true }); if (pk && !pk.shootout) pk.t = Math.max(pk.t, 1.5); return; }
          } else {
            const r = gkReach(gk);
            if (G.dbg) {
              const onT = Math.abs(b.x - PW / 2) < GOAL_W / 2 + 0.5;
              (G.dbg.cross = G.dbg.cross || []).push({ mode: gk.plan && gk.plan.shot === b.shot ? gk.plan.mode || 'none' : 'noplan', ponT: gk.plan ? gk.plan.onT : null, lat: +(b.x - gk.x).toFixed(2), z: +b.z.toFixed(2), sp: +Math.hypot(b.vx, b.vy).toFixed(1), t: +b.shot.t.toFixed(2), dv: gk.dv ? +(gk.dv.t / gk.dv.T).toFixed(2) : -1, react: gk.plan ? +(gk.plan.decideAt - (G.time - b.shot.t)).toFixed(2) : -1, hit: !!r, gx: +(b.x - PW / 2).toFixed(2), head: !!b.shot.header, onT, dGoal: +Math.abs(gk.y - (gk.team === 0 ? PL : 0)).toFixed(1) });
            }
            if (r && gkSave(gk, r)) return;
          }
          b.shot.beaten = true;
        }
      }
    }
    // pick up, headers and aerial duels
    if (b.z < 2.9 && !pk) {
      const cands = [];
      for (const p of G.players) {
        if (p.out || p.fall > 0 || p.cool > 0 || p.slide > 0) continue;
        if (b.shot && p.team === b.shot.team && b.shot.t < 0.5) continue;
        const hands = p.gk && inBoxOf(p.team, p.x, p.y);
        if (hands && b.shot && b.shot.team !== p.team) continue; // shots are decided by the save check
        if (p.dv) continue;
        if (b.shot && b.shot.fk && !p.gk && p.team !== b.shot.team && b.z > 1.5) continue; // the wall cannot reach a lifted free kick
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        const rXY = hands ? 1.35 : b.z >= 1.4 ? 1.05 : 1.0;
        const rZ = hands ? 2.72 + clamp((p.hgt - 185) * 0.01, -0.1, 0.12) : 2.5 + clamp((p.hgt - 180) * 0.006, -0.12, 0.1);
        if (d < rXY && b.z <= rZ) cands.push({ p, d, hands });
      }
      if (cands.length) {
        const gkc = cands.find((c) => c.hands);
        if (gkc) {
          if (b.z >= 1.3) { claimAir(gkc.p); return; }
          take(gkc.p); gkc.p.holdT = 1.0; G.cornerPlay = null; return;
        }
        // in the air: the best jump wins the header (a few more players jump in when it is crowded)
        if (b.z >= 1.45) {
          const cp = G.cornerPlay;
          const near = G.players.filter((p) => !p.out && !p.gk && p.fall <= 0 && p.slide <= 0 && !(b.shot && p.team === b.shot.team && b.shot.t < 0.5) && Math.hypot(p.x - b.x, p.y - b.y) < 1.45);
          let top = null, bs = -1e9;
          for (const p of near) {
            const d = Math.hypot(p.x - b.x, p.y - b.y);
            const sc = aerial(p) * 0.5 + (1 - d / 1.45) * 26 + Math.random() * 30 + (cp && p === cp.hitter ? 4 : 0) + (p.team !== b.lastTeam ? 3 : 0);
            if (sc > bs) { bs = sc; top = p; }
          }
          for (const p of near) if (p !== top) p.cool = Math.max(p.cool, 0.3);
          if (top) {
            if (G.dbg && cp) { G.dbg.cornerHeaders++; if (top.team === cp.team) G.dbg.cornerAttHeaders++; }
            G.cornerPlay = null;
            header(top);
            return;
          }
        }
        const best = cands.sort((u, v) => u.d - v.d)[0].p;
        const sp = Math.hypot(b.vx, b.vy);
        G.cornerPlay = null;
        let ctrl;
        if (b.shot && best.team !== b.shot.team) ctrl = 0.3 + (best.def - 60) / 220;
        else if (best.team === b.lastTeam) ctrl = 0.97 - Math.max(0, sp - 16) * 0.025;
        else ctrl = 0.55 + (best.def - 60) / 160 - Math.max(0, sp - 12) * 0.03;
        if (Math.random() < ctrl) {
          const wasShot = b.shot && best.team !== b.shot.team;
          take(best);
          if (wasShot) say(`${nameOf(best)} trava o chute!`, 1);
        } else {
          best.cool = 0.3; b.vx *= 0.6; b.vy *= 0.6;
          if (b.shot) {
            b.vx += (Math.random() - 0.5) * 9; b.vz = Math.max(b.vz, Math.random() * 3);
            b.shot = Object.assign({}, b.shot, { t: 0.2, checked: false, defl: true });
            b.lastTeam = best.team; b.last = best; G.flight++;
            say(`Desviou em ${nameOf(best)}!`, 1);
          }
        }
      }
    }
  }
  function header(p) {
    const b = G.ball;
    const gy = p.team === 0 ? 0 : PL, fwd = p.team === 0 ? -1 : 1;
    const dGoal = Math.hypot(PW / 2 - p.x, gy - p.y);
    p.kickT = 0.25;
    G.flight++;
    if (dGoal < 16 && Math.random() < 0.8) {
      const skill = (p.sho * 0.45 + p.phy * 0.35 + 20) / 100;
      const aimX = PW / 2 + (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 2.7) + grand() * (0.45 + (1 - skill) * 1.7);
      const n = nrm(aimX - b.x, gy - b.y);
      const sp = 11 + Math.random() * 6 + (p.phy - 70) * 0.06;
      const vz = -1.1 + Math.random() * 2.3 + grand() * 0.55 * (1.25 - skill) + (b.z > 2.2 ? 0.35 : 0);
      Object.assign(b, { owner: null, vx: n.x * sp, vy: n.y * sp, vz, last: p, lastTeam: p.team, passer: null, target: null, curve: 0, cross: null });
      b.shot = { team: p.team, by: p, t: 0, checked: false, beaten: false, force: null, header: true };
      G.st.stats.sh[sideOf(p.team)]++;
      p.cool = 0.3;
      banner('Cabeçada!', 0.6);
      say(`Cabeçada de ${nameOf(p)}!`, 1);
      sfx('kick', 0.5);
      if (G.dbg && G.time - (G.lastCornerT || -99) < 4) G.dbg.cornerShots++;
      return;
    }
    const ownGoal = p.team === 0 ? PL : 0;
    let n;
    if (p.team !== b.lastTeam && Math.abs(p.y - ownGoal) < 9 && Math.random() < 0.2) n = nrm(Math.sign(p.x - PW / 2 || 1) * (0.5 + Math.random()), ownGoal === 0 ? -1 : 1); // glanced behind
    else if (p.team === b.lastTeam) n = nrm(b.vx * 0.3 + (Math.random() - 0.5) * 4, fwd * 6);
    else n = nrm((Math.random() - 0.5) * 6, fwd * 8);
    Object.assign(b, { owner: null, vx: n.x * 11, vy: n.y * 11, vz: 3.5, last: p, lastTeam: p.team, shot: null, passer: null, target: null, curve: 0, cross: null });
    p.cool = 0.3;
    sfx('kick', 0.4);
  }
  // the ball meets the keeper: held, pushed wide, tipped over, blocked into the box, or (rarely) it squirms in
  function gkSave(gk, r) {
    const b = G.ball, st = G.st, pk = G.pk;
    const k = sideOf(1 - gk.team);
    const shooter = b.shot && b.shot.by;
    const sp = Math.hypot(b.vx, b.vy);
    const gl = gk.team === 0 ? PL : 0, away = gl === 0 ? 1 : -1; // goal line he guards and the way back into the pitch
    let pHold = clamp(0.8 + (gk.gkHan - 70) * 0.012 - Math.max(0, sp - 15) * 0.028 - r.stretch * 0.6 - (b.z > 2.0 ? 0.12 : 0) + (b.shot && b.shot.chip ? 0.15 : 0) + gkBonus(gk), 0.03, 0.95);
    const pIn = r.pk ? 0 : clamp((r.diving ? 0.012 : 0.004) + Math.max(0, sp - 22) * 0.005 + (r.stretch > 0.85 ? 0.05 : 0) - (gk.gkHan - 70) * 0.002, 0, 0.1);
    if (r.pk) pHold = 0.45;
    const u = Math.random();
    if (u >= pHold && u < pHold + pIn) {
      b.vx *= 0.72; b.vy *= 0.72; b.vz *= 0.5;
      say(pick([`A bola escapa das mãos de ${nameOf(gk)}!`, `Falhou! A bola passa por ${nameOf(gk)}!`]), 2);
      if (G.dbg) G.dbg.fumbles++;
      return false;
    }
    if (!(pk && pk.shootout)) {
      st.stats.sot[k]++;
      addRating(st, gk.pid, r.stretch > 0.6 ? 0.32 : 0.2);
      if (shooter) addRating(st, shooter.pid, 0.08);
      if (shooter && (sp > 17 || r.stretch > 0.5)) evAdd(st, { min: minuteInt(), t: 'save', s: k, p: shooter.pid, p2: gk.pid, txt: phrase('saveH', { p: pidName(shooter.pid), g: pidName(gk.pid) }) });
    }
    G.cornerPlay = null;
    G.flight++;
    if (u < pHold) {
      take(gk); gk.holdT = 1.3;
      banner(r.stretch > 0.6 ? 'Que defesa!' : 'Defesa!', 0.9);
      if (pk) { b.owner = null; b.vx = b.vy = 0; b.x = gk.x; b.y = gl + away * 0.9; }
      if (G.dbg) G.dbg.catches++;
    } else {
      const side = Math.sign(b.x - PW / 2) || (gk.dv ? gk.dv.dir : Math.random() < 0.5 ? -1 : 1);
      let vx, vy, vz;
      if (b.z > 2.0 && Math.abs(b.x - PW / 2) < GOAL_W / 2 + 0.5) { // tipped over the bar
        vx = b.vx * 0.25 + side * Math.random() * 2; vy = -away * (2 + Math.random() * 2.5); vz = 4 + Math.random() * 2;
      } else if (r.stretch > 0.55 || (r.diving && Math.random() < 0.55) || (sp > 21 && Math.random() < 0.3)) { // pushed round the post
        vx = side * (4 + Math.random() * 5); vy = -away * (1.5 + Math.random() * 3); vz = 0.8 + Math.random() * 1.8;
      } else { // blocked: the rebound drops in front of him
        vx = (Math.random() - 0.5) * 7; vy = away * (2.5 + Math.random() * 5.5); vz = 0.5 + Math.random() * 2;
      }
      if (pk) { vx *= 0.5; vy *= 0.5; }
      if (vy * away < 0) { // heading for the goal line: past the post or over the bar, never into the net
        const t = Math.max(0.05, Math.abs(b.y - gl) / Math.abs(vy));
        if (Math.abs(b.x + vx * t - PW / 2) < GOAL_W / 2 + 0.4) vz = Math.min(14, (3.1 + 4.9 * t * t) / t);
      }
      Object.assign(b, { owner: null, vx, vy, vz, z: Math.max(b.z, 0.1), last: gk, lastTeam: gk.team, shot: null, passer: null, target: null, curve: 0, cross: null });
      gk.cool = 0.45;
      banner('Espalmou!', 0.9);
      if (G.dbg) G.dbg.parries++;
    }
    say(pick([`Que defesa de ${nameOf(gk)}!`, `${nameOf(gk)} salva!`, `Grande defesa de ${nameOf(gk)}!`]), 2);
    sfx('save', 1);
    return true;
  }
  function goalScored(goalTop) {
    const b = G.ball, st = G.st;
    const fromPk = !!G.pk;
    const team = G.pk ? G.pk.team : (goalTop ? 0 : 1);
    const k = sideOf(team);
    const scorer = b.shot && b.shot.team === team ? b.shot.by : (b.last && b.last.team === team ? b.last : null);
    if (G.dbg && G.time - G.lastCornerT < 6) G.dbg.cornerGoals++;
    const og = !scorer;
    let assist = 0;
    if (!og && !fromPk && b.assist && b.assist.team === team && b.assist.pid !== scorer.pid && G.time - b.assist.t < 9) assist = b.assist.pid;
    st.score[k]++;
    if (!og) { st.stats.sot[k]++; addRating(st, scorer.pid, 1.1); if (assist) addRating(st, assist, 0.6); }
    const gk = keeperOf(1 - team);
    if (gk) addRating(st, gk.pid, -0.35);
    const mn = minuteInt();
    const pid = og ? 0 : scorer.pid;
    evAdd(st, { min: mn, t: 'goal', s: k, p: pid, p2: assist, sc: st.score.slice(), og, txt: og ? `Gol contra! ${TA(st.sides[k].id)} marca com a ajuda da defesa adversária.` : (fromPk ? `GOL! ${pidName(pid)} converte o pênalti.` : phrase('goal', { p: pidName(pid) }) + (assist ? ` Assistência de ${pidName(assist)}.` : '')) });
    Object.assign(b, { inGoal: true, owner: null, shot: null, passer: null, target: null, assist: null, curve: 0 });
    b.vx *= 0.35; b.vy *= 0.35;
    const celebrant = scorer || nearestTo(team, b.x, b.y, true);
    G.celebr = celebrant ? { scorer: celebrant, cx: b.x < PW / 2 ? 3 : PW - 3, cy: goalTop ? 4 : PL - 4 } : null;
    G.state = 'goal'; G.stateT = 2.8; G.nextKick = 1 - team;
    G.restartHold = true;
    G.pk = null;
    hint('');
    G.recGoalIdx = G.rec.length - 1; G.goalTop = goalTop; G.goalX = b.x;
    net(goalTop, b.x);
    if (!G.auto) { G.shake = 0.6; G.flash = 0.5; }
    banner(team === 0 ? 'GOOOOL!' : `Gol ${tA(st.sides[k].id, 'do')}`, 2.4);
    say(og ? `Gol contra! Conta para ${tA(st.sides[k].id)}.` : `GOOOOL! ${nameOf(scorer)} marca para ${tA(st.sides[k].id)}${assist ? `, com assistência de ${pidName(assist)}` : ''}!`, 3);
    goalPopup(og ? 'Gol contra' : nameOf(scorer), mn, st.sides[k].id, assist ? pidName(assist) : '', fromPk);
    sfx('net', 1); sfx('roar', team === 0 ? 1 : 0.55);
    if (team === 0) confetti(k);
    updateHud(true);
  }
  function idle(dt) {
    const sc = G.celebr, pk = G.pk, b = G.ball;
    for (const p of G.players) {
      if (p.out) continue;
      if (G.state === 'goal' && sc && p === sc.scorer) moveTo(p, sc.cx, sc.cy, 1);
      else if (G.state === 'goal' && sc && p.team === sc.scorer.team && !p.gk) moveTo(p, sc.scorer.x + (p.fx - 0.5) * 5, sc.scorer.y + (p.team === 0 ? 2.5 : -2.5), 0.95);
      else if (pk && p === pk.gk && p.dive && p.dive.t > 0) { p.dive.t -= dt; moveTo(p, p.dive.x, p.y, 1.4, 1.4); }
      else if (pk && p === pk.taker && pk.run) moveTo(p, b.x - 0.15, b.y - pk.fwd * 0.55, 0.55);
      else if (p.dv) { stepDive(p, dt); continue; }
      else { p.wx = 0; p.wy = 0; }
      if (p.fall > 0) p.fall -= dt;
      if (p.diveT > 0) p.diveT -= dt;
      if (p.kickT > 0) p.kickT -= dt;
      integrate(p, dt);
      if (pk && p === pk.taker && pk.run) { p.dx = 0; p.dy = pk.fwd; }
    }
    if (!b.owner) {
      if (G.state === 'penalty' && pk && pk.phase === 'flight' && !pk.dead) ballStep(dt);
      else {
        b.x += b.vx * dt; b.y += b.vy * dt;
        const f = Math.exp(-2.5 * dt); b.vx *= f; b.vy *= f;
        if (b.z > 0 || b.vz > 0) { b.vz -= 9.8 * dt; b.z = Math.max(0, b.z + b.vz * dt); if (b.z === 0) b.vz = 0; }
        if (b.inGoal) { b.y = clamp(b.y, -1.8, PL + 1.8); b.x = clamp(b.x, PW / 2 - GOAL_W / 2 + 0.25, PW / 2 + GOAL_W / 2 - 0.25); b.z = Math.min(b.z, GOAL_H - 0.3); }
      }
    }
    camera(dt);
  }
  function camera(dt) {
    const b = G.ball;
    let tx = b.x, ty = b.y;
    if (G.state === 'goal' && G.celebr) { tx = G.celebr.scorer.x; ty = G.celebr.scorer.y; }
    else if (G.restartHold && G.setKind === 'corner' && G.restartSpot) { // frame the box, not the corner flag
      const s = G.restartSpot, gl = s.y < PL / 2 ? 0 : PL;
      tx = s.x + (PW / 2 - s.x) * 0.62; ty = gl + (gl === 0 ? 1 : -1) * 8;
    } else if (G.cornerPlay && !b.owner) { tx = (b.x + G.cornerPlay.x) / 2; ty = (b.y + G.cornerPlay.y) / 2; }
    else if (G.pk || G.shootout) { tx = PW / 2; const up = G.pk ? G.pk.up : true; ty = up ? (G.landscape ? 12 : 7) : (G.landscape ? PL - 12 : PL + 2.5); }
    else if (b.owner) ty += b.owner.team === 0 ? -5 : 4;
    else { tx += b.vx * 0.15; ty += b.vy * 0.25; }
    const k = 1 - Math.exp(-3.2 * dt);
    G.cam.x += (tx - G.cam.x) * k;
    G.cam.y += (ty - G.cam.y) * k;
  }
  // zoeira: flying saucer abduction
  function startUfo() {
    const cand = G.players.filter((p) => !p.out && !p.gk && G.ball.owner !== p);
    if (!cand.length) { G.ufo.done = true; return; }
    const vic = cand[Math.floor(Math.random() * cand.length)];
    Object.assign(G.ufo, { done: true, vic, t: 0, taken: false });
    G.state = 'ufo';
    G.ball.owner = null; G.ball.vx = 0; G.ball.vy = 0;
    banner('👽 DISCO VOADOR!', 2.6);
    say('Inacreditável! Um disco voador sobre o gramado!', 3);
  }
  function ufoStep(dt) {
    const u = G.ufo;
    u.t += dt;
    for (const p of G.players) if (!p.out) { p.wx = 0; p.wy = 0; integrate(p, dt); }
    camera(dt);
    if (u.t > 1.6 && !u.taken) {
      u.taken = true;
      const v = u.vic, st = G.st, mn = minuteInt();
      st.alien = v.pid;
      evAdd(st, { min: mn, t: 'alien', s: v.side, p: v.pid, txt: `👽 ALIENÍGENAS INVADEM O GRAMADO! Um disco voador abduz ${pidName(v.pid)}!` });
      removeFromPitch(st, v.side, v.pid, mn);
      spriteOut(v);
      say(`${nameOf(v)} foi abduzido!`, 3);
    }
    if (u.t > 3.4) { const b = G.ball; setPiece(b.lastTeam, b.x, b.y, 'free'); }
  }

  // ------------------------------------------------------------------ instant replay of goals
  const REC_N = 240; // 8 s at 30 frames per second
  const REC_DT = 1 / 30;
  function record(dt) {
    G.recAcc += dt;
    if (G.recAcc < REC_DT) return;
    G.recAcc %= REC_DT;
    const ps = G.players, b = G.ball;
    const f = new Float32Array(4 + ps.length * 8);
    f[0] = b.x; f[1] = b.y; f[2] = b.z; f[3] = b.spin;
    ps.forEach((p, i) => {
      const o = 4 + i * 8;
      f[o + 7] = p.gz || 0;
      f[o] = p.x; f[o + 1] = p.y; f[o + 2] = p.dx; f[o + 3] = p.dy; f[o + 4] = p.anim;
      f[o + 5] = (p.slide > 0 ? 1 : 0) + (p.fall > 0 ? 2 : 0) + (p.out ? 4 : 0) + (p.kickT > 0 ? 8 : 0) + (p.diveT > 0 ? 16 : 0);
      f[o + 6] = Math.hypot(p.vx, p.vy);
    });
    G.rec.push(f);
    if (G.rec.length > REC_N) { G.rec.shift(); if (G.recGoalIdx >= 0) G.recGoalIdx--; }
  }
  function startReplay() {
    const start = Math.max(0, G.recGoalIdx - 105);
    G.replay = { i: start, t: 0, end: G.rec.length - 1, netDone: false };
    G.state = 'replay';
    G.net = null;
    showReplayTag(true);
  }
  function replayStep(dt) {
    const r = G.replay;
    r.t += dt * 30 * 0.65;
    const i = Math.min(r.end, r.i + Math.floor(r.t));
    const f = G.rec[i];
    if (f) applyFrame(f);
    if (!r.netDone && i >= G.recGoalIdx) { r.netDone = true; net(G.goalTop, G.goalX); sfx('net', 0.7); sfx('roar', 0.4); }
    stepFx(0);
    camera(dt);
    if (i >= r.end) endReplay();
  }
  function applyFrame(f) {
    const b = G.ball;
    b.owner = null; b.x = f[0]; b.y = f[1]; b.z = f[2]; b.spin = f[3]; b.vx = b.vy = 0;
    G.players.forEach((p, i) => {
      const o = 4 + i * 8;
      if (o + 7 >= f.length) return;
      p.rGz = f[o + 7];
      p.x = f[o]; p.y = f[o + 1]; p.dx = f[o + 2]; p.dy = f[o + 3]; p.anim = f[o + 4];
      const fl = f[o + 5];
      p.rSlide = fl & 1; p.rFall = fl & 2; p.rOut = fl & 4; p.rKick = fl & 8; p.rDive = fl & 16;
      const sp = f[o + 6];
      p.vx = p.dx * sp; p.vy = p.dy * sp;
    });
  }
  function endReplay() {
    if (!G.replay) return;
    G.replay = null;
    G.players.forEach((p) => { p.rSlide = p.rFall = p.rOut = p.rKick = p.rDive = 0; p.rGz = 0; });
    showReplayTag(false);
    resetKickoff(G.nextKick);
  }

  // ------------------------------------------------------------------ sound (generated with Web Audio, no files)
  const SFX = { ctx: null, master: null, crowd: null, crowdGain: null, on: false, noise: null };
  function sfxInit(enabled) {
    SFX.on = !!enabled;
    if (!enabled || SFX.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = new AC();
      SFX.ctx = c;
      SFX.master = c.createGain(); SFX.master.gain.value = 0.55; SFX.master.connect(c.destination);
      const len = c.sampleRate * 2;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.5; }
      SFX.noise = buf;
      // crowd: brown noise through a band-pass; its level follows the danger on the pitch
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.6;
      SFX.crowdGain = c.createGain(); SFX.crowdGain.gain.value = 0.08;
      src.connect(bp); bp.connect(SFX.crowdGain); SFX.crowdGain.connect(SFX.master);
      src.start();
      SFX.crowd = src;
      if (c.state === 'suspended') c.resume().catch(() => {});
    } catch (e) { SFX.ctx = null; }
  }
  function sfxSetOn(on) {
    SFX.on = on;
    if (on && !SFX.ctx) sfxInit(true);
    if (SFX.master && SFX.ctx) SFX.master.gain.setTargetAtTime(on ? 0.55 : 0, SFX.ctx.currentTime, 0.05);
  }
  function sfx(kind, vol = 1) {
    if (!G || G.auto || !SFX.on || !SFX.ctx) return;
    const c = SFX.ctx, t = c.currentTime;
    try {
      if (kind === 'kick') {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.09);
        g.gain.setValueAtTime(0.5 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(g); g.connect(SFX.master); o.start(t); o.stop(t + 0.13);
      } else if (kind === 'whistle') {
        const dur = 0.25 + vol * 0.55;
        [2850, 3120].forEach((fq) => {
          const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
          o.type = 'triangle'; o.frequency.value = fq; lfo.frequency.value = 28; lg.gain.value = 60;
          lfo.connect(lg); lg.connect(o.frequency);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.02); g.gain.setValueAtTime(0.06, t + dur - 0.05); g.gain.linearRampToValueAtTime(0, t + dur);
          o.connect(g); g.connect(SFX.master); o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
        });
      } else if (kind === 'roar' || kind === 'groan' || kind === 'net' || kind === 'save') {
        const src = c.createBufferSource(); src.buffer = SFX.noise;
        const f = c.createBiquadFilter(), g = c.createGain();
        const dur = kind === 'roar' ? 3.2 : kind === 'groan' ? 1.4 : kind === 'save' ? 1.2 : 0.35;
        f.type = kind === 'net' ? 'highpass' : 'bandpass';
        f.frequency.setValueAtTime(kind === 'net' ? 2500 : kind === 'groan' ? 380 : 800, t);
        if (kind === 'roar') f.frequency.linearRampToValueAtTime(1100, t + 0.6);
        if (kind === 'groan') f.frequency.linearRampToValueAtTime(220, t + dur);
        f.Q.value = 0.7;
        const peak = (kind === 'roar' ? 0.9 : kind === 'net' ? 0.5 : 0.45) * vol;
        g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.002, peak), t + (kind === 'net' ? 0.01 : 0.18)); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f); f.connect(g); g.connect(SFX.master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
      } else if (kind === 'post') {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(980, t); o.frequency.exponentialRampToValueAtTime(760, t + 0.5);
        g.gain.setValueAtTime(0.3 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.connect(g); g.connect(SFX.master); o.start(t); o.stop(t + 0.62);
      }
    } catch (e) { /* audio unavailable */ }
  }
  function crowdMood(dt) {
    G.moodT -= dt;
    if (G.moodT > 0 || !SFX.crowdGain || !SFX.ctx) return;
    G.moodT = 0.25;
    const b = G.ball;
    const danger = Math.max(0, 1 - Math.min(b.y, PL - b.y) / 30);
    SFX.crowdGain.gain.setTargetAtTime(0.06 + danger * 0.1, SFX.ctx.currentTime, 0.4);
  }
  function sfxClose() { try { if (SFX.crowd) SFX.crowd.stop(); if (SFX.ctx) SFX.ctx.close(); } catch (e) { /* ignore */ } Object.assign(SFX, { ctx: null, master: null, crowd: null, crowdGain: null, noise: null }); }

  // ------------------------------------------------------------------ narration ticker
  function say(txt, pri = 0) {
    if (!G || G.auto || !hud.say) return;
    if (pri < G.sayPri && G.time - G.sayT < 2.2) return;
    if (pri === 0 && G.time - G.sayT < 2.6) return;
    G.sayT = G.time; G.sayPri = pri;
    hud.say.textContent = txt;
    hud.say.classList.remove('show'); void hud.say.offsetWidth; hud.say.classList.add('show');
  }
  function hint(txt) { if (hud.hint) { hud.hint.textContent = txt; hud.hint.hidden = !txt; } }

  // ------------------------------------------------------------------ particles & effects
  function burst(x, y, n, color) { if (!G || G.auto) return; for (let i = 0; i < n; i++) G.fx.push({ kind: 'grass', x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, z: 0, vz: 1 + Math.random() * 2, life: 0.5 + Math.random() * 0.3, color }); }
  function confetti(k) {
    if (!G || G.auto) return;
    const kit = G.kits[k];
    const cols = [kit.shirt, kit.trim, '#ffd34d', '#ffffff'];
    for (let i = 0; i < 140; i++) G.fx.push({ kind: 'conf', sx: Math.random(), sy: -Math.random() * 0.3, vx: (Math.random() - 0.5) * 0.1, vy: 0.15 + Math.random() * 0.25, a: Math.random() * 6, va: (Math.random() - 0.5) * 8, life: 3 + Math.random() * 1.5, color: cols[i % cols.length] });
  }
  function net(top, x) { G.net = { top, x, t: 1 }; }
  function stepFx(dt) {
    if (G.net) { G.net.t -= (dt || 1 / 60) * 1.2; if (G.net.t <= 0) G.net = null; }
    if (!G.fx.length || !dt) return;
    for (const f of G.fx) {
      f.life -= dt;
      if (f.kind === 'grass') { f.x += f.vx * dt; f.y += f.vy * dt; f.vz -= 9.8 * dt; f.z = Math.max(0, f.z + f.vz * dt); }
      else { f.sx += f.vx * dt; f.sy += f.vy * dt; f.a += f.va * dt; }
    }
    G.fx = G.fx.filter((f) => f.life > 0);
  }

  // ------------------------------------------------------------------ DOM, HUD, overlays, input & loop
  function start(m, st, opts, done) {
    onDone = done;
    create(m, st, opts);
    buildDom();
    sfxInit(opts.sound);
    showIntro();
    G.last = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  // only the shoot-out (minute-by-minute / quick-sim matches that end level): the user takes and saves the kicks
  function startShootoutOnly(m, st, opts, done) {
    onDone = done;
    const nEv = st.ev.length, half = st.half;
    create(m, st, opts);
    st.ev.length = nEv; st.half = half;
    buildDom();
    sfxInit(opts.sound);
    G.last = performance.now();
    rafId = requestAnimationFrame(loop);
    startShootout();
  }
  function setMsg(t) { if (hud.msg && root) hud.msg.textContent = t; }
  function banner(t, secs = 1.4) { if (!G) return; G.msg = t; G.msgT = secs; setMsg(t); }
  function teamBox(id, k) {
    const kit = G.kits[k];
    return `<span class="sb-team" style="--c:${kit.shirt};--t:${textOn(kit.shirt)}">${crest(id, 22)}<b>${esc(teamShort(id))}</b></span>`;
  }
  function buildDom() {
    root = document.createElement('div');
    hud.skp = undefined; hud.lastStars = 0;
    root.className = 'g2d';
    applyBtnSize(root);
    const m = G.m;
    root.innerHTML = `<canvas class="g2-main" aria-label="Partida jogável"></canvas>
      <div class="g2d-hud">
        <div class="sb">${teamBox(m.h, 0)}<span class="sb-score"><b id="g2-h">0</b><i>x</i><b id="g2-a">0</b></span>${teamBox(m.a, 1)}<span class="sb-clock" id="g2-clock">0'</span></div>
        <div class="row" style="gap:8px"><button class="pill" id="g2-snd" aria-label="Som">${G2PREF.sound === false ? '🔇' : '🔊'}</button><button class="pill" id="g2-pause" aria-label="Pausar">❚❚</button></div>
      </div>
      <canvas class="g2-radar" aria-hidden="true"></canvas>
      <div class="g2-say" id="g2-say" aria-live="polite"></div>
      <div class="g2-so" id="g2-so" hidden></div>
      <div class="g2d-msg" id="g2-msg"></div>
      <div class="g2-pop" id="g2-pop" hidden></div>
      <div class="g2-hint" id="g2-hint" hidden></div>
      <div class="g2-tag" id="g2-tag" hidden>REPLAY</div>
      <div class="g2d-controls"><div class="joy" id="g2-joy"><i></i></div>
        <div class="skpads"><button class="pad sk" data-k="special">ESPECIAL</button><button class="pad sk" data-k="spin">GIRO</button><button class="pad sk" data-k="feint">FINTA</button></div>
        <div class="pads"><button class="pad" data-k="lob">LANÇAR</button><button class="pad pass" data-k="pass">PASSE</button><button class="pad shoot" data-k="shoot">CHUTE</button></div></div>
      <div class="g2d-pause" id="g2-pausebox" hidden></div>`;
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';
    cv = root.querySelector('canvas.g2-main');
    ctx = cv.getContext('2d');
    radar = root.querySelector('canvas.g2-radar');
    rctx = radar.getContext('2d');
    Object.assign(hud, {
      clock: root.querySelector('#g2-clock'), h: root.querySelector('#g2-h'), a: root.querySelector('#g2-a'), msg: root.querySelector('#g2-msg'),
      pause: root.querySelector('#g2-pausebox'), say: root.querySelector('#g2-say'), hint: root.querySelector('#g2-hint'), tag: root.querySelector('#g2-tag'),
      pop: root.querySelector('#g2-pop'), so: root.querySelector('#g2-so'), snd: root.querySelector('#g2-snd'), lastClock: '', lastScore: '', breakKind: null, intro: null,
    });
    resize();
    addEventListener('resize', resize);
    addEventListener('keydown', onKey);
    addEventListener('keyup', onKey);
    addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVis);
    root.querySelector('#g2-pause').addEventListener('click', () => togglePause());
    hud.snd.addEventListener('click', () => { G2PREF.sound = G2PREF.sound === false; saveG2Pref(); sfxSetOn(G2PREF.sound); hud.snd.textContent = G2PREF.sound ? '🔊' : '🔇'; });
    cv.addEventListener('pointerdown', () => { if (!G) return; if (G.state === 'replay') endReplay(); else if (G.state === 'intro') G.stateT = Math.min(G.stateT, 0.05); });
    const joy = root.querySelector('#g2-joy'), knob = joy.querySelector('i');
    let jid = null, jc = null;
    const moveJoy = (e) => {
      let dx = e.clientX - jc.x, dy = e.clientY - jc.y;
      const d = Math.hypot(dx, dy), max = jc.r * 0.8;
      if (d > max) { dx *= max / d; dy *= max / d; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      const ix = dx / max, iy = dy / max;
      if (Math.hypot(ix, iy) < 0.2) { G.input.jx = 0; G.input.jy = 0; } else { G.input.jx = ix; G.input.jy = iy; }
    };
    joy.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!G) return; jid = e.pointerId; try { joy.setPointerCapture(jid); } catch (_) { /* not capturable */ } const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; moveJoy(e); });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid && G) moveJoy(e); });
    const endJoy = (e) => { if (e.pointerId !== jid || !G) return; jid = null; G.input.jx = 0; G.input.jy = 0; knob.style.transform = ''; };
    joy.addEventListener('pointerup', endJoy);
    joy.addEventListener('pointercancel', endJoy);
    root.querySelectorAll('.pad').forEach((btn) => {
      const k = btn.dataset.k;
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); btn.classList.add('on'); press(k, true); });
      const up = () => { if (!btn.classList.contains('on')) return; btn.classList.remove('on'); press(k, false); };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }
  function showIntro() {
    const m = G.m, w = G.weather, c = S.comps[m.c];
    const rd = c && c.rounds && c.rounds[m.r];
    const host = S.teams[m.h];
    const box = document.createElement('div');
    box.className = 'g2-intro';
    box.innerHTML = `<div class="card"><div class="g2-intro-comp">${esc(c ? c.name : '')}${rd ? ` · ${esc(rd.name)}` : ''}</div>
      <div class="row" style="justify-content:center;gap:18px;margin:14px 0 10px">${crest(m.h, 66)}<span class="disp" style="font-size:30px;font-weight:800;opacity:0.7">x</span>${crest(m.a, 66)}</div>
      <div class="disp" style="font-size:clamp(22px,5vw,30px);font-weight:800;line-height:1.1">${esc(teamName(m.h))} x ${esc(teamName(m.a))}</div>
      <div class="muted" style="margin-top:8px">🏟 ${esc(m.n ? 'Campo neutro' : host.std || 'Estádio ' + tA(host, 'do'))} · ${w.icon} ${esc(w.label)}, ${w.temp}°C</div>
      <div class="muted" style="margin-top:4px;font-size:13px">Dificuldade ${esc((G2_DIFFS.find(([k]) => k === G.diff) || ['', 'Normal'])[1])} · toque para começar</div></div>`;
    root.appendChild(box);
    hud.intro = box;
    box.addEventListener('pointerdown', () => { if (G && G.state === 'intro') G.stateT = 0; });
  }
  function hideIntro() { if (hud.intro) { const el = hud.intro; el.classList.add('out'); setTimeout(() => el.remove(), 450); hud.intro = null; } }
  function goalPopup(name, mn, teamId, assist, pen) {
    if (!hud.pop) return;
    hud.pop.innerHTML = `${crest(teamId, 28)}<div><b>⚽ ${esc(name)} ${mn}'${pen ? ' (pên.)' : ''}</b>${assist ? `<div class="muted">assistência: ${esc(assist)}</div>` : ''}</div>`;
    hud.pop.hidden = false;
    hud.pop.classList.remove('show'); void hud.pop.offsetWidth; hud.pop.classList.add('show');
    clearTimeout(hud.popT);
    hud.popT = setTimeout(() => { if (hud.pop) hud.pop.hidden = true; }, 4200);
  }
  function showReplayTag(on) { if (hud.tag) hud.tag.hidden = !on; if (root) root.classList.toggle('replaying', on); }
  function showShootoutHud() {
    if (!hud.so || !G.shootout) return;
    const so = G.shootout;
    const row = (team) => {
      const ks = so.kicks[team];
      const cells = [];
      for (let i = 0; i < Math.max(5, ks.length); i++) cells.push(`<i class="${i < ks.length ? (ks[i] ? 'ok' : 'no') : ''}"></i>`);
      const id = teamIdOf(team);
      return `<div class="so-row">${crest(id, 20)}<b class="so-t">${esc(teamShort(id))}</b><span class="so-k">${cells.join('')}</span><b class="so-n">${ks.filter(Boolean).length}</b></div>`;
    };
    hud.so.innerHTML = row(0) + row(1);
    hud.so.hidden = false;
  }
  function statsHtml() {
    const st = G.st, s = st.stats;
    const tot = G.possT[0] + G.possT[1];
    const possU = tot > 5 ? Math.round(G.possT[0] / tot * 100) : 50;
    const poss = G.userSide === 0 ? [possU, 100 - possU] : [100 - possU, possU];
    const rows = [['Posse (%)', poss], ['Finalizações', s.sh], ['No gol', s.sot], ['Escanteios', s.cor], ['Faltas', s.fo], ['Amarelos', s.yc], ['Vermelhos', s.rc]];
    const goals = (k) => st.ev.filter((e) => e.t === 'goal' && e.s === k).map((e) => `${e.p ? esc(pidName(e.p)) : 'Gol contra'} ${minuteLabel(st, e)}`).join(', ');
    return `<div class="row" style="justify-content:center;gap:14px;margin:6px 0 4px">${crest(G.m.h, 40)}<span class="disp" style="font-size:44px;font-weight:800">${st.score[0]} x ${st.score[1]}</span>${crest(G.m.a, 40)}</div>
      <div class="g2-goals"><span>⚽ ${goals(0) || '—'}</span><span>⚽ ${goals(1) || '—'}</span></div>
      <div class="g2-stats">${rows.map(([l, v]) => { const t = (v[0] + v[1]) || 1; return `<div class="r"><b>${v[0]}</b><span>${l}<i><u style="width:${(v[0] / t) * 100}%"></u></i></span><b>${v[1]}</b></div>`; }).join('')}</div>`;
  }
  function showBreak(kind) {
    hint('');
    G.input.shootDown = false; G.input.hold = 0;
    const st = G.st;
    let title, btns, note = '';
    if (kind === 'half') { title = 'Intervalo'; btns = '<button class="btn" data-g="subs">⇄ Substituições</button><button class="btn" data-g="sim">⏩ Simular o 2º tempo</button><button class="btn primary big" data-g="second">▶ 2º tempo</button>'; }
    else if (kind === 'noet') {
      title = 'Fim de jogo';
      note = '<p class="muted" style="margin:10px 0 0">Empate no agregado e, no estadual, não tem prorrogação: a decisão vai direto para os pênaltis. Você bate e defende.</p>';
      btns = '<button class="btn" data-g="simpens">⏩ Simular pênaltis</button><button class="btn primary big" data-g="pens">🎯 Disputar pênaltis</button>';
    } else if (kind === 'et') {
      title = 'Fim da prorrogação';
      note = `<p class="muted" style="margin:10px 0 0">O empate no agregado persistiu e a prorrogação foi simulada${G.etGoals && G.etGoals[0] + G.etGoals[1] ? ` (${G.etGoals[0]} x ${G.etGoals[1]} nos 30 minutos)` : ', sem gols'}. A decisão vai para os pênaltis: você bate e defende.</p>`;
      btns = '<button class="btn" data-g="simpens">⏩ Simular pênaltis</button><button class="btn primary big" data-g="pens">🎯 Disputar pênaltis</button>';
    } else if (kind === 'etwin') {
      title = 'Fim da prorrogação';
      note = `<p class="muted" style="margin:10px 0 0">O empate no agregado persistiu e a prorrogação foi simulada: ${G.etGoals ? `${G.etGoals[0]} x ${G.etGoals[1]} nos 30 minutos` : ''}.</p>`;
      btns = '<button class="btn primary big" data-g="finish">Ver resultado</button>';
    } else { title = 'Fim de jogo'; btns = '<button class="btn primary big" data-g="finish">Ver resultado</button>'; }
    hud.pause.innerHTML = `<div class="card"><h2>${title}</h2>${statsHtml()}${note}<div class="row" style="justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap">${btns}</div></div>`;
    hud.pause.hidden = false;
    hud.breakKind = kind;
    hud.pause.onclick = (e) => {
      const t = e.target.closest('button');
      if (!t || !G) return;
      const g = t.dataset.g;
      if (g === 'second') startSecondHalf();
      else if (g === 'subs') { G.subOut = null; renderPause(true, true); }
      else if (g === 'sim') { hideBreak(); simulateRest(); }
      else if (g === 'finish') endGame(false);
      else if (g === 'pens') { hideBreak(); startShootout(); }
      else if (g === 'simpens') { hideBreak(); initShootout(); while (!G.shootout.done) simShootoutKick(); endGame(true); }
    };
  }
  function hideBreak() { if (hud.pause) { hud.pause.hidden = true; hud.pause.innerHTML = ''; } hud.breakKind = null; }
  function resize() {
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(cv.clientWidth * dpr));
    cv.height = Math.max(1, Math.round(cv.clientHeight * dpr));
    if (radar) {
      const land = cv.clientWidth > cv.clientHeight * 1.05;
      radar.style.width = (land ? 112 : 72) + 'px';
      radar.style.height = (land ? 72 : 112) + 'px';
      radar.width = Math.round((land ? 112 : 72) * dpr);
      radar.height = Math.round((land ? 72 : 112) * dpr);
    }
  }
  function press(k, down) {
    if (!G) return;
    const I = G.input;
    if (down && G.state === 'replay') { endReplay(); return; }
    if (down && G.state === 'intro') { G.stateT = 0; return; }
    if (k === 'sprint') I.sprint = down;
    else if (k === 'pass') { if (down) I.pass = true; }
    else if (k === 'lob') { if (down) I.lob = true; }
    else if (k === 'feint' || k === 'spin' || k === 'special') { if (down) I.skill = k; }
    else if (k === 'shoot') {
      if (down) { I.shootDown = true; I.hold = 0; }
      else if (I.shootDown) { I.shootDown = false; I.shoot = true; }
    }
  }
  function onKey(e) {
    if (!G) return;
    const down = e.type === 'keydown';
    const k = (e.key || '').toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(k)) e.preventDefault();
    if (down && (k === 'p' || k === 'escape')) { if (!e.repeat) togglePause(); return; }
    if (G.paused) return;
    if (down && e.repeat) return;
    if (down && (G.state === 'replay' || G.state === 'intro') && ['j', 'k', 'l', ' ', 'enter'].includes(k)) { press('pass', true); return; }
    KEYS[k] = down;
    if (k === 'shift') G.input.sprint = down;
    if (k === 'j' && down) G.input.pass = true;
    if (k === 'l' && down) G.input.lob = true;
    if (k === 'i' && down) G.input.skill = 'feint';
    if (k === 'o' && down) G.input.skill = 'spin';
    if (k === 'u' && down) G.input.skill = 'special';
    if (k === 'k' || k === ' ') press('shoot', down);
  }
  function onBlur() {
    for (const k in KEYS) KEYS[k] = false;
    if (G) { G.input.sprint = false; G.input.shootDown = false; G.input.hold = 0; G.input.jx = 0; G.input.jy = 0; }
  }
  function onVis() { if (document.hidden && G && !G.paused && !G.over) togglePause(); }
  function togglePause() {
    if (!G || G.over || hud.breakKind) return;
    G.paused = !G.paused;
    onBlur();
    if (G.paused) { renderPause(false); hud.pause.hidden = false; if (SFX.ctx) SFX.ctx.suspend().catch(() => {}); }
    else { hud.pause.hidden = true; if (SFX.ctx && SFX.on) SFX.ctx.resume().catch(() => {}); G.last = performance.now(); cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop); }
  }
  function renderPause(subMode, fromBreak) {
    const st = G.st, m = G.m;
    const k = G.userSide;
    let body;
    if (subMode) {
      const side = st.sides[k];
      const bench = side.bench.filter((b) => !side.on.includes(b) && !side.out.includes(b));
      body = `<h2>Substituições <span class="muted" style="font-size:16px">restam ${st.subsLeft[k]}</span></h2>
        <div class="grid g2" style="text-align:left;margin-top:10px"><div class="col" style="gap:4px"><div class="muted up" style="font-size:11px">Sai</div>${side.on.map((pid, i) => { const p = S.players[pid]; return p ? `<button class="bp ${G.subOut === i ? 'sel' : ''}" data-i="${i}">${posBadge(side.slotsOn[i])}<span class="grow">${esc(p.s || p.n)}</span>${ovrBadge(p.o)}${formTag(p)}</button>` : ''; }).join('')}</div>
        <div class="col" style="gap:4px"><div class="muted up" style="font-size:11px">Entra</div>${bench.map((pid) => { const p = S.players[pid]; return p ? `<button class="bp" data-in="${pid}">${posBadge(p.p)}<span class="grow">${esc(p.s || p.n)}</span>${ovrBadge(p.o)}${formTag(p)}</button>` : ''; }).join('') || '<div class="muted">Sem reservas.</div>'}</div></div>
        <div class="row" style="justify-content:center;margin-top:14px"><button class="btn primary" data-g="back">Voltar</button></div>`;
    } else {
      const inShootout = !!G.shootout;
      body = `<h2>Pausa</h2><p class="muted">${esc(teamName(m.h))} ${st.score[0]} x ${st.score[1]} ${esc(teamName(m.a))} · ${inShootout ? 'pênaltis' : clockLabel()}</p>
        <div class="col" style="gap:10px;margin-top:14px"><button class="btn primary big" data-g="resume">▶ Continuar</button>${inShootout ? '' : `<button class="btn" data-g="subs">⇄ Substituições (${st.subsLeft[k]})</button>`}
        <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap"><span class="muted" style="font-size:13px">Câmera</span><div class="seg">${G2_CAMS.map(([v, l]) => `<button class="${(G2PREF.cam || 'normal') === v ? 'on' : ''}" data-cam="${v}">${l}</button>`).join('')}</div></div>
        <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap"><span class="muted" style="font-size:13px">Botões</span><div class="seg">${G2_BTN.map(([v, l]) => `<button class="${(G2PREF.btn || 1) === v ? 'on' : ''}" data-btn="${v}">${l}</button>`).join('')}</div></div>
        <button class="btn" data-g="sim">⏩ ${inShootout ? 'Simular os pênaltis' : 'Simular o resto'}</button></div>`;
    }
    hud.pause.innerHTML = `<div class="card">${body}</div>`;
    hud.pause.hidden = false;
    hud.pause.onclick = (e) => {
      const t = e.target.closest('button');
      if (!t || !G) return;
      if (t.dataset.btn) { G2PREF.btn = +t.dataset.btn; saveG2Pref(); applyBtnSize(document.querySelector('.g2d')); renderPause(false); return; }
      if (t.dataset.cam) { G2PREF.cam = t.dataset.cam; saveG2Pref(); G.camZoom = G2_ZOOM[t.dataset.cam] || 1; renderPause(false); return; }
      if (t.dataset.g === 'resume') togglePause();
      else if (t.dataset.g === 'subs') { G.subOut = null; renderPause(true, fromBreak); }
      else if (t.dataset.g === 'back') { if (fromBreak) showBreak(hud.breakKind || 'half'); else renderPause(false); }
      else if (t.dataset.g === 'sim') { hud.pause.hidden = true; simulateRest(); }
      else if (t.dataset.i !== undefined) { G.subOut = +t.dataset.i; renderPause(true, fromBreak); }
      else if (t.dataset.in !== undefined) {
        if (G.subOut == null) { toast('Escolha primeiro quem sai.', true); return; }
        if (st.subsLeft[k] <= 0) { toast('Sem substituições restantes.', true); return; }
        const idx = G.subOut, inPid = +t.dataset.in;
        doSub(st, k, idx, inPid, G.state === 'halftime' ? 45 : minuteInt());
        const sp = G.players.find((p) => p.side === k && p.slot === idx && !p.out);
        if (sp && S.players[inPid]) applyPlayer(sp, S.players[inPid]);
        G.subOut = null;
        renderPause(true, fromBreak);
      }
    };
  }
  function cleanup() {
    cancelAnimationFrame(rafId);
    removeEventListener('resize', resize);
    removeEventListener('keydown', onKey);
    removeEventListener('keyup', onKey);
    removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVis);
    for (const k in KEYS) KEYS[k] = false;
    sfxClose();
    clearTimeout(hud.popT);
    if (root) root.remove();
    document.body.style.overflow = '';
    root = null; cv = null; ctx = null; radar = null; rctx = null; TEX = null;
    hud.breakKind = null; hud.intro = null;
  }
  function loop(now) {
    if (!G || G.paused) return;
    const dt = Math.min(0.05, Math.max(0, (now - G.last) / 1000)) * (G.slow || 1); // G.slow: slow motion for the browser tests
    G.last = now;
    if (!G.over) {
      const n = Math.max(1, Math.ceil(dt / (1 / 60)));
      for (let i = 0; i < n && G && !G.over; i++) step(dt / n);
    }
    if (!G || !cv) return;
    draw();
    G.radarT = (G.radarT || 0) + 1;
    if (G.radarT % 2 === 0) drawRadar();
    updateHud(false);
    rafId = requestAnimationFrame(loop);
  }
  function updateHud(force) {
    if (!root || !G) return;
    const cl = G.state === 'halftime' ? 'INT' : G.shootout ? 'PÊN' : G.st.decided ? 'PRO' : G.state === 'fulltime' ? 'FIM' : clockLabel();
    if (cl !== hud.lastClock || force) { hud.clock.textContent = cl; hud.lastClock = cl; }
    if (hud.skp === undefined) hud.skp = root.querySelectorAll('.skpads .pad');
    const cs = G.ctrl && G.ctrl.stars || 1;
    if (cs !== hud.lastStars || force) { hud.lastStars = cs; hud.skp.forEach((b) => b.classList.toggle('lock', cs < (SKILL_NEED[b.dataset.k] || 1))); }
    const s = G.st.score;
    const key = s[0] + ':' + s[1];
    if (key !== hud.lastScore || force) { hud.h.textContent = s[0]; hud.a.textContent = s[1]; hud.lastScore = key; }
  }

  // ------------------------------------------------------------------ rendering
  let T = null, SC = 10, TEX = null;
  const TS = 12; // stadium texture pixels per metre
  const EX = 22; // texture margin around the pitch, metres
  const SPONSORS = ['ULTRA ESPORTE', 'ULTRA MANAGER', 'CAFÉ DA VÁRZEA', 'GUARANÁ GOLAÇO', 'PNEUS RODA VIVA', 'BANCO DO TORCEDOR', 'SUCO DO MEIO-CAMPO', 'TINTAS TRAVESSÃO'];
  function buildTexture() {
    const wM = PW + EX * 2, hM = PL + EX * 2;
    const c = document.createElement('canvas');
    c.width = Math.round(wM * TS); c.height = Math.round(hM * TS);
    const g = c.getContext('2d');
    g.setTransform(TS, 0, 0, TS, EX * TS, EX * TS);
    const night = G.weather.night, wet = G.weather.kind === 'rain', snow = G.weather.kind === 'snow';
    g.fillStyle = night ? '#141a20' : '#2a3036';
    g.fillRect(-EX, -EX, wM, hM);
    const home = S.teams[G.m.h], away = S.teams[G.m.a];
    const crowdCols = [home.c1, home.c1, home.c2 || '#ffffff', home.c1, '#f1f1f1', '#2b2b2b', away.c1, '#e9c9a8', '#7a5a42', home.c2 || '#dddddd'];
    let seed = hashStr(String(G.m.id));
    const rnd2 = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const stand = (x0, y0, x1, y1) => {
      g.fillStyle = night ? '#1d242b' : '#3a424a';
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let y = y0 + 0.5; y < y1; y += 0.95) {
        for (let x = x0 + 0.5; x < x1; x += 0.8) {
          if (rnd2() < 0.1) continue;
          g.fillStyle = crowdCols[Math.floor(rnd2() * crowdCols.length)];
          g.beginPath(); g.arc(x + (rnd2() - 0.5) * 0.25, y + (rnd2() - 0.5) * 0.2, 0.3, 0, Math.PI * 2); g.fill();
        }
      }
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = y0; y < y1; y += 1.9) g.fillRect(x0, y, x1 - x0, 0.12);
    };
    stand(-EX, -EX, PW + EX, -7.5);
    stand(-EX, PL + 7.5, PW + EX, PL + EX);
    stand(-EX, -7.5, -7.5, PL + 7.5);
    stand(PW + 7.5, -7.5, PW + EX, PL + 7.5);
    // grass with mowing stripes, a light checker and a little wear
    const g1 = snow ? '#a9c0a5' : wet ? '#4f8a2c' : '#5c9532', g2 = snow ? '#b5cbb1' : wet ? '#589532' : '#68a03a';
    g.fillStyle = shade(g1, -0.12);
    g.fillRect(-7.5, -7.5, PW + 15, PL + 15);
    const stripe = PL / 18;
    for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? g2 : g1; g.fillRect(-3, i * stripe, PW + 6, stripe + 0.02); }
    g.fillStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i < 9; i++) if (i % 2) g.fillRect(i * (PW / 9), -3, PW / 9, PL + 6);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + rnd2() * 0.04})`; g.fillRect(rnd2() * PW, rnd2() * PL, 0.3 + rnd2() * 1.2, 0.2); }
    for (const gy of [0, PL]) { const gr = g.createRadialGradient(PW / 2, gy, 0.5, PW / 2, gy, 7); gr.addColorStop(0, 'rgba(120,90,50,0.28)'); gr.addColorStop(1, 'rgba(120,90,50,0)'); g.fillStyle = gr; g.fillRect(PW / 2 - 8, gy - 8, 16, 16); }
    // advertising boards (fictional sponsors)
    const board = (x, y, w, h, vertical, idx) => {
      const cols = [['#0f2b5b', '#ffffff'], ['#b8141e', '#ffffff'], ['#f2c230', '#1b1b1b'], ['#0f7a43', '#ffffff'], ['#1b1b1b', '#ffd34d']][idx % 5];
      g.fillStyle = cols[0]; g.fillRect(x, y, w, h);
      g.save();
      g.setTransform(1, 0, 0, 1, (x + w / 2 + EX) * TS, (y + h / 2 + EX) * TS);
      if (vertical) g.rotate(-Math.PI / 2);
      g.fillStyle = cols[1];
      g.font = `800 ${Math.round(0.7 * TS)}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(SPONSORS[idx % SPONSORS.length], 0, 1);
      g.restore();
    };
    let bi = hashStr(String(G.m.h)) % SPONSORS.length;
    for (let x = -4; x < PW + 4; x += 9) { board(x, -4.9, 8.8, 0.95, false, bi++); board(x, PL + 3.95, 8.8, 0.95, false, bi++); }
    for (let y = 0; y < PL; y += 10.5) { board(-4.9, y, 0.95, 10.3, true, bi++); board(PW + 3.95, y, 0.95, 10.3, true, bi++); }
    // dugouts on the left touchline
    for (const y of [PL / 2 - 12, PL / 2 + 5]) { g.fillStyle = '#20262c'; g.fillRect(-4.2, y, 2.6, 7); g.fillStyle = 'rgba(160,200,230,0.35)'; g.fillRect(-4.0, y + 0.2, 2.2, 6.6); }
    TEX = c;
  }
  function view() {
    const W = cv.width, H = cv.height;
    G.landscape = W > H * 1.05;
    SC = (G.landscape ? Math.min(W / 50, H / 30) : Math.min(W / 24, H / 44)) * (G.camZoom || 1);
    const visX = (G.landscape ? H : W) / SC, visY = (G.landscape ? W : H) / SC;
    const my = G.pk || G.shootout ? 22 : 10; // penalties show more of the stand behind the goal
    const cx = visX >= PW + 6 ? PW / 2 : clamp(G.cam.x, visX / 2 - 9, PW - visX / 2 + 9);
    const cy = visY >= PL + 10 ? PL / 2 : clamp(G.cam.y, visY / 2 - my, PL - visY / 2 + my);
    const sh = G.shake > 0 ? G.shake * SC * 0.25 : 0;
    const jx = sh ? (Math.random() - 0.5) * sh : 0, jy = sh ? (Math.random() - 0.5) * sh : 0;
    T = G.landscape ? { a: 0, b: SC, c: -SC, d: 0, e: W / 2 + cy * SC + jx, f: H / 2 - cx * SC + jy } : { a: SC, b: 0, c: 0, d: SC, e: W / 2 - cx * SC + jx, f: H / 2 - cy * SC + jy };
    return { W, H };
  }
  const PX = (x, y) => T.a * x + T.c * y + T.e;
  const PY = (x, y) => T.b * x + T.d * y + T.f;
  function sdir(dx, dy) { return G.landscape ? { x: -dy, y: dx } : { x: dx, y: dy }; }
  function draw() {
    if (!TEX) buildTexture();
    const { W, H } = view();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1c2228';
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(T.a, T.b, T.c, T.d, T.e, T.f);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(TEX, -EX, -EX, PW + EX * 2, PL + EX * 2);
    // pitch markings
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 0.13;
    ctx.strokeRect(0, 0, PW, PL);
    ctx.beginPath(); ctx.moveTo(0, PL / 2); ctx.lineTo(PW, PL / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(PW / 2, PL / 2, 9.15, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(PW / 2, PL / 2, 0.22, 0, Math.PI * 2); ctx.fill();
    for (const top of [true, false]) {
      const y0 = top ? 0 : PL - BOX_D, y6 = top ? 0 : PL - 5.5, spot = top ? 11 : PL - 11;
      ctx.strokeRect(PW / 2 - BOX_W / 2, y0, BOX_W, BOX_D);
      ctx.strokeRect(PW / 2 - 9.16, y6, 18.32, 5.5);
      ctx.beginPath(); ctx.arc(PW / 2, spot, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      if (top) ctx.arc(PW / 2, spot, 9.15, 0.6435, Math.PI - 0.6435); else ctx.arc(PW / 2, spot, 9.15, Math.PI + 0.6435, 2 * Math.PI - 0.6435);
      ctx.stroke();
    }
    [[0, 0, 0, Math.PI / 2], [PW, 0, Math.PI / 2, Math.PI], [0, PL, 1.5 * Math.PI, 2 * Math.PI], [PW, PL, Math.PI, 1.5 * Math.PI]].forEach(([x, y, a0, a1]) => { ctx.beginPath(); ctx.arc(x, y, 1, a0, a1); ctx.stroke(); });
    for (const [x, y] of [[0, 0], [PW, 0], [0, PL], [PW, PL]]) { ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(x, y, 0.28, 0, Math.PI * 2); ctx.fill(); }
    // goals: the net bulges where the ball went in
    for (const top of [true, false]) {
      const x0 = PW / 2 - GOAL_W / 2, gl = top ? 0 : PL, s = top ? -1 : 1;
      const bulge = G.net && G.net.top === top ? G.net.t : 0;
      const bx = G.net && G.net.top === top ? G.net.x : PW / 2;
      const backY = (x) => gl + s * (2 + bulge * 1.1 * Math.max(0, 1 - Math.abs(x - bx) / 2.6));
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath(); ctx.moveTo(x0, gl);
      for (let i = 0; i <= 14; i++) { const x = x0 + GOAL_W * i / 14; ctx.lineTo(x, backY(x)); }
      ctx.lineTo(x0 + GOAL_W, gl); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = 0.05;
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) { const x = x0 + GOAL_W * i / 14; ctx.moveTo(x, gl); ctx.lineTo(x, backY(x)); }
      for (let j = 1; j <= 4; j++) { ctx.moveTo(x0, gl + (backY(x0) - gl) * j / 4); for (let i = 1; i <= 14; i++) { const x = x0 + GOAL_W * i / 14; ctx.lineTo(x, gl + (backY(x) - gl) * j / 4); } }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.3;
      ctx.beginPath(); ctx.moveTo(x0 + 0.15, gl + s * 0.18); ctx.lineTo(x0 + GOAL_W + 0.15, gl + s * 0.18); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.24;
      ctx.beginPath(); ctx.moveTo(x0, gl); ctx.lineTo(x0 + GOAL_W, gl); ctx.stroke();
      ctx.lineWidth = 0.12;
      ctx.beginPath(); ctx.moveTo(x0, gl); ctx.lineTo(x0, backY(x0)); ctx.lineTo(x0 + GOAL_W, backY(x0 + GOAL_W)); ctx.lineTo(x0 + GOAL_W, gl); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x0, gl, 0.16, 0, Math.PI * 2); ctx.arc(x0 + GOAL_W, gl, 0.16, 0, Math.PI * 2); ctx.fill();
    }
    for (const f of G.fx) if (f.kind === 'grass') { ctx.fillStyle = f.color; ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillRect(f.x - 0.06, f.y - 0.06 - f.z * 0.4, 0.14, 0.14); }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const s = SC;
    const b = G.ball;
    const replaying = G.state === 'replay';
    // controlled player ring, pass preview and the target of a pass in flight
    if (!G.auto && G.ctrl && !G.ctrl.out && !G.pk && !replaying && !G.shootout) {
      const X = PX(G.ctrl.x, G.ctrl.y), Y = PY(G.ctrl.x, G.ctrl.y);
      ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.beginPath(); ctx.ellipse(X, Y + s * 0.05, s * 0.75, s * 0.36, 0, 0, Math.PI * 2); ctx.stroke();
      if (G.preview && !G.preview.out && b.owner === G.ctrl) {
        const q = G.preview, QX = PX(q.x, q.y), QY = PY(q.x, q.y);
        ctx.setLineDash([s * 0.25, s * 0.2]);
        ctx.strokeStyle = 'rgba(255,225,77,0.8)'; ctx.lineWidth = Math.max(1.5, s * 0.07);
        ctx.beginPath(); ctx.ellipse(QX, QY + s * 0.05, s * 0.62, s * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (b.target && !b.owner && b.target.team === 0 && !G.auto && !replaying) {
      const X = PX(b.target.x, b.target.y), Y = PY(b.target.x, b.target.y);
      ctx.strokeStyle = 'rgba(255,225,77,0.55)'; ctx.lineWidth = Math.max(1.5, s * 0.07);
      ctx.beginPath(); ctx.ellipse(X, Y + s * 0.05, s * 0.6, s * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // ball trail on hard shots
    const bsp = Math.hypot(b.vx, b.vy);
    if (!b.owner && bsp > 16 && !replaying) {
      const n = nrm(b.vx, b.vy);
      const X = PX(b.x, b.y), Y = PY(b.x, b.y) - b.z * s * 0.6 - s * 0.27;
      const X2 = PX(b.x - n.x * 2.2, b.y - n.y * 2.2), Y2 = PY(b.x - n.x * 2.2, b.y - n.y * 2.2) - b.z * s * 0.6 - s * 0.27;
      const grd = ctx.createLinearGradient(X, Y, X2, Y2);
      grd.addColorStop(0, 'rgba(255,255,255,0.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grd; ctx.lineWidth = s * 0.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X2, Y2); ctx.stroke();
      ctx.lineCap = 'butt';
    }
    const items = [];
    for (const p of G.players) {
      const outNow = replaying ? p.rOut : p.out;
      if (!outNow || (G.state === 'ufo' && G.ufo && G.ufo.vic === p)) items.push({ y: PY(p.x, p.y), p });
    }
    items.sort((u, v) => u.y - v.y);
    for (const it of items) drawPlayer(it.p, PX(it.p.x, it.p.y), it.y, s);
    // the ball is always drawn last: with these tall cartoon players it would otherwise vanish behind the carrier
    drawBall(s);
    // shot power and sprint stamina of the controlled player
    if (!G.auto && G.ctrl && !G.pk && !replaying && !G.shootout) {
      const c = G.ctrl, X = PX(c.x, c.y) - s * 1.1;
      let Y = PY(c.x, c.y) + s * 0.55;
      if (G.input.shootDown && b.owner === c) {
        const pw = clamp(0.3 + G.input.hold * 0.7, 0.3, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(X, Y, s * 2.2, s * 0.32);
        ctx.fillStyle = pw > 0.88 ? '#ff5d5d' : '#ffe14d'; ctx.fillRect(X, Y, s * 2.2 * pw, s * 0.32);
        Y += s * 0.42;
      }
      if (c.sta < 0.98) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X, Y, s * 2.2, s * 0.16);
        ctx.fillStyle = c.sta < 0.2 ? '#ff6060' : '#4cc3ff'; ctx.fillRect(X, Y, s * 2.2 * c.sta, s * 0.16);
      }
    }
    // penalty: aim reticle and power bar, or the corner picked for the user's keeper
    if (G.pk && (G.pk.phase === 'aim' || G.pk.phase === 'runup')) {
      const k = G.pk;
      const ax = PW / 2 + k.dirX * (k.phase === 'runup' ? k.ka : k.aim) * (GOAL_W / 2 - 0.25);
      const X = PX(ax, k.gy), Y = PY(ax, k.gy);
      const pw = clamp(k.phase === 'runup' ? k.kp : k.power, 0, 1.08);
      const col = pw > 0.95 ? '#ff5d5d' : '#ffe14d';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = Math.max(4, s * 0.18);
      ctx.beginPath(); ctx.arc(X, Y, s * (0.6 + pw * 0.3), 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * 0.1);
      ctx.beginPath(); ctx.arc(X, Y, s * (0.6 + pw * 0.3), 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X - s * 0.9, Y); ctx.lineTo(X + s * 0.9, Y); ctx.moveTo(X, Y - s * 0.9); ctx.lineTo(X, Y + s * 0.9); ctx.stroke();
      const tk = k.taker;
      const bx = PX(tk.x, tk.y) - s * 1.1, by = PY(tk.x, tk.y) + s * 0.55;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, s * 2.2, s * 0.32);
      ctx.fillStyle = col; ctx.fillRect(bx, by, s * 2.2 * Math.min(1, pw), s * 0.32);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(bx + s * 2.2 * 0.88, by, Math.max(1, s * 0.05), s * 0.32);
    }
    if (!G.auto && !replaying && G.restartHold && G.setKind === 'corner' && G.restartTeam === 0 && b.owner && b.owner.team === 0 && G.restartSpot) {
      const Z = cornerZones(G.restartSpot.x, G.restartSpot.y);
      for (const k of ['near', 'six', 'far', 'spot']) {
        const z = Z[k], X = PX(z.x, z.y), Y = PY(z.x, z.y), on = (G.cornerAim || 'six') === k;
        ctx.fillStyle = on ? 'rgba(255,225,77,0.32)' : 'rgba(255,255,255,0.1)';
        ctx.strokeStyle = on ? '#ffe14d' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = Math.max(1.5, s * (on ? 0.11 : 0.05));
        ctx.setLineDash(on ? [] : [s * 0.2, s * 0.16]);
        ctx.beginPath(); ctx.ellipse(X, Y, s * (k === 'spot' ? 0.8 : 1.15), s * (k === 'spot' ? 0.4 : 0.58), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]);
        if (on) {
          ctx.font = `700 ${Math.round(s * 0.42)}px "Barlow", "Arial", sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.lineWidth = Math.max(2, s * 0.1); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(z.name, X, Y - s * 0.65);
          ctx.fillStyle = '#ffe14d'; ctx.fillText(z.name, X, Y - s * 0.65);
        }
      }
    }
    if (G.pk && G.pk.phase === 'dive' && G.pk.gk) {
      const k = G.pk;
      for (const o of [-1, 0, 1]) {
        const wx = PW / 2 + k.dirX * o * 2.5, X = PX(wx, k.gy - k.fwd * 0.2), Y = PY(wx, k.gy - k.fwd * 0.2);
        const on = k.dive === o;
        ctx.fillStyle = on ? 'rgba(255,225,77,0.45)' : 'rgba(255,255,255,0.12)';
        ctx.strokeStyle = on ? '#ffe14d' : 'rgba(255,255,255,0.55)';
        ctx.lineWidth = Math.max(2, s * (on ? 0.12 : 0.06));
        ctx.beginPath(); ctx.arc(X, Y, s * 0.85, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    if (G.state === 'ufo' && G.ufo && G.ufo.vic) drawUfo(s);
    // weather, night, goal flash, replay letterbox, confetti
    if (G.drops) {
      if (G.weather.kind === 'rain') {
        ctx.strokeStyle = 'rgba(210,225,255,0.38)'; ctx.lineWidth = Math.max(1, s * 0.05);
        ctx.beginPath();
        for (const d of G.drops) {
          d.y += 0.022 * d.s; d.x += 0.004 * d.s;
          if (d.y > 1) { d.y = 0; d.x = Math.random(); }
          if (d.x > 1) d.x = 0;
          const x = d.x * W, y = d.y * H;
          ctx.moveTo(x, y); ctx.lineTo(x + s * 0.25, y + s * 0.9);
        }
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (const d of G.drops) {
          d.y += 0.004 * d.s; d.x += Math.sin((d.y + d.s) * 12) * 0.0015;
          if (d.y > 1) { d.y = 0; d.x = Math.random(); }
          ctx.beginPath(); ctx.arc(d.x * W, d.y * H, Math.max(1.5, s * 0.09 * d.s), 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (G.weather.night) {
      const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      gr.addColorStop(0, 'rgba(0,0,20,0)'); gr.addColorStop(1, 'rgba(0,0,20,0.38)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    }
    if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
    if (replaying) {
      const bar = H * 0.08;
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    }
    for (const f of G.fx) {
      if (f.kind !== 'conf') continue;
      ctx.save(); ctx.translate(f.sx * W, f.sy * H); ctx.rotate(f.a);
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.fillStyle = f.color; ctx.fillRect(-s * 0.25, -s * 0.1, s * 0.5, s * 0.2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function drawBall(s) {
    const b = G.ball;
    const X = PX(b.x, b.y), Y = PY(b.x, b.y);
    const r = s * 0.27;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(X + b.z * s * 0.22, Y + s * 0.06 + b.z * s * 0.1, r * 1.05, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    const by = Y - r - b.z * s * 0.6;
    const br = r * (1 + b.z * 0.035);
    const g = ctx.createRadialGradient(X - br * 0.35, by - br * 0.35, br * 0.1, X, by, br);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#e3e8eb'); g.addColorStop(1, '#a9b3b9');
    ctx.fillStyle = g; ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.beginPath(); ctx.arc(X, by, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b1b1b';
    for (let i = 0; i < 3; i++) { const t = b.spin + i * 2.1; ctx.beginPath(); ctx.arc(X + Math.cos(t) * br * 0.45, by + Math.sin(t) * br * 0.45, br * 0.24, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(X - br * 0.35, by - br * 0.4, br * 0.22, br * 0.13, -0.6, 0, Math.PI * 2); ctx.fill();
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawPlayer(p, X, Y, s) {
    const kit = p.gk ? G.gkKits[p.side] : G.kits[p.side];
    const rp = G.state === 'replay';
    const sliding = rp ? p.rSlide : p.slide > 0;
    const fallen = rp ? p.rFall : p.fall > 0;
    const kicking = rp ? p.rKick : p.kickT > 0;
    const diving = rp ? p.rDive : p.diveT > 0;
    let lift = 0, alpha = 1;
    if (G.state === 'ufo' && G.ufo && G.ufo.vic === p) { lift = Math.max(0, G.ufo.t - 0.6) * s * 3.2; alpha = clamp(1 - (G.ufo.t - 1.1) / 0.6, 0, 1); if (alpha <= 0) return; }
    ctx.globalAlpha = alpha;
    const ol = 'rgba(0,0,0,0.38)', lw = Math.max(1, s * 0.055);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(X + s * 0.12, Y + s * 0.06, s * 0.55, s * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(X + s * 0.04, Y + s * 0.02, s * 0.3, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    Y -= lift;
    let hdx = p.dx, hdy = p.dy;
    if (!rp && p.sk && p.sk.kind === 'spin') { const a = Math.atan2(p.sk.dy, p.sk.dx) + (1 - p.sk.t / p.sk.T) * Math.PI * 2; hdx = Math.cos(a); hdy = Math.sin(a); }
    const sd = sdir(hdx, hdy);
    // goalkeeper in the air or on the ground after a dive: stretched out, gloves first
    if (diving && p.gk && !lift) {
      const gz = rp ? p.rGz || 0 : p.gz || 0;
      const dd = sdir(p.diveDir || 1, 0);
      ctx.save(); ctx.translate(X, Y - s * 0.32 - gz * s * 0.6); ctx.rotate(Math.atan2(dd.y, dd.x) + Math.PI / 2);
      ctx.fillStyle = kit.socks; ctx.fillRect(-s * 0.3, s * 0.38, s * 0.18, s * 0.55); ctx.fillRect(s * 0.12, s * 0.3, s * 0.18, s * 0.55);
      ctx.fillStyle = '#151515'; ctx.fillRect(-s * 0.32, s * 0.9, s * 0.22, s * 0.12); ctx.fillRect(s * 0.1, s * 0.82, s * 0.22, s * 0.12);
      ctx.fillStyle = kit.shorts; rr(-s * 0.36, s * 0.08, s * 0.72, s * 0.34, s * 0.08); ctx.fill();
      ctx.fillStyle = kit.shirt;
      rr(-s * 0.36, -s * 1.55, s * 0.17, s * 1.05, s * 0.07); ctx.fill();
      rr(s * 0.19, -s * 1.55, s * 0.17, s * 1.05, s * 0.07); ctx.fill();
      rr(-s * 0.4, -s * 0.58, s * 0.8, s * 0.72, s * 0.18); ctx.fill(); ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, -s * 0.86, s * 0.38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(0, -s * 0.92, s * 0.36, Math.PI, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.arc(-s * 0.27, -s * 1.62, s * 0.17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(s * 0.27, -s * 1.62, s * 0.17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1;
      return;
    }
    if ((sliding || fallen) && !lift) {
      const ang = Math.atan2(sd.y, sd.x) - Math.PI / 2;
      ctx.save(); ctx.translate(X, Y - s * 0.3); ctx.rotate(ang);
      ctx.fillStyle = kit.socks; ctx.fillRect(-s * 0.3, s * 0.35, s * 0.18, s * 0.55); ctx.fillRect(s * 0.12, s * 0.35, s * 0.18, s * 0.55);
      ctx.fillStyle = kit.shorts; rr(-s * 0.36, s * 0.1, s * 0.72, s * 0.32, s * 0.08); ctx.fill();
      ctx.fillStyle = kit.shirt; rr(-s * 0.4, -s * 0.55, s * 0.8, s * 0.7, s * 0.18); ctx.fill(); ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
      if (p.gk) { ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.arc(-s * 0.5, -s * 1.05, s * 0.16, 0, Math.PI * 2); ctx.arc(s * 0.5, -s * 1.05, s * 0.16, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, -s * 0.85, s * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(0, -s * 0.9, s * 0.38, Math.PI, 2 * Math.PI); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
      return;
    }
    const spd = Math.hypot(p.vx, p.vy);
    const moving = spd > 0.5;
    const run = clamp(spd / 6, 0, 1.25); // 0 standing .. 1 sprint
    const tt = p.anim * 3.2;
    const sk = !rp && p.sk ? p.sk : null;
    const skP = sk ? 1 - sk.t / sk.T : 0; // progress of a dribble move
    const spin = sk && sk.kind === 'spin';
    const feint = sk && (sk.kind === 'feint' || sk.kind === 'nutmeg' || sk.kind === 'elastico');
    const rainbow = sk && sk.kind === 'rainbow';
    const celebrating = G.state === 'goal' && G.celebr && p.team === G.celebr.scorer.team && !p.gk;
    const q = kicking ? (rp ? 0.45 : clamp(1 - p.kickT / 0.25, 0, 1)) : 0; // progress of the kick
    // kick leg: back-swing, strike, follow-through (positive = forward)
    const kr = !kicking ? 0 : q < 0.3 ? -(q / 0.3) * 0.8 : q < 0.6 ? -0.8 + ((q - 0.3) / 0.3) * 2.2 : 1.4 - ((q - 0.6) / 0.4) * 0.9;
    const bob = moving ? Math.abs(Math.sin(tt)) * s * 0.06 * run : Math.sin(G.time * 2 + (p.num || 0)) * s * 0.012;
    const jump = spin ? Math.sin(skP * Math.PI) * s * 0.14 : rainbow ? Math.sin(skP * Math.PI) * s * 0.24 : 0;
    let lean = sd.x * s * 0.1 * run + (kicking ? sd.x * s * 0.06 * Math.max(0, kr) : 0);
    if (feint) {
      const cur = sk.dx2 !== undefined && sk.t < sk.T * 0.5 ? [sk.dx2, sk.dy2] : [sk.dx, sk.dy];
      const bd = sdir(cur[0], cur[1]);
      lean += bd.x * s * 0.22 * (skP < 0.35 ? -0.7 * (skP / 0.35) : -0.7 + 1.7 * ((skP - 0.35) / 0.65));
    }
    ctx.save();
    if (spin) { const ca = Math.abs(Math.cos(skP * Math.PI * 2 + Math.atan2(sk.dy, sk.dx))); ctx.translate(X, Y); ctx.scale(0.62 + 0.38 * ca, 1); ctx.translate(-X, -Y); }
    const hipY = Y - s * 0.68 - jump;
    const lw2 = Math.max(1, s * 0.03);
    // a leg: thigh (skin), shin (sock with a band) and boot; swings with the run cycle, kicks, or circles over the ball
    const leg = (hx, phase, kickLeg, footLeg) => {
      const st = moving ? Math.sin(tt + phase) : 0;
      const lf = moving ? Math.max(0, Math.cos(tt + phase)) : 0;
      let fx = hx + sd.x * s * 0.32 * st * run, fy = Y - jump - lf * s * 0.17 * run + sd.y * s * 0.1 * st * run;
      let kneeF = 0.1 + lf * 0.12;
      if (kickLeg && kicking) { fx = hx + sd.x * s * 0.55 * kr; fy = Y - jump - s * 0.05 - Math.max(0, kr) * s * 0.15 + sd.y * s * 0.2 * kr; kneeF = 0.16; }
      else if (rainbow && footLeg) { fx = hx + sd.x * s * 0.35; fy = Y - jump - Math.sin(skP * Math.PI) * s * 0.28; kneeF = 0.22; }
      else if (feint && footLeg) { // step-over: the foot circles over the ball
        const a = skP * Math.PI * 2.4;
        fx = hx + sd.x * s * 0.3 + Math.cos(a) * s * 0.42; fy = Y - jump - Math.max(0, Math.sin(a)) * s * 0.3; kneeF = 0.2;
      } else if (!moving && !kicking) fx += (hx < X ? -1 : 1) * s * 0.03;
      const kx = (hx + lean * 0.4 + fx) / 2 + sd.x * s * kneeF, ky = (hipY + fy) / 2 - s * 0.03 * (1 + lf);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = p.skin; ctx.lineWidth = s * 0.2;
      ctx.beginPath(); ctx.moveTo(hx + lean * 0.4, hipY); ctx.lineTo(kx, ky); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = s * 0.06;
      ctx.beginPath(); ctx.moveTo(hx + lean * 0.4 - s * 0.05, hipY); ctx.lineTo(kx - s * 0.05, ky); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = s * 0.05;
      ctx.beginPath(); ctx.moveTo(hx + lean * 0.4 + s * 0.07, hipY); ctx.lineTo(kx + s * 0.07, ky); ctx.stroke();
      ctx.strokeStyle = kit.socks; ctx.lineWidth = s * 0.19;
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy - s * 0.1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = s * 0.055;
      ctx.beginPath(); ctx.moveTo(kx - s * 0.05, ky); ctx.lineTo(fx - s * 0.05, fy - s * 0.1); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = s * 0.05;
      ctx.beginPath(); ctx.moveTo(kx + s * 0.07, ky); ctx.lineTo(fx + s * 0.07, fy - s * 0.1); ctx.stroke();
      ctx.strokeStyle = kit.trim; ctx.lineWidth = s * 0.19;
      const bx = kx + (fx - kx) * 0.3, by = ky + (fy - s * 0.1 - ky) * 0.3;
      ctx.beginPath(); ctx.moveTo(bx - s * 0.005, by); ctx.lineTo(bx + (fx - kx) * 0.12, by + (fy - s * 0.1 - ky) * 0.12); ctx.stroke();
      // boot, pointing the way he is heading
      ctx.fillStyle = '#16181a';
      ctx.beginPath(); ctx.ellipse(fx + sd.x * s * 0.07, fy - s * 0.04, s * 0.15 + Math.abs(sd.x) * s * 0.05, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(fx + sd.x * s * 0.09, fy - s * 0.07, s * 0.07, s * 0.025, 0, 0, Math.PI * 2); ctx.fill();
    };
    const legs = [[X - s * 0.17, 0, false, false], [X + s * 0.17, Math.PI, true, true]];
    if (sd.y < 0) legs.reverse();
    for (const l of legs) leg(l[0], l[1], l[2], l[3]);
    ctx.lineCap = 'butt';
    // shorts with a side stripe
    ctx.fillStyle = kit.shorts;
    rr(X - s * 0.38 + lean * 0.4, hipY - s * 0.2, s * 0.76, s * 0.4, s * 0.1); ctx.fill();
    ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
    const sg = ctx.createLinearGradient(X - s * 0.38, 0, X + s * 0.38, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0.18)'); sg.addColorStop(0.5, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.26)');
    ctx.fillStyle = sg; rr(X - s * 0.38 + lean * 0.4, hipY - s * 0.2, s * 0.76, s * 0.4, s * 0.1); ctx.fill();
    ctx.fillStyle = kit.trim;
    ctx.fillRect(X - s * 0.38 + lean * 0.4, hipY - s * 0.04, s * 0.05, s * 0.2);
    ctx.fillRect(X + s * 0.33 + lean * 0.4, hipY - s * 0.04, s * 0.05, s * 0.2);
    // torso (leans into the run) with shoulders and a collar
    const tx = X + lean * 0.7, ty = Y - s * 1.46 - jump - bob;
    ctx.fillStyle = kit.shirt;
    rr(tx - s * 0.42, ty, s * 0.84, s * 0.78, s * 0.22); ctx.fill();
    // cylinder-like shading: lit from the upper left, darker on the right and at the waist
    const tg = ctx.createLinearGradient(tx - s * 0.42, 0, tx + s * 0.42, 0);
    tg.addColorStop(0, 'rgba(255,255,255,0.24)'); tg.addColorStop(0.35, 'rgba(255,255,255,0.04)'); tg.addColorStop(0.65, 'rgba(0,0,0,0.04)'); tg.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = tg; rr(tx - s * 0.42, ty, s * 0.84, s * 0.78, s * 0.22); ctx.fill();
    const tv = ctx.createLinearGradient(0, ty, 0, ty + s * 0.78);
    tv.addColorStop(0, 'rgba(255,255,255,0.1)'); tv.addColorStop(0.6, 'rgba(0,0,0,0)'); tv.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = tv; rr(tx - s * 0.42, ty, s * 0.84, s * 0.78, s * 0.22); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = Math.max(1, s * 0.03); // fabric folds
    ctx.beginPath(); ctx.moveTo(tx - s * 0.18, ty + s * 0.5); ctx.quadraticCurveTo(tx - s * 0.05, ty + s * 0.58, tx + s * 0.14, ty + s * 0.52); ctx.stroke();
    ctx.strokeStyle = ol; ctx.lineWidth = lw;
    rr(tx - s * 0.42, ty, s * 0.84, s * 0.78, s * 0.22); ctx.stroke();
    // arms swing against the legs; sleeves, forearms and hands
    const arm = (sx, phase) => {
      const shx = tx + sx * s * 0.42, shy = ty + s * 0.14;
      const st = moving ? Math.sin(tt + phase) : 0;
      let hx = shx + sx * s * 0.1 + sd.x * s * 0.22 * st * run, hy2 = shy + s * 0.58 - Math.max(0, st) * s * 0.18 * run;
      let ex = shx + sx * s * 0.16 + sd.x * s * 0.1 * st * run, ey = shy + s * 0.3;
      if (celebrating) { hx = shx + sx * s * 0.2; hy2 = shy - s * 0.5; ex = shx + sx * s * 0.2; ey = shy - s * 0.2; }
      else if (p.gk && !moving) { hx = shx + sx * s * 0.3; hy2 = shy + s * 0.34; ex = shx + sx * s * 0.2; ey = shy + s * 0.22; }
      else if (kicking) { hx = shx + sx * s * 0.34 - sd.x * s * 0.15 * kr; hy2 = shy + s * 0.4; ex = shx + sx * s * 0.28; ey = shy + s * 0.22; }
      else if (feint) { hx = shx + sx * s * 0.36; hy2 = shy + s * 0.44; ex = shx + sx * s * 0.26; ey = shy + s * 0.22; }
      ctx.lineCap = 'round';
      ctx.strokeStyle = p.skin; ctx.lineWidth = s * 0.13;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy2); ctx.stroke();
      ctx.strokeStyle = kit.shirt; ctx.lineWidth = s * 0.2;
      ctx.beginPath(); ctx.moveTo(shx, shy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = kit.trim; ctx.lineWidth = s * 0.2;
      ctx.beginPath(); ctx.moveTo(ex - (ex - shx) * 0.12, ey - (ey - shy) * 0.12); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = p.gk ? '#f2f2f2' : p.skin;
      ctx.beginPath(); ctx.arc(hx, hy2, s * (p.gk ? 0.13 : 0.1), 0, Math.PI * 2); ctx.fill();
      ctx.lineCap = 'butt';
    };
    arm(-1, Math.PI); arm(1, 0);
    if (sd.y < -0.35) {
      ctx.fillStyle = lum(kit.shirt) > 0.6 ? '#111111' : kit.trim && cdist(kit.trim, kit.shirt) > 90 ? kit.trim : '#ffffff';
      ctx.font = `800 ${Math.round(s * 0.42)}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(p.num), tx, ty + s * 0.4);
    } else {
      ctx.fillStyle = kit.trim;
      ctx.beginPath(); ctx.moveTo(tx - s * 0.18, ty); ctx.lineTo(tx + s * 0.18, ty); ctx.lineTo(tx, ty + s * 0.2); ctx.closePath(); ctx.fill();
    }
    // neck and head (big, cartoon) that follows the lean
    const hx0 = X + lean * 1.1;
    ctx.fillStyle = p.skin;
    ctx.fillRect(hx0 - s * 0.1, ty - s * 0.12, s * 0.2, s * 0.2);
    const hy = Y - s * 1.9 - jump - bob * 1.2;
    ctx.fillStyle = p.skin;
    ctx.beginPath(); ctx.arc(hx0, hy, s * 0.44, 0, Math.PI * 2); ctx.fill();
    const hg = ctx.createRadialGradient(hx0 - s * 0.16, hy - s * 0.18, s * 0.04, hx0, hy, s * 0.5);
    hg.addColorStop(0, 'rgba(255,255,255,0.3)'); hg.addColorStop(0.55, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(0,0,0,0.26)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx0, hy, s * 0.44, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
    if (sd.y >= -0.35) { // ears
      ctx.fillStyle = p.skin;
      ctx.beginPath(); ctx.arc(hx0 - s * 0.43, hy + s * 0.05, s * 0.08, 0, Math.PI * 2); ctx.arc(hx0 + s * 0.43, hy + s * 0.05, s * 0.08, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = p.hair;
    if (sd.y < -0.35) { ctx.beginPath(); ctx.arc(hx0, hy - s * 0.02, s * 0.44, 0, Math.PI * 2); ctx.fill(); }
    else if (p.hs === 0) { ctx.beginPath(); ctx.arc(hx0, hy - s * 0.06, s * 0.45, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); }
    else if (p.hs === 1) { ctx.beginPath(); ctx.ellipse(hx0, hy - s * 0.3, s * 0.41, s * 0.2, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (p.hs === 2) { ctx.beginPath(); ctx.arc(hx0, hy - s * 0.12, s * 0.47, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); }
    else if (p.hs === 3) { ctx.beginPath(); ctx.arc(hx0, hy - s * 0.2, s * 0.35, Math.PI, 2 * Math.PI); ctx.fill(); }
    else { for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(hx0 + i * s * 0.17, hy - s * 0.36 + Math.abs(i) * s * 0.06, s * 0.15, 0, Math.PI * 2); ctx.fill(); } }
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(hx0 - s * 0.14, hy - s * 0.3, s * 0.18, s * 0.08, -0.4, 0, Math.PI * 2); ctx.fill();
    if (sd.y >= -0.35) {
      const ex = sd.x * s * 0.12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(hx0 - s * 0.16 + ex, hy + s * 0.04, s * 0.1, s * 0.11, 0, 0, Math.PI * 2); ctx.ellipse(hx0 + s * 0.16 + ex, hy + s * 0.04, s * 0.1, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(hx0 - s * 0.15 + ex * 1.4, hy + s * 0.05, s * 0.055, 0, Math.PI * 2); ctx.arc(hx0 + s * 0.17 + ex * 1.4, hy + s * 0.05, s * 0.055, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,10,0.7)'; ctx.lineWidth = Math.max(1, s * 0.035);
      const eb = feint || spin || (moving && run > 0.9) ? -0.03 : 0; // focused face when sprinting or dribbling
      ctx.beginPath(); ctx.moveTo(hx0 - s * 0.26 + ex, hy - s * 0.12 + eb * s); ctx.lineTo(hx0 - s * 0.07 + ex, hy - s * 0.09); ctx.moveTo(hx0 + s * 0.07 + ex, hy - s * 0.09); ctx.lineTo(hx0 + s * 0.26 + ex, hy - s * 0.12 + eb * s); ctx.stroke();
      if (celebrating) { ctx.strokeStyle = '#3a1a10'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.beginPath(); ctx.arc(hx0 + ex, hy + s * 0.18, s * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
      else if (kicking && kr > 0.4) { ctx.strokeStyle = '#3a1a10'; ctx.lineWidth = Math.max(1, s * 0.04); ctx.beginPath(); ctx.moveTo(hx0 - s * 0.08 + ex, hy + s * 0.22); ctx.lineTo(hx0 + s * 0.08 + ex, hy + s * 0.22); ctx.stroke(); }
    }
    ctx.restore();
    // a skill move leaves a little trail
    if (sk && !rp) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 * (1 - skP)) + ')'; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X - sdir(sk.dx, sk.dy).x * s * 0.9, Y - s * 0.1 - sdir(sk.dx, sk.dy).y * s * 0.4); ctx.lineTo(X, Y - s * 0.1); ctx.stroke(); ctx.lineCap = 'butt'; }
    ctx.globalAlpha = 1;
    // name tag over the controlled player, the ball carrier and the penalty duel
    if (!G.auto && !rp && (p === G.ctrl || p === G.ball.owner || (G.pk && (p === G.pk.taker || p === G.pk.gk)))) {
      ctx.font = `700 ${Math.round(s * 0.5)}px "Barlow", "Arial", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = Math.max(2, s * 0.12); ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      const tag = p === G.ctrl && !G.pk && !G.shootout ? p.label + ' ' + '★'.repeat(p.stars || 1) : p.label;
      ctx.strokeText(tag, X, hy - s * 0.62);
      ctx.fillStyle = p.team === 0 ? '#ffe14d' : '#ffffff';
      ctx.fillText(tag, X, hy - s * 0.62);
      if (p === G.ctrl && !G.pk && !G.shootout) {
        ctx.fillStyle = '#ffe14d';
        ctx.beginPath(); ctx.moveTo(X - s * 0.2, hy - s * 1.25); ctx.lineTo(X + s * 0.2, hy - s * 1.25); ctx.lineTo(X, hy - s * 1.02); ctx.closePath(); ctx.fill();
      }
    }
  }
  function drawUfo(s) {
    const u = G.ufo, v = u.vic;
    const X = PX(v.x, v.y), Yg = PY(v.x, v.y);
    const descend = clamp(u.t / 0.8, 0, 1), leave = clamp((u.t - 2.2) / 1.0, 0, 1);
    const uy = Yg - s * 9 + descend * s * 3 - leave * s * 14;
    const ux = X + leave * s * 8;
    if (u.t > 0.6 && u.t < 2.2) {
      const g = ctx.createLinearGradient(0, uy, 0, Yg);
      g.addColorStop(0, 'rgba(180,255,140,0.75)'); g.addColorStop(1, 'rgba(180,255,140,0.12)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(ux - s * 0.7, uy + s * 0.3); ctx.lineTo(ux + s * 0.7, uy + s * 0.3); ctx.lineTo(X + s * 1.6, Yg + s * 0.3); ctx.lineTo(X - s * 1.6, Yg + s * 0.3); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath(); ctx.ellipse(ux, uy - s * 0.35, s * 0.9, s * 0.7, 0, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#7b8794';
    ctx.beginPath(); ctx.ellipse(ux, uy, s * 2.2, s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9d3db';
    ctx.beginPath(); ctx.ellipse(ux, uy - s * 0.1, s * 2.0, s * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = (Math.floor(u.t * 8) + i) % 2 ? '#ffe14d' : '#ff5d5d'; ctx.beginPath(); ctx.arc(ux - s * 1.5 + i * s * 0.75, uy + s * 0.1, s * 0.12, 0, Math.PI * 2); ctx.fill(); }
  }
  // mini map of the whole pitch, oriented like the main view
  function drawRadar() {
    if (!rctx || !radar.width || G.shootout) return;
    const W = radar.width, H = radar.height;
    rctx.setTransform(1, 0, 0, 1, 0, 0);
    rctx.clearRect(0, 0, W, H);
    rctx.fillStyle = 'rgba(10,40,20,0.62)';
    rctx.fillRect(0, 0, W, H);
    const land = G.landscape;
    const sx = land ? W / PL : W / PW, sy = land ? H / PW : H / PL;
    const P = (x, y) => (land ? [(PL - y) * sx, x * sy] : [x * sx, y * sy]);
    rctx.strokeStyle = 'rgba(255,255,255,0.45)'; rctx.lineWidth = 1;
    rctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    const [m1x, m1y] = P(0, PL / 2), [m2x, m2y] = P(PW, PL / 2);
    rctx.beginPath(); rctx.moveTo(m1x, m1y); rctx.lineTo(m2x, m2y); rctx.stroke();
    const r = Math.max(2, Math.min(W, H) / 30);
    const dot = (x, y, rad, col) => { const [X, Y] = P(x, y); rctx.fillStyle = col; rctx.beginPath(); rctx.arc(X, Y, rad, 0, Math.PI * 2); rctx.fill(); };
    for (const p of G.players) {
      if (p.out) continue;
      dot(p.x, p.y, r, p.gk ? G.gkKits[p.side].shirt : G.kits[p.side].shirt);
      if (p === G.ctrl) { const [X, Y] = P(p.x, p.y); rctx.strokeStyle = '#ffe14d'; rctx.lineWidth = 1.5; rctx.beginPath(); rctx.arc(X, Y, r + 2, 0, Math.PI * 2); rctx.stroke(); }
    }
    dot(G.ball.x, G.ball.y, r * 0.85, '#ffffff');
  }

  return { start, startShootoutOnly, _create: create, _step: step, _startShootout: startShootout, _startPenalty: startPenalty, _cpuSub: (mn) => cpuSub(mn), _setPiece: (t, x, y, k) => setPiece(t, x, y, k), get _G() { return G; } };
})();
// test hook: the browser tests open the page with ?debug=1 to drive the match directly
try { if (/[?&]debug=1\b/.test(location.search)) window.__g2d = Game2D; } catch (e) { /* no location outside the browser */ }

/* ===================== crest manager: the player's own images for any team (kept only on this device) ===================== */
const CREST_STOP = new Set(['escudo', 'escudos', 'logo', 'logotipo', 'crest', 'badge', 'emblema', 'oficial', 'official', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif',
  'fc', 'cf', 'sc', 'ac', 'afc', 'cd', 'ca', 'ec', 'se', 'club', 'clube', 'de', 'da', 'do', 'del', 'futebol', 'football', 'futbol', 'calcio', 'the', 'team', 'time',
  'hd', 'transparent', 'transparente', 'fundo', 'novo', 'new', 'copy', 'copia']);
function crestNorm(s) {
  return strip(String(s || '')).replace(/\.[a-z0-9]{2,4}$/, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
    .filter((w) => w && !CREST_STOP.has(w) && !/^\d+(x\d+)?$/.test(w)).join(' ');
}
function crestTeams() {
  const al = {}, rt = {};
  for (const r of STORE) { al[r[0]] = r[7] || []; rt[r[0]] = r[6] || 0; }
  if (S && S.teams) {
    return Object.values(S.teams).map((t) => ({ id: t.id, key: t.key, n: t.n, s: t.s, c1: t.c1, c2: t.c2, isNat: t.isNat, ext: t.ext, al: al[t.key] || [], r: rt[t.key] || 0,
      where: t.isNat ? 'Seleção' : (S.nations[t.c] ? S.nations[t.c].n : t.c || '') }));
  }
  return STORE.map((r) => ({ id: 0, key: r[0], n: r[1], s: r[2], c1: r[4], c2: r[5], al: r[7] || [], r: r[6] || 0, where: r[3] === 'ULT' ? '' : r[3] }));
}
const crestRaw = (s) => strip(String(s || '')).replace(/\.[a-z0-9]{2,4}$/, '').replace(/[^a-z0-9]/g, '');
// among several clubs with the same name, prefer a club of the game, then the strongest ("Liverpool" -> Liverpool FC)
function crestBest(list) {
  if (!list || !list.length) return null;
  const core = list.filter((t) => !t.ext);
  return (core.length ? core : list).slice().sort((a, b) => (b.r || 0) - (a.r || 0))[0];
}
function buildCrestIndex(teams) {
  const raw = new Map(), exact = new Map(), codes = new Map(), names = [];
  const add = (m, k, t) => { if (!k) return; const l = m.get(k) || []; if (!l.includes(t)) l.push(t); m.set(k, l); };
  for (const t of teams) {
    add(raw, crestRaw(t.n), t);
    const forms = [t.n].concat(t.al || []).map((x) => crestNorm(x).replace(/ /g, '')).filter(Boolean);
    forms.forEach((f) => add(exact, f, t));
    (t.al || []).forEach((a) => add(exact, crestRaw(a), t));
    add(exact, crestNorm(String(t.key).replace(/^(x:|nat:)/, '')).replace(/ /g, ''), t);
    if (t.s) add(codes, strip(t.s).replace(/[^a-z0-9]/g, ''), t);
    for (const f of new Set(forms)) if (f.length >= 4) names.push([f, t]);
  }
  return { raw, exact, codes, names };
}
function matchCrestFile(fname, idx) {
  const compact = crestNorm(fname).replace(/ /g, '');
  const rawName = crestRaw(fname);
  if (!compact && !rawName) return null;
  const hit = crestBest(idx.raw.get(rawName)) || crestBest(idx.exact.get(compact)) || crestBest(idx.codes.get(compact));
  if (hit) return hit;
  if (!compact) return null;
  // the longest team name contained in the file name wins ("paris" alone must not take "parissaintgermain")
  let best = [], bestLen = 0;
  for (const [n, t] of idx.names) {
    if (!compact.includes(n) || n.length < compact.length * 0.5) continue;
    if (n.length > bestLen) { best = [t]; bestLen = n.length; } else if (n.length === bestLen && !best.includes(t)) best.push(t);
  }
  if (best.length) return crestBest(best);
  // a file name that is part of exactly one team name ("tottenham" -> "Tottenham Hotspur")
  if (compact.length >= 5) {
    const hits = new Set(idx.names.filter(([n, t]) => n.includes(compact) && !t.ext).map(([, t]) => t));
    if (hits.size === 1) return [...hits][0];
  }
  return null;
}

act('openCrests', async () => {
  await loadStore();
  UI.crestQ = ''; UI.crestF = 'all';
  openModal(() => viewCrestManager(), { size: 'wide' });
});
function viewCrestManager() {
  const n = Object.keys(CUSTOM_CRESTS).length;
  return modalShell('Escudos dos times', `
    <p class="muted" style="margin-top:0">Os escudos do jogo são desenhos gerados com as cores de cada clube. Você pode trocar o de qualquer time por uma imagem sua: ela fica salva só neste aparelho e aparece em todo o jogo.</p>
    <div class="row wrap" style="gap:8px;margin-bottom:8px">
      <label class="btn primary" style="cursor:pointer">Importar várias imagens<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" class="hide" data-a="crestBulk"></label>
      <button class="btn" data-a="crestExport" ${n ? '' : 'disabled'}>Exportar pacote</button>
      <label class="btn" style="cursor:pointer">Importar pacote<input type="file" accept=".json,application/json" class="hide" data-a="crestPack"></label>
      ${n ? '<button class="btn danger" data-a="crestClearAsk">Remover todas</button>' : ''}
      <span class="chip right">${n} ${n === 1 ? 'imagem sua' : 'imagens suas'}</span>
    </div>
    <p class="help-keys" style="margin:0 0 12px">Na importação em lote, o nome de cada arquivo indica o time: <span class="kbd">flamengo.png</span> <span class="kbd">real-madrid.png</span> <span class="kbd">sao-paulo.webp</span>${S ? ' · seleções pela sigla: <span class="kbd">BRA.png</span>' : ''}. O pacote leva todas as suas imagens para outro aparelho.</p>
    <input id="crest-q" class="input" type="search" style="width:100%;margin-bottom:10px" placeholder="Buscar time…" value="${esc(UI.crestQ || '')}" data-a="crestQ" data-live="1" autocomplete="off" aria-label="Buscar time">
    <div class="row wrap" style="gap:6px;margin-bottom:12px">${[['all', 'Todos'], ['custom', 'Com imagem sua'], ['gen', 'Escudo gerado']].map(([k, l]) => `<button class="chip ${(UI.crestF || 'all') === k ? 'on' : ''}" data-a="crestF" data-v="${k}">${l}</button>`).join('')}</div>
    <div id="crest-list">${crestListHtml()}</div>`, '<button class="btn" data-a="closeModal">Fechar</button>');
}
function crestListHtml() {
  const q = strip((UI.crestQ || '').trim());
  const f = UI.crestF || 'all';
  let rows = crestTeams();
  if (q) rows = rows.filter((t) => strip(`${t.n} ${t.s || ''}`).includes(q));
  if (f === 'custom') rows = rows.filter((t) => CUSTOM_CRESTS[t.key]);
  else if (f === 'gen') rows = rows.filter((t) => !CUSTOM_CRESTS[t.key]);
  rows.sort((a, b) => (a.ext ? 1 : 0) - (b.ext ? 1 : 0) || a.n.localeCompare(b.n, 'pt-BR'));
  if (!rows.length) return '<div class="empty">Nenhum time encontrado.</div>';
  const shown = rows.slice(0, 120);
  return `<div class="any-grid">${shown.map((t) => `<button class="any-item" data-a="crestEdit" ${t.id ? `data-id="${t.id}"` : `data-k="${esc(t.key)}"`} title="Trocar o escudo ${esc(tA(t, 'do'))}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${CUSTOM_CRESTS[t.key] ? 'Imagem sua' : 'Escudo gerado'}${t.where ? ' · ' + esc(t.where) : ''}</span></span></button>`).join('')}</div>${rows.length > shown.length ? `<p class="muted" style="font-size:13px;margin:10px 0 0">Mostrando ${shown.length} de ${rows.length}. Busque pelo nome para ver os outros.</p>` : ''}`;
}
act('crestQ', (el) => { UI.crestQ = el.value; const box = $('#crest-list'); if (box) box.innerHTML = crestListHtml(); });
act('crestF', (el) => {
  UI.crestF = el.dataset.v;
  const box = $('#crest-list');
  if (box) box.innerHTML = crestListHtml();
  $$('[data-a="crestF"]').forEach((b) => b.classList.toggle('on', b === el));
});
act('crestBulk', async (el) => {
  const files = Array.from(el.files || []);
  el.value = '';
  if (!files.length) return;
  const idx = buildCrestIndex(crestTeams());
  const ok = [], miss = [];
  for (const f of files) {
    const t = matchCrestFile(f.name, idx);
    if (!t) { miss.push(f.name); continue; }
    try { setCustomCrest(t.key, await imageFileToCrest(f)); ok.push(t.n); } catch (e) { miss.push(f.name); }
  }
  if (ok.length) await persistCustomCrests();
  render(); refreshModal();
  const list = (arr) => esc(arr.slice(0, 40).join(', ')) + (arr.length > 40 ? '…' : '');
  openModal(modalShell('Importação de escudos', `
    <p><b>${ok.length}</b> ${ok.length === 1 ? 'escudo aplicado' : 'escudos aplicados'}${ok.length ? `: ${list(ok)}.` : '.'}</p>
    ${miss.length ? `<p class="muted">Sem time correspondente (${miss.length}): ${list(miss)}. Renomeie o arquivo com o nome do time ou aplique pela lista, tocando no time.</p>` : ''}`,
  '<button class="btn primary" data-a="closeModal">OK</button>'), { size: 'narrow' });
});
act('crestExport', async () => {
  const n = Object.keys(CUSTOM_CRESTS).length;
  if (!n) return;
  const blob = new Blob([JSON.stringify({ format: 'ultra-manager-escudos', v: 1, crests: CUSTOM_CRESTS })], { type: 'application/json' });
  await offerDownload('ultra-manager-escudos.json', blob, `Pacote com ${n} ${n === 1 ? 'escudo' : 'escudos'} exportado.`);
});
act('crestPack', async (el) => {
  const f = el.files && el.files[0];
  el.value = '';
  if (!f) return;
  try {
    const obj = JSON.parse(await f.text());
    if (!obj || obj.format !== 'ultra-manager-escudos' || !obj.crests || typeof obj.crests !== 'object') throw new Error('Este arquivo não é um pacote de escudos do Ultra Manager.');
    let n = 0;
    for (const k of Object.keys(obj.crests)) {
      if (k.length <= 120 && isCrestData(obj.crests[k])) { setCustomCrest(k, obj.crests[k]); n++; }
    }
    if (n) await persistCustomCrests();
    render(); refreshModal();
    toast(n ? `${n} ${n === 1 ? 'escudo importado' : 'escudos importados'}.` : 'Nenhum escudo válido no pacote.', !n);
  } catch (e) { toast(e instanceof SyntaxError ? 'Não foi possível ler o pacote.' : (e.message || 'Não foi possível ler o pacote.'), true); }
});
act('crestClearAsk', () => {
  openModal(modalShell('Remover todas as imagens?', '<p>Todos os times voltam ao escudo gerado. Se quiser guardar as imagens, exporte um pacote antes.</p>',
    '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="crestClear">Remover todas</button>'), { size: 'narrow' });
});
act('crestClear', async () => {
  for (const k of Object.keys(CUSTOM_CRESTS)) setCustomCrest(k, null);
  await persistCustomCrests();
  closeModal();
  render(); refreshModal();
  toast('Todos os times voltaram ao escudo gerado.');
});

/* ===================== simulate to a date (FIFA-style "simular até") ===================== */
// a day picked in the calendar; the bar under the calendar offers the simulation
function simPickBar() {
  if (S.coach.unemployed) return '';
  const d = UI.calPick;
  if (!d || d <= S.date) return '<div class="sim-bar muted">Toque em um dia futuro do calendário para simular até ele, com os jogos do seu time.</div>';
  const n = teamMatches(S.user.team).filter((m) => !m.done && m.d <= d).length;
  return `<div class="sim-bar"><span class="grow"><b>Simular até ${fmtDate(d, 'wd')}</b><span class="muted"> · ${d - S.date} ${d - S.date === 1 ? 'dia' : 'dias'} · ${n ? `${n} ${n === 1 ? 'jogo' : 'jogos'} do seu time` : 'sem jogos do seu time'}</span></span>
    <button class="btn sm" data-a="calPickClear">Cancelar</button><button class="btn primary sm" data-a="simToOpen" data-d="${d}">Simular até esta data</button></div>`;
}
act('calDay', (el) => { const d = +el.dataset.d; UI.calPick = UI.calPick === d ? null : d; render(); });
act('calPickClear', () => { UI.calPick = null; render(); });
act('simToOpen', (el) => openSimTo(+el.dataset.d));
act('simToCal', () => { closeAllModals(); UI.screen = 'career'; UI.tab = 'office'; UI.sub.office = 'calendar'; UI.calMonth = null; render(); window.scrollTo(0, 0); });
function openSimTo(target) {
  if (UI.busy || !(target > S.date)) return;
  UI.simOpt = UI.simOpt || { user: true, stop: true, inj: false };
  openModal(() => {
    const o = UI.simOpt;
    const ms = teamMatches(S.user.team).filter((m) => !m.done && m.d <= target);
    const list = ms.slice(0, 8).map((m) => `<div class="row" style="gap:8px;font-size:13px;padding:3px 0"><span class="dim" style="width:84px">${fmtDate(m.d, 'wd')}</span>${compBadge(S.comps[m.c], 16)}<span class="grow">${esc(teamName(m.h))} x ${esc(teamName(m.a))}</span></div>`).join('');
    const chk = (k, label, sub) => `<label class="sim-opt"><input type="checkbox" data-a="simOpt" data-k="${k}" ${o[k] ? 'checked' : ''}><span><b>${label}</b><br><span class="muted" style="font-size:12px">${sub}</span></span></label>`;
    return modalShell(`Simular até ${fmtDate(target, 'wd')}`, `
      <p class="muted" style="margin-top:0">Como no FIFA: o jogo avança dia a dia até a data escolhida, com todos os campeonatos, o mercado e as notícias.</p>
      ${ms.length ? `<div class="muted up" style="font-size:11px;margin-bottom:4px">${ms.length} ${ms.length === 1 ? 'jogo' : 'jogos'} do seu time no período</div>${list}${ms.length > 8 ? `<div class="muted" style="font-size:12px">e mais ${ms.length - 8}…</div>` : ''}` : '<div class="muted">Seu time não joga no período.</div>'}
      <div class="col" style="gap:8px;margin-top:14px">
        ${chk('user', 'Simular os jogos do meu time', 'Com a escalação salva (lesionados e suspensos são trocados automaticamente). Desmarcado, para no próximo jogo.')}
        ${chk('stop', 'Parar em propostas e decisões', 'Proposta por jogador, proposta de emprego ou pedido que espera a sua resposta.')}
        ${chk('inj', 'Parar se um titular se lesionar', 'Para você ajustar a escalação.')}
      </div>`, `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="simToGo" data-d="${target}">Simular</button>`);
  }, { size: 'narrow' });
}
act('simOpt', (el) => { UI.simOpt[el.dataset.k] = el.checked; });
act('simToGo', (el) => { const d = +el.dataset.d; closeAllModals(); simToDate(d, Object.assign({}, UI.simOpt)); });

function decisionsCount() {
  return S.tr.offers.filter((o) => o.status === 'open').length + S.inbox.filter((m) => m.act && !m.read).length;
}
function simOverlay(target, start, res, note) {
  let el = document.getElementById('simov');
  if (!el) {
    el = document.createElement('div');
    el.id = 'simov';
    el.className = 'simov';
    document.body.appendChild(el);
  }
  const pct = clamp(Math.round(100 * (S.date - start) / Math.max(1, target - start)), 0, 100);
  const uid = S.user.team;
  const rec = simRecord(res);
  el.innerHTML = `<div class="box"><div class="row" style="gap:10px"><div class="spin"></div><div class="grow"><b>Simulando…</b><div class="muted" style="font-size:13px">${fmtDate(S.date, 'wd')} → ${fmtDate(target, 'wd')}</div></div><b class="tnum">${pct}%</b></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    ${res.length ? `<div class="muted" style="font-size:12px;margin:10px 0 4px">${esc(teamShort(uid))}: ${rec.w}V ${rec.d}E ${rec.l}D</div><div class="col" style="gap:2px">${res.slice(-4).map((id) => simLine(S.matches[id])).join('')}</div>` : ''}
    ${note ? `<div class="muted" style="font-size:12px;margin-top:8px">${esc(note)}</div>` : ''}
    <div class="row" style="margin-top:12px"><span class="grow"></span><button class="btn sm" id="simstop">Parar</button></div></div>`;
  el.querySelector('#simstop').onclick = () => { UI.simStop = true; };
}
function simLine(m) {
  if (!m) return '';
  const uid = S.user.team;
  const res = resultLetter(m, uid);
  const opp = m.h === uid ? m.a : m.h;
  return `<div class="row" style="gap:6px;font-size:13px"><span class="res-dot ${res}">${res}</span>${crest(opp, 16)}<span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.h === uid ? '' : '@ '}${esc(teamName(opp))}</span><b class="tnum">${m.h === uid ? m.hg : m.ag}-${m.h === uid ? m.ag : m.hg}${m.pen ? ` <span class="dim" style="font-size:11px">(${m.h === uid ? m.pen[0] : m.pen[1]}-${m.h === uid ? m.pen[1] : m.pen[0]} pên.)</span>` : ''}</b></div>`;
}
function simRecord(res) {
  const uid = S.user.team;
  const r = { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
  for (const id of res) {
    const m = S.matches[id];
    if (!m) continue;
    const L = resultLetter(m, uid);
    if (L === 'V') r.w++; else if (L === 'E') r.d++; else r.l++;
    r.gf += m.h === uid ? m.hg : m.ag; r.ga += m.h === uid ? m.ag : m.hg;
  }
  return r;
}
function starterInjured(before) {
  const t = S.teams[S.user.team];
  return t && (t.xi || []).some((pid) => { const p = S.players[pid]; return p && isInjured(p) && !before.has(pid); });
}
async function simToDate(target, o) {
  if (UI.busy) return;
  UI.busy = true; UI.simStop = false; UI.calPick = null;
  const start = S.date;
  const res = [];
  let why = '';
  const dec0 = decisionsCount();
  const inj0 = new Set(teamPlayersFor(S.user.team).filter((p) => isInjured(p)).map((p) => p.id));
  const team0 = S.user.team;
  simOverlay(target, start, res);
  try {
    let guard = 0;
    while (S.date < target && guard++ < 1000) {
      if (UI.simStop) { why = 'Simulação interrompida.'; break; }
      if (S.pendingEnd) { why = 'A temporada terminou.'; break; }
      if (S.celebrate && S.celebrate.length) { why = 'Título conquistado!'; break; }
      if (S.coach.unemployed || S.user.team !== team0) { why = S.coach.unemployed ? 'Você não está mais no cargo.' : 'Você mudou de clube.'; break; }
      const um = userMatchToday();
      if (um) {
        if (!o.user) { why = 'Dia de jogo do seu time.'; break; }
        const st = playWholeMatch(um, { user: S.user.team });
        applyMatchResult(um, st);
        res.push(um.id);
        simOverlay(target, start, res);
        await new Promise((r2) => setTimeout(r2, 0));
        continue;
      }
      advanceDay();
      if (o.stop && decisionsCount() > dec0) {
        const msg = S.inbox.find((m) => m.act && !m.read && m.d >= start);
        why = msg ? `Decisão pendente: ${msg.subj}.` : 'Chegou uma proposta ou decisão para você.';
        break;
      }
      if (o.inj && starterInjured(inj0)) { why = 'Um titular se lesionou.'; break; }
      if ((S.date - start) % 2 === 0) { simOverlay(target, start, res); await new Promise((r2) => setTimeout(r2, 0)); }
    }
  } catch (e) { console.error(e); why = 'Erro na simulação: ' + e.message; }
  const ov = document.getElementById('simov');
  if (ov) ov.remove();
  UI.busy = false;
  lastAutosave = S.date;
  saveGame(S.id).then(async () => { SAVES = await listSaves(); });
  render();
  const rec = simRecord(res);
  const reached = S.date >= target;
  openModal(modalShell(reached ? `Simulação concluída · ${fmtDate(S.date, 'wd')}` : `Simulação parada em ${fmtDate(S.date, 'wd')}`, `
    ${why ? `<div class="panel" style="background:var(--panel2);margin-bottom:12px">${esc(why)}</div>` : ''}
    <div class="grid g3" style="margin-bottom:12px"><div class="stat-tile"><div class="k">Jogos</div><div class="v">${res.length}</div></div><div class="stat-tile"><div class="k">V · E · D</div><div class="v">${rec.w} · ${rec.d} · ${rec.l}</div></div><div class="stat-tile"><div class="k">Gols</div><div class="v">${rec.gf} : ${rec.ga}</div></div></div>
    ${res.length ? `<div class="col" style="gap:4px">${res.map((id) => { const m = S.matches[id]; return `<div class="row" style="gap:8px"><span class="dim" style="width:74px;font-size:12px">${fmtDate(m.d, 'short')}</span>${compBadge(S.comps[m.c], 16)}<span class="grow">${simLine(m)}</span></div>`; }).join('')}</div>` : '<div class="muted">Seu time não jogou no período.</div>'}`,
    `${decisionsCount() > dec0 || unreadCount() ? '<button class="btn" data-a="simGoInbox">Caixa de entrada</button>' : ''}<button class="btn primary" data-a="closeModal">Continuar</button>`), { size: 'narrow' });
}
act('simGoInbox', () => { closeAllModals(); UI.screen = 'career'; UI.tab = 'inbox'; render(); });

/* ===================== friendly match: any two teams of the game, played in the 2D match against the computer ===================== */
act('openFriendly', () => {
  UI.fr = { step: 'setup', era: 2026, kind: 'club', a: 0, b: 0, slot: 'a', q: '', grp: 'all', loaded: null, result: null };
  UI.screen = 'friendly';
  render();
});
act('frBack', () => { UI.fr = null; UI.screen = 'start'; render(); });
act('frSet', (el) => { UI.fr[el.dataset.k] = el.dataset.v === '2016' || el.dataset.v === '2021' || el.dataset.v === '2026' ? +el.dataset.v : el.dataset.v; render(); });
act('frLoad', async () => {
  const f = UI.fr;
  setLoading('Carregando elencos de ' + f.era + '…', 0.2);
  try {
    await loadEra(f.era);
    setLoading('Montando os times…', 0.6);
    await new Promise((r) => setTimeout(r, 20));
    await createWorld({ era: f.era, mode: f.kind === 'national' ? 'national' : 'normal', coachName: 'Amistoso', coachAge: 40 });
    S.coach.unemployed = false;
    UI.wiz = { anyList: null, anyQ: '', anyG: 'all' };
    f.loaded = { era: f.era, kind: f.kind }; f.step = 'pick'; f.a = 0; f.b = 0; f.slot = 'a'; f.q = ''; f.grp = 'all';
    UI.screen = 'friendly';
    render();
  } catch (e) {
    console.error(e);
    UI.screen = 'friendly'; f.step = 'setup'; render(); toast(e.message, true);
  }
});
act('frSlot', (el) => { UI.fr.slot = el.dataset.v; render(); });
act('frGrp', (el) => { UI.fr.grp = el.value; render(); });
act('frQ', (el) => { UI.fr.q = el.value; const box = $('#fr-list'); if (box) box.innerHTML = frListHtml(); });
act('frPick', (el) => {
  const f = UI.fr, id = +el.dataset.id;
  if (f.slot === 'a') { f.a = id; if (f.b === id) f.b = 0; f.slot = f.b ? 'a' : 'b'; } else { f.b = id; if (f.a === id) f.a = 0; f.slot = f.a ? 'b' : 'a'; }
  render();
});
act('frSwap', () => { const f = UI.fr; [f.a, f.b] = [f.b, f.a]; render(); });
act('frRandom', () => {
  const f = UI.fr, rows = anyClubEntries();
  const pickRow = () => rows[Math.floor(Math.random() * rows.length)].id;
  f.a = pickRow(); do { f.b = pickRow(); } while (f.b === f.a && rows.length > 1);
  render();
});
act('frOpt', (el) => {
  const k = el.dataset.k;
  let v = el.dataset.v;
  if (k === 'len') v = +v;
  G2PREF[k] = v; saveG2Pref(); render();
});
act('frPlay', () => frStart());
act('frAgain', () => frStart());
act('frChange', () => { UI.fr.step = 'pick'; UI.fr.result = null; render(); });

function frStart() {
  const f = UI.fr;
  if (!f || !f.a || !f.b || f.a === f.b) return;
  g2Defaults();
  S.user.team = f.a; S.coach.unemployed = false;
  for (const id of [f.a, f.b]) { const t = S.teams[id]; if (t && t.isNat) autoCallUp(t.code, true); } // national squads are called up for the match
  S.date = dayOf(S.era, 3, 15);
  const m = { id: 'fr' + (Date.now() % 1e7), h: f.a, a: f.b, c: 0, d: S.date, r: 0, fr: true };
  S.matches[m.id] = m;
  const st = startMatchState(m, { user: f.a });
  f.step = 'playing'; f.result = null;
  UI.screen = 'friendly'; render();
  Game2D.start(m, st, { minutes: G2PREF.len, diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: G2PREF.replay }, () => frDone(m, st));
}
function frDone(m, st) {
  if (!st.decided) { st.min = Math.max(st.min || 0, 90 + st.stoppage[1]); st.half = 2; }
  st.done = true;
  delete S.matches[m.id];
  if (!UI.fr) return;
  UI.fr.step = 'result'; UI.fr.result = { m, st };
  UI.screen = 'friendly'; render(); window.scrollTo(0, 0);
}

function frTeamCard(id, slot, label) {
  const f = UI.fr, t = id ? S.teams[id] : null, on = f.slot === slot;
  return `<button class="panel" style="text-align:left;cursor:pointer;border:2px solid ${on ? 'var(--gold, #ffc54d)' : 'transparent'};flex:1;min-width:220px" data-a="frSlot" data-v="${slot}">
    <div class="muted up" style="font-size:11px">${label}</div>
    ${t ? `<div class="row" style="gap:10px;margin-top:6px">${crest(t, 44)}<div><div class="disp" style="font-size:22px;font-weight:800">${esc(t.n)}</div><div class="muted" style="font-size:13px">${starStr(t.isNat ? nationRating(t.code) : teamRating(t.id))} força ${(t.isNat ? nationRating(t.code) : teamRating(t.id)).toFixed(1)}</div></div></div>` : '<div class="muted" style="margin-top:10px">Escolha na lista abaixo</div>'}
  </button>`;
}
function frGroups(rows) {
  const present = [...new Set(rows.map((r) => r.grp))];
  return present;
}
function frListHtml() {
  const f = UI.fr;
  const q = strip((f.q || '').trim());
  const rows = anyClubEntries().filter((r) => (f.grp === 'all' || r.grp === f.grp) && (!q || r.q.includes(q)));
  if (!rows.length) return '<div class="empty">Nenhum resultado para essa busca.</div>';
  const shown = rows.slice(0, 60);
  return `<div class="any-grid">${shown.map((r) => {
    const t = S.teams[r.id];
    const taken = r.id === f.a || r.id === f.b;
    return `<button class="any-item" style="${taken ? 'opacity:0.45' : ''}" data-a="frPick" data-id="${r.id}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${esc(r.where)}</span></span><span class="sc">${starStr(r.r)}<span class="muted">força ${r.r.toFixed(1)}</span></span></button>`;
  }).join('')}</div>${rows.length > shown.length ? `<p class="muted" style="font-size:13px;margin:10px 0 0">Mostrando ${shown.length} de ${rows.length}. Digite o nome ou escolha a liga para achar os outros.</p>` : ''}`;
}
function frSeg(k, opts) {
  return `<div class="seg">${opts.map(([v, l]) => `<button class="${String(G2PREF[k]) === String(v) ? 'on' : ''}" data-a="frOpt" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
}
function viewFriendly() {
  const f = UI.fr;
  if (!f) return viewStart();
  const head = `<div class="row wrap" style="margin-bottom:14px"><button class="btn" data-a="frBack">← Menu</button><h2 style="font-size:34px;font-weight:800;margin:0" class="grow">Amistoso</h2></div>`;
  if (f.step === 'setup') {
    return `<div class="page" style="max-width:900px;margin:0 auto;padding:18px">${head}
      <div class="panel"><p style="margin:0 0 14px">Jogue uma partida 2D contra o computador com <b>qualquer time do jogo</b>: clubes de todas as ligas ou seleções. Escolha a época dos elencos.</p>
        <div class="muted up" style="font-size:11px">Época</div>
        <div class="seg" style="margin:6px 0 14px">${[2016, 2021, 2026].map((y) => `<button class="${f.era === y ? 'on' : ''}" data-a="frSet" data-k="era" data-v="${y}">${y}</button>`).join('')}</div>
        <div class="muted up" style="font-size:11px">Tipo de time</div>
        <div class="seg" style="margin:6px 0 14px">${[['club', 'Clubes'], ['national', 'Seleções']].map(([k, l]) => `<button class="${f.kind === k ? 'on' : ''}" data-a="frSet" data-k="kind" data-v="${k}">${l}</button>`).join('')}</div>
        <button class="btn gold" data-a="frLoad">Carregar times</button></div></div>`;
  }
  if (f.step === 'result' && f.result) {
    const { m, st } = f.result;
    const goals = st.ev.filter((e) => e.t === 'goal');
    const line = (e) => `<div class="row" style="gap:8px;justify-content:${e.s === 0 ? 'flex-start' : 'flex-end'}"><span class="muted">${e.min}'</span><span>${e.p ? esc(pidName(e.p)) : 'Gol contra'}</span></div>`;
    const stat = (l, v) => `<div class="row" style="justify-content:space-between"><b>${v[0]}</b><span class="muted">${l}</span><b>${v[1]}</b></div>`;
    const pen = st.pen ? `<div class="muted" style="text-align:center">Pênaltis: ${st.pen[0]} x ${st.pen[1]}</div>` : '';
    return `<div class="page" style="max-width:900px;margin:0 auto;padding:18px">${head}
      <div class="panel"><div class="score-head" style="position:static"><div class="side">${crest(m.h, 56)}<div class="tname">${esc(teamName(m.h))}</div></div>
        <div class="scorebox"><div class="sc">${st.score[0]} - ${st.score[1]}</div><div class="clock">FIM</div></div>
        <div class="side r"><div class="tname">${esc(teamName(m.a))}</div>${crest(m.a, 56)}</div></div>${pen}
        <div style="display:grid;gap:4px;margin:14px 0">${goals.length ? goals.map(line).join('') : '<div class="muted center">Sem gols.</div>'}</div>
        <div style="display:grid;gap:4px;max-width:420px;margin:0 auto 14px">${stat('Finalizações', st.stats.sh)}${stat('No alvo', st.stats.sot)}${stat('Escanteios', st.stats.cor)}${stat('Faltas', st.stats.fo)}${stat('Posse (%)', st.stats.poss)}</div>
        <div class="row wrap" style="justify-content:center"><button class="btn gold" data-a="frAgain">Jogar de novo</button><button class="btn" data-a="frChange">Trocar times</button><button class="btn" data-a="frBack">Menu</button></div></div></div>`;
  }
  if (f.step === 'playing') return `<div class="page" style="padding:40px;text-align:center"><p class="muted">Partida em andamento…</p></div>`;
  // pick the two teams
  g2Defaults();
  const rows = anyClubEntries();
  const groups = frGroups(rows);
  const ready = f.a && f.b && f.a !== f.b;
  return `<div class="page" style="max-width:1000px;margin:0 auto;padding:18px">${head}
    <div class="row wrap" style="gap:12px;align-items:stretch">${frTeamCard(f.a, 'a', 'SEU TIME (você controla)')}<div class="col" style="justify-content:center;gap:6px"><button class="btn sm" data-a="frSwap" title="Trocar os lados">⇄</button><button class="btn sm" data-a="frRandom" title="Sortear dois times">🎲</button></div>${frTeamCard(f.b, 'b', 'ADVERSÁRIO (computador)')}</div>
    <div class="panel" style="margin-top:12px"><div class="row wrap" style="gap:16px">
      <div><div class="muted up" style="font-size:11px">Dificuldade</div>${frSeg('diff', G2_DIFFS)}</div>
      <div><div class="muted up" style="font-size:11px">Duração</div>${frSeg('len', [[4, '4 min'], [6, '6 min'], [10, '10 min']])}</div>
      <div><div class="muted up" style="font-size:11px">Câmera</div>${frSeg('cam', G2_CAMS)}</div>
      <span class="grow"></span><button class="btn gold big" data-a="frPlay" ${ready ? '' : 'disabled style="opacity:0.45"'}>🎮 Jogar</button></div></div>
    <div class="panel" style="margin-top:12px">
      <div class="row wrap" style="margin-bottom:10px"><h3 class="grow" style="font-size:22px;margin:0">Escolher ${f.slot === 'a' ? 'o seu time' : 'o adversário'}</h3><span class="muted" style="font-size:13px">${rows.length} ${f.kind === 'national' ? 'seleções' : 'clubes'}</span></div>
      <div class="row wrap" style="gap:8px;margin-bottom:10px"><input id="fr-q" class="input grow" type="search" placeholder="Buscar pelo nome…" value="${esc(f.q || '')}" data-a="frQ" data-live="1" autocomplete="off" aria-label="Buscar time">
        <select class="input" style="max-width:320px" data-a="frGrp" aria-label="Liga"><option value="all">Todas as ${f.kind === 'national' ? 'confederações' : 'ligas'}</option>${groups.map((g) => `<option value="${esc(g)}" ${f.grp === g ? 'selected' : ''}>${esc(anyGroupLabel(g))}</option>`).join('')}</select></div>
      <div id="fr-list">${frListHtml()}</div></div></div>`;
}

/* ===================== boot ===================== */
window.addEventListener('error', (e) => { console.error(e.error || e.message); });
window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); });
(async function boot() {
  UI.screen = 'loading';
  UI.loadMsg = 'Carregando…';
  UI.loadP = 0.2;
  render();
  try { await loadWallet(); } catch (e) { console.error(e); }
  await loadCustomCrests();
  UI.loadP = 0.5;
  try { SAVES = await listSaves(); } catch (e) { SAVES = []; }
  UI.loadP = 0.8;
  try { await loadStore(); } catch (e) { console.error(e); }
  UI.screen = 'start';
  render();
})();
// test hook: the browser tests open the page with ?debug=1 to move the calendar on directly
try { if (/[?&]debug=1\b/.test(location.search)) window.__um = { get S() { return S; }, fastForward, render, UI, dayOf, importNewClubs, askPens, startMatchState }; } catch (e) { /* no location outside the browser */ }

})();
