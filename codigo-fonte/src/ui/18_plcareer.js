/* ===================== player career UI: creation, Jogador / Agente / Tabela tabs, match day, season end ===================== */
const PL_NATS = [['BRA', 'Brasil'], ['ARG', 'Argentina'], ['URU', 'Uruguai'], ['COL', 'Colômbia'], ['CHI', 'Chile'], ['PAR', 'Paraguai'], ['ECU', 'Equador'], ['PER', 'Peru'], ['MEX', 'México'], ['USA', 'Estados Unidos'],
  ['POR', 'Portugal'], ['ESP', 'Espanha'], ['FRA', 'França'], ['ENG', 'Inglaterra'], ['GER', 'Alemanha'], ['ITA', 'Itália'], ['NED', 'Holanda'], ['BEL', 'Bélgica'], ['CRO', 'Croácia'], ['SRB', 'Sérvia'],
  ['DEN', 'Dinamarca'], ['SWE', 'Suécia'], ['NOR', 'Noruega'], ['POL', 'Polônia'], ['TUR', 'Turquia'], ['SUI', 'Suíça'], ['SCO', 'Escócia'], ['NGA', 'Nigéria'], ['GHA', 'Gana'], ['SEN', 'Senegal'],
  ['CIV', 'Costa do Marfim'], ['CMR', 'Camarões'], ['MAR', 'Marrocos'], ['EGY', 'Egito'], ['JPN', 'Japão'], ['KOR', 'Coreia do Sul'], ['AUS', 'Austrália']];
const PL_POS_ORDER = ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST'];

// ------------------------------------------------------------------ creation wizard
act('openPlayerCareer', () => {
  UI.plw = { step: 'create', name: '', nat: 'BRA', age: 17, pos: 'ST', foot: 'R', diff: 'normal', era: 2026, q: '', grp: 'all', offers: null };
  UI.screen = 'plwiz'; render();
});
act('plwBack', () => {
  const w = UI.plw;
  if (w && w.step === 'pick') { w.step = 'create'; render(); return; }
  UI.plw = null; UI.screen = 'start'; render();
});
act('plwSet', (el) => { const w = UI.plw; const k = el.dataset.k; w[k] = (k === 'era' || k === 'age') ? +el.dataset.v : el.dataset.v; render(); });
act('plwName', (el) => { UI.plw.name = el.value.slice(0, 30); });
act('plwNat', (el) => { UI.plw.nat = el.value; });
act('plwNext', async () => {
  const w = UI.plw;
  w.name = ($('#plw-name').value || '').trim();
  if (w.name.length < 2) { toast('Digite o nome do seu jogador.', true); return; }
  setLoading('Carregando elencos de ' + w.era + '…', 0.2);
  try {
    await loadEra(w.era);
    setLoading('Montando o mundo do futebol…', 0.6);
    await new Promise((r) => setTimeout(r, 20));
    await createWorld({ era: w.era, mode: 'normal', coachName: w.name, coachAge: 25, noFire: true });
    S.coach.unemployed = false;
    UI.wiz = { anyList: null, anyQ: '', anyG: 'all' };
    const d = PL_DIFF[w.diff] || PL_DIFF.normal;
    const startO = d.o + (w.age - 17) * 1.6;
    const rows = anyClubEntries().filter((r) => r.grp.length <= 3 && !r.grp.endsWith('2') || true);
    // clubs where a youngster can grow: not far above his level
    const cand = rows.filter((r) => r.r >= startO - 8 && r.r <= startO + 3).sort(() => Math.random() - 0.5);
    w.offers = cand.slice(0, 6).map((r) => r.id);
    if (w.offers.length < 3) w.offers = rows.slice(-8).sort(() => Math.random() - 0.5).slice(0, 6).map((r) => r.id);
    w.step = 'pick'; w.q = ''; w.grp = 'all'; w.startO = startO;
    UI.screen = 'plwiz'; render();
  } catch (e) { console.error(e); UI.screen = 'plwiz'; w.step = 'create'; render(); toast(e.message, true); }
});
act('plwReroll', () => { const w = UI.plw; const rows = anyClubEntries().filter((r) => r.r >= w.startO - 8 && r.r <= w.startO + 3).sort(() => Math.random() - 0.5); w.offers = rows.slice(0, 6).map((r) => r.id); render(); });
act('plwGrp', (el) => { UI.plw.grp = el.value; render(); });
act('plwQ', (el) => { UI.plw.q = el.value; const box = $('#plw-list'); if (box) box.innerHTML = plwListHtml(); });
act('plwPick', async (el) => {
  const id = +el.dataset.id, w = UI.plw;
  S.noFire = true;
  closeAllModals();
  setLoading('Preparando o calendário…', 0.05);
  await new Promise((r) => setTimeout(r, 30));
  try {
    await startCareerAsync(id, (p) => setLoading('Simulando o restante do mundo até a sua estreia…', 0.05 + p * 0.9));
    plCreate({ name: w.name, nat: w.nat, age: w.age, pos: w.pos, foot: w.foot, diff: w.diff }, id);
    await saveGame(S.id);
    SAVES = await listSaves();
    UI.plw = null;
    UI.screen = 'career'; UI.tab = 'jogador'; UI.sub = {};
    render();
  } catch (e) { console.error(e); UI.screen = 'plwiz'; render(); toast('Erro ao iniciar: ' + e.message, true); }
});
function plwListHtml() {
  const w = UI.plw;
  const q = strip((w.q || '').trim());
  const rows = anyClubEntries().filter((r) => (w.grp === 'all' || r.grp === w.grp) && (!q || r.q.includes(q)));
  if (!rows.length) return '<div class="empty">Nenhum resultado.</div>';
  return `<div class="any-grid">${rows.slice(0, 60).map((r) => { const t = S.teams[r.id];
    return `<button class="any-item" data-a="plwPick" data-id="${r.id}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${esc(r.where)}</span></span><span class="sc">${starStr(r.r)}<span class="muted">força ${r.r.toFixed(1)}</span></span></button>`; }).join('')}</div>`;
}
function viewPlWizard() {
  const w = UI.plw;
  const head = `<div class="start-top"><div class="row"><div class="logo-mark">UM</div><span class="disp" style="font-size:20px;font-weight:700">CARREIRA DE JOGADOR</span></div></div>`;
  if (w.step === 'create') {
    const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(w[k]) === String(v) ? 'on' : ''}" data-a="plwSet" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    return `${head}<div class="wizard"><h1 style="font-size:44px;font-weight:800">Crie o seu jogador</h1>
      <p class="muted">Você é um jovem talento em busca de espaço. Treine, ganhe a confiança do treinador, jogue no gramado (só você é controlado) e construa a carreira até a aposentadoria.</p>
      <div class="grid g3" style="margin-top:16px">
        <div class="field"><label for="plw-name">Nome do jogador</label><input id="plw-name" class="input" maxlength="30" value="${esc(w.name)}" placeholder="Ex.: Lucas Almeida" data-a="plwName" data-live="1"></div>
        <div class="field"><label for="plw-nat">Nacionalidade</label><select id="plw-nat" class="input" data-a="plwNat">${PL_NATS.map(([c, n]) => `<option value="${c}" ${w.nat === c ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="field"><label>Idade</label>${seg('age', [[16, '16'], [17, '17'], [18, '18'], [19, '19'], [20, '20'], [21, '21']])}</div>
      </div>
      <div class="field" style="margin-top:14px"><label>Posição</label><div class="row wrap" style="gap:6px">${PL_POS_ORDER.map((p) => `<button class="chip ${w.pos === p ? 'on' : ''}" data-a="plwSet" data-k="pos" data-v="${p}">${PL_POS_NAMES[p]}</button>`).join('')}</div></div>
      <div class="grid g3" style="margin-top:14px">
        <div class="field"><label>Pé preferido</label>${seg('foot', [['R', 'Direito'], ['L', 'Esquerdo']])}</div>
        <div class="field"><label>Dificuldade</label>${seg('diff', [['facil', 'Fácil'], ['normal', 'Normal'], ['dificil', 'Difícil']])}</div>
        <div class="field"><label>Ano de início</label>${seg('era', [[2016, '2016'], [2021, '2021'], [2026, '2026']])}</div>
      </div>
      <p class="muted" style="font-size:13px;margin-top:10px">${w.diff === 'facil' ? 'Começa com cerca de 62 de overall e potencial 90.' : w.diff === 'dificil' ? 'Começa com cerca de 54 de overall e potencial 82: mais difícil chegar ao topo.' : 'Começa com cerca de 58 de overall e potencial 86.'} A idade escolhida aumenta o overall inicial.</p>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="plwBack">Voltar</button><button class="btn primary right" data-a="plwNext">Escolher o clube</button></div></div>`;
  }
  const groups = [...new Set(anyClubEntries().map((r) => r.grp))];
  return `${head}<div class="wizard"><h1 style="font-size:44px;font-weight:800">Onde começar?</h1>
    <p class="muted">Clubes que apostam em jovens do seu nível. Você também pode escolher qualquer clube na lista abaixo.</p>
    <div class="choice-grid" style="margin-top:14px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">${(w.offers || []).map((id) => {
      const t = S.teams[id], r = teamRating(id), role = plRoleLabelFor(id, w);
      const row = anyClubEntries().find((x) => x.id === id);
      return `<button class="offer" data-a="plwPick" data-id="${id}"><div class="row">${crest(t, 48)}<div class="grow"><div class="tn">${esc(t.n)}</div><div class="muted" style="font-size:13px">${esc(row ? row.where : '')}</div></div></div>
        <div class="row">${starStr(r)}<span class="muted" style="font-size:13px">força ${r.toFixed(1)}</span></div><span class="btn sm primary" style="align-self:flex-start">Assinar</span></button>`;
    }).join('')}</div>
    <div class="row wrap" style="margin-top:12px"><button class="btn" data-a="plwReroll">Outras sugestões</button></div>
    <div class="panel" style="margin-top:16px"><div class="row wrap" style="gap:8px;margin-bottom:10px"><h3 class="grow" style="margin:0">Todos os clubes</h3>
      <input class="input" style="max-width:260px" type="search" placeholder="Buscar pelo nome…" value="${esc(w.q || '')}" data-a="plwQ" data-live="1" autocomplete="off" aria-label="Buscar clube">
      <select class="input" style="max-width:260px" data-a="plwGrp" aria-label="Liga"><option value="all">Todas as ligas</option>${groups.map((g) => `<option value="${esc(g)}" ${w.grp === g ? 'selected' : ''}>${esc(anyGroupLabel(g))}</option>`).join('')}</select></div>
      <div id="plw-list">${plwListHtml()}</div></div>
    <div class="row" style="margin-top:18px"><button class="btn" data-a="plwBack">Voltar</button></div></div>`;
}
function plRoleLabelFor() { return ''; }

// ------------------------------------------------------------------ small helpers
function plFormArrow(p) {
  const b = formBonus(p);
  return b >= 2 ? ['▲▲', 'var(--win)'] : b >= 1 ? ['▲', 'var(--win)'] : b <= -2 ? ['▼▼', 'var(--loss)'] : b <= -1 ? ['▼', 'var(--loss)'] : ['▶', 'var(--muted)'];
}
function plBar(v, max = 99, col) {
  const pct = clamp(v / max * 100, 0, 100);
  const c = col || (v >= 80 ? '#3ddc84' : v >= 65 ? '#c6e04b' : v >= 50 ? '#f2c230' : '#f2863b');
  return `<div style="height:7px;border-radius:4px;background:rgba(255,255,255,0.12);overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:${c}"></i></div>`;
}
function plAvgRating(c) { return c.n ? (c.rs / c.n) : 0; }
function plStatTile(k, v, sub) { return `<div class="stat-tile"><div class="k">${k}</div><div class="v">${v}</div>${sub ? `<div class="muted" style="font-size:13px">${sub}</div>` : ''}</div>`; }
function plEndedView() {
  const pl = S.pl, p = plPlayer();
  const c = pl.car;
  return `<div class="page" style="max-width:820px;margin:0 auto"><div class="panel center"><div class="muted up" style="font-size:12px">Fim da carreira</div>
    <h1 style="font-size:40px;font-weight:800;margin:6px 0">${esc(p.n)}</h1><p class="muted">${esc(pl.endWhy || '')} Aposentou-se aos ${p.age} anos com overall ${p.o}.</p>
    <div class="grid g4" style="margin:16px 0">${plStatTile('Jogos', c.a)}${plStatTile('Gols', c.g)}${plStatTile('Assistências', c.as)}${plStatTile('Nota média', c.n ? (c.rs / c.n).toFixed(2) : '—')}</div>
    <div class="muted" style="margin-bottom:14px">Clubes: ${pl.teams.map((x) => esc(S.teams[x.team] ? S.teams[x.team].n : '')).join(' → ')} · ${S.coach.trophies.length} títulos</div>
    <button class="btn primary big" data-a="exitToStart">Voltar ao menu</button></div></div>`;
}

// ------------------------------------------------------------------ central additions
function plTasks() {
  const pl = S.pl, p = plPlayer(), tasks = [];
  if (!p) return tasks;
  if (pl.offers.length) tasks.push(['⇄', `${pl.offers.length} ${pl.offers.length === 1 ? 'proposta de clube' : 'propostas de clubes'}`, 'agente']);
  if (isInjured(p)) tasks.push(['✚', `Lesionado até ${fmtDate(p.inj, 'dm')}${p.injN ? ' · ' + esc(p.injN) : ''}`, 'jogador']);
  else if (isSuspended(p)) tasks.push(['▮', 'Suspenso para o próximo jogo', 'jogador']);
  const unread = unreadCount();
  if (unread) tasks.push(['✉', `${unread} ${unread === 1 ? 'mensagem não lida' : 'mensagens não lidas'}`, 'inbox']);
  tasks.push(['🏋', `Treino: ${pl.focus === 'bal' ? 'equilibrado' : plAttrNames(p)[+pl.focus].toLowerCase()} · ${(PL_INTENS.find((x) => x[0] === pl.intensity) || PL_INTENS[1])[1].toLowerCase()}`, 'jogador']);
  if (p.ct && p.ct <= seasonEndYear()) tasks.push(['✍', 'Contrato termina nesta temporada', 'agente']);
  return tasks;
}
function viewPlTiles() {
  const pl = S.pl, p = plPlayer(), c = pl.cur, role = plRole();
  const lc = userLeagueComp();
  let pos = '—';
  if (lc) { const tab = sortTable(lc.table, lc.teams); pos = `${tab.findIndex((r) => r.id === S.user.team) + 1}º`; }
  const [ar, col] = plFormArrow(p);
  return `<div class="grid g4" style="margin-top:18px">
    ${plStatTile('Overall', `${p.o} <span style="font-size:16px;color:${col}">${ar}</span>`, `potencial ${p.pot}`)}
    ${plStatTile('Papel no clube', `<span style="font-size:20px">${esc(role.label)}</span>`, `confiança do treinador ${Math.round(pl.trust)}%`)}
    ${plStatTile('Temporada', `${c.g}⚽ ${c.as}🅰`, `${c.a} jogos · nota ${c.n ? plAvgRating(c).toFixed(2) : '—'}`)}
    ${plStatTile(lc ? esc(lc.name) : 'Posição', pos, `${S.teams[S.user.team].n}`)}
  </div>`;
}

// ------------------------------------------------------------------ Jogador tab
act('plFocus', (el) => { S.pl.focus = el.dataset.v === 'bal' ? 'bal' : +el.dataset.v; render(); });
act('plIntens', (el) => { S.pl.intensity = el.dataset.v; render(); });
function viewPlayerTab() {
  const pl = S.pl, p = plPlayer();
  if (!p) return '<div class="empty">Jogador não encontrado.</div>';
  if (pl.ended) return plEndedView();
  const t = S.teams[p.t], role = plRole(), c = pl.cur;
  const [ar, col] = plFormArrow(p);
  const fit = Math.round(fitnessNow(p));
  const names = plAttrNames(p);
  const g = POS_GROUP[p.p];
  const cap = p.age <= 19 ? 6 : p.age <= 22 ? 5 : p.age <= 26 ? 3 : p.age <= 30 ? 2 : 1;
  const inj = isInjured(p);
  const attrs = (p.a || []).map((v, i) => `<button class="panel" style="text-align:left;cursor:pointer;padding:10px 12px;border:2px solid ${pl.focus === i ? 'var(--gold, #ffc54d)' : 'transparent'}" data-a="plFocus" data-v="${i}">
      <div class="row" style="justify-content:space-between"><span class="muted" style="font-size:12px">${names[i]}</span><b class="tnum" style="font-size:20px">${v}</b></div>${plBar(v)}</button>`).join('');
  const objs = (pl.obj || []).map((o) => `<div class="row" style="gap:8px"><span style="color:${plObjDone(o) ? 'var(--win)' : 'var(--muted)'}">${plObjDone(o) ? '✔' : '○'}</span><span>${esc(o.t)}</span></div>`).join('');
  const log = (pl.log || []).slice(0, 10).map((r) => `<tr><td class="muted">${fmtDate(r.d, 'dm')}</td><td>${r.h ? '' : '@ '}${crest(r.o, 16)} ${esc(teamShort(r.o))}</td><td class="n"><b>${r.gf}-${r.ga}</b> <span class="muted">${r.res}</span></td>
    <td class="n">${r.mn ? r.mn + "'" : '<span class="muted">' + (r.why || (r.s ? '—' : 'banco')) + '</span>'}</td><td class="n">${r.g || ''}</td><td class="n">${r.as || ''}</td><td class="n">${r.mn ? `<b style="color:${r.r >= 7.5 ? 'var(--win)' : r.r < 6 ? 'var(--loss)' : 'var(--text)'}">${r.r.toFixed(1)}</b>` : ''}</td></tr>`).join('');
  const hist = (pl.hist || []).slice().reverse().map((h) => `<tr><td>${h.y}${h.partial ? '' : '/' + String((h.y + 1) % 100).padStart(2, '0')}</td><td>${S.teams[h.team] ? crest(h.team, 16) + ' ' + esc(S.teams[h.team].n) : ''}</td><td class="n">${h.age}</td><td class="n">${h.ovr}</td><td class="n">${h.cur.a}</td><td class="n">${h.cur.g}</td><td class="n">${h.cur.as}</td><td class="n">${h.cur.n ? (h.cur.rs / h.cur.n).toFixed(2) : '—'}</td><td class="n">${h.pos ? h.pos + 'º' : ''}</td></tr>`).join('');
  return `<div class="col" style="gap:16px">
    <div class="panel"><div class="row wrap" style="gap:18px;align-items:center">
      <div style="position:relative">${playerAvatar(p, 96)}</div>
      <div class="grow" style="min-width:220px"><div class="disp" style="font-size:34px;font-weight:800;line-height:1">${esc(p.n)}</div>
        <div class="row wrap" style="gap:8px;margin-top:8px">${posBadge(p.p)}<span class="chip">${p.age} anos</span><span class="chip">${esc(natName(p.nat))}</span><span class="chip">${p.f === 'L' ? 'Canhoto' : 'Destro'}</span><span class="chip">${esc(PL_POS_NAMES[p.p])}</span></div>
        <div class="row" style="gap:8px;margin-top:8px">${crest(t, 24)}<span>${esc(t.n)}</span><span class="chip">${esc(role.label)}</span></div></div>
      <div class="center"><div class="disp" style="font-size:60px;font-weight:800;line-height:1">${p.o}</div><div class="muted up" style="font-size:11px">overall <span style="color:${col}">${ar}</span></div><div class="muted" style="font-size:12px">potencial ${p.pot}</div></div></div>
      <div class="grid g4" style="margin-top:14px">
        <div><div class="muted up" style="font-size:11px">Forma física ${fit}%</div>${plBar(fit, 100)}</div>
        <div><div class="muted up" style="font-size:11px">Moral ${Math.round(p.mor || 70)}%</div>${plBar(p.mor || 70, 100)}</div>
        <div><div class="muted up" style="font-size:11px">Confiança do treinador ${Math.round(pl.trust)}%</div>${plBar(pl.trust, 100)}</div>
        <div><div class="muted up" style="font-size:11px">Valor</div><b>${money(playerValue(p))}</b> <span class="muted" style="font-size:12px">· contrato até ${p.ct || '—'}</span></div></div>
      ${inj ? `<div class="chip" style="margin-top:10px;color:var(--loss)">✚ Lesionado até ${fmtDate(p.inj, 'dm')} · ${esc(p.injN || '')}</div>` : ''}</div>
    <div class="panel"><h3>Treino da semana <span class="sub">toque num atributo para focar nele</span></h3>
      <div class="grid g3" style="gap:10px">${attrs}</div>
      <div class="row wrap" style="gap:10px;margin-top:12px"><button class="btn ${pl.focus === 'bal' ? 'gold' : ''}" data-a="plFocus" data-v="bal">⚖ Equilibrado (pela posição)</button>
        <span class="muted up" style="font-size:11px">Intensidade</span><div class="seg">${PL_INTENS.map(([k, l]) => `<button class="${pl.intensity === k ? 'on' : ''}" data-a="plIntens" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div style="margin-top:12px"><div class="muted" style="font-size:12px;margin-bottom:4px">Próximo ponto de atributo: ${Math.floor(pl.xp / 6 * 100)}% · Evolução de overall neste ano: +${pl.yrGain} (limite +${cap} por treino na sua idade; a evolução natural vem em julho)</div>${plBar(pl.xp, 6, '#4aa8ff')}</div>
      ${(pl.trLog || []).length ? `<div class="muted" style="font-size:12px;margin-top:8px">Últimos ganhos: ${pl.trLog.slice(0, 6).map((x) => `${names[x.a]} +1${x.o ? ' (overall +' + x.o + ')' : ''}`).join(' · ')}</div>` : ''}
      <p class="muted" style="font-size:12px;margin:8px 0 0">${pl.bonusXp ? `Bônus de metas cumpridas: +${pl.bonusXp} de treino a caminho. ` : ''}Intensidade alta evolui mais rápido, mas cansa: você chega menos inteiro nos jogos.</p></div>
    <div class="grid g2">
      <div class="panel"><h3>Temporada ${seasonLabel(yearOf(S.date), userLeagueZone())}</h3>
        <div class="grid g3" style="gap:8px">${plStatTile('Jogos', `${c.a}`, `${c.s} titular`)}${plStatTile('Gols', c.g, `${c.as} assist.`)}${plStatTile('Nota média', c.n ? plAvgRating(c).toFixed(2) : '—', `${c.mn} minutos`)}</div>
        <h3 style="margin-top:16px;font-size:17px">Metas do treinador</h3><div class="col" style="gap:6px">${objs}</div></div>
      <div class="panel"><h3>Carreira <span class="sub">${pl.teams.length} ${pl.teams.length === 1 ? 'clube' : 'clubes'}</span></h3>
        <div class="grid g3" style="gap:8px">${plStatTile('Jogos', pl.car.a)}${plStatTile('Gols', pl.car.g)}${plStatTile('Assist.', pl.car.as)}</div>
        <p class="muted" style="font-size:13px;margin-top:12px">Títulos: ${S.coach.trophies.length} · Nota média na carreira: ${pl.car.n ? (pl.car.rs / pl.car.n).toFixed(2) : '—'}</p>
        <div class="row wrap" style="gap:8px"><button class="btn" data-a="openTeam" data-id="${t.id}">Ver o clube</button><button class="btn" data-a="openPlayer" data-id="${p.id}">Ficha completa</button><button class="btn ${pl.look ? '' : 'gold'}" data-a="openPlLook">🎨 Personalizar</button><button class="btn" data-a="openTraining">🎯 Treinos</button></div></div></div>
    <div class="panel"><h3>Últimos jogos</h3>${log ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Adversário</th><th class="n">Placar</th><th class="n">Min.</th><th class="n">G</th><th class="n">A</th><th class="n">Nota</th></tr></thead><tbody>${log}</tbody></table></div>` : '<div class="empty">Você ainda não entrou em campo.</div>'}</div>
    ${hist ? `<div class="panel"><h3>Temporadas anteriores</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Temporada</th><th>Clube</th><th class="n">Idade</th><th class="n">OVR</th><th class="n">Jogos</th><th class="n">Gols</th><th class="n">Assist.</th><th class="n">Nota</th><th class="n">Liga</th></tr></thead><tbody>${hist}</tbody></table></div></div>` : ''}
  </div>`;
}

// ------------------------------------------------------------------ Agente tab
act('plAccept', (el) => {
  const id = +el.dataset.id;
  const o = S.pl.offers.find((x) => x.id === id);
  if (!o) return;
  openModal(modalShell('Assinar contrato?', `<p>${esc(teamName(o.team))} oferece ${o.y} anos de contrato com salário de ${money(o.w)} por semana. Papel esperado: <b>${esc(o.role)}</b>.</p><p class="muted">Você deixa ${esc(teamName(S.user.team))} e começa do zero na confiança do novo treinador.</p>`,
    `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn gold" data-a="plAcceptOk" data-id="${id}">Assinar</button>`), { size: 'narrow' });
});
act('plAcceptOk', (el) => { const msg = plAcceptOffer(+el.dataset.id); closeAllModals(); UI.tab = 'jogador'; render(); toast(msg); saveGame(S.id); });
act('plDecline', (el) => { S.pl.offers = S.pl.offers.filter((o) => o.id !== +el.dataset.id); render(); });
act('plRequest', () => {
  const pl = S.pl;
  if (pl.req) { toast('Você já pediu para sair. Aguarde as propostas na próxima janela.', true); return; }
  pl.req = 1; pl.trust = clamp(pl.trust - 6, 0, 100);
  addInbox('info', 'Empresário', 'Pedido de transferência', 'Vou avisar os clubes que você quer uma nova casa. Propostas costumam chegar nas janelas de transferência (jun–ago e janeiro).');
  render(); toast('Pedido de saída enviado. A confiança do treinador caiu um pouco.');
});
act('plRenewAsk', () => {
  const pl = S.pl, p = plPlayer();
  if (p.ct - seasonEndYear() > 1) { toast('O contrato ainda é longo. Peça a renovação no último ano.', true); return; }
  if (pl.trust < 45) { toast('O treinador ainda não confia o bastante em você para renovar.', true); return; }
  const o = { y: rint(2, 4), w: roundMoney(wageDemand(p, S.teams[p.t]) * rfloat(1.05, 1.3)) };
  plRenew(o); render(); toast(`Contrato renovado até ${p.ct} (${money(o.w)}/semana).`);
});
act('plRetireAsk', () => {
  openModal(modalShell('Encerrar a carreira?', '<p>Você se aposentará agora e o resumo da carreira será exibido. Esta ação não pode ser desfeita.</p>', '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="plRetireOk">Aposentar</button>'), { size: 'narrow' });
});
act('plRetireOk', () => { plRetire('Você decidiu pendurar as chuteiras.'); closeAllModals(); UI.tab = 'jogador'; render(); saveGame(S.id); });
function viewAgentTab() {
  const pl = S.pl, p = plPlayer();
  if (pl.ended) return plEndedView();
  const role = plRole();
  const offers = pl.offers.map((o) => `<div class="panel" style="padding:12px"><div class="row wrap" style="gap:12px">${crest(o.team, 44)}<div class="grow"><div style="font-weight:800;font-size:18px">${esc(teamName(o.team))}</div>
      <div class="muted" style="font-size:13px">${o.y} anos · ${money(o.w)}/semana · papel: <b>${esc(o.role)}</b> · força ${o.r}</div></div>
      <button class="btn gold" data-a="plAccept" data-id="${o.id}">Assinar</button><button class="btn" data-a="plDecline" data-id="${o.id}">Recusar</button></div></div>`).join('');
  return `<div class="col" style="gap:16px">
    <div class="panel"><h3>Contrato atual</h3><div class="grid g4" style="gap:8px">${plStatTile('Clube', esc(S.teams[p.t].n))}${plStatTile('Até', p.ct || '—')}${plStatTile('Salário', money(p.w || 0), 'por semana')}${plStatTile('Papel', esc(role.label), `confiança ${Math.round(pl.trust)}%`)}</div>
      <div class="row wrap" style="gap:8px;margin-top:12px"><button class="btn" data-a="plRenewAsk">Pedir renovação</button><button class="btn" data-a="plRequest" ${pl.req ? 'disabled' : ''}>Pedir transferência</button>${p.age >= 30 ? '<button class="btn danger" data-a="plRetireAsk">Aposentar-se</button>' : ''}</div>
      <p class="muted" style="font-size:13px;margin:10px 0 0">Para ganhar minutos: jogue bem, treine e suba o overall. A confiança do treinador sobe com boas notas e gols, e cai com atuações ruins. Se estiver sem espaço, peça para sair e espere as propostas na janela.</p></div>
    <div class="panel"><h3>Propostas <span class="sub">${pl.offers.length ? 'válidas por 30 dias' : ''}</span></h3>${offers || '<div class="empty">Nenhuma proposta no momento. Clubes procuram jogadores em boa fase, principalmente nas janelas de transferência.</div>'}</div></div>`;
}

// ------------------------------------------------------------------ Tabela tab
function viewTableTab() {
  const lc = userLeagueComp();
  if (!lc) return '<div class="empty">Nenhum campeonato de liga em andamento.</div>';
  const tab = sortTable(lc.table, lc.teams);
  return `<div class="panel"><h3>${compBadge(lc, 26)} ${esc(lc.name)}</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Time</th><th class="n">J</th><th class="n">V</th><th class="n">E</th><th class="n">D</th><th class="n">SG</th><th class="n">Pts</th></tr></thead><tbody>
    ${tab.map((r, i) => `<tr class="${r.id === S.user.team ? 'me' : ''}" style="${r.id === S.user.team ? 'background:rgba(255,197,77,0.12);font-weight:700' : ''}"><td>${i + 1}</td><td>${crest(r.id, 18)} ${esc(teamName(r.id))}</td><td class="n">${r.p}</td><td class="n">${r.w}</td><td class="n">${r.d}</td><td class="n">${r.l}</td><td class="n">${r.gf - r.ga}</td><td class="n"><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div></div>`;
}

// ------------------------------------------------------------------ match day
function plRoleText(m) {
  const d = m.pls;
  if (!d) return '';
  const p = plPlayer();
  if (d.r === 'start') return `<b style="color:var(--win)">Você é titular!</b> O treinador contou com você na escalação.`;
  if (d.r === 'sub') return `<b>Você está no banco.</b> Pode entrar no segundo tempo (por volta dos ${d.min}').`;
  return `<b style="color:var(--loss)">Você ficou fora do jogo</b>${d.why ? ` (${esc(d.why)})` : ''}.`;
}
function viewPlPreMatch(m) {
  const c = S.comps[m.c];
  const rd = c && c.rounds[m.r];
  const w = matchWeather(m);
  const ph = prepareSide(m.h, m), pa = prepareSide(m.a, m);
  const host = S.teams[m.h];
  const p = plPlayer();
  const dec = m.pls || { r: 'out' };
  const can2d = dec.r === 'start' && p.p !== 'GK';
  const mine = (id) => S.user.team === id;
  return `<div class="match-screen">
    <div class="score-head"><div class="side">${crest(m.h, 64)}<div class="tname">${esc(teamName(m.h))}</div></div>
      <div class="scorebox"><div class="disp" style="font-size:22px;font-weight:700">${m.t}</div><div class="muted" style="font-size:13px">${fmtDate(m.d, 'dm')}</div></div>
      <div class="side r"><div class="tname">${esc(teamName(m.a))}</div>${crest(m.a, 64)}</div></div>
    <div class="page" style="padding-top:6px">
      <div class="row wrap" style="justify-content:center;gap:10px;margin-bottom:14px">${compBadge(c, 24)}<b>${esc(c ? c.name : '')}</b><span class="muted">${rd ? esc(rd.name) : ''}</span>
        <span class="chip">🏟 ${esc(m.n ? 'Campo neutro' : (stadiumName(host) || 'Estádio do ' + host.n))}</span><span class="chip weather">${w.icon} ${w.label}, ${w.temp}°C</span></div>
      <div class="panel center" style="margin-bottom:14px"><div class="row" style="justify-content:center;gap:12px">${playerAvatar(p, 52)}<div style="text-align:left"><div style="font-weight:800;font-size:20px">${esc(p.n)} · ${p.o}</div><div style="font-size:15px">${plRoleText(m)}</div></div></div>
        ${dec.r === 'start' && p.p === 'GK' ? '<p class="muted" style="font-size:13px;margin:8px 0 0">Goleiro: na partida 2D você acompanha o jogo; use Simular para a sua nota.</p>' : ''}</div>
      <div class="grid g2">${sideColumn(m.h, ph, false)}${sideColumn(m.a, pa, false)}</div>
      <div class="row wrap" style="margin-top:18px;gap:10px"><span class="grow"></span>
        ${can2d ? '<button class="btn gold" data-a="start2d">🎮 Jogar (controlar só você)</button>' : ''}
        <button class="btn primary big" data-a="simNow"><span class="x-key">✕</span>${dec.r === 'start' ? 'Simular partida' : 'Seguir a partida (simular)'}</button>
      </div>
    </div></div>`;
}
function plPostCard(m, st) {
  const p = plPlayer();
  if (!p) return '';
  const mm = st.mins[p.id];
  const dec = m.pls ? m.pls.r : 'start';
  if (!mm) return `<div class="panel" style="margin-top:14px"><h3>${esc(p.n)}</h3><p class="muted" style="margin:0">${dec === 'sub' ? 'Você ficou no banco e não entrou.' : 'Você não jogou nesta partida.'} A confiança do treinador cai um pouco: jogue bem quando tiver chance.</p></div>`;
  const r = m.rt && m.rt[p.id] || 6.3;
  const k = isUserTeam(m.h) ? 0 : 1;
  const g = st.ev.filter((e) => e.t === 'goal' && e.p === p.id && e.s === k).length, a = st.ev.filter((e) => e.t === 'goal' && e.p2 === p.id && e.s === k).length;
  const minutes = clamp((mm.out ?? (st.et ? 120 : 90)) - mm.in, 0, 120);
  return `<div class="panel" style="margin-top:14px"><div class="row wrap" style="gap:14px">${playerAvatar(p, 56)}<div class="grow"><h3 style="margin:0">${esc(p.n)} <span class="sub">${minutes}' em campo</span></h3>
    <div class="muted" style="font-size:14px">${g ? `⚽ ${g} gol${g > 1 ? 's' : ''} · ` : ''}${a ? `🅰 ${a} assistência${a > 1 ? 's' : ''} · ` : ''}confiança do treinador ${Math.round(S.pl.trust)}%</div></div>
    <div class="center"><div class="muted up" style="font-size:11px">Nota</div><div class="disp" style="font-size:44px;font-weight:800;color:${r >= 7.5 ? 'var(--win)' : r < 6 ? 'var(--loss)' : 'var(--text)'}">${r.toFixed(1)}</div></div></div></div>`;
}

// ------------------------------------------------------------------ season end
function plOpenSeasonEnd(sum) {
  UI.seasonOpen = true;
  const t = S.teams[sum.team], p = plPlayer(), c = sum.cur;
  const offerCard = (o) => `<button class="offer" data-a="plEndPick" data-id="${o.id}"><div class="row">${crest(o.team, 40)}<div class="grow"><div class="tn" style="font-size:20px">${esc(teamName(o.team))}</div><div class="muted" style="font-size:12px">${o.y} anos · ${money(o.w)}/sem · papel: ${esc(o.role)}</div></div></div><span class="btn sm primary" style="align-self:flex-start">Assinar</span></button>`;
  openModal(() => modalShell('Fim de temporada', `
    <div class="row wrap" style="gap:16px">${crest(t, 64)}<div class="grow"><div class="disp" style="font-size:30px;font-weight:800">${esc(p.n)} · ${esc(t.n)}</div>
      <div class="muted">${sum.league ? `${sum.pos}º lugar na ${esc(sum.league)}` : ''} · overall ${sum.ovr} · ${sum.age} anos</div></div>${sum.coins ? `<div class="coin-pill" style="font-size:18px"><span class="coin">F</span>+${sum.coins}</div>` : ''}</div>
    <div class="grid g4" style="margin-top:16px">${plStatTile('Jogos', c.a, `${c.s} titular`)}${plStatTile('Gols', c.g)}${plStatTile('Assistências', c.as)}${plStatTile('Nota média', c.n ? (c.rs / c.n).toFixed(2) : '—')}</div>
    ${sum.titles.length ? `<div class="panel" style="margin-top:14px"><h3>Títulos da temporada</h3><div class="trophy-grid">${sum.titles.map((tr) => `<div class="trophy-card">${trophySVG(tr.key, 56)}<div style="font-weight:700">${esc(tr.name)}</div></div>`).join('')}</div></div>` : ''}
    <div class="panel" style="margin-top:14px"><h3>Metas do treinador</h3>${sum.objs.map((o) => `<div class="row" style="gap:8px"><span style="color:${o.ok ? 'var(--win)' : 'var(--loss)'}">${o.ok ? '✔' : '✘'}</span><span>${esc(o.t)}</span></div>`).join('')}
      <p class="muted" style="font-size:13px;margin:8px 0 0">Cada meta cumprida dá treino extra e mais confiança.</p></div>
    ${sum.renew ? `<div class="panel" style="margin-top:14px"><h3>${sum.expiring ? 'Seu contrato termina' : 'Proposta de renovação'}</h3><p style="margin:0 0 10px">${esc(t.n)} oferece ${sum.renew.y} anos com ${money(sum.renew.w)} por semana e papel de <b>${esc(sum.renew.role)}</b>.</p><button class="btn gold" data-a="plEndRenew">Renovar com ${esc(t.n)}</button></div>` : (sum.expiring ? '<div class="panel" style="margin-top:14px"><b>O clube não quer renovar.</b> Escolha uma das propostas abaixo.</div>' : '')}
    <h3 style="font-size:22px;margin:18px 0 8px">Propostas de outros clubes</h3>
    ${sum.offers.length ? `<div class="choice-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">${sum.offers.map(offerCard).join('')}</div>` : '<div class="empty">Nenhum clube se interessou desta vez.</div>'}`,
    `<span class="grow"></span>${sum.expiring ? '' : '<button class="btn primary" data-a="plEndStay">Continuar no clube</button>'}`), { size: 'wide' });
}
act('plEndPick', (el) => { const sum = S.pendingEnd; closeSeasonEnd({ offerId: +el.dataset.id }); UI.seasonOpen = false; closeAllModals(); UI.tab = 'jogador'; render(); saveGame(S.id); });
act('plEndRenew', () => { closeSeasonEnd({ renew: true }); UI.seasonOpen = false; closeAllModals(); render(); toast('Contrato renovado!'); saveGame(S.id); });
act('plEndStay', () => { closeSeasonEnd(null); UI.seasonOpen = false; closeAllModals(); render(); saveGame(S.id); });
