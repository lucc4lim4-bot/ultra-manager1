/* ===================== tactics: mentality levels, playing styles and ready-made tactic presets ===================== */
const MENTS = [[-2, 'Muito defensiva'], [-1, 'Defensiva'], [0, 'Equilibrada'], [1, 'Ofensiva'], [2, 'Muito ofensiva']];
// own: change of the team's own chances; opp: change of the opponent's chances; poss: possession points
const STYLES = {
  bal: { n: 'Equilibrado', d: 'Sem ênfase.', own: 0, opp: 0, poss: 0 },
  press: { n: 'Pressão alta', d: 'Marca no campo do rival e retoma a bola rápido.', own: 0.05, opp: -0.04, poss: 2 },
  counter: { n: 'Contra-ataque', d: 'Recua, espera e sai em velocidade.', own: 0.045, opp: -0.025, poss: -3 },
  poss: { n: 'Posse de bola', d: 'Toques curtos e paciência para controlar o jogo.', own: 0.02, opp: -0.06, poss: 5 },
  wings: { n: 'Jogo pelas pontas', d: 'Alarga o time e cruza muito.', own: 0.05, opp: 0, poss: 0 },
  long: { n: 'Bola longa', d: 'Ligação direta, lançamentos para o ataque.', own: 0.03, opp: 0.02, poss: -3 },
};
const STYLE_KEYS = Object.keys(STYLES);
function mentLabel(v) { return (MENTS.find((x) => x[0] === v) || MENTS[2])[1]; }
// the computer's clubs have a style too (stable per club)
function aiStyle(t) {
  const h = (t.id * 2654435761) >>> 0;
  const r = h % 10;
  return r < 4 ? 'bal' : r === 4 ? 'press' : r === 5 ? 'counter' : r === 6 ? 'poss' : r === 7 ? 'wings' : r === 8 ? 'long' : 'bal';
}
const sideStyle = (side) => STYLES[side.style] || STYLES.bal;

// ---- presets (up to 8): formation + mentality + style (+ the lineup it was saved with)
function tacticPresets() { return S.tactics || (S.tactics = []); }
function saveTacticPreset(name) {
  const t = S.teams[S.user.team], list = tacticPresets();
  if (list.length >= 8) return { ok: false, msg: 'Máximo de 8 táticas prontas. Apague uma antes.' };
  list.push({ id: (S.tacticSeq = (S.tacticSeq || 0) + 1), name: (name || '').trim().slice(0, 24) || `Tática ${list.length + 1}`, form: t.form || '4-3-3', ment: t.ment || 0, sty: t.sty || 'bal', xi: (t.xi || []).slice(), bench: (t.bench || []).slice() });
  return { ok: true };
}
function updateTacticPreset(id) {
  const t = S.teams[S.user.team], p = tacticPresets().find((x) => x.id === id);
  if (!p) return false;
  Object.assign(p, { form: t.form || '4-3-3', ment: t.ment || 0, sty: t.sty || 'bal', xi: (t.xi || []).slice(), bench: (t.bench || []).slice() });
  return true;
}
function deleteTacticPreset(id) { S.tactics = tacticPresets().filter((x) => x.id !== id); }
// before the match / in the squad screen: sets the club's tactic (the lineup comes back if everybody is still available)
function applyTacticPreset(id) {
  const t = S.teams[S.user.team], p = tacticPresets().find((x) => x.id === id);
  if (!p) return null;
  t.form = p.form; t.ment = p.ment; t.sty = p.sty;
  const sq = new Set(squadOf(t.id).map((q) => q.id));
  const ok = p.xi && p.xi.length === 11 && p.xi.every((pid) => pid && sq.has(pid) && !isInjured(S.players[pid]) && !isSuspended(S.players[pid]));
  if (ok) { t.xi = p.xi.slice(); t.bench = (p.bench || []).filter((pid) => sq.has(pid) && !p.xi.includes(pid)); }
  else { const lu = autoLineup(squadOf(t.id), t.form); t.xi = lu.xi; t.bench = lu.bench.slice(0, 12); }
  return { name: p.name, lineupKept: ok };
}
// during a match: formation, mentality and style change on the spot (the 11 on the pitch are re-arranged by position)
function changeFormationLive(st, k, form) {
  const side = st.sides[k], slots = FORMATIONS[form];
  if (!slots || side.form === form) return false;
  const live = side.on.filter(Boolean);
  if (live.length !== 11) return false; // not with a sent-off player
  const gkSlot = side.slotsOn.indexOf('GK');
  const gkPid = gkSlot >= 0 ? side.on[gkSlot] : 0;
  const left = live.filter((pid) => pid !== gkPid);
  const on = new Array(11).fill(0);
  const order = slots.map((s, i) => i).sort((a, b) => (slots[a][0] === 'GK' ? -1 : 0) - (slots[b][0] === 'GK' ? -1 : 0));
  for (const i of order) {
    const pos = slots[i][0];
    if (pos === 'GK') { on[i] = gkPid; continue; }
    let bi = -1, bs = -1e9;
    left.forEach((pid, j) => { if (pid == null) return; const r = effRating(S.players[pid], pos, S.date); if (r > bs) { bs = r; bi = j; } });
    on[i] = left[bi]; left[bi] = null;
  }
  side.form = form; side.on = on; side.slotsOn = slots.map((s) => s[0]); side.slots = side.slotsOn.slice();
  return true;
}
function liveTactic(st, k, o) {
  const side = st.sides[k];
  if (o.ment !== undefined) side.mentality = o.ment;
  if (o.sty) side.style = o.sty;
  const changed = o.form ? changeFormationLive(st, k, o.form) : false;
  computeRatesLive(st);
  return changed;
}
