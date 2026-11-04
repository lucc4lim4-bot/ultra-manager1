// who plays the UEFA competitions and the CONMEBOL ones in the first seasons (by association / country)
//   node test/access.js [era] [months]
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const era = +(process.argv[2] || 2026), months = +(process.argv[3] || 14);
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, `../dist/data/era${era}.json`), 'utf8'));
(async () => {
  await E.createWorld({ era, mode: 'normal', coachName: 'T', coachAge: 40, seed: 11, zoeira: false });
  const offers = E.initialOffers('normal');
  E.startCareer(offers.find((o) => o.league === 'ENG').team, () => {});
  let S = E.S;
  const end = S.date + months * 30;
  const seen = new Set();
  const report = () => {
    for (const id of S.active) {
      const c = S.comps[id];
      if (!c || seen.has(c.id) || !['UCL', 'UEL', 'UECL', 'UCLQ', 'UECLQ', 'LIB', 'SULA'].includes(c.key)) continue;
      const teams = c.groups ? c.groups.flatMap((g) => g.teams) : c.teams;
      if (!teams || !teams.length) continue;
      seen.add(c.id);
      const by = {};
      teams.forEach((t) => { const k = S.teams[t].c; by[k] = (by[k] || 0) + 1; });
      console.log(`${c.name} ${c.season}: ${teams.length} clubes |`, Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '));
      if (c.key.endsWith('Q')) console.log('   ', c.rounds[0].ties.map((tid) => { const t = c.ties[tid]; return `${E.teamName(t.a)} x ${E.teamName(t.b)}`; }).join(' | '));
    }
  };
  let guard = 0;
  while (S.date < end && guard++ < 9000) {
    const r = E.advanceDay();
    if (r.blocked) { E.simulateMatch(r.blocked); continue; }
    if (S.pendingEnd) E.closeSeasonEnd(null);
    S = E.S;
    report();
  }
  const champs = S.hist.filter((h) => ['UCL', 'UEL', 'UECL', 'LIB', 'SULA', 'MUN'].includes(h.key)).map((h) => `${h.name} ${h.season}: ${h.chN}`);
  console.log(champs.join('\n'));
  console.log('news', S.news.length, S.news.filter((n) => n.cat === 'Pelo mundo').map((n) => n.title + ' — ' + n.body.slice(0, 300)).join('\n'));
})();
