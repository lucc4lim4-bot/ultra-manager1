/* ===================== playable 2D match (top-down arcade, World Soccer Champs style) ===================== */
// match settings kept on this device
const G2PREF = (() => { try { return JSON.parse(localStorage.getItem('um-g2d') || '{}') || {}; } catch (e) { return {}; } })();
function saveG2Pref() { try { localStorage.setItem('um-g2d', JSON.stringify(G2PREF)); } catch (e) { /* storage unavailable */ } }
const G2_DIFFS = [['facil', 'Fácil'], ['normal', 'Normal'], ['dificil', 'Difícil']];
const G2_CAMS = [['perto', 'Perto'], ['normal', 'Normal'], ['longe', 'Longe']];
const G2_ZOOM = { perto: 1.25, normal: 1, longe: 0.8 };
function g2Defaults() {
  if (![4, 6, 10].includes(G2PREF.len)) G2PREF.len = 6;
  if (!G2_DIFFS.some(([k]) => k === G2PREF.diff)) G2PREF.diff = 'normal';
  if (!G2_CAMS.some(([k]) => k === G2PREF.cam)) G2PREF.cam = 'normal';
  if (typeof G2PREF.sound !== 'boolean') G2PREF.sound = true;
  if (typeof G2PREF.replay !== 'boolean') G2PREF.replay = true;
  if (typeof G2PREF.autoRun !== 'boolean') G2PREF.autoRun = true;
  if (!G2_BTN.some(([k]) => k === G2PREF.btn)) G2PREF.btn = 1;
}
// size of the on-screen controls (joystick and buttons)
const G2_BTN = [[0.8, 'Pequeno'], [1, 'Normal'], [1.25, 'Grande'], [1.5, 'Enorme']];
function applyBtnSize(root) { if (root) { root.style.setProperty('--bs', G2PREF.btn || 1); root.classList.toggle('manualrun', G2PREF.autoRun === false); if (root.isConnected && typeof g2ApplyLayout === 'function') g2ApplyLayout(root); } }
act('start2d', () => {
  g2Defaults();
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(G2PREF[k]) === String(v) ? 'on' : ''}" data-a="g2dOpt" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  openModal(() => modalShell('🎮 Jogar partida', `
    <p style="margin:0 0 14px">${S.pl ? `Você controla só <b>${esc(plPlayer().n)}</b>: os companheiros jogam sozinhos. Use PEDIR (tecla V) para chamar o passe. Sua nota depende das jogadas, gols e assistências.` : `Você controla <b>${esc(tA(S.user.team))}</b> e ataca sempre para cima (para a direita em telas largas).`}</p>
    <div class="g2-opts">
      <div><div class="muted up">Duração</div>${seg('len', [[4, '4 min'], [6, '6 min'], [10, '10 min']])}</div>
      <div><div class="muted up">Dificuldade</div>${seg('diff', G2_DIFFS)}</div>
      <div><div class="muted up">Câmera</div>${seg('cam', G2_CAMS)}</div>
      <div><div class="muted up">Som</div>${seg('sound', [[true, 'Ligado'], [false, 'Desligado']])}</div>
      <div><div class="muted up">Replay dos gols</div>${seg('replay', [[true, 'Ligado'], [false, 'Desligado']])}</div>
      <div><div class="muted up">Botões na tela (toque)</div>${seg('btn', G2_BTN)}</div>
      <div><div class="muted up">Corrida</div>${seg('autoRun', [[true, 'Automática'], [false, 'Manual (botão)']])}</div>
    </div>
    <div class="help-keys" style="margin-top:14px"><b>Teclado:</b> <span class="kbd">WASD</span> ou <span class="kbd">setas</span> movem · <span class="kbd">J</span> passe (sem a bola: troca de jogador) · <span class="kbd">K</span> chute, segure para mais força (sem a bola: carrinho) · <span class="kbd">L</span> enfiada no espaço (na cara do gol com o goleiro adiantado: cavadinha) · <span class="kbd">I</span> finta (varia com as estrelas: finta 1★, carretilha 2★, caneta 3★, elástico 4★, chapéu 5★) · <span class="kbd">U</span> SUPER CHUTE (segure e solte na faixa verde da barra: bomba rasteira, gasta fôlego e recarrega em 7s) · <span class="kbd">O</span> giro (2★) · <span class="kbd">Q</span> ou <span class="kbd">E</span> troca de jogador (com o direcional, escolhe quem está naquela direção) · <span class="kbd">Shift</span> corre devagar na corrida automática (ou corre, se a corrida for manual) · <span class="kbd">P</span> pausa</div>
    <div class="help-keys" style="margin-top:8px"><b>Toque:</b> joystick à esquerda (empurre até a borda para correr, mais leve para andar); PASSE, CHUTE e LANÇAR à direita (e o botão verde TROCAR muda o jogador que você controla; sempre passa para o companheiro mais perto da bola), e FINTA (o drible muda conforme as estrelas) e GIRO (liberados pelas estrelas de finta do jogador, que aparecem ao lado do nome dele) ao lado. Com a corrida manual, aparece o botão CORRER. A barra azul sob o jogador é o fôlego da corrida.</div>
    <div class="help-keys" style="margin-top:8px"><b>Pênaltis:</b> mire com o direcional e segure CHUTE para dar força (força demais vai por cima). Quando o adversário bate, escolha o canto do goleiro antes do chute. No mata-mata, se o empate persistir, a prorrogação é simulada e você disputa os pênaltis.</div>`,
  '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn gold" data-a="g2dGo">Começar</button>'), { size: 'narrow' });
});
act('g2dOpt', (el) => {
  const k = el.dataset.k;
  let v = el.dataset.v;
  if (k === 'len' || k === 'btn') v = +v;
  if (k === 'sound' || k === 'replay' || k === 'autoRun') v = v === 'true';
  G2PREF[k] = v;
  saveG2Pref();
  refreshModal();
});
act('g2dGo', () => {
  const M = UI.match;
  const m = M && S.matches[M.mid];
  closeAllModals();
  if (!m || m.done) return;
  g2Defaults();
  ensureCoachLook();
  const st = startMatchState(m, { user: S.user.team });
  M.st = st;
  M.phase = 'playing';
  Game2D.start(m, st, { minutes: G2PREF.len, diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: G2PREF.replay, solo: S.pl ? S.pl.pid : 0 }, () => finish2D(m, st));
});
function finish2D(m, st) {
  if (!st.decided) {
    st.min = Math.max(st.min || 0, 90 + st.stoppage[1]);
    st.half = 2;
    finishRegulation(st, m);
  } else st.done = true;
  applyMatchResult(m, st);
  UI.match.phase = 'post';
  render();
  window.scrollTo(0, 0);
  if (st.pen && !st.penPlayed) toast(st.et ? 'Empate no agregado: prorrogação e pênaltis foram simulados.' : 'Empate no agregado: os pênaltis foram simulados (sem prorrogação).');
  else if (st.et && !st.decided && !st.penPlayed) toast('Empate no agregado: a prorrogação foi simulada.');
}


// ---- movable on-screen controls (like Brawl Stars): each control's centre is stored as a fraction of the screen (separately for landscape and portrait) plus its own size
function g2Orient(root) { return root.clientWidth > root.clientHeight ? 'l' : 'p'; }
function g2DefaultPos(root, el, W, H) {
  const k = el.dataset.k, bs = G2PREF.btn || 1, safeR = 18, safeB = 22, w = el.offsetWidth * bs, h = el.offsetHeight * bs;
  const small = el.offsetWidth <= 70 && k !== 'joy' && !el.classList.contains('sk');
  const pw = (small ? 68 : 76) * bs, gap = (small ? 10 : 12) * bs;
  const rowY = (r) => H - safeB - pw / 2 - (1 - r) * (pw + gap); // r: 0 = top row, 1 = bottom row
  const colX = (c) => W - safeR - pw / 2 - (1 - c) * (pw + gap);
  if (k === 'joy') return [safeR + w / 2, H - safeB - h / 2];
  if (k === 'swap') return [colX(0), rowY(0)];
  if (k === 'call') return [colX(0), rowY(0) - (pw + gap)];
  if (k === 'lob') return [colX(1), rowY(0)];
  if (k === 'super') return [colX(1), rowY(0) - (pw + gap)];
  if (k === 'pass') return [colX(0), rowY(1)];
  if (k === 'shoot') return [colX(1), rowY(1)];
  const skX = W - safeR - (2 * pw + gap) - 12 * bs - w / 2;
  const order = ['feint', 'spin', 'sprint'];
  const i = Math.max(0, order.indexOf(k));
  return [skX, H - safeB - h / 2 - i * (h + 10 * bs)];
}
function g2ApplyLayout(root) {
  const ctl = root.querySelector('.g2d-controls');
  if (!ctl) return;
  const W = ctl.clientWidth, H = ctl.clientHeight;
  if (!W || !H) return;
  const lay = (G2PREF.lay && G2PREF.lay[g2Orient(root)]) || {};
  ctl.querySelectorAll('[data-k]').forEach((el) => {
    const c = lay[el.dataset.k];
    let x, y, sc = 1;
    if (c) { x = c[0] * W; y = c[1] * H; sc = c[2] || 1; } else [x, y] = g2DefaultPos(root, el, W, H);
    el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px';
    el.style.setProperty('--ps', sc);
  });
}
function g2LayoutEdit(root, onDone) {
  const ctl = root.querySelector('.g2d-controls'), bar = root.querySelector('#g2-laybar');
  root.classList.add('editlay'); bar.hidden = false;
  g2ApplyLayout(root);
  let sel = null, drag = null;
  const orient = () => g2Orient(root);
  const cur = (el) => {
    const W = ctl.clientWidth, H = ctl.clientHeight, k = el.dataset.k;
    const l = ((G2PREF.lay || {})[orient()] || {})[k];
    return l ? l.slice() : [(parseFloat(el.style.left) || 0) / W, (parseFloat(el.style.top) || 0) / H, 1];
  };
  const store = (el, v) => {
    G2PREF.lay = G2PREF.lay || {}; G2PREF.lay[orient()] = G2PREF.lay[orient()] || {};
    // moving one control also freezes the others at their current spot, so nothing jumps around
    ctl.querySelectorAll('[data-k]').forEach((o) => { if (!G2PREF.lay[orient()][o.dataset.k]) G2PREF.lay[orient()][o.dataset.k] = cur(o); });
    G2PREF.lay[orient()][el.dataset.k] = v;
    g2ApplyLayout(root);
  };
  const select = (el) => { ctl.querySelectorAll('.sel').forEach((o) => o.classList.remove('sel')); sel = el; if (el) el.classList.add('sel'); };
  const down = (e) => {
    e.stopPropagation(); e.preventDefault();
    const el = e.target.closest('[data-k]');
    if (!el) return;
    select(el);
    const v = cur(el);
    drag = { el, id: e.pointerId, ox: e.clientX, oy: e.clientY, v };
    try { ctl.setPointerCapture(e.pointerId); } catch (_) { /* not capturable */ }
  };
  const move = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    e.stopPropagation();
    const r = ctl.getBoundingClientRect();
    const fx = Math.min(0.97, Math.max(0.03, drag.v[0] + (e.clientX - drag.ox) / r.width));
    const fy = Math.min(0.97, Math.max(0.05, drag.v[1] + (e.clientY - drag.oy) / r.height));
    store(drag.el, [fx, fy, drag.v[2] || 1]);
  };
  const up = (e) => { if (drag && e.pointerId === drag.id) { drag = null; saveG2Pref(); } };
  ctl.addEventListener('pointerdown', down, true);
  ctl.addEventListener('pointermove', move, true);
  ctl.addEventListener('pointerup', up, true);
  ctl.addEventListener('pointercancel', up, true);
  const size = (d) => { if (!sel) return; const v = cur(sel); v[2] = Math.min(2, Math.max(0.5, +((v[2] || 1) + d).toFixed(2))); store(sel, v); saveG2Pref(); };
  const onBar = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.l === 'plus') size(0.15);
    else if (b.dataset.l === 'minus') size(-0.15);
    else if (b.dataset.l === 'reset') { if (G2PREF.lay) delete G2PREF.lay[orient()]; saveG2Pref(); select(null); g2ApplyLayout(root); }
    else if (b.dataset.l === 'done') {
      ctl.removeEventListener('pointerdown', down, true); ctl.removeEventListener('pointermove', move, true);
      ctl.removeEventListener('pointerup', up, true); ctl.removeEventListener('pointercancel', up, true);
      bar.removeEventListener('click', onBar);
      select(null); root.classList.remove('editlay'); bar.hidden = true; saveG2Pref(); g2ApplyLayout(root);
      onDone();
    }
  };
  bar.addEventListener('click', onBar);
}

// the emblems of the generated brands (frame + symbol), drawn small on the shirts
const BRAND_P2D = {};
function drawBrandMark(ctx, lg, x, y, r, b) {
  const fr = lg.sh % 9, ink = Math.abs(lum(lg.c1) - lum(lg.c2)) > 0.28 ? lg.c2 : (lum(lg.c1) > 0.5 ? '#111' : '#fff');
  ctx.save();
  ctx.fillStyle = lg.c1; ctx.strokeStyle = lg.c1; ctx.lineWidth = Math.max(1, r * 0.3);
  ctx.beginPath();
  if (fr === 1) { ctx.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8); ctx.fill(); }
  else if (fr === 2 || fr === 7) { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1); } ctx.closePath(); ctx.fill(); }
  else if (fr === 3) { ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y); ctx.quadraticCurveTo(x + r, y + r, x, y + r * 1.15); ctx.quadraticCurveTo(x - r, y + r, x - r, y); ctx.closePath(); ctx.fill(); }
  else if (fr === 4) { ctx.arc(x, y, r * 0.9, 0, Math.PI * 2); ctx.stroke(); }
  else if (fr !== 5) { ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  const key = b != null && b >= 0 ? spIconOf(b) : 'star';
  if (!BRAND_P2D[key]) BRAND_P2D[key] = new Path2D(SP_ICONS[key]);
  const k = (fr === 5 ? 0.0125 : 0.0105) * r * 1.6;
  ctx.translate(x - 50 * k, y - 50 * k); ctx.scale(k, k);
  ctx.fillStyle = fr === 4 || fr === 5 ? lg.c1 : ink;
  ctx.fill(BRAND_P2D[key], 'evenodd');
  ctx.restore();
}
const Game2D = (() => {
  const PL = 105, PW = 68, GOAL_W = 7.32, GOAL_H = 2.44, BOX_W = 40.32, BOX_D = 16.5;
  // difficulty: what the computer-controlled side gets (team 1); in automatic test runs both sides use "normal"
  const DIFF = {
    facil: { tackle: -0.09, passErr: 1.5, speed: 0.95, cpuSave: -0.08, userSave: 0.08, shootErr: 1.25, press: 1, slide: 0.025 },
    normal: { tackle: 0, passErr: 1, speed: 1, cpuSave: 0, userSave: 0, shootErr: 1, press: 2, slide: 0.045 },
    dificil: { tackle: 0.07, passErr: 0.7, speed: 1.04, cpuSave: 0.06, userSave: -0.04, shootErr: 0.85, press: 3, slide: 0.055 },
  };
  const KEYS = {};
  let G = null, root = null, cv = null, ctx = null, radar = null, rctx = null, onDone = null, rafId = 0;
  const hud = {};

  // ------------------------------------------------------------------ helpers
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const nrm = (x, y) => { const l = Math.hypot(x, y); return l > 1e-9 ? { x: x / l, y: y / l } : { x: 0, y: 0 }; };
  const grand = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
  const sideOf = (team) => (team === 0 ? G.userSide : 1 - G.userSide);
  const teamIdOf = (team) => G.st.sides[sideOf(team)].id;
  const nameOf = (p) => (p ? p.label : '');
  function keeperOf(team) { return G.players.find((p) => p.team === team && p.gk && !p.out) || null; }
  function nearestTo(team, x, y, noGK, except) {
    let best = null, bd = 1e9;
    for (const p of G.players) {
      if (p.out || p.team !== team || (noGK && p.gk) || p === except) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  function nearestOppDist(p) { let m = 99; for (const o of G.players) if (!o.out && o.team !== p.team) m = Math.min(m, Math.hypot(o.x - p.x, o.y - p.y)); return m; }
  const inBoxOf = (team, x, y) => Math.abs(x - PW / 2) < BOX_W / 2 && Math.abs(y - (team === 0 ? PL : 0)) < BOX_D; // box defended by `team`
  function pressureOn(p) {
    let s = 0;
    for (const o of G.players) if (!o.out && o.team !== p.team) { const d = dist(o, p); if (d < 3.5) s += (3.5 - d) / 3.5; }
    return s;
  }
  function laneOpen(p, q, noGk) {
    const dx = q.x - p.x, dy = q.y - p.y, L2 = dx * dx + dy * dy || 1;
    let m = 10;
    for (const o of G.players) {
      if (o.out || o.team === p.team || (noGk && o.gk)) continue;
      const t = clamp(((o.x - p.x) * dx + (o.y - p.y) * dy) / L2, 0, 1);
      m = Math.min(m, Math.hypot(o.x - (p.x + dx * t), o.y - (p.y + dy * t)));
    }
    return m;
  }
  function cdist(a, b) { const A = hexToRgb(a), B = hexToRgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); }
  function shade(hex, f) { const [r, g, b] = hexToRgb(hex); const k = (c) => Math.round(clamp(f >= 0 ? c + (255 - c) * f : c * (1 + f), 0, 255)); return `rgb(${k(r)},${k(g)},${k(b)})`; }
  function minuteNow() { return (G.half === 1 ? 0 : 45) + (G.clock / G.halfLen) * 45; }
  function minuteInt() { return Math.max(G.half === 1 ? 1 : 46, Math.ceil(minuteNow())); }
  function halfEnd() { return G.halfLen * (45 + G.st.stoppage[G.half - 1]) / 45; }
  function clockLabel() {
    const mn = minuteNow();
    if (G.half === 1 && mn > 45) return `45+${Math.ceil(mn - 45)}'`;
    if (G.half === 2 && mn > 90) return `90+${Math.ceil(mn - 90)}'`;
    return `${Math.floor(mn)}'`;
  }

  // ------------------------------------------------------------------ teams & sprites
  const SKINS = ['#f3cfb0', '#e8b894', '#d29b6f', '#b07a4e', '#8a5733', '#603a22'];
  const HAIRS = ['#1d1510', '#2e2018', '#5a3a22', '#8a5a2e', '#d1a85c', '#0e0e0e', '#9a9a9a'];
  const DARK = new Set(['NGA', 'GHA', 'CIV', 'SEN', 'CMR', 'MLI', 'COD', 'ANG', 'CPV', 'HAI', 'CUW', 'JAM', 'RSA', 'GAB', 'GUI', 'BFA', 'TOG', 'BEN', 'GAM', 'SLE', 'ZAM', 'ZIM', 'KEN', 'TAN', 'UGA', 'ETH', 'SUR', 'TRI', 'MOZ', 'GNB', 'EQG', 'CGO', 'CTA', 'MTN', 'NIG', 'SDN', 'BDI', 'RWA', 'MAD', 'COM']);
  const MIXED = new Set(['BRA', 'COL', 'FRA', 'ENG', 'NED', 'POR', 'BEL', 'USA', 'VEN', 'ECU', 'PAN', 'CRC', 'HON', 'URU', 'CUB', 'DOM', 'SUI', 'GER', 'SWE', 'NOR', 'DEN', 'ESP', 'ITA', 'CAN', 'MAR', 'ALG', 'TUN', 'EGY', 'QAT', 'KSA', 'MEX', 'PER']);
  function makeKits(hT, aT) {
    const kit = (c1, c2) => ({ shirt: c1, trim: c2 && cdist(c1, c2) > 70 ? c2 : (lum(c1) > 0.5 ? '#1b2440' : '#ffffff'), shorts: cdist(c1, c2 || '#ffffff') < 70 ? (lum(c1) > 0.5 ? '#1b2440' : '#ffffff') : (c2 || '#ffffff'), socks: c1 });
    const home = kit(hT.c1 || '#c0392b', hT.c2);
    let away = kit(aT.c1 || '#2a5bd7', aT.c2);
    if (cdist(home.shirt, away.shirt) < 130) {
      const alt = aT.c2 && cdist(aT.c2, home.shirt) > 150 ? aT.c2 : (lum(home.shirt) > 0.55 ? '#1f2d6e' : '#f4f4f4');
      away = kit(alt, alt === aT.c2 ? aT.c1 : (lum(alt) > 0.5 ? '#1f2d6e' : '#ffffff'));
    }
    const cu = (t, role, base) => { const c = t && typeof kitCustom === 'function' ? kitCustom(t.id, role) : null; return c ? Object.assign({}, base, c) : base; };
    return [cu(hT, 'home', home), cu(aT, 'away', away)];
  }
  function gkKitFor(team, kits) {
    const opts = team === 0 ? ['#2fd27a', '#a35cff', '#ff8a1f'] : ['#ffb21f', '#ff4fa3', '#22c3d6'];
    const c = opts.find((o) => cdist(o, kits[0].shirt) > 120 && cdist(o, kits[1].shirt) > 120) || opts[0];
    return { shirt: c, trim: '#1b1b1b', shorts: '#1b1b1b', socks: c };
  }
  function applyPlayer(sp, p) {
    const h = hashStr(p.n + '|' + p.id);
    const si = DARK.has(p.nat) ? 3 + (h % 3) : MIXED.has(p.nat) ? h % 6 : h % 3;
    const fb = formBonus(p); // the form bonus counts in the 2D match too
    const a = (p.a && p.a.length >= 6 ? p.a : [p.o, p.o, p.o, p.o, p.o, p.o]).map((v) => v + fb);
    // goalkeepers' attributes are diving, handling, kicking, reflexes, speed and positioning; an outfield player
    // pushed into goal keeps poor ones
    const natGK = p.p === 'GK';
    const gkv = (i) => (natGK ? a[i] || p.o + fb : clamp(p.o - 30, 25, 45));
    const spd = sp.gk ? 5.9 + clamp((natGK ? a[4] || 55 : 50) - 50, -10, 40) * 0.02 : 5.7 + clamp((a[0] || p.o) - 55, -15, 44) * 0.042;
    Object.assign(sp, {
      p, pid: p.id, speed: spd * (sp.team === 1 ? G.D.speed : 1),
      sho: a[1] || p.o, pas: a[2] || p.o, dri: a[3] || p.o, def: a[4] || p.o, phy: a[5] || p.o, ovr: p.o + fb,
      gkDiv: gkv(0), gkHan: gkv(1), gkKic: gkv(2), gkRef: gkv(3), gkPos: gkv(5), hgt: p.h || 180,
      skin: SKINS[si], hair: HAIRS[(h >> 6) % HAIRS.length], hs: (h >> 11) % 5, num: p.num || sp.slot + 1,
      label: p.s || p.n, sta: 1,
    });
    const lk = S.pl && S.pl.look && p.id === S.pl.pid ? S.pl.look : null; // the player-career look chosen by the user
    if (lk) Object.assign(sp, { skin: SKINS[lk.skin] || sp.skin, hair: HAIRS[lk.hair] || sp.hair, hs: lk.hs != null ? lk.hs : sp.hs, beard: !!lk.beard, boots: lk.boots || null, num: lk.num || sp.num });
    sp.stars = sp.gk ? 1 : skillStars(sp.dri);
    if (natGK) Object.assign(sp, { pas: sp.gkKic, sho: 40, dri: 40, def: 45 });
  }
  // skill-move stars (like FIFA): the better the dribbling, the more moves he can do
  function skillStars(dri) { return dri >= 84 ? 5 : dri >= 77 ? 4 : dri >= 70 ? 3 : dri >= 62 ? 2 : 1; }
  const SKILL_NEED = { feint: 1, spin: 2 };
  // the FINTA button picks a move among those unlocked by the stars
  const FEINTS = [['feint', 1], ['pedalada', 1], ['roll', 2], ['drag', 2], ['fakeshot', 2], ['nutmeg', 3], ['heel', 3], ['elastico', 4], ['rainbow', 5]];
  function makeSprite(p, team, k, pos, fx, fy, slot) {
    const sp = {
      team, side: k, pos, gk: pos === 'GK', slot, fx, fy,
      x: PW / 2, y: PL / 2, vx: 0, vy: 0, wx: 0, wy: 0, tx: PW / 2, ty: PL / 2, run: 0.7, dx: 0, dy: team === 0 ? -1 : 1,
      anim: Math.random() * 6, cool: 0, slide: 0, sx: 0, sy: 0, slideDone: false, fall: 0, tackT: 0, decT: 0, runT: 0, holdT: 0,
      out: false, inX: 0, inY: 0, sprint: false, cornerSpot: null, dive: null, kickT: 0, feintT: 0, fdx: 0, fdy: 0, diveT: 0, diveDir: 0, wall: false, sk: null, skCD: 0,
      dv: null, gz: 0, plan: null, cr: null, claim: null, setT: 0,
    };
    applyPlayer(sp, p);
    return sp;
  }
  function buildPlayers() {
    const { m, st } = G;
    G.kits = makeKits(S.teams[m.h], S.teams[m.a]);
    G.gkKits = [0, 1].map((k) => gkKitFor(k === G.userSide ? 0 : 1, G.kits));
    st.sides.forEach((side, k) => {
      const team = k === G.userSide ? 0 : 1;
      const slots = FORMATIONS[side.form] || FORMATIONS['4-3-3'];
      side.on.forEach((pid, i) => {
        const p = S.players[pid];
        if (!p || !slots[i]) return;
        G.players.push(makeSprite(p, team, k, side.slotsOn[i] || slots[i][0], slots[i][1] / 100, slots[i][2] / 100, i));
      });
    });
  }
  // after substitutions made by the engine (computer side), refresh the sprites of the changed slots
  function syncSprites() {
    for (const sp of G.players) {
      const side = G.st.sides[sp.side];
      const pid = side.on[sp.slot];
      if (!pid) { if (!sp.out) spriteOut(sp); continue; }
      if (pid !== sp.pid && S.players[pid]) { applyPlayer(sp, S.players[pid]); sp.pos = side.slotsOn[sp.slot] || sp.pos; }
    }
  }
  // the user changes formation / mentality / style from the pause menu: the sprites take their new places
  function applyLiveTactic2D(o) {
    const k = G.userSide, side = G.st.sides[k];
    const changed = liveTactic(G.st, k, o);
    if (changed) {
      const slots = FORMATIONS[side.form];
      for (const sp of G.players) {
        if (sp.side !== k || sp.out) continue;
        const j = side.on.indexOf(sp.pid);
        if (j < 0) continue;
        sp.slot = j; sp.pos = side.slotsOn[j]; sp.fx = slots[j][1] / 100; sp.fy = slots[j][2] / 100;
      }
    }
    return changed;
  }
  function cpuSub(minute) {
    const st = G.st, k = sideOf(1);
    if (st.subsLeft[k] <= 1) return;
    const before = st.ev.length;
    aiSub(st, k, null, minute, false);
    const e = st.ev[st.ev.length - 1];
    if (st.ev.length > before && e && e.t === 'sub') {
      syncSprites();
      say(`Substituição ${tA(st.sides[k].id, 'no')}: entra ${pidName(e.p)}${e.p2 ? `, sai ${pidName(e.p2)}` : ''}.`, 1);
    }
  }

  // ------------------------------------------------------------------ creation
  function create(m, st, a, b) {
    const opts = a && typeof a === 'object' ? a : Object.assign({}, b || {}, { minutes: a });
    const w = matchWeather(m);
    const minutes = opts.minutes || 6;
    G = {
      m, st, minutes, solo: opts.solo ? +opts.solo : 0, callT: 0, auto: !!opts.auto, userSide: opts.auto ? 0 : (isUserTeam(m.h) ? 0 : 1),
      D: DIFF[opts.auto ? 'normal' : opts.diff] || DIFF.normal, diff: opts.diff || 'normal', camZoom: G2_ZOOM[opts.cam] || 1, replayOn: opts.replay !== false,
      players: [], weather: w, halfLen: minutes * 30,
      fr: w.kind === 'rain' ? [0.75, 0.17] : w.kind === 'snow' ? [1.6, 0.3] : [1.0, 0.22],
      ball: { x: PW / 2, y: PL / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, lastTeam: 0, shot: null, passer: null, target: null, assist: null, spin: 0, inGoal: false, postT: 0, curve: 0 },
      half: 1, clock: 0, time: 0, state: 'kickoff', stateT: 1, restartHold: true, setKind: 'kickoff', restartTeam: 0, nextKick: 1,
      ctrl: null, cam: { x: PW / 2, y: PL / 2 }, msg: '', msgT: 0, chasers: [[], []], think: 0, previewT: 0, preview: null, idleT: 0,
      input: { jx: 0, jy: 0, sprint: false, skill: null, pass: false, lob: false, shoot: false, shootDown: false, hold: 0, supDown: false, supHold: 0, supShot: false, buf: null },
      possT: [0, 0], landscape: false, paused: false, over: false, celebr: null, pk: null, subOut: null, shootout: null,
      drops: w.kind === 'rain' || w.kind === 'snow' ? Array.from({ length: w.kind === 'rain' ? 150 : 90 }, () => ({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 0.8 })) : null,
      ufo: S.zoeira && Math.random() < 0.5 ? { half: Math.random() < 0.5 ? 1 : 2, at: 0, done: false, t: 0 } : null,
      online: opts.online ? { send: opts.online.send, first: opts.online.first, dive: null, kick: null } : null,
      rec: [], recAcc: 0, recGoalIdx: -1, goalTop: true, replay: null, fx: [], shake: 0, net: null, flash: 0, sayT: -9, sayPri: 0, moodT: 0,
      flight: 0, cornerPlay: null, restartSpot: null, cornerAim: 'six', lastCornerT: -99,
      dbg: opts.auto ? { corners: 0, cornerCross: 0, cornerHeaders: 0, cornerAttHeaders: 0, cornerShots: 0, cornerGoals: 0, claims: 0, punches: 0, catches: 0, parries: 0, fumbles: 0, dives: 0, smothers: 0 } : null,
    };
    if (G.ufo) G.ufo.at = G.halfLen * (0.2 + Math.random() * 0.6);
    st.half = 1;
    G.spPerk = sponsPerk();
    initStaff();
    // organised supporters' groups (Brazilian clubs only): they sit in the stands, wave flags and react to the match
    G.orgs = []; G.fanSup = 0; G.orgSay = '';
    if (!G.auto && !opts.train && G.m && S.teams[G.m.h] && S.teams[G.m.a]) {
      const mkOrg = (id, home) => {
        const nm = fanOrgsOf(id)[0]; if (!nm) return null;
        const t = S.teams[id], neutral = !!G.m.n;
        return { id, name: nm, top: home, c1: t.c1, c2: t.c2 || '#ffffff', half: home && !neutral ? 13 : 8, mood: fanOrgMoodOf(id), cheer: 0, home, seed: hashStr(nm) };
      };
      G.orgs = [mkOrg(G.m.h, true), mkOrg(G.m.a, false)].filter(Boolean);
      const uid = S.user && S.user.team;
      if (uid && G.m.h === uid && !G.m.n && !G.solo) G.fanSup = (fanMoodOf(uid) - 50) / 50; // home crowd: -1 (booing) .. +1 (carrying the team)
      const mine = G.orgs.find((o) => o.id === uid);
      if (G.orgs.length) G.orgSay = mine ? (mine.mood < 32 ? `A ${mine.name} chegou ao estádio de cara fechada: hoje vão cobrar o time.` : `A ${mine.name} lota a arquibancada e canta sem parar.`) : `A ${G.orgs[0].name} marca presença na arquibancada.`;
    }
    G.spTag = [sponsTag(st.sides[0].id), sponsTag(st.sides[1].id)];
    G.spBr = [0, 1].map((k) => sponsBrandOf(st.sides[k].id));
    G.spLogo = [0, 1].map((k) => { const b = sponsBrandOf(st.sides[k].id); return b < 0 ? null : SP_BRANDS[b][4]; });
    buildPlayers();
    resetKickoff(0);
    if (!G.auto) {
      G.state = 'intro'; G.stateT = 3.5;
      evAdd(st, { min: 0, t: 'ko', s: -1, h: 1, txt: `Bola rolando! ${teamName(m.h)} x ${teamName(m.a)}.` });
    }
    return G;
  }

  // ------------------------------------------------------------------ restarts
  function kickoffPos(p) {
    if (p.gk) return { x: PW / 2, y: p.team === 0 ? PL - 1.5 : 1.5 };
    const t = clamp((p.fy - 0.18) / 0.64, 0, 1);
    const depth = 0.14 + t * 0.33;
    const across = p.team === 0 ? p.fx : 1 - p.fx;
    return { x: PW / 2 + (across * PW - PW / 2) * 0.9, y: p.team === 0 ? PL * (1 - depth) : PL * depth };
  }
  function resetKickoff(team) {
    const b = G.ball;
    for (const p of G.players) {
      if (p.out) continue;
      const q = kickoffPos(p);
      p.x = q.x; p.y = q.y;
      if (p.team !== team) {
        const d = Math.hypot(p.x - PW / 2, p.y - PL / 2);
        if (d < 9.6) { const n = nrm(p.x - PW / 2, (p.y - PL / 2) || (p.team === 0 ? 1 : -1)); p.x = PW / 2 + n.x * 9.6; p.y = PL / 2 + n.y * 9.6; }
      }
      Object.assign(p, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, cool: 0, runT: 0, tx: p.x, ty: p.y, dx: 0, dy: p.team === 0 ? -1 : 1, cornerSpot: null, dive: null, diveT: 0, feintT: 0, wall: false, kickT: 0, dv: null, gz: 0, plan: null, cr: null, claim: null, sk: null, skCD: 0 });
    }
    const ks = G.players.filter((p) => !p.out && p.team === team && !p.gk).sort((a, c) => c.fy - a.fy || Math.abs(a.fx - 0.5) - Math.abs(c.fx - 0.5));
    const k1 = ks[0], k2 = ks[1];
    const s = team === 0 ? 1 : -1;
    if (k2) { k2.x = PW / 2 - 7; k2.y = PL / 2 + s * 1.5; }
    if (k1) {
      k1.x = PW / 2; k1.y = PL / 2 + s * 0.65; k1.decT = 0.35;
      if (k2) { const n = nrm(k2.x - k1.x, k2.y - k1.y); k1.dx = n.x; k1.dy = n.y; }
    }
    Object.assign(b, { x: PW / 2, y: PL / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: k1 || null, last: k1 || null, lastTeam: team, shot: null, passer: null, target: null, assist: null, inGoal: false, curve: 0 });
    G.state = 'kickoff'; G.stateT = 0.9; G.restartHold = true; G.setKind = 'kickoff'; G.restartTeam = team; G.celebr = null; G.net = null;
    G.restartSpot = { x: PW / 2, y: PL / 2 }; G.cornerPlay = null;
    G.rec.length = 0; G.recGoalIdx = -1;
    if (!G.auto) G.ctrl = team === 0 ? k1 : nearestTo(0, PW / 2, PL / 2, true);
    G.cam.x = PW / 2; G.cam.y = PL / 2;
  }
  function setPiece(team, x, y, kind) {
    const b = G.ball;
    if (G.tr && !G.tr.own) { if (G.tr.phase === 'live') trainEnd('miss'); return; } // training: the ball going out ends the attempt
    x = clamp(x, 0.2, PW - 0.2); y = clamp(y, 0.2, PL - 0.2);
    if (kind === 'corner') { x = x < PW / 2 ? 0.3 : PW - 0.3; y = y < PL / 2 ? 0.3 : PL - 0.3; } // inside the corner arc
    let taker = kind === 'goalkick' ? keeperOf(team) : null;
    if (!taker) taker = nearestTo(team, x, y, true);
    if (!taker) { resetKickoff(team); return; }
    const fwd = team === 0 ? -1 : 1;
    for (const p of G.players) Object.assign(p, { wall: false, cornerSpot: null, cr: null, dv: null, gz: 0, plan: null, claim: null, diveT: 0, sk: null });
    G.cornerPlay = null;
    if (kind === 'throw') { taker.x = x < PW / 2 ? -0.35 : PW + 0.35; taker.y = y; taker.dx = x < PW / 2 ? 1 : -1; taker.dy = 0; }
    else if (kind === 'corner') { const n = nrm(PW / 2 - x, (y < PL / 2 ? 11 : PL - 11) - y); taker.x = x - n.x * 0.75; taker.y = y - n.y * 0.75; taker.dx = n.x; taker.dy = n.y; }
    else { taker.x = x; taker.y = y - fwd * 0.7; taker.dx = 0; taker.dy = fwd; }
    Object.assign(taker, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, cool: 0, decT: 0.45 + Math.random() * 0.4 });
    Object.assign(b, { x, y, z: 0, vx: 0, vy: 0, vz: 0, owner: taker, last: taker, lastTeam: team, shot: null, passer: null, target: null, curve: 0 });
    G.restartSpot = { x, y }; // the ball waits on its spot, whatever way the taker faces
    for (const p of G.players) {
      if (p.out) continue;
      p.slide = 0;
      if (p.team !== team) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < 9.2) { const n = nrm((p.x - x) || 0.1, (p.y - y) || -fwd); p.x = clamp(x + n.x * 9.2, 0.5, PW - 0.5); p.y = clamp(y + n.y * 9.2, 0.5, PL - 0.5); }
      }
    }
    G.state = 'setpiece'; G.stateT = kind === 'throw' ? 0.5 : kind === 'corner' ? 1.1 : 0.8; G.restartHold = true; G.setKind = kind; G.restartTeam = team;
    G.rec.length = 0; G.recGoalIdx = -1;
    if (taker.gk) taker.holdT = 1.0;
    if (!G.auto && team === 0 && !taker.gk) G.ctrl = taker;
    if (!G.auto && team === 1) G.ctrl = nearestTo(0, x, y, true);
    if (kind === 'corner') {
      G.st.stats.cor[sideOf(team)]++;
      banner('Escanteio', 1);
      say(`Escanteio para ${tA(teamIdOf(team))}.`, 1);
      taker.decT = 0.7 + Math.random() * 0.5;
      setupCorner(team, x, y, taker);
      if (G.dbg) G.dbg.corners++;
      if (!G.auto && team === 0 && !G.solo) { G.cornerAim = 'six'; hint('Escanteio: escolha a área com o direcional (1º pau, meio ou 2º pau) e aperte CHUTE ou LANÇAR para cruzar · PASSE cobra curto.'); }
      if (!G.auto && team === 1) G.ctrl = nearestTo(0, PW / 2, y < PL / 2 ? 6 : PL - 6, true);
    } else if (kind === 'free') {
      const gy = team === 0 ? 0 : PL;
      if (Math.hypot(PW / 2 - x, gy - y) < 30) { buildWall(team, x, y); G.fk = { taker, t: G.time }; if (team === 0 && !G.auto) hint('Falta perigosa: CHUTE bate direto no gol, por cima da barreira (segure para mais força).'); }
    }
    // the computer side changes players during stoppages in the second half
    if (!G.auto && G.half === 2 && minuteNow() > 58 && minuteNow() < 88 && Math.random() < 0.25) cpuSub(minuteInt());
  }
  // defenders line up in a wall between the ball and the goal for dangerous free kicks
  function buildWall(team, x, y) {
    const gy = team === 0 ? 0 : PL;
    const n = nrm(PW / 2 - x, gy - y);
    const wx = x + n.x * 9.2, wy = y + n.y * 9.2;
    const defs = G.players.filter((p) => !p.out && !p.gk && p.team !== team).sort((a, c) => Math.hypot(a.x - wx, a.y - wy) - Math.hypot(c.x - wx, c.y - wy)).slice(0, 4);
    defs.forEach((p, i) => { const off = (i - (defs.length - 1) / 2) * 0.75; p.x = wx - n.y * off; p.y = wy + n.x * off; p.vx = p.vy = 0; p.wall = true; p.dx = -n.x; p.dy = -n.y; });
  }

  // ------------------------------------------------------------------ corners
  // geometry of a corner: goal line, direction into the pitch and side of the flag
  function cornerGeo(bx, by) {
    const gl = by < PL / 2 ? 0 : PL, inward = gl === 0 ? 1 : -1, sx = bx < PW / 2 ? -1 : 1;
    const at = (x, d) => ({ x: clamp(x, 0.6, PW - 0.6), y: gl + inward * d });
    return { gl, inward, sx, at, C: PW / 2 };
  }
  const aerial = (p) => p.phy * 0.45 + (p.hgt - 178) * 1.6 + (p.pos === 'CB' ? 9 : p.pos === 'ST' ? 7 : 0) + p.sho * 0.12;
  // where the crosses of a corner go: near post, six-yard box, far post, penalty spot
  function cornerZones(bx, by) {
    const { sx, at, C } = cornerGeo(bx, by);
    return { near: { ...at(C + sx * 2.0, 4.0), h: 1.85, name: '1º pau' }, six: { ...at(C - sx * 0.3, 6.2), h: 2.0, name: 'meio da área' },
      far: { ...at(C - sx * 3.4, 5.2), h: 2.0, name: '2º pau' }, spot: { ...at(C + sx * 0.6, 10.8), h: 1.8, name: 'marca do pênalti' } };
  }
  // attackers: the best in the air go into the box, one shooter at the edge, one short option, the rest guard the counter;
  // defenders: keeper on his line, one at the near post, two zonal on the six-yard line, markers goal-side, one at the edge, one up front
  function setupCorner(team, bx, by, taker) {
    const { sx, at, C } = cornerGeo(bx, by);
    const att = G.players.filter((p) => !p.out && p.team === team && !p.gk && p !== taker);
    const def = G.players.filter((p) => !p.out && p.team !== team && !p.gk);
    const rest = att.slice().sort((a, c) => aerial(c) - aerial(a));
    const nBox = clamp(att.length - 4, 2, 5);
    const boxSpots = [['near', at(C + sx * 2.6, 3.0)], ['six', at(C + sx * 0.3, 5.8)], ['far', at(C - sx * 3.4, 4.2)], ['spot', at(C + sx * 1.0, 10.6)], ['back', at(C - sx * 6.2, 8.4)]];
    const box = rest.splice(0, nBox);
    // the strongest header takes the central spot
    const order = [1, 2, 0, 3, 4];
    box.forEach((p, i) => { const [role, s] = boxSpots[order[i]]; p.cr = { role, x: s.x, y: s.y }; });
    rest.sort((a, c) => c.sho - a.sho);
    const edge = rest.shift();
    if (edge) edge.cr = { role: 'edge', ...at(C - sx * 1.5, 18.2) };
    rest.sort((a, c) => Math.hypot(a.x - bx, a.y - by) - Math.hypot(c.x - bx, c.y - by));
    const short = rest.length >= 2 ? rest.shift() : null;
    if (short) short.cr = { role: 'short', ...at(bx - sx * 9.5, 3.8) };
    rest.forEach((p, i) => { p.cr = { role: 'back', ...at(C + (i % 2 ? -1 : 1) * (7 + i * 3), 44 + i * 2) }; });
    // defenders
    const dq = def.slice().sort((a, c) => (c.def * 0.6 + aerial(c) * 0.4) - (a.def * 0.6 + aerial(a) * 0.4));
    const threats = box.slice().sort((a, c) => aerial(c) - aerial(a));
    const used = new Set();
    const take = (filter) => { const p = dq.find((q) => !used.has(q) && (!filter || filter(q))); if (p) used.add(p); return p; };
    for (const a of threats) {
      if (dq.length - used.size <= 2 && threats.length > 3) break;
      const m = take();
      if (!m) break;
      const n = nrm(C - a.cr.x, (a.cr.y < PL / 2 ? 0 : PL) - a.cr.y);
      m.cr = { role: 'mark', mark: a, x: a.cr.x + n.x * 0.9, y: a.cr.y + n.y * 0.9 };
    }
    const zonal = [at(C + sx * 2.3, 6.4), at(C - sx * 1.4, 6.4)];
    for (const z of zonal) { const p = take(); if (p) p.cr = { role: 'zone', x: z.x, y: z.y }; }
    const np = take((q) => q.pos !== 'ST');
    if (np) np.cr = { role: 'post', ...at(C + sx * 3.4, 0.9) };
    const ed = take();
    if (ed) ed.cr = { role: 'edge', ...at(C + sx * 1.2, 15.6) };
    dq.filter((q) => !used.has(q)).forEach((p, i) => { p.cr = { role: 'up', ...at(C + (i % 2 ? -1 : 1) * (5 + i * 4), 36) }; });
    const gk = keeperOf(1 - team);
    if (gk) Object.assign(gk, at(C - sx * 0.35, 0.8), { vx: 0, vy: 0, dv: null, gz: 0, plan: null, claim: null });
    const ak = keeperOf(team);
    if (ak) { const home = { x: C, y: (by < PL / 2 ? PL : 0) + (by < PL / 2 ? -1 : 1) * 13 }; Object.assign(ak, home, { vx: 0, vy: 0 }); }
    // everybody takes up the position at once (small jostling around it)
    for (const p of att.concat(def)) {
      if (!p.cr) continue;
      p.x = p.cr.x + (Math.random() - 0.5) * 0.7; p.y = p.cr.y + (Math.random() - 0.5) * 0.7;
      Object.assign(p, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, runT: 0 });
      const n = nrm(bx - p.x, by - p.y); p.dx = n.x; p.dy = n.y;
    }
    if (gk) { const n = nrm(bx - gk.x, by - gk.y); gk.dx = n.x; gk.dy = n.y; }
  }
  // the computer's choice: where its best header is, now and then short
  function aiCornerZone(p) {
    const r = Math.random();
    const short = G.players.find((q) => q.cr && q.cr.role === 'short' && q.team === p.team && !q.out);
    if (short && r < 0.08) return 'short';
    return r < 0.3 ? 'near' : r < 0.62 ? 'six' : r < 0.88 ? 'far' : 'spot';
  }
  // the user's stick picks the area of the cross (seen from the corner flag)
  function zoneFromStick(p, w) {
    if (!(w.x || w.y)) return G.cornerAim || 'six';
    const b = G.ball, Z = cornerZones(b.x, b.y);
    let best = 'six', bs = -2;
    const n = nrm(w.x, w.y);
    for (const k of ['near', 'six', 'far']) { const d = nrm(Z[k].x - b.x, Z[k].y - b.y); const s = d.x * n.x + d.y * n.y; if (s > bs) { bs = s; best = k; } }
    return best;
  }
  // ball flight with drag and swerve: aim so that it comes down to height h right at (tx, ty)
  function simFlight(x, y, vx, vy, vz, curve, T) {
    const dt = 1 / 60;
    let z = 0;
    for (let t = 0; t < T - 1e-6; t += dt) {
      x += vx * dt; y += vy * dt;
      if (curve) { const n = nrm(-vy, vx); vx += n.x * curve * dt; vy += n.y * curve * dt; curve *= Math.exp(-2.2 * dt); if (Math.abs(curve) < 0.05) curve = 0; }
      vz -= 9.8 * dt; z += vz * dt;
      const drag = Math.exp(-0.12 * dt); vx *= drag; vy *= drag;
    }
    return { x, y, z };
  }
  function solveCross(x0, y0, tx, ty, h, apex, curve) {
    const vz = Math.sqrt(2 * 9.8 * apex);
    const T = (vz + Math.sqrt(Math.max(0, vz * vz - 2 * 9.8 * h))) / 9.8;
    let ang = Math.atan2(ty - y0, tx - x0);
    const d0 = Math.hypot(tx - x0, ty - y0);
    let vh = d0 * 0.12 / (1 - Math.exp(-0.12 * T));
    for (let it = 0; it < 5; it++) {
      const e = simFlight(x0, y0, Math.cos(ang) * vh, Math.sin(ang) * vh, vz, curve, T);
      const ex = tx - e.x, ey = ty - e.y;
      if (Math.hypot(ex, ey) < 0.05) break;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const reach = Math.max(1, Math.hypot(e.x - x0, e.y - y0));
      vh *= (reach + ex * dx + ey * dy) / reach;
      ang += Math.atan2(-ex * dy + ey * dx, reach);
    }
    return { vx: Math.cos(ang) * vh, vy: Math.sin(ang) * vh, vz, T };
  }
  // lofted delivery into an area of the box; the receiver attacks the ball
  function deliverCross(p, tx, ty, h, apex, swerve, hitter, zone) {
    const b = G.ball;
    const skill = p.pas / 100;
    // inswinger (bends towards goal) or outswinger
    const gl = ty < PL / 2 ? 0 : PL;
    const v0 = nrm(tx - b.x, ty - b.y);
    const left = { x: -v0.y, y: v0.x };
    const towardGoal = (gl - ty) * left.y > 0 ? 1 : -1; // positive curve bends to the left of the flight
    const curve = swerve * (Math.random() < 0.6 ? towardGoal : -towardGoal);
    const sol = solveCross(b.x, b.y, tx, ty, h, apex, curve);
    const err = (0.012 + (1 - skill) * 0.05) * (p.team === 1 ? G.D.passErr : 0.4);
    const ang = Math.atan2(sol.vy, sol.vx) + grand() * err;
    const vh = Math.hypot(sol.vx, sol.vy) * (1 + grand() * (0.015 + (1 - skill) * 0.04));
    kick(p, Math.cos(ang) * vh, Math.sin(ang) * vh, sol.vz * (1 + grand() * 0.02));
    b.curve = curve;
    b.passer = p; b.target = hitter || null;
    b.cross = { team: p.team, x: tx, y: ty, h, t: G.time + sol.T, zone };
    return sol.T;
  }
  function cornerKick(p, zone) {
    const b = G.ball, Z = cornerZones(b.x, b.y);
    hint('');
    if (zone === 'short') {
      const s = G.players.find((q) => q.cr && q.cr.role === 'short' && q.team === p.team && !q.out) || bestReceiver(p, nrm(PW / 2 - b.x, 0.001), false);
      passTo(p, s, nrm(s ? s.x - b.x : 1, s ? s.y - b.y : 0), false, false);
      say(`${nameOf(p)} cobra curto.`, 0);
      G.cornerPlay = null;
      return;
    }
    const z = Z[zone] || Z.six;
    // the attacker closest to the area goes for the ball
    const box = G.players.filter((q) => !q.out && q.team === p.team && !q.gk && q !== p && q.cr && ['near', 'six', 'far', 'spot', 'back'].includes(q.cr.role));
    box.sort((a, c) => Math.hypot(a.x - z.x, a.y - z.y) - Math.hypot(c.x - z.x, c.y - z.y));
    const hitter = box[0] || null;
    const d = Math.hypot(z.x - G.ball.x, z.y - G.ball.y);
    const apex = clamp(2.6 + d * 0.085 + (Math.random() - 0.5) * 0.6, 3.4, 6.2);
    const g = cornerGeo(b.x, b.y);
    const T = deliverCross(p, z.x, z.y, z.h, apex, 2.2 + Math.random() * 1.6, hitter, zone);
    G.lastCornerT = G.time;
    G.cornerPlay = { team: p.team, zone, x: z.x, y: z.y, h: z.h, t: G.time + T, until: G.time + T + 1.4, hitter, ...g };
    if (G.dbg) G.dbg.cornerCross++;
    say(`${nameOf(p)} levanta na área, ${z.name === 'meio da área' ? 'no meio da área' : z.name === 'marca do pênalti' ? 'na marca do pênalti' : 'no ' + z.name}.`, 1);
  }

  // ------------------------------------------------------------------ penalties (in play and in the shoot-out)
  function startPenalty(team) {
    const up = team === 0;
    const gy = up ? 0 : PL, fwd = up ? -1 : 1;
    let taker = G.players.filter((p) => !p.out && p.team === team && !p.gk).sort((a, c) => c.sho - a.sho)[0];
    if (G.solo && team === 0) { const me = soloSprite(); if (me && taker && me.sho >= taker.sho - 8) taker = me; } // player career: he takes it when he is among the best kickers
    const gk = keeperOf(1 - team);
    if (!taker) { setPiece(team, PW / 2, gy - fwd * 11, 'free'); return; }
    for (const p of G.players) {
      if (p.out || p === taker || p === gk) continue;
      Object.assign(p, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, wall: false });
      if (Math.abs(p.y - gy) < BOX_D + 2) p.y = gy - fwd * (BOX_D + 2 + Math.random() * 5);
    }
    setupKick(team, taker, gk, false);
    banner('PÊNALTI!', 1.6);
    say(`Pênalti para ${tA(teamIdOf(team))}! ${nameOf(taker)} vai para a cobrança.`, 3);
    sfx('whistle', 0.6);
  }
  // place taker, keeper and ball; in the shoot-out every kick goes to the top goal
  function setupKick(team, taker, gk, shootout) {
    const b = G.ball;
    const up = shootout ? true : team === 0;
    const gy = up ? 0 : PL, fwd = up ? -1 : 1;
    const spotY = gy - fwd * 11;
    Object.assign(taker, { x: PW / 2 + 0.4, y: spotY - fwd * 1.6, dx: -0.2, dy: fwd, vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, kickT: 0 });
    if (gk) Object.assign(gk, { x: PW / 2, y: gy - fwd * 0.4, vx: 0, vy: 0, wx: 0, wy: 0, dive: null, diveT: 0, diveDir: 0, dx: 0, dy: -fwd, fall: 0, dv: null, gz: 0, plan: null, claim: null });
    G.cornerPlay = null;
    Object.assign(b, { x: PW / 2, y: spotY, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: taker, lastTeam: team, shot: null, passer: null, target: null, assist: null, inGoal: false, curve: 0 });
    const userShoots = !G.auto && team === 0 && (!G.solo || taker.pid === G.solo);
    const userDives = !G.auto && team === 1 && !!gk && !G.solo;
    G.pk = { team, taker, gk, shootout, up, fwd, dirX: up ? 1 : -1, gy, phase: userShoots ? 'aim' : userDives ? 'dive' : 'auto', t: 0, aim: 0, power: 0, charging: false, dive: 0, run: false, outcome: null, scored: false, dead: false };
    G.state = 'penalty'; G.restartHold = true; G.setKind = 'penalty';
    Object.assign(G.input, { shootDown: false, shoot: false, hold: 0, pass: false, lob: false, buf: null });
    G.cam.x = PW / 2; G.cam.y = up ? (G.landscape ? 12 : 7) : (G.landscape ? PL - 12 : PL + 2.5);
    G.rec.length = 0; G.recGoalIdx = -1;
    if (userShoots) G.ctrl = taker;
    if (userShoots) hint(`${nameOf(taker)} na cobrança: mire com o direcional e segure CHUTE para dar força.`);
    else if (userDives) hint(`${nameOf(taker)} vai bater: escolha o canto do goleiro com o direcional.`);
    else hint('');
  }
  function penaltyStep(dt) {
    const k = G.pk, I = G.input;
    k.t += dt;
    idle(dt);
    if (!G.pk) return;
    if (k.phase === 'aim') {
      const kd = keyDir();
      const w = screenToWorld(I.jx + kd.x, I.jy + kd.y);
      if (Math.abs(w.x) > 0.2) k.aim = clamp(k.aim + Math.sign(w.x * k.dirX) * dt * 1.5, -1.1, 1.1);
      if (I.shootDown) { k.charging = true; k.power = Math.min(1.08, k.power + dt / 0.85); }
      I.pass = false; I.lob = false;
      if ((k.charging && !I.shootDown) || I.shoot || k.t > 8) {
        I.shoot = false; I.hold = 0; I.shootDown = false;
        k.kp = k.charging ? Math.max(0.35, k.power) : 0.65; k.ka = k.aim;
        k.phase = 'runup'; k.t = 0; k.run = true;
        if (G.online) G.online.send({ t: 'r', n: kickNo() });
      }
    } else if (k.phase === 'runup') {
      if (k.t > (G.online ? 0.6 : 0.38)) takeKick(k.kp, k.ka);
    } else if (k.phase === 'dive') {
      const kd = keyDir();
      const w = screenToWorld(I.jx + kd.x, I.jy + kd.y);
      if (Math.abs(w.x) > 0.3) k.dive = Math.sign(w.x * k.dirX);
      else if (Math.abs(w.y) > 0.6) k.dive = 0;
      I.pass = false; I.shoot = false; I.lob = false;
      if (G.online) {
        // online: tell the shooter's screen where I dive; the kick arrives from his screen with the outcome already decided
        const on = G.online, n = kickNo();
        if (k.lastDive !== k.dive || k.lastDiveN !== n) { k.lastDive = k.dive; k.lastDiveN = n; on.send({ t: 'd', n, side: k.dive }); }
        if (on.kick && on.kick.n === n) { const F = on.kick; on.kick = null; takeKick(F.power, F.aim, F); }
        return;
      }
      if (k.t > 1.15) k.run = true;
      if (k.t > 1.55) takeKick(0.72 + Math.random() * 0.22, null);
    } else if (k.phase === 'auto') {
      if (k.t > 1.0) k.run = true;
      if (k.t > 1.4) takeKick(0.72 + Math.random() * 0.22, null);
    } else if (k.phase === 'flight') {
      if (k.t > 0.5) G.slow = 1;
      if (k.t > (k.shootout ? 1.75 : 2.1)) finishKick();
    }
  }
  // decide and launch a penalty kick; aim in [-1, 1] across the goal mouth from the taker's view (null = computer)
  function kickNo() { const so = G.shootout; return so ? so.kicks[0].length + so.kicks[1].length : 0; }
  function takeKick(power, aim, F) {
    const k = G.pk, b = G.ball;
    const taker = k.taker, gk = k.gk;
    let diveSide, outcome, over, wide, h;
    if (F) { ({ aim, diveSide, outcome, over, wide, h, power } = F); }
    else {
    if (aim === null) aim = Math.random() < 0.12 ? (Math.random() - 0.5) * 0.3 : (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.55);
    const skill = taker.sho / 100;
    aim += grand() * (1.05 - skill) * 0.2 + (power > 0.95 ? grand() * 0.15 : 0);
    // keeper's guess: the user's choice, or the computer reading the kick
    if (k.phase === 'dive') diveSide = k.dive;
    else if (G.online) { const dv = G.online.dive; diveSide = dv && dv.n === kickNo() ? dv.side : 0; }
    else { const r = Math.random(); diveSide = r < 0.42 ? -1 : r < 0.84 ? 1 : 0; if (gk && Math.random() < 0.1 + (gk.ovr - 75) * 0.006) diveSide = Math.abs(aim) < 0.28 ? 0 : Math.sign(aim); }
    let aimSide = Math.abs(aim) < 0.28 ? 0 : Math.sign(aim);
    over = power > 0.95 && Math.random() < (power - 0.95) * 7;
    wide = Math.abs(aim) > 1.0;
    if (over || wide) outcome = 'miss';
    else if (!gk) outcome = 'goal';
    else if (diveSide === aimSide) {
      const corner = Math.abs(aim) > 0.72;
      const bonus = gk.team === 1 ? G.D.cpuSave : G.D.userSave;
      // a user keeper who guessed the side is rewarded: he saves most of them (less in the top corners)
      const base = gk.team === 0 ? (aimSide === 0 ? 0.94 : corner ? 0.62 : 0.86) : (aimSide === 0 ? 0.85 : corner ? 0.3 : 0.68);
      const pSave = base + (gk.ovr - 75) * 0.006 - (power - 0.7) * (gk.team === 0 ? 0.25 : 0.4) + bonus;
      outcome = Math.random() < clamp(pSave, 0.1, 0.92) ? 'save' : 'goal';
    } else outcome = 'goal';
    // a goal despite the keeper picking the right side only happens in the corner, out of his reach
    if (outcome === 'goal' && diveSide === aimSide && aimSide !== 0 && Math.abs(aim) < 0.9) aim = aimSide * 0.92;
    h = over ? 2.8 + Math.random() * 1.2 : 0.15 + Math.random() * (0.5 + power * 1.0);
    if (outcome === 'goal' && diveSide === aimSide && aimSide !== 0) h = Math.max(h, 0.9);
    if (G.online) G.online.send({ t: 'k', n: kickNo(), aim, diveSide, outcome, over, wide, h, power });
    }
    const aimSide = Math.abs(aim) < 0.28 ? 0 : Math.sign(aim);
    const tx = PW / 2 + k.dirX * aim * (GOAL_W / 2 - 0.25) * (wide ? 1.06 : 1);
    const dx = tx - b.x, dy = k.gy - b.y, d = Math.hypot(dx, dy);
    const sp = 19 + power * 9;
    const t = d / sp;
    const vz = (h + 4.9 * t * t) / t;
    taker.kickT = 0.3; k.run = false;
    Object.assign(b, { owner: null, vx: dx / d * sp, vy: dy / d * sp, vz, last: taker, lastTeam: k.team, passer: null, target: null, curve: 0 });
    b.shot = { team: k.team, by: taker, t: 0, checked: false, beaten: false, force: outcome, pk: true };
    if (!k.shootout) G.st.stats.sh[sideOf(k.team)]++;
    if (gk) {
      // the keeper's dive follows the real play: to the ball on a save, short of it when beaten on the right side, the whole way on the wrong side
      const gsg = k.dirX * diveSide;
      let x1 = gk.x, hz = clamp(0.35 + h * 0.6, 0.4, 1.3);
      if (diveSide !== 0) {
        if (outcome === 'save') x1 = PW / 2 + clamp(tx - PW / 2, -3.6, 3.6);
        else if (diveSide === aimSide) x1 = PW / 2 + gsg * 2.1;
        else x1 = PW / 2 + gsg * 3.1;
      } else hz = outcome === 'save' ? 0.7 : 0.45;
      const T = clamp(t * 1.08, 0.38, 0.8);
      gk.diveDir = diveSide ? Math.sign(x1 - gk.x) || gsg : 0;
      gk.diveT = diveSide ? T + 1.0 : 0;
      gk.dive = { x0: gk.x, x1, T, t: T, hz };
    }
    k.phase = 'flight'; k.t = 0; k.outcome = outcome;
    G.slow = 0.55; G.slowPk = 1; // slow motion on the kick
    sfx('kick', 0.9);
    hint('');
  }
  function finishKick() {
    G.slow = 1; G.slowPk = 0;
    const k = G.pk;
    if (!k) return;
    if (k.shootout) { shootoutResult(); return; }
    G.pk = null;
    hint('');
    const b = G.ball, gk = k.gk, defending = 1 - k.team;
    if (k.outcome === 'save' && gk && !gk.out && b.y > 0 && b.y < PL && Math.hypot(b.vx, b.vy) < 2) { take(gk); gk.holdT = 1; G.state = 'play'; G.restartHold = false; return; }
    if (!k.dead && b.y > 0.3 && b.y < PL - 0.3 && b.x > 0.3 && b.x < PW - 0.3) { G.state = 'play'; G.restartHold = false; return; }
    if (b.lastTeam === defending) setPiece(k.team, b.x < PW / 2 ? 0.3 : PW - 0.3, k.up ? 0.3 : PL - 0.3, 'corner');
    else setPiece(defending, PW / 2 + (b.x < PW / 2 ? -5 : 5), k.up ? 5.5 : PL - 5.5, 'goalkick');
  }

  // ------------------------------------------------------------------ shoot-out (knockout ties still level after extra time)
  function initShootout() {
    const order = (team) => G.players.filter((p) => !p.out && p.team === team && !p.gk).sort((a, c) => c.sho - a.sho);
    G.shootout = { kicks: [[], []], order: [order(0), order(1)], idx: [0, 0], turn: G.online ? G.online.first : (Math.random() < 0.5 ? 0 : 1), done: false, seq: [] };
    return G.shootout;
  }
  function startShootout() {
    initShootout();
    G.state = 'shootoutIntro'; G.stateT = 2.2;
    if (root) root.classList.add('so');
    banner('Pênaltis!', 2);
    say(`Vai para os pênaltis! Começa batendo ${tA(teamIdOf(G.shootout.turn))}.`, 3);
    sfx('whistle', 1);
    G.cam.x = PW / 2; G.cam.y = G.landscape ? 12 : 7;
    lineUpForKicks(null, null);
    showShootoutHud();
  }
  function lineUpForKicks(taker, gk) {
    let i0 = 0, i1 = 0;
    for (const p of G.players) {
      if (p.out || p === taker || p === gk) continue;
      if (p.gk) { p.x = PW / 2 + (p.team === 0 ? -13 : 13); p.y = 15; p.dx = 0; p.dy = -1; }
      else {
        const i = p.team === 0 ? i0++ : i1++;
        p.x = PW / 2 + (p.team === 0 ? -1 : 1) * (2.2 + (i % 5) * 1.25);
        p.y = PL / 2 + (i < 5 ? -0.8 : 0.8);
        p.dx = 0; p.dy = -1;
      }
      Object.assign(p, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, dive: null, diveT: 0 });
    }
  }
  function shootoutTaker(team) {
    const so = G.shootout, list = so.order[team];
    if (!list.length) return null;
    const t = list[so.idx[team] % list.length];
    so.idx[team]++;
    return t;
  }
  function nextShootoutKick() {
    const so = G.shootout, team = so.turn;
    const taker = shootoutTaker(team);
    const gk = keeperOf(1 - team);
    if (!taker) { shootoutRecord(team, null, false); if (so.done) { G.state = 'shootoutEnd'; G.stateT = 2.5; } return; }
    lineUpForKicks(taker, gk);
    setupKick(team, taker, gk, true);
  }
  // record one kick; returns true when the shoot-out is decided
  function shootoutRecord(team, taker, scored) {
    const so = G.shootout;
    so.kicks[team].push(!!scored);
    so.seq.push([sideOf(team), taker ? taker.pid : 0, !!scored]);
    const a = so.kicks[0].filter(Boolean).length, c = so.kicks[1].filter(Boolean).length;
    const na = so.kicks[0].length, nc = so.kicks[1].length;
    let over = false;
    if (na <= 5 && nc <= 5) {
      if (a > c + (5 - nc) || c > a + (5 - na)) over = true;
      else if (na === 5 && nc === 5 && a !== c) over = true;
    } else if (na === nc && a !== c) over = true;
    if (over || na + nc > 60) { finishShootout(); return true; }
    so.turn = 1 - team;
    return false;
  }
  function finishShootout() {
    const so = G.shootout, st = G.st, m = G.m;
    so.done = true;
    const a = so.kicks[0].filter(Boolean).length, c = so.kicks[1].filter(Boolean).length;
    const score = [0, 0];
    score[sideOf(0)] = a; score[sideOf(1)] = c;
    st.pen = score; st.penSeq = so.seq; st.penPlayed = true; st.et = true;
    evAdd(st, { min: 120, t: 'pen', s: -1, h: 3, txt: `Pênaltis: ${teamName(m.h)} ${score[0]} x ${score[1]} ${teamName(m.a)}.` });
  }
  function simShootoutKick() {
    const so = G.shootout, team = so.turn;
    const t = shootoutTaker(team), gk = keeperOf(1 - team);
    const p = clamp(0.76 + ((t ? t.sho : 60) - 70) * 0.004 - ((gk ? gk.ovr : 60) - 75) * 0.004, 0.55, 0.92);
    shootoutRecord(team, t, Math.random() < p);
  }
  function shootoutResult() {
    const k = G.pk;
    G.pk = null;
    hint('');
    if (G.tr) { trainEnd(k.scored ? 'goal' : k.outcome === 'save' ? 'save' : 'miss'); return; }
    const scored = G.online ? k.outcome === 'goal' : !!k.scored; // online: both screens use the decided outcome, never the physics
    const over = shootoutRecord(k.team, k.taker, scored);
    banner(scored ? 'GOL!' : k.outcome === 'save' ? 'DEFENDEU!' : 'PERDEU!', 1.3);
    if (scored) say(`${nameOf(k.taker)} converte para ${tA(teamIdOf(k.team))}.`, 2);
    else if (k.outcome === 'save') say(`${nameOf(k.gk)} defende a cobrança de ${nameOf(k.taker)}!`, 2);
    else say(`${nameOf(k.taker)} desperdiça a cobrança!`, 2);
    sfx(scored === (k.team === 0) ? 'roar' : 'groan', 0.7);
    showShootoutHud();
    if (over) {
      const so = G.shootout;
      const won = so.kicks[0].filter(Boolean).length > so.kicks[1].filter(Boolean).length;
      G.state = 'shootoutEnd'; G.stateT = 3;
      setTimeout(() => { if (G && G.state === 'shootoutEnd') { banner(won ? 'VITÓRIA NOS PÊNALTIS!' : 'DERROTA NOS PÊNALTIS', 2.5); say(won ? `${TA(teamIdOf(0))} vence nos pênaltis!` : `${TA(teamIdOf(1))} vence nos pênaltis.`, 3); if (won) { confetti(sideOf(0)); sfx('roar', 1); } } }, G.auto ? 0 : 1100);
      return;
    }
    G.state = 'shootoutWait'; G.stateT = 1.2;
  }

  // ------------------------------------------------------------------ training drills (penalties, free kicks, passes), like the FIFA skill games
  const TR_INFO = {
    pen: { name: 'Pênaltis', total: 10, ok: ['goal'], hint: 'Mire com o direcional e segure CHUTE para dar força.' },
    free: { name: 'Faltas', total: 8, ok: ['goal'], hint: 'Falta: CHUTE bate por cima da barreira (segure para mais força).' },
    pass: { name: 'Passes', total: 10, ok: ['ok'], hint: 'Passe para o companheiro marcado com o anel azul: PASSE rasteiro, LANÇAR por cima.' },
  };
  const TR_TXT = { goal: 'GOL!', save: 'DEFENDEU!', block: 'NA BARREIRA!', miss: 'ERROU!', ok: 'PASSE CERTO!', wrong: 'PASSE ERRADO!' };
  function startTraining(kind, m, st, opts, done) {
    onDone = done;
    create(m, st, Object.assign({}, opts, { minutes: 999 }));
    buildDom();
    sfxInit(opts.sound);
    root.classList.add('train');
    const info = TR_INFO[kind];
    G.tr = { kind, total: info.total, n: 0, score: 0, res: [], phase: 'wait', wait: 0.9, target: null, taker: null, own: false, t: 0, last: null };
    // the shooter/passer: the career player when he is there, otherwise the best at it
    const pool = G.players.filter((p) => p.team === 0 && !p.gk);
    pool.sort((a, c) => (kind === 'pass' ? c.pas - a.pas : c.sho - a.sho));
    G.tr.taker = (opts.pid && pool.find((p) => p.pid === opts.pid)) || pool[0];
    G.ctrl = G.tr.taker;
    G.tr.dispName = nameOf(G.tr.taker);
    let n = 0;
    for (const p of G.players) {
      if (p === G.tr.taker) continue;
      if (kind === 'pen') { if (!(p.gk && p.team === 1)) p.out = true; }
      else if (kind === 'free') { if (p.team === 0) p.out = true; else if (!p.gk && n++ >= 4) p.out = true; }
      else if (p.team === 1 || p.gk) p.out = true;
      else if (n++ >= 5) p.out = true;
    }
    const bar = document.createElement('div');
    bar.className = 'g2-trbar'; bar.id = 'g2-tr';
    root.appendChild(bar);
    hud.tr = bar;
    trainBar();
    G.state = 'trainWait'; G.restartHold = true;
    say(`Treino de ${info.name.toLowerCase()}: ${G.tr.dispName}.`, 3);
    G.last = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  function trainBar() {
    if (!hud.tr || !G || !G.tr) return;
    const t = G.tr, info = TR_INFO[t.kind];
    const dots = Array.from({ length: t.total }, (_, i) => { const r = t.res[i]; return `<i class="${r === undefined ? '' : info.ok.includes(r) ? 'ok' : 'bad'}"></i>`; }).join('');
    hud.tr.innerHTML = `<div class="t">🎯 ${info.name} · ${Math.min(t.n + 1, t.total)}/${t.total}</div><div class="d">${dots}</div><div class="s"><b>${t.score}</b> ${t.kind === 'pass' ? 'certos' : 'gols'}</div>`;
  }
  function trainEnd(res) {
    const t = G.tr;
    if (!t || t.phase === 'wait' || t.phase === 'done') return;
    t.phase = 'wait'; t.n++; t.res.push(res);
    const ok = TR_INFO[t.kind].ok.includes(res);
    if (ok) t.score++;
    banner(TR_TXT[res] || 'ERROU!', 1.2);
    sfx(ok ? 'roar' : 'groan', 0.6);
    trainBar();
    hint('');
    G.pk = null;
    G.state = 'trainWait'; G.restartHold = true; t.wait = 1.7; G.slow = 1;
  }
  function trainNext() {
    const t = G.tr, taker = t.taker, b = G.ball;
    t.phase = 'ready'; t.t = 0; G.state = 'play'; G.restartHold = false;
    G.ctrl = taker;
    trainBar();
    if (t.kind === 'pen') { setupKick(0, taker, keeperOf(1), true); return; }
    for (const p of G.players) Object.assign(p, { vx: 0, vy: 0, wx: 0, wy: 0, slide: 0, fall: 0, dive: null, diveT: 0, dv: null, gz: 0, plan: null, claim: null, cool: 0, wall: false });
    if (t.kind === 'free') {
      const x = PW / 2 + (Math.random() - 0.5) * 36, y = 19 + Math.random() * 12;
      const gk = keeperOf(1);
      if (gk) Object.assign(gk, { x: PW / 2, y: 1.2, dx: 0, dy: 1 });
      t.own = true;
      setPiece(0, x, y, 'free');
      t.own = false;
      G.ctrl = taker;
      say(`Falta a ${Math.round(Math.hypot(PW / 2 - x, y))} metros do gol.`, 2);
      hint(TR_INFO.free.hint);
      return;
    }
    // passes: the taker with the ball, the receivers spread around him
    Object.assign(taker, { x: PW / 2, y: PL * 0.62, dx: 0, dy: -1 });
    const recs = G.players.filter((p) => p.team === 0 && !p.gk && !p.out && p !== taker);
    recs.forEach((p, i) => {
      const ang = -Math.PI + ((i + 0.5) / recs.length) * Math.PI + (Math.random() - 0.5) * 0.35;
      const d = 8 + Math.random() * 8;
      p.x = clamp(taker.x + Math.cos(ang) * d, 4, PW - 4); p.y = clamp(taker.y + Math.sin(ang) * d, 12, PL - 8);
      const l = Math.hypot(taker.x - p.x, taker.y - p.y) || 1;
      p.dx = (taker.x - p.x) / l; p.dy = (taker.y - p.y) / l;
    });
    let tg; do { tg = recs[Math.floor(Math.random() * recs.length)]; } while (recs.length > 1 && tg === t.last);
    t.target = tg; t.last = tg;
    Object.assign(b, { x: taker.x, y: taker.y, z: 0, vx: 0, vy: 0, vz: 0, inGoal: false });
    take(taker);
    G.cam.x = PW / 2; G.cam.y = taker.y - 6;
    hint(`Passe para ${nameOf(tg)} (anel azul).`);
  }
  // returns true when the drill handled the whole step
  function trainStep(dt) {
    const t = G.tr, b = G.ball;
    if (G.state === 'over') return true;
    if (G.state === 'trainWait') {
      t.wait -= dt;
      idle(dt); camera(dt);
      if (t.wait <= 0) { if (t.n >= t.total) trainFinish(); else trainNext(); }
      return true;
    }
    if (t.phase === 'done' || t.kind === 'pen') return false;
    if (t.phase === 'ready') {
      if (b.owner !== t.taker && (b.shot || Math.hypot(b.vx, b.vy) > 1.5)) { t.phase = 'live'; t.t = 0; }
    } else if (t.phase === 'live') {
      t.t += dt;
      const o = b.owner;
      if (t.kind === 'free') { if (o) trainEnd(o.gk ? 'save' : o.team === 1 ? 'block' : 'miss'); }
      else if (o) trainEnd(o === t.target ? 'ok' : o === t.taker ? 'miss' : 'wrong');
      if (t.phase === 'live' && (t.t > 7 || b.y < -1.2 || b.y > PL + 1.2 || b.x < -1.2 || b.x > PW + 1.2)) trainEnd('miss');
    }
    return false;
  }
  function trainFinish() {
    const t = G.tr;
    t.phase = 'done';
    G.state = 'over';
    const info = TR_INFO[t.kind];
    const pct = t.score / t.total;
    const grade = pct >= 0.9 ? 'S' : pct >= 0.75 ? 'A' : pct >= 0.55 ? 'B' : pct >= 0.35 ? 'C' : 'D';
    G.trResult = { kind: t.kind, score: t.score, total: t.total, res: t.res.slice(), grade, name: t.dispName };
    hud.pause.innerHTML = `<div class="card"><h2>Treino de ${esc(info.name.toLowerCase())} concluído</h2>
      <div class="disp" style="font-size:54px;font-weight:800;line-height:1;margin:8px 0">${t.score}/${t.total}</div>
      <div class="muted">Nota <b style="color:var(--gold)">${grade}</b> · ${esc(t.dispName)}</div>
      <div class="g2-trdots">${t.res.map((r) => `<i class="${info.ok.includes(r) ? 'ok' : 'bad'}" title="${esc(TR_TXT[r] || '')}"></i>`).join('')}</div>
      <div class="row" style="justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap"><button class="btn primary big" data-g="trdone">Concluir</button></div></div>`;
    hud.pause.hidden = false;
    hud.pause.onclick = (e) => { const b2 = e.target.closest('button'); if (b2 && b2.dataset.g === 'trdone') trainClose(); };
  }
  function trainClose() {
    const res = G.trResult || null, cb = onDone;
    cleanup(); G = null;
    if (cb) cb(res);
  }
  // ---- the people around the pitch: referee, two assistants (flags), both coaches and the substitutes on their benches
  const BENCH_X = -4.7, TECH_X = -2.1;
  function initStaff() {
    const mk = (x, y) => ({ x, y, vx: 0, vy: 0, ph: Math.random() * 6 });
    // the officials are drawn with the same body, run cycle and shadow as the players (own kit, no shirt number)
    const official = (name, x, y, kit, seed) => {
      const fake = { id: 880000 + seed, n: name + seed, s: name, nat: seed % 2 ? 'BRA' : 'ENG', o: 70, pot: 70, age: 40, a: [72, 70, 70, 70, 70, 70], h: 178, p: 'CM' };
      const sp = makeSprite(fake, 2, 2, 'CM', 0.5, 0.5, 0);
      Object.assign(sp, { x, y, kitOv: kit, num: '', staff: true, ph: seed });
      return sp;
    };
    const REF = { shirt: '#f2d21b', trim: '#15171a', shorts: '#15171a', socks: '#15171a' }, ASS = { shirt: '#e8c11a', trim: '#15171a', shorts: '#15171a', socks: '#15171a' };
    G.ref = official('Árbitro', PW / 2 + 8, PL / 2 - 6, REF, 1);
    G.lines = [Object.assign(official('Bandeirinha', -1.3, PL * 0.28, ASS, 2), { lo: 2, hi: PL / 2 + 8, flag: 0, flagC: true }), Object.assign(official('Bandeirinha', PW + 1.3, PL * 0.72, ASS, 3), { lo: PL / 2 - 8, hi: PL - 2, flag: 0, flagC: true })];
    G.coaches = [0, 1].map((team) => Object.assign(mk(TECH_X, PL / 2 + (team === 0 ? 11 : -11)), { team, y0: PL / 2 + (team === 0 ? 11 : -11), mode: 'walk', mt: 0 }));
    G.oppLook = { skin: 1 + (hashStr(String(G.st.sides[1].id)) % 3), hair: hashStr('c' + G.st.sides[1].id) % 4, hs: hashStr('h' + G.st.sides[1].id) % 3, suit: ['#2b2f3a', '#3a3a3a', '#1f3b4d', '#4a2c2c'][hashStr('s' + G.st.sides[1].id) % 4], tie: '#d9d9d9' };
  }
  function approach(o, tx, ty, sp, dt) {
    const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
    const want = Math.min(sp, d * 2.2);
    const nx = d > 0.05 ? dx / d * want : 0, ny = d > 0.05 ? dy / d * want : 0;
    o.vx += (nx - o.vx) * Math.min(1, dt * 5); o.vy += (ny - o.vy) * Math.min(1, dt * 5);
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (o.staff) { // face where he runs (the referee watches the ball when he stands) and run like a player
      const v = Math.hypot(o.vx, o.vy);
      if (v > 0.4) { o.dx = o.vx / v; o.dy = o.vy / v; } else { const b = G.ball, n = nrm(b.x - o.x, b.y - o.y); o.dx = n.x; o.dy = n.y; }
      o.anim += v * dt * 1.9;
    }
  }
  function stepStaff(dt) {
    if (!G.ref) return;
    const b = G.ball, play = G.state === 'play' || G.state === 'penalty';
    // referee: keeps a diagonal, a few metres from the play and never on top of the ball
    const r = G.ref;
    let tx = b.x + (b.x < PW / 2 ? 7 : -7), ty = b.y + (b.vy > 0 ? -6 : 6) * (b.owner ? 1 : 0.6);
    if (G.state === 'goal' || G.state === 'halftime' || G.state === 'fulltime') { tx = PW / 2; ty = PL / 2 + 3; }
    else if (G.restartHold && G.setKind === 'kickoff') { tx = PW / 2 + 5; ty = PL / 2 - 3; }
    else if (G.pk || G.shootout) { tx = PW / 2 + 15; ty = G.pk ? (G.pk.up ? 14 : PL - 14) : 14; }
    else if (G.restartHold && G.setKind === 'corner') { tx = b.x < PW / 2 ? 12 : PW - 12; ty = b.y < PL / 2 ? 14 : PL - 14; }
    if (!G.pk && Math.hypot(tx - b.x, ty - b.y) < 7) { const n = nrm(tx - b.x || 1, ty - b.y); tx = b.x + n.x * 7; ty = b.y + n.y * 7; }
    approach(r, clamp(tx, 3, PW - 3), clamp(ty, 3, PL - 3), play ? 5.6 : 3.6, dt);
    // assistants: along the touchline, each one in his half, level with the ball
    for (const l of G.lines) {
      let ly = clamp(b.y, l.lo, l.hi);
      approach(l, l.x, ly, 5.4, dt); l.x = l.x < 0 ? -1.3 : PW + 1.3;
      const out = G.restartHold && G.state === 'play' && (G.setKind === 'throw' || G.setKind === 'corner' || G.setKind === 'goalkick');
      const near = Math.abs(b.y - l.y) < Math.abs(b.y - G.lines.find((q) => q !== l).y);
      const want = out && near ? 1 : 0;
      l.flag += (want - l.flag) * Math.min(1, dt * 7);
    }
    // coaches: pace in the technical area, follow the play along the touchline, react to goals
    for (const c of G.coaches) {
      c.mt -= dt;
      const mine = c.team;
      let ty = c.y0 + clamp((b.y - PL / 2) * 0.32, -8, 8) + Math.sin(G.time * 0.6 + mine * 2) * 2.2;
      let sp = 1.6, nx = TECH_X + Math.sin(G.time * 0.35 + mine) * 0.4;
      c.mode = 'walk';
      if (G.state === 'goal' && G.celebr) {
        if (G.celebr.scorer.team === c.team) { c.mode = 'celeb'; ty = clamp(G.celebr.scorer.y, 12, PL - 12); sp = 4.4; nx = -1.6; }
        else { c.mode = 'sad'; sp = 0.8; ty = c.y; }
      } else if (c.mt <= 0 && Math.random() < dt * 0.25) { c.mt = 3 + Math.random() * 3; c.mode = 'point'; }
      if (c.mt > 0 && c.mode === 'walk') c.mode = c.mt > 0 && c.mt < 5 && c.mt > 2.9 ? 'point' : 'walk';
      approach(c, nx, clamp(ty, 6, PL - 6), sp, dt);
    }
  }
  function skinFor(p) {
    const h = hashStr(p.n + '|' + p.id);
    const si = DARK.has(p.nat) ? 3 + (h % 3) : MIXED.has(p.nat) ? h % 6 : h % 3;
    return { skin: SKINS[si], hair: HAIRS[(h >> 6) % HAIRS.length], hs: (h >> 11) % 5 };
  }
  // the substitutes (and the players already taken off) waiting on the bench, per team
  function benchSeats() {
    const out = [];
    for (const team of [0, 1]) {
      const k = sideOf(team), side = G.st.sides[k];
      const ids = side.bench.filter((q) => !side.on.includes(q)).concat(side.out || []).filter((q, i, a) => a.indexOf(q) === i).slice(0, 12);
      const y0 = PL / 2 + (team === 0 ? 11 : -11), n = ids.length;
      ids.forEach((pid, i) => { const p = S.players[pid]; if (p) out.push({ x: BENCH_X, y: y0 + (i - (n - 1) / 2) * 1.55, side: k, p, i, off: (side.out || []).includes(pid) }); });
    }
    return out;
  }
  function drawBenchGround(s) {
    for (const team of [0, 1]) {
      const y0 = PL / 2 + (team === 0 ? 11 : -11);
      const pts = [[-6.2, y0 - 9.5], [-3.5, y0 - 9.5], [-3.5, y0 + 9.5], [-6.2, y0 + 9.5]];
      ctx.fillStyle = 'rgba(15,20,28,0.55)'; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, s * 0.07);
      ctx.beginPath(); pts.forEach(([x, y], i) => { const X = PX(x, y), Y = PY(x, y); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      // the technical area line
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(PX(-0.8, y0 - 8), PY(-0.8, y0 - 8)); ctx.lineTo(PX(-3.3, y0 - 8), PY(-3.3, y0 - 8)); ctx.lineTo(PX(-3.3, y0 + 8), PY(-3.3, y0 + 8)); ctx.lineTo(PX(-0.8, y0 + 8), PY(-0.8, y0 + 8)); ctx.stroke();
    }
  }
  // the assistant's flag, in his hand; raised when the ball is out of play
  function drawFlag(X, Y, s, o) {
    const fl = o.flag || 0, hx = X + s * 0.62, hy = Y - s * (0.85 + fl * 0.95);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = Math.max(1, s * 0.06); ctx.beginPath(); ctx.moveTo(hx, hy + s * 0.15); ctx.lineTo(hx, hy - s * 0.55); ctx.stroke();
    const wv = Math.sin(G.time * 9) * s * 0.04 * (0.3 + fl);
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(hx, hy - s * 0.55); ctx.lineTo(hx + s * 0.4, hy - s * 0.5 + wv); ctx.lineTo(hx + s * 0.4, hy - s * 0.2 + wv); ctx.lineTo(hx, hy - s * 0.25); ctx.fill();
    ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.moveTo(hx, hy - s * 0.4); ctx.lineTo(hx + s * 0.4, hy - s * 0.35 + wv); ctx.lineTo(hx + s * 0.4, hy - s * 0.2 + wv); ctx.lineTo(hx, hy - s * 0.25); ctx.fill();
  }
  // a minimal full-body person for the officials (no longer used)
  function drawOfficial(X, Y, s, o) {
    ctx.globalAlpha = 1;
    const run = Math.min(1, Math.hypot(o.vx || 0, o.vy || 0) / 4), ph = Math.sin(G.time * 11 + (o.ph || 0)) * run;
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(X, Y + s * 0.05, s * 0.5, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = o.socks || '#111'; ctx.fillRect(X - s * 0.26, Y - s * 0.7 + Math.max(0, ph) * s * 0.12, s * 0.2, s * 0.7 - Math.max(0, ph) * s * 0.12); ctx.fillRect(X + s * 0.06, Y - s * 0.7 + Math.max(0, -ph) * s * 0.12, s * 0.2, s * 0.7 - Math.max(0, -ph) * s * 0.12);
    ctx.fillStyle = o.shorts || '#111'; ctx.fillRect(X - s * 0.3, Y - s * 1.05, s * 0.6, s * 0.4);
    ctx.fillStyle = o.shirt; rr(X - s * 0.36, Y - s * 1.8, s * 0.72, s * 0.85, s * 0.1); ctx.fill();
    ctx.strokeStyle = o.shirt; ctx.lineWidth = s * 0.15; ctx.lineCap = 'round';
    ctx.beginPath();
    const fl = o.flag || 0, up = o.armUp || 0;
    if (o.flagC) { // assistant: flag in the right hand, raised when the ball is out
      ctx.moveTo(X - s * 0.36, Y - s * 1.65); ctx.lineTo(X - s * 0.5, Y - s * 1.0 + ph * s * 0.08);
      ctx.moveTo(X + s * 0.36, Y - s * 1.65); ctx.lineTo(X + s * (0.5 + fl * 0.15), Y - s * (1.0 + fl * 1.5));
    } else if (up) { ctx.moveTo(X - s * 0.36, Y - s * 1.65); ctx.lineTo(X - s * 0.5, Y - s * 1.0); ctx.moveTo(X + s * 0.36, Y - s * 1.65); ctx.lineTo(X + s * 0.55, Y - s * 2.25); }
    else { ctx.moveTo(X - s * 0.36, Y - s * 1.65); ctx.lineTo(X - s * 0.5, Y - s * 1.0 - ph * s * 0.1); ctx.moveTo(X + s * 0.36, Y - s * 1.65); ctx.lineTo(X + s * 0.5, Y - s * 1.0 + ph * s * 0.1); }
    ctx.stroke(); ctx.lineCap = 'butt';
    if (o.flagC) { const fx = X + s * (0.5 + fl * 0.15), fy = Y - s * (1.0 + fl * 1.5); ctx.fillStyle = '#e53935'; ctx.fillRect(fx - s * 0.02, fy - s * 0.5, s * 0.34, s * 0.5); ctx.fillStyle = '#ffd54a'; ctx.fillRect(fx - s * 0.02 + s * 0.17, fy - s * 0.5, s * 0.17, s * 0.5); }
    ctx.fillStyle = o.skin || SKINS[2]; ctx.beginPath(); ctx.arc(X, Y - s * 2.15, s * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = o.hair || '#222'; ctx.beginPath(); ctx.arc(X, Y - s * 2.21, s * 0.41, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(X - s * 0.13, Y - s * 2.13, s * 0.035, 0, Math.PI * 2); ctx.arc(X + s * 0.13, Y - s * 2.13, s * 0.035, 0, Math.PI * 2); ctx.fill();
    if (o.whistle) { ctx.fillStyle = '#ddd'; ctx.fillRect(X + s * 0.1, Y - s * 1.98, s * 0.2, s * 0.08); }
  }
  // a substitute sitting on the bench: shirt, shorts, legs, head
  function drawSeated(q, X, Y, s) {
    const kit = G.kits[q.side], lk = skinFor(q.p);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(X, Y + s * 0.05, s * 0.45, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = kit.socks || '#eee'; ctx.fillRect(X - s * 0.24, Y - s * 0.4, s * 0.17, s * 0.4); ctx.fillRect(X + s * 0.07, Y - s * 0.4, s * 0.17, s * 0.4);
    ctx.fillStyle = kit.shorts || '#222'; ctx.fillRect(X - s * 0.3, Y - s * 0.75, s * 0.6, s * 0.38);
    // jacket for the ones who warm up on the bench (the ones taken off keep their shirt)
    ctx.fillStyle = q.off ? kit.shirt : (kit.trim && q.i % 2 ? kit.trim : '#2a3342'); rr(X - s * 0.34, Y - s * 1.55, s * 0.68, s * 0.85, s * 0.1); ctx.fill();
    if (q.off) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(X - s * 0.34, Y - s * 1.55, s * 0.68, s * 0.12); } // towel on the shoulders
    ctx.fillStyle = lk.skin; ctx.beginPath(); ctx.arc(X, Y - s * 1.9, s * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lk.hair; ctx.beginPath(); ctx.arc(X, Y - s * 1.96, s * 0.39, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(X - s * 0.12, Y - s * 1.88, s * 0.033, 0, Math.PI * 2); ctx.arc(X + s * 0.12, Y - s * 1.88, s * 0.033, 0, Math.PI * 2); ctx.fill();
    // they stand up and cheer for their own goal
    if (G.state === 'goal' && G.celebr && G.celebr.scorer.team === (q.side === sideOf(0) ? 0 : 1)) { ctx.strokeStyle = lk.skin; ctx.lineWidth = s * 0.13; ctx.beginPath(); ctx.moveTo(X - s * 0.34, Y - s * 1.4); ctx.lineTo(X - s * 0.55, Y - s * 2.2); ctx.moveTo(X + s * 0.34, Y - s * 1.4); ctx.lineTo(X + s * 0.55, Y - s * 2.2); ctx.stroke(); }
  }
  function drawCoach(X, Y, s, c) {
    const lk = c && c.team === 1 ? G.oppLook : S.coach && S.coach.look; if (!lk) return;
    const celeb = !!c && c.mode === 'celeb', bob = Math.sin(G.time * 2.2) * s * 0.03, up = celeb ? Math.abs(Math.sin(G.time * 9)) * s * 0.25 : 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(X, Y + s * 0.05, s * 0.5, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#23262b'; ctx.fillRect(X - s * 0.26, Y - s * 0.95 - up, s * 0.2, s * 0.95); ctx.fillRect(X + s * 0.06, Y - s * 0.95 - up, s * 0.2, s * 0.95);
    ctx.fillStyle = lk.suit || '#22304a';
    rr(X - s * 0.4, Y - s * 1.75 - up - bob, s * 0.8, s * 0.95, s * 0.12); ctx.fill();
    ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.moveTo(X - s * 0.12, Y - s * 1.75 - up - bob); ctx.lineTo(X + s * 0.12, Y - s * 1.75 - up - bob); ctx.lineTo(X, Y - s * 1.2 - up - bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = lk.tie || '#c0392b'; ctx.fillRect(X - s * 0.04, Y - s * 1.65 - up - bob, s * 0.08, s * 0.38);
    ctx.strokeStyle = lk.suit || '#22304a'; ctx.lineWidth = s * 0.17; ctx.lineCap = 'round';
    ctx.beginPath();
    if (celeb) { ctx.moveTo(X - s * 0.4, Y - s * 1.6 - up); ctx.lineTo(X - s * 0.62, Y - s * 2.2 - up); ctx.moveTo(X + s * 0.4, Y - s * 1.6 - up); ctx.lineTo(X + s * 0.62, Y - s * 2.2 - up); }
    else if (c && c.mode === 'sad') { ctx.moveTo(X - s * 0.4, Y - s * 1.6 - bob); ctx.lineTo(X - s * 0.45, Y - s * 2.2); ctx.moveTo(X + s * 0.4, Y - s * 1.6 - bob); ctx.lineTo(X + s * 0.45, Y - s * 2.2); }
    else if (c && c.mode === 'point') { ctx.moveTo(X - s * 0.4, Y - s * 1.6 - bob); ctx.lineTo(X - s * 0.5, Y - s * 0.95); ctx.moveTo(X + s * 0.4, Y - s * 1.6 - bob); ctx.lineTo(X + s * 0.95, Y - s * 1.75 - Math.sin(G.time * 5) * s * 0.12); }
    else { ctx.moveTo(X - s * 0.4, Y - s * 1.6 - bob); ctx.lineTo(X - s * 0.5, Y - s * 0.95); ctx.moveTo(X + s * 0.4, Y - s * 1.6 - bob); ctx.lineTo(X + s * 0.5, Y - s * 0.95); }
    ctx.stroke(); ctx.lineCap = 'butt';
    const hy = Y - s * 2.25 - up - bob;
    ctx.fillStyle = SKINS[lk.skin] || SKINS[2]; ctx.beginPath(); ctx.arc(X, hy, s * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = HAIRS[lk.hair] || HAIRS[0];
    const hs = lk.hs == null ? 0 : lk.hs;
    if (hs === 0) { ctx.beginPath(); ctx.arc(X, hy - s * 0.06, s * 0.43, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); }
    else if (hs === 1) { ctx.beginPath(); ctx.ellipse(X, hy - s * 0.3, s * 0.39, s * 0.18, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (hs === 2) { ctx.beginPath(); ctx.arc(X, hy - s * 0.12, s * 0.45, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); }
    else if (hs === 3) { ctx.beginPath(); ctx.arc(X, hy - s * 0.2, s * 0.34, Math.PI, 2 * Math.PI); ctx.fill(); }
    if (lk.beard) { ctx.beginPath(); ctx.arc(X, hy + s * 0.08, s * 0.38, 0.15, Math.PI - 0.15); ctx.lineTo(X + s * 0.18, hy + s * 0.1); ctx.quadraticCurveTo(X, hy + s * 0.24, X - s * 0.18, hy + s * 0.1); ctx.closePath(); ctx.fill(); }
    if (lk.glasses) { ctx.strokeStyle = '#111'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.beginPath(); ctx.arc(X - s * 0.17, hy + s * 0.02, s * 0.12, 0, Math.PI * 2); ctx.moveTo(X + s * 0.29, hy + s * 0.02); ctx.arc(X + s * 0.17, hy + s * 0.02, s * 0.12, 0, Math.PI * 2); ctx.moveTo(X - s * 0.05, hy + s * 0.02); ctx.lineTo(X + s * 0.05, hy + s * 0.02); ctx.stroke(); }
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(X - s * 0.14, hy + s * 0.02, s * 0.035, 0, Math.PI * 2); ctx.arc(X + s * 0.14, hy + s * 0.02, s * 0.035, 0, Math.PI * 2); ctx.fill();
  }

  // ------------------------------------------------------------------ main step
  function step(dt) {
    G.time += dt;
    if (G.state !== 'replay') stepStaff(dt);
    if (G.gkRush > 0) G.gkRush -= dt;
    if (G.gkRushCD > 0) G.gkRushCD -= dt;
    if (G.slowPk && (!G.pk || G.pk.phase !== 'flight')) { G.slow = 1; G.slowPk = 0; } // a goal or a save ends the penalty slow motion for good
    if (G.orgs) { for (const o of G.orgs) if (o.cheer > 0) o.cheer -= dt; if (G.orgSay && G.time > 2.5) { say(G.orgSay, 1); G.orgSay = ''; } }
    if (G.msgT > 0) { G.msgT -= dt; if (G.msgT <= 0) setMsg(''); }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 3);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
    const b = G.ball;
    if (b.postT > 0) b.postT -= dt;
    stepFx(dt);
    if (G.tr && trainStep(dt)) return;
    switch (G.state) {
      case 'intro': G.stateT -= dt; camera(dt); if (G.stateT <= 0) { hideIntro(); G.state = 'kickoff'; G.stateT = 0.6; sfx('whistle', 1); say('Bola rolando!', 2); } return;
      case 'goal':
        G.stateT -= dt; idle(dt);
        if (!G.auto && G.stateT > 1.4) record(dt);
        if (G.stateT <= 0) { if (!G.auto && G.replayOn && G.recGoalIdx >= 40) startReplay(); else resetKickoff(G.nextKick); }
        return;
      case 'replay': replayStep(dt); return;
      case 'halftime': case 'fulltime': idle(dt); return;
      case 'penalty': penaltyStep(dt); return;
      case 'shootoutIntro': case 'shootoutWait': G.stateT -= dt; idle(dt); if (G.stateT <= 0) nextShootoutKick(); return;
      case 'shootoutEnd': G.stateT -= dt; idle(dt); if (G.stateT <= 0) endGame(false); return;
      case 'ufo': ufoStep(dt); return;
      case 'over': return;
      default: break;
    }
    G.clock += dt;
    if (G.clock >= halfEnd()) { endHalf(); return; }
    if (G.ufo && !G.ufo.done && G.half === G.ufo.half && G.clock >= G.ufo.at && G.state === 'play' && !G.restartHold) { startUfo(); return; }
    if (G.state === 'kickoff' || G.state === 'setpiece') { G.stateT -= dt; if (G.stateT <= 0) G.state = 'play'; }
    if (b.owner) G.possT[sideOf(b.owner.team)] += dt;
    else G.possT[sideOf(b.lastTeam)] += dt * 0.5;
    if (G.cornerPlay) {
      const cp = G.cornerPlay;
      if (b.owner || b.shot || G.time > cp.until || (G.time > cp.t && b.z < 0.3 && Math.hypot(b.vx, b.vy) < 6)) G.cornerPlay = null;
    }
    if (!G.auto) userInput(dt);
    G.think -= dt;
    const think = G.think <= 0;
    if (think) { G.think = 0.1; computeChasers(); }
    for (const p of G.players) if (!p.out) ai(p, dt, think);
    for (const p of G.players) if (!p.out) integrate(p, dt);
    separate();
    if (G.state === 'penalty') return; // a foul in the box just stopped play
    ballStep(dt);
    camera(dt);
    if (!G.auto) { record(dt); crowdMood(dt); }
  }
  function endHalf() {
    const st = G.st, m = G.m;
    sfx('whistle', 1.4);
    if (G.half === 1) {
      if (G.auto) { startSecondHalf(); return; }
      G.state = 'halftime';
      evAdd(st, { min: 45 + st.stoppage[0], t: 'ht', s: -1, h: 1, txt: `Fim do primeiro tempo: ${st.score[0]} x ${st.score[1]}.` });
      say(`Fim do primeiro tempo: ${st.score[0]} x ${st.score[1]}.`, 3);
      // the computer side may change players at the break
      if (Math.random() < 0.45) cpuSub(45);
      showBreak('half');
      return;
    }
    st.min = 90 + st.stoppage[1];
    // knockout tie still level on aggregate: extra time is simulated, the shoot-out is played here
    if (!G.auto && (matchNeedsDecider(m) || G.testDecider)) {
      const [bh, ba] = matchNeedsDecider(m) ? tieAggregateBefore(m) : [0, 0];
      if (bh + st.score[0] === ba + st.score[1] && S.comps[m.c] && S.comps[m.c].noET) {
        st.decided = true;
        G.state = 'fulltime';
        G.etGoals = null;
        showBreak('noet');
        return;
      }
      if (bh + st.score[0] === ba + st.score[1]) {
        const before = st.score.slice();
        st.et = true; st.half = 3; st.min = 90;
        const saveXg = st.xg.slice();
        st.xg = st.xg.map((x) => x * 0.95);
        st.shotRate = st.shotRate.map((r) => r * 0.85);
        simulateRange(st, m, 120);
        st.xg = saveXg;
        st.decided = true;
        syncSprites();
        updateHud(true);
        G.state = 'fulltime';
        G.etGoals = [st.score[0] - before[0], st.score[1] - before[1]];
        showBreak(bh + st.score[0] === ba + st.score[1] ? 'et' : 'etwin');
        return;
      }
    }
    G.state = 'fulltime';
    if (G.auto) { endGame(false); return; }
    showBreak('full');
  }
  function startSecondHalf() {
    hideBreak();
    G.half = 2; G.st.half = 2; G.clock = 0;
    resetKickoff(1);
    banner('2º tempo', 1.2);
    say('Começa o segundo tempo!', 2);
    sfx('whistle', 1);
  }
  function endGame(simulated) {
    const st = G.st;
    if (!simulated && !st.decided) st.min = 90 + st.stoppage[1];
    const tot = G.possT[0] + G.possT[1];
    if (tot > 20) { const h = Math.round(G.possT[0] / tot * 100); st.stats.poss = G.userSide === 0 ? [h, 100 - h] : [100 - h, h]; }
    G.state = 'over'; G.over = true;
    if (!root) return;
    hideBreak();
    setTimeout(() => { const cb = onDone; cleanup(); G = null; if (cb) cb(); }, simulated ? 250 : 600);
  }
  function simulateRest() {
    const st = G.st, m = G.m;
    G.paused = false;
    if (G.shootout) {
      if (!G.shootout.done) { G.pk = null; while (!G.shootout.done) simShootoutKick(); }
      endGame(true);
      return;
    }
    if (st.decided) { endGame(true); return; }
    st.autoUser = true;
    const mn = Math.floor(minuteNow());
    if (G.half === 1) {
      st.min = Math.min(mn, 45 + st.stoppage[0]); st.half = 1;
      simulateRange(st, m, 45 + st.stoppage[0]);
      st.min = 45; st.half = 2;
    } else { st.min = Math.min(Math.max(45, mn), 90 + st.stoppage[1]); st.half = 2; }
    simulateRange(st, m, 90 + st.stoppage[1]);
    endGame(true);
  }

  // ------------------------------------------------------------------ user control
  function screenToWorld(sx, sy) { return G.landscape ? { x: sy, y: -sx } : { x: sx, y: sy }; }
  function keyDir() {
    let x = 0, y = 0;
    if (KEYS.a || KEYS.arrowleft) x -= 1;
    if (KEYS.d || KEYS.arrowright) x += 1;
    if (KEYS.w || KEYS.arrowup) y -= 1;
    if (KEYS.s || KEYS.arrowdown) y += 1;
    return { x, y };
  }
  function userInput(dt) {
    const I = G.input, b = G.ball;
    const kd = keyDir();
    let sx = I.jx + kd.x, sy = I.jy + kd.y;
    const mag = Math.min(1, Math.hypot(sx, sy));
    if (mag > 0.05) { const n = nrm(sx, sy); sx = n.x * mag; sy = n.y * mag; } else { sx = 0; sy = 0; }
    const w = screenToWorld(sx, sy);
    // GOALKEEPER DISTRIBUTION: while your keeper holds the ball you aim and play it like any other player, for a few seconds
    let gkb = null;
    if (!G.solo && !G.auto && b.owner && b.owner.team === 0 && b.owner.gk && G.state === 'play') {
      if (!G.gkHad) { G.gkHad = true; G.gkCtlT = 0; hint('Você controla o goleiro: aponte e use PASSE, LANÇAR ou CHUTE (bola longa).'); }
      G.gkCtlT += dt;
      if (G.gkCtlT < 5.5) gkb = b.owner; else if (G.gkCtlT < 5.6) hint('');
    } else if (G.gkHad && !(b.owner && b.owner.team === 0 && b.owner.gk)) { G.gkHad = false; hint(''); }
    if (gkb) G.ctrl = gkb;
    else if (G.solo) G.ctrl = soloSprite(); // player career: you only ever control your own player
    else if (b.owner && b.owner.team === 0 && !b.owner.gk) G.ctrl = b.owner;
    if (G.solo || gkb) { /* fixed */ }
    else if (!G.ctrl || G.ctrl.out || G.ctrl.gk) G.ctrl = nearestTo(0, b.x, b.y, true);
    else if (!(b.owner && b.owner.team === 0) && !(sx || sy) && !(G.manualT > 0)) {
      // idle stick: hand control to whoever reaches the ball first
      let best = G.ctrl, bt = interceptTime(G.ctrl);
      for (const p of G.players) { if (p.out || p.team !== 0 || p.gk) continue; const t = interceptTime(p); if (t < bt - 0.6) { bt = t; best = p; } }
      G.ctrl = best;
    }
    G.manualT = Math.max(0, (G.manualT || 0) - dt); G.swapFlash = Math.max(0, (G.swapFlash || 0) - dt); G.callT = Math.max(0, (G.callT || 0) - dt);
    const c = G.ctrl;
    if (!c) return;
    c.inX = w.x; c.inY = w.y;
    const autoRun = G2PREF.autoRun !== false;
    const wantSprint = autoRun ? (mag > 0.6 && !KEYS.shift) : (!!I.sprint && mag > 0.05); // automatic sprint when the stick is pushed (Shift jogs), or only while the run button is held
    // sprint stamina: roughly 7 seconds of flat-out running, recovers while jogging
    if (wantSprint && (w.x || w.y) && c.sta > 0.02) { c.sta = Math.max(0, c.sta - dt / ((6 + c.phy / 40) * (G.spPerk === 'energy' ? 1.2 : 1) * (1 + (G.fanSup || 0) * 0.08))); c.sprint = c.sta > 0.1; }
    else { c.sprint = false; c.sta = Math.min(1, c.sta + dt * 0.11); }
    for (const p of G.players) if (p !== c && p.team === 0 && p.sta < 1) p.sta = Math.min(1, p.sta + dt * 0.12);
    if (I.shootDown) I.hold = Math.min(1, I.hold + dt / 0.85);
    c.supCD = Math.max(0, (c.supCD || 0) - dt);
    if (root) root.classList.toggle('supcd', c.supCD > 0 || c.sta < 0.3);
    if (I.supDown) { if (b.owner === c && G.state === 'play') I.supHold = Math.min(1.25, I.supHold + dt / 0.9); else { I.supDown = false; I.supHold = 0; } }
    const has = b.owner === c;
    const canKick = has && G.state === 'play';
    if (has && G.restartHold && (w.x || w.y)) { const n = nrm(w.x, w.y); c.dx = n.x; c.dy = n.y; if (G.setKind === 'corner') G.cornerAim = zoneFromStick(c, w); }
    // nobody waits forever on a restart: after a few seconds the ball is played automatically
    if (has && G.restartHold && G.state === 'play') { G.idleT += dt; if (G.idleT > (G.setKind === 'corner' ? 12 : 6)) { G.idleT = 0; if (G.setKind === 'corner') cornerKick(c, G.cornerAim || 'six'); else aiPass(c, false, G.setKind === 'kickoff' || G.setKind === 'throw'); hint(''); return; } }
    else G.idleT = 0;
    // pass preview
    G.previewT -= dt;
    if (has && G.previewT <= 0) { G.previewT = 0.12; G.preview = bestReceiver(c, (w.x || w.y) ? nrm(w.x, w.y) : { x: c.dx, y: c.dy }, false); }
    if (!has) G.preview = null;
    if (I.buf && G.time - I.buf.t > 0.35) I.buf = null;
    if (I.buf && canKick) {
      const bf = I.buf;
      I.buf = null;
      if (bf.k === 'shoot') doUserShoot(c, w, bf.pw || 0.7); else userPass(c, w, bf.k === 'lob');
      return;
    }
    const looseNear = !b.owner && dist(c, b) < 3 && b.z < 1.8;
    if (I.pass) {
      I.pass = false;
      if (canKick) userPass(c, w, false);
      else if (looseNear) I.buf = { k: 'pass', t: G.time };
      else if (!has && !(b.owner && b.owner.team === 0) && !G.solo) swapPlayer(c, w);
    }
    if (I.swap) {
      I.swap = false;
      if (G.solo) hint('Na carreira de jogador você só controla o seu jogador.');
      else if (!has && !G.restartHold && G.state === 'play') swapPlayer(c, w);
      else if (has) hint('Você já está com a bola · TROCAR vale quando o time está sem ela.');
    }
    if (I.lob) {
      I.lob = false;
      if (canKick) userPass(c, w, true);
      else if (looseNear) I.buf = { k: 'lob', t: G.time };
    }
    if (I.skill) {
      const kind = I.skill;
      I.skill = null;
      if (has && !c.gk && G.state === 'play' && !G.restartHold && c.skCD <= 0 && !c.sk) doSkill(c, w, kind);
    }
    if (I.supShot) {
      I.supShot = false;
      const sh = I.supHold; I.supHold = 0;
      if (canKick && !c.gk && superReady(c, true)) doSuperShoot(c, sh);
    }
    if (I.shoot) {
      I.shoot = false;
      const pw = clamp(0.3 + I.hold * 0.7, 0.3, 1);
      const plc = !!I.plc; I.plc = false;
      const chp = !!I.chipf; I.chipf = false;
      I.hold = 0;
      if (canKick && c.gk) userPass(c, w, true);
      else if (canKick && chp && !G.restartHold) chip(c);
      else if (canKick) doUserShoot(c, w, pw, plc);
      else if (looseNear) I.buf = { k: 'shoot', t: G.time, pw };
      else if (!has && c.slide <= 0 && c.fall <= 0 && !G.restartHold && G.state === 'play') {
        const t = b.owner && b.owner.team === 1 ? b.owner : b;
        if (w.x || w.y) startSlide(c, w.x, w.y); else startSlide(c, t.x - c.x, t.y - c.y);
      }
    }
  }
  // dribbling moves, unlocked by skill stars: FINTA (1★: step-over and a sharp cut away from the closest defender),
  // GIRO (2★: a roulette spin), and the specials from 3★: CANETA (nutmeg through the defender's legs), ELÁSTICO (4★, a
  // flick out and in) and CHAPÉU (5★, the ball lifted over the defender). They fool the defenders around (more so with a
  // good dribbler) and make tackles harder for a moment
  const SK_NAME = { feint: 'finta', roll: 'carretilha', spin: 'giro', nutmeg: 'caneta', elastico: 'elástico', rainbow: 'chapéu', pedalada: 'pedalada', drag: 'puxada', fakeshot: 'finta de chute', heel: 'calcanhar' };
  function doSkill(c, w, btn) {
    const need = SKILL_NEED[btn] || 1;
    if (c.stars < need) { hint(`${nameOf(c)} tem ${c.stars}★ de finta e este drible pede ${need}★.`); return; }
    let kind = btn;
    if (btn === 'feint') {
      const ok = FEINTS.filter((x) => c.stars >= x[1]);
      // avoid repeating the last move when there is a choice
      const pool = ok.length > 1 ? ok.filter((x) => x[0] !== c.lastFeint) : ok;
      kind = pool[Math.floor(Math.random() * pool.length)][0];
      c.lastFeint = kind;
    }
    let d = (w.x || w.y) ? nrm(w.x, w.y) : { x: c.dx, y: c.dy };
    if (!d.x && !d.y) d = { x: 0, y: c.team === 0 ? -1 : 1 };
    // the closest defender, preferring the ones in front
    let opp = null, od = 1e9;
    for (const o of G.players) {
      if (o.out || o.team === c.team || o.gk) continue;
      const dd = Math.hypot(o.x - c.x, o.y - c.y) * (((o.x - c.x) * d.x + (o.y - c.y) * d.y) > -0.5 ? 1 : 1.6);
      if (dd < od) { od = dd; opp = o; }
    }
    c.skCD = 0.95; c.sta = Math.max(0, c.sta - 0.07);
    const perp = { x: -d.y, y: d.x };
    const side = opp ? (((opp.x - c.x) * perp.x + (opp.y - c.y) * perp.y) > 0 ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
    const sk = { kind, t: 0.5, T: 0.5, dx: d.x, dy: d.y, sp: 1.1 };
    if (kind === 'spin') { sk.t = sk.T = 0.62; sk.sp = 1.04; }
    else if (kind === 'feint') { const dir = nrm(d.x * 0.5 + perp.x * side * 0.9, d.y * 0.5 + perp.y * side * 0.9); sk.dx = dir.x; sk.dy = dir.y; sk.sp = 1.2; }
    else if (kind === 'roll') { // carretilha: drags the ball across with the sole, then cuts forward
      sk.t = sk.T = 0.52; sk.sp = 1.18;
      const mv = nrm(d.x * 0.7 + perp.x * side * 0.6, d.y * 0.7 + perp.y * side * 0.6);
      sk.dx = mv.x; sk.dy = mv.y; sk.side = side; sk.sp = 1.0;
    }
    else if (kind === 'pedalada') { // double step-over: a slower, wider cut
      const dir = nrm(d.x * 0.7 + perp.x * side * 0.7, d.y * 0.7 + perp.y * side * 0.7); sk.t = sk.T = 0.6; sk.dx = dir.x; sk.dy = dir.y; sk.sp = 1.12;
    } else if (kind === 'drag') { // puxada: the sole pulls the ball back, then he leaves to the side
      sk.t = sk.T = 0.6; const bk = nrm(-d.x * 0.7 + perp.x * side * 0.3, -d.y * 0.7 + perp.y * side * 0.3), go = nrm(d.x * 0.55 + perp.x * side * 0.85, d.y * 0.55 + perp.y * side * 0.85);
      sk.dx = bk.x; sk.dy = bk.y; sk.sp = 0.7; sk.dx2 = go.x; sk.dy2 = go.y; sk.sp2 = 1.32;
    } else if (kind === 'fakeshot') { // finta de chute: stops as if to shoot, then bursts away
      sk.t = sk.T = 0.58; const go = nrm(d.x * 0.5 + perp.x * side * 0.9, d.y * 0.5 + perp.y * side * 0.9);
      sk.dx = d.x * 0.15; sk.dy = d.y * 0.15; sk.sp = 0.5; sk.dx2 = go.x; sk.dy2 = go.y; sk.sp2 = 1.4; sk.fake = true;
    } else if (kind === 'heel') { // calcanhar: backheels the ball past himself and spins after it
      sk.t = sk.T = 0.62; const go = nrm(d.x * 0.8 + perp.x * side * 0.5, d.y * 0.8 + perp.y * side * 0.5);
      sk.dx = d.x * 0.1; sk.dy = d.y * 0.1; sk.sp = 0.45; sk.dx2 = go.x; sk.dy2 = go.y; sk.sp2 = 1.38;
    }
    else if (kind === 'nutmeg') { sk.t = sk.T = 0.55; sk.sp = 1.28; }
    else if (kind === 'elastico') { // out to one side, then sharply back across
      sk.t = sk.T = 0.58; sk.sp = 1.22;
      const out = nrm(d.x * 0.35 + perp.x * side * 0.95, d.y * 0.35 + perp.y * side * 0.95);
      const back = nrm(d.x * 0.45 - perp.x * side * 0.9, d.y * 0.45 - perp.y * side * 0.9);
      sk.dx = out.x; sk.dy = out.y; sk.dx2 = back.x; sk.dy2 = back.y;
    } else if (kind === 'rainbow') { sk.t = sk.T = 0.78; sk.sp = 1.05; sk.fire = 0.3; }
    c.sk = sk;
    const reach = kind === 'spin' ? 2.2 : kind === 'rainbow' ? 3.4 : 2.7;
    if (kind === 'rainbow') {
      // the heel flicks the ball up (see the skill step): it goes over the head of the defender and comes down in front of him
      sk.say = opp && od < reach ? `Chapéu em ${nameOf(opp)}!` : `${nameOf(c)} dá um chapéu!`;
    }
    const bonus = (c.stars - 3) * 0.04;
    if (opp && od < reach) {
      const base = kind === 'nutmeg' ? 0.34 : kind === 'rainbow' ? 0.5 : 0.4;
      const pr = clamp(base + (c.dri - opp.def) / 110 + (kind === 'spin' || kind === 'elastico' || kind === 'roll' || kind === 'drag' || kind === 'heel' ? 0.1 : 0) + bonus, 0.15, 0.88);
      if (Math.random() < pr) {
        opp.cool = Math.max(opp.cool, kind === 'feint' ? 0.6 : 0.85);
        if (Math.random() < 0.3 || kind === 'elastico') opp.fall = Math.max(opp.fall, 0.4);
        if (kind !== 'rainbow') say(`${nameOf(c)} ${kind === 'spin' ? 'gira em cima de' : kind === 'roll' ? 'faz uma carretilha em' : kind === 'nutmeg' ? 'dá uma caneta em' : kind === 'elastico' ? 'deixa no chão' : 'passa a finta em'} ${nameOf(opp)}!`, 1);
      } else if (kind === 'nutmeg' && od < 2) {
        // the nutmeg is read: he closes the legs and takes the ball
        opp.cool = 0; opp.tackT = 0;
        tryTackle(opp, c, 0.2);
      }
    }
    sfx('kick', 0.25);
  }
  function soloSprite() { const p = G.players.find((q) => q.pid === G.solo && !q.out); return p || null; }
  // PEDIR: the teammate with the ball looks for you for a few seconds
  function callForBall() { if (!G || !G.solo) return; G.callT = 3; hint('Você pede a bola!'); setTimeout(() => { if (G && G.callT <= 0) hint(''); }, 1500); }
  // TROCAR: hand control to the teammate closest to the ball (the current one excluded)
  function swapPlayer(c, w) {
    if (G.tr) return;
    const b = G.ball;
    // always the teammate closest to the ball (not the one the current player already controls)
    let best = null, bs = 1e9;
    for (const p of G.players) {
      if (p.out || p.team !== 0 || p.gk || p === c) continue;
      const d = dist(p, b);
      if (d < bs) { bs = d; best = p; }
    }
    if (best) { G.ctrl = best; G.manualT = 1.4; G.swapFlash = 0.9; hint(`Agora você controla ${nameOf(best)}.`); setTimeout(() => { if (G && /^Agora você controla/.test(hud.hint ? hud.hint.textContent : '')) hint(''); }, 1600); }
  }
  // SUPER CHUTE: its own button; charge it (sweet spot in the middle of the bar) for a rocket that costs stamina and needs a few seconds to recharge
  function superReady(c, say_) {
    if (!c || G.tr && G.tr.kind === 'pass') return false;
    const has = G.ball.owner === c && G.state === 'play';
    if (!has) { if (say_) hint('O SUPER CHUTE precisa da bola nos pés.'); return false; }
    if (G.restartHold && G.setKind !== 'free') { if (say_) hint('O SUPER CHUTE só vale com a bola rolando (ou em falta).'); return false; }
    if ((c.supCD || 0) > 0) { if (say_) hint(`SUPER CHUTE recarregando: ${Math.ceil(c.supCD)}s.`); return false; }
    if (c.sta < 0.3) { if (say_) hint('Sem fôlego para o SUPER CHUTE: espere a barra azul encher.'); return false; }
    return true;
  }
  function doSuperShoot(c, h) {
    hint('');
    const I = G.input, kd = keyDir();
    const w = screenToWorld(I.jx + kd.x, I.jy + kd.y);
    c.sta = Math.max(0, c.sta - 0.3); c.supCD = 7;
    shoot(c, w.x, 1, h);
    const b = G.ball;
    b.supEnd = G.time + 1.4;
    banner(h > 1.02 ? 'SUPER CHUTE... DEMAIS!' : 'SUPER CHUTE!', 1.2);
    G.shake = 0.7;
    sfx('kick', 1);
  }
  // the user sends the keeper out (drag TROCAR down, or G): a few seconds of a sweeper-keeper rush
  function startGkRush() {
    if (!G || G.solo || G.state !== 'play' || G.restartHold || G.paused) return;
    if ((G.gkRushCD || 0) > 0) { hint('Goleiro ainda se recompondo…'); return; }
    const b = G.ball, k = keeperOf(0);
    if (!k || (b.owner && b.owner.team === 0) || k.dive) return;
    G.gkRush = 2.8; G.gkRushCD = 5;
    banner('GOLEIRO SAI!', 0.9);
  }
  function doUserShoot(c, w, pw, placed) {
    hint('');
    if (G.restartHold && (G.setKind === 'throw' || G.setKind === 'kickoff')) { userPass(c, w, false); return; }
    if (G.restartHold && G.setKind === 'corner') { cornerKick(c, zoneFromStick(c, w)); return; }
    shoot(c, w.x, pw, null, !!placed);
  }
  // PASSE: to feet; LANÇAR: into the space in front of a runner (lofted when the lane is closed or it is long);
  // in front of goal with the keeper off his line, LANÇAR is a chip
  function userPass(c, w, through) {
    hint('');
    if (G.restartHold && G.setKind === 'corner') { cornerKick(c, through ? (G.cornerAim || 'six') : 'short'); return; }
    const gk = keeperOf(1);
    if (through && !G.restartHold && gk && c.y < 24 && Math.abs(c.x - PW / 2) < 16 && gk.y > 3.2) { chip(c); return; }
    const dir = (w.x || w.y) ? nrm(w.x, w.y) : { x: c.dx, y: c.dy };
    const q = bestReceiver(c, dir, through);
    const throwIn = G.restartHold && G.setKind === 'throw';
    let lob = false;
    if (through && q && !throwIn) lob = laneOpen(c, q) < 1.6 || dist(c, q) > 26;
    else if (through && !q && !throwIn) lob = true;
    passTo(c, q, dir, lob, through);
  }
  function bestReceiver(p, dir, through) {
    let best = null, bs = -1e9;
    const fwd = p.team === 0 ? -1 : 1;
    for (const q of G.players) {
      if (q.out || q.team !== p.team || q === p) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
      if (d < 2.5 || d > (through ? 55 : 42)) continue;
      const align = (dx * dir.x + dy * dir.y) / d;
      if (align < 0.45) continue;
      const open = laneOpen(p, q);
      const s = align * 4.5 + Math.min(open, 6) * (through ? 0.1 : 0.35) - d * (through ? 0.012 : 0.03) - (q.gk ? 3 : 0) + (dy * fwd > 0 ? (through ? 0.8 : 0.3) : 0) + (q.runT > 0 ? 0.8 : 0) + (G.solo && q.pid === G.solo ? 0.9 + (G.callT > 0 ? 3.2 : 0) : 0);
      if (s > bs) { bs = s; best = q; }
    }
    return best;
  }

  // ------------------------------------------------------------------ ball actions
  function kick(p, vx, vy, vz) {
    const b = G.ball;
    Object.assign(b, { owner: null, vx, vy, vz, z: Math.max(b.z, vz > 0 ? 0.05 : 0), last: p, lastTeam: p.team, shot: null, target: null, passer: null, curve: 0, cross: null });
    G.flight++;
    p.cool = 0.32;
    p.kickT = 0.25;
    G.restartHold = false;
    if (G.state === 'kickoff' || G.state === 'setpiece') G.state = 'play';
    const n = nrm(vx, vy);
    if (n.x || n.y) { p.dx = n.x; p.dy = n.y; }
    sfx('kick', clamp(Math.hypot(vx, vy) / 28, 0.2, 1));
  }
  function passTo(p, q, dir, lofted, through) {
    const b = G.ball;
    let tx, ty;
    const fwd = p.team === 0 ? -1 : 1;
    if (q) {
      const d0 = Math.hypot(q.x - b.x, q.y - b.y);
      const tt = Math.min(1.3, lofted ? 0.5 + d0 / 20 : d0 / 17);
      tx = q.x + q.vx * tt * 0.85; ty = q.y + q.vy * tt * 0.85;
      // into the space in front of the receiver
      if (through || q.runT > 0) {
        const room = Math.max(0, Math.abs((p.team === 0 ? 0 : PL) - ty) - 14);
        ty += fwd * Math.min(through ? 6 : 3, room);
        tx += (PW / 2 - tx) * 0.12;
      }
      tx = clamp(tx, 1, PW - 1); ty = clamp(ty, 1, PL - 1);
    } else { tx = b.x + dir.x * (lofted ? 26 : 15); ty = b.y + dir.y * (lofted ? 26 : 15); }
    const dx = tx - b.x, dy = ty - b.y, d = Math.max(1, Math.hypot(dx, dy));
    const errMul = p.team === 1 ? G.D.passErr : 1;
    const err = (0.015 + (1 - p.pas / 100) * 0.11 + pressureOn(p) * 0.025) * grand() * errMul;
    const ang = Math.atan2(dy, dx) + err;
    let vh, vz;
    if (lofted) { vz = clamp(d * 0.26, 3.5, 12); const T = 2 * vz / 9.8; vh = clamp(d / T * 0.92, 6, 26); }
    else { vh = clamp(5 + d * 0.72, 7, 25); vz = 0; }
    vh *= 1 + grand() * (1 - p.pas / 100) * 0.07;
    kick(p, Math.cos(ang) * vh, Math.sin(ang) * vh, vz);
    b.passer = p; b.target = q || null;
    if (q) q.runT = Math.max(q.runT, through ? 1.4 : 0);
    if (!G.auto && q && p.team === 0 && (through || d > 28)) say(through ? `${nameOf(p)} enfia para ${nameOf(q)}!` : `${nameOf(p)} lança para ${nameOf(q)}.`, 0);
  }
  function shoot(p, ax, power, sup, placed) {
    const b = G.ball, st = G.st;
    const up = p.team === 0;
    const gy = up ? 0 : PL;
    const gk = keeperOf(1 - p.team);
    let aimX;
    if (Math.abs(ax) > 0.25) aimX = PW / 2 + Math.sign(ax) * (1.4 + Math.min(1, Math.abs(ax)) * 2.1);
    else aimX = PW / 2 + (gk && gk.x > PW / 2 ? -1 : 1) * (1.8 + Math.random() * 1.4);
    if (placed && sup == null) { // CHUTE COLOCADO: the inside of the foot to the corner away from the keeper (or where the stick points)
      const sd = Math.abs(ax) > 0.25 ? Math.sign(ax) : (gk && gk.x > PW / 2 ? -1 : 1);
      aimX = PW / 2 + sd * 3.15;
    }
    let dx = aimX - b.x;
    const dy = gy - b.y, d = Math.hypot(dx, dy);
    const skill = p.sho / 100;
    let vh = 13 + power * 17 + (p.sho - 70) * 0.05;
    if (placed && sup == null) vh *= 0.84;
    if (sup != null) vh *= 1.2 + 0.16 * Math.min(1, sup); // super shot: a rocket
    const t = d / vh;
    // placed (not blasted) shots to a corner bend back inside the post: start them a little wide
    let curve = 0;
    const side = Math.sign(aimX - PW / 2) || 1;
    if (sup == null && Math.abs(aimX - PW / 2) > 2 && (power < 0.85 || placed) && d > 9) {
      const mag = placed ? 3.4 + Math.random() * 1.4 : 2 + Math.random() * 2.5, kd = 2.2;
      dx += side * (mag / kd) * (t - (1 - Math.exp(-kd * t)) / kd);
      curve = -side * mag * (up ? 1 : -1);
    }
    let spread = (0.03 + (1 - skill) * 0.15 + pressureOn(p) * 0.045 + Math.max(0, power - 0.8) * 0.12 + Math.max(0, d - 20) * 0.003) * (p.team === 1 ? G.D.shootErr : 1);
    if (placed && sup == null) spread *= 0.55;
    if (G.spPerk === 'boots' && p.team === 0) spread *= 0.88; // the sports-gear sponsor
    if (G.fanSup && p.team === 0) spread *= 1 - G.fanSup * 0.06; // the home crowd pushes (or boos) the team
    if (sup != null) spread *= sup < 0.45 ? 1.5 : sup > 1.02 ? 2.6 : sup > 0.95 ? 1.4 : 0.55; // sweet spot: accurate; too early or too late: wild
    const ang = Math.atan2(dy, dx) + grand() * spread;
    let hg = 0.25 + Math.random() * 1.5 + Math.max(0, power - 0.85) * 2.4 + grand() * (1 - skill) * 1.1;
    if (placed && sup == null) hg = 0.15 + Math.random() * 0.6;
    if (sup != null) hg = sup > 1.02 ? 2.6 + Math.random() * 1.6 : 0.2 + Math.random() * 0.9; // low and hard, unless it was held too long
    // direct free kick: the ball is lifted over the wall and comes down towards the goal (it used to stop in the wall)
    const fk = !!(G.fk && G.fk.taker === p && G.time - G.fk.t < 10 && d > 14);
    if (fk) { hg = clamp(1.85 + Math.random() * 0.3 + (power - 0.7) * 0.5 + grand() * (1 - skill) * 0.5, 1.6, 2.3); G.fk = null; }
    const vz = clamp((hg + 4.9 * t * t) / t, 0.3, 14);
    kick(p, Math.cos(ang) * vh, Math.sin(ang) * vh, vz);
    b.curve = curve;
    b.shot = { team: p.team, by: p, t: 0, checked: false, beaten: false, force: null, fk, sup: sup != null };
    st.stats.sh[sideOf(p.team)]++;
    if (!G.auto && Math.random() < 0.7) sfx('ooh', 0.6 + power * 0.5);
    if (power > 0.8 && !G.auto) G.shake = 0.35;
    burst(b.x, b.y, 6, '#7fbf4a');
    if (sup != null) say(`${nameOf(p)} solta uma bomba!`, 1);
    else say(d > 22 ? `${nameOf(p)} arrisca de longe!` : curve ? `${nameOf(p)} bate colocado!` : `Chute de ${nameOf(p)}!`, 1);
  }
  function chip(p) {
    const b = G.ball;
    const gy = p.team === 0 ? 0 : PL;
    const tx = PW / 2 + (Math.random() - 0.5) * 3;
    const dx = tx - b.x, dy = gy - b.y, d = Math.hypot(dx, dy);
    const vz = clamp(d * 0.42, 5, 10);
    const T = 2 * vz / 9.8;
    const vh = d / T * (0.95 + Math.random() * 0.15);
    const ang = Math.atan2(dy, dx) + (1 - p.sho / 100) * 0.12 * grand();
    kick(p, Math.cos(ang) * vh, Math.sin(ang) * vh, vz);
    b.shot = { team: p.team, by: p, t: 0, checked: false, beaten: false, force: null, chip: true };
    G.st.stats.sh[sideOf(p.team)]++;
    say(`Cavadinha de ${nameOf(p)}!`, 1);
  }
  // cross from the wing: driven into the space in front of a team-mate, coming down at head height
  function cross(p) {
    const b = G.ball;
    const gy = p.team === 0 ? 0 : PL, inward = gy === 0 ? 1 : -1;
    const blocker = G.players.find((o) => !o.out && !o.gk && o.team !== p.team && Math.hypot(o.x - p.x, o.y - p.y) < 1.9 && ((PW / 2 - p.x) * (o.x - p.x) + (gy + inward * 8 - p.y) * (o.y - p.y)) > 0);
    if (blocker && Math.random() < 0.4) {
      kick(p, 0, 0, 0);
      const n = nrm((Math.random() - 0.5) * 0.8 + (p.x < PW / 2 ? -0.4 : 0.4), -inward);
      Object.assign(b, { vx: n.x * (6 + Math.random() * 5), vy: n.y * (6 + Math.random() * 5), vz: 1 + Math.random() * 2.5, last: blocker, lastTeam: blocker.team });
      blocker.kickT = 0.25;
      say(`Cruzamento travado por ${nameOf(blocker)}!`, 1);
      if (G.dbg) G.dbg.crossBlocked = (G.dbg.crossBlocked || 0) + 1;
      return;
    }
    const cands = G.players.filter((q) => !q.out && q.team === p.team && q !== p && !q.gk && Math.abs(q.x - PW / 2) < 15 && Math.abs(q.y - gy) < 20);
    const spot = { x: PW / 2, y: gy + inward * 8 };
    cands.sort((a, c) => Math.hypot(a.x - spot.x, a.y - spot.y) - Math.hypot(c.x - spot.x, c.y - spot.y));
    const tgt = cands[Math.random() < 0.7 ? 0 : Math.min(1, cands.length - 1)] || null;
    let tx, ty;
    if (tgt) { tx = clamp(tgt.x + tgt.vx * 0.5, PW / 2 - 9, PW / 2 + 9); ty = gy + inward * clamp(Math.abs(tgt.y - gy) - 1.2, 4.5, 13); }
    else { tx = PW / 2 + (Math.random() - 0.5) * 8; ty = gy + inward * (6 + Math.random() * 5); }
    const d = Math.hypot(tx - b.x, ty - b.y);
    if (d < 6) { passTo(p, tgt, nrm(tx - b.x, ty - b.y), false, false); return; }
    const apex = clamp(1.9 + d * 0.06, 2.4, 4.8);
    deliverCross(p, tx, ty, 1.75, apex, 0.8 + Math.random() * 1.2, tgt, 'open');
    if (tgt) tgt.runT = Math.max(tgt.runT, 0.8);
    say(`Cruzamento de ${nameOf(p)} na área!`, 1);
  }
  function take(p) {
    const b = G.ball;
    if (G.solo && G.st) {
      if (p.pid === G.solo && b.lastTeam !== p.team && b.last && !b.last.gk) addRating(G.st, p.pid, 0.1); // won the ball
      else if (b.passer && b.passer.pid === G.solo && b.passer.team === p.team && p !== b.passer) addRating(G.st, G.solo, 0.025); // a completed pass
      else if (b.last && b.last.pid === G.solo && p.team !== b.last.team && b.owner === null) addRating(G.st, G.solo, -0.04); // lost the ball
    }
    if (b.passer && b.passer.team === p.team && b.passer !== p) b.assist = { pid: b.passer.pid, team: p.team, t: G.time };
    else if (b.lastTeam !== p.team) b.assist = null;
    Object.assign(b, { owner: p, last: p, lastTeam: p.team, shot: null, passer: null, target: null, z: 0, vz: 0, curve: 0, cross: null });
    p.decT = 0.15 + Math.random() * 0.2;
  }
  function poke(p, vx, vy) {
    Object.assign(G.ball, { owner: null, vx, vy, vz: 0.4, last: p, lastTeam: p.team, shot: null, passer: null, target: null, curve: 0, cross: null });
    G.flight++;
    p.cool = 0.2;
  }
  function startSlide(p, dx, dy) {
    const n = nrm(dx, dy);
    if (!n.x && !n.y) return;
    Object.assign(p, { slide: 0.45, sx: n.x, sy: n.y, slideDone: false, dx: n.x, dy: n.y });
    burst(p.x, p.y, 5, '#6fa83a');
  }
  function tryTackle(d, c, bonus) {
    if (c.gk) return false;
    const feint = (c.feintT > 0 ? 0.12 : 0) + (c.sk ? (c.sk.kind === 'spin' ? 0.3 : 0.2) * clamp(c.dri / 80, 0.7, 1.25) : 0);
    const pr = clamp(0.25 + (d.def - c.dri) / 170 + bonus + (d.team === 1 ? G.D.tackle : 0) - feint, 0.05, 0.7);
    d.tackT = 0.5;
    if (Math.random() < pr) {
      c.cool = 0.45;
      if (Math.random() < 0.25) c.fall = 0.35;
      if (Math.random() < 0.6) take(d);
      else { const n = nrm(d.dx + (Math.random() - 0.5), d.dy + (Math.random() - 0.5)); poke(d, n.x * 6, n.y * 6); }
      if (d.team === 0) say(`Bom desarme de ${nameOf(d)}.`, 0);
      return true;
    }
    d.cool = 0.35;
    if (Math.random() < 0.12) d.fall = 0.3;
    if (c.team === 0 && c.feintT > 0) say(`${nameOf(c)} passa pela marcação!`, 0);
    return false;
  }
  function slideContact(p) {
    const b = G.ball;
    if (p.slideDone) return;
    const o = b.owner;
    const fx = p.x + p.sx * 0.7, fy = p.y + p.sy * 0.7;
    if (Math.hypot(b.x - fx, b.y - fy) < 1.15 && b.z < 0.8) {
      p.slideDone = true;
      if (o && o.team !== p.team) {
        if (o.gk) { foul(p, o); return; }
        const behind = o.dx * p.sx + o.dy * p.sy > 0.55;
        const ok = Math.random() < clamp(0.62 + (p.def - o.dri) / 180 - (behind ? 0.35 : 0), 0.1, 0.92);
        if (ok) { o.fall = 0.5; o.cool = 0.5; poke(p, p.sx * 7 + (Math.random() - 0.5) * 2, p.sy * 7 + (Math.random() - 0.5) * 2); }
        else if (Math.random() < 0.7) foul(p, o);
      } else if (!o) poke(p, p.sx * 8 + b.vx * 0.2, p.sy * 8 + b.vy * 0.2);
      return;
    }
    if (o && o.team !== p.team && Math.hypot(o.x - fx, o.y - fy) < 0.85) { p.slideDone = true; foul(p, o); }
  }
  function foul(d, v) {
    const st = G.st, k = sideOf(d.team);
    st.stats.fo[k]++;
    const mn = minuteInt();
    const r = Math.random();
    sfx('whistle', 0.5);
    if (!d.gk && r < 0.18) {
      const had = st.ev.some((e) => e.t === 'yellow' && e.p === d.pid);
      if (had) { sendOff(st, k, d.pid, mn, true); spriteOut(d); banner('Expulso!', 1.4); say(`Segundo amarelo: ${nameOf(d)} está expulso!`, 2); }
      else { st.stats.yc[k]++; addRating(st, d.pid, -0.3); evAdd(st, { min: mn, t: 'yellow', s: k, p: d.pid, txt: phrase('yellow', { p: pidName(d.pid) }) }); banner('Cartão amarelo', 1.2); say(`Cartão amarelo para ${nameOf(d)}.`, 1); }
    } else if (!d.gk && r < 0.188) { sendOff(st, k, d.pid, mn, false); spriteOut(d); banner('Cartão vermelho!', 1.4); say(`Vermelho direto para ${nameOf(d)}!`, 2); }
    else { banner('Falta', 0.8); say(`Falta de ${nameOf(d)} em ${nameOf(v)}.`, 0); }
    v.fall = 0.6;
    if (inBoxOf(d.team, v.x, v.y)) startPenalty(v.team);
    else setPiece(v.team, v.x, v.y, 'free');
  }
  function spriteOut(p) {
    p.out = true;
    if (G.ball.owner === p) G.ball.owner = null;
    if (G.ctrl === p) G.ctrl = null;
  }

  // ------------------------------------------------------------------ AI
  // the computer's game plan follows the match: losing late it pushes up and presses, winning late it drops and defends
  const styleOf = (team) => (G.st.sides[sideOf(team)].style) || 'bal';
  function tacticBias(team) {
    const st = G.st, k = sideOf(team), side = st.sides[k];
    // the chosen mentality (-2..2) and style set the base; the computer's side also reacts to the score late in the match
    let base = clamp((side.mentality || 0) * 0.3, -0.6, 0.6);
    if (side.style === 'counter') base -= 0.25;
    else if (side.style === 'press') base += 0.15;
    if (team === 0 && !G.auto) return base;
    const diff = st.score[k] - st.score[1 - k], m = minuteInt();
    if (m < 55) return clamp(base + (diff < 0 ? 0.25 : 0), -1, 1);
    const late = clamp((m - 55) / 35, 0, 1);
    return clamp(base + (diff < 0 ? Math.min(1, late * (0.55 + -diff * 0.25)) : diff > 0 ? -late * 0.6 : 0), -1, 1);
  }
  function computeChasers() {
    const b = G.ball, own = b.owner;
    // a team that has just lost the ball hunts it back for a few seconds (counter-press)
    const ot = own ? own.team : -1;
    if (ot !== -1 && ot !== G.prevOwnT) { if (G.prevOwnT !== undefined && G.prevOwnT !== -1) G.cpress = { team: 1 - ot, t: G.time + 3.2 }; G.prevOwnT = ot; }
    for (const team of [0, 1]) {
      let n;
      if (G.restartHold || (own && own.gk)) n = 0;
      else if (!own) n = team === 1 || G.auto ? 2 : 1;
      else if (own.team === team) n = 0;
      else n = team === 0 && !G.auto ? 1 : (team === 1 ? G.D.press : 2);
      if (n && styleOf(team) === 'press' && n < 4) n++;
      if (n && (team === 1 || G.auto)) { const bias = tacticBias(team); if (bias > 0.5) n++; if (G.cpress && G.cpress.team === team && G.time < G.cpress.t && Math.hypot(own ? own.x - b.x : 0, 0) < 1e9 && n < 4) n++; if (bias < -0.4 && n > 1) n--; }
      if (!n) { G.chasers[team] = []; continue; }
      G.chasers[team] = G.players.filter((p) => !p.out && p.team === team && !p.gk && !(team === 0 && !G.auto && p === G.ctrl))
        .map((p) => ({ p, d: Math.hypot(p.x - b.x, p.y - b.y) })).sort((a, c) => a.d - c.d).slice(0, n).map((x) => x.p);
    }
  }
  function ai(p, dt, think) {
    const b = G.ball;
    p.cool = Math.max(0, p.cool - dt);
    p.tackT = Math.max(0, p.tackT - dt);
    p.kickT = Math.max(0, p.kickT - dt);
    if (p.feintT > 0) p.feintT -= dt;
    if (p.skCD > 0) p.skCD -= dt;
    if (p.sk) {
      const k = p.sk;
      k.t -= dt;
      if (k.kind === 'rainbow' && !k.fired && k.T - k.t >= k.fire && G.ball.owner === p) {
        k.fired = true;
        kick(p, k.dx * 6.2, k.dy * 6.2, 9.8);
        p.cool = 0.05; p.kickT = 0;
        G.ball.rbEnd = G.time + 2.0;
        say(k.say, 1);
      }
      if (k.kind === 'roll' && G.ball.owner === p) G.ball.spin += dt * 14;
      if (k.t <= 0) p.sk = null;
    }
    if (p.wall) { if (G.restartHold) { p.wx = 0; p.wy = 0; return; } p.wall = false; }
    if (p.fall > 0) { p.fall -= dt; p.wx = 0; p.wy = 0; return; }
    if (p.slide > 0) return;
    if (!G.auto && p === G.ctrl) {
      const has = b.owner === p;
      if (p.gk) { p.wx = 0; p.wy = 0; const wi = Math.hypot(p.inX || 0, p.inY || 0); if (wi > 0.1) { p.dx = p.inX / wi; p.dy = p.inY / wi; } return; }
      if (has && G.restartHold) { p.wx = 0; p.wy = 0; return; }
      const s = p.speed * (p.sprint ? 1 : 0.8) * (has ? 0.92 : 1) * (p.sta < 0.15 ? 0.94 : 1);
      p.wx = p.inX * s; p.wy = p.inY * s;
      if (p.sk) { const k = p.sk, back = k.dx2 !== undefined && k.t < k.T * 0.5; const sp2 = back ? (k.sp2 || k.sp) : k.sp; p.wx = (back ? k.dx2 : k.dx) * p.speed * sp2; p.wy = (back ? k.dy2 : k.dy) * p.speed * sp2; }
      if (G.restartHold && b.owner && b.owner.team === 1) keepDistance(p);
      if (b.owner && b.owner.team === 1 && !G.restartHold && p.tackT <= 0 && dist(p, b.owner) < 1.3) tryTackle(p, b.owner, 0.08);
      return;
    }
    if (G.tr && G.tr.kind === 'pass' && !p.gk) { p.wx = 0; p.wy = 0; return; } // pass drill: the receivers wait where they are
    if (p.gk) { keeperAI(p, dt, think); return; }
    if (b.owner === p) { carrierAI(p, dt); return; }
    if (think) offBallAI(p);
    moveTo(p, p.tx, p.ty, p.run);
    if (G.restartHold && b.owner && b.owner.team !== p.team) keepDistance(p);
  }
  function keepDistance(p) {
    const b = G.ball;
    const minD = G.setKind === 'throw' ? 2 : 9.2;
    const d = Math.hypot(p.x + p.wx * 0.1 - b.x, p.y + p.wy * 0.1 - b.y);
    if (d < minD) {
      const n = nrm(p.x - b.x, p.y - b.y);
      const dot = p.wx * -n.x + p.wy * -n.y;
      if (dot > 0) { p.wx += n.x * dot; p.wy += n.y * dot; }
    }
  }
  function moveTo(p, tx, ty, run, maxRun = 1.15) {
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d < 0.35) { p.wx = 0; p.wy = 0; return; }
    const s = p.speed * clamp(run, 0.25, maxRun) * Math.min(1, d / 2.5 + 0.2);
    p.wx = dx / d * s; p.wy = dy / d * s;
  }
  function shapePos(p, attacking) {
    const b = G.ball;
    const bd = p.team === 0 ? 1 - b.y / PL : b.y / PL;
    let back, front;
    const tb = tacticBias(p.team);
    const wide = styleOf(p.team) === 'wings' && attacking ? 1.1 : 1;
    if (attacking) { back = clamp(bd - 0.4 + tb * 0.08, 0.14, 0.56); front = clamp(bd + 0.3 + tb * 0.06, 0.5, 0.92); }
    else { back = clamp(bd - 0.32 + tb * 0.1, 0.06, 0.46); front = clamp(bd + 0.06 + tb * 0.12, 0.3, 0.7); }
    const t = clamp((p.fy - 0.18) / 0.64, 0, 1);
    const depth = back + t * (front - back);
    const across = p.team === 0 ? p.fx : 1 - p.fx;
    const x = PW / 2 + (across * PW - PW / 2) * (attacking ? 1.02 * wide : 0.74) + (b.x - PW / 2) * (attacking ? 0.18 : 0.34);
    const y = p.team === 0 ? PL * (1 - depth) : PL * depth;
    return { x: clamp(x, 1.5, PW - 1.5), y: clamp(y, 1.5, PL - 1.5) };
  }
  function interceptPoint(p) {
    const b = G.ball;
    let x = b.x, y = b.y, vx = b.vx, vy = b.vy;
    for (let t = 0.1; t <= 2.5; t += 0.1) {
      const sp = Math.hypot(vx, vy);
      const ns = Math.max(0, sp - (G.fr[0] + G.fr[1] * sp) * 0.1);
      if (sp > 0) { vx *= ns / sp; vy *= ns / sp; }
      x += vx * 0.1; y += vy * 0.1;
      if (Math.hypot(x - p.x, y - p.y) / (p.speed * 0.95) <= t) return { x, y };
    }
    return { x, y };
  }
  function interceptTime(p) {
    const b = G.ball;
    if (b.owner) return Math.hypot(b.x - p.x, b.y - p.y) / p.speed;
    const ip = interceptPoint(p);
    return Math.hypot(ip.x - p.x, ip.y - p.y) / p.speed;
  }
  function offBallAI(p) {
    const b = G.ball, own = b.owner;
    const fwd = p.team === 0 ? -1 : 1;
    const grp = POS_GROUP[p.pos];
    const mine = own ? own.team === p.team : (b.lastTeam === p.team && !b.shot);
    // corners: everybody holds the set-up position until the kick, then attacks or defends the cross
    if (p.cr && ((G.restartHold && G.setKind === 'corner') || G.cornerPlay)) {
      const ct = cornerTarget(p);
      if (ct) { p.tx = clamp(ct.x, 0.5, PW - 0.5); p.ty = clamp(ct.y, 0.5, PL - 0.5); p.run = ct.run; return; }
    }
    let tgt = shapePos(p, mine);
    let run = 0.72;
    if (mine && own && own !== p) {
      if (p.runT > 0) { p.runT -= 0.1; tgt.y += fwd * 9; tgt.x += (PW / 2 - tgt.x) * 0.25; run = 1; }
      else if ((grp === 'ATT' || (grp === 'MID' && Math.random() < 0.35)) && Math.random() < (styleOf(p.team) === 'counter' ? 0.07 : 0.035) && !G.restartHold) p.runT = 1.2 + Math.random();
      let mate = null, md = 99;
      for (const q of G.players) if (q !== p && !q.out && q.team === p.team) { const d = Math.hypot(q.x - tgt.x, q.y - tgt.y); if (d < md) { md = d; mate = q; } }
      if (mate && md < 5) { const n = nrm((tgt.x - mate.x) || 0.3, tgt.y - mate.y); tgt.x += n.x * (5 - md); tgt.y += n.y * (5 - md); }
    } else if (!mine) {
      const idx = G.chasers[p.team].indexOf(p);
      if (idx >= 0 && own) {
        const gy = p.team === 0 ? PL : 0;
        const n = nrm(PW / 2 - own.x, gy - own.y);
        const off = idx === 0 ? 0.8 : idx === 1 ? 4 : 2.2;
        const side = idx === 2 ? (own.x < PW / 2 ? 2.5 : -2.5) : 0;
        tgt = { x: own.x + own.vx * 0.15 + n.x * off + side, y: own.y + own.vy * 0.15 + n.y * off };
        if (idx === 1) { // the second man cuts the nearest passing lane instead of just following
          let out = null, od2 = 1e9;
          for (const q of G.players) { if (q.out || q.team === p.team || q === own || q.gk) continue; const dq = Math.hypot(q.x - own.x, q.y - own.y); if (dq > 4 && dq < 20 && dq < od2 && (q.y - own.y) * (p.team === 0 ? 1 : -1) > -4) { od2 = dq; out = q; } }
          if (out) tgt = { x: own.x + (out.x - own.x) * 0.45, y: own.y + (out.y - own.y) * 0.45 };
        }
        run = idx === 0 ? 1 : 0.9;
      } else if (own && (grp === 'DEF' || grp === 'MID')) {
        let mk = null, md = -1e9;
        const gyp = p.team === 0 ? PL : 0;
        for (const o of G.players) {
          if (o.out || o.team === p.team || o.gk || o === own) continue;
          const d = Math.hypot(o.x - tgt.x, o.y - tgt.y);
          if (d > 15) continue;
          // the most dangerous free man near my zone: close to my goal, with space, not already taken by a team-mate
          let sc = (1 - Math.hypot(o.x - PW / 2, o.y - gyp) / 75) * 5 - d * 0.22;
          if (o.markBy && o.markBy !== p && !o.markBy.out && o.markBy.team === p.team && G.time - o.markT < 0.6) sc -= 3.2;
          if (grp === 'DEF' && Math.abs(o.y - gyp) > Math.abs(p.y - gyp) + 14) sc -= 2; // a centre-back does not follow a man deep into midfield
          if (sc > md) { md = sc; mk = o; }
        }
        if (mk) { mk.markBy = p; mk.markT = G.time; }
        if (mk) {
          const gy = p.team === 0 ? PL : 0;
          const n = nrm(PW / 2 - mk.x, gy - mk.y);
          tgt = { x: mk.x * 0.7 + tgt.x * 0.3 + n.x * 1.6, y: mk.y * 0.7 + tgt.y * 0.3 + n.y * 1.6 };
          run = 0.85;
        }
      }
      if (own && own.team !== p.team && !own.gk && p.tackT <= 0 && !G.restartHold) {
        const d = dist(p, own);
        if (d < 1.3) tryTackle(p, own, p.team === 1 ? 0.02 : 0);
        else if (d < 3 && Math.random() < (p.team === 1 ? G.D.slide : 0.02)) { startSlide(p, own.x + own.vx * 0.25 - p.x, own.y + own.vy * 0.25 - p.y); p.tackT = 1.2; }
      }
    }
    if (!own && !G.restartHold && (G.chasers[p.team].includes(p) || b.target === p)) { tgt = interceptPoint(p); run = 1; }
    p.tx = clamp(tgt.x, 0.5, PW - 0.5);
    p.ty = clamp(tgt.y, 0.5, PL - 0.5);
    p.run = run;
  }
  function cornerTarget(p) {
    const cp = G.cornerPlay, cr = p.cr;
    if (G.restartHold) {
      const s = G.restartSpot || G.ball;
      if (cr.role === 'mark' && cr.mark && !cr.mark.out) {
        const m = cr.mark, gl = s.y < PL / 2 ? 0 : PL;
        const n = nrm(PW / 2 - m.x, gl - m.y);
        return { x: m.x + n.x * 0.9, y: m.y + n.y * 0.9, run: 0.7 };
      }
      // a little jostling around the spot
      return { x: cr.x + Math.sin(G.time * 2.1 + p.slot) * 0.6, y: cr.y + Math.cos(G.time * 1.7 + p.slot * 2) * 0.45, run: 0.4 };
    }
    if (!cp) return null;
    if (p.team === cp.team) {
      if (p === cp.hitter) { // time the run onto the ball
        const left = Math.max(0.05, cp.t - G.time);
        const d = Math.hypot(cp.x - p.x, cp.y - p.y);
        return { x: cp.x, y: cp.y, run: clamp(d / (p.speed * left), 0.5, 1.15) };
      }
      const A = { near: [2.0, 3.4], six: [0.2, 5.0], far: [-3.2, 4.4], spot: [0.6, 9.2], back: [-5.0, 7.4] }[cr.role];
      if (A) return { ...cp.at(cp.C + cp.sx * A[0], A[1]), run: 0.95 };
      if (cr.role === 'edge') return { ...cp.at(cp.C - cp.sx * 1.0, 17.5), run: 0.6 };
      if (cr.role === 'short') return { ...cp.at(cp.C + cp.sx * 14, 11), run: 0.6 };
      return { x: cr.x, y: cr.y, run: 0.6 };
    }
    // defending: attack the ball when it comes into your zone, otherwise stay between your man and the ball
    const dz = Math.hypot(cp.x - p.x, cp.y - p.y);
    if ((cr.role === 'zone' || cr.role === 'post' || cr.role === 'mark') && dz < 3.0) return { x: cp.x, y: cp.y, run: 1.1 };
    if (cr.role === 'mark' && cr.mark && !cr.mark.out) {
      const m = cr.mark, n = nrm(cp.x - m.x, cp.y - m.y);
      return { x: m.x + n.x * 0.7, y: m.y + n.y * 0.7, run: 1.05 };
    }
    return { x: cr.x, y: cr.y, run: 0.7 };
  }
  // ------------------------------------------------------------------ goalkeepers
  // positions on the line that splits the angle between the posts, off his line by how far away the ball is
  function gkHome(p) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0, inward = gl === 0 ? 1 : -1;
    const dl = Math.abs(b.y - gl);
    const u1 = nrm(PW / 2 - GOAL_W / 2 - b.x, gl - b.y), u2 = nrm(PW / 2 + GOAL_W / 2 - b.x, gl - b.y);
    const bis = nrm(u1.x + u2.x, u1.y + u2.y);
    const dBall = Math.hypot(b.x - PW / 2, b.y - gl);
    let off = dBall > 38 ? clamp(3.4 + (dBall - 38) * 0.1, 3.4, 8) : clamp(0.9 + dBall * 0.07, 0.9, 3.3);
    off = Math.min(off, Math.max(0.55, dl - 1.5));
    const t = Math.abs(bis.y) > 0.05 ? (dl - off) / Math.abs(bis.y) : 0;
    const x = clamp(b.x + bis.x * t, PW / 2 - GOAL_W / 2 + 0.35, PW / 2 + GOAL_W / 2 - 0.35);
    return { x, y: gl + inward * off };
  }
  // the ball's path from now on, with the same physics as ballStep (no players)
  function predictBall(maxT) {
    const b = G.ball, dt = 1 / 60, out = [];
    let x = b.x, y = b.y, z = b.z, vx = b.vx, vy = b.vy, vz = b.vz, curve = b.curve || 0;
    for (let t = dt; t <= maxT; t += dt) {
      x += vx * dt; y += vy * dt;
      if (curve) { const n = nrm(-vy, vx); vx += n.x * curve * dt; vy += n.y * curve * dt; curve *= Math.exp(-2.2 * dt); if (Math.abs(curve) < 0.05) curve = 0; }
      if (z > 0 || vz > 0) {
        vz -= 9.8 * dt; z += vz * dt;
        const drag = Math.exp(-0.12 * dt); vx *= drag; vy *= drag;
        if (z <= 0) { z = 0; if (vz < -1.6) { vz = -vz * 0.48; vx *= 0.82; vy *= 0.82; } else vz = 0; }
      } else { const sp = Math.hypot(vx, vy); if (sp > 0) { const ns = Math.max(0, sp - (G.fr[0] + G.fr[1] * sp) * dt); vx *= ns / sp; vy *= ns / sp; } }
      out.push({ t, x, y, z });
      if (y < -0.5 || y > PL + 0.5 || x < -0.5 || x > PW + 0.5) break;
    }
    return out;
  }
  const gkBonus = (p) => (p.team === 1 ? G.D.cpuSave : G.D.userSave);
  // bodies between the shooter and the keeper make him react later
  function screenedView(p) {
    const b = G.ball;
    const dx = p.x - b.x, dy = p.y - b.y, L2 = dx * dx + dy * dy || 1;
    for (const o of G.players) {
      if (o.out || o === p || (b.shot && o === b.shot.by)) continue;
      const t = ((o.x - b.x) * dx + (o.y - b.y) * dy) / L2;
      if (t < 0.15 || t > 0.85) continue;
      if (Math.hypot(o.x - (b.x + dx * t), o.y - (b.y + dy * t)) < 0.6) return true;
    }
    return false;
  }
  // reading a shot: where it crosses his line, whether it is on target, and how long he needs to react
  function gkPlanShot(p) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0, sg = gl === 0 ? -1 : 1;
    const traj = predictBall(2.4);
    let cr = null, gx = null, gz = 0;
    for (const s of traj) {
      if (!cr && (s.y - p.y) * sg >= 0) cr = s;
      if ((s.y - gl) * sg >= 0) { gx = s.x; gz = s.z; break; }
    }
    if (!cr) cr = traj[traj.length - 1] || { t: 0.4, x: b.x, y: b.y, z: b.z };
    const onT = gx !== null && Math.abs(gx - PW / 2) < GOAL_W / 2 + 0.1 && gz < GOAL_H + 0.1;
    const react = clamp(0.3 - (p.gkRef - 50) * 0.0032 + (screenedView(p) ? 0.08 : 0) - gkBonus(p) * 0.6 + Math.random() * 0.06, 0.12, 0.42);
    return { shot: b.shot, decideAt: G.time + react, cross: cr, tCross: G.time + cr.t, onT, gx, gz, acted: false, stepX: p.x };
  }
  // after reacting: he gets across on his feet when he can, otherwise he runs towards it and times the dive
  // so that he is fully stretched when the ball arrives; shots going well wide he just watches
  const DIVE_T = 0.36;
  function gkAct(p, pl) {
    const cr = pl.cross;
    const dx = cr.x - p.x, ax = Math.abs(dx);
    const left = pl.tCross - G.time;
    const nearPost = pl.gx !== null && Math.abs(pl.gx - PW / 2) < GOAL_W / 2 + 0.8;
    pl.stepX = cr.x;
    if (!pl.onT && !nearPost) { pl.mode = 'watch'; pl.stepX = p.x + Math.sign(dx) * 0.3; return; }
    const runDist = Math.min(ax, p.speed * Math.max(0, left - DIVE_T) * 0.75);
    if ((ax < 0.5 || ax - runDist < 0.45) && cr.z < 2.05) { pl.mode = 'step'; return; }
    pl.mode = 'dive';
    pl.launchAt = Math.max(G.time, pl.tCross - DIVE_T);
  }
  function gkLaunch(p, pl) {
    const cr = pl.cross;
    const dx = cr.x - p.x, ax = Math.abs(dx);
    const Dmax = clamp(1.0 + (p.gkDiv - 50) * 0.015 + gkBonus(p) * 1.5, 0.85, 1.9);
    pl.mode = 'dived';
    startDive(p, Math.sign(dx) || 1, Math.min(Dmax, Math.max(0.15, ax - 0.75) + 0.2), clamp(cr.z - 0.9, 0, 0.95));
    if (G.dbg) G.dbg.dives++;
  }
  // a dive: the body flies sideways (and up for high balls), then he lands and needs a moment to get up
  function startDive(p, dir, dist, h) {
    const T = 0.36;
    const x1 = clamp(p.x + dir * dist, PW / 2 - GOAL_W / 2 - 1.4, PW / 2 + GOAL_W / 2 + 1.4);
    p.dv = { t: 0, T, x0: p.x, x1, dir, h, land: 0.45 + Math.random() * 0.25 };
    p.diveDir = dir; p.diveT = T + p.dv.land;
    p.wx = p.wy = p.vx = p.vy = 0;
  }
  function stepDive(p, dt) {
    const d = p.dv;
    d.t += dt;
    const k = clamp(d.t / d.T, 0, 1);
    p.x = d.x0 + (d.x1 - d.x0) * (1 - (1 - k) * (1 - k));
    p.gz = d.t <= d.T ? d.h * Math.sin(Math.PI * k) : 0;
    p.vx = p.vy = p.wx = p.wy = 0;
    p.diveT = Math.max(0, d.T + d.land - d.t);
    if (d.t >= d.T + d.land) { p.dv = null; p.gz = 0; p.diveT = 0; }
  }
  // does the ball meet his hands as it crosses his line? (null: it beats him)
  function gkReach(gk) {
    const b = G.ball;
    const lat = b.x - gk.x, z = b.z;
    if (gk.dv && gk.dv.t <= gk.dv.T + 0.08) {
      const prog = clamp(gk.dv.t / gk.dv.T, 0, 1);
      const fing = 0.5 + 0.45 * prog;
      const along = lat * gk.dv.dir;
      const zTop = gk.gz + 1.75 + 0.35 * prog, zLow = Math.max(0, gk.gz - 0.45);
      if (along > fing + 0.12 || along < -0.5 || z > zTop || z < zLow - 0.1) return null;
      return { stretch: clamp(along / (fing + 0.12), 0, 1), diving: true };
    }
    if (gk.dv || gk.fall > 0) return Math.abs(lat) < 0.6 && z < 0.6 ? { stretch: 0.6, diving: false } : null;
    const reacted = !gk.plan || gk.plan.shot !== b.shot || G.time >= gk.plan.decideAt;
    const arm = reacted ? 0.9 : 0.45, top = reacted ? 2.3 + clamp((gk.gkDiv - 50) * 0.005, 0, 0.25) : 1.85;
    if (Math.abs(lat) > arm + 0.11 || z > top) return null;
    return { stretch: clamp(Math.abs(lat) / (arm + 0.11), 0, 1) * 0.55 + (z > 2.05 ? 0.3 : 0), diving: false };
  }
  // high balls that drop into his area: he comes for them when he gets there first
  function gkClaimPoint(p) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0;
    if (b.lastTeam === p.team && !b.cross) return null;
    const traj = predictBall(2.4);
    let prevZ = b.z;
    for (const s of traj) {
      const down = s.z < prevZ;
      prevZ = s.z;
      if (!down || s.z > 2.7) continue; // only once it comes down
      if (s.z < 0.9) return null;
      if (Math.abs(s.y - gl) > 6.2 || Math.abs(s.x - PW / 2) > 9.5) continue;
      const tReach = Math.hypot(s.x - p.x, s.y - p.y) / (p.speed * 1.12) + 0.1;
      if (tReach > s.t + 0.05) continue;
      const crowd = G.players.filter((q) => !q.out && q !== p && Math.hypot(q.x - s.x, q.y - s.y) < 2.2).length;
      if (Math.random() > clamp(0.5 + (p.gkPos - 60) * 0.01 - crowd * 0.06, 0.15, 0.85)) return null; // stays on his line
      return { x: s.x, y: s.y };
    }
    return null;
  }
  // loose balls and through passes he reaches before any opponent
  function gkSweep(p) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0;
    if (b.lastTeam === p.team && b.passer && Math.hypot(b.vx, b.vy) > 3) return null;
    const ip = interceptPoint(p);
    const depth = Math.abs(ip.y - gl);
    if (depth > 20 || Math.abs(ip.x - PW / 2) > 22) return null;
    const tMe = Math.hypot(ip.x - p.x, ip.y - p.y) / p.speed;
    let tOpp = 99, tMate = 99;
    for (const o of G.players) {
      if (o.out || o === p) continue;
      const t = interceptTime(o);
      if (o.team !== p.team) tOpp = Math.min(tOpp, t); else tMate = Math.min(tMate, t);
    }
    if (depth > 12 && tMate < tMe) return null;
    if (tMe + 0.25 < tOpp && (depth < 16.5 || tMe + 0.6 < tOpp)) return ip;
    return null;
  }
  // an attacker through on goal: nobody of the keeper's team close to him or in his way
  function isThrough(own, team) {
    const gl = team === 0 ? PL : 0;
    const dx = PW / 2 - own.x, dy = gl - own.y, L2 = dx * dx + dy * dy || 1;
    for (const o of G.players) {
      if (o.out || o.team !== team || o.gk) continue;
      if (Math.hypot(o.x - own.x, o.y - own.y) < 2.2) return false;
      const t = ((o.x - own.x) * dx + (o.y - own.y) * dy) / L2;
      if (t > 0 && t < 1 && Math.hypot(o.x - (own.x + dx * t), o.y - (own.y + dy * t)) < 2.6) return false;
    }
    return true;
  }
  // one against one: down at the striker's feet
  function gkSmother(p, own) {
    p.tackT = 1.0;
    const pr = clamp(0.36 + (p.gkDiv - own.dri) / 110 + gkBonus(p) * 2, 0.12, 0.72);
    const dir = Math.sign(own.x - p.x) || 1;
    startDive(p, dir, clamp(Math.abs(own.x - p.x), 0.3, 1.2), 0);
    const r = Math.random();
    if (r < pr) {
      if (Math.random() < 0.55) { take(p); p.holdT = 1.2; } else poke(p, (Math.random() - 0.5) * 8, (p.team === 0 ? -1 : 1) * (5 + Math.random() * 4));
      own.cool = 0.5;
      banner('Abafou!', 0.8);
      say(`${nameOf(p)} sai nos pés de ${nameOf(own)} e abafa!`, 2);
      if (G.dbg) G.dbg.smothers++;
    } else if (r < pr + 0.06 && inBoxOf(p.team, own.x, own.y)) foul(p, own);
    else {
      Object.assign(own, { feintT: 0.45, feintCD: 1.5, fdx: -dir * 0.9, fdy: p.team === 0 ? 1 : -1 });
      say(`${nameOf(own)} tira do goleiro!`, 1);
    }
  }
  // crosses he gets to: a catch, or a punch when it is crowded
  function claimAir(gk) {
    const b = G.ball;
    const crowd = G.players.filter((q) => !q.out && q.team !== gk.team && Math.hypot(q.x - b.x, q.y - b.y) < 1.6).length;
    const pCatch = clamp(0.66 + (gk.gkHan - 70) * 0.012 - crowd * 0.1 - (b.z > 2.45 ? 0.1 : 0) + gkBonus(gk), 0.25, 0.95);
    G.cornerPlay = null;
    if (Math.random() < pCatch) {
      take(gk); gk.holdT = 1.4;
      banner('Segurou!', 0.8);
      say(pick([`${nameOf(gk)} sai do gol e fica com a bola.`, `Firme, ${nameOf(gk)} encaixa o cruzamento.`]), 1);
      if (G.dbg) G.dbg.claims++;
      return;
    }
    const away = gk.team === 0 ? -1 : 1;
    const n = nrm((Math.random() - 0.5) * 1.4 + (b.x < PW / 2 ? -0.35 : 0.35), away);
    const sp = 11 + Math.random() * 5;
    Object.assign(b, { owner: null, vx: n.x * sp, vy: n.y * sp, vz: 3.5 + Math.random() * 2.5, last: gk, lastTeam: gk.team, shot: null, passer: null, target: null, curve: 0, cross: null });
    G.flight++;
    gk.cool = 0.4; gk.kickT = 0.25;
    banner('Socou!', 0.8);
    say(`${nameOf(gk)} sobe mais alto e afasta de soco.`, 1);
    sfx('kick', 0.6);
    if (G.dbg) G.dbg.punches++;
  }
  function keeperAI(p, dt, think) {
    const b = G.ball;
    const gl = p.team === 0 ? PL : 0;
    if (p.dv) { stepDive(p, dt); return; }
    if (b.owner === p) {
      p.wx = 0; p.wy = 0;
      if (p.team === 0 && !G.auto && !G.solo && G.ctrl === p) return; // the user is aiming the distribution
      if (!G.restartHold && !inBoxOf(p.team, p.x, p.y)) { aiPass(p, true, false); return; } // at his feet outside the box: clear it
      p.holdT -= dt;
      if ((p.holdT <= 0 && G.state === 'play') || p.holdT <= -1.5) aiPass(p, Math.random() < 0.35, false);
      return;
    }
    if (p.dive && p.dive.t > 0) { penDive(p, dt); return; } // penalty
    if (p.diveT > 0) p.diveT = Math.max(0, p.diveT - dt);
    const own = b.owner;
    // corner against: in the middle of the goal until the kick
    if (G.restartHold && G.setKind === 'corner' && G.restartTeam !== p.team && G.restartSpot) {
      const g = cornerGeo(G.restartSpot.x, G.restartSpot.y);
      moveTo(p, g.C - g.sx * 0.35, g.gl + g.inward * 0.8, 0.5);
      return;
    }
    // a shot: read it, react, then step across or dive
    if (b.shot && b.shot.team !== p.team && !b.shot.pk) {
      if (!p.plan || p.plan.shot !== b.shot) p.plan = gkPlanShot(p);
      const pl = p.plan;
      if (G.time < pl.decideAt) { moveTo(p, p.x + (pl.cross.x - p.x) * 0.15, p.y, 0.3); return; }
      if (!pl.acted) { pl.acted = true; gkAct(p, pl); }
      if (pl.mode === 'dive' && G.time >= pl.launchAt) { gkLaunch(p, pl); return; }
      moveTo(p, pl.stepX, p.y, pl.mode === 'watch' ? 0.5 : 1.15);
      return;
    }
    // SAÍDA DO GOLEIRO (user button): the keeper rushes out to the ball / the carrier and smothers it
    if (p.team === 0 && G.gkRush > 0 && !G.restartHold && G.state === 'play') {
      const tgt = own && own.team === 1 ? own : b;
      if (own && own.team === 0) G.gkRush = 0;
      else {
        const ty = Math.max(PL - 40, tgt.y + (tgt.y < p.y ? 0.6 : 0));
        moveTo(p, tgt.x, ty, 1.3, 1.4);
        const dd = Math.hypot(tgt.x - p.x, tgt.y - p.y);
        if (own && own.team === 1 && dd < 2.4 && p.tackT <= 0) { gkSmother(p, own); G.gkRush = 0; }
        else if (!own && dd < 1.4 && b.z < 1.2) { take(p); p.holdT = 1.0; G.gkRush = 0; }
        return;
      }
    }
    // crosses: decide once per ball in the air whether to come for it
    if (!own && !G.restartHold && b.z > 0.5) {
      if (p.claimFor !== G.flight) { p.claimFor = G.flight; p.claim = gkClaimPoint(p); }
      if (p.claim) { moveTo(p, p.claim.x, p.claim.y, 1.25); return; }
    } else p.claim = null;
    // loose balls and through passes
    if (!own && !G.restartHold && b.z < 1.6) {
      if (think || !p.sweep) p.sweep = gkSweep(p);
      if (p.sweep) { const ip = think ? p.sweep : interceptPoint(p); moveTo(p, ip.x, ip.y, 1.2); return; }
    } else p.sweep = null;
    // one against one: off the line to narrow the angle, then down at his feet
    if (own && own.team !== p.team && !G.restartHold && G.state === 'play') {
      const dG = Math.hypot(own.x - PW / 2, own.y - gl);
      if (dG < 21 && Math.abs(own.x - PW / 2) < 16 && isThrough(own, p.team)) {
        const n = nrm(own.x - PW / 2, own.y - gl);
        const off = clamp(dG * 0.5, 2.2, 9);
        moveTo(p, PW / 2 + n.x * off, gl + n.y * off, 1.2);
        if (dist(p, own) < 2.2 && p.tackT <= 0) gkSmother(p, own);
        return;
      }
    }
    const h = gkHome(p);
    const set = own && own.team !== p.team && Math.hypot(own.x - PW / 2, own.y - gl) < 26;
    moveTo(p, h.x, h.y, set ? 0.75 : 0.85);
  }
  function carrierAI(p, dt) {
    const fwd = p.team === 0 ? -1 : 1;
    const gy = p.team === 0 ? 0 : PL;
    if (G.restartHold) {
      p.wx = 0; p.wy = 0;
      if (G.state !== 'play') return;
      p.decT -= dt;
      if (p.decT > 0) return;
      const dGoal = Math.hypot(PW / 2 - p.x, gy - p.y);
      if (G.setKind === 'corner') cornerKick(p, aiCornerZone(p));
      else if (G.setKind === 'free' && dGoal < 27 && Math.abs(p.x - PW / 2) < 16 && Math.random() < 0.6) shoot(p, (Math.random() - 0.5) * 2, 0.62 + Math.random() * 0.3);
      else aiPass(p, false, G.setKind === 'kickoff' || G.setKind === 'throw');
      return;
    }
    const dGoal = Math.hypot(PW / 2 - p.x, gy - p.y);
    const press = pressureOn(p);
    const gk = keeperOf(1 - p.team);
    p.decT -= dt;
    if (p.decT <= 0) {
      p.decT = 0.2 + Math.random() * 0.25;
      const central = Math.abs(p.x - PW / 2) < 15;
      if (gk && dGoal < 24 && dGoal > 9 && central && Math.abs(gk.y - gy) > 5 && Math.random() < 0.5) { chip(p); return; }
      if (dGoal < 26 && central) {
        const lane = laneOpen(p, { x: PW / 2, y: gy }, true);
        let pShoot = (dGoal < 11 ? 0.9 : dGoal < 17 ? 0.65 : 0.28) * (lane < 1.2 ? 0.45 : 1) * (0.7 + p.sho / 230);
        // a team-mate in a clearly better spot (closer, free, open lane): play him in
        for (const q of G.players) {
          if (q.out || q.team !== p.team || q === p || q.gk) continue;
          const dq = Math.hypot(PW / 2 - q.x, gy - q.y);
          if (dq < dGoal - 7 && Math.abs(q.x - PW / 2) < 14 && nearestOppDist(q) > 4.5 && laneOpen(p, q) > 2 && Math.random() < 0.35) { passTo(p, q, nrm(q.x - p.x, q.y - p.y), false, q.runT > 0); return; }
        }
        if (Math.random() < pShoot) { const away = gk ? (gk.x > PW / 2 ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1); shoot(p, away * (0.5 + Math.random() * 0.5), 0.5 + Math.random() * 0.5); return; }
      }
      if (!central && Math.abs(gy - p.y) < 22 && Math.random() < (styleOf(p.team) === 'wings' ? 0.55 : 0.3)) { cross(p); return; }
      if (styleOf(p.team) === 'long' && Math.abs(gy - p.y) > 45 && Math.random() < 0.3) { aiPass(p, true, false); return; }
      if (styleOf(p.team) === 'poss' && Math.random() < 0.18) { aiPass(p, false, true); return; }
      if (press > 0.85 && Math.random() < 0.7) { aiPass(p, false, false); return; }
      if (G.D && p.team === 1 && tacticBias(1) < -0.4 && dGoal > 40 && Math.random() < 0.25) { aiPass(p, false, true); return; } // winning late: keep the ball
      if (Math.random() < 0.1) { aiPass(p, false, false); return; }
    }
    let tx = (PW / 2 - p.x) * (dGoal < 30 ? 0.5 : 0.2), ty = fwd * 10;
    let opp = null, od = 99;
    for (const o of G.players) if (!o.out && o.team !== p.team) { const d = dist(o, p); if (d < od && (o.y - p.y) * fwd > -2) { od = d; opp = o; } }
    // feint: a sharp cut away from a closing defender
    p.feintCD = (p.feintCD || 0) - dt;
    if (opp && od < 2.6 && p.feintT <= 0 && p.feintCD <= 0 && Math.abs(opp.x - p.x) < 1.6 && Math.random() < (0.5 + Math.max(0, p.dri - 60) * 0.04) * dt) {
      p.feintT = 0.35; p.feintCD = 1.5; p.fdx = (opp.x > p.x ? -1 : 1) * 0.75; p.fdy = fwd;
    }
    if (p.feintT > 0) { tx = p.fdx * 10; ty = p.fdy * 10; }
    else if (opp && od < 5) { const n = nrm(p.x - opp.x, p.y - opp.y); tx += n.x * (5 - od) * 2.6; ty += n.y * (5 - od) * 0.5; }
    if (p.x < 4) tx += 5;
    if (p.x > PW - 4) tx -= 5;
    const n = nrm(tx, ty);
    const s = p.speed * (0.84 + (p.dri - 70) / 400) * (p.feintT > 0 ? 1.12 : 1);
    p.wx = n.x * s; p.wy = n.y * s;
  }
  function aiPass(p, forceLong, shortOnly) {
    const fwd = p.team === 0 ? -1 : 1;
    let best = null, bs = -1e9, bestLob = false, bestThrough = false;
    for (const q of G.players) {
      if (q.out || q.team !== p.team || q === p || q.gk) continue;
      const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
      if (d < 4 || d > (shortOnly ? 22 : 46)) continue;
      const open = laneOpen(p, q);
      const lob = !shortOnly && ((open < 1.6 && d > 14) || d > 32);
      const space = Math.min(6, nearestOppDist(q));
      const prog = dy * fwd;
      let s = space * 0.55 + Math.min(open, 5) * (lob ? 0.15 : 0.6) + prog * 0.09 - d * 0.03 - (lob ? 0.8 : 0) + Math.random() * 1.1 + (forceLong ? d * 0.06 : 0);
      const through = !shortOnly && q.runT > 0 && prog > 4;
      if (through) s += 1.6;
      if (G.solo && q.pid === G.solo && p.team === 0) s += 0.8 + (G.callT > 0 ? 3.5 : 0);
      if (s > bs) { bs = s; best = q; bestLob = lob; bestThrough = through; }
    }
    if (!best) { passTo(p, null, nrm((PW / 2 - p.x) * 0.02, fwd), true, false); return; }
    passTo(p, best, nrm(best.x - p.x, best.y - p.y), bestLob, bestThrough);
  }

  // ------------------------------------------------------------------ physics
  function integrate(p, dt) {
    if (p.slide > 0) {
      p.slide -= dt;
      const k = Math.max(0.2, p.slide / 0.45);
      p.vx = p.sx * 9 * k; p.vy = p.sy * 9 * k;
      slideContact(p);
      if (Math.random() < dt * 40) burst(p.x - p.sx * 0.5, p.y - p.sy * 0.5, 1, '#9cc766');
      if (p.slide <= 0) { p.fall = Math.max(p.fall, 0.4); p.vx *= 0.3; p.vy *= 0.3; }
    } else {
      const acc = (p.fall > 0 ? 6 : 24) * dt;
      let dvx = p.wx - p.vx, dvy = p.wy - p.vy;
      const dl = Math.hypot(dvx, dvy);
      if (dl > acc) { dvx *= acc / dl; dvy *= acc / dl; }
      p.vx += dvx; p.vy += dvy;
    }
    p.x = clamp(p.x + p.vx * dt, -3, PW + 3);
    p.y = clamp(p.y + p.vy * dt, -3, PL + 3);
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 0.4 && p.slide <= 0 && !(G.ball.owner === p && G.restartHold)) { p.dx = p.vx / sp; p.dy = p.vy / sp; }
    p.anim += sp * dt * 1.9;
  }
  function separate() {
    const ps = G.players;
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i];
      if (a.out) continue;
      for (let j = i + 1; j < ps.length; j++) {
        const c = ps[j];
        if (c.out) continue;
        const dx = a.x - c.x, dy = a.y - c.y, d = Math.hypot(dx, dy);
        if (d > 0.001 && d < 0.85) { const push = (0.85 - d) * 0.5; a.x += dx / d * push; a.y += dy / d * push; c.x -= dx / d * push; c.y -= dy / d * push; }
      }
    }
  }
  function ballStep(dt) {
    const b = G.ball;
    if (b.owner) {
      const o = b.owner;
      if (G.restartHold && G.restartSpot) { b.x = G.restartSpot.x; b.y = G.restartSpot.y; b.z = 0; b.vx = b.vy = b.vz = 0; return; }
      if (o.gk && inBoxOf(o.team, o.x, o.y)) { b.x = o.x + o.dx * 0.28; b.y = o.y + o.dy * 0.28; b.z = 1.0 + o.gz; b.vx = o.vx; b.vy = o.vy; b.vz = 0; return; } // in his hands
      const sp = Math.hypot(o.vx, o.vy);
      const off = 0.5 + Math.min(0.35, sp * 0.045) + Math.sin(o.anim * 2.2) * 0.07;
      b.x = o.x + o.dx * off; b.y = o.y + o.dy * off; b.z = 0; b.vx = o.vx; b.vy = o.vy; b.vz = 0;
      if (o.sk && o.sk.kind === 'roll') {
        // carretilha: the sole drags the ball across in front of the body, from one side to the other
        const kp = 1 - o.sk.t / o.sk.T, e = clamp((kp - 0.18) / 0.5, 0, 1), sm = e * e * (3 - 2 * e);
        const lat = o.sk.side * (-0.62 + 1.24 * sm), fw = 0.4 + 0.12 * sm + (kp > 0.7 ? (kp - 0.7) * 1.2 : 0);
        const pdx = -o.dy, pdy = o.dx;
        b.x = o.x + o.dx * fw + pdx * lat; b.y = o.y + o.dy * fw + pdy * lat;
      }
      b.spin += sp * dt * 3;
      if (G.restartHold || (b.x >= 0 && b.x <= PW && b.y >= 0 && b.y <= PL)) return;
      if ((b.y < 0 || b.y > PL) && Math.abs(b.x - PW / 2) < GOAL_W / 2) { b.owner = null; goalScored(b.y < 0); return; }
      b.owner = null; o.cool = 0.4;
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.curve) { const n = nrm(-b.vy, b.vx); b.vx += n.x * b.curve * dt; b.vy += n.y * b.curve * dt; b.curve *= Math.exp(-2.2 * dt); if (Math.abs(b.curve) < 0.05) b.curve = 0; }
    if (b.z > 0 || b.vz > 0) {
      b.vz -= 9.8 * dt; b.z += b.vz * dt;
      const drag = Math.exp(-0.12 * dt); b.vx *= drag; b.vy *= drag;
      if (b.z <= 0) { b.z = 0; if (b.vz < -1.6) { b.vz = -b.vz * 0.48; b.vx *= 0.82; b.vy *= 0.82; } else b.vz = 0; }
    } else {
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 0) { const ns = Math.max(0, sp - (G.fr[0] + G.fr[1] * sp) * dt); b.vx *= ns / sp; b.vy *= ns / sp; }
    }
    b.spin += Math.hypot(b.vx, b.vy) * dt * 3;
    if (b.shot) {
      b.shot.t += dt;
      if (!b.shot.pk && (b.shot.t > 2.5 || (Math.hypot(b.vx, b.vy) < 4 && b.z < 0.3 && b.shot.t > 0.3))) b.shot = null;
    }
    const pk = G.pk;
    // goal line
    if (b.y < 0 || b.y > PL) {
      const top = b.y < 0;
      const gx = Math.abs(b.x - PW / 2);
      if (Math.abs(gx - GOAL_W / 2) < 0.22 && b.z < GOAL_H + 0.1 && b.postT <= 0) {
        b.y = top ? 0.05 : PL - 0.05; b.vy = -b.vy * 0.55; b.vx += Math.sign(b.x - PW / 2) * (gx < GOAL_W / 2 ? -2 : 2); b.postT = 0.4;
        if (b.shot) b.shot.checked = true;
        banner('Na trave!', 1); say('Na trave! Que susto!', 2); sfx('post', 1); G.shake = G.auto ? 0 : 0.4;
        return;
      }
      if (gx < GOAL_W / 2 && b.z < GOAL_H) {
        if (pk) { pk.scored = true; pk.dead = true; if (pk.shootout) { b.inGoal = true; b.vx *= 0.3; b.vy *= 0.3; net(top, b.x); sfx('net', 1); G.shake = G.auto ? 0 : 0.3; return; } }
        goalScored(top); return;
      }
      if (gx < GOAL_W / 2 && Math.abs(b.z - GOAL_H) < 0.2 && b.postT <= 0) { b.y = top ? 0.05 : PL - 0.05; b.vy = -b.vy * 0.5; b.vz = -Math.abs(b.vz) * 0.5; b.postT = 0.4; banner('No travessão!', 1); say('No travessão!', 2); sfx('post', 1); return; }
      if (pk) { b.vx = b.vy = 0; b.y = top ? -0.6 : PL + 0.6; pk.dead = true; if (!pk.shootout) pk.t = Math.max(pk.t, 1.4); return; }
      if (b.shot && gx < GOAL_W / 2 + 3) {
        banner(b.z >= GOAL_H ? 'Por cima!' : 'Para fora!', 0.8);
        say(b.z >= GOAL_H ? 'Por cima do gol!' : 'Para fora, raspando a trave!', 1);
        sfx('groan', 0.4);
        if (b.shot.by && Math.random() < 0.5) evAdd(G.st, { min: minuteInt(), t: 'miss', s: sideOf(b.shot.team), p: b.shot.by.pid, txt: phrase('miss', { p: pidName(b.shot.by.pid) }) });
      }
      const defending = top ? 1 : 0;
      if (G.dbg) { const k = b.lastTeam !== defending ? 'outGoalKick' : b.last && b.last.gk ? 'outCornerGK' : 'outCornerDef'; G.dbg[k] = (G.dbg[k] || 0) + 1; }
      if (b.lastTeam === defending) setPiece(1 - defending, b.x < PW / 2 ? 0.3 : PW - 0.3, top ? 0.3 : PL - 0.3, 'corner');
      else setPiece(defending, PW / 2 + (b.x < PW / 2 ? -5 : 5), top ? 5.5 : PL - 5.5, 'goalkick');
      return;
    }
    if (b.x < 0 || b.x > PW) {
      if (pk) { b.vx = b.vy = 0; pk.dead = true; if (!pk.shootout) pk.t = Math.max(pk.t, 1.4); return; }
      setPiece(1 - b.lastTeam, b.x < 0 ? 0.2 : PW - 0.2, clamp(b.y, 1, PL - 1), 'throw');
      return;
    }
    // goalkeeper: when the ball crosses his line, it is a save only if his body or his dive gets there
    if (b.shot && !b.shot.checked) {
      const gk = keeperOf(1 - b.shot.team);
      if (gk) {
        const prevY = b.y - b.vy * dt;
        if ((prevY - gk.y) * (b.y - gk.y) <= 0 || Math.abs(b.y - gk.y) < 0.3) {
          b.shot.checked = true;
          if (b.shot.pk) { // penalties are decided when the kick is taken
            if (b.shot.force === 'save') { gkSave(gk, { stretch: 0.5, diving: true, pk: true }); if (pk && !pk.shootout) pk.t = Math.max(pk.t, 1.5); return; }
          } else {
            const r = gkReach(gk);
            if (G.dbg) {
              const onT = Math.abs(b.x - PW / 2) < GOAL_W / 2 + 0.5;
              (G.dbg.cross = G.dbg.cross || []).push({ mode: gk.plan && gk.plan.shot === b.shot ? gk.plan.mode || 'none' : 'noplan', ponT: gk.plan ? gk.plan.onT : null, lat: +(b.x - gk.x).toFixed(2), z: +b.z.toFixed(2), sp: +Math.hypot(b.vx, b.vy).toFixed(1), t: +b.shot.t.toFixed(2), dv: gk.dv ? +(gk.dv.t / gk.dv.T).toFixed(2) : -1, react: gk.plan ? +(gk.plan.decideAt - (G.time - b.shot.t)).toFixed(2) : -1, hit: !!r, gx: +(b.x - PW / 2).toFixed(2), head: !!b.shot.header, onT, dGoal: +Math.abs(gk.y - (gk.team === 0 ? PL : 0)).toFixed(1) });
            }
            if (r && gkSave(gk, r)) return;
          }
          b.shot.beaten = true;
        }
      }
    }
    // pick up, headers and aerial duels
    if (b.z < 2.9 && !pk) {
      const cands = [];
      for (const p of G.players) {
        if (p.out || p.fall > 0 || p.cool > 0 || p.slide > 0) continue;
        if (b.shot && p.team === b.shot.team && b.shot.t < 0.5) continue;
        const hands = p.gk && inBoxOf(p.team, p.x, p.y);
        if (hands && b.shot && b.shot.team !== p.team) continue; // shots are decided by the save check
        if (p.dv) continue;
        if (b.shot && b.shot.fk && !p.gk && p.team !== b.shot.team && b.z > 1.5) continue; // the wall cannot reach a lifted free kick
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        const rXY = hands ? 1.35 : b.z >= 1.4 ? 1.05 : 1.0;
        const rZ = hands ? 2.72 + clamp((p.hgt - 185) * 0.01, -0.1, 0.12) : 2.5 + clamp((p.hgt - 180) * 0.006, -0.12, 0.1);
        if (d < rXY && b.z <= rZ) cands.push({ p, d, hands });
      }
      if (cands.length) {
        const gkc = cands.find((c) => c.hands);
        if (gkc) {
          if (b.z >= 1.3) { claimAir(gkc.p); return; }
          take(gkc.p); gkc.p.holdT = 1.0; G.cornerPlay = null; return;
        }
        // in the air: the best jump wins the header (a few more players jump in when it is crowded)
        if (b.z >= 1.45) {
          const cp = G.cornerPlay;
          const near = G.players.filter((p) => !p.out && !p.gk && p.fall <= 0 && p.slide <= 0 && !(b.shot && p.team === b.shot.team && b.shot.t < 0.5) && Math.hypot(p.x - b.x, p.y - b.y) < 1.45);
          let top = null, bs = -1e9;
          for (const p of near) {
            const d = Math.hypot(p.x - b.x, p.y - b.y);
            const sc = aerial(p) * 0.5 + (1 - d / 1.45) * 26 + Math.random() * 30 + (cp && p === cp.hitter ? 4 : 0) + (p.team !== b.lastTeam ? 3 : 0);
            if (sc > bs) { bs = sc; top = p; }
          }
          for (const p of near) if (p !== top) p.cool = Math.max(p.cool, 0.3);
          if (top) {
            if (G.dbg && cp) { G.dbg.cornerHeaders++; if (top.team === cp.team) G.dbg.cornerAttHeaders++; }
            G.cornerPlay = null;
            header(top);
            return;
          }
        }
        const best = cands.sort((u, v) => u.d - v.d)[0].p;
        const sp = Math.hypot(b.vx, b.vy);
        G.cornerPlay = null;
        let ctrl;
        if (b.shot && best.team !== b.shot.team) ctrl = 0.3 + (best.def - 60) / 220;
        else if (best.team === b.lastTeam) ctrl = 0.97 - Math.max(0, sp - 16) * 0.025;
        else ctrl = 0.55 + (best.def - 60) / 160 - Math.max(0, sp - 12) * 0.03;
        if (Math.random() < ctrl) {
          const wasShot = b.shot && best.team !== b.shot.team;
          take(best);
          if (wasShot) say(`${nameOf(best)} trava o chute!`, 1);
        } else {
          best.cool = 0.3; b.vx *= 0.6; b.vy *= 0.6;
          if (b.shot) {
            b.vx += (Math.random() - 0.5) * 9; b.vz = Math.max(b.vz, Math.random() * 3);
            b.shot = Object.assign({}, b.shot, { t: 0.2, checked: false, defl: true });
            b.lastTeam = best.team; b.last = best; G.flight++;
            say(`Desviou em ${nameOf(best)}!`, 1);
          }
        }
      }
    }
  }
  function header(p) {
    const b = G.ball;
    const gy = p.team === 0 ? 0 : PL, fwd = p.team === 0 ? -1 : 1;
    const dGoal = Math.hypot(PW / 2 - p.x, gy - p.y);
    p.kickT = 0.25;
    G.flight++;
    if (dGoal < 16 && Math.random() < 0.8) {
      const skill = (p.sho * 0.45 + p.phy * 0.35 + 20) / 100;
      const aimX = PW / 2 + (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 2.7) + grand() * (0.45 + (1 - skill) * 1.7);
      const n = nrm(aimX - b.x, gy - b.y);
      const sp = 11 + Math.random() * 6 + (p.phy - 70) * 0.06;
      const vz = -1.1 + Math.random() * 2.3 + grand() * 0.55 * (1.25 - skill) + (b.z > 2.2 ? 0.35 : 0);
      Object.assign(b, { owner: null, vx: n.x * sp, vy: n.y * sp, vz, last: p, lastTeam: p.team, passer: null, target: null, curve: 0, cross: null });
      b.shot = { team: p.team, by: p, t: 0, checked: false, beaten: false, force: null, header: true };
      G.st.stats.sh[sideOf(p.team)]++;
      p.cool = 0.3;
      banner('Cabeçada!', 0.6);
      say(`Cabeçada de ${nameOf(p)}!`, 1);
      sfx('kick', 0.5);
      if (G.dbg && G.time - (G.lastCornerT || -99) < 4) G.dbg.cornerShots++;
      return;
    }
    const ownGoal = p.team === 0 ? PL : 0;
    let n;
    if (p.team !== b.lastTeam && Math.abs(p.y - ownGoal) < 9 && Math.random() < 0.2) n = nrm(Math.sign(p.x - PW / 2 || 1) * (0.5 + Math.random()), ownGoal === 0 ? -1 : 1); // glanced behind
    else if (p.team === b.lastTeam) n = nrm(b.vx * 0.3 + (Math.random() - 0.5) * 4, fwd * 6);
    else n = nrm((Math.random() - 0.5) * 6, fwd * 8);
    Object.assign(b, { owner: null, vx: n.x * 11, vy: n.y * 11, vz: 3.5, last: p, lastTeam: p.team, shot: null, passer: null, target: null, curve: 0, cross: null });
    p.cool = 0.3;
    sfx('kick', 0.4);
  }
  // the ball meets the keeper: held, pushed wide, tipped over, blocked into the box, or (rarely) it squirms in
  function gkSave(gk, r) {
    const b = G.ball, st = G.st, pk = G.pk;
    const k = sideOf(1 - gk.team);
    const shooter = b.shot && b.shot.by;
    const sp = Math.hypot(b.vx, b.vy);
    const gl = gk.team === 0 ? PL : 0, away = gl === 0 ? 1 : -1; // goal line he guards and the way back into the pitch
    let pHold = clamp(0.8 + (gk.gkHan - 70) * 0.012 - Math.max(0, sp - 15) * 0.028 - r.stretch * 0.6 - (b.z > 2.0 ? 0.12 : 0) + (b.shot && b.shot.chip ? 0.15 : 0) + gkBonus(gk), 0.03, 0.95);
    const pIn = r.pk ? 0 : clamp((r.diving ? 0.012 : 0.004) + Math.max(0, sp - 22) * 0.005 + (r.stretch > 0.85 ? 0.05 : 0) - (gk.gkHan - 70) * 0.002, 0, 0.1);
    if (r.pk) pHold = 0.45;
    const u = Math.random();
    if (u >= pHold && u < pHold + pIn) {
      b.vx *= 0.72; b.vy *= 0.72; b.vz *= 0.5;
      say(pick([`A bola escapa das mãos de ${nameOf(gk)}!`, `Falhou! A bola passa por ${nameOf(gk)}!`]), 2);
      if (G.dbg) G.dbg.fumbles++;
      return false;
    }
    if (!(pk && pk.shootout)) {
      st.stats.sot[k]++;
      addRating(st, gk.pid, r.stretch > 0.6 ? 0.32 : 0.2);
      if (shooter) addRating(st, shooter.pid, 0.08);
      if (shooter && (sp > 17 || r.stretch > 0.5)) evAdd(st, { min: minuteInt(), t: 'save', s: k, p: shooter.pid, p2: gk.pid, txt: phrase('saveH', { p: pidName(shooter.pid), g: pidName(gk.pid) }) });
    }
    G.cornerPlay = null;
    G.flight++;
    if (u < pHold) {
      take(gk); gk.holdT = 1.3;
      banner(r.stretch > 0.6 ? 'Que defesa!' : 'Defesa!', 0.9);
      if (pk) { b.owner = null; b.vx = b.vy = 0; b.x = gk.x; b.y = gl + away * 0.9; }
      if (G.dbg) G.dbg.catches++;
    } else {
      const side = Math.sign(b.x - PW / 2) || (gk.dv ? gk.dv.dir : Math.random() < 0.5 ? -1 : 1);
      let vx, vy, vz;
      if (b.z > 2.0 && Math.abs(b.x - PW / 2) < GOAL_W / 2 + 0.5) { // tipped over the bar
        vx = b.vx * 0.25 + side * Math.random() * 2; vy = -away * (2 + Math.random() * 2.5); vz = 4 + Math.random() * 2;
      } else if (r.stretch > 0.55 || (r.diving && Math.random() < 0.55) || (sp > 21 && Math.random() < 0.3)) { // pushed round the post
        vx = side * (4 + Math.random() * 5); vy = -away * (1.5 + Math.random() * 3); vz = 0.8 + Math.random() * 1.8;
      } else { // blocked: the rebound drops in front of him
        vx = (Math.random() - 0.5) * 7; vy = away * (2.5 + Math.random() * 5.5); vz = 0.5 + Math.random() * 2;
      }
      if (pk) { vx *= 0.5; vy *= 0.5; }
      if (vy * away < 0) { // heading for the goal line: past the post or over the bar, never into the net
        const t = Math.max(0.05, Math.abs(b.y - gl) / Math.abs(vy));
        if (Math.abs(b.x + vx * t - PW / 2) < GOAL_W / 2 + 0.4) vz = Math.min(14, (3.1 + 4.9 * t * t) / t);
      }
      Object.assign(b, { owner: null, vx, vy, vz, z: Math.max(b.z, 0.1), last: gk, lastTeam: gk.team, shot: null, passer: null, target: null, curve: 0, cross: null });
      gk.cool = 0.45;
      banner('Espalmou!', 0.9);
      if (G.dbg) G.dbg.parries++;
    }
    say(pick([`Que defesa de ${nameOf(gk)}!`, `${nameOf(gk)} salva!`, `Grande defesa de ${nameOf(gk)}!`]), 2);
    sfx('save', 1);
    return true;
  }
  function goalScored(goalTop) {
    const b = G.ball, st = G.st;
    if (G.tr) { // training drill: no score, no replay
      Object.assign(b, { inGoal: true, owner: null, shot: null, passer: null, target: null, curve: 0 });
      b.vx *= 0.35; b.vy *= 0.35;
      net(goalTop, b.x); sfx('net', 1);
      trainEnd(G.tr.kind === 'free' ? 'goal' : 'miss');
      return;
    }
    const fromPk = !!G.pk;
    const team = G.pk ? G.pk.team : (goalTop ? 0 : 1);
    const k = sideOf(team);
    const scorer = b.shot && b.shot.team === team ? b.shot.by : (b.last && b.last.team === team ? b.last : null);
    if (G.dbg && G.time - G.lastCornerT < 6) G.dbg.cornerGoals++;
    const og = !scorer;
    let assist = 0;
    if (!og && !fromPk && b.assist && b.assist.team === team && b.assist.pid !== scorer.pid && G.time - b.assist.t < 9) assist = b.assist.pid;
    st.score[k]++;
    if (!og) { st.stats.sot[k]++; addRating(st, scorer.pid, 1.1); if (assist) addRating(st, assist, 0.6); }
    const gk = keeperOf(1 - team);
    if (gk) addRating(st, gk.pid, -0.35);
    const mn = minuteInt();
    const pid = og ? 0 : scorer.pid;
    evAdd(st, { min: mn, t: 'goal', s: k, p: pid, p2: assist, sc: st.score.slice(), og, txt: og ? `Gol contra! ${TA(st.sides[k].id)} marca com a ajuda da defesa adversária.` : (fromPk ? `GOL! ${pidName(pid)} converte o pênalti.` : phrase('goal', { p: pidName(pid) }) + (assist ? ` Assistência de ${pidName(assist)}.` : '')) });
    Object.assign(b, { inGoal: true, owner: null, shot: null, passer: null, target: null, assist: null, curve: 0 });
    b.vx *= 0.35; b.vy *= 0.35;
    const celebrant = scorer || nearestTo(team, b.x, b.y, true);
    G.celebr = celebrant ? { scorer: celebrant, cx: b.x < PW / 2 ? 3 : PW - 3, cy: goalTop ? 4 : PL - 4, kind: null, t0: G.time, lastK: null, lastT: -9 } : null;
    const mine = !!G.celebr && celebrant.team === 0 && !G.auto && !G.solo;
    if (G.celebr && !mine) { const ks = Object.keys(CELEBS); G.celebr.kind = ks[Math.floor(Math.random() * ks.length)]; }
    G.state = 'goal'; G.stateT = mine ? 3.8 : 2.8;
    if (mine) hint('COMEMORE! Toque os botões: CHUTE=joelhada · PASSE=aviãozinho · LANÇAR=mortal · FINTA=silêncio · GIRO=dança · TROCAR=agradece · SUPER=abraço · ou combine 2 (PASSE+CHUTE ❤️)'); G.nextKick = 1 - team;
    G.restartHold = true;
    G.pk = null;
    if (!mine) hint('');
    G.recGoalIdx = G.rec.length - 1; G.goalTop = goalTop; G.goalX = b.x;
    net(goalTop, b.x);
    if (!G.auto) { G.shake = 0.6; G.flash = 0.5; }
    banner(team === 0 ? 'GOOOOL!' : `Gol ${tA(st.sides[k].id, 'do')}`, 2.4);
    say(og ? `Gol contra! Conta para ${tA(st.sides[k].id)}.` : `GOOOOL! ${nameOf(scorer)} marca para ${tA(st.sides[k].id)}${assist ? `, com assistência de ${pidName(assist)}` : ''}!`, 3);
    goalPopup(og ? 'Gol contra' : nameOf(scorer), mn, st.sides[k].id, assist ? pidName(assist) : '', fromPk);
    if (G.orgs) for (const o of G.orgs) if (o.id === st.sides[k].id) o.cheer = 5;
    sfx('net', 1); sfx('roar', team === 0 ? 1 : 0.55);
    if (team === 0) confetti(k);
    updateHud(true);
  }
  // the keeper's dive in a penalty: eased sideways flight with a height arc, then he lies on the ground
  function penDive(p, dt) {
    const d = p.dive;
    d.t -= dt;
    const pr = clamp(1 - Math.max(0, d.t) / d.T, 0, 1), e = 1 - (1 - pr) * (1 - pr);
    p.x = d.x0 + (d.x1 - d.x0) * e;
    p.gz = d.hz * Math.sin(Math.PI * pr);
    p.vx = p.vy = p.wx = p.wy = 0;
    if (d.t <= 0) p.gz = 0;
  }
  // GOAL CELEBRATIONS: a button after the goal picks one; two buttons together (within half a second) make a combo
  const CELEBS = {
    slide: ['🧎', 'Joelhada'], plane: ['✈️', 'Aviãozinho'], flip: ['🤸', 'Mortal'], shush: ['🤫', 'Silêncio'], dance: ['💃', 'Dancinha'],
    sky: ['🙏', 'Agradece aos céus'], huddle: ['🤝', 'Abraço coletivo'],
    heart: ['❤️', 'Coração'], baby: ['👶', 'Embalando o bebê'], salute: ['🫡', 'Continência'], robot: ['🤖', 'Robô'], bow: ['🙇', 'Reverência'], conga: ['🎉', 'Trenzinho'],
    surf: ['🏄', 'Surfista'], archer: ['🏹', 'Arqueiro'], screw: ['🌀', 'Parafuso'], cry: ['😭', 'Chorão'], tornado: ['🌪️', 'Furacão'], zen: ['🧘', 'Meditação'],
    wave: ['🌊', 'Ola'], rocket: ['🚀', 'Foguete'], fire: ['🔥', 'Fogueira'], moon: ['🕺', 'Moonwalk'], drum: ['🥁', 'Bateria'], king: ['👑', 'Rei do pedaço'],
  };
  // repeated presses of the same button (within 0.6s of each other) and longer button sequences
  const CEL_REPEAT = { 'shoot*3': 'surf', 'pass*3': 'archer', 'lob*3': 'screw', 'feint*3': 'cry', 'spin*3': 'tornado', 'swap*3': 'zen', 'super*3': 'wave', 'shoot*4': 'rocket', 'super*4': 'fire' };
  const CEL_SEQ = { 'spin>feint>spin>feint': 'moon', 'shoot>pass>shoot>pass': 'drum', 'shoot>pass>lob': 'king' };
  const CEL_SINGLE = { shoot: 'slide', pass: 'plane', lob: 'flip', feint: 'shush', spin: 'dance', swap: 'sky', super: 'huddle' };
  const CEL_COMBO = { 'pass+shoot': 'heart', 'lob+shoot': 'baby', 'lob+pass': 'salute', 'feint+spin': 'robot', 'pass+swap': 'bow', 'spin+super': 'conga', 'shoot+super': 'huddle' };
  const CEL_GROUP = { huddle: 1.3, wave: 3.4, fire: 1.1, drum: 2.0, king: 2.6, zen: 1.8, heart: 2.4, baby: 2.0, salute: 2.4, robot: 2.2, bow: 2.2, conga: 3.2 };
  function celebInput(k) {
    const c = G.celebr;
    if (!c || c.scorer.team !== 0 || !CEL_SINGLE[k]) return false;
    let kind = CEL_SINGLE[k];
    if (c.lastK && c.lastK !== k && G.time - c.lastT < 0.5) kind = CEL_COMBO[[c.lastK, k].sort().join('+')] || kind;
    if (!c.seq || G.time - c.lastT > 0.6) c.seq = [];
    c.seq.push(k);
    const sq = c.seq.join('>');
    let n = 0; for (let i = c.seq.length - 1; i >= 0 && c.seq[i] === k; i--) n++;
    for (const key in CEL_SEQ) if (sq.endsWith(key)) kind = CEL_SEQ[key];
    if (CEL_REPEAT[k + '*' + n]) kind = CEL_REPEAT[k + '*' + n];
    c.lastK = k; c.lastT = G.time; c.kind = kind; c.t0 = G.time;
    banner(`${CELEBS[kind][0]} ${CELEBS[kind][1]}!`, 1.4);
    G.stateT = Math.max(G.stateT, 2.4); hint('');
    return true;
  }
  function idle(dt) {
    const sc = G.celebr, pk = G.pk, b = G.ball;
    for (const p of G.players) {
      if (p.out) continue;
      if (G.state === 'goal' && sc && p === sc.scorer) {
        const kd = sc.kind;
        if (kd === 'plane') moveTo(p, sc.cx + Math.sin((G.time - sc.t0) * 2.2) * 9, sc.cy + 5 + Math.cos((G.time - sc.t0) * 2.2) * 3, 1.2);
        else if (kd === 'slide') moveTo(p, sc.cx, sc.cy + (sc.cy < PL / 2 ? 9 : -9), 1.45);
        else if (kd === 'surf') moveTo(p, sc.cx + Math.sin((G.time - sc.t0) * 2.5) * 12, sc.cy + (sc.cy < PL / 2 ? 5 : -5), 1.5);
        else if (kd === 'rocket') moveTo(p, sc.cx, sc.cy + (sc.cy < PL / 2 ? 14 : -14), 1.7);
        else if (kd === 'tornado' || kd === 'screw') moveTo(p, sc.cx + Math.cos((G.time - sc.t0) * 6) * 3, sc.cy + Math.sin((G.time - sc.t0) * 6) * 3, 1.3);
        else if (kd === 'moon') moveTo(p, sc.cx - Math.sin((G.time - sc.t0) * 1.2) * 8, sc.cy, 0.45);
        else if (kd === 'archer' || kd === 'cry') moveTo(p, sc.cx + (sc.cx < PW / 2 ? 4 : -4), sc.cy, 0.6);
        else if (kd === 'conga') moveTo(p, PW / 2 + Math.sin((G.time - sc.t0) * 1.6) * 14, PL / 2 + (sc.cy < PL / 2 ? -8 : 8), 1);
        else if (CEL_GROUP[kd]) moveTo(p, sc.cx + (sc.cx < PW / 2 ? 6 : -6), sc.cy + (sc.cy < PL / 2 ? 6 : -6), 1);
        else moveTo(p, sc.cx, sc.cy, 1);
      }
      else if (G.state === 'goal' && sc && p.team === sc.scorer.team && !p.gk) { const gp = CEL_GROUP[sc.kind] || 5; moveTo(p, sc.scorer.x + (p.fx - 0.5) * gp, sc.scorer.y + (p.team === 0 ? gp / 2 : -gp / 2), 0.95); }
      else if (pk && p === pk.gk && p.dive && p.dive.t > 0) { penDive(p, dt); }
      else if (pk && p === pk.gk && pk.phase !== 'flight' && !p.dive) { p.gz = 0; moveTo(p, PW / 2 + Math.sin(G.time * 3.2) * 0.8, p.y, 0.4); }
      else if (pk && p === pk.taker && pk.run) moveTo(p, b.x - 0.15, b.y - pk.fwd * 0.55, 0.55);
      else if (p.dv) { stepDive(p, dt); continue; }
      else { p.wx = 0; p.wy = 0; if (pk && p === pk.gk) p.gz = 0; }
      if (p.fall > 0) p.fall -= dt;
      if (p.diveT > 0) p.diveT -= dt;
      if (p.kickT > 0) p.kickT -= dt;
      integrate(p, dt);
      if (pk && p === pk.taker && pk.run) { p.dx = 0; p.dy = pk.fwd; }
    }
    if (!b.owner) {
      if (G.state === 'penalty' && pk && pk.phase === 'flight' && !pk.dead) ballStep(dt);
      else {
        b.x += b.vx * dt; b.y += b.vy * dt;
        const f = Math.exp(-2.5 * dt); b.vx *= f; b.vy *= f;
        if (b.z > 0 || b.vz > 0) { b.vz -= 9.8 * dt; b.z = Math.max(0, b.z + b.vz * dt); if (b.z === 0) b.vz = 0; }
        if (b.inGoal) { b.y = clamp(b.y, -1.8, PL + 1.8); b.x = clamp(b.x, PW / 2 - GOAL_W / 2 + 0.25, PW / 2 + GOAL_W / 2 - 0.25); b.z = Math.min(b.z, GOAL_H - 0.3); }
      }
    }
    camera(dt);
  }
  function camera(dt) {
    const b = G.ball;
    let tx = b.x, ty = b.y;
    if (G.state === 'goal' && G.celebr) { tx = G.celebr.scorer.x; ty = G.celebr.scorer.y; }
    else if (G.restartHold && G.setKind === 'corner' && G.restartSpot) { // frame the box, not the corner flag
      const s = G.restartSpot, gl = s.y < PL / 2 ? 0 : PL;
      tx = s.x + (PW / 2 - s.x) * 0.62; ty = gl + (gl === 0 ? 1 : -1) * 8;
    } else if (G.cornerPlay && !b.owner) { tx = (b.x + G.cornerPlay.x) / 2; ty = (b.y + G.cornerPlay.y) / 2; }
    else if (G.pk || G.shootout) { tx = PW / 2; const up = G.pk ? G.pk.up : true; ty = up ? (G.landscape ? 12 : 7) : (G.landscape ? PL - 12 : PL + 2.5); }
    else if (b.owner) ty += b.owner.team === 0 ? -5 : 4;
    else { tx += b.vx * 0.15; ty += b.vy * 0.25; }
    const k = 1 - Math.exp(-3.2 * dt);
    G.cam.x += (tx - G.cam.x) * k;
    G.cam.y += (ty - G.cam.y) * k;
  }
  // zoeira: flying saucer abduction
  function startUfo() {
    const cand = G.players.filter((p) => !p.out && !p.gk && G.ball.owner !== p);
    if (!cand.length) { G.ufo.done = true; return; }
    const vic = cand[Math.floor(Math.random() * cand.length)];
    Object.assign(G.ufo, { done: true, vic, t: 0, taken: false });
    G.state = 'ufo';
    G.ball.owner = null; G.ball.vx = 0; G.ball.vy = 0;
    banner('👽 DISCO VOADOR!', 2.6);
    say('Inacreditável! Um disco voador sobre o gramado!', 3);
  }
  function ufoStep(dt) {
    const u = G.ufo;
    u.t += dt;
    for (const p of G.players) if (!p.out) { p.wx = 0; p.wy = 0; integrate(p, dt); }
    camera(dt);
    if (u.t > 1.6 && !u.taken) {
      u.taken = true;
      const v = u.vic, st = G.st, mn = minuteInt();
      st.alien = v.pid;
      evAdd(st, { min: mn, t: 'alien', s: v.side, p: v.pid, txt: `👽 ALIENÍGENAS INVADEM O GRAMADO! Um disco voador abduz ${pidName(v.pid)}!` });
      removeFromPitch(st, v.side, v.pid, mn);
      spriteOut(v);
      say(`${nameOf(v)} foi abduzido!`, 3);
    }
    if (u.t > 3.4) { const b = G.ball; setPiece(b.lastTeam, b.x, b.y, 'free'); }
  }

  // ------------------------------------------------------------------ instant replay of goals
  const REC_N = 240; // 8 s at 30 frames per second
  const REC_DT = 1 / 30;
  function record(dt) {
    G.recAcc += dt;
    if (G.recAcc < REC_DT) return;
    G.recAcc %= REC_DT;
    const ps = G.players, b = G.ball;
    const f = new Float32Array(4 + ps.length * 8);
    f[0] = b.x; f[1] = b.y; f[2] = b.z; f[3] = b.spin;
    ps.forEach((p, i) => {
      const o = 4 + i * 8;
      f[o + 7] = p.gz || 0;
      f[o] = p.x; f[o + 1] = p.y; f[o + 2] = p.dx; f[o + 3] = p.dy; f[o + 4] = p.anim;
      f[o + 5] = (p.slide > 0 ? 1 : 0) + (p.fall > 0 ? 2 : 0) + (p.out ? 4 : 0) + (p.kickT > 0 ? 8 : 0) + (p.diveT > 0 ? 16 : 0);
      f[o + 6] = Math.hypot(p.vx, p.vy);
    });
    G.rec.push(f);
    if (G.rec.length > REC_N) { G.rec.shift(); if (G.recGoalIdx >= 0) G.recGoalIdx--; }
  }
  // saving replays: the replay is recorded from the canvas while it plays and can be saved as a video file
  function recMime() {
    if (typeof MediaRecorder === 'undefined') return null;
    for (const m of ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) { /* ignore */ } }
    return null;
  }
  function recStart() {
    G.vrec = null;
    if (G.auto || !cv || !cv.captureStream) return;
    const mime = recMime();
    if (!mime) return;
    try {
      const stream = cv.captureStream(30), chunks = [];
      const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3500000 });
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const sc = G.celebr && G.celebr.scorer;
      const title = sc ? `${nameOf(sc)} ${G.st.score[0]}x${G.st.score[1]}` : 'gol';
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: mime.split(';')[0] });
        if (blob.size < 2000 || !G) return;
        G.saved = G.saved || [];
        G.saved.unshift({ title, blob, ext: mime.startsWith('video/mp4') ? 'mp4' : 'webm', clock: clockLabel() });
        if (G.saved.length > 8) G.saved.length = 8;
        showSaveBtn();
      };
      mr.start(250);
      G.vrec = mr;
    } catch (e) { G.vrec = null; }
  }
  function recStop() { const mr = G && G.vrec; G.vrec = null; if (mr && mr.state !== 'inactive') { try { mr.stop(); } catch (e) { /* ignore */ } } }
  function showSaveBtn() {
    const b = root && root.querySelector('#g2-savebtn');
    if (!b) return;
    b.hidden = false;
    clearTimeout(G.saveTimer);
    G.saveTimer = setTimeout(() => { b.hidden = true; }, 14000);
  }
  async function saveReplay(i) {
    const r = G && G.saved && G.saved[i];
    if (!r) return;
    const name = `replay-gol-${String(r.title).replace(/[^\w\-]+/g, '-').replace(/^-+|-+$/g, '')}.${r.ext}`;
    try {
      const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
      if (dl) { await dl.save({ filename: name, data: r.blob }); toast('Replay salvo.'); return; }
    } catch (e) { if (e && e.code === 'declined') return; }
    try {
      const url = URL.createObjectURL(r.blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast('Replay baixado.');
    } catch (e) { toast('Não foi possível salvar o replay neste navegador.', true); }
  }
  function startReplay() {
    recStart();
    const start = Math.max(0, G.recGoalIdx - 105);
    G.replay = { i: start, t: 0, end: G.rec.length - 1, netDone: false };
    G.state = 'replay';
    G.net = null;
    showReplayTag(true);
  }
  function replayStep(dt) {
    const r = G.replay;
    r.t += dt * 30 * 0.65;
    const i = Math.min(r.end, r.i + Math.floor(r.t));
    const f = G.rec[i];
    if (f) applyFrame(f);
    if (!r.netDone && i >= G.recGoalIdx) { r.netDone = true; net(G.goalTop, G.goalX); sfx('net', 0.7); sfx('roar', 0.4); }
    stepFx(0);
    camera(dt);
    if (i >= r.end) endReplay();
  }
  function applyFrame(f) {
    const b = G.ball;
    b.owner = null; b.x = f[0]; b.y = f[1]; b.z = f[2]; b.spin = f[3]; b.vx = b.vy = 0;
    G.players.forEach((p, i) => {
      const o = 4 + i * 8;
      if (o + 7 >= f.length) return;
      p.rGz = f[o + 7];
      p.x = f[o]; p.y = f[o + 1]; p.dx = f[o + 2]; p.dy = f[o + 3]; p.anim = f[o + 4];
      const fl = f[o + 5];
      p.rSlide = fl & 1; p.rFall = fl & 2; p.rOut = fl & 4; p.rKick = fl & 8; p.rDive = fl & 16;
      const sp = f[o + 6];
      p.vx = p.dx * sp; p.vy = p.dy * sp;
    });
  }
  function endReplay() {
    if (!G.replay) return;
    G.replay = null;
    recStop();
    G.players.forEach((p) => { p.rSlide = p.rFall = p.rOut = p.rKick = p.rDive = 0; p.rGz = 0; });
    showReplayTag(false);
    resetKickoff(G.nextKick);
  }

  // ------------------------------------------------------------------ sound (generated with Web Audio, no files)
  const SFX = { ctx: null, master: null, crowd: null, crowdGain: null, on: false, noise: null };
  function sfxInit(enabled) {
    SFX.on = !!enabled;
    if (!enabled || SFX.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = new AC();
      SFX.ctx = c;
      SFX.master = c.createGain(); SFX.master.gain.value = 0.55; SFX.master.connect(c.destination);
      const len = c.sampleRate * 2;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.5; }
      SFX.noise = buf;
      // crowd: brown noise through a band-pass; its level follows the danger on the pitch
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.6;
      SFX.crowdGain = c.createGain(); SFX.crowdGain.gain.value = 0.08;
      src.connect(bp); bp.connect(SFX.crowdGain); SFX.crowdGain.connect(SFX.master);
      // a second "vowel" band makes the murmur sound like many voices
      const bp2 = c.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 1500; bp2.Q.value = 1.2;
      const g2 = c.createGain(); g2.gain.value = 0.55;
      src.connect(bp2); bp2.connect(g2); g2.connect(SFX.crowdGain);
      src.start();
      SFX.crowd = src;
      if (c.state === 'suspended') c.resume().catch(() => {});
    } catch (e) { SFX.ctx = null; }
  }
  function sfxSetOn(on) {
    SFX.on = on;
    if (on && !SFX.ctx) sfxInit(true);
    if (SFX.master && SFX.ctx) SFX.master.gain.setTargetAtTime(on ? 0.55 : 0, SFX.ctx.currentTime, 0.05);
  }
  function sfx(kind, vol = 1) {
    if (!G || G.auto || !SFX.on || !SFX.ctx) return;
    const c = SFX.ctx, t = c.currentTime;
    try {
      if (kind === 'kick') {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.09);
        g.gain.setValueAtTime(0.5 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(g); g.connect(SFX.master); o.start(t); o.stop(t + 0.13);
      } else if (kind === 'whistle') {
        const dur = 0.25 + vol * 0.55;
        [2850, 3120].forEach((fq) => {
          const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
          o.type = 'triangle'; o.frequency.value = fq; lfo.frequency.value = 28; lg.gain.value = 60;
          lfo.connect(lg); lg.connect(o.frequency);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.02); g.gain.setValueAtTime(0.06, t + dur - 0.05); g.gain.linearRampToValueAtTime(0, t + dur);
          o.connect(g); g.connect(SFX.master); o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
        });
      } else if (kind === 'roar' || kind === 'groan' || kind === 'net' || kind === 'save') {
        const src = c.createBufferSource(); src.buffer = SFX.noise;
        const f = c.createBiquadFilter(), g = c.createGain();
        const dur = kind === 'roar' ? 3.2 : kind === 'groan' ? 1.4 : kind === 'save' ? 1.2 : 0.35;
        f.type = kind === 'net' ? 'highpass' : 'bandpass';
        f.frequency.setValueAtTime(kind === 'net' ? 2500 : kind === 'groan' ? 380 : 800, t);
        if (kind === 'roar') f.frequency.linearRampToValueAtTime(1100, t + 0.6);
        if (kind === 'groan') f.frequency.linearRampToValueAtTime(220, t + dur);
        f.Q.value = 0.7;
        const peak = (kind === 'roar' ? 0.9 : kind === 'net' ? 0.5 : 0.45) * vol;
        g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.002, peak), t + (kind === 'net' ? 0.01 : 0.18)); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f); f.connect(g); g.connect(SFX.master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
      } else if (kind === 'ooh') { // the stand gasps / shouts when a shot is on its way
        const o = c.createBufferSource(); o.buffer = SFX.noise;
        const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain();
        f1.type = 'bandpass'; f1.Q.value = 3; f2.type = 'bandpass'; f2.Q.value = 3;
        f1.frequency.setValueAtTime(420, t); f1.frequency.linearRampToValueAtTime(620, t + 0.8);
        f2.frequency.setValueAtTime(800, t); f2.frequency.linearRampToValueAtTime(1100, t + 0.8);
        g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.003, 0.55 * vol), t + 0.25); g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(SFX.master); o.start(t, Math.random()); o.stop(t + 1.15);
      } else if (kind === 'chant') { // "olê olê olê": a mass of sung voices on a simple rhythm, with drums
        const base = 150 + Math.random() * 50, steps = [0, 0, 0, null, 2, 2, 2, null, 4, 4, 2, 0], dt0 = 0.27;
        const amp = 0.05 * vol;
        steps.forEach((semi, i) => {
          if (semi === null) return;
          const tt = t + i * dt0, dur = dt0 * 0.85, f0 = base * Math.pow(2, semi / 12);
          const g = c.createGain(), fa = c.createBiquadFilter(), fb = c.createBiquadFilter();
          fa.type = 'bandpass'; fa.frequency.value = 700; fa.Q.value = 4; fb.type = 'bandpass'; fb.frequency.value = 1250; fb.Q.value = 5;
          g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(amp, tt + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
          for (let v = 0; v < 6; v++) {
            const o = c.createOscillator(); o.type = 'sawtooth';
            o.frequency.setValueAtTime(f0 * (1 + (Math.random() - 0.5) * 0.04) * (v % 3 === 2 ? 2 : 1), tt);
            o.connect(fa); o.connect(fb); o.start(tt); o.stop(tt + dur + 0.03);
          }
          fa.connect(g); fb.connect(g); g.connect(SFX.master);
          if (i % 2 === 0 && G.orgs && G.orgs.length) { // the organised groups bring a bass drum
            const d = c.createOscillator(), dg = c.createGain();
            d.type = 'sine'; d.frequency.setValueAtTime(110, tt); d.frequency.exponentialRampToValueAtTime(48, tt + 0.14);
            dg.gain.setValueAtTime(0.2 * vol, tt); dg.gain.exponentialRampToValueAtTime(0.001, tt + 0.2);
            d.connect(dg); dg.connect(SFX.master); d.start(tt); d.stop(tt + 0.22);
          }
        });
      } else if (kind === 'post') {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(980, t); o.frequency.exponentialRampToValueAtTime(760, t + 0.5);
        g.gain.setValueAtTime(0.3 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.connect(g); g.connect(SFX.master); o.start(t); o.stop(t + 0.62);
      }
    } catch (e) { /* audio unavailable */ }
  }
  function crowdMood(dt) {
    G.moodT -= dt;
    if (G.moodT > 0 || !SFX.crowdGain || !SFX.ctx) return;
    G.moodT = 0.25;
    const b = G.ball;
    const danger = Math.max(0, 1 - Math.min(b.y, PL - b.y) / 30);
    G.swell = clamp((G.swell || 0.5) + (Math.random() - 0.5) * 0.35, 0.15, 1); // the murmur breathes: swells and drops
    SFX.crowdGain.gain.setTargetAtTime((0.05 + danger * 0.1 + (G.orgs ? G.orgs.length * 0.025 : 0)) * (0.7 + G.swell * 0.7), SFX.ctx.currentTime, 0.3);
    G.chantT = (G.chantT == null ? 4 : G.chantT) - 0.25;
    if (G.chantT <= 0 && (G.state === 'play' || G.state === 'goal' ? G.state === 'play' : false)) {
      G.chantT = 9 + Math.random() * 12;
      sfx('chant', clamp(0.7 + danger * 0.6 + (G.fanSup || 0) * 0.3, 0.4, 1.4));
    }
  }
  function sfxClose() { try { if (SFX.crowd) SFX.crowd.stop(); if (SFX.ctx) SFX.ctx.close(); } catch (e) { /* ignore */ } Object.assign(SFX, { ctx: null, master: null, crowd: null, crowdGain: null, noise: null }); }

  // ------------------------------------------------------------------ narration ticker
  function say(txt, pri = 0) {
    if (!G || G.auto || !hud.say) return;
    if (pri < G.sayPri && G.time - G.sayT < 2.2) return;
    if (pri === 0 && G.time - G.sayT < 2.6) return;
    G.sayT = G.time; G.sayPri = pri;
    hud.say.textContent = txt;
    hud.say.classList.remove('show'); void hud.say.offsetWidth; hud.say.classList.add('show');
  }
  function hint(txt) { if (hud.hint) { hud.hint.textContent = txt; hud.hint.hidden = !txt; } }

  // ------------------------------------------------------------------ particles & effects
  function burst(x, y, n, color) { if (!G || G.auto) return; for (let i = 0; i < n; i++) G.fx.push({ kind: 'grass', x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, z: 0, vz: 1 + Math.random() * 2, life: 0.5 + Math.random() * 0.3, color }); }
  function confetti(k) {
    if (!G || G.auto) return;
    const kit = G.kits[k];
    const cols = [kit.shirt, kit.trim, '#ffd34d', '#ffffff'];
    for (let i = 0; i < 140; i++) G.fx.push({ kind: 'conf', sx: Math.random(), sy: -Math.random() * 0.3, vx: (Math.random() - 0.5) * 0.1, vy: 0.15 + Math.random() * 0.25, a: Math.random() * 6, va: (Math.random() - 0.5) * 8, life: 3 + Math.random() * 1.5, color: cols[i % cols.length] });
  }
  function net(top, x) { G.net = { top, x, t: 1 }; }
  function stepFx(dt) {
    if (G.net) { G.net.t -= (dt || 1 / 60) * 1.2; if (G.net.t <= 0) G.net = null; }
    if (!G.fx.length || !dt) return;
    for (const f of G.fx) {
      f.life -= dt;
      if (f.kind === 'grass') { f.x += f.vx * dt; f.y += f.vy * dt; f.vz -= 9.8 * dt; f.z = Math.max(0, f.z + f.vz * dt); }
      else { f.sx += f.vx * dt; f.sy += f.vy * dt; f.a += f.va * dt; }
    }
    G.fx = G.fx.filter((f) => f.life > 0);
  }

  // ------------------------------------------------------------------ DOM, HUD, overlays, input & loop
  function start(m, st, opts, done) {
    onDone = done;
    create(m, st, opts);
    buildDom();
    sfxInit(opts.sound);
    showIntro();
    G.last = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  // only the shoot-out (minute-by-minute / quick-sim matches that end level): the user takes and saves the kicks
  function startShootoutOnly(m, st, opts, done) {
    onDone = done;
    const nEv = st.ev.length, half = st.half;
    create(m, st, opts);
    st.ev.length = nEv; st.half = half;
    buildDom();
    sfxInit(opts.sound);
    G.last = performance.now();
    rafId = requestAnimationFrame(loop);
    startShootout();
  }
  // online shoot-out: messages from the opponent's screen (the dive he chose, the kick he took, the start of his run-up)
  function netRecv(m) {
    if (!G || !G.online || !m) return;
    const on = G.online;
    if (m.t === 'd') on.dive = { n: m.n, side: m.side };
    else if (m.t === 'k') on.kick = m;
    else if (m.t === 'r' && G.pk && G.pk.phase === 'dive') G.pk.run = true;
  }
  function setMsg(t) { if (hud.msg && root) hud.msg.textContent = t; }
  function banner(t, secs = 1.4) { if (!G) return; G.msg = t; G.msgT = secs; setMsg(t); }
  function teamBox(id, k) {
    const kit = G.kits[k];
    return `<span class="sb-team" style="--c:${kit.shirt};--t:${textOn(kit.shirt)}">${crest(id, 22)}<b>${esc(teamShort(id))}</b></span>`;
  }
  function buildDom() {
    root = document.createElement('div');
    hud.skp = undefined; hud.lastStars = 0;
    root.className = 'g2d' + (G.solo ? ' solo' : '');
    applyBtnSize(root);
    const m = G.m;
    root.innerHTML = `<canvas class="g2-main" aria-label="Partida jogável"></canvas>
      <div class="g2d-hud">
        <div class="sb">${teamBox(m.h, 0)}<span class="sb-score"><b id="g2-h">0</b><i>x</i><b id="g2-a">0</b></span>${teamBox(m.a, 1)}<span class="sb-clock" id="g2-clock">0'</span></div>
        <div class="row" style="gap:8px"><button class="pill" id="g2-snd" aria-label="Som">${G2PREF.sound === false ? '🔇' : '🔊'}</button><button class="pill" id="g2-pause" aria-label="Pausar">❚❚</button></div>
      </div>
      <canvas class="g2-radar" aria-hidden="true"></canvas>
      <div class="g2-say" id="g2-say" aria-live="polite"></div>
      <div class="g2-so" id="g2-so" hidden></div>
      <div class="g2d-msg" id="g2-msg"></div>
      <div class="g2-pop" id="g2-pop" hidden></div>
      <div class="g2-hint" id="g2-hint" hidden></div>
      <div class="g2-tag" id="g2-tag" hidden>REPLAY</div>
      <button class="pill g2-savebtn" id="g2-savebtn" hidden>💾 Salvar replay do gol</button>
      <div class="g2d-controls"><div class="joy" id="g2-joy" data-k="joy"><i></i></div>
        <div class="skpads"><button class="pad sk run" data-k="sprint">CORRER</button><button class="pad sk" data-k="spin">GIRO</button><button class="pad sk" data-k="feint">FINTA</button></div>
        <div class="pads"><button class="pad call" data-k="call">PEDIR</button><button class="pad super" data-k="super">SUPER</button><button class="pad swap" data-k="swap">TROCAR<small>↓ goleiro sai</small></button><button class="pad" data-k="lob">LANÇAR</button><button class="pad pass" data-k="pass">PASSE<small>↑ enfiada</small></button><button class="pad shoot" data-k="shoot">CHUTE<small>↑ colocado · ↓ cavadinha</small></button></div></div>
      <div class="g2-laybar" id="g2-laybar" hidden><div class="t">Arraste os botões para onde quiser · toque num botão e use − / + para o tamanho</div><div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn sm" data-l="minus">−</button><button class="btn sm" data-l="plus">+</button><button class="btn sm" data-l="reset">Padrão</button><button class="btn sm gold" data-l="done">Pronto</button></div></div>
      <div class="g2d-pause" id="g2-pausebox" hidden></div>`;
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';
    cv = root.querySelector('canvas.g2-main');
    ctx = cv.getContext('2d');
    radar = root.querySelector('canvas.g2-radar');
    rctx = radar.getContext('2d');
    Object.assign(hud, {
      clock: root.querySelector('#g2-clock'), h: root.querySelector('#g2-h'), a: root.querySelector('#g2-a'), msg: root.querySelector('#g2-msg'),
      pause: root.querySelector('#g2-pausebox'), say: root.querySelector('#g2-say'), hint: root.querySelector('#g2-hint'), tag: root.querySelector('#g2-tag'),
      pop: root.querySelector('#g2-pop'), so: root.querySelector('#g2-so'), snd: root.querySelector('#g2-snd'), lastClock: '', lastScore: '', breakKind: null, intro: null,
    });
    root.querySelector('#g2-savebtn').addEventListener('click', () => { saveReplay(0); root.querySelector('#g2-savebtn').hidden = true; });
    resize();
    addEventListener('resize', resize);
    addEventListener('keydown', onKey);
    addEventListener('keyup', onKey);
    addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVis);
    root.querySelector('#g2-pause').addEventListener('click', () => togglePause());
    hud.snd.addEventListener('click', () => { G2PREF.sound = G2PREF.sound === false; saveG2Pref(); sfxSetOn(G2PREF.sound); hud.snd.textContent = G2PREF.sound ? '🔊' : '🔇'; });
    cv.addEventListener('pointerdown', () => { if (!G) return; if (G.state === 'replay') endReplay(); else if (G.state === 'intro') G.stateT = Math.min(G.stateT, 0.05); });
    const joy = root.querySelector('#g2-joy'), knob = joy.querySelector('i');
    let jid = null, jc = null;
    const moveJoy = (e) => {
      let dx = e.clientX - jc.x, dy = e.clientY - jc.y;
      const d = Math.hypot(dx, dy), max = jc.r * 0.8;
      if (d > max) { dx *= max / d; dy *= max / d; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      const ix = dx / max, iy = dy / max;
      if (Math.hypot(ix, iy) < 0.2) { G.input.jx = 0; G.input.jy = 0; } else { G.input.jx = ix; G.input.jy = iy; }
    };
    joy.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!G) return; jid = e.pointerId; try { joy.setPointerCapture(jid); } catch (_) { /* not capturable */ } const r = joy.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; moveJoy(e); });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid && G) moveJoy(e); });
    const endJoy = (e) => { if (e.pointerId !== jid || !G) return; jid = null; G.input.jx = 0; G.input.jy = 0; knob.style.transform = ''; };
    joy.addEventListener('pointerup', endJoy);
    joy.addEventListener('pointercancel', endJoy);
    root.querySelectorAll('.pad').forEach((btn) => {
      const k = btn.dataset.k;
      let y0 = 0, drag = 0;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault(); btn.classList.add('on'); y0 = e.clientY; drag = 0;
        try { btn.setPointerCapture(e.pointerId); } catch (_) { /* not capturable */ }
        if (k !== 'swap' && k !== 'pass') press(k, true);
      });
      btn.addEventListener('pointermove', (e) => {
        if (!G || !btn.classList.contains('on')) return;
        const dy = e.clientY - y0;
        if (k === 'shoot') {
          const on = dy < -26, ch = dy > 26;
          if (on !== !!G.input.plc) { G.input.plc = on; btn.classList.toggle('plc', on); }
          if (ch !== !!G.input.chipf) { G.input.chipf = ch; btn.classList.toggle('plc', ch); }
        } else if (k === 'pass') { drag = dy < -26 ? 1 : 0; btn.classList.toggle('plc', !!drag); }
        else if (k === 'swap') { drag = dy > 26 ? 1 : 0; btn.classList.toggle('plc', !!drag); }
      });
      const up = () => {
        if (!btn.classList.contains('on')) return; btn.classList.remove('on'); btn.classList.remove('plc');
        if (k === 'swap') { if (drag) startGkRush(); else press('swap', true); drag = 0; return; }
        if (k === 'pass') { press(drag ? 'lob' : 'pass', true); drag = 0; return; }
        press(k, false);
      };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }
  function showIntro() {
    const m = G.m, w = G.weather, c = S.comps[m.c];
    const rd = c && c.rounds && c.rounds[m.r];
    const host = S.teams[m.h];
    const box = document.createElement('div');
    box.className = 'g2-intro';
    box.innerHTML = `<div class="card"><div class="g2-intro-comp">${esc(c ? c.name : '')}${rd ? ` · ${esc(rd.name)}` : ''}</div>
      <div class="row" style="justify-content:center;gap:18px;margin:14px 0 10px">${crest(m.h, 66)}<span class="disp" style="font-size:30px;font-weight:800;opacity:0.7">x</span>${crest(m.a, 66)}</div>
      <div class="disp" style="font-size:clamp(22px,5vw,30px);font-weight:800;line-height:1.1">${esc(teamName(m.h))} x ${esc(teamName(m.a))}</div>
      <div class="muted" style="margin-top:8px">🏟 ${esc(m.n ? 'Campo neutro' : stadiumName(host) || 'Estádio ' + tA(host, 'do'))} · ${w.icon} ${esc(w.label)}, ${w.temp}°C</div>
      <div class="muted" style="margin-top:4px;font-size:13px">Dificuldade ${esc((G2_DIFFS.find(([k]) => k === G.diff) || ['', 'Normal'])[1])} · toque para começar</div></div>`;
    root.appendChild(box);
    hud.intro = box;
    box.addEventListener('pointerdown', () => { if (G && G.state === 'intro') G.stateT = 0; });
  }
  function hideIntro() { if (hud.intro) { const el = hud.intro; el.classList.add('out'); setTimeout(() => el.remove(), 450); hud.intro = null; } }
  function goalPopup(name, mn, teamId, assist, pen) {
    if (!hud.pop) return;
    hud.pop.innerHTML = `${crest(teamId, 28)}<div><b>⚽ ${esc(name)} ${mn}'${pen ? ' (pên.)' : ''}</b>${assist ? `<div class="muted">assistência: ${esc(assist)}</div>` : ''}</div>`;
    hud.pop.hidden = false;
    hud.pop.classList.remove('show'); void hud.pop.offsetWidth; hud.pop.classList.add('show');
    clearTimeout(hud.popT);
    hud.popT = setTimeout(() => { if (hud.pop) hud.pop.hidden = true; }, 4200);
  }
  function showReplayTag(on) { if (hud.tag) hud.tag.hidden = !on; if (root) root.classList.toggle('replaying', on); }
  function showShootoutHud() {
    if (!hud.so || !G.shootout) return;
    const so = G.shootout;
    const row = (team) => {
      const ks = so.kicks[team];
      const cells = [];
      for (let i = 0; i < Math.max(5, ks.length); i++) cells.push(`<i class="${i < ks.length ? (ks[i] ? 'ok' : 'no') : ''}"></i>`);
      const id = teamIdOf(team);
      return `<div class="so-row">${crest(id, 20)}<b class="so-t">${esc(teamShort(id))}</b><span class="so-k">${cells.join('')}</span><b class="so-n">${ks.filter(Boolean).length}</b></div>`;
    };
    hud.so.innerHTML = row(0) + row(1);
    hud.so.hidden = false;
  }
  function statsHtml() {
    const st = G.st, s = st.stats;
    const tot = G.possT[0] + G.possT[1];
    const possU = tot > 5 ? Math.round(G.possT[0] / tot * 100) : 50;
    const poss = G.userSide === 0 ? [possU, 100 - possU] : [100 - possU, possU];
    const rows = [['Posse (%)', poss], ['Finalizações', s.sh], ['No gol', s.sot], ['Escanteios', s.cor], ['Faltas', s.fo], ['Amarelos', s.yc], ['Vermelhos', s.rc]];
    const goals = (k) => st.ev.filter((e) => e.t === 'goal' && e.s === k).map((e) => `${e.p ? esc(pidName(e.p)) : 'Gol contra'} ${minuteLabel(st, e)}`).join(', ');
    return `<div class="row" style="justify-content:center;gap:14px;margin:6px 0 4px">${crest(G.m.h, 40)}<span class="disp" style="font-size:44px;font-weight:800">${st.score[0]} x ${st.score[1]}</span>${crest(G.m.a, 40)}</div>
      <div class="g2-goals"><span>⚽ ${goals(0) || '—'}</span><span>⚽ ${goals(1) || '—'}</span></div>
      <div class="g2-stats">${rows.map(([l, v]) => { const t = (v[0] + v[1]) || 1; return `<div class="r"><b>${v[0]}</b><span>${l}<i><u style="width:${(v[0] / t) * 100}%"></u></i></span><b>${v[1]}</b></div>`; }).join('')}</div>`;
  }
  function showBreak(kind) {
    hint('');
    G.input.shootDown = false; G.input.hold = 0;
    const st = G.st;
    let title, btns, note = '';
    if (kind === 'half') { title = 'Intervalo'; btns = '<button class="btn" data-g="tac">🎯 Táticas</button><button class="btn" data-g="subs">⇄ Substituições</button><button class="btn" data-g="sim">⏩ Simular o 2º tempo</button><button class="btn primary big" data-g="second">▶ 2º tempo</button>'; }
    else if (kind === 'noet') {
      title = 'Fim de jogo';
      note = '<p class="muted" style="margin:10px 0 0">Empate no agregado e, no estadual, não tem prorrogação: a decisão vai direto para os pênaltis. Você bate e defende.</p>';
      btns = '<button class="btn" data-g="simpens">⏩ Simular pênaltis</button><button class="btn primary big" data-g="pens">🎯 Disputar pênaltis</button>';
    } else if (kind === 'et') {
      title = 'Fim da prorrogação';
      note = `<p class="muted" style="margin:10px 0 0">O empate no agregado persistiu e a prorrogação foi simulada${G.etGoals && G.etGoals[0] + G.etGoals[1] ? ` (${G.etGoals[0]} x ${G.etGoals[1]} nos 30 minutos)` : ', sem gols'}. A decisão vai para os pênaltis: você bate e defende.</p>`;
      btns = '<button class="btn" data-g="simpens">⏩ Simular pênaltis</button><button class="btn primary big" data-g="pens">🎯 Disputar pênaltis</button>';
    } else if (kind === 'etwin') {
      title = 'Fim da prorrogação';
      note = `<p class="muted" style="margin:10px 0 0">O empate no agregado persistiu e a prorrogação foi simulada: ${G.etGoals ? `${G.etGoals[0]} x ${G.etGoals[1]} nos 30 minutos` : ''}.</p>`;
      btns = '<button class="btn primary big" data-g="finish">Ver resultado</button>';
    } else { title = 'Fim de jogo'; btns = '<button class="btn primary big" data-g="finish">Ver resultado</button>'; }
    hud.pause.innerHTML = `<div class="card"><h2>${title}</h2>${statsHtml()}${note}<div class="row" style="justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap">${btns}</div></div>`;
    hud.pause.hidden = false;
    hud.breakKind = kind;
    hud.pause.onclick = (e) => {
      const t = e.target.closest('button');
      if (!t || !G) return;
      const g = t.dataset.g;
      if (g === 'second') startSecondHalf();
      else if (g === 'tac') { G.tacView = true; renderPause(false, true); }
      else if (g === 'subs') { G.subOut = null; renderPause(true, true); }
      else if (g === 'sim') { hideBreak(); simulateRest(); }
      else if (g === 'finish') endGame(false);
      else if (g === 'pens') { hideBreak(); startShootout(); }
      else if (g === 'simpens') { hideBreak(); initShootout(); while (!G.shootout.done) simShootoutKick(); endGame(true); }
    };
  }
  function hideBreak() { if (hud.pause) { hud.pause.hidden = true; hud.pause.innerHTML = ''; } hud.breakKind = null; }
  function resize() {
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (root) g2ApplyLayout(root);
    cv.width = Math.max(1, Math.round(cv.clientWidth * dpr));
    cv.height = Math.max(1, Math.round(cv.clientHeight * dpr));
    if (radar) {
      const land = cv.clientWidth > cv.clientHeight * 1.05;
      radar.style.width = (land ? 112 : 72) + 'px';
      radar.style.height = (land ? 72 : 112) + 'px';
      radar.width = Math.round((land ? 112 : 72) * dpr);
      radar.height = Math.round((land ? 72 : 112) * dpr);
    }
  }
  function press(k, down) {
    if (!G) return;
    const I = G.input;
    if (down && G.state === 'replay') { endReplay(); return; }
    if (down && G.state === 'intro') { G.stateT = 0; return; }
    if (G.state === 'goal' && G.celebr && G.celebr.scorer.team === 0 && k !== 'sprint') { if (down) celebInput(k); return; }
    if (k === 'sprint') I.sprint = down;
    else if (k === 'pass') { if (down) I.pass = true; }
    else if (k === 'lob') { if (down) I.lob = true; }
    else if (k === 'feint' || k === 'spin') { if (down) I.skill = k; }
    else if (k === 'swap') { if (down) I.swap = true; }
    else if (k === 'call') { if (down) callForBall(); }
    else if (k === 'super') {
      if (down) { if (superReady(G.ctrl, true)) { I.supDown = true; I.supHold = 0; } }
      else if (I.supDown) { I.supDown = false; I.supShot = true; }
    }
    else if (k === 'shoot') {
      if (down) { I.shootDown = true; I.hold = 0; }
      else if (I.shootDown) { I.shootDown = false; I.shoot = true; }
    }
  }
  function onKey(e) {
    if (!G) return;
    const down = e.type === 'keydown';
    const k = (e.key || '').toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(k)) e.preventDefault();
    if (down && (k === 'p' || k === 'escape')) { if (!e.repeat) togglePause(); return; }
    if (G.paused) return;
    if (down && e.repeat) return;
    if (down && (G.state === 'replay' || G.state === 'intro') && ['j', 'k', 'l', ' ', 'enter'].includes(k)) { press('pass', true); return; }
    if (down && G.state === 'goal' && G.celebr && G.celebr.scorer.team === 0) {
      const km = { j: 'pass', l: 'lob', i: 'feint', o: 'spin', q: 'swap', e: 'swap', k: 'shoot', ' ': 'shoot', u: 'super' };
      if (km[k]) { celebInput(km[k]); return; }
    }
    KEYS[k] = down;
    if (k === 'shift') G.input.sprint = down;
    if (k === 'j' && down) G.input.pass = true;
    if (k === 'l' && down) G.input.lob = true;
    if ((k === 'q' || k === 'e') && down) G.input.swap = true;
    if (k === 'v' && down) callForBall();
    if (k === 'g' && down) startGkRush();
    if (k === 'h') G.input.plc = down;
    if (k === 'b') G.input.chipf = down;
    if (k === 'i' && down) G.input.skill = 'feint';
    if (k === 'o' && down) G.input.skill = 'spin';
    if (k === 'k' || k === ' ') press('shoot', down);
    if (k === 'u') press('super', down);
  }
  function onBlur() {
    for (const k in KEYS) KEYS[k] = false;
    if (G) { G.input.sprint = false; G.input.shootDown = false; G.input.supDown = false; G.input.supHold = 0; G.input.hold = 0; G.input.jx = 0; G.input.jy = 0; }
  }
  function onVis() { if (document.hidden && G && !G.paused && !G.over) togglePause(); }
  function togglePause() {
    if (!G || G.over || hud.breakKind) return;
    G.paused = !G.paused;
    onBlur();
    if (G.paused) { renderPause(false); hud.pause.hidden = false; if (SFX.ctx) SFX.ctx.suspend().catch(() => {}); }
    else { hud.pause.hidden = true; if (SFX.ctx && SFX.on) SFX.ctx.resume().catch(() => {}); G.last = performance.now(); cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop); }
  }
  function renderPause(subMode, fromBreak) {
    const st = G.st, m = G.m;
    const k = G.userSide;
    let body;
    if (G.tacView) {
      const side = st.sides[k];
      body = `<h2>Táticas</h2><p class="muted" style="font-size:13px">As mudanças valem na hora. ${esc(side.form)} · ${esc(mentLabel(side.mentality || 0))} · ${esc(sideStyle(side).n)}</p>
        ${tacticPresets().length ? `<div class="muted up" style="font-size:11px;margin-top:8px">Táticas prontas</div><div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center;margin-top:4px">${tacticPresets().map((q) => `<button class="btn primary sm" data-tp="${q.id}">${esc(q.name)} <span style="opacity:.7">${esc(q.form)}</span></button>`).join('')}</div>` : ''}
        <div class="muted up" style="font-size:11px;margin-top:10px">Mentalidade</div><div class="seg wrapseg" style="justify-content:center;margin-top:4px">${MENTS.map(([v, l]) => `<button class="${(side.mentality || 0) === v ? 'on' : ''}" data-tm="${v}">${l}</button>`).join('')}</div>
        <div class="muted up" style="font-size:11px;margin-top:10px">Estilo de jogo</div><div class="seg wrapseg" style="justify-content:center;margin-top:4px">${STYLE_KEYS.map((q) => `<button class="${side.style === q || (!side.style && q === 'bal') ? 'on' : ''}" data-ts="${q}" title="${esc(STYLES[q].d)}">${STYLES[q].n}</button>`).join('')}</div>
        <div class="muted up" style="font-size:11px;margin-top:10px">Formação</div><div class="seg wrapseg" style="justify-content:center;margin-top:4px">${FORMATION_LIST.map((f) => `<button class="${side.form === f ? 'on' : ''}" data-tf="${f}">${f}</button>`).join('')}</div>
        <div class="row" style="justify-content:center;margin-top:14px"><button class="btn primary" data-g="back">Voltar</button></div>`;
    } else if (subMode) {
      const side = st.sides[k];
      const bench = side.bench.filter((b) => !side.on.includes(b) && !side.out.includes(b));
      body = `<h2>Substituições <span class="muted" style="font-size:16px">restam ${st.subsLeft[k]}</span></h2>
        <div class="grid g2" style="text-align:left;margin-top:10px"><div class="col" style="gap:4px"><div class="muted up" style="font-size:11px">Sai</div>${side.on.map((pid, i) => { const p = S.players[pid]; return p ? `<button class="bp ${G.subOut === i ? 'sel' : ''}" data-i="${i}">${posBadge(side.slotsOn[i])}<span class="grow">${esc(p.s || p.n)}</span>${ovrBadge(p.o)}${formTag(p)}</button>` : ''; }).join('')}</div>
        <div class="col" style="gap:4px"><div class="muted up" style="font-size:11px">Entra</div>${bench.map((pid) => { const p = S.players[pid]; return p ? `<button class="bp" data-in="${pid}">${posBadge(p.p)}<span class="grow">${esc(p.s || p.n)}</span>${ovrBadge(p.o)}${formTag(p)}</button>` : ''; }).join('') || '<div class="muted">Sem reservas.</div>'}</div></div>
        <div class="row" style="justify-content:center;margin-top:14px"><button class="btn primary" data-g="back">Voltar</button></div>`;
    } else {
      const inShootout = !!G.shootout;
      body = `<h2>Pausa</h2><p class="muted">${esc(teamName(m.h))} ${st.score[0]} x ${st.score[1]} ${esc(teamName(m.a))} · ${inShootout ? 'pênaltis' : clockLabel()}</p>
        ${G.saved && G.saved.length ? `<div class="col" style="gap:6px;margin-top:12px"><div class="muted up" style="font-size:11px">Replays desta partida</div>${G.saved.map((r, i) => `<button class="btn" data-rp="${i}">💾 Salvar replay: ${esc(r.title)} (${esc(r.clock)})</button>`).join('')}</div>` : ''}
        <div class="col" style="gap:10px;margin-top:14px"><button class="btn primary big" data-g="resume">▶ Continuar</button>${inShootout || G.solo ? '' : `<button class="btn" data-g="tac">🎯 Táticas</button><button class="btn" data-g="subs">⇄ Substituições (${st.subsLeft[k]})</button>`}
        <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap"><span class="muted" style="font-size:13px">Câmera</span><div class="seg">${G2_CAMS.map(([v, l]) => `<button class="${(G2PREF.cam || 'normal') === v ? 'on' : ''}" data-cam="${v}">${l}</button>`).join('')}</div></div>
        <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap"><span class="muted" style="font-size:13px">Botões</span><div class="seg">${G2_BTN.map(([v, l]) => `<button class="${(G2PREF.btn || 1) === v ? 'on' : ''}" data-btn="${v}">${l}</button>`).join('')}</div></div>
        <button class="btn" data-g="lay">✥ Mover botões da tela</button>
        <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap"><span class="muted" style="font-size:13px">Corrida</span><div class="seg"><button class="${G2PREF.autoRun !== false ? 'on' : ''}" data-run="1">Automática</button><button class="${G2PREF.autoRun === false ? 'on' : ''}" data-run="0">Manual (botão)</button></div></div>
        <button class="btn" data-g="${G.tr ? 'trquit' : 'sim'}">${G.tr ? '✖ Encerrar o treino' : `⏩ ${inShootout ? 'Simular os pênaltis' : 'Simular o resto'}`}</button></div>`;
    }
    hud.pause.innerHTML = `<div class="card">${body}</div>`;
    hud.pause.hidden = false;
    hud.pause.onclick = (e) => {
      const t = e.target.closest('button');
      if (!t || !G) return;
      if (t.dataset.rp !== undefined) { saveReplay(+t.dataset.rp); return; }
      if (t.dataset.run !== undefined) { G2PREF.autoRun = t.dataset.run === '1'; saveG2Pref(); applyBtnSize(document.querySelector('.g2d')); renderPause(false); return; }
      if (t.dataset.btn) { G2PREF.btn = +t.dataset.btn; saveG2Pref(); applyBtnSize(document.querySelector('.g2d')); renderPause(false); return; }
      if (t.dataset.cam) { G2PREF.cam = t.dataset.cam; saveG2Pref(); G.camZoom = G2_ZOOM[t.dataset.cam] || 1; renderPause(false); return; }
      if (t.dataset.g === 'lay') { hud.pause.hidden = true; g2LayoutEdit(root, () => { renderPause(false); hud.pause.hidden = false; }); return; }
      if (t.dataset.tm !== undefined) { applyLiveTactic2D({ ment: +t.dataset.tm }); renderPause(false, fromBreak); return; }
      if (t.dataset.ts) { applyLiveTactic2D({ sty: t.dataset.ts }); renderPause(false, fromBreak); return; }
      if (t.dataset.tf) { if (!applyLiveTactic2D({ form: t.dataset.tf })) toast('Não dá para mudar a formação agora (jogador expulso).', true); renderPause(false, fromBreak); return; }
      if (t.dataset.tp) { const q = tacticPresets().find((x) => x.id === +t.dataset.tp); if (q) { applyLiveTactic2D({ form: q.form, ment: q.ment, sty: q.sty }); toast(`Tática "${q.name}" ativada.`); } renderPause(false, fromBreak); return; }
      if (t.dataset.g === 'tac') { G.tacView = true; renderPause(false, fromBreak); return; }
      if (t.dataset.g === 'resume') { G.tacView = false; togglePause(); }
      else if (t.dataset.g === 'subs') { G.subOut = null; renderPause(true, fromBreak); }
      else if (t.dataset.g === 'back') { G.tacView = false; if (fromBreak) showBreak(hud.breakKind || 'half'); else renderPause(false); }
      else if (t.dataset.g === 'sim') { hud.pause.hidden = true; simulateRest(); }
      else if (t.dataset.g === 'trquit') { G.trResult = null; trainClose(); }
      else if (t.dataset.i !== undefined) { G.subOut = +t.dataset.i; renderPause(true, fromBreak); }
      else if (t.dataset.in !== undefined) {
        if (G.subOut == null) { toast('Escolha primeiro quem sai.', true); return; }
        if (st.subsLeft[k] <= 0) { toast('Sem substituições restantes.', true); return; }
        const idx = G.subOut, inPid = +t.dataset.in;
        doSub(st, k, idx, inPid, G.state === 'halftime' ? 45 : minuteInt());
        const sp = G.players.find((p) => p.side === k && p.slot === idx && !p.out);
        if (sp && S.players[inPid]) applyPlayer(sp, S.players[inPid]);
        G.subOut = null;
        renderPause(true, fromBreak);
      }
    };
  }
  function cleanup() {
    cancelAnimationFrame(rafId);
    if (G) clearTimeout(G.saveTimer);
    removeEventListener('resize', resize);
    removeEventListener('keydown', onKey);
    removeEventListener('keyup', onKey);
    removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVis);
    for (const k in KEYS) KEYS[k] = false;
    sfxClose();
    clearTimeout(hud.popT);
    if (root) root.remove();
    document.body.style.overflow = '';
    root = null; cv = null; ctx = null; radar = null; rctx = null; TEX = null;
    hud.breakKind = null; hud.intro = null;
  }
  function loop(now) {
    if (!G || G.paused) return;
    const dt = Math.min(0.05, Math.max(0, (now - G.last) / 1000)) * (G.slow || 1); // G.slow: slow motion for the browser tests
    G.last = now;
    if (!G.over) {
      const n = Math.max(1, Math.ceil(dt / (1 / 60)));
      for (let i = 0; i < n && G && !G.over; i++) step(dt / n);
    }
    if (!G || !cv) return;
    draw();
    G.radarT = (G.radarT || 0) + 1;
    if (G.radarT % 2 === 0) drawRadar();
    updateHud(false);
    rafId = requestAnimationFrame(loop);
  }
  function updateHud(force) {
    if (!root || !G) return;
    const cl = G.state === 'halftime' ? 'INT' : G.shootout ? 'PÊN' : G.st.decided ? 'PRO' : G.state === 'fulltime' ? 'FIM' : clockLabel();
    if (cl !== hud.lastClock || force) { hud.clock.textContent = cl; hud.lastClock = cl; }
    if (hud.skp === undefined) hud.skp = root.querySelectorAll('.skpads .pad');
    const cs = G.ctrl && G.ctrl.stars || 1;
    if (cs !== hud.lastStars || force) { hud.lastStars = cs; hud.skp.forEach((b) => b.classList.toggle('lock', cs < (SKILL_NEED[b.dataset.k] || 1))); }
    const s = G.st.score;
    const key = s[0] + ':' + s[1];
    if (key !== hud.lastScore || force) { hud.h.textContent = s[0]; hud.a.textContent = s[1]; hud.lastScore = key; }
  }

  // ------------------------------------------------------------------ rendering
  let T = null, SC = 10, TEX = null;
  const TS = 12; // stadium texture pixels per metre
  const EX = 22; // texture margin around the pitch, metres
  const SPONSORS = ['ULTRA ESPORTE', 'ULTRA MANAGER', 'CAFÉ DA VÁRZEA', 'GUARANÁ GOLAÇO', 'PNEUS RODA VIVA', 'BANCO DO TORCEDOR', 'SUCO DO MEIO-CAMPO', 'TINTAS TRAVESSÃO'];
  function buildTexture() {
    const wM = PW + EX * 2, hM = PL + EX * 2;
    const c = document.createElement('canvas');
    c.width = Math.round(wM * TS); c.height = Math.round(hM * TS);
    const g = c.getContext('2d');
    g.setTransform(TS, 0, 0, TS, EX * TS, EX * TS);
    const night = G.weather.night, wet = G.weather.kind === 'rain', snow = G.weather.kind === 'snow';
    g.fillStyle = night ? '#141a20' : '#2a3036';
    g.fillRect(-EX, -EX, wM, hM);
    const home = S.teams[G.m.h], away = S.teams[G.m.a];
    const crowdCols = [home.c1, home.c1, home.c2 || '#ffffff', home.c1, '#f1f1f1', '#2b2b2b', away.c1, '#e9c9a8', '#7a5a42', home.c2 || '#dddddd'];
    let seed = hashStr(String(G.m.id));
    const rnd2 = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const stand = (x0, y0, x1, y1) => {
      g.fillStyle = night ? '#1d242b' : '#3a424a';
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
      for (let y = y0 + 0.5; y < y1; y += 0.95) {
        for (let x = x0 + 0.5; x < x1; x += 0.8) {
          if (rnd2() < 0.1) continue;
          g.fillStyle = crowdCols[Math.floor(rnd2() * crowdCols.length)];
          g.beginPath(); g.arc(x + (rnd2() - 0.5) * 0.25, y + (rnd2() - 0.5) * 0.2, 0.3, 0, Math.PI * 2); g.fill();
        }
      }
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = y0; y < y1; y += 1.9) g.fillRect(x0, y, x1 - x0, 0.12);
    };
    stand(-EX, -EX, PW + EX, -7.5);
    stand(-EX, PL + 7.5, PW + EX, PL + EX);
    stand(-EX, -7.5, -7.5, PL + 7.5);
    stand(PW + 7.5, -7.5, PW + EX, PL + 7.5);
    // grass with mowing stripes, a light checker and a little wear
    const g1 = snow ? '#a9c0a5' : wet ? '#4f8a2c' : '#5c9532', g2 = snow ? '#b5cbb1' : wet ? '#589532' : '#68a03a';
    g.fillStyle = shade(g1, -0.12);
    g.fillRect(-7.5, -7.5, PW + 15, PL + 15);
    const stripe = PL / 18;
    for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? g2 : g1; g.fillRect(-3, i * stripe, PW + 6, stripe + 0.02); }
    g.fillStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i < 9; i++) if (i % 2) g.fillRect(i * (PW / 9), -3, PW / 9, PL + 6);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + rnd2() * 0.04})`; g.fillRect(rnd2() * PW, rnd2() * PL, 0.3 + rnd2() * 1.2, 0.2); }
    for (const gy of [0, PL]) { const gr = g.createRadialGradient(PW / 2, gy, 0.5, PW / 2, gy, 7); gr.addColorStop(0, 'rgba(120,90,50,0.28)'); gr.addColorStop(1, 'rgba(120,90,50,0)'); g.fillStyle = gr; g.fillRect(PW / 2 - 8, gy - 8, 16, 16); }
    // advertising boards (fictional sponsors)
    const board = (x, y, w, h, vertical, idx) => {
      const cols = [['#0f2b5b', '#ffffff'], ['#b8141e', '#ffffff'], ['#f2c230', '#1b1b1b'], ['#0f7a43', '#ffffff'], ['#1b1b1b', '#ffd34d']][idx % 5];
      g.fillStyle = cols[0]; g.fillRect(x, y, w, h);
      g.save();
      g.setTransform(1, 0, 0, 1, (x + w / 2 + EX) * TS, (y + h / 2 + EX) * TS);
      if (vertical) g.rotate(-Math.PI / 2);
      g.fillStyle = cols[1];
      g.font = `800 ${Math.round(0.7 * TS)}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(SPONSORS[idx % SPONSORS.length], 0, 1);
      g.restore();
    };
    let bi = hashStr(String(G.m.h)) % SPONSORS.length;
    for (let x = -4; x < PW + 4; x += 9) { board(x, -4.9, 8.8, 0.95, false, bi++); board(x, PL + 3.95, 8.8, 0.95, false, bi++); }
    for (let y = 0; y < PL; y += 10.5) { board(-4.9, y, 0.95, 10.3, true, bi++); board(PW + 3.95, y, 0.95, 10.3, true, bi++); }
    // dugouts on the left touchline
    for (const y of [PL / 2 - 12, PL / 2 + 5]) { g.fillStyle = '#20262c'; g.fillRect(-4.2, y, 2.6, 7); g.fillStyle = 'rgba(160,200,230,0.35)'; g.fillRect(-4.0, y + 0.2, 2.2, 6.6); }
    TEX = c;
  }
  function view() {
    const W = cv.width, H = cv.height;
    G.landscape = W > H * 1.05;
    SC = (G.landscape ? Math.min(W / 50, H / 30) : Math.min(W / 24, H / 44)) * (G.camZoom || 1);
    const visX = (G.landscape ? H : W) / SC, visY = (G.landscape ? W : H) / SC;
    const my = G.pk || G.shootout ? 22 : 10; // penalties show more of the stand behind the goal
    const cx = visX >= PW + 6 ? PW / 2 : clamp(G.cam.x, visX / 2 - 9, PW - visX / 2 + 9);
    const cy = visY >= PL + 10 ? PL / 2 : clamp(G.cam.y, visY / 2 - my, PL - visY / 2 + my);
    const sh = G.shake > 0 ? G.shake * SC * 0.25 : 0;
    const jx = sh ? (Math.random() - 0.5) * sh : 0, jy = sh ? (Math.random() - 0.5) * sh : 0;
    T = G.landscape ? { a: 0, b: SC, c: -SC, d: 0, e: W / 2 + cy * SC + jx, f: H / 2 - cx * SC + jy } : { a: SC, b: 0, c: 0, d: SC, e: W / 2 - cx * SC + jx, f: H / 2 - cy * SC + jy };
    return { W, H };
  }
  const PX = (x, y) => T.a * x + T.c * y + T.e;
  const PY = (x, y) => T.b * x + T.d * y + T.f;
  function sdir(dx, dy) { return G.landscape ? { x: -dy, y: dx } : { x: dx, y: dy }; }
  const ORG_PROTEST = ['RESPEITA ESSA CAMISA', 'DIRETORIA, ACORDA!', 'CADÊ O AMOR À CAMISA?', 'ELENCO SEM GARRA'];
  function drawOrgs(s) {
    if (!G.orgs || !G.orgs.length || G.tr) return;
    const tm = G.time, W = cv.width, H = cv.height;
    for (const o of G.orgs) {
      const sg = o.top ? -1 : 1, yF = o.top ? -6.4 : PL + 6.4, x0 = PW / 2 - o.half, x1 = PW / 2 + o.half;
      const cx = PX(PW / 2, yF), cy = PY(PW / 2, yF), mg = s * (o.half + 6);
      if (cx < -mg || cx > W + mg || cy < -mg || cy > H + mg) continue;
      const m = o.mood, low = m < 32, cheer = o.cheer > 0;
      const act = cheer ? 1 : low ? 0 : m >= 65 ? 0.6 : 0.3;
      const cols = [o.c1, o.c1, o.c2, '#ffffff'];
      // heads, jumping to the beat
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        for (let i = 0, x = x0 + (r % 2) * 0.4; x < x1; i++, x += 0.8) {
          const y = yF + sg * (1.3 + r * 1.0);
          const bob = act * (0.5 + 0.5 * Math.sin(tm * (6 + m / 30) + i * 1.9 + r * 0.7)) * 0.4;
          const px = PX(x, y), py = PY(x, y) - bob * s;
          ctx.fillStyle = low ? '#2a2f36' : cols[(i * 3 + r + o.seed) % 4];
          ctx.beginPath(); ctx.arc(px, py, s * 0.37, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e9c9a8'; ctx.beginPath(); ctx.arc(px, py - s * 0.15, s * 0.17, 0, Math.PI * 2); ctx.fill();
        }
      }
      // the banner along the front row
      const q = [[x0, yF], [x1, yF], [x1, yF + sg * 0.95], [x0, yF + sg * 0.95]].map(([x, y]) => [PX(x, y), PY(x, y)]);
      ctx.fillStyle = low ? '#111' : o.c1; ctx.strokeStyle = low ? '#e8e8e8' : o.c2; ctx.lineWidth = Math.max(1.5, s * 0.1);
      ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.translate((q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2);
      if (G.landscape) ctx.rotate(Math.PI / 2);
      ctx.fillStyle = low ? '#ffffff' : lum(o.c1) > 0.6 ? '#101010' : '#ffffff';
      ctx.font = `800 ${Math.round(s * 0.62)}px "Barlow Condensed","Arial Narrow",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(low ? ORG_PROTEST[o.seed % ORG_PROTEST.length] : o.name.toUpperCase(), 0, 0);
      ctx.restore();
      // flags
      const nf = low ? 0 : m >= 65 ? 9 : 5;
      for (let f = 0; f < nf; f++) {
        const xf = x0 + (x1 - x0) * (f + 0.5) / nf, bx = PX(xf, yF + sg * 1.0), by = PY(xf, yF + sg * 1.0);
        const sway = Math.sin(tm * 3 + f * 1.3) * s * 0.25 * (act + 0.2), top = by - s * (2.6 + (cheer ? 0.6 : 0));
        ctx.strokeStyle = '#3b2f24'; ctx.lineWidth = Math.max(1.5, s * 0.08);
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + sway, top); ctx.stroke();
        const fw = s * 1.7, fh = s * 1.05, tx = bx + sway;
        for (let k = 0; k < 2; k++) {
          ctx.fillStyle = k ? o.c2 : o.c1;
          ctx.beginPath();
          for (let j = 0; j <= 6; j++) { const u = j / 6; ctx.lineTo(tx + u * fw, top + k * fh / 2 + Math.sin(tm * 6 + u * 4 + f) * s * 0.14 * u); }
          for (let j = 6; j >= 0; j--) { const u = j / 6; ctx.lineTo(tx + u * fw, top + fh / 2 + k * fh / 2 + Math.sin(tm * 6 + u * 4 + f) * s * 0.14 * u); }
          ctx.closePath(); ctx.fill();
        }
      }
      // flares and smoke after a goal for this club
      if (cheer) {
        const a = Math.min(1, o.cheer / 2.5);
        for (let f = 0; f < 6; f++) {
          const xf = x0 + (x1 - x0) * (f + 0.5) / 6, bx = PX(xf, yF + sg * 2.2), by = PY(xf, yF + sg * 2.2);
          const rise = (5 - o.cheer) * s * 0.55, r = s * (1.1 + (5 - o.cheer) * 0.35);
          const col = f % 2 ? '255,70,40' : '255,255,255';
          const g = ctx.createRadialGradient(bx, by - rise, 0, bx, by - rise, r);
          g.addColorStop(0, `rgba(${col},${0.5 * a})`); g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by - rise, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(255,${200 + (Math.sin(tm * 30 + f) > 0 ? 55 : 0)},120,${a})`;
          ctx.beginPath(); ctx.arc(bx, by - s * 0.2, s * 0.12, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }
  function draw() {
    if (!TEX) buildTexture();
    const { W, H } = view();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1c2228';
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(T.a, T.b, T.c, T.d, T.e, T.f);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(TEX, -EX, -EX, PW + EX * 2, PL + EX * 2);
    // pitch markings
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 0.13;
    ctx.strokeRect(0, 0, PW, PL);
    ctx.beginPath(); ctx.moveTo(0, PL / 2); ctx.lineTo(PW, PL / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(PW / 2, PL / 2, 9.15, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(PW / 2, PL / 2, 0.22, 0, Math.PI * 2); ctx.fill();
    for (const top of [true, false]) {
      const y0 = top ? 0 : PL - BOX_D, y6 = top ? 0 : PL - 5.5, spot = top ? 11 : PL - 11;
      ctx.strokeRect(PW / 2 - BOX_W / 2, y0, BOX_W, BOX_D);
      ctx.strokeRect(PW / 2 - 9.16, y6, 18.32, 5.5);
      ctx.beginPath(); ctx.arc(PW / 2, spot, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      if (top) ctx.arc(PW / 2, spot, 9.15, 0.6435, Math.PI - 0.6435); else ctx.arc(PW / 2, spot, 9.15, Math.PI + 0.6435, 2 * Math.PI - 0.6435);
      ctx.stroke();
    }
    [[0, 0, 0, Math.PI / 2], [PW, 0, Math.PI / 2, Math.PI], [0, PL, 1.5 * Math.PI, 2 * Math.PI], [PW, PL, Math.PI, 1.5 * Math.PI]].forEach(([x, y, a0, a1]) => { ctx.beginPath(); ctx.arc(x, y, 1, a0, a1); ctx.stroke(); });
    for (const [x, y] of [[0, 0], [PW, 0], [0, PL], [PW, PL]]) { ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(x, y, 0.28, 0, Math.PI * 2); ctx.fill(); }
    // goals: the net bulges where the ball went in
    for (const top of [true, false]) {
      const x0 = PW / 2 - GOAL_W / 2, gl = top ? 0 : PL, s = top ? -1 : 1;
      const bulge = G.net && G.net.top === top ? G.net.t : 0;
      const bx = G.net && G.net.top === top ? G.net.x : PW / 2;
      const backY = (x) => gl + s * (2 + bulge * 1.1 * Math.max(0, 1 - Math.abs(x - bx) / 2.6));
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath(); ctx.moveTo(x0, gl);
      for (let i = 0; i <= 14; i++) { const x = x0 + GOAL_W * i / 14; ctx.lineTo(x, backY(x)); }
      ctx.lineTo(x0 + GOAL_W, gl); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = 0.05;
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) { const x = x0 + GOAL_W * i / 14; ctx.moveTo(x, gl); ctx.lineTo(x, backY(x)); }
      for (let j = 1; j <= 4; j++) { ctx.moveTo(x0, gl + (backY(x0) - gl) * j / 4); for (let i = 1; i <= 14; i++) { const x = x0 + GOAL_W * i / 14; ctx.lineTo(x, gl + (backY(x) - gl) * j / 4); } }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.3;
      ctx.beginPath(); ctx.moveTo(x0 + 0.15, gl + s * 0.18); ctx.lineTo(x0 + GOAL_W + 0.15, gl + s * 0.18); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.24;
      ctx.beginPath(); ctx.moveTo(x0, gl); ctx.lineTo(x0 + GOAL_W, gl); ctx.stroke();
      ctx.lineWidth = 0.12;
      ctx.beginPath(); ctx.moveTo(x0, gl); ctx.lineTo(x0, backY(x0)); ctx.lineTo(x0 + GOAL_W, backY(x0 + GOAL_W)); ctx.lineTo(x0 + GOAL_W, gl); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x0, gl, 0.16, 0, Math.PI * 2); ctx.arc(x0 + GOAL_W, gl, 0.16, 0, Math.PI * 2); ctx.fill();
    }
    for (const f of G.fx) if (f.kind === 'grass') { ctx.fillStyle = f.color; ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillRect(f.x - 0.06, f.y - 0.06 - f.z * 0.4, 0.14, 0.14); }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const s = SC;
    drawOrgs(s);
    if (!G.auto && !G.solo && !G.tr && G.state !== 'replay') drawBenchGround(s);
    const b = G.ball;
    const replaying = G.state === 'replay';
    // controlled player ring, pass preview and the target of a pass in flight
    if (!G.auto && G.ctrl && !G.ctrl.out && !G.pk && !replaying && !G.shootout) {
      const X = PX(G.ctrl.x, G.ctrl.y), Y = PY(G.ctrl.x, G.ctrl.y);
      ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.beginPath(); ctx.ellipse(X, Y + s * 0.05, s * 0.75, s * 0.36, 0, 0, Math.PI * 2); ctx.stroke();
      if (G.preview && !G.preview.out && b.owner === G.ctrl) {
        const q = G.preview, QX = PX(q.x, q.y), QY = PY(q.x, q.y);
        ctx.setLineDash([s * 0.25, s * 0.2]);
        ctx.strokeStyle = 'rgba(255,225,77,0.8)'; ctx.lineWidth = Math.max(1.5, s * 0.07);
        ctx.beginPath(); ctx.ellipse(QX, QY + s * 0.05, s * 0.62, s * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (b.target && !b.owner && b.target.team === 0 && !G.auto && !replaying) {
      const X = PX(b.target.x, b.target.y), Y = PY(b.target.x, b.target.y);
      ctx.strokeStyle = 'rgba(255,225,77,0.55)'; ctx.lineWidth = Math.max(1.5, s * 0.07);
      ctx.beginPath(); ctx.ellipse(X, Y + s * 0.05, s * 0.6, s * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // ball trail on hard shots
    const bsp = Math.hypot(b.vx, b.vy);
    if (!b.owner && bsp > 16 && !replaying) {
      const n = nrm(b.vx, b.vy);
      const X = PX(b.x, b.y), Y = PY(b.x, b.y) - b.z * s * 0.6 - s * 0.27;
      const X2 = PX(b.x - n.x * 2.2, b.y - n.y * 2.2), Y2 = PY(b.x - n.x * 2.2, b.y - n.y * 2.2) - b.z * s * 0.6 - s * 0.27;
      const grd = ctx.createLinearGradient(X, Y, X2, Y2);
      grd.addColorStop(0, 'rgba(255,255,255,0.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grd; ctx.lineWidth = s * 0.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X2, Y2); ctx.stroke();
      ctx.lineCap = 'butt';
    }
    const items = [];
    for (const p of G.players) {
      const outNow = replaying ? p.rOut : p.out;
      if (!outNow || (G.state === 'ufo' && G.ufo && G.ufo.vic === p)) items.push({ y: PY(p.x, p.y), p });
    }
    if (!G.auto && !replaying && G.ref) {
      const whistle = G.restartHold || G.state === 'goal';
      items.push({ y: PY(G.ref.x, G.ref.y), p: G.ref });
      for (const l of G.lines) items.push({ y: PY(l.x, l.y), p: l });
      if (!G.solo && !G.tr) {
        for (const c of G.coaches) if (c.team === 1 || (S.coach && S.coach.look)) items.push({ y: PY(c.x, c.y), coach: c });
        for (const q of benchSeats()) items.push({ y: PY(q.x, q.y), seat: q });
      }
    }
    items.sort((u, v) => u.y - v.y);
    for (const it of items) { if (it.coach) drawCoach(PX(it.coach.x, it.coach.y), it.y, s, it.coach); else if (it.seat) drawSeated(it.seat, PX(it.seat.x, it.seat.y), it.y, s); else { drawPlayer(it.p, PX(it.p.x, it.p.y), it.y, s); if (it.p.flagC) drawFlag(PX(it.p.x, it.p.y), it.y, s, it.p); } }
    // the ball is always drawn last: with these tall cartoon players it would otherwise vanish behind the carrier
    drawBall(s);
    // shot power and sprint stamina of the controlled player
    if (!G.auto && G.ctrl && !G.pk && !replaying && !G.shootout) {
      const c = G.ctrl, X = PX(c.x, c.y) - s * 1.1;
      let Y = PY(c.x, c.y) + s * 0.55;
      if (G.input.supDown && b.owner === c) {
        const sh = G.input.supHold, pw = clamp(sh / 1.25, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(X, Y, s * 2.2, s * 0.34);
        ctx.fillStyle = 'rgba(80,220,120,0.55)'; ctx.fillRect(X + s * 2.2 * (0.55 / 1.25), Y, s * 2.2 * (0.4 / 1.25), s * 0.34); // sweet spot
        ctx.fillStyle = sh > 1.02 ? '#ff4d4d' : sh >= 0.55 && sh <= 0.95 ? '#ffb02e' : '#ffe14d'; ctx.fillRect(X, Y, s * 2.2 * pw, s * 0.34);
        Y += s * 0.44;
      }
      if (G.input.shootDown && b.owner === c) {
        const pw = clamp(0.3 + G.input.hold * 0.7, 0.3, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(X, Y, s * 2.2, s * 0.32);
        ctx.fillStyle = pw > 0.88 ? '#ff5d5d' : '#ffe14d'; ctx.fillRect(X, Y, s * 2.2 * pw, s * 0.32);
        Y += s * 0.42;
      }
      if (c.sta < 0.98) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(X, Y, s * 2.2, s * 0.16);
        ctx.fillStyle = c.sta < 0.2 ? '#ff6060' : '#4cc3ff'; ctx.fillRect(X, Y, s * 2.2 * c.sta, s * 0.16);
      }
    }
    // penalty: aim reticle and power bar, or the corner picked for the user's keeper
    if (G.pk && (G.pk.phase === 'aim' || G.pk.phase === 'runup')) {
      const k = G.pk;
      const ax = PW / 2 + k.dirX * (k.phase === 'runup' ? k.ka : k.aim) * (GOAL_W / 2 - 0.25);
      const X = PX(ax, k.gy), Y = PY(ax, k.gy);
      const pw = clamp(k.phase === 'runup' ? k.kp : k.power, 0, 1.08);
      const col = pw > 0.95 ? '#ff5d5d' : '#ffe14d';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = Math.max(4, s * 0.18);
      ctx.beginPath(); ctx.arc(X, Y, s * (0.6 + pw * 0.3), 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * 0.1);
      ctx.beginPath(); ctx.arc(X, Y, s * (0.6 + pw * 0.3), 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X - s * 0.9, Y); ctx.lineTo(X + s * 0.9, Y); ctx.moveTo(X, Y - s * 0.9); ctx.lineTo(X, Y + s * 0.9); ctx.stroke();
      const tk = k.taker;
      const bx = PX(tk.x, tk.y) - s * 1.1, by = PY(tk.x, tk.y) + s * 0.55;
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(bx, by, s * 2.2, s * 0.32);
      ctx.fillStyle = col; ctx.fillRect(bx, by, s * 2.2 * Math.min(1, pw), s * 0.32);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(bx + s * 2.2 * 0.88, by, Math.max(1, s * 0.05), s * 0.32);
    }
    if (!G.auto && !replaying && G.restartHold && G.setKind === 'corner' && G.restartTeam === 0 && b.owner && b.owner.team === 0 && G.restartSpot) {
      const Z = cornerZones(G.restartSpot.x, G.restartSpot.y);
      for (const k of ['near', 'six', 'far', 'spot']) {
        const z = Z[k], X = PX(z.x, z.y), Y = PY(z.x, z.y), on = (G.cornerAim || 'six') === k;
        ctx.fillStyle = on ? 'rgba(255,225,77,0.32)' : 'rgba(255,255,255,0.1)';
        ctx.strokeStyle = on ? '#ffe14d' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = Math.max(1.5, s * (on ? 0.11 : 0.05));
        ctx.setLineDash(on ? [] : [s * 0.2, s * 0.16]);
        ctx.beginPath(); ctx.ellipse(X, Y, s * (k === 'spot' ? 0.8 : 1.15), s * (k === 'spot' ? 0.4 : 0.58), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]);
        if (on) {
          ctx.font = `700 ${Math.round(s * 0.42)}px "Barlow", "Arial", sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.lineWidth = Math.max(2, s * 0.1); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(z.name, X, Y - s * 0.65);
          ctx.fillStyle = '#ffe14d'; ctx.fillText(z.name, X, Y - s * 0.65);
        }
      }
    }
    if (G.pk && G.pk.phase === 'dive' && G.pk.gk) {
      const k = G.pk;
      for (const o of [-1, 0, 1]) {
        const wx = PW / 2 + k.dirX * o * 2.5, X = PX(wx, k.gy - k.fwd * 0.2), Y = PY(wx, k.gy - k.fwd * 0.2);
        const on = k.dive === o;
        ctx.fillStyle = on ? 'rgba(255,225,77,0.45)' : 'rgba(255,255,255,0.12)';
        ctx.strokeStyle = on ? '#ffe14d' : 'rgba(255,255,255,0.55)';
        ctx.lineWidth = Math.max(2, s * (on ? 0.12 : 0.06));
        ctx.beginPath(); ctx.arc(X, Y, s * 0.85, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    if (G.state === 'ufo' && G.ufo && G.ufo.vic) drawUfo(s);
    // weather, night, goal flash, replay letterbox, confetti
    if (G.drops) {
      if (G.weather.kind === 'rain') {
        ctx.strokeStyle = 'rgba(210,225,255,0.38)'; ctx.lineWidth = Math.max(1, s * 0.05);
        ctx.beginPath();
        for (const d of G.drops) {
          d.y += 0.022 * d.s; d.x += 0.004 * d.s;
          if (d.y > 1) { d.y = 0; d.x = Math.random(); }
          if (d.x > 1) d.x = 0;
          const x = d.x * W, y = d.y * H;
          ctx.moveTo(x, y); ctx.lineTo(x + s * 0.25, y + s * 0.9);
        }
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (const d of G.drops) {
          d.y += 0.004 * d.s; d.x += Math.sin((d.y + d.s) * 12) * 0.0015;
          if (d.y > 1) { d.y = 0; d.x = Math.random(); }
          ctx.beginPath(); ctx.arc(d.x * W, d.y * H, Math.max(1.5, s * 0.09 * d.s), 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (G.weather.night) {
      const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      gr.addColorStop(0, 'rgba(0,0,20,0)'); gr.addColorStop(1, 'rgba(0,0,20,0.38)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    }
    if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
    if (replaying) {
      const bar = H * 0.08;
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    }
    for (const f of G.fx) {
      if (f.kind !== 'conf') continue;
      ctx.save(); ctx.translate(f.sx * W, f.sy * H); ctx.rotate(f.a);
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.fillStyle = f.color; ctx.fillRect(-s * 0.25, -s * 0.1, s * 0.5, s * 0.2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function drawBall(s) {
    const b = G.ball;
    const X = PX(b.x, b.y), Y = PY(b.x, b.y);
    const r = s * 0.27;
    // the chapéu leaves a rainbow trail
    if (G.time < (b.rbEnd || 0) && G.state !== 'replay') {
      (G.btrail = G.btrail || []).push({ wx: b.x, wy: b.y, z: b.z, t: G.time });
    }
    if (G.time < (b.supEnd || 0) && G.state !== 'replay') (G.sTrail = G.sTrail || []).push({ wx: b.x, wy: b.y, z: b.z, t: G.time });
    if (G.sTrail && G.sTrail.length) {
      G.sTrail = G.sTrail.filter((q) => G.time - q.t < 0.45);
      ctx.lineCap = 'round';
      for (const [col, w, a0] of [['#ff7a1a', 0.3, 0.55], ['#ffd24d', 0.15, 0.9]]) {
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * w);
        ctx.beginPath();
        G.sTrail.forEach((q, i) => { ctx.globalAlpha = Math.max(0, 1 - (G.time - q.t) / 0.45) * a0; const xx = PX(q.wx, q.wy), yy = PY(q.wx, q.wy) - r - q.z * s * 0.6; if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); });
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    }
    if (G.btrail && G.btrail.length) {
      G.btrail = G.btrail.filter((q) => G.time - q.t < 0.7);
      const cols = ['#ff4d4d', '#ffb347', '#ffe14d', '#5fd16a', '#4da6ff', '#a56bff'];
      ctx.lineCap = 'round';
      for (let ci = 0; ci < cols.length; ci++) {
        ctx.strokeStyle = cols[ci]; ctx.lineWidth = Math.max(1, s * 0.05);
        ctx.beginPath();
        G.btrail.forEach((q, i) => { const a = 1 - (G.time - q.t) / 0.7; ctx.globalAlpha = Math.max(0, a) * 0.8; const yy = PY(q.wx, q.wy) - r - q.z * s * 0.6 + (ci - 2.5) * s * 0.055, xx = PX(q.wx, q.wy); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); });
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.lineCap = 'butt';
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(X + b.z * s * 0.22, Y + s * 0.06 + b.z * s * 0.1, r * 1.05, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    const by = Y - r - b.z * s * 0.6;
    const br = r * (1 + b.z * 0.035);
    const g = ctx.createRadialGradient(X - br * 0.35, by - br * 0.35, br * 0.1, X, by, br);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#e3e8eb'); g.addColorStop(1, '#a9b3b9');
    ctx.fillStyle = g; ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.beginPath(); ctx.arc(X, by, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b1b1b';
    for (let i = 0; i < 3; i++) { const t = b.spin + i * 2.1; ctx.beginPath(); ctx.arc(X + Math.cos(t) * br * 0.45, by + Math.sin(t) * br * 0.45, br * 0.24, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(X - br * 0.35, by - br * 0.4, br * 0.22, br * 0.13, -0.6, 0, Math.PI * 2); ctx.fill();
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawPlayer(p, X, Y, s) {
    const kit = p.kitOv || (p.gk ? G.gkKits[p.side] : G.kits[p.side]);
    const rp = G.state === 'replay';
    const sliding = rp ? p.rSlide : p.slide > 0;
    const fallen = rp ? p.rFall : p.fall > 0;
    const kicking = rp ? p.rKick : p.kickT > 0;
    const diving = rp ? p.rDive : p.diveT > 0;
    let lift = 0, alpha = 1;
    if (G.state === 'ufo' && G.ufo && G.ufo.vic === p) { lift = Math.max(0, G.ufo.t - 0.6) * s * 3.2; alpha = clamp(1 - (G.ufo.t - 1.1) / 0.6, 0, 1); if (alpha <= 0) return; }
    const cel = G.state === 'goal' && G.celebr && G.celebr.kind && p === G.celebr.scorer ? G.celebr : null;
    if (cel) {
      const ct = G.time - cel.t0;
      if (cel.kind === 'flip') lift += ct < 0.9 ? Math.abs(Math.sin(ct * Math.PI / 0.9)) * s * 1.1 : 0;
      else if (cel.kind === 'dance' || cel.kind === 'robot' || cel.kind === 'conga') lift += Math.abs(Math.sin(ct * 7)) * s * 0.18;
      else if (cel.kind === 'screw' || cel.kind === 'rocket') lift += ct < 1.2 ? Math.abs(Math.sin(ct * Math.PI / 1.2)) * s * (cel.kind === 'rocket' ? 1.6 : 1.3) : 0;
      else if (cel.kind === 'drum' || cel.kind === 'fire' || cel.kind === 'wave' || cel.kind === 'tornado' || cel.kind === 'surf' || cel.kind === 'moon') lift += Math.abs(Math.sin(ct * 8)) * s * 0.2;
      else if (cel.kind === 'sky') lift += Math.abs(Math.sin(ct * 3)) * s * 0.1;
    }
    ctx.globalAlpha = alpha;
    const ol = 'rgba(0,0,0,0.38)', lw = Math.max(1, s * 0.055);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(X + s * 0.12, Y + s * 0.06, s * 0.55, s * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(X + s * 0.04, Y + s * 0.02, s * 0.3, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    if (!G.auto && !rp && p === G.ctrl && !G.pk && !G.shootout && !lift) {
      const pulse = 0.5 + 0.5 * Math.sin(G.time * 6), fl = Math.max(0, G.swapFlash || 0);
      ctx.strokeStyle = fl > 0 ? 'rgba(120,255,160,' + (0.6 + 0.4 * fl) + ')' : 'rgba(255,225,77,' + (0.55 + 0.25 * pulse) + ')';
      ctx.lineWidth = Math.max(2, s * (0.1 + fl * 0.12));
      ctx.beginPath(); ctx.ellipse(X, Y + s * 0.04, s * (0.62 + fl * 0.5), s * (0.27 + fl * 0.2), 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (G.tr && p === G.tr.target && G.tr.phase !== 'wait' && !rp) {
      const pu = 0.5 + 0.5 * Math.sin(G.time * 7);
      ctx.strokeStyle = 'rgba(80,220,255,' + (0.7 + 0.3 * pu) + ')'; ctx.lineWidth = Math.max(3, s * 0.14);
      ctx.beginPath(); ctx.ellipse(X, Y + s * 0.04, s * (0.78 + pu * 0.12), s * (0.34 + pu * 0.06), 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(80,220,255,0.9)'; ctx.beginPath(); ctx.moveTo(X, Y - s * 2.75 - pu * s * 0.1); ctx.lineTo(X - s * 0.2, Y - s * 3.1 - pu * s * 0.1); ctx.lineTo(X + s * 0.2, Y - s * 3.1 - pu * s * 0.1); ctx.closePath(); ctx.fill();
    }
    if (cel) { ctx.font = `${Math.round(s * 0.95)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(CELEBS[cel.kind][0], X, Y - lift - s * 2.5); }
    Y -= lift + ((!diving && p.gk) ? (rp ? p.rGz || 0 : p.gz || 0) * s * 0.55 : 0);
    let hdx = p.dx, hdy = p.dy;
    if (!rp && p.sk && p.sk.kind === 'spin') { const a = Math.atan2(p.sk.dy, p.sk.dx) + (1 - p.sk.t / p.sk.T) * Math.PI * 2; hdx = Math.cos(a); hdy = Math.sin(a); }
    const sd = sdir(hdx, hdy);
    // goalkeeper in the air or on the ground after a dive: stretched out, gloves first
    if (diving && p.gk && !lift) {
      const gz = rp ? p.rGz || 0 : p.gz || 0;
      const dd = sdir(p.diveDir || 1, 0);
      const nowT = G.time;
      if (!rp) { if (!(p._dvL > nowT - 0.25)) p._dvS = nowT; p._dvL = nowT; }
      const age = rp ? 0.4 : nowT - (p._dvS || nowT);
      const rot = rp ? 1 : clamp(age / 0.16, 0, 1) * (p.diveT > 0 && p.diveT < 0.34 ? p.diveT / 0.34 : 1); // 0 upright .. 1 stretched out
      const arch = Math.sin(clamp(age / 0.5, 0, 1) * Math.PI) * (1 - rot * 0.2);
      ctx.save(); ctx.translate(X, Y - s * (0.34 + 0.5 * (1 - rot)) - gz * s * 0.6); ctx.rotate((Math.atan2(dd.y, dd.x) + Math.PI / 2) * rot);
      const bend = arch * 0.25;
      ctx.fillStyle = kit.socks; ctx.fillRect(-s * 0.3, s * 0.38, s * 0.18, s * 0.55); ctx.save(); ctx.translate(s * 0.2, s * 0.3); ctx.rotate(bend); ctx.fillRect(-s * 0.09, 0, s * 0.18, s * 0.55); ctx.restore();
      ctx.fillStyle = '#151515'; ctx.fillRect(-s * 0.32, s * 0.9, s * 0.22, s * 0.12); ctx.fillRect(s * 0.1, s * (0.82 - bend * 0.4), s * 0.22, s * 0.12);
      ctx.fillStyle = kit.shorts; rr(-s * 0.36, s * 0.08, s * 0.72, s * 0.34, s * 0.08); ctx.fill();
      ctx.fillStyle = kit.shirt;
      rr(-s * 0.36, -s * 1.62, s * 0.17, s * 1.12, s * 0.07); ctx.fill();
      ctx.save(); ctx.translate(s * 0.28, -s * 0.5); ctx.rotate(-0.28 * rot); rr(-s * 0.09, -s * 1.0, s * 0.17, s * 1.0, s * 0.07); ctx.fill(); ctx.restore();
      rr(-s * 0.4, -s * 0.58, s * 0.8, s * 0.72, s * 0.18); ctx.fill(); ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, -s * 0.86, s * 0.38, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(0, -s * 0.92, s * 0.36, Math.PI, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.arc(-s * 0.27, -s * 1.68, s * 0.19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(s * 0.4 + 0.28 * rot * s * 0.9 * 0.3, -s * 1.58, s * 0.19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1;
      return;
    }
    if (sliding && !fallen && !lift) {
      // slide tackle: low on the ground, one leg stretched out in front, the other bent under, one hand propping up the body
      const spr = rp ? 0.5 : clamp(1 - p.slide / 0.45, 0, 1);
      const ext = spr < 0.22 ? spr / 0.22 : spr > 0.88 ? 1 - ((spr - 0.88) / 0.12) * 0.35 : 1;
      const drop = clamp(spr / 0.18, 0, 1);
      const a0 = Math.atan2(sd.y, sd.x), flip = Math.cos(a0) < 0;
      const L = (x1, y1, x2, y2, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = s * w; ctx.beginPath(); ctx.moveTo(x1 * s, y1 * s); ctx.lineTo(x2 * s, y2 * s); ctx.stroke(); };
      // streak of grass and dust behind
      ctx.fillStyle = 'rgba(150,190,90,0.35)';
      ctx.beginPath(); ctx.ellipse(X - sd.x * s * 0.9, Y - sd.y * s * 0.35 + s * 0.04, s * (0.5 + 0.9 * ext), s * 0.1, Math.atan2(sd.y * 0.4, sd.x), 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(X, Y - s * 0.02); ctx.rotate(flip ? a0 - Math.PI : a0); if (flip) ctx.scale(-1, 1);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const hip = { x: 0.05, y: -0.2 - 0.06 * (1 - drop) };
      // far arm (up and forward for balance)
      L(-0.72, -0.52 - 0.12 * (1 - drop), -0.4, -0.95, 0.12, p.skin); L(-0.8, -0.5, -0.55, -0.74, 0.19, kit.shirt);
      // bent leg under the body
      L(hip.x, hip.y, 0.5, -0.42, 0.2, p.skin); L(0.5, -0.42, 0.05, -0.1, 0.19, kit.socks);
      ctx.fillStyle = '#16181a'; ctx.beginPath(); ctx.ellipse(-0.02 * s, -0.07 * s, s * 0.14, s * 0.08, 0.4, 0, Math.PI * 2); ctx.fill();
      // torso, leaning back
      ctx.save(); ctx.translate(-0.5 * s, -0.34 * s); ctx.rotate(0.3);
      ctx.fillStyle = kit.shirt; rr(-0.52 * s, -0.28 * s, 1.04 * s, 0.56 * s, 0.2 * s); ctx.fill();
      const tg2 = ctx.createLinearGradient(0, -0.28 * s, 0, 0.28 * s); tg2.addColorStop(0, 'rgba(255,255,255,0.22)'); tg2.addColorStop(1, 'rgba(0,0,0,0.28)');
      ctx.fillStyle = tg2; rr(-0.52 * s, -0.28 * s, 1.04 * s, 0.56 * s, 0.2 * s); ctx.fill(); ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
      ctx.fillStyle = kit.trim; ctx.fillRect(-0.18 * s, -0.28 * s, 0.07 * s, 0.56 * s);
      ctx.fillStyle = kit.shorts; rr(0.3 * s, -0.28 * s, 0.34 * s, 0.56 * s, 0.1 * s); ctx.fill();
      ctx.restore();
      // head, looking at the ball
      const hh = { x: -1.12, y: -0.62 };
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(hh.x * s, hh.y * s, s * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
      ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(hh.x * s - 0.04 * s, hh.y * s - 0.05 * s, s * 0.41, Math.PI * 0.85, Math.PI * 1.95); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse((hh.x + 0.2) * s, (hh.y + 0.02) * s, s * 0.09, s * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc((hh.x + 0.24) * s, (hh.y + 0.03) * s, s * 0.05, 0, Math.PI * 2); ctx.fill();
      // near arm propping on the ground behind
      L(-0.85, -0.5, -1.3, -0.08, 0.12, p.skin); L(-0.82, -0.5, -1.05, -0.28, 0.19, kit.shirt);
      // stretched leg: thigh, sock with its band, boot with studs, reaching for the ball
      const fxl = hip.x + 1.2 * ext, fyl = -0.1 - 0.05 * ext;
      L(hip.x, hip.y, hip.x + 0.55 * ext, hip.y + (fyl - hip.y) * 0.5, 0.21, p.skin);
      L(hip.x + 0.5 * ext, hip.y + (fyl - hip.y) * 0.45, fxl, fyl, 0.2, kit.socks);
      L(hip.x + 0.72 * ext, hip.y + (fyl - hip.y) * 0.6, hip.x + 0.84 * ext, hip.y + (fyl - hip.y) * 0.7, 0.2, kit.trim);
      ctx.fillStyle = '#16181a'; ctx.beginPath(); ctx.ellipse((fxl + 0.12) * s, (fyl + 0.02) * s, s * 0.2, s * 0.11, -0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d8d8d8'; for (let i = 0; i < 3; i++) ctx.fillRect((fxl + 0.02 + i * 0.1) * s, (fyl + 0.08) * s, s * 0.04, s * 0.05);
      ctx.lineCap = 'butt';
      ctx.restore(); ctx.globalAlpha = 1;
      return;
    }
    if ((sliding || fallen) && !lift) {
      const ang = Math.atan2(sd.y, sd.x) - Math.PI / 2;
      ctx.save(); ctx.translate(X, Y - s * 0.3); ctx.rotate(ang);
      ctx.fillStyle = kit.socks; ctx.fillRect(-s * 0.3, s * 0.35, s * 0.18, s * 0.55); ctx.fillRect(s * 0.12, s * 0.35, s * 0.18, s * 0.55);
      ctx.fillStyle = kit.shorts; rr(-s * 0.36, s * 0.1, s * 0.72, s * 0.32, s * 0.08); ctx.fill();
      ctx.fillStyle = kit.shirt; rr(-s * 0.4, -s * 0.55, s * 0.8, s * 0.7, s * 0.18); ctx.fill(); if (kit.pat) { ctx.save(); rr(-s * 0.4, -s * 0.55, s * 0.8, s * 0.7, s * 0.18); ctx.clip(); kitPattern(ctx, kit.pat, kit.trim, -s * 0.4, -s * 0.55, s * 0.8, s * 0.7); ctx.restore(); } ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
      if (p.gk) { ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.arc(-s * 0.5, -s * 1.05, s * 0.16, 0, Math.PI * 2); ctx.arc(s * 0.5, -s * 1.05, s * 0.16, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(0, -s * 0.85, s * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(0, -s * 0.9, s * 0.38, Math.PI, 2 * Math.PI); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
      return;
    }
    const spd = Math.hypot(p.vx, p.vy);
    const moving = spd > 0.5;
    const run = clamp(spd / 6, 0, 1.25); // 0 standing .. 1 sprint
    const tt = p.anim * 3.2;
    const sk = !rp && p.sk ? p.sk : null;
    const skP = sk ? 1 - sk.t / sk.T : 0; // progress of a dribble move
    const spin = sk && sk.kind === 'spin';
    const feint = sk && (sk.kind === 'feint' || sk.kind === 'roll' || sk.kind === 'nutmeg' || sk.kind === 'elastico' || sk.kind === 'pedalada' || sk.kind === 'drag' || sk.kind === 'fakeshot' || sk.kind === 'heel');
    const rainbow = sk && sk.kind === 'rainbow';
    const rollOn = sk && sk.kind === 'roll' && G.ball.owner === p;
    const rollB = rollOn ? { x: PX(G.ball.x, G.ball.y), y: PY(G.ball.x, G.ball.y) } : null;
    const celebrating = G.state === 'goal' && G.celebr && p.team === G.celebr.scorer.team && !p.gk;
    const q = kicking ? (rp ? 0.45 : clamp(1 - p.kickT / 0.25, 0, 1)) : 0; // progress of the kick
    // kick leg: back-swing, strike, follow-through (positive = forward)
    const kr = !kicking ? 0 : q < 0.3 ? -(q / 0.3) * 0.8 : q < 0.6 ? -0.8 + ((q - 0.3) / 0.3) * 2.2 : 1.4 - ((q - 0.6) / 0.4) * 0.9;
    const bob = moving ? Math.abs(Math.sin(tt)) * s * 0.06 * run : Math.sin(G.time * 2 + (p.num || 0)) * s * 0.012;
    const jump = spin ? Math.sin(skP * Math.PI) * s * 0.14 : rainbow ? Math.sin(Math.min(1, skP / 0.8) * Math.PI) * s * 0.3 : 0;
    let lean = sd.x * s * 0.1 * run + (kicking ? sd.x * s * 0.06 * Math.max(0, kr) : 0);
    if (feint) {
      const cur = sk.dx2 !== undefined && sk.t < sk.T * 0.5 ? [sk.dx2, sk.dy2] : [sk.dx, sk.dy];
      const bd = sdir(cur[0], cur[1]);
      lean += bd.x * s * 0.22 * (skP < 0.35 ? -0.7 * (skP / 0.35) : -0.7 + 1.7 * ((skP - 0.35) / 0.65));
    }
    ctx.save();
    if (spin) { const ca = Math.abs(Math.cos(skP * Math.PI * 2 + Math.atan2(sk.dy, sk.dx))); ctx.translate(X, Y); ctx.scale(0.62 + 0.38 * ca, 1); ctx.translate(-X, -Y); }
    const hipY = Y - s * 0.68 - jump;
    const lw2 = Math.max(1, s * 0.03);
    // a leg: thigh (skin), shin (sock with a band) and boot; swings with the run cycle, kicks, or circles over the ball
    const leg = (hx, phase, kickLeg, footLeg) => {
      const st = moving ? Math.sin(tt + phase) : 0;
      const lf = moving ? Math.max(0, Math.cos(tt + phase)) : 0;
      let fx = hx + sd.x * s * 0.32 * st * run, fy = Y - jump - lf * s * 0.17 * run + sd.y * s * 0.1 * st * run;
      let kneeF = 0.1 + lf * 0.12;
      if (kickLeg && kicking) { fx = hx + sd.x * s * 0.55 * kr; fy = Y - jump - s * 0.05 - Math.max(0, kr) * s * 0.15 + sd.y * s * 0.2 * kr; kneeF = 0.16; }
      else if (rainbow && footLeg) { // heel flick: the foot goes up behind, then whips over the ball
        if (skP < 0.36) { const u = skP / 0.36; fx = hx - sd.x * s * 0.3 * u; fy = Y - jump - s * 0.62 * u; kneeF = 0.3; }
        else if (skP < 0.56) { const u = (skP - 0.36) / 0.2; fx = hx + sd.x * s * (-0.3 + 0.9 * u); fy = Y - jump - s * (0.62 + 0.28 * Math.sin(u * Math.PI)); kneeF = 0.3 - 0.15 * u; }
        else { const u = Math.min(1, (skP - 0.56) / 0.3); fx = hx + sd.x * s * (0.6 - 0.45 * u); fy = Y - jump - s * 0.62 * (1 - u); kneeF = 0.15; }
      } else if (rollOn && footLeg) { // carretilha: the sole on top of the ball, rolling it across
        const u = skP < 0.16 ? skP / 0.16 : skP > 0.8 ? Math.max(0, 1 - (skP - 0.8) / 0.2) : 1;
        const rx = rollB.x + (skP > 0.8 ? 0 : 0), ry = rollB.y - s * 0.5;
        fx = (hx + sd.x * s * 0.2) * (1 - u) + rx * u; fy = (Y - s * 0.1) * (1 - u) + ry * u; kneeF = 0.28;
      }
      else if (feint && footLeg) { // step-over: the foot circles over the ball
        const a = skP * Math.PI * 2.4;
        fx = hx + sd.x * s * 0.3 + Math.cos(a) * s * 0.42; fy = Y - jump - Math.max(0, Math.sin(a)) * s * 0.3; kneeF = 0.2;
      } else if (!moving && !kicking) fx += (hx < X ? -1 : 1) * s * 0.03;
      const kx = (hx + lean * 0.4 + fx) / 2 + sd.x * s * kneeF, ky = (hipY + fy) / 2 - s * 0.03 * (1 + lf);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = p.skin; ctx.lineWidth = s * 0.2;
      ctx.beginPath(); ctx.moveTo(hx + lean * 0.4, hipY); ctx.lineTo(kx, ky); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = s * 0.06;
      ctx.beginPath(); ctx.moveTo(hx + lean * 0.4 - s * 0.05, hipY); ctx.lineTo(kx - s * 0.05, ky); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = s * 0.05;
      ctx.beginPath(); ctx.moveTo(hx + lean * 0.4 + s * 0.07, hipY); ctx.lineTo(kx + s * 0.07, ky); ctx.stroke();
      ctx.strokeStyle = kit.socks; ctx.lineWidth = s * 0.19;
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy - s * 0.1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = s * 0.055;
      ctx.beginPath(); ctx.moveTo(kx - s * 0.05, ky); ctx.lineTo(fx - s * 0.05, fy - s * 0.1); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = s * 0.05;
      ctx.beginPath(); ctx.moveTo(kx + s * 0.07, ky); ctx.lineTo(fx + s * 0.07, fy - s * 0.1); ctx.stroke();
      ctx.strokeStyle = kit.trim; ctx.lineWidth = s * 0.19;
      const bx = kx + (fx - kx) * 0.3, by = ky + (fy - s * 0.1 - ky) * 0.3;
      ctx.beginPath(); ctx.moveTo(bx - s * 0.005, by); ctx.lineTo(bx + (fx - kx) * 0.12, by + (fy - s * 0.1 - ky) * 0.12); ctx.stroke();
      // boot, pointing the way he is heading
      ctx.fillStyle = p.boots || '#16181a';
      ctx.beginPath(); ctx.ellipse(fx + sd.x * s * 0.07, fy - s * 0.04, s * 0.15 + Math.abs(sd.x) * s * 0.05, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(fx + sd.x * s * 0.09, fy - s * 0.07, s * 0.07, s * 0.025, 0, 0, Math.PI * 2); ctx.fill();
    };
    const legs = [[X - s * 0.17, 0, false, false], [X + s * 0.17, Math.PI, true, true]];
    if (sd.y < 0) legs.reverse();
    for (const l of legs) leg(l[0], l[1], l[2], l[3]);
    ctx.lineCap = 'butt';
    // shorts with a side stripe
    ctx.fillStyle = kit.shorts;
    rr(X - s * 0.38 + lean * 0.4, hipY - s * 0.2, s * 0.76, s * 0.4, s * 0.1); ctx.fill();
    ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
    const sg = ctx.createLinearGradient(X - s * 0.38, 0, X + s * 0.38, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0.18)'); sg.addColorStop(0.5, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.26)');
    ctx.fillStyle = sg; rr(X - s * 0.38 + lean * 0.4, hipY - s * 0.2, s * 0.76, s * 0.4, s * 0.1); ctx.fill();
    ctx.fillStyle = kit.trim;
    ctx.fillRect(X - s * 0.38 + lean * 0.4, hipY - s * 0.04, s * 0.05, s * 0.2);
    ctx.fillRect(X + s * 0.33 + lean * 0.4, hipY - s * 0.04, s * 0.05, s * 0.2);
    // torso (leans into the run) with shoulders and a collar
    const tx = X + lean * 0.7, ty = Y - s * 1.46 - jump - bob;
    ctx.fillStyle = kit.shirt;
    rr(tx - s * 0.42, ty, s * 0.84, s * 0.78, s * 0.22); ctx.fill();
    if (kit.pat) { ctx.save(); rr(tx - s * 0.42, ty, s * 0.84, s * 0.78, s * 0.22); ctx.clip(); kitPattern(ctx, kit.pat, kit.trim, tx - s * 0.42, ty, s * 0.84, s * 0.78); ctx.restore(); }
    // cylinder-like shading: lit from the upper left, darker on the right and at the waist
    const tg = ctx.createLinearGradient(tx - s * 0.42, 0, tx + s * 0.42, 0);
    tg.addColorStop(0, 'rgba(255,255,255,0.24)'); tg.addColorStop(0.35, 'rgba(255,255,255,0.04)'); tg.addColorStop(0.65, 'rgba(0,0,0,0.04)'); tg.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = tg; rr(tx - s * 0.42, ty, s * 0.84, s * 0.78, s * 0.22); ctx.fill();
    const tv = ctx.createLinearGradient(0, ty, 0, ty + s * 0.78);
    tv.addColorStop(0, 'rgba(255,255,255,0.1)'); tv.addColorStop(0.6, 'rgba(0,0,0,0)'); tv.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = tv; rr(tx - s * 0.42, ty, s * 0.84, s * 0.78, s * 0.22); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = Math.max(1, s * 0.03); // fabric folds
    ctx.beginPath(); ctx.moveTo(tx - s * 0.18, ty + s * 0.5); ctx.quadraticCurveTo(tx - s * 0.05, ty + s * 0.58, tx + s * 0.14, ty + s * 0.52); ctx.stroke();
    ctx.strokeStyle = ol; ctx.lineWidth = lw;
    rr(tx - s * 0.42, ty, s * 0.84, s * 0.78, s * 0.22); ctx.stroke();
    const spt = !p.gk && sd.y >= -0.35 && G.spTag ? G.spTag[p.side] : '';
    if (spt && s > 11) { // the shirt sponsor: its logo mark and name
      const lg = G.spLogo && G.spLogo[p.side];
      if (lg) drawBrandMark(ctx, lg, tx, ty + s * 0.25, s * 0.14, G.spBr[p.side]);
      ctx.fillStyle = lum(kit.shirt) > 0.6 ? 'rgba(17,17,17,0.9)' : 'rgba(255,255,255,0.92)';
      ctx.font = `800 ${Math.max(5, Math.round(s * 0.23))}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(spt, tx, ty + s * 0.52, s * 0.74);
    }
    // arms swing against the legs; sleeves, forearms and hands
    const arm = (sx, phase) => {
      const shx = tx + sx * s * 0.42, shy = ty + s * 0.14;
      const st = moving ? Math.sin(tt + phase) : 0;
      let hx = shx + sx * s * 0.1 + sd.x * s * 0.22 * st * run, hy2 = shy + s * 0.58 - Math.max(0, st) * s * 0.18 * run;
      let ex = shx + sx * s * 0.16 + sd.x * s * 0.1 * st * run, ey = shy + s * 0.3;
      if (celebrating) { hx = shx + sx * s * 0.2; hy2 = shy - s * 0.5; ex = shx + sx * s * 0.2; ey = shy - s * 0.2; }
      else if (p.gk && G.pk && p === G.pk.gk && !diving) { hx = shx + sx * s * (0.62 + Math.sin(G.time * 6) * 0.04); hy2 = shy - s * 0.12; ex = shx + sx * s * 0.4; ey = shy + s * 0.1; }
      else if (p.gk && !moving) { hx = shx + sx * s * 0.3; hy2 = shy + s * 0.34; ex = shx + sx * s * 0.2; ey = shy + s * 0.22; }
      else if (kicking) { hx = shx + sx * s * 0.34 - sd.x * s * 0.15 * kr; hy2 = shy + s * 0.4; ex = shx + sx * s * 0.28; ey = shy + s * 0.22; }
      else if (feint) { hx = shx + sx * s * 0.36; hy2 = shy + s * 0.44; ex = shx + sx * s * 0.26; ey = shy + s * 0.22; }
      ctx.lineCap = 'round';
      ctx.strokeStyle = p.skin; ctx.lineWidth = s * 0.13;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy2); ctx.stroke();
      ctx.strokeStyle = kit.shirt; ctx.lineWidth = s * 0.2;
      ctx.beginPath(); ctx.moveTo(shx, shy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = kit.trim; ctx.lineWidth = s * 0.2;
      ctx.beginPath(); ctx.moveTo(ex - (ex - shx) * 0.12, ey - (ey - shy) * 0.12); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = p.gk ? '#f2f2f2' : p.skin;
      ctx.beginPath(); ctx.arc(hx, hy2, s * (p.gk ? 0.13 : 0.1), 0, Math.PI * 2); ctx.fill();
      ctx.lineCap = 'butt';
    };
    arm(-1, Math.PI); arm(1, 0);
    if (sd.y < -0.35) {
      ctx.fillStyle = lum(kit.shirt) > 0.6 ? '#111111' : kit.trim && cdist(kit.trim, kit.shirt) > 90 ? kit.trim : '#ffffff';
      ctx.font = `800 ${Math.round(s * 0.42)}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(p.num), tx, ty + s * 0.4);
    } else {
      ctx.fillStyle = kit.trim;
      ctx.beginPath(); ctx.moveTo(tx - s * 0.18, ty); ctx.lineTo(tx + s * 0.18, ty); ctx.lineTo(tx, ty + s * 0.2); ctx.closePath(); ctx.fill();
    }
    // neck and head (big, cartoon) that follows the lean
    const hx0 = X + lean * 1.1;
    ctx.fillStyle = p.skin;
    ctx.fillRect(hx0 - s * 0.1, ty - s * 0.12, s * 0.2, s * 0.2);
    const hy = Y - s * 1.9 - jump - bob * 1.2;
    ctx.fillStyle = p.skin;
    ctx.beginPath(); ctx.arc(hx0, hy, s * 0.44, 0, Math.PI * 2); ctx.fill();
    const hg = ctx.createRadialGradient(hx0 - s * 0.16, hy - s * 0.18, s * 0.04, hx0, hy, s * 0.5);
    hg.addColorStop(0, 'rgba(255,255,255,0.3)'); hg.addColorStop(0.55, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(0,0,0,0.26)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx0, hy, s * 0.44, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = ol; ctx.lineWidth = lw; ctx.stroke();
    if (sd.y >= -0.35) { // ears
      ctx.fillStyle = p.skin;
      ctx.beginPath(); ctx.arc(hx0 - s * 0.43, hy + s * 0.05, s * 0.08, 0, Math.PI * 2); ctx.arc(hx0 + s * 0.43, hy + s * 0.05, s * 0.08, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = p.hair;
    if (sd.y < -0.35) { ctx.beginPath(); ctx.arc(hx0, hy - s * 0.02, s * 0.44, 0, Math.PI * 2); ctx.fill(); }
    else if (p.hs === 0) { ctx.beginPath(); ctx.arc(hx0, hy - s * 0.06, s * 0.45, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); }
    else if (p.hs === 1) { ctx.beginPath(); ctx.ellipse(hx0, hy - s * 0.3, s * 0.41, s * 0.2, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (p.hs === 2) { ctx.beginPath(); ctx.arc(hx0, hy - s * 0.12, s * 0.47, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); }
    else if (p.hs === 3) { ctx.beginPath(); ctx.arc(hx0, hy - s * 0.2, s * 0.35, Math.PI, 2 * Math.PI); ctx.fill(); }
    else if (p.hs === 4) { for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(hx0 + i * s * 0.17, hy - s * 0.36 + Math.abs(i) * s * 0.06, s * 0.15, 0, Math.PI * 2); ctx.fill(); } }
    else if (p.hs === 6) { ctx.beginPath(); ctx.arc(hx0, hy - s * 0.1, s * 0.46, Math.PI * 0.98, Math.PI * 2.02); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx0 + s * 0.3, hy - s * 0.52, s * 0.14, s * 0.3, 0.5, 0, Math.PI * 2); ctx.fill(); } // coque
    if (p.beard && sd.y >= -0.35) { ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(hx0, hy + s * 0.08, s * 0.4, 0.15, Math.PI - 0.15); ctx.lineTo(hx0 + s * 0.2, hy + s * 0.1); ctx.quadraticCurveTo(hx0, hy + s * 0.26, hx0 - s * 0.2, hy + s * 0.1); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath(); ctx.ellipse(hx0 - s * 0.14, hy - s * 0.3, s * 0.18, s * 0.08, -0.4, 0, Math.PI * 2); ctx.fill();
    if (sd.y >= -0.35) {
      const ex = sd.x * s * 0.12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(hx0 - s * 0.16 + ex, hy + s * 0.04, s * 0.1, s * 0.11, 0, 0, Math.PI * 2); ctx.ellipse(hx0 + s * 0.16 + ex, hy + s * 0.04, s * 0.1, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(hx0 - s * 0.15 + ex * 1.4, hy + s * 0.05, s * 0.055, 0, Math.PI * 2); ctx.arc(hx0 + s * 0.17 + ex * 1.4, hy + s * 0.05, s * 0.055, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,10,0.7)'; ctx.lineWidth = Math.max(1, s * 0.035);
      const eb = feint || spin || (moving && run > 0.9) ? -0.03 : 0; // focused face when sprinting or dribbling
      ctx.beginPath(); ctx.moveTo(hx0 - s * 0.26 + ex, hy - s * 0.12 + eb * s); ctx.lineTo(hx0 - s * 0.07 + ex, hy - s * 0.09); ctx.moveTo(hx0 + s * 0.07 + ex, hy - s * 0.09); ctx.lineTo(hx0 + s * 0.26 + ex, hy - s * 0.12 + eb * s); ctx.stroke();
      if (celebrating) { ctx.strokeStyle = '#3a1a10'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.beginPath(); ctx.arc(hx0 + ex, hy + s * 0.18, s * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
      else if (kicking && kr > 0.4) { ctx.strokeStyle = '#3a1a10'; ctx.lineWidth = Math.max(1, s * 0.04); ctx.beginPath(); ctx.moveTo(hx0 - s * 0.08 + ex, hy + s * 0.22); ctx.lineTo(hx0 + s * 0.08 + ex, hy + s * 0.22); ctx.stroke(); }
    }
    ctx.restore();
    // a skill move leaves a little trail
    if (sk && !rp) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 * (1 - skP)) + ')'; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X - sdir(sk.dx, sk.dy).x * s * 0.9, Y - s * 0.1 - sdir(sk.dx, sk.dy).y * s * 0.4); ctx.lineTo(X, Y - s * 0.1); ctx.stroke(); ctx.lineCap = 'butt'; }
    ctx.globalAlpha = 1;
    // name tag over the controlled player, the ball carrier and the penalty duel
    if (!G.auto && !rp && (p === G.ctrl || p === G.ball.owner || (G.pk && (p === G.pk.taker || p === G.pk.gk)))) {
      ctx.font = `700 ${Math.round(s * 0.5)}px "Barlow", "Arial", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = Math.max(2, s * 0.12); ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      const tag = p === G.ctrl && !G.pk && !G.shootout ? p.label + ' ' + '★'.repeat(p.stars || 1) : p.label;
      ctx.strokeText(tag, X, hy - s * 0.62);
      ctx.fillStyle = p.team === 0 ? '#ffe14d' : '#ffffff';
      ctx.fillText(tag, X, hy - s * 0.62);
      if (p === G.ctrl && !G.pk && !G.shootout) {
        ctx.fillStyle = '#ffe14d';
        ctx.beginPath(); ctx.moveTo(X - s * 0.2, hy - s * 1.25); ctx.lineTo(X + s * 0.2, hy - s * 1.25); ctx.lineTo(X, hy - s * 1.02); ctx.closePath(); ctx.fill();
      }
    }
  }
  function drawUfo(s) {
    const u = G.ufo, v = u.vic;
    const X = PX(v.x, v.y), Yg = PY(v.x, v.y);
    const descend = clamp(u.t / 0.8, 0, 1), leave = clamp((u.t - 2.2) / 1.0, 0, 1);
    const uy = Yg - s * 9 + descend * s * 3 - leave * s * 14;
    const ux = X + leave * s * 8;
    if (u.t > 0.6 && u.t < 2.2) {
      const g = ctx.createLinearGradient(0, uy, 0, Yg);
      g.addColorStop(0, 'rgba(180,255,140,0.75)'); g.addColorStop(1, 'rgba(180,255,140,0.12)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(ux - s * 0.7, uy + s * 0.3); ctx.lineTo(ux + s * 0.7, uy + s * 0.3); ctx.lineTo(X + s * 1.6, Yg + s * 0.3); ctx.lineTo(X - s * 1.6, Yg + s * 0.3); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath(); ctx.ellipse(ux, uy - s * 0.35, s * 0.9, s * 0.7, 0, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#7b8794';
    ctx.beginPath(); ctx.ellipse(ux, uy, s * 2.2, s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9d3db';
    ctx.beginPath(); ctx.ellipse(ux, uy - s * 0.1, s * 2.0, s * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = (Math.floor(u.t * 8) + i) % 2 ? '#ffe14d' : '#ff5d5d'; ctx.beginPath(); ctx.arc(ux - s * 1.5 + i * s * 0.75, uy + s * 0.1, s * 0.12, 0, Math.PI * 2); ctx.fill(); }
  }
  // mini map of the whole pitch, oriented like the main view
  function drawRadar() {
    if (!rctx || !radar.width || G.shootout) return;
    const W = radar.width, H = radar.height;
    rctx.setTransform(1, 0, 0, 1, 0, 0);
    rctx.clearRect(0, 0, W, H);
    rctx.fillStyle = 'rgba(10,40,20,0.62)';
    rctx.fillRect(0, 0, W, H);
    const land = G.landscape;
    const sx = land ? W / PL : W / PW, sy = land ? H / PW : H / PL;
    const P = (x, y) => (land ? [(PL - y) * sx, x * sy] : [x * sx, y * sy]);
    rctx.strokeStyle = 'rgba(255,255,255,0.45)'; rctx.lineWidth = 1;
    rctx.strokeRect(0.5, 0.5, W - 1, H - 1);
    const [m1x, m1y] = P(0, PL / 2), [m2x, m2y] = P(PW, PL / 2);
    rctx.beginPath(); rctx.moveTo(m1x, m1y); rctx.lineTo(m2x, m2y); rctx.stroke();
    const r = Math.max(2, Math.min(W, H) / 30);
    const dot = (x, y, rad, col) => { const [X, Y] = P(x, y); rctx.fillStyle = col; rctx.beginPath(); rctx.arc(X, Y, rad, 0, Math.PI * 2); rctx.fill(); };
    for (const p of G.players) {
      if (p.out) continue;
      dot(p.x, p.y, r, p.gk ? G.gkKits[p.side].shirt : G.kits[p.side].shirt);
      if (p === G.ctrl) { const [X, Y] = P(p.x, p.y); rctx.strokeStyle = '#ffe14d'; rctx.lineWidth = 1.5; rctx.beginPath(); rctx.arc(X, Y, r + 2, 0, Math.PI * 2); rctx.stroke(); }
    }
    dot(G.ball.x, G.ball.y, r * 0.85, '#ffffff');
  }

  return { start, startShootoutOnly, startTraining, SKINS, HAIRS, netRecv, netActive: () => !!(G && G.online), _create: create, _step: step, _startShootout: startShootout, _startPenalty: startPenalty, _cpuSub: (mn) => cpuSub(mn), _scr: (p) => { const r = cv.getBoundingClientRect(); return { x: r.left + PX(p.x, p.y) * (r.width / cv.width), y: r.top + PY(p.x, p.y) * (r.height / cv.height) }; }, _setPiece: (t, x, y, k) => setPiece(t, x, y, k), _gkRush: startGkRush, _liveTactic: applyLiveTactic2D, _celeb: celebInput, _shoot: shoot, _skill: doSkill, get _G() { return G; } };
})();
// test hook: the browser tests open the page with ?debug=1 to drive the match directly
try { if (/[?&]debug=1\b/.test(location.search)) window.__g2d = Game2D; } catch (e) { /* no location outside the browser */ }
