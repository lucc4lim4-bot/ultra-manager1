/* ===================== crest manager: the player's own images for any team (kept only on this device) ===================== */
const CREST_STOP = new Set(['escudo', 'escudos', 'logo', 'logotipo', 'crest', 'badge', 'emblema', 'oficial', 'official', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif',
  'fc', 'cf', 'sc', 'ac', 'afc', 'cd', 'ca', 'ec', 'se', 'club', 'clube', 'de', 'da', 'do', 'del', 'futebol', 'football', 'futbol', 'calcio', 'the', 'team', 'time',
  'hd', 'transparent', 'transparente', 'fundo', 'novo', 'new', 'copy', 'copia']);
function crestNorm(s) {
  return strip(String(s || '')).replace(/\.[a-z0-9]{2,4}$/, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
    .filter((w) => w && !CREST_STOP.has(w) && !/^\d+(x\d+)?$/.test(w)).join(' ');
}
function crestTeams() {
  const al = {}, rt = {};
  for (const r of STORE) { al[r[0]] = r[7] || []; rt[r[0]] = r[6] || 0; }
  if (S && S.teams) {
    return Object.values(S.teams).map((t) => ({ id: t.id, key: t.key, n: t.n, s: t.s, c1: t.c1, c2: t.c2, isNat: t.isNat, ext: t.ext, al: al[t.key] || [], r: rt[t.key] || 0,
      where: t.isNat ? 'Seleção' : (S.nations[t.c] ? S.nations[t.c].n : t.c || '') }));
  }
  return STORE.map((r) => ({ id: 0, key: r[0], n: r[1], s: r[2], c1: r[4], c2: r[5], al: r[7] || [], r: r[6] || 0, where: r[3] === 'ULT' ? '' : r[3] }));
}
const crestRaw = (s) => strip(String(s || '')).replace(/\.[a-z0-9]{2,4}$/, '').replace(/[^a-z0-9]/g, '');
// among several clubs with the same name, prefer a club of the game, then the strongest ("Liverpool" -> Liverpool FC)
function crestBest(list) {
  if (!list || !list.length) return null;
  const core = list.filter((t) => !t.ext);
  return (core.length ? core : list).slice().sort((a, b) => (b.r || 0) - (a.r || 0))[0];
}
function buildCrestIndex(teams) {
  const raw = new Map(), exact = new Map(), codes = new Map(), names = [];
  const add = (m, k, t) => { if (!k) return; const l = m.get(k) || []; if (!l.includes(t)) l.push(t); m.set(k, l); };
  for (const t of teams) {
    add(raw, crestRaw(t.n), t);
    const forms = [t.n].concat(t.al || []).map((x) => crestNorm(x).replace(/ /g, '')).filter(Boolean);
    forms.forEach((f) => add(exact, f, t));
    (t.al || []).forEach((a) => add(exact, crestRaw(a), t));
    add(exact, crestNorm(String(t.key).replace(/^(x:|nat:)/, '')).replace(/ /g, ''), t);
    if (t.s) add(codes, strip(t.s).replace(/[^a-z0-9]/g, ''), t);
    for (const f of new Set(forms)) if (f.length >= 4) names.push([f, t]);
  }
  return { raw, exact, codes, names };
}
function matchCrestFile(fname, idx) {
  const compact = crestNorm(fname).replace(/ /g, '');
  const rawName = crestRaw(fname);
  if (!compact && !rawName) return null;
  const hit = crestBest(idx.raw.get(rawName)) || crestBest(idx.exact.get(compact)) || crestBest(idx.codes.get(compact));
  if (hit) return hit;
  if (!compact) return null;
  // the longest team name contained in the file name wins ("paris" alone must not take "parissaintgermain")
  let best = [], bestLen = 0;
  for (const [n, t] of idx.names) {
    if (!compact.includes(n) || n.length < compact.length * 0.5) continue;
    if (n.length > bestLen) { best = [t]; bestLen = n.length; } else if (n.length === bestLen && !best.includes(t)) best.push(t);
  }
  if (best.length) return crestBest(best);
  // a file name that is part of exactly one team name ("tottenham" -> "Tottenham Hotspur")
  if (compact.length >= 5) {
    const hits = new Set(idx.names.filter(([n, t]) => n.includes(compact) && !t.ext).map(([, t]) => t));
    if (hits.size === 1) return [...hits][0];
  }
  return null;
}

act('openCrests', async () => {
  await loadStore();
  UI.crestQ = ''; UI.crestF = 'all';
  openModal(() => viewCrestManager(), { size: 'wide' });
});
function viewCrestManager() {
  const n = Object.keys(CUSTOM_CRESTS).length;
  return modalShell('Escudos dos times', `
    <p class="muted" style="margin-top:0">Os escudos do jogo são desenhos gerados com as cores de cada clube. Você pode trocar o de qualquer time por uma imagem sua: ela fica salva só neste aparelho e aparece em todo o jogo.</p>
    <div class="row wrap" style="gap:8px;margin-bottom:8px">
      <label class="btn primary" style="cursor:pointer">Importar várias imagens<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" class="hide" data-a="crestBulk"></label>
      <button class="btn" data-a="crestExport" ${n ? '' : 'disabled'}>Exportar pacote</button>
      <label class="btn" style="cursor:pointer">Importar pacote<input type="file" accept=".json,application/json" class="hide" data-a="crestPack"></label>
      ${n ? '<button class="btn danger" data-a="crestClearAsk">Remover todas</button>' : ''}
      <span class="chip right">${n} ${n === 1 ? 'imagem sua' : 'imagens suas'}</span>
    </div>
    <p class="help-keys" style="margin:0 0 12px">Na importação em lote, o nome de cada arquivo indica o time: <span class="kbd">flamengo.png</span> <span class="kbd">real-madrid.png</span> <span class="kbd">sao-paulo.webp</span>${S ? ' · seleções pela sigla: <span class="kbd">BRA.png</span>' : ''}. O pacote leva todas as suas imagens para outro aparelho.</p>
    <input id="crest-q" class="input" type="search" style="width:100%;margin-bottom:10px" placeholder="Buscar time…" value="${esc(UI.crestQ || '')}" data-a="crestQ" data-live="1" autocomplete="off" aria-label="Buscar time">
    <div class="row wrap" style="gap:6px;margin-bottom:12px">${[['all', 'Todos'], ['custom', 'Com imagem sua'], ['gen', 'Escudo gerado']].map(([k, l]) => `<button class="chip ${(UI.crestF || 'all') === k ? 'on' : ''}" data-a="crestF" data-v="${k}">${l}</button>`).join('')}</div>
    <div id="crest-list">${crestListHtml()}</div>`, '<button class="btn" data-a="closeModal">Fechar</button>');
}
function crestListHtml() {
  const q = strip((UI.crestQ || '').trim());
  const f = UI.crestF || 'all';
  let rows = crestTeams();
  if (q) rows = rows.filter((t) => strip(`${t.n} ${t.s || ''}`).includes(q));
  if (f === 'custom') rows = rows.filter((t) => CUSTOM_CRESTS[t.key]);
  else if (f === 'gen') rows = rows.filter((t) => !CUSTOM_CRESTS[t.key]);
  rows.sort((a, b) => (a.ext ? 1 : 0) - (b.ext ? 1 : 0) || a.n.localeCompare(b.n, 'pt-BR'));
  if (!rows.length) return '<div class="empty">Nenhum time encontrado.</div>';
  const shown = rows.slice(0, 120);
  return `<div class="any-grid">${shown.map((t) => `<button class="any-item" data-a="crestEdit" ${t.id ? `data-id="${t.id}"` : `data-k="${esc(t.key)}"`} title="Trocar o escudo ${esc(tA(t, 'do'))}">${crest(t, 34)}<span class="grow"><span class="nm">${esc(t.n)}</span><span class="wh">${CUSTOM_CRESTS[t.key] ? 'Imagem sua' : 'Escudo gerado'}${t.where ? ' · ' + esc(t.where) : ''}</span></span></button>`).join('')}</div>${rows.length > shown.length ? `<p class="muted" style="font-size:13px;margin:10px 0 0">Mostrando ${shown.length} de ${rows.length}. Busque pelo nome para ver os outros.</p>` : ''}`;
}
act('crestQ', (el) => { UI.crestQ = el.value; const box = $('#crest-list'); if (box) box.innerHTML = crestListHtml(); });
act('crestF', (el) => {
  UI.crestF = el.dataset.v;
  const box = $('#crest-list');
  if (box) box.innerHTML = crestListHtml();
  $$('[data-a="crestF"]').forEach((b) => b.classList.toggle('on', b === el));
});
act('crestBulk', async (el) => {
  const files = Array.from(el.files || []);
  el.value = '';
  if (!files.length) return;
  const idx = buildCrestIndex(crestTeams());
  const ok = [], miss = [];
  for (const f of files) {
    const t = matchCrestFile(f.name, idx);
    if (!t) { miss.push(f.name); continue; }
    try { setCustomCrest(t.key, await imageFileToCrest(f)); ok.push(t.n); } catch (e) { miss.push(f.name); }
  }
  if (ok.length) await persistCustomCrests();
  render(); refreshModal();
  const list = (arr) => esc(arr.slice(0, 40).join(', ')) + (arr.length > 40 ? '…' : '');
  openModal(modalShell('Importação de escudos', `
    <p><b>${ok.length}</b> ${ok.length === 1 ? 'escudo aplicado' : 'escudos aplicados'}${ok.length ? `: ${list(ok)}.` : '.'}</p>
    ${miss.length ? `<p class="muted">Sem time correspondente (${miss.length}): ${list(miss)}. Renomeie o arquivo com o nome do time ou aplique pela lista, tocando no time.</p>` : ''}`,
  '<button class="btn primary" data-a="closeModal">OK</button>'), { size: 'narrow' });
});
act('crestExport', async () => {
  const n = Object.keys(CUSTOM_CRESTS).length;
  if (!n) return;
  const blob = new Blob([JSON.stringify({ format: 'ultra-manager-escudos', v: 1, crests: CUSTOM_CRESTS })], { type: 'application/json' });
  await offerDownload('ultra-manager-escudos.json', blob, `Pacote com ${n} ${n === 1 ? 'escudo' : 'escudos'} exportado.`);
});
act('crestPack', async (el) => {
  const f = el.files && el.files[0];
  el.value = '';
  if (!f) return;
  try {
    const obj = JSON.parse(await f.text());
    if (!obj || obj.format !== 'ultra-manager-escudos' || !obj.crests || typeof obj.crests !== 'object') throw new Error('Este arquivo não é um pacote de escudos do Ultra Manager.');
    let n = 0;
    for (const k of Object.keys(obj.crests)) {
      if (k.length <= 120 && isCrestData(obj.crests[k])) { setCustomCrest(k, obj.crests[k]); n++; }
    }
    if (n) await persistCustomCrests();
    render(); refreshModal();
    toast(n ? `${n} ${n === 1 ? 'escudo importado' : 'escudos importados'}.` : 'Nenhum escudo válido no pacote.', !n);
  } catch (e) { toast(e instanceof SyntaxError ? 'Não foi possível ler o pacote.' : (e.message || 'Não foi possível ler o pacote.'), true); }
});
act('crestClearAsk', () => {
  openModal(modalShell('Remover todas as imagens?', '<p>Todos os times voltam ao escudo gerado. Se quiser guardar as imagens, exporte um pacote antes.</p>',
    '<button class="btn" data-a="closeModal">Cancelar</button><button class="btn danger" data-a="crestClear">Remover todas</button>'), { size: 'narrow' });
});
act('crestClear', async () => {
  for (const k of Object.keys(CUSTOM_CRESTS)) setCustomCrest(k, null);
  await persistCustomCrests();
  closeModal();
  render(); refreshModal();
  toast('Todos os times voltaram ao escudo gerado.');
});
