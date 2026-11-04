// Sul-Americana and Mundial de Clubes over a few seasons of a "ligas normais" career (headless)
//   node test/continental.js [era] [seasons] [league of the user's club: BRA|ENG|...]
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const era = +(process.argv[2] || 2026);
const seasons = +(process.argv[3] || 2);
const lg = process.argv[4] || 'BRA';
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era' + era + '.json'), 'utf8'));
const fails = [];
const check = (ok, msg) => { if (!ok) { fails.push(msg); console.log('  FAIL', msg); } };
(async () => {
  await E.createWorld({ era, mode: 'normal', coachName: 'Teste', coachAge: 40, seed: +(process.env.SEED || 11), zoeira: false });
  let S = E.S;
  const offers = E.initialOffers('normal');
  const o = offers.find((x) => x.league === lg) || offers[0];
  E.startCareer(o.team, () => {});
  S = E.S;
  console.log(`era ${era}, user club ${E.teamName(o.team)} (${o.league}), start ${E.fmtDate(S.date, 'long')}`);
  const seen = { sula: new Set(), mun: new Set(), lib: new Set() };
  const inspect = () => {
    for (const cid of S.active) {
      const c = S.comps[cid];
      if (!c) continue;
      if (c.key === 'SULA' && !seen.sula.has(c.id)) {
        seen.sula.add(c.id);
        const teams = c.groups.flatMap((g) => g.teams);
        const lib = E.compOf('LIB', c.year);
        const libT = new Set(lib ? lib.groups.flatMap((g) => g.teams) : []);
        const byC = {};
        teams.forEach((id) => (byC[S.teams[id].c] = (byC[S.teams[id].c] || 0) + 1));
        const sameCountry = c.groups.reduce((n, g) => n + g.teams.length - new Set(g.teams.map((id) => S.teams[id].c)).size, 0);
        console.log(`  Sul-Americana ${c.season}: ${teams.length} clubes ${JSON.stringify(byC)} same-country in groups ${sameCountry}`);
        check(teams.length === 32 && new Set(teams).size === 32, 'Sul-Americana has 32 different clubs');
        check(!teams.some((id) => libT.has(id)), 'no club in both Libertadores and Sul-Americana');
      }
      if (c.key === 'LIB' && !seen.lib.has(c.id)) {
        seen.lib.add(c.id);
        const teams = c.groups.flatMap((g) => g.teams);
        const hold = (c.holders || []).map((id) => E.teamName(id));
        console.log(`  Libertadores ${c.season}: ${teams.length} clubes, detentores ${hold.join(', ') || '—'}`);
        check(teams.length === 32 && new Set(teams).size === 32, 'Libertadores has 32 different clubs');
        for (const h of c.holders || []) check(teams.includes(h), `holder ${E.teamName(h)} plays the Libertadores`);
      }
      if ((c.key === 'MUN' || c.key === 'SULA') && c.done && !seen[c.key + 'done' + c.id]) {
        seen[c.key + 'done' + c.id] = 1;
        const from = c.key === 'SULA' ? c.groupRounds : 0;
        for (const rd of c.rounds.slice(from)) {
          const line = (rd.ties || []).map((tid) => { const t = c.ties[tid]; return t.m.map((mid) => { const m = S.matches[mid]; return `${S.teams[m.h].s} ${m.hg}-${m.ag}${m.pen ? ` (${m.pen[0]}-${m.pen[1]} pen)` : ''} ${S.teams[m.a].s}`; }).join(' / '); }).join('; ');
          console.log(`    ${c.key} ${rd.name} ${E.fmtDate(rd.d)}: ${line.slice(0, 260)}`);
        }
        if (c.key === 'SULA') console.log(`    vindos da Libertadores: ${(c.fromLib || []).map((id) => S.teams[id].s).join(' ')}`);
      }
      if (c.key === 'MUN' && !seen.mun.has(c.id)) {
        seen.mun.add(c.id);
        console.log(`  Mundial ${c.season} criado em ${E.fmtDate(S.date)}: ${Object.entries(c.reps).map(([k, id]) => k + '=' + (id ? E.teamName(id) : '-')).join(' ')}`);
      }
    }
  };
  const endDay = S.date + 365 * seasons;
  let guard = 0;
  while (S.date < endDay && guard++ < 6000) {
    inspect();
    const r = E.advanceDay();
    if (r.blocked) { E.simulateMatch(r.blocked); continue; }
    if (S.pendingEnd) E.closeSeasonEnd(null);
  }
  S = E.S;
  // finished competitions are archived on 1 January: look at the history
  const hist = S.hist.filter((h) => ['LIB', 'SULA', 'MUN', 'UCL'].includes(h.key));
  for (const h of hist) console.log(`  campeão ${h.key} ${h.season}: ${h.chN} (vice ${h.ruN})`);
  const yrs = [...new Set(S.hist.filter((h) => h.key === 'LIB').map((h) => h.year))];
  for (const y of yrs) {
    check(S.hist.some((h) => h.key === 'SULA' && h.year === y), `Sul-Americana ${y} has a champion`);
    check(S.hist.some((h) => h.key === 'MUN' && h.year === y), `Mundial ${y} has a champion`);
  }
  // matches left behind in the past
  const stale = Object.values(S.matches).filter((m) => !m.done && m.d < S.date).length;
  check(stale === 0, `no unplayed matches in the past (found ${stale})`);
  console.log(fails.length ? `${fails.length} FAILURES` : 'all checks passed');
  process.exit(fails.length ? 1 : 0);
})();
