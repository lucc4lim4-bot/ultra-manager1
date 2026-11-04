/* ===================== match day: pre-match, live, post ===================== */
function matchWeather(m) {
  const h = hashStr('w' + m.id);
  const t = ymd(m.d);
  const host = S.teams[m.h];
  const c = host ? host.c : 'ENG';
  const south = ['BRA', 'ARG', 'URU', 'PAR', 'CHI', 'RSA', 'AUS', 'BOL', 'PER'].includes(c);
  const hot = ['KSA', 'EGY', 'QAT', 'MEX', 'USA', 'COL', 'ECU', 'VEN'].includes(c) || (c === 'BRA' && t.m !== 6 && t.m !== 7);
  const winter = south ? (t.m >= 6 && t.m <= 8) : (t.m === 12 || t.m <= 2);
  let temp = hot ? 24 + (h % 9) : winter ? -1 + (h % 10) : 11 + (h % 13);
  const r = (h >> 5) % 100;
  let kind = 'sun';
  if (r < (winter ? 32 : hot ? 12 : 22)) kind = 'rain';
  else if (r < 50) kind = 'cloud';
  if (winter && temp <= 1 && r < 18 && !south) kind = 'snow';
  const night = parseInt(m.t) >= 18;
  const label = { sun: night ? 'Céu limpo' : 'Ensolarado', cloud: 'Nublado', rain: 'Chuva', snow: 'Neve' }[kind];
  const icon = { sun: night ? '🌙' : '☀️', cloud: '☁️', rain: '🌧️', snow: '❄️' }[kind];
  return { kind, temp, label, icon, night };
}
act('goMatch', (el) => {
  const m = S.matches[+el.dataset.id];
  if (!m) return;
  UI.match = { mid: m.id, phase: 'pre' };
  UI.screen = 'match';
  closeAllModals();
  render();
  window.scrollTo(0, 0);
});
function sideColumn(teamId, prep, isUser) {
  const t = S.teams[teamId];
  const xi = prep.xi.map((id, i) => ({ p: S.players[id], pos: prep.slots[i] }));
  return `<div class="panel"><div class="row" style="margin-bottom:8px">${crest(t, 30)}<b class="grow">${esc(t.n)}</b><span class="chip">${prep.form}</span></div>
    <div class="lineup-col">${xi.map(({ p, pos }) => p ? `<div class="pl"><span class="pos ${POS_GROUP[pos]}">${POS_PT[pos]}</span><span class="dim tnum" style="width:22px">${p.num || ''}</span><span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.n)}</span>${formTag(p)}${ovrBadge(p.o)}${isUser ? fitBar(p) : ''}</div>` : '').join('')}</div>
    <div class="muted up" style="font-size:11px;margin:10px 0 4px">Banco</div>
    <div class="lineup-col">${prep.bench.slice(0, 9).map((id) => { const p = S.players[id]; return p ? `<div class="pl" style="opacity:0.85"><span class="pos ${POS_GROUP[p.p]}">${POS_PT[p.p]}</span><span class="grow">${esc(p.n)}</span>${formTag(p)}${ovrBadge(p.o)}</div>` : ''; }).join('')}</div></div>`;
}
function viewMatch() {
  const M = UI.match;
  const m = S.matches[M.mid];
  if (!m) return '<div class="page"><div class="panel">Partida não encontrada. <button class="btn" data-a="goHub">Voltar</button></div></div>';
  if (M.phase === 'pre' || M.phase === 'playing') return S.pl ? viewPlPreMatch(m) : viewPreMatch(m);
  if (M.phase === 'live') return viewLive(m);
  return viewPost(m);
}
function viewPreMatch(m) {
  const c = S.comps[m.c];
  const rd = c && c.rounds[m.r];
  const w = matchWeather(m);
  const ph = prepareSide(m.h, m), pa = prepareSide(m.a, m);
  const host = S.teams[m.h];
  let tieInfo = '';
  if (m.tie && m.leg === 2) { const [gh, ga] = tieAggregateBefore(m); tieInfo = `<span class="chip">Jogo de volta · ida: ${esc(teamName(m.h))} ${gh} x ${ga} ${esc(teamName(m.a))}</span>`; }
  return `<div class="match-screen">
    <div class="score-head"><div class="side">${crest(m.h, 64)}<div class="tname">${esc(teamName(m.h))}</div></div>
      <div class="scorebox"><div class="disp" style="font-size:22px;font-weight:700">${m.t}</div><div class="muted" style="font-size:13px">${fmtDate(m.d, 'dm')}</div></div>
      <div class="side r"><div class="tname">${esc(teamName(m.a))}</div>${crest(m.a, 64)}</div></div>
    <div class="page" style="padding-top:6px">
      <div class="row wrap" style="justify-content:center;gap:10px;margin-bottom:14px">${compBadge(c, 24)}<b>${esc(c ? c.name : '')}</b><span class="muted">${rd ? esc(rd.name) : ''}</span>
        <span class="chip">🏟 ${esc(m.n ? 'Campo neutro' : (stadiumName(host) || 'Estádio do ' + host.n))}</span><span class="chip weather">${w.icon} ${w.label}, ${w.temp}°C</span>${tieInfo}</div>
      <div class="grid g2">${sideColumn(m.h, ph, isUserTeam(m.h))}${sideColumn(m.a, pa, isUserTeam(m.a))}</div>
      ${!S.coach.unemployed && !S.pl && tacticPresets().length ? `<div class="row wrap" style="margin-top:14px;gap:8px;justify-content:center"><span class="muted" style="font-size:13px">🎯 Táticas prontas:</span>${tacticPresets().map((q) => `<button class="btn sm" data-a="mtTp" data-id="${q.id}" title="${esc(q.form)} · ${esc(mentLabel(q.ment))} · ${esc(STYLES[q.sty || 'bal'].n)}">${esc(q.name)}</button>`).join('')}</div>` : ''}
      <div class="row wrap" style="margin-top:18px;gap:10px">
        <button class="btn" data-a="editLineupFromMatch">Alterar escalação</button><span class="grow"></span>
        <button class="btn" data-a="startLive">⏱ Minuto a minuto</button>
        <button class="btn gold" data-a="start2d">🎮 Jogar partida</button>
        <button class="btn primary big" data-a="simNow"><span class="x-key">✕</span>Simular partida</button>
      </div>
    </div></div>`;
}
act('editLineupFromMatch', () => { UI.returnToMatch = UI.match.mid; UI.screen = 'career'; UI.tab = 'squad'; UI.sub.squad = 'lineup'; render(); });
act('backToMatch', () => { UI.screen = 'match'; UI.match = { mid: UI.returnToMatch, phase: 'pre' }; UI.returnToMatch = null; render(); });
act('simNow', () => {
  const m = S.matches[UI.match.mid];
  const st = startMatchState(m, { user: S.user.team });
  st.autoUser = true;
  st.deferPens = true;
  simulateRange(st, m, 45 + st.stoppage[0]);
  st.min = 45; st.half = 2;
  simulateRange(st, m, 90 + st.stoppage[1]);
  finishRegulation(st, m);
  UI.match.st = st;
  if (st.pendPens) { askPens(m, st); return; }
  applyMatchResult(m, st);
  UI.match.phase = 'post';
  render();
});
// the tie goes to penalties: the user chooses between playing them (2D) and simulating them
function askPens(m, st) {
  UI.match.st = st;
  openModal(() => modalShell('🎯 Disputa de pênaltis', `<p style="margin:0 0 10px">${esc(teamName(m.h))} ${st.score[0]} x ${st.score[1]} ${esc(teamName(m.a))}. O confronto está empatado${st.et ? ' mesmo depois da prorrogação' : ' e não tem prorrogação'}: a decisão é nos pênaltis.</p><p class="muted" style="margin:0">Você pode bater e defender os pênaltis na partida jogável, ou deixar o jogo simular.</p>`,
    '<button class="btn" data-a="pensSim">⏩ Simular pênaltis</button><button class="btn gold" data-a="pensPlay">🎯 Disputar pênaltis</button>'), { size: 'narrow' });
}
act('pensSim', () => {
  const M = UI.match, m = S.matches[M.mid], st = M.st;
  closeAllModals();
  st.pendPens = false; st.deferPens = false;
  st.pen = penaltyShootout(st);
  evAdd(st, { min: st.et ? 120 : st.min, t: 'pen', s: -1, txt: `Pênaltis: ${teamName(m.h)} ${st.pen[0]} x ${st.pen[1]} ${teamName(m.a)}.`, h: st.et ? 3 : 2 });
  finishLive();
});
act('pensPlay', () => {
  const M = UI.match, m = S.matches[M.mid], st = M.st;
  closeAllModals();
  g2Defaults();
  st.pendPens = false; st.deferPens = false;
  M.phase = 'playing';
  Game2D.startShootoutOnly(m, st, { minutes: G2PREF.len, diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: G2PREF.replay }, () => { UI.match.st = st; finishLive(); });
});
// ---------- live minute-by-minute
act('startLive', () => {
  const m = S.matches[UI.match.mid];
  const st = startMatchState(m, { user: S.user.team });
  st.half = 1;
  st.deferPens = true;
  UI.match.st = st;
  UI.match.phase = 'live';
  UI.match.speed = UI.match.speed || 2;
  UI.match.paused = false;
  UI.match.stage = 'h1';
  UI.match.mom = []; UI.match.feed = []; UI.match.ball = { x: 52.5, y: 34, k: 0, hot: false };
  evAdd(st, { min: 0, t: 'ko', s: -1, txt: `Bola rolando! ${teamName(m.h)} x ${teamName(m.a)}.`, h: 1 });
  render();
  liveLoop();
});
function minuteLabel(st, e) {
  const half = e ? e.h : st.half;
  const mn = e ? e.min : st.min;
  if (half === 1 && mn > 45) return `45+${mn - 45}'`;
  if (half === 2 && mn > 90) return `90+${mn - 90}'`;
  return `${mn}'`;
}
let liveTimer = 0;
function liveLoop() {
  clearTimeout(liveTimer);
  const M = UI.match;
  if (!M || M.phase !== 'live' || M.paused) return;
  const m = S.matches[M.mid];
  const st = M.st;
  const delay = [0, 700, 380, 160, 60][M.speed] || 380;
  liveTimer = setTimeout(() => {
    if (UI.match !== M || M.paused) return;
    const endH1 = 45 + st.stoppage[0];
    const endH2 = 90 + st.stoppage[1];
    const b4 = { ev: st.ev.length, sh: st.stats.sh.slice(), sot: st.stats.sot.slice(), cor: st.stats.cor.slice(), min: st.min };
    if (M.stage === 'h1') {
      if (st.min < endH1) simulateRange(st, m, st.min + 1);
      if (st.min >= endH1) { M.stage = 'ht'; M.paused = true; evAdd(st, { min: st.min, t: 'ht', s: -1, txt: `Fim do primeiro tempo: ${st.score[0]} x ${st.score[1]}.`, h: 1 }); }
    } else if (M.stage === 'h2') {
      if (st.min < endH2) simulateRange(st, m, st.min + 1);
      if (st.min >= endH2) {
        // extra time / penalties if needed
        const needs = matchNeedsDecider(m) && (() => { const [bh, ba] = tieAggregateBefore(m); return bh + st.score[0] === ba + st.score[1]; })();
        if (needs && S.comps[m.c] && S.comps[m.c].noET) {
          st.pen = decidePens(st);
          if (st.pen) evAdd(st, { min: st.min, t: 'pen', s: -1, txt: `Sem prorrogação: pênaltis! ${teamName(m.h)} ${st.pen[0]} x ${st.pen[1]} ${teamName(m.a)}.`, h: 2 });
          finishLive(); return;
        }
        if (needs) { M.stage = 'et'; st.half = 3; st.min = 90; st.xg = st.xg.map((x) => x * 0.95); evAdd(st, { min: 90, t: 'ht', s: -1, txt: 'Empate no agregado: vamos para a prorrogação!', h: 2 }); }
        else { finishLive(); return; }
      }
    } else if (M.stage === 'et') {
      if (st.min < 120) simulateRange(st, m, st.min + 1);
      if (st.min >= 120) {
        const [bh, ba] = tieAggregateBefore(m);
        if (bh + st.score[0] === ba + st.score[1]) { st.pen = decidePens(st); st.et = true; if (st.pen) evAdd(st, { min: 120, t: 'pen', s: -1, txt: `Pênaltis: ${teamName(m.h)} ${st.pen[0]} x ${st.pen[1]} ${teamName(m.a)}.`, h: 3 }); }
        st.et = true;
        finishLive(); return;
      }
    }
    if (st.min > b4.min) liveTrack(M, st, b4);
    updateLiveDom();
    liveLoop();
  }, delay);
}
// ---------- live tracker: where the play is, attack momentum and the play-by-play between real events
const LIVE_FILL = {
  calm: ['{T} troca passes no campo de defesa.', '{T} roda a bola com paciência.', 'Jogo estudado no meio-campo.', '{p} recua a bola para a defesa.', '{T} tenta encontrar espaços.', 'Bola dividida no meio-campo, ninguém leva vantagem.', '{p} pede calma e organiza a saída.', 'Falta no meio-campo, nada de perigo.'],
  push: ['{T} pressiona a saída de bola.', '{p} tenta o drible pela ponta.', 'Cruzamento de {p}, a zaga afasta.', '{p} recebe na intermediária e procura o passe.', 'Lançamento para {p}, a defesa corta.', '{T} chega com muitos jogadores ao ataque.', 'A torcida empurra {t}!', '{p} arranca pelo meio e sofre a falta.', 'Tabela rápida {d}, a marcação acompanha.'],
  hot: ['Pressão total {d}!', 'Bate-rebate na área, a defesa afasta!', '{p} invade a área e é desarmado na hora H.', '{T} troca passes na entrada da área.', '{p} tenta o passe na pequena área, o goleiro sai bem.', 'Escanteio para {t}, a zaga tira de cabeça.', 'Momento de sufoco para a defesa adversária!'],
};
function liveTrack(M, st, b4) {
  if (!M.mom) { M.mom = []; M.feed = []; M.ball = { x: 52.5, y: 34, k: 0 }; }
  const newEv = st.ev.slice(b4.ev);
  const d = (k) => (st.stats.sh[k] - b4.sh[k]) * 0.45 + (st.stats.sot[k] - b4.sot[k]) * 0.35 + (st.stats.cor[k] - b4.cor[k]) * 0.3;
  const R = Math.random;
  let v = (st.stats.poss[0] - 50) / 50 * 0.35 + (R() - 0.5) * 0.55 + d(0) - d(1);
  for (const e of newEv) { if (e.t === 'goal') v += e.s === 0 ? 0.9 : -0.9; else if (e.t === 'chance') v += e.s === 0 ? 0.35 : -0.35; }
  const prev = M.mom.length ? M.mom[M.mom.length - 1].v : 0;
  v = clamp(prev * 0.35 + v * 0.75, -1, 1);
  M.mom.push({ min: st.min, h: st.half, v, g: newEv.filter((e) => e.t === 'goal').map((e) => e.s), c: newEv.filter((e) => e.t === 'red').map((e) => e.s) });
  // home attacks to the right on the tracker
  const ax = (k, depth) => (k === 0 ? 52.5 + depth * 52.5 : 52.5 - depth * 52.5);
  let k = v >= 0 ? 0 : 1;
  let x, y = 34 + (R() - 0.5) * 44;
  const last = newEv.filter((e) => e.s >= 0 && e.t !== 'sub').pop();
  if (last && ['goal', 'save', 'miss', 'chance'].includes(last.t)) { k = last.s; x = ax(k, last.t === 'goal' ? 0.97 : last.t === 'chance' ? 0.68 : 0.84); y = 34 + (R() - 0.5) * (last.t === 'goal' ? 5 : 20); }
  else if (last && (last.t === 'yellow' || last.t === 'red')) x = ax(1 - last.s, 0.15 + R() * 0.45);
  else x = ax(k, Math.min(0.88, Math.abs(v) * 0.85 + R() * 0.2));
  M.ball = { x: clamp(x, 2, 103), y: clamp(y, 4, 64), k, hot: !!(last && last.t === 'goal'), v };
  if (!newEv.length && R() < 0.32) {
    const side = st.sides[k];
    const set = Math.abs(v) > 0.62 ? LIVE_FILL.hot : Math.abs(v) > 0.3 ? LIVE_FILL.push : LIVE_FILL.calm;
    const outfield = side.on.filter((pid, i) => pid && side.slotsOn[i] !== 'GK');
    const pid = outfield.length ? outfield[Math.floor(R() * outfield.length)] : 0;
    const txt = set[Math.floor(R() * set.length)].replace('{T}', TA(side.id)).replace('{t}', tA(side.id)).replace('{d}', tA(side.id, 'do')).replace('{p}', pid ? pidName(pid) : teamName(side.id));
    M.feed.push({ at: st.ev.length, min: st.min, h: st.half, t: 'info', s: k, txt });
  }
}
function liveColors(m) {
  const H = S.teams[m.h], A = S.teams[m.a];
  const vis = (t) => (lum(t.c1 || '#888') >= 0.16 ? t.c1 : (t.c2 && lum(t.c2) >= 0.16 ? t.c2 : '#9aa7b0'));
  const ch = vis(H);
  let ca = vis(A);
  const [r1, g1, b1] = hexToRgb(ch), [r2, g2, b2] = hexToRgb(ca);
  if (Math.hypot(r1 - r2, g1 - g2, b1 - b2) < 90) ca = A.c2 && A.c2 !== ca && lum(A.c2) >= 0.16 ? A.c2 : (lum(ch) > 0.7 ? '#4b6cff' : '#f2f2f2');
  return [ch, ca];
}
function livePitchSvg(M, m) {
  const b = M.ball || { x: 52.5, y: 34, k: 0 };
  const [ch, ca] = liveColors(m);
  const col = b.k === 0 ? ch : ca;
  const zx = b.x < 35 ? 0 : b.x < 70 ? 35 : 70;
  const danger = Math.abs(b.v || 0) > 0.62 || b.hot;
  return `<svg class="lv-pitch" viewBox="-3 -3 111 74" role="img" aria-label="Campo ao vivo">
    <defs><radialGradient id="lvglow"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect x="-3" y="-3" width="111" height="74" rx="3" fill="#2f6a2a"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 10.5}" y="0" width="10.5" height="68" fill="${i % 2 ? '#3b7a33' : '#357230'}"/>`).join('')}
    <rect id="lv-zone" x="${zx}" y="0" width="35" height="68" fill="${col}" opacity="${danger ? 0.32 : 0.16}"/>
    <g fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="0.5"><rect x="0" y="0" width="105" height="68"/><line x1="52.5" y1="0" x2="52.5" y2="68"/><circle cx="52.5" cy="34" r="9.15"/>
      <rect x="0" y="13.84" width="16.5" height="40.32"/><rect x="88.5" y="13.84" width="16.5" height="40.32"/><rect x="0" y="24.84" width="5.5" height="18.32"/><rect x="99.5" y="24.84" width="5.5" height="18.32"/>
      <rect x="-2" y="30.34" width="2" height="7.32"/><rect x="105" y="30.34" width="2" height="7.32"/></g>
    <g id="lv-ball" style="transform:translate(${b.x}px,${b.y}px)"><circle r="7" fill="url(#lvglow)" opacity="${danger ? 0.9 : 0.45}" class="${danger ? 'lv-pulse' : ''}"/><circle r="1.6" fill="#fff" stroke="#111" stroke-width="0.5"/></g>
  </svg>`;
}
function momentumSvg(M, m) {
  const mom = M.mom || [];
  const [ch, ca] = liveColors(m);
  const W = Math.max(96, mom.length + 2);
  let half = -1;
  mom.forEach((x, i) => { if (half < 0 && x.h === 2) half = i; });
  const bars = mom.map((x, i) => {
    const hgt = Math.max(0.6, Math.abs(x.v) * 18);
    return `<rect x="${i + 0.1}" y="${x.v >= 0 ? -hgt : 0}" width="0.8" height="${hgt}" fill="${x.v >= 0 ? ch : ca}"/>`;
  }).join('');
  const marks = mom.map((x, i) => x.g.map((s) => `<circle cx="${i + 0.5}" cy="${s === 0 ? -20.5 : 20.5}" r="1.6" fill="#fff" stroke="${s === 0 ? ch : ca}" stroke-width="0.7"/>`).join('') + x.c.map((s) => `<rect x="${i}" y="${s === 0 ? -22 : 19}" width="1.2" height="2.6" fill="#ff5d5d"/>`).join('')).join('');
  return `<svg class="lv-mom" viewBox="0 -24 ${W} 48" preserveAspectRatio="none" role="img" aria-label="Pressão no jogo minuto a minuto">
    <line x1="0" y1="0" x2="${W}" y2="0" stroke="rgba(255,255,255,0.25)" stroke-width="0.3"/>
    ${half > 0 ? `<line x1="${half}" y1="-24" x2="${half}" y2="24" stroke="rgba(255,255,255,0.25)" stroke-width="0.3" stroke-dasharray="1 1"/>` : ''}
    ${bars}${marks}</svg>`;
}
// real events and the narration in between, newest first; only the lines added since the last draw animate in
function liveFeedHtml(M, st) {
  const items = st.ev.map((e, i) => ({ e, k: i * 2 + 1, j: 0 })).concat((M.feed || []).map((f, j) => ({ e: f, k: f.at * 2, j })));
  items.sort((a, b) => b.k - a.k || b.j - a.j);
  const fresh = Math.max(0, items.length - (M.feedShown == null ? items.length : M.feedShown));
  M.feedShown = items.length;
  return items.map(({ e }, i) => `<div class="ev ${e.t}${i < fresh ? ' new' : ''}"><span class="mn">${e.s === -1 ? '' : minuteLabel(st, e)}</span><span>${e.t === 'info' ? '·' : EV_ICON[e.t] || '•'}</span><span>${esc(e.txt)}</span></div>`).join('');
}
function liveLabel(M, m) {
  const b = M.ball;
  if (!b || !M.mom || !M.mom.length) return 'Bola rolando';
  const id = b.k === 0 ? m.h : m.a;
  const a = Math.abs(b.v || 0);
  return b.hot ? `Gol ${tA(id, 'do')}!` : a > 0.62 ? `Pressão ${tA(id, 'do')}` : a > 0.3 ? `Ataque ${tA(id, 'do')}` : `Posse ${tA(id, 'do')}`;
}
function finishLive() {
  const M = UI.match;
  const m = S.matches[M.mid];
  if (M.st.pendPens) { askPens(m, M.st); return; }
  M.st.done = true;
  evAdd(M.st, { min: M.st.min, t: 'ft', s: -1, txt: `Fim de jogo: ${teamName(m.h)} ${M.st.score[0]} x ${M.st.score[1]} ${teamName(m.a)}.`, h: M.st.half });
  applyMatchResult(m, M.st);
  M.phase = 'post';
  render();
}
const EV_ICON = { goal: '⚽', save: '🧤', miss: '↗', chance: '⚡', yellow: '🟨', red: '🟥', inj: '✚', sub: '⇄', alien: '👽', ht: '⏸', ft: '🏁', ko: '▶', pen: '🎯' };
function viewLive(m) {
  const M = UI.match;
  const st = M.st;
  const userSide = isUserTeam(m.h) ? 0 : 1;
  const stageLbl = M.stage === 'ht' ? 'INTERVALO' : M.stage === 'et' ? 'PRORROGAÇÃO' : minuteLabel(st);
  return `<div class="match-screen">
    <div class="score-head"><div class="side">${crest(m.h, 56)}<div class="tname">${esc(teamName(m.h))}</div></div>
      <div class="scorebox"><div class="sc" id="lv-score">${st.score[0]} - ${st.score[1]}</div><div class="clock live" id="lv-clock">${stageLbl}</div></div>
      <div class="side r"><div class="tname">${esc(teamName(m.a))}</div>${crest(m.a, 56)}</div></div>
    <div class="page" style="padding-top:6px"><div class="lv-grid">
      <div class="panel lv-a"><div class="row wrap" style="margin-bottom:10px">
        ${M.stage === 'ht' ? `<button class="btn primary" data-a="liveSecondHalf">▶ Iniciar 2º tempo</button>` : `<button class="btn ${M.paused ? 'primary' : ''}" data-a="livePause">${M.paused ? '▶ Continuar' : '⏸ Pausar'}</button>`}
        <div class="seg">${[1, 2, 3, 4].map((s) => `<button class="${M.speed === s ? 'on' : ''}" data-a="liveSpeed" data-v="${s}">${['', '1x', '2x', '4x', '8x'][s]}</button>`).join('')}</div>
        <span class="grow"></span><button class="btn sm" data-a="liveSubs">Substituições (${st.subsLeft[userSide]})</button><button class="btn sm" data-a="liveSkip">Simular o resto</button></div>
        <div class="row wrap" style="margin-bottom:10px"><span class="muted" style="font-size:13px">Mentalidade:</span><div class="seg wrapseg">${MENTS.map(([v, l]) => `<button class="${(st.sides[userSide].mentality || 0) === v ? 'on' : ''}" data-a="liveMent" data-v="${v}">${l}</button>`).join('')}</div>
          <select class="input" style="max-width:160px" data-a="liveSty" aria-label="Estilo de jogo">${STYLE_KEYS.map((q) => `<option value="${q}" ${(st.sides[userSide].style || 'bal') === q ? 'selected' : ''}>${STYLES[q].n}</option>`).join('')}</select>
          <select class="input" style="max-width:130px" data-a="liveForm" aria-label="Formação">${FORMATION_LIST.map((f) => `<option ${st.sides[userSide].form === f ? 'selected' : ''}>${f}</option>`).join('')}</select>
          ${tacticPresets().map((q) => `<button class="btn xs" data-a="liveTp" data-id="${q.id}">🎯 ${esc(q.name)}</button>`).join('')}</div>
        <div class="lv-track"><div class="lv-tag"><span class="lv-dot"></span><b id="lv-lbl">${esc(liveLabel(M, m))}</b></div>
          <div class="lv-ends"><span>${crest(m.h, 18)} ${esc(teamShort(m.h))} ➜</span><span>⬅ ${esc(teamShort(m.a))} ${crest(m.a, 18)}</span></div>
          <div id="lv-pitch">${livePitchSvg(M, m)}</div>
          <div class="lv-mom-wrap"><div class="muted up" style="font-size:11px">Pressão no jogo</div><div id="lv-mom">${momentumSvg(M, m)}</div><div class="lv-axis"><span>0'</span><span>45'</span><span>90'</span></div></div></div></div>
      <div class="panel lv-b"><h3>Lance a lance</h3><div class="events" id="lv-events">${(M.feedShown = null, liveFeedHtml(M, st))}</div></div>
      <div class="panel lv-c"><h3>Estatísticas</h3><div class="col" id="lv-stats">${statBars(st.stats)}</div></div>
      <div class="panel lv-d"><h3>Em campo · ${esc(teamShort(st.sides[userSide].id))}</h3><div class="lineup-col" id="lv-onpitch">${onPitchHtml(st, userSide)}</div></div>
    </div></div></div>`;
}
function onPitchHtml(st, k) {
  const side = st.sides[k];
  return side.on.map((pid, i) => { const p = S.players[pid]; if (!p) return ''; const r = st.ratings[pid]; return `<div class="pl"><span class="pos ${POS_GROUP[side.slotsOn[i]]}">${POS_PT[side.slotsOn[i]]}</span><span class="grow">${esc(p.n)}</span>${fitBar(p)}<b class="tnum" style="width:30px;text-align:right">${r ? r.toFixed(1) : ''}</b></div>`; }).join('');
}
function updateLiveDom() {
  const M = UI.match;
  const st = M.st;
  const m = S.matches[M.mid];
  const sc = $('#lv-score'); if (!sc) return;
  sc.textContent = `${st.score[0]} - ${st.score[1]}`;
  $('#lv-clock').textContent = M.stage === 'ht' ? 'INTERVALO' : M.stage === 'et' ? `PRORROG. ${st.min}'` : minuteLabel(st);
  const evs = $('#lv-events'); if (evs) evs.innerHTML = liveFeedHtml(M, st);
  const ball = $('#lv-ball');
  if (ball && M.ball) {
    ball.style.transform = `translate(${M.ball.x}px,${M.ball.y}px)`;
    const glow = ball.querySelector('circle');
    const danger = Math.abs(M.ball.v || 0) > 0.62 || M.ball.hot;
    glow.setAttribute('opacity', danger ? 0.9 : 0.45); glow.classList.toggle('lv-pulse', danger);
    const zone = $('#lv-zone');
    if (zone) { const [ch, ca] = liveColors(m); zone.setAttribute('x', M.ball.x < 35 ? 0 : M.ball.x < 70 ? 35 : 70); zone.setAttribute('fill', M.ball.k === 0 ? ch : ca); zone.setAttribute('opacity', danger ? 0.32 : 0.16); }
  }
  const lbl = $('#lv-lbl'); if (lbl) lbl.textContent = liveLabel(M, m);
  const mom = $('#lv-mom'); if (mom) mom.innerHTML = momentumSvg(M, m);
  const stats = $('#lv-stats'); if (stats) stats.innerHTML = statBars(st.stats);
  const userSide = isUserTeam(m.h) ? 0 : 1;
  const op = $('#lv-onpitch'); if (op) op.innerHTML = onPitchHtml(st, userSide);
  if (M.stage === 'ht' && !$('[data-a="liveSecondHalf"]')) render();
}
act('livePause', () => { const M = UI.match; M.paused = !M.paused; render(); if (!M.paused) liveLoop(); });
act('liveSpeed', (el) => { UI.match.speed = +el.dataset.v; render(); liveLoop(); });
function liveUserSide() { const m = S.matches[UI.match.mid]; return isUserTeam(m.h) ? 0 : 1; }
act('liveSty', (el) => { const M = UI.match; liveTactic(M.st, liveUserSide(), { sty: el.value }); render(); if (!M.paused) liveLoop(); });
act('liveForm', (el) => { const M = UI.match; if (!liveTactic(M.st, liveUserSide(), { form: el.value })) toast('Não dá para mudar a formação agora.', true); render(); if (!M.paused) liveLoop(); });
act('liveTp', (el) => { const M = UI.match, q = tacticPresets().find((x) => x.id === +el.dataset.id); if (q) { liveTactic(M.st, liveUserSide(), { form: q.form, ment: q.ment, sty: q.sty }); toast(`Tática "${q.name}" ativada.`); } render(); if (!M.paused) liveLoop(); });
act('liveMent', (el) => {
  const M = UI.match; const m = S.matches[M.mid];
  const k = isUserTeam(m.h) ? 0 : 1;
  M.st.sides[k].mentality = +el.dataset.v;
  computeRatesLive(M.st);
  render(); if (!M.paused) liveLoop();
});
act('liveSecondHalf', () => {
  const M = UI.match; const st = M.st;
  st.min = 45; st.half = 2; M.stage = 'h2'; M.paused = false;
  evAdd(st, { min: 45, t: 'ko', s: -1, txt: 'Começa o segundo tempo!', h: 2 });
  render(); liveLoop();
});
act('liveSkip', () => {
  const M = UI.match; const m = S.matches[M.mid]; const st = M.st;
  clearTimeout(liveTimer);
  st.autoUser = true;
  st.deferPens = true;
  if (M.stage === 'h1' || M.stage === 'ht') { simulateRange(st, m, 45 + st.stoppage[0]); st.min = 45; st.half = 2; }
  if (M.stage !== 'et') simulateRange(st, m, 90 + st.stoppage[1]);
  finishRegulation(st, m);
  if (st.pendPens) { askPens(m, st); return; }
  applyMatchResult(m, st);
  M.phase = 'post';
  render();
});
act('liveSubs', () => {
  const M = UI.match; const m = S.matches[M.mid];
  const k = isUserTeam(m.h) ? 0 : 1;
  const wasPaused = M.paused; M.paused = true; clearTimeout(liveTimer);
  UI.subSel = null;
  openModal(() => {
    const st = M.st; const side = st.sides[k];
    const bench = side.bench.filter((b) => !side.on.includes(b) && !side.out.includes(b));
    return modalShell(`Substituições · restam ${st.subsLeft[k]}`, `<div class="grid g2"><div><div class="muted up" style="font-size:12px;margin-bottom:6px">Sai</div>${side.on.map((pid, i) => { const p = S.players[pid]; if (!p) return ''; return `<div class="bp ${UI.subSel === i ? 'sel' : ''}" data-a="subPickOut" data-i="${i}">${posBadge(side.slotsOn[i])}<span class="grow">${esc(p.n)}</span>${fitBar(p)}<b>${(st.ratings[pid] || 6).toFixed(1)}</b></div>`; }).join('')}</div>
      <div><div class="muted up" style="font-size:12px;margin-bottom:6px">Entra</div>${bench.map((pid) => { const p = S.players[pid]; return p ? `<div class="bp" data-a="subPickIn" data-id="${pid}">${posBadge(p.p)}<span class="grow">${esc(p.n)}</span>${formTag(p)}${ovrBadge(p.o)}</div>` : ''; }).join('') || '<div class="muted">Sem reservas.</div>'}</div></div>`,
    '<button class="btn primary" data-a="closeModal">Concluir</button>');
  }, { onClose: () => { M.paused = wasPaused && M.stage !== 'ht' ? wasPaused : M.paused; if (M.stage === 'ht') M.paused = true; else M.paused = wasPaused; render(); if (!M.paused) liveLoop(); } });
});
act('subPickOut', (el) => { UI.subSel = +el.dataset.i; refreshModal(); });
act('subPickIn', (el) => {
  const M = UI.match; const m = S.matches[M.mid];
  const k = isUserTeam(m.h) ? 0 : 1;
  if (UI.subSel == null) { toast('Escolha primeiro quem sai.', true); return; }
  if (M.st.subsLeft[k] <= 0) { toast('Sem substituições restantes.', true); return; }
  doSub(M.st, k, UI.subSel, +el.dataset.id, M.st.min);
  UI.subSel = null;
  refreshModal();
});
// ---------- post match
function viewPost(m) {
  const st = UI.match.st;
  const goals = (k) => st.ev.filter((e) => e.t === 'goal' && e.s === k).map((e) => `${e.p ? esc(pidName(e.p)) : 'Gol contra'} ${minuteLabel(st, e)}`).join(', ');
  const uidSide = isUserTeam(m.h) ? 0 : 1;
  const mine = new Set(st.sides[uidSide].xi.concat(st.ev.filter((e) => e.t === 'sub' && e.s === uidSide).map((e) => e.p)));
  const ratings = Object.entries(m.rt || {}).map(([pid, r]) => ({ p: S.players[pid], r })).filter((x) => x.p && mine.has(x.p.id)).sort(by((x) => x.r, -1));
  const motm = ratings[0];
  const res = resultLetter(m, S.user.team);
  return `<div class="match-screen">
    <div class="score-head"><div class="side">${crest(m.h, 64)}<div class="tname">${esc(teamName(m.h))}</div></div>
      <div class="scorebox"><div class="sc">${m.hg} - ${m.ag}</div><div class="clock">${m.pen ? `PÊN ${m.pen[0]}-${m.pen[1]}` : m.et ? 'PRORROG.' : 'FINAL'}</div></div>
      <div class="side r"><div class="tname">${esc(teamName(m.a))}</div>${crest(m.a, 64)}</div></div>
    <div class="page" style="padding-top:6px">
      <div class="row wrap" style="justify-content:center;gap:24px;margin-bottom:14px;font-size:14px"><span>⚽ ${goals(0) || '—'}</span><span class="muted">|</span><span>⚽ ${goals(1) || '—'}</span></div>
      <div class="grid g2"><div class="panel"><h3>${res === 'V' ? 'Vitória!' : res === 'D' ? 'Derrota' : 'Empate'}</h3><div class="col">${statBars(st.stats)}</div></div>
        <div class="panel"><h3>Notas · ${esc(teamShort(S.user.team))}${motm ? ` <span class="sub">melhor em campo: ${esc(motm.p.n)}</span>` : ''}</h3>
          <div class="lineup-col">${ratings.map((x) => `<div class="pl"><span class="grow">${esc(x.p.n)}</span><b class="tnum" style="color:${x.r >= 7.5 ? 'var(--win)' : x.r < 6 ? 'var(--loss)' : 'var(--text)'}">${x.r.toFixed(1)}</b></div>`).join('')}</div></div></div>
      ${S.pl ? plPostCard(m, st) : ''}
      <div class="row" style="margin-top:18px"><span class="grow"></span><button class="btn primary big" data-a="postContinue"><span class="x-key">✕</span>Continuar</button></div>
    </div></div>`;
}
act('postContinue', async () => {
  UI.match = null;
  UI.screen = 'career'; UI.tab = 'central';
  render();
  saveGame(S.id).then(async () => { SAVES = await listSaves(); });
});

act('mtTp', (el) => { const r = applyTacticPreset(+el.dataset.id); if (r) toast(`"${r.name}" ativada${r.lineupKept ? '' : ' (escalação refeita)'}.`); render(); });
