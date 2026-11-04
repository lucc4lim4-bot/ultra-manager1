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
