/* ===================== youth academy & scouting ===================== */
const SCOUT_COUNTRIES = ['BRA', 'ARG', 'URU', 'COL', 'CHI', 'PAR', 'ECU', 'PER', 'VEN', 'MEX', 'USA', 'CAN', 'ENG', 'FRA', 'ESP', 'POR', 'GER',
  'ITA', 'NED', 'BEL', 'CRO', 'SRB', 'DEN', 'SWE', 'NOR', 'POL', 'CZE', 'AUT', 'SUI', 'TUR', 'GRE', 'UKR', 'SCO', 'IRL', 'WAL', 'NGA',
  'GHA', 'CIV', 'SEN', 'CMR', 'MAR', 'ALG', 'EGY', 'RSA', 'MLI', 'JPN', 'KOR', 'AUS', 'KSA', 'ISL'];
const COUNTRY_TALENT = { BRA: 5, ARG: 5, FRA: 5, ESP: 5, ENG: 4.6, GER: 4.6, POR: 4.6, NED: 4.3, BEL: 4.1, ITA: 4.2, URU: 4, COL: 3.7, CRO: 3.8,
  NGA: 3.7, SEN: 3.6, CIV: 3.6, MAR: 3.6, DEN: 3.4, SRB: 3.4, SUI: 3.2, AUT: 3.2, MEX: 3.3, USA: 3.3, JPN: 3.3, ECU: 3.4, GHA: 3.5, CMR: 3.4,
  TUR: 3.2, POL: 3.1, NOR: 3.2, SWE: 3.1, CZE: 3, UKR: 3.1, KOR: 3.1, CHI: 3, PAR: 3, ALG: 3.1, MLI: 3.2, SCO: 2.8, IRL: 2.8, GRE: 2.8, EGY: 2.9,
  PER: 2.7, VEN: 2.7, CAN: 2.9, RSA: 2.8, AUS: 2.8, KSA: 2.6, WAL: 2.6, ISL: 2.5 };
const SCOUT_FIRST = ['Paulo', 'Roberto', 'Marcos', 'André', 'Sérgio', 'Luís', 'Carlos', 'Fernando', 'Hugo', 'Rafael', 'Diego', 'Martin', 'Klaus', 'Pierre', 'Enzo', 'Jorge', 'Tomás', 'Victor'];
const SCOUT_LAST = ['Almeida', 'Mendes', 'Rocha', 'Ferraz', 'Bianchi', 'Moreau', 'Becker', 'Santos', 'Ortega', 'Navarro', 'Lima', 'Costa', 'Ribeiro', 'Weber', 'Duarte'];

function scoutCost(level) { return roundMoney(level * level * 60e3 * moneyFactor()); }
function availableScouts() {
  if (!S.youth.market || S.date - (S.youth.marketD || 0) > 30) {
    S.youth.market = Array.from({ length: 5 }, () => {
      const lvl = rint(1, 5);
      return { id: nextId('sc'), n: `${pick(SCOUT_FIRST)} ${pick(SCOUT_LAST)}`, lvl, cost: scoutCost(lvl) };
    });
    S.youth.marketD = S.date;
  }
  return S.youth.market;
}
function hireScout(id) {
  const t = S.teams[S.user.team];
  const sc = (S.youth.market || []).find((x) => x.id === id);
  if (!sc) return 'Olheiro indisponível.';
  if (S.youth.scouts.length >= 4) return 'Você já tem 4 olheiros (máximo).';
  if (t.budget < sc.cost) return 'Orçamento insuficiente.';
  t.budget -= sc.cost;
  S.youth.scouts.push({ ...sc, country: null, until: 0, found: 0 });
  S.youth.market = S.youth.market.filter((x) => x.id !== id);
  return `${sc.n} foi contratado como olheiro.`;
}
function fireScout(id) { S.youth.scouts = S.youth.scouts.filter((s) => s.id !== id); }
function assignScout(id, country, months) {
  const sc = S.youth.scouts.find((s) => s.id === id);
  if (!sc) return;
  sc.country = country;
  sc.until = S.date + months * 30;
  sc.start = S.date;
}
function scoutingWeek() {
  if (S.zoeira || S.mode === 'national' || !S.user.team || S.coach.unemployed) return;
  for (const sc of S.youth.scouts) {
    if (!sc.country) continue;
    if (sc.until && S.date > sc.until) {
      addInbox('scout', sc.n, `Missão encerrada: ${natName(sc.country)}`, `${sc.n} terminou a observação em ${natName(sc.country)} e aguarda uma nova missão.`);
      sc.country = null;
      continue;
    }
    const talent = COUNTRY_TALENT[sc.country] || 2.5;
    if (rnd() > 0.22 + sc.lvl * 0.04) continue;
    const n = rnd() < 0.3 ? 2 : 1;
    const found = [];
    for (let i = 0; i < n; i++) {
      const age = rint(14, 16);
      const ovrV = clamp(Math.round(38 + rnd() * 10 + sc.lvl * 1.4 + (age - 14) * 2.5 + talent), 38, 62);
      const potHi = clamp(Math.round(58 + talent * 3.6 + sc.lvl * 2.2 + gauss() * 6), ovrV + 6, 94);
      const p = generatePlayer({ nat: sc.country, age, ovr: ovrV, potBoost: potHi - ovrV });
      p.yth = -1; // scouted, not signed
      p.t = 0;
      const err = (6 - sc.lvl) * 2;
      const rep = { id: nextId('rep'), pid: p.id, sc: sc.id, scN: sc.n, d: S.date, potLo: clamp(p.pot - rint(0, err), p.o, 99), potHi: clamp(p.pot + rint(0, err), p.o, 99) };
      S.youth.reports.unshift(rep);
      found.push(p);
      sc.found++;
    }
    addInbox('scout', sc.n, `Relatório de ${natName(sc.country)}`, `Encontrei ${found.length === 1 ? 'um jovem promissor' : 'dois jovens promissores'}: ${found.map((p) => `${p.n} (${p.age} anos, ${POS_PT[p.p]})`).join(' e ')}. Veja os detalhes na Academia.`);
  }
  // prune old reports
  while (S.youth.reports.length > 24) {
    const r = S.youth.reports.pop();
    const p = S.players[r.pid];
    if (p && p.yth === -1) delete S.players[p.id];
  }
}
function signProspect(repId) {
  const r = S.youth.reports.find((x) => x.id === repId);
  if (!r) return 'Relatório não encontrado.';
  const p = S.players[r.pid];
  if (!p) return 'Jogador indisponível.';
  if (S.youth.squad.length >= 30) return 'A base já tem 30 jogadores.';
  p.yth = S.user.team;
  p.t = 0;
  p.ct = yearOf(S.date) + 3;
  p.w = 300;
  S.youth.squad.push(p.id);
  S.youth.reports = S.youth.reports.filter((x) => x.id !== repId);
  return `${p.n} entrou para a base!`;
}
function dismissProspect(repId) {
  const r = S.youth.reports.find((x) => x.id === repId);
  if (!r) return;
  const p = S.players[r.pid];
  if (p && p.yth === -1) delete S.players[p.id];
  S.youth.reports = S.youth.reports.filter((x) => x.id !== repId);
}
function promoteYouth(pid) {
  const p = S.players[pid];
  if (!p) return 'Jogador não encontrado.';
  if (p.age < 16) return 'O jogador precisa ter pelo menos 16 anos.';
  if (squadOf(S.user.team).length >= 36) return 'O elenco principal está cheio (36).';
  S.youth.squad = S.youth.squad.filter((x) => x !== pid);
  p.yth = 0;
  movePlayer(p, S.user.team, { ct: seasonEndYear() + 3, w: Math.max(1500, Math.round(wageDemand(p, S.teams[S.user.team]) * 0.6)) });
  return `${p.n} foi promovido ao elenco principal!`;
}
function releaseYouth(pid) {
  S.youth.squad = S.youth.squad.filter((x) => x !== pid);
  const p = S.players[pid];
  if (p) { p.yth = 0; p.t = 0; }
}
function youthPlayers() { return S.youth.squad.map((id) => S.players[id]).filter(Boolean); }
