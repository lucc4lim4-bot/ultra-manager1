/* ===================== torcida: aba do escritório + respostas das mensagens ===================== */
function fanBar(v, col) { return `<div style="height:12px;border-radius:7px;background:var(--panel2);overflow:hidden"><div style="height:100%;width:${Math.round(v)}%;background:${col}"></div></div>`; }
function viewFans() {
  if (!fanAvailable()) return '<div class="panel empty">A torcida só existe no modo de clubes com você como treinador.</div>';
  const f = fanInit(), t = S.teams[f.team], orgs = fanOrgsOf(f.team);
  const col = (v) => (v >= 62 ? 'var(--accent-hi)' : v >= 40 ? '#e0b43c' : '#d8503f');
  const rec = f.recent.length ? f.recent.map((x) => `<span class="chip" style="background:${x === 'V' ? '#1c7a3e' : x === 'D' ? '#a8322a' : '#6b6f78'};color:#fff">${x}</span>`).join(' ') : '<span class="muted">sem jogos ainda</span>';
  const pend = S.inbox.filter((m) => m.act && m.act.kind === 'fan' && !m.act.done).length;
  return `<div class="grid g2" style="margin-bottom:16px">
    <div class="panel"><h3>Torcida ${esc(tA(t.id, 'do'))} <span class="sub">${esc(fanLabel(f.mood))}</span></h3>${fanBar(f.mood, col(f.mood))}
      <div class="muted" style="font-size:13px;margin-top:8px">Humor ${Math.round(f.mood)}/100. Sobe com vitórias e boas respostas; abaixo de 28 a diretoria e o elenco sentem a pressão, acima de 75 todo mundo joga mais solto.</div>
      <div style="margin-top:10px">Últimos jogos: ${rec}</div></div>
    <div class="panel"><h3>Organizada${orgs.length > 1 ? 's' : ''} <span class="sub">${t.c === 'BRA' ? 'só no Brasil' : 'não há torcidas organizadas fora do Brasil'}</span></h3>
      ${t.c === 'BRA' ? `<div class="col" style="gap:8px">${orgs.map((o, i) => `<div class="row wrap" style="gap:10px"><span style="font-size:22px">🚩</span><b>${esc(o)}</b>${i === 0 ? '<span class="chip">principal</span>' : ''}</div>`).join('')}</div>
      <div style="margin-top:10px">${fanBar(f.org, col(f.org))}</div><div class="muted" style="font-size:13px;margin-top:8px">Humor ${Math.round(f.org)}/100 (${esc(fanLabel(f.org))}). A organizada vai aos jogos, aparece em campo no modo 2D e cobra mais forte quando o time vai mal.</div>`
      : '<p class="muted">As torcidas do seu clube são comuns: reclamam e vão ao estádio, mas sem organizada.</p>'}</div></div>
    <div class="panel"><h3>Histórico <span class="sub">${pend ? pend + ' pendente' + (pend > 1 ? 's' : '') + ' na caixa de entrada' : 'tudo respondido'}</span></h3>
      ${f.hist.length ? f.hist.slice(0, 10).map((h) => `<div class="row wrap" style="gap:10px;padding:6px 0;border-top:1px solid var(--line)"><span class="muted" style="width:70px">${fmtDate(h.d, 'short')}</span><div class="grow"><b>${esc(h.t)}</b><div class="muted" style="font-size:13px">${esc(h.r)}</div></div></div>`).join('') : '<div class="muted">Nada ainda. Eventos e reclamações chegam na caixa de entrada.</div>'}</div>`;
}
// inbox: choice buttons of a fan message
function fanMsgActions(m) {
  const a = m.act;
  if (!a || a.kind !== 'fan') return '';
  if (a.done) return `<div class="chip" style="margin-top:12px">Respondido</div><p class="muted" style="margin-top:8px">${esc(a.res || '')}</p>`;
  return `<div class="col" style="gap:8px;margin-top:14px;align-items:flex-start">${a.opts.map((o, i) => `<button class="btn sm ${i === 0 ? 'primary' : ''}" data-a="fanAns" data-id="${m.id}" data-i="${i}">${esc(o.l)}</button>`).join('')}</div>`;
}
act('fanAns', (el) => { const r = fanAnswer(+el.dataset.id, +el.dataset.i); if (r) toast(r.length > 120 ? r.slice(0, 117) + '…' : r); render(); });
