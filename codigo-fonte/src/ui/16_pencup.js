/* ===================== penalty cup: a knockout of penalty shoot-outs against the computer; you take your kicks and defend theirs, alternating ===================== */
act('openPenCup', () => {
  UI.pc = { step: 'setup', era: 2026, kind: 'club', size: 8, user: 0, q: '', grp: 'all', loaded: null, rounds: null, cur: 0, out: false, champ: 0, last: null };
  UI.screen = 'pencup';
  render();
});
act('pcBack', () => { pcnLeave(); UI.pc = null; UI.screen = 'start'; render(); });
act('pcSet', (el) => { const k = el.dataset.k, v = el.dataset.v; UI.pc[k] = (k === 'era' || k === 'size') ? +v : v; render(); });
async function pcLoadWorld(era, kind) {
  setLoading('Carregando elencos de ' + era + '…', 0.2);
  await loadEra(era);
  setLoading('Montando os times…', 0.6);
  await new Promise((r) => setTimeout(r, 20));
  await createWorld({ era, mode: kind === 'national' ? 'national' : 'normal', coachName: 'Copa de Pênaltis', coachAge: 40 });
  S.coach.unemployed = false;
  UI.wiz = { anyList: null, anyQ: '', anyG: 'all' };
}
act('pcLoad', async () => {
  const f = UI.pc;
  try {
    await pcLoadWorld(f.era, f.kind);
    f.loaded = { era: f.era, kind: f.kind }; f.step = 'pick'; f.user = 0; f.q = ''; f.grp = 'all';
    UI.screen = 'pencup';
    render();
  } catch (e) {
    console.error(e);
    UI.screen = 'pencup'; f.step = 'setup'; render(); toast(e.message, true);
  }
});
act('pcGrp', (el) => { UI.pc.grp = el.value; render(); });
act('pcQ', (el) => { UI.pc.q = el.value; const box = $('#pc-list'); if (box) box.innerHTML = UI.pc.on ? pcoListHtml() : pcListHtml(); });
act('pcPick', (el) => { UI.pc.user = +el.dataset.id; render(); });
act('pcOpt', (el) => { const k = el.dataset.k; let v = el.dataset.v; G2PREF[k] = v; saveG2Pref(); render(); });
act('pcChange', () => { UI.pc.step = 'pick'; UI.pc.rounds = null; render(); });

function pcRating(id) { const t = S.teams[id]; return t.isNat ? nationRating(t.code) : teamRating(t.id); }
// quick computer-vs-computer shoot-out: five kicks each, then sudden death
function pcSim(a, b) {
  const d = (pcRating(a) - pcRating(b)) * 0.012;
  const pa = clamp(0.75 + d, 0.6, 0.88), pb = clamp(0.75 - d, 0.6, 0.88);
  let ga = 0, gb = 0;
  for (let i = 0; i < 5; i++) { if (Math.random() < pa) ga++; if (Math.random() < pb) gb++; }
  let n = 0;
  while (ga === gb && n++ < 40) { if (Math.random() < pa) ga++; if (Math.random() < pb) gb++; }
  if (ga === gb) ga++;
  return [ga, gb];
}
function pcRoundName(nTies) { return nTies === 1 ? 'Final' : nTies === 2 ? 'Semifinais' : nTies === 4 ? 'Quartas de final' : nTies === 8 ? 'Oitavas de final' : 'Rodada'; }
function pcMakeRound(ids) {
  const ties = [];
  for (let i = 0; i < ids.length; i += 2) ties.push({ a: ids[i], b: ids[i + 1], s: null, w: 0 });
  return { name: pcRoundName(ids.length / 2), ties };
}
function pcStartCup() {
  const f = UI.pc;
  if (!f.user) return;
  const pool = anyClubEntries().map((r) => r.id).filter((id) => id !== f.user);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const ids = [f.user, ...pool.slice(0, f.size - 1)];
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  f.rounds = [pcMakeRound(ids)]; f.cur = 0; f.out = false; f.champ = 0; f.last = null; f.step = 'bracket';
  render();
}
// the tie of the user in the current round
function pcUserTie() { const f = UI.pc; return f.rounds[f.cur].ties.find((t) => (t.a === f.user || t.b === f.user) && !t.w); }
// settle the other ties of the round and open the next one (or crown the champion)
function pcAdvance() {
  const f = UI.pc;
  for (;;) {
    const r = f.rounds[f.cur];
    for (const t of r.ties) if (!t.w) { t.s = pcSim(t.a, t.b); t.w = t.s[0] > t.s[1] ? t.a : t.b; }
    const win = r.ties.map((t) => t.w);
    if (win.length === 1) { f.champ = win[0]; f.step = 'over'; return; }
    f.rounds.push(pcMakeRound(win)); f.cur++;
    if (!f.out) return; // keep going only while the user is out (to show who won the cup)
  }
}
act('pcStart', () => pcStartCup());
act('pcPlay', () => {
  const f = UI.pc, tie = pcUserTie();
  if (!tie) return;
  g2Defaults();
  const opp = tie.a === f.user ? tie.b : tie.a;
  S.user.team = f.user; S.coach.unemployed = false;
  for (const id of [f.user, opp]) { const t = S.teams[id]; if (t && t.isNat) autoCallUp(t.code, true); }
  S.date = dayOf(S.era, 3, 15);
  const m = { id: 'pc' + (Date.now() % 1e7), h: f.user, a: opp, c: 0, d: S.date, r: 0, fr: true };
  S.matches[m.id] = m;
  const st = startMatchState(m, { user: f.user });
  st.decided = false; st.deferPens = true;
  f.step = 'playing'; UI.screen = 'pencup'; render();
  Game2D.startShootoutOnly(m, st, { minutes: G2PREF.len, diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: G2PREF.replay }, () => pcDone(m, st, tie));
});
function pcDone(m, st, tie) {
  const f = UI.pc;
  delete S.matches[m.id];
  if (!f) return;
  let pen = st.pen;
  if (!pen || pen[0] === pen[1]) pen = pcSim(m.h, m.a);
  const [gu, go] = pen;
  tie.s = tie.a === f.user ? [gu, go] : [go, gu];
  tie.w = gu > go ? f.user : m.a;
  f.last = { win: gu > go, gu, go, opp: m.a };
  if (!f.last.win) f.out = true;
  f.step = 'bracket';
  pcAdvance();
  if (f.out && f.step !== 'over') { f.step = 'over'; }
  UI.screen = 'pencup'; render(); window.scrollTo(0, 0);
}
act('pcAgain', () => { UI.pc.step = 'pick'; UI.pc.rounds = null; render(); });

function pcListHtml() {
  const f = UI.pc;
  const q = strip((f.q || '').trim());
  const rows = anyClubEntries().filter((r) => (f.grp === 'all' || r.grp === f.grp) && (!q || r.q.includes(q)));
  if (!rows.length) return '<div class="empty">Nenhum resultado para essa busca.</div>';
  const shown = rows.slice(0, 60);
  return `<div class="any-grid">${shown.map((r) => {
    const t = S.teams[r.id];
    return `<button class="any-item" style="${r.id === f.user ? 'outline:2px solid var(--gold,#ffc54d)' : ''}" data-a="pcPick" data-id="${r.id}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${esc(r.where)}</span></span><span class="sc">${starStr(r.r)}<span class="muted">força ${r.r.toFixed(1)}</span></span></button>`;
  }).join('')}</div>${rows.length > shown.length ? `<p class="muted" style="font-size:13px;margin:10px 0 0">Mostrando ${shown.length} de ${rows.length}. Digite o nome ou escolha a liga.</p>` : ''}`;
}
function pcBracketHtml() {
  const f = UI.pc;
  const tieHtml = (t) => {
    const row = (id, g) => id ? `<div class="row" style="gap:8px;${t.w && t.w !== id ? 'opacity:0.5' : ''}${id === f.user ? ';font-weight:800' : ''}">${crest(id, 22)}<span class="grow" style="font-size:14px">${esc(teamName(id))}</span><b>${g == null ? '' : g}</b></div>` : '';
    return `<div class="panel" style="padding:8px 10px;margin:0 0 8px;${(t.a === f.user || t.b === f.user) ? 'border:1px solid var(--gold,#ffc54d)' : ''}">${row(t.a, t.s ? t.s[0] : null)}${row(t.b, t.s ? t.s[1] : null)}</div>`;
  };
  return `<div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:6px">${f.rounds.map((r, i) => `<div style="min-width:230px;flex:1"><div class="muted up" style="font-size:11px;margin-bottom:6px">${r.name}</div>${r.ties.map(tieHtml).join('')}</div>`).join('')}</div>`;
}
function viewPenCup() {
  const f = UI.pc;
  if (!f) return viewStart();
  const head = `<div class="row wrap" style="margin-bottom:14px"><button class="btn" data-a="pcBack">← Menu</button><h2 style="font-size:34px;font-weight:800;margin:0" class="grow">Copa de Pênaltis</h2></div>`;
  if (f.step === 'setup') {
    return `<div class="page" style="max-width:900px;margin:0 auto;padding:18px">${head}
      <div class="panel"><p style="margin:0 0 14px">Um mata-mata só de <b>disputas de pênaltis</b> contra o computador, com qualquer clube ou seleção do jogo. Em cada disputa você <b>bate os seus pênaltis e defende os do adversário</b>, alternando, até o campeão. (Partida online 1 contra 1 precisaria de um servidor, que este jogo não tem.)</p>
        <div class="muted up" style="font-size:11px">Época</div>
        <div class="seg" style="margin:6px 0 14px">${[2016, 2021, 2026].map((y) => `<button class="${f.era === y ? 'on' : ''}" data-a="pcSet" data-k="era" data-v="${y}">${y}</button>`).join('')}</div>
        <div class="muted up" style="font-size:11px">Tipo de time</div>
        <div class="seg" style="margin:6px 0 14px">${[['club', 'Clubes'], ['national', 'Seleções']].map(([k, l]) => `<button class="${f.kind === k ? 'on' : ''}" data-a="pcSet" data-k="kind" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="muted up" style="font-size:11px">Tamanho da copa</div>
        <div class="seg" style="margin:6px 0 14px">${[[4, '4 times'], [8, '8 times'], [16, '16 times']].map(([k, l]) => `<button class="${f.size === k ? 'on' : ''}" data-a="pcSet" data-k="size" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row wrap" style="gap:8px"><button class="btn gold" data-a="pcLoad">Jogar contra o computador</button><button class="btn" data-a="pcOnline">🌐 Copa online com amigos (sala)</button></div></div></div>`;
  }
  if (f.step === 'onsetup' || f.step === 'olobby' || f.step === 'ocup') return viewPenCupOnline();
  if (f.step === 'playing') return `<div class="page" style="padding:40px;text-align:center"><p class="muted">Disputa em andamento…</p></div>`;
  if (f.step === 'bracket' || f.step === 'over') {
    const r = f.rounds[f.cur], tie = f.step === 'bracket' ? pcUserTie() : null;
    const opp = tie ? (tie.a === f.user ? tie.b : tie.a) : 0;
    let banner = '';
    if (f.last) banner = `<div class="panel" style="margin-bottom:12px;text-align:center"><b style="font-size:20px">${f.last.win ? '✅ Você venceu' : '❌ Você perdeu'} a última disputa por ${f.last.gu} x ${f.last.go}${f.last.opp ? ' contra ' + esc(teamName(f.last.opp)) : ''}.</b></div>`;
    let act = '';
    if (f.step === 'over') {
      const champ = f.champ === f.user;
      act = `<div class="panel" style="margin:12px 0;text-align:center"><div style="font-size:30px;font-weight:800" class="disp">${champ ? '🏆 Você é o campeão!' : f.out ? 'Você foi eliminado' : 'Fim da copa'}</div>${f.champ ? `<div class="row" style="justify-content:center;gap:10px;margin-top:8px">${crest(f.champ, 40)}<b style="font-size:20px">Campeão: ${esc(teamName(f.champ))}</b></div>` : ''}
        <div class="row wrap" style="justify-content:center;margin-top:14px"><button class="btn gold" data-a="pcStart">Jogar a copa de novo</button><button class="btn" data-a="pcAgain">Trocar de time</button><button class="btn" data-a="pcBack">Menu</button></div></div>`;
    } else {
      act = `<div class="panel" style="margin:12px 0;text-align:center"><div class="muted up" style="font-size:11px">${esc(r.name)}</div><div class="row" style="justify-content:center;gap:12px;margin:8px 0">${crest(f.user, 44)}<b style="font-size:22px">${esc(teamName(f.user))}</b><span class="muted">x</span><b style="font-size:22px">${esc(teamName(opp))}</b>${crest(opp, 44)}</div>
        <button class="btn gold big" data-a="pcPlay">🎮 Disputar pênaltis</button></div>`;
    }
    return `<div class="page" style="max-width:1000px;margin:0 auto;padding:18px">${head}${banner}${act}<div class="panel">${pcBracketHtml()}</div></div>`;
  }
  // pick your team
  g2Defaults();
  const rows = anyClubEntries();
  const groups = [...new Set(rows.map((r) => r.grp))];
  const u = f.user ? S.teams[f.user] : null;
  return `<div class="page" style="max-width:1000px;margin:0 auto;padding:18px">${head}
    <div class="panel"><div class="row wrap" style="gap:16px">
      <div class="grow">${u ? `<div class="row" style="gap:10px">${crest(u, 44)}<div><div class="muted up" style="font-size:11px">SEU TIME</div><div class="disp" style="font-size:22px;font-weight:800">${esc(u.n)}</div></div></div>` : '<div class="muted">Escolha o seu time na lista abaixo</div>'}</div>
      <div><div class="muted up" style="font-size:11px">Dificuldade</div><div class="seg">${G2_DIFFS.map(([v, l]) => `<button class="${G2PREF.diff === v ? 'on' : ''}" data-a="pcOpt" data-k="diff" data-v="${v}">${l}</button>`).join('')}</div></div>
      <button class="btn gold big" data-a="pcStart" ${f.user ? '' : 'disabled style="opacity:0.45"'}>🏆 Começar a copa (${f.size} times)</button></div></div>
    <div class="panel" style="margin-top:12px">
      <div class="row wrap" style="gap:8px;margin-bottom:10px"><input id="pc-q" class="input grow" type="search" placeholder="Buscar pelo nome…" value="${esc(f.q || '')}" data-a="pcQ" data-live="1" autocomplete="off" aria-label="Buscar time">
        <select class="input" style="max-width:320px" data-a="pcGrp" aria-label="Liga"><option value="all">Todas as ${f.kind === 'national' ? 'confederações' : 'ligas'}</option>${groups.map((g) => `<option value="${esc(g)}" ${f.grp === g ? 'selected' : ''}>${esc(anyGroupLabel(g))}</option>`).join('')}</select></div>
      <div id="pc-list">${pcListHtml()}</div></div></div>`;
}

/* ---------- online cup: friends meet in a room (code); human vs human ties are played over the room, the rest against bots ---------- */
const PCN = { room: null, un: null, poll: null, seq: 0, q: [], seen: {}, mine: {}, key: '' };
function pcnAvailable() { return !!(window.claude && window.claude.use); }
function pcnPeers() { try { return PCN.room ? PCN.room.peers().filter((p) => p.kind === 'viewer') : []; } catch (e) { return []; } }
function pcnMe() { return pcnPeers().find((p) => p.isMe && p.sameTab) || null; }
function pcnSet(patch) { Object.assign(PCN.mine, patch); if (PCN.room) PCN.room.presence(patch).catch(() => {}); }
function pcnHostPeer() { return pcnPeers().find((p) => p.presence && p.presence.h === 1) || null; }
function pcnLeave() {
  if (PCN.poll) clearInterval(PCN.poll);
  PCN.poll = null;
  if (PCN.un) { try { PCN.un(); } catch (e) { /* ignore */ } }
  if (PCN.room) { try { PCN.room.leave(); } catch (e) { /* ignore */ } }
  Object.assign(PCN, { room: null, un: null, seq: 0, q: [], seen: {}, mine: {}, key: '' });
}
function pcnCode() { const A = 'abcdefghjkmnpqrstuvwxyz23456789'; let c = ''; for (let i = 0; i < 5; i++) c += A[Math.floor(Math.random() * A.length)]; return c; }
async function pcnJoin(code, presence) {
  const lobby = pcnAvailable() ? await window.claude.use('room') : null;
  if (!lobby) throw new Error('Salas online só funcionam dentro do artefato publicado do Claude (e para quem consegue abrir o link).');
  pcnLeave();
  const room = await lobby.join('pc-' + code);
  PCN.room = room; PCN.mine = {};
  pcnSet(presence);
  PCN.poll = setInterval(pcnTick, 150);
  return room;
}
act('pcOnline', () => {
  const f = UI.pc;
  f.step = 'onsetup'; f.nick = f.nick || ('Jogador' + (10 + Math.floor(Math.random() * 90))); f.err = '';
  render();
});
act('pcoNick', (el) => { UI.pc.nick = el.value.replace(/[^\w \-À-ÿ]/g, '').slice(0, 16); });
act('pcoCode', (el) => { UI.pc.codeIn = el.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12); });
act('pcCreate', async () => {
  const f = UI.pc;
  const nick = (f.nick || 'Jogador').trim() || 'Jogador';
  try {
    const code = pcnCode();
    await pcnJoin(code, { n: nick, h: 1, cf: { era: f.era, kind: f.kind, size: f.size }, tm: 0, rd: 0 });
    f.on = { code, host: true, loaded: false, last: null, playing: null };
    f.step = 'olobby'; f.user = 0; f.q = ''; f.grp = 'all';
    render();
    await pcLoadWorld(f.era, f.kind);
    f.on.loaded = true; f.loaded = { era: f.era, kind: f.kind };
    UI.screen = 'pencup'; render();
  } catch (e) { console.error(e); pcnLeave(); f.on = null; f.step = 'onsetup'; render(); toast(e.message || 'Não foi possível criar a sala.', true); }
});
act('pcJoin', async () => {
  const f = UI.pc;
  const nick = (f.nick || 'Jogador').trim() || 'Jogador';
  const code = (f.codeIn || '').trim();
  if (code.length < 3) { toast('Digite o código da sala.', true); return; }
  try {
    await pcnJoin(code, { n: nick, tm: 0, rd: 0 });
    // wait for the host's presence
    let host = null;
    for (let i = 0; i < 30 && !host; i++) { await new Promise((r) => setTimeout(r, 200)); host = pcnHostPeer(); }
    if (!host) { pcnLeave(); toast('Sala não encontrada: ninguém criou essa sala (confira o código).', true); return; }
    const cf = host.presence.cf || { era: 2026, kind: 'club', size: 8 };
    f.era = cf.era; f.kind = cf.kind; f.size = cf.size;
    f.on = { code, host: false, loaded: false, last: null, playing: null };
    f.step = 'olobby'; f.user = 0; f.q = ''; f.grp = 'all';
    render();
    await pcLoadWorld(cf.era, cf.kind);
    f.on.loaded = true; f.loaded = { era: cf.era, kind: cf.kind };
    UI.screen = 'pencup'; render();
  } catch (e) { console.error(e); pcnLeave(); f.on = null; f.step = 'onsetup'; render(); toast(e.message || 'Não foi possível entrar na sala.', true); }
});
act('pcoPick', (el) => {
  const f = UI.pc, id = +el.dataset.id;
  if (pcnPeers().some((p) => !p.isMe && p.presence.tm === id)) { toast('Outro jogador já escolheu esse time.', true); return; }
  f.user = id; pcnSet({ tm: id, rd: 0 }); render();
});
act('pcoReady', () => { const f = UI.pc; if (!f.user) { toast('Escolha o seu time primeiro.', true); return; } const me = pcnMe(); pcnSet({ rd: me && me.presence.rd ? 0 : 1 }); render(); });
act('pcoSize', (el) => { const f = UI.pc; f.size = +el.dataset.v; const cf = Object.assign({}, PCN.mine.cf || {}, { size: f.size }); pcnSet({ cf }); render(); });
act('pcoStart', () => {
  const f = UI.pc;
  const hs = pcnPeers().filter((p) => p.presence.tm);
  if (!hs.length || hs.some((p) => !p.presence.rd)) { toast('Todos os jogadores precisam escolher um time e marcar "Pronto".', true); return; }
  const tms = hs.map((p) => p.presence.tm);
  if (new Set(tms).size !== tms.length) { toast('Dois jogadores escolheram o mesmo time.', true); return; }
  pcnSet({ br: pcnBuild(tms, f.size) });
});
act('pcoSim', () => { const br = PCN.mine.br; if (!br) return; pcnForce(br); pcnSet({ br }); render(); });
act('pcoPlay', () => pcnPlay());

// ----- host: bracket
function pcnHumanTeams() { return new Set(pcnPeers().map((p) => p.presence.tm).filter(Boolean)); }
function pcnShuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pcnBuild(tms, size) {
  const set = new Set(tms);
  const pool = pcnShuffle(anyClubEntries().map((r) => r.id).filter((id) => !set.has(id))).slice(0, Math.max(0, size - tms.length));
  const hs = pcnShuffle(tms.slice()), pairs = [];
  while (hs.length >= 2) pairs.push([hs.shift(), hs.shift()]);
  if (hs.length) pairs.push([hs.shift(), pool.shift()]);
  while (pool.length >= 2) pairs.push([pool.shift(), pool.shift()]);
  pcnShuffle(pairs);
  const br = { rounds: [pairs.map(([a, b]) => [a, b, 0, 0, 0])], ch: 0, v: 1 };
  pcnSimBots(br, set);
  return br;
}
function pcnSimBots(br, humans) {
  const r = br.rounds[br.rounds.length - 1];
  for (const t of r) if (!t[2] && !humans.has(t[0]) && !humans.has(t[1])) { const sc = pcSim(t[0], t[1]); t[3] = sc[0]; t[4] = sc[1]; t[2] = sc[0] > sc[1] ? t[0] : t[1]; }
}
function pcnAdvance(br) {
  const humans = pcnHumanTeams();
  for (;;) {
    pcnSimBots(br, humans);
    const r = br.rounds[br.rounds.length - 1];
    if (r.some((t) => !t[2])) return;
    const win = r.map((t) => t[2]);
    if (win.length === 1) { br.ch = win[0]; return; }
    br.rounds.push(win.reduce((acc, id, i) => { if (i % 2 === 0) acc.push([id, win[i + 1], 0, 0, 0]); return acc; }, []));
  }
}
// the host settles what is stuck (a player who left): every pending tie is simulated
function pcnForce(br) {
  for (;;) {
    const r = br.rounds[br.rounds.length - 1];
    for (const t of r) if (!t[2]) { const sc = pcSim(t[0], t[1]); t[3] = sc[0]; t[4] = sc[1]; t[2] = sc[0] > sc[1] ? t[0] : t[1]; }
    pcnAdvance(br);
    if (br.ch) return;
  }
}
function pcnMyTie(br) {
  const me = pcnMe(), tm = me && me.presence.tm;
  if (!br || !tm || br.ch) return null;
  const ri = br.rounds.length - 1, ti = br.rounds[ri].findIndex((t) => (t[0] === tm || t[1] === tm) && !t[2]);
  return ti < 0 ? null : { ri, ti, t: br.rounds[ri][ti], tm, opp: br.rounds[ri][ti][0] === tm ? br.rounds[ri][ti][1] : br.rounds[ri][ti][0] };
}
function pcnPeerOfTeam(tm) { return pcnPeers().find((p) => p.presence.tm === tm) || null; }
function pcnTieKey(my) { return my.ri + ':' + my.ti; }

// ----- the periodic tick: peers, host logic, game messages, sync of the start of a tie
function pcnTick() {
  const f = UI.pc;
  if (!f || !f.on || !PCN.room) return;
  const ps = pcnPeers(), me = pcnMe(), host = pcnHostPeer();
  if (!me) return;
  if (!host && !f.on.host && f.on.loaded) { if (!f.on.lost) { f.on.lost = true; toast('O anfitrião saiu da sala.', true); render(); } return; }
  // host: merge reported results and advance
  if (f.on.host && PCN.mine.br) {
    const br = PCN.mine.br;
    let ch = false;
    for (const p of ps) {
      const rs = p.presence.rs;
      if (!rs) continue;
      const [ri, ti] = String(rs.k).split(':').map(Number);
      const t = br.rounds[ri] && br.rounds[ri][ti];
      if (t && !t[2] && ri === br.rounds.length - 1) { t[2] = rs.w; t[3] = rs.a; t[4] = rs.b; ch = true; }
    }
    // a human who left while his tie was pending is replaced by a simulation after a while
    if (ch) { pcnAdvance(br); br.v++; pcnSet({ br }); }
  }
  const br = host ? host.presence.br : null;
  // game messages from the opponent
  if (f.on.playing && Game2D.netActive()) {
    const op = ps.find((p) => p.peer === f.on.playing.oppPeer);
    const g = op && op.presence.g;
    if (g && g.to === me.peer && Array.isArray(g.q)) {
      for (const m of g.q) if (m.s > (PCN.seen[op.peer] || 0)) { PCN.seen[op.peer] = m.s; Game2D.netRecv(m); }
    }
  }
  // start a human-vs-human tie when both are ready
  if (br && !f.on.playing && f.step === 'ocup') {
    const my = pcnMyTie(br);
    if (my && pcnPeerOfTeam(my.opp) && me.presence.tr === pcnTieKey(my)) {
      const op = pcnPeerOfTeam(my.opp);
      if (op.presence.tr === pcnTieKey(my)) pcnStartOnline(my, op);
    }
  }
  const key = JSON.stringify([ps.map((p) => [p.peer, p.presence.n, p.presence.tm, p.presence.rd, p.presence.tr, p.presence.h]), br ? br.v : 0, f.on.loaded, f.on.lost]);
  if (key !== PCN.key) {
    PCN.key = key;
    if (br && f.step === 'olobby') f.step = 'ocup';
    const ae = document.activeElement;
    if (!(ae && (ae.id === 'pc-q' || ae.id === 'pc-nick' || ae.id === 'pc-code'))) render();
  }
}

// ----- playing a tie
function pcnReport(my, w, mine, theirs) {
  const sa = my.t[0] === my.tm ? mine : theirs, sb = my.t[0] === my.tm ? theirs : mine;
  pcnSet({ rs: { k: pcnTieKey(my), w, a: sa, b: sb }, tr: '', g: null });
}
function pcnMatch(my) {
  g2Defaults();
  S.user.team = my.tm; S.coach.unemployed = false;
  for (const id of [my.tm, my.opp]) { const t = S.teams[id]; if (t && t.isNat) autoCallUp(t.code, true); }
  S.date = dayOf(S.era, 3, 15);
  const m = { id: 'pc' + (Date.now() % 1e7), h: my.tm, a: my.opp, c: 0, d: S.date, r: 0, fr: true };
  S.matches[m.id] = m;
  const st = startMatchState(m, { user: my.tm });
  st.decided = false; st.deferPens = true;
  return { m, st };
}
function pcnPlay() {
  const f = UI.pc, br = (pcnHostPeer() || {}).presence ? pcnHostPeer().presence.br : null;
  const my = pcnMyTie(br);
  if (!my) return;
  const opPeer = pcnPeerOfTeam(my.opp);
  if (opPeer) { pcnSet({ tr: pcnTieKey(my), rs: null }); render(); return; } // wait for the other player; pcnTick starts it
  // against a bot: played here, then reported
  const { m, st } = pcnMatch(my);
  pcnSet({ rs: null });
  f.on.playing = { local: true };
  f.step = 'playing'; render();
  Game2D.startShootoutOnly(m, st, { minutes: G2PREF.len, diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: G2PREF.replay }, () => pcnDone(my, m, st));
}
function pcnStartOnline(my, op) {
  const f = UI.pc, me = pcnMe();
  const { m, st } = pcnMatch(my);
  const coin = (my.ri * 7 + my.ti * 3 + my.t[0] + my.t[1]) % 2; // who kicks first: the same answer on both screens
  const first = (my.t[0] === my.tm) === (coin === 0) ? 0 : 1;
  f.on.playing = { oppPeer: op.peer, local: false };
  pcnSet({ rs: null, g: null });
  PCN.q = [];
  PCN.seen[op.peer] = ((op.presence.g && op.presence.g.q) || []).reduce((a, x) => Math.max(a, x.s), 0);
  const send = (obj) => { PCN.seq++; PCN.q.push(Object.assign({ s: PCN.seq }, obj)); PCN.q = PCN.q.slice(-6); pcnSet({ g: { to: op.peer, q: PCN.q } }); };
  f.step = 'playing'; render();
  Game2D.startShootoutOnly(m, st, { minutes: G2PREF.len, diff: G2PREF.diff, cam: G2PREF.cam, sound: G2PREF.sound, replay: G2PREF.replay, online: { send, first } }, () => pcnDone(my, m, st));
}
function pcnDone(my, m, st) {
  const f = UI.pc;
  delete S.matches[m.id];
  if (!f || !f.on) return;
  let pen = st.pen;
  if (!pen || pen[0] === pen[1]) pen = pcSim(m.h, m.a);
  const [gu, go] = pen;
  f.on.playing = null;
  f.on.last = { win: gu > go, gu, go, opp: my.opp };
  pcnReport(my, gu > go ? my.tm : my.opp, gu, go);
  f.step = 'ocup';
  UI.screen = 'pencup'; render(); window.scrollTo(0, 0);
}

// ----- views
function pcnNick(tm) { const p = pcnPeerOfTeam(tm); return p ? p.presence.n : ''; }
function pcnBracketHtml(br) {
  const f = UI.pc, me = pcnMe(), mytm = me && me.presence.tm;
  const rn = (n) => (n === 1 ? 'Final' : n === 2 ? 'Semifinais' : n === 4 ? 'Quartas de final' : n === 8 ? 'Oitavas de final' : 'Rodada');
  const tie = (t) => {
    const row = (id, g) => {
      if (!id) return '';
      const nk = pcnNick(id);
      return `<div class="row" style="gap:8px;${t[2] && t[2] !== id ? 'opacity:0.5' : ''}${id === mytm ? ';font-weight:800' : ''}">${crest(id, 22)}<span class="grow" style="font-size:14px">${esc(teamName(id))}${nk ? ` <span class="muted">(${esc(nk)})</span>` : ''}</span><b>${t[2] ? g : ''}</b></div>`;
    };
    return `<div class="panel" style="padding:8px 10px;margin:0 0 8px;${(t[0] === mytm || t[1] === mytm) ? 'border:1px solid var(--gold,#ffc54d)' : ''}">${row(t[0], t[3])}${row(t[1], t[4])}</div>`;
  };
  return `<div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:6px">${br.rounds.map((r) => `<div style="min-width:240px;flex:1"><div class="muted up" style="font-size:11px;margin-bottom:6px">${rn(r.length)}</div>${r.map(tie).join('')}</div>`).join('')}</div>`;
}
function viewPenCupOnline() {
  const f = UI.pc;
  const head = `<div class="row wrap" style="margin-bottom:14px"><button class="btn" data-a="pcBack">← Sair</button><h2 style="font-size:34px;font-weight:800;margin:0" class="grow">Copa de Pênaltis online</h2></div>`;
  if (f.step === 'onsetup') {
    return `<div class="page" style="max-width:900px;margin:0 auto;padding:18px">${head}
      <div class="panel"><p style="margin:0 0 14px">Crie uma sala e passe o <b>código</b> aos amigos, ou entre numa sala com o código deles. Cada disputa entre dois jogadores é jogada ao vivo pela sala: um bate e o outro defende, alternando. Os times que sobram ficam por conta do computador. Os amigos precisam conseguir abrir este mesmo artefato (compartilhe o link com eles).</p>
        ${pcnAvailable() ? '' : '<p class="muted" style="margin:0 0 12px">⚠️ Salas online só funcionam dentro do artefato publicado do Claude.</p>'}
        <div class="muted up" style="font-size:11px">Seu apelido</div>
        <input id="pc-nick" class="input" style="max-width:260px;margin:6px 0 16px" value="${esc(f.nick || '')}" data-a="pcoNick" data-live="1" maxlength="16" autocomplete="off">
        <div class="grid g2" style="gap:16px;align-items:start">
          <div class="panel"><h3 style="margin:0 0 10px">Criar sala</h3>
            <div class="muted up" style="font-size:11px">Época</div><div class="seg" style="margin:6px 0 10px">${[2016, 2021, 2026].map((y) => `<button class="${f.era === y ? 'on' : ''}" data-a="pcSet" data-k="era" data-v="${y}">${y}</button>`).join('')}</div>
            <div class="muted up" style="font-size:11px">Times</div><div class="seg" style="margin:6px 0 10px">${[['club', 'Clubes'], ['national', 'Seleções']].map(([k, l]) => `<button class="${f.kind === k ? 'on' : ''}" data-a="pcSet" data-k="kind" data-v="${k}">${l}</button>`).join('')}</div>
            <div class="muted up" style="font-size:11px">Tamanho da copa</div><div class="seg" style="margin:6px 0 14px">${[[4, '4'], [8, '8'], [16, '16']].map(([k, l]) => `<button class="${f.size === k ? 'on' : ''}" data-a="pcSet" data-k="size" data-v="${k}">${l}</button>`).join('')}</div>
            <button class="btn gold" data-a="pcCreate">Criar sala</button></div>
          <div class="panel"><h3 style="margin:0 0 10px">Entrar numa sala</h3>
            <div class="muted up" style="font-size:11px">Código da sala</div>
            <input id="pc-code" class="input" style="margin:6px 0 14px;text-transform:lowercase" value="${esc(f.codeIn || '')}" data-a="pcoCode" data-live="1" maxlength="12" autocomplete="off" placeholder="ex.: k7m2q">
            <button class="btn gold" data-a="pcJoin">Entrar</button></div></div>
        <div style="margin-top:14px"><button class="btn" data-a="pcChange2">← Voltar</button></div></div></div>`;
  }
  const on = f.on;
  if (!on) return viewStart();
  const ps = pcnPeers(), me = pcnMe(), host = pcnHostPeer();
  const brIn = host ? host.presence.br : null;
  const people = ps.map((p) => `<div class="row" style="gap:8px;padding:4px 0">${p.presence.tm ? crest(p.presence.tm, 24) : '<span style="width:24px"></span>'}<b>${esc(p.presence.n || 'Jogador')}${p.isMe ? ' (você)' : ''}</b>${p.presence.h ? '<span class="muted">· anfitrião</span>' : ''}<span class="grow muted">${p.presence.tm ? esc(teamName(p.presence.tm)) : 'escolhendo o time…'}</span>${p.presence.rd ? '<span>✅ pronto</span>' : ''}</div>`).join('');
  if (f.step === 'playing') return `<div class="page" style="padding:40px;text-align:center"><p class="muted">Disputa em andamento…</p></div>`;
  if (f.step === 'olobby' || !brIn) {
    const rows = on.loaded ? anyClubEntries() : [];
    const groups = [...new Set(rows.map((r) => r.grp))];
    const allReady = ps.length && ps.every((p) => p.presence.tm && p.presence.rd);
    const listHtml = !on.loaded ? '<div class="muted">Carregando os times…</div>' : pcoListHtml();
    return `<div class="page" style="max-width:1000px;margin:0 auto;padding:18px">${head}
      <div class="panel"><div class="row wrap" style="gap:16px"><div class="grow"><div class="muted up" style="font-size:11px">Código da sala</div><div class="disp" style="font-size:40px;font-weight:800;letter-spacing:4px">${esc(on.code.toUpperCase())}</div><div class="muted" style="font-size:13px">Copa de ${f.size} times · ${f.kind === 'national' ? 'seleções' : 'clubes'} ${f.era}</div></div>
        <div style="min-width:280px;flex:1">${people}</div></div>
        <div class="row wrap" style="gap:10px;margin-top:12px">
          ${on.host ? `<div class="seg">${[4, 8, 16].map((n) => `<button class="${f.size === n ? 'on' : ''}" data-a="pcoSize" data-v="${n}">${n} times</button>`).join('')}</div>` : ''}
          <span class="grow"></span>
          <button class="btn" data-a="pcoReady">${me && me.presence.rd ? 'Desmarcar pronto' : 'Pronto ✅'}</button>
          ${on.host ? `<button class="btn gold big" data-a="pcoStart" ${allReady ? '' : 'style="opacity:0.55"'}>🏆 Iniciar a copa</button>` : '<span class="muted">Aguardando o anfitrião iniciar…</span>'}</div>
        ${on.lost ? '<p class="muted" style="margin:10px 0 0">O anfitrião saiu da sala.</p>' : ''}</div>
      <div class="panel" style="margin-top:12px"><div class="row wrap" style="gap:8px;margin-bottom:10px"><h3 class="grow" style="font-size:22px;margin:0">Escolha o seu time</h3></div>
        ${on.loaded ? `<div class="row wrap" style="gap:8px;margin-bottom:10px"><input id="pc-q" class="input grow" type="search" placeholder="Buscar pelo nome…" value="${esc(f.q || '')}" data-a="pcQ" data-live="1" autocomplete="off" aria-label="Buscar time"><select class="input" style="max-width:320px" data-a="pcGrp" aria-label="Liga"><option value="all">Todas as ${f.kind === 'national' ? 'confederações' : 'ligas'}</option>${groups.map((g) => `<option value="${esc(g)}" ${f.grp === g ? 'selected' : ''}>${esc(anyGroupLabel(g))}</option>`).join('')}</select></div>` : ''}
        <div id="pc-list">${listHtml}</div></div></div>`;
  }
  // the cup is running
  const br = brIn, my = pcnMyTie(br);
  const mytm = me && me.presence.tm;
  let act = '';
  if (br.ch) {
    act = `<div class="panel" style="margin:12px 0;text-align:center"><div style="font-size:30px;font-weight:800" class="disp">${br.ch === mytm ? '🏆 Você é o campeão!' : 'Fim da copa'}</div><div class="row" style="justify-content:center;gap:10px;margin-top:8px">${crest(br.ch, 40)}<b style="font-size:20px">Campeão: ${esc(teamName(br.ch))}${pcnNick(br.ch) ? ' (' + esc(pcnNick(br.ch)) + ')' : ''}</b></div>
      <div class="row wrap" style="justify-content:center;margin-top:14px"><button class="btn" data-a="pcBack">Sair da sala</button></div></div>`;
  } else if (my) {
    const opP = pcnPeerOfTeam(my.opp), ready = me.presence.tr === pcnTieKey(my);
    act = `<div class="panel" style="margin:12px 0;text-align:center"><div class="row" style="justify-content:center;gap:12px;margin:4px 0 10px">${crest(my.tm, 44)}<b style="font-size:22px">${esc(teamName(my.tm))}</b><span class="muted">x</span><b style="font-size:22px">${esc(teamName(my.opp))}${opP ? ' (' + esc(opP.presence.n) + ')' : ''}</b>${crest(my.opp, 44)}</div>
      ${opP ? (ready ? `<div class="muted">Aguardando ${esc(opP.presence.n)} confirmar…</div>` : `<button class="btn gold big" data-a="pcoPlay">🎮 Disputar pênaltis contra ${esc(opP.presence.n)}</button>`) : '<button class="btn gold big" data-a="pcoPlay">🎮 Disputar pênaltis (contra o computador)</button>'}</div>`;
  } else {
    act = `<div class="panel" style="margin:12px 0;text-align:center"><b>${mytm && br.rounds.flat().some((t) => t[0] === mytm || t[1] === mytm) ? (br.rounds[br.rounds.length - 1].some((t) => t[0] === mytm || t[1] === mytm) ? 'Aguardando as outras disputas da rodada…' : 'Você foi eliminado. Acompanhe a chave até o campeão.') : 'Acompanhando a copa.'}</b></div>`;
  }
  let banner = '';
  if (on.last) banner = `<div class="panel" style="margin-bottom:12px;text-align:center"><b style="font-size:20px">${on.last.win ? '✅ Você venceu' : '❌ Você perdeu'} a última disputa por ${on.last.gu} x ${on.last.go}.</b></div>`;
  const hostBtn = on.host && !br.ch ? `<div style="text-align:center;margin-bottom:10px"><button class="btn sm" data-a="pcoSim">Simular as disputas pendentes (se alguém travou)</button></div>` : '';
  return `<div class="page" style="max-width:1000px;margin:0 auto;padding:18px">${head}${banner}${act}${hostBtn}<div class="panel">${pcnBracketHtml(br)}</div><div class="panel" style="margin-top:10px"><div class="muted up" style="font-size:11px;margin-bottom:4px">Na sala · código ${esc(on.code.toUpperCase())}</div>${people}</div></div>`;
}
function pcoListHtml() {
  const f = UI.pc;
  const q = strip((f.q || '').trim());
  const rows = anyClubEntries().filter((r) => (f.grp === 'all' || r.grp === f.grp) && (!q || r.q.includes(q)));
  if (!rows.length) return '<div class="empty">Nenhum resultado para essa busca.</div>';
  const taken = new Set(pcnPeers().filter((p) => !p.isMe).map((p) => p.presence.tm));
  return `<div class="any-grid">${rows.slice(0, 60).map((r) => {
    const t = S.teams[r.id];
    return `<button class="any-item" style="${taken.has(r.id) ? 'opacity:0.4' : ''}${r.id === f.user ? ';outline:2px solid var(--gold,#ffc54d)' : ''}" data-a="pcoPick" data-id="${r.id}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${esc(r.where)}</span></span><span class="sc">${starStr(r.r)}<span class="muted">força ${r.r.toFixed(1)}</span></span></button>`;
  }).join('')}</div>`;
}
act('pcChange2', () => { UI.pc.step = 'setup'; render(); });
