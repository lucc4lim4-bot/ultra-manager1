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
    ultra: null, normal: null, flags: { potV2: 1, potV3: 1, braCut: 1 }, seasonStart: 0, euSeason: 0, saSeason: 0, intl: { next: [] },
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
const BRA_BUDGET_K = 0.4;
function setBudgets(t) {
  const fin = t.fin || 2;
  const mf = moneyFactor();
  const base = [3e6, 8e6, 20e6, 45e6, 90e6, 160e6, 240e6][clamp(fin, 0, 6)];
  t.budget = roundMoney(base * mf * (0.75 + rnd() * 0.5) * (t.c === 'BRA' ? BRA_BUDGET_K : 1)); // Brazilian clubs have far less to spend
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
