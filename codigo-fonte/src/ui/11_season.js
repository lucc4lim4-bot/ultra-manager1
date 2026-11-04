/* ===================== trophies celebration & season end ===================== */
function showCelebration() {
  if (!S.celebrate || !S.celebrate.length) return;
  const tr = S.celebrate.shift();
  UI.celebrating = true;
  const t = S.teams[tr.team];
  const wrap = document.createElement('div');
  wrap.className = 'celebrate';
  wrap.innerHTML = `<canvas></canvas><div class="inner">
      <div class="muted up" style="font-size:14px;letter-spacing:0.2em">${esc(tr.name)} · ${esc(tr.season)}</div>
      <canvas class="title-scene" width="640" height="380"></canvas>
      <div class="champ">CAMPEÃO!</div>
      <div class="row" style="justify-content:center;gap:12px;margin-top:12px">${crest(t, 48)}<span class="disp" style="font-size:34px;font-weight:800">${esc(t.n)}</span></div>
      ${tr.coins ? `<div class="coin-pill" style="margin-top:14px;font-size:20px"><span class="coin">F</span>+${tr.coins} FutCoins</div>` : ''}
      <div style="margin-top:22px"><button class="btn primary big" id="cel-ok">Continuar</button></div></div>`;
  document.body.appendChild(wrap);
  const cv = wrap.querySelector('canvas:not(.title-scene)');
  const ctx = cv.getContext('2d');
  const sceneStop = playTitleScene(wrap.querySelector('.title-scene'), t, tr);
  const resize = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
  resize();
  const cols = [t.c1, t.c2, '#ffc54d', '#ffffff'];
  const parts = Array.from({ length: 220 }, () => ({ x: Math.random() * cv.width, y: -Math.random() * cv.height, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 7, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: cols[Math.floor(Math.random() * cols.length)] }));
  let alive = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = () => {
    if (!alive) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of parts) {
      p.x += p.vx * devicePixelRatio; p.y += p.vy * devicePixelRatio; p.a += p.va;
      if (p.y > cv.height + 20) { p.y = -20; p.x = Math.random() * cv.width; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8); ctx.restore();
    }
    requestAnimationFrame(tick);
  };
  if (!reduce) tick();
  wrap.querySelector('#cel-ok').onclick = () => {
    alive = false; sceneStop(); wrap.remove(); UI.celebrating = false;
    if (S.celebrate.length) showCelebration(); else render();
  };
}
act('openSeasonEnd', () => openSeasonEnd());
function openSeasonEnd() {
  const sum = S.pendingEnd;
  if (!sum) return;
  if (S.pl) { plOpenSeasonEnd(sum); return; }
  UI.seasonOpen = true;
  const uid = sum.team;
  const t = S.teams[uid];
  const offers = (sum.offers || []).map((id) => S.teams[id]).filter(Boolean);
  const owned = WALLET.owned.map((k) => Object.values(S.teams).find((x) => x.key === k)).filter((x) => x && validCareerTeam(x.id) && x.id !== uid);
  const jobless = sum.unemployed || S.coach.unemployed;
  openModal(() => modalShell('Fim de temporada', `
    <div class="row wrap" style="gap:16px">${jobless ? '<div class="logo-mark" style="width:64px;height:64px;font-size:22px">UM</div>' : crest(t, 64)}<div class="grow"><div class="disp" style="font-size:30px;font-weight:800">${jobless ? esc(S.coach.name) + ' · sem clube' : esc(t.n)}</div>
      <div class="muted">${jobless ? 'Você terminou a temporada sem clube. Aceite uma das propostas ou continue no mercado de trabalho.' : ''}${sum.league ? `${sum.pos}º lugar na ${esc(sum.league)}` : ''}${sum.relegated ? ' · <b style="color:var(--loss)">rebaixado</b>' : ''}${sum.promoted ? ' · <b style="color:var(--win)">promovido</b>' : ''}</div></div>
      ${sum.coins ? `<div class="coin-pill" style="font-size:18px"><span class="coin">F</span>+${sum.coins}</div>` : ''}</div>
    <div class="grid g3" style="margin-top:16px;${jobless ? 'display:none' : ''}">
      <div class="stat-tile"><div class="k">Objetivo</div><div class="v" style="font-size:18px">${esc(sum.obj)}</div><div style="color:${sum.objOk ? 'var(--win)' : sum.objOk === false ? 'var(--loss)' : 'var(--muted)'};font-weight:700;font-size:13px">${sum.objOk ? 'Cumprido' : sum.objOk === false ? 'Não cumprido' : '—'}</div></div>
      <div class="stat-tile"><div class="k">Confiança</div><div class="v">${sum.conf}%</div></div>
      <div class="stat-tile"><div class="k">Nota do técnico</div><div class="v">${(sum.rating / 10).toFixed(1)}</div></div></div>
    ${sum.titles.length ? `<div class="panel" style="margin-top:14px"><h3>Títulos da temporada</h3><div class="trophy-grid">${sum.titles.map((tr) => `<div class="trophy-card">${trophySVG(tr.key, 56)}<div style="font-weight:700">${esc(tr.name)}</div><div class="muted" style="font-size:12px">+${tr.coins} FutCoins</div></div>`).join('')}</div></div>` : ''}
    ${sum.fired ? `<div class="panel" style="margin-top:14px;border-color:var(--loss)"><b>A diretoria decidiu encerrar o seu contrato.</b> Escolha uma das propostas abaixo ou procure trabalho no mercado.</div>` : ''}
    <h3 style="font-size:22px;margin:18px 0 8px">Propostas para a próxima temporada</h3>
    <div class="choice-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${offers.map((o) => {
      const r = o.isNat ? nationRating(o.code) : teamRating(o.id);
      let where = '';
      if (S.mode === 'ultra') { const dv = S.ultra.div.findIndex((d) => d.includes(o.id)); where = dv >= 0 ? `Ultra Liga ${dv + 1}` : 'Banco'; }
      else if (S.mode === 'normal') { const lg = S.normal.find((l) => l.teams.includes(o.id) || l.bank.includes(o.id)); where = lg ? (lg.teams.includes(o.id) ? lg.name : LEAGUE_NAMES2[lg.id] || '2ª divisão') : ''; }
      return `<button class="offer" data-a="endPick" data-id="${o.id}"><div class="row">${crest(o, 40)}<div class="grow"><div class="tn" style="font-size:20px">${esc(o.n)}</div><div class="muted" style="font-size:12px">${esc(where)}</div></div></div><div class="row">${starStr(r)}</div><span class="btn xs primary" style="align-self:flex-start">Aceitar</span></button>`;
    }).join('')}</div>
    ${owned.length ? `<div class="panel" style="margin-top:14px"><h3>Meus times <span class="sub">comprados com FutCoins</span></h3><div class="row wrap">${owned.map((o) => `<button class="btn" data-a="endPick" data-id="${o.id}">${crest(o, 22)} ${esc(o.n)}</button>`).join('')}</div></div>` : ''}`,
    `<button class="btn" data-a="openStore">🛒 Comprar times</button><span class="grow"></span>${sum.fired || jobless ? '<button class="btn" data-a="endStay">Ficar sem clube</button>' : `<button class="btn primary" data-a="endStay">Continuar ${esc(tA(t, 'no'))}</button>`}`), { size: 'wide', locked: true });
}
act('endPick', (el) => {
  const id = +el.dataset.id;
  closeSeasonEnd({ team: id });
  UI.seasonOpen = false;
  closeAllModals();
  render();
  toast(`Você agora comanda ${tA(id)}!`);
  saveGame(S.id);
});
act('endStay', () => {
  closeSeasonEnd(null);
  UI.seasonOpen = false;
  closeAllModals();
  render();
  saveGame(S.id);
});

// The cutscene of the title: the squad walks in, forms up on two rows and the captain lifts the cup while everybody jumps
function playTitleScene(cv, team, tr) {
  if (!cv) return () => {};
  const c = cv.getContext('2d'), W = cv.width, H = cv.height;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(trophySVG(tr.key, 200).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
  const c1 = team.c1 || '#c8102e', c2 = team.c2 || '#ffffff';
  const sq = (typeof squadOf === 'function' ? squadOf(team.id) : []).slice().sort((a, b) => b.o - a.o).slice(0, 11);
  const skins = ['#f1c9a0', '#e0ac7e', '#c68a5b', '#8d5a3a', '#5e3b24'], hairs = ['#1c1410', '#3a2414', '#6b4a2b', '#c9a24a', '#111'];
  const fig = Array.from({ length: 11 }, (_, i) => {
    const pl = sq[i], h = pl ? hashStr(pl.n + '|' + pl.id) : i * 7919;
    const row = i === 0 ? 0 : i <= 5 ? 1 : 2, idx = i === 0 ? 0 : i <= 5 ? i - 1 : i - 6;
    const cnt = row === 1 ? 5 : 6;
    const tx = row === 0 ? W / 2 : W / 2 + (idx - (cnt - 1) / 2) * (row === 1 ? 92 : 80) + (row === 1 && Math.abs(idx - 2) < 0.1 ? 0 : 0);
    const ty = row === 0 ? H - 70 : row === 1 ? H - 112 : H - 150;
    return { i, row, tx: row === 1 && idx === 2 ? tx + 0 : tx, ty, x: i % 2 ? -60 : W + 60, y: ty, skin: skins[h % 5], hair: hairs[(h >> 4) % 5], ph: (h % 100) / 16, delay: i * 0.1, name: pl ? pl.s || pl.n : '' };
  });
  // the captain steps out of the front row so the cup is not hidden
  const t0 = performance.now();
  let alive = true;
  const body = (f, jump, armsUp, scale) => {
    const x = f.x, y = f.y - jump, s = scale;
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x, f.y + 4, 20 * s, 7 * s, 0, 0, 7); c.fill();
    c.fillStyle = '#f2f2f2'; c.fillRect(x - 11 * s, y - 20 * s, 8 * s, 20 * s); c.fillRect(x + 3 * s, y - 20 * s, 8 * s, 20 * s);
    c.fillStyle = c2; c.fillRect(x - 11 * s, y - 14 * s, 8 * s, 4 * s); c.fillRect(x + 3 * s, y - 14 * s, 8 * s, 4 * s);
    c.fillStyle = c2 === '#ffffff' ? '#222' : c2; c.fillRect(x - 13 * s, y - 32 * s, 26 * s, 14 * s);
    c.fillStyle = c1; c.beginPath(); c.roundRect ? c.roundRect(x - 15 * s, y - 62 * s, 30 * s, 32 * s, 6 * s) : c.rect(x - 15 * s, y - 62 * s, 30 * s, 32 * s); c.fill();
    c.fillStyle = c2; c.fillRect(x - 15 * s, y - 50 * s, 30 * s, 5 * s);
    c.strokeStyle = f.skin; c.lineWidth = 6 * s; c.lineCap = 'round';
    c.beginPath();
    if (armsUp) { c.moveTo(x - 15 * s, y - 57 * s); c.lineTo(x - 24 * s, y - 84 * s); c.moveTo(x + 15 * s, y - 57 * s); c.lineTo(x + 24 * s, y - 84 * s); }
    else { c.moveTo(x - 15 * s, y - 57 * s); c.lineTo(x - 20 * s, y - 38 * s); c.moveTo(x + 15 * s, y - 57 * s); c.lineTo(x + 20 * s, y - 38 * s); }
    c.stroke(); c.lineCap = 'butt';
    c.fillStyle = f.skin; c.beginPath(); c.arc(x, y - 74 * s, 13 * s, 0, 7); c.fill();
    c.fillStyle = f.hair; c.beginPath(); c.arc(x, y - 77 * s, 13.5 * s, Math.PI * 1.02, Math.PI * 1.98); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(x - 4.5 * s, y - 73 * s, 1.6 * s, 0, 7); c.arc(x + 4.5 * s, y - 73 * s, 1.6 * s, 0, 7); c.fill();
    c.strokeStyle = '#7a2a1a'; c.lineWidth = 1.5 * s; c.beginPath(); c.arc(x, y - 70 * s, 5 * s, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  };
  const frame = (now) => {
    if (!alive) return;
    const t = (now - t0) / 1000;
    c.clearRect(0, 0, W, H);
    // the podium floor
    const g = c.createLinearGradient(0, H - 190, 0, H); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.08)');
    c.fillStyle = g; c.fillRect(0, H - 190, W, 190);
    for (const f of fig) {
      const wt = clamp((t - f.delay) / 1.4, 0, 1), e = 1 - Math.pow(1 - wt, 3);
      f.x = (f.i % 2 ? -60 : W + 60) + (f.tx - (f.i % 2 ? -60 : W + 60)) * e;
      f.y = f.ty + (f.row === 0 ? Math.min(0, 0) : 0);
    }
    const lift = clamp((t - 2.0) / 1.0, 0, 1);
    const order = fig.slice().sort((a, b) => a.row === b.row ? 0 : b.row - a.row); // back row first
    for (const f of order) {
      const walking = t - f.delay < 1.4;
      const hop = walking ? Math.abs(Math.sin(t * 9 + f.ph)) * 6 : t > 3.0 ? Math.abs(Math.sin(t * 6 + f.ph)) * 20 : 0;
      body(f, hop, t > 2.6 || (f.i === 0 && lift > 0.2), f.row === 0 ? 1.25 : f.row === 1 ? 1.1 : 1);
    }
    // the cup rises over the captain's head, then shines
    const cap = fig[0];
    if (img.complete && img.naturalWidth) {
      const baseY = cap.y - 120, up = lift * 70, size = 92 + lift * 18;
      const cx = cap.x, cy = baseY - up - (t > 3 ? Math.abs(Math.sin(t * 6)) * 8 : 0);
      if (t > 2.0) { const gl = c.createRadialGradient(cx, cy, 5, cx, cy, 90); gl.addColorStop(0, `rgba(255,236,160,${0.5 * lift})`); gl.addColorStop(1, 'rgba(255,236,160,0)'); c.fillStyle = gl; c.fillRect(cx - 100, cy - 100, 200, 200); }
      c.globalAlpha = t < 1.6 ? 0 : clamp((t - 1.6) / 0.4, 0, 1);
      c.drawImage(img, cx - size / 2, cy - size * 0.75, size, size);
      c.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return () => { alive = false; };
}
