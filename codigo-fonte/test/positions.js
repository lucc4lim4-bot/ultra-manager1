// node test: position change (time by similarity, fit while training, overall at the end)
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era2026.json'), 'utf8'));
(async () => {
  await E.createWorld({ era: 2026, mode: 'normal', coachName: 'T', coachAge: 40, seed: 5 });
  E.startCareer(E.initialOffers('normal')[0].team, () => {});
  let S = E.S;
  const sq = E.squadOf(S.user.team);
  const pick = (pos) => sq.find((p) => p.p === pos && p.a);
  const plans = [['RW', 'LW'], ['CM', 'CDM'], ['CB', 'RB'], ['ST', 'CAM'], ['CM', 'CB'], ['ST', 'CB'], ['GK', 'ST']];
  const run = [];
  for (const [from, to] of plans) {
    const p = pick(from);
    if (!p) continue;
    const est = E.posChangeOvr(p, to), days = E.posChangeDays(p, to);
    const r = E.startPosChange(p, to);
    console.log(`${p.n} ${from}->${to} age ${p.age} ovr ${p.o} -> previsto ${est}, ${days} dias, fit hoje ${E.posFit(p, to).toFixed(2)} | ${r.msg}`);
    if (r.ok) run.push(p);
  }
  const d0 = S.date;
  let g = 0;
  while (S.date < d0 + 50 && g++ < 500) { const r = E.advanceDay(); if (r.blocked) { E.simulateMatch(r.blocked); continue; } S = E.S; }
  for (const p of run) console.log(`+50d ${p.n}: pos ${p.p} alt ${p.alt} ovr ${p.o} ${p.pc ? `treinando ${p.pc.to} fit ${E.posFit(p, p.pc.to).toFixed(2)}` : 'concluído'}`);
  while (S.date < d0 + 120 && g++ < 900) { const r = E.advanceDay(); if (r.blocked) { E.simulateMatch(r.blocked); continue; } S = E.S; }
  for (const p of run) console.log(`+120d ${p.n}: pos ${p.p} alt ${p.alt} ovr ${p.o} pc ${p.pc ? 'yes' : 'no'}`);
  console.log('inbox', S.inbox.filter((m) => /agora é/.test(m.subj)).map((m) => m.body).join('\n'));
})();
