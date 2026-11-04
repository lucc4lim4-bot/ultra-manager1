/* ===================== start screen, wizard, store ===================== */
let STORE = [];
let SAVES = [];
const ERA_INFO = {
  2016: { t: '2016', d: 'Temporada 2016/17 com os elencos da época (base FIFA 17). Leicester campeão inglês, Neymar no Barça, Gabriel Jesus no Palmeiras.' },
  2021: { t: '2021', d: 'Temporada 2021/22 com os elencos da época (base FIFA 22). Messi chegando ao PSG, Hulk no Galo, Eurocopa e Copa América no meio do ano.' },
  2026: { t: '2026', d: 'Temporada 2026/27 com elencos atualizados (base FC 27, out/2026). Copa do Mundo 2026 para quem escolher seleção.' },
};

async function loadEra(era) {
  if (DATA && DATA.era === era) return DATA;
  const r = await fetch(`data/era${era}.json`);
  if (!r.ok) throw new Error('Não foi possível carregar os dados de ' + era);
  DATA = await r.json();
  return DATA;
}
async function loadStore() {
  if (STORE.length) return STORE;
  try { const r = await fetch('data/store.json'); STORE = await r.json(); } catch (e) { STORE = []; }
  return STORE;
}

function viewLoading() {
  const p = UI.loadP || 0;
  return `<div class="boot"><div class="boot-logo">ULTRA<span>MANAGER</span></div>
    <div class="boot-sub">${esc(UI.loadMsg || 'Carregando…')}</div>
    <div style="width:min(360px,80vw);height:6px;border-radius:3px;background:var(--panel3);margin:16px auto 0;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(p * 100)}%;background:var(--accent-hi)"></i></div></div>`;
}
function setLoading(msg, p) {
  UI.loadMsg = msg; UI.loadP = p;
  if (UI.screen !== 'loading') { UI.screen = 'loading'; render(); return; }
  const el = $('.boot-sub'); if (el) el.textContent = msg;
  const bar = $('.boot i'); if (bar) bar.style.width = Math.round((p || 0) * 100) + '%';
}

// ------------------------------------------------------------------ start
function viewStart() {
  const has = SAVES.length > 0;
  return `<div class="start">
    <div class="start-top"><div class="row"><div class="logo-mark">UM</div><span class="disp" style="font-size:20px;font-weight:700">ULTRA MANAGER</span></div>
      <div class="row">${coinPill()}<span class="chip">${WALLET.owned.length} ${WALLET.owned.length === 1 ? 'time' : 'times'}</span></div></div>
    <div class="start-main">
      <div>
        <div class="title-xl">ULTRA<span class="b">MANAGER</span></div>
        <p class="muted" style="max-width:52ch;font-size:17px;margin-top:18px">Modo carreira com calendário real, Ultra Liga de 4 divisões, ligas nacionais, Champions, Libertadores, Copa do Mundo e partidas que você pode jogar no gramado.</p>
        <div class="row wrap" style="margin-top:14px"><span class="chip">Elencos 2016 · 2021 · 2026</span><span class="chip">38 rodadas</span><span class="chip">Seleções</span><span class="chip">Modo zoeira</span></div>
      </div>
      <div class="menu-list">
        <button class="menu-btn primary" data-a="newCareer"><span class="ic">⚽</span><span>Nova carreira<small>Crie seu treinador e escolha a proposta</small></span></button>
        ${has ? `<button class="menu-btn" data-a="openSaves"><span class="ic">▶</span><span>Continuar<small>${SAVES.length} ${SAVES.length === 1 ? 'save salvo' : 'saves salvos'} · último: ${esc(SAVES[0].team)}</small></span></button>` : ''}
        <button class="menu-btn" data-a="openPlayerCareer"><span class="ic">🧑‍🎓</span><span>Carreira de jogador<small>Seja um jovem craque: treine, jogue só com o seu jogador e suba de clube</small></span></button>
        <button class="menu-btn" data-a="openFriendly"><span class="ic">🎮</span><span>Amistoso<small>Partida 2D contra o computador com qualquer time do jogo</small></span></button>
        <button class="menu-btn" data-a="openFriendlyNet"><span class="ic">🌐</span><span>Amistoso online<small>Sala com código: jogue contra um amigo, com intervalo e mentalidade</small></span></button>
        <button class="menu-btn" data-a="openPenCup"><span class="ic">🥅</span><span>Copa de Pênaltis<small>Mata-mata de disputas: você bate e defende, alternando, contra o computador</small></span></button>
        <button class="menu-btn" data-a="openStore"><span class="ic">🛒</span><span>Comprar times<small>${INFINITE_COINS ? 'FutCoins infinitas: escolha qualquer clube' : 'Use FutCoins ganhos em títulos'}</small></span></button>
        <button class="menu-btn" data-a="openCrests"><span class="ic">🛡</span><span>Escudos dos times<small>Troque por imagens suas, uma a uma ou em lote</small></span></button>
        <label class="menu-btn" style="cursor:pointer"><span class="ic">⤓</span><span>Importar save<small>Arquivo .json exportado antes</small></span><input type="file" accept=".umsave,.json,.gz,application/json" data-a="importSave" class="hide"></label>
        <button class="menu-btn" data-a="howTo"><span class="ic">?</span><span>Como jogar<small>Controles da partida e dicas</small></span></button>
      </div>
    </div>
    <div class="center dim" style="padding:14px;font-size:12px">Escudos gerados são ilustrações originais; troque o de qualquer time por uma imagem sua em Escudos dos times, na loja ou na ficha do clube. Dados de jogadores: FC 27/FC 26, FIFA 22 e FIFA 17; elencos brasileiros montados a partir de conhecimento público.</div>
  </div>`;
}
act('newCareer', () => {
  UI.wiz = { step: 0, name: '', age: 38, fav: '', era: 2026, kind: 'club', mode: 'ultra', zoeira: false, noFire: false };
  UI.screen = 'wizard'; render();
});
act('openSaves', () => {
  openModal(() => modalShell('Continuar carreira', SAVES.length ? `<div class="col">${SAVES.map((s) => `
    <div class="row panel" style="padding:12px">
      ${crest({ id: s.teamId, key: s.key || s.short + s.team, n: s.team, s: s.short, c1: s.c1, c2: s.c2 }, 40)}
      <div class="grow"><div style="font-weight:700">${esc(s.team)} · ${esc(s.coach)}</div>
      <div class="muted" style="font-size:13px">${fmtDate(s.date, 'long')} · ${s.mode === 'ultra' ? 'Ultra Liga' : s.mode === 'normal' ? 'Ligas normais' : 'Seleção'} ${s.era}${s.zoeira ? ' · zoeira' : ''} · ${s.rec.w}V ${s.rec.d}E ${s.rec.l}D · ${s.trophies} títulos</div></div>
      <button class="btn sm primary" data-a="loadSave" data-k="${s.key}">Carregar</button>
      <button class="btn sm danger" data-a="askDeleteSave" data-k="${s.key}" aria-label="Apagar">Apagar</button>
    </div>`).join('')}</div>` : '<div class="empty">Nenhum save ainda.</div>'));
});
act('askDeleteSave', (el) => {
  const k = el.dataset.k;
  openModal(modalShell('Apagar save?', '<p>Esta ação não pode ser desfeita.</p>', `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="deleteSave" data-k="${k}">Apagar</button>`), { size: 'narrow' });
});
act('deleteSave', async (el) => {
  await deleteSave(el.dataset.k);
  SAVES = await listSaves();
  closeAllModals();
  render();
  toast('Save apagado.');
});
act('loadSave', async (el) => {
  closeAllModals();
  setLoading('Carregando save…', 0.2);
  try {
    const obj = await loadSaveData(el.dataset.k);
    if (!obj) throw new Error('Save não encontrado.');
    adoptState(obj);
    await loadEra(S.era).catch(() => null);
    importNewClubs(); // careers from before the Sul-Americana and the Mundial de Clubes
    importNewLeagues(); // … and before the Conference League and the new leagues
    UI.screen = 'career'; UI.tab = 'central';
    render();
    toast('Carreira carregada.');
  } catch (e) { UI.screen = 'start'; render(); toast(e.message, true); }
});
act('importSave', async (el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  setLoading('Importando save…', 0.3);
  try {
    const obj = await importSaveFile(f);
    adoptState(obj);
    await loadEra(S.era).catch(() => null);
    importNewClubs();
    importNewLeagues();
    await saveGame(S.id);
    SAVES = await listSaves();
    UI.screen = 'career'; UI.tab = 'central';
    render();
    toast('Save importado.');
  } catch (e) { UI.screen = 'start'; render(); toast('Não foi possível importar: ' + e.message, true); }
});
act('howTo', () => {
  openModal(modalShell('Como jogar', `
    <div class="col">
      <p><b>Avançar</b> passa os dias no calendário real. No dia do jogo aparece <b>Ir para a partida</b>, com escalações, banco, horário e clima.</p>
      <p>Na partida você escolhe: <b>Simular</b> (resultado direto), <b>Minuto a minuto</b> (cronômetro de 1 a 45+ e 46 a 90+, com substituições) ou <b>Jogar</b> no gramado.</p>
      <h3 style="font-size:20px">Controles da partida jogável</h3>
      <p class="help-keys">Teclado: <span class="kbd">WASD</span>/<span class="kbd">setas</span> mover · <span class="kbd">J</span> passe · <span class="kbd">K</span> chute (segure para mais força) · <span class="kbd">L</span> lançamento · <span class="kbd">Shift</span> correr · <span class="kbd">J</span> sem a bola: trocar jogador · <span class="kbd">K</span> sem a bola: carrinho.</p>
      <p class="help-keys">Toque: joystick à esquerda, botões PASSE, CHUTE, LANÇAR e CORRER à direita.</p>
      <h3 style="font-size:20px">FutCoins</h3>
      <p class="muted">${INFINITE_COINS ? 'As FutCoins estão infinitas para todos: compre quantos times quiser na loja e comece a carreira (ou a próxima temporada) em qualquer um deles. Os títulos continuam mostrando quanto renderiam (Ultra Liga 150, Champions 100, Copa do Mundo 125, liga nacional 80, copa nacional 75…).' : 'Cada título rende FutCoins (Ultra Liga 150, Champions 100, Copa do Mundo 125, liga nacional 80, copa nacional 75…). Use para comprar qualquer time e começar nele.'}</p>
    </div>`, '<button class="btn primary" data-a="closeModal">Entendi</button>'));
});

// ------------------------------------------------------------------ store
function storeRows(filter) {
  const q = strip(filter || '');
  return STORE.filter((t) => !q || strip(t[1]).includes(q));
}
act('openStore', async () => {
  await loadStore();
  UI.storeQ = '';
  openModal(() => {
    const rows = storeRows(UI.storeQ).slice(0, 120);
    return modalShell('Comprar times', `
      <div class="row wrap" style="margin-bottom:12px">${coinPill()}<input class="input grow" placeholder="Buscar time…" value="${esc(UI.storeQ)}" data-a="storeSearch" data-live="1" id="store-q"></div>
      <p class="muted" style="margin-top:0">Times comprados aparecem em <b>Meus times</b> na tela de propostas e no fim de cada temporada. Toque no escudo de um time para trocar por uma imagem sua.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Time</th><th>País</th><th class="n">Força</th><th class="n">Preço</th><th></th></tr></thead><tbody>
      ${rows.map((t) => {
        const price = teamPriceByRating(t[6]);
        const owned = WALLET.owned.includes(t[0]);
        return `<tr><td><span class="team-cell"><button class="crest-btn sm" data-a="crestEdit" data-k="${esc(t[0])}" title="Trocar o escudo" aria-label="Trocar o escudo do ${esc(t[1])}">${crest({ id: 0, key: t[0], n: t[1], s: t[2], c1: t[4], c2: t[5] }, 24)}</button><span class="tn">${esc(t[1])}</span></span></td>
          <td class="muted">${esc(t[3] === 'ULT' ? '—' : t[3])}</td><td class="n">${t[6].toFixed(1)}</td>
          <td class="n"><span class="coin-pill" style="padding:2px 8px 2px 4px;font-size:14px"><span class="coin">F</span>${price}</span></td>
          <td class="n">${owned ? '<span class="chip on">Seu</span>' : `<button class="btn xs ${canAfford(price) ? 'gold' : ''}" data-a="buyTeam" data-k="${t[0]}" data-p="${price}" ${canAfford(price) ? '' : 'disabled'}>Comprar</button>`}</td></tr>`;
      }).join('')}</tbody></table></div>`, '<button class="btn" data-a="closeModal">Fechar</button>');
  }, { size: 'wide' });
});
act('storeSearch', (el) => {
  UI.storeQ = el.value;
  const pos = el.selectionStart;
  refreshModal();
  const inp = $('#store-q'); if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); }
});
act('buyTeam', (el) => {
  const err = buyTeam(el.dataset.k, +el.dataset.p);
  if (err) toast(err, true); else toast('Time comprado! Ele estará disponível em "Meus times".');
  refreshModal();
  if (UI.screen === 'start' || UI.screen === 'wizard') { const keep = MODALS.length; render(); }
});

// ------------------------------------------------------------------ wizard
const WIZ_STEPS = ['Treinador', 'Ano', 'Clube ou seleção', 'Modo', 'Opções', 'Propostas'];
function viewWizard() {
  const w = UI.wiz;
  const steps = WIZ_STEPS.map((_, i) => `<span class="${i <= w.step ? 'on' : ''}"></span>`).join('');
  let body = '';
  if (w.step === 0) {
    const favList = STORE.map((t) => `<option value="${esc(t[1])}">`).join('');
    body = `<h1 style="font-size:46px;font-weight:800">Crie seu treinador</h1>
      <p class="muted">Seu nome aparece nas notícias, no histórico e na galeria de títulos.</p>
      <form class="grid g3" data-a="wizNext" style="margin-top:18px">
        <div class="field"><label for="w-name">Nome do treinador</label><input id="w-name" class="input" required maxlength="40" value="${esc(w.name)}" placeholder="Ex.: Renato Moreira"></div>
        <div class="field"><label for="w-fav">Time do coração</label><input id="w-fav" class="input" list="fav-list" value="${esc(w.fav)}" placeholder="Ex.: Corinthians"><datalist id="fav-list">${favList}</datalist></div>
        <div class="field"><label for="w-age">Idade</label><input id="w-age" class="input" type="number" min="25" max="80" value="${w.age}"></div>
        <div style="grid-column:1/-1" class="row"><button class="btn" type="button" data-a="wizBack">Voltar</button><button class="btn primary right" type="submit">Continuar</button></div>
      </form>`;
  } else if (w.step === 1) {
    body = `<h1 style="font-size:46px;font-weight:800">Em que ano você quer começar?</h1><p class="muted">Os elencos, idades e forças correspondem à época escolhida.</p>
      <div class="choice-grid" style="margin-top:16px">${[2016, 2021, 2026].map((y) => `<button class="choice ${w.era === y ? 'on' : ''}" data-a="wizSet" data-k="era" data-v="${y}"><span class="t">${ERA_INFO[y].t}</span><span class="d">${ERA_INFO[y].d}</span></button>`).join('')}</div>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button><button class="btn primary right" data-a="wizNext">Continuar</button></div>`;
  } else if (w.step === 2) {
    body = `<h1 style="font-size:46px;font-weight:800">Clube ou seleção?</h1>
      <div class="choice-grid" style="margin-top:16px">
        <button class="choice ${w.kind === 'club' ? 'on' : ''}" data-a="wizSet" data-k="kind" data-v="club"><span class="t">Clube</span><span class="d">Ultra Liga ou ligas nacionais, copas, Champions, Europa League e Libertadores.</span></button>
        <button class="choice ${w.kind === 'national' ? 'on' : ''}" data-a="wizSet" data-k="kind" data-v="national"><span class="t">Seleção</span><span class="d">${w.era === 2026 ? 'Assuma uma das 48 seleções da Copa de 2026 e dispute o Mundial.' : w.era === 2021 ? 'Comece com a Eurocopa e a Copa América de 2021.' : 'Comece com a Eurocopa e a Copa América de 2016.'} Depois vêm eliminatórias, Euro, Copa América e Copa do Mundo com 48 seleções.</span></button>
      </div>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button><button class="btn primary right" data-a="wizNext">Continuar</button></div>`;
  } else if (w.step === 3) {
    body = `<h1 style="font-size:46px;font-weight:800">Escolha o modo</h1>
      <div class="choice-grid" style="margin-top:16px">
        <button class="choice ${w.mode === 'ultra' ? 'on' : ''}" data-a="wizSet" data-k="mode" data-v="ultra"><span class="t">Ultra Liga</span><span class="d">Superliga mundial com 4 divisões de 20 times, 3 sobem e 3 caem, banco de times e Copa Ultra.</span></button>
        <button class="choice ${w.mode === 'normal' ? 'on' : ''}" data-a="wizSet" data-k="mode" data-v="normal"><span class="t">Ligas normais</span><span class="d">Premier League, LaLiga, Bundesliga, Ligue 1, Serie A, Brasileirão, Argentina, Portugal e Holanda, com segundas divisões, copas e torneios continentais.</span></button>
      </div>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button><button class="btn primary right" data-a="wizNext">Continuar</button></div>`;
  } else if (w.step === 4) {
    body = `<h1 style="font-size:46px;font-weight:800">Opções da carreira</h1>
      <div class="panel" style="margin-top:16px">
        <label class="toggle"><input type="checkbox" data-a="wizToggle" data-k="zoeira" ${w.zoeira ? 'checked' : ''}><span class="sw"></span><span><b>Modo zoeira</b><br><span class="muted" style="font-size:14px">Uma vez por temporada um jogador de cada time vira 99, alienígenas abduzem jogadores durante as partidas, ninguém é rebaixado (a primeira divisão cresce até ~80 times), jogadores nunca se aposentam e o overall continua subindo de 1 a 10 por temporada (passa de 99). Sem academia neste modo.</span></span></label>
      </div>
      <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button><button class="btn primary right" data-a="wizNext">Ver propostas</button></div>`;
  } else {
    body = viewOffers();
  }
  return `<div class="start-top"><div class="row"><div class="logo-mark">UM</div><span class="disp" style="font-size:20px;font-weight:700">NOVA CARREIRA</span></div>${coinPill()}</div>
    <div class="wizard"><div class="steps">${steps}</div><div class="muted up" style="font-size:12px;margin-bottom:6px">Passo ${w.step + 1} de ${WIZ_STEPS.length} · ${WIZ_STEPS[w.step]}</div>${body}</div>`;
}
function viewOffers() {
  const w = UI.wiz;
  if (!w.offers) return '<div class="empty">Preparando propostas…</div>';
  const isNat = w.kind === 'national';
  const owned = WALLET.owned.filter((k) => S && Object.values(S.teams).some((t) => t.key === k && validCareerTeam(t.id)));
  const card = (o) => {
    const t = S.teams[o.team];
    const r = t.isNat ? nationRating(t.code) : teamRating(t.id);
    let where = '';
    if (S.mode === 'ultra') where = o.div === 'bank' ? 'Banco de times (entra na Ultra Liga 3)' : 'Ultra Liga 3';
    else if (S.mode === 'normal') { const lg = S.normal.find((l) => l.id === o.league); where = lg ? lg.name : ''; }
    else where = 'Copa do Mundo';
    return `<button class="offer" data-a="pickOffer" data-id="${t.id}">
      <div class="row">${crest(t, 54)}<div class="grow"><div class="tn">${esc(t.n)}</div><div class="muted" style="font-size:13px;margin-top:4px">${esc(where)}</div></div></div>
      <div class="row">${starStr(r)}<span class="muted" style="font-size:13px">Força ${r.toFixed(1)}</span>${!t.isNat ? `<span class="muted right" style="font-size:13px">Orçamento ${money(t.budget)}</span>` : ''}</div>
      <span class="btn sm primary" style="align-self:flex-start">Aceitar proposta</span></button>`;
  };
  return `<h1 style="font-size:46px;font-weight:800">${isNat ? 'Propostas de seleções' : 'Você recebeu propostas'}</h1>
    <p class="muted">${isNat ? 'Três seleções mais modestas da Copa querem você.' : S.mode === 'ultra' ? 'Três clubes da Ultra Liga 3 (ou do banco de times) querem você.' : 'Um clube de cada liga quer você. Escolha onde começar.'}</p>
    <div class="choice-grid" style="margin-top:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">${w.offers.map(card).join('')}</div>
    <div class="row wrap" style="margin-top:16px">
      <button class="btn ${w.noFire ? 'gold' : ''}" data-a="wizToggleNoFire">${w.noFire ? '✓ ' : ''}Sem demissão</button>
      <span class="muted" style="font-size:13px">${w.noFire ? 'A diretoria nunca vai te demitir nesta carreira.' : 'Ative para jogar sem risco de demissão.'}</span>
      <span class="grow"></span>
      <button class="btn" data-a="openStore">🛒 Comprar times</button>
      <button class="btn" data-a="wizReroll">Outras propostas</button>
    </div>
    ${owned.length ? `<div class="panel" style="margin-top:16px"><h3>Meus times <span class="sub">comprados com FutCoins</span></h3><div class="row wrap">${owned.map((k) => {
      const t = Object.values(S.teams).find((x) => x.key === k);
      return `<button class="btn" data-a="pickOffer" data-id="${t.id}">${crest(t, 22)} ${esc(t.n)}</button>`;
    }).join('')}</div></div>` : (WALLET.owned.length ? '<p class="muted" style="font-size:13px">Seus times comprados não existem neste ano/modo.</p>' : '')}
    ${viewAnyClub()}
    <div class="row" style="margin-top:18px"><button class="btn" data-a="wizBack">Voltar</button></div>`;
}

// ------------------------------------------------------------------ free choice of any club (with search)
const ULTRA_DIV_NAMES = ['Ultra Liga', 'Ultra Liga 2', 'Ultra Liga 3', 'Ultra Liga 4'];
function anyClubEntries() {
  const w = UI.wiz;
  if (w.anyList && w.anyList.world === S) return w.anyList.rows;
  const rows = [];
  if (S.mode === 'ultra') {
    S.ultra.div.forEach((d, i) => d.forEach((id) => rows.push({ id, grp: 'UL' + (i + 1), where: ULTRA_DIV_NAMES[i] })));
    S.ultra.bank.forEach((id) => rows.push({ id, grp: 'BANK', where: 'Banco de times · entra na Ultra Liga 3' }));
  } else if (S.mode === 'normal') {
    for (const lg of S.normal) {
      lg.teams.forEach((id) => rows.push({ id, grp: lg.id, where: lg.name }));
      if (lg.bank.length >= 2) lg.bank.forEach((id) => rows.push({ id, grp: lg.id + '2', where: LEAGUE_NAMES2[lg.id] || `${lg.name} · 2ª divisão` }));
    }
  } else {
    const opening = new Set(nationalOpeningCodes());
    for (const code of (S.wcPool || [])) {
      const n = S.nations[code];
      if (!n || !n.tid) continue;
      rows.push({ id: n.tid, grp: n.conf || 'Outras', where: `${n.conf || ''}${opening.has(code) ? (S.era === 2026 ? ' · na Copa 2026' : ' · na Euro/Copa América') : ''}` });
    }
  }
  for (const r of rows) {
    const t = S.teams[r.id];
    r.q = strip(`${t.n} ${t.s || ''} ${r.where}`);
    r.r = t.isNat ? nationRating(t.code) : teamRating(t.id);
  }
  rows.sort((a, b) => b.r - a.r);
  w.anyList = { world: S, rows };
  return rows;
}
// normal mode: the leagues grouped by region (main leagues, other European leagues, South America)
const ANY_REGIONS = [['main', 'Principais'], ['eu', 'Europa'], ['sa', 'América do Sul']];
function anyRegionOf(g) {
  const lg = S.normal && S.normal.find((l) => l.id === g || l.id + '2' === g);
  if (!lg) return '';
  return MAIN_LEAGUES.has(lg.id) ? 'main' : lg.conf === 'CONMEBOL' ? 'sa' : 'eu';
}
function anyGroupLabel(g) {
  if (g === 'all') return 'Todos';
  const reg = ANY_REGIONS.find(([k]) => k === g);
  if (reg) return reg[1];
  if (S.mode === 'ultra') return g === 'BANK' ? 'Banco' : ULTRA_DIV_NAMES[+g.slice(2) - 1];
  if (S.mode === 'normal') {
    const lg = S.normal.find((l) => l.id === g || l.id + '2' === g);
    if (!lg) return g;
    return g === lg.id ? lg.name : (LEAGUE_NAMES2[lg.id] || `${lg.name} 2`);
  }
  return g;
}
function viewAnyClub() {
  const w = UI.wiz;
  const isNat = S.mode === 'national';
  const rows = anyClubEntries();
  const present = new Set(rows.map((r) => r.grp));
  const order = S.mode === 'ultra' ? ['UL1', 'UL2', 'UL3', 'UL4', 'BANK']
    : S.mode === 'normal' ? S.normal.flatMap((lg) => [lg.id, lg.id + '2'])
      : ['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];
  const groups = order.filter((x) => present.has(x)).concat([...present].filter((x) => !order.includes(x)));
  const g = w.anyG || 'all';
  if (S.mode === 'normal') return viewAnyClubNormal(rows, groups, g);
  return `<div class="panel" style="margin-top:18px">
    <div class="row wrap" style="margin-bottom:10px"><h3 class="grow" style="font-size:24px;margin:0">${isNat ? 'Ou escolha qualquer seleção' : 'Ou escolha qualquer clube'}</h3><span class="muted" style="font-size:13px">${rows.length} ${isNat ? 'seleções' : 'clubes'}</span></div>
    <input id="any-q" class="input" style="width:100%;margin-bottom:10px" type="search" placeholder="${isNat ? 'Buscar seleção pelo nome…' : 'Buscar clube pelo nome…'}" value="${esc(w.anyQ || '')}" data-a="anyQ" data-live="1" autocomplete="off" aria-label="${isNat ? 'Buscar seleção' : 'Buscar clube'}">
    <div class="row wrap" style="gap:6px;margin-bottom:12px">${['all'].concat(groups).map((x) => `<button class="chip ${g === x ? 'on' : ''}" data-a="anyG" data-v="${esc(x)}">${esc(anyGroupLabel(x))}</button>`).join('')}</div>
    <div id="any-list">${anyClubListHtml()}</div>
  </div>`;
}
function viewAnyClubNormal(rows, groups, g) {
  const w = UI.wiz;
  const reg = ANY_REGIONS.some(([k]) => k === g) ? g : g === 'all' ? '' : anyRegionOf(g);
  const leagues = groups.filter((x) => !reg || anyRegionOf(x) === reg);
  return `<div class="panel" style="margin-top:18px">
    <div class="row wrap" style="margin-bottom:10px"><h3 class="grow" style="font-size:24px;margin:0">Ou escolha qualquer clube</h3><span class="muted" style="font-size:13px">${rows.length} clubes em ${S.normal.length} ligas</span></div>
    <input id="any-q" class="input" style="width:100%;margin-bottom:10px" type="search" placeholder="Buscar clube pelo nome…" value="${esc(w.anyQ || '')}" data-a="anyQ" data-live="1" autocomplete="off" aria-label="Buscar clube">
    <div class="row wrap" style="gap:6px;margin-bottom:12px">${['all'].concat(ANY_REGIONS.map(([k]) => k)).map((x) => `<button class="chip ${g === x || (x === reg && g !== reg) ? 'on' : ''}" data-a="anyG" data-v="${x}">${esc(anyGroupLabel(x))}</button>`).join('')}
      <select class="input" style="max-width:300px" data-a="anyLg" aria-label="Liga"><option value="${reg || 'all'}">Todas as ligas${reg ? ' da região' : ''}</option>${leagues.map((x) => `<option value="${esc(x)}" ${g === x ? 'selected' : ''}>${esc(anyGroupLabel(x))}</option>`).join('')}</select></div>
    <div id="any-list">${anyClubListHtml()}</div>
  </div>`;
}
function anyClubListHtml() {
  const w = UI.wiz;
  const q = strip((w.anyQ || '').trim());
  const g = w.anyG || 'all';
  const isReg = ANY_REGIONS.some(([k]) => k === g);
  const rows = anyClubEntries().filter((r) => (g === 'all' || r.grp === g || (isReg && anyRegionOf(r.grp) === g)) && (!q || r.q.includes(q)));
  if (!rows.length) return '<div class="empty">Nenhum resultado para essa busca.</div>';
  const shown = rows.slice(0, 60);
  return `<div class="any-grid">${shown.map((r) => {
    const t = S.teams[r.id];
    return `<button class="any-item" data-a="pickOffer" data-id="${r.id}" title="Começar ${esc(tA(t, 'no'))}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${esc(r.where)}</span></span><span class="sc">${starStr(r.r)}<span class="muted">força ${r.r.toFixed(1)}</span></span></button>`;
  }).join('')}</div>${rows.length > shown.length ? `<p class="muted" style="font-size:13px;margin:10px 0 0">Mostrando ${shown.length} de ${rows.length}. Digite o nome para achar os outros.</p>` : ''}`;
}
act('anyQ', (el) => { UI.wiz.anyQ = el.value; const box = $('#any-list'); if (box) box.innerHTML = anyClubListHtml(); });
act('anyLg', (el) => { UI.wiz.anyG = el.value; render(); });
act('anyG', (el) => {
  UI.wiz.anyG = el.dataset.v;
  if (S.mode === 'normal') { render(); return; }
  const box = $('#any-list');
  if (box) box.innerHTML = anyClubListHtml();
  $$('[data-a="anyG"]').forEach((b) => b.classList.toggle('on', b === el));
});
function validCareerTeam(id) {
  if (!S) return false;
  if (S.mode === 'ultra') return S.ultra.div.flat().concat(S.ultra.bank).includes(id);
  if (S.mode === 'normal') return S.normal.some((l) => l.teams.includes(id) || l.bank.includes(id));
  return false;
}
act('wizSet', (el) => {
  const w = UI.wiz;
  const k = el.dataset.k;
  w[k] = k === 'era' ? +el.dataset.v : el.dataset.v;
  render();
});
act('wizToggle', (el) => { UI.wiz[el.dataset.k] = el.checked; });
act('wizToggleNoFire', () => { UI.wiz.noFire = !UI.wiz.noFire; render(); });
act('wizBack', () => {
  const w = UI.wiz;
  if (w.step === 0) { UI.screen = 'start'; render(); return; }
  w.step--;
  if (w.step === 3 && w.kind === 'national') w.step = 2;
  w.offers = null;
  render();
});
act('wizNext', async () => {
  const w = UI.wiz;
  if (w.step === 0) {
    w.name = ($('#w-name').value || '').trim();
    w.fav = ($('#w-fav').value || '').trim();
    w.age = clamp(+$('#w-age').value || 38, 25, 80);
    if (!w.name) { toast('Digite o nome do treinador.', true); return; }
  }
  w.step++;
  if (w.step === 3 && w.kind === 'national') w.step = 4;
  if (w.step === 5) { await prepareOffers(); return; }
  render();
});
async function prepareOffers() {
  const w = UI.wiz;
  setLoading('Carregando elencos de ' + w.era + '…', 0.2);
  try {
    await loadEra(w.era);
    setLoading('Montando o mundo…', 0.6);
    await new Promise((r) => setTimeout(r, 20));
    const favT = STORE.find((t) => strip(t[1]) === strip(w.fav));
    await createWorld({ era: w.era, mode: w.kind === 'national' ? 'national' : w.mode, coachName: w.name, coachAge: w.age, favKey: favT ? favT[0] : w.fav, zoeira: w.zoeira, noFire: w.noFire });
    w.offers = initialOffers(S.mode);
    w.anyList = null; w.anyQ = ''; w.anyG = 'all';
    UI.screen = 'wizard';
    render();
  } catch (e) {
    console.error(e);
    UI.screen = 'wizard'; w.step = 4; render(); toast(e.message, true);
  }
}
act('wizReroll', () => { UI.wiz.offers = initialOffers(S.mode, { exclude: UI.wiz.offers.map((o) => o.team) }); render(); });
act('pickOffer', async (el) => {
  const id = +el.dataset.id;
  const w = UI.wiz;
  S.noFire = !!w.noFire;
  closeAllModals();
  setLoading('Preparando o calendário…', 0.05);
  await new Promise((r) => setTimeout(r, 30));
  try {
    await startCareerAsync(id, (p) => setLoading('Simulando o restante do mundo até o seu início…', 0.05 + p * 0.9));
    await saveGame(S.id);
    SAVES = await listSaves();
    UI.screen = 'career'; UI.tab = 'central'; UI.sub = {};
    render();
  } catch (e) { console.error(e); UI.screen = 'wizard'; render(); toast('Erro ao iniciar: ' + e.message, true); }
});
