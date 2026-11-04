/* ===================== academy ===================== */
function viewAcademy() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const sub = UI.sub.academy || 'scouts';
  const tabs = [['scouts', 'Olheiros'], ['reports', `Relatórios (${S.youth.reports.length})`], ['youth', `Base (${S.youth.squad.length})`], ['league', 'Campeonato Sub-19']];
  if (S.mode === 'normal') tabs.push(['copinha', 'Copinha']);
  let body = '';
  if (sub === 'scouts') body = viewScouts();
  else if (sub === 'reports') body = viewReports();
  else if (sub === 'youth') body = viewYouthSquad();
  else if (sub === 'copinha') body = viewCopinha();
  else body = viewYouthLeague();
  return `<div class="row wrap" style="margin-bottom:12px"><h2 style="font-size:34px;font-weight:800">Academia</h2><span class="muted">Jovens de 14 a 16 anos descobertos pelos seus olheiros em até 50 países.</span></div>
    <div class="subtabs">${tabs.map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="subtab" data-g="academy" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}
function scoutStars(l) { return '★'.repeat(l) + '☆'.repeat(5 - l); }
function viewScouts() {
  const mine = S.youth.scouts;
  const market = availableScouts();
  const countryOpts = (sel) => SCOUT_COUNTRIES.slice().sort((a, b) => natName(a).localeCompare(natName(b))).map((c) => `<option value="${c}" ${c === sel ? 'selected' : ''}>${esc(natName(c))} · talento ${'●'.repeat(Math.round(COUNTRY_TALENT[c] || 2))}</option>`).join('');
  return `<div class="grid g2">
    <div class="panel"><h3>Seus olheiros <span class="sub">${mine.length}/4</span></h3>
      ${mine.length ? mine.map((sc) => `<div class="col" style="padding:10px 0;border-bottom:1px solid var(--line)">
        <div class="row"><b>${esc(sc.n)}</b><span class="stars">${scoutStars(sc.lvl)}</span><span class="grow"></span><span class="muted" style="font-size:13px">${sc.found} achados</span><button class="btn xs danger" data-a="fireScout" data-id="${sc.id}">Dispensar</button></div>
        ${sc.country ? `<div class="muted" style="font-size:14px">Observando ${natFlag(sc.country)} ${esc(natName(sc.country))} até ${fmtDate(sc.until, 'dm')}</div>` : '<div class="muted" style="font-size:14px">Sem missão</div>'}
        <div class="row wrap"><select class="input" id="sc-c-${sc.id}" style="max-width:260px">${countryOpts(sc.country)}</select>
          <select class="input" id="sc-m-${sc.id}" style="max-width:120px"><option value="1">1 mês</option><option value="3" selected>3 meses</option><option value="6">6 meses</option></select>
          <button class="btn sm primary" data-a="sendScout" data-id="${sc.id}">Enviar</button></div></div>`).join('') : '<div class="empty">Contrate olheiros ao lado para descobrir talentos.</div>'}
    </div>
    <div class="panel"><h3>Olheiros disponíveis</h3>
      ${market.map((sc) => `<div class="row" style="padding:9px 0;border-bottom:1px solid var(--line)"><b class="grow">${esc(sc.n)}</b><span class="stars">${scoutStars(sc.lvl)}</span><span class="muted">${money(sc.cost)}</span><button class="btn xs" data-a="hireScout" data-id="${sc.id}">Contratar</button></div>`).join('')}
      <p class="muted" style="font-size:13px">Mais estrelas = relatórios mais frequentes e potenciais mais precisos.</p></div>
  </div>`;
}
act('hireScout', (el) => { toast(hireScout(+el.dataset.id)); render(); });
act('fireScout', (el) => { fireScout(+el.dataset.id); render(); });
act('sendScout', (el) => {
  const id = +el.dataset.id;
  assignScout(id, $('#sc-c-' + id).value, +$('#sc-m-' + id).value);
  toast('Olheiro a caminho. Os relatórios chegam semanalmente na caixa de entrada.');
  render();
});
function viewReports() {
  const reps = S.youth.reports;
  if (!reps.length) return '<div class="panel empty">Nenhum relatório. Envie olheiros para algum país na aba Olheiros.</div>';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Jogador</th><th>Pos</th><th class="n">Idade</th><th>Nac.</th><th class="c">OVR</th><th class="n">Potencial</th><th>Olheiro</th><th></th></tr></thead><tbody>
    ${reps.map((r) => { const p = S.players[r.pid]; if (!p) return ''; return `<tr><td><b>${esc(p.n)}</b></td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td>${natFlag(p.nat)} ${esc(natName(p.nat))}</td><td class="c">${ovrBadge(p.o)}</td><td class="n"><b>${r.potLo}–${r.potHi}</b></td><td class="muted">${esc(r.scN)}</td>
      <td class="n"><button class="btn xs primary" data-a="signYouth" data-id="${r.id}">Contratar para a base</button> <button class="btn xs" data-a="dropRep" data-id="${r.id}">Dispensar</button></td></tr>`; }).join('')}
  </tbody></table></div>`;
}
act('signYouth', (el) => { toast(signProspect(+el.dataset.id)); render(); });
act('dropRep', (el) => { dismissProspect(+el.dataset.id); render(); });
function viewYouthSquad() {
  const ys = youthPlayers().sort(by((p) => p.o, -1));
  if (!ys.length) return '<div class="panel empty">A base está vazia. Contrate jovens a partir dos relatórios.</div>';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Jogador</th><th>Pos</th><th class="n">Idade</th><th>Nac.</th><th class="c">OVR</th><th class="n">POT</th><th></th></tr></thead><tbody>
    ${ys.map((p) => `<tr><td><span data-a="openPlayer" data-id="${p.id}" style="cursor:pointer;font-weight:700">${esc(p.n)}</span></td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td>${natFlag(p.nat)}</td><td class="c">${ovrBadge(p.o)}</td><td class="n">${p.pot}</td>
      <td class="n"><button class="btn xs primary" data-a="promote" data-id="${p.id}" ${p.age < 16 ? 'disabled title="Precisa ter 16 anos"' : ''}>Promover</button> <button class="btn xs" data-a="relYouth" data-id="${p.id}">Dispensar</button></td></tr>`).join('')}
  </tbody></table></div><p class="muted" style="font-size:13px">Os garotos evoluem a cada temporada e disputam o Campeonato Sub-19. A partir dos 16 anos podem subir para o profissional.</p>`;
}
act('promote', (el) => { toast(promoteYouth(+el.dataset.id)); render(); });
act('relYouth', (el) => { releaseYouth(+el.dataset.id); render(); });
function viewYouthLeague() {
  const c = S.active.map((id) => S.comps[id]).find((x) => x && x.kind === 'youth' && !x.copinha);
  if (!c) return '<div class="panel empty">Não há campeonato de base ativo agora.</div>';
  const tab = sortTable(c.table, c.teams);
  const recent = c.ym.filter((m) => m.hg !== null).slice(-10).reverse();
  return `<div class="grid g2"><div class="panel"><h3>${compBadge(c, 22)} ${esc(c.name)} <span class="sub">${esc(c.season)}</span></h3>${leagueTableHtml(c, tab, { youth: true })}</div>
    <div class="panel"><h3>Últimos resultados</h3>${recent.map((m) => `<div class="row" style="font-size:14px;padding:4px 0"><span class="grow" style="text-align:right">${esc(teamName(m.h))}</span><b class="tnum">${m.hg} - ${m.ag}</b><span class="grow">${esc(teamName(m.a))}</span></div>`).join('') || '<div class="muted">Ainda sem jogos.</div>'}</div></div>`;
}
// ---------- Copinha (Copa São Paulo de Futebol Júnior)
function viewCopinha() {
  const c = S.active.map((id) => S.comps[id]).find((x) => x && x.copinha);
  const hist = S.hist.filter((h) => h.key === 'COPINHA').slice(-10).reverse();
  const histHtml = hist.length ? `<div class="panel" style="margin-top:16px"><h3>Campeões</h3>${hist.map((h) => `<div class="row" style="padding:5px 0;border-bottom:1px solid var(--line);gap:8px"><span class="dim" style="width:44px">${esc(h.season)}</span>${S.teams[h.ch] ? crest(h.ch, 18) : ''}<span class="grow">${esc(h.chN)}</span>${h.ruN ? `<span class="muted" style="font-size:12px">vice: ${esc(h.ruN)}</span>` : ''}</div>`).join('')}</div>` : '';
  if (!c) return `<div class="panel empty">A Copa São Paulo de Futebol Júnior, a Copinha, reúne em janeiro os times sub-20 dos clubes brasileiros: fase de grupos, mata-mata e final em 25 de janeiro.</div>${histHtml}`;
  const uid = S.user.team;
  const gi = c.groups.findIndex((g) => g.teams.includes(uid));
  const showAll = !!UI.copAll;
  const groups = showAll ? c.groups : gi >= 0 ? [c.groups[gi]] : c.groups.slice(0, 2);
  const tieHtml = (t) => `<div class="tie ${t.a === uid || t.b === uid ? 'me' : ''}">
      <div class="tr ${t.w === t.a ? 'w' : ''}">${crest(t.a, 16)}<span>${esc(teamShort(t.a))}</span><span class="sc">${t.hg ?? ''}${t.pen ? `<span class="dim"> (${t.pen[0]})</span>` : ''}</span></div>
      <div class="tr ${t.w === t.b ? 'w' : ''}">${crest(t.b, 16)}<span>${esc(teamShort(t.b))}</span><span class="sc">${t.ag ?? ''}${t.pen ? `<span class="dim"> (${t.pen[1]})</span>` : ''}</span></div></div>`;
  const ko = c.ko.length ? `<div class="bracket ${showAll ? '' : 'top'}">${c.ko.map((rd) => {
    const ties = showAll || rd.ties.length <= 8 ? rd.ties : rd.ties.filter((t) => t.a === uid || t.b === uid);
    return `<div class="rnd"><h4>${esc(rd.name)} <span class="dim" style="font-size:11px">${fmtDate(rd.d, 'short')}</span></h4>${ties.map(tieHtml).join('') || `<div class="dim" style="font-size:12px">${rd.ties.length} confrontos</div>`}</div>`;
  }).join('')}</div>` : `<div class="muted">O mata-mata começa em ${fmtDate(c.koDates[0], 'long')}, com os dois primeiros de cada grupo.</div>`;
  const mine = (gi >= 0 ? c.ym.filter((m) => m.h === uid || m.a === uid) : []).map((m) => ({ d: m.d, h: m.h, a: m.a, hg: m.hg, ag: m.ag, n: 'Grupos' }))
    .concat(c.ko.flatMap((rd) => rd.ties.filter((t) => t.a === uid || t.b === uid).map((t) => ({ d: rd.d, h: t.a, a: t.b, hg: t.hg, ag: t.ag, pen: t.pen, n: rd.name }))));
  const scorers = S.youth.squad.map((id) => S.players[id]).filter((p) => p && p.st && p.st[c.id]).sort((a, b) => b.st[c.id][1] - a.st[c.id][1] || b.st[c.id][0] - a.st[c.id][0]);
  return `<div class="row wrap" style="margin-bottom:12px;gap:10px">${compBadge(c, 30)}<div class="grow"><b style="font-size:18px">${esc(c.full)} ${esc(c.season)}</b><div class="muted" style="font-size:13px">${c.teams.length} clubes · ${c.groups.length} grupos · os 2 primeiros avançam · mata-mata em jogo único, empate nos pênaltis · final em ${fmtDate(c.koDates[c.koDates.length - 1], 'long')}</div></div>
      ${c.done ? `<span class="chip on">Campeão: ${esc(teamName(c.champion))}</span>` : ''}<button class="btn sm" data-a="copAll">${showAll ? 'Só o meu time' : 'Ver todos os grupos'}</button></div>
    ${gi < 0 && uid && !S.coach.unemployed ? '<p class="muted" style="margin-top:0">Seu clube não disputa a Copinha (só clubes brasileiros).</p>' : ''}
    <div class="grid g2">${groups.map((g) => `<div class="panel"><h3>Grupo ${esc(g.name)}</h3>${leagueTableHtml(c, sortTable(g.table, g.teams), { noZones: true, youth: true })}</div>`).join('')}</div>
    ${mine.length ? `<div class="grid g2" style="margin-top:16px"><div class="panel"><h3>Jogos do seu time</h3>${mine.map((m) => `<div class="row" style="font-size:14px;padding:4px 0;gap:8px"><span class="dim" style="width:46px;font-size:12px">${fmtDate(m.d, 'short')}</span><span class="grow" style="text-align:right">${esc(teamName(m.h))}</span><b class="tnum">${m.hg === null ? 'x' : `${m.hg} - ${m.ag}`}</b><span class="grow">${esc(teamName(m.a))}</span>${m.pen ? `<span class="dim" style="font-size:12px">(${m.pen[0]}-${m.pen[1]} pên.)</span>` : ''}</div>`).join('')}</div>
      <div class="panel"><h3>Seus garotos</h3>${scorers.length ? scorers.slice(0, 10).map((p) => `<div class="row" style="font-size:14px;padding:3px 0;gap:8px">${posBadge(p.p)}<span class="grow">${esc(p.n)}</span><span class="muted">${p.st[c.id][0]} J</span><b>${p.st[c.id][1]} G</b></div>`).join('') : '<div class="muted">Com 8 ou mais jogadores na base, são eles que defendem o clube na Copinha (e evoluem jogando). Sem isso, o clube leva o seu sub-20 genérico.</div>'}</div></div>` : ''}
    <div class="panel" style="margin-top:16px"><h3>Mata-mata</h3>${ko}</div>${histHtml}`;
}
act('copAll', () => { UI.copAll = !UI.copAll; render(); });
