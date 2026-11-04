// headless checks of the penalty kick and the shoot-out of the playable 2D match (computer on both sides)
const fs = require('fs');
const path = require('path');
const E = require('../dist/g2d_test.js');
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era2026.json'), 'utf8'));
(async () => {
  await E.createWorld({ era: 2026, mode: 'ultra', coachName: 'T', coachAge: 40, seed: 11, zoeira: false });
  const S = E.S;
  const offers = E.initialOffers('ultra');
  E.startCareer(offers[0].team, () => {});
  let m = null, guard = 0;
  while (!m && guard++ < 400) { const r = E.advanceDay(); if (r.blocked) m = r.blocked; }
  // penalties in play
  const out = { goal: 0, save: 0, miss: 0 };
  let resumed = 0, stuck = 0, slowStuck = 0;
  for (let i = 0; i < 300; i++) {
    const st = E.startMatchState(m, { user: S.user.team });
    const G = E.Game2D._create(m, st, 6, { auto: true });
    G.state = 'play'; G.restartHold = false;
    E.Game2D._startPenalty(i % 2);
    const before = st.score.slice();
    let steps = 0;
    while (G.state === 'penalty' && steps++ < 600) E.Game2D._step(1 / 60);
    if (G.state === 'penalty') { stuck++; continue; }
    const scored = st.score[0] + st.score[1] > before[0] + before[1];
    const k = scored ? 'goal' : (G.ball.owner && G.ball.owner.gk) ? 'save' : 'miss';
    out[k]++;
    E.Game2D._step(1 / 60); if (G.slow !== 1 && !G.shootout) slowStuck = (typeof slowStuck === 'number' ? slowStuck : 0) + 1;
    if (G.state === 'goal' || G.state === 'play' || G.state === 'setpiece') resumed++;
  }
  console.log('in-play penalties', JSON.stringify(out), 'resumed', resumed, 'stuck', stuck, 'slowStuck', slowStuck);
  // shoot-outs
  let ok = 0, bad = 0, lens = [];
  const wins = [0, 0];
  for (let i = 0; i < 200; i++) {
    const st = E.startMatchState(m, { user: S.user.team });
    const G = E.Game2D._create(m, st, 6, { auto: true });
    E.Game2D._startShootout();
    let steps = 0;
    while (!G.over && steps++ < 60 * 400) E.Game2D._step(1 / 60);
    const so = G.shootout;
    const a = so.kicks[0].filter(Boolean).length, c = so.kicks[1].filter(Boolean).length;
    const valid = G.over && st.pen && st.pen[0] !== st.pen[1] && st.penSeq.length === so.kicks[0].length + so.kicks[1].length && Math.abs(so.kicks[0].length - so.kicks[1].length) <= 1;
    if (valid) ok++; else { bad++; if (bad < 4) console.log('bad', G.state, JSON.stringify(so.kicks), st.pen); }
    lens.push(so.kicks[0].length + so.kicks[1].length);
    wins[a > c ? 0 : 1]++;
  }
  const conv = lens.length;
  console.log('shoot-outs ok', ok, 'bad', bad, 'avg kicks', (lens.reduce((x, y) => x + y, 0) / conv).toFixed(1), 'max', Math.max(...lens), 'wins', wins);
})();
