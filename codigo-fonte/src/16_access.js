/* ===================== continental places by league position (ligas normais) ===================== */
// UEFA associations in coefficient order. Slots by final league position:
// U = Champions League, Q = Champions League play-off, E = Europa League, C = Conference League
const UEFA_RANK = ['ENG', 'ITA', 'ESP', 'GER', 'FRA', 'NED', 'POR', 'BEL', 'TUR', 'CZE', 'GRE', 'NOR', 'POL', 'DEN', 'AUT', 'SUI', 'SCO',
  'SWE', 'ISR', 'CYP', 'SRB', 'CRO', 'HUN', 'UKR', 'ROU', 'SVN', 'BUL', 'SVK', 'AZE', 'KAZ', 'ARM', 'BIH', 'FIN', 'LVA', 'LTU', 'ALB',
  'GEO', 'AND', 'GIB'];
const UEFA_SLOTS = {
  ENG: 'UUUUEEC', ITA: 'UUUUEEC', ESP: 'UUUUEEC', GER: 'UUUUEEC', FRA: 'UUUEEC', NED: 'UUEEC', POR: 'UUEEC',
  BEL: 'UEEC', TUR: 'UEEC', CZE: 'UECC', GRE: 'UECC', NOR: 'UECC', POL: 'UECC', DEN: 'UECC',
  AUT: 'QECC', SUI: 'QECC', SCO: 'QECC', SWE: 'QCC', ISR: 'QC', CYP: 'QC', SRB: 'QEC', CRO: 'QEC', HUN: 'QC', UKR: 'QEC',
  ROU: 'EC', SVN: 'C', BUL: 'QC', SVK: 'EC', AZE: 'QC', KAZ: 'C', ARM: 'C', BIH: 'C', FIN: 'C', LVA: 'C', LTU: 'C', ALB: 'C',
  GEO: 'C', AND: 'C', GIB: 'C',
};
// CONMEBOL: Libertadores places, then Sul-Americana places right below them
const CONMEBOL_RANK = ['BRA', 'ARG', 'COL', 'ECU', 'URU', 'PAR', 'CHI', 'PER', 'BOL', 'VEN'];
const LIB_PLACES = { BRA: 7, ARG: 6, COL: 3, ECU: 3, URU: 2, PAR: 2, CHI: 2, PER: 2, BOL: 2, VEN: 2 };
const SULA_PLACES = { BRA: 6, ARG: 6, COL: 3, ECU: 3, URU: 3, PAR: 2, CHI: 3, PER: 2, BOL: 2, VEN: 2 };
// the leagues every career starts with (the others came with the Conference League update)
const MAIN_LEAGUES = new Set(['ENG', 'ESP', 'GER', 'FRA', 'ITA', 'BRA', 'ARG', 'POR', 'NED']);

const leagueById = (id) => (S.normal || []).find((l) => l.id === id);
const validClub = (id) => !!(id && S.teams[id] && !S.teams[id].isNat && !S.teams[id].ext);

// qualified clubs per kind, in priority order: first slot of that kind of every association (by rank), then the second ones…
function uefaCandidates() {
  const rows = { U: [], Q: [], E: [], C: [] };
  UEFA_RANK.forEach((ctry, ri) => {
    const slots = UEFA_SLOTS[ctry];
    if (!slots || !leagueById(ctry)) return;
    const rk = leagueRanking(ctry);
    const seen = {};
    [...slots].forEach((s, pos) => {
      const id = rk[pos];
      if (!validClub(id)) return;
      seen[s] = (seen[s] || 0) + 1;
      rows[s].push({ id, pr: seen[s] * 100 + ri });
    });
  });
  for (const k in rows) rows[k] = rows[k].sort((a, b) => a.pr - b.pr).map((r) => r.id);
  return rows;
}
// best clubs of the UEFA leagues (or of the old filler pools) that are not in `taken`
function uefaReserve(taken, n) {
  if (n <= 0) return [];
  const pool = uniq(S.normal.filter((l) => UEFA_SLOTS[l.id]).flatMap((l) => leagueRanking(l.id).slice(0, 8))
    .concat(S.fill.ucl || [], S.fill.uel || [])).filter((id) => validClub(id) && !taken.has(id));
  const out = pool.sort(by((id) => teamRating(id), -1)).slice(0, n);
  out.forEach((id) => taken.add(id));
  return out;
}

function conmebolRows(places, exclude) {
  const rows = [];
  CONMEBOL_RANK.forEach((ctry, ri) => {
    if (!leagueById(ctry)) return;
    leagueRankingSA(ctry).filter((id) => validClub(id) && !exclude.has(id)).slice(0, places[ctry] || 0)
      .forEach((id, i) => rows.push({ id, pr: (i + 1) * 100 + ri }));
  });
  return rows.sort((a, b) => a.pr - b.pr).map((r) => r.id);
}

// table zones of a league of the normal mode, from the places above
function continentalZone(c, pos) {
  const ctry = c.lgId || c.key;
  const slot = UEFA_SLOTS[ctry] && UEFA_SLOTS[ctry][pos - 1];
  if (slot) return { U: 'zone-ucl', Q: 'zone-uclq', E: 'zone-uel', C: 'zone-uecl' }[slot];
  if (LIB_PLACES[ctry]) {
    if (pos <= LIB_PLACES[ctry]) return 'zone-lib';
    if (pos <= LIB_PLACES[ctry] + (SULA_PLACES[ctry] || 0)) return 'zone-sula';
  }
  return '';
}
const ZONE_LEGEND = {
  'zone-ucl': ['#4c7dff', 'Champions League'], 'zone-uclq': ['#9db8ff', 'Pré-Champions'], 'zone-uel': ['#ff9a3c', 'Europa League'],
  'zone-uecl': ['#2fbf71', 'Conference League'], 'zone-lib': ['var(--gold)', 'Libertadores'], 'zone-sula': ['#1e88e5', 'Sul-Americana'],
};
