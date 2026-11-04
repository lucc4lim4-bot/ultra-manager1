// node test: potential of generated youngsters (regens/scouted) stays low at the top: 85+ rare, 90+ almost never
const fs = require('fs'); const path = require('path');
const E = require('../dist/engine_test.js');
const era = +(process.argv[2] || 2026), days = +(process.argv[3] || 1500);
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era' + era + '.json'), 'utf8'));
(async () => {
  await E.createWorld({ era, mode: 'normal', coachName: 'Teste', coachAge: 40, seed: 5 });
  const o = E.initialOffers('normal')[0];
  E.startCareer(o.team, () => {});
  let S = E.S; const seq0 = S.seq.p; const end = S.date + days; let g = 0;
  while (S.date < end && g++ < 9000) { const r = E.advanceDay(); if (r.blocked) { E.simulateMatch(r.blocked); continue; } if (S.pendingEnd) E.closeSeasonEnd(null); S = E.S; }
  const gen = Object.values(S.players).filter((p) => p.id >= seq0 && !p.natOnly);
  const c = (f) => gen.filter(f).length;
  console.log('gerados:', gen.length, '| pot>=80:', c((p) => p.pot >= 80), '| pot>=85:', c((p) => p.pot >= 85), '| pot>=90:', c((p) => p.pot >= 90), '| ovr>=75:', c((p) => p.o >= 75), '| ovr>=80:', c((p) => p.o >= 80), '| ovr>=85:', c((p) => p.o >= 85), '| max ovr', Math.max(...gen.map((p) => p.o)), 'max pot', Math.max(...gen.map((p) => p.pot)));
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
