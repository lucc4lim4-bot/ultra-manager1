# Leagues added for the Conference League countries and the Copa Sul-Americana countries, per era.
# Same shape as structures.NORMAL (+ rr: round-robin cycles, conf: confederation).
from teams_extra import EXTRA

# id, display name, country, calendar, cup name, confederation
LEAGUE_INFO = {
    'TUR': ('Süper Lig', 'TUR', 'EU', 'Copa da Turquia'),
    'BEL': ('Pro League', 'BEL', 'EU', 'Copa da Bélgica'),
    'SCO': ('Premiership', 'SCO', 'EU', 'Copa da Escócia'),
    'GRE': ('Campeonato Grego', 'GRE', 'EU', 'Copa da Grécia'),
    'AUT': ('Campeonato Austríaco', 'AUT', 'EU', 'Copa da Áustria'),
    'SUI': ('Campeonato Suíço', 'SUI', 'EU', 'Copa da Suíça'),
    'DEN': ('Campeonato Dinamarquês', 'DEN', 'EU', 'Copa da Dinamarca'),
    'NOR': ('Eliteserien', 'NOR', 'SA', 'Copa da Noruega'),
    'SWE': ('Allsvenskan', 'SWE', 'SA', 'Copa da Suécia'),
    'POL': ('Ekstraklasa', 'POL', 'EU', 'Copa da Polônia'),
    'CZE': ('Campeonato Tcheco', 'CZE', 'EU', 'Copa da Tchéquia'),
    'CRO': ('Campeonato Croata', 'CRO', 'EU', 'Copa da Croácia'),
    'SRB': ('Campeonato Sérvio', 'SRB', 'EU', 'Copa da Sérvia'),
    'UKR': ('Campeonato Ucraniano', 'UKR', 'EU', 'Copa da Ucrânia'),
    'ROU': ('Campeonato Romeno', 'ROU', 'EU', 'Copa da Romênia'),
    'HUN': ('Campeonato Húngaro', 'HUN', 'EU', 'Copa da Hungria'),
    'BUL': ('Campeonato Búlgaro', 'BUL', 'EU', 'Copa da Bulgária'),
    'CYP': ('Campeonato Cipriota', 'CYP', 'EU', 'Copa do Chipre'),
    'ISR': ('Campeonato Israelense', 'ISR', 'EU', 'Copa de Israel'),
    'AZE': ('Campeonato Azeri', 'AZE', 'EU', 'Copa do Azerbaijão'),
    'SVK': ('Campeonato Eslovaco', 'SVK', 'EU', 'Copa da Eslováquia'),
    'SVN': ('Campeonato Esloveno', 'SVN', 'EU', 'Copa da Eslovênia'),
    'ARM': ('Campeonato Armênio', 'ARM', 'EU', 'Copa da Armênia'),
    'KAZ': ('Campeonato Cazaque', 'KAZ', 'SA', 'Copa do Cazaquistão'),
    'LTU': ('Campeonato Lituano', 'LTU', 'SA', 'Copa da Lituânia'),
    'ALB': ('Campeonato Albanês', 'ALB', 'EU', 'Copa da Albânia'),
    'GEO': ('Campeonato Georgiano', 'GEO', 'SA', 'Copa da Geórgia'),
    'BIH': ('Campeonato Bósnio', 'BIH', 'EU', 'Copa da Bósnia'),
    'FIN': ('Campeonato Finlandês', 'FIN', 'SA', 'Copa da Finlândia'),
    'AND': ('Campeonato Andorrano', 'AND', 'EU', 'Copa de Andorra'),
    'LVA': ('Campeonato Letão', 'LVA', 'SA', 'Copa da Letônia'),
    'GIB': ('Campeonato de Gibraltar', 'GIB', 'EU', 'Rock Cup'),
    'CHI': ('Campeonato Chileno', 'CHI', 'SA', 'Copa Chile'),
    'URU': ('Campeonato Uruguaio', 'URU', 'SA', 'Copa AUF Uruguai'),
    'PAR': ('Campeonato Paraguaio', 'PAR', 'SA', 'Copa Paraguai'),
    'BOL': ('Campeonato Boliviano', 'BOL', 'SA', 'Copa da Bolívia'),
    'PER': ('Campeonato Peruano', 'PER', 'SA', 'Copa do Peru'),
    'ECU': ('LigaPro', 'ECU', 'SA', 'Copa Equador'),
    'COL': ('Campeonato Colombiano', 'COL', 'SA', 'Copa Colômbia'),
    'VEN': ('Campeonato Venezuelano', 'VEN', 'SA', 'Copa Venezuela'),
}
CONMEBOL = {'CHI', 'URU', 'PAR', 'BOL', 'PER', 'ECU', 'COL', 'VEN'}

T = {}
def lg(code, era, keys):
    T.setdefault(era, {})[code] = keys.split()

# ---------------------------------------------------------------- Europe
lg('TUR', 2016, 'besiktas fenerbahce galatasaray basaksehir trabzonspor antalyaspor konyaspor osmanlispor kasimpasa genclerbirligi akhisar bursaspor karabukspor kayserispor alanyaspor rizespor gaziantepspor adanaspor')
lg('TUR', 2021, 'trabzonspor fenerbahce konyaspor basaksehir alanyaspor besiktas adanademirspor antalyaspor karagumruk galatasaray kayserispor sivasspor hatayspor giresunspor kasimpasa gaziantep altay goztepe rizespor malatyaspor')
lg('TUR', 2026, 'alanyaspor amedspor basaksehir besiktas corum erzurumspor eyupspor fenerbahce galatasaray gaziantep genclerbirligi goztepe kasimpasa kocaelispor konyaspor rizespor samsunspor trabzonspor')
lg('BEL', 2016, 'anderlecht brugge gent oostende zultewaregem genk charleroi standard mechelen kortrijk lokeren beveren sinttruiden eupen mouscron westerlo')
lg('BEL', 2021, 'anderlecht antwerp beerschot cerclebrugge charleroi brugge eupen genk gent kortrijk mechelen ohleuven oostende seraing sinttruiden standard unionsg zultewaregem')
lg('BEL', 2026, 'anderlecht antwerp beveren cerclebrugge charleroi brugge genk gent kortrijk lalouviere lommel mechelen ohleuven sinttruiden standard unionsg westerlo zultewaregem')
lg('SCO', 2016, 'celtic aberdeen rangers stjohnstone hearts partick rosscounty kilmarnock motherwell dundee hamilton inverness')
lg('SCO', 2021, 'celtic rangers hearts dundeeutd motherwell rosscounty hibernian livingston stmirren aberdeen stjohnstone dundee')
lg('SCO', 2026, 'aberdeen celtic dundee dundeeutd falkirk hearts hibernian kilmarnock motherwell rangers stjohnstone stmirren')
lg('GRE', 2016, 'olympiacos paok aek panionios panathinaikos xanthi asteras atromitos giannina platanias levadiakos panetolikos larissa kerkyra iraklis veria')
lg('GRE', 2021, 'olympiacos paok aek aris panathinaikos ofi asteras giannina volos atromitos ionikos lamia apollonsmyrnis panetolikos')
lg('GRE', 2026, 'aek kifisia aris asteras atromitos iraklis kalamata levadiakos ofi olympiacos panathinaikos panetolikos paok volos')
lg('AUT', 2016, 'salzburg rapidwien austriawien sturm admira altach wolfsberger mattersburg ried stpolten')
lg('AUT', 2021, 'salzburg sturm wolfsberger rapidwien austriawien lask ried hartberg wsgtirol klagenfurt altach admira')
lg('AUT', 2026, 'rapidwien salzburg lask sturm ried wsgtirol hartberg gak lustenau austriawien altach wolfsberger')
lg('SUI', 2016, 'basel youngboys luzern lugano sion thun stgallen grasshopper lausanne vaduz')
lg('SUI', 2021, 'zurich basel youngboys lugano stgallen servette sion grasshopper luzern lausanne')
lg('SUI', 2026, 'basel grasshopper zurich lausanne lugano luzern servette sion stgallen thun vaduz youngboys')
lg('DEN', 2016, 'copenhagen brondby lyngby midtjylland nordsjaelland randers aab sonderjyske agf ob silkeborg horsens viborg esbjerg')
lg('DEN', 2021, 'copenhagen midtjylland silkeborg randers aab brondby viborg ob agf nordsjaelland vejle sonderjyske')
lg('DEN', 2026, 'agf brondby copenhagen horsens lyngby midtjylland nordsjaelland ob randers silkeborg sonderjyske viborg')
lg('NOR', 2016, 'rosenborg brann odd haugesund molde sarpsborg stromsgodset aalesund lillestrom viking valerenga tromso sogndal bodo stabaek start')
lg('NOR', 2021, 'bodo molde viking lillestrom rosenborg kristiansund valerenga sarpsborg stromsgodset sandefjord odd tromso haugesund stabaek mjondalen brann')
lg('NOR', 2026, 'aalesund bodo brann fredrikstad hamkam kfum kristiansund lillestrom molde rosenborg sandefjord sarpsborg start tromso viking valerenga')
lg('SWE', 2016, 'malmo aik norrkoping goteborg elfsborg ostersund hacken djurgarden orebro hammarby kalmar jonkoping sundsvall helsingborg gefle falkenberg')
lg('SWE', 2021, 'malmo aik djurgarden elfsborg hammarby kalmar hacken norrkoping goteborg varberg mjallby sirius degerfors halmstad orebro ostersund')
lg('SWE', 2026, 'aik hacken degerfors djurgarden gais halmstad hammarby brommapojkarna elfsborg goteborg sirius kalmar malmo mjallby orgryte vasteras')
lg('POL', 2016, 'legia jagiellonia lechpoznan lechia korona wislakrakow pogon termalica zaglebie cracovia piast arka slask wislaplock ruch gornikleczna')
lg('POL', 2021, 'lechpoznan rakow pogon lechia piast wislaplock radomiak zaglebie legia cracovia jagiellonia slask warta stalmielec gornikzabrze wislakrakow gornikleczna termalica')
lg('POL', 2026, 'cracovia gkskatowice gornikzabrze jagiellonia korona lechpoznan legia motor piast pogon radomiak rakow slask widzew wieczysta wislakrakow wislaplock zaglebie')
lg('CZE', 2016, 'slavia plzen spartaprague mladaboleslav zlin jablonec liberec teplice bohemians dukla zbrojovka slovacko karvina jihlava hradec pribram')
lg('CZE', 2021, 'slavia plzen spartaprague slovacko ostrava hradec jablonec mladaboleslav bohemians sigma liberec teplice pardubice budejovice zlin karvina')
lg('CZE', 2026, 'bohemians hradec jablonec liberec mladaboleslav sigma ostrava pardubice plzen slavia slovacko spartaprague teplice zlin zbrojovka artisbrno')
lg('CRO', 2016, 'rijeka dinamozagreb hajduk osijek lokomotiva interzapresic slavenbelupo istra rnksplit cibalia')
lg('CRO', 2021, 'dinamozagreb hajduk osijek rijeka gorica lokomotiva sibenik istra slavenbelupo dragovoljac')
lg('CRO', 2026, 'dinamozagreb gorica hajduk istra lokomotiva osijek rijeka slavenbelupo varazdin rudes')
lg('SRB', 2016, 'backa borac_cacak cukaricki javor metalac mladost_lucani napredak novipazar partizan rad radnicki_nis radnik redstar_srb spartak_sub vojvodina vozdovac')
lg('SRB', 2021, 'cukaricki kolubara metalac mladost_lucani napredak novipazar partizan proleter radnicki_kg radnicki_nis radnik redstar_srb spartak_sub tsc vojvodina vozdovac')
lg('SRB', 2026, 'redstar_srb cukaricki imt macva mladost_lucani novipazar ofkbeograd partizan radnicki_kg radnicki_nis radnik vojvodina zemun zeleznicar_pan')
lg('UKR', 2016, 'shakhtar dynamokyiv zorya chornomorets olimpik_don oleksandriya vorskla dnipro karpaty zirka stal volyn')
lg('UKR', 2021, 'shakhtar dynamokyiv zorya dnipro1 vorskla oleksandriya desna kolos mariupol metalist1925 chornomorets lviv rukh inhulets veres mynai')
lg('UKR', 2026, 'polissya shakhtar metalist1925 dynamokyiv karpaty lnz zorya kolos epitsentr veres livyibereh bukovyna obolon chornomorets kudrivka kryvbas')
lg('ROU', 2016, 'fcsb politimisoara cfrcluj pandurii dinamobuc iasi astra tirgumures gazmetan botosani ucraiova chiajna voluntari viitorul')
lg('ROU', 2021, 'fcsb ucraiova ucraiova1948 cfrcluj dinamobuc arges rapidbuc uta chindia mioveni sepsi gazmetan botosani voluntari farul clinceni')
lg('ROU', 2026, 'ucraiova ucluj cfrcluj dinamobuc rapidbuc arges uta fcsb otelul botosani csikszereda petrolul farul voluntari corvinul sepsi')
lg('HUN', 2016, 'honved videoton vasas ferencvaros paks debrecen mtk ujpest haladas diosgyor mezokovesd gyirmot')
lg('HUN', 2021, 'ferencvaros kisvarda puskas videoton paks debrecen ujpest mezokovesd zalaegerszeg honved mtk gyirmot')
lg('HUN', 2026, 'debrecen ferencvaros etogyor honved kisvarda mtk nyiregyhaza paks puskas ujpest vasas zalaegerszeg')
lg('BUL', 2016, 'beroe botevplovdiv chernomore cskasofia dunav levski lokogo lokoplovdiv ludogorets montana neftochimic pirin slaviasofia vereya')
lg('BUL', 2021, 'arda beroe botevplovdiv botevvratsa chernomore cska1948 cskasofia levski lokoplovdiv lokosofia ludogorets pirin slaviasofia tsarskoselo')
lg('BUL', 2026, 'levski cska1948 ludogorets cskasofia lokoplovdiv chernomore arda botevplovdiv slaviasofia botevvratsa lokosofia spartakvarna septemvri dunav')
lg('CYP', 2016, 'aeklarnaca ael aez deryneia anorthosis apoel apollon arislimassol doxa ermis ethnikos karmiotissa neasalamis omonia')
lg('CYP', 2021, 'aeklarnaca ael anorthosis apoel apollon arislimassol doxa ethnikos olympiakosnic omonia paeek pafos')
lg('CYP', 2026, 'aeklarnaca ael anorthosis apoel apollon arislimassol krasava olympiakosnic omoniaarad omonia pafos neasalamis karmiotissa omonia29m')
lg('ISR', 2016, 'beitar bneisakhnin bneiyehuda ashdod ashkelon hapoelbs hapoelhaifa kfarsaba raanana hapoelta kiryatshmona maccabihaifa maccabipt maccabita')
lg('ISR', 2021, 'beitar bneisakhnin ashdod hapoelbs hadera hapoelhaifa hapoeljer nofhagalil hapoelta kiryatshmona maccabihaifa netanya maccabipt maccabita')
lg('ISR', 2026, 'beitar bneisakhnin hapoelbs hapoelhaifa hapoeljer hapoelpt hapoelta kiryatshmona tiberias maccabihaifa netanya maccabita maccabipt ramatgan')
lg('AZE', 2016, 'azal gabala interbaku neftchi qarabag sumgayit zira kapaz')
lg('AZE', 2021, 'qarabag neftchi zira sabah gabala kesla sumgayit sabail')
lg('AZE', 2026, 'araz imishli kapaz neftchi gabala qarabag sabah shafa shamakhi sumgayit turan zira')
lg('SVK', 2016, 'trencin dac podbrezova senica michalovce ruzomberok presov zilina slovan spartaktrnava zlatemoravce')
lg('SVK', 2021, 'dac pohronie ruzomberok senica sered slovan spartaktrnava liptovsky trencin michalovce zlatemoravce zilina')
lg('SVK', 2026, 'dac dukla_bb komarno kosice podbrezova ruzomberok skalica slovan spartaktrnava trencin michalovce zilina')
lg('SVN', 2016, 'aluminij celje domzale gorica_svn koper krsko maribor olimpija radomlje rudar_velenje')
lg('SVN', 2021, 'maribor koper olimpija mura celje domzale bravo radomlje aluminij tabor')
lg('SVN', 2026, 'aluminij bravo brinje celje koper maribor mura nafta olimpija radomlje')
lg('ARM', 2016, 'alashkert araratyer banants gandzasar pyunik shirak')
lg('ARM', 2021, 'alashkert araratyer ararat bkma noah noravank pyunik sevan urartu van')
lg('ARM', 2026, 'noah pyunik ararat alashkert urartu sardarapat shirak araratyer bkma van syunik gandzasar')
lg('KAZ', 2016, 'aktobe akzhayik astana atyrau irtysh kairat okzhetpes ordabasy shakhter_kar taraz tobol zhetysu')
lg('KAZ', 2021, 'aktobe akzhayik astana atyrau caspiy kairat kaisar kyzylzhar ordabasy shakhter_kar taraz tobol turan_kaz zhetysu')
lg('KAZ', 2026, 'altai aktobe astana atyrau elimai irtysh kairat kaisar kyzylzhar okzhetpes ordabasy tobol ulytau zhenis zhetysu caspiy')
lg('LTU', 2016, 'atlantas kaunozalgiris lietava stumbras suduva trakai utenis zalgiris')
lg('LTU', 2021, 'banga dainava dziugas hegelmann kaunozalgiris nevezis panevezys riteriai suduva zalgiris')
lg('LTU', 2026, 'banga dziugas hegelmann kaunozalgiris panevezys riteriai siauliai suduva transinvest zalgiris')
lg('ALB', 2016, 'flamurtari korabi kukesi laci luftetari partizani skenderbeu teuta tirana vllaznia')
lg('ALB', 2021, 'dinamotirana egnatia kastrioti kukesi laci partizani skenderbeu teuta tirana vllaznia')
lg('ALB', 2026, 'dinamocity egnatia elbasani partizani teuta tirana vllaznia vora laci skenderbeu')
lg('GEO', 2016, 'chikhura dila dinamobatumi dinamotbilisi guria kolkheti locomotive_tb saburtalo samtredia shukura sioni torpedo_kut tskhinvali zugdidi')
lg('GEO', 2021, 'dila dinamobatumi dinamotbilisi locomotive_tb saburtalo samgurali samtredia shukura telavi torpedo_kut')
lg('GEO', 2026, 'dila dinamobatumi dinamotbilisi gagra iberia meshakhte rustavi samgurali spaeri torpedo_kut')
lg('BIH', 2016, 'celik krupa metalleghe mladostdk olimpik_sar radnikbij sarajevo sloboda sirokibrijeg vitez zrinjski zeljeznicar')
lg('BIH', 2021, 'borac leotar posusje radnikbij rudarprijedor sarajevo sloboda sirokibrijeg tuzlacity velezmostar zrinjski zeljeznicar')
lg('BIH', 2026, 'zeljeznicar bsk sarajevo radnikbij zrinjski celik sirokibrijeg slogadoboj borac velezmostar')
lg('FIN', 2016, 'mariehamn hjk sjk rops interturku kups ilves lahti vps pskemi hifk pk35')
lg('FIN', 2021, 'hjk kups interturku honka haka sjk ilves lahti mariehamn hifk ktp acoulu')
lg('FIN', 2026, 'acoulu interturku lahti jaro hjk gnistan mariehamn ilves kups sjk tps vps')
lg('AND', 2016, 'encamp engordany fcsantacoloma jenlai lusitanos ordino santjulia uesantacoloma')
lg('AND', 2021, 'interescaldes uesantacoloma santjulia atleticescaldes fcsantacoloma ordino engordany carroi')
lg('AND', 2026, 'fcsantacoloma interescaldes ordino atleticescaldes rangers_and esperanca penyaencarnada casaportugal sportingescaldes carroi')
lg('LVA', 2016, 'daugavpils jelgava liepaja metta rigafc rfs spartaks ventspils')
lg('LVA', 2021, 'rfs valmiera liepaja rigafc spartaks daugavpils metta ventspils')
lg('LVA', 2026, 'auda daugavpils grobina jelgava liepaja rfs ogre rigafc supernova tukums')
lg('GIB', 2016, 'europafc europapoint gibunited glacis lincoln lionsgib lynx manchester62 monscalpe stjosephs')
lg('GIB', 2021, 'brunosmagpies college1975 europafc europapoint glacis lincoln lionsgib lynx manchester62 monscalpe stjosephs')
lg('GIB', 2026, 'college1975 europafc europapoint glacis hounddogs lincoln lionsgib lynx magpies monscalpe stjosephs')
# ---------------------------------------------------------------- South America
lg('CHI', 2016, 'audax cobresal colocolo antofagasta iquique temuco everton_chi huachipato ohiggins palestino sanluis swanderers unionespanola ucatolica uchile udeconce')
lg('CHI', 2021, 'audax cobresal colocolo curico antofagasta laserena melipilla everton_chi huachipato nublense ohiggins palestino swanderers unionespanola lacalera ucatolica uchile')
lg('CHI', 2026, 'coquimbo ucatolica ohiggins uchile audax palestino cobresal colocolo huachipato nublense limache lacalera laserena everton_chi udeconce depconcepcion')
lg('URU', 2016, 'bostonriver cerro_uru danubio defensor fenix juventud liverpooluru wanderers_uru nacionaluru penarol plazacolonia racing_uru rampla riverplate_uru sudamerica villaespanola')
lg('URU', 2021, 'bostonriver cerrito cerrolargo maldonado fenix liverpooluru montevideocity wanderers_uru nacionaluru penarol plazacolonia progreso rentistas riverplate_uru sudamerica villaespanola')
lg('URU', 2026, 'albion bostonriver centralespanol cerro_uru cerrolargo danubio defensor maldonado juventud liverpooluru montevideocity wanderers_uru nacionaluru penarol progreso racing_uru')
lg('PAR', 2016, 'cerro capiata gencaballero gendiaz guarani libertad nacional_par olimpia riverplate_par rubionu soldeamerica luqueno')
lg('PAR', 2021, 'doceoctubre cerro guairena guarani libertad nacional_par olimpia riverplate_par soldeamerica luqueno')
lg('PAR', 2026, 'dosdemayo cerro guarani libertad nacional_par olimpia recoleta rubionu sanlorenzo_par ameliano luqueno trinidense')
lg('BOL', 2016, 'blooming bolivar guabira wilstermann nacionalpotosi oriente petrolero realpotosi sanjose_bol sportboys_bol strongest univsucre')
lg('BOL', 2021, 'alwaysready palmaflor aurora blooming bolivar guabira indpetrolero wilstermann nacionalpotosi oriente realpotosi realsantacruz tomayapo royalpari sanjose_bol strongest')
lg('BOL', 2026, 'abb alwaysready aurora blooming bolivar guabira sanjose_bol indpetrolero nacionalpotosi oriente realoruro realpotosi tomayapo bulobulo strongest univvinto')
lg('PER', 2016, 'alianzaatl alianza ayacucho comerciantes bocana municipal juanaurich melgar realgarcilaso huancayo cristal unioncomercio vallejo sanmartin utc universitario')
lg('PER', 2021, 'cantolao alianzaatl alianza alianzauniv ayacucho binacional mannucci cienciano cuscofc municipal melgar sportboys_per huancayo cristal vallejo sanmartin universitario utc')
lg('PER', 2026, 'adt alianzaatl alianza atlgrau cajamarca cienciano comerciantes cuscofc depgarcilaso moquegua juanpablo chankas melgar sportboys_per huancayo cristal universitario utc')
lg('ECU', 2016, 'aucas barcelonasc delfin cuenca elnacional emelec fuerzaamarilla idv ldu mushucruna riverecuador ucatolicaecu')
lg('ECU', 2021, 'nueveoctubre aucas barcelonasc delfin cuenca emelec guayaquilcity idv ldu macara manta mushucruna olmedo orense tecnico ucatolicaecu')
lg('ECU', 2026, 'aucas barcelonasc delfin cuenca emelec guayaquilcity idv ldu leones libertad_ecu macara manta mushucruna orense tecnico ucatolicaecu')
lg('COL', 2016, 'alianzapetrolera bucaramanga huila atlnacional boyacachico cortulua tolima depcali pasto envigado fortaleza_col medellin jaguares junior laequidad millonarios oncecaldas patriotas aguilas santafe')
lg('COL', 2021, 'aguilas alianzapetrolera americacali bucaramanga huila atlnacional boyacachico tolima depcali pasto pereira envigado medellin jaguares junior laequidad millonarios oncecaldas patriotas santafe')
lg('COL', 2026, 'aguilas alianzafc americacali bucaramanga atlnacional boyacachico cucuta tolima depcali pasto pereira fortaleza_col medellin internacionalbog jaguares junior llaneros millonarios oncecaldas santafe')
lg('VEN', 2016, 'aragua atlvenezuela carabobo caracas anzoategui jbl laguaira lara tachira estcaracas estmerida llaneros_ven mineros monagas petare portuguesa trujillanos urena zamora zulia')
lg('VEN', 2021, 'puertocabello aragua atlvenezuela carabobo caracas laguaira lara tachira estmerida granvalencia hcolmenarez lala metropolitanos mineros monagas portuguesa trujillanos ucv yaracuyanos zamora zulia')
lg('VEN', 2026, 'puertocabello anzoategui carabobo caracas laguaira tachira estmerida metropolitanos monagas portuguesa rayozuliano trujillanos ucv zamora')

ORDER = ['TUR', 'BEL', 'SCO', 'GRE', 'AUT', 'SUI', 'DEN', 'NOR', 'SWE', 'POL', 'CZE', 'CRO', 'SRB', 'UKR', 'ROU', 'HUN', 'BUL',
         'CYP', 'ISR', 'AZE', 'SVK', 'SVN', 'ARM', 'KAZ', 'LTU', 'ALB', 'GEO', 'BIH', 'FIN', 'AND', 'LVA', 'GIB',
         'CHI', 'URU', 'PAR', 'BOL', 'PER', 'ECU', 'COL', 'VEN']


def rr_for(n):
    if n >= 14:
        return 2
    if n >= 11:
        return 3
    if n >= 7:
        return 4
    return 5


def normal_extra(era):
    out = []
    for code in ORDER:
        name, ctry, cal, cup = LEAGUE_INFO[code]
        teams = T[era][code]
        out.append(dict(id=code, name=name, country=ctry, cal=cal, down=0, cup=cup, teams=teams, bank=[], rr=rr_for(len(teams)),
                        conf='CONMEBOL' if code in CONMEBOL else 'UEFA'))
    return out


# starting-XI level of generated squads per league (clubs the datasets do not carry)
BASE = {'TUR': 66, 'BEL': 65, 'SCO': 62, 'GRE': 63, 'AUT': 63, 'SUI': 63, 'DEN': 63, 'NOR': 62, 'SWE': 62, 'POL': 63, 'CZE': 63,
        'CRO': 62, 'SRB': 61, 'UKR': 62, 'ROU': 62, 'HUN': 61, 'BUL': 60, 'CYP': 61, 'ISR': 61, 'AZE': 59, 'SVK': 60, 'SVN': 60,
        'ARM': 57, 'KAZ': 59, 'LTU': 56, 'ALB': 57, 'GEO': 57, 'BIH': 58, 'FIN': 58, 'AND': 48, 'LVA': 55, 'GIB': 48,
        'CHI': 62, 'URU': 62, 'PAR': 62, 'BOL': 59, 'PER': 60, 'ECU': 62, 'COL': 63, 'VEN': 59}
# club bonus over its league level
BONUS = {
    'partizan': 8, 'vojvodina': 4, 'cukaricki': 3, 'tsc': 3, 'novipazar': 1, 'radnicki_nis': 1, 'backa': -1, 'zemun': -1,
    'polissya': 5, 'karpaty': 2, 'metalist1925': 3, 'lnz': 2, 'zorya': 3, 'dnipro1': 4, 'oleksandriya': 2, 'vorskla': 2,
    'kolos': 1, 'desna': 2, 'chornomorets': 1, 'kryvbas': 2, 'dnipro': 3, 'olimpik_don': 1, 'mariupol': 1, 'rukh': 1,
    'aris': 5, 'atromitos': 1, 'asteras': 1, 'panionios': 2, 'xanthi': 1, 'volos': 1, 'kalamata': -2, 'iraklis': -1, 'kifisia': -1,
    'larissa': 0, 'platanias': -1, 'veria': -1, 'kerkyra': -2, 'ionikos': -1, 'apollonsmyrnis': -2,
    'rijeka': 6, 'osijek': 5, 'gorica': 1, 'lokomotiva': 2, 'varazdin': 1, 'sibenik': -1, 'rudes': -1, 'dragovoljac': -2, 'cibalia': -1,
    'cfrcluj': 6, 'ucraiova': 5, 'rapidbuc': 3, 'dinamobuc': 2, 'farul': 3, 'viitorul': 3, 'astra': 3, 'sepsi': 2, 'ucluj': 2,
    'uta': 1, 'arges': 1, 'otelul': 1, 'botosani': 1, 'csikszereda': -1, 'corvinul': -2, 'chiajna': -1, 'tirgumures': -1,
    'mioveni': -1, 'chindia': -1, 'clinceni': -2,
    'debrecen': 3, 'puskas': 4, 'videoton': 5, 'paks': 2, 'ujpest': 2, 'honved': 2, 'etogyor': 3, 'mtk': 1, 'kisvarda': 1,
    'haladas': -1, 'gyirmot': -2,
    'cskasofia': 5, 'lokoplovdiv': 2, 'chernomore': 2, 'botevplovdiv': 2, 'cska1948': 2, 'arda': 1, 'beroe': 1, 'septemvri': -1,
    'dunav': -1, 'tsarskoselo': -2, 'neftochimic': -1, 'lokogo': -1, 'vereya': -1,
    'aeklarnaca': 5, 'apollon': 4, 'pafos': 5, 'anorthosis': 3, 'arislimassol': 3, 'ael': 2, 'karmiotissa': -2, 'omonia29m': -2,
    'krasava': -1, 'aez': -2, 'ermis': -1,
    'maccabita': 7, 'maccabihaifa': 7, 'beitar': 3, 'hapoelta': 1, 'hapoelhaifa': 2, 'netanya': 1, 'ramatgan': -2,
    'neftchi': 3, 'gabala': 2, 'zira': 2, 'turan': 1, 'shamakhi': 0, 'imishli': -1, 'shafa': -1, 'sabail': -1,
    'dac': 3, 'spartaktrnava': 3, 'zilina': 2, 'trencin': 1, 'ruzomberok': 1, 'pohronie': -2, 'sered': -2, 'liptovsky': -2, 'skalica': -1,
    'maribor': 5, 'olimpija': 5, 'koper': 2, 'mura': 2, 'domzale': 2, 'aluminij': -1, 'krsko': -1, 'tabor': -1, 'brinje': -2, 'nafta': -1,
    'pyunik': 3, 'noah': 3, 'alashkert': 2, 'urartu': 2, 'banants': 1, 'bkma': -1, 'van': -1, 'sardarapat': -2, 'syunik': -2,
    'noravank': -1, 'sevan': -1,
    'astana': 6, 'kairat': 5, 'tobol': 4, 'ordabasy': 2, 'aktobe': 2, 'shakhter_kar': 1, 'ulytau': -2, 'zhenis': -1, 'altai': -2,
    'akzhayik': -1, 'okzhetpes': -1, 'turan_kaz': -1, 'taraz': -1,
    'zalgiris': 5, 'suduva': 3, 'kaunozalgiris': 2, 'panevezys': 2, 'hegelmann': 1, 'trakai': 2, 'transinvest': -1, 'siauliai': -1,
    'nevezis': -2, 'utenis': -1, 'lietava': -1,
    'partizani': 2, 'tirana': 2, 'egnatia': 2, 'skenderbeu': 3, 'kukesi': 2, 'laci': 1, 'vllaznia': 1, 'teuta': 1,
    'dinamotirana': 1, 'dinamocity': 1, 'korabi': -1, 'vora': -1,
    'dinamotbilisi': 3, 'dinamobatumi': 3, 'saburtalo': 3, 'iberia': 3, 'torpedo_kut': 2, 'dila': 1, 'samtredia': 1,
    'zrinjski': 4, 'borac': 3, 'sarajevo': 3, 'zeljeznicar': 2, 'velezmostar': 2, 'sirokibrijeg': 1,
    'hjk': 4, 'kups': 3, 'sjk': 2, 'ilves': 2, 'interturku': 2, 'mariehamn': 1,
    'interescaldes': 4, 'uesantacoloma': 3, 'fcsantacoloma': 3, 'atleticescaldes': 2, 'santjulia': 1,
    'rfs': 4, 'rigafc': 4, 'valmiera': 2, 'liepaja': 1, 'ventspils': 2, 'spartaks': 1,
    'lincoln': 6, 'europafc': 4, 'stjosephs': 2, 'magpies': 2, 'brunosmagpies': 2,
    'coquimbo': 2, 'ohiggins': 1, 'limache': -2, 'depconcepcion': -2, 'melipilla': -2,
    'danubio': 1, 'albion': -2, 'centralespanol': -2, 'rentistas': -1, 'cerrito': -2, 'villaespanola': -1, 'rampla': -1,
    'nacional_par': 1, 'sanlorenzo_par': -2, 'recoleta': -1, 'dosdemayo': -1, 'ameliano': -1,
    'realoruro': -1, 'abb': -2, 'univvinto': -1, 'bulobulo': -1,
    'cuscofc': 0, 'juanpablo': -2, 'moquegua': -2, 'cajamarca': -2, 'depgarcilaso': -1,
    'medellin': 3, 'tolima': 3, 'pereira': 1, 'cucuta': -1, 'llaneros': -2, 'internacionalbog': 0,
    'monagas': 1, 'metropolitanos': 1, 'zamora': 1, 'rayozuliano': -1, 'ucv': 0, 'lala': -2,
    'beveren': -2, 'lommel': -3, 'lalouviere': -2, 'seraing': -2, 'falkirk': -1,
}

# extra first/last names for nations the datasets barely cover
POOLS_EXTRA = {
    'KAZ': ('Abzal Aibol Aibar Alibek Almas Altynbek Arman Askhat Aslan Azat Bauyrzhan Bekzat Daulet Dauren Didar Dmitriy Islambek '
            'Kairat Marat Maksim Nurbol Nurlan Olzhas Ramazan Rinat Ruslan Sanzhar Serikzhan Sultan Temirlan Timur Yerkebulan Yerlan '
            'Zhaslan Vladislav Stanislav Ivan Sergey Aleksandr Abylaikhan Galymzhan Dastan Erkin Adilet Madi Alikhan Elkhan',
            'Abiken Akhmetov Alip Amanov Bakayev Baizhanov Beisebekov Bystrov Darabayev Dosmagambetov Islamkhan Kairov Karimov Kuat '
            'Kuantayev Logvinenko Malyi Marochkin Mukhtarov Nurgaliyev Orazov Pertsukh Postnikov Sadybekov Shomko Suyumbayev '
            'Tagybergen Valiullin Vorogovskiy Zhaksylykov Zhukov Zainutdinov Tapalov Seidakhmet Samorodov Shatskiy Nurmagambet '
            'Yerlanov Gabyshev Kalmyrza Abdulin Dzhumabekov Kassym Sharipov Astanov Bekov Satpayev Tursunov Zhanuzakov'),
    'AND': ('Marc Jordi Joan Josep Ludovic Ildefons Cristian Max Àlex Albert Adrià Moisés Iván Ricard Óscar Eric Joel Aaron Gabriel '
            'Xavier Jesús Sergi Víctor Pau Biel Martí Ian Emili Ángel David Daniel Rubén Luis Pedro Tiago Bruno Rui Nuno Guillem Arnau',
            'Lima Vales Rebés García Martínez Fernández Rodrigues Pujol Sansó Clemente Llovera Cervós Jardí Moreira Alaez Vieira Babot '
            'Rubio Pérez Gómez Riera Sánchez López Lorenzo Ruiz Ramos Bernat Ferreira Coelho Borges Soares Mota Teixeira Matos Salvat '
            'Torres Ponce Vila Font Martins Cucu Sivera Pi Vilanova'),
    'GIB': ('Liam Kyle Jayce Tjay Lee Joseph Nicholas Ethan Aymen Roy Graeme Jamie Julian Louie Bernardo Juanma Daniel Mark James '
            'Sean Ryan Adam Jack Jordan Dylan Rhys Kian Evan Carlos Raúl Alejandro Iván Manuel Pablo Dayle Ethan Christian Michael',
            'Walker Chipolina Annesley Olivero Badr Torrilla Barnett Britto Coombes De Barr Valarino Casciaro Santos Ronco Pons Styche '
            'Hernández Gibson Bosio Ruiz Sergeant Mouelhi Robba Pitto Garcia Bautista Duarte Lopes Jolley Tavares Wiseman Cartwright '
            'Brown Smith Taylor Hartman Bardon Avellano Massias Peacock'),
    'LIE': ('Lukas Marco Nicolas Sandro Fabio Simon Andreas Michele Jens Dennis Livio Aron Noah Philipp Martin Mario Yanik Severin '
            'Kenny Benjamin Jakob Seyhan Elias Robin',
            'Büchel Frick Hasler Kaufmann Wolfinger Marxer Ospelt Meier Beck Wieser Göppel Sele Brändle Hoop Kindle Gassner Malin '
            'Quaderer Vogt Batliner Eberle Hilti Kieber Oehri Schädler Sprenger Matt Bühler Nägele Risch Lampert'),
    'ARM': ('Aram Ararat Armen Artak Artur Arman Arsen Ashot Davit Edgar Erik Gevorg Gor Grigor Hovhannes Hayk Henrikh Karen Khoren '
            'Levon Narek Norayr Rafik Robert Ruben Sargis Sergey Tigran Varazdat Vardan Vahan Zhirayr Kamo Styopa Petros Gagik Albert '
            'Arayik Hrayr Vazgen',
            'Adamyan Aghasaryan Avetisyan Babayan Barseghyan Bichakhchyan Dashyan Gevorgyan Grigoryan Hambardzumyan Harutyunyan '
            'Hovhannisyan Hovsepyan Karapetyan Khachatryan Manucharyan Margaryan Martirosyan Mkhitaryan Mkrtchyan Movsisyan Muradyan '
            'Nalbandyan Petrosyan Sargsyan Simonyan Tadevosyan Tumasyan Vardanyan Voskanyan Yedigaryan Haroyan Spertsyan Ghazaryan '
            'Arakelyan Hakobyan Mirzoyan Galstyan Sahakyan Zakaryan'),
    'AZE': ('Abbas Agil Anar Araz Elvin Emin Gara Javid Kamran Mahir Mahmud Namik Orkhan Ramil Rahman Renat Rustam Rufat Sabuhi '
            'Shahin Tural Toral Vugar Elmir Elnur Murad Nihad Bahlul Rashad Ruslan Yusif Ilkin Badavi Hojjat Musa Cahid Emil Ali',
            'Abdullayev Aliyev Bayramov Dadashov Emreli Garayev Guliyev Huseynov Ibrahimli Ismayilov Jafarguliyev Khalilzade Mahmudov '
            'Mammadov Mustafazade Nazarov Pashayev Qurbanov Rahimov Salahli Sheydayev Taghizade Zeynalov Haydarov Hasanov Isgandarov '
            'Allahverdiyev Akhundzade Huseynli Valiyev Musayev Kerimov Hajiyev Babayev Safarov Najafov'),
    'LVA': ('Andrejs Artūrs Aleksandrs Dāvis Deniss Edgars Eduards Gints Glebs Jānis Kaspars Kristers Krišjānis Mārcis Mārtiņš '
            'Maksims Nikita Raivis Renārs Roberts Rolands Vladislavs Vitālijs Valērijs Toms Kristaps Emīls Dmitrijs Igors Antonijs '
            'Alvis Ivans Pāvels Sergejs Oļegs',
            'Balodis Bērziņš Cigaņiks Dubra Emsis Gutkovskis Ikaunieks Jaunzems Jurkovskis Kamešs Krollis Lipušs Ošs Ozols Savaļnieks '
            'Šteinbors Tobers Uldriķis Vapne Zjuzins Zelenkovs Jagodinskis Saveļjevs Kļimovs Fjodorovs Regža Melnis Jaudzems Sorokins '
            'Puķītis Mežs Liepa Kalniņš Krūmiņš Zariņš Kļaviņš'),
    'LTU': ('Arvydas Donatas Domantas Edgaras Fedor Gratas Gvidas Justas Karolis Lukas Mantas Marius Modestas Paulius Pijus Rokas '
            'Saulius Tomas Vilius Vykintas Artūras Ernestas Gytis Matas Ovidijus Aurimas Deividas Dominykas Eligijus Linas Nauris '
            'Žygimantas Titas Jokūbas Kipras',
            'Armalas Beneta Černych Dapkus Gertmonas Girdvainis Golubickas Kazlauskas Lasickas Matulevičius Mikoliūnas Novikovas '
            'Paulauskas Petrauskas Slivka Sirvys Šimkus Utkus Upstas Verbickas Vaitkūnas Žulpa Jankauskas Kalvaitis Baravykas '
            'Megelaitis Klimavičius Gaigalas Kuklys Žebrauskas Stankevičius Banys Tutyškinas Dolžnikovas Lekiatas'),
    'GEO': ('Giorgi Levan Luka Nika Saba Zuriko Otar Lasha Davit Irakli Guram Jaba Sandro Tornike Valeri Vako Budu Khvicha Anzor '
            'Beka Gabriel Shota Mate Aleksandre Nodar Archil Zaza Rati Nikoloz Gela Revaz Tamaz Vakhtang',
            'Mamardashvili Mikautadze Kochorashvili Chakvetadze Zivzivadze Kvekveskiri Kashia Dvali Lochoshvili Davitashvili '
            'Kiteishvili Lobjanidze Kakabadze Azarovi Gocholeishvili Mekvabishvili Shengelia Tsitaishvili Kvilitaia Loria Tabatadze '
            'Gugeshashvili Gvelesiani Kverkvelia Sigua Mchedlishvili Beridze Maisuradze Gelashvili Kapanadze Jikia Chabradze '
            'Ananidze Okriashvili Lomidze Chanturia Papunashvili'),
    'CYP': ('Andreas Andronikos Antonis Charalambos Christos Constantinos Dimitris Fotis Georgios Grigoris Ioannis Kostakis Kyriakos '
            'Loizos Marios Michalis Nicolas Nikolas Panagiotis Pieros Savvas Stelios Valentinos Hector Alex Neophytos Minas Demetris '
            'Petros Anastasios',
            'Andreou Artymatas Charalambous Christofi Economides Efrem Ioannou Kakoullis Kastanos Kousoulos Kyriakou Laifis Loizou '
            'Mavrias Merkis Michael Panagiotou Papoulis Pittas Roushias Sotiriou Stylianou Theodorou Tzionis Antoniou Pileas Psychas '
            'Ilia Kittos Nikolaou Katelaris Avraam Georgiou Christodoulou Constantinou'),
    'ISR': ('Avi Bibras Dor Eli Eran Eyal Gadi Guy Itay Liel Manor Mohammad Mahmoud Netanel Nir Omer Ofir Raz Roy Sagiv Shon Sean Tal '
            'Tomer Yonatan Yarden Yoav Ziv Idan Neta Amir Dolev Eden Gil Hatem Muhammad Osher Stav',
            'Abu Fani Atzili Azoulay Bitton Cohen Dasa Elhamed Gandelman Glazer Haziza Jaber Kanichowsky Khalaili Levi Lavi Mizrahi '
            'Natcho Peretz Revivo Safuri Sabia Shua Solomon Tibi Turgeman Weissman Yeini Zahavi Gloukh Baribo Dabbur Yosefi Hemed '
            'Biton Shlomo Golasa Goldberg'),
    'BUL': ('Aleksandar Anton Atanas Bozhidar Dimitar Galin Georgi Hristo Iliya Ivaylo Kiril Martin Nikolay Petar Plamen Radoslav Spas '
            'Stanislav Svetoslav Todor Valentin Vasil Ventsislav Yordan Zhivko Dimo Kristiyan Preslav Lachezar Momchil',
            'Antov Chochev Delev Despodov Dimitrov Georgiev Hristov Ivanov Iliev Kraev Marinov Mladenov Nedelev Petkov Petrov Popov '
            'Stoyanov Todorov Tsvetkov Velkovski Yomov Zlatinski Minchev Gruev Kostadinov Mihaylov Panayotov Rumenov Vutov Karagaren'),
}

# home share and foreign nationalities for generated players
NAT_MIX = {
    'TUR': (0.65, ['BRA', 'POR', 'FRA', 'SEN', 'NED']), 'BEL': (0.55, ['FRA', 'NED', 'CIV', 'SEN', 'GHA']),
    'SCO': (0.7, ['ENG', 'IRL', 'WAL', 'NIR', 'AUS']), 'GRE': (0.65, ['POR', 'ESP', 'ARG', 'SRB', 'CRO']),
    'AUT': (0.7, ['GER', 'SUI', 'CRO', 'HUN', 'SVN']), 'SUI': (0.7, ['FRA', 'GER', 'ITA', 'POR', 'ALB']),
    'DEN': (0.75, ['SWE', 'NOR', 'ISL', 'GER', 'NED']), 'NOR': (0.78, ['SWE', 'DEN', 'ISL', 'FIN', 'GHA']),
    'SWE': (0.78, ['NOR', 'DEN', 'FIN', 'ISL', 'BIH']), 'POL': (0.75, ['CZE', 'SVK', 'POR', 'ESP', 'UKR']),
    'CZE': (0.8, ['SVK', 'POL', 'AUT', 'CRO', 'SRB']), 'CRO': (0.8, ['BIH', 'SRB', 'SVN', 'MKD', 'BRA']),
    'SRB': (0.82, ['MNE', 'BIH', 'MKD', 'BRA', 'GHA']), 'UKR': (0.82, ['BRA', 'GEO', 'POR', 'ARG', 'NGA']),
    'ROU': (0.75, ['POR', 'BRA', 'ESP', 'BUL', 'MDA']), 'HUN': (0.75, ['SRB', 'SVK', 'CRO', 'UKR', 'BIH']),
    'BUL': (0.7, ['BRA', 'POR', 'ESP', 'NED', 'MKD']), 'CYP': (0.45, ['GRE', 'POR', 'ESP', 'BRA', 'ARG']),
    'ISR': (0.8, ['NGA', 'POR', 'BRA', 'SRB', 'GHA']), 'AZE': (0.7, ['BRA', 'GEO', 'UKR', 'POR', 'ESP']),
    'SVK': (0.75, ['CZE', 'HUN', 'SRB', 'NGA', 'CRO']), 'SVN': (0.78, ['CRO', 'BIH', 'SRB', 'AUT', 'BRA']),
    'ARM': (0.72, ['RUS', 'UKR', 'BRA', 'GEO', 'ESP']), 'KAZ': (0.72, ['RUS', 'UKR', 'SRB', 'GEO', 'BRA']),
    'LTU': (0.75, ['LVA', 'POL', 'UKR', 'BRA', 'ESP']), 'ALB': (0.8, ['MKD', 'ITA', 'BRA', 'NGA', 'MNE']),
    'GEO': (0.82, ['UKR', 'BRA', 'ARM', 'AZE', 'NGA']), 'BIH': (0.82, ['CRO', 'SRB', 'MNE', 'SVN', 'MKD']),
    'FIN': (0.8, ['SWE', 'EST', 'NOR', 'ENG', 'NGA']), 'AND': (0.4, ['ESP', 'POR', 'FRA']),
    'LVA': (0.72, ['LTU', 'EST', 'UKR', 'NGA', 'BRA']), 'GIB': (0.4, ['ESP', 'ENG']),
    'LIE': (0.25, ['SUI', 'AUT', 'GER']),
    'CHI': (0.8, ['ARG', 'URU', 'COL', 'PAR', 'VEN']), 'URU': (0.85, ['ARG', 'BRA', 'COL', 'PAR']),
    'PAR': (0.82, ['ARG', 'URU', 'COL', 'BRA']), 'BOL': (0.78, ['ARG', 'BRA', 'COL', 'PAR', 'URU']),
    'PER': (0.8, ['ARG', 'URU', 'COL', 'VEN']), 'ECU': (0.8, ['ARG', 'COL', 'URU', 'VEN']),
    'COL': (0.85, ['ARG', 'URU', 'VEN', 'PAR']), 'VEN': (0.85, ['COL', 'ARG', 'URU', 'BRA']),
}


def stadiums():
    out = {}
    for line in EXTRA.strip().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split('|')
        if len(parts) > 7 and parts[7].strip():
            out[parts[0]] = parts[7].strip()
    return out
