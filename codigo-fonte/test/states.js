// node test: Brazilian state championships and the Copinha (formats, fixtures, knockout, champions)
// usage: node test/states.js [era] [BRA|ENG] [days]
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const era = +(process.argv[2] || 2026);
const league = process.argv[3] || 'BRA';
const days = +(process.argv[4] || 120);
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era' + era + '.json'), 'utf8'));
(async () => {
  await E.createWorld({ era, mode: 'normal', coachName: 'Teste', coachAge: 40, seed: 21 });
  const offers = E.initialOffers('normal');
  const o = offers.find((x) => x.league === league) || offers[0];
  const t0 = Date.now();
  E.startCareer(o.team, () => {});
  let S = E.S;
  console.log('user', S.teams[S.user.team].n, 'start', E.fmtDate(S.date), 'init ms', Date.now() - t0);
  const problems = [];
  const check = () => {
    S = E.S;
    const comps = S.active.map((id) => S.comps[id]).filter((c) => c && (c.state || c.copinha));
    return comps;
  };
  let comps = check();
  if (!comps.length) {
    // European start: the comps of the era's year were pre-simulated; check the history and go to next January
    console.log('history', S.hist.filter((h) => /^EST|COPINHA/.test(h.key)).map((h) => `${h.name} ${h.season}: ${h.chN}${h.ruN ? ' (vice ' + h.ruN + ')' : ''}`).join(' | '));
  }
  const end = S.date + days;
  let guard = 0;
  while (S.date < end && guard++ < 5000) {
    const r = E.advanceDay();
    if (r.blocked) { E.simulateMatch(r.blocked); continue; }
    if (S.pendingEnd) E.closeSeasonEnd(null);
    S = E.S;
  }
  comps = check();
  for (const c of comps) {
    if (c.copinha) {
      const played = c.ym.filter((m) => m.hg !== null).length;
      console.log(`${c.name} ${c.season}: ${c.teams.length} clubs, ${c.groups.length} groups, ${played}/${c.ym.length} group games, KO rounds: ${c.ko.map((k) => `${k.name}(${k.ties.length})`).join(' > ')} champion ${c.champion ? S.teams[c.champion].n : '-'}`);
      if (!c.done) problems.push(c.name + ' not finished');
      continue;
    }
    const ms = c.rounds.flatMap((rd) => rd.m).map((id) => S.matches[id]);
    const undone = ms.filter((m) => !m.done).length;
    // every club once per matchday of a phase, no team twice on the same day
    const perDay = {};
    for (const m of ms) for (const t of [m.h, m.a]) { const k = t + ':' + m.d; perDay[k] = (perDay[k] || 0) + 1; if (perDay[k] > 1) problems.push(`${c.name}: ${S.teams[t].n} twice on ${E.fmtDate(m.d)}`); }
    const games = {};
    for (const m of ms) if (m.ph !== undefined) { games[m.h] = (games[m.h] || 0) + 1; games[m.a] = (games[m.a] || 0) + 1; }
    const g = Object.values(games);
    const ko = c.rounds.filter((rd) => rd.ties && rd.ties.length).map((rd) => `${rd.name}(${rd.ties.length})`).join(' > ');
    const span = ms.length ? `${E.fmtDate(Math.min(...ms.map((m) => m.d)))}–${E.fmtDate(Math.max(...ms.map((m) => m.d)))}` : '';
    console.log(`${c.name} ${c.season}: ${c.teams.length} clubs, league games/club ${Math.min(...g)}-${Math.max(...g)}, KO ${ko}, ${span}, champion ${c.champion ? S.teams[c.champion].n : '-'}${c.runnerUp ? ' (vice ' + S.teams[c.runnerUp].n + ')' : ''}${undone ? ` UNDONE ${undone}` : ''}`);
    if (!c.done) problems.push(c.name + ' not finished');
  }
  const pens = Object.values(S.matches).filter((m) => m.done && S.comps[m.c] && S.comps[m.c].state && (m.pen || m.et));
  console.log('state KO decided on penalties:', pens.filter((m) => m.pen).length, 'with extra time:', pens.filter((m) => m.et).length);
  console.log('user inbox', S.inbox.filter((m) => /Copinha|Estadual|Paulist|Carioca|Paraense|Gauch|Mineiro|Evolu/.test(m.subj + m.body)).slice(0, 6).map((m) => m.subj).join(' | '));
  console.log('news', S.news.filter((n) => /Copinha|Paulist|Carioca|Paraense|Mineiro|Gauch|campeões da temporada/.test(n.title + n.body)).slice(0, 8).map((n) => n.title).join(' | '));
  console.log('problems:', problems.length ? problems.slice(0, 20).join('\n') : 'none');
})();
