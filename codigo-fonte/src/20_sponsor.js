/* ===================== sponsorship: stadium naming rights and the shirt sponsor ===================== */
// S.spons = { team, std: contract|null, shirt: contract|null, offers: { std: [], shirt: [] }, offD, total, hist }
// contract = { b (brand index), yrs, perYear, start, end, fmt (stadium), name (stadium), winBonus (shirt) }
const SP_BRANDS = [
  // full name, shirt tag, short word for the arena name, perk
  ['Banco Meridian', 'MERIDIAN', 'Meridian', 'cash'], ['Crédito Aurora', 'AURORA', 'Aurora', 'cash'], ['Seguros Pátria', 'PÁTRIA', 'Pátria', 'cash'],
  ['Banco Horizonte', 'HORIZONTE', 'Horizonte', 'cash'], ['Invest Prime', 'PRIME', 'Prime', 'cash'],
  ['Volt Energético', 'VOLT', 'Volt', 'energy'], ['Turbo Cola', 'TURBO', 'Turbo', 'energy'], ['Flash Isotônico', 'FLASH', 'Flash', 'energy'],
  ['Zênite Sports', 'ZÊNITE', 'Zênite', 'boots'], ['Atleta Pro', 'ATLETA PRO', 'Atleta', 'boots'], ['Kicker Gear', 'KICKER', 'Kicker', 'boots'],
  ['Rede Atlântica TV', 'ATLÂNTICA', 'Atlântica', 'media'], ['Canal Ponto Com', 'PONTO.COM', 'Ponto', 'media'], ['TeleNova', 'TELENOVA', 'TeleNova', 'media'],
  ['Aero Lusa', 'AERO LUSA', 'Aero Lusa', 'bonus'], ['Viagens Estrela', 'ESTRELA', 'Estrela', 'bonus'], ['Rodovia Express', 'EXPRESS', 'Express', 'bonus'],
];
// 1000 made-up brands: the 17 above first (saves keep working), then generated ones, 200 per perk, each with its own logo
(function genBrands() {
  let seed = 20261104;
  const rg = () => { seed = (seed + 0x6D2B79F5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const pk = (arr) => arr[Math.floor(rg() * arr.length)];
  const SYL = ['ba', 'be', 'bi', 'bo', 'ca', 'ce', 'co', 'da', 'de', 'di', 'do', 'fa', 'fe', 'fi', 'ga', 'ge', 'go', 'ha', 'ja', 'ka', 'ke', 'ko', 'la', 'le', 'li', 'lo', 'lu', 'ma', 'me', 'mi', 'mo', 'na', 'ne', 'ni', 'no', 'pa', 'pe', 'pi', 'po', 'ra', 're', 'ri', 'ro', 'sa', 'se', 'si', 'so', 'ta', 'te', 'ti', 'to', 'va', 've', 'vi', 'vo', 'xa', 'za', 'ze', 'zo', 'lan', 'mar', 'tor', 'vel', 'dex', 'nex', 'tra', 'gal', 'bel', 'cor', 'sol', 'lum', 'vit', 'ner', 'tec', 'pla', 'sto', 'kar'];
  const SECT = {
    cash: ['Banco {R}', '{R} Seguros', 'Crédito {R}', '{R} Invest', '{R} Financeira', 'Cooperativa {R}', '{R} Capital', '{R} Previdência'],
    energy: ['{R} Energético', '{R} Cola', 'Isotônico {R}', 'Sucos {R}', '{R} Água Mineral', '{R} Whey', 'Café {R}', '{R} Nutrição'],
    boots: ['{R} Sports', '{R} Gear', 'Atleta {R}', '{R} Calçados', '{R} Fit', '{R} Athletic', '{R} Pro', 'Academias {R}'],
    media: ['{R} TV', 'Rádio {R}', '{R} Telecom', '{R} Play', 'Canal {R}', '{R} Internet', '{R} Digital', '{R} Games'],
    bonus: ['{R} Linhas Aéreas', 'Viagens {R}', '{R} Turismo', '{R} Express', 'Hotéis {R}', '{R} Cargas', '{R} Cruzeiros', '{R} Locadora'],
  };
  const used = new Set(SP_BRANDS.map((x) => x[0]));
  const usedRoot = new Set(SP_BRANDS.map((x) => x[2].toLowerCase()));
  const perks = Object.keys(SECT);
  const need = { cash: 200, energy: 200, boots: 200, media: 200, bonus: 200 };
  for (const x of SP_BRANDS) need[x[3]]--;
  const seqPerks = [];
  for (const k of perks) for (let i = 0; i < need[k]; i++) seqPerks.push(k);
  // interleave so the sectors are mixed through the list
  for (let i = seqPerks.length - 1; i > 0; i--) { const j = Math.floor(rg() * (i + 1)); [seqPerks[i], seqPerks[j]] = [seqPerks[j], seqPerks[i]]; }
  const logo = () => {
    const h = Math.floor(rg() * 360), h2 = (h + 150 + Math.floor(rg() * 60)) % 360;
    return { sh: Math.floor(rg() * 9), c1: `hsl(${h},68%,${38 + Math.floor(rg() * 14)}%)`, c2: rg() < 0.5 ? '#ffffff' : `hsl(${h2},85%,${62 + Math.floor(rg() * 12)}%)` };
  };
  const logos = SP_BRANDS.map(() => logo()); // the first 17 get logos too
  for (const perk of seqPerks) {
    let name, root, guard = 0;
    do {
      let r = '';
      const n = 2 + (rg() < 0.35 ? 1 : 0);
      for (let i = 0; i < n; i++) r += pk(SYL);
      root = r.charAt(0).toUpperCase() + r.slice(1);
      name = pk(SECT[perk]).replace('{R}', root);
      guard++;
    } while ((used.has(name) || usedRoot.has(root.toLowerCase()) || root.length < 4 || root.length > 9) && guard < 400);
    used.add(name); usedRoot.add(root.toLowerCase());
    SP_BRANDS.push([name, root.toUpperCase(), root, perk]);
    logos.push(logo());
  }
  SP_BRANDS.forEach((x, i) => { x[4] = logos[i]; });
})();

const SP_PERKS = {
  cash: { ico: '🏦', label: 'Mais dinheiro', desc: 'Paga mais, sem efeito em campo.' },
  energy: { ico: '⚡', label: 'Energia', desc: 'O fôlego da corrida dura 20% mais no jogo 2D e o time rende um pouco mais na simulação (+0,4).' },
  boots: { ico: '👟', label: 'Material esportivo', desc: 'Finalização mais precisa no jogo 2D (erro de chute 12% menor) e +0,4 de rendimento na simulação.' },
  media: { ico: '📺', label: 'Moral do elenco', desc: 'A emissora promove o time: +3 de moral para todo o elenco todo mês.' },
  bonus: { ico: '✈️', label: 'Prêmio por vitória', desc: 'Paga um bônus por vitória 3 vezes maior.' },
};
const SP_STD_FMT = ['{b} Arena', 'Estádio {b}', '{b} Stadium', 'Arena {b}', '{b} Park'];

function sponsInit() {
  if (!S.spons) S.spons = { team: 0, std: null, shirt: null, offers: { std: [], shirt: [] }, offD: -999, total: 0, hist: [] };
  const uid = S.user && S.user.team;
  if (S.spons.team !== uid) Object.assign(S.spons, { team: uid || 0, std: null, shirt: null, offers: { std: [], shirt: [] }, offD: -999 }); // new club: new deals
  return S.spons;
}
function sponsAvailable() { return !!(S.user && S.user.team && !S.coach.unemployed && !S.pl && S.mode !== 'national' && S.teams[S.user.team] && !S.teams[S.user.team].isNat); }
function sponsActive() { return S.spons && S.user && S.spons.team === S.user.team && sponsAvailable() ? S.spons : null; }
function sponsPerk() { const s = sponsActive(); return s && s.shirt ? SP_BRANDS[s.shirt.b][3] : ''; }
function sponsRatingBonus(teamId) { const s = sponsActive(); if (!s || !s.shirt || teamId !== s.team) return 0; const pk = SP_BRANDS[s.shirt.b][3]; return pk === 'energy' || pk === 'boots' ? 0.4 : 0; }
// the name shown for a stadium (the user's club may have sold the naming rights)
function stadiumName(t) {
  if (typeof t === 'number') t = S.teams[t];
  if (!t) return '';
  const s = sponsActive();
  if (s && s.std && t.id === s.team) return s.std.name;
  return t.std;
}
// what is written on the shirt: the user's sponsor, or a made-up one for the other clubs
function sponsBrandOf(teamId) {
  const s = sponsActive();
  if (s && teamId === s.team) return s.shirt ? s.shirt.b : -1;
  const t = S.teams[teamId];
  if (!t || t.isNat) return -1;
  return hashStr('sp' + teamId + (t.n || '')) % SP_BRANDS.length;
}
function sponsTag(teamId) { const b = sponsBrandOf(teamId); return b < 0 ? '' : SP_BRANDS[b][1]; }
function sponsBase(t) {
  const fin = clamp(t.fin == null ? 2 : t.fin, 0, 6);
  const base = [3e6, 8e6, 20e6, 45e6, 90e6, 160e6, 240e6][fin] * moneyFactor();
  const r = typeof teamRating === 'function' ? teamRating(t.id) : 65;
  return base * clamp(0.8 + (r - 65) / 60, 0.7, 1.4);
}
function sponsGenOffers(slot) {
  const s = sponsInit(), t = S.teams[s.team];
  if (!t) return [];
  const used = new Set();
  const out = [];
  for (let i = 0; i < 3; i++) {
    let b, guard = 0;
    do { b = rint(0, SP_BRANDS.length - 1); } while ((used.has(b) || (i === 0 && SP_BRANDS[b][3] !== 'cash')) && guard++ < 200); // the first offer is always the money one
    used.add(b);
    const perk = SP_BRANDS[b][3];
    const yrs = rint(1, 5);
    let per = sponsBase(t) * (slot === 'shirt' ? 0.16 : 0.12) * rfloat(0.85, 1.25) * (perk === 'cash' ? 1.2 : 0.92);
    per = roundMoney(per);
    const o = { id: nextId('sp'), slot, b, yrs, perYear: per, signing: roundMoney(per * 0.12 * yrs) };
    if (slot === 'std') o.fmt = rint(0, SP_STD_FMT.length - 1);
    else o.winBonus = roundMoney(per * 0.012 * (perk === 'bonus' ? 3 : 1));
    out.push(o);
  }
  return out;
}
function sponsRefresh(force) {
  const s = sponsInit();
  if (!sponsAvailable()) return;
  if (force || S.date - s.offD >= 45 || (!s.offers.std.length && !s.offers.shirt.length)) {
    s.offers = { std: s.std ? [] : sponsGenOffers('std'), shirt: s.shirt ? [] : sponsGenOffers('shirt') };
    s.offD = S.date;
  }
}
function sponsStdName(o) { return SP_STD_FMT[o.fmt].replace('{b}', SP_BRANDS[o.b][2]); }
function sponsSign(slot, id) {
  const s = sponsInit(), t = S.teams[s.team];
  if (s[slot]) return { ok: false, msg: 'Já existe um contrato nesse espaço. Rescinda antes.' };
  const o = s.offers[slot].find((x) => x.id === id);
  if (!o) return { ok: false, msg: 'Proposta indisponível.' };
  const c = { b: o.b, yrs: o.yrs, perYear: o.perYear, start: S.date, end: S.date + Math.round(o.yrs * 365), signing: o.signing };
  if (slot === 'std') { c.fmt = o.fmt; c.name = sponsStdName(o); c.orig = t.std; } else c.winBonus = o.winBonus;
  s[slot] = c;
  s.offers[slot] = [];
  t.budget += o.signing; s.total += o.signing;
  const br = SP_BRANDS[o.b];
  addInbox('board', 'Diretoria', slot === 'std' ? `Estádio agora se chama ${c.name}` : `${br[0]} é a nova patrocinadora da camisa`,
    `${br[0]} fechou ${o.yrs} ${o.yrs === 1 ? 'ano' : 'anos'} de contrato: ${fmtMoney(o.perYear)} por ano (pagos em parcelas mensais) mais ${fmtMoney(o.signing)} de luvas, já no caixa.${slot === 'shirt' ? ` Bônus de ${fmtMoney(o.winBonus)} por vitória.` : ''}`);
  return { ok: true, msg: `${br[0]} fechada: ${fmtMoney(o.signing)} de luvas no caixa.` };
}
function sponsBreak(slot) {
  const s = sponsInit(), t = S.teams[s.team], c = s[slot];
  if (!c) return { ok: false, msg: 'Sem contrato.' };
  const fine = roundMoney(c.perYear * 0.5);
  if (fine > t.budget) return { ok: false, msg: `Multa rescisória de ${fmtMoney(fine)} maior que o caixa.` };
  t.budget -= fine;
  s[slot] = null;
  s.offers[slot] = sponsGenOffers(slot);
  return { ok: true, msg: `Contrato rescindido. Multa de ${fmtMoney(fine)}.` };
}
// first of each month: installments, expiries, the media sponsor's morale boost
function sponsMonth() {
  if (!sponsAvailable()) return;
  const s = sponsInit(), t = S.teams[s.team];
  if (!t) return;
  for (const slot of ['std', 'shirt']) {
    const c = s[slot];
    if (!c) continue;
    if (S.date >= c.end) {
      addInbox('board', 'Diretoria', `Contrato com ${SP_BRANDS[c.b][0]} terminou`, `O patrocínio ${slot === 'std' ? 'do nome do estádio' : 'da camisa'} chegou ao fim. Há novas propostas na aba Patrocínios do Escritório.`);
      s.hist.push({ slot, b: c.b, start: c.start, end: c.end });
      s[slot] = null; s.offers[slot] = sponsGenOffers(slot);
      continue;
    }
    const pay = Math.round(c.perYear / 12);
    t.budget += pay; s.total += pay;
  }
  if (s.shirt && SP_BRANDS[s.shirt.b][3] === 'media') for (const p of squadOf(t.id)) p.mor = clamp((p.mor || 70) + 3, 5, 100);
  if (S.date - s.offD >= 45) sponsRefresh(false);
}
// a win pays the shirt sponsor's bonus
function sponsAfterMatch(m) {
  const s = sponsActive();
  if (!s || !s.shirt || !s.shirt.winBonus || m.fr) return;
  const uid = s.team, goalsFor = m.h === uid ? m.hg : m.ag, goalsAg = m.h === uid ? m.ag : m.hg;
  if (goalsFor > goalsAg) { const t = S.teams[uid]; t.budget += s.shirt.winBonus; s.total += s.shirt.winBonus; s.wins = (s.wins || 0) + 1; }
}

/* ---------- logo emblems: a symbol per brand (drawn from these paths, 100x100 box) ---------- */
const SP_ICONS = (() => {
  const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
  const ring = (r, r2) => `M50 ${50 - r} a${r} ${r} 0 1 1 -0.01 0Z M50 ${50 - r2} a${r2} ${r2} 0 1 0 0.01 0Z`;
  const gear = (() => { let o = ''; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 30 : 42, w = 0.17; o += (i ? 'L' : 'M') + (50 + Math.cos(a - w) * r).toFixed(1) + ' ' + (50 + Math.sin(a - w) * r).toFixed(1) + 'L' + (50 + Math.cos(a + w) * r).toFixed(1) + ' ' + (50 + Math.sin(a + w) * r).toFixed(1); } return o + 'Z' + ell(50, 50, 13, 13); })();
  const sun = (() => { let o = ell(50, 50, 19, 19); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); o += `M${(50 + c * 28 - s * 6).toFixed(1)} ${(50 + s * 28 + c * 6).toFixed(1)}L${(50 + c * 44).toFixed(1)} ${(50 + s * 44).toFixed(1)}L${(50 + c * 28 + s * 6).toFixed(1)} ${(50 + s * 28 - c * 6).toFixed(1)}Z`; } return o; })();
  const I = {
    bolt: 'M58 6 L20 56 H46 L38 94 L80 40 H54Z',
    flame: 'M50 6 C58 28 80 38 80 62 C80 80 66 94 50 94 C34 94 20 80 20 62 C20 48 30 40 36 26 C40 34 44 38 48 40 C46 30 46 18 50 6Z',
    drop: 'M50 6 C50 6 22 44 22 63 A28 28 0 0 0 78 63 C78 44 50 6 50 6Z',
    leaf: 'M16 84 C10 42 42 12 90 10 C92 58 62 90 22 86Z M24 80 C40 56 56 42 76 30 C56 46 40 60 24 80Z',
    star: 'M50 6 L62 37 L95 38 L69 58 L78 90 L50 71 L22 90 L31 58 L5 38 L38 37Z',
    sun, gear,
    crown: 'M10 76 L14 28 L34 52 L50 20 L66 52 L86 28 L90 76Z M10 82 H90 V92 H10Z',
    wave: 'M6 52 C22 30 36 30 50 50 C64 70 78 70 94 48 L94 70 C78 92 64 92 50 72 C36 52 22 52 6 74Z',
    mountain: 'M4 86 L36 28 L50 52 L62 36 L96 86Z',
    wing: 'M6 62 C30 64 46 50 50 20 C58 44 76 56 96 54 C78 68 62 74 52 94 C44 78 28 68 6 62Z',
    paw: ell(50, 66, 22, 18) + ell(22, 44, 8, 11) + ell(40, 28, 8, 11) + ell(60, 28, 8, 11) + ell(78, 44, 8, 11),
    bank: 'M50 6 L94 32 H6Z M14 42 H30 V76 H14Z M42 42 H58 V76 H42Z M70 42 H86 V76 H70Z M6 84 H94 V94 H6Z',
    diamond: 'M50 6 L92 38 L50 94 L8 38Z M50 24 L72 38 L50 70 L28 38Z',
    heart: 'M50 90 C6 58 12 20 34 18 C44 17 50 28 50 28 C50 28 56 17 66 18 C88 20 94 58 50 90Z',
    plane: 'M50 4 L58 34 L96 58 V68 L58 58 L56 80 L70 90 V96 L50 90 L30 96 V90 L44 80 L42 58 L4 68 V58 L42 34Z',
    arrow: 'M10 56 L50 8 L90 56 H68 V92 H32 V56Z',
    play: 'M24 8 L92 50 L24 92Z',
    globe: ring(44, 34) + 'M46 22 H54 V78 H46Z M22 46 H78 V54 H22Z',
    eye: 'M4 50 C26 20 74 20 96 50 C74 80 26 80 4 50Z' + ell(50, 50, 15, 15),
    target: ring(44, 34) + ring(22, 10),
    shieldx: 'M50 4 L90 16 V50 C90 76 68 90 50 96 C32 90 10 76 10 50 V16Z M43 26 H57 V43 H74 V57 H57 V76 H43 V57 H26 V43 H43Z',
    hex: 'M50 4 L90 27 V73 L50 96 L10 73 V27Z M50 30 L68 40 V60 L50 70 L32 60 V40Z',
    rocket: 'M50 4 C70 20 74 48 68 72 H32 C26 48 30 20 50 4Z' + ell(50, 38, 8, 8) + 'M32 72 L18 92 L40 82Z M68 72 L82 92 L60 82Z',
    cup: 'M24 8 H76 V34 C76 54 64 62 56 64 V76 H70 V90 H30 V76 H44 V64 C36 62 24 54 24 34Z',
    cloud: 'M26 76 C8 76 6 50 26 48 C26 28 56 22 66 40 C86 36 96 62 78 76Z',
    chevrons: 'M10 12 L50 44 L90 12 V32 L50 64 L10 32Z M10 48 L50 80 L90 48 V68 L50 100 L10 68Z',
    bars: 'M10 62 H30 V92 H10Z M40 40 H60 V92 H40Z M70 14 H90 V92 H70Z',
    swirl: 'M50 6 A44 44 0 1 1 6 50 A30 30 0 1 1 36 80 A18 18 0 1 1 52 52 A8 8 0 1 1 50 40 L50 44 A4 4 0 1 0 50 52Z',
    house: 'M50 6 L94 46 H80 V92 H20 V46 H6Z M42 62 H58 V92 H42Z',
    tree: 'M50 4 L82 44 H68 L90 74 H58 V94 H42 V74 H10 L32 44 H18Z',
  };
  return I;
})();
const SP_ICON_KEYS = {
  cash: ['bank', 'diamond', 'shieldx', 'crown', 'hex', 'star', 'cup', 'bars', 'house', 'gear'],
  energy: ['bolt', 'flame', 'drop', 'leaf', 'sun', 'heart', 'rocket', 'tree', 'swirl', 'chevrons'],
  boots: ['arrow', 'wing', 'star', 'mountain', 'paw', 'cup', 'rocket', 'chevrons', 'flame', 'bolt'],
  media: ['play', 'wave', 'eye', 'globe', 'target', 'cloud', 'bolt', 'swirl', 'bars', 'gear'],
  bonus: ['plane', 'globe', 'sun', 'mountain', 'wave', 'star', 'arrow', 'rocket', 'cloud', 'tree'],
};
// the symbol of brand index b: deterministic, tied to its sector
function spIconOf(b) {
  const br = SP_BRANDS[b]; if (!br) return 'star';
  const keys = SP_ICON_KEYS[br[3]] || SP_ICON_KEYS.cash;
  let h = 2166136261; const s = br[0];
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return keys[(h >>> 0) % keys.length];
}
