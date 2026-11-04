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
// the club is run by the computer when the user plays as a player (player career)
const isCoachTeam = (id) => !S.pl && isUserTeam(id);

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
  if (S.pl) plYearly();
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
