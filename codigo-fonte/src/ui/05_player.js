/* ===================== player modal & negotiations ===================== */
function playerAvatar(p, size = 84) {
  const t = S.teams[p.t] || null;
  const kit = t ? t.c1 : '#5b6b72', kit2 = t ? t.c2 : '#cfd8dc';
  const h = hashStr(p.n);
  const skins = ['#f1c9a5', '#e0ac85', '#c68b62', '#a8683f', '#7d4a2a', '#5a3420'];
  const groupDark = ['NGA', 'GHA', 'CIV', 'SEN', 'CMR', 'MLI', 'COD', 'BFA', 'GUI', 'GAB', 'ANG', 'ZAM', 'TOG', 'BEN', 'JAM', 'HAI', 'CUW', 'RSA', 'CPV', 'GAM', 'GNB', 'EQG', 'KEN', 'UGA', 'MOZ', 'ZIM', 'TRI', 'SUR'];
  let si = h % 4;
  if (groupDark.includes(p.nat)) si = 3 + (h % 3);
  if (p.nat === 'BRA' || p.nat === 'COL') si = (h % 6);
  const skin = skins[si];
  const hair = ['#1b1410', '#2b1d14', '#4a3020', '#7a5230', '#c8a060', '#111'][(h >> 4) % 6];
  const style = (h >> 7) % 4;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.06)"/>
    <path d="M14 100 C16 76 30 68 50 68 C70 68 84 76 86 100Z" fill="${kit}"/><path d="M40 68 L50 80 L60 68" fill="${kit2}"/>
    <rect x="43" y="56" width="14" height="14" rx="5" fill="${skin}"/><ellipse cx="50" cy="42" rx="17" ry="20" fill="${skin}"/>
    ${style === 0 ? `<path d="M33 38 C33 22 67 22 67 38 C64 30 36 30 33 38Z" fill="${hair}"/>` : style === 1 ? `<path d="M32 40 C30 18 70 18 68 40 C66 26 34 26 32 40Z" fill="${hair}"/><path d="M33 36 L31 46 L35 44Z" fill="${hair}"/><path d="M67 36 L69 46 L65 44Z" fill="${hair}"/>` : style === 2 ? `<ellipse cx="50" cy="26" rx="16" ry="7" fill="${hair}"/>` : `<path d="M34 34 C36 22 64 22 66 34 L66 30 C60 24 40 24 34 30Z" fill="${hair}"/>`}
    <circle cx="44" cy="44" r="1.8" fill="#1a1a1a"/><circle cx="56" cy="44" r="1.8" fill="#1a1a1a"/><path d="M45 53 Q50 56 55 53" stroke="#5a3a2a" stroke-width="1.5" fill="none"/></svg>`;
}
function attrBars(p) {
  const labels = p.p === 'GK' ? ['MER', 'MAN', 'CHU', 'REF', 'VEL', 'POS'] : ['RIT', 'FIN', 'PAS', 'DRI', 'DEF', 'FÍS'];
  return `<div class="col" style="gap:6px">${(p.a || []).map((v, i) => {
    const col = v >= 80 ? 'var(--win)' : v >= 70 ? '#c9d84a' : v >= 60 ? 'var(--warn)' : 'var(--loss)';
    return `<div class="attr"><span class="muted">${labels[i]}</span><span class="bar"><i style="width:${clamp(v, 0, 100)}%;background:${col}"></i></span><b class="tnum">${v}</b></div>`;
  }).join('')}</div>`;
}
function playerSeasonRows(p) {
  const rows = [];
  for (const k in (p.st || {})) {
    const c = S.comps[k];
    const r = p.st[k];
    if (!c) continue;
    rows.push(`<tr><td>${compBadge(c, 18)} ${esc(c.name)}</td><td class="n">${r[0]}</td><td class="n">${r[1]}</td><td class="n">${r[2]}</td><td class="n">${r[0] ? (r[6] / r[0]).toFixed(1) : '-'}</td></tr>`);
  }
  return rows.join('');
}
act('openPlayer', (el) => { const p = S.players[+el.dataset.id]; if (p) openPlayerModal(p.id); });
function openPlayerModal(pid) {
  openModal(() => {
    const p = S.players[pid];
    if (!p) return modalShell('Jogador', '<div class="empty">Jogador não encontrado.</div>');
    const t = S.teams[p.t];
    const uid = S.user.team;
    const ut = S.teams[uid];
    const mine = !S.coach.unemployed && ut && !ut.isNat && p.t === uid;
    const natMode = ut && ut.isNat;
    const val = playerValue(p);
    const yth = p.yth > 0;
    let actions = '';
    if (natMode) {
      const n = S.nations[ut.code];
      if (p.nat === ut.code) actions = (n.sq || []).includes(p.id) ? `<button class="btn" data-a="pCall" data-id="${p.id}" data-v="0">Desconvocar</button>` : `<button class="btn primary" data-a="pCall" data-id="${p.id}" data-v="1">Convocar</button>`;
    } else if (S.coach.unemployed) {
      actions = '';
    } else if (mine) {
      actions = `<button class="btn sm" data-a="pTL" data-id="${p.id}">${p.tl ? 'Tirar da lista de transferências' : 'Colocar na lista de transferências'}</button>
        <button class="btn sm" data-a="pLL" data-id="${p.id}">${p.ll ? 'Tirar da lista de empréstimo' : 'Lista de empréstimo'}</button>
        <button class="btn sm" data-a="pRenew" data-id="${p.id}">Renovar contrato</button>
        <button class="btn sm ${p.rn ? 'primary' : ''}" data-a="pRn" data-id="${p.id}" title="No fim do contrato o clube renova sozinho, no salário que ele pedir">Renovação automática: ${p.rn ? 'LIGADA' : 'desligada'}</button>
        <button class="btn sm" data-a="pNumber" data-id="${p.id}">Mudar camisa</button>
        <button class="btn sm" data-a="pPos" data-id="${p.id}">${p.pc ? 'Treino de posição' : 'Mudar posição'}</button>
        <button class="btn sm danger" data-a="pRelease" data-id="${p.id}">Liberar</button>`;
    } else if (!yth && p.yth !== -1) {
      const short = S.tr.short.includes(p.id);
      actions = `${p.t ? `<button class="btn primary sm" data-a="pBid" data-id="${p.id}">Fazer proposta</button><button class="btn sm" data-a="pLoan" data-id="${p.id}">Pedir empréstimo</button>` : `<button class="btn primary sm" data-a="pFree" data-id="${p.id}">Contratar (sem custo)</button>`}
        <button class="btn sm" data-a="pShort" data-id="${p.id}">${short ? 'Remover dos observados' : 'Observar'}</button>`;
    }
    const career = p.car || [0, 0, 0];
    return modalShell(esc(p.n), `
      <div class="row wrap" style="gap:18px;align-items:flex-start">
        ${playerAvatar(p, 104)}
        <div class="grow" style="min-width:220px">
          <div class="row wrap">${ovrBadge(p.o)}${formTag(p, true)} ${posBadge(p.p)} ${p.alt ? `<span class="muted" style="font-size:13px">também ${p.alt.split(',').map((x) => POS_PT[x] || x).join(', ')}</span>` : ''}</div>
          <div class="kv" style="margin-top:10px">
            <span class="k">Clube</span><span>${t ? `<span data-a="openTeam" data-id="${t.id}" style="cursor:pointer">${crest(t, 18)} ${esc(t.n)}</span>` : yth ? 'Base (academia)' : p.natOnly ? 'Clube local' : 'Sem clube'}${p.loan ? ` <span class="muted">(emprestado ${esc(tA(p.loan.from, 'pelo'))}${p.loan.o != null ? ` · overall ${p.loan.o} → ${p.o} em ${Math.round(p.loan.g || 0)} jogos` : ''})</span>` : ''}</span>
            ${p.t || mine ? `<span class="k">Fase</span><span>${formLine(p)}</span>` : ''}
            ${p.pc ? `<span class="k">Treino de posição</span><span>${posBadge(p.pc.to)} ${Math.round(posChangeProgress(p) * 100)}% · conclui em ${fmtDate(p.pc.d0 + p.pc.days, 'short')} · overall previsto ${p.pc.o}</span>` : ''}
            <span class="k">Nacionalidade</span><span>${natFlag(p.nat)} ${esc(natName(p.nat))}</span>
            <span class="k">Idade</span><span>${p.age} anos · ${p.h} cm · pé ${p.f === 'L' ? 'esquerdo' : 'direito'}</span>
            <span class="k">Potencial</span><span>${mine || yth ? p.pot : `${clamp(p.pot - 2, p.o, 99)}–${clamp(p.pot + 2, p.o, 99)}`}</span>
            <span class="k">Valor de mercado</span><span>${money(val)}</span>
            ${p.t ? `<span class="k">Salário</span><span>${money(p.w || 0)}/semana</span><span class="k">Contrato até</span><span>${p.ct || '—'}</span>` : ''}
            <span class="k">Condição</span><span>${fitBar(p)} ${Math.round(fitnessNow(p))}% ${isInjured(p) ? `<span class="flag-inj">· ${esc(p.injN || 'Lesionado')} até ${fmtDate(p.inj, 'short')}</span>` : ''}${isSuspended(p) ? ' <span class="flag-sus">· suspenso</span>' : ''}</span>
            ${mine ? `<span class="k">Moral</span><span>${Math.round(p.mor || 70)}/100${p.cnp ? ` · ${p.cnp} jogos sem atuar` : ''}</span>` : ''}
          </div>
        </div>
        <div style="min-width:220px;flex:1">${attrBars(p)}</div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div><h3 style="font-size:18px;margin-bottom:6px">Temporada</h3>${playerSeasonRows(p) ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Competição</th><th class="n">J</th><th class="n">G</th><th class="n">A</th><th class="n">Nota</th></tr></thead><tbody>${playerSeasonRows(p)}</tbody></table></div>` : '<div class="muted">Sem jogos nesta temporada.</div>'}</div>
        <div><h3 style="font-size:18px;margin-bottom:6px">Carreira no jogo</h3><div class="grid g3"><div class="stat-tile"><div class="k">Jogos</div><div class="v">${career[0]}</div></div><div class="stat-tile"><div class="k">Gols</div><div class="v">${career[1]}</div></div><div class="stat-tile"><div class="k">Assist.</div><div class="v">${career[2]}</div></div></div></div>
      </div>`, actions ? `<div class="row wrap" style="gap:8px;justify-content:flex-end">${actions}</div>` : '', '');
  });
}
act('pTL', (el) => { const p = S.players[+el.dataset.id]; p.tl = p.tl ? 0 : 1; if (p.tl) p.ll = 0; refreshModal(); toast(p.tl ? `${p.n} está à venda.` : `${p.n} saiu da lista.`); });
act('pRn', (el) => {
  const p = S.players[+el.dataset.id];
  if (!p.rn && squadOf(S.user.team).filter((q) => q.rn).length >= 8) { toast('Máximo de 8 jogadores com renovação automática.'); return; }
  p.rn = p.rn ? 0 : 1; refreshModal();
  toast(p.rn ? `${p.n}: o contrato será renovado automaticamente no fim da temporada.` : `${p.n}: renovação automática desligada.`);
});
act('pLL', (el) => { const p = S.players[+el.dataset.id]; p.ll = p.ll ? 0 : 1; if (p.ll) p.tl = 0; refreshModal(); toast(p.ll ? `${p.n} disponível para empréstimo.` : `${p.n} saiu da lista de empréstimo.`); });
act('pShort', (el) => { const id = +el.dataset.id; S.tr.short = S.tr.short.includes(id) ? S.tr.short.filter((x) => x !== id) : S.tr.short.concat(id); refreshModal(); });
act('pCall', (el) => {
  const t = S.teams[S.user.team]; const n = S.nations[t.code]; const id = +el.dataset.id;
  n.sq = n.sq || [];
  if (el.dataset.v === '1') { if (n.sq.length >= 26) { toast('Máximo de 26 convocados.', true); return; } n.sq.push(id); }
  else { n.sq = n.sq.filter((x) => x !== id); t.xi = t.xi.map((x) => (x === id ? 0 : x)); t.bench = (t.bench || []).filter((x) => x !== id); }
  refreshModal(); render();
});
act('pNumber', (el) => {
  const p = S.players[+el.dataset.id];
  const used = squadOf(p.t).filter((x) => x.id !== p.id).map((x) => x.num);
  openModal(modalShell('Mudar número da camisa', `<form class="row" data-a="pNumberSave" data-id="${p.id}"><input class="input" id="num-in" type="number" min="1" max="99" value="${p.num || ''}" style="max-width:120px"><button class="btn primary" type="submit">Salvar</button></form>
    <p class="muted" style="font-size:13px">Números em uso: ${used.sort((a, b) => a - b).join(', ')}</p>`), { size: 'narrow' });
});
act('pNumberSave', (el) => {
  const p = S.players[+el.dataset.id];
  const n = clamp(+($('#num-in').value) || 0, 1, 99);
  const other = squadOf(p.t).find((x) => x.id !== p.id && x.num === n);
  if (other) other.num = p.num;
  p.num = n;
  closeModal(); refreshModal(); render();
  toast(`${p.n} agora veste a ${n}${other ? ` (${other.n} ficou com a ${other.num})` : ''}.`);
});
act('pRelease', (el) => {
  const p = S.players[+el.dataset.id];
  const weeks = Math.max(0, ((p.ct || seasonEndYear()) - seasonEndYear()) * 52 + 26);
  const cost = Math.round((p.w || 0) * weeks * 0.5);
  openModal(modalShell(`Liberar ${esc(p.n)}?`, `<p>Rescindir o contrato custa cerca de <b>${money(cost)}</b> do orçamento.</p>`, `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="pReleaseOk" data-id="${p.id}">Liberar</button>`), { size: 'narrow' });
});
act('pReleaseOk', (el) => {
  const p = S.players[+el.dataset.id];
  const cost = releaseFromUser(p);
  closeAllModals(); render();
  toast(`${p.n} foi liberado (custo ${money(cost)}).`);
});

// ---------- negotiations UI
act('pRenew', (el) => openContractModal(+el.dataset.id, 'renew'));
act('pFree', (el) => openContractModal(+el.dataset.id, 'free'));
act('pBid', (el) => openBidModal(+el.dataset.id, false));
act('pLoan', (el) => openBidModal(+el.dataset.id, true));
function openBidModal(pid, loan) {
  const p = S.players[pid];
  const ask = askingPrice(p);
  const ut = S.teams[S.user.team];
  UI.neg = { pid, loan, fee: loan ? 0 : roundMoney(playerValue(p)), msg: '', stage: 'club', swap: [] };
  openModal(() => {
    const n = UI.neg;
    return modalShell(loan ? `Empréstimo: ${esc(p.n)}` : `Proposta por ${esc(p.n)}`, `
      <div class="row wrap">${crest(p.t, 30)}<b>${esc(teamName(p.t))}</b><span class="muted">· valor ${money(playerValue(p))} · contrato até ${p.ct}</span></div>
      ${windowInfo().open ? '' : `<div class="chip" style="margin-top:10px;color:var(--warn)">${windowInfo().text}</div>`}
      ${loan ? '<p>Empréstimo até o fim da temporada. Você paga o salário do jogador.</p>' : `
      <div class="field" style="margin-top:14px"><label for="bid-fee">Dinheiro na proposta <span class="muted">(negativo = o clube paga a diferença)</span></label>
      <div class="row"><input id="bid-fee" class="input" type="number" step="100000" value="${n.fee}" style="max-width:220px"><span class="muted">${money(n.fee)} · seu orçamento: ${money(ut.budget)}</span></div></div>
      ${bidSwapHtml(p, n)}`}
      ${n.msg ? `<div class="panel" style="margin-top:12px;background:var(--panel2)">${esc(n.msg)}</div>` : ''}`,
      `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="sendBid">${loan ? 'Pedir empréstimo' : 'Enviar proposta'}</button>`);
  });
}
// swap: pick your own players to include in the offer (the club values each a bit under the market)
function bidSwapHtml(p, n) {
  const sq = squadOf(S.user.team).filter((q) => !q.loan && q.id !== p.id).sort(by((q) => playerValue(q), -1));
  const tot = swapTotal(n.swap);
  return `<div style="margin-top:14px"><div class="muted up" style="font-size:11px;margin-bottom:6px">Incluir jogadores na troca <span style="text-transform:none">(${n.swap.length ? `${n.swap.length} selecionado${n.swap.length > 1 ? 's' : ''}: ${money(tot)} na avaliação do clube` : 'opcional'})</span></div>
    <div class="col" style="gap:4px;max-height:210px;overflow:auto">${sq.map((q) => `<label class="row" style="gap:8px;padding:5px 8px;border-radius:8px;background:var(--panel2);cursor:pointer"><input type="checkbox" data-a="bidSwap" data-id="${q.id}" ${n.swap.includes(q.id) ? 'checked' : ''}>${ovrBadge(q.o)} ${posBadge(q.p)}<span class="grow" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(q.n)}</span><span class="muted" style="font-size:12px">${q.age} · ${money(swapValue(q))}</span></label>`).join('')}</div></div>`;
}
act('bidSwap', (el) => {
  const n = UI.neg, id = +el.dataset.id, f = $('#bid-fee');
  if (f) n.fee = Math.round(+f.value || 0);
  n.swap = el.checked ? n.swap.concat(id) : n.swap.filter((x) => x !== id);
  refreshModal();
});
act('sendBid', () => {
  const n = UI.neg;
  const p = S.players[n.pid];
  if (!n.loan) n.fee = Math.round(+($('#bid-fee').value) || 0);
  if (!n.loan && n.fee < 0 && !n.swap.length) n.fee = 0;
  const r = clubResponse(p, n.fee + (n.loan ? 0 : swapTotal(n.swap)), n.loan);
  if (r.ok) {
    closeModal();
    openContractModal(p.id, n.loan ? 'loan' : 'transfer', n.fee, n.swap);
    toast(`${teamName(p.t)} aceitou${n.swap.length ? ' a troca' : ''}! Agora negocie com o jogador.`);
    return;
  }
  n.msg = r.msg + (r.counter ? ` Contraproposta: ${money(r.counter)}.` : '');
  if (r.counter) n.fee = r.counter - swapTotal(n.swap);
  refreshModal();
});
function openContractModal(pid, kind, fee = 0, swap = []) {
  const p = S.players[pid];
  const ut = S.teams[S.user.team];
  const demand = playerWageDemand(p, ut, 'titular');
  UI.ctr = { pid, kind, fee, swap, wage: kind === 'renew' ? Math.max(p.w || 0, demand) : demand, years: kind === 'loan' ? 1 : 3, role: 'titular', msg: '' };
  openModal(() => {
    const c = UI.ctr;
    const title = kind === 'renew' ? `Renovar com ${esc(p.n)}` : kind === 'loan' ? `Salário no empréstimo de ${esc(p.n)}` : `Contrato de ${esc(p.n)}`;
    return modalShell(title, `
      <div class="row wrap">${ovrBadge(p.o)} ${posBadge(p.p)}<b>${esc(p.n)}</b><span class="muted">${p.age} anos · salário atual ${money(p.w || 0)}/sem</span></div>
      <div class="grid g3" style="margin-top:14px">
        <div class="field"><label for="ct-w">Salário semanal</label><input id="ct-w" class="input" type="number" min="0" step="500" value="${c.wage}"></div>
        <div class="field"><label for="ct-y">Duração</label><select id="ct-y" class="input" ${kind === 'loan' ? 'disabled' : ''}>${[1, 2, 3, 4, 5].map((y) => `<option value="${y}" ${y === c.years ? 'selected' : ''}>${y} ${y === 1 ? 'ano' : 'anos'}</option>`).join('')}</select></div>
        <div class="field"><label for="ct-r">Papel no elenco</label><select id="ct-r" class="input">${[['titular', 'Titular'], ['rotacao', 'Rotação'], ['reserva', 'Reserva']].map(([k, l]) => `<option value="${k}" ${k === c.role ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
      <p class="muted" style="font-size:13px">Folha atual ${money(wageBill(ut.id))} de ${money(ut.wb)}/semana. ${swap.length ? `Troca acordada: ${swap.map((id) => esc(S.players[id].n)).join(', ')}${fee ? ` e ${fee > 0 ? 'mais' : 'o clube paga'} ${money(Math.abs(fee))}` : ''}.` : fee ? `Taxa acordada: ${money(fee)}.` : ''}</p>
      ${c.msg ? `<div class="panel" style="background:var(--panel2)">${esc(c.msg)}${c.wbNeed ? `<div class="row wrap" style="gap:8px;margin-top:8px"><button class="btn sm primary" data-a="ctrRaiseWb" ${wageRaiseCost(c.wbNeed) > ut.budget ? 'disabled' : ''}>Ampliar a folha em ${money(c.wbNeed)}/sem e assinar</button><span class="muted" style="font-size:13px">custa ${money(wageRaiseCost(c.wbNeed))} do orçamento (${money(ut.budget)} disponíveis)</span></div>` : ''}</div>` : ''}`,
      `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="sendContract">Oferecer contrato</button>`);
  });
}
act('sendContract', () => sendContract());
act('ctrRaiseWb', () => {
  const c = UI.ctr;
  const r = raiseWageBudget(S.teams[S.user.team], c.wbNeed);
  if (!r.ok) { toast(r.msg, true); return; }
  toast(r.msg);
  sendContract();
});
function sendContract() {
  const c = UI.ctr;
  c.wbNeed = 0;
  const p = S.players[c.pid];
  const ut = S.teams[S.user.team];
  c.wage = Math.max(0, Math.round(+($('#ct-w').value) || 0));
  c.years = +($('#ct-y').value) || 1;
  c.role = $('#ct-r').value;
  if (c.kind === 'renew') {
    const r = renewContract(p, c.wage, c.years);
    if (r.ok) { closeModal(); refreshModal(); toast(r.msg); render(); return; }
    c.msg = r.msg + (r.demand ? ` Pedido: ${money(r.demand)}/sem.` : '');
    if (r.demand) c.wage = r.demand;
    refreshModal(); return;
  }
  const r = playerContractResponse(p, ut, c.wage, c.years, c.role);
  if (!r.ok) { c.msg = r.msg + (r.demand ? ` Pedido: ${money(r.demand)}/sem.` : ''); if (r.demand) c.wage = r.demand; refreshModal(); return; }
  const done = userSign(p, c.fee || 0, c.wage, c.years, c.kind === 'loan', c.swap);
  if (!done.ok) { c.msg = done.msg; c.wbNeed = done.wbNeed || 0; refreshModal(); return; }
  closeAllModals();
  render();
  toast(done.msg);
}
// ---------- position change
act('pPos', (el) => {
  const pid = +el.dataset.id;
  openModal(() => {
    const p = S.players[pid];
    if (p.pc) {
      const pr = posChangeProgress(p);
      return modalShell(`Treino de posição · ${esc(p.n)}`, `
        <div class="row wrap" style="gap:8px">${posBadge(p.p)} → ${posBadge(p.pc.to)} <b>${esc(POS_LONG[p.pc.to])}</b></div>
        <div style="height:10px;border-radius:5px;background:var(--panel3);overflow:hidden;margin:14px 0 8px"><i style="display:block;height:100%;width:${Math.round(pr * 100)}%;background:var(--accent-hi)"></i></div>
        <p class="muted" style="margin:0">${Math.round(pr * 100)}% concluído · termina em ${fmtDate(p.pc.d0 + p.pc.days, 'long')} · overall previsto na nova posição: <b>${p.pc.o}</b> (hoje ${p.o}).
        Enquanto treina, ele já rende cada vez melhor como ${esc(POS_LONG[p.pc.to].toLowerCase())}.</p>`,
        `<button class="btn danger" data-a="pPosCancel" data-id="${p.id}">Cancelar treino</button><button class="btn primary" data-a="closeModal">Fechar</button>`);
    }
    const opts = POSITIONS.filter((x) => x !== p.p && (x === 'GK') === (p.p === 'GK'));
    const rows = opts.map((to) => {
      const c = posSimilarity(p.p, to), sec = p.alt && p.alt.split(',').includes(to);
      const o1 = posChangeOvr(p, to), d = o1 - p.o;
      return { to, c: sec ? 1 : c, sec, days: posChangeDays(p, to), o1, d };
    }).sort((a, b) => b.c - a.c || b.o1 - a.o1);
    return modalShell(`Mudar posição · ${esc(p.n)}`, `
      <p class="muted" style="margin-top:0">Hoje: ${posBadge(p.p)} ${esc(POS_LONG[p.p])}, overall ${p.o}. Quanto mais parecida a posição, mais rápido ele aprende. Ao terminar, a posição atual vira secundária e o overall é recalculado pelos atributos.</p>
      <div class="col" style="gap:6px">${rows.map((r) => `<button class="pos-opt" data-a="pPosGo" data-id="${p.id}" data-to="${r.to}">
        ${posBadge(r.to)}<span class="grow"><b>${esc(POS_LONG[r.to])}</b><span class="muted" style="font-size:12px;display:block">${r.sec ? 'já é posição secundária' : `posição ${posChangeLabel(r.c)}`} · ${weeksTxt(r.days)} de treino</span></span>
        <span class="tnum" style="text-align:right">${ovrBadge(r.o1)}<span style="display:block;font-size:12px;color:${r.d > 0 ? 'var(--win)' : r.d < 0 ? 'var(--loss)' : 'var(--muted)'}">${r.d > 0 ? '+' : ''}${r.d}</span></span></button>`).join('')}</div>`, '');
  }, { size: 'narrow' });
});
act('pPosGo', (el) => {
  const p = S.players[+el.dataset.id];
  const r = startPosChange(p, el.dataset.to);
  toast(r.msg, !r.ok);
  if (r.ok) { closeModal(); refreshModal(); render(); }
});
act('pPosCancel', (el) => { cancelPosChange(S.players[+el.dataset.id]); closeModal(); refreshModal(); render(); toast('Treino de posição cancelado.'); });
