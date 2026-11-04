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
  const ids = activeClubIds().filter((id) => !isCoachTeam(id));
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
  if (!fast && S.user.team && !S.coach.unemployed && !S.pl) aiOffersForUser();
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
    if (isCoachTeam(tid)) continue;
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
  const clubs = activeClubIds().filter((id) => !isCoachTeam(id) && S.teams[id] && !S.teams[id].ext);
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
      if (isCoachTeam(p.t) || (S.pl && p.id === S.pl.pid)) continue;
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
  const sq = squadOf(t.id).filter((p) => !isCoachTeam(p.t) && !(S.pl && p.id === S.pl.pid) && !(p.joined && S.date - p.joined < 120)).sort(by((p) => p.o + (p.age <= 21 ? 6 : 0)));
  const p = sq[0];
  if (!p || squadOf(t.id).length <= (force ? 18 : 20)) return;
  // sell to an external / smaller club
  const buyers = activeClubIds().map((id) => S.teams[id]).filter((x) => x && x.id !== t.id && !isCoachTeam(x.id) && teamRating(x.id) <= p.o + 3 && teamRating(x.id) >= p.o - 8);
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
    if (!loanOffer && rnd() < 0.3) { // a swap: the club puts one of its players in the deal
      const cand = squadOf(buyer.id).filter((q) => q.id !== p.id && !q.loan && swapValue(q) >= fee * 0.2 && swapValue(q) <= fee * 0.75 && q.o >= p.o - 12);
      if (cand.length) { const q = pick(cand); o.swap = q.id; o.cash = Math.max(0, fee - swapValue(q)); o.fee = o.cash + swapValue(q); o.maxPay = Math.max(o.maxPay, o.fee); }
    }
    S.tr.offers.push(o);
    addInbox('offer', teamName(buyer.id), loanOffer ? `Proposta de empréstimo por ${p.n}` : `Proposta por ${p.n}`,
      loanOffer ? `${teamName(buyer.id)} quer ${p.n} emprestado até o fim da temporada e promete minutos. Jogador emprestado que joga evolui mais rápido.` :
        (o.swap ? `${teamName(buyer.id)} oferece ${S.players[o.swap].n} (${S.players[o.swap].o} de overall, ${S.players[o.swap].age} anos) mais ${fmtMoney(o.cash)} por ${p.n} (valor de mercado: ${fmtMoney(val)}).` : `${teamName(buyer.id)} oferece ${fmtMoney(fee)} por ${p.n} (valor de mercado: ${fmtMoney(val)}).`), { offer: o.id });
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
    else if (o.swap) {
      const q = S.players[o.swap], ut = S.teams[p.t];
      if (q && q.t === o.from && squadOf(ut.id).length < 36) {
        const cash = o.cash || 0;
        executeTransfer(p, o.from, cash, { w: wageDemand(p, S.teams[o.from]) });
        executeTransfer(q, ut.id, 0, { w: q.w || wageDemand(q, ut), ct: q.ct || seasonEndYear() + 2 });
        S.board.conf = clamp(S.board.conf + 1, 0, 100);
        return { msg: `Troca fechada: ${p.n} vai ${tA(o.from, 'ao')} e ${q.n} chega${cash ? ` (mais ${fmtMoney(cash)})` : ''}.`, done: true };
      }
      executeTransfer(p, o.from, o.cash || 0, { w: wageDemand(p, S.teams[o.from]) });
    }
    else executeTransfer(p, o.from, o.fee, { w: wageDemand(p, S.teams[o.from]) });
    S.board.conf = clamp(S.board.conf + (o.fee > playerValue(p) ? 2 : 0), 0, 100);
    return { msg: o.loan ? `${p.n} foi emprestado ${tA(o.from, 'ao')}.` : `${p.n} foi vendido ${tA(o.from, 'ao')} por ${fmtMoney(o.fee)}.`, done: true };
  }
  if (action === 'counter') {
    o.rounds++;
    if (counterFee <= o.maxPay) {
      o.fee = roundMoney(counterFee); if (o.swap) o.cash = Math.max(0, o.fee - swapValue(S.players[o.swap]));
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
// a player offered in a swap: the other club values him a bit under the market (older players even less)
function swapValue(q) { return roundMoney(playerValue(q) * (q.age <= 29 ? 0.9 : q.age <= 32 ? 0.72 : 0.5)); }
function swapTotal(pids) { return sum(pids || [], (id) => (S.players[id] ? swapValue(S.players[id]) : 0)); }
// a star of a big club does not go on loan to a much smaller club (a 5-star club's player turns down 3- and 4-star clubs)
function loanSnub(p, dest) {
  if (!p.t || !dest || p.o < 78) return '';
  const ps = stars(teamRating(p.t)), ds = stars(teamRating(dest.id));
  if ((ps >= 4.5 && ds <= 4) || ps - ds >= 1.5) return `${p.n} não aceita jogar emprestado num clube de ${String(ds).replace('.', ',')} estrelas: ${teamName(p.t)} e ele querem algo à altura.`;
  return '';
}
function clubResponse(p, fee, loan) {
  const seller = S.teams[p.t];
  if (!p.t) return { ok: true, free: true };
  if (seller && seller.isNat) return { ok: false, msg: 'Jogador indisponível.' };
  if (loan) {
    const no = loanSnub(p, S.teams[S.user.team]);
    if (no) return { ok: false, msg: no };
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
function userSign(p, fee, wage, years, loan, swap) {
  const t = S.teams[S.user.team];
  swap = (swap || []).filter((id) => S.players[id] && S.players[id].t === t.id);
  const out = swap.map((id) => S.players[id]);
  if (!loan && p.t && fee < 0 && S.teams[p.t] && S.teams[p.t].budget < -fee) return { ok: false, msg: `${teamName(p.t)} não tem caixa para pagar a diferença.` };
  if (!isWindowOpen() && p.t) return { ok: false, msg: 'A janela de transferências está fechada.' };
  if (!loan && fee > t.budget) return { ok: false, msg: 'Orçamento de transferências insuficiente.' };
  if (wageBill(t.id) - sum(out, (q) => q.w || 0) + wage > t.wb * 1.02) {
    const need = niceWage(wageBill(t.id) + wage - t.wb);
    return { ok: false, wbNeed: need, msg: `O salário estoura a folha salarial definida pela diretoria (faltam ${fmtMoney(need)}/semana). Você pode remanejar verba do orçamento de transferências para a folha.` };
  }
  if (squadOf(t.id).length - out.length >= 36) return { ok: false, msg: 'O elenco já tem 36 jogadores (limite).' };
  if (loan) {
    const snub = loanSnub(p, t);
    if (snub) return { ok: false, msg: snub };
    const from = p.t;
    executeTransfer(p, t.id, 0, { loanFrom: from, until: seasonEndDay() });
    p.w = wage;
  } else {
    const dest = p.t;
    executeTransfer(p, t.id, fee, { w: wage, ct: seasonEndYear() + years - 1 });
    for (const q of out) executeTransfer(q, dest, 0, { w: q.w, ct: q.ct });
  }
  addNews(pick([`${t.n} anuncia ${p.n}`, `Oficial: ${p.n} é ${tA(t, 'do')}`]), `${p.n} (${POS_LONG[p.p].toLowerCase()}, ${p.o} de overall) chega ${loan ? 'por empréstimo' : fee ? `por ${fmtMoney(fee)}` : 'sem custos'} para reforçar ${tA(t)} de ${S.coach.name}.`, 'transfer', [t.id], { cat: 'Mercado da bola', fee });
  return { ok: true, msg: out.length ? `${p.n} assinou com ${tA(t)}! Na troca saíram ${out.map((q) => q.n).join(', ')}.` : `${p.n} assinou com ${tA(t)}!` };
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
