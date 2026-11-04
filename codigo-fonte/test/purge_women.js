// A career saved with the old 2026 database (women's players included by mistake) is cleaned when loaded.
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const OLD = process.argv[2];
if (!OLD) { console.log('usage: node test/purge_women.js <old era2026.json>'); process.exit(1); }
E.DATA = JSON.parse(fs.readFileSync(OLD, 'utf8'));
(async () => {
  await E.createWorld({ era: 2026, mode: 'normal', coachName: 'T', coachAge: 40, seed: 5, zoeira: false });
  const S = E.S;
  const offers = E.initialOffers('normal');
  E.startCareer(offers[0].team, () => {});
  const byName = (n) => Object.values(S.players).find((p) => p.n === n);
  const ut = S.user.team;
  const shaw = byName('Khadija Shaw'), hansen = byName('Caroline Graham Hansen'), miedema = byName('Vivianne Miedema');
  // a woman signed by the user, one on the shortlist, one called up by Norway, an open offer
  shaw.t = ut; S.teams[ut].sq.push(shaw.id); if (S.teams[ut].xi) S.teams[ut].xi[3] = shaw.id;
  S.tr.short.push(miedema.id);
  const nor = S.nations.NOR; nor.sq = (nor.sq || []).concat([hansen.id]);
  S.tr.offers.push({ id: 'of_t', pid: shaw.id, from: 2, fee: 1000000, status: 'open', d: S.date });
  const before = Object.keys(S.players).length;
  const json = E.serializeState();
  E.adoptState(JSON.parse(typeof json === 'string' ? json : JSON.stringify(json)));
  const S2 = E.S;
  const left = Object.values(S2.players).filter((p) => ['Khadija Shaw', 'Caroline Graham Hansen', 'Vivianne Miedema', 'Ada Hegerberg', 'Carla Camacho', 'Julie Rabanne'].includes(p.n));
  console.log('players', before, '->', Object.keys(S2.players).length, 'purged flag', S2.purgedW);
  console.log('women left', left.map((p) => p.n));
  console.log('user squad has shaw?', S2.teams[ut].sq.includes(shaw.id), 'xi has shaw?', (S2.teams[ut].xi || []).includes(shaw.id));
  console.log('shortlist', S2.tr.short.includes(miedema.id), 'NOR squad', (S2.nations.NOR.sq || []).includes(hansen.id), 'offer', S2.tr.offers.find((o) => o.id === 'of_t').status);
  const msg = (S2.inbox || []).find((m) => /Elenco atualizado/.test(m.subj || m.s || m.title || ''));
  console.log('inbox msg:', msg ? JSON.stringify(msg).slice(0, 220) : 'none');
  // loading the same save again does nothing more
  const again = E.serializeState();
  E.adoptState(JSON.parse(typeof again === 'string' ? again : JSON.stringify(again)));
  // the career keeps going
  for (let i = 0; i < 60; i++) E.advanceDay();
  console.log('advanced to', E.fmtDate(E.S.date), 'ok');
})();
