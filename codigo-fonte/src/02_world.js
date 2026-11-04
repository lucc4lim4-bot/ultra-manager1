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
  '4-4-1-1': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['RM', 84, 52], ['CM', 60, 46], ['CM', 40, 46], ['LM', 16, 52], ['CAM', 50, 66], ['ST', 50, 82]],
  '4-2-2-2': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['CDM', 62, 40], ['CDM', 38, 40], ['CAM', 68, 62], ['CAM', 32, 62], ['ST', 60, 80], ['ST', 40, 80]],
  '4-3-2-1': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['CM', 70, 44], ['CDM', 50, 40], ['CM', 30, 44], ['CAM', 66, 64], ['CAM', 34, 64], ['ST', 50, 82]],
  '4-1-2-1-2': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['CDM', 50, 38], ['CM', 66, 50], ['CM', 34, 50], ['CAM', 50, 64], ['ST', 60, 80], ['ST', 40, 80]],
  '4-2-4': [['GK', 50, 4], ['RB', 84, 26], ['CB', 62, 20], ['CB', 38, 20], ['LB', 16, 26], ['CM', 60, 44], ['CM', 40, 44], ['RW', 84, 72], ['ST', 60, 80], ['ST', 40, 80], ['LW', 16, 72]],
  '3-4-1-2': [['GK', 50, 4], ['CB', 72, 20], ['CB', 50, 18], ['CB', 28, 20], ['RM', 86, 48], ['CM', 60, 44], ['CM', 40, 44], ['LM', 14, 48], ['CAM', 50, 64], ['ST', 60, 80], ['ST', 40, 80]],
  '3-4-2-1': [['GK', 50, 4], ['CB', 72, 20], ['CB', 50, 18], ['CB', 28, 20], ['RM', 86, 48], ['CM', 60, 44], ['CM', 40, 44], ['LM', 14, 48], ['CAM', 66, 66], ['CAM', 34, 66], ['ST', 50, 82]],
  '3-1-4-2': [['GK', 50, 4], ['CB', 72, 20], ['CB', 50, 18], ['CB', 28, 20], ['CDM', 50, 36], ['RM', 86, 54], ['CM', 62, 50], ['CM', 38, 50], ['LM', 14, 54], ['ST', 60, 78], ['ST', 40, 78]],
  '5-2-3': [['GK', 50, 4], ['RB', 88, 32], ['CB', 70, 20], ['CB', 50, 18], ['CB', 30, 20], ['LB', 12, 32], ['CM', 62, 44], ['CM', 38, 44], ['RW', 80, 72], ['ST', 50, 80], ['LW', 20, 72]],
  '5-2-1-2': [['GK', 50, 4], ['RB', 88, 32], ['CB', 70, 20], ['CB', 50, 18], ['CB', 30, 20], ['LB', 12, 32], ['CM', 62, 44], ['CM', 38, 44], ['CAM', 50, 62], ['ST', 60, 78], ['ST', 40, 78]],
  '5-3-1-1': [['GK', 50, 4], ['RB', 88, 32], ['CB', 70, 20], ['CB', 50, 18], ['CB', 30, 20], ['LB', 12, 32], ['CM', 68, 48], ['CDM', 50, 42], ['CM', 32, 48], ['CAM', 50, 64], ['ST', 50, 80]],
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
