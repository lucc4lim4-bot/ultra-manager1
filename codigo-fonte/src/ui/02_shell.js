/* ===================== career shell & central ===================== */
function navTabs() {
  if (S.pl) return [['central', 'Central'], ['inbox', 'Notificações'], ['jogador', 'Jogador'], ['agente', 'Agente'], ['tabela', 'Tabela']];
  const nat = S.mode === 'national';
  const tabs = [['central', 'Central'], ['inbox', 'Notificações'], ['squad', nat ? 'Seleção' : 'Elenco']];
  if (!nat) tabs.push(['transfers', 'Transferências']);
  if (!nat && !S.zoeira) tabs.push(['academy', 'Academia']);
  tabs.push(['office', 'Escritório']);
  return tabs;
}
function viewCareer() {
  const t = S.teams[S.user.team];
  const un = unreadCount();
  const conf = Math.round(S.board.conf);
  const segs = 10, on = Math.round(conf / 10);
  const cls = conf < 30 ? 'low' : conf < 55 ? 'mid' : '';
  const nav = navTabs().map(([k, l]) => `<button class="${UI.tab === k ? 'on' : ''}" data-a="tab" data-t="${k}">${l}${k === 'inbox' && un ? `<span class="badge">${un}</span>` : ''}</button>`).join('');
  let content = '';
  if (UI.tab === 'central') content = viewCentral();
  else if (UI.tab === 'inbox') content = viewInbox();
  else if (UI.tab === 'squad') content = viewSquad();
  else if (UI.tab === 'transfers') content = viewTransfers();
  else if (UI.tab === 'academy') content = viewAcademy();
  else if (UI.tab === 'office') content = viewOffice();
  else if (UI.tab === 'jogador') content = viewPlayerTab();
  else if (UI.tab === 'agente') content = viewAgentTab();
  else if (UI.tab === 'tabela') content = viewTableTab();
  if (S.celebrate && S.celebrate.length && !UI.celebrating) later(() => showCelebration());
  else if (S.pendingEnd && !UI.seasonOpen && !UI.celebrating) later(() => openSeasonEnd());
  return `<header class="topbar"><div class="topbar-in">
      <div class="logo-mark" title="Ultra Manager">UM</div>
      <nav class="nav" aria-label="Seções">${nav}</nav>
      <div class="club-chip" ${S.coach.unemployed ? '' : `data-a="openTeam" data-id="${t.id}" role="button" tabindex="0" title="Ver o clube" style="cursor:pointer"`}>${S.coach.unemployed ? `<span class="chip">Sem clube</span>` : `${crest(t, 34)}<div><div class="nm">${esc(t.n)}</div><div class="conf-bar ${cls}" title="Confiança da diretoria: ${conf}%">${Array.from({ length: segs }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('')}</div></div>`}</div>
      ${coinPill()}
      <button class="icon-btn" data-a="openMenu" aria-label="Menu">☰</button>
    </div></header>
    <main class="page">${content}</main>`;
}
act('tab', (el) => { UI.tab = el.dataset.t; render(); window.scrollTo(0, 0); });
act('goHub', () => { UI.screen = 'career'; UI.tab = 'central'; closeAllModals(); render(); });
act('openMenu', () => {
  openModal(modalShell('Menu', `<div class="col">
    <button class="menu-btn" data-a="manualSave"><span class="ic">💾</span><span>Salvar carreira<small>Salva no navegador (automático também)</small></span></button>
    <button class="menu-btn" data-a="exportSave"><span class="ic">⤒</span><span>Exportar save<small>Baixar arquivo para guardar ou levar a outro aparelho</small></span></button>
    <button class="menu-btn" data-a="openTraining"><span class="ic">🎯</span><span>Treinos<small>Pênalti, falta e passe${S.pl ? ' (dão XP ao jogador)' : ''}</small></span></button>
    ${S.pl ? '<button class="menu-btn" data-a="openPlLook"><span class="ic">🎨</span><span>Personalizar jogador<small>Pele, cabelo, barba, chuteira, número</small></span></button>' : '<button class="menu-btn" data-a="openCoachLook"><span class="ic">🧢</span><span>Perfil do técnico<small>Nome, nacionalidade, estilo e aparência</small></span></button>'}
    <button class="menu-btn" data-a="openKit"><span class="ic">👕</span><span>Uniforme<small>Cores e padrões da camisa, calção e meias (casa e fora)</small></span></button>
    <button class="menu-btn" data-a="openCrestsInGame"><span class="ic">🛡</span><span>Escudos dos times<small>Use imagens suas, uma a uma ou em lote</small></span></button>
    <button class="menu-btn" data-a="openStoreInGame"><span class="ic">🛒</span><span>Loja de times<small>${INFINITE_COINS ? 'FutCoins infinitas' : WALLET.coins + ' FutCoins disponíveis'}</small></span></button>
    <button class="menu-btn" data-a="howTo"><span class="ic">?</span><span>Como jogar</span></button>
    <button class="menu-btn" data-a="adminOpen"><span class="ic">🔐</span><span>Admin<small>Injetar dinheiro no clube (pede código)</small></span></button>
    <button class="menu-btn" data-a="exitToStart"><span class="ic">⏏</span><span>Sair para o menu<small>Salva antes de sair</small></span></button>
  </div>`), { size: 'narrow' });
});
act('openStoreInGame', () => { closeModal(); ACT.openStore(); });
act('openCrestsInGame', () => { closeModal(); ACT.openCrests(); });
act('manualSave', async () => { await saveGame(S.id); SAVES = await listSaves(); closeModal(); toast('Carreira salva.'); });
act('exitToStart', async () => { await saveGame(S.id); SAVES = await listSaves(); closeAllModals(); UI.screen = 'start'; render(); });
act('exportSave', async () => {
  closeAllModals();
  const blob = await exportSaveBlob();
  const name = `ultra-manager-${strip(S.coach.name).replace(/[^a-z0-9]+/g, '-')}-${fmtDate(S.date).replace(/\//g, '-')}.json`;
  await offerDownload(name, blob, 'Save exportado. Use "Importar save" para continuar em outro aparelho.');
});

// ------------------------------------------------------------------ central
function userComps() {
  const uid = S.user.team;
  return S.active.map((id) => S.comps[id]).filter((c) => c && (c.teams.includes(uid) || (c.groups && c.groups.some((g) => g.teams.includes(uid))) || (S.tm[uid] || []).some((mid) => S.matches[mid] && S.matches[mid].c === c.id)));
}
function userLeagueComp() {
  const uid = S.user.team;
  return S.active.map((id) => S.comps[id]).find((c) => c && c.kind === 'league' && c.teams.includes(uid));
}
function viewCentral() {
  if (S.pl && S.pl.ended) return plEndedView();
  if (S.coach.unemployed) return viewUnemployed();
  const uid = S.user.team;
  const t = S.teams[uid];
  const nm = nextMatch(uid);
  const today = userMatchToday();
  const days = nm ? nm.d - S.date : null;
  let fixture = '';
  if (nm) {
    const c = S.comps[nm.c];
    const rd = c && c.rounds[nm.r];
    fixture = `<div class="comp-line">${compBadge(c, 28)}<span>${esc(c ? c.name : '')}${rd ? ` · ${esc(rd.name)}` : ''}</span><span class="when">${fmtDate(nm.d, 'dm')} · ${nm.t}</span></div>
      <div class="fixture"><div class="crests">${crest(nm.h, 64)}${crest(nm.a, 64)}</div><div class="sep"></div>
        <div class="names">${esc(teamName(nm.h))}<br>${esc(teamName(nm.a))}</div></div>
      <div class="row wrap" style="margin:-6px 0 16px;gap:16px;font-size:13px"><span class="muted">Últimos 5:</span><span class="row" style="gap:6px">${crest(nm.h, 18)}${formRow(nm.h)}</span><span class="row" style="gap:6px">${crest(nm.a, 18)}${formRow(nm.a)}</span></div>`;
  } else fixture = `<div class="panel" style="margin:12px 0 18px">Nenhum jogo marcado no momento. ${S.mode === 'national' ? 'A seleção aguarda a próxima data FIFA.' : 'Aproveite para reforçar o elenco.'}</div>`;
  const sub = today ? 'Dia de jogo!' : nm ? (days === 1 ? 'Próximo jogo amanhã' : `Próximo jogo em ${days} dias`) : 'Sem jogos agendados';
  const advance = S.pendingEnd ? `<button class="btn primary big" data-a="openSeasonEnd"><span class="x-key">✕</span>Ver fim de temporada</button>`
    : today ? `<button class="btn primary big" data-a="goMatch" data-id="${today.id}"><span class="x-key">✕</span>Ir para a partida</button>`
      : `<button class="btn primary big" data-a="advance" data-m="day" ${UI.busy ? 'disabled' : ''}><span class="x-key">✕</span>Avançar</button>
         <button class="btn" data-a="advance" data-m="match" ${UI.busy ? 'disabled' : ''}>Até o próximo jogo</button>
         <button class="btn" data-a="advance" data-m="week" ${UI.busy ? 'disabled' : ''}>+7 dias</button>
         <button class="btn" data-a="simToCal" ${UI.busy ? 'disabled' : ''} title="Escolha um dia no calendário e simule até ele">Simular até…</button>`;
  // tasks
  const offers = S.tr.offers.filter((o) => o.status === 'open');
  const unread = unreadCount();
  const inj = teamPlayersFor(uid).filter((p) => isInjured(p));
  const tasks = [];
  if (offers.length) {
    const p = S.players[offers[0].pid];
    tasks.push(['⇄', `${p ? esc(p.n) : 'Jogador'} recebeu ${offers.length > 1 ? 'propostas' : 'proposta'}`, 'inbox']);
  }
  if (unread) tasks.push(['✉', `${unread} ${unread === 1 ? 'mensagem não lida' : 'mensagens não lidas'}`, 'inbox']);
  if (inj.length) tasks.push(['✚', `${inj.length} ${inj.length === 1 ? 'jogador lesionado' : 'jogadores lesionados'}`, 'squad']);
  if (!t.isNat) { const w = windowInfo(); tasks.push(['⌛', w.text, 'transfers']); }
  const susp = teamPlayersFor(uid).filter((p) => isSuspended(p));
  if (susp.length) tasks.push(['▮', `${susp.length} ${susp.length === 1 ? 'suspenso' : 'suspensos'}: ${susp.slice(0, 3).map((p) => esc(p.s || p.n)).join(', ')}`, 'squad']);
  const taskHtml = (S.pl ? plTasks() : tasks).map(([ic, txt, tab]) => `<button class="task" data-a="tab" data-t="${tab}"><span class="ic">${ic}</span><span class="grow">${txt}</span><span class="dim">›</span></button>`).join('');
  return `<div class="hub">
    <section>
      <div class="hero-date">${fmtDate(S.date, 'hero')}</div>
      <div class="hero-sub">${sub}${S.zoeira ? ' · <span style="color:#b6ff5a">modo zoeira</span>' : ''}</div>
      ${fixture}
      <div class="advance-row">${advance}</div>
      <div class="task-list">${taskHtml}</div>
      ${S.pl ? viewPlTiles() : viewTeamData()}
    </section>
    <aside class="col" style="gap:16px">${viewNewsCarousel()}${viewRecentResults()}</aside>
  </div>`;
}
function viewTeamData() {
  const uid = S.user.team;
  const t = S.teams[uid];
  const lc = userLeagueComp();
  let pos = '—', pts = '—', played = '';
  if (lc) {
    const tab = sortTable(lc.table, lc.teams);
    const i = tab.findIndex((r) => r.id === uid);
    pos = `${i + 1}º`; pts = tab[i].pts; played = `${tab[i].p} jogos`;
  }
  const comps = userComps();
  const topComp = lc || comps[0];
  const ts = topComp ? topScorers(topComp.id, 50).find((r) => r.team === uid) : null;
  const rec = S.coach.rec;
  return `<div class="grid g4" style="margin-top:18px">
    <div class="stat-tile"><div class="k">${lc ? esc(lc.name) : 'Posição'}</div><div class="v">${pos}</div><div class="muted" style="font-size:13px">${pts} pts ${played ? '· ' + played : ''}</div></div>
    <div class="stat-tile"><div class="k">Artilheiro</div><div class="v" style="font-size:20px">${ts ? esc(ts.name) : '—'}</div><div class="muted" style="font-size:13px">${ts ? `${ts.goals} gols` : 'Sem gols ainda'}</div></div>
    <div class="stat-tile"><div class="k">Carreira</div><div class="v">${rec.w}-${rec.d}-${rec.l}</div><div class="muted" style="font-size:13px">V-E-D · nota ${(S.coach.rating / 10).toFixed(1)}</div></div>
    <div class="stat-tile"><div class="k">${t.isNat ? 'Federação' : 'Orçamento'}</div><div class="v" style="font-size:22px">${t.isNat ? Math.round(S.board.conf) + '%' : money(t.budget)}</div><div class="muted" style="font-size:13px">Objetivo: ${esc(S.board.obj)}</div></div>
  </div>`;
}
function viewUnemployed() {
  const jobs = S.jobs || [];
  return `<div class="hub"><section>
    <div class="hero-date">${fmtDate(S.date, 'hero')}</div>
    <div class="hero-sub">Você está sem clube. Procure um novo trabalho no mercado ou espere propostas.</div>
    <div class="advance-row"><button class="btn primary big" data-a="advance" data-m="week">Avançar 7 dias</button><button class="btn" data-a="advance" data-m="day">Avançar</button></div>
    <div class="panel"><h3>Mercado de trabalho</h3>${viewJobList(jobs)}</div>
  </section><aside class="col">${viewNewsCarousel()}</aside></div>`;
}
function viewJobList(jobs) {
  if (!jobs.length) return '<div class="empty">Nenhuma vaga aberta no momento. Volte na próxima semana.</div>';
  return `<div class="col">${jobs.map((j) => {
    const t = S.teams[j.team];
    const r = t.isNat ? nationRating(t.code) : teamRating(t.id);
    const pr = teamPrestige(t.id);
    const chance = 1 / (1 + Math.exp(-(S.coach.rep + 8 - pr) / 7));
    return `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)">${crest(t, 34)}<div class="grow"><div style="font-weight:700">${esc(t.n)}</div><div class="muted" style="font-size:13px">${starStr(r)} · chance ${Math.round(chance * 100)}%</div></div>
      <button class="btn sm primary" data-a="applyJob" data-id="${t.id}">Candidatar-se</button></div>`;
  }).join('')}</div>`;
}
act('applyJob', (el) => {
  const r = applyForJob(+el.dataset.id);
  toast(r.msg, !r.ok);
  if (r.ok) { UI.tab = 'central'; }
  render();
});

// news · "Ultra Esporte", the game's own fictional sports channel
const NEWS_CATS = {
  'Mercado da bola': '#ffb020', 'Pós-jogo': '#4cc3ff', Rodada: '#38c77f', Tabela: '#9aa4ff', 'Campeão': '#ffc54d',
  'Acesso e rebaixamento': '#ff8a5c', Bastidores: '#c9a0ff', Aposentadoria: '#b9c2c9', 'Inacreditável': '#b6ff5a', 'Seleção': '#ff6b8a', 'Notícias': '#9bb2b8',
};
const NEWS_TAG_CAT = { transfer: 'Mercado da bola', resultado: 'Rodada', clube: 'Pós-jogo', titulo: 'Campeão', liga: 'Tabela', promo: 'Acesso e rebaixamento', retire: 'Aposentadoria', zoeira: 'Inacreditável', selecao: 'Seleção' };
const NEWS_REPORTERS = ['Marina Duarte', 'Caio Andrade', 'Renata Lobo', 'Thiago Barcellos', 'Júlia Pessanha', 'Rodrigo Teles', 'Paula Siqueira', 'Bruno Antunes', 'Lívia Moraes', 'Diego Fontoura'];
function newsCat(n) { const label = n.cat || NEWS_TAG_CAT[n.tag] || 'Notícias'; return { label, color: NEWS_CATS[label] || '#9bb2b8' }; }
function newsReporter(n) { return NEWS_REPORTERS[hashStr('rep' + n.id) % NEWS_REPORTERS.length]; }
function newsAgo(n) { const d = S.date - n.d; return d <= 0 ? 'hoje' : d === 1 ? 'ontem' : d < 7 ? `há ${d} dias` : fmtDate(n.d, 'dm'); }
const ueLogo = (size = 34) => `<span class="ue-logo" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px" aria-hidden="true">UE</span>`;
function newsImage(n) {
  const ids = (n.teams || []).filter((id) => S.teams[id]);
  const t = ids[0] ? S.teams[ids[0]] : null;
  const c1 = t ? t.c1 : '#1d4a57';
  const h = hashStr(String(n.id));
  const cat = newsCat(n);
  const sc = n.sc && S.teams[n.sc[0]] && S.teams[n.sc[1]] ? n.sc : null;
  const crests = sc
    ? `<g transform="translate(70,40) scale(1.7)">${crestInSvg(sc[0], 40)}</g><g transform="translate(182,40) scale(1.7)">${crestInSvg(sc[1], 40)}</g>
       <text x="160" y="92" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="40" fill="#fff" stroke="rgba(0,0,0,0.45)" stroke-width="1.2" paint-order="stroke">${sc[2]}<tspan fill="rgba(255,255,255,0.6)" font-size="26" dx="6" dy="-6">x</tspan><tspan dx="6" dy="6">${sc[3]}</tspan></text>`
    : `<g transform="translate(${ids[1] ? 92 : 128},40) scale(1.6)">${t ? crestInSvg(t, 40) : ''}</g>${ids[1] ? `<g transform="translate(164,40) scale(1.6)">${crestInSvg(ids[1], 40)}</g>` : ''}`;
  const extra = n.tag === 'titulo' ? `<g transform="translate(244,96)">${trophySVG(n.cup && /^(UCL|WC|UL1|LIB|SULA|MUN|EURO|COPA)$/.test(n.cup) ? n.cup : 'UCL', 62)}</g>`
    : n.tag === 'zoeira' ? '<text x="248" y="92" font-size="44">👽</text>'
      : n.tag === 'transfer' && !sc ? `<g transform="translate(222,26) rotate(8)"><rect width="78" height="26" rx="5" fill="rgba(0,0,0,0.35)" stroke="#fff" stroke-width="1.5"/><text x="39" y="18" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="15" fill="#fff" letter-spacing="1">OFICIAL</text></g>` : '';
  const band = `<g><rect x="0" y="150" width="320" height="50" fill="rgba(4,14,18,0.78)"/><rect x="0" y="150" width="6" height="50" fill="${cat.color}"/>
    <text x="16" y="171" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="13" letter-spacing="1.5" fill="${cat.color}">${esc(cat.label.toUpperCase())}</text>
    <text x="16" y="190" font-family="Barlow, sans-serif" font-weight="600" font-size="12" fill="rgba(255,255,255,0.75)">ULTRA ESPORTE${n.fee ? ` · ${esc(fmtMoney(n.fee))}` : ''}</text></g>`;
  return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="ng${n.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="#071318"/></linearGradient>
    <radialGradient id="nl${n.id}" cx="${30 + (h % 40)}%" cy="0%" r="80%"><stop offset="0" stop-color="rgba(255,255,255,0.35)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
    <rect width="320" height="200" fill="url(#ng${n.id})"/><rect width="320" height="200" fill="url(#nl${n.id})"/>
    <g opacity="0.16" stroke="#fff" stroke-width="2" fill="none"><rect x="20" y="118" width="280" height="120"/><circle cx="160" cy="178" r="40"/><line x1="20" y1="178" x2="300" y2="178"/></g>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${((h >> i) % 280)}" y="0" width="${8 + (i * 7) % 20}" height="200" fill="rgba(255,255,255,0.03)" transform="skewX(-18)"/>`).join('')}
    ${crests}${extra}${band}
  </svg>`;
}
function viewNewsCarousel() {
  const list = S.news.slice(0, 6);
  if (!list.length) return `<div class="news-card"><div class="news-top">${ueLogo()}<div><b>Ultra Esporte</b><div class="muted" style="font-size:12px">${fmtDate(S.date, 'dm')}</div></div></div><div class="news-body"><h4>A bola vai rolar</h4><p class="muted">A cobertura do Ultra Esporte aparece aqui conforme a temporada avança: mercado da bola, rodadas, tabela e bastidores.</p></div></div>`;
  const i = clamp(UI.newsIdx, 0, list.length - 1);
  const n = list[i];
  const cat = newsCat(n);
  return `<div class="news-card">
    <div class="news-top">${ueLogo()}<div class="grow"><b>Ultra Esporte</b><div class="muted" style="font-size:12px">${newsAgo(n)} · Por ${esc(newsReporter(n))}</div></div>${n.hot ? '<span class="plantao">PLANTÃO</span>' : S.date - n.d <= 2 ? '<span class="news-new">Novo</span>' : ''}</div>
    <div class="news-img">${newsImage(n)}</div>
    <div class="news-body"><span class="news-cat" style="--c:${cat.color}">${esc(cat.label)}</span><h4>${esc(n.title)}</h4><div class="muted" style="font-size:14px">${esc(n.body)}</div>
      <div class="news-meta"><span>♡ ${n.likes}</span><span>💬 ${n.com} comentários</span><button class="link right" data-a="allNews">Ver todas</button></div></div>
    <div class="dots">${list.map((_, k) => `<button class="${k === i ? 'on' : ''}" data-a="newsDot" data-i="${k}" aria-label="Notícia ${k + 1}"></button>`).join('')}</div>
  </div>`;
}
act('newsDot', (el) => { UI.newsIdx = +el.dataset.i; render(); });
act('allNews', () => {
  UI.newsCat = 'all';
  openModal(() => {
    const cats = uniq(S.news.map((n) => newsCat(n).label));
    const f = UI.newsCat || 'all';
    const list = S.news.filter((n) => f === 'all' || newsCat(n).label === f);
    return modalShell(`${ueLogo(30)} Ultra Esporte`, `
      <div class="row wrap" style="gap:6px;margin-bottom:14px">${['all'].concat(cats).map((c) => `<button class="chip ${f === c ? 'on' : ''}" data-a="newsCatF" data-v="${esc(c)}">${c === 'all' ? 'Todas' : esc(c)}</button>`).join('')}</div>
      <div class="news-feed">${list.map((n) => { const cat = newsCat(n); return `<article class="nf-item"><div class="nf-thumb">${newsImage(n)}</div><div class="nf-text">
        <div class="row wrap" style="gap:8px"><span class="news-cat" style="--c:${cat.color};margin:0">${esc(cat.label)}</span>${n.hot ? '<span class="plantao sm">PLANTÃO</span>' : ''}<span class="muted" style="font-size:12px">${newsAgo(n)}</span></div>
        <h4>${esc(n.title)}</h4><p class="muted">${esc(n.body)}</p><div class="muted" style="font-size:12px">Por ${esc(newsReporter(n))} · ♡ ${n.likes} · 💬 ${n.com}</div></div></article>`; }).join('') || '<div class="empty">Sem notícias nesta categoria.</div>'}</div>`);
  }, { size: 'wide' });
});
act('newsCatF', (el) => { UI.newsCat = el.dataset.v; refreshModal(); });
function viewRecentResults() {
  const lc = userLeagueComp() || userComps()[0];
  if (!lc) return '';
  // last completed round
  let rd = null;
  for (let i = lc.rounds.length - 1; i >= 0; i--) { const r = lc.rounds[i]; if (r.m.length && r.m.every((id) => S.matches[id] && S.matches[id].done)) { rd = r; break; } }
  if (!rd) return '';
  return `<div class="panel"><h3>${compBadge(lc, 22)} ${esc(rd.name)} <span class="sub">${esc(lc.name)}</span></h3>
    <div class="col" style="gap:4px">${rd.m.map((id) => matchLine(S.matches[id])).join('')}</div>
    <div class="row" style="margin-top:10px"><button class="link" data-a="gotoResults" data-c="${lc.id}">Ver todos os resultados ›</button></div></div>`;
}
function matchLine(m, opts = {}) {
  if (!m) return '';
  const uid = S.user.team;
  const me = m.h === uid || m.a === uid;
  const sc = m.done ? `${m.hg} - ${m.ag}${m.pen ? `<span class="dim" style="font-size:11px"> (${m.pen[0]}-${m.pen[1]})</span>` : ''}` : `<span class="dim">${m.t}</span>`;
  return `<div class="row" style="padding:5px 4px;border-radius:8px;${me ? 'background:rgba(111,125,255,0.12)' : ''};font-size:14px;cursor:pointer" data-a="openMatch" data-id="${m.id}">
    ${opts.date ? `<span class="dim" style="width:44px;font-size:12px">${fmtDate(m.d, 'short')}</span>` : ''}
    <span class="grow" style="text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${m.done && m.hg > m.ag ? 'font-weight:700' : ''}">${esc(teamName(m.h))}</span>${crest(m.h, 18)}
    <span class="tnum" style="min-width:58px;text-align:center;font-weight:700">${sc}</span>
    ${crest(m.a, 18)}<span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${m.done && m.ag > m.hg ? 'font-weight:700' : ''}">${esc(teamName(m.a))}</span></div>`;
}
act('gotoResults', (el) => { UI.tab = 'office'; UI.sub.office = 'results'; UI.resComp = +el.dataset.c; UI.resRound = null; render(); });

// ------------------------------------------------------------------ advancing time
let lastAutosave = 0;
act('advance', async (el) => {
  if (UI.busy) return;
  const mode = el.dataset.m;
  UI.busy = true;
  render();
  const max = mode === 'day' ? 1 : mode === 'week' ? 7 : 120;
  const offersBefore = S.tr.offers.filter((o) => o.status === 'open').length;
  const jobsBefore = S.inbox.filter((m) => m.type === 'job').length;
  try {
    for (let i = 0; i < max; i++) {
      if (S.pendingEnd || (S.celebrate && S.celebrate.length)) break;
      const r = advanceDay();
      if (r.blocked) break;
      if (userMatchToday()) break;
      if (mode === 'match') {
        if (S.tr.offers.filter((o) => o.status === 'open').length > offersBefore) break;
        if (S.inbox.filter((m) => m.type === 'job').length > jobsBefore) break;
        if (S.coach.unemployed && i >= 6) break;
      }
      if (i % 4 === 3) await new Promise((r2) => setTimeout(r2, 0));
    }
  } catch (e) { console.error(e); toast('Erro ao avançar: ' + e.message, true); }
  UI.busy = false;
  if (S.date - lastAutosave >= 7) { lastAutosave = S.date; saveGame(S.id).then(async () => { SAVES = await listSaves(); }); }
  render();
});
