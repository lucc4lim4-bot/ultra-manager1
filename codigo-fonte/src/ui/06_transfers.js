/* ===================== transfers ===================== */
function viewTransfers() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const sub = UI.sub.transfers || 'search';
  const offers = S.tr.offers.filter((o) => o.status === 'open');
  const tabs = [['search', 'Buscar jogadores'], ['loans', 'Empréstimos'], ['short', `Observados (${S.tr.short.length})`], ['offers', `Propostas recebidas${offers.length ? ` (${offers.length})` : ''}`], ['log', 'Movimentações']];
  const w = windowInfo();
  const ut = S.teams[S.user.team];
  let body = '';
  if (sub === 'search') body = viewSearch();
  else if (sub === 'loans') body = viewSearch(true);
  else if (sub === 'short') body = viewPlayerTable(S.tr.short.map((id) => S.players[id]).filter(Boolean));
  else if (sub === 'offers') body = viewOffersIn();
  else body = viewTransferLog();
  return `<div class="row wrap" style="margin-bottom:12px"><h2 style="font-size:34px;font-weight:800">Transferências</h2>
      <span class="chip" style="${w.open ? 'color:var(--win)' : 'color:var(--warn)'}">${w.text}</span><span class="grow"></span>
      <span class="chip">Orçamento ${money(ut.budget)}</span><span class="chip">Folha ${money(wageBill(ut.id))} / ${money(ut.wb)}</span><button class="btn xs" data-a="goFinance" title="Passar verba de transferências para a folha salarial">Remanejar verba</button></div>
    <div class="subtabs">${tabs.map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="subtab" data-g="transfers" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}
function searchResults() {
  const f = UI.filters;
  const loanMode = UI.sub.transfers === 'loans';
  const pos = f.pos || 'all';
  const q = strip(f.q || '');
  const cq = strip(f.club || '');
  const uid = S.user.team;
  const list = [];
  for (const id in S.players) {
    const p = S.players[id];
    if (p.t === uid || p.yth || p.natOnly) continue;
    if (p.t && S.teams[p.t] && S.teams[p.t].isNat) continue;
    if (pos !== 'all' && p.p !== pos) continue;
    if (loanMode) { // only the players a club would lend
      if (!p.t || p.loan || !S.teams[p.t]) continue;
      if (f.llonly && !p.ll) continue;
      if (!clubResponse(p, 0, true).ok) continue;
    } else {
      if (f.free && p.t) continue;
      if (f.listed && !p.tl) continue;
    }
    if (f.amin && p.age < f.amin) continue;
    if (f.amax && p.age > f.amax) continue;
    if (f.omin && p.o < f.omin) continue;
    if (q && !strip(p.n).includes(q)) continue;
    if (cq && !(p.t && S.teams[p.t] && strip(S.teams[p.t].n).includes(cq))) continue;
    if (f.lg && !(p.t && S.teams[p.t] && S.teams[p.t].c === f.lg)) continue;
    if (f.nat && p.nat !== f.nat) continue;
    list.push(p);
  }
  const so = f.sort || 'o';
  if (so === 'age') list.sort(by((p) => p.age, 1));
  else if (so === 'pot') list.sort(by((p) => p.pot, -1));
  else if (so === 'val') list.sort(by((p) => playerValue(p), -1));
  else list.sort(by((p) => p.o, -1));
  return list;
}
// leagues (by the club's country) and nationalities that exist in the search pool
function searchLeagues() {
  const seen = {};
  for (const id in S.teams) { const t = S.teams[id]; if (t && !t.isNat && t.c) seen[t.c] = 1; }
  return Object.keys(seen).map((c) => {
    const lg = (S.normal || []).find((l) => l.country === c);
    return [c, lg ? `${lg.name} (${natName(c)})` : natName(c)];
  }).sort((a, b) => a[1].localeCompare(b[1], 'pt'));
}
function searchNats() {
  const seen = {};
  for (const id in S.players) { const p = S.players[id]; if (p.nat && !p.yth && !p.natOnly) seen[p.nat] = 1; }
  return Object.keys(seen).map((c) => [c, natName(c)]).sort((a, b) => a[1].localeCompare(b[1], 'pt'));
}
function viewSearch(loanMode) {
  const f = UI.filters;
  const pos = f.pos || 'all';
  const all = searchResults();
  const maxV = f.vmax ? f.vmax * 1e6 : 0;
  const filtered = maxV ? all.filter((p) => playerValue(p) <= maxV) : all;
  if (f.page && filtered.length <= 150) f.page = 0;
  const page = f.page || 0;
  const slice = filtered.slice(page * 150, page * 150 + 150);
  return `<div class="panel" style="margin-bottom:12px">
      <div class="row wrap" style="gap:6px;margin-bottom:10px">${['all'].concat(POSITIONS).map((p) => `<button class="chip ${pos === p ? 'on' : ''}" data-a="fPos" data-v="${p}">${p === 'all' ? 'Todas' : POS_PT[p]}</button>`).join('')}</div>
      <div class="grid g4">
        <div class="field"><label for="f-q">Nome</label><input id="f-q" class="input" placeholder="Buscar" value="${esc(f.q || '')}" data-a="fQ" data-live="1"></div>
        <div class="field"><label>Idade</label><div class="row"><input class="input" type="number" min="14" max="45" placeholder="mín" value="${f.amin || ''}" data-a="fNum" data-k="amin"><input class="input" type="number" min="14" max="45" placeholder="máx" value="${f.amax || ''}" data-a="fNum" data-k="amax"></div></div>
        <div class="field"><label for="f-omin">Overall mínimo</label><input id="f-omin" class="input" type="number" min="40" max="99" value="${f.omin || ''}" data-a="fNum" data-k="omin"></div>
        <div class="field"><label for="f-vmax">Valor máximo (€ milhões)</label><input id="f-vmax" class="input" type="number" min="0" value="${f.vmax || ''}" data-a="fNum" data-k="vmax"></div>
      </div>
      <div class="grid g4" style="margin-top:10px">
        <div class="field"><label for="f-club">Clube</label><input id="f-club" class="input" placeholder="Ex.: Real, Flamengo" value="${esc(f.club || '')}" data-a="fClub" data-live="1"></div>
        <div class="field"><label for="f-lg">Liga / país do clube</label><select id="f-lg" class="input" data-a="fSel" data-k="lg"><option value="">Todas</option>${searchLeagues().map(([c, n]) => `<option value="${c}" ${f.lg === c ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="field"><label for="f-nat">Nacionalidade</label><select id="f-nat" class="input" data-a="fSel" data-k="nat"><option value="">Todas</option>${searchNats().map(([c, n]) => `<option value="${c}" ${f.nat === c ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="field"><label for="f-sort">Ordenar por</label><select id="f-sort" class="input" data-a="fSel" data-k="sort">${[['o', 'Overall'], ['pot', 'Potencial'], ['val', 'Valor'], ['age', 'Mais novos']].map(([k, n]) => `<option value="${k}" ${(f.sort || 'o') === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      </div>
      <div class="row wrap" style="margin-top:10px">${loanMode ? `<label class="toggle"><input type="checkbox" data-a="fBool" data-k="llonly" ${f.llonly ? 'checked' : ''}><span class="sw"></span>Somente os que o clube listou para empréstimo</label>` : `<label class="toggle"><input type="checkbox" data-a="fBool" data-k="free" ${f.free ? 'checked' : ''}><span class="sw"></span>Somente sem clube</label>
        <label class="toggle"><input type="checkbox" data-a="fBool" data-k="listed" ${f.listed ? 'checked' : ''}><span class="sw"></span>Somente à venda</label>`}
        <span class="grow"></span><div class="seg"><button class="${page === 0 ? 'on' : ''}" data-a="fPage" data-v="0">1–150</button><button class="${page === 1 ? 'on' : ''}" data-a="fPage" data-v="1" ${filtered.length <= 150 ? 'disabled style="opacity:0.4;cursor:default"' : ''}>151–300</button></div></div>
    </div>
    ${loanMode ? '<p class="muted" style="margin:0 0 8px;font-size:13px">Jogadores que os clubes aceitam emprestar até o fim da temporada (você paga o salário). Toque em "Pedir" para negociar.</p>' : ''}
    <div id="search-list">${viewPlayerTable(slice, page * 150, loanMode)}</div>
    <p class="muted" style="font-size:13px">${filtered.length} jogadores encontrados${pos !== 'all' ? ` em ${POS_LONG[pos]}` : ''}. Mostrando os ${Math.min(150, slice.length)} melhores desta página.</p>`;
}
function viewPlayerTable(list, offset = 0, loanBtn) {
  if (!list.length) return '<div class="panel empty">Nenhum jogador.</div>';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th class="c">OVR</th><th>Pos</th><th>Nome</th><th class="n">Idade</th><th>Nac.</th><th>Clube</th><th class="n">POT</th><th class="n">Valor</th><th></th></tr></thead><tbody>
    ${list.map((p, i) => `<tr class="click" data-a="openPlayer" data-id="${p.id}"><td class="dim">${offset + i + 1}</td><td class="c">${ovrBadge(p.o)}</td><td>${posBadge(p.p)}</td><td><b>${esc(p.n)}</b>${p.tl ? ' <span class="chip">À VENDA</span>' : ''}</td><td class="n">${p.age}</td><td>${natFlag(p.nat)}</td>
      <td>${p.t ? `<span class="team-cell">${crest(p.t, 18)}<span class="tn">${esc(teamName(p.t))}</span></span>` : '<span class="chip">Livre</span>'}</td><td class="n">${clamp(p.pot - 1, p.o, 99)}–${clamp(p.pot + 2, p.o, 99)}</td><td class="n">${money(playerValue(p))}</td><td class="n">${loanBtn ? `<button class="btn xs primary" data-a="pLoan" data-id="${p.id}">Pedir</button>` : '<span class="btn xs">Ver</span>'}</td></tr>`).join('')}
  </tbody></table></div>`;
}
act('fPos', (el) => { UI.filters.pos = el.dataset.v; UI.filters.page = 0; render(); });
act('fPage', (el) => { UI.filters.page = +el.dataset.v; render(); });
act('fNum', (el) => { UI.filters[el.dataset.k] = +el.value || 0; UI.filters.page = 0; render(); });
act('fBool', (el) => { UI.filters[el.dataset.k] = el.checked; UI.filters.page = 0; render(); });
act('fSel', (el) => { UI.filters[el.dataset.k] = el.value; UI.filters.page = 0; render(); });
act('fClub', (el) => {
  UI.filters.club = el.value; UI.filters.page = 0;
  clearTimeout(qTimer);
  qTimer = setTimeout(() => { const box = $('#search-list'); if (box) box.innerHTML = viewPlayerTable(searchResults().slice(0, 150), 0, UI.sub.transfers === 'loans'); }, 180);
});
let qTimer = 0;
act('fQ', (el) => {
  UI.filters.q = el.value; UI.filters.page = 0;
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    const list = searchResults();
    const box = $('#search-list');
    if (box) box.innerHTML = viewPlayerTable(list.slice(0, 150), 0, UI.sub.transfers === 'loans');
  }, 180);
});
function viewOffersIn() {
  const offers = S.tr.offers.filter((o) => o.status === 'open').sort(by((o) => o.d, -1));
  if (!offers.length) return '<div class="panel empty">Nenhuma proposta aberta. Coloque jogadores na lista de transferências ou de empréstimo para atrair interessados.</div>';
  return `<div class="col">${offers.map((o) => {
    const p = S.players[o.pid];
    if (!p) return '';
    return `<div class="panel"><div class="row wrap">${crest(o.from, 34)}<div class="grow"><b>${esc(teamName(o.from))}</b> quer ${playerLink(p)} <span class="muted">(${p.o} · ${POS_PT[p.p]} · valor ${money(playerValue(p))})</span><div class="muted" style="font-size:13px">${fmtDate(o.d, 'dm')} · ${o.loan ? 'Empréstimo até o fim da temporada' : o.swap && S.players[o.swap] ? `Troca: <b style="color:var(--text)">${esc(S.players[o.swap].n)} (${S.players[o.swap].o}, ${S.players[o.swap].age} anos) + ${money(o.cash || 0)}</b>` : `Oferta: <b style="color:var(--text)">${money(o.fee)}</b>`}</div></div>
      <button class="btn sm primary" data-a="offerAct" data-o="${o.id}" data-x="accept">Aceitar</button><button class="btn sm" data-a="offerAct" data-o="${o.id}" data-x="reject">Recusar</button>
      ${o.loan ? '' : `<input class="input" style="max-width:150px" id="ctr-${o.id}" type="number" min="0" step="100000" value="${Math.round(o.fee * 1.2)}"><button class="btn sm" data-a="offerAct" data-o="${o.id}" data-x="counter">Contrapropor</button>`}</div></div>`;
  }).join('')}</div>`;
}
function viewTransferLog() {
  const log = S.tr.log.slice(0, 150);
  if (!log.length) return '<div class="panel empty">Nenhuma transferência ainda nesta temporada.</div>';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Jogador</th><th class="c">OVR</th><th>De</th><th>Para</th><th class="n">Valor</th></tr></thead><tbody>
    ${log.map((r) => `<tr class="${r.to === S.user.team || r.from === S.user.team ? 'me' : ''}"><td>${fmtDate(r.d, 'short')}</td><td>${S.players[r.pid] ? `<span data-a="openPlayer" data-id="${r.pid}" style="cursor:pointer">${esc(r.n)}</span>` : esc(r.n)}</td><td class="c">${ovrBadge(r.o)}</td>
      <td>${r.from ? `<span class="team-cell">${crest(r.from, 18)}<span class="tn">${esc(teamName(r.from))}</span></span>` : 'Sem clube'}</td><td><span class="team-cell">${crest(r.to, 18)}<span class="tn">${esc(teamName(r.to))}</span></span></td>
      <td class="n">${r.loan ? 'Empréstimo' : r.fee ? money(r.fee) : 'Livre'}</td></tr>`).join('')}</tbody></table></div>`;
}
