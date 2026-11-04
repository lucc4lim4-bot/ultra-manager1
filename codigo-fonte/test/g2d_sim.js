// headless AI-vs-AI runs of the playable 2D match, for calibration and stuck-state detection
const fs = require('fs');
const path = require('path');
const E = require('../dist/g2d_test.js');
const N = +(process.argv[2] || 20);
const minutes = +(process.argv[3] || 6);
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era2026.json'), 'utf8'));
(async () => {
  await E.createWorld({ era: 2026, mode: process.env.MODE || 'ultra', coachName: 'T', coachAge: 40, seed: 7, zoeira: process.env.ZOEIRA === '1' });
  const S = E.S;
  const offers = E.initialOffers(process.env.MODE || 'ultra');
  E.startCareer(offers[0].team, () => {});
  let m = null, guard = 0;
  while (!m && guard++ < 400) { const r = E.advanceDay(); if (r.blocked) m = r.blocked; }
  console.log('match', E.teamName(m.h), 'x', E.teamName(m.a));
  const tot = { goals: 0, sh: [0, 0], sot: [0, 0], fo: 0, yc: 0, rc: 0, cor: 0, pens: 0, draws: 0, homeW: 0 };
  const dbg = {};
  const scores = {};
  const t0 = Date.now();
  let stuckMax = 0;
  for (let i = 0; i < N; i++) {
    const st = E.startMatchState(m, { user: S.user.team });
    const G = E.Game2D._create(m, st, minutes, { auto: true });
    let steps = 0, still = 0, lastX = 0, lastY = 0, states = {};
    while (!G.over && steps < 60 * 60 * 40) {
      E.Game2D._step(1 / 60);
      steps++;
      states[G.state] = (states[G.state] || 0) + 1;
      const b = G.ball;
      if (Math.abs(b.x - lastX) < 0.01 && Math.abs(b.y - lastY) < 0.01 && G.state === 'play') still++; else still = 0;
      stuckMax = Math.max(stuckMax, still);
      lastX = b.x; lastY = b.y;
    }
    const sc = st.score;
    for (const k in G.dbg || {}) dbg[k] = (dbg[k] || 0) + G.dbg[k];
    tot.goals += sc[0] + sc[1];
    tot.sh[0] += st.stats.sh[0]; tot.sh[1] += st.stats.sh[1];
    tot.sot[0] += st.stats.sot[0]; tot.sot[1] += st.stats.sot[1];
    tot.fo += st.stats.fo[0] + st.stats.fo[1]; tot.yc += st.stats.yc[0] + st.stats.yc[1]; tot.rc += st.stats.rc[0] + st.stats.rc[1];
    tot.cor += st.stats.cor[0] + st.stats.cor[1];
    if (sc[0] === sc[1]) tot.draws++; else if (sc[0] > sc[1]) tot.homeW++;
    const k = sc[0] + '-' + sc[1];
    scores[k] = (scores[k] || 0) + 1;
    if (i < 3) console.log(`#${i} ${sc[0]}-${sc[1]} steps ${steps} poss ${st.stats.poss} sh ${st.stats.sh} sot ${st.stats.sot} fo ${st.stats.fo} cor ${st.stats.cor} ev ${st.ev.filter((e) => e.t === 'goal').map((e) => e.min + "'" + (e.p ? '' : '(og)')).join(' ')} states ${JSON.stringify(states)}`);
  }
  console.log(`N=${N} ${minutes}min: avg goals ${(tot.goals / N).toFixed(2)} | shots ${(tot.sh[0] / N).toFixed(1)}/${(tot.sh[1] / N).toFixed(1)} sot ${(tot.sot[0] / N).toFixed(1)}/${(tot.sot[1] / N).toFixed(1)} | fouls ${(tot.fo / N).toFixed(1)} yc ${(tot.yc / N).toFixed(2)} rc ${(tot.rc / N).toFixed(2)} cor ${(tot.cor / N).toFixed(1)} | home W ${tot.homeW} D ${tot.draws} | ms/match ${((Date.now() - t0) / N).toFixed(0)} | max still frames ${stuckMax}`);
  console.log('per match:', Object.entries(dbg).map(([k, v]) => `${k} ${(v / N).toFixed(2)}`).join(' | '));
  console.log('scores', Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join(' '));
})();
