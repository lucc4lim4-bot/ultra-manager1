/* ===================== Brazilian state championships (estaduais) and the Copinha ===================== */
// Clubs that only play the state championships (and the Copinha) are created when a career needs them, with generated
// squads. Clubs the game already has keep their real players; one missing in an era (Vasco in 2021, say) is created
// here too. key|name|short|colour 1|colour 2|stadium|level (average overall of the best 14)
const STATE_CLUB_ROWS = `
vasco|Vasco da Gama|VAS|#111111|#ffffff|São Januário|64
bahia|Bahia|BAH|#0047ab|#e2001a|Arena Fonte Nova|62
vitoria|Vitória|VIT|#e2001a|#111111|Barradão|61
americamg|América-MG|AMG|#00843d|#111111|Independência|62
atleticogo|Atlético-GO|ACG|#e2001a|#111111|Antônio Accioly|61
vilanova|Vila Nova|VNO|#e2001a|#ffffff|Onésio Brasileiro Alvarenga|59
novorizontino|Novorizontino|NOV|#ffd200|#111111|Jorge Ismael de Biasi|57
mirassol|Mirassol|MIR|#ffd200|#00843d|Campos Maia|58
santacruz|Santa Cruz|STC|#e2001a|#111111|Arruda|55
figueirense|Figueirense|FIG|#111111|#ffffff|Orlando Scarpelli|56
criciuma|Criciúma|CRI|#ffd200|#111111|Heriberto Hülse|59
joinville|Joinville|JEC|#e2001a|#111111|Arena Joinville|53
avai|Avaí|AVA|#0047ab|#ffffff|Ressacada|60
juventude|Juventude|JUV|#00843d|#ffffff|Alfredo Jaconi|57
pontepreta|Ponte Preta|PON|#ffffff|#111111|Moisés Lucarelli|59
br_saobento|São Bento|SBT|#1e40af|#ffffff|Walter Ribeiro|54
br_linense|Linense|LIN|#c8102e|#ffffff|Gilbertão|52
br_botafogosp|Botafogo-SP|BFC|#c8102e|#111111|Santa Cruz|57
br_oeste|Oeste|OES|#c8102e|#ffffff|Arena Barueri|55
br_saobernardo|São Bernardo|SBE|#ffd200|#111111|1º de Maio|56
br_ituano|Ituano|ITU|#c8102e|#111111|Novelli Júnior|56
br_audax|Osasco Audax|AUD|#f97316|#1e3a8a|José Liberatti|55
br_ferroviaria|Ferroviária|FER|#8b0d32|#ffffff|Fonte Luminosa|55
br_xvpiracicaba|XV de Piracicaba|XVP|#111111|#ffffff|Barão de Serra Negra|52
br_capivariano|Capivariano|CAP|#c8102e|#ffffff|Arena Capivari|53
br_redbullbrasil|Red Bull Brasil|RBR|#ffffff|#c8102e|Moisés Lucarelli|55
br_aguasanta|Água Santa|AGS|#1d4ed8|#ffffff|Distrital do Inamar|53
br_mogimirim|Mogi Mirim|MOG|#c8102e|#ffffff|Romildão|51
br_rioclaro|Rio Claro|RCL|#1e40af|#ffffff|Benito Agnelo Castellano|51
br_interlimeira|Inter de Limeira|INL|#111111|#ffffff|Major José Levy Sobrinho|54
br_santoandre|Santo André|STA|#1e40af|#ffffff|Bruno José Daniel|54
br_saocaetano|São Caetano|SCT|#1e40af|#ffffff|Anacleto Campanella|53
br_guarani|Guarani|GUA|#00843d|#ffffff|Brinco de Ouro|58
br_noroeste|Noroeste|NOR|#c8102e|#ffffff|Alfredo de Castilho|54
br_portuguesa|Portuguesa|POR|#c8102e|#00843d|Canindé|56
br_primavera|Primavera|PRI|#e11d48|#ffffff|Ítalo Mário Limongi|54
br_veloclube|Velo Clube|VEL|#00843d|#c8102e|Benito Agnelo Castellano|54
br_boavista|Boavista|BVS|#00843d|#ffffff|Elcyr Resende|54
br_bangu|Bangu|BAN|#c8102e|#ffffff|Moça Bonita|53
br_cabofriense|Cabofriense|CAB|#f59e0b|#111111|Correão|50
br_portuguesarj|Portuguesa-RJ|PRJ|#c8102e|#00843d|Luso-Brasileiro|53
br_resende|Resende|RES|#111111|#ffffff|Estádio do Trabalhador|51
br_macae|Macaé|MAC|#1e40af|#ffffff|Moacyrzão|51
br_voltaredonda|Volta Redonda|VRE|#ffd200|#111111|Raulino de Oliveira|56
br_madureira|Madureira|MAD|#facc15|#1d4ed8|Conselheiro Galvão|53
br_americarj|America-RJ|AME|#c8102e|#ffffff|Giulite Coutinho|50
br_friburguense|Friburguense|FRI|#00843d|#ffffff|Eduardo Guinle|49
br_tigresbrasil|Tigres do Brasil|TIG|#ffd200|#111111|Moça Bonita|49
br_bonsucesso|Bonsucesso|BON|#1e40af|#c8102e|Leônidas da Silva|48
br_novaiguacu|Nova Iguaçu|NIG|#f97316|#ffffff|Laranjão|55
br_sampaiocorrearj|Sampaio Corrêa-RJ|SCR|#00843d|#ffd200|Elcyr Resende|52
br_marica|Maricá|MAR|#0ea5e9|#ffffff|João Saldanha|53
br_urt|URT|URT|#1d4ed8|#ffffff|Zama Maciel|53
br_caldense|Caldense|CAL|#00843d|#ffffff|Ronaldão|53
br_villanova|Villa Nova|VNA|#c8102e|#ffffff|Castor Cifuentes|52
br_tricordiano|Tricordiano|TRI|#1e40af|#ffffff|Elias Arbex|50
br_tombense|Tombense|TOM|#c8102e|#ffffff|Antônio Guimarães de Almeida|56
br_tupi|Tupi|TUP|#111111|#ffffff|Mário Helênio|52
br_uberlandia|Uberlândia|UBE|#00843d|#ffffff|Parque do Sabiá|52
br_guaranimg|Guarani-MG|GMG|#ffd200|#111111|Farião|49
br_boaesporte|Boa Esporte|BOA|#1d4ed8|#ffffff|Melão|53
br_athleticclub|Athletic Club|ATH|#111111|#ffffff|Joaquim Portugal|55
br_coimbra|Coimbra|COI|#2563eb|#ffd200|Arena Coimbra|52
br_patrocinense|Patrocinense|PAT|#1d4ed8|#ffffff|Pedro Alves do Nascimento|51
br_pousoalegre|Pouso Alegre|POU|#c8102e|#111111|Manduzão|53
br_democratagv|Democrata-GV|DEM|#111111|#ffffff|Mamudão|51
br_betim|Betim|BET|#c8102e|#111111|Estádio Municipal de Betim|52
br_north|North|NTH|#16a34a|#ffffff|José Maria de Melo|52
br_itabirito|Itabirito|ITB|#1d4ed8|#ffffff|Castor Cifuentes|52
br_aimore|Aimoré|AIM|#1e40af|#ffffff|Cristo Rei|52
br_brasilpelotas|Brasil de Pelotas|BRP|#c8102e|#111111|Bento Freitas|55
br_cruzeirors|Cruzeiro-RS|CRS|#1e40af|#ffffff|Estrelão|50
br_gloria|Glória|GLO|#16a34a|#ffffff|Altos da Glória|49
br_lajeadense|Lajeadense|LAJ|#1d4ed8|#ffffff|Arena Alviazul|49
br_novohamburgo|Novo Hamburgo|NOH|#1e40af|#ffffff|Estádio do Vale|53
br_passofundo|Passo Fundo|PFU|#c8102e|#1d4ed8|Vermelhão da Serra|49
br_saojosers|São José-RS|SJO|#1e40af|#ffffff|Passo D'Areia|53
br_saopaulors|São Paulo-RS|SPR|#c8102e|#ffffff|Aldo Dapuzzo|49
br_veranopolis|Veranópolis|VER|#1d4ed8|#ffffff|Antônio David Farina|49
br_ypiranga|Ypiranga|YPI|#00843d|#ffd200|Colosso da Lagoa|54
br_caxias|Caxias|CAX|#8b0d32|#ffffff|Centenário|56
br_esportivo|Esportivo|ESP|#1d4ed8|#c8102e|Montanha dos Vinhedos|50
br_pelotas|Pelotas|PEL|#1e40af|#ffd200|Boca do Lobo|52
br_saoluiz|São Luiz|SLU|#c8102e|#ffffff|19 de Outubro|52
br_avenida|Avenida|AVE|#00843d|#ffffff|Eucaliptos|52
br_guaranybage|Guarany de Bagé|GBA|#c8102e|#ffffff|Estrela D'Alva|50
br_monsoon|Monsoon|MON|#7c3aed|#ffffff|Passo D'Areia|50
br_intersm|Inter de Santa Maria|ISM|#c8102e|#ffffff|Presidente Vargas|50
br_fccascavel|FC Cascavel|FCC|#ffd200|#111111|Olímpico Regional|54
br_cascavelcr|Cascavel CR|CCR|#16a34a|#ffffff|Olímpico Regional|51
br_foziguacu|Foz do Iguaçu|FOZ|#1e40af|#ffffff|ABC|50
br_gremiomaringa|Grêmio Maringá|GMA|#1d4ed8|#111111|Willie Davids|50
br_jmalucelli|J. Malucelli|JMA|#16a34a|#ffffff|Eco-Estádio Janguito Malucelli|51
br_londrina|Londrina|LEC|#0ea5e9|#ffffff|Estádio do Café|58
br_operariopr|Operário-PR|OPE|#111111|#ffffff|Germano Krüger|59
br_parana|Paraná|PAR|#1e40af|#c8102e|Vila Capanema|56
br_pstc|PSTC|PST|#c8102e|#1d4ed8|Ubirajara Medeiros|49
br_riobrancopr|Rio Branco-PR|RBP|#c8102e|#ffffff|Estádio da Estradinha|49
br_toledo|Toledo|TOL|#1d4ed8|#ffffff|14 de Dezembro|49
br_azuriz|Azuriz|AZU|#1e40af|#ffffff|Os Pioneiros|53
br_cianorte|Cianorte|CIA|#1d4ed8|#ffffff|Albino Turbay|52
br_maringa|Maringá|MFC|#1e3a8a|#ffffff|Willie Davids|54
br_andraus|Andraus|AND|#0ea5e9|#111111|Estádio do Andraus|50
br_galomaringa|Galo Maringá|GAL|#c8102e|#111111|Willie Davids|50
br_saojoseense|São Joseense|SJS|#16a34a|#ffffff|Estádio Municipal de São José dos Pinhais|49
br_brusque|Brusque|BRU|#ffd200|#16a34a|Augusto Bauer|56
br_camboriu|Camboriú|CBU|#c8102e|#ffffff|Robertão|50
br_guaranipalhoca|Guarani de Palhoça|GPA|#00843d|#ffffff|Renato Silveira|49
br_interlages|Inter de Lages|ILA|#c8102e|#ffffff|Vidal Ramos Júnior|49
br_metropolitano|Metropolitano|MET|#1d4ed8|#ffffff|Sesi|49
br_concordia|Concórdia|CON|#1d4ed8|#ffffff|Domingos Machado de Lima|49
br_hercilioluz|Hercílio Luz|HER|#16a34a|#ffffff|Aníbal Costa|50
br_juventussc|Juventus-SC|JSC|#8b0d32|#ffffff|João Marcatto|50
br_marciliodias|Marcílio Dias|MDI|#c8102e|#1d4ed8|Gigantinho|53
br_prospera|Próspera|PRO|#f97316|#111111|Mário Balsini|49
br_barra|Barra|BAR|#0ea5e9|#ffffff|Arena Barra|53
br_carlosrenaux|Carlos Renaux|CRE|#1d4ed8|#ffffff|Augusto Bauer|50
br_santacatarina|Santa Catarina|SCA|#ef4444|#ffffff|Alfredo João Krieck|49
br_galicia|Galícia|GLC|#1d4ed8|#ffffff|Parque Santiago|49
br_juazeirense|Juazeirense|JUA|#1d4ed8|#c8102e|Adauto Moraes|53
br_flamengoguanambi|Flamengo de Guanambi|FLG|#c8102e|#111111|Estádio Municipal de Guanambi|48
br_bahiadefeira|Bahia de Feira|BDF|#1d4ed8|#c8102e|Joia da Princesa|52
br_colocolo|Colo Colo-BA|CCO|#111111|#ffffff|Mário Pessoa|48
br_jacobina|Jacobina|JAC|#16a34a|#ffffff|José Rocha|48
br_fluminensefeira|Fluminense de Feira|FDF|#16a34a|#ffffff|Joia da Princesa|51
br_conquista|Vitória da Conquista|VDC|#ffd200|#16a34a|Lomanto Júnior|51
br_feirense|Feirense|FEI|#1d4ed8|#ffffff|Joia da Princesa|48
br_jacuipense|Jacuipense|JCP|#c8102e|#ffffff|Eliel Martins|53
br_alagoinhas|Atlético de Alagoinhas|ATA|#c8102e|#ffffff|Carneirão|53
br_docemel|Doce Mel|DME|#ffd200|#111111|Pedro Caetano|48
br_unirb|UNIRB|UNI|#1d4ed8|#ffffff|Pituaçu|48
br_barcelonailheus|Barcelona de Ilhéus|BDI|#c8102e|#1d4ed8|Mário Pessoa|51
br_jequie|Jequié|JEQ|#16a34a|#ffffff|Waldomiro Borges|50
br_portoba|Porto-BA|PBA|#1d4ed8|#ffffff|Estádio Municipal de Porto Seguro|50
br_nautico|Náutico|NAU|#c8102e|#ffffff|Aflitos|58
br_salgueiro|Salgueiro|SAL|#1d4ed8|#ffffff|Cornélio de Barros|51
br_americape|América-PE|AMP|#16a34a|#ffffff|Ademir Cunha|48
br_atleticope|Atlético Pernambucano|ATP|#c8102e|#111111|Ademir Cunha|47
br_belojardim|Belo Jardim|BJA|#1d4ed8|#ffffff|Estádio Mendonção|47
br_central|Central|CEN|#111111|#ffffff|Lacerdão|50
br_pesqueira|Pesqueira|PES|#c8102e|#ffffff|Estádio Joaquim de Brito|46
br_portope|Porto-PE|POP|#1d4ed8|#ffffff|Estádio Antônio Inácio|47
br_serratalhada|Serra Talhada|SET|#c8102e|#111111|Pereirão|47
br_vitoriatabocas|Vitória das Tabocas|VDT|#16a34a|#ffffff|Carneirão|50
br_afogados|Afogados|AFO|#1d4ed8|#ffd200|Vianão|48
br_retro|Retrô|RET|#f59e0b|#111111|Arena de Pernambuco|53
br_setedesetembro|Sete de Setembro|SDS|#16a34a|#ffffff|Estádio Municipal de Garanhuns|46
br_veracruzpe|Vera Cruz|VCR|#c8102e|#ffffff|Estádio Municipal de Vitória de Santo Antão|46
br_decisao|Decisão|DEC|#16a34a|#ffffff|Estádio Municipal de Goiana|48
br_jaguar|Jaguar|JAG|#f59e0b|#111111|Arena de Pernambuco|47
br_maguary|Maguary|MAG|#1d4ed8|#ffffff|Arena de Pernambuco|48
br_atleticocearense|Atlético Cearense|ATC|#c8102e|#111111|Presidente Vargas|50
br_barbalha|Barbalha|BRB|#16a34a|#ffffff|Inaldão|47
br_caucaia|Caucaia|CAU|#1d4ed8|#ffffff|Raimundo de Oliveira|50
br_crato|Crato|CRT|#16a34a|#ffffff|Mirandão|47
br_ferroviarioce|Ferroviário|FCE|#111111|#c8102e|Elzir Cabral|54
br_guaranysobral|Guarany de Sobral|GDS|#111111|#ffffff|Junco|49
br_icasa|Icasa|ICA|#16a34a|#ffffff|Romeirão|50
br_pacajus|Pacajus|PJS|#1d4ed8|#ffffff|Estádio Municipal de Pacajus|47
br_floresta|Floresta|FLO|#16a34a|#ffffff|Domingão|52
br_horizonte|Horizonte|HOR|#c8102e|#ffffff|Domingão|50
br_iguatu|Iguatu|IGU|#1d4ed8|#ffffff|Morenão|50
br_maracana|Maracanã|MRC|#c8102e|#ffffff|Almir Dantas Pinto|49
br_maranguape|Maranguape|MRG|#16a34a|#ffffff|Moraizão|47
br_quixada|Quixadá|QXD|#1d4ed8|#ffd200|Abilhão|46
br_tirol|Tirol|TIR|#1d4ed8|#ffffff|Presidente Vargas|46
br_anapolis|Anápolis|ANA|#c8102e|#ffffff|Jonas Duarte|51
br_itumbiara|Itumbiara|ITM|#c8102e|#ffffff|JK|49
br_crac|CRAC|CRC|#1d4ed8|#c8102e|Genervino da Fonseca|50
br_trindade|Trindade|TRD|#c8102e|#ffffff|Abrahão Ribeiro Teixeira|46
br_aparecidense|Aparecidense|APA|#1d4ed8|#ffffff|Annibal Batista de Toledo|53
br_goianesia|Goianésia|GNS|#16a34a|#ffffff|Valdeir José de Oliveira|48
br_anapolina|Anapolina|ANP|#c8102e|#1d4ed8|Jonas Duarte|48
br_jataiense|Jataiense|JAT|#16a34a|#ffffff|Arthur Marques|48
br_gremioanapolis|Grêmio Anápolis|GAN|#1d4ed8|#111111|Jonas Duarte|51
br_ipora|Iporá|IPO|#ffd200|#16a34a|Ferreirão|47
br_jaragua|Jaraguá|JRG|#c8102e|#ffffff|Estádio Municipal de Jaraguá|46
br_inhumas|Inhumas|INH|#16a34a|#ffffff|Zico Brandão|47
br_goiatuba|Goiatuba|GTB|#1d4ed8|#ffffff|Divino Garcia Rosa|47
br_abecat|ABECAT|ABE|#f59e0b|#111111|Jonas Duarte|47
br_centrooeste|Centro Oeste|COE|#16a34a|#ffd200|Estádio Municipal de Nova Crixás|47
br_paysandu|Paysandu|PAY|#0ea5e9|#ffffff|Curuzu|59
br_aguiamaraba|Águia de Marabá|AGU|#1d4ed8|#ffffff|Zinho Oliveira|51
br_amazonia|Amazônia|AMZ|#16a34a|#ffffff|Mangueirão|47
br_bragantinopa|Bragantino-PA|BRG|#c8102e|#ffffff|Diogão|47
br_cameta|Cametá|CMT|#1d4ed8|#ffffff|Parque do Bacurau|48
br_capitaopoco|Capitão Poço|CPP|#16a34a|#ffffff|Estádio Municipal de Capitão Poço|46
br_castanhal|Castanhal|CAS|#111111|#ffd200|Maximino Porpino|49
br_santarosa|Santa Rosa|SRO|#c8102e|#ffffff|Mangueirão|46
br_saofrancisco|São Francisco|SFR|#1d4ed8|#ffffff|Colosso do Tapajós|46
br_saoraimundopa|São Raimundo-PA|SRA|#111111|#ffffff|Colosso do Tapajós|47
br_tunaluso|Tuna Luso|TUN|#16a34a|#c8102e|Francisco Vasques|48
br_acao|Ação|ACA|#16a34a|#ffffff|Dutrinha|48
br_dombosco|Dom Bosco|DBO|#1d4ed8|#ffffff|Dutrinha|48
br_gremiosorriso|Grêmio Sorriso|GSO|#1d4ed8|#111111|Egídio José Preima|47
br_luverdense|Luverdense|LUV|#16a34a|#ffffff|Passo das Emas|53
br_novamutum|Nova Mutum|NMU|#c8102e|#ffffff|Valdir Doilho Wons|49
br_operariovg|Operário VG|OVG|#111111|#ffffff|Dutrinha|51
br_pocone|Poconé|POC|#1d4ed8|#ffffff|Neco Falcão|46
br_sinop|Sinop|SIN|#1d4ed8|#ffffff|Gigante do Norte|48
br_uniaorondonopolis|União Rondonópolis|URO|#c8102e|#ffffff|Engenheiro Luthero Lopes|50
br_crb|CRB|CRB|#c8102e|#ffffff|Rei Pelé|58
br_cse|CSE|CSE|#1d4ed8|#ffffff|Juca Sampaio|49
br_alianca|Aliança|ALI|#16a34a|#ffffff|Arnon de Mello|46
br_asa|ASA|ASA|#111111|#ffffff|Coaracy da Mata Fonseca|51
br_murici|Murici|MUR|#16a34a|#ffffff|José Gomes da Costa|47
br_jacioba|Jaciobá|JCB|#c8102e|#ffffff|Estádio Municipal de Pão de Açúcar|46
br_coruripe|Coruripe|CRP|#ffd200|#1d4ed8|Gerson Amaral|47
br_ceo|CEO|CEO|#f59e0b|#1d4ed8|Rei Pelé|46
`;
const STATE_CLUBS = {};
STATE_CLUB_ROWS.trim().split('\n').forEach((row) => {
  const [key, n, s, c1, c2, std, lvl] = row.split('|');
  STATE_CLUBS[key] = { key, n, s, c1, c2, std, lvl: +lvl };
});

// the championships: name in the game, full name, badge colour
const UF_INFO = {
  SP: ['Paulistão', 'Campeonato Paulista', '#c8102e'], RJ: ['Carioca', 'Campeonato Carioca', '#1e40af'],
  MG: ['Mineiro', 'Campeonato Mineiro', '#b91c1c'], RS: ['Gauchão', 'Campeonato Gaúcho', '#15803d'],
  PR: ['Paranaense', 'Campeonato Paranaense', '#166534'], SC: ['Catarinense', 'Campeonato Catarinense', '#dc2626'],
  BA: ['Baiano', 'Campeonato Baiano', '#1d4ed8'], PE: ['Pernambucano', 'Campeonato Pernambucano', '#2563eb'],
  CE: ['Cearense', 'Campeonato Cearense', '#16a34a'], GO: ['Goiano', 'Campeonato Goiano', '#0f766e'],
  PA: ['Paraense', 'Campeonato Paraense', '#e11d48'], MT: ['Mato-Grossense', 'Campeonato Mato-Grossense', '#1e3a8a'],
  AL: ['Alagoano', 'Campeonato Alagoano', '#9f1239'],
};
for (const uf in UF_INFO) COMP_LOGO['EST' + uf] = UF_INFO[uf][2];
COMP_LOGO.COPINHA = '#0f766e';
FUTCOIN_TABLE.COPINHA = 20;

// Editions by era (the real ones of 2016, 2021 and 2026; later years repeat the format of the era).
// ph: league phases. play: rr (everyone once), rr2 (twice), cross (only the clubs of the other groups), within (inside
// the group), within2 (inside the group, twice), all2 (everyone twice, tables by group), pots (n matchdays drawn from
// four pots, like the 2026 Paulistão). g: the groups; split: n groups drawn by strength; t: a single table.
// add: clubs that only enter in that phase. q: who goes on: top n of the phase table, or per group (+ best next ones).
// ko: [name, legs, byes]: byes = best seeds that skip that round.
const QF = 'Quartas de final', SF = 'Semifinal', FI = 'Final';
const STATE_ED = {
  2016: {
    SP: { ph: [{ play: 'cross', g: [['santos', 'br_saobento', 'br_linense', 'br_botafogosp', 'br_oeste'], ['palmeiras', 'br_saobernardo', 'pontepreta', 'br_ituano', 'novorizontino'],
      ['br_audax', 'saopaulo', 'br_ferroviaria', 'br_xvpiracicaba', 'br_capivariano'], ['corinthians', 'br_redbullbrasil', 'br_aguasanta', 'br_mogimirim', 'br_rioclaro']], q: { per: 2 } }],
      ko: [[QF, 1], [SF, 1], [FI, 2]] },
    RJ: { ph: [{ play: 'cross', g: [['vasco', 'br_boavista', 'fluminense', 'br_bangu', 'br_cabofriense', 'br_portuguesarj', 'br_resende', 'br_macae'],
      ['botafogo', 'flamengo', 'br_voltaredonda', 'br_madureira', 'br_americarj', 'br_friburguense', 'br_tigresbrasil', 'br_bonsucesso']], q: { per: 4 } }],
      ko: [[QF, 1], [SF, 1], [FI, 2]] },
    MG: { ph: [{ play: 'rr', t: ['cruzeiro', 'atleticomg', 'br_urt', 'americamg', 'br_caldense', 'br_villanova', 'br_tricordiano', 'br_tombense', 'br_tupi', 'br_uberlandia', 'br_guaranimg', 'br_boaesporte'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    RS: { ph: [{ play: 'rr', t: ['br_aimore', 'br_brasilpelotas', 'br_cruzeirors', 'br_gloria', 'gremio', 'internacional', 'juventude', 'br_lajeadense', 'br_novohamburgo', 'br_passofundo',
      'br_saojosers', 'br_saopaulors', 'br_veranopolis', 'br_ypiranga'], q: { top: 8 } }], ko: [[QF, 1], [SF, 2], [FI, 2]] },
    PR: { ph: [{ play: 'rr', t: ['athletico', 'br_fccascavel', 'coritiba', 'br_foziguacu', 'br_gremiomaringa', 'br_jmalucelli', 'br_londrina', 'br_operariopr', 'br_parana', 'br_pstc', 'br_riobrancopr', 'br_toledo'], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    SC: { ph: [{ play: 'rr2', t: ['avai', 'br_brusque', 'br_camboriu', 'chapecoense', 'criciuma', 'figueirense', 'br_guaranipalhoca', 'br_interlages', 'joinville', 'br_metropolitano'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    BA: { ph: [{ play: 'cross', g: [['vitoria', 'br_galicia', 'br_juazeirense', 'br_flamengoguanambi', 'br_bahiadefeira', 'br_colocolo'], ['bahia', 'br_jacobina', 'br_fluminensefeira', 'br_conquista', 'br_feirense', 'br_jacuipense']], q: { per: 4 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    PE: { ph: [{ play: 'within2', split: 2, t: ['br_americape', 'br_atleticope', 'br_belojardim', 'br_central', 'br_pesqueira', 'br_portope', 'br_serratalhada', 'br_vitoriatabocas'], q: { per: 1 }, label: 'Primeira fase' },
      { play: 'rr2', add: ['sport', 'santacruz', 'br_nautico', 'br_salgueiro'], q: { top: 4 }, label: 'Hexagonal' }], ko: [[SF, 2], [FI, 2]] },
    GO: { ph: [{ play: 'all2', g: [['goias', 'br_anapolis', 'br_itumbiara', 'br_crac', 'br_trindade'], ['atleticogo', 'vilanova', 'br_aparecidense', 'br_goianesia', 'br_anapolina']], q: { per: 2 } }],
      ko: [[SF, 2], [FI, 2]] },
  },
  2021: {
    SP: { ph: [{ play: 'cross', g: [['corinthians', 'br_interlimeira', 'br_santoandre', 'br_botafogosp'], ['saopaulo', 'br_ferroviaria', 'pontepreta', 'br_saobento'],
      ['bragantino', 'palmeiras', 'novorizontino', 'br_ituano'], ['mirassol', 'br_guarani', 'santos', 'br_saocaetano']], q: { per: 2 } }], ko: [[QF, 1], [SF, 1], [FI, 2]] },
    RJ: { ph: [{ play: 'rr', t: ['flamengo', 'fluminense', 'br_portuguesarj', 'br_voltaredonda', 'vasco', 'br_novaiguacu', 'botafogo', 'br_madureira', 'br_resende', 'br_boavista', 'br_bangu', 'br_macae'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    MG: { ph: [{ play: 'rr', t: ['americamg', 'br_athleticclub', 'atleticomg', 'br_boaesporte', 'br_caldense', 'br_coimbra', 'cruzeiro', 'br_patrocinense', 'br_pousoalegre', 'br_tombense', 'br_uberlandia', 'br_urt'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    RS: { ph: [{ play: 'rr', t: ['br_aimore', 'br_brasilpelotas', 'br_caxias', 'br_esportivo', 'gremio', 'internacional', 'juventude', 'br_novohamburgo', 'br_pelotas', 'br_saojosers', 'br_saoluiz', 'br_ypiranga'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    PR: { ph: [{ play: 'rr', t: ['athletico', 'br_azuriz', 'br_cascavelcr', 'br_cianorte', 'coritiba', 'br_fccascavel', 'br_londrina', 'br_maringa', 'br_operariopr', 'br_parana', 'br_riobrancopr', 'br_toledo'], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    SC: { ph: [{ play: 'rr', t: ['avai', 'br_brusque', 'chapecoense', 'br_concordia', 'criciuma', 'figueirense', 'br_hercilioluz', 'joinville', 'br_juventussc', 'br_marciliodias', 'br_metropolitano', 'br_prospera'], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    BA: { ph: [{ play: 'rr', t: ['br_alagoinhas', 'bahia', 'br_bahiadefeira', 'br_docemel', 'br_fluminensefeira', 'br_jacuipense', 'br_juazeirense', 'br_unirb', 'vitoria', 'br_conquista'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
    PE: { ph: [{ play: 'rr', t: ['br_afogados', 'br_central', 'br_nautico', 'br_retro', 'br_salgueiro', 'santacruz', 'br_setedesetembro', 'sport', 'br_veracruzpe', 'br_vitoriatabocas'], q: { top: 6 } }],
      ko: [[QF, 1, 2], [SF, 1], [FI, 2]] },
    CE: { ph: [{ play: 'rr', t: ['br_atleticocearense', 'br_barbalha', 'br_caucaia', 'br_crato', 'br_ferroviarioce', 'br_guaranysobral', 'br_icasa', 'br_pacajus'], q: { top: 6 }, label: 'Primeira fase' },
      { play: 'rr', add: ['ceara', 'fortaleza'], q: { top: 4 }, label: 'Segunda fase' }], ko: [[SF, 1], [FI, 1]] },
    GO: { ph: [{ play: 'within2', g: [['atleticogo', 'br_jataiense', 'br_crac', 'br_itumbiara', 'br_gremioanapolis', 'br_anapolis'], ['goias', 'vilanova', 'br_goianesia', 'br_aparecidense', 'br_ipora', 'br_jaragua']], q: { per: 4 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    MT: { ph: [{ play: 'rr', t: ['br_acao', 'cuiaba', 'br_dombosco', 'br_gremiosorriso', 'br_luverdense', 'br_novamutum', 'br_operariovg', 'br_pocone', 'br_sinop', 'br_uniaorondonopolis'], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    AL: { ph: [{ play: 'rr', t: ['br_crb', 'csa', 'br_cse', 'br_alianca', 'br_asa', 'br_murici', 'br_jacioba', 'br_coruripe', 'br_ceo'], q: { top: 4 } }],
      ko: [[SF, 2], [FI, 2]] },
  },
  2026: {
    SP: { ph: [{ play: 'pots', n: 8, t: ['br_botafogosp', 'br_capivariano', 'corinthians', 'br_guarani', 'mirassol', 'br_noroeste', 'novorizontino', 'palmeiras', 'pontepreta', 'br_portuguesa', 'br_primavera',
      'bragantino', 'santos', 'br_saobernardo', 'saopaulo', 'br_veloclube'], q: { top: 8 } }], ko: [[QF, 1], [SF, 1], [FI, 2]] },
    RJ: { ph: [{ play: 'cross', g: [['fluminense', 'vasco', 'br_voltaredonda', 'br_sampaiocorrearj', 'br_portuguesarj', 'br_bangu'], ['flamengo', 'botafogo', 'br_madureira', 'br_marica', 'br_boavista', 'br_novaiguacu']], q: { per: 4 } }],
      ko: [[QF, 1], [SF, 2], [FI, 1]] },
    MG: { ph: [{ play: 'cross', g: [['atleticomg', 'br_urt', 'br_uberlandia', 'br_democratagv'], ['americamg', 'br_pousoalegre', 'br_tombense', 'br_betim'], ['cruzeiro', 'br_north', 'br_itabirito', 'br_athleticclub']], q: { per: 1, best: 1 } }],
      ko: [[SF, 2], [FI, 1]] },
    RS: { ph: [{ play: 'cross', g: [['internacional', 'juventude', 'br_avenida', 'br_saojosers', 'br_guaranybage', 'br_saoluiz'], ['gremio', 'br_caxias', 'br_novohamburgo', 'br_monsoon', 'br_ypiranga', 'br_intersm']], q: { per: 4 } }],
      ko: [[QF, 1], [SF, 2], [FI, 2]] },
    PR: { ph: [{ play: 'cross', split: 2, t: ['br_andraus', 'athletico', 'br_azuriz', 'br_cianorte', 'coritiba', 'br_fccascavel', 'br_foziguacu', 'br_galomaringa', 'br_londrina', 'br_maringa', 'br_operariopr', 'br_saojoseense'], q: { per: 4 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    SC: { ph: [{ play: 'cross', split: 2, t: ['avai', 'br_barra', 'br_brusque', 'br_camboriu', 'br_carlosrenaux', 'chapecoense', 'br_concordia', 'criciuma', 'figueirense', 'joinville', 'br_marciliodias', 'br_santacatarina'], q: { per: 4 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    BA: { ph: [{ play: 'rr', t: ['br_alagoinhas', 'bahia', 'br_bahiadefeira', 'br_barcelonailheus', 'br_galicia', 'br_jacuipense', 'br_jequie', 'br_juazeirense', 'br_portoba', 'vitoria'], q: { top: 4 } }],
      ko: [[SF, 1], [FI, 1]] },
    PE: { ph: [{ play: 'rr', t: ['br_decisao', 'br_jaguar', 'br_maguary', 'br_nautico', 'br_retro', 'santacruz', 'sport', 'br_vitoriatabocas'], q: { top: 6 } }],
      ko: [[QF, 2, 2], [SF, 2], [FI, 2]] },
    CE: { ph: [{ play: 'within', g: [['fortaleza', 'br_ferroviarioce', 'br_maracana', 'br_horizonte', 'br_quixada'], ['ceara', 'br_floresta', 'br_iguatu', 'br_tirol', 'br_maranguape']], q: { per: 3 }, label: 'Primeira fase' },
      { play: 'rr', q: { top: 4 }, label: 'Segunda fase' }], ko: [[SF, 2], [FI, 2]] },
    GO: { ph: [{ play: 'cross', g: [['vilanova', 'br_crac', 'br_inhumas', 'br_goiatuba'], ['br_anapolis', 'goias', 'br_jataiense', 'br_aparecidense'], ['atleticogo', 'br_abecat', 'br_centrooeste', 'br_anapolina']], q: { top: 8 } }],
      ko: [[QF, 2], [SF, 2], [FI, 2]] },
    PA: { ph: [{ play: 'cross', split: 2, t: ['br_aguiamaraba', 'br_amazonia', 'br_bragantinopa', 'br_cameta', 'br_capitaopoco', 'br_castanhal', 'br_paysandu', 'remo', 'br_santarosa', 'br_saofrancisco', 'br_saoraimundopa', 'br_tunaluso'], q: { top: 8 } }],
      ko: [[QF, 1], [SF, 1], [FI, 2]] },
  },
};
// 3 groups of 4 where every club meets the 8 clubs of the other groups once: 8 matchdays (team index = group * 4 + i)
const CROSS_3X4 = [[[0, 5], [1, 7], [2, 11], [3, 8], [4, 9], [6, 10]], [[0, 9], [1, 4], [2, 8], [3, 7], [5, 10], [6, 11]], [[0, 11], [1, 10], [2, 7], [3, 4], [5, 9], [6, 8]],
  [[0, 6], [1, 11], [2, 4], [3, 10], [5, 8], [7, 9]], [[0, 4], [1, 9], [2, 10], [3, 6], [5, 11], [7, 8]], [[0, 10], [1, 5], [2, 6], [3, 9], [4, 8], [7, 11]],
  [[0, 8], [1, 6], [2, 9], [3, 5], [4, 11], [7, 10]], [[0, 7], [1, 8], [2, 5], [3, 11], [4, 10], [6, 9]]];

const stateEditions = () => (S.mode === 'normal' && STATE_ED[S.era]) || null;
function stateEditionKeys(ed) {
  const keys = new Set();
  for (const uf in ed) {
    if (uf === 'copinha') continue;
    for (const ph of ed[uf].ph) [].concat(ph.t || [], (ph.g || []).flat(), ph.add || []).forEach((k) => keys.add(k));
  }
  return keys;
}
// create the clubs the state championships need (new careers and old saves alike); returns how many were created
function ensureStateClubs() {
  const ed = stateEditions();
  if (!ed) return 0;
  let n = 0;
  for (const key of stateEditionKeys(ed)) if (!teamIdByKey(key) && createStateClub(key)) n++;
  if (n) KEY_IDX = null;
  return n;
}
function createStateClub(key) {
  const d = STATE_CLUBS[key];
  if (!d) return 0;
  const id = Math.max(...Object.keys(S.teams).map(Number).filter((x) => x < 900000)) + 1;
  const t = { id, key, n: d.n, s: d.s, c: 'BRA', c1: d.c1, c2: d.c2, ext: 0, std: d.std, fin: d.lvl >= 57 ? 2 : 1, sq: [], form: pick(['4-3-3', '4-4-2', '4-2-3-1']),
    budget: 0, wb: 0, stOnly: 1 };
  S.teams[id] = t;
  const lvl = d.lvl + (S.era === 2016 ? -1 : 0);
  const plan = [['GK', 2], ['GK', -4], ['GK', -9], ['RB', 1], ['RB', -5], ['CB', 2], ['CB', 1], ['CB', -2], ['CB', -6], ['LB', 0], ['LB', -6], ['CDM', 1], ['CDM', -4],
    ['CM', 2], ['CM', 0], ['CM', -5], ['CAM', 1], ['RM', -3], ['LM', -3], ['RW', 1], ['LW', 0], ['ST', 3], ['ST', -1], ['ST', -6]];
  const y = yearOf(S.date);
  for (const [pos, off] of plan) {
    const age = rint(18, 34);
    const nat = rnd() < 0.05 ? pick(['ARG', 'URU', 'PAR', 'COL']) : 'BRA';
    const p = generatePlayer({ nat, pos, age, ovr: clamp(lvl + off + rint(-2, 2) - (age >= 33 ? 2 : 0), 40, 80), potBoost: age <= 21 ? rint(5, 16) : age <= 24 ? rint(1, 8) : rint(0, 3) });
    movePlayer(p, id, { ct: y + rint(1, 3) });
  }
  setBudgets(t);
  return id;
}
const stateClubId = (key) => (key ? teamIdByKey(key) : 0);
// the clubs that only play the state championship sign a few players in July so they keep their level
function refreshStateClub(t) {
  const d = STATE_CLUBS[t.key];
  if (!d) return;
  const base = d.lvl + (S.era === 2016 ? -1 : 0);
  t._rD = 0;
  const y = yearOf(S.date);
  for (let k = 0; k < 4 && (teamRating(t.id) < base - 1 || squadOf(t.id).length < 22); k++) {
    const sq = squadOf(t.id);
    const cnt = (g) => sq.filter((p) => POS_GROUP[p.p] === g).length;
    const pos = cnt('GK') < 2 ? 'GK' : cnt('DEF') < 7 ? pick(['CB', 'CB', 'RB', 'LB']) : cnt('MID') < 6 ? pick(['CM', 'CDM', 'CAM']) : pick(['ST', 'RW', 'LW', 'ST']);
    const p = generatePlayer({ nat: rnd() < 0.05 ? pick(['ARG', 'URU', 'PAR']) : 'BRA', pos, age: rint(22, 31), ovr: clamp(base + rint(-1, 3), 40, 80), potBoost: rint(0, 3) });
    movePlayer(p, t.id, { ct: y + rint(1, 2) });
    t._rD = 0;
  }
}

// matchdays: Wednesdays and Sundays spread over the window (2026, with the World Cup: January 10th to March 8th;
// the other years from mid-January to early April, before the Brasileirão and the Libertadores)
function stateWindow(y) {
  if (y === 2026) return [dayOf(2026, 1, 10), dayOf(2026, 3, 8)];
  return [onOrAfter(dayOf(y, 1, 17), 0), onOrBefore(dayOf(y, 4, 5), 0)];
}
function stateSlots(y, need) {
  const [a, b] = stateWindow(y);
  const days = [a];
  for (let d = a + 1; d <= b; d++) if (weekday(d) === 0 || weekday(d) === 3) days.push(d);
  if (need >= days.length) { while (days.length < need) days.push(days[days.length - 1] + (weekday(days[days.length - 1]) === 0 ? 3 : 4)); return days; }
  // evenly spread, the final on the last day of the window
  return Array.from({ length: need }, (_, i) => days[Math.round((i * (days.length - 1)) / Math.max(1, need - 1))]);
}
// how many matchdays a championship needs (league phases + knockout legs)
function stateMatchdays(ph, ko) {
  const rr = (n) => n - 1 + (n % 2);
  let n = 0, prevQ = 0;
  ph.forEach((p, i) => {
    const groups = i === 0 ? (p.g ? p.g.map((g) => g.length) : p.split ? Array(p.split).fill(Math.ceil(p.t.length / p.split)) : [p.t.length]) : [prevQ + p.add.length];
    const tot = groups.reduce((x, y) => x + y, 0);
    if (p.play === 'rr') n += rr(tot);
    else if (p.play === 'rr2' || p.play === 'all2') n += 2 * rr(tot);
    else if (p.play === 'within') n += Math.max(...groups.map(rr));
    else if (p.play === 'within2') n += 2 * Math.max(...groups.map(rr));
    else if (p.play === 'pots') n += p.n;
    else if (p.play === 'cross') n += groups.length === 3 ? 8 : groups.length === 4 ? 3 * groups[0] : groups.length === 2 ? groups[0] : rr(tot);
    prevQ = p.q.top || groups.length * p.q.per + (p.q.best || 0);
  });
  return n + ko.reduce((x, k) => x + k.legs, 0);
}
function createStateChampionships(y) {
  const ed = stateEditions();
  if (!ed || S.zoeira) return;
  if (stateWindow(y)[0] <= S.date) return; // the career started after this year's state championships
  ensureStateClubs();
  for (const uf in ed) makeStateComp(uf, ed[uf], y);
}
function makeStateComp(uf, spec, y) {
  const [name, full] = UF_INFO[uf];
  const ids = (arr) => arr.map(stateClubId).filter((id) => id && S.teams[id]);
  const ph = spec.ph.map((p) => ({ play: p.play, n: p.n || 0, split: p.split || 0, label: p.label || '', q: p.q,
    g: p.g ? p.g.map(ids) : null, t: p.t ? ids(p.t) : null, add: p.add ? ids(p.add) : [] }));
  const all = uniq(ph.flatMap((p) => (p.g ? p.g.flat() : p.t || []).concat(p.add)));
  const ko = spec.ko.map(([n, legs, bye]) => ({ n, legs, bye: bye || 0 }));
  const slots = stateSlots(y, stateMatchdays(ph, ko));
  const c = newComp({ kind: 'groups', state: uf, key: 'EST' + uf, name, full, short: uf, zone: 'SA', season: String(y), year: y, teams: all,
    country: 'BRA', groups: [], koPlan: [], slots, si: 0, noET: 1, ph, ko, phase: -1, groupRounds: 0 });
  c.fmtNote = stateFormatNote(c);
  startStatePhase(c, 0, null);
  return c;
}
// splits clubs into n groups by strength (snake draft)
function snakeGroups(teams, n) {
  const sorted = teams.slice().sort(by((id) => teamRating(id) + rnd() * 3, -1));
  const g = Array.from({ length: n }, () => []);
  sorted.forEach((id, i) => { const r = Math.floor(i / n), k = i % n; g[r % 2 ? n - 1 - k : k].push(id); });
  return g;
}
function startStatePhase(c, idx, qualified) {
  const ph = c.ph[idx];
  let groups;
  if (idx === 0) groups = ph.g ? ph.g : ph.split ? snakeGroups(ph.t, ph.split) : [ph.t];
  else groups = [qualified.concat(ph.add)];
  if (c.groups.length) (c.oldGroups = c.oldGroups || []).push({ label: c.ph[c.phase].label || 'Primeira fase', groups: c.groups });
  const single = groups.length === 1;
  c.groups = groups.map((ts, gi) => ({ name: single ? (ph.label || 'Classificação') : String.fromCharCode(65 + gi), teams: ts.slice(), table: {} }));
  c.groupOf = {};
  c.groups.forEach((g, gi) => g.teams.forEach((t) => { c.groupOf[t] = gi; ensureRow(g.table, t); }));
  c.ptab = {};
  groups.flat().forEach((t) => ensureRow(c.ptab, t));
  c.phase = idx;
  c.phR0 = c.rounds.length;
  const rounds = statePairs(ph, groups);
  rounds.forEach((pairs, r) => {
    const base = Math.max(c.slots[c.si++] ?? c.rounds[c.rounds.length - 1].d + 4, S.date + 2);
    const rd = { name: `${!single || idx ? (ph.label ? ph.label + ' · ' : '') : ''}Rodada ${r + 1}`, d: base, m: [] };
    c.rounds.push(rd);
    pairs.forEach(([h, a], i) => {
      const day = weekday(base) === 0 && i % 2 ? base - 1 : base; // Sundays spread over the weekend
      const m = addMatch(c, c.rounds.length - 1, day, h, a, { idx: i, time: kickoffTime('SA', day, i) });
      m.ph = idx;
    });
  });
  c.phR1 = c.rounds.length;
  c.groupRounds = c.rounds.length;
}
// the pairs of every matchday of a phase
function statePairs(ph, groups) {
  const all = groups.flat();
  const balance = (rounds) => { // home and away as even as possible
    const home = {};
    all.forEach((t) => (home[t] = 0));
    rounds.forEach((pairs) => pairs.forEach((p) => { if (home[p[0]] > home[p[1]]) p.reverse(); home[p[0]]++; }));
    return rounds;
  };
  const within = (double) => {
    const per = groups.map((g) => roundRobin(shuffle(g.slice()), double));
    const n = Math.max(...per.map((r) => r.length));
    return Array.from({ length: n }, (_, r) => per.flatMap((rr) => rr[r] || []));
  };
  switch (ph.play) {
    case 'rr': return balance(roundRobin(shuffle(all.slice()), false));
    case 'rr2': case 'all2': return roundRobin(shuffle(all.slice()), true);
    case 'within': return within(false);
    case 'within2': return within(true);
    case 'pots': return balance(potRounds(all, ph.n || 8));
    case 'cross': return balance(crossRounds(groups.map((g) => shuffle(g.slice()))));
  }
  return roundRobin(all, false);
}
// every club plays the clubs of the other groups once
function crossRounds(groups) {
  const G = groups.length, n = groups[0].length;
  const equal = groups.every((g) => g.length === n);
  const shifts = (A, B) => Array.from({ length: n }, (_, r) => A.map((a, i) => [a, B[(i + r) % n]]));
  if (equal && G === 2) return shifts(groups[0], groups[1]);
  if (equal && G === 4) {
    const out = [];
    for (const [p, q, s, t] of [[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]]) {
      const x = shifts(groups[p], groups[q]), y = shifts(groups[s], groups[t]);
      x.forEach((pairs, r) => out.push(pairs.concat(y[r])));
    }
    return shuffle(out);
  }
  if (equal && G === 3 && n === 4) {
    const flat = groups.flat();
    return shuffle(CROSS_3X4.map((pairs) => pairs.map(([a, b]) => [flat[a], flat[b]])));
  }
  // fallback: a full round robin without the matches inside the groups
  const gOf = {};
  groups.forEach((g, gi) => g.forEach((t) => (gOf[t] = gi)));
  return roundRobin(shuffle(groups.flat()), false).map((pairs) => pairs.filter(([a, b]) => gOf[a] !== gOf[b])).filter((p) => p.length);
}
// n matchdays out of a full round robin, every club meeting each of the four pots about the same number of times
function potRounds(teams, n) {
  const sorted = teams.slice().sort(by((id) => teamRating(id), -1));
  const pot = {};
  sorted.forEach((t, i) => (pot[t] = Math.floor((i * 4) / sorted.length)));
  const per = n / 4;
  let best = null, bestScore = -1e9;
  for (let k = 0; k < 120; k++) {
    const rr = roundRobin(shuffle(teams.slice()), false);
    const rounds = shuffle(rr.map((_, i) => i)).slice(0, n).map((i) => rr[i]);
    const cnt = {};
    for (const pairs of rounds) for (const [a, b] of pairs) { cnt[a + ':' + pot[b]] = (cnt[a + ':' + pot[b]] || 0) + 1; cnt[b + ':' + pot[a]] = (cnt[b + ':' + pot[a]] || 0) + 1; }
    let score = 0;
    for (const t of teams) for (let p = 0; p < 4; p++) score -= Math.abs((cnt[t + ':' + p] || 0) - per);
    if (score > bestScore) { bestScore = score; best = rounds; }
  }
  return best.map((pairs) => pairs.map((p) => p.slice()));
}
function applySide(table, id, gf, ga) {
  const r = ensureRow(table, id);
  r.p++; r.gf += gf; r.ga += ga;
  if (gf > ga) { r.w++; r.pts += 3; } else if (gf === ga) { r.d++; r.pts++; } else r.l++;
}
// results of a state championship (called from recordResult)
function stateRecord(c, m) {
  if (m.tie) { cupAfterMatch(c, m); return; }
  if (m.ph !== c.phase) return;
  applyToTable(c.ptab, m);
  const gi = c.groupOf[m.h], gj = c.groupOf[m.a];
  if (gi === gj) applyToTable(c.groups[gi].table, m);
  else { applySide(c.groups[gi].table, m.h, m.hg, m.ag); applySide(c.groups[gj].table, m.a, m.ag, m.hg); }
  for (let r = c.phR0; r < c.phR1; r++) if (!c.rounds[r].m.every((id) => S.matches[id] && S.matches[id].done)) return;
  statePhaseDone(c);
}
function statePhaseDone(c) {
  const ph = c.ph[c.phase];
  const rankAll = sortTable(c.ptab, Object.keys(c.ptab).map(Number)).map((r) => r.id);
  let qual;
  if (ph.q.top) qual = rankAll.slice(0, ph.q.top);
  else {
    const tabs = c.groups.map((g) => sortTable(g.table, g.teams).map((r) => r.id));
    qual = tabs.flatMap((t) => t.slice(0, ph.q.per));
    if (ph.q.best) qual = qual.concat(sortTable(c.ptab, tabs.map((t) => t[ph.q.per]).filter(Boolean)).slice(0, ph.q.best).map((r) => r.id));
  }
  qual = rankAll.filter((id) => qual.includes(id)); // seeded by the phase table
  if (c.phase + 1 < c.ph.length) { startStatePhase(c, c.phase + 1, qual); return; }
  c.seedRank = {};
  qual.forEach((id, i) => (c.seedRank[id] = i + 1));
  c.koStarted = true;
  c.koi = 0;
  c.onStageDone = 'stateKO';
  c.alive = qual;
  c.byes = [];
  stateKORound(c);
}
// a knockout round: best remaining seed against the worst one; the better seed hosts the single match or the second leg
function stateKORound(c) {
  const step = c.ko[c.koi];
  let entrants = c.alive.concat(c.byes || []).sort((a, b) => c.seedRank[a] - c.seedRank[b]);
  c.byes = step.bye ? entrants.slice(0, step.bye) : [];
  entrants = entrants.slice(c.byes.length);
  c.alive = entrants.slice();
  const d1 = Math.max(c.slots[c.si++] ?? c.rounds[c.rounds.length - 1].d + 4, S.date + 2);
  const d2 = step.legs === 2 ? Math.max(c.slots[c.si++] ?? d1 + 4, d1 + 3) : 0;
  const rd = { name: step.n, d: d1, m: [], ties: [] };
  c.rounds.push(rd);
  const r = c.rounds.length - 1;
  for (let i = 0; i < entrants.length / 2; i++) {
    const a = entrants[i], b = entrants[entrants.length - 1 - i];
    const tieId = nextId('tie');
    const tie = { id: tieId, r, a, b, m: [], w: 0 };
    c.ties[tieId] = tie;
    rd.ties.push(tieId);
    if (step.legs === 2) {
      const m1 = addMatch(c, r, d1, b, a, { tie: tieId, leg: 1, idx: i, time: kickoffTime('SA', d1, i) });
      const m2 = addMatch(c, r, Math.max(d2, m1.d + 3), a, b, { tie: tieId, leg: 2, idx: i, time: kickoffTime('SA', d2, i) });
      tie.m = [m1.id, m2.id];
    } else {
      const m1 = addMatch(c, r, d1, a, b, { tie: tieId, idx: i, time: kickoffTime('SA', d1, i) });
      tie.m = [m1.id];
    }
  }
}
STAGE_HOOKS.stateKO = (c) => { c.koi++; stateKORound(c); };

// the format in words, for the competition screen
function stateFormatNote(c) {
  const playTxt = { rr: 'todos contra todos em turno único', rr2: 'todos contra todos em ida e volta', within: 'turno único dentro do grupo', within2: 'ida e volta dentro do grupo',
    all2: 'todos contra todos em ida e volta, com classificação por grupo', cross: 'cada time enfrenta os adversários dos outros grupos', pots: '' };
  const parts = c.ph.map((p, i) => {
    const ng = p.g ? p.g.length : p.split || 1;
    const n = (p.g ? p.g.flat() : p.t || []).length + p.add.length;
    let txt = p.play === 'pots' ? `${n || ''} clubes em tabela única, ${p.n} rodadas contra adversários sorteados de quatro potes` : `${ng > 1 ? `${ng} grupos, ` : ''}${playTxt[p.play]}`;
    if (i && p.add.length) txt = `${p.label || 'Segunda fase'}: ${p.add.map(teamName).join(' e ')} entram; ${txt}`;
    else if (p.label) txt = `${p.label}: ${txt}`;
    const q = p.q.top ? `${p.q.top} melhores avançam` : `${p.q.per === 1 ? 'o líder' : `os ${p.q.per} primeiros`} de cada grupo${p.q.best ? ` e ${p.q.best === 1 ? 'o melhor segundo colocado' : `os ${p.q.best} melhores seguintes`}` : ''} avançam`;
    return `${txt} · ${q}`;
  });
  const ko = c.ko.map((k) => `${k.n.toLowerCase()} ${k.legs === 2 ? 'em ida e volta' : 'em jogo único'}${k.bye ? ` (os ${k.bye} melhores entram na fase seguinte)` : ''}`).join(', ');
  return `${parts.join(' · ')} · Mata-mata: ${ko}; a melhor campanha decide em casa.`;
}

/* ---------------- Copinha (Copa São Paulo de Futebol Júnior): the clubs' under-20 sides in January ---------------- */
function createCopinha(y) {
  if (S.mode !== 'normal' || S.zoeira) return;
  const d0 = dayOf(y, 1, 2);
  if (d0 <= S.date) return;
  const pool = Object.values(S.teams).filter((t) => !t.isNat && !t.ext && t.c === 'BRA' && t.sq.length >= 11).map((t) => t.id);
  if (pool.length < 32) return;
  const G = pool.length >= 96 ? 32 : pool.length >= 48 ? 16 : 8;
  const teams = pool.sort(by((id) => teamRating(id) + rnd() * 5, -1)).slice(0, 4 * G);
  const groups = Array.from({ length: G }, () => []);
  teams.forEach((id, i) => { const r = Math.floor(i / G), k = i % G; groups[r % 2 ? G - 1 - k : k].push(id); });
  const c = newComp({ kind: 'youth', copinha: 1, key: 'COPINHA', name: 'Copinha', full: 'Copa São Paulo de Futebol Júnior', short: 'SUB-20', zone: 'SA', season: String(y), year: y, teams });
  c.groups = groups.map((ts, i) => ({ name: String(i + 1), teams: ts, table: {} }));
  c.ystr = {};
  teams.forEach((t) => { c.ystr[t] = clamp(teamRating(t) - 15 + rfloat(-6, 6), 30, 80); });
  const gd = [dayOf(y, 1, 2), dayOf(y, 1, 5), dayOf(y, 1, 8)];
  c.ym = [];
  c.groups.forEach((g, gi) => {
    g.teams.forEach((t) => ensureRow(g.table, t));
    roundRobin(g.teams.slice(), false).forEach((pairs, r) => pairs.forEach(([h, a]) => c.ym.push({ r, d: gd[r] + (gi % 2), h, a, hg: null, ag: null, g: gi })));
  });
  const nKO = Math.round(Math.log2(2 * G));
  c.koDates = [11, 14, 17, 20, 22, 25].slice(6 - nKO).map((d) => dayOf(y, 1, d));
  c.ko = [];
  c.rounds = [{ name: 'Fase de grupos', d: gd[0], m: [] }];
  const uid = S.user.team;
  if (uid && !S.coach.unemployed && teams.includes(uid)) {
    const gi = c.groups.findIndex((g) => g.teams.includes(uid));
    addInbox('scout', 'Categorias de base', 'Copinha: os garotos entram em campo', `${TA(uid)} disputa a Copa São Paulo de Futebol Júnior a partir de ${fmtDate(d0, 'long')}, no grupo ${gi + 1} (${c.groups[gi].teams.filter((t) => t !== uid).map(teamName).join(', ')}). A final é em 25 de janeiro. Quem joga a Copinha também evolui.`);
  }
  return c;
}
function copinhaKOName(size, c) {
  if (size > 16) return c.ko.length ? 'Terceira fase' : 'Segunda fase';
  return koName(size);
}
function youthGame(c, h, a) {
  const sh = youthStrength(c, h), sa = youthStrength(c, a);
  const xh = 1.25 * Math.exp(0.06 * (sh - sa)), xa = 1.15 * Math.exp(0.06 * (sa - sh));
  return [binomial(7, clamp(xh / 7, 0.02, 0.8)), binomial(7, clamp(xa / 7, 0.02, 0.8))];
}
function playCopinhaDay(c) {
  if (c.done) return;
  for (const m of c.ym) {
    if (m.d !== S.date || m.hg !== null) continue;
    [m.hg, m.ag] = youthGame(c, m.h, m.a);
    applyToTable(c.groups[m.g].table, m);
    copinhaUserStats(c, m.h, m.a, m.hg, m.ag);
  }
  if (!c.koStarted) {
    if (!c.ym.every((m) => m.hg !== null)) return;
    c.koStarted = true;
    const tabs = c.groups.map((g) => sortTable(g.table, g.teams).map((r) => r.id));
    const pairs = [];
    for (let i = 0; i < tabs.length; i += 2) { pairs.push([tabs[i][0], tabs[i + 1][1]]); pairs.push([tabs[i + 1][0], tabs[i][1]]); }
    c.ko.push({ name: copinhaKOName(pairs.length * 2, c), d: c.koDates[0], ties: pairs.map(([a, b]) => ({ a, b, hg: null, ag: null, pen: null, w: 0 })) });
    return;
  }
  const rd = c.ko[c.ko.length - 1];
  if (!rd || rd.d !== S.date) return;
  for (const t of rd.ties) {
    if (t.w) continue;
    [t.hg, t.ag] = youthGame(c, t.a, t.b);
    if (t.hg === t.ag) {
      const pa = 3 + binomial(2, 0.75), pb = 3 + binomial(2, 0.75);
      t.pen = pa === pb ? (rnd() < 0.5 ? [pa + 1, pb] : [pa, pb + 1]) : [pa, pb];
    }
    t.w = t.hg > t.ag || (t.pen && t.pen[0] > t.pen[1]) ? t.a : t.b;
    copinhaUserStats(c, t.a, t.b, t.hg, t.ag);
  }
  const winners = rd.ties.map((t) => t.w);
  if (winners.length === 1) { finishCopinha(c, winners[0], rd.ties[0].w === rd.ties[0].a ? rd.ties[0].b : rd.ties[0].a); return; }
  const pairs = [];
  for (let i = 0; i < winners.length; i += 2) pairs.push([winners[i], winners[i + 1]]);
  c.ko.push({ name: copinhaKOName(winners.length, c), d: c.koDates[c.ko.length], ties: pairs.map(([a, b]) => ({ a, b, hg: null, ag: null, pen: null, w: 0 })) });
}
// the user's academy players: appearances (they count for development) and goals
function copinhaUserStats(c, h, a, hg, ag) {
  const uid = S.user.team;
  if (!uid || S.coach.unemployed || (h !== uid && a !== uid)) return;
  const ys = S.youth.squad.map((id) => S.players[id]).filter(Boolean).sort(by((p) => p.o, -1)).slice(0, 14);
  if (ys.length < 8) return;
  const goals = h === uid ? hg : ag;
  const w = { ST: 5, LW: 3, RW: 3, CAM: 3, LM: 2, RM: 2, CM: 1.5, CDM: 0.7, LB: 0.5, RB: 0.5, CB: 0.6, GK: 0 };
  for (const p of ys) {
    const row = ((p.st = p.st || {})[c.id] = (p.st[c.id] || [0, 0, 0, 0, 0, uid, 0]));
    row[0]++;
    p.ay = (p.ay || 0) + 1; p.aq = (p.aq || 0) + 1;
  }
  for (let g = 0; g < goals; g++) {
    const p = weighted(ys, (x) => (w[x.p] ?? 1) * Math.pow(Math.max(30, x.a ? x.a[1] : x.o) / 60, 2));
    if (p) { p.st[c.id][1]++; p.car = p.car || [0, 0, 0]; }
  }
}
function finishCopinha(c, ch, ru) {
  c.done = true;
  c.champion = ch;
  S.hist.push({ key: 'COPINHA', name: 'Copinha', season: c.season, year: c.year, ch, ru, chN: teamName(ch), ruN: teamName(ru), ts: null });
  (S.titles[ch] = S.titles[ch] || []).push({ key: 'COPINHA', name: 'Copinha', season: c.season });
  if (S.presim) return;
  const uid = S.user.team;
  if (uid && !S.coach.unemployed && ch === uid) {
    const coins = futcoinsFor('COPINHA');
    S.coach.trophies.push({ key: 'COPINHA', name: 'Copinha', season: c.season, team: uid, teamN: teamName(uid), coins, d: S.date });
    if (coins) awardFutcoins(coins, `Copinha ${c.season}`);
    S.board.conf = clamp(S.board.conf + 4, 0, 100);
    addInbox('board', 'Diretoria', 'Campeões da Copinha!', `Os garotos ${tA(uid, 'do')} venceram ${tA(ru)} na final e conquistaram a Copa São Paulo de Futebol Júnior ${c.season}. A diretoria está orgulhosa da base.`);
    addNews(`${teamName(uid)} é campeão da Copinha`, `A garotada ${tA(uid, 'do')} bate ${tA(ru)} na final e levanta a Copa São Paulo de Futebol Júnior ${c.season}.`, 'titulo', [uid], { cat: 'Base', hot: true });
  } else if (userLeagueCountry() === 'BRA') {
    addNews(`${teamName(ch)} conquista a Copinha`, `${TA(ch)} vence ${tA(ru)} na final da Copa São Paulo de Futebol Júnior ${c.season} e revela uma nova geração.`, 'titulo', [ch, ru], { cat: 'Base' });
  }
}
