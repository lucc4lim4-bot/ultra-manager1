// A "ligas normais" career saved with the data file from before the new leagues gets them when loaded: external teams
// that are these clubs keep their players, and the leagues and the Conference League start at the next seasons.
//   node test/migrate_leagues.js <old era2026.json> [league of the user]
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const OLD = process.argv[2];
const NEW = path.join(__dirname, '../dist/data/era2026.json');
const LG = process.argv[3] || 'ENG';
(async () => {
  E.DATA = JSON.parse(fs.readFileSync(OLD, 'utf8'));
  await E.createWorld({ era: 2026, mode: 'normal', coachName: 'T', coachAge: 40, seed: 5, zoeira: false });
  const offers = E.initialOffers('normal');
  E.startCareer(offers.find((x) => x.league === LG).team, () => {});
  let S = E.S;
  for (let i = 0; i < 60; i++) { const r = E.advanceDay(); if (r.blocked) E.simulateMatch(r.blocked); }
  const nTeams = Object.keys(S.teams).length, nPlayers = Object.keys(S.players).length, nLeagues = S.normal.length;
  const old = Object.values(S.teams).find((t) => t.key === 'x:Medipol Başakşehir FK' || t.key === 'x:Başakşehir');
  const oldSq = old ? old.sq.length : 0;
  const json = E.serializeState();
  E.DATA = JSON.parse(fs.readFileSync(NEW, 'utf8'));
  E.adoptState(JSON.parse(json));
  const a1 = E.importNewClubs(), a2 = E.importNewLeagues();
  S = E.S;
  console.log('leagues', nLeagues, '->', S.normal.length, '| teams', nTeams, '->', Object.keys(S.teams).length, '| players', nPlayers, '->', Object.keys(S.players).length, '| added', a1, a2);
  const bsk = Object.values(S.teams).find((t) => t.key === 'basaksehir');
  console.log('Başakşehir', bsk && bsk.id, old && old.id, 'squad', oldSq, '->', bsk && bsk.sq.length, 'ext', bsk && bsk.ext);
  const ids = new Set();
  let bad = 0;
  for (const id in S.players) { const p = S.players[id]; if (ids.has(p.id) || +id !== p.id) bad++; ids.add(p.id); if (p.t && !S.teams[p.t]) bad++; if (p.t && !S.teams[p.t].sq.includes(p.id)) bad++; }
  for (const id in S.teams) for (const pid of S.teams[id].sq || []) if (!S.players[pid] || S.players[pid].t !== +id) bad++;
  const inLeagues = S.normal.flatMap((l) => l.teams);
  console.log('player/team problems', bad, '| clubs in leagues', inLeagues.length, 'unique', new Set(inLeagues).size, '| second import adds', E.importNewLeagues());
  const end = E.dayOf(2027, 10, 15);
  let guard = 0;
  while (S.date < end && guard++ < 9000) {
    const r = E.advanceDay();
    if (r.blocked) { E.simulateMatch(r.blocked); continue; }
    if (S.pendingEnd) E.closeSeasonEnd(null);
    S = E.S;
  }
  const uecl = E.compOf('UECL', 2027);
  const tur = S.active.map((id) => S.comps[id]).find((c) => c && c.key === 'TUR');
  const chi = S.active.map((id) => S.comps[id]).find((c) => c && c.key === 'CHI');
  console.log('UECL 2027/28', uecl ? uecl.teams.length + ' clubes' : 'MISSING', '| Süper Lig', tur ? tur.season : 'MISSING', '| Chileno', chi ? chi.season : 'MISSING');
  process.exit(uecl && tur && chi && !bad ? 0 : 1);
})();
