/* ===================== simulate to a date (FIFA-style "simular até") ===================== */
// a day picked in the calendar; the bar under the calendar offers the simulation
function simPickBar() {
  if (S.coach.unemployed) return '';
  const d = UI.calPick;
  if (!d || d <= S.date) return '<div class="sim-bar muted">Toque em um dia futuro do calendário para simular até ele, com os jogos do seu time.</div>';
  const n = teamMatches(S.user.team).filter((m) => !m.done && m.d <= d).length;
  return `<div class="sim-bar"><span class="grow"><b>Simular até ${fmtDate(d, 'wd')}</b><span class="muted"> · ${d - S.date} ${d - S.date === 1 ? 'dia' : 'dias'} · ${n ? `${n} ${n === 1 ? 'jogo' : 'jogos'} do seu time` : 'sem jogos do seu time'}</span></span>
    <button class="btn sm" data-a="calPickClear">Cancelar</button><button class="btn primary sm" data-a="simToOpen" data-d="${d}">Simular até esta data</button></div>`;
}
act('calDay', (el) => { const d = +el.dataset.d; UI.calPick = UI.calPick === d ? null : d; render(); });
act('calPickClear', () => { UI.calPick = null; render(); });
act('simToOpen', (el) => openSimTo(+el.dataset.d));
act('simToCal', () => { closeAllModals(); UI.screen = 'career'; UI.tab = 'office'; UI.sub.office = 'calendar'; UI.calMonth = null; render(); window.scrollTo(0, 0); });
function openSimTo(target) {
  if (UI.busy || !(target > S.date)) return;
  UI.simOpt = UI.simOpt || { user: true, stop: true, inj: false };
  openModal(() => {
    const o = UI.simOpt;
    const ms = teamMatches(S.user.team).filter((m) => !m.done && m.d <= target);
    const list = ms.slice(0, 8).map((m) => `<div class="row" style="gap:8px;font-size:13px;padding:3px 0"><span class="dim" style="width:84px">${fmtDate(m.d, 'wd')}</span>${compBadge(S.comps[m.c], 16)}<span class="grow">${esc(teamName(m.h))} x ${esc(teamName(m.a))}</span></div>`).join('');
    const chk = (k, label, sub) => `<label class="sim-opt"><input type="checkbox" data-a="simOpt" data-k="${k}" ${o[k] ? 'checked' : ''}><span><b>${label}</b><br><span class="muted" style="font-size:12px">${sub}</span></span></label>`;
    return modalShell(`Simular até ${fmtDate(target, 'wd')}`, `
      <p class="muted" style="margin-top:0">Como no FIFA: o jogo avança dia a dia até a data escolhida, com todos os campeonatos, o mercado e as notícias.</p>
      ${ms.length ? `<div class="muted up" style="font-size:11px;margin-bottom:4px">${ms.length} ${ms.length === 1 ? 'jogo' : 'jogos'} do seu time no período</div>${list}${ms.length > 8 ? `<div class="muted" style="font-size:12px">e mais ${ms.length - 8}…</div>` : ''}` : '<div class="muted">Seu time não joga no período.</div>'}
      <div class="col" style="gap:8px;margin-top:14px">
        ${chk('user', 'Simular os jogos do meu time', 'Com a escalação salva (lesionados e suspensos são trocados automaticamente). Desmarcado, para no próximo jogo.')}
        ${chk('stop', 'Parar em propostas e decisões', 'Proposta por jogador, proposta de emprego ou pedido que espera a sua resposta.')}
        ${chk('inj', 'Parar se um titular se lesionar', 'Para você ajustar a escalação.')}
      </div>`, `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="simToGo" data-d="${target}">Simular</button>`);
  }, { size: 'narrow' });
}
act('simOpt', (el) => { UI.simOpt[el.dataset.k] = el.checked; });
act('simToGo', (el) => { const d = +el.dataset.d; closeAllModals(); simToDate(d, Object.assign({}, UI.simOpt)); });

function decisionsCount() {
  return S.tr.offers.filter((o) => o.status === 'open').length + S.inbox.filter((m) => m.act && !m.read).length;
}
function simOverlay(target, start, res, note) {
  let el = document.getElementById('simov');
  if (!el) {
    el = document.createElement('div');
    el.id = 'simov';
    el.className = 'simov';
    document.body.appendChild(el);
  }
  const pct = clamp(Math.round(100 * (S.date - start) / Math.max(1, target - start)), 0, 100);
  const uid = S.user.team;
  const rec = simRecord(res);
  el.innerHTML = `<div class="box"><div class="row" style="gap:10px"><div class="spin"></div><div class="grow"><b>Simulando…</b><div class="muted" style="font-size:13px">${fmtDate(S.date, 'wd')} → ${fmtDate(target, 'wd')}</div></div><b class="tnum">${pct}%</b></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    ${res.length ? `<div class="muted" style="font-size:12px;margin:10px 0 4px">${esc(teamShort(uid))}: ${rec.w}V ${rec.d}E ${rec.l}D</div><div class="col" style="gap:2px">${res.slice(-4).map((id) => simLine(S.matches[id])).join('')}</div>` : ''}
    ${note ? `<div class="muted" style="font-size:12px;margin-top:8px">${esc(note)}</div>` : ''}
    <div class="row" style="margin-top:12px"><span class="grow"></span><button class="btn sm" id="simstop">Parar</button></div></div>`;
  el.querySelector('#simstop').onclick = () => { UI.simStop = true; };
}
function simLine(m) {
  if (!m) return '';
  const uid = S.user.team;
  const res = resultLetter(m, uid);
  const opp = m.h === uid ? m.a : m.h;
  return `<div class="row" style="gap:6px;font-size:13px"><span class="res-dot ${res}">${res}</span>${crest(opp, 16)}<span class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.h === uid ? '' : '@ '}${esc(teamName(opp))}</span><b class="tnum">${m.h === uid ? m.hg : m.ag}-${m.h === uid ? m.ag : m.hg}${m.pen ? ` <span class="dim" style="font-size:11px">(${m.h === uid ? m.pen[0] : m.pen[1]}-${m.h === uid ? m.pen[1] : m.pen[0]} pên.)</span>` : ''}</b></div>`;
}
function simRecord(res) {
  const uid = S.user.team;
  const r = { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
  for (const id of res) {
    const m = S.matches[id];
    if (!m) continue;
    const L = resultLetter(m, uid);
    if (L === 'V') r.w++; else if (L === 'E') r.d++; else r.l++;
    r.gf += m.h === uid ? m.hg : m.ag; r.ga += m.h === uid ? m.ag : m.hg;
  }
  return r;
}
function starterInjured(before) {
  const t = S.teams[S.user.team];
  return t && (t.xi || []).some((pid) => { const p = S.players[pid]; return p && isInjured(p) && !before.has(pid); });
}
async function simToDate(target, o) {
  if (UI.busy) return;
  UI.busy = true; UI.simStop = false; UI.calPick = null;
  const start = S.date;
  const res = [];
  let why = '';
  const dec0 = decisionsCount();
  const inj0 = new Set(teamPlayersFor(S.user.team).filter((p) => isInjured(p)).map((p) => p.id));
  const team0 = S.user.team;
  simOverlay(target, start, res);
  try {
    let guard = 0;
    while (S.date < target && guard++ < 1000) {
      if (UI.simStop) { why = 'Simulação interrompida.'; break; }
      if (S.pendingEnd) { why = 'A temporada terminou.'; break; }
      if (S.celebrate && S.celebrate.length) { why = 'Título conquistado!'; break; }
      if (S.coach.unemployed || S.user.team !== team0) { why = S.coach.unemployed ? 'Você não está mais no cargo.' : 'Você mudou de clube.'; break; }
      const um = userMatchToday();
      if (um) {
        if (!o.user) { why = 'Dia de jogo do seu time.'; break; }
        const st = playWholeMatch(um, { user: S.user.team });
        applyMatchResult(um, st);
        res.push(um.id);
        simOverlay(target, start, res);
        await new Promise((r2) => setTimeout(r2, 0));
        continue;
      }
      advanceDay();
      if (o.stop && decisionsCount() > dec0) {
        const msg = S.inbox.find((m) => m.act && !m.read && m.d >= start);
        why = msg ? `Decisão pendente: ${msg.subj}.` : 'Chegou uma proposta ou decisão para você.';
        break;
      }
      if (o.inj && starterInjured(inj0)) { why = 'Um titular se lesionou.'; break; }
      if ((S.date - start) % 2 === 0) { simOverlay(target, start, res); await new Promise((r2) => setTimeout(r2, 0)); }
    }
  } catch (e) { console.error(e); why = 'Erro na simulação: ' + e.message; }
  const ov = document.getElementById('simov');
  if (ov) ov.remove();
  UI.busy = false;
  lastAutosave = S.date;
  saveGame(S.id).then(async () => { SAVES = await listSaves(); });
  render();
  const rec = simRecord(res);
  const reached = S.date >= target;
  openModal(modalShell(reached ? `Simulação concluída · ${fmtDate(S.date, 'wd')}` : `Simulação parada em ${fmtDate(S.date, 'wd')}`, `
    ${why ? `<div class="panel" style="background:var(--panel2);margin-bottom:12px">${esc(why)}</div>` : ''}
    <div class="grid g3" style="margin-bottom:12px"><div class="stat-tile"><div class="k">Jogos</div><div class="v">${res.length}</div></div><div class="stat-tile"><div class="k">V · E · D</div><div class="v">${rec.w} · ${rec.d} · ${rec.l}</div></div><div class="stat-tile"><div class="k">Gols</div><div class="v">${rec.gf} : ${rec.ga}</div></div></div>
    ${res.length ? `<div class="col" style="gap:4px">${res.map((id) => { const m = S.matches[id]; return `<div class="row" style="gap:8px"><span class="dim" style="width:74px;font-size:12px">${fmtDate(m.d, 'short')}</span>${compBadge(S.comps[m.c], 16)}<span class="grow">${simLine(m)}</span></div>`; }).join('')}</div>` : '<div class="muted">Seu time não jogou no período.</div>'}`,
    `${decisionsCount() > dec0 || unreadCount() ? '<button class="btn" data-a="simGoInbox">Caixa de entrada</button>' : ''}<button class="btn primary" data-a="closeModal">Continuar</button>`), { size: 'narrow' });
}
act('simGoInbox', () => { closeAllModals(); UI.screen = 'career'; UI.tab = 'inbox'; render(); });
