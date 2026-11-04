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
  else if (a <= 31) d = rfloat(-0.5, 1);
  else if (a <= 33) d = rfloat(-1, 0.5);
  else if (a <= 35) d = rfloat(-2.5, 0);
  else d = rfloat(-5, -1);
  if (p.p === 'GK') {
    // goalkeepers keep their level until about 38-39
    if (a <= 37) d = a <= 31 ? rfloat(-0.3, 1) : rfloat(-0.7, 0.5);
    else if (a <= 39) d = rfloat(-1.5, 0);
    else d = rfloat(-4, -1);
  }
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
        if (p.age >= (p.p === 'GK' ? 37 : 32) && rnd() < 0.5) p.pot = Math.max(p.o, p.pot - 1);
        if (p.a) p.a = p.a.map((v, i) => clamp(v + d + (i === 0 && p.age > (p.p === 'GK' ? 36 : 32) ? -rint(0, 2) : 0), 15, 99));
      }
      // retirement
      if (!S.zoeira) {
        let pr = 0;
        if (p.age >= 41) pr = 0.95; else if (p.age >= 38) pr = 0.6; else if (p.age >= 36) pr = 0.35; else if (p.age >= 34) pr = 0.12; else if (p.age >= 33 && p.o < 70) pr = 0.1;
        if (p.p === 'GK' && p.age < 40) pr *= p.age >= 38 ? 0.4 : 0.15;
        if (p.o >= 84) pr *= 0.4;
        if (rnd() < pr && !(S.pl && p.id === S.pl.pid)) retired.push(p);
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
    if (S.pl && p.id === S.pl.pid) continue; // his own contract is handled at the end of the season (agent)
    const t = S.teams[p.t];
    if (p.loan && p.loan.until <= S.date) endLoan(p);
    if (p.ct && p.ct < y + (S.mode === 'normal' && t && isSAteam(t.id) ? 0 : 1) && p.ct <= y) {
      if (isCoachTeam(p.t) && p.rn && autoRenewUser(p, t, y)) { /* renewed automatically */ }
      else if (isCoachTeam(p.t)) {
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
    if (!isCoachTeam(t.id)) youthIntakeAI(t);
    if (t.stOnly) refreshStateClub(t);
    enforceSquadSize(t);
  }
  if (isCoachTeam(S.user.team) && !S.zoeira && S.mode !== 'national') {
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
// AUTOMATIC RENEWAL (the user switches it on for some players): the club renews at the wage the player asks, for as long as
// his age allows, unless the wage budget would burst or he is unhappy
function autoRenewUser(p, t, y) {
  const demand = playerWageDemand(p, t, 'titular');
  const yrs = p.age < 30 ? 3 : p.age < 33 ? 2 : 1;
  const over = t.wb && wageBill(t.id) - (p.w || 0) + demand > t.wb * 1.02;
  if (over || (p.mor || 70) < 30) {
    p.rn = 0;
    addInbox('contract', 'Departamento jurídico', `Renovação automática falhou: ${p.n}`, over ? `A folha salarial não comporta o novo salário de ${p.n} (${fmtMoney(demand)}/semana). Ele deixou o clube.` : `${p.n} recusou renovar (está insatisfeito). Ele deixou o clube.`);
    return false;
  }
  p.w = demand; p.ct = y + yrs; p.mor = clamp((p.mor || 70) + 6, 0, 100);
  addInbox('contract', 'Departamento jurídico', `Renovação automática: ${p.n}`, `${p.n} renovou por ${yrs} ano${yrs > 1 ? 's' : ''}, com salário de ${fmtMoney(demand)}/semana.`);
  return true;
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
    if (isCoachTeam(tid)) continue;
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
  p.t = 0; p.tl = 0; p.ll = 0; p.rn = 0; p.loan = null;
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
    for (const p of sorted.slice(36)) if (!(S.pl && p.id === S.pl.pid)) releasePlayer(p, true);
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
