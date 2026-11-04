/* ===================== office: tables, calendar, results, cups, gallery, board, jobs ===================== */
function viewOffice() {
  const sub = UI.sub.office || 'table';
  const nat = S.mode === 'national';
  const tabs = [['table', nat ? 'Grupos' : 'Classificação'], ['calendar', 'Calendário'], ['results', 'Resultados'], ['cups', nat ? 'Mata-mata' : 'Copas e torneios'], ['gallery', 'Galeria de títulos'], ['career', 'Carreira'], ['board', nat ? 'Federação' : 'Diretoria'], ['jobs', 'Mercado de trabalho']];
  if (!nat) tabs.push(['finance', 'Finanças']);
  if (!nat && !S.pl) tabs.push(['spons', 'Patrocínios']);
  if (!nat && !S.pl) tabs.push(['fans', 'Torcida']);
  let body = '';
  if (sub === 'table') body = viewTables();
  else if (sub === 'calendar') body = viewCalendar();
  else if (sub === 'results') body = viewResults();
  else if (sub === 'cups') body = viewCups();
  else if (sub === 'gallery') body = viewGallery();
  else if (sub === 'career') body = viewCareerStats();
  else if (sub === 'board') body = viewBoard();
  else if (sub === 'jobs') body = viewJobsTab();
  else if (sub === 'finance') body = viewFinance();
  else if (sub === 'spons') body = viewSponsors();
  else if (sub === 'fans') body = viewFans();
  return `<div class="row wrap" style="margin-bottom:12px"><h2 style="font-size:34px;font-weight:800">Escritório</h2></div>
    <div class="subtabs">${tabs.map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="subtab" data-g="office" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}

// ---------- league tables
function zoneFor(c, pos, n) {
  if (c.key && c.key.startsWith('UL')) {
    const tier = +c.key.slice(2) - 1;
    if (tier > 0 && pos <= 3) return 'zone-up';
    if (!S.zoeira && pos > n - 3) return 'zone-down';
    if (tier === 0 && pos === 1) return 'zone-lib';
    return '';
  }
  if (c.second) return pos <= (c.up || 3) ? 'zone-up' : '';
  if (c.kind !== 'league') return '';
  if (c.down && pos > n - c.down) return 'zone-down';
  return S.mode === 'normal' ? continentalZone(c, pos) : '';
}
function leagueTableHtml(c, tab, opts = {}) {
  const uid = S.user.team;
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Time</th><th class="n">J</th><th class="n">V</th><th class="n">E</th><th class="n">D</th><th class="n">GP</th><th class="n">GC</th><th class="n">SG</th><th class="n">Pts</th>${opts.youth ? '' : '<th>Últimos</th>'}</tr></thead><tbody>
    ${tab.map((r, i) => `<tr class="click ${r.id === uid ? 'me' : ''} ${opts.noZones ? '' : zoneFor(c, i + 1, tab.length)}" data-a="openTeam" data-id="${r.id}"><td>${i + 1}</td><td><span class="team-cell">${crest(r.id, 22)}<span class="tn">${esc(teamName(r.id))}</span></span></td>
      <td class="n">${r.p}</td><td class="n">${r.w}</td><td class="n">${r.d}</td><td class="n">${r.l}</td><td class="n">${r.gf}</td><td class="n">${r.ga}</td><td class="n">${r.gf - r.ga}</td><td class="n"><b>${r.pts}</b></td>${opts.youth ? '' : `<td>${formRow(r.id)}</td>`}</tr>`).join('')}
  </tbody></table></div>`;
}
function legendFor(c) {
  if (!c) return '';
  const items = [];
  if (c.key && c.key.startsWith('UL')) { if (c.key !== 'UL1') items.push(['var(--win)', 'Acesso']); if (!S.zoeira) items.push(['var(--loss)', c.key === 'UL4' ? 'Vai para o banco de times' : 'Rebaixamento']); }
  else if (c.second) items.push(['var(--win)', 'Acesso']);
  else if (c.kind === 'league') {
    const zones = new Set((c.teams || []).map((_, i) => zoneFor(c, i + 1, c.teams.length)));
    Object.keys(ZONE_LEGEND).forEach((z) => { if (zones.has(z)) items.push(ZONE_LEGEND[z]); });
    if (zones.has('zone-down')) items.push(['var(--loss)', 'Rebaixamento']);
  }
  return `<div class="row wrap" style="font-size:12px;margin-top:8px;gap:14px">${items.map(([col, l]) => `<span class="row" style="gap:6px"><i class="dot" style="background:${col}"></i>${l}</span>`).join('')}</div>`;
}
function viewTables() {
  if (S.mode === 'national') return viewNatTables();
  const c = (UI.tableComp && S.comps[UI.tableComp]) || userLeagueComp() || S.active.map((id) => S.comps[id]).find((x) => x && x.kind === 'league');
  if (!c) return '<div class="panel empty">Sem liga ativa no momento.</div>';
  const tab = sortTable(c.table, c.teams);
  const est = S.active.map((id) => S.comps[id]).find((x) => x && x.state && x.teams.includes(S.user.team));
  return `<div class="panel"><div class="row wrap" style="margin-bottom:10px">${compBadge(c, 30)}<h3 style="margin:0">${esc(c.name)} <span class="sub">${esc(c.season)}</span></h3><span class="grow"></span>
      ${est ? `<button class="btn sm" data-a="pickTable" data-id="${est.id}">${compBadge(est, 18)} ${esc(est.name)}</button>` : ''}
      ${UI.tableComp ? '<button class="btn sm" data-a="tableMine">Minha liga</button>' : ''}</div>
    ${leagueTableHtml(c, tab)}${legendFor(c)}
    <div class="row" style="margin-top:12px"><span class="grow"></span><button class="btn primary sm" data-a="otherLeagues">Outras ligas</button></div></div>`;
}
act('tableMine', () => { UI.tableComp = null; render(); });
// competitions grouped for lists and selects (normal mode has dozens of leagues)
const COMP_REGIONS = ['Minhas competições', 'Copas continentais', 'Principais', 'Europa', 'América do Sul', 'Estaduais', 'Outras'];
function compRegion(c, mine) {
  if (mine && mine.includes(c.id)) return 'Minhas competições';
  if (c.state) return 'Estaduais';
  if (c.zone === 'UEFA' || ['LIB', 'SULA', 'MUN'].includes(c.key)) return 'Copas continentais';
  if (S.mode !== 'normal') return 'Outras';
  const id = c.lgId || (c.key.startsWith('CUP') ? c.key.slice(3) : c.key);
  if (MAIN_LEAGUES.has(id)) return 'Principais';
  const lg = leagueById(id);
  return lg ? (lg.conf === 'CONMEBOL' ? 'América do Sul' : 'Europa') : 'Outras';
}
function compSelectOptions(comps, selId, mine) {
  if (S.mode !== 'normal') return comps.map((x) => `<option value="${x.id}" ${x.id === selId ? 'selected' : ''}>${esc(x.name)} ${esc(x.season)}${mine.includes(x.id) ? ' ★' : ''}</option>`).join('');
  return COMP_REGIONS.map((reg) => {
    const list = comps.filter((x) => compRegion(x, mine) === reg);
    return list.length ? `<optgroup label="${esc(reg)}">${list.map((x) => `<option value="${x.id}" ${x.id === selId ? 'selected' : ''}>${esc(x.name)} ${esc(x.season)}</option>`).join('')}</optgroup>` : '';
  }).join('');
}
act('otherLeagues', () => {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && (c.kind === 'league' || c.kind === 'swiss' || c.kind === 'groups'));
  const mine = userComps().map((c) => c.id);
  const card = (c) => `<button class="choice" style="min-height:0" data-a="pickTable" data-id="${c.id}"><span class="row">${compBadge(c, 28)}<span class="t" style="font-size:20px">${esc(c.name)}</span></span><span class="d">${esc(c.season)} · ${c.teams.length || (c.groups ? c.groups.length * 4 : 0)} times</span></button>`;
  const body = S.mode !== 'normal' ? `<div class="choice-grid">${comps.map(card).join('')}</div>`
    : COMP_REGIONS.map((reg) => { const list = comps.filter((c) => compRegion(c, mine) === reg); return list.length ? `<h3 style="margin:14px 0 8px">${esc(reg)}</h3><div class="choice-grid">${list.map(card).join('')}</div>` : ''; }).join('');
  openModal(modalShell(S.mode === 'ultra' ? 'Outras divisões' : 'Outras ligas', body), { size: 'wide' });
});
act('pickTable', (el) => {
  const c = S.comps[+el.dataset.id];
  if (MODALS.length) closeModal();
  if (c.kind === 'league') { UI.tableComp = c.id; UI.sub.office = 'table'; render(); }
  else { UI.cupSel = c.id; UI.sub.office = 'cups'; render(); }
});
function viewNatTables() {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && c.kind === 'groups');
  if (!comps.length) return '<div class="panel empty">Nenhum torneio em andamento.</div>';
  const uid = S.user.team;
  const mine = comps.filter((c) => c.groups.some((g) => g.teams.includes(uid)));
  const sel = comps.find((c) => c.id === UI.natComp) || mine[0] || comps[0];
  return `<div class="row wrap" style="margin-bottom:12px"><select class="input" style="max-width:420px" data-a="natComp">${comps.map((c) => `<option value="${c.id}" ${c.id === sel.id ? 'selected' : ''}>${esc(c.name)} ${esc(c.season)}${mine.includes(c) ? ' ★' : ''}</option>`).join('')}</select></div>
    <div class="grid g2">${sel.groups.map((g) => `<div class="panel"><h3>Grupo ${esc(g.name)}</h3>${leagueTableHtml(sel, sortTable(g.table, g.teams), { noZones: true, youth: true })}</div>`).join('')}</div>`;
}
act('natComp', (el) => { UI.natComp = +el.value; render(); });

// ---------- calendar
function viewCalendar() {
  const uid = S.user.team;
  const tid = UI.calTeam || uid;
  const base = UI.calMonth != null ? UI.calMonth : (() => { const t = ymd(S.date); return t.y * 12 + t.m - 1; })();
  const y = Math.floor(base / 12), mo = base % 12 + 1;
  const first = dayOf(y, mo, 1);
  const start = onOrBefore(first, 1);
  const ms = teamMatches(tid);
  const byDay = {};
  ms.forEach((m) => (byDay[m.d] = byDay[m.d] || []).push(m));
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = start + i;
    const t = ymd(d);
    const list = byDay[d] || [];
    const fut = d > S.date && !S.coach.unemployed;
    cells += `<div class="dc ${t.m !== mo ? 'out' : ''} ${d === S.date ? 'today' : ''} ${fut ? 'fut' : ''} ${UI.calPick === d ? 'pick' : ''}" ${fut ? `data-a="calDay" data-d="${d}"` : ''}><div class="dn">${t.d}</div>${list.map((m) => {
      const c = S.comps[m.c];
      const opp = m.h === tid ? m.a : m.h;
      const res = m.done ? resultLetter(m, tid) : '';
      return `<div class="mchip ${res}" data-a="openMatch" data-id="${m.id}" title="${esc(teamName(m.h))} x ${esc(teamName(m.a))}">${crest(opp, 14)}<span class="t">${m.h === tid ? 'x' : '@'} ${esc(teamShort(opp))}</span>${m.done ? `<b>${m.h === tid ? m.hg : m.ag}-${m.h === tid ? m.ag : m.hg}</b>` : `<span class="dim">${m.t}</span>`}</div>`;
    }).join('')}</div>`;
  }
  const upcoming = ms.filter((m) => !m.done).slice(0, 6);
  return `<div class="grid cal-layout">
    <div class="panel"><div class="row wrap" style="margin-bottom:10px"><button class="icon-btn" data-a="calMove" data-v="-1" aria-label="Mês anterior">‹</button>
      <h3 style="margin:0">${MONTHS[mo - 1]} ${y}</h3><button class="icon-btn" data-a="calMove" data-v="1" aria-label="Próximo mês">›</button><span class="grow"></span>
      ${tid !== uid ? `<span class="chip">${crest(tid, 16)} ${esc(teamName(tid))}</span><button class="btn sm" data-a="calTeamReset">Meu time</button>` : ''}
      <button class="btn sm" data-a="calOther">Calendário de outro time</button></div>
      <div class="cal">${['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((d) => `<div class="dh">${d}</div>`).join('')}${cells}</div>
      ${simPickBar()}</div>
    <div class="panel"><h3>Próximos jogos</h3>${upcoming.map((m) => `<div class="col" style="gap:2px;padding:6px 0;border-bottom:1px solid var(--line)"><span class="muted" style="font-size:12px">${fmtDate(m.d, 'wd')} · ${m.t} · ${esc(S.comps[m.c] ? S.comps[m.c].name : '')}</span>${matchLine(m)}</div>`).join('') || '<div class="muted">Nada marcado.</div>'}</div>
  </div>`;
}
act('calMove', (el) => {
  const t = ymd(S.date);
  const base = UI.calMonth != null ? UI.calMonth : t.y * 12 + t.m - 1;
  UI.calMonth = base + +el.dataset.v;
  render();
});
act('calTeamReset', () => { UI.calTeam = null; render(); });
act('calOther', () => {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && c.kind === 'league');
  const lc = userLeagueComp() || comps[0];
  UI.calPickComp = lc ? lc.id : null;
  openModal(() => {
    const c = S.comps[UI.calPickComp];
    return modalShell('Escolha um time', `<div class="row wrap" style="margin-bottom:10px"><select class="input" data-a="calPickComp" style="max-width:320px">${compSelectOptions(comps, c ? c.id : 0, userComps().map((x) => x.id))}</select></div>
      <div class="choice-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${(c ? c.teams : []).map((id) => `<button class="btn" style="justify-content:flex-start" data-a="calPickTeam" data-id="${id}">${crest(id, 22)} ${esc(teamName(id))}</button>`).join('')}</div>`);
  }, { size: 'wide' });
});
act('calPickComp', (el) => { UI.calPickComp = +el.value; refreshModal(); });
act('calPickTeam', (el) => { UI.calTeam = +el.dataset.id; closeAllModals(); render(); });

// ---------- results center
function viewResults() {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && c.rounds && c.rounds.length && c.kind !== 'youth');
  if (!comps.length) return '<div class="panel empty">Sem competições.</div>';
  const mine = userComps().map((c) => c.id);
  const c = comps.find((x) => x.id === UI.resComp) || comps.find((x) => mine.includes(x.id)) || comps[0];
  let r = UI.resRound;
  if (r == null || !c.rounds[r]) {
    r = c.rounds.findIndex((rd) => rd.m.some((id) => S.matches[id] && !S.matches[id].done));
    if (r < 0) r = c.rounds.length - 1;
    const lastDone = (() => { for (let i = c.rounds.length - 1; i >= 0; i--) if (c.rounds[i].m.some((id) => S.matches[id] && S.matches[id].done)) return i; return -1; })();
    if (lastDone >= 0 && r > lastDone && !c.rounds[r].m.some((id) => S.matches[id].done)) r = Math.max(lastDone, 0);
  }
  const rd = c.rounds[r];
  const ms = rd.m.map((id) => S.matches[id]).filter(Boolean).sort(by((m) => m.d * 10000 + parseInt(m.t)));
  let lastDay = null;
  const lines = ms.map((m) => { const hd = m.d !== lastDay ? `<div class="muted up" style="font-size:12px;margin-top:10px">${fmtDate(m.d, 'long')}</div>` : ''; lastDay = m.d; return hd + matchLine(m); }).join('');
  return `<div class="panel"><div class="row wrap" style="margin-bottom:10px">
      <select class="input" style="max-width:340px" data-a="resComp">${compSelectOptions(comps, c.id, mine)}</select>
      <button class="icon-btn" data-a="resMove" data-v="-1" aria-label="Rodada anterior">‹</button>
      <select class="input" style="max-width:220px" data-a="resRound">${c.rounds.map((x, i) => `<option value="${i}" ${i === r ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <button class="icon-btn" data-a="resMove" data-v="1" aria-label="Próxima rodada">›</button></div>
    <div class="col" style="gap:2px">${lines || '<div class="empty">Sem jogos.</div>'}</div></div>`;
}
act('resComp', (el) => { UI.resComp = +el.value; UI.resRound = null; render(); });
act('resRound', (el) => { UI.resRound = +el.value; render(); });
act('resMove', (el) => {
  const c = S.comps[UI.resComp] || null;
  const cur = UI.resRound == null ? 0 : UI.resRound;
  UI.resRound = clamp(cur + +el.dataset.v, 0, c ? c.rounds.length - 1 : 0);
  render();
});
act('openMatch', (el) => openMatchModal(+el.dataset.id));
function openMatchModal(mid) {
  const m = S.matches[mid];
  if (!m) return;
  const c = S.comps[m.c];
  const ev = (m.ev || []).filter((e) => ['goal', 'red', 'yellow', 'alien', 'sub', 'inj'].includes(e[1]));
  const icon = { goal: '⚽', red: '🟥', yellow: '🟨', alien: '👽', sub: '⇄', inj: '✚' };
  const evHtml = ev.map((e) => `<div class="row" style="justify-content:${e[2] === 0 ? 'flex-start' : 'flex-end'};font-size:14px;padding:3px 0">${e[2] === 0 ? `<span class="dim tnum">${e[0]}'</span>` : ''}<span>${icon[e[1]] || ''} ${esc(pidName(e[3]))}${e[1] === 'goal' && e[4] ? ` <span class="muted">(${esc(pidName(e[4]))})</span>` : ''}${e[1] === 'sub' && e[4] ? ` <span class="muted">↔ ${esc(pidName(e[4]))}</span>` : ''}</span>${e[2] === 1 ? `<span class="dim tnum">${e[0]}'</span>` : ''}</div>`).join('');
  const st = m.stats;
  openModal(modalShell(`${esc(teamName(m.h))} x ${esc(teamName(m.a))}`, `
    <div class="muted center" style="font-size:13px">${esc(c ? c.name : '')} · ${c && c.rounds[m.r] ? esc(c.rounds[m.r].name) : ''} · ${fmtDate(m.d, 'long')} · ${m.t}</div>
    <div class="row" style="justify-content:center;gap:18px;margin:14px 0">${crest(m.h, 56)}<div class="disp" style="font-size:52px;font-weight:800">${m.done ? `${m.hg} - ${m.ag}` : 'x'}</div>${crest(m.a, 56)}</div>
    ${m.pen ? `<div class="center muted">Pênaltis: ${m.pen[0]} - ${m.pen[1]}</div>` : ''}${m.et && !m.pen ? '<div class="center muted">Prorrogação</div>' : ''}
    ${m.done ? (evHtml ? `<div class="panel" style="background:var(--panel2)">${evHtml}</div>` : '<div class="muted center">Sem gols.</div>') : `<div class="center muted">Jogo marcado para ${fmtDate(m.d, 'dm')} às ${m.t}.</div>`}
    ${st ? `<div class="col" style="margin-top:14px">${statBars(st)}</div>` : ''}`, ''), { size: 'narrow' });
}
function statBars(st) {
  const rows = [['Posse (%)', st.poss], ['Finalizações', st.sh], ['No gol', st.sot], ['Escanteios', st.cor], ['Faltas', st.fo], ['Amarelos', st.yc], ['Vermelhos', st.rc]];
  return rows.map(([l, v]) => {
    const a = v[0], b = v[1], tot = a + b || 1;
    return `<div class="statbar"><b class="tnum">${a}</b><div><div class="muted center" style="font-size:12px">${l}</div><div class="bars"><i style="width:${(a / tot) * 100}%;background:var(--accent-hi)"></i><i style="width:${(b / tot) * 100}%;background:var(--gold)"></i></div></div><b class="tnum" style="text-align:right">${b}</b></div>`;
  }).join('');
}

// ---------- cups & tournaments
function viewCups() {
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && (c.kind === 'cup' || c.kind === 'swiss' || (c.kind === 'groups' && !c.qualOnly)));
  if (!comps.length) return '<div class="panel empty">Nenhuma copa em andamento.</div>';
  const mine = userComps().map((c) => c.id);
  const sel = comps.find((c) => c.id === UI.cupSel) || comps.find((c) => mine.includes(c.id)) || comps[0];
  let body = '';
  if (sel.kind === 'swiss') {
    const tab = sortTable(sel.table, sel.teams);
    body = `<div class="grid g2"><div class="panel"><h3>Fase de liga</h3>${leagueTableHtml(sel, tab, { noZones: true })}
      <div class="row wrap" style="font-size:12px;margin-top:8px;gap:14px"><span>1º–8º: oitavas direto</span><span>9º–24º: playoffs</span><span>25º–36º: eliminados</span></div></div>
      <div class="panel"><h3>Mata-mata</h3>${bracketHtml(sel, sel.leaguePhaseRounds)}</div></div>`;
  } else if (sel.state) {
    const gTitle = (g) => (g.name.length > 2 ? esc(g.name) : `Grupo ${esc(g.name)}`);
    const tables = (groups) => `<div class="grid ${groups.length > 2 ? 'g3' : groups.length === 2 ? 'g2' : ''}">${groups.map((g) => `<div class="panel"><h3>${gTitle(g)}</h3>${leagueTableHtml(sel, sortTable(g.table, g.teams), { noZones: true })}</div>`).join('')}</div>`;
    body = `<p class="muted" style="font-size:13px;margin:0 0 12px">${esc(sel.full)} · ${esc(sel.fmtNote || '')}</p>${tables(sel.groups)}
      ${(sel.oldGroups || []).map((o) => `<h3 style="margin:16px 0 8px">${esc(o.label)}</h3>${tables(o.groups)}`).join('')}
      <div class="panel" style="margin-top:16px"><h3>Mata-mata</h3>${bracketHtml(sel, sel.groupRounds)}</div>`;
  } else if (sel.kind === 'groups') {
    const note = sel.key === 'SULA' ? `<p class="muted" style="font-size:13px;margin:0 0 12px">1º do grupo: oitavas de final · 2º: playoffs contra os 3º colocados dos grupos da Libertadores · o campeão vai para a próxima Libertadores.</p>` : '';
    body = note + `<div class="grid g3">${sel.groups.map((g) => `<div class="panel"><h3>Grupo ${esc(g.name)}</h3>${leagueTableHtml(sel, sortTable(g.table, g.teams), { noZones: true, youth: true })}</div>`).join('')}</div>
      <div class="panel" style="margin-top:16px"><h3>Mata-mata</h3>${bracketHtml(sel, sel.groupRounds)}</div>`;
  } else if (sel.key === 'MUN' && sel.reps) {
    const reps = Object.entries(sel.reps).filter(([, id]) => id && S.teams[id]);
    body = `<div class="panel" style="margin-bottom:16px"><h3>Campeões continentais</h3><div class="mun-reps">${reps.map(([k, id]) => `<div class="team-cell" data-a="openTeam" data-id="${id}" style="cursor:pointer">${crest(id, 26)}<span class="col" style="gap:0"><span class="tn">${esc(teamName(id))}</span><span class="muted" style="font-size:12px">${esc(CONF_LABEL[k])}</span></span></div>`).join('')}</div>
      <p class="muted" style="font-size:13px;margin:10px 0 0">Jogos em campo neutro. O campeão europeu entra direto na final; o da Libertadores estreia no Dérbi das Américas.</p></div>
      <div class="panel">${bracketHtml(sel, 0)}</div>`;
  } else body = `<div class="panel">${bracketHtml(sel, 0)}</div>`;
  return `<div class="row wrap" style="margin-bottom:12px"><select class="input" style="max-width:380px" data-a="cupSel">${compSelectOptions(comps, sel.id, mine)}</select>
    ${sel.done ? `<span class="chip on">Campeão: ${esc(teamName(sel.champion))}</span>` : ''}</div>${body}`;
}
act('cupSel', (el) => { UI.cupSel = +el.value; render(); });
act('histAll', () => { UI.histAll = !UI.histAll; render(); });
function bracketHtml(c, fromRound) {
  const rounds = c.rounds.slice(fromRound).filter((rd) => rd.ties && rd.ties.length);
  if (!rounds.length) return '<div class="empty">O mata-mata ainda não começou.</div>';
  return `<div class="bracket">${rounds.map((rd) => `<div class="rnd"><h4>${esc(rd.name)}</h4>${rd.ties.map((tid) => {
    const t = c.ties[tid];
    const ms = t.m.map((id) => S.matches[id]).filter(Boolean);
    let ga = 0, gb = 0, played = ms.some((m) => m.done);
    ms.forEach((m) => { if (!m.done) return; if (m.h === t.a) { ga += m.hg; gb += m.ag; } else { ga += m.ag; gb += m.hg; } });
    const last = ms[ms.length - 1];
    const pens = last && last.pen ? (last.h === t.a ? last.pen : [last.pen[1], last.pen[0]]) : null;
    return `<div class="tie" data-a="openMatch" data-id="${ms[0] ? ms[0].id : 0}" style="cursor:pointer">
      <div class="tr ${t.w === t.a ? 'w' : ''}">${crest(t.a, 16)}<span>${esc(teamShort(t.a))}</span><span class="sc">${played ? ga : ''}${pens ? `<span class="dim"> (${pens[0]})</span>` : ''}</span></div>
      <div class="tr ${t.w === t.b ? 'w' : ''}">${crest(t.b, 16)}<span>${esc(teamShort(t.b))}</span><span class="sc">${played ? gb : ''}${pens ? `<span class="dim"> (${pens[1]})</span>` : ''}</span></div>
      ${!played && ms[0] ? `<div class="dim" style="font-size:11px">${fmtDate(ms[0].d, 'short')}</div>` : ''}</div>`;
  }).join('')}</div>`).join('')}</div>`;
}

// ---------- gallery
function viewGallery() {
  const tr = S.coach.trophies;
  const uid = S.user.team;
  const clubTitles = S.titles[uid] || [];
  const all = S.hist.slice().reverse().filter((h) => h.key !== 'QUAL');
  const minor = (h) => compIsMinor({ key: h.key, lgId: h.key.startsWith('CUP') ? h.key.slice(3) : h.key, country: (leagueById(h.key.startsWith('CUP') ? h.key.slice(3) : h.key) || {}).country, zone: '' });
  const hist = UI.histAll ? all : all.filter((h) => !minor(h));
  const hidden = all.length - hist.length;
  return `<div class="panel" style="margin-bottom:16px"><h3>Seus títulos <span class="sub">${tr.length} conquista${tr.length === 1 ? '' : 's'}</span></h3>
      ${tr.length ? `<div class="trophy-grid">${tr.map((t) => `<div class="trophy-card">${trophySVG(t.key, 70)}<div style="font-weight:700;margin-top:6px">${esc(t.name)}</div><div class="muted" style="font-size:13px">${esc(t.season)} · ${esc(t.teamN)}</div>${t.coins ? `<div class="coin-pill" style="margin-top:6px;font-size:13px;padding:2px 8px 2px 4px"><span class="coin">F</span>+${t.coins}</div>` : ''}</div>`).join('')}</div>` : '<div class="empty">Nenhum título ainda. A primeira taça vem!</div>'}</div>
    <div class="grid g2"><div class="panel"><h3>Títulos ${esc(tA(uid, 'do'))} <span class="sub">nesta carreira</span></h3>${clubTitles.length ? clubTitles.map((t) => `<div class="row" style="padding:5px 0;border-bottom:1px solid var(--line)">🏆 <span class="grow">${esc(t.name)}</span><span class="muted">${esc(t.season)}</span></div>`).join('') : '<div class="muted">Nenhum ainda.</div>'}</div>
    <div class="panel"><div class="row wrap" style="margin-bottom:8px"><h3 class="grow" style="margin:0">Campeões das temporadas</h3>${hidden || UI.histAll ? `<button class="btn sm" data-a="histAll">${UI.histAll ? 'Só as principais' : `Todas as ligas (+${hidden})`}</button>` : ''}</div><div style="max-height:420px;overflow:auto">${hist.map((h) => `<div class="row" style="padding:5px 0;border-bottom:1px solid var(--line);font-size:14px">${S.teams[h.ch] ? crest(h.ch, 18) : ''}<span class="grow"><b>${esc(h.chN)}</b> · ${esc(h.name)}</span><span class="muted">${esc(h.season)}</span></div>`).join('') || '<div class="muted">A primeira temporada ainda está em andamento.</div>'}</div></div></div>`;
}

// ---------- career stats
function viewCareerStats() {
  const c = S.coach;
  const r = c.rec;
  const games = r.w + r.d + r.l;
  const pct = games ? Math.round(((r.w * 3 + r.d) / (games * 3)) * 100) : 0;
  return `<div class="grid g4" style="margin-bottom:16px">
      <div class="stat-tile"><div class="k">Treinador</div><div class="v" style="font-size:22px">${esc(c.name)}</div><div class="muted" style="font-size:13px">${c.age} anos${c.fav ? ` · torce para ${esc((STORE.find((t) => t[0] === c.fav) || [0, c.fav])[1])}` : ''}</div></div>
      <div class="stat-tile"><div class="k">Vitórias · Empates · Derrotas</div><div class="v">${r.w} · ${r.d} · ${r.l}</div><div class="muted" style="font-size:13px">${games} jogos · ${pct}% de aproveitamento</div></div>
      <div class="stat-tile"><div class="k">Gols</div><div class="v">${r.gf} : ${r.ga}</div><div class="muted" style="font-size:13px">saldo ${r.gf - r.ga >= 0 ? '+' : ''}${r.gf - r.ga}</div></div>
      <div class="stat-tile"><div class="k">Nota do técnico</div><div class="v">${(c.rating / 10).toFixed(1)}</div><div class="muted" style="font-size:13px">Reputação ${Math.round(c.rep)}/100</div></div>
    </div>
    <div class="grid g2"><div class="panel"><h3>Clubes</h3>${c.hist.map((h) => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)">${S.teams[h.team] ? crest(h.team, 22) : ''}<span class="grow">${esc(h.n)}</span><span class="muted" style="font-size:13px">${fmtDate(h.from, 'short')}/${yearOf(h.from)} – ${fmtDate(h.to, 'short')}/${yearOf(h.to)} · ${esc(h.why)}</span></div>`).join('')}
      ${!c.unemployed ? `<div class="row" style="padding:6px 0">${crest(S.user.team, 22)}<span class="grow"><b>${esc(teamName(S.user.team))}</b></span><span class="chip on">Atual</span></div>` : ''}</div>
    <div class="panel"><h3>FutCoins</h3><div class="row">${coinPill()}<span class="muted">${WALLET.owned.length} times comprados</span></div>
      <div style="margin-top:10px">${WALLET.log.slice(0, 12).map((l) => `<div class="row" style="padding:4px 0;font-size:14px;border-bottom:1px solid var(--line)"><span class="grow">${esc(l.reason)}</span><b style="color:${l.n >= 0 ? 'var(--win)' : 'var(--loss)'}">${l.n >= 0 ? '+' : ''}${l.n}</b></div>`).join('') || `<div class="muted">${INFINITE_COINS ? 'FutCoins infinitas ativadas: compre times à vontade.' : 'Ganhe títulos para receber FutCoins.'}</div>`}</div></div></div>`;
}

// ---------- board
function viewBoard() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const conf = Math.round(S.board.conf);
  const col = conf < 30 ? 'var(--loss)' : conf < 55 ? 'var(--warn)' : 'var(--win)';
  return `<div class="grid g2"><div class="panel"><h3>Confiança ${S.mode === 'national' ? 'da federação' : 'da diretoria'}</h3>
      <div class="disp" style="font-size:64px;font-weight:800;color:${col}">${conf}%</div>
      <div style="height:10px;border-radius:5px;background:var(--panel3);overflow:hidden"><i style="display:block;height:100%;width:${conf}%;background:${col}"></i></div>
      <p class="muted">${conf >= 70 ? 'A diretoria está muito satisfeita com o seu trabalho.' : conf >= 45 ? 'A diretoria acompanha de perto, mas confia em você.' : conf >= 25 ? 'A pressão aumentou. Resultados ruins podem custar o cargo.' : 'Situação crítica: o cargo está em risco.'}${S.noFire ? ' (modo sem demissão ativo)' : ''}</p>
      <div class="kv"><span class="k">Objetivo</span><span><b>${esc(S.board.obj)}</b></span><span class="k">Nota do técnico</span><span>${(S.coach.rating / 10).toFixed(1)}</span></div></div>
    <div class="panel"><h3>Pedir demissão</h3><p class="muted">Você deixa o cargo imediatamente e passa a procurar outro clube no mercado de trabalho.</p><button class="btn danger" data-a="askResign">Pedir demissão</button></div></div>`;
}
act('askResign', () => openModal(modalShell('Pedir demissão?', `<p>Você vai deixar ${esc(tA(S.user.team))}.</p>`, '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="resign">Pedir demissão</button>'), { size: 'narrow' }));
act('resign', () => { resignJob(); closeAllModals(); UI.tab = 'central'; render(); toast('Você deixou o cargo.'); });
function viewJobsTab() {
  if (!S.jobs || !S.jobs.length || S.date - (S.jobsD || 0) > 7) { S.jobs = generateJobs(8); S.jobsD = S.date; }
  return `<div class="panel"><h3>Mercado de trabalho <span class="sub">vagas e clubes interessados</span></h3>${viewJobList(S.jobs)}
    <p class="muted" style="font-size:13px;margin-bottom:0">${S.coach.unemployed ? 'Candidate-se a um cargo para voltar ao trabalho.' : 'Se for aceito, você deixa o clube atual imediatamente.'}</p></div>`;
}
function viewFinance() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const t = S.teams[S.user.team];
  const sq = squadOf(t.id).sort(by((p) => p.w || 0, -1));
  const bill = wageBill(t.id);
  return `<div class="grid g3" style="margin-bottom:16px"><div class="stat-tile"><div class="k">Orçamento de transferências</div><div class="v">${money(t.budget)}</div></div>
    <div class="stat-tile"><div class="k">Folha salarial</div><div class="v">${wageFmt(bill)}/sem</div><div class="muted" style="font-size:13px">limite ${wageFmt(t.wb)}/sem</div></div>
    <div class="stat-tile"><div class="k">Valor do elenco</div><div class="v">${money(sum(sq, (p) => playerValue(p)))}</div></div></div>
    ${viewBudgetMove(t, bill)}
    <div class="panel"><h3>Maiores salários</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Jogador</th><th class="n">Salário/sem</th><th class="n">Contrato</th><th class="n">Valor</th></tr></thead><tbody>
    ${sq.slice(0, 15).map((p) => `<tr class="click" data-a="openPlayer" data-id="${p.id}"><td>${esc(p.n)}</td><td class="n">${money(p.w || 0)}</td><td class="n">${p.ct}</td><td class="n">${money(playerValue(p))}</td></tr>`).join('')}</tbody></table></div></div>`;
}
const wageFmt = (v) => (v >= 1e6 && v < 1e8 ? `€${(v / 1e6).toFixed(2)}M` : money(v));
// FIFA-style budget slider: transfer budget <-> wage budget
function viewBudgetMove(t, bill) {
  const weeks = budgetWeeksLeft();
  const room = Math.max(0, t.wb - bill);
  const nice = (v) => { const e = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1000)))); const m = v / e; return (m < 1.5 ? 1 : m < 3.5 ? 2.5 : m < 7.5 ? 5 : 10) * e; };
  const steps = uniq([0.05, 0.1, 0.25, 0.5].map((f) => nice(t.wb * f)));
  const up = steps.map((w) => { const c = wageRaiseCost(w); return `<button class="btn sm" data-a="wbMove" data-v="${w}" ${c > t.budget ? 'disabled' : ''}>+${money(w)}/sem <span class="muted">(${money(c)})</span></button>`; }).join('');
  const down = steps.filter((w) => w <= room).map((w) => `<button class="btn sm" data-a="wbMove" data-v="${-w}">−${money(w)}/sem <span class="muted">(+${money(wageLowerReturn(w))})</span></button>`).join('');
  return `<div class="panel"><h3>Remanejar verba <span class="sub">entre transferências e folha salarial</span></h3>
    <p class="muted" style="font-size:13px;margin-top:0">Cada ${money(1000)} a mais por semana na folha custa ${money(1000 * weeks)} do orçamento de transferências (as ${weeks} semanas que faltam até 1º de julho, quando a diretoria recalcula a folha a partir dos salários do elenco). Devolver folga da folha devolve 80% desse valor.</p>
    <div class="row wrap" style="gap:8px;margin-bottom:6px"><span class="chip">Folga na folha: ${money(room)}/sem</span><span class="chip">Orçamento: ${money(t.budget)}</span></div>
    <div class="muted up" style="font-size:11px;margin:8px 0 4px">Ampliar a folha</div><div class="row wrap" style="gap:8px">${up}</div>
    ${down ? `<div class="muted up" style="font-size:11px;margin:10px 0 4px">Devolver para transferências</div><div class="row wrap" style="gap:8px">${down}</div>` : ''}
    <div class="row wrap" style="gap:8px;margin-top:12px"><input id="wb-x" class="input" type="number" min="0" step="1000" placeholder="Valor por semana" style="max-width:180px"><button class="btn primary sm" data-a="wbMoveX" data-dir="1">Ampliar folha</button>${room > 0 ? '<button class="btn sm" data-a="wbMoveX" data-dir="-1">Devolver</button>' : ''}</div></div>`;
}
function doWbMove(v) {
  const t = S.teams[S.user.team];
  if (!v) return;
  const r = v > 0 ? raiseWageBudget(t, v) : lowerWageBudget(t, -v);
  toast(r.msg, !r.ok);
  if (r.ok) render();
}
act('wbMove', (el) => doWbMove(+el.dataset.v));
act('wbMoveX', (el) => { const v = Math.round(+($('#wb-x').value) || 0); if (v <= 0) { toast('Digite um valor por semana.', true); return; } doWbMove(v * +el.dataset.dir); });
act('goFinance', () => { closeAllModals(); UI.tab = 'office'; UI.sub.office = 'finance'; render(); window.scrollTo(0, 0); });
