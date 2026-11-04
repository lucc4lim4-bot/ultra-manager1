// headless: new dribbles, placed shot, keeper rush, goal celebration combos
const fs = require('fs'); const path = require('path');
const E = require('../dist/g2d_test.js');
E.DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/data/era2026.json'), 'utf8'));
(async () => {
  await E.createWorld({ era: 2026, mode: 'ultra', coachName: 'T', coachAge: 40, seed: 11, zoeira: false });
  const S = E.S; E.startCareer(E.initialOffers('ultra')[0].team, () => {});
  let m = null, g = 0; while (!m && g++ < 400) { const r = E.advanceDay(); if (r.blocked) m = r.blocked; }
  const D = E.Game2D;
  let bad = 0;
  // 1. dribbles
  const kinds = {};
  for (let i = 0; i < 60; i++) {
    const st = E.startMatchState(m, { user: S.user.team });
    const G = D._create(m, st, 6, { auto: true }); G.state = 'play'; G.restartHold = false;
    const c = G.players.find((p) => p.team === 0 && !p.gk); c.stars = 5; c.skCD = 0; c.sk = null;
    G.ball.owner = c; G.ball.last = c; c.x = 50 * 0.68; c.y = 50;
    D._skill(c, { x: 0, y: -1 }, 'feint');
    if (c.sk) kinds[c.sk.kind] = (kinds[c.sk.kind] || 0) + 1;
    for (let k = 0; k < 90; k++) D._step(1 / 60);
    if (!isFinite(c.x) || !isFinite(c.y)) bad++;
  }
  console.log('dribbles', JSON.stringify(kinds), 'bad', bad);
  // 2. placed shot vs normal
  const res = { n: [0, 0], p: [0, 0] };
  for (const placed of [false, true]) {
    for (let i = 0; i < 150; i++) {
      const st = E.startMatchState(m, { user: S.user.team });
      const G = D._create(m, st, 6, { auto: true }); G.state = 'play'; G.restartHold = false;
      const c = G.players.find((p) => p.team === 0 && !p.gk); c.sho = 78;
      c.x = G.W ? 0 : 34 + (i % 5) - 2; c.y = 20; G.ball.owner = c; G.ball.last = c;
      G.ball.x = c.x; G.ball.y = c.y;
      const before = st.score[0];
      D._shoot(c, 0, 0.7, null, placed);
      for (let k = 0; k < 200 && G.state === 'play'; k++) D._step(1 / 60);
      res[placed ? 'p' : 'n'][0] += st.score[0] > before ? 1 : 0; res[placed ? 'p' : 'n'][1]++;
    }
  }
  console.log('goals normal', res.n.join('/'), 'placed', res.p.join('/'));
  // 3. keeper rush + celebrations
  let rush = 0, celeb = {}, stuck = 0;
  for (let i = 0; i < 40; i++) {
    const st = E.startMatchState(m, { user: S.user.team });
    const G = D._create(m, st, 6, { auto: true });
    G.state = 'play'; G.restartHold = false;
    for (let k = 0; k < 60 * 120 && G.state === 'play'; k++) { D._step(1 / 60); if (k % 200 === 0) { D._gkRush(); if (G.gkRush > 0) rush++; } }
    for (let k = 0; k < 60 * 60 * 3 && G.state !== 'goal'; k++) D._step(1 / 60);
    if (G.state === 'goal' && G.celebr) {
      G.celebr.scorer.team === 0 || (G.celebr.scorer = G.players.find((p) => p.team === 0 && !p.gk));
      const seqs = [['shoot','shoot','shoot'], ['super','super','super','super'], ['spin','feint','spin','feint'], ['shoot','pass','lob'], ['pass','shoot']];
      const sq = seqs[i % seqs.length];
      for (const kk of sq) { D._celeb(kk); D._step(1 / 60); }
      celeb[G.celebr.kind] = (celeb[G.celebr.kind] || 0) + 1;
      for (let k = 0; k < 60 * 6 && G.state === 'goal'; k++) D._step(1 / 60);
      if (G.state === 'goal') stuck++;
    }
  }
  console.log('rush', rush, 'celeb', JSON.stringify(celeb), 'stuck', stuck);
  // live tactic changes keep the match running
  let tbad = 0;
  for (const f of ['3-4-1-2', '5-2-3', '4-2-2-2', '4-4-2']) {
    const st = E.startMatchState(m, { user: S.user.team });
    const G = D._create(m, st, 6, { auto: true }); G.state = 'play'; G.restartHold = false;
    for (let k = 0; k < 600; k++) D._step(1 / 60);
    const ch = D._liveTactic({ form: f, ment: 2, sty: 'press' });
    for (let k = 0; k < 60 * 90; k++) D._step(1 / 60);
    const sl = G.players.filter((p) => p.side === G.userSide && !p.out).map((p) => p.pos).sort().join(',');
    const want = FMT(f);
    if (G.players.some((p) => !isFinite(p.x) || !isFinite(p.y))) tbad++;
    console.log('live tactic', f, 'changed', ch, 'sprites', sl === want ? 'ok' : sl + ' vs ' + want);
  }
  function FMT(f) { return E.FORMATIONS[f].map((x) => x[0]).sort().join(','); }
  process.exit(bad || stuck || tbad ? 1 : 0);
})();
