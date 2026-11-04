/* ===================== sponsorship tab (Escritório → Patrocínios) ===================== */
// logo of a generated brand (SVG): shape in two colours with the initial letter
function brandLogo(b, size = 48, word) {
  const br = SP_BRANDS[b], lg = br[4], c1 = lg.c1, c2 = lg.c2;
  const ic = SP_ICONS[spIconOf(b)];
  const pts = (n, rot, k) => Array.from({ length: n }, (_, i) => { const a = rot + i * Math.PI * 2 / n, r = k && i % 2 ? 40 * k : 40; return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  // symbol colour: the second colour when it contrasts with the frame, otherwise white or black
  const contrast = (bg, fg) => Math.abs(lum(bg) - lum(fg)) > 0.28 ? fg : (lum(bg) > 0.5 ? '#111' : '#fff');
  let frame = '', ink = contrast(c1, c2), sc = 0.56, tr = 22;
  switch (lg.sh % 9) {
    case 0: frame = `<circle cx="50" cy="50" r="46" fill="${c1}"/>`; break;
    case 1: frame = `<rect x="6" y="6" width="88" height="88" rx="20" fill="${c1}"/>`; break;
    case 2: frame = `<polygon points="${pts(6, Math.PI / 6, 0).replace(/(\d+\.?\d*),(\d+\.?\d*)/g, (m, x, y) => `${(50 + (x - 50) * 1.12).toFixed(1)},${(50 + (y - 50) * 1.12).toFixed(1)}`)}" fill="${c1}"/>`; break;
    case 3: frame = `<path d="M10 8 H90 V50 Q90 84 50 96 Q10 84 10 50Z" fill="${c1}"/>`; tr = 18; sc = 0.5; break;
    case 4: frame = `<circle cx="50" cy="50" r="43" fill="none" stroke="${c1}" stroke-width="9"/>`; ink = c1; sc = 0.46; tr = 27; break;
    case 5: frame = `<rect x="6" y="64" width="88" height="9" rx="4.5" fill="${c2}"/>`; ink = c1; sc = 0.62; tr = 14; break;
    case 6: frame = `<circle cx="50" cy="50" r="46" fill="${c1}"/><circle cx="50" cy="50" r="38" fill="none" stroke="${c2}" stroke-width="3"/>`; sc = 0.5; tr = 25; break;
    case 7: frame = `<polygon points="${pts(12, -Math.PI / 2, 0.82)}" fill="${c1}" transform="translate(50 50) scale(1.1) translate(-50 -50)"/>`; sc = 0.48; tr = 26; break;
    default: frame = `<circle cx="50" cy="50" r="46" fill="${c1}"/><path d="M50 4 A46 46 0 0 1 50 96Z" fill="${c2}" opacity="0.9"/>`; ink = '#ffffff'; sc = 0.5; tr = 25; break;
  }
  const sym = `<g transform="translate(${tr} ${tr}) scale(${sc})"><path d="${ic}" fill="${ink}" fill-rule="evenodd" stroke="rgba(0,0,0,0.22)" stroke-width="2.4" paint-order="stroke"/></g>`;
  if (!word) return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">${frame}${sym}</svg>`;
  const nm = br[2].toUpperCase(), fs = Math.min(20, 98 / (Math.max(4, nm.length) * 0.84));
  return `<svg width="${size}" height="${Math.round(size * 1.28)}" viewBox="0 0 100 128" aria-hidden="true">${frame}${sym}<text x="50" y="118" text-anchor="middle" font-size="${fs.toFixed(1)}" font-weight="900" fill="#fff" stroke="rgba(0,0,0,0.55)" stroke-width="3" paint-order="stroke" letter-spacing="1" font-family="Arial Black,Arial,sans-serif">${esc(nm)}</text></svg>`;
}
function spShirtSvg(t, tag, size = 84, b) {
  const kc = t.id && typeof kitCustom === 'function' ? kitCustom(t.id, 'home') : null;
  const c1 = kc ? kc.shirt : (t.c1 || '#2f7bff'), c2 = kc ? kc.trim : (t.c2 || '#ffffff');
  const dark = typeof lum === 'function' ? lum(c1) < 0.6 : true;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><path d="M30 12 L10 26 L20 44 L30 38 L30 90 L70 90 L70 38 L80 44 L90 26 L70 12 C64 20 36 20 30 12Z" fill="${c1}" stroke="rgba(0,0,0,0.35)" stroke-width="2"/>
    <path d="M30 12 C36 20 64 20 70 12" fill="none" stroke="${c2}" stroke-width="3"/>
    ${tag && b != null && b >= 0 ? `<g transform="translate(40 30) scale(0.2)">${brandLogo(b, 100).replace(/<svg[^>]*>|<\/svg>/g, '')}</g>` : ''}
    ${tag ? `<text x="50" y="62" text-anchor="middle" font-size="${tag.length > 8 ? 7.5 : tag.length > 5 ? 9 : 11}" font-weight="800" fill="${dark ? '#fff' : '#111'}" font-family="Arial Narrow,sans-serif">${esc(tag)}</text>` : '<text x="50" y="56" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.45)">sem patrocínio</text>'}</svg>`;
}
function viewSponsors() {
  if (!sponsAvailable()) return '<div class="panel empty">Patrocínios só existem no modo de clubes com você como treinador.</div>';
  const s = sponsInit();
  sponsRefresh(false);
  const t = S.teams[s.team];
  const brand = (b) => SP_BRANDS[b];
  const perkChip = (b) => { const pk = SP_PERKS[brand(b)[3]]; return `<span class="chip" title="${esc(pk.desc)}">${pk.ico} ${pk.label}</span>`; };
  const contract = (slot) => {
    const c = s[slot], br = brand(c.b), left = Math.max(0, Math.ceil((c.end - S.date) / 365 * 10) / 10);
    return `<div class="row wrap" style="gap:16px;align-items:center">${slot === 'shirt' ? spShirtSvg(t, br[1], 92, c.b) : `<div style="font-size:42px">🏟</div>`}<div title="${esc(br[0])}">${brandLogo(c.b, 56, true)}</div>
      <div class="grow" style="min-width:220px"><div class="disp" style="font-size:24px;font-weight:800">${slot === 'std' ? esc(c.name) : esc(br[0])}</div>
        <div class="muted" style="font-size:13px">${slot === 'std' ? `Patrocinador: ${esc(br[0])} · antes: ${esc(c.orig || '')}` : `Na camisa: ${esc(br[1])}`}</div>
        <div class="row wrap" style="gap:8px;margin-top:8px"><span class="chip">${money(c.perYear)}/ano</span><span class="chip">${left} ${left === 1 ? 'ano' : 'anos'} restantes</span>${slot === 'shirt' ? `<span class="chip">+${money(c.winBonus)} por vitória</span>${perkChip(c.b)}` : ''}</div>
        ${slot === 'shirt' ? `<p class="muted" style="font-size:12px;margin:8px 0 0">${esc(SP_PERKS[br[3]].desc)}</p>` : ''}</div>
      <button class="btn" data-a="spBreak" data-slot="${slot}">Rescindir (multa ${money(c.perYear * 0.5)})</button></div>`;
  };
  const offers = (slot) => {
    const list = s.offers[slot] || [];
    if (!list.length) return '<div class="muted">Sem propostas no momento. Novas chegam em breve.</div>';
    return `<div class="col" style="gap:10px">${list.map((o) => {
      const br = brand(o.b);
      return `<div class="panel" style="padding:12px"><div class="row wrap" style="gap:14px;align-items:center">${slot === 'shirt' ? spShirtSvg(t, br[1], 64, o.b) : '<div style="font-size:32px">🏟</div>'}${brandLogo(o.b, 48, true)}
        <div class="grow" style="min-width:200px"><b style="font-size:17px">${slot === 'std' ? esc(sponsStdName(o)) : esc(br[0])}</b>${slot === 'std' ? `<div class="muted" style="font-size:12px">${esc(br[0])}</div>` : ''}
          <div class="row wrap" style="gap:6px;margin-top:6px"><span class="chip">${money(o.perYear)}/ano</span><span class="chip">${o.yrs} ${o.yrs === 1 ? 'ano' : 'anos'}</span><span class="chip">luvas ${money(o.signing)}</span>${slot === 'shirt' ? `<span class="chip">+${money(o.winBonus)}/vitória</span>${perkChip(o.b)}` : ''}</div></div>
        <button class="btn gold" data-a="spSign" data-slot="${slot}" data-id="${o.id}">Fechar contrato</button></div></div>`;
    }).join('')}</div>`;
  };
  const slotPanel = (slot, title, sub) => `<div class="panel"><h3>${title} <span class="sub">${sub}</span></h3>${s[slot] ? contract(slot) : offers(slot)}</div>`;
  return `<div class="grid g3" style="margin-bottom:16px"><div class="stat-tile"><div class="k">Caixa</div><div class="v">${money(t.budget)}</div></div>
    <div class="stat-tile"><div class="k">Receita por ano</div><div class="v">${money((s.std ? s.std.perYear : 0) + (s.shirt ? s.shirt.perYear : 0))}</div><div class="muted" style="font-size:13px">pago em parcelas mensais</div></div>
    <div class="stat-tile"><div class="k">Total já recebido</div><div class="v">${money(s.total)}</div><div class="muted" style="font-size:13px">${s.wins || 0} bônus por vitória</div></div></div>
    <div class="col" style="gap:16px">${slotPanel('shirt', 'Camisa', 'o patrocinador aparece no uniforme em campo e pode ajudar no jogo')}
    ${slotPanel('std', 'Nome do estádio', `${esc(t.std || 'estádio')}: vender o nome rende luvas e parcelas mensais`)}
    <div class="row wrap" style="gap:10px"><button class="btn" data-a="spNew">Pedir novas propostas</button><button class="btn" data-a="spCat">📚 Catálogo de marcas (${SP_BRANDS.length})</button><span class="muted" style="font-size:12px;align-self:center">As propostas mudam a cada 45 dias e dependem da força e do porte do clube. Rescindir custa meio ano de contrato.</span></div></div>`;
}
act('spSign', (el) => { const r = sponsSign(el.dataset.slot, +el.dataset.id); toast(r.msg, !r.ok); render(); });
act('spBreak', (el) => {
  const slot = el.dataset.slot, c = S.spons[slot];
  if (!c) return;
  openModal(modalShell('Rescindir contrato?', `<p>Rescindir com ${esc(SP_BRANDS[c.b][0])} custa <b>${money(c.perYear * 0.5)}</b> de multa. ${slot === 'std' ? 'O estádio volta ao nome original.' : 'A camisa fica sem patrocínio.'}</p>`,
    `<button class="btn" data-a="closeModal">Cancelar</button><button class="btn gold" data-a="spBreakOk" data-slot="${slot}">Rescindir</button>`), { size: 'narrow' });
});
act('spBreakOk', (el) => { closeAllModals(); const r = sponsBreak(el.dataset.slot); toast(r.msg, !r.ok); render(); });
act('spNew', () => {
  const s = sponsInit();
  if (S.date - s.offD < 7) { toast('As propostas foram renovadas há pouco. Tente em alguns dias.', true); return; }
  sponsRefresh(true); render();
});

// ---------- catalogue of all brands: search by name, filter by effect, paged
const SP_PAGE = 48;
act('spCat', () => { UI.spc = { q: '', perk: 'all', page: 0 }; closeAllModals(); openModal(() => spCatHtml(), { size: 'wide' }); });
function spCatList() {
  const c = UI.spc, q = strip(c.q || '');
  return SP_BRANDS.map((b, i) => i).filter((i) => (c.perk === 'all' || SP_BRANDS[i][3] === c.perk) && (!q || strip(SP_BRANDS[i][0]).includes(q)));
}
function spCatHtml() {
  const c = UI.spc, list = spCatList(), pages = Math.max(1, Math.ceil(list.length / SP_PAGE));
  c.page = clamp(c.page, 0, pages - 1);
  const s = sponsInit(), inUse = new Set([s.shirt && s.shirt.b, s.std && s.std.b]);
  const items = list.slice(c.page * SP_PAGE, (c.page + 1) * SP_PAGE).map((i) => {
    const br = SP_BRANDS[i], pk = SP_PERKS[br[3]];
    return `<div class="panel" style="padding:10px;text-align:center;${inUse.has(i) ? 'outline:2px solid var(--gold,#ffc54d)' : ''}" title="${esc(pk.label + ': ' + pk.desc)}"><div style="display:flex;justify-content:center">${brandLogo(i, 56)}</div>
      <div style="font-weight:700;font-size:13px;margin-top:6px;line-height:1.15">${esc(br[0])}</div><div class="muted" style="font-size:11px">${pk.ico} ${pk.label}</div></div>`;
  }).join('');
  return modalShell('📚 Catálogo de marcas', `<div class="row wrap" style="gap:8px;margin-bottom:10px"><input id="spc-q" class="input" placeholder="Buscar marca…" value="${esc(c.q)}" data-a="spcQ" data-live="1" style="max-width:220px">
    <div class="seg wrapseg"><button class="${c.perk === 'all' ? 'on' : ''}" data-a="spcPerk" data-v="all">Todas</button>${Object.keys(SP_PERKS).map((k) => `<button class="${c.perk === k ? 'on' : ''}" data-a="spcPerk" data-v="${k}">${SP_PERKS[k].ico} ${SP_PERKS[k].label}</button>`).join('')}</div></div>
    <div class="muted" style="font-size:12px;margin-bottom:8px">${list.length} ${list.length === 1 ? 'marca' : 'marcas'} · página ${c.page + 1} de ${pages}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px">${items || '<div class="muted">Nenhuma marca encontrada.</div>'}</div>`,
  `<button class="btn" data-a="spcPage" data-d="-1" ${c.page <= 0 ? 'disabled' : ''}>← Anterior</button><button class="btn" data-a="spcPage" data-d="1" ${c.page >= pages - 1 ? 'disabled' : ''}>Próxima →</button><button class="btn gold" data-a="closeModal">Fechar</button>`);
}
act('spcQ', (el) => { UI.spc.q = el.value; UI.spc.page = 0; const pos = el.selectionStart; refreshModal(); const n = $('#spc-q'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } });
act('spcPerk', (el) => { UI.spc.perk = el.dataset.v; UI.spc.page = 0; refreshModal(); });
act('spcPage', (el) => { UI.spc.page += +el.dataset.d; refreshModal(); });
