// headless: direct free kicks at 18-28 m. Counts how many get past the wall (shot reaches the keeper area / goal) and goals.
const fs = require('fs'); const path = require('path');
const E = require('../dist/g2d_test.js');
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era2026.json'), 'utf8'));
(async () => {
  await E.createWorld({ era: 2026, mode: 'ultra', coachName: 'T', coachAge: 40, seed: 7 });
  const S = E.S; E.startCareer(E.initialOffers('ultra')[0].team, () => {});
  let m = null, g = 0; while (!m && g++ < 400) { const r = E.advanceDay(); if (r.blocked) m = r.blocked; }
  let n = 0, shots = 0, goals = 0, wallStops = 0, saves = 0, offT = 0;
  for (let i = 0; i < 80; i++) {
    const st = E.startMatchState(m, { user: S.user.team });
    const G = E.Game2D._create(m, st, 6, { auto: true });
    for (let k = 0; k < 600; k++) E.Game2D._step(1 / 60); // settle
    G.state = 'play'; G.restartHold = false;
    const x = 34 + (Math.random() - 0.5) * 16, y = 18 + Math.random() * 10;
    E.Game2D._setPiece(0, x, y, 'free');
    const s0 = st.score[0], sh0 = st.stats.sh[0];
    let wallTouch = false;
    for (let k = 0; k < 60 * 14; k++) {
      E.Game2D._step(1 / 60);
      if (G.ball.shot && G.ball.shot.fk && G.ball.shot.t > 0.02 && G.ball.shot.t < 0.6) { /* in flight */ }
      if (G.state !== 'setpiece' && G.state !== 'play' && G.state !== 'goal') break;
      if (st.score[0] > s0) break;
    }
    n++; if (st.stats.sh[0] > sh0) shots++; if (st.score[0] > s0) goals++;
  }
  console.log(`faltas ${n} | chutes diretos ${shots} | gols ${goals}`);
})();
