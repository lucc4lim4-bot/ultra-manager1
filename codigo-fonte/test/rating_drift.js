// node test: average club rating over several seasons (development vs aging balance)
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const era = +(process.argv[2] || 2026), seasons = +(process.argv[3] || 4);
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era' + era + '.json'), 'utf8'));
(async () => {
  await E.createWorld({ era, mode: 'normal', coachName: 'Teste', coachAge: 40, seed: 11 });
  let S = E.S;
  E.startCareer(E.initialOffers('normal')[0].team, () => {});
  const stat = () => {
    S = E.S;
    const clubs = Object.values(S.teams).filter((t) => !t.isNat && !t.ext && t.sq.length);
    const r = clubs.map((t) => { t._rD = 0; return E.teamRating(t.id); }).sort((a, b) => b - a);
    const ps = Object.values(S.players).filter((p) => p.t);
    const top = ps.map((p) => p.o).sort((a, b) => b - a);
    return `clubs ${(r.reduce((a, b) => a + b, 0) / r.length).toFixed(2)} top20 ${(r.slice(0, 20).reduce((a, b) => a + b, 0) / 20).toFixed(2)} | players ${ps.length} 85+ ${top.filter((o) => o >= 85).length} 80+ ${top.filter((o) => o >= 80).length} best ${top[0]}`;
  };
  console.log(E.fmtDate(S.date), stat());
  const endDay = S.date + 365 * seasons + 5;
  let guard = 0, lastY = E.ymd(S.date).y;
  while (S.date < endDay && guard++ < 20000) {
    const r = E.advanceDay();
    if (r.blocked) { E.simulateMatch(r.blocked); continue; }
    if (S.pendingEnd) E.closeSeasonEnd(null);
    const t = E.ymd(S.date);
    if (t.m === 7 && t.d === 3 && t.y !== lastY) { lastY = t.y; console.log(E.fmtDate(S.date), stat()); }
  }
})();
