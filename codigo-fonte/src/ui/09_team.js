/* ===================== team modal (other teams) ===================== */
act('openTeam', (el) => { const id = +el.dataset.id; if (S.teams[id]) openTeamModal(id); });
function openTeamModal(tid) {
  UI.teamTab = 'xi';
  openModal(() => {
    const t = S.teams[tid];
    const players = t.isNat ? nationSquad(t.code) : squadOf(tid);
    const r = t.isNat ? nationRating(t.code) : teamRating(tid);
    const tab = UI.teamTab;
    let body = '';
    if (tab === 'xi') {
      const form = t.form || '4-3-3';
      const lu = isUserTeam(tid) && t.xi ? { xi: t.xi } : autoLineup(players, form);
      const slots = FORMATIONS[form];
      body = `<div class="pitch" style="max-width:420px">${pitchLines()}${slots.map((s, i) => {
        const p = S.players[lu.xi[i]];
        return `<div style="position:absolute;left:${s[1]}%;top:${100 - s[2]}%"><div class="pslot" style="position:relative;transform:translate(-50%,-50%)" ${p ? `data-a="openPlayer" data-id="${p.id}"` : ''}><div class="card"><div class="o">${p ? p.o : '-'}</div><div class="p">${POS_PT[s[0]]}</div></div><div class="nm">${p ? esc(p.s || p.n) : ''}</div></div></div>`;
      }).join('')}</div><p class="muted center" style="font-size:13px">${form} · provável escalação</p>`;
    } else if (tab === 'squad') {
      const list = players.slice().sort((a, b) => POSITIONS.indexOf(a.p) - POSITIONS.indexOf(b.p) || b.o - a.o);
      body = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Nome</th><th>Pos</th><th class="n">Idade</th><th class="c">OVR</th><th class="n">Valor</th></tr></thead><tbody>
        ${list.map((p) => `<tr class="click" data-a="openPlayer" data-id="${p.id}"><td>${p.num || ''}</td><td>${esc(p.n)}${statusFlags(p)}</td><td>${posBadge(p.p)}</td><td class="n">${p.age}</td><td class="c nw">${ovrBadge(p.o)}${formTag(p)}</td><td class="n">${money(playerValue(p))}</td></tr>`).join('')}</tbody></table></div>`;
    } else {
      const ms = teamMatches(tid);
      body = ms.length ? `<div class="col" style="gap:2px">${ms.map((m) => `<div class="row" style="gap:6px"><span class="dim" style="font-size:12px;width:120px">${compBadge(S.comps[m.c], 16)} ${fmtDate(m.d, 'wd')}</span><div class="grow">${matchLine(m)}</div></div>`).join('')}</div>` : '<div class="empty">Sem jogos marcados.</div>';
    }
    const titles = S.titles[tid] || [];
    return modalShell(esc(t.n), `
      <div class="row wrap" style="gap:16px;margin-bottom:14px"><button class="crest-btn" data-a="crestEdit" data-id="${t.id}" title="Trocar o escudo" aria-label="Trocar o escudo ${esc(tA(t, 'do'))}">${crest(t, 76)}<span class="crest-edit">🖼</span></button><div class="grow">
        <div class="row wrap">${starStr(r)}<span class="muted">força ${r.toFixed(1)}</span>${!t.isNat ? `<span class="muted">· ${players.length} jogadores</span>` : ''}</div>
        ${stadiumName(t) ? `<div class="muted" style="font-size:14px">${esc(stadiumName(t))}</div>` : ''}
        ${!t.isNat ? `<div class="muted" style="font-size:14px">Orçamento ${money(t.budget)}</div>` : ''}
        <div class="row" style="margin-top:6px;gap:6px">${formRow(tid)}</div>
        ${titles.length ? `<div class="muted" style="font-size:13px;margin-top:4px">🏆 ${titles.length} título(s) nesta carreira</div>` : ''}</div></div>
      <div class="subtabs">${[['xi', 'Escalação'], ['squad', 'Elenco'], ['cal', 'Calendário']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="teamTab" data-k="${k}">${l}</button>`).join('')}</div>${body}`);
  }, { size: 'wide' });
}
act('teamTab', (el) => { UI.teamTab = el.dataset.k; refreshModal(); });

// ---------- custom crest (image chosen by the player, stored only on this device)
function crestTarget(el) {
  if (el.dataset.id) return S && S.teams[+el.dataset.id];
  const r = STORE.find((x) => x[0] === el.dataset.k);
  return r ? { id: 0, key: r[0], n: r[1], s: r[2], c1: r[4], c2: r[5] } : null;
}
act('crestEdit', (el) => {
  const t = crestTarget(el);
  if (!t) return;
  const ref = el.dataset.id ? `data-id="${el.dataset.id}"` : `data-k="${esc(el.dataset.k)}"`;
  openModal(() => {
    const has = !!customCrestOf(t);
    return modalShell(`Escudo · ${esc(t.n)}`, `
      <div class="row wrap" style="gap:18px;align-items:center">
        <div class="crest-preview">${crest(t, 112)}</div>
        <div class="col grow" style="min-width:200px">
          <p class="muted" style="margin:0">${has ? 'Este time está usando uma imagem sua.' : 'Escudo gerado com as cores do clube.'} Você pode usar uma imagem sua (PNG, JPG, WebP ou SVG). Ela fica salva só neste aparelho e aparece em todo o jogo.</p>
          <label class="btn primary" style="align-self:flex-start;cursor:pointer">Escolher imagem<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" class="hide" data-a="crestFile" ${ref}></label>
          ${has ? `<button class="btn" data-a="crestRemove" ${ref} style="align-self:flex-start">Voltar ao escudo gerado</button>` : ''}
        </div></div>`, '<button class="btn" data-a="closeModal">Fechar</button>');
  }, { size: 'narrow' });
});
act('crestFile', async (el) => {
  const t = crestTarget(el);
  const f = el.files && el.files[0];
  if (!t || !f) return;
  try {
    setCustomCrest(t.key, await imageFileToCrest(f));
    await persistCustomCrests();
    render(); refreshModal();
    toast(`Escudo ${tA(t, 'do')} atualizado.`);
  } catch (e) { toast(e.message || 'Não foi possível usar essa imagem.', true); }
});
act('crestRemove', async (el) => {
  const t = crestTarget(el);
  if (!t) return;
  setCustomCrest(t.key, null);
  await persistCustomCrests();
  render(); refreshModal();
  toast(`${t.n} voltou ao escudo gerado.`);
});
