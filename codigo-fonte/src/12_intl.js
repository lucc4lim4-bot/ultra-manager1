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
