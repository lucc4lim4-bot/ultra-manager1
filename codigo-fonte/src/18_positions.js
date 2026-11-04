/* ===================== position change (like EA FC's player development) ===================== */
// The coach picks a new position; the player trains it for a time that depends on how close the two positions are
// (a winger to the other wing in two weeks, a midfielder to centre-back in two months). Meanwhile he gets better in
// the new position little by little; at the end it becomes his position, the old one stays as a secondary one and
// the overall is recalculated from his attributes (like the game does when a position changes).

// outfield attributes: pace, shooting, passing, dribbling, defending, physical
const POS_WEIGHTS = {
  ST: [0.2, 0.4, 0.05, 0.2, 0, 0.15], RW: [0.3, 0.2, 0.15, 0.3, 0, 0.05], LW: [0.3, 0.2, 0.15, 0.3, 0, 0.05],
  RM: [0.25, 0.1, 0.25, 0.3, 0.05, 0.05], LM: [0.25, 0.1, 0.25, 0.3, 0.05, 0.05], CAM: [0.1, 0.2, 0.35, 0.3, 0, 0.05],
  CM: [0.05, 0.1, 0.4, 0.2, 0.15, 0.1], CDM: [0.05, 0, 0.25, 0.1, 0.4, 0.2], RB: [0.25, 0, 0.15, 0.1, 0.35, 0.15],
  LB: [0.25, 0, 0.15, 0.1, 0.35, 0.15], CB: [0.1, 0, 0.05, 0, 0.6, 0.25],
};
const posSimilarity = (from, to) => (COMPAT[to] && COMPAT[to][from]) || 0.68;
function posAttrRating(p, pos) {
  const w = POS_WEIGHTS[pos];
  if (!w || !p.a || p.a.length < 6 || p.p === 'GK') return null;
  return w.reduce((s, x, i) => s + x * p.a[i], 0);
}
// days of training for a change (younger players learn faster); a secondary position only needs a week
function posChangeDays(p, to) {
  if (p.alt && p.alt.split(',').includes(to)) return 7;
  const c = posSimilarity(p.p, to);
  const base = c >= 0.95 ? 14 : c >= 0.9 ? 28 : c >= 0.86 ? 42 : c >= 0.8 ? 63 : 90;
  return Math.round(base * (p.age <= 21 ? 0.8 : p.age >= 30 ? 1.25 : 1));
}
// overall in the new position once the change is complete
function posChangeOvr(p, to) {
  const c = posSimilarity(p.p, to);
  const a = posAttrRating(p, to), b = posAttrRating(p, p.p);
  const low = -Math.round((1 - c) * 40);
  const d = a !== null && b !== null ? clamp(Math.round(a - b), low, 3) : -Math.round((1 - c) * 20);
  const sec = p.alt && p.alt.split(',').includes(to);
  return clamp(p.o + (sec ? Math.max(d, -1) : d), 30, 99);
}
const posChangeLabel = (c) => (c >= 0.95 ? 'muito parecida' : c >= 0.88 ? 'parecida' : c >= 0.8 ? 'diferente' : 'muito diferente');
function posChangeProgress(p) {
  const pc = p.pc;
  if (!pc) return 0;
  return clamp((S.date - pc.d0) / Math.max(1, pc.days), 0, 1);
}
// fit for the position being trained: from the natural similarity towards a secondary position as he learns it
function posTrainFit(pl, slotPos, base) {
  if (!pl.pc || pl.pc.to !== slotPos) return base;
  return Math.max(base, base + (0.97 - base) * posChangeProgress(pl));
}
function startPosChange(p, to) {
  if (!POSITIONS.includes(to) || to === p.p) return { ok: false, msg: 'Escolha outra posição.' };
  if ((to === 'GK') !== (p.p === 'GK')) return { ok: false, msg: 'Goleiro não troca de posição com jogador de linha.' };
  const days = posChangeDays(p, to);
  p.pc = { to, from: p.p, d0: S.date, days, o: posChangeOvr(p, to) };
  S.pt = uniq((S.pt || []).concat(p.id));
  return { ok: true, msg: `${p.n} começou a treinar como ${POS_LONG[to].toLowerCase()}: cerca de ${weeksTxt(days)}.` };
}
function cancelPosChange(p) {
  p.pc = null;
  S.pt = (S.pt || []).filter((x) => x !== p.id);
}
const weeksTxt = (days) => (days <= 7 ? '1 semana' : `${Math.round(days / 7)} semanas`);
// daily: changes that are complete
function posChangeDaily() {
  if (!S.pt || !S.pt.length) return;
  for (const id of S.pt.slice()) {
    const p = S.players[id];
    if (!p || !p.pc) { S.pt = S.pt.filter((x) => x !== id); continue; }
    if (S.date < p.pc.d0 + p.pc.days) continue;
    const { to, from } = p.pc;
    const o0 = p.o;
    const o1 = posChangeOvr(p, to); // with the attributes of today
    const alt = (p.alt ? p.alt.split(',') : []).filter((x) => x && x !== to && x !== from);
    p.alt = [from].concat(alt).slice(0, 3).join(',');
    p.p = to;
    p.o = o1;
    p.pot = Math.max(p.o, p.pot + (o1 - o0));
    p.pc = null;
    S.pt = S.pt.filter((x) => x !== id);
    if (isUserTeam(p.t) || (p.loan && isUserTeam(p.loan.from)))
      addInbox('info', 'Comissão técnica', `${p.n} agora é ${POS_LONG[to].toLowerCase()}`,
        `${p.n} concluiu o treino de posição: agora joga como ${POS_LONG[to].toLowerCase()} (overall ${o0} → ${p.o}) e ainda pode atuar como ${POS_LONG[from].toLowerCase()}.`);
  }
}
