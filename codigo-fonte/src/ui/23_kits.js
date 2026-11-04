/* ===================== uniforme do seu clube: cores e padrões (casa e fora) ===================== */
const KIT_PATS = ['Liso', 'Listras verticais', 'Listras horizontais', 'Faixa diagonal', 'Metades', 'Faixa no peito', 'Listras finas', 'Xadrez'];
function kitCustom(teamId, role) { return S.kits && S.kits[teamId] && S.kits[teamId][role] || null; }
function kitHex(c) { try { const [r, g, b] = hexToRgb(c); return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); } catch (e) { return '#ffffff'; } }
// default colours of a club's kit (what the match uses when nothing is customised)
function kitBase(t, role) {
  const c1 = kitHex(t.c1 || '#c0392b'), c2 = kitHex(t.c2 || '#ffffff');
  const far = (a, b) => { const A = hexToRgb(a), B = hexToRgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) > 90; };
  if (role === 'away') {
    const shirt = far(c2, c1) ? c2 : (lum(c1) > 0.55 ? '#1f2d6e' : '#f4f4f4');
    const trim = shirt === c2 ? c1 : (lum(shirt) > 0.5 ? '#1f2d6e' : '#ffffff');
    return { shirt, trim, shorts: far(trim, shirt) ? trim : (lum(shirt) > 0.5 ? '#1f2d6e' : '#ffffff'), socks: shirt, pat: 0 };
  }
  const trim = far(c2, c1) ? c2 : (lum(c1) > 0.5 ? '#1b2440' : '#ffffff');
  return { shirt: c1, trim, shorts: far(c2, c1) ? c2 : (lum(c1) > 0.5 ? '#1b2440' : '#ffffff'), socks: c1, pat: 0 };
}
function kitEffective(t, role) { return Object.assign(kitBase(t, role), kitCustom(t.id, role) || {}); }
// pattern over a shirt-shaped box (shared by the 2D game and the previews)
function kitPattern(ctx, pat, col, x, y, w, h) {
  if (!pat) return;
  ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = col;
  if (pat === 1) { for (let i = 1; i < 7; i += 2) ctx.fillRect(x + i * w / 7, y, w / 7, h); }
  else if (pat === 2) { for (let i = 1; i < 6; i += 2) ctx.fillRect(x, y + i * h / 6, w, h / 6); }
  else if (pat === 3) { ctx.lineWidth = w * 0.3; ctx.beginPath(); ctx.moveTo(x - w * 0.1, y + h * 0.05); ctx.lineTo(x + w * 1.1, y + h * 0.95); ctx.stroke(); }
  else if (pat === 4) ctx.fillRect(x + w / 2, y, w / 2, h);
  else if (pat === 5) ctx.fillRect(x, y + h * 0.28, w, h * 0.24);
  else if (pat === 6) { for (let i = 1; i < 15; i += 2) ctx.fillRect(x + i * w / 15, y, w / 15, h); }
  else if (pat === 7) { for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) ctx.fillRect(x + i * w / 6, y + j * h / 5, w / 6, h / 5); }
  ctx.restore();
}
function kitSvg(k, size = 150, num) {
  // same pattern logic as the canvas, as SVG
  const id = 'kp' + Math.floor(Math.random() * 1e6), B = { x: 22, y: 8, w: 56, h: 52 };
  let pt = '';
  const f = k.trim;
  switch (k.pat) {
    case 1: for (let i = 1; i < 7; i += 2) pt += `<rect x="${B.x + i * B.w / 7}" y="${B.y}" width="${B.w / 7}" height="${B.h}" fill="${f}"/>`; break;
    case 2: for (let i = 1; i < 6; i += 2) pt += `<rect x="${B.x}" y="${B.y + i * B.h / 6}" width="${B.w}" height="${B.h / 6}" fill="${f}"/>`; break;
    case 3: pt = `<line x1="${B.x - 6}" y1="${B.y + 3}" x2="${B.x + B.w + 6}" y2="${B.y + B.h - 3}" stroke="${f}" stroke-width="${B.w * 0.3}"/>`; break;
    case 4: pt = `<rect x="${B.x + B.w / 2}" y="${B.y}" width="${B.w / 2}" height="${B.h}" fill="${f}"/>`; break;
    case 5: pt = `<rect x="${B.x}" y="${B.y + B.h * 0.28}" width="${B.w}" height="${B.h * 0.24}" fill="${f}"/>`; break;
    case 6: for (let i = 1; i < 15; i += 2) pt += `<rect x="${B.x + i * B.w / 15}" y="${B.y}" width="${B.w / 15}" height="${B.h}" fill="${f}"/>`; break;
    case 7: for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) pt += `<rect x="${B.x + i * B.w / 6}" y="${B.y + j * B.h / 5}" width="${B.w / 6}" height="${B.h / 5}" fill="${f}"/>`; break;
  }
  const shirt = 'M30 6 L8 20 L16 40 L26 34 L26 62 L74 62 L74 34 L84 40 L92 20 L70 6 C64 14 36 14 30 6Z';
  return `<svg width="${size}" height="${Math.round(size * 1.3)}" viewBox="0 0 100 130" aria-hidden="true"><defs><clipPath id="${id}"><path d="${shirt}"/></clipPath></defs>
    <rect x="30" y="94" width="14" height="30" rx="3" fill="${k.socks}" stroke="rgba(0,0,0,.35)"/><rect x="56" y="94" width="14" height="30" rx="3" fill="${k.socks}" stroke="rgba(0,0,0,.35)"/>
    <rect x="26" y="64" width="48" height="34" rx="6" fill="${k.shorts}" stroke="rgba(0,0,0,.35)"/>
    <path d="${shirt}" fill="${k.shirt}"/><g clip-path="url(#${id})">${pt}</g><path d="${shirt}" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="1.6"/>
    <path d="M30 6 C36 14 64 14 70 6" fill="none" stroke="${k.trim}" stroke-width="3"/>
    ${num != null ? `<text x="50" y="46" text-anchor="middle" font-size="22" font-weight="900" font-family="Arial Black,Arial,sans-serif" fill="${lum(k.shirt) > 0.55 ? '#111' : '#fff'}">${num}</text>` : ''}</svg>`;
}
function kitHtml() {
  const K = UI.kit, t = S.teams[K.team], v = K.v[K.role];
  const col = (k, lab) => `<label class="field" style="min-width:110px"><span class="muted up" style="font-size:11px">${lab}</span><input type="color" value="${kitHex(v[k])}" data-a="kitCol" data-k="${k}" style="width:100%;height:38px;border-radius:8px;border:1px solid var(--line2);background:none;padding:2px"></label>`;
  return modalShell('👕 Uniforme', `<div class="row wrap" style="gap:8px;margin-bottom:12px"><div class="seg"><button class="${K.role === 'home' ? 'on' : ''}" data-a="kitRole" data-v="home">Uniforme 1 (casa)</button><button class="${K.role === 'away' ? 'on' : ''}" data-a="kitRole" data-v="away">Uniforme 2 (fora)</button></div><span class="muted">${esc(t.n)}</span></div>
    <div class="row wrap" style="gap:18px;align-items:flex-start;justify-content:center"><div style="text-align:center">${kitSvg(v, 170, 10)}</div>
    <div class="col grow" style="min-width:230px;gap:12px"><div class="row wrap" style="gap:10px">${col('shirt', 'Camisa')}${col('trim', 'Detalhes')}${col('shorts', 'Calção')}${col('socks', 'Meias')}</div>
      <div><div class="muted up" style="font-size:11px;margin-bottom:6px">Padrão da camisa (usa a cor dos detalhes)</div><div class="seg wrapseg">${KIT_PATS.map((n, i) => `<button class="${v.pat === i ? 'on' : ''}" data-a="kitPat" data-v="${i}">${n}</button>`).join('')}</div></div>
      <p class="muted" style="font-size:12px;margin:0">O uniforme aparece no jogo 2D, nas telas do clube e na camisa do patrocinador. Se o adversário usar cor parecida, o jogo continua escolhendo o uniforme dele pelo padrão.</p></div></div>`,
    '<button class="btn" data-a="kitReset">Restaurar padrão</button><button class="btn" data-a="closeModal">Cancelar</button><button class="btn gold" data-a="kitSave">Salvar uniforme</button>');
}
act('openKit', () => {
  const tid = S.user && S.user.team; if (!tid || !S.teams[tid]) return;
  const t = S.teams[tid];
  UI.kit = { team: tid, role: 'home', v: { home: kitEffective(t, 'home'), away: kitEffective(t, 'away') } };
  closeAllModals();
  openModal(() => kitHtml(), { size: 'narrow' });
});
act('kitRole', (el) => { UI.kit.role = el.dataset.v; refreshModal(); });
act('kitPat', (el) => { UI.kit.v[UI.kit.role].pat = +el.dataset.v; refreshModal(); });
act('kitCol', (el) => { UI.kit.v[UI.kit.role][el.dataset.k] = el.value; refreshModal(); });
act('kitReset', () => { const t = S.teams[UI.kit.team]; UI.kit.v[UI.kit.role] = kitBase(t, UI.kit.role); refreshModal(); });
act('kitSave', () => {
  const K = UI.kit; if (!S.kits) S.kits = {};
  S.kits[K.team] = { home: Object.assign({}, K.v.home), away: Object.assign({}, K.v.away) };
  closeAllModals(); toast('Uniforme salvo.'); render();
});
