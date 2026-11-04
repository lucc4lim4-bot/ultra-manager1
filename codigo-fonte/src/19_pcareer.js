/* ===================== player career (like FIFA): the user IS one player; the club is run by the computer ===================== */
// S.pl = { pid, focus, intensity, xp, ox, yrGain, trust, cur (this season), hist (past seasons), log (last matches), offers, obj, car, ended }
const PL_POS_NAMES = { GK: 'Goleiro', RB: 'Lateral direito', CB: 'Zagueiro', LB: 'Lateral esquerdo', CDM: 'Volante', CM: 'Meio-campista', CAM: 'Meia-atacante',
  RM: 'Meia direita', LM: 'Meia esquerda', RW: 'Ponta direita', LW: 'Ponta esquerda', ST: 'Centroavante' };
const PL_ATTR_NAMES = ['Ritmo', 'Finalização', 'Passe', 'Drible', 'Defesa', 'Físico'];
const PL_GK_ATTR_NAMES = ['Mergulho', 'Manejo', 'Chute', 'Reflexos', 'Velocidade', 'Posicionamento'];
// how much one point in each attribute (pac, sho, pas, dri, def, phy) is worth in the overall, by position group
const PL_W = { ATT: [0.2, 0.32, 0.1, 0.22, 0.02, 0.12], MID: [0.12, 0.12, 0.3, 0.22, 0.1, 0.14], DEF: [0.14, 0.02, 0.1, 0.1, 0.38, 0.26], GK: [0.2, 0.2, 0.1, 0.25, 0.05, 0.2] };
const PL_DIFF = { facil: { o: 62, pot: 90, n: 'Fácil' }, normal: { o: 58, pot: 86, n: 'Normal' }, dificil: { o: 54, pot: 82, n: 'Difícil' } };
const PL_INTENS = [['leve', 'Leve', 0.75, 2], ['normal', 'Normal', 1, 5], ['intenso', 'Intenso', 1.35, 9]]; // key, label, xp factor, fitness cost per week

function plPlayer() { return S.pl ? S.players[S.pl.pid] : null; }
function plAttrNames(p) { return p && p.p === 'GK' ? PL_GK_ATTR_NAMES : PL_ATTR_NAMES; }
function plSeasonBlank() { return { a: 0, s: 0, mn: 0, g: 0, as: 0, rs: 0, n: 0, cs: 0, yc: 0, rc: 0, w: 0, d: 0, l: 0 }; }

// ---------- creation
function plCreate(o, teamId) {
  const d = PL_DIFF[o.diff] || PL_DIFF.normal;
  const age = clamp(o.age || 18, 16, 22);
  const ovr = clamp(Math.round(d.o + (age - 17) * 1.6 + rint(-2, 2)), 45, 72);
  const pot = clamp(d.pot + rint(-2, 2), ovr + 10, 94);
  const p = generatePlayer({ nat: o.nat || 'BRA', age, ovr, pos: o.pos || 'ST', potBoost: pot - ovr });
  p.n = o.name; p.s = o.name.split(' ').slice(-1)[0] || o.name; p.f = o.foot === 'L' ? 'L' : 'R';
  p.pot = pot; p.yth = 0; p.mine = 1;
  p.h = o.pos === 'GK' ? rint(184, 196) : rint(170, 188);
  movePlayer(p, teamId, { ct: seasonEndYear() + 2, w: 0 });
  p.w = Math.round(wageDemand(p, S.teams[teamId]) * 0.9);
  S.pl = { pid: p.id, focus: 'bal', intensity: 'normal', xp: 0, ox: 0, yrGain: 0, trust: 45, cur: plSeasonBlank(), hist: [], log: [], offers: [], obj: null,
    car: plSeasonBlank(), ended: 0, teams: [{ team: teamId, from: S.date }], trLog: [], lastFb: 0, started: S.date, fav: o.fav || 0, offD: 0 };
  S.coach.name = o.name; S.coach.age = age;
  S.noFire = true;
  plSeasonStart(true);
  addInbox('info', 'Empresário', `Começa a sua carreira ${tA(S.teams[teamId], 'no')}!`,
    `${o.name}, ${age} anos, ${PL_POS_NAMES[p.p].toLowerCase()}. Você começa com ${p.o} de overall e potencial para chegar a ${p.pot}. Treine, jogue bem e conquiste a confiança do treinador para ganhar minutos. Ajuste o foco do treino na aba Jogador.`);
  return p;
}

// ---------- role in the squad
function plGroupSlots(p, form) {
  const slots = FORMATIONS[form || '4-3-3'] || FORMATIONS['4-3-3'];
  const g = POS_GROUP[p.p];
  return slots.filter((s) => POS_GROUP[s[0]] === g).length;
}
// rank of the player among the players of his position group at a club (by overall), and the matching role
function plRoleAt(teamId, p) {
  const t = S.teams[teamId];
  const sq = squadOf(teamId).filter((q) => q.id !== p.id && POS_GROUP[q.p] === POS_GROUP[p.p]);
  const better = sq.filter((q) => q.o + formBonus(q) > p.o + formBonus(p)).length;
  const n = plGroupSlots(p, t && t.form);
  const label = better < Math.max(1, Math.round(n * 0.35)) && p.o >= teamRating(teamId) + 2 ? 'Craque do time' : better < n ? 'Titular' : better < n + 2 ? 'Rodízio' : 'Reserva';
  return { rank: better, n, label };
}
function plRole() { const p = plPlayer(); return p ? plRoleAt(p.t, p) : { rank: 0, n: 1, label: '—' }; }

// ---------- lineup: the computer picks the XI, then the player is placed in / out according to his role and the coach's trust
function plShapeSide(m, lu, slots, players) {
  const pl = S.pl, p = S.players[pl.pid];
  if (!p || pl.ended) return;
  const day = m.d;
  let dec = m.pls;
  const bestSlot = () => { let bi = 0, bv = -1; slots.forEach((s, i) => { const v = posFit(p, s[0]) * 100 - (s[0] === 'GK' && p.p !== 'GK' ? 50 : 0) - (p.p === 'GK' && s[0] !== 'GK' ? 50 : 0); if (v > bv) { bv = v; bi = i; } }); return bi; };
  if (!dec) {
    if (!available(p, day)) dec = { r: 'out', why: isInjured(p, day) ? 'lesionado' : isSuspended(p) ? 'suspenso' : 'indisponível' };
    else if (lu.xi.includes(p.id)) dec = { r: 'start' };
    else {
      const bi = bestSlot();
      const inc = S.players[lu.xi[bi]];
      const gap = inc ? effRating(inc, slots[bi][0], day) - effRating(p, slots[bi][0], day) : -99;
      const fresh = fitnessNow(p, day) >= 62;
      const cup = S.comps[m.c] && S.comps[m.c].kind !== 'league';
      let pStart = clamp(0.55 + (pl.trust - 50) / 170 - gap * 0.08 + (cup ? 0.12 : 0), 0, 0.85);
      if (gap > 8 || !fresh) pStart = 0;
      if (rnd() < pStart) dec = { r: 'start' };
      else {
        const rest = players.filter((q) => !lu.xi.includes(q.id) && available(q, day)).sort(by((q) => q.o, -1));
        const rk = rest.findIndex((q) => q.id === p.id);
        dec = rk >= 0 && rk < 9 || gap < 9 ? { r: 'sub', min: rint(58, 82) } : { r: 'out', why: 'fora da lista de relacionados' };
      }
    }
    m.pls = dec;
  }
  const i0 = lu.xi.indexOf(p.id);
  if (dec.r === 'start') {
    if (i0 < 0) {
      const bi = bestSlot(), old = lu.xi[bi];
      lu.xi[bi] = p.id; lu.bench = lu.bench.filter((id) => id !== p.id);
      if (old) lu.bench.unshift(old);
    }
  } else {
    if (i0 >= 0) {
      const used = new Set(lu.xi);
      const cand = players.filter((q) => q.id !== p.id && available(q, day) && !used.has(q.id)).sort(by((q) => effRating(q, slots[i0][0], day), -1))[0];
      lu.xi[i0] = cand ? cand.id : 0;
      if (cand) lu.bench = lu.bench.filter((id) => id !== cand.id);
    }
    lu.bench = lu.bench.filter((id) => id !== p.id);
    if (dec.r === 'sub') lu.bench = [p.id].concat(lu.bench).slice(0, 9);
  }
}
// planned substitution (simulated matches): he comes on for the weakest/most tired player of his position
function plMakeSub(st, minute) {
  const ps = st.plSub; ps.done = true;
  const side = st.sides[ps.k], p = S.players[S.pl.pid];
  if (!p || !side.bench.includes(p.id) || st.subsLeft[ps.k] <= 0 || rnd() < 0.1) return;
  const g = POS_GROUP[p.p];
  let bi = -1, bv = 1e9;
  side.on.forEach((pid, i) => {
    const q = S.players[pid];
    if (!q || (g === 'GK') !== (side.slotsOn[i] === 'GK')) return;
    if (g !== 'GK' && POS_GROUP[side.slotsOn[i]] !== g && rnd() < 0.7) return;
    const v = effRating(q, side.slotsOn[i]) - (st.ratings[pid] - 6.3) * 4 - (q.p === p.p ? 0 : 1.5);
    if (v < bv) { bv = v; bi = i; }
  });
  if (bi >= 0) doSub(st, ps.k, bi, p.id, minute);
}

// ---------- after each match of his club
function plAfterMatch(m, st) {
  const pl = S.pl, p = S.players[pl.pid];
  if (!p || pl.ended) return;
  const uid = S.user.team;
  const k = m.h === uid ? 0 : 1;
  const mm = st.mins[p.id];
  const c = S.comps[m.c];
  const cur = pl.cur;
  const gf = k === 0 ? m.hg : m.ag, ga = k === 0 ? m.ag : m.hg;
  const dec = m.pls ? m.pls.r : 'start';
  const res = gf > ga ? 'V' : gf < ga ? 'D' : 'E';
  if (res === 'V') cur.w++; else if (res === 'E') cur.d++; else cur.l++;
  const row = { d: m.d, c: c ? c.short || c.name : '', o: k === 0 ? m.a : m.h, h: k === 0 ? 1 : 0, gf, ga, mn: 0, g: 0, as: 0, r: 0, s: dec === 'start' ? 1 : 0, res, why: m.pls && m.pls.why || '' };
  if (mm) {
    const minutes = clamp((mm.out ?? (st.et ? 120 : 90)) - mm.in, 0, 120);
    row.mn = minutes;
    row.g = st.ev.filter((e) => e.t === 'goal' && e.p === p.id && e.s === k).length;
    row.as = st.ev.filter((e) => e.t === 'goal' && e.p2 === p.id && e.s === k).length;
    row.r = (m.rt && m.rt[p.id]) || 6.3;
    row.s = mm.in === 0 ? 1 : 0;
    cur.a++; cur.s += row.s; cur.mn += minutes; cur.g += row.g; cur.as += row.as;
    if (minutes >= 20) { cur.rs += row.r; cur.n++; }
    if (ga === 0 && minutes >= 60 && (POS_GROUP[p.p] === 'DEF' || p.p === 'GK')) cur.cs++;
    cur.yc += st.ev.filter((e) => e.t === 'yellow' && e.p === p.id).length;
    cur.rc += st.ev.filter((e) => e.t === 'red' && e.p === p.id).length;
    const car = pl.car;
    car.a++; car.s += row.s; car.mn += minutes; car.g += row.g; car.as += row.as; if (minutes >= 20) { car.rs += row.r; car.n++; }
    if (minutes >= 20) {
      // coach's trust: good games earn minutes, bad ones lose them
      pl.trust = clamp(pl.trust + (row.r - 6.6) * 3.2 + row.g * 2 + row.as * 1.2, 0, 100);
      p.mor = clamp((p.mor || 70) + (row.r - 6.5) * 3 + (res === 'V' ? 2 : res === 'D' ? -2 : 0), 5, 100);
      pl.form5 = (pl.form5 || []).concat(row.r).slice(-5);
    }
    if (row.g >= 3) addNews(`${p.n} faz ${row.g} gols ${tA(S.teams[uid], 'no')}!`, `Hat-trick de ${p.n} na partida contra ${teamName(row.o)} (${gf} x ${ga}).`, 'clube', [uid], { cat: 'Destaque', hot: true });
    else if (row.r >= 9) addNews(`${p.n} brilha em ${gf} x ${ga} contra ${teamName(row.o)}`, `Nota ${row.r.toFixed(1)}: ${p.n} foi o craque da partida.`, 'clube', [uid], { cat: 'Destaque' });
  } else {
    // did not play
    pl.trust = clamp(pl.trust + (dec === 'sub' ? -0.6 : -0.3), 0, 100);
    p.mor = clamp((p.mor || 70) - (dec === 'out' ? 0.5 : 1.5), 5, 100);
  }
  pl.log = [row].concat(pl.log || []).slice(0, 80);
  // the coach talks to the player now and then
  if (S.date - (pl.lastFb || 0) > 28 && (pl.form5 || []).length >= 4) {
    pl.lastFb = S.date;
    const avg = pl.form5.reduce((a, b) => a + b, 0) / pl.form5.length;
    if (avg >= 7.3) addInbox('player', 'Treinador', 'Parabéns pela fase', `Você está jogando muito bem (média ${avg.toFixed(1)} nos últimos jogos). Continue assim que a vaga é sua.`);
    else if (avg < 6.2) addInbox('player', 'Treinador', 'Precisamos de mais de você', `Suas últimas atuações (média ${avg.toFixed(1)}) ficaram abaixo do esperado. Capriche no treino e na partida para manter o seu lugar.`);
  }
}

// +1 on an attribute, and the overall follows by the attribute's weight (capped per year by age)
function plBump(pl, p, g, cap, i) {
  const before = p.a[i];
  if (before < 99) p.a[i] = before + 1;
  pl.ox += (PL_W[g] || PL_W.MID)[i];
  let o = 0;
  while (pl.ox >= 1 && p.o < p.pot && pl.yrGain < cap) { pl.ox -= 1; p.o++; pl.yrGain++; o++; }
  if (p.o >= p.pot || pl.yrGain >= cap) pl.ox = Math.min(pl.ox, 0.99);
  pl.trLog = [{ d: S.date, a: i, o }].concat(pl.trLog || []).slice(0, 10);
}
// result of a drill played in the 2D training: XP once a week per drill
function plDrill(kind, score, total) {
  const pl = S.pl;
  if (!pl || pl.ended || !total) return null;
  pl.drill = pl.drill || {};
  const last = pl.drill[kind] || -99;
  if (S.date - last < 7) return { xp: 0, wait: 7 - (S.date - last) };
  pl.drill[kind] = S.date;
  const i = kind === 'pass' ? 2 : 1;
  const xp = Math.round(score / total * 40) / 10;
  pl.dxp = pl.dxp || [0, 0, 0, 0, 0, 0];
  pl.dxp[i] += xp;
  return { xp, i };
}

// ---------- weekly: training, offers
function plWeek() {
  const pl = S.pl, p = S.players[pl.pid];
  if (!p || pl.ended) return;
  const inj = isInjured(p);
  const it = PL_INTENS.find((x) => x[0] === pl.intensity) || PL_INTENS[1];
  let base = p.age <= 18 ? 2 : p.age <= 20 ? 1.7 : p.age <= 22 ? 1.35 : p.age <= 25 ? 1 : p.age <= 28 ? 0.6 : p.age <= 31 ? 0.3 : 0.1;
  base *= inj ? 0.3 : 1;
  base *= 0.75 + clamp(p.mor || 70, 0, 100) / 200;
  pl.xp += base * it[2] + (pl.bonusXp ? Math.min(pl.bonusXp, 3) : 0);
  if (pl.bonusXp) pl.bonusXp = Math.max(0, pl.bonusXp - 3);
  if (!inj && it[3] > 0) setFitness(p, fitnessNow(p) - it[3] + 3, S.date);
  const cap = p.age <= 19 ? 6 : p.age <= 22 ? 5 : p.age <= 26 ? 3 : p.age <= 30 ? 2 : 1;
  const g = POS_GROUP[p.p];
  let guard = 0;
  while (pl.xp >= 6 && guard++ < 6) {
    pl.xp -= 6;
    let i;
    if (pl.focus === 'bal') {
      const w = PL_W[g] || PL_W.MID, tot = w.reduce((a, b) => a + b, 0);
      let r = rnd() * tot; i = 0; for (; i < 5; i++) { r -= w[i]; if (r <= 0) break; }
    } else i = clamp(+pl.focus, 0, 5);
    if (!p.a) continue;
    plBump(pl, p, g, cap, i);
  }
  // set-piece drills (penalties, free kicks, passes) feed one attribute directly
  if (pl.dxp && p.a) for (let i = 0; i < 6; i++) { let n = 0; while ((pl.dxp[i] || 0) >= 6 && n++ < 3) { pl.dxp[i] -= 6; plBump(pl, p, g, cap, i); } }
  // mid-season offers in the transfer windows
  if (isWindowOpen() && S.date - (pl.offD || 0) > 28 && (!pl.offers.length)) {
    const best = p.o + formBonus(p) + (pl.trust > 70 ? 2 : 0);
    const chance = (pl.req ? 0.5 : 0.1) + clamp((best - teamRating(p.t) - 2) * 0.05, 0, 0.35) + (pl.trust < 30 ? 0.1 : 0);
    if (rnd() < chance) { pl.offD = S.date; plAddOffers(2, true); }
  }
  pl.offers = pl.offers.filter((o) => !o.exp || o.exp >= S.date);
}
function plClubZone(id) { return isSAteam(id) ? 'SA' : 'EU'; }
function plAddOffers(n, sameZone) {
  const pl = S.pl, p = S.players[pl.pid];
  const mv = p.o + formBonus(p) + (p.age <= 21 ? Math.max(0, p.pot - p.o) * 0.2 : 0);
  const myZone = plClubZone(p.t);
  const cand = careerClubIds().filter((id) => id !== p.t && !pl.offers.some((o) => o.team === id) && (!sameZone || plClubZone(id) === myZone))
    .map((id) => ({ id, r: teamRating(id) })).filter((x) => x.r >= mv - 12 && x.r <= mv + 4).map((x) => ({ id: x.id, r: x.r, sc: Math.abs(x.r - (mv - 2)) + rnd() * 6 })).sort(by((x) => x.sc));
  const made = [];
  for (const c of cand) {
    if (made.length >= n) break;
    const t = S.teams[c.id];
    const role = plRoleAt(c.id, p);
    const w = roundMoney(wageDemand(p, t) * rfloat(1, 1.25));
    const o = { id: nextId('of'), team: c.id, w, y: rint(2, 5), role: role.label, r: Math.round(c.r * 10) / 10, exp: S.date + 30 };
    pl.offers.push(o); made.push(o);
    addInbox('offer', teamName(c.id), `${teamName(c.id)} quer você`, `${teamName(c.id)} apresentou uma proposta: contrato de ${o.y} anos e papel de ${role.label.toLowerCase()}. Veja na aba Agente.`);
  }
  return made;
}
function plAcceptOffer(id) {
  const pl = S.pl, p = S.players[pl.pid];
  const o = pl.offers.find((x) => x.id === id);
  if (!o || !p) return '';
  const old = p.t;
  pl.teams[pl.teams.length - 1].to = S.date;
  takeJob(o.team);
  movePlayer(p, o.team, { ct: seasonEndYear() + o.y, w: o.w });
  p.w = o.w;
  pl.teams.push({ team: o.team, from: S.date });
  pl.offers = []; pl.req = 0; pl.trust = 42; pl.offD = S.date; pl.form5 = [];
  addNews(`${p.n} é anunciado ${tA(S.teams[o.team], 'no')}`, `${teamName(o.team)} contrata ${p.n} (${p.age} anos, ${p.p}, overall ${p.o}) do ${teamName(old)}.`, 'clube', [o.team, old], { cat: 'Mercado', hot: p.o >= 78 });
  plSeasonStart(false);
  return `Você assinou com ${tA(o.team, 'o')}!`;
}
function plRenew(o) {
  const pl = S.pl, p = S.players[pl.pid];
  p.ct = seasonEndYear() + o.y; p.w = o.w;
  return `Contrato renovado até ${p.ct}.`;
}

// ---------- seasons
function plSeasonStart(first) {
  const pl = S.pl, p = S.players[pl.pid];
  if (!p) return;
  if (!first || true) pl.cur = plSeasonBlank();
  const role = plRoleAt(p.t, p);
  const g = POS_GROUP[p.p];
  const star = role.label === 'Craque do time' || role.label === 'Titular';
  const obj = [];
  obj.push({ k: 'starts', t: `Ser titular em ${star ? 22 : role.label === 'Rodízio' ? 14 : 8} jogos`, v: star ? 22 : role.label === 'Rodízio' ? 14 : 8 });
  obj.push({ k: 'rate', t: `Nota média ${star ? '6.9' : '6.6'} ou mais`, v: star ? 6.9 : 6.6 });
  if (g === 'GK' || g === 'DEF') obj.push({ k: 'cs', t: `${g === 'GK' ? 'Jogos sem sofrer gol' : 'Jogos sem sofrer gol (em campo)'}: ${star ? 9 : 4}`, v: star ? 9 : 4 });
  else obj.push({ k: 'ga', t: `Gols + assistências: ${g === 'ATT' ? (star ? 14 : 6) : (star ? 8 : 3)}`, v: g === 'ATT' ? (star ? 14 : 6) : (star ? 8 : 3) });
  pl.obj = obj;
  const t = S.teams[p.t];
  addInbox('info', 'Treinador', `Temporada ${seasonLabel(yearOf(S.date), userLeagueZone())}`, `Seu papel no elenco ${tA(t, 'do')}: ${role.label.toLowerCase()}. Metas do ano: ${obj.map((x) => x.t).join(' · ')}.`);
}
function plObjDone(o) {
  const c = S.pl.cur;
  return o.k === 'starts' ? c.s >= o.v : o.k === 'rate' ? c.n > 0 && c.rs / c.n >= o.v : o.k === 'cs' ? c.cs >= o.v : (c.g + c.as) >= o.v;
}
function plSeasonSummary() {
  const pl = S.pl, p = S.players[pl.pid], uid = S.user.team;
  const sum = { d: S.date, team: uid, pl: true, unemployed: false, titles: [], coins: 0, offers: [] };
  const since = S.seasonStart;
  sum.titles = S.coach.trophies.filter((tr) => tr.d >= since - 400 && tr.d <= S.date && !tr.reported);
  sum.titles.forEach((tr) => { tr.reported = true; sum.coins += tr.coins; });
  const lc = S.active.map((id) => S.comps[id]).find((c) => c && c.kind === 'league' && c.teams.includes(uid));
  if (lc) { const tab = sortTable(lc.table, lc.teams); sum.pos = tab.findIndex((r) => r.id === uid) + 1; sum.league = lc.name; sum.n = lc.teams.length; }
  sum.cur = Object.assign({}, pl.cur);
  sum.objs = (pl.obj || []).map((o) => ({ t: o.t, ok: plObjDone(o) }));
  sum.ovr = p.o; sum.age = p.age;
  // an offer to renew (when the contract ends this season) and proposals from other clubs
  const expiring = p.ct <= seasonEndYear();
  if (pl.trust >= 25 || !expiring) sum.renew = { id: 0, team: uid, w: roundMoney(wageDemand(p, S.teams[uid]) * rfloat(1.05, 1.3)), y: rint(2, 4), role: plRole().label };
  pl.offers = [];
  plAddOffers(3, false);
  sum.offers = pl.offers.slice();
  sum.expiring = expiring;
  return sum;
}
function plCloseSeason(sum, choice) {
  const pl = S.pl, p = S.players[pl.pid];
  const done = (sum.objs || []).filter((o) => o.ok).length;
  pl.bonusXp = (pl.bonusXp || 0) + done * 6;
  pl.trust = clamp(pl.trust + done * 4, 0, 100);
  pl.hist.push({ y: yearOf(sum.d), team: sum.team, ovr: sum.ovr, age: sum.age, cur: sum.cur, pos: sum.pos || 0, league: sum.league || '', titles: sum.titles.length });
  if (choice && choice.offerId) { const msg = plAcceptOffer(choice.offerId); if (msg) toast(msg); }
  else if (choice && choice.renew && sum.renew) plRenew(sum.renew);
  else if (sum.expiring) plRenew(sum.renew || { y: 1, w: p.w });
  pl.offers = [];
  if (p.age >= 33 && p.o < 60) addInbox('info', 'Empresário', 'A carreira está chegando ao fim?', 'Seus números caíram. Você pode se aposentar na aba Agente quando quiser.');
}

// ---------- yearly (July): after aging & development
function plYearly() {
  const pl = S.pl, p = S.players[pl.pid];
  if (!p || pl.ended) return;
  pl.yrGain = 0; pl.ox = 0;
  if (p.age >= 41) plRetire('Aos ' + p.age + ' anos o corpo pediu descanso.');
  if (p.t && !isSAteam(p.t)) { /* contract expiry is settled in the season-end screen */ }
}
function plRetire(why) {
  const pl = S.pl, p = S.players[pl.pid];
  if (!p || pl.ended) return;
  pl.ended = S.date;
  pl.endWhy = why || '';
  pl.hist.push({ y: yearOf(S.date), team: p.t, ovr: p.o, age: p.age, cur: Object.assign({}, pl.cur), pos: 0, league: '', titles: 0, partial: 1 });
  pl.teams[pl.teams.length - 1].to = S.date;
  addNews(`${p.n} anuncia a aposentadoria`, `Aos ${p.age} anos, ${p.n} encerra a carreira com ${pl.car.a} jogos, ${pl.car.g} gols e ${pl.car.as} assistências.`, 'clube', [p.t], { cat: 'Bastidores', hot: true });
  S.pendingEnd = null;
}
