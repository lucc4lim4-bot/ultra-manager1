/* ===================== training drills (penalties, free kicks, passes) and look customisation (player and coach) ===================== */
const TR_DEF = [
  ['pen', '🥅', 'Pênaltis', '10 cobranças contra o goleiro. Mire com o direcional e segure CHUTE: força demais vai por cima.', 'Finalização'],
  ['free', '🎯', 'Faltas', '8 faltas de lugares diferentes, com barreira e goleiro. CHUTE bate por cima da barreira.', 'Finalização'],
  ['pass', '🅿️', 'Passes', '10 passes para o companheiro marcado com o anel azul. PASSE é rasteiro, LANÇAR vai por cima.', 'Passe'],
];
function trStats() { S.train = S.train || {}; return S.train; }
act('openTraining', () => {
  closeAllModals();
  openModal(() => {
    const ts = trStats();
    const cards = TR_DEF.map(([k, ic, nm, tx, attr]) => {
      const r = ts[k], pl = S.pl;
      const wait = pl && pl.drill && pl.drill[k] != null ? Math.max(0, 7 - (S.date - pl.drill[k])) : 0;
      return `<div class="panel" style="text-align:left"><div class="row" style="gap:12px;align-items:flex-start"><div style="font-size:34px;line-height:1">${ic}</div>
        <div class="grow"><b style="font-size:18px">${nm}</b><div class="muted" style="font-size:13px;margin:4px 0 8px">${tx}</div>
        <div class="muted" style="font-size:12px">${r ? `Melhor: <b>${r.best}/${r.total}</b> · Última: ${r.last}/${r.total} · ${r.n} ${r.n === 1 ? 'treino' : 'treinos'}` : 'Ainda não treinado.'}${pl ? ` · dá XP de ${attr}${wait ? ` (próximo XP em ${wait} ${wait === 1 ? 'dia' : 'dias'})` : ''}` : ''}</div></div>
        <button class="btn primary" data-a="trStart" data-k="${k}">Treinar</button></div></div>`;
    }).join('');
    return modalShell('🎯 Treinos', `<p class="muted" style="margin:0 0 12px">${S.pl ? `Treine com ${esc(plPlayer().n)}. Cada tipo dá XP de atributo uma vez por semana, conforme o acerto.` : 'Treinos de bola parada com o melhor batedor e passador do seu elenco.'}</p><div class="col" style="gap:10px">${cards}</div>`, '<button class="btn" data-a="closeModal">Fechar</button>');
  }, { size: 'narrow' });
});
act('trStart', (el) => {
  const kind = el.dataset.k;
  g2Defaults();
  closeAllModals();
  const uid = S.user.team, lc = typeof userLeagueComp === 'function' ? userLeagueComp() : null;
  let opp = lc && lc.teams ? lc.teams.find((id) => id !== uid) : 0;
  if (!opp) opp = +Object.keys(S.teams).find((id) => +id !== uid && !S.teams[id].isNat === !S.teams[uid].isNat);
  const m = { id: 'tr' + (Date.now() % 1e7), h: uid, a: opp, c: 0, d: S.date, r: 0, fr: true, tr: true };
  if (S.pl) m.pls = { r: 'start', min: 0 };
  S.matches[m.id] = m;
  const st = startMatchState(m, { user: uid });
  Game2D.startTraining(kind, m, st, { diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: false, pid: S.pl ? S.pl.pid : 0 }, (res) => {
    delete S.matches[m.id];
    trDone(res);
  });
});
function trDone(res) {
  render();
  if (!res) { toast('Treino encerrado.'); return; }
  const ts = trStats(), r = ts[res.kind] || { best: 0, n: 0, total: res.total };
  r.best = Math.max(r.best || 0, res.score); r.last = res.score; r.n = (r.n || 0) + 1; r.total = res.total;
  ts[res.kind] = r;
  let extra = '';
  if (S.pl) {
    const d = plDrill(res.kind, res.score, res.total);
    if (d && d.xp) extra = ` +${d.xp.toFixed(1)} XP de ${plAttrNames(plPlayer())[d.i]}.`;
    else if (d && d.wait) extra = ` Sem XP extra: o próximo vem em ${d.wait} ${d.wait === 1 ? 'dia' : 'dias'}.`;
  }
  toast(`Treino concluído: ${res.score}/${res.total} (nota ${res.grade}).${extra}`);
  render();
}

// ------------------------------------------------------------------ look data
const LK_SKINS = ['#f3cfb0', '#e8b894', '#d29b6f', '#b07a4e', '#8a5733', '#603a22'];
const LK_HAIRS = ['#1d1510', '#2e2018', '#5a3a22', '#8a5a2e', '#d1a85c', '#0e0e0e', '#9a9a9a'];
const LK_HS = ['Curto', 'Topete', 'Cheio', 'Baixo', 'Black', 'Careca', 'Coque'];
const LK_BOOTS = ['#16181a', '#ffffff', '#ff5a1f', '#ffd21f', '#2f7bff', '#2fd27a', '#ff4fa3', '#a35cff'];
const LK_SUITS = ['#22304a', '#1b1b1b', '#5b6770', '#6b2b2b', '#2f5a3a', '#7a6a4f'];
const LK_TIES = ['#c0392b', '#ffd24d', '#2f7bff', '#ffffff', '#1b1b1b', '#2fd27a'];
const LK_STYLES = ['Equilibrado', 'Ofensivo', 'Defensivo', 'Retranca', 'Formador de jovens', 'Motivador'];
function lkDefaultPlayer(p) {
  const h = hashStr(p.n);
  const dark = ['NGA', 'GHA', 'CIV', 'SEN', 'CMR', 'MLI', 'COD'].includes(p.nat);
  return { skin: dark ? 3 + ((h >>> 0) % 3) : p.nat === "BRA" || p.nat === "COL" ? (h >>> 0) % 6 : (h >>> 0) % 3, hair: (h >>> 4) % 6, hs: (h >>> 7) % 4, beard: false, boots: LK_BOOTS[0], num: p.num || 10, nick: p.s || '' };
}
function lkDefaultCoach() {
  const h = hashStr(S.coach.name || 'T');
  return { skin: (h >>> 0) % 4, hair: (h >>> 3) % 7, hs: (h >>> 6) % 4, beard: (h >>> 9) % 3 === 0, glasses: (h >>> 11) % 4 === 0, suit: LK_SUITS[(h >>> 2) % LK_SUITS.length], tie: LK_TIES[(h >>> 5) % LK_TIES.length] };
}
function ensureCoachLook() { if (S.coach && !S.coach.look) S.coach.look = lkDefaultCoach(); return S.coach && S.coach.look; }

// head-and-shoulders avatar for a look (SVG)
function lookAvatar(lk, o = {}) {
  const size = o.size || 120, kit = o.kit || '#2f7bff', kit2 = o.kit2 || '#ffffff';
  const skin = LK_SKINS[lk.skin] || LK_SKINS[2], hair = LK_HAIRS[lk.hair] || LK_HAIRS[0], hs = lk.hs == null ? 0 : lk.hs;
  let body;
  if (o.coach) body = `<path d="M12 100 C14 76 30 68 50 68 C70 68 88 76 88 100Z" fill="${lk.suit || '#22304a'}"/><path d="M41 68 L50 84 L59 68Z" fill="#f2f2f2"/><path d="M48 72 L52 72 L53 90 L50 94 L47 90Z" fill="${lk.tie || '#c0392b'}"/>`;
  else body = `<path d="M14 100 C16 76 30 68 50 68 C70 68 84 76 86 100Z" fill="${kit}"/><path d="M40 68 L50 80 L60 68" fill="${kit2}"/>${o.num ? `<text x="50" y="97" text-anchor="middle" font-size="15" font-weight="800" fill="${kit2}" font-family="Arial Narrow,sans-serif">${esc(String(o.num))}</text>` : ''}`;
  const hairSvg = hs === 0 ? `<path d="M33 38 C33 20 67 20 67 38 C64 30 36 30 33 38Z" fill="${hair}"/>`
    : hs === 1 ? `<path d="M32 40 C30 16 70 16 68 40 C66 26 34 26 32 40Z" fill="${hair}"/><ellipse cx="50" cy="22" rx="14" ry="7" fill="${hair}"/>`
      : hs === 2 ? `<path d="M31 42 C28 14 72 14 69 42 C66 28 34 28 31 42Z" fill="${hair}"/>`
        : hs === 3 ? `<path d="M34 34 C36 24 64 24 66 34 L66 30 C60 24 40 24 34 30Z" fill="${hair}"/>`
          : hs === 4 ? [-2, -1, 0, 1, 2].map((i) => `<circle cx="${50 + i * 7}" cy="${24 + Math.abs(i) * 2.5}" r="7" fill="${hair}"/>`).join('')
            : hs === 6 ? `<path d="M33 38 C33 20 67 20 67 38 C64 30 36 30 33 38Z" fill="${hair}"/><circle cx="62" cy="17" r="7" fill="${hair}"/>` : '';
  const beard = lk.beard ? `<path d="M33 46 C34 66 66 66 67 46 C62 56 56 56 50 56 C44 56 38 56 33 46Z" fill="${hair}"/>` : '';
  const glasses = lk.glasses ? `<g fill="none" stroke="#111" stroke-width="1.6"><circle cx="43" cy="44" r="5.5"/><circle cx="57" cy="44" r="5.5"/><path d="M48.5 44 L51.5 44"/></g>` : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.06)"/>${body}
    <rect x="43" y="56" width="14" height="14" rx="5" fill="${skin}"/><ellipse cx="50" cy="42" rx="17" ry="20" fill="${skin}"/>${hairSvg}${beard}
    <circle cx="44" cy="44" r="1.8" fill="#1a1a1a"/><circle cx="56" cy="44" r="1.8" fill="#1a1a1a"/>${glasses}<path d="M45 ${lk.beard ? 51 : 53} Q50 ${lk.beard ? 54 : 56} 55 ${lk.beard ? 51 : 53}" stroke="${lk.beard ? '#e8e8e8' : '#5a3a2a'}" stroke-width="1.5" fill="none"/></svg>`;
}
// the player's saved look overrides the generated avatar everywhere
(() => {
  const orig = playerAvatar;
  playerAvatar = function (p, size) {
    if (S.pl && S.pl.look && p && p.id === S.pl.pid) {
      const t = S.teams[p.t] || null;
      return lookAvatar(S.pl.look, { size: size || 84, kit: t ? t.c1 : '#5b6b72', kit2: t ? t.c2 : '#cfd8dc', num: p.num });
    }
    return orig(p, size);
  };
})();

// ------------------------------------------------------------------ editor
function lkSwatches(key, list, cur, label) {
  return `<div><div class="muted up" style="font-size:11px;margin-bottom:6px">${label}</div><div class="row wrap" style="gap:8px">${list.map((c, i) => {
    const v = typeof cur === 'number' ? i : c;
    return `<button class="swatch ${cur === v ? 'on' : ''}" style="background:${c}" data-a="lkSet" data-k="${key}" data-v="${v}" aria-label="${label} ${i + 1}"></button>`;
  }).join('')}</div></div>`;
}
function lkTogBtn(key, label, on) { return `<button class="btn ${on ? 'gold' : ''}" data-a="lkTog" data-k="${key}">${label}: ${on ? 'sim' : 'não'}</button>`; }
function lkHtml() {
  const L = UI.lk, v = L.v;
  if (L.kind === 'pl') {
    const p = plPlayer(), t = S.teams[p.t];
    return modalShell('🎨 Personalizar jogador', `<div class="row wrap" style="gap:18px;align-items:center;justify-content:center">${lookAvatar(v, { size: 150, kit: t.c1, kit2: t.c2, num: v.num })}
      <div class="col grow" style="gap:6px;min-width:200px"><div class="field"><label for="lk-nick">Nome na camisa e na tela</label><input id="lk-nick" class="input" maxlength="14" value="${esc(v.nick)}" placeholder="${esc(p.n)}" data-a="lkNick" data-live="1"></div>
      <div class="field"><label for="lk-num">Número</label><input id="lk-num" class="input" type="number" min="1" max="99" value="${v.num}" data-a="lkNum" data-live="1"></div></div></div>
      <div class="col" style="gap:14px;margin-top:14px">${lkSwatches('skin', LK_SKINS, v.skin, 'Pele')}${lkSwatches('hair', LK_HAIRS, v.hair, 'Cor do cabelo')}
      <div><div class="muted up" style="font-size:11px;margin-bottom:6px">Penteado</div><div class="seg wrapseg">${LK_HS.map((n, i) => `<button class="${v.hs === i ? 'on' : ''}" data-a="lkSet" data-k="hs" data-v="${i}">${n}</button>`).join('')}</div></div>
      <div>${lkTogBtn('beard', '🧔 Barba', v.beard)}</div>${lkSwatches('boots', LK_BOOTS, v.boots, 'Chuteira')}</div>`,
    '<button class="btn" data-a="lkRandom">🎲 Sortear</button><button class="btn" data-a="closeModal">Cancelar</button><button class="btn gold" data-a="lkSave">Salvar</button>');
  }
  return modalShell('🧢 Perfil do técnico', `<div class="row wrap" style="gap:18px;align-items:center;justify-content:center">${lookAvatar(v, { size: 150, coach: true })}
    <div class="col grow" style="gap:6px;min-width:200px"><div class="field"><label for="lk-name">Nome</label><input id="lk-name" class="input" maxlength="40" value="${esc(v.name)}" data-a="lkName" data-live="1"></div>
    <div class="field"><label for="lk-nat">Nacionalidade</label><select id="lk-nat" class="input" data-a="lkNat">${PL_NATS.map(([c, n]) => `<option value="${c}" ${v.nat === c ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <div class="field"><label for="lk-style">Estilo</label><select id="lk-style" class="input" data-a="lkStyle">${LK_STYLES.map((n) => `<option ${v.style === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div></div>
    <div class="col" style="gap:14px;margin-top:14px">${lkSwatches('skin', LK_SKINS, v.skin, 'Pele')}${lkSwatches('hair', LK_HAIRS, v.hair, 'Cor do cabelo')}
    <div><div class="muted up" style="font-size:11px;margin-bottom:6px">Penteado</div><div class="seg wrapseg">${LK_HS.slice(0, 4).map((n, i) => `<button class="${v.hs === i ? 'on' : ''}" data-a="lkSet" data-k="hs" data-v="${i}">${n}</button>`).join('')}<button class="${v.hs === 5 ? 'on' : ''}" data-a="lkSet" data-k="hs" data-v="5">Careca</button></div></div>
    <div class="row wrap" style="gap:8px">${lkTogBtn('beard', '🧔 Barba', v.beard)}${lkTogBtn('glasses', '👓 Óculos', v.glasses)}</div>${lkSwatches('suit', LK_SUITS, v.suit, 'Terno')}${lkSwatches('tie', LK_TIES, v.tie, 'Gravata')}</div>
    <p class="muted" style="font-size:12px;margin:12px 0 0">Seu técnico aparece na lateral do campo nos jogos em 2D e comemora os gols.</p>`,
  '<button class="btn" data-a="lkRandom">🎲 Sortear</button><button class="btn" data-a="closeModal">Cancelar</button><button class="btn gold" data-a="lkSave">Salvar</button>');
}
act('openPlLook', () => {
  const p = plPlayer(); if (!p) return;
  UI.lk = { kind: 'pl', v: Object.assign(lkDefaultPlayer(p), S.pl.look || {}) };
  closeAllModals();
  openModal(() => lkHtml(), { size: 'narrow' });
});
act('openCoachLook', () => {
  ensureCoachLook();
  UI.lk = { kind: 'coach', v: Object.assign({ name: S.coach.name, nat: S.coach.nat || 'BRA', style: S.coach.style || 'Equilibrado' }, S.coach.look) };
  closeAllModals();
  openModal(() => lkHtml(), { size: 'narrow' });
});
act('lkSet', (el) => { UI.lk.v[el.dataset.k] = isNaN(+el.dataset.v) ? el.dataset.v : +el.dataset.v; refreshModal(); });
act('lkTog', (el) => { UI.lk.v[el.dataset.k] = !UI.lk.v[el.dataset.k]; refreshModal(); });
act('lkNick', (el) => { UI.lk.v.nick = el.value.slice(0, 14); });
act('lkNum', (el) => { UI.lk.v.num = clamp(Math.round(+el.value) || 1, 1, 99); });
act('lkName', (el) => { UI.lk.v.name = el.value.slice(0, 40); });
act('lkNat', (el) => { UI.lk.v.nat = el.value; });
act('lkStyle', (el) => { UI.lk.v.style = el.value; });
act('lkRandom', () => {
  const v = UI.lk.v, r = (n) => Math.floor(Math.random() * n);
  v.skin = r(6); v.hair = r(7); v.beard = Math.random() < 0.3;
  if (UI.lk.kind === 'pl') { v.hs = r(7); v.boots = LK_BOOTS[r(LK_BOOTS.length)]; } else { v.hs = [0, 1, 2, 3, 5][r(5)]; v.glasses = Math.random() < 0.3; v.suit = LK_SUITS[r(LK_SUITS.length)]; v.tie = LK_TIES[r(LK_TIES.length)]; }
  refreshModal();
});
act('lkSave', () => {
  const L = UI.lk, v = L.v;
  if (L.kind === 'pl') {
    const p = plPlayer();
    const num = clamp(Math.round(+v.num) || 1, 1, 99);
    const mate = Object.values(S.players).find((q) => q.t === p.t && q.id !== p.id && q.num === num);
    if (mate) mate.num = p.num || (num === 10 ? 11 : 10); // the teammate who wore it gets his number
    p.num = num;
    p.s = (v.nick || '').trim() || p.s;
    S.pl.look = { skin: v.skin, hair: v.hair, hs: v.hs, beard: !!v.beard, boots: v.boots, num, nick: (v.nick || '').trim() };
    toast('Jogador personalizado.');
  } else {
    S.coach.name = (v.name || '').trim() || S.coach.name;
    S.coach.nat = v.nat; S.coach.style = v.style;
    S.coach.look = { skin: v.skin, hair: v.hair, hs: v.hs, beard: !!v.beard, glasses: !!v.glasses, suit: v.suit, tie: v.tie };
    toast('Perfil do técnico salvo.');
  }
  closeAllModals(); render();
});

// ------------------------------------------------------------------ admin: inject money with a code
const ADMIN_CODE = '071212';
const ADMIN_AMOUNTS = [[1e6, '€1 mi'], [10e6, '€10 mi'], [50e6, '€50 mi'], [100e6, '€100 mi'], [500e6, '€500 mi'], [1e9, '€1 bi']];
act('adminOpen', () => {
  closeAllModals();
  UI.adm = { ok: false, amt: 50e6 };
  openModal(() => {
    const A = UI.adm, t = S.teams[S.user.team];
    if (!A.ok) return modalShell('🔐 Admin', `<p class="muted" style="margin:0 0 12px">Digite o código para liberar o painel.</p><div class="field"><label for="adm-code">Código</label><input id="adm-code" class="input" type="password" inputmode="numeric" autocomplete="off" maxlength="12" data-a="admCode" data-live="1"></div><div id="adm-msg" class="muted" style="color:var(--loss);min-height:20px;margin-top:6px"></div>`, '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn gold" data-a="admCheck">Entrar</button>');
    return modalShell('🔐 Admin', `<p style="margin:0 0 4px">Caixa de <b>${esc(t.n)}</b>: <b>${money(t.budget)}</b></p><p class="muted" style="margin:0 0 12px">Escolha o valor a injetar.</p>
      <div class="row wrap" style="gap:8px">${ADMIN_AMOUNTS.map(([v, l]) => `<button class="btn ${A.amt === v ? 'gold' : ''}" data-a="admAmt" data-v="${v}">${l}</button>`).join('')}</div>`,
    '<button class="btn" data-a="closeModal">Fechar</button><button class="btn gold" data-a="admInject">💰 Injetar</button>');
  }, { size: 'narrow' });
});
act('admCode', (el) => { UI.adm.code = el.value; });
act('admCheck', () => {
  const v = ($('#adm-code').value || '').trim();
  if (v === ADMIN_CODE) { UI.adm.ok = true; refreshModal(); } else { const m = $('#adm-msg'); if (m) m.textContent = 'Código incorreto.'; }
});
act('admAmt', (el) => { UI.adm.amt = +el.dataset.v; refreshModal(); });
act('admInject', async () => {
  if (!UI.adm || !UI.adm.ok) return;
  const t = S.teams[S.user.team];
  t.budget += UI.adm.amt;
  await saveGame(S.id);
  toast(`${money(UI.adm.amt)} injetados. Caixa: ${money(t.budget)}.`);
  refreshModal(); render();
});
