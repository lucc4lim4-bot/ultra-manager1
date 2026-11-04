/* ===================== friendly match: any two teams of the game, played in the 2D match against the computer ===================== */
act('openFriendly', () => {
  UI.fr = { step: 'setup', era: 2026, kind: 'club', a: 0, b: 0, slot: 'a', q: '', grp: 'all', loaded: null, result: null };
  UI.screen = 'friendly';
  render();
});
act('frBack', () => { UI.fr = null; UI.screen = 'start'; render(); });
act('frSet', (el) => { UI.fr[el.dataset.k] = el.dataset.v === '2016' || el.dataset.v === '2021' || el.dataset.v === '2026' ? +el.dataset.v : el.dataset.v; render(); });
act('frLoad', async () => {
  const f = UI.fr;
  setLoading('Carregando elencos de ' + f.era + '…', 0.2);
  try {
    await loadEra(f.era);
    setLoading('Montando os times…', 0.6);
    await new Promise((r) => setTimeout(r, 20));
    await createWorld({ era: f.era, mode: f.kind === 'national' ? 'national' : 'normal', coachName: 'Amistoso', coachAge: 40 });
    S.coach.unemployed = false;
    UI.wiz = { anyList: null, anyQ: '', anyG: 'all' };
    f.loaded = { era: f.era, kind: f.kind }; f.step = 'pick'; f.a = 0; f.b = 0; f.slot = 'a'; f.q = ''; f.grp = 'all';
    UI.screen = 'friendly';
    render();
  } catch (e) {
    console.error(e);
    UI.screen = 'friendly'; f.step = 'setup'; render(); toast(e.message, true);
  }
});
act('frSlot', (el) => { UI.fr.slot = el.dataset.v; render(); });
act('frGrp', (el) => { UI.fr.grp = el.value; render(); });
act('frQ', (el) => { UI.fr.q = el.value; const box = $('#fr-list'); if (box) box.innerHTML = frListHtml(); });
act('frPick', (el) => {
  const f = UI.fr, id = +el.dataset.id;
  if (f.slot === 'a') { f.a = id; if (f.b === id) f.b = 0; f.slot = f.b ? 'a' : 'b'; } else { f.b = id; if (f.a === id) f.a = 0; f.slot = f.a ? 'b' : 'a'; }
  render();
});
act('frSwap', () => { const f = UI.fr; [f.a, f.b] = [f.b, f.a]; render(); });
act('frRandom', () => {
  const f = UI.fr, rows = anyClubEntries();
  const pickRow = () => rows[Math.floor(Math.random() * rows.length)].id;
  f.a = pickRow(); do { f.b = pickRow(); } while (f.b === f.a && rows.length > 1);
  render();
});
act('frOpt', (el) => {
  const k = el.dataset.k;
  let v = el.dataset.v;
  if (k === 'len') v = +v;
  G2PREF[k] = v; saveG2Pref(); render();
});
act('frPlay', () => frStart());
act('frAgain', () => frStart());
act('frChange', () => { UI.fr.step = 'pick'; UI.fr.result = null; render(); });

function frStart() {
  const f = UI.fr;
  if (!f || !f.a || !f.b || f.a === f.b) return;
  g2Defaults();
  ensureCoachLook();
  S.user.team = f.a; S.coach.unemployed = false;
  for (const id of [f.a, f.b]) { const t = S.teams[id]; if (t && t.isNat) autoCallUp(t.code, true); } // national squads are called up for the match
  S.date = dayOf(S.era, 3, 15);
  const m = { id: 'fr' + (Date.now() % 1e7), h: f.a, a: f.b, c: 0, d: S.date, r: 0, fr: true };
  S.matches[m.id] = m;
  const st = startMatchState(m, { user: f.a });
  f.step = 'playing'; f.result = null;
  UI.screen = 'friendly'; render();
  Game2D.start(m, st, { minutes: G2PREF.len, diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: G2PREF.replay }, () => frDone(m, st));
}
function frDone(m, st) {
  if (!st.decided) { st.min = Math.max(st.min || 0, 90 + st.stoppage[1]); st.half = 2; }
  st.done = true;
  delete S.matches[m.id];
  if (!UI.fr) return;
  UI.fr.step = 'result'; UI.fr.result = { m, st };
  UI.screen = 'friendly'; render(); window.scrollTo(0, 0);
}

function frTeamCard(id, slot, label) {
  const f = UI.fr, t = id ? S.teams[id] : null, on = f.slot === slot;
  return `<button class="panel" style="text-align:left;cursor:pointer;border:2px solid ${on ? 'var(--gold, #ffc54d)' : 'transparent'};flex:1;min-width:220px" data-a="frSlot" data-v="${slot}">
    <div class="muted up" style="font-size:11px">${label}</div>
    ${t ? `<div class="row" style="gap:10px;margin-top:6px">${crest(t, 44)}<div><div class="disp" style="font-size:22px;font-weight:800">${esc(t.n)}</div><div class="muted" style="font-size:13px">${starStr(t.isNat ? nationRating(t.code) : teamRating(t.id))} força ${(t.isNat ? nationRating(t.code) : teamRating(t.id)).toFixed(1)}</div></div></div>` : '<div class="muted" style="margin-top:10px">Escolha na lista abaixo</div>'}
  </button>`;
}
function frGroups(rows) {
  const present = [...new Set(rows.map((r) => r.grp))];
  return present;
}
function frListHtml() {
  const f = UI.fr;
  const q = strip((f.q || '').trim());
  const rows = anyClubEntries().filter((r) => (f.grp === 'all' || r.grp === f.grp) && (!q || r.q.includes(q)));
  if (!rows.length) return '<div class="empty">Nenhum resultado para essa busca.</div>';
  const shown = rows.slice(0, 60);
  return `<div class="any-grid">${shown.map((r) => {
    const t = S.teams[r.id];
    const taken = r.id === f.a || r.id === f.b;
    return `<button class="any-item" style="${taken ? 'opacity:0.45' : ''}" data-a="frPick" data-id="${r.id}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${esc(r.where)}</span></span><span class="sc">${starStr(r.r)}<span class="muted">força ${r.r.toFixed(1)}</span></span></button>`;
  }).join('')}</div>${rows.length > shown.length ? `<p class="muted" style="font-size:13px;margin:10px 0 0">Mostrando ${shown.length} de ${rows.length}. Digite o nome ou escolha a liga para achar os outros.</p>` : ''}`;
}
function frSeg(k, opts) {
  return `<div class="seg">${opts.map(([v, l]) => `<button class="${String(G2PREF[k]) === String(v) ? 'on' : ''}" data-a="frOpt" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
}
function viewFriendly() {
  const f = UI.fr;
  if (!f) return viewStart();
  const head = `<div class="row wrap" style="margin-bottom:14px"><button class="btn" data-a="frBack">← Menu</button><h2 style="font-size:34px;font-weight:800;margin:0" class="grow">Amistoso</h2></div>`;
  if (f.step === 'setup') {
    return `<div class="page" style="max-width:900px;margin:0 auto;padding:18px">${head}
      <div class="panel"><p style="margin:0 0 14px">Jogue uma partida 2D contra o computador com <b>qualquer time do jogo</b>: clubes de todas as ligas ou seleções. Escolha a época dos elencos.</p>
        <div class="muted up" style="font-size:11px">Época</div>
        <div class="seg" style="margin:6px 0 14px">${[2016, 2021, 2026].map((y) => `<button class="${f.era === y ? 'on' : ''}" data-a="frSet" data-k="era" data-v="${y}">${y}</button>`).join('')}</div>
        <div class="muted up" style="font-size:11px">Tipo de time</div>
        <div class="seg" style="margin:6px 0 14px">${[['club', 'Clubes'], ['national', 'Seleções']].map(([k, l]) => `<button class="${f.kind === k ? 'on' : ''}" data-a="frSet" data-k="kind" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row wrap"><button class="btn gold" data-a="frLoad">Carregar times</button><button class="btn" data-a="openFriendlyNet">🌐 Amistoso online com um amigo</button></div></div></div>`;
  }
  if (f.step === 'result' && f.result) {
    const { m, st } = f.result;
    const goals = st.ev.filter((e) => e.t === 'goal');
    const line = (e) => `<div class="row" style="gap:8px;justify-content:${e.s === 0 ? 'flex-start' : 'flex-end'}"><span class="muted">${e.min}'</span><span>${e.p ? esc(pidName(e.p)) : 'Gol contra'}</span></div>`;
    const stat = (l, v) => `<div class="row" style="justify-content:space-between"><b>${v[0]}</b><span class="muted">${l}</span><b>${v[1]}</b></div>`;
    const pen = st.pen ? `<div class="muted" style="text-align:center">Pênaltis: ${st.pen[0]} x ${st.pen[1]}</div>` : '';
    return `<div class="page" style="max-width:900px;margin:0 auto;padding:18px">${head}
      <div class="panel"><div class="score-head" style="position:static"><div class="side">${crest(m.h, 56)}<div class="tname">${esc(teamName(m.h))}</div></div>
        <div class="scorebox"><div class="sc">${st.score[0]} - ${st.score[1]}</div><div class="clock">FIM</div></div>
        <div class="side r"><div class="tname">${esc(teamName(m.a))}</div>${crest(m.a, 56)}</div></div>${pen}
        <div style="display:grid;gap:4px;margin:14px 0">${goals.length ? goals.map(line).join('') : '<div class="muted center">Sem gols.</div>'}</div>
        <div style="display:grid;gap:4px;max-width:420px;margin:0 auto 14px">${stat('Finalizações', st.stats.sh)}${stat('No alvo', st.stats.sot)}${stat('Escanteios', st.stats.cor)}${stat('Faltas', st.stats.fo)}${stat('Posse (%)', st.stats.poss)}</div>
        <div class="row wrap" style="justify-content:center"><button class="btn gold" data-a="frAgain">Jogar de novo</button><button class="btn" data-a="frChange">Trocar times</button><button class="btn" data-a="frBack">Menu</button></div></div></div>`;
  }
  if (f.step === 'playing') return `<div class="page" style="padding:40px;text-align:center"><p class="muted">Partida em andamento…</p></div>`;
  // pick the two teams
  g2Defaults();
  const rows = anyClubEntries();
  const groups = frGroups(rows);
  const ready = f.a && f.b && f.a !== f.b;
  return `<div class="page" style="max-width:1000px;margin:0 auto;padding:18px">${head}
    <div class="row wrap" style="gap:12px;align-items:stretch">${frTeamCard(f.a, 'a', 'SEU TIME (você controla)')}<div class="col" style="justify-content:center;gap:6px"><button class="btn sm" data-a="frSwap" title="Trocar os lados">⇄</button><button class="btn sm" data-a="frRandom" title="Sortear dois times">🎲</button></div>${frTeamCard(f.b, 'b', 'ADVERSÁRIO (computador)')}</div>
    <div class="panel" style="margin-top:12px"><div class="row wrap" style="gap:16px">
      <div><div class="muted up" style="font-size:11px">Dificuldade</div>${frSeg('diff', G2_DIFFS)}</div>
      <div><div class="muted up" style="font-size:11px">Duração</div>${frSeg('len', [[4, '4 min'], [6, '6 min'], [10, '10 min']])}</div>
      <div><div class="muted up" style="font-size:11px">Câmera</div>${frSeg('cam', G2_CAMS)}</div>
      <span class="grow"></span><button class="btn gold big" data-a="frPlay" ${ready ? '' : 'disabled style="opacity:0.45"'}>🎮 Jogar</button></div></div>
    <div class="panel" style="margin-top:12px">
      <div class="row wrap" style="margin-bottom:10px"><h3 class="grow" style="font-size:22px;margin:0">Escolher ${f.slot === 'a' ? 'o seu time' : 'o adversário'}</h3><span class="muted" style="font-size:13px">${rows.length} ${f.kind === 'national' ? 'seleções' : 'clubes'}</span></div>
      <div class="row wrap" style="gap:8px;margin-bottom:10px"><input id="fr-q" class="input grow" type="search" placeholder="Buscar pelo nome…" value="${esc(f.q || '')}" data-a="frQ" data-live="1" autocomplete="off" aria-label="Buscar time">
        <select class="input" style="max-width:320px" data-a="frGrp" aria-label="Liga"><option value="all">Todas as ${f.kind === 'national' ? 'confederações' : 'ligas'}</option>${groups.map((g) => `<option value="${esc(g)}" ${f.grp === g ? 'selected' : ''}>${esc(anyGroupLabel(g))}</option>`).join('')}</select></div>
      <div id="fr-list">${frListHtml()}</div></div></div>`;
}
