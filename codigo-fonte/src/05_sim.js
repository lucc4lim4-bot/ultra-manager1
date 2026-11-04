/* ===================== match simulation ===================== */
// side preparation -----------------------------------------------------------
function teamPlayersFor(teamId) {
  const t = S.teams[teamId];
  if (t.isNat) return nationSquad(t.code);
  return squadOf(teamId);
}
function prepareSide(teamId, m) {
  const t = S.teams[teamId];
  const isUser = isCoachTeam(teamId);
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
    if (S.pl && teamId === S.user.team) plShapeSide(m, lu, FORMATIONS[formation], players);
    xi = lu.xi; bench = lu.bench;
  }
  return { id: teamId, form: formation, slots: FORMATIONS[formation].map((s) => s[0]), xi: xi.slice(), bench: bench.slice(), mentality: t.ment || 0, style: isUser ? (t.sty || 'bal') : aiStyle(t) };
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
  const sb = sponsRatingBonus(side.id); // the shirt sponsor's help (energy drink, sports gear)
  return { A: A - pen + sb, M: M - pen + sb, D: (D * 0.75 + gk * 0.25) - pen + sb, GK: gk };
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
  if (S.pl && m.pls && m.pls.r === 'sub') { const k = sides.findIndex((s) => s.id === S.user.team); if (k >= 0) st.plSub = { k, min: m.pls.min || 70 }; }
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
  const f0 = sideStyle(st.sides[0]), f1 = sideStyle(st.sides[1]);
  xh *= (1 + f0.own) * (1 + f1.opp); xa *= (1 + f1.own) * (1 + f0.opp);
  const cap = zo ? 11 : 4.2;
  st.xg = [clamp(xh, 0.15, cap), clamp(xa, 0.12, cap)];
  const poss = clamp(50 + 2.2 * (R[0].M - R[1].M) + (neutral ? 0 : 3) + f0.poss - f1.poss, 26, 74);
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
    if (st.plSub && !st.plSub.done && minute >= st.plSub.min) plMakeSub(st, minute);
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
