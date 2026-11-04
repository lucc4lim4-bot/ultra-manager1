/* ===================== online friendly: two friends meet in a room (code), pick any team, formation and mentality; the host simulates the match
   (first half, a half-time talk where both change the mentality, second half) and both screens play it back minute by minute ===================== */
const FN = { room: null, poll: null, mine: {}, st: null, m: null, runId: 0, htAt: 0, tmr: null };
const FN_MENT = [[-1, 'Defensiva'], [0, 'Equilibrada'], [1, 'Ofensiva']];
function fnPeers() { try { return FN.room ? FN.room.peers().filter((p) => p.kind === 'viewer') : []; } catch (e) { return []; } }
function fnMe() { return fnPeers().find((p) => p.isMe && p.sameTab) || null; }
function fnHostPeer() { return fnPeers().find((p) => p.presence && p.presence.h === 1) || null; }
function fnSet(patch) { Object.assign(FN.mine, patch); if (FN.room) FN.room.presence(patch).catch(() => {}); }
function fnLeave() {
  if (FN.poll) clearInterval(FN.poll);
  if (FN.tmr) clearInterval(FN.tmr);
  FN.poll = FN.tmr = null;
  if (FN.room) { try { FN.room.leave(); } catch (e) { /* ignore */ } }
  if (FN.m && S.matches) delete S.matches[FN.m.id];
  Object.assign(FN, { room: null, mine: {}, st: null, m: null, runId: 0, htAt: 0 });
}
function fnCode() { const A = 'abcdefghjkmnpqrstuvwxyz23456789'; let c = ''; for (let i = 0; i < 5; i++) c += A[Math.floor(Math.random() * A.length)]; return c; }
async function fnJoin(code, presence) {
  const lobby = window.claude && window.claude.use ? await window.claude.use('room') : null;
  if (!lobby) throw new Error('Salas online só funcionam dentro do artefato publicado do Claude (e para quem consegue abrir o link).');
  fnLeave();
  FN.room = await lobby.join('fr-' + code);
  FN.mine = {};
  fnSet(presence);
  FN.poll = setInterval(fnTick, 150);
}

act('openFriendlyNet', () => {
  UI.fn = { step: 'setup', era: 2026, kind: 'club', nick: 'Jogador' + (10 + Math.floor(Math.random() * 90)), codeIn: '', err: '', user: 0, fm: '4-3-3', mt: 0, q: '', grp: 'all', on: null, stage: '', clock: 0 };
  UI.screen = 'fnet';
  render();
});
act('fnBack', () => { fnLeave(); UI.fn = null; UI.screen = 'start'; render(); });
act('fnSet', (el) => { const k = el.dataset.k; UI.fn[k] = k === 'era' ? +el.dataset.v : el.dataset.v; render(); });
act('fnNick', (el) => { UI.fn.nick = el.value.replace(/[^\w \-À-ÿ]/g, '').slice(0, 16); });
act('fnCodeIn', (el) => { UI.fn.codeIn = el.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12); });
async function fnLoadWorld(era, kind) {
  await pcLoadWorld(era, kind);
}
act('fnCreate', async () => {
  const f = UI.fn;
  const nick = (f.nick || 'Jogador').trim() || 'Jogador';
  try {
    const code = fnCode();
    await fnJoin(code, { n: nick, h: 1, cf: { era: f.era, kind: f.kind }, tm: 0, fm: f.fm, mt: f.mt, rd: 0 });
    f.on = { code, host: true, loaded: false };
    f.step = 'lobby'; f.user = 0;
    render();
    await fnLoadWorld(f.era, f.kind);
    f.on.loaded = true; UI.screen = 'fnet'; render();
  } catch (e) { console.error(e); fnLeave(); f.on = null; f.step = 'setup'; render(); toast(e.message || 'Não foi possível criar a sala.', true); }
});
act('fnJoin', async () => {
  const f = UI.fn;
  const nick = (f.nick || 'Jogador').trim() || 'Jogador';
  const code = (f.codeIn || '').trim();
  if (code.length < 3) { toast('Digite o código da sala.', true); return; }
  try {
    await fnJoin(code, { n: nick, tm: 0, fm: f.fm, mt: f.mt, rd: 0 });
    let host = null;
    for (let i = 0; i < 30 && !host; i++) { await new Promise((r) => setTimeout(r, 200)); host = fnHostPeer(); }
    if (!host) { fnLeave(); toast('Sala não encontrada: ninguém criou essa sala (confira o código).', true); return; }
    const cf = host.presence.cf || { era: 2026, kind: 'club' };
    f.era = cf.era; f.kind = cf.kind;
    f.on = { code, host: false, loaded: false };
    f.step = 'lobby'; f.user = 0;
    render();
    await fnLoadWorld(cf.era, cf.kind);
    f.on.loaded = true; UI.screen = 'fnet'; render();
  } catch (e) { console.error(e); fnLeave(); f.on = null; f.step = 'setup'; render(); toast(e.message || 'Não foi possível entrar na sala.', true); }
});
act('fnGrp', (el) => { UI.fn.grp = el.value; render(); });
act('fnQ', (el) => { UI.fn.q = el.value; const box = $('#fn-list'); if (box) box.innerHTML = fnListHtml(); });
act('fnPick', (el) => {
  const f = UI.fn, id = +el.dataset.id;
  if (fnPeers().some((p) => !p.isMe && p.presence.tm === id)) { toast('O outro jogador já escolheu esse time.', true); return; }
  f.user = id; fnSet({ tm: id, rd: 0 }); render();
});
act('fnForm', (el) => { UI.fn.fm = el.value; fnSet({ fm: el.value, rd: 0 }); render(); });
act('fnMent', (el) => {
  const f = UI.fn, v = +el.dataset.v;
  if (f.stage === 'ht') { f.mt2 = v; fnSet({ m2: v }); } else { f.mt = v; fnSet({ mt: v, rd: 0 }); }
  render();
});
act('fnReady', () => {
  const f = UI.fn;
  if (!f.user) { toast('Escolha o seu time primeiro.', true); return; }
  const me = fnMe(); fnSet({ rd: me && me.presence.rd ? 0 : 1 }); render();
});
act('fnStart', () => {
  const f = UI.fn;
  const ps = fnPeers().filter((p) => p.presence.tm);
  if (ps.length !== 2 || ps.some((p) => !p.presence.rd)) { toast('Os dois jogadores precisam escolher um time e marcar "Pronto".', true); return; }
  if (ps[0].presence.tm === ps[1].presence.tm) { toast('Os dois escolheram o mesmo time.', true); return; }
  fnHostRun(ps);
});
act('fnHalfReady', () => { const f = UI.fn; fnSet({ h2: f.runSeen || 1 }); f.ready2 = true; render(); });
act('fnAgain', () => {
  const f = UI.fn;
  f.step = 'lobby'; f.stage = ''; f.clock = 0; f.res = null; f.ready2 = false; f.mt2 = undefined;
  if (FN.tmr) clearInterval(FN.tmr); FN.tmr = null;
  fnSet({ rd: 0, h2: 0, m2: 0, go: 0, r1: 0, r2: 0 });
  FN.st = null; FN.runId = 0;
  render();
});

// ----- host: runs the match
function fnPack(st, ids) {
  const code = { goal: 'g', yellow: 'y', red: 'r' };
  const e = st.ev.filter((x) => code[x.t]).map((x) => [x.min, code[x.t], x.s, x.p ? pidName(x.p) : '']);
  const s = st.stats;
  return { id: ids, s: st.score.slice(), e, x: { sh: s.sh, sot: s.sot, cor: s.cor, fo: s.fo, poss: s.poss } };
}
function fnHostRun(ps) {
  const f = UI.fn;
  const host = ps.find((p) => p.presence.h === 1), guest = ps.find((p) => p.presence.h !== 1);
  if (!host || !guest) return;
  const id = Date.now() % 1e9;
  const [a, b] = [host.presence.tm, guest.presence.tm];
  g2Defaults();
  for (const [tm, pr] of [[a, host.presence], [b, guest.presence]]) {
    const t = S.teams[tm];
    if (FORMATIONS[pr.fm]) t.form = pr.fm;
    t.ment = pr.mt === 1 || pr.mt === -1 ? pr.mt : 0;
    if (t.isNat) autoCallUp(t.code, true);
  }
  S.user.team = a; S.coach.unemployed = false;
  S.date = dayOf(S.era, 3, 15);
  const m = { id: 'fn' + id, h: a, a: b, c: 0, d: S.date, r: 0, fr: true };
  S.matches[m.id] = m;
  const st = startMatchState(m, { user: 0 });
  st.autoUser = true;
  simulateRange(st, m, 45 + st.stoppage[0]);
  st.min = 45; st.half = 2;
  FN.st = st; FN.m = m; FN.runId = id; FN.htAt = Date.now();
  fnSet({ go: { id, a, b }, h2: 0, m2: 0, r2: 0, r1: fnPack(st, id) });
  render();
}
function fnHostSecond() {
  const st = FN.st, m = FN.m;
  if (!st || !m) return;
  const ps = fnPeers();
  const hp = ps.find((p) => p.presence.h === 1), gp = ps.find((p) => p.presence.h !== 1);
  if (hp && (hp.presence.m2 === 1 || hp.presence.m2 === -1)) st.sides[0].mentality = hp.presence.m2;
  if (gp && (gp.presence.m2 === 1 || gp.presence.m2 === -1)) st.sides[1].mentality = gp.presence.m2;
  computeRatesLive(st);
  simulateRange(st, m, 90 + st.stoppage[1]);
  st.min = 90 + st.stoppage[1]; st.done = true;
  const res = fnPack(st, FN.runId);
  FN.st = null;
  delete S.matches[m.id];
  fnSet({ r2: res });
}

// ----- the periodic tick: peers, start of the match, half-time, results
function fnTick() {
  const f = UI.fn;
  if (!f || !f.on || !FN.room) return;
  const me = fnMe(), host = fnHostPeer();
  if (!me) return;
  if (!host && !f.on.host && f.on.loaded) { if (!f.on.lost) { f.on.lost = true; toast('O anfitrião saiu da sala.', true); render(); } return; }
  const hp = f.on.host ? FN.mine : (host ? host.presence : null);
  if (!hp) return;
  // lobby: keep the screen in sync (other player's team, ready)
  if (f.step === 'lobby') {
    const sig = fnPeers().map((p) => `${p.presence.n}|${p.presence.tm}|${p.presence.rd}|${p.presence.fm}|${p.presence.mt}`).join(';');
    if (sig !== f.sig) { f.sig = sig; if (UI.screen === 'fnet' && !document.activeElement.matches('input,select')) render(); }
    if (hp.go && hp.go.id && f.on.loaded && f.runSeen !== hp.go.id) {
      f.runSeen = hp.go.id; f.step = 'match'; f.stage = 'wait1'; f.clock = 0; f.res = null; f.ready2 = false; f.mt2 = undefined; f.go = hp.go;
      render();
    }
  }
  if (f.step !== 'match') return;
  const id = hp.go && hp.go.id;
  if (id !== f.runSeen) return;
  if (f.stage === 'wait1' && hp.r1 && hp.r1.id === id) { f.res = hp.r1; fnPlay(1, 0, 45 + 1); }
  if (f.on.host && f.stage === 'ht' && FN.st) {
    const ps = fnPeers().filter((p) => p.presence.tm);
    const all = ps.length >= 2 && ps.every((p) => p.presence.h2 === id);
    if (all || Date.now() - FN.htAt > 150000) { f.stage = 'wait2'; fnHostSecond(); render(); }
  }
  if (f.stage === 'wait2' || f.stage === 'ht') {
    if (hp.r2 && hp.r2.id === id && f.stage === 'wait2') { f.res = hp.r2; fnPlay(2, 45, 90 + 1); }
    else if (hp.r2 && hp.r2.id === id && f.stage === 'ht' && !f.on.host) { /* the host moved on while we were choosing: just follow */ f.res = hp.r2; fnPlay(2, 45, 91); }
  }
}
// plays back minutes [from, to] of the match with the minute-by-minute ticker
function fnPlay(half, from, to) {
  const f = UI.fn;
  f.stage = half === 1 ? 'p1' : 'p2';
  f.clock = from;
  let last = Date.now();
  if (FN.tmr) clearInterval(FN.tmr);
  FN.tmr = setInterval(() => {
    const now = Date.now();
    f.clock += (now - last) / 1000 * 3.4;
    last = now;
    if (f.clock >= to) {
      f.clock = to;
      clearInterval(FN.tmr); FN.tmr = null;
      f.stage = half === 1 ? 'ht' : 'end';
      if (half === 2) { f.res = f.res; }
    }
    if (UI.screen === 'fnet') render();
  }, 250);
  render();
}
function fnScoreAt(res, clock) {
  const sc = [0, 0];
  for (const e of res.e) if (e[1] === 'g' && e[0] <= clock) sc[e[2]]++;
  return sc;
}
function fnListHtml() {
  const f = UI.fn;
  const q = strip((f.q || '').trim());
  const rows = anyClubEntries().filter((r) => (f.grp === 'all' || r.grp === f.grp) && (!q || r.q.includes(q)));
  if (!rows.length) return '<div class="empty">Nenhum resultado para essa busca.</div>';
  const shown = rows.slice(0, 60);
  const other = fnPeers().filter((p) => !p.isMe).map((p) => p.presence.tm);
  return `<div class="any-grid">${shown.map((r) => {
    const t = S.teams[r.id];
    const taken = r.id === f.user || other.includes(r.id);
    return `<button class="any-item" style="${taken ? 'opacity:0.45' : ''}" data-a="fnPick" data-id="${r.id}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${esc(r.where)}</span></span><span class="sc">${starStr(r.r)}<span class="muted">força ${r.r.toFixed(1)}</span></span></button>`;
  }).join('')}</div>${rows.length > shown.length ? `<p class="muted" style="font-size:13px;margin:10px 0 0">Mostrando ${shown.length} de ${rows.length}. Digite o nome ou escolha a liga para achar os outros.</p>` : ''}`;
}
function fnMentSeg(cur) {
  return `<div class="seg">${FN_MENT.map(([v, l]) => `<button class="${cur === v ? 'on' : ''}" data-a="fnMent" data-v="${v}">${l}</button>`).join('')}</div>`;
}
function fnEvLine(e, res) {
  const g = UI.fn.go || {};
  const tm = e[2] === 0 ? g.a : g.b;
  const label = e[1] === 'g' ? `⚽ GOL! ${esc(e[3] || 'Gol contra')}` : e[1] === 'y' ? `🟨 Cartão amarelo para ${esc(e[3])}` : `🟥 ${esc(e[3])} é expulso!`;
  return `<div class="row" style="gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.06)"><span class="muted" style="width:34px">${e[0]}'</span>${crest(tm, 18)}<span>${label}</span></div>`;
}
function viewFriendlyNet() {
  const f = UI.fn;
  if (!f) return viewStart();
  const head = `<div class="row wrap" style="margin-bottom:14px"><button class="btn" data-a="fnBack">← Sair</button><h2 style="font-size:34px;font-weight:800;margin:0" class="grow">Amistoso online</h2>${f.on ? `<span class="pill">Sala <b style="letter-spacing:2px">${esc(f.on.code.toUpperCase())}</b></span>` : ''}</div>`;
  if (f.step === 'setup') {
    return `<div class="page" style="max-width:720px;margin:0 auto;padding:18px">${head}
      <div class="panel"><p style="margin:0 0 12px">Jogue um amistoso contra um amigo: um cria a sala e passa o <b>código</b>, o outro entra com ele. Cada um escolhe time, formação e mentalidade; no intervalo vocês mudam a mentalidade e a partida segue ao vivo, minuto a minuto, nas duas telas.</p>
        <p class="muted" style="font-size:13px;margin:0 0 14px">Funciona dentro do artefato publicado no Claude, e seu amigo precisa conseguir abrir o link (use Compartilhar).</p>
        <div class="muted up" style="font-size:11px">Seu apelido</div>
        <input class="input" style="margin:6px 0 14px;max-width:260px" value="${esc(f.nick)}" data-a="fnNick" data-live="1" maxlength="16" aria-label="Apelido">
        <div class="panel" style="margin-bottom:12px"><h3 style="margin:0 0 8px">Criar sala</h3>
          <div class="muted up" style="font-size:11px">Época</div>
          <div class="seg" style="margin:6px 0 10px">${[2016, 2021, 2026].map((y) => `<button class="${f.era === y ? 'on' : ''}" data-a="fnSet" data-k="era" data-v="${y}">${y}</button>`).join('')}</div>
          <div class="muted up" style="font-size:11px">Tipo de time</div>
          <div class="seg" style="margin:6px 0 12px">${[['club', 'Clubes'], ['national', 'Seleções']].map(([k, l]) => `<button class="${f.kind === k ? 'on' : ''}" data-a="fnSet" data-k="kind" data-v="${k}">${l}</button>`).join('')}</div>
          <button class="btn gold" data-a="fnCreate">Criar sala</button></div>
        <div class="panel"><h3 style="margin:0 0 8px">Entrar em uma sala</h3>
          <div class="row wrap" style="gap:8px"><input class="input" style="max-width:200px;text-transform:uppercase;letter-spacing:2px" placeholder="CÓDIGO" value="${esc(f.codeIn)}" data-a="fnCodeIn" data-live="1" maxlength="12" aria-label="Código da sala"><button class="btn gold" data-a="fnJoin">Entrar</button></div></div>
      </div></div>`;
  }
  if (f.step === 'lobby') {
    const ps = fnPeers();
    const me = fnMe();
    const meP = me ? me.presence : {};
    const card = (p) => {
      const t = p.presence.tm ? S.teams[p.presence.tm] : null;
      return `<div class="panel" style="flex:1;min-width:220px"><div class="muted up" style="font-size:11px">${p.presence.h === 1 ? 'ANFITRIÃO' : 'CONVIDADO'}${p.isMe ? ' · você' : ''}</div><div style="font-weight:800;margin:2px 0 8px">${esc(p.presence.n || 'Jogador')}</div>
        ${t && f.on.loaded ? `<div class="row" style="gap:10px">${crest(t, 40)}<div><div class="disp" style="font-size:20px;font-weight:800">${esc(t.n)}</div><div class="muted" style="font-size:13px">${esc(p.presence.fm || '4-3-3')} · ${(FN_MENT.find((x) => x[0] === p.presence.mt) || FN_MENT[1])[1]}</div></div></div>` : '<div class="muted">Escolhendo o time…</div>'}
        <div style="margin-top:8px">${p.presence.rd ? '<span class="pill" style="background:#1f8f4f">Pronto</span>' : '<span class="pill">Aguardando</span>'}</div></div>`;
    };
    const rows = f.on.loaded ? anyClubEntries() : [];
    const groups = [...new Set(rows.map((r) => r.grp))];
    const full = ps.filter((p) => p.presence.tm).length >= 2 && ps.length >= 2;
    return `<div class="page" style="max-width:1000px;margin:0 auto;padding:18px">${head}
      ${f.on.lost ? '<div class="panel" style="border:1px solid #c33">O anfitrião saiu da sala.</div>' : ''}
      <div class="row wrap" style="gap:12px;align-items:stretch">${ps.map(card).join('') || '<div class="muted">Conectando…</div>'}${ps.length < 2 ? '<div class="panel" style="flex:1;min-width:220px"><div class="muted">Aguardando o outro jogador entrar com o código <b>' + esc(f.on.code.toUpperCase()) + '</b>…</div></div>' : ''}</div>
      ${f.on.loaded ? `<div class="panel" style="margin-top:12px"><div class="row wrap" style="gap:16px">
        <div><div class="muted up" style="font-size:11px">Formação</div><select class="input" data-a="fnForm" aria-label="Formação">${Object.keys(FORMATIONS).map((k) => `<option ${f.fm === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
        <div><div class="muted up" style="font-size:11px">Mentalidade</div>${fnMentSeg(f.mt)}</div>
        <span class="grow"></span>
        <button class="btn ${meP.rd ? '' : 'gold'}" data-a="fnReady">${meP.rd ? 'Cancelar pronto' : 'Pronto'}</button>
        ${f.on.host ? `<button class="btn gold big" data-a="fnStart" ${full ? '' : 'style="opacity:0.6"'}>▶ Iniciar partida</button>` : '<span class="muted">O anfitrião inicia a partida.</span>'}</div></div>
        <div class="panel" style="margin-top:12px"><div class="row wrap" style="margin-bottom:10px"><h3 class="grow" style="font-size:22px;margin:0">Escolher o seu time</h3><span class="muted" style="font-size:13px">${rows.length} ${f.kind === 'national' ? 'seleções' : 'clubes'}</span></div>
          <div class="row wrap" style="gap:8px;margin-bottom:10px"><input class="input grow" type="search" placeholder="Buscar pelo nome…" value="${esc(f.q || '')}" data-a="fnQ" data-live="1" autocomplete="off" aria-label="Buscar time">
            <select class="input" style="max-width:320px" data-a="fnGrp" aria-label="Liga"><option value="all">Todas as ${f.kind === 'national' ? 'confederações' : 'ligas'}</option>${groups.map((g) => `<option value="${esc(g)}" ${f.grp === g ? 'selected' : ''}>${esc(anyGroupLabel(g))}</option>`).join('')}</select></div>
          <div id="fn-list">${fnListHtml()}</div></div>` : '<div class="panel" style="margin-top:12px"><p class="muted" style="margin:0">Carregando os elencos…</p></div>'}
    </div>`;
  }
  // the match
  const g = f.go || {}, res = f.res;
  const sc = res ? fnScoreAt(res, f.clock) : [0, 0];
  const clock = f.stage === 'end' ? 'FIM' : f.stage === 'ht' ? 'INTERVALO' : f.stage === 'wait1' || f.stage === 'wait2' ? '…' : `${Math.min(90, Math.floor(f.clock))}'`;
  const board = `<div class="score-head" style="position:static"><div class="side">${crest(g.a, 56)}<div class="tname">${esc(teamName(g.a))}</div></div><div class="scorebox"><div class="sc">${sc[0]} - ${sc[1]}</div><div class="clock">${clock}</div></div><div class="side r"><div class="tname">${esc(teamName(g.b))}</div>${crest(g.b, 56)}</div></div>`;
  const evs = res ? res.e.filter((e) => e[0] <= f.clock).slice().reverse() : [];
  const feed = `<div style="margin:12px 0;min-height:60px">${evs.length ? evs.map((e) => fnEvLine(e, res)).join('') : '<div class="muted center">Bola rolando…</div>'}</div>`;
  let foot = '';
  if (f.stage === 'wait1' || f.stage === 'wait2') foot = '<p class="muted center">Aguardando o anfitrião…</p>';
  else if (f.stage === 'ht') {
    const myM = f.mt2 !== undefined ? f.mt2 : f.mt;
    foot = `<div class="panel" style="margin-top:8px"><h3 style="margin:0 0 8px">Intervalo · ajuste a mentalidade</h3>${fnMentSeg(myM)}
      <div style="margin-top:12px">${f.ready2 ? '<span class="muted">Pronto! Esperando o outro jogador…</span>' : '<button class="btn gold" data-a="fnHalfReady">Começar o 2º tempo</button>'}</div></div>`;
  } else if (f.stage === 'end' && res) {
    const x = res.x, st = (l, v) => `<div class="row" style="justify-content:space-between"><b>${v[0]}</b><span class="muted">${l}</span><b>${v[1]}</b></div>`;
    const my = fnMe(), mine = my && my.presence.tm === g.a ? 0 : 1;
    const verdict = sc[0] === sc[1] ? 'Empate!' : (sc[0] > sc[1]) === (mine === 0) ? 'Você venceu! 🏆' : 'Você perdeu.';
    foot = `<div class="panel" style="margin-top:8px"><div class="disp center" style="font-size:26px;font-weight:800;margin-bottom:10px">${verdict}</div>
      <div style="display:grid;gap:4px;max-width:420px;margin:0 auto 14px">${st('Finalizações', x.sh)}${st('No alvo', x.sot)}${st('Escanteios', x.cor)}${st('Faltas', x.fo)}${st('Posse (%)', x.poss)}</div>
      <div class="row wrap" style="justify-content:center"><button class="btn gold" data-a="fnAgain">Jogar de novo</button><button class="btn" data-a="fnBack">Sair da sala</button></div></div>`;
  }
  return `<div class="page" style="max-width:760px;margin:0 auto;padding:18px">${head}<div class="panel">${board}${feed}</div>${foot}</div>`;
}
