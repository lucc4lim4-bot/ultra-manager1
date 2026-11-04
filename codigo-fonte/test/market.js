// node test: free-agent market realism, AI renewals, transfer volume and AI signing of free agents
// usage: node test/market.js [era] [league] [days]
const fs = require('fs');
const path = require('path');
const E = require('../dist/engine_test.js');
const era = +(process.argv[2] || 2026);
const league = process.argv[3] || 'ENG';
const days = +(process.argv[4] || 1200);
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era' + era + '.json'), 'utf8'));
(async () => {
  await E.createWorld({ era, mode: 'normal', coachName: 'Teste', coachAge: 40, seed: 33 });
  const offers = E.initialOffers('normal');
  const o = offers.find((x) => x.league === league) || offers[0];
  E.startCareer(o.team, () => {});
  let S = E.S;
  console.log('user', S.teams[S.user.team].n, 'start', E.fmtDate(S.date));
  const free = () => Object.values(S.players).filter((p) => !p.t && !p.natOnly && !p.ret && !p.yth).sort((a, b) => b.o - a.o);
  const snap = (label) => {
    const f = free();
    const top = f.slice(0, 5).map((p) => `${p.n} ${p.o}/${p.age}a`).join(', ');
    console.log(`[${label}] livres: ${f.length} | >=80: ${f.filter((p) => p.o >= 80).length} | >=75: ${f.filter((p) => p.o >= 75).length} | >=70: ${f.filter((p) => p.o >= 70).length} | top: ${top}`);
  };
  snap('inicio');
  const end = S.date + days;
  let guard = 0, lastY = -1, logged = 0;
  const t0 = Date.now();
  while (S.date < end && guard++ < 8000) {
    const r = E.advanceDay();
    if (r.blocked) { E.simulateMatch(r.blocked); continue; }
    if (S.pendingEnd) E.closeSeasonEnd(null);
    S = E.S;
    const t = E.ymd(S.date);
    if (t.m === 7 && t.d === 3 && lastY !== t.y) { lastY = t.y; snap('3/jul ' + t.y); }
    if (t.m === 9 && t.d === 15) { const k = 'sep' + t.y; if (!global[k]) { global[k] = 1; snap('15/set ' + t.y); } }
    if (t.m === 12 && t.d === 20) { const k = 'dec' + t.y; if (!global[k]) { global[k] = 1; snap('20/dez ' + t.y); } }
  }
  S = E.S;
  const log = S.tr.log;
  console.log('tempo', Math.round((Date.now() - t0) / 1000) + 's', 'dia', E.fmtDate(S.date));
  const tr = log.filter((x) => !x.loan && x.from), fr = log.filter((x) => !x.from), ln = log.filter((x) => x.loan);
  console.log('log (ultimas 400): compras', tr.length, '| livres contratados', fr.length, '| emprestimos', ln.length);
  console.log('exemplos livres:', fr.slice(0, 6).map((x) => `${x.n} ${x.o} -> ${E.teamName(x.to)}`).join('; '));
  // expiring contracts among the biggest players at the end of the season
  const all = Object.values(S.players).filter((p) => p.t && !p.natOnly);
  const star = all.filter((p) => p.o >= 80);
  console.log('craques 80+ com clube:', star.length, '| 80+ no ultimo ano de contrato:', star.filter((p) => p.ct && p.ct <= E.ymd(S.date).y + 1).length);
  console.log('OK');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
