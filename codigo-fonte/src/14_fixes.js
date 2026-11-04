/* ===================== data fixes for saves made before them ===================== */
// The 2026 database once carried women's players by mistake (the FC 27 ratings snapshot mixes both games).
// The game is men's football: careers saved before the fix lose them when loaded. Name@nationality pairs.
const WOMEN_2026 = (
  'Ada Hegerberg@NOR|Alara@GER|Alice Corelli@ITA|Alice Pinguet@FRA|Amanda Ilestedt@SWE|Amber Tysiak@BEL|Ana-Maria Crnogorčević@SUI|Andrea Gómez@ESP|' +
  'Andrea Norheim@NOR|Andrea Svibkova@CZE|Anna Csiki@HUN|Anna Klink@GER|Anna Patten@IRL|Anneke Borbe@GER|Barbora Votíková@CZE|Bella Andersson@SWE|' +
  'Bibi@GER|Bo Van Egmond@NED|Camilla Küver@GER|Carla Camacho@ESP|Carla Polito@FRA|Carmen Álvarez@ESP|Caroline Graham Hansen@NOR|Caroline Kehrer@CAN|' +
  'Caroline Møller@DEN|Cathinka Tandberg@NOR|Cecilia Salvai@ITA|Cecilie Fløe@DEN|Celina Degen@AUT|Charlize Rule@AUS|Charlotte Hulst@NED|' +
  'Charlotte Voll@GER|Chiamaka Nnadozie@NGA|Chiara Hahn@GER|Chloe Marty@FRA|Chloé Tapia@FRA|Christiane Endler@CHI|Christy Gavory@FRA|Clare Hunt@AUS|' +
  'Constance Picaud-Inconnu@FRA|Cora Zicai@GER|Courtney Brosnan@IRL|Damaris Egurrola@NED|Daphne Van Domselaar@NED|Dominique Janssen@NED|Edna Imade@ESP|' +
  'Elena Mühlemann@SUI|Elisa Launay@FRA|Elise Isolde Stenevik@NOR|Ellie Roebuck@ENG|Elma Junttila Nelhage@SWE|Elvira Herzog@SUI|Emily Ramsey@ENG|' +
  'Emma Stølen Godø@NOR|Ena Mahmutovic@GER|Esther Mbakem-Niaro@FRA|Esther Sullastres@ESP|Eunate Astralaga@ESP|Eve Boettcher@GER|Fabienne Dongus@GER|' +
  'Fiona Bogi@FRA|Fridolina Rolfö@SWE|Gemma Gili@ESP|Giovanna Hoffmann@GER|Gracie Prior@ENG|Hannah Hampton@ENG|Hillary Diaz@FRA|Ingrid Syrstad Engen@NOR|' +
  'Inès Benyahia@FRA|Irene Oguiza@ESP|Irene Paredes@ESP|Irina Fuchs@SUI|Isa Álvarez@ESP|Jade Rose@CAN|Janina Hechler@GER|Janina Leitzig@GER|' +
  'Jaqueline Dönges@GER|Jenna Clark@SCO|Jennyfer Limage@HAI|Johanna Berg@GER|Jule Brand@GER|Julia Landenberger@GER|Julia Pollak@GER|Julie Pasquereau@FRA|' +
  'Julie Rabanne@FRA|Justine Vanhaevermaet@BEL|Karen Holmgaard@DEN|Katarzyna Kiedrzynek@POL|Katie Reid@ENG|Kelly Gago@FRA|Khadija Shaw@JAM|' +
  'Klára Cahynová@CZE|Larissa Haidner@AUT|Larissa Mühlhaus@GER|Laura Benkarth@GER|Laura Dick@GER|Laura Giuliani@ITA|Lauren James@ENG|Lauren Leal@BRA|' +
  'Laureta Elmazi@GER|Lea Notel@FRA|Lena Lattwein@GER|Lena Oberdorf@GER|Lena Pauels@GER|Lena Petermann@GER|Lieske Carleer@NED|Lily Yohannes@USA|' +
  'Lina Gay@FRA|Lina Hausicke@GER|Lina Von Schrader@GER|Lisa Doorn@NED|Lisa Schmitz@GER|Livia Peng@SUI|Lorena Barth@SUI|Lotte Wubben-Moy@ENG|' +
  'Lou Jumere Seignou@FRA|Louise Van Oosten@NED|Lourdes Romero@GER|Luca Birkholz@GER|Lynn Wilms@NED|Maelys Mpome@FRA|Mara Alber@GER|Maria-Luisa Grohs@GER|' +
  'Marie Petiteau@FRA|Marie-Antoinette Katoto@FRA|Marie-Morgane Sieber@FRA|Marina Georgieva@AUT|Marthine Østenstad@NOR|Martina Piemonte@ITA|' +
  'Mathilde Harviken@NOR|Maximiliane Rall@GER|Mayra Ramírez@COL|Maïté Boucly@FRA|Medina Dešić@MNE|Megan Finnigan@ENG|Merle Frohms@GER|' +
  'Merveille Kanjinga@COD|Michaely Bihina@CMR|Michelle Ulbrich@GER|Mylène Chavas@FRA|Nadine Böhi@SUI|Nathalie Björn@SWE|Nikola Karczewska@POL|' +
  'Nikée Van Dijk@NED|Nina Räcke@GER|Noémie Mouchon@FRA|Nurija Van Schoonhoven@NED|Olivie Lukášová@CZE|Paulina Krumbiegel@GER|Pauline Peyraud-Magnin@FRA|' +
  'Phallon Tullis-Joyce@USA|Rachael Laws@ENG|Rachele Baldi@ITA|Rafaela Borggräfe@GER|Rakel Engesvik@NOR|Rebecca Adamczyk@GER|Rebecca Knaak@GER|' +
  'Regina Van Eijk@NED|Roma Grinfan@FRA|Rosa Ruckert@GER|Roseline Éloissaint@HAI|Rylee Foster Inman@CAN|Salma Paralluelo@ESP|Salomé Elisor@FRA|' +
  'Sara Holmgaard@DEN|Sari Kees@BEL|Selen Altunkulak@TUR|Selina Ostermeier@GER|Shumaira Mheuka@ENG|Signe Bruun@DEN|Simi Awujo@CAN|Sofie Gron@DEN|' +
  'Somea Polozen@BIH|Sophia Winkler@GER|Sophie Lindner@AUT|Sophie Román Haug@NOR|Stina Blackstenius@SWE|Stina Johannes@GER|Stine Ballisager@DEN|' +
  'Sydney Lohmann@GER|Sydney Schertenleib@SUI|Tamar Dongus@GER|Tarciane@BRA|Tatiana Solanet@FRA|Taylor Beitz@CAN|Taylor Ziemer@USA|Teagan Micah@AUS|' +
  'Valentina Mädl@AUT|Vanessa Gilles@CAN|Verena Wieder@GER|Victoria Schulz@GER|Vivianne Miedema@NED|Wendie Renard@FRA|Yasmin Mrabet@MAR|Ziqin Shao@CHN|'
).split('|').filter(Boolean);
function purgeWomen2026() {
  if (!S || S.era !== 2026 || S.purgedW || !S.players) return 0;
  const set = new Set(WOMEN_2026);
  const gone = new Set();
  const mine = [];
  for (const id in S.players) {
    const p = S.players[id];
    if (!p || !set.has(p.n + '@' + p.nat)) continue;
    gone.add(p.id);
    if (S.user && p.t && p.t === S.user.team) mine.push(p.n);
  }
  if (gone.size) {
    for (const id in S.teams) {
      const t = S.teams[id];
      if (t.sq) t.sq = t.sq.filter((x) => !gone.has(x));
      if (t.xi) t.xi = t.xi.map((x) => (gone.has(x) ? 0 : x));
      if (t.bench) t.bench = t.bench.filter((x) => !gone.has(x));
    }
    for (const code in S.nations || {}) { const n = S.nations[code]; if (n.sq) n.sq = n.sq.filter((x) => !gone.has(x)); }
    if (S.youth && S.youth.squad) S.youth.squad = S.youth.squad.filter((x) => !gone.has(x));
    if (S.tr) {
      if (S.tr.short) S.tr.short = S.tr.short.filter((x) => !gone.has(x));
      for (const o of S.tr.offers || []) if (gone.has(o.pid) && o.status === 'open') o.status = 'void';
    }
    for (const pid of gone) delete S.players[pid];
    if (mine.length && typeof addInbox === 'function') {
      addInbox('info', 'Diretoria', 'Elenco atualizado', `${mine.join(', ')} ${mine.length === 1 ? 'deixou' : 'deixaram'} o elenco: a base de dados foi corrigida e o jogo traz apenas o futebol masculino.`);
    }
  }
  S.purgedW = 1;
  return gone.size;
}

// saves made before the Brazilian clubs' budgets were cut: one-time reduction (not the user's own club if it was topped up with the admin button)
function cutBraBudgets() {
  if (!S.flags || S.flags.braCut) return;
  S.flags.braCut = 1;
  for (const id in S.teams) { const t = S.teams[id]; if (t.c === 'BRA' && !t.isNat && t.id !== (S.user && S.user.team)) t.budget = Math.round(t.budget * BRA_BUDGET_K); }
  const u = S.user && S.teams[S.user.team];
  if (u && u.c === 'BRA' && u.budget > 0 && !(S.spons && S.spons.total)) u.budget = Math.round(u.budget * BRA_BUDGET_K);
}
