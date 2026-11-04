// A "ligas normais" career saved with the previous data file gets the new clubs when loaded, and its next
// South American season has a Sul-Americana; the Mundial de Clubes still happens in December.
//   node test/migrate_comps.js <old era2026.json>
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const OLD = process.argv[2];
const NEW = path.join(__dirname, '../dist/data/era2026.json');
(async () => {
  E.DATA = JSON.parse(fs.readFileSync(OLD, 'utf8'));
  await E.createWorld({ era: 2026, mode: 'normal', coachName: 'T', coachAge: 40, seed: 9, zoeira: false });
  const offers = E.initialOffers('normal');
  const o = offers.find((x) => x.league === 'BRA');
  E.startCareer(o.team, () => {});
  // the old engine knew nothing about these: simulate an old save
  let S = E.S;
  delete S.fill.sula; delete S.fill.ofc; S.cwcYears = undefined;
  for (let i = 0; i < 40; i++) { const r = E.advanceDay(); if (r.blocked) E.simulateMatch(r.blocked); }
  const nTeams = Object.keys(S.teams).length, nPlayers = Object.keys(S.players).length;
  const json = E.serializeState();
  // load it with the new data file
  E.DATA = JSON.parse(fs.readFileSync(NEW, 'utf8'));
  E.adoptState(JSON.parse(json));
  const added = E.importNewClubs();
  S = E.S;
  console.log('teams', nTeams, '->', Object.keys(S.teams).length, 'players', nPlayers, '->', Object.keys(S.players).length, 'added', added);
  console.log('sula pool', S.fill.sula.length, S.fill.sula.slice(0, 6).map((id) => `${S.teams[id].n} (${S.teams[id].sq.length})`).join(', '));
  console.log('auckland', S.fill.ofc.map((id) => S.teams[id].n + ' ' + S.teams[id].sq.length));
  const ids = new Set();
  let dupIds = 0;
  for (const id in S.players) { if (ids.has(S.players[id].id)) dupIds++; ids.add(S.players[id].id); if (+id !== S.players[id].id) dupIds++; }
  console.log('player id problems', dupIds, 'second import adds', E.importNewClubs());
  // play on until the next South American season
  const end = E.dayOf(E.ymd(S.date).y + 1, 6, 30);
  let guard = 0;
  while (S.date < end && guard++ < 4000) {
    const r = E.advanceDay();
    if (r.blocked) { E.simulateMatch(r.blocked); continue; }
    if (S.pendingEnd) E.closeSeasonEnd(null);
  }
  S = E.S;
  const y = E.ymd(S.date).y;
  const sula = E.compOf('SULA', y);
  console.log('Sul-Americana', y, sula ? sula.groups.flatMap((g) => g.teams).length + ' clubes' : 'MISSING');
  console.log('Mundial', y - 1, E.champOf('MUN', y - 1) ? 'campeão ' + E.teamName(E.champOf('MUN', y - 1)) : 'MISSING');
  process.exit(sula && E.champOf('MUN', y - 1) && !dupIds ? 0 : 1);
})();
