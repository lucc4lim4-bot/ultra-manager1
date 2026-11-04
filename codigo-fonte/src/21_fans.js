/* ===================== torcida: humor, reclamações, eventos inesperados e torcidas organizadas (só no Brasil) ===================== */
// S.fans = { team, mood 0-100, org 0-100, recent: [letters], lastEv, lastCompl, lastOrg, ev: n, hist: [{d,t,r}] }
const FAN_ORGS = {
  corinthians: ['Gaviões da Fiel', 'Camisa 12'], palmeiras: ['Mancha Verde', 'Torcida Uniformizada do Palmeiras'], saopaulo: ['Independente', 'Dragões da Real'],
  santos: ['Torcida Jovem', 'Sangue Jovem'], flamengo: ['Raça Rubro-Negra', 'Torcida Jovem do Flamengo'], vasco: ['Força Jovem do Vasco', 'Guerreiros do Almirante'],
  fluminense: ['Young Flu', 'Torcida Garra Tricolor'], botafogo: ['Fúria Jovem do Botafogo', 'Loucos pelo Botafogo'], cruzeiro: ['Máfia Azul'], atleticomg: ['Galoucura', 'Movimento 105 Minutos'],
  gremio: ['Geral do Grêmio', 'Máfia Tricolor'], internacional: ['Guarda Popular', 'Popular'], bahia: ['Bamor'], vitoria: ['Os Imbatíveis'], athletico: ['Os Fanáticos'],
  coritiba: ['Império Alviverde'], sport: ['Inferno Coral'], fortaleza: ['Garra Tricolor'], ceara: ['Cearamor'],
};
const FAN_GENERIC = ['Torcida Jovem', 'Força Jovem', 'Fúria Organizada', 'Raça Organizada', 'Gaviões', 'Mancha', 'Garra Alvi', 'Camisa 12', 'Império', 'Legião'];
function fanOrgsOf(teamId) {
  const t = S.teams[teamId];
  if (!t || t.isNat || t.c !== 'BRA') return [];
  if (FAN_ORGS[t.key]) return FAN_ORGS[t.key];
  return [`${FAN_GENERIC[teamId % FAN_GENERIC.length]} ${t.s || t.n}`];
}
function fanAvailable() { return !!(S.user && S.user.team && !S.coach.unemployed && !S.pl && S.mode !== 'national' && S.teams[S.user.team] && !S.teams[S.user.team].isNat); }
function fanInit() {
  if (!S.fans) S.fans = { team: 0, mood: 55, org: 55, recent: [], lastEv: -99, lastCompl: -99, lastOrg: -99, ev: 0, hist: [] };
  const uid = S.user && S.user.team;
  if (S.fans.team !== uid) Object.assign(S.fans, { team: uid || 0, mood: 55, org: 55, recent: [], lastEv: -99, lastCompl: -99, lastOrg: -99, hist: [] });
  return S.fans;
}
function fanActive() { return S.fans && fanAvailable() && S.fans.team === S.user.team ? S.fans : null; }
// mood of a team's supporters as the stadium sees it (the user's club follows the career, the others a stable value from the table)
function fanMoodOf(teamId) {
  const f = fanActive();
  if (f && f.team === teamId) return f.mood;
  return 45 + ((teamId * 37) % 31);
}
function fanOrgMoodOf(teamId) { const f = fanActive(); return f && f.team === teamId ? f.org : 50 + ((teamId * 53) % 31); }
function fanLabel(v) { return v >= 80 ? 'Apaixonada' : v >= 62 ? 'Feliz' : v >= 45 ? 'Neutra' : v >= 28 ? 'Irritada' : 'Em revolta'; }
function fanHist(t, r) { const f = fanInit(); f.hist.unshift({ d: S.date, t, r }); if (f.hist.length > 25) f.hist.length = 25; }

/* ---------- effects ---------- */
// fx: { fan, org, conf, mor (whole squad), morP (the player in ctx), budget, injP (days out for the ctx player), mor2 (second player) }
function fanApply(fx, ctx) {
  const f = fanInit(), t = S.teams[f.team], out = [];
  const sgn = (v) => (v > 0 ? '+' : '') + Math.round(v);
  if (fx.fan) { f.mood = clamp(f.mood + fx.fan, 0, 100); out.push(`torcida ${sgn(fx.fan)}`); }
  if (fx.org && t.c === 'BRA') { f.org = clamp(f.org + fx.org, 0, 100); out.push(`organizada ${sgn(fx.org)}`); }
  if (fx.conf) { S.board.conf = clamp(S.board.conf + fx.conf, 0, 100); out.push(`diretoria ${sgn(fx.conf)}`); }
  if (fx.mor) { for (const p of squadOf(f.team)) p.mor = clamp((p.mor || 70) + fx.mor, 5, 100); out.push(`moral do elenco ${sgn(fx.mor)}`); }
  const p1 = ctx && ctx.pid ? S.players[ctx.pid] : null, p2 = ctx && ctx.pid2 ? S.players[ctx.pid2] : null;
  if (fx.morP && p1) { p1.mor = clamp((p1.mor || 70) + fx.morP, 5, 100); out.push(`moral de ${p1.n} ${sgn(fx.morP)}`); }
  if (fx.mor2 && p2) { p2.mor = clamp((p2.mor || 70) + fx.mor2, 5, 100); out.push(`moral de ${p2.n} ${sgn(fx.mor2)}`); }
  if (fx.injP && p1) { p1.inj = S.date + fx.injP; p1.injN = fx.injN || 'lesão no treino'; out.push(`${p1.n} fora ${fx.injP} dias`); }
  if (fx.budget) { t.budget = Math.max(0, t.budget + fx.budget); out.push(`caixa ${fx.budget > 0 ? '+' : '−'}${fmtMoney(Math.abs(fx.budget))}`); }
  return out.join(' · ');
}

/* ---------- events ---------- */
const FAN_EVENTS = [];
function fanEv(id, kind, w, build) { FAN_EVENTS.push({ id, kind, w, build }); }
function fanRandPlayer(n, filt) { const sq = squadOf(S.user.team).filter((p) => available(p) && (!filt || filt(p))); return shuffle(sq).slice(0, n); }
function fanBud(k) { return roundMoney(Math.max(40000, S.teams[S.user.team].budget * k)); }

fanEv('rixa', 'g', 6, () => { const [a, b] = fanRandPlayer(2); if (!b) return null;
  return { t: 'Discussão feia no treino', b: `${a.n} e ${b.n} se desentenderam no treino e quase partiram para a briga. O elenco parou para ver.`, ctx: { pid: a.pid || a.id, pid2: b.pid || b.id },
    o: [{ l: 'Fazer os dois se abraçarem', fx: { mor: 1, morP: 2, mor2: 2 }, r: 'Os dois fizeram as pazes diante do grupo.' }, { l: 'Multar os dois', fx: { morP: -6, mor2: -6, budget: fanBud(0.002), conf: 1 }, r: 'Disciplina mantida, mas o clima ficou pesado.' }, { l: 'Fingir que não viu', fx: { mor: -2 }, r: 'O vestiário percebeu a omissão.' }] }; });
fanEv('rede', 'g', 6, () => { const [a] = fanRandPlayer(1); if (!a) return null;
  return { t: 'Polêmica nas redes sociais', b: `${a.n} postou algo que viralizou pelos motivos errados e a torcida está dividida.`, ctx: { pid: a.id },
    o: [{ l: 'Defender o jogador', fx: { morP: 6, fan: -3 }, r: 'Você bancou o jogador publicamente.' }, { l: 'Multar e pedir desculpas', fx: { morP: -5, fan: 4, budget: fanBud(0.001) }, r: 'A torcida aceitou as desculpas.' }, { l: 'Ignorar', fx: { fan: -2 }, r: 'O assunto morreu em dois dias.' }] }; });
fanEv('festa', 'g', 5, () => { const ps = fanRandPlayer(3); if (ps.length < 3) return null;
  return { t: 'Festa na véspera de treino', b: `Fotos de ${ps.map((p) => p.n).join(', ')} em uma festa até tarde apareceram na internet.`, ctx: { pid: ps[0].id },
    o: [{ l: 'Punir publicamente', fx: { fan: 5, mor: -3, conf: 2 }, r: 'Punição pública: a torcida gostou, o elenco nem tanto.' }, { l: 'Conversa reservada', fx: { mor: 1, fan: -1 }, r: 'Resolvido internamente.' }, { l: 'Liberar a folga', fx: { mor: 4, fan: -4, conf: -2 }, r: 'O elenco gostou, a imprensa não.' }] }; });
fanEv('treinolesao', 'g', 5, () => { const [a] = fanRandPlayer(1, (p) => p.o >= 60); if (!a) return null; const d = rint(7, 28);
  return { t: 'Susto no treino', b: `${a.n} sentiu o músculo em um treino intenso. A previsão inicial é de ${d} dias fora.`, ctx: { pid: a.id },
    o: [{ l: 'Tratamento intensivo (caro)', fx: { injP: Math.ceil(d * 0.6), budget: -fanBud(0.004) }, r: 'O departamento médico acelerou a recuperação.' }, { l: 'Tratamento normal', fx: { injP: d }, r: 'Recuperação dentro do esperado.' }] }; });
fanEv('idolo', 'g', 4, () => ({ t: 'Ídolo visita o vestiário', b: 'Um ex-ídolo do clube apareceu de surpresa antes do treino e contou histórias para o elenco.', o: [{ l: 'Convidar para o treino', fx: { mor: 4, fan: 4 }, r: 'Dia de festa no CT.' }, { l: 'Só uma foto', fx: { mor: 2, fan: 2 }, r: 'Foto postada, torcida feliz.' }] }));
fanEv('gramado', 'g', 4, () => ({ t: 'Gramado em péssimas condições', b: 'O gramado do CT está esburacado depois das chuvas e os jogadores reclamam.', o: [{ l: 'Trocar o gramado', fx: { budget: -fanBud(0.01), mor: 3 }, r: 'Gramado novo, jogadores aprovando.' }, { l: 'Remendar', fx: { budget: -fanBud(0.002) }, r: 'Remendo resolveu por enquanto.' }, { l: 'Deixar assim', fx: { mor: -2 }, r: 'O elenco reclamou nos bastidores.' }] }));
fanEv('cachorro', 'g', 4, () => ({ t: 'Cachorro invade o treino', b: 'Um vira-lata invadiu o CT, driblou três zagueiros e foi adotado pelo grupo. O vídeo bombou.', o: [{ l: 'Adotar como mascote', fx: { mor: 4, fan: 6 }, r: 'Mascote novo, camisa vendendo.' }, { l: 'Chamar a protetora de animais', fx: { fan: 2 }, r: 'Cachorro encaminhado e todo mundo feliz.' }] }));
fanEv('intoxicacao', 'g', 3, () => ({ t: 'Intoxicação alimentar', b: 'Parte do elenco passou mal depois do almoço no CT.', o: [{ l: 'Trocar o fornecedor', fx: { mor: -1, budget: -fanBud(0.002) }, r: 'Fornecedor trocado, ninguém mais passou mal.' }, { l: 'Dar folga ao grupo', fx: { mor: 3, conf: -1 }, r: 'Dia de folga para se recuperar.' }] }));
fanEv('onibus', 'g', 3, () => ({ t: 'Greve de ônibus atrasa o elenco', b: 'A greve do transporte fez metade do elenco chegar atrasada ao treino.', o: [{ l: 'Fretar vans para todos', fx: { budget: -fanBud(0.001), mor: 2 }, r: 'Treino começou no horário.' }, { l: 'Cobrar pontualidade', fx: { mor: -3, conf: 1 }, r: 'O grupo reclamou, mas ninguém mais atrasou.' }] }));
fanEv('revelacao', 'g', 4, () => ({ t: 'Garoto da base viraliza', b: 'Um jogador do sub-20 fez um golaço no coletivo e o vídeo explodiu na internet.', o: [{ l: 'Aproveitar o momento e promover o atleta', fx: { fan: 6, mor: 1 }, r: 'A torcida pede o garoto no time principal.' }, { l: 'Segurar a empolgação', fx: { fan: -1 }, r: 'Você manteve os pés no chão.' }] }));
fanEv('hacker', 'g', 3, () => ({ t: 'Hacker vaza a escalação', b: 'A escalação do próximo jogo vazou na internet antes do aviso ao elenco.', o: [{ l: 'Investigar e punir', fx: { mor: -2, conf: 1 }, r: 'Ninguém foi encontrado, mas o recado foi dado.' }, { l: 'Rir e mudar o time', fx: { mor: 1, fan: 2 }, r: 'Você mostrou bom humor e despistou o adversário.' }] }));
fanEv('aniversario', 'g', 3, () => ({ t: 'Aniversário do clube', b: 'O clube completa mais um ano e a torcida quer uma festa à altura.', o: [{ l: 'Grande festa no estádio', fx: { budget: -fanBud(0.006), fan: 9, mor: 3 }, r: 'Festa linda, estádio pintado de cores do clube.' }, { l: 'Só um vídeo nas redes', fx: { fan: 2 }, r: 'Homenagem simples nas redes.' }] }));
fanEv('beneficente', 'g', 3, () => ({ t: 'Campanha beneficente', b: 'Uma ONG pede que o elenco visite um hospital infantil.', o: [{ l: 'Levar o elenco todo', fx: { fan: 7, mor: 3 }, r: 'Dia emocionante para todo mundo.' }, { l: 'Mandar alguns jogadores', fx: { fan: 3 }, r: 'Representantes do clube fizeram a visita.' }, { l: 'Recusar', fx: { fan: -3 }, r: 'A recusa foi criticada.' }] }));
fanEv('rival', 'g', 4, () => ({ t: 'Provocação do rival', b: 'O rival postou uma zoeira com o seu clube e a torcida quer resposta.', o: [{ l: 'Responder à altura', fx: { fan: 7, conf: -1 }, r: 'Resposta viralizou.' }, { l: 'Responder com classe', fx: { fan: 3, conf: 1 }, r: 'Postura elogiada.' }, { l: 'Ignorar', fx: { fan: -2 }, r: 'A torcida queria uma resposta.' }] }));
fanEv('empresario', 'g', 4, () => { const [a] = fanRandPlayer(1, (p) => p.o >= 66); if (!a) return null;
  return { t: 'Empresário faz pressão', b: `O empresário de ${a.n} deixou vazar interesse de outros clubes para pressionar por um aumento.`, ctx: { pid: a.id },
    o: [{ l: 'Bancar o jogador', fx: { morP: 8, conf: -1 }, r: 'Jogador tranquilizado.' }, { l: 'Dar um prazo ao empresário', fx: { morP: -3 }, r: 'Negociação esfriou.' }, { l: 'Ir à imprensa', fx: { fan: 4, morP: -9 }, r: 'A torcida apoiou a firmeza; o jogador, nem tanto.' }] }; });
fanEv('pai', 'g', 3, () => { const [a] = fanRandPlayer(1); if (!a) return null;
  return { t: 'Pai de jogador viraliza', b: `O pai de ${a.n} foi flagrado vibrando na arquibancada, de camisa e bandeira, e virou meme.`, ctx: { pid: a.id },
    o: [{ l: 'Convidar para o vestiário', fx: { morP: 6, fan: 4 }, r: 'Emoção no vestiário.' }, { l: 'Só curtir o meme', fx: { fan: 2 }, r: 'O clube entrou na brincadeira.' }] }; });
fanEv('celebridade', 'g', 3, () => ({ t: 'Celebridade quer ver o treino', b: 'Um artista famoso, torcedor do clube, pediu para assistir a um treino.', o: [{ l: 'Abrir o treino', fx: { fan: 5, mor: -1 }, r: 'Treino aberto, redes bombando.' }, { l: 'Convidar para o próximo jogo', fx: { fan: 3 }, r: 'Convite aceito.' }] }));
fanEv('enchente', 'g', 2, () => ({ t: 'Chuva forte alaga o CT', b: 'A chuva alagou o centro de treinamento. Não dá para treinar hoje.', o: [{ l: 'Treino tático dentro de casa', fx: { mor: 1 }, r: 'Aproveitou para trabalhar no vídeo.' }, { l: 'Folga para o grupo', fx: { mor: 3 }, r: 'Grupo agradecido.' }] }));
fanEv('presidente', 'g', 3, () => ({ t: 'Presidente quer palpitar', b: 'O presidente do clube mandou recado sugerindo a escalação para o próximo jogo.', o: [{ l: 'Ouvir e agradecer', fx: { conf: 3, mor: -1 }, r: 'Presidente satisfeito.' }, { l: 'Deixar claro quem escala', fx: { conf: -3, mor: 2 }, r: 'Você bancou sua autoridade.' }] }));
fanEv('placar', 'g', 2, () => ({ t: 'Placar eletrônico enlouquece', b: 'O placar do estádio marcou "Derrota" no treino-jogo. Dizem que foi uma brincadeira do técnico adversário.', o: [{ l: 'Rir e seguir em frente', fx: { fan: 2, mor: 2 }, r: 'Bom humor no grupo.' }, { l: 'Reclamar à federação', fx: { fan: -1 }, r: 'Reclamação arquivada.' }] }));
// invented ones
fanEv('mascote', 'g', 3, () => ({ t: 'Mascote some antes do clássico', b: 'A fantasia do mascote desapareceu do vestiário. A torcida acha que foi sabotagem do rival.', o: [{ l: 'Oferecer recompensa', fx: { fan: 5, budget: -fanBud(0.001) }, r: 'Fantasia encontrada no ônibus dos funcionários.' }, { l: 'Fazer piada nas redes', fx: { fan: 3 }, r: 'A torcida riu.' }] }));
fanEv('pet', 'g', 2, () => ({ t: 'Craque vira garoto-propaganda de ração', b: 'Seu camisa 10 gravou comercial de ração para cachorro, atrasou o treino e a imprensa implicou.', o: [{ l: 'Liberar a campanha', fx: { budget: fanBud(0.002), morP: 2, fan: -1 }, r: 'O clube ficou com parte do cachê.' }, { l: 'Vetar', fx: { morP: -3 }, r: 'O jogador ficou chateado.' }] }));
// Brazil only: the organised supporters' groups (torcidas organizadas)
const FAN_ORG_EVENTS = [];
function fanOrgEv(id, w, build) { FAN_ORG_EVENTS.push({ id, w, build }); }
fanOrgEv('protesto', 6, (org) => ({ t: `${org} protesta no CT`, b: `A ${org} foi ao centro de treinamento com faixas e bandeiras para cobrar o time e a comissão técnica.`,
  o: [{ l: 'Receber os líderes', fx: { org: 12, fan: 3, conf: -1 }, r: 'A conversa baixou os ânimos.' }, { l: 'Levar um grupo de jogadores até o portão', fx: { org: 8, fan: 4, mor: -3 }, r: 'Os jogadores ouviram as cobranças.' }, { l: 'Ignorar', fx: { org: -10, fan: -3, conf: -3 }, r: 'O protesto cresceu nas redes.' }] }));
fanOrgEv('ingresso', 5, (org) => ({ t: `${org} pede ingressos para viagem`, b: `A ${org} quer ônibus e ingressos para acompanhar o time no próximo jogo fora de casa.`,
  o: [{ l: 'Pagar a viagem', fx: { org: 10, fan: 2, budget: -fanBud(0.003) }, r: 'Caravana confirmada.' }, { l: 'Liberar só os ingressos', fx: { org: 4 }, r: 'Parte da torcida aceitou.' }, { l: 'Recusar', fx: { org: -8, fan: -1 }, r: 'A organizada ficou contrariada.' }] }));
fanOrgEv('faixa', 5, (org) => ({ t: `Faixa da ${org} cobra a diretoria`, b: `Uma faixa gigante da ${org} apareceu na entrada do estádio com recado para a diretoria e para você.`,
  o: [{ l: 'Responder em entrevista', fx: { org: 5, fan: 3, conf: -2 }, r: 'Você assumiu a responsabilidade.' }, { l: 'Pedir que retirem', fx: { org: -7, conf: 1 }, r: 'Retiraram, mas a briga ficou no ar.' }, { l: 'Deixar a faixa lá', fx: { org: 3, conf: -1 }, r: 'A faixa ficou o dia todo.' }] }));
fanOrgEv('aeroporto', 4, (org) => ({ t: `${org} espera o time no aeroporto`, b: `Integrantes da ${org} esperaram o elenco no desembarque para cantar e cobrar atitude.`,
  o: [{ l: 'Parar e cumprimentar', fx: { org: 9, fan: 4, mor: -1 }, r: 'Fotos, abraços e uma cobrança respeitosa.' }, { l: 'Sair pelos fundos', fx: { org: -8, mor: 1 }, r: 'Os torcedores esperaram em vão.' }] }));
fanOrgEv('festa', 4, (org) => ({ t: `${org} faz festa de aniversário`, b: `A ${org} completa mais um ano e convida o clube para a festa na quadra.`,
  o: [{ l: 'Ir com alguns jogadores', fx: { org: 12, fan: 4, mor: 1 }, r: 'Festa linda e muita música.' }, { l: 'Mandar um comunicado', fx: { org: 3 }, r: 'Gesto simples, mas educado.' }, { l: 'Não comparecer', fx: { org: -5 }, r: 'Sentiram sua ausência.' }] }));
fanOrgEv('idolo', 4, (org) => ({ t: `${org} homenageia ídolo`, b: `A ${org} prepara um mosaico gigante para o próximo jogo e pede liberação das bandeiras maiores.`,
  o: [{ l: 'Liberar e ajudar a pintar o mosaico', fx: { org: 11, fan: 6, budget: -fanBud(0.001) }, r: 'Mosaico lindo na arquibancada.' }, { l: 'Liberar sem apoio', fx: { org: 5, fan: 2 }, r: 'Mosaico simples, mas bonito.' }, { l: 'Negar por segurança', fx: { org: -8, fan: -2 }, r: 'A organizada reclamou da decisão.' }] }));
fanOrgEv('clasico', 3, (org) => ({ t: `Tensão no clássico: ${org} e a polícia`, b: `Antes do clássico, a ${org} e a polícia discutem sobre os horários de entrada e as bandeiras.`,
  o: [{ l: 'Mediar a conversa', fx: { org: 6, fan: 2, conf: 1 }, r: 'Acordo fechado, entrada tranquila.' }, { l: 'Pedir calma pelas redes', fx: { org: 2, fan: 2 }, r: 'Apelo bem recebido.' }, { l: 'Não se meter', fx: { org: -4, fan: -2 }, r: 'Sem acordo, a confusão atrasou o jogo.' }] }));
// complaints from the stands (3 fixed answers)
function fanComplaint(topic, extra) {
  const f = fanInit();
  const T = {
    seq: { t: 'A torcida está irritada com a sequência ruim', b: 'Torcedores lotaram as redes e a porta do CT. Pedem mudanças depois dos últimos resultados.' },
    star: { t: `Torcida cobra a escalação de ${extra && extra.n}`, b: `Muita gente reclama que ${extra && extra.n} tem ficado no banco. "Joga o nosso craque", pedem nas redes.`, ctx: extra && { pid: extra.id } },
    jogo: { t: 'Torcida reclama do futebol apresentado', b: 'Os torcedores dizem que o time joga sem alma e que falta intensidade. Querem um futebol mais ofensivo.' },
    preco: { t: 'Revolta com o preço dos ingressos', b: 'Os ingressos estão caros e a torcida fala em boicote ao estádio. A diretoria quer saber sua opinião.' },
    reforco: { t: 'Torcida pede reforços', b: 'Nenhum nome novo chegou e a torcida cobra contratações nas redes e na saída do CT.' },
  }[topic];
  const o = [
    { l: 'Pedir paciência', fx: { fan: 2, org: 1 }, r: 'Você pediu calma e prometeu trabalho.' },
    topic === 'preco' ? { l: 'Baixar o preço do ingresso', fx: { fan: 10, org: 6, budget: -fanBud(0.004), conf: -1 }, r: 'Ingressos mais baratos: estádio mais cheio.' } : topic === 'reforco' ? { l: 'Prometer reforços', fx: { fan: 6, org: 3, conf: -2 }, r: 'Agora a diretoria vai cobrar contratações.' } : { l: 'Prometer mudanças', fx: { fan: 5, org: 3, mor: -1 }, r: 'A torcida deu um voto de confiança.' },
    { l: 'Rebater as críticas', fx: { fan: -5, org: -4, mor: 3 }, r: 'O elenco gostou, a torcida nem tanto.' },
  ];
  return { id: 'c_' + topic, t: T.t, b: T.b, ctx: T.ctx, o, kind: 'c' };
}
function fanPick(list) { let tot = 0; for (const e of list) tot += e.w; let r = rnd() * tot; for (const e of list) { r -= e.w; if (r <= 0) return e; } return list[0]; }
function fanSend(ev, from) {
  const f = fanInit();
  const o = ev.o.map((x) => ({ l: x.l, fx: x.fx, r: x.r }));
  addInbox('fan', from || 'Torcida', ev.t, ev.b, { kind: 'fan', evId: ev.id, ctx: ev.ctx || null, opts: o, done: false });
  f.ev++;
}
function fanAnswer(msgId, idx) {
  const m = S.inbox.find((x) => x.id === msgId);
  if (!m || !m.act || m.act.kind !== 'fan' || m.act.done) return null;
  const op = m.act.opts[idx];
  if (!op) return null;
  const sum = fanApply(op.fx || {}, m.act.ctx);
  m.act.done = true; m.act.chosen = idx; m.act.res = op.r + (sum ? ` (${sum})` : '');
  fanHist(m.subj, op.r);
  return m.act.res;
}
// the user's matches feed the mood
function fanAfterMatch(m) {
  const f = fanActive();
  if (!f || m.fr) return;
  const uid = f.team, gf = m.h === uid ? m.hg : m.ag, ga = m.h === uid ? m.ag : m.hg;
  const letter = gf > ga ? 'V' : gf < ga ? 'D' : 'E';
  const pts = letter === 'V' ? 3 : letter === 'E' ? 1 : 0;
  const opp = m.h === uid ? m.a : m.h;
  const myR = teamRating(uid), opR = S.teams[opp] && !S.teams[opp].isNat ? teamRating(opp) : myR;
  const exp = expectedPoints(myR, opR, m.h === uid && !m.n);
  let d = (pts - exp) * 4.2 + (letter === 'V' && gf - ga >= 3 ? 2 : 0) - (letter === 'D' && ga - gf >= 3 ? 3 : 0);
  f.mood = clamp(f.mood + d, 0, 100);
  f.org = clamp(f.org + d * 1.35, 0, 100); // organised groups swing harder
  f.recent.push(letter); if (f.recent.length > 6) f.recent.shift();
}
// Mondays: drift, grudges, complaints and a chance of a surprise
function fanWeek() {
  if (!fanAvailable()) return;
  const f = fanInit(), t = S.teams[f.team], day = S.date;
  f.mood += (55 - f.mood) * 0.04; f.org += (55 - f.org) * 0.05;
  if (f.mood < 28) { S.board.conf = clamp(S.board.conf - 0.8, 0, 100); for (const p of squadOf(f.team)) p.mor = clamp((p.mor || 70) - 1, 5, 100); }
  else if (f.mood > 75) { S.board.conf = clamp(S.board.conf + 0.5, 0, 100); for (const p of squadOf(f.team)) p.mor = clamp((p.mor || 70) + 1, 5, 100); }
  const pending = S.inbox.filter((m) => m.act && m.act.kind === 'fan' && !m.act.done).length;
  if (pending >= 3) return;
  const org = fanOrgsOf(f.team)[0];
  const last3 = f.recent.slice(-3);
  // complaints
  if (day - f.lastCompl >= 18 && (f.mood < 38 || (last3.length === 3 && last3.every((x) => x !== 'V')) ) && rnd() < 0.7) {
    const sq = squadOf(f.team).slice().sort(by((p) => p.o, -1));
    const star = sq.slice(0, 5).find((p) => (p.cnp || 0) >= 3 && available(p));
    const opts = ['seq', 'jogo', 'preco', 'reforco'];
    const topic = star && rnd() < 0.45 ? 'star' : pick(opts);
    fanSend(fanComplaint(topic, star), 'Torcida'); f.lastCompl = day; return;
  }
  // organised group (Brazil only)
  if (org && day - f.lastOrg >= 14 && (f.org < 40 ? rnd() < 0.55 : rnd() < 0.2)) {
    const e = fanPick(FAN_ORG_EVENTS); const ev = e.build(org);
    fanSend(Object.assign({ id: 'o_' + e.id }, ev), org); f.lastOrg = day; return;
  }
  // surprises
  if (day - f.lastEv >= 9 && rnd() < 0.4) {
    for (let k = 0; k < 4; k++) { const e = fanPick(FAN_EVENTS), ev = e.build(); if (ev) { fanSend(Object.assign({ id: e.id }, ev), 'Clube'); f.lastEv = day; return; } }
  }
}
