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
