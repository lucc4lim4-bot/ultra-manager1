// node test: how fast players develop in a season (by age, games played, loans)
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const era = +(process.argv[2] || 2026);
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era' + era + '.json'), 'utf8'));
(async () => {
  await E.createWorld({ era, mode: 'normal', coachName: 'Teste', coachAge: 40, seed: 7 });
  let S = E.S;
  const offers = E.initialOffers('normal');
  E.startCareer(offers[0].team, () => {});
  const ut = S.teams[S.user.team];
  // loan two youngsters of the user club out at the start
  const young = E.squadOf(ut.id).filter((p) => p.age <= 21).sort((a, b) => a.o - b.o).slice(0, 2);
  const inLeague = new Set(S.active.map((id) => S.comps[id]).filter((c) => c.kind === 'league').flatMap((c) => c.teams));
  const lowClubs = Object.values(S.teams).filter((t) => !t.isNat && !t.ext && t.id !== ut.id && t.sq.length > 15 && inLeague.has(t.id) && (S.normal.find((l) => l.teams.includes(t.id)) || {}).cal !== 'SA');
  for (const p of young) {
    const club = lowClubs.filter((t) => E.teamRating(t.id) <= p.o + 2 && E.teamRating(t.id) >= p.o - 8)[0];
    if (club) { E.executeTransfer(p, club.id, 0, { loanFrom: ut.id, until: E.seasonEndDay() }); console.log('loan', p.n, p.age, p.o, '->', club.n); }
  }
  const snap = {};
  for (const id in S.players) { const p = S.players[id]; if (p.t) snap[id] = { o: p.o, age: p.age, pot: p.pot, t: p.t, loan: !!p.loan }; }
  const avgTop = () => { const r = Object.values(S.teams).filter((t) => !t.isNat && !t.ext && t.sq.length).map((t) => E.teamRating(t.id)); return (r.reduce((a, b) => a + b, 0) / r.length).toFixed(2); };
  console.log('start', E.fmtDate(S.date), 'avg club rating', avgTop());
  const endDay = S.date + 368;
  let guard = 0;
  const apps = {};
  while (S.date < endDay && guard++ < 5000) {
    if (E.ymd(S.date).m === 6 && E.ymd(S.date).d === 29) for (const id in snap) { const p = S.players[id]; if (p) apps[id] = p.ay || 0; }
    const r = E.advanceDay();
    if (r.blocked) { E.simulateMatch(r.blocked); continue; }
    if (S.pendingEnd) E.closeSeasonEnd(null);
  }
  S = E.S;
  console.log('end', E.fmtDate(S.date), 'avg club rating', avgTop());
  const rows = {};
  for (const id in snap) {
    const p = S.players[id], s0 = snap[id];
    if (!p || s0.pot - s0.o < 6) continue;
    const a = s0.age <= 18 ? '<=18' : s0.age <= 20 ? '19-20' : s0.age <= 22 ? '21-22' : s0.age <= 24 ? '23-24' : s0.age <= 27 ? '25-27' : s0.age <= 30 ? '28-30' : '31+';
    const g = (apps[id] || 0) >= 20 ? 'plays' : (apps[id] || 0) >= 8 ? 'some' : 'bench';
    const k = a + ' ' + g;
    (rows[k] = rows[k] || []).push(p.o - s0.o);
  }
  const order = ['<=18', '19-20', '21-22', '23-24', '25-27', '28-30', '31+'];
  for (const a of order) console.log(a.padEnd(6), ['plays', 'some', 'bench'].map((g) => { const r = rows[a + ' ' + g] || []; return `${g} n=${String(r.length).padStart(4)} avg=${r.length ? (r.reduce((x, y) => x + y, 0) / r.length).toFixed(2) : '-'}`; }).join(' | '));
  const all = {};
  for (const id in snap) { const p = S.players[id], s0 = snap[id]; if (!p) continue; const a = s0.age <= 20 ? 'u21' : s0.age <= 24 ? '21-24' : s0.age <= 29 ? '25-29' : '30+'; (all[a] = all[a] || []).push(p.o - s0.o); }
  console.log('all players', Object.entries(all).map(([k, r]) => `${k}: ${(r.reduce((x, y) => x + y, 0) / r.length).toFixed(2)} (n=${r.length})`).join(' | '));
  for (const p of young) console.log('loaned', p.n, snap[p.id].o, '->', S.players[p.id] ? S.players[p.id].o : 'gone', 'apps', apps[p.id], 'now at', S.players[p.id] && S.teams[S.players[p.id].t].n);
  console.log('inbox', S.inbox.filter((m) => m.type === 'loan' || /Evolução/.test(m.subj || m.title || '')).map((m) => (m.subj || m.title) + ' — ' + m.body).join('\n'));
})();
