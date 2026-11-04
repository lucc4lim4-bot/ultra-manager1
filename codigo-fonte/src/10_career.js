/* ===================== career: inbox, news, board, coach, season end ===================== */
const FUTCOIN_TABLE = { UL1: 150, UL2: 50, UL3: 40, UL4: 30, CUPUL: 75, UCL: 100, UEL: 80, UECL: 60, LIB: 100, SULA: 80, MUN: 125, WC: 125, EURO: 100, COPA: 100, YOUTH: 10 };
function futcoinsFor(key) {
  if (FUTCOIN_TABLE[key] !== undefined) return FUTCOIN_TABLE[key];
  if (key.startsWith('CUP')) return MAIN_LEAGUES.has(key.slice(3)) || key === 'CUPUL' ? 75 : 50;
  if (key.startsWith('EST')) return BIG_STATES.has(key) ? 50 : 40; // state championships
  if (/^(ENG|ESP|GER|FRA|ITA|BRA|ARG|POR|NED)$/.test(key)) return 80;
  if (S.normal && leagueById(key)) return 60;
  if (/^(ENG|ESP|GER|FRA|ITA|BRA)2$/.test(key)) return 40;
  return 0;
}

// ---------------------------------------------------------------- inbox / news
function addInbox(type, from, subj, body, act) {
  if (S.presim) return;
  S.inbox.unshift({ id: nextId('msg'), d: S.date, type, from, subj, body, act: act || null, read: false });
  if (S.inbox.length > 120) S.inbox.length = 120;
}
function addNews(title, body, tag, teams, extra) {
  if (S.presim) return;
  const hot = extra && extra.hot;
  S.news.unshift(Object.assign({ id: nextId('news'), d: S.date, title, body, tag: tag || 'geral', teams: teams || [],
    likes: rint(80, 2400) * (hot ? 3 : 1), com: rint(5, 400) * (hot ? 3 : 1) }, extra || {}));
  if (S.news.length > 80) S.news.length = 80;
}
// headline + text for a match of the user's team, in the tone of a sports bulletin
function matchHeadline(m, uid) {
  const home = m.h === uid;
  const opp = home ? m.a : m.h;
  const gf = home ? m.hg : m.ag, ga = home ? m.ag : m.hg;
  const U = teamName(uid), O = teamName(opp);
  const side = home ? 0 : 1;
  const goals = (m.ev || []).filter((e) => e[1] === 'goal').sort((a, b) => a[0] - b[0]);
  const mine = goals.filter((e) => e[2] === side);
  const cnt = {};
  mine.forEach((e) => { if (e[3]) cnt[e[3]] = (cnt[e[3]] || 0) + 1; });
  const ranked = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const hat = ranked.find(([, n]) => n >= 3);
  const top = ranked.length ? pidName(+ranked[0][0]) : null;
  const firstAgainst = goals.length && goals[0][2] !== side;
  const last = goals[goals.length - 1];
  const late = last && last[0] >= 85 && last[2] === side && Math.abs(gf - ga) <= 1;
  const away = home ? '' : ' fora de casa';
  let t;
  if (m.pen) {
    const won = home ? m.pen[0] > m.pen[1] : m.pen[1] > m.pen[0];
    t = won ? pick([`Nos pênaltis, ${U} elimina ${tA(opp)}`, `${U} vence ${tA(opp)} nos pênaltis e avança`]) : pick([`${U} cai nos pênaltis diante ${tA(opp, 'do')}`, `Pênaltis: ${O} elimina ${tA(uid)}`]);
  } else if (gf > ga) {
    if (hat) t = `Hat-trick de ${pidName(+hat[0])}! ${U} vence ${tA(opp)}`;
    else if (gf - ga >= 3) t = pick([`${U} atropela ${tA(opp)}: ${gf} a ${ga}`, `Show de bola: ${U} goleia ${tA(opp)}`, `${U} passeia${away} e faz ${gf} a ${ga} ${tA(opp, 'no')}`]);
    else if (firstAgainst) t = pick([`Virada! ${U} supera ${tA(opp)}${away}`, `${U} sai atrás, mas vira sobre ${tA(opp)}`]);
    else if (late && last[3]) t = `No fim, ${pidName(last[3])} garante a vitória ${tA(uid, 'do')}`;
    else t = pick([top ? `Com gol de ${top}, ${U} vence ${tA(opp)}` : `${U} vence ${tA(opp)}`, `${U} bate ${tA(opp)}${away}`, `${U} supera ${tA(opp)} e soma três pontos`]);
  } else if (gf === ga) {
    if (gf === 0) t = pick([`${U} e ${O} ficam no 0 a 0`, `Sem gols: ${U} e ${O} não saem do zero`]);
    else if (late) t = `${U} arranca o empate no fim contra ${tA(opp)}`;
    else t = pick([`${U} e ${O} empatam em ${gf} a ${ga}`, `${U} fica no empate com ${tA(opp)}`]);
  } else if (ga - gf >= 3) t = pick([`${O} atropela ${tA(uid)}`, `Noite para esquecer: ${U} leva ${ga} ${tA(opp, 'do')}`]);
  else t = pick([`${U} perde para ${tA(opp)}`, `${O} vence ${tA(uid)}`, `Derrota: ${U} cai diante ${tA(opp, 'do')}${away}`]);
  const comp = S.comps[m.c];
  const rd = comp && comp.rounds && comp.rounds[m.r];
  const scorers = (k) => {
    const c2 = {};
    goals.filter((e) => e[2] === k).forEach((e) => { const nm = e[3] ? pidName(e[3]) : 'contra'; c2[nm] = (c2[nm] || 0) + 1; });
    return Object.entries(c2).map(([nm, n]) => (n > 1 ? `${nm} (${n})` : nm)).join(', ');
  };
  let body = `${teamName(m.h)} ${m.hg} x ${m.ag} ${teamName(m.a)}${m.pen ? ` (pênaltis ${m.pen[0]} x ${m.pen[1]})` : ''} · ${comp ? comp.name : ''}${rd ? `, ${rd.name}` : ''}.`;
  const sh = scorers(0), sa = scorers(1);
  if (sh || sa) body += ` Gols: ${[sh && `${teamShort(m.h)} ${sh}`, sa && `${teamShort(m.a)} ${sa}`].filter(Boolean).join(' · ')}.`;
  if (m.rt) {
    const best = Object.entries(m.rt).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 7.5) body += ` Destaque da partida: ${pidName(+best[0])}, nota ${best[1].toFixed(1)}.`;
  }
  return [t, body];
}
function streakOf(id, pred) {
  const res = lastResults(id, 12).slice().reverse();
  let n = 0;
  for (const mm of res) { if (pred(resultLetter(mm, id))) n++; else break; }
  return n;
}
function unreadCount() { return S.inbox.filter((m) => !m.read).length; }

// ---------------------------------------------------------------- board & coach
function userLeagueTeams() {
  const uid = S.user.team;
  if (S.mode === 'ultra') return S.ultra.div.find((d) => d.includes(uid)) || [];
  if (S.mode === 'normal') { const lg = S.normal.find((l) => l.teams.includes(uid) || l.bank.includes(uid)); return lg ? (lg.teams.includes(uid) ? lg.teams : lg.bank) : []; }
  return [];
}
function setBoardObjective() {
  const uid = S.user.team;
  if (!uid) return;
  if (S.mode === 'national') {
    const r = nationRating(S.teams[uid].code);
    S.board.obj = r >= 82 ? 'Brigar por títulos' : r >= 76 ? 'Chegar às fases finais dos torneios' : 'Classificar para os torneios e fazer bons jogos';
    S.board.objRank = 0;
    return;
  }
  const teams = userLeagueTeams();
  const sorted = teams.slice().sort(by((id) => teamRating(id), -1));
  const rank = sorted.indexOf(uid) + 1;
  const n = teams.length || 20;
  let obj, target;
  if (rank <= 2) { obj = 'Ser campeão da liga'; target = 1; }
  else if (rank <= Math.ceil(n * 0.25)) { obj = S.mode === 'normal' ? 'Classificar para uma competição continental' : 'Terminar entre os 4 primeiros'; target = Math.ceil(n * 0.25); }
  else if (rank <= Math.ceil(n * 0.6)) { obj = 'Terminar na primeira metade da tabela'; target = Math.ceil(n / 2); }
  else {
    const lg = S.mode === 'normal' && S.normal.find((l) => l.teams.includes(uid));
    obj = lg && !lg.down ? 'Terminar longe das últimas posições' : 'Evitar o rebaixamento'; target = n - 3;
  }
  S.board.obj = obj; S.board.objRank = target;
}
function expectedPoints(myR, oppR, home) {
  const d = myR - oppR + (home ? 2 : 0);
  const pw = 1 / (1 + Math.exp(-d / 4.2)) * 0.78;
  const pd = 0.26 - Math.min(0.12, Math.abs(d) * 0.008);
  return 3 * pw + pd;
}
function afterMatchHooks(m, st) {
  if (S.presim) return;
  const uid = S.user.team;
  if (!uid || S.coach.unemployed || (m.h !== uid && m.a !== uid)) {
    // headline results
    if (Math.abs(m.hg - m.ag) >= 5 && rnd() < 0.5 && !compIsMinor(S.comps[m.c])) {
      const w = m.hg > m.ag ? m.h : m.a, l = m.hg > m.ag ? m.a : m.h;
      const wg = Math.max(m.hg, m.ag), lg = Math.min(m.hg, m.ag);
      addNews(pick([`Goleada! ${teamName(w)} atropela ${tA(l)}`, `${teamName(w)} faz ${wg} ${tA(l, 'no')}`, `Massacre: ${teamName(w)} ${wg} x ${lg} ${teamName(l)}`]),
        `${teamName(m.h)} ${m.hg} x ${m.ag} ${teamName(m.a)} pela ${S.comps[m.c] ? S.comps[m.c].name : ''}. Resultado que mexe com a rodada.`, 'resultado', [w, l], { cat: 'Rodada', sc: [m.h, m.a, m.hg, m.ag] });
    }
    return;
  }
  const home = m.h === uid;
  const gf = home ? m.hg : m.ag, ga = home ? m.ag : m.hg;
  const opp = home ? m.a : m.h;
  const letter = resultLetter(m, uid);
  sponsAfterMatch(m);
  fanAfterMatch(m);
  const rec = S.coach.rec;
  rec.gf += gf; rec.ga += ga;
  if (letter === 'V') rec.w++; else if (letter === 'D') rec.l++; else rec.d++;
  const pts = letter === 'V' ? 3 : letter === 'E' ? 1 : 0;
  const myR = S.teams[uid].isNat ? nationRating(S.teams[uid].code) : teamRating(uid);
  const opR = S.teams[opp].isNat ? nationRating(S.teams[opp].code) : teamRating(opp);
  const exp = expectedPoints(myR, opR, home && !m.n);
  const delta = (pts - exp) * 2.4;
  S.board.conf = clamp(S.board.conf + delta, 0, 100);
  S.coach.rating = clamp(S.coach.rating + (pts - exp) * 0.9, 10, 99);
  S.coach.rep = clamp(S.coach.rep + (pts - exp) * 0.25, 1, 99);
  // playing-time counters
  if (!S.teams[uid].isNat) {
    const playedIds = new Set(Object.keys(st.mins).map(Number));
    for (const p of squadOf(uid)) {
      if (playedIds.has(p.id)) { p.cnp = 0; if (p.promise) p.promise = Math.max(0, p.promise - 1); }
      else if (available(p, m.d)) p.cnp = (p.cnp || 0) + 1;
    }
  }
  // news about our match
  const [title, body] = matchHeadline(m, uid);
  addNews(title, body, 'clube', [uid, opp], { cat: 'Pós-jogo', sc: [m.h, m.a, m.hg, m.ag] });
  if (S.pl) plAfterMatch(m, st);
  checkFiring();
}
function checkFiring() {
  if (S.pl || S.noFire || S.coach.unemployed) return;
  const daysIn = S.date - S.seasonStart;
  if (S.board.conf < 12 && daysIn > 40) fireCoach('A diretoria perdeu a confiança no seu trabalho.');
  else if (S.board.conf < 25 && !S.flags.warned) {
    S.flags.warned = true;
    addInbox('board', 'Diretoria', 'Aviso da diretoria', `A diretoria está insatisfeita com os resultados. O objetivo é: ${S.board.obj}. Melhore o desempenho ou você pode ser demitido.`);
  }
  if (S.board.conf > 45) S.flags.warned = false;
}
function fireCoach(reason) {
  const t = S.teams[S.user.team];
  S.coach.hist.push({ team: t.id, n: t.n, from: S.flags.jobStart || S.seasonStart, to: S.date, why: 'Demitido' });
  S.coach.unemployed = true;
  S.coach.rep = clamp(S.coach.rep - 6, 1, 99);
  addInbox('board', 'Diretoria', 'Você foi demitido', `${reason} Seu contrato com ${tA(t)} foi encerrado. Procure um novo clube no Mercado de Trabalho.`);
  addNews(`${t.n} demite ${S.coach.name}`, `Após resultados abaixo do esperado, ${tA(t)} anunciou a saída do técnico ${S.coach.name}. A diretoria já procura um substituto.`, 'clube', [t.id], { cat: 'Bastidores', hot: true });
  S.jobs = generateJobs(6);
}
function resignJob() {
  const t = S.teams[S.user.team];
  S.coach.hist.push({ team: t.id, n: t.n, from: S.flags.jobStart || S.seasonStart, to: S.date, why: 'Pediu demissão' });
  S.coach.unemployed = true;
  addNews(`${S.coach.name} pede demissão ${tA(t, 'do')}`, `O técnico ${S.coach.name} anunciou sua saída ${tA(t, 'do')}.`, 'clube', [t.id], { cat: 'Bastidores', hot: true });
  S.jobs = generateJobs(6);
}
function careerClubIds() {
  if (S.mode === 'ultra') return S.ultra.div.flat();
  if (S.mode === 'normal') return S.normal.flatMap((l) => l.teams.concat(l.bank));
  return [];
}
function teamPrestige(id) {
  const t = S.teams[id];
  const r = t.isNat ? nationRating(t.code) : teamRating(id);
  return clamp((r - 58) * 3.2, 1, 99);
}
function generateJobs(n) {
  let pool;
  if (S.mode === 'national') pool = Object.values(S.nations).filter((x) => x.tid && (S.wcPool || []).includes(x.code)).map((x) => x.tid);
  else pool = careerClubIds();
  pool = pool.filter((id) => id !== S.user.team);
  const rep = S.coach.rep;
  const scored = pool.map((id) => ({ id, d: Math.abs(teamPrestige(id) - rep) + rnd() * 18 }));
  scored.sort(by((x) => x.d));
  return scored.slice(0, n).map((x) => ({ team: x.id, since: S.date }));
}
function applyForJob(teamId) {
  const pr = teamPrestige(teamId);
  const p = 1 / (1 + Math.exp(-(S.coach.rep + 8 - pr) / 7));
  if (rnd() < p) { takeJob(teamId); return { ok: true, msg: `Você foi contratado ${tA(teamId, 'pelo')}!` }; }
  S.jobs = (S.jobs || []).filter((j) => j.team !== teamId);
  return { ok: false, msg: `${teamName(teamId)} preferiu outro treinador.` };
}
function takeJob(teamId) {
  const old = S.user.team;
  if (old && !S.coach.unemployed && old !== teamId) {
    const t = S.teams[old];
    S.coach.hist.push({ team: old, n: t.n, from: S.flags.jobStart || S.seasonStart, to: S.date, why: 'Saiu para outro clube' });
  }
  S.user.team = teamId;
  S.coach.unemployed = false;
  S.flags.jobStart = S.date;
  S.board.conf = 62;
  S.flags.warned = false;
  const t = S.teams[teamId];
  if (t.isNat) { autoCallUp(t.code, true); }
  const lu = autoLineup(t.isNat ? nationSquad(t.code) : squadOf(teamId), t.form || '4-3-3');
  t.xi = lu.xi; t.bench = lu.bench;
  S.seasonStart = S.date;
  setBoardObjective();
  if (S.pl) return;
  addInbox('board', 'Diretoria', `Bem-vindo ${tA(t, 'ao')}!`, `Seja bem-vindo, ${S.coach.name}. Nosso objetivo nesta temporada: ${S.board.obj}.`);
  addNews(`${t.n} anuncia ${S.coach.name}`, `${S.coach.name} é o novo técnico ${tA(t, 'do')} e chega com a missão de ${S.board.obj.toLowerCase()}.`, 'clube', [teamId], { cat: 'Bastidores' });
}

// ---------------------------------------------------------------- competitions finished
// competitions of the leagues far from the user's: their champions are reported together (publishDigest)
function userLeagueCountry() {
  const uid = S.user && S.user.team;
  const lg = uid && S.normal && S.normal.find((l) => l.teams.includes(uid) || l.bank.includes(uid));
  return lg ? lg.country : '';
}
const BIG_STATES = new Set(['ESTSP', 'ESTRJ', 'ESTMG', 'ESTRS']);
function compIsMinor(c) {
  if (c && c.key && (c.key.startsWith('EST') || c.key === 'COPINHA')) {
    if (c.teams && c.teams.includes(S.user.team)) return false;
    return userLeagueCountry() !== 'BRA' || !(BIG_STATES.has(c.key) || c.key === 'COPINHA');
  }
  if (S.mode !== 'normal' || !c || c.zone === 'UEFA' || ['LIB', 'SULA', 'MUN'].includes(c.key)) return false;
  const id = c.lgId || (c.key.startsWith('CUP') ? c.key.slice(3) : c.key);
  if (MAIN_LEAGUES.has(id) || !leagueById(id)) return false;
  return c.country !== userLeagueCountry();
}
function publishDigest() {
  const list = S.digest || [];
  S.digest = [];
  if (!list.length || S.presim) return;
  const isState = (x) => Object.values(UF_INFO).some((v) => v[0] === x.n);
  const states = list.filter(isState), rest = list.filter((x) => !isState(x));
  const leagues = rest.filter((x) => !/^Copa|Rock Cup/.test(x.n)), cups = rest.filter((x) => /^Copa|Rock Cup/.test(x.n));
  const line = (arr) => arr.map((x) => `${x.n}: ${x.chN}`).join(' · ');
  addNews(`Os campeões da temporada pelo mundo`, `${leagues.length ? `Ligas — ${line(leagues)}.` : ''}${cups.length ? ` Copas — ${line(cups)}.` : ''}${states.length ? ` Estaduais — ${line(states)}.` : ''}`.trim(),
    'titulo', list.slice(0, 4).map((x) => x.ch), { cat: 'Pelo mundo' });
}
function onCompFinished(c, entry) {
  if (S.presim) return;
  const uid = S.user.team;
  if (c.isQual) return;
  if (uid && !S.coach.unemployed && entry.ch === uid) {
    const coins = futcoinsFor(c.key);
    const trophy = { key: c.key, name: c.name, season: c.season, team: uid, teamN: teamName(uid), coins, d: S.date };
    S.coach.trophies.push(trophy);
    S.coach.rep = clamp(S.coach.rep + (coins >= 100 ? 10 : coins >= 75 ? 6 : 3), 1, 99);
    S.coach.rating = clamp(S.coach.rating + 5, 10, 99);
    S.board.conf = clamp(S.board.conf + 15, 0, 100);
    if (coins) awardFutcoins(coins, `${c.name} ${c.season}`);
    S.celebrate = S.celebrate || [];
    S.celebrate.push(trophy);
    if (c.key === 'MUN') addNews(`${TA(uid)} é campeão do mundo!`, `${TA(uid)} vence a final do Mundial de Clubes ${c.season}${entry.ru ? ` contra ${tA(entry.ru)}` : ''} e conquista o planeta sob o comando de ${S.coach.name}.`, 'titulo', [uid], { cat: 'Campeão', hot: true, cup: c.key });
    else addNews(pick([`É campeão! ${teamName(uid)} conquista ${cA(c.name)}`, `Festa: ${teamName(uid)} levanta a taça ${cA(c.name, 'do')}`]), `${teamName(uid)} conquista o título ${cA(c.name, 'do')} ${c.season}, sob o comando de ${S.coach.name}.`, 'titulo', [uid], { cat: 'Campeão', hot: true, cup: c.key });
  } else if (c.kind !== 'youth') {
    if (compIsMinor(c)) { (S.digest = S.digest || []).push({ n: c.name, s: c.season, ch: entry.ch, chN: entry.chN }); return; }
    if (c.key === 'MUN') addNews(`${entry.chN} é campeão do Mundial de Clubes`, `${TA(entry.ch)} conquista o Mundial de Clubes ${c.season}${entry.ru ? ` ao vencer ${tA(entry.ru)} na final` : ''}.`, 'titulo', [entry.ch], { cat: 'Campeão', hot: true, cup: c.key });
    else addNews(pick([`${entry.chN} conquista ${cA(c.name)}`, `${entry.chN} é campeão ${cA(c.name, 'do')}`]), `${TA(entry.ch)} é campeão ${cA(c.name, 'do')} ${c.season}${entry.ru ? `, à frente ${tA(entry.ru, 'do')}` : ''}.`, 'titulo', [entry.ch], { cat: 'Campeão', cup: c.key });
  }
}

// ---------------------------------------------------------------- messages
function welcomeMessages() {
  if (S.pl) { S.flags.jobStart = S.date; return; }
  const t = S.teams[S.user.team];
  S.flags.jobStart = S.date;
  addInbox('board', 'Diretoria', `Bem-vindo ${tA(t, 'ao')}`, `Olá, ${S.coach.name}! A diretoria ${tA(t, 'do')} confia no seu trabalho. Objetivo da temporada: ${S.board.obj}.`);
  if (!t.isNat) {
    addInbox('info', 'Departamento financeiro', 'Orçamento da temporada', `Orçamento para transferências: ${fmtMoney(t.budget)}. Folha salarial máxima: ${fmtMoney(t.wb)}/semana.`);
    if (S.mode !== 'national' && !S.zoeira) addInbox('scout', 'Academia', 'Rede de olheiros', 'Contrate olheiros na aba Academia para descobrir jovens talentos de 14 a 16 anos em até 50 países.');
  } else {
    addInbox('info', 'Federação', 'Convocação', 'Revise a convocação na aba Elenco. Você pode chamar até 26 jogadores.');
  }
}
function seasonStartMessages() {
  if (S.pl) { plSeasonStart(); return; }
  if (!S.user.team || S.coach.unemployed) return;
  const t = S.teams[S.user.team];
  addInbox('board', 'Diretoria', `Temporada ${seasonLabel(yearOf(S.date), userLeagueZone())}`, `Nova temporada! Objetivo: ${S.board.obj}. Orçamento: ${fmtMoney(t.budget)}.`);
}
function weeklyPlayerMessages() {
  const uid = S.user.team;
  if (S.pl || !uid || S.coach.unemployed || S.teams[uid].isNat) return;
  const sq = squadOf(uid);
  const sorted = sq.slice().sort(by((p) => p.o, -1));
  const cut = sorted[13] ? sorted[13].o : 0;
  for (const p of sq) {
    if (p.yth) continue;
    const recently = p.msgD && S.date - p.msgD < 75;
    if (!recently && p.o >= cut && p.age >= 20 && (p.cnp || 0) >= 7 && !p.promise && rnd() < 0.5) {
      p.msgD = S.date;
      p.mor = clamp((p.mor || 70) - 8, 0, 100);
      addInbox('player', p.n, 'Quero mais minutos', `Professor, estou há ${p.cnp} jogos sem entrar em campo. Sinto que posso ajudar o time e preciso jogar mais.`, { player: p.id, kind: 'minutes' });
    } else if (!recently && p.mor < 35 && p.o >= cut && rnd() < 0.25) {
      p.msgD = S.date;
      addInbox('player', p.n, 'Quero ser negociado', `Não estou feliz no clube. Gostaria que você me colocasse na lista de transferências.`, { player: p.id, kind: 'leave' });
    }
    if (p.promise === 0 && p.promiseD && S.date - p.promiseD > 40) { p.mor = clamp(p.mor - 15, 0, 100); p.promiseD = 0; }
  }
}
function answerPlayer(msgId, action) {
  const msg = S.inbox.find((m) => m.id === msgId);
  if (!msg || !msg.act) return '';
  const p = S.players[msg.act.player];
  msg.act.done = action;
  if (!p) return 'Jogador não está mais no clube.';
  if (action === 'promise') { p.promise = 4; p.promiseD = S.date; p.mor = clamp(p.mor + 10, 0, 100); return `Você prometeu mais oportunidades para ${p.n}.`; }
  if (action === 'list') { p.tl = 1; p.mor = clamp(p.mor + 6, 0, 100); return `${p.n} foi colocado na lista de transferências.`; }
  if (action === 'convince') {
    if (rnd() < 0.5) { p.mor = clamp(p.mor + 18, 0, 100); return `${p.n} aceitou ficar e está mais motivado.`; }
    p.mor = clamp(p.mor - 8, 0, 100); return `${p.n} não ficou convencido.`;
  }
  p.mor = clamp(p.mor - 10, 0, 100);
  return `Você ignorou o pedido de ${p.n}.`;
}

// ---------------------------------------------------------------- daily events
function dailyEvents() {
  aiTransferDay(false);
  const t = ymd(S.date);
  if (t.w === 1) { // Mondays
    weeklyPlayerMessages();
    fanWeek();
    if (S.pl) plWeek();
    weeklyLoans();
    if (S.coach.unemployed && rnd() < 0.6) { S.jobs = generateJobs(6); jobOfferMessage(); }
    scoutingWeek();
  }
  if (t.d === 1) sponsMonth();
  if (t.d === 1 && t.m === 1) contractReminders();
  if (t.d === 1 && (t.m === 1 || t.m === 4 || t.m === 10)) midSeasonDevelopment();
  if (t.d === 1 && [1, 3, 5, 9, 11].includes(t.m)) aiMidSeasonRenewals();
  if (t.w === 1) freeAgentWeek();
  posChangeDaily();
  if (t.d === 15 && t.m === 3 && userLeagueZone() === 'SA') contractReminders();
  // injury returns
  if (S.user.team && !S.coach.unemployed) {
    for (const p of teamPlayersFor(S.user.team)) {
      if (p.inj && p.inj === S.date) addInbox('injury', 'Departamento médico', `${p.n} está recuperado`, `${p.n} se recuperou de ${p.injN || 'lesão'} e está liberado para jogar.`);
    }
  }
  zoeiraDay();
  if (t.w === 3 && rnd() < 0.35) randomNews();
}
function fastDailyEvents() {
  aiTransferDay(true);
  const t = ymd(S.date);
  if (t.d === 1) sponsMonth();
  if (t.w === 1) { weeklyLoans(); freeAgentWeek(); }
  if (t.d === 1 && (t.m === 1 || t.m === 4 || t.m === 10)) midSeasonDevelopment();
  if (t.d === 1 && [1, 3, 5, 9, 11].includes(t.m)) aiMidSeasonRenewals();
  posChangeDaily();
  zoeiraDay();
}
function weeklyLoans() {
  for (const id in S.players) {
    const p = S.players[id];
    if (p.loan && p.loan.until < S.date) endLoan(p);
    // the form fades when a player stops playing (bench, injury, holidays)
    if (p.form && !(p.lp && S.date - p.lp <= 10)) p.form = Math.abs(p.form) < 0.5 ? 0 : p.form * 0.7;
  }
}
function contractReminders() {
  const uid = S.user.team;
  if (!uid || S.coach.unemployed || S.teams[uid].isNat) return;
  const exp = squadOf(uid).filter((p) => p.ct && p.ct <= seasonEndYear());
  if (exp.length) addInbox('contract', 'Departamento jurídico', 'Contratos terminando', `Estes jogadores têm contrato até o fim da temporada: ${exp.map((p) => p.n + (p.rn ? ' (renovação automática)' : '')).join(', ')}. Renove na Central de Elenco.`);
}
function jobOfferMessage() {
  const j = S.jobs && S.jobs[0];
  if (!j) return;
  addInbox('job', teamName(j.team), `Proposta de emprego: ${teamName(j.team)}`, `${TA(j.team)} quer conversar com você sobre o cargo de técnico.`, { job: j.team });
}
function randomNews() {
  const pool = S.news.length < 6 ? 0.9 : 0.4;
  if (rnd() > pool) return;
  const comps = S.active.map((id) => S.comps[id]).filter((c) => c && c.kind === 'league' && !c.done && !c.second && !compIsMinor(c));
  if (!comps.length) return;
  const c = pick(comps);
  const tab = sortTable(c.table, c.teams);
  if (!tab[0] || !tab[0].p) return;
  const ts = topScorers(c.id, 1)[0];
  const lead = tab[0], second = tab[1], lastT = tab[tab.length - 1];
  const opts = [
    () => addNews(pick([`${teamName(lead.id)} lidera ${cA(c.name)}`, `${teamName(lead.id)} segue firme na ponta`]), `${teamName(lead.id)} soma ${lead.pts} pontos em ${lead.p} jogos${second ? `, ${lead.pts - second.pts} à frente ${tA(second.id, 'do')}` : ''}.`, 'liga', [lead.id], { cat: 'Tabela' }),
    () => ts && addNews(pick([`${ts.name} dispara na artilharia`, `Artilheiro: ${ts.name} chega a ${ts.goals} gols`]), `${ts.name} (${teamName(ts.team)}) já balançou as redes ${ts.goals} vezes ${cA(c.name, 'no')}.`, 'liga', [ts.team], { cat: 'Tabela' }),
    () => addNews(`Pressão na lanterna ${cA(c.name, 'do')}`, `${teamName(lastT.id)} ocupa a última posição com ${lastT.pts} pontos e precisa reagir.`, 'liga', [lastT.id], { cat: 'Tabela' }),
    () => {
      const best = c.teams.map((id) => [id, streakOf(id, (r) => r !== 'D')]).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] >= 6) addNews(`${teamName(best[0])} chega a ${best[1]} jogos sem perder`, `A boa fase ${tA(best[0], 'do')} continua: são ${best[1]} partidas de invencibilidade.`, 'liga', [best[0]], { cat: 'Tabela' });
    },
    () => {
      const worst = c.teams.map((id) => [id, streakOf(id, (r) => r === 'D')]).sort((a, b) => b[1] - a[1])[0];
      if (worst && worst[1] >= 4) addNews(`Crise: ${teamName(worst[0])} perde a ${worst[1]}ª seguida`, `O momento é delicado ${tA(worst[0], 'no')}, que acumula ${worst[1]} derrotas consecutivas.`, 'liga', [worst[0]], { cat: 'Tabela' });
    },
  ];
  pick(opts)();
}

// ---------------------------------------------------------------- zoeira
function scheduleZoeira99(y, zone) {
  if (!S.zoeira) return;
  S.z99 = {};
  const ids = activeClubIds();
  for (const id of ids) S.z99[id] = dayOf(y, 9, 1) + rint(0, 200);
}
function zoeiraDay() {
  if (!S.zoeira || !S.z99) return;
  for (const id in S.z99) {
    if (S.z99[id] !== S.date) continue;
    const sq = squadOf(+id);
    if (!sq.length) continue;
    const p = pick(sq);
    p.o = Math.max(p.o, 99); p.pot = Math.max(p.pot, 99);
    if (p.a) p.a = p.a.map((v) => Math.max(v, 95));
    addNews(`🤯 ${p.n} virou 99!`, `Do nada, ${p.n} (${teamName(+id)}) acordou com overall 99. Ninguém no clube sabe explicar.`, 'zoeira', [+id], { cat: 'Inacreditável', hot: true });
    if (isUserTeam(+id)) addInbox('info', 'Comissão técnica', `${p.n} agora é 99!`, `Ninguém sabe explicar, mas ${p.n} amanheceu com overall 99.`);
  }
}

// ---------------------------------------------------------------- season end (user)
function seasonEndTrigger() {
  const z = userLeagueZone();
  const t = ymd(S.date);
  if (z === 'SA') return t.m === 12 && t.d === 20;
  if (z === 'INTL') return t.m === 8 && t.d === 1;
  return t.m === 6 && t.d === 20;
}
function checkSeasonEnd() {
  if (!S.user.team || S.pendingEnd) return;
  if (!seasonEndTrigger()) return;
  if (S.date - (S.lastEndD || 0) < 200) return;
  S.lastEndD = S.date;
  S.pendingEnd = buildSeasonSummary();
}
function buildSeasonSummary() {
  if (S.pl) return plSeasonSummary();
  const uid = S.user.team;
  const unemployed = S.coach.unemployed;
  const sum = { d: S.date, team: uid, unemployed, titles: [], coins: 0, pos: null, league: null, offers: [] };
  const z = userLeagueZone();
  const since = S.seasonStart;
  sum.titles = S.coach.trophies.filter((tr) => tr.d >= since - 400 && tr.d <= S.date && !tr.reported);
  sum.titles.forEach((tr) => { tr.reported = true; sum.coins += tr.coins; });
  if (!unemployed && !S.teams[uid].isNat) {
    const lc = S.active.map((id) => S.comps[id]).find((c) => c && c.kind === 'league' && c.teams.includes(uid));
    if (lc) {
      const tab = sortTable(lc.table, lc.teams);
      sum.pos = tab.findIndex((r) => r.id === uid) + 1;
      sum.league = lc.name;
      sum.n = lc.teams.length;
      const target = S.board.objRank || lc.teams.length;
      let delta = (target - sum.pos) * 2.2;
      sum.objOk = sum.pos <= target;
      const down = lc.down || 0;
      sum.relegated = down > 0 && sum.pos > lc.teams.length - down;
      sum.promoted = (lc.up || 0) > 0 && sum.pos <= lc.up;
      if (sum.relegated) delta -= 25;
      if (sum.promoted) delta += 12;
      if (sum.objOk) delta += 8;
      S.board.conf = clamp(S.board.conf + delta, 0, 100);
    }
  }
  sum.obj = S.board.obj;
  sum.conf = Math.round(S.board.conf);
  sum.rating = Math.round(S.coach.rating);
  // three offers from other clubs
  const pool = S.mode === 'national' ? Object.values(S.nations).filter((n) => n.tid && (S.wcPool || []).includes(n.code)).map((n) => n.tid) : careerClubIds();
  const cand = pool.filter((id) => id !== uid).map((id) => ({ id, d: Math.abs(teamPrestige(id) - S.coach.rep - 4) + rnd() * 25 })).sort(by((x) => x.d));
  if (S.mode === 'ultra') {
    const divOf = (id) => S.ultra.div.findIndex((d) => d.includes(id));
    const picks = [];
    for (const dv of shuffle([0, 1, 2])) { const c = cand.find((x) => divOf(x.id) === dv && !picks.includes(x.id)); if (c) picks.push(c.id); }
    sum.offers = picks.slice(0, 3);
  } else if (S.mode === 'normal') {
    const zone = userLeagueZone();
    const same = cand.filter((x) => (isSAteam(x.id) ? 'SA' : 'EU') === zone);
    const other = cand.filter((x) => !same.includes(x));
    sum.offers = uniq(same.slice(0, 2).concat(other.slice(0, 1)).concat(same.slice(2, 4)).map((x) => x.id)).slice(0, 3);
  } else sum.offers = cand.slice(0, 3).map((x) => x.id);
  if (!unemployed && !S.noFire && S.board.conf < 20) { sum.fired = true; }
  return sum;
}
function closeSeasonEnd(choice) {
  const sum = S.pendingEnd;
  S.pendingEnd = null;
  if (!sum) return;
  if (S.pl) { plCloseSeason(sum, choice); S.celebrate = []; return; }
  if (sum.fired && !S.coach.unemployed) fireCoach('A diretoria decidiu não renovar com você após a temporada.');
  if (choice && choice.team) takeJob(choice.team);
  S.celebrate = [];
}
