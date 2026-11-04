// node test: simulate seasons headless
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const mode = process.argv[2] || 'ultra';
const era = +(process.argv[3] || 2026);
const seasons = +(process.argv[4] || 1);
const leagueId = process.argv[5] || null;
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era' + era + '.json'), 'utf8'));
(async () => {
  const t0 = Date.now();
  await E.createWorld({ era, mode, coachName: 'Teste', coachAge: 40, seed: 42, zoeira: process.env.ZOEIRA === '1' });
  let S = E.S;
  let offers = E.initialOffers(mode);
  let team = offers[0].team;
  if (leagueId) { const o = offers.find((x) => x.league === leagueId); if (o) team = o.team; }
  console.log('offers', offers.map((o) => S.teams[o.team].n + (o.league ? ' (' + o.league + ')' : '')).join(', '), '->', S.teams[team].n);
  E.startCareer(team, (p) => {});
  console.log('start', E.fmtDate(S.date, 'long'), 'init ms', Date.now() - t0);
  const endDay = S.date + 365 * seasons - (process.env.FULL ? 0 : 8);
  let userMatches = 0, guard = 0;
  while (S.date < endDay && guard++ < 5000) {
    const r = E.advanceDay();
    if (r.blocked) { E.simulateMatch(r.blocked); userMatches++; continue; }
    if (S.pendingEnd) {
      const pe = S.pendingEnd;
      console.log(`== season end ${E.fmtDate(S.date)} pos ${pe.pos}/${pe.n} ${pe.league} titles=${pe.titles.map((t) => t.name).join('|')} conf=${pe.conf} offers=${pe.offers.map((id) => S.teams[id].n).join(', ')}`);
      E.closeSeasonEnd(null);
    }
  }
  S = E.S;
  console.log('end', E.fmtDate(S.date, 'long'), 'ms', Date.now() - t0, 'user matches', userMatches);
  // stats over all finished leagues in history and current
  let goals = 0, n = 0, big = 0, homeW = 0, draws = 0, dist = {};
  for (const id in S.matches) {
    const m = S.matches[id];
    if (!m.done) continue;
    n++; goals += m.hg + m.ag;
    if (m.hg >= 4 || m.ag >= 4) big++;
    if (m.hg > m.ag) homeW++; else if (m.hg === m.ag) draws++;
    const k = Math.max(m.hg, m.ag) + '-' + Math.min(m.hg, m.ag);
    dist[k] = (dist[k] || 0) + 1;
  }
  console.log(`matches ${n} avg goals ${(goals / n).toFixed(2)} 4+ by a team ${(100 * big / n).toFixed(1)}% home wins ${(100 * homeW / n).toFixed(1)}% draws ${(100 * draws / n).toFixed(1)}%`);
  console.log('score dist', Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}:${(100 * v / n).toFixed(1)}%`).join(' '));
  // league integrity: each team plays 2*(n-1) league matches, no duplicates
  for (const cid of S.active) {
    const c = S.comps[cid];
    if (c.kind !== 'league') continue;
    const cnt = {};
    const pairs = new Set();
    let dup = 0;
    for (const rd of c.rounds) for (const mid of rd.m) {
      const m = S.matches[mid];
      cnt[m.h] = (cnt[m.h] || 0) + 1; cnt[m.a] = (cnt[m.a] || 0) + 1;
      const k = m.h + '>' + m.a;
      if (pairs.has(k)) dup++;
      pairs.add(k);
    }
    const vals = Object.values(cnt);
    const tab = E.sortTable(c.table, c.teams);
    const played = tab.map((r) => r.p);
    console.log(`${c.name} ${c.season}: rounds ${c.rounds.length}, games/team ${Math.min(...vals)}-${Math.max(...vals)}, dup ${dup}, played ${Math.min(...played)}-${Math.max(...played)}, leader ${S.teams[tab[0].id].n} ${tab[0].pts}pts, done=${c.done}`);
  }
  for (const cid of S.active) {
    const c = S.comps[cid];
    if (c.kind === 'league') continue;
    console.log(`${c.kind} ${c.name} ${c.season}: rounds ${c.rounds.length} done=${c.done} champ=${c.champion ? S.teams[c.champion].n : '-'} ${c.rounds.map((r) => r.name).slice(-3).join('/')}`);
  }
  console.log('history', S.hist.slice(-12).map((h) => `${h.name} ${h.season}: ${h.chN}`).join(' | '));
  const ut = S.teams[S.user.team];
  console.log('user', ut.n, 'record', JSON.stringify(S.coach.rec), 'conf', Math.round(S.board.conf), 'inbox', S.inbox.length, 'news', S.news.length);
  // injuries for user team over the period
  const injMsgs = S.inbox.filter((m) => m.type === 'injury').length;
  console.log('injury-recovery msgs', injMsgs, 'transfers logged', S.tr.log.length);
  const counts = Object.values(S.tr.counts);
  console.log('transfers per team: min', Math.min(...counts), 'avg', (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1));
  const lc = S.active.map((id) => S.comps[id]).find((c) => c.kind === 'league'); const ts = lc ? E.topScorers(lc.id, 5) : [];
  console.log('top scorers', ts.map((r) => `${r.name} ${r.goals}`).join(', '));
  const json = E.serializeState();
  console.log('save size', (json.length / 1e6).toFixed(2), 'MB');
})().catch((e) => { console.error(e); process.exit(1); });
