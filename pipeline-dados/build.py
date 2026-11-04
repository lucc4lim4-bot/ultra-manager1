import sys, json, random, math, datetime, re, os
from collections import defaultdict, Counter
from common import *
from loaders import *
from nations import NATIONS, nat_code, WC2026_GROUPS
from structures import ULTRA, ULTRA_SWAP, NORMAL, UCL_FILL, UEL_FILL, LIBER_FILL, SULA_FILL, OFC_FILL
from extras import STADIUMS, TEAM_LEVEL
from women import WOMEN
import zlib

ERA_REF = {2016: datetime.date(2016, 7, 1), 2021: datetime.date(2021, 7, 1), 2026: datetime.date(2026, 7, 1)}
FT_LEAGUE_CTRY = {13: 'ENG', 14: 'ENG', 53: 'ESP', 19: 'GER', 31: 'ITA', 16: 'FRA', 308: 'POR', 10: 'NED'}
FIFPLAY_CLUB_FIX = {'Nacional': 'Club Nacional de Football'}
KDIR = '/home/claude/pipeline/knowledge'
OUT = '/home/claude/game/data'

BRAZIL_KEYS = {k for k, t in TEAMS_BY_KEY.items() if t['country'] == 'BRA'}

# ---------------------------------------------------------------- knowledge files
def parse_knowledge_file(path):
    teams = defaultdict(list)
    cur = None
    for line in open(path, encoding='utf-8'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if line.startswith('@'):
            cur = line[1:].strip()
            continue
        parts = line.split('|')
        pos, name, age, ovr = parts[0], parts[1], int(parts[2]), int(parts[3])
        nat = parts[4] if len(parts) > 4 and parts[4] else 'BRA'
        teams[cur].append(dict(pos=pos, name=name, age=age, ovr=ovr, nat=nat))
    return teams

def knowledge_for(era):
    out = {}
    out.update(parse_knowledge_file(f'{KDIR}/brazil_{era}.txt'))
    sp = parse_knowledge_file(f'{KDIR}/specials.txt')
    for k, v in sp.items():
        e, key = k.split(':')
        if int(e) == era:
            out[key] = v
    return out

# ---------------------------------------------------------------- attribute estimation
POS_PROFILE = {  # weights relative to ovr for pac, sho, pas, dri, def, phy
    'GK': (0, 0, 0, 0, 0, 0),
    'CB': (-12, -25, -12, -14, 2, 0), 'RB': (2, -18, -6, -6, -4, -6), 'LB': (2, -18, -6, -6, -4, -6),
    'CDM': (-10, -14, -2, -6, 0, 0), 'CM': (-6, -6, 1, -2, -10, -6), 'CAM': (-2, -2, 1, 2, -30, -14),
    'RM': (4, -6, -2, 0, -28, -12), 'LM': (4, -6, -2, 0, -28, -12), 'RW': (6, -4, -4, 2, -34, -14),
    'LW': (6, -4, -4, 2, -34, -14), 'ST': (2, 2, -10, -3, -40, -4),
}

def est_attrs(ovr, pos, rnd):
    if pos == 'GK':
        return [clamp(ovr + rnd.randint(-3, 3), 30, 99) for _ in range(4)] + [clamp(ovr - 25 + rnd.randint(-8, 8), 25, 80),
                                                                              clamp(ovr + rnd.randint(-3, 3), 30, 99)]
    prof = POS_PROFILE.get(pos, (0,) * 6)
    return [clamp(ovr + d + rnd.randint(-5, 5), 20, 99) for d in prof]

def est_pot(ovr, age, rnd):
    if age <= 18:
        g = rnd.randint(8, 22)
    elif age <= 20:
        g = rnd.randint(5, 16)
    elif age <= 22:
        g = rnd.randint(3, 10)
    elif age <= 24:
        g = rnd.randint(1, 6)
    elif age <= 27:
        g = rnd.randint(0, 3)
    else:
        g = 0
    return min(95, ovr + g)

# ---------------------------------------------------------------- 2026 merge
def merge_2026(ref):
    rnd = random.Random(2026)
    base = load_fc26(ref)
    fp = load_fifplay27()
    ft = load_futtactical()
    # FIFPlay overlay
    added = 0
    skipped_w = 0
    for sid, q in fp.items():
        club = FIFPLAY_CLUB_FIX.get(q['club'], q['club'])
        if sid in base:
            p = base[sid]
            old = p['ovr']
            if isinstance(club, str) and p['club'] and norm_key(club) != norm_key(p['club']):
                k_new = match_team(club, None)
                k_old = match_team(p['club'], p.get('ctry'))
                if not (k_new and k_old and k_new == k_old):
                    p['club'] = club
                    p['ctry'] = None
            elif isinstance(club, str) and not p['club']:
                p['club'] = club
            if q.get('name'):
                p['altname'] = p['name']
                p['name'] = q['name']
                p['short'] = lineup_name(q['name'])
            p['ovr'] = q['ovr']
            if q['pot']:
                p['pot'] = max(q['pot'], q['ovr'])
            else:
                p['pot'] = max(p['pot'] + (q['ovr'] - old) // 2, q['ovr'])
            if q['a']:
                p['a'] = q['a']
            if q['pos']:
                p['pos'] = q['pos']
        else:
            if q['name'] in WOMEN:  # men's football only: the snapshot mixes in the women's leagues
                skipped_w += 1
                continue
            key = match_team(club, None) if isinstance(club, str) else None
            h = q['h'] or 0
            if key and h >= 174:
                age = 22
                if q['pot']:
                    age = clamp(int(round(30 - (q['pot'] - q['ovr']) * 0.9)), 17, 33)
                name = q['name']
                base[-sid] = dict(src='fp27', sid=-sid, name=name, short=lineup_name(name), longname=name, club=club,
                                  ctry=None, nat=q['nat'], pos=q['pos'], age=age, ovr=q['ovr'],
                                  pot=q['pot'] or est_pot(q['ovr'], age, rnd), foot=q['foot'], h=h,
                                  a=q['a'] or est_attrs(q['ovr'], q['pos'][0], rnd), num=None, contract=None, loan=None,
                                  age_est=True)
                added += 1
    # FutTactical overlay (FC27 rosters with summer-2026 transfers)
    idx_long = defaultdict(list)
    idx_name = defaultdict(list)
    for sid, p in base.items():
        idx_long[norm(p.get('longname') or p['name'])].append(sid)
        idx_name[norm(p['name'])].append(sid)
        if p.get('altname'):
            idx_name[norm(p['altname'])].append(sid)
    ft_keys = set()
    newid = -10_000_000
    matched = 0
    for r in ft:
        ctry = FT_LEAGUE_CTRY.get(r['league'])
        if r['club']:
            k = match_team(r['club'], ctry)
            if k:
                ft_keys.add(k)
        if r['longname'] in WOMEN or r['name'] in WOMEN:
            skipped_w += 1
            continue
        cands = idx_long.get(norm(r['longname'])) or idx_name.get(norm(r['name'])) or []
        if len(cands) > 1:
            c2 = [c for c in cands if base[c]['nat'] == r['nat']]
            cands = c2 or cands
        if cands:
            p = base[cands[0]]
            matched += 1
        else:
            newid -= 1
            p = dict(src='ft27', sid=newid, name=r['name'], short=r['short'], longname=r['longname'], nat=r['nat'],
                     foot='R', h=180, a=est_attrs(r['ovr'], r['pos'][0], rnd), num=None, loan=None)
            base[newid] = p
        p['club'] = r['club']
        p['ctry'] = ctry
        p['ovr'] = r['ovr']
        p['pot'] = max(r['pot'], r['ovr'])
        if r['age']:
            p['age'] = r['age']
            p['age_est'] = False
        elif not p.get('age') or p.get('age_est'):  # FutTactical has no age for some players: estimate, never 0
            p['age'] = clamp(int(round(30 - (p['pot'] - p['ovr']) * 0.9)), 17, 33)
            p['age_est'] = True
        p['contract'] = r['contract']
        p['pos'] = r['pos']
        p['ft'] = True
        if r['prev']:
            p['loan'] = None
    # players at FutTactical-covered clubs that FutTactical doesn't list -> free agents
    freed = 0
    for p in base.values():
        if p.get('ft'):
            continue
        k = match_team(p['club'], p.get('ctry'))
        if k in ft_keys:
            p['club'] = None
            freed += 1
    # real ages where the sources give none: FIFA 22 birth dates (same EA ids, or name + nationality)
    f22 = load_fifa22(ref)
    f22_names = {}
    for q in f22.values():
        f22_names.setdefault((norm(q['longname']), q['nat']), q)
        f22_names.setdefault((norm(q['name']), q['nat']), q)
    aged = 0
    for p in base.values():
        if not p.get('age_est'):
            continue
        q = f22.get(abs(p['sid'])) if p.get('src') == 'fp27' else None
        q = q or f22_names.get((norm(p.get('longname') or p['name']), p['nat'])) or f22_names.get((norm(p['name']), p['nat']))
        if q and q['age']:
            p['age'] = q['age']
            p['age_est'] = False
            aged += 1
    print(f'  2026 merge: fifplay new={added}, futtactical matched={matched}, freed={freed}, women left out={skipped_w}, '
          f'ages from FIFA 22={aged}, total={len(base)}')
    return list(base.values())

# ---------------------------------------------------------------- structures helpers
def era_structure(era):
    swap = ULTRA_SWAP.get(era, {})
    ultra_div = [[swap.get(k, k) for k in d] for d in ULTRA['div']]
    ultra_bank = [swap.get(k, k) for k in ULTRA['bank']]
    normal = NORMAL[era]
    keys = []
    for d in ultra_div:
        keys += d
    keys += ultra_bank
    for lg in normal:
        keys += lg['teams'] + lg['bank']
    keys += UCL_FILL + UEL_FILL + LIBER_FILL + SULA_FILL + OFC_FILL
    core = list(dict.fromkeys(keys))
    return ultra_div, ultra_bank, normal, core

# ---------------------------------------------------------------- name pools
def build_name_pools(all_player_lists):
    firsts = defaultdict(Counter)
    lasts = defaultdict(Counter)
    monos = defaultdict(Counter)
    for plist in all_player_lists:
        for p in plist:
            nat = p.get('nat')
            if not nat:
                continue
            nm = (p.get('name') or '').strip()
            toks = nm.split()
            if len(toks) == 1:
                if not re.search(r'\d|\.', nm):
                    monos[nat][nm] += 1
                continue
            if len(toks) >= 2:
                f = toks[0]
                l = toks[-1]
                if (p.get('ovr') or 0) >= 76:
                    l = ''
                if len(f) > 1 and not f.endswith('.'):
                    firsts[nat][f] += 1
                if len(l) > 1 and l not in ('Jr.', 'Jr', 'Júnior', 'Junior', 'II', 'Neto', 'Filho'):
                    lasts[nat][l] += 1
    pools = {}
    for nat in set(list(firsts) + list(lasts)):
        f = [n for n, _ in firsts[nat].most_common(70)]
        l = [n for n, _ in lasts[nat].most_common(110)]
        m = [n for n, _ in monos[nat].most_common(50)] if nat in ('BRA', 'POR', 'ANG', 'ESP') else []
        if len(f) >= 4 and len(l) >= 6:
            pools[nat] = dict(f=f, l=l, m=m)
    return pools

def gen_name(nat, pools, rnd, used):
    pool = pools.get(nat)
    if not pool:
        conf = NATIONS.get(nat, ('', 'UEFA'))[1]
        fallback = {'CONMEBOL': 'ARG', 'CONCACAF': 'MEX', 'CAF': 'SEN', 'AFC': 'KSA', 'OFC': 'AUS', 'UEFA': 'ENG'}
        pool = pools.get(fallback.get(conf, 'ENG')) or pools['ENG']
    for _ in range(30):
        if pool['m'] and rnd.random() < (0.28 if nat == 'BRA' else 0.06):
            n = rnd.choice(pool['m'])
        else:
            n = rnd.choice(pool['f']) + ' ' + rnd.choice(pool['l'])
        if n not in used:
            used.add(n)
            return n
    return n

# ---------------------------------------------------------------- squad generation
TEMPLATE = ['GK', 'GK', 'GK', 'RB', 'RB', 'CB', 'CB', 'CB', 'CB', 'LB', 'LB', 'CDM', 'CDM', 'CM', 'CM', 'CM',
            'CAM', 'RW', 'RM', 'LW', 'LM', 'ST', 'ST', 'ST', 'CAM']
POS_GROUP = {'GK': 'GK', 'RB': 'DEF', 'LB': 'DEF', 'CB': 'DEF', 'CDM': 'MID', 'CM': 'MID', 'CAM': 'MID',
             'RM': 'MID', 'LM': 'MID', 'RW': 'ATT', 'LW': 'ATT', 'ST': 'ATT'}
NEED = {'GK': 3, 'DEF': 8, 'MID': 8, 'ATT': 5}

def make_player(rnd, pools, used, team, nat, pos, ovr, age):
    name = gen_name(nat, pools, rnd, used)
    return dict(src='gen', sid=None, name=name, short=lineup_name(name), longname=name, club=None, team=team,
                nat=nat, pos=[pos], age=age, ovr=int(clamp(ovr, 35, 92)), pot=est_pot(int(ovr), age, rnd),
                foot='L' if (pos in ('LB', 'LM', 'LW') and rnd.random() < 0.7) or rnd.random() < 0.15 else 'R',
                h=rnd.randint(170, 192) if pos != 'GK' else rnd.randint(183, 198),
                a=est_attrs(int(ovr), pos, rnd), num=None, contract=None, loan=None)

def fill_team(team_key, plist, level, nat_mix, rnd, pools, used, min_size=23, gen_youth=True):
    """plist: existing players of team. Adds generated players to reach min_size with sensible positions."""
    groups = Counter(POS_GROUP.get(p['pos'][0], 'MID') for p in plist)
    out = []
    size = len(plist)
    if size:
        ovrs = sorted((p['ovr'] for p in plist), reverse=True)
        top = sum(ovrs[:11]) / min(11, len(ovrs))
        lvl = level or top
    else:
        lvl = level or 62
    def pick_nat():
        r = rnd.random()
        acc = 0
        for nat, w in nat_mix:
            acc += w
            if r <= acc:
                return nat
        return nat_mix[0][0]
    # ensure group minima first
    order = []
    for g, n in NEED.items():
        for _ in range(max(0, n - groups.get(g, 0))):
            order.append(g)
    while size + len(order) < min_size:
        order.append(rnd.choice(['DEF', 'MID', 'ATT', 'MID', 'DEF']))
    g2pos = {'GK': ['GK'], 'DEF': ['CB', 'CB', 'RB', 'LB'], 'MID': ['CM', 'CDM', 'CAM', 'RM', 'LM'],
             'ATT': ['ST', 'ST', 'RW', 'LW']}
    if size == 0:
        tmpl = ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST',
                'GK', 'CB', 'RB', 'LB', 'CM', 'CDM', 'RM', 'LM', 'ST', 'CAM', 'GK', 'CB', 'ST']
        for i, pos in enumerate(tmpl[:max(min_size, 22)]):
            if i < 11:
                age = rnd.randint(22, 31); ovr = lvl + rnd.uniform(-2.5, 2.0)
            elif i < 18:
                age = rnd.randint(20, 33); ovr = lvl - rnd.uniform(2, 6)
            else:
                age = rnd.randint(17, 22); ovr = lvl - rnd.uniform(7, 12) + (age - 17) * 0.8
            out.append(make_player(rnd, pools, used, team_key, pick_nat(), pos, ovr, age))
        return out
    starters_missing = max(0, 11 - size)
    for i, g in enumerate(order):
        pos = rnd.choice(g2pos[g])
        if i < starters_missing:
            age = rnd.randint(22, 31)
            ovr = lvl + rnd.uniform(-2.5, 1.5)
        elif not size and i < 18:
            age = rnd.randint(20, 32)
            ovr = lvl - rnd.uniform(3, 7)
        else:
            age = rnd.randint(17, 21) if gen_youth else rnd.randint(19, 30)
            ovr = lvl - rnd.uniform(7, 13) + (age - 17) * 0.8
        out.append(make_player(rnd, pools, used, team_key, pick_nat(), pos, ovr, age))
    return out

# ---------------------------------------------------------------- main
def build(era):
    rnd = random.Random(era * 7 + 1)
    ref = ERA_REF[era]
    ultra_div, ultra_bank, normal, core = era_structure(era)
    core_set = set(core)
    print(f'== era {era}: core teams {len(core)}')
    if era == 2026:
        players = merge_2026(ref)
    elif era == 2021:
        players = list(load_fifa22(ref).values())
    else:
        players = list(load_fifa17(ref).values())
    # name pools from all eras
    if not hasattr(build, 'pools'):
        others = [list(load_fifa22(ref).values()), list(load_fifa17(ref).values()), list(load_fc26(ref).values())]
        kn = []
        for e in (2016, 2021, 2026):
            for k, lst in knowledge_for(e).items():
                kn += lst
        build.pools = build_name_pools(others + [kn])
    pools = build.pools
    used_names = set(p['name'] for p in players)
    # assign team keys
    for p in players:
        if p.get('team'):
            continue
        k = match_team(p['club'], p.get('ctry')) if p.get('club') else None
        p['team'] = k if k else (('x:' + p['club']) if p.get('club') else None)
    # knowledge squads replace dataset squads for those keys (Brazil + specials)
    kn = knowledge_for(era)
    kn_keys = set(kn)
    for p in players:
        if p['team'] in kn_keys or (p['team'] in BRAZIL_KEYS):
            p['team'] = None if p['team'] in BRAZIL_KEYS else p['team']
    players = [p for p in players if not (p['team'] in BRAZIL_KEYS)]
    # EA datasets only carry Brazilian clubs with invented player names: drop those clubs entirely,
    # the Brazilian squads come from the knowledge files.
    br_words = ['flamengo', 'palmeiras', 'corinthians', 'sao paulo', 'fluminense', 'gremio', 'internacional', 'atletico mineiro',
                'botafogo', 'vasco', 'santos', 'cruzeiro', 'bahia', 'fortaleza', 'vitoria', 'bragantino', 'paranaense', 'ceara',
                'juventude', 'goias', 'goianiense', 'cuiaba', 'chapecoense', 'coritiba', 'sport club do recife', 'figueirense',
                'ponte preta', 'joinville', 'criciuma', 'santa cruz', 'avai', 'mirassol', 'america mineiro', 'minas gerais', 'remo', 'sport recife']
    xnat = defaultdict(Counter)
    for p in players:
        if p['team'] and str(p['team']).startswith('x:'):
            xnat[p['team']][p['nat']] += 1
    def br_club(key, ctry):
        if not key or not str(key).startswith('x:'):
            return False
        if ctry == 'BRA':
            return True
        c = xnat.get(key)
        if not c or c.most_common(1)[0][0] != 'BRA':
            return False
        n = norm(key[2:])
        return any(w in n for w in br_words)
    before = len(players)
    drop_keys = {p['team'] for p in players if br_club(p['team'], p.get('ctry'))}
    players = [p for p in players if p['team'] not in drop_keys]
    print(f'  dropped {before - len(players)} players of {len(drop_keys)} Brazilian dataset clubs (invented names)')
    seen_kn = set()
    for key, lst in kn.items():
        if key not in TEAMS_BY_KEY:
            print('  ! unknown knowledge key', key)
            continue
        names_in_team = set()
        for e in lst:
            nk = norm(e['name'])
            if nk in names_in_team or nk in seen_kn:
                continue
            names_in_team.add(nk)
            seen_kn.add(nk)
            pos = POS_MAP.get(e['pos'], e['pos'])
            p = dict(src='kn', sid=None, name=e['name'], short=lineup_name(e['name']), longname=e['name'], club=None,
                     team=key, nat=e['nat'], pos=[pos], age=e['age'], ovr=e['ovr'], pot=est_pot(e['ovr'], e['age'], rnd),
                     foot='R', h=rnd.randint(172, 190) if pos != 'GK' else rnd.randint(184, 196),
                     a=est_attrs(e['ovr'], pos, rnd), num=None, contract=None, loan=None)
            if pos in ('LB', 'LM', 'LW') and rnd.random() < 0.7:
                p['foot'] = 'L'
            players.append(p)
            used_names.add(e['name'])
    # group by team
    by_team = defaultdict(list)
    for p in players:
        if p['team']:
            by_team[p['team']].append(p)
    # fill core teams
    gen_count = 0
    for key in core:
        t = TEAMS_BY_KEY[key]
        lst = by_team.get(key, [])
        lvl = TEAM_LEVEL.get(era, {}).get(key)
        if len(lst) < 23:
            ctry = t['country']
            nat_mix = [(ctry if ctry in NATIONS else 'ENG', 0.8)]
            conf = NATIONS.get(ctry, ('', 'UEFA'))[1]
            neighbours = {'CONMEBOL': ['ARG', 'URU', 'COL', 'PAR', 'BRA'], 'UEFA': ['FRA', 'ESP', 'POR', 'NED', 'BEL'],
                          'CAF': ['NGA', 'GHA', 'CIV', 'SEN', 'CMR'], 'AFC': ['BRA', 'COL', 'POR'],
                          'CONCACAF': ['USA', 'MEX', 'ARG', 'COL']}.get(conf, ['ENG'])
            nat_mix += [(n, 0.2 / len(neighbours)) for n in neighbours]
            if not lst and lvl is None:
                lvl = 64
            add = fill_team(key, lst, lvl, nat_mix, rnd, pools, used_names, min_size=24 if not lst else 23)
            gen_count += len(add)
            lst = lst + add
            by_team[key] = lst
        # trim > 36
        if len(lst) > 36:
            lst.sort(key=lambda p: (p['ovr'] + (5 if p['age'] <= 21 else 0)), reverse=True)
            for p in lst[36:]:
                p['team'] = None
            by_team[key] = lst[:36]
    print(f'  generated {gen_count} filler players')
    # external pool: players not in core teams
    core_players = [p for k in core for p in by_team[k]]
    ext = [p for p in players if p['team'] not in core_set]
    thr = 64 if era != 2016 else 60
    keep = set()
    by_nat = defaultdict(list)
    for p in ext:
        by_nat[p['nat']].append(p)
        if p['ovr'] >= thr or (p['age'] <= 20 and p['pot'] and p['pot'] >= 78):
            keep.add(id(p))
    for nat, lst in by_nat.items():
        lst.sort(key=lambda p: p['ovr'], reverse=True)
        for p in lst[:30]:
            keep.add(id(p))
    ext = [p for p in ext if id(p) in keep]
    # also keep core-team national coverage
    all_players = core_players + ext
    print(f'  players: core {len(core_players)}, external {len(ext)}, total {len(all_players)}')
    # ---------------- team records
    team_ids = {}
    teams_out = []
    # colours of the clubs outside the game's leagues stay as they were in the last published file
    prev_cols = {}
    try:
        prev = json.load(open(f'{OUT}/era{era}.json', encoding='utf-8'))
        prev_cols = {t[1]: (t[5], t[6]) for t in prev['teams'] if t[1].startswith('x:')}
    except (OSError, ValueError, KeyError):
        pass
    def add_team(key):
        if key in team_ids:
            return team_ids[key]
        tid = len(teams_out) + 1
        team_ids[key] = tid
        if key.startswith('x:'):
            name = key[2:]
            c1, c2 = prev_cols.get(key) or (hsl_hex(zlib.crc32(name.encode('utf-8')) % 360, 55, 42), '#ffffff')
            teams_out.append([tid, key, name, re.sub(r'[^A-Z]', '', strip_accents(name).upper())[:3] or 'EXT', '',
                              c1, c2, 1, '', 2])
        else:
            t = TEAMS_BY_KEY[key]
            teams_out.append([tid, key, t['name'], t['short'], t['country'], t['c1'], t['c2'], 0,
                              STADIUMS.get(key, ''), 0])
        return tid
    for key in core:
        add_team(key)
    for p in ext:
        if p['team']:
            add_team(p['team'])
    # external team country = majority nationality of its players
    ext_nat = defaultdict(Counter)
    for p in ext:
        if p['team'] and p['team'].startswith('x:'):
            ext_nat[p['team']][p['nat']] += 1
    for t in teams_out:
        if t[7] == 1:
            c = ext_nat.get(t[1])
            if c:
                t[4] = c.most_common(1)[0][0] or ''
    # ---------------- player records
    out_players = []
    by_team_final = defaultdict(list)
    for p in all_players:
        by_team_final[p['team']].append(p)
    pid = 0
    for tkey, lst in by_team_final.items():
        tid = team_ids.get(tkey, 0) if tkey else 0
        # shirt numbers
        usedn = set()
        lst.sort(key=lambda p: -p['ovr'])
        for p in lst:
            n = p.get('num')
            if n and 1 <= n <= 99 and n not in usedn:
                usedn.add(n)
                p['_num'] = n
            else:
                p['_num'] = None
        pref = {'GK': [1, 12, 13, 31, 25, 30], 'RB': [2, 22, 26, 32], 'LB': [3, 16, 33, 28], 'CB': [4, 5, 6, 15, 24, 34, 35],
                'CDM': [5, 6, 8, 16, 18, 36], 'CM': [8, 6, 14, 18, 20, 21, 27, 38], 'CAM': [10, 8, 20, 21, 23, 39],
                'RM': [7, 17, 19, 22], 'LM': [11, 17, 19, 27], 'RW': [7, 11, 17, 19, 47], 'LW': [11, 7, 17, 19, 77],
                'ST': [9, 19, 29, 39, 99]}
        for p in lst:
            if p['_num']:
                continue
            for n in pref.get(p['pos'][0], []) + list(range(2, 100)):
                if n not in usedn:
                    usedn.add(n)
                    p['_num'] = n
                    break
        for p in lst:
            pid += 1
            p['_id'] = pid
            contract = p.get('contract')
            if not contract or contract <= ref.year:
                contract = ref.year + rnd.choice([1, 1, 2, 2, 3, 3, 4, 5])
            contract = min(contract, ref.year + 6)
            a = p.get('a') or est_attrs(p['ovr'], p['pos'][0], rnd)
            pot = p.get('pot') or est_pot(p['ovr'], p['age'], rnd)
            pot = max(pot, p['ovr'])
            alt = ','.join(p['pos'][1:4])
            out_players.append([pid, p['name'], p.get('short') or lineup_name(p['name']), tid, p['pos'][0], alt,
                                int(p['age']), int(p['ovr']), int(pot), p.get('nat') or '', p.get('foot', 'R'),
                                int(p.get('h') or 180)] + [int(x) for x in a] + [int(p['_num'] or 0), int(contract), 0])
    # loans (only where both clubs exist)
    # (kept simple: no initial loans)
    # ---------------- finances level per team
    team_players = defaultdict(list)
    for r in out_players:
        team_players[r[3]].append(r[7])
    big_leagues = {'ENG': 5, 'ESP': 4, 'GER': 4, 'ITA': 4, 'FRA': 3, 'KSA': 4, 'POR': 3, 'NED': 3, 'TUR': 3, 'USA': 3,
                   'BRA': 3, 'MEX': 3, 'ARG': 2, 'SCO': 2, 'BEL': 2, 'RUS': 3, 'GRE': 2, 'UKR': 2, 'EGY': 2, 'RSA': 2}
    for t in teams_out:
        o = sorted(team_players.get(t[0], []), reverse=True)[:16]
        avg = sum(o) / len(o) if o else 60
        base_lvl = big_leagues.get(t[4], 1)
        lvl = base_lvl + (2 if avg >= 82 else 1 if avg >= 77 else 0 if avg >= 70 else -1)
        t[9] = int(clamp(lvl, 1, 6))
    # ---------------- nations
    nat_count = Counter(r[9] for r in out_players)
    nations_out = []
    for code, (name, conf, c1, c2) in NATIONS.items():
        nations_out.append([code, name, conf, c1, c2, nat_count.get(code, 0)])
    # ---------------- structures (ids)
    ids = lambda keys: [team_ids[k] for k in keys]
    struct = dict(
        ultra=dict(div=[ids(d) for d in ultra_div], bank=ids(ultra_bank)),
        normal=[dict(id=lg['id'], name=lg['name'], country=lg['country'], cal=lg['cal'], down=lg['down'],
                     cup=lg['cup'], teams=ids(lg['teams']), bank=ids(lg['bank'])) for lg in normal],
        ucl=ids(UCL_FILL), uel=ids(UEL_FILL), liber=ids(LIBER_FILL), sula=ids(SULA_FILL), ofc=ids(OFC_FILL),
        wc2026=WC2026_GROUPS,
    )
    pools_out = {k: v for k, v in pools.items()}
    data = dict(era=era, ref=str(ref), teams=teams_out, players=out_players, nations=nations_out, struct=struct,
                names=pools_out,
                pcols=['id', 'name', 'short', 'team', 'pos', 'alt', 'age', 'ovr', 'pot', 'nat', 'foot', 'h', 'pac', 'sho',
                       'pas', 'dri', 'def', 'phy', 'num', 'contract', 'loan'],
                tcols=['id', 'key', 'name', 'short', 'country', 'c1', 'c2', 'ext', 'stadium', 'fin'])
    os.makedirs(OUT, exist_ok=True)
    path = f'{OUT}/era{era}.json'
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f'  wrote {path}: {os.path.getsize(path)/1e6:.2f} MB, teams {len(teams_out)}, players {len(out_players)}')
    return data

def hsl_hex(h, s, l):
    import colorsys
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return '#%02x%02x%02x' % (int(r * 255), int(g * 255), int(b * 255))

if __name__ == '__main__':
    eras = [int(x) for x in sys.argv[1:]] or [2026, 2021, 2016]
    for e in eras:
        build(e)
