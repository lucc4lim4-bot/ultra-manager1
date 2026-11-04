/* ===================== squad: lineup, squad hub, stats, call-ups ===================== */
function userPlayers() {
  const t = S.teams[S.user.team];
  return t.isNat ? nationSquad(t.code) : squadOf(t.id);
}
function viewSquad() {
  if (S.coach.unemployed) return '<div class="panel empty">Você está sem clube.</div>';
  const t = S.teams[S.user.team];
  const sub = UI.sub.squad || 'lineup';
  const tabs = [['lineup', 'Escalação'], ['hub', t.isNat ? 'Convocados' : 'Central de elenco'], ['stats', 'Artilharia']];
  if (t.isNat) tabs.push(['callup', 'Convocação']);
  let body = '';
  if (sub === 'lineup') body = viewLineup();
  else if (sub === 'hub') body = viewSquadHub();
  else if (sub === 'stats') body = viewStats();
  else if (sub === 'callup') body = viewCallup();
  const back = UI.returnToMatch ? `<div class="panel row wrap" style="margin-bottom:12px;border-color:var(--accent-hi)"><b class="grow">Ajuste a escalação e volte para a partida.</b><button class="btn primary" data-a="backToMatch">Voltar à partida</button></div>` : '';
  return `${back}<div class="subtabs">${tabs.map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="subtab" data-g="squad" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}
act('subtab', (el) => { UI.sub[el.dataset.g] = el.dataset.k; UI.sel = null; render(); });

// ------------------------------------------------------------------ lineup editor
function ensureLineup(t) {
  const players = t.isNat ? nationSquad(t.code) : squadOf(t.id);
  const ids = new Set(players.map((p) => p.id));
  if (!t.xi || t.xi.length !== 11) { const lu = autoLineup(players, t.form); t.xi = lu.xi; t.bench = lu.bench; }
  t.xi = t.xi.map((id) => (ids.has(id) ? id : 0));
  t.bench = (t.bench || []).filter((id) => ids.has(id) && !t.xi.includes(id));
  return players;
}
function pitchLines() {
  return `<svg class="lines" viewBox="0 0 68 100" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="0.35">
    <rect x="2" y="2" width="64" height="96"/><line x1="2" y1="50" x2="66" y2="50"/><circle cx="34" cy="50" r="8"/>
    <rect x="16" y="2" width="36" height="15"/><rect x="25" y="2" width="18" height="6"/><rect x="16" y="83" width="36" height="15"/><rect x="25" y="92" width="18" height="6"/>
    <path d="M27 17 A8 8 0 0 0 41 17"/><path d="M27 83 A8 8 0 0 1 41 83"/></g><circle cx="34" cy="50" r="0.6" fill="#fff"/></svg>`;
}
function slotCard(p, pos, i, sel) {
  if (!p) return `<div class="pslot empty ${sel ? 'sel' : ''}" data-a="slotClick" data-k="xi" data-i="${i}"><div class="card"><div class="o">–</div><div class="p">${POS_PT[pos]}</div></div><div class="nm">Vazio</div></div>`;
  const fit = Math.round(fitnessNow(p));
  const col = fit >= 85 ? 'var(--win)' : fit >= 70 ? '#c9d84a' : fit >= 55 ? 'var(--warn)' : 'var(--loss)';
  const pf = posFit(p, pos);
  const warn = !available(p) ? '<span class="warn flag-inj">✚</span>' : pf < 0.9 ? '<span class="warn" style="color:var(--warn)" title="Fora de posição">!</span>' : '';
  return `<div class="pslot ${sel ? 'sel' : ''}" data-a="slotClick" data-k="xi" data-i="${i}" data-pid="${p.id}">
    ${warn}<div class="card"><div class="o">${Math.round(p.o * (pf < 1 ? pf : 1))}</div><div class="p">${POS_PT[pos]}</div></div>
    <div class="nm">${esc(p.s || p.n)}</div><div class="fitbar"><i style="width:${fit}%;background:${col}"></i></div></div>`;
}
function viewLineup() {
  const t = S.teams[S.user.team];
  const players = ensureLineup(t);
  const slots = FORMATIONS[t.form];
  const sel = UI.sel;
  const slotHtml = slots.map((s, i) => {
    const p = S.players[t.xi[i]];
    return `<div style="position:absolute;left:${s[1]}%;top:${100 - s[2]}%">${slotCard(p, s[0], i, sel && sel.k === 'xi' && sel.i === i).replace('class="pslot', 'style="position:relative;transform:translate(-50%,-50%)" class="pslot')}</div>`;
  }).join('');
  const xiSet = new Set(t.xi);
  const benchSet = new Set(t.bench);
  const reserves = players.filter((p) => !xiSet.has(p.id) && !benchSet.has(p.id)).sort(by((p) => p.o, -1));
  const row = (p, k, i) => `<div class="bp ${sel && sel.k === k && sel.i === i ? 'sel' : ''}" data-a="slotClick" data-k="${k}" data-i="${i}" data-pid="${p.id}">
      ${posBadge(p.p)} ${ovrBadge(p.o)}${formTag(p)}<span class="grow" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.n)}${statusFlags(p)}</span>${fitBar(p)}</div>`;
  const avgXI = avg(t.xi.map((id) => S.players[id]).filter(Boolean), (p) => p.o);
  return `<div class="lineup-wrap">
    <div class="col">
      <div class="row wrap">
        <div class="field" style="min-width:140px"><label for="form-sel">Formação</label><select id="form-sel" class="input" data-a="setFormation">${FORMATION_LIST.map((f) => `<option ${f === t.form ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
        <div class="field"><label>Mentalidade</label><div class="seg wrapseg">${MENTS.map(([v, l]) => `<button class="${(t.ment || 0) === v ? 'on' : ''}" data-a="setMent" data-v="${v}">${l}</button>`).join('')}</div></div>
        <div class="field" style="min-width:150px"><label for="sty-sel">Estilo de jogo</label><select id="sty-sel" class="input" data-a="setStyle" title="${esc(STYLES[t.sty || 'bal'].d)}">${STYLE_KEYS.map((q) => `<option value="${q}" ${(t.sty || 'bal') === q ? 'selected' : ''}>${STYLES[q].n}</option>`).join('')}</select></div>
        <span class="grow"></span>
        <div class="stat-tile" style="padding:8px 12px"><div class="k">Média do XI</div><div class="v" style="font-size:22px">${avgXI.toFixed(1)}</div></div>
        <button class="btn sm" data-a="autoXI">Escalação automática</button>
      </div>
      ${tacticsPanel(t)}
      <div class="pitch">${pitchLines()}${slotHtml}</div>
      <p class="muted center" style="font-size:13px;margin:0">Toque em um jogador e depois em outro para trocar de lugar. Arraste no computador.</p>
    </div>
    <div class="col">
      <div class="panel"><h3>Banco <span class="sub">${t.bench.length}/12</span></h3><div class="bench-list">${t.bench.map((id, i) => row(S.players[id], 'bench', i)).join('') || '<div class="muted">Vazio</div>'}</div></div>
      <div class="panel"><h3>Reservas <span class="sub">${reserves.length}</span></h3><div class="bench-list">${reserves.map((p) => row(p, 'res', p.id)).join('') || '<div class="muted">Ninguém</div>'}</div></div>
    </div></div>`;
}
act('setFormation', (el) => {
  const t = S.teams[S.user.team];
  const old = t.xi.map((id) => S.players[id]).filter(Boolean);
  t.form = el.value;
  const slots = FORMATIONS[t.form];
  const used = new Set();
  t.xi = slots.map((s) => {
    const best = old.filter((p) => !used.has(p.id)).sort(by((p) => effRating(p, s[0]), -1))[0];
    if (best) { used.add(best.id); return best.id; }
    return 0;
  });
  render();
});
act('setMent', (el) => { S.teams[S.user.team].ment = +el.dataset.v; render(); });
act('autoXI', () => {
  const t = S.teams[S.user.team];
  const lu = autoLineup(userPlayers(), t.form);
  t.xi = lu.xi; t.bench = lu.bench.slice(0, 12);
  render();
  toast('Escalação montada com os melhores disponíveis.');
});
function lineupGet(t, k, i) { return k === 'xi' ? t.xi[i] : k === 'bench' ? t.bench[i] : i; }
function lineupSwap(a, b) {
  const t = S.teams[S.user.team];
  if (a.k === b.k && a.i === b.i) return;
  const pa = lineupGet(t, a.k, a.i), pb = lineupGet(t, b.k, b.i);
  const setAt = (k, i, v) => {
    if (k === 'xi') t.xi[i] = v || 0;
    else if (k === 'bench') { if (v) t.bench[i] = v; else t.bench.splice(i, 1); }
  };
  if (a.k === 'res' && b.k === 'res') return;
  if (a.k === 'res') { // reserve into slot/bench
    if (b.k === 'bench') t.bench[b.i] = pa; else t.xi[b.i] = pa;
    return;
  }
  if (b.k === 'res') {
    if (a.k === 'bench') t.bench[a.i] = pb; else t.xi[a.i] = pb;
    return;
  }
  setAt(a.k, a.i, pb); setAt(b.k, b.i, pa);
  t.bench = t.bench.filter(Boolean);
}
act('slotClick', (el) => {
  if (UI.dragJustDropped) { UI.dragJustDropped = false; return; }
  const k = el.dataset.k, i = k === 'res' ? +el.dataset.i : +el.dataset.i;
  const cur = { k, i };
  if (!UI.sel) { UI.sel = cur; render(); return; }
  if (UI.sel.k === k && UI.sel.i === i) { UI.sel = null; render(); return; }
  if (UI.sel.k === 'res' && k === 'res') { UI.sel = cur; render(); return; }
  const t = S.teams[S.user.team];
  if ((UI.sel.k === 'res' && k === 'bench' && false)) return;
  if (UI.sel.k === 'res' && cur.k !== 'res' || cur.k === 'res' && UI.sel.k !== 'res') {
    const res = UI.sel.k === 'res' ? UI.sel : cur, other = UI.sel.k === 'res' ? cur : UI.sel;
    lineupSwap(res, other);
  } else lineupSwap(UI.sel, cur);
  if (t.bench.length > 12) t.bench.length = 12;
  UI.sel = null;
  render();
});
// drag & drop for lineup (pointer)
(function setupDrag() {
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.pslot[data-pid], .bp[data-pid]');
    if (!el || e.pointerType === 'touch') return;
    drag = { el, k: el.dataset.k, i: +el.dataset.i, x: e.clientX, y: e.clientY, ghost: null };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      drag.ghost = drag.el.cloneNode(true);
      Object.assign(drag.ghost.style, { position: 'fixed', pointerEvents: 'none', zIndex: 200, opacity: '0.9', left: '0', top: '0', transform: 'none', width: drag.el.offsetWidth + 'px' });
      document.body.appendChild(drag.ghost);
    }
    if (drag.ghost) {
      drag.ghost.style.left = e.clientX - 30 + 'px'; drag.ghost.style.top = e.clientY - 30 + 'px';
      $$('.drop').forEach((x) => x.classList.remove('drop'));
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const tgt = over && over.closest('.pslot[data-k], .bp[data-k]');
      if (tgt && tgt !== drag.el) tgt.classList.add('drop');
    }
  });
  document.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.ghost) return;
    d.ghost.remove();
    const over = document.elementFromPoint(e.clientX, e.clientY);
    const tgt = over && over.closest('.pslot[data-k], .bp[data-k]');
    if (tgt && tgt !== d.el) {
      UI.dragJustDropped = true;
      setTimeout(() => (UI.dragJustDropped = false), 50);
      const a = { k: d.k, i: d.i }, b = { k: tgt.dataset.k, i: +tgt.dataset.i };
      if (a.k === 'res' || b.k === 'res') { const res = a.k === 'res' ? a : b, other = a.k === 'res' ? b : a; if (res !== other) lineupSwap(res, other); }
      else lineupSwap(a, b);
      UI.sel = null;
      render();
    }
  });
})();

// ------------------------------------------------------------------ squad hub
function viewSquadHub() {
  const t = S.teams[S.user.team];
  const sort = UI.hubSort || 'pos';
  const players = userPlayers().slice();
  const posOrder = POSITIONS;
  if (sort === 'pos') players.sort((a, b) => posOrder.indexOf(a.p) - posOrder.indexOf(b.p) || b.o - a.o);
  else if (sort === 'ovr') players.sort(by((p) => p.o, -1));
  else if (sort === 'age') players.sort(by((p) => p.age));
  else if (sort === 'val') players.sort(by((p) => playerValue(p), -1));
  const lc = userLeagueComp();
  const statsOf = (p) => { let a = 0, g = 0, as = 0; for (const k in (p.st || {})) { const r = p.st[k]; if (S.comps[k] && S.comps[k].kind === 'youth') continue; a += r[0]; g += r[1]; as += r[2]; } return [a, g, as]; };
  const head = `<tr><th>Nº</th><th>Nome</th><th>Pos</th><th class="n">Idade</th><th class="c">OVR</th><th class="n">POT</th><th>Condição</th>${t.isNat ? '<th>Clube</th>' : '<th class="n">Valor</th><th class="n">Salário</th><th class="n">Contrato</th>'}<th class="n">J</th><th class="n">G</th><th class="n">A</th></tr>`;
  const rows = players.map((p) => {
    const [a, g, as] = statsOf(p);
    return `<tr class="click" data-a="openPlayer" data-id="${p.id}"><td class="tnum">${p.num || ''}</td><td>${esc(p.n)}${statusFlags(p)}</td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td class="c nw">${ovrBadge(p.o)}${formTag(p, true)}</td><td class="n">${p.pot}</td><td>${fitBar(p)}</td>
      ${t.isNat ? `<td>${p.t ? esc(teamName(p.t)) : 'Clube local'}</td>` : `<td class="n">${money(playerValue(p))}</td><td class="n">${money(p.w || 0)}</td><td class="n">${p.loan ? 'Emp.' : p.ct || '—'}</td>`}
      <td class="n">${a}</td><td class="n">${g}</td><td class="n">${as}</td></tr>`;
  }).join('');
  const wb = t.isNat ? '' : `<div class="row wrap" style="gap:16px"><span class="chip">Elenco: ${players.length}/36</span><span class="chip">Folha: ${money(wageBill(t.id))}/sem de ${money(t.wb)}</span><span class="chip">Orçamento: ${money(t.budget)}</span></div>`;
  return `<div class="row wrap" style="margin-bottom:10px">${wb}<span class="grow"></span><div class="seg">${[['pos', 'Posição'], ['ovr', 'Overall'], ['age', 'Idade'], ['val', 'Valor']].map(([k, l]) => `<button class="${sort === k ? 'on' : ''}" data-a="hubSort" data-k="${k}">${l}</button>`).join('')}</div></div>
    <div class="tbl-wrap"><table class="tbl"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}
act('hubSort', (el) => { UI.hubSort = el.dataset.k; render(); });

// ------------------------------------------------------------------ stats (artilharia)
function viewStats() {
  const comps = userComps().filter((c) => c.kind !== 'youth' && c.kind !== 'friendly');
  const sel = comps.find((c) => c.id === UI.statComp) || comps[0];
  const scope = UI.statScope || 'comp';
  let rowsG = [], rowsA = [], rowsJ = [];
  if (sel && scope === 'comp') { rowsG = topScorers(sel.id, 20, 'g'); rowsA = topScorers(sel.id, 20, 'a'); rowsJ = topScorers(sel.id, 20, 'apps'); }
  else {
    const mine = userPlayers().map((p) => { let a = 0, g = 0, as = 0; for (const k in (p.st || {})) { if (S.comps[k] && S.comps[k].kind === 'youth') continue; const r = p.st[k]; a += r[0]; g += r[1]; as += r[2]; } return { pid: p.id, name: p.n, team: S.user.team, apps: a, goals: g, assists: as }; });
    rowsG = mine.filter((r) => r.goals).sort(by((r) => r.goals, -1)); rowsA = mine.filter((r) => r.assists).sort(by((r) => r.assists, -1)); rowsJ = mine.filter((r) => r.apps).sort(by((r) => r.apps, -1));
  }
  const tbl = (title, rows, f, lbl) => `<div class="panel"><h3>${title}</h3>${rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Jogador</th><th>Time</th><th class="n">${lbl}</th></tr></thead><tbody>
    ${rows.slice(0, 20).map((r, i) => `<tr class="click ${r.team === S.user.team ? 'me' : ''}" data-a="openPlayer" data-id="${r.pid}"><td>${i + 1}</td><td>${esc(r.name)}</td><td>${S.teams[r.team] ? `<span class="team-cell">${crest(r.team, 18)}<span class="tn">${esc(teamShort(r.team))}</span></span>` : ''}</td><td class="n"><b>${r[f]}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Ainda sem números.</div>'}</div>`;
  return `<div class="row wrap" style="margin-bottom:12px"><div class="seg"><button class="${scope === 'comp' ? 'on' : ''}" data-a="statScope" data-k="comp">Competição</button><button class="${scope === 'team' ? 'on' : ''}" data-a="statScope" data-k="team">Meu time</button></div>
    ${scope === 'comp' && comps.length ? `<select class="input" style="max-width:280px" data-a="statComp">${comps.map((c) => `<option value="${c.id}" ${sel && c.id === sel.id ? 'selected' : ''}>${esc(c.name)} ${esc(c.season)}</option>`).join('')}</select>` : ''}</div>
    <div class="grid g3">${tbl('Artilharia', rowsG, 'goals', 'Gols')}${tbl('Assistências', rowsA, 'assists', 'Assist.')}${tbl('Mais jogos', rowsJ, 'apps', 'Jogos')}</div>`;
}
act('statScope', (el) => { UI.statScope = el.dataset.k; render(); });
act('statComp', (el) => { UI.statComp = +el.value; render(); });

// ------------------------------------------------------------------ national call-ups
function viewCallup() {
  const t = S.teams[S.user.team];
  const n = S.nations[t.code];
  const sq = new Set(n.sq || []);
  const pool = Object.values(S.players).filter((p) => p.nat === t.code && p.yth !== -1).sort((a, b) => POSITIONS.indexOf(a.p) - POSITIONS.indexOf(b.p) || b.o - a.o);
  return `<div class="row wrap" style="margin-bottom:10px"><span class="chip">${sq.size}/26 convocados</span><span class="muted" style="font-size:13px">Jogadores de ${esc(natName(t.code))} em qualquer clube do mundo.</span><span class="grow"></span><button class="btn sm" data-a="autoCall">Convocação automática</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Nome</th><th>Pos</th><th class="n">Idade</th><th class="c">OVR</th><th>Clube</th><th>Condição</th></tr></thead><tbody>
    ${pool.slice(0, 120).map((p) => `<tr class="${sq.has(p.id) ? 'me' : ''}"><td><input type="checkbox" ${sq.has(p.id) ? 'checked' : ''} data-a="toggleCall" data-id="${p.id}" aria-label="Convocar ${esc(p.n)}"></td>
      <td><span data-a="openPlayer" data-id="${p.id}" style="cursor:pointer">${esc(p.n)}</span>${statusFlags(p)}</td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td class="c nw">${ovrBadge(p.o)}${formTag(p)}</td><td>${p.t ? esc(teamName(p.t)) : 'Clube local'}</td><td>${fitBar(p)}</td></tr>`).join('')}
    </tbody></table></div>`;
}
act('toggleCall', (el) => {
  const t = S.teams[S.user.team];
  const n = S.nations[t.code];
  const id = +el.dataset.id;
  n.sq = n.sq || [];
  if (el.checked) { if (n.sq.length >= 26) { el.checked = false; toast('Máximo de 26 convocados.', true); return; } n.sq.push(id); }
  else { n.sq = n.sq.filter((x) => x !== id); t.xi = t.xi.map((x) => (x === id ? 0 : x)); t.bench = (t.bench || []).filter((x) => x !== id); }
  render();
});
act('autoCall', () => { const t = S.teams[S.user.team]; autoCallUp(t.code, true); render(); toast('Convocação atualizada.'); });

// ready-made tactics: formation + mentality + style (+ the lineup), switched on in one tap before or during a match
function tacticsPanel(t) {
  const list = tacticPresets();
  return `<details class="panel" style="padding:10px 14px" ${list.length || UI.tacOpen ? 'open' : ''}><summary style="cursor:pointer;font-weight:700">🎯 Táticas prontas <span class="muted" style="font-weight:400">(${list.length}/8)</span></summary>
    <div class="col" style="gap:6px;margin-top:10px">${list.length ? list.map((q) => `<div class="row wrap" style="gap:8px;padding:6px 0;border-bottom:1px solid var(--line)"><b>${esc(q.name)}</b><span class="muted grow" style="font-size:13px">${esc(q.form)} · ${esc(mentLabel(q.ment))} · ${esc(STYLES[q.sty || 'bal'].n)}</span>
      <button class="btn xs primary" data-a="tpUse" data-id="${q.id}">Ativar</button><button class="btn xs" data-a="tpUpd" data-id="${q.id}" title="Grava a formação, mentalidade, estilo e escalação atuais nesta tática">Atualizar</button><button class="btn xs" data-a="tpDel" data-id="${q.id}">Excluir</button></div>`).join('') : '<div class="muted" style="font-size:13px">Monte a escalação, a formação, a mentalidade e o estilo e salve aqui. Na hora do jogo (inclusive no 2D), é só ativar.</div>'}</div>
    <div class="row wrap" style="gap:8px;margin-top:10px"><input id="tp-name" class="input" style="max-width:220px" maxlength="24" placeholder="Nome (ex.: Contra-ataque 4-4-2)"><button class="btn sm" data-a="tpSave">Salvar tática atual</button></div></details>`;
}
act('setStyle', (el) => { S.teams[S.user.team].sty = el.value; render(); });
act('tpSave', () => {
  const r = saveTacticPreset(($('#tp-name') || {}).value);
  UI.tacOpen = true; if (!r.ok) toast(r.msg, true); else toast('Tática salva.'); render();
});
act('tpUse', (el) => { const r = applyTacticPreset(+el.dataset.id); UI.tacOpen = true; if (r) toast(`"${r.name}" ativada${r.lineupKept ? '' : ' (escalação refeita: faltava alguém)'}.`); render(); });
act('tpUpd', (el) => { UI.tacOpen = true; if (updateTacticPreset(+el.dataset.id)) toast('Tática atualizada com a configuração atual.'); render(); });
act('tpDel', (el) => { UI.tacOpen = true; deleteTacticPreset(+el.dataset.id); render(); });
