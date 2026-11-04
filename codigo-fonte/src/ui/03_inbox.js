/* ===================== inbox (notificações) ===================== */
const MSG_IC = { offer: '⇄', player: '🗣', board: '🏛', scout: '🔭', contract: '✍', loan: '↩', injury: '✚', job: '💼', info: 'ℹ', fan: '📣' };
function viewInbox() {
  const list = S.inbox;
  const sel = list.find((m) => m.id === UI.msgSel) || list[0];
  if (sel && !sel.read) { sel.read = true; }
  const items = list.map((m) => `<button class="msg-item ${m.read ? '' : 'unread'} ${sel && sel.id === m.id ? 'on' : ''}" data-a="selMsg" data-id="${m.id}">
      <span class="ic">${MSG_IC[m.type] || '✉'}</span><span class="grow" style="min-width:0"><span class="s" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.subj)}</span>
      <span class="muted" style="font-size:12px">${esc(m.from)} · ${fmtDate(m.d, 'short')}</span></span>${m.read ? '' : '<span class="dot" style="background:var(--accent-hi)"></span>'}</button>`).join('');
  return `<div class="row" style="margin-bottom:12px"><h2 style="font-size:34px;font-weight:800">Notificações</h2><span class="grow"></span>
      ${sel ? `<button class="btn sm" data-a="delMsg" data-id="${sel.id}">Apagar mensagem</button>` : ''}
      <button class="btn sm danger" data-a="askDelAll" ${list.length ? '' : 'disabled'}>Apagar tudo</button></div>
    <div class="inbox"><div class="panel" style="padding:8px;max-height:72vh;overflow:auto">${items || '<div class="empty">Caixa de entrada vazia.</div>'}</div>
      <div class="panel">${sel ? viewMessage(sel) : '<div class="empty">Selecione uma mensagem.</div>'}</div></div>`;
}
function viewMessage(m) {
  let actions = '';
  if (m.type === 'offer' && m.act && m.act.offer) {
    const o = S.tr.offers.find((x) => x.id === m.act.offer);
    if (o && o.status === 'open') {
      const p = S.players[o.pid];
      actions = `<div class="panel" style="background:var(--panel2);margin-top:14px">
        <div class="row wrap">${p ? `${ovrBadge(p.o)} ${posBadge(p.p)} <b>${esc(p.n)}</b> <span class="muted">${p.age} anos · valor ${money(playerValue(p))}</span>` : ''}</div>
        <div class="row wrap" style="margin-top:10px"><span>Proposta atual: <b>${o.loan ? 'Empréstimo' : o.swap && S.players[o.swap] ? `${esc(S.players[o.swap].n)} (${S.players[o.swap].o}) + ${money(o.cash || 0)}` : money(o.fee)}</b></span>${o.swap && S.players[o.swap] ? `<span class="muted">valor total ${money(o.fee)}</span>` : ''}</div>
        <div class="row wrap" style="margin-top:12px">
          <button class="btn primary sm" data-a="offerAct" data-o="${o.id}" data-x="accept">Aceitar</button>
          <button class="btn sm" data-a="offerAct" data-o="${o.id}" data-x="reject">Recusar</button>
          ${o.loan ? '' : `<input class="input" style="max-width:160px" id="ctr-${o.id}" type="number" min="0" step="100000" value="${Math.round(o.fee * 1.2)}"><button class="btn sm" data-a="offerAct" data-o="${o.id}" data-x="counter">Contraproposta</button>`}
        </div><div class="muted" style="font-size:12px;margin-top:6px">${isWindowOpen() ? '' : 'A janela está fechada: a venda só pode ser concluída quando ela abrir.'}</div></div>`;
    } else if (o) actions = `<div class="chip" style="margin-top:12px">${o.status === 'done' ? 'Negócio concluído' : 'Proposta encerrada'}</div>`;
  } else if (m.type === 'player' && m.act && !m.act.done) {
    const k = m.act.kind;
    actions = `<div class="row wrap" style="margin-top:14px">
      ${k === 'minutes' ? '<button class="btn sm primary" data-a="answerP" data-x="promise">Prometer mais jogos</button>' : '<button class="btn sm primary" data-a="answerP" data-x="convince">Convencer a ficar</button>'}
      <button class="btn sm" data-a="answerP" data-x="list">Colocar na lista de transferências</button>
      <button class="btn sm" data-a="answerP" data-x="ignore">Ignorar</button></div>`;
  } else if (m.type === 'job' && m.act && m.act.job) {
    actions = `<div class="row wrap" style="margin-top:14px"><button class="btn sm primary" data-a="applyJob" data-id="${m.act.job}">Conversar com o clube</button></div>`;
  } else if (m.type === 'fan' && m.act) {
    actions = fanMsgActions(m);
  } else if (m.act && m.act.done) actions = `<div class="chip" style="margin-top:12px">Respondido</div>`;
  return `<div class="muted" style="font-size:13px">${esc(m.from)} · ${fmtDate(m.d, 'long')}</div>
    <h2 style="font-size:28px;font-weight:800;margin:6px 0 10px">${esc(m.subj)}</h2>
    <p style="font-size:16px;max-width:65ch">${esc(m.body)}</p>${actions}`;
}
act('selMsg', (el) => { UI.msgSel = +el.dataset.id; render(); });
act('delMsg', (el) => { S.inbox = S.inbox.filter((m) => m.id !== +el.dataset.id); UI.msgSel = null; render(); toast('Mensagem apagada.'); });
act('askDelAll', () => {
  openModal(modalShell('Apagar todas as mensagens?', '<p>Propostas abertas continuam valendo na aba Transferências.</p>', '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="delAll">Apagar tudo</button>'), { size: 'narrow' });
});
act('delAll', () => { S.inbox = []; closeModal(); render(); toast('Caixa de entrada limpa.'); });
act('offerAct', (el) => {
  const id = +el.dataset.o, x = el.dataset.x;
  const counter = x === 'counter' ? +($('#ctr-' + id) || {}).value : 0;
  const r = respondOffer(id, x, counter);
  toast(r.msg);
  render();
  if (UI.tab === 'transfers') render();
});
act('answerP', (el) => {
  const m = S.inbox.find((x) => x.id === (UI.msgSel || (S.inbox[0] && S.inbox[0].id)));
  if (!m) return;
  toast(answerPlayer(m.id, el.dataset.x));
  render();
});
